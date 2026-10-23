// ============================================================================
// Main IDE screens — 1440 × 1000. Blocks = Google Blockly, Code = Monaco.
// One builder, ideScreen(o), draws every editor state; the design page shows a
// curated set and the prototype page draws every state it needs.
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
const BLINK_ERR = BLINK_INO.replace('  digitalWrite(LED_BUILTIN, HIGH);', '  digitalwrite(LED_BUILTIN, HIGH);');
const BLINK_TYPING = BLINK_INO.replace('  delay(1000);\n}', '  delay(1000);\n  digi\n}');
const BLINK_PARAMS = BLINK_INO.replace('  delay(1000);\n}', '  delay(1000);\n  digitalWrite()\n}');
const CONFIG_H = ['// config.h — shared settings for this project', '#pragma once', '', '#define BAUD_RATE 115200', '#define LED_PIN LED_BUILTIN'].join('\n');
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
// the collapsed bottom panel: one 40 px bar
function collapsedPanel(parent, o) {
  const p = panel(parent, 'Utility panel', { grow: true, hSize: 'fill' });
  const ph = box({ name: 'Panel header', dir: 'H', gap: 8, pad: [0, 8, 0, 16], h: 40, cross: 'center', parent: p, wSize: 'fill' });
  const tabs = box({ name: 'Tabs', dir: 'H', gap: 4, h: 40, cross: 'center', parent: ph });
  for (const [label] of CON_TABS) {
    const t = inst('Panel Tab', { State: 'Inactive' }, tabs, { name: 'Tab ' + label });
    setProp(t, 'Label', label);
    if (label === 'Problems' && o.problems) { setProp(t, 'Show count', true); setProp(t, 'Count', String(o.problems)); }
  }
  spacer(ph, 1, true);
  iconBtn(ph, 'chevron-up', { name: 'Expand panel', tipAbove: true });
  return p;
}

