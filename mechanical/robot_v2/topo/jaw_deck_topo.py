"""Topology optimization of the gripper jaw (left, driven; the right one mirrors) and the arm's wrist deck:
flat plates, through-windows, loads out of plane as well as in plane. Writes jaw_deck_proposal.png + JSON."""
import sys, os, json, math, numpy as np, cv2
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fusion'))
import rc_params as P
import topo3d as T3
from arm_topo import clean_polygon

E_PETG, RHO = 2000.0, 1.27e-3


def poly_mask(poly, xs, ys):
    cnt = np.array(poly, np.float32).reshape(-1, 1, 2)
    xx, yy = np.meshgrid(xs, ys, indexing='ij')
    d = np.array([cv2.pointPolygonTest(cnt, (float(a), float(b)), True) for a, b in zip(xx.ravel(), yy.ravel())]).reshape(xx.shape)
    return d


def run_part(name, h, origin, size, outline_dist, holes, fixed_cols, loads, volfrac, weights, skin=1.6, min_member=1.6, min_void=3.0, log=print):
    nx, ny, nz = size
    grid = T3.Grid(nx, ny, nz, h, origin)
    xs = origin[0] + (np.arange(nx) + 0.5) * h; ys = origin[1] + (np.arange(ny) + 0.5) * h
    dist, solid_fixed_extra = outline_dist(xs, ys)
    in_part = dist > 0
    for (cx, cy, r) in holes:                       # holes are void columns
        xx, yy = np.meshgrid(xs, ys, indexing='ij'); in_part &= np.hypot(xx - cx, yy - cy) > r
    solid_fixed = in_part & ((dist < skin) | solid_fixed_extra(xs, ys))
    for (cx, cy, r) in holes:                       # a skin ring round each hole
        xx, yy = np.meshgrid(xs, ys, indexing='ij'); solid_fixed |= in_part & (np.hypot(xx - cx, yy - cy) < r + skin)
    design = in_part & ~solid_fixed
    # supports and loads on nodes
    X, Y, Z = grid.node_xyz()
    # a node counts only if one of its four columns is part of the plate (nodes on void columns float on emin stiffness)
    pad = np.zeros((nx + 2, ny + 2), bool); pad[1:-1, 1:-1] = in_part
    touch2d = pad[:-1, :-1] | pad[1:, :-1] | pad[:-1, 1:] | pad[1:, 1:]            # (nx+1, ny+1)
    touch = np.repeat(touch2d.ravel(), nz + 1)
    fixed = np.where(fixed_cols(X, Y, Z) & touch)[0]
    fixed = np.concatenate([3 * fixed, 3 * fixed + 1, 3 * fixed + 2])
    F = np.zeros((grid.ndof, len(loads)))
    for c, (sel, fvec, moment) in enumerate(loads):
        nodes = np.where(sel(X, Y, Z) & touch)[0]
        if len(nodes) == 0: raise RuntimeError('load %d hits no nodes' % c)
        for k in range(3): F[3 * nodes + k, c] += fvec[k] / len(nodes)
        if moment is not None:                      # couple about x: +z force growing with (y - yc)
            axis, M = moment; yc = Y[nodes].mean(); I = ((Y[nodes] - yc)**2).sum()
            F[3 * nodes + 2, c] += M * (Y[nodes] - yc) / I
        F[:, c] *= weights[c]
    log('%s: %d x %d x %d voxels (%.2f mm), %d design columns of %d, %d fixed dofs' % (name, nx, ny, nz, h, design.sum(), in_part.sum(), len(fixed)))
    full = in_part.astype(float)
    ex, ey = grid.col
    comp_full, _, U = grid.solve(full[ex, ey], F, fixed)
    xPhys = T3.optimize_plate(grid, in_part, solid_fixed, design, F, fixed, volfrac, [1.0] * len(loads), log=log)
    s = T3.cleanup2d(xPhys > 0.5, in_part, solid_fixed, min_member / h, min_void / h)
    comp_s, _, _ = grid.solve(s[ex, ey].astype(float), F, fixed)
    polys = [clean_polygon(p, notch_area=0.6, grid=0.25) for p in T3.void_polys(s, in_part, grid)]
    area_full, area_s = in_part.sum() * h * h, s.sum() * h * h
    log('  full part %.0f mm2, compliance %s; optimized %.0f mm2 (%+.0f %%), compliance %s, %d windows' % (
        area_full, ['%.4g' % c for c in comp_full], area_s, 100 * (area_s / area_full - 1), ['%.4g' % c for c in comp_s], len(polys)))
    return dict(name=name, h=h, area_full=area_full, area=area_s, comp_full=comp_full, comp=comp_s, polys=polys,
                xPhys=xPhys, solid=s, in_part=in_part, xs=xs, ys=ys, thickness=nz * h)


