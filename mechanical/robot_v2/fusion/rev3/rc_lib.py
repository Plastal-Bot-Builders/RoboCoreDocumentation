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


def base_name(name):
    """Component name without Fusion's ' (1)' suffix (a deleted name stays reserved until the file is reopened)."""
    import re
    return re.sub(r' \(\d+\)$', '', name)


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
    try:
        sk.isVisible = False          # keep construction sketches out of renders
    except Exception:
        pass
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


# ------------------------------------------------------------- edge finishing
def _vtx(e):
    return e.startVertex.geometry, e.endVertex.geometry


def edges_where(body, pred):
    """Edges whose both end points (mm) satisfy pred(x, y, z)."""
    out = adsk.core.ObjectCollection.create()
    for e in body.edges:
        try:
            a, b = _vtx(e)
        except Exception:
            continue
        if pred(a.x * 10, a.y * 10, a.z * 10) and pred(b.x * 10, b.y * 10, b.z * 10):
            out.add(e)
    return out


def edges_of_plane_faces(body, axis, value, sign, tol=0.05):
    """Edges of planar faces lying in plane axis=value whose outward normal has the given sign."""
    out = adsk.core.ObjectCollection.create()
    seen = set()
    for f in body.faces:
        g = f.geometry
        if g.surfaceType != adsk.core.SurfaceTypes.PlaneSurfaceType:
            continue
        ok, n = f.evaluator.getNormalAtPoint(f.pointOnFace)
        comp_n = {'x': n.x, 'y': n.y, 'z': n.z}[axis]
        if comp_n * sign < 0.99:
            continue
        p = f.pointOnFace
        coord = {'x': p.x, 'y': p.y, 'z': p.z}[axis] * 10
        if abs(coord - value) > tol:
            continue
        for e in f.edges:
            if e.tempId not in seen:
                seen.add(e.tempId)
                out.add(e)
    return out


def chamfer(comp, edges, d_mm, name=None):
    """Equal-distance chamfer; falls back to edge-by-edge so one bad edge cannot sink the rest."""
    if edges is None or edges.count == 0:
        return 0
    feats = comp.features.chamferFeatures
    try:
        inp = feats.createInput2()
        inp.chamferEdgeSets.addEqualDistanceChamferEdgeSet(edges, vi(d_mm), True)
        f = feats.add(inp)
        if name:
            f.name = name
        return edges.count
    except Exception:
        pass
    n = 0
    for i in range(edges.count):
        one = adsk.core.ObjectCollection.create()
        one.add(edges.item(i))
        try:
            inp = feats.createInput2()
            inp.chamferEdgeSets.addEqualDistanceChamferEdgeSet(one, vi(d_mm), False)
            feats.add(inp)
            n += 1
        except Exception:
            pass
    return n


def fillet(comp, edges, r_mm, name=None, tangent=True):
    if edges is None or edges.count == 0:
        return 0
    feats = comp.features.filletFeatures
    try:
        inp = feats.createInput()
        inp.addConstantRadiusEdgeSet(edges, vi(r_mm), tangent)
        f = feats.add(inp)
        if name:
            f.name = name
        return edges.count
    except Exception:
        pass
    n = 0
    for i in range(edges.count):
        one = adsk.core.ObjectCollection.create()
        one.add(edges.item(i))
        try:
            inp = feats.createInput()
            inp.addConstantRadiusEdgeSet(one, vi(r_mm), False)
            feats.add(inp)
            n += 1
        except Exception:
            pass
    return n


def bed_chamfer(comp, body, axis, value, sign, d_mm=0.5, name='Bed chamfer'):
    """0.4-0.6 mm chamfer on every edge of the face(s) that sit on the print bed."""
    return chamfer(comp, edges_of_plane_faces(body, axis, value, sign), d_mm, name)


# ------------------------------------------------------------------- artwork
def _pip2(pt, poly):
    x, y = pt
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            c = not c
        j = i
    return c


def logo_loops(json_path):
    """Loops of a traced logo with their nesting depth (even = ink, odd = hole)."""
    import json
    d = json.load(open(json_path))
    loops = []
    for p in d['polys']:
        loops.append(p['outline'])
        loops.extend(p.get('holes', []))
    depth = []
    for i, lp in enumerate(loops):
        probe = lp[0]
        dd = 0
        for j, other in enumerate(loops):
            if i != j and len(other) > 2 and _pip2(probe, other):
                dd += 1
        depth.append(dd)
    return d['width'], d['height'], loops, depth


