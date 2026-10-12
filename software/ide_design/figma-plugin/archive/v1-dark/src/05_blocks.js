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
