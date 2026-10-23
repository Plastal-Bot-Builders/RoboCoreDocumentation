import json, math, numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MPoly, Circle
import arm_topo as T
import rc_params as P
res = json.load(open('arm_topo_result.json'))
prof = T.rounded_profile(*P.BOOM)
E, t = 2000.0, 3.0            # PETG MPa, plate thickness mm
rho = 1.27e-3                 # g/mm3
Fp = T.F_PAYLOAD / 2
def deflect(c): return c / Fp / (E * t) * 1000.0     # micrometres at the wrist
cur = res['current']; full = res['full_plate']
rows = [('full plate (no windows)', full['area_mm2'], full['compliance'][0], '-'), ('current: 3 diamonds', cur['area_mm2'], cur['compliance'][0], 3)]
for k, v in res['variants'].items():
    rows.append(('optimized, %s of the design area' % k.replace('vf', ''), v['area_mm2'], v['compliance'][0], v['voids']))
print('%-36s %8s %9s %11s %9s %6s' % ('layout', 'area mm2', 'plates g', 'vs current', 'wrist um', 'voids'))
for name, a, c, nv in rows:
    print('%-36s %8.0f %9.2f %+10.0f%% %9.1f %6s' % (name, a, a * t * 2 * rho, 100 * (a / cur['area_mm2'] - 1), deflect(c), nv))
keys = ['vf0.30', 'vf0.20']
fig, axes = plt.subplots(len(keys) + 1, 1, figsize=(9, 2.6 * (len(keys) + 1)))
def base(ax, title):
    ax.add_patch(MPoly(prof, closed=True, fc='#f0b428', ec='#222', lw=1))
    ax.add_patch(Circle((0, 0), 7.0, fc='#f0b428', ec='#222', lw=1))
    ax.add_patch(Circle((0, 0), 2.4, fc='white', ec='#222', lw=0.8))
    for y in P.HORN_HOLES: ax.add_patch(Circle((y, 0), 1.2, fc='white', ec='#222', lw=0.8))
    wy, wz, wd, _ = P.WRIST_BOSS; ax.add_patch(Circle((wy, wz), wd / 2, fc='none', ec='#222', lw=0.8, ls='--'))
    ax.set_xlim(-8, 66); ax.set_ylim(-9, 14.5); ax.set_aspect('equal'); ax.set_title(title, fontsize=10)
    ax.set_xlabel('y along the arm, mm'); ax.set_ylabel('z, mm')
base(axes[0], 'current right plate: three diamond windows (area %.0f mm2, wrist deflection %.1f um at 1.2 N)' % (cur['area_mm2'], deflect(cur['compliance'][0])))
for (y, z, h) in P.BOOM_WINDOWS:
    axes[0].add_patch(MPoly([(y - h, z), (y, z - h), (y + h, z), (y, z + h)], closed=True, fc='white', ec='#222', lw=0.8))
for ax, k in zip(axes[1:], keys):
    v = res['variants'][k]
    base(ax, 'optimized, %s of the design area: %d windows, area %.0f mm2 (%+.0f%% vs current), wrist deflection %.1f um' % (
        k.replace('vf', ''), v['voids'], v['area_mm2'], 100 * (v['area_mm2'] / cur['area_mm2'] - 1), deflect(v['compliance'][0])))
    for poly in v['polygons']:
        ax.add_patch(MPoly(poly, closed=True, fc='white', ec='#222', lw=0.8))
    print(k, 'polygon vertex counts:', [len(p) for p in v['polygons']])
plt.tight_layout(); plt.savefig('arm_topo_proposal.png', dpi=140)
print('wrote arm_topo_proposal.png')
