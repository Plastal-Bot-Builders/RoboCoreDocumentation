"""Cable-assembly models for the RoboCore V2 robot (JST SH / JST PH / 2.54 mm Dupont ends), built in Fusion.

Housing sizes come from the JST SH and PH datasheets (SHR-nV-S-B: width n + 3, 2.8 thick, 5.0 deep, 1.0 pitch, 28 AWG;
PHR-n: width 2n + 1.8, 4.5 thick, 6.85 deep, 2.0 pitch) and the usual 2.54 mm single-row crimp housing (14 mm deep).
Each cable is one direct-modelling design: two housings and n swept wires with a gentle sag. Exports a STEP to
mech/robot/export/components/cables/ and uploads it to the "Components (STEP)" folder of the robot's project.
Run inside Fusion with the robot design open (any document can be active).
"""
import os, math, traceback
import adsk.core, adsk.fusion

OUT = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/mech/robot/export/components/cables'
LOG = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/mech/robot/fusion/build_cables.log'
# family: (pitch, width(n), thickness, depth, pocket w, pocket h, pocket depth, wire d, part-number pattern)
FAM = {
    'SH': (1.0, lambda n: n + 3.0, 2.8, 5.0, 0.6, 1.4, 3.0, 0.8, 'JST SHR-%02dV-S-B'),
    'PH': (2.0, lambda n: 2 * n + 1.8, 4.5, 6.85, 1.0, 2.2, 4.0, 1.2, 'JST PHR-%d'),
    'DU': (2.54, lambda n: 2.54 * n, 2.54, 14.0, 1.6, 1.6, 14.0, 1.3, '2.54 mm crimp housing 1x%d'),
}
# name, (family, n) end A, (family, n) end B, length between housings (mm)
CABLES = [
    ('Cable_motor_encoder_SH6-PH6_120', ('SH', 6), ('PH', 6), 120.0),
    ('Cable_ultrasonic_SH4-DU4_100', ('SH', 4), ('DU', 4), 100.0),
    ('Cable_line_sensor_DU5-DU5_80', ('DU', 5), ('DU', 5), 80.0),
    ('Cable_SH4-SH4_100_Qwiic', ('SH', 4), ('SH', 4), 100.0),
    ('Cable_servo_extension_DU3-DU3_150', ('DU', 3), ('DU', 3), 150.0),
]
ONLY = None   # e.g. ['Cable_motor_encoder_SH6-PH6_120'] to rebuild some


def log(m):
    with open(LOG, 'a') as f:
        f.write(m + '\n')


def P(x, y, z):
    return adsk.core.Point3D.create(x / 10, y / 10, z / 10)


