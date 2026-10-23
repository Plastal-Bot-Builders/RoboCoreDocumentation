// ============================================================================
// Diagram kit: element boxes, boundaries, routed connectors and the UML shapes
// used on every page. Every element is a direct child of its diagram's canvas
// (a plain frame), so connectors are routed from the elements' real bounds.
// ============================================================================

const INK = 'color/ink/default';
const PAPER = 'color/bg/panel';

// Domain = which part of the platform an element belongs to. The colour is the
// matching block-category ink from the IDE, used only on the small icon tile.
const DOM = {
  people: { fill: 'color/block/control', icon: 'color/icon/on-bright', label: 'People & organisations' },
  ide: { fill: 'color/block/output', icon: 'color/block/label', label: 'RoboCore IDE' },
  server: { fill: 'color/block/math', icon: 'color/block/label', label: 'Compile service' },
  firmware: { fill: 'color/block/robotics', icon: 'color/block/label', label: 'Firmware' },
  hardware: { fill: 'color/block/sensors', icon: 'color/block/label', label: 'Hardware' },
  infra: { fill: 'color/block/input', icon: 'color/block/label', label: 'Build, hosting & supply' },
  cog: { fill: 'color/block/variables', icon: 'color/block/label', label: 'Cog (planned)' },
  ext: { fill: 'color/block/communication', icon: 'color/block/label', label: 'Third party' },
};

// Element kinds: fill / outline. Built = solid outline, third party = dashed,
// planned = dotted on yellow tint, hardware = navy.
const KIND = {
  sys: { fill: PAPER, sw: 1.5 },
  ext: { fill: 'color/bg/app', sw: 1.25, dash: [6, 4] },
  planned: { fill: 'color/brand/tint', sw: 1.25, dash: [2, 3] },
  hw: { fill: INK, sw: 1.5, inverse: true },
  store: { fill: PAPER, sw: 1.5 },
  quiet: { fill: 'color/bg/app', sw: 1, stroke: 'color/border/default' },
};

const r2 = (v) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- diagram card
// o: { num, kind (notation), title, desc, descW }
function newDiagram(parent, o) {
  const card = box({ name: 'Diagram ' + o.num + ' — ' + o.title, dir: 'V', gap: 24, pad: 40, fill: PAPER, radius: 16, stroke: 'color/border/default', parent });
  const hd = box({ name: 'Header', dir: 'V', gap: 6, parent: card });
  txt(o.num + '  ·  ' + o.kind, { style: 'Caption/Overline', color: 'color/text/brand', parent: hd, name: 'Overline' });
  txt(o.title, { style: 'Heading/H1', parent: hd, name: 'Title' });
  if (o.desc) txt(o.desc, { style: 'Body/Default', color: 'color/text/secondary', parent: hd, name: 'Description', w: o.descW || 960 });
  const cv = figma.createFrame();
  cv.name = 'Canvas';
  cv.fills = [];
  cv.clipsContent = false;
  card.appendChild(cv);
  cv.resize(100, 100);
  return { card, cv, n: {}, under: 0, o };
}
// size the canvas to its content; optional notes row underneath
function finishDiagram(D, notes) {
  let mx = 0, my = 0;
  for (const c of D.cv.children) { mx = Math.max(mx, c.x + c.width); my = Math.max(my, c.y + c.height); }
  D.cv.resize(Math.max(200, Math.ceil(mx + 4)), Math.max(60, Math.ceil(my + 4)));
  if (notes && notes.length) {
    const row = box({ name: 'Notes', dir: 'H', gap: 16, parent: D.card, cross: 'start' });
    for (const [title, body] of notes) noteCard(row, title, body, 300);
  }
  REPORT.counts.diagrams = (REPORT.counts.diagrams || 0) + 1;
  return D.card;
}
function noteCard(parent, title, body, w) {
  const c = box({ name: 'Note — ' + title, dir: 'V', gap: 6, pad: 16, w: w || 300, fill: 'color/bg/app', radius: 10, parent });
  txt(title, { style: 'Label/Strong', parent: c, name: 'Title', fill: true });
  for (const l of [].concat(body)) txt(l, { style: 'Body/Small', color: 'color/text/secondary', parent: c, name: 'Text', fill: true });
  return c;
}

// ---------------------------------------------------------------- small parts
function iconTile(parent, icon, dom, size) {
  const d = DOM[dom || 'ext'];
  const s = size || 24;
  const t = box({ name: 'Icon tile', dir: 'H', w: s, h: s, align: 'center', cross: 'center', radius: Math.round(s / 4), fill: d.fill, parent });
  if (icon) iconInst(icon, t, d.icon, Math.round(s * 0.62));
  return t;
}
function chip(parent, text, inverse) {
  const c = box({ name: 'Chip ' + text, dir: 'H', pad: [2, 6, 2, 6], radius: 4, fill: inverse ? '#FFFFFF' : 'color/bg/subtle', fillOpacity: inverse ? 0.14 : undefined, parent });
  txt(text, { style: 'Label/Small', color: inverse ? 'color/text/on-ink' : 'color/text/secondary', parent: c, name: 'Text' });
  return c;
}
function badge(parent, text) {
  const c = box({ name: 'Badge ' + text, dir: 'H', pad: [2, 6, 2, 6], radius: 4, fill: INK, parent });
  txt(text, { style: 'Label/Small', color: 'color/text/on-ink', parent: c, name: 'Text' });
  return c;
}
// UML component symbol (box with two tabs)
function umlComponentIcon(parent, inverse) {
  const col = inverse ? '#F7F1E3' : '#1B2A41';
  const n = figma.createNodeFromSvg('<svg width="16" height="18" viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="0.75" width="11.75" height="16.5" rx="1" fill="none" stroke="' + col + '" stroke-width="1.25"/><rect x="0.75" y="4" width="5.5" height="3" fill="' + (inverse ? '#1B2A41' : '#FFFCF5') + '" stroke="' + col + '" stroke-width="1.25"/><rect x="0.75" y="10.5" width="5.5" height="3" fill="' + (inverse ? '#1B2A41' : '#FFFCF5') + '" stroke="' + col + '" stroke-width="1.25"/></svg>');
  n.name = 'UML component symbol';
  parent.appendChild(n);
  return n;
}

