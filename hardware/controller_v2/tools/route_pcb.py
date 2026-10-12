"""Route RoboCore V2 (run after build_pcb.py, with KiCad's Python):

  /Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3 tools/route_pcb.py [stage]

stages:  dsn    - In1.Cu becomes a solid GND plane, export the Specctra DSN for Freerouting
         ses    - import Freerouting's session (routes) and save the board
Net classes (track widths) live in RoboCore_V2.kicad_pro. Works on a scratch copy (pcbnew.SaveBoard rewrites the
.kicad_pro next to the board) and copies only the .kicad_pcb back.
"""
import math, os, shutil, subprocess, sys
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
WORK = os.path.join(os.environ.get("TMPDIR", "/tmp"), "rc2route")
JAR = os.path.expanduser("~/.kicad-mcp/freerouting.jar")
MM = pcbnew.FromMM


NETCLASSES = {   # name: (track, clearance, via diameter, via drill) in mm
    "Default": (0.2, 0.15, 0.6, 0.3), "POWER": (0.3, 0.15, 0.6, 0.3), "3V3": (0.25, 0.15, 0.6, 0.3), "USB": (0.2, 0.15, 0.6, 0.3)}
NETCLASS_PATTERNS = [("POWER", n) for n in ("+BATT", "VMOT", "VSYS", "VSYS_SW", "VBUS", "+5V_USB", "BATP_S", "Net-(D107-A)",
                     "Net-(Q102-D)", "Net-(U104-SW)", "MOTA_P", "MOTA_N", "MOTB_P", "MOTB_N", "Net-(U103-L1)", "Net-(U103-L2)", "GND")] \
    + [("3V3", "+3V3")] + [("USB", n) for n in ("USB_D+", "USB_D-", "Net-(J101-D+-PadA6)", "Net-(J101-D--PadA7)")]
RULES = dict(min_resolved_spokes=1, min_clearance=0.15, min_track_width=0.15, min_via_diameter=0.6, min_through_hole_diameter=0.2,
             min_via_annular_width=0.15, min_copper_edge_clearance=0.3, min_hole_clearance=0.25, min_hole_to_hole=0.25)


def write_netclasses(pro):
    """Net classes and rules live in the .kicad_pro; KiCad (if open) or SaveBoard may overwrite it, so set them here."""
    import copy, json
    d = json.load(open(pro))
    ns = d["net_settings"]
    base = copy.deepcopy(next(c for c in ns["classes"] if c["name"] == "Default"))
    ns["classes"] = []
    for k, (tw, cl, vd, vdr) in NETCLASSES.items():
        c = copy.deepcopy(base)
        c.update(name=k, track_width=tw, clearance=cl, via_diameter=vd, via_drill=vdr, diff_pair_width=tw, diff_pair_gap=0.2,
                 priority=len(ns["classes"]) if k != "Default" else 2147483647)
        ns["classes"].append(c)
    ns["netclass_patterns"] = [{"netclass": c, "pattern": p} for c, p in NETCLASS_PATTERNS]
    ns["netclass_assignments"] = None
    d["board"]["design_settings"]["rules"].update(RULES)
    json.dump(d, open(pro, "w"), indent=2)


def scratch():
    os.makedirs(WORK, exist_ok=True)
    for ext in ("kicad_pcb", "kicad_pro"):
        shutil.copy(os.path.join(PROJ, f"RoboCore_V2.{ext}"), os.path.join(WORK, f"RoboCore_V2.{ext}"))
    write_netclasses(os.path.join(WORK, "RoboCore_V2.kicad_pro"))
    return os.path.join(WORK, "RoboCore_V2.kicad_pcb")


def zone(board, net, layer, pts, priority=0, clearance=0.2, min_width=0.2, thermal=True, name=""):
    z = pcbnew.ZONE(board)
    z.SetLayer(layer)
    z.SetNetCode(board.FindNet(net).GetNetCode())
    z.SetAssignedPriority(priority)
    z.SetLocalClearance(MM(clearance))
    z.SetMinThickness(MM(min_width))
    z.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL if thermal else pcbnew.ZONE_CONNECTION_FULL)
    z.SetThermalReliefGap(MM(0.25))
    z.SetThermalReliefSpokeWidth(MM(0.35))
    z.SetIslandRemovalMode(pcbnew.ISLAND_REMOVAL_MODE_ALWAYS)
    if name:
        z.SetZoneName(name)
    o = z.Outline()
    o.NewOutline()
    for x, y in pts:
        o.Append(MM(x), MM(y))
    board.Add(z)
    return z


def board_outline_pts(board, inset):
    ps = pcbnew.SHAPE_POLY_SET()
    board.GetBoardPolygonOutlines(ps, False)
    ps.Inflate(-MM(inset), pcbnew.CORNER_STRATEGY_CHAMFER_ALL_CORNERS, MM(0.05))
    o = ps.Outline(0)
    return [(pcbnew.ToMM(o.CPoint(i).x), pcbnew.ToMM(o.CPoint(i).y)) for i in range(o.PointCount())]


