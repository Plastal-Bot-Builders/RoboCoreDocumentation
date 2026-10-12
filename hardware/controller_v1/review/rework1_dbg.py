"""Stage 1: place new parts, set up power zones, hand-route the high-current boost copper.
usage: rework1.py in.kicad_pcb out.kicad_pcb   (scratch copy only)
"""
import pcbnew, sys, math
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
P = lambda x, y: pcbnew.VECTOR2I(MM(x), MM(y))
F, B, IN1 = pcbnew.F_Cu, pcbnew.B_Cu, pcbnew.In1_Cu
keep = []   # hold proxies of created objects (SWIG ownership safety)
VIAS = []
def chk(tag):
    print(tag, [(round(mm(v.GetPosition().x),1), v.GetNetname()) for v in VIAS], flush=True)

def net(name):
    n = b.FindNet(name); assert n is not None, name; return n
def track(netname, layer, pts, w):
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        t = pcbnew.PCB_TRACK(b); t.SetStart(P(x1, y1)); t.SetEnd(P(x2, y2)); t.SetWidth(MM(w)); t.SetLayer(layer)
        t.SetNet(net(netname)); b.Add(t); keep.append(t)
def via(netname, x, y, d=0.6, drill=0.3):
    v = pcbnew.PCB_VIA(b); v.SetPosition(P(x, y)); v.SetWidth(F, MM(d)); v.SetDrill(MM(drill)); v.SetLayerPair(F, B)
    v.SetNet(net(netname)); b.Add(v); keep.append(v); VIAS.append(v)
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
    "C22": (145.0, 116.0, 90), "L1": (149.5, 116.0, 0), "U7": (155.2, 116.0, 270),
    "C24": (158.0, 116.4, 90), "C25": (160.4, 116.4, 90), "C26": (162.8, 116.4, 90),
    "R37": (154.6, 111.6, 0), "C27": (157.2, 111.6, 0), "R34": (159.8, 111.6, 0), "C29": (162.4, 111.6, 0), "C30": (165.0, 111.6, 0),
    "R35": (157.6, 113.5, 0), "R36": (160.2, 113.5, 0),
    "C28": (154.4, 119.9, 0), "C23": (156.8, 119.9, 0), "R38": (159.2, 119.9, 0),
    # VM decoupling under each driver (bottom)
    "C31": (164.6, 104.4, 90), "C32": (152.6, 104.0, 90),
    # power switch FET + gate pull-up (bottom, under the VSYS track)
    "Q3": (116.4, 110.7, 0), "R41": (113.9, 110.9, 90),
    # battery divider + GPIO2 pull-up (bottom, right of the ESP32 module)
    "R39": (150.5, 72.6, 0), "R40": (153.1, 72.6, 0), "C33": (155.7, 72.6, 0), "R33": (150.5, 75.0, 0),
}
for ref, (x, y, r) in place.items():
    f = fp(ref); f.SetOrientationDegrees(r); f.SetPosition(P(x, y))

# ------------------------------------------------------------------ zones
for z in b.Zones():
    if z.GetZoneName() == "+BATT" and z.GetNetname() == "+6V": z.SetZoneName("+6V")
    if z.GetZoneName() == "+5V": z.SetNet(net("/VSYS")); z.SetZoneName("VSYS")
# +6V plane on In1 from the boost up to the driver VM area (In1 is empty there)
zone("+6V", IN1, [(144.6, 101.4), (170.8, 101.4), (170.8, 121.2), (144.6, 121.2)], 4, "+6V_IN1", clr=0.5)
# +6V copper under the output caps on the bottom
zone("+6V", B, [(157.0, 117.3), (165.8, 117.3), (165.8, 120.8), (160.3, 120.8), (160.3, 118.9), (157.0, 118.9)], 6, "+6V_BOOST")
# +BATT copper on the bottom from the XT30 + pin to Cin and the inductor
zone("+BATT", B, [(139.2, 114.3), (148.1, 114.3), (148.1, 119.4), (139.2, 119.4)], 6, "+BATT_BOOST")