// ---------------------------------------------------------------- elements
// el(D, id, o): o = { x, y, w, h, kind, dom, icon, tag, title, body, items[], mono[], chips[], badge, uml:'component', titleStyle }
function el(D, id, o) {
  const k = KIND[o.kind || 'sys'];
  const inv = !!k.inverse;
  const f = box({ name: (o.tag ? o.tag + ' — ' : '') + (o.title || id), dir: 'V', gap: 6, pad: o.pad || [12, 14, 14, 14], w: o.w || 240, fill: k.fill, stroke: k.stroke || INK, strokeW: k.sw, radius: o.radius !== undefined ? o.radius : 10, parent: D.cv });
  if (k.dash) f.dashPattern = k.dash;
  const planned = o.kind === 'planned' || o.planned;
  if (o.icon || o.tag || planned || o.uml || o.badge) {
    const hd = box({ name: 'Head', dir: 'H', gap: 8, cross: 'center', parent: f, wSize: 'fill' });
    if (o.icon) iconTile(hd, o.icon, o.dom, 24);
    if (o.tag) txt(o.tag, { style: 'Caption/Overline', color: inv ? 'color/text/on-ink' : 'color/text/tertiary', parent: hd, name: 'Tag', grow: true, opacity: inv ? 0.8 : undefined });
    else spacer(hd, 1, true);
    if (planned) badge(hd, 'PLANNED');
    if (o.badge) badge(hd, o.badge);
    if (o.uml === 'component') umlComponentIcon(hd, inv);
  }
  if (o.title) txt(o.title, { style: o.titleStyle || 'Heading/H3', color: inv ? 'color/text/on-ink' : 'color/text/primary', parent: f, name: 'Title', fill: true });
  if (o.body) txt(o.body, { style: 'Body/Small', color: inv ? 'color/text/on-ink' : 'color/text/secondary', parent: f, name: 'Body', fill: true, opacity: inv ? 0.85 : undefined });
  if (o.items) for (const it of o.items) txt('– ' + it, { style: 'Body/Small', color: inv ? 'color/text/on-ink' : 'color/text/secondary', parent: f, name: 'Item', fill: true, opacity: inv ? 0.85 : undefined });
  if (o.mono) {
    const m = box({ name: 'Code', dir: 'V', gap: 2, pad: [6, 8, 6, 8], radius: 6, fill: inv ? '#FFFFFF' : 'color/bg/subtle', fillOpacity: inv ? 0.1 : undefined, parent: f, wSize: 'fill' });
    for (const l of o.mono) txt(l, { style: 'Code/Small', color: inv ? 'color/text/on-ink' : 'color/text/primary', parent: m, name: 'Line', fill: true });
  }
  if (o.chips) {
    const row = box({ name: 'Chips', dir: 'H', wrap: true, gap: 4, rowGap: 4, parent: f, wSize: 'fill' });
    for (const c of o.chips) chip(row, c, inv);
  }
  f.x = o.x; f.y = o.y;
  if (o.h) { f.layoutSizingVertical = 'FIXED'; f.resize(f.width, o.h); }
  D.n[id] = f;
  return f;
}
// a person (C4 style): round icon, name, short description
function person(D, id, o) {
  const f = box({ name: 'Person — ' + o.title, dir: 'V', gap: 6, w: o.w || 220, cross: 'center', parent: D.cv });
  const d = DOM[o.dom || 'people'];
  const head = box({ name: 'Head', dir: 'H', w: 52, h: 52, radius: 26, align: 'center', cross: 'center', fill: d.fill, parent: f });
  iconInst(o.icon || 'user', head, d.icon, 26);
  txt(o.title, { style: 'Heading/H3', parent: f, name: 'Name', align: 'CENTER', fill: true });
  if (o.body) txt(o.body, { style: 'Body/Small', color: 'color/text/secondary', parent: f, name: 'Body', align: 'CENTER', fill: true });
  f.x = o.x; f.y = o.y;
  D.n[id] = f;
  return f;
}
// UML actor (stick figure)
function actor(D, id, o) {
  const f = box({ name: 'Actor — ' + o.title, dir: 'V', gap: 6, w: o.w || 140, cross: 'center', parent: D.cv });
  const s = figma.createNodeFromSvg('<svg width="40" height="66" viewBox="0 0 40 66" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="10" r="8.5" fill="#FFFCF5" stroke="#1B2A41" stroke-width="2"/><path d="M20 19v24M5 28h30M20 43 7 63M20 43l13 20" fill="none" stroke="#1B2A41" stroke-width="2" stroke-linecap="round"/></svg>');
  s.name = 'Stick figure';
  f.appendChild(s);
  txt(o.title, { style: 'Label/Strong', parent: f, name: 'Name', align: 'CENTER', fill: true });
  if (o.body) txt(o.body, { style: 'Caption/Default', color: 'color/text/tertiary', parent: f, name: 'Body', align: 'CENTER', fill: true });
  f.x = o.x; f.y = o.y;
  D.n[id] = f;
  return f;
}
// UML use case (ellipse)
function useCase(D, id, o) {
  const w = o.w || 210, h = o.h || 60;
  const f = box({ name: 'Use case — ' + o.title, dir: 'V', w, h, align: 'center', cross: 'center', pad: [6, 24, 6, 24], parent: D.cv });
  const e = figma.createEllipse();
  e.name = 'Ellipse';
  e.resize(w, h);
  e.fills = [paint(o.planned ? 'color/brand/tint' : PAPER)];
  e.strokes = [paint(INK)];
  e.strokeWeight = 1.5;
  if (o.planned) e.dashPattern = [2, 3];
  f.appendChild(e);
  e.layoutPositioning = 'ABSOLUTE';
  e.x = 0; e.y = 0;
  e.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  txt(o.title, { style: 'Label/Default', parent: f, name: 'Name', align: 'CENTER', fill: true });
  if (o.planned) txt('planned', { style: 'Caption/Default', color: 'color/text/tertiary', parent: f, name: 'Planned', align: 'CENTER', fill: true });
  f.x = o.x; f.y = o.y;
  D.n[id] = f;
  return f;
}
// UML class: stereotype + name / attributes / operations
function classBox(D, id, o) {
  const d = DOM[o.dom || 'ide'];
  const f = box({ name: 'Class — ' + o.name, dir: 'V', gap: 0, w: o.w || 260, fill: PAPER, stroke: INK, strokeW: 1.5, radius: 8, clip: true, parent: D.cv });
  if (o.dash) f.dashPattern = [6, 4];
  const hd = box({ name: 'Name', dir: 'V', gap: 2, pad: [10, 12, 10, 12], cross: 'center', fill: d.fill, fillOpacity: 0.16, parent: f, wSize: 'fill' });
  if (o.stereo) txt(o.stereo, { style: 'Caption/Default', color: 'color/text/secondary', parent: hd, name: 'Stereotype', align: 'CENTER', fill: true });
  txt(o.name, { style: 'Heading/H3', parent: hd, name: 'Class name', align: 'CENTER', fill: true });
  if (o.sub) txt(o.sub, { style: 'Caption/Default', color: 'color/text/tertiary', parent: hd, name: 'File', align: 'CENTER', fill: true });
  for (const [key, lines] of [['Attributes', o.attrs], ['Operations', o.ops]]) {
    if (!lines) continue;
    divider(f, 'H', undefined, INK, 'Divider');
    const c = box({ name: key, dir: 'V', gap: 2, pad: [8, 12, 8, 12], parent: f, wSize: 'fill' });
    for (const l of lines) txt(l, { style: 'Code/Small', parent: c, name: 'Member', fill: true });
  }
  f.x = o.x; f.y = o.y;
  D.n[id] = f;
  return f;
}
// state / activity action: rounded box with a name and optional lines
function stateBox(D, id, o) {
  const f = box({ name: (o.act ? 'Action — ' : 'State — ') + o.title, dir: 'V', gap: 4, pad: [10, 14, 10, 14], w: o.w || 190, radius: o.act ? 22 : 14, fill: o.fill || PAPER, stroke: INK, strokeW: 1.5, cross: 'center', parent: D.cv });
  if (o.dash) f.dashPattern = [2, 3];
  txt(o.title, { style: 'Label/Strong', parent: f, name: 'Name', align: 'CENTER', fill: true });
  if (o.lines && o.lines.length) {
    for (const l of o.lines) txt(l, { style: o.prose ? 'Caption/Default' : 'Code/Small', color: 'color/text/secondary', parent: f, name: 'Line', align: 'CENTER', fill: true });
  }
  f.x = o.x; f.y = o.y;
  if (o.h) { f.layoutSizingVertical = 'FIXED'; f.resize(f.width, o.h); }
  D.n[id] = f;
  return f;
}
function initialNode(D, id, x, y) {
  const e = figma.createEllipse();
  e.name = 'Initial';
  e.resize(20, 20);
  e.fills = [paint(INK)];
  D.cv.appendChild(e);
  e.x = x; e.y = y;
  D.n[id] = e;
  return e;
}
function finalNode(D, id, x, y) {
  const f = figma.createFrame();
  f.name = 'Final';
  f.resize(26, 26);
  f.cornerRadius = 13;
  f.fills = [paint(PAPER)];
  f.strokes = [paint(INK)];
  f.strokeWeight = 1.5;
  const e = figma.createEllipse();
  e.resize(14, 14);
  e.fills = [paint(INK)];
  f.appendChild(e);
  e.x = 6; e.y = 6;
  D.cv.appendChild(f);
  f.x = x; f.y = y;
  D.n[id] = f;
  return f;
}
function choiceNode(D, id, x, y, size) {
  const s = size || 30, h = s / 2;
  const v = polyline(D.cv, [[x + h, y], [x + s, y + h], [x + h, y + s], [x, y + h]], { closed: true, fill: PAPER, stroke: INK, sw: 1.5, name: 'Choice' });
  D.n[id] = v;
  return v;
}
// fork / join bar
function barNode(D, id, x, y, w, vertical) {
  const r = rect({ name: 'Fork / join', w: vertical ? 6 : w, h: vertical ? w : 6, radius: 3, fill: INK, parent: D.cv, x, y });
  D.n[id] = r;
  return r;
}
// sticky-note style comment
function noteBox(D, id, o) {
  const f = box({ name: 'Note', dir: 'V', gap: 4, pad: [10, 12, 10, 12], w: o.w || 220, fill: 'color/brand/tint', radius: 4, parent: D.cv });
  if (o.title) txt(o.title, { style: 'Label/Strong', parent: f, name: 'Title', fill: true });
  for (const l of [].concat(o.text || [])) txt(l, { style: 'Caption/Default', color: 'color/text/secondary', parent: f, name: 'Text', fill: true });
  f.x = o.x; f.y = o.y;
  if (id) D.n[id] = f;
  return f;
}

