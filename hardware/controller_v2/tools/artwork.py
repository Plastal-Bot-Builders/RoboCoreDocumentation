"""Back-side artwork: the RoboCore Zambia and Plastal-Bot Builders logos plus a few lines of writing on B.SilkS.

Run with KiCad's Python after routing. It only touches silkscreen, so tracks, vias and pours stay as they are:

  /Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3 tools/artwork.py [scan]

route_pcb.py finish calls add() as well, so a re-route keeps the artwork. The logos are polygons traced from the SVGs in
technicalreference/ by tools/trace_logo.py (lib/art/<name>.json). Everything is mirrored (it is read from the back) and
sits in one group, BACK_ARTWORK, which add() replaces on every run. 'scan' lists the vias under each logo for a range
of heights (a via hole leaves a small gap in the print).
"""
import json, os, shutil, sys
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import placement_v2 as PL

MM = pcbnew.FromMM
GROUP = "BACK_ARTWORK"
# The free column on the back runs between the two expansion headers (J405 pads end at x 123.45, J406 pads start at
# 149.15; both pin-name strips sit outside the headers). The ESP32 thermal pads (exposed) cut it at y 75.6-78.4,
# JP101 and the U102 thermal pads close it at y 100.2. Centre line x 136.3 (the board centre).
# (kind, name or text, centre x, centre y[, text height, stroke]) - board coordinates, as seen from the front
ART = [
    ("logo", "robocore", 136.3, 70.40),
    ("text", "ROBOT CONTROLLER", 136.3, 81.40, 1.5, 0.27),
    ("text", "ESP32-S3 \u00b7 REV 2.0", 136.3, 83.55, 1.1, 0.2),
    ("logo", "plastalbot", 136.3, 90.10),
    ("text", "DESIGNED IN ZAMBIA", 136.3, 95.90, 1.3, 0.24),
    ("text", "2026", 136.3, 97.90, 1.1, 0.2),
]


def logo_polys(name, cx, cy):
    """The traced logo as a fractured SHAPE_POLY_SET (no holes), mirrored for the back, centred on (cx, cy)."""
    d = json.load(open(os.path.join(PROJ, "lib", "art", f"{name}.json")))
    w, h = d["width"], d["height"]
    def chain(pts):
        c = pcbnew.SHAPE_LINE_CHAIN()
        for u, v in pts:
            c.Append(MM(cx + w / 2 - u), MM(cy - h / 2 + v))     # mirror left-right: it is read from the back
        c.SetClosed(True)
        return c
    sps = pcbnew.SHAPE_POLY_SET()
    for p in d["polys"]:
        sps.AddOutline(chain(p["outline"]))
        for hole in p["holes"]:
            sps.AddHole(chain(hole))
    sps.Simplify()
    sps.Fracture()
    return sps


def remove(board):
    """Delete the BACK_ARTWORK group and everything in it; returns how many items went."""
    g = next((g for g in board.Groups() if g.GetName() == GROUP), None)
    if g is None:
        return 0
    items = list(g.GetItems())
    for it in items:
        g.RemoveItem(it)
        board.Delete(it)
    board.Delete(g)
    return len(items)


def add(board):
    """Replace the BACK_ARTWORK group with the items in ART."""
    print("old artwork items removed:", remove(board))
    g = pcbnew.PCB_GROUP(board)
    g.SetName(GROUP)
    board.Add(g)
    for a in ART:
        if a[0] == "logo":
            sps = logo_polys(a[1], a[2], a[3])
            for i in range(sps.OutlineCount()):
                one = pcbnew.SHAPE_POLY_SET()
                one.AddOutline(sps.Outline(i))
                s = pcbnew.PCB_SHAPE(board, pcbnew.SHAPE_T_POLY)
                s.SetPolyShape(one)
                s.SetFilled(True)
                s.SetWidth(0)
                s.SetLayer(pcbnew.B_SilkS)
                board.Add(s)
                g.AddItem(s)
        else:
            _, s, x, y, size, thick = a
            t = pcbnew.PCB_TEXT(board)
            t.SetText(s)
            t.SetLayer(pcbnew.B_SilkS)
            t.SetTextSize(pcbnew.VECTOR2I(MM(size), MM(size)))
            t.SetTextThickness(MM(thick))
            t.SetMirrored(True)
            t.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
            board.Add(t)
            g.AddItem(t)
    return g


