# RoboCore V1 — rework summary (2026-10-01)

## Result
| Check (PCBWay rules) | Start (2026-09-30) | Now |
|---|---|---|
| DRC errors | 41 | **0** |
| Unconnected nets | 5 | **0** |
| Board vs schematic differences | 31 | **0** |
| ERC errors | — | **0** |

The remaining 155 DRC warnings don't affect manufacturing:
- **83 come from the board artwork,** which was kept on purpose. It crosses pads or the board edge in places, or overlaps a part outline (J2 sits inside its drawn box), and PCBWay trims the silkscreen over pads automatically.
- **72 are library-link housekeeping:** footprints differ from their library copies, and the RoboCore footprint libraries aren't in the project's library table.

## What changed

### Power
- **Battery:** 1-cell Li-ion pack (3.0–4.2 V), made of 3–4 × 18650 cells **in parallel** with a protection board.
  - It plugs into **J2, an XT30 connector**.
  - Square pad = **−**, round pad = **+**; both are marked on the silkscreen.
- **Charging over USB-C:**
  - The MCP73871 is kept and set to **1 A charge current** (R8 = 1 kΩ) and 100 mA termination (R9 = 10 kΩ).
  - It runs in high-current input mode (SEL high).
  - The safety timer is off (TE high), because a large pack would time out before it was full.
- **6 V motor rail:** a new **TPS61089 boost converter** on the bottom side takes the battery up to 6.06 V for both DRV8245 drivers.
  - Inductor L1 is a Coilcraft XAL5030-222.
  - It switches at about 516 kHz with a 5.1 A switch-current limit.
  - The boost is always enabled while a battery is connected.
- **3.3 V:** the LM1117 was replaced with a **TLV1117LV33**. It uses the same footprint but has a much lower dropout, so the ESP32 keeps running as the battery drains.
- **Power switch:** **J5** (JST-PH 2-pin) takes a chassis ON/OFF switch; **closed = ON**.
  - Q3 (AO3401A) switches the system rail.
  - Charging still works with the switch off.
- **Standby drain:** about 0.25–0.4 mA with the switch off, from the boost, the battery-sense divider and the charger. Unplug the battery if the robot will sit unused for months.

### Programming over USB
- The USB chip is now the **CP2102N 24-pin version (CP2102N-A02-GQFN24)**, which has the DTR signal.
- With Q1/Q2 it drives EN and IO9 automatically: plug in USB-C and click Upload in Arduino IDE, PlatformIO or esptool, with no buttons.
- The **BOOT button is now on IO9**, the pin the ESP32-C3 actually boots from. **RESET** is on EN.

### Other fixes
- The motor drivers' **nSLEEP is now driven by the ESP32 (IO6)**.
- Both drivers' fault outputs are combined onto IO5.
- **Battery voltage sense** on IO0: a 100 k/100 k divider plus a 0.1 µF filter.
- 0.1 µF decoupling at each driver's supply pin.
- Part values corrected: the MPU-6050's charge-pump capacitor is now 2.2 nF, and the bad entries "0.uf" and "5.1k1" are fixed.
- The USB-C connector is now the HRO TYPE-C-31-M-12 (16-pin, USB 2.0).

### Layout
- All parts were re-placed. The boost converter and a few small parts are on the **bottom side**, so assembly is double-sided.
- The whole board was re-routed:
  - Signal tracks are 0.2 mm, with a few 0.15 mm necks at fine-pitch pins.
  - Vias are 0.6/0.3 mm.
  - Every via meets PCBWay's 0.15 mm minimum ring.
- Silkscreen:
  - **The artwork was kept intact.** R40, C33 and R33 were moved off the "RoboCore" title.
  - XT30 polarity marks were added.
  - The "CHARGER" label is now 90% size and 2.3 mm further left.
  - The small Arduino logo, which sat under J5, was removed.
  - 21 reference labels were moved. 38 have no free space and are hidden, but they're still in the assembly files.

## ESP32-C3 pin map — update the firmware
| GPIO | Function | Notes |
|---|---|---|
| IO0 | VBAT_SENSE | Battery ÷ 2. Use the 11 dB ADC attenuation; V_batt = 2 × reading |
| IO1 | PWM_A | |
| IO2 | DIR_A | Strapping pin; has a 10 k pull-up, so leave it alone until after boot |
| IO3 | PWM_B | |
| IO4 | DIR_B | |
| IO5 | nFAULT | Both drivers, active low |
| IO6 | nSLEEP | Both drivers. **The firmware must drive this.** The DRV8245H needs the nSLEEP wake/reset pulse after power-up (see "device power-up" in the DRV8245 datasheet) before it will run; IO5 going high confirms it |
| IO7 / IO10 / IO18 / IO19 | SPI MISO / MOSI / CS / CLK | W25Q32 flash (U6) |
| IO8 / IO9 | I2C SDA / SCL | MPU-6050 at 0x68 (AD0 tied to GND). IO9 is also BOOT |
| TXD / RXD | UART to the CP2102N | Serial monitor + upload |

## Bring-up checklist for the first boards
1. **Power the boost first, without motors or ESP32 load.**
   - Use a current-limited bench supply at 3.7 V (≈ 300 mA limit) on J2 instead of the pack.
   - Check the **+6 V rail reads about 6.0 V** and nothing is warm.
2. **Close the J5 switch** and check that **3.3 V** comes up.
3. **Plug in USB-C only** and check the charge LEDs.
   - With a partly discharged cell, the charge current at J2 should be about 1 A.
4. **Upload a sketch over USB**; it should work with no button presses.
5. **Test the motors.**
   - Run them with the nSLEEP wake sequence.
   - Watch +6 V on a scope at motor start-up. The boost compensation values (R34 9.1 k, C29 10 nF, C30 22 pF) are calculated from the TI datasheet, not yet measured.
   - If the rail rings or oscillates, these three parts are the ones to tune.
6. **Calibrate the battery reading** on IO0 against a multimeter.

## Files
- **PCBWay outputs:** `fab/PCBWay_RoboCore_V1_2026-10-01/` (see `ORDER_NOTES.md` there).
- **Renders:** `review/progress_2026-10-01/` (before_top, after_top, after_bottom).
- **Scripts:** in `review/`, so the work can be repeated.
  - `sch_edit.py`: schematic changes.
  - `pcb_sync.py`, `rework1–7.py`, `astar_route.py`, `smooth.py`: layout.
  - `final.sh`: silkscreen pass, install and checks.
  - `fab_export.sh` + `bom_finish.py`: PCBWay outputs.
- **Backups:**
  - `RoboCore-backups/before-power-rework_2026-10-01/` has the original schematic sheets, board and project file. `RoboCore_pre-install_1740.kicad_pcb` is the board exactly as it was before this install.
  - Older: `RoboCore-backups/RoboCore_before-claude-fixes_2026-09-30.kicad_pcb` and `RoboCore_before-pcbway-rules_2026-10-01.kicad_pro`.

## For V2
- Replace the **MPU-6050** with a current IMU; the MPU-6050 is an older part with uncertain supply.
- Swap the tantalum capacitors (C5, C7, C9, C11) for ceramics.
- Add an enable control on the boost (U7 EN) if standby drain matters.
- Library cleanup: add the RoboCore footprint/symbol libraries to the project library tables to clear the 72 library warnings.
- Make room for the 38 hidden reference labels.
