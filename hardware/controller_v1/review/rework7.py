"""Stage 7: move the battery-sense filter (R40, C33) and GPIO2 pull-up (R33) off the bottom-side artwork.
usage: rework7.py in.kicad_pcb out.kicad_pcb
"""
import pcbnew, sys, math
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
P = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))
F, B = pcbnew.F_Cu, pcbnew.B_Cu
LAYERS = (F, pcbnew.In1_Cu, pcbnew.In2_Cu, B)
keep = []
uid = lambda o: o.m_Uuid.AsString()
fp = b.FindFootprintByReference
# sense pads of R40 and C33 face each other; free strip on the bottom between the two motor drivers
MOVE = {"R40": (151.4, 93.2, 180), "C33": (155.0, 93.2, 0), "R33": (158.6, 93.2, 0)}
# 1. drop the bottom copper that served the old positions, and the vias those tracks ended on
ends = []
for ref in MOVE:
    for p in fp(ref).Pads():
        for t in list(b.GetTracks()):
            if t.Type() != pcbnew.PCB_VIA_T and t.GetLayer() == B and (p.HitTest(t.GetStart()) or p.HitTest(t.GetEnd())):
                ends += [t.GetStart(), t.GetEnd()]; b.Delete(t)
for t in list(b.GetTracks()):
    if t.Type() == pcbnew.PCB_VIA_T and any(t.HitTest(e) for e in ends) and \
       not any(o.Type() != pcbnew.PCB_VIA_T and (t.HitTest(o.GetStart()) or t.HitTest(o.GetEnd())) and o.GetNetCode() == t.GetNetCode() for o in b.GetTracks()):
        b.Delete(t)
for ref, (x, y, r) in MOVE.items():
    f = fp(ref); f.SetOrientationDegrees(r); f.SetPosition(P(x, y))
def connected(t, pt, layer):
    me = uid(t)
    for o in b.GetTracks():
        if uid(o) == me or o.GetNetCode() != t.GetNetCode(): continue
        if o.Type() == pcbnew.PCB_VIA_T:
            if o.HitTest(pt): return True
        elif o.GetLayer() == layer and o.HitTest(pt, 0): return True
    for f in b.GetFootprints():
        for p in f.Pads():
            if p.GetNetCode() == t.GetNetCode() and p.IsOnLayer(layer) and p.HitTest(pt): return True
    for z in b.Zones():
        if z.GetNetCode() == t.GetNetCode() and z.IsOnLayer(layer) and z.HitTestFilledArea(layer, pt): return True
    return False
def leaf_via(v):
    # a via that only one track (plus stubs that lie inside it) leads to, with no pad: a dead end
    inner, real = [], 0
    for o in b.GetTracks():
        if o.Type() == pcbnew.PCB_VIA_T or o.GetNetCode() != v.GetNetCode(): continue
        hs, he = v.HitTest(o.GetStart()), v.HitTest(o.GetEnd())
        if hs and he: inner.append(o)
        elif hs or he: real += 1
    pads = sum(1 for f in b.GetFootprints() for p in f.Pads() if p.GetNetCode() == v.GetNetCode() and p.HitTest(v.GetPosition()))
    return (real + pads < 2), inner
SIGNAL = ("/ESP32_BOARD_CONNECTION/VBAT_SENSE", "/ESP32_BOARD_CONNECTION/DIR_A")
n = 0
for _ in range(20):
    dead = [t for t in b.GetTracks() if t.Type() != pcbnew.PCB_VIA_T and not (connected(t, t.GetStart(), t.GetLayer()) and connected(t, t.GetEnd(), t.GetLayer()))]
    for t in b.GetTracks():
        if t.Type() == pcbnew.PCB_VIA_T and t.GetNetname() in SIGNAL:
            leaf, inner = leaf_via(t)
            if leaf: dead += [t] + inner
    seen = set(); dead = [t for t in dead if not (uid(t) in seen or seen.add(uid(t)))]
    if not dead: break
    for t in dead: b.Delete(t); n += 1
print("stale copper removed:", n)
# 2. plane ties at the new spot (GND for R40/C33, +3.3V for R33)
def clear_at(net, x, y, d=0.6):
    c = P(x, y); r = MM(d / 2)
    for it in list(b.GetTracks()) + [p for f in b.GetFootprints() for p in f.Pads()]:
        if it.GetNetname() == net: continue
        bb = it.GetBoundingBox()
        if bb.GetLeft() - r - MM(1) > c.x or bb.GetRight() + r + MM(1) < c.x or bb.GetTop() - r - MM(1) > c.y or bb.GetBottom() + r + MM(1) < c.y: continue
        for layer in LAYERS:
            if it.IsOnLayer(layer) and it.GetEffectiveShape(layer).Collide(pcbnew.SHAPE_CIRCLE(c, r), MM(0.2)): return False
        if isinstance(it, pcbnew.PAD) and it.HasHole() and it.GetEffectiveHoleShape().Collide(pcbnew.SHAPE_CIRCLE(c, r), MM(0.3)): return False
    return True
def tie(ref, num):
    p = next(p for p in fp(ref).Pads() if p.GetNumber() == num); q = p.GetPosition(); c = fp(ref).GetPosition()
    vx, vy = mm(q.x - c.x), mm(q.y - c.y); L = math.hypot(vx, vy) or 1
    for rr in [1.0 + k * 0.1 for k in range(12)]:
        for ang in [0, 25, -25, 50, -50, 75, -75, 100, -100]:
            a = math.atan2(vy, vx) + math.radians(ang)
            x, y = round(mm(q.x) + rr * math.cos(a), 2), round(mm(q.y) + rr * math.sin(a), 2)
            if clear_at(p.GetNetname(), x, y):
                v = pcbnew.PCB_VIA(b); v.SetPosition(P(x, y)); v.SetWidth(F, MM(0.6)); v.SetDrill(MM(0.3)); v.SetLayerPair(F, B)
                b.Add(v); v.SetNet(p.GetNet()); v.SetIsFree(True); keep.append(v)
                t = pcbnew.PCB_TRACK(b); t.SetStart(q); t.SetEnd(P(x, y)); t.SetWidth(MM(0.3)); t.SetLayer(B); t.SetNet(p.GetNet()); b.Add(t); keep.append(t)
                return
    print("  no tie spot for", ref, num)
for ref in ("R40", "C33"):
    tie(ref, next(p.GetNumber() for p in fp(ref).Pads() if p.GetNetname() == "GND"))
tie("R33", next(p.GetNumber() for p in fp("R33").Pads() if p.GetNetname() == "+3.3V"))
# R40 and C33 share VBAT_SENSE: join their sense pads directly
a = next(p for p in fp("R40").Pads() if p.GetNetname().endswith("VBAT_SENSE")).GetPosition()
c = next(p for p in fp("C33").Pads() if p.GetNetname().endswith("VBAT_SENSE")).GetPosition()
if abs(a.y - c.y) < MM(0.01):
    t = pcbnew.PCB_TRACK(b); t.SetStart(a); t.SetEnd(c); t.SetWidth(MM(0.25)); t.SetLayer(B)
    t.SetNet(b.FindNet("/ESP32_BOARD_CONNECTION/VBAT_SENSE")); b.Add(t); keep.append(t)
pcbnew.SaveBoard(sys.argv[2], b)
