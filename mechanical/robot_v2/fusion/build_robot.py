"""Builds the RoboCore V2 robot (XRP-inspired), revision 5, in the active Fusion design.

Run from Fusion (Scripts and Add-Ins, or the Fusion MCP) with:
    import sys; sys.path.insert(0, '<this folder>'); import build_robot; build_robot.main()
Each step deletes and rebuilds its own component (the chassis is built in seven steps so each fits
in one Fusion call). Rev 1-4 live in rev1/ ... rev4/.

Rev 5: chamfered cross-shaped plan; the chassis prints TOP DOWN like the XRP (flat deck on the bed, open
underneath, everything inside hangs from the deck); the board sits on the deck; motors snap in from below;
the battery holder slides in from the back on 45-degree V-rails and two flaps snap behind it; twin ball
casters are printed into the rear corners. The perimeter rail (45-degree underside, V-detents every 8 mm),
the hole row and the front dock are the expansion bus.

Printed parts and their print orientation:
    Chassis        deck (top) down         PETG, body colour, no supports (flush bus groove, no lip)
    Wheel x2       flat inner face down    PETG, parts colour (RoboCore gear on the hub)
    Tyre x2        flat                    TPU 95A
    Arm base       plate down              PETG, parts colour (arm module)
    Arm            deck down               PETG, parts colour
    Jaw L, Jaw R   flat                    PETG, dark
    Sonar bracket  plate top down          PETG, parts colour (ultrasonic on the nose, on the dock)
    Bus clip       on its side             PETG, accent (expansion-bus template)
    Ballast clip   on its side             PETG, accent (x2, 3 M8 nuts each, for the arm module)
    Rail coupon    deck down               PETG (test piece for the clip fit)
"""
import math
import adsk.core
import adsk.fusion

import rc_lib as L
import rc_params as P

BOARD_FILE_ID = 'urn:adsk.wipprod:dm.lineage:MH3mPskERmKwCFQbVIab9Q'   # RoboCore_V2 (v2: J403/J404 JST SH)
LINE_FILE_ID = 'urn:adsk.wipprod:dm.lineage:HiFy67uSTRudML8jUJFiQQ'    # RoboCore_LineSensor
MOTOR_COMPONENT = 'TT DC Gear Motor with Encoder (Blue)'
MOTOR_STEP = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/mech/CAD/DC_Gear_Motor_with_Encoder.step'

SCHEMES = {
    # RoboCore logo palette: teal #78A3AD body, dark teal #64878E parts, black accents
    'teal': {'body': (120, 163, 173), 'accent': (28, 30, 32), 'parts': (100, 135, 142), 'dark': (28, 30, 32), 'tyre': (44, 44, 46),
             'arm': (242, 178, 26)},     # arm module in excavator yellow (Fred's toy), black jaws
    # rev 1 orange body, charcoal accents
    # Fred's earth-mover look (CAT / JCB yellow, black details)
    'construction': {'body': (242, 182, 26), 'accent': (30, 30, 32), 'parts': (226, 166, 22), 'dark': (30, 30, 32), 'tyre': (44, 44, 46),
                     'arm': (242, 182, 26)},
    'orange': {'body': (242, 140, 40), 'accent': (40, 40, 44), 'parts': (85, 85, 92), 'dark': (28, 30, 32), 'tyre': (44, 44, 46),
               'arm': (250, 204, 40)},
}
ROLES = {'Chassis': 'body', 'Wheel': 'parts', 'Tyre': 'tyre', 'Ballast clip': 'accent', 'Arm base': 'arm', 'Arm': 'arm', 'Jaw L': 'dark',
         'Jaw R': 'dark', 'Sonar bracket': 'parts', 'Bus clip': 'accent', 'Rail coupon': 'body'}

H, Y0, Y1 = P.BODY_HALF, P.BODY_Y0, P.BODY_Y1
DECK_Z = P.BODY_TOP - P.DECK_T      # underside of the top deck
SIN5, COS5 = math.sin(math.radians(P.US_TILT)), math.cos(math.radians(P.US_TILT))


def S(x):
    """Both sides: returns [(sign, x*sign)]."""
    return [(1, x), (-1, -x)]


def xs(s, a, b):
    """|X| range (a, b) on side s, as a sorted (x0, x1)."""
    return tuple(sorted((s * a, s * b)))


# ================================================================ helpers
def plan_corners():
    """Body plan (rev 5, Fred's sketch): CCW corners (x, y, chamfer leg). Narrow rear section (encoder covers),
    wide wheel section, narrow front with a notch between two legs. Every corner is chamfered at 45 degrees."""
    hr, hw, hf = P.HALF_REAR, H, P.HALF_FRONT
    ws, nh, ly = P.WHEEL_SEC_Y, P.NOTCH_HALF, P.LEG_Y1
    return [(-hr, Y0, P.C_REAR), (hr, Y0, P.C_REAR), (hr, -ws, P.C_STEP), (hw, -ws, P.C_WHEEL), (hw, ws, P.C_WHEEL),
            (hf, ws, P.C_STEP), (hf, ly, P.C_LEG), (nh, ly, P.C_LEG), (nh, Y1, P.C_NOTCH), (-nh, Y1, P.C_NOTCH),
            (-nh, ly, P.C_LEG), (-hf, ly, P.C_LEG), (-hf, ws, P.C_STEP), (-hw, ws, P.C_WHEEL), (-hw, -ws, P.C_WHEEL),
            (-hr, -ws, P.C_STEP)]


CONCAVE = (2, 5, 8, 9, 12, 15)      # step and notch corners (inside corners)


def plan_points():
    """Chamfered plan polygon (CCW), two points per corner: edge 2k is corner k's chamfer,
    edge 2k + 1 the straight run of side k (corner k -> corner k + 1)."""
    c = plan_corners()
    n = len(c)
    pts = []
    for k in range(n):
        vx, vy, ch = c[k]
        (ax, ay, _), (bx, by, _) = c[k - 1], c[(k + 1) % n]
        la, lb = math.hypot(ax - vx, ay - vy), math.hypot(bx - vx, by - vy)
        pts.append((vx + (ax - vx) / la * ch, vy + (ay - vy) / la * ch))
        pts.append((vx + (bx - vx) / lb * ch, vy + (by - vy) / lb * ch))
    return pts


_PLAN = {}


def plan(d=0.0):
    """Plan polygon offset by d (outside > 0) with mitred corners, so every offset keeps the chamfers parallel."""
    key = round(d, 4)
    if key in _PLAN:
        return _PLAN[key]
    base = plan_points()
    n = len(base)
    lines = []
    for k in range(n):
        (ax, ay), (bx, by) = base[k], base[(k + 1) % n]
        ln = math.hypot(bx - ax, by - ay)
        nx, ny = (by - ay) / ln, -(bx - ax) / ln
        lines.append((ax + nx * d, ay + ny * d, bx - ax, by - ay))
    pts = []
    for k in range(n):
        (px, py, dx, dy), (qx, qy, ex, ey) = lines[k - 1], lines[k]
        den = dx * ey - dy * ex
        t = ((qx - px) * ey - (qy - py) * ex) / den
        pts.append((px + dx * t, py + dy * t))
    _PLAN[key] = pts
    return pts


def outline(sk, d, z):
    """Body plan outline offset by d (outside > 0) on an XY sketch at height z."""
    L.poly(sk, [(x, y, z) for (x, y) in plan(d)])


def outline_dist(x, y, d=0.0):
    """Unsigned distance (mm) from (x, y) to the plan outline offset by d."""
    poly = plan(d)
    n = len(poly)
    dmin = 1e9
    for k in range(n):
        ax, ay = poly[k]
        bx, by = poly[(k + 1) % n]
        ex, ey = bx - ax, by - ay
        ll = ex * ex + ey * ey or 1e-12
        t = max(0.0, min(1.0, ((x - ax) * ex + (y - ay) * ey) / ll))
        dmin = min(dmin, math.hypot(x - ax - t * ex, y - ay - t * ey))
    return dmin


def sdf(x, y):
    """Signed distance (mm) from the body plan outline, outside > 0."""
    poly = plan(0.0)
    dmin, inside = 1e9, False
    n = len(poly)
    for k in range(n):
        ax, ay = poly[k]
        bx, by = poly[(k + 1) % n]
        ex, ey = bx - ax, by - ay
        ll = ex * ex + ey * ey or 1e-12
        t = max(0.0, min(1.0, ((x - ax) * ex + (y - ay) * ey) / ll))
        dmin = min(dmin, math.hypot(x - ax - t * ex, y - ay - t * ey))
        if (ay > y) != (by > y) and x < ax + (y - ay) * ex / (ey or 1e-12):
            inside = not inside
    return -dmin if inside else dmin


def plan_runs(d):
    """Edges of the offset plan: [(start, end, outward normal, index)]; index = side k for the straight
    runs, 100 + k for corner k's chamfer."""
    pts = plan(d)
    n = len(pts)
    out = []
    for k in range(n):
        a, b_ = pts[k], pts[(k + 1) % n]
        ln = math.hypot(b_[0] - a[0], b_[1] - a[1])
        u = ((b_[0] - a[0]) / ln, (b_[1] - a[1]) / ln)
        out.append((a, b_, (u[1], -u[0]), (k - 1) // 2 if k % 2 else 100 + k // 2))
    return out


HOLE_EDGES = (5, 11)    # front-section sides: the only runs with room behind the wall for a pin or a nut


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


def xz_prism(c, B, y0, y1, pts, name, op=None):
    """Polygon (x, z) on an XZ plane at y0, extruded to y1."""
    sk = L.sketch(c, L.plane_xz(c, y0), name)
    L.poly(sk, [(x, y0, z) for (x, z) in pts])
    L.done(sk)
    return L.extrude(c, sk, L.all_profiles(sk), y1 - y0, op or L.JOIN, (0, 1, 0), B, name)


# =============================================================== chassis
# The chassis prints TOP DOWN (deck on the bed, like the XRP chassis) and is open underneath. Every face that
# looks up in the robot looks down on the printer, so inside parts hang from the deck, ledges have 45-degree
# undersides (seen from the printer) and the only flat ceilings are short bridges.
def chassis_shell():
    """Top deck, perimeter wall (flush: no lip), the band behind the bus groove, hole band on the front-section sides."""
    L.delete_component('Chassis')
    occ = L.new_component('Chassis')
    c = occ.component
    sk = L.sketch(c, L.plane_xy(c, DECK_Z), 'Deck')
    outline(sk, 0, DECK_Z)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), P.DECK_T, L.NEW, (0, 0, 1), name='Deck').bodies.item(0)
    body.name = 'Chassis'
    B = [body]
    ring(c, B, 0, -P.SKIN_T, P.FLOOR_Z0, P.BODY_TOP, 'Perimeter wall')
    # band inside the wall behind the bus groove (its underside faces down in the robot = up on the printer)
    bt, bz = P.BUS_BAND
    ring(c, B, -P.SKIN_T + 0.1, -P.SKIN_T - bt, bz, DECK_Z + 0.1, 'Bus band')
    n1 = 0
    # wall thickened to 6 mm behind the hole row on the front-section sides (Technic pins grip at both ends)
    bz0 = P.HOLE_BAND[0]
    xi = P.HALF_FRONT - P.HOLE_BAND_T
    for s, _ in S(1):
        x0, x1 = xs(s, xi, P.HALF_FRONT - P.SKIN_T + 0.1)
        L.box(c, x0, P.WHEEL_SEC_Y + P.C_STEP + 0.5, bz0, x1, P.LEG_Y1 - P.C_LEG - 0.5, DECK_Z + 0.1, L.JOIN, B, 'Hole band')
    e = L.edges_where(body, lambda x, y, z: abs(z - bz0) < 0.05 and abs(abs(x) - xi) < 0.05)
    n2 = L.chamfer(c, e, P.HOLE_BAND_T - P.SKIN_T - 0.05, 'Hole band 45')
    return '%d band edges chamfered' % n2


def inner_wall_x():
    """|X| range of the inner walls between the battery and the gearboxes (0.2 mm slide fit to the gearbox)."""
    return P.MOTOR_IN - 0.2 - P.WALL_T, P.MOTOR_IN - 0.2


def latch_free_y():
    """Y ranges of the inner walls that are not snap-latch tongues (or their slits)."""
    cuts = sorted((y - P.LATCH_W / 2 - P.LATCH_SLIT - 0.1, y + P.LATCH_W / 2 + P.LATCH_SLIT + 0.1) for y in P.LATCH_Y)
    out, y = [], P.WALL_Y[0]
    for (a, b) in cuts:
        if a > y:
            out.append((y, a))
        y = b
    return out


def chassis_cradle():
    """Wheel wells, motor cradles (motors go in from BELOW), battery rail walls and front stop."""
    occ, c, B = chassis()
    z0, zd = P.FLOOR_Z0, DECK_Z + 0.1
    wx0, wx1, wy0, wy1 = P.WELL
    wi0, wi1 = inner_wall_x()
    for s, _ in S(1):
        x0, x1 = xs(s, wx0, wx1)
        L.box(c, x0, wy0, z0 - 1, x1, wy1, P.BODY_TOP + 1, L.CUT, B, 'Wheel well')
        # well end walls tie the outer wall to the cradle; shaft wall between motor and wheel
        x0, x1 = xs(s, P.WELL_END_X0, H - P.C_WHEEL)
        L.box(c, x0, wy1, z0, x1, wy1 + 3.0, zd, L.JOIN, B, 'Well end wall')
        L.box(c, x0, wy0 - 3.0, z0, x1, wy0, zd, L.JOIN, B, 'Well end wall')
        x0, x1 = xs(s, *P.SHAFT_WALL)
        L.box(c, x0, P.SHAFT_WALL_Y[0], z0, x1, P.SHAFT_WALL_Y[1], zd, L.JOIN, B, 'Shaft wall')
        x0, x1 = xs(s, wi0, wi1)
        L.box(c, x0, P.WALL_Y[0], z0, x1, P.WALL_Y[1], zd, L.JOIN, B, 'Inner wall')
        x0, x1 = xs(s, wi1, P.SHAFT_WALL[0])
        L.box(c, x0, P.CRADLE_END_Y[0], z0, x1, P.CRADLE_END_Y[1], zd, L.JOIN, B, 'Cradle end wall')
        # motor stops hang from the deck to just over the gearbox: the wheel load pushes the motor up into them
        zl = P.MOTOR_TOP + 0.15
        for (ya, yb) in P.LEDGE_Y:
            x0, x1 = xs(s, wi1 - 0.1, wi1 + 2.0)
            L.box(c, x0, ya, zl, x1, yb, zd, L.JOIN, B, 'Motor stop')
        x0, x1 = xs(s, P.SHAFT_WALL[0] - 2.2, P.SHAFT_WALL[0] + 0.1)
        L.box(c, x0, P.LEDGE_Y[0][0], zl, x1, P.CRADLE_END_Y[0] - 7.0, zd, L.JOIN, B, 'Motor stop')
        # rail wall beside the battery's rear half; its rear end becomes the snap flap
        x0, x1 = xs(s, P.BATT_RAIL_X, P.BATT_RAIL_X + P.BATT_RAIL_T)
        L.box(c, x0, P.FLAP_Y[0], z0, x1, P.WALL_Y[0] + 0.1, zd, L.JOIN, B, 'Battery rail wall')
        # window for the DG01D-E's encoder end and magnet disc (rev 6): they reach 1.3 mm into this wall
        ry0, ry1, rz0, rz1 = P.RAIL_WINDOW
        x0, x1 = xs(s, P.BATT_RAIL_X - 0.5, P.BATT_RAIL_X + P.BATT_RAIL_T + 0.5)
        L.box(c, x0, ry0, rz0, x1, ry1, rz1, L.CUT, B, 'Rail wall window')
        # front stop at the holder's plastic corners (clear of its springs), 45-degree top joins the inner wall
        y0_, y1_, xa, zt = P.BATT_STOP
        xw = wi0 + 0.1
        xz_prism(c, B, y0_, y1_, [(s * xa, 15.0), (s * xw, 15.0), (s * xw, zt + xw - xa), (s * xa, zt)], 'Battery front stop')
    return occ


def hex_pocket_z(c, B, x, y, af, z0, z1, name):
    """Hexagonal pocket (across flats af) cut from z0 to z1 along z, flats parallel to x."""
    sk = L.sketch(c, L.plane_xy(c, z0), name + ' sk')
    rc = af / math.sqrt(3)
    L.poly(sk, [(x + rc * math.cos(math.radians(60 * k + 30)), y + rc * math.sin(math.radians(60 * k + 30)), z0) for k in range(6)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), abs(z1 - z0), L.CUT, (0, 0, 1 if z1 > z0 else -1), B, name)