def stage_dsn():
    path = scratch()
    board = pcbnew.LoadBoard(path)
    for z in list(board.Zones()):
        board.Delete(z)
    for t in list(board.GetTracks()):
        board.Delete(t)
    board.SetLayerType(pcbnew.In1_Cu, pcbnew.LT_POWER)          # In1 = plane, not a routing layer
    zone(board, "GND", pcbnew.In1_Cu, board_outline_pts(board, 0.3), 0, 0.2, 0.2, True, "GND plane")
    keepout(board, ANTENNA_KEEPOUT)
    for fp in board.GetFootprints():          # fiducials: 1.5 mm radius free of tracks and vias
        if fp.GetReference().startswith("FID"):
            x, y = pcbnew.ToMM(fp.GetPosition().x), pcbnew.ToMM(fp.GetPosition().y)
            keepout(board, (x - 1.6, y - 1.6, x + 1.6, y + 1.6), name=f"{fp.GetReference()} keepout")
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    # preroute(board)   # tried 2026-10-05: hundreds of tiny fixed segments made Freerouting worse
    fanout(board)
    for n in ("VMOT", "+BATT", "+3V3", "USB_D+", "I2C_SDA"):
        print(f"  {n}: class {board.FindNet(n).GetNetClassName()}")
    pcbnew.SaveBoard(path, board)
    dsn = os.path.join(WORK, "rc2.dsn")
    ok = pcbnew.ExportSpecctraDSN(board, dsn)
    print("DSN", ok, dsn)


PREROUTE = [   # (net, width) routed with the grid router before Freerouting, then locked: long or pin-locked nets
    ("MOTB_P", 0.4), ("MOTB_N", 0.4), ("+5V_USB", 0.3), ("CHG_STAT1", 0.2), ("CHG_STAT2", 0.2),
]


FANOUT = [("U301", "10"), ("U102", "8"), ("U102", "7"), ("C201", "2"), ("C202", "2"), ("C203", "2")]   # pins the router boxed in


def fanout(board):
    """Escape via + short stub for pins that otherwise get boxed in; placed on the empty board and locked."""
    cu = Copper(board)
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    for ref, num in FANOUT:
        pad = next(p for p in fps[ref].Pads() if p.GetNumber() == num)
        before = {t.m_Uuid.AsString() for t in board.GetTracks()}
        ok = via_beside(board, cu, pad, pad.GetNetCode(), 0.2)
        for t in board.GetTracks():
            if t.m_Uuid.AsString() not in before:
                t.SetLocked(True)
                if t.Type() == pcbnew.PCB_VIA_T:
                    fanout.vias.append((int(t.GetPosition().x), int(t.GetPosition().y), t.GetNetname()))
        print(f"  fanout {ref}.{num} ({pad.GetNetname()}):", "ok" if ok else "no room")
    import json
    json.dump(fanout.vias, open(os.path.join(WORK, "fanout.json"), "w"))


fanout.vias = []


def preroute(board):
    for name, w in PREROUTE:
        net = board.FindNet(name).GetNetCode()
        rounds = 0
        while len(_clusters(board, net)) > 1 and rounds < 30:
            got = _grid_route_once(board, name, w)
            rounds += 1
            if not got:
                print(f"  preroute {name}: stuck with {len(_clusters(board, net))} pieces")
                break
        for t in board.GetTracks():
            if t.GetNetCode() == net:
                t.SetLocked(True)
        print(f"  preroute {name}: {len(_clusters(board, net))} piece(s)")


def stage_dsn2():
    """Second router pass: start from the finished board (routes kept, pours removed) to finish the last few."""
    path = os.path.join(WORK, "RoboCore_V2.kicad_pcb")
    board = pcbnew.LoadBoard(path)
    for z in list(board.Zones()):
        if not z.GetIsRuleArea() and not (z.GetLayer() == pcbnew.In1_Cu and z.GetNetname() == "GND"):
            board.Delete(z)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    pcbnew.SaveBoard(path, board)
    ok = pcbnew.ExportSpecctraDSN(board, os.path.join(WORK, "rc2c.dsn"))
    print("DSN2", ok)


def restore_pro():
    """pcbnew.SaveBoard rewrites the .kicad_pro beside the board (net classes lost): put the real one back."""
    shutil.copy(os.path.join(PROJ, "RoboCore_V2.kicad_pro"), os.path.join(WORK, "RoboCore_V2.kicad_pro"))
    write_netclasses(os.path.join(WORK, "RoboCore_V2.kicad_pro"))


def stage_ses():
    path = os.path.join(WORK, "RoboCore_V2.kicad_pcb")
    restore_pro()
    board = pcbnew.LoadBoard(path)
    ok = pcbnew.ImportSpecctraSES(board, os.path.join(WORK, sys.argv[2] if len(sys.argv) > 2 else "rc2.ses"))
    print("SES import", ok)
    import json                       # Freerouting does not return locked vias: put the fan-out vias back
    fv = os.path.join(WORK, "fanout.json")
    have = {(v.GetPosition().x, v.GetPosition().y) for v in board.GetTracks() if v.Type() == pcbnew.PCB_VIA_T}
    for x, y, net in (json.load(open(fv)) if os.path.exists(fv) else []):
        if (x, y) not in have:
            v = pcbnew.PCB_VIA(board); v.SetPosition(pcbnew.VECTOR2I(x, y)); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3))
            v.SetNetCode(board.FindNet(net).GetNetCode()); v.SetLocked(True); board.Add(v)
            print("  restored fan-out via", net)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(WORK, "rc2_routed.kicad_pcb"))      # finish always starts from here
    shutil.copy(path, os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))
    print("tracks", len(board.GetTracks()))


# ---------------------------------------------------------------- finishing: keepout, wider power traces, pours, stitching
sys.path.insert(0, HERE)
import placement_v2 as PL  # noqa: E402
import miniroute  # noqa: E402
import artwork  # noqa: E402

ANTENNA_KEEPOUT = (112.3, 64.0, 160.3, 67.9)     # module antenna end over the board (footprint courtyard): no copper
POWER_WIDTHS = (1.5, 1.2, 1.0, 0.8, 0.6, 0.5)     # tried widest first for POWER-class tracks
CU = (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)