# ------------------------------------------------------------------ hand-routed power copper (bottom)
sw = pad("U7", "11").GetPosition(); l2 = pad("L1", "2").GetPosition()
track("/BOOST_SW", B, [(mm(l2.x), mm(sw.y)), (mm(sw.x), mm(sw.y))], 1.2)              # L1 -> SW pad
vo = pad("U7", "6").GetPosition(); gn = pad("U7", "5").GetPosition()
c24p, c24n = pad("C24", "1").GetPosition(), pad("C24", "2").GetPosition()
VX, VY, GY = mm(vo.x), mm(vo.y), mm(gn.y)
# 0.45 mm necks out of the IC (pad height), then wider rails along the output caps
track("+6V", B, [(VX, VY), (VX + 1.1, VY)], 0.45)
track("+6V", B, [(VX + 1.1, VY), (mm(c24p.x) - 0.5, mm(c24p.y))], 0.6)
track("+6V", B, [(mm(c24p.x) - 0.5, mm(c24p.y)), (mm(pad("C26", "1").GetPosition().x), mm(c24p.y))], 0.8)
track("GND", B, [(VX, GY), (VX + 1.1, GY)], 0.45)
track("GND", B, [(VX + 1.1, GY), (mm(c24n.x) - 0.5, mm(c24n.y))], 0.6)
track("GND", B, [(mm(c24n.x) - 0.5, mm(c24n.y)), (165.7, mm(c24n.y))], 0.8)
for x in (161.6, 163.0, 164.4):                    # boost output -> In1 +6V plane
    via("+6V", x, 120.0)
for x in (164.7, 165.7):                           # power ground -> In2
    via("GND", x, mm(c24n.y))
solid("U7", "5", "6", "11"); solid("C22"); solid("C24"); solid("C25"); solid("C26"); solid("L1")

# ------------------------------------------------------------------ +6V vias at the drivers (F.Cu VM zone -> In1 plane) and VM caps
for x, y in ((151.2, 104.9), (151.2, 103.6), (157.6, 104.9), (163.4, 104.9), (163.4, 103.6), (145.4, 104.0), (155.0, 102.0), (166.5, 101.6)):
    via("+6V", x, y)
for ref in ("C31", "C32"):
    pp, pn = pad(ref, "1").GetPosition(), pad(ref, "2").GetPosition()
    via("GND", mm(pn.x), mm(pn.y) + (1.0 if mm(pn.y) > mm(pp.y) else -1.0))
    track("GND", B, [(mm(pn.x), mm(pn.y)), (mm(pn.x), mm(pn.y) + (1.0 if mm(pn.y) > mm(pp.y) else -1.0))], 0.5)
track("+6V", B, [(mm(pad("C31", "1").GetPosition().x), mm(pad("C31", "1").GetPosition().y)), (163.4, 104.9)], 0.5)
track("+6V", B, [(mm(pad("C32", "1").GetPosition().x), mm(pad("C32", "1").GetPosition().y)), (151.2, 104.9)], 0.5)

chk('# --------------------------------------')
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
via("/VSYS", 118.0, 108.6, 0.8, 0.4); via("/VSYS_SW", 115.0, 108.6, 0.8, 0.4)
s, d, g = pad("Q3", "2").GetPosition(), pad("Q3", "3").GetPosition(), pad("Q3", "1").GetPosition()
track("/VSYS", B, [(118.0, 108.6), (mm(s.x), mm(s.y))], 0.6)
track("/VSYS_SW", B, [(115.0, 108.6), (mm(d.x), mm(d.y))], 0.6)

chk('# --------------------------------------')
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
via("/+5V_USB", mm(r6.x), mm(r6.y) - 1.1); track("/+5V_USB", F, [(mm(r6.x), mm(r6.y)), (mm(r6.x), mm(r6.y) - 1.1)], 0.3)

chk('# --------------------------------------')
# ------------------------------------------------------------------ clear stitching vias under the new J5 connector
j5 = fp("J5").GetBoundingBox(False, False); j5.Inflate(MM(0.6))
for t in list(b.GetTracks()):
    if t.Type() == pcbnew.PCB_VIA_T and t.GetNetname() == "GND" and j5.Contains(t.GetPosition()):
        b.Delete(t)

chk('pcbnew.SaveBoard(sys.argv[2], b)')
pcbnew.SaveBoard(sys.argv[2], b)
print("stage 1 done")
