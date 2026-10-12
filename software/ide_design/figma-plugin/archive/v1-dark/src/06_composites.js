// ============================================================================
// Composite components: Sidebar, Top Bar, Status Bar, Board Info, cards,
// Board Menu, dialogs + code editor / console renderers
// ============================================================================

const NAV = [
  ['WORKSPACE', [['Home', 'home'], ['Projects', 'folder'], ['Libraries', 'library'], ['Examples', 'lightbulb']]],
  ['HARDWARE', [['Board Setup', 'cpu'], ['Serial Monitor', 'terminal']]],
];

// ---------------------------------------------------------------- Project pill (sidebar)
function buildProjectPill(parent) {
  const comps = [];
  for (const state of ['Default', 'Active']) for (const collapsed of ['False', 'True']) {
    const c = comp('State=' + state + ', Collapsed=' + collapsed);
    const on = state === 'Active';
    if (collapsed === 'False') al(c, { gap: 10, pad: [8, 10, 8, 8], w: 192, cross: 'center', radius: 10, fill: on ? 'color/bg/selected' : 'color/bg/panel', stroke: on ? 'color/accent/muted' : 'color/border/subtle' });
    else al(c, { w: 40, h: 40, align: 'center', cross: 'center', radius: 10, fill: on ? 'color/bg/selected' : 'color/bg/panel', stroke: on ? 'color/accent/muted' : 'color/border/subtle' });
    if (collapsed === 'False') c.layoutSizingVertical = 'HUG';
    const tile = box({ name: 'Mode tile', dir: 'H', w: 28, h: 28, align: 'center', cross: 'center', radius: 6, fill: on ? 'color/accent/subtle' : 'color/bg/raised', parent: c });
    iconSlot(tile, 'blocks', on ? 'color/icon/active' : 'color/icon/default', 16, 'Mode icon');
    if (collapsed === 'False') {
      const col = box({ name: 'Text', dir: 'V', gap: 0, parent: c, grow: true });
      txt('OPEN PROJECT', { style: 'Caption/Overline', color: on ? 'color/accent/default' : 'color/text/tertiary', parent: col, name: 'Overline' });
      txt('Blink LED', { style: 'Label/Strong', parent: col, name: 'Project', truncate: true });
      iconSlot(c, 'chevron-right', 'color/icon/muted', 16, 'Chevron');
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Sidebar Project', parent, 4, 'Shortcut back to the open project. Active while the editor is showing.');
  propText(set, 'Project', 'Project', 'Blink LED');
  CMP['Sidebar Project'] = set;
}

// ---------------------------------------------------------------- Sidebar
function buildSidebar(parent) {
  const comps = [];
  for (const collapsed of ['False', 'True']) {
    const exp = collapsed === 'False';
    const c = comp('Collapsed=' + collapsed);
    al(c, { dir: 'V', gap: 4, pad: [12, 12, 12, 12], w: exp ? 216 : 64, h: 916, cross: exp ? 'start' : 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 1;
    inst('Sidebar Project', { State: 'Default', Collapsed: collapsed }, c, { name: 'Open project' });
    for (const [group, items] of NAV) {
      spacer(c, 12);
      if (exp) { const g = box({ name: 'Group ' + group, dir: 'H', pad: [0, 12, 4, 12], parent: c }); txt(group, { style: 'Caption/Overline', color: 'color/text/tertiary', parent: g, name: 'Group label' }); }
      else divider(c, 'H', 24, 'color/border/subtle');
      for (const [label, ic] of items) {
        const n = inst('Nav Item', { State: 'Default', Collapsed: collapsed }, c, { name: 'Nav/' + label });
        if (exp) setProp(n, 'Label', label);
        setProp(n, 'Icon', ICON[ic].id);
        if (label === 'Serial Monitor' && exp) setProp(n, 'Show indicator', true);
      }
    }
    spacer(c, 1, true);
    const s = inst('Nav Item', { State: 'Default', Collapsed: collapsed }, c, { name: 'Nav/Settings' });
    if (exp) setProp(s, 'Label', 'Settings');
    setProp(s, 'Icon', ICON['settings'].id);
    divider(c, 'H', exp ? 192 : 40, 'color/border/subtle');
    const foot = box({ name: 'Footer', dir: exp ? 'H' : 'V', gap: 8, pad: [8, 4, 0, 8], cross: 'center', parent: c });
    if (exp) foot.layoutSizingHorizontal = 'FILL';
    if (exp) {
      const tag = box({ name: 'Tagline', dir: 'V', gap: 2, parent: foot, grow: true });
      const t = txt('Build. Code. Create.', { style: 'Label/Strong', color: 'color/text/primary', parent: tag, name: 'Tagline text' });
      t.setRangeFills(0, 6, [paint('color/brand/default')]);
      txt('RoboCore IDE · v0.1', { style: 'Caption/Default', color: 'color/text/tertiary', parent: tag, name: 'Version' });
    }
    const cb = inst('Icon Button', { Variant: 'Ghost', State: 'Default' }, foot, { name: 'Collapse sidebar' });
    setProp(cb, 'Icon', ICON[exp ? 'panel-left' : 'panel-right'].id);
    comps.push(c);
  }
  const set = makeSet(comps, 'Sidebar', parent, 2, 'Primary navigation. Expanded 216px / collapsed 64px (icons + tooltips). Collapse with the footer button or ⌘B; the editor reclaims the space.');
  CMP['Sidebar'] = set;
}
function setNavActive(sidebar, label) {
  const n = sidebar.findOne(x => x.type === 'INSTANCE' && x.name === 'Nav/' + label);
  if (n) { try { n.setProperties({ State: 'Active' }); } catch (e) { warn('nav active ' + label + ': ' + e.message); } }
  else warn('nav item not found: ' + label);
}
function setProjectPill(sidebar, state, name) {
  const p = sidebar.findOne(x => x.type === 'INSTANCE' && x.name === 'Open project');
  if (!p) return;
  try { p.setProperties({ State: state }); } catch (e) { warn('pill ' + e.message); }
  if (name) setText(p, 'Project', name);
}

// ---------------------------------------------------------------- Top bar
function buildTopBar(parent) {
  const comps = [];
  for (const ctx of ['Editor', 'Browse']) {
    const c = comp('Context=' + ctx);
    al(c, { gap: 12, pad: [0, 16, 0, 16], w: 1440, h: 56, cross: 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1;
    const logo = CMP['Logo/Product Lockup'].createInstance(); logo.name = 'Logo'; c.appendChild(logo);
    divider(c, 'V', 24);
    if (ctx === 'Editor') {
      const ps = box({ name: 'Project switcher', dir: 'H', gap: 8, pad: [0, 8, 0, 8], h: 32, cross: 'center', radius: 8, parent: c });
      iconSlot(ps, 'blocks', 'color/icon/active', 16, 'Project mode icon');
      txt('Blink LED', { style: 'Label/Strong', parent: ps, name: 'Project name' });
      iconSlot(ps, 'chevron-down', 'color/icon/muted', 16, 'Project menu chevron');
      const sv = box({ name: 'Save state', dir: 'H', gap: 4, cross: 'center', parent: c });
      iconSlot(sv, 'check', 'color/icon/muted', 14, 'Save icon');
      txt('Saved', { style: 'Caption/Default', color: 'color/text/tertiary', parent: sv, name: 'Save label' });
    } else {
      inst('Search Field', null, c, { name: 'Search' });
    }
    spacer(c, 1, true);
    inst('Board Selector', { Status: 'Connected', State: 'Default' }, c, { name: 'Board selector' });
    divider(c, 'V', 24);
    if (ctx === 'Editor') {
      const acts = box({ name: 'Build actions', dir: 'H', gap: 8, cross: 'center', parent: c });
      inst('Toolbar Action', { Action: 'Verify', State: 'Default' }, acts, { name: 'Verify' });
      inst('Toolbar Action', { Action: 'Upload', State: 'Default' }, acts, { name: 'Upload' });
      inst('Toolbar Action', { Action: 'Stop', State: 'Disabled' }, acts, { name: 'Stop' });
    } else {
      const b = inst('Button', { Variant: 'Primary', State: 'Default' }, c, { name: 'New project' });
      setProp(b, 'Label', 'New project');
      setProp(b, 'Icon', ICON['plus'].id);
    }
    divider(c, 'V', 24);
    const util = box({ name: 'Utilities', dir: 'H', gap: 4, cross: 'center', parent: c });
    for (const [n, ic] of [['Theme', 'sun'], ['Help', 'help-circle'], ['Settings', 'settings']]) { const b = inst('Icon Button', { Variant: 'Ghost', State: 'Default' }, util, { name: n }); setProp(b, 'Icon', ICON[ic].id); }
    inst('Avatar', null, c, { name: 'Account' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Top Bar', parent, 1, 'Global header, 56px. Editor context: project switcher + save state, board selector, Verify / Upload / Stop. Browse context (Home, Projects…): search + New project.');
  CMP['Top Bar'] = set;
}

// ---------------------------------------------------------------- Status bar
function buildStatusBar(parent) {
  const c = comp('Status Bar', 'Bottom status line, 28px: operation state, editor info, board + port + baud. Text must describe the real state (Ready, Compiling…, Upload failed).');
  al(c, { gap: 16, pad: [0, 12, 0, 12], w: 1440, h: 28, cross: 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
  c.strokeTopWeight = 1; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 0;
  const st = box({ name: 'State', dir: 'H', gap: 6, cross: 'center', parent: c });
  dot(st, 'color/status/success', 8, 'Status dot');
  txt('Ready', { style: 'Label/Small', color: 'color/text/secondary', parent: st, name: 'Status' });
  txt('Blocks · 7 blocks · auto-saved 14:02', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Detail' });
  spacer(c, 1, true);
  const bd = box({ name: 'Board info', dir: 'H', gap: 6, cross: 'center', parent: c });
  iconSlot(bd, 'usb', 'color/icon/muted', 14, 'Port icon');
  txt('RoboCore V2 on /dev/cu.usbmodem1101 · 115200 baud', { style: 'Caption/Default', color: 'color/text/tertiary', parent: bd, name: 'Board' });
  txt('Ln 12, Col 5', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Cursor' });
  txt('UTF-8', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Encoding' });
  iconSlot(c, 'bell', 'color/icon/muted', 14, 'Notifications');
  CMP['Status Bar'] = c;
  parent.appendChild(c);
}
function setStatus(bar, o) {
  if (o.status) setText(bar, 'Status', o.status);
  if (o.detail !== undefined) setText(bar, 'Detail', o.detail);
  if (o.board) setText(bar, 'Board', o.board);
  if (o.cursor !== undefined) { const t = bar.findOne(n => n.name === 'Cursor'); if (t) { if (o.cursor) setText(bar, 'Cursor', o.cursor); else t.visible = false; } }
  if (o.dot) { const d = bar.findOne(n => n.name === 'Status dot'); if (d) refill(d, o.dot); }
}

// ---------------------------------------------------------------- Board info card
function buildBoardInfo(parent) {
  const comps = [];
  for (const status of ['Connected', 'Disconnected']) {
    const on = status === 'Connected';
    const c = comp('Status=' + status);
    al(c, { dir: 'V', gap: 0, w: 296, cross: 'start', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    c.layoutSizingVertical = 'HUG';
    const hd = box({ name: 'Header', dir: 'H', gap: 8, pad: [0, 12, 0, 14], h: 44, cross: 'center', parent: c, wSize: 'fill' });
    iconSlot(hd, 'cpu', 'color/icon/brand', 18, 'Board icon');
    txt('Board', { style: 'Heading/H3', parent: hd, name: 'Title', grow: true });
    inst('Connection Status', { Status: status }, hd, { name: 'Connection' });
    divider(c, 'H', 296);
    const rows = box({ name: 'Rows', dir: 'V', gap: 6, pad: [10, 14, 10, 14], parent: c, wSize: 'fill' });
    const data = on
      ? [['Board', 'RoboCore V2 (rev 2.0)', 'profile'], ['MCU', 'ESP32-S3 · 240 MHz dual-core', 'profile'], ['Memory', '8 MB flash · 2 MB PSRAM', 'profile'], ['Port', '/dev/cu.usbmodem1101', 'live'], ['Chip', 'ESP32-S3 rev v0.2', 'live']]
      : [['Board', 'RoboCore V2 (rev 2.0)', 'profile'], ['MCU', 'ESP32-S3 · 240 MHz dual-core', 'profile'], ['Memory', '8 MB flash · 2 MB PSRAM', 'profile'], ['Port', 'No port selected', 'none'], ['Chip', 'Connect to detect', 'none']];
    for (const [k, v, src] of data) {
      const r = box({ name: 'Row ' + k, dir: 'H', gap: 8, cross: 'center', parent: rows, wSize: 'fill' });
      txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 64 });
      txt(v, { style: src === 'live' ? 'Code/Small' : 'Body/Small', color: src === 'none' ? 'color/text/tertiary' : 'color/text/primary', parent: r, name: 'Value ' + k, grow: true, truncate: true });
      if (src === 'live') { const lv = box({ name: 'Live tag', dir: 'H', pad: [0, 6, 0, 6], h: 18, cross: 'center', radius: 999, fill: 'color/accent/subtle', parent: r }); txt('LIVE', { style: 'Caption/Overline', color: 'color/accent/default', parent: lv, name: 'Live' }); }
    }
    divider(c, 'H', 296);
    const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [8, 14, 10, 14], cross: 'center', parent: c, wSize: 'fill' });
    if (on) {
      txt('LIVE = read from the device', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ft, name: 'Legend', grow: true });
      txt('Board setup →', { style: 'Label/Default', color: 'color/text/link', parent: ft, name: 'Link' });
    } else {
      const b = inst('Button', { Variant: 'Secondary', State: 'Default' }, ft, { name: 'Connect' });
      setProp(b, 'Label', 'Connect board'); setProp(b, 'Icon', ICON['plug'].id);
      b.layoutSizingHorizontal = 'FILL';
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Board Info Card', parent, 2, 'Compact hardware summary. Profile values come from the board definition; LIVE values are read from the connected device. Never show live values when disconnected.');
  CMP['Board Info Card'] = set;
}

// ---------------------------------------------------------------- thumbnails
function blocksThumb(parent, w, h) {
  const t = box({ name: 'Thumbnail', w, h, fill: 'color/bg/canvas', parent, clip: true });
  const g = gridVector(w, h, 16); t.appendChild(g);
  const stacks = [[['control', 70], ['communication', 88], ['output', 100]], [['control', 64], ['output', 96], ['control', 60], ['output', 92]]];
  let x = 18;
  stacks.forEach((stack, si) => {
    let y = 42 + si * 6;
    stack.forEach(([cat, bw], i) => {
      const r = rect({ name: 'Mini block', w: bw * (w / 268), h: i === 0 ? 14 : 11, radius: i === 0 ? [7, 7, 3, 3] : 3, fill: 'color/block/' + cat, parent: t });
      r.x = x + (i === 0 ? 0 : 8); r.y = y; y += (i === 0 ? 17 : 14);
    });
    x += 122 * (w / 268);
  });
  return t;
}
function codeThumb(parent, w, h) {
  const t = box({ name: 'Thumbnail', w, h, fill: 'color/bg/editor', parent, clip: true });
  const lines = [['color/syntax/comment', 120], ['color/syntax/preprocessor', 90], [null, 0], ['color/syntax/type', 40, 'color/syntax/function', 46], ['color/syntax/function', 60, 'color/syntax/constant', 70], ['color/syntax/function', 70, 'color/syntax/number', 24], ['color/syntax/plain', 12]];
  lines.forEach((ln, i) => {
    let x = 16 + (i > 3 && i < 6 ? 14 : 0);
    for (let k = 0; k < ln.length; k += 2) {
      if (!ln[k]) continue;
      const r = rect({ name: 'Code line', w: ln[k + 1] * (w / 268), h: 5, radius: 2.5, fill: ln[k], parent: t, opacity: 0.85 });
      r.x = x; r.y = 42 + i * 10; x += ln[k + 1] * (w / 268) + 6;
    }
  });
  return t;
}
// Blockly-style grid of small crosses as one vector
function gridVector(w, h, step = 24, op = 0.07) {
  const parts = [];
  for (let x = step; x < w; x += step) for (let y = step; y < h; y += step) parts.push('M ' + (x - 2) + ' ' + y + ' L ' + (x + 2) + ' ' + y + ' M ' + x + ' ' + (y - 2) + ' L ' + x + ' ' + (y + 2));
  const v = figma.createVector();
  v.name = 'Grid';
  v.vectorPaths = [{ windingRule: 'NONZERO', data: parts.join(' ') || 'M 0 0 L 1 0' }];
  v.strokes = [solid('#A7B1C2', op * 3)];
  v.strokeWeight = 1;
  v.fills = [];
  v.locked = true;
  return v;
}

// ---------------------------------------------------------------- Project card
function buildProjectCard(parent) {
  const comps = [];
  for (const mode of ['Blocks', 'Code']) for (const state of ['Default', 'Hover']) {
    const c = comp('Mode=' + mode + ', State=' + state);
    al(c, { dir: 'V', gap: 0, w: 268, cross: 'start', radius: 12, fill: state === 'Hover' ? 'color/bg/raised' : 'color/bg/panel', stroke: state === 'Hover' ? 'color/border/strong' : 'color/border/subtle' });
    c.layoutSizingVertical = 'HUG'; c.clipsContent = true;
    if (state === 'Hover') LINKS.push([c, 'effect', 'Elevation/1 Raised']);
    const th = mode === 'Blocks' ? blocksThumb(c, 268, 120) : codeThumb(c, 268, 120);
    th.layoutSizingHorizontal = 'FILL';
    const mb = box({ name: 'Mode badge', dir: 'H', gap: 4, pad: [0, 8, 0, 6], h: 22, cross: 'center', radius: 999, fill: 'color/bg/chrome', parent: th, abs: true });
    mb.x = 10; mb.y = 10;
    iconSlot(mb, mode === 'Blocks' ? 'blocks' : 'code', mode === 'Blocks' ? 'color/icon/active' : 'color/icon/brand', 14, 'Mode icon');
    txt(mode, { style: 'Label/Small', color: 'color/text/secondary', parent: mb, name: 'Mode' });
    const body = box({ name: 'Body', dir: 'V', gap: 6, pad: [12, 14, 14, 14], parent: c, wSize: 'fill' });
    const tr = box({ name: 'Title row', dir: 'H', gap: 8, cross: 'center', parent: body, wSize: 'fill' });
    txt(mode === 'Blocks' ? 'Blink LED' : 'Obstacle avoider', { style: 'Heading/H3', parent: tr, name: 'Name', grow: true, truncate: true });
    iconSlot(tr, 'more', 'color/icon/muted', 16, 'More');
    txt(mode === 'Blocks' ? 'Turn the built-in LED on and off every second.' : 'Drive forward and turn away when the sonar sees a wall.', { style: 'Body/Small', color: 'color/text/secondary', parent: body, name: 'Description', fill: true, truncate: true, maxLines: 2 });
    const meta = box({ name: 'Meta', dir: 'H', gap: 8, pad: [6, 0, 0, 0], cross: 'center', parent: body, wSize: 'fill' });
    const b = inst('Badge', { Tone: 'Neutral' }, meta, { name: 'Board badge' }); setProp(b, 'Label', 'RoboCore V2'); setProp(b, 'Show dot', false);
    spacer(meta, 1, true);
    txt('Edited 2h ago', { style: 'Caption/Default', color: 'color/text/tertiary', parent: meta, name: 'Edited' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Project Card', parent, 4, 'Project tile for Home and Projects. Thumbnail previews the mode (blocks or code). Whole card is the click target; ⋯ opens rename / duplicate / delete.');
  CMP['Project Card'] = set;
}

// ---------------------------------------------------------------- Example card (variant per block category colour)
function buildExampleCard(parent) {
  const comps = [];
  for (const [cat, col, ic] of BLOCK_CATS) {
    const c = comp('Category=' + cat);
    al(c, { dir: 'V', gap: 0, w: 268, cross: 'start', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    c.layoutSizingVertical = 'HUG'; c.clipsContent = true;
    const th = box({ name: 'Cover', dir: 'H', gap: 0, pad: 16, h: 96, cross: 'end', align: 'between', fill: col + '-subtle', parent: c, wSize: 'fill' });
    const tile = box({ name: 'Icon tile', dir: 'H', w: 44, h: 44, align: 'center', cross: 'center', radius: 10, fill: col, parent: th });
    iconSlot(tile, ic, 'color/icon/strong', 22, 'Cover icon');
    const lv = inst('Badge', { Tone: 'Success' }, th, { name: 'Level' }); setText(lv, 'Label', 'Beginner');
    const body = box({ name: 'Body', dir: 'V', gap: 6, pad: [12, 14, 14, 14], parent: c, wSize: 'fill' });
    txt('Blink an LED', { style: 'Heading/H3', parent: body, name: 'Title', fill: true, truncate: true });
    txt('Your first program: switch the built-in LED on and off with a delay.', { style: 'Body/Small', color: 'color/text/secondary', parent: body, name: 'Description', fill: true, truncate: true, maxLines: 2 });
    const meta = box({ name: 'Meta', dir: 'H', gap: 6, pad: [6, 0, 0, 0], cross: 'center', parent: body, wSize: 'fill' });
    for (const [m, mic] of [['Blocks', 'blocks'], ['Code', 'code']]) {
      const t = box({ name: 'Mode ' + m, dir: 'H', gap: 4, cross: 'center', parent: meta });
      iconSlot(t, mic, 'color/icon/muted', 14, 'Icon');
      txt(m, { style: 'Caption/Default', color: 'color/text/tertiary', parent: t, name: 'Mode ' + m + ' label' });
    }
    spacer(meta, 1, true);
    txt('V2 · Uno · ESP32', { style: 'Caption/Default', color: 'color/text/tertiary', parent: meta, name: 'Boards' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Example Card', parent, 4, 'Example/tutorial tile, one colour variant per block category. Level badge, supported modes, compatible boards. "Open" creates a copy in Projects.');
  CMP['Example Card'] = set;
}
const catOf = (colorVar) => (BLOCK_CATS.find(c => c[1] === colorVar) || BLOCK_CATS[0])[0];
function exampleCard(parent, o) {
  const i = inst('Example Card', { Category: catOf(o.color) }, parent, { text: { Title: o.title, Description: o.desc, Boards: o.boards || 'V2 · Uno · ESP32' } });
  const ic = i.findOne(n => n.name === 'Cover icon' && n.type === 'INSTANCE');
  if (ic && o.icon) { try { ic.swapComponent(ICON[o.icon]); } catch (e) { warn(e.message); } tint(ic, 'color/icon/strong'); }
  const lv = i.findOne(n => n.name === 'Level' && n.type === 'INSTANCE');
  if (lv) { try { lv.setProperties({ Tone: o.level === 'Advanced' ? 'Warning' : (o.level === 'Intermediate' ? 'Info' : 'Success') }); } catch (e) { warn(e.message); } setText(lv, 'Label', o.level); }
  return i;
}

// ---------------------------------------------------------------- Template tile + quick action (colour variants)
function buildTiles(parent) {
  const tc = [];
  for (const [cat, col, ic] of BLOCK_CATS) {
    const t = comp('Category=' + cat);
    al(t, { gap: 12, pad: [12, 14, 12, 12], w: 240, cross: 'center', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    t.layoutSizingVertical = 'HUG';
    const tile = box({ name: 'Icon tile', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 10, fill: col + '-subtle', parent: t });
    iconSlot(tile, ic, col, 20, 'Icon');
    const colm = box({ name: 'Text', dir: 'V', gap: 2, parent: t, grow: true });
    txt('Line follower', { style: 'Label/Strong', parent: colm, name: 'Title', truncate: true });
    txt('Follow a black line with 3 IR sensors', { style: 'Caption/Default', color: 'color/text/tertiary', parent: colm, name: 'Description', fill: true, truncate: true });
    tc.push(t);
  }
  const tset = makeSet(tc, 'Template Tile', parent, 4, 'Starter template on Home. Creates a new project pre-filled with blocks. Colour follows the main block category of the template.');
  CMP['Template Tile'] = tset;

  const TONES = { Accent: ['color/accent/subtle', 'color/icon/active', 'blocks'], Brand: ['color/brand/subtle', 'color/icon/brand', 'code'], Neutral: ['color/bg/raised', 'color/icon/default', 'folder-open'] };
  const qc = [];
  for (const [tone, [bg, icc, ic]] of Object.entries(TONES)) {
    const q = comp('Tone=' + tone);
    al(q, { dir: 'V', gap: 12, pad: 16, w: 232, cross: 'start', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    q.layoutSizingVertical = 'HUG';
    const qt = box({ name: 'Icon tile', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 10, fill: bg, parent: q });
    iconSlot(qt, ic, icc, 20, 'Icon');
    const qcol = box({ name: 'Text', dir: 'V', gap: 2, parent: q, wSize: 'fill' });
    txt('New blocks project', { style: 'Heading/H3', parent: qcol, name: 'Title' });
    txt('Drag-and-drop programming for beginners', { style: 'Body/Small', color: 'color/text/secondary', parent: qcol, name: 'Description', fill: true });
    qc.push(q);
  }
  const qset = makeSet(qc, 'Quick Action', parent, 3, 'Large entry point on Home. Accent = primary path (blocks), Brand = code, Neutral = utilities.');
  CMP['Quick Action'] = qset;
}
// o: { title, desc, icon, color (template category var) | tone (quick action), iconColor }
function tileInst(key, parent, o) {
  const props = key === 'Quick Action' ? { Tone: o.tone || 'Neutral' } : { Category: catOf(o.color) };
  const i = inst(key, props, parent, { text: { Title: o.title, Description: o.desc } });
  if (o.icon) {
    const ic = i.findOne(n => n.name === 'Icon' && n.type === 'INSTANCE');
    if (ic) { try { ic.swapComponent(ICON[o.icon]); } catch (e) { warn(e.message); } }
    const col = key === 'Quick Action' ? { Accent: 'color/icon/active', Brand: 'color/icon/brand', Neutral: 'color/icon/default' }[o.tone || 'Neutral'] : o.color;
    if (ic) tint(ic, col);
  }
  return i;
}

// ---------------------------------------------------------------- Dialogs
function dialogShell(name, title, desc, o = {}) {
  const c = comp(name, o.descr);
  al(c, { dir: 'V', gap: 0, w: o.w || 480, cross: 'start', radius: 16, fill: 'color/bg/panel', stroke: 'color/border/default', effect: 'Elevation/3 Modal' });
  c.layoutSizingVertical = 'HUG';
  const hd = box({ name: 'Header', dir: 'H', gap: 12, pad: [20, 16, 4, 24], cross: 'start', parent: c, wSize: 'fill' });
  if (o.danger) { const ic = box({ name: 'Danger icon', dir: 'H', w: 36, h: 36, align: 'center', cross: 'center', radius: 999, fill: 'color/status/error-subtle', parent: hd }); iconSlot(ic, 'alert-triangle', 'color/status/error', 18, 'Icon'); }
  const tc = box({ name: 'Titles', dir: 'V', gap: 6, parent: hd, grow: true });
  tc.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Heading/H2', parent: tc, name: 'Title', fill: true });
  if (desc) txt(desc, { style: 'Body/Small', color: 'color/text/secondary', parent: tc, name: 'Description', fill: true });
  const x = inst('Icon Button', { Variant: 'Ghost', State: 'Default' }, hd, { name: 'Close' }); setProp(x, 'Icon', ICON['x'].id);
  const body = box({ name: 'Body', dir: 'V', gap: 16, pad: [16, 24, 24, 24], parent: c, wSize: 'fill' });
  const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [14, 24, 16, 24], cross: 'center', align: 'end', parent: c, wSize: 'fill', fill: 'color/bg/chrome', stroke: 'color/border/subtle', sides: { t: 1 } });
  return { c, body, ft };
}
function footerButtons(ft, buttons) {
  for (const [variant, label, icon, grow] of buttons) {
    if (variant === 'spacer') { spacer(ft, 1, true); continue; }
    const b = inst('Button', { Variant: variant, State: 'Default' }, ft, { name: label });
    setProp(b, 'Label', label);
    if (icon) setProp(b, 'Icon', ICON[icon].id); else setProp(b, 'Show icon', false);
  }
}
function field(parent, label, value, o = {}) {
  const i = inst('Input Field', { State: o.state || 'Default' }, parent, { name: 'Field ' + label });
  setProp(i, 'Label', label); setProp(i, 'Value', value);
  if (o.helper) setProp(i, 'Helper', o.helper); else setProp(i, 'Show helper', false);
  i.layoutSizingHorizontal = 'FILL';
  if (value && o.state !== 'Error') { const v = i.findOne(n => n.name === 'Value'); if (v) v.fills = [paint('color/text/primary')]; }
  return i;
}
function labeledSelect(parent, label, value, o = {}) {
  const w = box({ name: 'Select ' + label, dir: 'V', gap: 6, parent, wSize: o.fill === false ? undefined : 'fill' });
  txt(label, { style: 'Label/Default', color: 'color/text/secondary', parent: w, name: 'Label' });
  const s = inst('Select', { State: o.state || 'Default' }, w, { name: 'Select' });
  setProp(s, 'Value', value);
  s.layoutSizingHorizontal = 'FILL';
  s.resize(s.width, 36); s.layoutSizingHorizontal = 'FILL';
  return w;
}
function choiceCard(parent, title, desc, icon, selected) {
  const c = box({ name: 'Choice ' + title, dir: 'H', gap: 12, pad: 14, cross: 'start', radius: 12, fill: selected ? 'color/bg/selected' : 'color/bg/input', stroke: selected ? 'color/border/focus' : 'color/border/default', parent, grow: true });
  c.layoutSizingHorizontal = 'FILL';
  const t = box({ name: 'Icon tile', dir: 'H', w: 36, h: 36, align: 'center', cross: 'center', radius: 8, fill: selected ? 'color/accent/subtle' : 'color/bg/raised', parent: c });
  iconSlot(t, icon, selected ? 'color/icon/active' : 'color/icon/default', 18, 'Icon');
  const col = box({ name: 'Text', dir: 'V', gap: 2, parent: c, grow: true });
  col.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Label/Strong', parent: col, name: 'Title' });
  txt(desc, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true });
  inst('Radio', { Selected: selected ? 'True' : 'False' }, c, { name: 'Radio' });
  return c;
}
function settingRow(parent, title, desc, control) {
  const r = box({ name: 'Setting ' + title, dir: 'H', gap: 16, pad: [12, 0, 12, 0], cross: 'center', parent, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  const col = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true });
  col.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Body/Medium', parent: col, name: 'Title' });
  if (desc) txt(desc, { style: 'Body/Small', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true });
  control(r);
  return r;
}

function buildDialogs(parent) {
  // New project
  {
    const { c, body, ft } = dialogShell('Dialog/New Project', 'New project', 'Choose how you want to program. You can switch modes later.', { w: 520, descr: 'Create-project dialog: name, programming mode, board, template.' });
    field(body, 'Project name', 'Obstacle avoider');
    txt('Start with', { style: 'Label/Default', color: 'color/text/secondary', parent: body, name: 'Mode label' });
    const ch = box({ name: 'Mode choice', dir: 'H', gap: 12, parent: body, wSize: 'fill' });
    choiceCard(ch, 'Blocks', 'Drag-and-drop. Generates C++ you can read.', 'blocks', true);
    choiceCard(ch, 'Code', 'Arduino C++ with autocomplete.', 'code', false);
    const row = box({ name: 'Selects', dir: 'H', gap: 12, parent: body, wSize: 'fill' });
    labeledSelect(row, 'Board', 'RoboCore V2 (ESP32-S3)');
    labeledSelect(row, 'Template', 'Empty project');
    footerButtons(ft, [['Ghost', 'Cancel'], ['Primary', 'Create project', 'plus']]);
    CMP['Dialog/New Project'] = c; parent.appendChild(c);
  }
  // Clear workspace
  {
    const { c, body, ft } = dialogShell('Dialog/Clear Workspace', 'Clear the workspace?', 'This removes all 7 blocks from “Blink LED”. You can undo this with ⌘Z until you close the project.', { danger: true, w: 440, descr: 'Destructive confirmation before clearing blocks.' });
    body.paddingTop = 0; body.paddingBottom = 8;
    footerButtons(ft, [['Ghost', 'Cancel'], ['Danger', 'Clear workspace', 'trash']]);
    CMP['Dialog/Clear Workspace'] = c; parent.appendChild(c);
  }
  // Project settings
  {
    const { c, body, ft } = dialogShell('Dialog/Project Settings', 'Project settings', 'Blink LED · created 10 Oct 2026', { w: 560, descr: 'Opened from the project switcher in the top bar.' });
    field(body, 'Name', 'Blink LED');
    field(body, 'Description', 'Turn the built-in LED on and off every second.', { helper: 'Shown on the project card.' });
    const row = box({ name: 'Selects', dir: 'H', gap: 12, parent: body, wSize: 'fill' });
    labeledSelect(row, 'Board', 'RoboCore V2 (ESP32-S3)');
    labeledSelect(row, 'Default mode', 'Blocks');
    settingRow(body, 'Auto-save', 'Save changes every 30 seconds and before upload.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
    settingRow(body, 'Show generated code', 'Keep the read-only C++ preview open in Blocks mode.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
    footerButtons(ft, [['Ghost', 'Delete project', 'trash'], ['spacer'], ['Secondary', 'Cancel'], ['Primary', 'Save changes', 'check']]);
    const del = ft.findOne(n => n.name === 'Delete project'); if (del) { const l = del.findOne(n => n.name === 'Label'); if (l) l.fills = [paint('color/status/error')]; tint(del, 'color/status/error'); }
    CMP['Dialog/Project Settings'] = c; parent.appendChild(c);
  }
  // Connect board (Web Serial)
  {
    const { c, body, ft } = dialogShell('Dialog/Connect Board', 'Connect your board', 'Plug RoboCore V2 in with a USB-C data cable, then choose its port. Your browser will ask for permission to use the serial port.', { w: 520, descr: 'Port picker. Real ports only — the list comes from the browser/agent; demo devices are labelled.' });
    const list = box({ name: 'Ports', dir: 'V', gap: 2, pad: 6, radius: 10, fill: 'color/bg/input', stroke: 'color/border/default', parent: body, wSize: 'fill' });
    const ports = [['/dev/cu.usbmodem1101', 'RoboCore V2 · ESP32-S3 native USB', 'Selected'], ['/dev/cu.usbserial-110', 'USB-serial (CH340) · unknown board', 'Default'], ['/dev/cu.Bluetooth-Incoming-Port', 'Bluetooth · not a board', 'Disabled']];
    for (const [p, d, st] of ports) {
      const r = box({ name: 'Port ' + p, dir: 'H', gap: 10, pad: [8, 10, 8, 10], cross: 'center', radius: 8, fill: st === 'Selected' ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
      iconSlot(r, st === 'Disabled' ? 'unplug' : 'usb', st === 'Selected' ? 'color/icon/active' : (st === 'Disabled' ? 'color/icon/disabled' : 'color/icon/default'), 18, 'Icon');
      const col = box({ name: 'Text', dir: 'V', gap: 0, parent: r, grow: true }); col.layoutSizingHorizontal = 'FILL';
      txt(p, { style: 'Code/Small', color: st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', parent: col, name: 'Port' });
      txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Detail' });
      if (st === 'Selected') iconSlot(r, 'check', 'color/icon/active', 16, 'Check');
    }
    const note = box({ name: 'Note', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'start', radius: 8, fill: 'color/status/info-subtle', parent: body, wSize: 'fill' });
    iconSlot(note, 'info', 'color/status/info', 16, 'Info');
    txt('Web Serial works in Chrome and Edge. In other browsers, install the RoboCore Agent to upload.', { style: 'Body/Small', color: 'color/text/secondary', parent: note, name: 'Note text', grow: true, fill: true });
    footerButtons(ft, [['Ghost', 'Refresh ports', 'refresh'], ['spacer'], ['Secondary', 'Cancel'], ['Primary', 'Connect', 'plug']]);
    CMP['Dialog/Connect Board'] = c; parent.appendChild(c);
  }
}

// ---------------------------------------------------------------- Board menu (popover)
const BOARDS = [
  ['RoboCore V2', 'ESP32-S3-WROOM-1 · 8 MB flash · 2 MB PSRAM', 'Recommended'],
  ['Arduino Uno R3', 'ATmega328P · 32 KB flash · 2 KB SRAM', ''],
  ['ESP32 DevKit V1', 'ESP32-WROOM-32 · 4 MB flash · Wi-Fi + BT', ''],
  ['NodeMCU-32S', 'ESP32 · 4 MB flash · Wi-Fi + BT', ''],
];
function buildBoardMenu(parent) {
  const c = comp('Board Menu', 'Popover from the Board Selector: pick a board profile and a port. Profiles come from the central board registry.');
  al(c, { dir: 'V', gap: 0, w: 380, cross: 'start', radius: 12, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover' });
  c.layoutSizingVertical = 'HUG';
  const hd = box({ name: 'Header', dir: 'V', gap: 10, pad: [12, 12, 8, 12], parent: c, wSize: 'fill' });
  const s = inst('Search Field', null, hd, { name: 'Search' }); s.layoutSizingHorizontal = 'FILL'; setProp(s, 'Placeholder', 'Search boards…');
  const sk = s.findOne(n => n.name === 'Shortcut'); if (sk) sk.visible = false;
  const list = box({ name: 'Boards', dir: 'V', gap: 2, pad: [0, 6, 6, 6], parent: c, wSize: 'fill' });
  txt('BOARD PROFILES', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: box({ name: 'Label', dir: 'H', pad: [6, 8, 4, 8], parent: list }), name: 'Group' });
  BOARDS.forEach(([n, d, tag], i) => {
    const sel = i === 0;
    const r = box({ name: 'Board ' + n, dir: 'H', gap: 10, pad: [8, 10, 8, 8], cross: 'center', radius: 8, fill: sel ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
    const t = box({ name: 'Chip tile', dir: 'H', w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: 'color/bg/panel', parent: r });
    iconSlot(t, 'cpu', sel ? 'color/icon/brand' : 'color/icon/muted', 18, 'Icon');
    const col = box({ name: 'Text', dir: 'V', gap: 0, parent: r, grow: true }); col.layoutSizingHorizontal = 'FILL';
    const tr = box({ name: 'Title row', dir: 'H', gap: 6, cross: 'center', parent: col });
    txt(n, { style: 'Label/Strong', parent: tr, name: 'Name' });
    if (tag) { const b = inst('Badge', { Tone: 'Brand' }, tr, { name: 'Tag' }); setProp(b, 'Label', tag); setProp(b, 'Show dot', false); }
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Specs', truncate: true, fill: true });
    if (sel) iconSlot(r, 'check', 'color/icon/active', 16, 'Check');
  });
  divider(c, 'H', 380);
  const port = box({ name: 'Port', dir: 'V', gap: 6, pad: [10, 12, 12, 12], parent: c, wSize: 'fill' });
  const pr = box({ name: 'Port row', dir: 'H', gap: 8, cross: 'center', parent: port, wSize: 'fill' });
  txt('Port', { style: 'Label/Default', color: 'color/text/secondary', parent: pr, name: 'Label', grow: true });
  inst('Connection Status', { Status: 'Connected' }, pr, { name: 'Connection' });
  const sel = inst('Select', { State: 'Default' }, port, { name: 'Port select' }); setProp(sel, 'Value', '/dev/cu.usbmodem1101 — RoboCore V2'); sel.layoutSizingHorizontal = 'FILL';
  const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'center', parent: c, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
  const b1 = inst('Button', { Variant: 'Ghost', State: 'Default' }, ft, { name: 'Refresh' }); setProp(b1, 'Label', 'Refresh ports'); setProp(b1, 'Icon', ICON['refresh'].id);
  spacer(ft, 1, true);
  const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ft, { name: 'Board setup' }); setProp(b2, 'Label', 'Board setup…'); setProp(b2, 'Show icon', false);
  CMP['Board Menu'] = c;
  parent.appendChild(c);
}

// ---------------------------------------------------------------- Code editor / console renderers
const KW = new Set(['if', 'else', 'for', 'while', 'do', 'return', 'const', 'static', 'break', 'continue', 'switch', 'case', 'default', 'true', 'false']);
const TYPES = new Set(['void', 'int', 'long', 'unsigned', 'char', 'float', 'double', 'bool', 'boolean', 'byte', 'String', 'Serial', 'uint8_t', 'uint16_t', 'uint32_t']);
const CONSTS = new Set(['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'A0', 'A1']);
function highlight(t, code) {
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(#include\s*<[^>]+>|#\w+)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;
  let m;
  while ((m = re.exec(code))) {
    let v = null;
    if (m[1]) v = 'color/syntax/comment';
    else if (m[2]) v = 'color/syntax/string';
    else if (m[3]) v = 'color/syntax/preprocessor';
    else if (m[4]) v = 'color/syntax/number';
    else if (m[5]) {
      const w = m[5];
      if (KW.has(w)) v = 'color/syntax/keyword';
      else if (TYPES.has(w)) v = 'color/syntax/type';
      else if (CONSTS.has(w)) v = 'color/syntax/constant';
      else if (/^\s*\(/.test(code.slice(m.index + w.length))) v = 'color/syntax/function';
    }
    if (v) t.setRangeFills(m.index, m.index + m[0].length, [paint(v)]);
  }
}
// codeView(parent, code, { w, h, activeLine, startLine, error: {line, from, len}, readOnly })
function codeView(parent, code, o = {}) {
  const lines = code.split('\n');
  const view = box({ name: o.name || 'Code view', dir: 'H', gap: 0, parent, fill: 'color/bg/editor', clip: true, w: o.w, h: o.h, wSize: o.wSize, hSize: o.hSize, grow: o.grow });
  if (o.wSize === 'fill' && view.parent && isAL(view.parent)) view.layoutSizingHorizontal = 'FILL';
  const gut = box({ name: 'Gutter', dir: 'V', gap: 0, pad: [12, 12, 12, 8], parent: view, hSize: 'fill', w: 52, cross: 'end' });
  const start = o.startLine || 1;
  const nums = lines.map((_, i) => String(start + i)).join('\n');
  const nt = txt(nums, { style: 'Code/Default', color: 'color/syntax/line-number', parent: gut, name: 'Line numbers', align: 'RIGHT' });
  if (o.activeLine) {
    const idx = nums.split('\n').slice(0, o.activeLine - start).join('\n').length + (o.activeLine > start ? 1 : 0);
    nt.setRangeFills(idx, idx + String(o.activeLine).length, [paint('color/syntax/line-number-active')]);
  }
  const area = box({ name: 'Text area', dir: 'V', gap: 0, pad: [12, 16, 12, 8], parent: view, grow: true, hSize: 'fill' });
  area.layoutSizingHorizontal = 'FILL';
  if (o.activeLine) {
    const hl = rect({ name: 'Current line', w: 2000, h: 20, fill: 'color/bg/hover', parent: area, abs: true, x: 0, y: 12 + (o.activeLine - start) * 20, opacity: 0.6 });
  }
  const t = txt(code, { style: 'Code/Default', color: 'color/syntax/plain', parent: area, name: 'Code' });
  highlight(t, code);
  if (o.cursor) { const cur = rect({ name: 'Caret', w: 2, h: 18, fill: 'color/accent/default', parent: area, abs: true, x: 8 + o.cursor.col * 7.8, y: 13 + (o.cursor.line - start) * 20 }); }
  if (o.error) {
    const e = o.error;
    const sq = rect({ name: 'Error squiggle', w: e.len * 7.8, h: 2, fill: 'color/status/error', parent: area, abs: true, x: 8 + e.col * 7.8, y: 12 + (e.line - start) * 20 + 18 });
  }
  // fold markers next to numbers for lines with "{"
  return view;
}
// console lines: [ts, kind('rx'|'tx'|'sys'|'ok'|'err'|'warn'), text]
function consoleView(parent, lines, o = {}) {
  const v = box({ name: o.name || 'Console', dir: 'V', gap: 2, pad: [10, 16, 10, 16], parent, fill: 'color/bg/console', clip: true, wSize: 'fill', hSize: 'fill' });
  for (const [ts, kind, text] of lines) {
    const r = box({ name: 'Line', dir: 'H', gap: 12, cross: 'start', parent: v, wSize: 'fill' });
    if (ts) txt(ts, { style: 'Code/Small', color: 'color/text/disabled', parent: r, name: 'Timestamp' });
    const col = { rx: 'color/syntax/plain', tx: 'color/accent/default', sys: 'color/text/tertiary', ok: 'color/status/success', err: 'color/status/error', warn: 'color/status/warning', info: 'color/status/info' }[kind] || 'color/syntax/plain';
    if (kind === 'tx') txt('→', { style: 'Code/Small', color: 'color/accent/default', parent: r, name: 'Direction' });
    const t = txt(text, { style: 'Code/Small', color: col, parent: r, name: 'Text', grow: true });
    t.textAutoResize = 'HEIGHT';
  }
  return v;
}