def chassis_front():
    """Nose (rev 6): an open pocket for the line-sensor board, walls standing from the deck with nothing bridged,
    two screw bosses at the board's M3 holes, the skid in front of the sensors, dock towers, cable slots."""
    occ, c, B = chassis()
    L.delete_component('Line sled')                       # the board screws straight to the chassis now
    for o in list(L.design().rootComponent.occurrences):
        if o.name.startswith('Encoder cover'):            # the DG01D-E model has its own cover
            o.deleteMe()
    z0, zd = P.FLOOR_Z0, DECK_Z + 0.1
    ny0, ny1 = P.NOSE_Y
    ph, py0, py1, _ = P.NOSE_POCKET
    wt = P.POCKET_WALL_T
    for s, _ in S(1):
        x0, x1 = xs(s, ph, ph + wt)
        L.box(c, x0, ny0, z0, x1, ny1, zd, L.JOIN, B, 'Pocket side wall')
    L.box(c, -(ph + wt), ny0, z0, ph + wt, py0, zd, L.JOIN, B, 'Pocket rear wall')
    L.box(c, -(ph + wt), py1, z0, ph + wt, ny1 + 0.1, zd, L.JOIN, B, 'Pocket front wall')
    # skid: the front wall carried on below the floor line, chamfered front and back so it rides over bumps
    sx, sy0 = P.SKID
    zs = P.LINE_UNDER_Z - P.SLED_SKID_DZ
    L.box(c, -sx, sy0, zs, sx, Y1, z0 + 0.1, L.JOIN, B, 'Skid')
    e = L.edges_where(B[0], lambda x, y, z: abs(z - zs) < 0.05 and (abs(y - Y1) < 0.05 or abs(y - sy0) < 0.05) and abs(x) < sx + 0.05)
    L.chamfer(c, e, 2.5, 'Skid chamfer')
    # dock towers (sonar bracket, arm base) hang from the deck into the open pocket, well above the board
    for s, _ in S(1):
        x0, x1 = xs(s, *P.TOWER_X)
        L.box(c, x0, P.TOWER_Y[0], P.NOSE_TOP - 0.1, x1, P.TOWER_Y[1], P.BODY_TOP, L.JOIN, B, 'Dock tower')
    # screw bosses at the board's holes, from the deck down to the board's top face, with M3 self-tapping pilots
    zb = P.LINE_UNDER_Z + P.LINE_BOARD[2] + 0.1
    L.cyl_z(c, list(P.LINE_HOLES), P.LINE_BOSS_D, zd, zb, L.JOIN, B, 'Line sensor boss')
    L.cyl_z(c, list(P.LINE_HOLES), P.PILOT_M3[0], zb - 0.1, zb + P.PILOT_M3[1], L.CUT, B, 'Line sensor pilots')
    if P.FASTENERS == 'plastic':
        # captive M3 nuts: hex pocket in the deck top (under the bracket plate), clearance hole on down into the tower
        af, nt = P.NUT_M3
        for (x, y) in P.DOCK_INSERTS:
            hex_pocket_z(c, B, x, y, af + 0.2, P.BODY_TOP + 0.1, P.BODY_TOP - nt - 0.2, 'Dock nut pocket')
        L.cyl_z(c, P.DOCK_INSERTS, 3.4, P.BODY_TOP - nt, P.BODY_TOP - nt - 12.0, L.CUT, B, 'Dock screw clearance')
    else:
        # M3 heat-set inserts in the tower tops (sonar bracket, with the arm base stacked on it), as in rev 5
        L.cyl_z(c, P.DOCK_INSERTS, P.INSERT_M3_D, P.BODY_TOP + 0.1, P.BODY_TOP - P.INSERT_M3_DEPTH, L.CUT, B, 'Dock inserts')
    # slot through the front wall (skin + pocket front wall): the ultrasonic's 4 Dupont wires come in here
    x0, x1, z0_, z1_ = P.SONAR_SLOT
    sk = L.sketch(c, L.plane_xz(c, Y1 + 0.5), 'Sonar cable slot')
    L.rounded_poly(sk, [(x0, z0_), (x1, z0_), (x1, z1_), (x0, z1_)], 1.5, plane='xz', fixed=Y1 + 0.5)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), Y1 + 0.5 - py1 + 1.0, L.CUT, (0, -1, 0), B, 'Sonar cable slot')
    return 'nose + dock (open pocket)'


def u_slot_down(sk, xf, yc, zc, w, zbot):
    """Slot on a YZ sketch at x = xf, round top at (yc, zc), open down to zbot (motors come up from below)."""
    r = w / 2.0
    L.rounded_poly(sk, [(yc - r, zbot), (yc + r, zbot), (yc + r, zc + r), (yc - r, zc + r)], [0, 0, r - 0.01, r - 0.01], plane='yz', fixed=xf)


def deck_openings():
    """(x0, y0, x1, y1, corner r) cut through the deck."""
    bw, by0, by1 = P.BOARD_WIN
    ux, uy0 = P.USB_RELIEF
    out = [(-bw, by0, bw, by1, 3.0), (-ux, uy0, ux, by0 + 3.0, 2.0), P.FRONT_SLOT + (2.0,)]
    for s, _ in S(1):
        x0, x1 = xs(s, *P.PLUG_SLOT_X)
        out.append((x0, P.PLUG_SLOT_Y[0], x1, P.PLUG_SLOT_Y[1], 2.0))
        x0, x1 = xs(s, *P.CABLE_PORT_X)
        out.append((x0, P.CABLE_PORT_Y[0], x1, P.CABLE_PORT_Y[1], 1.5))
    return out


def chassis_holes():
    """Deck openings, board inserts, motor snap latches (hooks at the bottom), shaft-wall slots,
    battery opening + V-rails + snap flaps."""
    occ, c, B = chassis()
    z0, zd = P.FLOOR_Z0, DECK_Z
    zs = zd - 0.5
    sk = L.sketch(c, L.plane_xy(c, zs), 'Deck openings')
    for (x0, y0, x1, y1, r) in deck_openings():
        L.rounded_poly(sk, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], r, zs)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.DECK_T + 1.0, L.CUT, (0, 0, 1), B, 'Deck openings')
    # the board sits on the deck: M2 heat-set inserts in bosses under it
    L.cyl_z(c, P.BOARD_HOLES, P.BOARD_BOSS_D, P.BODY_TOP - P.INSERT_M2_DEPTH - 1.5, P.BODY_TOP, L.JOIN, B, 'Board boss')
    if P.FASTENERS == 'plastic':
        L.cyl_z(c, P.BOARD_HOLES, P.PILOT_M2[0], P.BODY_TOP + 0.1, P.BODY_TOP - P.PILOT_M2[1], L.CUT, B, 'Board screw pilots')
    else:
        L.cyl_z(c, P.BOARD_HOLES, P.INSERT_M2_D, P.BODY_TOP + 0.1, P.BODY_TOP - P.INSERT_M2_DEPTH, L.CUT, B, 'Board inserts')
    wi0, wi1 = inner_wall_x()
    for s, _ in S(1):
        # snap latches: tongues hang from the inner wall; the hook at the bottom catches the gearbox's
        # bottom edge (45-degree lead-in on its underside: the motor pushes it aside on the way up)
        zb = P.LATCH_FREE_Z
        for y in P.LATCH_Y:
            ya, yb = y - P.LATCH_W / 2, y + P.LATCH_W / 2
            x0, x1 = xs(s, wi0 - 0.1, wi1 + 0.1)
            L.box(c, x0, ya - P.LATCH_SLIT, z0 - 0.1, x1, ya, P.LATCH_ROOT, L.CUT, B, 'Latch slit')
            L.box(c, x0, yb, z0 - 0.1, x1, yb + P.LATCH_SLIT, P.LATCH_ROOT, L.CUT, B, 'Latch slit')
            L.box(c, x0, ya, z0 - 0.1, x1, yb, zb, L.CUT, B, 'Latch free end')
            x0, x1 = xs(s, wi0 - 0.1, wi1 - P.LATCH_T)
            L.box(c, x0, ya, zb, x1, yb, P.LATCH_ROOT, L.CUT, B, 'Latch tongue')
            zh = P.MOTOR_BOTTOM - 0.1
            xz_prism(c, B, ya, yb, [(s * wi1, zb), (s * (wi1 + P.LATCH_HOOK), zb + P.LATCH_HOOK), (s * (wi1 + P.LATCH_HOOK), zh), (s * wi1, zh)], 'Latch hook')
        # shaft wall: slots open at the bottom for the shaft and the locating pin, groove for the boss ring
        xm = s * (P.SHAFT_WALL[0] - 0.1)
        sk = L.sketch(c, L.plane_yz(c, xm), 'Shaft slot')
        u_slot_down(sk, xm, 0.0, P.AXLE_Z, P.SHAFT_SLOT, z0 - 1.0)
        u_slot_down(sk, xm, P.M_PIN_Y, P.AXLE_Z, P.PIN_SLOT, z0 - 1.0)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.SHAFT_WALL[1] - P.SHAFT_WALL[0] + 0.3, L.CUT, (s, 0, 0), B, 'Shaft and pin slots')
        sk = L.sketch(c, L.plane_yz(c, xm), 'Boss groove')
        u_slot_down(sk, xm, 0.0, P.AXLE_Z, P.BOSS_GROOVE[0], z0 - 1.0)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.BOSS_GROOVE[1] + 0.1, L.CUT, (s, 0, 0), B, 'Boss groove')

    # battery: rear opening (open at the bottom), then the 45-degree V-rails the holder's bottom edges ride on
    xr = P.BATT_RAIL_X
    L.box(c, -xr, Y0 - 1.0, z0 - 1.0, xr, Y0 + P.SKIN_T + 0.5, P.BATT_OPEN_TOP, L.CUT, B, 'Battery opening')
    k = P.BATT_RAIL_K
    for s, _ in S(1):
        segs = [(Y0, P.WALL_Y[0] + 0.1, xr)] + [(a, b, wi0) for (a, b) in latch_free_y()]
        for (ya, yb, xw) in segs:
            xz_prism(c, B, ya, yb, [(s * (xw + 0.1), z0), (s * (xw + 0.1), xw + 0.1 - k), (s * (k + z0), z0)], 'Battery V-rail')
    for s, _ in S(1):
        # snap flaps: the rail walls' rear ends hang from the deck only (slits front and back) and flex outwards;
        # a bump with a 45-degree ramp springs in behind the holder's rear corners
        fy0, fy1 = P.FLAP_Y
        x0, x1 = xs(s, k + z0 - 0.2, xr + P.BATT_RAIL_T + 0.1)
        L.box(c, x0, fy0 - 0.6, z0 - 1.0, x1, fy0, xr + 1.0 - k, L.CUT, B, 'Flap slit')
        L.box(c, x0, fy1, z0 - 1.0, x1, fy1 + 0.6, zd, L.CUT, B, 'Flap slit')
        xi, yc, yr, (za, zt) = P.FLAP_CATCH
        xz_prism(c, B, yr, yc, [(s * (xr + 0.1), za), (s * xi, za), (s * xi, zt), (s * (xr + 0.1), zt + xr + 0.1 - xi)], 'Flap catch')
        sk = L.sketch(c, L.plane_xy(c, za - 0.5), 'Catch ramp')
        L.poly(sk, [(s * (xi - 0.1), yr - 0.1, za - 0.5), (s * (xi - 0.1), yr + (xr - xi) + 0.1, za - 0.5), (s * (xr + 0.1), yr - 0.1, za - 0.5)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), zt - za + 3.0, L.CUT, (0, 0, 1), B, 'Catch ramp')

    # twin rear casters: a 1/2-inch ball snaps up into each socket (sphere cavity with a 45-degree cone above it,
    # a vent to push the ball out from the top, 4 slits so the lip springs open)
    cx, cy = P.CASTER_X, P.CASTER_Y
    L.cyl_z(c, [(cx, cy), (-cx, cy)], P.CASTER_TUBE_D, P.CASTER_LIP_Z, zd + 0.1, L.JOIN, B, 'Caster socket')
    rb = P.BALL_D / 2
    rr = rb + P.CASTER_CLEAR
    zlip = P.CASTER_LIP_Z
    rlip = math.sqrt(rr * rr - (rb - zlip) ** 2)
    kk = math.sqrt(0.5)
    p45 = (rr * kk, rb + rr * kk)
    rv = P.CASTER_VENT_D / 2
    zv = p45[1] + (p45[0] - rv)
    for x in (cx, -cx):
        sk = L.sketch(c, L.plane_xz(c, cy), 'Ball cavity')
        lines = sk.sketchCurves.sketchLines
        q = [sk.sketchPoints.add(L.sp(sk, x + dx, cy, z)) for (dx, z) in
             ((0, zlip - 1.0), (rlip + 1.0, zlip - 1.0), (rlip, zlip), (p45[0], p45[1]), (rv, zv), (rv, P.BODY_TOP + 0.5), (0, P.BODY_TOP + 0.5))]
        lines.addByTwoPoints(q[0], q[1])
        lines.addByTwoPoints(q[1], q[2])
        sk.sketchCurves.sketchArcs.addByThreePoints(q[2], L.sp(sk, x + rr, cy, rb), q[3])
        lines.addByTwoPoints(q[3], q[4])
        lines.addByTwoPoints(q[4], q[5])
        lines.addByTwoPoints(q[5], q[6])
        ax = lines.addByTwoPoints(q[6], q[0])
        L.done(sk)
        L.revolve(c, L.all_profiles(sk), ax, L.CUT, B, 'Ball cavity')
        for (ux, uy) in ((1, 0), (0, 1)):
            h = P.CASTER_TUBE_D / 2 + 0.5
            L.box(c, x - ux * h - uy * 0.4, cy - uy * h - ux * 0.4, zlip - 0.5, x + ux * h + uy * 0.4, cy + uy * h + ux * 0.4, z0 - 0.1, L.CUT, B, 'Caster slit')
    return occ


def _along(s, e, margin, pitch=8.0):
    ln = math.hypot(e[0] - s[0], e[1] - s[1])
    if ln <= 2 * margin:
        return []
    u = ((e[0] - s[0]) / ln, (e[1] - s[1]) / ln)
    mx, my = (s[0] + e[0]) / 2, (s[1] + e[1]) / 2
    kmax = int((ln / 2 - margin) // pitch)
    return [(mx + u[0] * pitch * k, my + u[1] * pitch * k) for k in range(-kmax, kmax + 1)]


def bus_positions():
    """Hole-row and detent positions on an 8 mm grid along the straight runs: [(x, y, outward normal)].
    Detents run along every straight edge and every outside chamfer."""
    holes, detents = [], []
    for (s, e, n, k) in plan_runs(0.0):
        if k not in HOLE_EDGES:
            continue
        for (x, y) in _along(s, e, P.HOLE_D / 2 + 1.0):
            holes.append((x, y, (round(n[0], 6), round(n[1], 6))))
    for (s, e, n, k) in plan_runs(0.0):
        if groove_skip(k) or (k >= 100 and (k - 100) in CONCAVE):
            continue
        for (x, y) in _along(s, e, 1.5):
            detents.append((x, y, (round(n[0], 6), round(n[1], 6))))
    return holes, detents


def groove_skip(k):
    """True for the plan runs that get no bus groove: the wheel-section sides and their corner chamfers."""
    return k in P.BUS_SKIP or (k >= 100 and ((k - 100) in P.BUS_SKIP or (k - 101) in P.BUS_SKIP))


def run_prism(c, B, s, e, n, pts_wz, name, op, ext=0.8, ext1=None):
    """Prism along a plan run from s to e (outward normal n): the cross-section pts_wz is (w outward, z),
    sketched on the plane normal to the run and extruded along it, `ext` past the start and `ext1` past the end."""
    ext1 = ext if ext1 is None else ext1
    ln = math.hypot(e[0] - s[0], e[1] - s[1])
    u = ((e[0] - s[0]) / ln, (e[1] - s[1]) / ln)
    d0 = s[0] * u[0] + s[1] * u[1] - ext
    pl = L.plane_vertical(c, u[0], u[1], d0)
    sk = L.sketch(c, pl, name)
    o = (s[0] - u[0] * ext, s[1] - u[1] * ext)
    L.poly(sk, [(o[0] + n[0] * w, o[1] + n[1] * w, z) for (w, z) in pts_wz])
    L.done(sk)
    return L.extrude(c, sk, L.all_profiles(sk), ln + ext + ext1, op, (u[0], u[1], 0), B, name)


def chassis_bus():
    """Expansion bus: the flush groove under the deck (45-degree underside) and the 8 mm hole row."""
    occ, c, B = chassis()
    depth_g, gz0, gz1 = P.BUS_GROOVE
    sec = [(0.5, gz0 - depth_g - 0.5), (0.5, gz1), (-depth_g, gz1), (-depth_g, gz0)]
    ng = 0
    runs = plan_runs(0.0)
    m = len(runs)
    for i, (s_, e_, n, k) in enumerate(runs):
        if groove_skip(k):
            continue
        # the groove runs on past each end to meet its neighbour, but stops dead where the neighbour has none
        e0 = 0.0 if groove_skip(runs[i - 1][3]) else 0.8
        e1 = 0.0 if groove_skip(runs[(i + 1) % m][3]) else 0.8
        run_prism(c, B, s_, e_, n, sec, 'Bus groove', L.CUT, e0, e1)
        ng += 1
    holes, detents = bus_positions()
    depth = P.HOLE_BAND_T + 0.5
    groups = []
    for h in holes:
        key = (h[2], round(h[0] * h[2][0] + h[1] * h[2][1], 2))
        if key not in groups:
            groups.append(key)
    for (n, d0) in groups:
        hs = [h for h in holes if h[2] == n and abs(h[0] * n[0] + h[1] * n[1] - d0) < 0.01]
        dist = d0 + 0.5
        pl = L.plane_vertical(c, n[0], n[1], dist)
        sk = L.sketch(c, pl, 'Hole row')
        pts = [(h[0] + n[0] * 0.5, h[1] + n[1] * 0.5, P.HOLE_Z) for h in hs]
        for p in pts:
            L.circle(sk, p[0], p[1], p[2], P.HOLE_D)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, pts), depth, L.CUT, (-n[0], -n[1], 0), B, 'Hole row')
    return '%d groove runs, %d holes' % (ng, len(holes))


