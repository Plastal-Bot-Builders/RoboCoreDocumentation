"""Emulate 'Update PCB from Schematic' for RoboCore V1, plus net re-assignment of existing copper.

usage: pcb_sync.py <in.kicad_pcb> <netlist.xml> <out.kicad_pcb>
Run on a scratch copy only: pcbnew.SaveBoard rewrites the sibling .kicad_pro.
"""
import pcbnew, sys, collections, xml.etree.ElementTree as ET

SRC, NETLIST, DST, PHASE = sys.argv[1:5]
FPLIB = "/Applications/KiCad.app/Contents/SharedSupport/footprints/"
MM = pcbnew.FromMM; mm = pcbnew.ToMM
b = pcbnew.LoadBoard(SRC)

# parts that go on the bottom side, and where to stage them before placement
BOTTOM = {"U7", "L1", "C22", "C23", "C24", "C25", "C26", "C27", "C28", "C29", "C30", "R34", "R35", "R36", "R37", "R38",
          "Q3", "R41", "R39", "R40", "C33", "C31", "C32", "R33"}

# ---------------------------------------------------------------- netlist
x = ET.parse(NETLIST).getroot()
comps = {}
for c in x.find("components"):
    props = {p.get("name"): p.get("value") for p in c.findall("property")}
    sp = c.find("sheetpath")
    comps[c.get("ref")] = dict(value=c.findtext("value"), footprint=c.findtext("footprint"), datasheet=c.findtext("datasheet") or "",
                               description=c.findtext("description") or "",
                               fields={f.get("name"): (f.text or "") for f in c.findall("fields/field")},
                               dnp="dnp" in props, exbom="exclude_from_bom" in props,
                               path=sp.get("tstamps") + c.findtext("tstamps"), sheetname=sp.get("names"),
                               sheetfile=props.get("Sheetfile", ""))
pad_net = {}
for n in x.find("nets"):
    for nd in n.findall("node"): pad_net[(nd.get("ref"), nd.get("pin"))] = n.get("name")

# ---------------------------------------------------------------- snapshot before changes
import json, os
SNAP = DST + ".oldnets.json"
log = []
if PHASE == "1":
    json.dump({"%s|%s" % (f.GetReference(), p.GetNumber()): p.GetNetname() for f in b.GetFootprints() for p in f.Pads()}, open(SNAP, "w"))
old_pad_net = {tuple(k.split("|", 1)): v for k, v in json.load(open(SNAP)).items()}

def load_fp(libid):
    lib, name = libid.split(":", 1)
    fp = pcbnew.FootprintLoad(FPLIB + lib + ".pretty", name)
    assert fp, libid
    fp.SetFPID(pcbnew.LIB_ID(lib, name))
    return fp

def set_field(fp, name, value):
    for fl in fp.GetFields():          # GetField() returns an unusable proxy in the 10.0 bindings
        if fl.GetName() == name:
            fl.SetText(value); return
    fl = pcbnew.PCB_FIELD(fp, pcbnew.FIELD_T_USER, name)
    fl.SetText(value); fl.SetVisible(False); fp.Add(fl); fl.thisown = 0   # board owns it now

replaced = set(json.load(open(DST + ".replaced.json"))) if PHASE == "2" else set()
stage_x = 185.0; stage_y = 60.0
for ref, c in sorted(comps.items()):
    if PHASE == "2":
        fp = b.FindFootprintByReference(ref)
        set_field(fp, "Datasheet", c["datasheet"]); set_field(fp, "Description", c["description"])
        for k, v in c["fields"].items():
            if k not in ("Footprint", "Datasheet", "Description"): set_field(fp, k, v)
        continue
    fp = b.FindFootprintByReference(ref)
    if fp is not None and str(fp.GetFPID().GetUniStringLibId()) != c["footprint"]:
        new = load_fp(c["footprint"])
        new.SetPosition(fp.GetPosition()); new.SetOrientation(fp.GetOrientation()); new.SetReference(ref)
        b.Delete(fp); b.Add(new); new.thisown = 0; replaced.add(ref)   # Remove() + Python GC corrupts the bindings
        fp = b.FindFootprintByReference(ref)   # proxy from FootprintLoad loses SWIG types after Add
        log.append(f"replaced footprint {ref} -> {c['footprint']}")
    elif fp is None:
        new = load_fp(c["footprint"]); new.SetReference(ref)
        b.Add(new); new.thisown = 0; fp = b.FindFootprintByReference(ref)
        fp.SetPosition(pcbnew.VECTOR2I(MM(stage_x), MM(stage_y)))
        stage_y += 6
        if stage_y > 125: stage_y = 60; stage_x += 12
        if ref in BOTTOM: fp.Flip(fp.GetPosition(), pcbnew.FLIP_DIRECTION_TOP_BOTTOM)
        log.append(f"added {ref} ({c['footprint']}){' on bottom' if ref in BOTTOM else ''}")
    fp.SetReference(ref); fp.SetValue(c["value"])
    fp.SetPath(pcbnew.KIID_PATH(c["path"])); fp.SetSheetname(c["sheetname"]); fp.SetSheetfile(c["sheetfile"])
    fp.SetDNP(c["dnp"]); fp.SetExcludedFromBOM(c["exbom"])

