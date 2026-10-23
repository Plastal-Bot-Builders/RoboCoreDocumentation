"""Full-3D topology optimization of the yoke between the arm's two side plates (replaces the hydraulic-cylinder
styling, the saddles, the web and the mid brace). Voxel SIMP + OC, 3D density filter, Langelaar's 3D AM filter with
the build direction +z (the arm prints deck-down, the bed is z = -7). Plates (with their windows) and the wrist deck
are fixed solid; the hub side (y = 17) is fixed; side, twist and bending loads act at the wrist face (y = 58).
Output: yoke_voxels.npz, yoke_web.stl (smoothed), yoke_preview.png."""
import sys, os, json, math, time, numpy as np, cv2
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fusion'))
import rc_params as P
import topo3d as T3
from arm_topo import rounded_profile

H = 1.5
X0, X1 = P.ARM_PLATE_X[1][0], P.ARM_PLATE_X[0][1]        # -21 .. 18.6 (plate outer faces)
Y0, Y1 = 17.0, 58.0
Z0, Z1 = -7.0, 14.6
NX, NY, NZ = int(round((X1 - X0) / H)), int(round((Y1 - Y0) / H)), int(round((Z1 - Z0) / H))
WRIST_Y = P.ARM_DECK_Y[0]                                   # 56: deck starts
LOADS = dict(side=0.5, side_lever=50.0, twist=18.0, bend=0.6)   # N, mm, N*mm, N per plate


RAISED, BRIDGE_K = False, 0


def build_domain():
    xs = X0 + (np.arange(NX) + 0.5) * H; ys = Y0 + (np.arange(NY) + 0.5) * H; zs = Z0 + (np.arange(NZ) + 0.5) * H
    xx, yy, zz = np.meshgrid(xs, ys, zs, indexing='ij')
    prof = rounded_profile(*P.BOOM)
    cnt = np.array(prof, np.float32).reshape(-1, 1, 2)
    in_prof = np.array([cv2.pointPolygonTest(cnt, (float(y), float(z)), False) >= 0 for y, z in zip(yy[0].ravel(), zz[0].ravel())]).reshape(NY, NZ)
    in_win = np.zeros((NY, NZ), bool)
    for poly in P.BOOM_WINDOWS_TOPO:
        c2 = np.array(poly, np.float32).reshape(-1, 1, 2)
        in_win |= np.array([cv2.pointPolygonTest(c2, (float(y), float(z)), False) >= 0 for y, z in zip(yy[0].ravel(), zz[0].ravel())]).reshape(NY, NZ)
    plate_x = ((xx <= P.ARM_PLATE_X[1][1]) | (xx >= P.ARM_PLATE_X[0][0]))
    plates = plate_x & in_prof[None, :, :] & ~in_win[None, :, :]
    deck = (yy >= WRIST_Y) & (zz <= -4.0)
    wrist_plates = plate_x & (yy >= WRIST_Y) & in_prof[None, :, :]
    solid_fixed = plates | deck | wrist_plates
    between = (xx > P.ARM_PLATE_X[1][1]) & (xx < P.ARM_PLATE_X[0][0])
    design = between & (yy < WRIST_Y) & ~solid_fixed & ((zz > -4.0) if RAISED else True)
    in_part = solid_fixed | design
    return xs, ys, zs, in_part, solid_fixed, design, between


