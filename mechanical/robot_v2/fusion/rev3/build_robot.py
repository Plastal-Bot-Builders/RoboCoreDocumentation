"""Builds the RoboCore V2 robot (XRP-inspired), revision 3, in the active Fusion design.

Run from Fusion (Scripts and Add-Ins, or the Fusion MCP) with:
    import sys; sys.path.insert(0, '<this folder>'); import build_robot; build_robot.main()
Each step deletes and rebuilds its own component (the chassis is built in
five steps so each fits in one Fusion call). Rev 1 and rev 2 live in rev1/ and rev2/.

Rev 3: one open, unified chassis carries everything. The perimeter rail (45-degree
underside, V-detents every 8 mm) and the 8 mm hole row are the expansion bus.
Motors drop in from above with their wheels on and click under two hooks each.

Printed parts and their print orientation:
    Chassis        floor down              PETG, body colour
    Line sled      upside down             PETG, dark (line-sensor carrier + skid; 9.5/10.5/11.5 variants)
    Battery door   top face down           PETG, parts colour (carries the caster cup)
    1S2P spacer    as built                PETG (only with a 1S2P pack)
    Wheel x2       flat inner face down    PETG, parts colour (RoboCore gear on the hub)
    Tyre x2        flat                    TPU 95A
    Arm base       plate down              PETG, parts colour (arm module)
    Arm            deck down               PETG, parts colour
    Jaw L, Jaw R   flat                    PETG, dark
    Dock cap       plate down              PETG (fits the dock when the arm is off)
    Bus clip       on its side             PETG, accent (expansion-bus template)
    Rail coupon    base down               PETG (test piece for the clip fit)
"""
import math
import adsk.core
import adsk.fusion

import rc_lib as L
import rc_params as P

BOARD_FILE_ID = 'urn:adsk.wipprod:dm.lineage:MH3mPskERmKwCFQbVIab9Q'   # RoboCore_V2 (v2: J403/J404 JST SH)
LINE_FILE_ID = 'urn:adsk.wipprod:dm.lineage:HiFy67uSTRudML8jUJFiQQ'    # RoboCore_LineSensor
US_FILE_ID = 'urn:adsk.wipprod:dm.lineage:HaOVKFRuQHenR2Wu_iLUTA'      # RoboCore_Ultrasonic
MOTOR_COMPONENT = 'TT DC Gear Motor with Encoder (Blue)'
MOTOR_STEP = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/mech/CAD/DC_Gear_Motor_with_Encoder.step'

SCHEMES = {
    # RoboCore logo palette: teal #78A3AD body, dark teal #64878E parts, black accents
    'teal': {'body': (120, 163, 173), 'accent': (28, 30, 32), 'parts': (100, 135, 142), 'dark': (28, 30, 32), 'tyre': (18, 18, 18)},
    # rev 1 orange body, charcoal accents
    'orange': {'body': (242, 140, 40), 'accent': (40, 40, 44), 'parts': (85, 85, 92), 'dark': (28, 30, 32), 'tyre': (18, 18, 18)},
}
ROLES = {'Chassis': 'body', 'Line sled': 'dark', 'Battery door': 'parts', 'Wheel': 'parts', 'Tyre': 'tyre',
         '1S2P spacer': 'dark', 'Arm base': 'parts', 'Arm': 'parts', 'Jaw L': 'dark',
         'Jaw R': 'dark', 'Dock cap': 'parts', 'Bus clip': 'accent', 'Rail coupon': 'body'}

H, Y0, Y1, R = P.BODY_HALF, P.BODY_Y0, P.BODY_Y1, P.BODY_R
SIN5, COS5 = math.sin(math.radians(P.US_TILT)), math.cos(math.radians(P.US_TILT))


def S(x):
    """Both sides: returns [(sign, x*sign)]."""
    return [(1, x), (-1, -x)]


def xs(s, a, b):
    """|X| range (a, b) on side s, as a sorted (x0, x1)."""
    return tuple(sorted((s * a, s * b)))


# ================================================================ helpers
def outline(sk, d, z):
    """Body plan outline offset by d (outside > 0) on an XY sketch at height z."""
    L.rounded_poly(sk, [(-(H + d), Y0 - d), (H + d, Y0 - d), (H + d, Y1 + d), (-(H + d), Y1 + d)], R + d, z)


def sdf(x, y):
    """Signed distance (mm) from the body plan outline, outside > 0."""
    cy, hy = (Y0 + Y1) / 2, (Y1 - Y0) / 2
    qx, qy = abs(x) - (H - R), abs(y - cy) - (hy - R)
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - R


def ring(c, B, d_out, d_in, z0, z1, name):
    """Band between two outline offsets, extruded z0 -> z1 (joined to B, or a new body if B is None)."""
    sk = L.sketch(c, L.plane_xy(c, z0), name)
    outline(sk, d_out, z0)
    outline(sk, d_in, z0)
    L.done(sk)
    prof = L.profiles_at(sk, [(0, Y0 - (d_out + d_in) / 2, z0)])
    return L.extrude(c, sk, prof, z1 - z0, L.JOIN if B else L.NEW, (0, 0, 1), B, name)


def u_slot(sk, xf, yc, zc, w, ztop):
    """U-shaped slot on a YZ sketch at x = xf: round bottom at (yc, zc), open up to ztop."""
    r = w / 2.0
    L.rounded_poly(sk, [(yc - r, zc - r), (yc + r, zc - r), (yc + r, ztop), (yc - r, ztop)], [r - 0.01, r - 0.01, 0, 0], plane='yz', fixed=xf)


def us_pt(x, y, z):
    """Ultrasonic board frame -> robot (board centre at (0, US_UNDER_Y, US_CZ), top tilted back by US_TILT)."""
    return (x, P.US_UNDER_Y - y * SIN5 - z * COS5, P.US_CZ + y * COS5 - z * SIN5)


def combine_all(c, body, name='Combine'):
    rest = [b for b in c.bRepBodies if b.name != body.name and not b.name.endswith('inlay')]
    if rest:
        tools = adsk.core.ObjectCollection.create()
        for b in rest:
            tools.add(b)
        c.features.combineFeatures.add(c.features.combineFeatures.createInput(body, tools)).name = name


def compose(outer, inner):
    """Matrix that applies `inner` first, then `outer`."""
    m = inner.copy()
    m.transformBy(outer)
    return m


def rot_z_about(px, py, deg):
    a = math.radians(deg)
    c_, s_ = math.cos(a), math.sin(a)
    return L.matrix([(c_, s_, 0), (-s_, c_, 0), (0, 0, 1)], (px - (c_ * px - s_ * py), py - (s_ * px + c_ * py), 0))


def chassis():
    occ = L.find_occurrence('Chassis')
    c = occ.component
    return occ, c, [L.body_by_name(c, 'Chassis')]


# =============================================================== chassis
def chassis_shell():
    """Floor, perimeter wall, rail lip (45-degree underside) and the thickened hole band."""
    L.delete_component('Chassis')
    occ = L.new_component('Chassis')
    c = occ.component
    z0, fz = P.FLOOR_Z0, P.FZ
    sk = L.sketch(c, L.plane_xy(c, z0), 'Floor')
    outline(sk, 0, z0)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), P.FLOOR_T, L.NEW, (0, 0, 1), name='Floor').bodies.item(0)
    body.name = 'Chassis'
    B = [body]
    ring(c, B, 0, -P.SKIN_T, fz, P.BODY_TOP, 'Perimeter wall')
    # rail lip: 3 mm out, flat 50..52, 45-degree underside 47..50 (prints without supports)
    ring(c, B, P.RAIL_OUT, 0, P.RAIL_Z[0], P.BODY_TOP, 'Rail lip')
    e = L.edges_where(body, lambda x, y, z: abs(z - P.RAIL_Z[0]) < 0.05 and abs(sdf(x, y) - P.RAIL_OUT) < 0.1)
    n1 = L.chamfer(c, e, P.RAIL_OUT - 0.05, 'Rail underside 45')
    # wall thickened to 6 mm behind the hole row (LEGO pins grip both ends), 45-degree underside
    bz0 = P.HOLE_BAND[0] - (P.HOLE_BAND_T - P.SKIN_T)
    ring(c, B, -P.SKIN_T, -P.HOLE_BAND_T, bz0, P.HOLE_BAND[1], 'Hole band')
    wx0, wx1, wy0, wy1 = P.WELL
    for s, _ in S(1):
        x0, x1 = xs(s, wx0 - 1.0, wx1)
        L.box(c, x0, wy0, bz0 - 1, x1, wy1, P.HOLE_BAND[1] + 0.5, L.CUT, B, 'Band cut at well')
    L.box(c, -P.TOWER_X[0], Y1 - P.HOLE_BAND_T - 0.5, bz0 - 1, P.TOWER_X[0], Y1 - P.SKIN_T, P.HOLE_BAND[1] + 0.5, L.CUT, B, 'Band cut at eyes')
    e = L.edges_where(body, lambda x, y, z: abs(z - bz0) < 0.05 and abs(sdf(x, y) + P.HOLE_BAND_T) < 0.1)
    n2 = L.chamfer(c, e, P.HOLE_BAND_T - P.SKIN_T - 0.05, 'Hole band 45')
    return '%d rail edges, %d band edges chamfered' % (n1, n2)