def _ink(item):
    buf = pcbnew.SHAPE_POLY_SET()
    item.TransformShapeToPolygon(buf, pcbnew.B_SilkS, 0, MM(0.005), pcbnew.ERROR_INSIDE)
    return buf


def check(board, g):
    """Artwork must stay 0.25 mm off exposed copper (B.Mask openings), 0.5 mm inside the edge; lists vias under it."""
    pads = pcbnew.SHAPE_POLY_SET()
    for fp in board.GetFootprints():
        for p in fp.Pads():
            if p.IsOnLayer(pcbnew.B_Mask):
                p.TransformShapeToPolygon(pads, pcbnew.B_Mask, MM(0.25), MM(0.005), pcbnew.ERROR_OUTSIDE)
    pads.Simplify()
    art = pcbnew.SHAPE_POLY_SET()
    for it in g.GetItems():
        art.Append(_ink(it))
    art.Simplify()
    hit = pcbnew.SHAPE_POLY_SET(art)
    hit.BooleanIntersection(pads)
    bb = art.BBox()
    print(f"artwork extent x {pcbnew.ToMM(bb.GetLeft()):.2f}-{pcbnew.ToMM(bb.GetRight()):.2f}, "
          f"y {pcbnew.ToMM(bb.GetTop()):.2f}-{pcbnew.ToMM(bb.GetBottom()):.2f}")
    print("over exposed copper (+0.25 mm):", hit.OutlineCount(), "pieces")
    off = 0
    for i in range(art.OutlineCount()):
        c = art.Outline(i)
        for k in range(c.PointCount()):
            v = c.CPoint(k)
            if not PL.on_board(pcbnew.ToMM(v.x), pcbnew.ToMM(v.y), 0.5):
                off += 1
    print("points closer than 0.5 mm to the edge:", off)
    under = [t for t in board.GetTracks() if t.Type() == pcbnew.PCB_VIA_T and art.Collide(t.GetPosition(), t.GetDrillValue() // 2)]
    print("vias under the artwork:", len(under))
    return hit.OutlineCount() == 0 and off == 0


def scan(board):
    """Vias under each logo against its height, to pick a spot with the fewest holes through the print."""
    vias = [t for t in board.GetTracks() if t.Type() == pcbnew.PCB_VIA_T]
    for a in ART:
        if a[0] != "logo":
            continue
        row = []
        for k in range(-12, 13):
            for dx in (0,):
                sps = logo_polys(a[1], a[2] + dx, a[3] + k * 0.1)
                n = sum(1 for v in vias if sps.Collide(v.GetPosition(), v.GetDrillValue() // 2 + MM(0.05)))
                row.append((n, round(a[3] + k * 0.1, 2), dx))
        row.sort()
        print(a[1], "fewest vias (count, y, dx):", row[:8])


def main():
    work = os.path.join(os.environ.get("TMPDIR", "/tmp"), "rc2route", "art")
    os.makedirs(work, exist_ok=True)
    for ext in ("kicad_pcb", "kicad_pro"):          # SaveBoard rewrites the .kicad_pro beside the board: use a copy
        shutil.copy(os.path.join(PROJ, f"RoboCore_V2.{ext}"), os.path.join(work, f"RoboCore_V2.{ext}"))
    path = os.path.join(work, "RoboCore_V2.kicad_pcb")
    board = pcbnew.LoadBoard(path)
    if len(sys.argv) > 1 and sys.argv[1] == "scan":
        scan(board)
        return
    g = add(board)
    print("artwork items:", len(list(g.GetItems())))
    if not check(board, g):
        sys.exit("artwork collides - board not saved")
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))
    print("saved", os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))


if __name__ == "__main__":
    main()
