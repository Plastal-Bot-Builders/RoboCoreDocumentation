// Vector paths from ~/Downloads/RoboCore_Logo.svg (RoboCore wordmark + gear)
const LOGO = {"letters": "M364.5 506L260 381.5H361.5L444.5 479.5V506H364.5ZM85 506V146.5H370.5C384.167 146.5 396.5 149.833 407.5 156.5C418.833 163.167 427.833 172.167 434.5 183.5C441.5 194.833 445 207.167 445 220.5V313.5C445 326.833 441.5 339.167 434.5 350.5C427.833 361.833 418.833 370.833 407.5 377.5C396.5 384.167 384.167 387.5 370.5 387.5L162.5 388V506H85ZM162.5 309.5H366.5V224H162.5V309.5ZM557.598 506C544.598 506 532.598 502.667 521.598 496C510.598 489.333 501.764 480.5 495.098 469.5C488.431 458.5 485.098 446.5 485.098 433.5V288.5C485.098 275.5 488.431 263.5 495.098 252.5C501.764 241.5 510.598 232.667 521.598 226C532.598 219.333 544.598 216 557.598 216H706.598C719.931 216 732.098 219.333 743.098 226C754.098 232.667 762.764 241.5 769.098 252.5C775.764 263.5 779.098 275.5 779.098 288.5V433.5C779.098 446.5 775.764 458.5 769.098 469.5C762.764 480.5 754.098 489.333 743.098 496C732.098 502.667 719.931 506 706.598 506H557.598ZM561.598 429.5H702.598V292.5H561.598V429.5ZM817.906 506V121H894.406V216H1039.41C1052.74 216 1064.91 219.333 1075.91 226C1086.91 232.667 1095.57 241.5 1101.91 252.5C1108.57 263.5 1111.91 275.5 1111.91 288.5V433.5C1111.91 446.5 1108.57 458.5 1101.91 469.5C1095.57 480.5 1086.91 489.333 1075.91 496C1064.91 502.667 1052.74 506 1039.41 506H817.906ZM894.406 429.5H1035.41V292.5H894.406V429.5ZM1669.8 506C1656.13 506 1643.63 502.667 1632.3 496C1621.3 489.333 1612.47 480.5 1605.8 469.5C1599.13 458.167 1595.8 445.667 1595.8 432V220C1595.8 206.333 1599.13 194 1605.8 183C1612.47 171.667 1621.3 162.667 1632.3 156C1643.63 149.333 1656.13 146 1669.8 146H1954.8V224H1689.8C1684.47 224 1680.3 225.333 1677.3 228C1674.63 230.667 1673.3 234.833 1673.3 240.5V411.5C1673.3 416.833 1674.63 421 1677.3 424C1680.3 426.667 1684.47 428 1689.8 428H1954.8V506H1669.8ZM2066.93 506C2053.93 506 2041.93 502.667 2030.93 496C2019.93 489.333 2011.1 480.5 2004.43 469.5C1997.77 458.5 1994.43 446.5 1994.43 433.5V288.5C1994.43 275.5 1997.77 263.5 2004.43 252.5C2011.1 241.5 2019.93 232.667 2030.93 226C2041.93 219.333 2053.93 216 2066.93 216H2215.93C2229.27 216 2241.43 219.333 2252.43 226C2263.43 232.667 2272.1 241.5 2278.43 252.5C2285.1 263.5 2288.43 275.5 2288.43 288.5V433.5C2288.43 446.5 2285.1 458.5 2278.43 469.5C2272.1 480.5 2263.43 489.333 2252.43 496C2241.43 502.667 2229.27 506 2215.93 506H2066.93ZM2070.93 429.5H2211.93V292.5H2070.93V429.5ZM2317.94 506V288.5C2317.94 275.5 2321.27 263.5 2327.94 252.5C2334.61 241.5 2343.44 232.667 2354.44 226C2365.44 219.333 2377.61 216 2390.94 216H2550.94V292.5H2394.44V506H2317.94ZM2648.01 506C2635.01 506 2623.01 502.667 2612.01 496C2601.01 489.333 2592.17 480.5 2585.51 469.5C2578.84 458.5 2575.51 446.5 2575.51 433.5V288.5C2575.51 275.5 2578.84 263.5 2585.51 252.5C2592.17 241.5 2601.01 232.667 2612.01 226C2623.01 219.333 2635.01 216 2648.01 216H2797.01C2810.34 216 2822.51 219.333 2833.51 226C2844.51 232.667 2853.17 241.5 2859.51 252.5C2866.17 263.5 2869.51 275.5 2869.51 288.5V399.5H2652.01V429.5H2869.51V506H2648.01ZM2652.01 332.5H2793.01V292.5H2652.01V332.5Z", "gearOuter": "M1521.24 350.971C1521.24 347.99 1521.16 345.046 1521.02 342.139L1570.09 324.923C1569.61 306.29 1566.37 287.843 1560.44 270.179L1503.31 273.31C1497.34 261.111 1489.97 249.644 1481.36 239.137L1511.44 188.456C1499.1 174.492 1484.74 162.447 1468.84 152.718L1425.13 193.636C1411.03 186.368 1396.01 181.04 1380.49 177.798L1370.87 119.291C1352.43 116.533 1333.72 116.533 1315.27 119.291L1308.23 177.798C1292.95 180.966 1278.45 186.145 1264.89 192.965L1219.95 154.395C1204.06 164.133 1189.7 176.177 1177.35 190.133L1208.47 237.833C1200.83 247.015 1194.12 256.94 1188.46 267.459L1128.35 266.714C1122.42 284.378 1119.18 302.861 1118.66 321.494L1168.15 336.512C1167.77 341.282 1167.51 346.127 1167.51 351.009C1167.51 361.667 1168.52 372.101 1170.31 382.274L1125.18 419.205C1132 436.533 1141.39 452.781 1152.98 467.352L1196.92 448.607C1208.65 466.295 1223.47 481.731 1240.67 494.183L1229.3 554.442C1245.7 563.348 1263.29 569.758 1281.55 573.447L1306.7 523.772C1318.85 526.418 1331.44 527.834 1344.38 527.834C1356.45 527.834 1368.23 526.604 1379.63 524.331L1407.24 573.484C1425.5 569.758 1443.13 563.348 1459.49 554.479L1445.81 495.86C1464 483.115 1479.65 467.054 1491.91 448.533L1535.77 465.079C1547.36 450.508 1556.75 434.26 1563.57 416.931L1518.29 382.982C1520.2 372.585 1521.24 361.89 1521.24 350.971ZM1344.38 463.215C1283.48 463.215 1234.14 413.876 1234.14 352.984C1234.14 292.092 1283.48 242.752 1344.38 242.752C1405.27 242.752 1454.61 292.092 1454.61 352.984C1454.61 413.876 1405.27 463.215 1344.38 463.215Z", "gearInner": "M1344.38 242.715C1283.48 242.715 1234.14 292.055 1234.14 352.947C1234.14 413.839 1283.48 463.178 1344.38 463.178C1405.27 463.178 1454.61 413.839 1454.61 352.947C1454.61 292.055 1405.27 242.715 1344.38 242.715ZM1343.93 401.429C1317.14 401.429 1295.33 379.666 1295.33 352.835C1295.33 350.934 1295.48 349.071 1295.67 347.245C1297.57 322.24 1318.4 302.526 1343.89 302.526C1369.38 302.526 1390.21 322.24 1392.11 347.245C1392.34 349.071 1392.45 350.934 1392.45 352.835C1392.52 379.666 1370.76 401.429 1343.93 401.429Z", "gearShine": "M1209.92 319.072C1209.1 319.072 1208.24 318.96 1207.39 318.774C1206.06 318.443 1204.82 317.855 1203.73 317.042C1202.63 316.229 1201.71 315.209 1201.01 314.039C1200.31 312.868 1199.85 311.572 1199.65 310.223C1199.45 308.874 1199.52 307.5 1199.86 306.178C1201.61 299.135 1204 292.204 1206.9 285.57C1207.45 284.321 1208.24 283.191 1209.22 282.247C1210.2 281.302 1211.36 280.561 1212.63 280.066C1213.91 279.571 1215.26 279.332 1216.62 279.362C1217.99 279.392 1219.33 279.691 1220.58 280.241C1225.83 282.552 1228.22 288.663 1225.91 293.918C1223.45 299.508 1221.47 305.358 1219.98 311.246C1219.41 313.481 1218.11 315.461 1216.29 316.877C1214.47 318.294 1212.23 319.066 1209.92 319.072ZM1234.55 276.217C1232.67 276.211 1230.82 275.694 1229.21 274.72C1227.6 273.747 1226.28 272.354 1225.39 270.69C1224.51 269.026 1224.09 267.153 1224.19 265.272C1224.29 263.39 1224.9 261.57 1225.95 260.006C1240.22 238.829 1260.34 222.257 1283.86 212.306C1289.15 210.07 1295.22 212.53 1297.46 217.821C1297.99 219.076 1298.27 220.424 1298.28 221.788C1298.3 223.151 1298.04 224.504 1297.52 225.768C1297.01 227.031 1296.26 228.181 1295.3 229.152C1294.34 230.123 1293.2 230.894 1291.94 231.423C1272.12 239.812 1255.16 253.781 1243.13 271.633C1241.15 274.614 1237.87 276.217 1234.55 276.217Z"};
// ============================================================================
// RoboCore IDE Design Builder — core helpers
// Builds the RoboCore IDE design file (tokens, components, screens, prototype).
// Standard Figma Plugin API only, documentAccess: dynamic-page.
// ============================================================================

const PAGE_NAMES = {
  foundations: '01 — Foundations',
  components: '02 — Components',
  ide: '03 — Main IDE',
  screens: '04 — Additional Screens',
  prototype: '05 — Prototype',
};

const REPORT = { errors: [], warnings: [], counts: {}, timings: {} };
const V = {};      // variables by name
const TS = {};     // text style specs by name: { font, size, lh, ls, tc, id }
const ES = {};     // effect styles by name
const ICON = {};   // icon components by name
const CMP = {};    // components / component sets by key
const LINKS = [];  // deferred style links: [node, kind, name]
const VAR_HEX = {}; // variable name -> resolved hex (raw fallback colour for bound paints)
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
  if (overline) txt(overline, { style: 'Caption/Overline', color: 'color/brand/default', parent: h });
  txt(title, { style: 'Heading/H1', parent: h });
  if (desc) txt(desc, { style: 'Body/Default', color: 'color/text/secondary', parent: h, w });
  return h;
}
function placeRight(page, gap = 200) {
  let maxX = 0;
  for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);
  return maxX + gap;
}
// ============================================================================
// Tokens: variables (Primitives / Color / Dimensions), text styles, effect styles
// Starter plans allow one mode per collection, so the Color collection ships a
// single "Dark" mode; a Light mode can be added later on a paid plan.
// ============================================================================

const PRIMITIVES = {
  'navy/1000': '#050D18', 'navy/950': '#07111F', 'navy/925': '#08131F', 'navy/900': '#0A0E27', 'navy/875': '#0A1624',
  'navy/850': '#0D1B2A', 'navy/800': '#12233A', 'navy/775': '#15283F', 'navy/750': '#1A2B42', 'navy/700': '#243954', 'navy/650': '#34507A',
  'slate/500': '#4A5870', 'slate/450': '#6D7F9C', 'slate/400': '#7C8AA0', 'slate/300': '#A7B1C2', 'slate/200': '#D4DAE3', 'slate/50': '#F5F5F5',
  'white': '#FFFFFF', 'scrim': '#02060DB8',
  'teal/300': '#5CF0C8', 'teal/400': '#2EE6B8', 'teal/500': '#00D9A3', 'teal/600': '#00B88A', 'teal/900': '#0B3A35', 'teal/950': '#0A2A2C',
  'yellow/400': '#F7C54A', 'yellow/500': '#F3B51B', 'yellow/600': '#D99E0B', 'yellow/900': '#3D3014', 'yellow/950': '#2A2414',
  'red/500': '#FF5D6C', 'red/950': '#3A1A24', 'orange/500': '#FF9F43', 'orange/950': '#3A2716', 'blue/500': '#5AA9FF', 'blue/950': '#13294A',
  'violet/300': '#C792EA', 'sky/400': '#5EC4FF', 'peach/400': '#FF9F6B', 'green/300': '#9BE38A', 'pink/400': '#FF7AB6',
  'block/output': '#3B78E7', 'block/input': '#8256E8', 'block/control': '#D9730D', 'block/math': '#2A9349', 'block/variables': '#C2409F',
  'block/robotics': '#E0503A', 'block/sensors': '#0E8FA3', 'block/communication': '#5F8A12', 'block/more': '#5B6B82',
};
// 16% alpha versions of the block colours for tinted surfaces (variable alpha drives paint opacity)
for (const c of ['output', 'input', 'control', 'math', 'variables', 'robotics', 'sensors', 'communication']) PRIMITIVES['block/' + c + '-a16'] = PRIMITIVES['block/' + c] + '29';
const BG = ['FRAME_FILL', 'SHAPE_FILL'], BR = ['STROKE_COLOR'], TX = ['TEXT_FILL'], ALLC = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'], IC = ['SHAPE_FILL', 'STROKE_COLOR'];
const SEMANTIC = [
  ['color/bg/app', 'navy/950', BG, 'App background behind panels'],
  ['color/bg/chrome', 'navy/900', BG, 'Top bar, sidebar, status bar'],
  ['color/bg/panel', 'navy/850', BG, 'Panels and cards'],
  ['color/bg/raised', 'navy/800', BG, 'Raised surfaces, menus, flyout'],
  ['color/bg/hover', 'navy/775', BG, 'Hover state on rows and items'],
  ['color/bg/input', 'navy/875', BG, 'Inputs, selects, segmented controls'],
  ['color/bg/editor', 'navy/925', BG, 'Code editor surface'],
  ['color/bg/canvas', 'navy/925', BG, 'Blocks workspace surface'],
  ['color/bg/console', 'navy/1000', BG, 'Serial monitor / console output'],
  ['color/bg/selected', 'teal/950', BG, 'Selected / active item background'],
  ['color/bg/overlay', 'scrim', BG, 'Modal scrim (72% opacity)'],
  ['color/border/subtle', 'navy/750', BR, 'Dividers, panel edges'],
  ['color/border/default', 'navy/700', BR, 'Inputs, cards'],
  ['color/border/strong', 'navy/650', BR, 'Hovered inputs, emphasis'],
  ['color/border/focus', 'teal/500', BR, 'Keyboard focus ring'],
  ['color/text/primary', 'slate/50', TX, 'Primary text — 15.9:1 on panel'],
  ['color/text/secondary', 'slate/300', TX, 'Secondary text — 8.0:1 on panel'],
  ['color/text/tertiary', 'slate/400', TX, 'Tertiary/meta text — 5.0:1 on panel'],
  ['color/text/disabled', 'slate/500', TX, 'Disabled text (non-essential only)'],
  ['color/text/on-accent', 'navy/1000', TX, 'Text on teal/yellow fills — 10.3:1'],
  ['color/text/link', 'teal/400', TX, 'Links'],
  ['color/icon/default', 'slate/300', IC, 'Default icon stroke'],
  ['color/icon/muted', 'slate/400', IC, 'Muted icon stroke'],
  ['color/icon/active', 'teal/500', IC, 'Active icon stroke'],
  ['color/icon/brand', 'yellow/500', IC, 'Brand icon stroke'],
  ['color/icon/strong', 'slate/50', IC, 'Hovered / emphasised icon stroke'],
  ['color/icon/on-accent', 'navy/1000', IC, 'Icon on teal/yellow fills'],
  ['color/icon/disabled', 'slate/500', IC, 'Disabled icon stroke'],
  ['color/bg/inverse', 'slate/50', BG, 'Tooltips'],
  ['color/text/inverse', 'navy/1000', TX, 'Text on inverse surfaces'],
  ['color/control/track-off', 'navy/650', BG, 'Toggle track when off'],
  ['color/control/knob', 'slate/50', BG, 'Toggle knob'],
  ['color/accent/default', 'teal/500', ALLC, 'Primary actions, active states, success'],
  ['color/accent/hover', 'teal/400', ALLC, 'Primary hover'],
  ['color/accent/pressed', 'teal/600', ALLC, 'Primary pressed'],
  ['color/accent/subtle', 'teal/950', ALLC, 'Tinted active backgrounds'],
  ['color/accent/muted', 'teal/900', ALLC, 'Tinted borders on active items'],
  ['color/brand/default', 'yellow/500', ALLC, 'RoboCore brand yellow — identity & highlights'],
  ['color/brand/hover', 'yellow/400', ALLC, 'Brand hover'],
  ['color/brand/pressed', 'yellow/600', ALLC, 'Brand pressed'],
  ['color/brand/subtle', 'yellow/950', ALLC, 'Tinted brand background'],
  ['color/status/success', 'teal/500', ALLC, 'Connected, compiled, uploaded'],
  ['color/status/success-subtle', 'teal/950', ALLC, ''],
  ['color/status/warning', 'orange/500', ALLC, 'Warnings'],
  ['color/status/warning-subtle', 'orange/950', ALLC, ''],
  ['color/status/error', 'red/500', ALLC, 'Errors, failed uploads'],
  ['color/status/error-subtle', 'red/950', ALLC, ''],
  ['color/status/info', 'blue/500', ALLC, 'Information'],
  ['color/status/info-subtle', 'blue/950', ALLC, ''],
  ['color/block/output', 'block/output', ALLC, 'Output blocks — LEDs, pins, tones'],
  ['color/block/input', 'block/input', ALLC, 'Input blocks — digital/analog reads'],
  ['color/block/control', 'block/control', ALLC, 'Control blocks — start, loops, waits, if'],
  ['color/block/math', 'block/math', ALLC, 'Math & logic blocks'],
  ['color/block/variables', 'block/variables', ALLC, 'Variable blocks'],
  ['color/block/robotics', 'block/robotics', ALLC, 'Robotics blocks — motors, servos, drive'],
  ['color/block/sensors', 'block/sensors', ALLC, 'Sensor blocks — ultrasonic, line, IMU, temp'],
  ['color/block/communication', 'block/communication', ALLC, 'Communication — serial print/read'],
  ['color/block/more', 'block/more', ALLC, 'Functions / more'],
  ['color/block/text', 'white', TX, 'Block label text'],
  ...['output', 'input', 'control', 'math', 'variables', 'robotics', 'sensors', 'communication'].map(c => ['color/block/' + c + '-subtle', 'block/' + c + '-a16', BG, 'Tinted ' + c + ' surface (16%)']),
  ['color/syntax/keyword', 'violet/300', TX, 'if, for, while, return, const'],
  ['color/syntax/type', 'sky/400', TX, 'void, int, bool, Serial'],
  ['color/syntax/function', 'yellow/500', TX, 'pinMode, digitalWrite, delay'],
  ['color/syntax/constant', 'peach/400', TX, 'HIGH, LOW, OUTPUT, LED_BUILTIN'],
  ['color/syntax/number', 'peach/400', TX, 'Numeric literals'],
  ['color/syntax/string', 'green/300', TX, 'String literals'],
  ['color/syntax/comment', 'slate/450', TX, 'Comments — 4.6:1 on editor'],
  ['color/syntax/preprocessor', 'pink/400', TX, '#include, #define'],
  ['color/syntax/plain', 'slate/200', TX, 'Identifiers, punctuation'],
  ['color/syntax/line-number', 'slate/500', TX, 'Gutter line numbers'],
  ['color/syntax/line-number-active', 'slate/300', TX, 'Current line number'],
];
const DIMENSIONS = [
  ['spacing/0', 0, ['GAP']], ['spacing/050', 2, ['GAP']], ['spacing/100', 4, ['GAP']], ['spacing/150', 6, ['GAP']], ['spacing/200', 8, ['GAP']],
  ['spacing/300', 12, ['GAP']], ['spacing/400', 16, ['GAP']], ['spacing/500', 20, ['GAP']], ['spacing/600', 24, ['GAP']], ['spacing/800', 32, ['GAP']],
  ['spacing/1000', 40, ['GAP']], ['spacing/1200', 48, ['GAP']],
  ['radius/xs', 4, ['CORNER_RADIUS']], ['radius/sm', 6, ['CORNER_RADIUS']], ['radius/md', 8, ['CORNER_RADIUS']], ['radius/lg', 12, ['CORNER_RADIUS']],
  ['radius/xl', 16, ['CORNER_RADIUS']], ['radius/full', 999, ['CORNER_RADIUS']],
  ['size/top-bar', 56, ['WIDTH_HEIGHT']], ['size/status-bar', 28, ['WIDTH_HEIGHT']], ['size/sidebar', 216, ['WIDTH_HEIGHT']], ['size/sidebar-collapsed', 64, ['WIDTH_HEIGHT']],
  ['size/control-sm', 28, ['WIDTH_HEIGHT']], ['size/control-md', 32, ['WIDTH_HEIGHT']], ['size/control-lg', 40, ['WIDTH_HEIGHT']],
];
// [name, family-key, style, size, lineHeight, letterSpacing%, textCase, usage]
const TEXT_STYLES = [
  ['Brand/Wordmark', 'brand', 'Bold', 18, 24, 2, null, 'Product name next to the logo'],
  ['Heading/Display', 'ui', 'Semi Bold', 30, 38, -1, null, 'Home greeting'],
  ['Heading/H1', 'ui', 'Semi Bold', 22, 30, -0.5, null, 'Screen titles, doc titles'],
  ['Heading/H2', 'ui', 'Semi Bold', 17, 24, 0, null, 'Section titles, dialog titles'],
  ['Heading/H3', 'ui', 'Semi Bold', 15, 22, 0, null, 'Card titles'],
  ['Body/Default', 'ui', 'Regular', 14, 20, 0, null, 'Body copy'],
  ['Body/Medium', 'ui', 'Medium', 14, 20, 0, null, 'Emphasised body, nav labels'],
  ['Body/Small', 'ui', 'Regular', 13, 18, 0, null, 'Descriptions, secondary copy'],
  ['Label/Default', 'ui', 'Medium', 13, 16, 0, null, 'Buttons, tabs, controls'],
  ['Label/Strong', 'ui', 'Semi Bold', 13, 16, 0, null, 'Primary buttons, emphasised labels'],
  ['Label/Small', 'ui', 'Medium', 12, 16, 0, null, 'Badges, meta labels'],
  ['Caption/Default', 'ui', 'Regular', 12, 16, 0, null, 'Captions, timestamps'],
  ['Caption/Overline', 'ui', 'Semi Bold', 11, 16, 6, 'UPPER', 'Section labels'],
  ['Code/Default', 'mono', 'Regular', 13, 20, 0, null, 'Code editor, compiler output'],
  ['Code/Small', 'mono', 'Regular', 12, 18, 0, null, 'Serial monitor, inline code'],
  ['Block/Label', 'ui', 'Semi Bold', 13, 16, 0, null, 'Text on programming blocks'],
  ['Block/Field', 'ui', 'Semi Bold', 12, 16, 0, null, 'Values inside block fields'],
];

async function setupFonts() {
  const fonts = await figma.listAvailableFontsAsync();
  const fam = {};
  for (const f of fonts) { (fam[f.fontName.family] = fam[f.fontName.family] || new Set()).add(f.fontName.style); }
  FONT_MONO = ['JetBrains Mono', 'Roboto Mono', 'IBM Plex Mono', 'Source Code Pro', 'Fira Code'].find(f => fam[f]) || 'Inter';
  FONT_BRAND = ['Barlow', 'Inter'].find(f => fam[f]) || 'Inter';
  const pick = (family, style) => {
    const s = fam[family];
    if (s) {
      if (s.has(style)) return { family, style };
      const alt = [...s].find(x => x.replace(/\s/g, '').toLowerCase() === style.replace(/\s/g, '').toLowerCase());
      if (alt) return { family, style: alt };
      if (s.has('Regular')) return { family, style: 'Regular' };
    }
    return { family: 'Inter', style: 'Regular' };
  };
  const famKey = { ui: 'Inter', mono: FONT_MONO, brand: FONT_BRAND };
  const toLoad = {};
  for (const [name, fk, style, size, lh, ls, tc] of TEXT_STYLES) {
    const font = pick(famKey[fk], style);
    TS[name] = { font, size, lh, ls, tc };
    toLoad[font.family + '|' + font.style] = font;
  }
  // extra weights used directly
  for (const f of [pick('Inter', 'Bold'), pick('Inter', 'Regular'), pick('Inter', 'Medium'), pick('Inter', 'Semi Bold'), pick(FONT_MONO, 'Medium'), pick(FONT_MONO, 'Bold'), pick(FONT_BRAND, 'Semi Bold')]) toLoad[f.family + '|' + f.style] = f;
  await Promise.all(Object.values(toLoad).map(f => figma.loadFontAsync(f)));
  REPORT.fonts = { mono: FONT_MONO, brand: FONT_BRAND, loaded: Object.keys(toLoad) };
}

