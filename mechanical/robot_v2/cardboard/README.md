# RoboCore V2 robot: cardboard chassis (cut-out template)

A flat net that folds into a box chassis for the RoboCore V2 robot, derived from the rev 5 Fusion
parameters (`../fusion/rc_params.py`). Same wheel, motor, battery, board and sensor positions as the
printed chassis, so the firmware, the cables and the add-ons are the same.

Files (all 1:1, mm):
- `robot_cardboard_net.pdf` / `.svg`: the net on one A3 portrait sheet.
- `robot_cardboard_net_A4_tiles.pdf`: the same net on two A4 sheets, 10 mm overlap at the grey dotted line.
- `robot_cardboard_net.png`: preview.
- Figma: *RoboCore V2 cardboard chassis net* (Plastal-Bot Builders team), 1 px = 1 mm, layers CUT / FOLD / PARTS / LABELS.
- `make_net.py` regenerates everything (`python3 make_net.py`); `net.json` holds the shapes.

Legend: **black = cut**, **red dashed = fold** (score the card on the fold line), **blue = where a part sits** (not cut).
Check the 100 mm bar on the print before cutting.

## Overall dimensions
| | mm |
|---|---|
| Sheet (net) | 200 × 403 |
| Folded body (outside) | 125 wide × 150 long × 41 high |
| Floor underside above the ground | 11 (same as the printed chassis, 10.5) |
| Deck top above the ground | 55 (board underside; printed chassis 52) |
| Overall with wheels | 154 wide × 180 long (nose shelf to rear wall) |
| Card | 3 mm single-wall corrugated (E or B flute). 1.5 mm grey board works too: set `T = 1.5` and regenerate |

