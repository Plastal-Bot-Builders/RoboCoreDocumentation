# RoboCore V2 controller: PCBWay re-order notes (2026-10-08)

**Main board only.** The line-sensor and ultrasonic boards are not being ordered (see "What changed" below). 2 fully assembled units, 5 PCBs, turnkey.

**On PCBWay as PCB W836287AS1F11 + assembly T-1F12W836287A (submitted 2026-10-09, both "Subject to audit", all four files attached, Gerber = the labelled 18:42 export, MD5 d954248c…).** History: the 2026-10-07 items (W836287AS1F3 / T-1F4W836287A and the two sensor pairs) were removed on 2026-10-08 (reason "Change the data"); the 2026-10-08 resubmission W836287AS1F9 / T-1F10W836287A carried the unlabelled Gerber and could not be updated on the site, so it was removed on 2026-10-09 and submitted again. Nothing paid.

## What changed since the 2026-10-07 files
1. **Sensor connectors back to 2.54 mm pin headers.** With the two sensor boards shelved, the robot will use bought-in modules again, so J403 and J404 went back to their original headers (the JST SH sockets were only there for our own boards):
   - **J403 ULTRASONIC**, 1×4: **3V3, TRIG, ECHO, GND**. This is the HC-SR04 pin order, so a straight 4-way cable works. Use a 3.3 V-capable module (HC-SR04+, RCWL-1601). hanxia HX PH254-01-04-Z-L11.5, LCSC C52016392.
   - **J404 LINE_FOLLOWER**, 1×5: **3V3, GND, L, C, R**. Hong Cheng HC-PZ254-11.5L-1x5PZ, LCSC C27985190.
   - Positions and routing are the ones the board had before 2026-10-05 (pads at y = 117.3 mm, x from 109.5 and 151.5). The silkscreen labels went back too.
