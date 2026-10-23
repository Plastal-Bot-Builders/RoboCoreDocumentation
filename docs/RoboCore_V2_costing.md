# RoboCore V2: cost per robot (2026-10-07)

What one complete robot costs to build: the controller, line sensor, ultrasonic, motors, battery, printed chassis and arm. It is landed in Zambia, assembled in-house, and compared with importing an XRP kit.

**All figures are in USD.**
- PCBWay figures come from its online calculator on 2026-10-07; the 2-unit figures are the quotes actually submitted.
- Component prices are LCSC's for 2026-10-07.
- Items marked *assumed* are estimates. Replace them with real quotes.
- Model: `tools/costing/` (run `python3 cost_model.py` and `python3 cost_down.py`).

## Answer
| Build | Cost per robot (landed, before labour) | Total |
|---|---|---|
| **2 prototypes** (current PCBWay quotes) | **$380–420** | **$760–845** |
| **10 units** | **$226–246** | $2,260–2,460 |
| **20 units** | **$208–225** | $4,150–4,500 |
| 50 units, with the cost-downs below | about $156 | about $7,800 |
| *XRP kit imported (for comparison)* | *$171–213* | |

**What the ranges mean:**
- The ranges span 0 % and 15 % import duty on the assembled boards.
- They do not include labour, about 1.5 h per robot to assemble and test.
- They do not include one-off costs: software, test jig, and design time.

**Verdict:**
- At 10–20 units on today's suppliers, a RoboCore costs about the same as importing an XRP kit, or a little more. The price argument doesn't hold yet at that volume.
- It holds from about 50 units, once the motors come direct from China and the two sensor boards share one assembly job.
- Even then the hardware saving is about 10–25 %. It is not the 2–3× that "in-house" might suggest, because the assembled boards and the motors are still imported.

**Like for like, ours is ahead:**
- It includes a rechargeable 3 × 18650 pack with an on-board charger. The XRP uses 4 × AA cells, which aren't included.
- It has a 2-servo arm; the XRP has 1 servo.
- It adds a buzzer and an RGB LED.
- Without the cells, our 50-unit cost is about $140.

## JLCPCB quotes (2026-10-07, 20 units each, Fred's account; not ordered)
| Board | PCBs | Assembly + JLC-supplied parts | Not in quote (LCSC price) | Per board | PCBWay per board |
|---|---|---|---|---|---|
| Main (4-layer ENIG, Standard PCBA) | $98.69 | $722.35: fees $169.76 + parts $552.59 | J404, U105 (no JLC stock), SW101 (18 short): about $38 | **$42.96** | about $66.50 |
| Line sensor (Economic PCBA, SMD only) | $6.80 | $35.95 | J1 + 3 × TCRT5000, soldered in-house: about $79 | **$6.11** | about $10.70 |
| Ultrasonic (Economic PCBA, SMD only) | $7.20 | $43.41 | CS100A (JLC lists C2840661, 0 stock) + transducers: about $64 | **$5.75** | about $8.10 + CS100A |

**Per robot:**
- Boards including freight cost about **$59 per robot**, against $90 at PCBWay. Freight is an estimate: about $90 by DHL for 3.6 kg.
- Landed and before labour, the whole robot comes to **$141–179** depending on duty and motors (`tools/costing/jlc_scenario.py`).

**Further JLCPCB savings:**
- **Wider thermal vias on the main board:** 0.2 mm vias trigger "high precision" plus a Kelvin test, about $37 per batch. 0.3 mm vias avoid both.
- **Swap pinned passives for JLC "Basic" parts:** each "Extended" part type costs about $3 per batch, which totals $85 on the main board and about $15–19 on each sensor.
- **Fix rotations:** JLC's preview shows some KiCad rotations off, for example J405/J406. Correct the CPL before a real order.

## PCBWay's actual quotation (2026-10-08) and what was ordered
PCBWay priced the parts after review. The parts came to about twice the LCSC estimate at 2 units, because PCBWay buys minimum packs:

| Board, 2 assembled | PCB | Assembly | Parts (PCBWay) | Total | Decision |
|---|---|---|---|---|---|
| Main controller | $57.43 | $88.00 | $144.40 (LCSC estimate $74) | **$289.83** | **ordered**, with J403/J404 back to pin headers |
| Line sensor | $6.50 | $29.00 | $23.79 | $59.29 | dropped |
| Ultrasonic | $6.50 | $88.00 | $11.32 + CS100A supplied by us | $105.82 | dropped |

