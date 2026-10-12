# RoboCore V2 packaging: mailer box for the assembled robot

A roll-end tuck-top mailer (FEFCO 0427 style, the same construction as the SparkFun XRP box): the box lies flat, the
lid is the big face and hinges along the back edge, a rounded tongue tucks into the front wall, the end walls roll over
double and lock with tabs into the floor, and the front wall's end flaps are trapped inside them. Both faces of the
card are printed: the outside carries the hero and the information panels, the inside (lid, back wall, floor, front wall
and the inner end walls) carries the "get started" card, the partner cards and the kit contents, like the reference box.

`python3 make_box.py` regenerates everything from the numbers at the top of the file (`L, W, H, T`).
The earlier upright reverse-tuck-end version is kept as `make_box_tuckend.py` / `out_tuckend/`.

## Dimensions
| | mm |
|---|---|
| Floor (L × W) and wall height | 270 × 200, 80 |
| Outer box | 273 × 203 × 83 |
| Cavity (inside the double end walls and dust flaps) | 259 × 200 × 80 |
| Card | E-flute 1.5 mm (`T`); for 3 mm B-flute set `T = 3` and regenerate |
| Flat sheet | 619 × 591 |
| Insert tray | 258 × 198 × 40 (two layers of 20 mm foam or eight of 5 mm corrugated), lies on the floor |

The assembled robot (167 × 166 × 65 mm) stands in the cross-shaped pocket; the arm boom, base, two servos, jaws,
ballast clips, screw pack and USB-C cable have their own pockets beside it.

## Panel roles
Outside: lid = hero (logo, ROBOCORE V2, Classroom Robot, robot drawing, features, Designed in Zambia); floor = Meet
RoboCore V2, what's in the box, specifications, QR, barcode, safety; back wall = wordmark and side view; front wall =
logo, Build | Code | Create, top view, finger notch; end walls = compact wordmark with the rear view (left) and the
Plastal-Bot mark, barcode and origin line (right).
Inside: lid = Get started here (QR, what the site holds, before you start); back wall = Plastal-Bot Builders and
community cards with QRs; floor = This kit includes, 12 line-art icons; inner end walls = part drawings; front wall and
tongue = wordmark. Palette: yellow outside, cream information areas, navy type and line art, Fred's contours faint behind.

## Files (out/)
- `box_outside.pdf`, `box_inside.pdf`: print 1:1 (639 × 621 mm page; the inside page is mirrored so it prints on the back
  of the same sheet). `box_outside_A3_tiles.pdf`, `box_inside_A3_tiles.pdf`: 6 A3 landscape sheets each, 10 mm overlap.
- `box_dieline.pdf`: blank dieline with panel names (printed-outside view). Navy = cut, grey dashed = fold/score.
- `box_outside.svg`, `box_inside.svg`: the same pages as editable vectors for Figma (import at 1 unit = 1 mm).
- `box_net.dxf`, `insert.dxf`: mm, layers CUT and FOLD. Fusion: Insert DXF, then Sheet Metal with a zero bend radius.
- `insert.pdf` / `.png`: the tray with its pockets, 1:1 on A4 landscape.
- `box_closed.glb`, `box_open.glb` (lid at 110° with the tray inside), `insert.glb`, `box_flat.obj`, plus OBJ/MTL and
  the two textures. Materials: `print` (outside page), `inside` (inside page), `card`, `kraft`.
- `render_closed_hero.png`, `render_open_hero.png` from `blender_render.py`:
  `/Applications/Blender.app/Contents/MacOS/Blender -b --python "$PWD/blender_render.py" -- "$PWD/out/x.png" open hero`
  (states `closed` | `open`; views `hero` | `front` | `top` | `back`). To add the robot, import the Fusion export into the
  open scene and put it in the robot pocket (x 10.5..184.5, y 10.5..185.5 from the front, z 1.5..41.5 mm, box origin at the
  front-bottom-left outer corner, metres = mm × 0.001).

## Folding
1. Cut the outline, the four tab slots and the finger notch; score every dashed line.
2. Fold the back wall and the front wall up. Fold the front wall's end flaps inwards along the floor's end edges.
3. Fold each outer end wall up over its flap, roll the strip over the top and bring the inner end wall down inside;
   push its two tabs into the floor slots.
4. Fold the lid over; its dust flaps drop inside the end walls and the tongue tucks behind the front wall.
