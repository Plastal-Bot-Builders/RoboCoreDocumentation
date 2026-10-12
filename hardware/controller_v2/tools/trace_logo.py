"""Turn a logo SVG into silkscreen polygons (run with the system python3: needs pymupdf, opencv, numpy).

  python3 tools/trace_logo.py              # every logo in LOGOS -> lib/art/<name>.json + <name>_preview.png

Silkscreen is one colour, so every coloured fill becomes ink and white fills stay holes. The logo is rendered at
0.005 mm per pixel at its final size, traced with OpenCV (outlines + holes) and simplified to 0.0075 mm.
open_gaps widens slits narrower than MIN_FEATURE (they would fill with ink); it is only safe on bold artwork - on a
fine line drawing it chops the lines up. The report gives the thin end (10th percentile) of stroke and gap widths.
The preview shows the original on top and the silkscreen version below (blue = gaps still under MIN_FEATURE).
"""
import json, os, re
import cv2
import numpy as np
import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
OUT = os.path.join(PROJ, "lib", "art")
PX = 0.005            # mm per pixel while tracing
EPS = 1.5             # simplification, pixels
MIN_FEATURE = 0.15    # mm, smallest silk stroke / gap PCBWay prints reliably

# name: (svg, ink width in mm, {colour: replacement}, open_gaps, grow mm per side)
# grow fattens every stroke a little; the Plastal-Bot robot is a line drawing whose lines are 0.17 mm at 24 mm wide.
LOGOS = {
    "robocore": ("technicalreference/RoboCore.svg", 24.0, {"#78A3AD": "black", "#64878E": "black"}, True, 0),
    "plastalbot": ("technicalreference/Plastal-Bot Logo.svg", 24.0, {}, False, 0),    # sensor boards (2026-10-07): smaller copies of the logos, and icons from technicalreference/
    "robocore_12": ("technicalreference/RoboCore.svg", 12.0, {"#78A3AD": "black", "#64878E": "black"}, True, 0),
    "plastalbot_22": ("technicalreference/Plastal-Bot Logo.svg", 22.0, {}, False, 0.004),
    "icon_sound": ("technicalreference/ix_sound-loud-filled.svg", 3.4, {}, True, 0),
    "icon_golem": ("technicalreference/game-icons_robot-golem.svg", 3.6, {}, True, 0.01),
}


def render(svg_text, zoom):
    doc = pymupdf.open(stream=svg_text.encode(), filetype="svg")
    pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False, colorspace=pymupdf.csGRAY)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width)


def narrow_gaps(ink, min_px=1000):
    """Background narrower than MIN_FEATURE (what a closing with that disc fills), minus the nibs at sharp corners."""
    d = int(round(MIN_FEATURE / PX)) | 1
    gaps = cv2.subtract(cv2.morphologyEx(ink, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (d, d))), ink)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(gaps)
    keep = np.zeros(n, np.uint8)
    keep[1:] = (stats[1:, cv2.CC_STAT_AREA] >= min_px) * 255
    return keep[lab]


def open_gaps(ink, grow=0.035):
    g = int(round(grow / PX)) * 2 + 1
    return cv2.bitwise_and(ink, cv2.bitwise_not(cv2.dilate(narrow_gaps(ink), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (g, g)))))


def widths(mask):
    """Stroke widths along the ridge of the distance transform, mm."""
    dt = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    ridge = (dt >= cv2.dilate(dt, np.ones((3, 3), np.uint8)) - 1e-6) & (dt > 2)
    return 2 * dt[ridge] * PX


def trace(name, svg, width, recolour, widen, grow):
    text = open(os.path.join(PROJ, svg)).read()
    for a, b in recolour.items():
        text = re.sub(re.escape(a), b, text, flags=re.I)
    probe = render(text, 1.0) < 128                      # ink extent at 1 px per SVG unit
    ys, xs = np.nonzero(probe)
    zoom = width / PX / (xs.max() - xs.min() + 1)
    img = render(text, zoom)
    ink = np.where(img < 128, 255, 0).astype(np.uint8)
    ys, xs = np.nonzero(ink)
    ink = np.ascontiguousarray(ink[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    raw = ink.copy()
    if grow:
        g = int(round(grow / PX)) * 2 + 1
        ink = cv2.dilate(np.pad(ink, g), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (g, g)))
        raw = np.pad(raw, g)
    if widen:
        ink = open_gaps(open_gaps(ink))
    contours, hier = cv2.findContours(ink, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    polys = {}
    for i, c in enumerate(contours):
        c = cv2.approxPolyDP(c, EPS, True)
        if len(c) < 3:
            continue
        pts = [[round(float(p[0][0]) * PX, 4), round(float(p[0][1]) * PX, 4)] for p in c]
        parent = hier[0][i][3]
        if parent < 0:
            polys.setdefault(i, {"outline": None, "holes": []})["outline"] = pts
        else:
            polys.setdefault(parent, {"outline": None, "holes": []})["holes"].append(pts)
    polys = [p for p in polys.values() if p["outline"]]
    h, w = ink.shape
    data = {"name": name, "source": svg, "width": round(w * PX, 3), "height": round(h * PX, 3), "polys": polys}
    os.makedirs(OUT, exist_ok=True)
    json.dump(data, open(os.path.join(OUT, f"{name}.json"), "w"))
    prev = cv2.cvtColor(255 - ink, cv2.COLOR_GRAY2BGR)
    prev[narrow_gaps(ink) > 0] = (255, 128, 0)
    cv2.imwrite(os.path.join(OUT, f"{name}_preview.png"),
                cv2.resize(np.vstack([cv2.cvtColor(255 - raw, cv2.COLOR_GRAY2BGR), prev]), (w // 2, h), interpolation=cv2.INTER_AREA))
    # gaps measured inside the logo's own outline only (not the margin around it)
    filled = np.zeros_like(ink)
    cv2.drawContours(filled, [p for p, hh in zip(contours, hier[0]) if hh[3] < 0], -1, 255, -1)
    sw, gw = widths(ink), widths(cv2.subtract(filled, ink))
    p10 = lambda a: f"{np.percentile(a, 10):.3f} mm" if len(a) else "n/a"
    print(f"{name}: {data['width']} x {data['height']} mm, {len(polys)} polygons, "
          f"{sum(len(p['outline']) + sum(map(len, p['holes'])) for p in polys)} points; "
          f"strokes >= {p10(sw)}, gaps >= {p10(gw)} (10th percentile)")
    return data


if __name__ == "__main__":
    for name, (svg, width, recolour, widen, grow) in LOGOS.items():
        trace(name, svg, width, recolour, widen, grow)
