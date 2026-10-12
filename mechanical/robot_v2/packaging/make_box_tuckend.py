#!/usr/bin/env python3
"""RoboCore V2 retail packaging: a reverse tuck-end carton for the assembled robot plus an insert tray.

Everything comes from a few numbers at the top (box inner size, card thickness). Outputs in out/:
  box_net.pdf / .svg / .png     the printed carton dieline with artwork, 1:1 on a 780 x 490 mm page (SVG imports into Figma)
  box_net_A3_tiles.pdf          the same on four A3 landscape sheets, 10 mm overlap
  box_net.dxf, insert.dxf       dielines, mm, layers CUT and FOLD
  insert.pdf                    the insert tray outline with its pockets, 1:1 on A4 landscape
  box_closed.glb / box_open.glb / insert.glb (+ .obj)  textured 3D for Blender; blender_render.py renders them
    python3 make_box.py
"""
import os, json, math
import numpy as np
import pymupdf as fitz
import ezdxf
import trimesh
from shapely.geometry import Polygon, Point, box as sbox
from shapely.ops import unary_union
from PIL import Image
import artkit as A
from artkit import Sheet, NAVY, YEL, CREAM, KRAFT, WHITE

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out_tuckend")
os.makedirs(OUT, exist_ok=True)
ART = A.ART

# ----------------------------------------------------------------------------- the box
L, W, H = 260.0, 110.0, 200.0      # inner: width across the front, depth, height (the box stands on its tuck bottom)
T = 1.5                            # E-flute card
G = 15.0                           # glue flap
Ws, Ls, Hs = W + T, L + T, H + T
LID = Ws                           # lid depth
TONGUE = 22.0
DUST = round(0.75 * Ws, 1)         # dust flap height
X = {'glue': (0, G), 'sideA': (G, G + Ws), 'front': (G + Ws, G + Ws + Ls), 'sideB': (G + Ws + Ls, G + 2 * Ws + Ls), 'back': (G + 2 * Ws + Ls, G + 2 * Ws + 2 * Ls)}
TOP = LID + TONGUE + 1             # height of the closure zone above the body
YB0, YB1 = TOP, TOP + Hs           # body top / bottom (sheet Y grows downward)
SHEET_W, SHEET_H = X['back'][1], YB1 + TOP
THUMB = 9.0                        # thumb notch radius on the front panel's top edge


def trap(x0, x1, y_base, y_tip, inset=8.0):
    """Trapezoid flap from the fold line (y_base, full width) to the tip (narrower)."""
    return [(x0, y_base), (x1, y_base), (x1 - inset, y_tip), (x0 + inset, y_tip)]


def tongue(x0, x1, y_base, y_tip, shoulder=8.0, taper=6.0):
    return [(x0 + shoulder, y_base), (x1 - shoulder, y_base), (x1 - shoulder - taper, y_tip), (x0 + shoulder + taper, y_tip)]


def panels():
    P = {}
    for k in ('sideA', 'front', 'sideB', 'back'):
        x0, x1 = X[k]
        P[k] = [(x0, YB0), (x1, YB0), (x1, YB1), (x0, YB1)]
    g0, g1 = X['glue']
    P['glue'] = [(g1, YB0), (g1, YB1), (g0, YB1 - 4), (g0, YB0 + 4)]
    bx0, bx1 = X['back']
    P['lid'] = [(bx0, YB0 - LID), (bx1, YB0 - LID), (bx1, YB0), (bx0, YB0)]
    P['lid tongue'] = tongue(bx0, bx1, YB0 - LID, YB0 - LID - TONGUE)
    fx0, fx1 = X['front']
    P['bottom'] = [(fx0, YB1), (fx1, YB1), (fx1, YB1 + LID), (fx0, YB1 + LID)]
    P['bottom tongue'] = tongue(fx0, fx1, YB1 + LID, YB1 + LID + TONGUE)
    for k, nm in (('sideA', 'A'), ('sideB', 'B')):
        x0, x1 = X[k]
        P['dust top ' + nm] = trap(x0, x1, YB0, YB0 - DUST)
        P['dust bottom ' + nm] = trap(x0, x1, YB1, YB1 + DUST)
    return P


