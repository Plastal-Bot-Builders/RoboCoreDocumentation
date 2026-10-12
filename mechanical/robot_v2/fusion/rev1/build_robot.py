"""Builds the RoboCore V2 robot (XRP-inspired) in the active Fusion design.

Run from Fusion (Scripts and Add-Ins, or the Fusion MCP) with:
    import sys; sys.path.insert(0, '<this folder>'); import build_robot; build_robot.main()
Each step deletes and rebuilds its own component, so steps can be re-run.
"""
import math
import adsk.core
import adsk.fusion

import rc_lib as L
import rc_params as P

BOARD_FILE_ID = 'urn:adsk.wipprod:dm.lineage:MH3mPskERmKwCFQbVIab9Q'      # RoboCore_V2 (STEP of the PCB)
HCSR04_FILE_ID = 'urn:adsk.wipprod:dm.lineage:B5p7145mS8e60-xYfAjm5Q'     # HCSR04 Ultrasonic Sensor
MOTOR_COMPONENT = 'TT DC Gear Motor with Encoder (Blue)'

COLOURS = {
    'chassis': (242, 140, 40),     # RoboCore orange
    'wheel': (205, 205, 210),
    'tyre': (18, 18, 18),
    'caster': (40, 40, 44),
    'ball': (200, 200, 205),
    'battery': (30, 90, 170),
    'line': (20, 60, 140),
}


def mirror_x(pts):
    return [(-x, y) for (x, y) in pts]


