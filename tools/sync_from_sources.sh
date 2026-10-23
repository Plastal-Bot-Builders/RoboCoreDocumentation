#!/bin/zsh
# Copy the working sources of every RoboCore department into this repo, ready to commit.
#   tools/sync_from_sources.sh          dry run: list what would change
#   tools/sync_from_sources.sh --apply  copy for real
# Sources stay where the chats work on them; this repo is the clean, shareable copy.
# Nothing is deleted here: files removed at the source must be removed by hand (git rm).
set -e
REPO=${0:A:h:h}
GYP=$HOME/Projects/Gypul_The_Balancing_Robot
V2=$GYP/PCB-Design/RoboCoreDesign/RoboCore_V2
RCP=$HOME/RoboCoreProjects
DRY=(-n)
[[ $1 == --apply ]] && DRY=()
EXCL=(--exclude .DS_Store --exclude '*-backups/' --exclude .history/ --exclude fp-info-cache --exclude '_autosave-*'
      --exclude '*.lck' --exclude '*.kicad_prl' --exclude '*.bak' --exclude '*.bak[0-9]' --exclude '~*' --exclude __pycache__/
      --exclude '*.pyc' --exclude node_modules/ --exclude '*.log' --exclude .cache/ --exclude '*.blend1'
      --exclude '*.rev5' --exclude '*.rev5stand' --exclude '*.rev6nose' --exclude '*.rev5work' --exclude out_tuckend/)
sync() {   # sync SRC/ DST/ [extra rsync args]
  local src=$1 dst=$2; shift 2
  [[ -e $src ]] || { echo "skip (missing): $src"; return }
  mkdir -p $REPO/$dst
  echo "== $dst  <-  $src"
  rsync -rlt --checksum --itemize-changes ${DRY[@]} ${EXCL[@]} "$@" $src $REPO/$dst | grep -v '/$' || true
}
# hardware: V2 controller (KiCad project, fab files, libraries, tools, reference), sensor boards
for f in RoboCore_V2.kicad_pcb RoboCore_V2.kicad_pro RoboCore_V2.kicad_sch io.kicad_sch mcu.kicad_sch motors.kicad_sch power.kicad_sch fp-lib-table sym-lib-table; do
  sync $V2/$f hardware/controller_v2/
done
for d in fab lib tools technicalreference; do sync $V2/$d/ hardware/controller_v2/$d/; done
sync $V2/sensors/ hardware/sensors/
# docs: specs, costing, component lists, errata, checks, photos, posters (PDF + README only), progress, hand-offs
sync $V2/docs/ docs/ --exclude renders/ --exclude 'posters/src*/' --exclude posters/preview/ --exclude 'posters/*.html'
# mechanical: the robot (Fusion generator, print files, renders, packaging, cardboard)
sync $V2/mech/robot/ mechanical/robot_v2/
# software: firmware, IDE design (Figma plugins, app icon, specs), system architecture
sync $GYP/Firmware/motion/ software/firmware/motion/
sync $RCP/RoboCore_IDE_Design/ software/ide_design/
sync $RCP/RoboCore_Architecture/ software/architecture/
# design: event branding (Figma plugin, scripts, review previews; not the 3D models, raw renders or elevation data)
sync $RCP/RoboCore_Event_Branding/ design/event_branding/ --exclude 3d/renders_raw/ --exclude '3d/*.step' --exclude '3d/*.glb' \
  --exclude topo/dem/ --exclude assets/
# not synced: community posts (Community_Updates_*), grant applications, pitch video
