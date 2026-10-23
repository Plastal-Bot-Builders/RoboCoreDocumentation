// ============================================================================
// RoboCore Architecture Builder — core helpers (shared with the RoboCore IDE
// design builder: same tokens, type, icons and box artwork).
// Standard Figma Plugin API only, documentAccess: dynamic-page.
// ============================================================================

const PAGE_NAMES = {
  cover: '00 — Read me',
  context: '01 — Context & use cases',
  containers: '02 — Containers & deployment',
  ide: '03 — IDE app',
  flows: '04 — Key flows',
  states: '05 — State machines',
  hardware: '06 — Firmware & hardware',
  delivery: '07 — Build, release & kits',
  cog: '08 — Cog & roadmap',
  decisions: '09 — Decisions & glossary',
  assets: '10 — Assets',
};

const REPORT = { errors: [], warnings: [], counts: {}, timings: {} };
const V = {};      // variables by name
const TS = {};     // text style specs by name: { font, size, lh, ls, tc, id }
const ES = {};     // effect styles by name
const ICON = {};   // icon components by name
const CMP = {};    // components / component sets by key
const LINKS = [];  // deferred style links: [node, kind, name]
const VAR_HEX = {}; // variable name -> resolved hex (raw fallback colour for bound paints)
const POST = [];    // edits that must run after text styles are linked (bold ranges)
let FONT_MONO = 'JetBrains Mono';
let FONT_BRAND = 'Barlow';

function warn(msg) { REPORT.warnings.push(msg); }