# =============================================================== chassis
def build_chassis():
    L.delete_component('Chassis')
    occ = L.new_component('Chassis')
    c = occ.component
    z0, fz = P.FLOOR_Z0, P.FZ
    fh, mh = P.FLOOR_HALF, P.FLOOR_MOTOR_HALF
    y0, y1 = P.FLOOR_Y0, P.FLOOR_Y1

    # 1 floor plate
    sk = L.sketch(c, L.plane_xy(c, z0), 'Floor outline')
    pts = [(-fh, y0), (fh, y0), (fh, -54.0), (mh, -54.0), (mh, 11.0), (fh, 11.0), (fh, 34.0),
           (P.US_PLATE_HALF, y1), (-P.US_PLATE_HALF, y1), (-fh, 34.0), (-fh, 11.0), (-mh, 11.0),
           (-mh, -54.0), (-fh, -54.0)]
    radii = [5, 5, 2, 4, 4, 2, 6, 5, 5, 6, 2, 4, 4, 2]
    L.rounded_poly(sk, pts, radii, z0)
    L.done(sk)
    f = L.extrude(c, sk, L.largest_profile(sk), fz - z0, L.NEW, (0, 0, 1), name='Floor')
    body = f.bodies.item(0)
    body.name = 'Chassis'
    B = [body]

    # 2 motor pads (motor sits 0.25 above them)
    for s in (1, -1):
        x0, x1 = sorted((s * P.MOTOR_IN, s * mh))
        L.box(c, x0, P.MOTOR_PAD_Y[0], fz, x1, P.MOTOR_PAD_Y[1], P.MOTOR_BOTTOM - 0.25, L.JOIN, B, 'Motor pad')

    # 3 inner walls the motors bolt to
    for s in (1, -1):
        x0, x1 = sorted((s * (P.MOTOR_IN - P.WALL_T), s * P.MOTOR_IN))
        L.box(c, x0, P.WALL_Y[0], fz, x1, P.WALL_Y[1], P.WALL_TOP, L.JOIN, B, 'Motor wall')

    # 4 bosses around the TT mounting holes (heat-set inserts from the motor side)
    hole_yz = [(mY - P.M_SHAFT_Y, P.AXLE_Z - mX) for (mX, mY) in P.M_HOLES]
    for s in (1, -1):
        xin = s * (P.MOTOR_IN - 7.0)
        sk = L.sketch(c, L.plane_yz(c, xin), 'Motor boss')
        for (y, z) in hole_yz:
            L.circle(sk, xin, y, z, P.MOTOR_BOSS_D)
        L.done(sk)
        profs = L.profiles_at(sk, [(xin, y, z) for (y, z) in hole_yz])
        L.extrude(c, sk, profs, 7.0, L.JOIN, (s, 0, 0), B, 'Motor boss')

    # 5 board pillars: wide body below the pin tails, 5 mm top under the board
    L.cyl_z(c, P.BOARD_HOLES, P.PILLAR_D, fz, P.BOARD_Z - P.PILLAR_TOP_H, L.JOIN, B, 'Board pillar')
    L.cyl_z(c, P.BOARD_HOLES, P.PILLAR_TOP_D, P.BOARD_Z - P.PILLAR_TOP_H, P.BOARD_Z, L.JOIN, B, 'Board pillar top')

    # 6 battery tunnel: side walls, roof deck, front stop
    for s in (1, -1):
        x0, x1 = sorted((s * P.BATT_HALF_IN, s * (P.BATT_HALF_IN + P.BATT_WALL)))
        L.box(c, x0, P.BATT_Y[0], fz, x1, P.BATT_Y[1], P.BATT_WALL_TOP, L.JOIN, B, 'Battery wall')
    L.box(c, -P.MOTOR_IN, P.DECK_Y[0], P.DECK_Z[0], P.MOTOR_IN, P.DECK_Y[1], P.DECK_Z[1], L.JOIN, B, 'Deck')
    h = P.BATT_HALF_IN + P.BATT_WALL
    L.box(c, -h, P.STOP_Y[0], fz, h, P.STOP_Y[1], P.BATT_WALL_TOP, L.JOIN, B, 'Battery stop')

    # 7 caster bosses (inserts pressed in from below)
    cpts = [(P.CASTER_SCREW_X, P.CASTER_Y), (-P.CASTER_SCREW_X, P.CASTER_Y)]
    L.cyl_z(c, cpts, 8.0, fz, fz + 6.0, L.JOIN, B, 'Caster boss')

    # 8 nose: HC-SR04 face plate with gussets
    py0, py1 = P.US_PLATE_Y
    L.box(c, -P.US_PLATE_HALF, py0, fz, P.US_PLATE_HALF, py1, P.US_PLATE_TOP, L.JOIN, B, 'Sensor plate')
    for s in (1, -1):
        gx = s * (P.US_PLATE_HALF - 1.5)
        sk = L.sketch(c, L.plane_yz(c, gx), 'Gusset')
        L.poly(sk, [(gx, py0 - 11.0, fz), (gx, py0, fz), (gx, py0, 36.0)])
        L.done(sk)
        L.extrude_sym(c, L.all_profiles(sk), 3.0, L.JOIN, B, 'Gusset')
    # PCB bosses on the back of the plate
    sk = L.sketch(c, L.plane_xz(c, py0), 'HC-SR04 bosses')
    bpts = [(x, P.US_PCB_CZ + z) for (x, z) in P.US_PCB_HOLES]
    for (x, z) in bpts:
        L.circle(sk, x, py0, z, P.US_BOSS_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, py0, z) for (x, z) in bpts]), P.US_BOSS_H, L.JOIN, (0, -1, 0), B, 'HC-SR04 boss')

    # ---- cuts -----------------------------------------------------------
    # transducer holes
    sk = L.sketch(c, L.plane_xz(c, py0 - 1.0), 'HC-SR04 can holes')
    cans = [(-P.US_CAN_X, P.US_PCB_CZ), (P.US_CAN_X, P.US_PCB_CZ)]
    for (x, z) in cans:
        L.circle(sk, x, py0 - 1.0, z, P.US_CAN_HOLE)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, py0 - 1.0, z) for (x, z) in cans]), 5.0, L.CUT, (0, 1, 0), B, 'Can holes')
    # self-tapping pilots for the HC-SR04 screws (M2 x 6)
    sk = L.sketch(c, L.plane_xz(c, py0 - P.US_BOSS_H), 'HC-SR04 pilots')
    for (x, z) in bpts:
        L.circle(sk, x, py0 - P.US_BOSS_H, z, P.US_PILOT_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, py0 - P.US_BOSS_H, z) for (x, z) in bpts]), 4.5, L.CUT, (0, 1, 0), B, 'HC-SR04 pilots')

    # relief windows for the round motor can (it bulges 2.3 mm past the gearbox face)
    wy0, wy1, wz0, wz1 = P.WALL_WINDOW
    for s in (1, -1):
        x0, x1 = sorted((s * (P.MOTOR_IN - P.WALL_T - 1.0), s * (P.MOTOR_IN + 1.0)))
        L.box(c, x0, wy0, wz0, x1, wy1, wz1, L.CUT, B, 'Motor can relief')
    # window for the HC-SR04 crystal (sits 3 mm proud on the front of its PCB)
    hw, cz0, cz1 = P.US_CRYSTAL_WIN
    L.box(c, -hw, py0 - 1.0, P.US_PCB_CZ + cz0, hw, py1 + 1.0, P.US_PCB_CZ + cz1, L.CUT, B, 'Crystal window')

    # board pillar insert holes
    sk = L.sketch(c, L.plane_xy(c, P.BOARD_Z), 'Board insert holes')
    for (x, y) in P.BOARD_HOLES:
        L.circle(sk, x, y, P.BOARD_Z, P.INSERT_M2_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, P.BOARD_Z) for (x, y) in P.BOARD_HOLES]), P.INSERT_M2_DEPTH, L.CUT, (0, 0, -1), B, 'Board inserts')

    # motor insert holes
    for s in (1, -1):
        xf = s * P.MOTOR_IN
        sk = L.sketch(c, L.plane_yz(c, xf), 'Motor insert holes')
        for (y, z) in hole_yz:
            L.circle(sk, xf, y, z, P.INSERT_M3_D)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, [(xf, y, z) for (y, z) in hole_yz]), P.INSERT_M3_DEPTH, L.CUT, (-s, 0, 0), B, 'Motor inserts')

    # caster insert holes from below, ball pocket in the floor
    sk = L.sketch(c, L.plane_xy(c, z0), 'Caster holes')
    for (x, y) in cpts:
        L.circle(sk, x, y, z0, P.INSERT_M3_D)
    L.circle(sk, 0.0, P.CASTER_Y, z0, 13.0)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, z0) for (x, y) in cpts]), P.INSERT_M3_DEPTH, L.CUT, (0, 0, 1), B, 'Caster inserts')
    L.extrude(c, sk, L.profiles_at(sk, [(0.0, P.CASTER_Y, z0)]), P.BALL_D + 0.3 - z0, L.CUT, (0, 0, 1), B, 'Ball pocket')

    # wire slots in the nose: HC-SR04 plugs and the line-sensor header
    L.box(c, -5.5, py0 - 8.0, z0 - 1, 5.5, py0 - 1.0, fz + 1, L.CUT, B, 'Ultrasonic wire slot')
    L.box(c, -5.5, 33.0, z0 - 1, 5.5, 42.0, fz + 1, L.CUT, B, 'Line sensor wire hole')
    # line-sensor mounting slots (any hole spacing from 15 to 44 mm)
    sk = L.sketch(c, L.plane_xy(c, z0), 'Line sensor slots')
    for yy in P.LINE_SLOT_Y:
        for s in (1, -1):
            L.slot(sk, s * P.LINE_SLOT_X[0], yy, s * P.LINE_SLOT_X[1], yy, 3.4, z0)
    L.done(sk)
    probe = []
    for yy in P.LINE_SLOT_Y:
        for s in (1, -1):
            probe.append((s * (P.LINE_SLOT_X[0] + P.LINE_SLOT_X[1]) / 2, yy, z0))
    L.extrude(c, sk, L.profiles_at(sk, probe), P.FLOOR_T + 1, L.CUT, (0, 0, 1), B, 'Line sensor slots')

    # LEGO Technic grid (8 mm pitch) at the back for add-ons
    lego = []
    for x in (18.0, 26.0):
        for y in (-58.0, -66.0):
            lego += [(x, y), (-x, y)]
    sk = L.sketch(c, L.plane_xy(c, z0), 'LEGO grid')
    for (x, y) in lego:
        L.circle(sk, x, y, z0, P.LEGO_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, z0) for (x, y) in lego]), P.FLOOR_T + 1, L.CUT, (0, 0, 1), B, 'LEGO holes')

    # zip-tie slot pairs in the deck for the motor and sensor cables
    sk = L.sketch(c, L.plane_xy(c, P.DECK_Z[0] - 0.5), 'Zip-tie slots')
    probe = []
    for (x, y) in P.TIE_SLOTS:
        for dx in (-3.0, 3.0):
            L.rect(sk, x + dx - 0.9, y - 2.0, x + dx + 0.9, y + 2.0, P.DECK_Z[0] - 0.5)
            probe.append((x + dx, y, P.DECK_Z[0] - 0.5))
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, probe), P.DECK_Z[1] - P.DECK_Z[0] + 1.0, L.CUT, (0, 0, 1), B, 'Zip-tie slots')

    # engraved name on the front of the sensor plate
    try:
        engrave_front(c, B)
    except Exception as e:
        L.app.log('engrave failed: %s' % e)

    # ---- battery snap latch: leaf cut out of the floor, hook behind the holder
    lh, lg = P.LATCH_HALF, P.LATCH_GAP
    L.box(c, -lh - lg, y0 - 1.0, z0 - 1, lh + lg, P.LATCH_Y[1], fz + 1, L.CUT, B, 'Latch cut-out')
    L.box(c, -lh, P.LATCH_Y[0], z0, lh, P.LATCH_Y[1], z0 + P.LATCH_T, L.JOIN, B, 'Latch leaf')
    yb = P.BATT_Y[0] - 0.3
    zt = fz + P.LATCH_HOOK_H
    sk = L.sketch(c, L.plane_yz(c, 0.0), 'Latch hook')
    L.poly(sk, [(0, yb, z0 + P.LATCH_T), (0, yb, zt), (0, yb - 1.0, zt), (0, P.LATCH_Y[0] + 0.5, z0 + P.LATCH_T)])
    L.done(sk)
    L.extrude_sym(c, L.all_profiles(sk), 2 * lh, L.JOIN, B, 'Latch hook')

    L.paint(occ, L.appearance('RoboCore orange', COLOURS['chassis']))
    return occ


