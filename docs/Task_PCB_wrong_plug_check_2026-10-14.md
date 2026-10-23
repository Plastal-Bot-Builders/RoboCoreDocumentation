# Task: wrong-plug check on the RoboCore V2 controller (2026-10-14)

## Prompt to paste into a chat that works on the PCB

> Read `RoboCore_V2/docs/Task_PCB_wrong_plug_check_2026-10-14.md` and do the wrong-plug check it describes. It's analysis only, so don't change the KiCad project or the PCBWay order. Write the results to `docs/RoboCore_V2_wrong_plug_check.md` and start `docs/RoboCore_V2_errata.md`. Then tell me in plain words what could break, what to do with the prototypes now, and what to change on the next board.

---

## Why
- On the Every Flavor Robotics Discord, EO said to make every connector keyed, or able to survive every way it can be plugged in wrong. EO called that "the first thing I think would cause a failure" in a classroom.
- Fred replied that the sensor headers aren't keyed yet, and that this would go on the errata list.
- alexchunlin separately advised keeping an errata document from day one.

## Ground rules
- **Analysis only.**
  - Don't edit the KiCad schematic or board. Fred edits the board by hand, and KiCad may have it open (lock files).
  - Work on a copy, e.g. a netlist exported with `kicad-cli sch export netlist` into a temp folder.
- **Don't touch the PCBWay order.** On 14 October the prototype order (W836287AS1F11 + T-1F12W836287A) showed "Incomplete Payment". Whether to change the board before paying is Fred's decision. Give him the facts: what a change would involve and how much delay it adds.
- **Use the real netlist.** Read the schematic, and cross-check with `tools/spec_v2.py`. Where they differ, the schematic wins.

## Connectors to check
These are taken from `tools/spec_v2.py` and the board renders. Confirm every pin order against the schematic.

| Ref | What | Type | Keyed? | Pin order (check) |
|---|---|---|---|---|
| J101 | USB-C | USB-C | Reversible | |
| J102 | Battery | XT30 | Yes | +, − |
| J201 | Qwiic | JST SH 4-pin | Yes | GND, 3V3, SDA, SCL |
| J301, J302 | Motors 1 and 2 | JST SH 6-pin | Yes | read from the schematic |
| J403 | Ultrasonic | 1 × 4 pin header, 2.54 mm | **No** | 3V3, TRIG, ECHO, GND |
| J404 | Line sensor | 1 × 5 pin header, 2.54 mm | **No** | 3V3, GND, L, C, R |
| J405–J408 | Servos 1–4 | 1 × 3 pin header, 2.54 mm | No | Signal (IO38/39/35/36), 5.5 V, GND |
| EXP A | Expansion | 1 × 14 female header | No | 3V3, GND, IO7, IO10, IO2, IO40, IO41, IO38, IO39, IO47, RGB, IO3, **VMOT**, GND |
| EXP B | Expansion | 1 × 14 female header | No | 3V3, GND, SDA, SCL, TX, RX, IO35, IO36, IO37, IO1, IO42, EN, **VSYS**, GND |

The board has 330 Ω series resistors (R401–R413) on the header signal lines. **The power pins have no protection.**

## Mistakes to work through
1. **A plug turned round** (rotated 180°) on every unkeyed header.
2. **A plug shifted by one pin.** This applies where the plug can sit off-centre, or two headers sit close enough to straddle. Example: Servo 1 and Servo 3 are stacked on the left edge, and Servo 2 and Servo 4 on the right.
3. **The right cable in the wrong port:**
   - the ultrasonic cable in the line-sensor header, and the other way round;
   - a servo plug in a sensor header;
   - a sensor cable in a servo header (5.5 V reaches the sensor).
4. **Loose jumper wires to a sensor:**
   - VCC and GND swapped;
   - VCC wired to a servo 5.5 V pin instead of 3V3.
5. **Jumper wires on the expansion headers:**
   - VMOT or VSYS touched to 3V3, GND or a GPIO;
   - EN pulled low.
6. **The keyed connectors.** Confirm a JST SH 4-pin plug can't seat in a 6-pin socket off-centre. Check what a home-made battery lead with swapped wires does: the board has back-to-back FETs for reverse polarity (Q103/Q104), so verify that path.

## For each case, record
- The connections that result: which nets meet which pins, the voltages applied and the current paths.
- What happens to:
  - the ESP32-S3 pin (absolute maximum is VDD + 0.3 V; work out the injection current through 330 Ω and check it against the datasheet);
  - the sensor or servo;
  - the 3V3 and VMOT regulators.
- **Severity:**
  - safe;
  - doesn't work, but no damage;
  - damages the sensor or servo;
  - damages the board.
- **Likelihood** in a classroom.

## Parts to look up
- **Ultrasonic:** the component list plans a 3.3 V part, an HC-SR04P or RCWL-1601. The classic HC-SR04 is a 5 V part.
- **Line sensor:** a 3-channel TCRT5000 module with analog outputs, about 60 × 24 mm. Module pinouts vary, so ask Fred for a photo of the one he'll buy.
- **Servos:** MG90S and SG90. Wire colours are brown = GND, red = +, orange = signal. With + in the middle, a reversed servo plug is usually harmless. Confirm this for this board.

## Deliverables
1. **`docs/RoboCore_V2_wrong_plug_check.md`**: one table row per case, then a short summary that lists the worst cases first.
2. **`docs/RoboCore_V2_errata.md`**: a new running errata list, as alexchunlin advised. Start it with:
   - the unkeyed sensor headers and any other risks found here;
   - only GND copper sits under the M2 screw heads. That's fine for now; the note is for the next board;
   - space for bring-up findings: silk mislabels, design errors, manufacturing defects.
3. **What to do with the prototypes now, with no board change:**
   - one-piece polarised housings with a marked edge on the sensor cables;
   - a printed shroud or collar around J403 and J404 (pass this to the Mechanical-Design chat);
   - colour-coded cables;
   - pin-1 marks;
   - first power-up of each sensor on a current-limited bench supply.
4. **Recommendations for the next board:**
   - shrouded or keyed sensor connectors (for example JST PH 2.0 or XH 2.5, or boxed headers);
   - a pin order that lets a straight cable fit the bought-in modules;
   - protection on the sensor power pins: a series PTC or resistor, a TVS, or an ideal diode;
   - a reversal-safe pinout, like the servo's, with power in the middle and GND on both ends, so a turned plug does no harm.
   Give rough cost and space for each.
5. **The change-before-paying question.** List what changing J403/J404 now would involve: re-route, Gerbers, a new quote and audit, adapter cables for the bought-in modules, and the days of delay. That gives Fred what he needs to decide whether to pay for the prototypes as they are.
