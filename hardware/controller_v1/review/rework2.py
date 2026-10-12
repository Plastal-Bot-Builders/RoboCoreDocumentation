"""Stage 2: resolve copper that now bridges different nets, clear old fan-outs at J1/U2, add GND vias.
usage: rework2.py in.kicad_pcb out.kicad_pcb
"""
import pcbnew, sys, math, collections
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
P = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))
F, B = pcbnew.F_Cu, pcbnew.B_Cu
LAYERS = (F, pcbnew.In1_Cu, pcbnew.In2_Cu, B)
keep = []
deleted = collections.Counter()

def fp(ref): return b.FindFootprintByReference(ref)
def kill(t, why):
    deleted[why] += 1; b.Delete(t)

# ---------------------------------------------------------------- 1. clear old fan-outs around replaced footprints
def region_of(ref, margin):
    f = fp(ref); lay = pcbnew.B_CrtYd if f.IsFlipped() else pcbnew.F_CrtYd
    bb = f.GetCourtyard(lay).BBox(); bb.Inflate(MM(margin)); return bb
zones_to_clear = [region_of("U2", 0.8), region_of("J1", 0.4)]
oldj1 = pcbnew.BOX2I(P(113.5, 110.4), pcbnew.VECTOR2L(MM(11.5), MM(3.4)))   # old J1 B-row through-hole field
zones_to_clear.append(oldj1)
for t in list(b.GetTracks()):
    pts = [t.GetPosition()] if t.Type() == pcbnew.PCB_VIA_T else [t.GetStart(), t.GetEnd()]
    if any(r.Contains(p) for r in zones_to_clear for p in pts):
        kill(t, "fan-out near replaced J1/U2")

