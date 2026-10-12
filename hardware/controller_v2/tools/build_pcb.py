"""Build the RoboCore V2 board: V1 outline, V2 footprints with nets, placement and silkscreen sections from placement_v2.py.

Run with KiCad's Python (pcbnew):
  /Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3 tools/build_pcb.py
Writes RoboCore_V2.kicad_pcb in the project (the board is saved in a scratch folder first, because pcbnew's
SaveBoard rewrites the sibling .kicad_pro).
"""
import math, os, re, shutil, subprocess, sys, tempfile, xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import pcbnew  # noqa: E402
from gen_sch import sexp_block  # noqa: E402
import placement_v2 as PL  # noqa: E402

V1 = os.path.join(os.path.dirname(PROJ), "RoboCore", "RoboCore.kicad_pcb")
FPLIB = "/Applications/KiCad.app/Contents/SharedSupport/footprints"
CLI = "/Applications/KiCad.app/Contents/MacOS/kicad-cli"
MM = pcbnew.FromMM
M3D = "${KICAD10_3DMODEL_DIR}"
LOCAL3D = "${KIPRJMOD}/lib/3d"
MODEL_MAP = {   # footprint -> (model, scale, z rotation[, offset]); for parts without a model in the KiCad library
    # manufacturer models from LCSC/EasyEDA (lib/3d), shifted to the KiCad footprint origin
    "Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12": (f"{LOCAL3D}/USB-C_SMD-TYPE-C-31-M-12_1.step", (1, 1, 1), 180, (0, -1.03, 0)),
    "RoboCoreV2:AMASS_XT30UPB-M_1x02_P5.0mm_Vertical": (f"{LOCAL3D}/CONN-TH_XT30UPB-M.step", (1, 1, 1), 0, (2.5, 0, 0)),
    "LED_SMD:LED_WS2812B-2020_PLCC4_2.0x2.0mm": (f"{LOCAL3D}/LED-SMD_4P-L2.0-W2.0-H0.8-TL_WS2812B-2020.step", (1, 1, 1), 0, (0, 0, 0)),
    "Buzzer_Beeper:MagneticBuzzer_CUI_CMT-8504-100-SMT": (f"{LOCAL3D}/BUZ-SMD_4P-L8.5-W8.5-P8.50-TL-A.step", (1, 1, 1), 0, (0, 0, 0)),
    "Button_Switch_SMD:SW_SPDT_CK_JS102011SAQN": (f"{LOCAL3D}/SW-SMD_JS102011SAQN.step", (1, 1, 1), 0, (0, 0, 0)),
    "Package_SON:Texas_DRC0010J_ThermalVias": (f"{M3D}/Package_SON.3dshapes/VSON-10-1EP_3x3mm_P0.5mm_EP1.65x2.4mm.step", (1, 1, 1), 0),
    "Package_DFN_QFN:WQFN-16-1EP_3x3mm_P0.5mm_EP1.68x1.68mm_ThermalVias": (f"{M3D}/Package_DFN_QFN.3dshapes/WQFN-16-1EP_3x3mm_P0.5mm_EP1.6x1.6mm.step", (1, 1, 1), 0),
    "Package_DFN_QFN:Texas_VQFN-RNR0011A-11": (f"{M3D}/Package_DFN_QFN.3dshapes/DFN-10-1EP_2x3mm_P0.5mm_EP0.64x2.4mm.step", (1, 0.833, 1), 0),
    "Package_SO:Vishay_PowerPAK_1212-8_Single": (f"{M3D}/Package_SON.3dshapes/VSON-8_3.3x3.3mm_P0.65mm_NexFET.step", (1, 1, 1), 0),
    "Fuse:Fuse_1812_4532Metric": (f"{M3D}/Resistor_SMD.3dshapes/R_1812_4532Metric.step", (1, 1, 1), 0),
}


