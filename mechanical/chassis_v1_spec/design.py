"""RoboCore Zambia — parametric chassis generator for Fusion 360 (Rev B.1).

Rev B.1 refinement pass over the Rev B plate architecture:
- 4-wheel skid-steer drivetrain: wheels at X +/-75 both sides, one TT motor
  per wheel, symmetric wheelbase/track, casters removed. Wheels ride recessed
  hub bosses through the plate bearing flanges (no floating shafts).
- Servo properly mounted: slotted servo plate between the tower cheeks,
  flange + 4 screws, no floating geometry.
- Removable rear HC-SR04 bracket (2x M3 into crossbar inserts), sensor faces
  rearward; matching accessory holes on the front crossbar.
- Standardized mounting: M3 accessory grid on deck edges and plate top rails,
  slotted motor screw holes, insert pilots in crossbars.
- Cable runs (servo + sensor) with printed cable clips.
- Cross members drop to deck level and bolt to plates AND deck (removable).

Run inside Fusion 360 (Utilities > Scripts) or via the Fusion MCP server by
exec()-ing this file and calling build_all(design). Real component CADs (PCB
assembly, battery holder, 4x gearmotors) are separate occurrences placed by
placement transforms recorded in RoboCore_Chassis_Spec.md.

Coordinate system: origin at ground level, robot center. +X forward, +Y left,
+Z up. Fusion's internal unit is cm; mm() converts.
"""

import math
import traceback

import adsk.core
import adsk.fusion

PARAMS = {
    # Envelope
    "length": 230.0,
    "plate_t": 5.0,
    "plate_y_in": 57.5,
    "plate_z0": 12.0,
    "plate_h": 45.0,
    "deck_t": 3.0,

    # Drive (4 wheels, skid steer). Two-piece traction wheel: red spoked rim
    # + replaceable lugged tire, modeled once and instanced 4x.
    "wheel_dia": 70.0,             # over tire lugs; axle Z35
    "wheel_w": 26.0,               # rim overall width
    "wheel_gap": 2.5,              # plate outer face -> wheel inner face (clears screw heads)
    "wheel_x": 75.0,               # +/- wheelbase half (symmetric)
    "tire_w": 20.0,                # tire sits between the rim flanges
    "tire_id": 57.0,               # tire carcass bore = rim seat OD
    "tire_carcass_od": 66.0,       # sidewall 4.5 thick; lugs 66 -> 70
    "lug_count": 12,               # per row, two staggered rows
    "lug_half_deg": 5.0,
    "rim_seat_od": 57.0,
    "rim_flange_od": 63.0,
    "rim_id": 47.0,                # inside the seat ring
    "web_t": 5.0,                  # spoked face web thickness
    "hub_od": 22.0,                # center boss
    "hub_stem_od": 11.0,           # inboard stem through the plate flange bore
    "shaft_bore": 5.4,             # TT double-D shaft
    "hub_hole_bc": 14.0,           # 4x M2.5 on this bolt circle (encoder/hub adapter)
    "motor_boss_clear_dia": 13.0,
    "motor_screw_slot": 6.0,
    "motor_face_hole_spacing": 17.0,
    "flange_od": 18.0,
    "flange_t": 1.5,

    # PCB (real KiCad assembly; grid per D2)
    "pcb_size_x": 60.0, "pcb_size_y": 68.0, "pcb_thick": 1.6,
    "pcb_center_x": 5.0,
    "pcb_hole_grid_x": 53.0, "pcb_hole_grid_y": 61.0, "pcb_hole_dia": 3.2,
    "pcb_z0": 51.5,                # clears motor tops at Z47.5 + rear rail
    "standoff_od": 6.0,
    "rear_rail_w": 12.0, "rear_rail_t": 3.0,

    # Battery (real 3xAAA holder CAD; low + near center per weight goals)
    "batt_cx": -57.0,              # holder spans X -83.5..-30.5

    # Tower + servo (real SG90 CAD mounts THROUGH the left cheek: body through
    # a rectangular cutout, flange screwed to the inner face, output shaft +Y)
    "tower_x0": 70.0, "tower_x1": 100.0,
    "tower_y_in": 12.5,
    "tower_top": 145.0,
    "cheek_t": 5.0,
    "servo_cx": 84.0, "servo_cz": 123.0,       # servo body center in the cheek
    "servo_cut_l": 23.5, "servo_cut_w": 12.7,  # through-cutout for SG90 body
    "servo_screw_pitch": 27.9,                 # SG90 flange screw spacing
    "horn_x": 74.0,                            # output boss / horn position

    # Cross members (deck-level, removable)
    "crossbar_w": 10.0, "crossbar_z0": 15.0, "crossbar_z1": 35.0,

    # HC-SR04 rear sensor bracket (removable)
    "sr04_board_w": 45.0, "sr04_board_h": 20.0, "sr04_board_t": 1.6,
    "sr04_eye_dia": 16.0, "sr04_eye_len": 12.0, "sr04_eye_pitch": 26.0,

    # Standardized mounting
    "m3_clear": 3.2, "m3_pilot": 2.8,
    "grid_pitch": 20.0,
    "bolt_d": 5.5, "bolt_h": 2.2,
}

