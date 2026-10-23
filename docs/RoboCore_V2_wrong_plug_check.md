# RoboCore V2 controller: wrong-plug check (2026-10-14)

Analysis only. Nothing in the KiCad project or the PCBWay order was changed.

- **Netlist:** exported with `kicad-cli sch export netlist` from a copy of the schematic. The copy was identical to the original (MD5 b98bb54b…).
- **Cross-check:** `tools/spec_v2.py`.
- **Connector positions:** read from a copy of `RoboCore_V2.kicad_pcb`.
- **Ratings:** from the datasheets listed at the end.

Where the task list and the schematic differ, the schematic wins (see "Corrections to the task list").

## Summary, worst first

| # | What goes wrong | What breaks | Likelihood |
|---|---|---|---|
| 1 | **VMOT shorted to GND.** Expansion A pins 13–14 are side by side; servo header pins 2–3 too (a jumper cap, a stray wire, a screwdriver); or a servo plug turned *and* shifted. | **The board, with heat and a battery hazard.** The boost's current limit doesn't work on an output short, and nothing on the board limits battery current. The schematic expects a protection board in the pack ("1S Li-ion pack only (cells in parallel, protection board in the pack)"), but the 12 October component list dropped it. | Medium |
| 2 | **VSYS_SW shorted to GND or to EN.** Expansion B pins 12–13–14 are EN, VSYS_SW, GND, side by side. | **The board.** To GND: about 10 A through the charger IC's 200 mΩ battery switch, which has no current limit. To EN: the battery reaches the ESP32's EN pin with no resistor. | Medium |
| 3 | **Ultrasonic plugged in backwards.** A turned 4-way housing, or VCC and GND wires swapped. | **The ultrasonic module.** It is powered backwards at 3.3 V with up to about 2 A available. The board survives: the 3.3 V converter limits current, and the ESP32 resets. | **High** |
| 4 | **A sensor wired between VMOT and 3.3 V.** Its GND or a signal wire on a servo "+" pin while VCC is on 3V3. | **Possibly the board.** Current flows from VMOT through the sensor's internal diodes into the 3.3 V rail. The 3.3 V converter can't pull the rail down, so it can rise past the ESP32's 3.6 V limit. The sensor is likely ruined too. | Low–medium |
| 5 | **VMOT or VSYS_SW onto 3V3, or onto an expansion pin with no series resistor.** EN, SDA, SCL, IMU_INT1, USER_BTN, BUZZER, RGB_DOUT. | **The board:** the ESP32, the IMU or the RGB LED. | Low |
| 6 | **Sensor VCC on a servo "+" pin (5.5 V) instead of 3V3.** | **Nothing at once.** The ultrasonic's Echo pushes about 4.9 mA into IO41 through 330 Ω on every ping. The ESP32 datasheet has no rating for that; its inputs stop at VDD + 0.3 V. The RCWL-1601 is listed for 3–5 V, so 5.5 V is above its rating. | Medium |
| 7 | **Servo plug slid one pin off the end, signal on VMOT.** | **Possibly the servo's input.** Its input protection diode sits across VMOT and GND unless the servo has an input resistor. | Medium |
| 8 | **Line sensor reversed.** | **Depends on the module.** A plain TCRT5000 module (resistors only) survives 3.3 V reversed. A module with a comparator or op-amp chip is damaged. **Which type Fred buys decides this.** | High |

Everything else in the tables below **doesn't work but does no damage**. That covers turned servo plugs, swapped signal wires, sensors in each other's headers, and plugs shifted onto GPIOs. In those cases the 330 Ω resistors (R401–R413) and the 3.3 V converter's current limit keep currents to a few mA.

**The servo rule holds for this board:** a turned servo plug (S, +, − reversed) is harmless, because + stays on VMOT in the middle. A servo plug that is turned *and* slid one pin off the end is not (case S10).

## The board, as built

### Connectors, confirmed against the schematic

