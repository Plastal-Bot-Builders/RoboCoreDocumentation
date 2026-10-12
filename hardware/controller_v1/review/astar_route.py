"""Tiny 2-layer A* router for the last few connections, using KiCad's own copper shapes for clearance.
usage: astar_route.py in.kicad_pcb out.kicad_pcb
Each job: net, start (x, y, layer), goal (x, y, layer), search window.
"""
import pcbnew, sys, heapq, math, collections
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
P = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))
F, B, IN1, IN2 = pcbnew.F_Cu, pcbnew.B_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu
W, CLR, VIA_D, VIA_H, STEP = 0.2, 0.2, 0.6, 0.3, 0.1
poly = pcbnew.SHAPE_POLY_SET(); b.GetBoardPolygonOutlines(poly, False); edge = poly.COutline(0)
keep = []

def obstacles(net, win):
    items = []
    for it in list(b.GetTracks()) + [p for f in b.GetFootprints() for p in f.Pads()]:
        if it.GetNetname() == net and it.GetNetCode() > 0: continue
        bb = it.GetBoundingBox()
        if bb.GetRight() < MM(win[0] - 1) or bb.GetLeft() > MM(win[2] + 1) or bb.GetBottom() < MM(win[1] - 1) or bb.GetTop() > MM(win[3] + 1): continue
        items.append(it)
    return items

def route(net, start, goal, win):
    obs = obstacles(net, win)
    nx, ny = int((win[2] - win[0]) / STEP) + 1, int((win[3] - win[1]) / STEP) + 1
    def xy(i, j): return win[0] + i * STEP, win[1] + j * STEP
    cache = {}
    def free(i, j, layer, r):
        k = (i, j, layer, r)
        if k in cache: return cache[k]
        x, y = xy(i, j); c = P(x, y); circ = pcbnew.SHAPE_CIRCLE(c, MM(r))
        ok = poly.Contains(c) and edge.SquaredDistance(c, True) > MM(r + 0.25 - CLR) ** 2
        if ok:
            for it in obs:
                layers = (layer,) if layer != "via" else (F, IN1, IN2, B)
                for L in layers:
                    if it.IsOnLayer(L) and it.GetEffectiveShape(L).Collide(circ, MM(CLR)): ok = False; break
                if not ok: break
                if layer == "via" and isinstance(it, pcbnew.PAD) and it.HasHole() and \
                   it.GetEffectiveHoleShape().Collide(pcbnew.SHAPE_CIRCLE(c, MM(VIA_H / 2)), MM(0.35)): ok = False; break
        cache[k] = ok; return ok
    snap = lambda x, y: (round((x - win[0]) / STEP), round((y - win[1]) / STEP))
    s, g = snap(*start[:2]), snap(*goal[:2])
    S, G = (s[0], s[1], start[2]), (g[0], g[1], goal[2])
    h = lambda n: math.hypot(n[0] - G[0], n[1] - G[1]) + (0 if n[2] == G[2] else 15)
    openq = [(h(S), 0, S)]; came = {S: None}; cost = {S: 0}
    near_end = lambda n, e: abs(n[0] - e[0]) <= 4 and abs(n[1] - e[1]) <= 4 and n[2] == e[2]   # pads: allow the last 0.4 mm
    while openq:
        _, cst, n = heapq.heappop(openq)
        if n == G: break
        i, j, L = n
        nbrs = []
        for di, dj in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            m = (i + di, j + dj, L)
            if not (0 <= m[0] < nx and 0 <= m[1] < ny): continue
            if near_end(m, G) or near_end(m, S) or free(m[0], m[1], L, W / 2):
                nbrs.append((m, math.hypot(di, dj)))
        other = B if L == F else F
        if not near_end(n, S) and free(i, j, "via", VIA_D / 2): nbrs.append(((i, j, other), 20))
        for m, w in nbrs:
            nc = cst + w
            if nc < cost.get(m, 1e18):
                cost[m] = nc; came[m] = n; heapq.heappush(openq, (nc + h(m), nc, m))
    if G not in came: print(f"  {net}: no route found in window"); return False
    path = []; n = G
    while n is not None: path.append(n); n = came[n]
    path.reverse()
    # emit tracks/vias, merging straight runs
    pts = [(start[0], start[1], start[2])] + [(*xy(i, j), L) for i, j, L in path[1:-1]] + [(goal[0], goal[1], goal[2])]
    segs = 0; vias = 0
    run = [pts[0]]
    def seg_free(a, c, L):
        if abs(a[0] - c[0]) < 1e-6 and abs(a[1] - c[1]) < 1e-6: return True
        sh = pcbnew.SHAPE_SEGMENT(P(a[0], a[1]), P(c[0], c[1]), MM(W))
        n = max(2, int(math.hypot(c[0] - a[0], c[1] - a[1]) / 0.2) + 1)
        for k in range(n + 1):
            q = P(a[0] + (c[0] - a[0]) * k / n, a[1] + (c[1] - a[1]) * k / n)
            if not poly.Contains(q) or edge.SquaredDistance(q, True) <= MM(W / 2 + 0.25) ** 2: return False
        lo_x, hi_x = MM(min(a[0], c[0]) - 1), MM(max(a[0], c[0]) + 1); lo_y, hi_y = MM(min(a[1], c[1]) - 1), MM(max(a[1], c[1]) + 1)
        for it in obs:
            if not it.IsOnLayer(L): continue
            bb = it.GetBoundingBox()
            if bb.GetRight() < lo_x or bb.GetLeft() > hi_x or bb.GetBottom() < lo_y or bb.GetTop() > hi_y: continue
            if it.GetEffectiveShape(L).Collide(sh, MM(CLR)): return False
        return True
    def octi(a, c, L):
        # one or two 45-degree segments from a to c that clear every obstacle, else None
        dx, dy = c[0] - a[0], c[1] - a[1]
        if abs(dx) < 1e-6 or abs(dy) < 1e-6 or abs(abs(dx) - abs(dy)) < 1e-6:
            return [a, c] if seg_free(a, c, L) else None
        d = min(abs(dx), abs(dy)); sx, sy = math.copysign(1, dx), math.copysign(1, dy)
        for m in ((a[0] + sx * d, a[1] + sy * d), (c[0] - sx * d, c[1] - sy * d)):
            if seg_free(a, m, L) and seg_free(m, c, L): return [a, m, c]
        return None
    def flush(run):
        nonlocal segs
        L0 = run[0][2]; pts2 = [(x, y) for x, y, _ in run]
        out = [pts2[0]]; i = 0
        while i < len(pts2) - 1:
            for j in range(len(pts2) - 1, i, -1):
                legs = octi(pts2[i], pts2[j], L0) if j > i + 1 else None
                if legs: out += legs[1:]; i = j; break
                if j == i + 1: out.append(pts2[j]); i = j; break
        simp = [(*out[0], L0)]
        for k in range(1, len(out) - 1):
            (x0, y0, _), (x1, y1), (x2, y2) = simp[-1], out[k], out[k + 1]
            if abs((x1 - x0) * (y2 - y1) - (y1 - y0) * (x2 - x1)) > 1e-6: simp.append((x1, y1, L0))
        simp.append((*out[-1], L0))
        for (x1, y1, L), (x2, y2, _) in zip(simp, simp[1:]):
            if abs(x1 - x2) < 1e-6 and abs(y1 - y2) < 1e-6: continue
            t = pcbnew.PCB_TRACK(b); t.SetStart(P(x1, y1)); t.SetEnd(P(x2, y2)); t.SetWidth(MM(W)); t.SetLayer(L)
            t.SetNet(b.FindNet(net)); b.Add(t); keep.append(t); segs += 1
    for k in range(1, len(pts)):
        if pts[k][2] != pts[k - 1][2]:
            flush(run)
            x, y = pts[k - 1][0], pts[k - 1][1]
            v = pcbnew.PCB_VIA(b); v.SetPosition(P(x, y)); v.SetWidth(F, MM(VIA_D)); v.SetDrill(MM(VIA_H)); v.SetLayerPair(F, B)
            b.Add(v); v.SetNet(b.FindNet(net)); v.SetIsFree(True); keep.append(v); vias += 1
            run = [(x, y, pts[k][2]), pts[k]]
        else:
            run.append(pts[k])
    flush(run)
    print(f"  {net}: routed, {segs} segments, {vias} vias")
    return True

