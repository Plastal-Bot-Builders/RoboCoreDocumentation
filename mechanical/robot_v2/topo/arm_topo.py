"""Topology optimization of the RoboCore V2 arm's side plates (2D plane stress, SIMP + OC, density filter),
with a 45-degree self-supporting pass so every void prints as a diamond/teardrop (the arm prints deck-down,
plate +z up). Loads: the gripper servo + jaws + payload hanging off the wrist deck, arm level (bending) and
arm raised 85 deg (mostly axial). Output: PNG preview, JSON of the void polygons in plate (y, z) mm, numbers.

usage: python3 arm_topo.py [volfrac ...]   (default 0.60 0.45)
"""
import sys, os, json, math
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve
import cv2
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fusion'))
import rc_params as P

H = 0.5                         # cell size, mm
Y0, Y1 = -7.0, 64.0             # plate extent along the arm (shoulder boss r 7 at y 0 .. wrist end)
Z0, Z1 = -7.0, 12.5             # plate bottom .. top
NELX, NELY = int(round((Y1 - Y0) / H)), int(round((Z1 - Z0) / H))
F_PAYLOAD = 1.2                 # N on the wrist deck (servo 9 g + jaws/horn ~5 g + 100 g object), both plates
DECK_LEVER = 9.0                # mm: deck load centre (y 73) beyond the plate end (y 64)
SKIN = 1.6                      # mm of plate kept solid along the outline
HUB_Y = 16.0                    # shoulder hub (horn arm + screws) kept solid up to this y
WRIST_Y = 56.0                  # wrist block (deck junction + bolt boss) kept solid from this y
MIN_MEMBER = 1.6                # mm, thinnest strut after cleanup
MIN_VOID = 3.0                  # mm, smallest void


def rounded_profile(pts, radii, n_arc=12):
    """Polygon with per-corner fillets (same meaning as rc_lib.rounded_poly)."""
    out = []
    n = len(pts)
    for i, (p, r) in enumerate(zip(pts, radii)):
        if r <= 0:
            out.append(p); continue
        a, b = np.array(pts[i - 1]), np.array(pts[(i + 1) % n])
        p = np.array(p)
        d1, d2 = (a - p) / np.linalg.norm(a - p), (b - p) / np.linalg.norm(b - p)
        ang = math.acos(np.clip(np.dot(d1, d2), -1, 1))
        t = r / math.tan(ang / 2)
        t1, t2 = p + d1 * t, p + d2 * t
        bis = (d1 + d2); bis /= np.linalg.norm(bis)
        c = p + bis * (r / math.sin(ang / 2))
        a1, a2 = math.atan2(*(t1 - c)[::-1]), math.atan2(*(t2 - c)[::-1])
        da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
        for k in range(n_arc + 1):
            ang_k = a1 + da * k / n_arc
            out.append((c[0] + r * math.cos(ang_k), c[1] + r * math.sin(ang_k)))
    return out


def cell_centres():
    ys = Y0 + (np.arange(NELX) + 0.5) * H
    zs = Z1 - (np.arange(NELY) + 0.5) * H      # row 0 at the top (print "up" = +z)
    return np.meshgrid(ys, zs)                   # shape (NELY, NELX)


def inside_polygon(poly, yy, zz):
    cnt = np.array(poly, dtype=np.float32).reshape(-1, 1, 2)
    flat = np.stack([yy.ravel(), zz.ravel()], 1).astype(np.float32)
    inside = np.array([cv2.pointPolygonTest(cnt, (float(p[0]), float(p[1])), True) for p in flat])
    return inside.reshape(yy.shape)              # signed distance, + inside


def build_domain():
    pts, radii = P.BOOM
    prof = rounded_profile(pts, radii)
    yy, zz = cell_centres()
    dist = inside_polygon(prof, yy, zz)
    r_sh = np.hypot(yy, zz)
    in_plate = (dist > 0) | (r_sh < 7.0)
    dist2 = np.where(r_sh < 7.0, np.maximum(dist, 7.0 - r_sh), dist)
    solid_fixed = in_plate & ((dist2 < SKIN) | (yy < HUB_Y) | (yy > WRIST_Y) | ((yy > 44.5) & (yy < 48.5) & (zz > 8.0))
                              | ((yy > 36.0) & (yy < 42.0) & (zz < -4.0)))
    design = in_plate & ~solid_fixed
    return prof, in_plate, solid_fixed, design, yy, zz


