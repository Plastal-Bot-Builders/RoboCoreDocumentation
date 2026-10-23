// ============================================================================
// The App Icon page (its own design file, "RoboCore IDE — App Icon"): the refreshed
// RoboCore IDE app icon — concepts, master + construction, appearances, small sizes,
// every platform's rules and mock-ups, and real-size export frames named after the
// files in the robocore-ide repo. Geometry comes from app-icon/geom.js (IG) and
// app-icon/concepts.js (CONCEPTS), which build.sh puts in front of src/.
// ============================================================================

let AI_PAGE_NAME = 'Round 2 · Forward Gear'; // set per version by aiUseVersion()
const AI = { comps: {}, small: {}, glyph: null, glyphSmall: null };

// ---------- paints and effects ----------
function aiRgba(hex, a) { const c = hexToRgb(hex); return { r: c.r, g: c.g, b: c.b, a: a === undefined ? 1 : a }; }
// linear gradient from p0 to p1 in the node's unit box; stops: [[position, hex, alpha?], ...]
function aiLin(stops, p0, p1) {
  p0 = p0 || [0.5, 0]; p1 = p1 || [0.5, 1];
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l2 = dx * dx + dy * dy;
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[dx / l2, dy / l2, -(p0[0] * dx + p0[1] * dy) / l2], [-dy / l2, dx / l2, (p0[0] * dy - p0[1] * dx) / l2 + 0.5]],
    gradientStops: stops.map(([pos, hex, a]) => ({ position: pos, color: aiRgba(hex, a) })),
  };
}
function aiDrop(hex, a, y, blur) { return { type: 'DROP_SHADOW', color: aiRgba(hex, a), offset: { x: 0, y }, radius: blur, spread: 0, visible: true, blendMode: 'NORMAL' }; }
function aiInner(hex, a, y, blur) { return { type: 'INNER_SHADOW', color: aiRgba(hex, a), offset: { x: 0, y }, radius: blur, spread: 0, visible: true, blendMode: 'NORMAL' }; }

// ---------- looks (appearances) and plate shapes ----------
const NAVY_GRAD = [[0, '#2D446B'], [1, '#14203A']];
const AI_LOOKS_FORWARD = {
  Default: {
    plate: [[0, '#FFD45A'], [0.5, '#F2B01E'], [1, '#DA920B']], ink: NAVY_GRAD, accent: NAVY_GRAD,
    face: [[0, '#FFFCF2'], [1, '#F0E3C2']], accent2: NAVY_GRAD, shadow: ['#6B3F00', 0.36], rim: 0.5,
    facet: [[0, '#2D446B'], [0.5, '#1C2C49'], [0.5, '#0D1626'], [1, '#0A111E']], accentShade: [[0, '#1C2C49'], [1, '#0B1322']],
    spec: 'Plate #FFD45A → #F2B01E → #DA920B · gear #2D446B → #1C2C49, shade #0D1626 → #0A111E',
  },
  Dark: {
    plate: [[0, '#324C74'], [0.5, '#1B2A41'], [1, '#0E1828']], ink: [[0, '#FFFDF7'], [1, '#EBE1C8']], accent: [[0, '#FFD45A'], [1, '#E5A015']],
    face: [[0, '#FFD45A'], [1, '#E5A015']], accent2: [[0, '#1F3050'], [1, '#111C2D']], shadow: ['#02060C', 0.5], rim: 0.22,
    facet: [[0, '#FFD45A'], [0.5, '#F2B01E'], [0.5, '#C98A0B'], [1, '#B57A06']], accentShade: [[0, '#E9A417'], [1, '#C68709']],
    spec: 'Plate #324C74 → #1B2A41 → #0E1828 · gear #FFD45A → #F2B01E, shade #C98A0B → #B57A06',
  },
  Tinted: {
    plate: [[0, '#3C3C40'], [1, '#121214']], ink: [[0, '#FFFFFF'], [1, '#CFCFD3']], accent: [[0, '#FFFFFF'], [1, '#CFCFD3']],
    face: [[0, '#FFFFFF'], [1, '#CFCFD3']], accent2: [[0, '#3C3C40'], [1, '#121214']], shadow: ['#000000', 0.45], rim: 0.18,
    facet: [[0, '#FFFFFF'], [0.5, '#E4E4E8'], [0.5, '#AEAEB4'], [1, '#9C9CA2']], accentShade: [[0, '#BDBDC2'], [1, '#9C9CA2']],
    spec: 'Greyscale: plate #3C3C40 → #121214 · gear #FFFFFF → #E4E4E8, shade #AEAEB4 → #9C9CA2',
  },
  Clear: {
    glass: true, ink: [[0, '#FFFFFF', 0.96], [1, '#FFFFFF', 0.8]], accent: [[0, '#FFFFFF', 0.96], [1, '#FFFFFF', 0.8]],
    face: [[0, '#FFFFFF', 0.5], [1, '#FFFFFF', 0.35]], accent2: [[0, '#FFFFFF', 0.95], [1, '#FFFFFF', 0.85]], shadow: ['#000000', 0.2], rim: 0.7,
    facet: [[0, '#FFFFFF', 0.96], [0.5, '#FFFFFF', 0.9], [0.5, '#FFFFFF', 0.62], [1, '#FFFFFF', 0.55]], accentShade: [[0, '#FFFFFF', 0.7], [1, '#FFFFFF', 0.55]],
    spec: 'Glass: white 30 % → 10 % plate, 30 px background blur, white glyph',
  },
};
let AI_HERO = 'slant'; // the master glyph (concepts.js), set per version
const AI_ROLE = { 'Planet': 'ink', 'Gear ring': 'ink', 'Planet gear': 'ink', 'Orbit ring': 'ink', 'Spark': 'ink', 'Moon': 'ink', 'Gear': 'facet', 'Gear (flat)': 'accent', 'Gear half (lit)': 'accent', 'Gear half (shade)': 'accentShade',
  'Bracket left': 'ink', 'Bracket right': 'ink', 'Core gear': 'accent', 'Open cog': 'ink', 'Caret': 'accent', 'Head': 'ink', 'Face': 'face', 'Prompt': 'accent2' };
// gradient direction per role (default: top → bottom). The facet is a hard light split along a "/" line.
const AI_DIR = { facet: [[0.15, 0], [0.85, 1]] };
const AI_SHAPES = {
  macOS: { plate: [100, 100, 824, 824], r: 185.4, s: 0.6, drop: true },
  Square: { plate: [0, 0, 1024, 1024], r: 0, s: 0, safe: 450 },
  Rounded: { plate: [0, 0, 1024, 1024], r: 229, s: 0.6, safe: 450 },
  // full bleed like Square, with the glyph kept inside the 80 % safe circle of maskable PWA icons
  Maskable: { plate: [0, 0, 1024, 1024], r: 0, s: 0, safe: 0.8 * 512 },
};

// Round 3 looks: one ink, flat (no gradients, sheen or glyph shadows), like the box print
const flatStops = (h, a) => [[0, h, a], [1, h, a]];
const monoLook = (plate, ink, back, spec) => ({ plate: flatStops(plate), ink: flatStops(ink), accent: flatStops(ink), facet: flatStops(ink), accentShade: flatStops(ink), face: flatStops(back || plate), accent2: flatStops(plate), shadow: ['#000000', 0], rim: 0, spec });
const AI_LOOKS_MONO = {
  Default: monoLook('#F2B01E', '#1B2A41', null, 'One ink: navy #1B2A41 on RoboCore yellow #F2B01E, the box print'),
  Dark: monoLook('#1B2A41', '#F2B01E', null, 'Inverted: yellow #F2B01E on navy #1B2A41'),
  Tinted: monoLook('#1C1C1E', '#FFFFFF', null, 'White on near-black #1C1C1E; the system tints it'),
  Clear: Object.assign(monoLook('#FFFFFF', '#FFFFFF', null, 'Glass plate, white glyph'), { glass: true, ink: flatStops('#FFFFFF', 0.94), accent: flatStops('#FFFFFF', 0.94), shadow: ['#000000', 0.15], rim: 0.7 }),
};
// each menu command builds one round on its own page
const AI_VERSIONS = {
  icon: { key: 'forward', page: 'Round 2 · Forward Gear', hero: 'slant', looks: AI_LOOKS_FORWARD, flat: false, extent: 306, fg: 0.86 },
  orbit: { key: 'orbit', page: 'Round 3 · Geared Ring', hero: 'gearring', looks: AI_LOOKS_MONO, flat: true, extent: 404, fg: 0.7, scale: 0.94 },
};
const AI_LEGACY_PAGES = ['App Icon']; // the first build's page name; becomes the Round 2 page
let AI_V = AI_VERSIONS.icon, AI_LOOKS = AI_LOOKS_FORWARD, AI_FLAT = false;
function aiUseVersion(cmd) {
  AI_V = AI_VERSIONS[cmd] || AI_VERSIONS.icon;
  AI_PAGE_NAME = AI_V.page; AI_HERO = AI_V.hero; AI_LOOKS = AI_V.looks; AI_FLAT = AI_V.flat;
}
// run fn with another round's looks (for "other rounds" thumbnails), then switch back
function aiWithVersion(cmd, fn) {
  const keep = AI_V;
  aiUseVersion(cmd);
  try { return fn(); } finally { aiUseVersion(Object.keys(AI_VERSIONS).find(k => AI_VERSIONS[k] === keep)); }
}

