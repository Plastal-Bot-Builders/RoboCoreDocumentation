#!/usr/bin/env python3
"""Branded (printed) version of the RoboCore V2 cardboard chassis net.

Same dieline as make_net.py (it reads net.json, so run make_net.py first). Adds the artwork:
yellow panels, navy type and line art, cream information areas, a faint PCB-trace texture, Fred's
line drawings of the robot, specifications, a QR code to the documentation.

Outputs (1:1, mm): branded_net.pdf (A3 portrait, artwork + cut lines, fold lines on a light grey dash),
branded_net_A4_tiles.pdf (2 x A4), branded_net.png (preview), branded_net.svg (editable: import into Figma).
    python3 make_branded.py
"""
import os, json, math, random, base64
import pymupdf as fitz

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, 'art')
NET = json.load(open(os.path.join(HERE, 'net.json')))
X0, Y0, X1, Y1 = NET['net']                    # 0, 0, 200, 403
SH = NET['shapes']

# ------------------------------------------------------------------ palette and type
YEL = (242, 176, 30)
NAVY = (27, 42, 65)
CREAM = (247, 241, 227)
PALE = (248, 206, 110)          # floor / shelf (undersides)
# Type: Barlow (Google Fonts, OFL; also available inside Figma). Condensed Bold for headings, Barlow for the rest.
FD = os.path.join(ART, 'fonts')
FONTS = {'h': os.path.join(FD, 'BarlowCondensed-Bold.ttf'), 'hs': os.path.join(FD, 'BarlowCondensed-SemiBold.ttf'),
         'r': os.path.join(FD, 'Barlow-Regular.ttf'), 'b': os.path.join(FD, 'Barlow-SemiBold.ttf'), 'i': os.path.join(FD, 'Barlow-Italic.ttf')}
FONT_SVG = {'h': "'Barlow Condensed', 'DIN Condensed', sans-serif", 'hs': "'Barlow Condensed', 'DIN Condensed', sans-serif",
            'r': 'Barlow, Arial, sans-serif', 'b': 'Barlow, Arial, sans-serif', 'i': 'Barlow, Arial, sans-serif'}
SVG_WEIGHT = {'h': ' font-weight="700"', 'hs': ' font-weight="600"', 'r': '', 'b': ' font-weight="600"', 'i': ' font-style="italic"'}
if not all(os.path.exists(p) for p in FONTS.values()):   # fallback to system fonts
    FONTS = {'h': '/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf', 'hs': '/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf',
             'r': '/System/Library/Fonts/Supplemental/Arial.ttf', 'b': '/System/Library/Fonts/Supplemental/Arial Bold.ttf', 'i': '/System/Library/Fonts/Supplemental/Arial Italic.ttf'}
_fobj = {k: fitz.Font(fontfile=v) for k, v in FONTS.items()}
K = 72 / 25.4


def c01(c):
    return (c[0] / 255, c[1] / 255, c[2] / 255)


def hexc(c):
    return '#%02x%02x%02x' % c


