# RoboCore V2 robot: mechanical expansion bus (rev 5)

![Expansion bus](renders/bus_spec.png)

The rev 5 body is a flat **deck** with the walls hanging under it. It prints deck-down and is open underneath. Everything you add attaches to the bus groove, the hole row, the front dock or the deck itself. Positions are on the **8 mm grid** (LEGO Technic pitch). The robot's origin is the floor point under the middle of the wheel axle: x to the right, y forward, z up, all in mm.

## 1. Bus groove (flush, under the deck)
There is no lip any more (Fred, 2026-10-07: the side should read as one body). The outer wall runs straight up into the deck, and the bus is a **groove** cut into the wall just under it.

| Feature | Value |
|---|---|
| Groove | **1.8 mm deep**, back face from **z 46 to 49**; flat top; the underside runs out at 45° to the wall face at z 44.2 (prints top-down) |
| Wall behind it | 3 mm wall + a 1.5 mm band inside (z 43 up to the deck) = 4.5 mm, 2.7 mm left behind the groove |
| Where | every straight run and outside chamfer, **except the two wheel-section sides** (y −35 … 35), where the wall is only the wheel-well skin |
| Detents | V-notches 1.4 wide × 0.7 deep in the groove's back face, **every 8 mm** along each run (centred on the run), plus one in the middle of each outside chamfer: **54 in all**. On the rear wall they sit at x = 0, ±8 … ±48 |
| Keep-out | the wheel sides have no groove, so clips can't go there |

### The bus clip (template part `Bus_clip`)
- A **tongue on the outer leg goes into the groove** (0.25 mm clearance, 45° underside like the groove's). The bar sits on the deck edge.
- A **tab lies on the deck**, 13 mm in from the wall face. It holds an **M3 heat-set insert**, and an **M3 × 8 thumb screw** through it presses on the deck. That lifts the clip and pulls the tongue up against the groove's flat top. The screw sits 9.15 mm in from the wall's outer face, so the deck must be solid there. Keep clear of the deck openings: wheel wells, the plug slots over the encoders, the rear cable ports and the caster vents.
- A small V-bump on the tongue's tip sits in one detent, so the clip can't slide.
- The outer face has a 10 × 10 mm boss with an **M3 insert**. Bolt your sensor bracket, light or flag there.
- **To fit it:**
  1. Tilt the clip (tab up and out) and push the tongue into the groove.
  2. Swing the tab down onto the deck, with the bump in a detent.
  3. Tighten the thumb screw by hand. No tools.
- **Your own accessories:** the profile is `_rail_clip()` / `_clip_core()` in `fusion/build_robot.py`, with its dimensions in `rc_params.py` (`CLIP_*`, `BUS_GROOVE`). `_clip_core(..., bump_dy)` moves the bump along the clip if the clip's centre can't sit on a detent.
- **Print the `Rail_coupon` first:** 40 mm of deck, wall and groove, deck-down, about 20 min. If the clip is tight or loose on your printer, change `CLIP_GAP` (0.25 by default) and re-export the clip.

### Ballast clips (arm module)
- Two clips sit on the rear wall at **x ±44**, each holding **3 × M8 nuts** in a hex pocket that hangs behind the rear wall.
- Their bumps are 4 mm off centre, so they drop into the detents at x 48 and −40, and their screws land on solid deck between the caster vents and the cable ports.
- Fit them whenever the arm is on.

## 2. Hole row
| Feature | Value |
|---|---|
| Holes | Ø4.9 at **z 42**, 8 mm pitch. They take LEGO Technic pins and axles, M4 screws, or M3 screws with nuts |
| Wall behind the holes | thickened to **6 mm** (z 36.5–49.5, 45° underside) so Technic pins grip at both ends |
| Positions | **front-section sides only:** x ±47, y = 43.5, 51.5, 59.5, 67.5, 75.5 (5 per side, **10 in all**). The other walls have the encoder covers, the casters or the battery right behind them, with no room for a pin or a nut |

## 3. Front dock
- **Two M3 heat-set inserts, 54 mm apart, at (±27, 53), z 52**, in the tops of the two dock towers.
- The **sonar bracket** bolts on here: a 3 mm plate with a headlight-style pod hanging from its front that holds the ultrasonic (the board snaps in from the back of the pod).
- Anything else stacks on the bracket plate (top at z 55), using longer M3 screws. The **arm module** does this with 2 × M3 × 10 socket screws.
- The ultrasonic beam leaves the transducers at z 30, about 82 mm forward, and rises 5°. Keep the cone (±15° round that line) clear in front of the robot.

## 4. The deck
The deck (z 49.5–52) is a flat, solid mounting surface, like the XRP's top plate.
- **The board** takes four M2 inserts at its holes.
- **Your own fixings:** you can melt M3 inserts into the deck anywhere it is solid (2.5 mm thick, so use short inserts or a printed boss). Avoid the openings:

| Opening | Where |
|---|---|
| Board window + rear cable slot | x ±28.5, y −38 … 24.5, under and behind the board |
| USB relief | x ±7.5, y −58 … −35 |
| Front cable slot | x 1 … 20, y 30.6 … 36.5 |
| Encoder plug slots | x ±(39.5 … 53.5), y −55 … −43 |
| Rear cable ports | x ±(35 … 40.3), y −78.5 … −66 |
| Caster vents | Ø4 at (±49, −73) |
| Wheel wells | x ±(61.1 … 78.1), y ±30.5 |

## Inside the body (for advanced builds)
- **Open underneath:** there is no floor. The motors, the battery holder and the line-sensor sled all go in from below or from the back.
- **Battery bay:** 45° V-rails along both sides of the holder. The snap flaps are the rear 12 mm of the rail walls.
- **Casters:** a ½" ball snaps into each rear-corner socket (lip at z 3.7).
