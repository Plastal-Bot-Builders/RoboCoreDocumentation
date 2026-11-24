# RoboCore V2 controller: bring-up checklist

The two assembled boards from PCBWay (order YU1827457) arrived on 2026-11-06. This is the order in which to power them up for the first time. Each step only needs the one before it to have passed. Write anything odd into `RoboCore_V2_errata.md` (Bring-up findings), with the board's serial number.

**Test list with results:** https://claude.ai/artifact/NVKLkP6cxDCuusP5Nbv9qr (45 tests, A–F, grouped by the equipment each needs; Pass / Fail / Can't yet and a note per board, saved on the page). This file explains the steps; the page is where results are recorded.

**Programming the board:** `RoboCore_V2_pin_reference.md` lists the pin of every part, with Arduino names and example sketches.

**Rule for every step:** nothing plugged into the sensor, servo, motor or expansion headers until step 6. If anything gets hot, smells or the LEDs do something unexpected, unplug first and look second.

## What you need
- A multimeter (DC volts and resistance)
- A magnifier or phone macro camera
- A USB-C cable that carries data. Some charge-only cables don't.
- Ideally, a bench power supply with a current limit and an XT30 lead (UniPod may have one)
- Otherwise: the battery with an inline fuse of about 5 A in its XT30 lead (errata E-001)

## Probe points
Picture with every probe point marked: `board_tests/probe_points.png`. Easiest: black probe clipped to the ultrasonic header's GND pin, red on the pin being measured.

These pins are easy to reach with meter probes. The silkscreen labels them.

| Rail | Where to probe | Ground for the black probe |
|---|---|---|
| 3V3 | Expansion A (J405) pin 1, or the "3V3" pin of the ultrasonic header (J403) | J405 pin 2, or the "GND" pin of J403 |
| VMOT (5.5 V motor/servo power) | Middle pin of any servo header, or J405 pin 13 | Servo header "GND" pin, or J405 pin 14 |
| VSYS_SW (battery or USB power after the switch) | Expansion B (J406) pin 13 | J406 pin 14 |
| Battery in | The XT30's square side ("+") | The XT30's bevelled side ("−") |

## 1. Label and photograph
- Mark the boards **V2-01** and **V2-02** (paint pen on the underside, or a sticker on the bag).
- Photograph both sides of each board in good light. These are the "as delivered" pictures.

## 2. Look before power
Under the magnifier, on both boards:
- **Solder bridges** between pins of the small chips: MCP73871 (charger), TPS63001 (3.3 V), TPS61089 (5.5 V boost), DRV8411A (motor driver), LSM6DSOX (motion sensor), and the USB-C connector pins.
- **Missing or tilted parts**, parts standing on one end, loose solder balls.
- **Shipping damage**: bent header pins, cracked parts at the board edge, the XT30 and USB-C sitting flat.

## 3. Resistance check, unpowered
Meter on resistance, black probe on ground. Do it with the switch OFF, then again with the switch ON (the switch connects some rails).

| Rail | Good | Stop |
|---|---|---|
| 3V3, VMOT, VSYS_SW, battery in | Above about 100 Ω. The reading often climbs while the capacitors charge. | Below about 10 Ω: a short. Don't power that board; photograph and record it. |

## 4. First power: USB only
USB is the safest first supply, because its input has a 1.5 A resettable fuse. No battery.

1. **Switch OFF**, plug USB-C into the Mac.
   - Expect: **blue LED (D103, USB power) on.**
   - The red CHG and green FULL LEDs may stay off or flicker without a battery. That's normal.
   - Nothing should get warm.
2. **Switch ON.**
   - Expect: **green LED (D104, 3.3 V) on.**
   - Measure **3V3: 3.25–3.40 V.**
   - Measure **VSYS_SW: about 4.6–5.1 V.**
   - The red MOT LED may or may not light, because the boost runs from the battery side. Don't judge VMOT until step 5.
   - The RGB LED and buzzer stay quiet: the ESP32 has no program yet.
3. **Does the Mac see the ESP32?** It should appear as a USB serial device ("USB JTAG/serial debug unit"). A blank chip can keep restarting, so if it comes and goes: **hold BOOT, press and release RESET, then release BOOT.** That puts it in download mode.
   - Claude can then read the chip from here with esptool: chip type, MAC address, and whether the 8 MB flash and 2 MB PSRAM are there.

## 5. Battery path
**With a bench supply (better).** Set **3.7 V, current limit 1 A**, connect it through the XT30 lead, USB unplugged.
1. **Switch OFF:** the supply should show about 0.00 A.
2. **Switch ON:**
   - Green 3.3 V LED and red MOT LED on.
   - **3V3: 3.25–3.40 V.**
   - **VMOT: 5.4–5.6 V** (designed for 5.51 V).
   - Current: roughly 50–150 mA with the ESP32 idle. If it touches the 1 A limit only for a moment at switch-on, that's the capacitors charging. If it **stays** at the limit, switch off: something is shorted.
3. **Repeat at 4.2 V (full cell) and 3.0 V (empty cell).** 3V3 and VMOT should stay the same.

**Without a bench supply.** Use the battery with the inline fuse. Connect it with the switch OFF, check nothing warms up for a minute, then switch ON and measure as above.

**Charging.** Battery plus USB: the red CHG LED is on while it charges, and the green FULL LED when it's done.

