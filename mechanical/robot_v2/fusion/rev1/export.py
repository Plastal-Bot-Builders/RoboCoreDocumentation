"""Exports: printable parts (STL + 3MF, in each part's own frame), assembly STEP/F3D, renders."""
import os
import adsk.core
import adsk.fusion
import rc_lib as L
import view

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PRINTED = ['Chassis', 'Wheel', 'Tyre', 'Caster', 'Front skids']


def _comp(name):
    for c in L.design().allComponents:
        if c.name == name:
            return c
    return None


def print_files():
    em = L.design().exportManager
    d = os.path.join(OUT, 'print')
    os.makedirs(d, exist_ok=True)
    out = []
    for name in PRINTED:
        c = _comp(name)
        if c is None:
            out.append('missing ' + name)
            continue
        fname = name.replace(' ', '_')
        stl = os.path.join(d, 'RoboCore_V2_%s.stl' % fname)
        o = em.createSTLExportOptions(c, stl)
        o.meshRefinement = adsk.fusion.MeshRefinementSettings.MeshRefinementHigh
        o.isBinaryFormat = True
        em.execute(o)
        out.append(stl)
        try:
            tmf = os.path.join(d, 'RoboCore_V2_%s.3mf' % fname)
            o = em.createC3MFExportOptions(c, tmf)
            o.meshRefinement = adsk.fusion.MeshRefinementSettings.MeshRefinementHigh
            em.execute(o)
            out.append(tmf)
        except Exception as e:
            out.append('3mf failed for %s: %s' % (name, e))
    return '\n'.join(out)


def assembly_files():
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


def renders(names=('iso', 'iso_front', 'iso_rear', 'side', 'top', 'under_iso'), w=1600, h=1100):
    d = os.path.join(OUT, 'renders')
    os.makedirs(d, exist_ok=True)
    out = []
    for n in names:
        view.set_view(n, ortho=n in ('side', 'top', 'front', 'rear'))
        f = os.path.join(d, 'robot_%s.png' % n)
        L.app.activeViewport.saveAsImageFile(f, w, h)
        out.append(f)
    return '\n'.join(out)
