#!/bin/zsh
# Silkscreen pass, final DRC, install into the project (with backup), project DRC + parity, fab outputs, renders.
set -e
SP="/private/tmp/claude-501/-Users-fred-RoboCoreProjects/fbd9eaa8-5087-46dd-9f98-902329523d72/scratchpad"
D="/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore"
PY=/Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3
K=/Applications/KiCad.app/Contents/MacOS/kicad-cli
F() { grep -v -e Fontconfig -e stdpbase -e "Debug:" -e "memory leak" || true; }
cd "$SP/pcb"
$PY "$SP/rework6.py" RoboCore.r9d.drc.kicad_pcb RoboCore.r10.kicad_pcb 2>&1 | F
# no-connect net names: the schematic escapes "/" inside pin names as {slash}
python3 - RoboCore.r10.kicad_pcb <<'PYEOF'
import re, sys
t = open(sys.argv[1]).read()
t2, n = re.subn(r'"(unconnected-\([^"]*/[^"]*\))"', lambda m: '"' + m.group(1).replace("/", "{slash}") + '"', t)
open(sys.argv[1], "w").write(t2); print("no-connect net names escaped:", n)
PYEOF
cp "$SP/RoboCore.real.kicad_pro" RoboCore.kicad_pro; rm -f RoboCore.kicad_prl
cp RoboCore.r10.kicad_pcb RoboCore.r10.drc.kicad_pcb; cp RoboCore.kicad_pro RoboCore.r10.drc.kicad_pro
$K pcb drc --format json --severity-all --refill-zones --save-board --schematic-parity -o "$SP/drc_final_scratch.json" RoboCore.r10.drc.kicad_pcb 2>&1 | F | tail -3
if [[ "$INSTALL" == 1 ]]; then
  if [[ -e "$D/~RoboCore.kicad_pro.lck" || -e "$D/~RoboCore.kicad_pcb.lck" ]] || pgrep -f KiCad.app >/dev/null; then echo "KiCad open: not installing"; exit 1; fi
  cp -p "$D/RoboCore.kicad_pcb" "$D/RoboCore-backups/before-power-rework_2026-10-01/RoboCore_pre-install_$(date +%H%M).kicad_pcb"
  cp RoboCore.r10.drc.kicad_pcb "$D/RoboCore.kicad_pcb"
  cp "$SP"/rework*.py "$SP/pcb_sync.py" "$SP/astar_route.py" "$SP/smooth.py" "$SP/pipeline.sh" "$SP/pipeline2.sh" "$SP/final.sh" "$D/review/"
  cd "$D"
  $K pcb drc --format json --severity-all --schematic-parity -o "$SP/drc_final_project.json" RoboCore.kicad_pcb 2>&1 | F | tail -3
  $K sch erc --format json --severity-all -o "$SP/erc_final_project.json" RoboCore.kicad_sch 2>&1 | F | tail -1
  "$SP/fab_export.sh" "$D" "$D/fab/PCBWay_RoboCore_V1_$(date +%Y-%m-%d)" 2>&1 | F | tail -12
fi
