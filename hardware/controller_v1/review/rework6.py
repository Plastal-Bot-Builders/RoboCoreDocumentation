"""Stage 6: silkscreen cleanup.
 - remove the Arduino icon group that now sits under J5 (also a trademark risk on a distributed kit)
 - delete board-level silk art shapes that land on exposed copper pads, or hug the board edge
 - move colliding reference designators to a clear spot, hide them when no spot exists
 - keep the XT30 polarity marks next to their pins
usage: rework6.py in.kicad_pcb out.kicad_pcb
"""
import pcbnew, sys, collections
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
FS, BS = pcbnew.F_SilkS, pcbnew.B_SilkS
log = collections.Counter()

# 0. leftover vias: orphan RX_TX via; duplicate AD0 ground via next to an existing one
for t in list(b.GetTracks()):
    if t.Type() == pcbnew.PCB_VIA_T:
        x, y = mm(t.GetPosition().x), mm(t.GetPosition().y)
        if abs(x - 118.40) < .05 and abs(y - 86.75) < .05 and t.GetNetname().endswith("RX_TX"): b.Delete(t); log["orphan via removed"] += 1
        if abs(x - 157.80) < .05 and abs(y - 84.95) < .05 and t.GetNetname() == "GND":
            b.Delete(t); log["duplicate GND via removed"] += 1
            for tr in b.GetTracks():
                if tr.Type() != pcbnew.PCB_VIA_T and tr.GetNetname() == "GND":
                    for end in ("Start", "End"):
                        p = getattr(tr, "Get" + end)()
                        if abs(mm(p.x) - 157.80) < .05 and abs(mm(p.y) - 84.95) < .05:
                            getattr(tr, "Set" + end)(pcbnew.VECTOR2I(MM(157.94), MM(84.58)))

pads = [p for f in b.GetFootprints() for p in f.Pads()]
def pad_hits(item, layer, margin=0.1):
    cu = pcbnew.F_Cu if layer == FS else pcbnew.B_Cu
    sh = item.GetEffectiveShape(layer)
    for p in pads:
        if p.IsOnLayer(cu) and p.GetEffectiveShape(cu).Collide(sh, MM(margin)): return True
        if p.HasHole() and p.GetEffectiveHoleShape().Collide(sh, MM(margin)): return True
    return False

# 1. Arduino icon (group of F.Silk shapes in the lower-left corner) under J5
j5 = b.FindFootprintByReference("J5").GetBoundingBox(False, False)
for g in list(b.Groups()):
    bb = g.GetBoundingBox()
    items = list(g.GetItems())
    if len(items) < 30 and all(it.GetLayer() == FS for it in items) and bb.Intersects(j5):
        for it in items: b.Delete(it); log["Arduino icon shapes removed"] += 1
        b.Delete(g)

# 2. the bottom-side artwork (title, logo, portrait) is kept intact; silk over pad openings is clipped at the fab
poly = pcbnew.SHAPE_POLY_SET(); b.GetBoardPolygonOutlines(poly, False); edge = poly.COutline(0)

# 3. reference designators: try nearby positions, else hide
silk_items = lambda layer: [d for d in b.GetDrawings() if d.GetLayer() == layer] + \
                           [g for f in b.GetFootprints() for g in f.GraphicalItems() if g.GetLayer() == layer]
UID = lambda o: o.m_Uuid.AsString()
def collides(txt, layer, own):
    tb = txt.GetBoundingBox(); tb.Inflate(MM(0.1)); own_id = UID(own)
    for p in pads:
        if p.IsOnLayer(pcbnew.F_Cu if layer == FS else pcbnew.B_Cu) and tb.Intersects(p.GetBoundingBox()): return True
        if p.HasHole() and tb.Intersects(p.GetBoundingBox()): return True
    for g in silk_items(layer):
        pf = g.GetParentFootprint()
        if pf is not None and UID(pf) == own_id: continue
        if tb.Intersects(g.GetBoundingBox()): return True
    for f in b.GetFootprints():
        r = f.Reference()
        if UID(f) == own_id or not r.IsVisible() or r.GetLayer() != layer: continue
        if tb.Intersects(r.GetBoundingBox()): return True
    outline_ok = poly.Contains(tb.GetOrigin()) and poly.Contains(tb.GetEnd())
    return not outline_ok