So the prototype order is the controller only: about **$295 delivered** (FedEx about $35, $30 coupon). The sensors will be bought-in modules (HC-SR04-type, 3-channel line module), about $3–5 together. The custom sensor boards only make sense in a batch, where the $88 minimum assembly fee is spread out.

## JLCPCB re-quote, controller only, 2 assembled (2026-10-12; not ordered)
Current files (headers on J403/J404, labelled silkscreen), Fred's account. Options matched to the PCBWay order: 4 layers, 1.6 mm, ENIG, TG155, 1 oz outer + **1 oz inner**, 0.2 mm vias, order number removed, Standard PCBA top side.

| Item | Price |
|---|---|
| 5 PCBs: base $8 + ENIG $17.20 + 1 oz inner $16.77 + TG155 $3.44 + 0.2 mm vias $17.22 + forced 4-wire Kelvin test $16.90 | $79.53 |
| Assembly of 2: setup $25.75, stencil $8.27, parts (62 lines, all JLC stock) $77.77, feeder loading $88.35, SMT $3.40, placement confirmation $0.45, hand soldering $3.61, manual assembly $1.85, X-ray $3.30, packaging $0.50 | $213.25 |
| **Boards total** | **$292.78** (615 g; DHL extra, about $45–55; account coupons $30 / $20) |

Against PCBWay's $289.83 + $34.88 FedEx − $30 coupon = **$294.71 delivered**, JLC is about $15–25 dearer at 2 units, so the PCBWay order stands (Fred, 2026-10-12). JLC's parts are half PCBWay's price, but its per-order fees (feeders $88, setup $26, the 0.2 mm via + Kelvin surcharges $34) cancel that out at this quantity.

