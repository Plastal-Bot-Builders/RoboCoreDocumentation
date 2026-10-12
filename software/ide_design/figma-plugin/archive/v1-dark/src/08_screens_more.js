// ============================================================================
// Additional screens (04 — Additional Screens) — 1440 × 1000
// ============================================================================

function browseScreen(page, name, x, y, nav, o = {}) {
  const f = screenFrame(page, name, x, y);
  const s = shell(f, { context: 'Browse', nav, pad: [28, 32, 28, 32], gap: 24 });
  const connected = o.connected !== false;
  nestedProps(s.top, 'Board selector', { Status: connected ? 'Connected' : 'Disconnected', State: 'Default' });
  setStatus(s.status, { status: 'Ready', dot: connected ? 'color/status/success' : 'color/icon/muted', detail: o.detail || '', board: connected ? 'RoboCore V2 on /dev/cu.usbmodem1101 · 115200 baud' : 'RoboCore V2 · no port selected', cursor: '' });
  return Object.assign({ f }, s);
}
function pageHeader(parent, title, sub, right) {
  const h = box({ name: 'Page header', dir: 'H', gap: 16, cross: 'end', parent, wSize: 'fill' });
  const col = box({ name: 'Titles', dir: 'V', gap: 4, parent: h, grow: true });
  txt(title, { style: 'Heading/H1', parent: col, name: 'Title' });
  if (sub) txt(sub, { style: 'Body/Default', color: 'color/text/secondary', parent: col, name: 'Subtitle', fill: true });
  if (right) right(h);
  return h;
}
function sectionHeader(parent, title, link) {
  const h = box({ name: 'Section header ' + title, dir: 'H', gap: 8, cross: 'center', parent, wSize: 'fill' });
  txt(title, { style: 'Heading/H2', parent: h, name: 'Title', grow: true });
  if (link) txt(link, { style: 'Label/Default', color: 'color/text/link', parent: h, name: 'Link' });
  return h;
}
function chip(parent, label, active, count) {
  const c = box({ name: 'Chip ' + label, dir: 'H', gap: 6, pad: [0, 12, 0, 12], h: 30, cross: 'center', radius: 999, fill: active ? 'color/bg/selected' : 'color/bg/panel', stroke: active ? 'color/accent/muted' : 'color/border/subtle', parent });
  txt(label, { style: 'Label/Default', color: active ? 'color/text/primary' : 'color/text/secondary', parent: c, name: 'Label' });
  if (count !== undefined) txt(String(count), { style: 'Label/Small', color: active ? 'color/accent/default' : 'color/text/tertiary', parent: c, name: 'Count' });
  return c;
}
function card(parent, name, o = {}) {
  return box({ name, dir: 'V', gap: o.gap === undefined ? 12 : o.gap, pad: o.pad === undefined ? 20 : o.pad, parent, fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', wSize: o.wSize || 'fill', grow: o.grow, w: o.w, hSize: o.hSize });
}
function selectInst(parent, value, w, state) {
  const s = inst('Select', { State: state || 'Default' }, parent, { name: 'Select' });
  setProp(s, 'Value', value);
  if (w) s.resize(w, 32);
  return s;
}
function projectCard(parent, o) {
  const i = inst('Project Card', { Mode: o.mode || 'Blocks', State: o.hover ? 'Hover' : 'Default' }, parent, { name: 'Project ' + o.name, text: { Name: o.name, Description: o.desc, Edited: o.edited } });
  const b = i.findOne(n => n.name === 'Board badge' && n.type === 'INSTANCE');
  if (b) setText(b, 'Label', o.board || 'RoboCore V2');
  return i;
}
const PROJECTS = [
  { name: 'Blink LED', mode: 'Blocks', desc: 'Turn the built-in LED on and off every second.', edited: 'Edited 2 min ago', board: 'RoboCore V2' },
  { name: 'Obstacle avoider', mode: 'Code', desc: 'Drive forward and turn away when the sonar sees a wall.', edited: 'Edited 2h ago', board: 'RoboCore V2' },
  { name: 'Traffic light', mode: 'Blocks', desc: 'Red, amber and green LEDs with a pedestrian button.', edited: 'Edited yesterday', board: 'Arduino Uno R3' },
  { name: 'Line follower', mode: 'Blocks', desc: 'Follow a black line using the 3-channel IR sensor.', edited: 'Edited 3 days ago', board: 'RoboCore V2' },
  { name: 'Buzzer melody', mode: 'Code', desc: 'Play a tune with tone() and an array of notes.', edited: 'Edited last week', board: 'Arduino Uno R3' },
  { name: 'Servo sweep', mode: 'Code', desc: 'Sweep a servo from 0° to 180° and back.', edited: 'Edited 2 weeks ago', board: 'ESP32 DevKit V1' },
  { name: 'Distance monitor', mode: 'Blocks', desc: 'Print ultrasonic readings to the serial monitor.', edited: 'Edited 3 weeks ago', board: 'RoboCore V2' },
  { name: 'Sensor logger', mode: 'Code', desc: 'Log temperature and IMU angles every second.', edited: 'Edited last month', board: 'NodeMCU-32S' },
];
const EXAMPLES = [
  { title: 'Blink an LED', desc: 'Your first program: switch the built-in LED on and off with a delay.', level: 'Beginner', color: 'color/block/output', icon: 'lightbulb' },
  { title: 'Button-controlled LED', desc: 'Read the USER button and light the LED while it is pressed.', level: 'Beginner', color: 'color/block/input', icon: 'log-in' },
  { title: 'Traffic light', desc: 'Sequence three LEDs with timing, then add a crossing button.', level: 'Beginner', color: 'color/block/control', icon: 'clock' },
  { title: 'Ultrasonic distance monitor', desc: 'Measure distance with the HC-SR04 and print it to serial.', level: 'Intermediate', color: 'color/block/sensors', icon: 'radio', boards: 'V2 · Uno · ESP32' },
  { title: 'Buzzer tone generator', desc: 'Play notes and simple melodies with tone() and noTone().', level: 'Beginner', color: 'color/block/output', icon: 'activity' },
  { title: 'Basic motor control', desc: 'Drive forward, reverse and turn with the two motor ports.', level: 'Intermediate', color: 'color/block/robotics', icon: 'bot', boards: 'RoboCore V2 only' },
  { title: 'Read sensors to serial', desc: 'Print temperature and IMU readings as CSV for plotting.', level: 'Beginner', color: 'color/block/communication', icon: 'message', boards: 'RoboCore V2 only' },
  { title: 'Obstacle avoider', desc: 'Combine sonar and motors into a robot that steers around walls.', level: 'Advanced', color: 'color/block/robotics', icon: 'zap', boards: 'RoboCore V2 only' },
];

// ---------------------------------------------------------------- Home
function homeScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.name || 'Home', x, y, 'Home', { detail: '8 projects · saved in this browser' });
  const m = s.main;
  const hero = box({ name: 'Hero', dir: 'V', gap: 6, parent: m, wSize: 'fill' });
  const h1 = txt('Welcome back, Fredrick', { style: 'Heading/Display', parent: hero, name: 'Greeting' });
  const sub = txt('Build. Code. Create. — pick up where you left off, or start something new.', { style: 'Body/Default', color: 'color/text/secondary', parent: hero, name: 'Subtitle' });
  sub.setRangeFills(0, 20, [paint('color/brand/default')]);
  const qa = box({ name: 'Quick actions', dir: 'H', gap: 16, parent: m, wSize: 'fill' });
  const acts = [
    ['New blocks project', 'Drag-and-drop programming for beginners', 'blocks', 'Accent'],
    ['New code sketch', 'Arduino-style C++ with autocomplete', 'code', 'Brand'],
    ['Open from computer', 'Import an .ino sketch or .rcproj file', 'folder-open', 'Neutral'],
    ['Connect a board', 'RoboCore V2, Arduino Uno or ESP32 over USB', 'plug', 'Neutral'],
  ];
  for (const [t, d, ic, tone] of acts) {
    const i = tileInst('Quick Action', qa, { title: t, desc: d, icon: ic, tone });
    i.name = 'Quick action ' + t;
    i.layoutGrow = 1;
  }
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill' });
  const left = box({ name: 'Recent', dir: 'V', gap: 12, parent: cols, grow: true });
  sectionHeader(left, 'Recent projects', 'View all projects →');
  const row = box({ name: 'Recent cards', dir: 'H', gap: 16, parent: left, wSize: 'fill' });
  PROJECTS.slice(0, 3).forEach((p, i) => projectCard(row, Object.assign({}, p, { hover: i === 0 })));
  const right = box({ name: 'Your board', dir: 'V', gap: 12, w: 296, parent: cols });
  sectionHeader(right, 'Your board', null);
  inst('Board Info Card', { Status: 'Connected' }, right, { name: 'Board info' });
  const tp = box({ name: 'Templates', dir: 'V', gap: 12, parent: m, wSize: 'fill' });
  sectionHeader(tp, 'Starter templates', 'Browse all examples →');
  const tr = box({ name: 'Template tiles', dir: 'H', gap: 16, parent: tp, wSize: 'fill' });
  const tpl = [['Traffic light', 'Three LEDs and a crossing button', 'clock', 'color/block/control'], ['Line follower', 'Follow a black line with 3 IR sensors', 'bot', 'color/block/robotics'], ['Obstacle avoider', 'Sonar + motors steer around walls', 'radio', 'color/block/sensors'], ['Buzzer melody', 'Play a tune with tone()', 'activity', 'color/block/output']];
  for (const [t, d, ic, col] of tpl) { const i = tileInst('Template Tile', tr, { title: t, desc: d, icon: ic, color: col }); i.layoutGrow = 1; i.name = 'Template ' + t; }
  if (o.dialog) {
    rect({ name: 'Scrim', w: SW, h: SH, fill: 'color/bg/overlay', parent: s.f, abs: true, x: 0, y: 0 });
    const d = inst('Dialog/New Project', null, s.f, { name: 'Dialog', abs: true });
    d.x = Math.round((SW - d.width) / 2); d.y = Math.round((SH - d.height) / 2) - 20;
  }
  return s.f;
}

