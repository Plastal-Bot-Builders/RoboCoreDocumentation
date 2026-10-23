// ============================================================================
// Additional screens — 1440 × 1000, box palette. Each builder takes the state it
// should show, so the prototype can draw every state from the same code.
// ============================================================================

const PROFILE = { name: 'Fredrick', full: 'Fredrick Mwepu', school: 'CBU Robotics Club', initials: 'FM' };
function browseScreen(page, name, x, y, nav, o = {}) {
  const f = screenFrame(page, name, x, y);
  const s = shell(f, { context: 'Browse', nav, pad: [28, 32, 28, 32], gap: 24 });
  // long pages (Settings) scroll inside the main area in the prototype; top bar and sidebar stay put
  s.main.overflowDirection = 'VERTICAL'; s.main.clipsContent = true;
  const connected = o.connected !== false;
  nestedProps(s.top, 'Board selector', { Status: connected ? 'Connected' : 'Disconnected', State: 'Default' });
  setStatus(s.status, { status: 'Ready', dot: connected ? null : 'ring', detail: o.detail || '', board: connected ? 'RoboCore V2 · ESP32-S3 USB (303A:1001) · 115200 baud' : 'RoboCore V2 · no board on USB-C', cursor: '' });
  return Object.assign({ f }, s);
}
function finishScreen(f) { stackForOverflow(f); return f; }
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
  if (link) txt(link, { style: 'Label/Strong', parent: h, name: 'Link' });
  return h;
}
function chip(parent, label, active) {
  const c = box({ name: 'Chip ' + label, dir: 'H', pad: [0, 12, 0, 12], h: 30, cross: 'center', radius: 999, fill: active ? 'color/ink/default' : undefined, stroke: active ? undefined : 'color/border/default', parent });
  txt(label, { style: 'Label/Default', color: active ? 'color/text/on-ink' : 'color/text/primary', parent: c, name: 'Label' });
  return c;
}
function card(parent, name, o = {}) {
  return box({ name, dir: 'V', gap: o.gap === undefined ? 12 : o.gap, pad: o.pad === undefined ? 20 : o.pad, parent, fill: 'color/bg/panel', radius: 10, stroke: 'color/border/default', wSize: o.wSize || 'fill', grow: o.grow, w: o.w, hSize: o.hSize });
}
function selectInst(parent, value, w, state) {
  const s = inst('Select', { State: state || 'Default' }, parent, { name: 'Select' });
  setProp(s, 'Value', value);
  if (w) s.resize(w, 32);
  return s;
}
function projectCard(parent, o) {
  return inst('Project Card', { Mode: o.mode || 'Blocks', State: 'Default' }, parent, { name: 'Project ' + o.name, text: { Name: o.name, Meta: o.board + ' · ' + o.edited } });
}
const PROJECTS = [
  { name: 'Blink LED', mode: 'Blocks', edited: 'Edited 2 min ago', board: 'RoboCore V2' },
  { name: 'Obstacle avoider', mode: 'Code', edited: 'Edited 2h ago', board: 'RoboCore V2' },
  { name: 'Traffic light', mode: 'Blocks', edited: 'Edited yesterday', board: 'Arduino Uno R3' },
  { name: 'Line follower', mode: 'Blocks', edited: 'Edited 3 days ago', board: 'RoboCore V2' },
  { name: 'Buzzer melody', mode: 'Code', edited: 'Edited last week', board: 'Arduino Uno R3' },
  { name: 'Servo sweep', mode: 'Code', edited: 'Edited 2 weeks ago', board: 'ESP32 DevKit V1' },
  { name: 'Distance monitor', mode: 'Blocks', edited: 'Edited 3 weeks ago', board: 'RoboCore V2' },
  { name: 'Sensor logger', mode: 'Code', edited: 'Edited last month', board: 'NodeMCU-32S' },
];
const EXAMPLES = [
  { title: 'Blink an LED', desc: 'Switch the built-in LED on and off.', level: 'Beginner', icon: 'lightbulb', cat: 'Basics', blocks: true },
  { title: 'Button-controlled LED', desc: 'Light the LED while USER is pressed.', level: 'Beginner', icon: 'log-in', cat: 'Basics', blocks: true },
  { title: 'Traffic light', desc: 'Sequence three LEDs with timing.', level: 'Beginner', icon: 'clock', cat: 'Sound & light', blocks: true },
  { title: 'Ultrasonic distance', desc: 'Measure distance and print it.', level: 'Intermediate', icon: 'radio', cat: 'Sensors', blocks: true },
  { title: 'Buzzer tones', desc: 'Play notes with tone() and noTone().', level: 'Beginner', icon: 'activity', cat: 'Sound & light', blocks: true },
  { title: 'Motor control', desc: 'Drive, reverse and turn.', level: 'Intermediate', icon: 'bot', meta: 'Blocks + Code · RoboCore V2', cat: 'Robotics', blocks: true },
  { title: 'Sensors to serial', desc: 'Print temperature and IMU readings.', level: 'Beginner', icon: 'message', meta: 'Code · RoboCore V2', cat: 'Communication', blocks: false },
  { title: 'Obstacle avoider', desc: 'Steer around walls with sonar.', level: 'Advanced', icon: 'zap', meta: 'Blocks + Code · RoboCore V2', cat: 'Robotics', blocks: true },
];
const EX_CATS = ['All', 'Basics', 'Sensors', 'Robotics', 'Sound & light', 'Communication'];

