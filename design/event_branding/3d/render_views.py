"""Orthographic studio renders of the RoboCore V2 robot (Fusion v36) and its mailer box, for the event graphics.
Cycles, transparent film + shadow catcher, a three-light softbox rig that turns with every view, a bevel
shader on all materials (CAD edges are razor sharp), printed-PLA layer lines on the yellow parts.

  /Applications/Blender.app/Contents/MacOS/Blender -b --python <ABSOLUTE>/render_views.py -- <subject> <views> <out_dir> [px] [samples]
    subject: robot | box_closed | box_open
    views:   comma list of iso_fl, iso_fr, iso_rl, iso_rr, front, back, left, right, top, low_fl   (or 'all')
    px:      longest image side (default 3000; Figma caps images at 4096)
"""
import bpy, sys, math, os, time
from mathutils import Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SUBJECT = ARGS[0] if ARGS else 'robot'
VIEWS = ARGS[1] if len(ARGS) > 1 else 'iso_fl'
OUT = ARGS[2] if len(ARGS) > 2 else '/tmp/rc_renders'
PX = int(ARGS[3]) if len(ARGS) > 3 else 3000
SAMPLES = int(ARGS[4]) if len(ARGS) > 4 else 192
HERE = os.path.dirname(os.path.abspath(__file__))
BOX = '/Users/fred/RoboCoreProjects/RoboCore/mechanical/robot_v2/packaging/out'
os.makedirs(OUT, exist_ok=True)

# view = (camera azimuth from the subject's front, elevation). Front = -Y in Blender until checked (see FRONT_AZ).
ISO = math.degrees(math.atan(1 / math.sqrt(2)))          # 35.264°: true isometric
VIEW = {
    'iso_fl': (-45, ISO), 'iso_fr': (45, ISO), 'iso_rl': (-135, ISO), 'iso_rr': (135, ISO),
    'front': (0, 0.0), 'back': (180, 0.0), 'left': (-90, 0.0), 'right': (90, 0.0), 'top': (0, 89.999), 'low_fl': (-35, 18),
}
FRONT_AZ = float(os.environ.get('FRONT_AZ', '180' if SUBJECT == 'robot' else '0'))   # robot v36: arm/sonar side is +Y

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]

def meshes(objs): return [o for o in objs if o.type == 'MESH']

def bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in meshes(objs) for c in o.bound_box]
    return (Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
            Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))))

# ---------------------------------------------------------------- subject
if SUBJECT == 'robot':
    objs = import_glb(os.path.join(HERE, 'robot_v36.glb'))
    for o in [o for o in objs if o.name.startswith('C_0805_2012Metric:7')]:   # stray capacitor floating above the board
        bpy.data.objects.remove(o, do_unlink=True)
else:
    objs = import_glb(os.path.join(BOX, SUBJECT + '.glb'))
    for o in objs:
        if o.parent is None: o.scale = (0.001, 0.001, 0.001)            # box GLBs are in mm
objs = [o for o in bpy.data.objects if o.type in ('MESH', 'EMPTY')]
bpy.context.view_layer.update()
mn, mx = bbox(objs)
shift = Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))       # on the floor, centred
for o in [o for o in objs if o.parent is None]: o.location += shift
bpy.context.view_layer.update()
mn, mx = bbox(objs)
size = (mx - mn).length
print('SUBJECT', SUBJECT, 'bbox', tuple(round(v, 4) for v in mn), tuple(round(v, 4) for v in mx), 'meshes', len(meshes(objs)), flush=True)

# ---------------------------------------------------------------- materials
def principled(m): return next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m and m.node_tree else None
def setv(p, name, v):
    if name in p.inputs: p.inputs[name].default_value = v
def bevel_node(m, radius):
    b = m.node_tree.nodes.new('ShaderNodeBevel'); b.samples = 6; b.inputs['Radius'].default_value = radius
    return b
def add_bevel(m, radius):
    p = principled(m)
    if not p or p.inputs['Normal'].is_linked: return
    m.node_tree.links.new(bevel_node(m, radius).outputs['Normal'], p.inputs['Normal'])
def layer_lines(m, period=0.0002, strength=0.03):
    """Printed-PLA layer lines: fine horizontal bands as a bump in object Z, on top of the bevel."""
    p = principled(m); nt = m.node_tree
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 2 * math.pi / period
    sn = nt.nodes.new('ShaderNodeMath'); sn.operation = 'SINE'
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = strength; bump.inputs['Distance'].default_value = 0.00005
    nt.links.new(tc.outputs['Object'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], mul.inputs[0]); nt.links.new(mul.outputs[0], sn.inputs[0])
    nt.links.new(sn.outputs[0], bump.inputs['Height'])
    nt.links.new(bevel_node(m, 0.0004).outputs['Normal'], bump.inputs['Normal'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])

