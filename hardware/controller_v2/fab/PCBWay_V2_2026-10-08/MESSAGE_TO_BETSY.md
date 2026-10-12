Subject: Re: T-1F4W836287A / W836287AS1F3 — new controller order W836287AS1F11, sensor boards cancelled

Hi Betsy,

Thank you for the three quotations and the engineering review.

**1. Only the controller goes ahead.** I have removed the earlier items from my cart (W836287AS1F3 / T-1F4W836287A, W836287AS1F5 / T-1F6W836287A, W836287AS1F7 / T-1F8W836287A, and the interim W836287AS1F9 / T-1F10W836287A) and submitted the controller again with the final files as **W836287AS1F11 (PCB) and T-1F12W836287A (assembly)**. The two sensor boards are not being ordered. Quantity is unchanged: 2 assembled units, 5 PCBs. Please use W836287AS1F11 / T-1F12W836287A and ignore the earlier numbers.

**2. What changed in the controller files.** Two connectors changed from JST SH sockets to 2.54 mm pin headers:
- J403: hanxia HX PH254-01-04-Z-L11.5 (LCSC C52016392), 1×4, through-hole
- J404: Hong Cheng HC-PZ254-11.5L-1x5PZ (LCSC C27985190), 1×5, through-hole

So the assembly is now 124 SMD + 9 through-hole parts (62 BOM lines). The silkscreen also gained pin-name labels for the servo and sensor headers on both sides. The rest of the BOM is the same as in your quotation T-1F4W836287A, and all the red "Actual Purchase" part numbers are approved (same parts, full suffix). The 7–10 day lead time on SW101 is fine. The attached files are the same ones uploaded to W836287AS1F11.

**3. Your questions on the PCB (asked on W836287AS1F3; they apply to W836287AS1F11):**
- Vias in pads: **No, please do not fill with resin.** The vias in pads are the 0.2 mm thermal vias in the IC exposed pads, tented on the bottom side. In the new Gerbers all other vias have been moved out of the pads.
- Solder-mask bridges between IC pads: **option (1)** — proceed without solder-mask ink between the pads of U202 (LGA-14, 0.5 mm pitch) and any other pads below your 0.19 mm limit.
- The .md files: yes, please ignore them. The new "other files" zip contains only the assembly drawings (PDF) and renders (PNG).

**4. Your notes:** no temperature-sensitive parts, no BGA (so no X-ray needed), and no functional test needed — we test the boards ourselves.

Please send the updated quotation for W836287AS1F11 / T-1F12W836287A when the files have passed review, and ship by FedEx to Zambia as quoted.

Thank you,
Fred
