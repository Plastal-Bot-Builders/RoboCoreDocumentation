// ============================================================================
// RoboCore event branding — base helpers.
// Units: 1 px in this file = 1 pt (1/72 in), so a frame exported as PDF comes out
// at its true print size. mm(x) converts millimetres to points.
// Colours are the RoboCore V2 box: navy ink, RoboCore yellow, cream paper.
// ============================================================================

const MM = 72 / 25.4;
const mm = (v) => v * MM;
const REPORT = { errors: [], warnings: [], counts: {}, timings: {} };
function warn(m) { REPORT.warnings.push(m); }

// [name, hex, CMYK (starting values, proof before printing), closest Pantone, use]
const PALETTE = [
  ['navy', '#1B2A41', '90 75 45 45', '533 C', 'Ink: text, logos, outlines, dark backgrounds'],
  ['yellow', '#F2B01E', '0 32 95 0', '7409 C', 'RoboCore yellow: the brand field, highlights'],
  ['cream', '#F7F1E3', '2 4 11 0', '—', 'Paper: light backgrounds, text on navy'],
  ['ochre', '#8A5A00', '25 55 100 35', '1405 C', 'Contour lines and small accents on yellow'],
  ['contour', '#D9971A', '10 42 100 2', '7409 C (tint)', 'Box topography lines on yellow'],
  ['white', '#FFFFFF', '0 0 0 0', '—', 'QR tiles and photo highlights only'],
];
const BLOCK_INKS = [
  ['events', '#F2B01E'], ['movement', '#2F6BBF'], ['motors', '#B84A26'], ['light', '#7A4FB5'], ['sensors', '#0F7680'],
  ['control', '#8A5A00'], ['operators', '#2F7A4C'], ['variables', '#B23E7A'], ['myblocks', '#5B6577'], ['pins', '#1B2A41'],
];
const HEX = {}; for (const [n, h] of PALETTE) HEX[n] = h; for (const [n, h] of BLOCK_INKS) HEX['block/' + n] = h;
HEX['navy/soft'] = '#364357'; HEX['navy/deep'] = '#111C2D'; HEX['yellow/deep'] = '#D99A0F'; HEX['paper'] = '#FFFCF5';
const VARS = {};

function hexToRgb(h) { const s = h.replace('#', ''); return { r: parseInt(s.slice(0, 2), 16) / 255, g: parseInt(s.slice(2, 4), 16) / 255, b: parseInt(s.slice(4, 6), 16) / 255 }; }
// paint('navy') binds the Brand variable; a tint (opacity < 1) stays a raw colour (bound paints ignore opacity)
function paint(c, opacity) {
  const hex = HEX[c] || c;
  const p = { type: 'SOLID', color: hexToRgb(hex), opacity: opacity === undefined ? 1 : opacity };
  const v = VARS[c];
  if (v && (opacity === undefined || opacity >= 1)) { try { return figma.variables.setBoundVariableForPaint(p, 'color', v); } catch (e) { /* raw */ } }
  return p;
}
async function setupVariables() {
  const C = figma.variables;
  let col = (await C.getLocalVariableCollectionsAsync()).find(c => c.name === 'Brand');
  if (!col) col = C.createVariableCollection('Brand');
  try { col.renameMode(col.modes[0].modeId, 'Print'); } catch (e) { /* ok */ }
  const existing = await C.getLocalVariablesAsync('COLOR');
  const all = PALETTE.map(([n, h]) => ['brand/' + n, n, h]).concat(BLOCK_INKS.map(([n, h]) => ['block/' + n, 'block/' + n, h]));
  for (const [vname, key, hex] of all) {
    let v = existing.find(x => x.name === vname && x.variableCollectionId === col.id);
    if (!v) v = C.createVariable(vname, col, 'COLOR');
    v.setValueForMode(col.modes[0].modeId, Object.assign(hexToRgb(hex), { a: 1 }));
    VARS[key] = v;
  }
  REPORT.counts.variables = all.length;
}

