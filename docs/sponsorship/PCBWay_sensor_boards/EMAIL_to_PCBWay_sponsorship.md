# Sponsorship request to PCBWay: line sensor and ultrasonic boards

## Before you send
1. **Decide the connectors (important).** The two sensor boards still have the JST SH sockets from 5 October, but the controller now has 2.54 mm pin headers (J403: 3V3, TRIG, ECHO, GND; J404: 3V3, GND, L, C, R). As they are, the sensors would need special cables. Recommended: change both sensor connectors to 2.54 mm headers in the same pin order, so a straight 4- or 5-wire Dupont cable fits and our boards become drop-in replacements for the bought HC-SR04 and 3-channel modules. The Gerber/BOM/CPL you send should be the final version.
2. **Fill in the [brackets]** in the email: your role, and what you're willing to give PCBWay in return (delete what you won't do).
3. **CS100A (ultrasonic chip):** PCBWay can't buy it from LCSC. The email asks whether they can source it; if not, you'd send it to them (AliExpress/Alibaba).
4. **Optional, helps the application:** a small "Sponsored by PCBWay" logo on the silkscreen of both boards, and agreeing to share the project on PCBWay's community pages (pcbway.com/project). Many sponsored makers do both.
5. **Attachments:** everything in `attachments/` (about 1.5 MB in total). After the connector change, also attach (or upload to the quote) the new Gerber zip, BOM and CPL for each board.
6. **Send to** sponsor@pcbway.com, **cc** Betsy Qiu (service19@pcbway.com), who quoted the boards. If they reply with a link to their online form, fill it in with the same text.

What PCBWay's sponsorship pages say (checked 2026-10-12): students, teachers and engineers can apply; PCB fabrication is sponsored with a coupon, sent within 24 hours of approval; assembly gets a "big discount" for students and teachers but isn't normally free; **shipping is paid by you**. Questions go to sponsor@PCBWay.com. So the realistic outcome is free PCBs plus a discount on assembly. The email still asks for the full job, and they decide.

---

**To:** sponsor@pcbway.com
**Cc:** service19@pcbway.com
**Subject:** Sponsorship request: line-follower and ultrasonic sensor boards for a school robotics kit in Zambia (RoboCore)

Dear PCBWay sponsorship team,

My name is Fredrick Mwepu, [your role, e.g. founder / lead designer] of RoboCore, a robotics kit for schools in Zambia, built with Plastal-Bot Builders (https://www.plastalbotbuilders.com). I was part of Zambia's team at the FIRST Global Challenge 2022, and I have been part of several initiatives that have reached over 8,000 young people in Zambia. RoboCore is our way of giving schools a robot they can afford, build and program locally.

**The project.** RoboCore V2 is an ESP32-S3 robot controller in the style of the XRP educational robot: two encoder motors, four servos, an IMU, USB-C charging and a 3D-printed chassis with a gripper arm. The first two assembled controllers are in review with PCBWay now (PCB W836287AS1F11, assembly T-1F12W836287A).

To finish the robot we have designed our own two sensor boards, so that schools don't depend on whichever modules a shop happens to sell:
- **Line sensor**, 60 × 24 mm, 2 layers: three TCRT5000 reflective sensors with analog outputs, so students can calibrate to any floor, plus an LM339 that lights a green LED per channel so they can see what the robot sees.
- **Ultrasonic sensor**, 46 × 22 mm, 2 layers: CS100A ranging chip with 40 kHz transducers; it works from 3.3 V and is compatible with HC-SR04 code.

Renders and schematics are attached; the Gerber, BOM and placement files [are attached / have been uploaded to my account].

**What we're asking for.** Sponsorship of PCB fabrication and assembly of **2 assembled units (5 PCBs) of each board**. Your quotes of 7 October for this were about $59 for the line sensor (W836287AS1F5 / T-1F6W836287A) and about $106 for the ultrasonic (W836287AS1F7 / T-1F8W836287A). [Only if you make the connector change: The files have since been updated with 2.54 mm pin headers to match the controller.] We are happy to pay the shipping to Zambia.

The CS100A is not available from LCSC. Could PCBWay source it? If not, we will send the chips to you.

**What we can offer in return.** [Keep the ones you will do:]
- A "Sponsored by PCBWay" logo on the silkscreen of both boards.
- A project page on PCBWay's community with the design files, build photos and test results.
- Posts on our social media and website showing the boards, crediting PCBWay.
- PCBWay credited in the RoboCore build guide and on the classroom posters we print for schools.
- [A short video of the robot following a line and avoiding obstacles with the sponsored sensors.]

These two boards are the last pieces we need before the robots go into classrooms for testing. Thank you for considering our request.

Kind regards,
Fredrick Mwepu
RoboCore, Plastal-Bot Builders, Zambia
https://www.plastalbotbuilders.com
[phone / WhatsApp]

---

### Attachments (in `attachments/`)
| File | What it shows |
|---|---|
| 01_line_sensor_3D.jpg | Line sensor, 3D render |
| 02_line_sensor_top.jpg, 03_line_sensor_underside.jpg | Top (LM339, LEDs) and underside (TCRT5000 sensors) |
| 04_ultrasonic_3D.jpg | Ultrasonic, 3D render |
| 05_ultrasonic_rear.jpg, 06_ultrasonic_front.jpg | Rear (CS100A, crystal, connector) and front (transducers) |
| 07_RoboCore_V2_controller.jpg | The controller the sensors plug into |
| 08_RoboCore_robot.jpg | The robot (rev 5 chassis with arm) |
| 09_line_sensor_schematic.pdf, 10_ultrasonic_schematic.pdf | Schematics |
| (to add) Gerber zip, BOM, CPL for each board | after the connector change |

Sources: [Educational & Engineering PCB sponsorship](https://www.pcbway.com/project/sponsor/learnsponsor.aspx), [PCBWay sponsor page](https://www.pcbway.com/sponsor.html).
