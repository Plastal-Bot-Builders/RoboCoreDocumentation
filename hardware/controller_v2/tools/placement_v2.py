"""RoboCore V2 placement (board coordinates in mm, same frame as V1: outline x 102.3-170.3, y 61.55-121.55).

Single-sided assembly: every SMD part sits on the top side; the back only carries through-hole pins and test pads,
so it stays free for artwork (Fred, 2026-10-05).

FIXED: connectors, controls, ICs and anything the layout sketch dictates (ref: (x, y, rotation, side)).
ZONES: groups of small parts packed into a rectangle, clear of courtyards, through-hole pads, the board outline and
the RESERVED label areas. Zones are a packing aid only; nothing is drawn for them.
Silkscreen (Fred 2026-10-05, second pass):
  - V1 style: a line just inside the board edge and straight DIVIDERS (45 degree bends) that meet it, with plain
    REGION_NAMES in the areas they mark;
  - XRP style: white (knockout) boxes with the pin names next to the important connectors (PIN_LABELS) and a
    knockout name for each (NAMES).
Fred's sketch: ESP32 top centre (antenna over the top cut-out), motor 1/2 upper left/right, servos left/right
(1+3 left, 2+4 right, XRP style), two female expansion headers in the centre, bottom row ultrasonic / USB-C / line.
"""
import math
import os
import re
import pcbnew

FPLIB = "/Applications/KiCad.app/Contents/SharedSupport/footprints"
HERE = os.path.dirname(os.path.abspath(__file__))
PROJLIB = {"RoboCoreV2": os.path.join(os.path.dirname(HERE), "lib", "RoboCoreV2.pretty")}
V1_BOARD = os.path.join(os.path.dirname(os.path.dirname(HERE)), "RoboCore", "RoboCore.kicad_pcb")

SERVO_X_L, SERVO_X_R = 109.7, 162.9                 # servo header columns, 2.4 mm in from the side notches
SERVO_Y_A, SERVO_Y_B = 86.91, 95.66                 # pin 1 of the upper / lower servo header

