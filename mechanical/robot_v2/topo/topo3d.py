"""3D voxel topology optimization (8-node hex, SIMP + OC) with 2.5D design variables: one density per (x, y)
column, extruded through the thickness, so the result is a plate with through-windows that prints flat with no
overhang rule. Used for the jaws and the wrist deck; the yoke between the arm plates would use full 3D variables."""
import math, numpy as np, cv2
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import splu


def lk_h8(nu=0.3):
    C = 1.0 / ((1 + nu) * (1 - 2 * nu)) * np.array([[1 - nu, nu, nu, 0, 0, 0], [nu, 1 - nu, nu, 0, 0, 0], [nu, nu, 1 - nu, 0, 0, 0],
                                                    [0, 0, 0, (1 - 2 * nu) / 2, 0, 0], [0, 0, 0, 0, (1 - 2 * nu) / 2, 0], [0, 0, 0, 0, 0, (1 - 2 * nu) / 2]])
    nodes = np.array([[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], float)
    g = (-1 / math.sqrt(3), 1 / math.sqrt(3))
    KE = np.zeros((24, 24))
    for xi in g:
        for eta in g:
            for zeta in g:
                dN = np.array([[a * (1 + b * eta) * (1 + c * zeta) / 8, b * (1 + a * xi) * (1 + c * zeta) / 8, c * (1 + a * xi) * (1 + b * eta) / 8] for (a, b, c) in nodes]) * 2.0
                B = np.zeros((6, 24))
                for i in range(8):
                    B[0, 3 * i] = dN[i, 0]; B[1, 3 * i + 1] = dN[i, 1]; B[2, 3 * i + 2] = dN[i, 2]
                    B[3, 3 * i] = dN[i, 1]; B[3, 3 * i + 1] = dN[i, 0]
                    B[4, 3 * i + 1] = dN[i, 2]; B[4, 3 * i + 2] = dN[i, 1]
                    B[5, 3 * i] = dN[i, 2]; B[5, 3 * i + 2] = dN[i, 0]
                KE += B.T @ C @ B / 8.0
    return KE


class Grid:
    """nx x ny x nz unit voxels (physical size h); node id = ix*(ny+1)*(nz+1) + iy*(nz+1) + iz."""
    def __init__(self, nx, ny, nz, h, origin):
        self.nx, self.ny, self.nz, self.h = nx, ny, nz, h
        self.ox, self.oy, self.oz = origin
        self.nn = (nx + 1) * (ny + 1) * (nz + 1); self.ndof = 3 * self.nn
        self.KE = lk_h8()
        ex, ey, ez = np.meshgrid(np.arange(nx), np.arange(ny), np.arange(nz), indexing='ij')
        ex, ey, ez = ex.ravel(), ey.ravel(), ez.ravel()
        self.col = (ex, ey)                      # column of each element (x-major element order)
        def n(ix, iy, iz): return ix * (ny + 1) * (nz + 1) + iy * (nz + 1) + iz
        corners = [n(ex, ey, ez), n(ex + 1, ey, ez), n(ex + 1, ey + 1, ez), n(ex, ey + 1, ez),
                   n(ex, ey, ez + 1), n(ex + 1, ey, ez + 1), n(ex + 1, ey + 1, ez + 1), n(ex, ey + 1, ez + 1)]
        edof = np.zeros((nx * ny * nz, 24), dtype=np.int64)
        for k, c in enumerate(corners):
            edof[:, 3 * k] = 3 * c; edof[:, 3 * k + 1] = 3 * c + 1; edof[:, 3 * k + 2] = 3 * c + 2
        self.edof = edof
        self.iK = np.repeat(edof, 24, axis=1).ravel()
        self.jK = np.tile(edof, (1, 24)).ravel()
        self.KEf = self.KE.ravel()

    def node(self, ix, iy, iz):
        return ix * (self.ny + 1) * (self.nz + 1) + iy * (self.nz + 1) + iz

    def node_xyz(self):
        ix, iy, iz = np.meshgrid(np.arange(self.nx + 1), np.arange(self.ny + 1), np.arange(self.nz + 1), indexing='ij')
        return self.ox + ix.ravel() * self.h, self.oy + iy.ravel() * self.h, self.oz + iz.ravel() * self.h

    def assemble(self, xe, penal=3.0, emin=1e-9):
        sK = (np.outer(emin + xe**penal * (1 - emin), self.KEf)).ravel()
        return coo_matrix((sK, (self.iK, self.jK)), shape=(self.ndof, self.ndof)).tocsc()

    def solve(self, xe, F, fixed, penal=3.0):
        K = self.assemble(xe, penal)
        free = np.setdiff1d(np.arange(self.ndof), fixed)
        Kf = K[free, :][:, free]
        U = np.zeros((self.ndof, F.shape[1])); ce = np.zeros(self.nx * self.ny * self.nz); comp = []
        lu = splu(Kf)
        for c in range(F.shape[1]):
            u = np.zeros(self.ndof); u[free] = lu.solve(F[free, c]); U[:, c] = u
            ue = u[self.edof]
            cec = np.einsum('ij,jk,ik->i', ue, self.KE, ue)
            ce += cec * (1.0 if F.shape[1] == 1 else 1.0)
            comp.append(float(((1e-9 + xe**penal * (1 - 1e-9)) * cec).sum()))
        return comp, ce, U


def filter2d(nx, ny, rmin):
    r = int(math.ceil(rmin))
    iH, jH, sH = [], [], []
    for i in range(nx):
        for j in range(ny):
            row = i * ny + j
            for k in range(max(i - r, 0), min(i + r + 1, nx)):
                for l in range(max(j - r, 0), min(j + r + 1, ny)):
                    fac = rmin - math.hypot(i - k, j - l)
                    if fac > 0:
                        iH.append(row); jH.append(k * ny + l); sH.append(fac)
    Hm = coo_matrix((sH, (iH, jH)), shape=(nx * ny, nx * ny)).tocsc()
    return Hm, np.asarray(Hm.sum(1)).ravel()


def optimize_plate(grid, in_part, solid_fixed, design, F, fixed, volfrac, weights, iters=60, rmin_cells=3.0, penal=3.0, log=print):
    """2.5D SIMP: x2d (nx, ny) column densities; in_part/solid_fixed/design are (nx, ny) masks."""
    nx, ny, nz = grid.nx, grid.ny, grid.nz
    Hm, Hs = filter2d(nx, ny, rmin_cells)
    ex, ey = grid.col
    x = np.full((nx, ny), volfrac); x[~in_part] = 0.0; x[solid_fixed] = 1.0
    def physical(xv):
        xp = (Hm @ xv.ravel() / Hs).reshape(nx, ny); xp[~in_part] = 0.0; xp[solid_fixed] = 1.0; return xp
    xPhys = physical(x)
    W = np.array(weights)
    for it in range(iters):
        xe = xPhys[ex, ey]
        comps, ce, _ = grid.solve(xe, F, fixed, penal)
        # per-case sensitivities need per-case ce: recompute cheaply from U would need storage; use the combined ce
        # weighted: grid.solve sums ce over cases unweighted, so weight the cases by scaling F beforehand (done by caller)
        dc_e = -penal * xe**(penal - 1) * (1 - 1e-9) * ce
        dc = np.zeros((nx, ny)); np.add.at(dc, (ex, ey), dc_e)
        dv = np.full((nx, ny), float(nz))
        dc = (Hm.T @ (dc.ravel() / Hs)).reshape(nx, ny); dv = (Hm.T @ (dv.ravel() / Hs)).reshape(nx, ny)
        l1, l2, move = 0.0, 1e9, (0.2 if it < 50 else 0.1)
        target = volfrac * design.sum()
        while (l2 - l1) / (l1 + l2 + 1e-12) > 1e-3:
            lmid = 0.5 * (l1 + l2)
            xnew = np.maximum(0.0, np.maximum(x - move, np.minimum(1.0, np.minimum(x + move, x * np.sqrt(np.maximum(-dc, 1e-12) / np.maximum(dv, 1e-9) / lmid)))))
            xnew[~design] = x[~design]
            xPhys = physical(xnew)
            if xPhys[design].sum() > target: l1 = lmid
            else: l2 = lmid
        change = float(np.abs(xnew - x).max()); x = xnew
        if it % 10 == 0 or it == iters - 1:
            log('  it %3d  comp %s  vol %.3f  change %.3f' % (it, ['%.3f' % c for c in comps], xPhys[design].mean(), change))
        if change < 0.01 and it > 30:
            break
    return xPhys


def cleanup2d(solid, in_part, solid_fixed, min_member_cells, min_void_cells):
    s = solid.astype(np.uint8)
    km, kv = max(1, int(round(min_member_cells))), max(1, int(round(min_void_cells)))
    s = cv2.morphologyEx(s, cv2.MORPH_OPEN, np.ones((km, km), np.uint8))
    v = (1 - s) & in_part.astype(np.uint8)
    v = cv2.morphologyEx(v, cv2.MORPH_OPEN, np.ones((kv, kv), np.uint8))
    s = (1 - v).astype(bool) & in_part
    s[solid_fixed] = True; s[~in_part] = False
    return s


def void_polys(solid, in_part, grid, eps_mm=0.3, min_area_mm2=6.0):
    """Closed void contours (holes fully inside the part) in part coordinates (x, y) mm; solid is (nx, ny)."""
    void = ((~solid) & in_part).astype(np.uint8).T.copy()          # cv2 wants (rows=y, cols=x)
    cnts, _ = cv2.findContours(void, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = []
    for cnt in cnts:
        if cv2.contourArea(cnt) * grid.h**2 < min_area_mm2: continue
        ap = cv2.approxPolyDP(cnt, eps_mm / grid.h, True).reshape(-1, 2)
        out.append([(grid.ox + (c + 0.5) * grid.h, grid.oy + (r + 0.5) * grid.h) for (c, r) in ap])
    return out
