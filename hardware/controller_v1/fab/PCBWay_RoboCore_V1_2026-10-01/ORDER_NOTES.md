# RoboCore V1 — PCBWay order notes (2026-10-01)

## Files to upload
| PCBWay field | File |
|---|---|
| Gerber file (PCB) | `RoboCore_V1_gerbers.zip` (copper, mask, paste, silk, outline, PTH + NPTH drill) |
| BOM (assembly) | `RoboCore_V1_BOM.csv` (50 lines, 99 parts) |
| Centroid / pick-and-place (assembly) | `RoboCore_V1_CPL.csv` (75 top + 24 bottom placements, mm) |

The `gerbers/` folder holds the same files as the zip, unzipped, for viewing.

## PCB options
| Option | Value |
|---|---|
| Layers | 4 |
| Size | 68.04 × 60.04 mm |
| Material / thickness | FR-4, 1.6 mm |
| Min track / spacing | 6/6 mil (0.15 mm) |
| Min hole size | 0.2 mm (only one hole: the thermal via in U7's KiCad footprint; every other via is 0.3 mm) |
| Solder mask / silkscreen | Green / white |
| Surface finish | ENIG recommended (several 0.5 mm-pitch QFNs); lead-free HASL also works |
| Copper | 1 oz outer (standard) |
| Via process | Tented vias |

## Assembly options
- Turnkey assembly, **both sides**:
  - Bottom: the 6 V boost circuit plus a few small parts (24 placements).
  - Top: everything else (75 placements).
- Two through-hole parts: J2 (XT30 battery connector) and J5 (JST-PH switch connector).
- The placement file uses KiCad's convention, with Y negative and bottom-side rotations as KiCad exports them. PCBWay's engineers check placement against the gerbers in their DFM review; approve their placement preview before production.

## Questions to watch for in the quote
- **U5 MPU-6050:** this is an older part. Ask PCBWay to confirm the stock is genuine.
- **U1:** it must be **MCP73871-2CCI/ML**. The "-2" sets the 4.20 V charge voltage for standard Li-ion cells; other suffixes charge to the wrong voltage.
- **Generic resistors and capacitors:** they have no part number. Each line's rating is in the "Rating / sourcing note" column, and any substitute PCBWay offers must meet it. In particular:
  - C15 must be rated 50 V.
  - C18, C19 and C22–C26 must be 16 V or higher.
  - R35–R38 must be 1%.
- **C5, C7, C9, C11 are ceramic (MLCC 1206, 16 V), not tantalum.** Their footprint is named T491A, but the pads fit a 1206 part. Changed 2026-10-02 after the first upload, so the BOM in the order must be replaced.