async function setupTokens() {
  const colls = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  const getColl = (name, mode) => {
    let c = colls.find(x => x.name === name);
    if (!c) c = figma.variables.createVariableCollection(name);
    if (c.modes[0].name !== mode) c.renameMode(c.modes[0].modeId, mode);
    return c;
  };
  const mk = (coll, name, type, value, scopes, web, desc) => {
    let v = vars.find(x => x.name === name && x.variableCollectionId === coll.id);
    if (!v) v = figma.variables.createVariable(name, coll, type);
    v.setValueForMode(coll.modes[0].modeId, value);
    v.scopes = scopes;
    if (web) v.setVariableCodeSyntax('WEB', web);
    if (desc) v.description = desc;
    V[name] = v;
    return v;
  };
  const css = (n) => 'var(--rc-' + n.replace(/\//g, '-') + ')';
  const P = getColl('Primitives', 'Value');
  P.hiddenFromPublishing = true;
  const prim = {};
  for (const [k, h] of Object.entries(PRIMITIVES)) VAR_HEX[k] = h;
  for (const [n, p] of SEMANTIC) VAR_HEX[n] = PRIMITIVES[p];
  for (const [k, h] of Object.entries(PRIMITIVES)) prim[k] = mk(P, k, 'COLOR', hexToRgba(h), [], css('primitive/' + k), h.toUpperCase());
  const C = getColl('Color', 'Dark');
  for (const [n, p, sc, desc] of SEMANTIC) mk(C, n, 'COLOR', { type: 'VARIABLE_ALIAS', id: prim[p].id }, sc, css(n), desc);
  const D = getColl('Dimensions', 'Value');
  for (const [n, v, sc] of DIMENSIONS) mk(D, n, 'FLOAT', v, sc, css(n));
  REPORT.counts.variables = Object.keys(V).length;

  // text styles
  const localTS = await figma.getLocalTextStylesAsync();
  for (const [name, fk, style, size, lh, ls, tc, usage] of TEXT_STYLES) {
    const spec = TS[name];
    let s = localTS.find(x => x.name === name) || figma.createTextStyle();
    s.name = name; s.fontName = spec.font; s.fontSize = size;
    s.lineHeight = { unit: 'PIXELS', value: lh };
    s.letterSpacing = { unit: 'PERCENT', value: ls };
    s.textCase = tc || 'ORIGINAL';
    s.description = usage + ' — ' + spec.font.family + ' ' + spec.font.style + ' ' + size + '/' + lh;
    spec.id = s.id;
  }
  // effect styles
  const k = (a) => ({ r: 0, g: 0, b: 0, a });
  const sh = (a, y, r) => ({ type: 'DROP_SHADOW', color: k(a), offset: { x: 0, y }, radius: r, spread: 0, visible: true, blendMode: 'NORMAL' });
  const EFFECTS = [
    ['Elevation/1 Raised', [sh(0.30, 1, 2)], 'Cards and raised controls'],
    ['Elevation/2 Popover', [sh(0.30, 2, 6), sh(0.45, 12, 32)], 'Menus, dropdowns, flyouts, toasts'],
    ['Elevation/3 Modal', [sh(0.55, 24, 64)], 'Dialogs'],
    ['Elevation/Drag', [sh(0.45, 10, 24)], 'Block being dragged'],
    ['Focus/Ring', [{ type: 'DROP_SHADOW', color: { r: 0, g: 217 / 255, b: 163 / 255, a: 0.45 }, offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: 'NORMAL' }], 'Keyboard focus ring (with 1px teal stroke)'],
  ];
  const localES = await figma.getLocalEffectStylesAsync();
  for (const [name, eff, desc] of EFFECTS) {
    let s = localES.find(x => x.name === name) || figma.createEffectStyle();
    s.name = name; s.effects = eff; s.description = desc;
    ES[name] = s;
  }
  REPORT.counts.textStyles = TEXT_STYLES.length;
  REPORT.counts.effectStyles = EFFECTS.length;
}

async function applyLinks() {
  let ok = 0, fail = 0;
  for (const [node, kind, name] of LINKS) {
    try {
      if (node.removed) continue;
      if (kind === 'text') await node.setTextStyleIdAsync(TS[name].id);
      else if (kind === 'effect') await node.setEffectStyleIdAsync(ES[name].id);
      ok++;
    } catch (e) { fail++; if (fail < 10) warn('link ' + kind + ' ' + name + ': ' + e.message); }
  }
  LINKS.length = 0;
  REPORT.counts.styleLinks = (REPORT.counts.styleLinks || 0) + ok;
  REPORT.counts.styleLinkFailures = (REPORT.counts.styleLinkFailures || 0) + fail;
}
// ============================================================================
// Icons (Lucide, ISC licence — 24px grid, 2px stroke, drawn at 20px) and logo
// ============================================================================

const ICON_SVG = {
  'home': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  'folder-open': '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  'library': '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  'cpu': '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  'terminal': '<path d="m7 11 2-2-2-2"/><path d="M11 13h4"/><rect width="18" height="18" x="3" y="3" rx="2"/>',
  'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'stop': '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  'user': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'zoom-in': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/>',
  'zoom-out': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/>',
  'fit': '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  'reset': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  'save': '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  'usb': '<circle cx="10" cy="7" r="1"/><circle cx="4" cy="20" r="1"/><path d="M4.7 19.3 19 5"/><path d="m21 3-3 1 2 2Z"/><path d="M9.26 7.68 5 12l2 5"/><path d="m10 14 5 2 3.5-3.5"/><path d="m18 12 1-1 1 1-1 1Z"/>',
  'plug': '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  'unplug': '<path d="m19 5 3-3"/><path d="m2 22 3-3"/><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"/>',
  'wifi': '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  'code': '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  'blocks': '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
  'play': '<path d="M6 4l14 8-14 8z"/>',
  'pause': '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  'file-code': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',
  'more': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  'more-vertical': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'panel-bottom': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/>',
  'panel-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  'panel-right': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'filter': '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>',
  'grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  'list': '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  'star': '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  'undo': '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
  'redo': '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/>',
  'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  'activity': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  'radio': '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  'autoscroll': '<path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/>',
  'thermometer': '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  'message': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  'variable': '<path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>',
  'sigma': '<path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"/>',
  'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  'graduation': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  'loader': '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'keyboard': '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
  'palette': '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/>',
  'sliders': '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
  'globe': '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  'external': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  'cog-chip': '<rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 9h6v6H9z"/>',
  'gauge': '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'circle': '<circle cx="12" cy="12" r="9"/>',
};

function buildIcons(parent) {
  const STROKE = '#A7B1C2';
  const attrs = ' fill="none" stroke="' + STROKE + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const holder = box({ name: 'Icon set', dir: 'H', wrap: true, gap: 12, rowGap: 12, pad: 24, w: 1080, hSize: 'hug', parent, fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle' });
  for (const [name, inner] of Object.entries(ICON_SVG)) {
    const body = inner.replace(/<(path|rect|circle|line|polyline|polygon|ellipse)\b/g, (m) => m + attrs);
    const svg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
    let node;
    try { node = figma.createNodeFromSvg(svg); } catch (e) { warn('icon ' + name + ': ' + e.message); continue; }
    node.name = 'Icon/' + name;
    node.fills = [];
    const c = figma.createComponentFromNode(node);
    c.name = 'Icon/' + name;
    c.description = 'Lucide "' + name + '" — 20px, 2px stroke on a 24px grid. Recolour by overriding the stroke with a color/icon/* variable.';
    c.clipsContent = false;
    holder.appendChild(c);
    // bind strokes to the icon variable
    for (const v of c.findAll(n => 'strokes' in n)) {
      if (v.strokes && v.strokes.length) v.strokes = [paint('color/icon/default')];
      if (v.fills && v.fills.length) v.fills = [];
    }
    ICON[name] = c;
  }
  REPORT.counts.icons = Object.keys(ICON).length;
  return holder;
}

// --- RoboCore logo (from the official wordmark) ---
function logoSvg(kind) {
  const p = LOGO;
  if (kind === 'mark') {
    return '<svg width="480" height="480" viewBox="1105 103 480 480" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + p.gearOuter + '" fill="#F3B51B"/><path d="' + p.gearInner + '" fill="#C98F0B"/><path d="' + p.gearShine + '" fill="#FFF3CC"/></svg>';
  }
  // wordmark lockup with letters in light text
  return '<svg width="2815" height="490" viewBox="70 100 2815 490" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="' + p.letters + '" fill="#F5F5F5"/><path d="' + p.gearOuter + '" fill="#F3B51B"/><path d="' + p.gearInner + '" fill="#C98F0B"/><path d="' + p.gearShine + '" fill="#FFF3CC"/></svg>';
}
function buildLogos(parent) {
  const row = box({ name: 'Logo components', dir: 'H', gap: 32, pad: 32, cross: 'center', parent, fill: 'color/bg/chrome', radius: 12, stroke: 'color/border/subtle' });
  // mark
  const mNode = figma.createNodeFromSvg(logoSvg('mark'));
  const mark = figma.createComponentFromNode(mNode);
  mark.name = 'Logo/Mark';
  mark.description = 'RoboCore gear mark in brand yellow. Use at 20–32px in product chrome; minimum 16px.';
  mark.rescale(28 / mark.width);
  row.appendChild(mark);
  CMP['Logo/Mark'] = mark;
  // wordmark
  const wNode = figma.createNodeFromSvg(logoSvg('word'));
  const word = figma.createComponentFromNode(wNode);
  word.name = 'Logo/Wordmark';
  word.description = 'Official RoboCore wordmark (gear "o"), light letters for dark UI.';
  word.rescale(22 / word.height);
  row.appendChild(word);
  CMP['Logo/Wordmark'] = word;
  // product lockup: wordmark + IDE
  const lock = comp('Logo/Product Lockup', 'RoboCore IDE lockup used in the top bar. Wordmark + "IDE" in brand yellow.');
  al(lock, { gap: 8, cross: 'center' });
  const wi = word.createInstance();
  lock.appendChild(wi);
  const ide = txt('IDE', { style: 'Brand/Wordmark', color: 'color/brand/default', parent: lock, name: 'Product' });
  row.appendChild(lock);
  CMP['Logo/Product Lockup'] = lock;
  return row;
}
// ============================================================================
// UI components — every component is auto-layout, token-bound, with variants
// ============================================================================

function rootsOf(owner) { return owner.type === 'COMPONENT_SET' ? owner.children : [owner]; }
function propText(owner, prop, nodeName, def) {
  const key = owner.addComponentProperty(prop, 'TEXT', def);
  for (const r of rootsOf(owner)) for (const t of r.findAll(n => n.type === 'TEXT' && n.name === nodeName)) t.componentPropertyReferences = Object.assign({}, t.componentPropertyReferences, { characters: key });
  return key;
}
function propBool(owner, prop, nodeName, def) {
  const key = owner.addComponentProperty(prop, 'BOOLEAN', def === undefined ? true : def);
  for (const r of rootsOf(owner)) for (const n of r.findAll(n => n.name === nodeName)) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { visible: key });
  return key;
}
function propSwap(owner, prop, nodeName, defIcon) {
  const key = owner.addComponentProperty(prop, 'INSTANCE_SWAP', ICON[defIcon].id);
  for (const r of rootsOf(owner)) for (const n of r.findAll(n => n.type === 'INSTANCE' && n.name === nodeName)) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { mainComponent: key });
  return key;
}
function iconSlot(parent, name, color, size, slotName = 'Icon') {
  const i = iconInst(name, parent, color, size);
  if (i) i.name = slotName;
  return i;
}

// ---------------------------------------------------------------- Button
const BTN = {
  Primary:   { Default: ['color/accent/default', null, 'color/text/on-accent', 'color/icon/on-accent'], Hover: ['color/accent/hover', null, 'color/text/on-accent', 'color/icon/on-accent'], Pressed: ['color/accent/pressed', null, 'color/text/on-accent', 'color/icon/on-accent'], Focus: ['color/accent/default', 'color/border/focus', 'color/text/on-accent', 'color/icon/on-accent'], Disabled: ['color/bg/raised', null, 'color/text/disabled', 'color/icon/disabled'] },
  Secondary: { Default: ['color/bg/raised', 'color/border/default', 'color/text/primary', 'color/icon/default'], Hover: ['color/bg/hover', 'color/border/strong', 'color/text/primary', 'color/icon/strong'], Pressed: ['color/bg/input', 'color/border/strong', 'color/text/primary', 'color/icon/strong'], Focus: ['color/bg/raised', 'color/border/focus', 'color/text/primary', 'color/icon/default'], Disabled: ['color/bg/panel', 'color/border/subtle', 'color/text/disabled', 'color/icon/disabled'] },
  Ghost:     { Default: [null, null, 'color/text/secondary', 'color/icon/default'], Hover: ['color/bg/hover', null, 'color/text/primary', 'color/icon/strong'], Pressed: ['color/bg/raised', null, 'color/text/primary', 'color/icon/strong'], Focus: [null, 'color/border/focus', 'color/text/primary', 'color/icon/default'], Disabled: [null, null, 'color/text/disabled', 'color/icon/disabled'] },
  Danger:    { Default: ['color/status/error-subtle', 'color/status/error', 'color/status/error', 'color/status/error'], Hover: ['color/status/error', null, 'color/text/on-accent', 'color/icon/on-accent'], Pressed: ['color/status/error', null, 'color/text/on-accent', 'color/icon/on-accent'], Focus: ['color/status/error-subtle', 'color/border/focus', 'color/status/error', 'color/status/error'], Disabled: ['color/bg/panel', 'color/border/subtle', 'color/text/disabled', 'color/icon/disabled'] },
};
function buildButton(parent) {
  const comps = [];
  for (const [variant, states] of Object.entries(BTN)) {
    for (const [state, [fill, stroke, text, icon]] of Object.entries(states)) {
      const c = comp('Variant=' + variant + ', State=' + state);
      al(c, { gap: 8, pad: [0, 14, 0, 12], h: 32, cross: 'center', radius: 8, fill: fill || undefined, stroke: stroke || undefined });
      c.layoutSizingHorizontal = 'HUG';
      if (state === 'Focus') LINKS.push([c, 'effect', 'Focus/Ring']);
      iconSlot(c, 'plus', icon, 16);
      txt('Button', { style: variant === 'Primary' ? 'Label/Strong' : 'Label/Default', color: text, parent: c, name: 'Label' });
      comps.push(c);
    }
  }
  const set = makeSet(comps, 'Button', parent, 5, 'Primary = teal call-to-action (one per view). Secondary = standard actions. Ghost = low-emphasis/toolbar. Danger = destructive. 32px high, 8px radius, 16px icon. Focus shows the teal focus ring.');
  propText(set, 'Label', 'Label', 'Button');
  propBool(set, 'Show icon', 'Icon', true);
  propSwap(set, 'Icon', 'Icon', 'plus');
  CMP['Button'] = set;
  return set;
}

// ---------------------------------------------------------------- Icon Button
function buildIconButton(parent) {
  const S = {
    Ghost:  { Default: [null, null, 'color/icon/default'], Hover: ['color/bg/hover', null, 'color/icon/strong'], Active: ['color/bg/selected', 'color/accent/muted', 'color/icon/active'], Disabled: [null, null, 'color/icon/disabled'] },
    Subtle: { Default: ['color/bg/raised', 'color/border/subtle', 'color/icon/default'], Hover: ['color/bg/hover', 'color/border/default', 'color/icon/strong'], Active: ['color/bg/selected', 'color/accent/muted', 'color/icon/active'], Disabled: ['color/bg/panel', 'color/border/subtle', 'color/icon/disabled'] },
    Accent: { Default: ['color/accent/default', null, 'color/icon/on-accent'], Hover: ['color/accent/hover', null, 'color/icon/on-accent'], Active: ['color/accent/pressed', null, 'color/icon/on-accent'], Disabled: ['color/bg/raised', null, 'color/icon/disabled'] },
  };
  const comps = [];
  for (const [variant, states] of Object.entries(S)) for (const [state, [fill, stroke, icon]] of Object.entries(states)) {
    const c = comp('Variant=' + variant + ', State=' + state);
    al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: fill || undefined, stroke: stroke || undefined });
    iconSlot(c, 'settings', icon, 18);
    comps.push(c);
  }
  const set = makeSet(comps, 'Icon Button', parent, 4, 'Square 32px icon-only control. Always pair with a tooltip and an accessible label (aria-label). Active = toggled on (teal).');
  propSwap(set, 'Icon', 'Icon', 'settings');
  CMP['Icon Button'] = set;
  return set;
}