def chassis_detents():
    """V-detents in the bus groove's back face: a clip's bump clicks in every 8 mm."""
    occ, c, B = chassis()
    holes, detents = bus_positions()
    depth_g, gz0, gz1 = P.BUS_GROOVE
    zb = gz0 - 0.4
    sk = L.sketch(c, L.plane_xy(c, zb), 'Bus detents')
    dw, dd = P.DETENT
    for (x, y, (nx, ny)) in detents:
        tx, ty = -ny, nx
        k = dw / 2 / dd * (dd + 0.3)
        apex = (x - nx * (depth_g + dd), y - ny * (depth_g + dd))
        a = (x - nx * (depth_g - 0.3) + tx * k, y - ny * (depth_g - 0.3) + ty * k)
        b = (x - nx * (depth_g - 0.3) - tx * k, y - ny * (depth_g - 0.3) - ty * k)
        L.poly(sk, [(apex[0], apex[1], zb), (a[0], a[1], zb), (b[0], b[1], zb)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), gz1 - 0.2 - zb, L.CUT, (0, 0, 1), B, 'Bus detents')
    return '%d detents' % len(detents)


def chassis_finish():
    """Wheel-screw access holes (Fred), diamond windows if enabled, logo, bed chamfer on the deck face
    (the chassis prints top down)."""
    occ, c, B = chassis()
    zc = (P.WIN_Z[0] + P.WIN_Z[1]) / 2
    hw = (P.WIN_Z[1] - P.WIN_Z[0]) / 2
    for s, _ in S(1):
        # Fred's edits (2026-10-07): wheel-screw access hole on the axle, and the fill at the front of the well
        _yz_extrude(c, B, s * (H + 0.5), s * (H - P.SKIN_T - 0.5), lambda sk, xf: L.circle(sk, xf, 0, P.AXLE_Z, P.WHEEL_ACCESS_D), 'Wheel screw access', L.CUT)
        fy0, fy1, ft = P.WELL_CORNER_FILL
        x0, x1 = xs(s, P.SHAFT_WALL[0], P.SHAFT_WALL[0] + ft)
        L.box(c, x0, fy0, P.FLOOR_Z0, x1, fy1, DECK_Z + 0.1, L.JOIN, B, 'Well corner fill')
        if not P.SIDE_WINDOWS:
            continue
        for (half, ys) in ((H, P.SIDE_WIN_Y), (P.HALF_REAR, [P.REAR_SIDE_WIN_Y]), (P.HALF_FRONT, [P.FRONT_SIDE_WIN_Y])):
            xf = s * (half + 0.5)
            sk = L.sketch(c, L.plane_yz(c, xf), 'Side windows')
            for y in ys:
                L.poly(sk, [(xf, y, zc - hw), (xf, y + hw, zc), (xf, y, zc + hw), (xf, y - hw, zc)])
            L.done(sk)
            L.extrude(c, sk, L.all_profiles(sk), P.SKIN_T + 0.5, L.CUT, (-s, 0, 0), B, 'Side windows')
    # Plastal-Bot logo on the rear (reads from behind); the RoboCore logo is on the sonar bracket
    import json
    w, zc_ = P.LOGO_PB
    d = json.load(open(P.ART_DIR + '/plastalbot.json'))
    hh = d['height'] * w / d['width']
    L.logo(c, P.ART_DIR + '/plastalbot.json', lambda u, v: (u - w / 2, Y0, zc_ + hh / 2 - v), w, P.DEBOSS, (0, 1, 0), B, 'Plastal-Bot logo')
    n = L.bed_chamfer(c, B[0], 'z', P.BODY_TOP, 1, 0.5, 'Bed chamfer')
    return 'bed chamfer %d edges' % n


def _clip_rect(poly, u0, u1, v0, v1):
    """Clip a convex polygon [(u, v)] to the rectangle u0..u1 x v0..v1 (Sutherland-Hodgman)."""
    def cut(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a):
                    out.append(inter(a, b))
                out.append(b)
            elif inside(a):
                out.append(inter(a, b))
        return out

    def at_u(a, b, u):
        t = (u - a[0]) / (b[0] - a[0])
        return (u, a[1] + t * (b[1] - a[1]))

    def at_v(a, b, v):
        t = (v - a[1]) / (b[1] - a[1])
        return (a[0] + t * (b[0] - a[0]), v)
    pts = poly
    for inside, inter in ((lambda p: p[0] >= u0, lambda a, b: at_u(a, b, u0)), (lambda p: p[0] <= u1, lambda a, b: at_u(a, b, u1)),
                          (lambda p: p[1] >= v0, lambda a, b: at_v(a, b, v0)), (lambda p: p[1] <= v1, lambda a, b: at_v(a, b, v1))):
        pts = cut(pts, inside, inter)
        if not pts:
            return []
    return pts


def _area(pts):
    return abs(sum(pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1] for i in range(len(pts)))) / 2


def fender_band():
    """(y, z) outline of the fender arch band on the wheel-section wall (shared by the style and the hand-edit replay)."""
    a, rise, bw, fh, zb = P.FENDER
    za = P.AXLE_Z

    def arch(ry, rz, n=24):
        return [(-ry * math.cos(math.pi * k / n), za + rz * math.sin(math.pi * k / n)) for k in range(n + 1)]
    return ([(-(a + bw / 2), zb)] + arch(a + bw / 2, rise + bw / 2) + [(a + bw / 2, zb), (a - bw / 2, zb)]
            + list(reversed(arch(a - bw / 2, rise - bw / 2))) + [(-(a - bw / 2), zb)])


def chassis_style():
    """Earth-mover details (Fred, 2026-10-07, after photos of a CAT 797F haul truck, a JCB backhoe and loaders):
    wheel hubs with bolt heads round the wheel-screw access holes, fender arches over the wheels, engine louvres on
    the rear-section sides, hazard chevrons and tail lights at the back, RoboCore badges on the front-section sides
    (the tread-plate walkways are the next step). Shallow relief only: the outline, the clearances and the
    top-down print stay as they were."""
    occ, c, B = chassis()
    body = B[0]
    za = P.AXLE_Z
    # wheel hubs (like an earth-mover's final drive) round the access holes, with 8 bolt heads
    od, id_, hh, bcd, nb, baf, bh = P.HUB_RING
    for s, _ in S(1):
        xf = s * H
        sk = L.sketch(c, L.plane_yz(c, xf - s * 0.05), 'Wheel hub')
        L.circle(sk, xf - s * 0.05, 0, za, od)
        L.circle(sk, xf - s * 0.05, 0, za, id_)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, [(xf - s * 0.05, 0, za + (od + id_) / 4)]), hh + 0.05, L.JOIN, (s, 0, 0), B, 'Wheel hub')
        e = L.edges_where(body, lambda x, y, z: abs(abs(x) - (H + hh)) < 0.02 and abs(math.hypot(y, z - za) - od / 2) < 0.05)
        L.chamfer(c, e, 0.7, 'Wheel hub edge')

        def bolts(sk, x_):
            for k in range(nb):
                a = 2 * math.pi * (k + 0.5) / nb
                L.poly(sk, [(x_, y, z) for (y, z) in _hex_pts(bcd / 2 * math.cos(a), za + bcd / 2 * math.sin(a), baf, 30)])
        _yz_extrude(c, B, xf + s * (hh - 0.05), xf + s * (hh + bh), bolts, 'Hub bolts')
    # fender arch over each wheel: an inverted-U band from z FENDER[4] up and over the hub
    a, rise, bw, fh, zb = P.FENDER
    band = fender_band()
    for s, _ in S(1):
        xf = s * H
        _yz_extrude(c, B, xf - s * 0.05, xf + s * fh, lambda sk, x_: L.poly(sk, [(x_, y, z) for (y, z) in band]), 'Fender arch')
    # engine louvres on the rear-section sides (the encoder covers are behind them)
    ys, lw, (lz0, lz1), ld = P.LOUVRES
    for s, _ in S(1):
        xf = s * (P.HALF_REAR + 0.5)
        sk = L.sketch(c, L.plane_yz(c, xf), 'Louvres')
        for y in ys:
            L.rounded_poly(sk, [(y - lw / 2, lz0), (y + lw / 2, lz0), (y + lw / 2, lz1), (y - lw / 2, lz1)], lw / 2 - 0.01, plane='yz', fixed=xf)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), ld + 0.5, L.CUT, (-s, 0, 0), B, 'Louvres')
    # hazard chevrons on the rear wall either side of the battery opening (45-degree stripes, paint them black)
    (cx0, cx1), (cz0, cz1), cw, cp, cd = P.CHEVRONS
    yf = Y0 - 0.5
    sk = L.sketch(c, L.plane_xz(c, yf), 'Chevrons')
    k2 = math.sqrt(0.5)
    for s, _ in S(1):
        d = (s * k2, k2)
        n_ = (-d[1], d[0])
        lo, hi = sorted((s * cx0, s * cx1))
        for k in range(-14, 15):
            c0 = k * cp
            q = [(n_[0] * (c0 + sg * cw / 2) + d[0] * t, n_[1] * (c0 + sg * cw / 2) + d[1] * t) for (sg, t) in ((-1, -90.0), (-1, 90.0), (1, 90.0), (1, -90.0))]
            poly = _clip_rect(q, lo, hi, cz0, cz1)
            if len(poly) >= 3 and _area(poly) > 4.0:
                L.poly(sk, [(u, yf, v) for (u, v) in poly])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), cd + 0.5, L.CUT, (0, 1, 0), B, 'Chevrons')
    # tail lights on the rear chamfers: a recess with a raised lens (paint it red)
    tw, th, tdep, tlh, tz = P.TAIL_LIGHT
    for s, _ in S(1):
        nx, ny = s * k2, -k2
        dist = (s * (P.HALF_REAR - P.C_REAR)) * nx + Y0 * ny
        mx, my = s * (P.HALF_REAR - P.C_REAR / 2), Y0 + P.C_REAR / 2
        tx, ty = -ny, nx

        def rect(w, h, off):
            return [(mx + nx * off + tx * su * w / 2, my + ny * off + ty * su * w / 2, tz + sv * h / 2)
                    for (su, sv) in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        sk = L.sketch(c, L.plane_vertical(c, nx, ny, dist + 0.5), 'Tail light')
        L.poly(sk, rect(tw, th, 0.5))
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), tdep + 0.5, L.CUT, (-nx, -ny, 0), B, 'Tail light')
        sk = L.sketch(c, L.plane_vertical(c, nx, ny, dist - tdep - 0.05), 'Tail light lens')
        L.poly(sk, rect(tw - 1.6, th - 1.6, -tdep - 0.05))
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), tlh + 0.05, L.JOIN, (nx, ny, 0), B, 'Tail light lens')
    # RoboCore badges on the front-section sides (raised plate, logo debossed; reads front-to-back on the left)
    import json
    (by0, by1), (bz0, bz1), bt, lgw = P.BADGE
    dj = json.load(open(P.ART_DIR + '/robocore.json'))
    lh = dj['height'] * lgw / dj['width']
    yc, zc = (by0 + by1) / 2, (bz0 + bz1) / 2
    for s, _ in S(1):
        xf = s * P.HALF_FRONT
        x0, x1 = sorted((xf - s * 0.05, xf + s * bt))
        L.box(c, x0, by0, bz0, x1, by1, bz1, L.JOIN, B, 'Badge')
        e = L.edges_where(body, lambda x, y, z: abs(abs(x) - (P.HALF_FRONT + bt)) < 0.02 and by0 - 0.01 <= y <= by1 + 0.01 and bz0 - 0.01 <= z <= bz1 + 0.01)
        L.chamfer(c, e, 0.6, 'Badge edge')
        xo = s * (P.HALF_FRONT + bt)
        if s > 0:
            to3 = lambda u, v, xo=xo: (xo, yc - lgw / 2 + u, zc + lh / 2 - v)
        else:
            to3 = lambda u, v, xo=xo: (xo, yc + lgw / 2 - u, zc + lh / 2 - v)
        L.logo(c, P.ART_DIR + '/robocore.json', to3, lgw, 0.5, (-s, 0, 0), B, 'Badge logo')
    return 'earth-mover details added'