// ---------------------------------------------------------------- boundaries
function boundsOf(n) { return { x: n.x, y: n.y, w: n.width, h: n.height }; }
function unionOf(D, ids) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const id of ids) {
    const n = D.n[id];
    if (!n) { warn('boundary: unknown element ' + id); continue; }
    x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + n.width); y1 = Math.max(y1, n.y + n.height);
  }
  return { x0, y0, x1, y1 };
}
// boundary(D, o): o = { id, ids | rect:{x,y,w,h}, pad, top, label, tag, dash, fill, stroke }
// Draw inner boundaries first: each new boundary goes underneath the earlier ones.
function boundary(D, o) {
  let x, y, w, h;
  const pad = o.pad === undefined ? 24 : o.pad, top = o.top === undefined ? 48 : o.top;
  if (o.rect) ({ x, y, w, h } = o.rect);
  else {
    const u = unionOf(D, o.ids);
    x = u.x0 - pad; y = u.y0 - top; w = u.x1 - u.x0 + 2 * pad; h = u.y1 - u.y0 + pad + top;
  }
  const r = figma.createFrame();
  r.name = 'Boundary — ' + (o.label || '');
  r.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  r.strokes = [paint(o.stroke || INK)];
  r.strokeWeight = o.sw || 1.25;
  r.dashPattern = o.dash === false ? [] : (o.dash || [8, 6]);
  r.cornerRadius = o.radius === undefined ? 16 : o.radius;
  r.clipsContent = false;
  D.cv.insertChild(0, r);
  D.under++;
  r.resize(Math.max(10, w), Math.max(10, h));
  r.x = x; r.y = y;
  const lab = box({ name: 'Label', dir: 'V', gap: 2, parent: r });
  lab.x = 16; lab.y = 12;
  if (o.tag) txt(o.tag, { style: 'Caption/Overline', color: 'color/text/tertiary', parent: lab, name: 'Tag' });
  if (o.label) txt(o.label, { style: 'Label/Strong', parent: lab, name: 'Title' });
  if (o.id) D.n[o.id] = r;
  return r;
}
// UML deployment node: a boundary drawn as a 3-D box
function cube(D, o) {
  const dpt = o.depth || 12;
  const r = boundary(D, Object.assign({ dash: o.dash === undefined ? false : o.dash, fill: o.fill || 'color/bg/app', radius: 2, sw: 1.5 }, o));
  const x = r.x, y = r.y, w = r.width, h = r.height;
  const opts = (fill) => ({ closed: true, fill: null, rawFill: fill, stroke: INK, sw: 1.5, name: 'Node face', index: 0 });
  polyline(D.cv, [[x, y], [x + dpt, y - dpt], [x + w + dpt, y - dpt], [x + w, y]], opts('#E3DAC5'));
  polyline(D.cv, [[x + w, y], [x + w + dpt, y - dpt], [x + w + dpt, y + h - dpt], [x + w, y + h]], opts('#CFC4AC'));
  D.under += 2;
  return r;
}

