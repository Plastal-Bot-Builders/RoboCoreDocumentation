import cost_model as cm
from comp_cost import board_cost
B=cm.B
def scen(N, pcb, asm, ship, motor_pair, duty=0.15, label=''):
    comp=sum(board_cost(b,N)[0] for b in B)*cm.SOURCING
    elec=(comp+sum(pcb)+sum(asm)+ship)*(1+duty)*1.16
    mi=dict(cm.MECH_IMPORT); mi['Motor pair with encoders (SparkFun ROB-24053, XRP motor)']=motor_pair
    mech=sum(mi.values())*cm.MECH_FACTOR*N + sum(cm.MECH_LOCAL.values())*N
    tot=(elec+mech)*1.10
    print(f'{label:55s} N={N}: elec ${elec/N:.0f}/robot, mech ${mech/N:.0f}/robot, total ${tot/N:.0f}/robot')
# 20 units: sensors merged into one assembly job (one $88 fee), motors China-direct at an ASSUMED $12/pair
scen(20,[103.02,24.61,23.05],[535.04,88,0],65,12,label='20 units, sensors in one job, motors $12/pair (assumed)')
scen(20,[103.02,24.61,23.05],[535.04,88,0],65,28.5,label='20 units, sensors in one job, SparkFun motors')
# 50 units: assembly from PCBWay table; PCB extrapolated from 10/20 quotes; SparkFun 25+ price or assumed China price
pcb50=[103.02+30*2.016,24.61+30*0.493,23.05+30*0.39]
scen(50,pcb50,[663.86,196.52,183.84],90,27.08,label='50 units, as designed, SparkFun motors (25+ price)')
scen(50,pcb50,[663.86,196.52,0],90,12,label='50 units, sensors in one job, motors $12/pair (assumed)')
for N in (50,):
    print('components/robot at 50:', round(sum(board_cost(b,N)[0] for b in B)/N,2))
