"""V2.1 change on the routed V2 board (2026-11-14): applies the errata fixes from the regenerated schematic without
re-placing or re-routing the rest of the board, so Fred's hand edits stay.

  <KiCad python> tools/eco_v21.py apply    # parts, nets, cuts, motor sockets turned        -> $TMPDIR/eco_v21/stage1
  <KiCad python> tools/eco_v21.py route    # Freerouting for the open connections, old copper fixed -> stage2
  <KiCad python> tools/eco_v21.py finish   # pours, last zone-net links, dead ends           -> stage3 (check its DRC)

E-015: the motor sockets get the XRP-numbered footprint AND are turned 180 degrees. That is SparkFun's arrangement
(pins toward the board edge, tabs inward, pin 1 on the left), and it keeps the nets in the same left-to-right order
as the old routing, so only short links change. Turning alone would not help: the plug always lands on the same
physical contacts. E-003: EN leaves the expansion header (pin 12 not connected). E-004: 1k on IMU INT1, USER and
the buzzer at their header pins, and on the RGB LED's output beside the LED (the long DOUT track becomes the header
side). E-007: R401-R413 1k.
"""
import json, math, os, shutil, subprocess, sys, xml.etree.ElementTree as ET
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import route_pcb  # noqa: E402
import sync_pcb   # noqa: E402

CLI = "/Applications/KiCad.app/Contents/MacOS/kicad-cli"
FPLIB = "/Applications/KiCad.app/Contents/SharedSupport/footprints"
FREEROUTING = os.path.expanduser("~/.kicad-mcp/freerouting.jar")
WORK = os.path.join(os.environ.get("TMPDIR", "/tmp"), "eco_v21")
NAME = "RoboCore_V2"
MM, mm = pcbnew.FromMM, pcbnew.ToMM

SOCKETS = ("J301", "J302")
NEW_PARTS = {   # ref: (x, y, orientation), free spots checked against courtyards and silk
    "R414": (147.58, 94.36, 90),    # IMU_INT1, beside J406.10
    "R415": (154.68, 97.81, 90),    # USER_BTN, beside J406.11
    "R416": (124.98, 95.26, 90),    # BUZZER, beside J405.10
    "R417": (106.48, 70.06, 90),    # RGB_DOUT, beside D201 (the DOUT track to J405.11 becomes RGB_DOUT_HDR)
}
RENAME = {"RGB_DOUT": "RGB_DOUT_HDR"}          # existing copper that moves to the header side of its new resistor
ZONE_NETS = {"GND", "+3V3", "VMOT", "VSYS", "VSYS_SW", "+BATT", "VBUS", "+5V_USB", "BATP_S"}
TRUNK_3V3 = [(108.13, 72.2), (108.13, 69.4), (118.0, 69.4), (118.0, 72.2), (121.23, 72.2)]   # J301: over the pins now
TRUNK_STUB = [(112.5, 69.4), (112.5, 70.4)]                                                    # down into J301.3
CLEAR = 0.15


def stage(n):
    return os.path.join(WORK, f"stage{n}", f"{NAME}.kicad_pcb")


def copy_project(dst):
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(PROJ):
        if f.endswith((".kicad_sch", ".kicad_pro")) or f in ("fp-lib-table", "sym-lib-table"):
            shutil.copy(os.path.join(PROJ, f), dst)
    if os.path.exists(os.path.join(dst, "lib")):
        shutil.rmtree(os.path.join(dst, "lib"))
    shutil.copytree(os.path.join(PROJ, "lib"), os.path.join(dst, "lib"))
    route_pcb.write_netclasses(os.path.join(dst, f"{NAME}.kicad_pro"))


def save(board, n):
    copy_project(os.path.dirname(stage(n)))
    pcbnew.SaveBoard(stage(n), board)
    route_pcb.write_netclasses(os.path.join(os.path.dirname(stage(n)), f"{NAME}.kicad_pro"))
    print("saved", stage(n))


