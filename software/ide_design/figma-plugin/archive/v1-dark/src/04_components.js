// ============================================================================
// UI components — every component is auto-layout, token-bound, with variants
// ============================================================================

function rootsOf(owner) { return owner.type === 'COMPONENT_SET' ? owner.children : [owner]; }
function propText(owner, prop, nodeName, def) {
  const key = owner.addComponentProperty(prop, 'TEXT', def);
  for (const r of rootsOf(owner)) for (const t of r.findAll(n => n.type === 'TEXT' && n.name === nodeName)) t.componentPropertyReferences = Object.assign({}, t.componentPropertyReferences, { characters: key });
  return key;
}
function propBool(owner, prop, nodeName, def) {
  const key = owner.addComponentProperty(prop, 'BOOLEAN', def === undefined ? true : def);
  for (const r of rootsOf(owner)) for (const n of r.findAll(n => n.name === nodeName)) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { visible: key });
  return key;
}
function propSwap(owner, prop, nodeName, defIcon) {
  const key = owner.addComponentProperty(prop, 'INSTANCE_SWAP', ICON[defIcon].id);
  for (const r of rootsOf(owner)) for (const n of r.findAll(n => n.type === 'INSTANCE' && n.name === nodeName)) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { mainComponent: key });
  return key;
}
function iconSlot(parent, name, color, size, slotName = 'Icon') {
  const i = iconInst(name, parent, color, size);
  if (i) i.name = slotName;
  return i;
}

// ---------------------------------------------------------------- Button
const BTN = {
  Primary:   { Default: ['color/accent/default', null, 'color/text/on-accent', 'color/icon/on-accent'], Hover: ['color/accent/hover', null, 'color/text/on-accent', 'color/icon/on-accent'], Pressed: ['color/accent/pressed', null, 'color/text/on-accent', 'color/icon/on-accent'], Focus: ['color/accent/default', 'color/border/focus', 'color/text/on-accent', 'color/icon/on-accent'], Disabled: ['color/bg/raised', null, 'color/text/disabled', 'color/icon/disabled'] },
  Secondary: { Default: ['color/bg/raised', 'color/border/default', 'color/text/primary', 'color/icon/default'], Hover: ['color/bg/hover', 'color/border/strong', 'color/text/primary', 'color/icon/strong'], Pressed: ['color/bg/input', 'color/border/strong', 'color/text/primary', 'color/icon/strong'], Focus: ['color/bg/raised', 'color/border/focus', 'color/text/primary', 'color/icon/default'], Disabled: ['color/bg/panel', 'color/border/subtle', 'color/text/disabled', 'color/icon/disabled'] },
  Ghost:     { Default: [null, null, 'color/text/secondary', 'color/icon/default'], Hover: ['color/bg/hover', null, 'color/text/primary', 'color/icon/strong'], Pressed: ['color/bg/raised', null, 'color/text/primary', 'color/icon/strong'], Focus: [null, 'color/border/focus', 'color/text/primary', 'color/icon/default'], Disabled: [null, null, 'color/text/disabled', 'color/icon/disabled'] },
  Danger:    { Default: ['color/status/error-subtle', 'color/status/error', 'color/status/error', 'color/status/error'], Hover: ['color/status/error', null, 'color/text/on-accent', 'color/icon/on-accent'], Pressed: ['color/status/error', null, 'color/text/on-accent', 'color/icon/on-accent'], Focus: ['color/status/error-subtle', 'color/border/focus', 'color/status/error', 'color/status/error'], Disabled: ['color/bg/panel', 'color/border/subtle', 'color/text/disabled', 'color/icon/disabled'] },
};
function buildButton(parent) {
  const comps = [];
  for (const [variant, states] of Object.entries(BTN)) {
    for (const [state, [fill, stroke, text, icon]] of Object.entries(states)) {
      const c = comp('Variant=' + variant + ', State=' + state);
      al(c, { gap: 8, pad: [0, 14, 0, 12], h: 32, cross: 'center', radius: 8, fill: fill || undefined, stroke: stroke || undefined });
      c.layoutSizingHorizontal = 'HUG';
      if (state === 'Focus') LINKS.push([c, 'effect', 'Focus/Ring']);
      iconSlot(c, 'plus', icon, 16);
      txt('Button', { style: variant === 'Primary' ? 'Label/Strong' : 'Label/Default', color: text, parent: c, name: 'Label' });
      comps.push(c);
    }
  }
  const set = makeSet(comps, 'Button', parent, 5, 'Primary = teal call-to-action (one per view). Secondary = standard actions. Ghost = low-emphasis/toolbar. Danger = destructive. 32px high, 8px radius, 16px icon. Focus shows the teal focus ring.');
  propText(set, 'Label', 'Label', 'Button');
  propBool(set, 'Show icon', 'Icon', true);
  propSwap(set, 'Icon', 'Icon', 'plus');
  CMP['Button'] = set;
  return set;
}