# ---------------------------------------------------------------- jaw (left, driven), arm frame, z 0..4 local
def jaw_outline():
    cy = P.JAW_PIVOT_Y; tip = cy + P.JAW_LEN; cx = -P.JAW_PITCH_R
    finger = [(-15.4, cy), (-15.4, cy + 16.0), (-14.6, cy + 21.5), (-12.6, cy + 26.5), (-9.6, cy + 30.8), (-6.0, tip),
              (-1.4, tip), (-0.8, tip - 0.8), (-2.2, tip - 2.2), (-0.8, tip - 3.6), (-2.2, tip - 5.0), (-0.8, tip - 6.4),
              (-2.4, tip - 8.0), (-9.2, cy + 17.9), (-9.2, cy + 7.9), (-4.5, cy + 5.4)]
    return finger, (cx, cy), tip


def jaw():
    finger, (cx, cy), tip = jaw_outline()
    h = 0.8
    def outline_dist(xs, ys):
        d = poly_mask(finger, xs, ys)
        xx, yy = np.meshgrid(xs, ys, indexing='ij')
        d = np.maximum(d, 6.5 - np.hypot(xx - cx, yy - cy))                     # hub circle r 6.5
        ux, uy = -math.sin(math.radians(P.GRIP_HORN_ANGLE)), math.cos(math.radians(P.GRIP_HORN_ANGLE))
        along = (xx - cx) * ux + (yy - cy) * uy; across = np.abs(-(xx - cx) * uy + (yy - cy) * ux)
        def extra(xs_, ys_):
            hub = np.hypot(xx - cx, yy - cy) < 9.5                                # hub, gear sector, horn hub
            horn = (along > 0) & (along < P.HORN[4] + 0.5 + 1.2) & (across < P.HORN[5] / 2 + 0.2 + 1.2)   # horn arm slot band
            teeth = (xx > -4.2) & (yy > tip - 8.8)                                # the toothed grip edge
            return hub | horn | teeth
        return d, extra
    size = (int(round(16.0 / h)), int(round(42.0 / h)), int(round(4.0 / h)))
    origin = (-16.0, cy - 7.0, 0.0)
    fixed_cols = lambda X, Y, Z: np.hypot(X - cx, Y - cy) <= 7.0
    teeth_sel = lambda X, Y, Z: (X > -2.6) & (Y > tip - 8.0) & (Y <= tip + 0.01)
    loads = [(teeth_sel, (2.0, 0.0, 0.0), None),            # grip force, toward the other jaw
             (teeth_sel, (0.0, 0.0, -0.5), None)]           # half the object's weight, out of plane
    return run_part('Jaw L', h, origin, size, outline_dist, [], fixed_cols, loads, 0.35, (1.0, 1.0), skin=1.4, min_void=2.5)


