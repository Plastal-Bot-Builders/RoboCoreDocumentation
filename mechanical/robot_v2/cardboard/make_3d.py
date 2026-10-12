#!/usr/bin/env python3
"""RoboCore V2 cardboard chassis: DXF of the dieline and a textured 3D model of the folded chassis.

Reads net.json (from make_net.py) and branded_net.pdf (from make_branded.py). Writes to cad/:
  cardboard_net.dxf            1:1 mm dieline, layers CUT and FOLD (import into Fusion 360 as a sketch, or send to a cutter)
  cardboard_chassis.obj/.mtl   folded chassis, 3 mm card, outside faces UV-mapped to the printed artwork (texture PNG)
  cardboard_chassis.glb        the same as one glTF binary (File > Import > glTF in Blender; textures travel inside)
  cardboard_chassis_texture.png  the artwork, 8 px/mm
  cardboard_chassis_flat.obj   the unfolded sheet, same texture (for an "unboxing" shot or to check the UVs)
Units: mm. Robot frame: X right, Y forward, Z up, origin on the floor under the axle (same as the Fusion model).
    python3 make_3d.py
"""
import os, json, math
import numpy as np
import pymupdf as fitz
import ezdxf
import trimesh
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'cad')
os.makedirs(OUT, exist_ok=True)
NET = json.load(open(os.path.join(HERE, 'net.json')))
X0, Y0, X1, Y1 = NET['net']            # 0 0 200 403
SH = NET['shapes']
T = 3.0                                 # card thickness
PPM = 8                                 # texture pixels per mm

# ----------------------------------------------------------------------------- panels (net mm) and their fold placement
PANELS = {
    'flap': [(40.5, 0), (124, 0), (124, 6), (138, 6), (138, 0), (159.5, 0), (159.5, 41), (40.5, 41)],
    'deck': [(37.5, 41), (162.5, 41), (162.5, 191), (37.5, 191)],
    'rear wall': [(40.5, 191), (159.5, 191), (159.5, 229), (40.5, 229)],
    'floor': [(40.5, 229), (159.5, 229), (159.5, 373), (40.5, 373), (135, 373), (135, 395), (127, 403), (73, 403), (65, 395), (65, 373)],
    'left wall': [(2.5, 229), (40.5, 229), (40.5, 373), (2.5, 373)],
    'right wall': [(159.5, 229), (197.5, 229), (197.5, 373), (159.5, 373)],
    'glue tab L': [(28.5, 196), (40.5, 191), (40.5, 229), (28.5, 224)],
    'glue tab R': [(171.5, 196), (159.5, 191), (159.5, 229), (171.5, 224)],
    'flap tab L': [(28.5, 8), (40.5, 2), (40.5, 41), (28.5, 41)],
    'flap tab R': [(171.5, 8), (159.5, 2), (159.5, 41), (171.5, 41)],
}
# fix the floor polygon: the nose shelf is part of it (drawn as one polygon above: go round the shelf)
PANELS['floor'] = [(40.5, 229), (159.5, 229), (159.5, 373), (135, 373), (135, 395), (127, 403), (73, 403), (65, 395), (65, 373), (40.5, 373)]


def place(name):
    """Inside-face mapping net (X, Y) -> robot (x, y, z), and the outward unit normal."""
    if name == 'floor':
        return (lambda X, Y: (X - 100, Y - 311, 14.0)), (0, 0, -1)
    if name == 'deck':
        return (lambda X, Y: (X - 100, 106 - Y, 52.0)), (0, 0, 1)
    if name == 'left wall':
        return (lambda X, Y: (-59.5, Y - 311, 54.5 - X)), (-1, 0, 0)
    if name == 'right wall':
        return (lambda X, Y: (59.5, Y - 311, X - 145.5)), (1, 0, 0)
    if name == 'rear wall':
        return (lambda X, Y: (X - 100, -82.0, 243 - Y)), (0, -1, 0)
    if name == 'flap':
        return (lambda X, Y: (X - 100, 62.0, 14 + Y)), (0, 1, 0)
    if name == 'glue tab L':   # folded inside the left wall, against its inner face
        return (lambda X, Y: (-59.5 + T + (40.5 - X), -82 + T + 0.01, 243 - Y)), (-1, 0, 0)
    if name == 'glue tab R':
        return (lambda X, Y: (59.5 - T - (X - 159.5), -82 + T + 0.01, 243 - Y)), (1, 0, 0)
    if name == 'flap tab L':   # folded back along the outside of the left wall
        return (lambda X, Y: (-62.5 - 0.01, 62 - (40.5 - X), 14 + Y)), (-1, 0, 0)
    if name == 'flap tab R':
        return (lambda X, Y: (62.5 + 0.01, 62 - (X - 159.5), 14 + Y)), (1, 0, 0)
    raise KeyError(name)


