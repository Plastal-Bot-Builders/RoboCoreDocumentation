"""Expansion-bus drawing for the RoboCore V2 robot (rev 3): rail section with the clip, plan view
of the hole row / detents / dock, and the front dock. Plain matplotlib, run outside Fusion:
    python3 bus_drawing.py   ->  ../renders/bus_spec.png
"""
import math
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle, FancyBboxPatch

import rc_params as P

INK, BODY, CLIP, DIM, WARN = '#1f2a30', '#9fc3cb', '#2b2b2b', '#c0392b', '#e8a33d'
H, Y0, Y1, R = P.BODY_HALF, P.BODY_Y0, P.BODY_Y1, P.BODY_R


def dim(ax, a, b, text, off=(0, 0), fs=8):
    ax.annotate('', xy=a, xytext=b, arrowprops=dict(arrowstyle='<->', color=DIM, lw=0.8))
    ax.text((a[0] + b[0]) / 2 + off[0], (a[1] + b[1]) / 2 + off[1], text, color=DIM, fontsize=fs, ha='center', va='center')


def section(ax):
    """Rail cross-section at a side wall. d = distance outward from the wall face (mm), z = height."""
    bz0 = P.HOLE_BAND[0] - (P.HOLE_BAND_T - P.SKIN_T)
    t, b = P.SKIN_T, P.HOLE_BAND_T
    lip = [(-t, 30), (0, 30), (0, P.RAIL_Z[0]), (P.RAIL_OUT, P.RAIL_Z[1]), (P.RAIL_OUT, P.BODY_TOP), (-t, P.BODY_TOP)]
    band = [(-t, bz0), (-t, P.HOLE_BAND[1]), (-b, P.HOLE_BAND[1]), (-b, bz0 + (b - t)), ]
    ax.add_patch(Polygon(lip, closed=True, fc=BODY, ec=INK, lw=1.2))
    ax.add_patch(Polygon(band + [(-t, bz0)], closed=True, fc=BODY, ec=INK, lw=1.2))
    # hole
    ax.add_patch(Polygon([(-b, P.HOLE_Z - P.HOLE_D / 2), (0, P.HOLE_Z - P.HOLE_D / 2), (0, P.HOLE_Z + P.HOLE_D / 2), (-b, P.HOLE_Z + P.HOLE_D / 2)],
                         closed=True, fc='white', ec=INK, lw=0.8, hatch='////'))
    # clip (template)
    g, ct = P.CLIP_GAP, P.CLIP_T
    xl = P.RAIL_OUT
    xin0, xin1 = -t - g - 5.0, -t - g
    xo0, xo1 = xl + g, xl + g + ct
    zb0, zb1 = P.BODY_TOP + g, P.BODY_TOP + g + ct
    zh = (xo0 - xl) + P.RAIL_Z[1] - 0.35
    hk = P.CLIP_HOOK
    clip = [(xin0, P.HOLE_BAND[1] + 0.5), (xin1, P.HOLE_BAND[1] + 0.5), (xin1, zb0), (xo0, zb0), (xo0, zh), (xo0 - hk, zh - hk),
            (xo0, zh - 2 * hk), (xo0, P.RAIL_Z[0] - 3), (xo1, P.RAIL_Z[0] - 3), (xo1, zb1), (xin0, zb1)]
    ax.add_patch(Polygon(clip, closed=True, fc='none', ec=CLIP, lw=1.2, ls='--'))
    ax.add_patch(Polygon([(xo1, P.RAIL_Z[0] - 3), (xo1 + 5, P.RAIL_Z[0] - 3), (xo1 + 5, zb1), (xo1, zb1)], closed=True, fc='none', ec=CLIP, lw=1.0, ls='--'))
    ax.text(xo1 + 2.5, P.RAIL_Z[0] + 2.5, 'M3\ninsert', fontsize=6.5, ha='center', color=CLIP)
    ax.text(xin0 + 2.5, P.HOLE_BAND[1] + 3.0, 'thumb\nscrew', fontsize=6.5, ha='center', color=CLIP)
    # dimensions
    dim(ax, (0, 55.5), (P.RAIL_OUT, 55.5), '%g' % P.RAIL_OUT, (0, 0.9))
    dim(ax, (-t, 57.5), (0, 57.5), '%g wall' % t, (0, 0.9))
    dim(ax, (5.2, P.RAIL_Z[0]), (5.2, P.RAIL_Z[1]), '45°', (1.6, 0))
    ax.annotate('rail top z %g' % P.BODY_TOP, xy=(-1.5, P.BODY_TOP), xytext=(-14.5, 57.5), fontsize=7.5, color=DIM,
                arrowprops=dict(arrowstyle='->', color=DIM, lw=0.8))
    dim(ax, (-b, 32.5), (-t, 32.5), '%g band' % b, (0, -1.0))
    ax.text(-b - 0.3, P.HOLE_Z, 'Ø%.1f @ z %g' % (P.HOLE_D, P.HOLE_Z), fontsize=7.5, ha='right', va='center', color=INK)
    ax.annotate('V-detent %.1f x %.1f in the lip face\nevery %g mm' % (P.DETENT[0], P.DETENT[1], P.DETENT_PITCH),
                xy=(P.RAIL_OUT, P.BODY_TOP - 1.0), xytext=(4.0, 57.3), fontsize=7, color=INK,
                arrowprops=dict(arrowstyle='->', color=INK, lw=0.7))
    ax.set_xlim(-16, 13)
    ax.set_ylim(29, 59)
    ax.set_aspect('equal')
    ax.set_title('Rail section (side wall) with the bus clip', fontsize=10, color=INK)
    ax.set_xlabel('mm outward from the wall face')
    ax.set_ylabel('height above the floor (mm)')
    ax.grid(alpha=0.25)


