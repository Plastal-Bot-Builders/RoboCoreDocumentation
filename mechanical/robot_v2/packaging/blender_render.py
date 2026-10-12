"""Headless Blender render of the RoboCore V2 mailer box (closed, or open with the insert tray).
    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender_render.py -- <out.png> [closed|open] [hero|front|top]
Imports out/box_closed.glb or out/box_open.glb (mm, converted to metres), adds a ground, lights and a camera.
To add the robot: import the Fusion export (File > Import > OBJ/FBX/STL from Fusion, or the print/*.stl parts) and place it
in the tray cavity: the robot pocket spans x 10.5..184.5, y 10.5..185.5 (from the front), z 1.5..41.5 mm (box origin = front-bottom-left outer corner).
"""
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = argv[0] if argv else 'render.png'
state = argv[1] if len(argv) > 1 else 'closed'
view = argv[2] if len(argv) > 2 else 'hero'
here = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(here, 'out', 'box_%s.glb' % state))
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in objs:
    o.scale = (0.001, 0.001, 0.001)
bpy.context.view_layer.update()
bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0, 0))
ground = bpy.context.object
gm = bpy.data.materials.new('ground'); gm.use_nodes = True
gm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.93, 0.93, 0.93, 1)
gm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
ground.data.materials.append(gm)
pts = [o.matrix_world @ Vector(v) for o in objs for v in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2; size = (hi - lo).length
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 55
cam = bpy.data.objects.new('cam', cam_data); bpy.context.scene.collection.objects.link(cam)
offsets = {'hero': (-0.9, -1.1, 0.55), 'front': (0.0, -1.6, 0.25), 'top': (-0.3, -0.7, 1.3), 'back': (0.9, 1.1, 0.5)}
if state == 'open' and view == 'hero':
    offsets['hero'] = (-0.35, -1.05, 1.05)      # higher, so the lid card shows above the dust flaps
cam.location = c + Vector(offsets.get(view, offsets['hero'])) * size * 0.95
cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 2.2; sun.angle = math.radians(8)
so = bpy.data.objects.new('sun', sun); bpy.context.scene.collection.objects.link(so)
so.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
area = bpy.data.lights.new('fill', 'AREA'); area.energy = 40; area.size = 1.5
ao = bpy.data.objects.new('fill', area); bpy.context.scene.collection.objects.link(ao)
ao.location = c + Vector((-0.8, -0.6, 0.9)); ao.rotation_euler = (c - ao.location).to_track_quat('-Z', 'Y').to_euler()
world = bpy.data.worlds.new('w'); bpy.context.scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.85, 0.87, 0.9, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = 1600, 1000
try:
    sc.view_settings.view_transform = 'Standard'
except Exception:
    pass
sc.render.filepath = out
engines = [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in engines else ('BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'CYCLES')
bpy.ops.render.render(write_still=True)
print('rendered', out, state, view)