// ---------------------------------------------------------------- Projects
function projectsScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.empty ? 'Projects — Empty state' : 'Projects', x, y, 'Projects', { detail: o.empty ? 'No projects yet' : '8 projects · saved in this browser' });
  const m = s.main;
  pageHeader(m, 'Projects', o.empty ? 'Everything you build lives here.' : '8 projects · saved in this browser until you sign in', (h) => {
    if (o.empty) return;
    const vt = box({ name: 'View toggle', dir: 'H', gap: 2, pad: 2, radius: 8, fill: 'color/bg/input', stroke: 'color/border/subtle', parent: h });
    iconBtn(vt, 'grid', { state: 'Active', name: 'Grid view' }); iconBtn(vt, 'list', { name: 'List view' });
    selectInst(h, 'Sort: Last edited', 180);
  });
  if (o.empty) {
    const es = box({ name: 'Empty state', dir: 'V', gap: 16, pad: [64, 0, 0, 0], cross: 'center', parent: m, wSize: 'fill', grow: true });
    const circ = box({ name: 'Illustration', dir: 'H', w: 112, h: 112, align: 'center', cross: 'center', radius: 999, fill: 'color/accent/subtle', stroke: 'color/accent/muted', parent: es });
    iconSlot(circ, 'folder-open', 'color/icon/active', 44, 'Icon');
    txt('No projects yet', { style: 'Heading/H1', parent: es, name: 'Title' });
    txt('Create your first project or start from an example. Projects are saved in this browser — sign in to sync them across devices.', { style: 'Body/Default', color: 'color/text/secondary', parent: es, name: 'Body', w: 520, align: 'CENTER' });
    const ac = box({ name: 'Actions', dir: 'H', gap: 8, parent: es });
    const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'New project' }); setProp(b1, 'Label', 'New project');
    const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Browse examples' }); setProp(b2, 'Label', 'Browse examples'); setProp(b2, 'Icon', ICON['lightbulb'].id);
    spacer(es, 24);
    txt('OR START FROM A TEMPLATE', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: es, name: 'Overline' });
    const tr = box({ name: 'Template tiles', dir: 'H', gap: 16, parent: es });
    for (const [t, d, ic, col] of [['Blink LED', 'The classic first program', 'lightbulb', 'color/block/output'], ['Traffic light', 'Three LEDs and a button', 'clock', 'color/block/control'], ['Line follower', 'Follow a line with IR sensors', 'bot', 'color/block/robotics']]) tileInst('Template Tile', tr, { title: t, desc: d, icon: ic, color: col });
    return s.f;
  }
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  chip(fr, 'All', true, 8); chip(fr, 'Blocks', false, 4); chip(fr, 'Code', false, 4);
  divider(fr, 'V', 20);
  selectInst(fr, 'All boards', 160);
  spacer(fr, 1, true);
  const sf = inst('Search Field', null, fr, { name: 'Filter' }); setProp(sf, 'Placeholder', 'Filter projects');
  const grid = box({ name: 'Project grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  PROJECTS.forEach((p, i) => projectCard(grid, Object.assign({}, p, { hover: i === 1 })));
  return s.f;
}

// ---------------------------------------------------------------- Examples
function examplesScreen(page, x, y) {
  const s = browseScreen(page, 'Examples', x, y, 'Examples', { detail: '24 examples · RoboCore V2 board package 1.0' });
  const m = s.main;
  pageHeader(m, 'Examples', 'Step-by-step programs for RoboCore kits. Opening one makes a copy in Projects that you can change.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search examples'); });
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  chip(fr, 'All', true, 24); chip(fr, 'Basics', false, 6); chip(fr, 'Sensors', false, 5); chip(fr, 'Motors & robotics', false, 6); chip(fr, 'Sound & light', false, 4); chip(fr, 'Communication', false, 3);
  spacer(fr, 1, true);
  selectInst(fr, 'All levels', 140); selectInst(fr, 'RoboCore V2', 160);
  // learning path banner
  const bn = box({ name: 'Learning path', dir: 'H', gap: 16, pad: [16, 20, 16, 16], cross: 'center', radius: 12, fill: 'color/brand/subtle', stroke: 'color/brand/pressed', strokeOpacity: 0.5, parent: m, wSize: 'fill' });
  const it = box({ name: 'Icon tile', dir: 'H', w: 48, h: 48, align: 'center', cross: 'center', radius: 12, fill: 'color/brand/default', parent: bn });
  iconSlot(it, 'graduation', 'color/icon/on-accent', 24, 'Icon');
  const bc = box({ name: 'Text', dir: 'V', gap: 2, parent: bn, grow: true });
  txt('LEARNING PATH', { style: 'Caption/Overline', color: 'color/brand/default', parent: bc, name: 'Overline' });
  txt('From blink to line follower — 12 short lessons', { style: 'Heading/H3', parent: bc, name: 'Title' });
  txt('Start with blocks, then see the same programs in C++. Lesson 4: reading the ultrasonic sensor.', { style: 'Body/Small', color: 'color/text/secondary', parent: bc, name: 'Body', fill: true });
  const pg = box({ name: 'Progress', dir: 'V', gap: 6, w: 180, parent: bn });
  txt('3 of 12 complete', { style: 'Label/Small', color: 'color/text/secondary', parent: pg, name: 'Progress label' });
  const tr = box({ name: 'Track', dir: 'H', h: 6, radius: 999, fill: 'color/bg/hover', parent: pg, wSize: 'fill' });
  rect({ name: 'Fill', w: 45, h: 6, radius: 999, fill: 'color/brand/default', parent: tr });
  const cb = inst('Button', { Variant: 'Secondary', State: 'Default' }, bn, { name: 'Continue' }); setProp(cb, 'Label', 'Continue lesson 4'); setProp(cb, 'Icon', ICON['arrow-right'].id);
  const grid = box({ name: 'Example grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  EXAMPLES.forEach(e => { const c = exampleCard(grid, e); c.name = 'Example ' + e.title; });
  return s.f;
}

// ---------------------------------------------------------------- Libraries
function librariesScreen(page, x, y) {
  const s = browseScreen(page, 'Libraries', x, y, 'Libraries', { detail: '4 included · 2 installed' });
  const m = s.main;
  pageHeader(m, 'Libraries', 'Code libraries your sketches can #include. RoboCore libraries ship with the board package; others come from the Arduino Library Manager.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search libraries'); });
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  chip(fr, 'All', true, 10); chip(fr, 'Included', false, 4); chip(fr, 'Installed', false, 2); chip(fr, 'Available', false, 4);
  const tb = card(m, 'Library table', { pad: 0, gap: 0 });
  const hdr = box({ name: 'Table header', dir: 'H', gap: 16, pad: [0, 20, 0, 20], h: 40, cross: 'center', parent: tb, wSize: 'fill', fill: 'color/bg/chrome', stroke: 'color/border/subtle', sides: { b: 1 } });
  const cols = [['Library', 0], ['Version', 96], ['Works with', 180], ['Status', 120], ['', 112]];
  cols.forEach(([c, w]) => { const t = txt(c || ' ', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: hdr, name: 'Col ' + c }); if (w) { t.textAutoResize = 'HEIGHT'; t.resize(w, t.height); } else { t.textAutoResize = 'HEIGHT'; t.layoutGrow = 1; } });
  const libs = [
    ['RoboCore Motors', 'RoboCore', 'Drive the two motor ports with encoder feedback and ramping.', '1.0.0', 'RoboCore V2', 'Included'],
    ['RoboCore Sensors', 'RoboCore', 'Ultrasonic, 3-channel line sensor and IMU helpers.', '1.0.0', 'RoboCore V2', 'Included'],
    ['Wire', 'Arduino', 'I²C communication (Qwiic port and expansion headers).', 'core', 'All boards', 'Included'],
    ['Servo / ESP32Servo', 'Kevin Harrington', 'Control hobby servos with PWM.', '3.0.5', 'V2 · ESP32 · Uno', 'Installed'],
    ['Adafruit NeoPixel', 'Adafruit', 'WS2812B RGB LEDs, including the RoboCore V2 status LED.', '1.12.3', 'All boards', 'Installed'],
    ['NewPing', 'Tim Eckel', 'Fast, timeout-safe ultrasonic distance readings.', '1.9.7', 'All boards', 'Available'],
    ['Adafruit LSM6DS', 'Adafruit', 'Accelerometer and gyroscope driver for LSM6DS IMUs.', '4.7.3', 'V2 · ESP32', 'Available'],
    ['LiquidCrystal I2C', 'Frank de Brabander', '16×2 and 20×4 character LCDs over I²C.', '1.1.2', 'All boards', 'Available'],
  ];
  libs.forEach(([n, a, d, v, w, st], i) => {
    const r = box({ name: 'Row ' + n, dir: 'H', gap: 16, pad: [12, 20, 12, 20], cross: 'center', parent: tb, wSize: 'fill', stroke: i < libs.length - 1 ? 'color/border/subtle' : undefined, sides: i < libs.length - 1 ? { b: 1 } : undefined, fill: i === 0 ? 'color/bg/raised' : undefined });
    const c1 = box({ name: 'Name', dir: 'V', gap: 2, parent: r, grow: true });
    const tl = box({ name: 'Title line', dir: 'H', gap: 8, cross: 'center', parent: c1 });
    txt(n, { style: 'Label/Strong', parent: tl, name: 'Library' });
    txt('by ' + a, { style: 'Caption/Default', color: 'color/text/tertiary', parent: tl, name: 'Author' });
    txt(d, { style: 'Body/Small', color: 'color/text/secondary', parent: c1, name: 'Description', fill: true });
    txt(v, { style: 'Code/Small', color: 'color/text/secondary', parent: r, name: 'Version', w: 96 });
    txt(w, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Boards', w: 180 });
    const sw = box({ name: 'Status cell', dir: 'H', w: 120, parent: r });
    const b = inst('Badge', { Tone: st === 'Included' ? 'Brand' : (st === 'Installed' ? 'Success' : 'Neutral') }, sw, { name: 'Status' }); setProp(b, 'Label', st);
    const ac = box({ name: 'Action cell', dir: 'H', w: 112, align: 'end', parent: r });
    if (st === 'Available') { const bt = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Install' }); setProp(bt, 'Label', 'Install'); setProp(bt, 'Icon', ICON['download'].id); }
    else if (st === 'Installed') { const bt = inst('Button', { Variant: 'Ghost', State: 'Default' }, ac, { name: 'Examples' }); setProp(bt, 'Label', 'Examples'); setProp(bt, 'Show icon', false); }
    else txt('Board package', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ac, name: 'Included note' });
  });
  return s.f;
}

