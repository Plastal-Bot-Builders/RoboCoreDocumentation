// ============================================================================
// 01 — Context & use cases
// ============================================================================

function buildContext(page) {
  const root = pageRoot(page, {
    title: 'Context & use cases',
    intro: 'Who is involved, which systems make up RoboCore, and what people do with the IDE. Everything inside the “RoboCore platform” boundary is ours; everything outside it is a person, a partner or a third-party service.',
  });
  contextDiagram(root);
  useCaseDiagram(root);
  return root;
}

function contextDiagram(parent) {
  const D = newDiagram(parent, {
    num: '1.1', kind: 'C4 system context', title: 'RoboCore and the world around it',
    desc: 'Students build and program the robot; teachers run lessons; schools and sponsors buy kits. The IDE talks to the compile server over the internet and to the robot over USB-C. Partners in China make the boards; GitHub builds and hosts the software.',
  });
  const C0 = 20, C1 = 340, C2 = 740, C3 = 1140, C4 = 1540;
  const R0 = 20, R1 = 330, R2 = 590, R3 = 880;
  person(D, 'student', { x: C1 + 20, y: R0, title: 'Student', body: 'Secondary-school learner. Builds, codes and debugs the robot.' });
  person(D, 'teacher', { x: C2 + 20, y: R0, icon: 'graduation', title: 'Teacher', body: 'Runs practical lessons with the kits.' });
  person(D, 'school', { x: C3 + 20, y: R0, icon: 'library', title: 'School or sponsor', body: 'Buys kits and training: private schools first, then NGOs, hubs and government.' });
  person(D, 'team', { x: C4 + 10, y: R0, icon: 'users', title: 'Plastal-Bot Builders', body: 'Designs the board, robot and IDE; assembles, tests and supports kits.' });

  el(D, 'ide', { x: C1, y: R1, w: 260, dom: 'ide', icon: 'code', tag: 'Software system', title: 'RoboCore IDE', body: 'Blocks and C++ editors, examples, a simulated board and the Serial Monitor. One Flutter app: web today, plus Android, Windows, macOS and iOS builds.' });
  el(D, 'robot', { x: C2, y: R1, w: 260, kind: 'hw', dom: 'hardware', icon: 'bot', tag: 'Product', title: 'RoboCore V2 robot kit', body: 'Our ESP32-S3 controller board, two encoder motors, ultrasonic and line sensors, a 2-servo arm, a 1S Li-ion pack and a 3D-printed chassis.' });
  el(D, 'lm', { x: C3, y: R1, w: 260, kind: 'planned', dom: 'people', icon: 'book-open', tag: 'Content', title: 'Lessons & teacher training', body: 'Step-by-step builds and lessons that fit the curriculum, and training so teachers can run them.' });
  el(D, 'compile', { x: C1, y: R2, w: 260, dom: 'server', icon: 'server', tag: 'Software system', title: 'RoboCore compile server', body: 'Turns a sketch into a program for the board: arduino-cli in a Docker container behind a small Node API.' });
  el(D, 'cog', { x: C2, y: R2, w: 260, kind: 'planned', dom: 'cog', icon: 'sparkles', tag: 'Software system', title: 'Cog AI assistant', body: 'Explains errors one hint at a time and teaches with the student’s own code. Design only.' });

  el(D, 'github', { x: C0, y: R1, w: 250, kind: 'ext', dom: 'infra', icon: 'git-branch', tag: 'Third party', title: 'GitHub', body: 'Source code, Actions CI for every platform, and Pages hosting for the web app.' });
  el(D, 'host', { x: C0, y: R2, w: 250, kind: 'ext', dom: 'infra', icon: 'cloud', tag: 'Third party', title: 'Render or Google Cloud Run', body: 'Runs the compile server image. Render’s free plan sleeps after 15 minutes idle.' });
  el(D, 'tool', { x: C1, y: R3, w: 260, kind: 'ext', dom: 'ext', icon: 'terminal', tag: 'Third party', title: 'Arduino & Espressif toolchain', body: 'arduino-cli 1.5.1, the esp32 core 3.3.12, the AVR core and four Arduino libraries.' });
  el(D, 'llm', { x: C2, y: R3, w: 260, kind: 'planned', dom: 'cog', icon: 'globe', tag: 'Third party', title: 'Language-model provider', body: 'Not chosen yet.' });
  el(D, 'arduino', { x: C3, y: R3, w: 260, kind: 'ext', dom: 'ext', icon: 'monitor', tag: 'Third party', title: 'Arduino IDE 2', body: 'Free desktop IDE that works offline, with the same RoboCore library and board settings.' });
  el(D, 'mfg', { x: C4, y: R2, w: 250, kind: 'ext', dom: 'infra', icon: 'factory', tag: 'Partners', title: 'Manufacturing & suppliers', body: 'PCBWay (boards and assembly), LCSC and other suppliers in China, motor and sensor-module vendors.' });

  boundary(D, { ids: ['ide', 'robot', 'lm', 'compile', 'cog'], pad: 28, top: 52, tag: 'Boundary', label: 'RoboCore platform', fill: 'color/bg/app', fillOpacity: 0.6 });

  edge(D, 'student', 'ide', { label: 'codes, uploads,\nreads the serial', ldx: -58, lp: 0.45 });
  edge(D, 'student', 'robot', { from: 'b', to: 't', ff: 0.85, tf: 0.15, mid: 240, label: 'builds, wires\nand tests it' });
  edge(D, 'teacher', 'lm', { from: 'b', to: 't', ff: 0.85, tf: 0.15, mid: 240, label: 'plans and runs lessons' });
  edge(D, 'school', 'team', { label: 'buys kits\nand training' });
  edge(D, 'team', 'mfg', { label: 'orders boards,\nparts and motors' });
  edge(D, 'team', 'lm', { from: 'b', to: 'r', ff: 0.1, label: 'writes lessons,\ntrains teachers' });
  edge(D, 'mfg', 'robot', { from: 'l', to: 'r', mid: 1070, lxy: [1070, 540], lw: 150, label: 'assembled boards, motors, sensor modules' });
  edge(D, 'github', 'ide', { label: 'builds and\nhosts it' });
  edge(D, 'host', 'compile', { label: 'runs the\nimage' });
  edge(D, 'ide', 'compile', { label: 'sends the sketch, gets the\nprogram (HTTPS, JSON)' });
  edge(D, 'ide', 'robot', { lw: 118, label: 'uploads + Serial Monitor over USB-C' });
  edge(D, 'ide', 'cog', { from: 'r', to: 'l', ff: 0.88, mid: 670, dash: 'dot', lw: 118, label: 'asks for hints (planned)' });
  edge(D, 'cog', 'llm', { dash: 'dot', label: 'model API (planned)' });
  edge(D, 'compile', 'tool', { label: 'builds with arduino-cli' });
  edge(D, 'arduino', 'robot', { from: 't', to: 'b', tf: 0.8, mid: 530, lxy: [1270, 800], label: 'offline option:\nsame RoboCore library' });
  return finishDiagram(D, [
    ['No accounts, no student data', 'Projects stay on the device that made them. Only the sketch’s code is sent to the compile server, and the server deletes it after the build.'],
    ['Works offline in part', 'Once the web app has loaded, Blocks, C++, the preview check and the simulated board work without internet. A real upload needs the compile server, or Arduino IDE 2 offline.'],
    ['One board, several robots', 'The same controller drives the classroom driving robot with its gripper arm today, and other builds later through standard connectors.'],
  ]);
}

