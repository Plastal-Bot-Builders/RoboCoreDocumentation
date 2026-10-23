// ============================================================================
// Interactive components: hover, toggles, radio groups and dropdowns that work
// wherever an instance is used (Figma prototype "Change to" between variants).
// Works on the Starter plan: no prototype variables or conditionals needed.
// ============================================================================

const QUICK = { type: 'EASE_OUT' };
function changeTo(dest, trigger, o = {}) {
  return {
    trigger: trigger || { type: 'ON_CLICK' },
    actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'CHANGE_TO', transition: o.instant ? null : { type: 'SMART_ANIMATE', easing: QUICK, duration: o.d || 0.12 }, resetInteractiveComponents: false }],
  };
}
// adds a reaction, replacing any existing one with the same trigger type (keeps inherited hover etc.)
// A "Change to" pointing at the variant the node already sits in is skipped (Figma rejects it).
// A failed reaction is reported as a warning so one bad link never stops the whole build.
async function addReaction(node, r) {
  const a0 = r.actions && r.actions[0];
  if (a0 && a0.navigation === 'CHANGE_TO') {
    let v = node; while (v && v.type !== 'COMPONENT' && v.type !== 'PAGE') v = v.parent;
    if (v && v.type === 'COMPONENT' && v.id === a0.destinationId) { REPORT.counts.selfLinksSkipped = (REPORT.counts.selfLinksSkipped || 0) + 1; return; }
  }
  // likewise "Navigate to" the screen the control is already on (e.g. Zoom reset on the default zoom) does nothing
  if (a0 && a0.navigation === 'NAVIGATE') {
    let top = node; while (top.parent && top.parent.type !== 'PAGE') top = top.parent;
    if (top.id === a0.destinationId) { REPORT.counts.selfLinksSkipped = (REPORT.counts.selfLinksSkipped || 0) + 1; return; }
  }
  const same = (a, b) => a && b && a.type === b.type && JSON.stringify(a.keyCodes || []) === JSON.stringify(b.keyCodes || []);
  // reactions read back from Figma can carry keys that setReactionsAsync refuses (e.g. trigger.deprecatedVersion)
  const keep = (node.reactions || []).filter(x => !same(x.trigger, r.trigger)).map(x => { const t = Object.assign({}, x.trigger); delete t.deprecatedVersion; return Object.assign({}, x, { trigger: t }); });
  try {
    await node.setReactionsAsync(keep.concat([r]));
    REPORT.counts.reactions = (REPORT.counts.reactions || 0) + 1;
  } catch (e) {
    REPORT.counts.reactionFailures = (REPORT.counts.reactionFailures || 0) + 1;
    if (REPORT.counts.reactionFailures <= 25) warn('reaction on ' + node.name + ' (' + (r.trigger && r.trigger.type) + '): ' + (e && e.message ? e.message : String(e)));
  }
}
function variantsWhere(set, props) {
  return set.children.filter(ch => {
    const parts = {};
    ch.name.split(',').forEach(s => { const [k, v] = s.split('=').map(x => x.trim()); parts[k] = v; });
    return Object.entries(props).every(([k, v]) => parts[k] === v);
  });
}
function propsOf(variant) {
  const parts = {};
  variant.name.split(',').forEach(s => { const [k, v] = s.split('=').map(x => x.trim()); parts[k] = v; });
  return parts;
}
// every variant with prop=from changes to the same variant with prop=to on trigger
async function pairVariants(set, prop, from, to, trigger, nodeName) {
  for (const v of set.children) {
    const p = propsOf(v);
    if (p[prop] !== from) continue;
    const target = variantOf(set, Object.assign({}, p, { [prop]: to }));
    const node = nodeName ? v.findOne(n => n.name === nodeName) : v;
    if (!node) { warn('pairVariants: no ' + nodeName + ' in ' + v.name); continue; }
    await addReaction(node, changeTo(target, trigger));
  }
}
const HOVER = { type: 'ON_HOVER' };
const PRESS = { type: 'ON_PRESS' };
const after = (ms) => ({ type: 'AFTER_TIMEOUT', timeout: ms });