def netlist():
    os.makedirs(WORK, exist_ok=True)
    out = os.path.join(WORK, "net.xml")
    subprocess.run([CLI, "sch", "export", "netlist", "--format", "kicadxml", "-o", out, f"{NAME}.kicad_sch"],
                   cwd=PROJ, check=True, capture_output=True)
    root = ET.parse(out).getroot()
    comps = {}
    for c in root.iter("comp"):
        sp = c.find("sheetpath")
        comps[c.get("ref")] = dict(
            value=c.findtext("value"), footprint=c.findtext("footprint"),
            fields={f.get("name"): (f.text or "") for f in c.iter("field") if f.get("name") in sync_pcb.FIELDS},
            path=(sp.get("tstamps") if sp is not None else "/") + (c.findtext("tstamps") or "").strip())
    pins = {}
    for n in root.iter("net"):
        for node in n.iter("node"):
            pins[(node.get("ref"), node.get("pin"))] = n.get("name")
    return comps, pins


def net_code(board, name):
    if board.FindNet(name) is None:
        board.Add(pcbnew.NETINFO_ITEM(board, name))
    return board.FindNet(name).GetNetCode()


def set_fields(fp, c):
    if fp.GetValue() != c["value"]:
        print(f"  {fp.GetReference()}: value {fp.GetValue()} -> {c['value']}")
        fp.SetValue(c["value"])
    have = {f.GetName(): f.GetText() for f in fp.GetFields()}
    for k, v in c["fields"].items():
        if have.get(k) != v:
            fp.SetField(k, v)
            for f in fp.GetFields():
                if f.GetName() == k:
                    f.SetVisible(False)


def new_footprint(board, ref, c, like):
    lib, name = c["footprint"].split(":")
    fp = pcbnew.FootprintLoad(os.path.join(FPLIB, f"{lib}.pretty"), name)
    fp.SetFPID(pcbnew.LIB_ID(lib, name))
    fp.SetReference(ref)
    fp.SetValue(c["value"])
    fp.SetPath(pcbnew.KIID_PATH(c["path"]))
    fp.SetSheetname(like.GetSheetname())
    fp.SetSheetfile(like.GetSheetfile())
    for mine, theirs in ((fp.Reference(), like.Reference()), (fp.Value(), like.Value())):
        mine.SetVisible(theirs.IsVisible())
        mine.SetLayer(theirs.GetLayer())
    board.Add(fp)
    set_fields(fp, c)
    return fp


def rect(item, grow=0.0):
    bb = item.GetBoundingBox()
    return (mm(bb.GetX()) - grow, mm(bb.GetY()) - grow, mm(bb.GetRight()) + grow, mm(bb.GetBottom()) + grow)


def seg_rect_dist(ax, ay, bx, by, r):
    x0, y0, x1, y1 = r
    def inside(x, y):
        return x0 <= x <= x1 and y0 <= y <= y1
    if inside(ax, ay) or inside(bx, by):
        return 0.0
    edges = [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]
    def cross(p, q, r_, s):
        d = (q[0] - p[0]) * (s[1] - r_[1]) - (q[1] - p[1]) * (s[0] - r_[0])
        if d == 0:
            return False
        t = ((r_[0] - p[0]) * (s[1] - r_[1]) - (r_[1] - p[1]) * (s[0] - r_[0])) / d
        u = ((r_[0] - p[0]) * (q[1] - p[1]) - (r_[1] - p[1]) * (q[0] - p[0])) / d
        return 0 <= t <= 1 and 0 <= u <= 1
    if any(cross((ax, ay), (bx, by), e0, e1) for e0, e1 in edges):
        return 0.0
    d = min(route_pcb.miniroute._seg_dist(cx, cy, ax, ay, bx, by) for cx, cy in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)))
    for px, py in ((ax, ay), (bx, by)):
        dx = max(x0 - px, 0, px - x1)
        dy = max(y0 - py, 0, py - y1)
        d = min(d, math.hypot(dx, dy))
    return d


