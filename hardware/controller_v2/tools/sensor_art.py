"""Give the sensor boards the main board's look (KiCad's Python): an outline 0.6 mm inside the board edge, straight
dividers, white knockout labels, the RoboCore / Plastal-Bot logos and icons from technicalreference/.

  <KiCad python> tools/sensor_art.py us        # works on the saved board in place: keeps hand edits (Fred's logos)
  build_sensor.py calls decorate() itself, so a rebuilt board gets the same artwork.

Everything added sits in one group, SENSOR_ARTWORK, which is replaced on every run. The plain texts a recipe
supersedes are deleted. Lines break around pads, part outlines and lettering, like the main board's silkscreen.
"""
import json, math, os, shutil, sys
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import build_pcb as B   # noqa: E402  (LINE_PITCH, text box sizes)

MM = pcbnew.FromMM
GROUP = "SENSOR_ARTWORK"
INSET = 0.6
KO_THICK = 0.18
LINE_W = 0.15

# side "F" = top, "B" = bottom (mirrored). Coordinates are board coordinates (board centre at 100, 100).
RECIPES = {
    "line": dict(
        remove=[],                                       # build_sensor no longer writes the old plain texts
        dividers={"F": [[(70.6, 103.3), (129.4, 103.3)], [(92.0, 88.6), (92.0, 103.3)], [(108.0, 88.6), (108.0, 103.3)]]},
        knockouts=[("L", 81.4, 101.4, 1.0, "F"), ("C", 97.4, 101.4, 1.0, "F"), ("R", 113.4, 101.4, 1.0, "F"),
                   ("LINE SENSOR", 123.0, 106.2, 0.9, "F"),
                   ("L", 84.0, 101.6, 1.0, "B"), ("C", 100.0, 101.6, 1.0, "B"), ("R", 116.0, 101.6, 1.0, "B")],
        texts=[("v1.0", 119.8, 109.8, 0.8, "F"), ("v1.0", 125.4, 109.8, 0.8, "B")],
        art=[("robocore_12", 77.4, 107.6, "F", 0), ("icon_golem", 126.4, 109.4, "F", 0),
             ("plastalbot_22", 100.0, 106.9, "B", 0)],
    ),
    "us": dict(
        remove=[("ULTRASONIC  v1.0", "F"), ("RoboCore ULTRASONIC  v1.0", "F"), ("T", "B"), ("R", "B")],
        dividers={},
        knockouts=[("ULTRASONIC", 101.0, 91.0, 0.9, "F"), ("T", 113.0, 90.6, 1.0, "B"), ("R", 87.0, 90.6, 1.0, "B")],
        texts=[("v1.0", 108.6, 91.0, 0.8, "F")],
        art=[("icon_sound", 93.7, 91.2, "F", 0)],
    ),
}


def art_polys(name, cx, cy, side, rot=0):
    """Traced artwork (lib/art/<name>.json) centred on (cx, cy), turned rot degrees, mirrored on the bottom side."""
    d = json.load(open(os.path.join(PROJ, "lib", "art", f"{name}.json")))
    w, h = d["width"], d["height"]
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))

    def chain(pts):
        ch = pcbnew.SHAPE_LINE_CHAIN()
        for u, v in pts:
            x, y = u - w / 2, v - h / 2
            if side == "B":
                x = -x
            ch.Append(MM(cx + x * c - y * s), MM(cy + x * s + y * c))
        ch.SetClosed(True)
        return ch
    sps = pcbnew.SHAPE_POLY_SET()
    for p in d["polys"]:
        sps.AddOutline(chain(p["outline"]))
        for hole in p["holes"]:
            sps.AddHole(chain(hole))
    sps.Simplify()
    sps.Fracture()
    return sps


def _layer(side):
    return pcbnew.B_SilkS if side == "B" else pcbnew.F_SilkS


def _rect(bb, grow):
    return (pcbnew.ToMM(bb.GetLeft()) - grow, pcbnew.ToMM(bb.GetTop()) - grow, pcbnew.ToMM(bb.GetRight()) + grow, pcbnew.ToMM(bb.GetBottom()) + grow)


def obstacles(board, side, group):
    """Rectangles a silkscreen line on this side must not cross."""
    cu = pcbnew.B_Cu if side == "B" else pcbnew.F_Cu
    silk = _layer(side)
    mine = {i.m_Uuid.AsString() for i in group.GetItems()} if group else set()
    out = []
    for fp in board.GetFootprints():
        for pad in fp.Pads():
            if pad.IsOnLayer(cu) or pad.GetAttribute() in (pcbnew.PAD_ATTRIB_PTH, pcbnew.PAD_ATTRIB_NPTH):
                out.append(_rect(pad.GetBoundingBox(), 0.3))
        for g in fp.GraphicalItems():
            if g.GetLayer() == silk:
                out.append(_rect(g.GetBoundingBox(), 0.2))
    for d in board.GetDrawings():
        if d.GetLayer() != silk or d.m_Uuid.AsString() in mine:
            continue
        if d.GetClass() == "PCB_SHAPE" and d.GetShape() == pcbnew.SHAPE_T_SEGMENT:
            continue                              # other lines may cross ours
        out.append(_rect(d.GetBoundingBox(), 0.25))
    return out


