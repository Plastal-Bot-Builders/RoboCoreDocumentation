# RoboCore V2 robot (XRP-inspired): revision 4, 2026-10-06

![Robot](renders/robot_hero_noarm.png)

Revision 3 followed the "Chassis Design Feedback and Refinement" notes. Rev 2's side pods, bumper ring and front bezel are gone. In their place is **one open, unified body** that you can build on:

- a rail and an 8 mm hole row round the whole perimeter;
- motors that drop in from above (wheels already on) and click into place;
- a snap-in line-sensor sled;
- a beginner **2-servo arm module**.

**Revision 4** takes two ideas from the SparkFun XRP, as Fred chose:
- **An octagon plan**, with 45° chamfered corners. The rail, detents and holes run round all eight faces.
- **The ultrasonic on a bracket in front of the nose.** The bracket bolts to the front dock, and the arm base stacks on top of it.

Rev 1–3 are archived in `fusion/rev1…3/`, `renders/rev1…3/` and `print/rev2…3/`.

![With the arm module](renders/robot_hero.png)

| | |
|---|---|
| Before / after | `renders/before_after_front.png`, `renders/before_after_rear.png` (rev 3 vs rev 4) |
| Colour schemes | `renders/schemes/colour_schemes.png` (teal, orange) |
| Views | `renders/robot_{iso, iso_front, iso_rear, side, top, under_iso}.png` (arm raised), `renders/robot_noarm_*.png` (no arm), `renders/robot_arm_floor_*.png` (arm lowered), ray-traced `renders/robot_hero.png` and `robot_hero_noarm.png` |
| Expansion bus | [`EXPANSION_BUS.md`](EXPANSION_BUS.md) and `renders/bus_spec.png` |

## Files
| What | Where |
|---|---|
| Fusion 360 design (cloud) | **RoboCore V2 Robot** in UniPod Project → RoboCore V2. Version 8 is rev 2, version 10 is rev 3; rev 4 is the latest version. The main board, line sensor and ultrasonic are linked from their own files |
| Offline copy | `RoboCore_V2_Robot.f3d` (7 MB) and `RoboCore_V2_Robot.step` (whole robot with the boards, 26 MB) |
| Print files | `print/RoboCore_V2_<part>.stl` / `.3mf`. **Every file is already in its print orientation.** The line sled comes in three heights: `Line_sled_9.5/10.5/11.5` |
| Generator | `fusion/build_robot.py`, with every dimension in `fusion/rc_params.py`. Also `rc_lib.py`, `checks.py`, `export.py`, `view.py`, and `bus_drawing.py` (bus drawing, runs outside Fusion) |

## What changed (rev 3 → rev 4)
- **Octagon plan:**
  - The rounded rectangle became an octagon with 24 mm × 45° chamfers and R8 corners. The body stays 156 × 140 mm (162 × 146 over the rail).
  - The 45° rail lip runs round all eight faces.
  - The bus grew to **42 holes** (3 on each diagonal) and **60 detents**.
  - The diamond windows moved in to x ±39.5 so they stay on the straight runs.
