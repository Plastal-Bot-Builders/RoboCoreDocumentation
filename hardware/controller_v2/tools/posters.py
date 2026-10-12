#!/usr/bin/env python3
"""Build the RoboCore technical-reference posters: A4 landscape pages (PDF + PNG previews).

    python3 tools/posters.py                 # export sources with kicad-cli, then build
    python3 tools/posters.py --no-export     # reuse docs/posters/src
    python3 tools/posters.py --src DIR       # sources from another folder (e.g. a scratch export)

Pages: V2 board (renders, connectors, GPIO, copper layers), V2 schematic sheets (split into tiles
when a sheet would print too small), sensor boards + schematics, the rev 5 robot (CAD renders,
arm, chassis details, expansion bus), and the V1 board + schematics.

Sources: kicad-cli renders (transparent background) and SVG plots go to SRC; the Fusion renders in
mech/robot/renders get their grey studio background removed (flood fill from the border) so they sit
on the white page. Output: docs/posters/RoboCore_posters_A4.pdf, preview/page_NN.png, posters.html.
Needs: Google Chrome (headless print), Pillow, numpy, scipy, PyMuPDF (fitz).
"""
import argparse, os, re, shutil, subprocess, sys, tempfile, datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
V2 = HERE.parent                                   # RoboCore_V2/
DESIGN = V2.parent                                 # RoboCoreDesign/
V1 = DESIGN / "RoboCore"
KICAD = "/Applications/KiCad.app/Contents/MacOS/kicad-cli"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DATE = datetime.date.today().isoformat()

# ----------------------------------------------------------------------------- sources
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print("  !!", " ".join(str(c) for c in cmd[:4]), "...\n", r.stderr[-400:])
    return r.returncode == 0

def export_sources(src: Path):
    """kicad-cli: schematic SVGs, V2 layer plots, transparent 3D renders."""
    sch = {"sch_v2": V2 / "RoboCore_V2.kicad_sch",
           "sch_line": V2 / "sensors/line_sensor/RoboCore_LineSensor.kicad_sch",
           "sch_us": V2 / "sensors/ultrasonic/RoboCore_Ultrasonic.kicad_sch",
           "sch_v1": V1 / "RoboCore.kicad_sch"}
    for d, f in sch.items():
        (src / d).mkdir(parents=True, exist_ok=True)
        print("  schematic", f.name); run([KICAD, "sch", "export", "svg", "--exclude-drawing-sheet", "-o", src / d, f])
    (src / "layers").mkdir(exist_ok=True)
    pcb = V2 / "RoboCore_V2.kicad_pcb"
    for L in ["F.Cu", "In1.Cu", "In2.Cu", "B.Cu"]:
        run([KICAD, "pcb", "export", "svg", "-o", src / f"layers/v2_{L}.svg", "--layers", f"{L},Edge.Cuts",
             "--page-size-mode", "2", "--exclude-drawing-sheet", pcb])
    run([KICAD, "pcb", "export", "svg", "-o", src / "layers/v2_F.SilkS.svg", "--layers", "F.SilkS,Edge.Cuts", "--black-and-white",
         "--page-size-mode", "2", "--exclude-drawing-sheet", pcb])
    (src / "renders").mkdir(exist_ok=True)
    boards = {"v2": pcb, "ls": V2 / "sensors/line_sensor/RoboCore_LineSensor.kicad_pcb",
              "us": V2 / "sensors/ultrasonic/RoboCore_Ultrasonic.kicad_pcb", "v1": V1 / "RoboCore.kicad_pcb"}
    views = {"v2": [("top", ["--side", "top", "-w", "2600", "-h", "2000"]),
                    ("bottom", ["--side", "bottom", "-w", "2600", "-h", "2000"]),
                    ("persp_top", ["--side", "top", "--perspective", "--rotate", "-28,0,-22", "-w", "2600", "-h", "1900"]),
                    ("persp_bottom", ["--side", "bottom", "--perspective", "--rotate", "28,0,22", "-w", "2600", "-h", "1900"])],
             "ls": [("top", ["--side", "top", "-w", "2400", "-h", "1200"]), ("bottom", ["--side", "bottom", "-w", "2400", "-h", "1200"]),
                    ("persp", ["--side", "top", "--perspective", "--rotate", "-30,0,-20", "-w", "2400", "-h", "1400"])],
             "us": [("top", ["--side", "top", "-w", "2400", "-h", "1400"]), ("bottom", ["--side", "bottom", "-w", "2400", "-h", "1400"]),
                    ("persp", ["--side", "top", "--perspective", "--rotate", "-30,0,-20", "-w", "2400", "-h", "1500"])],
             "v1": [("top", ["--side", "top", "-w", "2600", "-h", "2000"]), ("bottom", ["--side", "bottom", "-w", "2600", "-h", "2000"]),
                    ("persp", ["--side", "top", "--perspective", "--rotate", "-28,0,-22", "-w", "2600", "-h", "1900"])]}
    for b, f in boards.items():
        for name, opts in views[b]:
            print("  render", b, name)
            run([KICAD, "pcb", "render", "-o", src / f"renders/{b}_{name}.png", "--background", "transparent", "--quality", "high", *opts, f])

