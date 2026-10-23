// Minimal Figma Plugin API mock for dry-running code.js under Node.
// It approximates layout (hug sizes from children / text length) and enforces
// the API rules that most often break plugins (sizing modes, fonts, instances,
// absolute positioning, expando properties, colour ranges).
'use strict';

let NEXT = 1;
const loadedFonts = new Set();
const allNodes = new Map();
const fk = (f) => f.family + '|' + f.style;
const CONTAINERS = new Set(['DOCUMENT', 'PAGE', 'FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'GROUP', 'SECTION', 'BOOLEAN_OPERATION']);
const KNOWN = new Set(('id name type parent children removed visible locked opacity fills strokes strokeWeight strokeAlign strokeTopWeight strokeBottomWeight strokeLeftWeight strokeRightWeight dashPattern effects effectStyleId ' +
  'strokeCap strokeJoin x y width height rotation cornerRadius topLeftRadius topRightRadius bottomLeftRadius bottomRightRadius clipsContent layoutMode layoutWrap itemSpacing counterAxisSpacing paddingTop paddingRight paddingBottom paddingLeft ' +
  'primaryAxisAlignItems counterAxisAlignItems primaryAxisSizingMode counterAxisSizingMode layoutSizingHorizontal layoutSizingVertical layoutGrow layoutAlign layoutPositioning constraints minWidth maxWidth minHeight maxHeight ' +
  'characters fontName fontSize lineHeight letterSpacing textCase textAlignHorizontal textAlignVertical textAutoResize textTruncation maxLines textStyleId ' +
  'description componentPropertyReferences mainComponent vectorPaths backgrounds flowStartingPoints reactions placeholder isAsset').split(/\s+/));

class Node {
  constructor(type) {
    this.id = (NEXT++) + ':1';
    this.type = type;
    this.name = type;
    this.parent = null;
    this.removed = false;
    this.visible = true;
    this.opacity = 1;
    this._fills = []; this.strokes = []; this.effects = [];
    this.x = 0; this.y = 0; this._w = 100; this._h = 100;
    this.layoutMode = 'NONE';
    this.layoutPositioning = 'AUTO';
    this._sizingH = 'FIXED'; this._sizingV = 'FIXED';
    this.itemSpacing = 0; this.paddingTop = this.paddingRight = this.paddingBottom = this.paddingLeft = 0;
    this.primaryAxisAlignItems = 'MIN'; this.counterAxisAlignItems = 'MIN';
    this.layoutGrow = 0; this.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    this.componentPropertyReferences = null;
    this.reactions = [];
    if (CONTAINERS.has(type)) this.children = [];
    allNodes.set(this.id, this);
    return new Proxy(this, {
      set(t, k, v) {
        if (typeof k === 'string' && !KNOWN.has(k) && !(k in t) && !k.startsWith('_')) throw new Error('object is not extensible: ' + k + ' on ' + t.type);
        if (typeof k === 'string' && k.startsWith('_') && !(k in t) && !['_w', '_h', '_sizingH', '_sizingV', '_fills', '_chars', '_props', '_main'].includes(k)) throw new Error('object is not extensible: ' + k);
        const pAL = t.parent && t.parent.layoutMode && t.parent.layoutMode !== 'NONE';
        if (k === 'layoutPositioning' && v === 'ABSOLUTE' && !pAL) throw new Error('layoutPositioning ABSOLUTE needs an auto-layout parent (' + t.name + ')');
        if (k === 'layoutGrow' && v && !pAL) throw new Error('layoutGrow on non auto-layout child (' + t.name + ')');
        if (k === 'primaryAxisAlignItems' && !['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'].includes(v)) throw new Error('bad primaryAxisAlignItems ' + v);
        if (k === 'counterAxisAlignItems' && !['MIN', 'CENTER', 'MAX', 'BASELINE'].includes(v)) throw new Error('bad counterAxisAlignItems ' + v);
        if (k === 'textAutoResize' && !['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'].includes(v)) throw new Error('bad textAutoResize ' + v);
        if (k === 'strokeAlign' && !['INSIDE', 'OUTSIDE', 'CENTER'].includes(v)) throw new Error('bad strokeAlign ' + v);
        if (k === 'layoutMode' && !['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID'].includes(v)) throw new Error('bad layoutMode ' + v);
        if (k === 'textTruncation' && t.type !== 'TEXT') throw new Error('textTruncation on non-text');
        if ((k === 'itemSpacing' || k.startsWith('padding')) && typeof v !== 'number') throw new Error(k + ' must be number');
        t[k] = v; return true;
      },
    });
  }
  get fills() { return this._fills; }
  set fills(v) {
    if (!Array.isArray(v)) throw new Error('fills must be an array');
    for (const p of v) if (p && p.color) { for (const c of ['r', 'g', 'b']) if (p.color[c] < 0 || p.color[c] > 1) throw new Error('colour out of range'); if ('a' in p.color) throw new Error('paint color must not include a'); }
    this._fills = v;
  }
  get width() { return this._measure().w; }
  get height() { return this._measure().h; }
  get absoluteTransform() { let x = 0, y = 0, n = this; while (n && n.type !== 'PAGE') { x += n.x || 0; y += n.y || 0; n = n.parent; } return [[1, 0, x], [0, 1, y]]; }
  get absoluteBoundingBox() { const t = this.absoluteTransform; return { x: t[0][2], y: t[1][2], width: this.width, height: this.height }; }
  _measure() {
    if (this.type === 'TEXT') {
      const size = this.fontSize || 12, lh = (this.lineHeight && this.lineHeight.value) || size * 1.3;
      const lines = String(this._chars || '').split('\n');
      const natW = Math.max(1, ...lines.map(l => l.length * size * 0.56));
      if (this.textAutoResize === 'WIDTH_AND_HEIGHT' || !this.textAutoResize) return { w: this._sizingH === 'FILL' ? this._w : natW, h: lines.length * lh };
      const w = this._w; const wrapped = lines.reduce((s, l) => s + Math.max(1, Math.ceil(l.length * size * 0.56 / Math.max(1, w))), 0);
      return { w, h: this.textAutoResize === 'HEIGHT' ? wrapped * lh : this._h };
    }
    if (this.layoutMode && this.layoutMode !== 'NONE' && (this._sizingH === 'HUG' || this._sizingV === 'HUG')) {
      const kids = (this.children || []).filter(c => c.visible !== false && c.layoutPositioning !== 'ABSOLUTE');
      const H = this.layoutMode === 'HORIZONTAL';
      let main = 0, cross = 0;
      kids.forEach((c, i) => { const m = c._measure(); main += (H ? m.w : m.h) + (i ? this.itemSpacing : 0); cross = Math.max(cross, H ? m.h : m.w); });
      const w = H ? main + this.paddingLeft + this.paddingRight : cross + this.paddingLeft + this.paddingRight;
      const h = H ? cross + this.paddingTop + this.paddingBottom : main + this.paddingTop + this.paddingBottom;
      return { w: this._sizingH === 'HUG' ? Math.max(1, w) : this._w, h: this._sizingV === 'HUG' ? Math.max(1, h) : this._h };
    }
    return { w: this._w, h: this._h };
  }
  get layoutSizingHorizontal() { return this._sizingH; }
  set layoutSizingHorizontal(v) { this._checkSizing(v, 'Horizontal'); this._sizingH = v; }
  get layoutSizingVertical() { return this._sizingV; }
  set layoutSizingVertical(v) { this._checkSizing(v, 'Vertical'); this._sizingV = v; }
  _checkSizing(v, axis) {
    if (!['FIXED', 'HUG', 'FILL'].includes(v)) throw new Error('Invalid layoutSizing' + axis + ' ' + v);
    const pAL = this.parent && this.parent.layoutMode && this.parent.layoutMode !== 'NONE';
    if (v === 'HUG' && !(this.layoutMode !== 'NONE' || (this.type === 'TEXT' && pAL) || this.type === 'INSTANCE')) throw new Error('in set_layoutSizing' + axis + ': HUG only on auto-layout frames or text children (' + this.name + ')');
    if (v === 'FILL' && (!pAL || this.layoutPositioning === 'ABSOLUTE')) throw new Error('in set_layoutSizing' + axis + ': FILL can only be set on children of auto-layout frames (' + this.name + ')');
  }
  set layoutPositioningChecked(v) { }
  resize(w, h) { if (!(w >= 0.01) || !(h >= 0.01)) throw new Error('resize: invalid size ' + w + 'x' + h + ' on ' + this.name); this._w = w; this._h = h; if (this.type !== 'TEXT') { this._sizingH = 'FIXED'; this._sizingV = 'FIXED'; } else if (this.textAutoResize !== 'HEIGHT') this.textAutoResize = 'NONE'; }
  resizeWithoutConstraints(w, h) { this._w = w; this._h = h; }
  rescale(s) { this._w *= s; this._h *= s; }
  appendChild(c) { this.insertChild(this.children.length, c); }
  insertChild(i, c) {
    if (!this.children) throw new Error('cannot append to ' + this.type);
    if (this.type === 'INSTANCE' || this._inInstance()) throw new Error('Cannot add children to an instance');
    if (c.parent) { const a = c.parent.children; const k = a.indexOf(c); if (k >= 0) { a.splice(k, 1); if (c.parent === this && k < i) i--; } }
    this.children.splice(i, 0, c); c.parent = this;
  }
  _inInstance() { let p = this.parent; while (p) { if (p.type === 'INSTANCE') return true; p = p.parent; } return false; }
  remove() { if (this.parent) { const a = this.parent.children; a.splice(a.indexOf(this), 1); } this.parent = null; this.removed = true; }
  findAll(fn) { const out = []; const walk = (n) => { for (const c of n.children || []) { if (!fn || fn(c)) out.push(c); walk(c); } }; walk(this); return out; }
  findOne(fn) { const walk = (n) => { for (const c of n.children || []) { if (fn(c)) return c; const r = walk(c); if (r) return r; } return null; }; return walk(this); }
  findChild(fn) { return (this.children || []).find(fn) || null; }
  findAllWithCriteria(c) { return this.findAll(n => !c.types || c.types.includes(n.type)); }
  clone() { const n = cloneNode(this); if (this.parent) { this.parent.insertChild(this.parent.children.indexOf(this) + 1, n); } return n; }
  setBoundVariable(field, v) { if (!v || !v.id) throw new Error('setBoundVariable: bad variable'); }
  async setReactionsAsync(r) { if (!Array.isArray(r)) throw new Error('reactions must be array'); for (const x of r) for (const a of x.actions) if (a.type === 'NODE' && !allNodes.has(a.destinationId)) throw new Error('bad destination'); this.reactions = r; }
  async setTextStyleIdAsync(id) { if (this.type !== 'TEXT') throw new Error('not text'); }
  async setEffectStyleIdAsync(id) { }
  setRangeFills(s, e, p) { if (this.type !== 'TEXT') throw new Error('setRangeFills on non-text'); if (s < 0 || e > String(this._chars).length || s >= e) throw new Error('setRangeFills range ' + s + '-' + e + ' of ' + String(this._chars).length + ' in "' + this.name + '"'); }
  setRangeFontName(s, e, f) { if (this.type !== 'TEXT') throw new Error('setRangeFontName on non-text'); if (!loadedFonts.has(fk(f))) throw new Error('unloaded font ' + fk(f)); if (s < 0 || e > String(this._chars).length || s >= e) throw new Error('setRangeFontName range'); }
  async exportAsync() { return new Uint8Array(8); }
  async loadAsync() { }
  // text
  get characters() { return this._chars; }
  set characters(v) {
    if (this.type !== 'TEXT') throw new Error('characters on non-text');
    if (!this.fontName || !loadedFonts.has(fk(this.fontName))) throw new Error('Cannot write to node with unloaded font "' + (this.fontName ? fk(this.fontName) : '?') + '"');
    if (this._inInstance() && this.componentPropertyReferences && this.componentPropertyReferences.characters) { /* allowed but mirrors property */ }
    this._chars = String(v);
  }
  // components
  createInstance() {
    if (this.type !== 'COMPONENT') throw new Error('createInstance on ' + this.type);
    const i = cloneNode(this, 'INSTANCE'); i._main = this; i.name = this.name;
    figma.currentPage.appendChild(i);
    return i;
  }
  addComponentProperty(name, type, def) {
    if (this.type !== 'COMPONENT' && this.type !== 'COMPONENT_SET') throw new Error('addComponentProperty on ' + this.type);
    if (this.type === 'COMPONENT' && this.parent && this.parent.type === 'COMPONENT_SET') throw new Error('addComponentProperty on variant');
    if (type === 'INSTANCE_SWAP' && !allNodes.has(def)) throw new Error('INSTANCE_SWAP default must be a component id');
    this._props = this._props || {};
    const key = name + '#' + NEXT++ + ':0';
    this._props[key] = { type, defaultValue: def };
    return key;
  }
  get componentPropertyDefinitions() { if (this.type === 'COMPONENT' && this.parent && this.parent.type === 'COMPONENT_SET') throw new Error('componentPropertyDefinitions on variant'); return this._props || {}; }
  get componentProperties() {
    if (this.type !== 'INSTANCE') throw new Error('componentProperties on non-instance');
    const mc = this._main; const owner = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc;
    const out = {};
    for (const [k, d] of Object.entries(owner._props || {})) out[k] = { type: d.type, value: d.defaultValue };
    if (owner.type === 'COMPONENT_SET') mc.name.split(',').forEach(s => { const [a, b] = s.split('=').map(x => x.trim()); out[a] = { type: 'VARIANT', value: b }; });
    return out;
  }
  setProperties(o) {
    if (this.type !== 'INSTANCE') throw new Error('setProperties on non-instance');
    const mc = this._main; const owner = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc;
    const variantProps = {};
    for (const [k, v] of Object.entries(o)) {
      if (owner._props && owner._props[k]) {
        const d = owner._props[k];
        if (d.type === 'TEXT' && typeof v !== 'string') throw new Error('TEXT prop needs string');
        if (d.type === 'BOOLEAN' && typeof v !== 'boolean') throw new Error('BOOLEAN prop needs boolean');
        if (d.type === 'INSTANCE_SWAP' && !allNodes.has(v)) throw new Error('INSTANCE_SWAP needs component id');
        continue;
      }
      if (owner.type === 'COMPONENT_SET') { variantProps[k] = v; continue; }
      throw new Error('setProperties: unknown property ' + k + ' on ' + this.name);
    }
    if (Object.keys(variantProps).length) {
      const cur = {}; mc.name.split(',').forEach(s => { const [a, b] = s.split('=').map(x => x.trim()); cur[a] = b; });
      Object.assign(cur, variantProps);
      const match = owner.children.find(ch => { const p = {}; ch.name.split(',').forEach(s => { const [a, b] = s.split('=').map(x => x.trim()); p[a] = b; }); return Object.entries(cur).every(([a, b]) => p[a] === b); });
      if (!match) throw new Error('setProperties: no variant ' + JSON.stringify(cur) + ' in ' + owner.name);
      this._main = match;
    }
  }
  swapComponent(c) { if (this.type !== 'INSTANCE') throw new Error('swap on non-instance'); if (!c || c.type !== 'COMPONENT') throw new Error('swap needs component'); this._main = c; }
  getSharedPluginData() { return ''; }
  setExplicitVariableModeForCollection(c, m) { if (!c || !m) throw new Error('bad mode args'); }
  getStyledTextSegments(f) { return [{ start: 0, end: String(this._chars || '').length, fills: this._fills }]; }
  get mainComponent() { throw new Error('in get_mainComponent: Cannot call with documentAccess: dynamic-page. Use node.getMainComponentAsync instead.'); }
  async getMainComponentAsync() { return this._main; }
}
function cloneNode(src, asType) {
  const n = new Node(asType || src.type);
  for (const k of Object.keys(src)) {
    if (['id', 'parent', 'children', 'type'].includes(k)) continue;
    let v = src[k];
    if (Array.isArray(v)) v = v.slice(); else if (v && typeof v === 'object' && k !== '_main' && k !== 'fontName') v = Object.assign({}, v);
    try { n[k] = v; } catch (e) { /* ignore */ }
  }
  if (src.children) for (const c of src.children) { const cc = cloneNode(c, c.type === 'COMPONENT' && asType === 'INSTANCE' ? 'INSTANCE' : undefined); n.children.push(cc); cc.parent = n; }
  return n;
}

const pages = [];
const root = new Node('DOCUMENT'); root.name = 'Untitled';
const page1 = new Node('PAGE'); page1.name = 'Page 1'; root.children.push(page1); page1.parent = root;
const variables = []; const collections = [];
const textStyles = [], effectStyles = [];
const figma = {
  root, currentPage: page1, mixed: Symbol('mixed'),
  async setCurrentPageAsync(p) { this.currentPage = p; },
  createPage() { const p = new Node('PAGE'); root.appendChild(p); return p; },
  createFrame() { const n = new Node('FRAME'); n.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; this.currentPage.appendChild(n); return n; },
  createComponent() { const n = new Node('COMPONENT'); this.currentPage.appendChild(n); return n; },
  createRectangle() { const n = new Node('RECTANGLE'); this.currentPage.appendChild(n); return n; },
  createEllipse() { const n = new Node('ELLIPSE'); this.currentPage.appendChild(n); return n; },
  createVector() { const n = new Node('VECTOR'); this.currentPage.appendChild(n); return n; },
  createText() { const n = new Node('TEXT'); n.fontName = { family: 'Inter', style: 'Regular' }; n._chars = ''; n.fontSize = 12; this.currentPage.appendChild(n); return n; },
  createSection() { const n = new Node('SECTION'); this.currentPage.appendChild(n); return n; },
  createNodeFromSvg(svg) {
    if (!/viewBox/.test(svg)) throw new Error('svg without viewBox');
    const n = new Node('FRAME'); const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/); if (m) { n._w = +m[1]; n._h = +m[2]; }
    const count = (svg.match(/<(path|rect|circle|line|polyline|polygon)/g) || []).length;
    for (let i = 0; i < count; i++) { const v = new Node('VECTOR'); v.strokes = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }]; n.children.push(v); v.parent = n; }
    this.currentPage.appendChild(n); return n;
  },
  createComponentFromNode(node) {
    const c = new Node('COMPONENT'); c.name = node.name; c._w = node._w; c._h = node._h;
    for (const k of ['layoutMode', 'itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', '_sizingH', '_sizingV', 'primaryAxisAlignItems', 'counterAxisAlignItems', 'clipsContent']) if (node[k] !== undefined) c[k] = node[k];
    c.fills = node.fills;
    const p = node.parent; const idx = p ? p.children.indexOf(node) : -1;
    for (const ch of node.children.slice()) { c.children.push(ch); ch.parent = c; }
    node.children.length = 0;
    if (p) { p.children.splice(idx, 1, c); c.parent = p; }
    node.removed = true; node.parent = null;
    return c;
  },
  combineAsVariants(comps, parent) {
    if (!comps.length) throw new Error('combineAsVariants: empty');
    for (const c of comps) if (c.type !== 'COMPONENT') throw new Error('combineAsVariants requires ComponentNodes');
    const s = new Node('COMPONENT_SET');
    for (const c of comps) { if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1); s.children.push(c); c.parent = s; }
    parent.appendChild(s);
    return s;
  },
  async loadFontAsync(f) { loadedFonts.add(fk(f)); },
  async listAvailableFontsAsync() {
    const out = [];
    for (const fam of ['Inter', 'JetBrains Mono', 'Barlow']) for (const st of ['Regular', 'Medium', 'Semi Bold', 'SemiBold', 'Bold', 'Italic']) out.push({ fontName: { family: fam, style: st } });
    return out;
  },
  async getLocalTextStylesAsync() { return textStyles; },
  async getLocalEffectStylesAsync() { return effectStyles; },
  createTextStyle() { const s = { id: 'S:' + NEXT++, name: '' }; textStyles.push(s); return s; },
  createEffectStyle() { const s = { id: 'E:' + NEXT++, name: '' }; effectStyles.push(s); return s; },
  async getNodeByIdAsync(id) { return allNodes.get(id) || null; },
  variables: {
    async getLocalVariableCollectionsAsync() { return collections; },
    async getLocalVariablesAsync() { return variables; },
    createVariableCollection(name) { const c = { id: 'VC:' + NEXT++, name, modes: [{ modeId: 'm' + NEXT++, name: 'Mode 1' }], variableIds: [], renameMode(id, n) { this.modes.find(m => m.modeId === id).name = n; }, addMode() { if (process.env.MOCK_MODES) { const id = 'm' + NEXT++; this.modes.push({ modeId: id, name: 'Navy' }); return id; } throw new Error('in addMode: Limited to 1 modes only'); } }; collections.push(c); return c; },
    createVariable(name, coll, type) {
      if (typeof coll !== 'object') throw new Error('pass collection object');
      if (/\s/.test(name)) throw new Error('variable name with spaces');
      const v = { id: 'V:' + NEXT++, name, variableCollectionId: coll.id, resolvedType: type, scopes: ['ALL_SCOPES'], setValueForMode(m, val) { if (type === 'COLOR' && val && !val.type && (val.r > 1 || val.g > 1 || val.b > 1)) throw new Error('colour out of range'); }, setVariableCodeSyntax(p, s) { if (p === 'WEB' && !/^var\(--[^\s]+\)$/.test(s)) throw new Error('bad WEB syntax ' + s); } };
      variables.push(v); return v;
    },
    setBoundVariableForPaint(p, f, v) { if (!v || !v.id) throw new Error('bad variable'); if (p.type !== 'SOLID') throw new Error('non-solid'); return Object.assign({}, p, { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } }); },
  },
  viewport: { scrollAndZoomIntoView() { } },
  base64Decode(str) { return new Uint8Array(Buffer.from(str, 'base64')); },
  createImage(bytes) { if (!(bytes instanceof Uint8Array) || bytes.length < 8) throw new Error('createImage needs PNG bytes'); return { hash: 'img' + (NEXT++) }; },
  ui: { _h: [], on(t, h) { this._h.push(h); }, off(t, h) { this._h = this._h.filter(x => x !== h); }, postMessage(m) { const reply = m.type === 'ping' ? { type: 'pong', ok: false } : { type: 'ack' }; setTimeout(() => this._h.slice().forEach(h => h(reply)), 0); } },
  showUI() { },
  closePlugin(msg) { figma._closed = msg; },
  notify() { throw new Error('not implemented'); },
};
module.exports = { figma, allNodes };
