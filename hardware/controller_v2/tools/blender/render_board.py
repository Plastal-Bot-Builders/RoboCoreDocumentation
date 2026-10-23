"""Studio renders of the RoboCore V2 controller board in Blender (Cycles).

    Blender -b -P tools/blender/render_board.py -- [--shots a,b] [--pct 100] [--samples 384] [--out DIR] [--glb FILE]

The board model comes from KiCad (see render_board.sh, which exports it first):
    kicad-cli pcb export glb --subst-models --include-tracks --include-pads --include-zones
                             --include-silkscreen --include-soldermask -o tools/blender/.cache/board.glb RoboCore_V2.kicad_pcb

Each shot is written as <shot>.png with a transparent background and a soft contact shadow (Cycles shadow
catcher). render_board.sh then makes white-background copies and a contact sheet (finish.py).

KiCad's GLB marks every part material as fully metallic and gives the solder mask an alpha of 0.83 over a pale
substrate, which is why plain imports look washed out. MATERIALS below sets a real finish per GLB material
(found by measuring which parts use each one; see the notes beside each entry).
"""
import argparse, json, math, os, re, sys
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
V2 = os.path.dirname(os.path.dirname(HERE))
ap = argparse.ArgumentParser()
ap.add_argument('--glb', default=os.path.join(HERE, '.cache', 'board.glb'))
ap.add_argument('--out', default=os.path.join(V2, 'docs', 'renders', 'blender'))
ap.add_argument('--shots', default='all')
ap.add_argument('--pct', type=int, default=100)
ap.add_argument('--samples', type=int, default=384)
ap.add_argument('--save-blend', action='store_true')
ap.add_argument('--parts', action='store_true', help='write <shot>_parts.json: each part\'s box in image pixels')
ap.add_argument('--no-render', action='store_true', help='with --parts: only write the part maps')
ap.add_argument('--exposure', type=float, default=0.15)
ap.add_argument('--light', type=float, default=1.0, help='multiplier on all softbox energies')
A = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
SCALE = 10.0          # work at 10x size: 68 mm board = 0.68 m (healthier light and DOF numbers)

