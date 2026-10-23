// ============================================================================
// Stateful panels as interactive components, so tabs, Clear, Send and Cog's
// steps work on every screen without extra frames:
//   Console Panel  — Scenario (what just happened) × Tab (Serial / Output / Problems)
//   Cog Panel      — Step (the error-help flow and the learn flow)
//   Preview Board  — the simulated RoboCore (LED, motors, sensors, USER button)
// ============================================================================

// console text shared by the panels and the screens (defined here, before first use)
const OUTPUT_COMPILE_ERR = [
  ['14:09:03', 'sys', 'Compiling Blink.ino for RoboCore V2 (ESP32-S3)…'],
  ['14:09:05', 'err', "Blink.ino:11:3: error: 'digitalwrite' was not declared in this scope"],
  ['', 'rx', "   11 |   digitalwrite(LED_BUILTIN, HIGH);"],
  ['', 'rx', "      |   ^~~~~~~~~~~~  did you mean 'digitalWrite'?"],
  ['14:09:05', 'warn', 'Compilation failed — 1 error.'],
];
const SERIAL_BOOT = [
  ['', 'sys', 'Connected to ESP32-S3 USB (303A:1001) at 115200 baud'],
  ['14:02:10.881', 'rx', 'ESP-ROM:esp32s3-20210327'],
  ['14:02:10.884', 'rx', 'rst:0x1 (POWERON),boot:0x8 (SPI_FAST_FLASH_BOOT)'],
  ['14:02:11.204', 'rx', 'RoboCore V2 ready'],
];
const OUTPUT_VERIFY = [
  ['14:05:12', 'sys', 'Compiling Blink.ino for RoboCore V2 (ESP32-S3) on the compile server…'],
  ['14:05:18', 'rx', 'Sketch uses 289,617 bytes (9%) of program storage space. Maximum is 3,145,728 bytes.'],
  ['14:05:18', 'rx', 'Global variables use 20,436 bytes (6%) of dynamic memory.'],
  ['14:05:18', 'ok', 'Compiled in 6.4 s — ready to upload'],
];
const OUTPUT_FAILED = [
  ['14:07:41', 'ok', 'Compiled in 5.9 s · 289,617 bytes (9%)'],
  ['14:07:42', 'rx', 'Resetting the board into its bootloader…'],
  ['14:07:52', 'err', 'Upload failed: could not start the board’s bootloader.'],
  ['', 'warn', 'Hold BOOT, tap RESET, release BOOT, then press Upload again.'],
];

