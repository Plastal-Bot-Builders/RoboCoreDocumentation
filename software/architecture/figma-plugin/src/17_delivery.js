// ============================================================================
// 07 — Build, release & kits (UML activity diagrams)
// ============================================================================

function buildDelivery(page) {
  const root = pageRoot(page, {
    title: 'Build, release & kits',
    intro: 'How software gets from a commit to students, how a board gets from a spec to a factory, and how a kit gets from parts to a classroom. Bars are forks and joins: the steps between them run in parallel.',
  });
  ciDiagram(root);
  boardPipeline(root);
  kitLifecycle(root);
  return root;
}

function lane(D, x, y, w, h, tag, label) {
  return boundary(D, { rect: { x, y, w, h }, tag, label, dash: false, stroke: 'color/border/default', fill: 'color/bg/app', fillOpacity: 0.55, radius: 12 });
}

function ciDiagram(parent) {
  const D = newDiagram(parent, {
    num: '7.1', kind: 'UML activity diagram', title: 'From a commit to every platform',
    desc: 'Every push to main and every pull request runs two GitHub Actions workflows in parallel; Render rebuilds the compile server on its own. Flutter, arduino-cli, the esp32 core and every action are pinned to exact versions, so a new release elsewhere cannot change a build by surprise.',
  });
  lane(D, 0, 0, 300, 900, 'Swimlane', 'Developer');
  lane(D, 310, 0, 980, 900, 'Swimlane', 'build.yml — Build');
  lane(D, 1300, 0, 660, 900, 'Swimlane', 'firmware.yml — Firmware and compile server');
  lane(D, 1970, 0, 300, 900, 'Swimlane', 'Render');
  initialNode(D, 'init', 140, 70);
  stateBox(D, 'push', { act: true, x: 40, y: 120, w: 220, title: 'Push to main or open a pull request' });
  barNode(D, 'fork', 60, 250, 2180);
  stateBox(D, 'check', { act: true, x: 520, y: 300, w: 540, title: 'Analyse and test', lines: ['USB bridge tests: node --test with a fake Web Serial and esptool', 'dart analyze · flutter test (compiles and runs every example)', 'logs saved to the ci-logs branch'], prose: true });
  barNode(D, 'fork2', 340, 470, 920);
  const builds = [['web', 'Web', 'CanvasKit bundled → web-build branch + GitHub Pages'], ['android', 'Android', 'app-release.apk'], ['windows', 'Windows', 'robocore-ide-windows folder'], ['macos', 'macOS', 'robocore-ide-macos.zip'], ['ios', 'iOS', 'Runner.app, unsigned']];
  builds.forEach(([id, t, l], i) => stateBox(D, id, { act: true, x: 340 + i * 186, y: 520, w: 172, title: t, lines: [l], prose: true }));
  barNode(D, 'join', 340, 700, 920);
  finalNode(D, 'end1', 787, 760);
  stateBox(D, 'host', { act: true, x: 1330, y: 300, w: 290, title: 'Library logic and pin map', lines: ['pin map and examples match the app', 'library + examples on a PC (-Werror, logic tests)'], prose: true });
  stateBox(D, 'esp32', { act: true, x: 1330, y: 520, w: 290, title: 'Compile for RoboCore V2', lines: ['BoardTest + every example for the ESP32-S3', 'the library must not warn'], prose: true });
  stateBox(D, 'server', { act: true, x: 1650, y: 300, w: 290, title: 'Compile server', lines: ['unit tests (fake arduino-cli)', 'build the Docker image, start it', 'compile every example through it'], prose: true });
  finalNode(D, 'end2', 1462, 700);
  finalNode(D, 'end3', 1782, 520);
  stateBox(D, 'rbuild', { act: true, x: 2000, y: 300, w: 240, title: 'Build server/Dockerfile', lines: ['autoDeploy on push (render.yaml)'], prose: true });
  stateBox(D, 'rlive', { act: true, x: 2000, y: 520, w: 240, title: 'Health check, then live', lines: ['GET /health'], prose: true });
  finalNode(D, 'end4', 2107, 700);
  edge(D, 'init', 'push', {});
  edge(D, 'push', 'fork', { from: 'b', to: 't', ta: 150 });
  edge(D, 'fork', 'check', { from: 'b', to: 't', fa: 790, ta: 790 });
  edge(D, 'fork', 'host', { from: 'b', to: 't', fa: 1475, ta: 1475 });
  edge(D, 'fork', 'server', { from: 'b', to: 't', fa: 1795, ta: 1795 });
  edge(D, 'fork', 'rbuild', { from: 'b', to: 't', fa: 2120, ta: 2120 });
  edge(D, 'check', 'fork2', { from: 'b', to: 't', fa: 790, ta: 790, label: '[all pass]' });
  builds.forEach(([id], i) => {
    const cx = 340 + i * 186 + 86;
    edge(D, 'fork2', id, { from: 'b', to: 't', fa: cx, ta: cx });
    edge(D, id, 'join', { from: 'b', to: 't', fa: cx, ta: cx });
  });
  edge(D, 'join', 'end1', { from: 'b', to: 't', fa: 800, ta: 800 });
  edge(D, 'host', 'esp32', {});
  edge(D, 'esp32', 'end2', { from: 'b', to: 't', fa: 1475, ta: 1475 });
  edge(D, 'server', 'end3', { from: 'b', to: 't', fa: 1795, ta: 1795 });
  edge(D, 'rbuild', 'rlive', {});
  edge(D, 'rlive', 'end4', { from: 'b', to: 't', fa: 2120, ta: 2120 });
  return finishDiagram(D, [
    ['GitHub Pages', 'The Publish web app job needs Pages switched on once (Settings → Pages → Source: GitHub Actions). Until then it skips with a warning and the build is still saved to the web-build branch.'],
    ['Store builds', 'iOS and macOS store or TestFlight builds need an Apple developer account and signing; the CI builds are for testing.'],
  ]);
}

