# RoboCore sensor boards: line sensor and ultrasonic (2026-10-05)

> **Status 2026-10-08: shelved.** PCBWay quoted 2 assembled units at $59.29 (line sensor) and $105.82 (ultrasonic, with the CS100A to be supplied by us), too much for a prototype. The designs stay here for a later batch; the controller's J403/J404 are 2.54 mm headers again, for bought-in HC-SR04-type and 3-channel line modules (`docs/RoboCore_V2_spec.md`).

Our own versions of the two bought-in sensors, so the robot no longer depends on whichever module a shop happens to
sell. Both plug into the RoboCore V2 with JST SH cables, like the motors. Both pass DRC with 0 errors, 0 warnings and 0
unconnected items, and match their schematics.

| | Line sensor | Ultrasonic |
|---|---|---|
| Project | `sensors/line_sensor/RoboCore_LineSensor.*` | `sensors/ultrasonic/RoboCore_Ultrasonic.*` |
| Board | 60 × 24 mm, 2 layers, 1.6 mm, front corners chamfered (like the Funduino) | 46 × 22 mm, 2 layers, 1.6 mm (HC-SR04 size) |
| Mounting | 2 × M3, 51.6 mm apart | 4 × M2 at (±20.5, ±7.5) mm from the centre |
| Main parts | 3 × Vishay TCRT5000, LM339, 3 green LEDs | CS100A ranging chip, 8 MHz crystal, 40 kHz TX + RX transducers |
| Connector | JST SH 5-pin, vertical, top side | JST SH 4-pin, vertical, rear side |
| Pins | 1 GND, 2 3V3, 3 L, 4 C, 5 R | 1 GND, 2 3V3, 3 TRIG, 4 ECHO |
| Supply | 3.3 V, ~45 mA | 3.3 V, 5.3 mA (CS100A manual) |
| 3D / CAD | `mech/RoboCore_LineSensor.step` | `mech/RoboCore_Ultrasonic.step` |
| BOM | `sensors/line_sensor/RoboCore_LineSensor_BOM.csv` | `sensors/ultrasonic/RoboCore_Ultrasonic_BOM.csv` |
| Renders | `docs/progress/sensors/line_sensor_*.png` | `docs/progress/sensors/ultrasonic_*.png` |

STEP origin is the board centre. KiCad-board coordinates: centre (100, 100).

## Look and part numbers (2026-10-07)
**Artwork:** both boards now share the main board's visual language, drawn by `tools/sensor_art.py` (group SENSOR_ARTWORK, replaced on each run):
- an outline 0.6 mm inside the edge, which breaks around pads and lettering;
- straight dividers;
- white knockout labels;
- logos and icons traced from `technicalreference/` by `tools/trace_logo.py`.

**Line sensor:**
- Corners: rounded R3, with R2 at the chamfer ends.
- Top: three channel cells with L / C / R boxes, the RoboCore logo, a "LINE SENSOR" title with the golem icon, and v1.0. C1/C2 moved between the LM339 and the connector to make room.
- Underside: the Plastal-Bot logo and L / C / R boxes.

**Ultrasonic:** Fred's hand edits are kept: R3 corners, the RoboCore logo on the front, the Plastal-Bot logo on the rear. The script added:
- the inner outline on both faces;
- an "ULTRASONIC" title box with the speaker icon, and v1.0;
- T / R tabs on the front.

The ECHO pin box moved 0.66 mm back off LS1's pad.

**Part numbers:** every part has an exact part number and LCSC code, from `PASSIVES` / `HEADERS` in `tools/spec_v2.py`, shared by all three boards. `tools/sync_pcb.py` copies schematic fields onto an existing board without re-routing.

**Order files:** `fab/PCBWay_V2_2026-10-07/`, made by `tools/fab_export.py`.

## Connectors and cables (main board change)
- **Main board:** J403 (ultrasonic) and J404 (line follower) were 2.54 mm headers. They are now **JST SH vertical (BM04B / BM05B)**, the same family as the motor and Qwiic sockets. The change was made on the routed board: the new pads were routed to the existing tracks, the old stubs were trimmed, and a via kept the 3.3 V path that used to pass through the old J403 pin.
- **Main-board DRC after the change:** 0 errors, 0 unconnected, schematic matches. The 8 silkscreen-overlap warnings that remain came in with the 12:29 KiCad save, before this change.
- **No wrong-socket plugging:** motors use 6 pins, the line sensor 5 and the ultrasonic 4. The ultrasonic shares the 4-pin size with Qwiic, but its first two pins are the same (GND, 3V3), so plugging it into the Qwiic port, or a Qwiic part into the ultrasonic port, does no harm.
- **Cables:** JST SH 1.0 mm, pin 1 to pin 1 (the same as Qwiic cables). A standard 4-pin Qwiic cable works for the ultrasonic. For the line sensor, use a 5-pin SH cable of the same straight-through type.
- **Pin labels:** the sensor connectors on the main board now have white pin-name boxes beside the pins: GND, 3V3, TRIG, ECHO and GND, 3V3, L, C, R.

## Line sensor
**How it works.** Each TCRT5000 shines IR at the floor.
- Over white, the phototransistor conducts and its output drops below about 0.3 V.
- Over the black line, little light returns, and the 10k pull-up takes the output to about 2.8 V.

