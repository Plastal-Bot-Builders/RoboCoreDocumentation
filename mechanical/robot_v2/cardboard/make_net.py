#!/usr/bin/env python3
"""Cardboard cut-out (die-line) of the RoboCore V2 robot chassis, derived from the rev 5 Fusion
parameters (fusion/rc_params.py). One sheet folds into a box chassis: floor + two side walls + rear wall,
a deck (lid) on top for the controller, a front flap for the HC-SR04 and a nose shelf for the line sensor.

Units: mm. Net coordinates: X across the sheet, Y down the sheet (robot front at the top of the sheet).
Outputs (same folder): robot_cardboard_net.svg (1:1), .pdf (A3 portrait, 1:1), _A4_tiles.pdf (2 x A4, 1:1),
.png preview and net.json (the shapes, used to push the drawing into Figma).
"""
import json, math, os
import pymupdf as fitz

HERE = os.path.dirname(os.path.abspath(__file__))

# ----------------------------------------------------------------- robot dimensions (rc_params, rev 5)
T = 3.0                 # card thickness (single-wall corrugated, E/B flute). 1.5 mm grey board also works.
AXLE_Z = 28.0           # wheel axle above the floor (56 mm tyres)
FLOOR_Z = 11.0          # underside of the floor plate above the ground (printed chassis: 10.5)
FLOOR_TOP = FLOOR_Z + T  # 14
DECK_Z = 52.0           # underside of the deck = board underside on the printed chassis
WALL_H = DECK_Z - FLOOR_TOP   # 38
IN_W = 119.0            # inner width: the motor shaft faces are at |x| 59.3, the wall sits against them
IN_L = 144.0            # inner length: rear wall at y -82, front flap at y 62
Y_REAR, Y_FRONT = -82.0, 62.0
SHELF_L, SHELF_HALF, SHELF_CH = 30.0, 35.0, 8.0   # nose shelf for the line sensor (y 62..92)
TAB = 12.0
BATT = (61.6, 78.4, 21.6, -66.7, 11.7)   # w, l, h, y0, y1 (BatteryHolder3S)
MOTOR_X = (40.5, 59.5)                   # gearbox inner face .. shaft face
MOTOR_Y = (-55.0, 22.0)                  # encoder cover .. gearbox front
M_PIN_Y = -11.0
BOARD = (68.0, 60.0)
BOARD_HOLES = [(-30.50, 26.65), (30.60, 26.25), (-30.95, -26.80), (30.85, -26.95)]
MOTOR_SLOT = (23.3, 31.0, 35.0, 12.0)    # |x| of the MOTOR sockets (J301/J302), y0, y1, length: the leads come up just in front of the board
REAR_SLOT = (-36.0, 22.0, -41.0, -29.0)  # x0, x1, y0, y1: straddles the board's rear edge for the XT30 lead, the sensor leads and the USB-C plug body
ANTENNA = (9.05, 23.3, 29.8)
CASTER = (49.0, -73.0, 12.0)             # x, y, screw pitch (drill to suit your caster)
SONAR_CAN_D, SONAR_CAN_PITCH, SONAR_Z = 16.5, 26.0, 26.0   # HC-SR04 cans, centre height above the ground
SONAR_PCB = (45.0, 20.0)
LINE_PCB = (60.0, 24.0)
LINE_HOLES = ((4.2, 13.0), (55.8, 13.0))  # from the board's corner (KiCad), 3.2 mm
LINE_Y0 = 65.0                            # board rear edge on the shelf

