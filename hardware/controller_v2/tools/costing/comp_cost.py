import json, math
import os
HERE=os.path.dirname(os.path.abspath(__file__))
bom=json.load(open(os.path.join(HERE,'bom_codes.json'))); P=json.load(open(os.path.join(HERE,'lcsc_prices.json')))
PASSIVE=lambda mpn: mpn.startswith(('CL0','CL1','CL2','CL3','RC0','0402','0603'))
def price(code, n):
    p=P[code]; lad=p['prices']; unit=lad[0][1]
    for q,u in lad:
        if n>=q: unit=u
    return unit
def board_cost(board, N, extra_cs100a=2.61):
    agg={}
    for c,q,m in bom[board]:
        key=c or m; agg.setdefault(key,[0,m]); agg[key][0]+=q
    tot=0; lines=[]
    for key,(q,m) in agg.items():
        if key=='CS100A':
            cost=extra_cs100a*N*q; tot+=cost; lines.append((m,q,cost)); continue
        need=N*q
        if PASSIVE(m): need=max(P[key]['min'], need+5)      # attrition + MOQ (reel cut)
        elif need>=10: need=math.ceil(need*1.02)          # ~2 % spare on parts
        else: need=max(P[key]['min'], need)
        cost=need*price(key,need); tot+=cost; lines.append((m,q,cost))
    return tot, sorted(lines,key=lambda x:-x[2])
if __name__=='__main__':
  for N in (2,10,20):
    row=[]
    for b in bom:
        t,_=board_cost(b,N); row.append(f'{b}: ${t:.2f} total, ${t/N:.2f}/unit')
    print(N, ' | '.join(row))
  t,l=board_cost('RoboCore_V2_Controller',20)
  print('top main-board cost lines at 20 units:'); [print(f'  {m:28s} x{q}  ${c:.2f}') for m,q,c in l[:12]]