# ----------------------------------------------------------------------------- robot renders: drop the grey studio
def strip_background(src: Path, dst: Path):
    """Make the Fusion render's grey background transparent. Background = low-saturation, mid-brightness
    pixels connected to the image border (so grey parts inside the robot stay)."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im).astype(np.int16)
    rgb = a[..., :3]
    # Explicit ufunc calls on purpose: with Python 3.14 + numpy 2.2 the operator form `mx - mn` inside a
    # function was evaluated in place on mx (temporary elision), which emptied the mask.
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    diff = np.subtract(mx, mn)
    # the background colour: of the four 12 x 12 px corner patches, the least saturated one (a close-up can
    # have the robot in some corners and along most of the border)
    H, W = mx.shape
    patches = [rgb[:12, :12], rgb[:12, W-12:], rgb[H-12:, :12], rgb[H-12:, W-12:]]
    means = [pt.reshape(-1, 3).mean(axis=0) for pt in patches]
    bcol = min(means, key=lambda c: c.max() - c.min())
    if bcol.min() > 243:                                # already white (a drawing): just trim the margins
        ink = np.less(mn, 235)
        ys, xs = np.nonzero(ink)
        if len(xs):
            m = int(max(im.size) * 0.015)
            im = im.crop((max(0, xs.min() - m), max(0, ys.min() - m), min(im.size[0], xs.max() + m + 1), min(im.size[1], ys.max() + m + 1)))
        im.save(dst); return "kept (white), trimmed"
    if bcol.max() > 140:
        # light studio (ray-traced hero): neutral grey with a gradient and a soft shadow -> any low-saturation,
        # mid-brightness pixel; black parts (< 70) and white parts (> 246) are never background
        cand = np.logical_and.reduce([np.less_equal(diff, 18), np.greater_equal(mx, 70), np.less_equal(mx, 246)])
    else:
        # dark viewport (blue-grey (46,52,64) with a darker shadow and a warm-grey floor patch under the robot):
        # pixels within 26 of the background colour, or low-saturation pixels between 55 and 105 (the floor);
        # the black tyres and servos (< 55) and all coloured parts stay
        dist = np.abs(np.subtract(rgb, bcol.astype(np.int16))).max(axis=2)
        floor = np.logical_and.reduce([np.less_equal(diff, 24), np.greater_equal(mx, 55), np.less_equal(mx, 105)])
        cand = np.logical_or(np.less_equal(dist, 26), floor)
    lab, n = ndimage.label(cand)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border != 0]
    bg = np.isin(lab, border)
    # leftovers (floor-shadow fragments, dust) become background too: keep only foreground islands that
    # cover at least 1.5 % of the image (the robot is one connected body; the colour-scheme strip has three)
    fg_lab, fn = ndimage.label(np.logical_not(bg))
    sizes = ndimage.sum(np.ones_like(bg, dtype=np.int32), fg_lab, index=np.arange(1, fn + 1))
    small = np.flatnonzero(sizes < 0.015 * bg.size) + 1
    if small.size: bg = np.logical_or(bg, np.isin(fg_lab, small))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # soften the 1-px fringe next to the background
    ring = np.logical_and(ndimage.binary_dilation(bg, iterations=1), np.logical_not(bg))
    alpha[ring] = 150
    out = a[..., :3].astype(np.uint8)
    im2 = Image.fromarray(np.dstack([out, alpha]), "RGBA")
    crop_alpha(im2, margin=0.015).save(dst)
    return f"stripped ({bg.mean()*100:.0f}% background)"

def crop_alpha(im, margin=0.02, min_alpha=1):
    """Crop an RGBA image to its visible pixels plus a margin (fraction of the longer side)."""
    import numpy as np
    al = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(al >= min_alpha)
    if not len(xs): return im
    m = int(max(im.size) * margin)
    box = (max(0, xs.min() - m), max(0, ys.min() - m), min(im.size[0], xs.max() + m + 1), min(im.size[1], ys.max() + m + 1))
    return im.crop(box)

def prep_render(src: Path, dst: Path):
    """kicad-cli transparent renders keep the ray-traced floor shadow as semi-transparent grey: drop it, then crop."""
    import numpy as np
    from PIL import Image
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im).copy()
    a[..., 3] = np.where(np.greater_equal(a[..., 3], 170), a[..., 3], 0)
    crop_alpha(Image.fromarray(a, "RGBA"), margin=0.02).save(dst)

# ----------------------------------------------------------------------------- SVG helpers
NUM = r"[-+]?\d*\.?\d+"
def svg_info(path: Path):
    s = path.read_text()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    xs, ys = [], []
    for d in re.findall(r'\sd="([^"]+)"', s):
        pts = [(float(x), float(y)) for x, y in re.findall(r"(" + NUM + r")[,\s]+(" + NUM + r")", d)]
        if any(x <= 0.01 and y <= 0.01 for x, y in pts):      # background / sheet rectangle
            continue
        xs += [p[0] for p in pts]; ys += [p[1] for p in pts]
    for x, y in re.findall(r'<text[^>]*?x="(' + NUM + r')"[^>]*?y="(' + NUM + r')"', s):
        xs.append(float(x)); ys.append(float(y))
    for cx, cy in re.findall(r'<circle[^>]*?cx="(' + NUM + r')"[^>]*?cy="(' + NUM + r')"', s):
        xs.append(float(cx)); ys.append(float(cy))
    if not xs:
        return s, vb, (vb[0], vb[1], vb[2], vb[3])
    m = 4.0
    x0, y0 = max(vb[0], min(xs) - m), max(vb[1], min(ys) - m)
    x1, y1 = min(vb[0] + vb[2], max(xs) + m), min(vb[1] + vb[3], max(ys) + m)
    return s, vb, (x0, y0, x1 - x0, y1 - y0)

_svg_n = 0
def inline_svg(text: str, box):
    """Return the SVG inlined with a cropped viewBox; ids made unique per instance."""
    global _svg_n; _svg_n += 1
    pre = f"s{_svg_n}_"
    text = re.sub(r"<\?xml[^>]*\?>", "", text)
    text = re.sub(r"<!DOCTYPE[^>]*>", "", text)
    ids = set(re.findall(r'\sid="([^"]+)"', text))
    for i in ids:
        text = text.replace(f'id="{i}"', f'id="{pre}{i}"').replace(f"url(#{i})", f"url(#{pre}{i})").replace(f'href="#{i}"', f'href="#{pre}{i}"')
    root = re.search(r"<svg\b[^>]*>", text)
    attrs = root.group(0)[4:-1]
    attrs = re.sub(r'\s(width|height|viewBox)="[^"]*"', "", attrs)
    new = f'<svg{attrs} viewBox="{box[0]:.3f} {box[1]:.3f} {box[2]:.3f} {box[3]:.3f}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">'
    return text[:root.start()] + new + text[root.end():]

def tiles_for(box, avail_w=279.0, avail_h=176.0, min_scale=0.78):
    """Split a sheet's content box into tiles so each prints at >= min_scale (mm on paper per mm on sheet)."""
    x, y, w, h = box
    def scale(tw, th): return min(avail_w / tw, avail_h / th)
    if scale(w, h) >= min_scale:
        return [(box, "")]
    ov = 0.04
    opts = []
    for nx, ny in [(2, 1), (1, 2), (2, 2), (3, 1), (1, 3), (3, 2), (2, 3)]:
        tw, th = w / nx * (1 + ov), h / ny * (1 + ov)
        opts.append((nx * ny, nx, ny, scale(tw, th)))
    ok = [o for o in opts if o[3] >= min_scale]
    n, nx, ny, sc = min(ok, key=lambda o: (o[0], -o[3])) if ok else max(opts, key=lambda o: o[3])
    tiles = []
    for j in range(ny):
        for i in range(nx):
            tw, th = w / nx, h / ny
            tx = x + i * tw - (tw * ov / 2 if i else 0)
            ty = y + j * th - (th * ov / 2 if j else 0)
            tw2 = tw * (1 + ov / 2 * ((i > 0) + (i < nx - 1)))
            th2 = th * (1 + ov / 2 * ((j > 0) + (j < ny - 1)))
            pos = []
            if ny > 1: pos.append(["top", "middle", "bottom"][j if ny == 3 else j * 2])
            if nx > 1: pos.append(["left", "centre", "right"][i if nx == 3 else i * 2])
            tiles.append(((tx, ty, tw2, th2), f"part {j*nx+i+1} of {n} ({' '.join(pos)})"))
    return tiles

