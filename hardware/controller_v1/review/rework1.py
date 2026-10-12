"""Stage 1: place new parts, set up power zones, hand-route the high-current boost copper.
usage: rework1.py in.kicad_pcb out.kicad_pcb   (scratch copy only)
"""
import pcbnew, sys, math
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
P = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))
F, B, IN1 = pcbnew.F_Cu, pcbnew.B_Cu, pcbnew.In1_Cu
keep = []   # hold proxies of created objects (SWIG ownership safety)

def net(name):
    n = b.FindNet(name); assert n is not None, name; return n
def track(netname, layer, pts, w):
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        t = pcbnew.PCB_TRACK(b); t.SetStart(P(x1, y1)); t.SetEnd(P(x2, y2)); t.SetWidth(MM(w)); t.SetLayer(layer)
        t.SetNet(net(netname)); b.Add(t); keep.append(t)
COPPER = (F, pcbnew.In1_Cu, pcbnew.In2_Cu, B)
def clear_at(netname, x, y, d, extra=0.2):
    """True if a via of diameter d at (x,y) keeps >= extra mm from every other-net track/via/pad and from holes."""
    c = P(x, y); r = MM(d / 2)
    for it in list(b.GetTracks()) + [p for f in b.GetFootprints() for p in f.Pads()]:
        if it.GetNetname() == netname and it.GetNetCode() > 0: continue
        bb = it.GetBoundingBox()
        if bb.GetLeft() - r - MM(1) > c.x or bb.GetRight() + r + MM(1) < c.x or bb.GetTop() - r - MM(1) > c.y or bb.GetBottom() + r + MM(1) < c.y: continue
        for layer in COPPER:
            if it.IsOnLayer(layer) and it.GetEffectiveShape(layer).Collide(pcbnew.SHAPE_CIRCLE(c, r), MM(extra)): return False
        if isinstance(it, pcbnew.PAD) and it.HasHole() and it.GetEffectiveHoleShape().Collide(pcbnew.SHAPE_CIRCLE(c, r), MM(0.3)): return False
    edge = b.GetBoardEdgesBoundingBox()
    poly = pcbnew.SHAPE_POLY_SET(); b.GetBoardPolygonOutlines(poly, False)
    if not poly.Contains(c): return False
    if poly.COutline(0).SquaredDistance(c, True) < (r + MM(0.3)) ** 2: return False   # outline-only distance
    return True
def via(netname, x, y, d=0.6, drill=0.3, search=1.2):
    spot = None
    for rr in [0] + [k * 0.1 for k in range(1, int(search / 0.1) + 1)]:
        for ang in range(0, 360, 30 if rr else 360):
            px, py = x + rr * math.cos(math.radians(ang)), y + rr * math.sin(math.radians(ang))
            if clear_at(netname, px, py, d): spot = (round(px, 2), round(py, 2)); break
        if spot: break
    if not spot:
        print(f"  no clear spot for {netname} via near ({x},{y})"); return None
    v = pcbnew.PCB_VIA(b); v.SetPosition(P(*spot)); v.SetWidth(F, MM(d)); v.SetDrill(MM(drill)); v.SetLayerPair(F, B)
    b.Add(v); v.SetNet(net(netname)); v.SetIsFree(True); keep.append(v)
    if spot != (x, y): print(f"  {netname} via moved ({x},{y}) -> {spot}")
    return spot
def zone(netname, layer, poly, prio, name, clr=0.3, minw=0.25, conn=pcbnew.ZONE_CONNECTION_THERMAL):
    z = pcbnew.ZONE(b); z.SetLayer(layer); z.SetNet(net(netname)); z.SetZoneName(name)
    o = z.Outline(); o.NewOutline()
    for x, y in poly: o.Append(MM(x), MM(y))
    z.SetAssignedPriority(prio); z.SetLocalClearance(MM(clr)); z.SetMinThickness(MM(minw))
    z.SetPadConnection(conn); z.SetThermalReliefGap(MM(0.3)); z.SetThermalReliefSpokeWidth(MM(0.5))
    z.SetIslandRemovalMode(pcbnew.ISLAND_REMOVAL_MODE_ALWAYS); b.Add(z); keep.append(z)
def fp(ref): return b.FindFootprintByReference(ref)
def pad(ref, num):
    return next(p for p in fp(ref).Pads() if p.GetNumber() == num)
def solid(ref, *nums):
    for p in fp(ref).Pads():
        if not nums or p.GetNumber() in nums: p.SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)