def chassis_tread():
    """Tread-plate walkways on the deck over the gearboxes, like an earth-mover's deck: grooves in the bed face,
    alternating 45 degrees (its own step: the chassis is heavy and each feature takes a while)."""
    occ, c, B = chassis()
    (wx0, wx1), (wy0, wy1), gl, gw, gd = P.DECK_TREAD
    zt = P.BODY_TOP + 0.1
    nxg, nyg = max(1, int((wx1 - wx0) // 5.0)), max(1, int((wy1 - wy0) // 5.0))
    px_, py_ = (wx1 - wx0) / nxg, (wy1 - wy0) / nyg
    sk = L.sketch(c, L.plane_xy(c, zt), 'Tread plate')
    for s, _ in S(1):
        for i in range(nxg):
            for j in range(nyg):
                cx_, cy_ = s * (wx0 + (i + 0.5) * px_), wy0 + (j + 0.5) * py_
                ang = math.radians(45.0 if (i + j) % 2 == 0 else -45.0) * s
                ux, uy = math.cos(ang), math.sin(ang)
                L.poly(sk, [(cx_ + ux * su * gl / 2 - uy * sv * gw / 2, cy_ + uy * su * gl / 2 + ux * sv * gw / 2, zt)
                            for (su, sv) in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), gd + 0.1, L.CUT, (0, 0, -1), B, 'Tread plate')
    return '%d tread grooves' % (2 * nxg * nyg)


# ================================================================ line sled

def chassis_hand_edits():
    """Fred's hand edits from Fusion v30, replayed so a rebuild keeps them: 1 mm off both wheel-section outer wall
    faces between the corner chamfers (Extrude142/143, a face cut of -1 mm)."""
    if not P.HAND_EDITS:
        return 'hand edits off'
    occ, c, B = chassis()
    cutd = P.WHEEL_SKIN_CUT
    y0, y1 = -(P.WHEEL_SEC_Y - P.C_WHEEL), P.WHEEL_SEC_Y - P.C_WHEEL
    od, id_ = P.HUB_RING[0], P.HUB_RING[1]
    za = P.AXLE_Z
    band = fender_band()
    for s, _ in S(1):
        x0, x1 = xs(s, H - cutd, H + 0.05)
        L.box(c, x0, y0, P.FLOOR_Z0 - 0.1, x1, y1, P.BODY_TOP - 0.5, L.CUT, B, 'Wheel skin cut (v30 hand edit)')
        # a face cut leaves the hub ring and the fender arch standing on the uncut material: put those pedestals back
        xa, xb = s * (H - cutd - 0.05), s * (H + 0.35)
        sk = L.sketch(c, L.plane_yz(c, xa), 'Hub pedestal')
        L.circle(sk, xa, 0, za, od)
        L.circle(sk, xa, 0, za, id_)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, [(xa, 0, za + (od + id_) / 4)]), abs(xb - xa), L.JOIN, (s, 0, 0), B, 'Hub pedestal')
        _yz_extrude(c, B, xa, xb, lambda sk_, x_: L.poly(sk_, [(x_, y, z) for (y, z) in band]), 'Fender pedestal')
    # the cut detaches the ring and the fender; the pedestals overlap them again, so combine the pieces back in
    main = B[0]
    tools = adsk.core.ObjectCollection.create()
    for b in c.bRepBodies:
        if b is not main and b.name.startswith('Chassis') and b.volume * 1000 > 50:
            tools.add(b)
    if tools.count:
        ci = c.features.combineFeatures.createInput(main, tools)
        ci.operation = adsk.fusion.FeatureOperations.JoinFeatureOperation
        ci.isKeepToolBodies = False
        c.features.combineFeatures.add(ci)
    return 'wheel skins cut %.1f mm, hub and fender pedestals kept (%d pieces combined)' % (cutd, tools.count)


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
           # outer lip: 45-degree underside so the wheel prints flat-face-down without supports
           (rs, fl1 - P.FLANGE_T), (rf, fl1 - P.FLANGE_T + (rf - rs)), (rf, fl1 + (rf - rs)), (ri, fl1 + (rf - rs)), (ri, wz1), (hr, wz1),
           (hr, P.HUB_LEN), (0, P.HUB_LEN)]
    L.poly(sk, [(r, 0, z) for (r, z) in sec])
    L.done(sk)
    body = L.revolve(c, L.all_profiles(sk), c.zConstructionAxis, L.NEW, name='Wheel').bodies.item(0)
    body.name = 'Wheel'
    B = [body]
    # two grooves in the seat that the tyre's beads lock into (45-degree sides print without supports)
    gd, gw = P.RIM_GROOVE
    sk = L.sketch(c, c.xZConstructionPlane, 'Bead grooves')
    for zb in bead_z():
        L.poly(sk, [(rs + 0.2, 0, zb - gw / 2 - 0.2), (rs - gd, 0, zb - gw / 2 + gd), (rs - gd, 0, zb + gw / 2 - gd), (rs + 0.2, 0, zb + gw / 2 + 0.2)])
    L.done(sk)
    L.revolve(c, L.all_profiles(sk), c.zConstructionAxis, L.CUT, B, 'Bead grooves')
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


def bead_z():
    """Axial positions (wheel frame) of the two tyre beads / rim grooves."""
    z0 = P.RIM_Z0 + P.FLANGE_T
    return [z0 + P.TYRE_BEADS[0], z0 + P.TYRE_W - P.TYRE_BEADS[0]]


def build_tyre():
    """TPU tyre: stretched onto the rim (ID 45.2 on a 46 seat), two beads lock into the rim grooves,
    rounded crown with a staggered block tread (grooves deepest in the middle)."""
    L.delete_component('Tyre')
    occ = L.new_component('Tyre')
    c = occ.component
    fl0 = P.RIM_Z0 + P.FLANGE_T
    fl1 = fl0 + P.TYRE_W
    zc = (fl0 + fl1) / 2
    ri = P.TYRE_ID / 2
    re, ro = P.TYRE_EDGE_R, P.TYRE_OD / 2
    bz, bh, bw = P.TYRE_BEADS
    sk = L.sketch(c, c.xZConstructionPlane, 'Tyre section')
    lines = sk.sketchCurves.sketchLines
    pts = [(re, fl1), (ri, fl1)]
    for zb in reversed(bead_z()):
        pts += [(ri, zb + bw / 2), (ri - bh, zb + bw / 2 - bh), (ri - bh, zb - bw / 2 + bh), (ri, zb - bw / 2)]
    pts += [(ri, fl0), (re, fl0)]
    sps = [sk.sketchPoints.add(L.sp(sk, r, 0, z)) for (r, z) in pts]
    for k in range(len(sps) - 1):
        lines.addByTwoPoints(sps[k], sps[k + 1])
    sk.sketchCurves.sketchArcs.addByThreePoints(sps[-1], L.sp(sk, ro, 0, zc), sps[0])
    L.done(sk)
    body = L.revolve(c, L.all_profiles(sk), c.zConstructionAxis, L.NEW, name='Tyre').bodies.item(0)
    body.name = 'Tyre (TPU)'
    n, gw, gr = P.TREAD
    for (za, zb_, rot) in ((fl0 - 0.5, zc + 0.6, 0.0), (zc - 0.6, fl1 + 0.5, 180.0 / n)):
        sk = L.sketch(c, L.plane_xy(c, za), 'Tread groove')
        a = math.radians(rot)
        ca, sa = math.cos(a), math.sin(a)
        quad = [(gr, -gw / 2), (ro + 1.0, -gw / 2), (ro + 1.0, gw / 2), (gr, gw / 2)]
        L.poly(sk, [(x * ca - y * sa, x * sa + y * ca, za) for (x, y) in quad])
        L.done(sk)
        g = L.extrude(c, sk, L.all_profiles(sk), zb_ - za, L.CUT, (0, 0, 1), [body], 'Tread groove')
        ents = adsk.core.ObjectCollection.create()
        ents.add(g)
        pin = c.features.circularPatternFeatures.createInput(ents, c.zConstructionAxis)
        pin.quantity = adsk.core.ValueInput.createByReal(n)
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
    """Twin rear ball casters: a 1/2-inch steel ball snaps up into each socket printed in the chassis's rear
    corners. This step only places the two balls."""
    L.delete_component('Caster')
    L.delete_component('Caster ball')
    bocc = L.new_component('Caster ball')
    bc = bocc.component
    rb = P.BALL_D / 2
    sk = L.sketch(bc, bc.yZConstructionPlane, 'Ball')
    arc = sk.sketchCurves.sketchArcs.addByCenterStartSweep(L.sp(sk, 0, 0, rb), L.sp(sk, 0, 0, 2 * rb), math.pi)
    ax = sk.sketchCurves.sketchLines.addByTwoPoints(arc.startSketchPoint, arc.endSketchPoint)
    L.done(sk)
    f = L.revolve(bc, L.all_profiles(sk), ax, L.NEW, name='Ball')
    f.bodies.item(0).name = 'Ball 12.7 mm'
    L.place_instances(bc, [L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (x, P.CASTER_Y, 0)) for x in (P.CASTER_X, -P.CASTER_X)])
    return 'balls at (+-%.1f, %.1f)' % (P.CASTER_X, P.CASTER_Y)


def build_cover():
    """The real motor's encoder cover, end boss and socket (the STEP model lacks them): a reference body built
    on the right motor and placed on both (the left motor is the right one turned 180 degrees about the axle)."""
    L.delete_component('Encoder cover (reference)')
    occ = L.new_component('Encoder cover (reference)')
    c = occ.component
    t, h, ln = P.COVER
    xo = P.MOTOR_OUT - P.COVER_INSET
    xi = xo - t
    y0, y1 = P.COVER_Y
    za, zb = P.AXLE_Z - h / 2, P.AXLE_Z + h / 2
    body = L.box(c, xi, y0, za, xo, y1, zb, L.NEW, None, 'Cover').bodies.item(0)
    body.name = 'Encoder cover'
    B = [body]
    bs, yend = P.COVER_BOSS
    xc = (xi + xo) / 2
    L.box(c, xc - bs / 2, yend, P.AXLE_Z - bs / 2, xc + bs / 2, y0 + 0.1, P.AXLE_Z + bs / 2, L.JOIN, B, 'End boss')
    px, py, pout, py0 = P.COVER_PLUG
    L.box(c, xc - px / 2, py0, zb - 0.1, xc + px / 2, py0 + py, zb + pout, L.JOIN, B, 'Encoder socket')
    right = L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (0, 0, 0))
    left = L.matrix([(-1, 0, 0), (0, 1, 0), (0, 0, -1)], (0, 0, 2 * P.AXLE_Z))
    L.place_instances(c, [right, left])
    return 'cover inner face |x| %.2f, battery holder |x| %.2f' % (xi, P.BATT[0] / 2)


def place_battery():
    """BatteryHolder3S (3 x 18650, wired 1S3P), linked from its own file: cells along Y, base on the floor."""
    yc = (P.BATT_Y[0] + P.BATT_Y[1]) / 2
    m = L.matrix([(1, 0, 0), (0, 0, 1), (0, -1, 0)], (0, yc, P.BATT_Z0 + 0.9))
    return _insert(P.BATT_FILE_ID, m, 'BatteryHolder3S')


# ======================================================== reference parts
SERVO_PREFIXES = ('SG90 (reference)', 'Assembly Micro Servo', 'Servo v', 'Servo:')


def servo_occurrences():
    root = L.design().rootComponent
    return [o for o in root.occurrences if o.name.startswith(SERVO_PREFIXES)]


def _servo_frame(which, occ=None):
    """Matrix from the model FILE's root frame to the SG90 frame (long axis x, shaft up z, bottom at z 0).
    The SG90 file's geometry lives in a child ('Servo:1') with its own transform, so for it the frame is derived
    from the child's placement once the file is inserted at identity: SG90 <- native body <- child <- file root."""
    if which == 'shoulder':
        cols, t = P.MG90S_TO_SG90
        return L.matrix(cols, t)
    cols, t = P.SG90_NATIVE_TO_SG90
    m_native = L.matrix(cols, t)                       # native body coords -> SG90 frame
    child = next(ch for ch in occ.childOccurrences if ch.name.startswith('Servo:'))
    m_child = child.transform2.copy()                  # child -> world (= file root frame, inserted at identity)
    m_child.invert()
    return compose(m_native, m_child)                  # file root -> native -> SG90


def place_servos(theta=None):
    """Fred's servo models (2026-10-08): the MG90S on the shoulder, the SG90 on the gripper. Each file is inserted
    (linked) and posed through the SG90 frame; the SG90 model's own cross horn and pin are hidden because the jaw
    carries the single-arm horn."""
    theta = P.ARM_RAISED if theta is None else theta
    root = L.design().rootComponent
    for o in list(root.occurrences):
        if o.name.startswith(SERVO_PREFIXES):
            o.deleteMe()
    L.delete_component('SG90 (reference)')
    MA = arm_matrix(theta)
    placed = []
    for which, world in (('shoulder', servo1_matrix()), ('gripper', compose(MA, servo2_local()))):
        fid, name = P.SERVO_FILES[which]
        df = L.app.data.findFileById(fid)
        if which == 'shoulder':
            occ = root.occurrences.addByInsert(df, compose(world, _servo_frame(which)), True)
        else:
            probe = root.occurrences.addByInsert(df, L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (0, 0, 0)), True)
            m = compose(world, _servo_frame(which, probe))
            probe.deleteMe()
            occ = root.occurrences.addByInsert(df, m, True)
        tag(occ, 'arm', 'Arm' if which == 'gripper' else '')
        for ch in occ.childOccurrences:
            if ch.name.startswith(P.SERVO_HIDE):
                ch.isLightBulbOn = False
        placed.append('%s: %s' % (which, occ.name))
    return ', '.join(placed)


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


def _hex_pts(cx, cy, af, rot=0.0):
    r = af / math.sqrt(3)
    return [(cx + r * math.cos(math.radians(rot + 60 * k)), cy + r * math.sin(math.radians(rot + 60 * k))) for k in range(6)]


def _yz_extrude(c, B, x0, x1, draw, name, op=None):
    """Sketch on a YZ plane at x0 (draw(sk, x0) adds the curves), extruded to x1."""
    sk = L.sketch(c, L.plane_yz(c, x0), name)
    draw(sk, x0)
    L.done(sk)
    return L.extrude(c, sk, L.all_profiles(sk), abs(x1 - x0), op or L.JOIN, (1 if x1 > x0 else -1, 0, 0), B, name)


def build_arm_base():
    """Arm module base, styled as the excavator's cab: plate on the sonar bracket (2 x M3 into the dock), posts for
    the shoulder SG90 with louvre vents on the back, a rounded counterweight rear, and a printed D-pin for the
    yoke's free side."""
    L.delete_component('Arm base')
    occ = L.new_component('Arm base')
    c = occ.component
    zp0 = P.BODY_TOP + P.DOCK_STACK                # sits on the sonar bracket plate
    zp1 = zp0 + 3.0
    by0, by1 = P.ARM_BASE_Y
    sy, sz = P.SHOULDER
    lx, wy, hz = P.SG90_BODY
    yc = sy + P.SG90_SHAFT_X                       # servo body centre (Y)
    tab_y = (yc - P.SG90_TAB[4], yc + P.SG90_TAB[4])
    sk = L.sketch(c, L.plane_xy(c, zp0), 'Base plate')
    L.rounded_poly(sk, [(-31.0, by0), (31.0, by0), (31.0, by1), (-31.0, by1)], [11.0, 11.0, 4.0, 4.0], zp0)
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
    # cab look: louvre vents in the back of the rear post (like the toy excavator's engine cover)
    yb = y_back - 5.7
    sk = L.sketch(c, L.plane_xz(c, yb - 0.1), 'Louvres')
    for x in (-14.5, -11.5, -8.5, -5.5, -2.5):
        L.rounded_poly(sk, [(x - 0.7, zt - 17.0), (x + 0.7, zt - 17.0), (x + 0.7, zt - 4.0), (x - 0.7, zt - 4.0)], 0.69, plane='xz', fixed=yb - 0.1)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 1.1, L.CUT, (0, 1, 0), B, 'Louvres')
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
    # 3b (14 Oct): the step down to the sonar plate reads as a slope: a 45-degree chamfer along the plate's front
    # top edge (the tongue's side edges, which run along y, are left alone), and the socket heads sit in counterbores
    e = adsk.core.ObjectCollection.create()
    for ed in body.edges:
        try:
            a, b = L._vtx(ed)
        except Exception:
            continue
        pa, pb = (a.x * 10, a.y * 10, a.z * 10), (b.x * 10, b.y * 10, b.z * 10)
        if abs(pa[2] - zp1) > 0.05 or abs(pb[2] - zp1) > 0.05 or min(pa[1], pb[1]) < by1 - 11.2:
            continue
        if abs(pa[0] - pb[0]) < 0.05 and abs(pa[1] - pb[1]) > 0.3:
            continue
        e.add(ed)
    L.chamfer(c, e, P.ARM_BASE_FRONT_CHAMFER, 'Front edge chamfer')
    cb_d, cb_h = P.ARM_BASE_CBORE
    L.cyl_z(c, P.DOCK_INSERTS, 3.4, zp0 - 0.5, zp1 + 0.5, L.CUT, B, 'Dock screw holes')
    L.cyl_z(c, P.DOCK_INSERTS, cb_d, zp1 - cb_h, zp1 + 0.5, L.CUT, B, 'Dock screw counterbores')
    L.bed_chamfer(c, body, 'z', zp0, -1, 0.4, 'Bed chamfer')
    return occ


