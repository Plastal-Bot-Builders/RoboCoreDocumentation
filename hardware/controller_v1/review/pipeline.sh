#!/bin/zsh
# Rebuild schematic + PCB rework from the pre-rework backups. Writes only to the scratchpad unless INSTALL_SCH=1.
set -e
SP="/private/tmp/claude-501/-Users-fred-RoboCoreProjects/fbd9eaa8-5087-46dd-9f98-902329523d72/scratchpad"
D="/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore"
B="$D/RoboCore-backups/before-power-rework_2026-10-01"
PY=/Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3
K=/Applications/KiCad.app/Contents/MacOS/kicad-cli
F() { grep -v -e Fontconfig -e stdpbase -e "Debug:" -e "memory leak" || true; }
# 1. schematic
rm -rf "$SP/schP"; mkdir -p "$SP/schP"; cp "$B"/*.kicad_sch "$B"/RoboCore.kicad_pro "$D"/sym-lib-table "$SP/schP/"
python3 "$SP/sch_edit.py" "$SP/schP" | F
( cd "$SP/schP" && $K sch erc --format json --severity-error -o "$SP/erc_p.json" RoboCore.kicad_sch 2>&1 | F )
python3 -c "import json;d=json.load(open('$SP/erc_p.json'));n=sum(len(s['violations']) for s in d['sheets']);print('ERC errors:',n);exit(1 if n else 0)"
( cd "$SP/schP" && $K sch export netlist --format kicadxml -o "$SP/netlist_final.xml" RoboCore.kicad_sch 2>&1 | F )
if [[ "$INSTALL_SCH" == 1 ]]; then
  if [[ -e "$D/~RoboCore.kicad_pro.lck" ]] || pgrep -f KiCad.app >/dev/null; then echo "KiCad open: not installing schematic"; exit 1; fi
  cp "$SP/schP/"{RoboCore,ESP32_BOARD_CONNECTION,MotorDriver,Buttons}.kicad_sch "$D/"; cp "$SP/sch_edit.py" "$D/review/"; echo "schematic installed"
fi
# 2. PCB sync + stage 1 (board from the DRC-fixed version saved before the rework)
rm -rf "$SP/pcb"; mkdir -p "$SP/pcb"; cp "$B/RoboCore.kicad_pcb" "$SP/schP/"*.kicad_sch "$D/sym-lib-table" "$SP/pcb/"
cp "$D/RoboCore.kicad_pro" "$SP/RoboCore.real.kicad_pro"; cp "$SP/RoboCore.real.kicad_pro" "$SP/pcb/RoboCore.kicad_pro"
cd "$SP/pcb"
$PY "$SP/pcb_sync.py" RoboCore.kicad_pcb "$SP/netlist_final.xml" RoboCore.synced.kicad_pcb 1 2>&1 | F | grep -E "replaced|removed" || true
$PY "$SP/pcb_sync.py" RoboCore.synced.kicad_pcb "$SP/netlist_final.xml" RoboCore.synced.kicad_pcb 2 2>&1 | F | grep -c CONFLICT | sed 's/^/sync conflicts: /'
$PY "$SP/rework1.py" RoboCore.synced.kicad_pcb RoboCore.r1.kicad_pcb 2>&1 | F
cp "$SP/RoboCore.real.kicad_pro" RoboCore.kicad_pro; rm -f RoboCore.kicad_prl
cp RoboCore.r1.kicad_pcb RoboCore.r1.drc.kicad_pcb; cp RoboCore.kicad_pro RoboCore.r1.drc.kicad_pro
$K pcb drc --format json --severity-all --refill-zones --save-board -o "$SP/drc_r1.json" RoboCore.r1.drc.kicad_pcb 2>&1 | F | tail -1
