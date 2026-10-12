"""Decision-independent fixes for RoboCore V1 against PCBWay limits. Run on a copy."""
import pcbnew, sys, math
src,dst=sys.argv[1],sys.argv[2]
b=pcbnew.LoadBoard(src); mm=pcbnew.ToMM; MM=pcbnew.FromMM
log=[]
def at(item_pos,x,y,tol=0.01): return math.hypot(mm(item_pos.x)-x,mm(item_pos.y)-y)<tol

# 1. Vias: PCBWay min annular ring 0.15 mm -> standardise undersized vias on 0.6/0.3
n=0
for t in b.GetTracks():
    if t.Type()!=pcbnew.PCB_VIA_T: continue
    d,h=mm(t.GetWidth(pcbnew.F_Cu)),mm(t.GetDrillValue())
    if (d-h)/2 < 0.1499:
        if d<0.6: t.SetWidth(pcbnew.F_Cu,MM(0.6))
        t.SetDrill(MM(mm(t.GetWidth(pcbnew.F_Cu))-0.3)); n+=1
log.append(f"resized {n} vias to >=0.15 mm annular ring")

# 2. Remove vias/stubs that cause clearance, hole-to-hole and dangling-track errors
kill=[]
for t in b.GetTracks():
    if t.Type()==pcbnew.PCB_VIA_T:
        for (x,y) in [(140.30,71.10),(140.85,71.70),(120.15,120.30)]:
            if t.GetNetname()=="GND" and at(t.GetPosition(),x,y): kill.append(t)
    elif t.GetNetname().endswith("/EN") and at(t.GetStart(),124.70,71.90) and at(t.GetEnd(),124.70,71.80): kill.append(t)
for t in kill: b.Remove(t)
log.append(f"removed {len(kill)} items (3 GND stitching vias, 1 EN stub)")

# 3. U4 (ESP32 module) thermal vias 28-39: 0.4/0.3 -> 0.6/0.3
u4=b.FindFootprintByReference("U4"); n=0
for p in u4.Pads():
    if p.GetNumber().isdigit() and 28<=int(p.GetNumber())<=39:
        p.SetSize(pcbnew.F_Cu,pcbnew.VECTOR2I(MM(0.6),MM(0.6))); n+=1
log.append(f"enlarged {n} U4 thermal-via pads to 0.6 mm")

# 4. DRV8245 OUT1/OUT2 pads: 0.15 mm gap is the package land pattern -> pad-level clearance
for ref in ("IC1","IC2"):
    for p in b.FindFootprintByReference(ref).Pads():
        if p.GetNumber() in ("5","6","8","9"): p.SetLocalClearance(MM(0.15))
log.append("set 0.15 mm local clearance on IC1/IC2 output pads")

# 5. LED5 anode: connect pad 2 to the +3.3V track that stops 1.6 mm short
net33=b.FindNet("+3.3V"); gnd=b.FindNet("GND")
def track(pts,net,w,layer=pcbnew.F_Cu):
    for (x1,y1),(x2,y2) in zip(pts,pts[1:]):
        t=pcbnew.PCB_TRACK(b); t.SetStart(pcbnew.VECTOR2I(MM(x1),MM(y1))); t.SetEnd(pcbnew.VECTOR2I(MM(x2),MM(y2)))
        t.SetWidth(MM(w)); t.SetLayer(layer); t.SetNet(net); b.Add(t)
track([(136.46,82.60),(135.86,83.20),(134.82,83.20)],net33,0.3)
log.append("routed LED5.2 to +3.3V")

# 6. VM bulk-cap ground island (C18/C19) had no path to the GND plane -> 3 vias
for x in (153.8,154.5,155.2):
    v=pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(MM(x),MM(108.93)));
    v.SetWidth(pcbnew.F_Cu,MM(0.6)); v.SetDrill(MM(0.3)); v.SetLayerPair(pcbnew.F_Cu,pcbnew.B_Cu); v.SetNet(gnd); b.Add(v)
log.append("added 3 GND vias under C18/C19 ground island")

# 7. Silkscreen reference text below PCBWay minimums (0.8 mm high, 0.15 mm stroke)
n=0
for f in b.GetFootprints():
    r=f.Reference()
    if r.IsVisible() and "Silk" in b.GetLayerName(r.GetLayer()) and (mm(r.GetTextHeight())<0.8 or mm(r.GetTextThickness())<0.15):
        r.SetTextHeight(MM(max(0.8,mm(r.GetTextHeight())))); r.SetTextWidth(MM(max(0.8,mm(r.GetTextWidth())))); r.SetTextThickness(MM(0.15)); n+=1
log.append(f"raised {n} silkscreen reference texts to 0.8 mm / 0.15 mm")

# 8. GND pours on F.Cu and B.Cu so the stitching vias actually stitch (and copper is balanced)
bb=b.GetBoardEdgesBoundingBox()
x0,y0,x1,y1=bb.GetLeft()-MM(1),bb.GetTop()-MM(1),bb.GetRight()+MM(1),bb.GetBottom()+MM(1)
for layer,name in ((pcbnew.F_Cu,"GND_TOP_POUR"),(pcbnew.B_Cu,"GND_BOTTOM_POUR")):
    z=pcbnew.ZONE(b); z.SetLayer(layer); z.SetNet(gnd); z.SetZoneName(name)
    o=z.Outline(); o.NewOutline()
    for (x,y) in ((x0,y0),(x1,y0),(x1,y1),(x0,y1)): o.Append(x,y)
    z.SetAssignedPriority(0); z.SetLocalClearance(MM(0.3)); z.SetMinThickness(MM(0.25))
    z.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL); z.SetThermalReliefGap(MM(0.3)); z.SetThermalReliefSpokeWidth(MM(0.4))
    z.SetIslandRemovalMode(pcbnew.ISLAND_REMOVAL_MODE_ALWAYS)
    b.Add(z)
log.append("added GND pours on F.Cu and B.Cu (priority 0, 0.3 mm clearance, islands removed)")

# 9. LM1117 tab via row: 8 vias at 0.55-0.65 mm pitch -> 7 vias at 0.70 mm pitch (hole-to-hole >= 0.35 mm)
row=sorted([t for t in b.GetTracks() if t.Type()==pcbnew.PCB_VIA_T and t.GetNetname()=="+3.3V" and abs(mm(t.GetPosition().y)-94.9)<0.01 and 110.5<mm(t.GetPosition().x)<115.2],key=lambda t:t.GetPosition().x)
assert len(row)==8, len(row)
b.Remove(row[-1])
for i,t in enumerate(row[:-1]): t.SetPosition(pcbnew.VECTOR2I(MM(110.75+0.7*i),MM(94.9)))
log.append("re-spaced LM1117 tab vias: 8 -> 7 at 0.70 mm pitch")

# 10. GND pads that cannot get two thermal spokes -> solid connection to the pour
for ref,nums in (("IC1",("13","15","16")),("IC2",("13","15","16")),("J1",("A1","A12","B1","B12","GN1"))):
    for p in b.FindFootprintByReference(ref).Pads():
        if p.GetNumber() in nums and p.GetNetname()=="GND": p.SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
log.append("set solid zone connection on IC1/IC2 config-pin GND pads and J1 GND pins")

pcbnew.SaveBoard(dst,b)
print("\n".join(log))
