// ============================================================================
// Composite components: Sidebar, Top Bar (box yellow), Status Bar, Board Info,
// Board Menu, cards, dialogs + code editor / console renderers
// ============================================================================

const NAV = [[['Home', 'home'], ['Projects', 'folder'], ['Libraries', 'library'], ['Examples', 'lightbulb']], [['Board Setup', 'cpu'], ['Serial Monitor', 'terminal']]];
function inkRule(parent, dir, len, op) { const r = divider(parent, dir, len, 'color/border/ink', 'Rule'); r.opacity = op === undefined ? 0.2 : op; return r; }
const TIPS = {
  'Undo': 'Undo · Ctrl+Z', 'Redo': 'Redo · Ctrl+Shift+Z', 'Clear workspace': 'Delete all blocks', 'Find': 'Find · Ctrl+F',
  'Settings': 'Settings', 'Collapse panel': 'Hide panel · Ctrl+J', 'Expand panel': 'Show panel · Ctrl+J', 'Clear output': 'Clear',
  'Clear': 'Clear', 'Collapse sidebar': 'Collapse sidebar · Ctrl+B', 'Close': 'Close · Esc', 'Close assistant': 'Close Cog · Esc',
  'Send to Cog': 'Send · Enter', 'New tab': 'New tab', 'Previous match': 'Previous · Shift+Enter', 'Next match': 'Next · Enter',
  'Close find': 'Close · Esc', 'More': 'More actions', 'Reset board': 'Restart the sketch',
};
function iconBtn(parent, icon, o = {}) {
  const b = inst('Icon Button', { State: o.state || 'Default', Tip: o.tipAbove ? 'Above' : 'Below' }, parent, { name: o.name || icon });
  setProp(b, 'Icon', ICON[icon].id);
  setProp(b, 'Tooltip', o.tip || TIPS[o.name] || o.name || icon);
  if (o.state !== 'Disabled') { const ic = b.findOne(n => n.name === 'Icon' && n.type === 'INSTANCE'); if (ic) tint(ic, o.state === 'Active' ? 'color/icon/strong' : 'color/icon/default'); }
  return b;
}