# ----------------------------------------------------------------- sheet layout (page Y down)
XC = 100.0                          # centre line of the net on the sheet
FLAP_H = DECK_Z + T - FLOOR_TOP     # 41: hangs from the deck's top surface down to the floor top
Y_FLAP0 = 0.0
Y_DECK0 = Y_FLAP0 + FLAP_H          # 41  deck front edge (robot y 62 + T)
DECK_L = IN_L + 2 * T               # 150: covers both walls
Y_REARW0 = Y_DECK0 + DECK_L         # 191 rear wall top
Y_FLOOR0 = Y_REARW0 + WALL_H        # 229 floor rear edge (robot y -82)
Y_SHELF0 = Y_FLOOR0 + IN_L          # 373 floor front edge (robot y 62)
Y_END = Y_SHELF0 + SHELF_L          # 403
XL, XR = XC - IN_W / 2, XC + IN_W / 2          # 40.5, 159.5 floor side creases
XDL, XDR = XC - IN_W / 2 - T, XC + IN_W / 2 + T   # 37.5, 162.5 deck edges
XWL, XWR = XL - WALL_H, XR + WALL_H            # 2.5, 197.5 side-wall outer edges


def deck_xy(x, y):
    """robot (x, y) on the deck -> sheet"""
    return XC + x, Y_DECK0 + (Y_FRONT + T - y)


def floor_xy(x, y):
    return XC + x, Y_FLOOR0 + (y - Y_REAR)


def wall_l(y, z):
    """left side wall: robot y and height z above the ground -> sheet"""
    return XL - (z - FLOOR_TOP), Y_FLOOR0 + (y - Y_REAR)


def wall_r(y, z):
    return XR + (z - FLOOR_TOP), Y_FLOOR0 + (y - Y_REAR)


def rear_xy(x, z):
    return XC + x, Y_FLOOR0 - (z - FLOOR_TOP)


def flap_xy(x, z):
    return XC + x, Y_FLAP0 + (z - FLOOR_TOP)


shapes = {'cut': [], 'crease': [], 'zone': [], 'text': []}


def poly(kind, pts, name='', closed=True):
    shapes[kind].append({'name': name, 'pts': [(round(x, 2), round(y, 2)) for x, y in pts], 'closed': closed})


def circle(kind, c, d, name=''):
    shapes[kind].append({'name': name, 'circle': (round(c[0], 2), round(c[1], 2), d)})


def rect(kind, x0, y0, x1, y1, name=''):
    poly(kind, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], name)


def label(x, y, s, size=3.2, anchor='middle', rot=0):
    shapes['text'].append({'x': round(x, 2), 'y': round(y, 2), 's': s, 'size': size, 'anchor': anchor, 'rot': rot})


# ----------------------------------------------------------------- outline (one closed polygon, clockwise)
sx0, sx1 = 24.0, 38.0      # cable notch in the flap's bottom edge, clear of the right sonar can
O = [
    (XL, Y_FLAP0), (XC + sx0, Y_FLAP0), (XC + sx0, Y_FLAP0 + 6), (XC + sx1, Y_FLAP0 + 6), (XC + sx1, Y_FLAP0),   # flap bottom edge + cable notch
    (XR, Y_FLAP0), (XR, Y_FLAP0 + 2), (XR + TAB, Y_FLAP0 + 8), (XR + TAB, Y_DECK0),                          # right flap tab
    (XDR, Y_DECK0), (XDR, Y_REARW0),                                                                           # deck right edge
    (XR, Y_REARW0), (XR + TAB, Y_REARW0 + 5), (XR + TAB, Y_FLOOR0 - 5), (XR, Y_FLOOR0),                        # right glue tab
    (XWR, Y_FLOOR0), (XWR, Y_SHELF0), (XR, Y_SHELF0),                                                          # right side wall
    (XC + SHELF_HALF, Y_SHELF0), (XC + SHELF_HALF, Y_END - SHELF_CH), (XC + SHELF_HALF - SHELF_CH, Y_END),     # nose shelf
    (XC - SHELF_HALF + SHELF_CH, Y_END), (XC - SHELF_HALF, Y_END - SHELF_CH), (XC - SHELF_HALF, Y_SHELF0),
    (XL, Y_SHELF0), (XWL, Y_SHELF0), (XWL, Y_FLOOR0), (XL, Y_FLOOR0),                                          # left side wall
    (XL - TAB, Y_FLOOR0 - 5), (XL - TAB, Y_REARW0 + 5), (XL, Y_REARW0),                                        # left glue tab
    (XDL, Y_REARW0), (XDL, Y_DECK0),                                                                           # deck left edge
    (XL, Y_DECK0), (XL - TAB, Y_DECK0), (XL - TAB, Y_FLAP0 + 8), (XL, Y_FLAP0 + 2),                            # left flap tab
]
poly('cut', O, 'outline')