def clash_with_pads(board, pads):
    """Delete tracks on F.Cu and vias that come closer than the clearance to these pads (unless same net)."""
    gone = set()
    boxes = [(p, rect(p)) for p in pads]
    for t in list(board.GetTracks()):
        for p, r in boxes:
            if p.GetNetCode() and p.GetNetCode() == t.GetNetCode():
                continue
            if t.Type() == pcbnew.PCB_VIA_T:
                c = t.GetPosition()
                d = seg_rect_dist(mm(c.x), mm(c.y), mm(c.x), mm(c.y), r) - mm(t.GetWidth(pcbnew.F_Cu)) / 2
            elif t.GetLayer() == pcbnew.F_Cu:
                s, e = t.GetStart(), t.GetEnd()
                d = seg_rect_dist(mm(s.x), mm(s.y), mm(e.x), mm(e.y), r) - mm(t.GetWidth()) / 2
            else:
                continue
            if d < CLEAR:
                gone.add(t.GetNetname())
                board.Delete(t)
                break
    return gone


def on_pad(pt, layer, pads):
    return [p for p in pads if p.IsOnLayer(layer) and p.HitTest(pt)]


def cut_conflicts(board):
    """Delete tracks/vias touching a pad of another net; returns the nets they belonged to."""
    pads = [p for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() > 0]
    cut = set()
    for t in list(board.GetTracks()):
        if t.Type() == pcbnew.PCB_VIA_T:
            hits = [p for p in pads if p.HitTest(t.GetPosition(), int(t.GetWidth(pcbnew.F_Cu) / 2))]
        else:
            hits = on_pad(t.GetStart(), t.GetLayer(), pads) + on_pad(t.GetEnd(), t.GetLayer(), pads)
        if any(p.GetNetCode() != t.GetNetCode() for p in hits):
            cut.add(t.GetNetname())
            board.Delete(t)
    return cut


def drop_islands(board, nets):
    """Remove copper clusters of these nets that reach no pad (left over after cutting)."""
    doomed = set()
    for name in nets:
        if board.FindNet(name) is None or name in ZONE_NETS:
            continue
        for cl in route_pcb._clusters(board, board.FindNet(name).GetNetCode()):
            if not any(i.Type() == pcbnew.PCB_PAD_T for i in cl):
                doomed |= {i.m_Uuid.AsString() for i in cl}
    for t in list(board.GetTracks()):          # fresh wrappers: deleting through the connectivity's ones crashes
        if t.m_Uuid.AsString() in doomed:
            board.Delete(t)
    return len(doomed)


def add_track(board, pts, net, width, layer=pcbnew.F_Cu):
    code = board.FindNet(net).GetNetCode()
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        t = pcbnew.PCB_TRACK(board)
        t.SetStart(pcbnew.VECTOR2I(MM(x0), MM(y0))); t.SetEnd(pcbnew.VECTOR2I(MM(x1), MM(y1)))
        t.SetWidth(MM(width)); t.SetLayer(layer); t.SetNetCode(code)
        board.Add(t)


