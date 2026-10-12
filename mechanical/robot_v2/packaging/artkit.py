"""Shared drawing kit for the RoboCore V2 packaging: a dual PDF + SVG sheet (mm units, mm type sizes), the brand
palette, fonts (Barlow), QR code, image placement, and the navy topography background renderer."""
import os, json, math, base64
import numpy as np
import pymupdf as fitz
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.normpath(os.path.join(HERE, '..', 'cardboard', 'art'))     # drawings, logos, fonts made earlier
K = 72 / 25.4
YEL = (242, 176, 30)
NAVY = (27, 42, 65)
CREAM = (247, 241, 227)
KRAFT = (196, 170, 128)
WHITE = (255, 255, 255)
FD = os.path.join(ART, 'fonts')
FONTS = {'h': os.path.join(FD, 'BarlowCondensed-Bold.ttf'), 'hs': os.path.join(FD, 'BarlowCondensed-SemiBold.ttf'),
         'r': os.path.join(FD, 'Barlow-Regular.ttf'), 'b': os.path.join(FD, 'Barlow-SemiBold.ttf'), 'i': os.path.join(FD, 'Barlow-Italic.ttf')}
FONT_SVG = {'h': "'Barlow Condensed', sans-serif", 'hs': "'Barlow Condensed', sans-serif", 'r': 'Barlow, Arial, sans-serif',
            'b': 'Barlow, Arial, sans-serif', 'i': 'Barlow, Arial, sans-serif'}
SVG_WEIGHT = {'h': ' font-weight="700"', 'hs': ' font-weight="600"', 'r': '', 'b': ' font-weight="600"', 'i': ' font-style="italic"'}
_fobj = {k: fitz.Font(fontfile=v) for k, v in FONTS.items()}


def c01(c):
    return (c[0] / 255, c[1] / 255, c[2] / 255)


def hexc(c):
    return '#%02x%02x%02x' % c


