"""Exports for the RoboCore V2 robot (rev 4): print files in print orientation,
assembly STEP/F3D, viewport renders and a ray-traced hero image."""
import os
import time
import adsk.core
import adsk.fusion
import rc_lib as L
import view

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# part -> (file name, print orientation: images of the part's X, Y, Z axes)
PRINTED = {
    'Chassis': ('Chassis', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
    'Line sled': ('Line_sled_10.5', ((1, 0, 0), (0, -1, 0), (0, 0, -1))),   # upside down
    'Battery door': ('Battery_door', ((1, 0, 0), (0, -1, 0), (0, 0, -1))),   # top face down (caster cup up)
    '1S2P spacer': ('1S2P_spacer', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
    'Wheel': ('Wheel', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),               # print 2
    'Tyre': ('Tyre_TPU', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),             # print 2
    'Arm base': ('Arm_base', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
    'Arm': ('Arm', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),                   # deck down (arm frame)
    'Jaw L': ('Jaw_L_driven', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
    'Jaw R': ('Jaw_R_idle', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
    'Sonar bracket': ('Sonar_bracket', ((1, 0, 0), (0, -1, 0), (0, 0, -1))),   # plate top down, arms up
    'Bus clip': ('Bus_clip', ((1, 0, 0), (0, 0, 1), (0, -1, 0))),        # on its side
    'Rail coupon': ('Rail_coupon', ((1, 0, 0), (0, 1, 0), (0, 0, 1))),
}


def _comp(name):
    for c in L.design().allComponents:
        if L.base_name(c.name) == name:
            return c
    return None


def _mesh(c, cols):
    """Triangle mesh (mm) of all bodies of component c, rotated into the print orientation
    and dropped onto z = 0, centred in x/y."""
    verts, tris = [], []
    for b in c.bRepBodies:
        if b.name.endswith('inlay'):
            continue
        calc = b.meshManager.createMeshCalculator()
        calc.setQuality(adsk.fusion.TriangleMeshQualityOptions.HighQualityTriangleMesh)
        m = calc.calculate()
        xyz = m.nodeCoordinatesAsDouble
        base = len(verts)
        for i in range(0, len(xyz), 3):
            x, y, z = xyz[i] * 10, xyz[i + 1] * 10, xyz[i + 2] * 10
            verts.append((cols[0][0] * x + cols[1][0] * y + cols[2][0] * z,
                          cols[0][1] * x + cols[1][1] * y + cols[2][1] * z,
                          cols[0][2] * x + cols[1][2] * y + cols[2][2] * z))
        idx = m.nodeIndices
        for i in range(0, len(idx), 3):
            tris.append((base + idx[i], base + idx[i + 1], base + idx[i + 2]))
    mn = [min(v[k] for v in verts) for k in range(3)]
    mx = [max(v[k] for v in verts) for k in range(3)]
    off = ((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, mn[2])
    verts = [(v[0] - off[0], v[1] - off[1], v[2] - off[2]) for v in verts]
    return verts, tris


def _write_stl(path, verts, tris):
    import struct
    with open(path, 'wb') as f:
        f.write(b'RoboCore V2 robot, print orientation, mm'.ljust(80, b' '))
        f.write(struct.pack('<I', len(tris)))
        for (a, b, c) in tris:
            p, q, r = verts[a], verts[b], verts[c]
            u = (q[0] - p[0], q[1] - p[1], q[2] - p[2])
            v = (r[0] - p[0], r[1] - p[1], r[2] - p[2])
            n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
            ln = (n[0] ** 2 + n[1] ** 2 + n[2] ** 2) ** 0.5 or 1.0
            f.write(struct.pack('<12fH', n[0] / ln, n[1] / ln, n[2] / ln, *p, *q, *r, 0))


def _write_3mf(path, name, verts, tris):
    import zipfile
    vx = ''.join('<vertex x="%.4f" y="%.4f" z="%.4f"/>' % v for v in verts)
    tr = ''.join('<triangle v1="%d" v2="%d" v3="%d"/>' % t for t in tris)
    model = ('<?xml version="1.0" encoding="UTF-8"?>\n'
             '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'
             '<metadata name="Title">%s</metadata><resources><object id="1" name="%s" type="model"><mesh>'
             '<vertices>%s</vertices><triangles>%s</triangles></mesh></object></resources>'
             '<build><item objectid="1"/></build></model>') % (name, name, vx, tr)
    ct = ('<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
          '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', ct)
        z.writestr('_rels/.rels', rels)
        z.writestr('3D/3dmodel.model', model)


def print_files():
    d = os.path.join(OUT, 'print')
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.endswith(('.stl', '.3mf')):
            os.remove(os.path.join(d, f))
    out = []
    for name, (fname, cols) in PRINTED.items():
        c = _comp(name)
        if c is None:
            out.append('missing ' + name)
            continue
        verts, tris = _mesh(c, cols)
        _write_stl(os.path.join(d, 'RoboCore_V2_%s.stl' % fname), verts, tris)
        _write_3mf(os.path.join(d, 'RoboCore_V2_%s.3mf' % fname), 'RoboCore V2 ' + name, verts, tris)
        size = [max(v[k] for v in verts) - min(v[k] for v in verts) for k in range(3)]
        out.append('%-14s %6.1f x %6.1f x %5.1f mm  %d triangles' % (name, size[0], size[1], size[2], len(tris)))
    return '\n'.join(out)


def sled_variants(heights=(9.5, 11.5)):
    """Line-sensor sled for other board heights (the skid follows), built, exported and removed again."""
    import build_robot
    d = os.path.join(OUT, 'print')
    out = []
    for h in heights:
        name = 'Line sled %.1f' % h
        occ = build_robot.build_sled(h, name)
        c = occ.component
        verts, tris = _mesh(c, PRINTED['Line sled'][1])
        fname = 'Line_sled_%.1f' % h
        _write_stl(os.path.join(d, 'RoboCore_V2_%s.stl' % fname), verts, tris)
        _write_3mf(os.path.join(d, 'RoboCore_V2_%s.3mf' % fname), 'RoboCore V2 ' + name, verts, tris)
        out.append('%s: %d triangles' % (name, len(tris)))
        L.delete_component(name)
    return '\n'.join(out)


def assembly_files(tag='rev4'):
    des = L.design()
    em = des.exportManager
    out = []
    step = os.path.join(OUT, 'RoboCore_V2_Robot.step')
    em.execute(em.createSTEPExportOptions(step, des.rootComponent))
    out.append(step)
    f3d = os.path.join(OUT, 'RoboCore_V2_Robot.f3d')
    try:
        em.execute(em.createFusionArchiveExportOptions(f3d, des.rootComponent))
        out.append(f3d)
    except Exception as e:
        out.append('f3d failed: %s' % e)
    return '\n'.join(out)


def renders(names=('iso', 'iso_front', 'iso_rear', 'side', 'top', 'under_iso'), w=1600, h=1100, prefix='robot', sub='renders', zoom=0.8):
    d = os.path.join(OUT, sub)
    os.makedirs(d, exist_ok=True)
    out = []
    for n in names:
        ortho = n in ('side', 'top', 'front', 'rear')
        view.set_view(n, ortho=ortho)
        if zoom and not ortho:
            # perspective: move the eye towards the target (view extents are ignored)
            vp = L.app.activeViewport
            cam = vp.camera
            e_, t_ = cam.eye, cam.target
            cam.isFitView = False
            cam.eye = adsk.core.Point3D.create(t_.x + (e_.x - t_.x) * zoom, t_.y + (e_.y - t_.y) * zoom, t_.z + (e_.z - t_.z) * zoom)
            vp.camera = cam
            vp.refresh()
        f = os.path.join(d, '%s_%s.png' % (prefix, n))
        L.app.activeViewport.saveAsImageFile(f, w, h)
        out.append(f)
    return '\n'.join(out)


def hero(path=None, view_name='hero', w=2400, h=1600, quality=60, timeout_s=50):
    """Start a local ray-traced render (Render workspace engine). Returns the future;
    poll hero_state() until it is finished."""
    des = L.design()
    view.set_view(view_name)
    rm = des.renderManager
    r = rm.rendering
    r.aspectRatio = adsk.fusion.RenderAspectRatios.CustomRenderAspectRatio
    r.resolution = adsk.fusion.RenderResolutions.CustomRenderResolution
    r.resolutionWidth = w
    r.resolutionHeight = h
    r.renderQuality = quality
    r.isBackgroundTransparent = False
    path = path or os.path.join(OUT, 'renders', 'robot_hero.png')
    fut = r.startLocalRender(path)
    t = time.time()
    while time.time() - t < timeout_s:
        adsk.doEvents()
        if fut.renderState in (adsk.fusion.LocalRenderStates.FinishedLocalRenderState, adsk.fusion.LocalRenderStates.FailedLocalRenderState):
            break
        time.sleep(0.5)
    return '%s state %s progress %s' % (path, fut.renderState, getattr(fut, 'progress', '?'))