// ---------------------------------------------------------------- Welcome (first start)
function welcomeScreen(page, x, y, o = {}) {
  const f = screenFrame(page, o.name || 'Welcome', x, y);
  f.primaryAxisAlignItems = 'CENTER'; f.counterAxisAlignItems = 'CENTER';
  f.fills = [paint('color/bg/brand')];
  contours(f, SW, SH, 'color/decor/contour');
  const c = box({ name: 'Welcome card', dir: 'V', gap: 14, pad: 36, w: 480, fill: 'color/bg/raised', radius: 16, stroke: 'color/border/ink', effect: 'Elevation/Modal', parent: f });
  // one logo on the card: the app icon (the top bar shows the full lockup after sign-in)
  const ic = CMP['Logo/App Icon'].createInstance(); c.appendChild(ic); ic.name = 'Logo';
  txt('Welcome to RoboCore', { style: 'Heading/H1', parent: c, name: 'Title' });
  txt('Build, code and upload sketches to your robot. First, who is using RoboCore on this computer?', { style: 'Body/Default', color: 'color/text/secondary', parent: c, name: 'Intro', fill: true });
  const n = field(c, 'Your name', o.typed ? PROFILE.name : 'Thandi Mokoena', { state: o.typed ? 'Focus' : 'Default' });
  const sc = field(c, 'School or class (optional)', o.typed ? PROFILE.school : 'Grade 7B');
  if (!o.typed) for (const fld of [n, sc]) { const v = fld.findOne(x => x.name === 'Value'); if (v) refill(v, 'color/text/tertiary'); }
  const b = inst('Button', { Variant: 'Primary', State: o.typed ? 'Default' : 'Disabled' }, c, { name: 'Get started' }); setProp(b, 'Label', 'Get started'); setProp(b, 'Icon', ICON['arrow-right'].id); b.layoutSizingHorizontal = 'FILL';
  txt('Saved only on this device, with your projects. You can change it any time in Settings.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Privacy', fill: true });
  return finishScreen(f);
}