function boardPipeline(parent) {
  const D = newDiagram(parent, {
    num: '7.2', kind: 'UML activity diagram', title: 'How a controller board is designed and ordered',
    desc: 'The RoboCore V2 board is generated from a Python spec, checked, placed, routed and exported by scripts (RoboCore_V2/tools), so a change to the spec can be rebuilt and checked the same way every time.',
  });
  const steps = [
    ['spec', 'spec_v2.py', 'parts, nets, exact MPN + LCSC number for every part'],
    ['sch', 'gen_sch.py', '4 schematic sheets'],
    ['nets', 'check_nets.py', 'netlist vs spec, ERC'],
    ['place', 'build_pcb.py', 'placement, silkscreen labels'],
    ['route', 'route_pcb.py', 'Freerouting + finishing: pours, stitching vias'],
    ['drc', 'kicad-cli DRC', '0 errors, schematic parity'],
    ['fab', 'fab_export.py', 'Gerbers, BOM, pick-and-place, renders'],
    ['order', 'PCBWay', 'fabrication + assembly, engineering questions'],
  ];
  initialNode(D, 'init', 0, 66);
  steps.forEach(([id, t, l], i) => stateBox(D, id, { act: true, x: 50 + i * 236, y: 30, w: 206, title: t, lines: [l], prose: true, dash: false }));
  finalNode(D, 'end', 50 + steps.length * 236, 63);
  edge(D, 'init', 'spec', {});
  for (let i = 0; i < steps.length - 1; i++) edge(D, steps[i][0], steps[i + 1][0], {});
  edge(D, 'order', 'end', {});
  choiceNode(D, 'ok', 1305, 200, 30);
  edge(D, 'drc', 'ok', { from: 'b', to: 't', ta: 1320, fa: 1320 });
  edge(D, 'ok', 'place', { from: 'l', to: 'b', label: '[errors] fix the spec or placement' });
  noteBox(D, 'n1', { x: 1500, y: 180, w: 420, title: 'Hand edits', text: ['Some silkscreen art and label boxes are edited by hand in KiCad and live only in the .kicad_pcb. Compare with the generated copy before regenerating, so they are not lost.'] });
  return finishDiagram(D);
}