// ---------------------------------------------------------------- vectors
// polyline(parent, pts, o): o = { closed, fill, rawFill, stroke, sw, dash, name, corner, index }
function polyline(parent, pts, o) {
  let minX = Infinity, minY = Infinity;
  for (const [px, py] of pts) { minX = Math.min(minX, px); minY = Math.min(minY, py); }
  const d = pts.map(([px, py], i) => (i ? 'L ' : 'M ') + r2(px - minX) + ' ' + r2(py - minY)).join(' ') + (o.closed ? ' Z' : '');
  const v = figma.createVector();
  v.name = o.name || 'Line';
  v.vectorPaths = [{ windingRule: o.closed ? 'NONZERO' : 'NONE', data: d }];
  v.fills = o.fill ? [paint(o.fill)] : (o.rawFill ? [solid(o.rawFill)] : []);
  v.strokes = o.stroke ? [paint(o.stroke)] : [];
  v.strokeWeight = o.sw || 1.5;
  v.strokeJoin = o.closed ? 'MITER' : 'ROUND';
  if (!o.closed) v.strokeCap = 'ROUND';
  if (o.dash) v.dashPattern = o.dash;
  if (o.corner) { try { v.cornerRadius = o.corner; } catch (e) { /* not supported */ } }
  if (o.index !== undefined) parent.insertChild(o.index, v); else parent.appendChild(v);
  v.x = minX; v.y = minY;
  return v;
}
// arrowheads and diamonds at `tip`, pointing away from `from`
function endShape(D, tip, from, type, index) {
  if (!type || type === 'none') return 0;
  const ux0 = tip[0] - from[0], uy0 = tip[1] - from[1];
  const L = Math.hypot(ux0, uy0) || 1;
  const u = [ux0 / L, uy0 / L], n = [-u[1], u[0]];
  const at = (a, b) => [tip[0] - u[0] * a + n[0] * b, tip[1] - u[1] * a + n[1] * b];
  const o = { name: 'Arrowhead', index };
  if (type === 'open') { polyline(D.cv, [at(10, 5.5), tip, at(10, -5.5)], Object.assign(o, { stroke: INK, sw: 1.5 })); return 0; }
  if (type === 'filled') { polyline(D.cv, [tip, at(11, 5), at(11, -5)], Object.assign(o, { closed: true, fill: INK, sw: 0 })); return 9; }
  if (type === 'hollow') { polyline(D.cv, [tip, at(14, 7.5), at(14, -7.5)], Object.assign(o, { closed: true, fill: PAPER, stroke: INK, sw: 1.5 })); return 14; }
  if (type === 'diamond' || type === 'odiamond') {
    polyline(D.cv, [tip, at(9, 5.5), at(18, 0), at(9, -5.5)], Object.assign(o, { closed: true, fill: type === 'diamond' ? INK : PAPER, stroke: INK, sw: 1.5, name: 'Diamond' }));
    return 18;
  }
  if (type === 'dot') { polyline(D.cv, [at(0, 0), at(4, 4), at(8, 0), at(4, -4)], Object.assign(o, { closed: true, fill: INK, sw: 0 })); return 4; }
  return 0;
}