# ---------------------------------------------------------------- wrist deck (part of the Arm), arm frame, z -7..-4
def deck(vf=0.35):
    xl, xr = P.ARM_PLATE_X[1][0], P.ARM_PLATE_X[0][1]
    dy0, dy1 = P.ARM_DECK_Y
    h = 0.75
    yc = P.JAW_PIVOT_Y + P.SG90_SHAFT_X
    tower = (-P.JAW_PITCH_R, P.JAW_PIVOT_Y, 6.3); boss = (-P.JAW_PITCH_R, yc - P.SG90_SHAFT_X - 6.0, 3.2); pilot = (P.JAW_PITCH_R, P.JAW_PIVOT_Y, 1.3)
    lx, wy, hz = P.SG90_BODY
    px0, px1 = -P.JAW_PITCH_R - wy / 2, -P.JAW_PITCH_R + wy / 2
    posts = [sorted((yc + s * P.SG90_TAB[0], yc + s * P.SG90_TAB[1])) for s in (1, -1)]
    def outline_dist(xs, ys):
        xx, yy = np.meshgrid(xs, ys, indexing='ij')
        d = np.minimum.reduce([xx - xl, xr - xx, yy - dy0, dy1 - yy])
        for (cxr, cyr) in ((xl + 5, dy1 - 5), (xr - 5, dy1 - 5)):               # front corners r 5
            corner = (xx < cxr) & (yy > cyr) if cxr == xl + 5 else (xx > cxr) & (yy > cyr)
            d = np.where(corner, 5.0 - np.hypot(xx - cxr, yy - cyr), d)
        def extra(xs_, ys_):
            post = (xx > px0) & (xx < px1) & (((yy > posts[0][0]) & (yy < posts[0][1])) | ((yy > posts[1][0]) & (yy < posts[1][1])))
            plates = ((xx >= P.ARM_PLATE_X[1][0] - 0.1) & (xx <= P.ARM_PLATE_X[1][1] + 0.1) | (xx >= P.ARM_PLATE_X[0][0] - 0.1) & (xx <= P.ARM_PLATE_X[0][1] + 0.1)) & (yy < 64.0)
            return post | plates
        return d, extra
    size = (int(round((xr - xl) / h)), int(round((dy1 - dy0) / h)), int(round(3.0 / h)))
    origin = (xl, dy0, -7.0)
    fixed_cols = lambda X, Y, Z: (((X >= P.ARM_PLATE_X[1][0] - 0.01) & (X <= P.ARM_PLATE_X[1][1] + 0.01)) | ((X >= P.ARM_PLATE_X[0][0] - 0.01) & (X <= P.ARM_PLATE_X[0][1] + 0.01))) & (Y <= 64.01)
    ring = lambda c, r: (lambda X, Y, Z: (np.hypot(X - c[0], Y - c[1]) > r - 0.01) & (np.hypot(X - c[0], Y - c[1]) < r + 1.6) & (Z < -6.99))
    tower_sel, pilot_sel = ring(tower[:2], tower[2]), ring(pilot[:2], pilot[2])
    loads = [(tower_sel, (0.0, 0.0, -0.5), ('x', -0.5 * 30.0)),     # object weight via the driven jaw + its 30 mm lever
             (pilot_sel, (0.0, 0.0, -0.5), ('x', -0.5 * 30.0)),
             (tower_sel, (-2.0, 0.0, 0.0), None),                    # grip reaction, outward
             (pilot_sel, (2.0, 0.0, 0.0), None)]
    return run_part('Wrist deck %d %%' % round(100 * vf), h, origin, size, outline_dist, [tower, boss, pilot], fixed_cols, loads, vf, (1.0, 1.0, 0.5, 0.5))


def plot(results):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    from matplotlib.patches import Polygon as MPoly
    fig, axes = plt.subplots(len(results), 2, figsize=(11, 4.2 * len(results)))
    for row, r in zip(axes, results):
        ext = (r['xs'][0] - r['h'] / 2, r['xs'][-1] + r['h'] / 2, r['ys'][0] - r['h'] / 2, r['ys'][-1] + r['h'] / 2)
        row[0].imshow(r['xPhys'].T, origin='lower', cmap='gray_r', extent=ext, vmin=0, vmax=1); row[0].set_title('%s: optimized density' % r['name'], fontsize=10)
        row[1].imshow(r['solid'].T.astype(float), origin='lower', cmap='gray_r', extent=ext, vmin=0, vmax=1)
        for p in r['polys']:
            row[1].add_patch(MPoly(p, closed=True, fc='none', ec='#e0a000', lw=1.5))
        t = r['thickness']; m_full = r['area_full'] * t * RHO; m = r['area'] * t * RHO
        row[1].set_title('%s: %d windows, %.0f -> %.0f mm2 (%.2f -> %.2f g)' % (r['name'], len(r['polys']), r['area_full'], r['area'], m_full, m), fontsize=10)
        for ax in row: ax.set_aspect('equal'); ax.set_xlabel('x, mm'); ax.set_ylabel('y, mm')
    plt.tight_layout(); plt.savefig('jaw_deck_proposal.png', dpi=130); print('wrote jaw_deck_proposal.png')


if __name__ == '__main__':
    which = sys.argv[1:] or ['jaw', 'deck']
    results = []
    if 'jaw' in which: results.append(jaw())
    if 'deck' in which: results.append(deck(0.35)); results.append(deck(0.50))
    json.dump([{k: v for k, v in r.items() if k in ('name', 'h', 'area_full', 'area', 'comp_full', 'comp', 'polys', 'thickness')} for r in results], open('jaw_deck_result.json', 'w'), indent=1)
    plot(results)
