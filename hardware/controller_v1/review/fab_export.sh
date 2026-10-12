#!/bin/zsh
# PCBWay fabrication + assembly outputs for RoboCore V1. usage: fab_export.sh <project_dir> <out_dir>
set -e
D="$1"; OUT="$2"
K=/Applications/KiCad.app/Contents/MacOS/kicad-cli
F() { grep -v Fontconfig || true; }
mkdir -p "$OUT/gerbers"
cd "$D"
# Gerbers: copper, mask, paste, silk, edge (PCBWay reads standard Protel extensions)
$K pcb export gerbers --check-zones --subtract-soldermask -o "$OUT/gerbers/" \
   -l F.Cu,In1.Cu,In2.Cu,B.Cu,F.Mask,B.Mask,F.Paste,B.Paste,F.SilkS,B.SilkS,Edge.Cuts RoboCore.kicad_pcb 2>&1 | F | tail -1
$K pcb export drill --format excellon --excellon-separate-th --generate-map --map-format gerberx2 -o "$OUT/gerbers/" RoboCore.kicad_pcb 2>&1 | F | tail -1
( cd "$OUT/gerbers" && zip -q -r "../RoboCore_V1_gerbers.zip" . )
# Pick-and-place (both sides, mm, CSV)
$K pcb export pos --format csv --units mm --side both --exclude-dnp -o "$OUT/RoboCore_V1_CPL.csv" RoboCore.kicad_pcb 2>&1 | F | tail -1
# BOM straight from the schematic, then merge the differently-named MPN fields
$K sch export bom --fields 'Reference,Value,Footprint,${QUANTITY},MF,MP,Manufacturer_Name,Manufacturer_Part_Number,Description,${DNP}' \
   --labels 'Ref,Value,Footprint,Qty,MF,MP,MfrName,MfrPN,Description,DNP' --group-by 'Value,Footprint,MP,Manufacturer_Part_Number' \
   --exclude-dnp -o "$OUT/bom_raw.csv" RoboCore.kicad_sch 2>&1 | F | tail -1
python3 "$(dirname "$0")/bom_finish.py" "$OUT/bom_raw.csv" "$OUT/RoboCore_V1_BOM.csv"
rm -f "$OUT/bom_raw.csv"
ls -la "$OUT"
