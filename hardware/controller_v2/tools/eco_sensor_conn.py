"""ECO 2026-10-05: ultrasonic (J403) and line-follower (J404) 2.54 mm headers -> JST SH 4 / 5-pin, on the routed board.

Works on the current RoboCore_V2.kicad_pcb (keeps the routing, the back artwork and Fred's hand edits):
swaps the two footprints (nets and symbol links from the regenerated schematic), routes the new SMD pads to the
existing tracks with the grid router, trims the stubs left at the old through-hole pads, redraws the pin-name
labels and refills the pours. Run with KiCad's Python after gen_sch.py:

  /Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3 tools/eco_sensor_conn.py
"""
import math, os, shutil, sys
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import route_pcb as R      # noqa: E402  (grid router, connectivity helpers)
import build_pcb as B      # noqa: E402  (netlist, knockout silkscreen)

PL = R.PL
MM = pcbnew.FromMM
WORK = os.path.join(R.WORK, "eco")
# ref: footprint, origin, rotation, pin names (pin 1 first), section name and its centre
NEW = {
    "J403": ("Connector_JST:JST_SH_BM04B-SRSS-TB_1x04-1MP_P1.00mm_Vertical", (110.4, 117.2), 90,
             ["GND", "3V3", "TRIG", "ECHO"], ("ULTRASONIC", 113.5, 112.6)),
    "J404": ("Connector_JST:JST_SH_BM05B-SRSS-TB_1x05-1MP_P1.00mm_Vertical", (153.0, 116.7), 90,
             ["GND", "3V3", "L", "C", "R"], ("LINE", 156.7, 113.3)),
}
OLD_LABELS = {"3V3\nTRIG\nECHO\nGND", "ULTRASONIC", "3V3\nGND\nL\nC\nR", "LINE"}
WIDTH = {"+3V3": 0.25}
LABEL_SIZE = 0.8          # knockout pin names at 1.0 mm pitch


def swap(board, comps, ref, fpid, pos, rot):
    old = board.FindFootprintByReference(ref)
    board.Delete(old)
    c = comps[ref]
    lib, name = fpid.split(":")
    fp = pcbnew.FootprintLoad(PL.fp_lib_path(lib), name)
    fp.SetFPID(pcbnew.LIB_ID(lib, name))
    fp.SetReference(ref)
    fp.SetValue(c["value"])
    fp.SetPath(pcbnew.KIID_PATH(c["path"]))
    fp.SetSheetname(c["sheetname"])
    for k, v in c["fields"].items():
        fp.SetField(k, v)
        for f in fp.GetFields():
            if f.GetName() == k:
                f.SetVisible(False)
    for pad in fp.Pads():
        n = c["pads"].get(pad.GetNumber())
        if n:
            pad.SetNet(board.FindNet(n))
    fp.SetPosition(pcbnew.VECTOR2I(MM(pos[0]), MM(pos[1])))
    board.Add(fp)
    fp.SetOrientationDegrees(rot)
    fp.Reference().SetVisible(False)
    return fp


def old_pad_ends(board, refs):
    """Before the swap: (centre, net) of every old pad, and a via for each pad that joined several tracks (a
    through-hole pad can carry a route from one layer to another; without it the net would fall apart)."""
    ends, vias = [], 0
    for ref in refs:
        for p in board.FindFootprintByReference(ref).Pads():
            c, net = p.GetPosition(), p.GetNetCode()
            ts = [t for t in board.GetTracks() if t.Type() == pcbnew.PCB_TRACE_T and t.GetNetCode() == net
                  and (t.GetStart() == c or t.GetEnd() == c)]
            if len(ts) >= 2:
                v = pcbnew.PCB_VIA(board)
                v.SetPosition(pcbnew.VECTOR2I(c.x, c.y)); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNetCode(net)
                board.Add(v)
                vias += 1
            elif ts:
                ends.append((pcbnew.VECTOR2I(c.x, c.y), net))
    return ends, vias