def build_arm(theta=None):
    """Lift arm styled as an excavator boom (Fred's toy excavator, 2026-10-07): two curved side plates with diamond
    truss windows (the right one screwed to the servo horn, the left one on the D-pin), a hydraulic-cylinder
    look-alike along the top that also stiffens the yoke, the RoboCore gear with a hex bolt head on the shoulder,
    bolt-head bosses at the wrist, and the wrist deck that carries the gripper servo. Built in the arm frame
    (x = robot X, y along the arm, z up when the arm is level)."""
    L.delete_component('Arm')
    occ = L.new_component('Arm', m=arm_matrix(P.ARM_RAISED if theta is None else theta))
    c = occ.component
    xl, xr = P.ARM_PLATE_X[1][0], P.ARM_PLATE_X[0][1]
    dy0, dy1 = P.ARM_DECK_Y
    sk = L.sketch(c, L.plane_xy(c, -7.0), 'Deck')
    L.rounded_poly(sk, [(xl, dy0), (xr, dy0), (xr, dy1), (xl, dy1)], [0, 0, 5, 5], -7.0)
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), 3.0, L.NEW, (0, 0, 1), name='Deck').bodies.item(0)
    body.name = 'Arm'
    B = [body]
    pts, radii = P.BOOM
    for (x0, x1) in P.ARM_PLATE_X:
        _yz_extrude(c, B, x0, x1, lambda sk, xf: L.rounded_poly(sk, pts, radii, plane='yz', fixed=xf), 'Boom plate')
        _yz_extrude(c, B, x0, x1, lambda sk, xf: L.circle(sk, xf, 0, 0, 14.0), 'Shoulder boss')

    def diamonds(sk, xf):
        for (y, z, h) in P.BOOM_WINDOWS:
            L.poly(sk, [(xf, y - h, z), (xf, y, z - h), (xf, y + h, z), (xf, y, z + h)])

    def topo_windows(sk, xf):
        for poly in P.BOOM_WINDOWS_TOPO:
            L.poly(sk, [(xf, y, z) for (y, z) in poly])
    for (x0, x1) in P.ARM_PLATE_X:
        if getattr(P, 'BOOM_WINDOW_STYLE', 'diamonds') == 'topo':
            # cut from 0.5 inside the plate's inner face to exactly its outer face (the wrist bolt boss sits there)
            xin, xout = (x0, x1) if abs(x0) < abs(x1) else (x1, x0)
            _yz_extrude(c, B, xin - 0.5 * (1 if xin > 0 else -1), xout, topo_windows, 'Topology windows', L.CUT)
        else:
            _yz_extrude(c, B, x0 - 0.5, x1 + 0.5, diamonds, 'Truss windows', L.CUT)
    L.box(c, P.ARM_PLATE_X[1][1] - 0.1, 36.0, -7.0, P.ARM_PLATE_X[0][0] + 0.1, 42.0, -4.0, L.JOIN, B, 'Mid brace')
    # hydraulic-cylinder look-alike between the plate tops: barrel, gland, rod and two eyes on cross saddles,
    # carried by a central web (it prints on the web, and the saddles bridge only half the gap each)
    xm = (P.ARM_PLATE_X[1][1] + P.ARM_PLATE_X[0][0]) / 2
    zc, rb, rr, (cy0, cy1, ry1), eyes = P.BOOM_CYL
    xi0, xi1 = P.ARM_PLATE_X[1][1] - 0.1, P.ARM_PLATE_X[0][0] + 0.1
    for ye in eyes:
        L.box(c, xi0, ye - 2.0, 8.5, xi1, ye + 2.0, zc - 1.0, L.JOIN, B, 'Cylinder saddle')
    L.box(c, xm - 1.0, eyes[0], 8.4, xm + 1.0, eyes[1], zc, L.JOIN, B, 'Cylinder web')
    L.box(c, xm - 1.0, 36.0, -4.1, xm + 1.0, 42.0, 8.5, L.JOIN, B, 'Cylinder web')

    def cyl_y(y0, y1, r, name):
        sk = L.sketch(c, L.plane_xz(c, y0), name)
        L.circle(sk, xm, y0, zc, 2 * r)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), y1 - y0, L.JOIN, (0, 1, 0), B, name)
    cyl_y(cy0, cy1, rb, 'Cylinder barrel')
    cyl_y(cy1 - 1.5, cy1, rb + 0.6, 'Cylinder gland')
    cyl_y(cy1 - 0.1, ry1, rr, 'Cylinder rod')
    for ye in eyes:
        _yz_extrude(c, B, xm - 3.0, xm + 3.0, lambda sk, xf, ye=ye: L.circle(sk, xf, ye, zc, 8.0), 'Cylinder eye')
    # RoboCore gear + hex bolt head on the right shoulder (the horn screw sits in a counterbore in the hex)
    xo = P.ARM_PLATE_X[0][1]
    nt, rr0, rt, gh, haf = P.GEAR_BOSS

    def gear(sk, xf):
        g = []
        for k in range(nt):
            a0 = 2 * math.pi * k / nt
            for (da, r_) in ((-0.20, rr0), (-0.11, rt), (0.11, rt), (0.20, rr0)):
                g.append((xf, r_ * math.cos(a0 + da), r_ * math.sin(a0 + da)))
        L.poly(sk, g)
    _yz_extrude(c, B, xo - 0.05, xo + gh, gear, 'Gear boss')
    _yz_extrude(c, B, xo + gh - 0.05, xo + 2 * gh, lambda sk, xf: L.poly(sk, [(xf, y, z) for (y, z) in _hex_pts(0, 0, haf, 30)]), 'Bolt head')
    _yz_extrude(c, B, xo + 2 * gh + 0.1, xo + 1.0, lambda sk, xf: L.circle(sk, xf, 0, 0, 4.2), 'Screw counterbore', L.CUT)
    _yz_extrude(c, B, xo + 2 * gh + 0.1, P.ARM_PLATE_X[0][0] - 0.1, lambda sk, xf: L.circle(sk, xf, 0, 0, 2.4), 'Horn screw', L.CUT)

    def horn_holes(sk, xf):
        for y in P.HORN_HOLES:
            L.circle(sk, xf, y, 0, 2.4)
    _yz_extrude(c, B, xo + 0.1, P.ARM_PLATE_X[0][0] - 0.1, horn_holes, 'Horn arm screws', L.CUT)
    # bolt-head bosses at the wrist, both plates
    wy_, wz_, wd, waf = P.WRIST_BOSS
    for (xf, s) in ((xo, 1), (P.ARM_PLATE_X[1][0], -1)):
        _yz_extrude(c, B, xf - s * 0.05, xf + s * 1.0, lambda sk, x_: L.circle(sk, x_, wy_, wz_, wd), 'Wrist boss')
        _yz_extrude(c, B, xf + s * 0.95, xf + s * 2.0, lambda sk, x_: L.poly(sk, [(x_, y, z) for (y, z) in _hex_pts(wy_, wz_, waf, 30)]), 'Wrist bolt head')
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
    # left plate: bearing hole for the base's D-pin
    xb = P.ARM_PLATE_X[1][0] - 0.5
    _yz_extrude(c, B, xb, xb + 4.0, lambda sk, xf: L.circle(sk, xf, 0, 0, 5.4), 'Pivot hole', L.CUT)
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


def grip_horn_dir():
    """Unit vector (arm frame x, y) of the gripper horn's arm: tilted outward from the arm axis, inside the finger."""
    a = math.radians(P.GRIP_HORN_ANGLE)
    return (-math.sin(a), math.cos(a))


def build_jaw(side):
    """Gripper jaw in the arm frame, styled as an excavator claw with bucket teeth on the grip edge.
    side -1: driven jaw on the gripper servo's horn; +1: idle jaw on an M3."""
    name = 'Jaw L' if side < 0 else 'Jaw R'
    L.delete_component(name)
    occ = L.new_component(name)
    c = occ.component
    z0, z1 = -11.5, -7.5
    cx, cy = side * P.JAW_PITCH_R, P.JAW_PIVOT_Y
    tip = cy + P.JAW_LEN
    sk = L.sketch(c, L.plane_xy(c, z0), 'Finger')
    finger = [(-15.4, cy), (-15.4, cy + 16.0), (-14.6, cy + 21.5), (-12.6, cy + 26.5), (-9.6, cy + 30.8), (-6.0, tip),
              (-1.4, tip), (-0.8, tip - 0.8), (-2.2, tip - 2.2), (-0.8, tip - 3.6), (-2.2, tip - 5.0), (-0.8, tip - 6.4),
              (-2.4, tip - 8.0), (-9.2, cy + 17.9), (-9.2, cy + 7.9), (-4.5, cy + 5.4)]
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
        # the horn's hub goes up through the jaw onto the servo spline; its arm lies in a slot in the jaw's
        # underside (pointing along the finger) and two M2 x 4 screws hold it
        hd, hh, bore, at, al, aw = P.HORN
        L.cyl_z(c, [(cx, cy)], 12.6, z1 + 0.1, z1 - 0.8, L.CUT, B, 'Gear tower clearance')
        L.cyl_z(c, [(cx, cy)], hd + 0.4, z1 + 0.1, z0 - 0.1, L.CUT, B, 'Horn hub')
        ux, uy = grip_horn_dir()
        nx, ny = uy, -ux
        w = aw / 2 + 0.2
        zs = z0 - 0.1
        sk = L.sketch(c, L.plane_xy(c, zs), 'Horn arm')
        L.poly(sk, [(cx + nx * w, cy + ny * w, zs), (cx + ux * (al + 0.5) + nx * w, cy + uy * (al + 0.5) + ny * w, zs),
                    (cx + ux * (al + 0.5) - nx * w, cy + uy * (al + 0.5) - ny * w, zs), (cx - nx * w, cy - ny * w, zs)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), 1.3, L.CUT, (0, 0, 1), B, 'Horn arm')
        L.cyl_z(c, [(cx + ux * d, cy + uy * d) for d in P.HORN_HOLES], 1.6, z0 - 0.1, z1 + 0.1, L.CUT, B, 'Horn screw pilots')
    else:
        L.cyl_z(c, [(cx, cy)], 3.3, z1 + 0.1, z0 - 0.1, L.CUT, B, 'Pivot hole')
    L.bed_chamfer(c, body, 'z', z0, -1, 0.3, 'Bed chamfer')
    return occ


def place_arm(theta=None, open_deg=None):
    """Pose the arm module: arm angle (deg from horizontal-forward) and jaw opening (each jaw).
    Once the joints exist (step 'joints') this drives them; before that it places the parts directly."""
    theta = P.ARM_RAISED if theta is None else theta
    open_deg = P.ARM_OPEN if open_deg is None else open_deg
    if find_joint('Shoulder') is not None:
        return pose(theta, open_deg)
    MA = arm_matrix(theta)
    L.place_instances(L.find_occurrence('Arm').component, [MA])
    L.place_instances(L.find_occurrence('Jaw L').component, [compose(MA, rot_z_about(-P.JAW_PITCH_R, P.JAW_PIVOT_Y, open_deg))])
    L.place_instances(L.find_occurrence('Jaw R').component, [compose(MA, rot_z_about(P.JAW_PITCH_R, P.JAW_PIVOT_Y, -open_deg))])
    place_servos(theta)
    return 'arm %.1f deg, jaws %.1f deg (floor pose %.1f deg)' % (theta, open_deg, arm_angle_floor())


