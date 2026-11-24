"""V2.1 change of 2026-11-23 (Fred): JST PH 2.0 motor sockets and on-board cell protection, on the routed V2.1 board.

Fred: "PH2.0 to PH2.0 connection from motor to board", sensors stay on 2.54 mm headers, "changes to v2.1".

  <KiCad python> tools/eco_v21b.py apply    # footprints, parts, nets, cuts, hand links      -> $TMPDIR/eco_v21b/stage1
  <KiCad python> tools/eco_v21b.py route    # Freerouting for the changed nets, old copper fixed -> stage2
  <KiCad python> tools/eco_v21b.py finish   # leftovers, pours, stitching, dead ends            -> stage3

J301/J302: KiCad's JST_PH_B6B-PH-K vertical (pin 1 = JST circuit 1, square pad, left), same pin order as before
(1 M+, 2 M-, 3 3V3, 4 A, 5 B, 6 GND), which is the DG01D-E motor socket's order, so a straight PH cable fits.
The 13.9 mm PH body needs the top corners: J201 (Qwiic) turns and moves down, FID102 and C204 move.
U106 (XB8089D0) goes above the XT30 where D107/R123 and the polarity label were; D107/R123 move beside Q105.
U106 only works if it can start before the board loads the cell, so the input-protection control parts
(Q105, R124, C121, U105, R126, C122) now return to the cell's minus (BAT_N), not GND.
"""
import json, math, os, shutil, sys
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import eco_v21 as E   # noqa: E402
import route_pcb      # noqa: E402

WORK = E.WORK = os.path.join(os.environ.get("TMPDIR", "/tmp"), "eco_v21b")
NAME = "RoboCore_V2"
MM, mm = pcbnew.FromMM, pcbnew.ToMM
V = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))   # noqa: E731

PH = ("J301", "J302")
PH_AT = {"J301": (108.74, 69.1), "J302": (153.8, 69.1)}        # pin 1, rot 0 (pin 1 left, body 1.75 above / 2.85 below)
NEW = ("U106", "R127", "C123", "D108")
U106_AT = (122.9, 110.94)                                       # pins 1-4 (VM = GND) on top, 5-8 (BAT_N) facing the XT30
MOVES = {"C204": (107.6, 73.65, 0)}   # C117 stays: U106's pin 4 clears its pad by 0.3 mm, courtyards touch
J201_BOX = (162.42, 72.5)                                       # courtyard left/top after turning it to 0 deg
DEAD_VIAS = [(123.5, 115.0, "GND"), (119.5, 115.0, "GND")]      # under the XT30, inside the new BAT_N copper


def stage(n):
    return os.path.join(WORK, f"stage{n}", f"{NAME}.kicad_pcb")


def courtyard(fp):
    fp.BuildCourtyardCaches()          # KiCad keeps the courtyard of the position the part was loaded at
    return fp.GetCourtyard(pcbnew.F_CrtYd if fp.GetLayer() == pcbnew.F_Cu else pcbnew.B_CrtYd)


def bbox(fp):
    s = courtyard(fp)
    bb = s.BBox() if s.OutlineCount() else fp.GetBoundingBox(False)
    return mm(bb.GetLeft()), mm(bb.GetTop()), mm(bb.GetRight()), mm(bb.GetBottom())


def hits(board, fp, ignore=()):
    """Top-side parts whose courtyard intersects this one's."""
    a = courtyard(fp)
    l, t, r, b = bbox(fp)
    out = []
    for g in board.GetFootprints():
        if g.GetReference() == fp.GetReference() or g.GetReference() in ignore or g.GetLayer() != pcbnew.F_Cu:
            continue
        L, T, R, B = bbox(g)
        if L >= r or R <= l or T >= b or B <= t:
            continue
        c = pcbnew.SHAPE_POLY_SET(a)
        c.BooleanIntersection(courtyard(g))
        if c.Area() > MM(0.01) * MM(0.01):
            out.append(g.GetReference())
    return out


def copper_free(board, x, y, half=1.6, layers=(pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.B_Cu)):
    """No track, via or pad in the square (fiducial keep-out)."""
    box = pcbnew.BOX2I(V(x - half, y - half), V(2 * half, 2 * half))
    for t in board.GetTracks():
        if (t.Type() == pcbnew.PCB_VIA_T or t.GetLayer() in layers) and t.GetBoundingBox().Intersects(box):
            return False
    for f in board.GetFootprints():
        if f.GetReference().startswith("FID"):
            continue
        for p in f.Pads():
            if p.GetBoundingBox().Intersects(box):
                return False
    return True


def find_spot(board, fp, near, window, rots=(0, 90), step=0.1, ignore=(), keep_out=(), ok=None):
    """Free spot (no courtyard overlap, inside the board) nearest to `near`."""
    best = None
    x0, y0, x1, y1 = window
    edge = pcbnew.SHAPE_POLY_SET(); board.GetBoardPolygonOutlines(edge, True)
    for rot in rots:
        fp.SetOrientationDegrees(rot)
        nx, ny = int((x1 - x0) / step), int((y1 - y0) / step)
        for i in range(nx + 1):
            for j in range(ny + 1):
                x, y = x0 + i * step, y0 + j * step
                d = math.hypot(x - near[0], y - near[1])
                if best and d >= best[0]:
                    continue
                fp.SetPosition(V(x, y))
                l, t, r, b = bbox(fp)
                if not all(edge.Contains(V(px, py)) for px, py in ((l, t), (r, t), (l, b), (r, b))):
                    continue
                if any(not (r <= kl or l >= kr or b <= kt or t >= kb) for kl, kt, kr, kb in keep_out):
                    continue
                if ok and not ok(x, y):
                    continue
                if not hits(board, fp, ignore):
                    best = (d, x, y, rot)
    if best:
        fp.SetOrientationDegrees(best[3]); fp.SetPosition(V(best[1], best[2]))
    return best


def clash_all(board, pads, clear=0.15):
    """Delete tracks and vias on any layer that come closer than `clear` to these pads (other nets)."""
    gone = set()
    for t in list(board.GetTracks()):
        for p in pads:
            if p.GetNetCode() and p.GetNetCode() == t.GetNetCode():
                continue
            if t.Type() == pcbnew.PCB_VIA_T:
                layers = [l for l in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu) if p.IsOnLayer(l)]
                if not layers:
                    continue
                q = t.GetPosition()
                d = p.GetEffectiveShape(layers[0]).Collide(pcbnew.SEG(q, q), MM(clear) + int(t.GetWidth(pcbnew.F_Cu) / 2))
            else:
                if not p.IsOnLayer(t.GetLayer()):
                    continue
                d = p.GetEffectiveShape(t.GetLayer()).Collide(pcbnew.SEG(t.GetStart(), t.GetEnd()), MM(clear) + int(t.GetWidth() / 2))
            if d:
                gone.add(t.GetNetname())
                board.Delete(t)
                break
    return gone


def pad(fps, ref, num):
    return [p for p in fps[ref].Pads() if p.GetNumber() == num][0]


def xy(p):
    q = p.GetPosition()
    return round(mm(q.x), 4), round(mm(q.y), 4)


def rename_copper(board, pins):
    """Nets the new schematic only renames (every pad moves to the same new name): rename tracks and zones too."""
    old2new = {}
    for fp in board.GetFootprints():
        for p in fp.Pads():
            want = pins.get((fp.GetReference(), p.GetNumber()))
            if want is not None and p.GetNetname():
                old2new.setdefault(p.GetNetname(), set()).add(want)
    ren = {o: next(iter(n)) for o, n in old2new.items() if len(n) == 1 and o not in n and o != "GND"}
    for o, n in ren.items():
        code = E.net_code(board, n)
        for t in board.GetTracks():
            if t.GetNetname() == o:
                t.SetNetCode(code)
        for z in board.Zones():
            if z.GetNetname() == o:
                z.SetNetCode(code)
    return ren