// ---------------------------------------------------------------- Home
function homeScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.name || 'Home', x, y, 'Home', { detail: '8 projects · saved on this device' });
  const m = s.main;
  const hero = box({ name: 'Hero', dir: 'H', pad: [32, 40, 32, 40], h: 264, cross: 'center', radius: 12, fill: 'color/bg/brand', clip: true, parent: m, wSize: 'fill' });
  contours(hero, 1168, 264, 'color/decor/contour');
  const hc = box({ name: 'Hero text', dir: 'V', gap: 10, parent: hero, grow: true });
  txt('RoboCore V2 · Classroom robot', { style: 'Caption/Overline', parent: hc, name: 'Overline' });
  txt('Welcome back, ' + PROFILE.name, { style: 'Heading/Display', parent: hc, name: 'Greeting' });
  txt('Build. Code. Create.', { style: 'Body/Default', parent: hc, name: 'Tagline' });
  const ac = box({ name: 'Actions', dir: 'H', gap: 8, pad: [10, 0, 0, 0], parent: hc });
  const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'New project' }); setProp(b1, 'Label', 'New project');
  const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Open Blink LED' }); setProp(b2, 'Label', 'Open Blink LED'); setProp(b2, 'Show icon', false);
  const art = artRect(hero, 'robot', 340, 'Robot line art');
  art.layoutPositioning = 'ABSOLUTE'; art.x = 1168 - 400; art.y = 6;
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill' });
  const left = box({ name: 'Recent', dir: 'V', gap: 12, parent: cols, grow: true });
  sectionHeader(left, 'Recent projects', 'All projects →');
  const row = box({ name: 'Recent cards', dir: 'H', gap: 16, parent: left, wSize: 'fill' });
  PROJECTS.slice(0, 3).forEach(p => projectCard(row, p));
  const right = box({ name: 'Your board', dir: 'V', gap: 12, w: 280, parent: cols });
  sectionHeader(right, 'Your board', null);
  inst('Board Info Card', { Status: 'Connected' }, right, { name: 'Board info' });
  const tp = box({ name: 'Templates', dir: 'V', gap: 12, parent: m, wSize: 'fill' });
  sectionHeader(tp, 'Start from a template', 'All examples →');
  const tr = box({ name: 'Template tiles', dir: 'H', gap: 16, parent: tp, wSize: 'fill' });
  for (const [t, d, ic] of [['Traffic light', 'Three LEDs and a button', 'clock'], ['Line follower', 'Follow a line with IR sensors', 'bot'], ['Obstacle avoider', 'Sonar + motors', 'radio'], ['Buzzer melody', 'Play a tune with tone()', 'activity']]) { const i = tileInst(tr, { title: t, desc: d, icon: ic }); i.layoutGrow = 1; }
  if (o.dialog) overlayInto(s.f, 'newProject');
  return finishScreen(s.f);
}

