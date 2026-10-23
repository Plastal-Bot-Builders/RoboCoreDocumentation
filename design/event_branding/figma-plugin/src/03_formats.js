// ============================================================================
// The pieces. Each artboard = trim + bleed, in points (exports as a true-size PDF).
// X(mm), Y(mm) place things from the TRIM corner; everything important stays
// inside the safe area. Each artboard carries a hidden "Guides" layer.
// ============================================================================

function artboard(page, o) {
  const b = typeof o.bleed === 'object' ? o.bleed : { l: o.bleed || 0, t: o.bleed || 0, r: o.bleed || 0, b: o.bleed || 0 };
  const W = mm(o.trimW + b.l + b.r), H = mm(o.trimH + b.t + b.b);
  const f = frame({ name: o.name, w: W, h: H, fill: o.bg, clip: true, parent: page, x: o.x || 0, y: o.y || 0 });
  f.exportSettings = [{ format: 'PDF' }];
  const X = (v) => mm(b.l + v), Y = (v) => mm(b.t + v);
  const done = () => { guides(f, { trimW: mm(o.trimW), trimH: mm(o.trimH), bleedL: mm(b.l), bleedT: mm(b.t), safe: mm(o.safe || 5), safeB: mm(o.safeB || 0) }); REPORT.counts.artboards = (REPORT.counts.artboards || 0) + 1; return f; };
  return { f, X, Y, W, H, b, done };
}
const cx = (node, W) => { node.x = (W - node.width) / 2; return node; };
// spec card shown beside an artboard (not printed)
function specCard(page, x, y, title, rows, w = 900) {
  const c = stack({ gap: 10, pad: 28, w, fill: 'white', radius: 16, stroke: 'navy', strokeOpacity: 0.15, name: 'Spec · ' + title, parent: page, x, y });
  stxt(c, title, { kind: 'display', size: 30, color: 'navy', ls: 1, upper: true });
  for (const [k, v] of rows) {
    const r = stack({ dir: 'H', gap: 16, parent: c, name: k });
    text(k, { kind: 'bodyS', size: 15, color: 'navy', parent: r, w: 170 });
    text(v, { kind: 'body', size: 15, color: 'navy', parent: r, w: w - 56 - 186, lh: 1.35 });
  }
  return c;
}

// ---------------------------------------------------------------- roll-up banner 850 × 2000 mm
function buildRollup(page, x, y) {
  const A = artboard(page, { name: 'Roll-up banner · 850 × 2000 mm (+5 mm bleed, +100 mm base)', trimW: 850, trimH: 2000, bleed: { l: 5, t: 5, r: 5, b: 105 }, bg: 'yellow', x, y, safe: 30 });
  const { f, X, Y, W } = A;
  contourLines(f, f.width, f.height, 'ochre', 0.28, mm(1.4));
  cx(robocoreLogo({ w: mm(640), color: 'navy', parent: f, y: Y(110) }), W);
  const tg = taglineStack({ size: mm(150), parent: f, y: Y(335) }); tg.counterAxisAlignItems = 'CENTER'; cx(tg, W);
  cx(text(COPY.oneLiner, { kind: 'bodyS', size: mm(34), lh: 1.15, color: 'navy', w: mm(760), align: 'CENTER', parent: f, y: Y(775) }), W);
  mustEnd(cx(text(COPY.ideaShort, { kind: 'bodyM', size: mm(25), lh: 1.3, color: 'navy', w: mm(740), align: 'CENTER', parent: f, y: Y(840), name: 'The idea' }), W), Y(965), 'Roll-up idea line');
  // robot on navy (the render's floor shadow is made for navy)
  const panel = frame({ name: 'Robot panel', w: mm(780), h: mm(600), fill: 'navy', radius: mm(46), clip: true, parent: f, x: X(35), y: Y(985) });
  contourLines(panel, panel.width, panel.height, 'cream', 0.08, mm(1.2));
  fitImage(HERO, { maxW: mm(720), maxH: mm(520), parent: panel, x: mm(30), y: mm(22), center: true });
  text('RoboCore V2 · prototype', { kind: 'bodyS', size: mm(17), color: 'cream', colorOpacity: 0.8, parent: panel, x: mm(34), y: mm(548) });
  COPY.features.forEach(([ic, label], i) => {
    const colX = X(35 + i * 260);
    const chip = iconChip(ic, { d: mm(78), fill: 'navy', color: 'yellow', parent: f, y: Y(1615) }); chip.x = colX + (mm(260) - chip.width) / 2;
    const t = text(label, { kind: 'display', size: mm(31), lh: 1.0, color: 'navy', w: mm(250), align: 'CENTER', parent: f, y: Y(1702), upper: true, ls: 1 }); t.x = colX + mm(5);
  });
  rect({ name: 'CTA band', w: f.width, h: f.height - Y(1790), fill: 'navy', parent: f, x: 0, y: Y(1790) });
  qrTile({ size: mm(172), parent: f, x: X(40), y: Y(1810) });
  text(COPY.drive, { kind: 'display', size: mm(66), color: 'yellow', parent: f, x: X(245), y: Y(1806), ls: 1 });
  text(COPY.scan, { kind: 'bodyM', size: mm(26), color: 'cream', parent: f, x: X(247), y: Y(1882) });
  text(COPY.web, { kind: 'bodyB', size: mm(29), color: 'yellow', parent: f, x: X(247), y: Y(1914) });
  makerLine({ h: mm(30), color: 'cream', knock: 'navy', parent: f, x: X(247), y: Y(1952) });
  return A.done();
}

