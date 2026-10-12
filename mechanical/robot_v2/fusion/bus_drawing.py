"""Expansion-bus drawing for the RoboCore V2 robot (rev 5): rail section with the clip, plan view
of the hole row / detents / dock. Plain matplotlib, run outside Fusion:
    python3 bus_drawing.py   ->  ../renders/bus_spec.png
The plan geometry comes from build_robot (plan(), bus_positions()), loaded with stand-in Fusion modules.
"""
import math
import os
import sys
import types
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle

for _m in ('adsk', 'adsk.core', 'adsk.fusion', 'rc_lib'):
    sys.modules.setdefault(_m, types.ModuleType(_m))
sys.modules['adsk'].core = sys.modules['adsk.core']
sys.modules['adsk'].fusion = sys.modules['adsk.fusion']
import rc_params as P
import build_robot as BR

INK, BODY, CLIP, DIM, WARN = '#1f2a30', '#9fc3cb', '#2b2b2b', '#c0392b', '#e8a33d'
H, Y0, Y1 = P.BODY_HALF, P.BODY_Y0, P.BODY_Y1
DECK_Z = P.BODY_TOP - P.DECK_T


def dim(ax, a, b, text, off=(0, 0), fs=8):
    ax.annotate('', xy=a, xytext=b, arrowprops=dict(arrowstyle='<->', color=DIM, lw=0.8))
    ax.text((a[0] + b[0]) / 2 + off[0], (a[1] + b[1]) / 2 + off[1], text, color=DIM, fontsize=fs, ha='center', va='center')


def section(ax):
    """Wall cross-section at a front-section side: the flush bus groove under the deck, the band behind it and the
    hole band, with the clip. d = mm outward from the wall face."""
    t, b = P.SKIN_T, P.HOLE_BAND_T
    depth_g, gz0, gz1 = P.BUS_GROOVE
    bt, bz = P.BUS_BAND
    bz0 = P.HOLE_BAND[0]
    wall = [(-t, 30), (0, 30), (0, gz0 - depth_g), (-depth_g, gz0), (-depth_g, gz1), (0, gz1), (0, P.BODY_TOP), (-17, P.BODY_TOP),
            (-17, DECK_Z), (-b, DECK_Z), (-b, bz0 + (b - t)), (-t, bz0)]
    ax.add_patch(Polygon(wall, closed=True, fc=BODY, ec=INK, lw=1.2))
    ax.text(-13.5, DECK_Z + 1.2, 'deck', fontsize=7, ha='center', va='center', color=INK)
    ax.add_patch(Polygon([(-b, P.HOLE_Z - P.HOLE_D / 2), (0, P.HOLE_Z - P.HOLE_D / 2), (0, P.HOLE_Z + P.HOLE_D / 2), (-b, P.HOLE_Z + P.HOLE_D / 2)],
                         closed=True, fc='white', ec=INK, lw=0.8, hatch='////'))
    # clip (template): tongue in the groove, bar over the deck edge, tab with an M3 insert, thumb screw onto the deck
    g, ct = P.CLIP_GAP, P.CLIP_T
    reach, th = P.CLIP_TAB
    xin0, xtab = -reach, -1.0
    xo0, xo1 = g, g + ct
    zb0, zb1 = P.BODY_TOP + g, P.BODY_TOP + g + ct
    xtip, ztop, zund = -depth_g + g, gz1 - g, gz0 + 2 * g
    clip = [(xin0, zb0), (xo0, zb0), (xo0, ztop), (xtip, ztop), (xtip, zund), (xo0, zund - (xo0 - xtip)), (xo0, P.CLIP_LEG_Z0),
            (xo1, P.CLIP_LEG_Z0), (xo1, zb1), (xtab, zb1), (xtab - (th - ct), zb0 + th), (xin0, zb0 + th)]
    ax.add_patch(Polygon(clip, closed=True, fc='none', ec=CLIP, lw=1.2, ls='--'))
    xs_ = BR.clip_screw_x(0.0)
    ax.add_patch(Polygon([(xs_ - 1.5, P.BODY_TOP), (xs_ + 1.5, P.BODY_TOP), (xs_ + 1.5, zb0 + th + 1), (xs_ - 1.5, zb0 + th + 1)],
                         closed=True, fc='#bbb', ec=CLIP, lw=0.8))
    ax.add_patch(Polygon([(xs_ - 3.5, zb0 + th + 1), (xs_ + 3.5, zb0 + th + 1), (xs_ + 3.5, zb0 + th + 3), (xs_ - 3.5, zb0 + th + 3)],
                         closed=True, fc='#bbb', ec=CLIP, lw=0.8))
    ax.text(xs_ - 4.5, zb0 + th + 2, 'M3 thumb screw\n(insert in the tab)\npresses on the deck', fontsize=6.5, ha='right', va='center', color=CLIP)
    ax.add_patch(Polygon([(xo1, P.CLIP_LEG_Z0), (xo1 + 5, P.CLIP_LEG_Z0), (xo1 + 5, zb1), (xo1, zb1)], closed=True, fc='none', ec=CLIP, lw=1.0, ls='--'))
    ax.text(xo1 + 2.5, P.CLIP_LEG_Z0 - 3.5, 'M3 insert\n(accessory)', fontsize=6.5, ha='center', color=CLIP)
    dim(ax, (-t, 32.0), (0, 32.0), '%g wall' % t, (0, -0.9))
    ax.annotate('bus groove %.1f deep, z %g-%g\n45-degree underside (prints top-down)\nthe tongue pulls up against its flat top' % (depth_g, gz0, gz1),
                xy=(-depth_g / 2, (gz0 + gz1) / 2), xytext=(6.0, 44.0), fontsize=7, color=INK, arrowprops=dict(arrowstyle='->', color=INK, lw=0.7))
    ax.annotate('V-detent %.1f x %.1f in the groove back\nevery %g mm' % (P.DETENT[0], P.DETENT[1], P.DETENT_PITCH),
                xy=(-depth_g, gz0 + 1.5), xytext=(1.0, 61.0), fontsize=7, color=INK, arrowprops=dict(arrowstyle='->', color=INK, lw=0.7))
    ax.annotate('deck top z %g\n(prints on the bed)' % P.BODY_TOP, xy=(-16, DECK_Z), xytext=(-24, 44.0), fontsize=7, color=DIM,
                arrowprops=dict(arrowstyle='->', color=DIM, lw=0.8))
    dim(ax, (-b, bz0 - 1.5), (-t, bz0 - 1.5), '%g band' % b, (0, -1.0))
    ax.text(-b - 0.3, P.HOLE_Z, 'Ø%.1f @ z %g' % (P.HOLE_D, P.HOLE_Z), fontsize=7.5, ha='right', va='center', color=INK)
    ax.set_xlim(-25, 14)
    ax.set_ylim(29, 64)
    ax.set_aspect('equal')
    ax.set_title('Wall section (front-section side) with the bus clip', fontsize=10, color=INK)
    ax.set_xlabel('mm outward from the wall face')
    ax.set_ylabel('height above the floor (mm)')
    ax.grid(alpha=0.25)