def apply():
    copy_project(WORK)
    shutil.copy(os.path.join(PROJ, f"{NAME}.kicad_pcb"), WORK)
    board = pcbnew.LoadBoard(os.path.join(WORK, f"{NAME}.kicad_pcb"))
    comps, pins = netlist()
    fps = {f.GetReference(): f for f in board.GetFootprints()}

    for ref, c in comps.items():                       # footprints, values, fields
        fp = fps.get(ref)
        if fp is None:
            continue
        if c["footprint"] and c["footprint"] != fp.GetFPIDAsString():
            print(f"  {ref}: footprint {fp.GetFPIDAsString()} -> {c['footprint']}")
            fps[ref] = fp = sync_pcb.swap(board, fp, c["footprint"])
        set_fields(fp, c)
    for ref in SOCKETS:                                # E-015: SparkFun's arrangement
        fps[ref].SetOrientationDegrees(180)
    for ref in [r for r in comps if r not in fps and not r.startswith("#")]:
        x, y, rot = NEW_PARTS[ref]
        fps[ref] = new_footprint(board, ref, comps[ref], fps["R413"])
        fps[ref].SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
        fps[ref].SetOrientationDegrees(rot)
        print(f"  {ref} added at ({x}, {y}) rot {rot}")

    for old, new in RENAME.items():                    # copper that becomes the header side
        code = net_code(board, new)
        for t in board.GetTracks():
            if t.GetNetname() == old:
                t.SetNetCode(code)
    touched = set(RENAME.values()) | {p.GetNetname() for r in SOCKETS for p in fps[r].Pads() if p.GetNetCode()}
    for ref, fp in fps.items():                        # every pad's net from the schematic
        for p in fp.Pads():
            want = pins.get((ref, p.GetNumber()))
            if want is None or p.GetNetname() == want:
                continue
            touched.update({p.GetNetname(), want})
            p.SetNetCode(net_code(board, want))
    touched.discard("")
    touched |= cut_conflicts(board)
    touched |= clash_with_pads(board, [p for r in SOCKETS for p in fps[r].Pads()])
    for t in list(board.GetTracks()):                  # J301's old +3V3 trunk and pad stub under the turned socket
        if t.GetNetname() == "+3V3" and t.Type() != pcbnew.PCB_VIA_T and t.GetLayer() == pcbnew.F_Cu:
            s, e = t.GetStart(), t.GetEnd()
            if all(108.0 < mm(p.x) < 121.3 and 72.0 < mm(p.y) < 73.5 for p in (s, e)):
                board.Delete(t)
    add_track(board, TRUNK_3V3, "+3V3", 0.25)
    add_track(board, TRUNK_STUB, "+3V3", 0.25)
    print("nets touched", sorted(touched))
    print("copper islands removed", drop_islands(board, touched))
    json.dump(sorted(touched), open(os.path.join(WORK, "touched.json"), "w"))
    save(board, 1)


def key(t):
    if t.Type() == pcbnew.PCB_VIA_T:
        p = t.GetPosition()
        return ("v", round(mm(p.x), 3), round(mm(p.y), 3), t.GetNetname())
    s, e = t.GetStart(), t.GetEnd()
    a, b = sorted([(round(mm(s.x), 3), round(mm(s.y), 3)), (round(mm(e.x), 3), round(mm(e.y), 3))])
    return ("t", t.GetLayer(), a, b, t.GetNetname())


def route():
    """Freerouting on a copy where all existing copper is fixed and the pour nets' pads have no net."""
    src = stage(1)
    b = pcbnew.LoadBoard(src)
    for z in list(b.Zones()):
        if not z.GetIsRuleArea():
            b.Delete(z)
    for t in b.GetTracks():
        t.SetLocked(True)
    for fp in b.GetFootprints():
        for p in fp.Pads():
            if p.GetNetname() in ZONE_NETS:
                p.SetNetCode(0)
    pre = {key(t) for t in b.GetTracks()}
    dsn, ses = os.path.join(WORK, "v21.dsn"), os.path.join(WORK, "v21.ses")
    print("DSN", pcbnew.ExportSpecctraDSN(b, dsn))
    if "--import-only" not in sys.argv:
        r = subprocess.run(["java", "-Djava.awt.headless=true", "-jar", FREEROUTING, "-de", dsn, "-do", ses, "-mp", "30"],
                           capture_output=True, text=True, timeout=1800)
        print("\n".join(l for l in (r.stdout + r.stderr).splitlines() if "unrouted" in l.lower() or "error" in l.lower())[-2000:])
    print("SES", pcbnew.ImportSpecctraSES(b, ses))
    # Freerouting also "routes" nets it misreads as open (pour links, vias in pads): keep only the nets changed here
    touched = set(json.load(open(os.path.join(WORK, "touched.json")))) - ZONE_NETS
    new = [t for t in b.GetTracks() if key(t) not in pre]
    print("Freerouting also changed (ignored):", sorted({t.GetNetname() for t in new} - touched))
    new = [t for t in new if t.GetNetname() in touched]
    a = pcbnew.LoadBoard(src)
    for t in new:
        code = a.FindNet(t.GetNetname()).GetNetCode()
        if t.Type() == pcbnew.PCB_VIA_T:
            v = pcbnew.PCB_VIA(a); v.SetPosition(t.GetPosition()); v.SetWidth(t.GetWidth(pcbnew.F_Cu)); v.SetDrill(t.GetDrill())
            v.SetNetCode(code); a.Add(v)
        else:
            n = pcbnew.PCB_TRACK(a); n.SetStart(t.GetStart()); n.SetEnd(t.GetEnd()); n.SetWidth(t.GetWidth())
            n.SetLayer(t.GetLayer()); n.SetNetCode(code); a.Add(n)
    print("new copper from Freerouting:", len(new), "items on", sorted({t.GetNetname() for t in new}))
    save(a, 2)


