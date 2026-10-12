# RoboCore V2 robot (XRP-inspired) — chassis design, 2026-10-05

![Robot](renders/robot_iso.png)

## Files
| What | Where |
|---|---|
| Fusion 360 design (cloud) | **RoboCore V2 Robot** in UniPod Project → RoboCore V2 (the PCB and HC-SR04 are linked from your existing files) |
| Offline copy | `RoboCore_V2_Robot.f3d` (Fusion archive), `RoboCore_V2_Robot.step` (whole robot incl. PCB, 20 MB) |
| Print files | `print/RoboCore_V2_<part>.stl` and `.3mf` for Chassis, Wheel, Tyre, Caster, Front skids |
| Renders | `renders/robot_*.png` (iso, front, rear, side, top, underside) |
| Generator | `fusion/build_robot.py` (+ `rc_params.py` = every dimension, `rc_lib.py`, `checks.py`, `export.py`, `view.py`) |

The design is built by script, like the PCB. Change a number in `fusion/rc_params.py`, then re-run the build (see "Regenerating") instead of editing the Fusion timeline by hand. Hand edits in Fusion are fine too, but a rebuild would wipe them.

## Layout (robot frame: X right, Y forward, Z up, origin on the floor under the axle centre)
- **Board centre = IMU = directly over the middle of the wheel axle**, as the brief asked. The board sits the way its silkscreen reads: ESP32 antenna to the front, USB-C and XT30 at the back, MOTOR 1 on the left, MOTOR 2 on the right. The IMU's +X then points forward and +Y to the left, which is the usual robot frame, so the firmware needs no axis remap for driving.
- **Size:** 137 mm wide over the wheels, 136 mm long (rear edge of the floor to the ultrasonic cans), 60 mm tall to the top of the sensor plate. The board's top face is at 47.6 mm.
- **Wheels:** Ø64 mm TPU tyres on Ø54 mm rims, track 124 mm. Axle 32 mm above the floor.
- **Motors** sit outside the board footprint, bolted to two inner walls. Nothing is cantilevered over them, so the chassis prints with no supports. The shaft is at Y = 0. The gearbox runs forward to Y +16, and the motor and encoder run back to Y −62.
- **Battery:** one 18650 in a standard 1-cell holder. It lies in a tunnel between the motors, under the board (Y −66 to +12), slides in from the back and is held by a snap latch.
- **Ground contact:** two wheels and one Ø16 mm ball caster at Y −40, so the robot always stands on three points and the line sensor height stays constant. Centre of gravity: 14 mm behind the axle and 30 mm up, computed from each part's centroid with estimated masses (about 270 g in total). That puts a third of the weight on the caster. Tipping forward would take a 0.46 g stop, and the skids catch it if it happens.
- **Front:** the HC-SR04 sits behind a face plate with "ROBOCORE" engraved under it. The line sensor goes under the nose in universal slots. Two skids sit 3 mm off the floor and catch a nose-dive before the line sensor touches the ground.
- **Antenna:** the nearest metal is the HC-SR04 board, 15.6 mm in front of the module end. The battery is 17.6 mm away and the motors more than 25 mm. Only plastic is closer.

## What the XRP gets wrong → what this chassis does
| XRP problem | RoboCore V2 robot |
|---|---|
| O-ring tyres slip; wider tyres rub the frame | Real TPU tyre, 10 mm wide, with 40 tread grooves. A bead on the rim locks into a groove in the tyre, and flanges stop it walking off. About 4 mm between the tyre and the motor, 6 mm to the chassis |
| Printed press-fit wheel bores need "bigger bore" variants | Double-D bore with clearance (5.5 / 3.8 mm). An M2 screw and washer go into the TT shaft's centre hole, so it clamps rather than press-fits |
| Robots drift; the gyro calibrates while moving | IMU directly over the axle midpoint. The board is held by 4 screws on rigid pillars, and the 3-point stance doesn't rock at power-up |
| AA holder with bent springs | 1S 18650 with USB-C charging (board). Tool-free cradle with a snap latch: press the hook and pull the holder out the back |
| Glued or snapped-in motors; a dead wheel means a dead kit | Each motor is held by 2 × M3 screws into heat-set inserts. 8 holes in each wheel line up with the motor screws, so a motor comes out with a 2 mm hex key without removing the wheel |
| Snap-fits needed rework | Every part students remove is held by screws into heat-set inserts. The only snap-fits are the caster ball (fitted once) and the battery latch (PETG, about 2 % strain) |
| Wi-Fi complaints | Antenna in the open with 15 mm or more to metal (see above) |
| Low 5 % infill in the XRP files | Print settings below specify 25 % |

Also built in: cable channels under the deck with 4 zip-tie points, and 8 LEGO Technic holes (Ø4.9 mm on an 8 mm pitch) at the back for add-ons. The line sensor slots take any module with hole spacing from 16 to 44 mm. Nothing needs supports to print.

