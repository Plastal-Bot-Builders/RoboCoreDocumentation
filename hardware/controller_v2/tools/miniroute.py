"""Small grid router (A*) for the last few connections Freerouting leaves open.

Routes one net at a time between its stray island and its main body on F.Cu / In2.Cu / B.Cu, changing layer through
0.6/0.3 mm vias. Obstacles are other nets' pads, tracks and vias (with the clearance rule), the board edge and the
keepout areas; copper pours are ignored (they refill around the new copper).
"""
import heapq
import math
import pcbnew

MM = pcbnew.FromMM
LAYERS = (pcbnew.F_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)


def _seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0.0 if L == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


class Grid:
    def __init__(self, board, net, window, width, clr, on_board, step=0.1, via_d=0.6):
        self.b, self.net, self.step = board, net, step
        self.x0, self.y0, x1, y1 = window
        self.nx = int((x1 - self.x0) / step) + 1
        self.ny = int((y1 - self.y0) / step) + 1
        self.width, self.clr, self.via_d = width, clr, via_d
        n = self.nx * self.ny
        self.block = {l: bytearray(n) for l in LAYERS}       # track centre not allowed
        self.vblock = {l: bytearray(n) for l in LAYERS}      # via centre not allowed
        for j in range(self.ny):                              # board edge
            for i in range(self.nx):
                x, y = self.x0 + i * step, self.y0 + j * step
                if not on_board(x, y, 0.35 + width / 2):
                    for l in LAYERS:
                        self.block[l][j * self.nx + i] = 1
                if not on_board(x, y, 0.35 + via_d / 2):
                    for l in LAYERS:
                        self.vblock[l][j * self.nx + i] = 1
        for fp in board.GetFootprints():
            for p in fp.Pads():
                if p.GetNetCode() == net:
                    continue
                bb = p.GetBoundingBox()
                r = (pcbnew.ToMM(bb.GetLeft()), pcbnew.ToMM(bb.GetTop()), pcbnew.ToMM(bb.GetRight()), pcbnew.ToMM(bb.GetBottom()))
                for l in LAYERS:
                    if p.IsOnLayer(l) or p.GetAttribute() in (pcbnew.PAD_ATTRIB_PTH, pcbnew.PAD_ATTRIB_NPTH):
                        self._rect(l, r, clr + width / 2, clr + via_d / 2)
        for t in board.GetTracks():
            if t.GetNetCode() == net:
                continue
            if t.Type() == pcbnew.PCB_VIA_T:
                x, y = pcbnew.ToMM(t.GetPosition().x), pcbnew.ToMM(t.GetPosition().y)
                rr = pcbnew.ToMM(t.GetWidth()) / 2
                for l in LAYERS:
                    self._seg(l, x, y, x, y, rr, clr + width / 2, clr + via_d / 2)
            else:
                l = t.GetLayer()
                if l not in LAYERS:
                    continue
                s, e = t.GetStart(), t.GetEnd()
                self._seg(l, pcbnew.ToMM(s.x), pcbnew.ToMM(s.y), pcbnew.ToMM(e.x), pcbnew.ToMM(e.y),
                          pcbnew.ToMM(t.GetWidth()) / 2, clr + width / 2, clr + via_d / 2)
        for z in board.Zones():                                # keepouts
            if z.GetIsRuleArea() and z.GetDoNotAllowTracks():
                bb = z.GetBoundingBox()
                r = (pcbnew.ToMM(bb.GetLeft()), pcbnew.ToMM(bb.GetTop()), pcbnew.ToMM(bb.GetRight()), pcbnew.ToMM(bb.GetBottom()))
                for l in LAYERS:
                    self._rect(l, r, width / 2, via_d / 2)

    def _cells(self, x0, y0, x1, y1):
        i0 = max(0, int((x0 - self.x0) / self.step)); i1 = min(self.nx - 1, int((x1 - self.x0) / self.step) + 1)
        j0 = max(0, int((y0 - self.y0) / self.step)); j1 = min(self.ny - 1, int((y1 - self.y0) / self.step) + 1)
        for j in range(j0, j1 + 1):
            for i in range(i0, i1 + 1):
                yield i, j, self.x0 + i * self.step, self.y0 + j * self.step

    def _rect(self, l, r, gt, gv):
        g = max(gt, gv)
        for i, j, x, y in self._cells(r[0] - g, r[1] - g, r[2] + g, r[3] + g):
            dx = max(r[0] - x, 0, x - r[2]); dy = max(r[1] - y, 0, y - r[3])
            d = math.hypot(dx, dy)
            k = j * self.nx + i
            if d < gt:
                self.block[l][k] = 1
            if d < gv:
                self.vblock[l][k] = 1

    def _seg(self, l, ax, ay, bx, by, rad, gt, gv):
        g = rad + max(gt, gv)
        for i, j, x, y in self._cells(min(ax, bx) - g, min(ay, by) - g, max(ax, bx) + g, max(ay, by) + g):
            d = _seg_dist(x, y, ax, ay, bx, by) - rad
            k = j * self.nx + i
            if d < gt:
                self.block[l][k] = 1
            if d < gv:
                self.vblock[l][k] = 1

    def open_pad(self, pad):
        """Cells over a terminal pad itself are free (same net), so a track can leave a fine-pitch pin along it."""
        bb = pad.GetBoundingBox()
        r = (pcbnew.ToMM(bb.GetLeft()), pcbnew.ToMM(bb.GetTop()), pcbnew.ToMM(bb.GetRight()), pcbnew.ToMM(bb.GetBottom()))
        for i, j, x, y in self._cells(r[0], r[1], r[2], r[3]):
            for l in LAYERS:
                if pad.IsOnLayer(l):
                    self.block[l][j * self.nx + i] = 0

    def cell(self, x, y):
        return int(round((x - self.x0) / self.step)), int(round((y - self.y0) / self.step))

    def route(self, starts, goals, via_cost=40, max_nodes=2_000_000):
        """starts / goals: lists of (x_mm, y_mm, layer). Returns [(x, y, layer), ...] or None."""
        goal = {}
        for x, y, l in goals:
            i, j = self.cell(x, y)
            goal[(i, j, l)] = 1
        gl = [(self.cell(x, y), l) for x, y, l in goals]
        def h(i, j):
            return min(math.hypot(i - gi, j - gj) for (gi, gj), _ in gl)
        openq, came, cost = [], {}, {}
        for x, y, l in starts:
            i, j = self.cell(x, y)
            st = (i, j, l)
            cost[st] = 0
            heapq.heappush(openq, (h(i, j), 0, st))
        moves = [(1, 0, 1), (-1, 0, 1), (0, 1, 1), (0, -1, 1), (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)]
        n = 0
        while openq and n < max_nodes:
            f, g, cur = heapq.heappop(openq)
            n += 1
            if cur in goal:
                path = [cur]
                while cur in came:
                    cur = came[cur]
                    path.append(cur)
                return [(self.x0 + i * self.step, self.y0 + j * self.step, l) for i, j, l in reversed(path)]
            if g > cost.get(cur, 1e18):
                continue
            i, j, l = cur
            for di, dj, c in moves:
                ni, nj = i + di, j + dj
                if not (0 <= ni < self.nx and 0 <= nj < self.ny):
                    continue
                k = nj * self.nx + ni
                nxt = (ni, nj, l)
                if self.block[l][k] and nxt not in goal:
                    continue
                ng = g + c
                if ng < cost.get(nxt, 1e18):
                    cost[nxt] = ng; came[nxt] = cur
                    heapq.heappush(openq, (ng + h(ni, nj), ng, nxt))
            k = j * self.nx + i
            if all(not self.vblock[ll][k] for ll in LAYERS):          # layer change through a via here
                for ll in LAYERS:
                    if ll == l:
                        continue
                    nxt = (i, j, ll)
                    ng = g + via_cost
                    if ng < cost.get(nxt, 1e18):
                        cost[nxt] = ng; came[nxt] = cur
                        heapq.heappush(openq, (ng + h(i, j), ng, nxt))
        return None