// ---------------------------------------------------------------- pop-up stand, 3×3 curved fabric (2880 × 2230 mm typical)
function buildPopup(page, x, y) {
  const A = artboard(page, { name: 'Pop-up stand · 3×3 curved · 2880 × 2230 mm (+25 mm bleed)', trimW: 2880, trimH: 2230, bleed: 25, bg: 'navy', x, y, safe: 50 });
  const { f, X, Y } = A;
  const left = frame({ name: 'Yellow field', w: X(1320), h: f.height, fill: 'yellow', clip: true, parent: f });
  contourLines(left, left.width, left.height, 'ochre', 0.28, mm(1.8));
  const right = frame({ name: 'Navy field', w: f.width - X(1320), h: f.height, clip: true, parent: f, x: X(1320) });
  contourLines(right, right.width, right.height, 'cream', 0.08, mm(1.8));
  // top zone (above the counter, 1,000 mm and up): logo, headline, robot
  robocoreLogo({ w: mm(900), color: 'navy', parent: f, x: X(300), y: Y(170) });
  taglineStack({ size: mm(190), parent: f, x: X(292), y: Y(520) });
  text(COPY.oneLiner, { kind: 'bodyS', size: mm(54), lh: 1.15, color: 'navy', w: mm(930), parent: f, x: X(300), y: Y(1080) });
  fitImage(HERO, { maxW: mm(1300), maxH: mm(860), parent: f, x: X(1400), y: Y(40), center: true });
  // the idea (text stays 300 mm in from the stand's ends: it wraps round them)
  const idea = stack({ gap: mm(16), w: mm(1190), parent: f, x: X(1390), y: Y(925), name: 'The idea' });
  stxt(idea, 'THE IDEA', { kind: 'head', size: mm(30), ls: 12, color: 'yellow' });
  stxt(idea, COPY.ideaHead, { kind: 'display', size: mm(64), lh: 0.95, color: 'cream', ls: 1 });
  stxt(idea, COPY.problem + ' ' + COPY.answer, { kind: 'bodyM', size: mm(26), lh: 1.3, color: 'cream' });
  mustEnd(idea, Y(1300), 'Pop-up idea block');
  // lower zone: pillars and the journey on yellow; views strip, QR and numbers on navy
  const pills = COPY.pillars.map((p, i) => pillar(p, { w: mm(290), chip: mm(110), size: mm(62), body: mm(30), parent: f, x: X(300 + i * 320), y: Y(1270) }));
  const jy = Math.max(...pills.map(n => n.y + n.height)) + mm(60);
  const jt = text(COPY.journeyTitle, { kind: 'display', size: mm(46), color: 'navy', ls: 1, parent: f, x: X(300), y: jy });
  mustEnd(timeline(COPY.journey, { w: mm(940), dot: mm(26), size: mm(22), color: 'navy', bg: 'yellow', parent: f, x: X(300), y: jy + jt.height + mm(24), name: 'Journey' }), Y(2180), 'Pop-up journey');
  viewsStrip({ s: mm(1), color: 'cream', gap: mm(45), label: mm(28), dim: mm(21), parent: f, x: X(1390), y: Y(1320) });
  text('SHOWN AT ACTUAL SIZE', { kind: 'head', size: mm(26), ls: 12, color: 'yellow', parent: f, x: X(1390), y: Y(1330) });
  qrTile({ size: mm(260), parent: f, x: X(2290), y: Y(1330) });
  text(COPY.scan, { kind: 'bodyM', size: mm(26), color: 'cream', parent: f, x: X(2290), y: Y(1612) });
  text(COPY.web, { kind: 'bodyB', size: mm(20), color: 'yellow', parent: f, x: X(2290), y: Y(1660) });
  statsGrid([COPY.stats[0], COPY.stats[1], COPY.stats[3]], { w: mm(1190), cols: 3, size: mm(76), label: mm(21), color: 'cream', numColor: 'yellow', parent: f, x: X(1390), y: Y(1765) });
  text(COPY.drive, { kind: 'display', size: mm(110), color: 'yellow', parent: f, x: X(1380), y: Y(1955), ls: 1 });
  makerLine({ h: mm(62), color: 'cream', knock: 'navy', parent: f, x: X(2330), y: Y(1990) });
  return A.done();
}

