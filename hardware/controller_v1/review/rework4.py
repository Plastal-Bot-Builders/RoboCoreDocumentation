"""Stage 4 (after Freerouting import): via annular rings to PCBWay minimum, remove dangling stubs.
usage: rework4.py in.kicad_pcb out.kicad_pcb
"""
import pcbnew, sys
b = pcbnew.LoadBoard(sys.argv[1]); MM = pcbnew.FromMM; mm = pcbnew.ToMM
F = pcbnew.F_Cu
LAYERS = (pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu)
fixed = 0
for t in b.GetTracks():
    if t.Type() == pcbnew.PCB_VIA_T:
        d, h = mm(t.GetWidth(F)), mm(t.GetDrillValue())
        if (d - h) / 2 < 0.1499:
            if d < 0.6: t.SetWidth(F, MM(0.6)); d = 0.6
            t.SetDrill(MM(round(d - 0.3, 2))); fixed += 1
print("vias resized:", fixed)
def connected(t, pt, layer):
    for o in b.GetTracks():
        if o is t or o.GetNetCode() != t.GetNetCode(): continue
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
for _ in range(6):
    dead = []
    for t in b.GetTracks():
        if t.Type() == pcbnew.PCB_VIA_T:
            n = sum(1 for l in LAYERS if connected(t, t.GetPosition(), l))
            if n < 2 and not t.GetIsFree(): dead.append(t)
        else:
            if not (connected(t, t.GetStart(), t.GetLayer()) and connected(t, t.GetEnd(), t.GetLayer())): dead.append(t)
    if not dead: break
    for t in dead: b.Delete(t); removed += 1
print("dangling items removed:", removed)
pcbnew.SaveBoard(sys.argv[2], b)
