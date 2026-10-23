# RoboCore V2 controller: errata

A running list of known problems with the V2 controller (PCBWay W836287AS1F11 / T-1F12W836287A, files of 2026-10-09), started 2026-10-14 as alexchunlin advised. Add to it from day one of bring-up; never delete a line, close it instead.

**How to add an entry:** next free ID, date, what you saw, what it affects, the workaround on the boards we have, the fix for the next board, and status (Open / Workaround / Fixed in rev …). Severity: **A** can damage the board, battery or a person's work; **B** can damage an add-on part or stops a feature; **C** cosmetic or documentation.

## Design errata (found before the boards arrived)

| ID | Date | Sev | Area | Problem | Workaround on V2 prototypes | Fix for the next board | Status |
|---|---|---|---|---|---|---|---|
| E-001 | 2026-10-14 | A | Power | **A short on VMOT has nothing to stop it.** The TPS61089's current limit doesn't work on an output short (TI SLVA819), the battery path has no fuse, and the pack protection board the schematic assumes (J102: "protection board in the pack") was dropped from the component list on 2026-10-12. Expansion A pins 13–14 (VMOT, GND) and every servo header's pins 2–3 are side by side. | Inline ~5 A fuse in the XT30 lead or a pack protection board rated ≥ 8 A; blanking plug in J405 pins 12–14; caps on unused servo headers; bring up on a 1 A current-limited bench supply. | Fuse on +BATT (~7 A slow, 2410) and/or a boost output disconnect (SLVA819) or eFuse on VMOT; PTC in the expansion VMOT pin. | Open |
| E-002 | 2026-10-14 | A | Power | **A short on VSYS_SW has nothing to stop it.** The MCP73871's battery-to-OUT switch (200 mΩ) has no current limit; a short draws ~10 A. Expansion B pins 13–14 (VSYS_SW, GND) are side by side. | As E-001 (fuse or pack protection; blanking plug in J406 pins 12–14). | Fuse on +BATT; PTC in the expansion VSYS_SW pin; VSYS_SW next to GND only. | Open |
| E-003 | 2026-10-14 | A | Expansion | **EN sits next to VSYS_SW** (J406 pins 12–13) with no series resistor: one stray wire puts 4.2–5 V on the ESP32's CHIP_PU pin. | Blanking plug in J406 pins 12–14. | 1 kΩ in series with EN at the header, or drop EN from the header; re-order the pins. | Open |
| E-004 | 2026-10-14 | A | Expansion | **Six expansion pins have no series resistor**, although `spec_v2.py` says every pin leaving the board does: SDA, SCL (also the IMU and Qwiic), IMU_INT1 (also the IMU), USER_BTN, BUZZER (IO47), RGB_DOUT (the LED's output). VMOT or VSYS_SW on any of them damages the ESP32, IMU or LED. BUZZER/RGB_DOUT and IMU_INT1/USER_BTN are also neighbours. | Teach "nothing but signals on pins 3–11"; blanking plug on the power pins. | 100–220 Ω on SDA/SCL, 1 kΩ on the others, at the header side; fix the spec text. | Open |
| E-005 | 2026-10-14 | B | Sensors | **J403 (ultrasonic) and J404 (line sensor) are unkeyed 2.54 mm pin headers.** A turned plug or swapped wires power the ultrasonic backwards at 3.3 V with up to ~2 A available: the module is ruined (the board survives and resets). Same for a line module with a comparator/op-amp chip; a resistor-only module survives. The planned cabling is nine loose jumper wires per robot. EO (Every Flavor Robotics Discord) called unkeyed connectors "the first thing I think would cause a failure" in a classroom. | One-piece 1×4 / 1×5 housings with a marked VCC edge; printed shroud with a key rib around J403/J404 (Mechanical-Design chat); colour-coded wires; pin-1 dots; first power-up of each sensor on a current-limited supply. | JST PH 2.0 mm (or XH 2.5 mm) keyed connectors in the same pin order, with 1:1 adapter cables to the modules; current limit (PTC or limited switch) on the sensor 3V3 feed. | Open |
| E-006 | 2026-10-14 | A | Sensors | **A sensor wired between VMOT and 3V3** (GND or a signal wire on a servo "+" pin) feeds VMOT into the 3.3 V rail through the sensor's internal diodes, and the TPS63001 can't pull the rail back down: the rail can rise above the ESP32's 3.6 V. | As E-005 (one-piece housings, shroud), so no single wire can land on a servo header. | Keyed sensor connectors; consider a clamp (e.g. a 3.6 V TVS or a small shunt) on the 3.3 V rail. | Open |
| E-007 | 2026-10-14 | B | Sensors / ESP32 | **330 Ω is low for 5.5 V sources.** A sensor powered from VMOT, or VMOT on a header pin, pushes ~4.9 mA into an ESP32 pin; the ESP32-S3 datasheet has no injection-current rating (inputs max VDD + 0.3 V). | Power sensors from 3V3 only. | 1 kΩ on sensor and servo signal lines (~1.6 mA at 5.5 V). | Open |
| E-008 | 2026-10-14 | B | Servos | A servo plug slid one pin off the end can put the signal input on VMOT with + on GND (input diode across VMOT), or turned and slid, reverse the servo straight across VMOT. A plain turned plug is harmless (+ stays in the middle). | Printed collar or end-stop around each servo header. | Shrouded/keyed servo headers, or a collar on the board outline; VMOT fuse (E-001). | Open |
| E-009 | 2026-10-14 | C | Sensors | **J404 pin order (3V3, GND, L, C, R) must match the line module bought.** 3-channel TCRT5000 modules vary. | Fred to photograph the module; make the cable to suit. | Set the connector order to the chosen module. | Open |
| E-010 | 2026-10-14 | C | Mechanical | **Only GND copper sits under the M2 screw heads** (H101–H104: unplated 2.2 mm holes; GND pour on F.Cu and B.Cu starts 1.35 mm from the hole centre, under the ~3.8 mm head; no tracks or other nets within reach). Fine for now. | None needed. | Decide on purpose: keep a deliberate GND ring (or a copper keep-out) under the heads. | Note |
| E-011 | 2026-10-14 | C | Docs | The 2026-10-14 task list named the servo headers J405–J408; they are **J401, J402, J407, J408** (J405/J406 are the expansion sockets). The servo + pin is the VMOT net (5.51 V). | — | Keep refs consistent in the spec and silk. | Note |
| E-012 | 2026-10-14 | C | Docs | J102's schematic description says "protection board in the pack", but the component list of 2026-10-12 has no protection board. One of the two must change. | See E-001. | Match the board, the pack and the list. | Open |
| E-013 | 2026-10-14 | B | Connectors | Not yet checked: whether a JST SH 4-pin (Qwiic) plug can be forced into a JST SH 6-pin motor socket. If it can, one position puts a Qwiic device on the motor outputs. | Try it with real parts at bring-up. | — | Open |

Details, voltages and currents for E-001 to E-009 are in `docs/RoboCore_V2_wrong_plug_check.md`.

## Bring-up findings

Record each board by serial (V2-01, V2-02). Photograph anything odd before touching it.

### Silkscreen mislabels

| ID | Date | Board | Where | Says | Should say | Fix | Status |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

### Design errors

| ID | Date | Board | Symptom | Cause | Workaround (bodge, firmware) | Fix for the next board | Status |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

### Manufacturing defects

| ID | Date | Board | Part / location | Defect (bridge, missing, rotated, cold joint…) | Fixed how | Reported to PCBWay? | Status |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Bring-up checklist hooks
- Before the first battery: run each board from a bench supply (3.7 V, 1 A limit) through an XT30 lead; check 3V3 and VMOT, and the current with the switch off and on.
- Power each sensor alone on a current-limited supply first (3.3 V; 50 mA ultrasonic, 100 mA line), measure the ultrasonic's Echo high level, and confirm the line module's pin order.
- Turn one servo plug round on a current-limited 5.5 V supply and confirm nothing heats (wrong-plug case T3).