def keepout(board, r, name="antenna keepout"):
    z = pcbnew.ZONE(board)
    z.SetIsRuleArea(True)
    z.SetDoNotAllowTracks(True); z.SetDoNotAllowVias(True); z.SetDoNotAllowPads(False)
    z.SetDoNotAllowZoneFills(True); z.SetDoNotAllowFootprints(False)
    ls = pcbnew.LSET()
    for l in CU:
        ls.AddLayer(l)
    z.SetLayerSet(ls)
    z.SetZoneName(name)
    o = z.Outline(); o.NewOutline()
    for x, y in ((r[0], r[1]), (r[2], r[1]), (r[2], r[3]), (r[0], r[3])):
        o.Append(MM(x), MM(y))
    board.Add(z)


def _bb(item, grow=0):
    b = item.GetBoundingBox()
    return (b.GetLeft() - grow, b.GetTop() - grow, b.GetRight() + grow, b.GetBottom() + grow)


def _hit(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


class Copper:
    """Other-net copper per layer, for clearance checks while widening."""
    def __init__(self, board):
        self.items = []
        for fp in board.GetFootprints():
            for pad in fp.Pads():
                self.items.append((pad, pad.GetNetCode(), _bb(pad)))
        for t in board.GetTracks():
            self.items.append((t, t.GetNetCode(), _bb(t)))

    def clear(self, track, layer, clearance):
        bb = _bb(track, clearance)
        sh = track.GetEffectiveShape(layer)
        for it, net, ib in self.items:
            if net == track.GetNetCode() or not it.IsOnLayer(layer):
                continue
            if it.Type() in (pcbnew.PCB_TRACE_T, pcbnew.PCB_VIA_T, pcbnew.PCB_ARC_T):
                ib = _bb(it)              # tracks may have been widened since the list was made
            if not _hit(bb, ib):
                continue
            if sh.Collide(it.GetEffectiveShape(layer), clearance):
                return False
        return True


def _on_board(track, w):
    s, e = track.GetStart(), track.GetEnd()
    for k in range(5):
        x = pcbnew.ToMM(s.x + (e.x - s.x) * k / 4); y = pcbnew.ToMM(s.y + (e.y - s.y) * k / 4)
        if not PL.on_board(x, y, w / 2 + 0.35):
            return False
    return True


def split_at_pads(board, nets):
    """Cut power tracks 0.8 mm from a pad they start on, so only that stub stays narrow at fine-pitch pins."""
    pads = [(p.GetPosition(), p.GetNetCode()) for fp in board.GetFootprints() for p in fp.Pads()]
    n = 0
    for t in list(board.GetTracks()):
        if t.Type() != pcbnew.PCB_TRACE_T or t.GetNetCode() not in nets:
            continue
        s, e = t.GetStart(), t.GetEnd()
        L = pcbnew.ToMM((e - s).EuclideanNorm())
        if L < 2.0:
            continue
        for a, b, start in ((s, e, True), (e, s, False)):
            if any(pp == a and pn == t.GetNetCode() for pp, pn in pads):
                f = 0.8 / L
                m = pcbnew.VECTOR2I(int(a.x + (b.x - a.x) * f), int(a.y + (b.y - a.y) * f))
                t2 = pcbnew.PCB_TRACK(board)
                t2.SetLayer(t.GetLayer()); t2.SetNetCode(t.GetNetCode()); t2.SetWidth(t.GetWidth())
                t2.SetStart(a); t2.SetEnd(m)
                board.Add(t2)
                if start:
                    t.SetStart(m)
                else:
                    t.SetEnd(m)
                n += 1
                break
    return n


def widen(board, nets, clearance=0.25):
    cu = Copper(board)
    changed = 0
    for t in board.GetTracks():
        if t.Type() != pcbnew.PCB_TRACE_T or t.GetNetCode() not in nets:
            continue
        w0 = t.GetWidth()
        for w in POWER_WIDTHS:
            if MM(w) <= w0:
                break
            t.SetWidth(MM(w))
            if _on_board(t, w) and cu.clear(t, t.GetLayer(), MM(clearance)):
                changed += 1
                break
            t.SetWidth(w0)
    return changed


def pad_hull(board, refs_pads, margin):
    """Rectangle around the given pads (ref, pad number) plus a margin."""
    xs, ys = [], []
    fps = {fp.GetReference(): fp for fp in board.GetFootprints()}
    for ref, num in refs_pads:
        for p in fps[ref].Pads():
            if p.GetNumber() == num:
                b = p.GetBoundingBox()
                xs += [pcbnew.ToMM(b.GetLeft()), pcbnew.ToMM(b.GetRight())]
                ys += [pcbnew.ToMM(b.GetTop()), pcbnew.ToMM(b.GetBottom())]
    x0, y0, x1, y1 = min(xs) - margin, min(ys) - margin, max(xs) + margin, max(ys) + margin
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


POWER_AREAS = [   # (net, pads joined by solid top copper) - the high-current loops
    ("Net-(U104-SW)", [("U104", "11"), ("L102", "2")]),
    ("Net-(Q102-D)", [("Q102", "5"), ("C111", "1"), ("L102", "1")]),
    ("Net-(D107-A)", [("J102", "2"), ("Q103", "5")]),
    ("BATP_S", [("Q103", "1"), ("Q103", "3"), ("Q104", "1"), ("Q104", "3")]),
]


INNER_POWER = [   # (net, polygon on In2.Cu): power copper filling between the In2 signal tracks (priority over GND)
    ("VMOT", [(103.2, 75.0), (121.3, 75.0), (121.3, 103.0), (103.2, 103.0)]),          # motor driver, servos 1/3, boost out
    ("VMOT", [(151.9, 84.8), (165.0, 84.8), (165.0, 103.0), (151.9, 103.0)]),          # servos 2/4
    ("+BATT", [(103.6, 103.4), (136.0, 103.4), (136.0, 113.2), (103.6, 113.2)]),       # protection FETs to the boost input switch
]
VIA_FARMS = [   # (net, pad, extra vias) - more vias where power changes layer
    ("+BATT", ("Q104", "5"), 3), ("+BATT", ("Q102", "1"), 3), ("VMOT", ("C117", "1"), 3), ("VMOT", ("C119", "1"), 2),
    ("VMOT", ("C303", "1"), 2), ("Net-(D107-A)", ("Q103", "5"), 2),
]


def prune_farm(board):
    """Drop farm vias that did not land in their inner power copper (connected on one layer only), with their stub."""
    gone = 0
    for v in list(via_farm.made):
        net = v.GetNetCode()
        inner = [z for z in board.Zones() if z.GetNetCode() == net and z.GetLayer() == pcbnew.In2_Cu]
        if any(z.GetFilledPolysList(pcbnew.In2_Cu).Contains(v.GetPosition()) for z in inner):
            continue
        for t in list(board.GetTracks()):
            if t.Type() == pcbnew.PCB_TRACE_T and t.GetNetCode() == net and t.GetEnd() == v.GetPosition() and t.GetLayer() == pcbnew.F_Cu:
                board.Delete(t)
        board.Delete(v)
        gone += 1
    via_farm.made = []
    return gone


def via_farm(board):
    cu = Copper(board)
    before = {t.m_Uuid.AsString() for t in board.GetTracks()}
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    added = 0
    for net, (ref, num), n in VIA_FARMS:
        pad = next(p for p in fps[ref].Pads() if p.GetNumber() == num)
        for _ in range(n):
            added += via_beside(board, cu, pad, board.FindNet(net).GetNetCode(), 0.2)
    via_farm.made = [t for t in board.GetTracks() if t.Type() == pcbnew.PCB_VIA_T and t.m_Uuid.AsString() not in before]
    return added


via_farm.made = []


def stitch(board, pitch=4.0):
    """GND vias on a grid wherever there is room, tying the top/bottom pours to the In1 plane."""
    gnd = board.FindNet("GND").GetNetCode()
    cu = Copper(board)
    ko = ANTENNA_KEEPOUT
    fids = [(pcbnew.ToMM(f.GetPosition().x), pcbnew.ToMM(f.GetPosition().y)) for f in board.GetFootprints() if f.GetReference().startswith("FID")]
    n = 0
    y = 63.0
    while y < 121.0:
        x = 103.5
        while x < 169.5:
            near_fid = any(math.hypot(x - fx, y - fy) < 2.6 for fx, fy in fids)
            if PL.on_board(x, y, 1.0) and not near_fid and not (ko[0] - 1 < x < ko[2] + 1 and ko[1] - 1 < y < ko[3] + 1):
                v = pcbnew.PCB_VIA(board)
                v.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
                v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNetCode(gnd)
                if all(cu.clear(v, l, MM(0.3)) for l in (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)) and \
                        not any(_hit(_bb(v, MM(0.3)), _bb(fp)) for fp in board.GetFootprints() if not fp.IsFlipped() and fp.GetReference() == "U201"):
                    board.Add(v)
                    cu.items.append((v, gnd, _bb(v)))
                    n += 1
            x += pitch
        y += pitch
    return n


def resize_vias(board, nets):
    """Power vias: 0.8/0.4 mm where it fits, otherwise the routed 0.6/0.3 mm."""
    cu = Copper(board)
    n = 0
    for v in board.GetTracks():
        if v.Type() != pcbnew.PCB_VIA_T:
            continue
        if v.GetNetCode() in nets:
            v.SetWidth(MM(0.8)); v.SetDrill(MM(0.4))
            if all(cu.clear(v, l, MM(0.2)) for l in CU if l != pcbnew.In1_Cu):
                n += 1
                continue
        v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3))
    return n


