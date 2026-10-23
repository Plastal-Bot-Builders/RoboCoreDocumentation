# RoboCore V2 controller: board renders (shared)

Studio renders of the V2 controller board, for every RoboCore project: the IDE, the website, Figma designs, slides and print. They were made in Blender (Cycles) from the KiCad model on 2026-10-23, in the PCB/inventory chat.

**Source of truth.** The renders are made in the Gypul checkout:
- script: `~/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/tools/blender/render_board.sh`
- full output: `RoboCore_V2/docs/renders/blender/` in that checkout

The script publishes this folder automatically. Don't edit the images here. Ask the PCB chat for new shots or changes.

## The shots

All names start with `robocore-controller-`.

| Shot | What it shows | Good for |
|---|---|---|
| `hero-front` | Three-quarter view from the connector edge: USB-C, XT30 battery plug, sensor and servo headers | Hero images, website, slides, IDE welcome |
| `hero-rear` | Three-quarter view from the other end: ESP32 antenna, motor connectors | Second angle, galleries |
| `edge-low` | Low view along the connector edge | "Plug in here" pages, banners |
| `macro-esp32` | Close-up of the ESP32-S3 module, buttons and IMU, shallow depth of field | Feature callouts ("the brain") |
| `top` | Straight down, no perspective, **40 pixels per mm**, board centred | Interactive pinouts, port diagrams, docs |
| `bottom` | Underside, straight down: RoboCore Zambia and Plastal-Bot Builders artwork | "Designed in Zambia" story, back of flyers |

## Files

| Path | What |
|---|---|
| `full/<name>.png` | Full size (3600 × 2400; `top`/`bottom` 3200 × 2880), **transparent background** with a soft shadow |
| `full/<name>-white.jpg` | Full size on white |
| `web/<name>.png`, `web/<name>.webp` | 1600 px wide, transparent. Use these in the IDE and on the website |
| `web/<name>-white.jpg` | 1600 px wide on white |
| `<name>-parts.json` | Where every part sits in that image (below) |
| `robocore-controller-contact-sheet.jpg` | All six at a glance |

## Part positions: `<name>-parts.json`

```json
{
  "shot": "top", "width": 3200, "height": 2880, "px_per_mm": 40.0,
  "board": {"x0": 210, "y0": 240, "x1": 2931, "y1": 2640, "cx": 1570, "cy": 1440},
  "parts": {"J401": {"x0": 456, "y0": 1204, "x1": 557, "y1": 1508, "cx": 506, "cy": 1356, "visible": true, "in_frame": true}},
  "web": {"image": "web/robocore-controller-top.png", "width": 1600, "height": 1440, "scale": 0.5}
}
```

- **Boxes:** pixel boxes at full size, origin top-left. For the web images, multiply by `web.scale`.
- **`visible`:** false for parts hidden on the far side of the board, i.e. every part in the `bottom` view.
- **`in_frame`:** false when the part is outside a close-up.
- **Uses:** hotspots, labels or highlights on the right part, e.g. "Servo 1 is here".
- **Exact vs approximate:** in the `top` and `bottom` views the boxes match the parts exactly, because there's no perspective. Use `top` for an interactive pinout. In the angled shots each box is the outline of the part's whole 3D shape seen in perspective, so it's larger than the visible part (the XT30's box includes its full height). That's fine for a highlight or a label anchor, but not for a precise hotspot.

## What the parts are

| Ref | Part | Pins, pin 1 first |
|---|---|---|
| U201 | ESP32-S3-WROOM-1-N8R2 (Wi-Fi/Bluetooth, the "brain") | — |
| U202 | LSM6DSOX motion sensor (IMU) | — |
| J101 | USB-C: programming and charging | — |
| J102 | XT30 battery connector (1S Li-ion, 3.0–4.2 V) | GND, BAT+ |
| SW101 | ON/OFF switch | — |
| SW201 / SW202 / SW203 | RESET / BOOT / USER buttons | — |
| J301, J302 | Motor 1, Motor 2 (JST SH 6-pin) | MOT+, MOT−, 3V3, ENC A, ENC B, GND |
| J401, J402, J407, J408 | Servo 1, 2, 3, 4 (3-pin header) | Signal (IO38, IO39, IO35, IO36), 5.5 V, GND |
| J403 | Ultrasonic sensor (4-pin header) | 3V3, TRIG (IO40), ECHO (IO41), GND |
| J404 | Line sensor (5-pin header) | 3V3, GND, L (IO7), C (IO10), R (IO2) |
| J201 | Qwiic I2C (JST SH 4-pin) | GND, 3V3, SDA, SCL |
| J405 | Expansion A (14-pin socket) | 3V3, GND, IR L, IR C, IR R, TRIG, ECHO, Servo 1, Servo 2, Buzzer (IO47), RGB out, IO3, 5.5 V motor power, GND |
| J406 | Expansion B (14-pin socket) | 3V3, GND, SDA, SCL, TX, RX, Servo 3, Servo 4, IO37, IMU INT1, USER, EN, battery power, GND |
| D201 | RGB status LED (WS2812B, IO48) | — |
| BZ201 | Buzzer (IO47) | — |
| D101 / D102 / D103 | Charger LEDs: red CHG, green FULL, blue USB | — |
| D104 / D105 | Power LEDs: green 3V3, red MOT (5.5 V motor power) | — |

**For any wiring guide built from this:** the sensor headers J403 and J404 are not keyed, so a cable can go on backwards. A backwards ultrasonic cable ruins the sensor. Say which way round, and show pin 1. The details are in `RoboCore_V2/docs/RoboCore_V2_wrong_plug_check.md` in the Gypul checkout.