FIXED = {
    # ---- connectors and controls (Fred's sketch)
    "U201": (136.3, 74.55, 0, "T"),       # ESP32-S3 module, antenna over the top cut-out (as V1)
    "J405": (122.6, 72.39, 0, "T"),       # expansion A (pin 1 at the top)
    "J406": (150.0, 72.39, 0, "T"),       # expansion B
    "J301": (113.0, 72.0, 0, "T"),        # motor 1 (XRP JST-SH 6)
    "J302": (159.6, 72.0, 0, "T"),        # motor 2
    "J401": (SERVO_X_L, SERVO_Y_A, 0, "T"), "J407": (SERVO_X_L, SERVO_Y_B, 0, "T"),   # servo 1 / 3 (S + -), left notch
    "J402": (SERVO_X_R, SERVO_Y_A, 0, "T"), "J408": (SERVO_X_R, SERVO_Y_B, 0, "T"),   # servo 2 / 4, right notch
    "J403": (110.4, 117.2, 90, "T"),      # ultrasonic, JST SH 4: GND 3V3 TRIG ECHO (ECO 2026-10-05)
    "J404": (153.0, 116.7, 90, "T"),      # line follower, JST SH 5: GND 3V3 L C R
    "J101": (136.3, 117.9, 0, "T"),       # USB-C at the bottom edge
    "J102": (122.4, 117.8, 0, "T"),       # XT30 battery (pin 1 = GND on the left)
    "J201": (167.45, 71.9, 90, "T"),      # Qwiic, top-right corner
    "SW101": (168.5, 109.0, 90, "T"),     # ON/OFF: right-angle slide switch, lever over the right edge (slide up = ON)
    "SW201": (130.2, 92.2, 0, "T"),       # RESET
    "SW202": (142.4, 92.2, 0, "T"),       # BOOT
    "SW203": (156.3, 105.35, 0, "T"),     # USER, bottom-right next to the power switch
    "C201": (125.5, 86.45, 90, "T"),      # 22 uF bulk for the module, bottom of the column left of it
    "U202": (136.3, 92.2, 90, "T"),       # IMU between RESET and BOOT (+X points to the top edge, +Y to the left)
    "C205": (135.75, 89.15, 90, "T"), "C206": (136.85, 89.15, 90, "T"),   # IMU decoupling, above it
    "BZ201": (130.3, 102.2, 0, "T"),      # buzzer
    # battery input protection: the two back-to-back P-FETs between the XT30 and the board, sources facing each other
    "Q103": (127.9, 109.35, 180, "T"), "Q104": (132.65, 109.35, 0, "T"),
    # ---- top-left corner: RGB LED, then the five status LEDs with their labels and resistors
    "FID101": (104.6, 69.3, 0, "T"),
    "D201": (105.15, 72.4, 0, "T"), "C204": (107.45, 72.4, 90, "T"), "R204": (105.4, 74.55, 0, "T"),
    "D101": (104.8, 76.2, 0, "T"), "D102": (104.8, 78.2, 0, "T"), "D103": (104.8, 80.2, 0, "T"),
    "D104": (104.8, 82.2, 0, "T"), "D105": (104.8, 84.2, 0, "T"),
    "R107": (110.9, 76.2, 0, "T"), "R108": (110.9, 78.2, 0, "T"), "R109": (110.9, 80.2, 0, "T"),
    "R119": (110.9, 82.2, 0, "T"), "R120": (110.9, 84.2, 0, "T"),
    # ---- power ICs and inductors
    "U301": (115.4, 80.4, 0, "T"),        # motor driver under motor 1
    # 5.5 V boost (bottom-left): battery switch + input cap on the left, inductor, IC, output caps on the right
    "Q102": (106.0, 105.2, 0, "T"), "C111": (105.0, 109.4, 90, "T"), "L102": (111.5, 106.0, 90, "T"),
    "U104": (116.6, 104.9, 90, "T"), "C117": (119.5, 105.6, 90, "T"), "C119": (117.0, 109.4, 0, "T"),
    "U103": (154.4, 81.4, 0, "T"), "L101": (160.2, 81.2, 0, "T"),         # 3.3 V buck-boost
    "U102": (139.4, 101.0, 0, "T"),       # charger
    "H101": (105.8, 64.9, 0, "T"), "H102": (166.9, 65.3, 0, "T"), "H103": (105.35, 118.35, 0, "T"), "H104": (167.15, 118.5, 0, "T"),
    "FID102": (153.3, 69.2, 0, "T"), "FID103": (104.6, 114.3, 0, "T"),
    "R306": (157.6, 76.0, 0, "T"), "R307": (161.4, 76.0, 0, "T"),   # encoder pull-ups beside motor 2
    "JP101": (127.6, 104.0, 0, "B"),      # SEL solder jumper: bare copper on the back, labelled
    # ---- bottom: test pads only (no assembly on the back)
    "TP101": (109.2, 109.6, 0, "B"), "TP102": (111.8, 109.6, 0, "B"), "TP103": (114.4, 109.6, 0, "B"),
    "TP105": (117.0, 109.6, 0, "B"), "TP104": (119.6, 109.6, 0, "B"),
}