class AMFilter3D:
    """Voxel (i, j, k) may only be as dense as the smooth max of the five voxels below it: (i, j, k-1) and its four
    in-plane neighbours. Bed = layer 0. Only 'filtered' voxels obey the rule; fixed solid counts as supported."""
    P, EPS = 40.0, 1e-4
    def __init__(self, filtered, solid_fixed, in_part):
        self.filtered, self.solid_fixed, self.in_part = filtered, solid_fixed, in_part
        self.K = BRIDGE_K
        self.Q = self.P + math.log(5 + 2 * max(0, self.K - 1)) / math.log(0.5)
    K = 0
    def _stencil_sum(self, a):
        s = a.copy()
        s[1:, :] += a[:-1, :]; s[:-1, :] += a[1:, :]; s[:, 1:] += a[:, :-1]; s[:, :-1] += a[:, 1:]
        for k in range(2, self.K + 1):            # bridge rule: support anywhere within +-K voxels along x, one layer down
            s[k:, :] += a[:-k, :]; s[:-k, :] += a[k:, :]
        return s
    def forward(self, rho):
        nx, ny, nz = rho.shape
        xi = np.zeros_like(rho); self._cache = {}
        for k in range(nz):
            if k == 0:
                S = np.ones((nx, ny)); sp = None
            else:
                below = np.clip(xi[:, :, k - 1], 0, 1); bp = below**self.P
                sp = self._stencil_sum(bp); S = np.minimum(sp**(1.0 / self.Q), 1.0)
            r = rho[:, :, k]; d = r - S; root = np.sqrt(d * d + self.EPS)
            xk = 0.5 * (r + S - root + math.sqrt(self.EPS))
            xi[:, :, k] = np.where(self.filtered[:, :, k], xk, np.where(self.solid_fixed[:, :, k], 1.0, np.where(~self.in_part[:, :, k], 0.0, r)))
            self._cache[k] = (sp, d, root)
        self._xi = xi
        return xi
    def backward(self, dxi, rho):
        nx, ny, nz = rho.shape
        lam = dxi.copy(); drho = np.zeros_like(rho)
        for k in range(nz - 1, -1, -1):
            sp, d, root = self._cache[k]
            mask = self.filtered[:, :, k]
            dxi_drho = 0.5 * (1.0 - d / root); dxi_dS = 0.5 * (1.0 + d / root)
            drho[:, :, k] = np.where(mask, lam[:, :, k] * dxi_drho, np.where(self.solid_fixed[:, :, k] | ~self.in_part[:, :, k], 0.0, lam[:, :, k]))
            if k > 0 and sp is not None:
                g = np.where(mask, lam[:, :, k] * dxi_dS, 0.0)
                with np.errstate(divide='ignore', invalid='ignore'):
                    base = np.where(sp > 0, (1.0 / self.Q) * np.power(np.maximum(sp, 1e-300), 1.0 / self.Q - 1.0) * self.P, 0.0)
                contrib = g * base
                below = np.clip(self._xi[:, :, k - 1], 0, 1); bpm1 = below**(self.P - 1)
                lam[:, :, k - 1] += self._stencil_sum(contrib) * bpm1
        return drho


def filter3d(nx, ny, nz, rmin):
    """Linear density filter as separable-ish neighbour sums via convolution weights (brute force, small radius)."""
    r = int(math.ceil(rmin)); offs = [(a, b, c) for a in range(-r, r + 1) for b in range(-r, r + 1) for c in range(-r, r + 1) if rmin - math.sqrt(a*a + b*b + c*c) > 0]
    w = np.array([rmin - math.sqrt(a*a + b*b + c*c) for (a, b, c) in offs])
    def apply(v):          # v: (nx, ny, nz) -> sum_j w_ij v_j / sum_j w_ij  (padding with zeros, normalised by in-grid weights)
        out = np.zeros_like(v); norm = np.zeros_like(v)
        for (a, b, c), wk in zip(offs, w):
            src = v[max(0, -a):nx - max(0, a), max(0, -b):ny - max(0, b), max(0, -c):nz - max(0, c)]
            out[max(0, a):nx - max(0, -a), max(0, b):ny - max(0, -b), max(0, c):nz - max(0, -c)] += wk * src
            norm[max(0, a):nx - max(0, -a), max(0, b):ny - max(0, -b), max(0, c):nz - max(0, -c)] += wk
        return out, norm
    return apply


