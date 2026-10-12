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
  const col = docSection(root, 'Colour', 'Monochrome: every surface, text and icon is navy ink or a navy tint on paper. Yellow marks the brand and what is active. States change fill, outline or icon — never hue.');
  const row = box({ name: 'Base colours', dir: 'H', gap: 20, parent: col });
  swatchBig(row, 'color/ink/default', 'Navy ink', '#1B2A41', 'Text, icons, outlines, primary buttons, action blocks', true);
  swatchBig(row, 'color/brand/default', 'RoboCore yellow', '#F2B01E', 'Top bar, active indicator, progress, control blocks — never text');
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
  const bl = docSection(root, 'Blocks', 'Three roles instead of eight colours, drawn as line art like the box. Shape still tells you how a block fits: hats start a script, statements stack, values plug in.');
  const br = box({ name: 'Roles', dir: 'H', gap: 24, parent: bl, wSize: 'fill' });
  for (const [role, title, desc, key] of [['control', 'Control', 'Yellow. Start, loops, waits, if.', 'Control/Wait'], ['action', 'Action', 'Navy. LEDs, motors, servos, serial, variables.', 'Output/Set built-in LED'], ['value', 'Value', 'White, outlined. Sensors, inputs, maths.', 'Sensors/Ultrasonic distance']]) {
    const c = box({ name: 'Role ' + title, dir: 'V', gap: 12, pad: 20, radius: 10, fill: 'color/bg/canvas', stroke: 'color/border/default', parent: br, grow: true });
    blk(key, null, c);
    txt(title, { style: 'Heading/H3', parent: c, name: 'Title' });
    txt(desc, { style: 'Body/Small', color: 'color/text/secondary', parent: c, name: 'Desc', fill: true });
  }
  const prog = buildBlinkProgram({ selected: true });
  const pc = box({ name: 'Sample program', dir: 'H', gap: 40, pad: 24, radius: 10, fill: 'color/bg/canvas', stroke: 'color/border/default', parent: bl, wSize: 'fill', cross: 'start' });
  pc.appendChild(prog);
  const pn = box({ name: 'Notes', dir: 'V', gap: 8, parent: pc, grow: true });
  for (const l of ['on start → setup(), forever → loop().', 'Category = toolbox icon + label; role = fill.', 'Yellow outline = selected / keyboard focus.']) txt(l, { style: 'Body/Small', color: 'color/text/secondary', parent: pn, name: 'Note' });

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
  for (const [title, items] of [['Keep it simple', ['One primary button per view.', 'The workspace is the largest area; chrome stays thin.', 'Show only what helps the next step.']], ['Honest hardware', ['“Connected” only when a real port is open.', 'Progress is real toolchain progress.', 'Errors quote the toolchain and say what to do.']], ['Accessible', ['Text ≥ 4.5:1, never yellow text on paper.', 'Status = icon or shape + words, not colour.', 'Every icon button has a tooltip and a label.']]]) {
    const c = box({ name: 'Rules ' + title, dir: 'V', gap: 8, pad: 20, radius: 10, stroke: 'color/border/default', parent: rr, grow: true });
    txt(title, { style: 'Heading/H3', parent: c, name: 'Title' });
    for (const it of items) txt('— ' + it, { style: 'Body/Small', color: 'color/text/secondary', parent: c, name: 'Rule', fill: true });
  }
  return root;
}