# ------------------------------------------------------------------ placement (x, y, rotation); bottom parts already flipped
place = {
    # connectors (top)
    "J1": (119.25, 117.9, 0), "J2": (135.9, 116.0, 0), "J5": (105.0, 112.6, 0),
    # 6 V boost (bottom), see TI SLVSD38C layout guidance: tight VOUT-Cout-GND loop, short SW node
    "C22": (143.6, 116.0, 90), "L1": (147.85, 116.0, 0), "U7": (152.4, 116.0, 270),
    "C24": (158.2, 116.6, 90), "C25": (160.6, 116.6, 90), "C26": (163.0, 116.6, 90),
    # control parts above the IC (orientation fixed below so the pin facing the IC is pin-side)
    # order matches the IC pins (FSW, VCC, FB, COMP) so the short routes never cross
    "R37": (149.0, 111.4, 0), "C27": (151.8, 112.0, 90), "R36": (153.4, 112.0, 90), "R35": (154.9, 112.0, 90),
    "C30": (156.4, 112.0, 90), "R34": (157.9, 112.0, 90), "C29": (159.4, 112.0, 90),
    # bottom-row escapes: BOOT cap, VIN cap, ILIM resistor
    "C28": (149.6, 120.0, 0), "C23": (152.8, 120.3, 0), "R38": (154.5, 118.6, 0),
    # VM decoupling under each driver (bottom)
    "C31": (164.6, 104.4, 90), "C32": (152.6, 104.0, 90),
    # power switch FET + gate pull-up (bottom, under the VSYS track)
    "Q3": (116.6, 111.0, 270), "R41": (113.0, 111.4, 90),
    # battery divider: top resistor at the battery, bottom resistor + filter cap at the ESP32 (bottom side)
    "R39": (141.2, 112.0, 90), "R40": (152.6, 73.6, 90), "C33": (154.7, 73.6, 90),
    # GPIO2 strap pull-up next to the module (bottom)
    "R33": (150.5, 73.6, 90),
}
for ref, (x, y, r) in place.items():
    f = fp(ref); f.SetOrientationDegrees(r); f.SetPosition(P(x, y))
def orient(ref, num, side):
    """Rotate a 2-pin part 180 deg if pad `num` is not on `side` ('left','right','top','bottom')."""
    f = fp(ref); c = f.GetPosition(); q = pad(ref, num).GetPosition()
    ok = {"left": q.x < c.x, "right": q.x > c.x, "top": q.y < c.y, "bottom": q.y > c.y}[side]
    if not ok: f.SetOrientationDegrees(f.GetOrientationDegrees() + 180)
# pin facing the IC row / net it must reach first
for ref, num, side in (("R37", "1", "right"), ("C27", "1", "bottom"), ("R36", "1", "bottom"), ("R35", "2", "bottom"),
                       ("R34", "1", "bottom"), ("C30", "1", "bottom"), ("C29", "1", "top"),
                       ("C28", "1", "right"), ("C23", "1", "left"), ("R38", "1", "left"), ("R39", "1", "bottom")):
    orient(ref, num, side)

# ------------------------------------------------------------------ zones
for z in b.Zones():
    if z.GetZoneName() == "+BATT" and z.GetNetname() == "+6V": z.SetZoneName("+6V")
    if z.GetZoneName() == "+5V": z.SetNet(net("/VSYS")); z.SetZoneName("VSYS")
# +6V plane on In1 from the boost up to the driver VM area (In1 is empty there)
zone("+6V", IN1, [(144.6, 101.4), (170.8, 101.4), (170.8, 121.2), (144.6, 121.2)], 4, "+6V_IN1", clr=0.5)
# +6V copper under the output caps on the bottom
zone("+6V", B, [(157.0, 117.5), (166.4, 117.5), (166.4, 121.0), (157.0, 121.0)], 6, "+6V_BOOST")
# +BATT copper on the bottom from the XT30 + pin to Cin and the inductor
zone("+BATT", B, [(139.2, 114.3), (148.1, 114.3), (148.1, 119.4), (139.2, 119.4)], 6, "+BATT_BOOST")

# ------------------------------------------------------------------ hand-routed boost copper (bottom)
def at(ref, num):
    q = pad(ref, num).GetPosition(); return (mm(q.x), mm(q.y))
SWP, L2 = at("U7", "11"), at("L1", "2")
track("/BOOST_SW", B, [(L2[0], SWP[1]), SWP], 1.2)                          # L1 -> SW pad
VO, GN = at("U7", "6"), at("U7", "5")
C24P, C24N = at("C24", "1"), at("C24", "2")
# 0.45 mm necks out of the IC (pad height), then wider rails along the output caps
track("+6V", B, [VO, (155.8, VO[1]), (156.6, C24P[1])], 0.45)
track("+6V", B, [(156.6, C24P[1]), (at("C26", "1")[0], C24P[1])], 0.8)
track("GND", B, [GN, (155.0, GN[1]), (155.6, C24N[1])], 0.45)
track("GND", B, [(155.6, C24N[1]), (166.4, C24N[1])], 0.8)
for x in (158.2, 159.6, 161.0, 162.4, 163.8, 165.2):   # boost output -> In1 +6V plane
    via("+6V", x, 120.1, search=0.4)