def lk(E=1.0, nu=0.3):
    k = np.array([1/2 - nu/6, 1/8 + nu/8, -1/4 - nu/12, -1/8 + 3*nu/8, -1/4 + nu/12, -1/8 - nu/8, nu/6, 1/8 - 3*nu/8])
    idx = [[0,1,2,3,4,5,6,7],[1,0,7,6,5,4,3,2],[2,7,0,5,6,3,4,1],[3,6,5,0,7,2,1,4],[4,5,6,7,0,1,2,3],[5,4,3,2,1,0,7,6],[6,3,4,1,2,7,0,5],[7,2,1,4,3,6,5,0]]
    return E / (1 - nu**2) * np.array([[k[j] for j in row] for row in idx])


class FE:
    """Plane-stress Q4 grid, 88-line conventions (node numbering column-wise, v positive = down = -z)."""
    def __init__(self):
        nelx, nely = NELX, NELY
        self.ndof = 2 * (nelx + 1) * (nely + 1)
        self.KE = lk()
        edof = np.zeros((nelx * nely, 8), dtype=int)
        for elx in range(nelx):
            for ely in range(nely):
                el = ely + elx * nely
                n1 = (nely + 1) * elx + ely
                n2 = (nely + 1) * (elx + 1) + ely
                edof[el] = [2*n1+2, 2*n1+3, 2*n2+2, 2*n2+3, 2*n2, 2*n2+1, 2*n1, 2*n1+1]
        self.edof = edof
        self.iK = np.kron(edof, np.ones((8, 1))).flatten()
        self.jK = np.kron(edof, np.ones((1, 8))).flatten()

    def node(self, elx, ely):
        return (NELY + 1) * elx + ely

    def solve(self, x, F, fixed, penal=3.0, emin=1e-9):
        xe = x.T.ravel()                            # element order el = ely + elx*nely  -> x[ely, elx]
        sK = ((self.KE.flatten()[np.newaxis]).T * (emin + xe**penal * (1 - emin))).flatten(order='F')
        K = coo_matrix((sK, (self.iK, self.jK)), shape=(self.ndof, self.ndof)).tocsc()
        free = np.setdiff1d(np.arange(self.ndof), fixed)
        U = np.zeros((self.ndof, F.shape[1]))
        Kf = K[free, :][:, free]
        for c in range(F.shape[1]):
            U[free, c] = spsolve(Kf, F[free, c])
        ce = np.zeros((NELY, NELX))
        for c in range(F.shape[1]):
            u = U[:, c]
            ce_c = (np.dot(u[self.edof].reshape(NELX * NELY, 8), self.KE) * u[self.edof].reshape(NELX * NELY, 8)).sum(1)
            ce += ce_c.reshape(NELX, NELY).T
        comp = float(((emin + xe**penal * (1 - emin)) * ce.T.ravel()).sum())
        return comp, ce


def loads_and_supports(fe, in_plate, yy, zz):
    """Supports: every node inside the shoulder hub (r <= 7). Loads at the wrist end edge nodes (y = 64):
    case 1 arm level: F/2 per plate down + the overhang couple; case 2 arm raised 85 deg: mostly axial."""
    nelx, nely = NELX, NELY
    fixed = []
    for elx in range(nelx + 1):
        for ely in range(nely + 1):
            y, z = Y0 + elx * H, Z1 - ely * H
            if math.hypot(y, z) <= 7.0:
                n = fe.node(elx, ely); fixed += [2 * n, 2 * n + 1]
    end_nodes = []
    for ely in range(nely + 1):
        z = Z1 - ely * H
        # plate end at y 64: only nodes that touch a plate cell (the end corners are filleted r 3)
        touch = (ely >= 1 and in_plate[ely - 1, nelx - 1]) or (ely <= nely - 1 and in_plate[ely, nelx - 1])
        if touch:
            end_nodes.append((fe.node(nelx, ely), z))
    Fp = F_PAYLOAD / 2.0
    F = np.zeros((fe.ndof, 2))
    n_end = len(end_nodes)
    zs = np.array([z for _, z in end_nodes]); zc = zs.mean()
    I = ((zs - zc)**2).sum()
    for (n, z) in end_nodes:
        # case 1: down (+v) + couple M = Fp * lever as a linear axial traction (top in tension: +u = +y)
        F[2 * n + 1, 0] += Fp / n_end
        F[2 * n, 0] += Fp * DECK_LEVER * (z - zc) / I
        # case 2: arm at 85 deg: gravity = (-sin85 along y, -cos85 along z) in the arm frame
        F[2 * n, 1] += -Fp * math.sin(math.radians(85)) / n_end
        F[2 * n + 1, 1] += Fp * math.cos(math.radians(85)) / n_end
        F[2 * n, 1] += Fp * math.cos(math.radians(85)) * DECK_LEVER * (z - zc) / I
    return F, np.array(sorted(set(fixed)))