# ----------------------------------------------------------------- creases
poly('crease', [(XL, Y_DECK0), (XR, Y_DECK0)], 'flap / deck', False)
poly('crease', [(XL, Y_REARW0), (XR, Y_REARW0)], 'deck / rear wall', False)
bx = BATT[0] / 2 + 1.2
poly('crease', [(XL, Y_FLOOR0), (XC - bx, Y_FLOOR0)], 'rear wall / floor', False)
poly('crease', [(XC + bx, Y_FLOOR0), (XR, Y_FLOOR0)], 'rear wall / floor', False)
poly('crease', [(XL, Y_FLOOR0), (XL, Y_SHELF0)], 'floor / left wall', False)
poly('crease', [(XR, Y_FLOOR0), (XR, Y_SHELF0)], 'floor / right wall', False)
poly('crease', [(XC - SHELF_HALF, Y_SHELF0), (XC + SHELF_HALF, Y_SHELF0)], 'floor / nose shelf', False)
for x in (XL, XR):
    poly('crease', [(x, Y_FLAP0 + 2), (x, Y_DECK0)], 'flap tab', False)
    poly('crease', [(x, Y_REARW0), (x, Y_FLOOR0)], 'glue tab', False)

# ----------------------------------------------------------------- cuts inside the panels
# deck: board screw holes (M2 clearance), cable window, USB relief, front cable slot
for (x, y) in BOARD_HOLES:
    circle('cut', deck_xy(x, y), 2.4, 'board M2')
for s in (-1, 1):
    rect('cut', *deck_xy(s * MOTOR_SLOT[0] - MOTOR_SLOT[3] / 2, MOTOR_SLOT[2]), *deck_xy(s * MOTOR_SLOT[0] + MOTOR_SLOT[3] / 2, MOTOR_SLOT[1]), 'motor lead slot')
rect('cut', *deck_xy(REAR_SLOT[0], REAR_SLOT[3]), *deck_xy(REAR_SLOT[1], REAR_SLOT[2]), 'rear cable slot')
# rear wall: battery opening (open at the crease, the holder slides in from the back)
rect('cut', *rear_xy(-bx, 37.5), *rear_xy(bx, FLOOR_TOP), 'battery opening')
# front flap: sonar cans
for s in (-1, 1):
    circle('cut', flap_xy(s * SONAR_CAN_PITCH / 2, SONAR_Z), SONAR_CAN_D, 'HC-SR04 can')
# side walls: motor shaft, locating pin, zip-tie slots
for w in (wall_l, wall_r):
    circle('cut', w(0.0, AXLE_Z), 6.5, 'motor shaft')
    circle('cut', w(M_PIN_Y, AXLE_Z), 4.5, 'motor locating pin')
    for y in (-25.0, 10.0):
        for z in (FLOOR_TOP + 3.0, FLOOR_TOP + 27.0):
            cx, cy = w(y, z)
            rect('cut', cx - 1.25, cy - 2.5, cx + 1.25, cy + 2.5, 'zip-tie slot')
# floor: caster screws, battery strap slots
for s in (-1, 1):
    for d in (-1, 1):
        circle('cut', floor_xy(s * CASTER[0] + d * CASTER[2] / 2, CASTER[1]), 3.2, 'caster screw')
# nose shelf: line sensor screws (M3), board hangs under the shelf
for (hx, hy) in LINE_HOLES:
    circle('cut', floor_xy(hx - LINE_PCB[0] / 2, LINE_Y0 + hy), 3.2, 'line sensor M3')

