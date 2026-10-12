// ============================================================================
// Programming blocks — Scratch/Blockly geometry drawn as vectors, in the box's
// line-art style: every block has a navy outline. Three roles instead of eight
// colours: CONTROL = box yellow, ACTION = navy ink, VALUE = white, outlined.
// Statement: notch on top, tab below. Hat: dome on top. C-block: mouth(s).
// ============================================================================

const BK = { R: 6, NX: 16, NW: 28, NS: 6, ND: 6, IW: 20, CAP: 18, HATW: 96 };
const ROLE = {
  control: { fill: 'color/block/control', text: 'color/text/primary', icon: 'color/icon/strong', drop: 'color/brand/pressed', slot: 'color/brand/pressed' },
  action: { fill: 'color/block/action', text: 'color/text/on-ink', icon: 'color/icon/on-ink', drop: 'color/ink/hover', slot: 'color/ink/hover' },
  value: { fill: 'color/block/value', text: 'color/text/primary', icon: 'color/icon/strong', drop: 'color/bg/subtle', slot: 'color/bg/subtle' },
};
const roleOf = (cat, kind) => (kind === 'reporter' || kind === 'boolean') ? 'value' : (cat === 'Control' ? 'control' : 'action');

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
function shapeVector(d, role, name = 'Shape', ghost) {
  const v = figma.createVector();
  v.name = name;
  v.vectorPaths = [{ windingRule: 'NONZERO', data: d }];
  if (ghost) { v.fills = [paint('color/bg/hover')]; v.strokes = [paint('color/border/strong')]; v.dashPattern = [4, 3]; }
  else { v.fills = [paint(ROLE[role].fill)]; v.strokes = [paint('color/block/outline')]; }
  v.strokeWeight = 1.25;
  v.strokeAlign = 'INSIDE';
  return v;
}