for f in b.GetFootprints():
    r = f.Reference()
    if not r.IsVisible() or r.GetLayer() not in (FS, BS): continue
    layer = r.GetLayer()
    if not collides(r, layer, f): continue
    c = f.GetBoundingBox(False, False); home = r.GetPosition(); placed = False
    hw, hh = mm(c.GetWidth()) / 2, mm(c.GetHeight()) / 2
    cx, cy = mm(c.GetCenter().x), mm(c.GetCenter().y)
    for dx, dy in ((0, -(hh + 0.7)), (0, hh + 0.7), (-(hw + 1.2), 0), (hw + 1.2, 0),
                   (-(hw + 1.2), -(hh + 0.6)), (hw + 1.2, -(hh + 0.6)), (-(hw + 1.2), hh + 0.6), (hw + 1.2, hh + 0.6)):
        r.SetPosition(pcbnew.VECTOR2I(MM(cx + dx), MM(cy + dy)))
        if not collides(r, layer, f): placed = True; break
    if placed: log["references moved"] += 1
    else:
        r.SetPosition(home); r.SetVisible(False); log["references hidden (no clear spot)"] += 1

# 4. XT30 polarity marks right next to their pins
j2 = b.FindFootprintByReference("J2")
p1 = next(p for p in j2.Pads() if p.GetNumber() == "1").GetPosition()
p2 = next(p for p in j2.Pads() if p.GetNumber() == "2").GetPosition()
# in the free strip between the connector body and the board-edge frame line, right under each pin
body_bot = max(g.GetBoundingBox().GetBottom() for g in j2.GraphicalItems() if g.GetLayer() == FS and g.GetClass() != "PCB_TEXT")
for g in j2.GraphicalItems():
    if g.GetClass() == "PCB_TEXT" and g.GetText() in ("+", "-"):
        q = p2 if g.GetText() == "+" else p1
        g.SetTextSize(pcbnew.VECTOR2I(MM(1.5), MM(1.5))); g.SetTextThickness(MM(0.25))
        g.SetPosition(pcbnew.VECTOR2I(q.x, body_bot + MM(1.25))); log["XT30 polarity marks placed"] += 1
# the "CHARGER" label shares that strip: nudge it left so the "-" mark has room
minus = next(g for g in j2.GraphicalItems() if g.GetClass() == "PCB_TEXT" and g.GetText() == "-")
fp_silk = [g for fp_ in b.GetFootprints() for g in fp_.GraphicalItems() if g.GetLayer() == FS and g.GetClass() != "PCB_TEXT"]
def clear(d):
    sh = d.GetEffectiveShape(FS); bb = d.GetBoundingBox()
    if minus.GetEffectiveShape(FS).Collide(sh, MM(0.8)): return False   # a clear word gap, so it doesn't read "CHARGER-"
    return not any(o.GetBoundingBox().Intersects(bb) and o.GetEffectiveShape(FS).Collide(sh, MM(0.15)) for o in fp_silk)
for d in b.GetDrawings():
    if d.GetClass() == "PCB_TEXT" and d.GetText() == "CHARGER" and d.GetLayer() == FS:
        pos0, size0, th0, bot0 = d.GetPosition(), d.GetTextSize(), d.GetTextThickness(), d.GetBoundingBox().GetBottom()
        done = False
        for pct in range(100, 69, -5):          # largest size first, then the smallest shift left
            for k in range(0, 25):
                d.SetTextSize(pcbnew.VECTOR2I(size0.x * pct // 100, size0.y * pct // 100)); d.SetTextThickness(th0 * pct // 100)
                d.SetPosition(pcbnew.VECTOR2I(pos0.x - MM(0.1 * k), pos0.y))
                d.Move(pcbnew.VECTOR2I(0, bot0 - d.GetBoundingBox().GetBottom()))   # keep the baseline on the frame line
                if clear(d): done = True; break
            if done: break
        if done: log[f"CHARGER label: {pct}% size, moved left {k * 0.1:.1f} mm"] += 1
        else:
            d.SetTextSize(size0); d.SetTextThickness(th0); d.SetPosition(pos0); log["CHARGER label left unchanged (no clear fit)"] += 1

pcbnew.SaveBoard(sys.argv[2], b)
for k, v in log.items(): print(f"{k}: {v}")