def build_sonar_bracket():
    """Sonar bracket (Fred, 2026-10-07): a plate on the dock (2 x M3 into the tower inserts; the arm base stacks on
    it) with a headlight-style pod hanging from its front. The ultrasonic board goes into the pod from the BACK:
    its two cans drop into the round eyes (which locate it) and two snap strips on the side walls click in behind
    the PCB. The JST plug on the back of the board goes straight back through the slot in the chassis nose."""
    L.delete_component('Dock cap')
    L.delete_component('Sonar bracket')
    occ = L.new_component('Sonar bracket')
    c = occ.component
    z0 = P.BODY_TOP
    z1 = z0 + P.DOCK_STACK
    py0, py1 = P.SONAR_PLATE_Y
    ch, chf = P.SONAR_PLATE_CHAMFER, P.SONAR_PLATE_CHAMFER_F
    sk = L.sketch(c, L.plane_xy(c, z0), 'Bracket plate')
    L.poly(sk, [(-31.0, py0 + ch, z0), (-31.0 + ch, py0, z0), (31.0 - ch, py0, z0), (31.0, py0 + ch, z0),
                (31.0, py1 - chf, z0), (31.0 - chf, py1, z0), (-31.0 + chf, py1, z0), (-31.0, py1 - chf, z0)])
    L.done(sk)
    body = L.extrude(c, sk, L.all_profiles(sk), P.DOCK_STACK, L.NEW, (0, 0, 1), name='Plate').bodies.item(0)
    body.name = 'Sonar bracket'
    B = [body]
    hx, w = P.POD_HALF, P.POD_WALL
    hxf, cf = P.POD_FRONT
    py_0, py_1 = P.POD_Y
    zb = P.POD_Z0
    ft = P.POD_FACE_T
    yf = P.POD_SNAP[1]                              # the front block starts at the slit's front edge
    # faceplate across the full front block, side walls (their rear parts become the snap strips), and the thicker
    # front block outside the walls (1a, 14 Oct: room for 4 mm corner chamfers beside the bezels)
    L.box(c, -hxf, py_1 - ft, zb, hxf, py_1, z0 + 0.1, L.JOIN, B, 'Faceplate')
    for s_, _ in S(1):
        x0, x1 = xs(s_, hx - w, hx)
        L.box(c, x0, py_0, zb, x1, py_1 - ft + 0.1, z0 + 0.1, L.JOIN, B, 'Pod side wall')
        x0, x1 = xs(s_, hx - 0.1, hxf)
        L.box(c, x0, yf, zb, x1, py_1 - ft + 0.1, z0 + 0.1, L.JOIN, B, 'Front block side')
    # eyes: round openings for the cans, with raised bezels on the front
    eye_d = P.EYE_D + P.EYE_CLEAR
    bz_od, bz_h = P.EYE_BEZEL
    ze = P.US_CZ + P.EYE_DZ
    for xe in (P.US_CAN_X, -P.US_CAN_X):
        sk = L.sketch(c, L.plane_xz(c, py_1), 'Eye bezel')
        L.circle(sk, xe, py_1, ze, bz_od)
        L.circle(sk, xe, py_1, ze, eye_d)
        L.done(sk)
        L.extrude(c, sk, L.profiles_at(sk, [(xe + (bz_od + eye_d) / 4, py_1, ze)]), bz_h, L.JOIN, (0, 1, 0), B, 'Eye bezel')
        sk = L.sketch(c, L.plane_xz(c, py_1 + bz_h + 0.5), 'Eye')
        L.circle(sk, xe, py_1 + bz_h + 0.5, ze, eye_d)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), ft + bz_h + 1.0, L.CUT, (0, -1, 0), B, 'Eye')
        # the opening sits back behind a 45-degree bezel (1a): a chamfer on the bore's front edge
        e = L.edges_where(body, lambda x, y, z, xe=xe: abs(y - (py_1 + bz_h)) < 0.05 and abs(math.hypot(x - xe, z - ze) - eye_d / 2) < 0.05)
        L.chamfer(c, e, P.EYE_RECESS, 'Eye recess')
    # window for the crystal on the board's front face (it stands 3 mm proud, more than the faceplate is thick)
    wx, wz0, wz1 = P.POD_WINDOW
    sk = L.sketch(c, L.plane_xz(c, py_1 - 0.02), 'Crystal window')
    L.rounded_poly(sk, [(-wx, wz0), (wx, wz0), (wx, wz1), (-wx, wz1)], 1.0, plane='xz', fixed=py_1 - 0.02)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), ft + 0.5, L.CUT, (0, -1, 0), B, 'Crystal window')
    # brow over the eyes (its top slopes 47 degrees so it prints plate-down)
    reach, bz0, bz1 = P.POD_BROW
    sk = L.sketch(c, L.plane_yz(c, -hxf), 'Brow')
    L.poly(sk, [(-hxf, py_1 - 0.1, bz0), (-hxf, py_1 + reach, bz0), (-hxf, py_1 + reach, bz0 + 1.0), (-hxf, py_1 - 0.1, bz1)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 2 * hxf, L.JOIN, (1, 0, 0), B, 'Brow')
    # snap strips: a slit through each side wall makes its rear part a strip hanging from the plate; a hook on
    # the strip's inner face (45-degree lead-in at the back) clicks in behind the PCB
    sy0, sy1, hy, hr, hz0, hz1 = P.POD_SNAP
    for s_, _ in S(1):
        x0, x1 = xs(s_, hx - w - 0.1, hx + 0.1)
        L.box(c, x0, sy0, zb - 0.5, x1, sy1, z0 - 0.05, L.CUT, B, 'Snap slit')
        xi = s_ * (hx - w + 0.05)
        sk = L.sketch(c, L.plane_xy(c, hz0), 'Snap hook')
        L.poly(sk, [(xi, hy - hr - 0.7, hz0), (xi, hy, hz0), (xi - s_ * hr, hy, hz0), (xi - s_ * hr, hy - 0.4, hz0)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), hz1 - hz0, L.JOIN, (0, 0, 1), B, 'Snap hook')
    # cable notch in the faceplate's bottom? no: the plug leaves at the back. Dock screw holes through the plate:
    L.cyl_z(c, P.DOCK_INSERTS, 3.4, z0 - 0.5, z1 + 0.5, L.CUT, B, 'Dock screw holes')
    # RoboCore logo on top of the plate (reads from behind the robot, front up); the arm base covers it when fitted
    import json
    wl, yc = P.LOGO_RC
    d = json.load(open(P.ART_DIR + '/robocore.json'))
    hh = d['height'] * wl / d['width']
    L.logo(c, P.ART_DIR + '/robocore.json', lambda u, v: (u - wl / 2, yc + hh / 2 - v, z1), wl, P.DEBOSS, (0, 0, -1), B, 'Bracket logo')
    # front corners (1a, 14 Oct): a 45-degree cut through the front block, the faceplate and the brow ends, and a
    # chamfered step where the block meets the thinner strips; then the bottom edges (front block 1.2, strips 0.8)
    zc = zb - 1.0
    for s_, _ in S(1):
        sk = L.sketch(c, L.plane_xy(c, zc), 'Pod corner chamfer')
        L.poly(sk, [(s_ * (hxf - cf - 6.0), py_1 + 6.0, zc), (s_ * (hxf + 6.0), py_1 - cf - 6.0, zc), (s_ * (hxf + 6.0), py_1 + 6.0, zc)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), z0 - zc, L.CUT, (0, 0, 1), B, 'Pod corner chamfer')
        sk = L.sketch(c, L.plane_xy(c, zc), 'Pod step chamfer')
        L.poly(sk, [(s_ * (hxf - 2.0), yf - 0.05, zc), (s_ * (hxf + 0.5), yf + 2.5, zc), (s_ * (hxf + 0.5), yf - 0.05, zc)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), z0 - zc, L.CUT, (0, 0, 1), B, 'Pod step chamfer')
    k = hxf + py_1 - cf
    e = L.edges_where(body, lambda x, y, z: abs(z - zb) < 0.05 and y > yf + 0.5 and (abs(abs(x) - hxf) < 0.05 or abs(y - py_1) < 0.05 or abs(abs(x) + y - k) < 0.1))
    L.chamfer(c, e, 1.2, 'Pod bottom chamfer')
    e = L.edges_where(body, lambda x, y, z: abs(z - zb) < 0.05 and y < yf - 0.5 and (abs(abs(x) - hx) < 0.05 or abs(y - py_0) < 0.05))
    L.chamfer(c, e, 0.8, 'Strip bottom chamfer')
    # the plate's front edge, top (bed) side, in line with the pod's corners
    e = L.edges_where(body, lambda x, y, z: abs(z - z1) < 0.05 and y > py1 - chf - 0.3)
    L.chamfer(c, e, P.SONAR_PLATE_EDGE, 'Plate front chamfer')
    L.bed_chamfer(c, body, 'z', z1, 1, 0.4, 'Bed chamfer')
    return occ


# ======================================================== expansion bus
def _rail_clip(c, y0, y1, xo, name):
    """Clip profile on a wall whose outer face is at X = xo (right side), extruded y0 -> y1: a tongue into the
    bus groove (45-degree underside like the groove's), a bar over the deck edge, and a thick tab over the deck
    for the thumb screw. The screw pressing on the deck lifts the clip and pulls the tongue up against the
    groove's flat top."""
    g, t = P.CLIP_GAP, P.CLIP_T
    depth_g, gz0, gz1 = P.BUS_GROOVE
    zt = P.BODY_TOP
    reach, th = P.CLIP_TAB
    xin0, xtab = xo - reach, xo - 1.0
    xout0 = xo + g                               # leg inner face, on the wall
    xout1 = xout0 + t
    zbar0, zbar1 = zt + g, zt + g + t
    xtip = xo - depth_g + g                      # tongue tip
    ztop = gz1 - g                               # tongue top: bears on the groove's flat top
    zund = gz0 + 2 * g                           # tongue underside at the tip, then 45 degrees down to the leg
    prof = [(xin0, zbar0), (xout0, zbar0), (xout0, ztop), (xtip, ztop), (xtip, zund), (xout0, zund - (xout0 - xtip)),
            (xout0, P.CLIP_LEG_Z0), (xout1, P.CLIP_LEG_Z0), (xout1, zbar1), (xtab, zbar1),
            (xtab - (th - t), zbar0 + th), (xin0, zbar0 + th)]
    sk = L.sketch(c, L.plane_xz(c, y0), name)
    L.poly(sk, [(x, y0, z) for (x, z) in prof])
    L.done(sk)
    return L.extrude(c, sk, L.all_profiles(sk), y1 - y0, L.NEW, (0, 1, 0), None, name).bodies.item(0)


def clip_screw_x(xo):
    """X of the clip's thumb screw for a wall whose outer face is at xo."""
    reach, th = P.CLIP_TAB
    return xo - (reach + 1.0 + th - P.CLIP_T) / 2


def detent_near(x, y):
    """The rail detent closest to (x, y): clips are placed on these."""
    return min(bus_positions()[1], key=lambda d: math.hypot(d[0] - x, d[1] - y))


def _clip_core(c, xo, yc, name, bump_dy=0.0):
    """Rail clip on a wall whose outer face is at x = xo (facing +x), centred at y = yc: hook, detent bump (bump_dy
    along the rail from the centre), and an M3 insert in the tab: the thumb screw presses on the deck and pulls
    the hook up under the lip. Returns (body, outer-leg outer face x)."""
    y0, y1 = yc - P.CLIP_W / 2, yc + P.CLIP_W / 2
    body = _rail_clip(c, y0, y1, xo, name)
    B = [body]
    xout0 = xo + P.CLIP_GAP
    depth_g, gz0, gz1 = P.BUS_GROOVE
    xtip = xo - depth_g + P.CLIP_GAP
    zd = gz0 + 0.9
    sk = L.sketch(c, L.plane_xy(c, zd), 'Detent bump')
    yb = yc + bump_dy
    L.poly(sk, [(xtip + 0.05, yb - 0.6, zd), (xtip + 0.05, yb + 0.6, zd), (xtip - 0.55, yb, zd)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 1.6, L.JOIN, (0, 0, 1), B, 'Detent bump')
    xsc = clip_screw_x(xo)
    ztop = P.BODY_TOP + P.CLIP_GAP + P.CLIP_TAB[1]
    if P.FASTENERS == 'plastic':
        # captive M3 nut: a slot into the tab from its +y side, centred on the screw, leaving 1.9 mm above and below
        af, nt = P.NUT_M3
        zmid = (ztop + P.BODY_TOP + P.CLIP_GAP) / 2
        L.box(c, xsc - (af + 0.2) / 2, yc - af / math.sqrt(3) - 0.15, zmid - (nt + 0.2) / 2, xsc + (af + 0.2) / 2, y1 + 1.0, zmid + (nt + 0.2) / 2, L.CUT, B, 'Nut slot')
    else:
        L.cyl_z(c, [(xsc, yc)], P.INSERT_M3_D, ztop + 0.1, ztop - P.INSERT_M3_DEPTH, L.CUT, B, 'Thumb screw insert')
    L.cyl_z(c, [(xsc, yc)], 3.4, ztop, P.BODY_TOP - 0.1, L.CUT, B, 'Thumb screw hole')
    return body, xout0 + P.CLIP_T


def build_clip():
    """Expansion-bus clip (template) on the right rear-section wall: a tongue in the bus groove, a thumb screw on
    the deck clamps it, a bump clicks into the 8 mm detents, and the outer boss takes an M3 insert."""
    L.delete_component('Bus clip')
    occ = L.new_component('Bus clip')
    c = occ.component
    yc = detent_near(P.HALF_REAR, P.CLIP_Y)[1]
    body, xout1 = _clip_core(c, P.HALF_REAR, yc, 'Clip')
    body.name = 'Bus clip'
    B = [body]
    zb = P.CLIP_LEG_Z0
    L.box(c, xout1 - 0.1, yc - 5.0, zb, xout1 + 5.0, yc + 5.0, P.BODY_TOP + P.CLIP_GAP + P.CLIP_T, L.JOIN, B, 'Accessory boss')
    zm = (zb + P.BODY_TOP) / 2
    if P.FASTENERS == 'plastic':
        af, nt = P.NUT_M3
        rc = (af + 0.2) / math.sqrt(3)
        sk = L.sketch(c, L.plane_yz(c, xout1 + 5.0), 'Accessory nut pocket')
        L.poly(sk, [(xout1 + 5.0, yc + rc * math.cos(math.radians(60 * k + 30)), zm + rc * math.sin(math.radians(60 * k + 30))) for k in range(6)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), nt + 0.2, L.CUT, (-1, 0, 0), B, 'Accessory nut pocket')
        sk = L.sketch(c, L.plane_yz(c, xout1 + 5.0), 'Accessory screw hole')
        L.circle(sk, xout1 + 5.0, yc, zm, 3.4)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), 8.0, L.CUT, (-1, 0, 0), B, 'Accessory screw hole')
    else:
        sk = L.sketch(c, L.plane_yz(c, xout1 + 5.0), 'Accessory insert')
        L.circle(sk, xout1 + 5.0, yc, zm, P.INSERT_M3_D)
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), P.INSERT_M3_DEPTH, L.CUT, (-1, 0, 0), B, 'Accessory insert')
    return occ


def build_ballast_clip():
    """Ballast clip for the arm module: a bus clip on the rear rail with a pocket for 3 stacked M8 nuts.
    Built in a local frame (wall face at x = 0) and placed twice on the rear rail."""
    L.delete_component('Ballast clip')
    occ = L.new_component('Ballast clip')
    c = occ.component
    body, xout1 = _clip_core(c, 0.0, 0.0, 'Clip', P.BALLAST_BUMP_DY)
    body.name = 'Ballast clip'
    B = [body]
    af = 13.0
    wall = 1.2
    xc = xout1 - 0.1 + af / math.sqrt(3) + wall
    za, zt = P.BUS_GROOVE[1] + 1.0 - 21.0, P.BUS_GROOVE[1] + 1.0
    L.box(c, xout1 - 0.1, -af / 2 - wall, za, xc + af / math.sqrt(3) + wall, af / 2 + wall, zt, L.JOIN, B, 'Nut box')
    sk = L.sketch(c, L.plane_xy(c, zt + 0.5), 'Nut pocket')
    rc = af / math.sqrt(3)
    L.poly(sk, [(xc + rc * math.cos(math.radians(60 * k)), rc * math.sin(math.radians(60 * k)), zt + 0.5) for k in range(6)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), 3 * 6.5 + 1.0, L.CUT, (0, 0, -1), B, 'Nut pocket')
    mats = [L.matrix([(0, -1, 0), (1, 0, 0), (0, 0, 1)], (x, Y0, 0)) for x in P.BALLAST_CLIP_X]
    L.place_instances(c, mats)
    return occ


def build_coupon():
    """40 mm of wall (deck strip, wall + band, bus groove, detents, two holes): prints deck down in about 20 min,
    to tune CLIP_GAP."""
    L.delete_component('Rail coupon')
    m = L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (60.0, -150.0, 0.0))
    occ = L.new_component('Rail coupon', m=m)
    c = occ.component
    xo = 0.0
    depth_g, gz0, gz1 = P.BUS_GROOVE
    zf = P.HOLE_BAND[0] - 4.0
    body = L.box(c, xo - 18.0, 0, DECK_Z, xo, 40.0, P.BODY_TOP, L.NEW, None, 'Deck').bodies.item(0)
    body.name = 'Rail coupon'
    B = [body]
    L.box(c, xo - P.SKIN_T, 0, zf, xo, 40.0, P.BODY_TOP, L.JOIN, B, 'Wall')
    L.box(c, xo - P.HOLE_BAND_T, 0, P.HOLE_BAND[0], xo - P.SKIN_T, 40.0, DECK_Z + 0.1, L.JOIN, B, 'Band')
    e = L.edges_where(body, lambda x, y, z: abs(z - P.HOLE_BAND[0]) < 0.05 and abs(x - (xo - P.HOLE_BAND_T)) < 0.05)
    L.chamfer(c, e, P.HOLE_BAND_T - P.SKIN_T - 0.05, 'Band 45')
    run_prism(c, B, (xo, 0.0), (xo, 40.0), (1.0, 0.0), [(0.5, gz0 - depth_g - 0.5), (0.5, gz1), (-depth_g, gz1), (-depth_g, gz0)], 'Bus groove', L.CUT)
    zb = gz0 - 0.4
    sk = L.sketch(c, L.plane_xy(c, zb), 'Detents')
    dw, dd = P.DETENT
    k = dw / 2 / dd * (dd + 0.3)
    for i in range(5):
        y = 4.0 + 8.0 * i
        L.poly(sk, [(xo - depth_g - dd, y, zb), (xo - depth_g + 0.3, y + k, zb), (xo - depth_g + 0.3, y - k, zb)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), gz1 - 0.2 - zb, L.CUT, (0, 0, 1), B, 'Detents')
    sk = L.sketch(c, L.plane_yz(c, xo + 0.5), 'Holes')
    for y in (12.0, 28.0):
        L.circle(sk, xo + 0.5, y, P.HOLE_Z, P.HOLE_D)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), P.HOLE_BAND_T + 1.0, L.CUT, (-1, 0, 0), B, 'Holes')
    occ.isLightBulbOn = False
    return occ


def build_fastener_coupon():
    """Test coupon for the Task A joints, printed flat: (1) a boss with the M2 thread-forming pilot, as under the deck;
    (2) a deck-top hex pocket for a captive M3 nut with the clearance hole; (3) a clip-tab piece on edge with the
    side nut slot. Assemble and remove 10 times, then check the hold (see the README)."""
    L.delete_component('Fastener coupon')
    m = L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (-110.0, -150.0, 0.0))
    occ = L.new_component('Fastener coupon', m=m)
    c = occ.component
    af, nt = P.NUT_M3
    body = L.box(c, 0, 0, 0, 44.0, 20.0, 6.0, L.NEW, None, 'Base').bodies.item(0)
    body.name = 'Fastener coupon'
    B = [body]
    # (1) board boss: column with the M2 pilot
    L.cyl_z(c, [(8.0, 10.0)], P.BOARD_BOSS_D, 5.9, 16.0, L.JOIN, B, 'Boss')
    L.cyl_z(c, [(8.0, 10.0)], P.PILOT_M2[0], 16.1, 16.0 - P.PILOT_M2[1], L.CUT, B, 'M2 pilot')
    # (2) deck-top nut pocket with the clearance hole through the base
    hex_pocket_z(c, B, 22.0, 10.0, af + 0.2, 6.1, 6.0 - nt - 0.2, 'M3 nut pocket')
    L.cyl_z(c, [(22.0, 10.0)], 3.4, 6.1, -0.1, L.CUT, B, 'M3 clearance')
    # (3) clip tab on edge: 6.5 thick (x), 16 wide (y), 13 tall; nut slot in from the top, screw hole along x
    tw = P.CLIP_TAB[1]
    L.box(c, 32.0, 2.0, 5.9, 32.0 + tw, 18.0, 19.0, L.JOIN, B, 'Tab')
    L.box(c, 32.0 + tw / 2 - (nt + 0.2) / 2, 10.0 - (af + 0.2) / 2, 15.0 - af / math.sqrt(3) - 0.15, 32.0 + tw / 2 + (nt + 0.2) / 2, 10.0 + (af + 0.2) / 2, 19.5, L.CUT, B, 'Tab nut slot')
    sk = L.sketch(c, L.plane_yz(c, 31.5), 'Tab screw hole')
    L.circle(sk, 31.5, 10.0, 15.0, 3.4)
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), tw + 1.0, L.CUT, (1, 0, 0), B, 'Tab screw hole')
    L.bed_chamfer(c, body, 'z', 0.0, -1, 0.5, 'Bed chamfer')
    occ.isLightBulbOn = False
    return occ


# ===================================================================== hardware
# Every screw, insert, washer, nut and servo horn, modelled and placed (Fred, 2026-10-07). Each part is built in
# its own frame: axis = local z, bearing face (under the head / top of an insert) at z 0, shank along -z.
SCREWS = {
    # name: (head type, d, length, head d, head height)
    'Screw M2x4 pan': ('pan', 2.0, 4.0, 3.8, 1.3),        # gripper horn (centre + 2 into the jaw)
    'Screw M2x5 pan': ('pan', 2.0, 5.0, 3.8, 1.3),        # shoulder horn arm to the right boom plate (2)
    'Screw M2x6 pan': ('pan', 2.0, 6.0, 3.8, 1.3),        # board (4), wheels (2, self-tapping into the shaft)
    'Screw M2x8 pan': ('pan', 2.0, 8.0, 3.8, 1.3),        # servo tabs (4, come with the SG90s), shoulder horn centre
    'Screw M3x8 pan': ('pan', 3.0, 8.0, 5.6, 1.8),        # idle jaw pivot (self-taps into the deck), line sensor (2, into the nose bosses)
    'Screw M3x8 socket': ('socket', 3.0, 8.0, 5.5, 3.0),  # sonar bracket into the dock (without the arm)
    'Screw M3x10 socket': ('socket', 3.0, 10.0, 5.5, 3.0),  # arm base + sonar bracket into the dock
    'Thumb screw M3x8': ('thumb', 3.0, 8.0, 7.0, 3.5),    # bus and ballast clips (presses on the deck)
}
INSERTS = {'Insert M2': (3.15, 2.0, 4.0), 'Insert M3': (3.95, 3.0, 5.0)}   # od, id, length (holes 3.2 / 4.0)
HW_NAMES = tuple(SCREWS) + tuple(INSERTS) + ('Washer M2', 'Nut M8', 'Nut M3', 'SG90 horn')
HW_COLOURS = {'pan': (190, 190, 196), 'socket': (34, 34, 38), 'thumb': (34, 34, 38), 'Insert': (206, 162, 64),
              'Washer': (190, 190, 196), 'Nut': (190, 190, 196), 'SG90 horn': (238, 238, 232)}