def creases():
    c = []
    for k in ('sideA', 'front', 'sideB', 'back'):
        x0, x1 = X[k]
        c.append([(x0, YB0), (x0, YB1)])                         # vertical folds (left edge of each panel)
    c.append([(X['back'][1], YB0), (X['back'][1], YB1)]) if False else None
    for k in ('sideA', 'sideB', 'back'):
        x0, x1 = X[k]
        c.append([(x0, YB0), (x1, YB0)])                         # top folds
    for k in ('sideA', 'front', 'sideB'):
        x0, x1 = X[k]
        c.append([(x0, YB1), (x1, YB1)])                         # bottom folds
    bx0, bx1 = X['back']
    c.append([(bx0 + 8, YB0 - LID), (bx1 - 8, YB0 - LID)])       # lid / tongue
    fx0, fx1 = X['front']
    c.append([(fx0 + 8, YB1 + LID), (fx1 - 8, YB1 + LID)])       # bottom / tongue
    return c


def outline():
    P = panels()
    u = unary_union([Polygon(p) for p in P.values()])
    fx0, fx1 = X['front']
    u = u.difference(Point((fx0 + fx1) / 2, YB0).buffer(THUMB, resolution=16))   # thumb notch
    return u


# ----------------------------------------------------------------------------- the insert tray (258 x 198 face, 40 mm thick)
IW, IH, IT = L - 2, H - 2, 40.0
POCKETS = {   # name: polygon (x across the tray, z up), all in mm from the tray's bottom-left corner
    'robot': [(3, 8), (156.5, 8), (156.5, 58), (177, 58), (177, 131), (140, 131), (140, 183), (40, 183), (40, 131), (3, 131), (3, 58), (23.5, 58), (23.5, 8)][::-1],
    'servos': [(6, 140), (33, 140), (33, 174), (6, 174)],
    'jaws': [(146, 136), (166, 136), (166, 180), (146, 180)],
    'boom': [(192, 6), (242, 6), (242, 106), (192, 106)],
    'arm base': [(185, 110), (249, 110), (249, 150), (185, 150)],
    'accessories': [(185, 154), (249, 154), (249, 196), (185, 196)],
}
POCKETS['robot'] = [(3, 8), (23.5, 8), (23.5, 58), (3, 58), (3, 131), (40, 131), (40, 183), (140, 183), (140, 131), (177, 131), (177, 58), (156.5, 58), (156.5, 8)]
POCKET_LABELS = {'robot': 'ROBOCORE V2 ROBOT', 'servos': '2 SERVOS', 'jaws': 'JAWS', 'boom': 'ARM BOOM', 'arm base': 'ARM BASE', 'accessories': 'CLIPS · SCREWS · CABLE'}


def insert_polygon():
    outer = sbox(0, 0, IW, IH)
    return outer.difference(unary_union([Polygon(p) for p in POCKETS.values()]))


# ----------------------------------------------------------------------------- artwork
IMG = {k: os.path.join(ART, v) for k, v in {
    'logo': 'logo_robocore_navy.png', 'plastal': 'logo_plastal_navy.png', 'robot': 'robot_lineart.png', 'board': 'board_iso.png',
    'side': 'robot_side.png', 'top': 'robot_top.png', 'rear': 'robot_rear.png', 'hcsr04': 'hcsr04_iso.png', 'servo': 'servo_iso.png',
    'line': 'linesensor_iso.png'}.items()}
COPY = {
    'tag': 'Build. Code. Create.',
    'meet': 'A classroom robot designed and built in Zambia. The RoboCore V2 controller puts an ESP32-S3 with Wi-Fi and Bluetooth, '
            'two encoder motor drives, four servo ports, a motion sensor and sockets for line and ultrasonic sensing on one board, '
            'running from a single lithium cell with USB-C charging. The robot arrives assembled; the arm module bolts on in minutes.',
    'inbox': 'RoboCore V2 robot, assembled, with controller, HC-SR04 ultrasonic, 3-channel line sensor and battery holder  ·  '
             'Arm module: base, boom, claw, 2 micro servos, 2 ballast clips  ·  USB-C cable  ·  Screw and nut pack  ·  Quick-start card.  '
             '18650 cells and the M8 ballast nuts are not included.',
    'safety': 'Not a toy. Contains small parts and screws: not for children under 8. Use only 1S lithium cells; charge through USB-C under supervision. Keep metal away from the antenna.',
}
FEATURES = ['ESP32-S3 with Wi-Fi and Bluetooth', 'Two encoder motors, four servo ports, IMU', 'Line and ultrasonic sensing', 'Arm module with gear-linked claw']
SPECS_L = ['Controller  RoboCore V2, ESP32-S3, 68 x 60 mm', 'Power  1S Li-ion, 3 x 18650 in parallel, USB-C charging', 'Drive  2 x TT encoder motors, 56 mm wheels, 2 casters']
SPECS_R = ['Sensing  3-channel line sensor, HC-SR04 ultrasonic, IMU', 'Robot  167 x 166 x 65 mm, about 540 g with the arm', 'Box  %d x %d x %d mm, E-flute card' % (L, H, W)]


