// ============================================================================
// Main IDE screens (03 — Main IDE) — 1440 × 1000, box palette, essentials only
// ============================================================================

const SW = 1440, SH = 1000;
const BLINK_INO = [
  '// Blink — RoboCore V2',
  '// Turns the built-in LED on and off every second.',
  '',
  'void setup() {',
  '  Serial.begin(115200);',
  '  Serial.println("RoboCore V2 ready");',
  '  pinMode(LED_BUILTIN, OUTPUT);',
  '}',
  '',
  'void loop() {',
  '  digitalWrite(LED_BUILTIN, HIGH);',
  '  delay(1000);',
  '  digitalWrite(LED_BUILTIN, LOW);',
  '  delay(1000);',
  '}',
].join('\n');
const SERIAL_BOOT = [
  ['', 'sys', 'Connected to /dev/cu.usbmodem1101 at 115200 baud'],
  ['14:02:10.881', 'rx', 'ESP-ROM:esp32s3-20210327'],
  ['14:02:10.884', 'rx', 'rst:0x1 (POWERON),boot:0x8 (SPI_FAST_FLASH_BOOT)'],
  ['14:02:11.204', 'rx', 'RoboCore V2 ready'],
];
const OUTPUT_VERIFY = [
  ['14:05:12', 'sys', 'Compiling sketch for RoboCore V2 (ESP32-S3)…'],
  ['14:05:18', 'rx', 'Sketch uses 289,617 bytes (9%) of program storage space. Maximum is 3,145,728 bytes.'],
  ['14:05:18', 'rx', 'Global variables use 20,436 bytes (6%) of dynamic memory.'],
  ['14:05:18', 'ok', 'Verified in 6.4 s — ready to upload'],
];
const OUTPUT_UPLOAD = [
  ['14:06:02', 'ok', 'Compiled in 6.1 s · 289,617 bytes (9%)'],
  ['14:06:03', 'rx', 'esptool.py v4.6 · Chip is ESP32-S3 (revision v0.2)'],
  ['14:06:05', 'rx', 'Writing at 0x00010000… (18 %)'],
  ['14:06:07', 'tx', 'Writing at 0x00050000… (64 %)'],
];
const OUTPUT_FAILED = [
  ['14:07:41', 'ok', 'Compiled in 5.9 s · 289,617 bytes (9%)'],
  ['14:07:42', 'rx', 'esptool.py v4.6 · Serial port /dev/cu.usbmodem1101'],
  ['14:07:42', 'rx', 'Connecting......................................'],
  ['14:07:52', 'err', 'Failed to connect to ESP32-S3: No serial data received.'],
  ['', 'warn', 'Hold BOOT, tap RESET, then Upload again.'],
];

function nested(root, name) { return root.findOne(n => n.type === 'INSTANCE' && n.name === name); }
function nestedProps(root, name, props) {
  const n = nested(root, name);
  if (!n) { warn('nested not found ' + name); return null; }
  try { n.setProperties(props); } catch (e) { warn('nestedProps ' + name + ': ' + e.message); }
  return n;
}
function relPos(node, frame) {
  const a = node.absoluteTransform, b = frame.absoluteTransform;
  return { x: a[0][2] - b[0][2], y: a[1][2] - b[1][2], w: node.width, h: node.height };
}
function screenFrame(page, name, x, y) {
  const f = box({ name, dir: 'V', w: SW, h: SH, fill: 'color/bg/app', clip: true });
  page.appendChild(f);
  f.x = x; f.y = y;
  return f;
}
function shell(f, o) {
  const top = inst('Top Bar', { Context: o.context || 'Editor' }, f, { name: 'Top bar' });
  top.layoutSizingHorizontal = 'FILL';
  const body = box({ name: 'Body', dir: 'H', parent: f, wSize: 'fill', grow: true });
  const sb = inst('Sidebar', { Collapsed: 'False' }, body, { name: 'Sidebar' });
  sb.layoutSizingVertical = 'FILL';
  if (o.nav) setNavActive(sb, o.nav);
  setProjectPill(sb, (o.context || 'Editor') === 'Editor' ? 'Active' : 'Default');
  const main = box({ name: 'Main', dir: 'V', gap: o.gap === undefined ? 12 : o.gap, pad: o.pad === undefined ? 12 : o.pad, parent: body, grow: true, hSize: 'fill' });
  const status = inst('Status Bar', null, f, { name: 'Status bar' });
  status.layoutSizingHorizontal = 'FILL';
  return { top, body, sb, main, status };
}
function panel(parent, name, o = {}) {
  return box(Object.assign({ name, dir: 'V', parent, fill: 'color/bg/panel', radius: 10, stroke: 'color/border/default', clip: true }, o));
}

