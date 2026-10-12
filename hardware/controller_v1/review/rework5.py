"""Stage 5 (after the first routing pass): fix hand-made ties, remove stubs, stitch isolated GND pour islands.
usage: rework5.py in.kicad_pcb out.kicad_pcb
"""
import pcbnew, sys, math
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
P = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))
F, B = pcbnew.F_Cu, pcbnew.B_Cu
LAYERS = (F, pcbnew.In1_Cu, pcbnew.In2_Cu, B)
keep = []
uid = lambda it: it.m_Uuid.AsString()
def fp(r): return b.FindFootprintByReference(r)
def pad(r, n): return next(p for p in fp(r).Pads() if p.GetNumber() == n)
def track(net, layer, pts, w):
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        t = pcbnew.PCB_TRACK(b); t.SetStart(P(x1, y1)); t.SetEnd(P(x2, y2)); t.SetWidth(MM(w)); t.SetLayer(layer)
        t.SetNet(b.FindNet(net)); b.Add(t); keep.append(t)
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
def via(net, x, y, search=1.0):
    for rr in [0] + [k * 0.1 for k in range(1, int(search / 0.1) + 1)]:
        for ang in range(0, 360, 20 if rr else 360):
            px, py = round(x + rr * math.cos(math.radians(ang)), 2), round(y + rr * math.sin(math.radians(ang)), 2)
            if clear_at(net, px, py):
                v = pcbnew.PCB_VIA(b); v.SetPosition(P(px, py)); v.SetWidth(F, MM(0.6)); v.SetDrill(MM(0.3)); v.SetLayerPair(F, B)
                b.Add(v); v.SetNet(b.FindNet(net)); v.SetIsFree(True); keep.append(v); return (px, py)
    print("  no via spot near", net, (x, y)); return None
def tracks_touching(p, net=None, layer=None):
    out = []
    for t in b.GetTracks():
        if t.Type() == pcbnew.PCB_VIA_T: continue
        if net and t.GetNetname() != net: continue
        if layer is not None and t.GetLayer() != layer: continue
        if p.HitTest(t.GetStart()) or p.HitTest(t.GetEnd()): out.append(t)
    return out

# 1. CP2102N pin 2: straight into the exposed pad
p2 = pad("U2", "2")
for t in tracks_touching(p2, "GND", F): b.Delete(t)
q = p2.GetPosition(); track("GND", F, [(mm(q.x), mm(q.y)), (mm(q.x), mm(q.y) - 0.85)], 0.2)

# 2. MPU-6050 AD0 (pin 9) -> GND: 0.2 mm straight out between pins 8 and 10, then a via
p9 = pad("U5", "9")
for t in tracks_touching(p9, "GND"): b.Delete(t)
for t in list(b.GetTracks()):
    if t.Type() == pcbnew.PCB_VIA_T and t.GetNetname() == "GND" and abs(mm(t.GetPosition().x) - 157.8) < 1.2 and 83.5 < mm(t.GetPosition().y) < 86 and t.GetIsFree():
        b.Delete(t)
q = p9.GetPosition(); v = via("GND", mm(q.x), mm(q.y) + 1.7, search=0.6)
if v: track("GND", F, [(mm(q.x), mm(q.y)), (mm(q.x), mm(q.y) + 1.0), v], 0.2)

# 3. USB-C VBUS ties: 0.25 mm straight up from the pad, then to the via
for n in ("A4", "A9"):
    pv = pad("J1", n)
    for t in tracks_touching(pv, "/VBUS", F):
        other = t.GetEnd() if pv.HitTest(t.GetStart()) else t.GetStart()
        b.Delete(t)
        q = pv.GetPosition(); track("/VBUS", F, [(mm(q.x), mm(q.y)), (mm(q.x), mm(q.y) - 0.95), (mm(other.x), mm(other.y))], 0.25)

# 4. stubs: SDA ending beside IO9, the old GND via inside the XT30 pin, then generic dangling removal
p8 = pad("U4", "8")
for t in list(b.GetTracks()):
    if t.GetNetname().endswith("I2C_SDA") and t.Type() != pcbnew.PCB_VIA_T and \
       t.GetEffectiveShape(F).Collide(p8.GetEffectiveShape(F), MM(0.3)): b.Delete(t)
for t in list(b.GetTracks()):
    if t.Type() == pcbnew.PCB_VIA_T and abs(mm(t.GetPosition().x) - 136.55) < .05 and abs(mm(t.GetPosition().y) - 117.15) < .05: b.Delete(t)

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
removed = 0
for _ in range(8):
    dead = [t for t in b.GetTracks() if t.Type() != pcbnew.PCB_VIA_T and
            not (connected(t, t.GetStart(), t.GetLayer()) and connected(t, t.GetEnd(), t.GetLayer()))]
    if not dead: break
    for t in dead: b.Delete(t); removed += 1
print("dangling tracks removed:", removed)

# 5. GND pour islands on F.Cu with no via/through-hole: stitch them to In2
gnd = b.FindNet("GND"); added = 0
for z in b.Zones():
    if z.GetNetname() != "GND" or not z.IsOnLayer(F) or z.GetIsRuleArea(): continue
    fill = z.GetFilledPolysList(F)
    for i in range(fill.OutlineCount()):
        outline = fill.Outline(i)
        bb = outline.BBox()
        has = any(t.Type() == pcbnew.PCB_VIA_T and t.GetNetCode() == gnd.GetNetCode() and outline.PointInside(t.GetPosition())
                  for t in b.GetTracks()) or \
              any(p.GetNetCode() == gnd.GetNetCode() and p.HasHole() and outline.PointInside(p.GetPosition()) for f in b.GetFootprints() for p in f.Pads())
        if has or mm(bb.GetWidth()) < 1.0 or mm(bb.GetHeight()) < 1.0: continue
        # try points on a grid inside this island
        done = False
        for gx in range(10):
            for gy in range(10):
                x = mm(bb.GetLeft()) + (gx + 0.5) * mm(bb.GetWidth()) / 10; y = mm(bb.GetTop()) + (gy + 0.5) * mm(bb.GetHeight()) / 10
                c = P(x, y)
                if outline.PointInside(c) and outline.SquaredDistance(c, True) > MM(0.45) ** 2 and clear_at("GND", x, y):
                    via("GND", x, y, search=0.0); added += 1; done = True; break
            if done: break
print("GND island stitch vias added:", added)
pcbnew.SaveBoard(sys.argv[2], b)