# ------------------------------------------------------------------ dual backend: PDF page + SVG text
class Sheet:
    def __init__(self, page_w, page_h, ox, oy, title=None):
        self.doc = fitz.open()
        self.page = self.doc.new_page(width=page_w * K, height=page_h * K)
        self.ox, self.oy = ox, oy
        self.svg = ['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="%gmm" height="%gmm" viewBox="0 0 %g %g">' % (page_w, page_h, page_w, page_h),
                    '<g transform="translate(%g %g)">' % (ox, oy)]
        self._img_cache = {}

    def P(self, x, y):
        return fitz.Point((x + self.ox) * K, (y + self.oy) * K)

    def R(self, x0, y0, x1, y1):
        return fitz.Rect((x0 + self.ox) * K, (y0 + self.oy) * K, (x1 + self.ox) * K, (y1 + self.oy) * K)

    # shapes --------------------------------------------------------
    def poly(self, pts, fill=None, stroke=None, width=0.3, dash=None, opacity=1.0, closed=True, name=''):
        pts = [tuple(p) for p in pts]
        sh = self.page.new_shape()
        sh.draw_polyline([self.P(*p) for p in pts] + ([self.P(*pts[0])] if closed else []))
        sh.finish(color=c01(stroke) if stroke else None, fill=c01(fill) if fill else None, width=width * K,
                  dashes='[%g %g] 0' % (dash[0] * K, dash[1] * K) if dash else None, fill_opacity=opacity, stroke_opacity=opacity)
        sh.commit()
        tag = 'polygon' if closed else 'polyline'
        self.svg.append('<%s points="%s" fill="%s" stroke="%s" stroke-width="%g"%s%s%s/>' % (
            tag, ' '.join('%g,%g' % tuple(p) for p in pts), hexc(fill) if fill else 'none', hexc(stroke) if stroke else 'none', width,
            ' stroke-dasharray="%g %g"' % dash if dash else '', ' opacity="%g"' % opacity if opacity < 1 else '', ' data-name="%s"' % name if name else ''))

    def rect(self, x0, y0, x1, y1, **kw):
        self.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], **kw)

    def circle(self, cx, cy, d, fill=None, stroke=None, width=0.3, opacity=1.0, name=''):
        sh = self.page.new_shape()
        sh.draw_circle(self.P(cx, cy), d / 2 * K)
        sh.finish(color=c01(stroke) if stroke else None, fill=c01(fill) if fill else None, width=width * K, fill_opacity=opacity, stroke_opacity=opacity)
        sh.commit()
        self.svg.append('<circle cx="%g" cy="%g" r="%g" fill="%s" stroke="%s" stroke-width="%g"%s/>' % (
            cx, cy, d / 2, hexc(fill) if fill else 'none', hexc(stroke) if stroke else 'none', width, ' opacity="%g"' % opacity if opacity < 1 else ''))

    def line(self, x0, y0, x1, y1, stroke=NAVY, width=0.3, dash=None, opacity=1.0):
        self.poly([(x0, y0), (x1, y1)], stroke=stroke, width=width, dash=dash, opacity=opacity, closed=False)

    # text ----------------------------------------------------------
    def width(self, s, font, size):
        return _fobj[font].text_length(s, size * K) / K   # mm (size = font size in mm)

    def text(self, x, y, s, size, font='r', color=NAVY, align='left', rot=0, opacity=1.0):
        """x, y = baseline start (mm) for align='left' (before rotation about that point). size in mm."""
        w = self.width(s, font, size)
        # alignment shift along the baseline direction
        d = 0 if align == 'left' else (w / 2 if align == 'center' else w)
        dx, dy = {0: (-d, 0), 90: (0, d), 180: (d, 0), 270: (0, -d)}[rot]
        xs, ys = x + dx, y + dy
        self.page.insert_text(self.P(xs, ys), s, fontsize=size * K, fontname='F_' + font, fontfile=FONTS[font], color=c01(color), rotate=rot, fill_opacity=opacity)
        tr = ' transform="rotate(%d %g %g)"' % (-rot, xs, ys) if rot else ''
        self.svg.append('<text x="%g" y="%g" font-family="%s"%s font-size="%g" fill="%s"%s%s>%s</text>' % (
            xs, ys, FONT_SVG[font], SVG_WEIGHT[font], size, hexc(color), tr, ' opacity="%g"' % opacity if opacity < 1 else '',
            s.replace('&', '&amp;').replace('<', '&lt;')))
        return w

    def para(self, x, y, w, s, size, font='r', color=NAVY, lead=None, rot=0, align='left'):
        """Wrapped paragraph. x, y = top-left of the block (unrotated). Returns the y after the last line."""
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

    # images --------------------------------------------------------
    def image(self, x0, y0, x1, y1, path, rot=0):
        """Fit the PNG inside the box, keeping its aspect; rot in degrees counter-clockwise (0/90/180/270)."""
        self.page.insert_image(self.R(x0, y0, x1, y1), filename=path, rotate=rot, keep_proportion=True)
        if path not in self._img_cache:
            self._img_cache[path] = base64.b64encode(open(path, 'rb').read()).decode()
        pix = fitz.Pixmap(path)
        iw, ih = (pix.width, pix.height) if rot in (0, 180) else (pix.height, pix.width)
        bw, bh = x1 - x0, y1 - y0
        s = min(bw / iw, bh / ih)
        w, h = iw * s, ih * s
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        ww, hh = (w, h) if rot in (0, 180) else (h, w)     # unrotated image size
        self.svg.append('<image href="data:image/png;base64,%s" x="%g" y="%g" width="%g" height="%g" transform="rotate(%d %g %g)"/>' % (
            self._img_cache[path], cx - ww / 2, cy - hh / 2, ww, hh, -rot, cx, cy))

    def save(self, pdf_path, svg_path=None, png_path=None, dpi=110):
        self.doc.save(pdf_path, deflate=True)
        if svg_path:
            open(svg_path, 'w').write('\n'.join(self.svg + ['</g>', '</svg>']))
        if png_path:
            self.page.get_pixmap(dpi=dpi).save(png_path)