class Sheet:
    """One page. Coordinates in mm from the page's top-left plus (ox, oy); text sizes in mm."""

    def __init__(self, page_w, page_h, ox=0.0, oy=0.0, doc=None):
        self.doc = doc if doc is not None else fitz.open()   # an empty Document is falsy, so no `or` here
        self.page = self.doc.new_page(width=page_w * K, height=page_h * K)
        self.ox, self.oy = ox, oy
        self.svg = ['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="%gmm" height="%gmm" viewBox="0 0 %g %g">' % (page_w, page_h, page_w, page_h),
                    '<g transform="translate(%g %g)">' % (ox, oy)]
        self._img = {}

    def P(self, x, y):
        return fitz.Point((x + self.ox) * K, (y + self.oy) * K)

    def R(self, x0, y0, x1, y1):
        return fitz.Rect((x0 + self.ox) * K, (y0 + self.oy) * K, (x1 + self.ox) * K, (y1 + self.oy) * K)

    def poly(self, pts, fill=None, stroke=None, width=0.3, dash=None, opacity=1.0, closed=True, name=''):
        pts = [tuple(p) for p in pts]
        sh = self.page.new_shape()
        sh.draw_polyline([self.P(*p) for p in pts] + ([self.P(*pts[0])] if closed else []))
        sh.finish(color=c01(stroke) if stroke else None, fill=c01(fill) if fill else None, width=width * K,
                  dashes='[%g %g] 0' % (dash[0] * K, dash[1] * K) if dash else None, fill_opacity=opacity, stroke_opacity=opacity)
        sh.commit()
        tag = 'polygon' if closed else 'polyline'
        self.svg.append('<%s points="%s" fill="%s" stroke="%s" stroke-width="%g"%s%s%s/>' % (
            tag, ' '.join('%g,%g' % p for p in pts), hexc(fill) if fill else 'none', hexc(stroke) if stroke else 'none', width,
            ' stroke-dasharray="%g %g"' % dash if dash else '', ' opacity="%g"' % opacity if opacity < 1 else '', ' data-name="%s"' % name if name else ''))

    def rect(self, x0, y0, x1, y1, **kw):
        self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], **kw)

    def rrect(self, x0, y0, x1, y1, r=3.0, n=6, **kw):
        pts = []
        for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
            for i in range(n + 1):
                a = math.radians(a0 + 90 * i / n)
                pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        self.poly(pts, **kw)

    def circle(self, cx, cy, d, fill=None, stroke=None, width=0.3, opacity=1.0):
        sh = self.page.new_shape()
        sh.draw_circle(self.P(cx, cy), d / 2 * K)
        sh.finish(color=c01(stroke) if stroke else None, fill=c01(fill) if fill else None, width=width * K, fill_opacity=opacity, stroke_opacity=opacity)
        sh.commit()
        self.svg.append('<circle cx="%g" cy="%g" r="%g" fill="%s" stroke="%s" stroke-width="%g"%s/>' % (
            cx, cy, d / 2, hexc(fill) if fill else 'none', hexc(stroke) if stroke else 'none', width, ' opacity="%g"' % opacity if opacity < 1 else ''))

    def line(self, x0, y0, x1, y1, stroke=NAVY, width=0.3, dash=None, opacity=1.0):
        self.poly([(x0, y0), (x1, y1)], stroke=stroke, width=width, dash=dash, opacity=opacity, closed=False)

    def width(self, s, font, size):
        return _fobj[font].text_length(s, size * K) / K

    def text(self, x, y, s, size, font='r', color=NAVY, align='left', rot=0, opacity=1.0):
        w = self.width(s, font, size)
        d = 0 if align == 'left' else (w / 2 if align == 'center' else w)
        dx, dy = {0: (-d, 0), 90: (0, d), 180: (d, 0), 270: (0, -d)}[rot]
        xs, ys = x + dx, y + dy
        self.page.insert_text(self.P(xs, ys), s, fontsize=size * K, fontname='F_' + font, fontfile=FONTS[font], color=c01(color), rotate=rot, fill_opacity=opacity)
        tr = ' transform="rotate(%d %g %g)"' % (-rot, xs, ys) if rot else ''
        self.svg.append('<text x="%g" y="%g" font-family="%s"%s font-size="%g" fill="%s"%s%s>%s</text>' % (
            xs, ys, FONT_SVG[font], SVG_WEIGHT[font], size, hexc(color), tr, ' opacity="%g"' % opacity if opacity < 1 else '',
            s.replace('&', '&amp;').replace('<', '&lt;')))
        return w

    def para(self, x, y, w, s, size, font='r', color=NAVY, lead=None, align='left', rot=0):
        """Wrapped paragraph from the top-left (x, y) of the block; returns the y after the last line."""
        lead = lead or size * 1.3
        words, lines, cur = s.split(), [], ''
        for wd in words:
            t = (cur + ' ' + wd).strip()
            if self.width(t, font, size) > w and cur:
                lines.append(cur)
                cur = wd
            else:
                cur = t
        if cur:
            lines.append(cur)
        yy = y + size * 0.8
        for ln in lines:
            if align == 'center':
                self.text(x + w / 2, yy, ln, size, font, color, 'center', rot)
            else:
                self.text(x, yy, ln, size, font, color, 'left', rot)
            yy += lead
        return yy - lead + size * 0.35

    def image(self, x0, y0, x1, y1, path, rot=0):
        """Fit the PNG in the box keeping its aspect; rot = 0/90/180/270 counter-clockwise."""
        self.page.insert_image(self.R(x0, y0, x1, y1), filename=path, rotate=rot, keep_proportion=True)
        if path not in self._img:
            self._img[path] = base64.b64encode(open(path, 'rb').read()).decode()
        pix = fitz.Pixmap(path)
        iw, ih = (pix.width, pix.height) if rot in (0, 180) else (pix.height, pix.width)
        s = min((x1 - x0) / iw, (y1 - y0) / ih)
        w, h = iw * s, ih * s
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        ww, hh = (w, h) if rot in (0, 180) else (h, w)
        self.svg.append('<image href="data:image/png;base64,%s" x="%g" y="%g" width="%g" height="%g" transform="rotate(%d %g %g)"/>' % (
            self._img[path], cx - ww / 2, cy - hh / 2, ww, hh, -rot, cx, cy))

    def save(self, pdf_path=None, svg_path=None, png_path=None, dpi=72):
        if pdf_path:
            self.doc.save(pdf_path, deflate=True, garbage=3)
        if svg_path:
            open(svg_path, 'w').write('\n'.join(self.svg + ['</g>', '</svg>']))
        if png_path:
            self.page.get_pixmap(dpi=dpi).save(png_path)


