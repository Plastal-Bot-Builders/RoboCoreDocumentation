# RoboCore V2.1 controller: order files (2026-11-15)

**Superseded by `fab/PCBWay_V2.1_2026-11-24` (JST PH motor sockets, on-board cell protection, FET-link fix). Kept for history.**

**Not ordered.** These are the files for the next controller run. Same outline, mounting holes, connector positions, PCB options and assembly options as the V2.0 order (`fab/PCBWay_V2_2026-10-08/ORDER_NOTES.md`, PCBWay YU1827457), so the robot chassis fits unchanged.

## What changed from V2.0 (errata in `docs/RoboCore_V2_errata.md`)
1. **Motor sockets J301/J302 (E-015).** XRP motors and SparkFun's cables now plug straight in. The footprint is KiCad's BM06B-SRSS-TB numbered from SparkFun's end (`RoboCoreV2:JST_SH_BM06B-SRSS-TB_1x06-1MP_P1.00mm_Vertical_XRP`) and turned 180°: pins toward the board edge, the two mounting tabs toward the middle, pin 1 (motor +) on the left. That is SparkFun's arrangement on the XRP Controller.
   - **For the assembler:** the socket fits only one way (tabs on the two large pads). The pin-1 mark on the silkscreen is the XRP pin 1, which is JST's pin 6, so place the part by its pads, not by the JST pin-1 mark.
2. **Header resistors 1 kΩ (E-007).** R401–R413 were 330 Ω.
3. **Expansion pins (E-003, E-004).**
   - 1 kΩ now sits between the header and the board's own parts on IMU INT1 (R414, EXP B 10), USER (R415, EXP B 11), the buzzer (R416, EXP A 10) and the RGB LED's data out (R417, beside the LED, EXP A 11).
   - **EXP B pin 12 is not connected** (it was EN, next to VSYS_SW).
   - SDA/SCL (EXP B 3/4) are still direct: there is no room beside J406 on this outline.
4. **Silkscreen (E-016).**
   - The back has an IO legend: buzzer IO47, RGB LED IO48, USER IO42, BOOT IO0, IMU I2C 0x6A. The top has no room beside those parts.
   - The back pin names read NC at EXP B 12, and the back text reads REV 2.1.
   - The edge line on the top has a 3 mm gap at R417.
5. **Battery (E-001, E-002, E-012).** Each battery pack gets a 1S protection board rated 8 A or more. No fuse on the board: there is no room for one on this outline.

## Counts and checks
- **BOM:** 61 lines, 137 parts. Four new resistors; R401–R413 moved from the 330 Ω line to the 1 kΩ line (C106235). There are no new part types.
- **Assembly:** 128 SMD, 9 through-hole.
- **DRC (KiCad 10):** 0 errors, 0 unconnected, schematic parity clean. The same 14 warnings as V2.0: 8 silkscreen overlaps, 4 silk-to-edge, the J403/H103 courtyard note and one library mismatch (U104).
- **How it was made:** `tools/eco_v21.py`, which changed the routed V2.0 board in place. Only the copper around the motor sockets and the new resistors was re-routed.
- **Files:** `RoboCore_V2_Controller/`: Gerbers zip (MD5 501de428…), BOM, CPL, assembly drawings zip (PDFs and renders, no .md).

## Before ordering
- Re-test the motors and encoders on a V2.0 board with a reversed cable (E-015). That checks the motor circuit itself, which V2.1 doesn't change.
- Check E-014 (motors on USB with no battery) once the motors run.
- Ask PCBWay for a fresh parts quote. Prices moved since October.