def apply():
    E.copy_project(WORK)
    shutil.copy(os.path.join(PROJ, f"{NAME}.kicad_pcb"), WORK)
    board = pcbnew.LoadBoard(os.path.join(WORK, f"{NAME}.kicad_pcb"))
    comps, pins = E.netlist()
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    print("renamed copper:", rename_copper(board, pins))

    for ref, c in comps.items():                                  # footprints, values, fields
        fp = fps.get(ref)
        if fp is None:
            continue
        if c["footprint"] and c["footprint"] != fp.GetFPIDAsString():
            print(f"  {ref}: footprint {fp.GetFPIDAsString()} -> {c['footprint']}")
            fps[ref] = fp = E.sync_pcb.swap(board, fp, c["footprint"])
        E.set_fields(fp, c)
    for ref in NEW:
        fps[ref] = E.new_footprint(board, ref, comps[ref], fps["R123"])

    # --- motor sockets and their corners
    for ref in PH:
        fps[ref].SetOrientationDegrees(0)
        fps[ref].SetPosition(V(*PH_AT[ref]))
    for ref, (x, y, r) in MOVES.items():
        fps[ref].SetOrientationDegrees(r); fps[ref].SetPosition(V(x, y))
    j = fps["J201"]
    j.SetOrientationDegrees(0)
    l, t, _, _ = bbox(j)
    p0 = j.GetPosition()
    j.SetPosition(pcbnew.VECTOR2I(p0.x + MM(J201_BOX[0] - l), p0.y + MM(J201_BOX[1] - t)))

    # --- U106 and its VDD parts
    u = fps["U106"]
    u.SetOrientationDegrees(270); u.SetPosition(V(*U106_AT))
    if xy(pad(fps, "U106", "5"))[1] < xy(pad(fps, "U106", "1"))[1]:
        u.SetOrientationDegrees(90)
    assert xy(pad(fps, "U106", "5"))[1] > U106_AT[1], "U106 pins 5-8 must face the XT30"
    # right of U106: C123 (BAT_N top / XB_VDD bottom), D108 (A top / K bottom), R127 (BAT_RAW top / XB_VDD bottom)
    x = bbox(u)[2] + 0.02
    for ref, rot in (("C123", 90), ("D108", 90), ("R127", 270)):
        f = fps[ref]
        f.SetOrientationDegrees(rot); f.SetPosition(V(130, 112.95))
        l = bbox(f)[0]
        f.SetPosition(V(130 + (x - l), 112.95))
        x = bbox(f)[2] + 0.02
    print("  region R ends at x", round(x, 2), "(BAT_RAW strip keeps", round(130.85 - x, 2), "mm)")

    # --- D107 / R123 beside Q105 (BATP_EN), FID102 somewhere quiet in the top-right
    for ref in ("D107", "R123"):
        print(f"  {ref} ->", find_spot(board, fps[ref], (144.0, 106.3), (138.0, 95.0, 156.0, 113.0)))
    fid = fps["FID102"]
    o = fid.GetPosition(); old = pcbnew.VECTOR2I(o.x, o.y)
    keep = [bbox(fps[r]) for r in PH]
    print("  FID102 ->", find_spot(board, fid, (163.0, 72.0), (146.0, 66.8, 170.0, 121.0), rots=(0,), step=0.2, keep_out=keep,
                                   ok=lambda x, y: copper_free(board, x, y)))
    n = fid.GetPosition()
    d = pcbnew.VECTOR2I(n.x - old.x, n.y - old.y)
    for z in board.Zones():                                        # its copper keep-out moves with it
        c = z.GetBoundingBox().GetCenter()
        if z.GetIsRuleArea() and abs(c.x - old.x) < MM(0.3) and abs(c.y - old.y) < MM(0.3):
            z.Move(d); print("  FID102 keep-out moved")

    for ref in list(PH) + list(NEW) + ["J201", "D107", "R123", "C204", "C117", "FID102"]:
        print(f"  {ref:6s} courtyard", [round(v, 2) for v in bbox(fps[ref])], "overlaps", hits(board, fps[ref]))

    # --- nets from the schematic
    touched = set()
    for ref, fp in fps.items():
        for p in fp.Pads():
            want = pins.get((ref, p.GetNumber()))
            if want is None or p.GetNetname() == want:
                continue
            touched.update({p.GetNetname(), want})
            p.SetNetCode(E.net_code(board, want))
    moved = list(PH) + list(NEW) + ["J201", "D107", "R123", "C204"]
    touched |= {p.GetNetname() for r in moved for p in fps[r].Pads()}
    renetted = [p for ref, fp in fps.items() for p in fp.Pads() if ref not in moved and p.GetNetname() == "BAT_N"]
    touched.discard("")
    touched |= E.cut_conflicts(board)
    touched |= clash_all(board, [p for r in moved for p in fps[r].Pads()] + renetted)
    for x_, y_, nn in DEAD_VIAS:
        E.del_via(board, x_, y_, nn)

    # --- hand links around U106 (the routers have no room there)
    bar_y = xy(pad(fps, "U106", "1"))[1] - 0.55
    xs = sorted(xy(pad(fps, "U106", k))[0] for k in "1234")
    E.add_track(board, [(xs[0], bar_y), (xs[-1], bar_y)], "GND", 0.6)                 # VM pins together
    for vx in (121.0, 124.3):                                                         # and down to In1 (GND plane)
        E.add_track(board, [(vx, bar_y), (vx, 106.88)], "GND", 0.5)
        E.add_via(board, vx, 106.88, "GND")
    VDD, BN = pins[("U106", "6")], pins[("U106", "5")]
    print("  net names:", VDD, BN)
    p6x, p6y = xy(pad(fps, "U106", "6"))
    c1, c2 = xy(pad(fps, "C123", "1")), xy(pad(fps, "C123", "2"))
    dk, da = xy(pad(fps, "D108", "1")), xy(pad(fps, "D108", "2"))
    r1, r2 = xy(pad(fps, "R127", "1")), xy(pad(fps, "R127", "2"))
    p8 = xy(pad(fps, "U106", "8"))
    E.add_track(board, [(p6x, p6y), (p6x, 115.05)], VDD, 0.2)                   # VDD: down, under on B.Cu, up
    E.add_via(board, p6x, 115.05, VDD)
    E.add_track(board, [(p6x, 115.05), (c1[0], 115.05)], VDD, 0.2, pcbnew.B_Cu)
    E.add_via(board, c1[0], 115.05, VDD)
    E.add_track(board, [(c1[0], 115.05), c1], VDD, 0.2)
    E.add_track(board, [c1, (dk[0], c1[1]), dk], VDD, 0.2)
    E.add_track(board, [dk, (r2[0], dk[1]), r2], VDD, 0.2)
    E.add_track(board, [(p8[0], c2[1]), c2], BN, 0.3)                           # C123 / D108 to the cell's minus
    E.add_track(board, [c2, (da[0], c2[1]), da], BN, 0.25)
    print("  pads: U106.6", (p6x, p6y), "C123", c1, c2, "D108", dk, da, "R127", r1, r2)

    # --- copper areas: BAT_N under U106 and round the XT30's minus pin; the BAT_RAW strip widened past the small parts
    route_pcb.zone(board, BN, pcbnew.F_Cu, [(119.6, 109.85), (125.45, 109.85), (125.45, 121.2), (119.6, 121.2)],
                   priority=3, thermal=False, name="BAT_N (cell minus)")
    for z in board.Zones():
        if z.GetNetname() == "BAT_RAW" and z.GetLayer() == pcbnew.F_Cu and not z.GetIsRuleArea():
            o = z.Outline(); o.RemoveAllContours(); o.NewOutline()
            for px, py in ((125.5, 107.75), (129.3, 107.75), (129.3, 111.25), (130.85, 111.25), (130.85, 114.65), (129.3, 114.65),
                           (129.3, 119.7), (125.5, 119.7)):
                o.Append(MM(px), MM(py))
            print("  BAT_RAW strip reshaped")

    print("nets touched", sorted(touched))
    print("copper islands removed", E.drop_islands(board, touched))
    json.dump(sorted(touched), open(os.path.join(WORK, "touched.json"), "w"))
    E.save(board, 1)


def text_at(board, layer, txt, pos, size, rot=0.0, like=None, mirrored=False):
    t = like.Duplicate() if like is not None else pcbnew.PCB_TEXT(board)
    t.SetText(txt); t.SetLayer(layer); t.SetMirrored(mirrored)
    t.SetTextSize(pcbnew.VECTOR2I(MM(size), MM(size))); t.SetTextThickness(MM(0.18 if size >= 0.9 else 0.15))
    t.SetTextAngleDegrees(rot); t.SetPosition(V(*pos))
    board.Add(t)
    return t


def find_text(board, layer, txt):
    got = [d for d in board.GetDrawings() if d.GetClass() == "PCB_TEXT" and d.GetLayer() == layer and d.GetText() == txt]
    assert len(got) == 1, (txt, len(got))
    return got[0]