ZONES = [   # (name, side, rect x0 y0 x1 y1, refs) - packing areas only
    ("MOTOR DRIVER", "T", (112.0, 74.9, 120.6, 84.9), ["C303", "C301", "C302", "R301", "R302", "R303", "C304", "C305", "R304", "R305"]),
    ("SERVO L", "T", (117.3, 85.6, 120.7, 91.9), ["C401", "R401"]),
    ("BOOST B", "T", (117.3, 92.0, 120.7, 102.25), ["C113", "C114", "R112", "C115", "C116", "C112"]),
    ("5.5V BOOST", "T", (103.6, 102.75, 120.7, 111.8), ["C118", "R113", "R114", "R115", "R116"]),
    ("ESP32", "T", (124.45, 70.6, 126.55, 84.5), ["C202", "R201", "C203", "R405", "R408", "R406"]),
    ("PROTECT", "T", (146.05, 70.6, 148.15, 87.9), ["R411", "R412", "R413", "R409", "R410", "R403", "R404"]),
    ("BOOT PU", "T", (146.75, 89.2, 148.15, 95.2), ["R202"]),
    ("BATPROT A", "T", (120.85, 107.35, 124.4, 111.25), ["D107", "R123"]),
    ("BATPROT B", "T", (148.25, 107.4, 151.75, 112.2), ["C121", "R125", "R126", "R122", "R124", "R103"]),     # under EXP B, next to U105
    ("CHG TOP", "T", (140.3, 95.3, 148.1, 98.25), ["C104", "C122", "R206"]),
    ("CHARGER", "T", (135.7, 98.3, 148.0, 106.6), ["R104", "R121", "R105", "R106", "R103", "C103",
                                                    "Q105", "U105"]),
    ("USB ESD", "T", (135.7, 106.9, 148.0, 112.4), ["U101", "C102", "R101", "R102", "Q201", "D202", "R103"]),
    ("USB POWER", "T", (141.9, 112.6, 149.4, 121.1), ["F101", "D106", "C101", "R205"]),
    ("3.3V REGULATOR", "T", (151.9, 78.1, 169.8, 84.1), ["C108", "C107", "R111", "C109", "C110"]),
    ("SERVO R", "T", (151.9, 85.6, 155.4, 102.0), ["C402", "R402", "R207", "R208", "R203", "R117", "R118", "C120"]),
    ("POWER", "T", (151.9, 102.8, 163.9, 112.2), ["Q101", "C105", "R110", "C106", "R407"]),
]

# ---------------------------------------------------------------- silkscreen
KO_SIZE, KO_THICK = 0.9, 0.18     # knockout (white box) text: 0.9 mm, 0.18 mm stroke
KO_SIZE_BY_REF = {"J403": 0.8, "J404": 0.8}   # 1.0 mm pitch JST SH: smaller pin names
TXT_SIZE, TXT_THICK = 0.8, 0.15   # plain small text
REGION_SIZE = 1.0                 # V1-style area names
EDGE_INSET = 0.6                  # the outline drawn inside the board edge

PIN_LABELS = [   # (connector, pin names in pad order, where the white box goes) - XRP style
    ("J401", ["IO38", "5.5V", "GND"], "right"), ("J407", ["IO35", "5.5V", "GND"], "right"),
    ("J402", ["IO39", "5.5V", "GND"], "left"), ("J408", ["IO36", "5.5V", "GND"], "left"),
    ("J403", ["GND", "3V3", "TRIG", "ECHO"], "right"),
    ("J404", ["GND", "3V3", "L", "C", "R"], "right"),
    # expansion headers: pin names on the back, beside the pins (Fred 2026-10-05)
    ("J405", ["3V3", "GND", "IO7", "IO10", "IO2", "IO40", "IO41", "IO38", "IO39", "IO47", "RGB", "IO3", "VMOT", "GND"], "left", "B"),
    ("J406", ["3V3", "GND", "SDA", "SCL", "TX", "RX", "IO35", "IO36", "IO37", "IO1", "IO42", "EN", "VSYS", "GND"], "left", "B"),
]

NAMES = [   # knockout names: (text, x, y, angle)
    ("SERVO 1", 116.1, SERVO_Y_A + 2.54, 90), ("SERVO 3", 116.1, SERVO_Y_B + 2.54, 90),
    ("SERVO 2", 156.5, SERVO_Y_A + 2.54, 90), ("SERVO 4", 156.5, SERVO_Y_B + 2.54, 90),
    ("MOTOR 1", 113.0, 68.25, 0), ("MOTOR 2", 159.6, 68.25, 0),
    ("EXP A", 122.6, 69.0, 0), ("EXP B", 149.7, 69.0, 0),
    ("QWIIC", 167.45, 76.95, 0),
    ("ULTRASONIC", 113.5, 112.6, 0), ("LINE", 156.7, 113.3, 0),
    ("1S 4.2V MAX\n-  BAT  +", 124.9, 113.115, 0),     # two lines: the polarity line sits over the XT30 pins
    ("RESET", 130.2, 88.65, 0), ("BOOT", 142.4, 88.65, 0), ("USER", 161.6, 105.35, 90),
    ("IMU", 136.0, 95.35, 0),
    ("EXP A", 119.05, 69.4, 0, "B"), ("EXP B", 146.45, 69.4, 0, "B"),
]

