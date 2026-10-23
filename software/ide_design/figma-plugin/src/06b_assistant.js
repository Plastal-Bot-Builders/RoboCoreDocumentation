// ============================================================================
// Cog — the AI coding assistant and learning partner (working name).
// Guides before it fixes: explains, gives hints one at a time, shows the fix only
// when asked, and never changes code without Apply. Shows what it can see.
// ============================================================================

function cogMark(parent, size) {
  const m = box({ name: 'Cog mark', dir: 'H', w: size, h: size, align: 'center', cross: 'center', radius: 999, fill: 'color/brand/default', stroke: 'color/border/ink', parent });
  m.strokeWeight = 1.25;
  const g = CMP['Logo/Gear'].createInstance(); m.appendChild(g); g.rescale((size * 0.6) / g.width);
  for (const v of g.findAll(n => n.type === 'VECTOR')) v.fills = [paint('color/icon/on-bright')];
  return m;
}

function buildAssistantComponents(parent) {
  // Ask Cog (top bar toggle)
  const bc = [];
  for (const state of ['Default', 'Active']) {
    const on = state === 'Active';
    const c = comp('State=' + state);
    al(c, { gap: 8, pad: [0, 12, 0, 4], h: 32, cross: 'center', radius: 999, fill: on ? 'color/ink/default' : undefined, stroke: 'color/border/ink' });
    c.layoutSizingHorizontal = 'HUG';
    cogMark(c, 24);
    txt('Ask Cog', { style: 'Label/Strong', color: on ? 'color/text/on-ink' : 'color/text/primary', parent: c, name: 'Label' });
    bc.push(c);
  }
  CMP['Cog Button'] = makeSet(bc, 'Cog Button', parent, 2, 'Opens / closes the Cog panel (⌘I). Active while the panel is open.');

  // Chat message
  const mc = [];
  for (const from of ['Cog', 'You']) {
    const c = comp('From=' + from);
    al(c, { gap: 10, w: 324, cross: 'start', align: from === 'You' ? 'end' : 'start' });
    c.layoutSizingVertical = 'HUG';
    if (from === 'Cog') {
      cogMark(c, 24);
      const b = box({ name: 'Bubble', dir: 'V', pad: [10, 12, 10, 12], radius: [2, 10, 10, 10], fill: 'color/bg/raised', stroke: 'color/border/default', parent: c, grow: true });
      b.layoutSizingHorizontal = 'FILL';
      txt('Your sketch didn’t compile.', { style: 'Body/Small', parent: b, name: 'Message', fill: true });
    } else {
      const b = box({ name: 'Bubble', dir: 'V', pad: [8, 12, 8, 12], radius: [10, 2, 10, 10], fill: 'color/ink/default', parent: c });
      txt('What does forever do?', { style: 'Body/Small', color: 'color/text/on-ink', parent: b, name: 'Message' });
    }
    mc.push(c);
  }
  CMP['Chat Message'] = makeSet(mc, 'Chat Message', parent, 2, 'Conversation rows. Cog = paper bubble with the gear mark; You = navy bubble on the right.');

  // Context chip — what Cog can see
  const cc = comp('Context Chip', 'Shows what Cog is reading (file + line, output, board). Click to jump there.');
  al(cc, { gap: 6, pad: [0, 8, 0, 6], h: 24, cross: 'center', radius: 4, fill: 'color/bg/subtle' });
  cc.layoutSizingHorizontal = 'HUG';
  iconSlot(cc, 'file-code', 'color/icon/strong', 14, 'Icon');
  txt('Blink.ino · line 11', { style: 'Label/Small', parent: cc, name: 'Label' });
  propSwap(cc, 'Icon', 'Icon', 'file-code');
  CMP['Context Chip'] = cc; parent.appendChild(cc);

  // Hint card (also used for "Try it")
  const hc = comp('Hint Card', 'One hint at a time. The student asks for the next hint or the fix — Cog never jumps straight to the answer.');
  al(hc, { dir: 'V', gap: 4, pad: [10, 12, 10, 12], w: 324, cross: 'start', radius: 8, fill: 'color/bg/selected' });
  hc.layoutSizingVertical = 'HUG';
  txt('Hint 1', { style: 'Caption/Overline', color: 'color/text/brand', parent: hc, name: 'Overline' });
  txt('Names in Arduino are case-sensitive.', { style: 'Body/Small', parent: hc, name: 'Text', fill: true });
  CMP['Hint Card'] = hc; parent.appendChild(hc);

  // Suggested change (diff + Apply)
  const sg = comp('Suggestion', 'Proposed edit as a diff. Nothing changes until Apply; undo with ⌘Z.');
  al(sg, { dir: 'V', gap: 0, w: 324, cross: 'start', radius: 8, fill: 'color/bg/raised', stroke: 'color/border/ink' });
  sg.layoutSizingVertical = 'HUG'; sg.clipsContent = true;
  const sh = box({ name: 'Header', dir: 'H', gap: 8, pad: [8, 12, 8, 12], cross: 'center', parent: sg, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  txt('Suggested fix', { style: 'Caption/Overline', parent: sh, name: 'Overline', grow: true });
  txt('Blink.ino · line 11', { style: 'Caption/Default', color: 'color/text/tertiary', parent: sh, name: 'Where' });
  for (const [sign, line, fill] of [['−', '  digitalwrite(LED_BUILTIN, HIGH);', 'color/bg/subtle'], ['+', '  digitalWrite(LED_BUILTIN, HIGH);', 'color/bg/selected']]) {
    const r = box({ name: sign === '+' ? 'Added' : 'Removed', dir: 'H', gap: 8, pad: [4, 12, 4, 12], parent: sg, wSize: 'fill', fill });
    txt(sign, { style: 'Code/Small', color: 'color/text/secondary', parent: r, name: 'Sign' });
    const t = txt(line, { style: 'Code/Small', color: sign === '+' ? 'color/text/primary' : 'color/text/secondary', parent: r, name: 'Line' });
    const k = line.indexOf(sign === '+' ? 'W' : 'w');
    POST.push(() => t.setRangeFontName(k, k + 1, PICK(FONT_MONO, 'Bold')));
  }
  const sf = box({ name: 'Footer', dir: 'H', gap: 8, pad: [10, 12, 10, 12], cross: 'center', parent: sg, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  const ap = inst('Button', { Variant: 'Primary', State: 'Default' }, sf, { name: 'Apply' }); setProp(ap, 'Label', 'Apply'); setProp(ap, 'Icon', ICON['check'].id);
  const nn = inst('Button', { Variant: 'Ghost', State: 'Default' }, sf, { name: 'Not now' }); setProp(nn, 'Label', 'Not now'); setProp(nn, 'Show icon', false);
  spacer(sf, 1, true);
  txt('Undo with ⌘Z', { style: 'Caption/Default', color: 'color/text/tertiary', parent: sf, name: 'Undo' });
  CMP['Suggestion'] = sg; parent.appendChild(sg);

  // Quick check — one question to confirm understanding
  const qc = comp('Quick Check', 'One question after a fix so the learning sticks. Not graded.');
  al(qc, { dir: 'V', gap: 8, pad: [10, 12, 12, 12], w: 324, cross: 'start', radius: 8, stroke: 'color/border/default' });
  qc.layoutSizingVertical = 'HUG';
  txt('Quick check', { style: 'Caption/Overline', color: 'color/text/brand', parent: qc, name: 'Overline' });
  txt('Which line will compile?', { style: 'Body/Small', parent: qc, name: 'Question', fill: true });
  for (const [opt, sel] of [['delay(1000);', true], ['Delay(1000);', false]]) {
    const r = box({ name: 'Option ' + opt, dir: 'H', gap: 8, cross: 'center', parent: qc });
    inst('Radio', { Selected: sel ? 'True' : 'False' }, r, { name: 'Radio' });
    txt(opt, { style: 'Code/Small', parent: r, name: 'Option' });
  }
  const ck = inst('Button', { Variant: 'Secondary', State: 'Default' }, qc, { name: 'Check answer' }); setProp(ck, 'Label', 'Check'); setProp(ck, 'Show icon', false);
  CMP['Quick Check'] = qc; parent.appendChild(qc);

  // Prompt chip
  const pc = comp('Prompt Chip', 'Suggested next question.');
  al(pc, { pad: [0, 10, 0, 10], h: 28, cross: 'center', radius: 999, stroke: 'color/border/default' });
  pc.layoutSizingHorizontal = 'HUG';
  txt('Why does case matter?', { style: 'Label/Small', parent: pc, name: 'Label' });
  CMP['Prompt Chip'] = pc; parent.appendChild(pc);

  // Concept progress
  const cp = comp('Concepts', 'What the student has learned with Cog in this project; next concept outlined.');
  al(cp, { dir: 'V', gap: 8, pad: [10, 12, 12, 12], w: 324, cross: 'start', radius: 8, fill: 'color/bg/subtle' });
  cp.layoutSizingVertical = 'HUG';
  txt('You’ve learned', { style: 'Caption/Overline', color: 'color/text/secondary', parent: cp, name: 'Overline' });
  const cr = box({ name: 'Concept row', dir: 'H', wrap: true, gap: 6, rowGap: 6, parent: cp, wSize: 'fill' });
  for (const [label, done] of [['LED output', true], ['Loops', true], ['Delays', true], ['If / else · next', false]]) {
    const p = box({ name: 'Concept ' + label, dir: 'H', gap: 4, pad: [0, 8, 0, 6], h: 24, cross: 'center', radius: 999, fill: done ? 'color/ink/default' : undefined, stroke: done ? undefined : 'color/border/ink', parent: cr });
    iconSlot(p, done ? 'check' : 'circle', done ? 'color/icon/on-ink' : 'color/icon/strong', 12, 'Icon');
    txt(label, { style: 'Label/Small', color: done ? 'color/text/on-ink' : 'color/text/primary', parent: p, name: 'Label' });
  }
  CMP['Concepts'] = cp; parent.appendChild(cp);

  // Composer
  const cm = comp('Cog Composer', 'Ask box + honesty note.');
  al(cm, { dir: 'V', gap: 6, w: 324, cross: 'start' });
  cm.layoutSizingVertical = 'HUG';
  const fld = box({ name: 'Field', dir: 'H', gap: 8, pad: [0, 4, 0, 12], h: 40, cross: 'center', radius: 8, fill: 'color/bg/input', stroke: 'color/border/strong', parent: cm, wSize: 'fill' });
  txt('Ask Cog about your code…', { style: 'Body/Small', color: 'color/text/tertiary', parent: fld, name: 'Placeholder', grow: true });
  iconBtn(fld, 'send', { name: 'Send to Cog' });
  txt('Cog reads your project, output and serial monitor. It can be wrong — check before you upload.', { style: 'Caption/Default', color: 'color/text/tertiary', parent: cm, name: 'Note', fill: true });
  CMP['Cog Composer'] = cm; parent.appendChild(cm);

  // Panel header
  const hd = comp('Cog Header', 'Panel header: who, help style, close.');
  al(hd, { gap: 10, pad: [0, 8, 0, 14], w: 352, h: 56, cross: 'center', stroke: 'color/border/subtle' });
  hd.strokeTopWeight = 0; hd.strokeLeftWeight = 0; hd.strokeRightWeight = 0; hd.strokeBottomWeight = 1;
  cogMark(hd, 30);
  const ht = box({ name: 'Titles', dir: 'V', gap: 0, parent: hd, grow: true });
  txt('Cog', { style: 'Heading/H2', parent: ht, name: 'Title' });
  txt('Your learning partner', { style: 'Caption/Default', color: 'color/text/tertiary', parent: ht, name: 'Subtitle' });
  const hb = inst('Badge', { Tone: 'Neutral' }, hd, { name: 'Help style' }); setText(hb, 'Label', 'Hints first');
  iconBtn(hd, 'x', { name: 'Close assistant' });
  CMP['Cog Header'] = hd; parent.appendChild(hd);

  // Offline notice
  const of = comp('Cog Offline', 'Shown when there is no internet. Everything except Cog keeps working.');
  al(of, { gap: 10, pad: 12, w: 324, cross: 'start', radius: 8, fill: 'color/bg/subtle' });
  of.layoutSizingVertical = 'HUG';
  iconSlot(of, 'wifi-off', 'color/icon/strong', 18, 'Icon');
  const oc = box({ name: 'Text', dir: 'V', gap: 2, parent: of, grow: true });
  txt('Cog is offline', { style: 'Label/Strong', parent: oc, name: 'Title' });
  txt('Cog needs the internet. Writing code, Verify, Upload and the Serial Monitor still work.', { style: 'Body/Small', color: 'color/text/secondary', parent: oc, name: 'Body', fill: true });
  CMP['Cog Offline'] = of; parent.appendChild(of);

  // Inline "Explain" lens for editor errors
  const ln = comp('Explain Lens', 'Inline action at the end of a line with an error.');
  al(ln, { gap: 6, pad: [0, 8, 0, 4], h: 22, cross: 'center', radius: 4, fill: 'color/ink/default' });
  ln.layoutSizingHorizontal = 'HUG';
  cogMark(ln, 16);
  txt('Explain with Cog', { style: 'Label/Small', color: 'color/text/on-ink', parent: ln, name: 'Label' });
  CMP['Explain Lens'] = ln; parent.appendChild(ln);
}

function chatMsg(parent, from, text) {
  const m = inst('Chat Message', { From: from }, parent, { name: 'Message from ' + from });
  setText(m, 'Message', text);
  m.layoutSizingHorizontal = 'FILL';
  return m;
}
function ctxChip(parent, icon, label) {
  const c = inst('Context Chip', null, parent, { name: 'Context ' + label });
  setProp(c, 'Icon', ICON[icon].id);
  const ic = c.findOne(n => n.name === 'Icon' && n.type === 'INSTANCE'); if (ic) tint(ic, 'color/icon/strong');
  setText(c, 'Label', label);
  return c;
}
function hintCard(parent, over, text) {
  const h = inst('Hint Card', null, parent, { name: 'Hint ' + over, text: { Overline: over, Text: text } });
  h.layoutSizingHorizontal = 'FILL';
  return h;
}
// right-hand Cog panel. kind: 'error' (help with a compile error) | 'learn' (explain a block)
function assistantPanel(parent, kind) {
  const col = box({ name: 'Cog column', dir: 'V', pad: [12, 12, 12, 0], w: 364, parent, hSize: 'fill' });
  const p = box({ name: 'Cog panel', dir: 'V', parent: col, wSize: 'fill', grow: true, fill: 'color/bg/panel', radius: 10, stroke: 'color/border/default', clip: true });
  const hd = inst('Cog Header', null, p, { name: 'Cog header' }); hd.layoutSizingHorizontal = 'FILL';
  const body = box({ name: 'Conversation', dir: 'V', gap: 12, pad: 14, parent: p, wSize: 'fill', grow: true, clip: true });
  const chips = box({ name: 'Cog can see', dir: 'H', wrap: true, gap: 6, rowGap: 6, parent: body, wSize: 'fill' });
  if (kind === 'error') {
    ctxChip(chips, 'file-code', 'Blink.ino · line 11'); ctxChip(chips, 'terminal', 'Output · 1 error'); ctxChip(chips, 'cpu', 'RoboCore V2');
    chatMsg(body, 'You', 'Explain this error');
    chatMsg(body, 'Cog', 'Your sketch didn’t compile: on line 11 Arduino doesn’t recognise the name of the function you called. Want to find it yourself first?');
    hintCard(body, 'Hint 1', 'Arduino names are case-sensitive. Compare line 11 with pinMode on line 7.');
    hintCard(body, 'Hint 2', 'Look at the letter straight after “digital”.');
    const s = inst('Suggestion', null, body, { name: 'Suggestion' }); s.layoutSizingHorizontal = 'FILL';
    const q = inst('Quick Check', null, body, { name: 'Quick check' }); q.layoutSizingHorizontal = 'FILL';
  } else {
    ctxChip(chips, 'blocks', 'Blink LED · 7 blocks'); ctxChip(chips, 'repeat', 'Selected: forever');
    chatMsg(body, 'You', 'What does forever do?');
    chatMsg(body, 'Cog', 'forever runs the blocks inside it again and again, for as long as RoboCore V2 has power. In C++ it becomes loop():');
    const cv = codeView(body, 'void loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(1000);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(1000);\n}', { name: 'Code snippet', wSize: 'fill', h: 136, small: true });
    cv.strokes = [paint('color/border/default')]; cv.strokeWeight = 1; cv.cornerRadius = 8;
    const t = hintCard(body, 'Try it', 'Change both waits to 0.5 secs and upload. What happens to the LED?');
    const tb = inst('Button', { Variant: 'Secondary', State: 'Default' }, body, { name: 'I tried it' }); setProp(tb, 'Label', 'I tried it'); setProp(tb, 'Show icon', false);
    const c = inst('Concepts', null, body, { name: 'Concepts' }); c.layoutSizingHorizontal = 'FILL';
  }
  const ft = box({ name: 'Ask', dir: 'V', gap: 10, pad: [10, 14, 14, 14], parent: p, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  const pr = box({ name: 'Prompts', dir: 'H', wrap: true, gap: 6, rowGap: 6, parent: ft, wSize: 'fill' });
  for (const l of (kind === 'error' ? ['Why does case matter?', 'What should I try next?'] : ['Explain on start', 'Give me a challenge'])) inst('Prompt Chip', null, pr, { name: 'Prompt ' + l, text: { Label: l } });
  const cm = inst('Cog Composer', null, ft, { name: 'Composer' }); cm.layoutSizingHorizontal = 'FILL';
  return col;
}