def prune_net(board, net, layers=(pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)):
    """Delete track segments of one net that have a free end (no pad, via or other track of the net there)."""
    code = board.FindNet(net).GetNetCode()
    gone, changed = 0, True
    while changed:
        changed = False
        tracks = [t for t in board.GetTracks() if t.GetNetCode() == code]
        pads = [p for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() == code]
        for t in tracks:
            if t.Type() == pcbnew.PCB_VIA_T or t.GetLayer() not in layers:
                continue
            for pt in (t.GetStart(), t.GetEnd()):
                touch = E.on_pad(pt, t.GetLayer(), pads) + [o for o in tracks if o.m_Uuid.AsString() != t.m_Uuid.AsString() and (
                    (o.Type() == pcbnew.PCB_VIA_T and o.HitTest(pt)) or
                    (o.Type() != pcbnew.PCB_VIA_T and o.GetLayer() == t.GetLayer() and o.HitTest(pt, 0)))]
                if not touch:
                    board.Delete(t); gone += 1; changed = True
                    break
            if changed:
                break
    return gone


def restore_vias(board, skip=()):
    """route_pcb.drop_dangling (inside E.prune_dead_ends) deletes every non-GND via without two track ends, board-wide,
    including vias that join a track to a pour. Put back each via of the V2.1 board that is missing and still clear."""
    base = pcbnew.LoadBoard(os.path.join(PROJ, f"{NAME}.kicad_pcb"))
    have = {(v.GetPosition().x, v.GetPosition().y) for v in board.GetTracks() if v.Type() == pcbnew.PCB_VIA_T}
    cu = route_pcb.Copper(board)
    back = []
    for v in base.GetTracks():
        q = v.GetPosition()
        if v.Type() != pcbnew.PCB_VIA_T or (q.x, q.y) in have or board.FindNet(v.GetNetname()) is None:
            continue
        if any(abs(mm(q.x) - x) < 0.05 and abs(mm(q.y) - y) < 0.05 for x, y, _ in skip):
            continue
        n = pcbnew.PCB_VIA(board)
        n.SetPosition(pcbnew.VECTOR2I(q.x, q.y)); n.SetWidth(v.GetWidth(pcbnew.F_Cu)); n.SetDrill(v.GetDrill())
        n.SetNetCode(board.FindNet(v.GetNetname()).GetNetCode())
        if all(cu.clear(n, l, MM(0.2)) for l in (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)):
            board.Add(n); cu.items.append((n, n.GetNetCode(), route_pcb._bb(n)))
            back.append((v.GetNetname(), round(mm(q.x), 3), round(mm(q.y), 3)))
    return back


def fix():
    """Links the routers left: +BATT meets on the In2 area now (its F.Cu junction was where U106 is), +3V3 to the
    moved sockets, the BAT_N returns of the input-protection parts, D107 to BATP_S; then pours and stitching."""
    board = pcbnew.LoadBoard(stage(3))
    print("  vias restored:", restore_vias(board, DEAD_VIAS))
    for net, ref, num, w in (("+3V3", "J301", "3", 0.25), ("+3V3", "J302", "3", 0.25), ("+3V3", "J201", "2", 0.25),
                             ("+3V3", "C204", "1", 0.25), ("+3V3", "D201", "4", 0.25),
                             ("BAT_N", "R124", "2", 0.2), ("BAT_N", "Q105", "2", 0.2), ("BAT_N", "U105", "2", 0.2),
                             ("BATP_S", "D107", "2", 0.2)):
        E.route_island(board, net, ref, num, w, margin=8.0)
    for net in ("+3V3", "BAT_N", "BATP_S"):
        print(f"  {net} dead ends removed:", prune_net(board, net))
    for net in ("+3V3",):                                       # J201's old +3V3 stub: no pad, no via any more
        for cl in route_pcb._clusters(board, board.FindNet(net).GetNetCode()):
            if not any(i.Type() in (pcbnew.PCB_PAD_T, pcbnew.PCB_VIA_T) for i in cl):
                ids = {i.m_Uuid.AsString() for i in cl}
                for t in list(board.GetTracks()):
                    if t.m_Uuid.AsString() in ids:
                        board.Delete(t)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    print("  GND island vias:", route_pcb.stitch_islands(board, [pcbnew.F_Cu, pcbnew.B_Cu]))
    touched = json.load(open(os.path.join(WORK, "touched.json")))
    print("  pruned", E.prune_dead_ends(board, touched))
    print("  vias restored again:", restore_vias(board, DEAD_VIAS))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 4)


WEST_LINK = [(115.561, 110.759), (116.1, 111.3), (116.1, 112.45), (121.5, 112.45), (122.0, 111.95), (131.9, 111.95), (132.947, 110.827)]


def fix2():
    """+BATT: the boost side (West via) to Q104's via on B.Cu, 0.8 mm (the old F.Cu junction under U106 was 0.3 mm);
    the charger branch by the grid router."""
    board = pcbnew.LoadBoard(stage(4))
    E.add_track(board, WEST_LINK, "+BATT", 0.8, pcbnew.B_Cu)
    print("  +BATT dead ends removed:", prune_net(board, "+BATT", layers=(pcbnew.F_Cu,)))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 5)


def route2(src, dst, nets):
    """Freerouting for a few nets only, everything else fixed (as eco_v21.route)."""
    import subprocess
    b = pcbnew.LoadBoard(stage(src))
    for z in list(b.Zones()):
        if not z.GetIsRuleArea():
            b.Delete(z)
    for t in b.GetTracks():
        t.SetLocked(True)
    for fp in b.GetFootprints():
        for p in fp.Pads():
            if p.GetNetname() in E.ZONE_NETS and p.GetNetname() not in nets:
                p.SetNetCode(0)
    pre = {E.key(t) for t in b.GetTracks()}
    dsn, ses = os.path.join(WORK, "r2.dsn"), os.path.join(WORK, "r2.ses")
    pcbnew.ExportSpecctraDSN(b, dsn)
    r = subprocess.run(["java", "-Djava.awt.headless=true", "-jar", E.FREEROUTING, "-de", dsn, "-do", ses, "-mp", "20"],
                       capture_output=True, text=True, timeout=1800)
    print("\n".join(l for l in (r.stdout + r.stderr).splitlines() if any(n in l for n in nets) and "unrouted" in l))
    pcbnew.ImportSpecctraSES(b, ses)
    new = [t for t in b.GetTracks() if E.key(t) not in pre and t.GetNetname() in nets]
    a = pcbnew.LoadBoard(stage(src))
    for t in new:
        code = a.FindNet(t.GetNetname()).GetNetCode()
        if t.Type() == pcbnew.PCB_VIA_T:
            v = pcbnew.PCB_VIA(a); v.SetPosition(t.GetPosition()); v.SetWidth(t.GetWidth(pcbnew.F_Cu)); v.SetDrill(t.GetDrill())
            v.SetNetCode(code); a.Add(v)
        else:
            n = pcbnew.PCB_TRACK(a); n.SetStart(t.GetStart()); n.SetEnd(t.GetEnd()); n.SetWidth(t.GetWidth())
            n.SetLayer(t.GetLayer()); n.SetNetCode(code); a.Add(n)
    print("  new copper:", len(new), "items on", sorted({t.GetNetname() for t in new}))
    pcbnew.ZONE_FILLER(a).Fill(a.Zones())
    E.save(a, dst)


def connect(board, net, ref, num, width, win, clr=0.15, step=0.05):
    """A* from the copper island holding ref.num to any other island of the net inside the window (F/In2/B, vias)."""
    code = board.FindNet(net).GetNetCode()
    cls = route_pcb._clusters(board, code)
    mine = [c for c in cls if any(i.Type() == pcbnew.PCB_PAD_T and i.GetParentFootprint().GetReference() == ref
                                  and i.GetNumber() == num for i in c)]
    if not mine or len(cls) < 2:
        return "already joined"
    orphan = mine[0]
    others = [i for c in cls if c is not orphan for i in c]
    inside = lambda q: win[0] < q[0] < win[2] and win[1] < q[1] < win[3]   # noqa: E731
    starts = [q for q in route_pcb._terminals(orphan) if inside(q)]
    goals = [q for q in route_pcb._terminals(others) if inside(q)]
    if not starts or not goals:
        return "no terminals in window"
    g = route_pcb.miniroute.Grid(board, code, win, width, clr, route_pcb.PL.on_board, step=step)
    for it in orphan + others:
        if it.Type() == pcbnew.PCB_PAD_T:
            g.open_pad(it)
    path = g.route([q[:3] for q in starts], [q[:3] for q in goals])
    if not path:
        return "no path"
    sp = min(starts, key=lambda q: math.hypot(q[0] - path[0][0], q[1] - path[0][1]) + (0 if q[2] == path[0][2] else 9))
    ep = min(goals, key=lambda q: math.hypot(q[0] - path[-1][0], q[1] - path[-1][1]) + (0 if q[2] == path[-1][2] else 9))
    route_pcb.miniroute.commit(board, code, path, width, sp[3], ep[3])
    return "routed"