def chassis_cradle():
    """Wheel wells, motor cradles (inner wall, shaft wall, rails, end wall), battery bay."""
    occ, c, B = chassis()
    z0, fz = P.FLOOR_Z0, P.FZ
    wx0, wx1, wy0, wy1 = P.WELL
    for s, _ in S(1):
        x0, x1 = xs(s, wx0, wx1)
        L.box(c, x0, wy0, z0 - 1, x1, wy1, fz + 0.5, L.CUT, B, 'Wheel well')
        # well end walls tie the outer wall to the cradle; shaft wall between motor and wheel
        x0, x1 = xs(s, P.WELL_END_X0, wx1)
        L.box(c, x0, wy1, fz, x1, wy1 + 3.0, P.SHAFT_WALL_TOP, L.JOIN, B, 'Well end wall')
        L.box(c, x0, wy0 - 3.0, fz, x1, wy0, P.SHAFT_WALL_TOP, L.JOIN, B, 'Well end wall')
        x0, x1 = xs(s, *P.SHAFT_WALL)
        L.box(c, x0, P.SHAFT_WALL_Y[0], fz, x1, P.SHAFT_WALL_Y[1], P.SHAFT_WALL_TOP, L.JOIN, B, 'Shaft wall')
        x0, x1 = xs(s, P.MOTOR_IN - P.WALL_T, P.MOTOR_IN)
        L.box(c, x0, P.WALL_Y[0], fz, x1, P.WALL_Y[1], P.INNER_TOP, L.JOIN, B, 'Inner wall')
        for (a, b) in P.CRADLE_RAILS:
            x0, x1 = xs(s, a, b)
            L.box(c, x0, P.CRADLE_RAIL_Y[0], fz, x1, P.CRADLE_RAIL_Y[1], P.MOTOR_BOTTOM - 0.25, L.JOIN, B, 'Cradle rail')
        x0, x1 = xs(s, P.MOTOR_IN, P.SHAFT_WALL[0])
        L.box(c, x0, P.CRADLE_END_Y[0], fz, x1, P.CRADLE_END_Y[1], P.INNER_TOP, L.JOIN, B, 'Cradle end wall')
    # battery bay: opening for the bottom door, side ribs, rear stop
    sk = L.sketch(c, L.plane_xy(c, z0 - 1), 'Battery opening')
    L.rounded_poly(sk, [(-P.BAY_HALF, P.BAY_Y[0]), (P.BAY_HALF, P.BAY_Y[0]), (P.BAY_HALF, P.BAY_Y[1]), (-P.BAY_HALF, P.BAY_Y[1])], 2.0, z0 - 1)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.FLOOR_T + 2, L.CUT, (0, 0, 1), B, 'Battery opening')
    for s, _ in S(1):
        x0, x1 = xs(s, P.PACK_RIB_X, P.MOTOR_IN - P.WALL_T)
        for y in P.PACK_RIB_Y:
            L.box(c, x0, y - 1.0, fz, x1, y + 1.0, P.PACK_RIB_TOP, L.JOIN, B, 'Pack rib')
    # ballast rack behind the pack: rear stop for the pack, roof over the door hinge slots, and slots
    # for 4 x M8 nuts that balance the arm module; a channel down the middle for the battery lead
    bx = P.BALLAST_HALF
    L.box(c, -bx, Y0 + P.SKIN_T - 0.1, fz, bx, P.BAY_Y[0], P.BALLAST_TOP, L.JOIN, B, 'Ballast rack')
    sw, sd = P.BALLAST_SLOT
    for x in P.BALLAST_X:
        L.box(c, x - sw / 2, P.BALLAST_Y[0], P.BALLAST_Z0, x + sw / 2, P.BALLAST_Y[1], P.BALLAST_TOP + 0.5, L.CUT, B, 'Nut slot')
    L.box(c, -P.LEAD_CHANNEL, Y0 + P.SKIN_T - 0.5, fz, P.LEAD_CHANNEL, P.BAY_Y[0] + 0.5, P.BALLAST_TOP + 0.5, L.CUT, B, 'Lead channel')
    return occ


def _wedge(c, B, s, y0, y1, x_inner):
    """45-degree corbel on an inner wall: carries a board pillar / holds the pack down."""
    xw = s * (P.MOTOR_IN - P.WALL_T)
    xi = s * x_inner
    zt = P.LUG_TOP
    zb = zt - abs(xw - xi)
    sk = L.sketch(c, L.plane_xz(c, y0), 'Wedge')
    L.poly(sk, [(xw, y0, zb), (xw, y0, zt), (xi, y0, zt)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), y1 - y0, L.JOIN, (0, 1, 0), B, 'Wedge')


def chassis_front():
    """Front block over the sled pocket, dock towers with the ultrasonic grooves, board pillars, eyes."""
    occ, c, B = chassis()
    z0, fz = P.FLOOR_Z0, P.FZ
    nh = P.NOSE_HALF
    L.box(c, -nh, P.NOSE_Y[0], fz, nh, P.NOSE_Y[1], P.NOSE_TOP, L.JOIN, B, 'Front block')
    fs = P.FRONT_STOP
    L.box(c, -fs[2], fs[0], fz, fs[2], fs[1], fs[3], L.JOIN, B, 'Pack front stop')
    L.box(c, -P.DOOR_TAB[0] - 2.2, fs[0], fz, P.DOOR_TAB[0] + 2.2, P.NOSE_Y[0] + 0.5, fz + 3.0, L.JOIN, B, 'Floor over door tab')
    for s, _ in S(1):
        x0, x1 = xs(s, *P.TOWER_X)
        L.box(c, x0, P.TOWER_Y[0], P.NOSE_TOP, x1, P.TOWER_Y[1], P.BODY_TOP, L.JOIN, B, 'Dock tower')
    # board pillars: front ones on the front block (webbed to the inner wall), rear ones on 45-degree wedges
    front = [hp for hp in P.BOARD_HOLES if hp[1] > 0]
    rear = [hp for hp in P.BOARD_HOLES if hp[1] < 0]
    L.cyl_z(c, front, P.PILLAR_D, P.NOSE_TOP, P.BOARD_Z, L.JOIN, B, 'Board pillar front')
    for (x, y) in front:
        s = 1 if x > 0 else -1
        x0, x1 = xs(s, abs(x), P.MOTOR_IN - P.WALL_T + 0.5)
        L.box(c, x0, y - 2.0, P.NOSE_TOP, x1, y + 2.0, P.INNER_TOP, L.JOIN, B, 'Pillar web')
    for (x, y) in rear:
        s = 1 if x > 0 else -1
        _wedge(c, B, s, y - P.PILLAR_D / 2, y + P.PILLAR_D / 2, abs(x) - P.PILLAR_D / 2 - 0.2)
    L.cyl_z(c, rear, P.PILLAR_D, P.LUG_TOP, P.BOARD_Z, L.JOIN, B, 'Board pillar rear')
    for (ya, yb) in P.HOLD_LUGS[1:]:
        for s, _ in S(1):
            _wedge(c, B, s, ya, yb, P.PACK_RIB_X - 1.5)

    # line-sensor pocket, open below only (its 28.5 mm ceiling bridges front to back)
    ph, py0, py1, pz = P.NOSE_POCKET
    L.box(c, -ph, py0, z0 - 1, ph, py1, pz, L.CUT, B, 'Sled pocket')
    by0, by1 = P.SLED_BUMP_Y
    for s, _ in S(1):
        x0, x1 = xs(s, ph - 0.5, ph + 0.8)
        L.box(c, x0, by0 - 1.0, 12.2, x1, by1 + 1.0, 13.9, L.CUT, B, 'Sled snap groove')
    # LED windows and the JST SH pass-through in the deck
    lx, ly = P.LINE_C
    w, hh = P.LINE_LED_WIN
    yl = ly + P.LINE_LED_DY
    zc = pz - 0.5
    sk = L.sketch(c, L.plane_xy(c, zc), 'LED windows')
    for x in P.LINE_LEDS:
        L.rounded_poly(sk, [(x - w / 2, yl - hh / 2), (x + w / 2, yl - hh / 2), (x + w / 2, yl + hh / 2), (x - w / 2, yl + hh / 2)], 1.2, zc)
    px, pdy, pw, phh = P.LINE_PLUG
    yp = ly + pdy
    L.rounded_poly(sk, [(px - pw / 2, yp - phh / 2), (px + pw / 2, yp - phh / 2), (px + pw / 2, yp + phh / 2), (px - pw / 2, yp + phh / 2)], 1.5, zc)
    L.done(sk)
    probes = [(x, yl, zc) for x in P.LINE_LEDS] + [(px, yp, zc)]
    L.extrude(c, sk, L.profiles_at(sk, probes), P.NOSE_TOP - zc + 1, L.CUT, (0, 0, 1), B, 'LED windows')

    # ultrasonic: its board slides down tilted grooves in the tower faces and stands on their bottoms
    for s, _ in S(1):
        xf = s * P.TOWER_X[0]
        sk = L.sketch(c, L.plane_yz(c, xf), 'Ultrasonic groove')
        pts = [us_pt(xf, y, z) for (y, z) in ((-P.US_PCB[1] / 2, -0.15), (25.0, -0.15), (25.0, P.US_PCB[2] + 0.15), (-P.US_PCB[1] / 2, P.US_PCB[2] + 0.15))]
        L.poly(sk, [(xf, py, pz_) for (_, py, pz_) in pts])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.US_GROOVE_DEPTH, L.CUT, (s, 0, 0), B, 'Ultrasonic groove')
    # M3 inserts in the tower tops (arm base or dock cap)
    L.cyl_z(c, P.DOCK_INSERTS, P.INSERT_M3_D, P.BODY_TOP, P.BODY_TOP - P.INSERT_M3_DEPTH, L.CUT, B, 'Dock inserts')
    # eyes in the front wall on the transducer axes, 45-degree bevel
    ey = Y1 - P.SKIN_T / 2
    t = (ey - P.US_UNDER_Y) / COS5
    ez = P.US_CZ + t * SIN5
    cans = [(-P.US_CAN_X, ez), (P.US_CAN_X, ez)]
    sk = L.sketch(c, L.plane_xz(c, Y1 - P.SKIN_T), 'Eyes')
    for (x, z) in cans:
        L.circle(sk, x, Y1 - P.SKIN_T, z, P.EYE_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, Y1 - P.SKIN_T, z) for (x, z) in cans]), P.SKIN_T + 1.0, L.CUT, (0, 1, 0), B, 'Eye holes')
    body = B[0]
    e = L.edges_where(body, lambda x, y, z: abs(y - Y1) < 0.05 and min(abs(math.hypot(x - cx, z - cz) - P.EYE_D / 2) for (cx, cz) in cans) < 0.2)
    n = L.chamfer(c, e, P.EYE_BEVEL, 'Eye bevel')
    return 'eye centre z %.2f, %d bevel edges' % (ez, n)


