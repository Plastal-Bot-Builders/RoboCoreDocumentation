# Quote request for Tecoo Electronics (Alibaba store tecoocn), 2026-10-17

**Store:** https://tecoocn.en.alibaba.com/company_profile.html

**Who they are**, from their Alibaba pages on 17 October 2026:
- Tecoo Electronics Co., Ltd., Zhejiang, China. A custom PCBA and electronics contract manufacturer, 9 years on Alibaba.
- Verified by TÜV Rheinland. Ranked "#1 most popular in PCBA".
- Rating 5.0 from 5 reviews. Average dispatch 9.5 days. Response time ≤ 4 h. Reorder rate 46.4%. 15 years exporting. Payment by T/T.
- Listed minimum orders are mostly **100–500 pieces**, a few 10. So they suit a production run, not the 2 prototypes.
- They don't sell loose robot parts.
- They also advertise PCB reverse engineering and cloning. Share files only if you're comfortable with that, or after an NDA.

**How to send it:** sign in to Alibaba, then use "Contact supplier" on the store page and paste the text below. Send the Gerber, BOM and pick-and-place files once they reply with an email address or an upload link. The files are in `fab/PCBWay_V2_2026-10-08/RoboCore_V2_Controller/`.

**Quantities** are an assumption: 10, 50, 100 and 200 boards. 50 matches the 50-robot cost scenario in the applications. Change them before sending if you have other numbers.

---

Hello,

I'm Fred from RoboCore in Lusaka, Zambia. We design educational robots for schools. Could you quote turnkey PCB fabrication, component sourcing and assembly for our robot controller board?

Board:
- 4 layers, 68 x 60 mm, FR-4 TG150, 1.6 mm, 1 oz copper on all layers
- 6/6 mil track/space, 0.2 mm minimum hole, 0.3 mm vias (tented)
- ENIG finish, green solder mask, white silkscreen
- 0.2 mm thermal vias in the exposed pads of 5 ICs, no resin fill needed

Assembly:
- Top side only: 124 SMD parts (6 QFN/LGA, the finest is an LGA-14 at 0.5 mm pitch) and 9 through-hole parts, about 62 unique parts
- Main parts: ESP32-S3-WROOM-1-N8R2, TPS61089, TPS63001, MCP73871, DRV8411A, LSM6DSOX, USBLC6-2SC6, XT30UPB-M, HRO TYPE-C-31-M-12
- BOM with LCSC part numbers, pick-and-place file and assembly drawings are ready

Please quote:
1. Unit price for 10, 50, 100 and 200 assembled boards. If 10 is below your minimum, please tell me your minimum order.
2. One-time charges (stencil, setup, tooling) and lead time for each quantity.
3. Testing options: AOI, X-ray, and a functional test if we supply the test procedure.
4. Whether you can load our firmware onto the ESP32 during production.
5. Shipping cost to Lusaka, Zambia, and your payment terms.

I can send the Gerber, BOM and pick-and-place files right away. Please tell me the best email address for them.

Thank you,
Fred
RoboCore, Lusaka, Zambia