def housing(comp, fam, n, z0, direction, name):
    """Box housing from z0 extending `direction` (+1/-1) along Z (the cable axis), centred on x = y = 0; pin pockets open on the mating face."""
    pitch, wfn, thick, depth, pw, ph, pd, wd, pn = FAM[fam]
    w = wfn(n)
    sk = comp.sketches.add(comp.xYConstructionPlane)
    sk.sketchCurves.sketchLines.addTwoPointRectangle(P(-thick / 2, -w / 2, 0), P(thick / 2, w / 2, 0))
    ext = comp.features.extrudeFeatures
    inp = ext.createInput(sk.profiles.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    inp.startExtent = adsk.fusion.OffsetStartDefinition.create(adsk.core.ValueInput.createByReal(z0 / 10))
    inp.setDistanceExtent(False, adsk.core.ValueInput.createByReal(direction * depth / 10))
    body = ext.add(inp).bodies.item(0)
    body.name = name
    sk2 = comp.sketches.add(comp.xYConstructionPlane)
    for i in range(n):
        y = (i - (n - 1) / 2) * pitch
        sk2.sketchCurves.sketchLines.addTwoPointRectangle(P(-ph / 2, y - pw / 2, 0), P(ph / 2, y + pw / 2, 0))
    zm = z0 + direction * depth                         # mating face
    for i in range(sk2.profiles.count):
        try:
            inp = ext.createInput(sk2.profiles.item(i), adsk.fusion.FeatureOperations.CutFeatureOperation)
            inp.startExtent = adsk.fusion.OffsetStartDefinition.create(adsk.core.ValueInput.createByReal(zm / 10))
            inp.setDistanceExtent(False, adsk.core.ValueInput.createByReal(-direction * pd / 10))
            inp.participantBodies = [body]
            ext.add(inp)
        except Exception:
            log('  pocket %d of %s skipped: %s' % (i, name, traceback.format_exc().splitlines()[-1]))
    return body


def wire(comp, a, b, d, sag, name):
    """One conductor: a swept circle along a 3D spline from a to b (mm, along Z) sagging `sag` in -X."""
    sk = comp.sketches.add(comp.xYConstructionPlane)
    pts = adsk.core.ObjectCollection.create()
    for t in (0.0, 0.25, 0.5, 0.75, 1.0):
        pts.add(P(a[0] + (b[0] - a[0]) * t - sag * math.sin(math.pi * t), a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t))
    spl = sk.sketchCurves.sketchFittedSplines.add(pts)
    path = comp.features.createPath(spl)
    pin = comp.constructionPlanes.createInput()
    pin.setByDistanceOnPath(path, adsk.core.ValueInput.createByReal(0))
    plane = comp.constructionPlanes.add(pin)
    sk2 = comp.sketches.add(plane)
    c = sk2.modelToSketchSpace(P(*a))
    sk2.sketchCurves.sketchCircles.addByCenterRadius(c, d / 2 / 10)
    inp = comp.features.sweepFeatures.createInput(sk2.profiles.item(0), path, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    body = comp.features.sweepFeatures.add(inp).bodies.item(0)
    body.name = name
    return body


def build(app, name, A, B, L):
    doc = app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
    des = adsk.fusion.Design.cast(doc.products.itemByProductType('DesignProductType'))
    des.designType = adsk.fusion.DesignTypes.DirectDesignType
    root = des.rootComponent
    fa, na = A; fb, nb = B
    housing(root, fa, na, 0.0, -1, (FAM[fa][8] % na) + ' housing')
    housing(root, fb, nb, L, +1, (FAM[fb][8] % nb) + ' housing')
    n = min(na, nb)
    pa, pb = FAM[fa][0], FAM[fb][0]
    d = max(FAM[fa][7], FAM[fb][7])
    for i in range(n):
        ya = (i - (na - 1) / 2) * pa
        yb = (i - (nb - 1) / 2) * pb
        try:
            wire(root, (0, ya, -0.5), (0, yb, L + 0.5), d, L * 0.06, 'wire %d' % (i + 1))
        except Exception:
            log('  wire %d sweep failed, straight fallback: %s' % (i + 1, traceback.format_exc().splitlines()[-1]))
            sk = root.sketches.add(root.xYConstructionPlane)
            sk.sketchCurves.sketchCircles.addByCenterRadius(P(0, ya, 0), d / 2 / 10)
            inp = root.features.extrudeFeatures.createInput(sk.profiles.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
            inp.setDistanceExtent(False, adsk.core.ValueInput.createByReal(L / 10))
            root.features.extrudeFeatures.add(inp).bodies.item(0).name = 'wire %d' % (i + 1)
    return doc, des


def run(context):
    app = adsk.core.Application.get()
    open(LOG, 'w').write('build_cables\n')
    os.makedirs(OUT, exist_ok=True)
    robot = next((app.documents.item(i) for i in range(app.documents.count) if app.documents.item(i).name.startswith('RoboCore V2 Robot')), None)
    sub = None
    if robot and robot.dataFile:
        folder = robot.dataFile.parentFolder
        sub = next((folder.dataFolders.item(i) for i in range(folder.dataFolders.count) if folder.dataFolders.item(i).name == 'Components (STEP)'), None)
    for name, A, B, L in CABLES:
        if ONLY and name not in ONLY:
            continue
        try:
            doc, des = build(app, name, A, B, L)
            step = os.path.join(OUT, name + '.step')
            em = des.exportManager
            em.execute(em.createSTEPExportOptions(step, des.rootComponent))
            log('STEP %s (%d bodies)' % (step, des.rootComponent.bRepBodies.count))
            if sub:
                try:
                    for i in range(sub.dataFiles.count):
                        if sub.dataFiles.item(i).name == name:
                            sub.dataFiles.item(i).deleteMe(); break
                    sub.uploadFile(step)
                    log('  uploaded to Components (STEP)')
                except Exception:
                    log('  upload failed: ' + traceback.format_exc().splitlines()[-1])
            try:
                app.activeViewport.fit()
                app.activeViewport.saveAsImageFile(os.path.join(OUT, name + '.png'), 1200, 500)
            except Exception:
                pass
            doc.close(False)
        except Exception:
            log('FAILED %s: %s' % (name, traceback.format_exc()))
    if robot:
        robot.activate()
    print(open(LOG).read())