def chassis_holes():
    """Inserts, caster mount, door features, motor latches, shaft-wall slots, saddles, windows in the floor."""
    occ, c, B = chassis()
    z0, fz = P.FLOOR_Z0, P.FZ
    # board pillar inserts (M2)
    L.cyl_z(c, P.BOARD_HOLES, P.INSERT_M2_D, P.BOARD_Z, P.BOARD_Z - P.INSERT_M2_DEPTH, L.CUT, B, 'Board inserts')
    # battery door: front tab rebate + thumb-screw insert, rear hinge slots
    th, ty0, ty1 = P.DOOR_TAB
    L.box(c, -th, ty0 - 0.5, z0 - 1, th, ty1, P.DOOR_TOP, L.CUT, B, 'Door tab rebate')
    L.cyl_z(c, [(0, P.DOOR_SCREW_Y)], P.INSERT_M3_D, P.DOOR_TOP, P.DOOR_TOP + 4.5, L.CUT, B, 'Door screw insert')
    tl, tz0, tz1 = P.DOOR_TONGUE
    for (a, b) in P.DOOR_TONGUES:
        for s, _ in S(1):
            x0, x1 = xs(s, a - 0.4, b + 0.4)
            L.box(c, x0, P.BAY_Y[0] - tl - 0.3, tz0 - 0.1, x1, P.BAY_Y[0] + 0.5, tz1 + 0.1, L.CUT, B, 'Door hinge slot')

    xi, xo = P.MOTOR_IN - P.WALL_T, P.MOTOR_IN
    for s, _ in S(1):
        # snap latches: slit tongues in the inner wall with a 45-degree lead-in hook over the motor
        for y in P.LATCH_Y:
            ya, yb = y - P.LATCH_W / 2, y + P.LATCH_W / 2
            x0, x1 = xs(s, xi - 0.1, xo + 0.1)
            L.box(c, x0, ya - P.LATCH_SLIT, P.LATCH_Z0, x1, ya, P.INNER_TOP + 0.1, L.CUT, B, 'Latch slit')
            L.box(c, x0, yb, P.LATCH_Z0, x1, yb + P.LATCH_SLIT, P.INNER_TOP + 0.1, L.CUT, B, 'Latch slit')
            x0, x1 = xs(s, xi - 0.1, xo - P.LATCH_T)
            L.box(c, x0, ya, P.LATCH_Z0, x1, yb, P.INNER_TOP + 0.1, L.CUT, B, 'Latch tongue')
            zt = P.MOTOR_TOP + 0.15
            sk = L.sketch(c, L.plane_xz(c, ya), 'Latch hook')
            L.poly(sk, [(s * xo, ya, zt), (s * (xo + P.LATCH_HOOK), ya, zt), (s * (xo + P.LATCH_HOOK), ya, zt + 0.6),
                        (s * xo, ya, P.INNER_TOP)])
            L.done(sk)
            L.extrude(c, sk, L.all_profiles(sk), P.LATCH_W, L.JOIN, (0, 1, 0), B, 'Latch hook')
        # relief for the round motor can (bulges 2.3 mm past the gearbox face)
        wy0, wy1, wz0, wz1 = P.WALL_WINDOW
        x0, x1 = xs(s, xi - 0.1, xo + 1.0)
        L.box(c, x0, wy0, wz0, x1, wy1, wz1, L.CUT, B, 'Motor can relief')
        # cable saddles in the inner-wall tops
        for y in P.SADDLES_Y:
            L.box(c, x0, y - P.SADDLE[0] / 2, P.INNER_TOP - P.SADDLE[1], x1, y + P.SADDLE[0] / 2, P.INNER_TOP + 0.1, L.CUT, B, 'Cable saddle')
        # shaft wall: U-slot for the shaft, groove for the boss ring, through-slot for the locating pin
        xm = s * (P.SHAFT_WALL[0] - 0.1)
        sk = L.sketch(c, L.plane_yz(c, xm), 'Shaft slot')
        u_slot(sk, xm, 0.0, P.AXLE_Z, P.SHAFT_SLOT, P.SHAFT_WALL_TOP + 1)
        u_slot(sk, xm, P.M_PIN_Y, P.AXLE_Z, P.PIN_SLOT, P.SHAFT_WALL_TOP + 1)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.SHAFT_WALL[1] - P.SHAFT_WALL[0] + 0.3, L.CUT, (s, 0, 0), B, 'Shaft and pin slots')
        sk = L.sketch(c, L.plane_yz(c, xm), 'Boss groove')
        u_slot(sk, xm, 0.0, P.AXLE_Z, P.BOSS_GROOVE[0], P.SHAFT_WALL_TOP + 1)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.BOSS_GROOVE[1] + 0.1, L.CUT, (s, 0, 0), B, 'Boss groove')
        # window in the floor under each motor (open architecture, see the gearbox from below)
        sk = L.sketch(c, L.plane_xy(c, z0 - 0.5), 'Floor window')
        x0, x1 = xs(s, 42.5, 50.0)
        L.rounded_poly(sk, [(x0, -46.0), (x1, -46.0), (x1, 4.0), (x0, 4.0)], 3.0, z0 - 0.5)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.FLOOR_T + 1.0, L.CUT, (0, 0, 1), B, 'Floor window')
    # zip-tie slot pairs (strain relief for the fragile JST SH plugs)
    sk = L.sketch(c, L.plane_xy(c, z0 - 0.5), 'Zip-tie slots')
    probes = []
    for (x, y) in P.TIE_SLOTS:
        for dx in (-3.0, 3.0):
            L.rect(sk, x + dx - 0.9, y - 1.5, x + dx + 0.9, y + 1.5, z0 - 0.5)
            probes.append((x + dx, y, z0 - 0.5))
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, probes), P.FLOOR_T + 1.0, L.CUT, (0, 0, 1), B, 'Zip-tie slots')
    return occ


def bus_positions():
    """Hole-row and detent positions on the 8 mm grid: [(x, y, outward normal)]."""
    holes, detents = [], []
    for s, _ in S(1):
        for y in P.HOLES_SIDE_Y:
            holes.append((s * H, y, (s, 0)))
        for k in range(14):
            detents.append((s * (H + P.RAIL_OUT), -62.0 + 8.0 * k, (s, 0)))
    for x in P.HOLES_REAR_X:
        holes.append((x, Y0, (0, -1)))
    for x in P.HOLES_FRONT_X:
        holes.append((x, Y1, (0, 1)))
    for k in range(-7, 8):
        detents.append((8.0 * k, Y0 - P.RAIL_OUT, (0, -1)))
        detents.append((8.0 * k, Y1 + P.RAIL_OUT, (0, 1)))
    return holes, detents


def chassis_bus():
    """Expansion bus: the 8 mm hole row through the walls."""
    occ, c, B = chassis()
    holes, detents = bus_positions()
    depth = P.HOLE_BAND_T + 1.0
    # hole row: one sketch per wall
    for (axis, val, sel) in (('x', H + 0.5, lambda h: h[2] == (1, 0)), ('x', -H - 0.5, lambda h: h[2] == (-1, 0)),
                             ('y', Y0 - 0.5, lambda h: h[2] == (0, -1)), ('y', Y1 + 0.5, lambda h: h[2] == (0, 1))):
        hs = [h for h in holes if sel(h)]
        if axis == 'x':
            sk = L.sketch(c, L.plane_yz(c, val), 'Hole row')
            pts = [(val, h[1], P.HOLE_Z) for h in hs]
        else:
            sk = L.sketch(c, L.plane_xz(c, val), 'Hole row')
            pts = [(h[0], val, P.HOLE_Z) for h in hs]
        for p in pts:
            L.circle(sk, p[0], p[1], p[2], P.HOLE_D)
        L.done(sk)
        n = hs[0][2]
        L.extrude(c, sk, L.profiles_at(sk, pts), depth, L.CUT, (-n[0], -n[1], 0), B, 'Hole row')
    return '%d holes' % len(holes)


def chassis_detents():
    """V-detents in the rail lip: a clip's bump clicks in every 8 mm."""
    occ, c, B = chassis()
    for sk in list(c.sketches):
        if sk.name.startswith('Rail detents') and sk.profiles.count and not any(
                f.name.startswith('Rail detents') for f in c.features.extrudeFeatures):
            sk.deleteMe()
    holes, detents = bus_positions()
    zb = P.RAIL_Z[0] - 0.5
    sk = L.sketch(c, L.plane_xy(c, zb), 'Rail detents')
    dw, dd = P.DETENT
    probes = []
    for (x, y, (nx, ny)) in detents:
        tx, ty = -ny, nx
        k = dw / 2 / dd * (dd + 0.5)
        apex = (x - nx * dd, y - ny * dd)
        a = (x + nx * 0.5 + tx * k, y + ny * 0.5 + ty * k)
        b = (x + nx * 0.5 - tx * k, y + ny * 0.5 - ty * k)
        L.poly(sk, [(apex[0], apex[1], zb), (a[0], a[1], zb), (b[0], b[1], zb)])
        probes.append(((apex[0] + a[0] + b[0]) / 3, (apex[1] + a[1] + b[1]) / 3, zb))
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.BODY_TOP - zb + 0.5, L.CUT, (0, 0, 1), B, 'Rail detents')
    return '%d detents' % len(detents)