| Ref | What | Pin order (pin 1 first) | Keyed? |
|---|---|---|---|
| J101 | USB-C | — (CC1/CC2 have 5.1 kΩ pull-downs: 5 V only) | Reversible |
| J102 | Battery, XT30 male | 1 GND, 2 BAT_RAW (+) | Yes |
| J201 | Qwiic, JST SH 4-pin | GND, 3V3, SDA, SCL | Yes |
| J301, J302 | Motor 1, 2, JST SH 6-pin | MOT+, MOT−, 3V3, ENC A, ENC B, GND | Yes |
| J401, J402, J407, J408 | Servo 1, 2, 3, 4, 1×3 pin header | Signal (IO38, IO39, IO35, IO36, each through 330 Ω), VMOT, GND | No |
| J403 | Ultrasonic, 1×4 pin header | 3V3, TRIG (IO40 via R403), ECHO (IO41 via R404), GND | **No** |
| J404 | Line sensor, 1×5 pin header | 3V3, GND, L (IO7 via R405), C (IO10 via R406), R (IO2 via R407) | **No** |
| J405 | Expansion A, 1×14 socket | 3V3, GND, IR_L, IR_C, IR_R, TRIG, ECHO, SERVO1, SERVO2 (all via 330 Ω), **BUZZER (IO47, no resistor)**, **RGB_DOUT (the LED's data output, no resistor)**, IO3 (via R408), **VMOT**, GND | No |
| J406 | Expansion B, 1×14 socket | 3V3, GND, **SDA, SCL (IO8, IO9, also the IMU and Qwiic, no resistor)**, TX, RX, SERVO3, SERVO4, IO37 (all via 330 Ω), **IMU_INT1 (IO1 + IMU, no resistor)**, **USER_BTN (IO42, no resistor)**, **EN (no resistor)**, **VSYS_SW**, GND | No |

### Corrections to the task list
- **Servo references:** the servo headers are **J401, J402, J407 and J408**. J405 and J406 are the expansion sockets.
- **Servo power pin:** the net is **VMOT**, the 5.51 V output of the TPS61089 boost. The motor driver uses it too.
- **Missing resistors:** `spec_v2.py` says "330R in series with every ESP32 pin that leaves the board". Six expansion pins have none: SDA, SCL, IMU_INT1, USER_BTN, BUZZER and EN. RGB_DOUT is the LED's output, also with no resistor.

### Layout facts that matter
- **Servo headers can't be straddled.** Servo 1 (J401) sits above servo 3 (J407) on the left edge, and servo 2 (J402) above servo 4 (J408) on the right. The last pin of one and the first of the next are **3.67 mm apart, not 2.54 mm**, so a 3-way housing can't sit across both. It can still hang one pin off the end.
- **J403 and J404 are 34 mm apart** on the bottom edge (J403 at x 109.5–117.1 mm, J404 at x 151.5–161.7 mm). One plug can't reach both.

### Rails and protection

| Rail | Source | What happens on a short or overload |
|---|---|---|
| +3V3 | TPS63001 buck-boost from VSYS_SW | Switch limit 1.6–2.0 A. Below about 1.2 V out it keeps the limit low ("assumes a short circuit"), plus over-temperature shutdown. **A short is safe. It can't pull the rail down if something feeds it from above.** |
| VMOT, 5.51 V | TPS61089 boost from +BATT, through Q102 (on with the switch) | Cycle-by-cycle limit set to 5.15 A on the low-side switch. **TI: "The current limit feature loses function in the output short-circuit conditions"** (SLVA819, which applies to the TPS61089 too). **With the switch OFF, Q102 isolates VMOT, so a short does nothing.** |
| VSYS / VSYS_SW | MCP73871 OUT (USB or battery), then Q101 (on with the switch) | Battery to OUT through a 200 mΩ switch. The datasheet says "No active control limits the current to the system", and the switch is "designed to drive a maximum current up to 2A". Thermal shutdown "may turn the MCP73871 device off". About 4.2 V on battery, about 5 V with USB. |
| BAT_RAW to +BATT | XT30, then Q103/Q104 back to back | Blocks a reversed pack and anything over 4.6 V. **No fuse and no current limit.** |
| VBUS | USB-C, through F101 1.5 A PTC + D106 SMF5.0A TVS | Protected. |

### ESP32-S3 pin limits (datasheet v2.2)
- **Input voltage:** maximum VDD + 0.3 V = **3.6 V**.
- **Drive:** IOH 40 mA and IOL 28 mA at drive strength 3.
- **Injection current:** **no rating is given.** So any current a pin's clamp diode carries is outside the datasheet. Here is what the 330 Ω resistors let through, with a clamp at about 3.9 V:

| Source on the header pin | Into the pin through 330 Ω |
|---|---|
| VMOT 5.51 V, or a sensor powered from VMOT | ≈ 4.9 mA (16.7 mA if the pin drives low, within IOL) |
| VSYS_SW on battery, 4.2 V | ≈ 0.9 mA |
| VSYS_SW with USB, ≈ 5.0 V | ≈ 3.3 mA |
| A GPIO driving high into GND | ≈ 10 mA (within IOH) |

The injected current flows into the 3.3 V rail. The board draws more than that, so the rail doesn't rise.

### The add-on parts
- **Ultrasonic:**
  - HC-SR04P is listed at 3.0–5.5 V. RCWL-1601 is listed at 3–5 V (some sellers say 3–5.5 V).
  - Neither seller states the Echo level. Assume Echo swings to the module's supply until it's measured.
  - Neither has reverse-polarity protection.
- **Line sensor:**
  - The TCRT5000 is rated **5 V reverse on the LED (VR) and 5 V emitter–collector (VECO)**.
  - A plain module (TCRT5000s, LED resistors and output pull-ups, about 10 kΩ) survives being reversed at 3.3 V.
  - Modules with an LM339/LM358/LM324 chip don't: a reversed supply drives current through the chip's substrate diode.
  - Pin orders vary between modules. **This check assumes VCC, GND, L, C, R, matching J404.**
- **Servos (SG90, MG90S):** S (orange), + (red), − (brown). Supply 4.8–6 V. Whether the signal input has a series resistor isn't documented, so cases that depend on it are marked "may".

## Severity and likelihood
- **Severity:**
  - **Safe.**
  - **Doesn't work:** nothing is damaged.
  - **Out of spec:** no damage expected, but beyond a datasheet limit.
  - **Damages sensor/servo.**
  - **Damages board.**
  - **Board + battery hazard:** high current with nothing to stop it.
- **Likelihood, in a class of about 20 robots over a term:**
  - **High:** expect it to happen.
  - **Medium:** it will happen sometimes.
  - **Low:** it needs two mistakes, or a deliberate long jumper.

The component list plans the sensor cables as **nine loose female–female jumper wires per robot**, so every wire can be placed on its own. That makes the "loose wire" cases the realistic ones until one-piece housings are used.

## 1. A plug turned round (180°)

| # | Case | What meets what | Result | Severity | Likelihood |
|---|---|---|---|---|---|
| T1 | J403 ultrasonic turned | Module VCC←GND, Gnd←3V3, Trig←ECHO (IO41), Echo←TRIG (IO40) | Module powered backwards at 3.3 V; its chips' internal diodes conduct, with only the 3.3 V converter's 1.6–2 A limit. Module likely ruined within seconds. The 3.3 V rail sags and the ESP32 resets; the converter protects itself. The GPIOs see 0–3.3 V only. | Damages sensor | **High** |
| T2 | J404 line sensor turned | VCC←R (IO2), GND←C (IO10), L←L (IO7), C←GND, R←3V3 | The module is fed only through its R output's pull-up (≈10 kΩ), under 1 mA. LEDs stay dark. The pins stay within 0–3.3 V. A chip-type module behaves the same, since its supply also comes only through the pull-up. | Doesn't work | High |
| T3 | Servo plug turned (any servo header) | Servo −←signal (330 Ω to the GPIO), +←VMOT, S←GND | The servo's ground rides on the GPIO, and its input sits below its own ground. Its input diode carries the idle current, a few mA. No valid pulses, so the motor stays off. The GPIO current is ≤ 8 mA. | Doesn't work | High |

## 2. A plug shifted by one pin (one contact hanging off the end)

| # | Case | What meets what | Result | Severity | Likelihood |
|---|---|---|---|---|---|
| S1 | J403, ultrasonic slid toward pin 4 | VCC←TRIG, Trig←ECHO, Echo←GND, Gnd off | Powered only through 330 Ω from IO40; ground only through the Echo output's diode. A few mA. | Doesn't work | Medium |
| S2 | J403, slid toward pin 1 | Trig←3V3, Echo←TRIG, Gnd←ECHO, VCC off | Back-powered through the Trig input diode, a few mA. | Doesn't work | Medium |
| S3 | J403, turned and slid (2 positions) | VCC on a GPIO or off, Gnd on a GPIO or off | No supply path; at most a few mA. | Doesn't work | Low |
| S4 | J404, line sensor slid toward pin 5 | VCC←GND, GND←L, L←C, C←R, R off | Unpowered. | Doesn't work | Medium |
| S5 | J404, slid toward pin 1 | GND←3V3, L←GND, C←IR_L, R←IR_C, VCC off | Plain module: the L phototransistor sees 3.3 V reversed (VECO 5 V), so no damage. Chip-type module: ground at 3.3 V with an output at 0 V, so the chip's substrate diode conducts from 3V3 to GND, up to about 2 A. | Doesn't work (plain) / damages sensor (chip) | Medium |
| S6 | J404, turned and slid (2 positions) | Supply only through output pull-ups | Under 1 mA. | Doesn't work | Low |
| S7 | Servo slid toward the GND end | S←VMOT, +←GND, − off | The servo's input diode sits straight across VMOT and GND. With an input resistor, a few mA; without one, the diode fails, and VMOT is heavily loaded until it does. | May damage servo | Medium |
| S8 | Servo slid toward the signal end | +←signal (330 Ω), −←VMOT, S off | Servo powered backwards through 330 Ω, ≤ 15 mA. When the GPIO isn't driving low, about 3 mA flows into it. | Doesn't work; out of spec | Medium |
| S9 | Servo turned and slid, S on VMOT | S←VMOT, +←signal, − off | Input diode feeds the GPIO node: ≤ 15 mA through the diode, about 3 mA into the GPIO. | Doesn't work; out of spec | Low |
| S10 | Servo turned and slid, + on GND | +←GND, −←VMOT, S off | Servo powered backwards straight from VMOT. The body diodes in its motor driver act as a short across VMOT, which the boost can't limit. The battery drives current until the servo's electronics fail. | Damages servo; high battery current | Low |
| S11 | One plug across two headers | — | Not possible: the servo headers are 3.67 mm apart, and J403 and J404 are 34 mm apart. | Safe | — |

## 3. The right cable in the wrong port

| # | Case | What meets what | Result | Severity | Likelihood |
|---|---|---|---|---|---|
| W1 | Ultrasonic in J404, from pin 1 | VCC←3V3, Trig←GND, Echo←IR_L, Gnd←IR_C | The module's ground floats on an ADC pin, so it runs off its Trig input diode (a few mA). | Doesn't work | Medium |
| W2 | Ultrasonic in J404, other straight positions; turned with Gnd on GND | VCC on GND, an ADC pin or off | Unpowered or a few mA. | Doesn't work | Medium |
| W3 | Ultrasonic in J404, turned, from pin 1 | Gnd←3V3, Echo←GND, VCC←IR_C, Trig←IR_L | The Echo output's internal diode sits across 3V3 and GND. The output stage burns, the converter limits current, and the ESP32 resets. | Damages sensor | Low |
| W4 | Line sensor in J403 (one contact off) | Straight: VCC←3V3, GND←TRIG, L←ECHO, C←GND | Ground through 330 Ω to IO40, ≤ 10 mA. In the slid position (GND←3V3, R←GND), a chip-type module is damaged; a plain one isn't. | Doesn't work (plain) / damages sensor (chip) | Medium |
| W5 | Servo in J403 or J404, wherever only 3V3 and GPIOs meet it | — | ≤ 10 mA through 330 Ω. At 3.3 V the servo may twitch. | Doesn't work | Medium |
| W6 | Servo in J404, S on 3V3 and + on GND | S←3V3, +←GND, −←IR_L | The servo's input diode sits across 3V3 and GND. With no input resistor it carries up to the converter's limit, and the ESP32 resets. | May damage servo | Low |
| W7 | Servo in J404, turned | +←GND, −←3V3, S←IR_L | Servo powered backwards at 3.3 V. The converter limits and folds back, and the ESP32 resets. | May damage servo | Low |
| W8 | Ultrasonic on a servo header (one contact off) | Echo or Trig lands on VMOT | **Echo on VMOT with Gnd on GND:** when the module pulls Echo low, its output transistor shorts VMOT. **Trig on VMOT with VCC on GND:** the input diode sits across VMOT and GND. **Trig on VMOT with VCC on the signal pin:** ≈ 15 mA through the diode, about 3 mA into the GPIO. | Damages sensor | Low–medium |
| W9 | Line sensor on a servo header (two contacts off) | 5.5 V on an output, or on GND | Plain module: 5.5 V reaches the outputs only through about 10 kΩ, or reverses the module at 5.5 V, just over the TCRT5000's 5 V ratings, so probably no damage. A chip-type module reversed at 5.5 V is damaged and loads VMOT heavily. | Doesn't work (plain, marginal) / damages sensor (chip) | Low |

## 4. Loose jumper wires to a sensor (the planned cabling)

| # | Case | Result | Severity | Likelihood |
|---|---|---|---|---|
| J1 | Ultrasonic VCC and GND swapped | Same as T1. | Damages sensor | **High** |
| J2 | Line sensor VCC and GND swapped | Plain module: 3.3 V reverse, inside its 5 V ratings, so no current flows. Chip-type: damaged. | Doesn't work / damages sensor (chip) | High |
| J3 | Ultrasonic VCC on a servo "+" (5.51 V), GND on GND | The module runs at 5.5 V: the top of the HC-SR04P's range, above the RCWL-1601's 3–5 V. Echo swings to about 5.5 V, so ≈ 4.9 mA flows into IO41 through R404 on every ping. | Out of spec | Medium |
| J4 | Line sensor VCC on a servo "+" | Plain module: the outputs reach the ADC pins through about 10 kΩ, ≈ 0.15 mA each. Readings saturate above 3.3 V, but nothing is harmed. With op-amp outputs: ≈ 4.9 mA per channel. | Doesn't work / out of spec | Medium |
| J5 | Sensor GND on a servo "+" (VMOT), VCC on 3V3 | The sensor is reversed by 2.2 V between two live rails. Ultrasonic or chip-type: current flows from VMOT through its internal diodes into the 3.3 V rail, which the converter can't pull down. The rail can rise above 3.6 V and damage the ESP32 and IMU; the sensor is likely ruined. Plain line module: 2.2 V reverse, so no current. | **Damages board** (ultrasonic, chip-type) | Low–medium |
| J6 | A sensor signal wire on a servo "+", VCC on 3V3 | Echo's internal diode feeds VMOT into the 3.3 V rail, as in J5 but through a smaller diode. When the module drives Echo low, it shorts VMOT. | Damages sensor; may lift the 3.3 V rail | Low |
| J7 | Signal wires swapped (TRIG/ECHO, or L/C/R mixed up) | Both ends stay at ≤ 3.3 V with 330 Ω between them. Only the readings are wrong. | Doesn't work | High |
| J8 | VCC or a signal on GND, or GND on a GPIO | ≤ 10 mA. | Doesn't work | Medium |

## 5. Jumper wires on the expansion headers (J405, J406)
On each socket, pins 12–14 are neighbours: J405 has IO3, VMOT, GND; J406 has EN, VSYS_SW, GND. A wire or component lead in the wrong hole, or two leads touching, hits these.

| # | Case | Result | Severity | Likelihood |
|---|---|---|---|---|
| X1 | **VMOT to GND** (J405 pins 13–14, neighbours) | The current path is battery, Q103/Q104, Q102, the 2.2 µH inductor, the boost's high-side switch, then the short. Only resistance limits it: tens of amps from three parallel 18650s. The boost IC, inductor, Q102 or a trace fails; the cells heat. The pack has no protection board on the current list. With the switch OFF it's safe. | **Board + battery hazard** | Medium |
| X2 | **Servo header pins 2–3 bridged** (jumper cap, stray wire, screwdriver) | Same as X1. | **Board + battery hazard** | Medium |
| X3 | **VSYS_SW to GND** (J406 pins 13–14, neighbours) | Battery through the MCP73871's 200 mΩ switch (no current limit, designed for 2 A) and Q101: about 10 A. The charger IC overheats; thermal shutdown "may" act. Q101 is overstressed too. | **Damages board** | Medium |
| X4 | **VSYS_SW to EN** (J406 pins 12–13, neighbours) | 4.2 V, or about 5 V on USB, lands straight on the ESP32's EN (CHIP_PU) pin with no resistor. Its clamp diode carries whatever the battery path supplies. | **Damages board** (ESP32 module) | Medium |
| X5 | VMOT to IO3 (J405 pins 12–13, neighbours) | ≈ 4.9 mA into IO3 through R408 (16.7 mA if IO3 drives low). IO3 is a strapping pin (JTAG source) but only read at reset. | Out of spec | Medium |
| X6 | VMOT or VSYS_SW to any other 330 Ω pin | As X5. VSYS_SW gives about 0.9 mA on battery and 3.3 mA on USB. | Out of spec | Low–medium |
| X7 | VMOT or VSYS_SW to a pin with no resistor (SDA, SCL, IMU_INT1, USER_BTN, BUZZER, RGB_DOUT) | Unlimited current into the ESP32 pin, and into the IMU (SDA, SCL, INT1, rated VDD + 0.3 V) or the RGB LED. | **Damages board** | Low |
| X8 | VMOT or VSYS_SW to 3V3 (pin 13 to pin 1) | The 3.3 V rail is forced to 4.2–5.5 V. The ESP32 is rated 3.6 V and the IMU 4.8 V; the encoders and sensors are also over voltage. The TPS63001 itself survives (7 V rating). | **Damages board** | Low |
| X9 | 3V3 to GND (pins 1–2, neighbours on both sockets) | The converter folds back; everything resets. | Doesn't work | Medium |
| X10 | EN to GND, or to USER_BTN (J406 pins 11–12) | Holds the ESP32 in reset, or resets it when USER is pressed. | Safe | Medium |
| X11 | BUZZER (IO47) or SDA/SCL to 3V3 or GND while the pin drives against it | No resistor, so the current is set by the pin driver (about 40 mA). That overstresses the pin over time. | Out of spec; may damage the pin | Low |
| X12 | BUZZER to RGB_DOUT (J405 pins 10–11, neighbours) | The ESP32 output fights the LED's output with no resistor whenever they differ (buzzer on). | May damage IO47 or the LED | Low–medium |
| X13 | IMU_INT1 to USER_BTN (J406 pins 10–11, neighbours) | If the IMU interrupt is high while USER is pressed, the IMU's output is shorted to GND through the button. | May damage the IMU pin | Low |
| X14 | Other neighbouring pairs, with 330 Ω on at least one side (IR lines, TRIG/ECHO, servo signals, TX/RX, IO37/INT1) and GND–SDA, SDA–SCL | ≤ 10 mA, or an I2C bus held low. | Doesn't work | Medium |

## 6. The keyed connectors

| # | Case | Result | Severity | Likelihood |
|---|---|---|---|---|
| K1 | **Home-made battery lead with swapped wires** | **Checked:** BAT_RAW sits at −4.2 V. Q103's body diode is reverse-biased, and R122 holds its gate off. D107 blocks the enable, so Q105 and both FETs stay off. Q103 sees about −4.2 V, or −7.8 V with USB also connected, inside the SI7655DN's rating (the spec says it survives a reversed 3S pack). A 2S or 3S pack trips U105 at 4.6 V. Nothing turns on and nothing is damaged. | Safe | Medium |
| K2 | Qwiic cable (JST SH 4-pin) forced into a motor socket (JST SH 6-pin) | **Not confirmed from drawings; try it with real parts.** If it can seat, it can land two ways. **Toward pin 1:** the Qwiic device's GND and 3V3 land on the motor outputs (up to ±5.5 V when the motor runs), so the accessory is damaged; the DRV8411 has its own overcurrent protection. **Toward pin 6:** the device is reversed through a 10 kΩ pull-up, so nothing is harmed. | Damages a Qwiic accessory | Low |
| K3 | Motor cables swapped between J301 and J302 | Left and right swap; fix it in software. | Safe | Medium |
| K4 | USB-C, any cable or charger | Reversible. The 5.1 kΩ CC pull-downs mean 5 V only, behind the 1.5 A PTC and the TVS. | Safe | — |

## What to do with the prototypes now (no board change)
1. **One-piece housings for the sensor cables.**
   - Replace the nine loose jumpers with a 1×4 and a 1×5 housing per robot, crimped once and labelled.
   - Mark the VCC edge of each housing with a paint pen, and put a dot at pin 1 of J403 and J404.
   - This removes the most likely mistakes: J1, J2, J5 and J7.
2. **A printed shroud or collar around J403 and J404**, with a rib that only lets the housing in one way, and walls that stop it hanging off the end.
   - A matching collar on each servo header stops S7–S10 (overhang).
   - **Pass this to the Mechanical-Design chat.**
3. **A blanking plug for the expansion power pins.**
   - Fill J405 pins 12–14 and J406 pins 12–14 for classroom use: a printed cap, or male pins cut flush in a short housing. This blocks X1, X3, X4 and X5.
   - Also a cap for the servo headers that aren't in use, so a jumper cap can't land on pins 2–3 (X2).
4. **Colour-coded cables.** Red only for 3V3 or VMOT, black only for GND, other colours for signals. Never reuse a red or black wire as a signal.
5. **Pin-1 marks.** Silk labels are already beside the pins. Add a paint dot at pin 1 of each sensor header and a matching dot on the cable.
6. **First power-up of each sensor on a current-limited bench supply.**
   - Use 3.3 V with about 50 mA for the ultrasonic and about 100 mA for the line sensor, before it ever meets a robot.
   - Measure the Echo high level, and check the line module's pin order and whether it has a chip on it.
   - **Bring the boards up the same way:** a bench supply at 3.7 V with a 1 A limit through an XT30 lead, instead of the battery. That way an X1 or X3 short during bring-up costs nothing.
7. **Battery-path protection until the board has its own.** The board assumes a protection board in the pack (J102's schematic description), and the 12 October list removed it. A short on VMOT or VSYS_SW (X1–X3) has nothing to stop it. Two options, about $1 a robot or less:
   - an inline fuse of about 5 A in the XT30 lead;
   - the 1S protection board back in the pack. Pick one rated 8 A or more so servo and motor peaks don't trip it.

## Recommendations for the next board

| Change | Fixes | Rough cost per board | Space |
|---|---|---|---|
| **Keyed sensor connectors:** JST PH 2.0 mm (B4B-PH-K, B5B-PH-K) or JST XH 2.5 mm (B4B-XH-A, B5B-XH-A), with ready-made PH/XH to female-Dupont adapter cables for the bought-in modules | T1, T2, S1–S6, W1–W4, J1–J8 | $0.05–0.10 each (LCSC); adapter cables about $1–3 per 10 | PH: 4-pin 9.9 × 4.5 mm, 5-pin 11.9 × 4.5 mm, about the same width as today's headers. XH: 12.4 / 14.9 × 5.75 mm, tight next to the XT30 and H104 |
| **Keep a straight-cable pin order:** J403 already matches the HC-SR04 (VCC, TRIG, ECHO, GND). Fix J404 to the module Fred buys. Use 1:1 adapter cables, never crossed ones | Wiring errors | $0 | — |
| **Current limit on the sensor 3V3 feed:** a 0805 PTC (about 0.1–0.2 A hold) per header, or one current-limited switch (TPS2553-type, set to about 150 mA) that firmware can also turn off | T1, J1, W3, S5 | PTC $0.05–0.10; switch about $0.40–0.60 | PTC 2.0 × 1.25 mm; switch SOT-23-6 + 2 caps, about 6 × 5 mm |
| **1 kΩ instead of 330 Ω** on the sensor and servo signal lines. HC-SR04P and servo inputs are high impedance, and the ESP32 ADC is fine with 1 kΩ | J3, J4, S8, S9, X5, X6 (5.5 V injection falls from 4.9 to about 1.6 mA) | $0 | Same parts |
| **A fuse on +BATT** (2410 SMD, about 7 A slow-blow), or an output disconnect on the boost (TI SLVA819: P-FET + comparator), or an eFuse on VMOT | X1, X2, S10 | Fuse $0.20–0.50; disconnect $0.30–0.60; eFuse about $0.80 | Fuse 6.1 × 2.7 mm; disconnect about 6 × 6 mm |
| **A PTC (about 0.5 A hold, 1206) in the expansion VMOT and VSYS_SW pins** | X1, X3, X4 at the header | about $0.10 each | 3.2 × 1.6 mm each |
| **Series resistors on the expansion pins that have none:** 100–220 Ω on SDA/SCL, 1 kΩ on EN, IMU_INT1, USER_BTN, BUZZER, RGB_DOUT. Or drop EN from the header | X4, X7, X11–X13 | under $0.01 | 6 × 0402 |
| **Re-order the expansion pins** so VMOT and VSYS_SW sit next to GND only, never beside EN or a GPIO, e.g. … GND, VMOT, GND, VSYS_SW, GND at one end | X4, X5 | $0 (1–2 more pins) | 2.54 mm per pin |
| **Reversal-safe pinout** (power in the middle, GND at both ends, e.g. GND, TRIG, 3V3, ECHO, GND) | A turned plug becomes harmless | $0 (+1 pin) | +2.54 mm |

The last row conflicts with the straight-cable order, because bought-in modules put VCC and GND at the ends. **Keyed connectors with a straight order are the better fix.** Use the reversal-safe pinout only if the headers stay unkeyed.

## Change before paying? What changing J403/J404 now would involve
The PCBWay order (W836287AS1F11 + T-1F12W836287A) showed "Incomplete Payment" on 14 October. **Changing the board first is Fred's call.**

| Step | What it involves | Time |
|---|---|---|
| Footprints | Swap J403/J404 for JST PH (or XH) vertical. KiCad has them (`Connector_JST:JST_PH_B4B-PH-K_1x04_P2.00mm_Vertical` etc.). Check the space beside the XT30 (J403) and the H104 screw head (J404) | 1–2 h |
| Routing | Re-route 9 nets at the bottom edge (3V3, GND and 7 signals), then DRC | 1–3 h |
| Silk | Regenerate the pin-label boxes (`LABELS_J403/J404`, made by script) for the new pitch | 1 h |
| Files | Gerbers, drill, BOM (2 new part numbers), CPL (THT, so only if PCBWay asks) | 1 h |
| PCBWay | Re-uploading doesn't replace files on an item under audit (learned on 9 October), so remove the items and submit again. Last time: submitted on 9 October, gerber passed review and the quote came the same day. Expect a new EQ for the new parts | 1–2 days |
| Delay to delivery | The quoted ship date (6 November) "will be recalculated from the end of EQ" | **About 3–5 days later**, plus any connector lead time at PCBWay (PH/XH are stock parts) |
| Adapter cables | PH/XH to female-Dupont, 4- and 5-pin, for the bought-in modules. About 2–3 weeks to Zambia, so they arrive with the boards | Order now if changing |
| Cost | Connectors are cents. THT count unchanged. Minimum-pack buying at 2 units may add $1–2 | ~$0–2 |

**Paying for the prototypes as they are still makes sense:**
- The worst *likely* outcomes (T1/J1, a ruined $1.50 ultrasonic) are covered by housings, a shroud and a bench-supply first power-up.
- The worst *severe* outcomes (X1–X4) have nothing to do with J403/J404 at all. A connector change before paying wouldn't fix them.
- They need the fuse or pack protection now, plus the blanking plug.

**The next board** should take both: keyed sensor connectors, and the battery, VMOT and expansion-pin protection.

## Open items
1. **Line sensor module:** Fred to send a photo of the exact module. Its pin order sets J404, and a plain resistor-only module versus one with a chip changes T2, S5, W4, W9, J2 and J5.
2. **Ultrasonic Echo level:** measure it on the chosen module at 3.3 V, and at 5.5 V if anyone will ever power it from VMOT.
3. **Reversed servo, on the bench:** turn a servo plug on a current-limited 5.5 V supply and confirm T3 is harmless. Note whether the servo has an input resistor (S7).
4. **Qwiic plug in a motor socket:** try a JST SH 4-pin plug in a 6-pin socket (K2).

## Sources
- [ESP32-S3 Series Datasheet v2.2](https://documentation.espressif.com/esp32-s3_datasheet_en.pdf), Espressif: Tables 5-1 and 5-4.
- [TPS61089 datasheet (SLVSD38C)](https://www.ti.com/lit/ds/symlink/tps61089.pdf) and [SLVA819, "Output Short-Circuit Protection Solution for the TPS61088"](https://www.ti.com/lit/pdf/slva819), Texas Instruments.
- [TPS63001 datasheet](https://www.ti.com/lit/ds/symlink/tps63001.pdf), Texas Instruments: switch current limit and short-circuit behaviour.
- [MCP73871 datasheet (DS20002090C)](https://cdn.sparkfun.com/assets/0/8/4/4/d/mcp73871_datasheet.pdf), Microchip: BAT-to-OUT switch, system load current and thermal shutdown.
- TCRT5000 absolute maximums (VR 5 V, VECO 5 V): [Vishay TCRT5000 datasheet copy](https://www.epfl.ch/campus/associations/robopoly/wp-content/uploads/2018/09/TCRT5000.pdf).
- Ultrasonic supply ranges from seller listings: [HC-SR04P 3.3–5.5 V](https://sigmanortec.ro/en/ultrasonic-sensor-hc-sr-04p-3-55v), [RCWL-1601 3–5 V](https://core-electronics.com.au/catalog/product/view/sku/ADA4007).
- Board facts: netlist exported from `RoboCore_V2.kicad_sch` (14 October 2026), `tools/spec_v2.py`, and connector and hole positions from `RoboCore_V2.kicad_pcb`.