def artwork(sh):
    P = panels()
    printed = ('front', 'back', 'sideA', 'sideB', 'lid', 'bottom')
    for k, pts in P.items():
        sh.poly(pts, fill=YEL if k in printed else YEL, name=k)
    topo = os.path.join(OUT, 'topography_box.png')
    if not os.path.exists(topo):
        A.topography(topo, SHEET_W, SHEET_H, [P[k] for k in printed], ppm=4, opacity=0.2, stroke=2.2)
    sh.image(0, 0, SHEET_W, SHEET_H, topo)
    fx0, fx1 = X['front']; bx0, bx1 = X['back']; ax0, ax1 = X['sideA']; sx0, sx1 = X['sideB']
    # ---- front: hero
    sh.image(fx0 + 14, YB0 + 12, fx0 + 110, YB0 + 44, IMG['logo'])
    sh.text(fx0 + 14, YB0 + 80, 'ROBOCORE V2', 24, 'h')
    sh.text(fx0 + 14, YB0 + 92, 'CLASSROOM ROBOT', 8, 'h')
    sh.text(fx0 + 14, YB0 + 104, COPY['tag'], 5.2, 'i')
    sh.image(fx0 + 120, YB0 + 46, fx1 - 10, YB0 + 158, IMG['robot'])
    for i, s in enumerate(FEATURES):
        y = YB0 + 122 + i * 7.2
        sh.rect(fx0 + 14, y - 3.2, fx0 + 17, y - 0.2, fill=NAVY)
        sh.text(fx0 + 20, y, s, 3.6, 'b')
    sh.line(fx0 + 14, YB1 - 24, fx1 - 14, YB1 - 24, NAVY, 0.4)
    sh.text(fx0 + 14, YB1 - 11, 'DESIGNED IN ZAMBIA', 6, 'h')
    sh.text(fx0 + 14, YB1 - 5.5, 'ROBOCORE ZAMBIA  ·  PLASTAL-BOT BUILDERS  ·  LUSAKA', 2.8, 'b')
    sh.image(fx1 - 60, YB1 - 21, fx1 - 14, YB1 - 5, IMG['plastal'])
    A.motif(sh, fx1 - 75, YB1 - 18, 0)
    # ---- back: information
    sh.rrect(bx0 + 12, YB0 + 12, bx1 - 12, YB0 + 82, r=3, fill=CREAM)
    sh.text(bx0 + 18, YB0 + 24, 'MEET ROBOCORE V2', 8, 'h')
    y = sh.para(bx0 + 18, YB0 + 28, 150, COPY['meet'], 2.9, 'r')
    sh.image(bx0 + 174, YB0 + 16, bx1 - 16, YB0 + 78, IMG['board'])
    for i, s in enumerate(FEATURES):
        yy = y + 4 + i * 4.6
        sh.rect(bx0 + 18, yy - 2.6, bx0 + 20.4, yy - 0.2, fill=NAVY)
        sh.text(bx0 + 23, yy, s, 3.0, 'b')
    sh.text(bx0 + 12, YB0 + 96, "WHAT'S IN THE BOX", 6, 'h')
    row = [('robot', 'ROBOT, ASSEMBLED'), ('board', 'ROBOCORE V2'), ('hcsr04', 'ULTRASONIC'), ('line', 'LINE SENSOR'), ('servo', '2 SERVOS + ARM')]
    cw = (Ls - 24) / len(row)
    for i, (k, lab) in enumerate(row):
        x0 = bx0 + 12 + i * cw
        sh.image(x0 + 2, YB0 + 100, x0 + cw - 2, YB0 + 128, IMG[k])
        sh.text(x0 + cw / 2, YB0 + 133, lab, 2.6, 'h', NAVY, 'center')
    sh.para(bx0 + 12, YB0 + 137, Ls - 24, COPY['inbox'], 2.7, 'r')
    sh.rrect(bx0 + 12, YB0 + 154, bx1 - 12, YB0 + 176, r=2.5, fill=CREAM)
    sh.text(bx0 + 17, YB0 + 160.5, 'SPECIFICATIONS', 4, 'h')
    for i, s in enumerate(SPECS_L):
        sh.text(bx0 + 17, YB0 + 165.5 + i * 3.6, s, 2.5, 'r')
    for i, s in enumerate(SPECS_R):
        sh.text(bx0 + 128, YB0 + 165.5 + i * 3.6, s, 2.5, 'r')
    A.qr(sh, bx0 + 24, YB1 - 13, 20, 'https://www.plastalbotbuilders.com', bg=YEL)
    sh.text(bx0 + 24, YB1 - 1, 'DOCS & CODE', 2.2, 'h', NAVY, 'center')
    xe = A.barcode(sh, bx0 + 40, YB1 - 22, 12)
    sh.text((bx0 + 40 + xe) / 2, YB1 - 8, '7 8 0 1 2 6   R C 2 . 0', 2.2, 'r', NAVY, 'center')
    sh.para(bx0 + 78, YB1 - 23, 100, COPY['safety'], 2.2, 'r')
    sh.image(bx1 - 62, YB1 - 23, bx1 - 14, YB1 - 11, IMG['plastal'])
    sh.text(bx1 - 38, YB1 - 6.5, 'DESIGNED IN ZAMBIA', 2.6, 'h', NAVY, 'center')
    sh.text(bx1 - 38, YB1 - 2.5, 'RoboCore Zambia  ·  Lusaka  ·  2026  ·  Rev 2.0', 2.0, 'r', NAVY, 'center')
    # ---- spines: wordmark reads bottom-to-top, a drawing at the top
    for (x0, x1, img) in ((ax0, ax1, 'side'), (sx0, sx1, 'top')):
        sh.image(x0 + 6, YB0 + 8, x1 - 6, YB0 + 70, IMG[img])
        sh.text(x0 + 40, YB1 - 12, 'ROBOCORE V2', 18, 'h', NAVY, 'left', 90)
        sh.text(x0 + 50, YB1 - 12, 'CLASSROOM ROBOT  ·  REV 2.0  ·  DESIGNED IN ZAMBIA', 4, 'b', NAVY, 'left', 90)
        sh.image(x0 + 60, YB0 + 80, x1 - 8, YB0 + 96, IMG['logo'])
        A.motif(sh, x0 + 86, YB1 - 14, 90, s=1.4)
    # ---- lid (folds over the top towards the front): logo reads from the front, so rotated 180 on the sheet
    sh.image(bx0 + 80, YB0 - LID + 20, bx1 - 80, YB0 - 20, IMG['logo'], 180)
    sh.text((bx0 + bx1) / 2, YB0 - 8, 'CLASSROOM ROBOT  ·  BUILD. CODE. CREATE.', 4, 'b', NAVY, 'center', 180)
    # ---- bottom (folds under the front): small print
    sh.text((fx0 + fx1) / 2, YB1 + 52, 'RoboCore Zambia  ·  Plastal-Bot Builders  ·  Lusaka  ·  Made in Zambia  ·  Recyclable E-flute card  ·  Rev 2.0  ·  2026', 3, 'r', NAVY, 'center', 180)
    sh.image(fx0 + 95, YB1 + 60, fx1 - 95, YB1 + 92, IMG['logo'], 180)