# ----------------------------------------------------------------- zones (where parts sit) + labels
rect('zone', *deck_xy(-BOARD[0] / 2, BOARD[1] / 2), *deck_xy(BOARD[0] / 2, -BOARD[1] / 2), 'controller 68 x 60')
rect('zone', *deck_xy(-ANTENNA[0], ANTENNA[2]), *deck_xy(ANTENNA[0], ANTENNA[1]), 'antenna keep-out')
rect('zone', *floor_xy(-BATT[0] / 2, BATT[4]), *floor_xy(BATT[0] / 2, BATT[3]), 'battery holder')
for s in (-1, 1):
    rect('zone', *floor_xy(s * MOTOR_X[0], MOTOR_Y[1]), *floor_xy(s * MOTOR_X[1], MOTOR_Y[0]), 'motor')
    circle('zone', floor_xy(s * CASTER[0], CASTER[1]), 16.0, 'caster')
rect('zone', *flap_xy(-SONAR_PCB[0] / 2, SONAR_Z - SONAR_PCB[1] / 2), *flap_xy(SONAR_PCB[0] / 2, SONAR_Z + SONAR_PCB[1] / 2), 'HC-SR04')
rect('zone', *floor_xy(-LINE_PCB[0] / 2, LINE_Y0 + LINE_PCB[1]), *floor_xy(LINE_PCB[0] / 2, LINE_Y0), 'line sensor')

label(XC, Y_FLAP0 + 36, 'FRONT FLAP  (folds down from the deck; HC-SR04 behind it, cans through the holes, header up)', 2.6)
label(XC, Y_FLAP0 + 30.5, 'HC-SR04 45 x 20', 2.6)
label(XC, Y_DECK0 + 12, 'DECK  150 x 125  (top; controller 68 x 60 screws here, 4 x M2)', 3.0)
label(*deck_xy(0, 2), 'RoboCore V2 board', 2.6)
label(*deck_xy(0, 34.5), 'antenna at the front edge: no metal within 15 mm', 2.0)
label(*deck_xy(-7, -44), 'rear slot: battery lead, sensor leads, USB-C plug', 2.0)
label(*deck_xy(0, 41.5), 'motor lead slots (under the MOTOR sockets)', 2.0)
label(XC, Y_DECK0 + DECK_L - 8, 'rear edge: folds over the rear wall', 2.4)
label(XC, Y_REARW0 + 10, 'REAR WALL  119 x 38', 3.0)
label(XC, Y_REARW0 + 20, 'battery slides in here (64 x 23.5 opening)', 2.4)
label(XC, Y_FLOOR0 + 12, 'FLOOR  144 x 119  (inside)', 3.0)
label(*floor_xy(0, -27), 'BatteryHolder3S  61.6 x 78.4 x 21.6', 2.6)
label(*floor_xy(0, -20), '3 x 18650, 1S3P, held with hook-and-loop tape', 2.2)
label(*floor_xy(0, 40), 'free area: wiring, spare', 2.2)
for s in (-1, 1):
    label(*floor_xy(s * 53, -16), 'MOTOR', 2.6, rot=90 * s)
    label(*floor_xy(s * 46.5, -16), 'TT + encoder', 2.0, rot=90 * s)
    label(*floor_xy(s * 49, -64), 'caster', 2.0)
    wx, wy = (wall_l if s < 0 else wall_r)(-62, FLOOR_TOP + 19)
    label(wx, wy, 'SIDE WALL 144 x 38', 2.8, rot=90 * s)
    wx, wy = (wall_l if s < 0 else wall_r)(0, FLOOR_TOP + 24)
    label(wx, wy, 'shaft 6.5 / pin 4.5', 2.0, rot=90 * s)
    wx, wy = (wall_l if s < 0 else wall_r)(-7, FLOOR_TOP + 33)
    label(wx, wy, 'zip-tie slots', 2.0, rot=90 * s)
