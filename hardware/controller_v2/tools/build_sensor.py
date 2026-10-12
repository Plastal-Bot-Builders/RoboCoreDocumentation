"""Build, route and check the RoboCore sensor boards from their generated schematics (KiCad's Python):

  P=/Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3
  $P tools/build_sensor.py line          # line sensor: place, Freerouting, GND pours, save
  $P tools/build_sensor.py us place      # ultrasonic: placement only (to check it before routing)

Run gen_sch.py for the board first (see spec_line.py / spec_us.py). 2-layer, 1.6 mm, PCBWay standard rules.
Board centre is at (100, 100). Parts with "c" are placed by the centre of their courtyard (THT parts whose
footprint origin is a pin), the rest by their footprint origin. Side "B" = bottom (flipped).
"""
import copy, json, math, os, shutil, subprocess, sys, xml.etree.ElementTree as ET
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import build_pcb as B   # noqa: E402  (knockout silkscreen helper)
import sensor_art        # noqa: E402  (inner outline, dividers, logos, icons)

CLI = "/Applications/KiCad.app/Contents/MacOS/kicad-cli"
FPLIB = "/Applications/KiCad.app/Contents/SharedSupport/footprints"
JAR = os.path.expanduser("~/.kicad-mcp/freerouting.jar")
MM = pcbnew.FromMM


def chamfered(w, h, top=0.0, bottom=0.0):
    """Rectangle centred on (100, 100) with 45 degree chamfers on the top and/or bottom corners."""
    x0, x1, y0, y1 = 100 - w / 2, 100 + w / 2, 100 - h / 2, 100 + h / 2
    pts = [(x0 + top, y0), (x1 - top, y0), (x1, y0 + top), (x1, y1 - bottom), (x1 - bottom, y1), (x0 + bottom, y1), (x0, y1 - bottom), (x0, y0 + top)]
    return [p for i, p in enumerate(pts) if p != pts[i - 1]]


BOARDS = {
    "line": dict(
        dir="sensors/line_sensor", name="RoboCore_LineSensor", title="RoboCore Line Sensor",
        outline=chamfered(60, 24, top=4), corner_r=(3.0, 2.0),      # square corners R3 (as Fred did on the ultrasonic), chamfer ends R2
        parts={  # ref: (x, y, rotation, side, anchor)
            "U1": (84, 94.0, 90, "B", "c"), "U2": (100, 94.0, 90, "B", "c"), "U3": (116, 94.0, 90, "B", "c"),
            "R1": (89.6, 92.4, 0, "F", "o"), "R2": (89.6, 95.4, 0, "F", "o"),
            "R3": (105.6, 92.4, 0, "F", "o"), "R4": (105.6, 95.4, 0, "F", "o"),
            "R5": (121.6, 92.4, 0, "F", "o"), "R6": (121.6, 95.4, 0, "F", "o"),
            "D1": (84, 101.4, 180, "F", "o"), "D2": (100, 101.4, 180, "F", "o"), "D3": (116, 101.4, 180, "F", "o"),
            "R9": (87.4, 101.4, 0, "F", "o"), "R10": (103.4, 101.4, 0, "F", "o"), "R11": (119.4, 101.4, 0, "F", "o"),
            "U4": (95.0, 107.6, 90, "F", "o"), "C4": (87.8, 104.6, 0, "F", "o"),
            "R7": (86.6, 106.8, 0, "F", "o"), "R8": (86.6, 108.6, 0, "F", "o"), "C3": (86.6, 110.4, 0, "F", "o"),
            "J1": (110.0, 107.2, 90, "F", "o"), "C1": (101.8, 107.4, 90, "F", "o"), "C2": (104.2, 107.4, 90, "F", "o"),
            "H1": (74.2, 101.0, 0, "F", "o"), "H2": (125.8, 101.0, 0, "F", "o"),
        },
        pin_labels=[("J1", ["GND", "3V3", "L", "C", "R"], "right")],
        texts=[],                                              # labels, logos and icons: sensor_art.py
    ),
    "us": dict(
        dir="sensors/ultrasonic", name="RoboCore_Ultrasonic", title="RoboCore Ultrasonic",
        outline=chamfered(46, 22), corner_r=(3.0, 2.0),
        parts={
            # transducers face forward from the bottom side; seen from the front TX is on the left like an HC-SR04
            "LS1": (113, 100, 90, "B", "c"), "LS2": (87, 100, 90, "B", "c"),
            "U1": (99.0, 99.0, 0, "F", "o"), "R2": (94.1, 96.4, 90, "F", "o"), "C2": (94.1, 99.4, 90, "F", "o"),
            "TP1": (93.6, 102.6, 0, "F", "o"), "TP2": (93.6, 104.9, 0, "F", "o"),
            "Y1": (105.4, 96.8, 90, "F", "o"), "C4": (105.4, 93.4, 0, "F", "o"), "C5": (108.0, 96.8, 90, "F", "o"),
            "C3": (101.0, 105.8, 0, "F", "o"),
            "J1": (106.0, 106.6, 90, "F", "o"),
            "R1": (96.2, 108.8, 0, "F", "o"), "C1": (99.6, 108.6, 0, "F", "o"), "R3": (92.8, 108.8, 0, "F", "o"),
            "H1": (79.5, 92.5, 0, "F", "o"), "H2": (120.5, 92.5, 0, "F", "o"), "H3": (79.5, 107.5, 0, "F", "o"), "H4": (120.5, 107.5, 0, "F", "o"),
        },
        pin_labels=[("J1", ["GND", "3V3", "TRIG", "ECHO"], "right")],
        texts=[
            ("RoboCore ULTRASONIC  v1.0", 100, 91.0, 0.9, "F"),
            ("AMP", 90.9, 102.6, 0.8, "F"), ("COMP", 90.5, 104.9, 0.8, "F"),
            ("T", 113, 90.6, 1.2, "B"), ("R", 87, 90.6, 1.2, "B"),
            ("RoboCore", 100, 97.0, 1.0, "B"), ("CS100A", 100, 99.2, 0.8, "B"), ("2cm-4m", 100, 101.0, 0.8, "B"),
        ],
    ),
}