// ---------------------------------------------------------------- Badge
function buildBadge(parent) {
  const T = { Neutral: ['color/bg/raised', 'color/text/secondary'], Success: ['color/status/success-subtle', 'color/status/success'], Warning: ['color/status/warning-subtle', 'color/status/warning'], Error: ['color/status/error-subtle', 'color/status/error'], Info: ['color/status/info-subtle', 'color/status/info'], Brand: ['color/brand/subtle', 'color/brand/default'] };
  const comps = [];
  for (const [tone, [bg, fg]] of Object.entries(T)) {
    const c = comp('Tone=' + tone);
    al(c, { gap: 6, pad: [0, 8, 0, 8], h: 20, cross: 'center', radius: 999, fill: bg });
    c.layoutSizingHorizontal = 'HUG';
    dot(c, fg, 6, 'Dot');
    txt(tone, { style: 'Label/Small', color: fg, parent: c, name: 'Label' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Badge', parent, 6, 'Small status / metadata tag. Never rely on colour alone — the label carries the meaning.');
  propBool(set, 'Show dot', 'Dot', true);
  CMP['Badge'] = set;
  return set;
}

// ---------------------------------------------------------------- Connection Status
const CONN = {
  Connected: ['color/status/success', 'color/status/success-subtle', 'Connected'],
  Disconnected: ['color/text/tertiary', 'color/bg/raised', 'Not connected'],
  Connecting: ['color/status/warning', 'color/status/warning-subtle', 'Connecting…'],
  Uploading: ['color/status/info', 'color/status/info-subtle', 'Uploading…'],
  Error: ['color/status/error', 'color/status/error-subtle', 'Port unavailable'],
};
function buildConnection(parent) {
  const comps = [];
  for (const [status, [fg, bg, label]] of Object.entries(CONN)) {
    const c = comp('Status=' + status);
    al(c, { gap: 6, pad: [0, 10, 0, 8], h: 24, cross: 'center', radius: 999, fill: bg });
    c.layoutSizingHorizontal = 'HUG';
    const d = dot(c, fg === 'color/text/tertiary' ? 'color/icon/muted' : fg, 8, 'Dot');
    if (status === 'Connected') { d.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0.85, b: 0.64, a: 0.5 }, offset: { x: 0, y: 0 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' }]; }
    txt(label, { style: 'Label/Small', color: fg, parent: c, name: 'Label' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Connection Status', parent, 5, 'Hardware connection indicator. Only show "Connected" when a real serial/USB session is open — never fake it. Text always accompanies the dot.');
  CMP['Connection Status'] = set;
  return set;
}

// ---------------------------------------------------------------- Board Selector
function buildBoardSelector(parent) {
  const comps = [];
  for (const status of ['Connected', 'Disconnected', 'Connecting']) for (const state of ['Default', 'Hover', 'Open']) {
    const c = comp('Status=' + status + ', State=' + state);
    al(c, { gap: 10, pad: [4, 10, 4, 4], h: 40, cross: 'center', radius: 10, fill: state === 'Hover' ? 'color/bg/hover' : 'color/bg/input', stroke: state === 'Open' ? 'color/border/focus' : (state === 'Hover' ? 'color/border/strong' : 'color/border/default') });
    c.layoutSizingHorizontal = 'HUG';
    const tile = box({ name: 'Chip tile', dir: 'H', w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: 'color/bg/raised', parent: c });
    iconSlot(tile, 'cpu', status === 'Connected' ? 'color/icon/brand' : 'color/icon/muted', 18, 'Board icon');
    const col = box({ name: 'Board text', dir: 'V', gap: 0, parent: c });
    txt('RoboCore V2', { style: 'Label/Strong', parent: col, name: 'Board' });
    txt(status === 'Disconnected' ? 'ESP32-S3 · no port selected' : 'ESP32-S3 · usbmodem1101', { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Details' });
    const [fg, bg, label] = CONN[status];
    const pill = box({ name: 'Status', dir: 'H', gap: 6, pad: [0, 8, 0, 8], h: 22, cross: 'center', radius: 999, fill: bg, parent: c });
    dot(pill, status === 'Disconnected' ? 'color/icon/muted' : fg, 7, 'Dot');
    txt(label, { style: 'Label/Small', color: fg, parent: pill, name: 'Status label' });
    iconSlot(c, state === 'Open' ? 'chevron-up' : 'chevron-down', 'color/icon/muted', 16, 'Chevron');
    comps.push(c);
  }
  const set = makeSet(comps, 'Board Selector', parent, 3, 'Top-bar board + port picker. Shows board, MCU, port and the real connection state. Click opens the board menu (State=Open).');
  propText(set, 'Board', 'Board', 'RoboCore V2');
  CMP['Board Selector'] = set;
  return set;
}

// ---------------------------------------------------------------- Nav Item
function buildNavItem(parent) {
  const comps = [];
  for (const collapsed of ['False', 'True']) for (const state of ['Default', 'Hover', 'Active']) {
    const c = comp('State=' + state + ', Collapsed=' + collapsed);
    const fill = state === 'Active' ? 'color/bg/selected' : (state === 'Hover' ? 'color/bg/hover' : undefined);
    if (collapsed === 'False') al(c, { gap: 12, pad: [0, 12, 0, 12], w: 184, h: 40, cross: 'center', radius: 8, fill });
    else al(c, { w: 40, h: 40, align: 'center', cross: 'center', radius: 8, fill });
    const icol = state === 'Active' ? 'color/icon/active' : (state === 'Hover' ? 'color/icon/strong' : 'color/icon/default');
    iconSlot(c, 'home', icol, 20);
    if (collapsed === 'False') {
      txt('Home', { style: 'Body/Medium', color: state === 'Default' ? 'color/text/secondary' : 'color/text/primary', parent: c, name: 'Label', grow: true });
      const ind = box({ name: 'Indicator', dir: 'H', gap: 0, cross: 'center', parent: c });
      dot(ind, 'color/status/success', 8, 'Live dot');
    }
    if (state === 'Active') rect({ name: 'Active bar', w: 3, h: 20, radius: [0, 3, 3, 0], fill: 'color/accent/default', parent: c, abs: true, x: 0, y: 10 });
    comps.push(c);
  }
  const set = makeSet(comps, 'Nav Item', parent, 3, 'Sidebar destination. Active = teal tint + teal icon + 3px indicator. Collapsed = icon only (show label as tooltip). Indicator dot = live state (e.g. serial port open).');
  propText(set, 'Label', 'Label', 'Home');
  propSwap(set, 'Icon', 'Icon', 'home');
  propBool(set, 'Show indicator', 'Indicator', false);
  CMP['Nav Item'] = set;
  return set;
}

// ---------------------------------------------------------------- Mode Switch (Blocks / Code)
function buildModeSwitch(parent) {
  const comps = [];
  for (const active of ['Blocks', 'Code']) {
    const c = comp('Active=' + active);
    al(c, { gap: 2, pad: 3, cross: 'center', radius: 10, fill: 'color/bg/input', stroke: 'color/border/subtle' });
    for (const [m, ic] of [['Blocks', 'blocks'], ['Code', 'code']]) {
      const on = m === active;
      const seg = box({ name: 'Segment ' + m, dir: 'H', gap: 8, pad: [0, 14, 0, 12], h: 30, cross: 'center', radius: 8, fill: on ? 'color/bg/selected' : undefined, stroke: on ? 'color/accent/muted' : undefined, parent: c });
      iconSlot(seg, ic, on ? 'color/icon/active' : 'color/icon/muted', 16, 'Icon ' + m);
      txt(m, { style: 'Label/Strong', color: on ? 'color/text/primary' : 'color/text/tertiary', parent: seg, name: 'Label ' + m });
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Mode Switch', parent, 2, 'Primary programming-mode selector. Blocks ↔ Code keeps the same project; Blocks generate C++, Code is the source of truth once edited by hand (show a warning before converting back).');
  CMP['Mode Switch'] = set;
  return set;
}

// ---------------------------------------------------------------- File Tab
function buildFileTab(parent) {
  const comps = [];
  for (const state of ['Active', 'Inactive', 'Hover']) {
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 8, 0, 12], h: 36, cross: 'center', fill: state === 'Active' ? 'color/bg/editor' : (state === 'Hover' ? 'color/bg/hover' : undefined), stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 1;
    c.layoutSizingHorizontal = 'HUG';
    iconSlot(c, 'file-code', state === 'Active' ? 'color/icon/brand' : 'color/icon/muted', 16, 'File icon');
    txt('Blink.ino', { style: 'Label/Default', color: state === 'Inactive' ? 'color/text/tertiary' : 'color/text/primary', parent: c, name: 'Filename' });
    const mod = box({ name: 'Modified', dir: 'H', w: 16, h: 16, align: 'center', cross: 'center', parent: c });
    dot(mod, 'color/brand/default', 8, 'Unsaved dot');
    iconSlot(c, 'x', 'color/icon/muted', 14, 'Close');
    if (state === 'Active') rect({ name: 'Active line', w: 10, h: 2, fill: 'color/accent/default', parent: c, abs: true, x: 0, y: 0 });
    comps.push(c);
  }
  const set = makeSet(comps, 'File Tab', parent, 3, 'Sketch file tab. Yellow dot = unsaved changes (replaces the close icon until hover). Active tab merges into the editor surface with a teal top line.');
  propText(set, 'Filename', 'Filename', 'Blink.ino');
  propBool(set, 'Modified', 'Modified', false);
  // stretch the active line across the tab
  for (const v of set.children) { const l = v.findOne(n => n.name === 'Active line'); if (l) { l.constraints = { horizontal: 'STRETCH', vertical: 'MIN' }; l.resize(v.width, 2); } }
  CMP['File Tab'] = set;
  return set;
}

// ---------------------------------------------------------------- Panel Tab (console tabs)
function buildPanelTab(parent) {
  const comps = [];
  for (const state of ['Active', 'Inactive']) {
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 4, 0, 4], h: 36, cross: 'center' });
    c.layoutSizingHorizontal = 'HUG';
    iconSlot(c, 'terminal', state === 'Active' ? 'color/icon/active' : 'color/icon/muted', 16);
    txt('Serial Monitor', { style: 'Label/Default', color: state === 'Active' ? 'color/text/primary' : 'color/text/tertiary', parent: c, name: 'Label' });
    const b = box({ name: 'Count', dir: 'H', pad: [0, 6, 0, 6], h: 18, cross: 'center', radius: 999, fill: 'color/bg/raised', parent: c });
    txt('0', { style: 'Label/Small', color: 'color/text/secondary', parent: b, name: 'Count label' });
    if (state === 'Active') { const bar = rect({ name: 'Active line', w: 10, h: 2, fill: 'color/accent/default', parent: c, abs: true, x: 0, y: 34 }); bar.constraints = { horizontal: 'STRETCH', vertical: 'MAX' }; }
    comps.push(c);
  }
  const set = makeSet(comps, 'Panel Tab', parent, 2, 'Bottom utility panel tabs: Serial Monitor, Compiler Output, Problems. Count badge shows unread lines / problem count.');
  propText(set, 'Label', 'Label', 'Serial Monitor');
  propSwap(set, 'Icon', 'Icon', 'terminal');
  propBool(set, 'Show count', 'Count', false);
  propText(set, 'Count', 'Count label', '0');
  for (const v of set.children) { const l = v.findOne(n => n.name === 'Active line'); if (l) l.resize(v.width, 2); }
  CMP['Panel Tab'] = set;
  return set;
}

// ---------------------------------------------------------------- Inputs
function buildInputs(parent) {
  const S = { Default: ['color/border/default', null], Hover: ['color/border/strong', null], Focus: ['color/border/focus', 'Focus/Ring'], Error: ['color/status/error', null], Disabled: ['color/border/subtle', null] };
  const comps = [];
  for (const [state, [stroke, eff]] of Object.entries(S)) {
    const c = comp('State=' + state);
    al(c, { dir: 'V', gap: 6, w: 280, cross: 'start' });
    c.layoutSizingVertical = 'HUG';
    txt('Project name', { style: 'Label/Default', color: 'color/text/secondary', parent: c, name: 'Label' });
    const f = box({ name: 'Field', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 36, cross: 'center', radius: 8, fill: state === 'Disabled' ? 'color/bg/panel' : 'color/bg/input', stroke, parent: c, wSize: 'fill' });
    if (eff) LINKS.push([f, 'effect', eff]);
    txt(state === 'Default' || state === 'Hover' ? 'e.g. Line follower' : (state === 'Error' ? '' : 'Obstacle avoider'), { style: 'Body/Default', color: state === 'Default' || state === 'Hover' ? 'color/text/tertiary' : (state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary'), parent: f, name: 'Value', grow: true });
    if (state === 'Focus') rect({ name: 'Caret', w: 1, h: 18, fill: 'color/accent/default', parent: f });
    if (state === 'Error') iconSlot(f, 'alert-triangle', 'color/status/error', 16, 'Error icon');
    txt(state === 'Error' ? 'Give your project a name to save it.' : 'Letters, numbers, spaces and dashes.', { style: 'Caption/Default', color: state === 'Error' ? 'color/status/error' : 'color/text/tertiary', parent: c, name: 'Helper' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Input Field', parent, 5, 'Labelled text input, 36px. Labels are always visible (no placeholder-only fields). Error text explains how to fix the problem.');
  propText(set, 'Label', 'Label', 'Project name');
  propBool(set, 'Show label', 'Label', true);
  propBool(set, 'Show helper', 'Helper', true);
  CMP['Input Field'] = set;

  // Search field
  const s = comp('Search Field', 'Filter/search input with ⌘K hint.');
  al(s, { gap: 8, pad: [0, 8, 0, 10], w: 280, h: 32, cross: 'center', radius: 8, fill: 'color/bg/input', stroke: 'color/border/default' });
  iconSlot(s, 'search', 'color/icon/muted', 16, 'Search icon');
  txt('Search projects, examples, boards…', { style: 'Body/Small', color: 'color/text/tertiary', parent: s, name: 'Placeholder', grow: true, truncate: true });
  const kbd = box({ name: 'Shortcut', dir: 'H', pad: [0, 6, 0, 6], h: 20, cross: 'center', radius: 4, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: s });
  txt('⌘K', { style: 'Label/Small', color: 'color/text/tertiary', parent: kbd, name: 'Key' });
  propText(s, 'Placeholder', 'Placeholder', 'Search projects, examples, boards…');
  CMP['Search Field'] = s;
  parent.appendChild(s);

  // Select (dropdown trigger)
  const sc = [];
  for (const state of ['Default', 'Hover', 'Open', 'Disabled']) {
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 8, 0, 10], w: 160, h: 32, cross: 'center', radius: 8, fill: state === 'Disabled' ? 'color/bg/panel' : (state === 'Hover' ? 'color/bg/hover' : 'color/bg/input'), stroke: state === 'Open' ? 'color/border/focus' : (state === 'Hover' ? 'color/border/strong' : 'color/border/default') });
    txt('115200 baud', { style: 'Label/Default', color: state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', parent: c, name: 'Value', grow: true, truncate: true });
    iconSlot(c, state === 'Open' ? 'chevron-up' : 'chevron-down', 'color/icon/muted', 16, 'Chevron');
    sc.push(c);
  }
  const sset = makeSet(sc, 'Select', parent, 4, 'Dropdown trigger (baud rate, line ending, port, options). Opens a Menu.');
  propText(sset, 'Value', 'Value', '115200 baud');
  CMP['Select'] = sset;
}

// ---------------------------------------------------------------- Menu
function buildMenu(parent) {
  const mc = [];
  for (const state of ['Default', 'Hover', 'Selected', 'Disabled']) {
    const c = comp('State=' + state);
    al(c, { gap: 10, pad: [0, 10, 0, 10], w: 240, h: 32, cross: 'center', radius: 6, fill: state === 'Hover' ? 'color/bg/hover' : (state === 'Selected' ? 'color/bg/selected' : undefined) });
    iconSlot(c, 'cpu', state === 'Selected' ? 'color/icon/active' : (state === 'Disabled' ? 'color/icon/disabled' : 'color/icon/default'), 16, 'Leading icon');
    txt('Menu item', { style: 'Body/Small', color: state === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', parent: c, name: 'Label', grow: true, truncate: true });
    txt('⌘N', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Shortcut' });
    iconSlot(c, 'check', state === 'Selected' ? 'color/icon/active' : 'color/icon/disabled', 16, 'Check');
    mc.push(c);
  }
  const set = makeSet(mc, 'Menu Item', parent, 4, 'Row inside menus and dropdowns. Selected shows a teal check.');
  propText(set, 'Label', 'Label', 'Menu item');
  propText(set, 'Shortcut', 'Shortcut', '⌘N');
  propBool(set, 'Show icon', 'Leading icon', true);
  propBool(set, 'Show shortcut', 'Shortcut', true);
  propBool(set, 'Show check', 'Check', false);
  propSwap(set, 'Icon', 'Leading icon', 'cpu');
  CMP['Menu Item'] = set;

  const m = comp('Menu', 'Floating menu panel (Elevation/2 Popover). Compose with Menu Item rows and dividers.');
  al(m, { dir: 'V', gap: 2, pad: 6, w: 252, cross: 'start', radius: 10, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover' });
  m.layoutSizingVertical = 'HUG';
  for (const [l, k, ic, st] of [['New project', '⌘N', 'plus', 'Default'], ['Open…', '⌘O', 'folder-open', 'Hover'], ['Save', '⌘S', 'save', 'Default'], ['Rename', '', 'pencil', 'Default']]) {
    const i = inst('Menu Item', { State: st }, m, { text: { Label: l, Shortcut: k || ' ' } });
    i.layoutSizingHorizontal = 'FILL';
    setProp(i, 'Icon', ICON[ic].id);
    if (!k) setProp(i, 'Show shortcut', false);
  }
  divider(m, 'H', 240, 'color/border/subtle');
  const pi = inst('Menu Item', { State: 'Default' }, m, { text: { Label: 'Project settings…', Shortcut: '⌘,' } });
  pi.layoutSizingHorizontal = 'FILL'; setProp(pi, 'Icon', ICON['settings'].id);
  CMP['Menu'] = m;
  parent.appendChild(m);
}

// ---------------------------------------------------------------- Toggle / Checkbox / Radio
function buildControls(parent) {
  const tc = [];
  for (const on of ['True', 'False']) for (const dis of ['False', 'True']) {
    const c = comp('On=' + on + ', Disabled=' + dis);
    al(c, { w: 36, h: 20, pad: 2, align: on === 'True' ? 'end' : 'start', cross: 'center', radius: 999, fill: on === 'True' ? 'color/accent/default' : 'color/control/track-off' });
    if (dis === 'True') c.opacity = 0.4;
    const k = figma.createEllipse(); k.name = 'Knob'; k.resize(16, 16); k.fills = [paint('color/control/knob')];
    c.appendChild(k);
    tc.push(c);
  }
  CMP['Toggle'] = makeSet(tc, 'Toggle', parent, 4, 'Binary setting that applies immediately (autosave, timestamps, autoscroll).');
  const cc = [];
  for (const ch of ['True', 'False']) {
    const c = comp('Checked=' + ch);
    al(c, { w: 18, h: 18, align: 'center', cross: 'center', radius: 4, fill: ch === 'True' ? 'color/accent/default' : 'color/bg/input', stroke: ch === 'True' ? undefined : 'color/border/strong' });
    if (ch === 'True') iconSlot(c, 'check', 'color/icon/on-accent', 14, 'Check');
    cc.push(c);
  }
  CMP['Checkbox'] = makeSet(cc, 'Checkbox', parent, 2, 'Multi-select option.');
  const rc = [];
  for (const sel of ['True', 'False']) {
    const c = comp('Selected=' + sel);
    al(c, { w: 18, h: 18, align: 'center', cross: 'center', radius: 999, fill: 'color/bg/input', stroke: sel === 'True' ? 'color/border/focus' : 'color/border/strong' });
    if (sel === 'True') c.strokeWeight = 2;
    if (sel === 'True') { const d = figma.createEllipse(); d.name = 'Dot'; d.resize(8, 8); d.fills = [paint('color/accent/default')]; c.appendChild(d); }
    rc.push(c);
  }
  CMP['Radio'] = makeSet(rc, 'Radio', parent, 2, 'Single choice in a group.');
}

// ---------------------------------------------------------------- Tooltip
function buildTooltip(parent) {
  const c = comp('Tooltip', 'Inverse tooltip with optional shortcut. Delay 400ms, appears on hover and keyboard focus.');
  al(c, { gap: 8, pad: [0, 8, 0, 8], h: 26, cross: 'center', radius: 6, fill: 'color/bg/inverse', effect: 'Elevation/2 Popover' });
  c.layoutSizingHorizontal = 'HUG';
  txt('Verify sketch', { style: 'Label/Default', color: 'color/text/inverse', parent: c, name: 'Label' });
  txt('⌘R', { style: 'Label/Small', color: 'color/text/inverse', parent: c, name: 'Shortcut', opacity: 0.6 });
  propText(c, 'Label', 'Label', 'Verify sketch');
  propText(c, 'Shortcut', 'Shortcut', '⌘R');
  CMP['Tooltip'] = c;
  parent.appendChild(c);
}

// ---------------------------------------------------------------- Toast
function buildToast(parent) {
  const T = { Success: ['color/status/success', 'check-circle', 'Upload complete', 'Blink LED is running on RoboCore V2.'], Error: ['color/status/error', 'x-circle', 'Upload failed', 'No device found on /dev/cu.usbmodem1101. Check the USB-C cable.'], Info: ['color/status/info', 'info', 'Board package available', 'ESP32 core 3.0.7 adds RoboCore V2 pin names.'], Warning: ['color/status/warning', 'alert-triangle', 'Unsaved changes', 'Code edited by hand can’t be turned back into blocks.'] };
  const comps = [];
  for (const [type, [col, ic, title, msg]] of Object.entries(T)) {
    const c = comp('Type=' + type);
    al(c, { gap: 12, pad: [12, 12, 12, 14], w: 380, cross: 'start', radius: 12, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover' });
    c.layoutSizingVertical = 'HUG';
    rect({ name: 'Accent', w: 3, h: 10, fill: col, parent: c, abs: true, x: 0, y: 0 });
    iconSlot(c, ic, col, 20, 'Icon');
    const col2 = box({ name: 'Text', dir: 'V', gap: 2, parent: c, grow: true });
    col2.layoutSizingHorizontal = 'FILL';
    txt(title, { style: 'Label/Strong', parent: col2, name: 'Title' });
    txt(msg, { style: 'Body/Small', color: 'color/text/secondary', parent: col2, name: 'Message', fill: true });
    const x = iconSlot(c, 'x', 'color/icon/muted', 16, 'Close');
    comps.push(c);
  }
  const set = makeSet(comps, 'Toast', parent, 2, 'Transient feedback, bottom-right, 5s (errors persist until dismissed). Errors say what happened and what to do next.');
  for (const v of set.children) { const a = v.findOne(n => n.name === 'Accent'); if (a) { a.resize(3, v.height); a.constraints = { horizontal: 'MIN', vertical: 'STRETCH' }; a.topLeftRadius = 12; a.bottomLeftRadius = 12; } }
  CMP['Toast'] = set;
  return set;
}

// ---------------------------------------------------------------- Block Category Item
const BLOCK_CATS = [
  ['Output', 'color/block/output', 'log-out'], ['Input', 'color/block/input', 'log-in'], ['Control', 'color/block/control', 'repeat'], ['Math', 'color/block/math', 'sigma'],
  ['Variables', 'color/block/variables', 'variable'], ['Robotics', 'color/block/robotics', 'bot'], ['Sensors', 'color/block/sensors', 'radio'], ['Communication', 'color/block/communication', 'message'],
];
function buildCategoryItem(parent) {
  const comps = [];
  for (const [cat, col] of BLOCK_CATS) for (const state of ['Default', 'Active']) {
    const c = comp('Category=' + cat + ', State=' + state);
    al(c, { gap: 10, pad: [0, 10, 0, 12], w: 152, h: 36, cross: 'center', radius: 8, fill: state === 'Active' ? 'color/bg/raised' : undefined });
    const sw = box({ name: 'Swatch', dir: 'H', w: 14, h: 14, radius: 999, fill: col, parent: c });
    if (state === 'Active') { sw.strokes = [paint('color/icon/strong', 0.5)]; sw.strokeWeight = 2; sw.strokeAlign = 'OUTSIDE'; }
    txt(cat, { style: state === 'Active' ? 'Label/Strong' : 'Label/Default', color: state === 'Active' ? 'color/text/primary' : 'color/text/secondary', parent: c, name: 'Label', grow: true });
    if (state === 'Active') rect({ name: 'Category bar', w: 3, h: 20, radius: [0, 3, 3, 0], fill: col, parent: c, abs: true, x: 0, y: 8 });
    comps.push(c);
  }
  const set = makeSet(comps, 'Block Category', parent, 4, 'Toolbox category. Each category keeps its own colour so learners can match blocks to the palette. Active = raised + category-coloured bar.');
  CMP['Block Category'] = set;
  return set;
}

// ---------------------------------------------------------------- Toolbar Action (Verify / Upload / Stop)
function buildToolbarActions(parent) {
  const comps = [];
  const mk = (action, state) => {
    const c = comp('Action=' + action + ', State=' + state);
    if (action === 'Stop') {
      const fill = state === 'Hover' ? 'color/status/error-subtle' : (state === 'Running' ? 'color/status/error-subtle' : undefined);
      al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill, stroke: state === 'Running' ? 'color/status/error' : 'color/border/subtle' });
      iconSlot(c, 'stop', state === 'Disabled' ? 'color/icon/disabled' : 'color/status/error', 16, 'Icon');
      return c;
    }
    const primary = action === 'Upload';
    const fill = primary ? (state === 'Disabled' ? 'color/bg/raised' : (state === 'Hover' ? 'color/accent/hover' : (state === 'Running' ? 'color/accent/pressed' : 'color/accent/default'))) : (state === 'Hover' ? 'color/bg/hover' : (state === 'Disabled' ? 'color/bg/panel' : 'color/bg/raised'));
    const stroke = primary ? undefined : (state === 'Running' ? 'color/accent/muted' : (state === 'Hover' ? 'color/border/strong' : 'color/border/default'));
    al(c, { gap: 8, pad: [0, 14, 0, 12], h: 32, cross: 'center', radius: 8, fill, stroke });
    c.layoutSizingHorizontal = 'HUG';
    c.clipsContent = true;
    const ic = state === 'Running' ? 'loader' : (primary ? 'arrow-right' : 'check');
    const icol = state === 'Disabled' ? 'color/icon/disabled' : (primary ? 'color/icon/on-accent' : 'color/icon/active');
    iconSlot(c, ic, icol, 16, 'Icon');
    const label = state === 'Running' ? (primary ? 'Uploading 64%' : 'Verifying…') : action;
    txt(label, { style: 'Label/Strong', color: state === 'Disabled' ? 'color/text/disabled' : (primary ? 'color/text/on-accent' : 'color/text/primary'), parent: c, name: 'Label' });
    if (primary && state === 'Running') { const pr = rect({ name: 'Progress', w: 10, h: 3, fill: 'color/text/on-accent', parent: c, abs: true, x: 0, y: 29 }); pr.opacity = 0.35; }
    return c;
  };
  for (const action of ['Verify', 'Upload', 'Stop']) for (const state of ['Default', 'Hover', 'Running', 'Disabled']) comps.push(mk(action, state));
  const set = makeSet(comps, 'Toolbar Action', parent, 4, 'Build controls. Verify (⌘R) compiles; Upload (⌘U) compiles + flashes; Stop cancels the running operation and is disabled when idle. Running states show real progress only.');
  for (const v of set.children) { const p = v.findOne(n => n.name === 'Progress'); if (p) p.resize(Math.round(v.width * 0.64), 3); }
  CMP['Toolbar Action'] = set;
  return set;
}

// ---------------------------------------------------------------- Avatar
function buildAvatar(parent) {
  const c = comp('Avatar', 'User avatar / account menu trigger (initials fallback).');
  al(c, { w: 32, h: 32, align: 'center', cross: 'center', radius: 999, fill: 'color/brand/subtle', stroke: 'color/brand/default' });
  txt('FM', { style: 'Label/Strong', color: 'color/brand/default', parent: c, name: 'Initials' });
  propText(c, 'Initials', 'Initials', 'FM');
  CMP['Avatar'] = c;
  parent.appendChild(c);
}
// ============================================================================
// Programming blocks — Scratch/Blockly-style geometry drawn as vectors
// Statement: notch on top, tab below. Hat: dome on top. C-block: mouth(s).
// Pitch between stacked statements = body height (the tab nests in the notch).
// ============================================================================

const BK = { R: 6, NX: 16, NW: 28, NS: 6, ND: 6, IW: 20, CAP: 18, HATW: 96 };
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
    // dome peaks exactly at y=0 (control y = -CAP/3)
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
function shapeVector(d, colorVar, name = 'Shape', ghost) {
  const v = figma.createVector();
  v.name = name;
  v.vectorPaths = [{ windingRule: 'NONZERO', data: d }];
  if (ghost) { v.fills = [solid('#FFFFFF', 0.10)]; v.strokes = [solid('#FFFFFF', 0.45)]; v.dashPattern = [4, 3]; }
  else { v.fills = [paint(colorVar)]; v.strokes = [solid('#000000', 0.25)]; }
  v.strokeWeight = 1;
  v.strokeAlign = 'INSIDE';
  return v;
}
const catVar = (cat) => 'color/block/' + cat.toLowerCase();

// ---- parts: 'label' | {t:'drop', v} | {t:'num', v} | {t:'text', v} | {t:'color', v:'#hex'} | {t:'icon', v} | {t:'rep', cat, parts} | {t:'bool', cat, parts}
function renderParts(row, parts, cat, counter) {
  counter = counter || { n: 0 };
  for (const part of parts) {
    if (typeof part === 'string') { txt(part, { style: 'Block/Label', color: 'color/block/text', parent: row, name: 'Label' }); continue; }
    if (part.t === 'drop') {
      const f = box({ name: 'Field (dropdown)', dir: 'H', gap: 4, pad: [0, 6, 0, 8], h: 24, cross: 'center', radius: 6, fill: '#000000', fillOpacity: 0.22, parent: row });
      f.strokes = [solid('#FFFFFF', 0.22)]; f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
      txt(part.v, { style: 'Block/Field', color: 'color/block/text', parent: f, name: 'F' + (++counter.n) });
      iconSlot(f, 'chevron-down', 'color/icon/strong', 12, 'Chevron');
    } else if (part.t === 'num' || part.t === 'text') {
      const f = box({ name: part.t === 'num' ? 'Field (number)' : 'Field (text)', dir: 'H', pad: [0, 10, 0, 10], h: 24, cross: 'center', align: 'center', radius: 999, fill: '#FFFFFF', parent: row });
      txt(part.v, { style: 'Block/Field', color: 'color/text/on-accent', parent: f, name: 'F' + (++counter.n) });
      if (part.t === 'num') { try { f.minWidth = 32; } catch (e) { /* older API */ } }
    } else if (part.t === 'color') {
      const f = box({ name: 'Field (colour)', w: 24, h: 24, radius: 999, fill: part.v, parent: row });
      f.strokes = [solid('#FFFFFF', 1)]; f.strokeWeight = 2; f.strokeAlign = 'INSIDE';
    } else if (part.t === 'icon') {
      iconSlot(row, part.v, 'color/icon/strong', 18, 'Block icon');
    } else if (part.t === 'rep') {
      const r = box({ name: 'Reporter ' + part.cat, dir: 'H', gap: 6, pad: [0, 10, 0, 10], h: 28, cross: 'center', radius: 999, fill: catVar(part.cat), parent: row });
      r.strokes = [solid('#000000', 0.25)]; r.strokeWeight = 1; r.strokeAlign = 'INSIDE';
      renderParts(r, part.parts, part.cat, counter);
    } else if (part.t === 'bool') {
      const hex = boolShape(part.cat, part.parts, counter);
      row.appendChild(hex);
    } else if (part.t === 'slot') {
      const s = box({ name: 'Empty boolean slot', w: 40, h: 24, parent: row });
      const v = shapeVector(hexPath(40, 24), catVar(cat), 'Slot');
      v.fills = [solid('#000000', 0.25)]; v.strokes = [];
      s.appendChild(v);
    }
  }
}
function hexPath(w, h) { const k = h / 2; return 'M ' + k + ' 0 L ' + rnd(w - k) + ' 0 L ' + w + ' ' + k + ' L ' + rnd(w - k) + ' ' + h + ' L ' + k + ' ' + h + ' L 0 ' + k + ' Z'; }
function boolShape(cat, parts, counter) {
  const row = box({ name: 'Content', dir: 'H', gap: 6, pad: [0, 16, 0, 16], h: 32, cross: 'center' });
  renderParts(row, parts, cat, counter);
  const w = Math.ceil(row.width), h = Math.max(32, Math.ceil(row.height));
  const holder = figma.createFrame();
  holder.name = 'Boolean ' + cat;
  holder.fills = []; holder.clipsContent = false;
  holder.resize(w, h);
  holder.appendChild(shapeVector(hexPath(w, h), catVar(cat)));
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
// statement / hat / reporter / boolean block as a plain frame
function makeBlock(cat, parts, o = {}) {
  const holder = figma.createFrame();
  holder.name = o.name || 'Block';
  holder.fills = []; holder.clipsContent = false;
  if (o.kind === 'reporter' || o.kind === 'boolean') {
    const part = o.kind === 'reporter' ? { t: 'rep', cat, parts } : { t: 'bool', cat, parts };
    const row = box({ name: 'Content', dir: 'H', parent: holder });
    renderParts(row, [part], cat);
    const inner = row.children[0];
    if (o.kind === 'reporter') { inner.resize(inner.width, 32); inner.layoutSizingHorizontal = 'HUG'; }
    holder.resize(Math.ceil(row.width), Math.ceil(row.height));
    return holder;
  }
  const row = contentRow(parts, cat, o.minH || 40);
  const w = Math.max(o.minW || 0, Math.ceil(row.width));
  const { d, H, top } = pathStatement(w, row.height, o);
  holder.appendChild(shapeVector(d, catVar(cat), 'Shape', o.ghost));
  holder.appendChild(row);
  row.x = 0; row.y = top;
  holder.resize(w, H + (o.bottom === 'flat' ? 0 : BK.ND));
  if (o.ghost) row.opacity = 0;
  return holder;
}
// stacking pitch per node id (Figma nodes are not extensible, so keep it outside)
const PITCH = new Map();
function pitchOf(n) { return PITCH.has(n.id) ? PITCH.get(n.id) : (n.height - BK.ND); }
// C-block. arms: [parts, parts(else)..., bottomParts]; mouths: [[nodes], [nodes]]
function makeCBlock(cat, arms, mouths, o = {}) {
  const { IW, ND } = BK;
  const holder = figma.createFrame();
  holder.name = o.name || 'C-block';
  holder.fills = []; holder.clipsContent = false;
  const rows = arms.map((parts, i) => parts && parts.length ? contentRow(parts, cat, i === 0 ? 40 : 32) : null);
  const w = Math.max(o.minW || 160, ...rows.filter(Boolean).map(r => Math.ceil(r.width)));
  const secs = [];
  arms.forEach((parts, i) => {
    const isLast = i === arms.length - 1;
    const r = rows[i];
    secs.push(r ? r.height : (isLast ? 24 : 32));
    if (!isLast) {
      const kids = mouths[i] || [];
      const mh = kids.length ? kids.reduce((s, k) => s + pitchOf(k), 0) : 24;
      secs.push(mh);
    }
  });
  const { d, H, top, marks } = pathC(w, secs, o);
  holder.appendChild(shapeVector(d, catVar(cat)));
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
// [category, name, parts, kind, generates]
const D = (v) => ({ t: 'drop', v }), N = (v) => ({ t: 'num', v }), T = (v) => ({ t: 'text', v });
const BLOCK_LIBRARY = [
  ['Output', 'Set built-in LED', ['set built-in LED to', D('HIGH')], 'statement', 'digitalWrite(LED_BUILTIN, HIGH);'],
  ['Output', 'Set digital pin', ['set pin', D('13'), 'to', D('HIGH')], 'statement', 'digitalWrite(13, HIGH);'],
  ['Output', 'Write PWM', ['write PWM pin', D('5'), 'to', N('128')], 'statement', 'analogWrite(5, 128);'],
  ['Output', 'Play tone', ['tone pin', D('8'), D('C4'), 'for', N('0.5'), 's'], 'statement', 'tone(8, 262, 500);'],
  ['Output', 'Stop tone', ['stop tone on pin', D('8')], 'statement', 'noTone(8);'],
  ['Output', 'Set RGB LED', ['set RGB LED to', { t: 'color', v: '#FF5D6C' }], 'statement', 'rgbLed.setPixelColor(0, 255, 93, 108); rgbLed.show();'],
  ['Input', 'Read digital pin', ['read digital pin', D('2')], 'reporter', 'digitalRead(2)'],
  ['Input', 'Read analog pin', ['read analog pin', D('A0')], 'reporter', 'analogRead(A0)'],
  ['Input', 'Button pressed', ['button', D('USER'), 'is pressed'], 'boolean', 'digitalRead(USER_BUTTON) == LOW'],
  ['Control', 'Wait', ['wait', N('1'), D('secs')], 'statement', 'delay(1000);'],
  ['Control', 'On start', ['on start'], 'hatC', 'void setup() { … }'],
  ['Control', 'Forever', ['forever'], 'hatC', 'void loop() { … }'],
  ['Control', 'Repeat', ['repeat', N('5'), 'times'], 'c', 'for (int i = 0; i < 5; i++) { … }'],
  ['Control', 'If', ['if', { t: 'slot' }, 'then'], 'c', 'if (condition) { … }'],
  ['Control', 'If else', ['if', { t: 'slot' }, 'then'], 'cElse', 'if (condition) { … } else { … }'],
  ['Control', 'While', ['while', { t: 'slot' }], 'c', 'while (condition) { … }'],
  ['Math', 'Arithmetic', [N('0'), D('+'), N('0')], 'reporter', '(a + b)'],
  ['Math', 'Compare', [N('0'), D('<'), N('20')], 'boolean', '(a < b)'],
  ['Math', 'And', [{ t: 'slot' }, 'and', { t: 'slot' }], 'boolean', '(a && b)'],
  ['Math', 'Not', ['not', { t: 'slot' }], 'boolean', '!(a)'],
  ['Variables', 'Set variable', ['set', D('distance'), 'to', N('0')], 'statement', 'distance = 0;'],
  ['Variables', 'Change variable', ['change', D('count'), 'by', N('1')], 'statement', 'count += 1;'],
  ['Variables', 'Variable', ['distance'], 'reporter', 'distance'],
  ['Robotics', 'Drive', [{ t: 'icon', v: 'bot' }, 'drive', D('forward'), 'at', N('60'), '%'], 'statement', 'robot.drive(FORWARD, 60);'],
  ['Robotics', 'Turn', [{ t: 'icon', v: 'bot' }, 'turn', D('left'), 'for', N('0.5'), 's'], 'statement', 'robot.turn(LEFT, 500);'],
  ['Robotics', 'Set motor speed', [{ t: 'icon', v: 'bot' }, 'motor', D('A'), 'speed', N('50'), '%'], 'statement', 'robot.setMotor(MOTOR_A, 50);'],
  ['Robotics', 'Stop motors', [{ t: 'icon', v: 'bot' }, 'stop motors'], 'statement', 'robot.stop();'],
  ['Robotics', 'Set servo', [{ t: 'icon', v: 'bot' }, 'servo', D('1'), 'to', N('90'), '°'], 'statement', 'servo1.write(90);'],
  ['Sensors', 'Ultrasonic distance', ['distance', D('cm')], 'reporter', 'sonar.distanceCm()'],
  ['Sensors', 'Line sensor', ['line sensor', D('centre')], 'reporter', 'lineSensor.read(CENTRE)'],
  ['Sensors', 'Temperature', ['temperature', D('°C')], 'reporter', 'imu.temperatureC()'],
  ['Sensors', 'IMU angle', ['IMU', D('pitch'), 'angle'], 'reporter', 'imu.pitch()'],
  ['Communication', 'Print to serial', ['print', T('RoboCore V2 ready'), D('new line')], 'statement', 'Serial.println("RoboCore V2 ready");'],
  ['Communication', 'Serial begin', ['start serial at', D('115200'), 'baud'], 'statement', 'Serial.begin(115200);'],
  ['Communication', 'Serial read line', ['serial read line'], 'reporter', 'Serial.readStringUntil(\'\\n\')'],
  ['Communication', 'Serial available', ['serial data available'], 'boolean', 'Serial.available() > 0'],
];
const BLOCK = {}; // components by "Category/Name"

function buildBlockLibrary(parent) {
  const wrap = box({ name: 'Block library', dir: 'H', gap: 24, pad: 24, cross: 'start', parent, fill: 'color/bg/canvas', radius: 12, stroke: 'color/border/subtle' });
  const cols = {};
  for (const [cat, col] of BLOCK_CATS) {
    const c = box({ name: 'Category ' + cat, dir: 'V', gap: 14, cross: 'start', parent: wrap });
    inst('Block Category', { Category: cat, State: 'Active' }, c);
    cols[cat] = c;
  }
  for (const [cat, name, parts, kind, gen] of BLOCK_LIBRARY) {
    let node;
    if (kind === 'statement') node = makeBlock(cat, parts, {});
    else if (kind === 'reporter') node = makeBlock(cat, parts, { kind: 'reporter' });
    else if (kind === 'boolean') node = makeBlock(cat, parts, { kind: 'boolean' });
    else if (kind === 'hatC') node = makeCBlock(cat, [parts, []], [[]], { top: 'hat', bottom: 'flat', minW: 150 });
    else if (kind === 'c') node = makeCBlock(cat, [parts, []], [[]], { minW: 150 });
    else if (kind === 'cElse') node = makeCBlock(cat, [parts, ['else'], []], [[], []], { minW: 150 });
    const c = figma.createComponentFromNode(node);
    c.name = 'Block/' + cat + '/' + name;
    c.description = cat + ' block (' + kind + '). Generates: ' + gen;
    c.clipsContent = false;
    cols[cat].appendChild(c);
    BLOCK[cat + '/' + name] = c;
  }
  REPORT.counts.blocks = Object.keys(BLOCK).length;
  return wrap;
}
// instance of a library block with field overrides { F1: 'LOW' }
function blk(key, fields, parent) {
  const c = BLOCK[key];
  if (!c) throw new Error('Unknown block ' + key);
  const i = c.createInstance();
  if (parent) parent.appendChild(i);
  if (fields) for (const [k, v] of Object.entries(fields)) setText(i, k, v);
  return i;
}

// ---- the sample "Blink" program -------------------------------------------
// returns a frame containing the on start + forever stacks
function buildBlinkProgram(o = {}) {
  const prog = figma.createFrame();
  prog.name = 'Program — Blink';
  prog.fills = []; prog.clipsContent = false;
  const begin = blk('Communication/Serial begin');
  const print = blk('Communication/Print to serial');
  const onStart = makeCBlock('Control', [['on start'], []], [[begin, print]], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — on start' });
  prog.appendChild(onStart); onStart.x = 0; onStart.y = 0;
  const kids = [blk('Output/Set built-in LED', { F1: 'HIGH' }), blk('Control/Wait', { F1: '1' })];
  if (o.insertion) {
    const ghost = makeBlock('Output', ['tone pin', D('8'), D('C4'), 'for', N('0.5'), 's'], { ghost: true, name: 'Insertion marker' });
    kids.push(ghost);
  }
  kids.push(blk('Output/Set built-in LED', { F1: 'LOW' }), blk('Control/Wait', { F1: '1' }));
  const forever = makeCBlock('Control', [['forever'], []], [kids], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — forever' });
  prog.appendChild(forever); forever.x = 0; forever.y = onStart.height + 40;
  if (o.selected) {
    // selection outline around the first LED block (keyboard focus / selected block)
    const first = kids[0];
    const r = figma.createRectangle(); r.name = 'Selection'; r.fills = [];
    r.strokes = [paint('color/accent/default')]; r.strokeWeight = 2; r.strokeAlign = 'OUTSIDE'; r.cornerRadius = 8; r.dashPattern = [];
    forever.appendChild(r); r.resize(first.width + 6, first.height - BK.ND + 6); r.x = first.x - 3; r.y = first.y - 3;
  }
  prog.resize(Math.max(onStart.width, forever.width), forever.y + forever.height);
  return prog;
}
// ============================================================================
// Composite components: Sidebar, Top Bar, Status Bar, Board Info, cards,
// Board Menu, dialogs + code editor / console renderers
// ============================================================================

const NAV = [
  ['WORKSPACE', [['Home', 'home'], ['Projects', 'folder'], ['Libraries', 'library'], ['Examples', 'lightbulb']]],
  ['HARDWARE', [['Board Setup', 'cpu'], ['Serial Monitor', 'terminal']]],
];

// ---------------------------------------------------------------- Project pill (sidebar)
function buildProjectPill(parent) {
  const comps = [];
  for (const state of ['Default', 'Active']) for (const collapsed of ['False', 'True']) {
    const c = comp('State=' + state + ', Collapsed=' + collapsed);
    const on = state === 'Active';
    if (collapsed === 'False') al(c, { gap: 10, pad: [8, 10, 8, 8], w: 192, cross: 'center', radius: 10, fill: on ? 'color/bg/selected' : 'color/bg/panel', stroke: on ? 'color/accent/muted' : 'color/border/subtle' });
    else al(c, { w: 40, h: 40, align: 'center', cross: 'center', radius: 10, fill: on ? 'color/bg/selected' : 'color/bg/panel', stroke: on ? 'color/accent/muted' : 'color/border/subtle' });
    if (collapsed === 'False') c.layoutSizingVertical = 'HUG';
    const tile = box({ name: 'Mode tile', dir: 'H', w: 28, h: 28, align: 'center', cross: 'center', radius: 6, fill: on ? 'color/accent/subtle' : 'color/bg/raised', parent: c });
    iconSlot(tile, 'blocks', on ? 'color/icon/active' : 'color/icon/default', 16, 'Mode icon');
    if (collapsed === 'False') {
      const col = box({ name: 'Text', dir: 'V', gap: 0, parent: c, grow: true });
      txt('OPEN PROJECT', { style: 'Caption/Overline', color: on ? 'color/accent/default' : 'color/text/tertiary', parent: col, name: 'Overline' });
      txt('Blink LED', { style: 'Label/Strong', parent: col, name: 'Project', truncate: true });
      iconSlot(c, 'chevron-right', 'color/icon/muted', 16, 'Chevron');
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Sidebar Project', parent, 4, 'Shortcut back to the open project. Active while the editor is showing.');
  propText(set, 'Project', 'Project', 'Blink LED');
  CMP['Sidebar Project'] = set;
}

// ---------------------------------------------------------------- Sidebar
function buildSidebar(parent) {
  const comps = [];
  for (const collapsed of ['False', 'True']) {
    const exp = collapsed === 'False';
    const c = comp('Collapsed=' + collapsed);
    al(c, { dir: 'V', gap: 4, pad: [12, 12, 12, 12], w: exp ? 216 : 64, h: 916, cross: exp ? 'start' : 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 1;
    inst('Sidebar Project', { State: 'Default', Collapsed: collapsed }, c, { name: 'Open project' });
    for (const [group, items] of NAV) {
      spacer(c, 12);
      if (exp) { const g = box({ name: 'Group ' + group, dir: 'H', pad: [0, 12, 4, 12], parent: c }); txt(group, { style: 'Caption/Overline', color: 'color/text/tertiary', parent: g, name: 'Group label' }); }
      else divider(c, 'H', 24, 'color/border/subtle');
      for (const [label, ic] of items) {
        const n = inst('Nav Item', { State: 'Default', Collapsed: collapsed }, c, { name: 'Nav/' + label });
        if (exp) setProp(n, 'Label', label);
        setProp(n, 'Icon', ICON[ic].id);
        if (label === 'Serial Monitor' && exp) setProp(n, 'Show indicator', true);
      }
    }
    spacer(c, 1, true);
    const s = inst('Nav Item', { State: 'Default', Collapsed: collapsed }, c, { name: 'Nav/Settings' });
    if (exp) setProp(s, 'Label', 'Settings');
    setProp(s, 'Icon', ICON['settings'].id);
    divider(c, 'H', exp ? 192 : 40, 'color/border/subtle');
    const foot = box({ name: 'Footer', dir: exp ? 'H' : 'V', gap: 8, pad: [8, 4, 0, 8], cross: 'center', parent: c });
    if (exp) foot.layoutSizingHorizontal = 'FILL';
    if (exp) {
      const tag = box({ name: 'Tagline', dir: 'V', gap: 2, parent: foot, grow: true });
      const t = txt('Build. Code. Create.', { style: 'Label/Strong', color: 'color/text/primary', parent: tag, name: 'Tagline text' });
      t.setRangeFills(0, 6, [paint('color/brand/default')]);
      txt('RoboCore IDE · v0.1', { style: 'Caption/Default', color: 'color/text/tertiary', parent: tag, name: 'Version' });
    }
    const cb = inst('Icon Button', { Variant: 'Ghost', State: 'Default' }, foot, { name: 'Collapse sidebar' });
    setProp(cb, 'Icon', ICON[exp ? 'panel-left' : 'panel-right'].id);
    comps.push(c);
  }
  const set = makeSet(comps, 'Sidebar', parent, 2, 'Primary navigation. Expanded 216px / collapsed 64px (icons + tooltips). Collapse with the footer button or ⌘B; the editor reclaims the space.');
  CMP['Sidebar'] = set;
}
function setNavActive(sidebar, label) {
  const n = sidebar.findOne(x => x.type === 'INSTANCE' && x.name === 'Nav/' + label);
  if (n) { try { n.setProperties({ State: 'Active' }); } catch (e) { warn('nav active ' + label + ': ' + e.message); } }
  else warn('nav item not found: ' + label);
}
function setProjectPill(sidebar, state, name) {
  const p = sidebar.findOne(x => x.type === 'INSTANCE' && x.name === 'Open project');
  if (!p) return;
  try { p.setProperties({ State: state }); } catch (e) { warn('pill ' + e.message); }
  if (name) setText(p, 'Project', name);
}

// ---------------------------------------------------------------- Top bar
function buildTopBar(parent) {
  const comps = [];
  for (const ctx of ['Editor', 'Browse']) {
    const c = comp('Context=' + ctx);
    al(c, { gap: 12, pad: [0, 16, 0, 16], w: 1440, h: 56, cross: 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1;
    const logo = CMP['Logo/Product Lockup'].createInstance(); logo.name = 'Logo'; c.appendChild(logo);
    divider(c, 'V', 24);
    if (ctx === 'Editor') {
      const ps = box({ name: 'Project switcher', dir: 'H', gap: 8, pad: [0, 8, 0, 8], h: 32, cross: 'center', radius: 8, parent: c });
      iconSlot(ps, 'blocks', 'color/icon/active', 16, 'Project mode icon');
      txt('Blink LED', { style: 'Label/Strong', parent: ps, name: 'Project name' });
      iconSlot(ps, 'chevron-down', 'color/icon/muted', 16, 'Project menu chevron');
      const sv = box({ name: 'Save state', dir: 'H', gap: 4, cross: 'center', parent: c });
      iconSlot(sv, 'check', 'color/icon/muted', 14, 'Save icon');
      txt('Saved', { style: 'Caption/Default', color: 'color/text/tertiary', parent: sv, name: 'Save label' });
    } else {
      inst('Search Field', null, c, { name: 'Search' });
    }
    spacer(c, 1, true);
    inst('Board Selector', { Status: 'Connected', State: 'Default' }, c, { name: 'Board selector' });
    divider(c, 'V', 24);
    if (ctx === 'Editor') {
      const acts = box({ name: 'Build actions', dir: 'H', gap: 8, cross: 'center', parent: c });
      inst('Toolbar Action', { Action: 'Verify', State: 'Default' }, acts, { name: 'Verify' });
      inst('Toolbar Action', { Action: 'Upload', State: 'Default' }, acts, { name: 'Upload' });
      inst('Toolbar Action', { Action: 'Stop', State: 'Disabled' }, acts, { name: 'Stop' });
    } else {
      const b = inst('Button', { Variant: 'Primary', State: 'Default' }, c, { name: 'New project' });
      setProp(b, 'Label', 'New project');
      setProp(b, 'Icon', ICON['plus'].id);
    }
    divider(c, 'V', 24);
    const util = box({ name: 'Utilities', dir: 'H', gap: 4, cross: 'center', parent: c });
    for (const [n, ic] of [['Theme', 'sun'], ['Help', 'help-circle'], ['Settings', 'settings']]) { const b = inst('Icon Button', { Variant: 'Ghost', State: 'Default' }, util, { name: n }); setProp(b, 'Icon', ICON[ic].id); }
    inst('Avatar', null, c, { name: 'Account' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Top Bar', parent, 1, 'Global header, 56px. Editor context: project switcher + save state, board selector, Verify / Upload / Stop. Browse context (Home, Projects…): search + New project.');
  CMP['Top Bar'] = set;
}

// ---------------------------------------------------------------- Status bar
function buildStatusBar(parent) {
  const c = comp('Status Bar', 'Bottom status line, 28px: operation state, editor info, board + port + baud. Text must describe the real state (Ready, Compiling…, Upload failed).');
  al(c, { gap: 16, pad: [0, 12, 0, 12], w: 1440, h: 28, cross: 'center', fill: 'color/bg/chrome', stroke: 'color/border/subtle' });
  c.strokeTopWeight = 1; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 0;
  const st = box({ name: 'State', dir: 'H', gap: 6, cross: 'center', parent: c });
  dot(st, 'color/status/success', 8, 'Status dot');
  txt('Ready', { style: 'Label/Small', color: 'color/text/secondary', parent: st, name: 'Status' });
  txt('Blocks · 7 blocks · auto-saved 14:02', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Detail' });
  spacer(c, 1, true);
  const bd = box({ name: 'Board info', dir: 'H', gap: 6, cross: 'center', parent: c });
  iconSlot(bd, 'usb', 'color/icon/muted', 14, 'Port icon');
  txt('RoboCore V2 on /dev/cu.usbmodem1101 · 115200 baud', { style: 'Caption/Default', color: 'color/text/tertiary', parent: bd, name: 'Board' });
  txt('Ln 12, Col 5', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Cursor' });
  txt('UTF-8', { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Encoding' });
  iconSlot(c, 'bell', 'color/icon/muted', 14, 'Notifications');
  CMP['Status Bar'] = c;
  parent.appendChild(c);
}
function setStatus(bar, o) {
  if (o.status) setText(bar, 'Status', o.status);
  if (o.detail !== undefined) setText(bar, 'Detail', o.detail);
  if (o.board) setText(bar, 'Board', o.board);
  if (o.cursor !== undefined) { const t = bar.findOne(n => n.name === 'Cursor'); if (t) { if (o.cursor) setText(bar, 'Cursor', o.cursor); else t.visible = false; } }
  if (o.dot) { const d = bar.findOne(n => n.name === 'Status dot'); if (d) refill(d, o.dot); }
}

// ---------------------------------------------------------------- Board info card
function buildBoardInfo(parent) {
  const comps = [];
  for (const status of ['Connected', 'Disconnected']) {
    const on = status === 'Connected';
    const c = comp('Status=' + status);
    al(c, { dir: 'V', gap: 0, w: 296, cross: 'start', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    c.layoutSizingVertical = 'HUG';
    const hd = box({ name: 'Header', dir: 'H', gap: 8, pad: [0, 12, 0, 14], h: 44, cross: 'center', parent: c, wSize: 'fill' });
    iconSlot(hd, 'cpu', 'color/icon/brand', 18, 'Board icon');
    txt('Board', { style: 'Heading/H3', parent: hd, name: 'Title', grow: true });
    inst('Connection Status', { Status: status }, hd, { name: 'Connection' });
    divider(c, 'H', 296);
    const rows = box({ name: 'Rows', dir: 'V', gap: 6, pad: [10, 14, 10, 14], parent: c, wSize: 'fill' });
    const data = on
      ? [['Board', 'RoboCore V2 (rev 2.0)', 'profile'], ['MCU', 'ESP32-S3 · 240 MHz dual-core', 'profile'], ['Memory', '8 MB flash · 2 MB PSRAM', 'profile'], ['Port', '/dev/cu.usbmodem1101', 'live'], ['Chip', 'ESP32-S3 rev v0.2', 'live']]
      : [['Board', 'RoboCore V2 (rev 2.0)', 'profile'], ['MCU', 'ESP32-S3 · 240 MHz dual-core', 'profile'], ['Memory', '8 MB flash · 2 MB PSRAM', 'profile'], ['Port', 'No port selected', 'none'], ['Chip', 'Connect to detect', 'none']];
    for (const [k, v, src] of data) {
      const r = box({ name: 'Row ' + k, dir: 'H', gap: 8, cross: 'center', parent: rows, wSize: 'fill' });
      txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 64 });
      txt(v, { style: src === 'live' ? 'Code/Small' : 'Body/Small', color: src === 'none' ? 'color/text/tertiary' : 'color/text/primary', parent: r, name: 'Value ' + k, grow: true, truncate: true });
      if (src === 'live') { const lv = box({ name: 'Live tag', dir: 'H', pad: [0, 6, 0, 6], h: 18, cross: 'center', radius: 999, fill: 'color/accent/subtle', parent: r }); txt('LIVE', { style: 'Caption/Overline', color: 'color/accent/default', parent: lv, name: 'Live' }); }
    }
    divider(c, 'H', 296);
    const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [8, 14, 10, 14], cross: 'center', parent: c, wSize: 'fill' });
    if (on) {
      txt('LIVE = read from the device', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ft, name: 'Legend', grow: true });
      txt('Board setup →', { style: 'Label/Default', color: 'color/text/link', parent: ft, name: 'Link' });
    } else {
      const b = inst('Button', { Variant: 'Secondary', State: 'Default' }, ft, { name: 'Connect' });
      setProp(b, 'Label', 'Connect board'); setProp(b, 'Icon', ICON['plug'].id);
      b.layoutSizingHorizontal = 'FILL';
    }
    comps.push(c);
  }
  const set = makeSet(comps, 'Board Info Card', parent, 2, 'Compact hardware summary. Profile values come from the board definition; LIVE values are read from the connected device. Never show live values when disconnected.');
  CMP['Board Info Card'] = set;
}

// ---------------------------------------------------------------- thumbnails
function blocksThumb(parent, w, h) {
  const t = box({ name: 'Thumbnail', w, h, fill: 'color/bg/canvas', parent, clip: true });
  const g = gridVector(w, h, 16); t.appendChild(g);
  const stacks = [[['control', 70], ['communication', 88], ['output', 100]], [['control', 64], ['output', 96], ['control', 60], ['output', 92]]];
  let x = 18;
  stacks.forEach((stack, si) => {
    let y = 42 + si * 6;
    stack.forEach(([cat, bw], i) => {
      const r = rect({ name: 'Mini block', w: bw * (w / 268), h: i === 0 ? 14 : 11, radius: i === 0 ? [7, 7, 3, 3] : 3, fill: 'color/block/' + cat, parent: t });
      r.x = x + (i === 0 ? 0 : 8); r.y = y; y += (i === 0 ? 17 : 14);
    });
    x += 122 * (w / 268);
  });
  return t;
}
function codeThumb(parent, w, h) {
  const t = box({ name: 'Thumbnail', w, h, fill: 'color/bg/editor', parent, clip: true });
  const lines = [['color/syntax/comment', 120], ['color/syntax/preprocessor', 90], [null, 0], ['color/syntax/type', 40, 'color/syntax/function', 46], ['color/syntax/function', 60, 'color/syntax/constant', 70], ['color/syntax/function', 70, 'color/syntax/number', 24], ['color/syntax/plain', 12]];
  lines.forEach((ln, i) => {
    let x = 16 + (i > 3 && i < 6 ? 14 : 0);
    for (let k = 0; k < ln.length; k += 2) {
      if (!ln[k]) continue;
      const r = rect({ name: 'Code line', w: ln[k + 1] * (w / 268), h: 5, radius: 2.5, fill: ln[k], parent: t, opacity: 0.85 });
      r.x = x; r.y = 42 + i * 10; x += ln[k + 1] * (w / 268) + 6;
    }
  });
  return t;
}
// Blockly-style grid of small crosses as one vector
function gridVector(w, h, step = 24, op = 0.07) {
  const parts = [];
  for (let x = step; x < w; x += step) for (let y = step; y < h; y += step) parts.push('M ' + (x - 2) + ' ' + y + ' L ' + (x + 2) + ' ' + y + ' M ' + x + ' ' + (y - 2) + ' L ' + x + ' ' + (y + 2));
  const v = figma.createVector();
  v.name = 'Grid';
  v.vectorPaths = [{ windingRule: 'NONZERO', data: parts.join(' ') || 'M 0 0 L 1 0' }];
  v.strokes = [solid('#A7B1C2', op * 3)];
  v.strokeWeight = 1;
  v.fills = [];
  v.locked = true;
  return v;
}

// ---------------------------------------------------------------- Project card
function buildProjectCard(parent) {
  const comps = [];
  for (const mode of ['Blocks', 'Code']) for (const state of ['Default', 'Hover']) {
    const c = comp('Mode=' + mode + ', State=' + state);
    al(c, { dir: 'V', gap: 0, w: 268, cross: 'start', radius: 12, fill: state === 'Hover' ? 'color/bg/raised' : 'color/bg/panel', stroke: state === 'Hover' ? 'color/border/strong' : 'color/border/subtle' });
    c.layoutSizingVertical = 'HUG'; c.clipsContent = true;
    if (state === 'Hover') LINKS.push([c, 'effect', 'Elevation/1 Raised']);
    const th = mode === 'Blocks' ? blocksThumb(c, 268, 120) : codeThumb(c, 268, 120);
    th.layoutSizingHorizontal = 'FILL';
    const mb = box({ name: 'Mode badge', dir: 'H', gap: 4, pad: [0, 8, 0, 6], h: 22, cross: 'center', radius: 999, fill: 'color/bg/chrome', parent: th, abs: true });
    mb.x = 10; mb.y = 10;
    iconSlot(mb, mode === 'Blocks' ? 'blocks' : 'code', mode === 'Blocks' ? 'color/icon/active' : 'color/icon/brand', 14, 'Mode icon');
    txt(mode, { style: 'Label/Small', color: 'color/text/secondary', parent: mb, name: 'Mode' });
    const body = box({ name: 'Body', dir: 'V', gap: 6, pad: [12, 14, 14, 14], parent: c, wSize: 'fill' });
    const tr = box({ name: 'Title row', dir: 'H', gap: 8, cross: 'center', parent: body, wSize: 'fill' });
    txt(mode === 'Blocks' ? 'Blink LED' : 'Obstacle avoider', { style: 'Heading/H3', parent: tr, name: 'Name', grow: true, truncate: true });
    iconSlot(tr, 'more', 'color/icon/muted', 16, 'More');
    txt(mode === 'Blocks' ? 'Turn the built-in LED on and off every second.' : 'Drive forward and turn away when the sonar sees a wall.', { style: 'Body/Small', color: 'color/text/secondary', parent: body, name: 'Description', fill: true, truncate: true, maxLines: 2 });
    const meta = box({ name: 'Meta', dir: 'H', gap: 8, pad: [6, 0, 0, 0], cross: 'center', parent: body, wSize: 'fill' });
    const b = inst('Badge', { Tone: 'Neutral' }, meta, { name: 'Board badge' }); setProp(b, 'Label', 'RoboCore V2'); setProp(b, 'Show dot', false);
    spacer(meta, 1, true);
    txt('Edited 2h ago', { style: 'Caption/Default', color: 'color/text/tertiary', parent: meta, name: 'Edited' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Project Card', parent, 4, 'Project tile for Home and Projects. Thumbnail previews the mode (blocks or code). Whole card is the click target; ⋯ opens rename / duplicate / delete.');
  CMP['Project Card'] = set;
}

// ---------------------------------------------------------------- Example card (variant per block category colour)
function buildExampleCard(parent) {
  const comps = [];
  for (const [cat, col, ic] of BLOCK_CATS) {
    const c = comp('Category=' + cat);
    al(c, { dir: 'V', gap: 0, w: 268, cross: 'start', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    c.layoutSizingVertical = 'HUG'; c.clipsContent = true;
    const th = box({ name: 'Cover', dir: 'H', gap: 0, pad: 16, h: 96, cross: 'end', align: 'between', fill: col + '-subtle', parent: c, wSize: 'fill' });
    const tile = box({ name: 'Icon tile', dir: 'H', w: 44, h: 44, align: 'center', cross: 'center', radius: 10, fill: col, parent: th });
    iconSlot(tile, ic, 'color/icon/strong', 22, 'Cover icon');
    const lv = inst('Badge', { Tone: 'Success' }, th, { name: 'Level' }); setText(lv, 'Label', 'Beginner');
    const body = box({ name: 'Body', dir: 'V', gap: 6, pad: [12, 14, 14, 14], parent: c, wSize: 'fill' });
    txt('Blink an LED', { style: 'Heading/H3', parent: body, name: 'Title', fill: true, truncate: true });
    txt('Your first program: switch the built-in LED on and off with a delay.', { style: 'Body/Small', color: 'color/text/secondary', parent: body, name: 'Description', fill: true, truncate: true, maxLines: 2 });
    const meta = box({ name: 'Meta', dir: 'H', gap: 6, pad: [6, 0, 0, 0], cross: 'center', parent: body, wSize: 'fill' });
    for (const [m, mic] of [['Blocks', 'blocks'], ['Code', 'code']]) {
      const t = box({ name: 'Mode ' + m, dir: 'H', gap: 4, cross: 'center', parent: meta });
      iconSlot(t, mic, 'color/icon/muted', 14, 'Icon');
      txt(m, { style: 'Caption/Default', color: 'color/text/tertiary', parent: t, name: 'Mode ' + m + ' label' });
    }
    spacer(meta, 1, true);
    txt('V2 · Uno · ESP32', { style: 'Caption/Default', color: 'color/text/tertiary', parent: meta, name: 'Boards' });
    comps.push(c);
  }
  const set = makeSet(comps, 'Example Card', parent, 4, 'Example/tutorial tile, one colour variant per block category. Level badge, supported modes, compatible boards. "Open" creates a copy in Projects.');
  CMP['Example Card'] = set;
}
const catOf = (colorVar) => (BLOCK_CATS.find(c => c[1] === colorVar) || BLOCK_CATS[0])[0];
function exampleCard(parent, o) {
  const i = inst('Example Card', { Category: catOf(o.color) }, parent, { text: { Title: o.title, Description: o.desc, Boards: o.boards || 'V2 · Uno · ESP32' } });
  const ic = i.findOne(n => n.name === 'Cover icon' && n.type === 'INSTANCE');
  if (ic && o.icon) { try { ic.swapComponent(ICON[o.icon]); } catch (e) { warn(e.message); } tint(ic, 'color/icon/strong'); }
  const lv = i.findOne(n => n.name === 'Level' && n.type === 'INSTANCE');
  if (lv) { try { lv.setProperties({ Tone: o.level === 'Advanced' ? 'Warning' : (o.level === 'Intermediate' ? 'Info' : 'Success') }); } catch (e) { warn(e.message); } setText(lv, 'Label', o.level); }
  return i;
}

// ---------------------------------------------------------------- Template tile + quick action (colour variants)
function buildTiles(parent) {
  const tc = [];
  for (const [cat, col, ic] of BLOCK_CATS) {
    const t = comp('Category=' + cat);
    al(t, { gap: 12, pad: [12, 14, 12, 12], w: 240, cross: 'center', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    t.layoutSizingVertical = 'HUG';
    const tile = box({ name: 'Icon tile', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 10, fill: col + '-subtle', parent: t });
    iconSlot(tile, ic, col, 20, 'Icon');
    const colm = box({ name: 'Text', dir: 'V', gap: 2, parent: t, grow: true });
    txt('Line follower', { style: 'Label/Strong', parent: colm, name: 'Title', truncate: true });
    txt('Follow a black line with 3 IR sensors', { style: 'Caption/Default', color: 'color/text/tertiary', parent: colm, name: 'Description', fill: true, truncate: true });
    tc.push(t);
  }
  const tset = makeSet(tc, 'Template Tile', parent, 4, 'Starter template on Home. Creates a new project pre-filled with blocks. Colour follows the main block category of the template.');
  CMP['Template Tile'] = tset;

  const TONES = { Accent: ['color/accent/subtle', 'color/icon/active', 'blocks'], Brand: ['color/brand/subtle', 'color/icon/brand', 'code'], Neutral: ['color/bg/raised', 'color/icon/default', 'folder-open'] };
  const qc = [];
  for (const [tone, [bg, icc, ic]] of Object.entries(TONES)) {
    const q = comp('Tone=' + tone);
    al(q, { dir: 'V', gap: 12, pad: 16, w: 232, cross: 'start', radius: 12, fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    q.layoutSizingVertical = 'HUG';
    const qt = box({ name: 'Icon tile', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 10, fill: bg, parent: q });
    iconSlot(qt, ic, icc, 20, 'Icon');
    const qcol = box({ name: 'Text', dir: 'V', gap: 2, parent: q, wSize: 'fill' });
    txt('New blocks project', { style: 'Heading/H3', parent: qcol, name: 'Title' });
    txt('Drag-and-drop programming for beginners', { style: 'Body/Small', color: 'color/text/secondary', parent: qcol, name: 'Description', fill: true });
    qc.push(q);
  }
  const qset = makeSet(qc, 'Quick Action', parent, 3, 'Large entry point on Home. Accent = primary path (blocks), Brand = code, Neutral = utilities.');
  CMP['Quick Action'] = qset;
}
// o: { title, desc, icon, color (template category var) | tone (quick action), iconColor }
function tileInst(key, parent, o) {
  const props = key === 'Quick Action' ? { Tone: o.tone || 'Neutral' } : { Category: catOf(o.color) };
  const i = inst(key, props, parent, { text: { Title: o.title, Description: o.desc } });
  if (o.icon) {
    const ic = i.findOne(n => n.name === 'Icon' && n.type === 'INSTANCE');
    if (ic) { try { ic.swapComponent(ICON[o.icon]); } catch (e) { warn(e.message); } }
    const col = key === 'Quick Action' ? { Accent: 'color/icon/active', Brand: 'color/icon/brand', Neutral: 'color/icon/default' }[o.tone || 'Neutral'] : o.color;
    if (ic) tint(ic, col);
  }
  return i;
}

// ---------------------------------------------------------------- Dialogs
function dialogShell(name, title, desc, o = {}) {
  const c = comp(name, o.descr);
  al(c, { dir: 'V', gap: 0, w: o.w || 480, cross: 'start', radius: 16, fill: 'color/bg/panel', stroke: 'color/border/default', effect: 'Elevation/3 Modal' });
  c.layoutSizingVertical = 'HUG';
  const hd = box({ name: 'Header', dir: 'H', gap: 12, pad: [20, 16, 4, 24], cross: 'start', parent: c, wSize: 'fill' });
  if (o.danger) { const ic = box({ name: 'Danger icon', dir: 'H', w: 36, h: 36, align: 'center', cross: 'center', radius: 999, fill: 'color/status/error-subtle', parent: hd }); iconSlot(ic, 'alert-triangle', 'color/status/error', 18, 'Icon'); }
  const tc = box({ name: 'Titles', dir: 'V', gap: 6, parent: hd, grow: true });
  tc.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Heading/H2', parent: tc, name: 'Title', fill: true });
  if (desc) txt(desc, { style: 'Body/Small', color: 'color/text/secondary', parent: tc, name: 'Description', fill: true });
  const x = inst('Icon Button', { Variant: 'Ghost', State: 'Default' }, hd, { name: 'Close' }); setProp(x, 'Icon', ICON['x'].id);
  const body = box({ name: 'Body', dir: 'V', gap: 16, pad: [16, 24, 24, 24], parent: c, wSize: 'fill' });
  const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [14, 24, 16, 24], cross: 'center', align: 'end', parent: c, wSize: 'fill', fill: 'color/bg/chrome', stroke: 'color/border/subtle', sides: { t: 1 } });
  return { c, body, ft };
}
function footerButtons(ft, buttons) {
  for (const [variant, label, icon, grow] of buttons) {
    if (variant === 'spacer') { spacer(ft, 1, true); continue; }
    const b = inst('Button', { Variant: variant, State: 'Default' }, ft, { name: label });
    setProp(b, 'Label', label);
    if (icon) setProp(b, 'Icon', ICON[icon].id); else setProp(b, 'Show icon', false);
  }
}
function field(parent, label, value, o = {}) {
  const i = inst('Input Field', { State: o.state || 'Default' }, parent, { name: 'Field ' + label });
  setProp(i, 'Label', label); setProp(i, 'Value', value);
  if (o.helper) setProp(i, 'Helper', o.helper); else setProp(i, 'Show helper', false);
  i.layoutSizingHorizontal = 'FILL';
  if (value && o.state !== 'Error') { const v = i.findOne(n => n.name === 'Value'); if (v) v.fills = [paint('color/text/primary')]; }
  return i;
}
function labeledSelect(parent, label, value, o = {}) {
  const w = box({ name: 'Select ' + label, dir: 'V', gap: 6, parent, wSize: o.fill === false ? undefined : 'fill' });
  txt(label, { style: 'Label/Default', color: 'color/text/secondary', parent: w, name: 'Label' });
  const s = inst('Select', { State: o.state || 'Default' }, w, { name: 'Select' });
  setProp(s, 'Value', value);
  s.layoutSizingHorizontal = 'FILL';
  s.resize(s.width, 36); s.layoutSizingHorizontal = 'FILL';
  return w;
}
function choiceCard(parent, title, desc, icon, selected) {
  const c = box({ name: 'Choice ' + title, dir: 'H', gap: 12, pad: 14, cross: 'start', radius: 12, fill: selected ? 'color/bg/selected' : 'color/bg/input', stroke: selected ? 'color/border/focus' : 'color/border/default', parent, grow: true });
  c.layoutSizingHorizontal = 'FILL';
  const t = box({ name: 'Icon tile', dir: 'H', w: 36, h: 36, align: 'center', cross: 'center', radius: 8, fill: selected ? 'color/accent/subtle' : 'color/bg/raised', parent: c });
  iconSlot(t, icon, selected ? 'color/icon/active' : 'color/icon/default', 18, 'Icon');
  const col = box({ name: 'Text', dir: 'V', gap: 2, parent: c, grow: true });
  col.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Label/Strong', parent: col, name: 'Title' });
  txt(desc, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true });
  inst('Radio', { Selected: selected ? 'True' : 'False' }, c, { name: 'Radio' });
  return c;
}
function settingRow(parent, title, desc, control) {
  const r = box({ name: 'Setting ' + title, dir: 'H', gap: 16, pad: [12, 0, 12, 0], cross: 'center', parent, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  const col = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true });
  col.layoutSizingHorizontal = 'FILL';
  txt(title, { style: 'Body/Medium', parent: col, name: 'Title' });
  if (desc) txt(desc, { style: 'Body/Small', color: 'color/text/tertiary', parent: col, name: 'Description', fill: true });
  control(r);
  return r;
}

function buildDialogs(parent) {
  // New project
  {
    const { c, body, ft } = dialogShell('Dialog/New Project', 'New project', 'Choose how you want to program. You can switch modes later.', { w: 520, descr: 'Create-project dialog: name, programming mode, board, template.' });
    field(body, 'Project name', 'Obstacle avoider');
    txt('Start with', { style: 'Label/Default', color: 'color/text/secondary', parent: body, name: 'Mode label' });
    const ch = box({ name: 'Mode choice', dir: 'H', gap: 12, parent: body, wSize: 'fill' });
    choiceCard(ch, 'Blocks', 'Drag-and-drop. Generates C++ you can read.', 'blocks', true);
    choiceCard(ch, 'Code', 'Arduino C++ with autocomplete.', 'code', false);
    const row = box({ name: 'Selects', dir: 'H', gap: 12, parent: body, wSize: 'fill' });
    labeledSelect(row, 'Board', 'RoboCore V2 (ESP32-S3)');
    labeledSelect(row, 'Template', 'Empty project');
    footerButtons(ft, [['Ghost', 'Cancel'], ['Primary', 'Create project', 'plus']]);
    CMP['Dialog/New Project'] = c; parent.appendChild(c);
  }
  // Clear workspace
  {
    const { c, body, ft } = dialogShell('Dialog/Clear Workspace', 'Clear the workspace?', 'This removes all 7 blocks from “Blink LED”. You can undo this with ⌘Z until you close the project.', { danger: true, w: 440, descr: 'Destructive confirmation before clearing blocks.' });
    body.paddingTop = 0; body.paddingBottom = 8;
    footerButtons(ft, [['Ghost', 'Cancel'], ['Danger', 'Clear workspace', 'trash']]);
    CMP['Dialog/Clear Workspace'] = c; parent.appendChild(c);
  }
  // Project settings
  {
    const { c, body, ft } = dialogShell('Dialog/Project Settings', 'Project settings', 'Blink LED · created 10 Oct 2026', { w: 560, descr: 'Opened from the project switcher in the top bar.' });
    field(body, 'Name', 'Blink LED');
    field(body, 'Description', 'Turn the built-in LED on and off every second.', { helper: 'Shown on the project card.' });
    const row = box({ name: 'Selects', dir: 'H', gap: 12, parent: body, wSize: 'fill' });
    labeledSelect(row, 'Board', 'RoboCore V2 (ESP32-S3)');
    labeledSelect(row, 'Default mode', 'Blocks');
    settingRow(body, 'Auto-save', 'Save changes every 30 seconds and before upload.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
    settingRow(body, 'Show generated code', 'Keep the read-only C++ preview open in Blocks mode.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
    footerButtons(ft, [['Ghost', 'Delete project', 'trash'], ['spacer'], ['Secondary', 'Cancel'], ['Primary', 'Save changes', 'check']]);
    const del = ft.findOne(n => n.name === 'Delete project'); if (del) { const l = del.findOne(n => n.name === 'Label'); if (l) l.fills = [paint('color/status/error')]; tint(del, 'color/status/error'); }
    CMP['Dialog/Project Settings'] = c; parent.appendChild(c);
  }
  // Connect board (Web Serial)
  {
    const { c, body, ft } = dialogShell('Dialog/Connect Board', 'Connect your board', 'Plug RoboCore V2 in with a USB-C data cable, then choose its port. Your browser will ask for permission to use the serial port.', { w: 520, descr: 'Port picker. Real ports only — the list comes from the browser/agent; demo devices are labelled.' });
    const list = box({ name: 'Ports', dir: 'V', gap: 2, pad: 6, radius: 10, fill: 'color/bg/input', stroke: 'color/border/default', parent: body, wSize: 'fill' });
    const ports = [['/dev/cu.usbmodem1101', 'RoboCore V2 · ESP32-S3 native USB', 'Selected'], ['/dev/cu.usbserial-110', 'USB-serial (CH340) · unknown board', 'Default'], ['/dev/cu.Bluetooth-Incoming-Port', 'Bluetooth · not a board', 'Disabled']];
    for (const [p, d, st] of ports) {
      const r = box({ name: 'Port ' + p, dir: 'H', gap: 10, pad: [8, 10, 8, 10], cross: 'center', radius: 8, fill: st === 'Selected' ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
      iconSlot(r, st === 'Disabled' ? 'unplug' : 'usb', st === 'Selected' ? 'color/icon/active' : (st === 'Disabled' ? 'color/icon/disabled' : 'color/icon/default'), 18, 'Icon');
      const col = box({ name: 'Text', dir: 'V', gap: 0, parent: r, grow: true }); col.layoutSizingHorizontal = 'FILL';
      txt(p, { style: 'Code/Small', color: st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', parent: col, name: 'Port' });
      txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Detail' });
      if (st === 'Selected') iconSlot(r, 'check', 'color/icon/active', 16, 'Check');
    }
    const note = box({ name: 'Note', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'start', radius: 8, fill: 'color/status/info-subtle', parent: body, wSize: 'fill' });
    iconSlot(note, 'info', 'color/status/info', 16, 'Info');
    txt('Web Serial works in Chrome and Edge. In other browsers, install the RoboCore Agent to upload.', { style: 'Body/Small', color: 'color/text/secondary', parent: note, name: 'Note text', grow: true, fill: true });
    footerButtons(ft, [['Ghost', 'Refresh ports', 'refresh'], ['spacer'], ['Secondary', 'Cancel'], ['Primary', 'Connect', 'plug']]);
    CMP['Dialog/Connect Board'] = c; parent.appendChild(c);
  }
}

// ---------------------------------------------------------------- Board menu (popover)
const BOARDS = [
  ['RoboCore V2', 'ESP32-S3-WROOM-1 · 8 MB flash · 2 MB PSRAM', 'Recommended'],
  ['Arduino Uno R3', 'ATmega328P · 32 KB flash · 2 KB SRAM', ''],
  ['ESP32 DevKit V1', 'ESP32-WROOM-32 · 4 MB flash · Wi-Fi + BT', ''],
  ['NodeMCU-32S', 'ESP32 · 4 MB flash · Wi-Fi + BT', ''],
];
function buildBoardMenu(parent) {
  const c = comp('Board Menu', 'Popover from the Board Selector: pick a board profile and a port. Profiles come from the central board registry.');
  al(c, { dir: 'V', gap: 0, w: 380, cross: 'start', radius: 12, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover' });
  c.layoutSizingVertical = 'HUG';
  const hd = box({ name: 'Header', dir: 'V', gap: 10, pad: [12, 12, 8, 12], parent: c, wSize: 'fill' });
  const s = inst('Search Field', null, hd, { name: 'Search' }); s.layoutSizingHorizontal = 'FILL'; setProp(s, 'Placeholder', 'Search boards…');
  const sk = s.findOne(n => n.name === 'Shortcut'); if (sk) sk.visible = false;
  const list = box({ name: 'Boards', dir: 'V', gap: 2, pad: [0, 6, 6, 6], parent: c, wSize: 'fill' });
  txt('BOARD PROFILES', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: box({ name: 'Label', dir: 'H', pad: [6, 8, 4, 8], parent: list }), name: 'Group' });
  BOARDS.forEach(([n, d, tag], i) => {
    const sel = i === 0;
    const r = box({ name: 'Board ' + n, dir: 'H', gap: 10, pad: [8, 10, 8, 8], cross: 'center', radius: 8, fill: sel ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
    const t = box({ name: 'Chip tile', dir: 'H', w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: 'color/bg/panel', parent: r });
    iconSlot(t, 'cpu', sel ? 'color/icon/brand' : 'color/icon/muted', 18, 'Icon');
    const col = box({ name: 'Text', dir: 'V', gap: 0, parent: r, grow: true }); col.layoutSizingHorizontal = 'FILL';
    const tr = box({ name: 'Title row', dir: 'H', gap: 6, cross: 'center', parent: col });
    txt(n, { style: 'Label/Strong', parent: tr, name: 'Name' });
    if (tag) { const b = inst('Badge', { Tone: 'Brand' }, tr, { name: 'Tag' }); setProp(b, 'Label', tag); setProp(b, 'Show dot', false); }
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Specs', truncate: true, fill: true });
    if (sel) iconSlot(r, 'check', 'color/icon/active', 16, 'Check');
  });
  divider(c, 'H', 380);
  const port = box({ name: 'Port', dir: 'V', gap: 6, pad: [10, 12, 12, 12], parent: c, wSize: 'fill' });
  const pr = box({ name: 'Port row', dir: 'H', gap: 8, cross: 'center', parent: port, wSize: 'fill' });
  txt('Port', { style: 'Label/Default', color: 'color/text/secondary', parent: pr, name: 'Label', grow: true });
  inst('Connection Status', { Status: 'Connected' }, pr, { name: 'Connection' });
  const sel = inst('Select', { State: 'Default' }, port, { name: 'Port select' }); setProp(sel, 'Value', '/dev/cu.usbmodem1101 — RoboCore V2'); sel.layoutSizingHorizontal = 'FILL';
  const ft = box({ name: 'Footer', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'center', parent: c, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
  const b1 = inst('Button', { Variant: 'Ghost', State: 'Default' }, ft, { name: 'Refresh' }); setProp(b1, 'Label', 'Refresh ports'); setProp(b1, 'Icon', ICON['refresh'].id);
  spacer(ft, 1, true);
  const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ft, { name: 'Board setup' }); setProp(b2, 'Label', 'Board setup…'); setProp(b2, 'Show icon', false);
  CMP['Board Menu'] = c;
  parent.appendChild(c);
}

// ---------------------------------------------------------------- Code editor / console renderers
const KW = new Set(['if', 'else', 'for', 'while', 'do', 'return', 'const', 'static', 'break', 'continue', 'switch', 'case', 'default', 'true', 'false']);
const TYPES = new Set(['void', 'int', 'long', 'unsigned', 'char', 'float', 'double', 'bool', 'boolean', 'byte', 'String', 'Serial', 'uint8_t', 'uint16_t', 'uint32_t']);
const CONSTS = new Set(['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'A0', 'A1']);
function highlight(t, code) {
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(#include\s*<[^>]+>|#\w+)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;
  let m;
  while ((m = re.exec(code))) {
    let v = null;
    if (m[1]) v = 'color/syntax/comment';
    else if (m[2]) v = 'color/syntax/string';
    else if (m[3]) v = 'color/syntax/preprocessor';
    else if (m[4]) v = 'color/syntax/number';
    else if (m[5]) {
      const w = m[5];
      if (KW.has(w)) v = 'color/syntax/keyword';
      else if (TYPES.has(w)) v = 'color/syntax/type';
      else if (CONSTS.has(w)) v = 'color/syntax/constant';
      else if (/^\s*\(/.test(code.slice(m.index + w.length))) v = 'color/syntax/function';
    }
    if (v) t.setRangeFills(m.index, m.index + m[0].length, [paint(v)]);
  }
}
// codeView(parent, code, { w, h, activeLine, startLine, error: {line, from, len}, readOnly })
function codeView(parent, code, o = {}) {
  const lines = code.split('\n');
  const view = box({ name: o.name || 'Code view', dir: 'H', gap: 0, parent, fill: 'color/bg/editor', clip: true, w: o.w, h: o.h, wSize: o.wSize, hSize: o.hSize, grow: o.grow });
  if (o.wSize === 'fill' && view.parent && isAL(view.parent)) view.layoutSizingHorizontal = 'FILL';
  const gut = box({ name: 'Gutter', dir: 'V', gap: 0, pad: [12, 12, 12, 8], parent: view, hSize: 'fill', w: 52, cross: 'end' });
  const start = o.startLine || 1;
  const nums = lines.map((_, i) => String(start + i)).join('\n');
  const nt = txt(nums, { style: 'Code/Default', color: 'color/syntax/line-number', parent: gut, name: 'Line numbers', align: 'RIGHT' });
  if (o.activeLine) {
    const idx = nums.split('\n').slice(0, o.activeLine - start).join('\n').length + (o.activeLine > start ? 1 : 0);
    nt.setRangeFills(idx, idx + String(o.activeLine).length, [paint('color/syntax/line-number-active')]);
  }
  const area = box({ name: 'Text area', dir: 'V', gap: 0, pad: [12, 16, 12, 8], parent: view, grow: true, hSize: 'fill' });
  area.layoutSizingHorizontal = 'FILL';
  if (o.activeLine) {
    const hl = rect({ name: 'Current line', w: 2000, h: 20, fill: 'color/bg/hover', parent: area, abs: true, x: 0, y: 12 + (o.activeLine - start) * 20, opacity: 0.6 });
  }
  const t = txt(code, { style: 'Code/Default', color: 'color/syntax/plain', parent: area, name: 'Code' });
  highlight(t, code);
  if (o.cursor) { const cur = rect({ name: 'Caret', w: 2, h: 18, fill: 'color/accent/default', parent: area, abs: true, x: 8 + o.cursor.col * 7.8, y: 13 + (o.cursor.line - start) * 20 }); }
  if (o.error) {
    const e = o.error;
    const sq = rect({ name: 'Error squiggle', w: e.len * 7.8, h: 2, fill: 'color/status/error', parent: area, abs: true, x: 8 + e.col * 7.8, y: 12 + (e.line - start) * 20 + 18 });
  }
  // fold markers next to numbers for lines with "{"
  return view;
}
// console lines: [ts, kind('rx'|'tx'|'sys'|'ok'|'err'|'warn'), text]
function consoleView(parent, lines, o = {}) {
  const v = box({ name: o.name || 'Console', dir: 'V', gap: 2, pad: [10, 16, 10, 16], parent, fill: 'color/bg/console', clip: true, wSize: 'fill', hSize: 'fill' });
  for (const [ts, kind, text] of lines) {
    const r = box({ name: 'Line', dir: 'H', gap: 12, cross: 'start', parent: v, wSize: 'fill' });
    if (ts) txt(ts, { style: 'Code/Small', color: 'color/text/disabled', parent: r, name: 'Timestamp' });
    const col = { rx: 'color/syntax/plain', tx: 'color/accent/default', sys: 'color/text/tertiary', ok: 'color/status/success', err: 'color/status/error', warn: 'color/status/warning', info: 'color/status/info' }[kind] || 'color/syntax/plain';
    if (kind === 'tx') txt('→', { style: 'Code/Small', color: 'color/accent/default', parent: r, name: 'Direction' });
    const t = txt(text, { style: 'Code/Small', color: col, parent: r, name: 'Text', grow: true });
    t.textAutoResize = 'HEIGHT';
  }
  return v;
}
// ============================================================================
// Main IDE screens (03 — Main IDE) — 1440 × 1000
// ============================================================================

const SW = 1440, SH = 1000;
const BLINK_INO = [
  '/*',
  '  Blink — RoboCore V2',
  '  Turns the built-in LED on for one second, then off for one second.',
  '*/',
  '',
  'void setup() {',
  '  // the built-in LED pin is an output',
  '  pinMode(LED_BUILTIN, OUTPUT);',
  '  Serial.begin(115200);',
  '  Serial.println("RoboCore V2 ready");',
  '}',
  '',
  'void loop() {',
  '  digitalWrite(LED_BUILTIN, HIGH);   // LED on',
  '  delay(1000);                       // wait one second',
  '  digitalWrite(LED_BUILTIN, LOW);    // LED off',
  '  delay(1000);                       // wait one second',
  '}',
].join('\n');
const BLINK_GENERATED = [
  '// Generated from blocks · read-only',
  'void setup() {',
  '  Serial.begin(115200);',
  '  Serial.println("RoboCore V2 ready");',
  '  pinMode(LED_BUILTIN, OUTPUT);',
  '}',
  '',
  'void loop() {',
  '  digitalWrite(LED_BUILTIN, HIGH);',
  '  delay(1000);',
  '  digitalWrite(LED_BUILTIN, LOW);',
  '  delay(1000);',
  '}',
].join('\n');
const SERIAL_BOOT = [
  ['', 'sys', '— Connected to /dev/cu.usbmodem1101 at 115200 baud —'],
  ['14:02:10.881', 'rx', 'ESP-ROM:esp32s3-20210327'],
  ['14:02:10.884', 'rx', 'rst:0x1 (POWERON),boot:0x8 (SPI_FAST_FLASH_BOOT)'],
  ['14:02:10.902', 'rx', 'entry 0x403c98d0'],
  ['14:02:11.204', 'rx', 'RoboCore V2 ready'],
];
const OUTPUT_VERIFY = [
  ['14:05:12', 'sys', 'Compiling sketch for RoboCore V2 (ESP32-S3)…'],
  ['14:05:13', 'rx', 'Using board \'robocore_v2\' from platform esp32 3.0.7'],
  ['14:05:17', 'rx', 'Linking everything together…'],
  ['14:05:18', 'rx', 'Sketch uses 289,617 bytes (9%) of program storage space. Maximum is 3,145,728 bytes.'],
  ['14:05:18', 'rx', 'Global variables use 20,436 bytes (6%) of dynamic memory, leaving 307,244 bytes for local variables.'],
  ['14:05:18', 'ok', 'Verified in 6.4 s — ready to upload'],
];
const OUTPUT_UPLOAD = [
  ['14:06:02', 'ok', 'Compiled in 6.1 s · 289,617 bytes (9%)'],
  ['14:06:03', 'rx', 'esptool.py v4.6 · Serial port /dev/cu.usbmodem1101'],
  ['14:06:03', 'rx', 'Chip is ESP32-S3 (QFN56) (revision v0.2) · Embedded PSRAM 2MB'],
  ['14:06:04', 'rx', 'Changing baud rate to 921600 · Configuring flash size…'],
  ['14:06:05', 'rx', 'Writing at 0x00010000… (18 %)'],
  ['14:06:06', 'rx', 'Writing at 0x00030000… (45 %)'],
  ['14:06:07', 'info', 'Writing at 0x00050000… (64 %)'],
];
const OUTPUT_FAILED = [
  ['14:07:41', 'ok', 'Compiled in 5.9 s · 289,617 bytes (9%)'],
  ['14:07:42', 'rx', 'esptool.py v4.6 · Serial port /dev/cu.usbmodem1101'],
  ['14:07:42', 'rx', 'Connecting......................................'],
  ['14:07:52', 'err', 'A fatal error occurred: Failed to connect to ESP32-S3: No serial data received.'],
  ['14:07:52', 'warn', 'Upload failed. Hold BOOT, tap RESET, then Upload again — or close other apps using the port.'],
];

function nested(root, name) { return root.findOne(n => n.type === 'INSTANCE' && n.name === name); }
function nestedProps(root, name, props) {
  const n = nested(root, name);
  if (!n) { warn('nested not found ' + name); return null; }
  try { n.setProperties(props); } catch (e) { warn('nestedProps ' + name + ': ' + e.message); }
  return n;
}
function relPos(node, frame) {
  const a = node.absoluteTransform, b = frame.absoluteTransform;
  return { x: a[0][2] - b[0][2], y: a[1][2] - b[1][2], w: node.width, h: node.height };
}
function iconBtn(parent, icon, o = {}) {
  const b = inst('Icon Button', { Variant: o.variant || 'Ghost', State: o.state || 'Default' }, parent, { name: o.name || icon });
  setProp(b, 'Icon', ICON[icon].id);
  return b;
}
function screenFrame(page, name, x, y) {
  const f = box({ name, dir: 'V', w: SW, h: SH, fill: 'color/bg/app', clip: true });
  page.appendChild(f);
  f.x = x; f.y = y;
  return f;
}
function shell(f, o) {
  const top = inst('Top Bar', { Context: o.context || 'Editor' }, f, { name: 'Top bar' });
  top.layoutSizingHorizontal = 'FILL';
  const body = box({ name: 'Body', dir: 'H', parent: f, wSize: 'fill', grow: true });
  const sb = inst('Sidebar', { Collapsed: o.sidebarCollapsed ? 'True' : 'False' }, body, { name: 'Sidebar' });
  sb.layoutSizingVertical = 'FILL';
  if (o.nav) setNavActive(sb, o.nav);
  setProjectPill(sb, (o.context || 'Editor') === 'Editor' ? 'Active' : 'Default');
  const main = box({ name: 'Main', dir: 'V', gap: o.gap === undefined ? 12 : o.gap, pad: o.pad === undefined ? 12 : o.pad, parent: body, grow: true, hSize: 'fill' });
  const status = inst('Status Bar', null, f, { name: 'Status bar' });
  status.layoutSizingHorizontal = 'FILL';
  return { top, body, sb, main, status };
}

// panel with tabs: serial | output | problems
function utilityPanel(parent, o) {
  const collapsed = !!o.collapsed;
  const panel = box({ name: 'Utility panel', dir: 'V', parent, grow: true, hSize: 'fill', fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', clip: true });
  const ph = box({ name: 'Panel header', dir: 'H', gap: 8, pad: [0, 8, 0, 12], h: 40, cross: 'center', parent: panel, wSize: 'fill', stroke: collapsed ? undefined : 'color/border/subtle', sides: collapsed ? undefined : { b: 1 } });
  const tabs = box({ name: 'Tabs', dir: 'H', gap: 20, h: 40, cross: 'end', parent: ph });
  const tabDefs = [['Serial Monitor', 'terminal', 'serial'], ['Compiler Output', 'file-code', 'output'], ['Problems', 'alert-triangle', 'problems']];
  for (const [label, ic, key] of tabDefs) {
    const t = inst('Panel Tab', { State: o.tab === key && !collapsed ? 'Active' : 'Inactive' }, tabs, { name: 'Tab ' + label });
    setProp(t, 'Label', label); setProp(t, 'Icon', ICON[ic].id);
    if (key === 'problems') { setProp(t, 'Show count', true); setProp(t, 'Count', String(o.problems || 0)); }
    else if (key === 'serial' && collapsed && o.connected !== false) { setProp(t, 'Show count', true); setProp(t, 'Count', '4'); }
  }
  spacer(ph, 1, true);
  if (collapsed) {
    txt(o.connected === false ? 'No board connected' : 'RoboCore V2 · 115200 baud · 4 new lines', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ph, name: 'Summary' });
    divider(ph, 'V', 20);
    iconBtn(ph, 'chevron-up', { name: 'Expand panel' });
    return panel;
  }
  if (o.tab === 'serial') {
    const b = inst('Select', { State: 'Default' }, ph, { name: 'Baud' }); setProp(b, 'Value', '115200 baud'); b.resize(132, 28);
    const le = inst('Select', { State: 'Default' }, ph, { name: 'Line ending' }); setProp(le, 'Value', 'New line'); le.resize(116, 28);
    divider(ph, 'V', 20);
    iconBtn(ph, 'clock', { state: 'Active', name: 'Timestamps' });
    iconBtn(ph, 'autoscroll', { state: 'Active', name: 'Autoscroll' });
    iconBtn(ph, 'pause', { name: 'Pause' });
    iconBtn(ph, 'trash', { name: 'Clear output' });
  } else {
    iconBtn(ph, 'copy', { name: 'Copy output' });
    iconBtn(ph, 'trash', { name: 'Clear output' });
  }
  divider(ph, 'V', 20);
  iconBtn(ph, 'panel-bottom', { name: 'Maximise panel' });
  iconBtn(ph, 'chevron-down', { name: 'Collapse panel' });
  // content
  if (o.tab === 'serial' && o.connected === false) {
    const es = box({ name: 'Empty state', dir: 'V', gap: 10, pad: 16, align: 'center', cross: 'center', parent: panel, wSize: 'fill', grow: true, fill: 'color/bg/console' });
    const ic = box({ name: 'Icon circle', dir: 'H', w: 40, h: 40, align: 'center', cross: 'center', radius: 999, fill: 'color/bg/raised', parent: es });
    iconSlot(ic, 'unplug', 'color/icon/muted', 20, 'Icon');
    txt('No board connected', { style: 'Heading/H3', parent: es, name: 'Title' });
    txt('Connect RoboCore V2 with a USB-C data cable to see its serial output.', { style: 'Body/Small', color: 'color/text/secondary', parent: es, name: 'Body' });
    const row = box({ name: 'Actions', dir: 'H', gap: 8, cross: 'center', parent: es });
    const c = inst('Button', { Variant: 'Primary', State: 'Default' }, row, { name: 'Connect board' }); setProp(c, 'Label', 'Connect board'); setProp(c, 'Icon', ICON['plug'].id);
    const d = inst('Button', { Variant: 'Ghost', State: 'Default' }, row, { name: 'Demo output' }); setProp(d, 'Label', 'Show sample output (demo)'); setProp(d, 'Icon', ICON['play'].id);
    return panel;
  }
  const lines = o.lines || SERIAL_BOOT;
  consoleView(panel, lines, { name: 'Console' });
  if (o.tab === 'serial') {
    const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [8, 8, 8, 12], cross: 'center', parent: panel, wSize: 'fill', fill: 'color/bg/console', stroke: 'color/border/subtle', sides: { t: 1 } });
    const fld = box({ name: 'Message field', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 32, cross: 'center', radius: 8, fill: 'color/bg/input', stroke: 'color/border/default', parent: ir, grow: true });
    txt('Message to RoboCore V2 (Enter to send)', { style: 'Body/Small', color: 'color/text/tertiary', parent: fld, name: 'Placeholder', grow: true });
    const s = inst('Button', { Variant: 'Secondary', State: 'Default' }, ir, { name: 'Send' }); setProp(s, 'Label', 'Send'); setProp(s, 'Icon', ICON['send'].id);
  }
  return panel;
}

function canvasControls(cv, cw, chh) {
  const z = box({ name: 'Zoom controls', dir: 'V', gap: 2, pad: 4, radius: 10, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: cv, effect: 'Elevation/1 Raised' });
  iconBtn(z, 'zoom-in', { name: 'Zoom in' }); iconBtn(z, 'zoom-out', { name: 'Zoom out' }); iconBtn(z, 'fit', { name: 'Reset zoom' });
  z.x = cw - 16 - 40; z.y = chh - 16 - 40 - 12 - 108;
  z.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  const t = inst('Icon Button', { Variant: 'Subtle', State: 'Default' }, cv, { name: 'Trash' }); setProp(t, 'Icon', ICON['trash'].id);
  t.resize(40, 40); t.x = cw - 16 - 40; t.y = chh - 16 - 40; t.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  const zl = box({ name: 'Zoom level', dir: 'H', pad: [0, 10, 0, 10], h: 28, cross: 'center', radius: 999, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: cv });
  txt('100%', { style: 'Label/Small', color: 'color/text/secondary', parent: zl, name: 'Zoom' });
  zl.x = cw - 16 - 40 - 12 - 54; zl.y = chh - 16 - 34; zl.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  const hint = box({ name: 'Canvas hint', dir: 'H', gap: 6, pad: [0, 10, 0, 8], h: 28, cross: 'center', radius: 999, fill: 'color/bg/raised', stroke: 'color/border/subtle', parent: cv });
  iconSlot(hint, 'info', 'color/icon/muted', 14, 'Icon');
  txt('Drag blocks from the palette · right-click a block for options', { style: 'Caption/Default', color: 'color/text/tertiary', parent: hint, name: 'Hint' });
  hint.x = 16; hint.y = chh - 16 - 28; hint.constraints = { horizontal: 'MIN', vertical: 'MAX' };
}

// called after the whole screen is laid out, so positions use the canvas's real size
function finishCanvas(cv, o) {
  const cw = Math.round(cv.width), chh = Math.round(cv.height);
  const g = gridVector(cw, chh, 24); cv.insertChild(0, g); g.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  canvasControls(cv, cw, chh);
  if (o.dragging) {
    const ghost = cv.findOne(n => n.name === 'Insertion marker');
    const gp = ghost ? relPos(ghost, cv) : { x: 60, y: 300 };
    const d = blk('Output/Play tone', null, cv);
    d.name = 'Dragged block';
    LINKS.push([d, 'effect', 'Elevation/Drag']);
    d.x = Math.round(gp.x + gp.w + 28); d.y = Math.round(gp.y + 10); d.rotation = -2;
  }
}
function blocksWorkspace(content, o, cw, chh) {
  // toolbox
  const tb = box({ name: 'Toolbox', dir: 'V', gap: 2, pad: [12, 8, 12, 8], w: 168, parent: content, hSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { r: 1 } });
  const th = box({ name: 'Toolbox header', dir: 'H', pad: [0, 8, 8, 8], parent: tb });
  txt('CATEGORIES', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: th, name: 'Label' });
  for (const [cat] of BLOCK_CATS) inst('Block Category', { Category: cat, State: cat === (o.category || 'Output') && !o.flyoutClosed ? 'Active' : 'Default' }, tb, { name: 'Category ' + cat });
  // flyout
  if (!o.flyoutClosed) {
    const fl = box({ name: 'Flyout', dir: 'V', gap: 14, pad: [14, 16, 16, 16], w: 304, parent: content, hSize: 'fill', fill: 'color/bg/raised', stroke: 'color/border/subtle', sides: { r: 1 }, clip: true });
    const fh = box({ name: 'Flyout header', dir: 'H', gap: 8, cross: 'center', parent: fl, wSize: 'fill' });
    box({ name: 'Swatch', w: 10, h: 10, radius: 999, fill: 'color/block/output', parent: fh });
    txt('Output', { style: 'Heading/H3', parent: fh, name: 'Title', grow: true });
    txt('6 blocks', { style: 'Caption/Default', color: 'color/text/tertiary', parent: fh, name: 'Count' });
    for (const key of ['Output/Set built-in LED', 'Output/Set digital pin', 'Output/Write PWM', 'Output/Play tone', 'Output/Stop tone', 'Output/Set RGB LED']) {
      const b = blk(key, null, fl);
      if (o.dragging && key === 'Output/Play tone') b.opacity = 0.35;
    }
  }
  // canvas
  const cv = box({ name: 'Canvas', parent: content, grow: true, hSize: 'fill', fill: 'color/bg/canvas', clip: true });
  const prog = buildBlinkProgram({ insertion: !!o.dragging, selected: !!o.selected });
  cv.appendChild(prog); prog.x = 40; prog.y = 36;
  // grid, overlay controls and the dragged block are added by finishCanvas() once the screen layout is final
  // generated code preview
  if (o.codePreview) {
    const pv = box({ name: 'Code preview', dir: 'V', w: 360, parent: content, hSize: 'fill', fill: 'color/bg/editor', stroke: 'color/border/subtle', sides: { l: 1 } });
    const hd = box({ name: 'Preview header', dir: 'H', gap: 8, pad: [0, 8, 0, 14], h: 40, cross: 'center', parent: pv, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    iconSlot(hd, 'code', 'color/icon/brand', 16, 'Icon');
    txt('Generated C++', { style: 'Label/Strong', parent: hd, name: 'Title' });
    const b = inst('Badge', { Tone: 'Neutral' }, hd, { name: 'Read-only' }); setProp(b, 'Label', 'Read-only'); setProp(b, 'Show dot', false);
    spacer(hd, 1, true);
    iconBtn(hd, 'copy', { name: 'Copy code' });
    iconBtn(hd, 'x', { name: 'Close preview' });
    codeView(pv, BLINK_GENERATED, { name: 'Generated code', wSize: 'fill', grow: true });
    const note = box({ name: 'Preview note', dir: 'H', gap: 8, pad: [10, 14, 12, 14], cross: 'start', parent: pv, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
    iconSlot(note, 'info', 'color/icon/muted', 16, 'Icon');
    txt('Updates as you edit blocks. To customise, open in Code mode — hand-edited code can’t be turned back into blocks.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: note, name: 'Note', grow: true });
  }
  return cv;
}

function codeWorkspace(content, o) {
  const lines = (o.code || BLINK_INO);
  const ed = codeView(content, lines, { name: 'Editor', grow: true, hSize: 'fill', activeLine: o.activeLine || 14, cursor: o.cursor || { line: 14, col: 34 }, error: o.error });
  ed.layoutSizingVertical = 'FILL';
  // scrollbar
  const sbar = box({ name: 'Scrollbar', dir: 'V', w: 14, parent: content, hSize: 'fill', fill: 'color/bg/editor', pad: [4, 4, 4, 4] });
  rect({ name: 'Thumb', w: 6, h: 120, radius: 3, fill: 'color/border/default', parent: sbar });
  if (o.autocomplete) {
    const area = ed.findOne(n => n.name === 'Text area');
    const ac = box({ name: 'Autocomplete', dir: 'V', gap: 0, w: 380, parent: area, abs: true, radius: 10, fill: 'color/bg/raised', stroke: 'color/border/default', effect: 'Elevation/2 Popover', clip: true });
    ac.x = 8 + 10 * 7.8 - 8; ac.y = 12 + (o.cursor.line) * 20 + 4;
    const items = [['digitalWrite', '(pin, value)', 'void', true], ['digitalRead', '(pin)', 'int', false], ['digitalPinToInterrupt', '(pin)', 'int', false]];
    const list = box({ name: 'Suggestions', dir: 'V', gap: 0, pad: 4, parent: ac, wSize: 'fill' });
    for (const [n, args, ret, sel] of items) {
      const r = box({ name: 'Suggestion ' + n, dir: 'H', gap: 10, pad: [6, 10, 6, 8], cross: 'center', radius: 6, fill: sel ? 'color/bg/selected' : undefined, parent: list, wSize: 'fill' });
      const ti = box({ name: 'Kind', dir: 'H', w: 20, h: 20, align: 'center', cross: 'center', radius: 4, fill: 'color/brand/subtle', parent: r });
      txt('ƒ', { style: 'Label/Strong', color: 'color/brand/default', parent: ti, name: 'Kind icon' });
      const t = txt(n + args, { style: 'Code/Small', color: 'color/syntax/plain', parent: r, name: 'Signature', grow: true });
      t.setRangeFills(0, 8, [paint('color/accent/default')]);
      txt(ret, { style: 'Code/Small', color: 'color/syntax/type', parent: r, name: 'Return' });
    }
    const doc = box({ name: 'Docs', dir: 'V', gap: 4, pad: [10, 12, 12, 12], parent: ac, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
    txt('Write HIGH or LOW to a digital pin.', { style: 'Body/Small', color: 'color/text/secondary', parent: doc, name: 'Doc', fill: true });
    txt('Arduino core · ↵ to insert · Esc to close', { style: 'Caption/Default', color: 'color/text/tertiary', parent: doc, name: 'Doc hint' });
  }
  return ed;
}

// o: { name, mode:'blocks'|'code', collapsed, codePreview, dragging, tab, lines, connected, uploading, failed, overlay, toast, autocomplete, selected, project }
function ideScreen(page, x, y, o) {
  const f = screenFrame(page, o.name, x, y);
  const connected = o.connected !== false;
  const { top, sb, main, status } = shell(f, { context: 'Editor', nav: null });
  // top bar state
  setText(top, 'Project name', o.project || 'Blink LED');
  if (o.mode === 'code') { const pi = nested(top, 'Project mode icon'); if (pi) { try { pi.swapComponent(ICON['code']); tint(pi, 'color/icon/brand'); } catch (e) { warn(e.message); } } }
  if (o.unsaved) {
    const lbl = setText(top, 'Save label', 'Unsaved changes');
    if (lbl) refill(lbl, 'color/brand/default');
    const si = nested(top, 'Save icon');
    if (si) { try { si.swapComponent(ICON['circle']); tint(si, 'color/icon/brand'); si.resize(10, 10); } catch (e) { warn(e.message); } }
  }
  nestedProps(top, 'Board selector', { Status: connected ? 'Connected' : 'Disconnected', State: o.overlay === 'boardMenu' ? 'Open' : 'Default' });
  if (o.uploading) { nestedProps(top, 'Verify', { State: 'Disabled' }); nestedProps(top, 'Upload', { State: 'Running' }); nestedProps(top, 'Stop', { State: 'Running' }); }
  // workspace
  const ws = box({ name: 'Workspace', dir: 'V', parent: main, wSize: 'fill', grow: true, fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', clip: true });
  const hdr = box({ name: 'Workspace header', dir: 'H', gap: 12, pad: [0, 8, 0, 8], h: 48, cross: 'center', parent: ws, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  inst('Mode Switch', { Active: o.mode === 'code' ? 'Code' : 'Blocks' }, hdr, { name: 'Mode switch' });
  if (o.mode === 'code') {
    const tabs = box({ name: 'File tabs', dir: 'H', gap: 0, h: 48, cross: 'end', parent: hdr });
    const t1 = inst('File Tab', { State: 'Active' }, tabs, { name: 'Tab Blink.ino' }); setProp(t1, 'Filename', 'Blink.ino'); setProp(t1, 'Modified', !!o.unsaved);
    const t2 = inst('File Tab', { State: 'Inactive' }, tabs, { name: 'Tab config.h' }); setProp(t2, 'Filename', 'config.h'); setProp(t2, 'Modified', false);
    const nb = box({ name: 'New file wrap', dir: 'H', h: 36, pad: [0, 4, 0, 4], cross: 'center', parent: tabs });
    iconBtn(nb, 'plus', { name: 'New file' });
    spacer(hdr, 1, true);
    iconBtn(hdr, 'search', { name: 'Find' });
    iconBtn(hdr, 'sliders', { name: 'Format document' });
    iconBtn(hdr, 'more', { name: 'More' });
  } else {
    divider(hdr, 'V', 20);
    txt('7 blocks · setup + loop', { style: 'Caption/Default', color: 'color/text/tertiary', parent: hdr, name: 'Block count' });
    spacer(hdr, 1, true);
    iconBtn(hdr, 'undo', { name: 'Undo' });
    iconBtn(hdr, 'redo', { name: 'Redo' });
    iconBtn(hdr, 'trash', { name: 'Clear workspace' });
    divider(hdr, 'V', 20);
    const cb = inst('Button', { Variant: o.codePreview ? 'Secondary' : 'Ghost', State: 'Default' }, hdr, { name: 'Show code' });
    setProp(cb, 'Label', o.codePreview ? 'Hide code' : 'Show code'); setProp(cb, 'Icon', ICON['code'].id);
    if (o.codePreview) { const l = cb.findOne(n => n.name === 'Icon'); if (l) tint(l, 'color/icon/active'); }
  }
  const content = box({ name: 'Workspace content', dir: 'H', parent: ws, wSize: 'fill', grow: true });
  const bottomH = o.collapsed ? 40 : 236;
  const wsH = SH - 56 - 28 - 24 - 12 - bottomH;
  const contentH = wsH - 48;
  if (o.mode === 'code') codeWorkspace(content, o);
  else {
    const cw = 1200 - 168 - (o.codePreview ? 360 : 304);
    blocksWorkspace(content, Object.assign({}, o, { flyoutClosed: !!o.codePreview }), cw, contentH);
  }
  // bottom row
  const bottom = box({ name: 'Bottom row', dir: 'H', gap: 12, h: bottomH, parent: main, wSize: 'fill' });
  utilityPanel(bottom, { collapsed: o.collapsed, tab: o.tab || 'serial', lines: o.lines, connected, problems: o.problems });
  if (!o.collapsed) { const bi = inst('Board Info Card', { Status: connected ? 'Connected' : 'Disconnected' }, bottom, { name: 'Board info' }); bi.layoutSizingVertical = 'FILL'; }
  if (o.mode !== 'code') { const cv = f.findOne(n => n.name === 'Canvas'); if (cv) finishCanvas(cv, o); }
  // status bar
  const st = o.status || {};
  setStatus(status, {
    status: st.status || 'Ready', dot: st.dot || (connected ? 'color/status/success' : 'color/icon/muted'),
    detail: st.detail !== undefined ? st.detail : (o.mode === 'code' ? 'C++ · Blink.ino · ' + (o.unsaved ? 'unsaved' : 'saved 14:05') : 'Blocks · 7 blocks · auto-saved 14:02'),
    board: connected ? 'RoboCore V2 on /dev/cu.usbmodem1101 · 115200 baud' : 'RoboCore V2 · no port selected',
    cursor: o.mode === 'code' ? (st.cursor || 'Ln 14, Col 35') : '',
  });
  // overlays
  if (o.overlay === 'boardMenu') {
    const sel = nested(top, 'Board selector');
    const p = sel ? relPos(sel, f) : { x: 760, y: 8, w: 300, h: 40 };
    const m = inst('Board Menu', null, f, { name: 'Board menu', abs: true });
    m.x = Math.round(p.x + p.w - 380); m.y = 56 + 6;
  } else if (o.overlay) {
    const scrim = rect({ name: 'Scrim', w: SW, h: SH, fill: 'color/bg/overlay', parent: f, abs: true, x: 0, y: 0 });
    const key = { projectSettings: 'Dialog/Project Settings', clear: 'Dialog/Clear Workspace', connect: 'Dialog/Connect Board', newProject: 'Dialog/New Project' }[o.overlay];
    const d = inst(key, null, f, { name: 'Dialog', abs: true });
    d.x = Math.round((SW - d.width) / 2); d.y = Math.round((SH - d.height) / 2) - 20;
  }
  if (o.toast) {
    const t = inst('Toast', { Type: o.toast.type }, f, { name: 'Toast', abs: true });
    if (o.toast.title) setText(t, 'Title', o.toast.title);
    if (o.toast.message) setText(t, 'Message', o.toast.message);
    t.x = SW - 380 - 24; t.y = SH - 28 - 24 - t.height - (o.collapsed ? 40 : 236) - 12;
  }
  return f;
}

function buildIdePage(page) {
  const GX = 1600, GY = 1200;
  const F = {};
  const defs = [
    ['blocks', { name: 'IDE — Blocks', mode: 'blocks', tab: 'serial' }],
    ['code', { name: 'IDE — Code', mode: 'code', tab: 'output', lines: OUTPUT_VERIFY, status: { status: 'Verified', detail: 'Sketch uses 289,617 bytes (9%) · RAM 20,436 bytes (6%)' } }],
    ['codePreview', { name: 'IDE — Blocks · Code preview', mode: 'blocks', codePreview: true, tab: 'serial' }],
    ['blocksCollapsed', { name: 'IDE — Blocks · Console collapsed', mode: 'blocks', collapsed: true, tab: 'serial' }],
    ['codeCollapsed', { name: 'IDE — Code · Console collapsed + autocomplete', mode: 'code', collapsed: true, unsaved: true, autocomplete: true, code: BLINK_INO.replace('  delay(1000);                       // wait one second\n}', '  delay(1000);                       // wait one second\n  digitalW\n}'), activeLine: 18, cursor: { line: 18, col: 10 }, status: { status: 'Ready', cursor: 'Ln 18, Col 11' } }],
    ['dragging', { name: 'IDE — Blocks · Dragging a block', mode: 'blocks', dragging: true, tab: 'serial' }],
    ['uploading', { name: 'IDE — Code · Uploading', mode: 'code', tab: 'output', lines: OUTPUT_UPLOAD, uploading: true, status: { status: 'Uploading 64%', dot: 'color/status/info', detail: 'Writing at 0x00050000 · 921600 baud' } }],
    ['failed', { name: 'IDE — Code · Upload failed', mode: 'code', tab: 'output', lines: OUTPUT_FAILED, problems: 1, toast: { type: 'Error', title: 'Upload failed', message: 'RoboCore V2 didn’t respond on /dev/cu.usbmodem1101. Hold BOOT, tap RESET and try again.' }, status: { status: 'Upload failed', dot: 'color/status/error', detail: 'Failed to connect to ESP32-S3 · see Compiler Output' } }],
    ['uploaded', { name: 'IDE — Blocks · Upload complete', mode: 'blocks', tab: 'serial', toast: { type: 'Success', title: 'Upload complete', message: 'Blink LED is running on RoboCore V2 (14:06).' }, status: { status: 'Uploaded', detail: 'Flashed 289,617 bytes in 9.8 s' } }],
    ['boardMenu', { name: 'IDE — Blocks · Board selector open', mode: 'blocks', tab: 'serial', overlay: 'boardMenu' }],
    ['boardMenuCode', { name: 'IDE — Code · Board selector open', mode: 'code', tab: 'output', lines: OUTPUT_VERIFY, overlay: 'boardMenu' }],
    ['settings', { name: 'IDE — Blocks · Project settings', mode: 'blocks', tab: 'serial', overlay: 'projectSettings' }],
    ['clear', { name: 'IDE — Blocks · Clear workspace?', mode: 'blocks', tab: 'serial', overlay: 'clear', selected: false }],
    ['disconnected', { name: 'IDE — Blocks · No board connected', mode: 'blocks', tab: 'serial', connected: false }],
    ['connect', { name: 'IDE — Blocks · Connect board', mode: 'blocks', tab: 'serial', connected: false, overlay: 'connect' }],
  ];
  defs.forEach(([key, o], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    try { F[key] = ideScreen(page, col * GX, row * GY, o); }
    catch (e) { REPORT.errors.push('ide ' + key + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  });
  return F;
}
// ============================================================================
// Additional screens (04 — Additional Screens) — 1440 × 1000
// ============================================================================

function browseScreen(page, name, x, y, nav, o = {}) {
  const f = screenFrame(page, name, x, y);
  const s = shell(f, { context: 'Browse', nav, pad: [28, 32, 28, 32], gap: 24 });
  const connected = o.connected !== false;
  nestedProps(s.top, 'Board selector', { Status: connected ? 'Connected' : 'Disconnected', State: 'Default' });
  setStatus(s.status, { status: 'Ready', dot: connected ? 'color/status/success' : 'color/icon/muted', detail: o.detail || '', board: connected ? 'RoboCore V2 on /dev/cu.usbmodem1101 · 115200 baud' : 'RoboCore V2 · no port selected', cursor: '' });
  return Object.assign({ f }, s);
}
function pageHeader(parent, title, sub, right) {
  const h = box({ name: 'Page header', dir: 'H', gap: 16, cross: 'end', parent, wSize: 'fill' });
  const col = box({ name: 'Titles', dir: 'V', gap: 4, parent: h, grow: true });
  txt(title, { style: 'Heading/H1', parent: col, name: 'Title' });
  if (sub) txt(sub, { style: 'Body/Default', color: 'color/text/secondary', parent: col, name: 'Subtitle', fill: true });
  if (right) right(h);
  return h;
}
function sectionHeader(parent, title, link) {
  const h = box({ name: 'Section header ' + title, dir: 'H', gap: 8, cross: 'center', parent, wSize: 'fill' });
  txt(title, { style: 'Heading/H2', parent: h, name: 'Title', grow: true });
  if (link) txt(link, { style: 'Label/Default', color: 'color/text/link', parent: h, name: 'Link' });
  return h;
}
function chip(parent, label, active, count) {
  const c = box({ name: 'Chip ' + label, dir: 'H', gap: 6, pad: [0, 12, 0, 12], h: 30, cross: 'center', radius: 999, fill: active ? 'color/bg/selected' : 'color/bg/panel', stroke: active ? 'color/accent/muted' : 'color/border/subtle', parent });
  txt(label, { style: 'Label/Default', color: active ? 'color/text/primary' : 'color/text/secondary', parent: c, name: 'Label' });
  if (count !== undefined) txt(String(count), { style: 'Label/Small', color: active ? 'color/accent/default' : 'color/text/tertiary', parent: c, name: 'Count' });
  return c;
}
function card(parent, name, o = {}) {
  return box({ name, dir: 'V', gap: o.gap === undefined ? 12 : o.gap, pad: o.pad === undefined ? 20 : o.pad, parent, fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', wSize: o.wSize || 'fill', grow: o.grow, w: o.w, hSize: o.hSize });
}
function selectInst(parent, value, w, state) {
  const s = inst('Select', { State: state || 'Default' }, parent, { name: 'Select' });
  setProp(s, 'Value', value);
  if (w) s.resize(w, 32);
  return s;
}
function projectCard(parent, o) {
  const i = inst('Project Card', { Mode: o.mode || 'Blocks', State: o.hover ? 'Hover' : 'Default' }, parent, { name: 'Project ' + o.name, text: { Name: o.name, Description: o.desc, Edited: o.edited } });
  const b = i.findOne(n => n.name === 'Board badge' && n.type === 'INSTANCE');
  if (b) setText(b, 'Label', o.board || 'RoboCore V2');
  return i;
}
const PROJECTS = [
  { name: 'Blink LED', mode: 'Blocks', desc: 'Turn the built-in LED on and off every second.', edited: 'Edited 2 min ago', board: 'RoboCore V2' },
  { name: 'Obstacle avoider', mode: 'Code', desc: 'Drive forward and turn away when the sonar sees a wall.', edited: 'Edited 2h ago', board: 'RoboCore V2' },
  { name: 'Traffic light', mode: 'Blocks', desc: 'Red, amber and green LEDs with a pedestrian button.', edited: 'Edited yesterday', board: 'Arduino Uno R3' },
  { name: 'Line follower', mode: 'Blocks', desc: 'Follow a black line using the 3-channel IR sensor.', edited: 'Edited 3 days ago', board: 'RoboCore V2' },
  { name: 'Buzzer melody', mode: 'Code', desc: 'Play a tune with tone() and an array of notes.', edited: 'Edited last week', board: 'Arduino Uno R3' },
  { name: 'Servo sweep', mode: 'Code', desc: 'Sweep a servo from 0° to 180° and back.', edited: 'Edited 2 weeks ago', board: 'ESP32 DevKit V1' },
  { name: 'Distance monitor', mode: 'Blocks', desc: 'Print ultrasonic readings to the serial monitor.', edited: 'Edited 3 weeks ago', board: 'RoboCore V2' },
  { name: 'Sensor logger', mode: 'Code', desc: 'Log temperature and IMU angles every second.', edited: 'Edited last month', board: 'NodeMCU-32S' },
];
const EXAMPLES = [
  { title: 'Blink an LED', desc: 'Your first program: switch the built-in LED on and off with a delay.', level: 'Beginner', color: 'color/block/output', icon: 'lightbulb' },
  { title: 'Button-controlled LED', desc: 'Read the USER button and light the LED while it is pressed.', level: 'Beginner', color: 'color/block/input', icon: 'log-in' },
  { title: 'Traffic light', desc: 'Sequence three LEDs with timing, then add a crossing button.', level: 'Beginner', color: 'color/block/control', icon: 'clock' },
  { title: 'Ultrasonic distance monitor', desc: 'Measure distance with the HC-SR04 and print it to serial.', level: 'Intermediate', color: 'color/block/sensors', icon: 'radio', boards: 'V2 · Uno · ESP32' },
  { title: 'Buzzer tone generator', desc: 'Play notes and simple melodies with tone() and noTone().', level: 'Beginner', color: 'color/block/output', icon: 'activity' },
  { title: 'Basic motor control', desc: 'Drive forward, reverse and turn with the two motor ports.', level: 'Intermediate', color: 'color/block/robotics', icon: 'bot', boards: 'RoboCore V2 only' },
  { title: 'Read sensors to serial', desc: 'Print temperature and IMU readings as CSV for plotting.', level: 'Beginner', color: 'color/block/communication', icon: 'message', boards: 'RoboCore V2 only' },
  { title: 'Obstacle avoider', desc: 'Combine sonar and motors into a robot that steers around walls.', level: 'Advanced', color: 'color/block/robotics', icon: 'zap', boards: 'RoboCore V2 only' },
];

// ---------------------------------------------------------------- Home
function homeScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.name || 'Home', x, y, 'Home', { detail: '8 projects · saved in this browser' });
  const m = s.main;
  const hero = box({ name: 'Hero', dir: 'V', gap: 6, parent: m, wSize: 'fill' });
  const h1 = txt('Welcome back, Fredrick', { style: 'Heading/Display', parent: hero, name: 'Greeting' });
  const sub = txt('Build. Code. Create. — pick up where you left off, or start something new.', { style: 'Body/Default', color: 'color/text/secondary', parent: hero, name: 'Subtitle' });
  sub.setRangeFills(0, 20, [paint('color/brand/default')]);
  const qa = box({ name: 'Quick actions', dir: 'H', gap: 16, parent: m, wSize: 'fill' });
  const acts = [
    ['New blocks project', 'Drag-and-drop programming for beginners', 'blocks', 'Accent'],
    ['New code sketch', 'Arduino-style C++ with autocomplete', 'code', 'Brand'],
    ['Open from computer', 'Import an .ino sketch or .rcproj file', 'folder-open', 'Neutral'],
    ['Connect a board', 'RoboCore V2, Arduino Uno or ESP32 over USB', 'plug', 'Neutral'],
  ];
  for (const [t, d, ic, tone] of acts) {
    const i = tileInst('Quick Action', qa, { title: t, desc: d, icon: ic, tone });
    i.name = 'Quick action ' + t;
    i.layoutGrow = 1;
  }
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill' });
  const left = box({ name: 'Recent', dir: 'V', gap: 12, parent: cols, grow: true });
  sectionHeader(left, 'Recent projects', 'View all projects →');
  const row = box({ name: 'Recent cards', dir: 'H', gap: 16, parent: left, wSize: 'fill' });
  PROJECTS.slice(0, 3).forEach((p, i) => projectCard(row, Object.assign({}, p, { hover: i === 0 })));
  const right = box({ name: 'Your board', dir: 'V', gap: 12, w: 296, parent: cols });
  sectionHeader(right, 'Your board', null);
  inst('Board Info Card', { Status: 'Connected' }, right, { name: 'Board info' });
  const tp = box({ name: 'Templates', dir: 'V', gap: 12, parent: m, wSize: 'fill' });
  sectionHeader(tp, 'Starter templates', 'Browse all examples →');
  const tr = box({ name: 'Template tiles', dir: 'H', gap: 16, parent: tp, wSize: 'fill' });
  const tpl = [['Traffic light', 'Three LEDs and a crossing button', 'clock', 'color/block/control'], ['Line follower', 'Follow a black line with 3 IR sensors', 'bot', 'color/block/robotics'], ['Obstacle avoider', 'Sonar + motors steer around walls', 'radio', 'color/block/sensors'], ['Buzzer melody', 'Play a tune with tone()', 'activity', 'color/block/output']];
  for (const [t, d, ic, col] of tpl) { const i = tileInst('Template Tile', tr, { title: t, desc: d, icon: ic, color: col }); i.layoutGrow = 1; i.name = 'Template ' + t; }
  if (o.dialog) {
    rect({ name: 'Scrim', w: SW, h: SH, fill: 'color/bg/overlay', parent: s.f, abs: true, x: 0, y: 0 });
    const d = inst('Dialog/New Project', null, s.f, { name: 'Dialog', abs: true });
    d.x = Math.round((SW - d.width) / 2); d.y = Math.round((SH - d.height) / 2) - 20;
  }
  return s.f;
}

// ---------------------------------------------------------------- Projects
function projectsScreen(page, x, y, o = {}) {
  const s = browseScreen(page, o.empty ? 'Projects — Empty state' : 'Projects', x, y, 'Projects', { detail: o.empty ? 'No projects yet' : '8 projects · saved in this browser' });
  const m = s.main;
  pageHeader(m, 'Projects', o.empty ? 'Everything you build lives here.' : '8 projects · saved in this browser until you sign in', (h) => {
    if (o.empty) return;
    const vt = box({ name: 'View toggle', dir: 'H', gap: 2, pad: 2, radius: 8, fill: 'color/bg/input', stroke: 'color/border/subtle', parent: h });
    iconBtn(vt, 'grid', { state: 'Active', name: 'Grid view' }); iconBtn(vt, 'list', { name: 'List view' });
    selectInst(h, 'Sort: Last edited', 180);
  });
  if (o.empty) {
    const es = box({ name: 'Empty state', dir: 'V', gap: 16, pad: [64, 0, 0, 0], cross: 'center', parent: m, wSize: 'fill', grow: true });
    const circ = box({ name: 'Illustration', dir: 'H', w: 112, h: 112, align: 'center', cross: 'center', radius: 999, fill: 'color/accent/subtle', stroke: 'color/accent/muted', parent: es });
    iconSlot(circ, 'folder-open', 'color/icon/active', 44, 'Icon');
    txt('No projects yet', { style: 'Heading/H1', parent: es, name: 'Title' });
    txt('Create your first project or start from an example. Projects are saved in this browser — sign in to sync them across devices.', { style: 'Body/Default', color: 'color/text/secondary', parent: es, name: 'Body', w: 520, align: 'CENTER' });
    const ac = box({ name: 'Actions', dir: 'H', gap: 8, parent: es });
    const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'New project' }); setProp(b1, 'Label', 'New project');
    const b2 = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Browse examples' }); setProp(b2, 'Label', 'Browse examples'); setProp(b2, 'Icon', ICON['lightbulb'].id);
    spacer(es, 24);
    txt('OR START FROM A TEMPLATE', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: es, name: 'Overline' });
    const tr = box({ name: 'Template tiles', dir: 'H', gap: 16, parent: es });
    for (const [t, d, ic, col] of [['Blink LED', 'The classic first program', 'lightbulb', 'color/block/output'], ['Traffic light', 'Three LEDs and a button', 'clock', 'color/block/control'], ['Line follower', 'Follow a line with IR sensors', 'bot', 'color/block/robotics']]) tileInst('Template Tile', tr, { title: t, desc: d, icon: ic, color: col });
    return s.f;
  }
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  chip(fr, 'All', true, 8); chip(fr, 'Blocks', false, 4); chip(fr, 'Code', false, 4);
  divider(fr, 'V', 20);
  selectInst(fr, 'All boards', 160);
  spacer(fr, 1, true);
  const sf = inst('Search Field', null, fr, { name: 'Filter' }); setProp(sf, 'Placeholder', 'Filter projects');
  const grid = box({ name: 'Project grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  PROJECTS.forEach((p, i) => projectCard(grid, Object.assign({}, p, { hover: i === 1 })));
  return s.f;
}

// ---------------------------------------------------------------- Examples
function examplesScreen(page, x, y) {
  const s = browseScreen(page, 'Examples', x, y, 'Examples', { detail: '24 examples · RoboCore V2 board package 1.0' });
  const m = s.main;
  pageHeader(m, 'Examples', 'Step-by-step programs for RoboCore kits. Opening one makes a copy in Projects that you can change.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search examples'); });
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  chip(fr, 'All', true, 24); chip(fr, 'Basics', false, 6); chip(fr, 'Sensors', false, 5); chip(fr, 'Motors & robotics', false, 6); chip(fr, 'Sound & light', false, 4); chip(fr, 'Communication', false, 3);
  spacer(fr, 1, true);
  selectInst(fr, 'All levels', 140); selectInst(fr, 'RoboCore V2', 160);
  // learning path banner
  const bn = box({ name: 'Learning path', dir: 'H', gap: 16, pad: [16, 20, 16, 16], cross: 'center', radius: 12, fill: 'color/brand/subtle', stroke: 'color/brand/pressed', strokeOpacity: 0.5, parent: m, wSize: 'fill' });
  const it = box({ name: 'Icon tile', dir: 'H', w: 48, h: 48, align: 'center', cross: 'center', radius: 12, fill: 'color/brand/default', parent: bn });
  iconSlot(it, 'graduation', 'color/icon/on-accent', 24, 'Icon');
  const bc = box({ name: 'Text', dir: 'V', gap: 2, parent: bn, grow: true });
  txt('LEARNING PATH', { style: 'Caption/Overline', color: 'color/brand/default', parent: bc, name: 'Overline' });
  txt('From blink to line follower — 12 short lessons', { style: 'Heading/H3', parent: bc, name: 'Title' });
  txt('Start with blocks, then see the same programs in C++. Lesson 4: reading the ultrasonic sensor.', { style: 'Body/Small', color: 'color/text/secondary', parent: bc, name: 'Body', fill: true });
  const pg = box({ name: 'Progress', dir: 'V', gap: 6, w: 180, parent: bn });
  txt('3 of 12 complete', { style: 'Label/Small', color: 'color/text/secondary', parent: pg, name: 'Progress label' });
  const tr = box({ name: 'Track', dir: 'H', h: 6, radius: 999, fill: 'color/bg/hover', parent: pg, wSize: 'fill' });
  rect({ name: 'Fill', w: 45, h: 6, radius: 999, fill: 'color/brand/default', parent: tr });
  const cb = inst('Button', { Variant: 'Secondary', State: 'Default' }, bn, { name: 'Continue' }); setProp(cb, 'Label', 'Continue lesson 4'); setProp(cb, 'Icon', ICON['arrow-right'].id);
  const grid = box({ name: 'Example grid', dir: 'H', wrap: true, gap: 16, rowGap: 16, parent: m, wSize: 'fill' });
  EXAMPLES.forEach(e => { const c = exampleCard(grid, e); c.name = 'Example ' + e.title; });
  return s.f;
}

// ---------------------------------------------------------------- Libraries
function librariesScreen(page, x, y) {
  const s = browseScreen(page, 'Libraries', x, y, 'Libraries', { detail: '4 included · 2 installed' });
  const m = s.main;
  pageHeader(m, 'Libraries', 'Code libraries your sketches can #include. RoboCore libraries ship with the board package; others come from the Arduino Library Manager.', (h) => { const f = inst('Search Field', null, h, { name: 'Search' }); setProp(f, 'Placeholder', 'Search libraries'); });
  const fr = box({ name: 'Filters', dir: 'H', gap: 8, cross: 'center', parent: m, wSize: 'fill' });
  chip(fr, 'All', true, 10); chip(fr, 'Included', false, 4); chip(fr, 'Installed', false, 2); chip(fr, 'Available', false, 4);
  const tb = card(m, 'Library table', { pad: 0, gap: 0 });
  const hdr = box({ name: 'Table header', dir: 'H', gap: 16, pad: [0, 20, 0, 20], h: 40, cross: 'center', parent: tb, wSize: 'fill', fill: 'color/bg/chrome', stroke: 'color/border/subtle', sides: { b: 1 } });
  const cols = [['Library', 0], ['Version', 96], ['Works with', 180], ['Status', 120], ['', 112]];
  cols.forEach(([c, w]) => { const t = txt(c || ' ', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: hdr, name: 'Col ' + c }); if (w) { t.textAutoResize = 'HEIGHT'; t.resize(w, t.height); } else { t.textAutoResize = 'HEIGHT'; t.layoutGrow = 1; } });
  const libs = [
    ['RoboCore Motors', 'RoboCore', 'Drive the two motor ports with encoder feedback and ramping.', '1.0.0', 'RoboCore V2', 'Included'],
    ['RoboCore Sensors', 'RoboCore', 'Ultrasonic, 3-channel line sensor and IMU helpers.', '1.0.0', 'RoboCore V2', 'Included'],
    ['Wire', 'Arduino', 'I²C communication (Qwiic port and expansion headers).', 'core', 'All boards', 'Included'],
    ['Servo / ESP32Servo', 'Kevin Harrington', 'Control hobby servos with PWM.', '3.0.5', 'V2 · ESP32 · Uno', 'Installed'],
    ['Adafruit NeoPixel', 'Adafruit', 'WS2812B RGB LEDs, including the RoboCore V2 status LED.', '1.12.3', 'All boards', 'Installed'],
    ['NewPing', 'Tim Eckel', 'Fast, timeout-safe ultrasonic distance readings.', '1.9.7', 'All boards', 'Available'],
    ['Adafruit LSM6DS', 'Adafruit', 'Accelerometer and gyroscope driver for LSM6DS IMUs.', '4.7.3', 'V2 · ESP32', 'Available'],
    ['LiquidCrystal I2C', 'Frank de Brabander', '16×2 and 20×4 character LCDs over I²C.', '1.1.2', 'All boards', 'Available'],
  ];
  libs.forEach(([n, a, d, v, w, st], i) => {
    const r = box({ name: 'Row ' + n, dir: 'H', gap: 16, pad: [12, 20, 12, 20], cross: 'center', parent: tb, wSize: 'fill', stroke: i < libs.length - 1 ? 'color/border/subtle' : undefined, sides: i < libs.length - 1 ? { b: 1 } : undefined, fill: i === 0 ? 'color/bg/raised' : undefined });
    const c1 = box({ name: 'Name', dir: 'V', gap: 2, parent: r, grow: true });
    const tl = box({ name: 'Title line', dir: 'H', gap: 8, cross: 'center', parent: c1 });
    txt(n, { style: 'Label/Strong', parent: tl, name: 'Library' });
    txt('by ' + a, { style: 'Caption/Default', color: 'color/text/tertiary', parent: tl, name: 'Author' });
    txt(d, { style: 'Body/Small', color: 'color/text/secondary', parent: c1, name: 'Description', fill: true });
    txt(v, { style: 'Code/Small', color: 'color/text/secondary', parent: r, name: 'Version', w: 96 });
    txt(w, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Boards', w: 180 });
    const sw = box({ name: 'Status cell', dir: 'H', w: 120, parent: r });
    const b = inst('Badge', { Tone: st === 'Included' ? 'Brand' : (st === 'Installed' ? 'Success' : 'Neutral') }, sw, { name: 'Status' }); setProp(b, 'Label', st);
    const ac = box({ name: 'Action cell', dir: 'H', w: 112, align: 'end', parent: r });
    if (st === 'Available') { const bt = inst('Button', { Variant: 'Secondary', State: 'Default' }, ac, { name: 'Install' }); setProp(bt, 'Label', 'Install'); setProp(bt, 'Icon', ICON['download'].id); }
    else if (st === 'Installed') { const bt = inst('Button', { Variant: 'Ghost', State: 'Default' }, ac, { name: 'Examples' }); setProp(bt, 'Label', 'Examples'); setProp(bt, 'Show icon', false); }
    else txt('Board package', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ac, name: 'Included note' });
  });
  return s.f;
}

// ---------------------------------------------------------------- Board illustration (schematic, follows the V2 layout:
// ESP32 top centre, motors upper L/R, servos middle L/R, two 1x14 headers centre, bottom row sonar / USB-C / line)
function drawBoard(parent, w, h) {
  const g = box({ name: 'RoboCore V2 illustration', w, h, parent });
  const pcb = rect({ name: 'PCB', w, h, radius: 12, fill: 'color/bg/raised', parent: g });
  pcb.strokes = [paint('color/brand/default')]; pcb.strokeWeight = 1.5; pcb.strokeAlign = 'INSIDE';
  const silk = rect({ name: 'Silk outline', w: w - 16, h: h - 16, radius: 8, parent: g, x: 8, y: 8 });
  silk.strokes = [paint('color/brand/default', 0.35)]; silk.strokeWeight = 1; silk.strokeAlign = 'INSIDE';
  const lab = (t, x, y, col) => { const n = txt(t, { style: 'Caption/Overline', color: col || 'color/brand/default', parent: g, name: 'Silk ' + t }); n.x = x; n.y = y; return n; };
  const part = (name, x, y, pw, ph, fill, r) => rect({ name, w: pw, h: ph, radius: r === undefined ? 2 : r, fill, parent: g, x, y });
  const ring = (n) => { n.strokes = [paint('color/border/strong')]; n.strokeWeight = 1; return n; };
  // top row: status LEDs (top-left), Qwiic (top-right)
  ['color/status/success', 'color/status/warning', 'color/status/error'].forEach((c, i) => part('Status LED', 20 + i * 9, 16, 6, 4, c, 1));
  part('Qwiic', w - 38, 14, 18, 9, 'color/text/primary', 2); lab('QWIIC', w - 84, 11);
  // ESP32-S3 module with antenna
  const mx = Math.round(w / 2 - 46);
  ring(part('ESP32-S3 module', mx, 24, 92, 62, 'color/bg/panel', 3));
  part('RF shield', mx + 8, 40, 76, 40, 'color/text/tertiary', 2).opacity = 0.55;
  const ant = figma.createVector(); ant.name = 'Antenna';
  ant.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 6 L 8 6 L 8 0 L 16 0 L 16 6 L 24 6 L 24 0 L 32 0 L 32 6 L 40 6 L 40 0 L 48 0 L 48 6 L 56 6 L 56 0 L 64 0 L 64 6 L 76 6' }];
  ant.strokes = [paint('color/brand/default')]; ant.strokeWeight = 1.2; ant.fills = []; g.appendChild(ant); ant.x = mx + 8; ant.y = 28;
  lab('ESP32-S3', mx + 20, 54, 'color/text/inverse');
  // motors (upper left / right)
  part('Motor L connector', 20, 38, 40, 14, 'color/text/primary', 2); lab('MOTOR L', 20, 56);
  part('Motor R connector', w - 60, 38, 40, 14, 'color/text/primary', 2); lab('MOTOR R', w - 66, 56);
  // servos (middle left / right): 2 x 3 pins each
  const pins = (x0, y0) => { for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) { const p = part('Servo pin', x0 + c * 9, y0 + r * 9, 6, 6, 'color/bg/app', 1); p.strokes = [paint('color/brand/default', 0.8)]; } };
  pins(22, 100); lab('SERVO 1–2', 18, 122);
  pins(w - 49, 100); lab('SERVO 3–4', w - 74, 122);
  // two 1x14 expansion headers (centre)
  const hx = [Math.round(w / 2 - 30), Math.round(w / 2 + 22)];
  hx.forEach((x, k) => { part('Header 1x14', x, 98, 8, 102, 'color/bg/app', 2); for (let i = 0; i < 14; i++) part('Header hole', x + 2, 101 + i * 7, 4, 4, 'color/text/tertiary', 2); });
  lab('EXP A', hx[0] - 14, 204); lab('EXP B', hx[1] - 12, 204);
  // RGB LED, buzzer, IMU, USER button
  part('RGB LED', mx - 22, 74, 10, 10, 'color/text/primary', 2); lab('RGB', mx - 30, 86);
  const bz = figma.createEllipse(); bz.name = 'Buzzer'; bz.resize(24, 24); bz.fills = [paint('color/bg/app')]; ring(bz); g.appendChild(bz); bz.x = 26; bz.y = 148; lab('BUZZER', 18, 176);
  ring(part('IMU', w - 92, 150, 14, 14, 'color/bg/app', 2)); lab('IMU', w - 94, 168);
  ring(part('USER button', w - 36, 150, 14, 14, 'color/bg/app', 7)); lab('USER', w - 44, 168);
  // bottom row: sonar, USB-C, line sensor
  part('Ultrasonic connector', 20, h - 48, 36, 12, 'color/text/primary', 2); lab('SONAR', 20, h - 32);
  part('USB-C', Math.round(w / 2 - 15), h - 24, 30, 12, 'color/text/secondary', 6); lab('USB-C', Math.round(w / 2 + 20), h - 26);
  part('Line sensor connector', w - 64, h - 48, 44, 12, 'color/text/primary', 2); lab('LINE', w - 52, h - 32);
  return g;
}

// ---------------------------------------------------------------- Board Setup
function boardSetupScreen(page, x, y) {
  const s = browseScreen(page, 'Board Setup', x, y, 'Board Setup', { detail: 'RoboCore V2 board package 1.0 · esp32 core 3.0.7' });
  const m = s.main;
  pageHeader(m, 'Board Setup', 'Choose a board profile, connect over USB and set build options.', (h) => {
    inst('Connection Status', { Status: 'Connected' }, h, { name: 'Connection' });
    const b = inst('Button', { Variant: 'Secondary', State: 'Default' }, h, { name: 'Disconnect' }); setProp(b, 'Label', 'Disconnect'); setProp(b, 'Icon', ICON['unplug'].id);
  });
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill', grow: true });
  // profiles list
  const lc = card(cols, 'Board profiles', { w: 300, wSize: 'fixed', pad: 12, gap: 4, hSize: 'fill' });
  const lh = box({ name: 'Header', dir: 'H', pad: [4, 8, 8, 8], parent: lc, wSize: 'fill' });
  txt('BOARD PROFILES', { style: 'Caption/Overline', color: 'color/text/tertiary', parent: lh, name: 'Label' });
  BOARDS.forEach(([n, d, tag], i) => {
    const sel = i === 0;
    const r = box({ name: 'Profile ' + n, dir: 'H', gap: 10, pad: [10, 10, 10, 8], cross: 'center', radius: 8, fill: sel ? 'color/bg/selected' : undefined, stroke: sel ? 'color/accent/muted' : undefined, parent: lc, wSize: 'fill' });
    const t = box({ name: 'Chip tile', dir: 'H', w: 36, h: 36, align: 'center', cross: 'center', radius: 8, fill: 'color/bg/raised', parent: r });
    iconSlot(t, 'cpu', sel ? 'color/icon/brand' : 'color/icon/muted', 18, 'Icon');
    const c = box({ name: 'Text', dir: 'V', gap: 2, parent: r, grow: true }); c.layoutSizingHorizontal = 'FILL';
    txt(n, { style: 'Label/Strong', parent: c, name: 'Name' });
    txt(d, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Specs', fill: true });
  });
  spacer(lc, 1, true);
  const nt = box({ name: 'Note', dir: 'H', gap: 8, pad: [10, 8, 4, 8], cross: 'start', parent: lc, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  iconSlot(nt, 'info', 'color/icon/muted', 16, 'Icon');
  txt('Profiles come from the RoboCore board registry. New kits appear here after a board-package update.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: nt, name: 'Note', grow: true });
  // detail
  const rc = box({ name: 'Detail column', dir: 'V', gap: 24, parent: cols, grow: true, hSize: 'fill' });
  const dc = card(rc, 'Board detail', { gap: 16 });
  const dh = box({ name: 'Detail header', dir: 'H', gap: 8, cross: 'center', parent: dc, wSize: 'fill' });
  txt('RoboCore V2', { style: 'Heading/H2', parent: dh, name: 'Board' });
  const b1 = inst('Badge', { Tone: 'Brand' }, dh, { name: 'Recommended' }); setProp(b1, 'Label', 'Recommended'); setProp(b1, 'Show dot', false);
  const b2 = inst('Badge', { Tone: 'Warning' }, dh, { name: 'Prototype' }); setProp(b2, 'Label', 'Prototype · rev 2.0');
  spacer(dh, 1, true);
  txt('Board package 1.0 · esp32 core 3.0.7', { style: 'Caption/Default', color: 'color/text/tertiary', parent: dh, name: 'Package' });
  const db = box({ name: 'Detail body', dir: 'H', gap: 24, parent: dc, wSize: 'fill' });
  drawBoard(db, 272, 256);
  const specs = box({ name: 'Specs', dir: 'V', gap: 7, parent: db, grow: true });
  const SPECS = [['MCU', 'ESP32-S3-WROOM-1 · dual-core 240 MHz'], ['Memory', '8 MB flash · 2 MB PSRAM · 512 KB SRAM'], ['USB', 'USB-C · native USB-CDC (no driver needed)'], ['Wireless', 'Wi-Fi 4 · Bluetooth LE 5'], ['Motors', '2 × DC with encoders (JST-SH 6-pin)'], ['Servos', '4 × 3-pin headers'], ['Sensors', 'Ultrasonic port · 3-channel line sensor port · 6-axis IMU'], ['Outputs', 'RGB LED (WS2812B) · buzzer · status LEDs'], ['Power', '1S Li-ion (XT30) · charges over USB-C'], ['Expansion', '2 × 14-pin headers · Qwiic (I²C)']];
  for (const [k, v] of SPECS) {
    const r = box({ name: 'Spec ' + k, dir: 'H', gap: 12, parent: specs, wSize: 'fill' });
    txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 76 });
    txt(v, { style: 'Body/Small', parent: r, name: 'Value', grow: true });
  }
  const pn = box({ name: 'Pinout note', dir: 'H', gap: 8, pad: [8, 10, 8, 10], cross: 'start', radius: 8, fill: 'color/status/info-subtle', parent: specs, wSize: 'fill' });
  iconSlot(pn, 'info', 'color/status/info', 16, 'Icon');
  txt('Pin names come from the RoboCore V2 board package. Check the pinout card before wiring sensors.', { style: 'Caption/Default', color: 'color/text/secondary', parent: pn, name: 'Note', grow: true });
  // connection + build options
  const row = box({ name: 'Config row', dir: 'H', gap: 24, parent: rc, wSize: 'fill', grow: true });
  const cc = card(row, 'Connection', { grow: true, hSize: 'fill', gap: 14 });
  const ch = box({ name: 'Header', dir: 'H', gap: 8, cross: 'center', parent: cc, wSize: 'fill' });
  iconSlot(ch, 'usb', 'color/icon/brand', 18, 'Icon');
  txt('Connection', { style: 'Heading/H3', parent: ch, name: 'Title', grow: true });
  inst('Connection Status', { Status: 'Connected' }, ch, { name: 'Connection' });
  labeledSelect(cc, 'Serial port', '/dev/cu.usbmodem1101 — RoboCore V2');
  const r2 = box({ name: 'Speeds', dir: 'H', gap: 12, parent: cc, wSize: 'fill' });
  labeledSelect(r2, 'Monitor baud rate', '115200');
  labeledSelect(r2, 'Upload speed', '921600');
  const cb = box({ name: 'Buttons', dir: 'H', gap: 8, parent: cc, wSize: 'fill' });
  const t1 = inst('Button', { Variant: 'Secondary', State: 'Default' }, cb, { name: 'Test connection' }); setProp(t1, 'Label', 'Test connection'); setProp(t1, 'Icon', ICON['activity'].id);
  const t2 = inst('Button', { Variant: 'Ghost', State: 'Default' }, cb, { name: 'Refresh ports' }); setProp(t2, 'Label', 'Refresh ports'); setProp(t2, 'Icon', ICON['refresh'].id);
  txt('Last checked 14:02 · chip ESP32-S3 rev 0.2 responded in 38 ms', { style: 'Caption/Default', color: 'color/text/tertiary', parent: cc, name: 'Result' });
  const bo = card(row, 'Build options', { grow: true, hSize: 'fill', gap: 14 });
  const bh = box({ name: 'Header', dir: 'H', gap: 8, cross: 'center', parent: bo, wSize: 'fill' });
  iconSlot(bh, 'sliders', 'color/icon/brand', 18, 'Icon');
  txt('Build options', { style: 'Heading/H3', parent: bh, name: 'Title', grow: true });
  txt('Reset to defaults', { style: 'Label/Default', color: 'color/text/link', parent: bh, name: 'Reset' });
  const g1 = box({ name: 'Options A', dir: 'H', gap: 12, parent: bo, wSize: 'fill' });
  labeledSelect(g1, 'CPU frequency', '240 MHz (Wi-Fi)'); labeledSelect(g1, 'Flash size', '8 MB (64 Mb)');
  labeledSelect(bo, 'Partition scheme', '8M with SPIFFS (3 MB app / 1.5 MB SPIFFS)');
  const g2 = box({ name: 'Options B', dir: 'H', gap: 12, parent: bo, wSize: 'fill' });
  labeledSelect(g2, 'PSRAM', 'QSPI PSRAM'); labeledSelect(g2, 'USB CDC on boot', 'Enabled');
  return s.f;
}

// ---------------------------------------------------------------- Serial Monitor
const SERIAL_STREAM = [
  ['', 'sys', '— Connected to /dev/cu.usbmodem1101 at 115200 baud —'],
  ['14:12:01.204', 'rx', 'RoboCore V2 ready'],
  ['14:12:01.310', 'rx', 'distance_cm=48.2  temp_c=26.4'],
  ['14:12:01.560', 'rx', 'distance_cm=47.9  temp_c=26.4'],
  ['14:12:01.810', 'rx', 'distance_cm=45.1  temp_c=26.5'],
  ['14:12:02.060', 'rx', 'distance_cm=39.6  temp_c=26.5'],
  ['14:12:02.310', 'rx', 'distance_cm=33.0  temp_c=26.5'],
  ['14:12:02.560', 'rx', 'distance_cm=27.4  temp_c=26.5'],
  ['14:12:03.112', 'tx', 'status'],
  ['14:12:03.118', 'rx', 'ok · uptime 132 s · battery 3.92 V · motors idle'],
  ['14:12:03.310', 'rx', 'distance_cm=21.8  temp_c=26.6'],
  ['14:12:03.560', 'rx', 'distance_cm=16.2  temp_c=26.6'],
  ['14:12:03.810', 'warn', 'distance_cm=12.6  obstacle < 15 cm → turning left'],
  ['14:12:04.060', 'rx', 'distance_cm=18.9  temp_c=26.6'],
  ['14:12:04.310', 'rx', 'distance_cm=31.5  temp_c=26.6'],
  ['14:12:04.560', 'rx', 'distance_cm=44.0  temp_c=26.6'],
  ['14:12:05.002', 'tx', 'led off'],
  ['14:12:05.006', 'rx', 'ok · LED off'],
  ['14:12:05.310', 'rx', 'distance_cm=46.7  temp_c=26.7'],
  ['14:12:05.560', 'rx', 'distance_cm=47.2  temp_c=26.7'],
  ['14:12:05.810', 'rx', 'distance_cm=47.0  temp_c=26.7'],
  ['14:12:06.060', 'rx', 'distance_cm=46.8  temp_c=26.7'],
];
function serialScreen(page, x, y, o = {}) {
  const connected = o.connected !== false;
  const s = browseScreen(page, connected ? 'Serial Monitor' : 'Serial Monitor — Not connected', x, y, 'Serial Monitor', { connected, detail: connected ? 'Received 12.4 KB · 214 lines' : 'Serial port closed' });
  const m = s.main;
  pageHeader(m, 'Serial Monitor', 'Read and send text over the board’s USB serial port.', (h) => {
    inst('Connection Status', { Status: connected ? 'Connected' : 'Disconnected' }, h, { name: 'Connection' });
    const b = inst('Button', { Variant: connected ? 'Secondary' : 'Primary', State: 'Default' }, h, { name: connected ? 'Disconnect' : 'Connect' });
    setProp(b, 'Label', connected ? 'Disconnect' : 'Connect board'); setProp(b, 'Icon', ICON[connected ? 'unplug' : 'plug'].id);
  });
  const cols = box({ name: 'Columns', dir: 'H', gap: 24, parent: m, wSize: 'fill', grow: true });
  const pnl = box({ name: 'Console panel', dir: 'V', parent: cols, grow: true, hSize: 'fill', fill: 'color/bg/panel', radius: 12, stroke: 'color/border/subtle', clip: true });
  const tb = box({ name: 'Toolbar', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 52, cross: 'center', parent: pnl, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  selectInst(tb, connected ? '/dev/cu.usbmodem1101 — RoboCore V2' : 'Select a port…', 270, connected ? 'Default' : 'Default');
  selectInst(tb, '115200 baud', 128);
  divider(tb, 'V', 20);
  const seg = box({ name: 'View switch', dir: 'H', gap: 2, pad: 2, radius: 8, fill: 'color/bg/input', stroke: 'color/border/subtle', parent: tb });
  for (const [l, on] of [['Monitor', true], ['Plotter', false]]) { const sg = box({ name: 'Segment ' + l, dir: 'H', pad: [0, 10, 0, 10], h: 26, cross: 'center', radius: 6, fill: on ? 'color/bg/selected' : undefined, parent: seg }); txt(l, { style: 'Label/Default', color: on ? 'color/text/primary' : 'color/text/tertiary', parent: sg, name: 'Label' }); }
  spacer(tb, 1, true);
  for (const [l, on] of [['Timestamps', true], ['Autoscroll', true]]) { const t = box({ name: 'Toggle ' + l, dir: 'H', gap: 8, cross: 'center', parent: tb }); inst('Toggle', { On: on ? 'True' : 'False', Disabled: connected ? 'False' : 'True' }, t, { name: 'Toggle' }); txt(l, { style: 'Label/Default', color: 'color/text/secondary', parent: t, name: 'Label' }); }
  divider(tb, 'V', 20);
  iconBtn(tb, 'pause', { name: 'Pause', state: connected ? 'Default' : 'Disabled' });
  iconBtn(tb, 'trash', { name: 'Clear', state: connected ? 'Default' : 'Disabled' });
  iconBtn(tb, 'download', { name: 'Save log', state: connected ? 'Default' : 'Disabled' });
  if (connected) consoleView(pnl, SERIAL_STREAM, { name: 'Console' });
  else {
    const es = box({ name: 'Empty state', dir: 'V', gap: 12, align: 'center', cross: 'center', parent: pnl, wSize: 'fill', grow: true, fill: 'color/bg/console' });
    const ic = box({ name: 'Icon circle', dir: 'H', w: 72, h: 72, align: 'center', cross: 'center', radius: 999, fill: 'color/bg/raised', stroke: 'color/border/default', parent: es });
    iconSlot(ic, 'unplug', 'color/icon/muted', 32, 'Icon');
    txt('No board connected', { style: 'Heading/H2', parent: es, name: 'Title' });
    txt('Plug RoboCore V2 into a USB-C port and choose Connect. Chrome and Edge ask for permission to use the port the first time.', { style: 'Body/Default', color: 'color/text/secondary', parent: es, name: 'Body', w: 460, align: 'CENTER' });
    const ac = box({ name: 'Actions', dir: 'H', gap: 8, parent: es });
    const b1 = inst('Button', { Variant: 'Primary', State: 'Default' }, ac, { name: 'Connect board' }); setProp(b1, 'Label', 'Connect board'); setProp(b1, 'Icon', ICON['plug'].id);
    const b2 = inst('Button', { Variant: 'Ghost', State: 'Default' }, ac, { name: 'Demo' }); setProp(b2, 'Label', 'Show sample output (demo)'); setProp(b2, 'Icon', ICON['play'].id);
    txt('Sample output is clearly marked DEMO and never mixed with real device data.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: es, name: 'Demo note' });
  }
  const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'center', parent: pnl, wSize: 'fill', fill: 'color/bg/panel', stroke: 'color/border/subtle', sides: { t: 1 } });
  const fld = box({ name: 'Message field', dir: 'H', gap: 8, pad: [0, 12, 0, 12], h: 36, cross: 'center', radius: 8, fill: connected ? 'color/bg/input' : 'color/bg/panel', stroke: 'color/border/default', parent: ir, grow: true });
  txt(connected ? 'Type a message and press Enter' : 'Connect a board to send messages', { style: 'Body/Small', color: connected ? 'color/text/tertiary' : 'color/text/disabled', parent: fld, name: 'Placeholder', grow: true });
  selectInst(ir, 'New line (\\n)', 150, connected ? 'Default' : 'Disabled').resize(150, 36);
  const sb = inst('Button', { Variant: connected ? 'Primary' : 'Primary', State: connected ? 'Default' : 'Disabled' }, ir, { name: 'Send' }); setProp(sb, 'Label', 'Send'); setProp(sb, 'Icon', ICON['send'].id);
  sb.resize(sb.width, 36);
  // side column
  const side = box({ name: 'Side', dir: 'V', gap: 16, w: 288, parent: cols });
  if (connected) {
    const qs = card(side, 'Quick send', { gap: 4, pad: 16 });
    const qh = box({ name: 'Header', dir: 'H', pad: [0, 0, 8, 0], parent: qs, wSize: 'fill' });
    txt('Quick send', { style: 'Heading/H3', parent: qh, name: 'Title', grow: true });
    txt('Edit', { style: 'Label/Default', color: 'color/text/link', parent: qh, name: 'Edit' });
    for (const c of ['status', 'led on', 'led off', 'beep 440', 'motors stop']) {
      const r = box({ name: 'Command ' + c, dir: 'H', gap: 8, pad: [6, 6, 6, 10], cross: 'center', radius: 8, fill: c === 'status' ? 'color/bg/hover' : undefined, parent: qs, wSize: 'fill' });
      txt(c, { style: 'Code/Small', parent: r, name: 'Command', grow: true });
      iconBtn(r, 'send', { name: 'Send ' + c });
    }
    const ss = card(side, 'Session', { gap: 8, pad: 16 });
    txt('Session', { style: 'Heading/H3', parent: ss, name: 'Title' });
    for (const [k, v] of [['Received', '12.4 KB · 214 lines'], ['Sent', '6 messages'], ['Connected', '00:03:12'], ['Format', '115200 baud · 8-N-1']]) {
      const r = box({ name: 'Stat ' + k, dir: 'H', gap: 8, parent: ss, wSize: 'fill' });
      txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 80 });
      txt(v, { style: 'Body/Small', parent: r, name: 'Value', grow: true });
    }
    const nt = box({ name: 'Note', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'start', radius: 8, fill: 'color/status/info-subtle', parent: side, wSize: 'fill' });
    iconSlot(nt, 'info', 'color/status/info', 16, 'Icon');
    txt('The monitor pauses while you upload and reconnects automatically afterwards.', { style: 'Caption/Default', color: 'color/text/secondary', parent: nt, name: 'Note', grow: true });
  } else {
    const ts = card(side, 'Troubleshooting', { gap: 10, pad: 16 });
    txt('Not seeing your board?', { style: 'Heading/H3', parent: ts, name: 'Title' });
    for (const tip of ['Use a USB-C data cable — some cables only charge.', 'Close Arduino IDE or other apps that may hold the port.', 'Switch RoboCore V2 ON (slide switch on the right edge).', 'Still stuck? Hold BOOT and tap RESET, then reconnect.']) {
      const r = box({ name: 'Tip', dir: 'H', gap: 8, cross: 'start', parent: ts, wSize: 'fill' });
      iconSlot(r, 'check', 'color/icon/active', 16, 'Icon');
      txt(tip, { style: 'Body/Small', color: 'color/text/secondary', parent: r, name: 'Tip text', grow: true });
    }
  }
  return s.f;
}

// ---------------------------------------------------------------- Settings
function settingsScreen(page, x, y) {
  const s = browseScreen(page, 'Settings', x, y, 'Settings', { detail: 'Preferences saved on this device' });
  const m = s.main;
  pageHeader(m, 'Settings', 'Preferences are saved automatically on this device.');
  const cols = box({ name: 'Columns', dir: 'H', gap: 32, parent: m, wSize: 'fill', grow: true });
  const nav = box({ name: 'Settings nav', dir: 'V', gap: 2, w: 200, parent: cols });
  [['Appearance', 'palette', true], ['Editor', 'code', false], ['Blocks', 'blocks', false], ['Boards & ports', 'cpu', false], ['Keyboard shortcuts', 'keyboard', false], ['About', 'info', false]].forEach(([l, ic, on]) => {
    const n = inst('Nav Item', { State: on ? 'Active' : 'Default', Collapsed: 'False' }, nav, { name: 'Settings/' + l });
    setProp(n, 'Label', l); setProp(n, 'Icon', ICON[ic].id); n.layoutSizingHorizontal = 'FILL';
  });
  const c1 = box({ name: 'Column A', dir: 'V', gap: 24, parent: cols, grow: true });
  const c2 = box({ name: 'Column B', dir: 'V', gap: 24, parent: cols, grow: true });
  // appearance
  const ap = card(c1, 'Appearance', { gap: 4 });
  txt('Appearance', { style: 'Heading/H2', parent: ap, name: 'Title' });
  txt('Theme', { style: 'Label/Default', color: 'color/text/secondary', parent: box({ name: 'Label wrap', dir: 'H', pad: [12, 0, 8, 0], parent: ap }), name: 'Theme label' });
  const th = box({ name: 'Themes', dir: 'H', gap: 12, parent: ap, wSize: 'fill' });
  for (const [n, sel, note, dark] of [['Dark', true, 'Default', true], ['Light', false, 'Planned', false], ['System', false, 'Auto', true]]) {
    const t = box({ name: 'Theme ' + n, dir: 'V', gap: 8, pad: 8, radius: 10, fill: sel ? 'color/bg/selected' : 'color/bg/input', stroke: sel ? 'color/border/focus' : 'color/border/default', parent: th, grow: true });
    t.layoutSizingHorizontal = 'FILL';
    const pv = box({ name: 'Preview', dir: 'H', gap: 4, pad: 6, h: 64, radius: 6, fill: dark ? 'color/bg/app' : '#EEF1F5', parent: t, wSize: 'fill' });
    box({ name: 'Side', w: 14, hSize: 'fill', radius: 3, fill: dark ? 'color/bg/chrome' : '#FFFFFF', parent: pv });
    const pc = box({ name: 'Panel', dir: 'V', gap: 4, pad: 6, radius: 3, fill: dark ? 'color/bg/panel' : '#FFFFFF', parent: pv, grow: true, hSize: 'fill' });
    rect({ name: 'Line', w: 40, h: 5, radius: 2, fill: 'color/accent/default', parent: pc }); rect({ name: 'Line', w: 28, h: 5, radius: 2, fill: dark ? 'color/border/strong' : '#C9D1DC', parent: pc }); rect({ name: 'Line', w: 34, h: 5, radius: 2, fill: 'color/brand/default', parent: pc });
    if (!dark || n === 'Light') pv.opacity = 0.6;
    const lr = box({ name: 'Label row', dir: 'H', gap: 6, cross: 'center', parent: t, wSize: 'fill' });
    inst('Radio', { Selected: sel ? 'True' : 'False' }, lr, { name: 'Radio' });
    txt(n, { style: 'Label/Strong', parent: lr, name: 'Name', grow: true });
    txt(note, { style: 'Caption/Default', color: 'color/text/tertiary', parent: lr, name: 'Note' });
  }
  settingRow(ap, 'Interface scale', 'Make text and controls larger.', (r) => selectInst(r, '100%', 120));
  settingRow(ap, 'Reduce motion', 'Turn off panel and block animations.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ap, 'Strong focus rings', 'Thicker teal outline for keyboard focus.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  // general
  const gn = card(c1, 'General', { gap: 4 });
  txt('General', { style: 'Heading/H2', parent: gn, name: 'Title' });
  settingRow(gn, 'Language', null, (r) => selectInst(r, 'English (UK)', 150));
  settingRow(gn, 'Auto-save projects', 'Every 30 seconds and before upload.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(gn, 'Share anonymous usage data', 'Off by default. Never includes your code.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  // editor
  const ed = card(c2, 'Editor', { gap: 4 });
  txt('Editor', { style: 'Heading/H2', parent: ed, name: 'Title' });
  settingRow(ed, 'Font size', 'Code editor and serial monitor.', (r) => selectInst(r, '13 px', 110));
  settingRow(ed, 'Tab size', null, (r) => selectInst(r, '2 spaces', 110));
  settingRow(ed, 'Autocomplete', 'Suggest Arduino functions and constants as you type.', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Bracket matching', 'Highlight the matching ( ) { } [ ].', (r) => inst('Toggle', { On: 'True', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Word wrap', null, (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(ed, 'Format on save', 'Uses clang-format with the Arduino style.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  const bl = card(c2, 'Blocks', { gap: 4 });
  txt('Blocks', { style: 'Heading/H2', parent: bl, name: 'Title' });
  settingRow(bl, 'Show generated code', 'Open the read-only C++ preview beside the workspace.', (r) => inst('Toggle', { On: 'False', Disabled: 'False' }, r, { name: 'Toggle' }));
  settingRow(bl, 'Block size', null, (r) => selectInst(r, 'Comfortable', 140));
  return s.f;
}

function buildScreensPage(page) {
  const GX = 1600, GY = 1200;
  const F = {};
  const defs = [
    ['home', () => homeScreen(page, 0, 0)],
    ['projects', () => projectsScreen(page, GX, 0)],
    ['projectsEmpty', () => projectsScreen(page, 2 * GX, 0, { empty: true })],
    ['examples', () => examplesScreen(page, 0, GY)],
    ['libraries', () => librariesScreen(page, GX, GY)],
    ['boardSetup', () => boardSetupScreen(page, 2 * GX, GY)],
    ['serial', () => serialScreen(page, 0, 2 * GY)],
    ['serialEmpty', () => serialScreen(page, GX, 2 * GY, { connected: false })],
    ['settings', () => settingsScreen(page, 2 * GX, 2 * GY)],
    ['homeNew', () => homeScreen(page, 0, 3 * GY, { dialog: true, name: 'Home — New project dialog' })],
  ];
  for (const [k, fn] of defs) {
    try { F[k] = fn(); } catch (e) { REPORT.errors.push('screen ' + k + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  }
  return F;
}
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
// ============================================================================
// 02 — Components page layout + 05 — Prototype wiring
// ============================================================================

function family(root, overline, title, desc, o = {}) {
  const f = box({ name: 'Family — ' + title, dir: 'V', gap: 24, pad: 40, parent: root, wSize: 'fill', fill: 'color/bg/chrome', radius: 16, stroke: 'color/border/subtle' });
  docHeader(f, overline, title, desc, 1200);
  const content = box({ name: 'Content', dir: 'H', wrap: true, gap: o.gap || 40, rowGap: o.gap || 40, parent: f, wSize: 'fill', cross: 'start' });
  return content;
}
async function yieldUI() { await new Promise(r => setTimeout(r, 0)); }

async function buildComponentsPage(page) {
  const root = box({ name: 'Component library', dir: 'V', gap: 40, pad: 64, w: 2600, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;
  const hdr = box({ name: 'Header', dir: 'V', gap: 8, parent: root, wSize: 'fill' });
  txt('COMPONENTS', { style: 'Caption/Overline', color: 'color/brand/default', parent: hdr, name: 'Overline' });
  txt('RoboCore IDE component library', { style: 'Heading/Display', parent: hdr, name: 'Title' });
  txt('Every component uses auto layout and is bound to the Color / Dimensions variables and the text + effect styles. Variant properties are named Property=Value; text, boolean and icon-swap properties are exposed in the instance panel.', { style: 'Body/Default', color: 'color/text/secondary', parent: hdr, name: 'Desc', w: 1200 });

  const t0 = Date.now();
  const brand = family(root, 'Brand', 'Logo & icons', 'Logo built from the official RoboCore wordmark (gear “o”) recoloured for dark UI. Icons: Lucide set, 20px.');
  buildLogos(brand);
  buildIcons(brand);
  await yieldUI();
  const btn = family(root, 'Actions', 'Buttons & toolbar controls', 'Button (4 variants × 5 states), Icon Button (3 × 4) and the build controls used in the top bar.');
  buildButton(btn); buildIconButton(btn); buildToolbarActions(btn);
  const nav = family(root, 'Navigation', 'Navigation & tabs', 'Sidebar items, the Blocks/Code mode switch, sketch file tabs and bottom-panel tabs.');
  buildNavItem(nav); buildModeSwitch(nav); buildFileTab(nav); buildPanelTab(nav);
  const hw = family(root, 'Hardware', 'Board selector & connection', 'Board + port picker, connection indicator, compact board info and the board menu.');
  buildBadge(hw); buildConnection(hw); buildBoardSelector(hw);
  const forms = family(root, 'Forms', 'Inputs, dropdowns & menus', 'Text inputs with labels and helper text, search, selects, menus, toggles, checkboxes, radios and tooltips.');
  buildInputs(forms); buildMenu(forms); buildControls(forms); buildTooltip(forms); buildAvatar(forms);
  await yieldUI();
  const fb = family(root, 'Feedback', 'Toasts', 'Success, error, info and warning notifications.');
  buildToast(fb);
  const blocks = family(root, 'Blocks', 'Block programming', 'Toolbox categories and the block library. Shapes follow Blockly/Scratch conventions: notch on top, tab below, hats start a script, C-blocks wrap statements. Each block lists the C++ it generates in its description.', { gap: 32 });
  buildCategoryItem(blocks);
  await yieldUI();
  // composites (order matters)
  const chrome = family(root, 'App chrome', 'Sidebar, top bar & status bar', 'Composite components used by every screen.');
  buildProjectPill(chrome); buildSidebar(chrome); buildTopBar(chrome); buildStatusBar(chrome);
  buildBoardInfo(hw); buildBoardMenu(hw);
  const cards = family(root, 'Content', 'Cards & tiles', 'Project cards, example cards, template tiles and quick actions.');
  buildProjectCard(cards); buildExampleCard(cards); buildTiles(cards);
  const dialogs = family(root, 'Overlays', 'Dialogs', 'Modal dialogs: 16px radius, Elevation/3 Modal over a 72% scrim. Destructive dialogs name the consequence and offer undo where possible.');
  buildDialogs(dialogs);
  await yieldUI();
  buildBlockLibrary(blocks);
  // block anatomy
  const an = box({ name: 'Block anatomy', dir: 'V', gap: 16, pad: 24, w: 560, radius: 12, fill: 'color/bg/canvas', stroke: 'color/border/subtle', parent: blocks });
  txt('Anatomy', { style: 'Heading/H3', parent: an, name: 'Title' });
  const prog = buildBlinkProgram({ selected: true });
  an.appendChild(prog);
  for (const l of ['Hat block (on start / forever) starts a script — maps to setup() / loop().', 'Statement blocks stack: the tab below fits the notch above (40px body, 6px tab).', 'Dropdown fields are tinted; number/text fields are white pills with dark text.', 'Teal outline = selected / keyboard-focused block.']) txt('• ' + l, { style: 'Body/Small', color: 'color/text/secondary', parent: an, name: 'Note', fill: true });
  REPORT.timings.components = Date.now() - t0;
  return root;
}

// ---------------------------------------------------------------- prototype
const EASE = { type: 'EASE_OUT' };
function reaction(dest, o = {}) {
  return { trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: o.t || 'SMART_ANIMATE', easing: EASE, duration: o.d || 0.25 }, resetScrollPosition: true }] };
}
async function hotspot(frame, x, y, w, h, dest, name, o) {
  const hs = figma.createFrame();
  hs.name = 'Hotspot · ' + name;
  hs.fills = [];
  frame.appendChild(hs);
  if (isAL(frame)) hs.layoutPositioning = 'ABSOLUTE';
  hs.resize(Math.max(1, w), Math.max(1, h)); hs.x = x; hs.y = y;
  await hs.setReactionsAsync([reaction(dest, o)]);
  REPORT.counts.reactions = (REPORT.counts.reactions || 0) + 1;
  return hs;
}
async function go(frame, nodeName, dest, o = {}) {
  if (!frame || !dest) return;
  const scope = o.within || frame;
  const n = scope.findOne(x => x.name === nodeName && x.visible !== false);
  if (!n) { warn('proto: no "' + nodeName + '" in ' + frame.name); return; }
  try {
    await n.setReactionsAsync([reaction(dest, o)]);
    REPORT.counts.reactions = (REPORT.counts.reactions || 0) + 1;
  } catch (e) {
    const p = relPos(n, frame);
    await hotspot(frame, p.x, p.y, p.w, p.h, dest, nodeName, o);
  }
}
async function buildPrototype(page, IDE, SCR) {
  const P = {};
  const pick = [
    ['home', SCR.home, 'Home'], ['homeNew', SCR.homeNew, 'Home — New project'], ['projects', SCR.projects, 'Projects'], ['examples', SCR.examples, 'Examples'],
    ['libraries', SCR.libraries, 'Libraries'], ['boardSetup', SCR.boardSetup, 'Board Setup'], ['serial', SCR.serial, 'Serial Monitor'], ['settings', SCR.settings, 'Settings'],
    ['blocks', IDE.blocks, 'IDE — Blocks'], ['blocksCollapsed', IDE.blocksCollapsed, 'IDE — Blocks · Console collapsed'], ['code', IDE.code, 'IDE — Code'], ['codeCollapsed', IDE.codeCollapsed, 'IDE — Code · Console collapsed'],
    ['codePreview', IDE.codePreview, 'IDE — Blocks · Code preview'], ['boardMenu', IDE.boardMenu, 'IDE — Blocks · Board menu'], ['boardMenuCode', IDE.boardMenuCode, 'IDE — Code · Board menu'], ['settingsDlg', IDE.settings, 'IDE — Project settings'],
  ];
  let i = 0;
  for (const [k, src, name] of pick) {
    if (!src) { warn('proto source missing ' + k); continue; }
    const c = src.clone();
    page.appendChild(c);
    c.name = 'P · ' + name;
    c.x = (i % 4) * 1600; c.y = Math.floor(i / 4) * 1200;
    P[k] = c; i++;
  }
  // sidebar navigation on every frame
  const navMap = [['Nav/Home', 'home'], ['Nav/Projects', 'projects'], ['Nav/Libraries', 'libraries'], ['Nav/Examples', 'examples'], ['Nav/Board Setup', 'boardSetup'], ['Nav/Serial Monitor', 'serial'], ['Nav/Settings', 'settings'], ['Open project', 'blocks']];
  for (const f of Object.values(P)) {
    if (f === P.homeNew || f === P.boardMenu || f === P.boardMenuCode || f === P.settingsDlg) continue;
    for (const [n, k] of navMap) if (P[k] !== f) await go(f, n, P[k], { t: 'DISSOLVE', d: 0.15 });
  }
  // 1 · open a project (Home → recent card → IDE)
  await go(P.home, 'Project Blink LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.home, 'Quick action New blocks project', P.homeNew, { t: 'DISSOLVE', d: 0.15 });
  await go(P.homeNew, 'Create project', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.homeNew, 'Cancel', P.home, { t: 'DISSOLVE', d: 0.15 });
  await go(P.homeNew, 'Close', P.home, { t: 'DISSOLVE', d: 0.15 });
  await go(P.projects, 'Project Blink LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.projects, 'Project Obstacle avoider', P.code, { t: 'DISSOLVE', d: 0.2 });
  // 2 · switch Blocks ↔ Code
  for (const [a, b] of [['blocks', 'code'], ['blocksCollapsed', 'codeCollapsed'], ['codePreview', 'code'], ['boardMenu', 'code']]) await go(P[a], 'Segment Code', P[b]);
  for (const [a, b] of [['code', 'blocks'], ['codeCollapsed', 'blocksCollapsed'], ['boardMenuCode', 'blocks']]) await go(P[a], 'Segment Blocks', P[b]);
  await go(P.blocks, 'Show code', P.codePreview);
  await go(P.codePreview, 'Show code', P.blocks);
  await go(P.codePreview, 'Close preview', P.blocks);
  // 3 · board selector
  await go(P.blocks, 'Board selector', P.boardMenu, { t: 'DISSOLVE', d: 0.12 });
  await go(P.code, 'Board selector', P.boardMenuCode, { t: 'DISSOLVE', d: 0.12 });
  for (const [k, back] of [['boardMenu', 'blocks'], ['boardMenuCode', 'code']]) {
    const f = P[k];
    const menu = f && f.findOne(n => n.name === 'Board menu');
    if (!menu) continue;
    // click outside closes: transparent dismiss layer under the menu
    const dz = await hotspot(f, 0, 0, SW, SH, P[back], 'Dismiss menu', { t: 'DISSOLVE', d: 0.12 });
    f.insertChild(f.children.indexOf(menu), dz);
    for (const b of BOARDS) await go(f, 'Board ' + b[0], P[back], { t: 'DISSOLVE', d: 0.12 });
    await go(f, 'Board setup', P.boardSetup, { t: 'DISSOLVE', d: 0.15 });
  }
  // 4 · serial monitor expand / collapse
  await go(P.blocks, 'Collapse panel', P.blocksCollapsed);
  await go(P.blocksCollapsed, 'Expand panel', P.blocks);
  await go(P.code, 'Collapse panel', P.codeCollapsed);
  await go(P.codeCollapsed, 'Expand panel', P.code);
  await go(P.blocks, 'Maximise panel', P.serial, { t: 'DISSOLVE', d: 0.2 });
  // 5 · examples
  await go(P.examples, 'Example Blink an LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  if (P.home) {
    const rp = P.home.findOne(n => n.name === 'Section header Recent projects');
    const st = P.home.findOne(n => n.name === 'Section header Starter templates');
    if (rp) await go(P.home, 'Link', P.projects, { t: 'DISSOLVE', d: 0.15, within: rp });
    if (st) await go(P.home, 'Link', P.examples, { t: 'DISSOLVE', d: 0.15, within: st });
  }
  // 6 · project settings
  for (const k of ['blocks', 'code', 'codePreview', 'blocksCollapsed', 'codeCollapsed']) await go(P[k], 'Project switcher', P.settingsDlg, { t: 'DISSOLVE', d: 0.15 });
  for (const n of ['Cancel', 'Save changes', 'Close']) await go(P.settingsDlg, n, P.blocks, { t: 'DISSOLVE', d: 0.15 });
  // flows (one starting frame per flow)
  const flows = [['1 · Open a project', P.home], ['2 · Switch Blocks ↔ Code', P.blocks], ['3 · Board selector', P.code], ['4 · Serial monitor expand / collapse', P.blocksCollapsed], ['5 · Navigate to Examples', P.projects], ['6 · Project settings', P.codePreview]].filter(x => x[1]);
  page.flowStartingPoints = flows.map(([name, f]) => ({ nodeId: f.id, name }));
  // legend
  const lg = box({ name: 'Prototype guide', dir: 'V', gap: 10, pad: 32, w: 1440, radius: 16, fill: 'color/bg/chrome', stroke: 'color/border/subtle', parent: page });
  lg.x = 0; lg.y = -420;
  txt('PROTOTYPE', { style: 'Caption/Overline', color: 'color/brand/default', parent: lg, name: 'Overline' });
  txt('Clickable flows — press Present (▶) and pick a flow', { style: 'Heading/H1', parent: lg, name: 'Title' });
  for (const l of ['1 · Open a project — Home → click the “Blink LED” card (or New blocks project → Create project).', '2 · Switch Blocks ↔ Code — use the mode switch; “Show code” opens the generated C++ preview.', '3 · Board selector — click the board chip in the top bar; pick a board or click outside to close.', '4 · Serial monitor — use the chevron to collapse or expand the bottom panel; the maximise button opens the full Serial Monitor.', '5 · Navigate to Examples — sidebar → Examples → open “Blink an LED”.', '6 · Project settings — click the project name in the top bar; Cancel / Save return to the editor.', 'Every sidebar destination works on every screen. Transitions: Smart Animate 250 ms for mode/panel changes, Dissolve 150 ms for navigation.']) txt(l, { style: 'Body/Default', color: 'color/text/secondary', parent: lg, name: 'Step', fill: true });
  return P;
}
// ============================================================================
// Orchestration: guard → pages → tokens → components → foundations → screens
// → prototype → (optional) PNG export to a local review server
// ============================================================================

async function preparePages() {
  const managed = Object.values(PAGE_NAMES);
  for (const p of figma.root.children) await p.loadAsync();
  const foreign = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length > 0);
  if (foreign.length) throw new Error('This file already has other content (page "' + foreign[0].name + '"). Run the builder in a new, empty design file.');
  // never wipe generated pages by accident: that needs the explicit Rebuild command
  const built = figma.root.children.filter(p => managed.indexOf(p.name) >= 0 && p.children.length > 0);
  if (built.length && figma.command !== 'rebuild') throw new Error('This file already has the generated pages. Use Plugins → Development → RoboCore IDE Design Builder → Rebuild to regenerate them (manual edits on those pages are replaced; version history keeps the old version).');
  const pages = {};
  // rename an empty default page to Foundations
  const empties = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length === 0);
  for (const [key, name] of Object.entries(PAGE_NAMES)) {
    let p = figma.root.children.find(x => x.name === name);
    if (!p && empties.length) { p = empties.shift(); p.name = name; }
    if (!p) { p = figma.createPage(); p.name = name; }
    pages[key] = p;
  }
  // order pages 01..05
  Object.values(PAGE_NAMES).forEach((name, i) => { const p = figma.root.children.find(x => x.name === name); if (p) figma.root.insertChild(i, p); });
  // remove leftover empty pages
  for (const p of figma.root.children.slice()) if (managed.indexOf(p.name) < 0 && p.children.length === 0 && figma.root.children.length > 5) p.remove();
  // clear managed pages (re-run safety: everything here is generated)
  for (const p of Object.values(pages)) for (const c of p.children.slice()) c.remove();
  return pages;
}

function waitForUI(type, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { figma.ui.off('message', h); resolve(null); }, ms);
    const h = (msg) => { if (msg && msg.type === type) { clearTimeout(t); figma.ui.off('message', h); resolve(msg); } };
    figma.ui.on('message', h);
  });
}
let UI_OPEN = false;
async function openReview() {
  if (!UI_OPEN) { figma.showUI(__html__, { visible: false, width: 240, height: 80 }); UI_OPEN = true; }
  figma.ui.postMessage({ type: 'ping' });
  const pong = await waitForUI('pong', 4000);
  return !!(pong && pong.ok);
}
async function exportForReview(items) {
  let n = 0;
  for (const [name, node, scale] of items) {
    if (!node || node.removed) continue;
    try {
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      figma.ui.postMessage({ type: 'png', name, bytes });
      await waitForUI('ack', 20000);
      n++;
    } catch (e) { warn('export ' + name + ': ' + e.message); }
  }
  REPORT.exported = (REPORT.exported || 0) + n;
}
async function sendReport() {
  try {
    figma.ui.postMessage({ type: 'report', report: REPORT });
    await waitForUI('ack', 8000);
  } catch (e) { /* UI not open */ }
}

async function main() {
  const T = Date.now();
  const mark = (k) => { REPORT.timings[k] = Date.now() - T; };
  const pages = await preparePages();
  mark('pages');
  await setupFonts();
  await setupTokens();
  mark('tokens');

  await figma.setCurrentPageAsync(pages.components);
  await buildComponentsPage(pages.components);
  await applyLinks();
  mark('components');

  await figma.setCurrentPageAsync(pages.foundations);
  buildFoundations(pages.foundations);
  await applyLinks();
  mark('foundations');

  await figma.setCurrentPageAsync(pages.ide);
  const IDE = buildIdePage(pages.ide);
  await applyLinks();
  mark('ide');
  await yieldUI();

  await figma.setCurrentPageAsync(pages.screens);
  const SCR = buildScreensPage(pages.screens);
  await applyLinks();
  mark('screens');
  await yieldUI();

  await figma.setCurrentPageAsync(pages.prototype);
  await buildPrototype(pages.prototype, IDE, SCR);
  mark('prototype');

  // page canvas backgrounds
  for (const p of Object.values(pages)) p.backgrounds = [{ type: 'SOLID', color: hexToRgb('#050A14') }];

  REPORT.counts.ideFrames = Object.keys(IDE).length;
  REPORT.counts.screenFrames = Object.keys(SCR).length;

  // optional: export PNGs for review (only if the local review server answers)
  const review = await openReview();
  REPORT.export = review ? 'on' : 'skipped (no local review server)';
  if (review) {
    await figma.setCurrentPageAsync(pages.ide);
    const items = [];
    for (const [k, f] of Object.entries(IDE)) items.push(['ide_' + k + '.png', f, 1]);
    for (const [k, f] of Object.entries(SCR)) items.push(['screen_' + k + '.png', f, 1]);
    await exportForReview(items);
    await figma.setCurrentPageAsync(pages.components);
    const comps = pages.components.children[0];
    if (comps) await exportForReview(comps.children.map(fam => ['comp_' + fam.name.replace(/[^\w]+/g, '_') + '.png', fam, 0.6]));
    await figma.setCurrentPageAsync(pages.foundations);
    const fnd = pages.foundations.children[0];
    if (fnd) await exportForReview(fnd.children.map(sec => ['found_' + sec.name.replace(/[^\w]+/g, '_') + '.png', sec, 0.6]));
    await figma.setCurrentPageAsync(pages.prototype);
    await exportForReview(pages.prototype.children.filter(c => c.type === 'FRAME').slice(0, 3).map(c => ['proto_' + c.name.replace(/[^\w]+/g, '_') + '.png', c, 0.5]));
  }
  REPORT.timings.total = Date.now() - T;
  await sendReport();
  await figma.setCurrentPageAsync(pages.foundations);
  figma.viewport.scrollAndZoomIntoView(pages.foundations.children);
}

main().then(() => {
  const msg = 'RoboCore IDE design built — ' + (REPORT.errors.length ? REPORT.errors.length + ' error(s), ' : '') + (REPORT.counts.icons || 0) + ' icons, ' + (REPORT.counts.blocks || 0) + ' blocks, ' + ((REPORT.counts.ideFrames || 0) + (REPORT.counts.screenFrames || 0)) + ' screens';
  figma.closePlugin(msg);
}).catch(async (e) => {
  REPORT.errors.push('FATAL: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 6).join(' | '));
  try { if (await openReview()) await sendReport(); } catch (x) { /* ignore */ }
  figma.closePlugin('RoboCore IDE builder stopped: ' + e.message);
});
