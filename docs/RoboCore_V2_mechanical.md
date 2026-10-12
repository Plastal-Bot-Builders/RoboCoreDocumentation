# RoboCore V2 — mechanical brief for the robot chassis (2026-10-05)

## CAD file
- **`mech/RoboCore_V2.step`** (17 MB): board, all 3D component models and the silkscreen (labels and back-side logos). Exported with `kicad-cli pcb export step --user-origin 136.3x91.55mm --subst-models --include-silkscreen`.
- **Origin = centre of the board outline.** +X to the right (servo 2/4 side), +Y towards the ESP32 (top edge), +Z up, with the board bottom at Z ≈ 0 and its top at Z ≈ 1.6 (the stackup layers make it 1.51–1.6). All numbers below use these axes, in mm.
- Fusion 360: Upload or File → Open the .step. If the board comes in standing on its edge, your design is Y-up: rotate it 90° about X, or set Preferences → General → Default modeling orientation to "Z up" before importing.
- Re-export after any board change: re-run the command above from the project folder (see the spec for the kicad-cli path).

## Robot chassis (rev 2, 2026-10-05)
The XRP-inspired robot built round this board is in **`mech/robot/`**; `mech/robot/README.md` has the layout, checks, BOM, print settings and assembly. The Fusion design is "RoboCore V2 Robot" in the RoboCore V2 folder.
- Rev 2 links this board (v2, JST SH J403/J404) and our ultrasonic and line-sensor boards.
- The battery is a flat 1S3P pack loaded through a bottom door; the track is 130 mm.
- The board uses the existing hole positions with M2 inserts, so the PCB holes need to be 2.2 mm.

## Board
| Item | Value |
|---|---|
| Outline | 68 × 60 × 1.6 mm, 4 layers |
| Side notches (servo cables) | 5 mm deep (edge at X ±29 instead of ±34), from Y +5 to Y −10, rounded corners |
| Top edge | Ears at the corners up to Y +30; centre recess at Y +25 between X ±23.2, 45° chamfers to the ears |
| Mounting holes H101–H104 | (−30.50, +26.65), (+30.60, +26.25), (−30.95, −26.80), (+30.85, −26.95). **2.2 mm non-plated holes (M2), changed 2026-10-07** |
| IMU (U202, LSM6DSOX) | (0.00, −0.65), essentially the board centre. +X of the IMU points to the top edge, +Y to the left edge |

## Connectors and controls (positions = part centre)
| Part | Where | Notes for the chassis |
|---|---|---|
| ESP32-S3 module + antenna (U201) | X ±9.05, Y +4.2 to +29.8 | **Antenna overhangs the top recess by 4.8 mm** (still inside the 60 mm envelope). Keep metal, motors, the battery and wires ≥ 15 mm away from the antenna end; no metal above or below it |
| USB-C (J101) | (0, −26.35), front face flush with the bottom edge (Y −30) | Charging port: must stay reachable with the battery fitted |
| XT30 battery (J102) | (−13.90, −26.25), vertical | **Tallest part: 10.7 mm.** Plug goes in from above; leave finger room |
| Motor 1 / Motor 2 (J301 / J302, JST SH 6-pin, vertical) | (−23.30, +19.55) / (+23.30, +19.55) | 4.3 mm tall; small, fragile cables: add a cable clip or strain relief |
| Servo 1 / 3 (J401 / J407) | (−26.60, +4.64) / (−26.60, −4.11) | Male 3-pin, 8.5 mm tall; cables leave through the left notch |
| Servo 2 / 4 (J402 / J408) | (+26.60, +4.64) / (+26.60, −4.11) | Same, right notch |
| Ultrasonic (J403, JST SH 4, vertical) | (−25.90, −25.65), pins in a column | 4.3 mm tall; cable to the front sensor board (changed 2026-10-05) |
| Line follower (J404, JST SH 5, vertical) | (+16.70, −25.15), pins in a column | 4.3 mm tall; cable to the underside sensor board (changed 2026-10-05) |
| Expansion EXP A / EXP B (J405 / J406, 1×14 female) | X −13.70 / +13.70, Y −15.2 to +20.5 | 8.5 mm tall; leave the tops open for jumper wires and add-on boards |
| Qwiic (J201) | (+31.15, +19.65) | 4.3 mm tall |
| ON/OFF slide switch (SW101) | (+32.20, −17.45) | **Lever sticks out ~2 mm past the right edge (X +34)**: the chassis wall needs a slot here |
| RESET / BOOT (SW201 / SW202) | (−6.10, −0.65) / (+6.10, −0.65) | Reachable through a cover hole |
| USER button (SW203) | (+20.00, −13.80) | Reachable through a cover hole |
| RGB + status LEDs (D201, D101–D105) | Top-left corner, around (−31, +19) down to (−31, +8) | Should stay visible |

