"""Small helper layer over the Fusion 360 API for the RoboCore V2 robot build.

All public helpers take millimetres; Fusion's internal unit is the centimetre.
Robot frame: X to the right, Y forward, Z up, origin on the floor under the
middle of the wheel axle.
"""
import math
import adsk.core
import adsk.fusion

app = adsk.core.Application.get()

NEW = adsk.fusion.FeatureOperations.NewBodyFeatureOperation
JOIN = adsk.fusion.FeatureOperations.JoinFeatureOperation
CUT = adsk.fusion.FeatureOperations.CutFeatureOperation


def design():
    return adsk.fusion.Design.cast(app.activeProduct)


def cm(v):
    return v / 10.0


def vi(v_mm):
    return adsk.core.ValueInput.createByReal(v_mm / 10.0)


def P3(x, y, z=0.0):
    return adsk.core.Point3D.create(cm(x), cm(y), cm(z))


def V3(x, y, z):
    return adsk.core.Vector3D.create(x, y, z)


# ---------------------------------------------------------------- components
def new_component(name, parent=None, m=None):
    parent = parent or design().rootComponent
    occ = parent.occurrences.addNewComponent(m or adsk.core.Matrix3D.create())
    occ.component.name = name
    if occ.component.name != name:          # old copy not purged yet
        adsk.doEvents()
        occ.component.name = name
    return occ


def fix_name(occ, name):
    if occ.component.name != name:
        occ.component.name = name


def find_occurrence(name, parent=None):
    parent = parent or design().rootComponent
    for o in parent.occurrences:
        cn = o.component.name
        if cn == name or o.name.split(':')[0] == name or cn.startswith(name + ' ('):
            return o
    return None


def delete_component(name):
    root = design().rootComponent
    for o in list(root.occurrences):
        cn = o.component.name
        if cn == name or cn.startswith(name + ' ('):
            o.deleteMe()


def set_transform(occ, m):
    try:
        occ.transform2 = m
    except AttributeError:
        occ.transform = m


def matrix(cols, t):
    """cols = images of the local X, Y, Z axes; t = translation in mm."""
    m = adsk.core.Matrix3D.create()
    (a, b, c) = cols
    m.setWithCoordinateSystem(P3(*t), V3(*a), V3(*b), V3(*c))
    return m


def place_instances(comp, mats, keep=None):
    """Give `comp` exactly one occurrence per matrix. Positions are set when
    each occurrence is created (a later move would need a position capture,
    and Fusion's snapshot reverts API moves)."""
    root = design().rootComponent
    old = [o for o in root.occurrences if o.component == comp]
    new = [root.occurrences.addExistingComponent(comp, m) for m in mats]
    for o in old:
        o.deleteMe()
    return new


# -------------------------------------------------------------------- planes
def plane_offset(comp, base, d_mm, name=None):
    if abs(d_mm) < 1e-9:
        return base
    pin = comp.constructionPlanes.createInput()
    pin.setByOffset(base, vi(d_mm))
    pl = comp.constructionPlanes.add(pin)
    if name:
        pl.name = name
    pl.isLightBulbOn = False
    return pl


def plane_xy(comp, z):
    return plane_offset(comp, comp.xYConstructionPlane, z)


def plane_xz(comp, y):
    # Fusion's XZ plane normal points to -Y in some versions; offset is along the normal.
    pl = comp.xZConstructionPlane
    n = pl.geometry.normal
    return plane_offset(comp, pl, y if n.y > 0 else -y)


def plane_yz(comp, x):
    pl = comp.yZConstructionPlane
    n = pl.geometry.normal
    return plane_offset(comp, pl, x if n.x > 0 else -x)


def sketch(comp, plane, name=None):
    sk = comp.sketches.add(plane)
    if name:
        sk.name = name
    sk.isComputeDeferred = True
    return sk


def sp(sk, x, y, z):
    """Model point (mm) -> sketch-space Point3D."""
    return sk.modelToSketchSpace(P3(x, y, z))