def single(board, name):
    return len(route_pcb._clusters(board, board.FindNet(name).GetNetCode())) == 1


def finish():
    board = pcbnew.LoadBoard(stage(2))
    touched = json.load(open(os.path.join(WORK, "touched.json")))
    open_nets = [n for n in touched if n not in ZONE_NETS and board.FindNet(n) and not single(board, n)]
    for n in open_nets:                                # anything Freerouting left: the grid router
        route_pcb.grid_route(board, n, 0.3 if n.startswith("MOT") else 0.2)
    print("still open:", [n for n in open_nets if not single(board, n)])
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    save(board, 3)


def del_tracks(board, net, layer, segs):
    """Delete the tracks of a net on a layer whose ends match one of these ((x0, y0), (x1, y1)) within 0.02 mm."""
    def near(p, q):
        return abs(mm(p.x) - q[0]) < 0.02 and abs(mm(p.y) - q[1]) < 0.02
    n = 0
    for t in list(board.GetTracks()):
        if t.Type() == pcbnew.PCB_VIA_T or t.GetNetname() != net or board.GetLayerName(t.GetLayer()) != layer:
            continue
        for a, b in segs:
            if (near(t.GetStart(), a) and near(t.GetEnd(), b)) or (near(t.GetStart(), b) and near(t.GetEnd(), a)):
                board.Delete(t); n += 1
                break
    return n


def route_island(board, net, ref, pad, width, margin=6.0):
    """A* from the copper cluster holding ref.pad to the nearest other cluster of the net (pour nets: one island only)."""
    code = board.FindNet(net).GetNetCode()
    cls = route_pcb._clusters(board, code)
    mine = [c for c in cls if any(i.Type() == pcbnew.PCB_PAD_T and i.GetParentFootprint().GetReference() == ref
                                  and i.GetNumber() == pad for i in c)]
    if not mine or len(cls) < 2:
        return True
    orphan = mine[0]
    others = [i for c in cls if c is not orphan for i in c]
    starts = route_pcb._terminals(orphan)
    sx, sy = starts[0][0], starts[0][1]
    goals = sorted(route_pcb._terminals(others), key=lambda g: math.hypot(g[0] - sx, g[1] - sy))[:60]
    win = (sx - margin, sy - margin, sx + margin, sy + margin)
    g = route_pcb.miniroute.Grid(board, code, win, width, 0.2, route_pcb.PL.on_board, step=0.05)
    for it in orphan + others:
        if it.Type() == pcbnew.PCB_PAD_T:
            g.open_pad(it)
    path = g.route([q[:3] for q in starts], [q[:3] for q in goals if win[0] < q[0] < win[2] and win[1] < q[1] < win[3]])
    if not path:
        print(f"  {net} ({ref}.{pad}): no path")
        return False
    sp = min(starts, key=lambda q: math.hypot(q[0] - path[0][0], q[1] - path[0][1]) + (0 if q[2] == path[0][2] else 9))
    ep = min(goals, key=lambda q: math.hypot(q[0] - path[-1][0], q[1] - path[-1][1]) + (0 if q[2] == path[-1][2] else 9))
    route_pcb.miniroute.commit(board, code, path, width, sp[3], ep[3])
    print(f"  {net} ({ref}.{pad}): routed")
    return True