def logo(comp, json_path, to3, width_mm, depth_mm, into, bodies, name='Logo', inlay=False):
    """Deboss a traced logo into `bodies`. to3(u, v) maps logo units (u right, v down,
    0..w, 0..h, already scaled) to a model point (mm) on the target face; `into` is
    the model direction pointing into the material. Returns the inlay body if asked."""
    w, h, loops, depth = logo_loops(json_path)
    s = width_mm / w
    levels = sorted(set(depth))
    face_pt = to3(0, 0)
    inlay_body = None
    for lev in levels:
        idx = [i for i in range(len(loops)) if depth[i] == lev]
        if not idx:
            continue
        # sketch plane through the face, normal along `into`
        if abs(into[1]) > 0.5:
            pl = plane_xz(comp, face_pt[1])
        elif abs(into[0]) > 0.5:
            pl = plane_yz(comp, face_pt[0])
        else:
            pl = plane_xy(comp, face_pt[2])
        sk = sketch(comp, pl, '%s level %d' % (name, lev))
        lines = sk.sketchCurves.sketchLines
        for i in idx:
            lp = loops[i]
            # thin the polyline: skip points closer than 0.05 mm after scaling
            pts = []
            for (u, v) in lp:
                q = (u * s, v * s)
                if not pts or abs(q[0] - pts[-1][0]) + abs(q[1] - pts[-1][1]) > 0.05:
                    pts.append(q)
            if len(pts) > 2 and abs(pts[0][0] - pts[-1][0]) + abs(pts[0][1] - pts[-1][1]) < 0.05:
                pts.pop()
            if len(pts) < 3:
                continue
            sps = [sk.sketchPoints.add(sp(sk, *to3(u, v))) for (u, v) in pts]
            for k in range(len(sps)):
                lines.addByTwoPoints(sps[k], sps[(k + 1) % len(sps)])
        done(sk)
        profs = all_profiles(sk)
        if not profs:
            continue
        op = CUT if lev % 2 == 0 else JOIN
        extrude(comp, sk, profs, depth_mm, op, into, bodies, '%s %s' % (name, 'cut' if op == CUT else 'refill'))
        if inlay:
            if lev == levels[0]:
                f = extrude(comp, sk, profs, depth_mm, NEW, into, None, name + ' inlay')
                bl = [f.bodies.item(k) for k in range(f.bodies.count)]
                inlay_body = bl[0]
                if len(bl) > 1:
                    feats = comp.features.combineFeatures
                    tools = adsk.core.ObjectCollection.create()
                    for b in bl[1:]:
                        tools.add(b)
                    feats.add(feats.createInput(inlay_body, tools))
                inlay_body.name = name + ' inlay'
            elif inlay_body is not None:
                extrude(comp, sk, profs, depth_mm, CUT if lev % 2 == 1 else JOIN, into, [inlay_body], name + ' inlay')
    return inlay_body


def text_deboss(comp, plane, text, height_mm, centre, right, up, depth_mm, into, bodies, name='Text', font='Arial Black'):
    """Deboss one line of text centred on `centre` (model mm), reading along `right` with `up` up."""
    sk = sketch(comp, plane, name)
    done(sk)
    xd, yd = sk.xDirection, sk.yDirection
    sx = xd.x * right[0] + xd.y * right[1] + xd.z * right[2]
    sy = yd.x * up[0] + yd.y * up[1] + yd.z * up[2]
    w = height_mm * len(text) * 0.9
    a = sp(sk, centre[0] - right[0] * w / 2 - up[0] * height_mm, centre[1] - right[1] * w / 2 - up[1] * height_mm,
           centre[2] - right[2] * w / 2 - up[2] * height_mm)
    d = sp(sk, centre[0] + right[0] * w / 2 + up[0] * height_mm, centre[1] + right[1] * w / 2 + up[1] * height_mm,
           centre[2] + right[2] * w / 2 + up[2] * height_mm)
    c1 = adsk.core.Point3D.create(min(a.x, d.x), min(a.y, d.y), 0)
    c2 = adsk.core.Point3D.create(max(a.x, d.x), max(a.y, d.y), 0)
    ti = sk.sketchTexts.createInput2(text, cm(height_mm))
    ti.setAsMultiLine(c1, c2, adsk.core.HorizontalAlignments.CenterHorizontalAlignment,
                      adsk.core.VerticalAlignments.MiddleVerticalAlignment, 0)
    ti.fontName = font
    if sx < 0 and sy < 0:
        ti.angle = math.pi
    elif sx < 0:
        ti.isHorizontalFlip = True
    elif sy < 0:
        ti.isVerticalFlip = True
    txt = sk.sketchTexts.add(ti)
    feats = comp.features.extrudeFeatures
    inp = feats.createInput(txt, CUT)
    n = sk_normal(sk)
    dot = n.x * into[0] + n.y * into[1] + n.z * into[2]
    dirn = adsk.fusion.ExtentDirections.PositiveExtentDirection if dot > 0 else adsk.fusion.ExtentDirections.NegativeExtentDirection
    inp.setOneSideExtent(adsk.fusion.DistanceExtentDefinition.create(vi(depth_mm)), dirn)
    inp.participantBodies = list(bodies)
    f = feats.add(inp)
    f.name = name
    return f


def shell(comp, faces, t_mm, name='Shell'):
    feats = comp.features.shellFeatures
    coll = adsk.core.ObjectCollection.create()
    for f in faces:
        coll.add(f)
    inp = feats.createInput(coll, False)
    inp.insideThickness = vi(t_mm)
    f = feats.add(inp)
    f.name = name
    return f


def face_at(body, axis, value, sign, tol=0.05):
    """Largest planar face in plane axis=value with outward normal sign."""
    best = None
    for f in body.faces:
        if f.geometry.surfaceType != adsk.core.SurfaceTypes.PlaneSurfaceType:
            continue
        ok, n = f.evaluator.getNormalAtPoint(f.pointOnFace)
        if {'x': n.x, 'y': n.y, 'z': n.z}[axis] * sign < 0.99:
            continue
        p = f.pointOnFace
        if abs({'x': p.x, 'y': p.y, 'z': p.z}[axis] * 10 - value) > tol:
            continue
        if best is None or f.area > best.area:
            best = f
    return best