MM_CM = 0.1


def mm(v):
    return v * MM_CM


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def new_component(parent_comp, name):
    occ = parent_comp.occurrences.addNewComponent(adsk.core.Matrix3D.create())
    occ.component.name = name
    return occ.component


def _extrude(comp, profile, start, span, cut):
    ext = comp.features.extrudeFeatures
    if cut:
        op = adsk.fusion.FeatureOperations.CutFeatureOperation
    elif comp.bRepBodies.count == 0:
        op = adsk.fusion.FeatureOperations.NewBodyFeatureOperation
    else:
        op = adsk.fusion.FeatureOperations.JoinFeatureOperation
    inp = ext.createInput(profile, op)
    inp.setOneSideExtent(
        adsk.fusion.DistanceExtentDefinition.create(
            adsk.core.ValueInput.createByReal(mm(span))),
        adsk.fusion.ExtentDirections.PositiveExtentDirection)
    inp.startExtent = adsk.fusion.OffsetStartDefinition.create(
        adsk.core.ValueInput.createByReal(mm(start)))
    return ext.add(inp)


def add_box(comp, x1, y1, x2, y2, z1, z2, cut=False):
    sk = comp.sketches.add(comp.xYConstructionPlane)
    sk.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(mm(min(x1, x2)), mm(min(y1, y2)), 0),
        adsk.core.Point3D.create(mm(max(x1, x2)), mm(max(y1, y2)), 0))
    return _extrude(comp, sk.profiles.item(0), z1, z2 - z1, cut)


def add_cyl_z(comp, cx, cy, dia, z1, z2, cut=False):
    sk = comp.sketches.add(comp.xYConstructionPlane)
    sk.sketchCurves.sketchCircles.addByCenterRadius(
        adsk.core.Point3D.create(mm(cx), mm(cy), 0), mm(dia / 2.0))
    return _extrude(comp, sk.profiles.item(0), z1, z2 - z1, cut)


def add_cyl_y(comp, cx, cz, dia, y1, y2, cut=False):
    # XZ-plane sketches map to model (X, -Z); sketch normal is +Y (probed).
    sk = comp.sketches.add(comp.xZConstructionPlane)
    sk.sketchCurves.sketchCircles.addByCenterRadius(
        adsk.core.Point3D.create(mm(cx), mm(-cz), 0), mm(dia / 2.0))
    lo, hi = min(y1, y2), max(y1, y2)
    return _extrude(comp, sk.profiles.item(0), lo, hi - lo, cut)


# YZ-plane sketch axis mapping, set by probe_yz_mapping() at runtime.
# Default assumption: sketch (u, v) = model (Y, Z), normal +X.
_YZ_MAP = {"u": "y", "v": "z", "flip_u": 1.0, "flip_v": 1.0, "normal": 1.0}


