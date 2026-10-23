// ============================================================================
// Brand parts shared by every piece: copy, logos, QR tile, icons, coding blocks
// (drawn like the RoboCore IDE's Blockly blocks) and an IDE illustration.
// ============================================================================

// ---- copy (one place, so every piece says the same thing)
// Framing: "designed in Zambia" (not made); the robot is a prototype, pilots come next.
const COPY = {
  tagline: ['BUILD.', 'CODE.', 'CREATE.'],
  oneLiner: 'The robot kit and coding app for young makers.',
  designed: 'Designed in Zambia',
  pillars: [
    ['BUILD', 'bot', 'Put together a real robot: motors, sensors, an arm and a smart controller.'],
    ['CODE', 'blocks', 'Drag blocks or write Arduino C++ in the RoboCore IDE, right in your browser.'],
    ['CREATE', 'zap', 'Make it drive, follow lines, dodge obstacles and play music.'],
  ],
  features: [['bot', 'A real robot'], ['blocks', 'Blocks or C++'], ['globe', 'Designed in Zambia']],
  drive: 'COME AND DRIVE IT!',
  stand: 'Try RoboCore at our stand',
  scan: 'Scan to follow RoboCore',
  web: 'www.plastalbotbuilders.com',
  linkedin: 'linkedin.com/company/plastal-bot-builders',
  maker: 'by',
  what: 'RoboCore is a robot you build yourself and a coding app to bring it to life. Start with drag-and-drop blocks, move on to real Arduino C++, and watch your code drive, sense and react.',
  inside: [
    ['cpu', 'ESP32-S3 controller with Wi-Fi and Bluetooth'],
    ['gauge', 'Two drive motors with encoders'],
    ['bot', 'Robot arm with a gripper on servo motors'],
    ['radio', 'Ultrasonic distance sensor'],
    ['activity', '3-channel line sensor'],
    ['repeat', 'Motion sensor (6-axis IMU)'],
    ['lightbulb', 'RGB light, buzzer and a USER button'],
    ['usb', 'USB-C and a rechargeable battery'],
  ],
  app: [
    'Blocks made for the robot: “move forward for 10 cm”, “turn right for 90°”, “when an obstacle is closer than 20 cm”.',
    'Switch to Arduino C++ whenever you are ready: the blocks show you the code they write.',
    'Runs in the browser. Upload over USB-C, or test on the preview board with no robot at all.',
  ],
  make: [['activity', 'Line follower'], ['radio', 'Obstacle avoider'], ['lightbulb', 'Traffic light'], ['play', 'Music player'], ['bot', 'Pick-and-place arm'], ['sparkles', 'Your own idea']],
  impact: 'Our team has been part of initiatives that have reached more than 8,000 young people in Zambia.',
  status: 'RoboCore V2 is our newest prototype. Pilots with schools and innovation hubs in Zambia come next.',
  support: 'Supported by Mukuba UniPod (UNDP) and the Copperbelt University.',
  about: 'Plastal-Bot Builders is a robotics education team from Zambia. We design hands-on kits and tools that help young people learn engineering by building real things.',
  // the idea behind RoboCore (facts as in the MIT Solve and timbuktoo applications; targets and plans stay future tense)
  ideaHead: 'EVERY STUDENT SHOULD GET TO BUILD A REAL ROBOT.',
  problem: 'Most students in Zambia learn engineering only from textbooks. Leading imported classroom robot kits cost about US$400 each before shipping and duties, so most schools never get one.',
  answer: 'RoboCore is our answer: a robot kit designed in Zambia, for Zambian classrooms, aiming for about half the price of leading imported kits.',
  ideaShort: 'Most students in Zambia learn engineering only from textbooks. RoboCore puts a real robot in their hands.',
  struggle: 'RoboCore doesn’t give students the answers. It asks them to build, test, fail and debug until their robot works.',
  origin: 'It started in 2021, when we built our first robot from recycled plastic and parts from broken DVD players and toy cars, because the parts we needed were hard to find.',
  journeyTitle: 'FROM SCRAP PARTS TO A CLASSROOM ROBOT',
  journey: [
    ['2021', 'Our first robot', 'Built from recycled plastic and parts from old DVD players and toy cars.'],
    ['2025', 'Version 1', 'A 3D-printed robot that balances itself on two wheels.'],
    ['2026', 'RoboCore V2', 'Our own circuit board, and a classroom robot with a gripper arm.'],
    ['NEXT', 'Into classrooms', 'Test the prototype, then pilots with schools and innovation hubs.'],
  ],
  different: [
    ['cpu', 'One board, not a tangle of modules', 'Controller, motor drivers, motion sensor and charging on one board we designed.'],
    ['download', 'A body any makerspace can print', 'The robot is 3D printed from digital files, so it could be made close to the schools it serves.'],
    ['grid', 'One board, many robots', 'The same board is designed to run a self-balancing robot, a driving robot with an arm, or your own design.'],
    ['globe', 'Designed in Zambia', 'By young Zambian engineers, for Zambian classrooms.'],
  ],
  boardTitle: 'OUR OWN CIRCUIT BOARD',
  boardLine: 'We designed RoboCore’s 4-layer board ourselves, so everything a classroom robot needs is in one place: beginners plug parts in instead of wiring them.',
  board: [
    ['cpu', 'ESP32-S3 controller with Wi-Fi and Bluetooth'],
    ['gauge', 'Drivers for two encoder motors'],
    ['repeat', '6-axis motion sensor'],
    ['bot', '4 servo outputs for the arm'],
    ['radio', 'Plugs for the ultrasonic and line sensors'],
    ['usb', 'USB-C charging and reverse-battery protection'],
  ],
  roadmapTitle: 'WHERE WE ARE',
  roadmap: [
    ['check-circle', 'DESIGNED', 'Robot, circuit board, box and coding app'],
    ['settings', 'BUILDING NOW', 'Our first prototypes'],
    ['play', 'NEXT', 'Pilots with schools and innovation hubs'],
    ['star', 'OUR GOAL', 'Kits made in Zambia, circuit boards included'],
  ],
  statsTitle: 'OUR WORK SO FAR',
  stats: [
    ['8,000+', 'young people reached by initiatives our team has been part of'],
    ['600+', 'learners introduced to robotics in our workshops on the Copperbelt'],
    ['100+', 'university students in the workshops we helped teach at Mukuba UniPod'],
    ['2026', 'Best Individual Project, Yango Pan-African Fellowship'],
  ],
  who: [
    ['graduation', 'Students', 'Build, code and debug a real machine, not just read about one.'],
    ['book-open', 'Teachers', 'A hands-on way to teach forces, circuits and programming.'],
    ['bot', 'Schools and hubs', 'A kit you own, for class after class, year after year.'],
  ],
};