## Bill of materials (per robot)
| Qty | Part | Notes |
|---|---|---|
| 2 | XRP-style TT gearmotor with encoder (SK51D 90:1, 6-pin) | Model: `mech/CAD/DC_Gear_Motor_with_Encoder.step`. Any standard TT gearbox fits the same holes |
| 4 | M3 × 25 **button head** ISO 7380 | Motor to wall. Must be button head (head ≤ 1.7 mm): there is only 1 mm between the head and the wheel |
| 6 | M3 heat-set insert, short (M3 × 4, Ø4.0 hole) | 4 for the motors, 2 for the caster |
| 2 | M3 × 8 | Caster, from below |
| 4 | M2 heat-set insert (M2 × 4, Ø3.2 hole) + M2 × 6 | Board to pillars. **Needs the PCB holes at 2.2 mm** (see decisions) |
| 2 | M2 × 6 self-tapping + M2 washer | Wheel to shaft centre hole |
| 4 | M2 × 6 (or M1.7) self-tapping | HC-SR04 to plate (Ø1.6 pilots) |
| 2–4 | M3 × 10 + nut + washers | Line sensor in the nose slots. Use washers to set the sensor face 3–5 mm above the floor |
| 2 | M3 × 12 self-tapping | Front skids, from above through the nose slots |
| 1 | Ø16 mm ball (glass marble or steel ball) | Snaps into the caster cup |
| 1 | 1-cell 18650 holder with leads, max 21 × 77 × 20 mm, + protected 18650 cell + XT30 **female** plug | Lead about 90 mm to J102 |
| 1 | HC-SR04, 1 Funduino 3-channel line module | |
| 4 | Zip ties 2.5 mm | Motor and sensor cables on the deck |

## Printing (Bambu A1 / P1 / P2S; every part fits an A1 mini bed)
| Part | Material | Orientation | Notes |
|---|---|---|---|
| Chassis | **PETG** (the battery latch flexes) | Floor down, as exported | 0.2 mm layers, 3 walls, 25 % gyroid, no supports |
| Wheel × 2 | PETG or PLA | Flat inner face down, as exported | 3 walls, 30 % |
| Tyre × 2 | TPU 95A | Flat, as exported | 2 walls, 15 % gyroid or solid. Stretch over the flange, the bead clicks into the groove |
| Caster | PETG | **Flip so the flange is on the bed** | 100 %; the slits let the ball snap in |
| Front skids | PETG/PLA | **Flip so the flat end is on the bed** | 100 % |

Estimated printed mass: chassis about 47 g, wheels 2 × 8 g, tyres 2 × 9 g, caster and skids about 5 g.

## Assembly
1. Heat-set inserts: 4 × M3 into the motor walls from the motor side, 2 × M3 into the caster bosses from underneath, 4 × M2 into the board pillars.
2. Push the 16 mm ball into the caster cup until it snaps in. Screw the caster under the floor with 2 × M3 × 8.
3. Motors: shaft outward, encoder to the back, inner face flat against the wall. Fit 2 × M3 × 25 button heads through the gearbox holes into the inserts.
4. Wheels: stretch the tyre on, push the wheel onto the shaft, then fit M2 × 6 self-tapping + washer into the shaft centre.
5. Front: push the HC-SR04 in from behind with the pins down, cans through the holes, and fit 4 screws. Mount the line sensor under the nose using the slots, with the header through the centre hole. Fit the skids with M3 × 12 from above.
6. Cables: route the motor leads up behind the deck and forward on top of it (zip ties), to MOTOR 1 (left) and MOTOR 2 (right). Route the ultrasonic and line leads through the channels under the deck to the back, then up to ULTRASONIC and LINE.
7. Battery: slide the holder in from the back until the hook clicks. Bring the XT30 lead up behind the board.
8. Board: 4 × M2 × 6 into the pillars, then plug the XT30 in from above. USB-C stays reachable at the back for charging.

## Decisions I made: please confirm or change
1. **Battery = one 18650 cell**, not the 2-cell parallel pack from V1. A single cell is lighter, cheaper per kit, charges in about 3 h at the board's 1 A, and stores about as much energy as the XRP's 4 × AA. A 2-cell holder (41 mm wide) also fits between the motor walls. That needs `BATT_HALF_IN = 21` and moving the caster screws out (`CASTER_SCREW_X = 27`), and the encoder plugs would then only clear the holder by about 1 mm. Check that with a real holder first.
2. **Board mounting holes:** the pillars take M2 inserts at the PCB's current hole positions, so the positions don't need to change. The PCB holes do need to go from 2.0 to **2.2 mm** before ordering, or M2 screws won't pass.
3. **Motor:** designed around the blue XRP-style motor (Type Two, the STEP you supplied). The yellow DFRobot FIT0458 (Type One) uses the same TT gearbox holes, so it should bolt on, but its encoder end is different. Check one before buying in bulk.
4. **Line sensor:** I couldn't find a drawing of the exact Funduino module, so the model is a placeholder (42 × 13 mm). Send me the board size and hole spacing, or a photo with a ruler, and I'll check the fit.
5. **HC-SR04 height is fixed** (centre 47 mm). The line sensor height is adjustable with washers. The ultrasonic can get slotted holes if you want it adjustable too.
6. Colours: orange chassis, light-grey wheels, black tyres (Zambian flag orange). Purely visual.

## Not done yet (good next steps)
- A servo arm like the XRP's lifter, using the 4 servo ports. An SG90 bracket would bolt to the LEGO holes or the nose plate.
- A clear top cover. Leave the buttons, LEDs, headers and USB-C reachable.
- Print a test set and check the real fits: inserts, the tyre bead, the ball snap and the latch feel.

## Regenerating
In Fusion, open **RoboCore V2 Robot**, then run this (Utilities → Scripts, or via Claude):
```python
import sys; sys.path.insert(0, '<this folder>/fusion')
import build_robot; print(build_robot.main())            # all steps
import export; export.print_files(); export.assembly_files(); export.renders()
import checks; print(checks.interference(skip_prefixes=('RoboCore_V2',)))
```
Steps can be run on their own, e.g. `build_robot.main(['chassis'])`. Each step deletes and rebuilds its own component. To start fresh, clear the timeline first. A rebuilt component can come back named "Wheel (1)" until the document is saved and reopened.
Checks at the time of writing: **0 interferences** between the chassis, motors, wheels, tyres, caster, battery, skids, line sensor, HC-SR04 and the RoboCore V2 board.