NETCLASSES = {"Default": (0.25, 0.2, 0.6, 0.3), "POWER": (0.4, 0.2, 0.6, 0.3)}
POWER_NETS = ("GND", "+3V3", "VCC")


def make_pro(path):
    """Project file with the net classes and rules (the main board's file as the template)."""
    base = json.load(open(os.path.join(PROJ, "RoboCore_V2.kicad_pro")))
    d = json.load(open(path)) if os.path.exists(path) else {}
    d["meta"] = {"filename": os.path.basename(path), "version": 3}
    d["board"] = copy.deepcopy(base["board"])
    ns = copy.deepcopy(base["net_settings"])
    tmpl = next(c for c in ns["classes"] if c["name"] == "Default")
    ns["classes"] = []
    for k, (tw, cl, vd, vdr) in NETCLASSES.items():
        c = copy.deepcopy(tmpl)
        c.update(name=k, track_width=tw, clearance=cl, via_diameter=vd, via_drill=vdr, diff_pair_width=tw, diff_pair_gap=0.2,
                 priority=len(ns["classes"]) if k != "Default" else 2147483647)
        ns["classes"].append(c)
    ns["netclass_patterns"] = [{"netclass": "POWER", "pattern": n} for n in POWER_NETS]
    ns["netclass_assignments"] = None
    d["net_settings"] = ns
    d["board"]["design_settings"]["rules"].update(min_clearance=0.15, min_track_width=0.15, min_via_diameter=0.5,
                                                  min_through_hole_diameter=0.3, min_copper_edge_clearance=0.3)
    json.dump(d, open(path, "w"), indent=2)


def netlist(cfg):
    out = os.path.join(os.environ.get("TMPDIR", "/tmp"), f"{cfg['name']}_pcb_net.xml")
    subprocess.run([CLI, "sch", "export", "netlist", "--format", "kicadxml", "-o", out, f"{cfg['name']}.kicad_sch"],
                   cwd=os.path.join(PROJ, cfg["dir"]), check=True, capture_output=True)
    comps = {}
    root = ET.parse(out).getroot()
    for c in root.iter("comp"):
        sp = c.find("sheetpath")
        fields = {f.get("name"): (f.text or "") for f in c.iter("field") if f.get("name") in ("MF", "MP", "ALT", "LCSC", "Description")}
        comps[c.get("ref")] = dict(value=c.findtext("value"), footprint=c.findtext("footprint"), datasheet=c.findtext("datasheet") or "",
                                   path=sp.get("tstamps") + c.findtext("tstamps").strip(), sheetname=sp.get("names"), fields=fields, pads={})
    for n in root.iter("net"):
        for node in n.findall("node"):
            if node.get("ref") in comps:
                comps[node.get("ref")]["pads"][node.get("pin")] = n.get("name")
    return comps


