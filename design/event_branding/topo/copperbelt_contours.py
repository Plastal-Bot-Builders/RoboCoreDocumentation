"""Topographic contour art from real Copperbelt terrain (Copernicus GLO-30, 30 m), for the RoboCore event pieces.

    uv run --no-project --python 3.12 --with numpy --with tifffile --with imagecodecs --with scikit-image \
        --with scipy --with pillow python -I copperbelt_contours.py DEM_DIR OUT_DIR [overview | SAMPLE ...]

- overview: a hillshade of the whole mosaic with the towns marked, to choose areas.
- SAMPLE names come from SAMPLES below. Each writes OUT_DIR/<name>.svg (1080 x 1080 viewBox: one path per
  contour, index contours in their own group) and <name>_preview.jpg (the lines on yellow and on navy).

The DEM is a surface model (trees and buildings included), so it is smoothed before contouring and tiny loops are dropped.
"""
import math
import sys
from pathlib import Path

import numpy as np
import tifffile
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
from skimage import measure

ARC = 3600                       # samples per degree (1 arc-second tiles)
TOWNS = {'Kitwe': (-12.80, 28.21), 'Ndola': (-12.96, 28.64), 'Chingola': (-12.53, 27.86), 'Mufulira': (-12.55, 28.24),
         'Luanshya': (-13.14, 28.40), 'Chililabombwe': (-12.37, 27.83), 'Kalulushi': (-12.84, 28.09)}
# name: centre (lat, lon), side (km), contour interval (m), smoothing (m), index every n-th line, minimum loop length (px)
SAMPLES = {
    'kitwe': dict(centre=(-12.80, 28.20), side=24, interval=4, smooth=90, index=5, min_len=60),
    'kitwe_calm': dict(centre=(-12.80, 28.20), side=24, interval=6, smooth=170, index=5, min_len=140),
    'mufulira_calm': dict(centre=(-12.55, 28.24), side=20, interval=6, smooth=150, index=5, min_len=120),
    'chingola_calm': dict(centre=(-12.505, 27.865), side=14, interval=10, smooth=80, index=5, min_len=80),
    'copperbelt_calm': dict(centre=(-12.66, 28.25), side=75, interval=14, smooth=550, index=5, min_len=140),
    # 'flow': heavy smoothing, so the lines run long and smooth like the box art while keeping the real shape of the land
    'kitwe_flow': dict(centre=(-12.80, 28.20), side=30, interval=5, smooth=450, index=5, min_len=220),
    'mufulira_flow': dict(centre=(-12.55, 28.24), side=24, interval=5, smooth=400, index=5, min_len=220),
    'chingola_flow': dict(centre=(-12.505, 27.865), side=16, interval=12, smooth=150, index=5, min_len=120),
    'copperbelt_flow': dict(centre=(-12.66, 28.25), side=75, interval=8, smooth=1300, index=5, min_len=220),
    'chingola': dict(centre=(-12.505, 27.865), side=14, interval=4, smooth=50, index=5, min_len=40),   # Nchanga open pit
    'copperbelt': dict(centre=(-12.66, 28.25), side=75, interval=8, smooth=220, index=5, min_len=60),  # Chingola to Ndola
    'mufulira': dict(centre=(-12.55, 28.24), side=20, interval=4, smooth=80, index=5, min_len=50),
}
YELLOW, OCHRE, NAVY, CREAM = (242, 176, 30), (217, 151, 26), (27, 42, 65), (246, 239, 224)


def mosaic(dem_dir):
    """All tiles in DEM_DIR as one array, with the top-left corner (lat, lon). Missing tiles are NaN."""
    tiles = {}
    for p in Path(dem_dir).glob('Copernicus_DSM_COG_10_*_DEM.tif'):
        parts = p.stem.split('_')          # Copernicus DSM COG 10 S13 00 E028 00 DEM
        lat = (-1 if parts[4][0] == 'S' else 1) * int(parts[4][1:])
        lon = (-1 if parts[6][0] == 'W' else 1) * int(parts[6][1:])
        tiles[(lat, lon)] = p          # tile name = its south-west corner
    lats, lons = [k[0] for k in tiles], [k[1] for k in tiles]
    top, left = max(lats) + 1, min(lons)
    rows, cols = top - min(lats), max(lons) + 1 - left
    z = np.full((rows * ARC, cols * ARC), np.nan, dtype=np.float32)
    for (lat, lon), p in tiles.items():
        a = tifffile.imread(p)
        if a.shape != (ARC, ARC):
            raise SystemExit(f'{p.name}: unexpected shape {a.shape}')
        r, c = (top - (lat + 1)) * ARC, (lon - left) * ARC
        z[r:r + ARC, c:c + ARC] = a
    return z, top, left


