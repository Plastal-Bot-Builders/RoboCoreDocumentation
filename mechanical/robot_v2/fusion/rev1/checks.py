"""Design checks: interference between top-level parts, part sizes."""
import adsk.core
import adsk.fusion
import rc_lib as L


def _top(e):
    o = e.assemblyContext
    while o is not None and o.assemblyContext is not None:
        o = o.assemblyContext
    return o.name if o else '?'


def interference(skip_prefixes=(), only_with=None):
    des = L.design()
    root = des.rootComponent
    coll = adsk.core.ObjectCollection.create()
    for o in root.occurrences:
        if any(o.name.startswith(p) for p in skip_prefixes):
            continue
        coll.add(o)
    inp = des.createInterferenceInput(coll)
    inp.areCoincidentFacesIncluded = False
    res = des.analyzeInterference(inp)
    out = []
    for i in range(res.count):
        r = res.item(i)
        ta, tb = _top(r.entityOne), _top(r.entityTwo)
        if ta == tb:
            continue
        if only_with and not any(ta.startswith(k) or tb.startswith(k) for k in only_with):
            continue
        b = r.interferenceBody
        bb = b.boundingBox
        out.append('%s/%s  X  %s/%s  %.2f mm3 at (%.1f,%.1f,%.1f)-(%.1f,%.1f,%.1f)' % (
            ta, r.entityOne.name, tb, r.entityTwo.name, b.volume * 1000,
            bb.minPoint.x * 10, bb.minPoint.y * 10, bb.minPoint.z * 10,
            bb.maxPoint.x * 10, bb.maxPoint.y * 10, bb.maxPoint.z * 10))
    return 'interference pairs between parts: %d\n' % len(out) + '\n'.join(out)


def sizes():
    des = L.design()
    out = []
    for c in des.allComponents:
        for b in c.bRepBodies:
            if c.name.startswith(('Chassis', 'Wheel', 'Tyre', 'Caster', 'Front skids')):
                bb = b.boundingBox
                out.append('%s/%s  %.1f x %.1f x %.1f mm  %.1f cm3' % (
                    c.name, b.name, (bb.maxPoint.x - bb.minPoint.x) * 10, (bb.maxPoint.y - bb.minPoint.y) * 10,
                    (bb.maxPoint.z - bb.minPoint.z) * 10, b.volume))
    return '\n'.join(out)