def fp_path(lib):
    return os.path.join(PROJ, "lib", "RoboCoreV2.pretty") if lib == "RoboCoreV2" else os.path.join(FPLIB, f"{lib}.pretty")


def courtyard_centre(fp):
    cy = fp.GetCourtyard(pcbnew.B_CrtYd if fp.IsFlipped() else pcbnew.F_CrtYd)
    bb = cy.BBox() if cy.OutlineCount() else fp.GetBoundingBox(False)
    return bb.GetCenter()


def _inside(p, poly):
    inside = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > p[1]) != (y2 > p[1]) and p[0] < x1 + (p[1] - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside


def edge_cuts(board, pts, radii):
    """Board outline with rounded corners: radii = (square corners, 45 degree chamfer ends)."""
    V = pcbnew.VECTOR2I
    def seg(a, b):
        s = pcbnew.PCB_SHAPE(board); s.SetShape(pcbnew.SHAPE_T_SEGMENT)
        s.SetStart(V(MM(a[0]), MM(a[1]))); s.SetEnd(V(MM(b[0]), MM(b[1])))
        s.SetLayer(pcbnew.Edge_Cuts); s.SetWidth(MM(0.05)); board.Add(s)
    n = len(pts)
    ends = []
    for i, p in enumerate(pts):
        a, b = pts[i - 1], pts[(i + 1) % n]
        u = ((p[0] - a[0]) / math.dist(a, p), (p[1] - a[1]) / math.dist(a, p))
        v = ((b[0] - p[0]) / math.dist(p, b), (b[1] - p[1]) / math.dist(p, b))
        turn = math.acos(max(-1.0, min(1.0, u[0] * v[0] + u[1] * v[1])))
        r = radii[0] if turn > math.radians(60) else radii[1]
        if r <= 0:
            ends.append((p, p, None)); continue
        d = r * math.tan(turn / 2)
        t1, t2 = (p[0] - u[0] * d, p[1] - u[1] * d), (p[0] + v[0] * d, p[1] + v[1] * d)
        c = next(c for c in ((t1[0] - u[1] * r, t1[1] + u[0] * r), (t1[0] + u[1] * r, t1[1] - u[0] * r)) if _inside(c, pts))
        k = r / math.dist(c, p)
        mid = (c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k)
        ends.append((t1, t2, mid))
    for i, (t1, t2, mid) in enumerate(ends):
        if mid:
            arc = pcbnew.PCB_SHAPE(board); arc.SetShape(pcbnew.SHAPE_T_ARC)
            arc.SetArcGeometry(V(MM(t1[0]), MM(t1[1])), V(MM(mid[0]), MM(mid[1])), V(MM(t2[0]), MM(t2[1])))
            arc.SetLayer(pcbnew.Edge_Cuts); arc.SetWidth(MM(0.05)); board.Add(arc)
        seg(t2, ends[(i + 1) % n][0])


def build(cfg, board):
    comps = netlist(cfg)
    nets = {}

    def net(name):
        if name not in nets:
            n = pcbnew.NETINFO_ITEM(board, name)
            board.Add(n)
            nets[name] = n
        return nets[name]
    edge_cuts(board, cfg["outline"], cfg.get("corner_r", (0, 0)))
    missing = sorted(set(comps) - set(cfg["parts"]))
    if missing:
        sys.exit(f"no placement for {missing}")
    for ref, c in sorted(comps.items()):
        lib, name = c["footprint"].split(":")
        fp = pcbnew.FootprintLoad(fp_path(lib), name)
        fp.SetFPID(pcbnew.LIB_ID(lib, name))
        fp.SetReference(ref); fp.SetValue(c["value"])
        fp.SetPath(pcbnew.KIID_PATH(c["path"])); fp.SetSheetname(c["sheetname"])
        fp.SetField("Datasheet", c["datasheet"] if c["datasheet"] != "~" else "")   # match the schematic (parity)
        for k, v in c["fields"].items():
            fp.SetField(k, v)
            for f in fp.GetFields():
                if f.GetName() == k:
                    f.SetVisible(False)
        for pad in fp.Pads():
            n = c["pads"].get(pad.GetNumber())
            if n:
                pad.SetNet(net(n))
        x, y, rot, side, anchor = cfg["parts"][ref]
        fp.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
        board.Add(fp)
        if side == "B":
            fp.Flip(fp.GetPosition(), pcbnew.FLIP_DIRECTION_LEFT_RIGHT)
        fp.SetOrientationDegrees(rot)
        if anchor == "c":
            cc = courtyard_centre(fp)
            fp.Move(pcbnew.VECTOR2I(MM(x) - cc.x, MM(y) - cc.y))
        fp.Reference().SetVisible(False)
    return comps


def silkscreen(cfg, board):
    silk = B.Silk(board)
    fps = {fp.GetReference(): fp for fp in board.GetFootprints()}
    names = cfg.get("j1_names")
    if names:                                      # pin names in a row above / below a horizontal JST SH
        fp = fps["J1"]
        pads = sorted((p for p in fp.Pads() if p.GetNumber().isdigit()), key=lambda p: int(p.GetNumber()))
        for p, n in zip(pads, names):
            silk.text(n, pcbnew.ToMM(p.GetPosition().x), pcbnew.ToMM(p.GetPosition().y) + 2.2, 0.6, angle=90, just="left")
    for ref, nm, where in cfg["pin_labels"]:
        fp = fps[ref]
        pads = sorted((p for p in fp.Pads() if p.GetNumber().isdigit()), key=lambda p: int(p.GetNumber()))
        ys = [pcbnew.ToMM(p.GetPosition().y) for p in pads]
        right = max(pcbnew.ToMM(p.GetBoundingBox().GetRight()) for p in pads)
        order = [n for _, n in sorted(zip(ys, nm))]
        spacing = abs(ys[1] - ys[0]) / (B.LINE_PITCH * 0.8)
        text = "\n".join(order)
        w, h = silk.box_size(text, 0.8, 0.18, spacing)
        silk.knockout(text, right + 0.3 + w / 2, sum(ys) / len(ys), 0, spacing, size=0.8)
    for t, x, y, size, side in cfg["texts"]:
        if size > 0:
            silk._text(t, x, y, size, max(0.15, round(size * 0.16, 2)), 0, side="B" if side == "B" else "T")


def zones(board, cfg):
    """GND pours on both sides, 0.5 mm inside the board edge."""
    poly = pcbnew.SHAPE_POLY_SET()
    poly.NewOutline()
    for x, y in cfg["outline"]:
        poly.Append(MM(x), MM(y))
    poly.Inflate(-MM(0.5), pcbnew.CORNER_STRATEGY_CHAMFER_ALL_CORNERS, MM(0.01))
    for layer in (pcbnew.F_Cu, pcbnew.B_Cu):
        z = pcbnew.ZONE(board)
        z.SetLayer(layer)
        z.SetNet(board.FindNet("GND"))
        z.Outline().AddOutline(poly.Outline(0))
        z.SetLocalClearance(MM(0.3))
        z.SetMinThickness(MM(0.25))
        z.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL)
        z.SetThermalReliefGap(MM(0.3)); z.SetThermalReliefSpokeWidth(MM(0.4))
        z.SetZoneName("GND pour")
        board.Add(z)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())