TEXTS = [   # plain text: (text, x, y, size, side[, angle[, justify]])
    ("CHG", 106.55, 76.2, 0.8, "F", 0, "left"), ("FULL", 106.55, 78.2, 0.8, "F", 0, "left"),
    ("USB", 106.55, 80.2, 0.8, "F", 0, "left"), ("3V3", 106.55, 82.2, 0.8, "F", 0, "left"),
    ("MOT", 106.55, 84.2, 0.8, "F", 0, "left"),
    ("ON", 167.6, 103.2, 0.8, "F"), ("OFF", 167.6, 114.85, 0.8, "F"),
    ("3V3", 109.2, 111.7, 0.8, "B"), ("VMOT", 111.8, 107.5, 0.8, "B"), ("BAT", 114.4, 111.7, 0.8, "B"),
    ("VSW", 117.0, 107.5, 0.8, "B"), ("GND", 119.6, 111.7, 0.8, "B"),
    ("SEL 1-2: 1.6A", 128.8, 106.0, 0.8, "B"), ("2-3: USB 0.5A", 128.8, 107.2, 0.8, "B"),   # clear of J405 pin 14
]

IMU_AXES = (138.6, 97.6, 2.2)    # origin and arrow length: U202 is rotated 90 deg, so +X points up and +Y left

REGION_NAMES = []   # (text, x, y, angle) plain V1-style names
DIVIDERS = [        # polylines [(x, y), ...] drawn like V1's section lines; they break around pads, parts and labels
    [(103.1, 85.3), (121.05, 85.3)],                        # left: LEDs + motor driver / servos 1 and 3
    [(103.27, 102.6), (121.05, 102.6)],                     # left: servos / 5.5 V boost
    [(151.15, 85.3), (169.48, 85.3)],                       # right: 3.3 V regulator / servos 2 and 4
    [(151.15, 102.4), (165.6, 102.4), (166.13, 101.87)],    # right: servos / USER button + power switch
    [(124.1, 96.7), (134.3, 96.7)],                        # centre: buttons + IMU / buzzer
]

RESERVED = [   # (side, rect) kept free of parts: label boxes and the IMU axes
    ("T", (111.2, 85.0, 117.2, 102.7)), ("T", (155.5, 85.0, 161.5, 102.7)),      # servo labels + names
    ("T", (108.4, 111.85, 118.2, 115.8)), ("T", (150.4, 112.3, 162.8, 115.8)),   # ultrasonic / line pin labels
    ("T", (120.1, 111.3, 129.7, 114.9)),                                          # battery label
    ("T", (134.4, 94.3, 140.2, 98.2)),                                            # IMU label + axes
    ("T", (160.5, 103.8, 162.7, 107.8)),                                          # USER label
    # breakout rings: no packed parts right against fine-pitch pins, so every pin can get a track out
    ("T", (112.23, 77.48, 118.32, 83.32)),     # U301 DRV8411A (1 mm on the output side, 0.75 mm elsewhere)
    ("T", (135.75, 98.35, 136.75, 104.65)), ("T", (136.75, 103.65, 142.05, 104.65)),   # U102 MCP73871: left and bottom pins
]

REF_SHOWN = ()      # no reference designators on the silkscreen (XRP style); the fab layer keeps them
REF_FIXED = {}
REF_HIDDEN = set()

LOCAL_CLEARANCE = {"U202": 0.15}   # LGA-14 0.5 mm pitch: 0.15 mm pad gaps (PCBWay minimum 6 mil)


def fp_lib_path(lib):
    return PROJLIB.get(lib, f"{FPLIB}/{lib}.pretty")