def engrave_front(c, B):
    yf = P.US_PLATE_Y[1]
    sk = L.sketch(c, L.plane_xz(c, yf), 'Front name')
    L.done(sk)
    w = 44.0
    want_right, want_up = (-1.0, 0.0, 0.0), (0.0, 0.0, 1.0)
    xd, yd = sk.xDirection, sk.yDirection
    sx = xd.x * want_right[0] + xd.y * want_right[1] + xd.z * want_right[2]
    sy = yd.x * want_up[0] + yd.y * want_up[1] + yd.z * want_up[2]
    a = L.sp(sk, w / 2, yf, P.LOGO_Z - P.LOGO_H / 2 - 1)
    d = L.sp(sk, -w / 2, yf, P.LOGO_Z + P.LOGO_H / 2 + 1)
    c1 = adsk.core.Point3D.create(min(a.x, d.x), min(a.y, d.y), 0)
    c2 = adsk.core.Point3D.create(max(a.x, d.x), max(a.y, d.y), 0)
    ti = sk.sketchTexts.createInput2(P.LOGO_TEXT, L.cm(P.LOGO_H))
    ti.setAsMultiLine(c1, c2, adsk.core.HorizontalAlignments.CenterHorizontalAlignment,
                      adsk.core.VerticalAlignments.MiddleVerticalAlignment, 0)
    ti.fontName = 'Arial Black'
    if sx < 0 and sy < 0:
        ti.angle = math.pi
    elif sx < 0:
        ti.isHorizontalFlip = True
    elif sy < 0:
        ti.isVerticalFlip = True
    txt = sk.sketchTexts.add(ti)
    feats = c.features.extrudeFeatures
    inp = feats.createInput(txt, L.CUT)
    n = L.sk_normal(sk)
    dirn = adsk.fusion.ExtentDirections.PositiveExtentDirection if n.y < 0 else adsk.fusion.ExtentDirections.NegativeExtentDirection
    inp.setOneSideExtent(adsk.fusion.DistanceExtentDefinition.create(L.vi(0.6)), dirn)
    inp.participantBodies = list(B)
    feats.add(inp).name = 'Front name'


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
           (rs, fl1 - P.FLANGE_T), (rf, fl1 - P.FLANGE_T), (rf, fl1), (ri, fl1), (ri, wz1), (hr, wz1),
           (hr, P.HUB_LEN), (0, P.HUB_LEN)]
    L.poly(sk, [(r, 0, z) for (r, z) in sec])
    L.done(sk)
    f = L.revolve(c, L.all_profiles(sk), c.zConstructionAxis, L.NEW, name='Wheel')
    body = f.bodies.item(0)
    body.name = 'Wheel'
    B = [body]
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
    # M2 retaining screw through the hub face into the shaft's centre hole
    sk = L.sketch(c, c.xYConstructionPlane, 'Screw hole')
    L.circle(sk, 0, 0, 0, P.WHEEL_SCREW_D)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.HUB_LEN + 1, L.CUT, (0, 0, 1), B, 'Screw hole')
    # 8 access holes: line up two of them with the motor screws, no need to pull the wheel
    sk = L.sketch(c, L.plane_xy(c, P.WEB_Z0 - 0.5), 'Access holes')
    pts = []
    for k in range(8):
        a = math.radians(22.5 + 45 * k)
        pts.append((P.ACCESS_R * math.cos(a), P.ACCESS_R * math.sin(a)))
        L.circle(sk, pts[-1][0], pts[-1][1], P.WEB_Z0 - 0.5, P.ACCESS_D)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(x, y, P.WEB_Z0 - 0.5) for (x, y) in pts]), P.WEB_T + 1, L.CUT, (0, 0, 1), B, 'Access holes')
    L.paint(occ, L.appearance('Wheel grey', COLOURS['wheel']))
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
    f = L.revolve(c, L.all_profiles(sk), c.zConstructionAxis, L.NEW, name='Tyre')
    body = f.bodies.item(0)
    body.name = 'Tyre (TPU)'
    # chevron-free transverse tread: 40 grooves 1.2 wide, 0.8 deep
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
    L.paint(occ, L.appearance('Tyre black', COLOURS['tyre']))
    return occ


