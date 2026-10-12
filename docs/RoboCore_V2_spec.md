# RoboCore V2 — design spec (placement stage, 2026-10-05)

V2 keeps V1's 68 × 60 mm outline, mounting holes, single-cell (1S) Li-ion battery and on-board USB charging. It adds what's needed for an XRP-style robot.

**Decisions (Fred, 2026-10-04):**
- ESP32-S3.
- Motor connectors that match the SparkFun XRP motors.
- Use the XRP's part choices.
- ~~Bottom-side parts may cover the artwork.~~ Changed 2026-10-05: the back stays blank for artwork, so every SMD part is on the top side.

The parts follow the SparkFun XRP Controller. Our circuit is drawn from scratch: SparkFun's design files are CC BY-SA 4.0, so anything copied from them directly would need credit and the same license.

## Block diagram
```
USB-C ──ESD──► ESP32-S3 native USB (one-click upload, no CP2102N)
  │
  └─VBUS─fuse─► MCP73871 charger ──OUT (VSYS)──► power switch (slide SW + P-FET) ──VSYS_SW──► TPS63001 buck-boost ──► 3.3 V
                    │                                                                  └──► TPS61089 EN
                    └─BAT── XT30 ── reverse/over-voltage cut-off (Q103/Q104 + TPS3700) ── 1S Li-ion pack (3.0–4.2 V) ──► Q102 switch ──► TPS61089 boost ──► VMOT 5.5 V ──► DRV8411A + servos
```

## Main parts
| Function | Part | Note |
|---|---|---|
| MCU | ESP32-S3-WROOM-1-N8R2 | Drop-in alternates: N16R2 (best stocked) and N8. Never use R8/R16V modules: their octal PSRAM takes IO35–37 |
| Motor driver | TI DRV8411ARTER (WQFN-16 3×3) | Same as XRP. One chip drives both motors, 4 A peak. Current limit set to **1.0 A** (R301/R302 = 16.5k), the rating of the JST-SH contacts |
| Motor connectors | JST BM06B-SRSS-TB (SH 1.0 mm, 6-pin vertical) | XRP motor plug: 1 M+, 2 M−, 3 3.3 V, 4 Enc A, 5 Enc B, 6 GND |
| IMU | LSM6DSOXTR (LGA-14 2.5×3) | Same as XRP. Alternate: LSM6DSO32TR (same pins and registers). Mounted rotated 90°, so firmware remaps the axes (check with a tilt test) |
| 3.3 V | TI TPS63001DRCR buck-boost (VSON-10 3×3) + Bourns SRN4018-2R2M 2.2 µH | Fixed 3.3 V, up to ~1.2 A from a 1S cell. Holds 3.3 V down to a flat cell (V1's LDO couldn't). Chosen over the TPS63802 because the TPS63802's 2×3 mm package has no stock KiCad footprint |
| Motor/servo rail | TI TPS61089 boost (from V1), VMOT = 5.5 V, Bourns SRP5030CA-2R2M 2.2 µH | 5.5 V keeps SG90-type servos inside their 4.8–6 V range; one resistor change gives 6 V. Q102 (SI7655DN P-FET) disconnects the battery from the boost when the board is OFF |
| Charger | MCP73871-2CCI/ML (from V1) | 1 A charge, power-path, charging works with the switch off. VPCC divider 267k/100k (charging backs off below 4.5 V on USB). SEL via solder jumper JP101: 1-2 adapter mode 1.65 A (default), 2-3 USB mode 500 mA. TE tied high (safety timer off for the large pack). THERM: fixed 10k (no pack thermistor) |
| Power switch | C&K JS102011SAQN right-angle slide switch on the right edge (lever over the edge; slide towards the top edge = ON) | Grounds the gates of P-FETs Q101 (VSYS) and Q102 (boost input), as on the XRP. OFF draws ~0.03 mA |
| USB-C | HRO TYPE-C-31-M-12 + USBLC6-2SC6 ESD (from V1) + SMF5.0A VBUS TVS | Charging and data |
| Battery input protection | Q103/Q104 SI7655DN back to back + TPS3700 window comparator + AO3400A | Cuts the XT30 off if the pack is reversed or above 4.6 V (2S/3S RC packs). Off by default, conducts both ways when the pack is OK, so charging works. Survives up to 4S, reversed up to 3S |
| RGB LED | Worldsemi WS2812B-2020-**V6** | V6 is rated for 3.3 V. The older WS2812B-2020 and most 2020 clones need ≥ 3.5 V, so don't substitute them |
| LEDs | Lite-On LTST-C191 (0603): charging (red), charged (green), USB power (blue), 3.3 V (green), motor power (red) | 1 kΩ resistors (2.2 kΩ on the 5.5 V motor rail) |
| Buzzer | Same Sky CMT-8504-100-SMT (8.5 mm magnetic) + MOSFET driver | Loud, PWM tones |
| Buttons | RESET, BOOT, USER (SMD tactile) | |
| I2C port | Qwiic (JST SH 4-pin) | Same as XRP |