// ---------------------------------------------------------------- dropdown selects
// Select/<name>: Value = option × Open = False | True. Opening shows the list under
// the field; picking an option closes it with the new value.
const SELECTS = {
  'Baud': [['9600 baud', '115200 baud'], 128, '115200 baud'],
  'Port': [['Preview board (simulator)', 'USB-C · ESP32-S3 (usbmodem1101)'], 300, 'USB-C · ESP32-S3 (usbmodem1101)'],
  'Board': [['RoboCore V2 (ESP32-S3)', 'Arduino Uno R3', 'ESP32 DevKit V1', 'NodeMCU-32S'], 300, 'RoboCore V2 (ESP32-S3)'],
  'Line ending': [['No line ending', 'New line', 'Carriage return', 'Both NL & CR'], 150, 'New line'],
  'Font size': [['12 px', '13 px', '14 px', '16 px'], 110, '13 px'],
  'Language': [['English'], 130, 'English'],
  'Level': [['Beginner', 'Intermediate', 'Advanced'], 140, 'Beginner'],
  'CPU': [['240 MHz', '160 MHz', '80 MHz'], 300, '240 MHz'],
  'Partition': [['8 MB · 3 MB app / 1.5 MB SPIFFS', '8 MB · 3 MB app / 1.5 MB FATFS'], 300, '8 MB · 3 MB app / 1.5 MB SPIFFS'],
};
function selectVariant(name, value, open, w) {
  const c = comp('Value=' + value + ', Open=' + (open ? 'True' : 'False'));
  al(c, { gap: 8, pad: [0, 8, 0, 10], w, h: 32, cross: 'center', radius: 6, fill: 'color/bg/input', stroke: open ? 'color/border/ink' : 'color/border/default' });
  c.clipsContent = false;
  txt(value, { style: 'Label/Default', parent: c, name: 'Value', grow: true, truncate: true });
  iconSlot(c, open ? 'chevron-up' : 'chevron-down', 'color/icon/default', 16, 'Chevron');
  if (open) {
    const opts = SELECTS[name][0];
    const list = box({ name: 'Options', dir: 'V', gap: 2, pad: 4, w: Math.max(w, 180), fill: 'color/bg/raised', radius: 8, stroke: 'color/border/default', effect: 'Elevation/Popover', parent: c, abs: true, x: 0, y: 36 });
    for (const o of opts) {
      const sel = o === value;
      const r = box({ name: 'Option ' + o, dir: 'H', gap: 8, pad: [0, 8, 0, 10], h: 32, cross: 'center', radius: 4, fill: sel ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
      txt(o, { style: sel ? 'Label/Strong' : 'Label/Default', parent: r, name: 'Label', grow: true, truncate: true });
      if (sel) iconSlot(r, 'check', 'color/icon/strong', 16, 'Check');
    }
    if (name === 'Language') {
      const r = box({ name: 'More languages', dir: 'H', pad: [0, 10, 0, 10], h: 28, cross: 'center', parent: list, wSize: 'fill' });
      txt('More languages later', { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Label' });
    }
  }
  return c;
}
async function buildSelects(parent) {
  for (const [name, [opts, w]] of Object.entries(SELECTS)) {
    const comps = [];
    for (const o of opts) { comps.push(selectVariant(name, o, false, w)); comps.push(selectVariant(name, o, true, w)); }
    const set = makeSet(comps, 'Select/' + name, parent, 2, 'Interactive dropdown: click to open, pick an option to close with that value.');
    // room under each row for the open list, so no option is hidden by the next variant
    const listH = opts.length * 34 + 6 + (name === 'Language' ? 28 : 0), listW = Math.max(w, 180);
    gridVariants(set, 2, 24 + listW - w, 24 + listH);
    set.resize(set.width + listW - w, set.height + listH);
    CMP['Select/' + name] = set;
  }
}
async function wireSelects() {
  for (const name of Object.keys(SELECTS)) {
    const set = CMP['Select/' + name];
    for (const v of set.children) {
      const p = propsOf(v);
      if (p.Open === 'False') { await addReaction(v, changeTo(variantOf(set, { Value: p.Value, Open: 'True' }))); continue; }
      await addReaction(v, changeTo(variantOf(set, { Value: p.Value, Open: 'False' })));
      for (const r of v.findAll(n => n.name.indexOf('Option ') === 0)) {
        const val = r.name.slice(7);
        await addReaction(r, changeTo(variantOf(set, { Value: val, Open: 'False' })));
      }
    }
  }
}
function sel(parent, name, value, o = {}) {
  const set = CMP['Select/' + name];
  const v = value || SELECTS[name][2];
  const i = variantOf(set, { Value: v, Open: 'False' }).createInstance();
  i.name = o.nodeName || ('Select ' + name);
  parent.appendChild(i);
  if (o.w) i.resize(o.w, o.h || 32);
  if (o.fill && isAL(parent)) i.layoutSizingHorizontal = 'FILL';
  return i;
}
function labeledSel(parent, label, name, value) {
  const w = box({ name: 'Select ' + label, dir: 'V', gap: 6, parent, wSize: 'fill' });
  txt(label, { style: 'Label/Default', color: 'color/text/secondary', parent: w, name: 'Label' });
  const s = sel(w, name, value, { fill: true });
  s.resize(s.width, 36);
  return w;
}

// ---------------------------------------------------------------- choice groups
// A group of options where picking one deselects the others (radio cards).
// items: [[key, title, desc, icon?]]
function buildChoiceGroup(parent, name, items, o = {}) {
  const comps = [];
  for (const [key] of items) {
    const c = comp('Selected=' + key);
    al(c, { dir: o.dir || 'V', gap: o.gap || 8, w: o.w || 420, cross: 'start' });
    c.layoutSizingVertical = 'HUG';
    for (const [k2, title, desc, icon] of items) {
      const on = k2 === key;
      const r = box({ name: 'Choice ' + k2, dir: 'H', gap: 10, pad: 12, cross: 'start', radius: 8, fill: on ? 'color/bg/selected' : 'color/bg/input', stroke: on ? 'color/border/ink' : 'color/border/default', parent: c, wSize: 'fill' });
      if (o.dir === 'H') { r.layoutSizingHorizontal = 'FILL'; r.layoutGrow = 1; }
      if (icon) iconSlot(r, icon, 'color/icon/strong', 20, 'Icon');
      const col = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true });
      col.layoutSizingHorizontal = 'FILL';
      txt(title, { style: 'Label/Strong', parent: col, name: 'Title' });
      if (desc) txt(desc, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true });
      inst('Radio', { Selected: on ? 'True' : 'False' }, r, { name: 'Radio' });
    }
    comps.push(c);
  }
  const set = makeSet(comps, name, parent, items.length, o.desc || 'Radio group: picking one option deselects the others.');
  CMP[name] = set;
  return set;
}
async function wireChoiceGroup(set) {
  for (const v of set.children) for (const r of v.findAll(n => n.name.indexOf('Choice ') === 0)) {
    await addReaction(r, changeTo(variantOf(set, { Selected: r.name.slice(7) })));
  }
}

// ---------------------------------------------------------------- small stateful widgets
// Library install button: Install → Installing… → Installed (hover: Remove)
function buildLibraryAction(parent) {
  const comps = [];
  for (const st of ['Install', 'Installing', 'Installed', 'Remove']) {
    const c = comp('State=' + st);
    al(c, { gap: 6, pad: [0, 12, 0, 10], h: 32, cross: 'center', radius: 6, fill: st === 'Install' ? undefined : (st === 'Remove' ? 'color/bg/hover' : 'color/bg/subtle'), stroke: st === 'Install' || st === 'Remove' ? 'color/border/ink' : undefined });
    c.layoutSizingHorizontal = 'HUG';
    iconSlot(c, { Install: 'download', Installing: 'loader', Installed: 'check', Remove: 'trash' }[st], 'color/icon/strong', 16, 'Icon');
    txt({ Install: 'Install', Installing: 'Installing…', Installed: 'Installed', Remove: 'Remove' }[st], { style: 'Label/Strong', parent: c, name: 'Label' });
    comps.push(c);
  }
  CMP['Library Action'] = makeSet(comps, 'Library Action', parent, 4, 'Install a library: Install → Installing… (about a second) → Installed. Hover an installed library to remove it.');
}
// compile server test: Test → Testing… → reachable
function buildServerTest(parent) {
  const comps = [];
  for (const st of ['Idle', 'Testing', 'OK']) {
    const c = comp('State=' + st);
    al(c, { gap: 10, cross: 'center' });
    c.layoutSizingHorizontal = 'HUG';
    const b = box({ name: 'Test button', dir: 'H', gap: 6, pad: [0, 12, 0, 10], h: 32, cross: 'center', radius: 6, stroke: 'color/border/ink', parent: c });
    iconSlot(b, st === 'Testing' ? 'loader' : 'plug', 'color/icon/strong', 16, 'Icon');
    txt(st === 'Testing' ? 'Testing…' : 'Test', { style: 'Label/Strong', parent: b, name: 'Label' });
    if (st === 'OK') {
      const r = box({ name: 'Result', dir: 'H', gap: 6, cross: 'center', parent: c });
      iconSlot(r, 'check-circle', 'color/icon/strong', 16, 'Icon');
      txt('Reachable · arduino-cli 1.5.1 · esp32 3.3.12', { style: 'Label/Default', parent: r, name: 'Text' });
    }
    comps.push(c);
  }
  CMP['Server Test'] = makeSet(comps, 'Server Test', parent, 3, 'Settings → Compile server → Test: calls GET /health and shows the toolchain versions.');
}
// Monaco find widget match counter: 1 of 2 ↔ 2 of 2
function buildFindWidget(parent) {
  const comps = [];
  for (const m of ['1', '2']) {
    const c = comp('Match=' + m);
    al(c, { gap: 4, pad: [4, 6, 4, 6], cross: 'center', radius: 4, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/Popover' });
    c.layoutSizingHorizontal = 'HUG';
    iconSlot(c, 'chevron-right', 'color/icon/default', 14, 'Toggle replace');
    const f = box({ name: 'Find input', dir: 'H', gap: 4, pad: [0, 4, 0, 8], w: 220, h: 26, cross: 'center', radius: 3, fill: 'color/bg/input', stroke: 'color/border/ink', parent: c });
    txt('delay', { style: 'Code/Small', parent: f, name: 'Query', grow: true });
    for (const t of ['Aa', 'ab', '.*']) { const o = box({ name: 'Option ' + t, dir: 'H', w: 22, h: 20, align: 'center', cross: 'center', radius: 3, parent: f }); txt(t, { style: 'Code/Small', color: 'color/text/tertiary', parent: o, name: 'Label' }); }
    txt(m + ' of 2', { style: 'Label/Small', color: 'color/text/secondary', parent: c, name: 'Count', w: 52, align: 'CENTER' });
    iconBtn(c, 'chevron-up', { name: 'Previous match' }); iconBtn(c, 'chevron-down', { name: 'Next match' });
    iconBtn(c, 'x', { name: 'Close find' });
    comps.push(c);
  }
  CMP['Find Widget'] = makeSet(comps, 'Find Widget', parent, 2, 'Monaco find widget (⌘F / Ctrl+F): query, match case / whole word / regex, n of m, previous / next, close (Esc).');
}

// ---------------------------------------------------------------- wire the base components
async function wireComponentInteractions() {
  // hover
  await pairVariants(CMP['Button'], 'State', 'Default', 'Hover', HOVER);
  await pairVariants(CMP['Icon Button'], 'State', 'Default', 'Hover', HOVER);
  await pairVariants(CMP['Nav Item'], 'State', 'Default', 'Hover', HOVER);
  await pairVariants(CMP['Menu Item'], 'State', 'Default', 'Hover', HOVER);
  for (const k of ['Project Card', 'Example Card', 'Template Tile']) await pairVariants(CMP[k], 'State', 'Default', 'Hover', HOVER);
  // toggles
  await pairVariants(CMP['Toggle'], 'On', 'True', 'False', null);
  await pairVariants(CMP['Toggle'], 'On', 'False', 'True', null);
  await pairVariants(CMP['Checkbox'], 'Checked', 'True', 'False', null);
  await pairVariants(CMP['Checkbox'], 'Checked', 'False', 'True', null);
  await pairVariants(CMP['Radio'], 'Selected', 'False', 'True', null);
  // sidebar collapse (⌘B)
  await pairVariants(CMP['Sidebar'], 'Collapsed', 'False', 'True', null, 'Collapse sidebar');
  await pairVariants(CMP['Sidebar'], 'Collapsed', 'True', 'False', null, 'Collapse sidebar');
  // small widgets
  const la = CMP['Library Action'];
  await addReaction(variantOf(la, { State: 'Install' }), changeTo(variantOf(la, { State: 'Installing' })));
  await addReaction(variantOf(la, { State: 'Installing' }), changeTo(variantOf(la, { State: 'Installed' }), after(1200)));
  await addReaction(variantOf(la, { State: 'Installed' }), changeTo(variantOf(la, { State: 'Remove' }), HOVER));
  await addReaction(variantOf(la, { State: 'Remove' }), changeTo(variantOf(la, { State: 'Install' })));
  const stt = CMP['Server Test'];
  await addReaction(variantOf(stt, { State: 'Idle' }).findOne(n => n.name === 'Test button'), changeTo(variantOf(stt, { State: 'Testing' })));
  await addReaction(variantOf(stt, { State: 'Testing' }), changeTo(variantOf(stt, { State: 'OK' }), after(1400)));
  await addReaction(variantOf(stt, { State: 'OK' }).findOne(n => n.name === 'Test button'), changeTo(variantOf(stt, { State: 'Testing' })));
  const fw = CMP['Find Widget'];
  for (const m of ['1', '2']) {
    const v = variantOf(fw, { Match: m }), o = variantOf(fw, { Match: m === '1' ? '2' : '1' });
    await addReaction(v.findOne(n => n.name === 'Next match'), changeTo(o));
    await addReaction(v.findOne(n => n.name === 'Previous match'), changeTo(o));
  }
  await wireSelects();
  for (const k of ['Help Style', 'Theme Choice', 'Mode Choice']) if (CMP[k]) await wireChoiceGroup(CMP[k]);
}

// ---------------------------------------------------------------- stacking for things that overflow
// Dropdowns, tooltips and the Blockly flyout draw outside their own box. Auto layout normally
// stacks later children on top, which would hide them, so every auto-layout frame is set to
// "first on top" (itemReverseZIndex). Siblings in auto layout never overlap, so that changes
// nothing else; absolute children keep their look: backgrounds go to the bottom, overlays on top.
function stackForOverflow(root) {
  const walk = (n) => {
    if (!n || n.type === 'INSTANCE' || n.removed) return;
    if ((n.type === 'FRAME' || n.type === 'COMPONENT') && n.layoutMode && n.layoutMode !== 'NONE' && !n.itemReverseZIndex) {
      const kids = n.children.slice();
      const flowIdx = kids.map((k, i) => (k.layoutPositioning === 'ABSOLUTE' ? -1 : i)).filter(i => i >= 0);
      const first = flowIdx.length ? flowIdx[0] : kids.length, last = flowIdx.length ? flowIdx[flowIdx.length - 1] : -1;
      n.itemReverseZIndex = true;
      const bgs = kids.filter((k, i) => k.layoutPositioning === 'ABSOLUTE' && i < first);
      const ovs = kids.filter((k, i) => k.layoutPositioning === 'ABSOLUTE' && i > last);
      // reversed stacking: index 0 is on top. Backgrounds: bottom-most first → append in order at the end, reversed.
      for (const b of bgs.slice().reverse()) n.appendChild(b);
      // overlays: the one that was on top (last) goes to index 0
      ovs.forEach((o, i) => n.insertChild(i, o));
      ovs.reverse().forEach((o, i) => n.insertChild(i, o));
      REPORT.counts.stacked = (REPORT.counts.stacked || 0) + 1;
    }
    if ('children' in n) for (const c of n.children.slice()) walk(c);
  };
  if (root.type === 'COMPONENT_SET') for (const v of root.children) walk(v); else walk(root);
}