def _hw_screw(name, kind, d, ln, hd, hh):
    L.delete_component(name)
    occ = L.new_component(name)
    c = occ.component
    body = L.cyl_z(c, [(0, 0)], hd, 0.0, hh, L.NEW, None, 'Head').bodies.item(0)
    body.name = name
    B = [body]
    L.cyl_z(c, [(0, 0)], d - 0.1, 0.05, -ln, L.JOIN, B, 'Shank')
    e = L.edges_where(body, lambda x, y, z: abs(z - hh) < 0.01 and abs(math.hypot(x, y) - hd / 2) < 0.05)
    L.chamfer(c, e, 0.25 if kind != 'pan' else 0.45 * hh, 'Head edge')
    if kind == 'pan':
        for (w, l_) in ((0.5, 2.0), (2.0, 0.5)):
            L.box(c, -w / 2, -l_ / 2, hh - 0.7, w / 2, l_ / 2, hh + 0.1, L.CUT, B, 'Cross recess')
    elif kind == 'socket':
        sk = L.sketch(c, L.plane_xy(c, hh + 0.1), 'Hex socket')
        L.poly(sk, [(x, y, hh + 0.1) for (x, y) in _hex_pts(0, 0, 0.83 * d)])
        L.done(sk)
        L.extrude(c, sk, L.all_profiles(sk), 0.6 * hh, L.CUT, (0, 0, -1), B, 'Hex socket')
    else:
        pts = [(hd / 2 * math.cos(2 * math.pi * k / 14), hd / 2 * math.sin(2 * math.pi * k / 14)) for k in range(14)]
        L.cyl_z(c, pts, 1.0, hh + 0.1, -0.1, L.CUT, B, 'Knurl')
    return c


def _hw_insert(name, od, id_, ln):
    L.delete_component(name)
    occ = L.new_component(name)
    c = occ.component
    sk = L.sketch(c, L.plane_xy(c, 0.0), name)
    L.circle(sk, 0, 0, 0, od)
    L.circle(sk, 0, 0, 0, id_)
    L.done(sk)
    body = L.extrude(c, sk, L.profiles_at(sk, [((od + id_) / 4, 0, 0)]), ln, L.NEW, (0, 0, -1), name='Insert').bodies.item(0)
    body.name = name
    sk = L.sketch(c, L.plane_xy(c, -ln * 0.5), 'Knurl groove')
    L.circle(sk, 0, 0, -ln * 0.5, od + 1.0)
    L.circle(sk, 0, 0, -ln * 0.5, od - 0.3)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(od / 2 + 0.2, 0, -ln * 0.5)]), 0.6, L.CUT, (0, 0, 1), [body], 'Knurl groove')
    return c


def _hw_washer():
    L.delete_component('Washer M2')
    occ = L.new_component('Washer M2')
    c = occ.component
    sk = L.sketch(c, L.plane_xy(c, 0.0), 'Washer')
    L.circle(sk, 0, 0, 0, 5.0)
    L.circle(sk, 0, 0, 0, 2.2)
    L.done(sk)
    L.extrude(c, sk, L.profiles_at(sk, [(1.8, 0, 0)]), 0.5, L.NEW, (0, 0, 1), name='Washer').bodies.item(0).name = 'Washer M2'
    return c


def _hw_nut():
    """M8 nut, bottom face at z 0 (it stands in the ballast clip's pocket); corners on local +x like the pocket."""
    L.delete_component('Nut M8')
    occ = L.new_component('Nut M8')
    c = occ.component
    sk = L.sketch(c, L.plane_xy(c, 0.0), 'Nut')
    L.poly(sk, [(x, y, 0.0) for (x, y) in _hex_pts(0, 0, 12.9)])
    L.circle(sk, 0, 0, 0, 8.0)
    L.done(sk)
    body = L.extrude(c, sk, L.profiles_at(sk, [(5.5, 0, 0)]), 6.4, L.NEW, (0, 0, 1), name='Nut').bodies.item(0)
    body.name = 'Nut M8'
    e = L.edges_where(body, lambda x, y, z: (abs(z) < 0.01 or abs(z - 6.4) < 0.01) and math.hypot(x, y) > 6.0)
    L.chamfer(c, e, 0.5, 'Nut chamfer')
    return c


def _hw_nut_m3():
    """M3 hex nut (DIN 934: 5.5 across flats, 2.4 thick), bottom face at z 0, flats parallel to local x."""
    L.delete_component('Nut M3')
    occ = L.new_component('Nut M3')
    c = occ.component
    af, nt = P.NUT_M3
    sk = L.sketch(c, L.plane_xy(c, 0.0), 'Nut')
    L.poly(sk, [(x, y, 0.0) for (x, y) in _hex_pts(0, 0, af, 30.0)])
    L.circle(sk, 0, 0, 0, 2.5)
    L.done(sk)
    body = L.extrude(c, sk, L.profiles_at(sk, [(af / 2 - 0.3, 0, 0)]), nt, L.NEW, (0, 0, 1), name='Nut').bodies.item(0)
    body.name = 'Nut M3'
    return c


def _hw_horn():
    """SG90 single-arm horn: hub on the spline (bore from z 0), arm flush with the hub top along +y."""
    L.delete_component('SG90 horn')
    occ = L.new_component('SG90 horn')
    c = occ.component
    hd, hh, bore, at, al, aw = P.HORN
    body = L.cyl_z(c, [(0, 0)], hd, 0.0, hh, L.NEW, None, 'Hub').bodies.item(0)
    body.name = 'SG90 horn'
    B = [body]
    sk = L.sketch(c, L.plane_xy(c, hh - at), 'Horn arm')
    L.poly(sk, [(-aw / 2, 0, hh - at), (aw / 2, 0, hh - at), (aw / 2 - 0.5, al - 1.5, hh - at), (0, al, hh - at), (-aw / 2 + 0.5, al - 1.5, hh - at)])
    L.done(sk)
    L.extrude(c, sk, L.all_profiles(sk), at, L.JOIN, (0, 0, 1), B, 'Horn arm')
    L.cyl_z(c, [(0, 0)], 4.9, -0.1, bore, L.CUT, B, 'Spline bore')
    L.cyl_z(c, [(0, 0)], 2.2, -0.1, hh + 0.1, L.CUT, B, 'Screw hole')
    L.cyl_z(c, [(0, y) for y in P.HORN_HOLES], 1.2, hh - at - 0.1, hh + 0.1, L.CUT, B, 'Arm holes')
    return c


def _unit(v):
    n = math.sqrt(sum(a * a for a in v))
    return tuple(a / n for a in v)


def hw_frame(o, zd, yd=None):
    """Matrix for a hardware part: origin o (mm), local z along zd, local y toward yd."""
    z = _unit(zd)
    if yd is None:
        yd = (0, 0, 1) if abs(z[2]) < 0.9 else (0, 1, 0)
    k = sum(a * b for a, b in zip(yd, z))
    y = _unit(tuple(a - k * b for a, b in zip(yd, z)))
    x = (y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0])
    return L.matrix([x, y, z], o)


def tag(occ, group, moves):
    """Remember what an occurrence belongs to: group 'base' / 'arm' / 'ballast' / 'noarm' (shown without the arm),
    and the moving part it rides on ('' = fixed)."""
    for (k, v) in (('group', group), ('moves', moves)):
        a = occ.attributes.itemByName('RoboCore', k)
        if a:
            a.value = v
        else:
            occ.attributes.add('RoboCore', k, v)


def tag_of(occ, key):
    a = occ.attributes.itemByName('RoboCore', key)
    return a.value if a else ''


def hardware_placements():
    """[(part, matrix, group, moves)] at the build pose: arm level, jaws closed, battery and sled in, wheels at 0."""
    A = arm_matrix(0.0)
    out = []

    def add(name, o, zd, yd=None, parent=None, group='base', moves=''):
        m = hw_frame(o, zd, yd)
        out.append((name, compose(parent, m) if parent is not None else m, group, moves))
    PX, NX, PZ, NZ = (1, 0, 0), (-1, 0, 0), (0, 0, 1), (0, 0, -1)
    # board on the deck: 4 x M2 insert + M2 x 6
    plastic = P.FASTENERS == 'plastic'
    af, nt = P.NUT_M3
    for (x, y) in P.BOARD_HOLES:
        if not plastic:
            add('Insert M2', (x, y, P.BODY_TOP), PZ)
        add('Screw M2x6 pan', (x, y, P.BOARD_Z + 0.02 + 1.53), PZ)
    # line sensor: 2 x M3 x 8 self-tapping up through the board into the nose bosses (rev 6)
    for (x, y) in P.LINE_HOLES:
        add('Screw M3x8 pan', (x, y, P.LINE_UNDER_Z), NZ)
    # dock: inserts in the towers; M3 x 10 through the arm base and the sonar bracket (M3 x 8 without the arm)
    for (x, y) in P.DOCK_INSERTS:
        if plastic:
            add('Nut M3', (x, y, P.BODY_TOP - nt - 0.2 + 0.05), PZ)      # in the hex pocket under the bracket plate
        else:
            add('Insert M3', (x, y, P.BODY_TOP), PZ)
        add('Screw M3x10 socket', (x, y, P.BODY_TOP + P.DOCK_STACK + 3.0 - P.ARM_BASE_CBORE[1]), PZ, group='arm')   # head in the counterbore (3b)
        add('Screw M3x8 socket', (x, y, P.BODY_TOP + P.DOCK_STACK), PZ, group='noarm')
    # shoulder servo: tab screws along -X into the base posts
    sy, sz = P.SHOULDER
    yc = sy + P.SG90_SHAFT_X
    for y in (yc - P.SG90_TAB[4], yc + P.SG90_TAB[4]):
        add('Screw M2x8 pan', (P.SHOULDER_SERVO_X + P.SG90_TAB[3], y, sz), PX, group='arm')
    # shoulder horn on the spline; centre screw from the gear boss's counterbore, 2 screws through the plate
    xo = P.ARM_PLATE_X[0][1]
    add('SG90 horn', (P.SHOULDER_SERVO_X + P.SG90_TOP + 0.05, 0, 0), PX, (0, 1, 0), A, 'arm', 'Arm')
    add('Screw M2x8 pan', (xo + 1.0, 0, 0), PX, parent=A, group='arm', moves='Arm')
    for d in P.HORN_HOLES:
        add('Screw M2x5 pan', (xo, d, 0), PX, parent=A, group='arm', moves='Arm')
    # gripper servo: tab screws down into the deck posts
    yc2 = P.JAW_PIVOT_Y + P.SG90_SHAFT_X
    for y in (yc2 - P.SG90_TAB[4], yc2 + P.SG90_TAB[4]):
        add('Screw M2x8 pan', (-P.JAW_PITCH_R, y, SERVO2_BOTTOM_Z - P.SG90_TAB[2]), PZ, parent=A, group='arm', moves='Arm')
    # gripper horn on the spline (pointing down), its centre screw and 2 screws into the driven jaw
    ux, uy = grip_horn_dir()
    zh = SERVO2_BOTTOM_Z - P.SG90_TOP - 0.05
    zs = zh - P.HORN[1]
    cx, cy = -P.JAW_PITCH_R, P.JAW_PIVOT_Y
    add('SG90 horn', (cx, cy, zh), NZ, (ux, uy, 0), A, 'arm', 'Jaw L')
    add('Screw M2x4 pan', (cx, cy, zs), NZ, parent=A, group='arm', moves='Jaw L')
    for d in P.HORN_HOLES:
        add('Screw M2x4 pan', (cx + ux * d, cy + uy * d, zs), NZ, parent=A, group='arm', moves='Jaw L')
    # idle jaw pivot: M3 x 8 up through the jaw into the deck
    add('Screw M3x8 pan', (P.JAW_PITCH_R, P.JAW_PIVOT_Y, -11.5), NZ, parent=A, group='arm', moves='Arm')
    # wheels: M2 x 6 + washer into the shaft's centre hole
    for (wm, side) in zip(wheel_matrices(), ('Wheel L', 'Wheel R')):
        add('Washer M2', (0, 0, P.HUB_LEN), PZ, parent=wm, moves=side)
        add('Screw M2x6 pan', (0, 0, P.HUB_LEN + 0.5), PZ, parent=wm, moves=side)
    # bus clip: insert + thumb screw in the tab (the screw tip bears on the deck), accessory insert
    ycl = detent_near(P.HALF_REAR, P.CLIP_Y)[1]
    xsc = clip_screw_x(P.HALF_REAR)
    ztab = P.BODY_TOP + P.CLIP_GAP + P.CLIP_TAB[1]
    zmid = (ztab + P.BODY_TOP + P.CLIP_GAP) / 2
    if plastic:
        add('Nut M3', (xsc, ycl, zmid - nt / 2), PZ)                     # in the tab's side slot
    else:
        add('Insert M3', (xsc, ycl, ztab), PZ)
    add('Thumb screw M3x8', (xsc, ycl, P.BODY_TOP + 0.05 + 8.0), PZ)
    xout1 = P.HALF_REAR + P.CLIP_GAP + P.CLIP_T
    if plastic:
        add('Nut M3', (xout1 + 5.0 - nt - 0.2 + 0.05, ycl, (P.CLIP_LEG_Z0 + P.BODY_TOP) / 2), PX)   # in the boss's end pocket
    else:
        add('Insert M3', (xout1 + 5.0, ycl, (P.CLIP_LEG_Z0 + P.BODY_TOP) / 2), PX)
    # ballast clips: insert + thumb screw, 3 x M8 nuts in the pocket
    xc = P.CLIP_GAP + P.CLIP_T - 0.1 + 13.0 / math.sqrt(3) + 1.2
    zp = P.BUS_GROOVE[1] + 1.0 + 0.5 - (3 * 6.5 + 1.0)
    for x in P.BALLAST_CLIP_X:
        cm = L.matrix([(0, -1, 0), (1, 0, 0), (0, 0, 1)], (x, Y0, 0))
        if plastic:
            add('Nut M3', (clip_screw_x(0.0), 0, zmid - nt / 2), PZ, parent=cm, group='ballast')
        else:
            add('Insert M3', (clip_screw_x(0.0), 0, ztab), PZ, parent=cm, group='ballast')
        add('Thumb screw M3x8', (clip_screw_x(0.0), 0, P.BODY_TOP + 0.05 + 8.0), PZ, parent=cm, group='ballast')
        for k in range(3):
            add('Nut M8', (xc, 0, zp + 0.05 + 6.5 * k), PZ, (0, 1, 0), cm, 'ballast')
    return out


def build_hardware():
    """Builds the hardware parts and places every one (arm levelled first so arm-mounted parts line up)."""
    place_arm(0.0, 0.0)
    comps = {}
    for name, spec in SCREWS.items():
        comps[name] = _hw_screw(name, *spec)
    if P.FASTENERS == 'plastic':
        for name in INSERTS:
            L.delete_component(name)
    else:
        for name, spec in INSERTS.items():
            comps[name] = _hw_insert(name, *spec)
    comps['Washer M2'] = _hw_washer()
    comps['Nut M8'] = _hw_nut()
    comps['Nut M3'] = _hw_nut_m3()
    comps['SG90 horn'] = _hw_horn()
    pl = hardware_placements()
    counts = {}
    for name, comp in comps.items():
        mine = [p for p in pl if p[0] == name]
        occs = L.place_instances(comp, [p[1] for p in mine])
        for o, p in zip(occs, mine):
            tag(o, p[2], p[3])
        counts[name] = len(mine)
    # stale hardware from earlier builds: a deleted name stays reserved, so Fusion suffixes the new component's name
    current = {L.base_name(c.name): c.name for c in comps.values()}
    stale = 0
    for o in list(L.design().rootComponent.occurrences):
        b = L.base_name(o.component.name)
        if b in current and o.component.name != current[b]:
            o.deleteMe(); stale += 1
    return ', '.join('%d x %s' % (n, k) for k, n in counts.items()) + ('; %d stale removed' % stale if stale else '')



