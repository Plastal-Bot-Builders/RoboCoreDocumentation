// ============================================================================
// Programming blocks — Scratch/Blockly geometry drawn as vectors, in the box's
// line-art style: every block has a navy outline. Colour = toolbox category, shape = role.
// Statement: notch on top, tab below. Hat: dome on top. C-block: mouth(s).
// ============================================================================

const BK = { R: 6, NX: 16, NW: 28, NS: 6, ND: 6, IW: 20, CAP: 18, HATW: 96 };
// Colour = category (which toolbox drawer it came from); shape = role (hat, statement, value).
// Events use the box yellow with navy labels; the others take cream labels (all >= 4.5:1).
function blockKey(cat) { const c = BLOCK_CATS.find(x => x[0] === cat); return c ? c[2] : 'control'; }
function STYLE(cat) {
  const k = blockKey(cat);
  const bright = k === 'events';
  return { fill: 'color/block/' + k, text: bright ? 'color/text/on-bright' : 'color/block/label', icon: bright ? 'color/icon/on-bright' : 'color/block/label', dropOp: bright ? 0.14 : 0.28, bright };
}

function rnd(n) { return Math.round(n * 100) / 100; }
function PathB() {
  const a = [];
  const api = {
    M: (x, y) => { a.push('M', rnd(x), rnd(y)); return api; },
    L: (x, y) => { a.push('L', rnd(x), rnd(y)); return api; },
    Q: (cx, cy, x, y) => { a.push('Q', rnd(cx), rnd(cy), rnd(x), rnd(y)); return api; },
    C: (c1x, c1y, c2x, c2y, x, y) => { a.push('C', rnd(c1x), rnd(c1y), rnd(c2x), rnd(c2y), rnd(x), rnd(y)); return api; },
    Z: () => { a.push('Z'); return api; },
    s: () => a.join(' '),
  };
  return api;
}
function topEdge(p, w, top) {
  const { R, NX, NW, NS, ND, CAP, HATW } = BK;
  if (top === 'hat') {
    p.M(0, CAP).C(HATW * 0.25, -CAP / 3, HATW * 0.75, -CAP / 3, HATW, CAP).L(w - R, CAP).Q(w, CAP, w, CAP + R);
    return CAP;
  }
  p.M(0, R).Q(0, 0, R, 0);
  if (top !== 'flat') p.L(NX, 0).L(NX + NS, ND).L(NX + NW - NS, ND).L(NX + NW, 0);
  p.L(w - R, 0).Q(w, 0, w, R);
  return 0;
}
function bottomEdge(p, w, H, bottom) {
  const { R, NX, NW, NS, ND } = BK;
  p.L(w, H - R).Q(w, H, w - R, H);
  if (bottom !== 'flat') p.L(NX + NW, H).L(NX + NW - NS, H + ND).L(NX + NS, H + ND).L(NX, H);
  p.L(R, H).Q(0, H, 0, H - R).Z();
}
function pathStatement(w, h, o = {}) {
  const p = PathB();
  const yT = topEdge(p, w, o.top);
  const H = yT + h;
  bottomEdge(p, w, H, o.bottom);
  return { d: p.s(), H, top: yT };
}
// secs = [arm, mouth, arm, mouth, ..., arm]
function pathC(w, secs, o = {}) {
  const { R, NX, NW, NS, ND, IW } = BK;
  const p = PathB();
  let y = topEdge(p, w, o.top);
  const yT = y;
  const marks = [];
  for (let i = 0; i < secs.length; i += 2) {
    const arm = secs[i];
    if (i === secs.length - 1) { const H = y + arm; marks.push({ arm: y, h: arm }); bottomEdge(p, w, H, o.bottom); return { d: p.s(), H, top: yT, marks }; }
    const y1 = y + arm;
    marks.push({ arm: y, h: arm, mouth: y1, mh: secs[i + 1] });
    p.L(w, y1 - R).Q(w, y1, w - R, y1);
    p.L(IW + NX + NW, y1).L(IW + NX + NW - NS, y1 + ND).L(IW + NX + NS, y1 + ND).L(IW + NX, y1).L(IW + R, y1).Q(IW, y1, IW, y1 + R);
    const y2 = y1 + secs[i + 1];
    p.L(IW, y2 - R).Q(IW, y2, IW + R, y2);
    p.L(IW + NX, y2).L(IW + NX + NS, y2 + ND).L(IW + NX + NW - NS, y2 + ND).L(IW + NX + NW, y2).L(w - R, y2).Q(w, y2, w, y2 + R);
    y = y2;
  }
}
function shapeVector(d, cat, name = 'Shape', ghost) {
  const v = figma.createVector();
  v.name = name;
  v.vectorPaths = [{ windingRule: 'NONZERO', data: d }];
  if (ghost) { v.fills = [paint('color/bg/hover')]; v.strokes = [paint('color/border/strong')]; v.dashPattern = [4, 3]; }
  else { v.fills = [paint(STYLE(cat).fill)]; v.strokes = [paint('color/block/outline')]; }
  v.strokeWeight = 1.25;
  v.strokeAlign = 'INSIDE';
  return v;
}

