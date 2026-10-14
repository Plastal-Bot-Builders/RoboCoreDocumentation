"""Split the RoboCore V2 robot assembly into one file per important component.

Run inside Fusion (through the MCP add-in or Scripts and Add-Ins) with the robot design open. For every top-level
component listed in PARTS it:
  1. exports a STEP (and STL for printed parts) to mech/robot/export/components/<name>.step on disk;
  2. uploads that STEP into a "Components (STEP)" subfolder of the design's own project folder in the Fusion data
     panel. A STEP in the data panel is a fixed, non-editable file: opening it always imports a copy into a new
     untitled design, so the originals cannot be changed; "Insert into current design" references it as-is;
  3. optionally (SAVE_F3D = True) saves each component as its own Fusion design in a "Components" subfolder via
     Component.saveCopyAs. These are editable in Fusion; set SAVE_F3D = False to only make the STEP set.
The log goes to export_components.log next to this file.
"""
import os, time, traceback
import adsk.core, adsk.fusion

HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/mech/robot/fusion'
OUT = os.path.normpath(os.path.join(HERE, '..', 'export', 'components'))
LOG = os.path.join(HERE, 'export_components.log')
SAVE_F3D = False
STEP_FOLDER = 'Components (STEP)'
F3D_FOLDER = 'Components'
# component name prefix -> (file name, printed part?)
PARTS = [
    ('Chassis', 'RoboCore_V2_Chassis', True), ('Wheel', 'RoboCore_V2_Wheel', True), ('Tyre', 'RoboCore_V2_Tyre_TPU', True),
    ('Arm base', 'RoboCore_V2_Arm_base', True), ('Arm', 'RoboCore_V2_Arm', True), ('Jaw L', 'RoboCore_V2_Jaw_L_driven', True),
    ('Jaw R', 'RoboCore_V2_Jaw_R_idle', True), ('Sonar bracket', 'RoboCore_V2_Sonar_bracket', True),
    ('Bus clip', 'RoboCore_V2_Bus_clip', True), ('Ballast clip', 'RoboCore_V2_Ballast_clip', True), ('Rail coupon', 'RoboCore_V2_Rail_coupon', True),
    ('Caster ball', 'Caster_ball_12.7', False), ('DG01D-E motor', 'DG01D-E_motor_with_encoder', False), ('TT DC Gear Motor', 'TT_motor_with_encoder', False),
    ('RoboCore_V2 v', 'RoboCore_V2_controller_board', False), ('BatteryHolder', 'Battery_holder_3x18650', False),
    ('HCSR04', 'HC-SR04_ultrasonic', False), ('RoboCore_LineSensor', 'RoboCore_line_sensor_board', False),
    ('Assembly Micro Servo MG90S', 'Micro_servo_MG90S', False), ('Servo v', 'Micro_servo_SG90', False), ('SG90 horn', 'SG90_horn', False),
]
ONLY = None   # or a list of file names to (re)export


def log(m):
    with open(LOG, 'a') as f:
        f.write(m + '\n')


def find_subfolder(folder, name):
    for i in range(folder.dataFolders.count):
        if folder.dataFolders.item(i).name == name:
            return folder.dataFolders.item(i)
    return folder.dataFolders.add(name)


def run(context):
    app = adsk.core.Application.get()
    doc = app.activeDocument
    des = adsk.fusion.Design.cast(app.activeProduct)
    open(LOG, 'w').write('export_components %s\n' % time.ctime())
    os.makedirs(OUT, exist_ok=True)
    if not des or not doc.dataFile:
        log('open the saved robot design first'); print(open(LOG).read()); return
    folder = doc.dataFile.parentFolder
    step_folder = find_subfolder(folder, STEP_FOLDER)
    f3d_folder = find_subfolder(folder, F3D_FOLDER) if SAVE_F3D else None
    em = des.exportManager
    done = set()
    for occ in des.rootComponent.occurrences:
        comp = occ.component
        match = next(((pre, fn, printed) for pre, fn, printed in PARTS if comp.name.lower().startswith(pre.lower())), None)
        if not match or match[1] in done or comp.bRepBodies.count + comp.occurrences.count == 0:
            continue
        pre, fn, printed = match
        if ONLY and fn not in ONLY:
            continue
        done.add(fn)
        try:
            step = os.path.join(OUT, fn + '.step')
            em.execute(em.createSTEPExportOptions(step, comp))
            log('STEP %s <- %s' % (step, comp.name))
            if printed:
                so = em.createSTLExportOptions(comp, os.path.join(OUT, fn + '.stl'))
                so.meshRefinement = adsk.fusion.MeshRefinementSettings.MeshRefinementHigh
                em.execute(so)
            try:
                for i in range(step_folder.dataFiles.count):          # replace an earlier upload of the same name
                    old = step_folder.dataFiles.item(i)
                    if old.name == fn:
                        old.deleteMe(); break
                step_folder.uploadFile(step)
                log('  uploaded to %s/%s' % (folder.name, STEP_FOLDER))
            except Exception as e:
                log('  upload failed: %s' % e)
            if SAVE_F3D:
                try:
                    comp.saveCopyAs(fn, f3d_folder, 'RoboCore V2 component, exported from the robot assembly', 'v2')
                    log('  saved copy as %s/%s' % (F3D_FOLDER, fn))
                except Exception as e:
                    log('  saveCopyAs failed: %s' % e)
        except Exception:
            log('  failed %s: %s' % (comp.name, traceback.format_exc()))
    log('done: %d components' % len(done))
    print(open(LOG).read())