def cut_shapes():
    """The holes as shapely geometries in net mm (everything in CUT except the outline)."""
    holes = []
    for s in SH['cut']:
        if s['name'] == 'outline':
            continue
        if 'circle' in s:
            x, y, d = s['circle']
            holes.append(Point(x, y).buffer(d / 2, resolution=24))
        else:
            holes.append(Polygon([tuple(p) for p in s['pts']]))
    return holes


def panel_polygon(name):
    poly = Polygon(PANELS[name])
    inner = [h for h in cut_shapes() if poly.contains(h.representative_point())]
    if inner:
        poly = poly.difference(unary_union(inner))
    return poly


# ----------------------------------------------------------------------------- mesh building
def slab(name, flat=False):
    """Extrude a panel into a 3 mm slab in its folded place (or flat in the net plane). Returns a trimesh with UVs."""
    poly = panel_polygon(name)
    if flat:
        fn, n = (lambda X, Y: (X, -Y, 0.0)), (0, 0, 1)
    else:
        fn, n = place(name)
    n = np.array(n, float)
    polys = list(poly.geoms) if poly.geom_type == 'MultiPolygon' else [poly]
    verts, faces, uvs, mats = [], [], [], []

    def add(p3, uv):
        verts.append(p3)
        uvs.append(uv)
        return len(verts) - 1

    for pg in polys:
        v2, f2 = trimesh.creation.triangulate_polygon(pg, engine='earcut')
        # outside (printed) face
        base_o = len(verts)
        for (X, Y) in v2:
            add(np.array(fn(X, Y)) + n * T, (X / (X1 - X0), 1 - Y / (Y1 - Y0)))
        for tri in f2:
            a, b, c = [verts[base_o + i] for i in tri]
            if np.dot(np.cross(b - a, c - a), n) < 0:
                tri = tri[::-1]
            faces.append([base_o + i for i in tri]); mats.append(0)
        # inside face (card colour)
        base_i = len(verts)
        for (X, Y) in v2:
            add(np.array(fn(X, Y)), (0.02, 0.02))
        for tri in f2:
            a, b, c = [verts[base_i + i] for i in tri]
            if np.dot(np.cross(b - a, c - a), -n) < 0:
                tri = tri[::-1]
            faces.append([base_i + i for i in tri]); mats.append(1)
        # edges (card colour), round the exterior and each hole
        rings = [pg.exterior] + list(pg.interiors)
        for ring in rings:
            pts = list(ring.coords)[:-1]
            for i in range(len(pts)):
                (Xa, Ya), (Xb, Yb) = pts[i], pts[(i + 1) % len(pts)]
                pa, pb = np.array(fn(Xa, Ya)), np.array(fn(Xb, Yb))
                i0 = add(pa, (0.02, 0.02)); i1 = add(pb, (0.02, 0.02))
                i2 = add(pb + n * T, (0.02, 0.02)); i3 = add(pa + n * T, (0.02, 0.02))
                # outward direction of this edge: perpendicular in the panel plane pointing away from the polygon
                mid = (pa + pb) / 2
                e = pb - pa
                side = np.cross(n, e)
                mid2 = ((Xa + Xb) / 2, (Ya + Yb) / 2)
                probe = (mid2[0] + (Yb - Ya) * 0.01, mid2[1] - (Xb - Xa) * 0.01)
                outward = not pg.contains(Point(probe))
                dir2 = np.array(fn(*probe)) - mid
                if np.dot(dir2, side) < 0:
                    side = -side
                if not outward:
                    side = -side
                tri1, tri2 = [i0, i1, i2], [i0, i2, i3]
                if np.dot(np.cross(verts[i1] - verts[i0], verts[i2] - verts[i0]), side) < 0:
                    tri1, tri2 = tri1[::-1], tri2[::-1]
                faces += [tri1, tri2]; mats += [1, 1]
    m = trimesh.Trimesh(np.array(verts), np.array(faces), process=False)
    m.visual = trimesh.visual.TextureVisuals(uv=np.array(uvs))
    m.metadata['mats'] = np.array(mats)
    m.metadata['name'] = name
    return m