// ---------- colour ----------
function hexToRgba(h) {
  h = h.replace('#', '');
  const n = parseInt(h.slice(0, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
}
function hexToRgb(h) { const c = hexToRgba(h); return { r: c.r, g: c.g, b: c.b }; }
function solid(hex, opacity) { return { type: 'SOLID', color: hexToRgb(hex), opacity: opacity === undefined ? 1 : opacity }; }
// paint bound to a colour variable; falls back to a raw hex if the name starts with '#'
function paint(name, opacity) {
  if (!name) return null;
  if (name[0] === '#') return solid(name, opacity);
  const v = V[name];
  if (!v) throw new Error('Unknown colour variable ' + name);
  // a tint of a token: Figma resets a bound paint's opacity to the variable's alpha, so tints stay raw
  if (opacity !== undefined && opacity < 1 && VAR_HEX[name]) { const c = hexToRgba(VAR_HEX[name]); return { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: opacity * c.a }; }
  // the raw colour is the resolved value, so the paint is correct even where a binding is dropped
  const rgba = VAR_HEX[name] ? hexToRgba(VAR_HEX[name]) : { r: 0, g: 0, b: 0, a: 1 };
  const p = { type: 'SOLID', color: { r: rgba.r, g: rgba.g, b: rgba.b }, opacity: opacity === undefined ? rgba.a : opacity };
  const b = figma.variables.setBoundVariableForPaint(p, 'color', v);
  // binding resets paint opacity to the variable's alpha, so re-apply the requested opacity
  return opacity === undefined ? b : Object.assign({}, b, { opacity });
}
function boundId(p) { return p && p.boundVariables && p.boundVariables.color && p.boundVariables.color.id; }
// re-colour a fill only when it actually changes (overriding an instance paint with its own variable renders black)
function refill(node, name, opacity) {
  const cur = node.fills && node.fills[0];
  if (V[name] && boundId(cur) === V[name].id && (opacity === undefined || Math.abs((cur.opacity === undefined ? 1 : cur.opacity) - opacity) < 0.001)) return;
  node.fills = [paint(name, opacity)];
}

// ---------- spacing / radius tokens ----------
const SPACE_TOKENS = { 0: 'spacing/0', 2: 'spacing/050', 4: 'spacing/100', 6: 'spacing/150', 8: 'spacing/200', 12: 'spacing/300', 16: 'spacing/400', 20: 'spacing/500', 24: 'spacing/600', 32: 'spacing/800', 40: 'spacing/1000', 48: 'spacing/1200' };
const RADIUS_TOKENS = { 4: 'radius/xs', 6: 'radius/sm', 8: 'radius/md', 12: 'radius/lg', 16: 'radius/xl', 999: 'radius/full' };
function bindNum(node, field, value, table) {
  const key = table[value];
  if (key && V[key]) { try { node.setBoundVariable(field, V[key]); } catch (e) { /* keep raw value */ } }
}

// ---------- frames ----------
const ALIGN = { start: 'MIN', center: 'CENTER', end: 'MAX', between: 'SPACE_BETWEEN' };
const CROSS = { start: 'MIN', center: 'CENTER', end: 'MAX', baseline: 'BASELINE' };
function isAL(n) { return n && 'layoutMode' in n && n.layoutMode !== 'NONE'; }

// box(o): o = { name, dir:'H'|'V', gap, pad:[t,r,b,l]|n, px, py, w, h, wSize:'fixed'|'hug'|'fill', hSize,
//   align, cross, fill, fillOpacity, stroke, strokeW, sides:{t,r,b,l}, radius, clip, effect, parent, abs, x, y, grow, wrap }
function box(o = {}) {
  const f = figma.createFrame();
  f.name = o.name || 'Frame';
  f.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  f.clipsContent = !!o.clip;
  if (o.dir) {
    f.layoutMode = o.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
    if (o.wrap) f.layoutWrap = 'WRAP';
    f.itemSpacing = o.gap || 0;
    if (o.wrap && o.rowGap !== undefined) f.counterAxisSpacing = o.rowGap;
    let p = o.pad === undefined ? 0 : o.pad;
    if (typeof p === 'number') p = [p, p, p, p];
    if (o.px !== undefined) { p[1] = o.px; p[3] = o.px; }
    if (o.py !== undefined) { p[0] = o.py; p[2] = o.py; }
    f.paddingTop = p[0]; f.paddingRight = p[1]; f.paddingBottom = p[2]; f.paddingLeft = p[3];
    f.primaryAxisAlignItems = ALIGN[o.align || 'start'];
    f.counterAxisAlignItems = CROSS[o.cross || 'start'];
    bindNum(f, 'itemSpacing', f.itemSpacing, SPACE_TOKENS);
    bindNum(f, 'paddingTop', p[0], SPACE_TOKENS); bindNum(f, 'paddingRight', p[1], SPACE_TOKENS);
    bindNum(f, 'paddingBottom', p[2], SPACE_TOKENS); bindNum(f, 'paddingLeft', p[3], SPACE_TOKENS);
  }
  if (o.w !== undefined || o.h !== undefined) f.resize(Math.max(0.01, o.w === undefined ? 100 : o.w), Math.max(0.01, o.h === undefined ? 100 : o.h));
  if (o.stroke) {
    f.strokes = [paint(o.stroke, o.strokeOpacity)];
    f.strokeAlign = o.strokeAlign || 'INSIDE';
    if (o.sides) {
      f.strokeTopWeight = o.sides.t || 0; f.strokeRightWeight = o.sides.r || 0;
      f.strokeBottomWeight = o.sides.b || 0; f.strokeLeftWeight = o.sides.l || 0;
    } else f.strokeWeight = o.strokeW || 1;
    if (o.dash) f.dashPattern = o.dash;
  }
  if (o.radius !== undefined) setRadius(f, o.radius);
  if (o.effect) LINKS.push([f, 'effect', o.effect]);
  if (o.opacity !== undefined) f.opacity = o.opacity;
  if (o.parent) o.parent.appendChild(f);
  if (o.abs && o.parent && isAL(o.parent)) f.layoutPositioning = 'ABSOLUTE';
  if (o.x !== undefined) f.x = o.x;
  if (o.y !== undefined) f.y = o.y;
  const inAL = o.parent && isAL(o.parent) && !o.abs;
  const sizeOf = (s, given) => s || (given !== undefined ? 'fixed' : (o.dir ? 'hug' : 'fixed'));
  const ws = sizeOf(o.wSize, o.w), hs = sizeOf(o.hSize, o.h);
  const ok = (s) => s === 'fixed' || (s === 'hug' && o.dir) || (s === 'fill' && inAL);
  if (ok(ws)) f.layoutSizingHorizontal = ws.toUpperCase(); else if (ws !== 'fixed') warn('box ' + f.name + ': cannot ' + ws + ' width');
  if (ok(hs)) f.layoutSizingVertical = hs.toUpperCase(); else if (hs !== 'fixed') warn('box ' + f.name + ': cannot ' + hs + ' height');
  if (o.grow && inAL) f.layoutGrow = 1;
  return f;
}
function setRadius(n, r) {
  if (Array.isArray(r)) {
    n.topLeftRadius = r[0]; n.topRightRadius = r[1]; n.bottomRightRadius = r[2]; n.bottomLeftRadius = r[3];
    bindNum(n, 'topLeftRadius', r[0], RADIUS_TOKENS); bindNum(n, 'topRightRadius', r[1], RADIUS_TOKENS);
    bindNum(n, 'bottomRightRadius', r[2], RADIUS_TOKENS); bindNum(n, 'bottomLeftRadius', r[3], RADIUS_TOKENS);
  } else {
    n.cornerRadius = r;
    for (const k of ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius']) bindNum(n, k, r, RADIUS_TOKENS);
  }
}
// fixed-size spacer / flexible spacer
function spacer(parent, size, grow) {
  const s = figma.createFrame();
  s.name = grow ? 'Spacer (flex)' : 'Spacer';
  s.fills = [];
  s.resize(Math.max(0.01, size || 1), Math.max(0.01, size || 1));
  parent.appendChild(s);
  if (grow) { s.layoutGrow = 1; }
  return s;
}
function rect(o = {}) {
  const r = figma.createRectangle();
  r.name = o.name || 'Rectangle';
  r.resize(Math.max(0.01, o.w || 10), Math.max(0.01, o.h || 10));
  r.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.stroke) { r.strokes = [paint(o.stroke)]; r.strokeWeight = o.strokeW || 1; r.strokeAlign = 'INSIDE'; }
  if (o.radius !== undefined) setRadius(r, o.radius);
  if (o.parent) o.parent.appendChild(r);
  if (o.abs && o.parent && isAL(o.parent)) r.layoutPositioning = 'ABSOLUTE';
  if (o.x !== undefined) r.x = o.x;
  if (o.y !== undefined) r.y = o.y;
  if (o.wSize === 'fill' && o.parent && isAL(o.parent)) r.layoutSizingHorizontal = 'FILL';
  if (o.hSize === 'fill' && o.parent && isAL(o.parent)) r.layoutSizingVertical = 'FILL';
  if (o.opacity !== undefined) r.opacity = o.opacity;
  return r;
}
function dot(parent, color, size = 8, name = 'Status dot') {
  const e = figma.createEllipse();
  e.name = name;
  e.resize(size, size);
  e.fills = [paint(color)];
  parent.appendChild(e);
  return e;
}
function divider(parent, dir = 'V', len, color = 'color/border/subtle', name = 'Divider') {
  const r = figma.createRectangle();
  r.name = name;
  if (dir === 'V') r.resize(1, len || 20); else r.resize(len || 20, 1);
  r.fills = [paint(color)];
  parent.appendChild(r);
  if (!len && isAL(parent)) { if (dir === 'V') r.layoutSizingVertical = 'FILL'; else r.layoutSizingHorizontal = 'FILL'; }
  return r;
}

// ---------- text ----------
// txt(chars, o): o = { style, color, parent, name, w, fill:true, align:'LEFT'|'CENTER'|'RIGHT', truncate, maxLines, abs, x, y }
function txt(chars, o = {}) {
  const st = TS[o.style || 'Body/Default'];
  if (!st) throw new Error('Unknown text style ' + o.style);
  const t = figma.createText();
  t.fontName = st.font;
  t.fontSize = st.size;
  t.lineHeight = { unit: 'PIXELS', value: st.lh };
  t.letterSpacing = { unit: 'PERCENT', value: st.ls };
  if (st.tc) t.textCase = st.tc;
  t.characters = String(chars);
  t.name = o.name || String(chars).slice(0, 48);
  t.fills = [paint(o.color || 'color/text/primary')];
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.parent) o.parent.appendChild(t);
  if (o.abs && o.parent && isAL(o.parent)) t.layoutPositioning = 'ABSOLUTE';
  if (o.x !== undefined) t.x = o.x;
  if (o.y !== undefined) t.y = o.y;
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, Math.max(1, t.height)); }
  if (o.fill && o.parent && isAL(o.parent)) { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; }
  if (o.grow && o.parent && isAL(o.parent)) { t.textAutoResize = 'HEIGHT'; t.layoutGrow = 1; }
  if (o.truncate) { t.textTruncation = 'ENDING'; t.maxLines = o.maxLines || 1; }
  if (o.opacity !== undefined) t.opacity = o.opacity;
  if (!o.noStyle) LINKS.push([t, 'text', o.style || 'Body/Default']);
  if (!/^Code\//.test(o.style || '')) {
    const s = String(chars), spans = [];
    for (let i = 0; i < s.length; i++) {
      if ('→←↵≤≥⇄'.indexOf(s[i]) >= 0) spans.push([i, i + 1]);
      else if (s[i] === '-' && s[i + 1] === '-') { spans.push([i, i + 2]); i++; }
    }
    if (spans.length) POST.push(() => { const f = TS['Code/Small'].font; for (const [a, b] of spans) { try { t.setRangeFontName(a, b, f); } catch (e) { /* removed */ } } });
  }
  return t;
}