// ---------------------------------------------------------------- connectors
const HSIDE = { l: true, r: true };
function portAt(b, side, f, abs) {
  if (side === 'l' || side === 'r') {
    const yy = abs !== undefined ? abs : b.y + b.h * (f === undefined ? 0.5 : f);
    return [side === 'l' ? b.x : b.x + b.w, yy];
  }
  const xx = abs !== undefined ? abs : b.x + b.w * (f === undefined ? 0.5 : f);
  return [xx, side === 't' ? b.y : b.y + b.h];
}
function autoSides(a, b) {
  if (b.x >= a.x + a.w + 8) return ['r', 'l'];
  if (b.x + b.w <= a.x - 8) return ['l', 'r'];
  if (b.y >= a.y + a.h + 8) return ['b', 't'];
  if (b.y + b.h <= a.y - 8) return ['t', 'b'];
  return ['r', 'r'];
}
// edge(D, from, to, o): o = { label, dash:true|'dot', head:'open'|'filled'|'hollow'|'diamond'|'odiamond'|'none', tail,
//   from:'l'|'r'|'t'|'b', to, ff, tf (0..1 along the side), fa, ta (absolute x or y on the side), mid, via:[[x,y]..],
//   straight (direct line between the ports), lp (0..1 label position along the path), ldx, ldy, lw, ma, mb (multiplicities) }
function edge(D, fromId, toId, o = {}) {
  const A = D.n[fromId], B = D.n[toId];
  if (!A || !B) { warn('edge: unknown element ' + (A ? toId : fromId)); return null; }
  const a = boundsOf(A), b = boundsOf(B);
  let [s0, s1] = autoSides(a, b);
  if (o.from) s0 = o.from;
  if (o.to) s1 = o.to;
  let fa = o.fa, ta = o.ta;
  // opposite sides that overlap enough: one straight line through the middle of the overlap
  if (!o.via && o.ff === undefined && o.tf === undefined && fa === undefined && ta === undefined && !o.straight) {
    if (HSIDE[s0] && HSIDE[s1] && s0 !== s1) {
      const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
      if (y1 - y0 > 20) fa = ta = (y0 + y1) / 2;
    } else if (!HSIDE[s0] && !HSIDE[s1] && s0 !== s1) {
      const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
      if (x1 - x0 > 20) fa = ta = (x0 + x1) / 2;
    }
  }
  const p0 = portAt(a, s0, o.ff, fa), p3 = portAt(b, s1, o.tf, ta);
  let pts;
  if (o.via) pts = [p0].concat(o.via, [p3]);
  else if (o.straight) pts = [p0, p3];
  else {
    const h0 = HSIDE[s0], h1 = HSIDE[s1];
    if (h0 && h1) {
      if (Math.abs(p0[1] - p3[1]) < 0.5 && s0 !== s1) pts = [p0, p3];
      else {
        const mx = o.mid !== undefined ? o.mid : (s0 === s1 ? (s0 === 'r' ? Math.max(p0[0], p3[0]) + 36 : Math.min(p0[0], p3[0]) - 36) : (p0[0] + p3[0]) / 2);
        pts = [p0, [mx, p0[1]], [mx, p3[1]], p3];
      }
    } else if (!h0 && !h1) {
      if (Math.abs(p0[0] - p3[0]) < 0.5 && s0 !== s1) pts = [p0, p3];
      else {
        const my = o.mid !== undefined ? o.mid : (s0 === s1 ? (s0 === 'b' ? Math.max(p0[1], p3[1]) + 36 : Math.min(p0[1], p3[1]) - 36) : (p0[1] + p3[1]) / 2);
        pts = [p0, [p0[0], my], [p3[0], my], p3];
      }
    } else if (h0) pts = [p0, [p3[0], p0[1]], p3];
    else pts = [p0, [p0[0], p3[1]], p3];
  }
  return drawPath(D, pts, o);
}
// draws a routed path with its ends and label; pts in canvas coordinates
function drawPath(D, pts, o = {}) {
  pts = pts.map(p => [p[0], p[1]]);
  const head = o.head === undefined ? 'open' : o.head;
  const n = pts.length;
  // shorten the ends under solid / hollow shapes so the line does not show through
  const cut = (i, j, len) => {
    if (!len) return;
    const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
    const L = Math.hypot(dx, dy) || 1;
    pts[i] = [pts[i][0] - dx / L * len, pts[i][1] - dy / L * len];
  };
  const tipEnd = pts[n - 1].slice(), tipStart = pts[0].slice();
  const prevEnd = pts[n - 2].slice(), nextStart = pts[1].slice();
  const dash = o.dash === true ? [6, 4] : (o.dash === 'dot' ? [2, 3] : (o.dash || null));
  const line = polyline(D.cv, pts, { stroke: INK, sw: o.sw || 1.5, dash, name: 'Connector' + (o.label ? ' — ' + o.label.split('\n')[0] : ''), corner: 8, index: D.under });
  D.under++;
  const ce = endShape(D, tipEnd, prevEnd, head, D.under); if (head !== 'none') D.under++;
  const cs = endShape(D, tipStart, nextStart, o.tail, D.under); if (o.tail && o.tail !== 'none') D.under++;
  if (ce || cs) {
    const q = pts.slice();
    if (ce) { const dx = q[n - 1][0] - q[n - 2][0], dy = q[n - 1][1] - q[n - 2][1]; const L = Math.hypot(dx, dy) || 1; q[n - 1] = [q[n - 1][0] - dx / L * ce, q[n - 1][1] - dy / L * ce]; }
    if (cs) { const dx = q[0][0] - q[1][0], dy = q[0][1] - q[1][1]; const L = Math.hypot(dx, dy) || 1; q[0] = [q[0][0] - dx / L * cs, q[0][1] - dy / L * cs]; }
    let minX = Infinity, minY = Infinity;
    for (const [px, py] of q) { minX = Math.min(minX, px); minY = Math.min(minY, py); }
    line.vectorPaths = [{ windingRule: 'NONE', data: q.map(([px, py], i) => (i ? 'L ' : 'M ') + r2(px - minX) + ' ' + r2(py - minY)).join(' ') }];
    line.x = minX; line.y = minY;
  }
  if (o.label) edgeLabel(D, pts, o.label, o);
  if (o.ma) multLabel(D, tipStart, nextStart, o.ma, o.mad);
  if (o.mb) multLabel(D, tipEnd, prevEnd, o.mb, o.mbd);
  return line;
}
function pathPoint(pts, t) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(L); total += L; }
  let want = total * t;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? Math.min(1, want / seg[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    want -= seg[i];
  }
  return pts[0];
}
function edgeLabel(D, pts, text, o) {
  let px, py;
  if (o.lxy) [px, py] = o.lxy;
  else if (o.lp !== undefined) [px, py] = pathPoint(pts, o.lp);
  else {
    // middle of the longest segment
    let best = 0, bi = 0;
    for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (L > best) { best = L; bi = i; } }
    px = (pts[bi - 1][0] + pts[bi][0]) / 2; py = (pts[bi - 1][1] + pts[bi][1]) / 2;
  }
  const pill = box({ name: 'Label — ' + text.split('\n')[0], dir: 'V', gap: 0, pad: [2, 6, 2, 6], fill: PAPER, radius: 4, parent: D.cv, cross: o.lalign === 'left' ? 'start' : 'center' });
  txt(text, { style: o.lmono ? 'Code/Small' : 'Caption/Default', color: 'color/text/secondary', parent: pill, name: 'Text', w: o.lw, align: o.lalign === 'left' ? 'LEFT' : 'CENTER' });
  pill.x = Math.round(px - pill.width / 2 + (o.ldx || 0));
  pill.y = Math.round(py - pill.height / 2 + (o.ldy || 0));
  return pill;
}
function multLabel(D, tip, from, text, d) {
  const dx = tip[0] - from[0], dy = tip[1] - from[1];
  const L = Math.hypot(dx, dy) || 1;
  const u = [dx / L, dy / L], n = [-u[1], u[0]];
  const off = d || [26, 12];
  const t = txt(text, { style: 'Code/Small', color: 'color/text/secondary', parent: D.cv, name: 'Multiplicity' });
  t.x = Math.round(tip[0] - u[0] * off[0] + n[0] * off[1] - t.width / 2);
  t.y = Math.round(tip[1] - u[1] * off[0] + n[1] * off[1] - t.height / 2);
  return t;
}