function kitLifecycle(parent) {
  const D = newDiagram(parent, {
    num: '7.3', kind: 'UML activity diagram', title: 'From parts to a classroom, and back',
    desc: 'The life of a kit. The first prototypes are being made now; buying in bulk, printing, assembling and packaging in Zambia at scale are planned, and the prototypes will test the cost and assembly assumptions.',
  });
  lane(D, 0, 0, 2080, 300, 'Swimlane', 'Plastal-Bot Builders team');
  lane(D, 0, 310, 2080, 200, 'Swimlane', 'Partners and suppliers');
  lane(D, 0, 520, 2080, 220, 'Swimlane', 'School');
  initialNode(D, 'init', 30, 106);
  stateBox(D, 'design', { act: true, x: 80, y: 80, w: 220, title: 'Design and update', lines: ['board, chassis, IDE, lessons'], prose: true });
  stateBox(D, 'order', { act: true, x: 340, y: 80, w: 220, title: 'Order boards, parts, motors', lines: ['PCBWay, LCSC, vendors'], prose: true });
  stateBox(D, 'fab', { act: true, x: 340, y: 370, w: 220, title: 'Make and assemble boards', lines: ['4-layer PCB, SMD assembly'], prose: true });
  stateBox(D, 'ship', { act: true, x: 600, y: 370, w: 220, title: 'Ship to Zambia', lines: ['courier to Lusaka'], prose: true });
  stateBox(D, 'print', { act: true, x: 860, y: 80, w: 220, title: 'Print chassis and arm', lines: ['in Zambia, planned at scale'], prose: true });
  stateBox(D, 'assemble', { act: true, x: 1120, y: 80, w: 220, title: 'Assemble the robot', lines: ['board, motors, sensors, arm, battery'], prose: true });
  stateBox(D, 'test', { act: true, x: 1380, y: 80, w: 220, title: 'Flash BoardTest', lines: ['motors both ways, encoders, IMU, servos, LEDs, buzzer, battery'], prose: true });
  choiceNode(D, 'pass', 1650, 105, 30);
  stateBox(D, 'fix', { act: true, x: 1380, y: 210, w: 220, title: 'Fix, or log it in the errata', fill: 'color/bg/app' });
  stateBox(D, 'pack', { act: true, x: 1730, y: 80, w: 220, title: 'Pack in the mailer box', lines: ['printed inside: get started + QR'], prose: true });
  stateBox(D, 'deliver', { act: true, x: 1730, y: 580, w: 220, title: 'Receive the kit + teacher training' });
  stateBox(D, 'lessons', { act: true, x: 1380, y: 580, w: 220, title: 'Lessons with the RoboCore IDE' });
  stateBox(D, 'feedback', { act: true, x: 1030, y: 580, w: 220, title: 'Feedback', lines: ['what broke, what confused'], prose: true });
  edge(D, 'init', 'design', {});
  edge(D, 'design', 'order', {});
  edge(D, 'order', 'fab', {});
  edge(D, 'fab', 'ship', {});
  edge(D, 'ship', 'print', { from: 'r', to: 'b', mid: 840 });
  edge(D, 'print', 'assemble', {});
  edge(D, 'assemble', 'test', {});
  edge(D, 'test', 'pass', {});
  edge(D, 'pass', 'pack', { label: '[all pass]', ldy: -14 });
  edge(D, 'pass', 'fix', { from: 'b', to: 'r', label: '[a check fails]' });
  edge(D, 'fix', 'assemble', { from: 'l', to: 'b', tf: 0.5 });
  edge(D, 'pack', 'deliver', { from: 'b', to: 't' });
  edge(D, 'deliver', 'lessons', {});
  edge(D, 'lessons', 'feedback', {});
  edge(D, 'feedback', 'design', { from: 'l', to: 'b', label: 'next revision' });
  return finishDiagram(D, [
    ['The board test', 'BoardTest checks every part a new board has (part 1), then, with the wheels lifted and the switch ON, spins both motors both ways and reads the encoders (part 2).'],
    ['Errata', 'RoboCore_V2/docs/RoboCore_V2_errata.md lists every known problem with the board and the bring-up results; entries are added, never deleted.'],
  ]);
}
