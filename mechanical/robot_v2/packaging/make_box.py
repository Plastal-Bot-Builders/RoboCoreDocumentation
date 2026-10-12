#!/usr/bin/env python3
"""RoboCore V2 retail packaging: a roll-end tuck-top mailer (FEFCO 0427 style) for the assembled robot, plus an insert tray.

The box lies flat; the lid is the big face, hinged along the back edge, with a rounded tongue that tucks into the front
wall. The end walls roll over double (locking tabs into the floor), the front wall's end flaps are trapped inside them.
Both faces of the card are printed: an outside page and a mirrored inside page (lid, back wall, floor, front wall and the
inner end walls carry artwork you see when the box is open).

Everything comes from the numbers at the top. Outputs in out/:
  box_outside.pdf / .svg / .png   outside artwork on the dieline, 1:1 (SVG imports into Figma at 1 unit = 1 mm)
  box_inside.pdf / .svg / .png    inside artwork, mirrored so it prints on the back of the same sheet
  box_dieline.pdf                 blank dieline for the die maker
  box_outside_A3_tiles.pdf, box_inside_A3_tiles.pdf   2 x 3 A3 landscape sheets each, 10 mm overlap
  box_net.dxf, insert.dxf         mm, layers CUT and FOLD
  insert.pdf / .png               the insert tray with its pockets, 1:1 on A4 landscape
  box_closed.glb / box_open.glb / insert.glb (+ .obj)   textured 3D for Blender (blender_render.py renders them)
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
from artkit import Sheet, Frame, NAVY, YEL, CREAM, KRAFT, WHITE

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
ART = A.ART

# ----------------------------------------------------------------------------- the box
L, W, H = 270.0, 200.0, 80.0       # floor length (hinge direction), floor depth, wall height. Cavity 259 x 200 x 80 (double end walls)
T = 1.5                            # E-flute card
TONGUE = 25.0                      # lid tongue
TAB = 10.0                         # locking tabs on the inner end walls
EO = H + T                         # outer end wall (net width)
ER = 3 * T + 1                     # roll strip over the top of the double end wall (outer wall, front flap, inner wall)
EI = H - T - 1                     # inner end wall
EW = EO + ER + EI + TAB            # end-wall assembly width on the net
DF = H - 4                         # lid dust flaps
FF = H - 2                         # front wall end flaps
XC0, XC1 = EW, EW + L              # the central column
Y_TNG0, Y_TNG1 = 0.0, TONGUE
Y_LID0, Y_LID1 = Y_TNG1, Y_TNG1 + W + 2 * T
Y_BK0, Y_BK1 = Y_LID1, Y_LID1 + H + T
Y_FL0, Y_FL1 = Y_BK1, Y_BK1 + W
Y_FR0, Y_FR1 = Y_FL1, Y_FL1 + H + T
SHEET_W, SHEET_H = 2 * EW + L, Y_FR1
Lo, Wo, Ho = L + 2 * T, W + 2 * T, H + 2 * T          # outer size
NOTCH = 9.0                        # finger notch on the front wall's top edge
TAB_Y = (0.28, 0.72)               # tab positions along the depth (fraction of W)
TAB_W = 26.0


def mirror_x(pts, about):
    return [(2 * about - x, y) for x, y in pts]


def panels():
    """Sheet polygons of every panel (printed-outside view). 'left'/'right' = on the sheet; the sheet's right end wall is the box's LEFT end."""
    P = {}
    P['tongue'] = rounded_top(XC0 + 6, XC1 - 6, Y_TNG0, Y_TNG1, r=12)
    P['lid'] = [(XC0 - T, Y_LID0), (XC1 + T, Y_LID0), (XC1 + T, Y_LID1), (XC0 - T, Y_LID1)]
    P['back'] = [(XC0, Y_BK0), (XC1, Y_BK0), (XC1, Y_BK1), (XC0, Y_BK1)]
    P['floor'] = [(XC0, Y_FL0), (XC1, Y_FL0), (XC1, Y_FL1), (XC0, Y_FL1)]
    P['front'] = [(XC0, Y_FR0), (XC1, Y_FR0), (XC1, Y_FR1), (XC0, Y_FR1)]
    xm = (XC0 + XC1) / 2
    left = {}
    left['dust'] = [(XC0 - T, Y_LID0 + 8), (XC0 - T - DF, Y_LID0 + 16), (XC0 - T - DF, Y_LID1 - 10), (XC0 - T, Y_LID1 - 2)]
    left['flap'] = [(XC0, Y_FR0 + 2 * T + 1), (XC0 - FF, Y_FR0 + 2 * T + 8), (XC0 - FF, Y_FR1 - 8), (XC0, Y_FR1 - 1)]
    left['outer'] = [(XC0 - EO, Y_FL0), (XC0, Y_FL0), (XC0, Y_FL1), (XC0 - EO, Y_FL1)]
    y0, y1 = Y_FL0 + 2 * T + 1, Y_FL1 - 2 * T - 1
    left['strip'] = [(XC0 - EO - ER, y0), (XC0 - EO, y0), (XC0 - EO, y1), (XC0 - EO - ER, y1)]
    xi = XC0 - EO - ER
    left['inner'] = [(xi, y0), (xi - EI + 6, y0), (xi - EI, y0 + 6), (xi - EI, y1 - 6), (xi - EI + 6, y1), (xi, y1)]
    for i, f in enumerate(TAB_Y):
        yc = Y_FL1 - f * W
        left['tab%d' % i] = [(xi - EI, yc - TAB_W / 2), (xi - EI - TAB, yc - TAB_W / 2 + 2), (xi - EI - TAB, yc + TAB_W / 2 - 2), (xi - EI, yc + TAB_W / 2)]
    for k, v in left.items():
        P['L ' + k] = v                                   # sheet-left assembly = box RIGHT end
        P['R ' + k] = mirror_x(v, xm)[::-1]               # sheet-right assembly = box LEFT end
    return P


def rounded_top(x0, x1, y0, y1, r=12.0, n=8):
    pts = [(x0, y1), (x1, y1)]
    for cx, cy, a0 in ((x1 - r, y0 + r, 0), (x0 + r, y0 + r, -90)):
        for i in range(n + 1):
            a = math.radians(a0 - 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def creases():
    c = []
    c.append([(XC0 + 10, Y_TNG1), (XC1 - 10, Y_TNG1)])
    for y in (Y_LID1, Y_BK1, Y_FL1):
        c.append([(XC0, y), (XC1, y)])
    for x in (XC0, XC1):
        c.append([(x, Y_FL0), (x, Y_FL1)])                 # floor / outer end walls
        c.append([(x, Y_FR0 + 2 * T + 1), (x, Y_FR1 - 1)]) # front wall / end flaps
    for xe in (XC0 - T, XC1 + T):
        c.append([(xe, Y_LID0 + 8), (xe, Y_LID1 - 2)])     # lid / dust flaps
    y0, y1 = Y_FL0 + 2 * T + 1, Y_FL1 - 2 * T - 1
    for sgn, x0 in ((-1, XC0), (1, XC1)):
        c.append([(x0 + sgn * EO, y0), (x0 + sgn * EO, y1)])                 # outer wall / strip
        c.append([(x0 + sgn * (EO + ER), y0), (x0 + sgn * (EO + ER), y1)])   # strip / inner wall
        for f in TAB_Y:
            yc = Y_FL1 - f * W
            c.append([(x0 + sgn * (EO + ER + EI), yc - TAB_W / 2), (x0 + sgn * (EO + ER + EI), yc + TAB_W / 2)])
    return c


def slots():
    """Locking-tab slots in the floor (sheet rects). Box x of the inner wall card: ER-T .. ER from each outer face."""
    out = []
    for f in TAB_Y:
        ys = Y_FL1 - f * W
        for bx0 in (ER - T - 0.4,):
            w = T + 0.8
            # box left end  -> sheet right side of the floor; box right end -> sheet left side
            xs_left_end = XC1 + T - (bx0 + w)
            xs_right_end = XC0 - T + bx0
            out.append((xs_left_end, ys - TAB_W / 2 - 0.75, xs_left_end + w, ys + TAB_W / 2 + 0.75))
            out.append((xs_right_end, ys - TAB_W / 2 - 0.75, xs_right_end + w, ys + TAB_W / 2 + 0.75))
    return out


def outline():
    P = panels()
    u = unary_union([Polygon(p).buffer(0.01) for p in P.values()]).buffer(-0.01)
    u = u.difference(Point((XC0 + XC1) / 2, Y_FR1).buffer(NOTCH, resolution=16))
    for x0, y0, x1, y1 in slots():
        u = u.difference(sbox(x0, y0, x1, y1))
    return u


# ----------------------------------------------------------------------------- the insert tray (lies on the floor, 40 mm thick)
IW, IH, IT = 258.0, 198.0, 40.0    # x across the box, y front-to-back
POCKETS = {   # name: polygon (x across, y from the front), mm from the tray's front-left corner
    'robot': [(3, 8), (23.5, 8), (23.5, 58), (3, 58), (3, 131), (40, 131), (40, 183), (140, 183), (140, 131), (177, 131), (177, 58), (156.5, 58), (156.5, 8)],
    'servos': [(6, 140), (33, 140), (33, 174), (6, 174)],
    'jaws': [(146, 136), (166, 136), (166, 180), (146, 180)],
    'boom': [(192, 6), (242, 6), (242, 106), (192, 106)],
    'arm base': [(185, 110), (249, 110), (249, 150), (185, 150)],
    'accessories': [(185, 154), (249, 154), (249, 196), (185, 196)],
}
POCKET_LABELS = {'robot': 'ROBOCORE V2 ROBOT', 'servos': '2 SERVOS', 'jaws': 'JAWS', 'boom': 'ARM BOOM', 'arm base': 'ARM BASE', 'accessories': 'CLIPS · SCREWS · CABLE'}


def insert_polygon():
    return sbox(0, 0, IW, IH).difference(unary_union([Polygon(p) for p in POCKETS.values()]))


# ----------------------------------------------------------------------------- artwork
IMG = {k: os.path.join(ART, v) for k, v in {
    'logo': 'logo_robocore_navy.png', 'plastal': 'logo_plastal_navy.png', 'robot': 'robot_lineart.png', 'board': 'board_iso.png',
    'board_top': 'board_top.png', 'side': 'robot_side.png', 'side_f': 'robot_side_flipped.png', 'top': 'robot_top.png', 'rear': 'robot_rear.png',
    'hcsr04': 'hcsr04_iso.png', 'hcsr04_f': 'hcsr04_front.png', 'servo': 'servo_iso.png', 'servo_s': 'servo_side.png', 'line': 'linesensor_iso.png',
    'chassis': 'chassis_iso.png', 'cable6': 'cable_6pin.png', 'battery': 'battery_holder.png', 'motor': 'motor_dg01d.png', 'wheel': 'wheel.png'}.items()}
SITE = 'https://www.plastalbotbuilders.com'
COPY = {
    'tag': 'Build. Code. Create.',
    'meet': 'A classroom robot designed and built in Zambia. The RoboCore V2 controller puts an ESP32-S3 with Wi-Fi and Bluetooth, '
            'two encoder motor drives, four servo ports, a motion sensor and sockets for line and ultrasonic sensing on one board, '
            'running from a single lithium cell with USB-C charging. The robot arrives assembled; the arm module bolts on in minutes.',
    'inbox': 'RoboCore V2 robot, assembled, with controller, HC-SR04 ultrasonic, 3-channel line sensor and battery holder  ·  '
             'Arm module: base, boom, claw, 2 micro servos, 2 ballast clips  ·  USB-C cable  ·  Screw and nut pack  ·  Quick-start card.  '
             '18650 cells and the M8 ballast nuts are not included.',
    'safety': 'Not a toy. Contains small parts and screws: not for children under 8. Use only 1S lithium cells; charge through USB-C under supervision. Keep metal away from the antenna.',
    'start': ['Assembly and first-run guide', 'Step-by-step classroom lessons', 'Programming environments: blocks, Python, C++',
              'Firmware, example code and libraries', '3D-print files for the chassis and the arm', 'Support forum and teacher resources'],
    'pbb': 'Plastal-Bot Builders is a Lusaka makerspace that teaches robotics, coding and fabrication to learners and teachers across Zambia. '
           'RoboCore is our own controller family, designed so a class can build, program and repair its robots locally.',
    'community': 'Share what your class builds, find lesson plans and compare notes with other schools. Replacement parts, '
                 'add-on sensors and the arm module are available from us; the design files are published so you can also print and fix parts yourself.',
}
FEATURES = ['ESP32-S3 with Wi-Fi and Bluetooth', 'Two encoder motors, four servo ports, IMU', 'Line and ultrasonic sensing', 'Arm module with gear-linked claw']
SPECS_L = ['Controller  RoboCore V2, ESP32-S3, 68 x 60 mm', 'Power  1S Li-ion, 3 x 18650 in parallel, USB-C charging', 'Drive  2 x TT encoder motors, 56 mm wheels, 2 casters']
SPECS_R = ['Sensing  3-channel line sensor, HC-SR04 ultrasonic, IMU', 'Robot  167 x 166 x 65 mm, about 540 g with the arm', 'Box  %d x %d x %d mm, E-flute card' % (Lo, Wo, Ho)]
KIT = [  # (label, drawing or icon name, count text): 4 x 4 grid on the floor inside
    ('RoboCore V2 robot, assembled', 'robot', ''), ('RoboCore V2 controller', 'board_top', 'on the robot'), ('3D-printed chassis', 'chassis', 'on the robot'),
    ('Encoder motors DG01D-E', 'motor', '2, on the robot'), ('Wheels 56 mm, TPU tyres', 'wheel', '2'), ('Battery holder, 3 x 18650', 'battery', 'on the robot'),
    ('Ultrasonic sensor HC-SR04', 'hcsr04_f', 'on the robot'), ('Line sensor, 3 channels', 'line', 'on the robot'), ('Micro servos', 'servo', '2'),
    ('Arm boom', 'icon:boom', ''), ('Arm base', 'icon:base', ''), ('Claw jaws', 'icon:jaws', '2'), ('Ballast clips', 'icon:clips', '2'),
    ('Motor encoder cables', 'cable6', '2'), ('USB-C cable', 'icon:cable', ''), ('Screws, nuts and quick-start card', 'icon:screws', ''),
]


def icon(F, name, u0, v0, u1, v1):
    """Simple navy line icons for the parts without a drawing, in a local box."""
    w, h = u1 - u0, v1 - v0
    cx, cy = (u0 + u1) / 2, (v0 + v1) / 2
    sw = 0.45
    if name == 'boom':
        bw, bh = w * 0.9, h * 0.28
        F.rrect(cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2, r=bh / 2, stroke=NAVY, width=sw)
        for k in (-0.38, -0.13, 0.13, 0.38):
            F.circle(cx + k * bw, cy, bh * 0.4, stroke=NAVY, width=sw)
    elif name == 'base':
        bw, bh = w * 0.6, h * 0.7
        F.poly([(cx - bw / 2, cy + bh / 2), (cx + bw / 2, cy + bh / 2), (cx + bw / 2, cy + bh * 0.1), (cx + bw * 0.15, cy - bh / 2), (cx - bw * 0.15, cy - bh / 2), (cx - bw / 2, cy + bh * 0.1)], stroke=NAVY, width=sw)
        F.circle(cx, cy - bh * 0.1, bh * 0.3, stroke=NAVY, width=sw)
        F.line(cx - bw / 2, cy + bh * 0.3, cx + bw / 2, cy + bh * 0.3, NAVY, sw)
    elif name == 'jaws':
        for s in (-1, 1):
            x = cx + s * w * 0.22
            F.poly([(x, cy - h * 0.4), (x + s * w * 0.18, cy - h * 0.1), (x + s * w * 0.1, cy + h * 0.4), (x - s * w * 0.04, cy + h * 0.4), (x - s * w * 0.02, cy - h * 0.1)], stroke=NAVY, width=sw)
            F.circle(x, cy - h * 0.3, h * 0.12, stroke=NAVY, width=sw)
    elif name == 'clips':
        for s in (-1, 1):
            x = cx + s * w * 0.22
            F.poly([(x + w * 0.1, cy - h * 0.35), (x - w * 0.1, cy - h * 0.35), (x - w * 0.1, cy + h * 0.35), (x + w * 0.1, cy + h * 0.35)], stroke=NAVY, width=sw, closed=False)
            F.circle(x - w * 0.1, cy, h * 0.14, stroke=NAVY, width=sw)
    elif name == 'cable':
        pts = [(cx - w * 0.4 + w * 0.8 * t, cy + h * 0.28 * math.sin(t * math.pi * 2)) for t in np.linspace(0.1, 0.9, 24)]
        F.poly(pts, stroke=NAVY, width=sw, closed=False)
        F.rrect(cx - w * 0.48, cy - h * 0.08, cx - w * 0.36, cy + h * 0.08, r=0.8, stroke=NAVY, width=sw)
        F.rrect(cx + w * 0.36, cy - h * 0.08, cx + w * 0.48, cy + h * 0.08, r=0.8, stroke=NAVY, width=sw)
    elif name == 'screws':
        F.poly([(cx - w * 0.3, cy - h * 0.3), (cx + w * 0.3, cy - h * 0.3), (cx + w * 0.34, cy + h * 0.4), (cx - w * 0.34, cy + h * 0.4)], stroke=NAVY, width=sw)
        F.line(cx - w * 0.3, cy - h * 0.18, cx + w * 0.3, cy - h * 0.18, NAVY, sw)
        for k in (-0.15, 0.0, 0.15):
            F.line(cx + k * w, cy - h * 0.05, cx + k * w, cy + h * 0.28, NAVY, sw)
            F.rect(cx + k * w - w * 0.04, cy - h * 0.1, cx + k * w + w * 0.04, cy - h * 0.05, stroke=NAVY, width=sw)
    elif name == 'card':
        F.rrect(cx - w * 0.32, cy - h * 0.42, cx + w * 0.32, cy + h * 0.42, r=1.2, stroke=NAVY, width=sw)
        for k in (-0.2, -0.05, 0.1, 0.25):
            F.line(cx - w * 0.22, cy + k * h, cx + w * (0.22 if k != 0.25 else 0.0), cy + k * h, NAVY, sw)


def part(F, key, u0, v0, u1, v1):
    if key.startswith('icon:'):
        icon(F, key[5:], u0, v0, u1, v1)
    else:
        F.image(u0, v0, u1, v1, IMG[key])


def hero(F):
    """The lid outside: logo, name, descriptor, drawing, features, origin."""
    w, h = F.w, F.h
    F.image(14, 12, 105, 42, IMG['logo'])
    F.text(14, 74, 'ROBOCORE V2', 24, 'h')
    F.text(14, 86, 'CLASSROOM ROBOT', 8, 'h')
    F.text(14, 97, COPY['tag'], 5.2, 'i')
    F.image(118, 24, w - 12, 150, IMG['robot'])
    for i, s in enumerate(FEATURES):
        v = 115 + i * 7.2
        F.rect(14, v - 3.2, 17, v - 0.2, fill=NAVY)
        F.text(20, v, s, 3.6, 'b')
    F.line(14, h - 26, w - 14, h - 26, NAVY, 0.4)
    F.text(14, h - 13, 'DESIGNED IN ZAMBIA', 6, 'h')
    F.text(14, h - 7.5, 'ROBOCORE ZAMBIA  ·  PLASTAL-BOT BUILDERS  ·  LUSAKA', 2.8, 'b')
    F.image(w - 62, h - 23, w - 14, h - 7, IMG['plastal'])
    F.motif(w - 78, h - 20)


def underside(F):
    """The floor outside: description, what's in the box, specifications, QR, barcode, safety."""
    w, h = F.w, F.h
    F.rrect(10, 10, w - 10, 78, r=3, fill=CREAM)
    F.text(16, 22, 'MEET ROBOCORE V2', 8, 'h')
    v = F.para(16, 26, 158, COPY['meet'], 2.9, 'r')
    F.image(180, 14, w - 14, 74, IMG['board'])
    for i, s in enumerate(FEATURES):
        vv = v + 4 + i * 4.6
        F.rect(16, vv - 2.6, 18.4, vv - 0.2, fill=NAVY)
        F.text(21, vv, s, 3.0, 'b')
    F.text(10, 91, "WHAT'S IN THE BOX", 6, 'h')
    row = [('robot', 'ROBOT, ASSEMBLED'), ('board', 'ROBOCORE V2'), ('motor', '2 ENCODER MOTORS'), ('hcsr04', 'ULTRASONIC'), ('line', 'LINE SENSOR'), ('servo', '2 SERVOS + ARM')]
    cw = (w - 20) / len(row)
    for i, (k, lab) in enumerate(row):
        u0 = 10 + i * cw
        F.image(u0 + 2, 95, u0 + cw - 2, 123, IMG[k])
        F.text(u0 + cw / 2, 128, lab, 2.6, 'h', NAVY, 'center')
    F.para(10, 132, w - 20, COPY['inbox'], 2.7, 'r')
    F.rrect(10, 149, w - 10, 171, r=2.5, fill=CREAM)
    F.text(15, 155.5, 'SPECIFICATIONS', 4, 'h')
    for i, s in enumerate(SPECS_L):
        F.text(15, 160.5 + i * 3.6, s, 2.5, 'r')
    for i, s in enumerate(SPECS_R):
        F.text(132, 160.5 + i * 3.6, s, 2.5, 'r')
    F.qr(22, h - 14, 20, SITE, bg=YEL)
    F.text(22, h - 2, 'DOCS & CODE', 2.2, 'h', NAVY, 'center')
    ue = F.barcode(38, h - 23, 12)
    F.text((38 + ue) / 2, h - 9, '7 8 0 1 2 6   R C 2 . 0', 2.2, 'r', NAVY, 'center')
    F.para(76, h - 24, 104, COPY['safety'], 2.2, 'r')
    F.image(w - 62, h - 24, w - 14, h - 12, IMG['plastal'])
    F.text(w - 38, h - 7.5, 'DESIGNED IN ZAMBIA', 2.6, 'h', NAVY, 'center')
    F.text(w - 38, h - 3.5, 'RoboCore Zambia  ·  Lusaka  ·  2026  ·  Rev 2.0', 2.0, 'r', NAVY, 'center')