def density_filter(rmin):
    nelx, nely = NELX, NELY
    r = int(math.ceil(rmin / H))
    iH, jH, sH = [], [], []
    for i in range(nelx):
        for j in range(nely):
            row = i * nely + j
            for k in range(max(i - r, 0), min(i + r + 1, nelx)):
                for l in range(max(j - r, 0), min(j + r + 1, nely)):
                    col = k * nely + l
                    fac = rmin / H - math.hypot(i - k, j - l)
                    if fac > 0:
                        iH.append(row); jH.append(col); sH.append(fac)
    Hm = coo_matrix((sH, (iH, jH)), shape=(nelx * nely, nelx * nely)).tocsc()
    Hs = np.asarray(Hm.sum(1)).ravel()
    return Hm, Hs


class AMFilter:
    """Langelaar's additive-manufacturing filter, build direction +z (row 0 is the top, the last row is the bed):
    a design cell can only be as dense as the smooth max of the three cells below it (45-degree self-support).
    Skin cells (fixed solid, inside the filtered span) use a wide stencil instead: one solid cell within +-K columns
    below is enough, which is the bridge rule (a flat ceiling up to 2K cells wide prints). Only 'filtered' cells
    obey a rule; the hub and the wrist block count as supported, outside cells as void."""
    P, EPS = 40.0, 1e-4
    def __init__(self, design, solid_fixed, in_plate, filtered=None, bridge_mm=12.0):
        self.design, self.solid_fixed, self.in_plate = design, solid_fixed, in_plate
        self.filtered = design if filtered is None else filtered
        self.wide = self.filtered & solid_fixed
        self.K = max(1, int(round(bridge_mm / H / 2)))
        self.Q3 = self.P + math.log(3) / math.log(0.5)
        self.QK = self.P + math.log(2 * self.K + 1) / math.log(0.5)
        self.win = np.ones(2 * self.K + 1)

    def forward(self, rho):
        nely, nelx = rho.shape
        xi = np.zeros_like(rho); self._cache = {}
        for i in range(nely - 1, -1, -1):
            if i == nely - 1:
                Si = np.ones(nelx); s3 = sK = None
            else:
                below = np.clip(xi[i + 1], 0, 1); bp = below**self.P
                s3 = bp + np.concatenate([[0.0], bp[:-1]]) + np.concatenate([bp[1:], [0.0]])
                sK = np.convolve(bp, self.win, 'same')
                Si = np.minimum(np.where(self.wide[i], sK**(1.0 / self.QK), s3**(1.0 / self.Q3)), 1.0)
            r = rho[i]
            d = r - Si
            root = np.sqrt(d * d + self.EPS)
            xi_i = 0.5 * (r + Si - root + math.sqrt(self.EPS))
            xi_i = np.where(self.filtered[i], xi_i, np.where(self.solid_fixed[i], 1.0, np.where(~self.in_plate[i], 0.0, r)))
            xi[i] = xi_i
            self._cache[i] = (s3, sK, d, root)
        self._xi = xi
        return xi

    def backward(self, dxi, rho):
        """dC/drho from dC/dxi, back-propagated through the layers from the top down."""
        nely, nelx = rho.shape
        lam = dxi.copy()
        drho = np.zeros_like(rho)
        for i in range(nely):
            s3, sK, d, root = self._cache[i]
            dxi_drho = 0.5 * (1.0 - d / root)
            dxi_dS = 0.5 * (1.0 + d / root)
            mask = self.filtered[i]
            drho[i] = np.where(self.design[i], np.where(mask, lam[i] * dxi_drho, lam[i]), 0.0)
            if i < nely - 1 and s3 is not None:
                g = np.where(mask, lam[i] * dxi_dS, 0.0)
                below = np.clip(self._xi[i + 1], 0, 1); bpm1 = below**(self.P - 1)
                with np.errstate(divide='ignore', invalid='ignore'):
                    b3 = np.where(s3 > 0, (1.0 / self.Q3) * np.power(np.maximum(s3, 1e-300), 1.0 / self.Q3 - 1.0) * self.P, 0.0)
                    bK = np.where(sK > 0, (1.0 / self.QK) * np.power(np.maximum(sK, 1e-300), 1.0 / self.QK - 1.0) * self.P, 0.0)
                c3 = np.where(self.wide[i], 0.0, g * b3)
                cK = np.where(self.wide[i], g * bK, 0.0)
                spread3 = c3 + np.concatenate([c3[1:], [0.0]]) + np.concatenate([[0.0], c3[:-1]])   # cells j-1, j, j+1 below
                spreadK = np.convolve(cK, self.win, 'same')
                lam[i + 1] += (spread3 + spreadK) * bpm1
        return drho