// ---- logos
// RoboCore lockup from the box: wordmark (gear “o”) + “Zambia” between two rules. zambia:false = wordmark only.
function robocoreLogo(o = {}) {
  const R = ROBOCORE, vb = o.zambia === false ? R.word : R.viewBox;
  let inner = '<path d="' + R.letters + '" fill="#000"/><path d="' + R.gearOuter + '" fill="#000"/><path d="' + R.gearInner + '" fill="#000"/>';
  if (o.zambia !== false) {
    inner += '<path d="' + R.zambia + '" fill="#000"/>';
    for (const [x1, y1, x2, y2, sw] of R.lines) inner += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#000" stroke-width="' + sw + '"/>';
  }
  const svg = '<svg width="' + vb[2] + '" height="' + vb[3] + '" viewBox="' + vb.join(' ') + '" fill="none" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  const n = svgNode(svg, { w: o.w });
  inkAll(n, o.color || 'navy');
  return place(n, Object.assign({ name: o.zambia === false ? 'RoboCore wordmark' : 'RoboCore logo' }, o, { w: undefined }));
}
// Plastal-Bot Builders logo: black parts = ink, white details = knock (the background colour)
function plastalLogo(o = {}) {
  const n = svgNode(PLASTAL_SVG, { w: o.w });
  for (const v of n.findAll(x => x.type === 'VECTOR')) {
    const f = v.fills && v.fills[0];
    if (f && f.type === 'SOLID') v.fills = [paint(f.color.r > 0.5 ? (o.knock || 'cream') : (o.color || 'navy'))];
  }
  return place(n, Object.assign({ name: 'Plastal-Bot Builders logo' }, o, { w: undefined }));
}
// “by [Plastal-Bot Builders]”
function makerLine(o) {
  const g = stack({ dir: 'H', gap: o.h * 0.35, cross: 'center', name: 'Maker', parent: o.parent, x: o.x, y: o.y });
  text(COPY.maker, { kind: 'bodyM', size: o.h * 0.42, color: o.color || 'navy', parent: g });
  plastalLogo({ w: o.h * 803 / 279, color: o.color || 'navy', knock: o.knock, parent: g });
  return g;
}
// Geared Ring app mark (RoboCore IDE)
function appMark(o) {
  const m = APP_MARK.small, [x0, y0, x1, y1] = m.box;
  const svg = '<svg width="' + Math.round(x1 - x0) + '" height="' + Math.round(y1 - y0) + '" viewBox="' + x0 + ' ' + y0 + ' ' + (x1 - x0) + ' ' + (y1 - y0) + '" xmlns="http://www.w3.org/2000/svg">' +
    m.layers.map(l => '<path d="' + l.d + '" fill="#000" fill-rule="evenodd"/>').join('') + '</svg>';
  const n = svgNode(svg, { h: o.h }); inkAll(n, o.color || 'navy');
  return place(n, Object.assign({ name: 'Geared Ring' }, o, { h: undefined }));
}