def fix3():
    """BAT_N returns and BATP_S for D107 in the crowded corner by Q105/U105 (Freerouting found no way in)."""
    board = pcbnew.LoadBoard(stage(6))
    win = (137.0, 92.0, 156.0, 115.0)
    for net, ref, num in (("BAT_N", "R124", "2"), ("BAT_N", "Q105", "2"), ("BAT_N", "U105", "2"), ("BATP_S", "D107", "2")):
        r = "no path"
        for w, st in ((0.2, 0.05), (0.15, 0.05), (0.15, 0.025)):
            r = connect(board, net, ref, num, w, win, step=st)
            if r != "no path":
                break
        print(f"  {net} {ref}.{num}: {r}")
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 7)


def del_ends(board, net, pts, tol=0.02):
    """Delete the tracks of a net with an end at one of these points."""
    n = 0
    for t in list(board.GetTracks()):
        if t.Type() == pcbnew.PCB_VIA_T or t.GetNetname() != net:
            continue
        if any(any(abs(mm(q.x) - x) < tol and abs(mm(q.y) - y) < tol for q in (t.GetStart(), t.GetEnd())) for x, y in pts):
            board.Delete(t); n += 1
    return n


def del_segs(board, net, segs, layer=None, tol=0.02):
    """Delete the tracks of a net whose two ends match one of these ((x0, y0), (x1, y1))."""
    def near(q, p):
        return abs(mm(q.x) - p[0]) < tol and abs(mm(q.y) - p[1]) < tol
    n = 0
    for t in list(board.GetTracks()):
        if t.Type() == pcbnew.PCB_VIA_T or t.GetNetname() != net or (layer is not None and t.GetLayer() != layer):
            continue
        for a, b in segs:
            if (near(t.GetStart(), a) and near(t.GetEnd(), b)) or (near(t.GetStart(), b) and near(t.GetEnd(), a)):
                board.Delete(t); n += 1
                break
    return n


def fix3b():
    """Turn R124 (180 deg) and Q105 (to 270 deg) so their BAT_N pads face BAT_N copper, then relink by hand (the corner
    is full on all three layers). New links first, then the old segments, then pruning."""
    board = pcbnew.LoadBoard(stage(7))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    fps["R124"].SetOrientationDegrees(270)                     # pad 2 (BAT_N) now at the bottom, beside C121.2
    fps["Q105"].SetOrientationDegrees(270)                     # 1 gate right-top, 2 source left-top, 3 drain bottom
    for r in ("R124", "Q105"):
        print(f"  {r}", [(p.GetNumber(), p.GetNetname(), xy(p)) for p in fps[r].Pads()], "overlaps", hits(board, fps[r]))
    F, B = pcbnew.F_Cu, pcbnew.B_Cu
    # new links
    E.add_track(board, [(151.015, 111.135), (149.735, 111.555)], "BAT_N", 0.2)                       # R124.2 - C121.2
    E.add_track(board, [(151.015, 110.115), (150.3, 110.4), (149.0, 110.4), (148.775, 110.9), (148.775, 111.555)], "BATP_EN", 0.2)
    E.add_track(board, [(143.375, 102.6), (142.375, 101.85), (142.375, 100.095), (142.65, 100.095)], "BAT_N", 0.15)  # Q105 S
    E.add_track(board, [(145.275, 103.2), (144.97, 103.2), (144.2, 103.48)], "BATP_EN", 0.2)          # Q105 G
    E.add_via(board, 144.2, 103.48, "BATP_EN")                                                       # onto In2 BATP_EN
    E.add_track(board, [(144.325, 104.5), (144.9, 104.5), (145.6, 104.233), (147.1, 105.733)], "Net-(Q103-G)", 0.2)  # Q105 D
    E.add_via(board, 146.75, 105.383, "Net-(Q103-G)")
    E.add_track(board, [(144.76, 102.842), (145.4, 103.0), (146.75, 105.383)], "Net-(Q103-G)", 0.2, B)
    # old segments at the turned pads
    n = del_segs(board, "BATP_EN", [((142.949, 102.945), (143.387, 102.945)), ((143.387, 102.945), (143.962, 103.519)),
                                    ((143.962, 103.519), (143.962, 103.936)), ((143.962, 103.936), (145.571, 105.544)),
                                    ((141.703, 104.191), (142.949, 102.945)),
                                    ((151.015, 111.135), (150.845, 110.965)), ((150.845, 110.965), (149.519, 110.965)),
                                    ((149.519, 110.965), (149.462, 110.965)), ((149.462, 110.965), (149.448, 110.979)),
                                    ((149.448, 110.979), (149.351, 110.979)), ((149.351, 110.979), (148.775, 111.555))])
    n += del_segs(board, "Net-(Q103-G)", [((145.262, 103.895), (145.051, 103.683)), ((145.051, 103.683), (145.051, 103.133)),
                                          ((145.262, 103.895), (147.1, 105.733))])
    n += del_segs(board, "Net-(Q103-G)", [((145.051, 103.133), (144.76, 102.842))], B)
    E.del_via(board, 145.051, 103.133, "Net-(Q103-G)")
    print("  old segments removed:", n)
    for net in ("BATP_EN", "Net-(Q103-G)", "BAT_N"):
        print(f"  {net} dead ends:", prune_net(board, net))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 7)


RIP = ("BATP_EN", "BAT_N", "Net-(Q103-G)", "Net-(U105-INA+)", "BATP_S", "Net-(D107-K)")


def rip():
    """Clear the input-protection control nets east of Q104 (and BAT_N's / the gate net's long B.Cu and In2 runs) so
    Freerouting can lay them out together; U106's own BAT_N links and the Q103/Q104 local copper stay."""
    board = pcbnew.LoadBoard(stage(7))
    n = 0
    for t in list(board.GetTracks()):
        net = t.GetNetname()
        if net not in RIP:
            continue
        pts = [t.GetPosition()] if t.Type() == pcbnew.PCB_VIA_T else [t.GetStart(), t.GetEnd()]
        east = any(mm(q.x) > 133.0 for q in pts)
        inner = t.Type() != pcbnew.PCB_VIA_T and t.GetLayer() in (pcbnew.In2_Cu, pcbnew.B_Cu)
        far_via = t.Type() == pcbnew.PCB_VIA_T and mm(t.GetPosition().x) > 129.0
        if east or (net in ("BAT_N", "Net-(Q103-G)") and (inner or far_via)) or (net == "BAT_N" and t.Type() == pcbnew.PCB_VIA_T):
            board.Delete(t); n += 1
    print("  ripped", n)
    for net in RIP:
        print(f"  {net} dead ends:", prune_net(board, net))
    E.save(board, 10)


def safe_add(board, net, legs, clr=0.2):
    """Add tracks/vias only if every piece clears other nets' copper on its layers; returns the clashes otherwise."""
    code = board.FindNet(net).GetNetCode()
    cu = route_pcb.Copper(board)
    items = []
    for kind, data in legs:
        if kind == "v":
            v = pcbnew.PCB_VIA(board); v.SetPosition(V(*data)); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNetCode(code)
            items.append((v, (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)))
        else:
            layer, w, pts = data
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                t = pcbnew.PCB_TRACK(board); t.SetStart(V(x0, y0)); t.SetEnd(V(x1, y1)); t.SetWidth(MM(w)); t.SetLayer(layer)
                t.SetNetCode(code); items.append((t, (layer,)))
    bad = []
    for it, layers in items:
        for l in layers:
            sh = it.GetEffectiveShape(l)
            for o, n, ib in cu.items:
                if n != code and o.IsOnLayer(l) and sh.Collide(o.GetEffectiveShape(l), MM(clr)):
                    bad.append((board.GetLayerName(l), o.GetNetname(), round(mm(o.GetPosition().x), 2), round(mm(o.GetPosition().y), 2)))
    if not bad:
        for it, _ in items:
            board.Add(it)
    return bad


def place2():
    """On the ripped board: R124 in parallel under C121, Q105 beside R122/C121 (all its nets are there), D107 turned so
    the cathode faces R123 and the anode drops to the BATP_S B.Cu run."""
    board = pcbnew.LoadBoard(stage(10))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    r = fps["R124"]; r.SetOrientationDegrees(0); r.SetPosition(V(149.255, 112.55))
    print("  R124", [(p.GetNumber(), p.GetNetname(), xy(p)) for p in r.Pads()], "overlaps", hits(board, r))
    q = fps["Q105"]
    print("  Q105 ->", find_spot(board, q, (152.0, 113.6), (146.0, 106.0, 158.0, 116.0), rots=(0, 90, 180, 270), step=0.1),
          [(p.GetNumber(), p.GetNetname(), xy(p)) for p in q.Pads()])
    d = fps["D107"]; d.SetOrientationDegrees(180)
    print("  D107", [(p.GetNumber(), p.GetNetname(), xy(p)) for p in d.Pads()], "overlaps", hits(board, d))
    for net in RIP:                                            # copper left on the moved pads
        prune_net(board, net)
    E.cut_conflicts(board)
    a = xy([p for p in d.Pads() if p.GetNumber() == "2"][0])
    print("  D107 anode via:", safe_add(board, "BATP_S", [("t", (pcbnew.F_Cu, 0.2, [a, (143.6, 107.2)])), ("v", (143.6, 107.2))]) or "added")
    E.save(board, 12)


