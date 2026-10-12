# RoboCore V2 — sourcing (stock snapshot 2026-10-05)

Stock was checked on 2026-10-05: Digi-Key through its API (`tools/dk_check.py`), LCSC on its website. The numbers change daily, so re-check them before ordering. The LCSC numbers are also stored in each part's `LCSC` field in the schematic, so the assembly BOM can be exported straight from KiCad.

## Named parts
| Refs | Part | Maker / MPN | LCSC # | LCSC stock | Digi-Key stock | Alternate / note |
|---|---|---|---|---|---|---|
| U201 | MCU module | Espressif ESP32-S3-WROOM-1-N8R2 | C2913204 | 2,898 | **0** (active) | **ESP32-S3-WROOM-1-N16R2**: drop-in with 16 MB flash, +$0.45 (LCSC C2913205: 1,254; Digi-Key: 7,123). N8 also works. Never use an R8 or R16V module (their octal PSRAM takes IO35–37) |
| U301 | Dual motor driver | TI DRV8411ARTER | C18816315 | 129 (+14,712 from LCSC partner suppliers) | 7,402 | — |
| U103 | 3.3 V buck-boost | TI TPS63001DRCR | C28060 | 11,776 | 18,809 | — |
| U104 | 5.5 V boost | TI TPS61089RNRR | C165129 | 13,137 | 5,989 | — |
| U102 | Charger | Microchip MCP73871-2CCI/ML | C5121473 | **164** | 9,956 | Buy from Digi-Key if LCSC runs short |
| U202 | IMU | ST LSM6DSOXTR | C481766 | 4,042 | **0** (active) | **LSM6DSO32TR**: same pins and registers, ±32 g range (Digi-Key 1,958; LCSC 0). Between the two parts, both distributors are covered |
| U101 | USB ESD | ST USBLC6-2SC6 | C7519 | 41,855 | 147,782 | — |
| U105 | Battery over-voltage detector | TI TPS3700DDCR | C33002 | 14,237 | 0 (active) | — |
| Q103, Q104 | Battery input switch (P-FETs) | Vishay SI7655DN-T1-GE3 | C727830 | 2,743 (3 needed per board with Q102) | 16,756 | — |
| D107 | Reverse-block diode | Vishay 1N4148WS-E3-08 | C129905 | 338,800 | — | any 1N4148WS (SOD-323) |
| D106 | VBUS TVS | Littelfuse SMF5.0A | C151296 | 33,400 | 66,058 | Vishay SMF5V0A |
| F101 | 1.5 A resettable fuse | Bourns MF-MSMF150/24X-2 | C78695 | 7,175 | 56,127 | — |
| Q101 | Power-switch P-FET | AOS AO3401A | C15127 | 317,830 | 383,032 | — |
| Q102 | Boost input switch (P-FET) | Vishay SI7655DN-T1-GE3 | C727830 | 2,743 | 16,756 | — |
| Q201, Q105 | Buzzer driver, battery-switch enable | AOS AO3400A | C20917 | 420,410 | 292,013 | — |
| D202 | Buzzer flyback diode | Diodes Inc 1N4148W-7-F | C83528 | 231,360 | 416,216 | onsemi 1N4148W |
| L101 | 3.3 V inductor | Bourns SRN4018-2R2M | C913207 | 2,580 | 70,470 | — |
| L102 | Boost inductor | Bourns SRP5030CA-2R2M | C2046809 | 1,180 | 50,661 | Coilcraft XAL5030-222MEC (sold by Coilcraft directly) |
| D201 | RGB LED | Worldsemi **WS2812B-2020-V6** | C52917434 | 703,935 | not sold | **Must be V6**: V6 is rated 3.3–5.3 V. The older WS2812B-2020 (C965555, no longer available) needs 3.7 V, and most 2020 clones (e.g. XINGLIGHT) need 3.5 V; this LED runs on 3.3 V. Same pads as KiCad's WS2812B-2020 footprint |
| D101, D105 | Red LED | Lite-On LTST-C191KRKT | C125099 | 194,000+ | 1,481,793 | — |
| D102, D104 | Green LED | Lite-On LTST-C191KGKT | C125098 | 222,820 | 2,302,227 | — |
| D103 | Blue LED | Lite-On LTST-C191TBKT | C99290 | 372,000+ | 350,243 | — |
| BZ201 | Buzzer | Same Sky CMT-8504-100-SMT-TR | C22359707 | **28** | 31,076 (active) | Buy from Digi-Key. One older LCSC listing (C3811795) says "not recommended for new", but Digi-Key lists the part as active |
| SW101 | ON/OFF slide switch | C&K JS102011SAQN | C221660 | 0 (+5,499 from partner suppliers) | 54,414 | — |
| SW201–203 | Tactile switches | Alps SKQGADE010 | C116647 | 66,020 | 111,885 | — |
| J101 | USB-C | HRO TYPE-C-31-M-12 | C165948 | 413,705 | not sold | LCSC / JLC standard part |
| J102 | Battery | AMASS XT30UPB-M | C428721 | 53,260 | not sold | — |
| J301, J302 | Motor connectors | JST BM06B-SRSS-TB | C160392 | 21,070 | 30,658 | — |
| J201 | Qwiic | JST BM04B-SRSS-TB | C160390 | 46,390 | 116,814 | — |

## Generic parts (part numbers chosen when the production BOM is made)
- **Resistors:** 0402, 1 %, thick film. These values set behaviour, so keep them at 1 %:
  - R301/R302 16.5k (motor current limit 1.0 A);
  - R112–R116 (boost voltage and frequency);
  - R104/R121 (charger input threshold).
- **Capacitors:** X5R/X7R. Ceramic caps lose much of their capacitance under DC voltage, so use these voltage ratings:

  | Where | Rating |
  |---|---|
  | 3.3 V caps | 6.3 V min |
  | Battery / VSYS / boost-input caps (incl. C111) | 10 V min |
  | USB 5 V caps (C101, C102) and C113 | 16 V |
  | VMOT 5.5 V caps (C117, C118, C119, C303, C401, C402: 22 µF 1206; C301: 10 µF 0805; C302) | 16 V min (25 V better for the 22 µF ones) |

- **Pin headers:** 2.54 mm, gold flash, through-hole:
  - 1×3 male ×4 (servos)
  - 1×4 male (ultrasonic)
  - 1×5 male (line follower)
  - 1×14 female ×2 (expansion)
- **Not on the BOM** (part of the PCB itself): fiducials, mounting holes, test pads TP101–105, solder jumper JP101.

## Production notes applied to the layout
- **All SMD parts on the top side:** one stencil and one reflow pass. The bottom has only the through-hole pins, test pads and solder jumper JP101, so it stays blank for artwork.
- **Fiducials:** three fiducials on top (FID101–103) for pick-and-place.
- **Passive sizes:** 0402 for small passives; larger only where needed (bulk caps 0805/1206, 0603 for C102 and C113).
- **3D models:** every part now has one. Models downloaded from LCSC/EasyEDA are in `lib/3d/`.
- **Silkscreen:** text at least 0.8 mm. No silkscreen on pads, and no overlapping silkscreen (DRC: 0 silk overlaps, 0 silk over copper). The four remaining "silk at board edge" warnings are the ESP32 module and USB-C outlines that run past the board edge; the fab trims them.
- **Test pads:** 3V3, VMOT, BAT, VSW and GND on the back, for bed-of-nails or probe testing.