// ---- QR code to the website, always navy on white with a 4-module quiet zone
function qrTile(o) {
  const s = o.size, mod = s / 37;
  const t = frame({ name: 'QR · ' + COPY.web, w: s, h: s, fill: 'white', radius: s * 0.05, parent: o.parent, x: o.x, y: o.y });
  const q = svgNode(QR_SVG, { w: mod * 29, parent: t, x: mod * 4, y: mod * 4 });
  inkAll(q, 'navy');
  return t;
}

// ---- icons (Lucide, 24 grid)
function icon(name, o) {
  const attrs = ' fill="none" stroke="#000" stroke-width="' + (o.sw || 2) + '" stroke-linecap="round" stroke-linejoin="round"';
  const body = (ICONS[name] || ICONS.zap).replace(/<(path|rect|circle|line|polyline|polygon|ellipse)\b/g, (m) => m + attrs);
  const n = svgNode('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>', { w: o.size });
  inkAll(n, o.color || 'navy');
  return place(n, Object.assign({ name: 'Icon · ' + name }, o, { size: undefined }));
}
function iconChip(name, o) {
  const d = o.d, c = frame({ name: 'Chip · ' + name, w: d, h: d, radius: d / 2, fill: o.fill || 'navy', parent: o.parent, x: o.x, y: o.y });
  icon(name, { size: d * 0.54, color: o.color || 'yellow', parent: c, x: d * 0.23, y: d * 0.23, sw: o.sw || 2 });
  return c;
}