def stitch(board, cfg, pitch=4.0):
    """GND vias on a grid wherever both pours are solid, so the two sides stay joined."""
    gnd = board.FindNet("GND")
    xs = [p[0] for p in cfg["outline"]]; ys = [p[1] for p in cfg["outline"]]
    fz = [z for z in board.Zones() if z.GetLayer() == pcbnew.F_Cu][0]
    bz = [z for z in board.Zones() if z.GetLayer() == pcbnew.B_Cu][0]
    words = [d.GetBoundingBox() for d in board.GetDrawings()          # keep vias out of the lettering and logos
             if d.GetClass() == "PCB_TEXT" or (d.GetClass() == "PCB_SHAPE" and d.GetShape() == pcbnew.SHAPE_T_POLY)]
    n = 0
    y = min(ys) + 2
    while y < max(ys) - 1.5:
        x = min(xs) + 2
        while x < max(xs) - 1.5:
            p = pcbnew.VECTOR2I(MM(x), MM(y))
            ok = all(z.GetFilledPolysList(z.GetLayer()).Contains(pcbnew.VECTOR2I(p.x + dx, p.y + dy))
                     for z in (fz, bz) for dx in (-MM(0.6), 0, MM(0.6)) for dy in (-MM(0.6), 0, MM(0.6)))
            ok = ok and not any(pad.GetBoundingBox().Inflate(MM(0.8)).Contains(p) for f in board.GetFootprints() for pad in f.Pads())
            ok = ok and not any(pcbnew.BOX2I(w.GetPosition(), w.GetSize()).Inflate(MM(0.5)).Contains(p) for w in words)
            if ok:
                v = pcbnew.PCB_VIA(board)
                v.SetPosition(p); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNet(gnd)
                board.Add(v)
                n += 1
            x += pitch
        y += pitch
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    return n