def wheel_matrices():
    right = L.matrix([(0, 1, 0), (0, 0, 1), (1, 0, 0)], (P.HUB_FACE_X, 0, P.AXLE_Z))
    left = L.matrix([(0, 1, 0), (0, 0, -1), (-1, 0, 0)], (-P.HUB_FACE_X, 0, P.AXLE_Z))
    return [left, right]


def place_wheels():
    for name in ('Wheel', 'Tyre'):
        occ = L.find_occurrence(name)
        L.fix_name(occ, name)
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
    f = L.extrude(c, sk, L.all_profiles(sk), 3.0, L.NEW, (0, 0, 1), name='Caster flange')
    body = f.bodies.item(0)
    body.name = 'Caster'
    B = [body]
    L.cyl_z(c, [(0, yc)], P.CASTER_CUP_D, P.CASTER_LIP_Z, z0, L.JOIN, B, 'Caster cup')
    # ball cavity
    sk = L.sketch(c, c.yZConstructionPlane, 'Ball cavity')
    rr = (P.BALL_D + 0.6) / 2
    arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, 0, yc, zc), L.sp(sk, 0, yc, zc + rr), math.pi)
    ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
    L.done(sk)
    L.revolve(c, L.all_profiles(sk), ax, L.CUT, B, 'Ball cavity')
    # 4 flex slits so the ball snaps in
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
    # screw holes M3 with counterbore from below
    sk = L.sketch(c, L.plane_xy(c, z0 - 3.0), 'Caster screws')
    for s in (1, -1):
        L.circle(sk, s * sx, yc, z0 - 3.0, 3.4)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 3.5, L.CUT, (0, 0, 1), B, 'Screw holes')
    L.paint(occ, L.appearance('Wheel grey', COLOURS['caster']))

    bocc = L.new_component('Caster ball')
    bc = bocc.component
    sk = L.sketch(bc, bc.yZConstructionPlane, 'Ball')
    rb = P.BALL_D / 2
    arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, 0, yc, zc), L.sp(sk, 0, yc, zc + rb), math.pi)
    ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
    L.done(sk)
    f = L.revolve(bc, L.all_profiles(sk), ax, L.NEW, name='Ball')
    f.bodies.item(0).name = 'Ball 16 mm'
    L.paint(bocc, L.appearance('Steel ball', COLOURS['ball'], 'Steel - Satin'))
    return occ