// ---------------------------------------------------------------- outdoor banner 3000 × 1000 mm (PVC, hemmed, eyelets)
function buildBanner(page, x, y) {
  const A = artboard(page, { name: 'Outdoor banner · 3000 × 1000 mm (no bleed: hemmed, eyelets every 500 mm)', trimW: 3000, trimH: 1000, bleed: 0, bg: 'navy', x, y, safe: 60 });
  const { f, X, Y } = A;
  contourLines(f, f.width, f.height, 'cream', 0.08, mm(1.6));
  robocoreLogo({ w: mm(880), color: 'yellow', parent: f, x: X(95), y: Y(95) });
  const t1 = text('BUILD. CODE.', { kind: 'display', size: mm(190), lh: 0.92, color: 'cream', parent: f, x: X(88), y: Y(420) });
  text('CREATE.', { kind: 'display', size: mm(190), lh: 0.92, color: 'yellow', parent: f, x: X(88), y: Y(420) + t1.height });
  text(COPY.oneLiner, { kind: 'bodyS', size: mm(44), color: 'cream', parent: f, x: X(95), y: Y(850) });
  fitImage(HERO, { maxW: mm(1100), maxH: mm(880), parent: f, x: X(1290), y: Y(60), center: true });
  qrTile({ size: mm(360), parent: f, x: X(2470), y: Y(110) });
  text(COPY.scan, { kind: 'bodyM', size: mm(34), color: 'cream', parent: f, x: X(2470), y: Y(500) });
  text(COPY.web, { kind: 'bodyB', size: mm(31), color: 'yellow', parent: f, x: X(2470), y: Y(555) });
  makerLine({ h: mm(80), color: 'cream', knock: 'navy', parent: f, x: X(2470), y: Y(640) });
  return A.done();
}