# ------------------------------------------------------------------ geometry (same numbers as make_net.py)
PANELS = {
    'flap': [(40.5, 0), (124, 0), (124, 6), (138, 6), (138, 0), (159.5, 0), (159.5, 41), (40.5, 41)],
    'flap tab L': [(28.5, 8), (40.5, 2), (40.5, 41), (28.5, 41)], 'flap tab R': [(171.5, 8), (159.5, 2), (159.5, 41), (171.5, 41)],
    'deck': [(37.5, 41), (162.5, 41), (162.5, 191), (37.5, 191)],
    'rear wall': [(40.5, 191), (159.5, 191), (159.5, 229), (40.5, 229)],
    'glue tab L': [(28.5, 196), (40.5, 191), (40.5, 229), (28.5, 224)], 'glue tab R': [(171.5, 196), (159.5, 191), (159.5, 229), (171.5, 224)],
    'floor': [(40.5, 229), (159.5, 229), (159.5, 373), (40.5, 373)],
    'left wall': [(2.5, 229), (40.5, 229), (40.5, 373), (2.5, 373)], 'right wall': [(159.5, 229), (197.5, 229), (197.5, 373), (159.5, 373)],
    'nose shelf': [(65, 373), (135, 373), (135, 395), (127, 403), (73, 403), (65, 395)],
}
SIDE_GEOM = json.load(open(os.path.join(ART, 'side_geom.json')))   # wheel centre in the side-view PNG


def traces(sh, x0, y0, x1, y1, seed=7, n=14, step=4.0, color=NAVY, opacity=0.13, keep_out=()):
    """Faint PCB-trace texture: orthogonal / 45-degree runs with round pads, clipped to the box."""
    rnd = random.Random(seed)

    def ok(x, y):
        if not (x0 + 1 <= x <= x1 - 1 and y0 + 1 <= y <= y1 - 1):
            return False
        return all(not (kx0 - 1.5 <= x <= kx1 + 1.5 and ky0 - 1.5 <= y <= ky1 + 1.5) for kx0, ky0, kx1, ky1 in keep_out)
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)]
    for _ in range(n):
        x = x0 + step * rnd.randint(0, int((x1 - x0) / step))
        y = y0 + step * rnd.randint(0, int((y1 - y0) / step))
        if not ok(x, y):
            continue
        pts = [(x, y)]
        d = rnd.choice(dirs[:4])
        for _s in range(rnd.randint(3, 9)):
            if rnd.random() < 0.35:
                d = rnd.choice(dirs)
            nx, ny = x + d[0] * step, y + d[1] * step
            if not ok(nx, ny):
                break
            x, y = nx, ny
            pts.append((x, y))
        if len(pts) > 2:
            sh.poly(pts, stroke=color, width=0.35, opacity=opacity, closed=False)
            sh.circle(pts[0][0], pts[0][1], 1.3, fill=color, opacity=opacity)
            sh.circle(pts[-1][0], pts[-1][1], 1.3, fill=color, opacity=opacity)
            sh.circle(pts[-1][0], pts[-1][1], 0.5, fill=YEL)


def qr(sh, cx, cy, size, url):
    try:
        import segno
    except ImportError:
        sh.rect(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2, stroke=NAVY, width=0.3)
        sh.text(cx, cy + 1, 'QR', 3, 'h', NAVY, 'center')
        return
    m = segno.make(url, error='m').matrix
    n = len(m)
    quiet = 1
    cell = size / (n + 2 * quiet)
    x0, y0 = cx - size / 2, cy - size / 2
    sh.rect(x0, y0, x0 + size, y0 + size, fill=CREAM)
    for r, row in enumerate(m):
        for c, v in enumerate(row):
            if v:
                sh.rect(x0 + (c + quiet) * cell, y0 + (r + quiet) * cell, x0 + (c + quiet + 1) * cell, y0 + (r + quiet + 1) * cell, fill=NAVY)


