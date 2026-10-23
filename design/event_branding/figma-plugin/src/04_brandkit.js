// ============================================================================
// Brand kit board: how RoboCore looks at events (logos, colour, type, graphics,
// messages, print specs). A screen reference, not a print file.
// ============================================================================

const PRINT_SPECS = [
  ['Roll-up banner', '850 × 2000 mm visible', '5 mm top and sides; 100 mm extra at the bottom (goes into the base)', '30 mm', 'PDF, true size. Images ≥ 120 dpi at full size. Main message in the top two thirds.'],
  ['Pop-up stand (3×3 curved)', '2880 × 2230 mm (typical; get your supplier’s template)', '25 mm all round', '50 mm; keep text 300 mm from each side (it wraps round the ends)', 'Headline, logo and robot above 1,000 mm from the floor, clear of a counter.'],
  ['Outdoor banner', '3000 × 1000 mm PVC', 'none (hemmed edges)', '60 mm (eyelets every 500 mm)', 'Navy ground hides dirt; readable from 10 m.'],
  ['Flyer', 'A5, 148 × 210 mm, two sides', '3 mm', '6 mm', '170 gsm silk. Text 8 pt or larger.'],
  ['Brochure', 'A4 tri-fold, 297 × 210 mm, roll fold', '3 mm', '6 mm, and 9 mm from each fold', 'Outside panels 97 | 100 | 100 mm (flap on the left), inside 100 | 100 | 97 mm. 150 gsm silk.'],
];