def probe_yz_mapping(design):
    root = design.rootComponent
    sk = root.sketches.add(root.yZConstructionPlane)
    p = sk.modelToSketchSpace(adsk.core.Point3D.create(0.0, 1.0, 0.0))   # +Y
    q = sk.modelToSketchSpace(adsk.core.Point3D.create(0.0, 0.0, 1.0))   # +Z
    r = sk.modelToSketchSpace(adsk.core.Point3D.create(1.0, 0.0, 0.0))   # +X
    sk.deleteMe()
    if abs(p.x) > 0.5:
        _YZ_MAP.update(u="y", flip_u=1.0 if p.x > 0 else -1.0)
        _YZ_MAP.update(v="z", flip_v=1.0 if q.y > 0 else -1.0)
    else:
        _YZ_MAP.update(u="z", flip_u=1.0 if q.x > 0 else -1.0)
        _YZ_MAP.update(v="y", flip_v=1.0 if p.y > 0 else -1.0)
    _YZ_MAP["normal"] = 1.0 if r.z > 0 else -1.0


def add_cyl_x(comp, cy, cz, dia, x1, x2, cut=False):
    """Cylinder along X between x1 and x2 (uses probed YZ-plane mapping)."""
    sk = comp.sketches.add(comp.yZConstructionPlane)
    vals = {"y": cy, "z": cz}
    u = vals[_YZ_MAP["u"]] * _YZ_MAP["flip_u"]
    v = vals[_YZ_MAP["v"]] * _YZ_MAP["flip_v"]
    sk.sketchCurves.sketchCircles.addByCenterRadius(
        adsk.core.Point3D.create(mm(u), mm(v), 0), mm(dia / 2.0))
    lo, hi = min(x1, x2), max(x1, x2)
    if _YZ_MAP["normal"] > 0:
        return _extrude(comp, sk.profiles.item(0), lo, hi - lo, cut)
    return _extrude(comp, sk.profiles.item(0), -hi, hi - lo, cut)


def add_ring_y(comp, cx, cz, od, idia, y1, y2, cut=False):
    """Annular ring along Y (two concentric circles; picks the 2-loop profile)."""
    sk = comp.sketches.add(comp.xZConstructionPlane)
    for d in (od, idia):
        sk.sketchCurves.sketchCircles.addByCenterRadius(
            adsk.core.Point3D.create(mm(cx), mm(-cz), 0), mm(d / 2.0))
    prof = None
    for i in range(sk.profiles.count):
        if sk.profiles.item(i).profileLoops.count == 2:
            prof = sk.profiles.item(i)
    lo, hi = min(y1, y2), max(y1, y2)
    return _extrude(comp, prof, lo, hi - lo, cut)


def add_poly_y(comp, pts_xz, y1, y2, cut=False):
    sk = comp.sketches.add(comp.xZConstructionPlane)
    lines = sk.sketchCurves.sketchLines
    n = len(pts_xz)
    for i in range(n):
        x0, z0 = pts_xz[i]
        x1, z1 = pts_xz[(i + 1) % n]
        lines.addByTwoPoints(adsk.core.Point3D.create(mm(x0), mm(-z0), 0),
                             adsk.core.Point3D.create(mm(x1), mm(-z1), 0))
    lo, hi = min(y1, y2), max(y1, y2)
    return _extrude(comp, sk.profiles.item(0), lo, hi - lo, cut)


def add_slot_x(comp, cx, cy, length_x, width_y, z1, z2, cut=True):
    add_box(comp, cx - length_x / 2 + width_y / 2, cy - width_y / 2,
            cx + length_x / 2 - width_y / 2, cy + width_y / 2, z1, z2, cut=cut)
    add_cyl_z(comp, cx - length_x / 2 + width_y / 2, cy, width_y, z1, z2, cut=cut)
    add_cyl_z(comp, cx + length_x / 2 - width_y / 2, cy, width_y, z1, z2, cut=cut)


def bolt_y(comp, x, z, y_face, outward):
    add_cyl_y(comp, x, z, PARAMS["bolt_d"],
              min(y_face, y_face + outward * PARAMS["bolt_h"]),
              max(y_face, y_face + outward * PARAMS["bolt_h"]))


def bolt_z(comp, x, y, z_face, down=False):
    h = PARAMS["bolt_h"]
    if down:
        add_cyl_z(comp, x, y, PARAMS["bolt_d"], z_face - h, z_face)
    else:
        add_cyl_z(comp, x, y, PARAMS["bolt_d"], z_face, z_face + h)


_APPEARANCES = {}


