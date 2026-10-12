"""Design checks for the RoboCore V2 robot (rev 3).

interference()   part-to-part clashes (vendor models' internal overlaps ignored)
antenna()        distance from metal (motors, pack, sensor boards, inserts, screws) to the ESP32 antenna end
masses()         printed-part masses (shell + infill model) and print time hints
balance()        centre of gravity, caster load, tipping
line_sensor()    sensor height and skid order
bed_fit()        print-orientation size of every printed part vs the A1 mini (180 mm cube)
overhangs()      down-facing surfaces steeper than 45 degrees in the print orientation
"""
import math
import adsk.core
import adsk.fusion
import rc_lib as L
import rc_params as P

PETG, TPU = 1.27, 1.21
# name: (density, infill, print transform)  transform = rotation applied to component coords
PRINT = {
    'Chassis': (PETG, 0.25, 'id'),
    'Line sled': (PETG, 0.30, 'flip'),
    'Battery door': (PETG, 0.30, 'flip'),
    '1S2P spacer': (PETG, 0.25, 'id'),
    'Wheel': (PETG, 0.30, 'id'),
    'Tyre': (TPU, 0.15, 'id'),
    'Arm base': (PETG, 0.30, 'id'),
    'Arm': (PETG, 0.30, 'id'),
    'Jaw L': (PETG, 0.40, 'id'),
    'Jaw R': (PETG, 0.40, 'id'),
    'Dock cap': (PETG, 0.25, 'id'),
    'Bus clip': (PETG, 0.40, 'side'),
    'Rail coupon': (PETG, 0.25, 'id'),
}
ARM_PARTS = ('Arm base', 'Arm', 'Jaw L', 'Jaw R', 'SG90')
ACCESSORIES = ('Bus clip', 'Rail coupon')
SHELL_CM = 0.11          # ~3 perimeters / 4 top-bottom layers, as an average skin
OTHER_MASS = {           # bought parts (g)
    'TT DC Gear Motor': 33.0, 'RoboCore_V2': 25.0, 'RoboCore_Ultrasonic': 9.0, 'RoboCore_LineSensor': 8.0,
    '1S3P pack': 154.0, 'Caster ball': 2.7, 'SG90': 9.0,     # 12.7 mm glass ball; steel 8.4 g
}
HARDWARE = (10.0, (0.0, -15.0, 30.0))   # screws + inserts (g, rough centroid; rev 3 has no motor or pod screws)
CABLES = (10.0, (0.0, -15.0, 40.0))


def _rot(kind, v):
    x, y, z = v
    if kind == 'pod_r':      # +X down
        return (z, y, -x)
    if kind == 'pod_l':      # -X down
        return (-z, y, x)
    if kind == 'bezel':      # +Y (face) down
        return (x, z, -y)
    if kind == 'flip':       # top down
        return (x, -y, -z)
    if kind == 'side':       # -Y face down (part printed on its side)
        return (x, -z, y)
    return v


def _top(e):
    o = e.assemblyContext
    while o is not None and o.assemblyContext is not None:
        o = o.assemblyContext
    return o.name if o else '?'


def _comp(name):
    for c in L.design().allComponents:
        if L.base_name(c.name) == name:
            return c
    return None


# ------------------------------------------------------------------ interference
def _occ_box(o):
    mn = [1e9] * 3
    mx = [-1e9] * 3
    bodies = list(o.bRepBodies)
    for so in o.childOccurrences:
        bodies += list(so.bRepBodies)
        for s2 in so.childOccurrences:
            bodies += list(s2.bRepBodies)
    for b in bodies:
        bb = b.boundingBox
        for k, (lo, hi) in enumerate(((bb.minPoint.x, bb.maxPoint.x), (bb.minPoint.y, bb.maxPoint.y), (bb.minPoint.z, bb.maxPoint.z))):
            mn[k] = min(mn[k], lo * 10)
            mx[k] = max(mx[k], hi * 10)
    return mn, mx


def _owner_map(occs):
    """entityToken of every native body -> name of the top-level occurrence that holds it."""
    m = {}
    for o in occs:
        comps = [o.component] + [so.component for so in o.component.allOccurrences]
        for comp in comps:
            for b in comp.bRepBodies:
                m.setdefault(b.entityToken, o.name)
    return m