def prune_dead_ends(board, nets):
    """Repeatedly delete track segments of these nets with an end that touches nothing of the same net."""
    gone, changed = 0, True
    while changed:
        changed = False
        for name in nets:
            if name in ZONE_NETS or board.FindNet(name) is None:
                continue
            code = board.FindNet(name).GetNetCode()
            tracks = [t for t in board.GetTracks() if t.GetNetCode() == code]
            pads = [p for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() == code]
            for t in tracks:
                if t.Type() == pcbnew.PCB_VIA_T:
                    continue
                for pt in (t.GetStart(), t.GetEnd()):
                    touch = on_pad(pt, t.GetLayer(), pads) + [o for o in tracks if o.m_Uuid.AsString() != t.m_Uuid.AsString() and (
                        (o.Type() == pcbnew.PCB_VIA_T and o.HitTest(pt)) or
                        (o.Type() != pcbnew.PCB_VIA_T and o.GetLayer() == t.GetLayer() and o.HitTest(pt, 0)))]
                    if not touch:
                        board.Delete(t); gone += 1; changed = True
                        break
                if changed:
                    break
            if changed:
                break
    return gone + route_pcb.drop_dangling(board)


def fixup():
    """Hand links where the routers had no room, then stitching, pruning and pours."""
    board = pcbnew.LoadBoard(stage(3))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    # RGB: R417 left of D201, in line with the original DOUT track (the first spot was boxed in by FID101's keepout)
    r = fps["R417"]
    r.SetPosition(pcbnew.VECTOR2I(MM(102.95), MM(72.51))); r.SetOrientationDegrees(270)     # pad 1 on top
    del_tracks(board, "RGB_DOUT_HDR", "F.Cu", [((103.611, 73.667), (103.611, 72.474))])
    add_track(board, [(102.95, 72.0), (104.235, 71.85)], "RGB_DOUT", 0.2)
    add_track(board, [(102.95, 73.02), (103.611, 73.667)], "RGB_DOUT_HDR", 0.2)
    # IMU INT1: the original In2 diagonal again, ending at R414's via; Freerouting's USER_BTN detour gives way
    del_tracks(board, "USER_BTN", "In2.Cu", [((146.028, 93.817), (144.194, 91.984)), ((150.905, 93.817), (146.028, 93.817)),
                                             ((151.27, 93.451), (150.905, 93.817))])
    add_track(board, [(145.532, 90.782), (148.353, 93.603), (148.353, 94.933)], "IMU_INT1", 0.2, pcbnew.In2_Cu)
    touched = json.load(open(os.path.join(WORK, "touched.json")))
    print("pruned", prune_dead_ends(board, touched))
    route_pcb.grid_route(board, "USER_BTN", 0.2)
    print("USER_BTN joined:", single(board, "USER_BTN"))
    route_island(board, "+3V3", "J302", "3", 0.25)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    route_pcb.stitch_islands(board, [pcbnew.F_Cu, pcbnew.B_Cu])
    print("pruned", prune_dead_ends(board, touched))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    save(board, 4)


def add_via(board, x, y, net, d=0.6, drill=0.3):
    v = pcbnew.PCB_VIA(board)
    v.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y))); v.SetWidth(MM(d)); v.SetDrill(MM(drill))
    v.SetNetCode(board.FindNet(net).GetNetCode()); board.Add(v)


def del_via(board, x, y, net):
    for v in list(board.GetTracks()):
        p = v.GetPosition()
        if v.Type() == pcbnew.PCB_VIA_T and v.GetNetname() == net and abs(mm(p.x) - x) < 0.02 and abs(mm(p.y) - y) < 0.02:
            board.Delete(v)