def back_outside(F):
    w, h = F.w, F.h
    F.image(10, 8, w * 0.42, h - 8, IMG['side'])
    F.text(w - 12, 36, 'ROBOCORE V2', 22, 'h', NAVY, 'right')
    F.text(w - 12, 46, 'CLASSROOM ROBOT  ·  REV 2.0  ·  DESIGNED IN ZAMBIA', 4.2, 'b', NAVY, 'right')
    F.image(w - 86, h - 28, w - 12, h - 8, IMG['logo'])
    F.motif(w - 104, h - 22, 1.3)


def front_outside(F):
    w, h = F.w, F.h
    F.image(12, 10, 86, 36, IMG['logo'])
    F.text(12, h - 12, 'BUILD  |  CODE  |  CREATE', 11, 'h')
    F.text(12, h - 6, 'A robot a class can build, program and repair', 3.2, 'i')
    F.image(w * 0.46, 8, w - 12, h - 8, IMG['top'])


def end_outside(F, which):
    w, h = F.w, F.h
    F.text(10, 30, 'ROBOCORE V2', 14, 'h')
    F.text(10, 38, 'CLASSROOM ROBOT  ·  REV 2.0', 3.4, 'b')
    if which == 'left':
        F.image(w - 70, 10, w - 10, h - 10, IMG['rear'])
        F.image(10, h - 26, 70, h - 8, IMG['logo'])
    else:
        F.image(w - 66, 12, w - 10, h - 12, IMG['plastal'])
        F.text(10, h - 20, 'DESIGNED IN ZAMBIA', 5, 'h')
        ue = F.barcode(10, h - 16, 8)
        F.text(10, h - 5, 'RC2.0  ·  2026  ·  plastalbotbuilders.com', 2.2, 'r')
    F.motif(w / 2 - 4, h / 2 + 10, 1.2)


