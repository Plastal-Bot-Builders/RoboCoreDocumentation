# RoboCore V2 robot: mechanical expansion bus (rev 4)

![Expansion bus](renders/bus_spec.png)

The robot's body is an octagon (45° chamfered corners) designed to be built on. Everything you add attaches to one of three features, all on the same **8 mm grid** (LEGO Technic pitch). The robot's origin is the floor point under the middle of the wheel axle: x to the right, y forward, z up, all in mm.

## 1. Perimeter rail
A lip runs all the way round the top of the body, across all eight faces.

| Feature | Value |
|---|---|
| Rail top | z 52 (the body line) |
| Lip | sticks out 3 mm from the wall face; flat outer face z 50–52; **45° underside z 47–50** (prints without supports, and clips hook under it) |
| Wall under the lip | 3 mm |
| Detents | V-notches 1.4 wide × 0.7 deep, cut through the lip's full height, **every 8 mm** on the straight runs: x = 0, ±8 … ±48 at the front and back; y = −46, −38 … +34 on the sides; 3 on each diagonal, 8 mm apart (60 in all) |
| Keep-out | **no clips over the wheels (−25 < y < 25 on the sides)**: the tyre tops come up to z 56, inside the rail |

### The bus clip (template part `Bus_clip`)
- The outer leg hooks under the 45° underside (1 mm hook, 0.25 mm clearance all round).
- The top bar rests on the rail.
- The inner leg drops inside the wall: an **M3 heat-set insert + M3 thumb screw** pushes on the wall's inner face and wedges the hook up under the lip.
- A small V-bump on the outer leg sits in one detent, so the clip can't slide.
- The outer face has a 10 × 10 mm boss with an **M3 insert**. Bolt your sensor bracket, light or flag there.
- To fit it: hook the outer leg under the lip, swing the clip down over the rail, then tighten the thumb screw by hand. No tools.
- Copy the clip for your own accessories. The profile is `_rail_clip()` in `fusion/build_robot.py`, with its dimensions in `rc_params.py` (`CLIP_*`).
- **Print the `Rail_coupon` first** (40 mm of rail, about 20 min). If the clip is tight or loose on your printer, change `CLIP_GAP` (0.25 by default) and re-export the clip.

## 2. Hole row
| Feature | Value |
|---|---|
| Holes | Ø4.9 at **z 42**, 8 mm pitch. They take LEGO Technic pins and axles, M4 screws, or M3 screws with nuts |
| Wall behind the holes | thickened to **6 mm** (z 35–46.5, 45° underside) so Technic pins grip at both ends |
| Positions | back and front: x = 0, ±8 … ±48 (13 each) · sides: y = −46, −38 (2 per side; none over the wheels) · each diagonal: 3, 8 mm apart (12): 42 holes in all |

## 3. Front dock
- **Two M3 heat-set inserts, 54 mm apart, at (±27, 53), z 52**, in the tops of the two dock towers.
- The **sonar bracket** bolts on here, XRP-style: a 3 mm plate with two drop arms that hold the ultrasonic in front of the nose.
- Anything else stacks on the bracket plate (top at z 55), using longer M3 screws. The **arm module** does this with 2 × M3 × 12.
- The ultrasonic beam leaves the transducers at z 30, about 82 mm forward, and rises 5°. Keep the cone (±15° round that line) clear in front of the robot.
- The front holes at x = ±24 sit behind the bracket's drop arms, so they are covered while the bracket is on.

## Inside the body (for advanced builds)
- **Board pillars:** M2 inserts at the four board holes, z 46.
- **Inner walls:** the inner-wall tops at z 42 have cable saddles at y −28, −5 and +20.
- **Floor:** has zip-tie slot pairs at (±56, −64) and (±20, 24).
- **Ballast rack** behind the battery: 6 slots for M8 nuts standing on a corner (fit them with the arm module).
