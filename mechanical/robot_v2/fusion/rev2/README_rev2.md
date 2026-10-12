# RoboCore V2 robot (XRP-inspired): revision 2, 2026-10-05

![Robot](renders/robot_hero.png)

Revision 2 brings the robot up to date with the new electronics (new main board, our own ultrasonic and line-sensor boards, a 1S3P battery). It also replaces rev 1's flat plates with a finished body: side pods with wheel arches, a bumper ring round the board, and a front "face" with the ultrasonic eyes. Rev 1's scripts, renders and README are kept in `fusion/rev1/` and `renders/rev1/`.

| | |
|---|---|
| Before / after | `renders/before_after_front.png`, `renders/before_after_rear.png` |
| Colour schemes | `renders/schemes/colour_schemes.png` (teal + black, orange + charcoal) |
| Views | `renders/robot_{iso, iso_front, iso_rear, side, top, under_iso}.png`, ray-traced `renders/robot_hero.png` |

## Files
| What | Where |
|---|---|
| Fusion 360 design (cloud) | **RoboCore V2 Robot** in UniPod Project → RoboCore V2. The main board (RoboCore_V2 v2), RoboCore_LineSensor and RoboCore_Ultrasonic are linked from their own files |
| Offline copy | `RoboCore_V2_Robot.f3d` (Fusion archive, 7 MB) and `RoboCore_V2_Robot.step` (the whole robot including the boards, 26 MB) |
| Print files | `print/RoboCore_V2_<part>.stl` / `.3mf`. **Every file is already in its print orientation**, so drop it on the plate as it comes |
| Generator | `fusion/build_robot.py`, with every dimension in `fusion/rc_params.py`. Also `rc_lib.py`, `checks.py`, `export.py` and `view.py` |
| Board CAD | `mech/RoboCore_V2.step` (new, JST SH sockets J403/J404). `mech/CAD/RoboCore_V2.step` now holds the same file |

## What changed (rev 1 → rev 2)
**Electronics brought in**
- **Main board:** the new STEP is in, and the board sits exactly where it did (IMU over the axle midpoint).
  - J403 and J404 are surface-mount JST SH now, so no pin tails are left near the mounting holes. The rear pillars became plain Ø7 columns, and the old Ø5 neck for the J403 pin is gone.
  - The M2 screw heads clear J403 by about 0.8 mm.
  - The 2.2 mm holes need nothing new on the chassis: the M2 inserts sit at the same positions.
- **Ultrasonic (our board):** it now lives in a separate **front bezel**, printed on its own and held by 2 × M3 from underneath.
  - The board stands upright with the transducers forward; seen from the front, TX is on the left and RX on the right.
  - The transducer centres are 50 mm off the floor (the can bottoms at 42 mm). The transducers stand 1 mm proud of the face through bevelled "eye" holes.
  - The JST SH socket points backwards. Its cable drops into the nose and runs back to J403, away from the antenna.
- **Line sensor (our board):** it sits in a pocket under the nose, with its underside **10.5 mm** off the floor. That puts the TCRT5000 faces 3.4 mm up.
  - The height adjusts from 9 to 13 mm with washers.
  - The M3 slots now cover hole spacings of 40–56 mm; ours is 51.6.
  - The JST SH 5 socket has a pass-through hole, and there are **three windows over the green LEDs** so students see L/C/R from above.
  - The bezel's bottom edge is the skid (3 mm off the floor). On a nose-dive it touches before the sensors do.
- **Battery: flat 1S3P 18650 pack** (57 × 70 × 20 mm, 154 g), loaded **from underneath** through a door. A printed spacer holds a 1S2P pack (38 × 70 × 20 mm) instead. To make room, the motors moved out 3 mm per side (your decision): track 124 → 130 mm. The pack can't slide out the back because the two motor encoder plugs leave only about 48 mm between them, hence the bottom door.
  - The door hooks in at the back with two tongues and is held at the front by **one M3 knurled thumb screw**, so no tools are needed. It sits flush with the underside and carries a "1S Li-ion 4.2 V max" marking.
  - The pack sits in Y −52.5 … +17.5, 2.1 mm clear of the encoder plugs. Ribs hold it sideways, and four 45° lugs on the motor walls stop it lifting.
  - The bay floor dropped so the pack's front-top edge stays 16.1 mm from the antenna. Ground clearance under the body is now 10.5 mm (rev 1: 14); only the caster cup, the skid edge and the door's thumb-screw head sit lower.
  - The caster moved behind the pack, from Y −40 to Y −61, to make room for the door.
  - The XT30 lead leaves the pack's rear end and comes up through the rear cable comb to J102: about 80 mm.