def end_inside(F, which):
    """Inner end walls: yellow panels with line art of the parts, seen when the box is open."""
    w, h = F.w, F.h
    if which == 'left':
        F.image(8, 6, 74, h - 6, IMG['hcsr04'])
        F.image(78, 8, 128, h - 8, IMG['servo'])
        F.image(132, 6, w - 8, h - 6, IMG['board'])
    else:
        F.image(6, 10, 78, h - 10, IMG['side_f'])
        F.image(82, 8, 138, h - 8, IMG['motor'])
        F.image(142, 8, w - 6, h - 8, IMG['wheel'])


def lid_inside(F):
    """Get started card with the QR, like the reference box."""
    w, h = F.w, F.h
    F.image(14, 10, 100, 36, IMG['logo'])
    F.image(w - 70, 12, w - 14, 32, IMG['plastal'])
    F.rrect(14, 44, w - 14, h - 14, r=4, fill=YEL)
    F.text(24, 60, 'GET STARTED HERE', 10, 'h')
    F.text(24, 70, SITE.replace('https://', ''), 6, 'h')
    F.text(24, 76.5, 'On this page you will find:', 3.4, 'i')
    for i, s in enumerate(COPY['start']):
        F.text(24, 84 + i * 5.2, '–  ' + s, 3.4, 'b')
    F.qr(w - 50, 76, 48, SITE, bg=CREAM)
    F.text(w - 50, 104, 'SCAN FOR DOCS, CODE AND LESSONS', 2.6, 'h', NAVY, 'center')
    F.image(118, 108, w - 24, h - 24, IMG['robot'])
    F.text(24, h - 34, 'Replacement parts, add-on sensors and the arm module:', 3.0, 'r')
    F.text(24, h - 29, 'plastalbotbuilders.com/robocore', 3.6, 'b')
    F.text(24, h - 20, 'Design files are published. Print it, fix it, improve it, share it.', 3.0, 'i')
    F.text(24, 124, 'BEFORE YOU START', 4.2, 'h')
    for i, t in enumerate(('3 x 18650 lithium cells (not included) and a USB-C charger', 'A computer or tablet with a browser, or the Arduino IDE',
                           'Charge the robot fully before the first lesson', 'Fit the arm module only after the drive base runs')):
        F.text(24, 130 + i * 4.6, '–  ' + t, 3.0, 'r')
    F.motif(24, h - 48, 1.0)