def optimize(fe, F, fixed, design, solid_fixed, in_plate, volfrac, iters=170, rmin=1.5, penal=3.0, weights=(1.0, 0.5), am=True):
    nelx, nely = NELX, NELY
    Hm, Hs = density_filter(rmin)
    x = np.full((nely, nelx), volfrac)
    x[~in_plate] = 0.0; x[solid_fixed] = 1.0
    yy_, _ = cell_centres()
    filtered = in_plate & (yy_ >= HUB_Y) & (yy_ <= WRIST_Y)
    amf = AMFilter(design, solid_fixed, in_plate, filtered) if am else None
    def physical(xv):
        rho = (Hm @ xv.T.ravel() / Hs).reshape(nelx, nely).T
        rho[~in_plate] = 0.0; rho[solid_fixed] = 1.0
        if amf is None:
            return rho, rho
        xi = amf.forward(rho); amf._xi_prev = xi
        return xi, rho
    xPhys, rho = physical(x)
    W = np.array(weights)
    for it in range(iters):
        comp_total, dc = 0.0, np.zeros((nely, nelx))
        xe = xPhys.T.ravel()
        # one assembly for both cases: compliance per case weighted
        sK = ((fe.KE.flatten()[np.newaxis]).T * (1e-9 + xe**penal * (1 - 1e-9))).flatten(order='F')
        K = coo_matrix((sK, (fe.iK, fe.jK)), shape=(fe.ndof, fe.ndof)).tocsc()
        free = np.setdiff1d(np.arange(fe.ndof), fixed)
        Kf = K[free, :][:, free]
        for c in range(F.shape[1]):
            U = np.zeros(fe.ndof); U[free] = spsolve(Kf, F[free, c])
            ue = U[fe.edof].reshape(nelx * nely, 8)
            ce = (np.dot(ue, fe.KE) * ue).sum(1).reshape(nelx, nely).T
            comp_total += W[c] * float(((1e-9 + xe**penal * (1 - 1e-9)) * ce.T.ravel()).sum())
            dc += -W[c] * penal * xPhys**(penal - 1) * (1 - 1e-9) * ce
        dv = np.ones((nely, nelx))
        if amf is not None:
            amf.forward(rho); amf._xi_prev = xPhys
            dc = amf.backward(dc, rho)
            dv = amf.backward(dv, rho)
        dc = (Hm.T @ (dc.T.ravel() / Hs)).reshape(nelx, nely).T
        dv = (Hm.T @ (dv.T.ravel() / Hs)).reshape(nelx, nely).T
        # OC update on the design cells only
        l1, l2, move = 0.0, 1e9, (0.2 if it < 110 else 0.08)
        target = volfrac * design.sum()
        while (l2 - l1) / (l1 + l2 + 1e-12) > 1e-3:
            lmid = 0.5 * (l1 + l2)
            xnew = np.maximum(0.0, np.maximum(x - move, np.minimum(1.0, np.minimum(x + move, x * np.sqrt(np.maximum(-dc, 1e-12) / np.maximum(dv, 1e-9) / lmid)))))
            xnew[~design] = x[~design]
            xPhys, rho = physical(xnew)
            if xPhys[design].sum() > target:
                l1 = lmid
            else:
                l2 = lmid
        change = np.abs(xnew - x).max()
        x = xnew
        if it % 20 == 0 or it == iters - 1:
            print('  it %3d  comp %.4f  vol %.3f  change %.3f' % (it, comp_total, xPhys[design].mean(), change))
        if change < 0.01 and it > 120:
            break
    return xPhys


