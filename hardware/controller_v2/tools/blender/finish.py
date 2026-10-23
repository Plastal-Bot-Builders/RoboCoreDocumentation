"""After render_board.py: white-background JPG copies and a contact sheet of the board renders.

    python3 finish.py DIR       (needs Pillow; render_board.sh puts it in .cache/pylib)

DIR holds <shot>.png (transparent, with shadow). Writes <shot>_white.jpg next to each and contact_sheet.jpg.
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

ORDER = ['hero_front', 'hero_rear', 'edge_low', 'macro_esp32', 'top', 'bottom']
TITLES = {'hero_front': 'Front three-quarter', 'hero_rear': 'Rear three-quarter', 'edge_low': 'Connector edge',
          'macro_esp32': 'ESP32-S3 module', 'top': 'Top (orthographic)', 'bottom': 'Bottom (orthographic)'}
d = sys.argv[1]
shots = [s for s in ORDER if os.path.exists(os.path.join(d, s + '.png'))]
whites = []
for s in shots:
    im = Image.open(os.path.join(d, s + '.png')).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    w = bg.convert('RGB')
    w.save(os.path.join(d, s + '_white.jpg'), quality=92, subsampling=0)
    whites.append((s, w))
    print('white copy', s, w.size)

# contact sheet: 3 columns, each tile 1000 px wide, title under each
cols, tw, pad = 3, 1000, 30
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 30)
except OSError:
    font = ImageFont.load_default()
tiles = []
for s, w in whites:
    t = w.copy(); t.thumbnail((tw, tw))
    tiles.append((s, t))
th = max(t.height for _, t in tiles) + 50
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + pad) + pad), 'white')
dr = ImageDraw.Draw(sheet)
for i, (s, t) in enumerate(tiles):
    x = pad + (i % cols) * (tw + pad); y = pad + (i // cols) * (th + pad)
    sheet.paste(t, (x + (tw - t.width) // 2, y + (th - 50 - t.height) // 2))
    dr.text((x + tw // 2, y + th - 25), TITLES.get(s, s), fill=(40, 46, 60), font=font, anchor='mm')
sheet.save(os.path.join(d, 'contact_sheet.jpg'), quality=88)
print('contact sheet', sheet.size)