def chassis_finish():
    """Diamond windows, logos, bed chamfer."""
    occ, c, B = chassis()
    # diamond windows (45-degree sides) through the outer wall only
    zc = (P.WIN_Z[0] + P.WIN_Z[1]) / 2
    hw = (P.WIN_Z[1] - P.WIN_Z[0]) / 2
    for s, _ in S(1):
        xf = s * (H + 0.5)
        sk = L.sketch(c, L.plane_yz(c, xf), 'Side windows')
        for y in P.SIDE_WIN_Y:
            L.poly(sk, [(xf, y, zc - hw), (xf, y + hw, zc), (xf, y, zc + hw), (xf, y - hw, zc)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.SKIN_T + 0.5, L.CUT, (-s, 0, 0), B, 'Side windows')
    for (yf, nrm, xs_) in ((Y0 - 0.5, 1, P.REAR_WIN_X), (Y1 + 0.5, -1, P.FRONT_WIN_X)):
        sk = L.sketch(c, L.plane_xz(c, yf), 'End windows')
        for x in xs_:
            L.poly(sk, [(x, yf, zc - hw), (x + hw, yf, zc), (x, yf, zc + hw), (x - hw, yf, zc)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.SKIN_T + 0.5, L.CUT, (0, nrm, 0), B, 'End windows')
    # logos: Plastal-Bot on the rear (reads from behind), RoboCore on the front under the eyes
    import json
    w, zc_ = P.LOGO_PB
    d = json.load(open(P.ART_DIR + '/plastalbot.json'))
    hh = d['height'] * w / d['width']
    L.logo(c, P.ART_DIR + '/plastalbot.json', lambda u, v: (u - w / 2, Y0, zc_ + hh / 2 - v), w, P.DEBOSS, (0, 1, 0), B, 'Plastal-Bot logo')
    w, zc_ = P.LOGO_RC
    d = json.load(open(P.ART_DIR + '/robocore.json'))
    hh = d['height'] * w / d['width']
    L.logo(c, P.ART_DIR + '/robocore.json', lambda u, v: (w / 2 - u, Y1, zc_ + hh / 2 - v), w, P.DEBOSS, (0, -1, 0), B, 'Front logo')
    n = L.bed_chamfer(c, B[0], 'z', P.FLOOR_Z0, -1, 0.5, 'Bed chamfer')
    return 'bed chamfer %d edges' % n


# ================================================================ line sled
def build_sled(under=None, name='Line sled'):
    """Carrier for the line-sensor board: pushed up into the nose pocket, clicks in with two bumps.
    The board slides into the rail grooves from the open rear end; the skid runs forward under the nose."""
    under = P.LINE_UNDER_Z if under is None else under
    L.delete_component(name)
    occ = L.new_component(name)
    c = occ.component
    ph, py0, py1, pz = P.NOSE_POCKET
    ri, ro = P.SLED_RAIL
    ztop = pz - 0.3
    zb = under - 1.6
    zs = under - P.SLED_SKID_DZ
    yb0, yb1 = py1 - 2.5, py1 - 0.3            # front bar inside the pocket
    # front bar + skid (the skid runs on under the front block to the robot's nose)
    body = L.box(c, -ro, yb0, zb, ro, yb1, ztop, L.NEW, None, 'Front bar').bodies.item(0)
    body.name = name
    B = [body]
    L.box(c, -ro, yb0, zs, ro, Y1, P.FLOOR_Z0 - 0.3, L.JOIN, B, 'Skid')
    for s, _ in S(1):
        x0, x1 = xs(s, ri, ro)
        L.box(c, x0, py0 + 1.5, zb, x1, yb0, ztop, L.JOIN, B, 'Rail')
    # board grooves (open at the rear), stop just in front of the board
    for s, _ in S(1):
        x0, x1 = xs(s, ri - 0.1, P.LINE_BOARD[0] / 2 + 0.4)
        L.box(c, x0, py0, under - 0.1, x1, P.LINE_C[1] + P.LINE_BOARD[1] / 2 + 0.1, under + P.LINE_BOARD[2] + 0.15, L.CUT, B, 'Board groove')
    # snap bumps (45-degree faces) on the rail rear ends
    by0, by1 = P.SLED_BUMP_Y
    for s, _ in S(1):
        sk = L.sketch(c, L.plane_xz(c, by0), 'Snap bump')
        L.poly(sk, [(s * ro, by0, 12.4), (s * (ro + 0.7), by0, 13.1), (s * (ro + 0.7), by0, 13.3), (s * ro, by0, 14.0)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), by1 - by0, L.JOIN, (0, 1, 0), B, 'Snap bump')
    # skid: 45-degree chamfers front and back so it slides over bumps
    e = L.edges_where(body, lambda x, y, z: abs(z - zs) < 0.05 and (abs(y - Y1) < 0.05 or abs(y - yb0) < 0.05))
    L.chamfer(c, e, 2.5, 'Skid chamfer')
    L.bed_chamfer(c, body, 'z', ztop, 1, 0.4, 'Bed chamfer')
    return occ


# ====================================================== battery door, spacer
def build_door():
    """Battery door with the caster cup: hooks in at the back, one thumb screw at the front.
    Prints top face down (the cup points up), so the hinge tongues are flush with the top face."""
    L.delete_component('Battery door')
    occ = L.new_component('Battery door')
    c = occ.component
    g = P.DOOR_GAP
    bh, (by0, by1) = P.BAY_HALF - g, P.BAY_Y
    th, ty0, ty1 = P.DOOR_TAB
    z0, zt = P.FLOOR_Z0, P.DOOR_TOP
    sk = L.sketch(c, L.plane_xy(c, z0), 'Door')
    L.rounded_poly(sk, [(-bh, by0 + g), (bh, by0 + g), (bh, by1 - g), (-bh, by1 - g)], 1.7, z0)
    L.rounded_poly(sk, [(-th + g, by1 - 3), (th - g, by1 - 3), (th - g, ty1 - g), (-th + g, ty1 - g)], [0, 0, 1.5, 1.5], z0)
    L.done(sk)
    f = L.extrude(c, sk, L.profiles_at(sk, [(0, 0, z0), (0, by1 - 1.5, z0), (0, (by1 + ty1) / 2, z0)]), zt - z0, L.NEW, (0, 0, 1), name='Door')
    body = f.bodies.item(0)
    body.name = 'Battery door'
    combine_all(c, body)
    B = [body]
    tl, tz0, tz1 = P.DOOR_TONGUE
    for (a, b) in P.DOOR_TONGUES:
        for s, _ in S(1):
            x0, x1 = xs(s, a, b)
            L.box(c, x0, by0 + g - tl, tz0, x1, by0 + g + 1.0, tz1, L.JOIN, B, 'Hinge tongue')
    L.cyl_z(c, [(0, P.DOOR_SCREW_Y)], 3.4, z0 - 0.5, zt + 0.5, L.CUT, B, 'Thumb screw hole')
    # caster cup under the door: the ball snaps in past four slits and turns 0.3 mm under the pack
    cy, rb = P.CASTER_Y, P.BALL_D / 2
    L.cyl_z(c, [(0, cy)], P.CASTER_CUP_D, P.CASTER_LIP_Z, z0 + 0.1, L.JOIN, B, 'Caster cup')
    sk = L.sketch(c, c.yZConstructionPlane, 'Ball cavity')
    rr = rb + 0.2
    arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, 0, cy, rb), L.sp(sk, 0, cy, rb + rr), math.pi)
    ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
    L.done(sk)
    L.revolve(c, L.all_profiles(sk), ax, L.CUT, B, 'Ball cavity')
    L.cyl_z(c, [(0, cy)], 4.0, zt - 0.6, zt + 0.5, L.CUT, B, 'Ball top relief')
    for ang in (0, 90):
        sk = L.sketch(c, L.plane_xy(c, P.CASTER_LIP_Z - 0.5), 'Slit')
        a = math.radians(ang)
        ux, uy = math.cos(a), math.sin(a)
        w, l = 0.6, P.CASTER_CUP_D / 2 + 1
        pts = [(-ux * l - uy * w, cy - uy * l + ux * w), (ux * l - uy * w, cy + uy * l + ux * w),
               (ux * l + uy * w, cy + uy * l - ux * w), (-ux * l + uy * w, cy - uy * l - ux * w)]
        L.poly(sk, [(x, y, P.CASTER_LIP_Z - 0.5) for (x, y) in pts])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), 5.5, L.CUT, (0, 0, 1), B, 'Slit')
    L.bed_chamfer(c, body, 'z', zt, 1, 0.4, 'Bed chamfer')
    try:
        L.text_deboss(c, L.plane_xy(c, z0), '1S Li-ion  4.2 V max', 3.5, (0, -12, z0), (-1, 0, 0), (0, 1, 0), 0.5, (0, 0, 1), B, 'Door marking', 'Arial')
    except Exception as e:
        L.app.log('door text failed: %s' % e)
    return occ


def build_spacer():
    """1S2P spacer: fills the gap beside a 38 mm wide 1S2P pack. Two U-shaped halves, joined by a bridge
    that passes over the chassis front stop."""
    L.delete_component('1S2P spacer')
    occ = L.new_component('1S2P spacer')
    c = occ.component
    zt0, zt1 = P.DOOR_TOP, P.SPACER_TOP
    ya, yb = P.PACK_Y[0] + 0.5, P.PACK_Y[1]
    xi, xo = P.SPACER_IN, P.PACK_RIB_X - 0.3
    fs = P.FRONT_STOP
    zb = fs[3] + 3.0
    halves = []
    for s, _ in S(1):
        x0, x1 = xs(s, xi, xi + 2.0)
        h = L.box(c, x0, ya, zt0, x1, fs[0] - 0.3, zb, L.NEW, None, 'Spacer inner').bodies.item(0)
        x0, x1 = xs(s, xi, xo)
        L.box(c, x0, ya, zt0, x1, ya + 2.0, zt1, L.JOIN, [h], 'Spacer outer')
        for y in (-50.0, -20.0, 0.0):
            L.box(c, x0, y - 1.0, zt0, x1, y + 1.0, zt1, L.JOIN, [h], 'Spacer rib')
        L.box(c, x0, yb - 2.0, zt0, x1, fs[0] - 2.0, zt1, L.JOIN, [h], 'Spacer outer')
        halves.append(h)
    L.box(c, -xi - 2.0, yb + 0.1, fs[3] + 0.5, xi + 2.0, fs[1] + 2.0, zb, L.JOIN, halves, 'Spacer bridge')
    body = c.bRepBodies.item(0)
    combine_all(c, body, 'Spacer combine')
    c.bRepBodies.item(0).name = '1S2P spacer'
    occ.isLightBulbOn = False          # alternative to the 1S3P pack: shown only when needed
    return '%d body' % c.bRepBodies.count