def _owner(e, m):
    try:
        n = e.nativeObject or e
    except Exception:
        n = e
    return m.get(n.entityToken, '?')


def interference(skip_prefixes=('1S2P', 'Rail coupon', 'Dock cap'), subjects=None, log=None):
    """Each part against the parts whose boxes overlap it (one big analysis is slow and hard to read).
    Parts that are instances of the same component (left/right wheel) share one owner name."""
    des = L.design()
    occs = [o for o in des.rootComponent.occurrences if o.isLightBulbOn and not any(o.name.startswith(p) for p in skip_prefixes)]
    owners = _owner_map(occs)
    boxes = {o.name: _occ_box(o) for o in occs}
    found = {}
    done = set()
    for a in occs:
        if subjects and not any(a.name.startswith(s) for s in subjects):
            continue
        amn, amx = boxes[a.name]
        coll = adsk.core.ObjectCollection.create()
        coll.add(a)
        n = 0
        for b in occs:
            if b.name == a.name or (b.name, a.name) in done:
                continue
            bmn, bmx = boxes[b.name]
            if all(amn[k] - 0.5 <= bmx[k] and bmn[k] - 0.5 <= amx[k] for k in range(3)):
                coll.add(b)
                done.add((a.name, b.name))
                n += 1
        if n == 0:
            continue
        if log:
            with open(log, 'a') as f:
                f.write('checking %s against %d parts\n' % (a.name, n))
        res = des.analyzeInterference(des.createInterferenceInput(coll))
        for i in range(res.count):
            r = res.item(i)
            ta, tb = _owner(r.entityOne, owners), _owner(r.entityTwo, owners)
            if ta == tb:
                continue
            body = r.interferenceBody
            bb = body.boundingBox
            key = tuple(sorted((ta + '/' + r.entityOne.name, tb + '/' + r.entityTwo.name)))
            found[key] = '%s  X  %s  %.2f mm3 at (%.1f,%.1f,%.1f)-(%.1f,%.1f,%.1f)' % (
                key[0], key[1], body.volume * 1000, bb.minPoint.x * 10, bb.minPoint.y * 10, bb.minPoint.z * 10,
                bb.maxPoint.x * 10, bb.maxPoint.y * 10, bb.maxPoint.z * 10)
            if log:
                with open(log, 'a') as f:
                    f.write('  ' + found[key] + '\n')
    return 'interference pairs between parts: %d\n' % len(found) + '\n'.join(found.values())


# ------------------------------------------------------------------ antenna
def _box_dist(a, b):
    """Distance between two axis-aligned boxes (x0,x1,y0,y1,z0,z1)."""
    d = 0.0
    for k in range(3):
        lo1, hi1 = a[2 * k], a[2 * k + 1]
        lo2, hi2 = b[2 * k], b[2 * k + 1]
        g = max(lo2 - hi1, lo1 - hi2, 0.0)
        d += g * g
    return math.sqrt(d)