def dieline(sh, folds=True, labels=False):
    u = outline()
    sh.poly(list(u.exterior.coords)[:-1], stroke=NAVY, width=0.35)
    for ring in u.interiors:
        sh.poly(list(ring.coords)[:-1], stroke=NAVY, width=0.35)
    if folds:
        for c in creases():
            sh.poly(c, stroke=(150, 150, 150), width=0.25, dash=(2, 1.2), closed=False)
    if labels:
        for k, pts in panels().items():
            cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
            sh.text(cx, cy, k.upper(), 4, 'h', NAVY, 'center', opacity=0.5)


# ----------------------------------------------------------------------------- 2D outputs
def build_2d():
    ox, oy = 10.0, 10.0
    sh = Sheet(SHEET_W + 20, SHEET_H + 30, ox, oy)
    artwork(sh)
    dieline(sh)
    sh.text(0, SHEET_H + 8, 'RoboCore V2 carton, reverse tuck end, inner %d x %d x %d mm, E-flute 1.5 mm. Print 1:1; navy solid = cut, grey dashed = fold. Bar = 100 mm.' % (L, W, H), 4, 'b')
    sh.line(SHEET_W - 100, SHEET_H + 12, SHEET_W, SHEET_H + 12, NAVY, 0.6)
    sh.save(os.path.join(OUT, 'box_net.pdf'), os.path.join(OUT, 'box_net.svg'), os.path.join(OUT, 'box_net.png'), dpi=60)
    # blank dieline (no artwork) for the die maker
    sh2 = Sheet(SHEET_W + 20, SHEET_H + 30, ox, oy)
    dieline(sh2, labels=True)
    sh2.text(0, SHEET_H + 8, 'RoboCore V2 carton dieline, inner %d x %d x %d mm, E-flute 1.5 mm, 1:1.' % (L, W, H), 4, 'b')
    sh2.save(os.path.join(OUT, 'box_dieline.pdf'))
    # A3 tiles 2 x 2 with 10 mm overlap
    tiles = fitz.open()
    cols = [(0, 400), (390, SHEET_W + 20)]
    rows = [(0, 260), (250, SHEET_H + 30)]
    for r, (yf, yt) in enumerate(rows):
        for c, (xf, xt) in enumerate(cols):
            t = Sheet(420, 297, ox - xf + 5, oy - yf + 5, doc=tiles)
            artwork(t); dieline(t)
            pg = t.page
            kk = A.K
            for rect in ((0, (5 + yt - yf) * kk, 420 * kk, 297 * kk), (0, 0, 420 * kk, 5 * kk), ((5 + xt - xf) * kk, 0, 420 * kk, 297 * kk), (0, 0, 5 * kk, 297 * kk)):
                pg.draw_rect(fitz.Rect(*rect), color=None, fill=(1, 1, 1), overlay=True)
            pg.insert_text(fitz.Point(8 * kk, 290 * kk), 'RoboCore V2 carton, tile %d of 4 (row %d, column %d), 1:1. Overlap 10 mm with the neighbouring tiles.' % (r * 2 + c + 1, r + 1, c + 1), fontsize=8, fontname='helv')
    tiles.save(os.path.join(OUT, 'box_net_A3_tiles.pdf'), deflate=True, garbage=3)
    # insert tray, 1:1 on A4 landscape
    si = Sheet(297, 210, 19, 6)
    ip = insert_polygon()
    si.poly(list(ip.exterior.coords)[:-1], fill=KRAFT, stroke=NAVY, width=0.35)
    for ring in ip.interiors:
        si.poly(list(ring.coords)[:-1], fill=WHITE, stroke=NAVY, width=0.35)
    for k, pts in POCKETS.items():
        cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
        si.text(cx, IH - cy, POCKET_LABELS[k], 3 if k == 'robot' else 2.4, 'h', NAVY, 'center', opacity=0.7)
    si.text(0, IH + 7, 'Insert tray %d x %d mm, %d mm thick (two layers of 20 mm foam, or eight of 5 mm corrugated), 1:1. The robot lies in the cross-shaped pocket; the arm module and accessories beside it.' % (IW, IH, IT), 3, 'b')
    si.save(os.path.join(OUT, 'insert.pdf'), None, os.path.join(OUT, 'insert.png'), dpi=60)
    # patch: the insert polygon is drawn in tray coordinates (z up) but the sheet has y down -> redraw flipped
    return