def back_inside(F):
    w, h = F.w, F.h
    cw = (w - 30) / 2
    for i, (title, body, url) in enumerate((('PLASTAL-BOT BUILDERS', COPY['pbb'], SITE), ('JOIN THE ROBOCORE COMMUNITY', COPY['community'], SITE + '/community'))):
        u0 = 10 + i * (cw + 10)
        F.rrect(u0, 8, u0 + cw, h - 8, r=3, fill=YEL)
        F.text(u0 + 6, 18, title, 5, 'h')
        vb = F.para(u0 + 6, 21, cw - 44, body, 2.7, 'r')
        tags = ('WORKSHOPS  ·  TEACHER TRAINING  ·  ROBOTICS CLUBS  ·  FABRICATION', 'LESSON PLANS  ·  FORUM  ·  SPARE PARTS  ·  DESIGN FILES')[i]
        F.line(u0 + 6, h - 22, u0 + cw - 44, h - 22, NAVY, 0.3)
        F.text(u0 + 6, h - 16, tags, 2.6, 'h')
        F.text(u0 + 6, h - 11.5, url.replace('https://', ''), 2.6, 'b')
        F.qr(u0 + cw - 20, h / 2 - 2, 30, url, bg=CREAM)
        F.text(u0 + cw - 20, h - 11, 'SCAN', 2.2, 'h', NAVY, 'center')


