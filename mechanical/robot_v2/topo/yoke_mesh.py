"""Turn the optimized yoke voxels into a smooth web mesh (STL, mm, arm frame) and a preview image.
Surface = faces between web voxels and air (faces against the plates/deck are kept so the web overlaps them by one
voxel for a solid union). Laplacian smoothing rounds the stair-steps into an organic web."""
import sys, numpy as np, trimesh
d = np.load(sys.argv[2] if len(sys.argv) > 2 else 'yoke_voxels.npz')
solid, design, fixed = d['solid'], d['design'], d['solid_fixed']
xs, ys, zs = d['xs'], d['ys'], d['zs']
h = float(xs[1] - xs[0])
# grow the web one voxel into the fixed solid it touches, so the mesh overlaps the plates/deck
web = solid.copy()
nb = np.zeros_like(web)
for ax in range(3):
    for sh in (1, -1):
        nb |= np.roll(web, sh, axis=ax)
web |= nb & fixed
print('web voxels %d (+%d overlap into the plates/deck), %.2f cm3' % (solid.sum(), (web & ~solid).sum(), web.sum() * h**3 / 1000))
# unit-cube surface extraction
verts, faces = [], []
vid = {}
def v(i, j, k):
    key = (i, j, k)
    if key not in vid:
        vid[key] = len(verts); verts.append((xs[0] - h / 2 + i * h, ys[0] - h / 2 + j * h, zs[0] - h / 2 + k * h))
    return vid[key]
pad = np.pad(web, 1)
nx, ny, nz = web.shape
for i in range(nx):
    for j in range(ny):
        for k in range(nz):
            if not web[i, j, k]: continue
            # -x face
            if not pad[i, j + 1, k + 1]: faces.append((v(i, j, k), v(i, j, k + 1), v(i, j + 1, k + 1), v(i, j + 1, k)))
            if not pad[i + 2, j + 1, k + 1]: faces.append((v(i + 1, j, k), v(i + 1, j + 1, k), v(i + 1, j + 1, k + 1), v(i + 1, j, k + 1)))
            if not pad[i + 1, j, k + 1]: faces.append((v(i, j, k), v(i + 1, j, k), v(i + 1, j, k + 1), v(i, j, k + 1)))
            if not pad[i + 1, j + 2, k + 1]: faces.append((v(i, j + 1, k), v(i, j + 1, k + 1), v(i + 1, j + 1, k + 1), v(i + 1, j + 1, k)))
            if not pad[i + 1, j + 1, k]: faces.append((v(i, j, k), v(i, j + 1, k), v(i + 1, j + 1, k), v(i + 1, j, k)))
            if not pad[i + 1, j + 1, k + 2]: faces.append((v(i, j, k + 1), v(i + 1, j, k + 1), v(i + 1, j + 1, k + 1), v(i, j + 1, k + 1)))
tri = []
for (a, b, c, dd) in faces:
    tri.append((a, b, c)); tri.append((a, c, dd))
m = trimesh.Trimesh(np.array(verts), np.array(tri), process=True)
m.fix_normals()
print('raw mesh: %d faces, watertight %s' % (len(m.faces), m.is_watertight))
sm = m.copy()
trimesh.smoothing.filter_laplacian(sm, lamb=0.5, iterations=int(sys.argv[1]) if len(sys.argv) > 1 else 6, volume_constraint=True)
# the web stands on the bed: snap every vertex that smoothing lifted off the bottom layer back to z = bed
bed = float(zs[0] - h / 2)
vz = sm.vertices[:, 2]
lifted = vz < bed + 0.6 * h
sm.vertices[lifted, 2] = bed
sm.fix_normals()
print('snapped %d vertices to the bed at z %.1f' % (lifted.sum(), bed))
print('smoothed: %d faces, watertight %s, volume %.2f cm3' % (len(sm.faces), sm.is_watertight, sm.volume / 1000))
tag = sys.argv[3] if len(sys.argv) > 3 else ''; sm.export('yoke_web%s.stl' % tag); m.export('yoke_web_blocky%s.stl' % tag)
# preview: three views
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
fig = plt.figure(figsize=(12, 4.5))
for n, (elev, azim, title) in enumerate(((20, -60, 'iso'), (0, -90, 'from the side (-x)'), (90, -90, 'from above'))):
    ax = fig.add_subplot(1, 3, n + 1, projection='3d')
    ax.plot_trisurf(sm.vertices[:, 0], sm.vertices[:, 1], sm.vertices[:, 2], triangles=sm.faces, color='#f0b428', edgecolor='none', linewidth=0, antialiased=True, shade=True)
    # plates as thin wireframe boxes for context
    for (x0, x1) in ((-21, -18), (15.6, 18.6)):
        for z in (-7, 12): ax.plot([x0, x1, x1, x0, x0], [17, 17, 56, 56, 17], [z] * 5, color='#555', lw=0.6)
    ax.set_xlim(-22, 20); ax.set_ylim(15, 60); ax.set_zlim(-8, 16); ax.view_init(elev, azim); ax.set_title(title, fontsize=10); ax.set_box_aspect((42, 45, 24))
plt.tight_layout(); plt.savefig('yoke_preview%s.png' % tag, dpi=130); print('wrote yoke_web%s.stl, yoke_preview%s.png' % (tag, tag))