def drop_dangling(board):
    """Vias (not GND, not locked) with fewer than two track ends inside their pad: rip-up leftovers."""
    gnd = board.FindNet("GND").GetNetCode()
    ends = [(p.x, p.y, t.GetNetCode()) for t in board.GetTracks() if t.Type() == pcbnew.PCB_TRACE_T for p in (t.GetStart(), t.GetEnd())]
    gone = 0
    for v in list(board.GetTracks()):
        if v.Type() != pcbnew.PCB_VIA_T or v.GetNetCode() == gnd or v.IsLocked():
            continue
        p, r = v.GetPosition(), v.GetWidth(pcbnew.F_Cu) / 2
        n = sum(1 for x, y, c in ends if c == v.GetNetCode() and (x - p.x) ** 2 + (y - p.y) ** 2 <= r * r)
        if n < 2:
            board.Delete(v)
            gone += 1
    return gone


def solid_thermal_vias(board):
    """Thermal vias inside IC pads (small PTH pads): solid to the pours, spokes cannot fit there."""
    n = 0
    for fp in board.GetFootprints():
        for p in fp.Pads():
            if p.GetAttribute() == pcbnew.PAD_ATTRIB_PTH and pcbnew.ToMM(p.GetDrillSize().x) <= 0.4:
                p.SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
                n += 1
    return n