def silk_boxes(board):
    out = []
    for d in board.GetDrawings():
        if d.GetLayer() == pcbnew.F_SilkS:
            bb = d.GetBoundingBox()
            if mm(bb.GetWidth()) < 15 and mm(bb.GetHeight()) < 15:
                out.append((mm(bb.GetLeft()), mm(bb.GetTop()), mm(bb.GetRight()), mm(bb.GetBottom())))
    return out


def place_near_nets(board, fp, window, rots=(0, 90, 180, 270), step=0.1, clr=0.2, skip_nets=(), avoid_silk=False):
    """Spot with no courtyard overlap and every pad clear of other nets' copper, closest to copper of its own nets."""
    cu = route_pcb.Copper(board)
    own = {}
    for o, n, ib in cu.items:
        own.setdefault(n, []).append(o)
    mine = {p.GetNumber(): p.GetNetCode() for p in fp.Pads()}
    edge = pcbnew.SHAPE_POLY_SET(); board.GetBoardPolygonOutlines(edge, True)
    best = None
    silk = silk_boxes(board) if avoid_silk else []
    x0, y0, x1, y1 = window
    for rot in rots:
        fp.SetOrientationDegrees(rot)
        for i in range(int((x1 - x0) / step) + 1):
            for j in range(int((y1 - y0) / step) + 1):
                fp.SetPosition(V(x0 + i * step, y0 + j * step))
                l, t, r, b = bbox(fp)
                if not all(edge.Contains(V(px, py)) for px, py in ((l, t), (r, t), (l, b), (r, b))):
                    continue
                if any(not (r <= sl or l >= sr or b <= st or t >= sb) for sl, st, sr, sb in silk):
                    continue
                score, ok = 0.0, True
                for p in fp.Pads():
                    sh = p.GetEffectiveShape(pcbnew.F_Cu)
                    pb = p.GetBoundingBox(); pb.Inflate(MM(clr + 0.5))
                    for o, n, ib in cu.items:
                        if n == p.GetNetCode() or o.GetParentFootprint() is not None and o.Type() == pcbnew.PCB_PAD_T \
                                and o.GetParentFootprint().GetReference() == fp.GetReference():
                            continue
                        if not o.IsOnLayer(pcbnew.F_Cu) or not o.GetBoundingBox().Intersects(pb):
                            continue
                        if sh.Collide(o.GetEffectiveShape(pcbnew.F_Cu), MM(clr)):
                            ok = False; break
                    if not ok:
                        break
                    q = p.GetPosition()
                    score += min((math.hypot(mm(q.x - o.GetPosition().x), mm(q.y - o.GetPosition().y)) for o in own.get(p.GetNetCode(), [])
                                  if not (o.Type() == pcbnew.PCB_PAD_T and o.GetParentFootprint().GetReference() == fp.GetReference())),
                                 default=20.0)
                if not ok or (best and score >= best[0]):
                    continue
                if not hits(board, fp):
                    best = (score, x0 + i * step, y0 + j * step, rot)
    if best:
        fp.SetOrientationDegrees(best[3]); fp.SetPosition(V(best[1], best[2]))
    return best


def place3():
    board = pcbnew.LoadBoard(stage(10))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    for ref, win in (("R124", (146.5, 108.0, 154.0, 115.0)), ("Q105", (140.0, 98.0, 156.0, 116.0)), ("D107", (140.0, 100.0, 152.0, 112.0))):
        got = place_near_nets(board, fps[ref], win, step=0.2 if ref == "Q105" else 0.1)
        print(f"  {ref} ->", got, [(p.GetNumber(), p.GetNetname(), xy(p)) for p in fps[ref].Pads()])
    for net in RIP:
        prune_net(board, net)
    E.cut_conflicts(board)
    E.save(board, 12)


def spine():
    board = pcbnew.LoadBoard(stage(13))
    for st, w in ((0.1, 0.2), (0.05, 0.2), (0.05, 0.15)):
        r = connect(board, "BAT_N", "J102", "1", w, (118.0, 104.0, 156.0, 117.5), step=st)
        print(f"  BAT_N spine (step {st}, {w} mm): {r}")
        if r != "no path":
            break
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 14)


def fix5():
    """D201/C204 +3V3 back to the 3.3 V copper (cut by the PH socket), and a via in each GND island."""
    board = pcbnew.LoadBoard(stage(15))
    for st in (0.1, 0.05):
        r = connect(board, "+3V3", "C204", "1", 0.25, (102.6, 66.8, 125.0, 80.0), step=st)
        print(f"  +3V3 C204/D201: {r}")
        if r != "no path":
            break
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    print("  GND island vias:", route_pcb.stitch_islands(board, [pcbnew.F_Cu, pcbnew.B_Cu]))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 15)


def place4():
    """As place3, with the spots it found for R124 and D107, and Q105 kept off the silkscreen labels."""
    board = pcbnew.LoadBoard(stage(10))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    fps["R124"].SetOrientationDegrees(0); fps["R124"].SetPosition(V(150.1, 112.5))
    fps["D107"].SetOrientationDegrees(270); fps["D107"].SetPosition(V(147.4, 107.2))
    got = place_near_nets(board, fps["Q105"], (138.0, 96.0, 158.0, 116.0), step=0.2, avoid_silk=True)
    print("  Q105 ->", got, [(p.GetNumber(), p.GetNetname(), xy(p)) for p in fps["Q105"].Pads()])
    for ref in ("R124", "D107", "Q105"):
        print(f"  {ref} overlaps", hits(board, fps[ref]))
    for net in RIP:
        prune_net(board, net)
    E.cut_conflicts(board)
    E.save(board, 12)


def final():
    """Silk, zone and pad clean-up after routing (stage 16 -> 17)."""
    board = pcbnew.LoadBoard(stage(16))
    F, B = pcbnew.F_SilkS, pcbnew.B_SilkS
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    # the BAT_RAW strip still carried the old net name; give it BAT_RAW and reshape it past the small parts
    for z in board.Zones():
        if z.GetNetname() in ("Net-(D107-A)", "BAT_RAW") and z.GetLayer() == pcbnew.F_Cu and not z.GetIsRuleArea():
            z.SetNet(board.FindNet("BAT_RAW")); z.SetZoneName("BAT_RAW")
            o = z.Outline(); o.RemoveAllContours(); o.NewOutline()
            for px, py in ((125.5, 107.75), (129.3, 107.75), (129.3, 111.25), (130.85, 111.25), (130.85, 114.65), (129.3, 114.65),
                           (129.3, 119.7), (125.5, 119.7)):
                o.Append(MM(px), MM(py))
            print("  BAT_RAW strip:", z.GetNetname())
    m2 = find_text(board, F, "MOTOR 2"); m2.SetTextSize(pcbnew.VECTOR2I(MM(0.8), MM(0.8)))
    find_text(board, F, "EXP A").SetPosition(V(123.3, 69.0))
    find_text(board, F, "EXP B").SetPosition(V(149.0, 69.0))
    find_text(board, B, "EXP A").SetPosition(V(113.8, 71.15))
    find_text(board, B, "EXP B").SetPosition(V(158.4, 71.15))
    for ref in ("J301", "J302"):                                # solid GND pin: no sliver between spokes and the keep-out
        [p for p in fps[ref].Pads() if p.GetNumber() == "6"][0].SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
    # board silk lines (the inner edge line) under the PH sockets and J201: clip them to the courtyards
    boxes = [bbox(fps[r]) for r in ("J301", "J302", "J201")]
    cut = 0
    for d in list(board.GetDrawings()):
        if d.GetLayer() != F or d.GetClass() != "PCB_SHAPE" or d.GetShapeStr() != "Line":
            continue
        a, b = d.GetStart(), d.GetEnd()
        ax, ay, bx, by = mm(a.x), mm(a.y), mm(b.x), mm(b.y)
        for l, t, r, bt in boxes:
            ina = l - 0.2 <= ax <= r + 0.2 and t - 0.2 <= ay <= bt + 0.2
            inb = l - 0.2 <= bx <= r + 0.2 and t - 0.2 <= by <= bt + 0.2
            if ina and inb:
                board.Delete(d); cut += 1
                break
            if (ina or inb) and abs(ay - by) < 0.01:              # horizontal line poking in: stop it at the box edge
                if ina:
                    d.SetStart(V(l - 0.25 if ax > bx else r + 0.25, ay))
                else:
                    d.SetEnd(V(l - 0.25 if bx > ax else r + 0.25, by))
                cut += 1
                break
            if (ina or inb) and abs(ax - bx) < 0.01:              # vertical line
                if ina:
                    d.SetStart(V(ax, t - 0.25 if ay > by else bt + 0.25))
                else:
                    d.SetEnd(V(bx, t - 0.25 if by > ay else bt + 0.25))
                cut += 1
                break
    print("  silk lines clipped:", cut)
    print("  dangling vias removed:", route_pcb.drop_dangling(board) if False else 0)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 17)