// ---------------------------------------------------------------- Board illustration (schematic, follows the V2 layout:
// ESP32 top centre, motors upper L/R, servos middle L/R, two 1x14 headers centre, bottom row sonar / USB-C / line)
function drawBoard(parent, w, h) {
  const g = box({ name: 'RoboCore V2 illustration', w, h, parent });
  const pcb = rect({ name: 'PCB', w, h, radius: 12, fill: 'color/bg/raised', parent: g });
  pcb.strokes = [paint('color/brand/default')]; pcb.strokeWeight = 1.5; pcb.strokeAlign = 'INSIDE';
  const silk = rect({ name: 'Silk outline', w: w - 16, h: h - 16, radius: 8, parent: g, x: 8, y: 8 });
  silk.strokes = [paint('color/brand/default', 0.35)]; silk.strokeWeight = 1; silk.strokeAlign = 'INSIDE';
  const lab = (t, x, y, col) => { const n = txt(t, { style: 'Caption/Overline', color: col || 'color/brand/default', parent: g, name: 'Silk ' + t }); n.x = x; n.y = y; return n; };
  const part = (name, x, y, pw, ph, fill, r) => rect({ name, w: pw, h: ph, radius: r === undefined ? 2 : r, fill, parent: g, x, y });
  const ring = (n) => { n.strokes = [paint('color/border/strong')]; n.strokeWeight = 1; return n; };
  // top row: status LEDs (top-left), Qwiic (top-right)
  ['color/status/success', 'color/status/warning', 'color/status/error'].forEach((c, i) => part('Status LED', 20 + i * 9, 16, 6, 4, c, 1));
  part('Qwiic', w - 38, 14, 18, 9, 'color/text/primary', 2); lab('QWIIC', w - 84, 11);
  // ESP32-S3 module with antenna
  const mx = Math.round(w / 2 - 46);
  ring(part('ESP32-S3 module', mx, 24, 92, 62, 'color/bg/panel', 3));
  part('RF shield', mx + 8, 40, 76, 40, 'color/text/tertiary', 2).opacity = 0.55;
  const ant = figma.createVector(); ant.name = 'Antenna';
  ant.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 6 L 8 6 L 8 0 L 16 0 L 16 6 L 24 6 L 24 0 L 32 0 L 32 6 L 40 6 L 40 0 L 48 0 L 48 6 L 56 6 L 56 0 L 64 0 L 64 6 L 76 6' }];
  ant.strokes = [paint('color/brand/default')]; ant.strokeWeight = 1.2; ant.fills = []; g.appendChild(ant); ant.x = mx + 8; ant.y = 28;
  lab('ESP32-S3', mx + 20, 54, 'color/text/inverse');
  // motors (upper left / right)
  part('Motor L connector', 20, 38, 40, 14, 'color/text/primary', 2); lab('MOTOR L', 20, 56);
  part('Motor R connector', w - 60, 38, 40, 14, 'color/text/primary', 2); lab('MOTOR R', w - 66, 56);
  // servos (middle left / right): 2 x 3 pins each
  const pins = (x0, y0) => { for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) { const p = part('Servo pin', x0 + c * 9, y0 + r * 9, 6, 6, 'color/bg/app', 1); p.strokes = [paint('color/brand/default', 0.8)]; } };
  pins(22, 100); lab('SERVO 1–2', 18, 122);
  pins(w - 49, 100); lab('SERVO 3–4', w - 74, 122);
  // two 1x14 expansion headers (centre)
  const hx = [Math.round(w / 2 - 30), Math.round(w / 2 + 22)];
  hx.forEach((x, k) => { part('Header 1x14', x, 98, 8, 102, 'color/bg/app', 2); for (let i = 0; i < 14; i++) part('Header hole', x + 2, 101 + i * 7, 4, 4, 'color/text/tertiary', 2); });
  lab('EXP A', hx[0] - 14, 204); lab('EXP B', hx[1] - 12, 204);
  // RGB LED, buzzer, IMU, USER button
  part('RGB LED', mx - 22, 74, 10, 10, 'color/text/primary', 2); lab('RGB', mx - 30, 86);
  const bz = figma.createEllipse(); bz.name = 'Buzzer'; bz.resize(24, 24); bz.fills = [paint('color/bg/app')]; ring(bz); g.appendChild(bz); bz.x = 26; bz.y = 148; lab('BUZZER', 18, 176);
  ring(part('IMU', w - 92, 150, 14, 14, 'color/bg/app', 2)); lab('IMU', w - 94, 168);
  ring(part('USER button', w - 36, 150, 14, 14, 'color/bg/app', 7)); lab('USER', w - 44, 168);
  // bottom row: sonar, USB-C, line sensor
  part('Ultrasonic connector', 20, h - 48, 36, 12, 'color/text/primary', 2); lab('SONAR', 20, h - 32);
  part('USB-C', Math.round(w / 2 - 15), h - 24, 30, 12, 'color/text/secondary', 6); lab('USB-C', Math.round(w / 2 + 20), h - 26);
  part('Line sensor connector', w - 64, h - 48, 44, 12, 'color/text/primary', 2); lab('LINE', w - 52, h - 32);
  return g;
}

