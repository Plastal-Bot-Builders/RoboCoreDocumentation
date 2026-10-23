#!/bin/zsh
# Studio renders of the RoboCore V2 controller in Blender.
#   tools/blender/render_board.sh                 all six shots, full size (~1 h on the M1 Pro; keep the lid open)
#   tools/blender/render_board.sh --pct 25 --samples 64 --shots hero_front     quick test
# Output: docs/renders/blender/<shot>.png (transparent + shadow), <shot>_white.jpg, <shot>_parts.json, contact_sheet.jpg
# and a published copy in ~/RoboCoreProjects/RoboCore/hardware/controller_v2/renders (share.py)
set -e
HERE=${0:A:h}
V2=${HERE:h:h}
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
KICAD_CLI=/Applications/KiCad.app/Contents/MacOS/kicad-cli
CACHE=$HERE/.cache
OUT=$V2/docs/renders/blender
mkdir -p $CACHE $OUT

# 1. board model from KiCad, re-exported when the board file is newer
if [[ ! -f $CACHE/board.glb || $V2/RoboCore_V2.kicad_pcb -nt $CACHE/board.glb ]]; then
  echo "exporting board.glb from KiCad"
  $KICAD_CLI pcb export glb --subst-models --include-tracks --include-pads --include-zones \
    --include-silkscreen --include-soldermask -o $CACHE/board.glb $V2/RoboCore_V2.kicad_pcb | grep -v -i fontconfig || true
fi

# 2. render (pass any render_board.py options through, e.g. --shots, --pct, --samples, --out)
$BLENDER -b -P $HERE/render_board.py -- --out $OUT --parts "$@" 2>&1 | grep -E "wrote|Error|Traceback" || true

# 3. white copies + contact sheet (Pillow kept in .cache/pylib)
if ! PYTHONPATH=$CACHE/pylib python3 -c "import PIL" 2>/dev/null; then
  python3 -m pip install --quiet --target $CACHE/pylib pillow
fi
PYTHONPATH=$CACHE/pylib python3 $HERE/finish.py $OUT

# 4. publish to the shared RoboCore repo, where the software and design chats pick them up
SHARED=${ROBOCORE_SHARED:-$HOME/RoboCoreProjects/RoboCore/hardware/controller_v2/renders}
if [[ -d ${SHARED:h} ]]; then
  PYTHONPATH=$CACHE/pylib python3 $HERE/share.py $OUT $SHARED
fi
