#!/bin/zsh
# Stages 2-4 + Freerouting on the scratch board produced by pipeline.sh
set -e
SP="/private/tmp/claude-501/-Users-fred-RoboCoreProjects/fbd9eaa8-5087-46dd-9f98-902329523d72/scratchpad"
PY=/Applications/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3
K=/Applications/KiCad.app/Contents/MacOS/kicad-cli
F() { grep -v -e Fontconfig -e stdpbase -e "Debug:" -e "memory leak" || true; }
cd "$SP/pcb"
drc() { cp "$SP/RoboCore.real.kicad_pro" RoboCore.kicad_pro; rm -f RoboCore.kicad_prl; cp $1.kicad_pcb $1.drc.kicad_pcb; cp RoboCore.kicad_pro $1.drc.kicad_pro
        $K pcb drc --format json --severity-all --refill-zones --save-board -o "$SP/drc_$1.json" $1.drc.kicad_pcb 2>&1 | F | tail -1; }
$PY "$SP/rework2.py" RoboCore.r1.drc.kicad_pcb RoboCore.r2.kicad_pcb 2>&1 | F
drc RoboCore.r2
# routing copy rules (thin widths so low-current supply pins can be reached)
python3 - "$SP/pcb/RoboCore.kicad_pro" <<'PYEOF'
import json,sys
p=json.load(open(sys.argv[1]))
for c in p["net_settings"]["classes"]:
    if c["name"] in ("MOTOR_PWR","VM","+BATT"): c["track_width"]=0.3
    if c["name"]=="POWER_5V": c["track_width"]=0.4
    if c["name"]=="POWER_3V3": c["track_width"]=0.3
    if c["name"]=="MOTOR_OUT": c["track_width"]=0.5
json.dump(p,open(sys.argv[1],"w"),indent=2)
PYEOF
cp RoboCore.kicad_pro RoboCore.r2.drc.kicad_pro
$PY "$SP/rework3.py" RoboCore.r2.drc.kicad_pcb RoboCore.r3.kicad_pcb RoboCore.r3.dsn 2>&1 | F
python3 -c "
import re;s=open('RoboCore.r3.dsn').read();s=re.sub(r'\(layer (In[12]\.Cu)\n(\s*)\(type signal\)', r'(layer \1\n\2(type power)', s);open('RoboCore.r3.route.dsn','w').write(s)"
java -Djava.awt.headless=true -jar "$SP/tools/freerouting-2.4.1.jar" -de RoboCore.r3.route.dsn -do RoboCore.r3.ses -mp 60 -l en > "$SP/freerouting.log" 2>&1
grep -E "Auto-routing stage completed|Optimization stage completed" "$SP/freerouting.log" | sed 's/.*INFO//' | cut -c1-200
$PY - <<'PYEOF' 2>&1 | F
import pcbnew
b=pcbnew.LoadBoard("RoboCore.r3.kicad_pcb"); print("SES import:", pcbnew.ImportSpecctraSES(b,"RoboCore.r3.ses")); pcbnew.SaveBoard("RoboCore.r4.kicad_pcb",b)
PYEOF
drc RoboCore.r4
$PY "$SP/rework4.py" RoboCore.r4.drc.kicad_pcb RoboCore.r5.kicad_pcb 2>&1 | F
drc RoboCore.r5
$PY "$SP/rework5.py" RoboCore.r5.drc.kicad_pcb RoboCore.r6.kicad_pcb 2>&1 | F
drc RoboCore.r6
# second routing pass for whatever is still open
cp RoboCore.r6.drc.kicad_pcb RoboCore.r7.kicad_pcb
python3 - "$SP/pcb/RoboCore.kicad_pro" <<'PYEOF'
import json,sys
p=json.load(open(sys.argv[1]))
for c in p["net_settings"]["classes"]:
    if c["name"] in ("MOTOR_PWR","VM","+BATT"): c["track_width"]=0.3
    if c["name"]=="POWER_5V": c["track_width"]=0.4
    if c["name"]=="POWER_3V3": c["track_width"]=0.3
    if c["name"]=="MOTOR_OUT": c["track_width"]=0.5
json.dump(p,open(sys.argv[1],"w"),indent=2)
PYEOF
cp RoboCore.kicad_pro RoboCore.r7.kicad_pro
$PY -c "import pcbnew; b=pcbnew.LoadBoard('RoboCore.r7.kicad_pcb'); print('DSN2', pcbnew.ExportSpecctraDSN(b,'RoboCore.r7.dsn'))" 2>&1 | grep DSN2
python3 -c "
import re;s=open('RoboCore.r7.dsn').read();s=re.sub(r'\(layer (In[12]\.Cu)\n(\s*)\(type signal\)', r'(layer \1\n\2(type power)', s);open('RoboCore.r7.route.dsn','w').write(s)"
java -Djava.awt.headless=true -jar "$SP/tools/freerouting-2.4.1.jar" -de RoboCore.r7.route.dsn -do RoboCore.r7.ses -mp 100 -l en > "$SP/freerouting2.log" 2>&1
$PY - <<'PYEOF' 2>&1 | F
import pcbnew
b=pcbnew.LoadBoard("RoboCore.r7.kicad_pcb"); print("SES2 import:", pcbnew.ImportSpecctraSES(b,"RoboCore.r7.ses")); pcbnew.SaveBoard("RoboCore.r8.kicad_pcb",b)
PYEOF
$PY "$SP/rework4.py" RoboCore.r8.kicad_pcb RoboCore.r8.kicad_pcb 2>&1 | F
drc RoboCore.r8
$PY "$SP/astar_route.py" RoboCore.r8.drc.kicad_pcb RoboCore.r9.kicad_pcb "$SP/drc_RoboCore.r8.json" 2>&1 | F
drc RoboCore.r9