# ----------------------------------------------------------------------------------------------- materials
# linear RGB. Notes say what KiCad uses each GLB material for on this board.
TIN = dict(base=(0.78, 0.78, 0.76), metal=1, rough=0.30)
GOLD = dict(base=(1.00, 0.77, 0.34), metal=1, rough=0.20)
ENIG = dict(base=(0.95, 0.73, 0.38), metal=1, rough=0.30)
STEEL = dict(base=(0.80, 0.80, 0.80), metal=1, rough=0.30)
SHIELD = dict(base=(0.62, 0.62, 0.63), metal=1, rough=0.38)        # nickel-silver can, satin
CHROME = dict(base=(0.86, 0.86, 0.86), metal=1, rough=0.16)
COPPER = dict(base=(0.95, 0.62, 0.50), metal=1, rough=0.30)
BLACK = dict(base=(0.020, 0.020, 0.020), metal=0, rough=0.42)
EPOXY = dict(base=(0.025, 0.025, 0.027), metal=0, rough=0.55)
MARK = dict(base=(0.45, 0.43, 0.38), metal=0, rough=0.60)
WHITE = dict(base=(0.82, 0.82, 0.80), metal=0, rough=0.40)
CERAMIC = dict(base=(0.80, 0.79, 0.74), metal=0, rough=0.50)
MLCC = dict(base=(0.30, 0.19, 0.10), metal=0, rough=0.50)
FERRITE = dict(base=(0.045, 0.045, 0.048), metal=0, rough=0.65)
NYLON = dict(base=(0.83, 0.77, 0.64), metal=0, rough=0.45)          # JST SH housings (natural)
XT30 = dict(base=(0.955, 0.485, 0.005), metal=0, rough=0.40)        # AMASS yellow
MODPCB = dict(base=(0.018, 0.024, 0.030), metal=0, rough=0.35, coat=0.4)
SILK = dict(base=(0.86, 0.86, 0.84), metal=0, rough=0.55)
MASK = dict(base=(0.009, 0.107, 0.027), metal=0, rough=0.36, coat=0.35, coat_rough=0.14, alpha=0.86)
LEDDIE = dict(base=(0.10, 0.60, 0.15), metal=0, rough=0.30)
MATERIALS = {
    'mat_0': TIN,      # MLCC / resistor / QFN terminations, inductor pads
    'mat_1': MLCC,     # ceramic capacitor bodies
    'mat_2': CERAMIC,  # resistor and fuse bodies, 0603 LED bodies
    'mat_3': EPOXY,    # resistor top coat, fuse top
    'mat_4': BLACK,    # SOT-23 / SOD bodies, 1x14 sockets
    'mat_5': GOLD,     # socket contacts
    'mat_6': BLACK,    # pin-header plastic, QFN/VSON bodies
    'mat_7': MARK,     # pin-1 dots
    'mat_8': TIN,      # leads, JST pins, inductor terminals
    'mat_9': MARK,     # SOT-23 / SOD pin-1 and cathode marks
    'mat_10': GOLD,    # header pins, ESP32 castellations, LED terminals
    'mat_11': LEDDIE,  # LED dies
    'mat_12': STEEL,   # tact-switch top plates
    'mat_13': FERRITE, # L101 body
    'mat_14': COPPER,  # L101 winding
    'mat_15': BLACK, 'mat_16': BLACK, 'mat_17': WHITE,   # buzzer, WS2812 body, slide-switch lever
    'mat_18': NYLON,   # JST SH housings
    'mat_19': BLACK, 'mat_20': CHROME, 'mat_21': GOLD, 'mat_22': BLACK, 'mat_23': BLACK,   # USB-C
    'mat_24': FERRITE, # L102 body
    'mat_25': TIN, 'mat_26': EPOXY, 'mat_27': MARK,      # SMF5.0A TVS
    'mat_28': MODPCB,  # ESP32 module PCB and antenna
    'mat_29': SHIELD,  # ESP32 shield can
    'mat_30': STEEL,   # slide-switch frame
    'mat_31': LEDDIE, 'mat_32': TIN,                     # WS2812
    'mat_33': GOLD, 'mat_34': XT30, 'mat_35': BLACK,     # XT30: contacts, housing, marking
    'mat_36': COPPER,  # copper and vias (under the mask)
    'mat_37': ENIG,    # exposed pads
    'mat_38': SILK, 'mat_39': SILK,
    'mat_40': MASK, 'mat_41': MASK,
}


def principled(m):
    if not m.node_tree:
        m.use_nodes = True
    return next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)


def unlink_inputs(m, p):
    for s in p.inputs:          # drop any texture or vertex-colour links from the import
        for l in list(s.links):
            m.node_tree.links.remove(l)


def apply(m, d):
    p = principled(m)
    if p is None:
        return
    unlink_inputs(m, p)
    p.inputs['Base Color'].default_value = (*d['base'], 1.0)
    p.inputs['Metallic'].default_value = float(d['metal'])
    p.inputs['Roughness'].default_value = d['rough']
    p.inputs['Alpha'].default_value = d.get('alpha', 1.0)
    p.inputs['Coat Weight'].default_value = d.get('coat', 0.0)
    p.inputs['Coat Roughness'].default_value = d.get('coat_rough', 0.05)
    p.inputs['Emission Strength'].default_value = 0.0


def fr4(m):
    """Board substrate: tan FR-4 on the cut edges and hole walls, dark under the mask on the faces."""
    p = principled(m)
    nt = m.node_tree
    unlink_inputs(m, p)
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ab = nt.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'
    gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.7
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (0.36, 0.29, 0.15, 1)     # edge: FR-4 glass weave, tan
    mix.inputs['B'].default_value = (0.012, 0.040, 0.016, 1)  # face, seen through the mask
    L = nt.links.new
    L(geo.outputs['Normal'], sep.inputs[0]); L(sep.outputs['Z'], ab.inputs[0]); L(ab.outputs[0], gt.inputs[0])
    L(gt.outputs[0], mix.inputs['Factor']); L(mix.outputs['Result'], p.inputs['Base Color'])
    p.inputs['Metallic'].default_value = 0.0
    p.inputs['Roughness'].default_value = 0.6
    p.inputs['Alpha'].default_value = 1.0