// ---------------------------------------------------------------- Board Setup
function boardSetupScreen(page, x, y) {
  const s = browseScreen(page, 'Board Setup', x, y, 'Board Setup', { detail: 'RoboCore V2 board package 1.0 · esp32 core 3.0.7' });
  const m = s.main;
  pageHeader(m, 'Board Setup', 'Choose a board profile, connect over USB and set build options.', (h) => {
    inst('Connection Status', { Status: 'Connected' }, h, { name: 'Connection' });
    const b = inst('Button', { Variant: 'Secondary', State: 'Default' }, h, { name: 'Disconnect' }); setProp(b, 'Label', 'Disconnect'); setProp(b, 'Icon', ICON['unplug'].id);
  });
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill', grow: true });
  // profiles list
  const lc = card(cols, 'Board profiles', { w: 300, wSize: 'fixed', pad: 12, gap: 4, hSize: 'fill' });
  const lh = box({ name: 'Header', dir: 'H', pad: [4, 8, 8, 8], parent: lc, wSize: 'fill' });
  txt('BOARD PROFILES', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: lh, name: 'Label' });
  BOARDS.forEach(([n, d, tag], i) => {
    const sel = i === 0;
    const r = box({ name: 'Profile ' + n, dir: 'H', gap: 10, pad: [10, 10, 10, 8], cross: 'center', radius: 8, fill: sel ? 'color/bg/selected' : undefined, stroke: sel ? 'color/accent/muted' : undefined, parent: lc, wSize: 'fill' });
    const t = box({ name: 'Chip tile', dir: 'H', w: 36, h: 36, align: 'center', cross: 'center', radius: 8, fill: 'color/bg/raised', parent: r });
    iconSlot(t, 'cpu', sel ? 'color/icon/brand' : 'color/icon/muted', 18, 'Icon');
    const c = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true }); c.layoutSizingHorizontal = 'FILL';
    txt(n, { style: 'Label/Strong', parent: c, name: 'Name' });
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Specs', fill: true });
  });
  spacer(lc, 1, true);
  const nt = box({ name: 'Note', dir: 'H', gap: 8, pad: [10, 8, 4, 8], cross: 'start', parent: lc, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  iconSlot(nt, 'info', 'color/icon/muted', 16, 'Icon');
  txt('Profiles come from the RoboCore board registry. New kits appear here after a board-package update.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: nt, name: 'Note', grow: true });
  // detail
  const rc = box({ name: 'Detail column', dir: 'V', gap: 24, parent: cols, grow: true, hSize: 'fill' });
  const dc = card(rc, 'Board detail', { gap: 16 });
  const dh = box({ name: 'Detail header', dir: 'H', gap: 8, cross: 'center', parent: dc, wSize: 'fill' });
  txt('RoboCore V2', { style: 'Heading/H2', parent: dh, name: 'Board' });
  const b1 = inst('Badge', { Tone: 'Brand' }, dh, { name: 'Recommended' }); setProp(b1, 'Label', 'Recommended'); setProp(b1, 'Show dot', false);
  const b2 = inst('Badge', { Tone: 'Warning' }, dh, { name: 'Prototype' }); setProp(b2, 'Label', 'Prototype · rev 2.0');
  spacer(dh, 1, true);
  txt('Board package 1.0 · esp32 core 3.0.7', { style: 'Caption/Default', color: 'color/text/tertiary', parent: dh, name: 'Package' });
  const db = box({ name: 'Detail body', dir: 'H', gap: 24, parent: dc, wSize: 'fill' });
  drawBoard(db, 272, 256);
  const specs = box({ name: 'Specs', dir: 'V', gap: 7, parent: db, grow: true });
  const SPECS = [['MCU', 'ESP32-S3-WROOM-1 · dual-core 240 MHz'], ['Memory', '8 MB flash · 2 MB PSRAM · 512 KB SRAM'], ['USB', 'USB-C · native USB-CDC (no driver needed)'], ['Wireless', 'Wi-Fi 4 · Bluetooth LE 5'], ['Motors', '2 × DC with encoders (JST-SH 6-pin)'], ['Servos', '4 × 3-pin headers'], ['Sensors', 'Ultrasonic port · 3-channel line sensor port · 6-axis IMU'], ['Outputs', 'RGB LED (WS2812B) · buzzer · status LEDs'], ['Power', '1S Li-ion (XT30) · charges over USB-C'], ['Expansion', '2 × 14-pin headers · Qwiic (I²C)']];
  for (const [k, v] of SPECS) {
    const r = box({ name: 'Spec ' + k, dir: 'H', gap: 12, parent: specs, wSize: 'fill' });
    txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 76 });
    txt(v, { style: 'Body/Small', parent: r, name: 'Value', grow: true });
  }
  const pn = box({ name: 'Pinout note', dir: 'H', gap: 8, pad: [8, 10, 8, 10], cross: 'start', radius: 8, fill: 'color/status/info-subtle', parent: specs, wSize: 'fill' });
  iconSlot(pn, 'info', 'color/status/info', 16, 'Icon');
  txt('Pin names come from the RoboCore V2 board package. Check the pinout card before wiring sensors.', { style: 'Caption/Default', color: 'color/text/secondary', parent: pn, name: 'Note', grow: true });
  // connection + build options
  const row = box({ name: 'Config row', dir: 'H', gap: 24, parent: rc, wSize: 'fill', grow: true });
  const cc = card(row, 'Connection', { grow: true, hSize: 'fill', gap: 14 });
  const ch = box({ name: 'Header', dir: 'H', gap: 8, cross: 'center', parent: cc, wSize: 'fill' });
  iconSlot(ch, 'usb', 'color/icon/brand', 18, 'Icon');
  txt('Connection', { style: 'Heading/H3', parent: ch, name: 'Title', grow: true });
  inst('Connection Status', { Status: 'Connected' }, ch, { name: 'Connection' });
  labeledSelect(cc, 'Serial port', '/dev/cu.usbmodem1101 — RoboCore V2');
  const r2 = box({ name: 'Speeds', dir: 'H', gap: 12, parent: cc, wSize: 'fill' });
  labeledSelect(r2, 'Monitor baud rate', '115200');
  labeledSelect(r2, 'Upload speed', '921600');
  const cb = box({ name: 'Buttons', dir: 'H', gap: 8, parent: cc, wSize: 'fill' });
  const t1 = inst('Button', { Variant: 'Secondary', State: 'Default' }, cb, { name: 'Test connection' }); setProp(t1, 'Label', 'Test connection'); setProp(t1, 'Icon', ICON['activity'].id);
  const t2 = inst('Button', { Variant: 'Ghost', State: 'Default' }, cb, { name: 'Refresh ports' }); setProp(t2, 'Label', 'Refresh ports'); setProp(t2, 'Icon', ICON['refresh'].id);
  txt('Last checked 14:02 · chip ESP32-S3 rev 0.2 responded in 38 ms', { style: 'Caption/Default', color: 'color/text/tertiary', parent: cc, name: 'Result' });
  const bo = card(row, 'Build options', { grow: true, hSize: 'fill', gap: 14 });
  const bh = box({ name: 'Header', dir: 'H', gap: 8, cross: 'center', parent: bo, wSize: 'fill' });
  iconSlot(bh, 'sliders', 'color/icon/brand', 18, 'Icon');
  txt('Build options', { style: 'Heading/H3', parent: bh, name: 'Title', grow: true });
  txt('Reset to defaults', { style: 'Label/Default', color: 'color/text/link', parent: bh, name: 'Reset' });
  const g1 = box({ name: 'Options A', dir: 'H', gap: 12, parent: bo, wSize: 'fill' });
  labeledSelect(g1, 'CPU frequency', '240 MHz (Wi-Fi)'); labeledSelect(g1, 'Flash size', '8 MB (64 Mb)');
  labeledSelect(bo, 'Partition scheme', '8M with SPIFFS (3 MB app / 1.5 MB SPIFFS)');
  const g2 = box({ name: 'Options B', dir: 'H', gap: 12, parent: bo, wSize: 'fill' });
  labeledSelect(g2, 'PSRAM', 'QSPI PSRAM'); labeledSelect(g2, 'USB CDC on boot', 'Enabled');
  return s.f;
}