if SUBJECT == 'robot':
    for m in bpy.data.materials:
        p = principled(m)
        if not p: continue
        r, g, b, _ = p.inputs['Base Color'].default_value
        grey = abs(r - g) < 0.06 and abs(g - b) < 0.08 and 0.25 < r < 0.85
        setv(p, 'Metallic', 0.0)
        if r > 0.6 and 0.3 < g < 0.6 and b < 0.08:                         # printed yellow PLA -> brand yellow #F2B01E
            p.inputs['Base Color'].default_value = (0.888, 0.434, 0.012, 1)
            setv(p, 'Roughness', 0.42); setv(p, 'Specular IOR Level', 0.5); setv(p, 'Coat Weight', 0.05)
            layer_lines(m); continue
        if r > 0.45 and b > 0.45 and g < 0.3:                               # MG90S labels import magenta (decal lost): plain black
            p.inputs['Base Color'].default_value = (0.03, 0.03, 0.035, 1); setv(p, 'Roughness', 0.5); add_bevel(m, 0.0003); continue
        if r < 0.06 and g < 0.06 and b < 0.06:                              # black plastic / rubber
            setv(p, 'Roughness', 0.55)
        elif g > r * 1.5 and g > b * 1.05 and g < 0.5:                      # soldermask: glossy dark green
            p.inputs['Base Color'].default_value = (0.01, 0.07, 0.03, 1); setv(p, 'Roughness', 0.28); setv(p, 'Coat Weight', 0.3)
        elif grey:                                                          # metal: sonar cans, screws, headers
            setv(p, 'Metallic', 1.0); setv(p, 'Roughness', 0.3)
        elif r > 0.7 and g > 0.5 and b < 0.3 and r > b * 2:                 # gold / copper
            setv(p, 'Metallic', 1.0); setv(p, 'Roughness', 0.25)
        else:
            setv(p, 'Roughness', 0.45)
        add_bevel(m, 0.0003)
    for o in meshes(objs):
        if 'tyre' in o.name.lower() or 'tire' in o.name.lower():
            for s_ in o.material_slots:
                p = principled(s_.material)
                if p: setv(p, 'Roughness', 0.88)
else:
    for m in bpy.data.materials:
        p = principled(m)
        if p: setv(p, 'Roughness', 0.78); setv(p, 'Metallic', 0.0); setv(p, 'Specular IOR Level', 0.3); add_bevel(m, 0.0006)
for o in meshes(objs):
    for poly in o.data.polygons: poly.use_smooth = True

# ---------------------------------------------------------------- floor (shadow catcher), world, lights
bpy.ops.mesh.primitive_plane_add(size=size * 20, location=(0, 0, 0))
floor = bpy.context.object; floor.name = 'ShadowCatcher'; floor.is_shadow_catcher = True
world = bpy.data.worlds.new('studio'); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.82, 0.84, 0.88, 1); bg.inputs['Strength'].default_value = float(os.environ.get('WORLD', '0.15'))

rig = bpy.data.objects.new('LightRig', None); sc.collection.objects.link(rig)
def area(name, loc, energy, sz, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = sz; l.color = color; l.shape = 'DISK'
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.parent = rig
    o.location = Vector(loc) * size
    o.rotation_euler = (-o.location).to_track_quat('-Z', 'Y').to_euler()
    return o
K = size * size * float(os.environ.get('LIGHT', '0.1'))          # exposure independent of subject size
area('Key', (-1.1, -1.3, 1.5), 260 * K, 1.4 * size)               # big soft key: front-left, above
area('Fill', (1.5, -0.9, 0.7), 90 * K, 1.8 * size, (0.95, 0.97, 1.0))
area('Rim', (0.4, 1.6, 1.3), 180 * K, 1.0 * size, (1.0, 0.97, 0.92))
area('Top', (0.0, 0.0, 2.2), 70 * K, 2.0 * size)

# ---------------------------------------------------------------- camera
cam_data = bpy.data.cameras.new('cam'); cam_data.type = 'ORTHO'; cam_data.clip_end = size * 20
cam = bpy.data.objects.new('cam', cam_data); sc.collection.objects.link(cam); sc.camera = cam
centre = (mn + mx) / 2
corners = [Vector((x, y, z)) for x in (mn.x, mx.x) for y in (mn.y, mx.y) for z in (mn.z, mx.z)]

def place_camera(az, el):
    a, e = math.radians(az + FRONT_AZ), math.radians(el)
    d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))   # az 0 = from the front (-Y)
    cam.location = centre + d * size * 3
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    inv = cam.matrix_world.inverted()
    pts = [inv @ c for c in corners]
    w = max(p.x for p in pts) - min(p.x for p in pts); h = max(p.y for p in pts) - min(p.y for p in pts)
    cx = (max(p.x for p in pts) + min(p.x for p in pts)) / 2; cy = (max(p.y for p in pts) + min(p.y for p in pts)) / 2
    if w >= h: rx, ry = PX, max(64, round(PX * h / w))
    else: rx, ry = max(64, round(PX * w / h)), PX
    sc.render.resolution_x, sc.render.resolution_y = round(rx * 1.08), round(ry * 1.08)
    cam_data.ortho_scale = max(w, h) * 1.08
    cam_data.shift_x = cx / cam_data.ortho_scale; cam_data.shift_y = cy / cam_data.ortho_scale
    rig.rotation_euler = (0, 0, a)                                 # the light rig follows the camera

# ---------------------------------------------------------------- render settings
sc.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for dv in prefs.devices: dv.use = True
    sc.cycles.device = 'GPU'
except Exception as e:
    print('GPU setup failed, using CPU:', e)
sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 8
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
# Standard keeps the brand yellow true (AgX / Filmic wash it towards cream)
sc.view_settings.view_transform = os.environ.get('VT', 'Standard')
sc.view_settings.exposure = float(os.environ.get('EXPOSURE', '0'))

for v in (list(VIEW) if VIEWS == 'all' else VIEWS.split(',')):
    az, el = VIEW[v]
    place_camera(az, el)
    sc.render.filepath = os.path.join(OUT, '%s_%s.png' % (SUBJECT, v))
    t = time.time(); bpy.ops.render.render(write_still=True)
    print('RENDERED', sc.render.filepath, sc.render.resolution_x, 'x', sc.render.resolution_y, round(time.time() - t, 1), 's', flush=True)