def build_insert_sheet():
    si = Sheet(297, 210, 19, 6)
    ip = insert_polygon()
    flip = lambda pts: [(x, IH - z) for x, z in pts]
    si.poly(flip(list(ip.exterior.coords)[:-1]), fill=KRAFT, stroke=NAVY, width=0.35)
    for ring in ip.interiors:
        si.poly(flip(list(ring.coords)[:-1]), fill=WHITE, stroke=NAVY, width=0.35)
    for k, pts in POCKETS.items():
        cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
        if k == 'robot':
            cz = 95
        si.text(cx, IH - cz, POCKET_LABELS[k], 3.2 if k == 'robot' else 2.2, 'h', NAVY, 'center', opacity=0.75)
    si.text(0, IH + 7, 'Insert tray %d x %d mm, %d mm thick (two layers of 20 mm foam, or eight of 5 mm corrugated), 1:1.' % (IW, IH, IT), 3, 'b')
    si.text(0, IH + 11, 'The robot lies in the cross-shaped pocket (chassis plan + 3 mm); the arm boom, base, servos, jaws, clips and screws beside it.', 2.6, 'r')
    si.save(os.path.join(OUT, 'insert.pdf'), None, os.path.join(OUT, 'insert.png'), dpi=60)


def build_dxf():
    doc = ezdxf.new('R2010', setup=True)
    doc.header['$INSUNITS'] = 4
    doc.layers.add('CUT', color=1)
    doc.layers.add('FOLD', color=5, linetype='DASHED')
    msp = doc.modelspace()
    u = outline()
    msp.add_lwpolyline([(x, -y) for x, y in list(u.exterior.coords)[:-1]], close=True, dxfattribs={'layer': 'CUT'})
    for ring in u.interiors:
        msp.add_lwpolyline([(x, -y) for x, y in list(ring.coords)[:-1]], close=True, dxfattribs={'layer': 'CUT'})
    for c in creases():
        msp.add_lwpolyline([(x, -y) for x, y in c], close=False, dxfattribs={'layer': 'FOLD'})
    doc.saveas(os.path.join(OUT, 'box_net.dxf'))
    d2 = ezdxf.new('R2010', setup=True)
    d2.header['$INSUNITS'] = 4
    d2.layers.add('CUT', color=1)
    ms2 = d2.modelspace()
    ip = insert_polygon()
    ms2.add_lwpolyline(list(ip.exterior.coords)[:-1], close=True, dxfattribs={'layer': 'CUT'})
    for ring in ip.interiors:
        ms2.add_lwpolyline(list(ring.coords)[:-1], close=True, dxfattribs={'layer': 'CUT'})
    d2.saveas(os.path.join(OUT, 'insert.dxf'))