function utilityPanel(parent, o) {
  const collapsed = !!o.collapsed;
  const p = panel(parent, 'Utility panel', { grow: true, hSize: 'fill' });
  const ph = box({ name: 'Panel header', dir: 'H', gap: 8, pad: [0, 8, 0, 16], h: 40, cross: 'center', parent: p, wSize: 'fill', stroke: collapsed ? undefined : 'color/border/subtle', sides: collapsed ? undefined : { b: 1 } });
  const tabs = box({ name: 'Tabs', dir: 'H', gap: 4, h: 40, cross: 'center', parent: ph });
  for (const [label, key] of [['Serial Monitor', 'serial'], ['Output', 'output'], ['Problems', 'problems']]) {
    const t = inst('Panel Tab', { State: o.tab === key && !collapsed ? 'Active' : 'Inactive' }, tabs, { name: 'Tab ' + label });
    setProp(t, 'Label', label);
    if (key === 'problems' && o.problems) { setProp(t, 'Show count', true); setProp(t, 'Count', String(o.problems)); }
  }
  spacer(ph, 1, true);
  if (collapsed) { iconBtn(ph, 'chevron-up', { name: 'Expand panel' }); return p; }
  if (o.tab === 'serial') { const b = inst('Select', { State: 'Default' }, ph, { name: 'Baud' }); setProp(b, 'Value', '115200 baud'); b.resize(128, 28); }
  iconBtn(ph, 'trash', { name: 'Clear output' });
  iconBtn(ph, 'chevron-down', { name: 'Collapse panel' });
  if (o.tab === 'serial' && o.connected === false) {
    const es = box({ name: 'Empty state', dir: 'V', gap: 10, pad: 16, align: 'center', cross: 'center', parent: p, wSize: 'fill', grow: true });
    txt('No board connected', { style: 'Heading/H2', parent: es, name: 'Title' });
    txt('Plug RoboCore V2 in with a USB-C data cable.', { style: 'Body/Small', color: 'color/text/secondary', parent: es, name: 'Body' });
    const c = inst('Button', { Variant: 'Primary', State: 'Default' }, es, { name: 'Connect board' }); setProp(c, 'Label', 'Connect board'); setProp(c, 'Icon', ICON['plug'].id);
    return p;
  }
  consoleView(p, o.lines || SERIAL_BOOT, { name: 'Console' });
  if (o.tab === 'serial') {
    const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [8, 8, 8, 12], cross: 'center', parent: p, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
    const fld = box({ name: 'Message field', dir: 'H', pad: [0, 12, 0, 12], h: 32, cross: 'center', radius: 6, fill: 'color/bg/input', stroke: 'color/border/default', parent: ir, grow: true });
    txt('Send a message to the board', { style: 'Body/Small', color: 'color/text/tertiary', parent: fld, name: 'Placeholder', grow: true });
    const s = inst('Button', { Variant: 'Secondary', State: 'Default' }, ir, { name: 'Send' }); setProp(s, 'Label', 'Send'); setProp(s, 'Show icon', false);
  }
  return p;
}