// ---------- vectors, glyphs, icons ----------
// vector from absolute path data in a 1024 space, appended to parent at the same coordinates
function aiVec(d, name, parent, fills) {
  const wrap = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path d="' + d + '" fill="#000000" fill-rule="evenodd"/></svg>');
  const v = wrap.findOne(n => n.type === 'VECTOR');
  const x = v.absoluteTransform[0][2] - wrap.absoluteTransform[0][2], y = v.absoluteTransform[1][2] - wrap.absoluteTransform[1][2];
  parent.appendChild(v); v.x = x; v.y = y;
  wrap.remove();
  v.name = name; v.fills = fills; v.strokes = [];
  return v;
}
function aiPaint(node, look, mono) {
  const L = AI_LOOKS[look];
  for (const v of node.findAll(n => n.type === 'VECTOR')) {
    if (mono) { v.fills = [solid(mono)]; continue; }
    const role = AI_ROLE[v.name];
    if (role && L[role]) v.fills = [aiLin(L[role], ...(AI_DIR[role] || []))];
  }
}
// glyph layers → a 1024 frame (or component) of vectors in a look
function aiGlyphNode(layers, look, asComponent, name) {
  const g = asComponent ? figma.createComponent() : figma.createFrame();
  g.name = name || 'Glyph'; g.resize(1024, 1024); g.fills = []; g.clipsContent = false;
  for (const l of layers) aiVec(l.d, l.name, g, [aiLin(AI_LOOKS[look][l.role], ...(AI_DIR[l.role] || []))]);
  return g;
}
function aiGlyphShadow(look, k) {
  const L = AI_LOOKS[look];
  return [aiDrop(L.shadow[0], L.shadow[1], 14 * k, 28 * k), aiDrop(L.shadow[0], L.shadow[1] * 0.5, 3 * k, 4 * k)];
}
// one icon on a 1024 canvas: plate (shape) + sheen + glyph (look).
// o = { name, look, shape, glyph: () => 1024 node, fit: 'master' (drawn for the 824 plate) | 'small' (drawn for a full canvas), component, noGlyph, tone }
function aiIcon(o) {
  const S = AI_SHAPES[o.shape], L = AI_LOOKS[o.look];
  const f = o.component ? figma.createComponent() : figma.createFrame();
  f.name = o.name || (o.look + ' · ' + o.shape); f.resize(1024, 1024); f.fills = []; f.clipsContent = false;
  const [px, py, pw, ph] = S.plate;
  const plate = figma.createFrame(); plate.name = 'Plate'; f.appendChild(plate);
  plate.resize(pw, ph); plate.x = px; plate.y = py; plate.clipsContent = true;
  plate.cornerRadius = S.r; if (S.s) plate.cornerSmoothing = S.s;
  const eff = [];
  if (S.drop) eff.push(aiDrop('#000000', L.glass ? 0.12 : 0.28, 10, 20));
  if (L.glass) plate.fills = [aiLin([[0, '#FFFFFF', 0.3], [1, '#FFFFFF', 0.1]])];
  else plate.fills = [aiLin(o.tone || L.plate, [0.3, 0], [0.7, 1])];
  if (!AI_FLAT || L.glass) eff.push(aiInner('#FFFFFF', L.rim, 4, 6), aiInner('#000000', L.glass ? 0.04 : 0.12, -6, 12));
  if (L.glass) eff.push({ type: 'BACKGROUND_BLUR', radius: 30, visible: true });
  plate.effects = eff;
  if (!L.glass && !AI_FLAT) {
    const sheen = figma.createRectangle(); sheen.name = 'Sheen'; plate.appendChild(sheen);
    sheen.resize(pw, ph); sheen.x = 0; sheen.y = 0;
    sheen.fills = [aiLin([[0, '#FFFFFF', 0.28], [0.36, '#FFFFFF', 0], [0.72, '#000000', 0], [1, '#000000', 0.1]])];
  }
  if (o.noGlyph) return f;
  const g = o.glyph(); plate.appendChild(g); g.name = 'Glyph';
  let k = (pw / (o.fit === 'small' ? 1024 : 824)) * (o.scale || (o.fit === 'small' ? 1 : (AI_V.scale || 1)));
  if (S.safe && o.fit !== 'small') k = Math.min(k, S.safe / AI_V.extent); // keep the glyph's farthest point inside the shape's safe radius
  if (Math.abs(k - 1) > 1e-6) g.rescale(k);
  g.x = pw / 2 - 512 * k; g.y = ph / 2 - 512 * k;
  aiPaint(g, o.look);
  g.effects = AI_FLAT ? [] : aiGlyphShadow(o.look, k);
  return f;
}
// instance of the App icon component set, scaled to `size` px (≤ 32 px → small glyph where it exists)
function aiUse(look, shape, size, o = {}) {
  const small = o.small !== undefined ? o.small : (size <= 32 && shape !== 'Square');
  const c = (small ? AI.small : AI.comps)[look + '|' + shape] || AI.comps[look + '|' + shape];
  const i = c.createInstance();
  if (size !== 1024) i.rescale(size / 1024);
  i.name = o.name || ('App icon ' + look + ' · ' + shape + ' · ' + size);
  if (o.parent) o.parent.appendChild(i);
  return i;
}
// glyph scale on a full-bleed 1024 canvas, matching Shape=Square
function aiSquareFit() { return Math.min((1024 / 824) * (AI_V.scale || 1), AI_SHAPES.Square.safe / AI_V.extent); }
// glyph without a plate on a transparent 1024 canvas (iOS dark, Android layers)
function aiGlyphOnly(look, scale, mono, name) {
  const f = figma.createFrame(); f.name = name || 'Glyph only'; f.resize(1024, 1024); f.fills = []; f.clipsContent = false;
  const g = AI.glyph.createInstance(); f.appendChild(g);
  if (scale !== 1) g.rescale(scale);
  g.x = 512 - 512 * scale; g.y = 512 - 512 * scale;
  aiPaint(g, look, mono);
  if (!mono && !AI_FLAT) g.effects = aiGlyphShadow(look, scale);
  return f;
}
// a plain neutral app tile for mock-ups (never another product's icon)
const AI_TONES = [[[0, '#B9C2CF'], [1, '#8893A4']], [[0, '#8C9AB0'], [1, '#5D6B82']], [[0, '#D3D7DD'], [1, '#A9B0BA']], [[0, '#7E8796'], [1, '#535B68']]];
function aiBlank(shape, size, i) {
  const b = aiIcon({ shape, look: 'Default', noGlyph: true, tone: AI_TONES[i % AI_TONES.length], name: 'Other app (placeholder)' });
  const dot = figma.createEllipse(); dot.name = 'Mark'; b.children[0].appendChild(dot);
  const pw = b.children[0].width; dot.resize(pw * 0.34, pw * 0.34); dot.x = pw * 0.33; dot.y = pw * 0.33; dot.fills = [solid('#FFFFFF', 0.55)];
  b.rescale(size / 1024);
  return b;
}
function aiScaled(node, size) { node.rescale(size / node.width); return node; }

// ---------- documentation helpers ----------
function aiFigure(parent, node, caption, sub) {
  const fig = box({ name: 'Figure — ' + caption, dir: 'V', gap: 8, cross: 'center', parent });
  fig.appendChild(node);
  txt(caption, { style: 'Label/Small', parent: fig, name: 'Caption', align: 'CENTER' });
  if (sub) txt(sub, { style: 'Caption/Default', color: 'color/text/tertiary', parent: fig, name: 'Sub', align: 'CENTER' });
  return fig;
}
function aiRow(parent, name, gap, cross) { return box({ name, dir: 'H', gap: gap === undefined ? 24 : gap, cross: cross || 'end', parent }); }
function aiBullets(parent, items, w) {
  const col = box({ name: 'Notes', dir: 'V', gap: 6, parent, w, wSize: w ? 'fixed' : 'fill' });
  for (const it of items) txt('•  ' + it, { style: 'Body/Small', color: 'color/text/secondary', parent: col, name: it.slice(0, 40), fill: true });
  return col;
}
function aiTile(parent, name, w, h, fills, radius) {
  const t = box({ name, dir: 'H', align: 'center', cross: 'center', w, h, radius: radius === undefined ? 12 : radius, parent });
  t.fills = fills;
  return t;
}
function aiChip(parent, label, dark) {
  const c = box({ name: 'Chip ' + label, dir: 'H', pad: [4, 10, 4, 10], cross: 'center', radius: 999, fill: dark ? 'color/ink/default' : 'color/brand/default', parent });
  txt(label, { style: 'Caption/Overline', color: dark ? 'color/text/on-ink' : 'color/text/on-bright', parent: c, name: 'Label' });
  return c;
}
function aiCard(parent, title, o = {}) {
  const c = box({ name: title, dir: 'V', gap: o.gap || 16, pad: 28, parent, fill: 'color/bg/raised', radius: 12, stroke: 'color/border/default', w: o.w, wSize: o.w ? 'fixed' : 'fill', grow: o.grow });
  const h = box({ name: 'Card header', dir: 'H', gap: 10, cross: 'center', parent: c, wSize: 'fill' });
  txt(title, { style: 'Heading/H2', parent: h, name: 'Title' });
  if (o.chip) aiChip(h, o.chip);
  if (o.sub) txt(o.sub, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Sub', fill: true });
  return c;
}

// ---------- components ----------
function aiBuildComponents(page) {
  const B = CONCEPTS[AI_HERO];
  const holder = box({ name: 'App icon — components', dir: 'V', gap: 48, pad: 64, fill: 'color/bg/app', radius: 24, parent: page });
  docHeader(holder, 'COMPONENTS', 'App icon components', 'Edit the shape in the two Glyph components; every variant, mock-up and export frame on this page uses instances, so they update together. Colours per appearance are instance overrides.', 1400);
  const gl = aiRow(holder, 'Glyphs', 64, 'start');
  AI.glyph = aiGlyphNode(B.glyph(), 'Default', true, 'App icon/Glyph');
  AI.glyph.description = 'Forward Gear on a 1024 canvas, drawn for the 824 px macOS plate: 8 teeth leaning 7° forward, a > prompt cut through the hub, hard-stop facet fill.';
  gl.appendChild(AI.glyph);
  AI.glyphSmall = aiGlyphNode(B.glyph(B.small), 'Default', true, 'App icon/Glyph · Small');
  AI.glyphSmall.description = 'Small-size glyph for 16–32 px on a full-canvas plate: 6 bigger teeth, a heavier > and a flat fill (no facet).';
  gl.appendChild(AI.glyphSmall);

  const comps = [];
  for (const look of ['Default', 'Dark', 'Tinted', 'Clear']) for (const shape of ['macOS', 'Square', 'Rounded']) {
    const c = aiIcon({ component: true, name: 'Appearance=' + look + ', Shape=' + shape, look, shape, glyph: () => AI.glyph.createInstance(), fit: 'master' });
    comps.push(c); AI.comps[look + '|' + shape] = c;
  }
  const mc = aiIcon({ component: true, name: 'Appearance=Default, Shape=Maskable', look: 'Default', shape: 'Maskable', glyph: () => AI.glyph.createInstance(), fit: 'master' });
  comps.push(mc); AI.comps['Default|Maskable'] = mc;
  const set = figma.combineAsVariants(comps, holder);
  set.name = 'App icon';
  set.description = 'RoboCore IDE app icon. Shape: macOS = 1024 canvas with the 824 squircle plate + shadow; Square = full bleed, opaque (iOS, Android legacy background, Play Store, maskable PWA); Rounded = full-canvas squircle (Windows, Linux, web); Maskable = full bleed with the glyph inside the 80 % safe circle (PWA maskable).';
  aiGridVariants(set, 3, 96);
  const smalls = [];
  for (const look of ['Default', 'Dark']) for (const shape of ['macOS', 'Rounded']) {
    const c = aiIcon({ component: true, name: 'Appearance=' + look + ', Shape=' + shape, look, shape, glyph: () => AI.glyphSmall.createInstance(), fit: 'small' });
    smalls.push(c); AI.small[look + '|' + shape] = c;
  }
  const sset = figma.combineAsVariants(smalls, holder);
  sset.name = 'App icon · Small';
  sset.description = 'For 16, 24 and 32 px exports: same plates, the small glyph.';
  aiGridVariants(sset, 2, 96);
  return holder;
}
function aiGridVariants(set, cols, gap) {
  set.children.forEach((c, i) => { c.x = gap + (i % cols) * (1024 + gap); c.y = gap + Math.floor(i / cols) * (1024 + gap); });
  const rows = Math.ceil(set.children.length / cols);
  set.resize(gap + cols * (1024 + gap), gap + rows * (1024 + gap));
  set.fills = [solid('#E9E2D2')];
}

// ---------- page sections ----------
function aiHeader(root) {
  const s = box({ name: 'Header', dir: 'H', gap: 64, pad: 48, cross: 'center', parent: root, wSize: 'fill', fill: 'color/bg/brand', radius: 16 });
  const col = box({ name: 'Intro', dir: 'V', gap: 14, parent: s, w: 1080 });
  txt('APP ICON · OCTOBER 2026', { style: 'Caption/Overline', color: 'color/text/primary', parent: col });
  txt('RoboCore IDE app icon — refresh', { style: 'Heading/Display', parent: col, name: 'Title' });
  txt('The RoboCore gear, made sharper and more defiant. The teeth lean forward like they are already turning, a hard diagonal of light splits the gear like a slash, and a > prompt is cut straight through the hub, so the gear says "code" and reads as a tool rather than a settings icon. One master, four appearances and a tuned small glyph cover every platform the IDE ships on: web, macOS, Windows, Linux, Android and iOS.', { style: 'Body/Default', parent: col, w: 1080 });
  const pr = box({ name: 'Principles', dir: 'H', gap: 12, parent: col, wrap: true, w: 1080 });
  for (const [t, d] of [['Still the gear', 'The RoboCore mark, nothing added around it'], ['Attitude', 'Teeth lean 7° forward; a hard / of light'], ['Code inside', 'A > prompt cut through the hub'], ['Tuned per size', 'Flat 6-tooth glyph for 16–32 px']]) {
    const c = box({ name: 'Principle ' + t, dir: 'V', gap: 2, pad: [10, 14, 10, 14], radius: 10, fill: '#FFFFFF', fillOpacity: 0.55, parent: pr, w: 258 });
    txt(t, { style: 'Label/Strong', parent: c }); txt(d, { style: 'Caption/Default', color: 'color/text/secondary', parent: c, fill: true });
  }
  const ba = box({ name: 'Before → after', dir: 'H', gap: 28, pad: [28, 36, 24, 36], cross: 'center', parent: s, fill: 'color/bg/app', radius: 20 });
  const before = figma.createRectangle(); before.name = 'Current icon (Icon-512.png)'; before.resize(200, 200);
  before.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(AI_BEFORE_PNG)).hash, scaleMode: 'FIT' }];
  aiFigure(ba, before, 'Before', 'flat gear');
  txt('→', { style: 'Code/Default', parent: ba, name: 'Arrow', noStyle: true }).fontSize = 40;
  aiFigure(ba, aiUse('Default', 'macOS', 300), 'After · Default', 'Forward Gear');
  aiFigure(ba, aiUse('Dark', 'macOS', 300), 'After · Dark', 'dark appearance');
}