# ----------------------------------------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    return (Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
            Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))))


def load_board(sc):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=A.glb)
    objs = [o for o in bpy.data.objects if o not in before]
    for m in bpy.data.materials:
        if m.name in MATERIALS:
            apply(m, MATERIALS[m.name])
        elif m.name == 'mat_42':
            fr4(m)
    mn, mx = world_bbox(objs)
    root = bpy.data.objects.new('Board', None); sc.collection.objects.link(root)
    root.location = ((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, 0)
    bpy.context.view_layer.update()
    for o in objs:
        if o.parent is None:
            o.parent = root; o.matrix_parent_inverse = root.matrix_world.inverted()
    root.location = (0, 0, 0); root.scale = (SCALE,) * 3
    bpy.context.view_layer.update()
    return root, objs


def esp32_label(root):
    """Laser marking on the ESP32 module's shield, as on the real part (KiCad's model has none)."""
    o = bpy.data.objects.get('U201')
    if o is None:
        return
    me = o.data; mw = o.matrix_world
    idx = [i for i, sl in enumerate(o.material_slots) if sl.material and sl.material.name == 'mat_29']
    pts = [mw @ me.vertices[v].co for p in me.polygons if p.material_index in idx for v in p.vertices]
    if not pts:
        return
    x0, x1 = min(p.x for p in pts), max(p.x for p in pts); y0, y1 = min(p.y for p in pts), max(p.y for p in pts)
    top = max(p.z for p in pts)
    w = x1 - x0
    mat = bpy.data.materials.new('LaserMark'); mat.use_nodes = True
    pb = principled(mat); pb.inputs['Base Color'].default_value = (0.10, 0.10, 0.105, 1)
    pb.inputs['Metallic'].default_value = 0.6; pb.inputs['Roughness'].default_value = 0.65
    for i, (txt, size, dy) in enumerate((('ESP32-S3-WROOM-1', 0.085, 0.10), ('N8R2', 0.07, -0.06))):
        cu = bpy.data.curves.new(f'Label{i}', 'FONT'); cu.body = txt; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
        cu.size = size * w; cu.materials.append(mat)
        ob = bpy.data.objects.new(f'ESP32Label{i}', cu); bpy.context.scene.collection.objects.link(ob)
        ob.location = ((x0 + x1) / 2, (y0 + y1) / 2 + dy * (y1 - y0), top + 0.0004)
        bpy.context.view_layer.update()
        ob.parent = root; ob.matrix_parent_inverse = root.matrix_world.inverted()


def rest_on_floor(root, objs, flip=False):
    """Rotate (flip = underside up) and drop the board so its lowest point touches z = 0."""
    root.rotation_euler = (0, math.pi if flip else 0, 0)
    root.location = (0, 0, 0)
    bpy.context.view_layer.update()
    mn, mx = world_bbox(objs)
    root.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)
    bpy.context.view_layer.update()
    return world_bbox(objs)


def part_center(ref):
    o = bpy.data.objects.get(ref)
    obs = [o] + [c for c in o.children_recursive if c.type == 'MESH']
    pts = [x.matrix_world @ Vector(c) for x in obs if x.type == 'MESH' for c in x.bound_box]
    return Vector((sum(p.x for p in pts) / len(pts), sum(p.y for p in pts) / len(pts), max(p.z for p in pts)))


def area(sc, name, loc, size, energy, color=(1, 1, 1), size_y=None, target=(0, 0, 0), shadow=True):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy * A.light; ld.color = color
    ld.use_shadow = shadow
    if size_y:
        ld.shape = 'RECTANGLE'; ld.size = size; ld.size_y = size_y
    else:
        ld.shape = 'DISK'; ld.size = size
    ob = bpy.data.objects.new(name, ld); sc.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