def find_appearance(name):
    if name in _APPEARANCES:
        return _APPEARANCES[name]
    app = adsk.core.Application.get()
    found = None
    for li in range(app.materialLibraries.count):
        try:
            a = app.materialLibraries.item(li).appearances.itemByName(name)
        except Exception:
            a = None
        if a:
            found = a
            break
    _APPEARANCES[name] = found
    return found


def paint(comp, name):
    a = find_appearance(name)
    if not a:
        return
    for i in range(comp.bRepBodies.count):
        try:
            comp.bRepBodies.item(i).appearance = a
        except Exception:
            pass


def paint_first(comp, names):
    for n in names:
        if find_appearance(n):
            paint(comp, n)
            return n
    return None


# --------------------------------------------------------------------------
# Builders
# --------------------------------------------------------------------------
def build_side_plates(root, p):
    z0, h, t = p["plate_z0"], p["plate_h"], p["plate_t"]
    z1 = z0 + h
    xe = p["length"] / 2.0
    axle_z = p["wheel_dia"] / 2.0
    wx = p["wheel_x"]
    comp = new_component(root, "Side plates (CNC aluminum)")
    for s in (1, -1):
        y_in, y_out = s * p["plate_y_in"], s * (p["plate_y_in"] + t)
        lo, hi = min(y_in, y_out), max(y_in, y_out)
        add_poly_y(comp, [(-xe, z0 + 8), (-xe + 8, z0), (xe - 8, z0),
                          (xe, z0 + 8), (xe, z1 - 7), (xe - 7, z1),
                          (-xe + 7, z1), (-xe, z1 - 7)], lo, hi)
        # Truss cutouts, skipping both axle zones
        up = True
        for cx in (-40.0, -15.0, 10.0, 35.0):
            up = not up
            if up:
                add_poly_y(comp, [(cx - 11, z0 + 8), (cx + 11, z0 + 8),
                                  (cx, z0 + 34)], lo, hi, cut=True)
            else:
                add_poly_y(comp, [(cx - 11, z1 - 8), (cx + 11, z1 - 8),
                                  (cx, z1 - 34)], lo, hi, cut=True)
        for hx in (-104.0, 104.0):
            add_cyl_y(comp, hx, (z0 + z1) / 2.0, 10.0, lo, hi, cut=True)
        # Two axles per plate: boss bore + slotted motor screw holes + flange
        for sxw in (1, -1):
            ax = sxw * wx
            add_cyl_y(comp, ax, axle_z, p["motor_boss_clear_dia"], lo, hi, cut=True)
            for dx in (-p["motor_face_hole_spacing"] / 2.0,
                       p["motor_face_hole_spacing"] / 2.0):
                sl = p["motor_screw_slot"] / 2.0
                add_poly_y(comp, [(ax + dx - 1.6, axle_z - sl),
                                  (ax + dx + 1.6, axle_z - sl),
                                  (ax + dx + 1.6, axle_z + sl),
                                  (ax + dx - 1.6, axle_z + sl)], lo, hi, cut=True)
                bolt_y(comp, ax + dx, axle_z, s * (p["plate_y_in"] + t), s)
            f1 = s * (p["plate_y_in"] + t)
            f2 = s * (p["plate_y_in"] + t + p["flange_t"])
            add_cyl_y(comp, ax, axle_z, p["flange_od"], min(f1, f2), max(f1, f2))
            add_cyl_y(comp, ax, axle_z, p["motor_boss_clear_dia"],
                      min(f1, f2), max(f1, f2), cut=True)
        # Standardized M3 accessory rail along the solid top band
        for gx in range(-100, 101, int(p["grid_pitch"])):
            add_cyl_y(comp, float(gx), z1 - 4.5, p["m3_clear"], lo, hi, cut=True)
        # Deck bracket bolts (center zone, clear of motor bodies)
        for bx in (-12.0, 12.0):
            bolt_y(comp, bx, z0 + 5.0, s * (p["plate_y_in"] + t), s)
    paint(comp, "Aluminum - Bead Blasted")
    return comp


