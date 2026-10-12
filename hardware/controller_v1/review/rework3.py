"""Stage 3: last stubs, pad connection styles, then export a Specctra DSN for Freerouting.
usage: rework3.py in.kicad_pcb out.kicad_pcb out.dsn
"""
import pcbnew, sys, collections
b = pcbnew.LoadBoard(sys.argv[1]); mm = pcbnew.ToMM
def pad(ref, num): return next(p for p in b.FindFootprintByReference(ref).Pads() if p.GetNumber() == num)
# SDA track that runs over the (now SCL) IO9 pad
p8 = pad("U4", "8"); n = 0
for t in list(b.GetTracks()):
    if t.GetNetname().endswith("I2C_SDA") and t.Type() != pcbnew.PCB_VIA_T and (p8.HitTest(t.GetStart()) or p8.HitTest(t.GetEnd()) or t.HitTest(p8.GetPosition(), 0)):
        b.Delete(t); n += 1
print("SDA stubs over IO9 removed:", n)
# small GND pads already tied to vias: solid pour connection instead of starved thermals
for ref, num in (("R38", "2"), ("C23", "2"), ("U2", "2"), ("R36", "2"), ("C27", "2"), ("C29", "2"), ("C30", "2"), ("R40", "2"), ("C33", "2")):
    pad(ref, num).SetLocalZoneConnection(pcbnew.ZONE_CONNECTION_FULL)
pcbnew.SaveBoard(sys.argv[2], b)
ok = pcbnew.ExportSpecctraDSN(b, sys.argv[3]); print("DSN export:", ok)