// ---- coding blocks, drawn like the IDE's Blockly blocks (Zelos shapes, navy line-art outline)
const BK = { R: 6, NX: 16, NW: 28, NS: 6, ND: 6, IW: 20, CAP: 18, HATW: 96 };
const D = (v) => ({ t: 'drop', v }), N = (v) => ({ t: 'num', v });
function bstyle(cat) { const bright = cat === 'events'; return { fill: 'block/' + cat, text: bright ? 'navy' : 'cream', drop: bright ? 0.14 : 0.28 }; }
function rnd(n) { return Math.round(n * 100) / 100; }
function PathB() {
  const a = []; const api = {
    M: (x, y) => { a.push('M', rnd(x), rnd(y)); return api; }, L: (x, y) => { a.push('L', rnd(x), rnd(y)); return api; },
    Q: (cx, cy, x, y) => { a.push('Q', rnd(cx), rnd(cy), rnd(x), rnd(y)); return api; },
    C: (a1, b1, a2, b2, x, y) => { a.push('C', rnd(a1), rnd(b1), rnd(a2), rnd(b2), rnd(x), rnd(y)); return api; },
    Z: () => { a.push('Z'); return api; }, s: () => a.join(' '),
  }; return api;
}
function topEdge(p, w, top) {
  const { R, NX, NW, NS, ND, CAP, HATW } = BK;
  if (top === 'hat') { p.M(0, CAP).C(HATW * 0.25, -CAP / 3, HATW * 0.75, -CAP / 3, HATW, CAP).L(w - R, CAP).Q(w, CAP, w, CAP + R); return CAP; }
  p.M(0, R).Q(0, 0, R, 0).L(NX, 0).L(NX + NS, ND).L(NX + NW - NS, ND).L(NX + NW, 0).L(w - R, 0).Q(w, 0, w, R);
  return 0;
}
function bottomEdge(p, w, H, bottom) {
  const { R, NX, NW, NS, ND } = BK;
  p.L(w, H - R).Q(w, H, w - R, H);
  if (bottom !== 'flat') p.L(NX + NW, H).L(NX + NW - NS, H + ND).L(NX + NS, H + ND).L(NX, H);
  p.L(R, H).Q(0, H, 0, H - R).Z();
}
function hexPath(w, h) { const k = h / 2; return 'M ' + k + ' 0 L ' + rnd(w - k) + ' 0 L ' + w + ' ' + k + ' L ' + rnd(w - k) + ' ' + h + ' L ' + k + ' ' + h + ' L 0 ' + k + ' Z'; }
function shapeVec(d, cat, name) {
  const v = figma.createVector(); v.name = name || 'Shape';
  v.vectorPaths = [{ windingRule: 'NONZERO', data: d }];
  v.fills = [paint('block/' + cat)]; v.strokes = [paint('navy')]; v.strokeWeight = 1.25; v.strokeAlign = 'INSIDE';
  return v;
}
function partsRow(parts, cat, minH) {
  const st = bstyle(cat);
  const row = stack({ dir: 'H', gap: 8, pad: [0, 12, 0, 12], cross: 'center', name: 'Content' });
  for (const p of parts) {
    if (typeof p === 'string') { text(p, { kind: 'bodyS', size: 13, color: st.text, parent: row }); continue; }
    if (p.t === 'drop') {
      const f = stack({ dir: 'H', gap: 5, pad: [0, 7, 0, 8], cross: 'center', fill: 'navy', fillOpacity: st.drop, radius: 4, parent: row, name: 'Dropdown' });
      text(p.v, { kind: 'bodyS', size: 12, color: st.text, parent: f });
      const ch = figma.createVector(); ch.name = 'Chevron'; ch.vectorPaths = [{ windingRule: 'NONE', data: 'M 0 0 L 4 4 L 8 0' }];
      ch.strokes = [paint(st.text)]; ch.strokeWeight = 1.6; ch.strokeCap = 'ROUND'; ch.strokeJoin = 'ROUND'; f.appendChild(ch);
      f.counterAxisSizingMode = 'FIXED'; f.resize(f.width, 24);
    } else if (p.t === 'num') {
      const f = stack({ dir: 'H', pad: [0, 10, 0, 10], cross: 'center', fill: 'white', radius: 12, parent: row, name: 'Field' });
      text(p.v, { kind: 'bodyS', size: 12, color: 'navy', parent: f });
      f.counterAxisSizingMode = 'FIXED'; f.resize(Math.max(32, f.width), 24); f.primaryAxisAlignItems = 'CENTER';
    } else if (p.t === 'icon') {
      icon(p.v, { size: 16, color: st.text, parent: row });
    } else if (p.t === 'bool') {
      row.appendChild(boolBlock(p.parts, p.cat));
    }
  }
  row.counterAxisSizingMode = 'FIXED'; row.resize(Math.max(1, row.width), Math.max(minH || 40, Math.ceil(row.height) + 12));
  return row;
}
function boolBlock(parts, cat) {
  const row = partsRow(parts, cat, 32);
  row.paddingLeft = 16; row.paddingRight = 16;
  const w = Math.ceil(row.width), h = Math.ceil(row.height);
  const g = frame({ name: 'Boolean', w, h });
  g.appendChild(shapeVec(hexPath(w, h), cat)); g.appendChild(row); row.x = 0; row.y = 0;
  return g;
}
function blockStat(parts, cat, o = {}) {
  const row = partsRow(parts, cat, 40);
  const w = Math.max(o.minW || 0, Math.ceil(row.width));
  const p = PathB(); const top = topEdge(p, w, o.top); const H = top + row.height; bottomEdge(p, w, H, o.bottom);
  const g = frame({ name: o.name || 'Block', w, h: H + (o.bottom === 'flat' ? 0 : BK.ND) });
  g.appendChild(shapeVec(p.s(), cat)); g.appendChild(row); row.x = 0; row.y = top;
  PITCH.set(g.id, H);
  return g;
}
const PITCH = new Map();
function pitchOf(n) { return PITCH.has(n.id) ? PITCH.get(n.id) : n.height - BK.ND; }
// C-shaped block: arms = [[parts], [else parts]..., []]; mouths = [[blocks], [blocks]]
function blockC(arms, mouths, o = {}) {
  const { R, NX, NW, NS, ND, IW } = BK, cat = o.cat || 'control';
  const rows = arms.map((parts, i) => parts && parts.length ? partsRow(parts, cat, i === 0 ? 40 : 32) : null);
  const w = Math.max(o.minW || 150, ...rows.filter(Boolean).map(r => Math.ceil(r.width)));
  const p = PathB(); let y = topEdge(p, w, o.top); const yT = y; const marks = [];
  arms.forEach((parts, i) => {
    const armH = rows[i] ? rows[i].height : (i === arms.length - 1 ? 24 : 32);
    if (i === arms.length - 1) { marks.push({ arm: y }); y += armH; bottomEdge(p, w, y, o.bottom); return; }
    const kids = mouths[i] || [], mh = kids.length ? kids.reduce((s, k) => s + pitchOf(k), 0) : 24;
    const y1 = y + armH; marks.push({ arm: y, mouth: y1 });
    p.L(w, y1 - R).Q(w, y1, w - R, y1);
    p.L(IW + NX + NW, y1).L(IW + NX + NW - NS, y1 + ND).L(IW + NX + NS, y1 + ND).L(IW + NX, y1).L(IW + R, y1).Q(IW, y1, IW, y1 + R);
    const y2 = y1 + mh;
    p.L(IW, y2 - R).Q(IW, y2, IW + R, y2);
    p.L(IW + NX, y2).L(IW + NX + NS, y2 + ND).L(IW + NX + NW - NS, y2 + ND).L(IW + NX + NW, y2).L(w - R, y2).Q(w, y2, w, y2 + R);
    y = y2;
  });
  const g = frame({ name: o.name || 'C-block', w, h: y + (o.bottom === 'flat' ? 0 : ND) });
  g.appendChild(shapeVec(p.s(), cat));
  let maxW = w;
  marks.forEach((m, i) => {
    if (rows[i]) { g.appendChild(rows[i]); rows[i].x = 0; rows[i].y = m.arm; }
    if (m.mouth !== undefined) { let yy = m.mouth; for (const k of (mouths[i] || [])) { g.appendChild(k); k.x = IW; k.y = yy; yy += pitchOf(k); maxW = Math.max(maxW, IW + k.width); } }
  });
  g.resize(maxW, g.height);
  PITCH.set(g.id, y);
  return g;
}
// the Obstacle avoider program from the IDE design, at 1× (IDE pixels); rescale the result
function avoiderProgram(o = {}) {
  const prog = frame({ name: 'Blocks · Obstacle avoider' });
  const onStart = blockC([['on start'], []], [[blockStat([{ t: 'icon', v: 'bot' }, 'set movement speed to', N('50'), '%'], 'movement')]], { top: 'hat', bottom: 'flat', cat: 'events', name: 'on start' });
  prog.appendChild(onStart);
  const near = [blockStat([{ t: 'icon', v: 'bot' }, 'stop moving'], 'movement'), blockStat(['play beep', D('C5'), 'for', N('0.2'), 's'], 'light'), blockStat([{ t: 'icon', v: 'bot' }, 'turn', D('right'), 'for', N('90'), '°'], 'movement')];
  const clear = [blockStat([{ t: 'icon', v: 'bot' }, 'start moving', D('forward')], 'movement')];
  const ifb = blockC([['if', { t: 'bool', cat: 'sensors', parts: ['is obstacle closer than', N('20'), 'cm?'] }, 'then'], ['else'], []], [near, clear], { cat: 'control', name: 'if obstacle' });
  const forever = blockC([['forever'], []], [[ifb]], { top: 'hat', bottom: 'flat', cat: 'events', name: 'forever' });
  prog.appendChild(forever); forever.y = onStart.height + 28;
  prog.resize(Math.max(onStart.width, forever.width), forever.y + forever.height);
  return prog;
}
const AVOIDER_CPP = [
  'void setup() {', '  robot.setSpeed(50);', '}', '', 'void loop() {', '  if (sonar.distanceCm() < 20) {', '    robot.stop();',
  '    RoboCore::beep(523, 200);', '    robot.turn(90);', '  } else {', '    robot.start(FORWARD);', '  }', '}',
].join('\n');

