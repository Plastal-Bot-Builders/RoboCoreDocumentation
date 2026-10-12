# RoboCore

RoboCore is a classroom robot platform designed and built in Zambia by Plastal-Bot Builders (Lusaka): an
ESP32-based controller board, a 3D-printed differential-drive chassis with an excavator-style arm, sensor
boards, and the software around them. This repository holds the design sources: the PCBs, the mechanical
design and the software. Pitch decks, grant applications and community posts live elsewhere.

## Layout

```
hardware/        PCB design (KiCad 9)
  controller_v2/   RoboCore V2 controller: ESP32-S3, two encoder motor drives, four servo ports, IMU,
                   JST SH sensor sockets, 1S Li-ion with USB-C charging. Project files, project
                   libraries (lib/), PCBWay order packages (fab/), generator and check scripts (tools/),
                   silkscreen artwork sources (technicalreference/).
  sensors/         Line sensor (3-channel) and ultrasonic carrier boards for V2.
  controller_v1/   RoboCore V1 (ESP32-C3) controller with its fab package and review scripts.
  libraries/       Shared symbol and footprint libraries used by V1.
  datasheets/      Component datasheets.
mechanical/      Mechanical design
  robot_v2/        The Fusion 360 robot (rev 5): RoboCore_V2_Robot.f3d and .step, the Python generator that
                   builds it through the Fusion API (fusion/), printable parts (print/), per-component STEP
                   exports (export/components/, including the cable assemblies), the retail mailer box and
                   insert (packaging/), the cardboard template work (cardboard/), vendor models (vendor/)
                   and renders.
  board_step/      STEP models of the three boards for mechanical integration.
  reference/       Motor and XRP reference pictures and models.
  chassis_v1_spec/ Specification and script of the V1 chassis.
software/        Software
  firmware/motion/ arm_decel_limiter: braking-acceleration limiter tied to the arm deploy angle (C, with tests).
  ide_design/      Design-only RoboCore IDE UI (Figma plugin that builds the screens).
docs/            Specification, mechanical and sensor notes, sourcing and costing, schematic PDFs,
                 component lists, photos, progress renders and the A4 technical-reference posters.
```

## Opening the designs
- PCB: open `hardware/controller_v2/RoboCore_V2.kicad_pro` in KiCad 9. Project libraries resolve through
  `${KIPRJMOD}/lib`. The V1 project's symbol table points at `../libraries`.
- Mechanical: `mechanical/robot_v2/RoboCore_V2_Robot.f3d` opens in Fusion 360; the STEP beside it opens
  anywhere. `mechanical/robot_v2/README.md` explains the generator and the chassis parameters.
- Packaging: `mechanical/robot_v2/packaging/README.md` (print files are 1:1 PDFs).

## Status
Controller V2 is routed and DRC-clean and on order at PCBWay; the sensor boards were dropped from that order.
The robot chassis is at rev 5 with the arm module, bus groove and sonar pod. See `docs/` for the specification
and the current component list.

## Licence
MIT, see `LICENSE`. Vendor models under `mechanical/robot_v2/vendor/` keep their own licences, noted in each
folder's `SOURCE.txt`.