// ---------------------------------------------------------------- sequence diagrams
// seq(parent, o): o = { num, title, desc, colW, parts:[{id, title, tag, icon, dom, kind}], msgs:[...] }
// msgs: { a, b, t, k:'sync'|'async'|'return'|'self' } · { act:id } · { end:id } · { frag:'alt'|'opt'|'loop'|'par', label }
//       · { else:label } · { endfrag:true } · { note, on:id | over:[a,b], w } · { gap:n }
function seq(parent, o) {
  const D = newDiagram(parent, Object.assign({ kind: 'UML sequence diagram' }, o));
  const colW = o.colW || 200;
  const P = {};
  o.parts.forEach((p, i) => {
    const cx = 10 + i * colW + colW / 2;
    const w = p.w || colW - 24;
    el(D, p.id, { x: Math.round(cx - w / 2), y: 0, w, kind: p.kind || 'sys', dom: p.dom, icon: p.icon, tag: p.tag, title: p.title, pad: [10, 12, 12, 12] });
    P[p.id] = { cx, depth: 0, open: [] };
  });
  let hh = 0;
  for (const p of o.parts) hh = Math.max(hh, D.n[p.id].height);
  for (const p of o.parts) { const f = D.n[p.id]; f.layoutSizingVertical = 'FIXED'; f.resize(f.width, hh); }
  let y = hh + 34, num = 0;
  const frags = [];
  const xOf = (id, toward) => { const p = P[id]; return p.cx + (p.depth > 0 ? 6 * Math.sign(toward - p.cx || 1) : 0); };
  const allX = o.parts.map(p => P[p.id].cx);
  const bars = [];
  for (const m of o.msgs) {
    if (m.gap) { y += m.gap; continue; }
    if (m.act) { P[m.act].open.push(y - 8); P[m.act].depth++; continue; }
    if (m.end) { const p = P[m.end]; const y0 = p.open.pop(); p.depth--; bars.push([p.cx, y0, y - 6, p.open.length]); continue; }
    if (m.frag) { frags.push({ type: m.frag, label: m.label, y0: y, elses: [], cover: m.cover }); y += 34; continue; }
    if (m.else !== undefined) { const f = frags[frags.length - 1]; f.elses.push([y, m.else]); y += 30; continue; }
    if (m.endfrag) {
      const f = frags.pop();
      const xs = f.cover ? f.cover.map(id => P[id].cx) : allX;
      const depth = frags.length;
      const x0 = Math.min.apply(null, xs) - colW / 2 + 14 + depth * 8, x1 = Math.max.apply(null, xs) + colW / 2 - 14 - depth * 8;
      fragmentBox(D, x0, f.y0 - 6, x1 - x0, y - f.y0 + 10, f);
      y += 18;
      continue;
    }
    if (m.note) {
      let x0, w;
      if (m.over) { const xa = P[m.over[0]].cx, xb = P[m.over[1]].cx; x0 = Math.min(xa, xb) - 40; w = Math.abs(xb - xa) + 80; }
      else { w = m.w || colW - 30; x0 = P[m.on].cx - w / 2 + (m.dx || 0); }
      const nb = noteBox(D, null, { x: Math.round(x0), y: Math.round(y - 4), w: Math.round(w), text: m.note });
      y += nb.height + 14;
      continue;
    }
    num++;
    const label = (o.numbered === false ? '' : num + '  ') + m.t;
    if (m.k === 'self' || m.a === m.b) {
      const x = xOf(m.a, Infinity);
      const pts = [[x, y], [x + 40, y], [x + 40, y + 22], [x + 2, y + 22]];
      drawPath(D, pts, { head: 'filled' });
      const pill = edgeLabel(D, pts, label, { lxy: [x + 48, y + 11], lalign: 'left', lw: m.lw || colW - 70 });
      pill.x = Math.round(x + 48);
      y += Math.max(40, pill.height + 18);
      continue;
    }
    const xa0 = P[m.a].cx, xb0 = P[m.b].cx;
    const xa = xOf(m.a, xb0), xb = xOf(m.b, xa0);
    const span = Math.abs(xb - xa);
    const lw = m.lw || Math.max(120, Math.min(span - 24, 360));
    const k = m.k || 'sync';
    const pts = [[xa, y], [xb, y]];
    // label above the arrow
    const tmp = edgeLabel(D, pts, label, { lxy: [(xa + xb) / 2, y], lw, lalign: 'left' });
    const lh = tmp.height;
    tmp.y = Math.round(y - lh / 2);
    const ly = y + lh / 2 + 6;
    tmp.y = Math.round(ly - lh - 4);
    drawPath(D, [[xa, ly], [xb, ly]], { head: k === 'sync' ? 'filled' : 'open', dash: k === 'return' ? true : null });
    y = ly + 22;
  }
  const yEnd = y + 6;
  // lifelines and activation bars (under everything else)
  for (const p of o.parts) {
    const cx = P[p.id].cx;
    polyline(D.cv, [[cx, hh], [cx, yEnd]], { stroke: 'color/border/strong', sw: 1.25, dash: [5, 5], name: 'Lifeline ' + p.id, index: 0 });
    D.under++;
  }
  for (const [cx, y0, y1, lvl] of bars) {
    const r = rect({ name: 'Activation', w: 12, h: Math.max(8, y1 - y0), fill: PAPER, stroke: INK, strokeW: 1.25, x: cx - 6 + lvl * 4, y: y0 });
    D.cv.insertChild(D.under, r);
    D.under++;
  }
  return D;
}
function fragmentBox(D, x, y, w, h, f) {
  const r = figma.createFrame();
  r.name = 'Fragment — ' + f.type;
  r.fills = [];
  r.strokes = [paint(INK)];
  r.strokeWeight = 1.25;
  r.cornerRadius = 4;
  r.clipsContent = false;
  D.cv.insertChild(D.under, r);
  D.under++;
  r.resize(w, h);
  r.x = x; r.y = y;
  const tab = box({ name: 'Operator', dir: 'H', pad: [3, 10, 3, 8], fill: INK, radius: [3, 0, 8, 0], parent: r });
  tab.x = 0; tab.y = 0;
  txt(f.type, { style: 'Label/Strong', color: 'color/text/on-ink', parent: tab, name: 'Operator' });
  if (f.label) {
    const g = txt(f.label, { style: 'Caption/Default', color: 'color/text/secondary', parent: r, name: 'Guard' });
    g.x = tab.width + 8; g.y = 4;
  }
  for (const [ey, label] of f.elses) {
    const ln = polyline(r, [[0, ey - y - 4], [w, ey - y - 4]], { stroke: INK, sw: 1.25, dash: [6, 4], name: 'Else' });
    const g = txt(label, { style: 'Caption/Default', color: 'color/text/secondary', parent: r, name: 'Guard' });
    g.x = 10; g.y = ey - y + 2;
  }
  return r;
}