// ---------------------------------------------------------------- Serial Monitor
const SERIAL_STREAM = [
  ['', 'sys', '— Connected to /dev/cu.usbmodem1101 at 115200 baud —'],
  ['14:12:01.204', 'rx', 'RoboCore V2 ready'],
  ['14:12:01.310', 'rx', 'distance_cm=48.2  temp_c=26.4'],
  ['14:12:01.560', 'rx', 'distance_cm=47.9  temp_c=26.4'],
  ['14:12:01.810', 'rx', 'distance_cm=45.1  temp_c=26.5'],
  ['14:12:02.060', 'rx', 'distance_cm=39.6  temp_c=26.5'],
  ['14:12:02.310', 'rx', 'distance_cm=33.0  temp_c=26.5'],
  ['14:12:02.560', 'rx', 'distance_cm=27.4  temp_c=26.5'],
  ['14:12:03.112', 'tx', 'status'],
  ['14:12:03.118', 'rx', 'ok · uptime 132 s · battery 3.92 V · motors idle'],
  ['14:12:03.310', 'rx', 'distance_cm=21.8  temp_c=26.6'],
  ['14:12:03.560', 'rx', 'distance_cm=16.2  temp_c=26.6'],
  ['14:12:03.810', 'warn', 'distance_cm=12.6  obstacle < 15 cm → turning left'],
  ['14:12:04.060', 'rx', 'distance_cm=18.9  temp_c=26.6'],
  ['14:12:04.310', 'rx', 'distance_cm=31.5  temp_c=26.6'],
  ['14:12:04.560', 'rx', 'distance_cm=44.0  temp_c=26.6'],
  ['14:12:05.002', 'tx', 'led off'],
  ['14:12:05.006', 'rx', 'ok · LED off'],
  ['14:12:05.310', 'rx', 'distance_cm=46.7  temp_c=26.7'],
  ['14:12:05.560', 'rx', 'distance_cm=47.2  temp_c=26.7'],
  ['14:12:05.810', 'rx', 'distance_cm=47.0  temp_c=26.7'],
  ['14:12:06.060', 'rx', 'distance_cm=46.8  temp_c=26.7'],
];
function serialScreen(page, x, y, o = {}) {
  const connected = o.connected !== false;
  const s = browseScreen(page, connected ? 'Serial Monitor' : 'Serial Monitor — Not connected', x, y, 'Serial Monitor', { connected, detail: connected ? 'Received 12.4 KB · 214 lines' : 'Serial port closed' });
  const m = s.main;
  pageHeader(m, 'Serial Monitor', 'Read and send text over the board’s USB serial port.', (h) => {
    inst('Connection Status', { Status: connected ? 'Connected' : 'Disconnected' }, h, { name: 'Connection' });
    const b = inst('Button', { Variant: connected ? 'Secondary' : 'Primary', State: 'Default' }, h, { name: connected ? 'Disconnect' : 'Connect' });
    setProp(b, 'Label', connected ? 'Disconnect' : 'Connect board'); setProp(b, 'Icon', ICON[connected ? 'unplug' : 'plug'].id);
  });
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill', grow: true });
  const pnl = box({ name: 'Console panel', dir: 'V', parent: cols, grow: true, hSize: 'fill', fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', clip: true });
  const tb = box({ name: 'Toolbar', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 52, cross: 'center', parent: pnl, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  selectInst(tb, connected ? '/dev/cu.usbmodem1101 — RoboCore V2' : 'Select a port…', 270, connected ? 'Default' : 'Default');
  selectInst(tb, '115200 baud', 128);
  divider(tb, 'V', 20);
  const seg = box({ name: 'View switch', dir: 'H', gap: 2, pad: 2, radius: 8, fill: 'color/bg/input', stroke: 'color/border/subtle', parent: tb });
  for (const [l, on] of [['Monitor', true], ['Plotter', false]]) { const sg = box({ name: 'Segment ' + l, dir: 'H', pad: [0, 10, 0, 10], h: 26, cross: 'center', radius: 6, fill: on ? 'color/bg/selected' : undefined, parent: seg }); txt(l, { style: 'Label/Default', color: on ? 'color/text/primary' : 'color/text/tertiary', parent: sg, name: 'Label' }); }
  spacer(tb, 1, true);
  for (const [l, on] of [['Timestamps', true], ['Autoscroll', true]]) { const t = box({ name: 'Toggle ' + l, dir: 'H', gap: 8, cross: 'center', parent: tb }); inst('Toggle', { On: on ? 'True' : 'False', Disabled: connected ? 'False' : 'True' }, t, { name: 'Toggle' }); txt(l, { style: 'Label/Default', color: 'color/text/secondary', parent: t, name: 'Label' }); }
  divider(tb, 'V', 20);
  iconBtn(tb, 'pause', { name: 'Pause', state: connected ? 'Default' : 'Disabled' });
  iconBtn(tb, 'trash', { name: 'Clear', state: connected ? 'Default' : 'Disabled' });
  iconBtn(tb, 'download', { name: 'Save log', state: connected ? 'Default' : 'Disabled' });
  if (connected) consoleView(pnl, SERIAL_STREAM, { name: 'Console' });
  else {
    const es = box({ name: 'Empty state', dir: 'V', gap: 12, align: 'center', cross: 'center', parent: pnl, wSize: 'fill', grow: true, fill: 'color/bg/console' });
    const ic = box({ name: 'Icon circle', dir: 'H', w: 72, h: 72, align: 'center', cross: 'center', radius: 999, fill: 'color/bg/raised', stroke: 'color/border/default', parent: es });
    iconSlot(ic, 'unplug', 'color/icon/muted', 32, 'Icon');
    txt('No board connected', { style: 'Heading/H2', parent: es, name: 'Title' });
    txt('Plug RoboCore V2 into a USB-C port and choose Connect. Chrome and Edge ask for permission to use the port the first time.', { style: 'Body/Default', color: 'color/text/secondary', parent: es, name: 'Body', w: 460, align: 'CENTER' });
    const ac = box({ name: 'Actions', dir: 'H', gap: 8, parent: es });
    const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'Connect board' }); setProp(b1, 'Label', 'Connect board'); setProp(b1, 'Icon', ICON['plug'].id);
    const b2 = inst('Button', { Variant: 'Ghost', State: 'Default' }, ac, { name: 'Demo' }); setProp(b2, 'Label', 'Show sample output (demo)'); setProp(b2, 'Icon', ICON['play'].id);
    txt('Sample output is clearly marked DEMO and never mixed with real device data.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: es, name: 'Demo note' });
  }
  const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'center', parent: pnl, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
  const fld = box({ name: 'Message field', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 36, cross: 'center', radius: 8, fill: connected ? 'color/bg/input' : 'color/bg/panel', stroke: 'color/border/default', parent: ir, grow: true });
  txt(connected ? 'Type a message and press Enter' : 'Connect a board to send messages', { style: 'Body/Small', color: connected ? 'color/text/tertiary' : 'color/text/disabled', parent: fld, name: 'Placeholder', grow: true });
  selectInst(ir, 'New line (\\n)', 150, connected ? 'Default' : 'Disabled').resize(150, 36);
  const sb = inst('Button', { Variant: connected ? 'Primary' : 'Primary', State: connected ? 'Default' : 'Disabled' }, ir, { name: 'Send' }); setProp(sb, 'Label', 'Send'); setProp(sb, 'Icon', ICON['send'].id);
  sb.resize(sb.width, 36);
  // side column
  const side = box({ name: 'Side', dir: 'V', gap: 16, w: 288, parent: cols });
  if (connected) {
    const qs = card(side, 'Quick send', { gap: 4, pad: 16 });
    const qh = box({ name: 'Header', dir: 'H', pad: [0, 0, 8, 0], parent: qs, wSize: 'fill' });
    txt('Quick send', { style: 'Heading/H3', parent: qh, name: 'Title', grow: true });
    txt('Edit', { style: 'Label/Default', color: 'color/text/link', parent: qh, name: 'Edit' });
    for (const c of ['status', 'led on', 'led off', 'beep 440', 'motors stop']) {
      const r = box({ name: 'Command ' + c, dir: 'H', gap: 8, pad: [6, 6, 6, 10], cross: 'center', radius: 8, fill: c === 'status' ? 'color/bg/hover' : undefined, parent: qs, wSize: 'fill' });
      txt(c, { style: 'Code/Small', parent: r, name: 'Command', grow: true });
      iconBtn(r, 'send', { name: 'Send ' + c });
    }
    const ss = card(side, 'Session', { gap: 8, pad: 16 });
    txt('Session', { style: 'Heading/H3', parent: ss, name: 'Title' });
    for (const [k, v] of [['Received', '12.4 KB · 214 lines'], ['Sent', '6 messages'], ['Connected', '00:03:12'], ['Format', '115200 baud · 8-N-1']]) {
      const r = box({ name: 'Stat ' + k, dir: 'H', gap: 8, parent: ss, wSize: 'fill' });
      txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 80 });
      txt(v, { style: 'Body/Small', parent: r, name: 'Value', grow: true });
    }
    const nt = box({ name: 'Note', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'start', radius: 8, fill: 'color/status/info-subtle', parent: side, wSize: 'fill' });
    iconSlot(nt, 'info', 'color/status/info', 16, 'Icon');
    txt('The monitor pauses while you upload and reconnects automatically afterwards.', { style: 'Caption/Default', color: 'color/text/secondary', parent: nt, name: 'Note', grow: true });
  } else {
    const ts = card(side, 'Troubleshooting', { gap: 10, pad: 16 });
    txt('Not seeing your board?', { style: 'Heading/H3', parent: ts, name: 'Title' });
    for (const tip of ['Use a USB-C data cable — some cables only charge.', 'Close Arduino IDE or other apps that may hold the port.', 'Switch RoboCore V2 ON (slide switch on the right edge).', 'Still stuck? Hold BOOT and tap RESET, then reconnect.']) {
      const r = box({ name: 'Tip', dir: 'H', gap: 8, cross: 'start', parent: ts, wSize: 'fill' });
      iconSlot(r, 'check', 'color/icon/active', 16, 'Icon');
      txt(tip, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Tip text', grow: true });
    }
  }
  return s.f;
}

// ---------------------------------------------------------------- Settings
function settingsScreen(page, x, y) {
  const s = browseScreen(page, 'Settings', x, y, 'Settings', { detail: 'Preferences saved on this device' });
  const m = s.main;
  pageHeader(m, 'Settings', 'Preferences are saved automatically on this device.');
  const cols = box({ name: 'Columns', dir: 'H', gap: 32, parent: m, wSize: 'fill', grow: true });
  const nav = box({ name: 'Settings nav', dir: 'V', gap: 2, w: 200, parent: cols });
  [['Appearance', 'palette', true], ['Editor', 'code', false], ['Blocks', 'blocks', false], ['Boards & ports', 'cpu', false], ['Keyboard shortcuts', 'keyboard', false], ['About', 'info', false]].forEach(([l, ic, on]) => {
    const n = inst('Nav Item', { State: on ? 'Active' : 'Default', Collapsed: 'False' }, nav, { name: 'Settings/' + l });
    setProp(n, 'Label', l); setProp(n, 'Icon', ICON[ic].id); n.layoutSizingHorizontal = 'FILL';
  });
  const c1 = box({ name: 'Column A', dir: 'V', gap: 24, parent: cols, grow: true });
  const c2 = box({ name: 'Column B', dir: 'V', gap: 24, parent: cols, grow: true });
  // appearance
  const ap = card(c1, 'Appearance', { gap: 4 });
  txt('Appearance', { style: 'Heading/H2', parent: ap, name: 'Title' });
  txt('Theme', { style: 'Label/Default', color: 'color/text/secondary', parent: box({ name: 'Label wrap', dir: 'H', pad: [12, 0, 8, 0], parent: ap }), name: 'Theme label' });
  const th = box({ name: 'Themes', dir: 'H', gap: 12, parent: ap, wSize: 'fill' });
  for (const [n, sel, note, dark] of [['Dark', true, 'Default', true], ['Light', false, 'Planned', false], ['System', false, 'Auto', true]]) {
    const t = box({ name: 'Theme ' + n, dir: 'V', gap: 8, pad: 8, radius: 10, fill: sel ? 'color/bg/selected' : 'color/bg/input', stroke: sel ? 'color/border/focus' : 'color/border/default', parent: th, grow: true });
    t.layoutSizingHorizontal = 'FILL';
    const pv = box({ name: 'Preview', dir: 'H', gap: 4, pad: 6, h: 64, radius: 6, fill: dark ? 'color/bg/app' : '#EEF1F5', parent: t, wSize: 'fill' });
    box({ name: 'Side', w: 14, hSize: 'fill', radius: 3, fill: dark ? 'color/bg/chrome' : '#FFFFFF', parent: pv });
    const pc = box({ name: 'Panel', dir: 'V', gap: 4, pad: 6, radius: 3, fill: dark ? 'color/bg/panel' : '#FFFFFF', parent: pv, grow: true, hSize: 'fill' });
    rect({ name: 'Line', w: 40, h: 5, radius: 2, fill: 'color/accent/default', parent: pc }); rect({ name: 'Line', w: 28, h: 5, radius: 2, fill: dark ? 'color/border/strong' : '#C9D1DC', parent: pc }); rect({ name: 'Line', w: 34, h: 5, radius: 2, fill: 'color/brand/default', parent: pc });
    if (!dark || n === 'Light') pv.opacity = 0.6;
    const lr = box({ name: 'Label row', dir: 'H', gap: 6, cross: 'center', parent: t, wSize: 'fill' });
    inst('Radio', { Selected: sel ? 'True' : 'False' }, lr, { name: 'Radio' });
    txt(n, { style: 'Label/Strong', parent: lr, name: 'Name', grow: true });
    txt(note, { style: 'Caption/Default', color: 'color/text/tertiary', parent: lr, name: 'Note' });
  }
  settingRow(ap, 'Interface scale', 'Make text and controls larger.', (r) => selectInst(r, '100%', 120));
  settingRow(ap, 'Reduce motion', 'Turn off panel and block animations.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ap, 'Strong focus rings', 'Thicker teal outline for keyboard focus.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  // general
  const gn = card(c1, 'General', { gap: 4 });
  txt('General', { style: 'Heading/H2', parent: gn, name: 'Title' });
  settingRow(gn, 'Language', null, (r) => selectInst(r, 'English (UK)', 150));
  settingRow(gn, 'Auto-save projects', 'Every 30 seconds and before upload.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(gn, 'Share anonymous usage data', 'Off by default. Never includes your code.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  // editor
  const ed = card(c2, 'Editor', { gap: 4 });
  txt('Editor', { style: 'Heading/H2', parent: ed, name: 'Title' });
  settingRow(ed, 'Font size', 'Code editor and serial monitor.', (r) => selectInst(r, '13 px', 110));
  settingRow(ed, 'Tab size', null, (r) => selectInst(r, '2 spaces', 110));
  settingRow(ed, 'Autocomplete', 'Suggest Arduino functions and constants as you type.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Bracket matching', 'Highlight the matching ( ) { } [ ].', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Word wrap', null, (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Format on save', 'Uses clang-format with the Arduino style.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  const bl = card(c2, 'Blocks', { gap: 4 });
  txt('Blocks', { style: 'Heading/H2', parent: bl, name: 'Title' });
  settingRow(bl, 'Show generated code', 'Open the read-only C++ preview beside the workspace.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(bl, 'Block size', null, (r) => selectInst(r, 'Comfortable', 140));
  return s.f;
}

function buildScreensPage(page) {
  const GX = 1600, GY = 1200;
  const F = {};
  const defs = [
    ['home', () => homeScreen(page, 0, 0)],
    ['projects', () => projectsScreen(page, GX, 0)],
    ['projectsEmpty', () => projectsScreen(page, 2 * GX, 0, { empty: true })],
    ['examples', () => examplesScreen(page, 0, GY)],
    ['libraries', () => librariesScreen(page, GX, GY)],
    ['boardSetup', () => boardSetupScreen(page, 2 * GX, GY)],
    ['serial', () => serialScreen(page, 0, 2 * GY)],
    ['serialEmpty', () => serialScreen(page, GX, 2 * GY, { connected: false })],
    ['settings', () => settingsScreen(page, 2 * GX, 2 * GY)],
    ['homeNew', () => homeScreen(page, 0, 3 * GY, { dialog: true, name: 'Home — New project dialog' })],
  ];
  for (const [k, fn] of defs) {
    try { F[k] = fn(); } catch (e) { REPORT.errors.push('screen ' + k + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  }
  return F;
}