def simplify(board, nets, tol=0.12):
    """Replace staircases (chains of short segments, same net/layer/width, no via or pad on the way) by one segment."""
    merged = 0
    for name in nets:
        if board.FindNet(name) is None:
            continue
        code = board.FindNet(name).GetNetCode()
        while True:
            segs = [t for t in board.GetTracks() if t.GetNetCode() == code and t.Type() == pcbnew.PCB_TRACE_T]
            stops = {(p.x, p.y) for t in board.GetTracks() if t.GetNetCode() == code and t.Type() == pcbnew.PCB_VIA_T for p in [t.GetPosition()]}
            stops |= {(p.GetPosition().x, p.GetPosition().y) for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() == code}
            ends = {}
            for s in segs:
                for q in (s.GetStart(), s.GetEnd()):
                    ends.setdefault((q.x, q.y, s.GetLayer()), []).append(s)
            done = False
            for s in segs:
                chain, pts = [s], [s.GetStart(), s.GetEnd()]
                for side in (0, 1):
                    while True:
                        q = pts[-1] if side else pts[0]
                        nb = [o for o in ends.get((q.x, q.y, s.GetLayer()), []) if o not in chain]
                        if len(ends.get((q.x, q.y, s.GetLayer()), [])) != 2 or len(nb) != 1 or (q.x, q.y) in stops \
                                or nb[0].GetWidth() != s.GetWidth():
                            break
                        o = nb[0]; chain.append(o)
                        nxt = o.GetEnd() if (o.GetStart().x, o.GetStart().y) == (q.x, q.y) else o.GetStart()
                        if side: pts.append(nxt)
                        else: pts.insert(0, nxt)
                if len(chain) < 4:
                    continue
                a = pcbnew.VECTOR2I(int(pts[0].x), int(pts[0].y))           # copies: the tracks are deleted below
                b = pcbnew.VECTOR2I(int(pts[-1].x), int(pts[-1].y))
                ax, ay, bx, by = mm(a.x), mm(a.y), mm(b.x), mm(b.y)
                if all(route_pcb.miniroute._seg_dist(mm(q.x), mm(q.y), ax, ay, bx, by) <= tol for q in pts):
                    w, L = s.GetWidth(), s.GetLayer()
                    for c in chain:
                        board.Delete(c)
                    n = pcbnew.PCB_TRACK(board); n.SetStart(a); n.SetEnd(b); n.SetWidth(w); n.SetLayer(L); n.SetNetCode(code)
                    board.Add(n); merged += len(chain); done = True
                    break
            if not done:
                break
    return merged


def fixup2():
    """J302 +3V3 and GND by hand, restore pour vias the stub clean-up took, EN's dead branch, staircases, silk."""
    board = pcbnew.LoadBoard(stage(4))
    base = pcbnew.LoadBoard(os.path.join(PROJ, f"{NAME}.kicad_pcb"))           # V2.0 as built
    have = {(v.GetPosition().x, v.GetPosition().y) for v in board.GetTracks() if v.Type() == pcbnew.PCB_VIA_T}
    for v in base.GetTracks():                                                   # pour vias (+BATT) dropped as "dangling"
        if v.Type() == pcbnew.PCB_VIA_T and v.GetNetname() == "+BATT" and (v.GetPosition().x, v.GetPosition().y) not in have:
            add_via(board, mm(v.GetPosition().x), mm(v.GetPosition().y), "+BATT", mm(v.GetWidth(pcbnew.F_Cu)), mm(v.GetDrill()))
            print("  restored +BATT via", round(mm(v.GetPosition().x), 3), round(mm(v.GetPosition().y), 3))
    # J302: SCL via moves right, so J302.3 (+3V3) can go up to a via and round on B.Cu to the +3V3 track below
    del_tracks(board, "I2C_SCL", "F.Cu", [((164.982, 69.623), (159.265, 69.623)), ((159.265, 69.623), (159.275, 69.522)),
                                          ((159.275, 69.522), (159.275, 69.323))])
    del_tracks(board, "I2C_SCL", "In2.Cu", [((159.275, 69.323), (159.275, 69.522)), ((159.275, 69.522), (159.265, 69.623)),
                                            ((159.265, 69.623), (159.265, 74.375))])
    del_via(board, 159.275, 69.323, "I2C_SCL")
    add_track(board, [(164.982, 69.623), (162.223, 69.623), (161.6, 69.0)], "I2C_SCL", 0.2)
    add_via(board, 161.6, 69.0, "I2C_SCL")
    add_track(board, [(161.6, 69.0), (159.265, 71.0), (159.265, 74.375)], "I2C_SCL", 0.2, pcbnew.In2_Cu)
    add_track(board, [(159.1, 70.2), (159.1, 69.05)], "+3V3", 0.25)
    add_via(board, 159.1, 69.05, "+3V3")
    add_track(board, [(159.1, 69.05), (160.9, 69.05), (160.9, 74.91), (160.35, 75.46)], "+3V3", 0.25, pcbnew.B_Cu)
    add_via(board, 160.35, 75.46, "+3V3")
    del_tracks(board, "+3V3", "F.Cu", [((159.1, 74.21), (159.1, 73.325)), ((160.89, 76.0), (159.1, 74.21))])   # old pad stub
    add_track(board, [(160.89, 76.0), (160.35, 75.46)], "+3V3", 0.25)
    # J302.6 (GND): via beside the pad instead of the one the island stitcher put in it
    del_via(board, 162.1, 70.423, "GND")
    add_track(board, [(162.1, 70.675), (163.0, 70.6)], "GND", 0.3)
    add_via(board, 163.0, 70.6, "GND")
    del_via(board, 157.484, 74.584, "MOTB_P")                                      # joined only In2 to In2
    # EN: the branch that went to J406.12 (pin 12 is not connected now)
    del_tracks(board, "EN", "In2.Cu", [((131.43, 88.1), (130.877, 88.654)), ((130.877, 88.654), (130.877, 90.594)),
                                       ((130.877, 90.594), (135.571, 95.289)), ((135.571, 95.289), (142.612, 95.289)),
                                       ((142.612, 95.289), (143.534, 94.367)), ((143.534, 94.367), (144.57, 94.367)),
                                       ((144.57, 94.367), (146.525, 96.323)), ((146.525, 96.323), (146.525, 96.358))])
    touched = json.load(open(os.path.join(WORK, "touched.json")))
    print("staircase segments merged", simplify(board, [n for n in touched if n not in ZONE_NETS] + ["+3V3"]))
    # the edge line runs over R417's new spot: leave a gap there
    for d in list(board.GetDrawings()):
        if d.GetLayer() == pcbnew.F_SilkS and d.GetClass() == "PCB_SHAPE" and abs(mm(d.GetStart().x) - 102.9) < 0.01 \
                and abs(mm(d.GetEnd().x) - 102.9) < 0.01 and abs(mm(d.GetStart().y) - 84.545) < 0.01:
            d.SetStart(pcbnew.VECTOR2I(MM(102.9), MM(84.545))); d.SetEnd(pcbnew.VECTOR2I(MM(102.9), MM(74.0)))
            top = d.Duplicate(); top.SetStart(pcbnew.VECTOR2I(MM(102.9), MM(71.0))); top.SetEnd(pcbnew.VECTOR2I(MM(102.9), MM(62.557)))
            board.Add(top)
            print("  edge line split at R417")
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    save(board, 5)