def stitch_islands(board, layers):
    """A GND via in every filled GND island that has no via or through-hole pad (isolated by traces)."""
    gnd = board.FindNet("GND").GetNetCode()
    anchors = [v.GetPosition() for v in board.GetTracks() if v.Type() == pcbnew.PCB_VIA_T and v.GetNetCode() == gnd]
    anchors += [p.GetPosition() for fp in board.GetFootprints() for p in fp.Pads()
                if p.GetNetCode() == gnd and p.GetAttribute() == pcbnew.PAD_ATTRIB_PTH]
    cu = Copper(board)
    added = 0
    for z in board.Zones():
        if z.GetIsRuleArea() or z.GetNetCode() != gnd or z.GetLayer() not in layers:
            continue
        polys = z.GetFilledPolysList(z.GetLayer())
        for i in range(polys.OutlineCount()):
            one = pcbnew.SHAPE_POLY_SET(); one.AddOutline(polys.Outline(i))
            for h in range(polys.HoleCount(i)):
                one.AddHole(polys.Hole(i, h))
            if any(one.Contains(pcbnew.VECTOR2I(a)) for a in anchors):
                continue
            islands = getattr(stitch_islands, "seen", 0) + 1; stitch_islands.seen = islands
            bb = one.BBox()
            done = False
            x = bb.GetLeft()
            while x < bb.GetRight() and not done:
                y = bb.GetTop()
                while y < bb.GetBottom() and not done:
                    c = pcbnew.VECTOR2I(int(x), int(y))
                    r = MM(0.45)
                    if all(one.Contains(pcbnew.VECTOR2I(int(x + dx), int(y + dy))) for dx, dy in
                           ((0, 0), (r, 0), (-r, 0), (0, r), (0, -r), (r * .7, r * .7), (-r * .7, r * .7), (r * .7, -r * .7), (-r * .7, -r * .7))):
                        v = pcbnew.PCB_VIA(board)
                        v.SetPosition(c); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNetCode(gnd)
                        if all(cu.clear(v, l, MM(0.25)) for l in (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)):
                            board.Add(v); cu.items.append((v, gnd, _bb(v))); anchors.append(c)
                            added += 1; done = True
                    y += MM(0.25)
                x += MM(0.25)
    return added


HEAVY_GND = {("U104", "5"), ("C117", "2"), ("C119", "2"), ("C111", "2"), ("C118", "2"), ("U301", "17")}   # boost / motor return


def gnd_orphans(board):
    """GND SMD pads whose copper cluster reaches no via, through-hole pad or the In1 plane."""
    board.BuildConnectivity()
    c = board.GetConnectivity()
    gnd = board.FindNet("GND").GetNetCode()
    out = []
    for fp in board.GetFootprints():
        for p in fp.Pads():
            if p.GetNetCode() != gnd or p.GetAttribute() == pcbnew.PAD_ATTRIB_PTH or not p.IsOnLayer(pcbnew.F_Cu):
                continue
            items = c.GetConnectedItems(p)
            if not any(i.Type() == pcbnew.PCB_VIA_T or (i.Type() == pcbnew.PCB_PAD_T and i.GetAttribute() == pcbnew.PAD_ATTRIB_PTH)
                       or (i.Type() == pcbnew.PCB_ZONE_T and i.GetLayer() == pcbnew.In1_Cu) for i in items):
                out.append(p)
    return out


def via_beside(board, cu, pad, gnd, clr=0.18):
    """GND via near a pad (up to 3 mm) joined by a straight or one-bend top track; True if one fitted."""
    px, py = pcbnew.ToMM(pad.GetPosition().x), pcbnew.ToMM(pad.GetPosition().y)
    pp = pad.GetPosition()
    for r in (0.8, 1.0, 1.2, 1.5, 1.8, 2.2, 2.6, 3.0):
        for k in range(36):
            a = 2 * math.pi * k / 36
            x, y = px + r * math.cos(a), py + r * math.sin(a)
            if not PL.on_board(x, y, 0.8):
                continue
            v = pcbnew.PCB_VIA(board)
            vp = pcbnew.VECTOR2I(MM(x), MM(y))
            v.SetPosition(vp); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNetCode(gnd)
            if any(i.Type() == pcbnew.PCB_VIA_T and (i.GetPosition() - vp).EuclideanNorm() < MM(0.8) for i, _, _ in cu.items):
                continue                  # no via on top of (or touching) another via, whatever its net
            if not all(cu.clear(v, l, MM(clr)) for l in (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)):
                continue
            for path in ([pp, vp], [pp, pcbnew.VECTOR2I(vp.x, pp.y), vp], [pp, pcbnew.VECTOR2I(pp.x, vp.y), vp]):
                segs = []
                for p0, p1 in zip(path, path[1:]):
                    if p0 == p1:
                        continue
                    t = pcbnew.PCB_TRACK(board)
                    t.SetStart(p0); t.SetEnd(p1); t.SetWidth(MM(0.25)); t.SetLayer(pcbnew.F_Cu); t.SetNetCode(gnd)
                    segs.append(t)
                if all(cu.clear(t, pcbnew.F_Cu, MM(clr)) for t in segs):
                    board.Add(v)
                    cu.items.append((v, gnd, _bb(v)))
                    for t in segs:
                        board.Add(t); cu.items.append((t, gnd, _bb(t)))
                    return True
    return False


def fix_gnd(board):
    gnd = board.FindNet("GND").GetNetCode()
    cu = Copper(board)
    added, stuck = 0, []
    for pad in gnd_orphans(board):
        key = (pad.GetParentFootprint().GetReference(), pad.GetNumber())
        n = 4 if key in HEAVY_GND else 1
        got = sum(via_beside(board, cu, pad, gnd) for _ in range(n))
        added += got
        if not got:
            stuck.append(key)
    return added, stuck