def sk_normal(sk):
    xd = sk.xDirection
    yd = sk.yDirection
    return xd.crossProduct(yd)


# ------------------------------------------------------------ sketch drawing
def poly(sk, pts3, close=True):
    """pts3: list of model points (x,y,z) in mm."""
    lines = sk.sketchCurves.sketchLines
    p = [sp(sk, *q) for q in pts3]
    first = None
    prev = None
    for i in range(len(p) - (0 if close else 1)):
        a = prev if prev is not None else p[i]
        b = p[(i + 1) % len(p)]
        if close and i == len(p) - 1:
            b = first.startSketchPoint
        ln = lines.addByTwoPoints(a, b)
        if first is None:
            first = ln
        prev = ln.endSketchPoint
    return first


def rect(sk, x0, y0, x1, y1, z=0.0, plane='xy'):
    if plane == 'xy':
        pts = [(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)]
    elif plane == 'yz':      # x is fixed = z argument; (x0,y0)->(y,z)
        pts = [(z, x0, y0), (z, x1, y0), (z, x1, y1), (z, x0, y1)]
    elif plane == 'xz':      # y fixed; (x0,y0)->(x,z)
        pts = [(x0, z, y0), (x1, z, y0), (x1, z, y1), (x0, z, y1)]
    poly(sk, pts)


def circle(sk, x, y, z, d):
    return sk.sketchCurves.sketchCircles.addByCenterRadius(sp(sk, x, y, z), cm(d / 2.0))


def _unit(v):
    l = math.hypot(v[0], v[1])
    return (v[0] / l, v[1] / l)


def rounded_poly(sk, pts2, radii, z=0.0, plane='xy', fixed=0.0):
    """Closed polygon with a fillet at each vertex (radius 0 = sharp corner).
    pts2 are 2D points in the plane's own (u, v) coordinates:
      xy: (x, y) at height z;  yz: (y, z) at x = fixed;  xz: (x, z) at y = fixed.
    """
    def to3(u, v):
        if plane == 'xy':
            return (u, v, z)
        if plane == 'yz':
            return (fixed, u, v)
        return (u, fixed, v)

    n = len(pts2)
    if not isinstance(radii, (list, tuple)):
        radii = [radii] * n
    corners = []   # (T1, T2, centre or None)
    for i in range(n):
        V = pts2[i]
        Pp = pts2[i - 1]
        Nn = pts2[(i + 1) % n]
        r = radii[i]
        if r <= 0:
            corners.append((V, V, None, r))
            continue
        u1 = _unit((Pp[0] - V[0], Pp[1] - V[1]))
        u2 = _unit((Nn[0] - V[0], Nn[1] - V[1]))
        cosang = max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1]))
        half = math.acos(cosang) / 2.0
        t = r / math.tan(half)
        T1 = (V[0] + u1[0] * t, V[1] + u1[1] * t)
        T2 = (V[0] + u2[0] * t, V[1] + u2[1] * t)
        b = _unit((u1[0] + u2[0], u1[1] + u2[1]))
        dc = r / math.sin(half)
        C = (V[0] + b[0] * dc, V[1] + b[1] * dc)
        corners.append((T1, T2, C, r))
    arcs = sk.sketchCurves.sketchArcs
    lines = sk.sketchCurves.sketchLines
    starts, ends = [], []
    for (T1, T2, C, r) in corners:
        if C is None:
            p = sk.sketchPoints.add(sp(sk, *to3(*T1)))
            starts.append(p)
            ends.append(p)
            continue
        vm = _unit(((T1[0] + T2[0]) / 2 - C[0], (T1[1] + T2[1]) / 2 - C[1]))
        M = (C[0] + vm[0] * r, C[1] + vm[1] * r)
        a = arcs.addByThreePoints(sp(sk, *to3(*T1)), sp(sk, *to3(*M)), sp(sk, *to3(*T2)))
        t1 = sp(sk, *to3(*T1))
        s, e = a.startSketchPoint, a.endSketchPoint
        if s.geometry.distanceTo(t1) > e.geometry.distanceTo(t1):
            s, e = e, s
        starts.append(s)
        ends.append(e)
    for i in range(n):
        a = ends[i]
        b = starts[(i + 1) % n]
        if a.geometry.distanceTo(b.geometry) > 1e-6:
            lines.addByTwoPoints(a, b)