def qr(sh, cx, cy, size, url, bg=CREAM):
    import segno
    m = segno.make(url, error='m').matrix
    n = len(m)
    quiet = 1
    cell = size / (n + 2 * quiet)
    x0, y0 = cx - size / 2, cy - size / 2
    sh.rect(x0, y0, x0 + size, y0 + size, fill=bg)
    for r, row in enumerate(m):
        for c, v in enumerate(row):
            if v:
                sh.rect(x0 + (c + quiet) * cell, y0 + (r + quiet) * cell, x0 + (c + quiet + 1) * cell, y0 + (r + quiet + 1) * cell, fill=NAVY)


def barcode(sh, x, y, h=10, color=NAVY):
    bars = [0.4, 0.8, 0.4, 0.4, 1.0, 0.4, 0.6, 0.4, 0.9, 0.4, 0.4, 0.7, 0.4, 1.1, 0.4, 0.5, 0.9, 0.4, 0.4, 0.8, 0.4, 0.6, 0.4, 1.0, 0.4, 0.4, 0.7, 0.5, 0.4, 0.9, 0.4, 0.8]
    for b in bars:
        sh.rect(x, y, x + b, y + h, fill=color)
        x += b + 0.45
    return x


def motif(sh, x, y, rot=0, color=NAVY, s=1.0):
    """Three stepped bars."""
    for bx, by, bw, bh in ((0, 0, 9, 1.2), (0, 2.2, 6, 1.2), (0, 4.4, 3, 1.2)):
        bx, by, bw, bh = bx * s, by * s, bw * s, bh * s
        if rot == 0:
            sh.rect(x + bx, y + by, x + bx + bw, y + by + bh, fill=color)
        elif rot == 90:
            sh.rect(x + by, y - bx - bw, x + by + bh, y - bx, fill=color)
        elif rot == 270:
            sh.rect(x - by - bh, y + bx, x - by, y + bx + bw, fill=color)
        else:
            sh.rect(x - bx - bw, y - by - bh, x - bx, y - by, fill=color)


