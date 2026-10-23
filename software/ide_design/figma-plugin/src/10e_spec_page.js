// ============================================================================
// 07 — Behaviour Spec: every control, what it must do, and where to try it in
// the prototype (one row = one test case), plus the Blockly / Monaco handoff.
// The same data is written to docs/behaviour-spec.md by tools/spec_md.js.
// ============================================================================

function specTable(parent, cols, rows, o = {}) {
  const t = box({ name: o.name || 'Table', dir: 'V', gap: 0, radius: 10, clip: true, stroke: 'color/border/default', parent });
  const hr = box({ name: 'Header row', dir: 'H', gap: 0, fill: 'color/ink/default', parent: t });
  for (const [title, w] of cols) {
    const c = box({ name: 'Head ' + title, dir: 'V', pad: [10, 12, 10, 12], w, parent: hr });
    txt(title, { style: 'Label/Strong', color: 'color/text/on-ink', parent: c, name: 'Text', fill: true });
  }
  rows.forEach((r, i) => {
    const row = box({ name: 'Row ' + (r[0] || i + 1), dir: 'H', gap: 0, fill: i % 2 ? 'color/bg/app' : 'color/bg/panel', parent: t });
    r.forEach((cell, j) => {
      const c = box({ name: 'Cell', dir: 'V', gap: 4, pad: [9, 12, 9, 12], w: cols[j][1], parent: row, hSize: 'fill' });
      if (cell === '☐') { inst('Checkbox', { Checked: 'False' }, c, { name: 'Pass' }); return; }
      const mono = o.mono && o.mono.indexOf(j) >= 0;
      txt(String(cell), { style: j === 0 && o.strong !== false ? 'Label/Strong' : (mono ? 'Code/Small' : 'Body/Small'), color: j === 0 ? 'color/text/primary' : 'color/text/secondary', parent: c, name: 'Text', fill: true });
    });
  });
  return t;
}
function buildSpecPage(page) {
  const root = box({ name: 'Behaviour spec', dir: 'V', gap: 40, pad: 64, w: 1640, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;
  const hd = box({ name: 'Header', dir: 'V', gap: 10, parent: root, wSize: 'fill' });
  txt('Behaviour spec & handoff', { style: 'Heading/Display', parent: hd, name: 'Title' });
  txt('Every control in the RoboCore IDE, what it must do, and where to try it in the prototype (page 05). Each row is a test case: run it in the prototype now, and on the built app later. Blocks are Google Blockly; the code editor is Monaco.', { style: 'Body/Default', color: 'color/text/secondary', parent: hd, name: 'Intro', w: 1200 });
  const total = SPEC.reduce((a, s) => a + s.rows.length, 0);
  txt(total + ' test cases in ' + SPEC.length + ' areas · IDs are stable: add new rows at the end of an area.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: hd, name: 'Count' });
  for (const s of SPEC) {
    const sec = box({ name: 'Area — ' + s.area, dir: 'V', gap: 14, pad: 28, fill: 'color/bg/panel', radius: 14, stroke: 'color/border/default', parent: root, wSize: 'fill' });
    const h = box({ name: 'Area header', dir: 'H', gap: 12, cross: 'center', parent: sec });
    const b = inst('Badge', { Tone: 'Ink' }, h, { name: 'Area id' }); setText(b, 'Label', s.id);
    txt(s.area, { style: 'Heading/H1', parent: h, name: 'Title' });
    const rows = s.rows.map((r, i) => [s.id + '-' + String(i + 1).padStart(2, '0'), r[0], r[1], r[2], r[3], '☐']);
    specTable(sec, [['ID', 80], ['Control', 230], ['Do', 280], ['Expect', 520], ['Prototype', 300], ['Pass', 74]], rows, { name: 'Tests ' + s.id, mono: [4] });
  }
  const ho = box({ name: 'Handoff', dir: 'V', gap: 18, pad: 28, fill: 'color/bg/panel', radius: 14, stroke: 'color/border/default', parent: root, wSize: 'fill' });
  txt('Handoff · Blockly theme and workspace', { style: 'Heading/H1', parent: ho, name: 'Title' });
  specTable(ho, [['Setting', 320], ['Value', 560], ['Note', 600]], HANDOFF.blocklyTheme, { name: 'Blockly', mono: [1] });
  txt('Block catalogue · ' + BLOCK_LIBRARY.length + ' blocks', { style: 'Heading/H1', parent: ho, name: 'Title Blocks' });
  txt('What each block says, its shape, the Arduino C++ it generates, and what the RoboCore library needs (“add …” = a helper to write first). Notation: [dropdown] (number) “text” < > empty yes / no slot.', { style: 'Body/Small', color: 'color/text/secondary', parent: ho, name: 'Blocks intro', w: 1200 });
  specTable(ho, [['Category', 140], ['Block', 370], ['Shape', 100], ['Generates (C++)', 420], ['RoboCore library', 426]], blockCatalogueRows(), { name: 'Block catalogue', mono: [3] });
  txt('Handoff · Monaco theme and options', { style: 'Heading/H1', parent: ho, name: 'Title Monaco' });
  specTable(ho, [['Setting', 320], ['Value', 560], ['Note', 600]], HANDOFF.monaco, { name: 'Monaco', mono: [1] });
  txt('Implementation notes', { style: 'Heading/H1', parent: ho, name: 'Title Notes' });
  specTable(ho, [['Topic', 320], ['Note', 1160]], HANDOFF.notes, { name: 'Notes' });
  txt('What the Figma prototype cannot do', { style: 'Heading/H1', parent: ho, name: 'Title Limits' });
  specTable(ho, [['Limit', 320], ['Why and what to do', 1160]], PROTO_LIMITS, { name: 'Limits' });
  REPORT.counts.specRows = total;
  return root;
}