// ---------------------------------------------------------------- Projects
function projectsScreen(page, x, y, o = {}) {
  const filter = o.filter || 'All';
  const list = PROJECTS.filter(p => filter === 'All' || p.mode === filter);
  const s = browseScreen(page, o.name || (o.empty ? 'Projects — Empty' : 'Projects'), x, y, 'Projects', { detail: o.empty ? 'No projects yet' : list.length + ' of 8 projects · saved on this device' });
  const m = s.main;
  pageHeader(m, 'Projects', o.empty ? null : 'Saved on this device. Each computer or browser has its own projects.', (h) => {
    if (!o.empty) { const f = inst('Search Field', null, h, { name: 'Filter' }); setProp(f, 'Placeholder', 'Filter projects'); }
    const b = inst('Button', { Variant: 'Primary', State: 'Default' }, h, { name: 'New project' }); setProp(b, 'Label', 'New project');
  });
  if (o.empty) {
    const es = box({ name: 'Empty state', dir: 'V', gap: 14, pad: [48, 0, 0, 0], cross: 'center', parent: m, wSize: 'fill', grow: true });
    artRect(es, 'robot', 300, 'Robot line art');
    txt('No projects yet', { style: 'Heading/H1', parent: es, name: 'Title' });
    txt('Start with a template or an empty project.', { style: 'Body/Default', color: 'color/text/secondary', parent: es, name: 'Body' });
    const ac = box({ name: 'Actions', dir: 'H', gap: 8, parent: es });
    const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'New project' }); setProp(b1, 'Label', 'New project');
    const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Browse examples' }); setProp(b2, 'Label', 'Browse examples'); setProp(b2, 'Show icon', false);
    return finishScreen(s.f);
  }
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  for (const c of ['All', 'Blocks', 'Code']) chip(fr, c, c === filter);
  const grid = box({ name: 'Project grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  list.forEach(p => projectCard(grid, p));
  return finishScreen(s.f);
}

// ---------------------------------------------------------------- Examples
function examplesScreen(page, x, y, o = {}) {
  const cat = o.cat || 'All';
  const list = EXAMPLES.filter(e => cat === 'All' || e.cat === cat);
  const s = browseScreen(page, o.name || 'Examples', x, y, 'Examples', { detail: cat === 'All' ? '24 examples' : list.length + ' examples · ' + cat });
  const m = s.main;
  pageHeader(m, 'Examples', 'Opening an example makes a copy you can change.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search examples'); });
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  for (const c of EX_CATS) chip(fr, c, c === cat);
  const grid = box({ name: 'Example grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  list.forEach(e => exampleCard(grid, e));
  return finishScreen(s.f);
}

// ---------------------------------------------------------------- Libraries
const LIBS = [
  ['RoboCore', 'Pin names (RC_PIN_…), battery voltage, USER button, buzzer and RGB helpers.', '1.0.0', 'Included'],
  ['RoboCore Motors', 'Drive the two motor ports with encoder feedback.', '1.0.0', 'Included'],
  ['RoboCore Sensors', 'Ultrasonic, line sensor and IMU helpers.', '1.0.0', 'Included'],
  ['Wire', 'I²C for the Qwiic port and expansion headers.', 'core', 'Included'],
  ['ESP32Servo', 'Control hobby servos with PWM.', '3.2.1', 'Installed'],
  ['Adafruit NeoPixel', 'The RoboCore V2 RGB LED.', '1.12.3', 'Installed'],
  ['NewPing', 'Fast ultrasonic distance readings.', '1.9.7', 'Install'],
  ['LiquidCrystal I2C', '16×2 and 20×4 character LCDs.', '1.1.2', 'Install'],
];
function librariesScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.name || 'Libraries', x, y, 'Libraries', { detail: '4 included · 2 installed' });
  const m = s.main;
  pageHeader(m, 'Libraries', 'Code your sketches can #include. Installed libraries are compiled on the compile server.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search libraries'); });
  const tb = card(m, 'Library list', { pad: 0, gap: 0 });
  LIBS.forEach(([n, d, v, st], i) => {
    const r = box({ name: 'Row ' + n, dir: 'H', gap: 16, pad: [12, 20, 12, 20], cross: 'center', parent: tb, wSize: 'fill', stroke: i ? 'color/border/subtle' : undefined, sides: i ? { t: 1 } : undefined });
    const c1 = box({ name: 'Name', dir: 'V', gap: 2, parent: r, grow: true });
    txt(n, { style: 'Label/Strong', parent: c1, name: 'Library' });
    txt(d, { style: 'Body/Small', color: 'color/text/secondary', parent: c1, name: 'Description', fill: true });
    txt(v, { style: 'Code/Small', color: 'color/text/tertiary', parent: r, name: 'Version', w: 80 });
    const ac = box({ name: 'Action', dir: 'H', w: 130, align: 'end', parent: r });
    if (st === 'Included') { const b = inst('Badge', { Tone: 'Brand' }, ac, { name: 'Status' }); setText(b, 'Label', 'Included'); }
    else inst('Library Action', { State: st }, ac, { name: 'Install ' + n });
  });
  return finishScreen(s.f);
}