def floor_inside(F):
    w, h = F.w, F.h
    F.rrect(14, 12, w - 14, h - 12, r=4, fill=YEL)
    F.text(w / 2, 24, 'THIS KIT INCLUDES', 8, 'h', NAVY, 'center')
    cols, rows = 4, 4
    gw, gh = (w - 40) / cols, (h - 52) / rows
    for i, (lab, key, cnt) in enumerate(KIT):
        c, r = i % cols, i // cols
        u0, v0 = 20 + c * gw, 30 + r * gh
        F.text(u0 + 2, v0 + 4, lab + ('  (%s)' % cnt if cnt else ''), 2.6, 'b')
        F.line(u0 + 2, v0 + 5.0, u0 + 2 + F.sh.width(lab + ('  (%s)' % cnt if cnt else ''), 'b', 2.6), v0 + 5.0, NAVY, 0.25)
        part(F, key, u0 + 4, v0 + 7, u0 + gw - 6, v0 + gh - 3)
    F.text(w / 2, h - 16, 'For replacement parts and the arm module visit plastalbotbuilders.com/robocore', 3.0, 'b', NAVY, 'center')


def front_inside(F):
    w, h = F.w, F.h
    F.text(w / 2, h / 2 - 2, 'ROBOCORE V2  ·  BUILD. CODE. CREATE.', 7, 'h', NAVY, 'center')
    F.text(w / 2, h / 2 + 5, 'Designed and built in Zambia by Plastal-Bot Builders, Lusaka', 3.0, 'i', NAVY, 'center')


def tongue_inside(F):
    F.text(F.w / 2, 16, 'ROBOCORE ZAMBIA', 6, 'h', NAVY, 'center')


# ----------------------------------------------------------------------------- the two pages
def frames_outside(sh):
    """Panel frames on the outside page (sheet = printed outside view)."""
    return {
        'lid': Frame(sh, XC0 - T, Y_LID0, XC1 + T, Y_LID1, 180),
        'floor': Frame(sh, XC0, Y_FL0, XC1, Y_FL1, 0),
        'back': Frame(sh, XC0, Y_BK0, XC1, Y_BK1, 0),
        'front': Frame(sh, XC0, Y_FR0, XC1, Y_FR1, 180),
        'end left': Frame(sh, XC1, Y_FL0, XC1 + EO, Y_FL1, 270),         # box left end = sheet right
        'end right': Frame(sh, XC0 - EO, Y_FL0, XC0, Y_FL1, 90),
        'inner left': Frame(sh, XC1 + EO + ER, Y_FL0 + 2 * T + 1, XC1 + EO + ER + EI, Y_FL1 - 2 * T - 1, 90),
        'inner right': Frame(sh, XC0 - EO - ER - EI, Y_FL0 + 2 * T + 1, XC0 - EO - ER, Y_FL1 - 2 * T - 1, 270),
        'tongue': Frame(sh, XC0 + 6, Y_TNG0, XC1 - 6, Y_TNG1, 180),
    }