def antenna(limit=15.0):
    """Closest metal to the antenna end. Bodies are compared exactly when their boxes are near."""
    des = L.design()
    ant = P.ANTENNA
    mm = L.app.measureManager
    pts = []
    for x in (ant[0], 0.0, ant[1]):
        for y in (ant[2], (ant[2] + ant[3]) / 2, ant[3]):
            for z in (ant[4], ant[5]):
                pts.append(L.P3(x, y, z))
    metal_tops = ('TT DC Gear Motor', '1S3P pack', 'RoboCore_Ultrasonic', 'RoboCore_LineSensor', 'SG90')
    best = {}
    for occ in des.rootComponent.allOccurrences:
        top = occ
        while top.assemblyContext is not None:
            top = top.assemblyContext
        tn = top.name
        if not tn.startswith(metal_tops):
            continue
        for b in occ.bRepBodies:
            bb = b.boundingBox
            box = (bb.minPoint.x * 10, bb.maxPoint.x * 10, bb.minPoint.y * 10, bb.maxPoint.y * 10, bb.minPoint.z * 10, bb.maxPoint.z * 10)
            dbox = _box_dist(box, ant)
            key = tn.split(':')[0]
            if key in best and dbox >= best[key][0]:
                continue
            if dbox > limit + 10:
                best.setdefault(key, (dbox, b.name + ' (box)'))
                continue
            dmin = min(mm.measureMinimumDistance(p, b).value * 10 for p in pts)
            dmin = max(dmin, dbox)
            if key not in best or dmin < best[key][0]:
                best[key] = (dmin, b.name)
    # hardware (metal) at known positions
    hw = []
    for (x, y) in P.BOARD_HOLES:
        hw.append(('M2 insert + screw at (%.1f,%.1f)' % (x, y), (x - 2, x + 2, y - 2, y + 2, P.BOARD_Z - 5, P.BOARD_Z + P.BOARD_T + 1.5)))
    for (x, y) in P.DOCK_INSERTS:
        hw.append(('dock insert + M3 (%.1f,%.1f)' % (x, y), (x - 3, x + 3, y - 3, y + 3, P.BODY_TOP - P.INSERT_M3_DEPTH, P.BODY_TOP + 5)))
    hw.append(('door thumb-screw insert', (-5, 5, P.DOOR_SCREW_Y - 5, P.DOOR_SCREW_Y + 5, 7, P.DOOR_TOP + 4.5)))

    for (name, box) in hw:
        best[name] = (_box_dist(box, ant), 'box')
    lines = ['antenna end: x %.1f..%.1f, y %.1f..%.1f, z %.1f..%.1f' % ant]
    worst = min(v[0] for v in best.values())
    for k, (d, what) in sorted(best.items(), key=lambda kv: kv[1][0]):
        lines.append('  %-36s %5.1f mm %s' % (k, d, 'OK' if d >= limit else '<-- under %d mm' % limit))
    lines.insert(1, 'closest metal: %.1f mm (%s)' % (worst, 'OK' if worst >= limit else 'FAIL'))
    return '\n'.join(lines)


# ------------------------------------------------------------------ masses
def part_mass(c, dens, infill, shell=SHELL_CM):
    m = 0.0
    for b in c.bRepBodies:
        if b.name.endswith('inlay'):
            continue
        v = b.volume                 # cm3
        a = b.area                   # cm2
        sh = min(v, a * shell / 2.0)  # each skin counted from both faces of thin walls
        m += dens * (sh + infill * (v - sh))
    return m


def masses():
    out = []
    tot = 0.0
    for name, (dens, infill, _) in PRINT.items():
        c = _comp(name)
        if c is None:
            continue
        n = 2 if name in ('Wheel', 'Tyre') else 1
        m = part_mass(c, dens, infill)
        vol = sum(b.volume for b in c.bRepBodies)
        out.append('%-14s %5.1f g%s  (solid volume %.1f cm3, %s, %d %% infill)' % (
            name, m * n, ' (x2)' if n == 2 else '', vol * n, 'TPU' if dens == TPU else 'PETG', infill * 100))
        tot += m * n
    out.append('printed total  %5.1f g' % tot)
    return '\n'.join(out), tot