- **Cables (JST SH throughout):**
  - **Motors (6-pin):** from the encoder plug up over the motor, forward in the channel under the ring, and out through the front notch to J301/J302.
  - **Ultrasonic (4-pin, a standard Qwiic cable works) and line sensor (5-pin):** from the nose, back along the motor-wall channels under the ring, then up through the **rear cable comb** (slots in the ring at J403/J404) to the sockets.
  - **Strain relief:** zip-tie slot pairs right behind the encoder plugs and in the front block. The fragile SH plugs are never the thing holding a cable.

**Looks**
- **Body:** a 147 × 136 mm rounded rectangle (R10 plan corners) with one flat underside. 0.5–0.6 mm chamfers run on every edge that touches the print bed. R1–1.5 fillets go on the visible edges that print facing up (pod inner edges, bezel back edges).
- **Side pods:** wheel arches (5 mm band, 3.5 mm round the tyre) tie the wheels into the body. They hide the motor cans and encoder boards from the side and come off with 2 screws each. The motor-screw access through the wheel holes still works, because the pods leave the whole wheel opening clear.
- **Bumper ring:** in the contrasting colour. It covers the motors and encoders from above and leaves reachable:
  - the RESET, BOOT and USER buttons, the LEDs, the servo headers and the expansion sockets;
  - USB-C, the XT30 and Qwiic;
  - the ON/OFF lever, which gets its own slot.
  It holds no metal within 15 mm of the antenna.
- **Face:** the ultrasonic cans read as eyes. The RoboCore logo is debossed under them and on both pods, and the Plastal-Bot logo sits on the rear panel above an 11-hole LEGO Technic row.
- **Wheels:** the hub carries the 9-tooth RoboCore gear. The 8 hex-key holes stay, and the outer rim lip now has a 45° underside so the wheel prints with no supports.
- **Colours:** two schemes, see `renders/schemes/colour_schemes.png`. **A: RoboCore teal #78A3AD body + black ring/door/caster, dark teal #64878E wheels** (print the wheels black for a strict two-spool job). **B: orange body + charcoal.** The tyres are black TPU in both.

## Checks (run with `fusion/checks.py`, last run 2026-10-05)
| Check | Result |
|---|---|
| Interference, each part against its neighbours (main board and sensor boards included) | **0 clashes**. The checker was fixed this round and now passes a self-test (it must flag the 1S2P spacer against the 1S3P pack). **Rev 1's "0 interferences" came from the old, broken checker, so it was never properly verified** |
| Antenna (metal within 15 mm of the ESP32 antenna end) | closest metal: pack 16.1 mm, ultrasonic board 17.5 mm, front M2 board screws 19.4 mm. **Pass** |
| CG / caster / tipping, 1S3P pack, glass marble | 458 g total. CG at (0, −12.0, 28.8) mm, slightly behind the axle. **Caster carries 20 %**. It tips forward only above 0.42 g of braking, and sideways only above 2.3 g |
| Same with a 1S2P pack | 417 g, caster 19 % |
| Same with a **16 mm steel ball** | 470 g, caster 22 % (recommended) |
| Line sensor | underside 10.5 mm (allowed 9–13); faces 3.4 mm off the floor; the skid touches first on a nose-dive |
| Bed fit (A1 mini, 180 mm cube) | every part fits (largest: chassis and ring, 113 × 136 mm) |
| Overhangs in print orientation | no unsupported overhangs. Bridges are all ≤ 26 mm, and holes and slots are small. The one flagged face is a 45° bed chamfer on the pod's wheel-well edge, which is fine |

## Printed parts (masses from the shell/infill model in checks.py)
| Part | Qty | Material / colour (A) | Print orientation (as exported) | Mass |
|---|---|---|---|---|
| Chassis | 1 | PETG teal | floor down | 57 g |
| Side pod L / R | 1 + 1 | PETG teal | outer face down | 16.5 g each |
| Front bezel | 1 | PETG teal | face down | 15.5 g |
| Bumper ring | 1 | PETG black | top face down | 19.3 g |
| Battery door | 1 | PETG dark teal | outside down | 8.8 g |
| Wheel | 2 | PETG dark teal | flat inner face down | 10 g each |
| Tyre | 2 | TPU 95A black | flat | 4.9 g each |
| Caster | 1 | PETG black | flange down | 1.8 g |
| 1S2P spacer | only with a 1S2P pack | PETG any | as exported | 6.9 g |
| **Total** | | | | **165 g (172 g with the spacer)**; rev 1 was roughly 86 g |

Settings: 0.2 mm layers, 3 walls, 25 % gyroid (wheels and door 30 %, caster 100 %), **no supports**, PETG at 240–250 °C, TPU slow (≤ 25 mm/s). Estimated print time on an A1 at standard PETG speeds is roughly 11–13 h for one robot set. That's an estimate, so slice to confirm.