function blocksWorkspace(content, o) {
  const tb = box({ name: 'Toolbox', dir: 'V', gap: 2, pad: [12, 8, 12, 8], w: 160, parent: content, hSize: 'fill', stroke: 'color/border/subtle', sides: { r: 1 } });
  for (const [cat] of BLOCK_CATS) inst('Block Category', { Category: cat, State: cat === 'Output' ? 'Active' : 'Default' }, tb, { name: 'Category ' + cat });
  const fl = box({ name: 'Flyout', dir: 'V', gap: 14, pad: [14, 16, 16, 16], w: 280, parent: content, hSize: 'fill', fill: 'color/bg/app', stroke: 'color/border/subtle', sides: { r: 1 }, clip: true });
  txt('Output', { style: 'Heading/H2', parent: fl, name: 'Title' });
  for (const key of ['Output/Set built-in LED', 'Output/Set digital pin', 'Output/Play tone', 'Output/Set RGB LED']) blk(key, null, fl);
  const cv = box({ name: 'Canvas', parent: content, grow: true, hSize: 'fill', fill: 'color/bg/canvas', clip: true });
  const prog = buildBlinkProgram({});
  cv.appendChild(prog); prog.x = 48; prog.y = 40;
  return cv;
}
// once the layout is final: dotted grid + zoom controls pinned bottom-right
function finishCanvas(cv) {
  const cw = Math.round(cv.width), chh = Math.round(cv.height);
  const g = gridDots(cw, chh, 24); cv.insertChild(0, g); g.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  const z = box({ name: 'Zoom controls', dir: 'H', gap: 0, pad: 2, radius: 8, fill: 'color/bg/raised', stroke: 'color/border/default', parent: cv });
  iconBtn(z, 'zoom-out', { name: 'Zoom out' }); iconBtn(z, 'fit', { name: 'Reset zoom' }); iconBtn(z, 'zoom-in', { name: 'Zoom in' });
  z.x = cw - 16 - z.width; z.y = chh - 16 - z.height; z.constraints = { horizontal: 'MAX', vertical: 'MAX' };
}
function codeWorkspace(content, o) {
  const ed = codeView(content, BLINK_INO, { name: 'Editor', grow: true, hSize: 'fill', activeLine: o.activeLine || 11, cursor: o.cursor || { line: 11, col: 34 } });
  ed.layoutSizingVertical = 'FILL';
  return ed;
}