for x in (165.4, 166.4):                               # power ground -> In2
    via("GND", x, C24N[1], search=0.4)
# bottom-row escapes
BOOT, VIN, ILIM, EN = at("U7", "10"), at("U7", "9"), at("U7", "8"), at("U7", "7")
c28b, c28s = at("C28", "1"), at("C28", "2")
track("/BOOST_BST", B, [BOOT, (BOOT[0], BOOT[1] + 0.43), (c28b[0] + 0.35, c28b[1] - 1.1), (c28b[0], c28b[1])], 0.2)
track("/BOOST_SW", B, [c28s, (c28s[0], c28s[1] - 0.6), (L2[0] - 0.35, 118.2)], 0.3)
B1 = via("+BATT", 151.95, 118.6, search=0.0)
track("+BATT", B, [VIN, (VIN[0], VIN[1] + 0.45), B1], 0.25)
track("+BATT", B, [B1, at("C23", "1")], 0.25)
r38 = at("R38", "1")
track("/BOOST_ILIM", B, [ILIM, (ILIM[0], ILIM[1] + 0.45), (r38[0] - 0.4, r38[1]), r38], 0.2)
B2 = via("+BATT", 155.5, 117.6, search=0.0)
track("+BATT", B, [EN, (EN[0], EN[1] + 0.15), (B2[0] - 0.35, EN[1] + 0.15), B2], 0.2)
A = via("+BATT", 146.2, 119.3, search=0.3)
track("+BATT", B, [at("L1", "1"), A], 0.4)
track("+BATT", IN1, [A, (147.0, 120.1), (151.0, 120.1), B1, (152.7, 117.85), B2], 0.3)   # VIN/EN feed on In1 (TI layout uses a buried VIN trace)
# control pins (FSW, VCC, FB, COMP) -> parts above the IC, non-crossing lanes
FSW, VCC, FB, COMP = at("U7", "1"), at("U7", "2"), at("U7", "3"), at("U7", "4")
r37f, r37s = at("R37", "1"), at("R37", "2")
track("/BOOST_FSW", B, [FSW, (FSW[0], FSW[1] - 0.43), (151.0, FSW[1] - 1.08), (151.0, 112.6), (150.3, 111.9), r37f], 0.2)
track("/BOOST_SW", B, [r37s, (r37s[0] + 0.7, r37s[1] + 0.7), (149.3, 112.5), (149.3, 113.8)], 0.25)
track("/BOOST_VCC", B, [VCC, (VCC[0], at("C27", "1")[1])], 0.25)
r36f, r35f = at("R36", "1"), at("R35", "2")
track("/BOOST_FB", B, [FB, (FB[0], FB[1] - 0.93), (r36f[0] - 0.1, r36f[1] + 0.48), r36f], 0.2)
track("/BOOST_FB", B, [r36f, r35f], 0.2)
c30c, r34c = at("C30", "1"), at("R34", "1")
LANE = COMP[1] - 0.63
track("/BOOST_COMP", B, [COMP, (COMP[0], COMP[1] - 0.43), (COMP[0] + 0.2, LANE), (r34c[0], LANE), r34c], 0.2)
track("/BOOST_COMP", B, [(c30c[0], LANE), c30c], 0.2)
track("/BOOST_RC", B, [at("R34", "2"), at("C29", "1")], 0.2)
for ref, num, dx, dy in (("C27", "2", 0, -0.95), ("R36", "2", 0, -0.95), ("C30", "2", 0, -0.95), ("C29", "2", 1.0, 0)):
    q = at(ref, num); v = via("GND", q[0] + dx, q[1] + dy, search=0.4)
    if v: track("GND", B, [q, v], 0.3)
r35p = at("R35", "1"); V6 = via("+6V", r35p[0], r35p[1] - 0.95, search=0.4)
if V6: track("+6V", B, [r35p, V6], 0.3)
# divider top resistor sits on the battery copper
track("+BATT", B, [at("R39", "1"), (at("R39", "1")[0], 114.6)], 0.3)
# the footprint's in-pad via on SW is 0.5/0.2 (0.15 ring); open the pad to 0.6 for margin
for p in fp("U7").Pads():
    if p.GetNumber() == "11" and p.HasHole(): p.SetSize(F, pcbnew.VECTOR2I(MM(0.6), MM(0.6)))