// ---------------------------------------------------------------- layered stacks and tables
// stack(parent, rows, o): rows = [{ title, sub, dom, kind, chips:[...], note }]
function stack(parent, rows, o = {}) {
  const w = o.w || 1200;
  const s = box({ name: o.name || 'Layer stack', dir: 'V', gap: 8, parent, w });
  for (const r of rows) {
    const k = KIND[r.kind || 'sys'];
    const inv = !!k.inverse;
    const row = box({ name: 'Layer — ' + r.title, dir: 'H', gap: 20, pad: [14, 18, 14, 18], cross: 'center', fill: k.fill, stroke: k.stroke || INK, strokeW: k.sw, radius: 10, parent: s, wSize: 'fill' });
    if (k.dash) row.dashPattern = k.dash;
    const head = box({ name: 'Name', dir: 'H', gap: 10, cross: 'center', w: o.labelW || 330, parent: row });
    iconTile(head, r.icon || 'layers', r.dom, 28);
    const t = box({ name: 'Text', dir: 'V', gap: 2, parent: head, grow: true });
    txt(r.title, { style: 'Heading/H3', color: inv ? 'color/text/on-ink' : 'color/text/primary', parent: t, name: 'Title', fill: true });
    if (r.sub) txt(r.sub, { style: 'Caption/Default', color: inv ? 'color/text/on-ink' : 'color/text/tertiary', parent: t, name: 'Sub', fill: true, opacity: inv ? 0.8 : undefined });
    const ch = box({ name: 'Parts', dir: 'H', wrap: true, gap: 6, rowGap: 6, parent: row, grow: true });
    for (const c of r.chips || []) {
      const cc = box({ name: 'Part ' + c, dir: 'H', pad: [5, 10, 5, 10], radius: 6, fill: inv ? '#FFFFFF' : 'color/bg/subtle', fillOpacity: inv ? 0.12 : undefined, parent: ch });
      txt(c, { style: r.mono ? 'Code/Small' : 'Label/Default', color: inv ? 'color/text/on-ink' : 'color/text/primary', parent: cc, name: 'Text' });
    }
  }
  return s;
}
// table(parent, cols:[[title, width]], rows:[[cell, ...]], o)
function table(parent, cols, rows, o = {}) {
  const t = box({ name: o.name || 'Table', dir: 'V', gap: 0, radius: 10, clip: true, stroke: 'color/border/default', parent });
  const hr = box({ name: 'Header row', dir: 'H', gap: 0, fill: INK, parent: t });
  for (const [title, w] of cols) {
    const c = box({ name: 'Head ' + title, dir: 'V', pad: [10, 14, 10, 14], w, parent: hr });
    txt(title, { style: 'Label/Strong', color: 'color/text/on-ink', parent: c, name: 'Text', fill: true });
  }
  rows.forEach((r, i) => {
    const row = box({ name: 'Row ' + (i + 1), dir: 'H', gap: 0, fill: i % 2 ? 'color/bg/app' : PAPER, parent: t });
    r.forEach((cell, j) => {
      const c = box({ name: 'Cell', dir: 'V', gap: 4, pad: [10, 14, 10, 14], w: cols[j][1], parent: row, hSize: 'fill' });
      const strong = j === 0 && o.firstStrong !== false;
      for (const part of [].concat(cell)) txt(part, { style: strong ? 'Label/Strong' : (o.mono && o.mono.indexOf(j) >= 0 ? 'Code/Small' : 'Body/Small'), color: strong ? 'color/text/primary' : 'color/text/secondary', parent: c, name: 'Text', fill: true });
    });
  });
  return t;
}

// ---------------------------------------------------------------- page scaffolding
function pageRoot(page, o) {
  const root = box({ name: o.name || 'Page', dir: 'V', gap: 56, pad: 64, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;
  const hd = box({ name: 'Page header', dir: 'V', gap: 10, parent: root });
  txt(o.overline || 'RoboCore platform · system design', { style: 'Caption/Overline', color: 'color/text/brand', parent: hd, name: 'Overline' });
  txt(o.title, { style: 'Heading/Display', parent: hd, name: 'Title' });
  if (o.intro) txt(o.intro, { style: 'Body/Default', color: 'color/text/secondary', parent: hd, name: 'Intro', w: o.introW || 1100 });
  return root;
}
function hrow(parent, name, gap) { return box({ name: name || 'Row', dir: 'H', gap: gap === undefined ? 48 : gap, cross: 'start', parent }); }