def commit(board, net, path, width, start_pt=None, end_pt=None):
    """Turn a grid path into tracks and vias (collinear runs merged); exact pad/via points at both ends."""
    pts = [(pcbnew.VECTOR2I(MM(x), MM(y)), l) for x, y, l in path]
    if start_pt is not None:
        pts[0] = (start_pt, pts[0][1])
    if end_pt is not None:
        pts[-1] = (end_pt, pts[-1][1])
    made = 0
    run = [pts[0]]
    def flush(run):
        nonlocal made
        if len(run) < 2:
            return
        simp = [run[0]]
        for p in run[1:]:
            if len(simp) >= 2:
                a, b = simp[-2][0], simp[-1][0]
                if (b.x - a.x) * (p[0].y - a.y) == (b.y - a.y) * (p[0].x - a.x):
                    simp[-1] = p
                    continue
            simp.append(p)
        for (a, l), (b, _) in zip(simp, simp[1:]):
            if a == b:
                continue
            t = pcbnew.PCB_TRACK(board)
            t.SetStart(a); t.SetEnd(b); t.SetWidth(MM(width)); t.SetLayer(l); t.SetNetCode(net)
            board.Add(t)
            made += 1
    for p in pts[1:]:
        if p[1] != run[-1][1]:
            flush(run)
            v = pcbnew.PCB_VIA(board)
            v.SetPosition(run[-1][0]); v.SetWidth(MM(0.6)); v.SetDrill(MM(0.3)); v.SetNetCode(net)
            board.Add(v)
            run = [(run[-1][0], p[1])]
        run.append(p)
    flush(run)
    return made
