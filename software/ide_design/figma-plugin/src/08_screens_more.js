// ============================================================================
// Additional screens (04 — Additional Screens) — 1440 × 1000, box palette
// ============================================================================

function browseScreen(page, name, x, y, nav, o = {}) {
  const f = screenFrame(page, name, x, y);
  const s = shell(f, { context: 'Browse', nav, pad: [28, 32, 28, 32], gap: 24 });
  const connected = o.connected !== false;
  nestedProps(s.top, 'Board selector', { Status: connected ? 'Connected' : 'Disconnected', State: 'Default' });
  setStatus(s.status, { status: 'Ready', dot: connected ? null : 'ring', detail: o.detail || '', board: connected ? 'RoboCore V2 · /dev/cu.usbmodem1101 · 115200 baud' : 'RoboCore V2 · no port', cursor: '' });
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
  return inst('Project Card', { Mode: o.mode || 'Blocks' }, parent, { name: 'Project ' + o.name, text: { Name: o.name, Meta: o.board + ' · ' + o.edited } });
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
  { title: 'Blink an LED', desc: 'Switch the built-in LED on and off.', level: 'Beginner', icon: 'lightbulb' },
  { title: 'Button-controlled LED', desc: 'Light the LED while USER is pressed.', level: 'Beginner', icon: 'log-in' },
  { title: 'Traffic light', desc: 'Sequence three LEDs with timing.', level: 'Beginner', icon: 'clock' },
  { title: 'Ultrasonic distance', desc: 'Measure distance and print it.', level: 'Intermediate', icon: 'radio' },
  { title: 'Buzzer tones', desc: 'Play notes with tone() and noTone().', level: 'Beginner', icon: 'activity' },
  { title: 'Motor control', desc: 'Drive, reverse and turn.', level: 'Intermediate', icon: 'bot', meta: 'Blocks + Code · RoboCore V2' },
  { title: 'Sensors to serial', desc: 'Print temperature and IMU readings.', level: 'Beginner', icon: 'message', meta: 'Blocks + Code · RoboCore V2' },
  { title: 'Obstacle avoider', desc: 'Steer around walls with sonar.', level: 'Advanced', icon: 'zap', meta: 'Blocks + Code · RoboCore V2' },
];

// ---------------------------------------------------------------- Home
function homeScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.name || 'Home', x, y, 'Home', { detail: '8 projects · saved in this browser' });
  const m = s.main;
  // hero in the box style: yellow field, contour lines, navy line art
  const hero = box({ name: 'Hero', dir: 'H', pad: [32, 40, 32, 40], h: 264, cross: 'center', radius: 12, fill: 'color/bg/brand', clip: true, parent: m, wSize: 'fill' });
  contours(hero, 1168, 264, 'color/decor/contour');
  const hc = box({ name: 'Hero text', dir: 'V', gap: 10, parent: hero, grow: true });
  txt('RoboCore V2 · Classroom robot', { style: 'Caption/Overline', parent: hc, name: 'Overline' });
  txt('Welcome back, Fredrick', { style: 'Heading/Display', parent: hc, name: 'Greeting' });
  txt('Build. Code. Create.', { style: 'Body/Default', parent: hc, name: 'Tagline' });
  const ac = box({ name: 'Actions', dir: 'H', gap: 8, pad: [10, 0, 0, 0], parent: hc });
  const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'New project' }); setProp(b1, 'Label', 'New project');
  const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Open Blink LED' }); setProp(b2, 'Label', 'Open Blink LED'); setProp(b2, 'Show icon', false);
  const art = artRect(hero, 'robot', 340, 'Robot line art');
  art.layoutPositioning = 'ABSOLUTE'; art.x = 1168 - 400; art.y = 6;
  // recent + board
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
  if (o.dialog) {
    rect({ name: 'Scrim', w: SW, h: SH, fill: 'color/bg/overlay', parent: s.f, abs: true, x: 0, y: 0 });
    const dlg = inst('Dialog/New Project', null, s.f, { name: 'Dialog', abs: true });
    dlg.x = Math.round((SW - dlg.width) / 2); dlg.y = Math.round((SH - dlg.height) / 2) - 20;
  }
  return s.f;
}

