# RoboCore V1 — BOM availability check (Digi-Key, 2026-10-02)

Checked with the KiCad MCP server's Digi-Key tools (US site, USD, cut-tape prices for 1 pc).

## Needs attention
| Part | Ref | Digi-Key status | Notes |
|---|---|---|---|
| MPU-6050 (TDK InvenSense) | U5 | **Obsolete**, last-buy date 2024-01-31, 0 stock | PCBWay can only use broker or old stock, so there's a counterfeit risk. If they can't confirm genuine parts, leave U5 unfitted on V1. Replace it in V2: ICM-42670-P is active but 0 stock / 45-week lead today, so compare it with other current IMUs before choosing. |
| DRV8245HQRXZRQ1 (TI) | IC1, IC2 | Active, **0 stock**, 12-week lead | TI direct or other distributors may have stock; PCBWay will report. |
| TLV1117LV33DCYR (TI) | VR1 | Active, **0 stock**, 20-week lead | The -DCYT packaging is obsolete; stay with -DCYR. |
| XAL5030-222MEC (Coilcraft) | L1 | Not on Digi-Key | Coilcraft sells it directly (and offers free samples); other distributors such as Mouser carry it. |
| Polyfuse example MF-MSMF150-2 (Bourns) | F2 | **Obsolete** (105 left) | The BOM note now suggests MF-MSMF150/24X-2 (same 1812, 1.5 A hold, 24 V), which is active with 56k in stock. |
| W25Q32JVSSIQ (Winbond) | U6 | Marked obsolete, but 105k in stock | Fine for V1; check for its successor in V2. |

## Active and in stock
MCP73871-2CCI/ML (9,958 in stock — part number confirmed), TPS61089RNRR (5,989), CP2102N-A02-GQFN24 (2,177; -R reel 12k),
ESP32-C3-WROOM-02-H4 (1,218), USBLC6-2SC6 (150k), AO3401A (383k), BC817-40 (114k), SKQGADE010 (112k),
JST B2B-PH-SM4-TB (49k), JST B2B-PH-K-S (229k), LTST-C170KRKT / GKT / TBKT LEDs (110k+),
Samsung CL31A106KOHNNNE (119k), CL31A475KOHNNNE (870), CL21A226MOQNNNE (120k) — the ceramic part numbers in the BOM notes are real.

## Not on Digi-Key (sourced in China by PCBWay)
HRO TYPE-C-31-M-12 (J1), AMASS XT30UPB-M (J2).