function useCaseDiagram(parent) {
  const D = newDiagram(parent, {
    num: '1.2', kind: 'UML use case diagram', title: 'What people do with the RoboCore IDE',
    desc: 'Students work through the left column. Upload always includes a compile and a connected board (students also connect from Board Setup); with no board it runs on the preview board instead. Teachers and the team set the IDE up. Dotted ellipses are planned (Cog).',
  });
  boundary(D, { rect: { x: 200, y: 0, w: 1080, h: 920 }, tag: 'System', label: 'RoboCore IDE', dash: false, fill: 'color/bg/app', fillOpacity: 0.5 });
  actor(D, 'student', { x: 20, y: 380, title: 'Student' });
  actor(D, 'teacher', { x: 1360, y: 210, w: 160, title: 'Teacher', body: 'Can also do everything a student can' });
  actor(D, 'team', { x: 1360, y: 590, w: 160, title: 'Plastal-Bot team', body: 'or school IT' });
  const L = 260, M = 610, R = 990, W = 230;
  const left = [
    ['profile', 'Set up my profile (name, school)'], ['create', 'Create a project (Blocks or C++)'], ['example', 'Open an example'],
    ['blocks', 'Edit blocks'], ['code', 'Edit C++ code'], ['verify', 'Verify the sketch'], ['upload', 'Upload to the robot'],
    ['serial', 'Watch the Serial Monitor'], ['askcog', 'Ask Cog for help'],
  ];
  left.forEach(([id, t], i) => useCase(D, id, { x: L, y: 60 + i * 92, w: W, h: 58, title: t, planned: id === 'askcog' }));
  useCase(D, 'connect', { x: M, y: 560, w: W, h: 58, title: 'Connect the board (USB-C)' });
  useCase(D, 'preview', { x: M, y: 690, w: W, h: 58, title: 'Run on the preview board' });
  useCase(D, 'explain', { x: M, y: 820, w: W, h: 58, title: 'Explain an error', planned: true });
  useCase(D, 'cogstyle', { x: R, y: 120, w: W + 20, h: 58, title: 'Choose Cog’s help style', planned: true });
  useCase(D, 'server', { x: R, y: 240, w: W + 20, h: 58, title: 'Set the compile server' });
  useCase(D, 'libs', { x: R, y: 360, w: W + 20, h: 58, title: 'Turn libraries on or off' });
  useCase(D, 'boardtest', { x: R, y: 600, w: W + 20, h: 58, title: 'Test a new board (BoardTest)' });
  useCase(D, 'runserver', { x: R, y: 720, w: W + 20, h: 58, title: 'Run a compile server (Docker)' });
  for (const [id] of left) edge(D, 'student', id, { from: 'r', to: 'l', straight: true, head: 'none', ff: 0.3 });
  for (const id of ['cogstyle', 'server', 'libs']) edge(D, 'teacher', id, { from: 'l', to: 'r', straight: true, head: 'none', ff: 0.3 });
  for (const id of ['boardtest', 'runserver', 'server']) edge(D, 'team', id, { from: 'l', to: 'r', straight: true, head: 'none', ff: 0.3 });
  edge(D, 'upload', 'verify', { from: 't', to: 'b', dash: true, label: '«include»', ldx: 52 });
  edge(D, 'upload', 'connect', { from: 'r', to: 'l', straight: true, dash: true, ff: 0.35, label: '«include»' });
  edge(D, 'preview', 'upload', { from: 'l', to: 'r', straight: true, dash: true, tf: 0.75, lp: 0.45, lw: 170, label: '«extend»\n[port = preview board]' });
  edge(D, 'explain', 'askcog', { from: 'l', to: 'r', straight: true, dash: true, label: '«extend»' });
  return finishDiagram(D);
}