# ----------------------------------------------------------------------------- HTML
CSS = """
@page { size: 297mm 210mm; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
.page { width: 297mm; height: 210mm; box-sizing: border-box; padding: 7mm 8mm 5mm 8mm; page-break-after: always;
  position: relative; overflow: hidden; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1c2430;
  background: #fff; display: flex; flex-direction: column; }
.page:last-child { page-break-after: auto; }
.hdr { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1.1mm solid #0b3d91; padding-bottom: 1.6mm; margin-bottom: 3mm; }
.hdr .k { font-size: 8pt; letter-spacing: .2em; color: #0b3d91; font-weight: 700; text-transform: uppercase; margin-bottom: .8mm; }
.hdr h1 { font-size: 18pt; margin: 0; font-weight: 700; line-height: 1.1; }
.hdr h1 span { font-weight: 300; color: #4a5565; }
.hdr .r { font-size: 7.5pt; color: #5a6472; text-align: right; line-height: 1.35; }
.hdr .r b { color: #0b3d91; font-size: 9pt; }
.body { flex: 1; display: flex; gap: 5mm; min-height: 0; }
.col { display: flex; flex-direction: column; gap: 3mm; min-height: 0; min-width: 0; }
.ftr { border-top: .3mm solid #c9d0d8; margin-top: 2mm; padding-top: 1.1mm; font-size: 6.3pt; color: #6b7482; display: flex; justify-content: space-between; gap: 6mm; }
.ftr .src { flex: 1; }
table { border-collapse: collapse; width: 100%; font-size: 7pt; line-height: 1.25; }
th { background: #0b3d91; color: #fff; text-align: left; padding: .8mm 1.3mm; font-weight: 600; font-size: 6.8pt; }
td { padding: .65mm 1.3mm; border-bottom: .2mm solid #dbe1e8; vertical-align: top; }
tr:nth-child(even) td { background: #f3f6fa; }
td.m, th.m { font-family: Menlo, monospace; font-size: 6.6pt; white-space: nowrap; }
.fig { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 0; min-width: 0; flex: 1; }
.fig img, .fig svg { max-width: 100%; max-height: 100%; object-fit: contain; }
.fig .im { flex: 1; min-height: 0; width: 100%; display: flex; align-items: center; justify-content: center; }
.fig .im img { width: auto; height: auto; max-width: 100%; max-height: 100%; }
.cap { font-size: 7pt; color: #3c4654; margin-top: 1.2mm; text-align: center; line-height: 1.3; }
.cap b { color: #0b3d91; }
h2 { font-size: 8.5pt; color: #0b3d91; margin: 0 0 1.2mm 0; text-transform: uppercase; letter-spacing: .1em; font-weight: 700; }
.facts { font-size: 7.3pt; line-height: 1.38; margin: 0; padding-left: 3.5mm; }
.facts li { margin-bottom: .5mm; }
.kv { font-size: 7.3pt; line-height: 1.38; }
.kv div { display: flex; border-bottom: .2mm solid #dbe1e8; padding: .5mm 0; }
.kv div b { width: 30mm; flex: none; color: #0b3d91; }
.grid { display: grid; gap: 3mm 4mm; flex: 1; min-height: 0; }
.grid .fig { min-height: 0; }
.sheet { flex: 1; min-height: 0; display: flex; }
.note { font-size: 6.8pt; color: #4a5565; background: #f3f6fa; border-left: .8mm solid #0b3d91; padding: 1.5mm 2mm; line-height: 1.35; }
.badge { display: inline-block; font-size: 6.5pt; padding: .3mm 1.5mm; border-radius: 1mm; background: #e8eef9; color: #0b3d91; font-weight: 600; margin-left: 2mm; }
.layers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
.layers .fig svg { border: .25mm solid #dbe1e8; }
"""

class Doc:
    def __init__(self):
        self.pages = []
    def page(self, series, title, sub, body, sources=""):
        n = len(self.pages) + 1
        self.pages.append((series, title, sub, body, sources))
    def html(self):
        total = len(self.pages)
        out = []
        for n, (series, title, sub, body, sources) in enumerate(self.pages, 1):
            out.append(f"""<section class="page">
<div class="hdr"><div><div class="k">RoboCore · {series}</div><h1>{title}{(' <span>· ' + sub + '</span>') if sub else ''}</h1></div>
<div class="r"><b>{n} / {total}</b><br>RoboCore Zambia · technical reference<br>{DATE}</div></div>
<div class="body">{body}</div>
<div class="ftr"><div class="src">{sources}</div><div>A4 landscape · print at 100 % (no scaling)</div></div>
</section>""")
        return f'<!doctype html><html><head><meta charset="utf-8"><title>RoboCore posters</title><style>{CSS}</style></head><body>{"".join(out)}</body></html>'

def img(path: Path, cap="", style=""):
    if not Path(path).exists():
        return f'<div class="fig" style="{style}"><div class="im"><div class="note">missing: {Path(path).name}</div></div><div class="cap">{cap}</div></div>'
    return f'<div class="fig" style="{style}"><div class="im"><img src="file://{Path(path).resolve()}"></div>{f"<div class=cap>{cap}</div>" if cap else ""}</div>'