// ---------------------------------------------------------------- A5 flyer 148 × 210 mm, two sides
function buildFlyer(page, x, y) {
  // front
  const A = artboard(page, { name: 'Flyer A5 · front · 148 × 210 mm (+3 mm bleed)', trimW: 148, trimH: 210, bleed: 3, bg: 'yellow', x, y, safe: 6 });
  const { f, X, Y, W } = A;
  contourLines(f, f.width, f.height, 'ochre', 0.3, 0.6);
  cx(robocoreLogo({ w: mm(96), color: 'navy', parent: f, y: Y(12) }), W);
  const tg = taglineStack({ size: mm(20), parent: f, y: Y(47) }); tg.counterAxisAlignItems = 'CENTER'; cx(tg, W);
  cx(text(COPY.oneLiner, { kind: 'bodyS', size: mm(4.4), lh: 1.2, color: 'navy', w: mm(118), align: 'CENTER', parent: f, y: Y(112) }), W);
  const panel = frame({ name: 'Robot panel', w: f.width, h: f.height - Y(126), fill: 'navy', clip: true, parent: f, x: 0, y: Y(126) });
  contourLines(panel, panel.width, panel.height, 'cream', 0.08, 0.6);
  fitImage(HERO, { maxW: panel.width - mm(24), maxH: mm(62), parent: panel, x: mm(12), y: mm(2), center: true });
  text('TRY IT AT OUR STAND', { kind: 'display', size: mm(5.2), color: 'yellow', ls: 1, parent: f, x: X(8), y: Y(196) });
  const web = text(COPY.web, { kind: 'bodyS', size: mm(3.4), color: 'cream', parent: f, y: Y(197.4) }); web.x = X(140) - web.width;
  A.done();
  // back
  const B = artboard(page, { name: 'Flyer A5 · back · 148 × 210 mm (+3 mm bleed)', trimW: 148, trimH: 210, bleed: 3, bg: 'cream', x: x + A.W + 200, y, safe: 6 });
  const g = B.f;
  const s1 = stack({ gap: mm(3), w: mm(128), parent: g, x: B.X(10), y: B.Y(11), name: 'What is RoboCore' });
  stxt(s1, 'WHAT IS ROBOCORE?', { kind: 'display', size: mm(7.2), color: 'navy', ls: 1 });
  stxt(s1, COPY.what, { kind: 'bodyM', size: mm(3.5), lh: 1.35, color: 'navy' });
  COPY.pillars.forEach((p, i) => pillar(p, { w: mm(38.5), chip: mm(12), size: mm(5.4), body: mm(3.2), parent: g, x: B.X(10 + i * 44.7), y: B.Y(46) }));
  const s2 = stack({ gap: mm(2.4), w: mm(76), parent: g, x: B.X(10), y: B.Y(96), name: 'Inside' });
  stxt(s2, 'WHAT’S INSIDE', { kind: 'display', size: mm(5.6), color: 'navy', ls: 1 });
  iconList(COPY.inside, { gap: mm(1.6), w: mm(76), size: mm(2.9), parent: s2, name: 'Inside list' });
  fitImage('renders/robot_top.png', { maxW: mm(50), maxH: mm(52), parent: g, x: B.X(88), y: B.Y(98), center: true });
  text('TOP VIEW', { kind: 'head', size: mm(2.6), ls: 12, color: 'navy', parent: g, x: B.X(105), y: B.Y(151) });
  const fi = stack({ gap: mm(1), w: mm(128), parent: g, x: B.X(10), y: B.Y(155), name: 'The idea' });
  stxt(fi, 'THE IDEA', { kind: 'head', size: mm(2.8), ls: 12, color: 'navy' });
  stxt(fi, COPY.ideaShort + ' ' + COPY.status, { kind: 'bodyM', size: mm(3.05), lh: 1.3, color: 'navy' });
  mustEnd(fi, B.Y(174), 'Flyer back idea');
  const foot = frame({ name: 'Footer', w: g.width, h: g.height - B.Y(176), fill: 'navy', parent: g, x: 0, y: B.Y(176) });
  qrTile({ size: mm(26), parent: g, x: B.X(10), y: B.Y(180) });
  text(COPY.scan, { kind: 'bodyM', size: mm(3.3), color: 'cream', parent: g, x: B.X(41), y: B.Y(182) });
  text(COPY.web, { kind: 'bodyB', size: mm(3.8), color: 'yellow', parent: g, x: B.X(41), y: B.Y(188) });
  text(COPY.linkedin, { kind: 'body', size: mm(2.7), color: 'cream', parent: g, x: B.X(41), y: B.Y(194.5) });
  makerLine({ h: mm(7.5), color: 'cream', knock: 'navy', parent: g, x: B.X(107), y: B.Y(181) });
  text(COPY.designed, { kind: 'head', size: mm(3.1), color: 'yellow', ls: 6, upper: true, parent: g, x: B.X(107), y: B.Y(193.5) });
  B.done();
  return [A.f, B.f];
}

