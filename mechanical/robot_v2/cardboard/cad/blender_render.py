"""Headless Blender render of the folded cardboard chassis (glTF with its texture).
    /Applications/Blender.app/Contents/MacOS/Blender -b --python cad/blender_render.py -- <out.png> [rear|front|top]
"""
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = argv[0] if argv else os.path.join(os.path.dirname(__file__), 'render_test.png')
view = argv[1] if len(argv) > 1 else 'rear'     # rear | front | top
here = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(here, 'cardboard_chassis.glb'))
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
# glTF is in metres by convention: our file is in mm, so scale 0.001 and keep Z up (importer already converts Y-up)
for o in objs:
    o.scale = (0.001, 0.001, 0.001)
bpy.context.view_layer.update()
# ground plane
bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0))
ground = bpy.context.object
gm = bpy.data.materials.new('ground'); gm.use_nodes = True
gm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.92, 0.92, 0.92, 1)
gm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
ground.data.materials.append(gm)
# frame the model
pts = []
for o in objs:
    for v in o.bound_box:
        pts.append(o.matrix_world @ Vector(v))
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2; size = (hi - lo).length
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 50
cam = bpy.data.objects.new('cam', cam_data); bpy.context.scene.collection.objects.link(cam)
offsets = {'rear': (0.95, -1.15, 0.75), 'front': (-1.0, 1.15, 0.7), 'top': (0.35, -0.6, 1.5)}
cam.location = c + Vector(offsets.get(view, offsets['rear'])) * size * 0.95
direction = c - cam.location
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam
# lights: sun + big soft area
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 2.2; sun.angle = math.radians(8)
so = bpy.data.objects.new('sun', sun); bpy.context.scene.collection.objects.link(so)
so.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
area = bpy.data.lights.new('fill', 'AREA'); area.energy = 25; area.size = 1.0
ao = bpy.data.objects.new('fill', area); bpy.context.scene.collection.objects.link(ao)
ao.location = c + Vector((-0.6, -0.4, 0.8)); ao.rotation_euler = (c - ao.location).to_track_quat('-Z', 'Y').to_euler()
world = bpy.data.worlds.new('w'); bpy.context.scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.85, 0.87, 0.9, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = 1400, 900
try:
    sc.view_settings.view_transform = 'Standard'
except Exception:
    pass
sc.render.filepath = out
engines = [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engines else ('BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'CYCLES')
if sc.render.engine == 'CYCLES':
    sc.cycles.samples = 64
bpy.ops.render.render(write_still=True)
print('rendered', out, 'engine', sc.render.engine, 'objects', [o.name for o in objs])