solid("U7", "5", "6", "11"); solid("C22"); solid("C24"); solid("C25"); solid("C26"); solid("L1")

# ------------------------------------------------------------------ +6V vias at the drivers (F.Cu VM zone -> In1 plane) and VM caps
drv_vias = []
for x, y in ((151.2, 104.9), (151.2, 103.6), (157.6, 104.9), (163.4, 104.9), (145.3, 105.0), (155.0, 102.0), (153.5, 106.6), (156.3, 106.6)):
    drv_vias.append(via("+6V", x, y, search=0.6))
for ref in ("C31", "C32"):
    pp, pn = pad(ref, "1").GetPosition(), pad(ref, "2").GetPosition()
    gv = via("GND", mm(pn.x), mm(pn.y) + (1.0 if mm(pn.y) > mm(pp.y) else -1.0), search=0.8)
    if gv: track("GND", B, [(mm(pn.x), mm(pn.y)), gv], 0.5)
track("+6V", B, [(mm(pad("C31", "1").GetPosition().x), mm(pad("C31", "1").GetPosition().y)), drv_vias[3]], 0.5)
track("+6V", B, [(mm(pad("C32", "1").GetPosition().x), mm(pad("C32", "1").GetPosition().y)), drv_vias[0]], 0.5)

# ------------------------------------------------------------------ VSYS split: cut the old track and insert Q3 (bottom)
for t in list(b.GetTracks()):
    if t.Type() != pcbnew.PCB_VIA_T and t.GetNetname() == "/VSYS_SW" and abs(mm(t.GetStart().y) - 108.6) < .01 and abs(mm(t.GetEnd().y) - 108.6) < .01:
        x1, x2 = sorted((mm(t.GetStart().x), mm(t.GetEnd().x)))
        b.Delete(t)
        track("/VSYS", F, [(x2, 108.6), (118.0, 108.6)], 0.8)          # east part (from charger OUT)
        track("/VSYS_SW", F, [(115.0, 108.6), (x1, 108.6)], 0.8)       # west part (to LDO)
        break
for t in list(b.GetTracks()):      # everything else on the old +5V path east of the cut is VSYS now
    if t.GetNetname() == "/VSYS_SW" and t.Type() != pcbnew.PCB_VIA_T and min(mm(t.GetStart().x), mm(t.GetEnd().x)) > 117.9:
        t.SetNet(net("/VSYS"))
va = via("/VSYS", 118.0, 108.6, 0.8, 0.4, search=0.0); vb = via("/VSYS_SW", 115.0, 108.6, 0.8, 0.4, search=0.0)
s, d, g = pad("Q3", "2").GetPosition(), pad("Q3", "3").GetPosition(), pad("Q3", "1").GetPosition()
track("/VSYS", B, [va, (mm(s.x), mm(s.y))], 0.6)
track("/VSYS_SW", B, [vb, (114.4, 109.2), (114.4, mm(d.y)), (mm(d.x), mm(d.y))], 0.6)

# ------------------------------------------------------------------ charger pins that moved off GND (SEL -> IN, TE pull-up -> IN)
for t in list(b.GetTracks()):
    if t.Type() == pcbnew.PCB_VIA_T or t.GetNetname() != "GND": continue
    for ref, num in (("U1", "3"), ("R6", "2")):
        p = pad(ref, num)
        if p.HitTest(t.GetStart()) or p.HitTest(t.GetEnd()):
            b.Delete(t); break
u2_, u4_ = pad("U1", "2").GetPosition(), pad("U1", "4").GetPosition()
track("/+5V_USB", F, [(mm(u2_.x) + 0.1, mm(u2_.y)), (mm(u4_.x) + 0.1, mm(u4_.y))], 0.25)   # ties SEL (pin 3) to IN via pins 2/4
r6 = pad("R6", "2").GetPosition()
rv = via("/+5V_USB", mm(r6.x) + 1.2, mm(r6.y), search=1.0)
if rv: track("/+5V_USB", F, [(mm(r6.x), mm(r6.y)), rv], 0.3)

# ------------------------------------------------------------------ clear stitching vias under the new J5 connector
j5 = fp("J5").GetBoundingBox(False, False); j5.Inflate(MM(0.6))
for t in list(b.GetTracks()):
    if t.Type() == pcbnew.PCB_VIA_T and t.GetNetname() == "GND" and j5.Contains(t.GetPosition()):
        b.Delete(t)

pcbnew.SaveBoard(sys.argv[2], b)
print("stage 1 done")