- **Ultrasonic on a front bracket (XRP-style):**
  - The transducers now stand in front of the nose, centres **30 mm** off the floor and about **82 mm forward** (the cans' faces), still tilted 5° up.
  - The **sonar bracket** is a plate on the front dock (2 × M3) with two drop arms. The board slides down tilted grooves in the arms, through a slot in the plate, and stands on the groove bottoms. No screws in the board.
  - The JST SH plug goes straight back through a slot in the front wall.
  - The front wall lost its eyes and grooves. The hole band now runs right across the front.
  - The board is now **38.8 mm** from the antenna (rev 3: 15.3).
- **Dock:**
  - The dock cap is gone; the bracket plate does its job.
  - The **arm base stacks on the bracket** (2 × M3 × 12), so the arm sits 3 mm higher. Its floor pose is now **−35.7°**.
- **RoboCore logo:** moved to the top of the bracket plate. On the front wall it would now be hidden behind the sonar.
- **Balance:**
  - The sonar moved forward, so the caster cup moved 4 mm forward (y −40).
  - The ballast rack now takes **6 × M8 nuts**.
  - Caster load: **32 %** without the arm, **23 %** with the arm and 6 nuts.
- **The robot grew about 17 mm longer** at the front (rail to sonar faces: 65 → 82 mm).

## What changed in rev 3 (from rev 2), point by point against the feedback
1. **Own identity, away from the LEGO SPIKE look:** one body (an octagon since rev 4) with a continuous rail lip, a row of round holes and diamond windows. The sonar "face" is on the nose, the RoboCore logo on the sonar bracket, the Plastal-Bot logo on the back. No add-on pods or covers.
2. **Ultrasonic lowered:**
   - The transducer centres went from 50 mm to 35 mm in rev 3, and to **30 mm** on the rev 4 bracket.
   - The board's top edge sits at about 41 mm, **below the 52 mm body line**.
   - It is tilted **5° up**, so the floor stays out of the beam.
   - It slides down tilted grooves and stands on the groove bottoms, with no screws. Seen from the front, TX is on the left.
3. **One unified body, far fewer screws:**
   - Rev 2 needed 29 screws and 21 inserts. The base rev 3 robot needs **9 screws and 7 inserts**:
     - 4 × M2 for the board (kept for IMU rigidity);
     - 1 × M2 per wheel;
     - the battery door's thumb screw (kept, it holds a 154 g pack);
     - 2 × M3 for the sonar bracket.
   - Motors, line sensor and ultrasonic all snap or slide in.
   - The caster is now built into the battery door (its 2 screws are gone).
4. **The body covers the wheels:**
   - **56 mm wheels** (rev 2: 64) run in wells inside the outer wall. The wall covers them from 10.5 to 52 mm, so there are no bumpers or arches.
   - About 4 mm of tyre shows above the rail.
   - Two diamond windows on each side show the RoboCore gear hub.
   - Clearance is 1.3 mm between the wheel and the shaft wall, and 1.2 mm to the outer wall.
5. **Snap-fit motors:**
   - Each motor goes in from above **with its wheel already screwed on**:
     - the shaft slides down a U-slot in the thin shaft wall;
     - the boss ring rides in a 0.4 mm groove;
     - the motor's locating pin drops into its own slot, so the motor can't rotate.
   - **Two hook latches** on the inner wall (slit tongues with a 45° lead-in) click over the gearbox.
   - The gearbox fits between the inner wall and the shaft wall with 0.2 mm clearance over its full height, so it can't tip. The two hooks are enough to hold it down.
   - To remove a motor: unplug it, push both hooks toward the middle, and lift the motor and wheel out together.
6. **Open, see-through and printable:**
   - The top is open: no ring, and the board sits fully exposed.
   - Diamond windows (45° sides) are on all four walls.
   - Floor windows under the motors show the gearboxes.
   - Every overhang is 45° or a short bridge: the rail lip, the hole band, the latch hooks and the sled pocket (a 28 mm bridge). **No supports.**
7. **Mechanical expansion bus**, all on the **8 mm grid** (see [`EXPANSION_BUS.md`](EXPANSION_BUS.md)):
   - a rail lip with a 45° underside and V-detents every 8 mm (58);
   - a Ø4.9 hole row at z 42 through a 6 mm band (33 holes: LEGO Technic pins, M4, or M3 + nut);
   - a front dock with 2 × M3 inserts (sonar bracket, with the arm stacked on top);
   - a **bus-clip template** (hooks under the lip, thumb-screw clamp, M3 insert for your accessory) and a 40 mm **rail coupon** to tune the clip fit on your printer.
8. **Arm module (beginner, 2 servos):**
   - **Lift:** the shoulder SG90/MG90S drives a two-plate yoke. The right plate screws to the horn; the left plate turns on a printed D-pin.
   - **Grip:** an SG90 on the wrist deck drives two geared jaws (module 1.5).
   - The module stacks on the sonar bracket (2 × M3 × 12 into the dock), so the ultrasonic, the wheels and the bus all stay usable.
   - The shoulder sits right above the front edge, so the lowered arm clears the rail and the sonar. The **floor pose is −35.7°** (rev 4): the jaw tips stop 1.9 mm off the floor, 33–70 mm in front of the sonar. The carry pose is +30°.
   - The beam is clear in the raised and carry poses. When lowered, the jaws are in the beam, which helps: drive up on the sonar, then lower the arm.
   - Plug the servos into SERVO 1 (shoulder) and SERVO 2 (gripper).
9. **Other changes:**
   - **Caster:** now part of the battery door, using a **½" (12.7 mm) ball** that passes under the pack.
   - **Battery:** the pack moved 10 mm back, which brings the caster load into the target range. It also puts the pack 22 mm from the antenna.
   - **Ballast rack:** sits behind the pack. It is the pack's rear stop and the roof over the door hinges, and takes M8 nuts to balance the arm (6 in rev 4).
   - **Line sensor:** the board slides into a **sled** that pushes up into the nose pocket and clicks in. The skid is on the sled, and the LED and socket windows stay as in rev 2.

## Checks (rev 4, run with `fusion/checks.py`, last run 2026-10-06)
| Check | Result |
|---|---|
| Interference: each part against its neighbours, boards and motors included | **0 clashes**, arm raised and in the floor pose. Self-test passes: the checker flags the 1S2P spacer against the 1S3P pack |
| Antenna (metal within 15 mm of the ESP32 antenna end) | Closest metal: front board screws at **19.4 mm**. Then pack 22.0, dock inserts 25.1, servo 25.8, ultrasonic 38.8 mm. **Pass** |
| CG / caster / tipping, 1S3P, glass ball, no arm | 441 g, CG (0, −12.8, 26.8) mm, **caster 32 %**. Tips forward only above 0.48 g of braking, sideways above 2.45 g |
| Same, ½" steel ball | 446 g, caster 33 % |
| Same, 1S2P pack | 400 g, caster 28 % |
| **Arm fitted + 6 × M8 ballast nuts** | 508 g, CG (−0.4, −9.0, 31.2), **caster 23 %** (steel ball: 23 %) |
| Arm fitted, no nuts | 477 g, caster **12 %**. Fit the nuts |
| Arm + nuts + 1S2P pack | 468 g, caster 18 % |
| Line sensor | Underside 10.5 mm (allowed 9–13). TCRT5000 faces 3.4 mm off the floor. The skid touches first on a nose-dive (2.9° vs 3.7°) |
| Bed fit (A1 mini, 180 mm cube) | Every part fits. The largest is the chassis at 162 × 146 × 41.5 mm |
| Overhangs in print orientation | No unsupported overhangs in any part |

## Printed parts (masses from the shell/infill model in checks.py)
| Part | Qty | Material / colour (A) | Print orientation (as exported) | Mass |
|---|---|---|---|---|
| Chassis | 1 | PETG teal | floor down | 111 g |
| Line sled (10.5; 9.5 / 11.5 to taste) | 1 | PETG black | upside down | 3.6 g |
| Battery door (with caster cup) | 1 | PETG dark teal | top face down | 9.9 g |
| Wheel | 2 | PETG dark teal | flat inner face down | 8.0 g each |
| Tyre | 2 | TPU 95A black | flat | 4.3 g each |
| Sonar bracket | 1 | PETG dark teal | plate top face down (arms up) | 7.2 g |
| **Base robot** | | | | **156 g** |
| Arm base / Arm / Jaw L / Jaw R | 1 each | PETG dark teal / black jaws | as exported | 8.0 / 7.9 / 1.1 / 1.2 g (18 g) |
| 1S2P spacer | only with a 1S2P pack | PETG any | as exported | 7.4 g |
| Bus clip (template) | as many as you like | PETG black | on its side | 1.4 g |
| Rail coupon (test piece) | 1 | PETG | foot down | 3.6 g |

Print settings:
- 0.2 mm layers, 3 walls, 25 % gyroid (door, wheels and arm 30 %, jaws and clip 40 %).
- **No supports.**
- PETG at 240–250 °C; TPU slow (≤ 25 mm/s).

The base set takes roughly 11–14 h on an A1 mini at standard PETG speeds, the chassis being about 8 h of that. The arm module adds about 1.5 h. These are estimates, so slice to confirm. **Print the rail coupon and one bus clip first** (about 30 min) to check your printer's tolerances.

## Bill of materials (per robot)
| Qty | Part | Where |
|---|---|---|
| 2 | XRP-style TT gearmotor with encoder (SK51D 90:1, 6-pin) + its cable to the board's JST SH 6 | motors |
| 1 each | RoboCore V2 board, RoboCore Ultrasonic, RoboCore Line Sensor | |
| 1 | 1S3P 18650 pack, flat, ≤ 57.5 × 71 × 20.5 mm, BMS ≥ 5 A, XT30 female on a ~90 mm lead from the rear end (or a 1S2P pack + the printed spacer) | battery |
| 1 | **½" (12.7 mm) steel ball** (bearing ball or slingshot ammo, 8.4 g), or a 12.7 mm glass marble | caster in the door |
| 1 | JST SH 4-pin cable, 200 mm (a standard Qwiic cable) | ultrasonic → J403 |
| 1 | JST SH 5-pin cable, 200 mm, straight-through | line sensor → J404 |
| 4 | M2 heat-set insert (Ø3.2 hole) + 4 × M2 × 6 | board pillars (PCB holes 2.2 mm) |
| 3 | M3 heat-set insert, short (Ø4.0 hole) | door screw 1, dock 2 |
| 2 | M2 × 6 self-tapping + M2 washer | wheels to shaft centre holes |
| 1 | M3 × 6 knurled thumb screw | battery door (tool-free) |
| 2 | M3 × 8 | sonar bracket into the dock (M3 × 12 when the arm base stacks on it) |
| 4 | zip ties, 2.5 mm | strain relief at the encoder plugs and the nose |
| **Arm module** | | |
| 2 | SG90 micro servo; **MG90S (metal gears) recommended for the shoulder** | shoulder, gripper (screws and horns come with the servos) |
| 1 | M3 × 12 (self-taps into the deck) | idle jaw pivot |
| 6 | M8 hex nut (about 5.2 g each) | ballast rack, only with the arm |
| 2 | M3 × 12 | arm base + sonar bracket into the dock (instead of the 2 × M3 × 8) |
| **Each bus clip** | | |
| 2 | M3 heat-set insert + 1 × M3 × 8 thumb screw | clamp + accessory mount |

## Assembly
1. **Inserts:** 4 × M2 into the board pillars; 1 × M3 into the front block from below (door screw); 2 × M3 into the tops of the dock towers.
2. **Wheels onto motors:**
   - Fit the tyres; the bead clicks into the groove.
   - Push each wheel onto its shaft and fit an M2 × 6 + washer.
   - Plug the encoder cable into the motor.
3. **Motors in:**
   - Shaft outward, encoder to the back.
   - Lower each motor + wheel straight down. The shaft goes down the U-slot, the pin into its slot and the wheel into its well, until **both hooks click** over the gearbox.
   - Zip-tie the encoder cable at the slots behind the plug.
   - Run the cable forward along the inner-wall saddles (y −28 / −5 / +20) to MOTOR 1/2.
4. **Line sensor:**
   - Slide the board into the sled grooves from the open rear end: TCRT5000s down, LEDs up, JST socket toward the right.
   - Push the sled up into the nose pocket until both bumps click.
   - Plug the 5-pin cable in through the window and route it back to J404.
5. **Ultrasonic:**
   - Fit the bracket to the dock (2 × M3 × 8; M3 × 12 if the arm is going on).
   - Push the 4-pin cable's plug out through the slot in the front wall and plug it into the board's socket.
   - Slide the board down through the bracket plate into the arm grooves (transducers forward, TX on the left seen from the front) until it stands on the groove bottoms.
   - Route the cable back to J403.
6. **Board:** 4 × M2 × 6. Plug in the motors, then the sensors.
7. **Battery (robot on its back):**
   - Snap the ½" ball into the door's cup.
   - Drop the pack in, rear end against the ballast rack. Feed the XT30 lead up the channel in the middle of the rack.
   - Hook the door's rear tongues in, swing the door shut and tighten the thumb screw.
   - With a 1S2P pack, the spacer goes in first.
8. **Arm module (optional):**
   1. Fit the shoulder servo between the base posts (2 tab screws).
   2. Fit the horn so the arm is at **−35.7° (floor) at servo 0°**.
   3. Put the yoke's left plate over the D-pin and screw the right plate to the horn.
   4. Fit the gripper servo on the deck posts. Close the jaws, then fit the driven jaw to its horn and the idle jaw on its M3 × 12.
   5. Set the base on the sonar bracket and bolt both to the dock (2 × M3 × 12). Plug the servos into SERVO 1 and SERVO 2.
   6. **Put the 6 × M8 nuts in the ballast rack.**

**Motor swap:** unplug the motor, push its two hooks toward the middle (a fingertip or the back of a pen), and lift the motor and wheel out. Nothing else comes off.

## Open decisions (for Fred)
1. **Ballast with the arm:** the 6 × M8 nuts are recommended (caster 23 %). Without them the caster carries 12 % and the robot noses onto its skid when braking hard or lifting heavy things.
2. **Sonar out front (rev 4):** the transducers now lead the robot by about 17 mm and nothing guards them. A head-on bump hits the sonar first. A thin printed guard bar on the bracket arms is possible if you want it.
3. **Caster ball:** ½" steel (recommended, slightly more caster load) or a 12.7 mm glass marble. Both pass; 16 mm marbles no longer fit.
4. **First-print tolerance checks:** these are on paper and not yet test-printed. Print the chassis and check:
   - the motor hooks (0.15 mm over the gearbox);
   - the 0.2 mm gearbox fit;
   - the sled bumps (0.4 mm);
   - the sonar groove fit in the bracket (0.15 mm per side);
   - the clip gap (`CLIP_GAP`, tune on the coupon).
   Any change is one number in `rc_params.py`.
5. **Wheel clearances:** 1.3 mm (shaft wall) and 1.2 mm (outer wall). Check them with the real TT shaft's end play.
6. **Size:** 162 mm wide over the rail (rev 2: 147) and 163 mm long from the rear rail to the sonar faces. The body is 52 mm tall to the rail. Check against kit boxes or competition limits.
7. **Shoulder servo:** SG90 is enough (about 0.4 kg·cm needed), but **MG90S** survives students forcing the arm.
8. **SG90 model:** mine is approximate (standard 22.4 × 12.2 mm body, tab holes 27.5 mm apart). Check one real servo against the arm-base posts before printing a batch.
9. **No clips over the wheels** (−25 < y < 25 on the sides): the tyre tops come up inside the rail there.

## Regenerating
In Fusion, with **RoboCore V2 Robot** open, run from the Scripts dialog or through Claude:
```python
import sys; sys.path.insert(0, '<this folder>/fusion')
import build_robot; print(build_robot.main())        # all steps, or main(['chassis_shell', 'chassis_cradle', ...])
build_robot.place_arm(-35.7, 0)                      # pose the arm: angle (deg), jaw opening (deg)
import checks; print(checks.interference()); print(checks.antenna()); print(checks.all_checks()); print(checks.overhangs())
import export; export.print_files(); export.sled_variants(); export.assembly_files(); export.renders(); export.hero()
build_robot.apply_scheme('orange')                     # or 'teal'
```
- **The chassis is built in seven steps** (`chassis_shell`, `_cradle`, `_front`, `_holes`, `_bus`, `_detents`, `_finish`), so each fits in one Fusion call.
- **Long checks** (the full interference run) can outlast one MCP call; `checks.interference(log=path)` writes its progress to a file.
- **Rebuilt parts can come back as "Wheel (1)".** Fusion keeps a deleted part's name reserved until the file is reopened, and the scripts match on the base name, so nothing breaks.
