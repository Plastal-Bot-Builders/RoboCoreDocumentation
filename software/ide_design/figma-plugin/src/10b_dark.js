// ============================================================================
// 06 — Dark Mode ("Navy"): every screen again, in the box inverted.
// With variable modes available the frames just switch the Color collection to
// "Navy". On plans with one mode per collection, every bound paint in the copy is
// re-bound to the matching variable in the "Color · Navy" collection instead.
// Navy line art is swapped for cream line art in both cases.
// ============================================================================

function artSwaps() {
  const m = {};
  m[artHash('robot')] = artHash('robotCream');
  m[artHash('board')] = artHash('boardCream');
  return m;
}
function darkPaint(name) {
  if (THEME.modes) return paint(name);
  const v = VD[name];
  const c = hexToRgba(DARK_HEX[name]);
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }, 'color', v);
}
function remapPaints(paints, swaps) {
  if (!Array.isArray(paints)) return null;
  let changed = false;
  const out = paints.map(p => {
    if (!THEME.modes && p.type === 'SOLID' && p.boundVariables && p.boundVariables.color) {
      const dv = DARK_BY_ID[p.boundVariables.color.id];
      if (dv) { changed = true; return darkPaint(dv.name); }
    }
    if (p.type === 'IMAGE' && swaps[p.imageHash]) { changed = true; return Object.assign({}, p, { imageHash: swaps[p.imageHash] }); }
    return p;
  });
  return changed ? out : null;
}
function darken(root, swaps) {
  if (THEME.modes) root.setExplicitVariableModeForCollection(THEME.collection, THEME.modeId);
  const nodes = [root].concat(root.findAll(() => true));
  let n = 0;
  for (const node of nodes) {
    if ('fills' in node) {
      if (node.fills === figma.mixed) {
        if (node.type === 'TEXT') for (const seg of node.getStyledTextSegments(['fills'])) { const r = remapPaints(seg.fills, swaps); if (r) { node.setRangeFills(seg.start, seg.end, r); n++; } }
      } else { const r = remapPaints(node.fills, swaps); if (r) { node.fills = r; n++; } }
    }
    if ('strokes' in node) { const r = remapPaints(node.strokes, swaps); if (r) { node.strokes = r; n++; } }
  }
  return n;
}

async function buildDarkPage(page, IDE, SCR) {
  const swaps = artSwaps();
  const DK = {};
  // header: the Navy palette
  const hd = box({ name: 'Dark mode guide', dir: 'V', gap: 16, pad: 40, w: 1440, radius: 12, fill: 'color/bg/brand', clip: true, parent: page });
  hd.x = 0; hd.y = -460;
  contours(hd, 1440, 360, 'color/decor/contour');
  txt('Dark mode · Navy', { style: 'Heading/Display', parent: hd, name: 'Title' });
  txt('The box inverted: navy surfaces, cream ink, the same RoboCore yellow. Every screen below uses the same components; only the colour variables change.', { style: 'Body/Default', color: 'color/text/secondary', parent: hd, name: 'Description', w: 900 });
  const sw = box({ name: 'Navy palette', dir: 'H', gap: 12, parent: hd });
  for (const [n, label] of [['color/bg/app', 'App'], ['color/bg/panel', 'Panel · box navy'], ['color/bg/raised', 'Raised'], ['color/text/primary', 'Cream ink'], ['color/text/secondary', 'Secondary'], ['color/brand/default', 'RoboCore yellow'], ['color/bg/selected', 'Selected']]) {
    const c = box({ name: 'Swatch ' + label, dir: 'V', gap: 6, w: 150, parent: sw });
    box({ name: 'Tile', w: 150, h: 56, radius: 8, fill: n, stroke: 'color/border/default', parent: c });
    txt(label, { style: 'Label/Strong', parent: c, name: 'Label' });
    txt(DARK_HEX[n], { style: 'Code/Small', color: 'color/text/tertiary', parent: c, name: 'Hex' });
  }
  txt('Contrast on navy: cream 12.8:1 · secondary 8.4:1 · meta 5.6:1 · yellow 7.6:1. ' + (THEME.modes ? 'Frames use the Navy mode of the Color collection.' : 'This plan allows one mode per collection, so these frames are bound to the “Color · Navy” collection; with modes, the same frames switch with one setting.'), { style: 'Caption/Default', color: 'color/text/tertiary', parent: hd, name: 'Note', w: 1100 });
  darken(hd, swaps);
  let i = 0, painted = 0;
  const all = Object.entries(IDE).map(([k, f]) => ['ide_' + k, f]).concat(Object.entries(SCR).map(([k, f]) => ['screen_' + k, f]));
  for (const [k, src] of all) {
    if (!src) continue;
    const c = src.clone();
    page.appendChild(c);
    c.name = 'Dark · ' + src.name;
    c.x = (i % 3) * 1600; c.y = Math.floor(i / 3) * 1200;
    painted += darken(c, swaps);
    DK[k] = c; i++;
    if (i % 3 === 0) await yieldUI();
  }
  // Settings in dark mode: Navy is the chosen theme
  const st = DK.screen_settings;
  if (st) {
    const t = st.findOne(n => n.type === 'INSTANCE' && n.name === 'Theme');
    if (t) { try { t.setProperties({ Selected: 'Navy' }); } catch (e) { warn(e.message); } darken(t, swaps); }
  }
  REPORT.counts.darkFrames = i;
  REPORT.counts.darkRepaints = painted;
  return DK;
}