def topography(out_png, w_mm, h_mm, panels, ppm=6, opacity=0.2, stroke=1.6, seed_shift=0):
    """Fred's contour SVG rendered in navy at `opacity`, scaled to cover the sheet, masked to the given panel polygons."""
    src = os.path.join(ART, 'topography_src.svg')
    s = open(src).read().replace('stroke-width="0.75"', 'stroke-width="%g"' % stroke)
    pg = fitz.open('svg', s.encode())[0]
    side = int(max(w_mm, h_mm) * ppm)
    pix = pg.get_pixmap(matrix=fitz.Matrix(side / 1080, side / 1080), alpha=True)
    tile = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)
    a = np.array(tile)
    ink = (a[:, :, 3] > 0) & (a[:, :, :3].mean(axis=2) < 200)
    t = np.zeros_like(a)
    t[..., 0], t[..., 1], t[..., 2] = NAVY
    t[..., 3] = np.where(ink, a[:, :, 3], 0)
    canvas = Image.new('RGBA', (int(w_mm * ppm), int(h_mm * ppm)), (0, 0, 0, 0))
    canvas.paste(Image.fromarray(t, 'RGBA'), (-(side - canvas.width) // 2 + seed_shift, -(side - canvas.height) // 2))
    m = Image.new('L', canvas.size, 0)
    dr = ImageDraw.Draw(m)
    for pts in panels:
        dr.polygon([(x * ppm, y * ppm) for x, y in pts], fill=255)
    ca = np.array(canvas)
    ca[..., 3] = (ca[..., 3].astype(float) * np.array(m) / 255 * opacity).astype(np.uint8)
    Image.fromarray(ca, 'RGBA').save(out_png)
    return out_png


class Frame:
    """A panel-local drawing frame on a Sheet: (u right, v down) in mm from the panel's top-left *as its viewer sees it*.
    rot = how the panel sits on the sheet: 0 upright, 180 upside down, 90 = local right points up the sheet, 270 = down."""

    def __init__(self, sh, x0, y0, x1, y1, rot=0):
        self.sh, self.r = sh, (x0, y0, x1, y1)
        self.rot = rot
        self.w, self.h = (x1 - x0, y1 - y0) if rot in (0, 180) else (y1 - y0, x1 - x0)

    def m(self, u, v):
        x0, y0, x1, y1 = self.r
        return {0: (x0 + u, y0 + v), 180: (x1 - u, y1 - v), 90: (x0 + v, y1 - u), 270: (x1 - v, y0 + u)}[self.rot]

    def box(self, u0, v0, u1, v1):
        pts = [self.m(u0, v0), self.m(u1, v1)]
        return min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)

    def poly(self, pts, **kw):
        self.sh.poly([self.m(*p) for p in pts], **kw)

    def rect(self, u0, v0, u1, v1, **kw):
        self.poly([(u0, v0), (u1, v0), (u1, v1), (u0, v1)], **kw)

    def rrect(self, u0, v0, u1, v1, r=3.0, **kw):
        self.sh.rrect(*self.box(u0, v0, u1, v1), r=r, **kw)

    def circle(self, cu, cv, d, **kw):
        x, y = self.m(cu, cv)
        self.sh.circle(x, y, d, **kw)

    def line(self, u0, v0, u1, v1, stroke=NAVY, width=0.3, dash=None, opacity=1.0):
        self.poly([(u0, v0), (u1, v1)], stroke=stroke, width=width, dash=dash, opacity=opacity, closed=False)

    def text(self, u, v, s, size, font='r', color=NAVY, align='left', opacity=1.0):
        x, y = self.m(u, v)
        return self.sh.text(x, y, s, size, font, color, align, self.rot, opacity)

    def para(self, u, v, w, s, size, font='r', color=NAVY, lead=None, align='left'):
        lead = lead or size * 1.3
        words, lines, cur = s.split(), [], ''
        for wd in words:
            t = (cur + ' ' + wd).strip()
            if self.sh.width(t, font, size) > w and cur:
                lines.append(cur); cur = wd
            else:
                cur = t
        if cur:
            lines.append(cur)
        vv = v + size * 0.8
        for ln in lines:
            if align == 'center':
                self.text(u + w / 2, vv, ln, size, font, color, 'center')
            else:
                self.text(u, vv, ln, size, font, color, 'left')
            vv += lead
        return vv - lead + size * 0.35

    def image(self, u0, v0, u1, v1, path):
        self.sh.image(*self.box(u0, v0, u1, v1), path, self.rot)

    def motif(self, u, v, s=1.0, color=NAVY):
        for bu, bv, bw, bh in ((0, 0, 9, 1.2), (0, 2.2, 6, 1.2), (0, 4.4, 3, 1.2)):
            self.rect(u + bu * s, v + bv * s, u + (bu + bw) * s, v + (bv + bh) * s, fill=color)

    def qr(self, cu, cv, size, url, bg=CREAM):
        import segno
        m = segno.make(url, error='m').matrix
        n = len(m); quiet = 1
        cell = size / (n + 2 * quiet)
        u0, v0 = cu - size / 2, cv - size / 2
        self.rect(u0, v0, u0 + size, v0 + size, fill=bg)
        for r, row in enumerate(m):
            for c, val in enumerate(row):
                if val:
                    self.rect(u0 + (c + quiet) * cell, v0 + (r + quiet) * cell, u0 + (c + quiet + 1) * cell, v0 + (r + quiet + 1) * cell, fill=NAVY)

    def barcode(self, u, v, h=10, color=NAVY):
        bars = [0.4, 0.8, 0.4, 0.4, 1.0, 0.4, 0.6, 0.4, 0.9, 0.4, 0.4, 0.7, 0.4, 1.1, 0.4, 0.5, 0.9, 0.4, 0.4, 0.8, 0.4, 0.6, 0.4, 1.0, 0.4, 0.4, 0.7, 0.5, 0.4, 0.9, 0.4, 0.8]
        for b in bars:
            self.rect(u, v, u + b, v + h, fill=color)
            u += b + 0.45
        return u


def faint(path, out_dir, alpha=0.18):
    """A copy of a navy-on-transparent PNG with its alpha scaled (for background line art)."""
    out = os.path.join(out_dir, 'faint_%02d_%s' % (int(alpha * 100), os.path.basename(path)))
    if not os.path.exists(out):
        im = Image.open(path).convert('RGBA')
        a = np.array(im)
        a[..., 3] = (a[..., 3].astype(float) * alpha).astype(np.uint8)
        Image.fromarray(a, 'RGBA').save(out)
    return out