// ---- parts: 'label' | {t:'drop', v} | {t:'num', v} | {t:'text', v} | {t:'icon', v} | {t:'rep', cat, parts} | {t:'bool', cat, parts} | {t:'slot'}
function renderParts(row, parts, cat, counter) {
  counter = counter || { n: 0 };
  const R = STYLE(cat);
  for (const part of parts) {
    if (typeof part === 'string') { txt(part, { style: 'Block/Label', color: R.text, parent: row, name: 'Label' }); continue; }
    if (part.t === 'drop') {
      const f = box({ name: 'Field (dropdown)', dir: 'H', gap: 4, pad: [0, 6, 0, 8], h: 24, cross: 'center', radius: 4, fill: '#1B2A41', fillOpacity: R.dropOp, parent: row });
      txt(part.v, { style: 'Block/Field', color: R.text, parent: f, name: 'F' + (++counter.n) });
      iconSlot(f, 'chevron-down', R.icon, 12, 'Chevron');
    } else if (part.t === 'num' || part.t === 'text') {
      const f = box({ name: part.t === 'num' ? 'Field (number)' : 'Field (text)', dir: 'H', pad: [0, 10, 0, 10], h: 24, cross: 'center', align: 'center', radius: 999, fill: 'color/block/field', stroke: R.bright ? 'color/block/outline' : undefined, parent: row });
      txt(part.v, { style: 'Block/Field', color: 'color/text/on-bright', parent: f, name: 'F' + (++counter.n) });
      if (part.t === 'num') { try { f.minWidth = 32; } catch (e) { /* older API */ } }
    } else if (part.t === 'icon') {
      iconSlot(row, part.v, R.icon, 18, 'Block icon');
    } else if (part.t === 'rep') {
      const rc = part.cat || cat;
      const r = box({ name: 'Reporter', dir: 'H', gap: 6, pad: [0, 10, 0, 10], h: 28, cross: 'center', radius: 999, fill: STYLE(rc).fill, stroke: 'color/block/outline', parent: row });
      r.strokeWeight = 1.25;
      renderParts(r, part.parts, rc, counter);
    } else if (part.t === 'bool') {
      row.appendChild(boolShape(part.parts, counter, part.cat || cat));
    } else if (part.t === 'slot') {
      const s = box({ name: 'Empty boolean slot', w: 40, h: 24, parent: row });
      const v = shapeVector(hexPath(40, 24), cat, 'Slot');
      v.fills = [solid('#1B2A41', R.dropOp)]; v.strokes = [];
      s.appendChild(v);
    }
  }
}
function hexPath(w, h) { const k = h / 2; return 'M ' + k + ' 0 L ' + rnd(w - k) + ' 0 L ' + w + ' ' + k + ' L ' + rnd(w - k) + ' ' + h + ' L ' + k + ' ' + h + ' L 0 ' + k + ' Z'; }
function boolShape(parts, counter, cat) {
  const row = box({ name: 'Content', dir: 'H', gap: 6, pad: [0, 16, 0, 16], h: 32, cross: 'center' });
  renderParts(row, parts, cat, counter);
  const w = Math.ceil(row.width), h = Math.max(32, Math.ceil(row.height));
  const holder = figma.createFrame();
  holder.name = 'Boolean';
  holder.fills = []; holder.clipsContent = false;
  holder.resize(w, h);
  holder.appendChild(shapeVector(hexPath(w, h), cat));
  holder.appendChild(row);
  row.x = 0; row.y = 0;
  return holder;
}
function contentRow(parts, cat, minH) {
  const row = box({ name: 'Content', dir: 'H', gap: 8, pad: [0, 12, 0, 12], cross: 'center' });
  renderParts(row, parts, cat);
  const h = Math.max(minH, Math.ceil(row.height) + 12);
  row.resize(Math.max(1, row.width), h);
  row.layoutSizingHorizontal = 'HUG';
  return row;
}
// statement / hat / reporter / boolean block as a plain frame, coloured by category
function makeBlock(cat, parts, o = {}) {
  const holder = figma.createFrame();
  holder.name = o.name || 'Block';
  holder.fills = []; holder.clipsContent = false;
  if (o.kind === 'reporter' || o.kind === 'boolean') {
    const row = box({ name: 'Content', dir: 'H', parent: holder });
    renderParts(row, [o.kind === 'reporter' ? { t: 'rep', cat, parts } : { t: 'bool', cat, parts }], cat);
    const inner = row.children[0];
    if (o.kind === 'reporter') { inner.resize(inner.width, 32); inner.layoutSizingHorizontal = 'HUG'; }
    holder.resize(Math.ceil(row.width), Math.ceil(row.height));
    return holder;
  }
  const row = contentRow(parts, cat, o.minH || 40);
  const w = Math.max(o.minW || 0, Math.ceil(row.width));
  const { d, H, top } = pathStatement(w, row.height, o);
  holder.appendChild(shapeVector(d, cat, 'Shape', o.ghost));
  holder.appendChild(row);
  row.x = 0; row.y = top;
  holder.resize(w, H + (o.bottom === 'flat' ? 0 : BK.ND));
  if (o.ghost) row.opacity = 0;
  return holder;
}
// stacking pitch per node id (Figma nodes are not extensible, so keep it outside)
const PITCH = new Map();
function pitchOf(n) { return PITCH.has(n.id) ? PITCH.get(n.id) : (n.height - BK.ND); }
// C-block: hats (Events, My Blocks) and loops / ifs (Control). arms: [parts, parts(else)..., bottomParts]; mouths: [[nodes], [nodes]]
function makeCBlock(arms, mouths, o = {}) {
  const { IW, ND } = BK;
  const cat = o.cat || (o.top === 'hat' ? 'Events' : 'Control');
  const holder = figma.createFrame();
  holder.name = o.name || 'C-block';
  holder.fills = []; holder.clipsContent = false;
  const rows = arms.map((parts, i) => parts && parts.length ? contentRow(parts, cat, i === 0 ? 40 : 32) : null);
  const w = Math.max(o.minW || 150, ...rows.filter(Boolean).map(r => Math.ceil(r.width)));
  const secs = [];
  arms.forEach((parts, i) => {
    const isLast = i === arms.length - 1;
    const r = rows[i];
    secs.push(r ? r.height : (isLast ? 24 : 32));
    if (!isLast) { const kids = mouths[i] || []; secs.push(kids.length ? kids.reduce((s, k) => s + pitchOf(k), 0) : 24); }
  });
  const { d, H, marks } = pathC(w, secs, o);
  holder.appendChild(shapeVector(d, cat));
  let maxW = w;
  marks.forEach((m, i) => {
    if (rows[i]) { holder.appendChild(rows[i]); rows[i].x = 0; rows[i].y = m.arm; }
    if (m.mouth !== undefined) {
      let yy = m.mouth;
      for (const k of (mouths[i] || [])) { holder.appendChild(k); k.x = IW; k.y = yy; yy += pitchOf(k); maxW = Math.max(maxW, IW + k.width); }
    }
  });
  holder.resize(maxW, H + (o.bottom === 'flat' ? 0 : ND));
  PITCH.set(holder.id, H);
  return holder;
}