## ESP32-S3 GPIO map
| GPIO | Signal | | GPIO | Signal |
|---|---|---|---|---|
| IO0 | BOOT button | | IO15 / IO16 | Encoder 1 A / B |
| IO1 | IMU INT1 | | IO17 / IO18 | Encoder 2 A / B |
| IO2 | IR right (ADC) | | IO19 / IO20 | USB D− / D+ |
| IO3 | Expansion (strapping pin, keep free at boot) | | IO21 | Motor driver nFAULT |
| IO4 | Battery voltage (ADC, ÷2) | | IO38 / IO39 | Servo 1 / Servo 2 |
| IO5 / IO6 | Motor 1 / 2 current sense (ADC) | | IO40 / IO41 | Ultrasonic TRIG / ECHO |
| IO7 | IR left (ADC) | | IO42 | USER button |
| IO8 / IO9 | I2C SDA / SCL (IMU, Qwiic) | | IO43 / IO44 | UART TX / RX → expansion |
| IO10 | IR centre (ADC) | | IO47 | Buzzer (PWM) |
| IO11 / IO12 | Motor 1 IN1 / IN2 | | IO48 | WS2812 RGB LED |
| IO13 / IO14 | Motor 2 IN1 / IN2 | | IO35 / IO36 | Servo 3 / Servo 4 (also on expansion B) |
| | | | IO37 | Expansion (IO35–37 only exist on modules without octal PSRAM) |

IO45 and IO46 are strapping pins and stay unconnected. All IR inputs use ADC1, which still works when Wi-Fi is on.

## Connectors
| Connector | Type | Pins |
|---|---|---|
| Motor 1, Motor 2 | JST SH 6-pin vertical | M+, M−, 3.3 V, Enc A, Enc B, GND (XRP order) |
| Servo 1–4 | 2.54 mm 1×3 male (1 + 3 on the left, 2 + 4 on the right, as on the XRP) | Signal, VMOT (5.5 V), GND |
| Ultrasonic | 2.54 mm pin header 1×4 (J403; header again since 2026-10-08) | 3V3, TRIG, ECHO, GND: the HC-SR04 pin order, so a straight cable works. Use a 3.3 V-capable module (HC-SR04+, RCWL-1601). hanxia HX PH254-01-04-Z-L11.5, C52016392 |
| Line follower | 2.54 mm pin header 1×5 (J404; header again since 2026-10-08) | 3V3, GND, L, C, R. For a 3-channel TCRT5000-type module with analog outputs. Hong Cheng HC-PZ254-11.5L-1x5PZ, C27985190 |
| Expansion | 2 × 2.54 mm 1×14 female | Spare GPIOs, I2C, UART, the signals above, 3.3 V, VMOT, VSYS_SW (switched battery), GND. Full list below |
| Qwiic | JST SH 4-pin | GND, 3.3 V, SDA, SCL |
| Battery | XT30 (from V1), protected input | 1S Li-ion pack only (silkscreen: "1S 4.2V MAX"). Any capacity: 1S2P / 1S3P / 1S4P packs (cells in parallel) need no board change, see "Battery and runtime" |
| USB-C | 16-pin (from V1) | Charging + programming |