def cleanup(solid, in_plate, solid_fixed):
    """Threshold -> minimum member / void sizes (morphology) -> fixed regions restored."""
    s = solid.astype(np.uint8)
    km = max(1, int(round(MIN_MEMBER / H)))
    kv = max(1, int(round(MIN_VOID / H)))
    s = cv2.morphologyEx(s, cv2.MORPH_OPEN, np.ones((km, km), np.uint8))       # drop thin struts
    v = (1 - s) & in_plate.astype(np.uint8)
    v = cv2.morphologyEx(v, cv2.MORPH_OPEN, np.ones((kv, kv), np.uint8))       # drop slivers of void
    s = (1 - v).astype(bool) & in_plate
    s[solid_fixed] = True
    s[~in_plate] = False
    return s


def printable(solid, in_plate, bridge_mm=12.0):
    """Top-down pass: a void cell is allowed only if an allowed void sits above-left, above or above-right
    (45-degree roofs). A fresh void ceiling may be flat if the run is at most bridge_mm wide (a bridge), otherwise
    only a 2-cell apex is kept there. Everything else becomes solid."""
    nely, nelx = solid.shape
    void = (~solid) & in_plate
    allowed = np.zeros_like(void)
    bridge_cells = int(round(bridge_mm / H))
    for i in range(nely):
        j = 0
        while j < nelx:
            if not void[i, j]:
                j += 1; continue
            a = j
            while j < nelx and void[i, j]:
                j += 1
            b = j - 1
            if i == 0:
                cand = np.zeros(b - a + 1, bool)
            else:
                above = allowed[i - 1]
                cand = np.array([above[max(k - 1, 0)] or above[k] or above[min(k + 1, nelx - 1)] for k in range(a, b + 1)])
            if not cand.any():
                if b - a + 1 <= bridge_cells:
                    cand[:] = True                      # bridge ceiling
                else:
                    mid = (a + b) // 2
                    for k in (mid, mid + 1):
                        if a <= k <= b:
                            cand[k - a] = True
            allowed[i, a:b + 1] = cand
    return solid | (void & ~allowed)


def clean_polygon(pts, notch_area=0.8, grid=0.5):
    """Drop vertices whose removal changes the area by less than notch_area mm2 (raster notches, near-collinear
    points), then snap to a grid and drop duplicates."""
    pts = [np.array(q, dtype=float) for q in pts]
    while len(pts) > 4:
        n = len(pts); best = None
        for i in range(n):
            a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
            da = abs(float(np.cross(b - a, c - a))) / 2
            if da < notch_area and (best is None or da < best[0]):
                best = (da, i)
        if best is None:
            break
        del pts[best[1]]
    out = []
    for q in pts:
        q = (round(q[0] / grid) * grid, round(q[1] / grid) * grid)
        if out and abs(q[0] - out[-1][0]) < 1e-9 and abs(q[1] - out[-1][1]) < 1e-9:
            continue
        out.append(q)
    if len(out) > 1 and abs(out[0][0] - out[-1][0]) < 1e-9 and abs(out[0][1] - out[-1][1]) < 1e-9:
        out.pop()
    return out