def wheels():
    """Two simple wheels (56 x 10) so the render reads as a robot; grey."""
    parts = []
    for sx in (-1, 1):
        w = trimesh.creation.cylinder(radius=28, height=10, sections=64)
        w.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, (0, 1, 0)))
        w.apply_translation((sx * 67.4, 0, 28))
        parts.append(w)
    m = trimesh.util.concatenate(parts)
    m.visual = trimesh.visual.ColorVisuals(m, face_colors=[60, 60, 64, 255])
    return m


def texture():
    """Render the branded artwork (without the dieline marks) from the PDF, net area only, PPM px per mm."""
    pdf = os.path.join(HERE, 'branded_net.pdf')
    doc = fitz.open(pdf)
    pg = doc[0]
    k = 72 / 25.4
    ox, oy = (297 - (X1 - X0)) / 2 - X0, 6             # same placement as make_branded.build()
    clip = fitz.Rect((X0 + ox) * k, (Y0 + oy) * k, (X1 + ox) * k, (Y1 + oy) * k)
    pix = pg.get_pixmap(dpi=int(round(PPM * 25.4)), clip=clip)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    path = os.path.join(OUT, 'cardboard_chassis_texture.png')
    im.save(path)
    return path, im


def write_obj(meshes, path, texpath):
    """OBJ + MTL with two materials: print (textured) and card."""
    mtl = os.path.splitext(path)[0] + '.mtl'
    with open(mtl, 'w') as f:
        f.write('newmtl print\nKa 1 1 1\nKd 1 1 1\nKs 0.05 0.05 0.05\nNs 10\nmap_Kd %s\n\n' % os.path.basename(texpath))
        f.write('newmtl card\nKa 0.6 0.5 0.35\nKd 0.72 0.60 0.42\nKs 0.02 0.02 0.02\nNs 5\n\n')
        f.write('newmtl rubber\nKd 0.18 0.18 0.19\nKs 0.1 0.1 0.1\nNs 20\n')
    with open(path, 'w') as f:
        f.write('mtllib %s\n' % os.path.basename(mtl))
        off = 1
        for m in meshes:
            name = m.metadata.get('name', 'part')
            f.write('o %s\n' % name.replace(' ', '_'))
            for v in m.vertices:
                f.write('v %.4f %.4f %.4f\n' % tuple(v))
            uv = m.visual.uv if hasattr(m.visual, 'uv') and m.visual.uv is not None else np.zeros((len(m.vertices), 2))
            for t in uv:
                f.write('vt %.5f %.5f\n' % tuple(t))
            mats = m.metadata.get('mats', np.full(len(m.faces), 2))
            cur = None
            for face, mat in zip(m.faces, mats):
                mname = ['print', 'card', 'rubber'][int(mat)]
                if mname != cur:
                    f.write('usemtl %s\n' % mname)
                    cur = mname
                f.write('f %d/%d %d/%d %d/%d\n' % (face[0] + off, face[0] + off, face[1] + off, face[1] + off, face[2] + off, face[2] + off))
            off += len(m.vertices)