// ---------------------------------------------------------------- Board Setup
const BOARD_SPECS = {
  'RoboCore V2': [['MCU', 'ESP32-S3, dual-core 240 MHz'], ['Memory', '8 MB flash · 2 MB PSRAM'], ['USB', 'USB-C, native serial (no driver)'], ['Wireless', 'Wi-Fi · Bluetooth LE'], ['Motors', '2 DC with encoders'], ['Servos', '4 ports'], ['Sensors', 'Sonar and line ports · IMU']],
  'Arduino Uno R3': [['MCU', 'ATmega328P, 16 MHz'], ['Memory', '32 KB flash · 2 KB RAM'], ['USB', 'USB-B (ATmega16U2)'], ['Wireless', 'None'], ['Upload', 'Compiles; browser upload comes later']],
  'ESP32 DevKit V1': [['MCU', 'ESP32, dual-core 240 MHz'], ['Memory', '4 MB flash'], ['USB', 'Micro-USB (CP2102 or CH340)'], ['Wireless', 'Wi-Fi · Bluetooth']],
  'NodeMCU-32S': [['MCU', 'ESP32, dual-core 240 MHz'], ['Memory', '4 MB flash'], ['USB', 'Micro-USB (CH340)'], ['Wireless', 'Wi-Fi · Bluetooth']],
};
function boardSetupScreen(page, x, y, o = {}) {
  const prof = o.profile || 'RoboCore V2';
  const connected = o.connected !== false;
  const s = browseScreen(page, o.name || 'Board Setup', x, y, 'Board Setup', { detail: 'esp32 core 3.3.12 · arduino-cli 1.5.1', connected });
  const m = s.main;
  pageHeader(m, 'Board Setup', 'Choose a board, connect it over USB-C and set build options.');
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill', grow: true });
  const lc = card(cols, 'Boards', { w: 280, wSize: 'fixed', pad: 8, gap: 2, hSize: 'fill' });
  BOARDS.forEach(([n, d]) => {
    const on = n === prof;
    const r = box({ name: 'Profile ' + n, dir: 'H', gap: 10, pad: [10, 10, 10, 10], cross: 'center', radius: 6, fill: on ? 'color/bg/selected' : undefined, parent: lc, wSize: 'fill' });
    iconSlot(r, 'cpu', 'color/icon/strong', 18, 'Icon');
    const c = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true }); c.layoutSizingHorizontal = 'FILL';
    txt(n, { style: 'Label/Strong', parent: c, name: 'Name' });
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Specs', fill: true });
    if (on) iconSlot(r, 'check', 'color/icon/strong', 16, 'Check');
  });
  const rc = box({ name: 'Detail column', dir: 'V', gap: 24, parent: cols, grow: true, hSize: 'fill' });
  const dc = card(rc, 'Board detail', { gap: 16, pad: 24 });
  const dh = box({ name: 'Detail header', dir: 'H', gap: 10, cross: 'center', parent: dc, wSize: 'fill' });
  txt(prof, { style: 'Heading/H1', parent: dh, name: 'Board' });
  if (prof === 'RoboCore V2') { const b1 = inst('Badge', { Tone: 'Brand' }, dh, { name: 'Prototype' }); setText(b1, 'Label', 'Prototype · rev 2.0'); }
  spacer(dh, 1, true);
  inst('Connection Status', { Status: connected && prof === 'RoboCore V2' ? 'Connected' : 'Disconnected' }, dh, { name: 'Connection' });
  const db = box({ name: 'Detail body', dir: 'H', gap: 32, cross: 'center', parent: dc, wSize: 'fill' });
  if (prof === 'RoboCore V2') artRect(db, 'board', 380, 'Board line art');
  else { const t = box({ name: 'Board icon', dir: 'H', w: 120, h: 120, align: 'center', cross: 'center', radius: 16, stroke: 'color/border/ink', parent: db }); iconSlot(t, 'cpu', 'color/icon/strong', 56, 'Icon'); }
  const specs = box({ name: 'Specs', dir: 'V', gap: 8, parent: db, grow: true });
  for (const [k, v] of BOARD_SPECS[prof]) {
    const r = box({ name: 'Spec ' + k, dir: 'H', gap: 12, parent: specs, wSize: 'fill', pad: [0, 0, 8, 0], stroke: 'color/border/subtle', sides: { b: 1 } });
    txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 72 });
    txt(v, { style: 'Body/Small', parent: r, name: 'Value', grow: true });
  }
  const row = box({ name: 'Config row', dir: 'H', gap: 24, parent: rc, wSize: 'fill', grow: true });
  const cc = card(row, 'Connection', { grow: true, hSize: 'fill', gap: 14 });
  txt('Connection', { style: 'Heading/H2', parent: cc, name: 'Title' });
  labeledSel(cc, 'Port', 'Port');
  labeledSel(cc, 'Baud rate', 'Baud');
  const bt = box({ name: 'Buttons', dir: 'H', gap: 8, parent: cc });
  if (connected) {
    const t1 = inst('Button', { Variant: 'Secondary', State: 'Default' }, bt, { name: 'Test connection' }); setProp(t1, 'Label', 'Test connection'); setProp(t1, 'Show icon', false);
    const t3 = inst('Button', { Variant: 'Ghost', State: 'Default' }, bt, { name: 'Reset board' }); setProp(t3, 'Label', 'Reset board'); setProp(t3, 'Icon', ICON['refresh'].id);
    const t2 = inst('Button', { Variant: 'Ghost', State: 'Default' }, bt, { name: 'Disconnect' }); setProp(t2, 'Label', 'Disconnect'); setProp(t2, 'Show icon', false);
  } else {
    const t1 = inst('Button', { Variant: 'Primary', State: 'Default' }, bt, { name: 'Connect' }); setProp(t1, 'Label', 'Connect'); setProp(t1, 'Icon', ICON['plug'].id);
    txt('Chrome or Edge will ask which port to use. The ESP32-S3 shows as “USB JTAG/serial debug unit”.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: cc, name: 'Connect help', fill: true });
  }
  const bo = card(row, 'Build options', { grow: true, hSize: 'fill', gap: 14 });
  txt('Build options', { style: 'Heading/H2', parent: bo, name: 'Title' });
  if (prof === 'Arduino Uno R3') txt('No build options for this board.', { style: 'Body/Small', color: 'color/text/secondary', parent: bo, name: 'None' });
  else { labeledSel(bo, 'CPU frequency', 'CPU'); labeledSel(bo, 'Partition scheme', 'Partition'); }
  const tips = box({ name: 'Upload help', dir: 'H', gap: 8, cross: 'center', parent: bo });
  iconSlot(tips, 'info', 'color/icon/default', 16, 'Icon');
  txt('Upload stuck? Hold BOOT, tap RESET, release BOOT, then Upload again.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: tips, name: 'Text' });
  return finishScreen(s.f);
}

// ---------------------------------------------------------------- Serial Monitor
const SERIAL_STREAM = [
  ['', 'sys', 'Connected to ESP32-S3 USB (303A:1001) at 115200 baud'],
  ['14:12:01.204', 'rx', 'RoboCore V2 ready'],
  ['14:12:01.310', 'rx', 'distance_cm=48.2'],
  ['14:12:01.560', 'rx', 'distance_cm=45.1'],
  ['14:12:01.810', 'rx', 'distance_cm=39.6'],
  ['14:12:02.060', 'rx', 'distance_cm=27.4'],
  ['14:12:02.560', 'rx', 'distance_cm=16.2'],
  ['14:12:02.810', 'warn', 'distance_cm=12.6  obstacle — turning left'],
  ['14:12:03.060', 'rx', 'distance_cm=31.5'],
  ['14:12:03.310', 'rx', 'distance_cm=44.0'],
];
function serialScreen(page, x, y, o = {}) {
  const st = o.state || 'live';
  const s = browseScreen(page, o.name || 'Serial Monitor', x, y, 'Serial Monitor', { detail: st === 'cleared' ? 'Cleared' : '214 lines received' });
  const m = s.main;
  pageHeader(m, 'Serial Monitor', 'Read and send text over the board’s USB serial port.', (h) => { inst('Connection Status', { Status: 'Connected' }, h, { name: 'Connection' }); });
  const p = box({ name: 'Console panel', dir: 'V', parent: m, wSize: 'fill', grow: true, fill: 'color/bg/panel', radius: 10, stroke: 'color/border/default', clip: true });
  const tb = box({ name: 'Toolbar', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 52, cross: 'center', parent: p, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  sel(tb, 'Port', null, { nodeName: 'Port' });
  sel(tb, 'Baud', null, { nodeName: 'Baud' });
  spacer(tb, 1, true);
  for (const [l, on] of [['Timestamps', true], ['Autoscroll', true]]) { const t = box({ name: 'Toggle ' + l, dir: 'H', gap: 8, cross: 'center', parent: tb }); inst('Toggle', { On: on ? 'True' : 'False' }, t, { name: 'Toggle' }); txt(l, { style: 'Label/Default', parent: t, name: 'Label' }); }
  iconBtn(tb, 'trash', { name: 'Clear' });
  const lines = st === 'cleared' ? [] : (st === 'sent' ? SERIAL_STREAM.concat([['14:12:03.410', 'tx', 'status'], ['14:12:03.418', 'rx', 'ok · uptime 132 s · battery 3.92 V']]) : SERIAL_STREAM);
  const cv = consoleView(p, lines, { name: 'Console' });
  if (!lines.length) txt('Cleared. New lines appear here.', { style: 'Code/Small', color: 'color/text/disabled', parent: cv, name: 'Empty' });
  const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'center', parent: p, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  const fld = box({ name: 'Message field', dir: 'H', pad: [0, 12, 0, 12], h: 36, cross: 'center', radius: 6, fill: 'color/bg/input', stroke: st === 'typed' ? 'color/border/ink' : 'color/border/default', parent: ir, grow: true });
  if (st === 'typed') { txt('status', { style: 'Code/Small', parent: fld, name: 'Value' }); rect({ name: 'Caret', w: 1.5, h: 16, fill: 'color/ink/default', parent: fld }); spacer(fld, 1, true); }
  else txt('Type a message and press Enter', { style: 'Body/Small', color: 'color/text/tertiary', parent: fld, name: 'Placeholder', grow: true });
  sel(ir, 'Line ending', null, { nodeName: 'Line ending' });
  const sb = inst('Button', { Variant: st === 'typed' ? 'Primary' : 'Secondary', State: 'Default' }, ir, { name: 'Send' }); setProp(sb, 'Label', 'Send'); setProp(sb, 'Show icon', false); sb.resize(sb.width, 36);
  return finishScreen(s.f);
}

// ---------------------------------------------------------------- Settings
function settingsScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.name || 'Settings', x, y, 'Settings', { detail: 'Saved on this device' });
  const m = s.main;
  pageHeader(m, 'Settings', 'Saved automatically on this device.');
  const cols = box({ name: 'Columns', dir: 'H', gap: 20, parent: m, wSize: 'fill', cross: 'start' });
  const colA = box({ name: 'Column A', dir: 'V', gap: 20, parent: cols, grow: true });
  const colB = box({ name: 'Column B', dir: 'V', gap: 20, parent: cols, grow: true });
  const pr = card(colA, 'Profile', { gap: 12 });
  txt('Profile', { style: 'Heading/H2', parent: pr, name: 'Title' });
  const prow = box({ name: 'Fields', dir: 'H', gap: 12, parent: pr, wSize: 'fill' });
  field(prow, 'Your name', PROFILE.name); field(prow, 'School or class', PROFILE.school);
  const ps = box({ name: 'Profile actions', dir: 'H', gap: 10, cross: 'center', parent: pr, wSize: 'fill' });
  const sv = inst('Button', { Variant: 'Secondary', State: 'Default' }, ps, { name: 'Save profile' }); setProp(sv, 'Label', 'Save'); setProp(sv, 'Show icon', false);
  txt('Kept on this device only. Each computer or browser has its own profile and projects.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ps, name: 'Note', grow: true });
  const cg = card(colA, 'Cog', { gap: 12 });
  const ch = box({ name: 'Title row', dir: 'H', gap: 10, cross: 'center', parent: cg, wSize: 'fill' });
  cogMark(ch, 28);
  txt('Cog — learning partner', { style: 'Heading/H2', parent: ch, name: 'Title', grow: true });
  txt('How should Cog help?', { style: 'Label/Default', color: 'color/text/secondary', parent: cg, name: 'Question' });
  const hs = inst('Help Style', { Selected: 'Hints first' }, cg, { name: 'Help style' }); hs.layoutSizingHorizontal = 'FILL';
  txt('Teachers can lock this for a class.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: cg, name: 'Lock note' });
  const cr = box({ name: 'Settings', dir: 'V', gap: 0, parent: cg, wSize: 'fill' });
  settingRow(cr, 'Explanation level', null, (r) => sel(r, 'Level', null, { nodeName: 'Level' }));
  settingRow(cr, 'Let Cog read this project', 'Open files, Output and the Serial Monitor. Nothing is sent when this is off.', (r) => inst('Toggle', { On: 'True' }, r, { name: 'Toggle' }));
  const of = inst('Cog Offline', null, cg, { name: 'Offline note' }); of.layoutSizingHorizontal = 'FILL';
  const ap = card(colB, 'Appearance', { gap: 12 });
  txt('Appearance', { style: 'Heading/H2', parent: ap, name: 'Title' });
  const th = inst('Theme Choice', { Selected: o.theme || 'Paper' }, ap, { name: 'Theme' }); th.layoutSizingHorizontal = 'FILL';
  const ed = card(colB, 'Editor', { gap: 0 });
  txt('Editor', { style: 'Heading/H2', parent: box({ name: 'Title wrap', dir: 'H', pad: [0, 0, 8, 0], parent: ed }), name: 'Title' });
  settingRow(ed, 'Font size', null, (r) => sel(r, 'Font size', null, { nodeName: 'Font size' }));
  settingRow(ed, 'Autocomplete', 'Suggest Arduino functions as you type.', (r) => inst('Toggle', { On: 'True' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Word wrap', null, (r) => inst('Toggle', { On: 'False' }, r, { name: 'Toggle' }));
  const rb = card(colB, 'Real board and upload', { gap: 10 });
  txt('Real board and upload', { style: 'Heading/H2', parent: rb, name: 'Title' });
  txt('Verify and Upload use the compile server to build your C++ with arduino-cli and the esp32 core; the IDE then writes the program to the board over USB-C.', { style: 'Body/Small', color: 'color/text/secondary', parent: rb, name: 'Body', fill: true });
  field(rb, 'Compile server', 'https://robocore-compile.onrender.com');
  inst('Server Test', { State: 'Idle' }, rb, { name: 'Server test' });
  const gn = card(colB, 'General', { gap: 0 });
  txt('General', { style: 'Heading/H2', parent: box({ name: 'Title wrap', dir: 'H', pad: [0, 0, 8, 0], parent: gn }), name: 'Title' });
  settingRow(gn, 'Language', null, (r) => sel(r, 'Language', null, { nodeName: 'Language' }));
  settingRow(gn, 'Auto-save projects', 'Every 30 seconds and before upload.', (r) => inst('Toggle', { On: 'True' }, r, { name: 'Toggle' }));
  settingRow(gn, 'Reset all data', 'Deletes this device’s projects, profile and settings.', (r) => { const b = inst('Button', { Variant: 'Secondary', State: 'Default' }, r, { name: 'Reset all data' }); setProp(b, 'Label', 'Reset…'); setProp(b, 'Show icon', false); });
  return finishScreen(s.f);
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
    ['settings', () => settingsScreen(page, GX, 2 * GY)],
    ['homeNew', () => homeScreen(page, 2 * GX, 2 * GY, { dialog: true, name: 'Home — New project' })],
    ['welcome', () => welcomeScreen(page, 0, 3 * GY)],
    ['boardSetupOff', () => boardSetupScreen(page, GX, 3 * GY, { connected: false, name: 'Board Setup — Not connected' })],
  ];
  for (const [k, fn] of defs) {
    try { F[k] = fn(); } catch (e) { REPORT.errors.push('screen ' + k + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  }
  return F;
}
