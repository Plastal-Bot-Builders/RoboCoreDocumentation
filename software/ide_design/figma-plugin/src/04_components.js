// ============================================================================
// UI components — box style: navy ink on paper, yellow for brand/active only.
// Kept deliberately small: few variants, states expressed by ink, fill and icons.
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
// [fill, stroke, text, icon]
const BTN = {
  Primary:   { Default: ['color/ink/default', null, 'color/text/on-ink', 'color/icon/on-ink'], Hover: ['color/ink/hover', null, 'color/text/on-ink', 'color/icon/on-ink'], Focus: ['color/ink/default', 'color/border/ink', 'color/text/on-ink', 'color/icon/on-ink'], Disabled: ['color/bg/hover', null, 'color/text/disabled', 'color/icon/disabled'] },
  Secondary: { Default: [null, 'color/border/ink', 'color/text/primary', 'color/icon/strong'], Hover: ['color/bg/hover', 'color/border/ink', 'color/text/primary', 'color/icon/strong'], Focus: [null, 'color/border/ink', 'color/text/primary', 'color/icon/strong'], Disabled: [null, 'color/border/default', 'color/text/disabled', 'color/icon/disabled'] },
  Ghost:     { Default: [null, null, 'color/text/primary', 'color/icon/strong'], Hover: ['color/bg/hover', null, 'color/text/primary', 'color/icon/strong'], Focus: [null, 'color/border/ink', 'color/text/primary', 'color/icon/strong'], Disabled: [null, null, 'color/text/disabled', 'color/icon/disabled'] },
};
function buildButton(parent) {
  const comps = [];
  for (const [variant, states] of Object.entries(BTN)) for (const [state, [fill, stroke, text, icon]] of Object.entries(states)) {
    const c = comp('Variant=' + variant + ', State=' + state);
    al(c, { gap: 8, pad: [0, 14, 0, 12], h: 32, cross: 'center', radius: 6, fill: fill || undefined, stroke: stroke || undefined });
    c.layoutSizingHorizontal = 'HUG';
    if (state === 'Focus') LINKS.push([c, 'effect', 'Focus/Ring']);
    iconSlot(c, 'plus', icon, 16);
    txt('Button', { style: 'Label/Strong', color: text, parent: c, name: 'Label' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Button', parent, 4, 'Primary = navy ink (one per view). Secondary = navy outline. Ghost = text only. Focus = yellow halo. Destructive actions use Secondary + a confirmation dialog.');
  propText(set, 'Label', 'Label', 'Button');
  propBool(set, 'Show icon', 'Icon', true);
  propSwap(set, 'Icon', 'Icon', 'plus');
  CMP['Button'] = set;
}

// ---------------------------------------------------------------- Icon Button
function buildIconButton(parent) {
  const S = { Default: [null, 'color/icon/default'], Hover: ['color/bg/hover', 'color/icon/strong'], Active: ['color/bg/selected', 'color/icon/strong'], Disabled: [null, 'color/icon/disabled'] };
  const comps = [];
  for (const tip of ['Below', 'Above']) for (const [state, [fill, icon]] of Object.entries(S)) {
    const c = comp('State=' + state + ', Tip=' + tip);
    al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 6, fill: fill || undefined });
    c.clipsContent = false;
    iconSlot(c, 'settings', icon, 18);
    if (state === 'Hover') {
      // tooltip, centred on the button (a wide transparent holder centres the hugging pill)
      const hold = box({ name: 'Tooltip', dir: 'H', align: 'center', w: 260, h: 26, parent: c, abs: true, x: -114, y: tip === 'Below' ? 38 : -32 });
      const pill = box({ name: 'Tooltip pill', dir: 'H', gap: 8, pad: [0, 8, 0, 8], h: 26, cross: 'center', radius: 4, fill: 'color/bg/inverse', parent: hold });
      txt('Settings', { style: 'Label/Default', color: 'color/text/on-ink', parent: pill, name: 'Tip' });
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Icon Button', parent, 4, '32px icon-only control. Hover shows its tooltip (label + shortcut); Tip puts it below or above. Active = toggled on (yellow tint).');
  propSwap(set, 'Icon', 'Icon', 'settings');
  propText(set, 'Tooltip', 'Tip', 'Settings');
  CMP['Icon Button'] = set;
}

// ---------------------------------------------------------------- Toolbar Action
function buildToolbarActions(parent) {
  const comps = [];
  for (const action of ['Verify', 'Upload', 'Stop']) for (const state of ['Default', 'Running', 'Disabled']) {
    const c = comp('Action=' + action + ', State=' + state);
    const off = false;
    if (state === 'Disabled') c.opacity = 0.4;
    if (action === 'Stop') {
      al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 6, fill: state === 'Running' ? 'color/ink/default' : undefined, stroke: off ? 'color/border/default' : 'color/border/ink' });
      iconSlot(c, 'stop', off ? 'color/icon/disabled' : (state === 'Running' ? 'color/icon/on-ink' : 'color/icon/strong'), 16, 'Icon');
      comps.push(c); continue;
    }
    const primary = action === 'Upload';
    al(c, { gap: 8, pad: [0, 14, 0, 12], h: 32, cross: 'center', radius: 6, fill: primary && !off ? 'color/ink/default' : undefined, stroke: primary ? (off ? 'color/border/default' : undefined) : (off ? 'color/border/default' : 'color/border/ink') });
    c.layoutSizingHorizontal = 'HUG'; c.clipsContent = true;
    const ink = off ? 'disabled' : (primary ? 'on-ink' : 'strong');
    iconSlot(c, state === 'Running' ? 'loader' : (primary ? 'arrow-right' : 'check'), 'color/icon/' + ink, 16, 'Icon');
    txt(state === 'Running' ? (primary ? 'Uploading 64%' : 'Verifying…') : action, { style: 'Label/Strong', color: off ? 'color/text/disabled' : (primary ? 'color/text/on-ink' : 'color/text/primary'), parent: c, name: 'Label' });
    if (primary && state === 'Running') rect({ name: 'Progress', w: 10, h: 3, fill: 'color/brand/default', parent: c, abs: true, x: 0, y: 29 });
    comps.push(c);
  }
  const set = makeSet(comps, 'Toolbar Action', parent, 3, 'Build controls: Verify (⌘R) compiles, Upload (⌘U) compiles and flashes, Stop cancels and only appears while something runs. Progress is real toolchain progress (yellow bar). Disabled = 40% opacity so it reads on the yellow bar.');
  for (const v of set.children) { const p = v.findOne(n => n.name === 'Progress'); if (p) p.resize(Math.round(v.width * 0.64), 3); }
  CMP['Toolbar Action'] = set;
}

// ---------------------------------------------------------------- Badge
function buildBadge(parent) {
  const T = { Neutral: ['color/bg/hover', 'color/text/primary'], Brand: ['color/brand/default', 'color/text/on-bright'], Ink: ['color/ink/default', 'color/text/on-ink'] };
  const comps = [];
  for (const [tone, [bg, fg]] of Object.entries(T)) {
    const c = comp('Tone=' + tone);
    al(c, { pad: [0, 8, 0, 8], h: 20, cross: 'center', radius: 4, fill: bg });
    c.layoutSizingHorizontal = 'HUG';
    txt(tone, { style: 'Label/Small', color: fg, parent: c, name: 'Label' });
    comps.push(c);
  }
  CMP['Badge'] = makeSet(comps, 'Badge', parent, 3, 'Small tag. Neutral = metadata, Brand = highlight (yellow), Ink = strong status.');
}

// ---------------------------------------------------------------- Connection Status (dot + text, no fill)
function buildConnection(parent) {
  const S = { Connected: ['filled', 'Connected'], Disconnected: ['ring', 'Not connected'], Busy: ['brand', 'Uploading…'], Error: ['alert', 'Port unavailable'] };
  const comps = [];
  for (const [status, [kind, label]] of Object.entries(S)) {
    const c = comp('Status=' + status);
    al(c, { gap: 6, h: 20, cross: 'center' });
    c.layoutSizingHorizontal = 'HUG';
    if (kind === 'alert') iconSlot(c, 'alert-triangle', 'color/icon/strong', 14, 'Icon');
    else {
      const d = figma.createEllipse(); d.name = 'Dot'; d.resize(8, 8);
      if (kind === 'ring') { d.fills = []; d.strokes = [paint('color/border/ink')]; d.strokeWeight = 1.5; d.strokeAlign = 'INSIDE'; }
      else d.fills = [paint(kind === 'brand' ? 'color/brand/default' : 'color/ink/default')];
      if (kind === 'brand') { d.strokes = [paint('color/border/ink')]; d.strokeWeight = 1; d.strokeAlign = 'INSIDE'; }
      c.appendChild(d);
    }
    txt(label, { style: status === 'Error' ? 'Label/Strong' : 'Label/Default', color: 'color/text/primary', parent: c, name: 'Label' });
    comps.push(c);
  }
  CMP['Connection Status'] = makeSet(comps, 'Connection Status', parent, 4, 'Filled dot = connected, ring = not connected, yellow = busy, warning icon = error. Always with text; only "Connected" when a real port is open.');
}

// ---------------------------------------------------------------- Board Selector
function buildBoardSelector(parent) {
  const comps = [];
  for (const status of ['Connected', 'Disconnected']) for (const state of ['Default', 'Open']) {
    const c = comp('Status=' + status + ', State=' + state);
    al(c, { gap: 10, pad: [0, 10, 0, 8], h: 40, cross: 'center', radius: 8, fill: 'color/bg/panel', stroke: state === 'Open' ? 'color/border/ink' : 'color/border/default' });
    c.layoutSizingHorizontal = 'HUG';
    iconSlot(c, 'cpu', 'color/icon/strong', 18, 'Board icon');
    const col = box({ name: 'Board text', dir: 'V', gap: 0, parent: c });
    txt('RoboCore V2', { style: 'Label/Strong', parent: col, name: 'Board' });
    txt(status === 'Connected' ? 'ESP32-S3 · usbmodem1101' : 'ESP32-S3 · no port', { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Details' });
    divider(c, 'V', 20);
    inst('Connection Status', { Status: status }, c, { name: 'Connection' });
    iconSlot(c, state === 'Open' ? 'chevron-up' : 'chevron-down', 'color/icon/default', 16, 'Chevron');
    comps.push(c);
  }
  const set = makeSet(comps, 'Board Selector', parent, 2, 'Board + port picker in the top bar. Opens the Board Menu.');
  propText(set, 'Board', 'Board', 'RoboCore V2');
  CMP['Board Selector'] = set;
}

// ---------------------------------------------------------------- Nav Item
function buildNavItem(parent) {
  const comps = [];
  for (const collapsed of ['False', 'True']) for (const state of ['Default', 'Hover', 'Active']) {
    const c = comp('State=' + state + ', Collapsed=' + collapsed);
    const fill = state === 'Active' ? 'color/bg/selected' : (state === 'Hover' ? 'color/bg/hover' : undefined);
    if (collapsed === 'False') al(c, { gap: 12, pad: [0, 12, 0, 12], w: 184, h: 38, cross: 'center', radius: 6, fill });
    else al(c, { w: 40, h: 40, align: 'center', cross: 'center', radius: 6, fill });
    iconSlot(c, 'home', state === 'Default' ? 'color/icon/default' : 'color/icon/strong', 20);
    if (collapsed === 'False') {
      txt('Home', { style: state === 'Active' ? 'Label/Strong' : 'Label/Default', color: state === 'Default' ? 'color/text/secondary' : 'color/text/primary', parent: c, name: 'Label', grow: true });
      const ind = box({ name: 'Indicator', dir: 'H', cross: 'center', parent: c });
      dot(ind, 'color/ink/default', 6, 'Live dot');
    }
    if (state === 'Active') rect({ name: 'Active bar', w: 3, h: 18, radius: [0, 2, 2, 0], fill: 'color/brand/default', parent: c, abs: true, x: 0, y: collapsed === 'False' ? 10 : 11 });
    comps.push(c);
  }
  const set = makeSet(comps, 'Nav Item', parent, 3, 'Sidebar destination. Active = yellow tint + yellow bar (the box yellow). Collapsed = icon + tooltip.');
  propText(set, 'Label', 'Label', 'Home');
  propSwap(set, 'Icon', 'Icon', 'home');
  propBool(set, 'Show indicator', 'Indicator', false);
  CMP['Nav Item'] = set;
}

// ---------------------------------------------------------------- Mode Switch
function buildModeSwitch(parent) {
  const comps = [];
  for (const active of ['Blocks', 'Code']) {
    const c = comp('Active=' + active);
    al(c, { gap: 2, pad: 3, cross: 'center', radius: 8, fill: 'color/bg/subtle' });
    for (const [m, ic] of [['Blocks', 'blocks'], ['Code', 'code']]) {
      const on = m === active;
      const seg = box({ name: 'Segment ' + m, dir: 'H', gap: 8, pad: [0, 14, 0, 12], h: 30, cross: 'center', radius: 6, fill: on ? 'color/ink/default' : undefined, parent: c });
      iconSlot(seg, ic, on ? 'color/icon/on-ink' : 'color/icon/default', 16, 'Icon ' + m);
      txt(m, { style: 'Label/Strong', color: on ? 'color/text/on-ink' : 'color/text/secondary', parent: seg, name: 'Label ' + m });
    }
    comps.push(c);
  }
  CMP['Mode Switch'] = makeSet(comps, 'Mode Switch', parent, 2, 'Blocks ↔ Code. Same project; Code shows the C++ the blocks generate.');
}

// ---------------------------------------------------------------- File Tab / Panel Tab (underline is a real child, not absolute)
function tabShell(c, h, on) {
  al(c, { gap: 8, pad: [0, 8, 0, 10], h, cross: 'center', stroke: on ? 'color/border/ink' : undefined });
  if (on) { c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 2; }
  c.layoutSizingHorizontal = 'HUG';
  return c;
}
function buildFileTab(parent) {
  const comps = [];
  for (const state of ['Active', 'Inactive']) {
    const on = state === 'Active';
    const c = comp('State=' + state);
    const row = tabShell(c, 36, on);
    iconSlot(row, 'file-code', on ? 'color/icon/strong' : 'color/icon/muted', 16, 'File icon');
    txt('Blink.ino', { style: on ? 'Label/Strong' : 'Label/Default', color: on ? 'color/text/primary' : 'color/text/tertiary', parent: row, name: 'Filename' });
    const mod = box({ name: 'Modified', dir: 'H', w: 12, h: 16, align: 'center', cross: 'center', parent: row });
    dot(mod, 'color/brand/default', 7, 'Unsaved dot');
    iconSlot(row, 'x', 'color/icon/muted', 14, 'Close');
    comps.push(c);
  }
  const set = makeSet(comps, 'File Tab', parent, 2, 'Sketch tab. Yellow dot = unsaved. Active = bold + navy underline.');
  propText(set, 'Filename', 'Filename', 'Blink.ino');
  propBool(set, 'Modified', 'Modified', false);
  CMP['File Tab'] = set;
}
function buildPanelTab(parent) {
  const comps = [];
  for (const state of ['Active', 'Inactive']) {
    const on = state === 'Active';
    const c = comp('State=' + state);
    const row = tabShell(c, 40, on);

    txt('Serial Monitor', { style: on ? 'Label/Strong' : 'Label/Default', color: on ? 'color/text/primary' : 'color/text/tertiary', parent: row, name: 'Label' });
    const b = box({ name: 'Count', dir: 'H', pad: [0, 5, 0, 5], h: 16, cross: 'center', radius: 4, fill: 'color/bg/hover', parent: row });
    txt('0', { style: 'Label/Small', color: 'color/text/primary', parent: b, name: 'Count label' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Panel Tab', parent, 2, 'Bottom panel tabs: Serial Monitor, Output, Problems. Active = bold + navy underline.');
  propText(set, 'Label', 'Label', 'Serial Monitor');
  propBool(set, 'Show count', 'Count', false);
  propText(set, 'Count', 'Count label', '0');
  CMP['Panel Tab'] = set;
}

// ---------------------------------------------------------------- Inputs
function buildInputs(parent) {
  const S = { Default: ['color/border/default', 1], Focus: ['color/border/ink', 1], Error: ['color/border/ink', 2], Disabled: ['color/border/subtle', 1] };
  const comps = [];
  for (const [state, [stroke, sw]] of Object.entries(S)) {
    const c = comp('State=' + state);
    al(c, { dir: 'V', gap: 6, w: 280, cross: 'start' });
    c.layoutSizingVertical = 'HUG';
    txt('Project name', { style: 'Label/Default', color: 'color/text/secondary', parent: c, name: 'Label' });
    const f = box({ name: 'Field', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 36, cross: 'center', radius: 6, fill: state === 'Disabled' ? 'color/bg/hover' : 'color/bg/input', stroke, strokeW: sw, parent: c, wSize: 'fill' });
    if (state === 'Focus') LINKS.push([f, 'effect', 'Focus/Ring']);
    txt(state === 'Default' ? 'e.g. Line follower' : (state === 'Error' ? '' : 'Obstacle avoider'), { style: 'Body/Default', color: state === 'Default' ? 'color/text/tertiary' : (state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary'), parent: f, name: 'Value', grow: true });
    if (state === 'Error') iconSlot(f, 'alert-triangle', 'color/icon/strong', 16, 'Error icon');
    txt(state === 'Error' ? 'Give your project a name to save it.' : 'Letters, numbers and spaces.', { style: state === 'Error' ? 'Label/Small' : 'Caption/Default', color: state === 'Error' ? 'color/text/primary' : 'color/text/tertiary', parent: c, name: 'Helper' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Input Field', parent, 4, 'Labelled input. Focus = navy border + yellow halo. Error = 2px navy border, warning icon and an explanation — no extra colour.');
  propText(set, 'Label', 'Label', 'Project name');
  propBool(set, 'Show helper', 'Helper', true);
  CMP['Input Field'] = set;

  const s = comp('Search Field', 'Search / filter input.');
  al(s, { gap: 8, pad: [0, 10, 0, 10], w: 260, h: 32, cross: 'center', radius: 6, fill: 'color/bg/input', stroke: 'color/border/default' });
  iconSlot(s, 'search', 'color/icon/muted', 16, 'Search icon');
  txt('Search', { style: 'Body/Small', color: 'color/text/tertiary', parent: s, name: 'Placeholder', grow: true, truncate: true });
  propText(s, 'Placeholder', 'Placeholder', 'Search');
  CMP['Search Field'] = s;
  parent.appendChild(s);

  const sc = [];
  for (const state of ['Default', 'Open', 'Disabled']) {
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 8, 0, 10], w: 160, h: 32, cross: 'center', radius: 6, fill: state === 'Disabled' ? 'color/bg/hover' : 'color/bg/input', stroke: state === 'Open' ? 'color/border/ink' : 'color/border/default' });
    txt('115200 baud', { style: 'Label/Default', color: state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', parent: c, name: 'Value', grow: true, truncate: true });
    iconSlot(c, state === 'Open' ? 'chevron-up' : 'chevron-down', 'color/icon/default', 16, 'Chevron');
    sc.push(c);
  }
  const sset = makeSet(sc, 'Select', parent, 3, 'Dropdown trigger (baud rate, port, options).');
  propText(sset, 'Value', 'Value', '115200 baud');
  CMP['Select'] = sset;
}

// ---------------------------------------------------------------- Menu item
function buildMenu(parent) {
  const mc = [];
  for (const state of ['Default', 'Hover', 'Selected']) {
    const c = comp('State=' + state);
    al(c, { gap: 10, pad: [0, 10, 0, 10], w: 240, h: 32, cross: 'center', radius: 4, fill: state === 'Hover' ? 'color/bg/hover' : (state === 'Selected' ? 'color/bg/selected' : undefined) });
    iconSlot(c, 'cpu', 'color/icon/default', 16, 'Leading icon');
    txt('Menu item', { style: state === 'Selected' ? 'Label/Strong' : 'Body/Small', color: 'color/text/primary', parent: c, name: 'Label', grow: true, truncate: true });
    txt('Ctrl+C', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Shortcut' });
    iconSlot(c, 'check', 'color/icon/strong', 16, 'Check');
    mc.push(c);
  }
  const set = makeSet(mc, 'Menu Item', parent, 3, 'Row in menus and dropdowns.');
  propText(set, 'Label', 'Label', 'Menu item');
  propBool(set, 'Show icon', 'Leading icon', true);
  propBool(set, 'Show check', 'Check', false);
  propBool(set, 'Show shortcut', 'Shortcut', false);
  propText(set, 'Shortcut', 'Shortcut', 'Ctrl+C');
  propSwap(set, 'Icon', 'Leading icon', 'cpu');
  CMP['Menu Item'] = set;
}

// ---------------------------------------------------------------- Toggle / Checkbox / Radio
function buildControls(parent) {
  const tc = [];
  for (const on of ['True', 'False']) {
    const c = comp('On=' + on);
    al(c, { w: 34, h: 20, pad: 2, align: on === 'True' ? 'end' : 'start', cross: 'center', radius: 999, fill: on === 'True' ? 'color/ink/default' : 'color/control/track-off' });
    const k = figma.createEllipse(); k.name = 'Knob'; k.resize(16, 16); k.fills = [paint('color/control/knob')];
    c.appendChild(k);
    tc.push(c);
  }
  CMP['Toggle'] = makeSet(tc, 'Toggle', parent, 2, 'Setting that applies immediately.');
  const cc = [];
  for (const ch of ['True', 'False']) {
    const c = comp('Checked=' + ch);
    al(c, { w: 18, h: 18, align: 'center', cross: 'center', radius: 4, fill: ch === 'True' ? 'color/ink/default' : 'color/bg/input', stroke: ch === 'True' ? undefined : 'color/border/strong' });
    if (ch === 'True') iconSlot(c, 'check', 'color/icon/on-ink', 14, 'Check');
    cc.push(c);
  }
  CMP['Checkbox'] = makeSet(cc, 'Checkbox', parent, 2, 'Multi-select option.');
  const rc = [];
  for (const sel of ['True', 'False']) {
    const c = comp('Selected=' + sel);
    al(c, { w: 18, h: 18, align: 'center', cross: 'center', radius: 999, fill: 'color/bg/input', stroke: sel === 'True' ? 'color/border/ink' : 'color/border/strong' });
    if (sel === 'True') { c.strokeWeight = 2; const d = figma.createEllipse(); d.name = 'Dot'; d.resize(8, 8); d.fills = [paint('color/ink/default')]; c.appendChild(d); }
    rc.push(c);
  }
  CMP['Radio'] = makeSet(rc, 'Radio', parent, 2, 'Single choice.');
}

// ---------------------------------------------------------------- Tooltip
function buildTooltip(parent) {
  const c = comp('Tooltip', 'Navy tooltip with shortcut. Shows on hover and keyboard focus.');
  al(c, { gap: 8, pad: [0, 8, 0, 8], h: 26, cross: 'center', radius: 4, fill: 'color/bg/inverse' });
  c.layoutSizingHorizontal = 'HUG';
  txt('Verify sketch', { style: 'Label/Default', color: 'color/text/on-ink', parent: c, name: 'Label' });
  txt('⌘R', { style: 'Label/Small', color: 'color/text/on-ink', parent: c, name: 'Shortcut', opacity: 0.7 });
  propText(c, 'Label', 'Label', 'Verify sketch');
  CMP['Tooltip'] = c;
  parent.appendChild(c);
}

// ---------------------------------------------------------------- Toast
function buildToast(parent) {
  const T = { Success: ['color/bg/raised', 'check-circle', 'color/icon/strong', 'color/text/primary', 'Upload complete', 'Blink LED is running on RoboCore V2.'], Error: ['color/bg/inverse', 'alert-triangle', 'color/icon/on-ink', 'color/text/on-ink', 'Upload failed', 'No reply from /dev/cu.usbmodem1101. Hold BOOT, tap RESET, try again.'], Info: ['color/bg/raised', 'info', 'color/icon/strong', 'color/text/primary', 'Board package update', 'ESP32 core 3.0.7 is available.'] };
  const comps = [];
  for (const [type, [bg, ic, icc, fg, title, msg]] of Object.entries(T)) {
    const c = comp('Type=' + type);
    al(c, { gap: 12, pad: [12, 12, 12, 14], w: 360, cross: 'start', radius: 8, fill: bg, stroke: type === 'Error' ? undefined : 'color/border/default', effect: 'Elevation/Popover' });
    c.layoutSizingVertical = 'HUG';
    iconSlot(c, ic, icc, 20, 'Icon');
    const col = box({ name: 'Text', dir: 'V', gap: 2, parent: c, grow: true });
    col.layoutSizingHorizontal = 'FILL';
    txt(title, { style: 'Label/Strong', color: fg, parent: col, name: 'Title' });
    txt(msg, { style: 'Body/Small', color: fg, parent: col, name: 'Message', fill: true, opacity: type === 'Error' ? 0.85 : 1 });
    iconSlot(c, 'x', type === 'Error' ? 'color/icon/on-ink' : 'color/icon/muted', 16, 'Close');
    comps.push(c);
  }
  CMP['Toast'] = makeSet(comps, 'Toast', parent, 3, 'Feedback, bottom-right. Errors are inverted (navy) and stay until dismissed — contrast, not colour, signals the problem.');
}

// ---------------------------------------------------------------- Block Category (toolbox row)
// BLOCK_CATS (the toolbox categories) live with the block library in 05a_block_data.js
function buildCategoryItem(parent) {
  const comps = [];
  for (const [cat, ic] of BLOCK_CATS) for (const state of ['Default', 'Active']) {
    const c = comp('Category=' + cat + ', State=' + state);
    al(c, { gap: 8, pad: [0, 8, 0, 10], w: 144, h: 34, cross: 'center', radius: 6, fill: state === 'Active' ? 'color/bg/selected' : undefined });
    const st = STYLE(cat);
    const chip = box({ name: 'Colour chip', dir: 'H', w: 22, h: 22, align: 'center', cross: 'center', radius: 11, fill: st.fill, parent: c });
    iconSlot(chip, ic, st.icon, 14, 'Icon');
    txt(cat, { style: state === 'Active' ? 'Label/Strong' : 'Label/Default', color: state === 'Active' ? 'color/text/primary' : 'color/text/secondary', parent: c, name: 'Label', grow: true });
    if (state === 'Active') rect({ name: 'Active bar', w: 3, h: 18, radius: [0, 2, 2, 0], fill: 'color/brand/default', parent: c, abs: true, x: 0, y: 8 });
    comps.push(c);
  }
  CMP['Block Category'] = makeSet(comps, 'Block Category', parent, 4, 'Toolbox category: colour chip (the category’s block colour + line icon) and label. The chip is the only place outside the canvas where block colours appear.');
}

// ---------------------------------------------------------------- Avatar
function buildAvatar(parent) {
  const c = comp('Avatar', 'Account menu trigger.');
  al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 999, fill: 'color/ink/default' });
  txt('FM', { style: 'Label/Strong', color: 'color/text/on-ink', parent: c, name: 'Initials' });
  CMP['Avatar'] = c;
  parent.appendChild(c);
}