// ---------------------------------------------------------------- Icon Button
function buildIconButton(parent) {
  const S = {
    Ghost:  { Default: [null, null, 'color/icon/default'], Hover: ['color/bg/hover', null, 'color/icon/strong'], Active: ['color/bg/selected', 'color/accent/muted', 'color/icon/active'], Disabled: [null, null, 'color/icon/disabled'] },
    Subtle: { Default: ['color/bg/raised', 'color/border/subtle', 'color/icon/default'], Hover: ['color/bg/hover', 'color/border/default', 'color/icon/strong'], Active: ['color/bg/selected', 'color/accent/muted', 'color/icon/active'], Disabled: ['color/bg/panel', 'color/border/subtle', 'color/icon/disabled'] },
    Accent: { Default: ['color/accent/default', null, 'color/icon/on-accent'], Hover: ['color/accent/hover', null, 'color/icon/on-accent'], Active: ['color/accent/pressed', null, 'color/icon/on-accent'], Disabled: ['color/bg/raised', null, 'color/icon/disabled'] },
  };
  const comps = [];
  for (const [variant, states] of Object.entries(S)) for (const [state, [fill, stroke, icon]] of Object.entries(states)) {
    const c = comp('Variant=' + variant + ', State=' + state);
    al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: fill || undefined, stroke: stroke || undefined });
    iconSlot(c, 'settings', icon, 18);
    comps.push(c);
  }
  const set = makeSet(comps, 'Icon Button', parent, 4, 'Square 32px icon-only control. Always pair with a tooltip and an accessible label (aria-label). Active = toggled on (teal).');
  propSwap(set, 'Icon', 'Icon', 'settings');
  CMP['Icon Button'] = set;
  return set;
}