# ================================================================= wheel
def build_wheel():
    L.delete_component('Wheel')
    occ = L.new_component('Wheel')
    c = occ.component
    sk = L.sketch(c, c.xZConstructionPlane, 'Wheel section')
    fl0, fl1 = P.RIM_Z0, P.RIM_Z0 + 2 * P.FLANGE_T + P.TYRE_W
    rs, rf, ri = P.TYRE_SEAT_D / 2, P.FLANGE_D / 2, P.RIM_IN_R
    hr = P.HUB_D / 2
    wz1 = P.WEB_Z0 + P.WEB_T
    zc = (fl0 + fl1) / 2
    sec = [(0, fl0), (rf, fl0), (rf, fl0 + P.FLANGE_T), (rs, fl0 + P.FLANGE_T),
           (rs, zc - 1.0), (rs + 0.6, zc - 0.4), (rs + 0.6, zc + 0.4), (rs, zc + 1.0),   # retaining bead
           # outer lip: 45-degree underside so the wheel prints flat-face-down without supports
           (rs, fl1 - P.FLANGE_T), (rf, fl1 - P.FLANGE_T + (rf - rs)), (rf, fl1 + (rf - rs)), (ri, fl1 + (rf - rs)), (ri, wz1), (hr, wz1),
           (hr, P.HUB_LEN), (0, P.HUB_LEN)]
    L.poly(sk, [(r, 0, z) for (r, z) in sec])
    L.done(sk)
    body = L.revolve(c, L.all_profiles(sk), c.zConstructionAxis, L.NEW, name='Wheel').bodies.item(0)
    body.name = 'Wheel'
    B = [body]
    # RoboCore gear (9 teeth) raised on the outer face of the web, round the hub
    zg = wz1
    sk = L.sketch(c, L.plane_xy(c, zg), 'Hub gear')
    pts = []
    n = P.GEAR_TEETH
    for k in range(n):
        a = math.pi / 2 + 2 * math.pi * k / n
        for (da, rr) in ((-0.21, P.GEAR_R_ROOT), (-0.12, P.GEAR_R_TIP), (0.12, P.GEAR_R_TIP), (0.21, P.GEAR_R_ROOT)):
            pts.append((rr * math.cos(a + da), rr * math.sin(a + da), zg))
    L.poly(sk, pts)
    L.circle(sk, 0, 0, zg, 2 * P.GEAR_R_IN)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(0, (P.GEAR_R_IN + P.GEAR_R_ROOT) / 2, zg)]), P.GEAR_H, L.JOIN, (0, 0, 1), B, 'Hub gear')
    # double-D bore
    sk = L.sketch(c, c.xYConstructionPlane, 'Bore')
    r = P.BORE_D / 2
    fx = P.BORE_FLAT / 2
    dy = math.sqrt(r * r - fx * fx)
    arcs = sk.sketchCurves.sketchArcs
    lines = sk.sketchCurves.sketchLines
    l1 = lines.addByTwoPoints(L.sp(sk, dy, fx, 0), L.sp(sk, -dy, fx, 0))
    l2 = lines.addByTwoPoints(L.sp(sk, -dy, -fx, 0), L.sp(sk, dy, -fx, 0))
    arcs.addByThreePoints(l1.endSketchPoint, L.sp(sk, -r, 0, 0), l2.startSketchPoint)
    arcs.addByThreePoints(l2.endSketchPoint, L.sp(sk, r, 0, 0), l1.startSketchPoint)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.RIM_Z0 + P.BORE_DEPTH, L.CUT, (0, 0, 1), B, 'Shaft bore')
    sk = L.sketch(c, c.xYConstructionPlane, 'Screw hole')
    L.circle(sk, 0, 0, 0, P.WHEEL_SCREW_D)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.HUB_LEN + 1, L.CUT, (0, 0, 1), B, 'Screw hole')
    # lightening holes between the gear tips and the rim, one between each pair of teeth
    sk = L.sketch(c, L.plane_xy(c, P.WEB_Z0 - 0.5), 'Lightening holes')
    pts = []
    for k in range(P.LIGHT_N):
        a = math.pi / 2 + math.pi / P.LIGHT_N + 2 * math.pi * k / P.LIGHT_N
        pts.append((P.LIGHT_R * math.cos(a), P.LIGHT_R * math.sin(a)))
        L.circle(sk, pts[-1][0], pts[-1][1], P.WEB_Z0 - 0.5, P.LIGHT_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, P.WEB_Z0 - 0.5) for (x, y) in pts]), P.WEB_T + 1, L.CUT, (0, 0, 1), B, 'Lightening holes')
    L.bed_chamfer(c, body, 'z', P.RIM_Z0, -1, 0.4, 'Bed chamfer')
    return occ


def build_tyre():
    L.delete_component('Tyre')
    occ = L.new_component('Tyre')
    c = occ.component
    fl0 = P.RIM_Z0 + P.FLANGE_T
    fl1 = fl0 + P.TYRE_W
    zc = (fl0 + fl1) / 2
    ri = P.TYRE_SEAT_D / 2
    ro = P.TYRE_OD / 2
    sec = [(ri, fl0), (ro - 1.0, fl0), (ro, fl0 + 1.0), (ro, fl1 - 1.0), (ro - 1.0, fl1), (ri, fl1),
           (ri, zc + 1.0), (ri + 0.6, zc + 0.4), (ri + 0.6, zc - 0.4), (ri, zc - 1.0)]
    sk = L.sketch(c, c.xZConstructionPlane, 'Tyre section')
    L.poly(sk, [(r, 0, z) for (r, z) in sec])
    L.done(sk)
    body = L.revolve(c, L.all_profiles(sk), c.zConstructionAxis, L.NEW, name='Tyre').bodies.item(0)
    body.name = 'Tyre (TPU)'
    sk = L.sketch(c, L.plane_xy(c, fl0 - 0.5), 'Tread groove')
    L.rect(sk, ro - 0.8, -0.6, ro + 0.5, 0.6, fl0 - 0.5)
    L.done(sk)
    g = L.extrude(c, sk, L.all_profiles(sk), P.TYRE_W + 1.0, L.CUT, (0, 0, 1), [body], 'Tread groove')
    ents = adsk.core.ObjectCollection.create()
    ents.add(g)
    pin = c.features.circularPatternFeatures.createInput(ents, c.zConstructionAxis)
    pin.quantity = adsk.core.ValueInput.createByReal(36)
    pin.totalAngle = adsk.core.ValueInput.createByString('360 deg')
    pin.isSymmetric = False
    c.features.circularPatternFeatures.add(pin).name = 'Tread pattern'
    return occ


def wheel_matrices():
    right = L.matrix([(0, 1, 0), (0, 0, 1), (1, 0, 0)], (P.HUB_FACE_X, 0, P.AXLE_Z))
    left = L.matrix([(0, 1, 0), (0, 0, -1), (-1, 0, 0)], (-P.HUB_FACE_X, 0, P.AXLE_Z))
    return [left, right]


def place_wheels():
    for name in ('Wheel', 'Tyre'):
        occ = L.find_occurrence(name)
        L.place_instances(occ.component, wheel_matrices())


# ================================================================ caster
def build_caster():
    """The caster cup is part of the battery door; this places the 1/2-inch ball."""
    L.delete_component('Caster')
    L.delete_component('Caster ball')
    bocc = L.new_component('Caster ball')
    bc = bocc.component
    yc, rb = P.CASTER_Y, P.BALL_D / 2
    sk = L.sketch(bc, bc.yZConstructionPlane, 'Ball')
    arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, 0, yc, rb), L.sp(sk, 0, yc, 2 * rb), math.pi)
    ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
    L.done(sk)
    f = L.revolve(bc, L.all_profiles(sk), ax, L.NEW, name='Ball')
    f.bodies.item(0).name = 'Ball 12.7 mm'
    return bocc


# ======================================================== reference parts
def build_pack():
    L.delete_component('1S3P pack (reference)')
    occ = L.new_component('1S3P pack (reference)')
    c = occ.component
    w, l, hgt = P.PACK3
    y0, y1 = P.PACK_Y
    z0 = P.DOOR_TOP
    pitch = (w - 0.2) / 3
    sk = L.sketch(c, L.plane_xz(c, y0 + 3.0), 'Cells')
    for k in (-1, 0, 1):
        L.circle(sk, k * pitch, y0 + 3.0, z0 + hgt / 2, hgt - 0.4)
    L.done(sk)
    f = L.extrude(c, sk, L.all_profiles(sk), l - 3.5, L.NEW, (0, 1, 0), None, 'Cells')
    for k in range(f.bodies.count):
        f.bodies.item(k).name = '18650 (wrapped)'
    g = L.box(c, -w / 2 + 2, y0, z0 + 1.5, w / 2 - 2, y0 + 2.5, z0 + hgt - 1.5, L.NEW, None, 'BMS')
    g.bodies.item(0).name = 'Protection board'
    return occ