def window(z, top, left, centre, side_km, n):
    """An n x n grid covering a side_km square on the ground around centre (lat, lon)."""
    lat, lon = centre
    dlat = side_km / 110.57
    dlon = side_km / (111.32 * math.cos(math.radians(lat)))
    r0, c0 = (top - (lat + dlat / 2)) * ARC, (lon - dlon / 2 - left) * ARC
    rr, cc = np.meshgrid(np.linspace(r0, r0 + dlat * ARC, n), np.linspace(c0, c0 + dlon * ARC, n), indexing='ij')
    w = ndimage.map_coordinates(z, [rr, cc], order=1, mode='nearest', cval=np.nan)
    if np.isnan(w).any():
        raise SystemExit('window reaches a missing tile')
    return w


def catmull_rom(pts, closed):
    """Smooth cubic Bezier path through the points (x, y)."""
    p = list(pts)
    if closed:
        p = p[:-1] if np.allclose(p[0], p[-1]) else p
        ext = [p[-1]] + p + [p[0], p[1]]
    else:
        ext = [p[0]] + p + [p[-1]]
    f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')
    d = [f'M{f(p[0][0])} {f(p[0][1])}']
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f'C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}')
    if closed:
        d.append('Z')
    return ''.join(d)


def contours(w, cfg, n):
    px_m = cfg['side'] * 1000 / n
    s = ndimage.gaussian_filter(w, cfg['smooth'] / px_m)
    lo = math.ceil(s.min() / cfg['interval']) * cfg['interval']
    out = []
    for level in np.arange(lo, s.max(), cfg['interval']):
        is_index = round(level / cfg['interval']) % cfg['index'] == 0
        for c in measure.find_contours(s, level):
            xy = c[:, ::-1]                                    # (row, col) -> (x, y)
            length = np.sum(np.hypot(*np.diff(xy, axis=0).T))
            if length < cfg['min_len']:
                continue
            simple = measure.approximate_polygon(xy, tolerance=0.45)
            if len(simple) < 3:
                continue
            closed = np.allclose(xy[0], xy[-1])
            out.append(dict(level=float(level), index=is_index, pts=simple, closed=closed))
    return out, float(s.min()), float(s.max())


def write_svg(path, lines, n, meta):
    norm = [catmull_rom(l['pts'], l['closed']) for l in lines if not l['index']]
    idx = [catmull_rom(l['pts'], l['closed']) for l in lines if l['index']]
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{n}" height="{n}" viewBox="0 0 {n} {n}" fill="none">',
           f'<!-- {meta} -->',
           '<g id="contours" stroke="#D9971A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">']
    svg += [f'<path d="{d}"/>' for d in norm]
    svg += ['</g>', '<g id="index" stroke="#D9971A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">']
    svg += [f'<path d="{d}"/>' for d in idx]
    svg += ['</g>', '</svg>']
    Path(path).write_text('\n'.join(svg))
    return len(norm), len(idx)


def preview(path, lines, n, title, sub):
    """Two tiles side by side: ochre lines on yellow, faint cream lines on navy (as the pieces use them)."""
    k, S = 2, 900                         # supersample, tile size
    tiles = []
    for bg, ink, alpha in ((YELLOW, OCHRE, 255), (NAVY, CREAM, 70)):
        im = Image.new('RGB', (S * k, S * k), bg)
        ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        sc = S * k / n
        for l in lines:
            pts = [(x * sc, y * sc) for x, y in l['pts']]
            d.line(pts, fill=ink + (alpha,), width=round((2.6 if l['index'] else 1.4) * k), joint='curve')
        im.paste(ov, (0, 0), ov)
        tiles.append(im.resize((S, S), Image.LANCZOS))
    sheet = Image.new('RGB', (S * 2 + 60, S + 110), (255, 255, 255))
    for i, t in enumerate(tiles):
        sheet.paste(t, (20 + i * (S + 20), 20))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 26)
        small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 20)
    except OSError:
        font = small = ImageFont.load_default()
    d.text((20, S + 34), title, fill=NAVY, font=font)
    d.text((20, S + 70), sub, fill=NAVY, font=small)
    sheet.save(path, quality=88)