// ---------------------------------------------------------------- Badge
function buildBadge(parent) {
  const T = { Neutral: ['color/bg/raised', 'color/text/secondary'], Success: ['color/status/success-subtle', 'color/status/success'], Warning: ['color/status/warning-subtle', 'color/status/warning'], Error: ['color/status/error-subtle', 'color/status/error'], Info: ['color/status/info-subtle', 'color/status/info'], Brand: ['color/brand/subtle', 'color/brand/default'] };
  const comps = [];
  for (const [tone, [bg, fg]] of Object.entries(T)) {
    const c = comp('Tone=' + tone);
    al(c, { gap: 6, pad: [0, 8, 0, 8], h: 20, cross: 'center', radius: 999, fill: bg });
    c.layoutSizingHorizontal = 'HUG';
    dot(c, fg, 6, 'Dot');
    txt(tone, { style: 'Label/Small', color: fg, parent: c, name: 'Label' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Badge', parent, 6, 'Small status / metadata tag. Never rely on colour alone — the label carries the meaning.');
  propBool(set, 'Show dot', 'Dot', true);
  CMP['Badge'] = set;
  return set;
}

// ---------------------------------------------------------------- Connection Status
const CONN = {
  Connected: ['color/status/success', 'color/status/success-subtle', 'Connected'],
  Disconnected: ['color/text/tertiary', 'color/bg/raised', 'Not connected'],
  Connecting: ['color/status/warning', 'color/status/warning-subtle', 'Connecting…'],
  Uploading: ['color/status/info', 'color/status/info-subtle', 'Uploading…'],
  Error: ['color/status/error', 'color/status/error-subtle', 'Port unavailable'],
};
function buildConnection(parent) {
  const comps = [];
  for (const [status, [fg, bg, label]] of Object.entries(CONN)) {
    const c = comp('Status=' + status);
    al(c, { gap: 6, pad: [0, 10, 0, 8], h: 24, cross: 'center', radius: 999, fill: bg });
    c.layoutSizingHorizontal = 'HUG';
    const d = dot(c, fg === 'color/text/tertiary' ? 'color/icon/muted' : fg, 8, 'Dot');
    if (status === 'Connected') { d.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0.85, b: 0.64, a: 0.5 }, offset: { x: 0, y: 0 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' }]; }
    txt(label, { style: 'Label/Small', color: fg, parent: c, name: 'Label' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Connection Status', parent, 5, 'Hardware connection indicator. Only show "Connected" when a real serial/USB session is open — never fake it. Text always accompanies the dot.');
  CMP['Connection Status'] = set;
  return set;
}

// ---------------------------------------------------------------- Board Selector
function buildBoardSelector(parent) {
  const comps = [];
  for (const status of ['Connected', 'Disconnected', 'Connecting']) for (const state of ['Default', 'Hover', 'Open']) {
    const c = comp('Status=' + status + ', State=' + state);
    al(c, { gap: 10, pad: [4, 10, 4, 4], h: 40, cross: 'center', radius: 10, fill: state === 'Hover' ? 'color/bg/hover' : 'color/bg/input', stroke: state === 'Open' ? 'color/border/focus' : (state === 'Hover' ? 'color/border/strong' : 'color/border/default') });
    c.layoutSizingHorizontal = 'HUG';
    const tile = box({ name: 'Chip tile', dir: 'H', w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: 'color/bg/raised', parent: c });
    iconSlot(tile, 'cpu', status === 'Connected' ? 'color/icon/brand' : 'color/icon/muted', 18, 'Board icon');
    const col = box({ name: 'Board text', dir: 'V', gap: 0, parent: c });
    txt('RoboCore V2', { style: 'Label/Strong', parent: col, name: 'Board' });
    txt(status === 'Disconnected' ? 'ESP32-S3 · no port selected' : 'ESP32-S3 · usbmodem1101', { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Details' });
    const [fg, bg, label] = CONN[status];
    const pill = box({ name: 'Status', dir: 'H', gap: 6, pad: [0, 8, 0, 8], h: 22, cross: 'center', radius: 999, fill: bg, parent: c });
    dot(pill, status === 'Disconnected' ? 'color/icon/muted' : fg, 7, 'Dot');
    txt(label, { style: 'Label/Small', color: fg, parent: pill, name: 'Status label' });
    iconSlot(c, state === 'Open' ? 'chevron-up' : 'chevron-down', 'color/icon/muted', 16, 'Chevron');
    comps.push(c);
  }
  const set = makeSet(comps, 'Board Selector', parent, 3, 'Top-bar board + port picker. Shows board, MCU, port and the real connection state. Click opens the board menu (State=Open).');
  propText(set, 'Board', 'Board', 'RoboCore V2');
  CMP['Board Selector'] = set;
  return set;
}

// ---------------------------------------------------------------- Nav Item
function buildNavItem(parent) {
  const comps = [];
  for (const collapsed of ['False', 'True']) for (const state of ['Default', 'Hover', 'Active']) {
    const c = comp('State=' + state + ', Collapsed=' + collapsed);
    const fill = state === 'Active' ? 'color/bg/selected' : (state === 'Hover' ? 'color/bg/hover' : undefined);
    if (collapsed === 'False') al(c, { gap: 12, pad: [0, 12, 0, 12], w: 184, h: 40, cross: 'center', radius: 8, fill });
    else al(c, { w: 40, h: 40, align: 'center', cross: 'center', radius: 8, fill });
    const icol = state === 'Active' ? 'color/icon/active' : (state === 'Hover' ? 'color/icon/strong' : 'color/icon/default');
    iconSlot(c, 'home', icol, 20);
    if (collapsed === 'False') {
      txt('Home', { style: 'Body/Medium', color: state === 'Default' ? 'color/text/secondary' : 'color/text/primary', parent: c, name: 'Label', grow: true });
      const ind = box({ name: 'Indicator', dir: 'H', gap: 0, cross: 'center', parent: c });
      dot(ind, 'color/status/success', 8, 'Live dot');
    }
    if (state === 'Active') rect({ name: 'Active bar', w: 3, h: 20, radius: [0, 3, 3, 0], fill: 'color/accent/default', parent: c, abs: true, x: 0, y: 10 });
    comps.push(c);
  }
  const set = makeSet(comps, 'Nav Item', parent, 3, 'Sidebar destination. Active = teal tint + teal icon + 3px indicator. Collapsed = icon only (show label as tooltip). Indicator dot = live state (e.g. serial port open).');
  propText(set, 'Label', 'Label', 'Home');
  propSwap(set, 'Icon', 'Icon', 'home');
  propBool(set, 'Show indicator', 'Indicator', false);
  CMP['Nav Item'] = set;
  return set;
}

// ---------------------------------------------------------------- Mode Switch (Blocks / Code)
function buildModeSwitch(parent) {
  const comps = [];
  for (const active of ['Blocks', 'Code']) {
    const c = comp('Active=' + active);
    al(c, { gap: 2, pad: 3, cross: 'center', radius: 10, fill: 'color/bg/input', stroke: 'color/border/subtle' });
    for (const [m, ic] of [['Blocks', 'blocks'], ['Code', 'code']]) {
      const on = m === active;
      const seg = box({ name: 'Segment ' + m, dir: 'H', gap: 8, pad: [0, 14, 0, 12], h: 30, cross: 'center', radius: 8, fill: on ? 'color/bg/selected' : undefined, stroke: on ? 'color/accent/muted' : undefined, parent: c });
      iconSlot(seg, ic, on ? 'color/icon/active' : 'color/icon/muted', 16, 'Icon ' + m);
      txt(m, { style: 'Label/Strong', color: on ? 'color/text/primary' : 'color/text/tertiary', parent: seg, name: 'Label ' + m });
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Mode Switch', parent, 2, 'Primary programming-mode selector. Blocks ↔ Code keeps the same project; Blocks generate C++, Code is the source of truth once edited by hand (show a warning before converting back).');
  CMP['Mode Switch'] = set;
  return set;
}

// ---------------------------------------------------------------- File Tab
function buildFileTab(parent) {
  const comps = [];
  for (const state of ['Active', 'Inactive', 'Hover']) {
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 8, 0, 12], h: 36, cross: 'center', fill: state === 'Active' ? 'color/bg/editor' : (state === 'Hover' ? 'color/bg/hover' : undefined), stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 1;
    c.layoutSizingHorizontal = 'HUG';
    iconSlot(c, 'file-code', state === 'Active' ? 'color/icon/brand' : 'color/icon/muted', 16, 'File icon');
    txt('Blink.ino', { style: 'Label/Default', color: state === 'Inactive' ? 'color/text/tertiary' : 'color/text/primary', parent: c, name: 'Filename' });
    const mod = box({ name: 'Modified', dir: 'H', w: 16, h: 16, align: 'center', cross: 'center', parent: c });
    dot(mod, 'color/brand/default', 8, 'Unsaved dot');
    iconSlot(c, 'x', 'color/icon/muted', 14, 'Close');
    if (state === 'Active') rect({ name: 'Active line', w: 10, h: 2, fill: 'color/accent/default', parent: c, abs: true, x: 0, y: 0 });
    comps.push(c);
  }
  const set = makeSet(comps, 'File Tab', parent, 3, 'Sketch file tab. Yellow dot = unsaved changes (replaces the close icon until hover). Active tab merges into the editor surface with a teal top line.');
  propText(set, 'Filename', 'Filename', 'Blink.ino');
  propBool(set, 'Modified', 'Modified', false);
  // stretch the active line across the tab
  for (const v of set.children) { const l = v.findOne(n => n.name === 'Active line'); if (l) { l.constraints = { horizontal: 'STRETCH', vertical: 'MIN' }; l.resize(v.width, 2); } }
  CMP['File Tab'] = set;
  return set;
}

// ---------------------------------------------------------------- Panel Tab (console tabs)
function buildPanelTab(parent) {
  const comps = [];
  for (const state of ['Active', 'Inactive']) {
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 4, 0, 4], h: 36, cross: 'center' });
    c.layoutSizingHorizontal = 'HUG';
    iconSlot(c, 'terminal', state === 'Active' ? 'color/icon/active' : 'color/icon/muted', 16);
    txt('Serial Monitor', { style: 'Label/Default', color: state === 'Active' ? 'color/text/primary' : 'color/text/tertiary', parent: c, name: 'Label' });
    const b = box({ name: 'Count', dir: 'H', pad: [0, 6, 0, 6], h: 18, cross: 'center', radius: 999, fill: 'color/bg/raised', parent: c });
    txt('0', { style: 'Label/Small', color: 'color/text/secondary', parent: b, name: 'Count label' });
    if (state === 'Active') { const bar = rect({ name: 'Active line', w: 10, h: 2, fill: 'color/accent/default', parent: c, abs: true, x: 0, y: 34 }); bar.constraints = { horizontal: 'STRETCH', vertical: 'MAX' }; }
    comps.push(c);
  }
  const set = makeSet(comps, 'Panel Tab', parent, 2, 'Bottom utility panel tabs: Serial Monitor, Compiler Output, Problems. Count badge shows unread lines / problem count.');
  propText(set, 'Label', 'Label', 'Serial Monitor');
  propSwap(set, 'Icon', 'Icon', 'terminal');
  propBool(set, 'Show count', 'Count', false);
  propText(set, 'Count', 'Count label', '0');
  for (const v of set.children) { const l = v.findOne(n => n.name === 'Active line'); if (l) l.resize(v.width, 2); }
  CMP['Panel Tab'] = set;
  return set;
}

// ---------------------------------------------------------------- Inputs
function buildInputs(parent) {
  const S = { Default: ['color/border/default', null], Hover: ['color/border/strong', null], Focus: ['color/border/focus', 'Focus/Ring'], Error: ['color/status/error', null], Disabled: ['color/border/subtle', null] };
  const comps = [];
  for (const [state, [stroke, eff]] of Object.entries(S)) {
    const c = comp('State=' + state);
    al(c, { dir: 'V', gap: 6, w: 280, cross: 'start' });
    c.layoutSizingVertical = 'HUG';
    txt('Project name', { style: 'Label/Default', color: 'color/text/secondary', parent: c, name: 'Label' });
    const f = box({ name: 'Field', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 36, cross: 'center', radius: 8, fill: state === 'Disabled' ? 'color/bg/panel' : 'color/bg/input', stroke, parent: c, wSize: 'fill' });
    if (eff) LINKS.push([f, 'effect', eff]);
    txt(state === 'Default' || state === 'Hover' ? 'e.g. Line follower' : (state === 'Error' ? '' : 'Obstacle avoider'), { style: 'Body/Default', color: state === 'Default' || state === 'Hover' ? 'color/text/tertiary' : (state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary'), parent: f, name: 'Value', grow: true });
    if (state === 'Focus') rect({ name: 'Caret', w: 1, h: 18, fill: 'color/accent/default', parent: f });
    if (state === 'Error') iconSlot(f, 'alert-triangle', 'color/status/error', 16, 'Error icon');
    txt(state === 'Error' ? 'Give your project a name to save it.' : 'Letters, numbers, spaces and dashes.', { style: 'Caption/Default', color: state === 'Error' ? 'color/status/error' : 'color/text/tertiary', parent: c, name: 'Helper' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Input Field', parent, 5, 'Labelled text input, 36px. Labels are always visible (no placeholder-only fields). Error text explains how to fix the problem.');
  propText(set, 'Label', 'Label', 'Project name');
  propBool(set, 'Show label', 'Label', true);
  propBool(set, 'Show helper', 'Helper', true);
  CMP['Input Field'] = set;

  // Search field
  const s = comp('Search Field', 'Filter/search input with ⌘K hint.');
  al(s, { gap: 8, pad: [0, 8, 0, 10], w: 280, h: 32, cross: 'center', radius: 8, fill: 'color/bg/input', stroke: 'color/border/default' });
  iconSlot(s, 'search', 'color/icon/muted', 16, 'Search icon');
  txt('Search projects, examples, boards…', { style: 'Body/Small', color: 'color/text/tertiary', parent: s, name: 'Placeholder', grow: true, truncate: true });
  const kbd = box({ name: 'Shortcut', dir: 'H', pad: [0, 6, 0, 6], h: 20, cross: 'center', radius: 4, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: s });
  txt('⌘K', { style: 'Label/Small', color: 'color/text/tertiary', parent: kbd, name: 'Key' });
  propText(s, 'Placeholder', 'Placeholder', 'Search projects, examples, boards…');
  CMP['Search Field'] = s;
  parent.appendChild(s);

  // Select (dropdown trigger)
  const sc = [];
  for (const state of ['Default', 'Hover', 'Open', 'Disabled']) {
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 8, 0, 10], w: 160, h: 32, cross: 'center', radius: 8, fill: state === 'Disabled' ? 'color/bg/panel' : (state === 'Hover' ? 'color/bg/hover' : 'color/bg/input'), stroke: state === 'Open' ? 'color/border/focus' : (state === 'Hover' ? 'color/border/strong' : 'color/border/default') });
    txt('115200 baud', { style: 'Label/Default', color: state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', parent: c, name: 'Value', grow: true, truncate: true });
    iconSlot(c, state === 'Open' ? 'chevron-up' : 'chevron-down', 'color/icon/muted', 16, 'Chevron');
    sc.push(c);
  }
  const sset = makeSet(sc, 'Select', parent, 4, 'Dropdown trigger (baud rate, line ending, port, options). Opens a Menu.');
  propText(sset, 'Value', 'Value', '115200 baud');
  CMP['Select'] = sset;
}

// ---------------------------------------------------------------- Menu
function buildMenu(parent) {
  const mc = [];
  for (const state of ['Default', 'Hover', 'Selected', 'Disabled']) {
    const c = comp('State=' + state);
    al(c, { gap: 10, pad: [0, 10, 0, 10], w: 240, h: 32, cross: 'center', radius: 6, fill: state === 'Hover' ? 'color/bg/hover' : (state === 'Selected' ? 'color/bg/selected' : undefined) });
    iconSlot(c, 'cpu', state === 'Selected' ? 'color/icon/active' : (state === 'Disabled' ? 'color/icon/disabled' : 'color/icon/default'), 16, 'Leading icon');
    txt('Menu item', { style: 'Body/Small', color: state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', parent: c, name: 'Label', grow: true, truncate: true });
    txt('⌘N', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Shortcut' });
    iconSlot(c, 'check', state === 'Selected' ? 'color/icon/active' : 'color/icon/disabled', 16, 'Check');
    mc.push(c);
  }
  const set = makeSet(mc, 'Menu Item', parent, 4, 'Row inside menus and dropdowns. Selected shows a teal check.');
  propText(set, 'Label', 'Label', 'Menu item');
  propText(set, 'Shortcut', 'Shortcut', '⌘N');
  propBool(set, 'Show icon', 'Leading icon', true);
  propBool(set, 'Show shortcut', 'Shortcut', true);
  propBool(set, 'Show check', 'Check', false);
  propSwap(set, 'Icon', 'Leading icon', 'cpu');
  CMP['Menu Item'] = set;

  const m = comp('Menu', 'Floating menu panel (Elevation/2 Popover). Compose with Menu Item rows and dividers.');
  al(m, { dir: 'V', gap: 2, pad: 6, w: 252, cross: 'start', radius: 10, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover' });
  m.layoutSizingVertical = 'HUG';
  for (const [l, k, ic, st] of [['New project', '⌘N', 'plus', 'Default'], ['Open…', '⌘O', 'folder-open', 'Hover'], ['Save', '⌘S', 'save', 'Default'], ['Rename', '', 'pencil', 'Default']]) {
    const i = inst('Menu Item', { State: st }, m, { text: { Label: l, Shortcut: k || ' ' } });
    i.layoutSizingHorizontal = 'FILL';
    setProp(i, 'Icon', ICON[ic].id);
    if (!k) setProp(i, 'Show shortcut', false);
  }
  divider(m, 'H', 240, 'color/border/subtle');
  const pi = inst('Menu Item', { State: 'Default' }, m, { text: { Label: 'Project settings…', Shortcut: '⌘,' } });
  pi.layoutSizingHorizontal = 'FILL'; setProp(pi, 'Icon', ICON['settings'].id);
  CMP['Menu'] = m;
  parent.appendChild(m);
}

// ---------------------------------------------------------------- Toggle / Checkbox / Radio
function buildControls(parent) {
  const tc = [];
  for (const on of ['True', 'False']) for (const dis of ['False', 'True']) {
    const c = comp('On=' + on + ', Disabled=' + dis);
    al(c, { w: 36, h: 20, pad: 2, align: on === 'True' ? 'end' : 'start', cross: 'center', radius: 999, fill: on === 'True' ? 'color/accent/default' : 'color/control/track-off' });
    if (dis === 'True') c.opacity = 0.4;
    const k = figma.createEllipse(); k.name = 'Knob'; k.resize(16, 16); k.fills = [paint('color/control/knob')];
    c.appendChild(k);
    tc.push(c);
  }
  CMP['Toggle'] = makeSet(tc, 'Toggle', parent, 4, 'Binary setting that applies immediately (autosave, timestamps, autoscroll).');
  const cc = [];
  for (const ch of ['True', 'False']) {
    const c = comp('Checked=' + ch);
    al(c, { w: 18, h: 18, align: 'center', cross: 'center', radius: 4, fill: ch === 'True' ? 'color/accent/default' : 'color/bg/input', stroke: ch === 'True' ? undefined : 'color/border/strong' });
    if (ch === 'True') iconSlot(c, 'check', 'color/icon/on-accent', 14, 'Check');
    cc.push(c);
  }
  CMP['Checkbox'] = makeSet(cc, 'Checkbox', parent, 2, 'Multi-select option.');
  const rc = [];
  for (const sel of ['True', 'False']) {
    const c = comp('Selected=' + sel);
    al(c, { w: 18, h: 18, align: 'center', cross: 'center', radius: 999, fill: 'color/bg/input', stroke: sel === 'True' ? 'color/border/focus' : 'color/border/strong' });
    if (sel === 'True') c.strokeWeight = 2;
    if (sel === 'True') { const d = figma.createEllipse(); d.name = 'Dot'; d.resize(8, 8); d.fills = [paint('color/accent/default')]; c.appendChild(d); }
    rc.push(c);
  }
  CMP['Radio'] = makeSet(rc, 'Radio', parent, 2, 'Single choice in a group.');
}

// ---------------------------------------------------------------- Tooltip
function buildTooltip(parent) {
  const c = comp('Tooltip', 'Inverse tooltip with optional shortcut. Delay 400ms, appears on hover and keyboard focus.');
  al(c, { gap: 8, pad: [0, 8, 0, 8], h: 26, cross: 'center', radius: 6, fill: 'color/bg/inverse', effect: 'Elevation/2 Popover' });
  c.layoutSizingHorizontal = 'HUG';
  txt('Verify sketch', { style: 'Label/Default', color: 'color/text/inverse', parent: c, name: 'Label' });
  txt('⌘R', { style: 'Label/Small', color: 'color/text/inverse', parent: c, name: 'Shortcut', opacity: 0.6 });
  propText(c, 'Label', 'Label', 'Verify sketch');
  propText(c, 'Shortcut', 'Shortcut', '⌘R');
  CMP['Tooltip'] = c;
  parent.appendChild(c);
}

// ---------------------------------------------------------------- Toast
function buildToast(parent) {
  const T = { Success: ['color/status/success', 'check-circle', 'Upload complete', 'Blink LED is running on RoboCore V2.'], Error: ['color/status/error', 'x-circle', 'Upload failed', 'No device found on /dev/cu.usbmodem1101. Check the USB-C cable.'], Info: ['color/status/info', 'info', 'Board package available', 'ESP32 core 3.0.7 adds RoboCore V2 pin names.'], Warning: ['color/status/warning', 'alert-triangle', 'Unsaved changes', 'Code edited by hand can’t be turned back into blocks.'] };
  const comps = [];
  for (const [type, [col, ic, title, msg]] of Object.entries(T)) {
    const c = comp('Type=' + type);
    al(c, { gap: 12, pad: [12, 12, 12, 14], w: 380, cross: 'start', radius: 12, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover' });
    c.layoutSizingVertical = 'HUG';
    rect({ name: 'Accent', w: 3, h: 10, fill: col, parent: c, abs: true, x: 0, y: 0 });
    iconSlot(c, ic, col, 20, 'Icon');
    const col2 = box({ name: 'Text', dir: 'V', gap: 2, parent: c, grow: true });
    col2.layoutSizingHorizontal = 'FILL';
    txt(title, { style: 'Label/Strong', parent: col2, name: 'Title' });
    txt(msg, { style: 'Body/Small', color: 'color/text/secondary', parent: col2, name: 'Message', fill: true });
    const x = iconSlot(c, 'x', 'color/icon/muted', 16, 'Close');
    comps.push(c);
  }
  const set = makeSet(comps, 'Toast', parent, 2, 'Transient feedback, bottom-right, 5s (errors persist until dismissed). Errors say what happened and what to do next.');
  for (const v of set.children) { const a = v.findOne(n => n.name === 'Accent'); if (a) { a.resize(3, v.height); a.constraints = { horizontal: 'MIN', vertical: 'STRETCH' }; a.topLeftRadius = 12; a.bottomLeftRadius = 12; } }
  CMP['Toast'] = set;
  return set;
}

// ---------------------------------------------------------------- Block Category Item
const BLOCK_CATS = [
  ['Output', 'color/block/output', 'log-out'], ['Input', 'color/block/input', 'log-in'], ['Control', 'color/block/control', 'repeat'], ['Math', 'color/block/math', 'sigma'],
  ['Variables', 'color/block/variables', 'variable'], ['Robotics', 'color/block/robotics', 'bot'], ['Sensors', 'color/block/sensors', 'radio'], ['Communication', 'color/block/communication', 'message'],
];
function buildCategoryItem(parent) {
  const comps = [];
  for (const [cat, col] of BLOCK_CATS) for (const state of ['Default', 'Active']) {
    const c = comp('Category=' + cat + ', State=' + state);
    al(c, { gap: 10, pad: [0, 10, 0, 12], w: 152, h: 36, cross: 'center', radius: 8, fill: state === 'Active' ? 'color/bg/raised' : undefined });
    const sw = box({ name: 'Swatch', dir: 'H', w: 14, h: 14, radius: 999, fill: col, parent: c });
    if (state === 'Active') { sw.strokes = [paint('color/icon/strong', 0.5)]; sw.strokeWeight = 2; sw.strokeAlign = 'OUTSIDE'; }
    txt(cat, { style: state === 'Active' ? 'Label/Strong' : 'Label/Default', color: state === 'Active' ? 'color/text/primary' : 'color/text/secondary', parent: c, name: 'Label', grow: true });
    if (state === 'Active') rect({ name: 'Category bar', w: 3, h: 20, radius: [0, 3, 3, 0], fill: col, parent: c, abs: true, x: 0, y: 8 });
    comps.push(c);
  }
  const set = makeSet(comps, 'Block Category', parent, 4, 'Toolbox category. Each category keeps its own colour so learners can match blocks to the palette. Active = raised + category-coloured bar.');
  CMP['Block Category'] = set;
  return set;
}

// ---------------------------------------------------------------- Toolbar Action (Verify / Upload / Stop)
function buildToolbarActions(parent) {
  const comps = [];
  const mk = (action, state) => {
    const c = comp('Action=' + action + ', State=' + state);
    if (action === 'Stop') {
      const fill = state === 'Hover' ? 'color/status/error-subtle' : (state === 'Running' ? 'color/status/error-subtle' : undefined);
      al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill, stroke: state === 'Running' ? 'color/status/error' : 'color/border/subtle' });
      iconSlot(c, 'stop', state === 'Disabled' ? 'color/icon/disabled' : 'color/status/error', 16, 'Icon');
      return c;
    }
    const primary = action === 'Upload';
    const fill = primary ? (state === 'Disabled' ? 'color/bg/raised' : (state === 'Hover' ? 'color/accent/hover' : (state === 'Running' ? 'color/accent/pressed' : 'color/accent/default'))) : (state === 'Hover' ? 'color/bg/hover' : (state === 'Disabled' ? 'color/bg/panel' : 'color/bg/raised'));
    const stroke = primary ? undefined : (state === 'Running' ? 'color/accent/muted' : (state === 'Hover' ? 'color/border/strong' : 'color/border/default'));
    al(c, { gap: 8, pad: [0, 14, 0, 12], h: 32, cross: 'center', radius: 8, fill, stroke });
    c.layoutSizingHorizontal = 'HUG';
    c.clipsContent = true;
    const ic = state === 'Running' ? 'loader' : (primary ? 'arrow-right' : 'check');
    const icol = state === 'Disabled' ? 'color/icon/disabled' : (primary ? 'color/icon/on-accent' : 'color/icon/active');
    iconSlot(c, ic, icol, 16, 'Icon');
    const label = state === 'Running' ? (primary ? 'Uploading 64%' : 'Verifying…') : action;
    txt(label, { style: 'Label/Strong', color: state === 'Disabled' ? 'color/text/disabled' : (primary ? 'color/text/on-accent' : 'color/text/primary'), parent: c, name: 'Label' });
    if (primary && state === 'Running') { const pr = rect({ name: 'Progress', w: 10, h: 3, fill: 'color/text/on-accent', parent: c, abs: true, x: 0, y: 29 }); pr.opacity = 0.35; }
    return c;
  };
  for (const action of ['Verify', 'Upload', 'Stop']) for (const state of ['Default', 'Hover', 'Running', 'Disabled']) comps.push(mk(action, state));
  const set = makeSet(comps, 'Toolbar Action', parent, 4, 'Build controls. Verify (⌘R) compiles; Upload (⌘U) compiles + flashes; Stop cancels the running operation and is disabled when idle. Running states show real progress only.');
  for (const v of set.children) { const p = v.findOne(n => n.name === 'Progress'); if (p) p.resize(Math.round(v.width * 0.64), 3); }
  CMP['Toolbar Action'] = set;
  return set;
}

// ---------------------------------------------------------------- Avatar
function buildAvatar(parent) {
  const c = comp('Avatar', 'User avatar / account menu trigger (initials fallback).');
  al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 999, fill: 'color/brand/subtle', stroke: 'color/brand/default' });
  txt('FM', { style: 'Label/Strong', color: 'color/brand/default', parent: c, name: 'Initials' });
  propText(c, 'Initials', 'Initials', 'FM');
  CMP['Avatar'] = c;
  parent.appendChild(c);
}