def table(head, rows, mono_cols=()):
    h = "".join(f"<th{' class=m' if i in mono_cols else ''}>{c}</th>" for i, c in enumerate(head))
    b = "".join("<tr>" + "".join(f"<td{' class=m' if i in mono_cols else ''}>{c}</td>" for i, c in enumerate(r)) + "</tr>" for r in rows)
    return f"<table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>"

def facts(items):
    return "<ul class=facts>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"

# ----------------------------------------------------------------------------- content
def build(src: Path, out: Path):
    R = out / "src_renders"; R.mkdir(parents=True, exist_ok=True)
    for p in sorted((src / "renders").glob("*.png")):
        if not (R / p.name).exists() or (R / p.name).stat().st_mtime < p.stat().st_mtime:
            prep_render(p, R / p.name)
    ROB = out / "src_robot"; ROB.mkdir(parents=True, exist_ok=True)
    renders = V2 / "mech/robot/renders"
    robot_imgs = ["robot_hero", "robot_hero_noarm", "robot_top", "robot_side", "robot_iso_front", "robot_iso_rear", "robot_under_iso",
                  "robot_noarm_iso", "arm_poses", "arm_closeup", "arm_closeup_left", "arm_gripper_under", "chassis_wheel_side",
                  "chassis_rear", "chassis_deck", "sonar_pod", "sonar_pod_rear", "bus_clip", "robot_arm_floor_side"]
    for n in robot_imgs:
        s = renders / f"{n}.png"
        if s.exists() and not (ROB / f"{n}.png").exists():
            print("  robot render", n, strip_background(s, ROB / f"{n}.png"))
    for n in ["schemes/colour_schemes", "rev5/bus_spec"]:
        s = renders / f"{n}.png"; d = ROB / (Path(n).name + ".png")
        if s.exists() and not d.exists():
            print("  robot render", n, strip_background(s, d))
    rb = lambda n: ROB / f"{n}.png"

    doc = Doc()
    # ---------------------------------------------------------------- 1. V2 overview
    parts = [
        ("MCU", "ESP32-S3-WROOM-1-N8R2", "Wi-Fi + BLE, native USB (one-click upload). Alternates N16R2, N8; never R8/R16V (octal PSRAM takes IO35–37)"),
        ("Motor driver", "TI DRV8411A (WQFN-16)", "Both motors, 4 A peak; current limit 1.0 A (JST-SH contact rating)"),
        ("Motor connectors", "JST SH 6-pin ×2", "XRP motor plug: M+, M−, 3.3 V, Enc A, Enc B, GND"),
        ("IMU", "ST LSM6DSOX (LGA-14)", "6-axis; mounted at the board centre, over the wheel axle. Alternate LSM6DSO32"),
        ("3.3 V rail", "TI TPS63001 buck-boost", "Up to ~1.2 A from a 1S cell, holds 3.3 V down to a flat cell"),
        ("Motor / servo rail", "TI TPS61089 boost → 5.5 V", "SG90-type servos stay inside 4.8–6 V; Q102 P-FET cuts the boost when OFF"),
        ("Charger", "MCP73871 (USB-C)", "1 A charge, power-path; charging works with the switch off. JP101 selects 1.65 A / 500 mA"),
        ("Battery input", "XT30 + reverse/over-voltage cut-off", "1S Li-ion only (3.0–4.2 V). Q103/Q104 + TPS3700 survive a reversed or 2S/3S pack"),
        ("Power switch", "C&K JS102011 slide switch", "Right edge; grounds the P-FET gates. OFF draws ~0.03 mA"),
        ("USB-C", "HRO TYPE-C-31-M-12 + ESD", "Charging and programming"),
        ("Lights", "WS2812B-2020-V6 RGB + 5 status LEDs", "CHG, FULL, USB, 3V3, MOT"),
        ("Sound / buttons", "CMT-8504 buzzer; RESET, BOOT, USER", "PWM tones; USER on IO42"),
        ("Ports", "Qwiic (I2C), 2 × 14-pin expansion", "3.3 V, VMOT, switched battery, spare GPIOs, UART, I2C"),
    ]
    body = f"""
<div class="col" style="flex:1.25">{img(R/'v2_top.png', '<b>Top side</b> — all SMD parts are on top; white knockout boxes carry the pin names of every header (servos, ultrasonic, line follower, battery)')}</div>
<div class="col" style="flex:1">
<h2>At a glance</h2>
<div class="kv">
<div><b>Board</b><span>68 × 60 × 1.6 mm, 4 layers, ENIG, green mask / white silk</span></div>
<div><b>Brain</b><span>ESP32-S3 (dual-core 240 MHz, 8 MB flash, 2 MB PSRAM)</span></div>
<div><b>Drives</b><span>2 DC motors with encoders, 4 servos, buzzer, RGB LED</span></div>
<div><b>Senses</b><span>IMU, 3-channel line follower, ultrasonic, battery voltage, motor current</span></div>
<div><b>Power</b><span>1S Li-ion pack (XT30), USB-C charging, 3.3 V + 5.5 V rails</span></div>
<div><b>Mounting</b><span>4 × M2 holes (2.2 mm), side notches for the servo cables</span></div>
<div><b>Design</b><span>Open-STEM XRP-compatible pinout, drawn from scratch in KiCad 10</span></div>
</div>
<h2 style="margin-top:3mm">Main parts</h2>
{table(["Function", "Part", "Note"], parts)}
</div>"""
    doc.page("V2 controller", "RoboCore V2", "robot controller, rev 2.0",
             body, "RoboCore_V2.kicad_pcb (2026-10-08) · render: kicad-cli pcb render · docs/RoboCore_V2_spec.md")

    # ---------------------------------------------------------------- 2. connectors + GPIO
    conns = [
        ("J301 / J302", "Motor 1 / 2", "JST SH 6", "M+, M−, 3V3, ENC A, ENC B, GND (XRP order)"),
        ("J401 J407 / J402 J408", "Servo 1 3 / 2 4", "2.54 mm 1×3 ×4", "Signal, 5.5 V, GND — 1 + 3 on the left notch, 2 + 4 on the right"),
        ("J403", "Ultrasonic", "2.54 mm 1×4", "3V3, TRIG, ECHO, GND (HC-SR04 order: straight cable). 3.3 V module (HC-SR04+, RCWL-1601)"),
        ("J404", "Line follower", "2.54 mm 1×5", "3V3, GND, L, C, R — 3-channel TCRT5000-type module, analog outputs"),
        ("J405 / J406", "Expansion A / B", "1×14 female ×2", "See the pin order table"),
        ("J201", "Qwiic", "JST SH 4", "GND, 3V3, SDA, SCL"),
        ("J102", "Battery", "XT30", "1S Li-ion only, 4.2 V max; 1S2P/3P/4P packs need no change"),
        ("J101", "USB-C", "16-pin", "Charging + programming"),
        ("JP101", "Charge current", "solder jumper (back)", "1-2 adapter 1.65 A (default), 2-3 USB 500 mA"),
        ("TP101–105", "Test pads (back)", "", "3V3, BAT, GND and rails"),
    ]
    exp = [(1, "3.3 V", "3.3 V"), (2, "GND", "GND"), (3, "IR left (IO7)", "I2C SDA (IO8)"), (4, "IR centre (IO10)", "I2C SCL (IO9)"),
           (5, "IR right (IO2)", "UART TX (IO43)"), (6, "Ultrasonic TRIG (IO40)", "UART RX (IO44)"), (7, "Ultrasonic ECHO (IO41)", "Servo 3 (IO35)"),
           (8, "Servo 1 (IO38)", "Servo 4 (IO36)"), (9, "Servo 2 (IO39)", "IO37"), (10, "Buzzer (IO47)", "IMU INT1 (IO1)"),
           (11, "RGB LED data out", "USER button (IO42)"), (12, "IO3", "EN (reset)"), (13, "VMOT 5.5 V", "VSYS_SW (switched battery)"), (14, "GND", "GND")]
    gpio = [("IO0", "BOOT button"), ("IO1", "IMU INT1"), ("IO2", "IR right (ADC)"), ("IO3", "Expansion (strapping pin)"),
            ("IO4", "Battery voltage (ADC, ÷2)"), ("IO5 / IO6", "Motor 1 / 2 current sense (ADC)"), ("IO7", "IR left (ADC)"),
            ("IO8 / IO9", "I2C SDA / SCL (IMU, Qwiic)"), ("IO10", "IR centre (ADC)"), ("IO11 / IO12", "Motor 1 IN1 / IN2"),
            ("IO13 / IO14", "Motor 2 IN1 / IN2"), ("IO15 / IO16", "Encoder 1 A / B"), ("IO17 / IO18", "Encoder 2 A / B"),
            ("IO19 / IO20", "USB D− / D+"), ("IO21", "Motor driver nFAULT"), ("IO35 / IO36", "Servo 3 / 4"), ("IO37", "Expansion B"),
            ("IO38 / IO39", "Servo 1 / 2"), ("IO40 / IO41", "Ultrasonic TRIG / ECHO"), ("IO42", "USER button"),
            ("IO43 / IO44", "UART TX / RX → expansion"), ("IO47", "Buzzer (PWM)"), ("IO48", "WS2812 RGB LED"), ("IO45 / IO46", "strapping pins, unused")]
    body = f"""
<div class="col" style="flex:1.05">{img(R/'v2_bottom.png', '<b>Bottom side</b> — artwork, test pads, charge-current jumper JP101 and the pin names of both expansion headers')}
<div class="note">IR inputs use ADC1, which keeps working with Wi-Fi on. IMU axes: +X towards the top edge, +Y towards the left edge (firmware remaps).</div></div>
<div class="col" style="flex:1.15"><h2>Connectors</h2>{table(["Ref", "Name", "Type", "Pins / notes"], conns, (0,))}
<h2 style="margin-top:2mm">ESP32-S3 GPIO map</h2>{table(["GPIO", "Signal"], gpio[:12], (0,))}</div>
<div class="col" style="flex:0.95"><h2>Expansion headers (pin 1 at the top)</h2>{table(["Pin", "J405 EXPANSION A", "J406 EXPANSION B"], exp, (0,))}
<h2 style="margin-top:2mm">GPIO map (continued)</h2>{table(["GPIO", "Signal"], gpio[12:], (0,))}</div>"""
    doc.page("V2 controller", "Connectors and pinout", "", body, "docs/RoboCore_V2_spec.md · tools/spec_v2.py")

    # ---------------------------------------------------------------- 3. perspective views
    body = f"""
<div class="col" style="flex:1">{img(R/'v2_persp_top.png', '<b>Top</b> — ESP32-S3 at the top with the antenna over the edge, motor sockets upper left/right, servo headers in the side notches, expansion headers in the centre, sensors / battery / USB-C along the bottom edge, power switch on the right edge')}</div>
<div class="col" style="flex:1">{img(R/'v2_persp_bottom.png', '<b>Bottom</b> — flat back (through-hole pin tails only, 1.5 mm): RoboCore Zambia and Plastal-Bot Builders logos, test pads TP101–105, JP101, expansion pin names')}</div>"""
    doc.page("V2 controller", "3D views", "", body, "kicad-cli pcb render --perspective, transparent background")

    # ---------------------------------------------------------------- 4. copper layers
    L = {}
    for name in ["F.Cu", "In1.Cu", "In2.Cu", "B.Cu", "F.SilkS"]:
        p = src / f"layers/v2_{name}.svg"
        if p.exists():
            s, vb, box = svg_info(p); L[name] = inline_svg(s, (vb[0], vb[1], vb[2], vb[3]))
    def lay(name, cap):
        return f'<div class="fig" style="height:{60*1.0+2:.0f}mm"><div class="im" style="width:68mm;height:60mm">{L.get(name, "")}</div><div class="cap">{cap}</div></div>'
    body = f"""
<div class="col" style="flex:1">
<div class="layers">{lay('F.Cu', '<b>F.Cu</b> — top signal layer')}{lay('In1.Cu', '<b>In1.Cu</b> — inner 1, power / ground pours')}{lay('In2.Cu', '<b>In2.Cu</b> — inner 2, signal and battery tracks')}{lay('B.Cu', '<b>B.Cu</b> — bottom signal layer')}</div>
<div style="display:flex;gap:5mm;flex:1;min-height:0;margin-top:3mm">
<div class="fig" style="flex:0 0 68mm"><div class="im" style="width:68mm;height:60mm">{L.get('F.SilkS','')}</div><div class="cap"><b>F.SilkS</b> — front silkscreen</div></div>
<div class="col" style="flex:1"><h2>Stack-up and rules</h2>{table(["Item", "Value"], [
 ("Layers", "4: F.Cu · In1.Cu · In2.Cu · B.Cu, 1 oz copper outer and inner"),
 ("Material", "FR-4 S1000H TG150, 1.6 mm, green mask, white silkscreen, ENIG"),
 ("Track / space", "0.2 mm signals (6 / 6 mil rules); fat tracks for VMOT and the battery"),
 ("Vias", "0.3 mm hole / 0.6 mm ring, tented; 0.2 mm thermal vias in the IC pads (no resin fill)"),
 ("Mask", "no solder-mask web on the 0.15 mm gaps of U202 (LGA-14, 0.5 mm pitch)"),
 ("Holes", "4 × 2.2 mm non-plated (M2); side notches 5 mm deep for the servo cables"),
 ("Artwork", "front: knockout pin boxes beside every header, icons, dividers; back: logos and project text, 20 tented vias under it"),
 ("Checks", "DRC 0 errors, 0 unconnected; schematic parity clean (2026-10-08)")])}
<div class="note" style="margin-top:2mm">Plots are at 1 : 1 as seen from the top (the bottom layer is not mirrored). Made with kicad-cli pcb export svg.</div></div></div></div>"""
    doc.page("V2 controller", "Copper layers", "1 : 1 plots", body, "RoboCore_V2.kicad_pcb · kicad-cli pcb export svg")

    # ---------------------------------------------------------------- 5+. schematic sheets
    def sheet_pages(series, title_prefix, folder, sheets, source):
        for fname, label, desc in sheets:
            p = src / folder / fname
            if not p.exists():
                print("  missing sheet", p); continue
            s, vb, box = svg_info(p)
            tiles = tiles_for(box)
            for tbox, part in tiles:
                sc = min(279.0 / tbox[2], 176.0 / tbox[3])
                sub = f"{label}{(' · ' + part) if part else ''}"
                body = f'<div class="sheet">{inline_svg(s, tbox)}</div>'
                doc.page(series, title_prefix, sub + f' <span class="badge">scale {sc:.2f}</span>', body,
                         f"{source} · {desc}" + (f" · this sheet is printed in {len(tiles)} parts with a 4 % overlap" if part else ""))
    sheet_pages("V2 schematics", "RoboCore V2 schematic", "sch_v2", [
        ("RoboCore_V2.svg", "Root sheet", "hierarchy: MCU, Power, Motors, IO connectors"),
        ("RoboCore_V2-MCU.svg", "MCU", "ESP32-S3 module, USB, IMU, buttons, LEDs, buzzer"),
        ("RoboCore_V2-Power.svg", "Power", "charger, battery protection, switch, 3.3 V buck-boost, 5.5 V boost"),
        ("RoboCore_V2-Motors.svg", "Motors", "DRV8411A, motor sockets, current sense"),
        ("RoboCore_V2-IO connectors.svg", "IO connectors", "servos, ultrasonic, line follower, expansion, Qwiic")],
        "RoboCore_V2.kicad_sch (generated by tools/gen_sch.py from tools/spec_v2.py)")

    # ---------------------------------------------------------------- sensor boards
    body = f"""
<div class="col" style="flex:1">
<h2>Line sensor <span class="badge">60 × 24 mm, 2 layers</span></h2>
<div style="display:flex;gap:3mm;flex:1;min-height:0">{img(R/'ls_persp.png', '3 × TCRT5000 on the underside, LM339 comparator, 3 green indicator LEDs')}</div>
<div style="display:flex;gap:3mm;height:34mm">{img(R/'ls_top.png', 'top')}{img(R/'ls_bottom.png', 'underside (mirrored silkscreen)')}</div>
{table(["Item", "Value"], [("Connector", "JST SH 5: GND, 3V3, L, C, R (analog, 0.3 V white … 2.8 V black)"),
 ("Supply", "3.3 V, about 45 mA"), ("Mounting", "2 × M3, 51.6 mm apart; underside 9–13 mm above the floor"),
 ("Sensors", "16 mm apart, for 19 mm tape; LEDs show which channel sees the line")])}</div>
<div class="col" style="flex:1">
<h2>Ultrasonic <span class="badge">46 × 22 mm, 2 layers (HC-SR04 size)</span></h2>
<div style="display:flex;gap:3mm;flex:1;min-height:0">{img(R/'us_persp.png', 'CS100A ranging chip, 8 MHz crystal, 40 kHz transmit + receive transducers')}</div>
<div style="display:flex;gap:3mm;height:34mm">{img(R/'us_top.png', 'rear face: chip, crystal, connector')}{img(R/'us_bottom.png', 'front face: transducers, T left / R right')}</div>
{table(["Item", "Value"], [("Connector", "JST SH 4: GND, 3V3, TRIG, ECHO (HC-SR04 timing: 58 µs per cm)"),
 ("Supply", "3.3 V, 5.3 mA"), ("Mounting", "4 × M2 at (±20.5, ±7.5) mm; ≥ 4–5 cm above the floor (70° beam)"),
 ("Range", "2 cm to about 4 m; T left, R right seen from the front")])}</div>"""
    doc.page("Sensor boards", "Line sensor and ultrasonic", "our own versions of the two bought-in modules",
             body, "sensors/line_sensor, sensors/ultrasonic · docs/RoboCore_Sensors.md · shelved 2026-10-08: the robot uses bought-in HC-SR04 / 3-channel modules on 2.54 mm headers for now")
    sheet_pages("Sensor boards", "Line sensor schematic", "sch_line", [("RoboCore_LineSensor-Line sensor.svg", "Line sensor", "TCRT5000 ×3, LM339, LEDs")],
                "sensors/line_sensor/RoboCore_LineSensor.kicad_sch")
    sheet_pages("Sensor boards", "Ultrasonic schematic", "sch_us", [("RoboCore_Ultrasonic-Ultrasonic.svg", "Ultrasonic", "CS100A reference circuit")],
                "sensors/ultrasonic/RoboCore_Ultrasonic.kicad_sch")

    # ---------------------------------------------------------------- robot
    body = f"""
<div class="col" style="flex:1.45">{img(rb('robot_hero'), '<b>Rev 5 with the arm module</b> — construction-yellow scheme. Deck-down print, no supports; motors snap in from below; battery slides in from the back')}
<div style="height:30mm;display:flex">{img(rb('colour_schemes'), 'Colour schemes: teal, orange, construction yellow')}</div></div>
<div class="col" style="flex:1">
<h2>Key numbers</h2>
{table(["Item", "Value"], [("Body", "162 × 166 mm over the walls, 52 mm to the deck top; cross-shaped plan, every corner chamfered 45°"),
 ("Drive", "2 × TT gear motors with encoders (6 V, 160 rpm), wheels clamp to the shaft; twin ½\" ball casters at the rear"),
 ("Board", "RoboCore V2 on the deck, 4 × M2 heat-set inserts; IMU over the wheel axle"),
 ("Battery", "BatteryHolder3S, 3 × 18650 wired 1S3P, slides in from the back behind two snap flaps"),
 ("Sensors", "HC-SR04 in a headlight-style pod on the front dock; line-sensor sled under the nose (3 heights)"),
 ("Arm", "excavator-style boom, MG90S shoulder, SG90 gripper; bolts to the front dock with 2 × M3"),
 ("Expansion", "flush bus groove with 54 detents, 10 Technic-pitch holes, M3 dock inserts, 8 mm grid"),
 ("Printing", "chassis deck-down with no supports, ≥ 20 % infill; every file in print/ is already oriented")])}
<h2 style="margin-top:3mm">What it fixes (vs. the XRP)</h2>
{facts(["Real tyres with 2 mm frame clearance, wheels screwed to the shaft, not press-fit",
        "IMU directly over the axle and a rigid 4-screw board mount: no drift from flex",
        "Li-ion pack with USB-C charging and reverse / over-voltage protection instead of AA cells",
        "Motors held by snap hooks and stops, swappable in minutes; screws + inserts where students take things apart",
        "Antenna left in the open at the top edge"])}</div>"""
    doc.page("Robot", "RoboCore V2 robot", "chassis rev 5 (Fusion 360)", body,
             "mech/robot/RoboCore_V2_Robot.f3d · renders by fusion/view.py · mech/robot/README.md")

    body = '<div class="grid" style="grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr)">' + "".join([
        img(rb('robot_top'), '<b>Top</b>'), img(rb('robot_side'), '<b>Side</b> (arm raised)'), img(rb('robot_iso_front'), '<b>Front isometric</b>'),
        img(rb('robot_iso_rear'), '<b>Rear isometric</b> — battery door, cable ports, ballast clips'), img(rb('robot_under_iso'), '<b>Underside</b> — open body, motors, line-sensor sled, casters'),
        img(rb('robot_noarm_iso'), '<b>Without the arm</b> — the base robot')]) + "</div>"
    doc.page("Robot", "Views", "rev 5", body, "mech/robot/renders/robot_*.png")

    body = f"""
<div class="col" style="flex:1">
<div style="flex:1.1;display:flex;min-height:0">{img(rb('arm_poses'), '<b>Arm poses</b> — on the floor, carrying, raised')}</div>
<div style="flex:1;display:flex;gap:4mm;min-height:0">{img(rb('arm_closeup'), '<b>Shoulder</b> — MG90S servo, RoboCore gear badge, hex bolt head, truss windows, hydraulic cylinder')}{img(rb('arm_gripper_under'), '<b>Gripper</b> — SG90 servo, horn and screws under the wrist; gear-linked jaws with bucket teeth')}{img(rb('robot_arm_floor_side'), '<b>Reach</b> — arm lowered to the floor')}</div></div>"""
    doc.page("Robot", "Arm module", "excavator-style", body, "mech/robot/renders/arm_*.png · joints: shoulder, two gear-linked jaws")

    body = '<div class="grid" style="grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr)">' + "".join([
        img(rb('chassis_wheel_side'), '<b>Wheel side</b> — hub, fender arch, engine louvres, RoboCore badge, Ø16 access hole for the wheel screw'),
        img(rb('chassis_rear'), '<b>Rear</b> — hazard chevrons, tail lights, battery opening with snap flaps, cable ports'),
        img(rb('chassis_deck'), '<b>Deck</b> — tread-plate walkways, board window, plug slots'),
        img(rb('sonar_pod'), '<b>Sonar pod</b> — headlight-style, on the dock plate; the HC-SR04 snaps in from the back'),
        img(rb('sonar_pod_rear'), '<b>Sonar pod, rear</b> — header up, Dupont plugs inside the pod'),
        img(rb('bus_clip'), '<b>Bus clip</b> — tongue in the groove, thumb screw on the deck, M3 boss for accessories')]) + "</div>"
    doc.page("Robot", "Chassis details", "rev 5", body, "mech/robot/renders/chassis_*.png, sonar_pod*.png, bus_clip.png")

    body = f"""
<div class="col" style="flex:1.5">{img(rb('bus_spec'), '<b>Expansion bus drawing</b> — groove, detents, hole row and front dock; origin at the floor point under the axle middle, x right, y forward, z up (mm)')}</div>
<div class="col" style="flex:1"><h2>Attachment points</h2>{table(["Feature", "Value"], [
 ("Bus groove", "1.8 mm deep, back face z 46–49, flat top, 45° underside; every straight run and outside chamfer except the wheel sides"),
 ("Detents", "V-notches 1.4 × 0.7 mm every 8 mm along each run, plus one per chamfer: 54 in all"),
 ("Bus clip", "tongue in the groove + tab on the deck with an M3 insert and an M3 × 8 thumb screw; 10 × 10 mm boss with an M3 insert for the accessory"),
 ("Hole row", "Ø4.9 at z 42, 8 mm pitch, front-section sides only (10 holes); 6 mm wall so Technic pins grip"),
 ("Front dock", "2 × M3 inserts 54 mm apart at (±27, 53), z 52; carries the sonar bracket and the arm module"),
 ("Deck", "z 49.5–52, solid except: board window, USB relief, cable slots, encoder plug slots, rear cable ports, caster vents, wheel wells"),
 ("Ballast clips", "on the rear wall at x ±44, 3 × M8 nuts each; fit them whenever the arm is on"),
 ("Grid", "everything on an 8 mm (LEGO Technic) pitch")])}
<div class="note" style="margin-top:3mm">Print the Rail_coupon first (40 mm of deck, wall and groove, about 20 min). If the clip is tight or loose, change CLIP_GAP (0.25 mm) in fusion/rc_params.py and re-export the clip.</div></div>"""
    doc.page("Robot", "Expansion bus", "rev 5", body, "mech/robot/EXPANSION_BUS.md · renders/rev5/bus_spec.png (fusion/bus_drawing.py)")

    # ---------------------------------------------------------------- V1
    v1map = [("IO0", "VBAT_SENSE (÷2)"), ("IO1 / IO2", "PWM_A / DIR_A"), ("IO3 / IO4", "PWM_B / DIR_B"), ("IO5", "nFAULT (both drivers)"),
             ("IO6", "nSLEEP (both drivers)"), ("IO7 / IO10 / IO18 / IO19", "SPI to the W25Q32 flash"), ("IO8 / IO9", "I2C SDA / SCL (MPU-6050); IO9 = BOOT"),
             ("TXD / RXD", "UART to the CP2102N")]
    body = f"""
<div class="col" style="flex:1.3">{img(R/'v1_persp.png', '<b>RoboCore V1</b> — ESP32-C3, two DRV8245 motor drivers, MPU-6050 IMU, reworked 2026-10-01 (DRC 0 errors)')}
<div style="height:52mm;display:flex;gap:4mm">{img(R/'v1_top.png', 'top')}{img(R/'v1_bottom.png', 'bottom — boost converter and a few small parts')}</div></div>
<div class="col" style="flex:1"><h2>At a glance</h2>{table(["Item", "Value"], [
 ("Board", "68 × 60 mm, 2 layers, same outline and holes as V2"),
 ("MCU", "ESP32-C3-WROOM-02 with a CP2102N USB-UART (auto-reset upload)"),
 ("Motors", "2 × TI DRV8245 (one per motor), 6.06 V rail from a TPS61089 boost"),
 ("IMU", "MPU-6050 (obsolete part — replaced by the LSM6DSOX in V2)"),
 ("Power", "1S Li-ion on XT30, MCP73871 USB-C charger (1 A), TLV1117LV33 3.3 V LDO, J5 chassis switch"),
 ("Extras", "W25Q32 SPI flash, battery sense on IO0, artwork on the front")])}
<h2 style="margin-top:3mm">ESP32-C3 pin map</h2>{table(["GPIO", "Function"], v1map, (0,))}
<h2 style="margin-top:3mm">What V2 changed</h2>{facts(["ESP32-S3 with native USB (no UART bridge), XRP-compatible pinout and 4 servo headers",
 "One DRV8411A for both motors, current-limited to 1 A; encoder inputs on the motor sockets",
 "TPS63001 buck-boost for 3.3 V (works down to a flat cell), 5.5 V servo rail, battery reverse / over-voltage cut-off",
 "4 layers, all parts on top, back reserved for artwork"])}</div>"""
    doc.page("V1 controller", "RoboCore V1", "first board, ESP32-C3", body, "RoboCore/RoboCore.kicad_pcb · review/RoboCore_V1_summary_2026-10-01.md")
    sheet_pages("V1 schematics", "RoboCore V1 schematic", "sch_v1", [
        ("RoboCore.svg", "Root sheet", "power, charger, USB, flash, IMU"),
        ("RoboCore-ESP32_BOARD_CONNECTION.svg", "ESP32 board connection", "ESP32-C3 module, CP2102N, auto-reset"),
        ("RoboCore-ESP32_BOARD_CONNECTION-MotorDriver.svg", "Motor driver", "2 × DRV8245"),
        ("RoboCore-ESP32_BOARD_CONNECTION-Buttons.svg", "Buttons", "RESET and BOOT")],
        "RoboCore/RoboCore.kicad_sch")

    html = doc.html()
    (out / "posters.html").write_text(html)
    print(f"  {len(doc.pages)} pages written to posters.html")
    return len(doc.pages)