if PHASE == "1":
    for fp in list(b.GetFootprints()):
        if fp.GetReference() not in comps:
            log.append(f"removed {fp.GetReference()}"); b.Delete(fp)
    json.dump(sorted(replaced), open(DST + ".replaced.json", "w"))
    pcbnew.SaveBoard(DST, b); print("\n".join(log)); raise SystemExit(0)

# ---------------------------------------------------------------- pad nets
def net(name):
    n = b.FindNet(name)
    if n is None:
        n = pcbnew.NETINFO_ITEM(b, name); b.Add(n); n.thisown = 0
    return n
for fp in b.GetFootprints():
    for p in fp.Pads():
        k = (fp.GetReference(), p.GetNumber())
        if k in pad_net: p.SetNet(net(pad_net[k]))
        else: p.SetNetCode(0)

# ---------------------------------------------------------------- old-net -> new-net map from pads that kept their identity
m = collections.defaultdict(collections.Counter)
for k, old in old_pad_net.items():
    if k[0] in replaced or k[0] not in comps or not old: continue
    new = pad_net.get(k)
    if new: m[old][new] += 1
rename = {o: next(iter(c)) for o, c in m.items() if len(c) == 1}
split = {o: dict(c) for o, c in m.items() if len(c) > 1}

# ---------------------------------------------------------------- copper clusters
tracks = list(b.GetTracks())
pads = [p for f in b.GetFootprints() for p in f.Pads()]
G = 1.0
grid = collections.defaultdict(list)
def cells(bb):
    for i in range(int(mm(bb.GetLeft()) // G), int(mm(bb.GetRight()) // G) + 1):
        for j in range(int(mm(bb.GetTop()) // G), int(mm(bb.GetBottom()) // G) + 1):
            yield (i, j)
items = tracks + pads
for idx, it in enumerate(items):
    for c in cells(it.GetBoundingBox()): grid[c].append(idx)
parent = list(range(len(items)))
def find(i):
    while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
    return i
def union(a, c): parent[find(a)] = find(c)
def touch(it, pt, layer):
    if isinstance(it, pcbnew.PAD):
        return it.IsOnLayer(layer) and it.HitTest(pt)
    if it.Type() == pcbnew.PCB_VIA_T:
        return it.HitTest(pt)
    return it.GetLayer() == layer and it.HitTest(pt, 0)
for idx, t in enumerate(tracks):
    if t.Type() == pcbnew.PCB_VIA_T:
        pts = [(t.GetPosition(), l) for l in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)]
    else:
        pts = [(t.GetStart(), t.GetLayer()), (t.GetEnd(), t.GetLayer())]
    for pt, layer in pts:
        c = (int(mm(pt.x) // G), int(mm(pt.y) // G))
        for j in set(grid[c]):
            if j != idx and touch(items[j], pt, layer): union(idx, j)
clusters = collections.defaultdict(list)
for idx in range(len(items)): clusters[find(idx)].append(items[idx])

report = []
deleted = 0
for root, members in clusters.items():
    trk = [i for i in members if not isinstance(i, pcbnew.PAD)]
    if not trk: continue
    pnets = {p.GetNetname() for p in members if isinstance(p, pcbnew.PAD) and p.GetNetCode() > 0}
    oldn = {t.GetNetname() for t in trk}
    if len(pnets) == 1:
        target = next(iter(pnets))
        for t in trk: t.SetNet(net(target))
    elif len(pnets) == 0:
        o = next(iter(oldn))
        if o in rename:
            for t in trk: t.SetNet(net(rename[o]))
        elif o in split or b.FindNet(o) is None or not any(p.GetNetname() == o for p in pads):
            report.append(("orphan", sorted(oldn), len(trk), [(round(mm(t.GetPosition().x), 2), round(mm(t.GetPosition().y), 2)) for t in trk][:3]))
    else:
        touched = sorted({(p.GetParentFootprint().GetReference(), p.GetNumber(), p.GetNetname()) for p in members if isinstance(p, pcbnew.PAD) and p.GetNetCode() > 0})
        report.append(("CONFLICT", sorted(oldn), len(trk), touched))

# zones
for z in b.Zones():
    o = z.GetNetname()
    if o in rename and rename[o] != o: log.append(f"zone '{z.GetZoneName()}' {o} -> {rename[o]}"); z.SetNet(net(rename[o]))
    elif o in split: report.append(("zone-split", o, z.GetZoneName(), split[o]))

pcbnew.SaveBoard(DST, b)
print("\n".join(log))
print("\nrenamed nets:", {k: v for k, v in rename.items() if k != v})
print("split nets:", split)
for r in report: print(r)