def build_deck(root, p):
    z0, z1 = p["plate_z0"], p["plate_z0"] + p["deck_t"]
    xe = p["length"] / 2.0 - 3.0
    wy = p["plate_y_in"]
    comp = new_component(root, "Floor deck (aluminum)")
    add_box(comp, -xe, -wy, xe, wy, z0, z1)
    # Lightening slots
    add_slot_x(comp, 45.0, 0.0, 30.0, 14.0, z0, z1)
    for sy in (1, -1):
        add_slot_x(comp, 5.0, sy * 38.0, 24.0, 10.0, z0, z1)
        add_slot_x(comp, -75.0, sy * 45.0, 20.0, 8.0, z0, z1)
    # Deck-to-plate angle brackets (center zone) with bolts
    for s in (1, -1):
        for bx in (-12.0, 12.0):
            add_box(comp, bx - 7.5, s * (wy - 6.0), bx + 7.5, s * wy, z1, z1 + 8.0)
            bolt_z(comp, bx, s * (wy - 3.0), z1 + 8.0)
    # Standardized M3 accessory grid along both deck edges (tie-downs too)
    for s in (1, -1):
        for gx in range(-90, 91, int(p["grid_pitch"])):
            if gx == -70:      # would land inside the rear lightening slot
                continue
            add_cyl_z(comp, float(gx), s * 48.0, p["m3_clear"], z0, z1, cut=True)
    # Battery holder mounting provision (2x M3)
    for dx in (-25.0, 25.0):
        add_cyl_z(comp, p["batt_cx"] + dx, 0.0, p["m3_clear"], z0, z1, cut=True)
    paint(comp, "Aluminum - Bead Blasted")
    return comp


def build_crossbars(root, p):
    wy = p["plate_y_in"]
    comp = new_component(root, "Cross members (x2, removable)")
    for s in (1, -1):
        x_out = s * (p["length"] / 2.0 - 0.5)
        x_in = x_out - s * p["crossbar_w"]
        xc = (x_in + x_out) / 2.0
        add_box(comp, min(x_in, x_out), -wy, max(x_in, x_out), wy,
                p["crossbar_z0"], p["crossbar_z1"])
        zc = (p["crossbar_z0"] + p["crossbar_z1"]) / 2.0
        for sy in (1, -1):
            bolt_y(comp, xc, zc, sy * (wy + p["plate_t"]), sy)      # plate bolts
            bolt_z(comp, xc, sy * 30.0, p["crossbar_z0"] - p["deck_t"], down=True)
        # Standardized accessory/bracket inserts on the top face (M3 pilots)
        for dy in (-13.0, 13.0):
            add_cyl_z(comp, xc, dy, p["m3_pilot"],
                      p["crossbar_z1"] - 8.0, p["crossbar_z1"], cut=True)
    paint(comp, "Aluminum - Bead Blasted")
    return comp