// ---------------------------------------------------------------- the Blink program in Blockly
// variant: blink | tone | deleted | duplicate | comment | collapsed | disabled | empty ; select: 'led1' | 'forever'
function blinkProgram(o = {}) {
  const v = o.variant || 'blink';
  const prog = figma.createFrame();
  prog.name = 'Program — Blink';
  prog.fills = []; prog.clipsContent = false;
  if (v === 'empty') { prog.resize(10, 10); return prog; }
  const onStart = makeCBlock([['on start'], []], [[blk('Pins & Serial/Serial begin'), blk('Pins & Serial/Print to serial')]], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — on start', cat: 'Events' });
  prog.appendChild(onStart); onStart.x = 0; onStart.y = 0;
  const led1 = v === 'collapsed' ? makeBlock('Light & Sound', ['turn LED on  …'], { name: 'Collapsed block' }) : blk('Light & Sound/Turn LED', { F1: 'on' });
  led1.name = v === 'collapsed' ? 'Collapsed block' : 'Block LED HIGH';
  const kids = v === 'deleted' ? [] : [led1];
  if (v === 'deleted') led1.remove();
  kids.push(blk('Control/Wait', { F1: '1' }));
  kids[kids.length - 1].name = 'Block wait 1';
  if (v === 'tone') { const t = blk('Light & Sound/Play beep'); t.name = 'Block play tone'; kids.push(t); }
  if (o.insertion) kids.push(makeBlock('Light & Sound', ['play beep', D('C5'), 'for', N('0.2'), 's'], { ghost: true, name: 'Insertion marker' }));
  const low = blk('Light & Sound/Turn LED', { F1: 'off' }); low.name = 'Block LED LOW'; kids.push(low);
  const w2 = blk('Control/Wait', { F1: '1' }); w2.name = 'Block wait 2'; kids.push(w2);
  const forever = makeCBlock([['forever'], []], [kids], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — forever', cat: 'Events' });
  prog.appendChild(forever); forever.x = 0; forever.y = onStart.height + 36;
  const sel = (node, host) => {
    const r = figma.createRectangle(); r.name = 'Selection'; r.fills = [];
    r.strokes = [paint('color/brand/default')]; r.strokeWeight = 3; r.strokeAlign = 'OUTSIDE'; r.cornerRadius = 8;
    host.appendChild(r);
    r.resize(node.width + 6, node.height - (node.type === 'INSTANCE' ? BK.ND : 0) + 6); r.x = node.x - 3; r.y = node.y - 3;
  };
  if (v === 'disabled' && led1.parent) { led1.opacity = 0.45; const hatch = figma.createRectangle(); hatch.name = 'Disabled'; hatch.fills = []; hatch.strokes = [paint('color/border/ink')]; hatch.dashPattern = [3, 3]; hatch.strokeWeight = 1.25; hatch.cornerRadius = 6; forever.appendChild(hatch); hatch.resize(led1.width, led1.height - BK.ND); hatch.x = led1.x; hatch.y = led1.y; }
  if (v === 'comment' && led1.parent) {
    const icon = box({ name: 'Comment icon', dir: 'H', w: 20, h: 20, align: 'center', cross: 'center', radius: 10, fill: 'color/brand/default', stroke: 'color/border/ink', parent: forever });
    iconSlot(icon, 'message', 'color/icon/on-bright', 12, 'Icon');
    icon.x = led1.x + led1.width - 26; icon.y = led1.y + 6;
    const bub = blocklyComment(prog, 'Turn the LED on, wait a second, then off.');
    bub.x = forever.x + led1.x + led1.width + 44; bub.y = forever.y + led1.y - 8;
    const ln = figma.createVector(); ln.name = 'Comment line'; ln.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 0 L 40 0' }]; ln.strokes = [paint('color/border/ink')]; ln.strokeWeight = 1.25; prog.insertChild(0, ln);
    ln.x = forever.x + led1.x + led1.width - 6; ln.y = forever.y + led1.y + 16;
  }
  if (v === 'duplicate') {
    const copy = blk('Light & Sound/Turn LED', { F1: 'on' }); copy.name = 'Duplicated block';
    prog.appendChild(copy); copy.x = forever.width + 48; copy.y = forever.y + 52;
    sel(copy, prog);
  }
  if (o.select === 'led1' && led1.parent) sel(led1, forever);
  if (o.select === 'forever') { const r = figma.createRectangle(); r.name = 'Selection'; r.fills = []; r.strokes = [paint('color/brand/default')]; r.strokeWeight = 3; r.strokeAlign = 'OUTSIDE'; r.cornerRadius = 8; prog.appendChild(r); r.resize(forever.width + 8, forever.height + 8); r.x = forever.x - 4; r.y = forever.y - 4; }
  let mxw = 0, mxh = 0;
  for (const c of prog.children) { mxw = Math.max(mxw, c.x + c.width); mxh = Math.max(mxh, c.y + c.height); }
  prog.resize(Math.max(10, mxw), Math.max(10, mxh));
  return prog;
}
// Obstacle avoider: the hardware-first blocks (Events, Movement, Sensors, Light & Sound)
function avoiderProgram() {
  const prog = figma.createFrame();
  prog.name = 'Program — Obstacle avoider';
  prog.fills = []; prog.clipsContent = false;
  const onStart = makeCBlock([['on start'], []], [[blk('Movement/Movement speed', { F1: '50' })]], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — on start', cat: 'Events' });
  prog.appendChild(onStart); onStart.x = 0; onStart.y = 0;
  const near = [blk('Movement/Stop moving'), blk('Light & Sound/Play beep'), blk('Movement/Turn', { F1: 'right', F2: '90' })];
  const clear = [blk('Movement/Start moving', { F1: 'forward' })];
  const ifb = makeCBlock([['if', { t: 'bool', cat: 'Sensors', parts: ['is obstacle closer than', N('20'), 'cm?'] }, 'then'], ['else'], []], [near, clear], { minW: 150, name: 'Block if obstacle' });
  const forever = makeCBlock([['forever'], []], [[ifb]], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — forever', cat: 'Events' });
  prog.appendChild(forever); forever.x = 0; forever.y = onStart.height + 36;
  const ev = makeCBlock([['when USER button is pressed'], []], [[blk('Movement/Stop moving'), blk('Control/Stop program')]], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — when USER pressed', cat: 'Events' });
  prog.appendChild(ev); ev.x = forever.width + 56; ev.y = 0;
  let mxw = 0, mxh = 0;
  for (const c of prog.children) { mxw = Math.max(mxw, c.x + c.width); mxh = Math.max(mxh, c.y + c.height); }
  prog.resize(mxw, mxh);
  return prog;
}
// kept for the Foundations page
function buildBlinkProgram(o = {}) { return blinkProgram({ select: o.selected ? 'led1' : (o.selectForever ? 'forever' : null), insertion: o.insertion }); }

function blocksWorkspace(content, o) {
  const cat = o.category === undefined ? (o.assistant ? 'None' : 'Light & Sound') : o.category;
  const pal = inst('Blockly Palette', { Category: cat }, content, { name: 'Blockly palette' });
  pal.layoutSizingVertical = 'FILL';
  const cv = box({ name: 'Canvas', parent: content, grow: true, hSize: 'fill', fill: 'color/bg/canvas', clip: true });
  const prog = o.program === 'avoider' ? avoiderProgram() : blinkProgram({ variant: o.program, select: o.select || (o.assistant && o.assistant.indexOf('Learn') === 0 ? (o.assistant === 'Learn · On start' ? null : 'forever') : null), insertion: o.insertion });
  cv.appendChild(prog);
  if (o.zoom && o.zoom !== 1) prog.rescale(o.zoom);
  prog.x = (cat === 'None' ? 64 : (BL.FLYW[cat] || BL.FLYOUT_W) + 56); prog.y = 40;
  if (o.program === 'empty') {
    const h = box({ name: 'Empty workspace', dir: 'V', gap: 6, cross: 'center', parent: cv });
    txt('Your workspace is empty', { style: 'Heading/H2', parent: h, name: 'Title' });
    txt('Pick a category, then drag a block onto the workspace. Start with on start or forever.', { style: 'Body/Small', color: 'color/text/secondary', parent: h, name: 'Body' });
    h.x = (BL.FLYW[cat] || BL.FLYOUT_W) + 120; h.y = 180;
  }
  return cv;
}
// pinned after layout: dotted grid, scrollbars, zoom controls and the trashcan
function finishCanvas(cv, o = {}) {
  const cw = Math.round(cv.width), chh = Math.round(cv.height);
  const g = gridDots(cw, chh, 24); cv.insertChild(0, g); g.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  blocklyControls(cv, { trashFull: o.trashFull });
}
function codeWorkspace(ws, o) {
  const code = { error: BLINK_ERR, broken: BLINK_ERR, typing: BLINK_TYPING, params: BLINK_PARAMS, config: CONFIG_H }[o.code] || BLINK_INO;
  const bannerState = o.code === 'config' ? null : (o.cpp ? 'Code' : (['edited', 'error', 'fixed', 'typing', 'params', 'broken'].indexOf(o.code) >= 0 ? 'Edited' : 'Generated'));
  if (bannerState) { const b = inst('Code Banner', { State: bannerState }, ws, { name: 'Code banner' }); b.layoutSizingHorizontal = 'FILL'; }
  const content = box({ name: 'Workspace content', dir: 'H', parent: ws, wSize: 'fill', grow: true });
  const err = o.code === 'error' ? { line: 11, col: 2, len: 12, lineLen: 34, lens: true } : null;
  const cursor = { typing: { line: 15, col: 6 }, params: { line: 15, col: 15 }, config: { line: 4, col: 26 }, error: null }[o.code];
  const ed = monacoView(content, code, {
    name: 'Editor', grow: true, hSize: 'fill',
    activeLine: o.code === 'typing' || o.code === 'params' ? 15 : (o.code === 'config' ? 4 : 11),
    cursor: cursor === undefined ? { line: 11, col: 34 } : cursor,
    error: err,
    matches: o.code === 'find' ? [[12, 2, 5], [14, 2, 5]] : null, currentMatch: 12,
  });
  ed.layoutSizingVertical = 'FILL';
  return ed;
}
// place a widget (built into the frame) relative to a character in the editor
function atChar(f, node, line, col, dy) {
  const area = f.findOne(n => n.name === 'Text area');
  if (!area) return;
  const p = relPos(area, f);
  f.appendChild(node); node.layoutPositioning = 'ABSOLUTE';
  // dy 'above' = sit just above the line (Monaco puts parameter hints there)
  node.x = Math.round(p.x + mx(col)); node.y = Math.round(p.y + my(line) + (dy === 'above' ? -(node.height + 2) : (dy || 0)));
}

// o: { name, mode:'blocks'|'code', cpp, port:'usb'|'preview', connected, scenario, tab, collapsed,
//      category, program, select, zoom, trashFull, code, assistant (Cog Panel step), run (preview board),
//      top:{ verify, upload, uploadLabel, stop }, undo, status:{status, dot, detail}, toast:{type,title,msg}, project }
function ideScreen(page, x, y, o) {
  const f = screenFrame(page, o.name, x, y);
  const connected = o.connected !== false;
  const preview = o.port === 'preview';
  const { top, body, main, status } = shell(f, { context: 'Editor' });
  if (o.assistant) nestedProps(top, 'Ask Cog', { State: 'Active' });
  nestedProps(top, 'Board selector', { Status: connected || preview ? 'Connected' : 'Disconnected', State: 'Default' });
  if (preview) setText(nested(top, 'Board selector'), 'Details', 'ESP32-S3 · preview board');
  if (o.project) { setText(top, 'Project name', o.project); const op = f.findOne(n => n.type === 'INSTANCE' && n.name === 'Open project'); if (op) setProp(op, 'Project', o.project); }
  const tp = o.top || {};
  if (tp.verify) nestedProps(top, 'Verify', { State: tp.verify });
  if (tp.upload) nestedProps(top, 'Upload', { State: tp.upload });
  if (tp.uploadLabel) { const u = nested(top, 'Upload'); if (u) setText(u, 'Label', tp.uploadLabel); }
  if (tp.verifyLabel) { const u = nested(top, 'Verify'); if (u) setText(u, 'Label', tp.verifyLabel); }
  if (tp.progress !== undefined) { const u = nested(top, 'Upload'); const pr = u && u.findOne(n => n.name === 'Progress'); if (pr) pr.resize(Math.max(1, Math.round(u.width * tp.progress)), 3); }
  if (tp.stop) { const st = nested(top, 'Stop'); if (st) st.visible = true; }
  const ws = panel(main, 'Workspace', { wSize: 'fill', grow: true });
  const hdr = box({ name: 'Workspace header', dir: 'H', gap: 12, pad: [0, 8, 0, 8], h: 48, cross: 'center', parent: ws, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  inst('Mode Switch', { Active: o.mode === 'code' ? 'Code' : 'Blocks' }, hdr, { name: 'Mode switch' });
  if (o.mode === 'code') {
    const tabs = box({ name: 'File tabs', dir: 'H', gap: 0, h: 48, cross: 'end', parent: hdr });
    const t1 = inst('File Tab', { State: o.code === 'config' ? 'Inactive' : 'Active' }, tabs, { name: 'Tab Blink.ino' }); setProp(t1, 'Filename', 'Blink.ino'); setProp(t1, 'Modified', ['edited', 'typing', 'params', 'fixed'].indexOf(o.code) >= 0);
    const t2 = inst('File Tab', { State: o.code === 'config' ? 'Active' : 'Inactive' }, tabs, { name: 'Tab config.h' }); setProp(t2, 'Filename', 'config.h'); setProp(t2, 'Modified', false);
    iconBtn(hdr, 'plus', { name: 'New tab' });
    spacer(hdr, 1, true);
    iconBtn(hdr, 'search', { name: 'Find', state: o.code === 'find' ? 'Active' : 'Default' });
  } else {
    spacer(hdr, 1, true);
    iconBtn(hdr, 'undo', { name: 'Undo', state: o.undo ? 'Default' : 'Disabled' }); iconBtn(hdr, 'redo', { name: 'Redo', state: 'Disabled' }); iconBtn(hdr, 'trash', { name: 'Clear workspace' });
  }
  if (o.mode === 'code') codeWorkspace(ws, o);
  else { const content = box({ name: 'Workspace content', dir: 'H', parent: ws, wSize: 'fill', grow: true }); blocksWorkspace(content, o); }
  const bottom = box({ name: 'Bottom row', dir: 'H', gap: 12, h: o.collapsed ? 40 : 232, parent: main, wSize: 'fill' });
  if (o.collapsed) collapsedPanel(bottom, { problems: o.scenario === 'CompileError' ? 1 : 0 });
  else {
    const scen = o.scenario || (preview ? 'Preview' : (connected ? 'Idle' : 'NoBoard'));
    const con = inst('Console Panel', { Scenario: scen, Tab: o.tab || 'Serial' }, bottom, { name: 'Console' });
    con.layoutSizingHorizontal = 'FILL'; con.layoutSizingVertical = 'FILL';
    if (!o.assistant) {
      if (preview) { const pb = inst('Preview Board', { Run: o.run || 'Idle', User: 'Up' }, bottom, { name: 'Preview board' }); pb.layoutSizingVertical = 'FILL'; }
      else { const bi = inst('Board Info Card', { Status: connected ? 'Connected' : 'Disconnected' }, bottom, { name: 'Board info' }); bi.layoutSizingVertical = 'FILL'; }
    }
  }
  if (o.assistant) {
    const col = box({ name: 'Cog column', dir: 'V', pad: [12, 12, 12, 0], w: 364, parent: body, hSize: 'fill' });
    const cp = inst('Cog Panel', { Step: o.assistant }, col, { name: 'Cog panel' });
    cp.layoutSizingHorizontal = 'FILL'; cp.layoutSizingVertical = 'FILL';
  }
  if (o.mode !== 'code') { const cv = f.findOne(n => n.name === 'Canvas'); if (cv) finishCanvas(cv, o); }
  const st = o.status || {};
  setStatus(status, {
    status: st.status || 'Ready', dot: st.dot || (connected || preview ? null : 'ring'),
    detail: st.detail !== undefined ? st.detail : (o.mode === 'code' ? 'Blink.ino · saved 14:05' : BLOCK_COUNT + ' blocks · saved 14:02'),
    board: preview ? 'RoboCore V2 · preview board · 115200 baud' : (connected ? 'RoboCore V2 · ESP32-S3 USB (303A:1001) · 115200 baud' : 'RoboCore V2 · no board on USB-C'),
    cursor: o.mode === 'code' ? (o.code === 'typing' ? 'Ln 15, Col 7' : 'Ln 11, Col 35') : '',
  });
  // Monaco widgets that belong to the state
  if (o.mode === 'code' && o.code === 'typing') atChar(f, monacoSuggest(null, 'digi'), 15, 2, MO.LH + 2);
  if (o.mode === 'code' && o.code === 'params') atChar(f, monacoParams(null), 15, 2, 'above');
  if (o.mode === 'code' && o.code === 'find') {
    const ed = f.findOne(n => n.name === 'Editor');
    const fw = inst('Find Widget', { Match: '1' }, f, { name: 'Find widget', abs: true });
    if (ed) { const p = relPos(ed, f); fw.x = Math.round(p.x + p.w - fw.width - 28); fw.y = Math.round(p.y + 6); }
  }
  if (o.toast) {
    const t = inst('Toast', { Type: o.toast.type || 'Success' }, f, { name: 'Toast', abs: true });
    if (o.toast.title) setText(t, 'Title', o.toast.title);
    if (o.toast.msg) setText(t, 'Message', o.toast.msg);
    t.x = SW - 360 - 24; t.y = SH - 28 - 24 - t.height - (o.collapsed ? 40 : 232) - 12;
    // in Blocks, keep Blockly's zoom controls and trashcan clear (bottom-right of the workspace)
    const trash = f.findOne(n => n.name === 'Trashcan');
    if (trash) t.x = Math.min(t.x, Math.round(relPos(trash, f).x - 16 - t.width));
  }
  if (o.extra) o.extra(f);
  stackForOverflow(f);
  return f;
}

// ---------------------------------------------------------------- the design page: one frame per key state
function buildIdePage(page) {
  const GX = 1600, GY = 1200;
  const F = {};
  const defs = [
    ['blocks', { name: 'IDE — Blocks', mode: 'blocks' }],
    ['robotBlocks', { name: 'IDE — Blocks · Robot blocks (Obstacle avoider)', mode: 'blocks', category: 'Movement', program: 'avoider', project: 'Obstacle avoider', status: { status: 'Ready', detail: '12 blocks · saved 14:20' } }],
    ['code', { name: 'IDE — Code', mode: 'code', tab: 'Output', scenario: 'Verified', status: { status: 'Verified', detail: '289,617 bytes (9%) · RAM 6%' } }],
    ['boardMenu', { name: 'IDE — Board selector', mode: 'blocks', extra: (f) => overlayInto(f, 'boardMenuEditor') }],
    ['blocksCollapsed', { name: 'IDE — Blocks · Console collapsed', mode: 'blocks', collapsed: true }],
    ['codeCollapsed', { name: 'IDE — Code · Console collapsed', mode: 'code', collapsed: true }],
    ['settings', { name: 'IDE — Project settings', mode: 'blocks', extra: (f) => overlayInto(f, 'projectSettings') }],
    ['uploading', { name: 'IDE — Uploading', mode: 'code', tab: 'Output', scenario: 'Upload64', top: { verify: 'Disabled', upload: 'Running', uploadLabel: 'Uploading 64%', progress: 0.64, stop: true }, status: { status: 'Uploading 64%', dot: 'brand', detail: 'Writing to flash' } }],
    ['failed', { name: 'IDE — Upload failed', mode: 'code', tab: 'Output', scenario: 'Failed', toast: { type: 'Error', title: 'Upload failed', msg: 'Could not start the board’s bootloader. Hold BOOT, tap RESET, release BOOT, then Upload again.' }, status: { status: 'Upload failed', detail: 'See Output' } }],
    ['disconnected', { name: 'IDE — No board connected', mode: 'blocks', connected: false }],
    ['compileError', { name: 'IDE — Code · Compile error', mode: 'code', code: 'error', tab: 'Output', scenario: 'CompileError', status: { status: 'Errors', detail: '1 error · line 11' } }],
    ['cogError', { name: 'IDE — Cog · Help with an error', mode: 'code', code: 'error', tab: 'Output', scenario: 'CompileError', assistant: 'Error · Fix', status: { status: 'Errors', detail: 'Cog is helping · line 11' } }],
    ['cogLearn', { name: 'IDE — Cog · Explain a block', mode: 'blocks', assistant: 'Learn · Explain', status: { status: 'Ready', detail: 'forever selected' } }],
    ['blockMenu', { name: 'IDE — Blocks · Block menu', mode: 'blocks', select: 'led1', extra: (f) => overlayInto(f, 'blockCtx') }],
    ['fieldDropdown', { name: 'IDE — Blocks · Field dropdown', mode: 'blocks', extra: (f) => overlayInto(f, 'fieldLed') }],
    ['trash', { name: 'IDE — Blocks · Trash', mode: 'blocks', program: 'deleted', undo: true, trashFull: true, extra: (f) => overlayInto(f, 'trashFlyout') }],
    ['autocomplete', { name: 'IDE — Code · Autocomplete', mode: 'code', code: 'typing' }],
    ['quickFix', { name: 'IDE — Code · Error hover and quick fix', mode: 'code', code: 'error', tab: 'Problems', scenario: 'CompileError', extra: (f) => overlayInto(f, 'errorHover') }],
    ['preview', { name: 'IDE — Preview board running', mode: 'blocks', port: 'preview', scenario: 'PreviewRun', run: 'LED on', top: { stop: true }, status: { status: 'Running', detail: 'on the preview board' } }],
  ];
  defs.forEach(([key, o], i) => {
    try { F[key] = ideScreen(page, (i % 3) * GX, Math.floor(i / 3) * GY, o); }
    catch (e) { REPORT.errors.push('ide ' + key + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  });
  return F;
}