def prune(board, ends, gnd):
    """Walk back from each old pad centre along the stub it leaves, deleting track pieces until reaching a junction,
    a pad or a via (GND vias stay: they also stitch the pours). Stops short at a tee from the new route."""
    gone = 0
    todo = list(ends)
    while todo:
        pt, net = todo.pop()
        segs = [t for t in board.GetTracks() if t.Type() == pcbnew.PCB_TRACE_T and t.GetNetCode() == net]
        at = [t for t in segs if t.GetStart() == pt or t.GetEnd() == pt]
        pads = [p for fp in board.GetFootprints() for p in fp.Pads() if p.GetNetCode() == net and p.HitTest(pt)]
        via = [v for v in board.GetTracks() if v.Type() == pcbnew.PCB_VIA_T and v.GetNetCode() == net and v.GetPosition() == pt]
        if pads or len(at) != 1:
            continue
        if via:
            if net == gnd:
                continue
            board.Delete(via[0])
            gone += 1
        t = at[0]
        far = t.GetEnd() if t.GetStart() == pt else t.GetStart()
        # anything else of this net touching the segment between its ends? then cut back to the nearest such point
        stops = [o.GetStart() for o in segs if o is not t] + [o.GetEnd() for o in segs if o is not t]
        stops += [v.GetPosition() for v in board.GetTracks() if v.Type() == pcbnew.PCB_VIA_T and v.GetNetCode() == net]
        mid = [q for q in stops if q != pt and q != far and t.HitTest(q, MM(0.005))]
        if mid:
            q = min(mid, key=lambda q: (q - pt).EuclideanNorm())
            if t.GetStart() == pt:
                t.SetStart(pcbnew.VECTOR2I(q.x, q.y))
            else:
                t.SetEnd(pcbnew.VECTOR2I(q.x, q.y))
            gone += 1
            continue
        board.Delete(t)
        gone += 1
        todo.append((pcbnew.VECTOR2I(far.x, far.y), net))
    return gone


def labels(board, fp, names, title):
    silk = B.Silk(board)
    pads = sorted((p for p in fp.Pads() if p.GetNumber().isdigit()), key=lambda p: int(p.GetNumber()))
    ys = [pcbnew.ToMM(p.GetPosition().y) for p in pads]
    right = max(pcbnew.ToMM(p.GetBoundingBox().GetRight()) for p in pads)
    order = [n for _, n in sorted(zip(ys, names))]               # top to bottom
    pitch = abs(ys[1] - ys[0])
    spacing = pitch / (B.LINE_PITCH * LABEL_SIZE)
    text = "\n".join(order)
    w, h = silk.box_size(text, LABEL_SIZE, PL.KO_THICK, spacing)
    silk.knockout(text, right + 0.3 + w / 2, sum(ys) / len(ys), 0, spacing, size=LABEL_SIZE)
    silk.knockout(title[0], title[1], title[2], 0)


def main():
    os.makedirs(WORK, exist_ok=True)
    for ext in ("kicad_pcb", "kicad_pro"):
        shutil.copy(os.path.join(PROJ, f"RoboCore_V2.{ext}"), os.path.join(WORK, f"RoboCore_V2.{ext}"))
    R.write_netclasses(os.path.join(WORK, "RoboCore_V2.kicad_pro"))
    path = os.path.join(WORK, "RoboCore_V2.kicad_pcb")
    board = pcbnew.LoadBoard(path)
    comps = B.netlist()
    for d in list(board.GetDrawings()):
        if d.GetClass() == "PCB_TEXT" and d.GetText() in OLD_LABELS:
            board.Delete(d)
    ends, vias = old_pad_ends(board, NEW)
    print("junction vias at old pads:", vias)
    fps = {ref: swap(board, comps, ref, fpid, pos, rot) for ref, (fpid, pos, rot, _, _) in NEW.items()}
    nets = sorted({p.GetNetname() for fp in fps.values() for p in fp.Pads() if p.GetNetname() and p.GetNetname() != "GND"})
    for n in nets:
        w = WIDTH.get(n, 0.2)
        print(f"  {n}: {R.grid_route(board, n, w)} connection(s) routed")
    print("stub pieces removed:", prune(board, ends, board.FindNet("GND").GetNetCode()))
    for n in nets:
        left = len(R._clusters(board, board.FindNet(n).GetNetCode()))
        if left > 1:
            print(f"  {n}: still {left} pieces")
    for ref, (_, _, _, names, title) in NEW.items():
        labels(board, fps[ref], names, title)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))
    R.write_netclasses(os.path.join(PROJ, "RoboCore_V2.kicad_pro"))
    print("saved", os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))


if __name__ == "__main__":
    main()