def void_polygons(solid, in_plate, eps_mm=0.3):
    """Void contours in plate (y, z) mm, simplified; only voids fully inside the plate (not the hub holes)."""
    void = ((~solid) & in_plate).astype(np.uint8)
    cnts, _ = cv2.findContours(void, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    polys = []
    for cnt in cnts:
        if cv2.contourArea(cnt) < (MIN_VOID / H)**2:
            continue
        ap = cv2.approxPolyDP(cnt, eps_mm / H, True).reshape(-1, 2)
        pts = [(Y0 + (c + 0.5) * H, Z1 - (r + 0.5) * H) for (c, r) in ap]
        polys.append(clean_polygon(pts))
    return polys


def evaluate(fe, F, fixed, solid, weights=(1.0, 0.5)):
    x = solid.astype(float)
    comp, ce = fe.solve(x, F, fixed)
    # per-case compliances
    out = []
    for c in range(F.shape[1]):
        cc, _ = fe.solve(x, F[:, [c]], fixed)
        out.append(cc)
    return out


def current_design(in_plate, yy, zz):
    s = in_plate.copy()
    for (y, z, h) in P.BOOM_WINDOWS:
        s &= ~((np.abs(yy - y) + np.abs(zz - z)) < h)
    return s


def main():
    vfs = [float(a) for a in sys.argv[1:]] or [0.60, 0.45]
    prof, in_plate, solid_fixed, design, yy, zz = build_domain()
    fe = FE()
    F, fixed = loads_and_supports(fe, in_plate, yy, zz)
    cur = current_design(in_plate, yy, zz)
    area_full = in_plate.sum() * H * H
    res = {'profile_area_mm2': area_full, 'current': {'area_mm2': float(cur.sum() * H * H), 'compliance': evaluate(fe, F, fixed, cur)}, 'variants': {}}
    full_c = evaluate(fe, F, fixed, in_plate)
    res['full_plate'] = {'area_mm2': area_full, 'compliance': full_c}
    print('profile %.0f mm2; current design %.0f mm2 (%.0f %%), compliance %s; full plate compliance %s' % (
        area_full, res['current']['area_mm2'], 100 * cur.sum() / in_plate.sum(), ['%.3f' % c for c in res['current']['compliance']], ['%.3f' % c for c in full_c]))
    layouts = {'current': cur}
    for vf in vfs:
        print('volume fraction %.2f of the design region (%d of %d plate cells are design cells), AM filter on' % (vf, design.sum(), in_plate.sum()))
        xPhys = optimize(fe, F, fixed, design, solid_fixed, in_plate, vf, am=True)
        s = cleanup(xPhys > 0.5, in_plate, solid_fixed)
        sp = printable(s, in_plate)
        polys = void_polygons(sp, in_plate)
        comp = evaluate(fe, F, fixed, sp)
        key = 'vf%.2f' % vf
        res['variants'][key] = {'area_mm2': float(sp.sum() * H * H), 'compliance': comp, 'voids': len(polys), 'polygons': polys}
        layouts[key] = (xPhys, sp)
        print('  -> printable layout: %.0f mm2 (%.0f %% of the profile), %d voids, compliance %s' % (
            sp.sum() * H * H, 100 * sp.sum() / in_plate.sum(), len(polys), ['%.3f' % c for c in comp]))
    json.dump(res, open('arm_topo_result.json', 'w'), indent=1)
    np.savez('arm_topo_layouts.npz', in_plate=in_plate, **{k: v[1] for k, v in layouts.items() if k != 'current'}, current=cur)
    plot(layouts, in_plate, prof)


def plot(layouts, in_plate, prof):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    keys = [k for k in layouts if k != 'current']
    n = 1 + 2 * len(keys)
    fig, axes = plt.subplots(n, 1, figsize=(10, 2.4 * n))
    ext = (Y0, Y1, Z0, Z1)
    def show(ax, img, title, cmap='gray_r'):
        ax.imshow(img, cmap=cmap, extent=ext, vmin=0, vmax=1, interpolation='nearest')
        ax.plot([p[0] for p in prof] + [prof[0][0]], [p[1] for p in prof] + [prof[0][1]], color='#e0a000', lw=1)
        ax.set_title(title, fontsize=10); ax.set_aspect('equal'); ax.set_xlabel('y along the arm, mm'); ax.set_ylabel('z, mm')
    show(axes[0], layouts['current'].astype(float), 'current plate: three diamond windows')
    i = 1
    for k in keys:
        xPhys, sp = layouts[k]
        show(axes[i], xPhys, '%s: optimized density (SIMP)' % k); i += 1
        show(axes[i], sp.astype(float), '%s: printable layout (45-degree roofs, min strut %.1f mm)' % (k, MIN_MEMBER)); i += 1
    plt.tight_layout()
    plt.savefig('arm_topo_preview.png', dpi=130)
    print('wrote arm_topo_preview.png and arm_topo_result.json')


if __name__ == '__main__':
    main()
