// ============================================================================
// 00 — Read me: cover, what each page answers, notation, status and sources
// ============================================================================

const AS_OF = '18 October 2026';

function buildCover(page) {
  const root = box({ name: 'Read me', dir: 'V', gap: 48, pad: 64, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;

  // ---- cover: the box front
  const cover = box({ name: 'Cover', dir: 'H', pad: [56, 64, 56, 64], w: 1720, h: 520, cross: 'center', radius: 16, fill: 'color/bg/brand', clip: true, parent: root });
  contours(cover, 1720, 520, 'color/decor/contour');
  const cl = box({ name: 'Cover text', dir: 'V', gap: 18, parent: cover, w: 900 });
  const word = CMP['Logo/Wordmark'].createInstance(); cl.appendChild(word); word.rescale(1.9);
  txt('System design & architecture', { style: 'Heading/Display', parent: cl, name: 'Title' });
  txt('How the RoboCore platform works: the robot kit, its controller board and firmware, the RoboCore IDE, the compile server, and the people and partners around them.', { style: 'Body/Default', parent: cl, name: 'Intro', w: 760 });
  const meta = box({ name: 'Meta', dir: 'H', gap: 8, wrap: true, rowGap: 8, parent: cl, w: 860 });
  for (const m of ['As built on ' + AS_OF, 'Board: RoboCore V2 · Rev 2.0', 'IDE: Flutter · web, Android, Windows, macOS, iOS', 'Compile server: arduino-cli 1.5.1', 'Library: RoboCore 1.0.0']) {
    const c = box({ name: 'Meta ' + m, dir: 'H', pad: [4, 10, 4, 10], radius: 6, stroke: INK, parent: meta });
    txt(m, { style: 'Label/Default', parent: c, name: 'Text' });
  }
  txt('Build. Code. Create.', { style: 'Heading/H2', parent: cl, name: 'Tagline' });
  const art = artRect(cover, 'robot', 560, 'Robot line art');
  art.layoutPositioning = 'ABSOLUTE'; art.x = 1720 - 640; art.y = 0;

  // ---- what it is + how to read
  const row = hrow(root, 'About', 32);
  const about = box({ name: 'What RoboCore is', dir: 'V', gap: 12, pad: 32, w: 560, fill: PAPER, radius: 16, stroke: 'color/border/default', parent: row });
  txt('What RoboCore is', { style: 'Heading/H2', parent: about, name: 'Title' });
  for (const p of [
    'RoboCore is a low-cost classroom robotics kit, designed in Zambia, for secondary-school students and their teachers.',
    'Students build a robot around our own controller board (ESP32-S3, motor driver, motion sensor, USB-C charging and battery protection on one board) and program it in Blocks or Arduino C++ in the RoboCore IDE.',
    'The IDE runs in the browser. It sends a sketch to the compile server, gets the program back and writes it to the robot over USB-C. Without a board or a server it still checks the code and runs it on a simulated robot.',
    'This file is for the team, new contributors, partners and reviewers. Every diagram is drawn from the code and design files as they are on ' + AS_OF + '.',
  ]) txt(p, { style: 'Body/Small', color: 'color/text/secondary', parent: about, name: 'Text', fill: true });
  table(row, [['Page', 300], ['What it answers', 800]], [
    ['01 — Context & use cases', 'Who uses RoboCore, which systems it is made of, and what people do with the IDE'],
    ['02 — Containers & deployment', 'What runs where: the browser, the compile server, GitHub and the board, and how they talk'],
    ['03 — IDE app', 'How the Flutter app is organised: layers, components and the main classes'],
    ['04 — Key flows', 'Step by step: uploading to a real board, running on the preview board, connecting over USB-C'],
    ['05 — State machines', 'The USB link, the build and upload status, and the Blocks / C++ editing modes'],
    ['06 — Firmware & hardware', 'The firmware layers, the board\'s power and signals, the robot\'s parts, and the single pin map'],
    ['07 — Build, release & kits', 'CI and releases, how a board is designed, and how a kit gets from parts to a classroom'],
    ['08 — Cog & roadmap', 'The planned AI learning partner, and what is still to do'],
    ['09 — Decisions & glossary', 'Why the platform is built this way, and the words used in this file'],
  ], { name: 'Page index' });

  // ---- notation
  buildLegend(root);

  // ---- status + sources
  const st = hrow(root, 'Status and sources', 32);
  for (const [title, icon, items] of [
    ['Works today', 'check-circle', [
      'Web IDE: every screen, Blocks and C++ editors, examples, Serial Monitor, Paper and Navy themes',
      'Preview check and simulated RoboCore board (no hardware, no internet needed after loading)',
      'Compile server: unit tests, Docker image and an end-to-end compile of every example in CI',
      'RoboCore library: compiles for the ESP32-S3 with no warnings; logic tests pass on a PC',
      'USB-C connect, Serial Monitor and upload, tested against a fake Web Serial and esptool',
    ]],
    ['Waits for the real board', 'cpu', [
      'First upload with esptool-js over the ESP32-S3\'s own USB, reset and Serial Monitor reopening',
      'Motor direction, encoder direction, line-sensor polarity and sonar at 3.3 V',
      'The 12-sketch test checklist (BoardTest, Blink, MotorControl, …)',
      'The first V2 boards are being made; everything above is tested without hardware until they arrive',
    ]],
    ['Planned', 'clock', [
      'Cog, the AI learning partner (design only)',
      'USB on the native apps (Android, Windows, macOS)',
      'Uploading to an Arduino Uno from the browser',
      'Lessons, build guides and teacher training',
      'Assembling and packaging kits in Zambia at scale',
    ]],
  ]) {
    const c = box({ name: 'Status — ' + title, dir: 'V', gap: 10, pad: 28, w: 420, fill: PAPER, radius: 16, stroke: 'color/border/default', parent: st });
    const h = box({ name: 'Head', dir: 'H', gap: 10, cross: 'center', parent: c });
    iconInst(icon, h, 'color/icon/strong', 20);
    txt(title, { style: 'Heading/H2', parent: h, name: 'Title' });
    for (const it of items) txt('– ' + it, { style: 'Body/Small', color: 'color/text/secondary', parent: c, name: 'Item', fill: true });
  }
  const src = box({ name: 'Sources', dir: 'V', gap: 10, pad: 28, w: 380, fill: 'color/bg/inverse', radius: 16, parent: st });
  txt('Sources', { style: 'Heading/H2', color: 'color/text/on-ink', parent: src, name: 'Title' });
  for (const [k, v] of [
    ['IDE, library, server', 'github.com/Plastal-Bot-Builders/robocore-ide'],
    ['Hardware & mechanical', 'github.com/Plastal-Bot-Builders/RoboCoreDocumentation'],
    ['IDE design', 'Figma: RoboCore IDE — UI/UX Design'],
    ['Board spec', 'RoboCore_V2/docs/RoboCore_V2_spec.md'],
    ['Pin map', 'robocore-ide/hardware/pinout.md'],
    ['This file', 'RoboCore_Architecture/figma-plugin (rebuild from code)'],
  ]) {
    const r = box({ name: 'Source ' + k, dir: 'V', gap: 2, parent: src, wSize: 'fill' });
    txt(k, { style: 'Caption/Overline', color: 'color/text/on-ink', parent: r, name: 'Key', opacity: 0.75 });
    txt(v, { style: 'Code/Small', color: 'color/text/on-ink', parent: r, name: 'Value', fill: true });
  }
  return root;
}

// notation key: element kinds, domains and connector types
function buildLegend(parent) {
  const D = newDiagram(parent, { num: 'Key', kind: 'Notation', title: 'How to read the diagrams', desc: 'Diagrams follow UML (use case, component, class, sequence, state, activity, deployment) and the C4 model (context, containers). The same shapes mean the same things on every page.' });
  const y0 = 10;
  el(D, 'k1', { x: 0, y: y0, w: 230, kind: 'sys', dom: 'ide', icon: 'code', tag: 'Built by us', title: 'RoboCore system', body: 'Solid outline: software or a product we build.' });
  el(D, 'k2', { x: 260, y: y0, w: 230, kind: 'ext', dom: 'ext', icon: 'globe', tag: 'Third party', title: 'External system', body: 'Dashed outline: a service, tool or partner we use.' });
  el(D, 'k3', { x: 520, y: y0, w: 230, kind: 'planned', dom: 'cog', icon: 'sparkles', tag: 'Not built', title: 'Planned', body: 'Dotted outline on yellow: designed or proposed only.' });
  el(D, 'k4', { x: 780, y: y0, w: 230, kind: 'hw', dom: 'hardware', icon: 'cpu', tag: 'Hardware', title: 'Device or board', body: 'Navy: physical hardware and the code that runs on it.' });
  el(D, 'k5', { x: 1040, y: y0, w: 230, kind: 'store', dom: 'ide', icon: 'database', tag: 'Data store', title: 'Stored data', body: 'Where something is saved.' });
  person(D, 'k6', { x: 1300, y: y0, w: 200, title: 'Person', body: 'Someone who uses or runs the platform.' });
  // domain colours
  const dy = 230;
  const dl = txt('Icon colours show which part of the platform an element belongs to (the same inks as the IDE\'s block categories):', { style: 'Body/Small', color: 'color/text/secondary', parent: D.cv, name: 'Domain note' });
  dl.x = 0; dl.y = dy;
  Object.keys(DOM).forEach((k, i) => {
    const g = box({ name: 'Domain ' + k, dir: 'H', gap: 8, cross: 'center', parent: D.cv });
    iconTile(g, null, k, 20);
    txt(DOM[k].label, { style: 'Label/Default', parent: g, name: 'Label' });
    g.x = (i % 4) * 300; g.y = dy + 30 + Math.floor(i / 4) * 30;
  });
  // connector types
  const cy = 360;
  const kinds = [
    ['Calls, uses or flows to', { head: 'open' }],
    ['Synchronous call (sequence)', { head: 'filled' }],
    ['Reply, dependency, «include»', { head: 'open', dash: true }],
    ['Planned connection', { head: 'open', dash: 'dot' }],
    ['Generalisation / implements', { head: 'hollow' }],
    ['Composition (part of)', { head: 'none', tail: 'diamond' }],
  ];
  kinds.forEach(([label, o], i) => {
    const x = (i % 3) * 500, y = cy + Math.floor(i / 3) * 50;
    drawPath(D, [[x, y + 10], [x + 120, y + 10]], o);
    const t = txt(label, { style: 'Label/Default', parent: D.cv, name: 'Connector label' });
    t.x = x + 136; t.y = y + 2;
  });
  return finishDiagram(D);
}