## Sensor boards (2026-10-05, `docs/RoboCore_Sensors.md`)
| Board | Size | Holes (from its centre) | Notes for the chassis | CAD |
|---|---|---|---|---|
| Line sensor | 60 × 24 × 1.6 mm, front corners chamfered | 2 × M3 at (±25.8, −1.0) | TCRT5000s hang 7 mm below the board at X −16 / 0 / +16, 6 mm forward of the centre; mount the board's underside **9–13 mm above the floor**. Connector on top | `mech/RoboCore_LineSensor.step` |
| Ultrasonic | 46 × 22 × 1.6 mm | 4 × M2 at (±20.5, ±7.5) | Mounts upright at the front, transducers (Ø16 × 12 mm) forward, T left / R right seen from the front; ≥ 4–5 cm above the floor (70° beam); connector on the rear | `mech/RoboCore_Ultrasonic.step` |

Both STEPs have their origin at the board centre (top face up; the transducers / TCRT5000s are on the underside).

## Heights (from the KiCad 3D models, checked on an edge-on render)
- Above the board: XT30 10.7 mm; servo headers and expansion sockets 8.5 mm; JST SH 4.3 mm; USB-C and ESP32 module 3.0 mm; everything else under 3 mm.
- Below the board: only through-hole pin tails, up to **1.5 mm**. The back is otherwise flat (artwork, test pads TP101–105, solder jumper JP101).
- Suggested: ≥ 4 mm standoffs under the board, and ≥ 15 mm clear above it for plugs and cables.

## What the XRP gets wrong, and what RoboCore should do instead
What XRP users report (sources at the end):

| XRP problem | Evidence | RoboCore chassis requirement |
|---|---|---|
| O-ring tyres lose traction on rough or dusty floors; wider silicone tyres rub the frame | XRP forum "New wheels" thread | Real tyre (moulded silicone/urethane, or printed TPU with a retaining lip), ≥ 8 mm wide, and **≥ 2 mm clearance between tyre and frame** so tyre upgrades fit |
| Printed press-fits are tolerance-sensitive | The official print files ship "bigger bore" wheels and a "bigger slot" lifter hook | Wheels clamp to the motor shaft (screw or set screw into a hub), not a printed press-fit bore |
| Robots drift instead of driving straight (5 of 20 in one class) | XRP forum "drifting" thread: the gyro calibrates at power-up and any movement then reads as constant rotation; uneven tyre wear changed the drift direction | Put the **board centre (IMU) directly over the midpoint of the wheel axle**; mount the board rigidly on 4 screws; robot must rest stable at power-up (firmware: LED shows "calibrating, don't touch") |
| AA batteries: bought separately, holder arrived with a bent spring, holder had to be redesigned | SparkFun product page and community forum | Already fixed electrically (1S Li-ion, USB-C charging, reverse/over-voltage protection). Chassis: tool-free battery cradle with a positive latch, low and between the wheels; XT30 lead reaches J102 |
| A new kit had a wheel that would not turn (motor/chassis fault, replaced) | SparkFun community | Motors held by screws so a bad one swaps in minutes; no glued or snapped-in motors |
| Snap-fits needed rework after the beta | SparkFun: "improved snap-fit components" | Snap-fits only for parts assembled once; anything students remove uses screws into heat-set inserts or captive nuts. Structural prints ≥ 20 % infill (XRP's files say 5 %) |
| Wi-Fi/Bluetooth connection complaints | Chief Delphi, XRP forum | Mostly software, but keep the ESP32 antenna in the open (see the antenna note above) |

Also worth designing in (my suggestions, not XRP complaints): one metal-ball caster sized so the deck sits level (keeps the line-sensor height constant); slotted, height-adjustable brackets for the ultrasonic and line sensors; a hole grid for add-ons (for example 8 mm pitch, LEGO Technic compatible); channels and clips for the JST SH motor cables; a clear cover that leaves the buttons, LEDs, headers and USB-C reachable. The back-side logos face the chassis deck when the board is mounted top-up; a window in the deck would show them.

## Decisions before ordering boards
- ~~Mounting holes 2.0 mm~~ **Done 2026-10-07:** 2.2 mm (M2), same positions.
- Motors: J301/J302 take XRP-style motors (JST SH 6-pin with encoder), so the XRP motor and its mount can be the starting point.

## Reference: XRP chassis files
- Open-STEM, V1.0 XRP 3D printing files (3MF, Summer 2023; CAD on request): https://github.com/Open-STEM/V1.0-XRP-3D-Printing-Files. 3MF imports into Fusion as a mesh, useful for comparing sizes.

## Sources
- XRP forum, new wheels: https://xrp.discourse.group/t/new-wheels-for-xrp-robot/701
- XRP forum, drifting: https://xrp.discourse.group/t/weird-problems-with-robot-drifting-in-one-direction/868
- SparkFun community, wheel not moving: https://community.sparkfun.com/t/wheel-does-not-move-on-a-new-experiential-robotics-platform-xrp-kit/69646
- SparkFun XRP kit page: https://www.sparkfun.com/experiential-robotics-platform-xrp-kit.html
- Chief Delphi, XRP Wi-Fi connection: https://www.chiefdelphi.com/t/xrp-wifi-connection/467372
- Trustpilot, XRP kit reviews: https://www.trustpilot.com/review/sparkfun.com/product/experiential-robotics-platform-xrp-kit-69e12de5040ece3520b3b352