def outline(d, n=24):
    pts = []
    corners = [(H - R, Y1 - R, 0), (-(H - R), Y1 - R, 90), (-(H - R), Y0 + R, 180), (H - R, Y0 + R, 270)]
    for (cx, cy, a0) in corners:
        for k in range(n + 1):
            a = math.radians(a0 + 90.0 * k / n)
            pts.append((cx + (R + d) * math.cos(a), cy + (R + d) * math.sin(a)))
    return pts


def plan(ax):
    ax.add_patch(Polygon(outline(P.RAIL_OUT), closed=True, fc=BODY, ec=INK, lw=1.2))
    ax.add_patch(Polygon(outline(0), closed=True, fc='none', ec=INK, lw=0.6, ls=':'))
    ax.add_patch(Polygon(outline(-P.SKIN_T), closed=True, fc='white', ec=INK, lw=0.8))
    wx0, wx1, wy0, wy1 = P.WELL
    for s in (1, -1):
        ax.add_patch(Polygon([(s * wx0, wy0), (s * wx1, wy0), (s * wx1, wy1), (s * wx0, wy1)], closed=True, fc='#555', ec=INK, lw=0.6))
        ax.add_patch(Polygon([(s * (H + P.RAIL_OUT + 1), -25), (s * (H + P.RAIL_OUT + 6), -25), (s * (H + P.RAIL_OUT + 6), 25), (s * (H + P.RAIL_OUT + 1), 25)],
                             closed=True, fc=WARN, ec='none', alpha=0.8))
    # holes
    hx = [(s * (H - 1.5), y) for s in (1, -1) for y in P.HOLES_SIDE_Y] + [(x, Y0 + 1.5) for x in P.HOLES_REAR_X] + [(x, Y1 - 1.5) for x in P.HOLES_FRONT_X]
    for (x, y) in hx:
        ax.add_patch(Circle((x, y), 2.0, fc=INK, ec='none'))
    # detents
    det = [(s * (H + P.RAIL_OUT), -62.0 + 8.0 * k) for s in (1, -1) for k in range(14)]
    det += [(8.0 * k, Y0 - P.RAIL_OUT) for k in range(-7, 8)] + [(8.0 * k, Y1 + P.RAIL_OUT) for k in range(-7, 8)]
    ax.plot([p[0] for p in det], [p[1] for p in det], 'v', ms=3, color=DIM, ls='none')
    # dock
    for (x, y) in P.DOCK_INSERTS:
        ax.add_patch(Circle((x, y), 2.5, fc='white', ec=DIM, lw=1.2))
    tx0, tx1 = P.TOWER_X
    for s in (1, -1):
        ax.add_patch(Polygon([(s * tx0, P.TOWER_Y[0]), (s * tx1, P.TOWER_Y[0]), (s * tx1, P.TOWER_Y[1]), (s * tx0, P.TOWER_Y[1])], closed=True, fc='none', ec=DIM, lw=0.8))
    ax.text(0, 50.5, 'front dock\n2 x M3 insert, %g mm apart' % (2 * P.DOCK_INSERTS[1][0]), fontsize=7, ha='center', color=DIM)
    ax.text(H + 9, 0, 'no clips over\nthe wheels\n(|y| < 25)', fontsize=7, ha='left', va='center', color='#9a6200')
    ax.annotate('front', xy=(0, Y1 + 9), xytext=(0, Y1 + 18), ha='center', fontsize=8, arrowprops=dict(arrowstyle='->', color=INK))
    ax.text(0, -20, 'hole row Ø%.1f, %g mm pitch, z %g\n(%d holes)\n\nrail detents every %g mm\n(%d)' % (
        P.HOLE_D, P.HOLE_PITCH, P.HOLE_Z, len(hx), P.DETENT_PITCH, len(det)), fontsize=8, ha='center', va='center', color=INK)
    ax.set_xlim(-H - 25, H + 32)
    ax.set_ylim(Y0 - 12, Y1 + 22)
    ax.set_aspect('equal')
    ax.set_title('Plan: 8 mm grid on the sides, back and front', fontsize=10, color=INK)
    ax.set_xlabel('x (mm), robot centre = axle midpoint')
    ax.grid(alpha=0.2)


def main():
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(14, 6.6), gridspec_kw={'width_ratios': [1, 1.45]})
    section(a1)
    plan(a2)
    fig.suptitle('RoboCore V2 robot, rev 3: mechanical expansion bus', fontsize=13, color=INK, x=0.02, ha='left')
    fig.tight_layout(rect=(0, 0, 1, 0.95))
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'renders', 'bus_spec.png')
    fig.savefig(out, dpi=150)
    print(os.path.abspath(out))


if __name__ == '__main__':
    main()