// IDE illustration (blocks + the C++ they write), drawn at 1× IDE pixels then scaled to width w
function ideCard(o) {
  const W = 980, H = 560;
  const win = frame({ name: 'RoboCore IDE · illustration', w: W, h: H, fill: 'paper', radius: 14, stroke: 'navy', strokeW: 2, clip: true });
  const bar = frame({ name: 'Top bar', w: W, h: 48, fill: 'yellow', parent: win });
  appMark({ h: 22, color: 'navy', parent: bar, x: 18, y: 13 });
  text('RoboCore IDE', { kind: 'display', size: 20, color: 'navy', parent: bar, x: 70, y: 11, ls: 2, upper: true });
  for (const [i, [lab, filled]] of [['Upload', true], ['Verify', false]].entries()) {
    const b = frame({ name: lab, w: 92, h: 30, radius: 6, fill: filled ? 'navy' : null, stroke: 'navy', strokeW: 1.5, parent: bar, x: W - 18 - 92 - i * 102, y: 9 });
    text(lab, { kind: 'bodyS', size: 14, color: filled ? 'cream' : 'navy', parent: b, x: 0, y: 6, w: 92, align: 'CENTER' });
  }
  const tb = frame({ name: 'Toolbox', w: 150, h: H - 48, fill: 'cream', parent: win, x: 0, y: 48 });
  const cats = [['Events', 'events'], ['Movement', 'movement'], ['Motors', 'motors'], ['Light & Sound', 'light'], ['Sensors', 'sensors'], ['Control', 'control'], ['Operators', 'operators'], ['Variables', 'variables'], ['My Blocks', 'myblocks'], ['Pins & Serial', 'pins']];
  cats.forEach(([lab, k], i) => {
    ellipse({ w: 14, fill: 'block/' + k, stroke: 'navy', strokeW: 1, parent: tb, x: 16, y: 20 + i * 34 });
    text(lab, { kind: i === 1 ? 'bodyS' : 'bodyM', size: 13, color: 'navy', parent: tb, x: 40, y: 17 + i * 34 });
  });
  const prog = avoiderProgram(); win.appendChild(prog); prog.rescale(0.86); prog.x = 180; prog.y = 76;
  const code = frame({ name: 'C++', w: 300, h: H - 48, fill: 'navy', parent: win, x: W - 300, y: 48 });
  text('C++ FROM YOUR BLOCKS', { kind: 'head', size: 13, color: 'yellow', ls: 8, parent: code, x: 20, y: 20 });
  const t = text(AVOIDER_CPP, { kind: 'mono', size: 13, lh: 1.55, color: 'cream', parent: code, x: 20, y: 52 });
  for (const kw of ['void', 'if', 'else']) { let i = -1; while ((i = AVOIDER_CPP.indexOf(kw + ' ', i + 1)) >= 0) t.setRangeFills(i, i + kw.length, [paint('yellow')]); }
  win.rescale(o.w / W);
  return place(win, o);
}