def draw_hcsr04(sh, cx, cy, k=1.0, flip=False, pins=True, label=True, text_rot=None, pin_len=5.5):
    """HC-SR04 front view as line art, 45 x 20 mm board at scale k, centred on (cx, cy); the two cans 26 mm apart.
    Drawing y runs towards the header pins. flip=True mirrors both axes; text_rot overrides the label rotation."""
    T = (lambda x, y: (cx - x * k, cy - y * k)) if flip else (lambda x, y: (cx + x * k, cy + y * k))
    trot = (180 if flip else 0) if text_rot is None else text_rot

    def R(x0, y0, x1, y1, **kw):
        a, b = T(x0, y0), T(x1, y1)
        sh.rect(min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1]), **kw)
    lw = 0.3
    R(-22.5, -10, 22.5, 10, stroke=NAVY, width=lw)                      # board
    R(-22.5, 7.5, 22.5, 10, stroke=NAVY, width=lw)                       # bottom edge band (pads side)
    for sx in (-1, 1):
        px, py = T(sx * 13, 0)
        sh.circle(px, py, 18 * k, stroke=NAVY, width=lw)                 # can outer rim
        sh.circle(px, py, 15.6 * k, stroke=NAVY, width=lw * 0.8)         # can top lip
        for i in range(24):                                              # knurled rim ticks
            a0 = i * math.pi / 12
            x0, y0 = px + 8.3 * k * math.cos(a0), py + 8.3 * k * math.sin(a0)
            x1, y1 = px + 9 * k * math.cos(a0), py + 9 * k * math.sin(a0)
            sh.line(x0, y0, x1, y1, NAVY, lw * 0.7)
        hx, hy = T(sx * 21, -7.5)
        sh.circle(hx, hy, 1.6 * k, stroke=NAVY, width=lw)                # mounting holes
    R(-5.5, -8, 5.5, -4.6, stroke=NAVY, width=lw)                        # crystal can
    if pins:
        for i in range(4):
            x = (i - 1.5) * 2.54
            R(x - 0.32, 10, x + 0.32, 10 + pin_len, stroke=NAVY, width=lw * 0.8)  # header pins
            R(x - 1.2, 7.5, x + 1.2, 10, stroke=NAVY, width=lw * 0.6)
        if label:
            for i, s in enumerate(('VCC', 'TRIG', 'ECHO', 'GND')):
                x = (i - 1.5) * 2.54
                lx, ly = T(x + (0.5 if trot == 0 else -0.5), 1.2 if trot == 0 else 6.2)
                sh.text(lx, ly, s, 1.3 * k, 'hs', NAVY, 'left', 270 if trot == 0 else 90)
    if label:
        lx, ly = T(0, -2.2 if trot == 0 else -4.2)
        sh.text(lx, ly, 'HC-SR04', 2.0 * k, 'h', NAVY, 'center', trot)
        lx, ly = T(0, 5.2 if trot == 0 else 3.6)
        sh.text(lx, ly, 'ULTRASONIC RANGEFINDER  ·  2 - 400 cm', 1.3 * k, 'r', NAVY, 'center', trot)


def draw_servo(sh, cx, cy, k=1.0):
    """SG90 / MG90S micro servo, front elevation as line art, 32.5 mm over the ears at scale k, centred on (cx, cy)."""
    T = lambda x, y: (cx + x * k, cy + y * k)

    def R(x0, y0, x1, y1, **kw):
        a, b = T(x0, y0), T(x1, y1)
        sh.rect(a[0], a[1], b[0], b[1], **kw)
    lw = 0.3
    R(-11.25, -8, 11.25, 11.5, stroke=NAVY, width=lw)        # body 22.5 x 19.5
    R(-16.25, -8, 16.25, -5.5, stroke=NAVY, width=lw)        # mounting ears
    for sx in (-1, 1):
        hx, hy = T(sx * 13.9, -6.75)
        sh.circle(hx, hy, 2 * k, stroke=NAVY, width=lw)       # ear holes
    R(-11.25, -8, 11.25, -2.5, stroke=NAVY, width=lw)        # gear housing band
    hx, hy = T(-5.3, -12.2)
    sh.circle(hx, hy, 11.8 * k, stroke=NAVY, width=lw)       # output boss
    sh.circle(hx, hy, 4.6 * k, stroke=NAVY, width=lw)        # spline shaft
    for i in range(20):
        a0 = i * math.pi / 10
        sh.line(hx + 2.3 * k * math.cos(a0), hy + 2.3 * k * math.sin(a0), hx + 2.9 * k * math.cos(a0), hy + 2.9 * k * math.sin(a0), NAVY, lw * 0.6)
    R(-11.25, 6, 11.25, 6.01, stroke=NAVY, width=lw * 0.7)   # case seam
    for i in range(3):
        x0, y0 = T(-8 + i * 1.6, 11.5)
        x1, y1 = T(-8 + i * 1.6, 15.5)
        sh.line(x0, y0, x1, y1, NAVY, lw * 0.8)              # cable