def run(volfrac=0.05, iters=45, rmin=1.5, penal=3.0, log=print):
    xs, ys, zs, in_part, solid_fixed, design, between = build_domain()
    grid = T3.Grid(NX, NY, NZ, H, (X0, Y0, Z0))
    X, Y, Z = grid.node_xyz()
    nodes_touch = np.zeros((NX + 1, NY + 1, NZ + 1), bool)
    ip = np.pad(in_part, 1)
    for a in (0, 1):
        for b in (0, 1):
            for c in (0, 1):
                nodes_touch |= ip[a:a + NX + 1, b:b + NY + 1, c:c + NZ + 1]
    touch = nodes_touch.ravel()
    fixed_nodes = np.where((Y <= Y0 + 0.01) & touch)[0]
    fixed = np.concatenate([3 * fixed_nodes, 3 * fixed_nodes + 1, 3 * fixed_nodes + 2])
    wrist = np.where((Y >= Y.max() - 0.01) & touch)[0]
    left = wrist[X[wrist] < 0]; right = wrist[X[wrist] > 0]
    F = np.zeros((grid.ndof, 3))
    Fs, lever, T, Fb = LOADS['side'], LOADS['side_lever'], LOADS['twist'], LOADS['bend']
    F[3 * wrist, 0] = Fs / len(wrist)                                           # side push
    gap = X[right].mean() - X[left].mean()
    F[3 * left + 1, 0] += -Fs * lever / gap / len(left); F[3 * right + 1, 0] += Fs * lever / gap / len(right)   # its moment as a couple
    F[3 * left + 2, 1] += T / gap / len(left); F[3 * right + 2, 1] += -T / gap / len(right)                      # twist about y
    F[3 * wrist + 2, 2] = -2 * Fb / len(wrist)                                   # bending
    weights = (1.0, 1.0, 0.3)
    for c in range(3): F[:, c] *= weights[c]
    log('yoke grid %d x %d x %d (%.1f mm), %d dofs, %d design voxels (%.1f cm3 box), %d fixed dofs, %d wrist nodes' % (
        NX, NY, NZ, H, grid.ndof, design.sum(), design.sum() * H**3 / 1000, len(fixed), len(wrist)))
    filt = filter3d(NX, NY, NZ, rmin)
    amf = AMFilter3D(design, solid_fixed, in_part)
    x = np.full((NX, NY, NZ), volfrac); x[~in_part] = 0; x[solid_fixed] = 1
    def physical(xv):
        num, den = filt(xv); rho = num / den; rho[~in_part] = 0; rho[solid_fixed] = 1
        xi = amf.forward(rho); return xi, rho
    xPhys, rho = physical(x)
    ex, ey = grid.col                       # here col = (ex, ey) for x-major elements; we need full 3D index
    ez = np.tile(np.arange(NZ), NX * NY)
    t0 = time.time()
    for it in range(iters):
        xe = xPhys[ex, ey, ez]
        comps, ce, _ = grid.solve(xe, F, fixed, penal)
        dc_e = -penal * xe**(penal - 1) * (1 - 1e-9) * ce
        dc = dc_e.reshape(NX, NY, NZ); dv = np.ones((NX, NY, NZ))
        amf.forward(rho)
        dc = amf.backward(dc, rho); dv = amf.backward(dv, rho)
        # chain through the density filter: dC/dx_j = sum_i w_ij/den_i dC/drho_i
        dcf, _ = filt(dc / filt(np.ones_like(dc))[1]); dvf, _ = filt(dv / filt(np.ones_like(dv))[1])
        l1, l2, move = 0.0, 1e9, (0.2 if it < 40 else 0.1)
        target = volfrac * design.sum()
        while (l2 - l1) / (l1 + l2 + 1e-12) > 1e-3:
            lmid = 0.5 * (l1 + l2)
            xnew = np.maximum(0.0, np.maximum(x - move, np.minimum(1.0, np.minimum(x + move, x * np.sqrt(np.maximum(-dcf, 1e-12) / np.maximum(dvf, 1e-9) / lmid)))))
            xnew[~design] = x[~design]
            xPhys, rho = physical(xnew)
            if xPhys[design].sum() > target: l1 = lmid
            else: l2 = lmid
        change = float(np.abs(xnew - x).max()); x = xnew
        if it % 5 == 0 or it == iters - 1:
            log('  it %3d  comp %s  vol %.3f  change %.3f  (%.0f s)' % (it, ['%.3f' % c for c in comps], xPhys[design].mean(), change, time.time() - t0))
        if change < 0.01 and it > 30: break
    solid = (xPhys > 0.5) & design
    np.savez('yoke_voxels%s.npz' % ('_raised' if RAISED else ''), solid=solid, design=design, solid_fixed=solid_fixed, in_part=in_part, xs=xs, ys=ys, zs=zs, xPhys=xPhys)
    xe = (solid | solid_fixed)[ex, ey, ez].astype(float)
    comp_s, _, _ = grid.solve(xe, F, fixed, penal)
    xe0 = solid_fixed[ex, ey, ez].astype(float)
    comp_0, _, _ = grid.solve(xe0, F, fixed, penal)
    log('web: %d voxels = %.2f cm3 (%.1f g solid); compliance with web %s, plates alone %s' % (solid.sum(), solid.sum() * H**3 / 1000, solid.sum() * H**3 / 1000 * 1.27, ['%.3f' % c for c in comp_s], ['%.3f' % c for c in comp_0]))
    return solid


if __name__ == '__main__':
    vf = float(sys.argv[1]) if len(sys.argv) > 1 else 0.05
    if 'raised' in sys.argv:
        RAISED, BRIDGE_K = True, 6
    run(vf)