def _anchors(items, layer):
    """Points on a layer where a new track may start: pad centres, via centres, track ends."""
    pts = []
    for i in items:
        if i.Type() == pcbnew.PCB_PAD_T and i.IsOnLayer(layer):
            pts.append(i.GetPosition())
        elif i.Type() == pcbnew.PCB_VIA_T:
            pts.append(i.GetPosition())
        elif i.Type() == pcbnew.PCB_TRACE_T and i.GetLayer() == layer:
            pts += [i.GetStart(), i.GetEnd()]
    return pts


def patch_connect(board, netname, width=0.3, max_len=10.0):
    """Join stray copper islands of a net to its main body with a straight or one-bend track (top, then bottom)."""
    board.BuildConnectivity()
    c = board.GetConnectivity()
    net = board.FindNet(netname).GetNetCode()
    items = [p for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() == net]
    items += [t for t in board.GetTracks() if t.GetNetCode() == net]
    clusters, seen = [], set()
    for it in items:
        k = it.m_Uuid.AsString()
        if k in seen:
            continue
        cl = [it] + [x for x in c.GetConnectedItems(it) if x.GetNetCode() == net]
        for x in cl:
            seen.add(x.m_Uuid.AsString())
        clusters.append(cl)
    if len(clusters) < 2:
        return 0
    clusters.sort(key=len, reverse=True)
    main, joined = clusters[0], 0
    cu = Copper(board)
    for orphan in clusters[1:]:
        best = None
        for layer in (pcbnew.F_Cu, pcbnew.B_Cu):
            for a in _anchors(orphan, layer):
                for b in _anchors(main, layer):
                    d = pcbnew.ToMM((a - b).EuclideanNorm())
                    if d <= max_len and (best is None or d < best[0]):
                        best = (d, a, b, layer)
        cands = []
        for layer in (pcbnew.F_Cu, pcbnew.B_Cu):
            for a in _anchors(orphan, layer):
                for b in _anchors(main, layer):
                    d = pcbnew.ToMM((a - b).EuclideanNorm())
                    if d <= max_len:
                        cands.append((d, a, b, layer))
        cands.sort(key=lambda t: t[0])
        done = False
        for d, a, b, layer in cands[:60]:
            for path in ([a, b], [a, pcbnew.VECTOR2I(b.x, a.y), b], [a, pcbnew.VECTOR2I(a.x, b.y), b]):
                segs = []
                for p0, p1 in zip(path, path[1:]):
                    if p0 == p1:
                        continue
                    t = pcbnew.PCB_TRACK(board)
                    t.SetStart(p0); t.SetEnd(p1); t.SetWidth(MM(width)); t.SetLayer(layer); t.SetNetCode(net)
                    segs.append(t)
                if segs and all(cu.clear(t, layer, MM(0.18)) for t in segs):
                    for t in segs:
                        board.Add(t); cu.items.append((t, net, _bb(t)))
                    done = True
                    break
            if done:
                break
        joined += done
        if not done:
            print(f"  {netname}: could not join an island of {len(orphan)} items")
    return joined


def _clusters(board, net):
    board.BuildConnectivity()
    c = board.GetConnectivity()
    items = [p for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() == net]
    items += [t for t in board.GetTracks() if t.GetNetCode() == net]
    out, seen = [], set()
    for it in items:
        if it.m_Uuid.AsString() in seen:
            continue
        cl = [it] + [x for x in c.GetConnectedItems(it) if x.GetNetCode() == net and x.Type() != pcbnew.PCB_ZONE_T]
        for x in cl:
            seen.add(x.m_Uuid.AsString())
        out.append(cl)
    return sorted(out, key=len, reverse=True)


def _terminals(items):
    pts = []
    for i in items:
        if i.Type() == pcbnew.PCB_PAD_T:
            for l in miniroute.LAYERS:
                if i.IsOnLayer(l):
                    pts.append((pcbnew.ToMM(i.GetPosition().x), pcbnew.ToMM(i.GetPosition().y), l, i.GetPosition()))
        elif i.Type() == pcbnew.PCB_VIA_T:
            for l in miniroute.LAYERS:
                pts.append((pcbnew.ToMM(i.GetPosition().x), pcbnew.ToMM(i.GetPosition().y), l, i.GetPosition()))
        elif i.Type() == pcbnew.PCB_TRACE_T and i.GetLayer() in miniroute.LAYERS:
            for p in (i.GetStart(), i.GetEnd()):
                pts.append((pcbnew.ToMM(p.x), pcbnew.ToMM(p.y), i.GetLayer(), p))
    return pts


def _snap(t):
    """Plain values (SWIG references die with the deleted track)."""
    if t.Type() == pcbnew.PCB_VIA_T:
        p = t.GetPosition()
        return ("via", pcbnew.VECTOR2I(int(p.x), int(p.y)), int(t.GetWidth(pcbnew.F_Cu)), int(t.GetDrill()), int(t.GetNetCode()))
    s, e = t.GetStart(), t.GetEnd()
    return ("trk", int(t.GetLayer()), pcbnew.VECTOR2I(int(s.x), int(s.y)), pcbnew.VECTOR2I(int(e.x), int(e.y)), int(t.GetWidth()), int(t.GetNetCode()))


def _restore(board, snap):
    if snap[0] == "via":
        v = pcbnew.PCB_VIA(board); v.SetPosition(snap[1]); v.SetWidth(snap[2]); v.SetDrill(snap[3]); v.SetNetCode(snap[4]); board.Add(v)
    else:
        t = pcbnew.PCB_TRACK(board); t.SetLayer(snap[1]); t.SetStart(snap[2]); t.SetEnd(snap[3]); t.SetWidth(snap[4]); t.SetNetCode(snap[5]); board.Add(t)


