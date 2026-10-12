// ============================================================================
// Main IDE screens (03 — Main IDE) — 1440 × 1000
// ============================================================================

const SW = 1440, SH = 1000;
const BLINK_INO = [
  '/*',
  '  Blink — RoboCore V2',
  '  Turns the built-in LED on for one second, then off for one second.',
  '*/',
  '',
  'void setup() {',
  '  // the built-in LED pin is an output',
  '  pinMode(LED_BUILTIN, OUTPUT);',
  '  Serial.begin(115200);',
  '  Serial.println("RoboCore V2 ready");',
  '}',
  '',
  'void loop() {',
  '  digitalWrite(LED_BUILTIN, HIGH);   // LED on',
  '  delay(1000);                       // wait one second',
  '  digitalWrite(LED_BUILTIN, LOW);    // LED off',
  '  delay(1000);                       // wait one second',
  '}',
].join('\n');
const BLINK_GENERATED = [
  '// Generated from blocks · read-only',
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
  ['', 'sys', '— Connected to /dev/cu.usbmodem1101 at 115200 baud —'],
  ['14:02:10.881', 'rx', 'ESP-ROM:esp32s3-20210327'],
  ['14:02:10.884', 'rx', 'rst:0x1 (POWERON),boot:0x8 (SPI_FAST_FLASH_BOOT)'],
  ['14:02:10.902', 'rx', 'entry 0x403c98d0'],
  ['14:02:11.204', 'rx', 'RoboCore V2 ready'],
];
const OUTPUT_VERIFY = [
  ['14:05:12', 'sys', 'Compiling sketch for RoboCore V2 (ESP32-S3)…'],
  ['14:05:13', 'rx', 'Using board \'robocore_v2\' from platform esp32 3.0.7'],
  ['14:05:17', 'rx', 'Linking everything together…'],
  ['14:05:18', 'rx', 'Sketch uses 289,617 bytes (9%) of program storage space. Maximum is 3,145,728 bytes.'],
  ['14:05:18', 'rx', 'Global variables use 20,436 bytes (6%) of dynamic memory, leaving 307,244 bytes for local variables.'],
  ['14:05:18', 'ok', 'Verified in 6.4 s — ready to upload'],
];
const OUTPUT_UPLOAD = [
  ['14:06:02', 'ok', 'Compiled in 6.1 s · 289,617 bytes (9%)'],
  ['14:06:03', 'rx', 'esptool.py v4.6 · Serial port /dev/cu.usbmodem1101'],
  ['14:06:03', 'rx', 'Chip is ESP32-S3 (QFN56) (revision v0.2) · Embedded PSRAM 2MB'],
  ['14:06:04', 'rx', 'Changing baud rate to 921600 · Configuring flash size…'],
  ['14:06:05', 'rx', 'Writing at 0x00010000… (18 %)'],
  ['14:06:06', 'rx', 'Writing at 0x00030000… (45 %)'],
  ['14:06:07', 'info', 'Writing at 0x00050000… (64 %)'],
];
const OUTPUT_FAILED = [
  ['14:07:41', 'ok', 'Compiled in 5.9 s · 289,617 bytes (9%)'],
  ['14:07:42', 'rx', 'esptool.py v4.6 · Serial port /dev/cu.usbmodem1101'],
  ['14:07:42', 'rx', 'Connecting......................................'],
  ['14:07:52', 'err', 'A fatal error occurred: Failed to connect to ESP32-S3: No serial data received.'],
  ['14:07:52', 'warn', 'Upload failed. Hold BOOT, tap RESET, then Upload again — or close other apps using the port.'],
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
function iconBtn(parent, icon, o = {}) {
  const b = inst('Icon Button', { Variant: o.variant || 'Ghost', State: o.state || 'Default' }, parent, { name: o.name || icon });
  setProp(b, 'Icon', ICON[icon].id);
  return b;
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
  const sb = inst('Sidebar', { Collapsed: o.sidebarCollapsed ? 'True' : 'False' }, body, { name: 'Sidebar' });
  sb.layoutSizingVertical = 'FILL';
  if (o.nav) setNavActive(sb, o.nav);
  setProjectPill(sb, (o.context || 'Editor') === 'Editor' ? 'Active' : 'Default');
  const main = box({ name: 'Main', dir: 'V', gap: o.gap === undefined ? 12 : o.gap, pad: o.pad === undefined ? 12 : o.pad, parent: body, grow: true, hSize: 'fill' });
  const status = inst('Status Bar', null, f, { name: 'Status bar' });
  status.layoutSizingHorizontal = 'FILL';
  return { top, body, sb, main, status };
}

// panel with tabs: serial | output | problems
function utilityPanel(parent, o) {
  const collapsed = !!o.collapsed;
  const panel = box({ name: 'Utility panel', dir: 'V', parent, grow: true, hSize: 'fill', fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', clip: true });
  const ph = box({ name: 'Panel header', dir: 'H', gap: 8, pad: [0, 8, 0, 12], h: 40, cross: 'center', parent: panel, wSize: 'fill', stroke: collapsed ? undefined : 'color/border/subtle', sides: collapsed ? undefined : { b: 1 } });
  const tabs = box({ name: 'Tabs', dir: 'H', gap: 20, h: 40, cross: 'end', parent: ph });
  const tabDefs = [['Serial Monitor', 'terminal', 'serial'], ['Compiler Output', 'file-code', 'output'], ['Problems', 'alert-triangle', 'problems']];
  for (const [label, ic, key] of tabDefs) {
    const t = inst('Panel Tab', { State: o.tab === key && !collapsed ? 'Active' : 'Inactive' }, tabs, { name: 'Tab ' + label });
    setProp(t, 'Label', label); setProp(t, 'Icon', ICON[ic].id);
    if (key === 'problems') { setProp(t, 'Show count', true); setProp(t, 'Count', String(o.problems || 0)); }
    else if (key === 'serial' && collapsed && o.connected !== false) { setProp(t, 'Show count', true); setProp(t, 'Count', '4'); }
  }
  spacer(ph, 1, true);
  if (collapsed) {
    txt(o.connected === false ? 'No board connected' : 'RoboCore V2 · 115200 baud · 4 new lines', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ph, name: 'Summary' });
    divider(ph, 'V', 20);
    iconBtn(ph, 'chevron-up', { name: 'Expand panel' });
    return panel;
  }
  if (o.tab === 'serial') {
    const b = inst('Select', { State: 'Default' }, ph, { name: 'Baud' }); setProp(b, 'Value', '115200 baud'); b.resize(132, 28);
    const le = inst('Select', { State: 'Default' }, ph, { name: 'Line ending' }); setProp(le, 'Value', 'New line'); le.resize(116, 28);
    divider(ph, 'V', 20);
    iconBtn(ph, 'clock', { state: 'Active', name: 'Timestamps' });
    iconBtn(ph, 'autoscroll', { state: 'Active', name: 'Autoscroll' });
    iconBtn(ph, 'pause', { name: 'Pause' });
    iconBtn(ph, 'trash', { name: 'Clear output' });
  } else {
    iconBtn(ph, 'copy', { name: 'Copy output' });
    iconBtn(ph, 'trash', { name: 'Clear output' });
  }
  divider(ph, 'V', 20);
  iconBtn(ph, 'panel-bottom', { name: 'Maximise panel' });
  iconBtn(ph, 'chevron-down', { name: 'Collapse panel' });
  // content
  if (o.tab === 'serial' && o.connected === false) {
    const es = box({ name: 'Empty state', dir: 'V', gap: 10, pad: 16, align: 'center', cross: 'center', parent: panel, wSize: 'fill', grow: true, fill: 'color/bg/console' });
    const ic = box({ name: 'Icon circle', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 999, fill: 'color/bg/raised', parent: es });
    iconSlot(ic, 'unplug', 'color/icon/muted', 20, 'Icon');
    txt('No board connected', { style: 'Heading/H3', parent: es, name: 'Title' });
    txt('Connect RoboCore V2 with a USB-C data cable to see its serial output.', { style: 'Body/Small', color: 'color/text/secondary', parent: es, name: 'Body' });
    const row = box({ name: 'Actions', dir: 'H', gap: 8, cross: 'center', parent: es });
    const c = inst('Button', { Variant: 'Primary', State: 'Default' }, row, { name: 'Connect board' }); setProp(c, 'Label', 'Connect board'); setProp(c, 'Icon', ICON['plug'].id);
    const d = inst('Button', { Variant: 'Ghost', State: 'Default' }, row, { name: 'Demo output' }); setProp(d, 'Label', 'Show sample output (demo)'); setProp(d, 'Icon', ICON['play'].id);
    return panel;
  }
  const lines = o.lines || SERIAL_BOOT;
  consoleView(panel, lines, { name: 'Console' });
  if (o.tab === 'serial') {
    const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [8, 8, 8, 12], cross: 'center', parent: panel, wSize: 'fill', fill: 'color/bg/console', stroke: 'color/border/subtle', sides: { t: 1 } });
    const fld = box({ name: 'Message field', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 32, cross: 'center', radius: 8, fill: 'color/bg/input', stroke: 'color/border/default', parent: ir, grow: true });
    txt('Message to RoboCore V2 (Enter to send)', { style: 'Body/Small', color: 'color/text/tertiary', parent: fld, name: 'Placeholder', grow: true });
    const s = inst('Button', { Variant: 'Secondary', State: 'Default' }, ir, { name: 'Send' }); setProp(s, 'Label', 'Send'); setProp(s, 'Icon', ICON['send'].id);
  }
  return panel;
}