// ---------------------------------------------------------------- A4 tri-fold brochure 297 × 210 mm (roll fold)
// Outside, left to right: inside flap (97) | back (100) | front cover (100). Inside: 100 | 100 | 97.
function buildBrochure(page, x, y) {
  const P = 9; // panel margin from folds and edges
  const A = artboard(page, { name: 'Brochure A4 tri-fold · outside · 297 × 210 mm (+3 mm bleed)', trimW: 297, trimH: 210, bleed: 3, bg: 'cream', x, y, safe: 6 });
  const { f, X, Y } = A;
  // flap (0–97): learn by building + impact
  const fl = stack({ gap: mm(3), w: mm(97 - 2 * P), parent: f, x: X(P), y: Y(12), name: 'The idea' });
  stxt(fl, 'THE IDEA', { kind: 'head', size: mm(3.2), ls: 12, color: 'navy' });
  stxt(fl, COPY.ideaHead, { kind: 'display', size: mm(7.4), lh: 0.98, color: 'navy', ls: 1 });
  stxt(fl, COPY.problem, { kind: 'bodyM', size: mm(3.1), lh: 1.35, color: 'navy' });
  stxt(fl, COPY.answer, { kind: 'bodyM', size: mm(3.1), lh: 1.35, color: 'navy' });
  const q = stack({ pad: mm(4), fill: 'yellow', radius: mm(3), parent: fl, name: 'Quote' }); q.layoutSizingHorizontal = 'FILL';
  stxt(q, '“' + COPY.struggle + '”', { kind: 'bodyS', size: mm(3.2), lh: 1.35, color: 'navy' });
  const sy = fl.y + fl.height + mm(9);
  const st = text(COPY.statsTitle, { kind: 'display', size: mm(4.8), color: 'navy', ls: 1, parent: f, x: X(P), y: sy });
  mustEnd(statsGrid(COPY.stats, { w: mm(97 - 2 * P), cols: 2, size: mm(9.5), label: mm(2.7), rowGap: mm(4), parent: f, x: X(P), y: sy + st.height + mm(3) }), Y(202), 'Brochure flap numbers');
  // back (97–197): about us, contact
  frame({ name: 'Back panel', w: mm(100), h: f.height, fill: 'navy', parent: f, x: X(97), y: 0 });
  plastalLogo({ w: mm(62), color: 'cream', knock: 'navy', parent: f, x: X(97 + 19), y: Y(16) });
  const ab = stack({ gap: mm(2.6), w: mm(100 - 2 * P), parent: f, x: X(97 + P), y: Y(43), name: 'About' });
  stxt(ab, 'ABOUT US', { kind: 'display', size: mm(6), color: 'yellow', ls: 1 });
  stxt(ab, COPY.about, { kind: 'bodyM', size: mm(3.1), lh: 1.35, color: 'cream' });
  stxt(ab, COPY.origin, { kind: 'body', size: mm(2.9), lh: 1.35, color: 'cream' });
  stxt(ab, COPY.support, { kind: 'body', size: mm(2.9), lh: 1.35, color: 'cream' });
  const ry = stack({ gap: mm(2), w: mm(100 - 2 * P), parent: ab, name: 'Where we are' }); ry.layoutSizingHorizontal = 'FILL';
  stxt(ry, COPY.roadmapTitle, { kind: 'display', size: mm(4.6), color: 'yellow', ls: 1 });
  featureRows(COPY.roadmap, { w: mm(100 - 2 * P), gap: mm(1.6), chip: mm(6.5), size: mm(2.8), body: mm(2.7), color: 'cream', chipFill: 'yellow', chipInk: 'navy', titleKind: 'head', titleLs: 6, parent: ry });
  const qy = ab.y + ab.height + mm(6);
  qrTile({ size: mm(26), parent: f, x: X(97 + P), y: qy });
  text(COPY.scan, { kind: 'bodyM', size: mm(3), color: 'cream', parent: f, x: X(97 + P + 30), y: qy + mm(1) });
  text(COPY.web, { kind: 'bodyB', size: mm(3.2), color: 'yellow', parent: f, x: X(97 + P + 30), y: qy + mm(7.5) });
  text(COPY.linkedin, { kind: 'body', size: mm(2.4), color: 'cream', w: mm(52), parent: f, x: X(97 + P + 30), y: qy + mm(13.5) });
  const dz = text(COPY.designed, { kind: 'head', size: mm(3.4), color: 'yellow', ls: 6, upper: true, parent: f, x: X(97 + P), y: Math.max(Y(194), qy + mm(31)) });
  mustEnd(dz, Y(204), 'Brochure back panel');
  // front cover (197–297)
  const fc = frame({ name: 'Front cover', w: mm(100) + mm(3), h: f.height, fill: 'yellow', clip: true, parent: f, x: X(197), y: 0 });
  contourLines(fc, fc.width, fc.height, 'ochre', 0.3, 0.6);
  robocoreLogo({ w: mm(80), color: 'navy', parent: f, x: X(207), y: Y(16) });
  taglineStack({ size: mm(15.5), parent: f, x: X(206), y: Y(52) });
  text(COPY.oneLiner, { kind: 'bodyS', size: mm(3.8), lh: 1.2, color: 'navy', w: mm(80), parent: f, x: X(207), y: Y(97) });
  const pn = frame({ name: 'Robot panel', w: mm(82), h: mm(70), fill: 'navy', radius: mm(5), clip: true, parent: f, x: X(206), y: Y(118) });
  fitImage(HERO, { maxW: mm(78), maxH: mm(64), parent: pn, x: mm(2), y: mm(3), center: true });
  text(COPY.designed, { kind: 'head', size: mm(3.4), color: 'navy', ls: 6, upper: true, parent: f, x: X(207), y: Y(196) });
  A.done();
  // inside
  const B = artboard(page, { name: 'Brochure A4 tri-fold · inside · 297 × 210 mm (+3 mm bleed)', trimW: 297, trimH: 210, bleed: 3, bg: 'cream', x, y: y + A.H + 200, safe: 6 });
  const g = B.f;
  // the robot
  const p1 = stack({ gap: mm(3), w: mm(100 - 2 * P), parent: g, x: B.X(P), y: B.Y(12), name: 'The robot' });
  stxt(p1, 'THE ROBOT', { kind: 'display', size: mm(9), color: 'navy', ls: 1 });
  stxt(p1, 'Build it yourself: every part is yours to see, change and understand.', { kind: 'bodyM', size: mm(3.3), lh: 1.3, color: 'navy' });
  viewsStrip({ s: mm(0.104), gap: mm(3), label: mm(2.4), dim: mm(2.1), color: 'navy', parent: g, x: B.X(P), y: B.Y(40) });
  const ins = stack({ gap: mm(2.2), w: mm(100 - 2 * P), parent: g, x: B.X(P), y: B.Y(96), name: 'Inside' });
  stxt(ins, 'WHAT’S INSIDE', { kind: 'display', size: mm(5.2), color: 'navy', ls: 1 });
  iconList(COPY.inside, { gap: mm(1.9), w: mm(100 - 2 * P), size: mm(3), parent: ins, name: 'Inside list' });
  const by = ins.y + ins.height + mm(7);
  const bt = text(COPY.boardTitle, { kind: 'display', size: mm(5.2), color: 'navy', ls: 1, parent: g, x: B.X(P), y: by });
  const bi = fitImage(BOARD, { maxW: mm(38), maxH: mm(28), parent: g, x: B.X(P), y: by + bt.height + mm(2) });
  mustEnd(text(COPY.boardLine, { kind: 'bodyM', size: mm(2.8), lh: 1.35, color: 'navy', w: mm(100 - 2 * P - 41), parent: g, x: B.X(P + 41), y: bi.y }), B.Y(204), 'Brochure board text');
  mustEnd(bi, B.Y(204), 'Brochure board render');
  // the app
  rect({ name: 'App panel', w: mm(100), h: g.height, fill: 'paper', parent: g, x: B.X(100), y: 0 });
  const p2 = stack({ gap: mm(3), w: mm(100 - 2 * P), parent: g, x: B.X(100 + P), y: B.Y(12), name: 'The app' });
  stxt(p2, 'THE APP', { kind: 'display', size: mm(9), color: 'navy', ls: 1 });
  stxt(p2, 'RoboCore IDE: blocks when you start, real C++ when you are ready.', { kind: 'bodyM', size: mm(3.3), lh: 1.3, color: 'navy' });
  ideCard({ w: mm(82), parent: g, x: B.X(100 + P), y: B.Y(40) });
  const ap = stack({ gap: mm(2.6), w: mm(100 - 2 * P), parent: g, x: B.X(100 + P), y: B.Y(94), name: 'App points' });
  for (const s of COPY.app) {
    const r = stack({ dir: 'H', gap: mm(2.4), parent: ap });
    ellipse({ w: mm(2.2), fill: 'yellow', stroke: 'navy', strokeW: 0.6, parent: r });
    text(s, { kind: 'body', size: mm(3.05), lh: 1.35, color: 'navy', w: mm(100 - 2 * P - 5), parent: r });
  }
  const dy = ap.y + ap.height + mm(8);
  const dt = text('WHAT MAKES IT DIFFERENT', { kind: 'display', size: mm(5.2), color: 'navy', ls: 1, parent: g, x: B.X(100 + P), y: dy });
  mustEnd(featureRows(COPY.different, { w: mm(100 - 2 * P), gap: mm(2.4), chip: mm(8), size: mm(3), body: mm(2.75), parent: g, x: B.X(100 + P), y: dy + dt.height + mm(2.5), name: 'Different' }), B.Y(204), 'Brochure different list');
  // what you can make
  const p3 = stack({ gap: mm(3), w: mm(97 - 2 * P), parent: g, x: B.X(200 + P), y: B.Y(12), name: 'What you can make' });
  stxt(p3, 'WHAT YOU CAN MAKE', { kind: 'display', size: mm(9), color: 'navy', ls: 1 });
  const grid = frame({ name: 'Ideas', w: mm(97 - 2 * P), h: mm(50), parent: g, x: B.X(200 + P), y: B.Y(36) });
  COPY.make.forEach(([ic, lab], i) => {
    const gx = (i % 3) * mm(27), gy = Math.floor(i / 3) * mm(25);
    iconChip(ic, { d: mm(11), fill: 'navy', color: 'yellow', parent: grid, x: gx, y: gy });
    text(lab, { kind: 'bodyS', size: mm(2.8), lh: 1.2, color: 'navy', w: mm(25), parent: grid, x: gx, y: gy + mm(12.5) });
  });
  text('IT COMES IN ITS OWN BOX', { kind: 'display', size: mm(4.6), color: 'navy', ls: 1, parent: g, x: B.X(200 + P), y: B.Y(90) });
  fitImage('renders/box_open_iso_fl.png', { maxW: mm(97 - 2 * P), maxH: mm(44), parent: g, x: B.X(200 + P), y: B.Y(97), center: true });
  const cta = stack({ gap: mm(2.4), pad: mm(6), w: mm(97 - 2 * P), fill: 'navy', radius: mm(4), parent: g, x: B.X(200 + P), y: B.Y(146), name: 'Call to action' });
  stxt(cta, COPY.drive, { kind: 'display', size: mm(7), color: 'yellow', ls: 1 });
  stxt(cta, COPY.stand + '. ' + COPY.status, { kind: 'body', size: mm(3), lh: 1.35, color: 'cream' });
  stxt(cta, COPY.web, { kind: 'bodyB', size: mm(3.3), color: 'yellow' });
  // fold marks (in the bleed, top and bottom)
  for (const [art, folds] of [[f, [97, 197]], [g, [100, 200]]]) for (const fx of folds) for (const yy of [0, art.height - mm(3)]) rect({ name: 'Fold mark', w: 0.5, h: mm(3), fill: 'navy', parent: art, x: mm(3 + fx), y: yy });
  B.done();
  return [A.f, B.f];
}