# ------------------------------------------------------------------ balance
def balance(pack='1S3P', ball='glass', arm=True, nuts=None):
    nuts = arm if nuts is None else nuts
    des = L.design()
    items = []
    for o in des.rootComponent.occurrences:
        cn = L.base_name(o.component.name)
        if cn.startswith(ACCESSORIES):
            continue
        if cn.startswith(ARM_PARTS) and not arm:
            continue
        if cn == 'Dock cap':
            if arm:
                continue
        elif not o.isLightBulbOn and cn != '1S2P spacer':
            continue
        cg = o.physicalProperties.centerOfMass
        c3 = (cg.x * 10, cg.y * 10, cg.z * 10)
        if cn in PRINT:
            dens, infill, _ = PRINT[cn]
            if cn == '1S2P spacer' and pack == '1S3P':
                continue
            items.append((cn, part_mass(o.component, dens, infill), c3))
            continue
        for k, m in OTHER_MASS.items():
            if o.name.startswith(k) or cn.startswith(k):
                if k == '1S3P pack' and pack == '1S2P':
                    m = 106.0
                if k == 'Caster ball' and ball == 'steel':
                    m = 8.4
                items.append((o.name, m, c3))
    if nuts:
        items.append(('4 x M8 ballast nuts', 4 * 5.2, (0.0, (P.BALLAST_Y[0] + P.BALLAST_Y[1]) / 2, P.BALLAST_Z0 + 7.5)))
    items.append(('screws + inserts', HARDWARE[0], HARDWARE[1]))
    items.append(('cables', CABLES[0], CABLES[1]))
    M = sum(m for (_, m, _) in items)
    cx = sum(m * c[0] for (_, m, c) in items) / M
    cy = sum(m * c[1] for (_, m, c) in items) / M
    cz = sum(m * c[2] for (_, m, c) in items) / M
    caster = -cy / -P.CASTER_Y if P.CASTER_Y < 0 else 0
    lines = ['pack %s, %s ball, %s%s: total %.0f g, CG (%.1f, %.1f, %.1f) mm' % (pack, ball, 'arm fitted' if arm else 'dock cap',
                                                                              ' + 4 M8 nuts' if nuts else '', M, cx, cy, cz),
             '  caster carries %.0f %% (target 20-35 %%), wheels %.0f %%' % (caster * 100, (1 - caster) * 100),
             '  tips forward only above %.2f g of braking (CG %.1f mm behind the axle, %.1f mm up)' % (-cy / cz, -cy, cz),
             '  sideways tip on a turn needs %.2f g (half track %.1f / CG height)' % ((P.HUB_FACE_X + P.RIM_Z0 + P.FLANGE_T + P.TYRE_W / 2) / cz, P.HUB_FACE_X + P.RIM_Z0 + P.FLANGE_T + P.TYRE_W / 2)]
    return '\n'.join(lines), (M, cx, cy, cz, caster)


# ------------------------------------------------------------------ line sensor
def line_sensor():
    des = L.design()
    lo = None
    for o in des.rootComponent.allOccurrences:
        top = o
        while top.assemblyContext is not None:
            top = top.assemblyContext
        if not top.name.startswith('RoboCore_LineSensor'):
            continue
        for b in o.bRepBodies:
            z = b.boundingBox.minPoint.z * 10
            lo = z if lo is None else min(lo, z)
    under = P.LINE_UNDER_Z
    skid = under - P.SLED_SKID_DZ
    ly = P.LINE_C[1] + 11.2          # front edge of the TCRT5000 bodies
    sy = P.BODY_Y1 - 2.5             # skid's lowest point behind its 2.5 mm front chamfer
    ok = 9.0 <= under <= 13.0
    first = 'skid' if skid / sy < lo / ly else 'SENSOR'
    return ('line sensor board underside %.1f mm (allowed 9-13: %s), TCRT5000 faces %.1f mm off the floor (best 2-6),\n'
            '  skid line %.1f mm; on a nose-dive the %s touches first (pitch angles %.1f vs %.1f deg)' % (
                under, 'OK' if ok else 'FAIL', lo, skid, first,
                math.degrees(math.atan2(skid, sy)), math.degrees(math.atan2(lo, ly))))


# ------------------------------------------------------------------ bed fit, overhangs
def _print_box(c, kind):
    mn = [1e9] * 3
    mx = [-1e9] * 3
    for b in c.bRepBodies:
        bb = b.boundingBox
        for x in (bb.minPoint.x, bb.maxPoint.x):
            for y in (bb.minPoint.y, bb.maxPoint.y):
                for z in (bb.minPoint.z, bb.maxPoint.z):
                    p = _rot(kind, (x * 10, y * 10, z * 10))
                    for k in range(3):
                        mn[k] = min(mn[k], p[k])
                        mx[k] = max(mx[k], p[k])
    return mn, mx


def bed_fit(bed=(180.0, 180.0, 180.0)):
    out = []
    for name, (_, _, kind) in PRINT.items():
        c = _comp(name)
        if c is None:
            continue
        mn, mx = _print_box(c, kind)
        size = [mx[k] - mn[k] for k in range(3)]
        ok = all(size[k] <= bed[k] for k in range(3))
        out.append('%-14s %6.1f x %6.1f x %5.1f mm  %s' % (name, size[0], size[1], size[2], 'fits A1 mini' if ok else 'TOO BIG'))
    return '\n'.join(out)