// o: { name, mode, collapsed, tab, lines, connected, uploading, overlay, toast, problems, status }
function ideScreen(page, x, y, o) {
  const f = screenFrame(page, o.name, x, y);
  const connected = o.connected !== false;
  const { top, main, status } = shell(f, { context: 'Editor' });
  nestedProps(top, 'Board selector', { Status: connected ? 'Connected' : 'Disconnected', State: o.overlay === 'boardMenu' ? 'Open' : 'Default' });
  if (o.uploading) {
    nestedProps(top, 'Verify', { State: 'Disabled' }); nestedProps(top, 'Upload', { State: 'Running' });
    const st = nested(top, 'Stop'); if (st) st.visible = true;
  }
  const ws = panel(main, 'Workspace', { wSize: 'fill', grow: true });
  const hdr = box({ name: 'Workspace header', dir: 'H', gap: 12, pad: [0, 8, 0, 8], h: 48, cross: 'center', parent: ws, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  inst('Mode Switch', { Active: o.mode === 'code' ? 'Code' : 'Blocks' }, hdr, { name: 'Mode switch' });
  if (o.mode === 'code') {
    const tabs = box({ name: 'File tabs', dir: 'H', gap: 0, h: 48, cross: 'end', parent: hdr });
    const t1 = inst('File Tab', { State: 'Active' }, tabs, { name: 'Tab Blink.ino' }); setProp(t1, 'Filename', 'Blink.ino'); setProp(t1, 'Modified', false);
    const t2 = inst('File Tab', { State: 'Inactive' }, tabs, { name: 'Tab config.h' }); setProp(t2, 'Filename', 'config.h'); setProp(t2, 'Modified', false);
    spacer(hdr, 1, true);
    iconBtn(hdr, 'search', { name: 'Find' });
  } else {
    spacer(hdr, 1, true);
    iconBtn(hdr, 'undo', { name: 'Undo' }); iconBtn(hdr, 'redo', { name: 'Redo' }); iconBtn(hdr, 'trash', { name: 'Clear workspace' });
  }
  const content = box({ name: 'Workspace content', dir: 'H', parent: ws, wSize: 'fill', grow: true });
  if (o.mode === 'code') codeWorkspace(content, o); else blocksWorkspace(content, o);
  const bottom = box({ name: 'Bottom row', dir: 'H', gap: 12, h: o.collapsed ? 40 : 232, parent: main, wSize: 'fill' });
  utilityPanel(bottom, { collapsed: o.collapsed, tab: o.tab || 'serial', lines: o.lines, connected, problems: o.problems });
  if (!o.collapsed) { const bi = inst('Board Info Card', { Status: connected ? 'Connected' : 'Disconnected' }, bottom, { name: 'Board info' }); bi.layoutSizingVertical = 'FILL'; }
  if (o.mode !== 'code') { const cv = f.findOne(n => n.name === 'Canvas'); if (cv) finishCanvas(cv); }
  const st = o.status || {};
  setStatus(status, {
    status: st.status || 'Ready', dot: st.dot || (connected ? null : 'ring'),
    detail: st.detail !== undefined ? st.detail : (o.mode === 'code' ? 'Blink.ino · saved 14:05' : '7 blocks · saved 14:02'),
    board: connected ? 'RoboCore V2 · /dev/cu.usbmodem1101 · 115200 baud' : 'RoboCore V2 · no port',
    cursor: o.mode === 'code' ? 'Ln 11, Col 35' : '',
  });
  if (o.overlay === 'boardMenu') {
    const sel = nested(top, 'Board selector');
    const p = sel ? relPos(sel, f) : { x: 820, y: 8, w: 300, h: 40 };
    const m = inst('Board Menu', null, f, { name: 'Board menu', abs: true });
    m.x = Math.round(p.x + p.w - 340); m.y = 56 + 6;
  } else if (o.overlay) {
    rect({ name: 'Scrim', w: SW, h: SH, fill: 'color/bg/overlay', parent: f, abs: true, x: 0, y: 0 });
    const d = inst({ projectSettings: 'Dialog/Project Settings', newProject: 'Dialog/New Project' }[o.overlay], null, f, { name: 'Dialog', abs: true });
    d.x = Math.round((SW - d.width) / 2); d.y = Math.round((SH - d.height) / 2) - 20;
  }
  if (o.toast) {
    const t = inst('Toast', { Type: o.toast }, f, { name: 'Toast', abs: true });
    t.x = SW - 360 - 24; t.y = SH - 28 - 24 - t.height - 232 - 12;
  }
  return f;
}

function buildIdePage(page) {
  const GX = 1600, GY = 1200;
  const F = {};
  const defs = [
    ['blocks', { name: 'IDE — Blocks', mode: 'blocks', tab: 'serial' }],
    ['code', { name: 'IDE — Code', mode: 'code', tab: 'output', lines: OUTPUT_VERIFY, status: { status: 'Verified', detail: '289,617 bytes (9%) · RAM 6%' } }],
    ['boardMenu', { name: 'IDE — Board selector', mode: 'blocks', tab: 'serial', overlay: 'boardMenu' }],
    ['blocksCollapsed', { name: 'IDE — Blocks · Console collapsed', mode: 'blocks', collapsed: true }],
    ['codeCollapsed', { name: 'IDE — Code · Console collapsed', mode: 'code', collapsed: true }],
    ['settings', { name: 'IDE — Project settings', mode: 'blocks', tab: 'serial', overlay: 'projectSettings' }],
    ['uploading', { name: 'IDE — Uploading', mode: 'code', tab: 'output', lines: OUTPUT_UPLOAD, uploading: true, status: { status: 'Uploading 64%', dot: 'brand', detail: 'Writing to flash' } }],
    ['failed', { name: 'IDE — Upload failed', mode: 'code', tab: 'output', lines: OUTPUT_FAILED, problems: 1, toast: 'Error', status: { status: 'Upload failed', detail: 'See Output' } }],
    ['disconnected', { name: 'IDE — No board connected', mode: 'blocks', tab: 'serial', connected: false }],
  ];
  defs.forEach(([key, o], i) => {
    try { F[key] = ideScreen(page, (i % 3) * GX, Math.floor(i / 3) * GY, o); }
    catch (e) { REPORT.errors.push('ide ' + key + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  });
  return F;
}