// ---------------------------------------------------------------- Projects
function projectsScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.empty ? 'Projects — Empty' : 'Projects', x, y, 'Projects', { detail: o.empty ? 'No projects yet' : '8 projects · saved in this browser' });
  const m = s.main;
  pageHeader(m, 'Projects', o.empty ? null : 'Saved in this browser until you sign in.', (h) => { if (!o.empty) { const f = inst('Search Field', null, h, { name: 'Filter' }); setProp(f, 'Placeholder', 'Filter projects'); } });
  if (o.empty) {
    const es = box({ name: 'Empty state', dir: 'V', gap: 14, pad: [48, 0, 0, 0], cross: 'center', parent: m, wSize: 'fill', grow: true });
    artRect(es, 'robot', 300, 'Robot line art');
    txt('No projects yet', { style: 'Heading/H1', parent: es, name: 'Title' });
    txt('Start with a template or an empty project.', { style: 'Body/Default', color: 'color/text/secondary', parent: es, name: 'Body' });
    const ac = box({ name: 'Actions', dir: 'H', gap: 8, parent: es });
    const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'New project' }); setProp(b1, 'Label', 'New project');
    const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Browse examples' }); setProp(b2, 'Label', 'Browse examples'); setProp(b2, 'Show icon', false);
    return s.f;
  }
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  chip(fr, 'All', true); chip(fr, 'Blocks', false); chip(fr, 'Code', false);
  const grid = box({ name: 'Project grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  PROJECTS.forEach(p => projectCard(grid, p));
  return s.f;
}

// ---------------------------------------------------------------- Examples
function examplesScreen(page, x, y) {
  const s = browseScreen(page, 'Examples', x, y, 'Examples', { detail: '24 examples' });
  const m = s.main;
  pageHeader(m, 'Examples', 'Opening an example makes a copy you can change.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search examples'); });
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  for (const [c, on] of [['All', true], ['Basics', false], ['Sensors', false], ['Robotics', false], ['Sound & light', false], ['Communication', false]]) chip(fr, c, on);
  const grid = box({ name: 'Example grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  EXAMPLES.forEach(e => exampleCard(grid, e));
  return s.f;
}

// ---------------------------------------------------------------- Libraries
function librariesScreen(page, x, y) {
  const s = browseScreen(page, 'Libraries', x, y, 'Libraries', { detail: '3 included · 2 installed' });
  const m = s.main;
  pageHeader(m, 'Libraries', 'Code your sketches can #include. RoboCore libraries come with the board package.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search libraries'); });
  const tb = card(m, 'Library list', { pad: 0, gap: 0 });
  const libs = [
    ['RoboCore Motors', 'Drive the two motor ports with encoder feedback.', '1.0.0', 'Included'],
    ['RoboCore Sensors', 'Ultrasonic, line sensor and IMU helpers.', '1.0.0', 'Included'],
    ['Wire', 'I²C for the Qwiic port and expansion headers.', 'core', 'Included'],
    ['ESP32Servo', 'Control hobby servos with PWM.', '3.0.5', 'Installed'],
    ['Adafruit NeoPixel', 'The RoboCore V2 RGB LED.', '1.12.3', 'Installed'],
    ['NewPing', 'Fast ultrasonic distance readings.', '1.9.7', 'Available'],
    ['LiquidCrystal I2C', '16×2 and 20×4 character LCDs.', '1.1.2', 'Available'],
  ];
  libs.forEach(([n, d, v, st], i) => {
    const r = box({ name: 'Row ' + n, dir: 'H', gap: 16, pad: [14, 20, 14, 20], cross: 'center', parent: tb, wSize: 'fill', stroke: i ? 'color/border/subtle' : undefined, sides: i ? { t: 1 } : undefined });
    const c1 = box({ name: 'Name', dir: 'V', gap: 2, parent: r, grow: true });
    txt(n, { style: 'Label/Strong', parent: c1, name: 'Library' });
    txt(d, { style: 'Body/Small', color: 'color/text/secondary', parent: c1, name: 'Description', fill: true });
    txt(v, { style: 'Code/Small', color: 'color/text/tertiary', parent: r, name: 'Version', w: 80 });
    const ac = box({ name: 'Action', dir: 'H', w: 110, align: 'end', parent: r });
    if (st === 'Available') { const bt = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Install' }); setProp(bt, 'Label', 'Install'); setProp(bt, 'Show icon', false); }
    else { const b = inst('Badge', { Tone: st === 'Included' ? 'Brand' : 'Neutral' }, ac, { name: 'Status' }); setText(b, 'Label', st); }
  });
  return s.f;
}

