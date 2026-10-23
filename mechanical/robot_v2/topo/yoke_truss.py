"""Standing strut web between the arm plates: ground-structure truss optimization. The plates (with windows) and the
deck are voxels (topo3d.Grid), the candidate struts are bar elements between grid nodes. Only self-supporting
candidates exist: a bar must rise at >= 45 deg from a plate or deck anchor, or run along the ridge as a short bridge.
Strut areas are sized by an optimality-criteria update for minimum weighted compliance at a fixed material volume.
Output: yoke_struts.json (p1, p2, diameter in mm, arm frame), yoke_truss_preview.png."""
import sys, os, json, math, time, numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import splu
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fusion'))
import rc_params as P
import topo3d as T3
import yoke_topo as Y

H = Y.H
V_TARGET_CM3 = 1.0
D_MAX, D_MIN = 3.4, 2.0            # strut diameters, mm
BRIDGE = 18.0                      # mm, longest horizontal strut


def anchors(grid, in_part, solid_fixed):
    """Node ids for anchors on the plate inner faces, the ridge/mid columns and the deck top."""
    X, Yn, Z = grid.node_xyz()
    nxn, nyn, nzn = grid.nx + 1, grid.ny + 1, grid.nz + 1
    def nid(ix, iy, iz): return ix * nyn * nzn + iy * nzn + iz
    def node_touches_fixed(ix, iy, iz):
        for a in (ix - 1, ix):
            for b in (iy - 1, iy):
                for c in (iz - 1, iz):
                    if 0 <= a < grid.nx and 0 <= b < grid.ny and 0 <= c < grid.nz and solid_fixed[a, b, c]:
                        return True
        return False
    ys_i = [1, 5, 9, 13, 17, 21, 25]            # y = 18.5 .. 54.5
    zs_i = [0, 3, 6, 9, 12]                     # z = -7, -2.5, 2, 6.5, 11
    left_ix = int(round((P.ARM_PLATE_X[1][1] - Y.X0) / H))      # x = -18
    right_ix = int(round((P.ARM_PLATE_X[0][0] - Y.X0) / H))     # x = 15 (nearest node inside the right plate's face)
    plate = {'L': [], 'R': []}
    for side, ix in (('L', left_ix), ('R', right_ix)):
        for iy in ys_i:
            for iz in zs_i:
                if node_touches_fixed(ix, iy, iz):
                    plate[side].append(nid(ix, iy, iz))
    centre_ix = int(round(((P.ARM_PLATE_X[1][1] + P.ARM_PLATE_X[0][0]) / 2 - Y.X0) / H))   # x ~ -1.5
    midL_ix, midR_ix = (left_ix + centre_ix) // 2, (centre_ix + right_ix + 1) // 2
    ridge = [nid(centre_ix, iy, iz) for iy in ys_i for iz in (9, 12, 14)]
    mids = [nid(ix, iy, iz) for ix in (midL_ix, midR_ix) for iy in ys_i for iz in (6, 9, 12)]
    deck_iy = int(round((P.ARM_DECK_Y[0] - Y.Y0) / H)); deck_iz = int(round((-4.0 - Y.Z0) / H))
    deck = [nid(ix, deck_iy, deck_iz) for ix in range(left_ix + 1, right_ix, 3)]
    return plate, ridge, mids, deck, (X, Yn, Z)


def candidates(plate, ridge, mids, deck, XYZ):
    X, Yn, Z = XYZ
    free_nodes = set(ridge) | set(mids)
    supported = set(plate['L']) | set(plate['R']) | set(deck)
    bars = set()
    def ok_rise(a, b):
        dz = Z[b] - Z[a]; run = math.hypot(X[b] - X[a], Yn[b] - Yn[a]); L = math.sqrt(run * run + dz * dz)
        return L <= 32.0 and L >= 3.0 and dz >= run - 1e-6
    for a in supported:
        for b in free_nodes:
            if ok_rise(a, b): bars.add((a, b))
    for a in free_nodes:
        for b in free_nodes:
            if a >= b: continue
            dz = abs(Z[b] - Z[a]); run = math.hypot(X[b] - X[a], Yn[b] - Yn[a]); L = math.hypot(run, dz)
            if L < 3.0 or L > 20.0: continue
            if dz >= run - 1e-6 or (dz < 1e-6 and run <= BRIDGE):   # rising, or a short bridge between free nodes
                bars.add((a, b))
    return sorted(bars)


def bar_stiffness(bars, XYZ):
    X, Yn, Z = XYZ
    P1 = np.array([[X[a], Yn[a], Z[a]] for a, b in bars]); P2 = np.array([[X[b], Yn[b], Z[b]] for a, b in bars])
    d = P2 - P1; L = np.linalg.norm(d, axis=1); n = d / L[:, None]
    return L / H, n               # length in voxel units