# ----------------------------------------------------------------------------- 3D (box frame: x along L, y depth 0 = front, z up)
def place(name, open_lid=False):
    """Inside-face mapping sheet (X, Y) -> box (x, y, z) and the outward normal of that panel."""
    fx0, fx1 = X['front']; bx0, bx1 = X['back']; ax0, ax1 = X['sideA']; sx0, sx1 = X['sideB']
    Lo, Wo, Ho = L + 2 * T, W + 2 * T, H + 2 * T      # outer
    if name == 'front':
        return (lambda Xs, Ys: (Xs - fx0, T, YB1 - Ys + T)), (0, -1, 0)
    if name == 'back':
        return (lambda Xs, Ys: (Lo - (Xs - bx0), Wo - T, YB1 - Ys + T)), (0, 1, 0)
    if name == 'sideA':
        return (lambda Xs, Ys: (T, ax1 - Xs, YB1 - Ys + T)), (-1, 0, 0)
    if name == 'sideB':
        return (lambda Xs, Ys: (Lo - T, Xs - sx0, YB1 - Ys + T)), (1, 0, 0)
    if name == 'glue':
        return (lambda Xs, Ys: (ax0 - Xs + 0.05, Wo - 2 * T - 0.05, YB1 - Ys + T)), (0, 1, 0)
    if name == 'bottom':
        return (lambda Xs, Ys: (Xs - fx0, Ys - YB1, T)), (0, 0, -1)
    if name == 'bottom tongue':
        return (lambda Xs, Ys: (Xs - fx0, Wo - 2 * T - 0.1, T + (Ys - YB1 - LID))), (0, 1, 0)
    if name.startswith('dust bottom'):
        if name.endswith('A'):
            return (lambda Xs, Ys: (T + (Ys - YB1) + 0.05, ax1 - Xs, 2 * T + 0.05)), (0, 0, -1)
        return (lambda Xs, Ys: (Lo - T - (Ys - YB1) - 0.05, Xs - sx0, 2 * T + 0.05)), (0, 0, -1)
    # top closure: closed = folded over; open = rotated 110 degrees about the back top edge (hinge at y = Wo, z = Ho)
    if name == 'lid':
        f = (lambda Xs, Ys: (Lo - (Xs - bx0), Wo - (YB0 - Ys), Ho - T)); n = (0, 0, 1)
    elif name == 'lid tongue':
        f = (lambda Xs, Ys: (Lo - (Xs - bx0), 2 * T + 0.1, Ho - T - (YB0 - LID - Ys))); n = (0, -1, 0)
    elif name == 'dust top A':
        f = (lambda Xs, Ys: (T + (YB0 - Ys) + 0.05, ax1 - Xs, Ho - 2 * T - 0.05)); n = (0, 0, 1)
    elif name == 'dust top B':
        f = (lambda Xs, Ys: (Lo - T - (YB0 - Ys) - 0.05, Xs - sx0, Ho - 2 * T - 0.05)); n = (0, 0, 1)
    else:
        raise KeyError(name)
    return f, n


