"""Builds the RoboCore V2 robot (XRP-inspired), revision 2, in the active Fusion design.

Run from Fusion (Scripts and Add-Ins, or the Fusion MCP) with:
    import sys; sys.path.insert(0, '<this folder>'); import build_robot; build_robot.main()
Each step deletes and rebuilds its own component (the chassis is built in
several steps so each fits in one Fusion call). Rev 1 lives in rev1/.

Printed parts and their print orientation:
    Chassis        floor down              PETG, body colour
    Side pod L/R   outer face down         PETG, body colour (wheel arches + motor fairings)
    Front bezel    face down               PETG, body colour (ultrasonic "eyes", line-sensor skirt, skid)
    Bumper ring    top face down           PETG, accent colour
    Battery door   outside face down       PETG, accent colour
    1S2P spacer    as built                PETG (only with a 1S2P pack)
    Wheel x2       flat inner face down    PETG, accent colour (RoboCore gear on the hub)
    Tyre x2        flat                    TPU 95A
    Caster         flange down             PETG
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
    'teal': {'body': (120, 163, 173), 'ring': (28, 30, 32), 'parts': (100, 135, 142), 'dark': (28, 30, 32), 'tyre': (18, 18, 18)},
    # rev 1 orange body, charcoal accents
    'orange': {'body': (242, 140, 40), 'ring': (40, 40, 44), 'parts': (85, 85, 92), 'dark': (28, 30, 32), 'tyre': (18, 18, 18)},
}
ROLES = {'Chassis': 'body', 'Side pod L': 'body', 'Side pod R': 'body', 'Front bezel': 'body',
         'Bumper ring': 'ring', 'Battery door': 'parts', 'Wheel': 'parts', 'Tyre': 'tyre',
         'Caster': 'dark', '1S2P spacer': 'dark'}
PRINTED = list(ROLES.keys())


def S(x):
    """Both sides: returns [(sign, x*sign)]."""
    return [(1, x), (-1, -x)]


# =============================================================== chassis
def chassis_base():
    L.delete_component('Chassis')
    occ = L.new_component('Chassis')
    c = occ.component
    z0, fz = P.FLOOR_Z0, P.FZ
    h, y0, y1 = P.CH_HALF, P.BODY_Y0, P.BODY_Y1

    # floor: one rounded rectangle, battery opening cut later
    sk = L.sketch(c, L.plane_xy(c, z0), 'Floor')
    L.rounded_poly(sk, [(-h, y0), (h, y0), (h, y1), (-h, y1)], P.BODY_R, z0)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), P.FLOOR_T, L.NEW, (0, 0, 1), name='Floor').bodies.item(0)
    body.name = 'Chassis'
    B = [body]

    # battery opening (bottom door)
    sk = L.sketch(c, L.plane_xy(c, z0 - 1), 'Battery opening')
    L.rounded_poly(sk, [(-P.BAY_HALF, P.BAY_Y[0]), (P.BAY_HALF, P.BAY_Y[0]), (P.BAY_HALF, P.BAY_Y[1]), (-P.BAY_HALF, P.BAY_Y[1])], 2.0, z0 - 1)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.FLOOR_T + 2, L.CUT, (0, 0, 1), B, 'Battery opening')

    # front block: battery-bay front wall + nose (line sensor underneath)
    L.box(c, -P.NOSE_HALF, P.NOSE_Y[0], fz, P.NOSE_HALF, P.NOSE_Y[1], P.NOSE_TOP, L.JOIN, B, 'Front block')
    fs = P.FRONT_STOP
    L.box(c, -fs[2], fs[0], P.NOSE_TOP, fs[2], fs[1], fs[3], L.JOIN, B, 'Pack front stop')

    # motor walls, rails under the motors, bosses round the TT holes
    for s, _ in S(1):
        x0, x1 = sorted((s * (P.MOTOR_IN - P.WALL_T), s * P.MOTOR_IN))
        L.box(c, x0, P.WALL_Y[0], fz, x1, P.WALL_Y[1], P.WALL_TOP, L.JOIN, B, 'Motor wall')
        for (a, b) in P.MOTOR_RAILS:
            x0, x1 = sorted((s * a, s * b))
            L.box(c, x0, P.MOTOR_RAIL_Y[0], fz, x1, P.MOTOR_RAIL_Y[1], P.MOTOR_BOTTOM - 0.25, L.JOIN, B, 'Motor rail')
    hole_yz = [(mY - P.M_SHAFT_Y, P.AXLE_Z - mX) for (mX, mY) in P.M_HOLES]
    for s, _ in S(1):
        xin = s * (P.MOTOR_IN - P.MOTOR_BOSS_DEPTH)
        sk = L.sketch(c, L.plane_yz(c, xin), 'Motor boss')
        for (y, z) in hole_yz:
            L.circle(sk, xin, y, z, P.MOTOR_BOSS_D)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, [(xin, y, z) for (y, z) in hole_yz]), P.MOTOR_BOSS_DEPTH, L.JOIN, (s, 0, 0), B, 'Motor boss')

    # pack side ribs, rear stop
    for s, _ in S(1):
        x0, x1 = sorted((s * P.PACK_RIB_X, s * (P.MOTOR_IN - P.WALL_T)))
        for y in P.PACK_RIB_Y:
            L.box(c, x0, y - 1.0, fz, x1, y + 1.0, P.PACK_RIB_TOP, L.JOIN, B, 'Pack rib')
    rs = P.REAR_STOP
    L.box(c, -rs[2], rs[0], fz, rs[2], rs[1], rs[3], L.JOIN, B, 'Pack rear stop')
    return occ


def _wedge(c, B, s, y0, y1, x_inner):
    """45-degree corbel on a motor wall: carries a board pillar / holds the pack down."""
    xw = s * (P.MOTOR_IN - P.WALL_T)
    xi = s * x_inner
    zt = P.LUG_TOP
    zb = zt - abs(xw - xi)
    sk = L.sketch(c, L.plane_xz(c, y0), 'Wedge')
    L.poly(sk, [(xw, y0, zb), (xw, y0, zt), (xi, y0, zt)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), y1 - y0, L.JOIN, (0, 1, 0), B, 'Wedge')


def chassis_upper():
    occ = L.find_occurrence('Chassis')
    c = occ.component
    B = [L.body_by_name(c, 'Chassis')]
    fz = P.FZ
    # board pillars: front ones stand on the front block, rear ones on 45-degree wedges over the pack
    front = [hp for hp in P.BOARD_HOLES if hp[1] > 0]
    rear = [hp for hp in P.BOARD_HOLES if hp[1] < 0]
    L.cyl_z(c, front, P.PILLAR_D, P.NOSE_TOP, P.BOARD_Z, L.JOIN, B, 'Board pillar front')
    for (x, y) in rear:
        s = 1 if x > 0 else -1
        _wedge(c, B, s, y - P.PILLAR_D / 2, y + P.PILLAR_D / 2, abs(x) - P.PILLAR_D / 2 - 0.2)
    L.cyl_z(c, rear, P.PILLAR_D, P.LUG_TOP, P.BOARD_Z, L.JOIN, B, 'Board pillar rear')
    for (ya, yb) in P.HOLD_LUGS[1:]:
        for s, _ in S(1):
            _wedge(c, B, s, ya, yb, P.PACK_RIB_X - 1.5)
    # columns for the ring (top insert) and the side pods (insert along X)
    cols = [(s * x, y) for (x, y) in P.COLUMNS for s in (1, -1)]
    L.cyl_z(c, cols, P.COLUMN_D, fz, P.RING_SKIRT_Z0, L.JOIN, B, 'Column')

    # rear wall (U-band round the back) and front walls beside the bezel
    h, y0, y1, r = P.CH_HALF, P.BODY_Y0, P.BODY_Y1, P.BODY_R
    t = P.REAR_WALL_T
    sk = L.sketch(c, L.plane_xy(c, fz), 'Body walls')
    L.rounded_poly(sk, [(-h, y0), (h, y0), (h, y1), (-h, y1)], r, fz)
    L.rounded_poly(sk, [(-h + t, y0 + t), (h - t, y0 + t), (h - t, y1 - t), (-h + t, y1 - t)], r - t, fz)
    lines = sk.sketchCurves.sketchLines
    lines.addByTwoPoints(L.sp(sk, -h - 1, -62, fz), L.sp(sk, h + 1, -62, fz))
    lines.addByTwoPoints(L.sp(sk, -h - 1, 40, fz), L.sp(sk, h + 1, 40, fz))
    for s, _ in S(1):
        lines.addByTwoPoints(L.sp(sk, s * P.NOSE_HALF, 40, fz), L.sp(sk, s * P.NOSE_HALF, y1 + 1, fz))
    L.done(sk)
    profs = L.profiles_at(sk, [(0, y0 + t / 2, fz), (46, y1 - t / 2, fz), (-46, y1 - t / 2, fz)])
    L.extrude(c, sk, profs, P.RING_SKIRT_Z0 - fz, L.JOIN, (0, 0, 1), B, 'Body walls')

    # relief windows for the round motor can (bulges 2.3 mm past the gearbox face)
    wy0, wy1, wz0, wz1 = P.WALL_WINDOW
    for s, _ in S(1):
        x0, x1 = sorted((s * (P.MOTOR_IN - P.WALL_T - 1.0), s * (P.MOTOR_IN + 1.0)))
        L.box(c, x0, wy0, wz0, x1, wy1, wz1, L.CUT, B, 'Motor can relief')
    return occ


def chassis_holes():
    occ = L.find_occurrence('Chassis')
    c = occ.component
    B = [L.body_by_name(c, 'Chassis')]
    z0, fz = P.FLOOR_Z0, P.FZ

    # board pillar inserts (M2)
    sk = L.sketch(c, L.plane_xy(c, P.BOARD_Z), 'Board inserts')
    for (x, y) in P.BOARD_HOLES:
        L.circle(sk, x, y, P.BOARD_Z, P.INSERT_M2_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, P.BOARD_Z) for (x, y) in P.BOARD_HOLES]), P.INSERT_M2_DEPTH, L.CUT, (0, 0, -1), B, 'Board inserts')

    # motor inserts (M3, from the motor side)
    hole_yz = [(mY - P.M_SHAFT_Y, P.AXLE_Z - mX) for (mX, mY) in P.M_HOLES]
    for s, _ in S(1):
        xf = s * P.MOTOR_IN
        sk = L.sketch(c, L.plane_yz(c, xf), 'Motor inserts')
        for (y, z) in hole_yz:
            L.circle(sk, xf, y, z, P.INSERT_M3_D)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, [(xf, y, z) for (y, z) in hole_yz]), P.INSERT_M3_DEPTH, L.CUT, (-s, 0, 0), B, 'Motor inserts')

    # column inserts: ring (vertical, from the top) and pods (along X)
    cols = [(s * x, y) for (x, y) in P.COLUMNS for s in (1, -1)]
    sk = L.sketch(c, L.plane_xy(c, P.RING_SKIRT_Z0), 'Ring inserts')
    for (x, y) in cols:
        L.circle(sk, x, y, P.RING_SKIRT_Z0, P.INSERT_M3_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, P.RING_SKIRT_Z0) for (x, y) in cols]), P.INSERT_M3_DEPTH, L.CUT, (0, 0, -1), B, 'Ring inserts')
    for s, _ in S(1):
        xf = s * P.CH_HALF
        sk = L.sketch(c, L.plane_yz(c, xf), 'Pod inserts')
        for (_, y) in P.COLUMNS:
            L.circle(sk, xf, y, P.POD_SCREW_Z, P.INSERT_M3_D)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, [(xf, y, P.POD_SCREW_Z) for (_, y) in P.COLUMNS]), P.INSERT_M3_DEPTH, L.CUT, (-s, 0, 0), B, 'Pod inserts')

    # caster: bosses + dome above the ball, inserts from below
    cy, cx = P.CASTER_Y, P.CASTER_SCREW_X
    L.cyl_z(c, [(cx, cy), (-cx, cy)], 8.0, fz, fz + 6.0, L.JOIN, B, 'Caster boss')
    L.cyl_z(c, [(0, cy)], 15.0, fz, P.BALL_D + 1.5, L.JOIN, B, 'Ball dome')
    sk = L.sketch(c, L.plane_xy(c, z0), 'Caster holes')
    for x in (cx, -cx):
        L.circle(sk, x, cy, z0, P.INSERT_M3_D)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.INSERT_M3_DEPTH, L.CUT, (0, 0, 1), B, 'Caster inserts')
    # the ball is 7.6 mm in radius where it passes the floor plane, 5.8 mm at the floor top
    rb = P.BALL_D / 2
    d_floor = 2 * math.sqrt(rb * rb - (z0 - rb) ** 2) + 1.0
    d_top = 2 * math.sqrt(rb * rb - (fz - rb) ** 2) + 1.0
    L.cyl_z(c, [(0, cy)], d_floor, z0 - 0.5, fz, L.CUT, B, 'Ball pocket')
    L.cyl_z(c, [(0, cy)], d_top, fz - 0.1, P.BALL_D + 0.6, L.CUT, B, 'Ball dome cavity')

    # battery door: front tab rebate + thumb-screw insert, rear hinge slots
    th, ty0, ty1 = P.DOOR_TAB
    L.box(c, -th, ty0 - 0.5, z0 - 1, th, ty1, P.DOOR_TOP, L.CUT, B, 'Door tab rebate')
    L.cyl_z(c, [(0, P.DOOR_SCREW_Y)], P.INSERT_M3_D, P.DOOR_TOP, P.DOOR_TOP + 4.5, L.CUT, B, 'Door screw insert')
    tl, tz0, tz1 = P.DOOR_TONGUE
    for (a, b) in P.DOOR_TONGUES:
        for s, _ in S(1):
            x0, x1 = sorted((s * (a - 0.4), s * (b + 0.4)))
            L.box(c, x0, P.BAY_Y[0] - tl - 0.3, tz0 - 0.1, x1, P.BAY_Y[0] + 0.5, tz1 + 0.1, L.CUT, B, 'Door hinge slot')
    return occ


def chassis_nose():
    occ = L.find_occurrence('Chassis')
    c = occ.component
    B = [L.body_by_name(c, 'Chassis')]
    z0 = P.FLOOR_Z0
    lx, ly = P.LINE_C
    ph, py0, py1, pz = P.NOSE_POCKET
    # pocket from below for the line-sensor board (slicer bridges it front-to-back, 25 mm)
    L.box(c, -ph, py0, z0 - 1, ph, py1, pz, L.CUT, B, 'Line sensor pocket')
    top = P.NOSE_TOP
    # mounting slots for the M3 holes (51.6 mm apart; any spacing 40 .. 56 mm)
    sk = L.sketch(c, L.plane_xy(c, pz - 0.5), 'Line sensor slots')
    yh = ly + P.LINE_HOLE_DY
    for s, _ in S(1):
        L.slot(sk, s * P.LINE_SLOT_X[0], yh, s * P.LINE_SLOT_X[1], yh, 3.4, pz - 0.5)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(s * sum(P.LINE_SLOT_X) / 2, yh, pz - 0.5) for s in (1, -1)]), top - pz + 1, L.CUT, (0, 0, 1), B, 'Line sensor slots')
    # windows over the three green LEDs, and the cable pass-through
    w, hh = P.LINE_LED_WIN
    yl = ly + P.LINE_LED_DY
    sk = L.sketch(c, L.plane_xy(c, pz - 0.5), 'LED windows')
    for x in P.LINE_LEDS:
        L.rounded_poly(sk, [(x - w / 2, yl - hh / 2), (x + w / 2, yl - hh / 2), (x + w / 2, yl + hh / 2), (x - w / 2, yl + hh / 2)], 1.2, pz - 0.5)
    px, pdy, pw, phh = P.LINE_PLUG
    yp = ly + pdy
    L.rounded_poly(sk, [(px - pw / 2, yp - phh / 2), (px + pw / 2, yp - phh / 2), (px + pw / 2, yp + phh / 2), (px - pw / 2, yp + phh / 2)], 1.5, pz - 0.5)
    L.done(sk)
    probes = [(x, yl, pz - 0.5) for x in P.LINE_LEDS] + [(px, yp, pz - 0.5)]
    L.extrude(c, sk, L.profiles_at(sk, probes), top - pz + 1, L.CUT, (0, 0, 1), B, 'LED windows')
    # bezel screws from below through the nose side walls (counterbored)
    sk = L.sketch(c, L.plane_xy(c, z0 - 0.5), 'Bezel screws')
    for (x, y) in P.BEZEL_SCREWS:
        L.circle(sk, x, y, z0 - 0.5, 3.4)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), top - z0 + 1, L.CUT, (0, 0, 1), B, 'Bezel screw holes')

    # zip-tie slot pairs (strain relief for the fragile JST SH plugs)
    sk = L.sketch(c, L.plane_xy(c, z0 - 0.5), 'Zip-tie slots')
    probes = []
    for (x, y) in P.TIE_SLOTS:
        for dx in (-3.0, 3.0):
            L.rect(sk, x + dx - 0.9, y - 1.5, x + dx + 0.9, y + 1.5, z0 - 0.5)
            probes.append((x + dx, y, z0 - 0.5))
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, probes), 13.0, L.CUT, (0, 0, 1), B, 'Zip-tie slots')
    return occ


def chassis_rear():
    occ = L.find_occurrence('Chassis')
    c = occ.component
    B = [L.body_by_name(c, 'Chassis')]
    y0 = P.BODY_Y0
    # LEGO Technic row through the rear wall
    sk = L.sketch(c, L.plane_xz(c, y0 - 1.0), 'LEGO row')
    xs = [k * P.LEGO_PITCH for k in range(-int(P.LEGO_ROW_X / P.LEGO_PITCH), int(P.LEGO_ROW_X / P.LEGO_PITCH) + 1)]
    for x in xs:
        L.circle(sk, x, y0 - 1.0, P.LEGO_ROW_Z, P.LEGO_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y0 - 1.0, P.LEGO_ROW_Z) for x in xs]), P.REAR_WALL_T + 2.0, L.CUT, (0, 1, 0), B, 'LEGO row')
    # Plastal-Bot logo on the rear face (reads correctly from behind: +X is right)
    w, zc = P.LOGO_PB
    import json
    d = json.load(open(P.ART_DIR + '/plastalbot.json'))
    hh = d['height'] * w / d['width']
    L.logo(c, P.ART_DIR + '/plastalbot.json', lambda u, v: (u - w / 2, y0, zc + hh / 2 - v), w, P.DEBOSS, (0, 1, 0), B, 'Plastal-Bot logo')
    return occ


def chassis_finish():
    occ = L.find_occurrence('Chassis')
    c = occ.component
    body = L.body_by_name(c, 'Chassis')
    n = L.bed_chamfer(c, body, 'z', P.FLOOR_Z0, -1, 0.5, 'Bed chamfer')
    return occ, n


# ================================================================ side pods
def build_pod(s):
    name = 'Side pod R' if s > 0 else 'Side pod L'
    L.delete_component(name)
    occ = L.new_component(name)
    c = occ.component
    xo, xi = s * P.POD_OUT, s * P.CH_HALF
    z0, zt = P.FLOOR_Z0, P.BELT_Z
    y0, y1 = P.BODY_Y0, P.BODY_Y1
    # side silhouette: rounded box + fender bump, minus the wheel well
    sk = L.sketch(c, L.plane_yz(c, xo), 'Pod silhouette')
    L.rounded_poly(sk, [(y0, z0), (y1, z0), (y1, zt), (y0, zt)], [P.POD_BOT_R, P.POD_BOT_R, P.POD_TOP_R, P.POD_TOP_R], plane='yz', fixed=xo)
    L.circle(sk, xo, 0, P.AXLE_Z, 2 * P.FENDER_R)
    L.circle(sk, xo, 0, P.AXLE_Z, 2 * P.WELL_R)
    L.done(sk)
    mid = (P.WELL_R + P.FENDER_R) / 2
    probes = [(xo, -60, 30), (xo, 45, 30), (xo, -mid, P.AXLE_Z), (xo, mid, P.AXLE_Z), (xo, 0, P.AXLE_Z + mid)]
    f = L.extrude(c, sk, L.profiles_at(sk, probes), P.POD_OUT - P.CH_HALF, L.NEW, (-s, 0, 0), name='Pod')
    bl = [f.bodies.item(k) for k in range(f.bodies.count)]
    body = bl[0]
    if len(bl) > 1:
        tools = adsk.core.ObjectCollection.create()
        for b in bl[1:]:
            tools.add(b)
        c.features.combineFeatures.add(c.features.combineFeatures.createInput(body, tools))
    body.name = name
    B = [body]
    # blend the fender into the flat top
    yb = math.sqrt(P.FENDER_R ** 2 - (zt - P.AXLE_Z) ** 2)
    edges = L.edges_where(body, lambda x, y, z: abs(abs(y) - yb) < 0.4 and abs(z - zt) < 0.4)
    L.fillet(c, edges, P.FENDER_BLEND_R, 'Fender blend')
    # hollow the front and rear sections from the open inboard side
    wl = P.POD_WALL
    sk = L.sketch(c, L.plane_yz(c, xi), 'Pod pockets')
    L.rounded_poly(sk, [(y0 + wl, z0 + wl), (y1 - wl, z0 + wl), (y1 - wl, zt - wl), (y0 + wl, zt - wl)], [2, 2, P.POD_TOP_R - wl, P.POD_TOP_R - wl], plane='yz', fixed=xi)
    L.circle(sk, xi, 0, P.AXLE_Z, 2 * (P.WELL_R + wl))
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(xi, -60, 30), (xi, 45, 30)]), P.POD_OUT - P.CH_HALF - wl, L.CUT, (s, 0, 0), B, 'Pod pockets')
    # stiffening rib and screw bosses (screws go along X into the chassis columns)
    x0, x1 = sorted((xi, s * (P.POD_OUT - wl)))
    L.box(c, x0, P.POD_RIB_Y - 1, z0 + wl, x1, P.POD_RIB_Y + 1, zt - wl, L.JOIN, B, 'Pod rib')
    sk = L.sketch(c, L.plane_yz(c, xi), 'Pod bosses')
    for (_, y) in P.COLUMNS:
        L.circle(sk, xi, y, P.POD_SCREW_Z, 9.0)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(xi, y, P.POD_SCREW_Z) for (_, y) in P.COLUMNS]), P.POD_OUT - P.CH_HALF - wl, L.JOIN, (s, 0, 0), B, 'Pod boss')
    L.bed_chamfer(c, body, 'x', xo, s, 0.6, 'Outer edge chamfer')
    sk = L.sketch(c, L.plane_yz(c, xo), 'Pod screw holes')
    for (_, y) in P.COLUMNS:
        L.circle(sk, xo, y, P.POD_SCREW_Z, 3.4)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.POD_OUT - P.CH_HALF + 1, L.CUT, (-s, 0, 0), B, 'Pod screw holes')
    sk = L.sketch(c, L.plane_yz(c, xo), 'Pod counterbores')
    for (_, y) in P.COLUMNS:
        L.circle(sk, xo, y, P.POD_SCREW_Z, 6.5)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 3.0, L.CUT, (-s, 0, 0), B, 'Pod counterbores')
    # RoboCore logo on the outside of the rear section
    w = 34.0
    zc, yc = 36.0, -55.0
    import json
    d = json.load(open(P.ART_DIR + '/robocore.json'))
    hh = d['height'] * w / d['width']
    # seen from outside, "right" is +Y on the right pod and -Y on the left pod
    L.logo(c, P.ART_DIR + '/robocore.json', lambda u, v: (xo, yc + s * (u - w / 2), zc + hh / 2 - v), w, P.DEBOSS, (-s, 0, 0), B, 'Side logo')
    return occ


def build_pods():
    build_pod(1)
    build_pod(-1)


# =============================================================== bumper ring
def build_ring():
    L.delete_component('Bumper ring')
    occ = L.new_component('Bumper ring')
    c = occ.component
    h, y0, y1, r = P.CH_HALF, P.BODY_Y0, P.BODY_Y1, P.BODY_R
    rz0, rz1 = P.RING_Z
    bx, by, br = P.BOARD_OPEN
    nh = P.NOSE_HALF
    sk = L.sketch(c, L.plane_xy(c, rz0), 'Ring plate')
    L.rounded_poly(sk, [(-h, y0), (h, y0), (h, y1), (-h, y1)], r, rz0)
    L.rounded_poly(sk, [(-bx, -by), (bx, -by), (bx, by), (-bx, by)], br, rz0)
    L.rect(sk, -nh, by - 2.0, nh, y1 + 4.0, rz0)
    L.done(sk)
    body = L.extrude(c, sk, L.profiles_at(sk, [(45, 0, rz0)]), rz1 - rz0, L.NEW, (0, 0, 1), name='Ring plate').bodies.item(0)
    body.name = 'Bumper ring'
    B = [body]
    # perimeter skirt down to the chassis walls
    t = P.RING_SKIRT_T
    sk = L.sketch(c, L.plane_xy(c, rz0), 'Ring skirt')
    L.rounded_poly(sk, [(-h, y0), (h, y0), (h, y1), (-h, y1)], r, rz0)
    L.rounded_poly(sk, [(-h + t, y0 + t), (h - t, y0 + t), (h - t, y1 - t), (-h + t, y1 - t)], r - t, rz0)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(h - t / 2, 0, rz0)]), rz0 - P.RING_SKIRT_Z0, L.JOIN, (0, 0, -1), B, 'Ring skirt')
    # bosses that sit on the chassis columns
    cols = [(s * x, y) for (x, y) in P.COLUMNS for s in (1, -1)]
    L.cyl_z(c, cols, P.COLUMN_D, rz0, P.RING_SKIRT_Z0, L.JOIN, B, 'Ring boss')
    L.box(c, -nh, by - 2.0, P.RING_SKIRT_Z0 - 1, nh, y1 + 4.0, rz1 + 1, L.CUT, B, 'Nose opening')
    # lever slot, cable notches, rear cable comb, USB-C / XT30 notch
    lx0, lx1, ly0, ly1 = P.LEVER_SLOT
    sk = L.sketch(c, L.plane_xy(c, rz1 + 0.5), 'Ring cut-outs')
    L.rounded_poly(sk, [(lx0, ly0), (lx1, ly0), (lx1, ly1), (lx0, ly1)], [0, 2.5, 2.5, 0], rz1 + 0.5)
    mx0, mx1, my0, my1 = P.MOTOR_NOTCH
    for s, _ in S(1):
        xa, xb = sorted((s * mx0, s * mx1))
        rr = [0, 2, 2, 0] if s > 0 else [2, 0, 0, 2]
        L.rounded_poly(sk, [(xa, my0), (xb, my0), (xb, my1), (xa, my1)], rr, rz1 + 0.5)
    for (xc, wd) in P.COMB_SLOTS:
        L.rounded_poly(sk, [(xc - wd / 2, P.COMB_DEPTH), (xc + wd / 2, P.COMB_DEPTH), (xc + wd / 2, -by + 1), (xc - wd / 2, -by + 1)], [2, 2, 0, 0], rz1 + 0.5)
    nx0, nx1, ny = P.REAR_NOTCH
    L.rounded_poly(sk, [(nx0, ny), (nx1, ny), (nx1, -by + 1), (nx0, -by + 1)], [3, 3, 0, 0], rz1 + 0.5)
    L.done(sk)
    probes = [((lx0 + lx1) / 2, (ly0 + ly1) / 2, rz1 + 0.5)]
    probes += [(s * (mx0 + mx1) / 2, (my0 + my1) / 2, rz1 + 0.5) for s in (1, -1)]
    probes += [(xc, (P.COMB_DEPTH - by) / 2, rz1 + 0.5) for (xc, wd) in P.COMB_SLOTS]
    probes += [((nx0 + nx1) / 2, (ny - by) / 2, rz1 + 0.5)]
    L.extrude(c, sk, L.profiles_at(sk, probes), rz1 - P.RING_SKIRT_Z0 + 1.5, L.CUT, (0, 0, -1), B, 'Ring cut-outs')
    # screw holes, counterbored from the top
    L.cyl_z(c, cols, 3.4, rz1 + 0.5, P.RING_SKIRT_Z0 - 0.5, L.CUT, B, 'Ring screw holes')
    L.cyl_z(c, cols, 6.5, rz1 + 0.5, rz1 - 1.5, L.CUT, B, 'Ring counterbores')
    L.bed_chamfer(c, body, 'z', rz1, 1, 0.5, 'Top edge chamfer')
    return occ


# =============================================================== front bezel
def build_bezel():
    L.delete_component('Front bezel')
    occ = L.new_component('Front bezel')
    c = occ.component
    yf, t = P.BEZEL_FACE_Y, P.BEZEL_T
    hw, zb, ztp = P.BEZEL_HALF, P.BEZEL_BOTTOM, P.BEZEL_TOP
    yb = P.BEZEL_BACK_Y
    ny1 = P.NOSE_Y[1] + 0.5
    # solid block from the face outline, then the nose cut-out, then shell (open at the back)
    sk = L.sketch(c, L.plane_xz(c, yf), 'Bezel outline')
    L.rounded_poly(sk, [(-hw, zb), (hw, zb), (hw, ztp), (-hw, ztp)], [3, 3, 8, 8], plane='xz', fixed=yf)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), yf - yb, L.NEW, (0, -1, 0), name='Bezel block').bodies.item(0)
    body.name = 'Front bezel'
    B = [body]
    L.box(c, -hw - 1, yb - 1, zb - 1, hw + 1, ny1, P.NOSE_TOP, L.CUT, B, 'Nose clearance')
    back = L.face_at(body, 'y', yb, -1)
    L.shell(c, [back], t, 'Bezel shell')
    # transducer "eyes" with a 45-degree bevel
    cans = [(-P.US_CAN_X, P.US_CZ), (P.US_CAN_X, P.US_CZ)]
    sk = L.sketch(c, L.plane_xz(c, yf + 0.5), 'Eyes')
    for (x, z) in cans:
        L.circle(sk, x, yf + 0.5, z, P.EYE_HOLE)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, yf + 0.5, z) for (x, z) in cans]), t + 1.5, L.CUT, (0, -1, 0), B, 'Eye holes')
    eye_edges = L.edges_where(body, lambda x, y, z: abs(y - yf) < 0.05 and min(math.hypot(x - cx, z - cz) for (cx, cz) in cans) < P.EYE_HOLE / 2 + 0.2)
    L.chamfer(c, eye_edges, P.EYE_BEVEL, 'Eye bevel')
    # PCB bosses (M2 self-tapping), clear of the cans
    pcb_back = yf - t
    pts = [(x, P.US_CZ + z) for (x, z) in P.US_HOLES]
    sk = L.sketch(c, L.plane_xz(c, pcb_back), 'Ultrasonic bosses')
    for (x, z) in pts:
        L.circle(sk, x, pcb_back, z, P.US_BOSS_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, pcb_back, z) for (x, z) in pts]), pcb_back - P.US_UNDER_Y, L.JOIN, (0, -1, 0), B, 'Ultrasonic boss')
    sk = L.sketch(c, L.plane_xz(c, P.US_UNDER_Y), 'Ultrasonic pilots')
    for (x, z) in pts:
        L.circle(sk, x, P.US_UNDER_Y, z, P.US_PILOT_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, P.US_UNDER_Y, z) for (x, z) in pts]), pcb_back - P.US_UNDER_Y + 1.0, L.CUT, (0, 1, 0), B, 'Ultrasonic pilots')
    # screw bosses on the bezel floor, inserts from below
    L.cyl_z(c, P.BEZEL_SCREWS, 6.0, P.NOSE_TOP, P.NOSE_TOP + 6.0, L.JOIN, B, 'Bezel boss')
    L.cyl_z(c, P.BEZEL_SCREWS, P.INSERT_M3_D, P.NOSE_TOP, P.NOSE_TOP + P.INSERT_M3_DEPTH, L.CUT, B, 'Bezel inserts')
    # face edges sit on the bed: small chamfer on the outline only
    outline = L.edges_where(body, lambda x, y, z: abs(y - yf) < 0.05 and (abs(x) > hw - 6 or z < zb + 4 or z > ztp - 9)
                           and min(math.hypot(x - cx, z - cz) for (cx, cz) in cans) > 11.0)
    L.chamfer(c, outline, 0.6, 'Face chamfer')
    # RoboCore logo under the eyes (reads from the front: robot -X is right)
    w, zc = P.LOGO_RC
    import json
    d = json.load(open(P.ART_DIR + '/robocore.json'))
    hh = d['height'] * w / d['width']
    L.logo(c, P.ART_DIR + '/robocore.json', lambda u, v: (w / 2 - u, yf, zc + hh / 2 - v), w, P.DEBOSS, (0, -1, 0), B, 'Front logo')
    return occ


# ====================================================== battery door, spacer
def build_door():
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
    bl = [f.bodies.item(k) for k in range(f.bodies.count)]
    body = bl[0]
    if len(bl) > 1:
        tools = adsk.core.ObjectCollection.create()
        for b in bl[1:]:
            tools.add(b)
        c.features.combineFeatures.add(c.features.combineFeatures.createInput(body, tools))
    body.name = 'Battery door'
    B = [body]
    tl, tz0, tz1 = P.DOOR_TONGUE
    for (a, b) in P.DOOR_TONGUES:
        for s, _ in S(1):
            x0, x1 = sorted((s * a, s * b))
            L.box(c, x0, by0 + g - tl, tz0, x1, by0 + g + 1.0, tz1, L.JOIN, B, 'Hinge tongue')
    L.cyl_z(c, [(0, P.DOOR_SCREW_Y)], 3.4, z0 - 0.5, zt + 0.5, L.CUT, B, 'Thumb screw hole')
    rb = P.BALL_D / 2
    L.cyl_z(c, [(0, P.CASTER_Y)], 2 * math.sqrt(rb * rb - (z0 - rb) ** 2) + 2.0, z0 - 0.5, zt + 0.5, L.CUT, B, 'Caster notch')
    # safety marking on the outside (reads from below with the robot nose up)
    L.bed_chamfer(c, body, 'z', z0, -1, 0.5, 'Bed chamfer')
    try:
        L.text_deboss(c, L.plane_xy(c, z0), '1S Li-ion  4.2 V max', 3.5, (0, -20, z0), (-1, 0, 0), (0, 1, 0), 0.5, (0, 0, 1), B, 'Door marking', 'Arial')
    except Exception as e:
        L.app.log('door text failed: %s' % e)
    return occ


def build_spacer():
    L.delete_component('1S2P spacer')
    occ = L.new_component('1S2P spacer')
    c = occ.component
    zt0, zt1 = P.DOOR_TOP, P.SPACER_TOP
    ya, yb = P.PACK_Y[0] + 0.5, P.PACK_Y[1]
    xi, xo = P.SPACER_IN, P.PACK_RIB_X - 0.3
    bodies = []
    f = L.box(c, xi, ya, zt0, xi + 2.0, yb, zt1, L.NEW, None, 'Spacer')
    body = f.bodies.item(0)
    body.name = '1S2P spacer'
    B = [body]
    L.box(c, -xi - 2.0, ya, zt0, -xi, yb, zt1, L.JOIN, B, 'Spacer')
    for s, _ in S(1):
        x0, x1 = sorted((s * xi, s * xo))
        L.box(c, x0, ya, zt0, x1, ya + 2.0, zt1, L.JOIN, B, 'Spacer outer')
        for y in (-40.0, -15.0, 8.0):
            L.box(c, x0, y - 1.0, zt0, x1, y + 1.0, zt1, L.JOIN, B, 'Spacer rib')
        L.box(c, x0, yb - 2.0, zt0, x1, yb, zt1, L.JOIN, B, 'Spacer outer')
    L.box(c, -xo, yb, zt0, xo, P.BAY_Y[1] - 0.5, zt0 + 4.0, L.JOIN, B, 'Spacer bridge')
    rest = [bb for bb in c.bRepBodies if bb != body]
    if rest:
        tools = adsk.core.ObjectCollection.create()
        for bb in rest:
            tools.add(bb)
        c.features.combineFeatures.add(c.features.combineFeatures.createInput(body, tools)).name = 'Spacer combine'
    occ.isLightBulbOn = False          # alternative to the 1S3P pack: shown only when needed
    return occ


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
    # 8 access holes: two always line up with the motor screws (2 mm hex key)
    sk = L.sketch(c, L.plane_xy(c, P.WEB_Z0 - 0.5), 'Access holes')
    pts = []
    for k in range(8):
        a = math.radians(22.5 + 45 * k)
        pts.append((P.ACCESS_R * math.cos(a), P.ACCESS_R * math.sin(a)))
        L.circle(sk, pts[-1][0], pts[-1][1], P.WEB_Z0 - 0.5, P.ACCESS_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, P.WEB_Z0 - 0.5) for (x, y) in pts]), P.WEB_T + 1, L.CUT, (0, 0, 1), B, 'Access holes')
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
    pin.quantity = adsk.core.ValueInput.createByReal(40)
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
    L.delete_component('Caster')
    L.delete_component('Caster ball')
    occ = L.new_component('Caster')
    c = occ.component
    z0 = P.FLOOR_Z0
    yc = P.CASTER_Y
    zc = P.BALL_D / 2
    sx = P.CASTER_SCREW_X
    sk = L.sketch(c, L.plane_xy(c, z0 - 3.0), 'Caster flange')
    L.rounded_poly(sk, [(-sx - 5, yc - 6), (sx + 5, yc - 6), (sx + 5, yc + 6), (-sx - 5, yc + 6)], 5.0, z0 - 3.0)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), 3.0, L.NEW, (0, 0, 1), name='Caster flange').bodies.item(0)
    body.name = 'Caster'
    B = [body]
    L.cyl_z(c, [(0, yc)], P.CASTER_CUP_D, P.CASTER_LIP_Z, z0, L.JOIN, B, 'Caster cup')
    sk = L.sketch(c, c.yZConstructionPlane, 'Ball cavity')
    rr = (P.BALL_D + 0.6) / 2
    arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, 0, yc, zc), L.sp(sk, 0, yc, zc + rr), math.pi)
    ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
    L.done(sk)
    L.revolve(c, L.all_profiles(sk), ax, L.CUT, B, 'Ball cavity')
    for ang in (0, 90):
        sk = L.sketch(c, L.plane_xy(c, P.CASTER_LIP_Z - 0.5), 'Slit')
        a = math.radians(ang)
        ux, uy = math.cos(a), math.sin(a)
        w, l = 0.6, P.CASTER_CUP_D / 2 + 1
        pts = [(-ux * l - uy * w, yc - uy * l + ux * w), (ux * l - uy * w, yc + uy * l + ux * w),
               (ux * l + uy * w, yc + uy * l - ux * w), (-ux * l + uy * w, yc - uy * l - ux * w)]
        L.poly(sk, [(x, y, P.CASTER_LIP_Z - 0.5) for (x, y) in pts])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), 5.5, L.CUT, (0, 0, 1), B, 'Slit')
    sk = L.sketch(c, L.plane_xy(c, z0 - 3.0), 'Caster screws')
    for s in (1, -1):
        L.circle(sk, s * sx, yc, z0 - 3.0, 3.4)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 3.5, L.CUT, (0, 0, 1), B, 'Screw holes')

    bocc = L.new_component('Caster ball')
    bc = bocc.component
    sk = L.sketch(bc, bc.yZConstructionPlane, 'Ball')
    rb = P.BALL_D / 2
    arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, 0, yc, zc), L.sp(sk, 0, yc, zc + rb), math.pi)
    ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
    L.done(sk)
    f = L.revolve(bc, L.all_profiles(sk), ax, L.NEW, name='Ball')
    f.bodies.item(0).name = 'Ball 16 mm'
    return occ


# ======================================================== reference parts
def build_pack():
    L.delete_component('1S3P pack (reference)')
    occ = L.new_component('1S3P pack (reference)')
    c = occ.component
    w, l, hgt = P.PACK3
    y0, y1 = P.PACK_Y
    z0 = P.DOOR_TOP
    # three wrapped cells side by side + the protection board at the back
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
    # STEP origin = board centre, underside at z 0, chamfered edge (+Y) forward
    x, y = P.LINE_C
    return _insert(LINE_FILE_ID, L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (x, y, P.LINE_UNDER_Z)), 'RoboCore_LineSensor')


def place_ultrasonic():
    # board X -> robot X (TX at +X: viewer's left from the front), board Y -> up,
    # board Z (top, connector) -> backwards; transducers on the underside face forward
    m = L.matrix([(1, 0, 0), (0, 0, 1), (0, -1, 0)], (0, P.US_UNDER_Y, P.US_CZ))
    return _insert(US_FILE_ID, m, 'RoboCore_Ultrasonic')


# ============================================================ finishing
def finish_edges():
    """R1-1.5 fillets on visible edges that are on top in the print orientation
    (bed-facing edges already carry 0.5-0.6 mm chamfers)."""
    out = []
    for name, s in (('Side pod R', 1), ('Side pod L', -1)):
        occ = L.find_occurrence(name)
        c = occ.component
        body = c.bRepBodies.item(0)
        e = L.edges_where(body, lambda x, y, z: abs(abs(x) - P.CH_HALF) < 0.05 and z > P.BELT_Z - 0.6)
        out.append('%s top-inner %d/%d' % (name, L.fillet(c, e, 1.5, 'Inner edge fillet'), e.count))
    occ = L.find_occurrence('Front bezel')
    c = occ.component
    body = c.bRepBodies.item(0)
    e = L.edges_where(body, lambda x, y, z: abs(y - P.BEZEL_BACK_Y) < 0.05 and (z > P.BEZEL_TOP - 0.6 or abs(abs(x) - P.BEZEL_HALF) < 0.05))
    out.append('bezel back %d/%d' % (L.fillet(c, e, 1.0, 'Back edge fillet'), e.count))
    return '; '.join(out)


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
    return name


STEPS = {
    'motor_import': import_motor,
    'motors': place_motors,
    'chassis': chassis_base,
    'chassis_upper': chassis_upper,
    'chassis_holes': chassis_holes,
    'chassis_nose': chassis_nose,
    'chassis_rear': chassis_rear,
    'chassis_finish': chassis_finish,
    'pod_r': lambda: build_pod(1),
    'pod_l': lambda: build_pod(-1),
    'ring': build_ring,
    'bezel': build_bezel,
    'door': build_door,
    'spacer': build_spacer,
    'wheel': build_wheel,
    'tyre': build_tyre,
    'wheels': place_wheels,
    'caster': build_caster,
    'pack': build_pack,
    'board': place_board,
    'line': place_line_sensor,
    'ultrasonic': place_ultrasonic,
    'finish': finish_edges,
    'teal': lambda: apply_scheme('teal'),
    'orange': lambda: apply_scheme('orange'),
}
ALL = ['motor_import', 'motors', 'chassis', 'chassis_upper', 'chassis_holes', 'chassis_nose', 'chassis_rear',
       'chassis_finish', 'pod_r', 'pod_l', 'ring', 'bezel', 'door', 'spacer', 'wheel', 'tyre', 'wheels',
       'caster', 'pack', 'board', 'line', 'ultrasonic', 'finish', 'teal']


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