def plan(ax):
    ax.add_patch(Polygon(BR.plan(0), closed=True, fc=BODY, ec=INK, lw=1.2))
    for (s_, e_, n, k) in BR.plan_runs(0.0):
        if not BR.groove_skip(k):
            ax.plot([s_[0] - n[0] * 1.2, e_[0] - n[0] * 1.2], [s_[1] - n[1] * 1.2, e_[1] - n[1] * 1.2], color=INK, lw=1.6, alpha=0.5)
    wx0, wx1, wy0, wy1 = P.WELL
    for s in (1, -1):
        ax.add_patch(Polygon([(s * wx0, wy0), (s * wx1, wy0), (s * wx1, wy1), (s * wx0, wy1)], closed=True, fc='#555', ec=INK, lw=0.6))
        ax.add_patch(Polygon([(s * (H + 1), -P.WHEEL_SEC_Y), (s * (H + 6), -P.WHEEL_SEC_Y),
                              (s * (H + 6), P.WHEEL_SEC_Y), (s * (H + 1), P.WHEEL_SEC_Y)],
                             closed=True, fc=WARN, ec='none', alpha=0.8))
    # board on the deck
    ax.add_patch(Polygon([(-34, -30), (34, -30), (34, 30), (-34, 30)], closed=True, fc='none', ec='#2e7d32', lw=1.0, ls='--'))
    ax.text(0, 0, 'RoboCore V2 board\non the deck\n4 x M2 insert', fontsize=7, ha='center', va='center', color='#2e7d32')
    hp, det = BR.bus_positions()
    for (x, y, n) in hp:
        ax.add_patch(Circle((x - 1.8 * n[0], y - 1.8 * n[1]), 2.0, fc=INK, ec='none'))
    ax.plot([d[0] for d in det], [d[1] for d in det], 'v', ms=3, color=DIM, ls='none')
    for (x, y) in P.DOCK_INSERTS:
        ax.add_patch(Circle((x, y), 2.5, fc='white', ec=DIM, lw=1.2))
    tx0, tx1 = P.TOWER_X
    for s in (1, -1):
        ax.add_patch(Polygon([(s * tx0, P.TOWER_Y[0]), (s * tx1, P.TOWER_Y[0]), (s * tx1, P.TOWER_Y[1]), (s * tx0, P.TOWER_Y[1])], closed=True, fc='none', ec=DIM, lw=0.8))
    ax.add_patch(Polygon([(-31, P.SONAR_PLATE_Y[1]), (31, P.SONAR_PLATE_Y[1]), (31, P.SONAR_PLATE_Y[0]), (-31, P.SONAR_PLATE_Y[0])], closed=True, fc='none', ec=DIM, lw=0.6, ls=':'))
    ax.annotate('front dock: 2 x M3 insert,\n%g mm apart (sonar bracket,\narm base on top)' % (2 * P.DOCK_INSERTS[1][0]), xy=P.DOCK_INSERTS[1],
                xytext=(H - 5, 68), fontsize=6.5, color=DIM, arrowprops=dict(arrowstyle='->', color=DIM, lw=0.7))
    # clips as fitted
    yc = BR.detent_near(P.HALF_REAR, P.CLIP_Y)[1]
    ax.add_patch(Polygon([(P.HALF_REAR - 13, yc - 8), (P.HALF_REAR + 6, yc - 8), (P.HALF_REAR + 6, yc + 8), (P.HALF_REAR - 13, yc + 8)],
                         closed=True, fc='none', ec=CLIP, lw=1.0, ls='--'))
    ax.text(P.HALF_REAR + 8, yc, 'bus clip', fontsize=6.5, va='center', color=CLIP)
    for x in P.BALLAST_CLIP_X:
        ax.add_patch(Polygon([(x - 8, Y0 + 13), (x + 8, Y0 + 13), (x + 8, Y0 - 20), (x - 8, Y0 - 20)], closed=True, fc='none', ec=CLIP, lw=1.0, ls='--'))
    ax.text(0, Y0 - 16, 'ballast clips (3 x M8 nut each, with the arm)', fontsize=6.5, ha='center', color=CLIP)
    ax.add_patch(Polygon([(-P.BATT_RAIL_X, Y0 - 3.5), (P.BATT_RAIL_X, Y0 - 3.5), (P.BATT_RAIL_X, Y0 + 1), (-P.BATT_RAIL_X, Y0 + 1)], closed=True, fc='white', ec=INK, lw=0.6))
    ax.text(0, Y0 + 6, 'battery in from the back', fontsize=6.5, ha='center', color=INK)
    ax.text(H + 12, 0, 'no groove over\nthe wheels\n(|y| < %g)' % P.WHEEL_SEC_Y, fontsize=7, ha='left', va='center', color='#9a6200')
    ax.annotate('front', xy=(0, P.LEG_Y1 + 8), xytext=(0, P.LEG_Y1 + 17), ha='center', fontsize=8, arrowprops=dict(arrowstyle='->', color=INK))
    ax.text(-H - 36, 72, 'hole row Ø%.1f, %g mm pitch,\nz %g, front-section sides\n(%d holes)\n\ngroove detents every %g mm\n(%d)' % (
        P.HOLE_D, P.HOLE_PITCH, P.HOLE_Z, len(hp), P.DETENT_PITCH, len(det)), fontsize=7.5, ha='left', va='center', color=INK)
    ax.set_xlim(-H - 40, H + 36)
    ax.set_ylim(Y0 - 26, P.LEG_Y1 + 22)
    ax.set_aspect('equal')
    ax.set_title('Plan: the bus groove (thick line) runs round every face except over the wheels', fontsize=10, color=INK)
    ax.set_xlabel('x (mm), robot centre = axle midpoint')
    ax.grid(alpha=0.2)


def main():
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(15, 7.4), gridspec_kw={'width_ratios': [1, 1.55]})
    section(a1)
    plan(a2)
    fig.suptitle('RoboCore V2 robot, rev 5: mechanical expansion bus', fontsize=13, color=INK, x=0.02, ha='left')
    fig.tight_layout(rect=(0, 0, 1, 0.95))
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'renders', 'bus_spec.png')
    fig.savefig(out, dpi=150)
    print(os.path.abspath(out))


if __name__ == '__main__':
    main()