def motif(sh, x, y, rot=0, color=NAVY):
    """Small geometric mark: three stepped bars (reads as a circuit / stack)."""
    bars = [(0, 0, 9, 1.2), (0, 2.2, 6, 1.2), (0, 4.4, 3, 1.2)]
    for bx, by, bw, bh in bars:
        if rot == 0:
            sh.rect(x + bx, y + by, x + bx + bw, y + by + bh, fill=color)
        elif rot == 90:      # up the page
            sh.rect(x + by, y - bx - bw, x + by + bh, y - bx, fill=color)
        elif rot == 270:
            sh.rect(x - by - bh, y + bx, x - by, y + bx + bw, fill=color)
        else:
            sh.rect(x - bx - bw, y - by - bh, x - bx, y - by, fill=color)


def artwork(sh, guide=False):
    # ---------------- panels
    for name, pts in PANELS.items():
        sh.poly(pts, fill=PALE if name in ('floor', 'nose shelf') else YEL, name=name)
    # background illustration: Fred's topography contours in navy at 22 %, cut to the outside panels (art/topography_net.png)
    topo = os.path.join(ART, 'topography_net.png')
    if os.path.exists(topo):
        sh.image(X0, Y0, X1, Y1, topo)
    # ---------------- deck: hero (front strip), wordmarks (side strips), information (rear strip)
    sh.image(64, 45, 136, 69, os.path.join(ART, 'logo_robocore_navy.png'))
    sh.text(52, 135, 'ROBOCORE V2', 11, 'h', NAVY, 'left', 90)
    sh.text(58.5, 135, 'CLASSROOM ROBOT  ·  BUILD. CODE. CREATE.', 2.8, 'b', NAVY, 'left', 90)
    sh.text(62.5, 135, 'ESP32-S3  ·  2 MOTORS  ·  4 SERVOS  ·  LINE + ULTRASONIC  ·  IMU', 2.2, 'r', NAVY, 'left', 90)
    motif(sh, 49, 79, 90)
    sh.text(148, 77, 'DESIGNED IN ZAMBIA', 8, 'h', NAVY, 'left', 270)
    sh.text(141.5, 77, 'ROBOCORE ZAMBIA  ·  PLASTAL-BOT BUILDERS  ·  LUSAKA', 2.8, 'b', NAVY, 'left', 270)
    sh.text(137.5, 77, 'OPEN HARDWARE FOR CLASSROOMS  ·  REV 2.0  ·  2026', 2.2, 'r', NAVY, 'left', 270)
    motif(sh, 151, 133, 270)
    # board top view at 1:1 under the controller, its holes on the real holes: the placement guide
    bg = json.load(open(os.path.join(ART, 'board_geom.json')))
    s = 1 / bg['px_mm']
    hx = (bg['holes']['TL'][0] + bg['holes']['BR'][0]) / 2 * s      # drawn hole-pattern centre (mm from the image corner)
    hy = (bg['holes']['TL'][1] + bg['holes']['BR'][1]) / 2 * s
    cxb, cyb = 100 + (-30.5 + 30.6 - 30.95 + 30.85) / 4, 106 - (26.65 + 26.25 - 26.8 - 26.95) / 4   # real hole-pattern centre
    sh.image(cxb - hx, cyb - hy, cxb - hx + bg['W'] * s, cyb - hy + bg['H'] * s, os.path.join(ART, 'board_top.png'))
    # rear strip: the controller (isometric) + cream information card with three callouts
    sh.image(40, 150, 86, 188, os.path.join(ART, 'board_iso.png'))
    sh.rect(89, 149.5, 160, 189, fill=CREAM)
    sh.text(92, 156, 'MEET ROBOCORE V2', 5.2, 'h', NAVY)
    y = sh.para(92, 158, 65, 'A classroom robot designed and built in Zambia. Drive, sensing and building are all on one board. '
                'This cardboard chassis gets you moving in an afternoon; later the same board drops into the 3D-printed one.', 2.3, 'r', NAVY)
    for i, s in enumerate(('ESP32-S3 with Wi-Fi and Bluetooth', 'Two encoder motors, four servo ports, IMU', 'Line and ultrasonic sensing', 'Add the arm module: two servos, gear-linked claw')):
        yy = y + 3 + i * 3.4
        sh.rect(92, yy - 1.8, 93.6, yy - 0.2, fill=NAVY)
        sh.text(95, yy, s, 2.2, 'b', NAVY)
    sh.text(92, 187.3, 'REV 2.0  ·  2026', 2.0, 'b', NAVY)   # Fred's wording (Figma, 2026-10-10)
    # ---------------- front flap (hangs down, so everything here is drawn upside down)
    sh.text(100, 39.5, 'ROBOCORE V2', 10, 'h', NAVY, 'center', 180)
    sh.text(100, 31.3, 'BUILD. CODE. CREATE.', 3, 'b', NAVY, 'center', 180)
    hc = os.path.join(ART, 'hcsr04_geom.json')
    if os.path.exists(hc):   # Fred's HC-SR04 front view at 1:1, its drawn cans on the real can holes
        hg = json.load(open(hc))
        (c1x, c1y, _), (c2x, c2y, _) = hg['cans']
        s = 26.0 / abs(c2x - c1x)
        mx, my = (c1x + c2x) / 2 * s, (c1y + c2y) / 2 * s
        w, h = hg['W'] * s, hg['H'] * s
        # drawn with its pins towards the deck crease (+Y): header up once the flap hangs down
        sh.image(100 - mx, 12 - my, 100 - mx + w, 12 - my + h, os.path.join(ART, 'hcsr04_front.png'), 0)
    else:                    # drawn HC-SR04 at 1:1 round the can holes; the module sits header-up, so its pins point
        draw_hcsr04(sh, 100, 12, 1.0, flip=False, text_rot=180, pin_len=12)   # towards the deck crease (+Y on the sheet)
    for sx, s, t in ((-1, 'ULTRASONIC', 'HC-SR04  ·  40 kHz'), (1, 'RANGE', '2 - 400 cm')):
        sh.text(100 + sx * 42, 9.5, t, 2.0, 'hs', NAVY, 'center', 180)
        sh.text(100 + sx * 42, 14.5, s, 3.4, 'h', NAVY, 'center', 180)
    # ---------------- rear wall: specifications, QR, maker
    sh.rect(42, 192.5, 158, 204.5, fill=CREAM)
    sh.text(44, 196, 'SPECIFICATIONS', 2.6, 'h', NAVY)
    specs_l = ['Controller  RoboCore V2, ESP32-S3, 68 x 60 mm', 'Power  1S Li-ion, 3 x 18650 in parallel, USB-C charging']
    specs_r = ['Drive  2 x TT encoder motors, 56 mm wheels, 2 casters', 'Sensing  3-channel line sensor, HC-SR04 ultrasonic, IMU']
    for i, s in enumerate(specs_l):
        sh.text(44, 199.3 + i * 2.7, s, 1.9, 'r', NAVY)
    for i, s in enumerate(specs_r):
        sh.text(102, 199.3 + i * 2.7, s, 1.9, 'r', NAVY)
    sh.text(44 + sh.width('SPECIFICATIONS  ', 'h', 2.6), 196, 'Chassis 125 x 150 x 41 mm, 3 mm card', 1.9, 'r', NAVY)
    qr(sh, 54, 215.5, 17, 'https://www.plastalbotbuilders.com')
    sh.text(54, 227, 'DOCS & CODE', 1.8, 'h', NAVY, 'center')
    sh.image(134, 207, 158, 215.5, os.path.join(ART, 'logo_plastal_navy.png'))
    sh.text(146, 219.5, 'DESIGNED IN ZAMBIA', 2.0, 'h', NAVY, 'center')
    sh.text(146, 222.6, 'RoboCore Zambia  ·  Lusaka', 1.7, 'r', NAVY, 'center')
    sh.text(146, 225.4, 'plastalbotbuilders.com', 1.7, 'r', NAVY, 'center')
    # ---------------- side walls: compact wordmark + side view standing on the wall (wheel hub on the shaft hole)
    g = SIDE_GEOM
    mm_px = 14.0 / g['r'] * 0.355                     # hub ring r = 14 mm; drawn at 0.355 of full size
    W, H = g['W'] * mm_px, g['H'] * mm_px             # 95.9 x 33.6
    dx, dy = (g['wx'] - g['W'] / 2) * mm_px, (g['wy'] - g['H'] / 2) * mm_px
    # left wall: top of the robot towards the wall's top edge (-X), front towards the net's front (+Y):
    # that is the vertically mirrored drawing turned clockwise; wheel hub at (26.5, 311)
    cx, cy = 26.5 - dy, 311 - dx
    sh.image(cx - H / 2, cy - W / 2, cx + H / 2, cy + W / 2, os.path.join(ART, 'robot_side_vflip.png'), 270)
    cx, cy = 173.5 + dy, 311 - dx
    sh.image(cx - H / 2, cy - W / 2, cx + H / 2, cy + W / 2, os.path.join(ART, 'robot_side.png'), 270)
    for xw, rot in ((11.0, 90), (189.0, 270)):
        ys = 272 if rot == 90 else 232
        sh.text(xw, ys, 'ROBOCORE V2', 8, 'h', NAVY, 'left', rot)
        sh.text(xw + (4.5 if rot == 90 else -4.5), ys, 'CLASSROOM ROBOT  ·  REV 2.0', 2.6, 'b', NAVY, 'left', rot)
        sh.text(xw + (8 if rot == 90 else -8), ys, 'DESIGNED IN ZAMBIA', 2.2, 'r', NAVY, 'left', rot)
        motif(sh, xw - 0.5 if rot == 90 else xw + 0.5, 234 if rot == 90 else 270, rot)
    # deck front strip corners: the arm-module servo on the left, a compact spec stack on the right
    if os.path.exists(os.path.join(ART, 'servo_side.png')):
        sh.image(39, 44, 61, 64, os.path.join(ART, 'servo_side.png'))
    else:
        draw_servo(sh, 50, 54, 0.62)
    sh.text(50, 67.5, 'ARM MODULE SERVO', 1.9, 'hs', NAVY, 'center')
    for i, s in enumerate(('CONTROLLER', 'USB-C', '2 X WHEELS', '3D PRINTED CHASSIS')):   # Fred's wording (Figma, 2026-10-10)
        sh.rect(140, 47 + i * 5.2, 141.4, 48.4 + i * 5.2, fill=NAVY)
        sh.text(143, 48.6 + i * 5.2, s, 2.0, 'hs', NAVY)
    # ---------------- floor (underside): the robot, build steps, a parts strip, part zones as a faint guide
    sh.image(42, 331, 90, 371, os.path.join(ART, 'robot_lineart.png'))
    sh.text(95, 335.5, 'HOW TO BUILD', 4, 'h', NAVY)
    steps = ['1  Cut the solid lines, score the folds.', '2  Fold up the side walls, then the rear wall; glue its tabs.',
             '3  Motors through the shaft holes, zip-tied; wheels on.', '4  Battery holder in from the back; casters on.',
             '5  Deck over, front flap down; glue its tabs.', '6  Controller on the deck, leads up through the slots.',
             '7  HC-SR04 behind the flap, line sensor under the nose.', 'Keep metal 15 mm from the antenna. Not for under 8s.']
    for i, s in enumerate(steps):
        sh.text(95, 340 + i * 3.9, s, 2.0, 'b' if i == 7 else 'r', NAVY)
    parts = [('board_iso.png', 'CONTROLLER'), ('linesensor_iso.png', 'LINE SENSOR'), ('hcsr04_iso.png', 'ULTRASONIC'), ('servo_iso.png', 'SERVO (ARM MODULE)')]
    sh.text(100, 235.5, 'WHAT IT CARRIES', 3, 'h', NAVY, 'center')
    cw = 76 / len(parts)
    for i, (fn, lab) in enumerate(parts):
        x0 = 62 + i * cw
        path = os.path.join(ART, fn)
        if os.path.exists(path):
            sh.image(x0 + 1, 237, x0 + cw - 1, 251, path)
        elif fn.startswith('hcsr04'):
            draw_hcsr04(sh, x0 + cw / 2, 244, 0.36, pins=True, label=False)
        else:
            draw_servo(sh, x0 + cw / 2, 244.5, 0.42)
        sh.text(x0 + cw / 2, 254.5, lab, 1.8, 'h', NAVY, 'center')
    # battery area: the robot's top view as a faint blueprint (the holder covers it in use)
    sh.image(72, 262, 128, 318, os.path.join(ART, 'robot_top_faint.png'))
    for z in SH['zone']:
        if z['name'] in ('antenna keep-out', 'HC-SR04', 'controller 68 x 60', 'line sensor'):
            continue
        if 'circle' in z:
            x, y, d = z['circle']
            sh.circle(x, y, d, stroke=NAVY, width=0.25, opacity=0.45)
        else:
            sh.poly(z['pts'], stroke=NAVY, width=0.25, opacity=0.45, dash=(1, 1))
    for (x, y, s, size, rot) in ((100, 283, 'BATTERY HOLDER  3 x 18650', 2.2, 0), (50, 300, 'MOTOR', 2.4, 90), (150, 300, 'MOTOR', 2.4, 270),
                                 (51, 248, 'CASTER', 1.8, 0), (149, 248, 'CASTER', 1.8, 0), (100, 400.5, 'LINE SENSOR UNDERNEATH', 1.8, 0)):
        sh.text(x, y, s, size, 'h', NAVY, 'center', rot, opacity=0.6)
    sh.image(76, 375, 124, 397, os.path.join(ART, 'linesensor_iso.png'))