// ---------- icons ----------
function iconInst(name, parent, color, size) {
  const c = ICON[name];
  if (!c) { warn('missing icon ' + name); return null; }
  const i = c.createInstance();
  if (parent) parent.appendChild(i);
  if (size && size !== 20) i.resize(size, size);
  if (color) tint(i, color);
  return i;
}
function tint(node, color) {
  const vecs = node.findAll ? node.findAll(n => n.type === 'VECTOR' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE' || n.type === 'POLYGON' || n.type === 'LINE' || n.type === 'BOOLEAN_OPERATION') : [];
  const id = V[color] && V[color].id;
  for (const v of vecs) {
    if (v.strokes && v.strokes.length && !(id && boundId(v.strokes[0]) === id)) v.strokes = [paint(color)];
  }
}

// ---------- components ----------
function setText(node, name, value) {
  const t = node.type === 'TEXT' && node.name === name ? node : node.findOne(n => n.type === 'TEXT' && n.name === name);
  if (!t) { warn('setText: no text "' + name + '" in ' + node.name); return null; }
  const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters;
  if (ref) {
    // text bound to a component property: set the property on the nearest instance
    let p = t.parent;
    while (p && p.type !== 'INSTANCE') p = p.parent;
    if (p && p.componentProperties && p.componentProperties[ref]) { const o = {}; o[ref] = String(value); p.setProperties(o); return t; }
  }
  t.characters = String(value);
  return t;
}
function setProp(inst, propName, value) {
  const props = inst.componentProperties;
  const key = Object.keys(props).find(k => k.split('#')[0] === propName);
  if (!key) { if (typeof value === 'string') { setText(inst, propName, value); return; } warn('setProp: no property ' + propName + ' on ' + inst.name); return; }
  const o = {}; o[key] = value;
  inst.setProperties(o);
}
function variantOf(set, props) {
  const want = Object.entries(props);
  const c = set.children.find(ch => {
    const parts = {};
    ch.name.split(',').forEach(s => { const [k, v] = s.split('=').map(x => x.trim()); parts[k] = v; });
    return want.every(([k, v]) => parts[k] === v);
  });
  if (!c) throw new Error('No variant ' + JSON.stringify(props) + ' in ' + set.name);
  return c;
}
function inst(key, props, parent, opts = {}) {
  const src = CMP[key];
  if (!src) throw new Error('Unknown component ' + key);
  const comp = src.type === 'COMPONENT_SET' ? variantOf(src, props || {}) : src;
  const i = comp.createInstance();
  if (parent) parent.appendChild(i);
  if (opts.name) i.name = opts.name;
  if (opts.abs && parent && isAL(parent)) i.layoutPositioning = 'ABSOLUTE';
  if (opts.x !== undefined) i.x = opts.x;
  if (opts.y !== undefined) i.y = opts.y;
  if (opts.wSize === 'fill' && parent && isAL(parent)) i.layoutSizingHorizontal = 'FILL';
  if (opts.hSize === 'fill' && parent && isAL(parent)) i.layoutSizingVertical = 'FILL';
  if (opts.grow && parent && isAL(parent)) i.layoutGrow = 1;
  if (opts.text) for (const [k, v] of Object.entries(opts.text)) setText(i, k, v);
  if (opts.props) for (const [k, v] of Object.entries(opts.props)) setProp(i, k, v);
  return i;
}
// lays out variants of a component set in a grid and sizes the set
function gridVariants(set, cols, gapX = 24, gapY = 24, pad = 24) {
  const kids = set.children.slice();
  let x = pad, y = pad, rowH = 0, maxW = 0;
  kids.forEach((k, i) => {
    if (i > 0 && i % cols === 0) { x = pad; y += rowH + gapY; rowH = 0; }
    k.x = x; k.y = y;
    x += k.width + gapX;
    rowH = Math.max(rowH, k.height);
    maxW = Math.max(maxW, x);
  });
  set.resize(Math.max(1, maxW - gapX + pad), Math.max(1, y + rowH + pad));
  set.fills = [paint('color/bg/app')];
  set.strokes = [paint('color/border/default')];
  set.dashPattern = [6, 4];
  set.strokeWeight = 1;
  set.cornerRadius = 12;
}
// combine components into a set inside parent
function makeSet(comps, name, parent, cols, desc) {
  const set = figma.combineAsVariants(comps, parent);
  set.name = name;
  if (desc) set.description = desc;
  gridVariants(set, cols);
  return set;
}
function comp(name, desc) {
  const c = figma.createComponent();
  c.name = name;
  c.fills = [];
  if (desc) c.description = desc;
  return c;
}
// turn a component into an auto-layout container quickly
function al(node, o = {}) {
  node.layoutMode = o.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
  node.itemSpacing = o.gap || 0;
  let p = o.pad === undefined ? 0 : o.pad;
  if (typeof p === 'number') p = [p, p, p, p];
  if (o.px !== undefined) { p[1] = o.px; p[3] = o.px; }
  if (o.py !== undefined) { p[0] = o.py; p[2] = o.py; }
  node.paddingTop = p[0]; node.paddingRight = p[1]; node.paddingBottom = p[2]; node.paddingLeft = p[3];
  node.primaryAxisAlignItems = ALIGN[o.align || 'start'];
  node.counterAxisAlignItems = CROSS[o.cross || 'center'];
  bindNum(node, 'itemSpacing', node.itemSpacing, SPACE_TOKENS);
  bindNum(node, 'paddingTop', p[0], SPACE_TOKENS); bindNum(node, 'paddingRight', p[1], SPACE_TOKENS);
  bindNum(node, 'paddingBottom', p[2], SPACE_TOKENS); bindNum(node, 'paddingLeft', p[3], SPACE_TOKENS);
  if (o.w !== undefined || o.h !== undefined) node.resize(o.w || node.width, o.h || node.height);
  node.layoutSizingHorizontal = o.w !== undefined ? 'FIXED' : 'HUG';
  node.layoutSizingVertical = o.h !== undefined ? 'FIXED' : 'HUG';
  if (o.fill) node.fills = [paint(o.fill, o.fillOpacity)];
  if (o.stroke) { node.strokes = [paint(o.stroke)]; node.strokeWeight = o.strokeW || 1; node.strokeAlign = 'INSIDE'; }
  if (o.radius !== undefined) setRadius(node, o.radius);
  if (o.effect) LINKS.push([node, 'effect', o.effect]);
  return node;
}

// ---------- page documentation helpers ----------
function section(page, name, x, y, w, h) {
  const s = figma.createSection();
  s.name = name;
  page.appendChild(s);
  s.x = x; s.y = y;
  s.resizeWithoutConstraints(w, h);
  s.fills = [paint('color/bg/chrome')];
  return s;
}
// documentation header block: overline + title + description
function docHeader(parent, overline, title, desc, w = 900) {
  const h = box({ name: 'Doc header', dir: 'V', gap: 8, parent });
  if (overline) txt(overline, { style: 'Caption/Overline', color: 'color/text/brand', parent: h });
  txt(title, { style: 'Heading/H1', parent: h });
  if (desc) txt(desc, { style: 'Body/Default', color: 'color/text/secondary', parent: h, w });
  return h;
}
function placeRight(page, gap = 200) {
  let maxX = 0;
  for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);
  return maxX + gap;
}

