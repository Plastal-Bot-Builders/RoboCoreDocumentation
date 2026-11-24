# RoboCore V2.1 controller: order files (2026-11-24)

**Not ordered.** These replace `fab/PCBWay_V2.1_2026-11-15` and the 2026-11-23 set (neither was ordered; the 11-23 set lacked fix 6). Same outline, mounting holes, PCB options and assembly options as the V2.0 order (`fab/PCBWay_V2_2026-10-08/ORDER_NOTES.md`, PCBWay YU1827457). Every connector stays where it was, except the motor sockets and the Qwiic socket (see 1 and 4).

## What changed from V2.0
1. **Motor sockets J301/J302 are JST PH 2.0 6-pin vertical (B6B-PH-K-S, LCSC C131342), the same connector as on the DG01D-E motors.**
   - Pin order: 1 M+, 2 M−, 3 3.3 V, 4 Enc A, 5 Enc B, 6 GND. Pin 1 is the square pad at the left end. This is the motor socket's own order.
   - A straight PH-to-PH 6-pin cable (pin 1 to pin 1) connects board and motor. No special or reversed cable is needed. This closes E-015.
   - The contacts are rated 2 A. The motor current limit stays at 1.0 A.
   - The sockets sit 1.6 mm closer to the top edge than the SH ones did. Their bodies are about 0.6 mm from the RGB LED, the expansion sockets and the M2 screw heads.
2. **Cell protection on the board: U106 XySemi XB8089D0 (LCSC C2760005)**, in the cell's minus lead above the XT30. It closes E-001, E-002 and E-012.
   - It cuts off below 2.90 V; USB charging brings it back. It also cuts off above 4.25 V, above 10 A for 10 ms, and at a short (40 A).
   - **The battery pack is now cells + holder + XT30 lead. It needs no protection board.**
   - R127 2.2 kΩ and C123 100 nF feed U106's supply pin. D108 (BZT52C5V6T-7) keeps that pin under its 6 V limit if a 2S–4S pack is plugged in. The input protection still cuts such a pack off.
   - The input-protection control parts (Q105, R124, C121, U105, R126, C122) now return to the cell's minus, so U106 can start before the board loads the cell. D107 is now a 1N4148WT (SOD-523) fed from BATP_S.
3. **Header resistors 1 kΩ, and 1 kΩ on the expansion IMU INT1, USER, buzzer and RGB out (E-004, E-007). EXP B pin 12 is not connected (E-003).** Same as the 2026-11-15 files.
4. **Moved parts.**
   - J201 (Qwiic) is turned to 0° and moved 4 mm down the right edge. The cable still plugs in from the top.
   - D107 and R123 moved next to C121, and R124 sits in parallel with C121. R105 moved next to U102's PROG1 pin.
   - FID102 is now on the right edge at (166, 85).
5. **Silkscreen.**
   - "1S 4.2V MAX + BAT −" and "QWIIC" moved to the back, because U106 and the moved Qwiic took their spots on top.
   - On top, "MOTOR 1" sits below its socket, and "MOTOR 2" is vertical beside its socket, with the small RoboCore logo turned under it.
   - The back carries the IO legend, NC at EXP B 12 and REV 2.1.
6. **Battery path between the input-protection FETs Q103/Q104 (pre-order check, 2026-11-24; E-017).**
   - On V2.0 and the 11-23 files, the gate track from Q103 to Q104 ran down the 0.9 mm gap between the two FETs' source pins. It split their shared source copper in two, so all the battery current crossed a 0.3 mm track (0.23 mm for 1 mm). That's about 7 mΩ, and it would heat with both motors stalled and servos working (3–6 A from the cell).
   - The gate now runs round Q103's source pins on the top layer. The two sets of source pins join straight across through solid copper (about 0.3 mΩ). Nothing else moved.

## Counts and checks
- **BOM:** 63 lines, 141 parts, each with an exact MPN and LCSC number. **Assembly:** 130 SMD and 11 through-hole (the two PH sockets are through-hole now). BOM and CPL are byte-identical to the 11-23 set; only the copper changed.
- **DRC (KiCad 10):** 0 errors, 0 unconnected, schematic parity clean. There are 25 warnings:
  - 14 come from V2.0: silkscreen overlaps, silk-to-edge, the J403/H103 courtyard and the U104 library note.
  - 8 are courtyard overlaps at the PH sockets (D201, J405/J406, H101/H102 and the ESP32 keep-out) plus C117/U106. The parts' bodies don't touch; their courtyards just overlap.
  - 2 are silk overlaps where D201's outline touches J301's.
  - 1 is the J404 label box touching R124's pad corner. The fab clips silk off pads.
- **How it was made:** `tools/eco_v21b.py` changed the routed V2.1 board in place (stage `fetlink` for fix 6). Fred's V2.1 copy before the change is in `RoboCore_V2-backups/V2.1_before-PH-and-protection_2026-11-23/`; the board and order files before fix 6 are in `RoboCore_V2-backups/V2.1_before-FET-link_2026-11-24/`.
- **Files** in `RoboCore_V2_Controller/`: Gerbers zip (MD5 eb244a14…), BOM, CPL, assembly PDFs and renders.

## Before ordering
- **Motor pin 1:** plug one straight PH 6-pin cable into a motor, then check with a meter. The coil (a few ohms) must be between the two wires at the end that will sit on the board's pin 1 (the square pad). If it's at the other end, buy reversed-direction cables instead. The board stays as it is either way.
- **Boost feed (from V2.0, not changed here):** the battery current to the boost switch Q102 runs through a 0.3 mm inner-layer track about 25 mm long. Widen it before a production run.
- **Chassis:** tell the Mechanical-Design chat about the new socket height. The PH header with its plug stands about 8 mm tall, where the SH socket stood 4.25 mm.
- Ask PCBWay for a fresh parts quote.