// ---- block library (components) -------------------------------------------
const D = (v) => ({ t: 'drop', v }), N = (v) => ({ t: 'num', v }), T = (v) => ({ t: 'text', v });
// BLOCK_LIBRARY and BLOCK_CATS: 05a_block_data.js
const BLOCK = {}; // components by "Category/Name"

function buildBlockLibrary(parent) {
  // two rows of five category columns
  const wrap = box({ name: 'Block library', dir: 'V', gap: 32, pad: 24, cross: 'start', parent, fill: 'color/bg/canvas', radius: 12, stroke: 'color/border/subtle' });
  const cols = {};
  let rowBox = null;
  BLOCK_CATS.forEach(([cat], i) => {
    if (i % 5 === 0) rowBox = box({ name: 'Row', dir: 'H', gap: 28, cross: 'start', parent: wrap });
    const c = box({ name: 'Category ' + cat, dir: 'V', gap: 14, cross: 'start', parent: rowBox });
    inst('Block Category', { Category: cat, State: 'Active' }, c);
    cols[cat] = c;
  });
  for (const [cat, name, parts, kind, gen, lib] of BLOCK_LIBRARY) {
    let node;
    if (kind === 'statement') node = makeBlock(cat, parts, {});
    else if (kind === 'reporter' || kind === 'boolean') node = makeBlock(cat, parts, { kind });
    else if (kind === 'hatC') node = makeCBlock([parts, []], [[]], { top: 'hat', bottom: 'flat', minW: 150, cat });
    else if (kind === 'c') node = makeCBlock([parts, []], [[]], { minW: 150, cat });
    else if (kind === 'cElse') node = makeCBlock([parts, ['else'], []], [[], []], { minW: 150, cat });
    const c = figma.createComponentFromNode(node);
    c.name = 'Block/' + cat + '/' + name;
    c.description = cat + ' ' + kind + ' block. Generates: ' + gen + (lib ? ' · RoboCore library, ' + lib : '');
    c.clipsContent = false;
    cols[cat].appendChild(c);
    BLOCK[cat + '/' + name] = c;
  }
  REPORT.counts.blocks = Object.keys(BLOCK).length;
  return wrap;
}
function blk(key, fields, parent) {
  const c = BLOCK[key];
  if (!c) throw new Error('Unknown block ' + key);
  const i = c.createInstance();
  if (parent) parent.appendChild(i);
  if (fields) for (const [k, v] of Object.entries(fields)) setText(i, k, v);
  return i;
}