// ---- fonts: Barlow Condensed (box headlines) + Barlow (text), Inter as a fallback
const FONT = {};
async function setupFonts() {
  const fonts = await figma.listAvailableFontsAsync();
  const fam = {};
  for (const f of fonts) (fam[f.fontName.family] = fam[f.fontName.family] || new Set()).add(f.fontName.style);
  const pick = (family, style) => {
    const s = fam[family];
    if (s && s.has(style)) return { family, style };
    if (s && s.has('Bold') && /Bold|Black/.test(style)) return { family, style: 'Bold' };
    if (s && s.has('Regular')) return { family, style: 'Regular' };
    return { family: 'Inter', style: /Bold|Black|Semi/.test(style) ? 'Bold' : 'Regular' };
  };
  const want = {
    display: ['Barlow Condensed', 'Bold'], displayX: ['Barlow Condensed', 'ExtraBold'], head: ['Barlow Condensed', 'SemiBold'],
    body: ['Barlow', 'Regular'], bodyM: ['Barlow', 'Medium'], bodyS: ['Barlow', 'SemiBold'], bodyB: ['Barlow', 'Bold'],
    mono: ['JetBrains Mono', 'Regular'], monoB: ['JetBrains Mono', 'Bold'],
  };
  for (const [k, [f, s]] of Object.entries(want)) FONT[k] = pick(f, s);
  if (FONT.mono.family === 'Inter') FONT.mono = pick('Roboto Mono', 'Regular');
  const seen = new Set();
  for (const f of Object.values(FONT).concat([{ family: 'Inter', style: 'Regular' }, { family: 'Inter', style: 'Bold' }])) {
    const key = f.family + '|' + f.style; if (seen.has(key)) continue; seen.add(key);
    try { await figma.loadFontAsync(f); } catch (e) { warn('font ' + key + ': ' + e.message); }
  }
  REPORT.fonts = FONT;
}

// ---- nodes
function place(n, o) { if (o.parent) o.parent.appendChild(n); if (o.x !== undefined) n.x = o.x; if (o.y !== undefined) n.y = o.y; if (o.name) n.name = o.name; if (o.opacity !== undefined) n.opacity = o.opacity; return n; }
function frame(o = {}) {
  const f = figma.createFrame();
  f.resize(Math.max(0.01, o.w || 1), Math.max(0.01, o.h || 1));
  f.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.radius) f.cornerRadius = o.radius;
  if (o.stroke) { f.strokes = [paint(o.stroke, o.strokeOpacity)]; f.strokeWeight = o.strokeW || 1; f.strokeAlign = 'INSIDE'; }
  f.clipsContent = !!o.clip;
  return place(f, o);
}
function rect(o = {}) {
  const r = figma.createRectangle();
  r.resize(Math.max(0.01, o.w), Math.max(0.01, o.h));
  r.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.radius) r.cornerRadius = o.radius;
  if (o.stroke) { r.strokes = [paint(o.stroke, o.strokeOpacity)]; r.strokeWeight = o.strokeW || 1; r.strokeAlign = o.strokeAlign || 'INSIDE'; if (o.dash) r.dashPattern = o.dash; }
  return place(r, o);
}
function ellipse(o = {}) {
  const e = figma.createEllipse();
  e.resize(o.w, o.h || o.w);
  e.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.stroke) { e.strokes = [paint(o.stroke, o.strokeOpacity)]; e.strokeWeight = o.strokeW || 1; }
  return place(e, o);
}
// text: kind (display | head | body | bodyM | bodyS | bodyB | mono), size in pt, lh = line-height multiplier,
// ls = letter spacing %, w = fixed width (wraps), align LEFT | CENTER | RIGHT, upper
function text(chars, o = {}) {
  const t = figma.createText();
  t.fontName = FONT[o.kind || 'body'] || FONT.body;
  t.fontSize = o.size || 12;
  t.characters = String(chars);
  if (o.lh) t.lineHeight = { unit: 'PERCENT', value: o.lh * 100 };
  if (o.ls) t.letterSpacing = { unit: 'PERCENT', value: o.ls };
  if (o.upper) t.textCase = 'UPPER';
  t.fills = [paint(o.color || 'navy', o.colorOpacity)];
  t.textAlignHorizontal = o.align || 'LEFT';
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, Math.max(1, t.height)); } else t.textAutoResize = 'WIDTH_AND_HEIGHT';
  if (o.name === undefined) o.name = String(chars).slice(0, 40);
  place(t, o);
  if (o.bold) for (const [a, b] of o.bold) t.setRangeFontName(a, b, FONT.bodyB);
  return t;
}
// vertical stack (auto layout) for flowing text blocks
function stack(o = {}) {
  const f = frame(Object.assign({}, o, { w: o.w || 10, h: 10 }));
  f.layoutMode = o.dir === 'H' ? 'HORIZONTAL' : 'VERTICAL';
  f.itemSpacing = o.gap || 0;
  const p = o.pad || 0; const [pt, pr, pb, pl] = Array.isArray(p) ? p : [p, p, p, p];
  f.paddingTop = pt; f.paddingRight = pr; f.paddingBottom = pb; f.paddingLeft = pl;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = o.w && o.dir !== 'H' ? 'FIXED' : 'AUTO';
  if (o.w && o.dir !== 'H') f.resize(o.w, f.height);
  if (o.cross) f.counterAxisAlignItems = { start: 'MIN', center: 'CENTER', end: 'MAX' }[o.cross];
  return f;
}
// a text that fills its stack's width
function stxt(parent, chars, o = {}) { const t = text(chars, Object.assign({}, o, { parent, w: o.w || 10 })); t.layoutSizingHorizontal = 'FILL'; return t; }

