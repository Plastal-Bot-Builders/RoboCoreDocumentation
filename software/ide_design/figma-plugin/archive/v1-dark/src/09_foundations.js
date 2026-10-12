// ============================================================================
// 01 — Foundations documentation page
// ============================================================================

function hexOfSemantic(name) {
  const s = SEMANTIC.find(x => x[0] === name);
  if (!s) return '';
  return (PRIMITIVES[s[1]] || '').toUpperCase();
}
function swatch(parent, name, label, note, o = {}) {
  const c = box({ name: 'Swatch ' + name, dir: 'V', gap: 6, w: o.w || 168, parent });
  const tile = box({ name: 'Tile', dir: 'V', h: o.h || 72, radius: 10, fill: name, parent: c, wSize: 'fill', stroke: 'color/border/default', pad: 10, align: 'end' });
  if (o.sample) txt(o.sample, { style: 'Label/Strong', color: o.sampleColor || 'color/text/primary', parent: tile, name: 'Sample' });
  txt(label || name.split('/').slice(1).join('/'), { style: 'Label/Strong', parent: c, name: 'Name' });
  txt(name + '  ' + hexOfSemantic(name), { style: 'Code/Small', color: 'color/text/tertiary', parent: c, name: 'Token', fill: true });
  if (note) txt(note, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Note', fill: true });
  return c;
}
function docSection(parent, overline, title, desc) {
  const s = box({ name: 'Section — ' + title, dir: 'V', gap: 24, pad: 40, parent, wSize: 'fill', fill: 'color/bg/chrome', radius: 16, stroke: 'color/border/subtle' });
  docHeader(s, overline, title, desc, 1100);
  return s;
}
function group(parent, title) {
  const g = box({ name: 'Group ' + title, dir: 'V', gap: 12, parent, wSize: 'fill' });
  txt(title, { style: 'Heading/H3', color: 'color/text/secondary', parent: g, name: 'Group title' });
  const row = box({ name: 'Items', dir: 'H', wrap: true, gap: 16, rowGap: 20, parent: g, wSize: 'fill' });
  return row;
}

function buildFoundations(page) {
  const root = box({ name: 'Foundations', dir: 'V', gap: 40, pad: 64, w: 2000, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;

  // ---------------- Cover
  const cover = box({ name: 'Cover', dir: 'H', gap: 48, pad: 56, parent: root, wSize: 'fill', fill: 'color/bg/chrome', radius: 20, stroke: 'color/border/subtle', cross: 'start' });
  const cl = box({ name: 'Cover text', dir: 'V', gap: 20, parent: cover, grow: true });
  const lock = CMP['Logo/Product Lockup'].createInstance(); cl.appendChild(lock); lock.rescale(2);
  txt('Design system & UI for a robotics programming environment', { style: 'Heading/Display', parent: cl, name: 'Title', w: 900 });
  const tg = txt('Build. Code. Create.', { style: 'Heading/H1', color: 'color/text/primary', parent: cl, name: 'Tagline' });
  tg.setRangeFills(0, 6, [paint('color/brand/default')]); tg.setRangeFills(7, 12, [paint('color/accent/default')]);
  txt('RoboCore IDE brings visual block programming (Tinkercad-style), Arduino-style C++ and hardware tools — board setup, upload, serial monitor — into one dark, engineering-grade workspace. Approachable for first-time learners, efficient for makers.', { style: 'Body/Default', color: 'color/text/secondary', parent: cl, name: 'Intro', w: 900 });
  const meta = box({ name: 'Meta', dir: 'H', gap: 8, parent: cl });
  for (const [t, tone] of [['v0.1 · design phase', 'Brand'], ['10 Oct 2026', 'Neutral'], ['Desktop 1440 × 1000', 'Neutral'], ['Dark theme', 'Success']]) { const b = inst('Badge', { Tone: tone }, meta, { name: 'Meta ' + t }); setProp(b, 'Label', t); setProp(b, 'Show dot', false); }
  const idx = box({ name: 'File index', dir: 'V', gap: 10, w: 520, pad: 24, radius: 14, fill: 'color/bg/panel', stroke: 'color/border/subtle', parent: cover });
  txt('IN THIS FILE', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: idx, name: 'Overline' });
  for (const [p, d] of [['01 — Foundations', 'Principles, colour, type, spacing, elevation, layout, states, motion, accessibility'], ['02 — Components', 'Variables-bound components with variants: controls, navigation, tabs, board + connection, feedback, blocks, cards, app chrome'], ['03 — Main IDE', 'Blocks and Code modes plus build, upload, board and dialog states'], ['04 — Additional Screens', 'Home, Projects, Examples, Libraries, Board Setup, Serial Monitor, Settings, empty states'], ['05 — Prototype', 'Clickable flows: open project, switch modes, board selector, console, examples, project settings']]) {
    const r = box({ name: 'Index ' + p, dir: 'V', gap: 2, parent: idx, wSize: 'fill' });
    txt(p, { style: 'Label/Strong', parent: r, name: 'Page' });
    txt(d, { style: 'Body/Small', color: 'color/text/tertiary', parent: r, name: 'Desc', fill: true });
  }

  // ---------------- Principles
  const pr = docSection(root, 'Foundations', 'Design principles', 'Five rules every screen in RoboCore IDE follows.');
  const prow = box({ name: 'Principles', dir: 'H', gap: 16, parent: pr, wSize: 'fill' });
  for (const [ic, t, d] of [['blocks', 'Workspace first', 'The block canvas or editor is always the largest, calmest area. Chrome is compact (56px header, 28px status).'], ['graduation', 'Approachable, not childish', 'Plain language, visible labels and category colours for learners; real C++ and shortcuts for makers.'], ['plug', 'Honest hardware state', 'Never show Connected, Uploaded or device data that did not come from a real board. Demo data is always labelled.'], ['code', 'Familiar to Arduino users', 'Verify / Upload / Serial Monitor, board + port selection and sketch tabs work the way Arduino IDE users expect.'], ['check-circle', 'Consistent & accessible', 'One token set, AA contrast, visible focus rings, keyboard paths and tooltips on every icon-only control.']]) {
    const c = box({ name: 'Principle ' + t, dir: 'V', gap: 10, pad: 20, radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle', parent: prow, grow: true });
    const tl = box({ name: 'Icon tile', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 10, fill: 'color/accent/subtle', parent: c });
    iconSlot(tl, ic, 'color/icon/active', 20, 'Icon');
    txt(t, { style: 'Heading/H3', parent: c, name: 'Title' });
    txt(d, { style: 'Body/Small', color: 'color/text/secondary', parent: c, name: 'Desc', fill: true });
  }

  // ---------------- Colour
  const col = docSection(root, 'Foundations', 'Colour', 'All colours are variables (collection “Color”, mode Dark) aliased to hidden primitives. Teal = active, success, primary action. Yellow = RoboCore brand emphasis. Block categories keep distinct hues so learners can match blocks to the palette.');
  let g = group(col, 'Brand & accent');
  swatch(g, 'color/brand/default', 'Brand yellow', 'Logo, brand highlights, unsaved dot, learning path', { sample: 'RoboCore', sampleColor: 'color/text/on-accent' });
  swatch(g, 'color/brand/hover', 'Brand hover', null);
  swatch(g, 'color/brand/subtle', 'Brand subtle', 'Tinted brand surfaces');
  swatch(g, 'color/accent/default', 'Teal accent', 'Primary buttons, active states, success, connected', { sample: 'Upload', sampleColor: 'color/text/on-accent' });
  swatch(g, 'color/accent/hover', 'Teal hover', null);
  swatch(g, 'color/accent/pressed', 'Teal pressed', null);
  swatch(g, 'color/accent/subtle', 'Teal subtle', 'Selected nav / segments');
  swatch(g, 'color/accent/muted', 'Teal muted', 'Borders on active items');
  g = group(col, 'Surfaces (dark → light)');
  for (const [n, l, d] of [['color/bg/console', 'Console', 'Serial / compiler output'], ['color/bg/app', 'App', 'Behind panels'], ['color/bg/editor', 'Editor & canvas', 'Code editor, blocks canvas'], ['color/bg/chrome', 'Chrome — deep navy', 'Top bar, sidebar, status bar'], ['color/bg/input', 'Input', 'Fields, selects'], ['color/bg/panel', 'Panel', 'Panels and cards'], ['color/bg/raised', 'Raised', 'Menus, flyout, toasts'], ['color/bg/hover', 'Hover', 'Hovered rows'], ['color/bg/selected', 'Selected', 'Active items']]) swatch(g, n, l, d);
  g = group(col, 'Text, icons & borders');
  for (const [n, l, d] of [['color/text/primary', 'Text primary', '15.9:1 on panel'], ['color/text/secondary', 'Text secondary', '8.0:1 on panel'], ['color/text/tertiary', 'Text tertiary', '5.0:1 on panel'], ['color/text/disabled', 'Text disabled', 'Non-essential only'], ['color/border/subtle', 'Border subtle', 'Dividers'], ['color/border/default', 'Border default', 'Inputs, cards'], ['color/border/strong', 'Border strong', 'Hover'], ['color/border/focus', 'Focus', 'Focus ring (+ Focus/Ring effect)']]) swatch(g, n, l, d, { sample: n.indexOf('text') >= 0 ? 'Aa' : undefined, sampleColor: n.indexOf('text') >= 0 ? 'color/text/on-accent' : undefined });
  g = group(col, 'Status');
  for (const [n, l, d] of [['color/status/success', 'Success', 'Connected · compiled · uploaded'], ['color/status/warning', 'Warning', 'Warnings, connecting'], ['color/status/error', 'Error', 'Failed, destructive'], ['color/status/info', 'Info', 'Information, upload progress']]) swatch(g, n, l, d);
  g = group(col, 'Block categories (white label text ≥ 3:1, bold 13px)');
  for (const [cat, v] of BLOCK_CATS) {
    const sw = swatch(g, v, cat, null, { sample: 'set pin', sampleColor: 'color/block/text', w: 140 });
  }
  swatch(g, 'color/block/more', 'More / functions', null, { sample: 'define', sampleColor: 'color/block/text', w: 140 });
  g = group(col, 'Syntax (RoboCore Night)');
  const syn = box({ name: 'Syntax sample', dir: 'H', gap: 24, parent: g });
  codeView(syn, 'void loop() {\n  // read the sonar\n  int cm = sonar.distanceCm();\n  if (cm < 20) {\n    digitalWrite(LED_BUILTIN, HIGH);\n    Serial.println("obstacle");\n  }\n}', { name: 'Syntax code', w: 520, h: 200 });
  const leg = box({ name: 'Legend', dir: 'V', gap: 8, parent: syn });
  for (const [v, l] of [['color/syntax/keyword', 'Keyword — if, for, while, const'], ['color/syntax/type', 'Type — void, int, Serial'], ['color/syntax/function', 'Function — digitalWrite, delay'], ['color/syntax/constant', 'Constant & number — HIGH, LED_BUILTIN, 20'], ['color/syntax/string', 'String'], ['color/syntax/comment', 'Comment'], ['color/syntax/preprocessor', 'Preprocessor — #include']]) {
    const r = box({ name: 'Legend ' + l, dir: 'H', gap: 8, cross: 'center', parent: leg });
    box({ name: 'Chip', w: 12, h: 12, radius: 3, fill: v, parent: r });
    txt(l, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Label' });
  }

  // ---------------- Typography
  const ty = docSection(root, 'Foundations', 'Typography', 'Inter for UI, ' + FONT_MONO + ' for code and serial output, ' + FONT_BRAND + ' for the product wordmark. Minimum UI size 11px (overline only); body text 13–14px.');
  for (const [name, fk, style, size, lh, ls, tc, usage] of TEXT_STYLES) {
    const r = box({ name: 'Type ' + name, dir: 'H', gap: 24, pad: [12, 0, 12, 0], cross: 'center', parent: ty, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    const meta = box({ name: 'Meta', dir: 'V', gap: 2, w: 320, parent: r });
    txt(name, { style: 'Label/Strong', parent: meta, name: 'Style' });
    txt(TS[name].font.family + ' ' + TS[name].font.style + ' · ' + size + '/' + lh + (ls ? ' · ' + ls + '%' : ''), { style: 'Code/Small', color: 'color/text/tertiary', parent: meta, name: 'Spec' });
    const sample = name.indexOf('Code') === 0 ? 'digitalWrite(LED_BUILTIN, HIGH);' : (name.indexOf('Block') === 0 ? 'set built-in LED to HIGH' : (name === 'Brand/Wordmark' ? 'RoboCore IDE' : (name === 'Caption/Overline' ? 'Hardware' : 'Build, code and create with RoboCore')));
    txt(sample, { style: name, parent: r, name: 'Sample', color: name === 'Brand/Wordmark' ? 'color/brand/default' : 'color/text/primary', grow: true });
    txt(usage, { style: 'Body/Small', color: 'color/text/tertiary', parent: r, name: 'Usage', w: 300 });
  }

  // ---------------- Spacing, radius, elevation
  const sp = docSection(root, 'Foundations', 'Spacing, radius & elevation', '4px base grid. Spacing variables bind padding and gaps; radius variables bind corners. Panels use 12px radius, controls 8px, pills full.');
  const sr = box({ name: 'Spacing + radius', dir: 'H', gap: 64, parent: sp, wSize: 'fill' });
  const spc = box({ name: 'Spacing scale', dir: 'V', gap: 10, parent: sr });
  for (const [n, v] of DIMENSIONS.filter(d => d[0].indexOf('spacing/') === 0 && d[1] > 0)) {
    const r = box({ name: 'Space ' + n, dir: 'H', gap: 16, cross: 'center', parent: spc });
    txt(n, { style: 'Code/Small', color: 'color/text/secondary', parent: r, name: 'Token', w: 120 });
    rect({ name: 'Bar', w: v * 4, h: 12, radius: 2, fill: 'color/accent/default', parent: r, opacity: 0.85 });
    txt(v + 'px', { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Value' });
  }
  const rad = box({ name: 'Radius scale', dir: 'H', gap: 24, cross: 'end', parent: sr });
  for (const [n, v] of DIMENSIONS.filter(d => d[0].indexOf('radius/') === 0)) {
    const c = box({ name: 'Radius ' + n, dir: 'V', gap: 8, cross: 'center', parent: rad });
    const t = rect({ name: 'Sample', w: 72, h: 72, radius: Math.min(v, 36), fill: 'color/bg/raised', parent: c }); t.strokes = [paint('color/border/strong')]; t.strokeWeight = 1;
    txt(n + ' · ' + (v === 999 ? 'full' : v + 'px'), { style: 'Code/Small', color: 'color/text/secondary', parent: c, name: 'Label' });
  }
  const el = box({ name: 'Elevation', dir: 'H', gap: 32, pad: [24, 0, 8, 0], parent: sp, wSize: 'fill' });
  for (const [n, d] of [['Elevation/1 Raised', 'Cards on hover'], ['Elevation/2 Popover', 'Menus, flyouts, toasts'], ['Elevation/3 Modal', 'Dialogs (with 72% scrim)'], ['Elevation/Drag', 'Block being dragged'], ['Focus/Ring', 'Keyboard focus']]) {
    const c = box({ name: n, dir: 'V', gap: 6, pad: 20, w: 220, h: 120, radius: 12, fill: 'color/bg/raised', parent: el, effect: n, stroke: n === 'Focus/Ring' ? 'color/border/focus' : undefined, align: 'end' });
    txt(n, { style: 'Label/Strong', parent: c, name: 'Name' });
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Desc' });
  }

  // ---------------- Iconography
  const ic = docSection(root, 'Foundations', 'Iconography', 'Lucide icons (ISC licence) on a 24px grid, drawn at 20px with a 2px stroke (16px in buttons and tabs). Stroke colour is bound to color/icon/* variables. Icon-only buttons always get a tooltip and an accessible label.');
  const ir = box({ name: 'Icon sample', dir: 'H', wrap: true, gap: 20, rowGap: 20, parent: ic, wSize: 'fill' });
  for (const n of Object.keys(ICON).slice(0, 48)) {
    const c = box({ name: 'Icon ' + n, dir: 'V', gap: 6, w: 76, cross: 'center', parent: ir });
    const t = box({ name: 'Tile', dir: 'H', w: 48, h: 48, align: 'center', cross: 'center', radius: 10, fill: 'color/bg/panel', stroke: 'color/border/subtle', parent: c });
    iconInst(n, t);
    txt(n, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Name', truncate: true });
  }

  // ---------------- Layout
  const ly = docSection(root, 'Foundations', 'Layout & responsive behaviour', 'Desktop-first 1440 × 1000 frame. The programming workspace is always the visual centre; chrome is compact and collapsible.');
  const lr = box({ name: 'Layout row', dir: 'H', gap: 48, parent: ly, wSize: 'fill', cross: 'start' });
  const sch = box({ name: 'Layout schematic', w: 720, h: 500, radius: 12, fill: 'color/bg/app', stroke: 'color/border/default', parent: lr, clip: true });
  const region = (n, x, y, w, h, fillV, label) => {
    const r = box({ name: 'Region ' + n, dir: 'V', gap: 2, pad: 8, w, h, radius: 6, fill: fillV, stroke: 'color/border/strong', parent: sch, align: 'center', cross: 'center' });
    r.x = x; r.y = y;
    txt(n, { style: 'Label/Strong', parent: r, name: 'Region name', align: 'CENTER' });
    if (label) txt(label, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Region size', align: 'CENTER' });
  };
  region('Top bar · 56px · logo, project, board, Verify / Upload', 0, 0, 720, 36, 'color/bg/chrome', null);
  region('Sidebar', 0, 36, 108, 436, 'color/bg/chrome', '216 / 64px');
  region('Workspace', 114, 42, 600, 300, 'color/bg/panel', 'Mode switch · Blocks or Code · fills remaining space');
  region('Utility panel', 114, 348, 446, 118, 'color/bg/panel', 'Serial · Output · Problems · 236px / 40px collapsed');
  region('Board info', 566, 348, 148, 118, 'color/bg/panel', '296px');
  region('Status bar · 28px', 0, 472, 720, 28, 'color/bg/chrome', null);
  const rules = box({ name: 'Responsive rules', dir: 'V', gap: 14, parent: lr, grow: true });
  for (const [bp, rule] of [['≥ 1440', 'Default: sidebar expanded (216), toolbox 168 + flyout 304, optional 360px code preview, bottom panel 236 with board card.'], ['1280 – 1439', 'Sidebar collapses to 64px icons (labels as tooltips). Code preview overlays the canvas instead of splitting it.'], ['1024 – 1279', 'Board card moves into a “Board” tab of the utility panel. Flyout closes after a block is dropped.'], ['< 1024', 'Stacked: workspace on top, panel as a bottom sheet. Toolbar keeps Verify / Upload; other actions move to the More menu. Not optimised for phones.'], ['Always', 'No horizontal page scroll. Editor and canvas scroll internally. Panels resize with a 6px drag handle; double-click to collapse.']]) {
    const r = box({ name: 'Rule ' + bp, dir: 'H', gap: 16, parent: rules, wSize: 'fill' });
    const b = inst('Badge', { Tone: 'Info' }, r, { name: 'Breakpoint' }); setProp(b, 'Label', bp); setProp(b, 'Show dot', false);
    txt(rule, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Rule', grow: true });
  }

  // ---------------- States
  const st = docSection(root, 'Foundations', 'Interaction states', 'Every interactive component has Default, Hover, Pressed/Active, Focus and Disabled. Focus = 1px teal border + 3px teal ring (Focus/Ring). Disabled controls explain why in a tooltip.');
  for (const variant of ['Primary', 'Secondary', 'Ghost', 'Danger']) {
    const r = box({ name: 'States ' + variant, dir: 'H', gap: 24, cross: 'center', parent: st });
    txt(variant, { style: 'Label/Strong', color: 'color/text/secondary', parent: r, name: 'Variant', w: 100 });
    for (const state of ['Default', 'Hover', 'Pressed', 'Focus', 'Disabled']) {
      const c = box({ name: 'State ' + state, dir: 'V', gap: 8, w: 140, parent: r });
      const b = inst('Button', { Variant: variant, State: state }, c, { name: 'Button' }); setProp(b, 'Label', variant === 'Danger' ? 'Delete' : (variant === 'Primary' ? 'Upload' : 'Verify'));
      setProp(b, 'Icon', ICON[variant === 'Danger' ? 'trash' : (variant === 'Primary' ? 'arrow-right' : 'check')].id);
      txt(state, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'State label' });
    }
  }

  // ---------------- Motion + accessibility
  const ma = docSection(root, 'Foundations', 'Motion, accessibility & honest hardware states', 'Motion is quick and functional. Accessibility targets WCAG 2.1 AA. Hardware states must always reflect reality.');
  const mr = box({ name: 'Three columns', dir: 'H', gap: 24, parent: ma, wSize: 'fill', cross: 'start' });
  const colA = box({ name: 'Motion', dir: 'V', gap: 10, parent: mr, grow: true, pad: 20, radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
  txt('Motion', { style: 'Heading/H3', parent: colA, name: 'Title' });
  for (const [k, v] of [['Hover / press', '120 ms · ease-out'], ['Panels, flyout, sidebar', '200 ms · ease-out'], ['Mode switch (Smart Animate)', '250 ms · ease-out'], ['Toasts', 'in 200 ms, auto-dismiss 5 s (errors stay)'], ['Block snap', '80 ms + insertion marker'], ['Reduce motion', 'Disables slides; keeps fades ≤ 100 ms']]) {
    const r = box({ name: 'Motion ' + k, dir: 'H', gap: 8, parent: colA, wSize: 'fill' });
    txt(k, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Key', grow: true });
    txt(v, { style: 'Code/Small', color: 'color/text/primary', parent: r, name: 'Value' });
  }
  const colB = box({ name: 'Keyboard', dir: 'V', gap: 10, parent: mr, grow: true, pad: 20, radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
  txt('Keyboard shortcuts', { style: 'Heading/H3', parent: colB, name: 'Title' });
  for (const [k, v] of [['Verify', '⌘ R'], ['Upload', '⌘ U'], ['Stop operation', '⌘ .'], ['Save', '⌘ S'], ['Switch Blocks / Code', '⌘ E'], ['Toggle sidebar', '⌘ B'], ['Toggle bottom panel', '⌘ J'], ['Find in sketch', '⌘ F'], ['Command search', '⌘ K'], ['Toolbox: move / insert block', '↑ ↓ / Enter']]) {
    const r = box({ name: 'Key ' + k, dir: 'H', gap: 8, parent: colB, wSize: 'fill' });
    txt(k, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Key', grow: true });
    const kb = box({ name: 'Kbd', dir: 'H', pad: [0, 6, 0, 6], h: 20, cross: 'center', radius: 4, fill: 'color/bg/raised', stroke: 'color/border/default', parent: r });
    txt(v, { style: 'Label/Small', color: 'color/text/primary', parent: kb, name: 'Shortcut' });
  }
  const colC = box({ name: 'Honesty', dir: 'V', gap: 10, parent: mr, grow: true, pad: 20, radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
  txt('Honest hardware states', { style: 'Heading/H3', parent: colC, name: 'Title' });
  for (const rule of ['Connected only when a serial session is open on a real port.', 'Progress bars show real esptool / avrdude progress — no fake timers.', 'Compile and upload results quote the toolchain output.', 'Values read from the device are tagged LIVE; profile values are not.', 'Sample serial output is labelled DEMO and never mixed with device data.', 'Unsupported features are hidden, not shown as disabled promises.']) {
    const r = box({ name: 'Rule', dir: 'H', gap: 8, cross: 'start', parent: colC, wSize: 'fill' });
    iconSlot(r, 'check', 'color/icon/active', 16, 'Icon');
    txt(rule, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Rule text', grow: true });
  }
  const colD = box({ name: 'A11y', dir: 'V', gap: 10, parent: mr, grow: true, pad: 20, radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
  txt('Accessibility checklist', { style: 'Heading/H3', parent: colD, name: 'Title' });
  for (const rule of ['Body text ≥ 4.5:1, large/bold labels ≥ 3:1 (block labels).', 'Status never relies on colour alone: dot + label.', 'Visible focus on every control; logical tab order: top bar → sidebar → workspace → panel.', 'Icon-only buttons: tooltip + aria-label.', 'Hit targets ≥ 32px in toolbars (40px nav items).', 'Blocks are keyboard-operable (Blockly keyboard navigation).']) {
    const r = box({ name: 'Rule', dir: 'H', gap: 8, cross: 'start', parent: colD, wSize: 'fill' });
    iconSlot(r, 'check', 'color/icon/active', 16, 'Icon');
    txt(rule, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Rule text', grow: true });
  }
  return root;
}