def base_board(path):
    """V1 board text with only the setup and the outline kept (all V1 artwork dropped, Fred 2026-10-04)."""
    t = open(V1).read()
    keep, i = [], t.index("\n\t(") - 1
    items = []
    while True:
        j = t.find("\n\t(", i)
        if j < 0:
            break
        b = sexp_block(t, j + 2)
        i = j + 2 + len(b)
        items.append(b)
    kept_uuids = set()
    for b in items:
        head = re.match(r"\((\w+)", b).group(1)
        lay = re.search(r'\(layer "([^"]+)"', b)
        if head in ("version", "generator", "generator_version", "general", "paper", "layers", "setup", "embedded_fonts"):
            keep.append(b)
        elif head.startswith("gr_") and lay and lay.group(1) == "Edge.Cuts":
            keep.append(b)
            u = re.search(r'\(uuid "([^"]+)"\)', b)
            if u:
                kept_uuids.add(u.group(1))
    head = t[:t.index("\n\t(") + 1]
    title = '\t(title_block\n\t\t(title "RoboCore V2")\n\t\t(date "2026-10-04")\n\t\t(rev "2.0")\n\t\t(company "RoboCore Zambia / Plastal-Bot Builders")\n\t)\n'
    body = "\n".join("\t" + b for b in keep)
    body = body.replace('\t(layers', title + '\t(layers', 1)
    open(path, "w").write(head + body + "\n)\n")


def netlist():
    out = os.path.join(tempfile.gettempdir(), "rc2_pcb_net.xml")
    subprocess.run([CLI, "sch", "export", "netlist", "--format", "kicadxml", "-o", out, "RoboCore_V2.kicad_sch"],
                   cwd=PROJ, check=True, capture_output=True)
    root = ET.parse(out).getroot()
    comps = {}
    for c in root.iter("comp"):
        sp = c.find("sheetpath")
        fields = {f.get("name"): (f.text or "") for f in c.iter("field") if f.get("name") in ("MF", "MP", "ALT", "LCSC", "Description")}
        comps[c.get("ref")] = dict(value=c.findtext("value"), footprint=c.findtext("footprint"),
                                   path=sp.get("tstamps") + c.findtext("tstamps").strip(),
                                   sheetname=sp.get("names"), fields=fields, pads={})
    for n in root.iter("net"):
        for node in n.findall("node"):
            if node.get("ref") in comps:
                comps[node.get("ref")]["pads"][node.get("pin")] = n.get("name")
    return comps


# ---------------------------------------------------------------- silkscreen
# V1 style: an outline just inside the board edge plus straight dividers, with plain area names.
# XRP style: knockout (white box) pin names beside the important connectors, knockout connector names.
def _mm_rect(bb, grow=0.0):
    return (pcbnew.ToMM(bb.GetLeft()) - grow, pcbnew.ToMM(bb.GetTop()) - grow,
            pcbnew.ToMM(bb.GetRight()) + grow, pcbnew.ToMM(bb.GetBottom()) + grow)


def _inside(p, r):
    return r[0] <= p[0] <= r[2] and r[1] <= p[1] <= r[3]


LINE_PITCH = 1.61      # KiCad stroke font: line pitch = 1.61 x text size (line spacing 1.0)