**JLC upload notes** (files in `fab/JLCPCB_V2_2026-10-12/`):
- Standard PCBA needs each side > 70 mm, so JLC adds edge rails (78 × 70 mm). Vias are "Plugged" on 4-layer boards ("Tented" isn't offered).
- U105 (TPS3700DDCR, C33002) comes up unticked because JLC calls the package SOT-23-6 and our footprint TSOT-23-6. It is the same DDC package: tick it, or the battery input never switches on.
- The CPL from KiCad uses pin 1 as the position of pin headers/sockets and the XT30. `RoboCore_V2_Controller_CPL_JLC.csv` there is corrected: J401/J402/J407/J408/J405/J406 at their centres with rotation 270, J403/J404 centred at 0, J102 centred. In JLC's preview J101 (USB-C, about 1–1.5 mm towards the edge) and SW101 (body past the right edge) still look off: use "Confirm Parts Placement" and check them in the DFM result before approving.

## Prototype: 2 assembled units of each board (5 PCBs each), 2026-10-07 (superseded by the section above)
| Board | PCBWay (submitted quotes) | JLCPCB (calculator) |
|---|---|---|
| Main controller | PCB $57.43 + assembly $88 + parts about $101 = **about $246** | PCB $62.76 + assembly/parts $207.23 = $269.99, + J404/U105 loose about $5 = **about $275** |
| Line sensor | $6.50 + $29 + parts about $18 = **about $54** | $5.10 + $28.77 = $33.87, + J1 and 6 × TCRT5000 loose about $12 = **about $46** |
| Ultrasonic | $6.50 + $88 + parts about $15 = **about $110** | $4.00 (+$1.10 lead-free) + $33.61 = $38.71, + CS100A 5-pack $13 + transducers $2 = **about $54** |
| **Boards total** | **about $410** + FedEx about $40 − $30 coupon = **about $420** | **about $375** + DHL about $50 + loose-part postage = **about $430–440** (JLC coupons in the account: $30 / $20) |

**Why JLC's advantage disappears at 2 units:** its per-order fees don't shrink with quantity.
- Loading the main board's 30-odd "Extended" part types costs $86.80.
- The 0.2 mm via surcharges add about $34.
- Setup is $25.75.

**Differences in scope:**
- PCBWay's turnkey quote covers everything: the through-hole sensors and transducers, and sourcing the CS100A.
- JLC leaves the bottom-side through-hole parts and the out-of-stock parts for us to solder or pre-order.

**Recommendation:** keep the PCBWay order for the 2-unit prototype; it is already submitted. Move to JLCPCB for batches of 10 or more, after widening the vias and switching to Basic parts. With those changes, a JLC prototype would also drop to about $300.

## Five makers compared (online calculators, 2026-10-07)
**Parts:** PCBWay, PCBGOGO and Elecrow price the parts after reviewing the BOM. For them, the "parts" figure is our LCSC estimate + 10 %:
- 2 units: about $134;
- 20 units: about $882.

**JLCPCB's** price includes the parts it stocks, plus about $5 (2 units) or $182 (20 units) for parts bought separately. **NextPCB's** includes parts, except the CS100A and one header line.

**2 assembled of each board** (main + line sensor + ultrasonic, 5 PCBs each):

| Maker | PCBs | Assembly fees | Parts | Boards total | Shipping to Zambia |
|---|---|---|---|---|---|
| Elecrow | $87.90 + $6.90 + $6.90 | 3 × ($30 + $12 stencil) | about $134 | **about $362** | DHL $68.80 |
| JLCPCB | in total | in total | in total | **about $375** | DHL about $41–50 |
| PCBGOGO | $87.29 + $5 + $5 | 3 × $50 (rough quote) | about $134 | **about $382** | not shown for Zambia (US $32) |
| PCBWay (submitted) | $57.43 + $6.50 + $6.50 | $88 + $29 + $88 | about $134 | **about $410** | FedEx about $35–40, $30 coupon |
| NextPCB | $129.86 + $18.98 + $18.74 | (in SMT cost) | included | **$637 with promotions, $975 without** | — |
| Seeed Fusion | $149.90 + $9.90 + $9.90 | needs BOM upload | — | PCBs alone $170 | DHL $62.24 (PCBA shipping advertised free) |

**20 assembled of each:**

| Maker | PCBs | Assembly fees | Parts | Boards total | Per robot |
|---|---|---|---|---|---|
| JLCPCB | $112.69 | about $229 (in quotes) | in quotes + about $182 | about $1,097 | **about $55** |
| PCBGOGO | $105.32 + $23.62 + $21.86 | 3 × $50 (rough quote) | about $882 | about $1,182 | **about $59** |
| Elecrow | $118.56 + $16.31 + $14.90 | 3 × $46 + 3 × $12 | about $882 | about $1,205 | **about $60** |
| PCBWay | $103.02 + $24.61 + $23.05 | $535.04 + $88 + $88 | about $882 | about $1,743 | about $87 |
| Seeed Fusion | $221.32 + $16.32 + $14.81 | — | — | PCBs alone $252 | — |
| NextPCB | the calculator would not go above its 5-PCB setting | | | | |

**Takeaways:**
- **2 units:** every maker except NextPCB and Seeed lands at about $420–440 delivered. Keep the PCBWay order.
- **20 units:** JLCPCB, PCBGOGO and Elecrow all come to about $55–60 per robot, against $87 at PCBWay.
- **PCBGOGO and Elecrow** are turnkey: they also solder the bottom-side sensors and source the CS100A. Their figures, though, are rough quotes with parts priced later.
- **Before choosing for a batch,** get formal quotes from PCBGOGO and Elecrow by uploading the BOM. That needs an account.
- **NextPCB and Seeed** are not competitive for these boards. Their 4-layer ENIG PCBs alone cost 1.5–2× the others.

## Where the money goes (20 units, 15 % duty, per robot)
| Item | Cost | Notes |
|---|---|---|
| Electronic components (3 boards) | $44.08 | LCSC price at 20-off + 10 % PCBWay sourcing. Main board $31.44, line $4.59, ultrasonic $4.05 |
| PCBWay assembly | $35.55 | Main $535.04 / 20, line $88 / 20, ultrasonic $88 / 20 |
| PCBs | $7.53 | Main 4-layer ENIG $103.02, line $24.61, ultrasonic $23.05 (20 pcs each) |
| Freight, boards | $3.25 | One FedEx shipment, about $65 (*assumed*; the calculator shows about $35 per single quote) |
| Duty 15 % + VAT 16 % on the boards | $30.2 | Duty depends on the HS code (see below) |
| Motors with encoders, pair | $42 landed | SparkFun ROB-24053 (the XRP motor) $28.50, ×1.47 for freight, duty and VAT (*assumed*) |
| 3 × 18650 cells | $15.4 landed | $3.50 each (*assumed*) |
| Holder, 2 servos, cables, XT30, screws/inserts/nuts/balls | $16.7 landed | $11.50 before freight and tax |
| Filament (PETG about 215 g + TPU about 10 g), printer wear and power, box | $9.75 | Local. About 13 printer-hours per robot |
| Contingency 10 % | $20.4 | Spares, failed prints, rework |
| **Total** | **about $225** | |

## PCBWay prices by quantity (calculator, 2026-10-07)
| Qty | Main PCB | Main assembly | Line PCB | Line assembly | Ultrasonic PCB | Ultrasonic assembly |
|---|---|---|---|---|---|---|
| 2 (5 PCBs) | $57.43 | $88.00 | $6.50 | $29.00 | $6.50 | $88.00 |
| 10 | $82.86 | $227.71 | $19.68 | $88 | $19.15 | $88 |
| 20 | $103.02 | **$535.04** | $24.61 | $88 | $23.05 | $88 |
| 50 | (about $163, extrapolated) | $663.86 | (about $39) | $196.52 | (about $35) | $183.84 |

**Odd step at 20 main boards:**
- 20 cost $26.80 each to assemble.
- 10 cost $22.80 each, and 50 cost $13.30 each.
- Ask Betsy about it. Two lots of 10, or one lot of 50, are cheaper per board.

## Cost-downs, biggest first
1. **Motors ($42 landed per robot).**
   - SparkFun's XRP motors are the largest single cost.
   - Get quotes direct from Chinese makers of 6-pin TT encoder motors for 50–100 pairs. The model's $12 a pair is *assumed* until quoted.
   - At that price the saving is about $24 per robot.
2. **Assembly ($35.55 per robot at 20).**
   - Put the line sensor and ultrasonic on one panel, one design, so they need one assembly job. That saves $88 per batch.
   - Order main boards in lots of 10 or 50, not 20.
   - Get a JLCPCB comparison quote: every part already has an LCSC code, which is JLC's own parts library. JLC charges per solder joint and per part type rather than a minimum fee, which is usually cheaper for small batches.
3. **Duty classification.**
   - Ask a clearing agent which HS code the assembled boards come in under.
   - "Computer parts" are duty-free in Zambia, and educational goods may qualify for relief.
   - 0 % instead of 15 % duty saves about $15 per robot at 20.
4. **Volume.** At 50, main-board components fall from $31.44 to about $26.90 each, and the fixed fees ($88 per design, PCB setup) are spread thinner.
5. **Main-board parts.**
   - The six dearest parts are the ESP32-S3 module, MCP73871 charger, LSM6DSOX IMU, DRV8411A motor driver, 3 × SI7655DN P-FETs and the CMT-8504 buzzer.
   - Together they are about $19 of the $31.
   - Only worth revisiting for V3; each was chosen for a reason.

## Not in the per-robot figures
- **Labour:** about 1.5 h per robot to assemble and test, plus loading the printer.
- **Print time:** 20 robots need about 260 printer-hours. That is about 2 weeks on one A1 mini, or 1 week on two.
- **Software:**
  - XRPLib and XRPCode are open source, and the board follows the XRP's layout, so most code is reused.
  - Porting and testing is a one-off engineering cost.
  - Per robot, it is only flashing and testing, which is inside the labour time.
- **Batteries by air:** lithium cells are restricted, so buy the 18650 cells regionally rather than flying them in.
- **Selling price:** this is cost, not price. To beat an imported XRP on price with a margin, the cost has to be well under $170. That points to batches of 50 or more with the cost-downs above.

## Comparison: XRP kit landed in Zambia
- **SparkFun price:** XRP Kit (KIT-27644) is $119.95. A set of 10 (KIT-28010) is $1,199.50, so no volume discount.
- **Landed cost:** with about $25 freight per kit (*assumed*), 16 % VAT and 0–25 % duty, it comes to **$171–213**, plus 4 × AA cells.
- **Educator discounts:** SparkFun has offered education and FIRST discounts, reported as up to 43 % on pre-orders. If our customers can get those, the gap closes.

## Sources
- SparkFun XRP Kit (KIT-27644): https://www.sparkfun.com/experiential-robotics-platform-xrp-kit.html
- SparkFun XRP Kit, set of 10 (KIT-28010): https://www.sparkfun.com/experiential-robotics-platform-xrp-kit-set-of-10.html
- XRP motor pair (ROB-24053), $28.50: https://www.sparkfun.com/hobby-motor-with-encoder-plastic-gear-pair-red.html
- XRP educator discount report: https://www.opensourceforu.com/2026/08/open-source-xrp-kit-makes-robotics-accessible/
- Zambia tariffs (CIF basis; 0–5 / 15 / 25 % bands; 16 % import VAT; computer parts duty-free): https://www.trade.gov/country-commercial-guides/Zambia-import-tariffs
- LCSC product prices: `tools/costing/lcsc_prices.json` (from LCSC's product API, 2026-10-07)
