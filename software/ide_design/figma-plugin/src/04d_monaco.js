// ============================================================================
// Monaco editor (the VS Code editor) themed with the RoboCore tokens: the parts
// of the code view that come from Monaco, drawn the way Monaco lays them out.
// Gutter = glyph margin (error / lightbulb) + line numbers + folding; overview
// ruler and scrollbar on the right; minimap off. Widgets: suggest (IntelliSense),
// parameter hints, hover, error hover, code actions (Quick Fix), find.
// ============================================================================

const MO = { LH: 20, CW: 7.8, TOP: 14, LEFT: 8, GLYPH: 18, NUMS: 34, FOLD: 14, RULER: 14 };
// position of a character inside the text area
const mx = (col) => MO.LEFT + col * MO.CW;
const my = (line) => MO.TOP + (line - 1) * MO.LH;

// o: { name, activeLine, cursor:{line,col}, error:{line,col,len,lineLen}, lightbulb, matches:[[line,col,len]],
//      typed:{line,text}, small, folding, ruler, wSize, hSize, grow }
function monacoView(parent, code, o = {}) {
  const lines = code.split('\n');
  const view = box({ name: o.name || 'Monaco editor', dir: 'H', gap: 0, parent, fill: 'color/bg/editor', clip: true, hSize: o.hSize, grow: o.grow });
  if (o.wSize === 'fill' && isAL(parent)) view.layoutSizingHorizontal = 'FILL';
  // gutter: glyph margin | line numbers | folding
  const gut = box({ name: 'Gutter', dir: 'H', gap: 0, parent: view, hSize: 'fill' });
  const glyph = box({ name: 'Glyph margin', w: MO.GLYPH, parent: gut, hSize: 'fill' });
  const numsCol = box({ name: 'Line numbers', dir: 'V', pad: [MO.TOP, 4, MO.TOP, 0], w: MO.NUMS, parent: gut, hSize: 'fill', cross: 'end' });
  const nums = lines.map((_, i) => String(i + 1)).join('\n');
  const nt = txt(nums, { style: 'Code/Default', color: 'color/syntax/line-number', parent: numsCol, name: 'Numbers', align: 'RIGHT' });
  if (o.activeLine) {
    const idx = nums.split('\n').slice(0, o.activeLine - 1).join('\n').length + (o.activeLine > 1 ? 1 : 0);
    nt.setRangeFills(idx, idx + String(o.activeLine).length, [paint('color/syntax/line-number-active')]);
  }
  const fold = box({ name: 'Folding', w: MO.FOLD, parent: gut, hSize: 'fill' });
  if (o.folding !== false) lines.forEach((l, i) => { if (/\{\s*$/.test(l)) { const f = iconInst('chevron-down', fold, 'color/icon/muted', 12); f.name = 'Fold line ' + (i + 1); f.x = 1; f.y = my(i + 1) + 4; } });
  // text
  const area = box({ name: 'Text area', dir: 'V', gap: 0, pad: [MO.TOP, 16, MO.TOP, MO.LEFT], parent: view, grow: true, hSize: 'fill' });
  area.clipsContent = false;
  if (o.activeLine) {
    const cl = rect({ name: 'Current line', w: 2000, h: MO.LH, fill: 'color/brand/soft', parent: area, abs: true, x: 0, y: my(o.activeLine) });
    cl.strokes = [paint('color/border/subtle')]; cl.strokeWeight = 1; cl.strokeAlign = 'INSIDE';
  }
  for (const [ln, col, len] of o.matches || []) rect({ name: 'Find match ' + ln, w: len * MO.CW + 2, h: MO.LH - 2, radius: 2, fill: 'color/brand/default', fillOpacity: ln === (o.currentMatch || -1) ? 0.55 : 0.28, parent: area, abs: true, x: mx(col) - 1, y: my(ln) + 1 });
  // indent guides: one per indent level inside braces
  let depth = 0;
  lines.forEach((l, i) => {
    const d = l.trim().startsWith('}') ? depth - 1 : depth;
    for (let k = 1; k <= d; k++) rect({ name: 'Indent guide', w: 1, h: MO.LH, fill: 'color/border/subtle', parent: area, abs: true, x: mx((k - 1) * 2) , y: my(i + 1) });
    depth += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
  });
  const t = txt(code, { style: o.small ? 'Code/Small' : 'Code/Default', color: 'color/syntax/plain', parent: area, name: 'Code' });
  highlight(t, code);
  if (o.cursor) rect({ name: 'Caret', w: 2, h: 18, fill: 'color/ink/default', parent: area, abs: true, x: mx(o.cursor.col), y: my(o.cursor.line) + 1 });
  if (o.error) {
    const e = o.error, y0 = my(e.line);
    const sq = figma.createVector(); sq.name = 'Error squiggle';
    let d = 'M 0 2'; for (let x = 0; x < e.len * MO.CW; x += 4) d += ' L ' + (x + 2) + ' ' + ((x / 4) % 2 ? 2 : 0) + ' L ' + (x + 4) + ' ' + ((x / 4) % 2 ? 0 : 2);
    sq.vectorPaths = [{ windingRule: 'NONE', data: d }]; sq.strokes = [paint('color/border/ink')]; sq.strokeWeight = 1.2; sq.fills = [];
    area.appendChild(sq); sq.layoutPositioning = 'ABSOLUTE'; sq.x = mx(e.col); sq.y = y0 + 16;
    const hs = rect({ name: 'Error word', w: e.len * MO.CW, h: MO.LH, parent: area, abs: true, x: mx(e.col), y: y0 });
    hs.fills = [];
    const gm = iconInst('alert-triangle', glyph, 'color/icon/strong', 14); gm.name = 'Error marker'; gm.x = 2; gm.y = y0 + 3;
    if (o.lightbulb !== false) {
      const lb = box({ name: 'Lightbulb', dir: 'H', w: 18, h: 18, align: 'center', cross: 'center', radius: 4, fill: 'color/brand/default', parent: area, abs: true, x: -2, y: y0 + 1 });
      iconSlot(lb, 'lightbulb', 'color/icon/on-bright', 13, 'Icon');
    }
    if (e.lens) { const l = inst('Explain Lens', null, area, { name: 'Explain lens', abs: true }); l.x = mx(e.lineLen) + 16; l.y = y0 - 1; }
  }
  // overview ruler (right) with marks and the scrollbar slider
  if (o.ruler !== false) {
    const ru = box({ name: 'Overview ruler', w: MO.RULER, parent: view, hSize: 'fill', stroke: 'color/border/subtle', sides: { l: 1 } });
    const slider = rect({ name: 'Scrollbar slider', w: MO.RULER - 4, h: 180, radius: 3, fill: 'color/border/default', parent: ru, x: 2, y: 2 });
    slider.opacity = 0.8;
    if (o.activeLine) rect({ name: 'Cursor mark', w: MO.RULER - 2, h: 2, fill: 'color/ink/default', parent: ru, x: 1, y: Math.round(o.activeLine * 14) });
    if (o.error) rect({ name: 'Error mark', w: MO.RULER - 6, h: 6, fill: 'color/ink/default', parent: ru, x: 3, y: Math.round(o.error.line * 14) });
    for (const [ln] of o.matches || []) rect({ name: 'Match mark', w: MO.RULER - 6, h: 3, fill: 'color/brand/default', parent: ru, x: 3, y: Math.round(ln * 14) });
  }
  return view;
}

// ---------------------------------------------------------------- banner above the editor
function buildCodeBanner(parent) {
  const comps = [];
  for (const st of ['Generated', 'Edited', 'Code']) {
    const c = comp('State=' + st);
    al(c, { gap: 10, pad: [0, 8, 0, 12], w: 900, h: 36, cross: 'center', fill: st === 'Edited' ? 'color/brand/tint' : 'color/bg/subtle' });
    iconSlot(c, st === 'Edited' ? 'alert-triangle' : (st === 'Code' ? 'code' : 'blocks'), 'color/icon/strong', 16, 'Icon');
    txt({ Generated: 'Generated from your blocks. If you type here, this file becomes C++ and the blocks stop changing it.', Edited: 'You edited this file, so the blocks no longer change it.', Code: 'C++ project. Ctrl+Space shows suggestions; Ctrl+F finds; Ctrl+. offers quick fixes.' }[st], { style: 'Label/Default', parent: c, name: 'Message', grow: true, truncate: true });
    if (st === 'Edited') { const b = inst('Button', { Variant: 'Secondary', State: 'Default' }, c, { name: 'Rebuild from blocks' }); setProp(b, 'Label', 'Rebuild from blocks'); setProp(b, 'Icon', ICON['refresh'].id); b.resize(b.width, 28); }
    comps.push(c);
  }
  CMP['Code Banner'] = makeSet(comps, 'Code Banner', parent, 1, 'Strip above the editor. Generated: the C++ follows the blocks. Edited: a person typed in the main file, so the blocks stop driving it until “Rebuild from blocks”. Code: a C++-only project.');
}

// ---------------------------------------------------------------- widgets
function widget(parent, name, w) {
  return box({ name, dir: 'V', gap: 0, w, fill: 'color/bg/raised', radius: 6, stroke: 'color/border/default', effect: 'Elevation/Popover', parent, clip: true });
}
function kindTile(parent, k) {
  const t = box({ name: 'Kind', dir: 'H', w: 16, h: 16, align: 'center', cross: 'center', radius: 3, fill: k === 'f' ? 'color/ink/default' : 'color/bg/subtle', parent });
  txt(k === 'f' ? 'ƒ' : (k === 'c' ? 'c' : '{}'), { style: 'Code/Small', color: k === 'f' ? 'color/text/on-ink' : 'color/text/primary', parent: t, name: 'Glyph' });
  return t;
}
// suggest widget (IntelliSense) for "digi"
const SUGGEST = [
  ['f', 'digitalWrite', '(pin, value)  void'],
  ['f', 'digitalRead', '(pin)  int'],
  ['f', 'digitalPinToInterrupt', '(pin)  int'],
  ['s', 'digitalWrite HIGH/LOW', 'snippet'],
];
function monacoSuggest(parent, typed) {
  const row = box({ name: 'Suggest widget', dir: 'H', gap: 0, parent, cross: 'start' });
  const list = widget(row, 'Suggestions', 400);
  SUGGEST.forEach(([k, label, detail], i) => {
    const r = box({ name: 'Suggestion ' + label, dir: 'H', gap: 8, pad: [0, 10, 0, 8], h: 26, cross: 'center', fill: i === 0 ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
    kindTile(r, k);
    const t = txt(label, { style: 'Code/Small', parent: r, name: 'Label', grow: true });
    POST.push(() => t.setRangeFontName(0, Math.min(typed.length, label.length), PICK(FONT_MONO, 'Bold')));
    txt(detail, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Detail' });
  });
  const doc = widget(row, 'Suggestion details', 280);
  const db = box({ name: 'Body', dir: 'V', gap: 6, pad: 10, parent: doc, wSize: 'fill' });
  txt('void digitalWrite(uint8_t pin, uint8_t val)', { style: 'Code/Small', parent: db, name: 'Signature', fill: true });
  txt('Sets a digital pin HIGH or LOW. On the RoboCore V2, LED_BUILTIN is the RGB LED (it lights white).', { style: 'Body/Small', color: 'color/text/secondary', parent: db, name: 'Doc', fill: true });
  txt('Enter or Tab to insert · Esc to close', { style: 'Caption/Default', color: 'color/text/tertiary', parent: db, name: 'Keys', fill: true });
  return row;
}
function monacoParams(parent) {
  const w = widget(parent, 'Parameter hints', 430);
  const b = box({ name: 'Body', dir: 'V', gap: 4, pad: [8, 10, 8, 10], parent: w, wSize: 'fill' });
  const s = txt('digitalWrite(uint8_t pin, uint8_t val)', { style: 'Code/Small', parent: b, name: 'Signature', fill: true });
  POST.push(() => s.setRangeFontName(13, 24, PICK(FONT_MONO, 'Bold')));
  txt('pin: the pin number, e.g. LED_BUILTIN or RC_PIN_EXP_IO3.', { style: 'Body/Small', color: 'color/text/secondary', parent: b, name: 'Doc', fill: true });
  return w;
}
function monacoHover(parent, sig, doc) {
  const w = widget(parent, 'Hover', 380);
  const s = box({ name: 'Signature', dir: 'V', pad: [8, 10, 8, 10], parent: w, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  txt(sig, { style: 'Code/Small', parent: s, name: 'Code', fill: true });
  const b = box({ name: 'Body', dir: 'V', gap: 6, pad: [8, 10, 10, 10], parent: w, wSize: 'fill' });
  txt(doc, { style: 'Body/Small', color: 'color/text/secondary', parent: b, name: 'Doc', fill: true });
  txt('Arduino reference →', { style: 'Label/Strong', parent: b, name: 'Reference link' });
  return w;
}
function monacoErrorHover(parent) {
  const w = widget(parent, 'Error hover', 440);
  const b = box({ name: 'Body', dir: 'V', gap: 4, pad: [10, 12, 10, 12], parent: w, wSize: 'fill' });
  const h = box({ name: 'Message row', dir: 'H', gap: 8, cross: 'start', parent: b, wSize: 'fill' });
  iconSlot(h, 'alert-triangle', 'color/icon/strong', 16, 'Icon');
  txt("'digitalwrite' was not declared in this scope; did you mean 'digitalWrite'?", { style: 'Body/Small', parent: h, name: 'Message', grow: true });
  txt('arduino-cli · Blink.ino 11:3', { style: 'Caption/Default', color: 'color/text/tertiary', parent: b, name: 'Source' });
  const a = box({ name: 'Actions', dir: 'H', gap: 16, pad: [8, 12, 8, 12], parent: w, wSize: 'fill', fill: 'color/bg/subtle' });
  for (const [n, l] of [['View problem', 'View problem'], ['Quick fix', 'Quick Fix… Ctrl+.'], ['Explain with Cog', 'Explain with Cog']]) txt(l, { style: 'Label/Strong', parent: a, name: n });
  return w;
}
function monacoCodeActions(parent) {
  const m = box({ name: 'Code actions', dir: 'V', gap: 0, pad: 4, w: 300, fill: 'color/bg/raised', radius: 8, stroke: 'color/border/default', effect: 'Elevation/Popover', parent });
  txt('Quick Fix', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: box({ name: 'Header', dir: 'H', pad: [6, 10, 4, 10], parent: m }), name: 'Title' });
  for (const [label, icon] of [["Change spelling to 'digitalWrite'", 'pencil'], ['Explain with Cog', 'sparkles']]) {
    const r = inst('Menu Item', { State: 'Default' }, m, { name: 'Action ' + label });
    setProp(r, 'Label', label); setProp(r, 'Icon', ICON[icon].id); setProp(r, 'Show check', false);
    r.layoutSizingHorizontal = 'FILL';
  }
  return m;
}