// ---------------------------------------------------------------- Sidebar project shortcut
function buildProjectPill(parent) {
  const comps = [];
  for (const state of ['Default', 'Active']) for (const collapsed of ['False', 'True']) {
    const c = comp('State=' + state + ', Collapsed=' + collapsed);
    const on = state === 'Active';
    if (collapsed === 'False') al(c, { gap: 10, pad: [8, 10, 8, 10], w: 184, cross: 'center', radius: 8, fill: on ? 'color/bg/panel' : undefined, stroke: on ? 'color/border/ink' : 'color/border/default' });
    else al(c, { w: 40, h: 40, align: 'center', cross: 'center', radius: 8, fill: on ? 'color/bg/panel' : undefined, stroke: on ? 'color/border/ink' : 'color/border/default' });
    if (collapsed === 'False') c.layoutSizingVertical = 'HUG';
    iconSlot(c, 'blocks', 'color/icon/strong', 18, 'Mode icon');
    if (collapsed === 'False') {
      const col = box({ name: 'Text', dir: 'V', gap: 0, parent: c, grow: true });
      txt('Open project', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: col, name: 'Overline' });
      txt('Blink LED', { style: 'Label/Strong', parent: col, name: 'Project', truncate: true });
      iconSlot(c, 'chevron-right', 'color/icon/muted', 16, 'Chevron');
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Sidebar Project', parent, 4, 'Shortcut back to the open project. Active (ink outline) while the editor is showing.');
  propText(set, 'Project', 'Project', 'Blink LED');
  CMP['Sidebar Project'] = set;
}

// ---------------------------------------------------------------- Sidebar
function buildSidebar(parent) {
  const comps = [];
  for (const collapsed of ['False', 'True']) {
    const exp = collapsed === 'False';
    const c = comp('Collapsed=' + collapsed);
    al(c, { dir: 'V', gap: 2, pad: [12, 12, 12, 12], w: exp ? 208 : 64, h: 916, cross: exp ? 'start' : 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 1;
    inst('Sidebar Project', { State: 'Default', Collapsed: collapsed }, c, { name: 'Open project' });
    NAV.forEach((items) => {
      spacer(c, 10);
      for (const [label, ic] of items) {
        const n = inst('Nav Item', { State: 'Default', Collapsed: collapsed }, c, { name: 'Nav/' + label });
        if (exp) setProp(n, 'Label', label);
        setProp(n, 'Icon', ICON[ic].id);
        if (label === 'Serial Monitor' && exp) setProp(n, 'Show indicator', true);
      }
    });
    spacer(c, 1, true);
    const s = inst('Nav Item', { State: 'Default', Collapsed: collapsed }, c, { name: 'Nav/Settings' });
    if (exp) setProp(s, 'Label', 'Settings');
    setProp(s, 'Icon', ICON['settings'].id);
    const foot = box({ name: 'Footer', dir: exp ? 'H' : 'V', gap: 8, pad: [10, 4, 0, 12], cross: 'center', parent: c, stroke: 'color/border/subtle', sides: { t: 1 } });
    if (exp) foot.layoutSizingHorizontal = 'FILL';
    if (exp) txt('Build. Code. Create.', { style: 'Caption/Overline', color: 'color/text/secondary', parent: foot, name: 'Tagline', grow: true });
    iconBtn(foot, exp ? 'panel-left' : 'panel-right', { name: 'Collapse sidebar', tipAbove: true, tip: exp ? 'Collapse sidebar · Ctrl+B' : 'Expand sidebar · Ctrl+B' });
    comps.push(c);
  }
  CMP['Sidebar'] = makeSet(comps, 'Sidebar', parent, 2, 'Navigation, 208px / 64px collapsed (⌘B).');
}
function setNavActive(sidebar, label) {
  const n = sidebar.findOne(x => x.type === 'INSTANCE' && x.name === 'Nav/' + label);
  if (n) { try { n.setProperties({ State: 'Active' }); } catch (e) { warn('nav active ' + label + ': ' + e.message); } }
}
function setProjectPill(sidebar, state) {
  const p = sidebar.findOne(x => x.type === 'INSTANCE' && x.name === 'Open project');
  if (p) { try { p.setProperties({ State: state }); } catch (e) { warn('pill ' + e.message); } }
}

// ---------------------------------------------------------------- Top bar (box yellow)
function buildTopBar(parent) {
  const comps = [];
  for (const ctx of ['Editor', 'Browse']) {
    const c = comp('Context=' + ctx);
    al(c, { gap: 12, pad: [0, 16, 0, 20], w: 1440, h: 56, cross: 'center', fill: 'color/bg/brand' });
    const logo = CMP['Logo/Product Lockup'].createInstance(); logo.name = 'Logo'; c.appendChild(logo);
    inkRule(c, 'V', 24);
    if (ctx === 'Editor') {
      const ps = box({ name: 'Project switcher', dir: 'H', gap: 6, pad: [0, 8, 0, 8], h: 32, cross: 'center', radius: 6, parent: c });
      txt('Blink LED', { style: 'Label/Strong', parent: ps, name: 'Project name' });
      iconSlot(ps, 'chevron-down', 'color/icon/strong', 16, 'Project menu chevron');
      txt('Saved', { style: 'Caption/Default', color: 'color/text/primary', parent: c, name: 'Save label', opacity: 0.7 });
    } else {
      inst('Search Field', null, c, { name: 'Search' });
    }
    spacer(c, 1, true);
    inst('Board Selector', { Status: 'Connected', State: 'Default' }, c, { name: 'Board selector' });
    if (ctx === 'Editor') {
      const acts = box({ name: 'Build actions', dir: 'H', gap: 8, cross: 'center', parent: c });
      inst('Toolbar Action', { Action: 'Verify', State: 'Default' }, acts, { name: 'Verify' });
      inst('Toolbar Action', { Action: 'Upload', State: 'Default' }, acts, { name: 'Upload' });
      const st = inst('Toolbar Action', { Action: 'Stop', State: 'Running' }, acts, { name: 'Stop' }); st.visible = false;
    } else {
      const b = inst('Button', { Variant: 'Primary', State: 'Default' }, c, { name: 'New project' });
      setProp(b, 'Label', 'New project'); setProp(b, 'Icon', ICON['plus'].id);
    }
    if (ctx === 'Editor') inst('Cog Button', { State: 'Default' }, c, { name: 'Ask Cog' });
    const util = box({ name: 'Utilities', dir: 'H', gap: 8, cross: 'center', parent: c });
    const sb = inst('Icon Button', { State: 'Default' }, util, { name: 'Settings' }); setProp(sb, 'Icon', ICON['settings'].id); tint(sb, 'color/icon/strong');
    inst('Avatar', null, util, { name: 'Account' });
    comps.push(c);
  }
  CMP['Top Bar'] = makeSet(comps, 'Top Bar', parent, 1, 'Header in the box yellow, navy ink. Editor: project, board, Verify / Upload (Stop appears only while running), Ask Cog. Browse: search + New project.');
}

// ---------------------------------------------------------------- Status bar
function buildStatusBar(parent) {
  const c = comp('Status Bar', 'Status line, 28px. Text states what is really happening.');
  al(c, { gap: 16, pad: [0, 16, 0, 16], w: 1440, h: 28, cross: 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
  c.strokeTopWeight = 1; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 0;
  const st = box({ name: 'State', dir: 'H', gap: 6, cross: 'center', parent: c });
  dot(st, 'color/ink/default', 7, 'Status dot');
  txt('Ready', { style: 'Label/Small', parent: st, name: 'Status' });
  txt('Saved 14:02', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Detail' });
  spacer(c, 1, true);
  txt('RoboCore V2 · /dev/cu.usbmodem1101 · 115200 baud', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Board' });
  txt('Ln 14, Col 35', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Cursor' });
  CMP['Status Bar'] = c;
  parent.appendChild(c);
}
function setStatus(bar, o) {
  if (o.status) setText(bar, 'Status', o.status);
  if (o.detail !== undefined) setText(bar, 'Detail', o.detail || ' ');
  if (o.board) setText(bar, 'Board', o.board);
  const cur = bar.findOne(n => n.name === 'Cursor');
  if (cur) { if (o.cursor) setText(bar, 'Cursor', o.cursor); else cur.visible = false; }
  const d = bar.findOne(n => n.name === 'Status dot');
  if (d && o.dot === 'ring') { d.fills = []; d.strokes = [paint('color/border/ink')]; d.strokeWeight = 1.5; }
  else if (d && o.dot === 'brand') refill(d, 'color/brand/default');
}

// ---------------------------------------------------------------- Board info card
function buildBoardInfo(parent) {
  const comps = [];
  for (const status of ['Connected', 'Disconnected']) {
    const on = status === 'Connected';
    const c = comp('Status=' + status);
    al(c, { dir: 'V', gap: 0, w: 280, cross: 'start', radius: 10, fill: 'color/bg/panel', stroke: 'color/border/default' });
    c.layoutSizingVertical = 'HUG';
    const hd = box({ name: 'Header', dir: 'H', gap: 8, pad: [0, 14, 0, 14], h: 40, cross: 'center', parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    txt('Board', { style: 'Heading/H2', parent: hd, name: 'Title', grow: true });
    inst('Connection Status', { Status: status }, hd, { name: 'Connection' });
    const rows = box({ name: 'Rows', dir: 'V', gap: 6, pad: [12, 14, 12, 14], parent: c, wSize: 'fill' });
    for (const [k, v] of [['Board', 'RoboCore V2'], ['MCU', 'ESP32-S3, 240 MHz'], ['Port', on ? '/dev/cu.usbmodem1101' : 'None selected']]) {
      const r = box({ name: 'Row ' + k, dir: 'H', gap: 8, cross: 'center', parent: rows, wSize: 'fill' });
      txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 52 });
      txt(v, { style: k === 'Port' && on ? 'Code/Small' : 'Body/Small', color: on || k !== 'Port' ? 'color/text/primary' : 'color/text/tertiary', parent: r, name: 'Value ' + k, grow: true, truncate: true });
    }
    const ft = box({ name: 'Footer', dir: 'H', pad: [0, 14, 12, 14], cross: 'center', parent: c, wSize: 'fill' });
    txt('Board setup →', { style: 'Label/Strong', parent: ft, name: 'Link' });
    comps.push(c);
  }
  CMP['Board Info Card'] = makeSet(comps, 'Board Info Card', parent, 2, 'Compact board summary next to the console. Port appears only when a real port is open.');
}

// ---------------------------------------------------------------- Board menu
const BOARDS = [
  ['RoboCore V2', 'ESP32-S3 · 8 MB flash · 2 MB PSRAM'],
  ['Arduino Uno R3', 'ATmega328P · 32 KB flash'],
  ['ESP32 DevKit V1', 'ESP32 · 4 MB flash'],
  ['NodeMCU-32S', 'ESP32 · 4 MB flash'],
];
function buildBoardMenu(parent) {
  const c = comp('Board Menu', 'Popover from the Board Selector: board profile + port.');
  al(c, { dir: 'V', gap: 0, w: 340, cross: 'start', radius: 10, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/Popover' });
  c.layoutSizingVertical = 'HUG';
  const list = box({ name: 'Boards', dir: 'V', gap: 2, pad: [8, 6, 8, 6], parent: c, wSize: 'fill' });
  BOARDS.forEach(([n, d], i) => {
    const sel = i === 0;
    const r = box({ name: 'Board ' + n, dir: 'H', gap: 10, pad: [8, 10, 8, 10], cross: 'center', radius: 6, fill: sel ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
    iconSlot(r, 'cpu', 'color/icon/strong', 18, 'Icon');
    const col = box({ name: 'Text', dir: 'V', gap: 0, parent: r, grow: true }); col.layoutSizingHorizontal = 'FILL';
    txt(n, { style: 'Label/Strong', parent: col, name: 'Name' });
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Specs', truncate: true, fill: true });
    if (sel) iconSlot(r, 'check', 'color/icon/strong', 16, 'Check');
  });
  const port = box({ name: 'Port', dir: 'V', gap: 6, pad: [12, 12, 12, 12], parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  const pr = box({ name: 'Port row', dir: 'H', gap: 8, cross: 'center', parent: port, wSize: 'fill' });
  txt('Port', { style: 'Label/Default', color: 'color/text/secondary', parent: pr, name: 'Label', grow: true });
  inst('Connection Status', { Status: 'Connected' }, pr, { name: 'Connection' });
  const sel = inst('Select', { State: 'Default' }, port, { name: 'Port select' }); setProp(sel, 'Value', '/dev/cu.usbmodem1101'); sel.layoutSizingHorizontal = 'FILL';
  const ft = box({ name: 'Footer', dir: 'H', pad: [0, 12, 12, 12], parent: c, wSize: 'fill' });
  txt('Board setup →', { style: 'Label/Strong', parent: ft, name: 'Board setup' });
  CMP['Board Menu'] = c;
  parent.appendChild(c);
}

// ---------------------------------------------------------------- thumbnails (mini blocks in category colours / code lines)
function blocksThumb(parent, w, h) {
  const t = box({ name: 'Thumbnail', w, h, fill: 'color/bg/subtle', parent, clip: true });
  const s = w / 268;
  const mk = (role, x, y, bw, bh, r) => { const n = rect({ name: 'Mini ' + role, w: bw * s, h: bh, radius: r, fill: 'color/block/' + role, parent: t, x, y }); n.strokes = [paint('color/block/outline')]; n.strokeWeight = 1; return n; };
  mk('events', 20, 40, 76, 14, [7, 7, 2, 2]); mk('pins', 28, 56, 104, 12, 2); mk('light', 28, 70, 96, 12, 2); mk('control', 28, 84, 64, 12, 2);
  mk('events', 150 * s, 40, 72, 14, [7, 7, 2, 2]); mk('movement', 150 * s + 8, 56, 92, 12, 2); mk('sensors', 150 * s + 8, 70, 62, 12, 6);
  return t;
}
function codeThumb(parent, w, h) {
  const t = box({ name: 'Thumbnail', w, h, fill: 'color/bg/subtle', parent, clip: true });
  const s = w / 268;
  [[0, 110, 0.5], [0, 72, 1], [12, 120, 0.8], [12, 96, 0.8], [12, 60, 0.8], [0, 16, 1]].forEach(([ind, len, op], i) => {
    const r = rect({ name: 'Code line', w: len * s, h: 5, radius: 2.5, fill: 'color/ink/default', parent: t, opacity: op * 0.55 });
    r.x = 18 + ind; r.y = 42 + i * 10;
  });
  return t;
}
function gridDots(w, h, step = 24) {
  const parts = [];
  for (let x = step; x < w; x += step) for (let y = step; y < h; y += step) parts.push('M ' + x + ' ' + y + ' L ' + (x + 0.5) + ' ' + y);
  const v = figma.createVector();
  v.name = 'Grid';
  v.vectorPaths = [{ windingRule: 'NONE', data: parts.join(' ') || 'M 0 0 L 1 0' }];
  v.strokes = [paint('color/border/strong')]; v.strokeWeight = 1.5; v.strokeCap = 'ROUND'; v.fills = [];
  v.opacity = 0.5; v.locked = true;
  return v;
}

// ---------------------------------------------------------------- Project card
function buildProjectCard(parent) {
  const comps = [];
  for (const mode of ['Blocks', 'Code']) for (const state of ['Default', 'Hover']) {
    const c = comp('Mode=' + mode + ', State=' + state);
    al(c, { dir: 'V', gap: 0, w: 268, cross: 'start', radius: 10, fill: 'color/bg/panel', stroke: state === 'Hover' ? 'color/border/ink' : 'color/border/default', effect: state === 'Hover' ? 'Elevation/Popover' : undefined });
    c.layoutSizingVertical = 'HUG'; c.clipsContent = true;
    const th = mode === 'Blocks' ? blocksThumb(c, 268, 112) : codeThumb(c, 268, 112);
    th.layoutSizingHorizontal = 'FILL';
    const mb = box({ name: 'Mode badge', dir: 'H', gap: 4, pad: [0, 8, 0, 6], h: 22, cross: 'center', radius: 4, fill: 'color/bg/panel', stroke: 'color/border/default', parent: th, abs: true });
    mb.x = 10; mb.y = 10;
    iconSlot(mb, mode === 'Blocks' ? 'blocks' : 'code', 'color/icon/strong', 14, 'Mode icon');
    txt(mode, { style: 'Label/Small', parent: mb, name: 'Mode' });
    const body = box({ name: 'Body', dir: 'H', gap: 4, pad: [12, 8, 14, 14], cross: 'center', parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
    const bt = box({ name: 'Texts', dir: 'V', gap: 4, parent: body, grow: true });
    txt(mode === 'Blocks' ? 'Blink LED' : 'Obstacle avoider', { style: 'Heading/H3', parent: bt, name: 'Name', fill: true, truncate: true });
    txt('RoboCore V2 · Edited 2h ago', { style: 'Caption/Default', color: 'color/text/tertiary', parent: bt, name: 'Meta', fill: true, truncate: true });
    iconBtn(body, 'more-vertical', { name: 'More', tip: 'More actions' });
    comps.push(c);
  }
  CMP['Project Card'] = makeSet(comps, 'Project Card', parent, 4, 'Project tile: thumbnail, name, board and last edit. The card opens the project; ⋮ opens Rename, Duplicate, Download and Delete.');
}

// ---------------------------------------------------------------- Example card
function buildExampleCard(parent) {
  const ecs = [];
  for (const state of ['Default', 'Hover']) {
  const c = comp('State=' + state);
  al(c, { dir: 'V', gap: 10, pad: 16, w: 268, cross: 'start', radius: 10, fill: 'color/bg/panel', stroke: state === 'Hover' ? 'color/border/ink' : 'color/border/default', effect: state === 'Hover' ? 'Elevation/Popover' : undefined });
  c.layoutSizingVertical = 'HUG';
  const top = box({ name: 'Top', dir: 'H', align: 'between', cross: 'center', parent: c, wSize: 'fill' });
  const tile = box({ name: 'Icon tile', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 999, stroke: 'color/border/ink', parent: top });
  iconSlot(tile, 'lightbulb', 'color/icon/strong', 20, 'Cover icon');
  const lv = inst('Badge', { Tone: 'Neutral' }, top, { name: 'Level' }); setText(lv, 'Label', 'Beginner');
  const tb = box({ name: 'Text', dir: 'V', gap: 4, parent: c, wSize: 'fill' });
  txt('Blink an LED', { style: 'Heading/H3', parent: tb, name: 'Title', fill: true, truncate: true });
  txt('Switch the built-in LED on and off.', { style: 'Body/Small', color: 'color/text/secondary', parent: tb, name: 'Description', fill: true, truncate: true });
  txt('Blocks + Code · V2 · Uno · ESP32', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Meta', fill: true, truncate: true });
  ecs.push(c);
  }
  CMP['Example Card'] = makeSet(ecs, 'Example Card', parent, 2, 'Example tile: line icon, level, title, one-line description, modes and boards. Opening it shows a preview; “Open as new project” makes a copy in Projects.');
}
function exampleCard(parent, o) {
  const i = inst('Example Card', null, parent, { name: 'Example ' + o.title, text: { Title: o.title, Description: o.desc, Meta: o.meta || 'Blocks + Code · V2 · Uno · ESP32' } });
  const ic = i.findOne(n => n.name === 'Cover icon' && n.type === 'INSTANCE');
  if (ic && o.icon) { try { ic.swapComponent(ICON[o.icon]); } catch (e) { warn(e.message); } tint(ic, 'color/icon/strong'); }
  const lv = i.findOne(n => n.name === 'Level' && n.type === 'INSTANCE');
  if (lv) { if (o.level === 'Advanced') { try { lv.setProperties({ Tone: 'Ink' }); } catch (e) { warn(e.message); } } setText(lv, 'Label', o.level); }
  return i;
}

// ---------------------------------------------------------------- Template tile
function buildTiles(parent) {
  const tts = [];
  for (const state of ['Default', 'Hover']) {
  const t = comp('State=' + state);
  al(t, { gap: 12, pad: [12, 14, 12, 12], w: 240, cross: 'center', radius: 10, fill: 'color/bg/panel', stroke: state === 'Hover' ? 'color/border/ink' : 'color/border/default', effect: state === 'Hover' ? 'Elevation/Popover' : undefined });
  t.layoutSizingVertical = 'HUG';
  const tile = box({ name: 'Icon tile', dir: 'H', w: 36, h: 36, align: 'center', cross: 'center', radius: 8, fill: 'color/brand/tint', parent: t });
  iconSlot(tile, 'bot', 'color/icon/strong', 18, 'Icon');
  const col = box({ name: 'Text', dir: 'V', gap: 0, parent: t, grow: true });
  txt('Line follower', { style: 'Label/Strong', parent: col, name: 'Title', truncate: true });
  txt('Follow a line with 3 IR sensors', { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true, truncate: true });
  tts.push(t);
  }
  CMP['Template Tile'] = makeSet(tts, 'Template Tile', parent, 2, 'Starter template. Creates a new project pre-filled with blocks.');
}
function tileInst(parent, o) {
  const i = inst('Template Tile', null, parent, { name: 'Template ' + o.title, text: { Title: o.title, Description: o.desc } });
  const ic = i.findOne(n => n.name === 'Icon' && n.type === 'INSTANCE');
  if (ic && o.icon) { try { ic.swapComponent(ICON[o.icon]); } catch (e) { warn(e.message); } tint(ic, 'color/icon/strong'); }
  return i;
}

// ---------------------------------------------------------------- Dialogs
function dialogShell(name, title, desc, o = {}) {
  const c = comp(name, o.descr);
  al(c, { dir: 'V', gap: 0, w: o.w || 480, cross: 'start', radius: 12, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/Modal' });
  c.layoutSizingVertical = 'HUG';
  const hd = box({ name: 'Header', dir: 'H', gap: 12, pad: [20, 16, 4, 24], cross: 'start', parent: c, wSize: 'fill' });
  const tc = box({ name: 'Titles', dir: 'V', gap: 4, parent: hd, grow: true });
  tc.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Heading/H2', parent: tc, name: 'Title', fill: true });
  if (desc) txt(desc, { style: 'Body/Small', color: 'color/text/secondary', parent: tc, name: 'Description', fill: true });
  iconBtn(hd, 'x', { name: 'Close' });
  const body = box({ name: 'Body', dir: 'V', gap: 16, pad: [16, 24, 20, 24], parent: c, wSize: 'fill' });
  const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [14, 24, 16, 24], cross: 'center', align: 'end', parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  return { c, body, ft };
}
function footerButtons(ft, buttons) {
  for (const [variant, label, icon] of buttons) {
    if (variant === 'spacer') { spacer(ft, 1, true); continue; }
    const b = inst('Button', { Variant: variant, State: 'Default' }, ft, { name: label });
    setProp(b, 'Label', label);
    if (icon) setProp(b, 'Icon', ICON[icon].id); else setProp(b, 'Show icon', false);
  }
}
function field(parent, label, value, o = {}) {
  const i = inst('Input Field', { State: o.state || 'Default' }, parent, { name: 'Field ' + label });
  setProp(i, 'Label', label); setText(i, 'Value', value);
  if (o.helper) setText(i, 'Helper', o.helper); else setProp(i, 'Show helper', false);
  i.layoutSizingHorizontal = 'FILL';
  if (value) { const v = i.findOne(n => n.name === 'Value'); if (v) refill(v, 'color/text/primary'); }
  return i;
}
function labeledSelect(parent, label, value, o = {}) {
  const w = box({ name: 'Select ' + label, dir: 'V', gap: 6, parent, wSize: o.fill === false ? undefined : 'fill' });
  txt(label, { style: 'Label/Default', color: 'color/text/secondary', parent: w, name: 'Label' });
  const s = inst('Select', { State: o.state || 'Default' }, w, { name: 'Select' });
  setProp(s, 'Value', value);
  s.resize(s.width, 36); s.layoutSizingHorizontal = 'FILL';
  return w;
}
function choiceCard(parent, title, desc, icon, selected) {
  const c = box({ name: 'Choice ' + title, dir: 'H', gap: 12, pad: 14, cross: 'start', radius: 8, fill: selected ? 'color/bg/selected' : 'color/bg/input', stroke: selected ? 'color/border/ink' : 'color/border/default', parent, grow: true });
  c.layoutSizingHorizontal = 'FILL';
  iconSlot(c, icon, 'color/icon/strong', 20, 'Icon');
  const col = box({ name: 'Text', dir: 'V', gap: 2, parent: c, grow: true });
  col.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Label/Strong', parent: col, name: 'Title' });
  txt(desc, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true });
  inst('Radio', { Selected: selected ? 'True' : 'False' }, c, { name: 'Radio' });
  return c;
}
function settingRow(parent, title, desc, control) {
  const r = box({ name: 'Setting ' + title, dir: 'H', gap: 16, pad: [12, 0, 12, 0], cross: 'center', parent, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  const col = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true });
  col.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Label/Default', parent: col, name: 'Title' });
  if (desc) txt(desc, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true });
  control(r);
  return r;
}
function buildDialogs(parent) {
  {
    const { c, body, ft } = dialogShell('Dialog/New Project', 'New project', 'You can switch between Blocks and Code at any time.', { w: 500, descr: 'Create-project dialog.' });
    field(body, 'Project name', 'Obstacle avoider');
    const mc = inst('Mode Choice', { Selected: 'Blocks' }, body, { name: 'Mode choice' }); mc.layoutSizingHorizontal = 'FILL';
    labeledSel(body, 'Board', 'Board');
    footerButtons(ft, [['Ghost', 'Cancel'], ['Primary', 'Create project', 'plus']]);
    CMP['Dialog/New Project'] = c; parent.appendChild(c); stackForOverflow(c);
  }
  {
    const { c, body, ft } = dialogShell('Dialog/Project Settings', 'Project settings', null, { w: 500, descr: 'Opened from the project name in the top bar.' });
    field(body, 'Name', 'Blink LED');
    labeledSel(body, 'Board', 'Board');
    const sr = box({ name: 'Settings', dir: 'V', gap: 0, parent: body, wSize: 'fill' });
    settingRow(sr, 'Auto-save', 'Every 30 seconds and before upload.', (r) => inst('Toggle', { On: 'True' }, r, { name: 'Toggle' }));
    footerButtons(ft, [['Ghost', 'Delete project', 'trash'], ['spacer'], ['Secondary', 'Cancel'], ['Primary', 'Save']]);
    CMP['Dialog/Project Settings'] = c; parent.appendChild(c); stackForOverflow(c);
  }
}

// ---------------------------------------------------------------- Code editor / console renderers (monochrome syntax)
const KW = new Set(['if', 'else', 'for', 'while', 'do', 'return', 'const', 'static', 'break', 'continue', 'switch', 'case', 'default', 'true', 'false']);
const TYPES = new Set(['void', 'int', 'long', 'unsigned', 'char', 'float', 'double', 'bool', 'boolean', 'byte', 'String', 'Serial', 'uint8_t']);
const CONSTS = new Set(['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'A0']);
function highlight(t, code) {
  const bold = PICK(FONT_MONO, 'Bold');
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(#include\s*<[^>]+>|#\w+)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;
  let m;
  while ((m = re.exec(code))) {
    const a = m.index, b = m.index + m[0].length;
    if (m[1]) t.setRangeFills(a, b, [paint('color/syntax/comment')]);
    else if (m[2] || m[4]) t.setRangeFills(a, b, [paint('color/syntax/value')]);
    else if (m[3]) POST.push(() => t.setRangeFontName(a, b, bold));
    else if (m[5]) {
      const w = m[5];
      if (KW.has(w) || TYPES.has(w)) { t.setRangeFills(a, b, [paint('color/syntax/keyword')]); POST.push(() => t.setRangeFontName(a, b, bold)); }
      else if (CONSTS.has(w)) t.setRangeFills(a, b, [paint('color/syntax/value')]);
      else if (/^\s*\(/.test(code.slice(b))) t.setRangeFills(a, b, [paint('color/syntax/function')]);
    }
  }
}
function codeView(parent, code, o = {}) {
  const lines = code.split('\n');
  const view = box({ name: o.name || 'Code view', dir: 'H', gap: 0, parent, fill: 'color/bg/editor', clip: true, w: o.w, h: o.h, hSize: o.hSize, grow: o.grow });
  if (o.wSize === 'fill' && isAL(parent)) view.layoutSizingHorizontal = 'FILL';
  const gut = box({ name: 'Gutter', dir: 'V', gap: 0, pad: [14, 12, 14, 8], parent: view, hSize: 'fill', w: 52, cross: 'end' });
  const nums = lines.map((_, i) => String(i + 1)).join('\n');
  const cs = o.small ? 'Code/Small' : 'Code/Default';
  const nt = txt(nums, { style: cs, color: 'color/syntax/line-number', parent: gut, name: 'Line numbers', align: 'RIGHT' });
  if (o.activeLine) {
    const idx = nums.split('\n').slice(0, o.activeLine - 1).join('\n').length + (o.activeLine > 1 ? 1 : 0);
    nt.setRangeFills(idx, idx + String(o.activeLine).length, [paint('color/syntax/line-number-active')]);
  }
  const area = box({ name: 'Text area', dir: 'V', gap: 0, pad: [14, 16, 14, 8], parent: view, grow: true, hSize: 'fill' });
  if (o.activeLine) rect({ name: 'Current line', w: 2000, h: 20, fill: 'color/brand/soft', parent: area, abs: true, x: 0, y: 14 + (o.activeLine - 1) * 20 });
  const t = txt(code, { style: cs, color: 'color/syntax/plain', parent: area, name: 'Code' });
  highlight(t, code);
  if (o.cursor) rect({ name: 'Caret', w: 2, h: 18, fill: 'color/ink/default', parent: area, abs: true, x: 8 + o.cursor.col * 7.8, y: 15 + (o.cursor.line - 1) * 20 });
  if (o.error) {
    const e = o.error, y0 = 14 + (e.line - 1) * 20;
    const sq = figma.createVector(); sq.name = 'Error underline';
    let d = 'M 0 2'; for (let x = 0; x < e.len * 7.8; x += 4) d += ' L ' + (x + 2) + ' ' + ((x / 4) % 2 ? 2 : 0) + ' L ' + (x + 4) + ' ' + ((x / 4) % 2 ? 0 : 2);
    sq.vectorPaths = [{ windingRule: 'NONE', data: d }]; sq.strokes = [paint('color/border/ink')]; sq.strokeWeight = 1.2; sq.fills = [];
    area.appendChild(sq); sq.layoutPositioning = 'ABSOLUTE'; sq.x = 8 + e.col * 7.8; sq.y = y0 + 17;
    const gm = iconInst('alert-triangle', view, 'color/icon/strong', 14); gm.name = 'Error marker'; gm.layoutPositioning = 'ABSOLUTE'; gm.x = 6; gm.y = y0 + 3;
    if (e.lens) { const l = inst('Explain Lens', null, area, { name: 'Explain lens', abs: true }); l.x = 8 + e.lineLen * 7.8 + 16; l.y = y0 - 1; }
  }
  return view;
}
// console lines: [ts, kind('rx'|'tx'|'sys'|'ok'|'err'), text]
function consoleView(parent, lines, o = {}) {
  const v = box({ name: o.name || 'Console', dir: 'V', gap: 2, pad: [10, 16, 10, 16], parent, fill: 'color/bg/console', clip: true, wSize: 'fill', hSize: 'fill' });
  for (const [ts, kind, text] of lines) {
    const r = box({ name: 'Line', dir: 'H', gap: 12, cross: 'start', parent: v, wSize: 'fill', fill: kind === 'err' ? 'color/bg/inverse' : undefined, pad: kind === 'err' ? [2, 6, 2, 6] : 0, radius: kind === 'err' ? 4 : undefined });
    if (ts) txt(ts, { style: 'Code/Small', color: kind === 'err' ? 'color/text/on-ink' : 'color/text/disabled', parent: r, name: 'Timestamp' });
    const col = { rx: 'color/syntax/plain', tx: 'color/text/primary', sys: 'color/text/tertiary', ok: 'color/text/primary', err: 'color/text/on-ink', warn: 'color/text/brand' }[kind] || 'color/syntax/plain';
    if (kind === 'tx') txt('→', { style: 'Code/Small', color: 'color/text/brand', parent: r, name: 'Direction' });
    const t = txt(text, { style: 'Code/Small', color: col, parent: r, name: 'Text', grow: true });
    if (kind === 'ok' || kind === 'err' || kind === 'tx') POST.push(() => { t.fontName = PICK(FONT_MONO, 'Bold'); });
    if (kind === 'err' && o.explain) { const b = box({ name: 'Explain error', dir: 'H', pad: [0, 8, 0, 8], h: 18, cross: 'center', radius: 4, fill: 'color/brand/default', parent: r }); txt('Explain', { style: 'Label/Small', color: 'color/text/on-bright', parent: b, name: 'Label' }); }
  }
  return v;
}