def slot(sk, x0, y0, x1, y1, w, z=0.0):
    """Straight slot (stadium) in an XY sketch between two centre points."""
    ux, uy = _unit((x1 - x0, y1 - y0))
    nx, ny = -uy * w / 2, ux * w / 2
    a0 = (x0 + nx, y0 + ny)
    a1 = (x1 + nx, y1 + ny)
    b1 = (x1 - nx, y1 - ny)
    b0 = (x0 - nx, y0 - ny)
    arcs = sk.sketchCurves.sketchArcs
    lines = sk.sketchCurves.sketchLines
    l1 = lines.addByTwoPoints(sp(sk, a0[0], a0[1], z), sp(sk, a1[0], a1[1], z))
    l2 = lines.addByTwoPoints(sp(sk, b1[0], b1[1], z), sp(sk, b0[0], b0[1], z))
    arcs.addByThreePoints(l1.endSketchPoint, sp(sk, x1 + ux * w / 2, y1 + uy * w / 2, z), l2.startSketchPoint)
    arcs.addByThreePoints(l2.endSketchPoint, sp(sk, x0 - ux * w / 2, y0 - uy * w / 2, z), l1.startSketchPoint)


def done(sk):
    sk.isComputeDeferred = False
    return sk


# ---------------------------------------------------------------- profiles
def all_profiles(sk):
    return [sk.profiles.item(i) for i in range(sk.profiles.count)]


def profiles_at(sk, pts3):
    """Profiles that contain the given model points (mm)."""
    out = []
    for q in pts3:
        p = sp(sk, *q)
        best = None
        for i in range(sk.profiles.count):
            pr = sk.profiles.item(i)
            bb = pr.boundingBox
            if not (bb.minPoint.x - 1e-6 <= p.x <= bb.maxPoint.x + 1e-6 and bb.minPoint.y - 1e-6 <= p.y <= bb.maxPoint.y + 1e-6):
                continue
            area = pr.areaProperties().area
            if _point_in_profile(pr, p) and (best is None or area < best[0]):
                best = (area, pr)
        if best and best[1] not in out:
            out.append(best[1])
    return out


def _point_in_profile(pr, p):
    # ray-cast on the tessellated outer loop, minus inner loops
    inside = False
    for li in range(pr.profileLoops.count):
        loop = pr.profileLoops.item(li)
        pts = []
        for ci in range(loop.profileCurves.count):
            g = loop.profileCurves.item(ci).geometry
            ev = g.evaluator
            ok, s, e = ev.getParameterExtents()
            for k in range(9):
                ok, q = ev.getPointAtParameter(s + (e - s) * k / 8.0)
                pts.append((q.x, q.y))
        c = _pip(pts, p.x, p.y)
        if loop.isOuter:
            inside = c
        elif c:
            return False
    return inside


def _pip(pts, x, y):
    n = len(pts)
    c = False
    j = n - 1
    for i in range(n):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            c = not c
        j = i
    return c


def largest_profile(sk):
    best = None
    for pr in all_profiles(sk):
        a = pr.areaProperties().area
        if best is None or a > best[0]:
            best = (a, pr)
    return [best[1]]