def overview(z, top, left, out):
    step = 6
    s = z[::step, ::step]
    gy, gx = np.gradient(np.nan_to_num(s, nan=np.nanmean(s)), 30 * step)
    shade = np.clip(0.5 + 2.2 * (-gx * 0.7 - gy * 0.7) / np.sqrt(1 + gx ** 2 + gy ** 2), 0, 1)
    lo, hi = np.nanpercentile(s, [1, 99])
    h = np.clip((s - lo) / (hi - lo), 0, 1)
    rgb = np.stack([h * 0.6 + shade * 0.4] * 3, -1)
    rgb[np.isnan(s)] = 1
    im = Image.fromarray((rgb * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 18)
    for name, (lat, lon) in TOWNS.items():
        x, y = (lon - left) * ARC / step, (top - lat) * ARC / step
        d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(220, 40, 60)); d.text((x + 8, y - 10), name, fill=(220, 40, 60), font=font)
    for deg in range(left, left + z.shape[1] // ARC + 1):
        x = (deg - left) * ARC / step; d.line([(x, 0), (x, im.height)], fill=(80, 80, 200)); d.text((x + 4, 4), f'{deg}°E', fill=(80, 80, 200), font=font)
    for deg in range(top, top - z.shape[0] // ARC - 1, -1):
        y = (top - deg) * ARC / step; d.line([(0, y), (im.width, y)], fill=(80, 80, 200)); d.text((4, y + 4), f'{-deg}°S', fill=(80, 80, 200), font=font)
    im.save(out, quality=88)
    print('overview', im.size, 'elevation', round(float(np.nanmin(z))), '-', round(float(np.nanmax(z))), 'm')


def svg_lines(path):
    """(points, is_index) for every path in one of our SVGs, or in the builder's CONTOURS array (a .js file)."""
    from svgelements import Path as SPath
    txt = Path(path).read_text()
    if path.endswith('.js'):
        import json, re
        ds, idx = json.loads(re.search(r'const CONTOURS = (\[.*?\]);', txt, re.S).group(1)), set()
    else:
        import re
        groups = dict(re.findall(r'<g id="(\w+)"[^>]*>(.*?)</g>', txt, re.S))
        norm = re.findall(r'd="([^"]+)"', groups.get('contours', ''))
        ds = norm + re.findall(r'd="([^"]+)"', groups.get('index', ''))
        idx = set(range(len(norm), len(ds)))
    out = []
    for i, d in enumerate(ds):
        sp = SPath(d)
        n = max(8, int(sp.length(error=1e-2) / 3))
        out.append((np.asarray(sp.npoint(np.linspace(0, 1, n)))[:, :2], i in idx))
    return out


def sheet(out_dir, items):
    """Rows: name | on yellow | on navy. Lines are drawn stronger than the pieces print them, so the shapes can be compared."""
    S, k = 520, 2
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
    small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 17)
    W, H = 300 + 2 * (S + 20), len(items) * (S + 20) + 20
    out = Image.new('RGB', (W, H), (255, 255, 255))
    d0 = ImageDraw.Draw(out)
    for r, (title, sub, lines) in enumerate(items):
        y = 20 + r * (S + 20)
        d0.text((20, y + 10), title, fill=NAVY, font=font)
        for j, line in enumerate(sub.split('\n')):
            d0.text((20, y + 46 + j * 24), line, fill=NAVY, font=small)
        for c, (bg, ink, a) in enumerate(((YELLOW, NAVY, 0.45), (NAVY, CREAM, 0.40))):
            base = Image.new('RGB', (S * k, S * k), bg)
            ov = Image.new('RGBA', base.size, (0, 0, 0, 0))
            dd = ImageDraw.Draw(ov)
            for pts, is_index in lines:
                q = [(x * S * k / 1080, yy * S * k / 1080) for x, yy in pts]
                dd.line(q, fill=ink + (255,), width=round((2.4 if is_index else 1.2) * k), joint='curve')
            alpha = ov.getchannel('A').point(lambda v: round(v * a))
            ov.putalpha(alpha)
            base.paste(ov, (0, 0), ov)
            out.paste(base.resize((S, S), Image.LANCZOS), (300 + c * (S + 20), y))
    out.save(out_dir / 'compare.jpg', quality=88)
    print('compare', out.size)


def main():
    dem_dir, out_dir, names = sys.argv[1], Path(sys.argv[2]), sys.argv[3:] or list(SAMPLES)
    out_dir.mkdir(parents=True, exist_ok=True)
    if names[0] == 'compare':                     # compare BOX_JS SAMPLE ...
        items = [('NOW: BOX ART', 'the current lines\n(drawn, not a real place)', svg_lines(names[1]))]
        for nm in names[2:]:
            cfg = SAMPLES[nm]
            lat, lon = cfg['centre']
            items.append((nm.replace('_calm', '').replace('_', ' ').upper(),
                          f"{abs(lat):.2f}°S {lon:.2f}°E\n{cfg['side']} km across\na line every {cfg['interval']} m", svg_lines(str(out_dir / f'{nm}.svg'))))
        sheet(out_dir, items)
        return
    z, top, left = mosaic(dem_dir)
    if names == ['overview']:
        overview(z, top, left, out_dir / 'overview.jpg')
        return
    n = 1080
    for name in names:
        cfg = SAMPLES[name]
        w = window(z, top, left, cfg['centre'], cfg['side'], n)
        lines, lo, hi = contours(w, cfg, n)
        lat, lon = cfg['centre']
        meta = (f"Copernicus GLO-30 DEM, {name}: centre {abs(lat):.2f}S {lon:.2f}E, {cfg['side']} km square, "
                f"{cfg['interval']} m contours (every {cfg['index']}th bold), smoothed {cfg['smooth']} m, {lo:.0f}-{hi:.0f} m")
        a, b = write_svg(out_dir / f'{name}.svg', lines, n, meta)
        preview(out_dir / f'{name}_preview.jpg', lines, n, name.replace('_', ' ').upper(),
                f"{abs(lat):.2f}°S {lon:.2f}°E · {cfg['side']} km across · a line every {cfg['interval']} m · {lo:.0f}–{hi:.0f} m above sea level")
        print(name, 'lines', a, '+', b, 'index', 'svg', (out_dir / f'{name}.svg').stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