def rip_near(board, net, pads, radius=0.9, saved=None):
    """Remove other nets' tracks/vias near the given pads; returns the names of the nets touched."""
    touched = set()
    for t in list(board.GetTracks()):
        if t.GetNetCode() == net or t.GetNetClassName() in ("POWER", "3V3", "USB"):
            continue                      # only plain signals and GND may be ripped up
        for p in pads:
            px, py = pcbnew.ToMM(p.GetPosition().x), pcbnew.ToMM(p.GetPosition().y)
            if t.Type() == pcbnew.PCB_VIA_T:
                d = math.hypot(pcbnew.ToMM(t.GetPosition().x) - px, pcbnew.ToMM(t.GetPosition().y) - py)
            elif t.GetLayer() in [l for l in miniroute.LAYERS if p.IsOnLayer(l)]:
                s, e = t.GetStart(), t.GetEnd()
                d = miniroute._seg_dist(px, py, pcbnew.ToMM(s.x), pcbnew.ToMM(s.y), pcbnew.ToMM(e.x), pcbnew.ToMM(e.y)) - pcbnew.ToMM(t.GetWidth()) / 2
            else:
                continue
            if d < radius:
                touched.add(t.GetNetname())
                if saved is not None:
                    saved.append(_snap(t))
                board.Delete(t)
                break
    return touched


def grid_route(board, netname, width, depth=0):
    """Route each stray island of a net to its main body with the A* grid router (rip-up and retry once)."""
    net = board.FindNet(netname).GetNetCode()
    cls = _clusters(board, net)
    done = 0
    if len(cls) > 1 and depth == 0:
        first = _grid_route_once(board, netname, width)
        if first == len(cls) - 1:
            return first
        cls = _clusters(board, net)
        pads = [i for c in cls for i in c if i.Type() == pcbnew.PCB_PAD_T and i.GetAttribute() != pcbnew.PAD_ATTRIB_PTH]
        before = {t.m_Uuid.AsString() for t in board.GetTracks()}
        saved = []
        touched = rip_near(board, net, pads, saved=saved)
        got = _grid_route_once(board, netname, width)
        ok = len(_clusters(board, net)) == 1
        for other in sorted(touched - {"GND"}):
            oc = board.FindNet(other).GetNetCode()
            if ok and len(_clusters(board, oc)) > 1:
                _grid_route_once(board, other, 0.2)
                ok = len(_clusters(board, oc)) == 1
        if not ok:                         # roll back: nothing may end up worse than before
            for t in list(board.GetTracks()):
                if t.m_Uuid.AsString() not in before:
                    board.Delete(t)
            for sn in saved:
                _restore(board, sn)
            print(f"    rip-up for {netname} rolled back (touched {sorted(touched)})")
            return first
        print(f"    rip-up for {netname} worked (re-routed {sorted(touched - {'GND'})})")
        return first + got
    return _grid_route_once(board, netname, width)


GRID = {"step": 0.1, "clr": 0.23}     # first pass; a finer second pass handles what is left


def _grid_route_once(board, netname, width):
    net = board.FindNet(netname).GetNetCode()
    cls = _clusters(board, net)
    done = 0
    for orphan in cls[1:]:
        starts = _terminals(orphan)
        goals = _terminals(cls[0])
        sx = [p[0] for p in starts]; sy = [p[1] for p in starts]
        goals.sort(key=lambda g: min(math.hypot(g[0] - x, g[1] - y) for x, y in zip(sx, sy)))
        near = goals[:40]
        xs = sx + [g[0] for g in near[:8]]; ys = sy + [g[1] for g in near[:8]]
        win = (max(102.3, min(xs) - 4), max(61.5, min(ys) - 4), min(170.3, max(xs) + 4), min(121.6, max(ys) + 4))
        g = miniroute.Grid(board, net, win, width, GRID["clr"], PL.on_board, step=GRID["step"])     # 0.15 rule + grid-step margin
        for it in orphan + cls[0]:
            if it.Type() == pcbnew.PCB_PAD_T:
                g.open_pad(it)
        path = g.route([p[:3] for p in starts], [p[:3] for p in near])
        if not path:
            print(f"  {netname}: grid router found no path")
            continue
        sp = min(starts, key=lambda p: math.hypot(p[0] - path[0][0], p[1] - path[0][1]) + (0 if p[2] == path[0][2] else 9))
        ep = min(near, key=lambda p: math.hypot(p[0] - path[-1][0], p[1] - path[-1][1]) + (0 if p[2] == path[-1][2] else 9))
        miniroute.commit(board, net, path, width, sp[3], ep[3])
        done += 1
    return done