def build_sg90():
    """SG90 / MG90S micro servo (reference). Local frame: long axis X, width Y, shaft up Z, bottom at z 0."""
    L.delete_component('SG90 (reference)')
    occ = L.new_component('SG90 (reference)')
    c = occ.component
    lx, wy, hz = P.SG90_BODY
    tx0, tx1, tz0, tz1, thx, thd = P.SG90_TAB
    body = L.box(c, -lx / 2, -wy / 2, 0, lx / 2, wy / 2, hz, L.NEW, None, 'Case').bodies.item(0)
    body.name = 'SG90 case'
    B = [body]
    for s in (1, -1):
        x0, x1 = sorted((s * lx / 2 - s * 0.1, s * tx1))
        L.box(c, x0, -wy / 2, tz0, x1, wy / 2, tz1, L.JOIN, B, 'Tab')
    L.cyl_z(c, [(thx, 0), (-thx, 0)], thd, tz0 - 0.5, tz1 + 0.5, L.CUT, B, 'Tab holes')
    sx = P.SG90_SHAFT_X
    L.cyl_z(c, [(sx, 0)], 11.8, hz - 0.1, P.SG90_TOP, L.JOIN, B, 'Gear tower')
    L.cyl_z(c, [(sx + 6.0, 0)], 5.5, hz - 0.1, P.SG90_TOP - 1.0, L.JOIN, B, 'Gear boss')
    f = L.cyl_z(c, [(sx, 0)], 4.8, P.SG90_TOP, P.SG90_TOP + 3.0, L.NEW, None, 'Spline')
    f.bodies.item(0).name = 'SG90 spline'
    return occ


# ===================================================================== arm
def arm_angle_floor(clearance=2.0):
    """Lowered angle at which the jaw tips stop `clearance` above the floor."""
    yt, zt = P.JAW_PIVOT_Y + P.JAW_LEN - 0.1, -11.5
    rr = math.hypot(yt, zt)
    phi = math.atan2(-zt, yt)
    s = (clearance - P.SHOULDER[1]) / rr
    return math.degrees(math.asin(s) + phi)


def arm_matrix(theta):
    a = math.radians(theta)
    return L.matrix([(1, 0, 0), (0, math.cos(a), math.sin(a)), (0, -math.sin(a), math.cos(a))], (0, P.SHOULDER[0], P.SHOULDER[1]))


def servo1_matrix():
    # shaft along +X, long axis along -Y (body behind the shaft), bottom face at X = SHOULDER_SERVO_X
    return L.matrix([(0, -1, 0), (0, 0, -1), (1, 0, 0)], (P.SHOULDER_SERVO_X, P.SHOULDER[0] + P.SG90_SHAFT_X, P.SHOULDER[1]))


SERVO2_BOTTOM_Z = 20.5     # arm frame: servo bottom face above the deck, shaft down through it to the jaws


def servo2_local():
    return L.matrix([(0, -1, 0), (-1, 0, 0), (0, 0, -1)], (-P.JAW_PITCH_R, P.JAW_PIVOT_Y + P.SG90_SHAFT_X, SERVO2_BOTTOM_Z))


def build_arm_base():
    """Arm module base: plate on the dock towers (2 x M3 into the tower inserts), posts for the shoulder SG90,
    and a printed D-pin for the yoke's free side."""
    L.delete_component('Arm base')
    occ = L.new_component('Arm base')
    c = occ.component
    zp0, zp1 = P.BODY_TOP, P.BODY_TOP + 3.0
    by0, by1 = P.ARM_BASE_Y
    sy, sz = P.SHOULDER
    lx, wy, hz = P.SG90_BODY
    yc = sy + P.SG90_SHAFT_X                       # servo body centre (Y)
    tab_y = (yc - P.SG90_TAB[4], yc + P.SG90_TAB[4])
    sk = L.sketch(c, L.plane_xy(c, zp0), 'Base plate')
    L.rounded_poly(sk, [(-31.0, by0), (31.0, by0), (31.0, by1), (-31.0, by1)], 4.0, zp0)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), 3.0, L.NEW, (0, 0, 1), name='Base plate').bodies.item(0)
    body.name = 'Arm base'
    B = [body]
    y_front = yc + lx / 2 + 0.4                     # front post starts just in front of the servo body
    y_back = yc - lx / 2 - 0.2
    zt = sz + wy / 2 + 0.3
    L.box(c, P.SHOULDER_SERVO_X, by1 - 1.0, zp0, 0.0, y_front + 5.4, zp1, L.JOIN, B, 'Front tongue')
    L.box(c, P.SHOULDER_SERVO_X, y_back - 5.7, zp1 - 0.1, 0.0, y_back, zt, L.JOIN, B, 'Rear servo post')
    L.box(c, P.SHOULDER_SERVO_X, y_front, zp1 - 0.1, 0.0, y_front + 5.4, zt, L.JOIN, B, 'Front servo post')
    # pivot post with a D-shaped pin (flat underside prints without supports)
    px1 = P.ARM_PLATE_X[1][0] - 0.2
    px0 = px1 - 4.0
    sk = L.sketch(c, L.plane_yz(c, px0), 'Pivot post')
    L.rounded_poly(sk, [(sy - 6, zp1 - 0.1), (sy + 6, zp1 - 0.1), (sy + 6, sz + 6), (sy - 6, sz + 6)], [0, 0, 5.99, 5.99], plane='yz', fixed=px0)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 4.0, L.JOIN, (1, 0, 0), B, 'Pivot post')
    sk = L.sketch(c, L.plane_yz(c, px1), 'D pin')
    L.circle(sk, px1, sy, sz, 5.0)
    sk.sketchCurves.sketchLines.addByTwoPoints(L.sp(sk, px1, sy - 3, sz - 1.8), L.sp(sk, px1, sy + 3, sz - 1.8))
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(px1, sy, sz)]), 2.8, L.JOIN, (1, 0, 0), B, 'D pin')
    # tab screw pilots (servo screws, along X) and the M3 holes into the tower inserts
    sk = L.sketch(c, L.plane_yz(c, 0.0), 'Tab pilots')
    for y in tab_y:
        L.circle(sk, 0.0, y, sz, 2.0)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(0.0, y, sz) for y in tab_y]), 8.0, L.CUT, (-1, 0, 0), B, 'Tab pilots')
    L.cyl_z(c, P.DOCK_INSERTS, 3.4, zp0 - 0.5, zp1 + 0.5, L.CUT, B, 'Dock screw holes')
    L.bed_chamfer(c, body, 'z', zp0, -1, 0.4, 'Bed chamfer')
    return occ


def build_arm(theta=None):
    """Lift arm (yoke): two side plates (right one on the servo horn, left one on the D-pin),
    a mid brace and the wrist deck that carries the gripper servo. Built in the arm frame."""
    L.delete_component('Arm')
    occ = L.new_component('Arm', m=arm_matrix(P.ARM_RAISED if theta is None else theta))
    c = occ.component
    pl_end = 64.0
    xl, xr = P.ARM_PLATE_X[1][0], P.ARM_PLATE_X[0][1]
    dy0, dy1 = P.ARM_DECK_Y
    sk = L.sketch(c, L.plane_xy(c, -7.0), 'Deck')
    L.rounded_poly(sk, [(xl, dy0), (xr, dy0), (xr, dy1), (xl, dy1)], [0, 0, 5, 5], -7.0)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), 3.0, L.NEW, (0, 0, 1), name='Deck').bodies.item(0)
    body.name = 'Arm'
    B = [body]
    for (x0, x1) in P.ARM_PLATE_X:
        sk = L.sketch(c, L.plane_yz(c, x0), 'Arm plate')
        L.rounded_poly(sk, [(-7, -7), (pl_end, -7), (pl_end, 7), (-7, 7)], [6.99, 3, 3, 6.99], plane='yz', fixed=x0)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), x1 - x0, L.JOIN, (1, 0, 0), B, 'Arm plate')
    L.box(c, P.ARM_PLATE_X[1][1] - 0.1, 36.0, -7.0, P.ARM_PLATE_X[0][0] + 0.1, 42.0, -4.0, L.JOIN, B, 'Mid brace')
    # gripper servo posts (tabs rest on them, screws along -z) and the holes through the deck
    lx, wy, hz = P.SG90_BODY
    yc = P.JAW_PIVOT_Y + P.SG90_SHAFT_X
    ztab = SERVO2_BOTTOM_Z - P.SG90_TAB[3]
    x0, x1 = -P.JAW_PITCH_R - wy / 2, -P.JAW_PITCH_R + wy / 2
    for s in (1, -1):
        y0_, y1_ = sorted((yc + s * P.SG90_TAB[0], yc + s * P.SG90_TAB[1]))
        L.box(c, x0, y0_, -4.1, x1, y1_, ztab, L.JOIN, B, 'Servo post')
    L.cyl_z(c, [(-P.JAW_PITCH_R, yc - P.SG90_TAB[4]), (-P.JAW_PITCH_R, yc + P.SG90_TAB[4])], 2.0, ztab + 0.5, ztab - 6.0, L.CUT, B, 'Tab pilots')
    L.cyl_z(c, [(-P.JAW_PITCH_R, P.JAW_PIVOT_Y)], 12.6, -7.5, -3.5, L.CUT, B, 'Gear tower hole')
    L.cyl_z(c, [(-P.JAW_PITCH_R, yc - P.SG90_SHAFT_X - 6.0)], 6.4, -7.5, -3.5, L.CUT, B, 'Gear boss hole')
    L.cyl_z(c, [(P.JAW_PITCH_R, P.JAW_PIVOT_Y)], 2.6, -7.5, -3.5, L.CUT, B, 'Jaw screw pilot')
    # shoulder: horn recess + screw hole on the right plate, bearing hole on the left plate
    xh = P.ARM_PLATE_X[0][0]
    sk = L.sketch(c, L.plane_yz(c, xh), 'Horn recess')
    L.circle(sk, xh, 0, 0, 7.4)
    L.rounded_poly(sk, [(0, -2.1), (16.5, -2.1), (16.5, 2.1), (0, 2.1)], [0, 2.09, 2.09, 0], plane='yz', fixed=xh)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 1.6, L.CUT, (1, 0, 0), B, 'Horn recess')
    sk = L.sketch(c, L.plane_yz(c, xh), 'Horn screw')
    L.circle(sk, xh, 0, 0, 2.4)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 4.0, L.CUT, (1, 0, 0), B, 'Horn screw')
    xb = P.ARM_PLATE_X[1][0] - 0.5
    sk = L.sketch(c, L.plane_yz(c, xb), 'Pivot hole')
    L.circle(sk, xb, 0, 0, 5.4)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 4.0, L.CUT, (1, 0, 0), B, 'Pivot hole')
    L.bed_chamfer(c, body, 'z', -7.0, -1, 0.4, 'Bed chamfer')
    return occ