const CON_TABS = [['Serial Monitor', 'Serial'], ['Output', 'Output'], ['Problems', 'Problems']];
const L_IDLE_OUT = [['', 'sys', 'Messages from Verify and Upload appear here.']];
const L_COMPILING = [['14:06:00', 'sys', 'Compiling Blink.ino for RoboCore V2 (ESP32-S3) on the compile server…']];
const L_UP18 = L_COMPILING.concat([['14:06:02', 'ok', 'Compiled in 6.1 s · 289,617 bytes (9%)'], ['14:06:03', 'rx', 'Resetting the board into its bootloader…'], ['14:06:04', 'rx', 'Writing bootloader at 0x00000000… (18 %)']]);
const L_UP64 = L_UP18.concat([['14:06:06', 'rx', 'Writing app at 0x00010000… (64 %)']]);
const L_UP100 = L_UP64.concat([['14:06:08', 'rx', 'Writing app at 0x00010000… (100 %)'], ['14:06:08', 'rx', 'Restarting the board…']]);
const L_UPLOADED = L_UP100.concat([['14:06:09', 'ok', 'Upload complete: 316,432 bytes written to the ESP32-S3. Blink LED is running.']]);
const L_NOBOARD = [['14:08:11', 'err', 'No board on USB-C. Plug in the RoboCore, press Connect, then Upload again.']];
const L_PREVIEW = [['', 'sys', 'Preview board ready at 115200 baud. Upload runs your sketch here, no cable needed.']];
const L_PREVIEW_RUN = L_PREVIEW.concat([['14:10:02.004', 'rx', 'RoboCore V2 ready']]);
const L_PREVIEW_UP = [['14:10:01', 'sys', 'Checking the sketch for RoboCore V2 (preview check)…'], ['14:10:01', 'rx', 'Sketch uses 289,617 bytes (9%) of program storage space.'], ['14:10:02', 'ok', 'Uploaded to the preview RoboCore V2. The sketch is running in the simulator.']];
const L_FIXED = [['14:09:40', 'ok', "Cog applied the fix on line 11: digitalwrite → digitalWrite. Press Verify to check it."]];
const L_SENT = SERIAL_BOOT.concat([['14:12:02.310', 'tx', 'status'], ['14:12:02.318', 'rx', 'ok · uptime 132 s · battery 3.92 V']]);
// scenario → [serial lines | 'empty', output lines, problems count, default tab]
const SCENARIOS = {
  Idle: [SERIAL_BOOT, L_IDLE_OUT, 0],
  Verifying: [SERIAL_BOOT, [['14:05:12', 'sys', 'Compiling Blink.ino for RoboCore V2 (ESP32-S3) on the compile server…']], 0],
  Verified: [SERIAL_BOOT, OUTPUT_VERIFY, 0],
  Compiling: [SERIAL_BOOT, L_COMPILING, 0],
  Upload18: [SERIAL_BOOT, L_UP18, 0],
  Upload64: [SERIAL_BOOT, L_UP64, 0],
  Upload100: [SERIAL_BOOT, L_UP100, 0],
  Uploaded: [SERIAL_BOOT, L_UPLOADED, 0],
  Failed: [SERIAL_BOOT, OUTPUT_FAILED, 0],
  CompileError: [SERIAL_BOOT, OUTPUT_COMPILE_ERR, 1],
  Fixed: [SERIAL_BOOT, L_FIXED, 0],
  NoBoard: ['empty', L_NOBOARD, 0],
  Preview: [L_PREVIEW, [['', 'sys', 'Upload runs the sketch on the preview board.']], 0],
  PreviewRun: [L_PREVIEW_RUN, L_PREVIEW_UP, 0],
  Typed: [SERIAL_BOOT, L_IDLE_OUT, 0],
  Sent: [L_SENT, L_IDLE_OUT, 0],
  Cleared: [[], [], 0],
};
function conVariant(scen, tab) {
  const [serial, out, problems] = SCENARIOS[scen];
  const c = comp('Scenario=' + scen + ', Tab=' + tab);
  al(c, { dir: 'V', gap: 0, w: 900, h: 232, cross: 'start', fill: 'color/bg/panel', radius: 10, stroke: 'color/border/default' });
  c.clipsContent = true;
  const ph = box({ name: 'Panel header', dir: 'H', gap: 8, pad: [0, 8, 0, 16], h: 40, cross: 'center', parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
  const tabs = box({ name: 'Tabs', dir: 'H', gap: 4, h: 40, cross: 'center', parent: ph });
  for (const [label, key] of CON_TABS) {
    const t = inst('Panel Tab', { State: key === tab ? 'Active' : 'Inactive' }, tabs, { name: 'Tab ' + label });
    setProp(t, 'Label', label);
    if (key === 'Problems' && problems) { setProp(t, 'Show count', true); setProp(t, 'Count', String(problems)); }
  }
  spacer(ph, 1, true);
  if (tab === 'Serial' && serial !== 'empty') sel(ph, 'Baud', '115200 baud', { nodeName: 'Baud' });
  iconBtn(ph, 'trash', { name: 'Clear output' });
  iconBtn(ph, 'chevron-down', { name: 'Collapse panel' });
  if (tab === 'Serial' && serial === 'empty') {
    const es = box({ name: 'Empty state', dir: 'V', gap: 10, pad: 16, align: 'center', cross: 'center', parent: c, wSize: 'fill', grow: true });
    txt('No board connected', { style: 'Heading/H2', parent: es, name: 'Title' });
    txt('Plug RoboCore V2 in with a USB-C data cable, then press Connect.', { style: 'Body/Small', color: 'color/text/secondary', parent: es, name: 'Body' });
    const b = inst('Button', { Variant: 'Primary', State: 'Default' }, es, { name: 'Connect board' }); setProp(b, 'Label', 'Connect'); setProp(b, 'Icon', ICON['plug'].id);
  } else if (tab === 'Problems') {
    const pv = box({ name: 'Problems list', dir: 'V', gap: 0, pad: [6, 8, 6, 8], parent: c, wSize: 'fill', grow: true });
    if (problems) {
      const r = box({ name: 'Problem Blink.ino:11', dir: 'H', gap: 10, pad: [6, 8, 6, 8], cross: 'center', radius: 4, fill: 'color/bg/hover', parent: pv, wSize: 'fill' });
      iconSlot(r, 'alert-triangle', 'color/icon/strong', 16, 'Icon');
      txt("'digitalwrite' was not declared in this scope", { style: 'Body/Small', parent: r, name: 'Message', grow: true });
      txt('Blink.ino  11:3', { style: 'Code/Small', color: 'color/text/tertiary', parent: r, name: 'Where' });
    } else {
      const e = box({ name: 'No problems', dir: 'H', gap: 8, pad: 10, cross: 'center', parent: pv });
      iconSlot(e, 'check-circle', 'color/icon/default', 16, 'Icon');
      txt('No problems in this sketch.', { style: 'Body/Small', color: 'color/text/secondary', parent: e, name: 'Text' });
    }
  } else {
    const lines = tab === 'Serial' ? serial : out;
    const v = consoleView(c, lines.length ? lines : [], { name: 'Console', explain: scen === 'CompileError' && tab === 'Output' });
    v.layoutSizingVertical = 'FILL';
    if (!lines.length) txt(scen === 'Cleared' ? 'Cleared. New lines appear here.' : '', { style: 'Code/Small', color: 'color/text/disabled', parent: v, name: 'Empty' });
    if (tab === 'Serial') {
      const ir = box({ name: 'Send row', dir: 'H', gap: 8, pad: [8, 8, 8, 12], cross: 'center', parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
      const fld = box({ name: 'Message field', dir: 'H', gap: 0, pad: [0, 12, 0, 12], h: 32, cross: 'center', radius: 6, fill: 'color/bg/input', stroke: scen === 'Typed' ? 'color/border/ink' : 'color/border/default', parent: ir, grow: true });
      if (scen === 'Typed') { txt('status', { style: 'Code/Small', parent: fld, name: 'Value' }); rect({ name: 'Caret', w: 1.5, h: 16, fill: 'color/ink/default', parent: fld }); spacer(fld, 1, true); }
      else txt('Send a message to the board', { style: 'Body/Small', color: 'color/text/tertiary', parent: fld, name: 'Placeholder', grow: true });
      const s = inst('Button', { Variant: scen === 'Typed' ? 'Primary' : 'Secondary', State: 'Default' }, ir, { name: 'Send' }); setProp(s, 'Label', 'Send'); setProp(s, 'Show icon', false);
    }
  }
  return c;
}
function buildConsolePanel(parent) {
  const comps = [];
  for (const scen of Object.keys(SCENARIOS)) for (const [, tab] of CON_TABS) comps.push(conVariant(scen, tab));
  CMP['Console Panel'] = makeSet(comps, 'Console Panel', parent, 3, 'Bottom panel: Serial Monitor, Output and Problems. Scenario = what the IDE just did (verify, each upload step, errors, preview board). Tabs, Clear, Send and the message field work inside the component.');
  for (const v of CMP['Console Panel'].children) stackForOverflow(v);
}
async function wireConsolePanel() {
  const set = CMP['Console Panel'];
  for (const v of set.children) {
    const { Scenario, Tab } = propsOf(v);
    for (const [label, key] of CON_TABS) { const t = v.findOne(n => n.name === 'Tab ' + label); if (t && key !== Tab) await addReaction(t, changeTo(variantOf(set, { Scenario, Tab: key }))); }
    const cl = v.findOne(n => n.name === 'Clear output'); if (cl) await addReaction(cl, changeTo(variantOf(set, { Scenario: 'Cleared', Tab })));
    if (Tab === 'Serial') {
      const f = v.findOne(n => n.name === 'Message field'); if (f && Scenario !== 'Typed') await addReaction(f, changeTo(variantOf(set, { Scenario: 'Typed', Tab })));
      const s = v.findOne(n => n.name === 'Send'); if (s && Scenario === 'Typed') await addReaction(s, changeTo(variantOf(set, { Scenario: 'Sent', Tab })));
    }
  }
}

// ---------------------------------------------------------------- Cog panel
const COG_STEPS = ['Error · Explain', 'Error · Hint 2', 'Error · Fix', 'Error · Check', 'Error · Correct', 'Learn · Explain', 'Learn · On start', 'Learn · Challenge', 'Learn · Done'];
function cogButtons(parent, items) {
  const r = box({ name: 'Next steps', dir: 'H', gap: 8, wrap: true, rowGap: 8, parent, wSize: 'fill' });
  for (const [label, variant] of items) { const b = inst('Button', { Variant: variant || 'Secondary', State: 'Default' }, r, { name: label }); setProp(b, 'Label', label); setProp(b, 'Show icon', false); }
  return r;
}
function cogVariant(step) {
  const c = comp('Step=' + step);
  al(c, { dir: 'V', gap: 0, w: 352, h: 860, cross: 'start', fill: 'color/bg/panel', radius: 10, stroke: 'color/border/default' });
  c.clipsContent = true;
  const hd = inst('Cog Header', null, c, { name: 'Cog header' }); hd.layoutSizingHorizontal = 'FILL';
  const body = box({ name: 'Conversation', dir: 'V', gap: 12, pad: 14, parent: c, wSize: 'fill', grow: true, clip: true });
  const chips = box({ name: 'Cog can see', dir: 'H', wrap: true, gap: 6, rowGap: 6, parent: body, wSize: 'fill' });
  const err = step.indexOf('Error') === 0;
  const n = COG_STEPS.indexOf(step);
  let prompts;
  if (err) {
    ctxChip(chips, 'file-code', 'Blink.ino · line 11'); ctxChip(chips, 'terminal', step === 'Error · Check' || step === 'Error · Correct' ? 'Output · fixed' : 'Output · 1 error'); ctxChip(chips, 'cpu', 'RoboCore V2');
    chatMsg(body, 'You', 'Explain this error');
    chatMsg(body, 'Cog', 'Your sketch didn’t compile: on line 11 Arduino doesn’t recognise the name of the function you called. Want to find it yourself first?');
    hintCard(body, 'Hint 1', 'Arduino names are case-sensitive. Compare line 11 with pinMode on line 7.');
    if (n >= 1) hintCard(body, 'Hint 2', 'Look at the letter straight after “digital”.');
    if (n === 2) { const s = inst('Suggestion', null, body, { name: 'Suggestion' }); s.layoutSizingHorizontal = 'FILL'; }
    if (n >= 3) {
      chatMsg(body, 'Cog', 'Applied. Line 11 now calls digitalWrite with a capital W. Undo with Ctrl+Z if you want it back.');
      const q = inst('Quick Check', null, body, { name: 'Quick check' }); q.layoutSizingHorizontal = 'FILL';
    }
    if (n === 4) {
      hintCard(body, 'Right', 'delay(1000) compiles: Arduino names are case-sensitive, so Delay and delay are different names.');
      const cc = inst('Concepts', null, body, { name: 'Concepts' }); cc.layoutSizingHorizontal = 'FILL';
    }
    // long threads stick to the newest message like a chat scrolled to the bottom (older ones clip at the top)
    if (n >= 3) body.primaryAxisAlignItems = 'MAX';
    if (n === 0) cogButtons(body, [['Another hint'], ['Show the fix']]);
    if (n === 1) cogButtons(body, [['Show the fix'], ['I fixed it myself', 'Ghost']]);
    prompts = n === 4 ? ['What else is case-sensitive?', 'Verify again'] : ['Why does case matter?', 'What should I try next?'];
  } else {
    ctxChip(chips, 'blocks', 'Blink LED · ' + BLOCK_COUNT + ' blocks'); ctxChip(chips, 'repeat', step === 'Learn · On start' ? 'Selected: on start' : 'Selected: forever');
    if (step === 'Learn · On start') {
      chatMsg(body, 'You', 'Explain on start');
      chatMsg(body, 'Cog', 'on start runs once, when RoboCore V2 powers up or restarts. It is a good place to start the serial port. In C++ it becomes setup():');
      const cv = codeView(body, 'void setup() {\n  Serial.begin(115200);\n  Serial.println("RoboCore V2 ready");\n}', { name: 'Code snippet', wSize: 'fill', h: 100, small: true });
      cv.strokes = [paint('color/border/default')]; cv.strokeWeight = 1; cv.cornerRadius = 8;
    } else {
      chatMsg(body, 'You', 'What does forever do?');
      chatMsg(body, 'Cog', 'forever runs the blocks inside it again and again, for as long as RoboCore V2 has power. In C++ it becomes loop():');
      const cv = codeView(body, 'void loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(1000);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(1000);\n}', { name: 'Code snippet', wSize: 'fill', h: 136, small: true });
      cv.strokes = [paint('color/border/default')]; cv.strokeWeight = 1; cv.cornerRadius = 8;
    }
    if (n >= 7) hintCard(body, 'Try it', 'Change both waits to 0.5 secs and upload. What happens to the LED?');
    if (n === 7) cogButtons(body, [['I tried it']]);
    if (n === 8) { chatMsg(body, 'Cog', 'Nice: with 0.5 s waits the LED blinks twice as fast. The wait blocks set the rhythm.'); const cc = inst('Concepts', null, body, { name: 'Concepts' }); cc.layoutSizingHorizontal = 'FILL'; }
    prompts = step === 'Learn · On start' ? ['Explain forever', 'Give me a challenge'] : ['Explain on start', 'Give me a challenge'];
  }
  const ft = box({ name: 'Ask', dir: 'V', gap: 10, pad: [10, 14, 14, 14], parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { t: 1 } });
  const pr = box({ name: 'Prompts', dir: 'H', wrap: true, gap: 6, rowGap: 6, parent: ft, wSize: 'fill' });
  for (const l of prompts) inst('Prompt Chip', null, pr, { name: 'Prompt ' + l, text: { Label: l } });
  const cm = inst('Cog Composer', null, ft, { name: 'Composer' }); cm.layoutSizingHorizontal = 'FILL';
  return c;
}
function buildCogPanel(parent) {
  CMP['Cog Panel'] = makeSet(COG_STEPS.map(cogVariant), 'Cog Panel', parent, 5, 'Cog, step by step. Error help: explain → another hint → show the fix → Apply (the code changes, undo with Ctrl+Z) → quick check. Learn: explain the selected block → challenge → done.');
}
async function wireCogPanel() {
  const set = CMP['Cog Panel'];
  const to = async (step, node, target) => { const v = variantOf(set, { Step: step }); const n = v.findOne(x => x.name === node); if (n) await addReaction(n, changeTo(variantOf(set, { Step: target }))); else warn('cog: no ' + node + ' in ' + step); };
  await to('Error · Explain', 'Another hint', 'Error · Hint 2');
  await to('Error · Explain', 'Show the fix', 'Error · Fix');
  await to('Error · Hint 2', 'Show the fix', 'Error · Fix');
  await to('Error · Hint 2', 'I fixed it myself', 'Error · Check');
  await to('Error · Fix', 'Not now', 'Error · Hint 2');
  await to('Error · Fix', 'Apply', 'Error · Check'); // fallback; on the prototype screens Apply also changes the code
  await to('Error · Check', 'Check answer', 'Error · Correct');
  await to('Learn · Explain', 'Prompt Give me a challenge', 'Learn · Challenge');
  await to('Learn · Explain', 'Prompt Explain on start', 'Learn · On start');
  await to('Learn · On start', 'Prompt Explain forever', 'Learn · Explain');
  await to('Learn · On start', 'Prompt Give me a challenge', 'Learn · Challenge');
  await to('Learn · Challenge', 'I tried it', 'Learn · Done');
  await to('Learn · Done', 'Prompt Explain on start', 'Learn · On start');
  // the quick check's options are Radios (interactive already)
}

// ---------------------------------------------------------------- preview board (the simulator)
function buildPreviewBoard(parent) {
  const comps = [];
  for (const run of ['Idle', 'LED on', 'LED off', 'Stopped']) for (const user of ['Up', 'Down']) {
    const c = comp('Run=' + run + ', User=' + user);
    al(c, { dir: 'V', gap: 0, w: 280, h: 232, cross: 'start', radius: 10, fill: 'color/bg/panel', stroke: 'color/border/default' });
    c.clipsContent = true;
    const hd = box({ name: 'Header', dir: 'H', gap: 8, pad: [0, 10, 0, 14], h: 40, cross: 'center', parent: c, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    txt('Preview board', { style: 'Heading/H2', parent: hd, name: 'Title', grow: true });
    const running = run === 'LED on' || run === 'LED off';
    const b = inst('Badge', { Tone: running ? 'Ink' : 'Neutral' }, hd, { name: 'State' }); setText(b, 'Label', running ? 'Running' : (run === 'Stopped' ? 'Stopped' : 'Simulator'));
    const body = box({ name: 'Body', dir: 'H', gap: 12, pad: [10, 14, 10, 14], parent: c, wSize: 'fill', grow: true });
    const led = box({ name: 'LED', dir: 'V', gap: 6, cross: 'center', w: 64, parent: body });
    const on = run === 'LED on' || user === 'Down';
    const ring = box({ name: 'LED ring', dir: 'H', w: 44, h: 44, align: 'center', cross: 'center', radius: 22, fill: on ? 'color/bg/brand' : 'color/bg/subtle', stroke: 'color/border/ink', parent: led });
    // lit: box yellow with a soft glow so the blink reads at a glance
    if (on) ring.effects = [{ type: 'DROP_SHADOW', color: { r: 0.949, g: 0.69, b: 0.118, a: 0.6 }, offset: { x: 0, y: 0 }, radius: 16, spread: 3, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false }];
    const d = figma.createEllipse(); d.name = 'LED dot'; d.resize(20, 20); d.fills = [on ? solid('#FFFFFF') : paint('color/bg/hover')]; d.strokes = [paint('color/border/ink')]; d.strokeWeight = 1.5; ring.appendChild(d);
    if (on) LINKS.push([ring, 'effect', 'Focus/Ring']);
    txt(on ? 'RGB · white' : 'RGB · off', { style: 'Caption/Default', color: 'color/text/tertiary', parent: led, name: 'LED label' });
    const ub = box({ name: 'USER button', dir: 'H', pad: [0, 8, 0, 8], h: 26, cross: 'center', radius: 13, fill: user === 'Down' ? 'color/ink/default' : undefined, stroke: 'color/border/ink', parent: led });
    txt('USER', { style: 'Label/Small', color: user === 'Down' ? 'color/text/on-ink' : 'color/text/primary', parent: ub, name: 'Label' });
    const rows = box({ name: 'Readings', dir: 'V', gap: 5, parent: body, grow: true });
    for (const [k, v] of [['Motors', 'L 0 % · R 0 %'], ['Servo 1', '90°'], ['Sonar', '42 cm'], ['Line', 'L 0.1 · C 0.9 · R 0.1'], ['Tilt', '1.2°'], ['Battery', '3.92 V']]) {
      const r = box({ name: 'Reading ' + k, dir: 'H', gap: 6, parent: rows, wSize: 'fill' });
      txt(k, { style: 'Caption/Default', color: 'color/text/tertiary', parent: r, name: 'Key', w: 54 });
      txt(v, { style: 'Code/Small', parent: r, name: 'Value', grow: true });
    }
    comps.push(c);
  }
  CMP['Preview Board'] = makeSet(comps, 'Preview Board', parent, 4, 'The simulated RoboCore V2 that runs a sketch when the port is “Preview board”: RGB LED, USER button (hold to press), motors, servo, sonar, line sensor, tilt and battery.');
}
async function wirePreviewBoard() {
  const set = CMP['Preview Board'];
  for (const v of set.children) {
    const p = propsOf(v);
    if (p.User !== 'Up') continue;
    const b = v.findOne(n => n.name === 'USER button');
    if (b) await addReaction(b, changeTo(variantOf(set, { Run: p.Run, User: 'Down' }), PRESS));
  }
}