## Space for each part
| Part | Size | Where on the net |
|---|---|---|
| RoboCore V2 controller | 68 × 60, 4 × M2 at (±30.5, ±26.7) | on the deck, centre over the axle; two 12 × 4 motor-lead slots just in front of it (under the MOTOR sockets) and one 58 × 12 slot across its rear edge for the battery lead, the sensor leads and the USB-C plug body |
| TT gearmotor with encoder (×2) | 19 wide × 22.5 tall × ~77 long with the encoder cover | against each side wall, inner face at 40.5 from the centre; Ø6.5 shaft hole and Ø4.5 locating-pin hole (11 mm behind the shaft) at 14 mm above the floor; four 5 × 2.5 zip-tie slots around the gearbox |
| Wheels (Ø56 × 10) | outside the walls, inner face 1.3 mm from the wall | axle 28 mm above the ground |
| BatteryHolder3S (3 × 18650, 1S3P) | 61.6 × 78.4 × 21.6 | on the floor between the motors, from 67 mm behind the axle to 12 mm in front; slides in through the 64 × 23.5 opening in the rear wall; hold it with hook-and-loop tape |
| Ball casters (×2) | ≈ 11 mm tall (e.g. Pololu 3/8" metal ball caster) | floor, 49 mm either side, 73 mm behind the axle; 2 × Ø3.2 at 12 mm pitch, drill to suit your caster |
| HC-SR04 | 45 × 20, Ø16 cans 26 mm apart | inside the front flap, cans through the Ø16.5 holes 26 mm above the ground, header pointing up; glue or tape the board to the flap |
| Line sensor (RoboCore or Funduino 3-channel) | 60 × 24 | under the nose shelf, 2 × M3 at 51.6 mm pitch; sensors 3 to 4 mm off the floor |
| Free space | ≈ 119 × 40 at the front of the floor | wiring, a buzzer, a switch, ballast |

## Folding order
1. Cut the outline and the holes. Score every red line.
2. Fold the two side walls up, then the rear wall up; glue its two tabs to the inside of the side walls.
3. The nose shelf stays flat (it is part of the floor); the line sensor hangs under it.
4. Fit the motors through the side-wall holes (shaft and pin), zip-tie them through the slots; push the wheels on.
5. Slide the battery holder in from the back and strap it; screw the casters on.
6. Fold the deck over the rear wall onto the walls, then the front flap down in front of the floor's front edge; its two tabs fold around the outside of the side walls (glue or tape).
7. Screw the controller to the deck (4 × M2 with nuts, or M2 inserts in a 3 mm card won't hold: use nuts), bring the motor leads up through the two front slots and the battery and sensor leads through the rear slot.
8. Fit the HC-SR04 behind the front flap and the line sensor under the nose shelf.

The deck is held by the front flap's tabs and the rear fold only; for a stiffer chassis glue a second layer of card under the deck between the walls, or add two M3 bolts through the deck into the top of the side walls.

## Branded version (print-ready)
`make_branded.py` draws the artwork onto the same dieline (it reads `net.json`, so run `make_net.py` first):
- `branded_net.pdf`: A3 portrait, 1:1. Navy solid lines = cut, grey dashed = fold (score, do not cut).
- `branded_net_A4_tiles.pdf`: the same on two A4 sheets, 10 mm overlap at the grey dotted line.
- `branded_net.svg`: the same drawing as editable vectors and text with the images embedded; drag it onto a Figma canvas
  (or File > Import) to edit it there at 1 unit = 1 mm.
- `branded_net.png`: preview.

Design: yellow panels, navy type and line art, cream information areas, Fred's topography contours as a faint background (`art/topography_src.svg`, rendered to `art/topography_net.png` at 22 % navy, outside panels only); Barlow Condensed Bold for headings and Barlow for
the rest (Google Fonts, OFL, in `art/fonts/`; the same family is available inside Figma), nothing under 1.7 mm. Panel roles: deck front strip = RoboCore logo (hero);
deck side strips = wordmark and maker line; deck rear strip = Fred's isometric drawing and the "Meet RoboCore V2" card
with three feature callouts; front flap = ROBOCORE V2 and the tagline; rear wall = specifications band, QR code to
plastalbotbuilders.com, Plastal-Bot logo; side walls = compact wordmark and the side-view drawing standing on the wall
at 0.355 scale with its wheel hub on the motor-shaft hole, mirrored so each faces like the real robot; floor underside =
"How to build" steps with the robot drawing, a "What it carries" parts strip and the part zones as a faint guide.
The controller's top view is printed under the board at exactly 1:1 with its holes on the real holes (placement guide); the
controller isometric is the illustration on the rear strip; the line-sensor isometric sits on the nose shelf.
Fred's HC-SR04 drawings (front view printed on the flap at 1:1 with its cans on the can holes and the header pointing up,
isometric in the parts strip) and micro-servo drawings (side view on the deck front strip, isometric in the parts strip) are
in `art/` as `hcsr04_*_src.png` / `servo_*_src.png`. If they are missing, `make_branded.py` falls back to line art drawn in
code (`draw_hcsr04`, `draw_servo`). Source drawings and the recoloured logos are in `art/`; `art/key.py` keys them to navy.

## DXF and 3D model (cad/)
`make_3d.py` (run after `make_net.py` and `make_branded.py`) writes, in millimetres:
- `cad/cardboard_net.dxf`: the dieline 1:1, layer CUT (outline and holes) and layer FOLD (dashed). Import into a Fusion 360
  sketch (Insert > Insert DXF) or send it to a laser/blade cutter.
- `cad/cardboard_chassis.obj` + `.mtl` + `cardboard_chassis_texture.png`: the folded chassis as 3 mm slabs in the robot frame
  (X right, Y forward, Z up, origin on the floor under the axle, same as the Fusion model), outside faces UV-mapped to the
  printed artwork, inside faces and edges in a card colour, plus two placeholder wheels.
- `cad/cardboard_chassis.glb`: the same chassis as one glTF file with the texture embedded (Blender: File > Import > glTF 2.0;
  scale 0.001 if you work in metres).
- `cad/cardboard_chassis_flat.obj`: the unfolded sheet with the same texture.
- `cad/blender_render.py`: a headless Blender script that imports the glb, adds a ground, lights and a camera and renders a
  test image: `/Applications/Blender.app/Contents/MacOS/Blender -b --python cad/blender_render.py -- out.png`.
For a proper CAD solid (STEP) of the folded chassis, import the DXF into Fusion 360 and use Sheet Metal (3 mm rule, zero bend
radius) to fold the flanges, or ask for it when the Fusion add-in is connected again.