// ---------------------------------------------------------------- Board Setup
function boardSetupScreen(page, x, y) {
  const s = browseScreen(page, 'Board Setup', x, y, 'Board Setup', { detail: 'Board package 1.0 · esp32 core 3.0.7' });
  const m = s.main;
  pageHeader(m, 'Board Setup', 'Choose a board, connect it over USB and set build options.');
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill', grow: true });
  const lc = card(cols, 'Boards', { w: 280, wSize: 'fixed', pad: 8, gap: 2, hSize: 'fill' });
  BOARDS.forEach(([n, d], i) => {
    const sel = i === 0;
    const r = box({ name: 'Profile ' + n, dir: 'H', gap: 10, pad: [10, 10, 10, 10], cross: 'center', radius: 6, fill: sel ? 'color/bg/selected' : undefined, parent: lc, wSize: 'fill' });
    iconSlot(r, 'cpu', 'color/icon/strong', 18, 'Icon');
    const c = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true }); c.layoutSizingHorizontal = 'FILL';
    txt(n, { style: 'Label/Strong', parent: c, name: 'Name' });
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Specs', fill: true });
  });
  const rc = box({ name: 'Detail column', dir: 'V', gap: 24, parent: cols, grow: true, hSize: 'fill' });
  const dc = card(rc, 'Board detail', { gap: 16, pad: 24 });
  const dh = box({ name: 'Detail header', dir: 'H', gap: 10, cross: 'center', parent: dc, wSize: 'fill' });
  txt('RoboCore V2', { style: 'Heading/H1', parent: dh, name: 'Board' });
  const b1 = inst('Badge', { Tone: 'Brand' }, dh, { name: 'Prototype' }); setText(b1, 'Label', 'Prototype · rev 2.0');
  spacer(dh, 1, true);
  inst('Connection Status', { Status: 'Connected' }, dh, { name: 'Connection' });
  const db = box({ name: 'Detail body', dir: 'H', gap: 32, cross: 'center', parent: dc, wSize: 'fill' });
  artRect(db, 'board', 380, 'Board line art');
  const specs = box({ name: 'Specs', dir: 'V', gap: 8, parent: db, grow: true });
  for (const [k, v] of [['MCU', 'ESP32-S3, dual-core 240 MHz'], ['Memory', '8 MB flash · 2 MB PSRAM'], ['USB', 'USB-C, native serial'], ['Wireless', 'Wi-Fi · Bluetooth LE'], ['Motors', '2 DC with encoders'], ['Servos', '4 ports'], ['Sensors', 'Sonar and line ports · IMU']]) {
    const r = box({ name: 'Spec ' + k, dir: 'H', gap: 12, parent: specs, wSize: 'fill', pad: [0, 0, 8, 0], stroke: 'color/border/subtle', sides: { b: 1 } });
    txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 72 });
    txt(v, { style: 'Body/Small', parent: r, name: 'Value', grow: true });
  }
  const row = box({ name: 'Config row', dir: 'H', gap: 24, parent: rc, wSize: 'fill', grow: true });
  const cc = card(row, 'Connection', { grow: true, hSize: 'fill', gap: 14 });
  txt('Connection', { style: 'Heading/H2', parent: cc, name: 'Title' });
  labeledSelect(cc, 'Port', '/dev/cu.usbmodem1101');
  labeledSelect(cc, 'Baud rate', '115200');
  const bt = box({ name: 'Buttons', dir: 'H', gap: 8, parent: cc });
  const t1 = inst('Button', { Variant: 'Secondary', State: 'Default' }, bt, { name: 'Test connection' }); setProp(t1, 'Label', 'Test connection'); setProp(t1, 'Show icon', false);
  const t2 = inst('Button', { Variant: 'Ghost', State: 'Default' }, bt, { name: 'Disconnect' }); setProp(t2, 'Label', 'Disconnect'); setProp(t2, 'Show icon', false);
  const bo = card(row, 'Build options', { grow: true, hSize: 'fill', gap: 14 });
  txt('Build options', { style: 'Heading/H2', parent: bo, name: 'Title' });
  labeledSelect(bo, 'CPU frequency', '240 MHz');
  labeledSelect(bo, 'Partition scheme', '8 MB · 3 MB app / 1.5 MB SPIFFS');
  return s.f;
}