def frames_inside(sh):
    """Panel frames on the inside page (sheet x mirrored: x' = SHEET_W - x)."""
    M = lambda x: SHEET_W - x
    return {
        'lid': Frame(sh, M(XC1 + T), Y_LID0, M(XC0 - T), Y_LID1, 0),
        'floor': Frame(sh, M(XC1), Y_FL0, M(XC0), Y_FL1, 0),
        'back': Frame(sh, M(XC1), Y_BK0, M(XC0), Y_BK1, 0),
        'front': Frame(sh, M(XC1), Y_FR0, M(XC0), Y_FR1, 180),
        'tongue': Frame(sh, M(XC1 - 6), Y_TNG0, M(XC0 + 6), Y_TNG1, 0),
    }


def artwork_outside(sh):
    P = panels()
    for k, pts in P.items():
        sh.poly(pts, fill=YEL, name=k)
    for k in ('floor', 'back', 'front', 'lid'):
        pass
    topo = os.path.join(OUT, 'topography_outside.png')
    if not os.path.exists(topo):
        A.topography(topo, SHEET_W, SHEET_H, [P[k] for k in ('lid', 'floor', 'back', 'front', 'L outer', 'R outer', 'tongue')], ppm=4, opacity=0.2, stroke=2.2)
    sh.image(0, 0, SHEET_W, SHEET_H, topo)
    F = frames_outside(sh)
    hero(F['lid']); underside(F['floor']); back_outside(F['back']); front_outside(F['front'])
    end_outside(F['end left'], 'left'); end_outside(F['end right'], 'right')
    end_inside(F['inner left'], 'left'); end_inside(F['inner right'], 'right')
    F['tongue'].motif(F['tongue'].w / 2 - 4.5, 9, 1.0)


def artwork_inside(sh):
    P = panels()
    M = lambda pts: mirror_x(pts, SHEET_W / 2)
    for k, pts in P.items():
        sh.poly(M(pts), fill=CREAM if k in ('lid', 'floor', 'back', 'front', 'tongue') else YEL, name=k)
    topo = os.path.join(OUT, 'topography_inside.png')
    if not os.path.exists(topo):
        A.topography(topo, SHEET_W, SHEET_H, [M(P[k]) for k in ('lid', 'floor', 'back', 'front', 'tongue')], ppm=4, opacity=0.1, stroke=2.2)
    sh.image(0, 0, SHEET_W, SHEET_H, topo)
    F = frames_inside(sh)
    # faint oversized line art behind the cards, like the reference box
    F['floor'].image(2, 2, F['floor'].w - 2, F['floor'].h - 2, A.faint(IMG['top'], OUT, 0.14))
    F['lid'].image(F['lid'].w * 0.45, 40, F['lid'].w - 4, F['lid'].h - 4, A.faint(IMG['robot'], OUT, 0.12))
    lid_inside(F['lid']); back_inside(F['back']); floor_inside(F['floor']); front_inside(F['front']); tongue_inside(F['tongue'])


def dieline(sh, mirrored=False, folds=True, labels=False):
    u = outline()
    M = (lambda pts: mirror_x(pts, SHEET_W / 2)) if mirrored else (lambda pts: pts)
    sh.poly(M(list(u.exterior.coords)[:-1]), stroke=NAVY, width=0.35)
    for ring in u.interiors:
        sh.poly(M(list(ring.coords)[:-1]), stroke=NAVY, width=0.35)
    if folds:
        for c in creases():
            sh.poly(M(c), stroke=(150, 150, 150), width=0.25, dash=(2, 1.2), closed=False)
    if labels:
        names = {'L outer': 'END WALL (box right)', 'R outer': 'END WALL (box left)', 'L inner': 'INNER END WALL', 'R inner': 'INNER END WALL',
                 'L strip': '', 'R strip': '', 'L dust': 'DUST FLAP', 'R dust': 'DUST FLAP', 'L flap': 'FRONT END FLAP', 'R flap': 'FRONT END FLAP'}
        for k, pts in panels().items():
            if k.endswith(('tab0', 'tab1')):
                continue
            cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
            lab = names.get(k, k.upper())
            if not lab:
                continue
            rot = 90 if k.endswith(('outer', 'inner', 'dust', 'flap')) else 0
            (cx, cy) = M([(cx, cy)])[0]
            sh.text(cx, cy, lab, 4, 'h', NAVY, 'center', rot, opacity=0.5)


# ----------------------------------------------------------------------------- 2D outputs
def tiles(art_fn, mirrored, path, title):
    doc = fitz.open()
    ox, oy = 10.0, 10.0
    tw, th, ov = 420.0, 297.0, 10.0
    ncol = math.ceil((SHEET_W + 20 - ov) / (tw - ov)); nrow = math.ceil((SHEET_H + 30 - ov) / (th - ov))
    n = 0
    for r in range(nrow):
        for c in range(ncol):
            xf, yf = c * (tw - ov), r * (th - ov)
            t = Sheet(tw, th, ox - xf, oy - yf, doc=doc)
            art_fn(t); dieline(t, mirrored)
            pg = t.page; kk = A.K
            xt, yt = xf + tw - ov / 2, yf + th - ov / 2
            for rect in ((0, (yt - yf + ov / 2) * kk, tw * kk, th * kk), ((xt - xf + ov / 2) * kk, 0, tw * kk, th * kk)):
                pg.draw_rect(fitz.Rect(*rect), color=None, fill=(1, 1, 1), overlay=True)
            n += 1
            pg.insert_text(fitz.Point(8 * kk, (th - 4) * kk), '%s, tile %d of %d (row %d, column %d), 1:1. Overlap %g mm with the neighbouring tiles.' % (title, n, ncol * nrow, r + 1, c + 1, ov), fontsize=8, fontname='helv')
    doc.save(path, deflate=True, garbage=3)