def build_wheels(root, p):
    """Two-piece traction wheel modeled ONCE at the origin (axis +Y, inner
    face at y=0), then instanced 4x. Rim: red plastic, spoked web, hub boss
    with TT shaft bore + 4x M2.5 adapter holes, inboard stem riding through
    the plate's bearing-flange bore. Tire: replaceable, seated between the
    rim flanges, two staggered rows of traction lugs."""
    w = p["wheel_w"]
    web0 = (w - p["web_t"]) / 2.0

    # Placement transforms (component geometry is origin-centered, axis +Y)
    axle_z = p["wheel_dia"] / 2.0
    y_in = p["plate_y_in"] + p["plate_t"] + p["wheel_gap"]
    placements = []
    for s in (1, -1):
        for sxw in (1, -1):
            m = adsk.core.Matrix3D.create()
            if s < 0:
                m.setToRotation(math.pi, adsk.core.Vector3D.create(0, 0, 1),
                                adsk.core.Point3D.create(0, 0, 0))
            m.translation = adsk.core.Vector3D.create(
                mm(sxw * p["wheel_x"]), mm(s * y_in), mm(axle_z))
            placements.append(m)

    rim_occ = root.occurrences.addNewComponent(placements[0])
    rim = rim_occ.component
    rim.name = "Wheel rim (red plastic, x4)"
    add_ring_y(rim, 0, 0, p["rim_flange_od"], p["rim_id"], 0.0, 3.0)
    add_ring_y(rim, 0, 0, p["rim_seat_od"], p["rim_id"], 3.0, w - 3.0)
    add_ring_y(rim, 0, 0, p["rim_flange_od"], p["rim_id"], w - 3.0, w)
    # Spoked face web with 6 windows (motorsport-style)
    add_ring_y(rim, 0, 0, p["rim_id"] + 0.5, p["hub_od"] - 1.0, web0, web0 + p["web_t"])
    a_in, a_out = math.radians(20.0), math.radians(23.0)
    for k in range(6):
        phi = math.radians(k * 60.0)
        pts = [(13.5 * math.cos(phi - a_in), 13.5 * math.sin(phi - a_in)),
               (13.5 * math.cos(phi + a_in), 13.5 * math.sin(phi + a_in)),
               (21.0 * math.cos(phi + a_out), 21.0 * math.sin(phi + a_out)),
               (21.0 * math.cos(phi - a_out), 21.0 * math.sin(phi - a_out))]
        add_poly_y(rim, pts, web0, web0 + p["web_t"], cut=True)
    # Hub boss (protrudes from the web) + inboard stem through the plate flange
    add_cyl_y(rim, 0, 0, p["hub_od"], 6.0, w - 4.0)
    add_cyl_y(rim, 0, 0, p["hub_stem_od"], -4.0, 6.0)
    add_cyl_y(rim, 0, 0, p["shaft_bore"], -4.0, w - 4.0, cut=True)
    for k in range(4):
        a = math.radians(45.0 + k * 90.0)
        add_cyl_y(rim, p["hub_hole_bc"] / 2.0 * math.cos(a),
                  p["hub_hole_bc"] / 2.0 * math.sin(a), 2.7,
                  w - 11.0, w - 4.0, cut=True)
    paint_first(rim, ["Plastic - Glossy (Red)", "Paint - Enamel Glossy (Red)",
                      "Aluminum - Anodized Glossy (Red)"])

    tire_occ = root.occurrences.addNewComponent(placements[0])
    tire = tire_occ.component
    tire.name = "Wheel tire (rubber, x4)"
    t0, t1 = 3.0, 3.0 + p["tire_w"]
    add_ring_y(tire, 0, 0, p["tire_carcass_od"], p["tire_id"], t0, t1)
    half = math.radians(p["lug_half_deg"])
    r0, r1 = p["tire_carcass_od"] / 2.0, p["wheel_dia"] / 2.0
    pitch = 360.0 / p["lug_count"]
    for row, (ya, yb, off) in enumerate((
            (t0 + 0.5, t0 + p["tire_w"] / 2.0 - 0.5, 0.0),
            (t0 + p["tire_w"] / 2.0 + 0.5, t1 - 0.5, pitch / 2.0))):
        for k in range(p["lug_count"]):
            phi = math.radians(off + k * pitch)
            pts = [(r0 * math.cos(phi - half), r0 * math.sin(phi - half)),
                   (r0 * math.cos(phi + half), r0 * math.sin(phi + half)),
                   (r1 * math.cos(phi + half), r1 * math.sin(phi + half)),
                   (r1 * math.cos(phi - half), r1 * math.sin(phi - half))]
            add_poly_y(tire, pts, ya, yb)
    paint(tire, "Rubber - Hard")

    # Remaining 3 instances of each (right side rotated 180 about Z)
    for m in placements[1:]:
        root.occurrences.addExistingComponent(rim, m)
        root.occurrences.addExistingComponent(tire, m)
    return rim


def build_pcb_deck(root, p):
    z0 = p["pcb_z0"]
    deck_top = p["plate_z0"] + p["deck_t"]
    cx = p["pcb_center_x"]
    gx, gy = p["pcb_hole_grid_x"] / 2.0, p["pcb_hole_grid_y"] / 2.0
    comp = new_component(root, "PCB standoffs + rear rail")
    for sy in (1, -1):
        add_cyl_z(comp, cx + gx, sy * gy, p["standoff_od"], deck_top, z0)
        bolt_z(comp, cx + gx, sy * gy, z0 + p["pcb_thick"])
    rx = cx - gx
    rw = p["rear_rail_w"] / 2.0
    wy = p["plate_y_in"]
    add_box(comp, rx - rw, -wy, rx + rw, wy, z0 - p["rear_rail_t"], z0)
    for sy in (1, -1):
        bolt_y(comp, rx, z0 - p["rear_rail_t"] / 2.0, sy * (wy + p["plate_t"]), sy)
        bolt_z(comp, rx, sy * gy, z0 + p["pcb_thick"])
    paint(comp, "Aluminum - Polished")
    return comp