def silk_line(board, group, pts, side, blocks, closed=False, min_len=0.6):
    pts = list(pts) + ([pts[0]] if closed else [])
    run, made = [], 0

    def inside(p):
        return any(r[0] <= p[0] <= r[2] and r[1] <= p[1] <= r[3] for r in blocks)

    def flush():
        nonlocal made
        if len(run) >= 2 and sum(math.dist(a, b) for a, b in zip(run, run[1:])) >= min_len:
            for a, b in zip(run, run[1:]):
                s = pcbnew.PCB_SHAPE(board)
                s.SetShape(pcbnew.SHAPE_T_SEGMENT)
                s.SetStart(pcbnew.VECTOR2I(MM(a[0]), MM(a[1]))); s.SetEnd(pcbnew.VECTOR2I(MM(b[0]), MM(b[1])))
                s.SetLayer(_layer(side)); s.SetWidth(MM(LINE_W))
                board.Add(s); group.AddItem(s)
                made += 1
        run.clear()
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.dist(a, b) / 0.05))
        for i in range(n + 1):
            p = (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
            if inside(p):
                flush()
            elif not run or math.dist(run[-1], p) > 1e-6:
                if len(run) >= 2 and B._collinear(run[-2], run[-1], p):
                    run[-1] = p
                else:
                    run.append(p)
    flush()
    return made


def inner_outline(board):
    ps = pcbnew.SHAPE_POLY_SET()
    board.GetBoardPolygonOutlines(ps, False)
    ps.Inflate(-MM(INSET), pcbnew.CORNER_STRATEGY_ROUND_ALL_CORNERS, MM(0.01))
    o = ps.Outline(0)
    return [(pcbnew.ToMM(o.CPoint(i).x), pcbnew.ToMM(o.CPoint(i).y)) for i in range(o.PointCount())]


def _text(board, group, s, x, y, size, side, knockout):
    t = pcbnew.PCB_TEXT(board)
    t.SetText(s)
    t.SetLayer(_layer(side))
    t.SetTextSize(pcbnew.VECTOR2I(MM(size), MM(size)))
    t.SetTextThickness(MM(KO_THICK if knockout else max(0.15, round(size * 0.16, 2))))
    t.SetMirrored(side == "B")
    t.SetIsKnockout(knockout)
    t.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
    board.Add(t); group.AddItem(t)
    return t


def remove(board):
    g = next((g for g in board.Groups() if g.GetName() == GROUP), None)
    if g is None:
        return 0
    items = list(g.GetItems())
    for it in items:
        g.RemoveItem(it)
        board.Delete(it)
    board.Delete(g)
    return len(items)


def decorate(board, key):
    r = RECIPES[key]
    removed = remove(board)
    for d in list(board.GetDrawings()):
        if d.GetClass() == "PCB_TEXT" and (d.GetText(), "B" if d.GetLayer() == pcbnew.B_SilkS else "F") in r["remove"]:
            board.Delete(d)
    g = pcbnew.PCB_GROUP(board)
    g.SetName(GROUP)
    board.Add(g)
    for s, x, y, size, side in r["texts"]:
        _text(board, g, s, x, y, size, side, False)
    for s, x, y, size, side in r["knockouts"]:
        _text(board, g, s, x, y, size, side, True)
    for name, x, y, side, rot in r["art"]:
        sps = art_polys(name, x, y, side, rot)
        for i in range(sps.OutlineCount()):
            one = pcbnew.SHAPE_POLY_SET()
            one.AddOutline(sps.Outline(i))
            sh = pcbnew.PCB_SHAPE(board, pcbnew.SHAPE_T_POLY)
            sh.SetPolyShape(one); sh.SetFilled(True); sh.SetWidth(0); sh.SetLayer(_layer(side))
            board.Add(sh); g.AddItem(sh)
    # lines last, so they break around everything placed above (labels and logos are obstacles, not our lines)
    edge = inner_outline(board)
    lines = 0
    for side in ("F", "B"):
        blocks = obstacles(board, side, None)
        lines += silk_line(board, g, edge, side, blocks, closed=True)
        for pts in r["dividers"].get(side, []):
            lines += silk_line(board, g, pts, side, blocks)
    print(f"{key}: artwork replaced ({removed} old items), {len(list(g.GetItems()))} items, {lines} line pieces")
    return g


def main():
    key = sys.argv[1]
    folder, name = {"line": ("sensors/line_sensor", "RoboCore_LineSensor"), "us": ("sensors/ultrasonic", "RoboCore_Ultrasonic")}[key]
    work = os.path.join(os.environ.get("TMPDIR", "/tmp"), f"art_{key}")
    os.makedirs(work, exist_ok=True)
    for f in (f"{name}.kicad_pcb", f"{name}.kicad_pro", "fp-lib-table"):
        shutil.copy(os.path.join(PROJ, folder, f), os.path.join(work, f))
    path = os.path.join(work, f"{name}.kicad_pcb")
    board = pcbnew.LoadBoard(path)
    decorate(board, key)
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(PROJ, folder, f"{name}.kicad_pcb"))   # the .kicad_pro stays as it was


if __name__ == "__main__":
    main()