class Silk:
    def __init__(self, board):
        self.board = board
        self.block = []          # rectangles that lines must not cross (pads, part silk, labels)
        for fp in board.GetFootprints():
            if fp.IsFlipped():
                continue
            for pad in fp.Pads():
                if pad.IsOnLayer(pcbnew.F_Cu) or pad.GetAttribute() == pcbnew.PAD_ATTRIB_NPTH:
                    self.block.append(_mm_rect(pad.GetBoundingBox(), 0.3))
            for g in fp.GraphicalItems():
                if g.GetLayer() == pcbnew.F_SilkS and g.IsVisible() if hasattr(g, "IsVisible") else g.GetLayer() == pcbnew.F_SilkS:
                    self.block.append(_mm_rect(g.GetBoundingBox(), 0.2))
            if fp.GetReference().startswith("FID"):
                self.block.append(_mm_rect(fp.GetBoundingBox(False, False), 0.2))
        self.block.append((127.0, 61.0, 145.6, 87.6))       # ESP32 module body

    def _text(self, s, x, y, size, thick, angle=0, side="T", knockout=False, spacing=1.0, just=None):
        t = pcbnew.PCB_TEXT(self.board)
        t.SetText(s)
        t.SetLayer(pcbnew.B_SilkS if side == "B" else pcbnew.F_SilkS)
        t.SetTextSize(pcbnew.VECTOR2I(MM(size), MM(size)))
        t.SetTextThickness(MM(thick))
        t.SetMirrored(side == "B")
        t.SetLineSpacing(spacing)
        t.SetIsKnockout(knockout)
        if just == "left":
            t.SetHorizJustify(pcbnew.GR_TEXT_H_ALIGN_LEFT)
        t.SetTextAngleDegrees(angle)
        t.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
        self.board.Add(t)
        return t

    def box_size(self, s, size, thick, spacing=1.0, knockout=True):
        """(width, height) of a text block as plotted (the API bounding box ignores the line spacing)."""
        lines = s.split("\n")
        w = 0
        for line in lines:
            t = pcbnew.PCB_TEXT(self.board)
            t.SetText(line or " ")
            t.SetTextSize(pcbnew.VECTOR2I(MM(size), MM(size)))
            t.SetTextThickness(MM(thick))
            w = max(w, pcbnew.ToMM(t.GetBoundingBox().GetWidth()))
        h1 = 1.871 * size        # one line, as KiCad's box for the stroke font
        h = (len(lines) - 1) * LINE_PITCH * size * spacing + h1
        m = 0.2 if knockout else 0.0
        return w + m, h + m

    def knockout(self, s, x, y, angle=0, spacing=1.0, size=None, side="T"):
        size = size or PL.KO_SIZE
        t = self._text(s, x, y, size, PL.KO_THICK, angle, side=side, knockout=True, spacing=spacing)
        w, h = self.box_size(s, size, PL.KO_THICK, spacing)
        if angle % 180:
            w, h = h, w
        r = (x - w / 2, y - h / 2, x + w / 2, y + h / 2)
        if side == "T":
            self.block.append((r[0] - 0.15, r[1] - 0.15, r[2] + 0.15, r[3] + 0.15))
        return t, r

    def text(self, s, x, y, size=None, side="T", angle=0, just=None):
        size = size or PL.TXT_SIZE
        t = self._text(s, x, y, size, PL.TXT_THICK, angle, side, just=just)
        if side == "T":
            self.block.append(_mm_rect(t.GetBoundingBox(), 0.1))
        return t

    def seg(self, a, b, width=0.15):
        sh = pcbnew.PCB_SHAPE(self.board)
        sh.SetShape(pcbnew.SHAPE_T_SEGMENT)
        sh.SetStart(pcbnew.VECTOR2I(MM(a[0]), MM(a[1])))
        sh.SetEnd(pcbnew.VECTOR2I(MM(b[0]), MM(b[1])))
        sh.SetLayer(pcbnew.F_SilkS)
        sh.SetWidth(MM(width))
        self.board.Add(sh)

    def line(self, pts, closed=False, width=0.15, min_len=0.6):
        """Polyline that breaks wherever it would cross a pad, a part's silkscreen or a label."""
        pts = list(pts) + ([pts[0]] if closed else [])
        run = []
        def flush():
            if len(run) >= 2 and sum(math.dist(p, q) for p, q in zip(run, run[1:])) >= min_len:
                for p, q in zip(run, run[1:]):
                    self.seg(p, q, width)
            run.clear()
        for a, b in zip(pts, pts[1:]):
            n = max(1, int(math.dist(a, b) / 0.05))
            for i in range(n + 1):
                p = (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
                if any(_inside(p, r) for r in self.block):
                    flush()
                elif not run or math.dist(run[-1], p) > 1e-6:
                    if len(run) >= 2 and _collinear(run[-2], run[-1], p):
                        run[-1] = p
                    else:
                        run.append(p)
        flush()


def _collinear(a, b, c):
    return abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 1e-6


def _fp_silk_box(fp):
    box = None
    for g in fp.GraphicalItems():
        if g.GetLayer() == pcbnew.F_SilkS:
            r = _mm_rect(g.GetBoundingBox())
            box = r if box is None else (min(box[0], r[0]), min(box[1], r[1]), max(box[2], r[2]), max(box[3], r[3]))
    return box


def pin_labels(silk, fp, names, where, side="T"):
    """XRP-style white box with one pin name per pin, lined up with the pins (side "B": on the back, mirrored)."""
    pads = sorted((p for p in fp.Pads() if p.GetNumber().isdigit()), key=lambda p: int(p.GetNumber()))
    pos = [(pcbnew.ToMM(p.GetPosition().x), pcbnew.ToMM(p.GetPosition().y)) for p in pads][:len(names)]
    pitch = math.dist(pos[0], pos[1])
    size = getattr(PL, "KO_SIZE_BY_REF", {}).get(fp.GetReference(), PL.KO_SIZE)
    spacing = pitch / (LINE_PITCH * size)
    sb = _fp_silk_box(fp)
    if side == "B":       # the header outline is only on the top silkscreen: use the 2.54 mm body around the pads
        xs, ys = [p[0] for p in pos], [p[1] for p in pos]
        sb = (min(xs) - 1.33, min(ys) - 1.33, max(xs) + 1.33, max(ys) + 1.33)
    cx = sum(p[0] for p in pos) / len(pos)
    cy = sum(p[1] for p in pos) / len(pos)
    vertical = abs(pos[1][1] - pos[0][1]) > abs(pos[1][0] - pos[0][0])
    text = "\n".join(names)
    w, h = silk.box_size(text, size, PL.KO_THICK, spacing)
    gap = 0.3
    if vertical:          # horizontal text, one line per pin, pins top to bottom
        if pos[1][1] < pos[0][1]:
            text = "\n".join(reversed(names))
        x = sb[2] + gap + w / 2 if where == "right" else sb[0] - gap - w / 2
        silk.knockout(text, x, cy, 0, spacing, size=size, side=side)
    else:                 # pins in a row: text turned 90 degrees, lines left to right
        if pos[1][0] < pos[0][0]:
            text = "\n".join(reversed(names))
        w, h = h, w       # turned
        y = sb[1] - gap - h / 2 if where == "above" else sb[3] + gap + h / 2
        silk.knockout(text, cx, y, 90, spacing, size=size, side=side)


def imu_axes(silk, ox, oy, L):
    """Axis symbol for the IMU as mounted: +X towards the top edge, +Y towards the left edge, Z out of the board."""
    silk.seg((ox, oy), (ox, oy - L)); silk.seg((ox, oy - L), (ox - 0.35, oy - L + 0.55)); silk.seg((ox, oy - L), (ox + 0.35, oy - L + 0.55))
    silk.seg((ox, oy), (ox - L, oy)); silk.seg((ox - L, oy), (ox - L + 0.55, oy - 0.35)); silk.seg((ox - L, oy), (ox - L + 0.55, oy + 0.35))
    silk.text("X", ox + 0.7, oy - L + 0.45, 0.8)
    silk.text("Y", ox - L - 0.6, oy, 0.8)


def silkscreen(board):
    silk = Silk(board)
    fps = {fp.GetReference(): fp for fp in board.GetFootprints()}
    # 1. labels first, so the lines can break around them
    for ref, names, where, *side in PL.PIN_LABELS:
        pin_labels(silk, fps[ref], names, where, side[0] if side else "T")
    for text, x, y, ang, *side in PL.NAMES:
        silk.knockout(text, x, y, ang, side=side[0] if side else "T")
    for t in PL.TEXTS:
        side = "T" if t[4] == "F" else t[4]
        silk.text(t[0], t[1], t[2], t[3], side, t[5] if len(t) > 5 else 0, t[6] if len(t) > 6 else None)
    for text, x, y, ang in PL.REGION_NAMES:
        t = silk._text(text, x, y, PL.REGION_SIZE, 0.15, ang)
        silk.block.append(_mm_rect(t.GetBoundingBox(), 0.1))
    imu_axes(silk, *PL.IMU_AXES)
    # 2. V1 style lines: just inside the board edge, plus the dividers
    ps = pcbnew.SHAPE_POLY_SET()
    board.GetBoardPolygonOutlines(ps, False)
    ps.Inflate(-MM(PL.EDGE_INSET), pcbnew.CORNER_STRATEGY_ROUND_ALL_CORNERS, MM(0.01))
    o = ps.Outline(0)
    edge = [(pcbnew.ToMM(o.CPoint(i).x), pcbnew.ToMM(o.CPoint(i).y)) for i in range(o.PointCount())]
    silk.line(edge, closed=True)
    for pts in PL.DIVIDERS:
        silk.line(pts)
    # 3. reference designators: off (XRP style); the fab layer keeps them
    for ref, fp in fps.items():
        fp.Reference().SetVisible(ref.startswith(PL.REF_SHOWN) if PL.REF_SHOWN else False)


def main():
    work = tempfile.mkdtemp(prefix="rc2pcb_")
    base = os.path.join(work, "RoboCore_V2.kicad_pcb")
    base_board(base)
    board = pcbnew.LoadBoard(base)
    if board is None:
        sys.exit(f"could not load base board {base}")
    comps = netlist()
    nets = {}

    def net(name):
        if name not in nets:
            n = pcbnew.NETINFO_ITEM(board, name)
            board.Add(n)
            nets[name] = n
        return nets[name]

    placed = PL.placement(comps)
    missing = sorted(set(comps) - set(placed))
    if missing:
        sys.exit(f"no placement for {missing}")
    for ref, c in sorted(comps.items()):
        lib, name = c["footprint"].split(":")
        fp = pcbnew.FootprintLoad(PL.fp_lib_path(lib), name)
        fp.SetFPID(pcbnew.LIB_ID(lib, name))
        fp.SetReference(ref)
        fp.SetValue(c["value"])
        fp.SetPath(pcbnew.KIID_PATH(c["path"]))
        fp.SetSheetname(c["sheetname"])
        for k, v in c["fields"].items():
            fp.SetField(k, v)
            for f2 in fp.GetFields():
                if f2.GetName() == k:
                    f2.SetVisible(False)
        if ref == "U104":   # TI land pattern via in the SW pad: 0.5/0.2 mm leaves exactly 0.15 mm annular ring
            for pad in fp.Pads():
                if pad.GetAttribute() == pcbnew.PAD_ATTRIB_PTH:
                    pad.SetSize(pcbnew.PADSTACK.ALL_LAYERS, pcbnew.VECTOR2I(MM(0.55), MM(0.55))) if hasattr(pcbnew, "PADSTACK") else pad.SetSize(pcbnew.VECTOR2I(MM(0.55), MM(0.55)))
        if c["footprint"] in MODEL_MAP:
            path, scale, rot = MODEL_MAP[c["footprint"]][:3]
            off = MODEL_MAP[c["footprint"]][3] if len(MODEL_MAP[c["footprint"]]) > 3 else (0, 0, 0)
            models = fp.Models()
            m = models[0] if len(models) else pcbnew.FP_3DMODEL()
            m.m_Filename = path
            m.m_Scale = pcbnew.VECTOR3D(*scale)
            m.m_Rotation = pcbnew.VECTOR3D(0, 0, rot)
            m.m_Offset = pcbnew.VECTOR3D(*off)
            if not len(models):
                models.append(m)
        if ref in PL.LOCAL_CLEARANCE:
            fp.SetLocalClearance(MM(PL.LOCAL_CLEARANCE[ref]))
        for pad in fp.Pads():
            n = c["pads"].get(pad.GetNumber())
            if n:
                pad.SetNet(net(n))
        x, y, rot, side = placed[ref]
        fp.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
        board.Add(fp)             # Flip() needs the board (crashes on a loose footprint)
        if side == "B":
            fp.Flip(fp.GetPosition(), pcbnew.FLIP_DIRECTION_LEFT_RIGHT)
        fp.SetOrientationDegrees(rot)
    silkscreen(board)
    pcbnew.SaveBoard(base, board)
    shutil.copy(base, os.path.join(PROJ, "RoboCore_V2.kicad_pcb"))
    print(f"placed {len(comps)} footprints, {len(nets)} nets -> RoboCore_V2.kicad_pcb")


if __name__ == "__main__":
    main()
