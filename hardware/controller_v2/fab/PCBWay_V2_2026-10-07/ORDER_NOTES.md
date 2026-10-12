# RoboCore V2: PCBWay order notes (2026-10-07)

Three boards, **2 fully assembled units of each** (turnkey: PCBWay buys the parts, makes the PCBs and assembles them).

- **Checks:** DRC on all three boards: 0 errors, 0 unconnected items, schematic and board match.
- **Warnings left:** the main board has 13 harmless warnings: 12 silkscreen overlaps (from hand edits and footprint outlines at the edge), which the factory trims, plus one intended footprint change (U104's enlarged via pad).
- **Part numbers:** every part on every board has an exact part number and LCSC code. Stock was checked on 2026-10-07.

## What the V1 quote taught us, and what changed for V2
Quote T-1F2W836287A (V1 BOM, 2 units) came to **$294.12**: components $209.19, assembly $29.00, PCB $55.93.

| V1 quote finding | Cost on V1 | V2 status |
|---|---|---|
| C15 (a 2.2 nF capacitor) was bought as an **MPU-6050** at $26.02 each, because its description mentioned the MPU-6050 | $52.05 wasted | Descriptions now say only what the part is. Every line has an exact part number and LCSC code |
| MPU-6050 IMU: old part, $26.02 each | $52.05 | Replaced by **LSM6DSOX** ($3.92, 3,935 in stock) |
| DRV8245 motor driver: **out of stock** | n/a | Replaced by **DRV8411A** (128 at LCSC, 7,400 at Digi-Key) |
| Coilcraft XAL5030 inductor: short supply, $8.70 | $17.40 | Replaced by Bourns SRP5030CA ($1.06) and SRN4018 ($0.35) |
| Resistors/capacitors given only as values: PCBWay chose automotive and anti-surge parts (75k at $0.85, 22 µF at $1.10, 4.7 µF at $1.53) | about $25 | Every resistor and capacitor is pinned to a UNI-ROYAL / YAGEO / Samsung part at $0.001–0.22 |
| CP2102N USB bridge ($8.53) and W25Q32 flash ($2.92) | $22.90 | Not needed: the ESP32-S3 has USB and flash built in |
| BC817-40 part-number query; JST-PH switch connector | n/a | Not used on V2 |
| MCP73871 charger: 7–10 working days | | Still used (144 at LCSC, 9,900 at Digi-Key). Must be the **-2** version |

**Main board changes made for this order:**
- The four mounting holes went from **2.0 to 2.2 mm**, so M2 screws pass. The chassis is designed for M2. Positions are unchanged.
- Part numbers were added for all resistors, capacitors and headers.

**V1 order: cancelled 2026-10-07.** Both cart items (PCB W836287AS1F1 and assembly T-1F2W836287A) were removed before payment, with reason "Change the data".

## V2 quote requests: submitted 2026-10-07, not paid
All six items are in the PCBWay cart with status "Subject to audit". Each assembly has its gerbers, BOM, CPL and assembly-drawings zip attached. Turnkey, 2 assembled of 5 PCBs, no China substitutes.

| Board | PCB product No. | PCB price | Assembly product No. | Assembly fee |
|---|---|---|---|---|
| Main controller (4L, 68 × 60, ENIG) | W836287AS1F3 | $57.43 | T-1F4W836287A | $88.00 |
| Line sensor (2L, 60 × 24, HASL LF) | W836287AS1F5 | $6.50 | T-1F6W836287A | $29.00 |
| Ultrasonic (2L, 46 × 22, HASL LF) | W836287AS1F7 | $6.50 | T-1F8W836287A | $88.00 |

**Price so far:**
- PCBs plus assembly fees: **$275.43**.
- Components are not priced yet; PCBWay fills that in after review. LCSC estimate: about $85.
- FedEx to Zambia is about $35 per quote form. One shipment should cover the lot.
- The quote form showed a $30 order discount.

**Assembly fees:** the line sensor got a $29 fee, while the ultrasonic, with fewer parts, came out at $88, which is the normal minimum. Changing the part counts on the form didn't change it.

## Files to upload (one PCB + assembly order per board)
| Board | Gerber (PCB) | BOM (assembly) | Centroid / pick-and-place (assembly) | Also attach |
|---|---|---|---|---|
| Main controller | `RoboCore_V2_Controller/RoboCore_V2_Controller_gerbers.zip` | `..._BOM.csv` (61 lines, 133 parts) | `..._CPL.csv` (133 placements) | `..._assembly_top/bottom.pdf`, renders |
| Line sensor | `RoboCore_LineSensor/RoboCore_LineSensor_gerbers.zip` | `..._BOM.csv` (10 lines, 23 parts) | `..._CPL.csv` (23) | same |
| Ultrasonic | `RoboCore_Ultrasonic/RoboCore_Ultrasonic_gerbers.zip` | `..._BOM.csv` (11 lines, 13 parts) | `..._CPL.csv` (13) | same |

**Placement files:**
- They use KiCad coordinates in mm, Y negative, with bottom-side parts marked "Bottom". They match the gerbers.
- Approve PCBWay's placement preview before production. Check especially LS1/LS2 and the TCRT5000s, which go on the bottom.

## PCB options
| | Main controller | Line sensor | Ultrasonic |
|---|---|---|---|
| Layers | **4** | 2 | 2 |
| Size | 68 × 60 mm | 60 × 24 mm | 46 × 22 mm |
| Material / thickness | FR-4 TG150, 1.6 mm | FR-4, 1.6 mm | FR-4, 1.6 mm |
| Copper | 1 oz outer, **1 oz inner** (the motor 2 traces run 35 mm on an inner layer) | 1 oz | 1 oz |
| Min track / spacing | 0.15 / 0.15 mm (6/6 mil) | 0.15 / 0.15 mm | 0.15 / 0.15 mm |
| Smallest hole | **0.2 mm** (25 thermal vias in IC pads); vias 0.3 mm | 0.3 mm | 0.3 mm |
| Surface finish | **ENIG**: 0.5 mm-pitch QFNs, an LGA IMU and the ESP32 module | HASL lead-free is fine (ENIG optional) | HASL lead-free is fine |
| Solder mask / silkscreen | Green / white (the renders) | Green / white | Green / white |
| Vias | Tented. Thermal vias in pads are open, not filled; that is standard | Tented | Tented |
| PCB quantity | 5 (PCBWay minimum; 2 get assembled) | 5 | 5 |

## Assembly options
- **Main controller:**
  - Top side: 126 SMD parts.
  - 7 through-hole parts, soldered from below: XT30 J102, servo headers J401/J402/J407/J408, sockets J405/J406.
  - Nothing is mounted on the bottom.
  - JP101 is a copper solder jumper, already bridged 1-2; it needs no part.
- **Line sensor:**
  - Top side: SMD.
  - The 3 TCRT5000s are through-hole, **inserted from the bottom** with the sensor facing the floor, body flat on the board, and soldered on top. Pin 1 is the square pad.
- **Ultrasonic:**
  - Top (rear) side: SMD.
  - The 2 transducers are through-hole, **on the bottom side**, which is the front. Their "+" pin is the square pad.
  - **The TX and RX transducers are different parts:**
    - LS1 = HY40A16**T**12-1 (transmitter);
    - LS2 = HY40A16**R**12-1 (receiver).
- **Small boards:** the two sensor boards are under 60 mm. If PCBWay wants process edges or a panel for SMT, accept it; it's normal for small boards.
- **Substitutes:** allowed for resistors and capacitors only, at the same value, size and rating or better. Ask before substituting anything else.

## Parts to watch
| Part | Board | Note |
|---|---|---|
| **CS100A** ultrasonic chip (U1) | Ultrasonic | **Not at LCSC.** Ask PCBWay to source it in China (AliExpress / 1688; maker Suzhou ShunGuiZhiLian, 100sensor.com). If they can't, buy 2–3 on AliExpress, ship them to PCBWay and mark the line "consigned" |
| C&K **JS102011SAQN** ON/OFF switch | Main | LCSC: 0 in stock. Digi-Key: 54,000+. PCBWay sources globally; confirm in the quote |
| CUI **CMT-8504** buzzer | Main | LCSC: 12 left (enough for 2). Digi-Key: 30,000+ |
| **MCP73871-2CCI/ML** charger | Main | Must be **-2** (4.20 V). Other suffixes charge to the wrong voltage |
| **ESP32-S3-WROOM-1-N8R2** | Main | Alternative: N16R2. **Never R8 / R16V**: their octal PSRAM uses IO35–37, which drive servos 3/4 |
| DRV8411ARTER | Main | 128 at LCSC: fine for 2 |

## Cost estimate (2 units of each)
| | Main controller | Line sensor | Ultrasonic |
|---|---|---|---|
| Components at LCSC prices (PCBWay adds margin and some loss allowance) | about $67 (V1 quote: $209) | about $12 (TCRT5000 $1.76 each) | about $3 + CS100A (about $1–2 each) |
| PCB, 5 pcs | about $56 (V1 4-layer ENIG quote) | small 2-layer: usually under $10–15 | under $10–15 |
| Assembly | about $29 on the V1 quote (2 units); V2 adds through-hole joints | similar fee per design | similar fee per design |

**Rough total:**
- About $300–330 including FedEx to Zambia (about $35 on the V1 order).
- That is about the same as V1 alone, but for **three** assembled boards.
- PCBWay's quote is the real number. Check it against this.

## Before you press "submit"
1. Each order shows **2 assembled units** (and 5 bare PCBs).
2. The quote's "Actual Purchase Mfg Part #" column matches our part numbers; nothing unexpected like the C15 MPU-6050.
3. The CS100A line says "sourced" or "consigned".
4. The placement preview shows the bottom-side through-hole parts on the bottom.