# ----------------------------------------------------------------------------- PDF + previews
def to_pdf(out: Path):
    html = out / "posters.html"; pdf = out / "RoboCore_posters_A4.pdf"
    if pdf.exists(): pdf.unlink()
    import time
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", f"--user-data-dir={tmp}",
               "--allow-file-access-from-files", "--no-pdf-header-footer", "--virtual-time-budget=60000", "--run-all-compositor-stages-before-draw",
               f"--print-to-pdf={pdf}", f"file://{html}"]
        # Chrome writes the PDF in about a minute but (headless=new) sometimes never exits: wait for the file, then stop it.
        p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        t0 = time.time(); size = -1
        while time.time() - t0 < 900:
            time.sleep(5)
            if p.poll() is not None and pdf.exists(): break
            if pdf.exists():
                s = pdf.stat().st_size
                if s == size and s > 0: break
                size = s
        if p.poll() is None:
            p.terminate(); time.sleep(2)
            if p.poll() is None: p.kill()
    if not pdf.exists():
        print("PDF failed (no file written)"); sys.exit(1)
    print(f"  PDF: {pdf} ({pdf.stat().st_size/1e6:.1f} MB)")
    import fitz
    d = fitz.open(pdf); prev = out / "preview"; prev.mkdir(exist_ok=True)
    for f in prev.glob("page_*.png"): f.unlink()
    for i, p in enumerate(d, 1):
        p.get_pixmap(dpi=100).save(prev / f"page_{i:02d}.png")
    print(f"  {len(d)} preview PNGs in {prev}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=None, help="folder with renders/, layers/, sch_*/ (default docs/posters/src)")
    ap.add_argument("--out", type=Path, default=V2 / "docs/posters")
    ap.add_argument("--no-export", action="store_true", help="do not run kicad-cli; use the existing sources")
    ap.add_argument("--no-pdf", action="store_true")
    a = ap.parse_args()
    out = a.out; out.mkdir(parents=True, exist_ok=True)
    src = a.src or (out / "src")
    if not a.no_export and a.src is None:
        print("exporting sources with kicad-cli ..."); export_sources(src)
    print("building pages ..."); build(src, out)
    if not a.no_pdf:
        print("printing ..."); to_pdf(out)