def write_glb(meshes, path, tex_im):
    """glTF binary: one node per panel and material. glTF is Y-up, so the robot frame (Z-up) is rotated
    (x, y, z) -> (x, z, -y) on the way out; Blender's importer turns it back into Z-up."""
    scene = trimesh.Scene()
    mat_print = trimesh.visual.material.PBRMaterial(baseColorTexture=tex_im, metallicFactor=0.0, roughnessFactor=0.85, name='print')
    mat_card = trimesh.visual.material.PBRMaterial(baseColorFactor=[184, 153, 107, 255], metallicFactor=0.0, roughnessFactor=0.95, name='card')
    mat_rubber = trimesh.visual.material.PBRMaterial(baseColorFactor=[46, 46, 48, 255], metallicFactor=0.0, roughnessFactor=0.7, name='rubber')
    yup = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]], float)
    for m in meshes:
        mats = m.metadata.get('mats', np.full(len(m.faces), 2))
        uv_all = m.visual.uv if hasattr(m.visual, 'uv') and m.visual.uv is not None else np.zeros((len(m.vertices), 2))
        for mi, mat in ((0, mat_print), (1, mat_card), (2, mat_rubber)):
            sel = np.where(mats == mi)[0]
            if not len(sel):
                continue
            faces = m.faces[sel]
            idx = np.unique(faces)
            remap = np.full(len(m.vertices), -1); remap[idx] = np.arange(len(idx))
            sub = trimesh.Trimesh(m.vertices[idx], remap[faces], process=False)
            sub.visual = trimesh.visual.TextureVisuals(uv=uv_all[idx], material=mat)
            sub.apply_transform(yup)
            scene.add_geometry(sub, node_name='%s %s' % (m.metadata.get('name', 'part'), mat.name))
    scene.export(path)


def dxf():
    doc = ezdxf.new('R2010', setup=True)
    doc.header['$INSUNITS'] = 4          # millimetres
    doc.layers.add('CUT', color=1)       # red
    doc.layers.add('FOLD', color=5, linetype='DASHED')   # blue dashed
    msp = doc.modelspace()
    for s in SH['cut']:
        if 'circle' in s:
            x, y, d = s['circle']
            msp.add_circle((x, -y), d / 2, dxfattribs={'layer': 'CUT'})
        else:
            msp.add_lwpolyline([(p[0], -p[1]) for p in s['pts']], close=s['closed'], dxfattribs={'layer': 'CUT'})
    for s in SH['crease']:
        msp.add_lwpolyline([(p[0], -p[1]) for p in s['pts']], close=False, dxfattribs={'layer': 'FOLD'})
    path = os.path.join(OUT, 'cardboard_net.dxf')
    doc.saveas(path)
    return path


def build():
    print('dxf:', dxf())
    texpath, tex_im = texture()
    names = ['floor', 'deck', 'rear wall', 'flap', 'left wall', 'right wall', 'glue tab L', 'glue tab R', 'flap tab L', 'flap tab R']
    folded = [slab(n) for n in names]
    wh = wheels(); wh.metadata['name'] = 'wheels'; wh.metadata['mats'] = np.full(len(wh.faces), 2)
    write_obj(folded + [wh], os.path.join(OUT, 'cardboard_chassis.obj'), texpath)
    write_glb(folded + [wh], os.path.join(OUT, 'cardboard_chassis.glb'), tex_im)
    flat = [slab(n, flat=True) for n in names]
    write_obj(flat, os.path.join(OUT, 'cardboard_chassis_flat.obj'), texpath)
    allm = trimesh.util.concatenate(folded)
    print('folded chassis bounds (mm):', np.round(allm.bounds, 1).tolist(), 'faces', len(allm.faces))
    # preview renders (software, no Blender needed): three views of the folded model
    try:
        scene = trimesh.Scene(folded + [wh])
        for name, ang in (('iso', (0.9, 0.0, 0.6)), ('front', (0.0, 0.0, 0.0)), ('side', (0.0, 0.0, 1.57))):
            pass
    except Exception as e:
        print('preview skipped:', e)


if __name__ == '__main__':
    build()