def world(sc, strength=0.2, rot_z=30):
    w = bpy.data.worlds.new('World'); sc.world = w
    nt = w.node_tree
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(os.path.join(bpy.utils.system_resource('DATAFILES'), 'studiolights', 'world', 'studio.exr'))
    mp = nt.nodes.new('ShaderNodeMapping'); tc = nt.nodes.new('ShaderNodeTexCoord')
    mp.inputs['Rotation'].default_value[2] = math.radians(rot_z)
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
    bg = nt.nodes['Background']; bg.inputs['Strength'].default_value = strength
    nt.links.new(env.outputs['Color'], bg.inputs['Color'])


def lights(sc, az=0.0):
    """Product-shot softboxes, placed relative to the camera's azimuth so every shot is lit the same way:
    big warm key to the camera's left, cool fill to its right, rim strip high behind the board (high enough
    that its reflection in the glossy mask doesn't wash the board out), soft top light."""
    a = math.radians(az)
    def rot(x, y, z):
        return (x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a), z)
    area(sc, 'Key', rot(-2.5, -0.9, 1.9), 1.6, 80, (1.0, 0.97, 0.93), size_y=1.2)
    area(sc, 'Fill', rot(2.2, -0.8, 1.4), 1.6, 24, (0.93, 0.96, 1.0), shadow=False)
    area(sc, 'Rim', rot(0.3, 1.6, 2.6), 2.4, 58, (1.0, 0.96, 0.9), size_y=0.35, shadow=False)
    area(sc, 'Top', (0.0, 0.0, 3.2), 2.6, 26, (1.0, 1.0, 1.0))


def floor(sc):
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    fl = bpy.context.active_object; fl.name = 'ShadowCatcher'
    fl.is_shadow_catcher = True
    return fl


def cycles(sc, samples, pct, w, h):
    sc.render.engine = 'CYCLES'
    try:
        pr = bpy.context.preferences.addons['cycles'].preferences
        pr.compute_device_type = 'METAL'; pr.get_devices()
        for d in pr.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception as e:
        print('GPU setup failed, CPU render:', e)
    c = sc.cycles
    c.samples = samples; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.01
    c.use_denoising = True
    try:
        c.denoiser = 'OPENIMAGEDENOISE'
    except Exception:
        pass
    c.max_bounces = 12; c.glossy_bounces = 6; c.transparent_max_bounces = 16; c.caustics_reflective = False
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, pct
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.exposure = A.exposure
    for lk in ('AgX - Medium High Contrast', 'Medium High Contrast'):
        try:
            sc.view_settings.look = lk; break
        except TypeError:
            pass


def camera(sc, look_at, az, el, dist, lens=70, fstop=None, ortho=None):
    cd = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cd); sc.collection.objects.link(cam); sc.camera = cam
    cd.sensor_width = 36; cd.clip_start = 0.01; cd.clip_end = 100
    a, e = math.radians(az), math.radians(el)
    look = Vector(look_at)
    cam.location = look + Vector((dist * math.cos(e) * math.sin(a), -dist * math.cos(e) * math.cos(a), dist * math.sin(e)))
    cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
    if ortho:
        cd.type = 'ORTHO'; cd.ortho_scale = ortho
    else:
        cd.lens = lens
    if fstop:
        cd.dof.use_dof = True; cd.dof.aperture_fstop = fstop; cd.dof.focus_distance = (look - cam.location).length
    return cam