label(*floor_xy(0, 70), 'NOSE SHELF: line sensor 60 x 24 under here, 2 x M3', 2.2)
label(*floor_xy(0, 86), 'cable notch in the flap above', 1.8)
label(XL - 6, Y_DECK0 + 20, 'tab', 2.0, rot=-90)
label(XR + 6, Y_DECK0 + 20, 'tab', 2.0, rot=90)
label(XL - 6, Y_REARW0 + 19, 'glue', 2.0, rot=-90)
label(XR + 6, Y_REARW0 + 19, 'glue', 2.0, rot=90)

NET_W, NET_H = XWR - XWL + 2 * 2.5, Y_END   # 200 x 403
json.dump({'shapes': shapes, 'net': [XWL - 2.5, 0, XWR + 2.5, Y_END]}, open(os.path.join(HERE, 'net.json'), 'w'), indent=1)


# ----------------------------------------------------------------- SVG (1 unit = 1 mm)
def svg(page_w, page_h, ox, oy, title=True):
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="%gmm" height="%gmm" viewBox="0 0 %g %g">' % (page_w, page_h, page_w, page_h),
           '<rect width="100%" height="100%" fill="white"/>', '<g transform="translate(%g %g)">' % (ox, oy)]
    for s in shapes['cut']:
        if 'circle' in s:
            x, y, d = s['circle']
            out.append('<circle cx="%g" cy="%g" r="%g" fill="none" stroke="#000" stroke-width="0.3"/>' % (x, y, d / 2))
        else:
            out.append('<polygon points="%s" fill="none" stroke="#000" stroke-width="0.3"/>' % ' '.join('%g,%g' % p for p in s['pts']))
    for s in shapes['crease']:
        out.append('<polyline points="%s" fill="none" stroke="#d02020" stroke-width="0.3" stroke-dasharray="3 1.5"/>' % ' '.join('%g,%g' % p for p in s['pts']))
    for s in shapes['zone']:
        if 'circle' in s:
            x, y, d = s['circle']
            out.append('<circle cx="%g" cy="%g" r="%g" fill="#2060c0" fill-opacity="0.06" stroke="#2060c0" stroke-width="0.25" stroke-dasharray="1 1"/>' % (x, y, d / 2))
        else:
            out.append('<polygon points="%s" fill="#2060c0" fill-opacity="0.06" stroke="#2060c0" stroke-width="0.25" stroke-dasharray="1 1"/>' % ' '.join('%g,%g' % p for p in s['pts']))
    for t in shapes['text']:
        tr = ' transform="rotate(%g %g %g)"' % (t['rot'], t['x'], t['y']) if t['rot'] else ''
        out.append('<text x="%g" y="%g" font-family="Helvetica, Arial, sans-serif" font-size="%g" fill="#333" text-anchor="%s"%s>%s</text>' % (t['x'], t['y'], t['size'], t['anchor'], tr, t['s']))
    out.append('</g>')
    if title:
        out.append('<text x="%g" y="%g" font-family="Helvetica, Arial, sans-serif" font-size="3.6" font-weight="bold" fill="#111">RoboCore V2 cardboard chassis, cut-out at 1:1 (3 mm card). Black = cut, red dashed = fold, blue = where parts go.</text>' % (ox, page_h - 6))
        out.append('<text x="%g" y="%g" font-family="Helvetica, Arial, sans-serif" font-size="2.8" fill="#444">Net %g x %g mm. Folded: 125 x 150 x 41 mm body, deck top 55 mm above the ground.</text>' % (ox, page_h - 2, NET_W, NET_H))
        out.append('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="#111" stroke-width="0.5"/>' % (page_w - ox - 100, page_h - 2.5, page_w - ox, page_h - 2.5))
        out.append('<text x="%g" y="%g" font-family="Helvetica" font-size="2.4" fill="#111" text-anchor="end">bar = 100 mm at 1:1</text>' % (page_w - ox - 102, page_h - 6))
    out.append('</svg>')
    return '\n'.join(out)