def place5():
    """Q105 stays where it was; R124 and D107 at place3's spots, R123 next to D107, and a BAT_N via beside Q105's source
    (checked against every other net on F/In2/B) so Freerouting can reach it."""
    board = pcbnew.LoadBoard(stage(10))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    fps["R124"].SetOrientationDegrees(0); fps["R124"].SetPosition(V(150.1, 112.5))
    fps["D107"].SetOrientationDegrees(270); fps["D107"].SetPosition(V(147.4, 107.2))
    o = fps["R123"].GetPosition(); r0 = fps["R123"].GetOrientationDegrees()
    got = place_near_nets(board, fps["R123"], (144.5, 103.5, 151.0, 110.5), step=0.1, avoid_silk=True)
    if not got:
        fps["R123"].SetPosition(o); fps["R123"].SetOrientationDegrees(r0)
    print("  R123 ->", got, [(p.GetNumber(), p.GetNetname(), xy(p)) for p in fps["R123"].Pads()])
    for ref in ("R124", "D107", "R123", "Q105"):
        print(f"  {ref} overlaps", hits(board, fps[ref]))
    for net in RIP:
        prune_net(board, net)
    E.cut_conflicts(board)
    src = xy([p for p in fps["Q105"].Pads() if p.GetNumber() == "2"][0])
    done = None
    for rad in (0.8, 1.0, 1.2, 1.4, 1.7, 2.0, 2.4):
        for k in range(48):
            ang = 2 * math.pi * k / 48
            vx, vy = src[0] + rad * math.cos(ang), src[1] + rad * math.sin(ang)
            vq = V(vx, vy)
            if any(p.GetEffectiveShape(pcbnew.F_Cu).Collide(pcbnew.SEG(vq, vq), MM(0.4)) for p in fps["Q105"].Pads()):
                continue                                       # no via in or touching a pad (PCBWay EQ, 2026-10-08)
            for w in (0.2, 0.15):
                if not safe_add(board, "BAT_N", [("t", (pcbnew.F_Cu, w, [src, (vx, vy)])), ("v", (vx, vy))], clr=0.15):
                    done = (round(vx, 2), round(vy, 2), w); break
            if done:
                break
        if done:
            break
    print("  Q105 source via:", done)
    # the V2.1 routing of these nets was complete: put back every piece east of Q104 that still clears everything
    base = pcbnew.LoadBoard(os.path.join(PROJ, f"{NAME}.kicad_pcb"))
    back = 0
    for t in base.GetTracks():
        net = t.GetNetname()
        if net not in ("Net-(U105-INA+)", "BATP_S", "Net-(Q103-G)", "BATP_EN", "Net-(D107-K)"):
            continue
        pts = [t.GetPosition()] if t.Type() == pcbnew.PCB_VIA_T else [t.GetStart(), t.GetEnd()]
        if not any(mm(q.x) > 133.0 for q in pts):
            continue
        if t.Type() == pcbnew.PCB_VIA_T:
            leg = [("v", (mm(t.GetPosition().x), mm(t.GetPosition().y)))]
        else:
            leg = [("t", (t.GetLayer(), mm(t.GetWidth()), [(mm(t.GetStart().x), mm(t.GetStart().y)), (mm(t.GetEnd().x), mm(t.GetEnd().y))]))]
        if not safe_add(board, net, leg, clr=0.15):
            back += 1
    print("  V2.1 control-net copper put back:", back)
    # R103's GND went through R124/C121's old GND pads (BAT_N now): its old run via R124's old spot, before routing
    del_segs(board, "GND", [((151.649, 111.473), (151.397, 111.726))])
    bad = safe_add(board, "GND", [("t", (pcbnew.F_Cu, 0.3, [(149.785, 110.365), (150.035, 110.115), (151.015, 110.115), (151.731, 109.399)]))])
    print("  R103.2 GND run:", bad or "added")
    E.save(board, 12)


def polish():
    """Last links and tidy-ups on stage 17 -> 18."""
    board = pcbnew.LoadBoard(stage(17))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    for net, ref, num in (("BATP_EN", "Q105", "1"), ("BATP_S", "U105", "5")):
        for st in (0.1, 0.05):
            r = connect(board, net, ref, num, 0.2, (137.0, 93.0, 156.0, 114.0), step=st)
            if r != "no path":
                break
        print(f"  {net} {ref}.{num}: {r}")
    E.del_via(board, 110.41, 72.77, "MOTA_P")
    for t in list(board.GetTracks()):                          # any other dangling MOTA_P via near there
        if t.Type() == pcbnew.PCB_VIA_T and t.GetNetname() == "MOTA_P" and abs(mm(t.GetPosition().x) - 110.41) < 0.05:
            board.Delete(t)
    [p for p in fps["J406"].Pads() if p.GetNumber() == "2"][0].SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 18)


def polish2():
    """U105.5 (BATP_S) was boxed in by INA+'s loop over the top: INA+ now leaves U105.4 downwards to its run at x 148.823,
    BATP_S takes the freed side up to C122.1."""
    board = pcbnew.LoadBoard(stage(18))
    F = pcbnew.F_Cu
    n = del_segs(board, "Net-(U105-INA+)", [((146.6, 98.612), (146.6, 100.313)), ((146.6, 100.313), (145.868, 101.045)),
                                            ((146.94, 98.272), (146.6, 98.612)), ((147.622, 98.272), (146.94, 98.272)),
                                            ((148.823, 99.473), (147.622, 98.272))])
    print("  INA+ loop removed:", n)
    ok = None
    for y in (101.45, 101.6, 101.75, 101.3, 101.9, 102.1):
        for jx in (146.35, 146.5, 146.7):
            bad = safe_add(board, "Net-(U105-INA+)", [("t", (F, 0.2, [(145.868, 101.045), (jx, y), (148.823, y), (148.823, 99.473)]))])
            if not bad:
                ok = (jx, y); break
        if ok:
            break
    print("  INA+ new path at", ok)
    bad = safe_add(board, "BATP_S", [("t", (F, 0.2, [(145.583, 100.095), (146.6, 100.095), (146.6, 97.25), (146.855, 96.95)]))])
    print("  BATP_S U105.5:", bad or "added")
    print("  INA+ dead ends:", prune_net(board, "Net-(U105-INA+)"))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 19)


def polish3():
    board = pcbnew.LoadBoard(stage(18))
    for st in (0.1, 0.05):
        r = connect(board, "Net-(U105-INA+)", "R125", "2", 0.2, (137.0, 93.0, 156.0, 114.0), step=st)
        print(f"  INA+ U105.4 (step {st}): {r}")
        if r != "no path":
            break
    for t in list(board.GetTracks()):                          # MOTA_P stub left where the dangling via was
        if t.GetNetname() == "MOTA_P" and t.Type() != pcbnew.PCB_VIA_T and t.GetLayer() == pcbnew.In2_Cu \
                and abs(mm(t.GetStart().x) - 110.41) < 0.2 and abs(mm(t.GetLength())) < 0.3:
            board.Delete(t)
    print("  MOTA_P dead ends:", prune_net(board, "MOTA_P"))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 19)


