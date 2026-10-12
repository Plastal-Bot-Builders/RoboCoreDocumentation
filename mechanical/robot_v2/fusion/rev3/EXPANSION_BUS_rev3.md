# RoboCore V2 robot: mechanical expansion bus (rev 3)

![Expansion bus](renders/bus_spec.png)

The robot's body is designed to be built on. Everything you add attaches to one of three features, all on the same **8 mm grid** (LEGO Technic pitch). The robot's origin is the floor point under the middle of the wheel axle: x to the right, y forward, z up, all in mm.

## 1. Perimeter rail
A lip runs all the way round the top of the body.

| Feature | Value |
|---|---|
| Rail top | z 52 (the body line) |
| Lip | sticks out 3 mm from the wall face; flat outer face z 50–52; **45° underside z 47–50** (prints without supports, and clips hook under it) |
| Wall under the lip | 3 mm |
| Detents | V-notches 1.4 wide × 0.7 deep, cut through the lip's full height, **every 8 mm** on the straight runs: x = 0, ±8 … ±56 at the front and back; y = −62, −54 … +42 on the sides (58 in all) |
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
| Positions | back: x = 0, ±8 … ±56 (15 holes) · front: x = ±40, ±48, ±56 (6; none in front of the eyes or the dock towers) · sides: y = −62, −54, −46, −38, +38, +46 (6 per side; none over the wheels) |

## 3. Front dock
- **Two M3 heat-set inserts, 54 mm apart, at (±27, 53), z 52**, in the tops of the two towers that hold the ultrasonic.
- The **arm module** bolts on here. With the arm off, the **Dock cap** bolts on instead and keeps the ultrasonic in its grooves.
- Anything fitted to the dock must not go below z 52 between x ±21.8: that space is the ultrasonic's.
- The ultrasonic beam leaves the eyes at z 36 and rises 5°. Keep the cone (±15° round that line) clear in front of the robot.

## Inside the body (for advanced builds)
- **Board pillars:** M2 inserts at the four board holes, z 46.
- **Inner walls:** the inner-wall tops at z 42 have cable saddles at y −28, −5 and +20.
- **Floor:** has zip-tie slot pairs at (±30, −64) and (±20, 24).