# ======================================================== reference parts
def build_battery_ref():
    L.delete_component('18650 holder (reference)')
    occ = L.new_component('18650 holder (reference)')
    c = occ.component
    w, l, h = P.BATT_HOLDER
    y0 = P.BATT_Y[0] + 0.5
    f = L.box(c, -w / 2, y0, P.FZ, w / 2, y0 + l, P.FZ + 11.0, L.NEW, None, 'Holder')
    f.bodies.item(0).name = 'Holder'
    # the cell
    sk = L.sketch(c, L.plane_xz(c, y0 + 6.0), 'Cell')
    L.circle(sk, 0, y0 + 6.0, P.FZ + 1.5 + 9.2, 18.4)
    L.done(sk)
    g = L.extrude(c, sk, L.all_profiles(sk), 65.0, L.NEW, (0, 1, 0), None, 'Cell')
    g.bodies.item(0).name = '18650 cell'
    L.paint(occ, L.appearance('Battery blue', COLOURS['battery']))
    return occ


def build_line_ref():
    L.delete_component('Line sensor (placeholder)')
    occ = L.new_component('Line sensor (placeholder)')
    c = occ.component
    z_pcb = P.LINE_PCB_TOP            # M3 screws through the floor slots, washers to set the height
    f = L.box(c, -21.0, 37.0, z_pcb - 1.6, 21.0, 50.0, z_pcb, L.NEW, None, 'PCB')
    f.bodies.item(0).name = 'PCB'
    for x in (-13.0, 0.0, 13.0):
        g = L.box(c, x - 2.9, 39.0, z_pcb - 1.6 - 7.0, x + 2.9, 49.2, z_pcb - 1.6, L.NEW, None, 'TCRT5000')
        g.bodies.item(0).name = 'TCRT5000'
    L.paint(occ, L.appearance('Line PCB blue', COLOURS['line']))
    return occ