def polish4():
    """R103's GND pad sat on a pour island with no via: a GND via beside it (checked), into the In1 plane."""
    board = pcbnew.LoadBoard(stage(20))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    pd = [p for p in fps["R103"].Pads() if p.GetNumber() == "2"][0]
    src = xy(pd)
    done = None
    for rad in (0.6, 0.7, 0.8, 1.0, 1.2, 1.5):
        for k in range(36):
            ang = 2 * math.pi * k / 36
            vx, vy = src[0] + rad * math.cos(ang), src[1] + rad * math.sin(ang)
            vq = V(vx, vy)
            if any(q.GetEffectiveShape(pcbnew.F_Cu).Collide(pcbnew.SEG(vq, vq), MM(0.4)) for q in fps["R103"].Pads()):
                continue
            if not safe_add(board, "GND", [("t", (pcbnew.F_Cu, 0.25, [src, (vx, vy)])), ("v", (vx, vy))], clr=0.2):
                done = (round(vx, 2), round(vy, 2)); break
        if done:
            break
    print("  R103.2 GND via:", done)
    if not done:                                               # its old GND run, through R124's old spot
        bad = safe_add(board, "GND", [("t", (pcbnew.F_Cu, 0.3, [(150.035, 110.115), (151.015, 110.115), (151.731, 109.399)]))])
        print("  R103.2 GND old run:", bad or "added")
        if bad:
            for st in (0.1, 0.05):
                r = connect(board, "GND", "R103", "2", 0.25, (145.5, 106.5, 154.5, 114.5), step=st)
                print(f"  R103.2 GND by A* (step {st}):", r)
                if r != "no path":
                    break
    del_segs(board, "GND", [((151.649, 111.473), (151.397, 111.726))])
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 21)
    return
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    gnd = board.FindNet("GND").GetNetCode()
    z = [z for z in board.Zones() if z.GetNetCode() == gnd and z.GetLayer() == pcbnew.F_Cu and not z.GetIsRuleArea()][0]
    fill = z.GetFilledPolysList(pcbnew.F_Cu)
    for box in ((106.21, 73.49, 107.82, 75.2), (152.73, 81.22, 153.37, 81.58)):
        done = None
        x = box[0]
        while x <= box[2] and not done:
            y = box[1]
            while y <= box[3] and not done:
                if fill.Contains(V(x, y), -1, MM(0.32)) and not safe_add(board, "GND", [("v", (x, y))], clr=0.2):
                    done = (round(x, 2), round(y, 2))
                y += 0.05
            x += 0.05
        print("  GND via in", box, "->", done)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 21)


def polish5():
    """Q105's gate and drain (R123's new spot sits on their V2.1 run), then dead ends and the unused BAT_N via."""
    board = pcbnew.LoadBoard(stage(19))
    for net, ref, num in (("BATP_EN", "Q105", "1"), ("Net-(Q103-G)", "Q105", "3")):
        for st in (0.1, 0.05):
            r = connect(board, net, ref, num, 0.2, (137.0, 93.0, 156.0, 114.0), step=st)
            if r != "no path":
                break
        print(f"  {net} {ref}.{num}: {r}")
    for net in ("BATP_EN", "Net-(Q103-G)", "BAT_N", "BATP_S", "Net-(U105-INA+)", "Net-(D107-K)"):
        print(f"  {net} dead ends:", prune_net(board, net))
    print("  dangling vias:", route_pcb.drop_dangling(board))
    print("  vias restored:", restore_vias(board, DEAD_VIAS))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 20)


def polish6():
    """Q105's gate: drop the old BATP_EN branch that led to R123's V2.1 spot (dead now), then a via just above the gate
    pad onto the In2 BATP_EN run under Q105. Remove the unused BAT_N via beside the source."""
    board = pcbnew.LoadBoard(stage(20))
    n = del_segs(board, "BATP_EN", [((142.949, 102.945), (143.387, 102.945)), ((141.703, 104.191), (142.949, 102.945)),
                                    ((139.728, 104.191), (141.703, 104.191))])
    print("  old gate branch cut:", n, "then dead ends:", prune_net(board, "BATP_EN"))
    E.del_via(board, 144.587, 104.845, "BAT_N")
    done = None
    for vy in (102.2, 102.15, 102.1, 102.25):
        for vx in (143.41, 143.3, 143.5):
            if not safe_add(board, "BATP_EN", [("t", (pcbnew.F_Cu, 0.2, [(143.387, 102.945), (vx, vy)])), ("v", (vx, vy)),
                                               ("t", (pcbnew.In2_Cu, 0.2, [(vx, vy), (143.41, 102.689)]))], clr=0.15):
                done = (vx, vy); break
        if done:
            break
    print("  gate via:", done)
    for net in ("BATP_EN", "BAT_N"):
        print(f"  {net} dead ends:", prune_net(board, net))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 21)


def polish7():
    """Q105's gate out through the top: PROG1's run over the gate pad comes up, the gate drops onto the In2 BATP_EN run
    with a via above the pad (checked), then PROG1 is re-laid by the grid router."""
    board = pcbnew.LoadBoard(stage(22))
    n = del_segs(board, "Net-(U102-PROG1)", [((141.948, 101.0), (143.029, 102.081)), ((143.029, 102.081), (143.98, 102.081)),
                                             ((143.98, 102.081), (144.48, 102.581)), ((144.48, 102.581), (145.411, 102.581))])
    print("  PROG1 segments lifted:", n)
    done = None
    for vx in (143.62, 143.66, 143.7, 143.58):
        for vy in (102.0, 101.95, 102.05, 102.1):
            if not safe_add(board, "BATP_EN", [("t", (pcbnew.F_Cu, 0.2, [(143.387, 102.945), (vx, vy)])), ("v", (vx, vy))], clr=0.15):
                done = (vx, vy); break
        if done:
            break
    print("  gate via:", done)
    for st in (0.1, 0.05, 0.025):
        r = connect(board, "Net-(U102-PROG1)", "U102", "13", 0.2, (134.0, 92.0, 152.0, 110.0), clr=0.15, step=st)
        print(f"  PROG1 (step {st}):", r)
        if r != "no path":
            break
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 23)


def polish8():
    """PROG1 crossed over Q105 to reach R105 on the far side: R105 moves beside U102's PROG1 pin, which frees the way
    for Q105's gate via onto the In2 BATP_EN run; then PROG1 and R105's GND are linked."""
    board = pcbnew.LoadBoard(stage(22))
    fps = {f.GetReference(): f for f in board.GetFootprints()}
    n = del_segs(board, "Net-(U102-PROG1)", [((141.338, 101.0), (141.948, 101.0)), ((141.948, 101.0), (143.029, 102.081)),
                                             ((143.029, 102.081), (143.98, 102.081)), ((143.98, 102.081), (144.48, 102.581)),
                                             ((144.48, 102.581), (145.411, 102.581)), ((145.411, 102.581), (147.065, 104.235))])
    print("  PROG1 run lifted:", n)
    old = fps["R105"].GetPosition(); old = pcbnew.VECTOR2I(old.x, old.y); r0 = fps["R105"].GetOrientationDegrees()
    for t in list(board.GetTracks()):                          # R105's own GND stub goes with it
        if t.Type() != pcbnew.PCB_VIA_T and t.GetNetname() == "GND" and t.GetLayer() == pcbnew.F_Cu:
            if any(abs(mm(q.x) - 148.085) < 0.05 and abs(mm(q.y) - 104.235) < 0.05 for q in (t.GetStart(), t.GetEnd())):
                board.Delete(t)
    got = place_near_nets(board, fps["R105"], (136.0, 95.0, 146.0, 106.0), step=0.1, avoid_silk=True)
    if not got:
        fps["R105"].SetPosition(old); fps["R105"].SetOrientationDegrees(r0)
    print("  R105 ->", got, [(p.GetNumber(), p.GetNetname(), xy(p)) for p in fps["R105"].Pads()], "overlaps", hits(board, fps["R105"]))
    done = None
    for vx in (143.62, 143.66, 143.7, 143.58):
        for vy in (102.0, 101.95, 102.05, 102.1):
            if not safe_add(board, "BATP_EN", [("t", (pcbnew.F_Cu, 0.2, [(143.387, 102.945), (vx, vy)])), ("v", (vx, vy))], clr=0.15):
                done = (vx, vy); break
        if done:
            break
    print("  Q105 gate via:", done)
    for net, ref, num, w in (("Net-(U102-PROG1)", "U102", "13", 0.2), ("GND", "R105", "2", 0.25)):
        for st in (0.1, 0.05):
            r = connect(board, net, ref, num, w, (134.0, 92.0, 152.0, 110.0), clr=0.15, step=st)
            if r != "no path":
                break
        print(f"  {net} {ref}.{num}: {r}")
    print("  GND prune:", prune_net(board, "GND", layers=(pcbnew.F_Cu,)) if False else "skipped")
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 25)