// ---------- box artwork ----------
const IMG = {};
function artHash(key) {
  if (!IMG[key]) IMG[key] = figma.createImage(figma.base64Decode(ART[key].png)).hash;
  return IMG[key];
}
// navy line drawing from the box (robot / board) as an image-filled rectangle, width w
function artRect(parent, key, w, name) {
  const a = ART[key];
  const r = figma.createRectangle();
  r.name = name || ('Line art / ' + key);
  r.resize(w, Math.round(w * a.h / a.w));
  r.fills = [{ type: 'IMAGE', imageHash: artHash(key), scaleMode: 'FIT' }];
  if (parent) parent.appendChild(r);
  return r;
}
// the box's topography contours (Fred's contour SVG), scaled to cover w x h and clipped
function contours(parent, w, h, color, opacity) {
  const svg = '<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    ART.contours.map(d => '<path d="' + d + '" stroke="#D9971A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>').join('') + '</svg>';
  const art = figma.createNodeFromSvg(svg);
  art.name = 'Contour lines';
  art.rescale(Math.max(w, h) / 1080);
  for (const v of art.findAll(n => n.type === 'VECTOR')) { v.strokes = [paint(color || 'color/decor/contour')]; v.strokeWeight = 1.25; }
  const g = figma.createFrame();
  g.name = 'Contours';
  g.fills = []; g.clipsContent = true;
  g.resize(w, h);
  g.appendChild(art);
  art.x = Math.round((w - art.width) / 2); art.y = Math.round((h - art.height) / 2);
  g.locked = true;
  if (opacity !== undefined) g.opacity = opacity;
  if (parent) { parent.appendChild(g); if (isAL(parent)) g.layoutPositioning = 'ABSOLUTE'; g.x = 0; g.y = 0; g.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }; }
  return g;
}
