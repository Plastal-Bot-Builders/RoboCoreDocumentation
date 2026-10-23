// ============================================================================
// 05 — Prototype: every state the IDE can be in, wired so each control does
// what the behaviour spec says. Works on Figma's Starter plan:
// - screens are frames; timed steps (Verify, Upload, the preview board's blink)
//   move on by themselves ("after delay");
// - menus, popovers, dialogs and toasts are full-screen transparent OVERLAYS
//   (1440 × 1000, opened centred, so they line up with any screen);
// - hover, toggles, dropdowns, tabs, the toolbox, the console and Cog's steps
//   are interactive components and work on every screen.
// Limits (no prototype variables on Starter): a choice made on one screen is not
// carried to the next, right-click is a plain click, and Navy is shown on page 06.
// ============================================================================

const P = {};   // base frames
const OV = {};  // overlay frames
const DISSOLVE = (d) => ({ type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: d || 0.15 });
function navTo(dest, o = {}) {
  return { type: 'NODE', destinationId: dest.id, navigation: o.nav || 'NAVIGATE', transition: o.instant ? null : (o.t === 'smart' ? { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: o.d || 0.25 } : DISSOLVE(o.d)), resetScrollPosition: true, resetInteractiveComponents: true };
}
async function react(node, dest, o = {}) {
  if (!node || !dest) return false;
  const trig = o.trigger || { type: 'ON_CLICK' };
  const action = dest === 'CLOSE' ? { type: 'CLOSE' } : (dest === 'BACK' ? { type: 'BACK' } : navTo(dest, o));
  try { await addReaction(node, { trigger: trig, actions: [action] }); return true; }
  catch (e) { warn('react ' + node.name + ': ' + e.message); return false; }
}
// find a layer by name inside a frame (optionally inside a named container) and wire it
async function on(frame, name, dest, o = {}) {
  if (!frame || !dest) return;
  let scope = frame;
  if (o.within) { scope = frame.findOne(n => n.name === o.within); if (!scope) { warn('proto: no "' + o.within + '" in ' + frame.name); return; } }
  const nodes = o.all ? scope.findAll(n => n.name === name && n.visible !== false) : [scope.findOne(n => n.name === name && n.visible !== false)].filter(Boolean);
  if (!nodes.length) { if (!o.quiet) warn('proto: no "' + name + '" in ' + frame.name); return; }
  for (const n of nodes) await react(n, dest, o);
}
// adds an absolute child that must sit on top of a frame whose stacking is "first on top"
function addTop(f, node) { f.insertChild(0, node); if (isAL(f)) node.layoutPositioning = 'ABSOLUTE'; return node; }
function hoverTarget(f, name, line, col, len) {
  const area = f.findOne(n => n.name === 'Text area');
  if (!area) return null;
  const p = relPos(area, f);
  const hs = figma.createFrame(); hs.name = name; hs.fills = [];
  addTop(f, hs);
  hs.resize(len * MO.CW, MO.LH); hs.x = Math.round(p.x + mx(col)); hs.y = Math.round(p.y + my(line));
  return hs;
}
const HOVER_OPEN = { type: 'MOUSE_ENTER', delay: 300 };
const ESC = { type: 'ON_KEY_DOWN', device: 'KEYBOARD', keyCodes: [27] };

