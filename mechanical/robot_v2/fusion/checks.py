"""Design checks for the RoboCore V2 robot (rev 5: the chassis prints top down).

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
    'Chassis': (PETG, 0.25, 'flip'),      # prints top (deck) down
    'Wheel': (PETG, 0.30, 'id'),
    'Tyre': (TPU, 0.15, 'id'),
    'Arm base': (PETG, 0.30, 'id'),
    'Arm': (PETG, 0.30, 'id'),
    'Jaw L': (PETG, 0.40, 'id'),
    'Jaw R': (PETG, 0.40, 'id'),
    'Sonar bracket': (PETG, 0.30, 'flip'),
    'Bus clip': (PETG, 0.40, 'side'),
    'Ballast clip': (PETG, 0.40, 'side'),
    'Rail coupon': (PETG, 0.25, 'flip'),
    'Fastener coupon': (PETG, 0.25, 'id'),
}
ARM_PARTS = ('Arm base', 'Arm', 'Jaw L', 'Jaw R', 'SG90', 'Assembly Micro Servo', 'Servo v', 'Ballast clip')
HW_DENSITY = (('Insert', 8.5), ('SG90 horn', 1.42), ('Screw', 7.85), ('Thumb screw', 7.85), ('Washer', 7.85), ('Nut', 7.85))
ALLOWED = (('Wheel', 'Tyre'), ('TT DC Gear Motor', 'Encoder cover'), ('Screw M2x6 pan', 'DG01D-E motor'),   # stretch fit; reference cover over the motor model
           # screws that thread into something modelled solid or self-tap into a smaller pilot:
           ('Screw M2x8 pan', 'SG90'), ('Screw M2x4 pan', 'SG90'), ('Screw M2x5 pan', 'SG90'),   # horn screws, spline/horn
           ('Screw M2x8 pan', 'Assembly Micro Servo'), ('Screw M2x8 pan', 'Servo v'), ('Screw M2x4 pan', 'Servo v'),
           ('SG90 horn', 'Assembly Micro Servo'), ('SG90 horn', 'Servo v'),   # the horn's bore on the modelled spline
           ('Screw M2x4 pan', 'Jaw L'), ('Screw M2x6 pan', 'TT DC Gear Motor'), ('Screw M3x8 pan', 'Arm'),
           # screws for plastic (thread-forming into pilots) and screws through captive nuts
           ('Screw M2x6 pan', 'Chassis'), ('Screw M3x8 pan', 'Chassis'), ('Screw M3x10 socket', 'Nut M3'), ('Screw M3x8 socket', 'Nut M3'), ('Thumb screw M3x8', 'Nut M3'))
ACCESSORIES = ('Bus clip', 'Rail coupon', 'Fastener coupon')
SHELL_CM = 0.11          # ~3 perimeters / 4 top-bottom layers, as an average skin
OTHER_MASS = {           # bought parts (g)
    'TT DC Gear Motor': 33.0, 'DG01D-E motor': 33.0, 'RoboCore_V2': 25.0, 'RoboCore_Ultrasonic': 9.0, 'HCSR04': 9.0, 'RoboCore_LineSensor': 8.0,
    'BatteryHolder3S': 157.0, 'Caster ball': 2.7, 'SG90': 9.0, 'Assembly Micro Servo': 13.4, 'Servo v': 9.0,   # MG90S 13.4 g, SG90 9 g
}
# screws, inserts, nuts and horns are modelled parts now (HW_DENSITY); only the cables are a lump
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


class _Results:
    def __init__(self, items):
        self.items = items
        self.count = len(items)

    def item(self, i):
        return self.items[i]


def _pairwise(des, a, others, log=None):
    """Interference of occurrence a against each of the others separately (what Fusion can analyse for linked
    assemblies); pairs it still refuses are logged and skipped."""
    items = []
    for b in others:
        coll = adsk.core.ObjectCollection.create()
        coll.add(a)
        coll.add(b)
        try:
            r = des.analyzeInterference(des.createInterferenceInput(coll))
        except Exception:
            r = None
        if r is None:
            if log:
                with open(log, 'a') as f:
                    f.write('  (no analysis possible: %s x %s)\n' % (a.name, b.name))
            continue
        items.extend(r.item(i) for i in range(r.count))
    return _Results(items)


def interference(skip_prefixes=('Rail coupon', 'Fastener coupon'), subjects=None, log=None):
    """Each part against the parts whose boxes overlap it (one big analysis is slow and hard to read).
    Parts that are instances of the same component (left/right wheel) share one owner name."""
    des = L.design()
    def _grp(o):
        a = o.attributes.itemByName('RoboCore', 'group')
        return a.value if a else ''
    # the 'noarm' hardware set (sonar bracket screws without the arm) shares holes with the arm set: not a clash
    occs = [o for o in des.rootComponent.occurrences if o.isLightBulbOn and not any(o.name.startswith(p) for p in skip_prefixes) and _grp(o) != 'noarm']
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
        if res is None:
            # Fusion returns None for some linked assemblies (the servo models): fall back to pairwise checks
            res = _pairwise(des, a, [coll.item(i) for i in range(1, coll.count)], log)
            if res is None:
                continue
        for i in range(res.count):
            r = res.item(i)
            ta, tb = _owner(r.entityOne, owners), _owner(r.entityTwo, owners)
            if ta == tb:
                continue
            if any((ta.startswith(p1) and tb.startswith(p2)) or (ta.startswith(p2) and tb.startswith(p1)) for (p1, p2) in ALLOWED):
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
    metal_tops = ('TT DC Gear Motor', 'DG01D-E motor', 'BatteryHolder3S', 'RoboCore_Ultrasonic', 'HCSR04', 'RoboCore_LineSensor', 'SG90 (reference)',
                  'Assembly Micro Servo', 'Servo v',
                  'Screw', 'Thumb screw', 'Insert', 'Washer', 'Nut')
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
def balance(ball='glass', arm=True, nuts=None):
    nuts = arm if nuts is None else nuts
    des = L.design()
    items = []
    for o in des.rootComponent.occurrences:
        cn = L.base_name(o.component.name)
        ga = o.attributes.itemByName('RoboCore', 'group')
        grp = ga.value if ga else ''
        if cn.startswith(ACCESSORIES) or grp == 'noarm' and arm:
            continue
        if (cn.startswith(ARM_PARTS) or grp in ('arm', 'ballast')) and not arm and grp != 'noarm':
            continue
        if cn == 'Nut M8' and not nuts:
            continue
        if grp == 'noarm':
            pass
        elif not o.isLightBulbOn:
            continue
        cg = o.physicalProperties.centerOfMass
        c3 = (cg.x * 10, cg.y * 10, cg.z * 10)
        dens = next((d for (k, d) in HW_DENSITY if cn.startswith(k)), None)
        if dens is not None:
            items.append((o.name, dens * sum(b.volume for b in o.component.bRepBodies), c3))
            continue
        if cn in PRINT:
            dens, infill, _ = PRINT[cn]
            items.append((cn, part_mass(o.component, dens, infill), c3))
            continue
        for key, m in OTHER_MASS.items():
            if o.name.startswith(key) or cn.startswith(key):
                if key == 'Caster ball' and ball == 'steel':
                    m = 8.4
                items.append((o.name, m, c3))
    items.append(('cables', CABLES[0], CABLES[1]))
    M = sum(m for (_, m, _) in items)
    cx = sum(m * c[0] for (_, m, c) in items) / M
    cy = sum(m * c[1] for (_, m, c) in items) / M
    cz = sum(m * c[2] for (_, m, c) in items) / M
    caster = -cy / -P.CASTER_Y if P.CASTER_Y < 0 else 0
    half_track = P.HUB_FACE_X + P.RIM_Z0 + P.FLANGE_T + P.TYRE_W / 2
    lines = ['%s ball, %s%s: total %.0f g, CG (%.1f, %.1f, %.1f) mm' % (ball, 'arm fitted' if arm else 'no arm',
                                                                      ' + 6 M8 nuts in the ballast clips' if (nuts and arm) else '', M, cx, cy, cz),
             '  the two casters carry %.0f %% (target 8-35 %%), wheels %.0f %%' % (caster * 100, (1 - caster) * 100),
             '  tips forward only above %.2f g of braking (CG %.1f mm behind the axle, %.1f mm up)' % (-cy / cz, -cy, cz),
             '  sideways tip on a turn needs %.2f g (half track %.1f / CG height)' % (half_track / cz, half_track)]
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
    rep.append(balance('glass', False)[0])
    rep.append(balance('steel', False)[0])
    rep.append(balance('glass', True)[0])
    rep.append(balance('steel', True)[0])
    rep.append(balance('glass', True, False)[0])
    rep.append('== line sensor')
    rep.append(line_sensor())
    return '\n'.join(rep)