// ---------------------------------------------------------------- Serial Monitor
const SERIAL_STREAM = [
  ['', 'sys', 'Connected to /dev/cu.usbmodem1101 at 115200 baud'],
  ['14:12:01.204', 'rx', 'RoboCore V2 ready'],
  ['14:12:01.310', 'rx', 'distance_cm=48.2'],
  ['14:12:01.560', 'rx', 'distance_cm=45.1'],
  ['14:12:01.810', 'rx', 'distance_cm=39.6'],
  ['14:12:02.060', 'rx', 'distance_cm=27.4'],
  ['14:12:02.310', 'tx', 'status'],
  ['14:12:02.318', 'rx', 'ok · uptime 132 s · battery 3.92 V'],
  ['14:12:02.560', 'rx', 'distance_cm=16.2'],
  ['14:12:02.810', 'warn', 'distance_cm=12.6  obstacle — turning left'],
  ['14:12:03.060', 'rx', 'distance_cm=31.5'],
  ['14:12:03.310', 'rx', 'distance_cm=44.0'],
  ['14:12:03.560', 'rx', 'distance_cm=46.8'],
];
function serialScreen(page, x, y) {
  const s = browseScreen(page, 'Serial Monitor', x, y, 'Serial Monitor', { detail: '214 lines received' });
  const m = s.main;
  pageHeader(m, 'Serial Monitor', 'Read and send text over the board’s USB serial port.', (h) => { inst('Connection Status', { Status: 'Connected' }, h, { name: 'Connection' }); });
  const p = box({ name: 'Console panel', dir: 'V', parent: m, wSize: 'fill', grow: true, fill: 'color/bg/panel', radius: 10, stroke: 'color/border/default', clip: true });
  const tb = box({ name: 'Toolbar', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 52, cross: 'center', parent: p, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  selectInst(tb, '/dev/cu.usbmodem1101', 240);
  selectInst(tb, '115200 baud', 128);
  spacer(tb, 1, true);
  for (const [l, on] of [['Timestamps', true], ['Autoscroll', true]]) { const t = box({ name: 'Toggle ' + l, dir: 'H', gap: 8, cross: 'center', parent: tb }); inst('Toggle', { On: on ? 'True' : 'False' }, t, { name: 'Toggle' }); txt(l, { style: 'Label/Default', parent: t, name: 'Label' }); }
  iconBtn(tb, 'trash', { name: 'Clear' });
  consoleView(p, SERIAL_STREAM, { name: 'Console' });
  const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'center', parent: p, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  const fld = box({ name: 'Message field', dir: 'H', pad: [0, 12, 0, 12], h: 36, cross: 'center', radius: 6, fill: 'color/bg/input', stroke: 'color/border/default', parent: ir, grow: true });
  txt('Type a message and press Enter', { style: 'Body/Small', color: 'color/text/tertiary', parent: fld, name: 'Placeholder', grow: true });
  selectInst(ir, 'New line', 120).resize(120, 36);
  const sb = inst('Button', { Variant: 'Primary', State: 'Default' }, ir, { name: 'Send' }); setProp(sb, 'Label', 'Send'); setProp(sb, 'Show icon', false); sb.resize(sb.width, 36);
  return s.f;
}

// ---------------------------------------------------------------- Settings
function settingsScreen(page, x, y) {
  const s = browseScreen(page, 'Settings', x, y, 'Settings', { detail: 'Saved on this device' });
  const m = s.main;
  pageHeader(m, 'Settings', 'Saved automatically on this device.');
  const col = box({ name: 'Column', dir: 'V', gap: 20, w: 720, parent: m });
  const ap = card(col, 'Appearance', { gap: 12 });
  txt('Appearance', { style: 'Heading/H2', parent: ap, name: 'Title' });
  const th = box({ name: 'Themes', dir: 'H', gap: 12, parent: ap, wSize: 'fill' });
  for (const [n, sel, note] of [['Paper', true, 'The box colours'], ['Navy', false, 'Planned']]) {
    const t = box({ name: 'Theme ' + n, dir: 'H', gap: 10, pad: 12, cross: 'center', radius: 8, fill: sel ? 'color/bg/selected' : undefined, stroke: sel ? 'color/border/ink' : 'color/border/default', parent: th, grow: true });
    t.layoutSizingHorizontal = 'FILL';
    inst('Radio', { Selected: sel ? 'True' : 'False' }, t, { name: 'Radio' });
    const sw = box({ name: 'Swatch', dir: 'H', w: 36, h: 24, radius: 4, fill: sel ? 'color/bg/app' : 'color/ink/default', stroke: 'color/border/default', parent: t });
    rect({ name: 'Bar', w: 36, h: 6, fill: 'color/brand/default', parent: sw });
    const tc = box({ name: 'Text', dir: 'V', gap: 0, parent: t, grow: true });
    txt(n, { style: 'Label/Strong', parent: tc, name: 'Name' });
    txt(note, { style: 'Caption/Default', color: 'color/text/tertiary', parent: tc, name: 'Note' });
  }
  const ed = card(col, 'Editor', { gap: 0 });
  txt('Editor', { style: 'Heading/H2', parent: box({ name: 'Title wrap', dir: 'H', pad: [0, 0, 8, 0], parent: ed }), name: 'Title' });
  settingRow(ed, 'Font size', null, (r) => selectInst(r, '13 px', 110));
  settingRow(ed, 'Autocomplete', 'Suggest Arduino functions as you type.', (r) => inst('Toggle', { On: 'True' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Word wrap', null, (r) => inst('Toggle', { On: 'False' }, r, { name: 'Toggle' }));
  const gn = card(col, 'General', { gap: 0 });
  txt('General', { style: 'Heading/H2', parent: box({ name: 'Title wrap', dir: 'H', pad: [0, 0, 8, 0], parent: gn }), name: 'Title' });
  settingRow(gn, 'Language', null, (r) => selectInst(r, 'English', 130));
  settingRow(gn, 'Auto-save projects', 'Every 30 seconds and before upload.', (r) => inst('Toggle', { On: 'True' }, r, { name: 'Toggle' }));
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
    ['settings', () => settingsScreen(page, GX, 2 * GY)],
    ['homeNew', () => homeScreen(page, 2 * GX, 2 * GY, { dialog: true, name: 'Home — New project' })],
  ];
  for (const [k, fn] of defs) {
    try { F[k] = fn(); } catch (e) { REPORT.errors.push('screen ' + k + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  }
  return F;
}