import json
drc = json.load(open(sys.argv[3]))
byid = {}
for it in list(b.GetTracks()) + [p for f in b.GetFootprints() for p in f.Pads()]:
    byid[it.m_Uuid.AsString()] = it
def cands(it):
    if isinstance(it, pcbnew.PAD):
        lay = B if it.GetParentFootprint().IsFlipped() and not it.HasHole() else F
        q = it.GetPosition(); return [(mm(q.x), mm(q.y), lay)]
    if it.Type() == pcbnew.PCB_VIA_T:
        q = it.GetPosition(); return [(mm(q.x), mm(q.y), F)]
    return [(mm(p.x), mm(p.y), it.GetLayer()) for p in (it.GetStart(), it.GetEnd())]
jobs = []
for u in drc["unconnected_items"]:
    its = [byid.get(i.get("uuid")) for i in u["items"]]
    if any(i is None for i in its): print("  skip (zone or unknown):", [i["description"][:40] for i in u["items"]]); continue
    best = min(((p, q) for p in cands(its[0]) for q in cands(its[1])), key=lambda pq: math.hypot(pq[0][0] - pq[1][0], pq[0][1] - pq[1][1]))
    (x1, y1, _), (x2, y2, _) = best
    win = (min(x1, x2) - 4, min(y1, y2) - 4, max(x1, x2) + 4, max(y1, y2) + 4)
    jobs.append((its[0].GetNetname(), best[0], best[1], win))
for j in jobs: route(*j)
pcbnew.SaveBoard(sys.argv[2], b)