The robot reads the three voltages directly on its ADC pins: IO7 = L, IO10 = C, IO2 = R. A program can therefore calibrate to any floor, which is better than the Funduino's on/off outputs.

An LM339 also compares each channel with 1.65 V and lights that channel's green LED when the sensor is over the line. Students can see what the sensor sees before writing any code.

**Values:**
- IR LEDs: 150 Ω, about 14 mA each.
- Pull-ups: 10k. White still reads below 1.65 V at 12 mm; black reads about 2.8 V.
- Indicator LEDs: 680 Ω, about 1.5 mA.

**Mounting:**
- The TCRT5000 bodies are on the underside and stand 7 mm proud of the board. Their best distance is 2.5 mm; they work from 0.2 to 15 mm.
- Mount the board with its **underside 9–13 mm above the floor**, so the sensor faces are 2–6 mm up.
- The sensors are 16 mm apart, suited to 19 mm electrical tape: the centre sensor sits on the line and the side ones on its edges.
- L/C/R are as seen from above with the chamfered edge forward. The underside silkscreen is mirrored so it reads correctly from below.

**Assembly:** all SMD parts are on the top. The three TCRT5000 are through-hole, pushed in from the underside and soldered on top.

## Ultrasonic
**How it works.** This is the CS100A manual's reference circuit (V2.0, figure 4):
1. TRIG high for more than 10 µs (50 µs recommended) sends 8 pulses at 40 kHz.
2. ECHO then stays high for the round-trip time: distance = ECHO time × 340 m/s ÷ 2, about 58 µs per cm.
3. With nothing in range, ECHO stays high for about 33 ms. Leave at least 50 ms between pings.
4. Range is 2 cm to about 4 m. The manual claims up to 5.6 m and ±(0.3 cm + 1 %).

Existing HC-SR04 code works unchanged: XRP, Arduino NewPing or MicroPython.

**Parts:**
- R1 3.3 Ω with C1 10 µF keeps the transmitter's current pulses off the robot's 3.3 V rail.
- Y1: 8 MHz crystal, 12 pF load, with 18 pF caps.
- R3 100k holds TRIG low when no cable is plugged in.
- PD is tied low (always on); BLIND2 is unused.

**Tuning R2 (15 MΩ):** the manual allows 5.1–22 MΩ.
- Lower it if far readings jump to tens of centimetres.
- Raise it for more range.
- TP1 (AMP) and TP2 (COMP) bring out the amplifier and comparator test outputs, so a scope shows the echo while tuning the prototype.

**Orientation:** the transducers face forward from the underside of the board. Seen from the front, **T is on the left and R on the right**, as on an HC-SR04. The connector is on the rear face, so the cable runs straight back into the robot.

**Mounting:**
- The transducers spread wide: the datasheet gives 70° ±5° at −6 dB.
- Mount the board at least 4–5 cm above the floor, or tilt it up a few degrees, so the floor doesn't return echoes.

**Sourcing (the one catch):**
- The CS100A is not at LCSC. Buy it from AliExpress or Alibaba (it is used in the Keyestudio SR01 and similar modules) and consign it to PCBWay.
- Everything else is at LCSC, including the transducers: HYDZ HY40A16T12-1 (C17701106) and HY40A16R12-1 (C17701107), about $0.22 each.

## Parts at LCSC (2026-10-05)
| Part | MPN | LCSC | Stock seen |
|---|---|---|---|
| Reflective sensor | Vishay TCRT5000 (alt. TCRT5000L, long leads) | C2984661 (alt. C24085) | 3,720 (4,299) |
| Comparator | JSCJ LM339, SOP-14 (alt. TI LM339DR) | C2829428 | 15,360 |
| Green LED | Lite-On LTST-C191KGKT (as on the main board) | C125098 | — |
| 40 kHz transmitter / receiver | HYDZ HY40A16T12-1 / HY40A16R12-1 | C17701106 / C17701107 | 1,351 / 480 |
| 8 MHz crystal, 3225, 12 pF | HCI XC32M4-8.000-F12LJDT | C2842191 | 42,650 |
| JST SH 5 / 4-pin vertical | BM05B-SRSS-TB / BM04B-SRSS-TB | C160391 / C160390 | — |
| Ranging chip | CS100A (SOP-16) | not stocked: AliExpress / Alibaba | — |

Resistors and capacitors are generic 0603/0805 values. Their MPNs go in with the main board's production BOM pass.

## Regenerating
```
python3 tools/make_parts.py                                    # TCRT5000 / CS100A / LM339_QUAD / transducer symbols + footprint
RC_SPEC=spec_line RC_OUT=sensors/line_sensor RC_PROJECT=RoboCore_LineSensor python3 tools/gen_sch.py   # then check_nets.py, same env
RC_SPEC=spec_us RC_OUT=sensors/ultrasonic RC_PROJECT=RoboCore_Ultrasonic python3 tools/gen_sch.py
<KiCad python> tools/build_sensor.py line|us [place]           # place, Freerouting, GND pours, stitching
```

**TCRT5000 pin numbers:** the datasheet only labels the pins by function. KiCad's footprint was matched by geometry: pads 3/4 sit at the chamfered (emitter) end, giving 1 C, 2 E, 3 K, 4 A. **Check this on the first prototype** before a production run.