function kitSection(root, title, sub) {
  const s = stack({ gap: 24, pad: 48, w: 1920, fill: 'white', radius: 24, parent: root, name: 'Section · ' + title });
  stxt(s, title, { kind: 'display', size: 48, color: 'navy', ls: 1, upper: true });
  if (sub) stxt(s, sub, { kind: 'bodyM', size: 20, lh: 1.4, color: 'navy', colorOpacity: 0.75 });
  return s;
}
function buildBrandKit(page) {
  const root = stack({ gap: 40, pad: 64, w: 2048, fill: 'cream', name: 'Event brand kit', parent: page, x: 0, y: 0 });
  // cover
  const cover = frame({ name: 'Cover', w: 1920, h: 640, fill: 'yellow', radius: 24, clip: true, parent: root });
  contourLines(cover, 1920, 640, 'ochre', 0.3, 2);
  robocoreLogo({ w: 620, color: 'navy', parent: cover, x: 72, y: 72 });
  taglineStack({ size: 96, parent: cover, x: 66, y: 300 });
  text('EVENT BRAND KIT · banners, pop-up stand, flyer, brochure', { kind: 'head', size: 22, ls: 6, color: 'navy', parent: cover, x: 72, y: 580 });
  const rp = frame({ name: 'Robot panel', w: 920, h: 560, fill: 'navy', radius: 28, clip: true, parent: cover, x: 960, y: 40 });
  fitImage(HERO, { maxW: 820, maxH: 520, parent: rp, x: 50, y: 20, center: true });
  // logo
  const lg = kitSection(root, 'Logo', 'RoboCore leads: the box lockup (wordmark with the gear “o”, “Zambia” between two rules). “by Plastal-Bot Builders” sits small, as the maker. One ink only. Clear space on every side = the height of the gear. Smallest size: 30 mm wide in print, 160 px on screen.');
  const row = frame({ name: 'Logo on grounds', w: 1824, h: 300, parent: lg });
  [['yellow', 'navy'], ['navy', 'yellow'], ['cream', 'navy'], ['navy', 'cream']].forEach(([bg, ink], i) => {
    const t = frame({ name: 'Logo · ' + ink + ' on ' + bg, w: 438, h: 300, fill: bg, radius: 16, stroke: 'navy', strokeOpacity: 0.12, parent: row, x: i * 462 });
    robocoreLogo({ w: 340, color: ink, parent: t, x: 49, y: 70 });
    makerLine({ h: 40, color: ink, knock: bg, parent: t, x: 49, y: 210 });
  });
  const marks = stack({ dir: 'H', gap: 48, cross: 'center', parent: lg, name: 'Other marks' });
  const m1 = frame({ name: 'Wordmark', w: 420, h: 140, fill: 'cream', radius: 16, parent: marks }); robocoreLogo({ w: 340, color: 'navy', zambia: false, parent: m1, x: 40, y: 38 });
  const m2 = frame({ name: 'RoboCore IDE', w: 420, h: 140, fill: 'cream', radius: 16, parent: marks }); appMark({ h: 60, color: 'navy', parent: m2, x: 40, y: 40 }); text('RoboCore IDE', { kind: 'display', size: 34, color: 'navy', upper: true, parent: m2, x: 160, y: 48 });
  stxt(marks, 'Wordmark alone: tight spaces (lanyards, stickers). Geared Ring: only when talking about the RoboCore IDE app.', { kind: 'body', size: 18, lh: 1.4, color: 'navy', w: 860 });
  // colour
  const co = kitSection(root, 'Colour', 'The box palette. Yellow and navy carry everything; cream is the paper. CMYK values are starting points: ask the printer for a proof, and match yellow and navy to the closest Pantone if they print spot colours.');
  const sw = frame({ name: 'Swatches', w: 1824, h: 330, parent: co });
  PALETTE.forEach(([n, hex, cmyk, pms, use], i) => {
    const c = frame({ name: n, w: 290, h: 330, radius: 16, stroke: 'navy', strokeOpacity: 0.15, fill: 'white', clip: true, parent: sw, x: i * 306 });
    rect({ w: 290, h: 150, fill: n, parent: c });
    const tx = stack({ gap: 6, w: 258, parent: c, x: 16, y: 166 });
    stxt(tx, n.toUpperCase(), { kind: 'display', size: 24, color: 'navy', ls: 2 });
    stxt(tx, hex + '  ·  CMYK ' + cmyk, { kind: 'mono', size: 13, color: 'navy' });
    stxt(tx, 'Pantone ' + pms, { kind: 'mono', size: 13, color: 'navy' });
    stxt(tx, use, { kind: 'body', size: 14, lh: 1.3, color: 'navy' });
  });
  const bi = stack({ dir: 'H', gap: 12, cross: 'center', parent: co, name: 'Block inks' });
  text('Block inks, for coding graphics only:', { kind: 'bodyS', size: 16, color: 'navy', parent: bi });
  for (const [n, hex] of BLOCK_INKS) { const c = stack({ dir: 'H', gap: 6, cross: 'center', pad: [6, 12, 6, 8], radius: 999, fill: 'cream', parent: bi }); ellipse({ w: 18, fill: 'block/' + n, stroke: 'navy', parent: c }); text(n, { kind: 'bodyM', size: 14, color: 'navy', parent: c }); }
  // type
  const ty = kitSection(root, 'Type', 'Barlow Condensed Bold, in capitals, for headlines (as on the box). Barlow for everything else. Both are free Google Fonts, so printers and volunteers can install them.');
  const tr = stack({ dir: 'H', gap: 48, parent: ty, name: 'Samples' });
  const t1 = stack({ gap: 8, w: 880, parent: tr });
  stxt(t1, 'BUILD. CODE. CREATE.', { kind: 'display', size: 88, color: 'navy' });
  stxt(t1, 'Barlow Condensed Bold · headlines · roll-up headline 120 mm or more, flyer 18 mm', { kind: 'body', size: 16, color: 'navy' });
  const t2 = stack({ gap: 8, w: 880, parent: tr });
  stxt(t2, COPY.oneLiner, { kind: 'bodyS', size: 34, lh: 1.2, color: 'navy' });
  stxt(t2, COPY.what, { kind: 'body', size: 20, lh: 1.45, color: 'navy' });
  stxt(t2, 'Barlow SemiBold for subheads, Medium / Regular for text · print text 8 pt or larger', { kind: 'body', size: 16, color: 'navy' });
  // graphics
  const gr = kitSection(root, 'Graphics', 'Five things make it RoboCore: topographic lines of the real Copperbelt, the yellow robot in orthographic views, coding blocks, round icon chips, and the QR tile (always navy on white). The lines trace the land from Chingola to Ndola, from 30 m satellite elevation data (Copernicus GLO-30); every fifth line is a little bolder, as on a map.');
  const gx = frame({ name: 'Elements', w: 1824, h: 420, parent: gr });
  const e1 = frame({ name: 'Contours', w: 340, h: 420, fill: 'yellow', radius: 16, clip: true, parent: gx }); contourLines(e1, 340, 420, 'ochre', 0.35, 1.5);
  const e2 = frame({ name: 'Robot on navy', w: 420, h: 420, fill: 'navy', radius: 16, clip: true, parent: gx, x: 360 }); fitImage(HERO, { maxW: 380, maxH: 380, parent: e2, x: 20, y: 20, center: true });
  const e3 = frame({ name: 'Blocks', w: 500, h: 420, fill: 'paper', radius: 16, clip: true, parent: gx, x: 800 }); const pr = avoiderProgram(); e3.appendChild(pr); pr.rescale(0.82); pr.x = 24; pr.y = 24;
  const e4 = frame({ name: 'Icon chips + QR', w: 504, h: 420, fill: 'cream', radius: 16, parent: gx, x: 1320 });
  ['bot', 'blocks', 'zap', 'radio', 'cpu', 'lightbulb'].forEach((ic, i) => iconChip(ic, { d: 72, fill: 'navy', color: 'yellow', parent: e4, x: 32 + (i % 3) * 92, y: 40 + Math.floor(i / 3) * 96 }));
  qrTile({ size: 150, parent: e4, x: 318, y: 40 });
  text('QR: ' + COPY.web + '. Keep it 25 mm or larger in print, 150 mm on roll-ups.', { kind: 'body', size: 15, lh: 1.35, color: 'navy', w: 440, parent: e4, x: 32, y: 260 });
  // renders
  const rn = kitSection(root, 'Renders', 'Orthographic studio renders of RoboCore V2 (Fusion v36) and its box, made in Blender (Cycles) with transparent backgrounds and a soft floor shadow, so they sit on yellow, navy or cream. Use the isometric view as the hero; front, side and top work as a technical strip with dimensions. Files: assets/renders/ (about 2,600 px on the long side).');
  const sets = [
    ['Robot', [['ISO · front left', HERO], ['ISO · front right', 'renders/robot_iso_fr.png'], ['ISO · rear right', 'renders/robot_iso_rr.png'], ['TOP', 'renders/robot_top.png']]],
    ['Robot', [['FRONT', 'renders/robot_front.png'], ['BACK', 'renders/robot_back.png'], ['LEFT', 'renders/robot_left.png'], ['RIGHT', 'renders/robot_right.png']]],
    ['Box', [['Closed · ISO front left', 'renders/box_closed_iso_fl.png'], ['Closed · ISO front right', 'renders/box_closed_iso_fr.png'], ['Open · ISO front left', 'renders/box_open_iso_fl.png'], ['Open · ISO front right', 'renders/box_open_iso_fr.png']]],
  ];
  for (const [kind, row] of sets) {
    const r = frame({ name: 'Renders · ' + kind, w: 1824, h: 400, parent: rn });
    row.forEach(([lab, img], i) => {
      const t = frame({ name: lab, w: 438, h: 400, fill: i % 2 ? 'cream' : 'yellow', radius: 16, clip: true, parent: r, x: i * 462 });
      fitImage(img, { maxW: 398, maxH: 320, parent: t, x: 20, y: 16, center: true });
      text(lab, { kind: 'head', size: 16, ls: 10, upper: true, color: 'navy', parent: t, x: 20, y: 360 });
    });
  }
  const vs = frame({ name: 'Views strip sample', w: 1824, h: 480, fill: 'navy', radius: 16, clip: true, parent: rn });
  const st = viewsStrip({ s: 1.1, gap: 60, label: 16, dim: 14, color: 'cream', parent: vs, x: 48, y: 30 });
  text('Views strip: same scale for every view, real dimensions from the Fusion model.', { kind: 'body', size: 16, color: 'cream', parent: vs, x: 1180, y: 60, w: 600 });
  // the idea: the story every piece tells, in reusable blocks
  const id = kitSection(root, 'The idea', 'Why RoboCore exists, how we got here and where we are going. Use these blocks wherever a piece has room: the stand, the brochure, talks and posts. Plans and targets stay in the future tense.');
  const top = stack({ dir: 'H', gap: 24, parent: id, name: 'Problem and answer' });
  const pa = stack({ gap: 18, pad: 40, w: 1160, fill: 'navy', radius: 16, parent: top, name: 'The idea' });
  stxt(pa, 'THE IDEA', { kind: 'head', size: 18, ls: 12, color: 'yellow' });
  stxt(pa, COPY.ideaHead, { kind: 'display', size: 60, lh: 0.95, color: 'cream', ls: 1 });
  stxt(pa, COPY.problem, { kind: 'bodyM', size: 21, lh: 1.4, color: 'cream' });
  stxt(pa, COPY.answer, { kind: 'bodyM', size: 21, lh: 1.4, color: 'cream' });
  const qt = stack({ gap: 18, pad: 40, w: 640, fill: 'yellow', radius: 16, parent: top, name: 'How it teaches' });
  stxt(qt, 'HOW IT TEACHES', { kind: 'head', size: 18, ls: 12, color: 'navy' });
  stxt(qt, '“' + COPY.struggle + '”', { kind: 'display', size: 40, lh: 1.05, color: 'navy' });
  stxt(qt, COPY.ideaShort, { kind: 'bodyM', size: 18, lh: 1.4, color: 'navy' });
  // journey
  const jc = stack({ gap: 28, pad: 40, w: 1824, fill: 'yellow', radius: 16, parent: id, name: 'Journey' });
  stxt(jc, COPY.journeyTitle, { kind: 'display', size: 40, color: 'navy', ls: 1 });
  stxt(jc, COPY.origin, { kind: 'bodyM', size: 19, lh: 1.4, color: 'navy' });
  timeline(COPY.journey, { w: 1744, dot: 28, size: 22, color: 'navy', bg: 'yellow', parent: jc });
  // what makes it different
  const df = stack({ dir: 'H', gap: 24, parent: id, name: 'What makes it different' });
  for (const [ic, title, body] of COPY.different) {
    const c = stack({ gap: 14, pad: 28, w: 438, fill: 'cream', radius: 16, parent: df, name: title });
    iconChip(ic, { d: 64, fill: 'navy', color: 'yellow', parent: c });
    stxt(c, title, { kind: 'display', size: 28, lh: 1.05, color: 'navy', ls: 1, upper: true });
    stxt(c, body, { kind: 'body', size: 17, lh: 1.4, color: 'navy' });
  }
  // the board, and where we are
  const br = stack({ dir: 'H', gap: 24, parent: id, name: 'Board and roadmap' });
  const bc = frame({ name: 'Board', w: 1160, h: 520, fill: 'navy', radius: 16, clip: true, parent: br });
  fitImage(BOARD, { maxW: 560, maxH: 440, parent: bc, x: 32, y: 40, center: true });
  const bl = stack({ gap: 16, w: 520, parent: bc, x: 610, y: 40 });
  stxt(bl, COPY.boardTitle, { kind: 'display', size: 34, color: 'yellow', ls: 1 });
  stxt(bl, COPY.boardLine, { kind: 'bodyM', size: 17, lh: 1.4, color: 'cream' });
  iconList(COPY.board, { gap: 10, w: 520, size: 16, color: 'cream', iconColor: 'yellow', parent: bl, name: 'On the board' });
  const rm = stack({ gap: 20, pad: 40, w: 640, fill: 'cream', radius: 16, parent: br, name: 'Where we are' });
  stxt(rm, COPY.roadmapTitle, { kind: 'display', size: 34, color: 'navy', ls: 1 });
  featureRows(COPY.roadmap, { w: 560, gap: 18, chip: 52, size: 19, body: 17, titleKind: 'head', titleLs: 6, parent: rm });
  // numbers and who it is for
  const nb = stack({ gap: 24, pad: 40, w: 1824, fill: 'navy', radius: 16, parent: id, name: 'Numbers' });
  stxt(nb, COPY.statsTitle, { kind: 'display', size: 34, color: 'yellow', ls: 1 });
  statsGrid(COPY.stats, { w: 1744, cols: 4, size: 72, label: 18, color: 'cream', numColor: 'yellow', parent: nb });
  const wh = stack({ dir: 'H', gap: 24, parent: id, name: 'Who it is for' });
  for (const [ic, title, body] of COPY.who) {
    const c = stack({ dir: 'H', gap: 20, pad: 28, w: 592, fill: 'cream', radius: 16, parent: wh, name: title });
    iconChip(ic, { d: 64, fill: 'navy', color: 'yellow', parent: c });
    const t = stack({ gap: 6, w: 452, parent: c });
    stxt(t, title, { kind: 'display', size: 28, color: 'navy', ls: 1, upper: true });
    stxt(t, body, { kind: 'body', size: 17, lh: 1.4, color: 'navy' });
  }
  // messages
  const ms = kitSection(root, 'Messages', 'Say it the same way everywhere. Honest framing: RoboCore is designed in Zambia (not “made in Zambia” yet), V2 is a prototype, and pilots come next.');
  const mrows = [
    ['Tagline', 'BUILD. CODE. CREATE.'], ['One-liner', COPY.oneLiner], ['The idea', COPY.ideaHead + '  ' + COPY.problem + ' ' + COPY.answer],
    ['Idea, short', COPY.ideaShort], ['How it teaches', COPY.struggle], ['Where it started', COPY.origin], ['What it is', COPY.what],
    ['Pillars', COPY.pillars.map(p => p[0] + ': ' + p[2]).join('  ')], ['At the stand', COPY.drive + '  ·  ' + COPY.stand],
    ['Impact', COPY.impact], ['Where we are', COPY.status], ['Support', COPY.support], ['Contact', COPY.web + '  ·  ' + COPY.linkedin],
  ];
  for (const [k, v] of mrows) { const r = stack({ dir: 'H', gap: 24, parent: ms, name: k }); text(k, { kind: 'bodyB', size: 17, color: 'navy', w: 220, parent: r }); text(v, { kind: 'body', size: 17, lh: 1.4, color: 'navy', w: 1560, parent: r }); }
  // print specs
  const ps = kitSection(root, 'Print specs', 'Every piece is set up at true size (1 unit = 1 pt), so exporting an artboard as PDF gives the printer the right size. Each artboard has a hidden “Guides” layer with the trim line and safe area.');
  const head = ['Piece', 'Size', 'Bleed', 'Safe area', 'Notes'], widths = [280, 340, 360, 330, 514];
  const tb = stack({ gap: 0, w: 1824, parent: ps, name: 'Spec table', radius: 12, stroke: 'navy', strokeOpacity: 0.15, clip: true });
  [head].concat(PRINT_SPECS).forEach((r, i) => {
    const row = stack({ dir: 'H', gap: 0, fill: i === 0 ? 'navy' : (i % 2 ? 'white' : 'cream'), parent: tb });
    r.forEach((c, j) => { const cell = stack({ pad: [12, 14, 12, 14], w: widths[j], parent: row }); stxt(cell, c, { kind: i === 0 ? 'bodyB' : (j === 0 ? 'bodyS' : 'body'), size: 15, lh: 1.35, color: i === 0 ? 'cream' : 'navy' }); });
  });
  return root;
}