def hardware_dedupe():
    """Remove hardware left over from an earlier build: same part at the same place, keep the newest component."""
    root = L.design().rootComponent
    seen, dup = {}, 0
    for o in list(root.occurrences):
        b = L.base_name(o.component.name)
        if b not in HW_NAMES:
            continue
        key = (b, tuple(round(v, 2) for v in o.transform.asArray()))
        if key in seen:
            older, newer = (seen[key], o) if seen[key].component.name < o.component.name else (o, seen[key])
            older.deleteMe(); dup += 1
            seen[key] = newer
        else:
            seen[key] = o
    return '%d duplicate hardware parts removed' % dup


# ===================================================================== joints
def find_joint(name):
    root = L.design().rootComponent
    for coll in (root.asBuiltJoints, root.joints):
        for i in range(coll.count):
            if coll.item(i).name == name:
                return coll.item(i)
    return None


def _sign(j):
    a = j.attributes.itemByName('RoboCore', 'sign')
    return float(a.value) if a else 1.0


def pose(theta=None, open_deg=None, battery_out=0.0, sled_down=0.0, wheel_deg=0.0):
    """Drive the joints: arm angle and jaw opening (deg), battery slid out and sled dropped (mm), wheels (deg)."""
    theta = P.ARM_RAISED if theta is None else theta
    open_deg = P.ARM_OPEN if open_deg is None else open_deg
    vals = {'Shoulder': math.radians(theta), 'Jaw L': math.radians(open_deg), 'Wheel L': math.radians(wheel_deg),
            'Wheel R': math.radians(wheel_deg), 'Battery': battery_out / 10.0}
    for name, v in vals.items():
        j = find_joint(name)
        if j is None:
            continue
        m = j.jointMotion
        if m.jointType == adsk.fusion.JointTypes.SliderJointType:
            m.slideValue = _sign(j) * v
        else:
            m.rotationValue = _sign(j) * v
    jr = find_joint('Jaw R')
    if jr is not None and L.design().rootComponent.motionLinks.count == 0:
        jr.jointMotion.rotationValue = _sign(jr) * math.radians(open_deg)
    return 'pose: arm %.1f deg, jaws %.1f deg, battery out %.0f mm, sled down %.0f mm' % (theta, open_deg, battery_out, sled_down)


def _circle_edge(occ, r, centre, tol=0.06):
    """Circular edge (assembly proxy) of radius r centred near `centre` (mm): a full circle if there is one on
    that axis (cuts can turn a hole's end into arcs), else an arc."""
    best = None
    kinds = (adsk.core.Curve3DTypes.Circle3DCurveType, adsk.core.Curve3DTypes.Arc3DCurveType)
    for o in [occ] + list(occ.childOccurrences):
        for b in o.bRepBodies:
            for e in b.edges:
                g = e.geometry
                if g.curveType not in kinds or abs(g.radius * 10 - r) > tol:
                    continue
                p = g.center
                d = math.sqrt((p.x * 10 - centre[0]) ** 2 + (p.y * 10 - centre[1]) ** 2 + (p.z * 10 - centre[2]) ** 2)
                d += 0.0 if g.curveType == kinds[0] else 5.0
                if best is None or d < best[0]:
                    best = (d, e)
    if best is None or best[0] > 9.0:
        raise RuntimeError('no circle r %.2f near %s in %s' % (r, centre, occ.name))
    return best[1]


def _plane_face(occ, normal, prefix=None):
    """Largest planar face (assembly proxy) whose normal is +-normal (axis tuple)."""
    best = None
    for o in [occ] + list(occ.childOccurrences):
        if prefix and not o.name.startswith(prefix):
            continue
        for b in o.bRepBodies:
            for f in b.faces:
                if f.geometry.surfaceType != adsk.core.SurfaceTypes.PlaneSurfaceType:
                    continue
                ok, n = f.evaluator.getNormalAtPoint(f.pointOnFace)
                if abs(n.x * normal[0] + n.y * normal[1] + n.z * normal[2]) < 0.999:
                    continue
                if best is None or f.area > best.area:
                    best = f
    if best is None:
        raise RuntimeError('no planar face in %s' % occ.name)
    return best


def _as_built(o1, o2, geo, kind, name):
    root = L.design().rootComponent
    inp = root.asBuiltJoints.createInput(o1, o2, geo)
    zax = adsk.fusion.JointDirections.ZAxisJointDirection
    if kind == 'revolute':
        inp.setAsRevoluteJointMotion(zax)
    elif kind == 'slider':
        inp.setAsSliderJointMotion(zax)
    else:
        inp.setAsRigidJointMotion()
    j = root.asBuiltJoints.add(inp)
    j.name = name
    return j


def _axes(occ):
    o, x, y, z = occ.transform2.getAsCoordinateSystem()
    return (o.x * 10, o.y * 10, o.z * 10), (x.x, x.y, x.z), (y.x, y.y, y.z)


def _calibrate(j, test, measure, lo, hi):
    """Find which joint direction is 'positive' (measure() grows), store it, and set the limits lo..hi
    (degrees or mm, in that positive sense; None = no limit)."""
    m = j.jointMotion
    slider = m.jointType == adsk.fusion.JointTypes.SliderJointType
    before = measure()
    if slider:
        m.slideValue = test
    else:
        m.rotationValue = test
    sign = 1.0 if measure() > before else -1.0
    if slider:
        m.slideValue = 0.0
    else:
        m.rotationValue = 0.0
    j.attributes.add('RoboCore', 'sign', str(sign))
    k = 0.1 if slider else math.pi / 180.0
    lim = m.slideLimits if slider else m.rotationLimits
    if lo is not None:
        a, b = sorted((sign * lo * k, sign * hi * k))
        lim.isMinimumValueEnabled = True
        lim.minimumValue = a
        lim.isMaximumValueEnabled = True
        lim.maximumValue = b
    return sign


def clear_joints():
    """Pose everything at zero, then remove the motion links, joints and rigid groups and unground every part."""
    root = L.design().rootComponent
    if find_joint('Shoulder') is not None:
        pose(0.0, 0.0)
    for coll in (root.motionLinks, root.asBuiltJoints, root.joints, root.rigidGroups):
        for i in reversed(range(coll.count)):
            coll.item(i).deleteMe()
    for o in root.occurrences:
        o.isGrounded = False


def build_joints():
    """Joints so the model can be moved by hand in Fusion (drag a part, or Joint > Drive):
    shoulder (floor pose .. ARM_MAX), the two jaws linked like their gears, both wheels, the battery sliding out
    of the back and the line-sensor sled dropping out. Everything else is grounded; screws, horns and the gripper
    servo ride with their parts in rigid groups. Built at the build pose (arm level, jaws closed)."""
    clear_joints()
    root = L.design().rootComponent

    def first(key, pred=None):
        for exact in (True, False):
            for o in root.occurrences:
                hit = L.base_name(o.component.name) == key if exact else o.name.startswith(key)
                if hit and (pred is None or pred(o)):
                    return o
        raise RuntimeError('no occurrence ' + key)
    arm, base = first('Arm'), first('Arm base')
    jl, jr = first('Jaw L'), first('Jaw R')
    xpos = lambda o: _axes(o)[0][0] > 0
    wl, wr = first('Wheel', lambda o: not xpos(o)), first('Wheel', xpos)
    tl, tr = first('Tyre', lambda o: not xpos(o)), first('Tyre', xpos)
    def motor(pred):
        for key in ('DG01D-E motor', 'TT DC Gear Motor'):
            try:
                return first(key, pred)
            except RuntimeError:
                pass
        raise RuntimeError('no motor occurrence')
    ml, mr = motor(lambda o: not xpos(o)), motor(xpos)
    chassis, holder = first('Chassis'), first('BatteryHolder3S')
    groups = {'Arm': [arm], 'Jaw L': [jl], 'Wheel L': [wl, tl], 'Wheel R': [wr, tr]}
    for o in root.occurrences:
        mv = tag_of(o, 'moves')
        if mv in groups and o not in groups[mv]:
            groups[mv].append(o)
    moving = set(o.name for g in groups.values() for o in g) | {jr.name, holder.name}
    for o in root.occurrences:
        o.isGrounded = o.name not in moving
    for name, members in groups.items():
        if len(members) > 1:
            col = adsk.core.ObjectCollection.create()
            for o in members:
                col.add(o)
            g = root.rigidGroups.add(col, False)
            g.name = name + ' parts'
    sy, sz = P.SHOULDER
    out = []
    # shoulder: about the left plate's D-pin bearing hole
    e = _circle_edge(arm, 2.7, (P.ARM_PLATE_X[1][0], sy, sz))
    j = _as_built(arm, base, adsk.fusion.JointGeometry.createByCurve(e, adsk.fusion.JointKeyPointTypes.CenterKeyPoint), 'revolute', 'Shoulder')
    _calibrate(j, 0.2, lambda: _axes(arm)[2][2], arm_angle_floor(), P.ARM_MAX)
    # jaws: driven jaw about its horn hub, idle jaw about its M3 pivot; opening is +z on the left jaw, -z on the right
    jz = sz - 11.5
    e = _circle_edge(jl, (P.HORN[0] + 0.4) / 2, (-P.JAW_PITCH_R, sy + P.JAW_PIVOT_Y, jz))
    jL = _as_built(jl, arm, adsk.fusion.JointGeometry.createByCurve(e, adsk.fusion.JointKeyPointTypes.CenterKeyPoint), 'revolute', 'Jaw L')
    _calibrate(jL, 0.2, lambda: _axes(jl)[1][1], *P.JAW_LIMITS)
    e = _circle_edge(jr, 1.65, (P.JAW_PITCH_R, sy + P.JAW_PIVOT_Y, jz))
    jR = _as_built(jr, arm, adsk.fusion.JointGeometry.createByCurve(e, adsk.fusion.JointKeyPointTypes.CenterKeyPoint), 'revolute', 'Jaw R')
    _calibrate(jR, 0.2, lambda: -_axes(jr)[1][1], *P.JAW_LIMITS)
    try:
        mi = root.motionLinks.createInput(jL, jR)
        mi.valueOne = adsk.core.ValueInput.createByString('10 deg')
        mi.valueTwo = adsk.core.ValueInput.createByString('10 deg')
        link = root.motionLinks.add(mi)
        link.name = 'Gripper gears'
        jL.jointMotion.rotationValue = _sign(jL) * 0.2
        if -_axes(jr)[1][1] < 0.05:
            link.isReversed = not link.isReversed
        jL.jointMotion.rotationValue = 0.0
        out.append('jaws linked')
    except Exception as ex:
        out.append('motion link failed (%s): jaws move separately' % ex)
    # wheels on their motors
    for (w, mo, nm, sgn) in ((wl, ml, 'Wheel L', -1), (wr, mr, 'Wheel R', 1)):
        e = _circle_edge(w, P.HUB_D / 2, (sgn * (P.HUB_FACE_X + P.HUB_LEN), 0, P.AXLE_Z))
        jw = _as_built(w, mo, adsk.fusion.JointGeometry.createByCurve(e, adsk.fusion.JointKeyPointTypes.CenterKeyPoint), 'revolute', nm)
        _calibrate(jw, 0.2, lambda w=w: _axes(w)[1][2] * sgn, None, None)
    # battery out of the back (the line sensor is screwed to the chassis and stays grounded)
    f = _plane_face(holder, (0, 1, 0), 'BatteryCasePlastic')
    jb = _as_built(holder, chassis, adsk.fusion.JointGeometry.createByPlanarFace(f, None, adsk.fusion.JointKeyPointTypes.CenterKeyPoint), 'slider', 'Battery')
    _calibrate(jb, 0.5, lambda: -_axes(holder)[0][1], 0.0, 110.0)
    out.append('%d joints, %d rigid groups, %d grounded' % (root.asBuiltJoints.count, root.rigidGroups.count,
                                                            sum(1 for o in root.occurrences if o.isGrounded)))
    return '; '.join(out)


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
    # the PCB's underside is 0.01 below the file origin: lift it clear of the deck
    return _insert(BOARD_FILE_ID, L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (0, 0, P.BOARD_Z + 0.02)), 'RoboCore_V2')


def place_line_sensor():
    # STEP origin = board centre, underside at z 0; it hangs from the two bosses on 2 x M3
    x, y = P.LINE_C
    y = y + 0.1
    return _insert(LINE_FILE_ID, L.matrix([(1, 0, 0), (0, 1, 0), (0, 0, 1)], (x, y, P.LINE_UNDER_Z)), 'RoboCore_LineSensor')


def place_ultrasonic():
    """HC-SR04 (Fred's model, 2026-10-08): model y -> robot -z (the board is turned over so its header points UP),
    model z (the cans) -> robot +y. The cans' base (model z 1.5) lands on the faceplate's back."""
    for prefix in ('RoboCore_Ultrasonic', 'HCSR04'):
        for o in list(L.design().rootComponent.occurrences):
            if o.name.startswith(prefix):
                o.deleteMe()
    m = L.matrix([(1, 0, 0), (0, 0, -1), (0, 1, 0)], (0, P.US_UNDER_Y - 1.5, P.US_CZ))
    return _insert(P.US_FILE_ID, m, 'HCSR04')


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
        if cn.startswith('SG90 (reference)'):
            L.paint(o, L.appearance('Servo blue', (40, 80, 200)))   # (the linked servo models keep their own colours)
        if cn in HW_NAMES:
            key = SCREWS[cn][0] if cn in SCREWS else next(k for k in HW_COLOURS if cn.startswith(k))
            metal = 'Steel - Satin' if key in ('pan', 'Washer', 'Nut') else 'Plastic - Matte'
            hint = metal if key != 'Insert' else 'Brass'
            L.paint(o, L.appearance('HW %s' % key, HW_COLOURS[key], hint) or L.appearance('HW %s' % key, HW_COLOURS[key], 'Steel - Satin'))
    return name


def clear_rev4():
    """Remove the rev 4 battery parts (door, 1S3P pack, spacer) before the rev 5 build."""
    gone = []
    for n in ('Battery door', '1S2P spacer', '1S3P pack (reference)', 'Caster', 'Dock cap'):
        before = L.design().rootComponent.occurrences.count
        L.delete_component(n)
        if L.design().rootComponent.occurrences.count != before:
            gone.append(n)
    return ', '.join(gone)


STEPS = {
    'clear_rev4': clear_rev4,
    'cover': build_cover,
    'battery': place_battery,
    'ballast_clip': build_ballast_clip,
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
    'chassis_style': chassis_style,
    'chassis_tread': chassis_tread,
    'chassis_hand_edits': chassis_hand_edits,
    'caster': build_caster,
    'wheel': build_wheel,
    'tyre': build_tyre,
    'wheels': place_wheels,
    'servos': place_servos,
    'arm_base': build_arm_base,
    'arm': build_arm,
    'jaw_l': lambda: build_jaw(-1),
    'jaw_r': lambda: build_jaw(1),
    'arm_pose': place_arm,
    'sonar': build_sonar_bracket,
    'clip': build_clip,
    'coupon': build_coupon,
    'fastener_coupon': build_fastener_coupon,
    'hardware': build_hardware,
    'joints': build_joints,
    'hw_dedupe': hardware_dedupe,
    'pose': pose,
    'teal': lambda: apply_scheme('teal'),
    'orange': lambda: apply_scheme('orange'),
    'construction': lambda: apply_scheme('construction'),
}
ALL = ['motor_import', 'motors', 'board', 'line', 'ultrasonic', 'battery', 'chassis_shell', 'chassis_cradle', 'chassis_front',
       'chassis_holes', 'chassis_bus', 'chassis_detents', 'chassis_finish', 'chassis_style', 'chassis_tread', 'chassis_hand_edits', 'caster', 'wheel', 'tyre', 'wheels',
       'servos', 'sonar', 'arm_base', 'arm', 'jaw_l', 'jaw_r', 'arm_pose', 'clip', 'ballast_clip', 'coupon', 'fastener_coupon', 'hardware', 'joints', 'hw_dedupe',
       'pose', 'teal']


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
