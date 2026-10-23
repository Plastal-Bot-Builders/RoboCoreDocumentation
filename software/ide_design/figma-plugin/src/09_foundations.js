// ============================================================================
// 01 — Foundations (concise): cover, colour, type, blocks, states, rules
// ============================================================================

function docSection(parent, title, desc) {
  const s = box({ name: 'Section — ' + title, dir: 'V', gap: 20, pad: 40, parent, wSize: 'fill', fill: 'color/bg/panel', radius: 12, stroke: 'color/border/default' });
  const h = box({ name: 'Doc header', dir: 'V', gap: 6, parent: s });
  txt(title, { style: 'Heading/H1', parent: h, name: 'Title' });
  if (desc) txt(desc, { style: 'Body/Default', color: 'color/text/secondary', parent: h, name: 'Description', w: 1000 });
  return s;
}
function swatchBig(parent, varName, name, hex, use, dark) {
  const c = box({ name: 'Swatch ' + name, dir: 'V', gap: 8, w: 200, parent });
  const t = box({ name: 'Tile', dir: 'V', h: 120, pad: 12, align: 'end', radius: 8, fill: varName, stroke: 'color/border/default', parent: c, wSize: 'fill' });
  txt(hex, { style: 'Code/Small', color: dark ? 'color/text/on-ink' : 'color/text/primary', parent: t, name: 'Hex' });
  txt(name, { style: 'Label/Strong', parent: c, name: 'Name' });
  txt(use, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Use', fill: true });
  return c;
}

function buildFoundations(page) {
  const root = box({ name: 'Foundations', dir: 'V', gap: 32, pad: 64, w: 1600, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;

  // ---- cover: the box front
  const cover = box({ name: 'Cover', dir: 'H', pad: [48, 56, 48, 56], h: 420, cross: 'center', radius: 16, fill: 'color/bg/brand', clip: true, parent: root, wSize: 'fill' });
  contours(cover, 1472, 420, 'color/decor/contour');
  const cl = box({ name: 'Cover text', dir: 'V', gap: 16, parent: cover, grow: true });
  const lock = CMP['Logo/Product Lockup'].createInstance(); cl.appendChild(lock); lock.rescale(1.8);
  txt('Design system', { style: 'Heading/Display', parent: cl, name: 'Title' });
  txt('Taken from the RoboCore V2 box: navy ink, RoboCore yellow and cream paper. One ink, one highlight, nothing else.', { style: 'Body/Default', parent: cl, name: 'Intro', w: 560 });
  txt('Build. Code. Create.', { style: 'Heading/H2', parent: cl, name: 'Tagline' });
  const art = artRect(cover, 'robot', 460, 'Robot line art');
  art.layoutPositioning = 'ABSOLUTE'; art.x = 1472 - 520; art.y = 10;

  // ---- colour
  const col = docSection(root, 'Colour', 'Monochrome: every surface, text and icon is navy ink or a navy tint on paper. Yellow marks the brand and what is active. States change fill, outline or icon — never hue. Block categories are the one exception (see Blocks).');
  const row = box({ name: 'Base colours', dir: 'H', gap: 20, parent: col });
  swatchBig(row, 'color/ink/default', 'Navy ink', '#1B2A41', 'Text, icons, outlines, primary buttons, Pins & Serial blocks', true);
  swatchBig(row, 'color/brand/default', 'RoboCore yellow', '#F2B01E', 'Top bar, active indicator, progress, Events blocks — never text');
  swatchBig(row, 'color/bg/app', 'Cream', '#F7F1E3', 'App background (the box’s cream card)');
  swatchBig(row, 'color/bg/panel', 'Paper', '#FFFCF5', 'Panels, cards, editor, canvas');
  swatchBig(row, 'color/text/brand', 'Ochre', '#8A5A00', 'Numbers and strings in code, warnings', true);
  const tints = box({ name: 'Navy tints', dir: 'H', gap: 0, radius: 8, clip: true, stroke: 'color/border/default', parent: col });
  for (const [k, use] of [['navy/100', 'Text'], ['navy/88', 'Hover'], ['navy/72', 'Secondary'], ['navy/66', 'Meta'], ['navy/40', 'Disabled'], ['navy/16', 'Border'], ['navy/10', 'Divider'], ['navy/6', 'Hover fill']]) {
    const t = box({ name: 'Tint ' + k, dir: 'V', gap: 2, pad: 12, w: 140, h: 88, align: 'end', fill: '#' + PRIMITIVES[k].slice(1, 7), parent: tints });
    const dark = ['navy/100', 'navy/88', 'navy/72', 'navy/66'].indexOf(k) >= 0;
    txt(use, { style: 'Label/Strong', color: dark ? 'color/text/on-ink' : 'color/text/primary', parent: t, name: 'Use' });
    txt(k.replace('navy/', '') + '%', { style: 'Code/Small', color: dark ? 'color/text/on-ink' : 'color/text/primary', parent: t, name: 'Value' });
  }
  txt('Contrast on paper: text 13.6:1 · secondary 5.8:1 · meta 4.7:1 · ochre 5.8:1 · navy on yellow 7.6:1', { style: 'Caption/Default', color: 'color/text/tertiary', parent: col, name: 'Contrast' });

  // ---- type
  const ty = docSection(root, 'Type', 'Barlow Condensed for headings (as on the box), Barlow for the interface, ' + FONT_MONO + ' for code.');
  for (const [name, sample] of [['Heading/Display', 'Robocore V2'], ['Heading/H1', 'Board setup'], ['Heading/H2', 'Recent projects'], ['Heading/H3', 'Blink LED'], ['Body/Default', 'Plug RoboCore V2 in with a USB-C data cable.'], ['Label/Strong', 'Upload'], ['Caption/Overline', 'Classroom robot'], ['Code/Default', 'digitalWrite(LED_BUILTIN, HIGH);']]) {
    const r = box({ name: 'Type ' + name, dir: 'H', gap: 24, pad: [10, 0, 10, 0], cross: 'center', parent: ty, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    const meta = box({ name: 'Meta', dir: 'V', gap: 2, w: 260, parent: r });
    txt(name, { style: 'Label/Strong', parent: meta, name: 'Style' });
    txt(TS[name].font.family + ' ' + TS[name].font.style + ' ' + TS[name].size + '/' + TS[name].lh, { style: 'Caption/Default', color: 'color/text/tertiary', parent: meta, name: 'Spec' });
    txt(sample, { style: name, parent: r, name: 'Sample', grow: true });
  }

  // ---- blocks
  const bl = docSection(root, 'Blocks', 'Blocks are the one place colour goes beyond the box: learners find blocks by colour, so each category has its own print-like ink. Every block keeps the navy line-art outline, and shape still tells you how it fits — hats start a script, statements stack, values plug in.');
  const bg = box({ name: 'Categories', dir: 'V', gap: 16, parent: bl, wSize: 'fill' });
  let bgRow = null;
  // one sample block per category (descriptions come from BLOCK_CATS)
  const CAT_DOC = {
    Events: 'Events/When timer', Movement: 'Movement/Start moving', Motors: 'Motors/Set servo', 'Light & Sound': 'Light & Sound/Play beep',
    Sensors: 'Sensors/Distance', Control: 'Control/Wait', Operators: 'Operators/Compare', Variables: 'Variables/Change variable',
    'My Blocks': 'My Blocks/Call', 'Pins & Serial': 'Pins & Serial/Print to serial',
  };
  BLOCK_CATS.forEach(([cat, ic, , use], idx) => {
    if (idx % 5 === 0) bgRow = box({ name: 'Row', dir: 'H', gap: 16, parent: bg, wSize: 'fill' });
    const key = CAT_DOC[cat];
    const st = STYLE(cat);
    const c = box({ name: 'Category ' + cat, dir: 'V', gap: 14, pad: 18, h: 176, radius: 10, fill: 'color/bg/canvas', stroke: 'color/border/default', parent: bgRow, grow: true });
    const hd = box({ name: 'Header', dir: 'H', gap: 12, cross: 'center', parent: c, wSize: 'fill' });
    const chip = box({ name: 'Colour chip', dir: 'H', w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: st.fill, parent: hd });
    iconInst(ic, chip, st.icon, 18);
    const tt = box({ name: 'Name', dir: 'V', gap: 0, parent: hd, grow: true });
    txt(cat, { style: 'Heading/H3', parent: tt, name: 'Title' });
    txt(use, { style: 'Caption/Default', color: 'color/text/tertiary', parent: tt, name: 'Use', fill: true });
    txt(VAR_HEX[st.fill], { style: 'Code/Small', color: 'color/text/tertiary', parent: hd, name: 'Hex' });
    blk(key, null, c);
  });
  const prog = buildBlinkProgram({ selected: true });
  const pc = box({ name: 'Sample program', dir: 'H', gap: 40, pad: 24, radius: 10, fill: 'color/bg/canvas', stroke: 'color/border/default', parent: bl, wSize: 'fill', cross: 'start' });
  pc.appendChild(prog);
  const pn = box({ name: 'Notes', dir: 'V', gap: 8, parent: pc, grow: true });
  for (const l of ['Colour = category, shape = how it fits.', 'Cream labels on every colour (at least 4.5:1); navy labels on yellow Events.', 'The toolbox shows the colour as a chip next to each category.', 'on start → setup(), forever → loop(); other “when …” hats are checked on every pass of loop().', 'Yellow outline = selected / keyboard focus.']) txt(l, { style: 'Body/Small', color: 'color/text/secondary', parent: pn, name: 'Note' });

  // ---- states
  const st = docSection(root, 'States', 'Default, hover, focus, disabled. Focus is a navy border with a yellow halo.');
  for (const variant of ['Primary', 'Secondary', 'Ghost']) {
    const r = box({ name: 'States ' + variant, dir: 'H', gap: 24, cross: 'center', parent: st });
    txt(variant, { style: 'Label/Strong', color: 'color/text/secondary', parent: r, name: 'Variant', w: 100 });
    for (const state of ['Default', 'Hover', 'Focus', 'Disabled']) {
      const b = inst('Button', { Variant: variant, State: state }, r, { name: 'Button' }); setProp(b, 'Label', state); setProp(b, 'Show icon', false);
    }
  }

  // ---- rules
  const ru = docSection(root, 'Rules', null);
  const rr = box({ name: 'Rule columns', dir: 'H', gap: 24, parent: ru, wSize: 'fill', cross: 'start' });
  for (const [title, items] of [['Keep it simple', ['One primary button per view.', 'The workspace is the largest area; chrome stays thin.', 'Show only what helps the next step.']], ['Honest hardware', ['“Connected” only when a real port is open.', 'Progress is real toolchain progress.', 'Errors quote the toolchain and say what to do.']], ['Accessible', ['Text ≥ 4.5:1, never yellow text on paper.', 'Status = icon or shape + words, not colour.', 'Every icon button has a tooltip and a label.']], ['Cog, the learning partner', ['Guide before fixing: one hint at a time, the fix only on request.', 'Show what it read: file and line, output, board.', 'Nothing changes without Apply, and Apply can be undone.']]]) {
    const c = box({ name: 'Rules ' + title, dir: 'V', gap: 8, pad: 20, radius: 10, stroke: 'color/border/default', parent: rr, grow: true });
    txt(title, { style: 'Heading/H3', parent: c, name: 'Title' });
    for (const it of items) txt('— ' + it, { style: 'Body/Small', color: 'color/text/secondary', parent: c, name: 'Rule', fill: true });
  }
  return root;
}