# -------------------------------------------------------------------- features
def extrude(comp, sk, profs, dist, op, direction=None, bodies=None, name=None, start=0.0):
    """dist in mm. direction: model vector the extrusion should follow
    (defaults to the sketch normal). start: offset of the start face along it."""
    feats = comp.features.extrudeFeatures
    coll = adsk.core.ObjectCollection.create()
    for p in profs:
        coll.add(p)
    inp = feats.createInput(coll, op)
    sgn = 1.0
    if direction is not None:
        n = sk_normal(sk)
        sgn = 1.0 if (n.x * direction[0] + n.y * direction[1] + n.z * direction[2]) >= 0 else -1.0
    dirn = adsk.fusion.ExtentDirections.PositiveExtentDirection if sgn > 0 else adsk.fusion.ExtentDirections.NegativeExtentDirection
    inp.setOneSideExtent(adsk.fusion.DistanceExtentDefinition.create(vi(dist)), dirn)
    if start:
        inp.startExtent = adsk.fusion.OffsetStartDefinition.create(vi(start * sgn))
    if bodies is not None:
        inp.participantBodies = list(bodies)
    f = feats.add(inp)
    if name:
        f.name = name
    return f


def extrude_sym(comp, profs, total, op, bodies=None, name=None):
    feats = comp.features.extrudeFeatures
    coll = adsk.core.ObjectCollection.create()
    for p in profs:
        coll.add(p)
    inp = feats.createInput(coll, op)
    inp.setSymmetricExtent(vi(total), True)
    if bodies is not None:
        inp.participantBodies = list(bodies)
    f = feats.add(inp)
    if name:
        f.name = name
    return f


def revolve(comp, profs, axis_line, op, bodies=None, name=None, angle_deg=360.0):
    feats = comp.features.revolveFeatures
    coll = adsk.core.ObjectCollection.create()
    for p in profs:
        coll.add(p)
    inp = feats.createInput(coll, axis_line, op)
    inp.setAngleExtent(False, adsk.core.ValueInput.createByReal(math.radians(angle_deg)))
    if bodies is not None:
        inp.participantBodies = list(bodies)
    f = feats.add(inp)
    if name:
        f.name = name
    return f


def box(comp, x0, y0, z0, x1, y1, z1, op, bodies=None, name=None):
    """Axis-aligned box from an XY sketch at z0 extruded to z1."""
    sk = sketch(comp, plane_xy(comp, z0), (name or 'box') + ' sk')
    rect(sk, x0, y0, x1, y1, z0)
    done(sk)
    return extrude(comp, sk, all_profiles(sk), z1 - z0, op, (0, 0, 1), bodies, name)


def cyl_z(comp, pts, d, z0, z1, op, bodies=None, name=None):
    sk = sketch(comp, plane_xy(comp, z0), (name or 'cyl') + ' sk')
    for (x, y) in pts:
        circle(sk, x, y, z0, d)
    done(sk)
    profs = profiles_at(sk, [(x, y, z0) for (x, y) in pts])
    return extrude(comp, sk, profs, abs(z1 - z0), op, (0, 0, 1 if z1 > z0 else -1), bodies, name)


def body_by_name(comp, name):
    for b in comp.bRepBodies:
        if b.name == name:
            return b
    return None


# ----------------------------------------------------------------- appearance
_APP_LIBS = ('Fusion Appearance Library', 'Fusion 360 Appearance Library')


def appearance(name, rgb, base_hint='Plastic - Matte'):
    des = design()
    a = des.appearances.itemByName(name)
    if a:
        return a
    src = None
    for libname in _APP_LIBS:
        lib = app.materialLibraries.itemByName(libname)
        if not lib:
            continue
        for i in range(lib.appearances.count):
            cand = lib.appearances.item(i)
            if cand.name.startswith(base_hint):
                src = cand
                break
        if src:
            break
    if src is None:
        return None
    a = des.appearances.addByCopy(src, name)
    for i in range(a.appearanceProperties.count):
        prop = a.appearanceProperties.item(i)
        if prop.objectType == adsk.core.ColorProperty.classType() and prop.name in ('Color', 'Colour'):
            try:
                prop.value = adsk.core.Color.create(rgb[0], rgb[1], rgb[2], 255)
            except Exception:
                pass
    return a


def paint(entity, app_obj):
    if app_obj is not None:
        entity.appearance = app_obj