def build_tower(root, p):
    z0 = p["plate_z0"] + p["deck_t"]
    x0, x1, zt = p["tower_x0"], p["tower_x1"], p["tower_top"]
    comp = new_component(root, "Vertical mechanism tower")
    for s in (1, -1):
        y_in, y_out = s * p["tower_y_in"], s * (p["tower_y_in"] + p["cheek_t"])
        lo, hi = min(y_in, y_out), max(y_in, y_out)
        add_poly_y(comp, [(x0, z0), (x1, z0), (x1, zt - 10), (x1 - 8, zt),
                          (x0 + 8, zt), (x0, zt - 10)], lo, hi)
        for hz in (45.0, 75.0):
            add_cyl_y(comp, (x0 + x1) / 2.0, hz, 14.0, lo, hi, cut=True)
        # Spare M3 accessory holes near the top (future arm attachments)
        for hx in (x0 + 6.0, x1 - 6.0):
            add_cyl_y(comp, hx, zt - 6.0, p["m3_clear"], lo, hi, cut=True)
        add_box(comp, x0 + 2, s * (p["tower_y_in"] + p["cheek_t"]),
                x1 - 2, s * (p["tower_y_in"] + p["cheek_t"] + 8.0), z0, z0 + 7.0)
        bolt_z(comp, (x0 + x1) / 2.0, s * (p["tower_y_in"] + p["cheek_t"] + 4.0),
               z0 + 7.0)
    for (sx_, sz_) in ((x0 + 5, 60.0), (x1 - 5, 90.0)):
        add_cyl_y(comp, sx_, sz_, 8.0, -p["tower_y_in"], p["tower_y_in"])
        for sy in (1, -1):
            bolt_y(comp, sx_, sz_, sy * (p["tower_y_in"] + p["cheek_t"]), sy)
    # Servo mounting: through-cutout + flange screws in the LEFT cheek only
    scx, scz = p["servo_cx"], p["servo_cz"]
    hl, hw = p["servo_cut_l"] / 2.0, p["servo_cut_w"] / 2.0
    lo, hi = p["tower_y_in"], p["tower_y_in"] + p["cheek_t"]
    add_poly_y(comp, [(scx - hl, scz - hw), (scx + hl, scz - hw),
                      (scx + hl, scz + hw), (scx - hl, scz + hw)],
               lo, hi, cut=True)
    for dx in (-p["servo_screw_pitch"] / 2.0, p["servo_screw_pitch"] / 2.0):
        add_cyl_y(comp, scx + dx, scz, 2.2, lo, hi, cut=True)
        bolt_y(comp, scx + dx, scz, p["tower_y_in"], -1)   # heads on inner face
    paint(comp, "Aluminum - Bead Blasted")
    return comp


def build_horn_arm(root, p):
    """Servo horn + brass linkage arm on the left cheek's outer side,
    aligned with the SG90 output shaft that exits through the cheek."""
    comp = new_component(root, "Servo horn + linkage arm (reference)")
    hx, hz = p["horn_x"], p["servo_cz"]
    y0 = p["tower_y_in"] + p["cheek_t"] + 4.0    # just outboard of the cheek
    add_cyl_y(comp, hx, hz, 22.0, y0, y0 + 3.0)
    add_box(comp, hx - 2.0, y0 + 3.0, hx + 42.0, y0 + 6.0, hz - 4.0, hz + 4.0)
    for ax in (hx + 10.0, hx + 22.0, hx + 34.0):
        add_cyl_y(comp, ax, hz, 4.0, y0 + 3.0, y0 + 6.0, cut=True)
    return comp