def assemble_bars(ndof, bars, A, Lh, n):
    rows, cols, vals = [], [], []
    for (a, b), Ai, Li, ni in zip(bars, A, Lh, n):
        k = Ai / Li
        blk = np.outer(ni, ni) * k
        da = [3 * a, 3 * a + 1, 3 * a + 2]; db = [3 * b, 3 * b + 1, 3 * b + 2]
        for i in range(3):
            for j in range(3):
                rows += [da[i], db[i], da[i], db[i]]; cols += [da[j], db[j], db[j], da[j]]
                vals += [blk[i, j], blk[i, j], -blk[i, j], -blk[i, j]]
    return coo_matrix((vals, (rows, cols)), shape=(ndof, ndof)).tocsc()


def run(v_target=V_TARGET_CM3, iters=50, log=print):
    xs, ys, zs, in_part, solid_fixed, design, between = Y.build_domain()
    grid = T3.Grid(Y.NX, Y.NY, Y.NZ, H, (Y.X0, Y.Y0, Y.Z0))
    ex, ey = grid.col; ez = np.tile(np.arange(Y.NZ), Y.NX * Y.NY)
    xe = solid_fixed[ex, ey, ez].astype(float)
    K0 = grid.assemble(xe)
    plate, ridge, mids, deck, XYZ = anchors(grid, in_part, solid_fixed)
    bars = candidates(plate, ridge, mids, deck, XYZ)
    Lh, n = bar_stiffness(bars, XYZ)
    X, Yn, Z = XYZ
    log('anchors: plates %d + %d, ridge %d, mids %d, deck %d; candidate struts %d' % (len(plate['L']), len(plate['R']), len(ridge), len(mids), len(deck), len(bars)))
    # supports + loads as in yoke_topo
    ip = np.pad(in_part, 1); touch = np.zeros((grid.nx + 1, grid.ny + 1, grid.nz + 1), bool)
    for a in (0, 1):
        for b in (0, 1):
            for c in (0, 1):
                touch |= ip[a:a + grid.nx + 1, b:b + grid.ny + 1, c:c + grid.nz + 1]
    touch = touch.ravel()
    fixed_nodes = np.where((Yn <= Y.Y0 + 0.01) & touch)[0]
    fixed = np.concatenate([3 * fixed_nodes, 3 * fixed_nodes + 1, 3 * fixed_nodes + 2])
    wrist = np.where((Yn >= Yn.max() - 0.01) & touch)[0]
    left = wrist[X[wrist] < 0]; right = wrist[X[wrist] > 0]
    F = np.zeros((grid.ndof, 3)); Fs, lever, T, Fb = Y.LOADS['side'], Y.LOADS['side_lever'], Y.LOADS['twist'], Y.LOADS['bend']
    gap = X[right].mean() - X[left].mean()
    F[3 * wrist, 0] = Fs / len(wrist); F[3 * left + 1, 0] += -Fs * lever / gap / len(left); F[3 * right + 1, 0] += Fs * lever / gap / len(right)
    F[3 * left + 2, 1] += T / gap / len(left); F[3 * right + 2, 1] += -T / gap / len(right)
    F[3 * wrist + 2, 2] = -2 * Fb / len(wrist)
    W = np.array((1.0, 1.0, 0.3))
    free = np.setdiff1d(np.arange(grid.ndof), fixed)
    Vt = v_target * 1000 / H**3
    Amax, Amin = math.pi / 4 * (D_MAX / H)**2, 1e-4
    A = np.full(len(bars), Vt / Lh.sum())
    def solve(A, pen=1.0, keep=None):
        Aeff = Amax * (A / Amax)**pen
        if keep is not None: Aeff = np.where(keep, Aeff, Amin)
        K = K0 + assemble_bars(grid.ndof, bars, Aeff, Lh, n)
        Kf = K[free, :][:, free]; lu = splu(Kf)
        comps, dA = [], np.zeros(len(bars))
        for c in range(3):
            u = np.zeros(grid.ndof); u[free] = lu.solve(F[free, c])
            comps.append(float(F[:, c] @ u))
            du = np.array([u[3 * b:3 * b + 3] - u[3 * a:3 * a + 3] for a, b in bars])
            dA += -W[c] * (np.einsum('ij,ij->i', du, n))**2 / Lh * pen * (A / Amax)**(pen - 1)
        return comps, dA
    t0 = time.time()
    alive = np.ones(len(bars), bool)
    stages = [(1.0, 12, 0.15), (2.0, 12, 0.30), (3.0, 14, 0.0)]     # (penalty, iterations, prune fraction of the max area after the stage)
    it = -1
    for pen, nit, prune in stages:
      for _ in range(nit):
        it += 1
        comps, dA = solve(A, pen, alive)
        dA = np.where(alive, dA, 0.0)
        l1, l2 = 0.0, 1e9
        while (l2 - l1) / (l1 + l2 + 1e-12) > 1e-4:
            lmid = 0.5 * (l1 + l2)
            Anew = np.clip(A * np.sqrt(np.maximum(-dA, 1e-14) / (lmid * Lh)), np.maximum(Amin, A * 0.5), np.minimum(Amax, A * 2.0))
            Anew = np.where(alive, Anew, Amin)
            if (Anew * Lh).sum() > Vt: l1 = lmid
            else: l2 = lmid
        change = float(np.abs(Anew - A).max()); A = Anew
        if _ == nit - 1 and prune > 0:
            alive &= A >= prune * A.max(); A = np.where(alive, A, Amin)
            log('  pruned to %d candidates' % alive.sum())
        if it % 5 == 0 or it == iters - 1:
            log('  it %3d  comp %s  vol %.2f cm3  struts > %.1f mm: %d  change %.3f (%.0f s)' % (
                it, ['%.3f' % c for c in comps], (A * Lh).sum() * H**3 / 1000, D_MIN, int((np.sqrt(4 * A / math.pi) * H >= D_MIN).sum()), change, time.time() - t0))
    D = np.sqrt(4 * A / math.pi) * H
    keep = alive & (D >= D_MIN)
    # evaluate the kept set with its diameters rounded up to 2.0 min
    Ak = np.where(keep, np.maximum(A, math.pi / 4 * (D_MIN / H)**2), Amin)
    comps_k, _ = solve(Ak)
    comps_0, _ = solve(np.full(len(bars), Amin))
    struts = [dict(p1=[float(X[a]), float(Yn[a]), float(Z[a])], p2=[float(X[b]), float(Yn[b]), float(Z[b])], d=float(round(max(D[i], D_MIN), 1))) for i, (a, b) in enumerate(bars) if keep[i]]
    # repair pass: every free node must have a strut rising into it from a supported node
    anchors_all = set(plate['L']) | set(plate['R']) | set(deck)
    def key(nid_): return (float(X[nid_]), float(Yn[nid_]), float(Z[nid_]))
    used = {}
    for i, (a, b) in enumerate(bars):
        if keep[i]:
            for nn in (a, b): used.setdefault(nn, []).append((a, b))
    supported_set = set(anchors_all)
    changed = True
    while changed:
        changed = False
        for nn in list(used):
            if nn in supported_set: continue
            for (a, b) in used[nn]:
                o = b if a == nn else a
                if o in supported_set and Z[nn] - Z[o] >= math.hypot(X[nn] - X[o], Yn[nn] - Yn[o]) - 1e-6:
                    supported_set.add(nn); changed = True; break
    for nn in list(used):
        if nn in supported_set: continue
        best = None
        for a in anchors_all:
            run = math.hypot(X[nn] - X[a], Yn[nn] - Yn[a]); dz = Z[nn] - Z[a]
            if dz >= run - 1e-6 and 3.0 <= math.hypot(run, dz) <= 32.0:
                ang = math.degrees(math.atan2(dz, run))
                if best is None or ang > best[0]: best = (ang, a)
        if best is not None:
            struts.append(dict(p1=list(key(best[1])), p2=list(key(nn)), d=2.2, repair=True)); supported_set.add(nn)
            log('  repair: propped node %s with a strut from %s' % (key(nn), key(best[1])))
        else:
            log('  WARNING: node %s cannot be propped at 45 deg' % (key(nn),))
    vol = sum(math.pi / 4 * s['d']**2 * math.dist(s['p1'], s['p2']) for s in struts) / 1000
    log('kept %d struts, %.2f cm3 (%.1f g); compliance with web %s, plates alone %s' % (len(struts), vol, vol * 1.27, ['%.3f' % c for c in comps_k], ['%.3f' % c for c in comps_0]))
    json.dump(dict(struts=struts, compliance=comps_k, plates_alone=comps_0, volume_cm3=vol), open('yoke_struts.json', 'w'), indent=1)
    preview(struts)
    return struts