def build_2d():
    ox, oy = 10.0, 10.0
    note = 'RoboCore V2 mailer box, roll-end tuck-top, outer %d x %d x %d mm, E-flute 1.5 mm. Print 1:1; navy solid = cut, grey dashed = fold. Bar = 100 mm.' % (Lo, Wo, Ho)
    sh = Sheet(SHEET_W + 20, SHEET_H + 30, ox, oy)
    artwork_outside(sh); dieline(sh)
    sh.text(0, SHEET_H + 8, 'OUTSIDE.  ' + note, 4, 'b')
    sh.line(SHEET_W - 100, SHEET_H + 12, SHEET_W, SHEET_H + 12, NAVY, 0.6)
    sh.save(os.path.join(OUT, 'box_outside.pdf'), os.path.join(OUT, 'box_outside.svg'), os.path.join(OUT, 'box_outside.png'), dpi=60)
    si = Sheet(SHEET_W + 20, SHEET_H + 30, ox, oy)
    artwork_inside(si); dieline(si, mirrored=True)
    si.text(0, SHEET_H + 8, 'INSIDE (mirrored: prints on the back of the outside sheet).  ' + note, 4, 'b')
    si.line(SHEET_W - 100, SHEET_H + 12, SHEET_W, SHEET_H + 12, NAVY, 0.6)
    si.save(os.path.join(OUT, 'box_inside.pdf'), os.path.join(OUT, 'box_inside.svg'), os.path.join(OUT, 'box_inside.png'), dpi=60)
    sd = Sheet(SHEET_W + 20, SHEET_H + 30, ox, oy)
    dieline(sd, labels=True)
    sd.text(0, SHEET_H + 8, 'RoboCore V2 mailer box dieline, outer %d x %d x %d mm, E-flute 1.5 mm, 1:1. Printed-outside view.' % (Lo, Wo, Ho), 4, 'b')
    sd.save(os.path.join(OUT, 'box_dieline.pdf'))
    tiles(artwork_outside, False, os.path.join(OUT, 'box_outside_A3_tiles.pdf'), 'RoboCore V2 box, outside')
    tiles(artwork_inside, True, os.path.join(OUT, 'box_inside_A3_tiles.pdf'), 'RoboCore V2 box, inside')


def build_insert_sheet():
    si = Sheet(297, 210, 19, 6)
    ip = insert_polygon()
    flip = lambda pts: [(x, IH - y) for x, y in pts]           # front edge at the bottom of the page
    si.poly(flip(list(ip.exterior.coords)[:-1]), fill=KRAFT, stroke=NAVY, width=0.35)
    for ring in ip.interiors:
        si.poly(flip(list(ring.coords)[:-1]), fill=WHITE, stroke=NAVY, width=0.35)
    for k, pts in POCKETS.items():
        cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
        if k == 'robot':
            cy = 95
        si.text(cx, IH - cy, POCKET_LABELS[k], 3.2 if k == 'robot' else 2.2, 'h', NAVY, 'center', opacity=0.75)
    si.text(0, IH + 7, 'Insert tray %d x %d mm, %d mm thick (two layers of 20 mm foam, or eight of 5 mm corrugated), 1:1. Lies on the floor of the box, front edge at the bottom.' % (IW, IH, IT), 3, 'b')
    si.text(0, IH + 11, 'The robot stands in the cross-shaped pocket (chassis plan + 3 mm); the arm boom, base, servos, jaws, clips and screws beside it.', 2.6, 'r')
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


# ----------------------------------------------------------------------------- 3D (box frame: x along L, 0 = left outer face; y depth, 0 = front; z up, 0 = floor underside)
INSIDE_PRINTED = ('lid', 'back', 'floor', 'front', 'tongue')


def place(name, open_lid=False):
    """Mapping sheet (Xs, Ys) -> box position of the panel's UNPRINTED face, and the outward normal of the printed face."""
    bx = lambda Xs: T + (XC1 - Xs)             # the sheet is seen from the printed (outside) face: box x runs the other way
    by = lambda Ys: T + (Y_FL1 - Ys)
    if name == 'floor':
        return (lambda Xs, Ys: (bx(Xs), by(Ys), T)), (0, 0, -1)
    if name == 'back':
        return (lambda Xs, Ys: (bx(Xs), Wo - T, Y_BK1 - Ys)), (0, 1, 0)
    if name == 'front':
        return (lambda Xs, Ys: (bx(Xs), T, Ys - Y_FR0)), (0, -1, 0)
    if name == 'lid':
        return (lambda Xs, Ys: (bx(Xs), Wo - (Y_LID1 - Ys), Ho - T)), (0, 0, 1)
    if name == 'tongue':
        if open_lid:
            return (lambda Xs, Ys: (bx(Xs), Wo - (Y_LID1 - Ys), Ho - T)), (0, 0, 1)
        return (lambda Xs, Ys: (bx(Xs), 2 * T + 0.2, Ho - T - (Y_LID0 - Ys))), (0, -1, 0)
    side = name[0]                                  # 'L' = sheet left = box right end; 'R' = sheet right = box left end
    kind = name[2:]
    if side == 'R':   # box left end (x near 0)
        d = lambda Xs: Xs - XC1                     # distance from the floor's edge on the sheet
        if kind == 'outer':
            return (lambda Xs, Ys: (T, by(Ys), d(Xs))), (-1, 0, 0)
        if kind == 'strip':
            return (lambda Xs, Ys: (d(Xs) - EO, by(Ys), H)), (0, 0, 1)
        if kind == 'inner':
            return (lambda Xs, Ys: (ER - T, by(Ys), H + T - (d(Xs) - EO - ER))), (1, 0, 0)
        if kind.startswith('tab'):
            return (lambda Xs, Ys: (ER - T, by(Ys), H + T - (d(Xs) - EO - ER))), (1, 0, 0)
        if kind == 'flap':
            return (lambda Xs, Ys: (2 * T + 0.2, T + d(Xs), Ys - Y_FR0)), (-1, 0, 0)
        if kind == 'dust':
            return (lambda Xs, Ys: (ER + T + 0.2, Wo - (Y_LID1 - Ys), Ho - T - (Xs - (XC1 + T)))), (-1, 0, 0)
    else:             # box right end (x near Lo)
        d = lambda Xs: XC0 - Xs
        if kind == 'outer':
            return (lambda Xs, Ys: (Lo - T, by(Ys), d(Xs))), (1, 0, 0)
        if kind == 'strip':
            return (lambda Xs, Ys: (Lo - (d(Xs) - EO), by(Ys), H)), (0, 0, 1)
        if kind == 'inner' or kind.startswith('tab'):
            return (lambda Xs, Ys: (Lo - ER + T, by(Ys), H + T - (d(Xs) - EO - ER))), (-1, 0, 0)
        if kind == 'flap':
            return (lambda Xs, Ys: (Lo - 2 * T - 0.2, T + d(Xs), Ys - Y_FR0)), (1, 0, 0)
        if kind == 'dust':
            return (lambda Xs, Ys: (Lo - ER - T - 0.2, Wo - (Y_LID1 - Ys), Ho - T - ((XC0 - T) - Xs))), (1, 0, 0)
    raise KeyError(name)