def build_sr04_bracket(root, p):
    """Removable rear ultrasonic bracket: 2x M3 into crossbar inserts."""
    xe = p["length"] / 2.0
    bar_out = -(xe - 0.5)                       # rear crossbar outer face
    comp = new_component(root, "HC-SR04 bracket (printed, removable)")
    # Foot on the crossbar top with the 2 M3 screws
    add_box(comp, bar_out, -15.0, bar_out + p["crossbar_w"], 15.0,
            p["crossbar_z1"], p["crossbar_z1"] + 3.0)
    for dy in (-13.0, 13.0):
        bolt_z(comp, bar_out + p["crossbar_w"] / 2.0, dy, p["crossbar_z1"] + 3.0)
    # Back plate carrying the sensor, facing rearward
    add_box(comp, bar_out - 3.0, -25.0, bar_out, 25.0, 18.0,
            p["crossbar_z1"] + 3.0)
    # Cable pass-through slot (the real HC-SR04 CAD mounts on this face)
    add_box(comp, bar_out - 3.0, -6.0, bar_out, 6.0, 20.0, 26.0, cut=True)
    paint(comp, "Plastic - Matte (Black)")
    return comp


def build_cabling(root, p):
    """Cable runs + printed clips: servo and sensor cables to the PCB."""
    deck_top = p["plate_z0"] + p["deck_t"]
    comp = new_component(root, "Cable runs + clips")
    # Servo cable: down the left cheek inner face, then rearward to the PCB
    add_box(comp, 84.0, -9.0, 87.0, -7.0, deck_top, p["servo_cz"] - 4.0)
    add_box(comp, 38.0, -9.0, 85.0, -7.0, deck_top, deck_top + 2.5)
    # Sensor cable: along the deck beside the battery, then up to the PCB edge
    xe = p["length"] / 2.0
    add_box(comp, -(xe - 3.0), -25.0, -33.0, -22.0, deck_top, deck_top + 2.5)
    add_box(comp, -33.0, -25.0, -30.0, -22.0, deck_top, p["pcb_z0"] - 2.0)
    paint(comp, "Plastic - Matte (Black)")

    clips = new_component(root, "Cable clips (printed)")
    for (cx, cy) in ((60.0, -8.0), (-90.0, -23.5), (-50.0, -23.5)):
        add_box(clips, cx - 4.0, cy - 4.5, cx + 4.0, cy + 4.5,
                deck_top, deck_top + 5.0)
        add_box(clips, cx - 4.0, cy - 3.0, cx + 4.0, cy + 3.0,
                deck_top, deck_top + 3.5, cut=True)
    paint(clips, "Plastic - Matte (White)")
    return comp


# --------------------------------------------------------------------------
def register_user_params(design, p):
    ups = design.userParameters
    for k, v in p.items():
        if not isinstance(v, (int, float)):
            continue
        name = "rc_" + k
        existing = ups.itemByName(name)
        if existing:
            existing.expression = "{} mm".format(v)
        else:
            ups.add(name, adsk.core.ValueInput.createByString("{} mm".format(v)),
                    "mm", "RoboCore chassis Rev B.1")


def build_all(design):
    """Delete any previous generated chassis and build Rev B.1.

    HARD GUARD: this generator regenerates the whole chassis and would wipe
    doc-side work (Intake_Linkage, joints, tower cleanup, chassis mounting —
    Steps 4-7 of the intake-arm phase). It refuses to run against a document
    that contains those features until they are ported into this file.
    """
    for c_i in range(design.allComponents.count):
        if design.allComponents.item(c_i).name == "Intake_Linkage":
            raise RuntimeError(
                "REFUSING to rebuild: this design contains 'Intake_Linkage' "
                "(doc-side Steps 4-7 work that build_all would destroy). "
                "Port those features into design.py before regenerating.")
    probe_yz_mapping(design)
    removed = 0
    for occ in list(design.rootComponent.occurrences):
        if occ.component.name == "RoboCore Chassis":
            occ.deleteMe()
            removed += 1
    p = PARAMS
    register_user_params(design, p)
    root = new_component(design.rootComponent, "RoboCore Chassis")
    names = []
    for builder in (build_side_plates, build_deck, build_crossbars,
                    build_wheels, build_pcb_deck, build_tower,
                    build_horn_arm, build_sr04_bracket, build_cabling):
        comp = builder(root, p)
        names.append(comp.name)
    return removed, names


def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox("Open a Fusion design first.")
            return
        removed, names = build_all(design)
        app.activeViewport.fit()
        ui.messageBox("RoboCore chassis Rev B.1 generated ({} parts, {} old removed)."
                      .format(len(names), removed))
    except Exception:  # noqa: BLE001
        if ui:
            ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


def stop(context):
    pass