## Bill of materials (per robot)
| Qty | Part | Where |
|---|---|---|
| 2 | XRP-style TT gearmotor with encoder (SK51D 90:1, 6-pin) + its cable to the board's JST SH 6 | motors |
| 1 | RoboCore V2 board, RoboCore Ultrasonic, RoboCore Line Sensor | |
| 1 | **1S3P 18650 pack, flat, ≤ 57.5 × 71 × 20.5 mm, BMS ≥ 5 A, XT30 female on a ~90 mm lead from the rear end** (or a 1S2P pack + the printed spacer) | battery |
| 1 | JST SH 4-pin cable, 200 mm (a standard Qwiic cable) | ultrasonic → J403 |
| 1 | JST SH 5-pin cable, 200 mm, straight-through | line sensor → J404 |
| 17 | M3 heat-set insert, short (M3 × 4, Ø4.0 hole) | motor walls 4, caster 2, ring columns 4, pod columns 4, bezel 2, door 1 |
| 4 | M2 heat-set insert (M2 × 4, Ø3.2 hole) + 4 M2 × 6 | board pillars (PCB holes 2.2 mm) |
| 4 | M3 × 25 **button head** ISO 7380 | motors (only 1 mm between the head and the wheel) |
| 4 | M3 × 8 | ring (counterbored) |
| 4 | M3 × 18 socket head | pods to columns (counterbored in the pod side) |
| 2 | M3 × 12 | bezel, from underneath |
| 2 | M3 × 8 | caster, from underneath |
| 1 | M3 × 6 knurled thumb screw | battery door (tool-free) |
| 2 | M3 × 12 + nut + washers | line sensor (washers set the 9–13 mm height) |
| 4 | M2 × 8 self-tapping | ultrasonic board to bezel |
| 2 | M2 × 6 self-tapping + M2 washer | wheels to shaft centre holes |
| 1 | Ø16 mm ball: **steel bearing ball recommended** (caster load 22 %), or a glass marble | caster |
| 4 | zip ties, 2.5 mm | strain relief |

## Assembly
1. **Inserts:**
   - into the chassis: 4 × M3 into the motor walls (from the motor side), 4 × M3 into the column tops, 4 × M3 into the column sides (for the pods), 2 × M3 into the caster bosses (from below), 4 × M2 into the board pillars, and 1 × M3 into the front block (from below, for the door screw);
   - 2 × M3 into the bezel bosses (from below).
2. **Caster:** snap the ball into the cup, then screw it on from underneath (2 × M3 × 8).
3. **Motors:** shaft outward, encoder to the back. Fit 2 × M3 × 25 button heads per motor. Plug the encoder cables in, then zip-tie them to the slots just behind the plugs.
4. **Line sensor:** under the nose with 2 × M3 × 12. Use washers to set the underside to 10.5 mm (a 10.5 mm block under the board on a flat table works as a gauge). Feed its cable up through the hole beside the LED windows.
5. **Ultrasonic:** onto the bezel (4 × M2 × 8), with the transducers through the eyes and TX on the left seen from the front. Fit the 4-pin cable, run it down the bezel's open back, then fix the bezel with 2 × M3 × 12 from underneath.
6. **Cables:** route the sensor cables along the motor-wall channels to the back. Route the motor cables over the motors to the front notches.
7. **Board:** 4 × M2 × 6. Plug in MOTOR 1/2, then ULTRASONIC and LINE through the rear comb.
8. **Battery:** robot on its back. Feed the XT30 lead up through the rear slot, drop the pack in, hook the door's rear tongues in, close the door and tighten the thumb screw. Plug the XT30 in from the top. With a 1S2P pack, the spacer goes in first.
9. **Pods:** 2 × M3 × 18 each, into the columns.
10. **Wheels:** fit the tyres (the bead clicks into the groove), push each wheel onto its shaft and fit an M2 × 6 + washer.
11. **Bumper ring:** 4 × M3 × 8. Check that the ON/OFF lever moves freely in its slot.

Motor swap: remove the ring (4 screws) and unplug the encoder. Then either undo the 2 motor screws through the wheel holes (2 mm hex key), or take off the wheel (1 screw) and pod (2 screws) first.

## Regenerating
In Fusion, with **RoboCore V2 Robot** open, run from the Scripts dialog or through Claude:
```python
import sys; sys.path.insert(0, '<this folder>/fusion')
import build_robot; print(build_robot.main())        # all steps; or main(['chassis', 'chassis_upper', ...])
import checks; print(checks.all_checks()); print(checks.interference()); print(checks.antenna()); print(checks.overhangs())
import export; export.print_files(); export.assembly_files(); export.renders(); export.hero()
build_robot.apply_scheme('orange')                     # or 'teal'
```
- **The chassis is built in six steps** (`chassis`, `chassis_upper`, `chassis_holes`, `chassis_nose`, `chassis_rear`, `chassis_finish`), so that each step fits within one Fusion call.
- **Rebuild a part by deleting it in one call and building it in the next.** Fusion keeps a deleted part's name reserved until the file is reopened, so a part rebuilt in the same session can come back as "Wheel (1)". The scripts match on the base name, so this doesn't break anything.