# A3 portrait 297 x 420, net centred
a3 = svg(297, 420, (297 - NET_W) / 2 - (XWL - 2.5), 4)
open(os.path.join(HERE, 'robot_cardboard_net.svg'), 'w').write(a3)
d = fitz.open('svg', a3.encode())
pdf = fitz.open('pdf', d.convert_to_pdf())
pdf.save(os.path.join(HERE, 'robot_cardboard_net.pdf'))
pdf[0].get_pixmap(dpi=120).save(os.path.join(HERE, 'robot_cardboard_net.png'))

# 2 x A4 portrait tiles (210 x 297), split at Y = 200 with a 10 mm overlap; the deck ends at the rear wall crease (191)
tiles = fitz.open()
for k, (y_from, y_to) in enumerate(((0, 205), (195, NET_H))):
    s = svg(210, 297, (210 - NET_W) / 2 - (XWL - 2.5), 8 - y_from, title=False)
    s = s.replace('<g transform', '<clipPath id="c"><rect x="0" y="8" width="210" height="%g"/></clipPath><g clip-path="url(#c)"><g transform' % (y_to - y_from), 1)
    s = s.replace('</svg>', '</g><text x="8" y="286" font-family="Helvetica" font-size="3.2" fill="#111">RoboCore V2 cardboard chassis, tile %d of 2 at 1:1 (3 mm card). Black = cut, red dashed = fold, blue = parts.</text>'
                  '<text x="8" y="291" font-family="Helvetica" font-size="2.8" fill="#444">Overlap the two tiles 10 mm at the grey dotted line (it is the same line on both sheets). The bar below must measure 100 mm.</text>'
                  '<line x1="8" y1="294" x2="108" y2="294" stroke="#111" stroke-width="0.5"/><text x="110" y="295" font-family="Helvetica" font-size="2.6" fill="#111">100 mm</text>'
                  '<line x1="0" y1="%g" x2="210" y2="%g" stroke="#888" stroke-width="0.2" stroke-dasharray="1 1"/></svg>'
                  % (k + 1, 8 + (195 - y_from if k == 0 else 10), 8 + (195 - y_from if k == 0 else 10)))
    t = fitz.open('pdf', fitz.open('svg', s.encode()).convert_to_pdf())
    pg = t[0]
    k_pt = 72 / 25.4
    # PyMuPDF's SVG renderer ignores clipPath: mask the overflow with white at the PDF level
    pg.draw_rect(fitz.Rect(0, (8 + y_to - y_from) * k_pt, 210 * k_pt, 297 * k_pt), color=None, fill=(1, 1, 1), overlay=True)
    pg.draw_rect(fitz.Rect(0, 0, 210 * k_pt, 8 * k_pt), color=None, fill=(1, 1, 1), overlay=True)
    # footer on top of the mask
    pg.insert_text(fitz.Point(8 * k_pt, 286 * k_pt), 'RoboCore V2 cardboard chassis, tile %d of 2 at 1:1 (3 mm card). Black = cut, red dashed = fold, blue = parts.' % (k + 1), fontsize=9, fontname='helv')
    pg.insert_text(fitz.Point(8 * k_pt, 291 * k_pt), 'Overlap the two tiles 10 mm at the grey dotted line (the same line is on both sheets). The bar below must measure 100 mm.', fontsize=8, fontname='helv', color=(0.3, 0.3, 0.3))
    pg.draw_line(fitz.Point(8 * k_pt, 294 * k_pt), fitz.Point(108 * k_pt, 294 * k_pt), color=(0, 0, 0), width=1.2)
    pg.insert_text(fitz.Point(110 * k_pt, 295 * k_pt), '100 mm', fontsize=7.5, fontname='helv')
    tiles.insert_pdf(t)
tiles.save(os.path.join(HERE, 'robot_cardboard_net_A4_tiles.pdf'))
print('net %g x %g mm; cuts %d, creases %d, zones %d, labels %d' % (NET_W, NET_H, len(shapes['cut']), len(shapes['crease']), len(shapes['zone']), len(shapes['text'])))