def slab(name, open_lid=False, flat=False):
    poly = Polygon(panels()[name])
    if name == 'front':
        poly = poly.difference(Point((XC0 + XC1) / 2, Y_FR1).buffer(NOTCH, resolution=16))
    if name == 'floor':
        for x0, y0, x1, y1 in slots():
            poly = poly.difference(sbox(x0, y0, x1, y1))
    if flat:
        fn, n = (lambda Xs, Ys: (Xs, -Ys, 0.0)), (0, 0, 1)
    else:
        fn, n = place(name, open_lid)
    n = np.array(n, float)
    verts, faces, uvs, mats = [], [], [], []
    inside_mat = 3 if name in INSIDE_PRINTED else 1

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
        add(fn(Xs, Ys), ((SHEET_W - Xs) / SHEET_W, 1 - Ys / SHEET_H))
    for tri in f2:
        a, b, c = [verts[base_i + i] for i in tri]
        if np.dot(np.cross(b - a, c - a), -n) < 0:
            tri = tri[::-1]
        faces.append([base_i + i for i in tri]); mats.append(inside_mat)
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
    if open_lid and (name in ('lid', 'tongue') or name.endswith('dust')):
        m.apply_transform(trimesh.transformations.rotation_matrix(math.radians(-110), (1, 0, 0), (0, Wo, H + T)))
    return m


def insert_mesh():
    ip = insert_polygon()
    polys = list(ip.geoms) if ip.geom_type == 'MultiPolygon' else [ip]
    parts = []
    x0 = (Lo - IW) / 2
    for pg in polys:
        m = trimesh.creation.extrude_polygon(pg, IT)       # (x, y) extruded along z
        v = m.vertices.copy()
        m.vertices = np.column_stack([v[:, 0] + x0, v[:, 1] + T + 1, v[:, 2] + T])
        m.fix_normals()
        parts.append(m)
    m = trimesh.util.concatenate(parts)
    m.visual = trimesh.visual.ColorVisuals(m, face_colors=[*KRAFT, 255])
    m.metadata['name'] = 'insert'; m.metadata['mats'] = np.full(len(m.faces), 2)
    return m


MAT_NAMES = ['print', 'card', 'kraft', 'inside']


def write_obj(meshes, path, texpath, texpath_in):
    mtl = os.path.splitext(path)[0] + '.mtl'
    with open(mtl, 'w') as f:
        f.write('newmtl print\nKd 1 1 1\nKs 0.05 0.05 0.05\nNs 10\nmap_Kd %s\n\nnewmtl inside\nKd 1 1 1\nKs 0.05 0.05 0.05\nNs 10\nmap_Kd %s\n\n'
                'newmtl card\nKd 0.80 0.70 0.52\nKs 0.02 0.02 0.02\nNs 5\n\nnewmtl kraft\nKd 0.77 0.67 0.50\nNs 5\n' % (os.path.basename(texpath), os.path.basename(texpath_in)))
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
                nm = MAT_NAMES[int(mat)]
                if nm != cur:
                    f.write('usemtl %s\n' % nm); cur = nm
                f.write('f %d/%d %d/%d %d/%d\n' % (face[0] + off, face[0] + off, face[1] + off, face[1] + off, face[2] + off, face[2] + off))
            off += len(m.vertices)


def write_glb(meshes, path, tex_im, tex_in):
    scene = trimesh.Scene()
    mats = {0: trimesh.visual.material.PBRMaterial(baseColorTexture=tex_im, metallicFactor=0.0, roughnessFactor=0.8, name='print'),
            1: trimesh.visual.material.PBRMaterial(baseColorFactor=[204, 178, 132, 255], metallicFactor=0.0, roughnessFactor=0.95, name='card'),
            2: trimesh.visual.material.PBRMaterial(baseColorFactor=[196, 170, 128, 255], metallicFactor=0.0, roughnessFactor=0.95, name='kraft'),
            3: trimesh.visual.material.PBRMaterial(baseColorTexture=tex_in, metallicFactor=0.0, roughnessFactor=0.8, name='inside')}
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


def texture(pdf, png):
    doc = fitz.open(os.path.join(OUT, pdf))
    k = A.K
    clip = fitz.Rect(10 * k, 10 * k, (10 + SHEET_W) * k, (10 + SHEET_H) * k)
    pix = doc[0].get_pixmap(dpi=102, clip=clip)        # 4 px/mm
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    path = os.path.join(OUT, png)
    im.save(path)
    return path, im


def build_3d():
    texpath, tex_im = texture('box_outside.pdf', 'box_texture_outside.png')
    texpath_in, tex_in = texture('box_inside.pdf', 'box_texture_inside.png')
    names = [k for k in panels().keys() if 'tab' not in k]        # the tabs sit through the floor; not modelled
    closed = [slab(n) for n in names]
    opened = [slab(n, open_lid=True) for n in names]
    ins = insert_mesh()
    write_obj(closed, os.path.join(OUT, 'box_closed.obj'), texpath, texpath_in)
    write_glb(closed, os.path.join(OUT, 'box_closed.glb'), tex_im, tex_in)
    write_obj(opened + [ins], os.path.join(OUT, 'box_open.obj'), texpath, texpath_in)
    write_glb(opened + [ins], os.path.join(OUT, 'box_open.glb'), tex_im, tex_in)
    write_glb([ins], os.path.join(OUT, 'insert.glb'), tex_im, tex_in)
    flat = [slab(n, flat=True) for n in names]
    write_obj(flat, os.path.join(OUT, 'box_flat.obj'), texpath, texpath_in)
    allm = trimesh.util.concatenate(closed)
    print('closed box bounds (mm):', np.round(allm.bounds, 1).tolist())


if __name__ == '__main__':
    build_2d()
    build_insert_sheet()
    build_dxf()
    build_3d()
    json.dump({'L': L, 'W': W, 'H': H, 'T': T, 'outer': [Lo, Wo, Ho], 'sheet': [SHEET_W, SHEET_H], 'panels': panels(), 'creases': creases(), 'slots': slots(), 'pockets': POCKETS},
              open(os.path.join(OUT, 'box.json'), 'w'), indent=1)
    print('sheet %g x %g mm ->' % (SHEET_W, SHEET_H), OUT)