def _gear_pts(cx, cy, centre_deg, teeth_deg, z):
    """Sector of a module-1.5 spur gear (pitch r 9) round (cx, cy): trapezoid teeth, closed through the centre."""
    rp = P.JAW_PITCH_R
    rt, rr = rp + 0.8 * P.JAW_MODULE, rp - 1.25 * P.JAW_MODULE     # short addendum + thin teeth = backlash
    pts = [(cx, cy)]
    a0 = centre_deg - (max(abs(t - centre_deg) for t in teeth_deg) + 15.0)
    pts.append((cx + rr * math.cos(math.radians(a0)), cy + rr * math.sin(math.radians(a0))))
    for t in sorted(teeth_deg):
        for (da, r_) in ((-8.5, rr), (-6.5, rp), (-3.2, rt), (3.2, rt), (6.5, rp), (8.5, rr)):
            a = math.radians(t + da)
            pts.append((cx + r_ * math.cos(a), cy + r_ * math.sin(a)))
    a1 = 2 * centre_deg - a0
    pts.append((cx + rr * math.cos(math.radians(a1)), cy + rr * math.sin(math.radians(a1))))
    return [(x, y, z) for (x, y) in pts]


def build_jaw(side):
    """Gripper jaw in the arm frame. side -1: driven jaw on the gripper servo; +1: idle jaw on an M3."""
    name = 'Jaw L' if side < 0 else 'Jaw R'
    L.delete_component(name)
    occ = L.new_component(name)
    c = occ.component
    z0, z1 = -11.5, -7.5
    cx, cy = side * P.JAW_PITCH_R, P.JAW_PIVOT_Y
    tip = cy + P.JAW_LEN
    sk = L.sketch(c, L.plane_xy(c, z0), 'Finger')
    finger = [(-15.4, cy), (-15.4, cy + 18.4), (-7.0, tip), (-1.0, tip), (-0.8, tip - 1.0), (-0.8, tip - 4.0),
              (-9.2, cy + 17.9), (-9.2, cy + 7.9), (-4.5, cy + 5.4)]
    L.poly(sk, [(-side * x, y, z0) for (x, y) in finger])
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), z1 - z0, L.NEW, (0, 0, 1), name='Finger').bodies.item(0)
    body.name = name
    B = [body]
    L.cyl_z(c, [(cx, cy)], 13.0, z0, z1, L.JOIN, B, 'Hub')
    teeth = [-30.0, 0.0, 30.0] if side < 0 else [135.0, 165.0, 195.0, 225.0]
    centre = 0.0 if side < 0 else 180.0
    sk = L.sketch(c, L.plane_xy(c, z0), 'Gear sector')
    L.poly(sk, _gear_pts(cx, cy, centre, teeth, z0))
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), z1 - z0, L.JOIN, (0, 0, 1), B, 'Gear sector')
    if side < 0:
        L.cyl_z(c, [(cx, cy)], 12.6, z1 + 0.1, z1 - 0.8, L.CUT, B, 'Gear tower clearance')
        L.cyl_z(c, [(cx, cy)], 7.4, z1 + 0.1, z0 - 0.1, L.CUT, B, 'Horn hub')
        sk = L.sketch(c, L.plane_xy(c, z1 + 0.1), 'Horn arm')
        L.rounded_poly(sk, [(cx - 2.1, cy), (cx + 2.1, cy), (cx + 2.1, cy + 15.0), (cx - 2.1, cy + 15.0)], [0, 0, 2.09, 2.09], z1 + 0.1)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), 2.1, L.CUT, (0, 0, -1), B, 'Horn arm')
    else:
        L.cyl_z(c, [(cx, cy)], 3.3, z1 + 0.1, z0 - 0.1, L.CUT, B, 'Pivot hole')
    # grip pads: shallow ribs on the inner faces of the tips
    L.bed_chamfer(c, body, 'z', z0, -1, 0.3, 'Bed chamfer')
    return occ


def place_arm(theta=None, open_deg=None):
    """Pose the arm module: arm angle (deg from horizontal-forward) and jaw opening (each jaw)."""
    theta = P.ARM_RAISED if theta is None else theta
    open_deg = P.ARM_OPEN if open_deg is None else open_deg
    MA = arm_matrix(theta)
    L.place_instances(L.find_occurrence('Arm').component, [MA])
    L.place_instances(L.find_occurrence('Jaw L').component, [compose(MA, rot_z_about(-P.JAW_PITCH_R, P.JAW_PIVOT_Y, open_deg))])
    L.place_instances(L.find_occurrence('Jaw R').component, [compose(MA, rot_z_about(P.JAW_PITCH_R, P.JAW_PIVOT_Y, -open_deg))])
    L.place_instances(L.find_occurrence('SG90 (reference)').component, [servo1_matrix(), compose(MA, servo2_local())])
    return 'arm %.1f deg, jaws %.1f deg (floor pose %.1f deg)' % (theta, open_deg, arm_angle_floor())


def build_dock_cap():
    """Plain cap for the front dock when the arm is off: holds the ultrasonic in its grooves."""
    L.delete_component('Dock cap')
    occ = L.new_component('Dock cap')
    c = occ.component
    z0 = P.BODY_TOP
    by0 = P.ARM_BASE_Y[0]
    sk = L.sketch(c, L.plane_xy(c, z0), 'Cap')
    L.rounded_poly(sk, [(-31.0, by0), (31.0, by0), (31.0, P.ARM_BASE_Y[1]), (-31.0, P.ARM_BASE_Y[1])], 4.0, z0)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), 3.0, L.NEW, (0, 0, 1), name='Cap').bodies.item(0)
    body.name = 'Dock cap'
    B = [body]
    L.cyl_z(c, P.DOCK_INSERTS, 3.4, z0 - 0.5, z0 + 3.5, L.CUT, B, 'Screw holes')
    e = L.edges_of_plane_faces(body, 'z', z0 + 3.0, 1)
    L.fillet(c, e, 1.0, 'Top fillet')
    import json
    w = 30.0
    d = json.load(open(P.ART_DIR + '/robocore.json'))
    hh = d['height'] * w / d['width']
    yc = (by0 + P.ARM_BASE_Y[1]) / 2
    L.logo(c, P.ART_DIR + '/robocore.json', lambda u, v: (u - w / 2, yc + hh / 2 - v, z0 + 3.0), w, P.DEBOSS, (0, 0, -1), B, 'Cap logo')
    L.bed_chamfer(c, body, 'z', z0, -1, 0.4, 'Bed chamfer')
    occ.isLightBulbOn = False
    return occ


# ======================================================== expansion bus
def _rail_clip(c, y0, y1, xo, name):
    """Clip profile on a rail whose lip's outer face is at X = xo + RAIL_OUT (right side), extruded y0 -> y1.
    Hook under the 45-degree face, detent bump, thumb-screw insert in the inner leg, accessory boss."""
    g, t = P.CLIP_GAP, P.CLIP_T
    xl = xo + P.RAIL_OUT                         # lip outer face
    zt = P.BODY_TOP
    xin0 = xo - P.SKIN_T - g - 5.0               # inner leg (5 mm: M3 insert)
    xin1 = xo - P.SKIN_T - g
    xout0 = xl + g
    xout1 = xout0 + t
    zbar0, zbar1 = zt + g, zt + g + t
    hook = P.CLIP_HOOK
    zh = (xout0 - xl) + P.RAIL_Z[1] - 0.35      # where the offset 45-degree face meets the leg
    prof = [(xin0, P.HOLE_BAND[1] + 0.5), (xin1, P.HOLE_BAND[1] + 0.5), (xin1, zbar0), (xout0, zbar0),
            (xout0, zh), (xout0 - hook, zh - hook), (xout0, zh - 2 * hook),                 # hook (45 both ways)
            (xout0, P.RAIL_Z[0] - 3.0), (xout1, P.RAIL_Z[0] - 3.0), (xout1, zbar1), (xin0, zbar1)]
    sk = L.sketch(c, L.plane_xz(c, y0), name)
    L.poly(sk, [(x, y0, z) for (x, z) in prof])
    L.done(sk)
    return L.extrude(c, sk, L.all_profiles(sk), y1 - y0, L.NEW, (0, 1, 0), None, name).bodies.item(0)