LEGEND = ("ON-BOARD PARTS", "BUZZER IO47", "RGB LED IO48", "USER IO42", "BOOT IO0", "IMU I2C 0x6A")   # E-016, back silk


def labels():
    """Silkscreen: EXP B pin 12 reads NC, revision 2.1, and an IO legend for the parts on the board (E-016: the top
    has no room beside the parts, so the legend sits on the back next to the expansion pin names)."""
    board = pcbnew.LoadBoard(stage(5))
    for d in board.GetDrawings():
        if d.GetClass() != "PCB_TEXT" or d.GetLayer() != pcbnew.B_SilkS:
            continue
        if d.GetText().startswith("3V3\nGND\nSDA") and "\nEN\n" in d.GetText():
            d.SetText(d.GetText().replace("\nEN\n", "\nNC\n")); print("  EXP B pin 12: EN -> NC")
        if "REV 2.0" in d.GetText():
            d.SetText(d.GetText().replace("REV 2.0", "REV 2.1")); print("  back: REV 2.1")
    x, y0, pitch = 162.15, 76.2, 1.3
    for i, line in enumerate(LEGEND):
        t = pcbnew.PCB_TEXT(board)
        t.SetText(line); t.SetLayer(pcbnew.B_SilkS); t.SetMirrored(True)
        t.SetTextSize(pcbnew.VECTOR2I(MM(0.8), MM(0.8))); t.SetTextThickness(MM(0.15))
        t.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y0 + i * pitch)))
        board.Add(t)
    save(board, 6)


if __name__ == "__main__":
    {"apply": apply, "route": route, "finish": finish, "fixup": fixup, "fixup2": fixup2, "labels": labels}[sys.argv[1]]()