// ---- pillar (icon chip + title + one line), for light or dark grounds
function pillar(p, o) {
  const [title, ic, body] = p, dark = o.on === 'navy';
  const g = stack({ gap: o.size * 0.35, w: o.w, name: 'Pillar · ' + title, parent: o.parent, x: o.x, y: o.y });
  iconChip(ic, { d: o.chip, fill: dark ? 'yellow' : 'navy', color: dark ? 'navy' : 'yellow', parent: g });
  stxt(g, title, { kind: 'display', size: o.size, color: dark ? 'yellow' : 'navy', ls: 2 });
  stxt(g, body, { kind: 'bodyM', size: o.body, lh: 1.3, color: dark ? 'cream' : 'navy' });
  return g;
}
// icon + text rows (spec list)
function iconList(items, o) {
  const g = stack({ gap: o.gap, w: o.w, name: o.name || 'List', parent: o.parent, x: o.x, y: o.y });
  for (const [ic, label] of items) {
    const r = stack({ dir: 'H', gap: o.size * 0.6, cross: 'center', parent: g, name: label.slice(0, 30) });
    icon(ic, { size: o.size * 1.25, color: o.iconColor || 'navy', parent: r, sw: 2 });
    text(label, { kind: o.kind || 'bodyM', size: o.size, color: o.color || 'navy', parent: r });
  }
  return g;
}
// icon chip + bold title + a line of text, one row per item (what makes it different, the roadmap)
function featureRows(items, o) {
  const g = stack({ gap: o.gap, w: o.w, name: o.name || 'Rows', parent: o.parent, x: o.x, y: o.y });
  for (const [ic, title, body] of items) {
    const r = stack({ dir: 'H', gap: o.chip * 0.4, parent: g, name: title });
    iconChip(ic, { d: o.chip, fill: o.chipFill || 'navy', color: o.chipInk || 'yellow', parent: r });
    const t = stack({ gap: o.size * 0.2, w: o.w - o.chip * 1.4, parent: r });
    stxt(t, title, { kind: o.titleKind || 'bodyB', size: o.size, lh: 1.2, color: o.color || 'navy', ls: o.titleLs });
    stxt(t, body, { kind: 'body', size: o.body, lh: 1.3, color: o.color || 'navy' });
  }
  return g;
}
// big numbers with a short label, in rows of `cols`
function statsGrid(items, o) {
  const cols = o.cols || items.length, colW = o.w / cols, rowGap = o.rowGap || o.size * 0.45;
  const g = frame({ name: o.name || 'Numbers', w: o.w, h: 1, parent: o.parent, x: o.x, y: o.y });
  const cells = items.map(([num, label]) => {
    const s = stack({ gap: o.size * 0.12, w: colW - (o.gutter || colW * 0.08), parent: g, name: num });
    stxt(s, num, { kind: 'display', size: o.size, color: o.numColor || o.color || 'navy' });
    stxt(s, label, { kind: 'bodyM', size: o.label, lh: 1.3, color: o.color || 'navy' });
    return s;
  });
  let y = 0;
  for (let r = 0; r * cols < cells.length; r++) {
    const row = cells.slice(r * cols, r * cols + cols);
    row.forEach((s, i) => { s.x = i * colW; s.y = y; });
    y += Math.max(...row.map(s => s.height)) + rowGap;
  }
  g.resize(o.w, Math.max(1, y - rowGap));
  return g;
}
// a rule with a dot per step (the last one open: still to come), then year, title and a line under each dot
function timeline(steps, o) {
  const ink = o.color || 'navy', d = o.dot, n = steps.length, colW = o.w / n;
  const g = frame({ name: o.name || 'Timeline', w: o.w, h: d, parent: o.parent, x: o.x, y: o.y });
  rect({ name: 'Rule', w: (n - 1) * colW, h: d * 0.16, fill: ink, parent: g, x: d / 2, y: d * 0.42 });
  let H = d;
  steps.forEach(([year, title, body], i) => {
    const open = i === n - 1;
    ellipse({ w: d, fill: open ? (o.bg || 'yellow') : ink, stroke: ink, strokeW: d * 0.16, parent: g, x: i * colW, y: 0, name: 'Dot · ' + year });
    const s = stack({ gap: o.size * 0.25, w: colW - (o.gutter || colW * 0.1), parent: g, x: i * colW, y: d + o.size * 0.7, name: year });
    stxt(s, year, { kind: 'display', size: o.size * 1.6, color: ink, ls: 1 });
    stxt(s, title, { kind: 'bodyB', size: o.size, lh: 1.2, color: ink });
    stxt(s, body, { kind: 'bodyM', size: o.size * 0.86, lh: 1.3, color: ink });
    H = Math.max(H, s.y + s.height);
  });
  g.resize(o.w, H);
  return g;
}
// warn when a block runs past the line it must stay above (layout checks show up in the build report)
function mustEnd(node, limit, what) { if (node.y + node.height > limit + 0.5) warn(what + ' runs ' + ((node.y + node.height - limit) / MM).toFixed(1) + ' mm too far'); }