function canvasControls(cv, cw, chh) {
  const z = box({ name: 'Zoom controls', dir: 'V', gap: 2, pad: 4, radius: 10, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: cv, effect: 'Elevation/1 Raised' });
  iconBtn(z, 'zoom-in', { name: 'Zoom in' }); iconBtn(z, 'zoom-out', { name: 'Zoom out' }); iconBtn(z, 'fit', { name: 'Reset zoom' });
  z.x = cw - 16 - 40; z.y = chh - 16 - 40 - 12 - 108;
  z.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  const t = inst('Icon Button', { Variant: 'Subtle', State: 'Default' }, cv, { name: 'Trash' }); setProp(t, 'Icon', ICON['trash'].id);
  t.resize(40, 40); t.x = cw - 16 - 40; t.y = chh - 16 - 40; t.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  const zl = box({ name: 'Zoom level', dir: 'H', pad: [0, 10, 0, 10], h: 28, cross: 'center', radius: 999, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: cv });
  txt('100%', { style: 'Label/Small', color: 'color/text/secondary', parent: zl, name: 'Zoom' });
  zl.x = cw - 16 - 40 - 12 - 54; zl.y = chh - 16 - 34; zl.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  const hint = box({ name: 'Canvas hint', dir: 'H', gap: 6, pad: [0, 10, 0, 8], h: 28, cross: 'center', radius: 999, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: cv });
  iconSlot(hint, 'info', 'color/icon/muted', 14, 'Icon');
  txt('Drag blocks from the palette · right-click a block for options', { style: 'Caption/Default', color: 'color/text/tertiary', parent: hint, name: 'Hint' });
  hint.x = 16; hint.y = chh - 16 - 28; hint.constraints = { horizontal: 'MIN', vertical: 'MAX' };
}