def build_clip():
    """Expansion-bus clip (template): hooks under the rail lip, a thumb screw in the inner leg clamps it,
    a bump clicks into the 8 mm detents, and the outer boss takes an M3 insert for accessories."""
    L.delete_component('Bus clip')
    occ = L.new_component('Bus clip')
    c = occ.component
    y0, y1 = P.CLIP_Y - P.CLIP_W / 2, P.CLIP_Y + P.CLIP_W / 2
    body = _rail_clip(c, y0, y1, H, 'Clip')
    body.name = 'Bus clip'
    B = [body]
    xout0 = H + P.RAIL_OUT + P.CLIP_GAP
    xout1 = xout0 + P.CLIP_T
    zb = P.RAIL_Z[0] - 3.0
    # V bump (in plan) that clicks into one rail detent
    zd = P.RAIL_Z[1] + 0.2
    sk = L.sketch(c, L.plane_xy(c, zd), 'Detent bump')
    L.poly(sk, [(xout0 + 0.1, P.CLIP_Y - 0.6, zd), (xout0 + 0.1, P.CLIP_Y + 0.6, zd), (xout0 - 0.85, P.CLIP_Y, zd)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 1.6, L.JOIN, (0, 0, 1), B, 'Detent bump')
    L.box(c, xout1 - 0.1, P.CLIP_Y - 5.0, zb, xout1 + 5.0, P.CLIP_Y + 5.0, P.BODY_TOP + P.CLIP_GAP + P.CLIP_T, L.JOIN, B, 'Accessory boss')
    zm = (zb + P.BODY_TOP) / 2
    sk = L.sketch(c, L.plane_yz(c, xout1 + 5.0), 'Accessory insert')
    L.circle(sk, xout1 + 5.0, P.CLIP_Y, zm, P.INSERT_M3_D)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.INSERT_M3_DEPTH, L.CUT, (-1, 0, 0), B, 'Accessory insert')
    xin0 = H - P.SKIN_T - P.CLIP_GAP - 5.0
    zs = P.HOLE_BAND[1] + 0.5 + 2.6
    sk = L.sketch(c, L.plane_yz(c, xin0), 'Thumb screw insert')
    L.circle(sk, xin0, P.CLIP_Y, zs, P.INSERT_M3_D)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 5.0 + 0.5, L.CUT, (1, 0, 0), B, 'Thumb screw insert')
    return occ


def build_coupon():
    """40 mm of rail (wall, band, lip, detents, two holes) on a foot: prints in 20 min to tune CLIP_GAP."""
    L.delete_component('Rail coupon')
    m = L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (60.0, -150.0, 0.0))
    occ = L.new_component('Rail coupon', m=m)
    c = occ.component
    xo = 0.0
    zf = P.HOLE_BAND[0] - 6.0
    body = L.box(c, xo - 16.0, 0, zf, xo + P.RAIL_OUT, 40.0, zf + 2.0, L.NEW, None, 'Foot').bodies.item(0)
    body.name = 'Rail coupon'
    B = [body]
    L.box(c, xo - P.SKIN_T, 0, zf, xo, 40.0, P.BODY_TOP, L.JOIN, B, 'Wall')
    L.box(c, xo - P.HOLE_BAND_T, 0, zf, xo - P.SKIN_T, 40.0, P.HOLE_BAND[1], L.JOIN, B, 'Band')
    L.box(c, xo, 0, P.RAIL_Z[0], xo + P.RAIL_OUT, 40.0, P.BODY_TOP, L.JOIN, B, 'Lip')
    e = L.edges_where(body, lambda x, y, z: abs(z - P.RAIL_Z[0]) < 0.05 and abs(x - (xo + P.RAIL_OUT)) < 0.05)
    L.chamfer(c, e, P.RAIL_OUT - 0.05, 'Lip 45')
    zd = P.RAIL_Z[0] - 0.5
    sk = L.sketch(c, L.plane_xy(c, zd), 'Detents')
    dw, dd = P.DETENT
    probes = []
    for k in range(5):
        y = 4.0 + 8.0 * k
        L.poly(sk, [(xo + P.RAIL_OUT - dd, y, zd), (xo + P.RAIL_OUT + 0.5, y + dw / 2 / dd * (dd + 0.5), zd),
                    (xo + P.RAIL_OUT + 0.5, y - dw / 2 / dd * (dd + 0.5), zd)])
        probes.append((xo + P.RAIL_OUT, y, zd))
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.BODY_TOP - P.RAIL_Z[0] + 1.0, L.CUT, (0, 0, 1), B, 'Detents')
    sk = L.sketch(c, L.plane_yz(c, xo + 0.5), 'Holes')
    for y in (12.0, 28.0):
        L.circle(sk, xo + 0.5, y, P.HOLE_Z, P.HOLE_D)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.HOLE_BAND_T + 1.0, L.CUT, (-1, 0, 0), B, 'Holes')
    occ.isLightBulbOn = False
    return occ


# ======================================================== imported parts
def import_motor():
    root = L.design().rootComponent
    if any(o.component.name == MOTOR_COMPONENT for o in root.occurrences):
        return
    im = L.app.importManager
    opt = im.createSTEPImportOptions(MOTOR_STEP)
    opt.isViewFit = False
    im.importToTarget(opt, root)


def place_motors():
    root = L.design().rootComponent
    occs = [o for o in root.occurrences if o.component.name == MOTOR_COMPONENT]
    if not occs:
        raise RuntimeError('motor component not found')
    left = L.matrix([(0, 0, -1), (0, 1, 0), (1, 0, 0)], (-P.MOTOR_TX, -P.M_SHAFT_Y, P.AXLE_Z))
    right = L.matrix([(0, 0, 1), (0, 1, 0), (-1, 0, 0)], (P.MOTOR_TX, -P.M_SHAFT_Y, P.AXLE_Z))
    new = L.place_instances(occs[0].component, [left, right])
    new[0].component.name = MOTOR_COMPONENT


def _insert(file_id, mtx, prefix):
    root = L.design().rootComponent
    for o in list(root.occurrences):
        if o.name.startswith(prefix):
            o.deleteMe()
    df = L.app.data.findFileById(file_id)
    return root.occurrences.addByInsert(df, mtx, True)


def place_board():
    return _insert(BOARD_FILE_ID, L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (0, 0, P.BOARD_Z)), 'RoboCore_V2')


def place_line_sensor():
    # STEP origin = board centre, underside at z 0; it sits against the sled's front stop
    x, y = P.LINE_C
    y = y + 0.1
    return _insert(LINE_FILE_ID, L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (x, y, P.LINE_UNDER_Z)), 'RoboCore_LineSensor')


def place_ultrasonic():
    # board X -> robot X (TX at +X: viewer's left from the front); board Y up, tilted back by US_TILT;
    # board Z (top, connector) backwards: the transducers on the underside aim forward and 5 degrees up
    m = L.matrix([(1, 0, 0), (0, -SIN5, COS5), (0, -COS5, -SIN5)], (0, P.US_UNDER_Y, P.US_CZ))
    return _insert(US_FILE_ID, m, 'RoboCore_Ultrasonic')


# ============================================================ appearances
def apply_scheme(name='teal'):
    sc = SCHEMES[name]
    root = L.design().rootComponent
    apps = {role: L.appearance('RC %s %s' % (name, role), rgb) for role, rgb in sc.items()}
    for o in root.occurrences:
        cn = L.base_name(o.component.name)
        if cn in ROLES:
            L.paint(o, apps[ROLES[cn]])
        if cn == 'Caster ball':
            L.paint(o, L.appearance('Steel ball', (200, 200, 205), 'Steel - Satin'))
        if cn.startswith('1S3P pack'):
            L.paint(o, L.appearance('Pack wrap blue', (30, 90, 170)))
        if cn.startswith('SG90'):
            L.paint(o, L.appearance('Servo blue', (40, 80, 200)))
    return name


def clear_rev2():
    """Remove the rev 2 printed parts (pods, ring, bezel...) before the rev 3 build."""
    gone = []
    for n in ('Side pod R', 'Side pod L', 'Bumper ring', 'Front bezel', 'Chassis', 'Wheel', 'Tyre', 'Caster',
              'Caster ball', 'Battery door', '1S2P spacer', '1S3P pack (reference)'):
        before = L.design().rootComponent.occurrences.count
        L.delete_component(n)
        if L.design().rootComponent.occurrences.count != before:
            gone.append(n)
    return ', '.join(gone)


STEPS = {
    'clear_rev2': clear_rev2,
    'motor_import': import_motor,
    'motors': place_motors,
    'board': place_board,
    'line': place_line_sensor,
    'ultrasonic': place_ultrasonic,
    'chassis_shell': chassis_shell,
    'chassis_cradle': chassis_cradle,
    'chassis_front': chassis_front,
    'chassis_holes': chassis_holes,
    'chassis_bus': chassis_bus,
    'chassis_detents': chassis_detents,
    'chassis_finish': chassis_finish,
    'sled': build_sled,
    'door': build_door,
    'spacer': build_spacer,
    'pack': build_pack,
    'caster': build_caster,
    'wheel': build_wheel,
    'tyre': build_tyre,
    'wheels': place_wheels,
    'sg90': build_sg90,
    'arm_base': build_arm_base,
    'arm': build_arm,
    'jaw_l': lambda: build_jaw(-1),
    'jaw_r': lambda: build_jaw(1),
    'arm_pose': place_arm,
    'dock_cap': build_dock_cap,
    'clip': build_clip,
    'coupon': build_coupon,
    'teal': lambda: apply_scheme('teal'),
    'orange': lambda: apply_scheme('orange'),
}
ALL = ['motor_import', 'motors', 'board', 'line', 'ultrasonic', 'chassis_shell', 'chassis_cradle', 'chassis_front',
       'chassis_holes', 'chassis_bus', 'chassis_detents', 'chassis_finish', 'sled', 'door', 'spacer', 'pack', 'caster', 'wheel', 'tyre', 'wheels',
       'sg90', 'arm_base', 'arm', 'jaw_l', 'jaw_r', 'arm_pose', 'dock_cap', 'clip', 'coupon', 'teal']


def main(steps=None):
    steps = steps or ALL
    log = []
    for s in steps:
        try:
            r = STEPS[s]()
            log.append('%s: ok%s' % (s, '' if r is None or hasattr(r, 'objectType') else ' %s' % (r,)))
        except Exception as e:
            import traceback
            log.append('%s: FAILED %s\n%s' % (s, e, traceback.format_exc()))
            break
    return '\n'.join(log)