# Board front (USB-C, XT30, sensor headers) faces -Y. az = camera azimuth around the board, el = elevation.
SHOTS = {
    'hero_front': dict(flip=False, az=-28, el=31, dist=1.95, lens=70, fstop=11, look=(0, -0.01, 0.03), res=(3600, 2400)),
    'hero_rear': dict(flip=False, az=152, el=33, dist=1.95, lens=70, fstop=11, look=(0, 0.0, 0.03), res=(3600, 2400)),
    'edge_low': dict(flip=False, az=-14, el=11, dist=1.85, lens=85, fstop=8, look=(0, -0.16, 0.05), res=(3600, 2400)),
    'macro_esp32': dict(flip=False, az=-35, el=38, dist=1.3, lens=100, fstop=5.6, look='U201', res=(3600, 2400)),
    'top': dict(flip=False, ortho=0.80, res=(3200, 2880)),
    'bottom': dict(flip=True, ortho=0.80, res=(3200, 2880)),
}


def part_map(sc, name, flip):
    """Pixel box of every part (by reference designator) and of the board outline, at 100 % resolution."""
    bpy.context.view_layer.update()   # the camera was just placed: refresh its matrix before projecting
    W, H = sc.render.resolution_x, sc.render.resolution_y
    cam = sc.camera
    def box(obs):
        pts = [o.matrix_world @ Vector(c) for o in obs if o.type == 'MESH' for c in o.bound_box]
        if not pts:
            return None
        uv = [world_to_camera_view(sc, cam, p) for p in pts]
        xs = [u.x * W for u in uv]; ys = [(1 - u.y) * H for u in uv]
        zmax = max(p.z for p in pts)
        return dict(x0=round(min(xs)), y0=round(min(ys)), x1=round(max(xs)), y1=round(max(ys)),
                    cx=round((min(xs) + max(xs)) / 2), cy=round((min(ys) + max(ys)) / 2), top_z=zmax)
    parts = {}
    for o in bpy.data.objects:
        if re.fullmatch(r'[A-Z]{1,3}\d{2,4}', o.name):
            b = box([o] + list(o.children_recursive))
            if b:
                parts[o.name] = b
    pcb = [o for o in bpy.data.objects if o.type == 'MESH' and o.data and o.data.name.startswith('RoboCore_V2_PCB')]
    board = box(pcb)
    board_top = board['top_z'] if board else 0
    for b in parts.values():          # parts on the far side of the board are hidden in that view
        z = b.pop('top_z')
        b['visible'] = (not flip) and z > board_top - 0.001
        b['in_frame'] = b['x1'] > 0 and b['y1'] > 0 and b['x0'] < W and b['y0'] < H
    if board:
        board.pop('top_z')
    info = dict(shot=name, width=W, height=H, board=board, parts=dict(sorted(parts.items())),
                note='Pixel boxes at full resolution; origin top-left. Parts are all on the top side, so the bottom view marks them visible=false.')
    if sc.camera.data.type == 'ORTHO':
        info['px_per_mm'] = round(W / (sc.camera.data.ortho_scale * 1000 / SCALE), 3)
    with open(os.path.join(A.out, f'{name}_parts.json'), 'w') as f:
        json.dump(info, f, indent=1)
    print('wrote parts map', name, len(parts))


def render_shot(name, s):
    sc = reset()
    root, objs = load_board(sc)
    esp32_label(root)
    mn, mx = rest_on_floor(root, objs, flip=s['flip'])
    world(sc); lights(sc, s.get('az', 0.0))
    if not s.get('ortho'):
        floor(sc)
    w, h = s['res']
    cycles(sc, A.samples, A.pct, w, h)
    if s.get('ortho'):
        cam = camera(sc, ((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, 0), 0, 90, mx.z + 1.0, ortho=s['ortho'])
        cam.rotation_euler = (0, 0, 0)
    else:
        look = part_center(s['look']) if isinstance(s['look'], str) else Vector(s['look'])
        camera(sc, look, s['az'], s['el'], s['dist'], lens=s['lens'], fstop=s.get('fstop'))
    os.makedirs(A.out, exist_ok=True)
    if A.parts:
        part_map(sc, name, s['flip'])
    if A.no_render:
        return
    sc.render.filepath = os.path.join(A.out, f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print('wrote', sc.render.filepath)
    if A.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(A.out, f'{name}.blend'))


for n in (list(SHOTS) if A.shots == 'all' else A.shots.split(',')):
    render_shot(n, SHOTS[n])