def slab(name, open_lid=False, flat=False):
    pts = panels()[name]
    poly = Polygon(pts)
    if name == 'front':
        poly = poly.difference(Point((X['front'][0] + X['front'][1]) / 2, YB0).buffer(THUMB, resolution=16))
    if flat:
        fn, n = (lambda Xs, Ys: (Xs, -Ys, 0.0)), (0, 0, 1)
    else:
        fn, n = place(name, open_lid)
    n = np.array(n, float)
    verts, faces, uvs, mats = [], [], [], []

    def add(p3, uv):
        verts.append(np.array(p3, float)); uvs.append(uv); return len(verts) - 1
    v2, f2 = trimesh.creation.triangulate_polygon(poly, engine='earcut')
    base_o = len(verts)
    for (Xs, Ys) in v2:
        add(np.array(fn(Xs, Ys)) + n * T, (Xs / SHEET_W, 1 - Ys / SHEET_H))
    for tri in f2:
        a, b, c = [verts[base_o + i] for i in tri]
        if np.dot(np.cross(b - a, c - a), n) < 0:
            tri = tri[::-1]
        faces.append([base_o + i for i in tri]); mats.append(0)
    base_i = len(verts)
    for (Xs, Ys) in v2:
        add(fn(Xs, Ys), (0.01, 0.99))
    for tri in f2:
        a, b, c = [verts[base_i + i] for i in tri]
        if np.dot(np.cross(b - a, c - a), -n) < 0:
            tri = tri[::-1]
        faces.append([base_i + i for i in tri]); mats.append(1)
    for ring in [poly.exterior] + list(poly.interiors):
        rp = list(ring.coords)[:-1]
        for i in range(len(rp)):
            (Xa, Ya), (Xb, Yb) = rp[i], rp[(i + 1) % len(rp)]
            pa, pb = np.array(fn(Xa, Ya)), np.array(fn(Xb, Yb))
            i0 = add(pa, (0.01, 0.99)); i1 = add(pb, (0.01, 0.99)); i2 = add(pb + n * T, (0.01, 0.99)); i3 = add(pa + n * T, (0.01, 0.99))
            probe = ((Xa + Xb) / 2 + (Yb - Ya) * 0.01, (Ya + Yb) / 2 - (Xb - Xa) * 0.01)
            out_dir = np.array(fn(*probe)) - (pa + pb) / 2
            if poly.contains(Point(probe)):
                out_dir = -out_dir
            tri1, tri2 = [i0, i1, i2], [i0, i2, i3]
            if np.dot(np.cross(verts[i1] - verts[i0], verts[i2] - verts[i0]), out_dir) < 0:
                tri1, tri2 = tri1[::-1], tri2[::-1]
            faces += [tri1, tri2]; mats += [1, 1]
    m = trimesh.Trimesh(np.array(verts), np.array(faces), process=False)
    m.visual = trimesh.visual.TextureVisuals(uv=np.array(uvs))
    m.metadata['mats'] = np.array(mats); m.metadata['name'] = name
    if open_lid and name in ('lid', 'lid tongue', 'dust top A', 'dust top B'):
        Lo, Wo, Ho = L + 2 * T, W + 2 * T, H + 2 * T
        if name.startswith('dust'):
            # dust flaps stand up: rotate about their own fold line (the side wall top edge)
            axis_pt = np.array([T if name.endswith('A') else Lo - T, 0, Ho - 2 * T])
            ang = math.radians(-80 if name.endswith('A') else 80)
            m.apply_transform(trimesh.transformations.rotation_matrix(ang, (0, 1, 0), axis_pt))
        else:
            ang = math.radians(110)
            if name == 'lid tongue':   # first straighten the tongue (undo its 90-degree tuck) so it continues the lid
                m.apply_transform(trimesh.transformations.rotation_matrix(math.radians(-90), (1, 0, 0), (0, 2 * T, Ho - T)))
                m.apply_transform(trimesh.transformations.translation_matrix((0, -2 * T + T, 0)))
            m.apply_transform(trimesh.transformations.rotation_matrix(ang, (1, 0, 0), (0, Wo, Ho)))
    return m


def insert_mesh():
    ip = insert_polygon()
    polys = list(ip.geoms) if ip.geom_type == 'MultiPolygon' else [ip]
    parts = []
    for pg in polys:
        m = trimesh.creation.extrude_polygon(pg, IT)       # in (x, z) plane extruded along +"y"
        # extrude gives vertices (x, z, depth): map to box frame: x -> x + T + 1, depth -> y (T .. T+IT), z -> z + T + 1
        v = m.vertices.copy()
        m.vertices = np.column_stack([v[:, 0] + T + 1, v[:, 2] + T, v[:, 1] + T + 1])
        m.fix_normals()
        parts.append(m)
    m = trimesh.util.concatenate(parts)
    m.visual = trimesh.visual.ColorVisuals(m, face_colors=[*KRAFT, 255])
    m.metadata['name'] = 'insert'; m.metadata['mats'] = np.full(len(m.faces), 2)
    return m


