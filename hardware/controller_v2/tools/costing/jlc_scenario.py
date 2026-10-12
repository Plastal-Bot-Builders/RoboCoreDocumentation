"""JLCPCB quotes (2026-10-07, 20 units, from Fred's JLCPCB account) vs PCBWay, per robot."""
import cost_model as cm
N=20
# JLCPCB quote pages: PCB + PCBA (fees + the components JLC could supply)
JLC={'main':98.69+722.35, 'line':6.80+35.95, 'us':7.20+43.41}
# parts JLC couldn't supply in this quote, priced at LCSC (bought separately / pre-ordered)
EXTRA={'main':20*0.29 + 20*1.05 + 18*0.6267,            # J404 BM05B, U105 TPS3700, SW101 shortfall
       'line':20*0.29 + 60*1.2288,                       # J1 BM05B, 3x TCRT5000 (hand-soldered in-house)
       'us':20*2.61 + 20*0.3053 + 20*0.3049}             # CS100A (AliExpress), TX + RX transducers (in-house)
SHIP=90                                                   # est. DHL for ~3.6 kg (JLC's weights) to Zambia
elec_cif=sum(JLC.values())+sum(EXTRA.values())+SHIP
print('JLC per board:', {k: round((JLC[k]+EXTRA[k])/N,2) for k in JLC})
print(f'JLC electronics CIF per robot: ${elec_cif/N:.2f}  (PCBWay: $90.42)')
mech_sf=sum(cm.MECH_IMPORT.values())*cm.MECH_FACTOR
mech_loc=sum(cm.MECH_LOCAL.values())
for duty in (0,0.15):
    for label,motor in (('SparkFun motors',28.5),('motors $12/pair (assumed)',12)):
        mech=mech_sf-(28.5-motor)*cm.MECH_FACTOR+mech_loc
        tot=(elec_cif/N*(1+duty)*1.16+mech)*1.10
        print(f'duty {int(duty*100):2d}%, {label:26s}: ${tot:.0f} per robot')
