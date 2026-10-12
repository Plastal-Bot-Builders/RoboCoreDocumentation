# RoboCore technical-reference posters (A4 landscape)

`RoboCore_posters_A4.pdf` — 30 pages, one poster per page, made by `tools/posters.py`. Page previews are in `preview/page_NN.png`.

| Pages | Content |
|---|---|
| 1–4 | **V2 controller:** board overview (top render, main parts), connectors + expansion headers + GPIO map (bottom render), 3D views, copper layers at 1 : 1 with the stack-up |
| 5–13 | **V2 schematic**, one sheet per page. MCU is printed in 2 parts and Power in 4 so the text stays readable (each part overlaps its neighbours by 4 %; the scale is in the page header) |
| 14–16 | **Sensor boards:** line sensor + ultrasonic renders and pinouts, then their schematics |
| 17–21 | **Robot (rev 5):** hero + key numbers, six views, arm module, chassis details, expansion-bus drawing |
| 22–30 | **V1 controller:** board page, then its four schematic sheets (root in 4 parts, ESP32 connection in 2) |

## Printing
- A4 **landscape**, scale **100 %** (no "fit to page"), margins off or minimal: every page has its own 7–8 mm margin. The copper-layer plots are 1 : 1 only at 100 %.
- Vector throughout except the renders, so A3 prints are fine too (schematics then read even better).

## Rebuilding
```
python3 tools/posters.py --no-export     # pages + PDF + previews from docs/posters/src (about 1 minute)
python3 tools/posters.py                 # also re-export the sources with kicad-cli first (renders take ~10 minutes)
```
Needs Google Chrome (headless print), Pillow, numpy, scipy and PyMuPDF.

- `src/renders/`: kicad-cli 3D renders with a transparent background (`pcb render --background transparent`); the script drops the ray-traced floor shadow (semi-transparent pixels) and crops them.
- `src/sch_*/`: schematic sheets as SVG (`sch export svg --exclude-drawing-sheet`); each is cropped to its content and inlined, so the PDF keeps them as vectors.
- `src/layers/`: V2 copper and silkscreen plots (`pcb export svg --page-size-mode 2`).
- `src_robot/`: the Fusion renders from `mech/robot/renders` with the studio background removed (flood fill from the border; grey parts inside the robot are kept). Re-made automatically when missing.
- Page text (tables, facts) lives in `tools/posters.py`; the sources of truth are `docs/RoboCore_V2_spec.md`, `docs/RoboCore_Sensors.md`, `mech/robot/README.md`, `mech/robot/EXPANSION_BUS.md` and `../RoboCore/review/RoboCore_V1_summary_2026-10-01.md`.