# ---------------------------------------------------------------- board outline (V1 Edge.Cuts) for "is it on the board"
def _outline():
    """V1 board outline as a closed polygon (arcs flattened to 10 degree steps)."""
    t = open(V1_BOARD).read()
    segs = []
    for m in re.finditer(r'\(gr_(line|arc)\s*\(start ([-\d.]+) ([-\d.]+)\)\s*(?:\(mid ([-\d.]+) ([-\d.]+)\)\s*)?\(end ([-\d.]+) ([-\d.]+)\)', t):
        tail = t[m.end():m.end() + 300]
        if '(layer "Edge.Cuts")' not in tail.split("(gr_")[0]:
            continue
        s = (float(m.group(2)), float(m.group(3)))
        e = (float(m.group(6)), float(m.group(7)))
        if m.group(1) == "line":
            segs.append([s, e])
        else:
            mid = (float(m.group(4)), float(m.group(5)))
            segs.append(_arc_points(s, mid, e))
    poly = segs.pop(0)          # chain the pieces end to end
    while segs:
        tail = poly[-1]
        k = min(range(len(segs)), key=lambda i: min(math.dist(tail, segs[i][0]), math.dist(tail, segs[i][-1])))
        s = segs.pop(k)
        poly += (s if math.dist(tail, s[0]) <= math.dist(tail, s[-1]) else s[::-1])[1:]
    return poly


def _arc_points(s, m, e):
    ax, ay = s; bx, by = m; cx, cy = e
    d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
    uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d
    r = math.dist((ux, uy), s)
    a0, a1, am = (math.atan2(p[1] - uy, p[0] - ux) for p in (s, e, m))
    def norm(a):
        return (a - a0) % (2 * math.pi)
    sweep = norm(a1)
    if norm(am) > sweep:      # the arc goes the other way round
        sweep -= 2 * math.pi
    n = max(2, int(abs(sweep) / math.radians(10)) + 1)
    return [(ux + r * math.cos(a0 + sweep * i / n), uy + r * math.sin(a0 + sweep * i / n)) for i in range(n + 1)]


BOARD = _outline()