// SVG → vector group, scaled to a width (or height)
function svgNode(svg, o = {}) {
  const n = figma.createNodeFromSvg(svg);
  n.fills = [];
  if (o.w) n.rescale(o.w / n.width); else if (o.h) n.rescale(o.h / n.height);
  return place(n, o);
}
function inkAll(node, color, opacity) {
  for (const v of node.findAll(x => x.type === 'VECTOR' || x.type === 'BOOLEAN_OPERATION')) {
    if (v.fills && v.fills.length) v.fills = [paint(color, opacity)];
    if (v.strokes && v.strokes.length) v.strokes = [paint(color, opacity)];
  }
  return node;
}

// ---- raster images: the plugin UI fetches them from test/server.py (assets folder) and hands over the bytes
const IMG = {};
let UI_OK = false;
function waitForUI(type, ms, match) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { figma.ui.off('message', h); resolve(null); }, ms);
    const h = (msg) => { if (msg && msg.type === type && (!match || match(msg))) { clearTimeout(t); figma.ui.off('message', h); resolve(msg); } };
    figma.ui.on('message', h);
  });
}
async function openBridge() {
  try { figma.showUI(__html__, { visible: false, width: 240, height: 80 }); } catch (e) { return false; }
  for (let i = 0; i < 4 && !UI_OK; i++) {
    figma.ui.postMessage({ type: 'ping' });
    const r = await waitForUI('pong', 1500);
    UI_OK = !!(r && r.ok);
  }
  return UI_OK;
}
async function loadImage(name) {
  if (IMG[name] !== undefined) return IMG[name];
  IMG[name] = null;
  if (!UI_OK) { warn('image ' + name + ': no asset server, placeholder used'); return null; }
  figma.ui.postMessage({ type: 'asset', name });
  const r = await waitForUI('asset', 20000, (m) => m.name === name);
  if (!r || !r.ok || !r.bytes) { warn('image ' + name + ': ' + (r && r.error || 'timeout')); return null; }
  try { const img = figma.createImage(new Uint8Array(r.bytes)); IMG[name] = { hash: img.hash }; }
  catch (e) { warn('image ' + name + ': ' + e.message); }
  return IMG[name];
}
// image placed at a width or height (aspect from the known pixel size)
// IMG_SIZE (pixel sizes) is generated into 00_assets_gen.js
function imageRect(name, o) {
  const [pw, ph] = IMG_SIZE[name] || [1, 1];
  const w = o.w || (o.h * pw / ph), h = o.h || (o.w * ph / pw);
  const r = figma.createRectangle(); r.resize(w, h);
  const im = IMG[name];
  if (im) r.fills = [{ type: 'IMAGE', imageHash: im.hash, scaleMode: 'FILL' }];
  else { r.fills = [paint('navy/soft', 0.25)]; r.strokes = [paint('navy', 0.4)]; r.dashPattern = [6, 6]; }
  return place(r, Object.assign({ name: 'Image · ' + name }, o));
}

// ---- topographic lines of the real Copperbelt (Chingola to Ndola), scaled to cover w × h; every fifth line a little bolder
function contourLines(parent, w, h, color, opacity, weight) {
  const s = Math.max(w, h), wt = weight || Math.max(0.75, s / 900);
  const g = frame({ name: 'Contours · Copperbelt', w, h, clip: true, parent });
  for (const [set, k, name] of [[CONTOURS, 1, 'Contour lines'], [CONTOURS_INDEX, 1.8, 'Index contours']]) {
    if (!set.length) continue;
    const svg = '<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      set.map(d => '<path d="' + d + '" stroke="#D9971A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>').join('') + '</svg>';
    const art = figma.createNodeFromSvg(svg); art.name = name; art.fills = [];
    art.rescale(s * 1.04 / 1080);
    for (const v of art.findAll(n => n.type === 'VECTOR')) { v.strokes = [paint(color, opacity)]; v.strokeWeight = wt * k; }
    g.appendChild(art); art.x = (w - art.width) / 2; art.y = (h - art.height) / 2;
  }
  return g;
}