# ---------------------------------------------------------------- 2. clusters of copper touching pads of different nets
tracks = list(b.GetTracks()); pads = [p for f in b.GetFootprints() for p in f.Pads()]
items = tracks + pads
G = 1.0; grid = collections.defaultdict(list)
for i, it in enumerate(items):
    bb = it.GetBoundingBox()
    for gx in range(int(mm(bb.GetLeft()) // G), int(mm(bb.GetRight()) // G) + 1):
        for gy in range(int(mm(bb.GetTop()) // G), int(mm(bb.GetBottom()) // G) + 1):
            grid[(gx, gy)].append(i)
def touch(it, pt, layer):
    if isinstance(it, pcbnew.PAD): return it.IsOnLayer(layer) and it.HitTest(pt)
    if it.Type() == pcbnew.PCB_VIA_T: return it.HitTest(pt)
    return it.GetLayer() == layer and it.HitTest(pt, 0)
adj = collections.defaultdict(set)
for i, t in enumerate(tracks):
    pts = [(t.GetPosition(), l) for l in LAYERS] if t.Type() == pcbnew.PCB_VIA_T else [(t.GetStart(), t.GetLayer()), (t.GetEnd(), t.GetLayer())]
    for pt, layer in pts:
        for j in set(grid[(int(mm(pt.x) // G), int(mm(pt.y) // G))]):
            if j != i and touch(items[j], pt, layer): adj[i].add(j); adj[j].add(i)
seen = set(); fixed = 0
for start in range(len(tracks)):
    if start in seen: continue
    comp = []; stack = [start]; seen.add(start)
    while stack:
        u = stack.pop(); comp.append(u)
        for v in adj[u]:
            if v not in seen and v < len(tracks): seen.add(v); stack.append(v)
            if v >= len(tracks) and v not in comp: comp.append(v)
    comp = list(dict.fromkeys(comp))
    padn = [i for i in comp if i >= len(tracks) and items[i].GetNetCode() > 0]
    nets = collections.defaultdict(list)
    for i in padn: nets[items[i].GetNetname()].append(i)
    if len(nets) < 2: continue
    # keep shortest paths (through tracks only) joining pads of the same net
    mark = {}
    def path(a, z):
        prev = {a: None}; q = collections.deque([a])
        while q:
            u = q.popleft()
            if u == z: break
            for v in adj[u]:
                if v in prev: continue
                if v >= len(tracks) and v != z: continue          # never route through another pad
                prev[v] = u; q.append(v)
        if z not in prev: return []
        out = []; u = z
        while u is not None: out.append(u); u = prev[u]
        return out
    for n, plist in nets.items():
        for a, z in zip(plist, plist[1:]):
            for u in path(a, z):
                if u < len(tracks): mark.setdefault(u, set()).add(n)
    tnet = {}
    for u in comp:
        if u >= len(tracks): continue
        ns = mark.get(u, set())
        if len(ns) == 1: tnet[u] = next(iter(ns))
    for u in comp:
        if u >= len(tracks): continue
        if u in tnet: items[u].SetNet(b.FindNet(tnet[u]))
        else: kill(items[u], "stub bridging different nets")
    fixed += 1
print("conflict clusters resolved:", fixed)

# ---------------------------------------------------------------- 3. GND vias for pads that will not reach the pour
def free_via(netname, x, y, d=0.6, drill=0.3, search=1.2):
    def ok(px, py):
        c = P(px, py); r = MM(d / 2)
        for it in list(b.GetTracks()) + [p for f in b.GetFootprints() for p in f.Pads()]:
            if it.GetNetname() == netname: continue
            bb = it.GetBoundingBox()
            if bb.GetLeft() - r - MM(1) > c.x or bb.GetRight() + r + MM(1) < c.x or bb.GetTop() - r - MM(1) > c.y or bb.GetBottom() + r + MM(1) < c.y: continue
            for layer in LAYERS:
                if it.IsOnLayer(layer) and it.GetEffectiveShape(layer).Collide(pcbnew.SHAPE_CIRCLE(c, r), MM(0.2)): return False
            if isinstance(it, pcbnew.PAD) and it.HasHole() and it.GetEffectiveHoleShape().Collide(pcbnew.SHAPE_CIRCLE(c, r), MM(0.3)): return False
        return True
    for rr in [0] + [k * 0.1 for k in range(1, int(search / 0.1) + 1)]:
        for ang in range(0, 360, 30 if rr else 360):
            px, py = x + rr * math.cos(math.radians(ang)), y + rr * math.sin(math.radians(ang))
            if ok(px, py):
                v = pcbnew.PCB_VIA(b); v.SetPosition(P(px, py)); v.SetWidth(F, MM(d)); v.SetDrill(MM(drill)); v.SetLayerPair(F, B)
                b.Add(v); v.SetNet(b.FindNet(netname)); v.SetIsFree(True); keep.append(v); return (round(px, 2), round(py, 2))
    print("  no spot for", netname, "via near", (x, y)); return None
def tie(ref, num, dx=None, dy=None, w=0.4, dist=0.9):
    p = next(p for p in fp(ref).Pads() if p.GetNumber() == num); q = p.GetPosition()
    if dx is None:   # step outward from the footprint centre, beyond this pad
        c = fp(ref).GetPosition(); vx, vy = mm(q.x - c.x), mm(q.y - c.y); n = math.hypot(vx, vy) or 1
        dx, dy = vx / n * dist, vy / n * dist
    layer = B if fp(ref).IsFlipped() else F
    v = free_via(p.GetNetname(), mm(q.x) + dx, mm(q.y) + dy)
    if v:
        t = pcbnew.PCB_TRACK(b); t.SetStart(q); t.SetEnd(P(*v)); t.SetWidth(MM(w)); t.SetLayer(layer); t.SetNet(p.GetNet())
        b.Add(t); keep.append(t)
# USB-C ground pins (both rows share pads A1/B12 and A12/B1)
tie("J1", "A1", -0.1, -1.2); tie("J1", "B1", 0.1, -1.2)
# small boost / divider ground pads that cannot get two thermal spokes
for ref in ("R38", "C23", "R40", "C33"):
    tie(ref, "2")
tie("U5", "9")                                  # MPU-6050 AD0 -> GND (address 0x68)
tie("J1", "A4", 0.0, -1.3); tie("J1", "A9", 0.0, -1.3)   # VBUS pins -> In1 VBUS plane
# CP2102N pin 2 (GND) -> exposed pad
p2 = next(p for p in fp("U2").Pads() if p.GetNumber() == "2"); ep = next(p for p in fp("U2").Pads() if p.GetNumber() == "25")
t = pcbnew.PCB_TRACK(b); t.SetStart(p2.GetPosition()); t.SetEnd(pcbnew.VECTOR2I(p2.GetPosition().x + (ep.GetPosition().x - p2.GetPosition().x) // 3,
                                                                         p2.GetPosition().y + (ep.GetPosition().y - p2.GetPosition().y) // 2))
t.SetWidth(MM(0.2)); t.SetLayer(F); t.SetNet(p2.GetNet()); b.Add(t); keep.append(t)

pcbnew.SaveBoard(sys.argv[2], b)
print("deleted:", dict(deleted))
