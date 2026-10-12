import json
from comp_cost import board_cost
B=['RoboCore_V2_Controller','RoboCore_LineSensor','RoboCore_Ultrasonic']
# PCBWay online calculator, 2026-10-07 (FedEx IP to Zambia). 2 = submitted quotes.
PCB={2:[57.43,6.50,6.50],10:[82.86,19.68,19.15],20:[103.02,24.61,23.05]}
ASM={2:[88,29,88],10:[227.71,88,88],20:[535.04,88,88]}
SHIP={2:40,10:50,20:65}          # est. one combined FedEx shipment (calculator: ~$35 per single quote)
SOURCING=1.10                     # PCBWay buys parts at ~LCSC price + ~10 %
MECH_IMPORT={'Motor pair with encoders (SparkFun ROB-24053, XRP motor)':28.50,
 '3 x 18650 cells (quality, ~$3.50 each)':10.50,'3 x 18650 holder':2.00,
 'Servos: SG90 + MG90S':6.00,'JST SH cables (4- and 5-pin)':1.50,'XT30 battery lead':0.50,
 'Screws, inserts, M8 nuts, 2 steel balls':1.50}
MECH_FACTOR=1.10*1.15*1.16       # freight ~10 %, duty 15 %, VAT 16 %
MECH_LOCAL={'PETG ~215 g + TPU ~10 g':5.75,'Printer wear + power (~13 h)':2.00,'Box, labels, printed guide':2.00}
CONT=0.10
def robot(N, duty):
    comp=sum(board_cost(b,N)[0] for b in B)*SOURCING
    pcb=sum(PCB[N]); asm=sum(ASM[N]); ship=SHIP[N]
    elec_cif=comp+pcb+asm+ship
    elec=elec_cif*(1+duty)*1.16
    mech_imp=sum(MECH_IMPORT.values())*MECH_FACTOR*N
    mech_loc=sum(MECH_LOCAL.values())*N
    sub=elec+mech_imp+mech_loc; tot=sub*(1+CONT)
    return dict(N=N,comp=comp,pcb=pcb,asm=asm,ship=ship,elec_cif=elec_cif,elec_taxed=elec,mech_imp=mech_imp,mech_loc=mech_loc,cont=sub*CONT,total=tot,per=tot/N)
if __name__=='__main__':
 res={}
 for duty in (0.0,0.15):
     for N in (2,10,20):
         r=robot(N,duty); res[f'{N}_{int(duty*100)}']=r
         print(f"duty {int(duty*100):2d}% N={N:2d}: comp ${r['comp']:.0f}  pcb ${r['pcb']:.0f}  asm ${r['asm']:.0f}  ship ${r['ship']}  elec CIF ${r['elec_cif']:.0f} -> taxed ${r['elec_taxed']:.0f} | mech imp ${r['mech_imp']:.0f} local ${r['mech_loc']:.0f} | +10% ${r['cont']:.0f} | TOTAL ${r['total']:.0f} = ${r['per']:.0f}/robot")
 print('mech per robot landed:', round(sum(MECH_IMPORT.values())*MECH_FACTOR,2), 'local', sum(MECH_LOCAL.values()))
 for N in (2,10,20):
     print(N,'elec CIF per robot', round(res[f'{N}_0']['elec_cif']/N,2), ' comp/robot', round(res[f'{N}_0']['comp']/N,2),' pcb/robot', round(res[f'{N}_0']['pcb']/N,2),' asm/robot', round(res[f'{N}_0']['asm']/N,2))
 # XRP kit landed in Zambia
 for d in (0,0.25):
     print('XRP landed duty',d, round((119.95+25)*(1+d)*1.16+3,2))
 