// called after the whole screen is laid out, so positions use the canvas's real size
function finishCanvas(cv, o) {
  const cw = Math.round(cv.width), chh = Math.round(cv.height);
  const g = gridVector(cw, chh, 24); cv.insertChild(0, g); g.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  canvasControls(cv, cw, chh);
  if (o.dragging) {
    const ghost = cv.findOne(n => n.name === 'Insertion marker');
    const gp = ghost ? relPos(ghost, cv) : { x: 60, y: 300 };
    const d = blk('Output/Play tone', null, cv);
    d.name = 'Dragged block';
    LINKS.push([d, 'effect', 'Elevation/Drag']);
    d.x = Math.round(gp.x + gp.w + 28); d.y = Math.round(gp.y + 10); d.rotation = -2;
  }
}
function blocksWorkspace(content, o, cw, chh) {
  // toolbox
  const tb = box({ name: 'Toolbox', dir: 'V', gap: 2, pad: [12, 8, 12, 8], w: 168, parent: content, hSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { r: 1 } });
  const th = box({ name: 'Toolbox header', dir: 'H', pad: [0, 8, 8, 8], parent: tb });
  txt('CATEGORIES', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: th, name: 'Label' });
  for (const [cat] of BLOCK_CATS) inst('Block Category', { Category: cat, State: cat === (o.category || 'Output') && !o.flyoutClosed ? 'Active' : 'Default' }, tb, { name: 'Category ' + cat });
  // flyout
  if (!o.flyoutClosed) {
    const fl = box({ name: 'Flyout', dir: 'V', gap: 14, pad: [14, 16, 16, 16], w: 304, parent: content, hSize: 'fill', fill: 'color/bg/raised', stroke: 'color/border/subtle', sides: { r: 1 }, clip: true });
    const fh = box({ name: 'Flyout header', dir: 'H', gap: 8, cross: 'center', parent: fl, wSize: 'fill' });
    box({ name: 'Swatch', w: 10, h: 10, radius: 999, fill: 'color/block/output', parent: fh });
    txt('Output', { style: 'Heading/H3', parent: fh, name: 'Title', grow: true });
    txt('6 blocks', { style: 'Caption/Default', color: 'color/text/tertiary', parent: fh, name: 'Count' });
    for (const key of ['Output/Set built-in LED', 'Output/Set digital pin', 'Output/Write PWM', 'Output/Play tone', 'Output/Stop tone', 'Output/Set RGB LED']) {
      const b = blk(key, null, fl);
      if (o.dragging && key === 'Output/Play tone') b.opacity = 0.35;
    }
  }
  // canvas
  const cv = box({ name: 'Canvas', parent: content, grow: true, hSize: 'fill', fill: 'color/bg/canvas', clip: true });
  const prog = buildBlinkProgram({ insertion: !!o.dragging, selected: !!o.selected });
  cv.appendChild(prog); prog.x = 40; prog.y = 36;
  // grid, overlay controls and the dragged block are added by finishCanvas() once the screen layout is final
  // generated code preview
  if (o.codePreview) {
    const pv = box({ name: 'Code preview', dir: 'V', w: 360, parent: content, hSize: 'fill', fill: 'color/bg/editor', stroke: 'color/border/subtle', sides: { l: 1 } });
    const hd = box({ name: 'Preview header', dir: 'H', gap: 8, pad: [0, 8, 0, 14], h: 40, cross: 'center', parent: pv, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    iconSlot(hd, 'code', 'color/icon/brand', 16, 'Icon');
    txt('Generated C++', { style: 'Label/Strong', parent: hd, name: 'Title' });
    const b = inst('Badge', { Tone: 'Neutral' }, hd, { name: 'Read-only' }); setProp(b, 'Label', 'Read-only'); setProp(b, 'Show dot', false);
    spacer(hd, 1, true);
    iconBtn(hd, 'copy', { name: 'Copy code' });
    iconBtn(hd, 'x', { name: 'Close preview' });
    codeView(pv, BLINK_GENERATED, { name: 'Generated code', wSize: 'fill', grow: true });
    const note = box({ name: 'Preview note', dir: 'H', gap: 8, pad: [10, 14, 12, 14], cross: 'start', parent: pv, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
    iconSlot(note, 'info', 'color/icon/muted', 16, 'Icon');
    txt('Updates as you edit blocks. To customise, open in Code mode — hand-edited code can’t be turned back into blocks.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: note, name: 'Note', grow: true });
  }
  return cv;
}

function codeWorkspace(content, o) {
  const lines = (o.code || BLINK_INO);
  const ed = codeView(content, lines, { name: 'Editor', grow: true, hSize: 'fill', activeLine: o.activeLine || 14, cursor: o.cursor || { line: 14, col: 34 }, error: o.error });
  ed.layoutSizingVertical = 'FILL';
  // scrollbar
  const sbar = box({ name: 'Scrollbar', dir: 'V', w: 14, parent: content, hSize: 'fill', fill: 'color/bg/editor', pad: [4, 4, 4, 4] });
  rect({ name: 'Thumb', w: 6, h: 120, radius: 3, fill: 'color/border/default', parent: sbar });
  if (o.autocomplete) {
    const area = ed.findOne(n => n.name === 'Text area');
    const ac = box({ name: 'Autocomplete', dir: 'V', gap: 0, w: 380, parent: area, abs: true, radius: 10, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover', clip: true });
    ac.x = 8 + 10 * 7.8 - 8; ac.y = 12 + (o.cursor.line) * 20 + 4;
    const items = [['digitalWrite', '(pin, value)', 'void', true], ['digitalRead', '(pin)', 'int', false], ['digitalPinToInterrupt', '(pin)', 'int', false]];
    const list = box({ name: 'Suggestions', dir: 'V', gap: 0, pad: 4, parent: ac, wSize: 'fill' });
    for (const [n, args, ret, sel] of items) {
      const r = box({ name: 'Suggestion ' + n, dir: 'H', gap: 10, pad: [6, 10, 6, 8], cross: 'center', radius: 6, fill: sel ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
      const ti = box({ name: 'Kind', dir: 'H', w: 20, h: 20, align: 'center', cross: 'center', radius: 4, fill: 'color/brand/subtle', parent: r });
      txt('ƒ', { style: 'Label/Strong', color: 'color/brand/default', parent: ti, name: 'Kind icon' });
      const t = txt(n + args, { style: 'Code/Small', color: 'color/syntax/plain', parent: r, name: 'Signature', grow: true });
      t.setRangeFills(0, 8, [paint('color/accent/default')]);
      txt(ret, { style: 'Code/Small', color: 'color/syntax/type', parent: r, name: 'Return' });
    }
    const doc = box({ name: 'Docs', dir: 'V', gap: 4, pad: [10, 12, 12, 12], parent: ac, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
    txt('Write HIGH or LOW to a digital pin.', { style: 'Body/Small', color: 'color/text/secondary', parent: doc, name: 'Doc', fill: true });
    txt('Arduino core · ↵ to insert · Esc to close', { style: 'Caption/Default', color: 'color/text/tertiary', parent: doc, name: 'Doc hint' });
  }
  return ed;
}

// o: { name, mode:'blocks'|'code', collapsed, codePreview, dragging, tab, lines, connected, uploading, failed, overlay, toast, autocomplete, selected, project }
function ideScreen(page, x, y, o) {
  const f = screenFrame(page, o.name, x, y);
  const connected = o.connected !== false;
  const { top, sb, main, status } = shell(f, { context: 'Editor', nav: null });
  // top bar state
  setText(top, 'Project name', o.project || 'Blink LED');
  if (o.mode === 'code') { const pi = nested(top, 'Project mode icon'); if (pi) { try { pi.swapComponent(ICON['code']); tint(pi, 'color/icon/brand'); } catch (e) { warn(e.message); } } }
  if (o.unsaved) {
    const lbl = setText(top, 'Save label', 'Unsaved changes');
    if (lbl) refill(lbl, 'color/brand/default');
    const si = nested(top, 'Save icon');
    if (si) { try { si.swapComponent(ICON['circle']); tint(si, 'color/icon/brand'); si.resize(10, 10); } catch (e) { warn(e.message); } }
  }
  nestedProps(top, 'Board selector', { Status: connected ? 'Connected' : 'Disconnected', State: o.overlay === 'boardMenu' ? 'Open' : 'Default' });
  if (o.uploading) { nestedProps(top, 'Verify', { State: 'Disabled' }); nestedProps(top, 'Upload', { State: 'Running' }); nestedProps(top, 'Stop', { State: 'Running' }); }
  // workspace
  const ws = box({ name: 'Workspace', dir: 'V', parent: main, wSize: 'fill', grow: true, fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', clip: true });
  const hdr = box({ name: 'Workspace header', dir: 'H', gap: 12, pad: [0, 8, 0, 8], h: 48, cross: 'center', parent: ws, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  inst('Mode Switch', { Active: o.mode === 'code' ? 'Code' : 'Blocks' }, hdr, { name: 'Mode switch' });
  if (o.mode === 'code') {
    const tabs = box({ name: 'File tabs', dir: 'H', gap: 0, h: 48, cross: 'end', parent: hdr });
    const t1 = inst('File Tab', { State: 'Active' }, tabs, { name: 'Tab Blink.ino' }); setProp(t1, 'Filename', 'Blink.ino'); setProp(t1, 'Modified', !!o.unsaved);
    const t2 = inst('File Tab', { State: 'Inactive' }, tabs, { name: 'Tab config.h' }); setProp(t2, 'Filename', 'config.h'); setProp(t2, 'Modified', false);
    const nb = box({ name: 'New file wrap', dir: 'H', h: 36, pad: [0, 4, 0, 4], cross: 'center', parent: tabs });
    iconBtn(nb, 'plus', { name: 'New file' });
    spacer(hdr, 1, true);
    iconBtn(hdr, 'search', { name: 'Find' });
    iconBtn(hdr, 'sliders', { name: 'Format document' });
    iconBtn(hdr, 'more', { name: 'More' });
  } else {
    divider(hdr, 'V', 20);
    txt('7 blocks · setup + loop', { style: 'Caption/Default', color: 'color/text/tertiary', parent: hdr, name: 'Block count' });
    spacer(hdr, 1, true);
    iconBtn(hdr, 'undo', { name: 'Undo' });
    iconBtn(hdr, 'redo', { name: 'Redo' });
    iconBtn(hdr, 'trash', { name: 'Clear workspace' });
    divider(hdr, 'V', 20);
    const cb = inst('Button', { Variant: o.codePreview ? 'Secondary' : 'Ghost', State: 'Default' }, hdr, { name: 'Show code' });
    setProp(cb, 'Label', o.codePreview ? 'Hide code' : 'Show code'); setProp(cb, 'Icon', ICON['code'].id);
    if (o.codePreview) { const l = cb.findOne(n => n.name === 'Icon'); if (l) tint(l, 'color/icon/active'); }
  }
  const content = box({ name: 'Workspace content', dir: 'H', parent: ws, wSize: 'fill', grow: true });
  const bottomH = o.collapsed ? 40 : 236;
  const wsH = SH - 56 - 28 - 24 - 12 - bottomH;
  const contentH = wsH - 48;
  if (o.mode === 'code') codeWorkspace(content, o);
  else {
    const cw = 1200 - 168 - (o.codePreview ? 360 : 304);
    blocksWorkspace(content, Object.assign({}, o, { flyoutClosed: !!o.codePreview }), cw, contentH);
  }
  // bottom row
  const bottom = box({ name: 'Bottom row', dir: 'H', gap: 12, h: bottomH, parent: main, wSize: 'fill' });
  utilityPanel(bottom, { collapsed: o.collapsed, tab: o.tab || 'serial', lines: o.lines, connected, problems: o.problems });
  if (!o.collapsed) { const bi = inst('Board Info Card', { Status: connected ? 'Connected' : 'Disconnected' }, bottom, { name: 'Board info' }); bi.layoutSizingVertical = 'FILL'; }
  if (o.mode !== 'code') { const cv = f.findOne(n => n.name === 'Canvas'); if (cv) finishCanvas(cv, o); }
  // status bar
  const st = o.status || {};
  setStatus(status, {
    status: st.status || 'Ready', dot: st.dot || (connected ? 'color/status/success' : 'color/icon/muted'),
    detail: st.detail !== undefined ? st.detail : (o.mode === 'code' ? 'C++ · Blink.ino · ' + (o.unsaved ? 'unsaved' : 'saved 14:05') : 'Blocks · 7 blocks · auto-saved 14:02'),
    board: connected ? 'RoboCore V2 on /dev/cu.usbmodem1101 · 115200 baud' : 'RoboCore V2 · no port selected',
    cursor: o.mode === 'code' ? (st.cursor || 'Ln 14, Col 35') : '',
  });
  // overlays
  if (o.overlay === 'boardMenu') {
    const sel = nested(top, 'Board selector');
    const p = sel ? relPos(sel, f) : { x: 760, y: 8, w: 300, h: 40 };
    const m = inst('Board Menu', null, f, { name: 'Board menu', abs: true });
    m.x = Math.round(p.x + p.w - 380); m.y = 56 + 6;
  } else if (o.overlay) {
    const scrim = rect({ name: 'Scrim', w: SW, h: SH, fill: 'color/bg/overlay', parent: f, abs: true, x: 0, y: 0 });
    const key = { projectSettings: 'Dialog/Project Settings', clear: 'Dialog/Clear Workspace', connect: 'Dialog/Connect Board', newProject: 'Dialog/New Project' }[o.overlay];
    const d = inst(key, null, f, { name: 'Dialog', abs: true });
    d.x = Math.round((SW - d.width) / 2); d.y = Math.round((SH - d.height) / 2) - 20;
  }
  if (o.toast) {
    const t = inst('Toast', { Type: o.toast.type }, f, { name: 'Toast', abs: true });
    if (o.toast.title) setText(t, 'Title', o.toast.title);
    if (o.toast.message) setText(t, 'Message', o.toast.message);
    t.x = SW - 380 - 24; t.y = SH - 28 - 24 - t.height - (o.collapsed ? 40 : 236) - 12;
  }
  return f;
}

function buildIdePage(page) {
  const GX = 1600, GY = 1200;
  const F = {};
  const defs = [
    ['blocks', { name: 'IDE — Blocks', mode: 'blocks', tab: 'serial' }],
    ['code', { name: 'IDE — Code', mode: 'code', tab: 'output', lines: OUTPUT_VERIFY, status: { status: 'Verified', detail: 'Sketch uses 289,617 bytes (9%) · RAM 20,436 bytes (6%)' } }],
    ['codePreview', { name: 'IDE — Blocks · Code preview', mode: 'blocks', codePreview: true, tab: 'serial' }],
    ['blocksCollapsed', { name: 'IDE — Blocks · Console collapsed', mode: 'blocks', collapsed: true, tab: 'serial' }],
    ['codeCollapsed', { name: 'IDE — Code · Console collapsed + autocomplete', mode: 'code', collapsed: true, unsaved: true, autocomplete: true, code: BLINK_INO.replace('  delay(1000);                       // wait one second\n}', '  delay(1000);                       // wait one second\n  digitalW\n}'), activeLine: 18, cursor: { line: 18, col: 10 }, status: { status: 'Ready', cursor: 'Ln 18, Col 11' } }],
    ['dragging', { name: 'IDE — Blocks · Dragging a block', mode: 'blocks', dragging: true, tab: 'serial' }],
    ['uploading', { name: 'IDE — Code · Uploading', mode: 'code', tab: 'output', lines: OUTPUT_UPLOAD, uploading: true, status: { status: 'Uploading 64%', dot: 'color/status/info', detail: 'Writing at 0x00050000 · 921600 baud' } }],
    ['failed', { name: 'IDE — Code · Upload failed', mode: 'code', tab: 'output', lines: OUTPUT_FAILED, problems: 1, toast: { type: 'Error', title: 'Upload failed', message: 'RoboCore V2 didn’t respond on /dev/cu.usbmodem1101. Hold BOOT, tap RESET and try again.' }, status: { status: 'Upload failed', dot: 'color/status/error', detail: 'Failed to connect to ESP32-S3 · see Compiler Output' } }],
    ['uploaded', { name: 'IDE — Blocks · Upload complete', mode: 'blocks', tab: 'serial', toast: { type: 'Success', title: 'Upload complete', message: 'Blink LED is running on RoboCore V2 (14:06).' }, status: { status: 'Uploaded', detail: 'Flashed 289,617 bytes in 9.8 s' } }],
    ['boardMenu', { name: 'IDE — Blocks · Board selector open', mode: 'blocks', tab: 'serial', overlay: 'boardMenu' }],
    ['boardMenuCode', { name: 'IDE — Code · Board selector open', mode: 'code', tab: 'output', lines: OUTPUT_VERIFY, overlay: 'boardMenu' }],
    ['settings', { name: 'IDE — Blocks · Project settings', mode: 'blocks', tab: 'serial', overlay: 'projectSettings' }],
    ['clear', { name: 'IDE — Blocks · Clear workspace?', mode: 'blocks', tab: 'serial', overlay: 'clear', selected: false }],
    ['disconnected', { name: 'IDE — Blocks · No board connected', mode: 'blocks', tab: 'serial', connected: false }],
    ['connect', { name: 'IDE — Blocks · Connect board', mode: 'blocks', tab: 'serial', connected: false, overlay: 'connect' }],
  ];
  defs.forEach(([key, o], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    try { F[key] = ideScreen(page, col * GX, row * GY, o); }
    catch (e) { REPORT.errors.push('ide ' + key + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  });
  return F;
}
