"""Publish the board renders to the shared RoboCore repo, for the software and design chats.

    python3 share.py SRC DST      (needs Pillow; render_board.sh runs it last)

SRC = docs/renders/blender (render_board.py + finish.py output)
DST = ~/RoboCoreProjects/RoboCore/hardware/controller_v2/renders
Writes, for each shot, with web-friendly names (robocore-controller-<shot>):
  full/<name>.png            full size, transparent background with a soft shadow
  full/<name>-white.jpg      full size on white
  web/<name>.png, .webp      1600 px wide, transparent (for the IDE and the website)
  web/<name>-white.jpg       1600 px wide on white
  <name>-parts.json          where each part sits in the image, in full-size pixels (see the README there)
and copies contact_sheet.jpg. The README in DST is kept as it is.
"""
import json, os, shutil, sys
from PIL import Image

SRC, DST = sys.argv[1], sys.argv[2]
ORDER = ['hero_front', 'hero_rear', 'edge_low', 'macro_esp32', 'top', 'bottom']
WEB = 1600
os.makedirs(os.path.join(DST, 'full'), exist_ok=True)
os.makedirs(os.path.join(DST, 'web'), exist_ok=True)
for s in ORDER:
    png = os.path.join(SRC, s + '.png')
    if not os.path.exists(png):
        continue
    name = 'robocore-controller-' + s.replace('_', '-')
    shutil.copy2(png, os.path.join(DST, 'full', name + '.png'))
    white = os.path.join(SRC, s + '_white.jpg')
    if os.path.exists(white):
        shutil.copy2(white, os.path.join(DST, 'full', name + '-white.jpg'))
    im = Image.open(png).convert('RGBA')
    scale = WEB / im.width
    web = im.resize((WEB, round(im.height * scale)), Image.LANCZOS)
    web.save(os.path.join(DST, 'web', name + '.png'), optimize=True)
    web.save(os.path.join(DST, 'web', name + '.webp'), quality=90, method=6)
    bg = Image.new('RGBA', web.size, (255, 255, 255, 255)); bg.alpha_composite(web)
    bg.convert('RGB').save(os.path.join(DST, 'web', name + '-white.jpg'), quality=90)
    pj = os.path.join(SRC, s + '_parts.json')
    if os.path.exists(pj):
        d = json.load(open(pj))
        d['image'] = 'full/' + name + '.png'
        d['web'] = dict(image='web/' + name + '.png', width=WEB, height=web.height, scale=round(scale, 6),
                        note='multiply the pixel boxes by scale for the web images')
        json.dump(d, open(os.path.join(DST, name + '-parts.json'), 'w'), indent=1)
    print('shared', name)
cs = os.path.join(SRC, 'contact_sheet.jpg')
if os.path.exists(cs):
    shutil.copy2(cs, os.path.join(DST, 'robocore-controller-contact-sheet.jpg'))