def preview(struts):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    fig = plt.figure(figsize=(13, 4.5))
    for k, (elev, azim, title) in enumerate(((22, -55, 'iso'), (0, -90, 'from the side'), (90, -90, 'from above'))):
        ax = fig.add_subplot(1, 3, k + 1, projection='3d')
        for (x0, x1) in ((-21, -18), (15.6, 18.6)):
            for z in (-7, 12): ax.plot([x0, x1, x1, x0, x0], [17, 17, 56, 56, 17], [z] * 5, color='#999', lw=0.6)
        ax.plot([-21, 18.6, 18.6, -21, -21], [56, 56, 58, 58, 56], [-4] * 5, color='#999', lw=0.6)
        for s in struts:
            ax.plot([s['p1'][0], s['p2'][0]], [s['p1'][1], s['p2'][1]], [s['p1'][2], s['p2'][2]], color='#e0a000', lw=s['d'] * 1.6, solid_capstyle='round')
        ax.set_xlim(-22, 20); ax.set_ylim(15, 60); ax.set_zlim(-8, 14); ax.view_init(elev, azim); ax.set_title(title, fontsize=10); ax.set_box_aspect((42, 45, 22))
    plt.tight_layout(); plt.savefig('yoke_truss_preview.png', dpi=130); print('wrote yoke_truss_preview.png')


if __name__ == '__main__':
    run(float(sys.argv[1]) if len(sys.argv) > 1 else V_TARGET_CM3)