def polish9():
    """PROG3's detour (right, down on In2, back left) blocks the left of Q105: lift it, run PROG1 straight down that side
    to R105, then re-lay PROG3 with the grid router."""
    board = pcbnew.LoadBoard(stage(25))
    F, I2 = pcbnew.F_Cu, pcbnew.In2_Cu
    n = del_segs(board, "Net-(U102-PROG3)", [((141.338, 101.5), (141.725, 101.5)), ((141.725, 101.5), (142.002, 101.776)),
                                             ((142.002, 101.776), (142.002, 102.413)), ((142.002, 102.413), (141.815, 102.599)),
                                             ((142.189, 104.604), (140.276, 104.604))])
    n += del_segs(board, "Net-(U102-PROG3)", [((141.815, 102.599), (141.815, 104.23)), ((141.815, 104.23), (142.189, 104.604))], I2)
    E.del_via(board, 141.815, 102.599, "Net-(U102-PROG3)"); E.del_via(board, 142.189, 104.604, "Net-(U102-PROG3)")
    print("  PROG3 detour lifted:", n)
    ok = None
    for x in (142.375, 142.4, 142.35):
        for pts in ([(141.338, 101.0), (x, 101.0), (x, 104.95), (141.6, 105.29)], [(141.338, 101.0), (x, 101.0), (x, 104.7), (141.6, 105.29)]):
            if not safe_add(board, "Net-(U102-PROG1)", [("t", (F, 0.15, pts))], clr=0.15):
                ok = pts; break
        if ok:
            break
    print("  PROG1:", "added" if ok else "blocked")
    for st in (0.1, 0.05, 0.025):
        r = connect(board, "Net-(U102-PROG3)", "U102", "12", 0.15, (132.0, 94.0, 150.0, 112.0), clr=0.15, step=st)
        print(f"  PROG3 (step {st}):", r)
        if r != "no path":
            break
    print("  PROG3 dead ends:", prune_net(board, "Net-(U102-PROG3)"))
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 26)


def polish10():
    """PROG3's exit from U102 pin 12: straight out along the pin, clear of pin 11 (GND), then down."""
    board = pcbnew.LoadBoard(stage(26))
    n = del_segs(board, "Net-(U102-PROG3)", [((141.338, 101.5), (141.4, 101.6)), ((141.4, 101.6), (141.5, 101.6)),
                                             ((141.5, 101.6), (141.6, 101.7)), ((141.6, 101.7), (141.9, 101.7)),
                                             ((141.9, 101.7), (142.0, 101.8))])
    bad = safe_add(board, "Net-(U102-PROG3)", [("t", (pcbnew.F_Cu, 0.15, [(141.338, 101.5), (142.0, 101.5), (142.0, 101.8)]))], clr=0.15)
    print("  PROG3 exit:", n, "removed,", bad or "new exit added")
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 27)


def fetlink():
    """2026-11-24 pre-order check: the gate track Q103.4 -> Q104.4 ran down the 0.9 mm gap between the two FETs' source
    pins and split BATP_S in two, so all battery current crossed a 0.23-0.3 mm track (same on V2.0). B.Cu (USB_D+,
    PWR_EN_N) and In2 (BAT_N) are blocked there, so the gate now runs on F.Cu round the outside of Q103's source pins:
    down from Q104.4, west under them, up the drain-source gap inside Q103 (as its own gate track already does) to the
    gate via. The sources join straight across and the BATP_S pour floods the gap."""
    board = pcbnew.LoadBoard(os.path.join(PROJ, f"{NAME}.kicad_pcb"))
    F = pcbnew.F_Cu
    n = del_segs(board, "Net-(Q103-G)", [((129.34, 108.36), (130.08, 108.36)), ((130.08, 108.36), (130.08, 109.93)),
                                          ((130.08, 109.93), (130.49, 110.34)), ((130.49, 110.34), (131.22, 110.34))], F)
    m = del_segs(board, "BATP_S", [((129.34, 110.34), (129.85, 110.86)), ((129.85, 110.86), (132.01, 110.86)),
                                   ((132.01, 110.86), (132.01, 109.84)),
                                   # Q103's own source ties in its drain-source gap (the pour and the bridges join them)
                                   ((129.34, 109.02), (128.54, 109.02)), ((128.54, 109.02), (128.54, 109.68)),
                                   ((129.34, 109.68), (128.54, 109.68)), ((128.54, 109.68), (128.54, 110.34)),
                                   ((129.34, 110.34), (128.54, 110.34))], F)
    print("  removed: gate", n, "/ old source link", m)
    bad = safe_add(board, "Net-(Q103-G)", [("t", (F, 0.2, [(131.22, 110.34), (131.22, 110.95), (128.52, 110.95),
                                                            (128.52, 108.43), (128.59, 108.36)]))], clr=0.2)
    print("  gate round Q103's sources (F.Cu):", bad or "added")
    bad2 = safe_add(board, "BATP_S", [("t", (F, 0.4, [(129.34, 109.02), (131.22, 109.02)])),
                                      ("t", (F, 0.4, [(129.34, 109.68), (131.22, 109.68)]))], clr=0.15)
    print("  source bridges:", bad2 or "added")
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 30)


def fix4():
    """Charger side of +BATT (U102 VBAT, C104, R117) back to Q104: its old link ran through the junction under U106."""
    board = pcbnew.LoadBoard(stage(14))
    for w in (0.4, 0.3):
        r = connect(board, "+BATT", "U102", "14", w, (119.0, 94.0, 141.0, 113.0), step=0.05)
        print(f"  +BATT charger branch ({w} mm): {r}")
        if r != "no path":
            break
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    E.save(board, 15)


def labels(src, dst):
    """Silkscreen round the moved parts: motor titles off the PH bodies, the small front logo turned to fit under J302,
    QWIIC and the XT30 polarity text to the back (no room on top any more), back EXP titles off the PH pins."""
    board = pcbnew.LoadBoard(stage(src))
    F, B = pcbnew.F_SilkS, pcbnew.B_SilkS
    m1 = find_text(board, F, "MOTOR 1"); m1.SetPosition(V(113.7, 73.7))
    m2 = find_text(board, F, "MOTOR 2")                                   # vertical, where the logo was
    m2.SetTextSize(pcbnew.VECTOR2I(MM(0.75), MM(0.75))); m2.SetTextThickness(MM(0.15))
    m2.SetTextAngleDegrees(90); m2.SetPosition(V(153.4, 75.3))
    logo = [d for d in board.GetDrawings() if d.GetLayer() == F and d.GetClass() == "PCB_SHAPE" and d.GetShapeStr() == "Polygon"
            and 152.3 < mm(d.GetBoundingBox().GetLeft()) and mm(d.GetBoundingBox().GetRight()) < 154.5
            and 70.6 < mm(d.GetBoundingBox().GetTop()) and mm(d.GetBoundingBox().GetBottom()) < 78.1]
    bb = logo[0].GetBoundingBox()
    for d in logo[1:]:
        bb.Merge(d.GetBoundingBox())
    c = bb.GetCenter()
    for d in logo:
        d.Rotate(pcbnew.VECTOR2I(c.x, c.y), pcbnew.EDA_ANGLE(-90, pcbnew.DEGREES_T))
    bb = logo[0].GetBoundingBox()
    for d in logo[1:]:
        bb.Merge(d.GetBoundingBox())
    mv = pcbnew.VECTOR2I(MM(155.3) - bb.GetLeft(), MM(72.65) - bb.GetTop())
    for d in logo:
        d.Move(mv)
    print(f"  logo: {len(logo)} shapes turned to read across, now", round(mm(bb.GetLeft() + mv.x), 2), round(mm(bb.GetTop() + mv.y), 2),
          round(mm(bb.GetRight() + mv.x), 2), round(mm(bb.GetBottom() + mv.y), 2))
    q = find_text(board, F, "QWIIC"); q.SetLayer(B); q.SetMirrored(True); q.SetPosition(V(165.6, 73.95))
    x30 = find_text(board, F, "1S 4.2V MAX\n-  BAT  +"); x30.SetLayer(B); x30.SetMirrored(True); x30.SetPosition(V(124.9, 113.5))
    x30.SetText("1S 4.2V MAX\n+  BAT  -")              # seen from the back the XT30's + pin is on the left
    for name, x in (("EXP A", 119.06), ("EXP B", 153.61)):
        find_text(board, B, name).SetPosition(V(x, 71.15))
    E.save(board, dst)


if __name__ == "__main__":
    {"apply": apply, "fetlink": fetlink, "route": E.route, "finish": E.finish, "fix": fix, "fix2": fix2, "route2": lambda: route2(5, 6, ("BAT_N", "BATP_S", "+BATT")), "fix3": fix3, "fix3b": fix3b, "fix4": fix4, "fix5": fix5, "rip": rip, "place2": place2, "place3": place3, "place4": place4, "place5": place5, "final": final, "polish": polish, "polish2": polish2, "polish3": polish3, "polish5": polish5, "polish6": polish6, "polish7": polish7, "polish8": polish8, "polish9": polish9, "polish10": polish10, "polish4": polish4, "spine": spine, "routeR2": lambda: route2(12, 13, RIP), "routeR": lambda: route2(10, 11, RIP), "labels": lambda: labels(15, 16)}[sys.argv[1]]()