def freeroute(board, work):
    dsn, ses = os.path.join(work, "board.dsn"), os.path.join(work, "board.ses")
    for f in (dsn, ses):
        if os.path.exists(f):
            os.remove(f)
    pcbnew.ExportSpecctraDSN(board, dsn)
    r = subprocess.run(["java", "-Djava.awt.headless=true", "-jar", JAR, "-de", dsn, "-do", ses, "-mp", "30"],
                       cwd=work, capture_output=True, text=True, timeout=900)
    if not os.path.exists(ses):
        sys.exit("Freerouting produced no session:\n" + r.stdout[-2000:] + r.stderr[-2000:])
    print("\n".join(l for l in r.stdout.splitlines() if "completed" in l)[-600:])
    pcbnew.ImportSpecctraSES(board, ses)
    thin = [t for t in board.GetTracks() if t.Type() == pcbnew.PCB_TRACE_T and t.GetWidth() < MM(0.15)]
    for t in thin:                     # Freerouting necks down into fine-pitch pads; 0.15 mm is the fab minimum
        t.SetWidth(MM(0.15))
    if thin:
        print("necked-down track pieces widened to 0.15 mm:", len(thin))


def main():
    key = sys.argv[1]
    only_place = len(sys.argv) > 2 and sys.argv[2] == "place"
    cfg = BOARDS[key]
    out = os.path.join(PROJ, cfg["dir"])
    work = os.path.join(os.environ.get("TMPDIR", "/tmp"), f"rc_{key}")
    os.makedirs(work, exist_ok=True)
    pro = os.path.join(out, f"{cfg['name']}.kicad_pro")
    make_pro(pro)
    path = os.path.join(work, f"{cfg['name']}.kicad_pcb")
    shutil.copy(pro, os.path.join(work, f"{cfg['name']}.kicad_pro"))
    for f in ("fp-lib-table",):
        shutil.copy(os.path.join(out, f), os.path.join(work, f))
    if os.path.exists(path):
        os.remove(path)
    board = pcbnew.NewBoard(path)
    tb = board.GetTitleBlock()
    tb.SetTitle(cfg["title"]); tb.SetRevision("1.0"); tb.SetDate("2026-10-05"); tb.SetCompany("RoboCore Zambia / Plastal-Bot Builders")
    comps = build(cfg, board)
    silkscreen(cfg, board)
    sensor_art.decorate(board, key)
    pcbnew.SaveBoard(path, board)
    shutil.copy(pro, os.path.join(work, f"{cfg['name']}.kicad_pro"))   # SaveBoard rewrote it: rules + net classes back
    board = pcbnew.LoadBoard(path)              # a NewBoard() does not pick up the project's rules; a loaded one does
    if not only_place:
        freeroute(board, work)
        zones(board, cfg)
        print("stitch vias:", stitch(board, cfg))
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(out, f"{cfg['name']}.kicad_pcb"))
    make_pro(pro)                                 # SaveBoard may have rewritten it
    print(f"{cfg['name']}: {len(comps)} parts -> {os.path.join(cfg['dir'], cfg['name'] + '.kicad_pcb')}")


if __name__ == "__main__":
    main()
