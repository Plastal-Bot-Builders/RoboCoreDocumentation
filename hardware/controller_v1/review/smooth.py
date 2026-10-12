"""Straighten staircase track chains (left by grid routers) into 45-degree runs.
Only chains whose inner joints are plain track-to-track bends (no via, pad or branch) are touched;
endpoints, width and layer stay the same, and a replacement is used only if it clears every other net by CLR.
usage: smooth.py in.kicad_pcb out.kicad_pcb
"""
import pcbnew, sys, math, collections
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
P = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))
CLR = 0.2
poly = pcbnew.SHAPE_POLY_SET(); b.GetBoardPolygonOutlines(poly, False); edge = poly.COutline(0)
pads = [p for f in b.GetFootprints() for p in f.Pads()]
tracks = [t for t in b.GetTracks() if t.Type() != pcbnew.PCB_VIA_T]
vias = [t for t in b.GetTracks() if t.Type() == pcbnew.PCB_VIA_T]
key = lambda v: (round(mm(v.x), 3), round(mm(v.y), 3))
U = {id(o): o.m_Uuid.AsString() for o in tracks + vias + pads}   # deleted wrappers can no longer be asked for their uuid
u = lambda o: U[id(o)]
alive = {u(t): t for t in tracks}
keep = []; stats = collections.Counter()

def seg_free(a, c, L, W, net, skip):
    if abs(a[0] - c[0]) < 1e-6 and abs(a[1] - c[1]) < 1e-6: return True
    sh = pcbnew.SHAPE_SEGMENT(P(*a), P(*c), MM(W))
    n = max(2, int(math.hypot(c[0] - a[0], c[1] - a[1]) / 0.2) + 1)
    for k in range(n + 1):
        q = P(a[0] + (c[0] - a[0]) * k / n, a[1] + (c[1] - a[1]) * k / n)
        if not poly.Contains(q) or edge.SquaredDistance(q, True) <= MM(W / 2 + 0.25) ** 2: return False
    lo_x, hi_x = MM(min(a[0], c[0]) - 1.5), MM(max(a[0], c[0]) + 1.5); lo_y, hi_y = MM(min(a[1], c[1]) - 1.5), MM(max(a[1], c[1]) + 1.5)
    for it in list(alive.values()) + vias + pads:
        if it.GetNetCode() == net and net > 0: continue
        if u(it) in skip: continue
        bb = it.GetBoundingBox()
        if bb.GetRight() < lo_x or bb.GetLeft() > hi_x or bb.GetBottom() < lo_y or bb.GetTop() > hi_y: continue
        if it.IsOnLayer(L) and it.GetEffectiveShape(L).Collide(sh, MM(CLR)): return False
        if isinstance(it, pcbnew.PAD) and it.HasHole() and it.GetEffectiveHoleShape().Collide(sh, MM(0.25)): return False
    return True
def octi(a, c, *k):
    dx, dy = c[0] - a[0], c[1] - a[1]
    if abs(dx) < 1e-6 or abs(dy) < 1e-6 or abs(abs(dx) - abs(dy)) < 1e-6:
        return [a, c] if seg_free(a, c, *k) else None
    d = min(abs(dx), abs(dy)); sx, sy = math.copysign(1, dx), math.copysign(1, dy)
    for m in ((a[0] + sx * d, a[1] + sy * d), (c[0] - sx * d, c[1] - sy * d)):
        if seg_free(a, m, *k) and seg_free(m, c, *k): return [a, m, c]
    return None

# group by (net, layer); node degree; anchors = via / pad positions
by = collections.defaultdict(list)
for t in tracks: by[(t.GetNetCode(), t.GetLayer())].append(t)
removed_ids = set()
for (net, L), ts in by.items():
    if net <= 0: continue
    deg = collections.Counter(); adj = collections.defaultdict(list)
    for t in ts:
        for e in (t.GetStart(), t.GetEnd()): deg[key(e)] += 1; adj[key(e)].append(t)
    def anchor(k):
        q = P(*k)
        return deg[k] != 2 or any(v.GetNetCode() == net and v.HitTest(q) for v in vias) or \
               any(p.GetNetCode() == net and p.IsOnLayer(L) and p.HitTest(q) for p in pads)
    done = set()
    for t0 in ts:
        if u(t0) in done: continue
        # grow the chain both ways through plain bends
        chain = [t0]; done.add(u(t0))
        ends = [key(t0.GetStart()), key(t0.GetEnd())]
        for side in (0, 1):
            while not anchor(ends[side]):
                nxt = [t for t in adj[ends[side]] if u(t) not in done]
                if len(nxt) != 1: break
                t = nxt[0]; done.add(u(t))
                other = key(t.GetEnd()) if key(t.GetStart()) == ends[side] else key(t.GetStart())
                chain.insert(0 if side == 0 else len(chain), t); ends[side] = other
        if len(chain) < 4 or len({c.GetWidth() for c in chain}) != 1: continue
        if not any(mm(c.GetLength()) < 0.25 for c in chain): continue
        # ordered points from ends[0] to ends[1]
        pts = [ends[0]]; cur = ends[0]; pool = list(chain)
        while pool:
            t = next(t for t in pool if cur in (key(t.GetStart()), key(t.GetEnd())))
            pool.remove(t); cur = key(t.GetEnd()) if key(t.GetStart()) == cur else key(t.GetStart()); pts.append(cur)
        W = mm(chain[0].GetWidth()); skip = {u(c) for c in chain}
        out = [pts[0]]; i = 0
        while i < len(pts) - 1:
            for j in range(len(pts) - 1, i, -1):
                legs = octi(pts[i], pts[j], L, W, net, skip) if j > i + 1 else None
                if legs: out += legs[1:]; i = j; break
                if j == i + 1: out.append(pts[j]); i = j; break
        simp = [out[0]]
        for k in range(1, len(out) - 1):
            (x0, y0), (x1, y1), (x2, y2) = simp[-1], out[k], out[k + 1]
            if abs((x1 - x0) * (y2 - y1) - (y1 - y0) * (x2 - x1)) > 1e-6: simp.append(out[k])
        simp.append(out[-1])
        simp = [p for k, p in enumerate(simp) if k == 0 or p != simp[k - 1]]
        if len(simp) - 1 >= len(chain): continue
        netobj = chain[0].GetNet()
        for c in chain: alive.pop(u(c)); b.Delete(c)
        for a, c in zip(simp, simp[1:]):
            t = pcbnew.PCB_TRACK(b); t.SetStart(P(*a)); t.SetEnd(P(*c)); t.SetWidth(MM(W)); t.SetLayer(L); t.SetNet(netobj); b.Add(t); keep.append(t)
            U[id(t)] = t.m_Uuid.AsString(); alive[u(t)] = t
        stats[netobj.GetNetname()] += len(chain) - (len(simp) - 1)
for n, c in stats.most_common(): print(f"  {n}: {c} segments fewer")
pcbnew.SaveBoard(sys.argv[2], b)