// ---- parts: 'label' | {t:'drop', v} | {t:'num', v} | {t:'text', v} | {t:'icon', v} | {t:'rep', parts} | {t:'bool', parts} | {t:'slot'}
function renderParts(row, parts, role, counter) {
  counter = counter || { n: 0 };
  const R = ROLE[role];
  for (const part of parts) {
    if (typeof part === 'string') { txt(part, { style: 'Block/Label', color: R.text, parent: row, name: 'Label' }); continue; }
    if (part.t === 'drop') {
      const f = box({ name: 'Field (dropdown)', dir: 'H', gap: 4, pad: [0, 6, 0, 8], h: 24, cross: 'center', radius: 4, fill: R.drop, parent: row });
      txt(part.v, { style: 'Block/Field', color: R.text, parent: f, name: 'F' + (++counter.n) });
      iconSlot(f, 'chevron-down', R.icon, 12, 'Chevron');
    } else if (part.t === 'num' || part.t === 'text') {
      const f = box({ name: part.t === 'num' ? 'Field (number)' : 'Field (text)', dir: 'H', pad: [0, 10, 0, 10], h: 24, cross: 'center', align: 'center', radius: 999, fill: 'color/block/field', stroke: role === 'action' ? undefined : 'color/block/outline', parent: row });
      txt(part.v, { style: 'Block/Field', color: 'color/text/primary', parent: f, name: 'F' + (++counter.n) });
      if (part.t === 'num') { try { f.minWidth = 32; } catch (e) { /* older API */ } }
    } else if (part.t === 'icon') {
      iconSlot(row, part.v, R.icon, 18, 'Block icon');
    } else if (part.t === 'rep') {
      const r = box({ name: 'Reporter', dir: 'H', gap: 6, pad: [0, 10, 0, 10], h: 28, cross: 'center', radius: 999, fill: ROLE.value.fill, stroke: 'color/block/outline', parent: row });
      r.strokeWeight = 1.25;
      renderParts(r, part.parts, 'value', counter);
    } else if (part.t === 'bool') {
      row.appendChild(boolShape(part.parts, counter));
    } else if (part.t === 'slot') {
      const s = box({ name: 'Empty boolean slot', w: 40, h: 24, parent: row });
      const v = shapeVector(hexPath(40, 24), role, 'Slot');
      v.fills = [paint(R.slot)]; v.strokes = [];
      s.appendChild(v);
    }
  }
}
function hexPath(w, h) { const k = h / 2; return 'M ' + k + ' 0 L ' + rnd(w - k) + ' 0 L ' + w + ' ' + k + ' L ' + rnd(w - k) + ' ' + h + ' L ' + k + ' ' + h + ' L 0 ' + k + ' Z'; }
function boolShape(parts, counter) {
  const row = box({ name: 'Content', dir: 'H', gap: 6, pad: [0, 16, 0, 16], h: 32, cross: 'center' });
  renderParts(row, parts, 'value', counter);
  const w = Math.ceil(row.width), h = Math.max(32, Math.ceil(row.height));
  const holder = figma.createFrame();
  holder.name = 'Boolean';
  holder.fills = []; holder.clipsContent = false;
  holder.resize(w, h);
  holder.appendChild(shapeVector(hexPath(w, h), 'value'));
  holder.appendChild(row);
  row.x = 0; row.y = 0;
  return holder;
}
function contentRow(parts, role, minH) {
  const row = box({ name: 'Content', dir: 'H', gap: 8, pad: [0, 12, 0, 12], cross: 'center' });
  renderParts(row, parts, role);
  const h = Math.max(minH, Math.ceil(row.height) + 12);
  row.resize(Math.max(1, row.width), h);
  row.layoutSizingHorizontal = 'HUG';
  return row;
}
// statement / hat / reporter / boolean block as a plain frame. role: control | action | value
function makeBlock(role, parts, o = {}) {
  const holder = figma.createFrame();
  holder.name = o.name || 'Block';
  holder.fills = []; holder.clipsContent = false;
  if (o.kind === 'reporter' || o.kind === 'boolean') {
    const row = box({ name: 'Content', dir: 'H', parent: holder });
    renderParts(row, [o.kind === 'reporter' ? { t: 'rep', parts } : { t: 'bool', parts }], 'value');
    const inner = row.children[0];
    if (o.kind === 'reporter') { inner.resize(inner.width, 32); inner.layoutSizingHorizontal = 'HUG'; }
    holder.resize(Math.ceil(row.width), Math.ceil(row.height));
    return holder;
  }
  const row = contentRow(parts, role, o.minH || 40);
  const w = Math.max(o.minW || 0, Math.ceil(row.width));
  const { d, H, top } = pathStatement(w, row.height, o);
  holder.appendChild(shapeVector(d, role, 'Shape', o.ghost));
  holder.appendChild(row);
  row.x = 0; row.y = top;
  holder.resize(w, H + (o.bottom === 'flat' ? 0 : BK.ND));
  if (o.ghost) row.opacity = 0;
  return holder;
}
// stacking pitch per node id (Figma nodes are not extensible, so keep it outside)
const PITCH = new Map();
function pitchOf(n) { return PITCH.has(n.id) ? PITCH.get(n.id) : (n.height - BK.ND); }
// C-block (always control). arms: [parts, parts(else)..., bottomParts]; mouths: [[nodes], [nodes]]
function makeCBlock(arms, mouths, o = {}) {
  const { IW, ND } = BK;
  const holder = figma.createFrame();
  holder.name = o.name || 'C-block';
  holder.fills = []; holder.clipsContent = false;
  const rows = arms.map((parts, i) => parts && parts.length ? contentRow(parts, 'control', i === 0 ? 40 : 32) : null);
  const w = Math.max(o.minW || 150, ...rows.filter(Boolean).map(r => Math.ceil(r.width)));
  const secs = [];
  arms.forEach((parts, i) => {
    const isLast = i === arms.length - 1;
    const r = rows[i];
    secs.push(r ? r.height : (isLast ? 24 : 32));
    if (!isLast) { const kids = mouths[i] || []; secs.push(kids.length ? kids.reduce((s, k) => s + pitchOf(k), 0) : 24); }
  });
  const { d, H, marks } = pathC(w, secs, o);
  holder.appendChild(shapeVector(d, 'control'));
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
// [category, name, parts, kind, generates]
const BLOCK_LIBRARY = [
  ['Output', 'Set built-in LED', ['set built-in LED to', D('HIGH')], 'statement', 'digitalWrite(LED_BUILTIN, HIGH);'],
  ['Output', 'Set digital pin', ['set pin', D('13'), 'to', D('HIGH')], 'statement', 'digitalWrite(13, HIGH);'],
  ['Output', 'Play tone', ['tone pin', D('8'), D('C4'), 'for', N('0.5'), 's'], 'statement', 'tone(8, 262, 500);'],
  ['Output', 'Set RGB LED', ['set RGB LED to', D('red')], 'statement', 'rgbLed.setPixelColor(0, 255, 0, 0); rgbLed.show();'],
  ['Input', 'Read digital pin', ['read digital pin', D('2')], 'reporter', 'digitalRead(2)'],
  ['Input', 'Button pressed', ['button', D('USER'), 'pressed'], 'boolean', 'digitalRead(USER_BUTTON) == LOW'],
  ['Control', 'On start', ['on start'], 'hatC', 'void setup() { … }'],
  ['Control', 'Forever', ['forever'], 'hatC', 'void loop() { … }'],
  ['Control', 'Wait', ['wait', N('1'), D('secs')], 'statement', 'delay(1000);'],
  ['Control', 'Repeat', ['repeat', N('5'), 'times'], 'c', 'for (int i = 0; i < 5; i++) { … }'],
  ['Control', 'If', ['if', { t: 'slot' }, 'then'], 'c', 'if (condition) { … }'],
  ['Control', 'If else', ['if', { t: 'slot' }, 'then'], 'cElse', 'if (condition) { … } else { … }'],
  ['Math', 'Arithmetic', [N('0'), D('+'), N('0')], 'reporter', '(a + b)'],
  ['Math', 'Compare', [N('0'), D('<'), N('20')], 'boolean', '(a < b)'],
  ['Variables', 'Set variable', ['set', D('distance'), 'to', N('0')], 'statement', 'distance = 0;'],
  ['Variables', 'Change variable', ['change', D('count'), 'by', N('1')], 'statement', 'count += 1;'],
  ['Variables', 'Variable', ['distance'], 'reporter', 'distance'],
  ['Robotics', 'Drive', [{ t: 'icon', v: 'bot' }, 'drive', D('forward'), 'at', N('60'), '%'], 'statement', 'robot.drive(FORWARD, 60);'],
  ['Robotics', 'Turn', [{ t: 'icon', v: 'bot' }, 'turn', D('left'), 'for', N('0.5'), 's'], 'statement', 'robot.turn(LEFT, 500);'],
  ['Robotics', 'Stop motors', [{ t: 'icon', v: 'bot' }, 'stop motors'], 'statement', 'robot.stop();'],
  ['Robotics', 'Set servo', [{ t: 'icon', v: 'bot' }, 'servo', D('1'), 'to', N('90'), '°'], 'statement', 'servo1.write(90);'],
  ['Sensors', 'Ultrasonic distance', ['distance', D('cm')], 'reporter', 'sonar.distanceCm()'],
  ['Sensors', 'Line sensor', ['line sensor', D('centre')], 'reporter', 'lineSensor.read(CENTRE)'],
  ['Sensors', 'Temperature', ['temperature', D('°C')], 'reporter', 'imu.temperatureC()'],
  ['Communication', 'Print to serial', ['print', T('RoboCore V2 ready')], 'statement', 'Serial.println("RoboCore V2 ready");'],
  ['Communication', 'Serial begin', ['start serial at', D('115200'), 'baud'], 'statement', 'Serial.begin(115200);'],
  ['Communication', 'Serial read line', ['serial read line'], 'reporter', 'Serial.readStringUntil(\'\\n\')'],
];
const BLOCK = {}; // components by "Category/Name"

function buildBlockLibrary(parent) {
  const wrap = box({ name: 'Block library', dir: 'H', gap: 28, pad: 24, cross: 'start', parent, fill: 'color/bg/canvas', radius: 12, stroke: 'color/border/subtle' });
  const cols = {};
  for (const [cat] of BLOCK_CATS) {
    const c = box({ name: 'Category ' + cat, dir: 'V', gap: 14, cross: 'start', parent: wrap });
    inst('Block Category', { Category: cat, State: 'Active' }, c);
    cols[cat] = c;
  }
  for (const [cat, name, parts, kind, gen] of BLOCK_LIBRARY) {
    const role = roleOf(cat, kind);
    let node;
    if (kind === 'statement') node = makeBlock(role, parts, {});
    else if (kind === 'reporter' || kind === 'boolean') node = makeBlock('value', parts, { kind });
    else if (kind === 'hatC') node = makeCBlock([parts, []], [[]], { top: 'hat', bottom: 'flat', minW: 150 });
    else if (kind === 'c') node = makeCBlock([parts, []], [[]], { minW: 150 });
    else if (kind === 'cElse') node = makeCBlock([parts, ['else'], []], [[], []], { minW: 150 });
    const c = figma.createComponentFromNode(node);
    c.name = 'Block/' + cat + '/' + name;
    c.description = cat + ' · ' + role + ' block. Generates: ' + gen;
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

// ---- the sample "Blink" program -------------------------------------------
function buildBlinkProgram(o = {}) {
  const prog = figma.createFrame();
  prog.name = 'Program — Blink';
  prog.fills = []; prog.clipsContent = false;
  const onStart = makeCBlock([['on start'], []], [[blk('Communication/Serial begin'), blk('Communication/Print to serial')]], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — on start' });
  prog.appendChild(onStart); onStart.x = 0; onStart.y = 0;
  const kids = [blk('Output/Set built-in LED', { F1: 'HIGH' }), blk('Control/Wait', { F1: '1' })];
  if (o.insertion) kids.push(makeBlock('action', ['tone pin', D('8'), D('C4'), 'for', N('0.5'), 's'], { ghost: true, name: 'Insertion marker' }));
  kids.push(blk('Output/Set built-in LED', { F1: 'LOW' }), blk('Control/Wait', { F1: '1' }));
  const forever = makeCBlock([['forever'], []], [kids], { top: 'hat', bottom: 'flat', minW: 150, name: 'Stack — forever' });
  prog.appendChild(forever); forever.x = 0; forever.y = onStart.height + 36;
  if (o.selected) {
    const first = kids[0];
    const r = figma.createRectangle(); r.name = 'Selection'; r.fills = [];
    r.strokes = [paint('color/brand/default')]; r.strokeWeight = 3; r.strokeAlign = 'OUTSIDE'; r.cornerRadius = 8;
    forever.appendChild(r); r.resize(first.width + 6, first.height - BK.ND + 6); r.x = first.x - 3; r.y = first.y - 3;
  }
  prog.resize(Math.max(onStart.width, forever.width), forever.y + forever.height);
  return prog;
}
