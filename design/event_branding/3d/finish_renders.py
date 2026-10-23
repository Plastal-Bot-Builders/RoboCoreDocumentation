"""Finish the Blender renders for print: soft shadows that never touch the edge, upright box top, tight hero crops.

Reads the untouched renders in 3d/renders_raw/ and writes assets/renders/, so it can be rerun safely.

    python3 -I finish_renders.py

- Shadow: the floor shadow is faded with distance from the model (a blurred copy of the model's opaque
  pixels), then faded to zero across a thin band at the image edge, so no straight edge shows on any colour.
- box_closed_top: Blender's top camera sees the lid upside down, so it is turned 180 degrees.
- Straight-down views get no shadow: seen from above it only reads as a grey haze around the model.
- Hero shots (isometric robot, all box views) are trimmed to the model and its shadow.
  The orthographic robot views keep their framing: the views strip scales them from the model's real size.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
RAW, OUT = HERE / 'renders_raw', HERE.parent / 'assets' / 'renders'
KEEP_FRAMING = {'robot_front', 'robot_back', 'robot_left', 'robot_right', 'robot_top'}
ROTATE_180 = {'box_closed_top'}
SHADOWLESS = {'robot_top', 'box_closed_top'}
SHADOW_REACH = 0.05     # blur radius of the shadow falloff, as a share of the longest side
SHADOW_GAIN = 2.4       # >2 keeps the contact shadow at full strength right next to the model
EDGE_BAND = 0.025       # edge fade, as a share of the shorter side (the model sits 3.7 % in from every edge)
CROP_ALPHA, CROP_PAD = 6, 0.03


def edge_fade(size, band):
    """Greyscale mask: 255 inside, falling linearly to 0 at the image edge."""
    w, h = size
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for i in range(band):
        d.rectangle((i, i, w - 1 - i, h - 1 - i), outline=round(255 * (i + 1) / band))
    d.rectangle((band, band, w - 1 - band, h - 1 - band), fill=255)
    return m


OUT.mkdir(parents=True, exist_ok=True)
for src in sorted(RAW.glob('*.png')):
    im = Image.open(src).convert('RGBA')
    if src.stem in ROTATE_180:
        im = im.rotate(180)
    a = im.getchannel('A')
    model = a.point(lambda v: 255 if v >= 250 else 0)
    reach = model.filter(ImageFilter.GaussianBlur(max(im.size) * SHADOW_REACH))
    falloff = reach.point(lambda v: min(255, round(v * SHADOW_GAIN)))
    a = ImageChops.multiply(a, falloff)
    if src.stem in SHADOWLESS:
        a = ImageChops.darker(a, model.filter(ImageFilter.MaxFilter(5)))   # keep the model and its anti-aliased edge
    a = ImageChops.multiply(a, edge_fade(im.size, max(2, round(min(im.size) * EDGE_BAND))))
    im.putalpha(a)
    if src.stem not in KEEP_FRAMING:
        box = a.point(lambda v: 255 if v > CROP_ALPHA else 0).getbbox()
        pad = round(max(box[2] - box[0], box[3] - box[1]) * CROP_PAD)
        im = im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))
    im.save(OUT / src.name, optimize=True)
    print(src.name, im.size)