def _seg_dist(p, a, b):
    ax, ay = a; bx, by = b; px, py = p
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def on_board(x, y, m=0.3):
    inside = False
    for (x1, y1), (x2, y2) in zip(BOARD, BOARD[1:] + BOARD[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside and all(_seg_dist((x, y), a, b) >= m for a, b in zip(BOARD, BOARD[1:] + BOARD[:1]))


def rect_on_board(r, m=0.3):
    xs = [r[0] + (r[2] - r[0]) * i / 4 for i in range(5)]
    ys = [r[1] + (r[3] - r[1]) * i / 4 for i in range(5)]
    return all(on_board(x, y, m) for x in xs for y in ys)


def _courtyard(fp_name, rot):
    lib, name = fp_name.split(":")
    f = pcbnew.FootprintLoad(fp_lib_path(lib), name)
    f.SetOrientationDegrees(rot)
    f.BuildCourtyardCaches()          # rotation clears the cached courtyard
    cy = None
    poly = f.GetCourtyard(pcbnew.F_CrtYd)
    if poly.OutlineCount():
        bb = poly.BBox()
        cy = (pcbnew.ToMM(bb.GetLeft()), pcbnew.ToMM(bb.GetTop()), pcbnew.ToMM(bb.GetRight()), pcbnew.ToMM(bb.GetBottom()))
    if cy is None:   # no courtyard drawn: pads + 0.25 mm
        bb = None
        for p in f.Pads():
            pb = p.GetBoundingBox()
            r = (pcbnew.ToMM(pb.GetLeft()), pcbnew.ToMM(pb.GetTop()), pcbnew.ToMM(pb.GetRight()), pcbnew.ToMM(pb.GetBottom()))
            bb = r if bb is None else (min(bb[0], r[0]), min(bb[1], r[1]), max(bb[2], r[2]), max(bb[3], r[3]))
        cy = (bb[0] - 0.25, bb[1] - 0.25, bb[2] + 0.25, bb[3] + 0.25)
    tht = []
    for p in f.Pads():
        if p.GetAttribute() in (pcbnew.PAD_ATTRIB_PTH, pcbnew.PAD_ATTRIB_NPTH):
            bb = p.GetBoundingBox()
            tht.append((pcbnew.ToMM(bb.GetLeft()), pcbnew.ToMM(bb.GetTop()), pcbnew.ToMM(bb.GetRight()), pcbnew.ToMM(bb.GetBottom())))
    return cy, tht


def overlap(a, b, gap=0.0):
    return a[0] < b[2] + gap and b[0] < a[2] + gap and a[1] < b[3] + gap and b[1] < a[3] + gap


def placement(comps):
    occ = {"T": [], "B": []}     # courtyards per side
    holes = []                   # through-hole pads (block both sides)
    out = {}

    def add(ref, x, y, rot, side, cy, tht):
        out[ref] = (round(x, 3), round(y, 3), rot, side)
        if ref == "U201":   # module courtyard is a T shape: antenna clearance on top, body below
            occ[side] += [(ref, (x - 24.0, y - 27.75, x + 24.0, y - 6.75)), (ref, (x - 9.75, y - 6.75, x + 9.75, y + 13.45))]
        else:
            r = (x + cy[0], y + cy[1], x + cy[2], y + cy[3])
            if side == "B":   # flipping mirrors left-right
                r = (x - cy[2], y + cy[1], x - cy[0], y + cy[3])
            occ[side].append((ref, r))
        for h in tht:
            hx = (h[0], h[2]) if side == "T" else (-h[2], -h[0])
            holes.append((ref, (x + hx[0] - 0.3, y + h[1] - 0.3, x + hx[1] + 0.3, y + h[3] + 0.3)))

    for side, r in RESERVED:
        occ[side].append(("reserved", r))
    for ref, (x, y, rot, side) in FIXED.items():
        if ref in comps:
            cy, tht = _courtyard(comps[ref]["footprint"], rot if side == "T" else -rot)
            add(ref, x, y, rot, side, cy, tht)
    failed = []
    for name, side, (z0, z1, z2, z3), refs in ZONES:
        m = 0.05
        x0, y0, x1, y1 = z0 + m, z1 + m, z2 - m, z3 - m
        todo = [r for r in refs if r not in out and r in comps]
        shapes = {r: [(rot,) + _courtyard(comps[r]["footprint"], rot) for rot in (0, 90)] for r in todo}
        todo.sort(key=lambda r: -(shapes[r][0][1][2] - shapes[r][0][1][0]) * (shapes[r][0][1][3] - shapes[r][0][1][1]))
        for ref in todo:
            done = False
            y = y0
            while not done and y <= y1:
                x = x0
                while not done and x <= x1:
                    for rot, cy, tht in shapes[ref]:
                        cyb = (-cy[2], cy[1], -cy[0], cy[3]) if side == "B" else cy
                        w, h = cyb[2] - cyb[0], cyb[3] - cyb[1]
                        r = (x, y, x + w, y + h)
                        if r[2] > x1 or r[3] > y1:
                            continue
                        if rect_on_board(r) and not any(overlap(r, o, 0.15) for k, o in occ[side] if k != "reserved") \
                                and not any(overlap(r, o) for k, o in occ[side] if k == "reserved") \
                                and not any(overlap(r, hh) for _, hh in holes):
                            add(ref, round(x - cyb[0], 3), round(y - cyb[1], 3), rot, side, cy, tht)
                            done = True
                            break
                    x += 0.2
                y += 0.2
            if not done:
                failed.append((ref, name))
    failed = [f"{r}@{n}" for r, n in failed if r not in out]      # a part may be listed in a fallback zone too
    placement.occ, placement.failed = occ, failed
    if failed and not placement.lenient:
        raise SystemExit(f"could not pack: {failed}")
    for side in ("T", "B"):
        lst = occ[side]
        for i in range(len(lst)):
            for j in range(i + 1, len(lst)):
                if lst[i][0] != lst[j][0] and "reserved" not in (lst[i][0], lst[j][0]) and overlap(lst[i][1], lst[j][1]):
                    print(f"  overlap {side}: {lst[i][0]} / {lst[j][0]}")
    for name, side, rect, refs in ZONES:
        for ref in refs:
            r = next((o for k, o in occ[side] if k == ref), None)
            if r and not (rect[0] - 0.01 <= r[0] and r[2] <= rect[2] + 0.01 and rect[1] - 0.01 <= r[1] and r[3] <= rect[3] + 0.01):
                print(f"  {ref} sticks out of zone {name}")
    return out


placement.lenient = False