// the headline, one word per line
function taglineStack(o) {
  const g = stack({ gap: 0, name: 'Tagline', parent: o.parent, x: o.x, y: o.y });
  COPY.tagline.forEach((w, i) => text(w, { kind: 'display', size: o.size, lh: o.lh || 0.92, color: (o.colors || [])[i] || o.color || 'navy', parent: g }));
  return g;
}
// hidden guides: trim line and safe area (switch the layer on to check a layout)
function guides(art, o) {
  const g = frame({ name: 'Guides (hidden: trim + safe area)', w: art.width, h: art.height, parent: art });
  rect({ name: 'Trim', w: o.trimW, h: o.trimH, x: o.bleedL, y: o.bleedT, stroke: '#E0245E', strokeW: 1.5, dash: [8, 6], parent: g });
  rect({ name: 'Safe area', w: o.trimW - 2 * o.safe, h: o.trimH - 2 * o.safe - (o.safeB || 0), x: o.bleedL + o.safe, y: o.bleedT + o.safe, stroke: '#2F6BBF', strokeW: 1.5, dash: [4, 6], parent: g });
  g.visible = false;
  return g;
}

// ---- orthographic renders (Blender Cycles, 3d/render_views.py, Fusion v36): transparent PNGs with a soft floor shadow
const HERO = 'renders/robot_iso_fl.png';
const BOARD = 'renders/board_v2_iso.png';                   // KiCad 3D render of the V2 controller (kicad-cli pcb render)
const ROBOT_MM = { w: 167, l: 278, h: 118 };                 // v36 bounding box, arm included
const RENDER_MARGIN = 1.08;                                    // renders frame the model's bounding box with 4 % each side
const USED_IMAGES = ['robot_lineart.png', HERO, 'renders/robot_iso_fr.png', 'renders/robot_iso_rr.png', 'renders/robot_front.png', 'renders/robot_back.png',
  'renders/robot_left.png', 'renders/robot_right.png', 'renders/robot_top.png', 'renders/box_closed_iso_fl.png', 'renders/box_closed_iso_fr.png',
  'renders/box_closed_front.png', 'renders/box_closed_top.png', 'renders/box_open_iso_fl.png', 'renders/box_open_iso_fr.png', BOARD];