def overhangs(min_area=8.0, max_bridge=30.0):
    """Down-facing faces > 45 deg from vertical, above the bed, in print orientation.
    Small horizontal holes (r <= 5 mm) and short bridges are listed as OK."""
    out = []
    for name, (_, _, kind) in PRINT.items():
        c = _comp(name)
        if c is None:
            continue
        mn, _ = _print_box(c, kind)
        bed = mn[2]
        bad = []
        ok_small = 0
        for b in c.bRepBodies:
            if b.name.endswith('inlay'):
                continue
            for f in b.faces:
                a = f.area * 100
                if a < 0.5:
                    continue
                ev = f.evaluator
                prange = ev.parametricRange()
                worst = 1.0
                for (u, v) in ((0.5, 0.5), (0.25, 0.25), (0.75, 0.75), (0.25, 0.75), (0.75, 0.25)):
                    pu = prange.minPoint.x + (prange.maxPoint.x - prange.minPoint.x) * u
                    pv = prange.minPoint.y + (prange.maxPoint.y - prange.minPoint.y) * v
                    okn, n = ev.getNormalAtParameter(adsk.core.Point2D.create(pu, pv))
                    if okn:
                        worst = min(worst, _rot(kind, (n.x, n.y, n.z))[2])
                if worst > -0.71:
                    continue
                fb = f.boundingBox
                zs = [_rot(kind, (x * 10, y * 10, z * 10))[2] for x in (fb.minPoint.x, fb.maxPoint.x)
                      for y in (fb.minPoint.y, fb.maxPoint.y) for z in (fb.minPoint.z, fb.maxPoint.z)]
                if min(zs) < bed + 0.05:
                    continue           # on the bed
                g = f.geometry
                if g.surfaceType == adsk.core.SurfaceTypes.CylinderSurfaceType and g.radius * 10 <= 5.0:
                    ok_small += 1
                    continue
                corners = [_rot(kind, (x * 10, y * 10, z * 10)) for x in (fb.minPoint.x, fb.maxPoint.x)
                           for y in (fb.minPoint.y, fb.maxPoint.y) for z in (fb.minPoint.z, fb.maxPoint.z)]
                span = min(max(p[0] for p in corners) - min(p[0] for p in corners),
                           max(p[1] for p in corners) - min(p[1] for p in corners))
                if worst < -0.99 and span <= max_bridge:
                    ok_small += 1      # flat ceiling that the slicer can bridge
                    continue
                if a < min_area or a / max(1e-6, max(max(p[0] for p in corners) - min(p[0] for p in corners),
                                                       max(p[1] for p in corners) - min(p[1] for p in corners))) < 0.3:
                    ok_small += 1      # tiny, or a sliver under 0.3 mm wide (left by a 45-degree chamfer)
                    continue
                bad.append('%s %.0f mm2 span %.1f mm at z %.1f (%s)' % (g.surfaceType == 0 and 'plane' or 'curved', a, span, min(zs) - bed, f.tempId))
        out.append('%-14s %s%s' % (name, 'no unsupported overhangs' if not bad else '%d to look at' % len(bad),
                                   ' (%d small holes / short bridges OK)' % ok_small))
        out.extend('     ' + s for s in bad[:8])
    return '\n'.join(out)


def all_checks():
    rep = []
    rep.append('== bed fit')
    rep.append(bed_fit())
    rep.append('== masses')
    rep.append(masses()[0])
    rep.append('== balance')
    rep.append(balance('1S3P', 'glass', False)[0])
    rep.append(balance('1S3P', 'steel', False)[0])
    rep.append(balance('1S2P', 'glass', False)[0])
    rep.append(balance('1S3P', 'glass', True)[0])
    rep.append(balance('1S3P', 'steel', True)[0])
    rep.append(balance('1S3P', 'glass', True, False)[0])
    rep.append(balance('1S2P', 'glass', True)[0])
    rep.append('== line sensor')
    rep.append(line_sensor())
    return '\n'.join(rep)
