"""Key the white-background line drawings to navy-on-transparent PNGs (run from this folder: python3 key.py).

Required sources: robot_isometric_drawing_src.png, robot_side_src.png, robot_top_src.png, robot_rear_src.png,
board_top_src.png, board_iso_src.webp, linesensor_iso_src.png.
Optional (picked up when present): servo_iso_src.*, servo_side_src.*, hcsr04_iso_src.*, hcsr04_front_src.*
The board top view and the HC-SR04 front view also get a small geometry file so make_branded.py can print them 1:1
on the real holes.
"""
import glob, json, os
import numpy as np, cv2
from PIL import Image, ImageOps

NAVY = (27, 42, 65)


def src(name):
    f = glob.glob(name + '_src.*')
    return f[0] if f else None


def key(path, dst, blank_title_block=False, flips=()):
    a = np.array(Image.open(path).convert('L'))
    if blank_title_block:                      # Fusion drawing title block, bottom right
        h, w = a.shape
        tb = a < 200
        tb[:int(h * 0.9)] = False
        tb[:, :int(w * 0.6)] = False
        ys, xs = np.where(tb)
        if len(ys):
            a[ys.min() - 2:, xs.min() - 2:] = 255
    ink = a < 200
    ys, xs = np.where(ink)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    c = a[y0:y1 + 1, x0:x1 + 1].astype(float)
    alpha = np.clip((235 - c) / 120, 0, 1) * 255
    rgb = np.zeros(c.shape + (3,), np.uint8)
    rgb[..., 0], rgb[..., 1], rgb[..., 2] = NAVY
    im = Image.fromarray(np.dstack([rgb, alpha.astype(np.uint8)]), 'RGBA')
    im.save(dst)
    if 'h' in flips:
        ImageOps.mirror(im).save(dst.replace('.png', '_flipped.png'))
    if 'v' in flips:
        ImageOps.flip(im).save(dst.replace('.png', '_vflip.png'))
    print('keyed', dst, im.size)
    return im


key(src('robot_isometric_drawing'), 'robot_lineart.png', True)
key(src('robot_side'), 'robot_side.png', flips='hv')
key(src('robot_top'), 'robot_top.png', flips='h')
key(src('robot_rear'), 'robot_rear.png')
key(src('board_iso'), 'board_iso.png')
key(src('linesensor_iso'), 'linesensor_iso.png')
for n in ('servo_iso', 'servo_side', 'hcsr04_iso'):
    if src(n):
        key(src(n), n + '.png')

# ---- board top view: the drawing is stretched a little in x; find the mounting holes, make it isotropic, record them
im = key(src('board_top'), 'board_top.png')
a = np.array(im)[:, :, 3]
H, W = a.shape
g = cv2.GaussianBlur((255 - a).astype(np.uint8), (5, 5), 1.2)
cs = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.2, minDist=25, param1=120, param2=16, minRadius=16, maxRadius=30)[0]
sx0 = W / 70.0                       # rough: 68 mm board + the 2 mm switch lever
exp = {'TR': (W - 5.5 * sx0, 8.15 * sx0), 'BL': (3.5 * sx0, H - 3.1 * sx0), 'BR': (W - 5.5 * sx0, H - 3.1 * sx0)}
h = {k: min(cs, key=lambda c: (c[0] - ex) ** 2 + (c[1] - ey) ** 2) for k, (ex, ey) in exp.items()}
sx = ((h['TR'][0] + h['BR'][0]) / 2 - h['BL'][0]) / 61.3
sy = H / 64.8                        # 60 mm board + 4.8 mm antenna overhang
k = sy / sx
im = im.resize((round(W * k), H), Image.LANCZOS)
im.save('board_top.png')
xl, xr = float(h['BL'][0] * k), float((h['TR'][0] + h['BR'][0]) / 2 * k)
yt, yb = float(h['TR'][1]), float((h['BL'][1] + h['BR'][1]) / 2)
json.dump({'W': im.size[0], 'H': int(H), 'px_mm': float(sy), 'holes': {'TL': [xl, yt, 20], 'TR': [xr, yt, 20], 'BL': [xl, yb, 20], 'BR': [xr, yb, 20]}},
          open('board_geom.json', 'w'))
print('board top: %.2f px/mm, hole pitch %.1f x %.1f mm' % (sy, (xr - xl) / sy, (yb - yt) / sy))

# ---- HC-SR04 front view (optional): crop the header pins below the board edge, find the two cans
if src('hcsr04_front'):
    im = key(src('hcsr04_front'), 'hcsr04_front.png')     # keep the pins: they point up when the module is mounted
    a = np.array(im)[:, :, 3]
    H, W = a.shape
    g = cv2.GaussianBlur((255 - a).astype(np.uint8), (7, 7), 2)
    cs = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.5, minDist=int(W * 0.15), param1=120, param2=18, minRadius=int(W * 0.14), maxRadius=int(W * 0.22))
    cans = []
    if cs is not None:
        s_px = W / 45.0                                  # the board is 45 mm wide
        for ex in (W / 2 - 13 * s_px, W / 2 + 13 * s_px):   # cans 26 mm apart, about mid-height
            cans.append(min(cs[0], key=lambda c: (c[0] - ex) ** 2 + (c[1] - H * 0.52) ** 2))
    if len(cans) == 2:
        json.dump({'W': W, 'H': H, 'cans': [[float(v) for v in c] for c in cans]}, open('hcsr04_geom.json', 'w'))
        print('hcsr04 front: cans at', [[round(v) for v in c] for c in cans])
    else:
        print('hcsr04 front: could not find the two cans, flap image skipped')