// image scaled to fit inside maxW × maxH (keeps the aspect), centred in that box when o.center
function fitImage(name, o) {
  const [pw, ph] = IMG_SIZE[name] || [1, 1];
  const k = Math.min(o.maxW / pw, o.maxH / ph);
  const w = pw * k, h = ph * k;
  const r = imageRect(name, { w, h, parent: o.parent, name: o.name || 'Image · ' + name });
  r.x = (o.x || 0) + (o.center ? (o.maxW - w) / 2 : 0);
  r.y = (o.y || 0) + (o.center === 'bottom' ? o.maxH - h : (o.center ? (o.maxH - h) / 2 : 0));
  return r;
}
// dimension line with end ticks and a label (horizontal: label below; vertical: label left, reading upwards)
function dimLine(parent, x1, y1, x2, y2, label, o) {
  const t = o.tick, vert = Math.abs(x2 - x1) < 0.01;
  const d = vert ? `M ${x1} ${y1} L ${x2} ${y2} M ${x1 - t} ${y1} L ${x1 + t} ${y1} M ${x2 - t} ${y2} L ${x2 + t} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2} M ${x1} ${y1 - t} L ${x1} ${y1 + t} M ${x2} ${y2 - t} L ${x2} ${y2 + t}`;
  const v = figma.createVector(); v.name = 'Dimension ' + label; v.vectorPaths = [{ windingRule: 'NONE', data: d }];
  v.strokes = [paint(o.color)]; v.strokeWeight = o.weight; v.strokeCap = 'SQUARE'; parent.appendChild(v);
  const tx = text(label, { kind: 'bodyM', size: o.size, color: o.color, parent, name: 'Dim · ' + label });
  if (vert) { tx.rotation = 90; tx.x = x1 - o.size * 1.6 - tx.height * 0; tx.y = (y1 + y2) / 2 + tx.width / 2; }
  else { tx.x = (x1 + x2) / 2 - tx.width / 2; tx.y = y1 + o.size * 0.5; }
  return v;
}
// front | side | top, all at the same scale s (pt per real mm), with dimensions and view names
function viewsStrip(o) {
  const s = o.s, gap = o.gap || mm(40), color = o.color || 'navy';
  const g = frame({ name: 'Orthographic views (1 : ' + (1 / (s / MM)).toFixed(2).replace(/\.?0+$/, '') + ')', parent: o.parent, x: o.x, y: o.y });
  const items = [['FRONT', 'renders/robot_front.png', ROBOT_MM.w, ROBOT_MM.h], ['SIDE', 'renders/robot_left.png', ROBOT_MM.l, ROBOT_MM.h], ['TOP', 'renders/robot_top.png', ROBOT_MM.w, ROBOT_MM.l]];
  const H = Math.max(...items.map(i => i[3])) * s * RENDER_MARGIN;
  const lab = o.label || s * 9, dimS = o.dim || s * 7, tick = s * 3, wgt = Math.max(0.5, s * 0.5);
  let x = o.vdim === false ? 0 : dimS * 3;
  items.forEach(([name, img, wmm, hmm], i) => {
    const iw = wmm * s * RENDER_MARGIN, ih = hmm * s * RENDER_MARGIN, m = (RENDER_MARGIN - 1) / 2 / RENDER_MARGIN;
    imageRect(img, { w: iw, h: ih, parent: g, x, y: H - ih, name: 'View · ' + name });
    const x1 = x + iw * m, x2 = x + iw * (1 - m), yb = H - ih * m;
    dimLine(g, x1, yb + dimS * 1.4, x2, yb + dimS * 1.4, wmm + ' mm', { tick, weight: wgt, size: dimS, color });
    if (i === 0 && o.vdim !== false) dimLine(g, x - dimS * 0.6, H - ih + ih * m, x - dimS * 0.6, yb, hmm + ' mm', { tick, weight: wgt, size: dimS, color });
    text(name, { kind: 'head', size: lab, ls: 12, color, parent: g, x: x1, y: yb + dimS * 3.6, name: 'View name · ' + name });
    x += iw + gap;
  });
  g.resize(x - gap, H + dimS * 3.6 + lab * 1.6);
  return g;
}