def stage_finish():
    path = os.path.join(WORK, "RoboCore_V2.kicad_pcb")
    shutil.copy(os.path.join(WORK, "rc2_routed.kicad_pcb"), path)
    restore_pro()
    board = pcbnew.LoadBoard(path)
    assert board.FindNet("VMOT").GetNetClassName() == "POWER", "net classes not loaded"
    power = set()
    for code, net in board.GetNetsByNetcode().items():
        if net.GetNetClassName() == "POWER" and net.GetNetname() != "GND":
            power.add(code)
    print("dangling vias removed", drop_dangling(board))
    outline = board_outline_pts(board, 0.35)
    for net, pads in POWER_AREAS:
        zone(board, net, pcbnew.F_Cu, pad_hull(board, pads, 0.4), 2, 0.2, 0.25, False, f"{net} area")
    for layer in (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu):
        z = zone(board, "GND", layer, outline, 0, 0.2, 0.25, True, "GND pour")
        z.SetPadConnection(pcbnew.ZONE_CONNECTION_FULL if layer == pcbnew.In2_Cu else pcbnew.ZONE_CONNECTION_THT_THERMAL)
    print("thermal-via pads made solid", solid_thermal_vias(board))
    # signals first: join stray pieces (straight / one-bend), then the grid router, before any GND patching
    for name in [n.GetNetname() for n in board.GetNetsByNetcode().values() if n.GetNetname() and n.GetNetname() != "GND"]:
        if patch_connect(board, name, 0.3 if board.FindNet(name).GetNetClassName() == "POWER" else 0.2):
            print("  patched", name)
    for name in [n.GetNetname() for n in board.GetNetsByNetcode().values() if n.GetNetname() and n.GetNetname() != "GND"]:
        code = board.FindNet(name).GetNetCode()
        if len(_clusters(board, code)) > 1:
            print("  grid-routed", name, grid_route(board, name, 0.2))
    # second, finer pass (0.05 mm grid, smaller margin) for whatever is still open, GND included
    GRID.update(step=0.05, clr=0.19)
    for name in [n.GetNetname() for n in board.GetNetsByNetcode().values() if n.GetNetname()]:
        code = board.FindNet(name).GetNetCode()
        if name != "GND" and len(_clusters(board, code)) > 1:
            print("  fine grid", name, grid_route(board, name, 0.2))
    GRID.update(step=0.1, clr=0.23)
    # only now, with every connection made, fatten the power tracks and vias where there is room
    print("split", split_at_pads(board, power))
    print("widened", widen(board, power))
    print("power vias 0.8 mm", resize_vias(board, power))
    print("power via farms", via_farm(board))
    for net, poly in INNER_POWER:
        zone(board, net, pcbnew.In2_Cu, poly, 1, 0.2, 0.3, False, f"{net} inner")
    print("stitch vias", stitch(board))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    print("farm vias pruned", prune_farm(board))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    for _ in range(2):
        n = stitch_islands(board, (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu))
        print("island vias", n, "of", getattr(stitch_islands, "seen", 0), "islands"); stitch_islands.seen = 0
        if not n:
            break
        pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    print("GND joins", patch_connect(board, "GND", 0.4, 6.0))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    if len(_clusters(board, board.FindNet("GND").GetNetCode())) > 1:
        GRID.update(step=0.05, clr=0.19)
        print("  fine grid GND", _grid_route_once(board, "GND", 0.25))
        GRID.update(step=0.1, clr=0.23)
        pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    for _ in range(3):
        added, stuck = fix_gnd(board)
        print("GND pad vias", added, "no room:", stuck)
        pcbnew.ZONE_FILLER(board).Fill(board.Zones())
        if not added:
            break
    artwork.add(board)                      # back-side logos and writing (silkscreen only)
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))
    write_netclasses(os.path.join(PROJ, "RoboCore_V2.kicad_pro"))


def stage_gndfix(drc_json):
    """Give every GND pad that DRC reports as unconnected a short track to a new GND via nearby."""
    import json, math
    path = os.path.join(WORK, "RoboCore_V2.kicad_pcb")
    board = pcbnew.LoadBoard(path)
    gnd = board.FindNet("GND").GetNetCode()
    d = json.load(open(drc_json))
    pads = []
    for u in d.get("unconnected_items", []):
        for it in u["items"]:
            if "[GND]" in it["description"] and it["description"].startswith(("Pad", "PTH pad")):
                pads.append((it["pos"]["x"], it["pos"]["y"]))
    cu = Copper(board)
    done = 0
    for px, py in dict.fromkeys(pads):
        pad = next((p for fp in board.GetFootprints() for p in fp.Pads()
                    if p.GetNetCode() == gnd and abs(pcbnew.ToMM(p.GetPosition().x) - px) < 0.01 and abs(pcbnew.ToMM(p.GetPosition().y) - py) < 0.01), None)
        if pad is None or not pad.IsOnLayer(pcbnew.F_Cu):
            continue
        placed = False
        for r in (0.9, 1.1, 1.3, 1.6, 2.0):
            for k in range(16):
                a = 2 * math.pi * k / 16
                x, y = px + r * math.cos(a), py + r * math.sin(a)
                if not PL.on_board(x, y, 0.8):
                    continue
                v = pcbnew.PCB_VIA(board)
                v.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y))); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNetCode(gnd)
                t = pcbnew.PCB_TRACK(board)
                t.SetStart(pad.GetPosition()); t.SetEnd(v.GetPosition()); t.SetWidth(MM(0.25)); t.SetLayer(pcbnew.F_Cu); t.SetNetCode(gnd)
                if all(cu.clear(v, l, MM(0.2)) for l in (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)) and cu.clear(t, pcbnew.F_Cu, MM(0.2)):
                    board.Add(v); board.Add(t)
                    cu.items += [(v, gnd, _bb(v)), (t, gnd, _bb(t))]
                    placed = True
                    done += 1
                    break
            if placed:
                break
        if not placed:
            print(f"  no room for a GND via at pad {pad.GetParentFootprint().GetReference()}.{pad.GetNumber()} ({px}, {py})")
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))
    print("GND vias added", done)


if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "dsn"
    if stage == "gndfix":
        stage_gndfix(sys.argv[2])
    else:
        {"dsn": stage_dsn, "dsn2": stage_dsn2, "ses": stage_ses, "finish": stage_finish}[stage]()