def dieline(sh, folds=True):
    for s in SH['cut']:
        if 'circle' in s:
            x, y, d = s['circle']
            sh.circle(x, y, d, stroke=NAVY, width=0.3)
        else:
            sh.poly(s['pts'], stroke=NAVY, width=0.3, closed=s['closed'])
    if folds:
        for s in SH['crease']:
            sh.poly(s['pts'], stroke=(150, 150, 150), width=0.25, dash=(2, 1.2), closed=False)


def build():
    make_logos()
    ox, oy = (297 - (X1 - X0)) / 2 - X0, 6
    sh = Sheet(297, 420, ox, oy)
    artwork(sh)
    dieline(sh)
    sh.text(0, 412, 'RoboCore V2 cardboard chassis, branded print, 1:1 on A3 (3 mm card). Solid navy = cut, grey dashed = fold (score, do not cut).', 3.2, 'b', NAVY)
    sh.text(0, 416.5, 'Check: the bar at the right must measure 100 mm.', 2.6, 'r', NAVY)
    sh.line(100, 415.5, 200, 415.5, NAVY, 0.5)
    sh.save(os.path.join(HERE, 'branded_net.pdf'), os.path.join(HERE, 'branded_net.svg'), os.path.join(HERE, 'branded_net.png'))
    # 2 x A4 tiles, 10 mm overlap at Y 195..205
    tiles = fitz.open()
    for k, (yf, yt) in enumerate(((0, 205), (195, Y1))):
        t = Sheet(210, 297, (210 - (X1 - X0)) / 2 - X0, 8 - yf)
        artwork(t)
        dieline(t)
        pg = t.page
        pg.draw_rect(fitz.Rect(-5, (8 + yt - yf) * K, 215 * K, 300 * K), color=None, fill=(1, 1, 1), overlay=True)
        pg.draw_rect(fitz.Rect(0, 0, 210 * K, 8 * K), color=None, fill=(1, 1, 1), overlay=True)
        pg.insert_text(fitz.Point(8 * K, 287 * K), 'RoboCore V2 cardboard chassis, branded print, tile %d of 2 at 1:1. Overlap the tiles 10 mm at the grey dotted line.' % (k + 1), fontsize=8, fontname='helv')
        pg.draw_line(fitz.Point(8 * K, 292 * K), fitz.Point(108 * K, 292 * K), color=(0, 0, 0), width=1.2)
        pg.insert_text(fitz.Point(110 * K, 293 * K), '100 mm', fontsize=7.5, fontname='helv')
        yl = 8 + (195 - yf if k == 0 else 10)
        pg.draw_line(fitz.Point(0, yl * K), fitz.Point(210 * K, yl * K), color=(0.5, 0.5, 0.5), width=0.4, dashes='[2 2] 0')
        tiles.insert_pdf(t.doc)
    tiles.save(os.path.join(HERE, 'branded_net_A4_tiles.pdf'), deflate=True, garbage=3)
    print('branded net written')


def make_logos():
    """Navy versions of the two logos from the SVG sources (rendered by PyMuPDF, then recoloured)."""
    import numpy as np
    from PIL import Image
    T = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))), 'technicalreference')
    for src, dst, dpi in (('RoboCore.svg', 'logo_robocore_navy.png', 72), ('Plastal-Bot Logo.svg', 'logo_plastal_navy.png', 260)):
        pix = fitz.open(os.path.join(T, src))[0].get_pixmap(dpi=dpi, alpha=True)   # about 2900 px wide each
        im = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)
        a = np.array(im)
        alpha = a[:, :, 3]
        lum = a[:, :, :3].mean(axis=2)
        keep = (alpha > 0) & (lum < 235)          # drop the white highlights, keep ink and teal
        out = np.zeros_like(a)
        out[..., 0], out[..., 1], out[..., 2] = NAVY
        out[..., 3] = np.where(keep, alpha, 0)
        Image.fromarray(out, 'RGBA').save(os.path.join(ART, dst))


if __name__ == '__main__':
    build()