def build_skids():
    L.delete_component('Front skids')
    occ = L.new_component('Front skids')
    c = occ.component
    r = 4.0
    bodies = []
    for s in (1, -1):
        x, y = s * P.SKID_X, P.SKID_Y
        f = L.cyl_z(c, [(x, y)], 2 * r, P.FLOOR_Z0, P.SKID_Z + r, L.NEW, None, 'Skid post')
        b = f.bodies.item(0)
        b.name = 'Skid'
        sk = L.sketch(c, L.plane_yz(c, x), 'Skid tip')
        arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, x, y, P.SKID_Z + r), L.sp(sk, x, y, P.SKID_Z), math.pi)
        ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
        L.done(sk)
        L.revolve(c, L.all_profiles(sk), ax, L.JOIN, [b], 'Skid tip')
        L.cyl_z(c, [(x, y)], 2.6, P.FLOOR_Z0, P.FLOOR_Z0 - 8.0, L.CUT, [b], 'Skid screw pilot')
    L.paint(occ, L.appearance('Wheel grey', COLOURS['caster']))
    return occ


MOTOR_STEP = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/mech/CAD/DC_Gear_Motor_with_Encoder.step'


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


def _insert(file_id, mtx):
    root = L.design().rootComponent
    df = L.app.data.findFileById(file_id)
    return root.occurrences.addByInsert(df, mtx, True)


def place_board():
    root = L.design().rootComponent
    for o in list(root.occurrences):
        if o.name.startswith('RoboCore_V2'):
            o.deleteMe()
    return _insert(BOARD_FILE_ID, L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (0, 0, P.BOARD_Z)))


def place_hcsr04():
    # model: PCB in XY, transducers towards +Z, pins towards -Y
    m = L.matrix([(-1, 0, 0), (0, 0, 1), (0, 1, 0)], (0, P.US_PLATE_Y[0] - 1.0 - 1.5, P.US_PCB_CZ))
    root = L.design().rootComponent
    for o in list(root.occurrences):
        if o.name.startswith('HCSR04'):
            o.deleteMe()
    return _insert(HCSR04_FILE_ID, m)


STEPS = {
    'motor_import': import_motor,
    'chassis': build_chassis,
    'wheel': build_wheel,
    'tyre': build_tyre,
    'wheels': place_wheels,
    'caster': build_caster,
    'battery': build_battery_ref,
    'line': build_line_ref,
    'skids': build_skids,
    'motors': place_motors,
    'board': place_board,
    'hcsr04': place_hcsr04,
}


def main(steps=None):
    steps = steps or ['motor_import', 'motors', 'chassis', 'wheel', 'tyre', 'wheels', 'caster', 'skids', 'battery', 'line', 'board', 'hcsr04']
    log = []
    for s in steps:
        try:
            STEPS[s]()
            log.append('%s: ok' % s)
        except Exception as e:
            import traceback
            log.append('%s: FAILED %s\n%s' % (s, e, traceback.format_exc()))
            break
    return '\n'.join(log)