### Expansion header pin order
| Pin | J405 EXPANSION_A | J406 EXPANSION_B |
|---|---|---|
| 1 | 3.3 V | 3.3 V |
| 2 | GND | GND |
| 3 | IR left (IO7) | I2C SDA (IO8) |
| 4 | IR centre (IO10) | I2C SCL (IO9) |
| 5 | IR right (IO2) | UART TX (IO43) |
| 6 | Ultrasonic TRIG (IO40) | UART RX (IO44) |
| 7 | Ultrasonic ECHO (IO41) | Servo 3 (IO35) |
| 8 | Servo 1 (IO38) | Servo 4 (IO36) |
| 9 | Servo 2 (IO39) | IO37 |
| 10 | Buzzer (IO47) | IMU INT1 (IO1) |
| 11 | RGB LED data out (chain more WS2812s) | USER button (IO42) |
| 12 | IO3 | EN (reset) |
| 13 | VMOT 5.5 V | VSYS_SW (switched battery) |
| 14 | GND | GND |

## Layout plan (follows your sketch)
- **Top centre:** ESP32-S3 module, with the antenna over the top edge as on V1. RESET, IMU and BOOT under it.
- **Upper left and right:** Motor 1 and Motor 2 connectors. Top-left corner: RGB LED and the five status LEDs (CHG, FULL, USB, 3V3, MOT). Top-right corner: Qwiic port.
- **Left and right side notches:** Servo 1 + 3 (left) and Servo 2 + 4 (right), as on the XRP.
- **Centre:** the two female expansion headers, side by side.
- **Bottom edge:** ultrasonic header (left), XT30 battery, USB-C (centre), line-follower header (right). The sensor connectors were JST SH sockets from 2026-10-05 to 2026-10-08, for our own sensor boards; they are 2.54 mm headers again now that bought-in modules are used.
- **Bottom right:** USER button, and the ON/OFF slide switch on the right edge (side-actuated: the lever sticks out over the edge).
- **All parts on the top side.** The back carries the artwork (below), plus through-hole pins, test pads TP101–105, solder jumper JP101 (with its legend) and the expansion header pin names (white boxes beside each header, Fred 2026-10-05).
- **Silkscreen (2026-10-05):** V1 style: a line just inside the board edge and straight dividers between the areas. XRP style: white (knockout) boxes with the pin names beside the servo, ultrasonic, line-follower and battery connectors; knockout names on the connectors and buttons; IMU axis arrows (+X towards the top edge, +Y towards the left edge); "ON"/"OFF" at the switch; "1S 4.2V MAX" at the battery. No reference designators on the silkscreen (they stay on the fab layer).
- **Back artwork (2026-10-05):** in the column between the two expansion headers, top to bottom: the RoboCore Zambia logo (24 mm wide), "ROBOT CONTROLLER", "ESP32-S3 · REV 2.0", the Plastal-Bot Builders logo (24 mm), "DESIGNED IN ZAMBIA", "2026". Logos are traced from `technicalreference/*.svg` by `tools/trace_logo.py` into `lib/art/*.json` (one colour: the gear's two blues become solid white; the slit in each "a" of "Zambia" and the b/gear gap are widened to stay open). `tools/artwork.py` places them on B.SilkS, mirrored, as group BACK_ARTWORK; it only touches silkscreen and checks 0.25 mm clearance to exposed copper. The writing is in the `ART` list in that file. `route_pcb.py finish` re-adds it. Thinnest print: the Plastal-Bot robot's lines, 0.17 mm (PCBWay minimum 0.15 mm). 20 tented vias sit under the artwork and leave small dots in the print.
- **Hand edits in KiCad (2026-10-05):** the EXP B pin-name strip and both EXP titles were moved by hand (both strips now sit outside their headers), and icon graphics were added on F.Silkscreen. These live only in `RoboCore_V2.kicad_pcb`: `build_pcb.py` and `route_pcb.py finish` (which starts from the routed copy made before the edits) would drop them.

## Status
- **Schematic (approved 2026-10-04, production changes and servos 3/4 2026-10-05):** 4 sheets, 134 parts. KiCad's netlist matches this spec on all 415 pin connections. ERC: 0 errors, 2 warnings (both on purpose: the IMU address pins are tied to GND). PDF: `docs/RoboCore_V2_schematic_draft.pdf`.
- **Placement (2026-10-05, third pass):** single-sided, 4 servos, XRP/V1-style silkscreen. DRC: 0 errors and 0 silkscreen overlaps; schematic parity clean. Not routed yet: 326 connections open. Renders: `docs/progress/v2_place_*.png`.
- **Sourcing:** `docs/RoboCore_V2_sourcing.md` (Digi-Key and LCSC stock, alternates, and capacitor voltage ratings).
- **Routing (2026-10-05):** 4 layers: F.Cu signals + GND pour, In1.Cu solid GND plane, In2.Cu signals + power areas (VMOT left/right, +BATT along the bottom) + GND, B.Cu signals + GND pour. Autorouted with Freerouting, finished by script (`tools/route_pcb.py`: breakout fan-out vias, A* grid router for the last connections, power-trace widening, via farms, GND stitching, antenna keep-out). DRC: 0 errors, 0 unconnected, schematic parity clean; warnings: U104 enlarged via pad (intended), 4 footprint silk lines at the board edge (trimmed by the fab).
- **Known weak spots:** motor-2 wires (MOTB_P/N) cross the board on 0.3 mm traces for ~35 mm (one on In2): order 1 oz inner copper; USB D+/D- are 61/41 mm with vias (fine for 12 Mbit/s full-speed); several power runs stay 0.3 mm where traces left no room for widening; a few vias sit under white label boxes (cosmetic).
- **Fab notes:** IC thermal vias are 0.2 mm drills (ESP32, DRV8411A, TPS63001, TPS61089, MCP73871 pads); 4-layer 1.6 mm, 1 oz outer, 1 oz inner recommended.
- **Mechanical (2026-10-05):** `mech/RoboCore_V2.step` (origin at the board centre) and `docs/RoboCore_V2_mechanical.md` (positions, heights, keep-outs, XRP lessons for the chassis). Open point: mounting holes are 2.0 mm, too tight for M2.
- **Sensor boards (2026-10-05):** own line sensor (3× TCRT5000) and ultrasonic (CS100A) boards, `docs/RoboCore_Sensors.md`; J403/J404 changed to JST SH on the routed board (DRC 0 errors, parity clean).
- **Order package (2026-10-07):** `fab/PCBWay_V2_2026-10-07/` (ORDER_NOTES.md): 2 assembled units each of the controller, line sensor and ultrasonic. Mounting holes changed to 2.2 mm (M2). Every BOM line has an exact part number (`PASSIVES` / `HEADERS` in tools/spec_v2.py); DRC clean on all three boards.
- **Re-order, controller only (2026-10-08):** `fab/PCBWay_V2_2026-10-08/`. PCBWay quoted the sensor boards at $59 and $106 for 2 units, too much for a prototype, so they were dropped. J403/J404 went back to 2.54 mm headers (routing restored from the 2026-10-05 10:43 backup), six routing vias were moved out of SMD pads after PCBWay's review, and PCBWay's two engineering questions were answered (no resin fill; no mask bridge between U202's 0.15 mm pad gaps). DRC: 0 errors, 14 warnings (one new: J403's courtyard touches H103's by 0.15 mm, harmless). Later the same day: each servo and sensor header got one white silkscreen box with its pin names cut out on the 2.54 mm pin pitch (groups `LABELS_<ref>_F/_B`, filled polygons made by script), repeated mirrored on the back together with the SERVO 1–4 and ULTRASONIC / LINE titles; the back test-pad labels moved to y = 111.1 to make room.
- **Next:** Fred's review of the routing → PCBWay files and the production BOM.
- The schematic is generated by `tools/gen_sch.py` from `tools/spec_v2.py` (the netlist and block layout live in the spec file). `tools/check_nets.py` compares KiCad's netlist with the spec and runs ERC. Once placement starts, edit in KiCad instead.

## Battery and runtime (2026-10-05)
"1S" means one cell **in series** (3.0–4.2 V), not one cell in total. Cells in parallel (1S2P, 1S3P, 1S4P) multiply the
capacity, and so the runtime, with **no change to the board**. The charger's safety timer is already off for big packs
(TE tied high). A series pack (2S/3S) would add no energy for the same cells, and it would need:
- a balancing charger that USB-C's 5 V can't feed simply;
- new regulators;
- a different motor driver (the DRV8411A's 11 V maximum rules out 3S).

The board's over-voltage cut-off rejects series packs on purpose.

Estimate with 3000 mAh 18650 cells (9.7 Wh usable each, down to 3.0 V), everything connected:
- 3.3 V side, about 186 mA: ESP32-S3 on Wi-Fi, line and ultrasonic sensors, encoders, LEDs.
- Converters: 90 % efficient.

| Use | Battery power | 1S1P (1 cell) | 1S2P | 1S3P | 1S4P |
|---|---|---|---|---|---|
| Bench / coding: Wi-Fi on, wheels still, servos holding | 0.9 W | 10.9 h | 21.9 h | 32.8 h | 43.7 h |
| Class activity: driving half the time (~0.35 A per motor), arm moving now and then | 3.4 W | 2.8 h | 5.7 h | 8.5 h | 11.3 h |
| Non-stop hard driving: both motors ~0.5 A, all four servos busy | 8.6 W | 1.1 h | 2.3 h | 3.4 h | 4.5 h |
| Charge time at the charger's 1 A (USB-C) | | ~3.6 h | ~6.6 h | ~9.6 h | ~12.6 h |
| Pack weight (cells + protection board) | | ~58 g | ~106 g | ~154 g | ~202 g |

**Recommendation:** 1S2P for most classes (a school day of activity, charges overnight); 1S3P for long sessions or
competitions. Buy a ready-made 1S pack with its own protection board (BMS, ≥5 A) and an XT30 lead, or build one from
matched cells at the same charge; never parallel cells at different voltages. For comparison, the XRP's 4×AA NiMH
pack (~9.6 Wh) is about one 18650. The motor currents are estimates for XRP-type gear motors: measure them on the
prototype (VBAT_SENSE on IO4 and the DRV8411A current outputs on IO5/IO6 make that easy) and update the table.

## Design review (2026-10-04): external review checked against the datasheets
| Review point | Verdict | Evidence | Action |
|---|---|---|---|
| GPIO35-37 not usable on ESP32-S3-WROOM-1-**N8R2** | Not correct for N8R2 | Espressif WROOM-1 datasheet, pin table note: only modules with **Octal** PSRAM (ESP32-S3R8 / R16V) use IO35-37. N8R2 has 2 MB **Quad** PSRAM | Kept IO35-37 on expansion B. Note on the schematic: do not substitute an R8/R16V module |
| MCP73871 VPCC tied to IN is "incorrect" | Partly right | Datasheet 3.3: "This feature can be disabled by connecting the VPCC pin to IN" (so it was valid), but the divider makes charging back off when a weak USB source sags | **Added** R104 267k / R121 100k: 1.23 V x 3.67 = 4.51 V. The review's 330k/110k (4.92 V) is for a 5.5 V +/-0.5 V adapter and would throttle normal USB (4.75 V min) |
| SEL high = adapter mode on a USB-C input | Valid concern | Datasheet 3.4: SEL high = 1.65 A input limit; SEL low + PROG2 high = 500 mA USB limit | **Added** solder jumper JP101 on SEL. Default 1-2 keeps the 1 A charging (fine on chargers; the VPCC divider protects weak ports). Bridge 2-3 for strict 500 mA USB mode |
| THERM: fixed 10k instead of an NTC | Deliberate | 50 uA x 10k = 0.5 V, inside the 0.25-1.24 V window, so temperature monitoring is effectively off. The XT30 pack has no thermistor wire | No change; noted on the schematic |
| PROG1 1k = 1 A, TPS63001, TPS61089 5.5 V, DRV8411A, reset/boot | Agree | 1.212 V x (1 + 300k/84.5k) = 5.51 V; DRV8411A VM 1.65-11 V | No change |
| IMU "CS -> GND" | Misread | The schematic has CS -> +3V3, which is correct (CS high = I2C). CS low would select SPI | No change |
| Encoders affected by the PSRAM pins | Not affected | Encoders are on IO15-18 | No change |
| IO42 (USER) is a JTAG pin | Not a conflict | The S3 debugs over its built-in USB-JTAG on IO19/IO20 by default; IO39-42 JTAG is only used if an eFuse selects it | No change |

Other changes in the redraw: TE now ties straight to +5V_USB (same behaviour as the old 10k pull-up, one part fewer); USBLC6 channel pins 1/6 and 3/4 swapped (each pair is the same line through the chip, so the circuit is unchanged and the drawing reads left to right).

## Production review (2026-10-05)
| Change | Why |
|---|---|
| Q102 SI7655DN P-FET in front of the TPS61089 | When disabled, the boost IC still passes the battery through its inductor and body diode, so VMOT sat at ~VBAT with the switch OFF (servos and motor driver powered). Q102 now cuts the battery off, driven by the same switch |
| Motor current limit 1.0 A (R301/R302 16.5k, was ~1.5 A) | JST-SH contacts are rated 1 A. ITRIP = 3.3 V / (16.5k × 200 µA/A) = 1.0 A |
| 330 Ω series resistors R401–R413 on 13 header GPIOs | Protect the ESP32 pins from shorts and wiring mistakes on the servo, ultrasonic, line-follower, expansion and UART pins |
| D106 SMF5.0A TVS on VBUS | Surge and hot-plug protection on the USB input |
| Slide switch → C&K JS102011SAQN | The earlier PCM12 is obsolete; the JS102011SAQN is stocked at Digi-Key (54k) and LCSC |
| WS2812B-2020 → WS2812B-2020-V6 | The old part is no longer stocked and isn't rated for 3.3 V; V6 is (3.3–5.3 V) |
| Boost inductor → Bourns SRP5030CA-2R2M | Rated for the boost's current, stocked, and has a 3D model |
| Small passives 0402 | Fit every part on one side |
| All SMD on the top side | One stencil and one reflow pass; the back stays blank for artwork |
| Servos 3 and 4 (J407/J408 on IO35/IO36, C402 bulk cap) | Same servo count as the XRP. IO35/IO36 were spare expansion pins; they stay on expansion B pins 7/8, as servo 1/2 are on expansion A |
| Slide switch moved to the right edge | The JS102011SAQN is side-actuated; its lever must hang over a board edge. Datasheet: lever towards terminal 3 joins 2–3 (PWR_EN_N to GND) = ON, which is the top end as mounted |
| Battery input protection (Q103/Q104, U105 TPS3700, Q105, D107) | XT30 is also the plug on 2S/3S RC LiPo packs; a beginner could plug one in, or wire a pack backwards. The cut-off is off until the pack is checked (~40 ms) |
| Expansion pin names on the back | No room beside the headers on top |
| 3D models for every part | Models from LCSC/EasyEDA in `lib/3d/`, plus KiCad stand-in models for TI and Vishay packages |

## Still to confirm
- Fred's OK on the arrangement and silkscreen style (then routing).