def write_obj(meshes, path, texpath):
    mtl = os.path.splitext(path)[0] + '.mtl'
    with open(mtl, 'w') as f:
        f.write('newmtl print\nKd 1 1 1\nKs 0.05 0.05 0.05\nNs 10\nmap_Kd %s\n\nnewmtl card\nKd 0.80 0.70 0.52\nKs 0.02 0.02 0.02\nNs 5\n\nnewmtl kraft\nKd 0.77 0.67 0.50\nNs 5\n' % os.path.basename(texpath))
    with open(path, 'w') as f:
        f.write('mtllib %s\n' % os.path.basename(mtl))
        off = 1
        for m in meshes:
            f.write('o %s\n' % m.metadata.get('name', 'part').replace(' ', '_'))
            for v in m.vertices:
                f.write('v %.4f %.4f %.4f\n' % tuple(v))
            uv = m.visual.uv if hasattr(m.visual, 'uv') and m.visual.uv is not None else np.zeros((len(m.vertices), 2))
            for t in uv:
                f.write('vt %.5f %.5f\n' % tuple(t))
            cur = None
            for face, mat in zip(m.faces, m.metadata.get('mats', np.full(len(m.faces), 2))):
                nm = ['print', 'card', 'kraft'][int(mat)]
                if nm != cur:
                    f.write('usemtl %s\n' % nm); cur = nm
                f.write('f %d/%d %d/%d %d/%d\n' % (face[0] + off, face[0] + off, face[1] + off, face[1] + off, face[2] + off, face[2] + off))
            off += len(m.vertices)


def write_glb(meshes, path, tex_im):
    scene = trimesh.Scene()
    mats = {0: trimesh.visual.material.PBRMaterial(baseColorTexture=tex_im, metallicFactor=0.0, roughnessFactor=0.8, name='print'),
            1: trimesh.visual.material.PBRMaterial(baseColorFactor=[204, 178, 132, 255], metallicFactor=0.0, roughnessFactor=0.95, name='card'),
            2: trimesh.visual.material.PBRMaterial(baseColorFactor=[196, 170, 128, 255], metallicFactor=0.0, roughnessFactor=0.95, name='kraft')}
    yup = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]], float)
    for m in meshes:
        mm = m.metadata.get('mats', np.full(len(m.faces), 2))
        uv_all = m.visual.uv if hasattr(m.visual, 'uv') and m.visual.uv is not None else np.zeros((len(m.vertices), 2))
        for mi, mat in mats.items():
            sel = np.where(mm == mi)[0]
            if not len(sel):
                continue
            faces = m.faces[sel]; idx = np.unique(faces)
            remap = np.full(len(m.vertices), -1); remap[idx] = np.arange(len(idx))
            sub = trimesh.Trimesh(m.vertices[idx], remap[faces], process=False)
            sub.visual = trimesh.visual.TextureVisuals(uv=uv_all[idx], material=mat)
            sub.apply_transform(yup)
            scene.add_geometry(sub, node_name='%s %s' % (m.metadata.get('name', 'part'), mat.name))
    scene.export(path)


def texture():
    doc = fitz.open(os.path.join(OUT, 'box_net.pdf'))
    pg = doc[0]
    k = A.K
    clip = fitz.Rect(10 * k, 10 * k, (10 + SHEET_W) * k, (10 + SHEET_H) * k)
    pix = pg.get_pixmap(dpi=102, clip=clip)        # 4 px/mm
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    path = os.path.join(OUT, 'box_texture.png')
    im.save(path)
    return path, im


def build_3d():
    texpath, tex_im = texture()
    names = list(panels().keys())
    closed = [slab(n) for n in names]
    opened = [slab(n, open_lid=True) for n in names]
    ins = insert_mesh()
    write_obj(closed, os.path.join(OUT, 'box_closed.obj'), texpath)
    write_glb(closed, os.path.join(OUT, 'box_closed.glb'), tex_im)
    write_obj(opened + [ins], os.path.join(OUT, 'box_open.obj'), texpath)
    write_glb(opened + [ins], os.path.join(OUT, 'box_open.glb'), tex_im)
    write_glb([ins], os.path.join(OUT, 'insert.glb'), tex_im)
    flat = [slab(n, flat=True) for n in names]
    write_obj(flat, os.path.join(OUT, 'box_flat.obj'), texpath)
    allm = trimesh.util.concatenate(closed)
    print('closed box bounds (mm):', np.round(allm.bounds, 1).tolist())


if __name__ == '__main__':
    build_2d()
    build_insert_sheet()
    build_dxf()
    build_3d()
    json.dump({'L': L, 'W': W, 'H': H, 'T': T, 'sheet': [SHEET_W, SHEET_H], 'panels': panels(), 'creases': creases(), 'pockets': POCKETS},
              open(os.path.join(OUT, 'box.json'), 'w'), indent=1)
    print('done ->', OUT)