function aiConcepts(root) {
  const s = docSection(root, 'Concepts', 'Round 2, after the feedback "keep the gear, make it better and more defiant". Three gear directions in the box palette, each in the Default and Dark looks, then at 64, 32 and 16 px. Forward Gear is developed below.');
  const row = box({ name: 'Concept cards', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const before = aiCard(row, 'Current icon', { w: 380, sub: 'Shipped in robocore-ide today (web/icons/Icon-512.png).' });
  const img = figma.createRectangle(); img.name = 'Current icon'; img.resize(200, 200);
  img.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(AI_BEFORE_PNG)).hash, scaleMode: 'FIT' }];
  before.appendChild(img);
  aiBullets(before, ['The right idea: the gear is the RoboCore mark.', 'But a plain, upright gear is also the Settings icon on iOS, macOS and Android, so it looks polite and generic.', 'Flat, with no depth, and nothing in it says "code".'], 324);
  const mkFor = (key) => (look, size, small) => key === AI_HERO
    ? aiUse(look, 'macOS', size, { small: !!small })
    : aiScaled(aiIcon({ look, shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS[key].glyph(small ? CONCEPTS[key].small : undefined), look, false), fit: small ? 'small' : 'master', name: CONCEPTS[key].title + ' · ' + look }), size);
  const concept = (parent, key, chip, pros) => {
    const C = CONCEPTS[key], mk = mkFor(key);
    const card = aiCard(parent, C.title, { grow: true, chip, sub: C.note });
    const big = aiRow(card, 'Looks', 16, 'center');
    big.appendChild(mk('Default', 200)); big.appendChild(mk('Dark', 200));
    const sm = aiRow(card, 'Small sizes', 16, 'end');
    for (const z of [64, 32, 16]) aiFigure(sm, mk('Default', z, z <= 32), z + ' px');
    aiBullets(card, pros);
  };
  concept(row, AI_HERO, 'RECOMMENDED', ['Still the RoboCore gear, so the brand carries over from the current icon and the wordmark.', 'Teeth leaning forward and the hard diagonal light give it attitude and motion.', 'The > prompt in the hub says "code", and points forward: Run.', 'At 16–32 px a flat 6-tooth version keeps the > readable.']);
  concept(row, 'split', null, ['The most rebellious: the gear sliced by code\'s own slash and knocked out of line.', 'The cut and offset blur at 16–32 px, and a broken gear can also read as "broken".']);
  concept(row, 'run', null, ['The calmest and clearest: a chunky gear with a Run arrow.', 'Less attitude, and the arrow reads as media "play" as much as "run code".']);

  const row2 = box({ name: 'Inspiration and round 1', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const mood = aiCard(row2, 'What we took from the references', { w: 760, sub: 'Pinterest search "icon logos ideas" (the first screen of results; scrolling needs a sign-in).' });
  aiBullets(mood, ['Heavy single-colour marks with hard contrast: one solid gear on a strong plate.', 'Sharp points and hard corners: small tip radii, teeth that lean.', 'A diagonal slash through a shape: the hard / of light across the gear.', 'Negative-space cut-outs (an arrow or letter inside the mark): the > prompt in the hub.', 'A forward lean that suggests motion: 7° clockwise lean, like a ratchet that only turns forward.']);
  const r1 = aiCard(row2, 'Round 1 (earlier)', { grow: true, sub: 'Feedback on these: keep the gear, make it better and more defiant.' });
  const r1row = aiRow(r1, 'Round 1 icons', 24, 'end');
  for (const key of ['brackets', 'opencog', 'bot']) aiFigure(r1row, mkFor(key)('Default', 140), CONCEPTS[key].title);
  const r1x = aiRow(r1, 'Also tried', 24, 'end');
  for (const key of ['ratchet', 'burst']) aiFigure(r1x, mkFor(key)('Default', 110), CONCEPTS[key].title, key === 'ratchet' ? 'read as a saw blade' : 'read as a sun');
}

function aiMaster(root) {
  const B = CONCEPTS[AI_HERO].defaults;
  const s = docSection(root, 'Master and construction', 'Drawn on Apple\'s 1024 macOS grid. The gear\'s tip circle is 612 px (74 % of the plate), so the same glyph fits the Android 66 dp safe circle and the 80 % maskable-PWA circle without redrawing.');
  const row = box({ name: 'Master row', dir: 'H', gap: 48, parent: s, wSize: 'fill' });
  const holder = figma.createFrame(); holder.name = 'Master + keylines'; holder.resize(1024, 1024); holder.fills = []; holder.clipsContent = false;
  const icon = AI.comps['Default|macOS'].createInstance(); holder.appendChild(icon); icon.x = 0; icon.y = 0;
  const G = figma.createFrame(); G.name = 'Keylines'; holder.appendChild(G); G.resize(1024, 1024); G.fills = []; G.clipsContent = false;
  const line = '#2F6BBF';
  const st = (n, dash) => { n.fills = []; n.strokes = [solid(line, 0.9)]; n.strokeWeight = 2.5; n.strokeAlign = 'CENTER'; if (dash) n.dashPattern = [12, 10]; };
  const r0 = figma.createRectangle(); G.appendChild(r0); r0.name = 'Canvas 1024'; r0.resize(1024, 1024); st(r0, true);
  const r1 = figma.createRectangle(); G.appendChild(r1); r1.name = 'Plate 824, r 185.4, smoothing 60 %'; r1.x = 100; r1.y = 100; r1.resize(824, 824); r1.cornerRadius = 185.4; r1.cornerSmoothing = 0.6; st(r1);
  const circ = (r, name, dash) => { const e = figma.createEllipse(); G.appendChild(e); e.name = name; e.resize(2 * r, 2 * r); e.x = 512 - r; e.y = 512 - r; st(e, dash); };
  circ(B.rTip, 'Gear tip circle Ø ' + 2 * B.rTip, true); circ(B.rRoot, 'Gear root circle Ø ' + 2 * B.rRoot, false);
  for (const [n, x, y, w, h] of [['Centre vertical', 511, 60, 2, 904], ['Centre horizontal', 60, 511, 904, 2]]) {
    const r = figma.createRectangle(); G.appendChild(r); r.name = n; r.x = x; r.y = y; r.resize(w, h); r.fills = [solid(line, 0.55)];
  }
  // the facet's hard edge: perpendicular to the gradient axis (0.70, 1) through the centre
  const ux = 1 / Math.hypot(1, 0.7), uy = -0.7 / Math.hypot(1, 0.7);
  const fl = figma.createLine(); G.appendChild(fl); fl.name = 'Facet line'; fl.resize(800, 0);
  fl.x = 512 - 400 * ux; fl.y = 512 - 400 * uy; fl.rotation = Math.atan2(-uy, ux) * 180 / Math.PI;
  fl.strokes = [solid(line, 0.9)]; fl.strokeWeight = 2.5; fl.dashPattern = [4, 8];
  const [ch, cd, ct] = B.chev;
  const cb = figma.createRectangle(); G.appendChild(cb); cb.name = 'Prompt box'; cb.resize(cd + ct, 2 * ch); cb.x = 512 + 10 - (cd + ct) / 2; cb.y = 512 - ch; st(cb, true);
  holder.rescale(720 / 1024);
  row.appendChild(holder);
  const spec = box({ name: 'Spec', dir: 'V', gap: 18, parent: row, grow: true });
  const block = (title, lines) => { const b = box({ name: title, dir: 'V', gap: 6, parent: spec, wSize: 'fill' }); txt(title, { style: 'Heading/H3', parent: b }); for (const l of lines) txt(l, { style: 'Code/Small', color: 'color/text/secondary', parent: b, fill: true, name: l.slice(0, 40) }); return b; };
  block('Layers (top to bottom)', [
    'Glyph       instance of App icon/Glyph · shadow #6B3F00 36 % y14 b28 + 18 % y3 b4',
    '  Gear      ' + B.n + ' teeth, tip Ø ' + 2 * B.rTip + ', root Ø ' + 2 * B.rRoot + ', tooth ' + B.wRoot + ' → ' + B.wTip + ' wide, tips lean ' + B.skew + '° clockwise',
    '            corners: ' + B.tipR + ' at the tips, ' + B.rootR + ' at the roots (hard, not soft)',
    '            hub: > prompt cut out, ' + 2 * ch + ' tall, depth ' + cd + ', stroke ' + ct,
    '            fill: hard-stop gradient along a / line: lit above, deep shade below',
    'Sheen       white 28 % → 0 (top 36 %), black 0 → 10 % (bottom)',
    'Plate       squircle 824 × 824, radius 185.4, corner smoothing 60 %',
    '            rim light: inner shadow white 50 % y4 b6, black 12 % y−6 b12',
    '            macOS only: drop shadow black 28 % y10 b20 (inside the canvas)',
  ]);
  block('Colours', [AI_LOOKS.Default.spec, AI_LOOKS.Dark.spec, AI_LOOKS.Tinted.spec, 'All from the box palette: navy #1B2A41, yellow #F2B01E, cream #F7F1E3.']);
  block('Keylines (blue)', ['dashed square   1024 canvas', 'solid squircle  824 plate (100 px margin)', 'dashed circle   gear tip circle Ø ' + 2 * B.rTip + ' (74 % of the plate)', 'solid circle    gear root circle Ø ' + 2 * B.rRoot, 'dotted line     the facet\'s hard edge', 'dashed box      the > prompt', 'lines           centre axes']);
  const sw = box({ name: 'Swatches', dir: 'H', gap: 12, parent: spec, wSize: 'fill' });
  for (const look of ['Default', 'Dark', 'Tinted']) {
    const L = AI_LOOKS[look];
    const c = box({ name: 'Swatch ' + look, dir: 'V', gap: 6, parent: sw, w: 200 });
    aiTile(c, 'Plate gradient', 200, 56, [aiLin(L.plate, [0, 0.5], [1, 0.5])], 8);
    aiTile(c, 'Gear facet', 200, 28, [aiLin(L.facet, [0, 0.5], [1, 0.5])], 6);
    txt(look, { style: 'Label/Small', parent: c });
  }
}

// ---------- Round 3 (Orbit Gear) sections ----------
const AI_ORBIT_VARIANTS = [
  ['Geared Ring', {}, {}, 'RECOMMENDED', 'A smooth planet whose ring is the RoboCore gear, seen edge-on.', ['The cleanest: one ink, one planet, one ring, like the marks on the reference sheet.', 'The gear is still the hero: 12 teeth all the way round the ring.', 'The ring passes in front with a clean gap and hides behind the planet, so it reads in one colour without outlines.']],
  ['Geared Ring · Prompt', { face: 'prompt' }, { face: 'prompt' }, null, 'A > prompt cut into the planet says "code".', ['Says IDE most directly.', 'A second cut-out makes it busier, and the > is gone below 32 px.']],
  ['Geared Ring · Bot', { face: 'eyes' }, { face: 'eyes' }, null, 'Two eyes turn the planet into a friendly robot.', ['Most fun for young learners.', 'Less like a tool, and the eyes disappear at small sizes.']],
  ['Geared Ring · Moon', { moon: [300, -292, 40] }, { moon: [360, -360, 54] }, null, 'A small moon in orbit, like the reference marks.', ['Adds a sense of motion and scale.', 'One more element; at 16 px it reads as a speck.']],
];
function aiOrbitIcon(opts, smallOpts, look, size, small) {
  const C = CONCEPTS[AI_HERO];
  if (!small && !Object.keys(opts).length) return aiUse(look, 'macOS', size, { small: false });
  if (small && !Object.keys(smallOpts).length) return aiUse(look, 'macOS', size, { small: true });
  const o = small ? Object.assign({}, C.small, smallOpts) : opts;
  return aiScaled(aiIcon({ look, shape: 'macOS', glyph: () => aiGlyphNode(C.glyph(o), look, false), fit: small ? 'small' : 'master', name: C.title + ' · ' + look }), size);
}
function aiHeaderOrbit(root) {
  const s = box({ name: 'Header', dir: 'H', gap: 64, pad: 48, cross: 'center', parent: root, wSize: 'fill', fill: 'color/bg/brand', radius: 16 });
  const col = box({ name: 'Intro', dir: 'V', gap: 14, parent: s, w: 1080 });
  txt('APP ICON · ROUND 3 · ONE INK', { style: 'Caption/Overline', color: 'color/text/primary', parent: col });
  txt('Geared Ring — one ink', { style: 'Heading/Display', parent: col, name: 'Title' });
  txt('A clean, one-ink planet mark from the reference sheet, where the planet\'s ring is the RoboCore gear seen edge-on. The ring passes in front of the planet with a cut gap and disappears behind it, so the mark needs no outlines. It is navy on RoboCore yellow, the box\'s own single ink, with no gradients or shadows. Round 2 (Forward Gear) is on its own page.', { style: 'Body/Default', parent: col, w: 1080 });
  const pr = box({ name: 'Principles', dir: 'H', gap: 12, parent: col, wrap: true, w: 1080 });
  for (const [t, d] of [['One ink', 'Navy on yellow, or yellow on navy'], ['Planet + gear', 'The ring is the RoboCore gear'], ['Negative space', 'A 22 px gap where the ring crosses'], ['Tuned per size', '10 bigger teeth for 16–32 px']]) {
    const c = box({ name: 'Principle ' + t, dir: 'V', gap: 2, pad: [10, 14, 10, 14], radius: 10, fill: '#FFFFFF', fillOpacity: 0.55, parent: pr, w: 258 });
    txt(t, { style: 'Label/Strong', parent: c }); txt(d, { style: 'Caption/Default', color: 'color/text/secondary', parent: c, fill: true });
  }
  const ba = box({ name: 'Before → after', dir: 'H', gap: 28, pad: [28, 36, 24, 36], cross: 'center', parent: s, fill: 'color/bg/app', radius: 20 });
  const before = figma.createRectangle(); before.name = 'Current icon (Icon-512.png)'; before.resize(200, 200);
  before.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(AI_BEFORE_PNG)).hash, scaleMode: 'FIT' }];
  aiFigure(ba, before, 'Before', 'flat gear');
  txt('→', { style: 'Code/Default', parent: ba, name: 'Arrow', noStyle: true }).fontSize = 40;
  aiFigure(ba, aiUse('Default', 'macOS', 300), 'After · Default', 'Geared Ring');
  aiFigure(ba, aiUse('Dark', 'macOS', 300), 'After · Dark', 'inverted ink');
}
function aiConceptsOrbit(root) {
  const s = docSection(root, 'Concepts', 'Round 3, picked from four sketches: the planet\'s ring is the gear. Four takes, all in one ink. Each is shown navy on yellow and inverted, then at 64, 32 and 16 px. Geared Ring is developed below.');
  const row = box({ name: 'Concept cards', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  for (const [title, opts, smallOpts, chip, note, pros] of AI_ORBIT_VARIANTS) {
    const card = aiCard(row, title, { grow: true, chip, sub: note });
    const big = aiRow(card, 'Looks', 16, 'center');
    big.appendChild(aiOrbitIcon(opts, smallOpts, 'Default', 200, false)); big.appendChild(aiOrbitIcon(opts, smallOpts, 'Dark', 200, false));
    const sm = aiRow(card, 'Small sizes', 16, 'end');
    for (const z of [64, 32, 16]) aiFigure(sm, aiOrbitIcon(opts, smallOpts, 'Default', z, z <= 32), z + ' px');
    aiBullets(card, pros);
  }
  const row2 = box({ name: 'Reference and other rounds', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const ref = aiCard(row2, 'What we took from the reference sheet', { w: 900, sub: 'The planet-logo sheet Fred shared (nine Saturn-style marks).' });
  aiBullets(ref, ['A solid planet with a ring sweeping across it: here the ring is the RoboCore gear, seen edge-on.', 'The ring is thicker in front and thinner behind, and its far side is hidden by the planet.', 'Negative space instead of outlines: a gap is cut where the ring passes in front.', 'One flat colour, so it prints, embroiders and laser-cuts as well as it renders.', 'Small extras (a moon, a face) are optional; the plain version is the cleanest.']);
  const other = aiCard(row2, 'Other directions', { grow: true, sub: 'Orbit Gear was the first take on the sheet (not picked); Round 2 has its own page; round 1 is kept for history.' });
  const orow = aiRow(other, 'Other round icons', 24, 'end');
  aiFigure(orow, aiScaled(aiIcon({ look: 'Default', shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS.orbit.glyph(), 'Default', false), fit: 'master', name: 'Orbit Gear' }), 140), 'Orbit Gear', 'round 3, first take');
  aiWithVersion('icon', () => {
    aiFigure(orow, aiScaled(aiIcon({ look: 'Default', shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS.slant.glyph(), 'Default', false), fit: 'master', name: 'Forward Gear' }), 140), 'Forward Gear', 'round 2');
    aiFigure(orow, aiScaled(aiIcon({ look: 'Default', shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS.brackets.glyph(), 'Default', false), fit: 'master', name: 'Core Brackets' }), 140), 'Core Brackets', 'round 1');
  });
}
function aiMasterOrbit(root) {
  const B = CONCEPTS[AI_HERO].defaults;
  const s = docSection(root, 'Master and construction', 'Drawn on Apple\'s 1024 macOS grid. The gear ring is a flat gear (12 teeth, tip Ø ' + 2 * B.rTip + ') squashed to ' + Math.round(B.squash * 100) + ' % of its height and tilted ' + (-B.tilt) + '°. Its teeth reach ' + B.rTip + ' px from the centre, so Android and the maskable PWA icon use the glyph slightly smaller (Shape=Maskable) to keep them inside the safe circles.');
  const row = box({ name: 'Master row', dir: 'H', gap: 48, parent: s, wSize: 'fill' });
  const holder = figma.createFrame(); holder.name = 'Master + keylines'; holder.resize(1024, 1024); holder.fills = []; holder.clipsContent = false;
  const icon = AI.comps['Default|macOS'].createInstance(); holder.appendChild(icon); icon.x = 0; icon.y = 0;
  const G = figma.createFrame(); G.name = 'Keylines'; holder.appendChild(G); G.resize(1024, 1024); G.fills = []; G.clipsContent = false;
  const line = '#2F6BBF';
  const st = (n, dash) => { n.fills = []; n.strokes = [solid(line, 0.9)]; n.strokeWeight = 2.5; n.strokeAlign = 'CENTER'; if (dash) n.dashPattern = [12, 10]; };
  const r0 = figma.createRectangle(); G.appendChild(r0); r0.name = 'Canvas 1024'; r0.resize(1024, 1024); st(r0, true);
  const r1 = figma.createRectangle(); G.appendChild(r1); r1.name = 'Plate 824, r 185.4, smoothing 60 %'; r1.x = 100; r1.y = 100; r1.resize(824, 824); r1.cornerRadius = 185.4; r1.cornerSmoothing = 0.6; st(r1);
  const circ = (r, name, dash) => { const e = figma.createEllipse(); G.appendChild(e); e.name = name; e.resize(2 * r, 2 * r); e.x = 512 - r; e.y = 512 - r; st(e, dash); };
  circ(B.planet, 'Planet Ø ' + 2 * B.planet, false); circ(B.planet + B.gap, 'Back of the ring hidden inside this circle', true);
  const th = IG.rad(B.tilt);
  const ellV = (rx, name, dash) => { const e = aiVec(IG.roundPoly(IG.rotPts(IG.arcPts(512, 512, rx, rx * B.squash, 1, -rx, rx, 48).concat(IG.arcPts(512, 512, rx, rx * B.squash, -1, rx, -rx, 48).slice(1, -1)), 512, 512, th)), name, G, []); st(e, dash); return e; };
  ellV(B.rTip, 'Tooth tips (ellipse)', true); ellV(B.rIn, 'Inner edge (ellipse)', false);
  const ax = figma.createLine(); G.appendChild(ax); ax.name = 'Ring axis (tilt ' + (-B.tilt) + '°)'; ax.resize(2 * B.rTip, 0);
  ax.x = 512 - B.rTip * Math.cos(th); ax.y = 512 - B.rTip * Math.sin(th); ax.rotation = -B.tilt; ax.strokes = [solid(line, 0.9)]; ax.strokeWeight = 2.5; ax.dashPattern = [4, 8];
  holder.rescale(720 / 1024);
  row.appendChild(holder);
  const spec = box({ name: 'Spec', dir: 'V', gap: 18, parent: row, grow: true });
  const block = (title, lines) => { const b = box({ name: title, dir: 'V', gap: 6, parent: spec, wSize: 'fill' }); txt(title, { style: 'Heading/H3', parent: b }); for (const l of lines) txt(l, { style: 'Code/Small', color: 'color/text/secondary', parent: b, fill: true, name: l.slice(0, 40) }); return b; };
  block('Layers (top to bottom)', [
    'Glyph       instance of App icon/Glyph, one ink, no effects',
    '  Gear ring  ' + B.n + ' teeth, tip Ø ' + 2 * B.rTip + ', root Ø ' + 2 * B.rRoot + ', inner Ø ' + 2 * B.rIn + ', tooth ' + B.wRoot + ' → ' + B.wTip,
    '             squashed to ' + Math.round(B.squash * 100) + ' % (seen edge-on), tilted ' + (-B.tilt) + '° (rising to the right)',
    '             front half drawn over the planet; back half hidden inside planet + ' + B.gap,
    '  Planet     circle Ø ' + 2 * B.planet + ', cut by the front of the ring with a ' + B.gap + ' px gap',
    'Plate       squircle 824 × 824, radius 185.4, corner smoothing 60 %, flat colour',
    '            macOS only: drop shadow black 28 % y10 b20 (inside the canvas)',
  ]);
  block('Colours', [AI_LOOKS.Default.spec, AI_LOOKS.Dark.spec, AI_LOOKS.Tinted.spec, 'Two colours per look, never more: the plate and one ink.']);
  block('Keylines (blue)', ['dashed square   1024 canvas', 'solid squircle  824 plate (100 px margin)', 'solid circle    planet; dashed circle: where the back of the ring is hidden', 'dashed ellipse  tooth tips; solid ellipse: inner edge of the ring', 'dotted line     ring axis']);
  const sw = box({ name: 'Swatches', dir: 'H', gap: 12, parent: spec, wSize: 'fill' });
  for (const look of ['Default', 'Dark', 'Tinted']) {
    const L = AI_LOOKS[look];
    const c = box({ name: 'Swatch ' + look, dir: 'H', gap: 0, parent: sw, w: 200, h: 56, radius: 8, clip: true });
    aiTile(c, 'Plate', 100, 56, [solid(L.plate[0][1])], 0); aiTile(c, 'Ink', 100, 56, [solid(L.ink[0][1])], 0);
    txt(look, { style: 'Label/Small', parent: sw });
  }
}

function aiAppearances(root) {
  const s = docSection(root, 'Appearances', 'One master in four looks. iOS 18+ and macOS 26 switch between Default, Dark and Tinted (and Clear, from Liquid Glass) with the system setting; the other platforms use Default.');
  const row = box({ name: 'Appearance cards', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const items = [
    ['Default', [[0, '#F7F1E3'], [1, '#EDE4CF']], 'Everywhere by default. Yellow is the box, and it stands out in a dock full of blue and black editor icons.'],
    ['Dark', [[0, '#16233A'], [1, '#0B1422']], 'iOS 18+ and macOS 26 dark appearance, and the dark favicon. Matches the IDE\'s Navy dark mode.'],
    ['Tinted', [[0, '#3A3F4A'], [1, '#1A1D24']], 'iOS 18+ and macOS 26 tinted appearance: greyscale art that the system colours with the user\'s tint.'],
    ['Clear', [[0, '#5B8BD6'], [0.5, '#C76B9E'], [1, '#F2B01E']], 'Liquid Glass "Clear" (iOS 26, macOS 26), mocked up over a wallpaper. The system makes it from the layered icon.'],
  ];
  for (const [look, bg, use] of items) {
    const c = aiCard(row, look, { grow: true });
    const t = aiTile(c, look + ' backdrop', 300, 300, [aiLin(bg, [0, 0], [1, 1])], 16);
    t.layoutSizingHorizontal = 'FILL';
    aiUse(look, 'macOS', 260, { parent: t });
    txt(use, { style: 'Body/Small', color: 'color/text/secondary', parent: c, fill: true });
  }
  const mono = aiCard(row, 'Mono glyph', { grow: true });
  const mt = box({ name: 'Mono tiles', dir: 'H', gap: 12, parent: mono, wSize: 'fill' });
  const t1 = aiTile(mt, 'On cream', 144, 300, [solid('#F7F1E3')], 16); t1.layoutGrow = 1;
  t1.appendChild(aiScaled(aiGlyphOnly('Default', 1.1, '#1B2A41', 'Mono glyph navy'), 130));
  const t2 = aiTile(mt, 'On navy', 144, 300, [solid('#1B2A41')], 16); t2.layoutGrow = 1;
  t2.appendChild(aiScaled(aiGlyphOnly('Default', 1.1, '#F7F1E3', 'Mono glyph cream'), 130));
  txt('Single ink, no plate: the Android 13+ monochrome layer (themed icons), Linux symbolic icons and mask icons.', { style: 'Body/Small', color: 'color/text/secondary', parent: mono, fill: true });
}

function aiSizes(root) {
  const s = docSection(root, 'Sizes and the small glyph', AI_V.key === 'orbit' ? 'Shown at real size. At 32 px and below 12 thin teeth merge into a blur, so those sizes use App icon/Glyph · Small: 10 bigger teeth, a thicker ring and a bigger planet, drawn for a full-canvas plate.' : 'Shown at real size. At 32 px and below the leaning teeth and the facet blur together, so those sizes use App icon/Glyph · Small: 6 bigger teeth, a heavier > and a flat fill, drawn for a full-canvas plate.');
  const r1 = aiRow(s, 'macOS sizes', 28);
  for (const z of [512, 256, 128, 64, 32, 16]) aiFigure(r1, aiUse('Default', 'macOS', z), z + ' px', z <= 32 ? 'small glyph' : null);
  const r2 = aiRow(s, 'Rounded sizes', 28);
  for (const z of [256, 128, 64, 48, 32, 24, 16]) aiFigure(r2, aiUse('Default', 'Rounded', z), z + ' px', z <= 32 ? 'small glyph' : null);
  for (const z of [256, 64, 32, 24, 16]) aiFigure(r2, aiUse('Dark', 'Rounded', z), z + ' px', 'Dark');
  txt('Scaled master vs small glyph (1× and enlarged 4×)', { style: 'Heading/H3', parent: s });
  const r3 = aiRow(s, 'Comparison', 40);
  for (const z of [32, 24, 16]) {
    const pair = aiRow(r3, 'Pair ' + z, 16);
    aiFigure(pair, aiUse('Default', 'Rounded', z, { small: false }), z + ' master');
    aiFigure(pair, aiUse('Default', 'Rounded', z, { small: true }), z + ' small');
    aiFigure(pair, aiUse('Default', 'Rounded', z * 4, { small: false }), '4× master');
    aiFigure(pair, aiUse('Default', 'Rounded', z * 4, { small: true }), '4× small');
  }
}

// ---------- platform mock-ups ----------
function aiAbsCenter(parent, node, cx, cy) { parent.appendChild(node); node.x = cx - node.width / 2; node.y = cy - node.height / 2; return node; }
function aiDock(w) {
  const wall = figma.createFrame(); wall.name = 'macOS Dock (mock-up)'; wall.resize(w, 250); wall.cornerRadius = 12; wall.clipsContent = true;
  wall.fills = [aiLin([[0, '#46679A'], [0.6, '#1B2A41'], [1, '#0E1828']], [0, 0], [1, 1])];
  const dock = figma.createFrame(); dock.name = 'Dock'; wall.appendChild(dock);
  const n = 7, cell = 96, gap = 6, pad = 10, ours = 3;
  dock.resize(pad * 2 + n * cell + (n - 1) * gap, cell + pad * 2); dock.cornerRadius = 26;
  dock.fills = [solid('#FFFFFF', 0.16)]; dock.strokes = [solid('#FFFFFF', 0.3)]; dock.strokeWeight = 1; dock.strokeAlign = 'INSIDE';
  dock.effects = [{ type: 'BACKGROUND_BLUR', radius: 24, visible: true }];
  dock.x = (w - dock.width) / 2; dock.y = 250 - dock.height - 18;
  for (let i = 0; i < n; i++) {
    const ic = i === ours ? aiUse('Default', 'macOS', cell) : aiBlank('macOS', cell, i);
    dock.appendChild(ic); ic.x = pad + i * (cell + gap); ic.y = pad;
  }
  const dot = figma.createEllipse(); dot.name = 'Running'; wall.appendChild(dot); dot.resize(6, 6); dot.fills = [solid('#FFFFFF', 0.85)];
  dot.x = dock.x + pad + ours * (cell + gap) + cell / 2 - 3; dot.y = dock.y + dock.height - 7;
  const tip = box({ name: 'Tooltip', dir: 'H', pad: [6, 12, 6, 12], radius: 8, fill: '#111C2D', fillOpacity: 0.85, parent: wall });
  txt('RoboCore', { style: 'Label/Default', color: 'color/text/on-ink', parent: tip });
  tip.x = dock.x + pad + ours * (cell + gap) + cell / 2 - tip.width / 2; tip.y = dock.y - tip.height - 10;
  return wall;
}
function aiPhone(look, label) {
  const ph = figma.createFrame(); ph.name = 'iPhone home screen · ' + label + ' (mock-up)'; ph.resize(250, 300); ph.cornerRadius = 36; ph.clipsContent = true;
  const wall = { Default: [[0, '#FCE9BF'], [1, '#E8C77A']], Dark: [[0, '#1E2F4B'], [1, '#05090F']], Tinted: [[0, '#2B2620'], [1, '#0B0A08']] }[look];
  ph.fills = [aiLin(wall, [0, 0], [1, 1])];
  const shape = 'Rounded', z = 46;
  for (let i = 0; i < 8; i++) {
    const col = i % 4, rowi = Math.floor(i / 4);
    const x = 18 + col * 56, y = 34 + rowi * 84;
    const ic = i === 5 ? aiUse(look === 'Default' ? 'Default' : look, shape, z, { small: false }) : aiBlank(shape, z, i);
    if (i !== 5 && look !== 'Default') { const pl = ic.children[0]; pl.fills = [aiLin([[0, look === 'Tinted' ? '#4A4740' : '#2E4166'], [1, look === 'Tinted' ? '#1A1916' : '#141F33']], [0.3, 0], [0.7, 1])]; }
    ph.appendChild(ic); ic.x = x; ic.y = y;
    const t = txt(i === 5 ? 'RoboCore' : 'App', { style: 'Caption/Default', color: look === 'Default' ? '#1B2A41' : '#F7F1E3', parent: ph, noStyle: true, align: 'CENTER' });
    t.fontSize = 10; t.lineHeight = { unit: 'PIXELS', value: 12 };
    t.x = x + z / 2 - t.width / 2; t.y = y + z + 4;
  }
  return ph;
}
function aiAdaptive(mask, look, size, themed) {
  // a launcher icon: 108 dp layers drawn at size × 1.5, masked to the 72 dp viewport
  const m = figma.createFrame(); m.name = 'Mask · ' + mask; m.resize(size, size); m.clipsContent = true; m.fills = [];
  if (mask === 'Circle') m.cornerRadius = size / 2;
  else if (mask === 'Squircle') { m.cornerRadius = size * 0.4; m.cornerSmoothing = 1; }
  else if (mask === 'Rounded square') m.cornerRadius = size * 0.2;
  else if (mask === 'Teardrop') { m.topLeftRadius = size / 2; m.topRightRadius = size / 2; m.bottomLeftRadius = size / 2; m.bottomRightRadius = size * 0.12; }
  const L = size * 1.5;
  const bg = figma.createRectangle(); bg.name = 'Background layer'; m.appendChild(bg); bg.resize(L, L); bg.x = -size * 0.25; bg.y = -size * 0.25;
  bg.fills = themed ? [solid(themed[0])] : [aiLin(AI_LOOKS[look].plate, [0.3, 0], [0.7, 1])];
  const fg = aiGlyphOnly(look, AI_V.fg, themed ? themed[1] : null, 'Foreground layer'); fg.rescale(L / 1024); m.appendChild(fg); fg.x = -size * 0.25; fg.y = -size * 0.25;
  return m;
}
function aiSafeZone(size) {
  // foreground layer with the 72 dp viewport and the 66 dp safe circle
  const f = figma.createFrame(); f.name = 'Foreground + safe zone'; f.resize(size, size); f.fills = [solid('#EDE4CF')]; f.cornerRadius = 8; f.clipsContent = true;
  const fg = aiGlyphOnly('Default', AI_V.fg, null, 'Foreground layer'); fg.rescale(size / 1024); f.appendChild(fg); fg.x = 0; fg.y = 0;
  const vp = figma.createRectangle(); vp.name = 'Visible 72 dp'; f.appendChild(vp); vp.resize(size * 72 / 108, size * 72 / 108); vp.x = vp.y = size * 18 / 108;
  vp.fills = []; vp.strokes = [solid('#2F6BBF', 0.9)]; vp.dashPattern = [6, 5]; vp.strokeWeight = 1.5;
  const sc = figma.createEllipse(); sc.name = 'Safe circle 66 dp'; f.appendChild(sc); sc.resize(size * 66 / 108, size * 66 / 108); sc.x = sc.y = size * 21 / 108;
  sc.fills = []; sc.strokes = [solid('#2F6BBF', 0.9)]; sc.strokeWeight = 1.5;
  return f;
}
function aiTaskbar(w, dark) {
  const bar = figma.createFrame(); bar.name = 'Windows 11 taskbar · ' + (dark ? 'dark' : 'light') + ' (mock-up)'; bar.resize(w, 56); bar.cornerRadius = 10; bar.clipsContent = true;
  bar.fills = [solid(dark ? '#202020' : '#F3F3F3')];
  const n = 6, ours = 3, cell = 44;
  const x0 = (w - n * cell) / 2;
  for (let i = 0; i < n; i++) {
    const ic = i === ours ? aiUse('Default', 'Rounded', 24) : aiBlank('Rounded', 24, i);
    bar.appendChild(ic); ic.x = x0 + i * cell + (cell - 24) / 2; ic.y = 14;
    if (i === ours) {
      const hl = figma.createRectangle(); hl.name = 'Hover'; bar.insertChild(0, hl); hl.resize(40, 40); hl.cornerRadius = 6; hl.x = x0 + i * cell + 2; hl.y = 6; hl.fills = [solid(dark ? '#FFFFFF' : '#000000', 0.07)];
      const pill = figma.createRectangle(); pill.name = 'Running'; bar.appendChild(pill); pill.resize(16, 3); pill.cornerRadius = 2; pill.x = x0 + i * cell + cell / 2 - 8; pill.y = 49; pill.fills = [solid('#F2B01E')];
    }
  }
  return bar;
}
function aiDash(w) {
  const wall = figma.createFrame(); wall.name = 'Linux dock (GNOME-style mock-up)'; wall.resize(w, 120); wall.cornerRadius = 12; wall.clipsContent = true;
  wall.fills = [aiLin([[0, '#2B3A55'], [1, '#121821']], [0, 0], [1, 1])];
  const n = 5, ours = 2, cell = 64;
  const dash = figma.createFrame(); dash.name = 'Dash'; wall.appendChild(dash); dash.resize(n * cell + 16, cell + 16); dash.cornerRadius = 22; dash.fills = [solid('#242424', 0.92)];
  dash.x = (w - dash.width) / 2; dash.y = (120 - dash.height) / 2;
  for (let i = 0; i < n; i++) {
    const ic = i === ours ? aiUse('Default', 'Rounded', 48) : aiBlank('Rounded', 48, i);
    dash.appendChild(ic); ic.x = 8 + i * cell + 8; ic.y = 12;
  }
  const dot = figma.createEllipse(); dot.name = 'Running'; dash.appendChild(dot); dot.resize(5, 5); dot.fills = [solid('#FFFFFF', 0.9)]; dot.x = 8 + ours * cell + 8 + 24 - 2.5; dot.y = cell + 6;
  return wall;
}
function aiTabs(w, dark) {
  const bar = figma.createFrame(); bar.name = 'Browser tabs · ' + (dark ? 'dark' : 'light') + ' (mock-up)'; bar.resize(w, 52); bar.cornerRadius = 10; bar.clipsContent = true;
  bar.fills = [solid(dark ? '#1F2023' : '#DEE1E6')];
  const tab = (x, active, title, fav) => {
    const t = box({ name: 'Tab ' + title, dir: 'H', gap: 8, pad: [0, 12, 0, 12], cross: 'center', w: 240, h: 40, radius: [10, 10, 0, 0], parent: bar });
    t.fills = active ? [solid(dark ? '#35363A' : '#FFFFFF')] : [];
    t.x = x; t.y = 12;
    t.appendChild(fav);
    txt(title, { style: 'Label/Default', color: dark ? '#E8EAED' : '#3C4043', parent: t, grow: true });
    txt('×', { style: 'Label/Default', color: dark ? '#9AA0A6' : '#5F6368', parent: t });
    return t;
  };
  tab(10, true, 'RoboCore IDE', aiUse(dark ? 'Dark' : 'Default', 'Rounded', 16));
  const ph = figma.createEllipse(); ph.name = 'Placeholder favicon'; ph.resize(16, 16); ph.fills = [solid(dark ? '#5F6368' : '#9AA0A6')];
  tab(256, false, 'Docs', ph);
  return bar;
}

// ---------- exports (one list drives the frames and the table) ----------
const AI_RES = 'android/app/src/main/res/';
const AI_MAC = 'macos/Runner/Assets.xcassets/AppIcon.appiconset/';
const AI_IOS = 'ios/Runner/Assets.xcassets/AppIcon.appiconset/';
function aiExportList() {
  const U = (look, shape, z, small) => () => aiUse(look, shape, 1024, { small: small !== undefined ? small : (z <= 32 && shape !== 'Square') });
  const plateOnly = () => aiIcon({ look: 'Default', shape: 'Square', noGlyph: true, name: 'Background layer' });
  const L = [];
  for (const z of [1024, 512, 256, 128, 64, 32, 16]) L.push(['macOS', AI_MAC + 'app_icon_' + z, z, U('Default', 'macOS', z), 'PNG', 'macOS shape' + (z <= 32 ? ', small glyph' : '')]);
  L.push(['iOS', AI_IOS + 'Icon-App-1024x1024@1x', 1024, U('Default', 'Square', 1024), 'PNG', 'opaque, square; Xcode/flutter_launcher_icons makes the other sizes']);
  L.push(['iOS', AI_IOS + 'Icon-App-Dark-1024x1024@1x', 1024, () => aiGlyphOnly('Dark', aiSquareFit(), null, 'iOS dark glyph'), 'PNG', 'glyph on transparent; iOS adds the dark backdrop']);
  L.push(['iOS', AI_IOS + 'Icon-App-Tinted-1024x1024@1x', 1024, U('Tinted', 'Square', 1024), 'PNG', 'greyscale; iOS tints it']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher_background', 432, plateOnly, 'PNG', '108 dp × 4; or a colour/gradient drawable']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher_foreground', 432, () => aiGlyphOnly('Default', AI_V.fg, null, 'Android foreground'), 'PNG', 'glyph inside the 66 dp safe circle']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher_monochrome', 432, () => aiGlyphOnly('Default', AI_V.fg, '#1B2A41', 'Android monochrome'), 'PNG', 'themed icons (Android 13+): alpha only']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher', 192, U('Default', 'Rounded', 192), 'PNG', 'legacy 48 dp launcher icon']);
  L.push(['Android', 'android/play_store_512', 512, U('Default', 'Square', 512), 'PNG', 'Google Play listing; Play rounds it']);
  for (const z of [256, 64, 48, 32, 24, 16]) L.push(['Windows', 'windows/ico/app_icon_' + z, z, U('Default', 'Rounded', z), 'PNG', 'into windows/runner/resources/app_icon.ico']);
  L.push(['Linux', 'linux/runner/resources/app_icon', 256, U('Default', 'Rounded', 256), 'PNG', 'window icon (Flutter runner)']);
  L.push(['Linux', 'linux/hicolor/scalable/apps/robocore', 1024, U('Default', 'Rounded', 1024), 'SVG', 'scalable hicolor icon']);
  for (const z of [512, 128, 64, 48, 32, 16]) L.push(['Linux', 'linux/hicolor/' + z + 'x' + z + '/apps/robocore', z, U('Default', 'Rounded', z), 'PNG', 'hicolor theme']);
  L.push(['Web', 'web/favicon', 1024, U('Default', 'Rounded', 1024), 'SVG', 'favicon.svg (add a prefers-color-scheme block for Dark)']);
  L.push(['Web', 'web/favicon', 32, U('Default', 'Rounded', 32), 'PNG', 'replaces the 64 px favicon.png; small glyph']);
  L.push(['Web', 'web/favicon-16', 16, U('Default', 'Rounded', 16), 'PNG', 'small glyph']);
  L.push(['Web', 'web/icons/apple-touch-icon', 180, U('Default', 'Square', 180), 'PNG', 'opaque; iOS rounds it']);
  L.push(['Web', 'web/icons/Icon-192', 192, U('Default', 'Rounded', 192), 'PNG', 'manifest, purpose any']);
  L.push(['Web', 'web/icons/Icon-512', 512, U('Default', 'Rounded', 512), 'PNG', 'manifest, purpose any']);
  L.push(['Web', 'web/icons/Icon-maskable-192', 192, U('Default', 'Maskable', 192), 'PNG', 'manifest, purpose maskable']);
  L.push(['Web', 'web/icons/Icon-maskable-512', 512, U('Default', 'Maskable', 512), 'PNG', 'manifest, purpose maskable']);
  return L;
}
function aiExportFrame(name, size, build, format) {
  const f = figma.createFrame(); f.name = name; f.resize(size, size); f.fills = []; f.clipsContent = true;
  const n = build(); if (size !== 1024) n.rescale(size / 1024); f.appendChild(n); n.x = 0; n.y = 0;
  f.exportSettings = [format === 'SVG' ? { format: 'SVG' } : { format: 'PNG', constraint: { type: 'SCALE', value: 1 } }];
  return f;
}
function aiBuildExports(page, list) {
  const holder = box({ name: 'App icon — exports (real size)', dir: 'V', gap: 48, pad: 64, fill: 'color/bg/app', radius: 24, parent: page });
  docHeader(holder, 'EXPORTS', 'Export frames, real size', 'Select a frame (or a whole row) and press Export: each frame is named after its path in the robocore-ide repo and already has its PNG/SVG export setting. The Windows PNGs go into app_icon.ico.', 1400);
  const groups = {};
  for (const [plat, name, size, build, fmt] of list) {
    if (!groups[plat]) {
      txt(plat, { style: 'Heading/H2', parent: holder });
      groups[plat] = box({ name: 'Exports — ' + plat, dir: 'H', gap: 32, cross: 'end', parent: holder, wrap: true, w: 4200, rowGap: 32 });
    }
    const f = aiExportFrame(name, size, build, fmt);
    const fig = box({ name: 'Export — ' + name, dir: 'V', gap: 8, parent: groups[plat] });
    fig.appendChild(f);
    txt(name.split('/').pop() + '.' + fmt.toLowerCase() + ' · ' + size + ' px', { style: 'Code/Small', color: 'color/text/secondary', parent: fig });
  }
  return holder;
}
function aiExportTable(root, list) {
  const s = docSection(root, 'Export map', 'Every file the icon needs, by platform. The frames are in "App icon — exports (real size)" to the right of this column. Paths are relative to the robocore-ide repo; Windows and Linux hicolor files are collected by the packaging step.');
  const head = box({ name: 'Header row', dir: 'H', gap: 16, pad: [8, 12, 8, 12], fill: 'color/bg/subtle', radius: 6, parent: s, wSize: 'fill' });
  const cols = [['Platform', 140], ['File', 980], ['Size', 120], ['Format', 90], ['Notes', 760]];
  for (const [c, w] of cols) txt(c, { style: 'Label/Strong', parent: head, w });
  const table = box({ name: 'Rows', dir: 'V', gap: 0, parent: s, wSize: 'fill' });
  for (const [plat, name, size, , fmt, note] of list) {
    const r = box({ name: 'Row ' + name, dir: 'H', gap: 16, pad: [7, 12, 7, 12], parent: table, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    const vals = [plat, name + '.' + fmt.toLowerCase(), size + ' × ' + size, fmt, note];
    vals.forEach((v, i) => txt(v, { style: i === 1 ? 'Code/Small' : 'Body/Small', color: i === 1 ? 'color/text/primary' : 'color/text/secondary', parent: r, w: cols[i][1] }));
  }
}

function aiPlatforms(root) {
  const s = docSection(root, 'Platforms', 'What each platform expects, previews of the deliverables and a mock-up in context. Other apps in the mock-ups are neutral placeholders.');
  const grid = box({ name: 'Platform cards', dir: 'H', gap: 32, parent: s, wSize: 'fill', wrap: true, rowGap: 32 });
  const W = 1072; // two columns + 32 gap inside the 2192 px section
  const fig = (row, node, cap, sub) => aiFigure(row, node, cap, sub);

  // macOS
  let c = aiCard(grid, 'macOS', { w: W, sub: 'macOS 11–15 icon grid; macOS 26 (Tahoe) Liquid Glass' });
  aiBullets(c, [
    '1024 × 1024 canvas with the 824 × 824 squircle plate (100 px margin) and a soft shadow inside the canvas: Apple\'s macOS grid.',
    'AppIcon.appiconset: 16, 32, 64, 128, 256, 512 and 1024 px (Flutter names them app_icon_N.png). 16 and 32 px use the small glyph.',
    'macOS 26 puts icons that don\'t fill the squircle into a grey box; this plate already is the squircle. For full Liquid Glass, rebuild the two layers below in Apple\'s Icon Composer; it adds the glass light itself' + (AI_V.key === 'orbit' ? ', and this art is already one flat ink.' : ', so the gear layer is flat (no facet).'),
  ]);
  let row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'macOS', 200), 'app_icon_1024', 'shown at 200');
  for (const z of [128, 64, 32, 16]) fig(row, aiUse('Default', 'macOS', z), z + ' px');
  const layers = aiRow(c, 'Icon Composer layers', 16);
  const lt = (name, build) => { const t = aiTile(layers, name, 150, 150, [solid('#EDE4CF')], 12); t.appendChild(build()); return fig(layers, t, name); };
  lt('Background', () => { const b = aiIcon({ look: 'Default', shape: 'Rounded', noGlyph: true, name: 'Background' }); b.rescale(120 / 1024); return b; });
  lt(AI_V.key === 'orbit' ? 'Layer 1 · Planet + gear ring' : 'Layer 1 · Gear (flat)', () => { const g = aiGlyphOnly('Default', 1, '#1B2A41', 'Gear'); g.rescale(130 / 1024); return g; });
  c.appendChild(aiDock(W - 56));

  // iOS
  c = aiCard(grid, 'iOS and iPadOS', { w: W, sub: 'iOS 18 appearances; iOS 26 Liquid Glass' });
  aiBullets(c, [
    'One 1024 × 1024 PNG, opaque, with square corners: iOS applies the rounded mask itself.',
    'iOS 18+: a Dark variant (glyph on transparent; iOS draws the dark backdrop) and a Tinted variant (greyscale; iOS tints it).',
    'iOS 26: build the same two Icon Composer layers as macOS to get Liquid Glass, Clear and Tinted for free.',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'Square', 160), 'Icon-App-1024', 'square, opaque');
  fig(row, aiUse('Default', 'Rounded', 160), 'as iOS shows it', 'system mask');
  const dk = aiTile(null, 'Dark variant backdrop', 160, 160, [aiLin([[0, '#2A2D33'], [1, '#0B0C0E']])], 36);
  dk.appendChild(aiScaled(aiGlyphOnly('Dark', aiSquareFit(), null, 'Dark glyph'), 160));
  fig(row, dk, 'Dark', 'glyph on transparent');
  fig(row, aiUse('Tinted', 'Rounded', 160), 'Tinted', 'greyscale');
  const phones = aiRow(c, 'Home screens', 16, 'start');
  for (const [look, label] of [['Default', 'Light'], ['Dark', 'Dark'], ['Tinted', 'Tinted']]) fig(phones, aiPhone(look, label), label);

  // Android
  c = aiCard(grid, 'Android', { w: W, sub: 'Adaptive icon (Android 8+); themed icon (Android 13+)' });
  aiBullets(c, [
    'Adaptive icon: 108 × 108 dp background and foreground layers. Launchers show the centre 72 dp and may cut anything outside the 66 dp safe circle; the glyph stays inside it.',
    'Monochrome layer (Android 13+): the launcher recolours it from the wallpaper for themed icons.',
    'Legacy ic_launcher PNG (48 dp) for old launchers; Google Play listing icon 512 × 512, square (Play rounds the corners).',
  ]);
  row = aiRow(c, 'Layers', 20);
  fig(row, aiTile(null, 'Background layer', 150, 150, [aiLin(AI_LOOKS.Default.plate, [0.3, 0], [0.7, 1])], 0), 'Background', '108 dp');
  fig(row, aiSafeZone(150), 'Foreground', '72 dp view, 66 dp circle');
  const mono = aiTile(null, 'Monochrome layer', 150, 150, [solid('#EDE4CF')], 0);
  mono.appendChild(aiScaled(aiGlyphOnly('Default', AI_V.fg, '#1B2A41', 'Monochrome'), 150));
  fig(row, mono, 'Monochrome', 'Android 13+');
  fig(row, aiUse('Default', 'Square', 150), 'Play Store 512');
  const masks = figma.createFrame(); masks.name = 'Launcher masks (mock-up)'; masks.resize(W - 56, 210); masks.cornerRadius = 12; masks.clipsContent = true;
  masks.fills = [aiLin([[0, '#DCE6F5'], [1, '#B9CBE6']], [0, 0], [1, 1])];
  const mrow = box({ name: 'Masks', dir: 'H', gap: 28, cross: 'center', parent: masks, x: 28, y: 26 });
  for (const m of ['Circle', 'Squircle', 'Rounded square', 'Teardrop']) aiFigure(mrow, aiAdaptive(m, 'Default', 112), m);
  aiFigure(mrow, aiAdaptive('Circle', 'Default', 112, ['#D9E2FF', '#1F3A73']), 'Themed', 'system colours');
  aiFigure(mrow, aiAdaptive('Circle', 'Default', 112, ['#22304A', '#C9D6FF']), 'Themed dark');
  c.appendChild(masks);

  // Windows
  c = aiCard(grid, 'Windows', { w: W, sub: 'Windows 10 and 11, .ico' });
  aiBullets(c, [
    'app_icon.ico with 16, 24, 32, 48, 64 and 256 px. Windows draws icons unmasked, so the rounded plate is part of the art and fills the canvas.',
    'The taskbar shows 24 px at 100 % scale and 32 px at 125–150 %; Start and Explorer use 32–256 px. 16–32 px use the small glyph.',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'Rounded', 128), '256 px', 'shown at 128');
  for (const z of [64, 48, 32, 24, 16]) fig(row, aiUse('Default', 'Rounded', z), z + ' px');
  c.appendChild(aiTaskbar(W - 56, true));
  c.appendChild(aiTaskbar(W - 56, false));

  // Linux
  c = aiCard(grid, 'Linux', { w: W, sub: 'freedesktop hicolor theme (GNOME, KDE)' });
  aiBullets(c, [
    'Install apps/robocore.png at 16–512 px plus scalable/apps/robocore.svg into the hicolor theme; the .desktop file says Icon=robocore. GNOME and KDE show icons unmasked.',
    'The Flutter runner sets the window icon from data/app_icon.png (256 px).',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  for (const z of [128, 64, 48, 32, 24, 16]) fig(row, aiUse('Default', 'Rounded', z), z + ' px');
  fig(row, aiUse('Dark', 'Rounded', 64), 'Dark', 'optional');
  c.appendChild(aiDash(W - 56));

  // Web
  c = aiCard(grid, 'Web app and PWA', { w: W, sub: 'Chrome, Edge, Safari; installable PWA' });
  aiBullets(c, [
    'favicon.svg scales to any size and can switch to the Dark look with a prefers-color-scheme block; favicon.png (32 px, small glyph) for older browsers.',
    'apple-touch-icon.png 180 × 180, opaque (iOS rounds it).',
    'Manifest: Icon-192/512 (purpose any, Rounded) and Icon-maskable-192/512 (full bleed; the glyph sits inside the 80 % safe circle).',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'Rounded', 32), 'favicon 32');
  fig(row, aiUse('Default', 'Rounded', 16), 'favicon 16');
  fig(row, aiUse('Default', 'Square', 120), 'apple-touch-icon', '180, shown at 120');
  fig(row, aiUse('Default', 'Rounded', 120), 'Icon-512', 'shown at 120');
  const mk = figma.createFrame(); mk.name = 'Maskable + safe circle'; mk.resize(120, 120); mk.fills = []; mk.clipsContent = true;
  mk.appendChild(aiUse('Default', 'Maskable', 120));
  const sz = figma.createEllipse(); sz.name = 'Safe circle 80 %'; mk.appendChild(sz); sz.resize(96, 96); sz.x = 12; sz.y = 12; sz.fills = []; sz.strokes = [solid('#2F6BBF', 0.95)]; sz.strokeWeight = 1.5; sz.dashPattern = [5, 4];
  fig(row, mk, 'Icon-maskable-512', '80 % safe circle');
  c.appendChild(aiTabs(W - 56, false));
  c.appendChild(aiTabs(W - 56, true));
}

// ---------- page ----------
// the builder owns this file: one page per round. It reuses an empty page (or its own page) and refuses files with other content.
async function aiPreparePage() {
  for (const p of figma.root.children) await p.loadAsync();
  const ours = Object.values(AI_VERSIONS).map(v => v.page).concat(AI_LEGACY_PAGES);
  const foreign = figma.root.children.filter(p => ours.indexOf(p.name) < 0 && p.children.length > 0);
  if (foreign.length) throw new Error('This file has other content (page "' + foreign[0].name + '"). Run the App Icon builder in its own design file.');
  const legacy = figma.root.children.find(p => AI_LEGACY_PAGES.indexOf(p.name) >= 0);
  if (legacy && !figma.root.children.find(p => p.name === AI_VERSIONS.icon.page)) legacy.name = AI_VERSIONS.icon.page;
  let page = figma.root.children.find(p => p.name === AI_PAGE_NAME) || figma.root.children.find(p => p.children.length === 0 && ours.indexOf(p.name) < 0);
  if (!page) page = figma.createPage();
  page.name = AI_PAGE_NAME;
  for (const p of figma.root.children.slice()) if (p !== page && p.children.length === 0 && ours.indexOf(p.name) < 0 && figma.root.children.length > 1) p.remove();
  // newest round first
  Object.values(AI_VERSIONS).map(v => v.page).reverse().forEach((name, idx) => { const p = figma.root.children.find(x => x.name === name); if (p) figma.root.insertChild(Math.min(idx, figma.root.children.length - 1), p); });
  for (const c of page.children.slice()) c.remove();
  page.backgrounds = [{ type: 'SOLID', color: hexToRgb('#E9E2D2') }];
  return page;
}

async function buildAppIconPage(cmd) {
  const T = Date.now();
  aiUseVersion(cmd);
  AI.comps = {}; AI.small = {}; AI.glyph = null; AI.glyphSmall = null;
  const page = await aiPreparePage();
  await figma.setCurrentPageAsync(page);
  await setupFonts();
  await setupTokens();
  REPORT.timings.setup = Date.now() - T;

  const comps = aiBuildComponents(page);
  await yieldUI();
  const root = box({ name: 'App icon — ' + AI_V.page, dir: 'V', gap: 40, pad: 64, w: 2400, fill: 'color/bg/app', radius: 24, parent: page });
  root.x = 0; root.y = 0;
  if (AI_V.key === 'orbit') { aiHeaderOrbit(root); aiConceptsOrbit(root); } else { aiHeader(root); aiConcepts(root); }
  await yieldUI();
  if (AI_V.key === 'orbit') aiMasterOrbit(root); else aiMaster(root);
  aiAppearances(root);
  aiSizes(root);
  await yieldUI();
  aiPlatforms(root);
  const list = aiExportList();
  aiExportTable(root, list);
  await applyLinks();
  REPORT.timings.docs = Date.now() - T;

  comps.x = 2600; comps.y = 0;
  const ex = aiBuildExports(page, list);
  await applyLinks();
  ex.x = 2600; ex.y = comps.y + comps.height + 200;
  REPORT.counts.exportFrames = list.length;
  REPORT.counts.variants = Object.keys(AI.comps).length + Object.keys(AI.small).length;
  REPORT.timings.total = Date.now() - T;

  const review = await openReview();
  REPORT.export = review ? 'on' : 'skipped (no local review server)';
  if (review) {
    const items = root.children.map(sec => [AI_V.key + '_doc_' + sec.name.replace(/[^\w]+/g, '_') + '.png', sec, 0.5]);
    items.push([AI_V.key + '_comp_default_macos.png', AI.comps['Default|macOS'], 0.5], [AI_V.key + '_comp_dark_macos.png', AI.comps['Dark|macOS'], 0.5], [AI_V.key + '_comp_clear_macos.png', AI.comps['Clear|macOS'], 0.5]);
    items.push([AI_V.key + '_components.png', comps, 0.12], [AI_V.key + '_exports.png', ex, 0.15]);
    for (const z of [16, 32]) {
      const f = ex.findOne(n => n.type === 'FRAME' && n.name === 'web/favicon' && Math.round(n.width) === z) || ex.findOne(n => n.type === 'FRAME' && n.name === 'web/favicon-16');
      if (f) items.push([AI_V.key + '_favicon_' + z + '.png', f, 1]);
    }
    await exportForReview(items);
  }
  await sendReport();
  figma.viewport.scrollAndZoomIntoView([root]);
}