2. **Vias moved out of SMD pads.** PCBWay's review flagged vias in pads. Six routing vias that sat inside pads (C109, C119, J301, SW203, Q102, Q104) were moved next to the pads, or dropped where the top pour already ties the pad to GND (J301 pin 6). The only vias still in pads are the thermal vias built into the IC footprints (U102, U103, U104, U201, U301: 25 vias, 0.2 mm) — see the EQ answers.
3. Assembly counts: **124 SMD, 9 through-hole** (was 126 / 7), 62 BOM lines, 133 parts.
4. **Pin labels (later on 2026-10-08, silkscreen only).** Each servo and sensor header has one white box with its pin names cut out, the names on the 2.54 mm pin pitch (IO38/IO39/IO35/IO36, 5.5V, GND beside the servo pins; 3V3, TRIG, ECHO, GND and 3V3, GND, L, C, R standing above the sensor pins), like the expansion-header labels on the back. The same boxes are on the **back** (mirrored), with the SERVO 1–4 and ULTRASONIC / LINE titles; the back's three test-pad labels (3V3, BAT, GND) moved 0.6 mm closer to their pads to make room. The boxes are filled silkscreen polygons in groups `LABELS_<ref>_F/_B` (made by a script, since KiCad can't put a multi-line text on a 2.54 mm line pitch). Lesson: a Gerber re-uploaded through `member.pcbway.com/order/OrderUploadNew?CartId=<id>` for an item already under audit reaches the DealAfterUpload page but does **not** replace the file (checked by downloading the cart's file). The only way to change files on a submitted item is a fresh submission, or asking Betsy. BOM and CPL are unchanged.

**Checks:** DRC 0 errors, 0 unconnected, schematic parity clean. 14 warnings: the 13 known silkscreen/footprint warnings plus one new courtyard note: J403's courtyard overlaps the M2 hole H103's courtyard by 0.15 mm (the 2.2 mm hole has a bigger courtyard than the 2.0 mm one). Physically the header body is about 1 mm from an M2 pan head; don't use a washer under that screw head.

## Answers to PCBWay's engineering questions (2026-10-08)
| Question | Answer |
|---|---|
| Vias in pads: fill with resin? | **No, don't fill.** The vias in pads are the 0.2 mm thermal vias in the IC exposed pads (standard KiCad footprints), tented on the bottom. All other vias have been moved out of the pads in these files. Resin filling is not worth it for a 2-piece prototype. |
| Solder-mask bridge between IC pads (0.15 mm) | **Option 1: no mask bridge.** The 0.15 mm gaps are U202 (LSM6DSOX, LGA-14 at 0.5 mm pitch). Every other fine-pitch part has ≥0.20 mm. The solder paste stencil defines the joints; ENIG + 0.5 mm pitch without mask webs is routine. |
| The .md files in the assembly zip | Ignore them; this package's assembly zip has only the PDFs and renders. |
| Sensitive parts / temperature | None. Standard lead-free reflow. |
| X-ray | No BGA. Not needed. |
| Functional test | Not needed; we test the boards ourselves. |
| Red "Actual Purchase Mfg Part #" cells | All approved: same parts, PCBWay just wrote the full suffix, e.g. BM06B-SRSS-TB(LF)(SN). |
| SW101 lead time 7–10 working days | Accepted. |

## Files uploaded to W836287AS1F11 / T-1F12W836287A
| File | Where |
|---|---|
| `RoboCore_V2_Controller/RoboCore_V2_Controller_gerbers.zip` (MD5 d954248c…, labelled silkscreen) | PCB and assembly items |
| `RoboCore_V2_Controller/RoboCore_V2_Controller_BOM.csv` (62 lines, 133 parts) | assembly item |
| `RoboCore_V2_Controller/RoboCore_V2_Controller_CPL.csv` (133 placements) | assembly item |
| `RoboCore_V2_Controller/RoboCore_V2_Controller_assembly_drawings.zip` (PDFs + renders, no .md) | assembly item, "other files" |

The PCB "special request" and the assembly notes on the order repeat the EQ answers (no resin fill, no mask bridge on U202), so the reviewer sees them without the email.

## PCB options (unchanged)
4 layers, 68 × 60 mm, FR-4 TG150, 1.6 mm, 1 oz outer and inner, 6/6 mil, 0.2 mm min hole, 0.3 mm vias, green / white, ENIG, tented vias, remove product number, 5 pcs.

## Assembly options
Turnkey, single pieces, top side, 2 units. Unique 61, **SMD 124, BGA/QFP 6, through-hole 9**. No China substitutes. Through-hole parts, soldered from below: XT30 J102, servo headers J401/J402/J407/J408, ultrasonic header J403, line-follower header J404, sockets J405/J406.

## Price (PCBWay quotation of 2026-10-08, 2 units; the 2026-10-09 quote form gave the same $57.43 + $88.00, shipping $34.88, coupon −$30)
| | |
|---|---|
| PCB, 5 pcs | $57.43 |
| Assembly | $88.00 |
| Components (PCBWay's purchase price) | $144.40 |
| **Boards** | **$289.83** |
| FedEx to Zambia, about | $35 |
| Coupon | −$30 |
| **Expected total** | **about $295** |

The component price is about twice our LCSC estimate ($67 + 10 %): at 2 units PCBWay buys minimum packs, so small parts cost $0.3–0.9 each instead of cents (C102 1 µF: $0.89; C103 10 µF: $1.18). The header change takes about $3 off. Not worth fighting at this quantity.

Quotes received and **declined**: line sensor $59.29 (parts $23.79 + assembly $29 + PCB $6.50) and ultrasonic $105.82 (parts $11.32 + assembly $88 + PCB $6.50, CS100A to be supplied by us). Cart items W836287AS1F5 / T-1F6W836287A and W836287AS1F7 / T-1F8W836287A were removed on 2026-10-08.

## Before paying
1. The assembly item shows 2 units, 124 SMD, 9 THT, and the new BOM/CPL file names.
2. The "Actual Purchase Mfg Part #" column still matches our part numbers after the update (J403, J404 are new lines).
3. The placement preview shows J403 and J404 as through-hole headers on the bottom edge.
4. Only the two controller items are in the cart.
5. The Gerber on both items is the labelled version (silkscreen files dated 18:42, MD5 d954248c…); the cart's file link should be dated 26/10/09.

## Mechanical note
The chassis (mech/robot) still has the line-sensor sled and sonar bracket designed for our own boards. Bought-in modules need: a mount for an HC-SR04-size board (45 × 20 mm, pins on the back; the sonar bracket was designed around that size) and a new sled for whichever 3-channel line module is bought.