// ---------------------------------------------------------------- overlay content
function dlgFrame(parent, o) {
  const c = box({ name: o.name || 'Dialog', dir: 'V', gap: 0, w: o.w || 460, fill: 'color/bg/raised', radius: 12, stroke: 'color/border/default', effect: 'Elevation/Modal', parent });
  const hd = box({ name: 'Header', dir: 'H', gap: 12, pad: [20, 16, 4, 24], cross: 'start', parent: c, wSize: 'fill' });
  const tc = box({ name: 'Titles', dir: 'V', gap: 4, parent: hd, grow: true });
  tc.layoutSizingHorizontal = 'FILL';
  txt(o.title, { style: 'Heading/H2', parent: tc, name: 'Title', fill: true });
  if (o.desc) txt(o.desc, { style: 'Body/Small', color: 'color/text/secondary', parent: tc, name: 'Description', fill: true });
  iconBtn(hd, 'x', { name: 'Close' });
  if (o.body) o.body(box({ name: 'Body', dir: 'V', gap: 14, pad: [14, 24, 18, 24], parent: c, wSize: 'fill' }));
  else hd.paddingBottom = 18;
  if (o.buttons) { const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [14, 24, 16, 24], cross: 'center', align: 'end', parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } }); footerButtons(ft, o.buttons); }
  return c;
}
function menuFrame(parent, items, o = {}) {
  const m = box({ name: o.name || 'Menu', dir: 'V', gap: 0, pad: 4, w: o.w || 240, fill: 'color/bg/raised', radius: 10, stroke: 'color/border/default', effect: 'Elevation/Popover', parent });
  if (o.header) o.header(m);
  for (const it of items) {
    if (it === '-') { const d = divider(m, 'H', undefined, 'color/border/subtle'); continue; }
    if (it.section) { const s = box({ name: 'Section ' + it.section, dir: 'H', pad: [8, 10, 4, 10], parent: m, wSize: 'fill' }); txt(it.section, { style: 'Caption/Overline', color: 'color/text/tertiary', parent: s, name: 'Title' }); continue; }
    const r = inst('Menu Item', { State: it.sel ? 'Selected' : 'Default' }, m, { name: it.name || ('Item ' + it.label) });
    setProp(r, 'Label', it.label);
    if (it.icon) setProp(r, 'Icon', ICON[it.icon].id); else setProp(r, 'Show icon', false);
    setProp(r, 'Show check', !!it.sel);
    if (it.key) { setProp(r, 'Show shortcut', true); setProp(r, 'Shortcut', it.key); }
    r.layoutSizingHorizontal = 'FILL';
  }
  return m;
}
const BOARD_MENU = (ctx) => [
  { section: 'Board' },
  ...BOARDS.map(([n], i) => ({ label: n, icon: 'cpu', sel: i === 0, name: 'Board ' + n })),
  '-', { section: 'Port' },
  { label: 'Preview board (simulator)', icon: 'bot', name: 'Port preview' },
  { label: 'USB-C · ESP32-S3 (usbmodem1101)', icon: 'usb', sel: true, name: 'Port usb' },
  '-', { label: 'Board setup…', icon: 'settings', name: 'Board setup' },
];
function shortcutsBody(b) {
  const rows = [['Verify', 'Ctrl+R (web: Ctrl+Enter)'], ['Upload', 'Ctrl+U (web: Ctrl+Shift+Enter)'], ['Ask Cog', 'Ctrl+I'], ['Find in code', 'Ctrl+F'], ['Suggestions', 'Ctrl+Space'], ['Quick fix', 'Ctrl+.'], ['Undo / Redo', 'Ctrl+Z / Ctrl+Shift+Z'], ['Delete block', 'Delete'], ['Copy / paste block', 'Ctrl+C / Ctrl+V'], ['Show / hide panel', 'Ctrl+J'], ['Collapse sidebar', 'Ctrl+B'], ['Close a menu or dialog', 'Esc']];
  for (const [k, v] of rows) {
    const r = box({ name: 'Shortcut ' + k, dir: 'H', gap: 12, pad: [6, 0, 6, 0], parent: b, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    txt(k, { style: 'Body/Small', parent: r, name: 'Action', grow: true });
    txt(v, { style: 'Code/Small', color: 'color/text/secondary', parent: r, name: 'Keys' });
  }
  txt('On a Mac, Ctrl is ⌘. In the browser, Ctrl+R and Ctrl+U are taken by the browser, so the web app uses Ctrl+Enter and Ctrl+Shift+Enter.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: b, name: 'Note', fill: true });
}
// key → { anchor, align, dx, dy, scrim, build(parent) }   anchor: [refKey, layerName, withinName]
const OVERLAY_SPECS = {
  boardMenuEditor: { anchor: ['eBlocks', 'Board selector'], align: 'right', dy: 6, build: (p) => menuFrame(p, BOARD_MENU('editor'), { name: 'Board menu', w: 320 }) },
  boardMenuBrowse: { anchor: ['bHome', 'Board selector'], align: 'right', dy: 6, build: (p) => menuFrame(p, BOARD_MENU('browse'), { name: 'Board menu', w: 320 }) },
  projectMenu: { anchor: ['eBlocks', 'Project switcher'], align: 'left', dy: 6, build: (p) => menuFrame(p, [{ label: 'Rename…', icon: 'pencil' }, { label: 'Project settings…', icon: 'sliders' }, { label: 'Duplicate', icon: 'copy' }, { label: 'Download Blink.ino', icon: 'download' }, '-', { label: 'Delete project…', icon: 'trash' }], { name: 'Project menu' }) },
  accountMenu: { anchor: ['eBlocks', 'Account'], align: 'right', dy: 6, build: (p) => menuFrame(p, [{ label: 'Edit profile', icon: 'user' }, { label: 'Keyboard shortcuts', icon: 'keyboard' }, { label: 'About RoboCore IDE', icon: 'info' }], { name: 'Account menu', w: 260, header: (m) => { const h = box({ name: 'Who', dir: 'V', gap: 2, pad: [10, 12, 10, 12], parent: m, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } }); txt(PROFILE.full, { style: 'Label/Strong', parent: h, name: 'Name' }); txt(PROFILE.school + ' · this device', { style: 'Caption/Default', color: 'color/text/tertiary', parent: h, name: 'School' }); } }) },
  accountMenuBrowse: { anchor: ['bHome', 'Account'], align: 'right', dy: 6, build: (p) => OVERLAY_SPECS.accountMenu.build(p) },
  search: { anchor: ['bHome', 'Search'], align: 'left', dy: -32, build: (p) => {
    const w = box({ name: 'Search open', dir: 'V', gap: 6, parent: p });
    const f = box({ name: 'Search typed', dir: 'H', gap: 8, pad: [0, 10, 0, 10], w: 260, h: 32, cross: 'center', radius: 6, fill: 'color/bg/input', stroke: 'color/border/ink', parent: w });
    iconSlot(f, 'search', 'color/icon/strong', 16, 'Icon'); txt('blink', { style: 'Body/Small', parent: f, name: 'Query', grow: true });
    menuFrame(w, [{ section: 'Projects' }, { label: 'Blink LED', icon: 'blocks', name: 'Result Blink LED' }, { section: 'Examples' }, { label: 'Blink an LED', icon: 'lightbulb', name: 'Result Blink an LED' }, { section: 'Help' }, { label: 'Board Setup', icon: 'cpu', name: 'Result Board Setup' }], { name: 'Search results', w: 320 });
    return w; } },
  newProject: { scrim: true, build: (p) => { const d = inst('Dialog/New Project', null, p, { name: 'Dialog' }); return d; } },
  projectSettings: { scrim: true, build: (p) => inst('Dialog/Project Settings', null, p, { name: 'Dialog' }) },
  rename: { scrim: true, build: (p) => dlgFrame(p, { title: 'Rename project', body: (b) => field(b, 'Name', 'Blink LED', { state: 'Focus' }), buttons: [['Ghost', 'Cancel'], ['Primary', 'Rename']] }) },
  deleteConfirm: { scrim: true, build: (p) => dlgFrame(p, { title: 'Delete Blink LED?', desc: 'This deletes the project from this device. You can’t undo it.', buttons: [['Secondary', 'Cancel'], ['Primary', 'Delete project', 'trash']] }) },
  clearWs: { scrim: true, build: (p) => dlgFrame(p, { title: 'Delete all ' + BLOCK_COUNT + ' blocks?', desc: 'Undo (Ctrl+Z) brings them back.', w: 400, buttons: [['Secondary', 'Cancel'], ['Primary', 'Delete', 'trash']] }) },
  newFile: { scrim: true, build: (p) => dlgFrame(p, { title: 'New tab', desc: 'Add a .ino, .h or .cpp file to this sketch.', body: (b) => field(b, 'File name', 'motors.h', { state: 'Focus', helper: 'Letters, numbers, _ or -, then .ino, .h, .hpp, .c or .cpp' }), buttons: [['Ghost', 'Cancel'], ['Primary', 'Add tab', 'plus']] }) },
  resetData: { scrim: true, build: (p) => dlgFrame(p, { title: 'Reset all data?', desc: 'Deletes this device’s projects, profile and settings, then starts again at the welcome screen. You can’t undo it.', buttons: [['Secondary', 'Cancel'], ['Primary', 'Reset', 'trash']] }) },
  rebuildConfirm: { scrim: true, build: (p) => dlgFrame(p, { title: 'Rebuild the code from your blocks?', desc: 'Your typed changes in Blink.ino are replaced by the code the blocks generate.', buttons: [['Secondary', 'Cancel'], ['Primary', 'Rebuild', 'refresh']] }) },
  shortcuts: { scrim: true, build: (p) => dlgFrame(p, { title: 'Keyboard shortcuts', w: 520, body: shortcutsBody, buttons: [['Primary', 'Done']] }) },
  about: { scrim: true, build: (p) => dlgFrame(p, { title: 'About RoboCore IDE', w: 480, body: (b) => { const ic = CMP['Logo/App Icon'].createInstance(); ic.name = 'App icon'; b.appendChild(ic); for (const l of ['Version 1.0 · design build 2026-10-19', 'Blocks editor: Google Blockly (Apache 2.0)', 'Code editor: Monaco (MIT)', 'Uploads: esptool-js (Apache 2.0) over Web Serial', 'Compiling: arduino-cli 1.5.1 + esp32 core 3.3.12 on the compile server', 'Designed in Zambia by Plastal-Bot Builders']) txt(l, { style: 'Body/Small', color: 'color/text/secondary', parent: b, name: 'Line', fill: true }); }, buttons: [['Primary', 'Done']] }) },
  blockHelp: { scrim: true, build: (p) => dlgFrame(p, { title: 'turn LED on / off', desc: 'Turns the LED on the board on or off. On the RoboCore V2 it is the RGB LED, lit white. Use set LED to … for a colour.', w: 440, body: (b) => { txt('C++ it makes', { style: 'Caption/Overline', color: 'color/text/brand', parent: b, name: 'Overline' }); const cv = codeView(b, 'digitalWrite(LED_BUILTIN, HIGH);', { name: 'Code', wSize: 'fill', h: 48, small: true }); cv.cornerRadius = 6; }, buttons: [['Primary', 'Done']] }) },
  portChooserEditor: { anchor: ['eBlocks', 'Top bar'], align: 'center', dy: -40, build: portChooser },
  portChooserBoard: { anchor: ['bHome', 'Top bar'], align: 'center', dy: -40, build: portChooser },
  blockCtx: { anchor: ['eBlocks', 'Block LED HIGH'], align: 'left', dx: 180, dy: -26, sel: true, build: (p) => blocklyMenu(p, CTX_BLOCK, 'Block menu') },
  wsCtx: { anchor: ['eBlocks', 'Canvas'], align: 'left', dx: 620, dy: -430, build: (p) => blocklyMenu(p, CTX_WS, 'Workspace menu') },
  fieldLed: { anchor: ['eBlocks', 'Field (dropdown)', 'Block LED HIGH'], align: 'left', dx: -4, dy: 2, build: (p) => blocklyDropdown(p, ['on', 'off'], 'on', 'LED dropdown') },
  fieldUnit: { anchor: ['eBlocks', 'Field (dropdown)', 'Block wait 1'], align: 'left', dx: -4, dy: 2, build: (p) => blocklyDropdown(p, ['secs', 'ms'], 'secs', 'Unit dropdown') },
  fieldWait: { anchor: ['eBlocks', 'Field (number)', 'Block wait 1'], align: 'left', dx: -6, dy: -27, build: (p) => { const w = box({ name: 'Number editor', dir: 'V', gap: 4, parent: p }); blocklyFieldEditor(w, '1', 44); const hint = box({ name: 'Hint', dir: 'H', pad: [3, 8, 3, 8], radius: 4, fill: 'color/bg/inverse', parent: w }); txt('Type a number · Enter', { style: 'Label/Small', color: 'color/text/on-ink', parent: hint, name: 'Text' }); return w; } },
  trashFlyout: { anchor: ['eDeleted', 'Canvas'], align: 'right', dx: 0, dy: -500, build: (p) => {
    const fl = box({ name: 'Trash flyout', dir: 'V', gap: 14, pad: [16, 18, 16, 18], w: 300, h: 500, fill: 'color/bg/app', stroke: 'color/border/subtle', effect: 'Elevation/Popover', parent: p });
    const h = box({ name: 'Header', dir: 'H', gap: 8, cross: 'center', parent: fl }); iconSlot(h, 'trash', 'color/icon/strong', 16, 'Icon'); txt('Deleted blocks', { style: 'Heading/H2', parent: h, name: 'Title' });
    txt('Drag a block back onto the workspace.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: fl, name: 'Help' });
    const b = blk('Light & Sound/Turn LED', { F1: 'on' }, fl); b.name = 'Trashed block';
    return fl; } },
  hoverDelay: { anchor: ['eCode', 'Hover target delay'], align: 'left', dx: 0, dy: 4, below: true, build: (p) => monacoHover(p, 'void delay(unsigned long ms)', 'Pauses the sketch for ms milliseconds. delay(1000) waits one second; nothing else runs meanwhile.') },
  errorHover: { anchor: ['eCompileError', 'Error word'], align: 'left', dx: 0, dy: 4, below: true, build: monacoErrorHover },
  quickFix: { anchor: ['eCompileError', 'Lightbulb'], align: 'left', dx: 0, dy: 4, below: true, build: monacoCodeActions },
};
function portChooser(p) {
  const c = box({ name: 'Browser port chooser', dir: 'V', gap: 10, pad: 18, w: 420, fill: 'color/bg/raised', radius: 10, stroke: 'color/border/strong', effect: 'Elevation/Modal', parent: p });
  txt('plastal-bot-builders.github.io wants to connect to a serial port', { style: 'Label/Strong', parent: c, name: 'Title', fill: true });
  const list = box({ name: 'Ports', dir: 'V', gap: 0, parent: c, wSize: 'fill', stroke: 'color/border/default', radius: 6, clip: true });
  for (const [n, on] of [['USB JTAG/serial debug unit (cu.usbmodem1101)', true], ['Bluetooth-Incoming-Port', false]]) {
    const r = box({ name: 'Port ' + n, dir: 'H', pad: [8, 10, 8, 10], cross: 'center', parent: list, wSize: 'fill', fill: on ? 'color/bg/selected' : undefined });
    txt(n, { style: 'Body/Small', parent: r, name: 'Label', grow: true });
  }
  txt('This box is drawn by Chrome or Edge, not by RoboCore.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Note' });
  const ft = box({ name: 'Footer', dir: 'H', gap: 8, align: 'end', parent: c, wSize: 'fill' });
  footerButtons(ft, [['Secondary', 'Cancel'], ['Primary', 'Connect']]);
  return c;
}
const TOASTS = {
  toastTestOk: ['Success', 'Board answered', 'ESP32-S3 (revision v0.2) on USB JTAG/serial debug unit.'],
  toastBoardReset: ['Info', 'Board restarted', 'The sketch starts again from setup().'],
  toastDuplicated: ['Success', 'Project duplicated', '“Blink LED copy” is in Projects.'],
  toastDownloaded: ['Success', 'Downloaded Blink.ino', 'Open it in Arduino IDE 2 to work offline.'],
  toastProfileSaved: ['Success', 'Profile saved', 'Shown on Home and in the account menu.'],
  toastCopied: ['Info', 'Copied 1 block', 'Paste with Ctrl+V.'],
  toastExpanded: ['Info', 'All blocks expanded', ''],
  toastCleanUp: ['Info', 'Blocks tidied', 'Stacks are lined up in a column.'],
  toastNothingToUndo: ['Info', 'Nothing to undo', ''],
  toastSaved: ['Success', 'Saved', 'Settings are kept on this device.'],
};
// where an anchor layer is, in a reference frame
function anchorRect(ref, name, within) {
  let scope = ref;
  if (within) scope = ref.findOne(n => n.name === within) || ref;
  const n = scope.findOne(x => x.name === name);
  if (!n) { warn('anchor: no ' + name + ' in ' + ref.name); return { x: 600, y: 300, w: 10, h: 10 }; }
  return relPos(n, ref);
}
// builds overlay content into host (an overlay frame or a design frame), positioned from the reference frame
function placeOverlay(host, key, ref) {
  const sp = OVERLAY_SPECS[key];
  if (!sp) { warn('no overlay ' + key); return null; }
  const abs = isAL(host);
  if (sp.scrim) { const s = rect({ name: 'Scrim', w: SW, h: SH, fill: 'color/bg/overlay', parent: host, abs, x: 0, y: 0 }); }
  if (sp.sel && ref) {
    const a = anchorRect(ref, sp.anchor[1], sp.anchor[2]);
    const r = figma.createRectangle(); r.name = 'Selection'; r.fills = []; r.strokes = [paint('color/brand/default')]; r.strokeWeight = 3; r.strokeAlign = 'OUTSIDE'; r.cornerRadius = 8;
    host.appendChild(r); if (abs) r.layoutPositioning = 'ABSOLUTE'; r.resize(a.w + 6, a.h - BK.ND + 6); r.x = a.x - 3; r.y = a.y - 3;
  }
  const node = sp.build(null);
  host.appendChild(node);
  if (abs) node.layoutPositioning = 'ABSOLUTE';
  if (!sp.anchor || !ref) { node.x = Math.round((SW - node.width) / 2); node.y = Math.round((SH - node.height) / 2) - 20; return node; }
  const a = anchorRect(ref, sp.anchor[1], sp.anchor[2]);
  let x = sp.align === 'right' ? a.x + a.w - node.width : (sp.align === 'center' ? a.x + (a.w - node.width) / 2 : a.x);
  let y = a.y + a.h + (sp.dy || 0);
  x += sp.dx || 0;
  node.x = Math.round(Math.max(8, Math.min(SW - node.width - 8, x)));
  node.y = Math.round(Math.max(8, Math.min(SH - node.height - 8, y)));
  return node;
}
// used by the design pages: draw an overlay straight into a frame
function overlayInto(f, key) { return placeOverlay(f, key, f); }
function overlayFrame(page, key, ref, x, y) {
  const f = figma.createFrame();
  f.name = 'Overlay · ' + key;
  f.resize(SW, SH); f.fills = []; f.clipsContent = true;
  page.appendChild(f); f.x = x; f.y = y;
  const d = figma.createFrame(); d.name = 'Dismiss'; d.fills = []; d.resize(SW, SH); f.appendChild(d);
  placeOverlay(f, key, ref);
  OV[key] = f;
  return f;
}
function toastFrame(page, key, x, y) {
  const [type, title, msg] = TOASTS[key];
  const f = figma.createFrame(); f.name = 'Overlay · ' + key; f.resize(SW, SH); f.fills = []; f.clipsContent = true;
  page.appendChild(f); f.x = x; f.y = y;
  const d = figma.createFrame(); d.name = 'Dismiss'; d.fills = []; d.resize(SW, SH); f.appendChild(d);
  const t = inst('Toast', { Type: type }, f, { name: 'Toast' }); setText(t, 'Title', title); if (msg) setText(t, 'Message', msg); else { const mm = t.findOne(n => n.name === 'Message'); if (mm) mm.visible = false; }
  t.x = SW - t.width - 24; t.y = SH - 28 - 24 - t.height;
  OV[key] = f;
  return f;
}

// ---------------------------------------------------------------- the frames
function protoFrames(page) {
  let i = 0;
  const pos = () => { const k = i++; return [(k % 6) * 1560, Math.floor(k / 6) * 1160]; };
  const E = (key, o) => { const [x, y] = pos(); try { P[key] = ideScreen(page, x, y, Object.assign({ name: 'P · ' + key }, o)); } catch (e) { REPORT.errors.push('proto ' + key + ': ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); } };
  const B = (key, fn, o) => { const [x, y] = pos(); try { P[key] = fn(page, x, y, Object.assign({ name: 'P · ' + key }, o)); } catch (e) { REPORT.errors.push('proto ' + key + ': ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); } };
  const up = (p) => ({ verify: 'Disabled', upload: 'Running', uploadLabel: p[0], progress: p[1], stop: true });
  const busy = (s, d) => ({ status: s, dot: 'brand', detail: d });
  // blocks
  E('eBlocks', { mode: 'blocks' });
  E('eBlocksCollapsed', { mode: 'blocks', collapsed: true });
  E('eToneAdded', { mode: 'blocks', category: 'None', program: 'tone', undo: true, status: { status: 'Ready', detail: (BLOCK_COUNT + 1) + ' blocks · saved 14:03' } });
  E('eZoomIn', { mode: 'blocks', zoom: 1.25 });
  E('eZoomOut', { mode: 'blocks', zoom: 0.8 });
  E('eDuplicate', { mode: 'blocks', category: 'None', program: 'duplicate', undo: true });
  E('eDeleted', { mode: 'blocks', category: 'None', program: 'deleted', undo: true, trashFull: true, toast: { type: 'Info', title: 'Deleted 1 block', msg: 'Undo with Ctrl+Z, or get it back from the trashcan.' } });
  E('eComment', { mode: 'blocks', category: 'None', program: 'comment', undo: true });
  E('eCollapsedBlock', { mode: 'blocks', category: 'None', program: 'collapsed', undo: true });
  E('eDisabled', { mode: 'blocks', category: 'None', program: 'disabled', undo: true, status: { status: 'Ready', detail: '1 block disabled: it is skipped in the C++' } });
  E('eEmpty', { mode: 'blocks', program: 'empty', undo: true, trashFull: true, status: { status: 'Ready', detail: '0 blocks' } });
  E('eNewProject', { mode: 'blocks', program: 'empty', project: 'Obstacle avoider', status: { status: 'Ready', detail: 'New project · 0 blocks' } });
  // code
  E('eCode', { mode: 'code' });
  if (P.eCode) hoverTarget(P.eCode, 'Hover target delay', 12, 2, 5);
  E('eCodeCollapsed', { mode: 'code', collapsed: true });
  E('eCodeEdited', { mode: 'code', code: 'edited' });
  E('eCodeTyping', { mode: 'code', code: 'typing' });
  E('eCodeParams', { mode: 'code', code: 'params' });
  E('eCodeFind', { mode: 'code', code: 'find' });
  E('eCodeConfig', { mode: 'code', code: 'config' });
  E('eCodeBroken', { mode: 'code', code: 'broken' });
  E('eCompileError', { mode: 'code', code: 'error', tab: 'Output', scenario: 'CompileError', status: { status: 'Errors', detail: '1 error · line 11' } });
  E('eCodeFixed', { mode: 'code', code: 'fixed', tab: 'Output', scenario: 'Fixed', status: { status: 'Ready', detail: 'Fixed · Verify to check' } });
  // verify
  E('vBlocks1', { mode: 'blocks', tab: 'Output', scenario: 'Verifying', top: { verify: 'Running', upload: 'Disabled' }, status: busy('Verifying…', 'Compiling on the compile server') });
  E('vBlocks2', { mode: 'blocks', tab: 'Output', scenario: 'Verified', toast: { type: 'Success', title: 'Verified', msg: 'Ready to upload · 289,617 bytes (9%) of program storage.' }, status: { status: 'Verified', detail: '289,617 bytes (9%) · RAM 6%' } });
  E('vCode1', { mode: 'code', tab: 'Output', scenario: 'Verifying', top: { verify: 'Running', upload: 'Disabled' }, status: busy('Verifying…', 'Compiling on the compile server') });
  E('vCode2', { mode: 'code', tab: 'Output', scenario: 'Verified', toast: { type: 'Success', title: 'Verified', msg: 'Ready to upload · 289,617 bytes (9%) of program storage.' }, status: { status: 'Verified', detail: '289,617 bytes (9%) · RAM 6%' } });
  E('vBroken1', { mode: 'code', code: 'broken', tab: 'Output', scenario: 'Verifying', top: { verify: 'Running', upload: 'Disabled' }, status: busy('Verifying…', 'Compiling on the compile server') });
  // upload (blocks and code)
  const STEPS = [['Compiling', ['Compiling…', 0.04], busy('Compiling…', 'On the compile server')], ['Upload18', ['Uploading 18%', 0.18], busy('Uploading 18%', 'Writing to flash')], ['Upload64', ['Uploading 64%', 0.64], busy('Uploading 64%', 'Writing to flash')], ['Upload100', ['Restarting…', 1], busy('Restarting…', 'Reopening the Serial Monitor')]];
  for (const m of ['Blocks', 'Code']) {
    STEPS.forEach(([scen, lab, st], k) => E('u' + m + (k + 1), { mode: m.toLowerCase(), tab: 'Output', scenario: scen, top: up(lab), status: st }));
    E('u' + m + '5', { mode: m.toLowerCase(), tab: 'Output', scenario: 'Uploaded', toast: { type: 'Success', title: 'Upload complete', msg: 'Blink LED is running on RoboCore V2.' }, status: { status: 'Uploaded', detail: '316,432 bytes written · 4.2 s' } });
  }
  // failure, no board, preview board
  E('eFlaky', { mode: 'blocks' });
  E('fFlaky1', { mode: 'blocks', tab: 'Output', scenario: 'Compiling', top: up(['Compiling…', 0.04]), status: busy('Compiling…', 'On the compile server') });
  E('fFlaky2', { mode: 'blocks', tab: 'Output', scenario: 'Upload18', top: up(['Uploading…', 0.1]), status: busy('Uploading…', 'Resetting the board into its bootloader') });
  E('eUploadFailed', { mode: 'blocks', tab: 'Output', scenario: 'Failed', toast: { type: 'Error', title: 'Upload failed', msg: 'Hold BOOT, tap RESET, release BOOT, then Upload again.' }, status: { status: 'Upload failed', detail: 'See Output' } });
  E('eNoBoard', { mode: 'blocks', connected: false });
  E('eNoBoardUpload', { mode: 'blocks', connected: false, tab: 'Output', scenario: 'NoBoard', toast: { type: 'Error', title: 'No board on USB-C', msg: 'Plug in the RoboCore and press Connect, then Upload again.' }, status: { status: 'Not connected', detail: 'No board on USB-C' } });
  E('eConnected', { mode: 'blocks', toast: { type: 'Success', title: 'Connected', msg: 'ESP32-S3 USB (303A:1001) at 115200 baud.' } });
  E('ePreview', { mode: 'blocks', port: 'preview' });
  E('pUp1', { mode: 'blocks', port: 'preview', tab: 'Output', scenario: 'PreviewRun', top: up(['Uploading…', 0.5]), status: busy('Uploading…', 'To the preview board') });
  E('pRunOn', { mode: 'blocks', port: 'preview', scenario: 'PreviewRun', run: 'LED on', top: { stop: true }, status: { status: 'Running', detail: 'Blink LED on the preview board' } });
  E('pRunOff', { mode: 'blocks', port: 'preview', scenario: 'PreviewRun', run: 'LED off', top: { stop: true }, status: { status: 'Running', detail: 'Blink LED on the preview board' } });
  E('pStopped', { mode: 'blocks', port: 'preview', scenario: 'PreviewRun', run: 'Stopped', status: { status: 'Stopped', detail: 'Press Upload to run it again' } });
  E('vPreview', { mode: 'blocks', port: 'preview', tab: 'Output', scenario: 'PreviewRun', toast: { type: 'Success', title: 'Verified (preview check)', msg: 'No errors. Add a compile server for a full C++ build.' }, status: { status: 'Verified', detail: 'Preview check' } });
  // Cog
  E('cogLearn', { mode: 'blocks', assistant: 'Learn · Explain', status: { status: 'Ready', detail: 'forever selected' } });
  E('cogCodeLearn', { mode: 'code', assistant: 'Learn · Explain' });
  E('cogError', { mode: 'code', code: 'error', tab: 'Output', scenario: 'CompileError', assistant: 'Error · Explain', status: { status: 'Errors', detail: 'Cog is helping · line 11' } });
  E('cogFix', { mode: 'code', code: 'error', tab: 'Output', scenario: 'CompileError', assistant: 'Error · Fix', status: { status: 'Errors', detail: 'Cog is helping · line 11' } });
  E('cogApplied', { mode: 'code', code: 'fixed', tab: 'Output', scenario: 'Fixed', assistant: 'Error · Check', status: { status: 'Ready', detail: 'Cog applied the fix · Ctrl+Z to undo' } });
  // browse
  B('bWelcome', welcomeScreen, {});
  B('bWelcomeTyped', welcomeScreen, { typed: true });
  B('bHome', homeScreen, {});
  B('bProjects', projectsScreen, {});
  B('bProjectsBlocks', projectsScreen, { filter: 'Blocks' });
  B('bProjectsCode', projectsScreen, { filter: 'Code' });
  B('bProjectsEmpty', projectsScreen, { empty: true });
  for (const c of EX_CATS) B('bExamples' + c.replace(/\W+/g, ''), examplesScreen, { cat: c });
  B('bLibraries', librariesScreen, {});
  for (const [n] of BOARDS) B('bBoard' + n.replace(/\W+/g, ''), boardSetupScreen, { profile: n });
  B('bBoardOff', boardSetupScreen, { connected: false });
  B('bBoardConnected', boardSetupScreen, {});
  B('bSerial', serialScreen, {});
  B('bSerialTyped', serialScreen, { state: 'typed' });
  B('bSerialSent', serialScreen, { state: 'sent' });
  B('bSerialCleared', serialScreen, { state: 'cleared' });
  B('bSettings', settingsScreen, {});
  P.bBoard = P.bBoardRoboCoreV2;
  P.bExamples = P.bExamplesAll;
  // the connected toast on Board Setup
  if (P.bBoardConnected) { const t = inst('Toast', { Type: 'Success' }, null, { name: 'Toast' }); addTop(P.bBoardConnected, t); setText(t, 'Title', 'Connected'); setText(t, 'Message', 'ESP32-S3 USB (303A:1001) at 115200 baud.'); t.x = SW - 384; t.y = SH - 28 - 24 - t.height; }
  return i;
}
function protoOverlays(page, startRow) {
  let i = 0;
  const pos = () => { const k = i++; return [(k % 6) * 1560, (startRow + Math.floor(k / 6)) * 1160]; };
  for (const key of Object.keys(OVERLAY_SPECS)) {
    const sp = OVERLAY_SPECS[key];
    const ref = sp.anchor ? P[sp.anchor[0]] : null;
    const [x, y] = pos();
    try { overlayFrame(page, key, ref, x, y); } catch (e) { REPORT.errors.push('overlay ' + key + ': ' + e.message); }
  }
  // per-card menus and example previews
  const cardMenu = (frameKey, cardName, k) => {
    const ref = P[frameKey]; if (!ref) return;
    const key = 'cardMenu_' + k;
    OVERLAY_SPECS[key] = { anchor: [frameKey, 'More', cardName], align: 'right', dy: 4, build: (p) => menuFrame(p, [{ label: 'Open', icon: 'folder-open' }, { label: 'Rename…', icon: 'pencil' }, { label: 'Duplicate', icon: 'copy' }, { label: 'Download .ino', icon: 'download' }, '-', { label: 'Delete…', icon: 'trash' }], { name: 'Card menu', w: 200 }) };
    const [x, y] = pos(); overlayFrame(page, key, ref, x, y);
  };
  let k = 0;
  for (const fk of ['bHome', 'bProjects', 'bProjectsBlocks', 'bProjectsCode']) {
    const f = P[fk]; if (!f) continue;
    for (const c of f.findAll(n => n.type === 'INSTANCE' && n.name.indexOf('Project ') === 0)) { cardMenu(fk, c.name, k); c.setPluginData('menu', 'cardMenu_' + k); k++; }
  }
  EXAMPLES.forEach((e, j) => {
    const key = 'example_' + j;
    OVERLAY_SPECS[key] = { scrim: true, build: (p) => dlgFrame(p, { title: e.title, desc: e.desc, w: 500, body: (b) => {
      const r = box({ name: 'Meta', dir: 'H', gap: 8, parent: b }); const lv = inst('Badge', { Tone: e.level === 'Advanced' ? 'Ink' : 'Neutral' }, r, { name: 'Level' }); setText(lv, 'Label', e.level); const ct = inst('Badge', { Tone: 'Neutral' }, r, { name: 'Category' }); setText(ct, 'Label', e.cat);
      const th = blocksThumb(b, 452, 120); th.layoutSizingHorizontal = 'FILL';
      txt(e.blocks ? 'Opens as a Blocks project; switch to C++ any time.' : 'Opens as a C++ project.', { style: 'Body/Small', color: 'color/text/secondary', parent: b, name: 'How', fill: true });
    }, buttons: [['Ghost', 'Cancel'], ['Primary', 'Open as new project', 'folder-open']] }) };
    const [x, y] = pos(); overlayFrame(page, key, null, x, y);
  });
  for (const key of Object.keys(TOASTS)) { const [x, y] = pos(); toastFrame(page, key, x, y); }
  return i;
}

// ---------------------------------------------------------------- the wiring
async function wireShell(f, ctx) {
  const browse = ctx === 'browse';
  await on(f, 'Logo', P.bHome, { quiet: true });
  for (const [n, k] of [['Nav/Home', 'bHome'], ['Nav/Projects', 'bProjects'], ['Nav/Libraries', 'bLibraries'], ['Nav/Examples', 'bExamples'], ['Nav/Board Setup', 'bBoard'], ['Nav/Serial Monitor', 'bSerial'], ['Nav/Settings', 'bSettings'], ['Open project', 'eBlocks']]) if (P[k] !== f) await on(f, n, P[k]);
  await on(f, 'Settings', P.bSettings, { within: 'Top bar' });
  await on(f, 'Account', browse ? OV.accountMenuBrowse : OV.accountMenu, { nav: 'OVERLAY' });
  await on(f, 'Board selector', browse ? OV.boardMenuBrowse : OV.boardMenuEditor, { nav: 'OVERLAY' });
  await on(f, 'Board', P.bBoard, { within: 'Status bar', quiet: true });
  if (browse) { await on(f, 'Search', OV.search, { nav: 'OVERLAY', within: 'Top bar' }); await on(f, 'New project', OV.newProject, { nav: 'OVERLAY', within: 'Top bar' }); }
  else await on(f, 'Project switcher', OV.projectMenu, { nav: 'OVERLAY' });
}
async function wireEditor(key, f) {
  const code = key.indexOf('Code') >= 0 || ['eCompileError', 'cogError', 'cogFix', 'cogApplied', 'cogCodeLearn', 'vCode1', 'vCode2', 'vBroken1'].indexOf(key) >= 0 || /^uCode/.test(key);
  const preview = /^(ePreview|pUp1|pRun|pStopped|vPreview)/.test(key);
  const base = code ? P.eCode : (preview ? P.ePreview : (key === 'eNoBoard' || key === 'eNoBoardUpload' ? P.eNoBoard : P.eBlocks));
  await wireShell(f, 'editor');
  await on(f, 'Segment Code', code ? null : P.eCode, { quiet: true });
  await on(f, 'Segment Blocks', code ? P.eBlocks : null, { quiet: true });
  // build actions
  const verify = key === 'eCodeBroken' ? P.vBroken1 : (preview ? P.vPreview : (code ? P.vCode1 : P.vBlocks1));
  const upload = key === 'eCodeBroken' ? P.vBroken1 : (preview ? P.pUp1 : (key === 'eFlaky' ? P.fFlaky1 : (key.indexOf('eNoBoard') === 0 ? P.eNoBoardUpload : (code ? P.uCode1 : P.uBlocks1))));
  if (!/^(u|v|f|pUp)/.test(key)) { await on(f, 'Verify', verify, { within: 'Top bar' }); await on(f, 'Upload', upload, { within: 'Top bar' }); }
  await on(f, 'Stop', preview ? P.pStopped : base, { within: 'Top bar', quiet: true });
  const cog = key === 'eCompileError' ? P.cogError : (code ? P.cogCodeLearn : P.cogLearn);
  await on(f, 'Ask Cog', key.indexOf('cog') === 0 ? (key === 'cogError' || key === 'cogFix' ? P.eCompileError : (key === 'cogApplied' ? P.eCodeFixed : base)) : cog, { within: 'Top bar' });
  await on(f, 'Close assistant', key === 'cogError' || key === 'cogFix' ? P.eCompileError : (key === 'cogApplied' ? P.eCodeFixed : base), { quiet: true });
  // console
  await on(f, 'Collapse panel', code ? P.eCodeCollapsed : P.eBlocksCollapsed, { quiet: true });
  await on(f, 'Expand panel', code ? P.eCode : P.eBlocks, { quiet: true });
  await on(f, 'Connect board', OV.portChooserEditor, { nav: 'OVERLAY', quiet: true });
  if (f.findOne(n => n.name === 'Board info')) await on(f, 'Link', P.bBoard, { within: 'Board info', quiet: true });
  await on(f, 'Explain error', P.cogError, { quiet: true, all: true });
  if (!code) {
    if (key !== 'eBlocks') await on(f, 'Undo', base, { quiet: true });
    await on(f, 'Clear workspace', OV.clearWs, { nav: 'OVERLAY' });
    await on(f, 'Zoom in', P.eZoomIn, { quiet: true }); await on(f, 'Zoom out', P.eZoomOut, { quiet: true }); await on(f, 'Zoom reset', P.eBlocks, { quiet: true });
    if (key === 'eDeleted' || key === 'eEmpty') await on(f, 'Trashcan', OV.trashFlyout, { nav: 'OVERLAY' });
    if (key === 'eBlocks') {
      await on(f, 'Canvas', OV.wsCtx, { nav: 'OVERLAY' });
      await on(f, 'Block LED HIGH', OV.blockCtx, { nav: 'OVERLAY' });
      await on(f, 'Field (dropdown)', OV.fieldLed, { nav: 'OVERLAY', within: 'Block LED HIGH' });
      await on(f, 'Field (dropdown)', OV.fieldUnit, { nav: 'OVERLAY', within: 'Block wait 1' });
      await on(f, 'Field (number)', OV.fieldWait, { nav: 'OVERLAY', within: 'Block wait 1' });
      await on(f, 'Block/Light & Sound/Play beep', P.eToneAdded, { trigger: { type: 'ON_DRAG' }, t: 'smart', within: 'Blockly palette' });
    }
  } else {
    await on(f, 'Tab config.h', P.eCodeConfig, { quiet: true });
    await on(f, 'Tab Blink.ino', P.eCode, { quiet: true });
    await on(f, 'New tab', OV.newFile, { nav: 'OVERLAY', quiet: true });
    await on(f, 'Find', key === 'eCodeFind' ? P.eCode : P.eCodeFind, { quiet: true });
    await on(f, 'Close find', P.eCode, { quiet: true });
    await on(f, 'Rebuild from blocks', OV.rebuildConfirm, { nav: 'OVERLAY', quiet: true });
    if (key === 'eCode' || key === 'eCodeEdited') {
      await on(f, 'Code', P.eCodeTyping, { within: 'Editor' });
      if (key === 'eCode') await on(f, 'Hover target delay', OV.hoverDelay, { nav: 'OVERLAY', trigger: HOVER_OPEN });
    }
    if (key === 'eCodeTyping') { await on(f, 'Suggestion digitalWrite', P.eCodeParams); await on(f, 'Code', P.eCodeEdited, { within: 'Editor' }); await react(f, P.eCodeEdited, { trigger: ESC }); }
    if (key === 'eCodeParams') { await on(f, 'Code', P.eCodeEdited, { within: 'Editor' }); await react(f, P.eCodeEdited, { trigger: ESC }); }
    if (key === 'eCompileError' || key === 'cogError' || key === 'cogFix') {
      await on(f, 'Error word', OV.errorHover, { nav: 'OVERLAY', trigger: HOVER_OPEN });
      await on(f, 'Lightbulb', OV.quickFix, { nav: 'OVERLAY' });
      await on(f, 'Explain lens', P.cogError);
    }
  }
  if (key === 'cogError') await on(f, 'Show the fix', P.cogFix, { within: 'Cog panel' });
  if (key === 'cogFix') { await on(f, 'Apply', P.cogApplied, { within: 'Cog panel' }); await on(f, 'Not now', P.cogError, { within: 'Cog panel' }); }
  if (key.indexOf('cog') === 0) {
    await on(f, 'Prompt Verify again', P.vCode1, { within: 'Cog panel', quiet: true });
  }
}
async function wireTimed() {
  const after = (ms) => ({ type: 'AFTER_TIMEOUT', timeout: ms });
  const chain = async (keys, ms) => { for (let k = 0; k < keys.length - 1; k++) await react(P[keys[k]], P[keys[k + 1]], { trigger: after(ms[k] || ms[ms.length - 1]), t: 'smart', d: 0.2 }); };
  await chain(['vBlocks1', 'vBlocks2'], [1600]);
  await chain(['vCode1', 'vCode2'], [1600]);
  await chain(['vBroken1', 'eCompileError'], [1500]);
  await chain(['uBlocks1', 'uBlocks2', 'uBlocks3', 'uBlocks4', 'uBlocks5'], [1500, 900, 900, 800]);
  await chain(['uCode1', 'uCode2', 'uCode3', 'uCode4', 'uCode5'], [1500, 900, 900, 800]);
  await chain(['fFlaky1', 'fFlaky2', 'eUploadFailed'], [1500, 2200]);
  await chain(['pUp1', 'pRunOn'], [900]);
  await react(P.pRunOn, P.pRunOff, { trigger: after(1000), instant: true });
  await react(P.pRunOff, P.pRunOn, { trigger: after(1000), instant: true });
  await react(P.eConnected, P.eBlocks, { trigger: after(2600) });
  await react(P.bBoardConnected, P.bBoard, { trigger: after(2600) });
  // a toast frame after an upload / verify fades back to the base screen
  for (const [k, b] of [['vBlocks2', 'eBlocks'], ['vCode2', 'eCode'], ['vPreview', 'ePreview']]) await react(P[k], P[b], { trigger: after(4000) });
}
async function wireBrowse() {
  const done = new Set();
  for (const [k, f] of Object.entries(P)) if (k[0] === 'b' && f && !done.has(f) && k !== 'bWelcome' && k !== 'bWelcomeTyped') { done.add(f); await wireShell(f, 'browse'); }
  // welcome
  await on(P.bWelcome, 'Field Your name', P.bWelcomeTyped);
  await on(P.bWelcomeTyped, 'Get started', P.bHome);
  // home
  await on(P.bHome, 'New project', OV.newProject, { nav: 'OVERLAY', within: 'Hero' });
  await on(P.bHome, 'Open Blink LED', P.eBlocks);
  const sr = P.bHome.findOne(n => n.name === 'Section header Recent projects');
  const st = P.bHome.findOne(n => n.name === 'Section header Start from a template');
  if (sr) await react(sr.findOne(n => n.name === 'Link'), P.bProjects);
  if (st) await react(st.findOne(n => n.name === 'Link'), P.bExamples);
  await on(P.bHome, 'Link', P.bBoard, { within: 'Board info' });
  for (const t of P.bHome.findAll(n => n.type === 'INSTANCE' && n.name.indexOf('Template ') === 0)) await react(t, P.eBlocks);
  // project cards + their menus
  for (const fk of ['bHome', 'bProjects', 'bProjectsBlocks', 'bProjectsCode']) {
    const f = P[fk]; if (!f) continue;
    for (const c of f.findAll(n => n.type === 'INSTANCE' && n.name.indexOf('Project ') === 0)) {
      const isCode = c.name === 'Project Obstacle avoider' || PROJECTS.some(p => 'Project ' + p.name === c.name && p.mode === 'Code');
      await react(c, isCode ? P.eCode : P.eBlocks);
      const more = c.findOne(n => n.name === 'More'); const mk = c.getPluginData('menu');
      if (more && mk && OV[mk]) await react(more, OV[mk], { nav: 'OVERLAY' });
    }
  }
  for (const [fk, fil] of [['bProjects', 'All'], ['bProjectsBlocks', 'Blocks'], ['bProjectsCode', 'Code']]) {
    for (const [c, t] of [['All', 'bProjects'], ['Blocks', 'bProjectsBlocks'], ['Code', 'bProjectsCode']]) if (c !== fil) await on(P[fk], 'Chip ' + c, P[t]);
    await on(P[fk], 'New project', OV.newProject, { nav: 'OVERLAY', within: 'Page header' });
  }
  await on(P.bProjectsEmpty, 'New project', OV.newProject, { nav: 'OVERLAY', within: 'Empty state' });
  await on(P.bProjectsEmpty, 'Browse examples', P.bExamples);
  // examples
  for (const c of EX_CATS) {
    const f = P['bExamples' + c.replace(/\W+/g, '')]; if (!f) continue;
    for (const c2 of EX_CATS) if (c2 !== c) await on(f, 'Chip ' + c2, P['bExamples' + c2.replace(/\W+/g, '')]);
    for (const card of f.findAll(n => n.type === 'INSTANCE' && n.name.indexOf('Example ') === 0)) {
      const j = EXAMPLES.findIndex(e => 'Example ' + e.title === card.name);
      if (j >= 0) await react(card, OV['example_' + j], { nav: 'OVERLAY' });
    }
  }
  // board setup
  for (const [n] of BOARDS) {
    const f = P['bBoard' + n.replace(/\W+/g, '')]; if (!f) continue;
    for (const [n2] of BOARDS) if (n2 !== n) await on(f, 'Profile ' + n2, P['bBoard' + n2.replace(/\W+/g, '')]);
    await on(f, 'Test connection', OV.toastTestOk, { nav: 'OVERLAY' });
    await on(f, 'Reset board', OV.toastBoardReset, { nav: 'OVERLAY' });
    await on(f, 'Disconnect', P.bBoardOff);
  }
  await on(P.bBoardOff, 'Connect', OV.portChooserBoard, { nav: 'OVERLAY', within: 'Buttons' });
  for (const [n] of BOARDS) await on(P.bBoardOff, 'Profile ' + n, P['bBoard' + n.replace(/\W+/g, '')]);
  // serial monitor
  for (const k of ['bSerial', 'bSerialSent', 'bSerialCleared']) { await on(P[k], 'Clear', P.bSerialCleared, { within: 'Toolbar' }); await on(P[k], 'Message field', P.bSerialTyped); }
  await on(P.bSerialTyped, 'Send', P.bSerialSent, { within: 'Send row' });
  await on(P.bSerialTyped, 'Clear', P.bSerialCleared, { within: 'Toolbar' });
  // settings
  await on(P.bSettings, 'Save profile', OV.toastProfileSaved, { nav: 'OVERLAY' });
  await on(P.bSettings, 'Reset all data', OV.resetData, { nav: 'OVERLAY' });
}
async function wireOverlays() {
  for (const [key, f] of Object.entries(OV)) {
    await on(f, 'Dismiss', 'CLOSE', { quiet: true });
    await react(f, 'CLOSE', { trigger: ESC });
    for (const n of ['Close', 'Cancel', 'Done', 'Not now']) await on(f, n, 'CLOSE', { quiet: true, all: true });
  }
  const sw = (o) => Object.assign({ nav: 'SWAP' }, o || {});
  // menus
  for (const k of ['boardMenuEditor', 'boardMenuBrowse']) {
    for (const [n] of BOARDS) await on(OV[k], 'Board ' + n, 'CLOSE');
    await on(OV[k], 'Port preview', k === 'boardMenuEditor' ? P.ePreview : P.bBoard);
    await on(OV[k], 'Port usb', k === 'boardMenuEditor' ? P.eBlocks : P.bBoard);
    await on(OV[k], 'Board setup', P.bBoard);
  }
  await on(OV.projectMenu, 'Item Rename…', OV.rename, sw());
  await on(OV.projectMenu, 'Item Project settings…', OV.projectSettings, sw());
  await on(OV.projectMenu, 'Item Duplicate', OV.toastDuplicated, sw());
  await on(OV.projectMenu, 'Item Download Blink.ino', OV.toastDownloaded, sw());
  await on(OV.projectMenu, 'Item Delete project…', OV.deleteConfirm, sw());
  for (const k of ['accountMenu', 'accountMenuBrowse']) {
    await on(OV[k], 'Item Edit profile', P.bSettings);
    await on(OV[k], 'Item Keyboard shortcuts', OV.shortcuts, sw());
    await on(OV[k], 'Item About RoboCore IDE', OV.about, sw());
  }
  await on(OV.search, 'Result Blink LED', P.eBlocks);
  await on(OV.search, 'Result Blink an LED', OV.example_0, sw());
  await on(OV.search, 'Result Board Setup', P.bBoard);
  for (const k of Object.keys(OV).filter(k => k.indexOf('cardMenu_') === 0)) {
    await on(OV[k], 'Item Open', P.eBlocks);
    await on(OV[k], 'Item Rename…', OV.rename, sw());
    await on(OV[k], 'Item Duplicate', OV.toastDuplicated, sw());
    await on(OV[k], 'Item Download .ino', OV.toastDownloaded, sw());
    await on(OV[k], 'Item Delete…', OV.deleteConfirm, sw());
  }
  // dialogs
  await on(OV.newProject, 'Create project', P.eNewProject);
  await on(OV.projectSettings, 'Save', 'CLOSE');
  await on(OV.projectSettings, 'Delete project', OV.deleteConfirm, sw());
  await on(OV.rename, 'Rename', 'CLOSE');
  await on(OV.deleteConfirm, 'Delete project', P.bProjects);
  await on(OV.clearWs, 'Delete', P.eEmpty);
  await on(OV.newFile, 'Add tab', 'CLOSE');
  await on(OV.resetData, 'Reset', P.bWelcome);
  await on(OV.rebuildConfirm, 'Rebuild', P.eCode);
  await on(OV.portChooserEditor, 'Connect', P.eConnected);
  await on(OV.portChooserBoard, 'Connect', P.bBoardConnected);
  for (let j = 0; j < EXAMPLES.length; j++) await on(OV['example_' + j], 'Open as new project', EXAMPLES[j].blocks ? P.eBlocks : P.eCode);
  // Blockly menus and editors
  const bc = OV.blockCtx;
  await on(bc, 'Item Duplicate', P.eDuplicate);
  await on(bc, 'Item Copy', OV.toastCopied, sw());
  await on(bc, 'Item Add Comment', P.eComment);
  await on(bc, 'Item Collapse Block', P.eCollapsedBlock);
  await on(bc, 'Item Disable Block', P.eDisabled);
  await on(bc, 'Item Delete Block', P.eDeleted);
  await on(bc, 'Item Help', OV.blockHelp, sw());
  const wc = OV.wsCtx;
  await on(wc, 'Item Undo', OV.toastNothingToUndo, sw());
  await on(wc, 'Item Redo', 'CLOSE');
  await on(wc, 'Item Paste', 'CLOSE');
  await on(wc, 'Item Clean up Blocks', OV.toastCleanUp, sw());
  await on(wc, 'Item Collapse Blocks', P.eCollapsedBlock);
  await on(wc, 'Item Expand Blocks', OV.toastExpanded, sw());
  await on(wc, 'Item Delete ' + BLOCK_COUNT + ' Blocks', OV.clearWs, sw());
  for (const k of ['fieldLed', 'fieldUnit']) for (const o of OV[k].findAll(n => n.name.indexOf('Option ') === 0)) await react(o, 'CLOSE');
  await on(OV.trashFlyout, 'Trashed block', P.eBlocks, { trigger: { type: 'ON_DRAG' }, t: 'smart' });
  // Monaco
  await on(OV.errorHover, 'Quick fix', OV.quickFix, sw());
  await on(OV.errorHover, 'Explain with Cog', P.cogError);
  await on(OV.errorHover, 'View problem', 'CLOSE');
  await on(OV.quickFix, "Action Change spelling to 'digitalWrite'", P.eCodeFixed);
  await on(OV.quickFix, 'Action Explain with Cog', P.cogError);
  // toasts close by themselves
  for (const k of Object.keys(TOASTS)) if (OV[k]) await react(OV[k], 'CLOSE', { trigger: { type: 'AFTER_TIMEOUT', timeout: 2600 } });
}

async function buildPrototype(page) {
  const t0 = Date.now();
  const rows = Math.ceil(protoFrames(page) / 6);
  await yieldUI();
  protoOverlays(page, rows + 1);
  await applyLinks();
  for (const [k, f] of Object.entries(P)) if (f && k[0] !== 'b' && P[k] === f && k !== 'bBoard') await wireEditor(k, f);
  await wireBrowse();
  await wireOverlays();
  await wireTimed();
  const flows = [
    ['1 · First start', P.bWelcome], ['2 · Home, projects and examples', P.bHome], ['3 · Blocks editor (Blockly)', P.eBlocks],
    ['4 · Code editor (Monaco)', P.eCode], ['5 · Fix a compile error with Cog', P.eCodeBroken], ['6 · Upload fails: board not answering', P.eFlaky],
    ['7 · No board connected', P.eNoBoard], ['8 · Preview board (no hardware)', P.ePreview], ['9 · Learn with Cog', P.cogLearn],
    ['10 · Board setup and connect', P.bBoardOff], ['11 · Settings', P.bSettings],
  ].filter(x => x[1]);
  page.flowStartingPoints = flows.map(([name, f]) => ({ nodeId: f.id, name }));
  const lg = box({ name: 'Prototype guide', dir: 'V', gap: 8, pad: 32, w: 1440, radius: 12, fill: 'color/bg/brand', parent: page });
  lg.x = 0; lg.y = -520;
  txt('Prototype — every control wired', { style: 'Heading/H1', parent: lg, name: 'Title' });
  for (const [n] of flows) txt(n, { style: 'Body/Default', parent: lg, name: 'Flow', fill: true });
  txt('How to use it: present a flow and click. Right-click a block or the canvas = click it. Hover a word in the code (delay) or the red squiggle for Monaco hovers. Esc closes menus and dialogs. Drag “play beep” from the Output flyout onto the workspace. Upload and Verify run by themselves.', { style: 'Body/Small', parent: lg, name: 'Help', fill: true });
  txt('Starter-plan limits: a choice made on one screen is not carried to the next one (the behaviour spec says what the app must remember), and the Navy theme is shown statically on page 06.', { style: 'Body/Small', parent: lg, name: 'Limits', fill: true });
  REPORT.counts.protoFrames = new Set(Object.values(P)).size;
  REPORT.counts.protoOverlays = Object.keys(OV).length;
  REPORT.timings.prototypeBuild = Date.now() - t0;
  // page 07, the behaviour spec, is built here so the orchestration in 11_main stays as it is
  const sp = figma.root.children.find(p => p.name === PAGE_NAMES.spec);
  if (sp) {
    await figma.setCurrentPageAsync(sp);
    try { buildSpecPage(sp); } catch (e) { REPORT.errors.push('spec: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
    await applyLinks();
    if (await openReview()) await exportForReview(sp.children[0] ? sp.children[0].children.map(c => ['spec_' + c.name.replace(/[^\w]+/g, '_').slice(0, 50) + '.png', c, 0.5]) : []);
    await figma.setCurrentPageAsync(page);
  }
  if (await openReview()) {
    const seen = new Set(), items = [];
    for (const [k, f] of Object.entries(P)) if (f && !seen.has(f)) { seen.add(f); items.push(['p_' + k + '.png', f, 0.5]); }
    for (const [k, f] of Object.entries(OV)) if (f && k.indexOf('cardMenu_') !== 0 && k.indexOf('example_') !== 0) items.push(['ov_' + k + '.png', f, 0.5]);
    await exportForReview(items);
  }
  return P;
}