**V2.1 boards (from 2026-11-23): on-board cell protection U106.** Bench supply on the XT30, USB unplugged, switch ON:
1. **Plug-in start:** at 3.7 V the board must come on every time you connect the supply (try 5 times). If it ever stays dead, note it: U106 did not start (see the spec).
2. **Low cut-off:** lower the supply slowly. The board must switch off at **2.85–2.95 V**. Raise it back to 3.7 V: it stays off (that is correct).
3. **Wake-up:** plug in USB: the board comes back on and charging starts. Unplug USB.
4. **Overcurrent (optional, supply limit at least 12 A only):** skip unless you have such a supply; the 10 A trip is fixed by the chip.
5. **Wrong pack:** at 8.4 V (a 2S pack) nothing must light up and the current must stay under 10 mA.

**Motor cables (V2.1):** straight JST PH 6-pin cable, pin 1 to pin 1. Before plugging into the board, check with the meter (unpowered) that the motor coil (a few ohms) is between pins 1 and 2 at the board end.

## 6. Test program, then the add-ons, one at a time
- **Test program:** `firmware/v2_bringup/v2_bringup.ino`.
  - **At start-up** it runs a self-test that moves nothing: chip, flash, PSRAM, motor-driver fault line and idle current, encoder pull-ups, I2C scan, IMU identity, data and interrupt line, battery voltage, an RGB colour cycle and two beeps.
  - **Everything else runs on command:** `buttons`, `rgb`, `buzz`, `imu`, `scan`, `bat`, `motor 1|2`, `enc`, `servo 1-4|all`, `us`, `line`, `stop` (type `help`).
  - **Upload:**
    ```bash
    arduino-cli compile --upload -p /dev/cu.usbmodem101 -b esp32:esp32:esp32s3:CDCOnBoot=cdc,FlashSize=8M,PartitionScheme=default_8MB,PSRAM=enabled firmware/v2_bringup
    ```
  - **Talk to it:** type commands in a serial monitor at 115200, e.g. `arduino-cli monitor -p /dev/cu.usbmodem101 -c baudrate=115200`, or the Arduino IDE Serial Monitor.
- **Then the add-ons**, each on its own:
  - **Sensors:** power each sensor alone first, on a current-limited supply: 3.3 V, about 50 mA for the ultrasonic, about 100 mA for the line sensor. Measure the ultrasonic's Echo high level, and check the line module's pin order (errata E-005, E-009).
  - **Servos:** one servo first, then all four together while watching VMOT.
  - **Motors:** first check each motor's plug **with the board unpowered** (switch OFF, USB out). With the motor plugged in, the meter on Ω must read the motor coil (a few ohms) between socket pins 1 and 2, the left end with the ESP32 at the top. If the coil reads between pins 5 and 6, the plug is reversed (errata E-015): fix the cable before any motor command. Then run one motor at a time, wheels off the table.
  - **Plug test:** try whether a Qwiic (4-pin) plug can be forced into a motor (6-pin) socket (errata E-013). Use an unpowered board.

## 7. Record
- Fill in the Bring-up findings tables in `RoboCore_V2_errata.md`, one line per finding, with the board serial.
- Note the measured 3V3, VMOT and idle current for each board here:

| Board | 3V3 (USB) | 3V3 (battery) | VMOT | Idle current at 3.7 V | Notes |
|---|---|---|---|---|---|
| V2-01 | | | | | |
| V2-02 | | | | | |

## Results

**ESP32 check over USB, 2026-11-06** (first board plugged in, switch ON; esptool 5.3.1 `flash-id`, read only):

| Item | Read from the chip | Expected | |
|---|---|---|---|
| Port | `/dev/cu.usbmodem101`, USB-Serial/JTAG | Native USB | ✓ |
| Chip | ESP32-S3 (QFN56), revision v0.2 | ESP32-S3 | ✓ |
| Features | Wi-Fi, BT 5 (LE), dual core + LP core, 240 MHz | | ✓ |
| PSRAM | Embedded 2 MB (AP_3v3) | 2 MB (N8**R2**) | ✓ |
| Flash | 8 MB, quad, 3.3 V (manufacturer 0x20, device 0x4017) | 8 MB (**N8**R2) | ✓ |
| Crystal | 40 MHz | 40 MHz | ✓ |
| MAC | 10:bd:a3:6e:25:c4 | | Identifies this board |

It connected without needing BOOT/RESET, so USB data lines, the module's power and EN all work.

**Self-test, 2026-11-06, same board (MAC …25:c4), on USB with the switch ON: 9 passed, 0 failed.**

| Check | Reading |
|---|---|
| Flash / PSRAM | 8 MB / 2048 KB |
| Motor driver nFAULT | High (no fault); idle current 0 mA on both motors |
| Encoder pull-ups | All four inputs high with no motor plugged in |
| I2C | Only 0x6A (the IMU) |
| IMU | WHO_AM_I 0x6C; flat on the table 0.01, 0.02, 1.01 g; gyro under 1 dps; INT1 52 pulses in 0.5 s (104 Hz); die temperature 38.7 °C |
| Battery pin (IO4) | 4.05 V on USB (the charger's output; no cell fitted) |
| RGB LED, buzzer | Ran; Fred to confirm by eye and ear |
