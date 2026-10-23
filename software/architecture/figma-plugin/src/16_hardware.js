// ============================================================================
// 06 — Firmware & hardware
// ============================================================================

function buildHardware(page) {
  const root = pageRoot(page, {
    title: 'Firmware & hardware',
    intro: 'What runs on the robot and what it is made of. A student’s sketch sits on the RoboCore library, which sits on Espressif’s Arduino core. The controller board takes power from USB-C or a 1S Li-ion pack and drives two encoder motors, four servo ports and the sensors.',
  });
  firmwareLayers(root);
  powerTree(root);
  signalMap(root);
  robotParts(root);
  pinSource(root);
  return root;
}

// a documentation card without a canvas (for stacks and tables)
function docCard(parent, o) {
  const card = box({ name: 'Diagram ' + o.num + ' — ' + o.title, dir: 'V', gap: 24, pad: 40, fill: PAPER, radius: 16, stroke: 'color/border/default', parent });
  const hd = box({ name: 'Header', dir: 'V', gap: 6, parent: card });
  txt(o.num + '  ·  ' + o.kind, { style: 'Caption/Overline', color: 'color/text/brand', parent: hd, name: 'Overline' });
  txt(o.title, { style: 'Heading/H1', parent: hd, name: 'Title' });
  if (o.desc) txt(o.desc, { style: 'Body/Default', color: 'color/text/secondary', parent: hd, name: 'Description', w: o.descW || 960 });
  REPORT.counts.diagrams = (REPORT.counts.diagrams || 0) + 1;
  return card;
}

function firmwareLayers(parent) {
  const card = docCard(parent, {
    num: '6.1', kind: 'Layered architecture', title: 'The firmware stack on the board',
    desc: 'Each layer only uses the one below it. Students normally touch the top two: their sketch and the RoboCore library. Blocks generate code that calls the same library.',
  });
  const row = hrow(card, 'Stack and mapping', 40);
  stack(row, [
    { title: 'Student sketch', sub: '.ino + config.h, from blocks or typed', dom: 'ide', icon: 'file-code', chips: ['setup()', 'loop()', '#include <RoboCore.h>'], mono: true },
    { title: 'RoboCore library 1.0.0', sub: 'firmware/RoboCore: the board, in plain words', dom: 'firmware', icon: 'layers', chips: ['RoboCoreMotors', 'Sonar', 'LineSensor', 'IMU', 'RoboCore::batteryVolts()', 'userPressed() · waitForUser()', 'beep() · rgb()', 'RC_PIN_… names'], mono: true },
    { title: 'Optional Arduino libraries', sub: 'turned on in the Libraries page', dom: 'ext', kind: 'ext', icon: 'library', chips: ['ESP32Servo 3.2.1', 'Adafruit NeoPixel 1.12.3', 'NewPing 1.9.7', 'LiquidCrystal I2C 1.1.2', 'Wire (core)'] },
    { title: 'Arduino-ESP32 core 3.3.12', sub: 'Espressif’s Arduino API', dom: 'ext', kind: 'ext', icon: 'cpu', chips: ['pinMode · digitalWrite', 'analogRead', 'ledcAttach · ledcWrite (PWM)', 'attachInterrupt', 'tone()', 'rgbLedWrite', 'Wire (I²C)', 'Serial over USB CDC'] },
    { title: 'ESP-IDF + FreeRTOS', sub: 'inside the core', dom: 'ext', kind: 'ext', icon: 'settings', chips: ['drivers', 'tasks', 'USB Serial/JTAG'] },
    { title: 'ESP32-S3 hardware', sub: 'ESP32-S3-WROOM-1-N8R2', dom: 'hardware', kind: 'hw', icon: 'cpu', chips: ['GPIO', 'ADC1', 'LEDC PWM', 'I²C', 'RMT (RGB LED)', 'USB Serial/JTAG', '8 MB flash', '2 MB PSRAM'] },
  ], { w: 980, labelW: 300 });
  table(row, [['Library call', 210], ['Board part', 300], ['Pins', 300]], [
    ['RoboCoreMotors', 'DRV8411A dual motor driver (1.0 A limit) and two XRP encoder motors', 'IO11/IO12 left, IO13/IO14 right (PWM) · nFAULT IO21 · current IO5/IO6 · encoders IO15–IO18'],
    ['Sonar', 'Ultrasonic module (HC-SR04 type, 3.3 V)', 'TRIG IO40 · ECHO IO41'],
    ['LineSensor', '3-channel IR line module (analog)', 'L IO7 · C IO10 · R IO2 (ADC1)'],
    ['IMU', 'LSM6DSOX 6-axis motion sensor', 'I²C SDA IO8 · SCL IO9 · INT1 IO1 · 0x6A'],
    ['RoboCore::batteryVolts()', '100k / 100k divider on the pack', 'IO4 (reading × 2)'],
    ['RoboCore::userPressed()', 'USER button', 'IO42 (LOW when pressed)'],
    ['RoboCore::beep(), tone()', 'Magnetic buzzer through an N-FET', 'IO47'],
    ['RoboCore::rgb(), LED_BUILTIN', 'WS2812B-2020-V6 RGB LED', 'IO48'],
    ['ESP32Servo', 'Servo ports 1–4 (5.5 V VMOT)', 'IO38, IO39, IO35, IO36'],
  ], { name: 'Library to hardware' });
  noteRow(card, [
    ['Safe by default', 'The motors are off at power-up and stay off until a sketch drives them; begin() holds the driver inputs low.'],
    ['Direction defaults', 'Motor 1 is the left wheel, motor 2 the right; the right motor is reversed so drive(60, 60) goes forward. To be confirmed on the first boards.'],
  ]);
  return card;
}
function noteRow(parent, notes) {
  const row = box({ name: 'Notes', dir: 'H', gap: 16, parent, cross: 'start' });
  for (const [t, b] of notes) noteCard(row, t, b, 300);
  return row;
}

function powerTree(parent) {
  const D = newDiagram(parent, {
    num: '6.2', kind: 'Block diagram', title: 'Power on the controller board',
    desc: 'Two inputs (USB-C and a 1S Li-ion pack) and two rails: 3.3 V for the logic and sensors, and 5.5 V VMOT for the motors and servos. VMOT is off whenever the switch is OFF, even on USB, so a robot on the bench cannot drive away.',
  });
  el(D, 'usbc', { x: 40, y: 60, w: 240, kind: 'hw', dom: 'hardware', icon: 'usb', tag: 'Connector', title: 'USB-C', body: 'Charging and data. USBLC6 ESD, SMF5.0A TVS, 1.5 A resettable fuse.' });
  el(D, 'batt', { x: 40, y: 400, w: 240, kind: 'hw', dom: 'hardware', icon: 'battery', tag: 'Connector · XT30', title: 'Battery pack', body: '1S Li-ion, 3.0–4.2 V. The kit uses 3 × 18650 wired 1S3P.' });
  el(D, 'charger', { x: 360, y: 60, w: 260, dom: 'hardware', icon: 'zap', tag: 'MCP73871', title: 'Charger + power path', body: '1 A charging from USB-C; charges with the switch OFF. Feeds VSYS from USB or the pack.' });
  el(D, 'prot', { x: 360, y: 400, w: 260, dom: 'hardware', icon: 'shield', tag: 'Q103/Q104 + TPS3700', title: 'Battery protection', body: 'Cuts the pack off if it is reversed or above 4.6 V (2S/3S packs are blocked).' });
  el(D, 'switch', { x: 700, y: 60, w: 240, dom: 'hardware', icon: 'plug', tag: 'Slide switch + P-FETs', title: 'ON / OFF', body: 'Switches VSYS (Q101) and the boost input (Q102). OFF draws about 0.03 mA.' });
  el(D, 'buck', { x: 1020, y: 0, w: 260, dom: 'hardware', icon: 'zap', tag: 'TPS63001 buck-boost', title: '+3V3 rail', body: 'Holds 3.3 V down to a flat cell; up to about 1.2 A.' });
  el(D, 'boost', { x: 1020, y: 300, w: 260, dom: 'hardware', icon: 'zap', tag: 'TPS61089 boost', title: 'VMOT 5.5 V', body: 'Motor and servo rail; keeps SG90-type servos inside 4.8–6 V.' });
  el(D, 'logic', { x: 1360, y: 0, w: 260, dom: 'hardware', icon: 'cpu', tag: 'Loads', title: '3.3 V loads', body: 'ESP32-S3, IMU, encoders, line and ultrasonic sensors, LEDs.' });
  el(D, 'driver', { x: 1360, y: 240, w: 260, dom: 'hardware', icon: 'gauge', tag: 'DRV8411A', title: 'Motor driver', body: 'Both motors; current limit 1.0 A each (the JST-SH contact rating).' });
  el(D, 'servos', { x: 1360, y: 430, w: 260, kind: 'hw', dom: 'hardware', icon: 'sliders', tag: 'Headers', title: 'Servo ports 1–4', body: 'Signal, VMOT, GND.' });
  el(D, 'motors', { x: 1700, y: 240, w: 230, kind: 'hw', dom: 'hardware', icon: 'bot', tag: 'JST SH 6', title: 'Motors 1 and 2', body: 'XRP gear motors with encoders.' });
  const pw = { lmono: true };
  edge(D, 'usbc', 'charger', Object.assign({ label: 'VBUS 5 V' }, pw));
  edge(D, 'batt', 'prot', Object.assign({ label: '+BATT' }, pw));
  edge(D, 'prot', 'charger', Object.assign({ label: 'BAT (charging both ways)' }, pw));
  edge(D, 'charger', 'switch', Object.assign({ label: 'VSYS' }, pw));
  edge(D, 'switch', 'buck', Object.assign({ mid: 980, label: 'VSYS_SW' }, pw));
  edge(D, 'switch', 'boost', { from: 'b', to: 'l', tf: 0.3, dash: true, label: 'Q102 gate:\nON enables' });
  edge(D, 'prot', 'boost', Object.assign({ from: 'r', to: 'l', tf: 0.75, mid: 900, label: '+BATT via Q102' }, pw));
  edge(D, 'buck', 'logic', Object.assign({ label: '+3V3' }, pw));
  edge(D, 'boost', 'driver', Object.assign({ from: 'r', to: 'l', ff: 0.35, mid: 1320, label: 'VMOT' }, pw));
  edge(D, 'boost', 'servos', Object.assign({ from: 'r', to: 'l', ff: 0.75, mid: 1320, label: 'VMOT', lp: 0.8 }, pw));
  edge(D, 'driver', 'motors', Object.assign({ label: 'M+ / M−' }, pw));
  return finishDiagram(D, [
    ['Battery choices', '1S means one cell in series. 1S2P lasts a school day of activity (about 5.7 h) and charges overnight; 1S3P about 8.5 h. Series packs would need a different charger and driver.'],
    ['Status LEDs', 'Charging (red), charged (green), USB power (blue), 3.3 V (green) and motor power (red).'],
  ]);
}

function signalMap(parent) {
  const D = newDiagram(parent, {
    num: '6.3', kind: 'Block diagram', title: 'Signals: what each ESP32-S3 pin does',
    desc: 'Almost every GPIO already has a job. The pins left free for students are IO3, IO37, IO43 and IO44 on the expansion headers, plus the four servo pins; the IDE’s “set pin” block offers only these on the V2.',
  });
  el(D, 'esp', { x: 600, y: 150, w: 380, h: 440, kind: 'hw', dom: 'hardware', icon: 'cpu', tag: 'U201', title: 'ESP32-S3-WROOM-1-N8R2', body: '240 MHz dual core, Wi-Fi and Bluetooth LE, 8 MB flash, 2 MB quad PSRAM, native USB. Never use octal-PSRAM (R8) modules: they take IO35–IO37.' });
  const g = (id, x, y, title, tag, mono) => el(D, id, { x, y, w: 300, dom: 'hardware', icon: 'cpu', tag, title, mono });
  g('g_usb', 40, 40, 'USB-C data', 'Upload + Serial Monitor', ['IO19  D−', 'IO20  D+']);
  g('g_mot', 40, 210, 'Motor driver', 'DRV8411A', ['IO11/12  motor 1 IN1/IN2', 'IO13/14  motor 2 IN1/IN2', 'IO21     nFAULT', 'IO5/6    current sense']);
  g('g_enc', 40, 420, 'Encoders', 'Motor connectors', ['IO15/16  motor 1 A/B', 'IO17/18  motor 2 A/B']);
  g('g_bat', 40, 580, 'Battery sense', 'Divider ÷ 2', ['IO4  VBAT / 2 (ADC1)']);
  g('g_imu', 1180, 40, 'IMU + Qwiic', 'LSM6DSOX · 0x6A', ['IO8  SDA', 'IO9  SCL', 'IO1  INT1']);
  g('g_son', 1180, 220, 'Ultrasonic header', '3V3 · TRIG · ECHO · GND', ['IO40  TRIG', 'IO41  ECHO']);
  g('g_line', 1180, 380, 'Line sensor header', '3V3 · GND · L · C · R', ['IO7   left', 'IO10  centre', 'IO2   right']);
  g('g_servo', 1180, 560, 'Servo ports 1–4', 'Signal pins', ['IO38, IO39, IO35, IO36']);
  const b = (id, x, title, tag, mono) => el(D, id, { x, y: 720, w: 230, dom: 'hardware', icon: 'cpu', tag, title, mono });
  b('g_rgb', 300, 'RGB LED', 'WS2812B-2020-V6', ['IO48  LED_BUILTIN']);
  b('g_buz', 550, 'Buzzer', 'via an N-FET', ['IO47  tone()']);
  b('g_btn', 800, 'Buttons', 'BOOT · USER · RESET', ['IO0   BOOT', 'IO42  USER', 'EN    RESET']);
  b('g_exp', 1050, 'Expansion A + B', '330 Ω in series', ['IO3, IO37', 'IO43/44 UART0']);
  const L = (id, ta) => edge(D, id, 'esp', { from: 'r', to: 'l', ta, mid: 470, head: 'none', tail: 'dot' });
  L('g_usb', 200); L('g_mot', 320); L('g_enc', 450); L('g_bat', 560);
  const R = (id, ta) => edge(D, id, 'esp', { from: 'l', to: 'r', ta, mid: 1100, head: 'none', tail: 'dot' });
  R('g_imu', 200); R('g_son', 320); R('g_line', 440); R('g_servo', 560);
  const B = (id, ta) => edge(D, id, 'esp', { from: 't', to: 'b', ta, mid: 660, head: 'none', tail: 'dot' });
  B('g_rgb', 660); B('g_buz', 740); B('g_btn', 840); B('g_exp', 920);
  return finishDiagram(D, [
    ['Strapping pins', 'IO0, IO3, IO45 and IO46 decide how the chip boots. IO45 and IO46 are left open; IO3 must be free at power-up.'],
    ['Single source of truth', 'These numbers live in firmware/RoboCore/src/RoboCoreV2Pins.h; see 6.5 for how the app gets them.'],
  ]);
}

function robotParts(parent) {
  const D = newDiagram(parent, {
    num: '6.4', kind: 'UML composite structure', title: 'What the RoboCore V2 robot is made of',
    desc: 'The classroom driving robot with its gripper arm, as modelled in Fusion (chassis rev 5). Filled diamonds mean “part of”: the numbers are how many of each part one robot has.',
  });
  classBox(D, 'robot', { x: 760, y: 20, w: 380, name: 'RoboCore V2 robot kit', dom: 'hardware', sub: 'about 162 × 166 mm over the walls · packed in a printed mailer box' });
  const parts = [
    ['board', 'Controller board', ['RoboCore V2, Rev 2.0', '68 × 60 mm, 4-layer'], '1'],
    ['motor', 'Motor + encoder', ['SparkFun ROB-24053', '(the XRP motor)'], '2'],
    ['wheel', 'Wheel + tyre', ['56 mm wheel', 'tyre locks on'], '2'],
    ['caster', 'Ball caster', ['½-inch ball', 'rear corners'], '2'],
    ['sonar', 'Ultrasonic sensor', ['HC-SR04 type', 'in the front pod'], '1'],
    ['line', 'Line sensor', ['3-channel IR', 'sled underneath'], '1'],
    ['arm', 'Gripper arm', ['MG90S shoulder', 'SG90 gripper'], '1'],
    ['batt', 'Battery holder', ['3 × 18650 (1S3P)', 'slides in at the back'], '1'],
    ['chassis', 'Chassis', ['rev 5 deck, 3D printed', 'top-down, ~131 g'], '1'],
  ];
  const W = 196, G = 20;
  parts.forEach(([id, name, attrs], i) => classBox(D, id, { x: 20 + i * (W + G), y: 300, w: W, name, attrs, dom: id === 'chassis' || id === 'arm' ? 'infra' : 'hardware' }));
  const rb = D.n.robot, cx = rb.x + rb.width / 2, busY = 220;
  drawPath(D, [[cx, rb.y + rb.height], [cx, busY]], { head: 'none', tail: 'diamond' });
  const xs = parts.map(([id]) => D.n[id].x + D.n[id].width / 2);
  polyline(D.cv, [[xs[0], busY], [xs[xs.length - 1], busY]], { stroke: INK, sw: 1.5, name: 'Composition bus', index: D.under });
  D.under++;
  parts.forEach(([id, , , mult], i) => drawPath(D, [[xs[i], busY], [xs[i], D.n[id].y]], { head: 'none', mb: mult, mbd: [16, -14] }));
  return finishDiagram(D, [
    ['Printed in Zambia (planned)', 'The chassis, arm and sensor mounts are designed for an A1 mini-size printer with no supports; the plan is to print and assemble kits in Zambia.'],
    ['Bought in', 'The boards are made and assembled by PCBWay; motors and sensor modules come from suppliers abroad.'],
  ]);
}

function pinSource(parent) {
  const D = newDiagram(parent, {
    num: '6.5', kind: 'Data flow', title: 'One pin map, generated everywhere',
    desc: 'The pin numbers and the V2 examples are written once, in the firmware, and generated into the app. CI fails if anyone edits one side without the other, so the blocks, the library and the board can never disagree.',
  });
  const art = (id, x, y, title, body, dom, kind) => el(D, id, { x, y, w: 260, kind: kind || 'sys', dom: dom || 'firmware', icon: 'file-code', title, body });
  art('sch', 20, 140, 'Schematic Rev 2.0', 'hardware/RoboCore_V2_schematic_rev2.0.pdf (KiCad).', 'hardware', 'hw');
  art('pinsh', 360, 40, 'RoboCoreV2Pins.h', 'firmware/RoboCore/src — the single source of truth (RC_PIN_…).');
  art('pinout', 360, 250, 'hardware/pinout.md', 'The same map for people, with notes on every pin.', 'hardware');
  el(D, 'genp', { x: 700, y: 40, w: 240, dom: 'infra', icon: 'terminal', tag: 'tools/', title: 'gen_pins.py', body: 'Writes the Dart pin map.' });
  art('pinsdart', 1020, 40, 'robocore_v2_pins.dart', 'lib/data — generated, do not edit.', 'ide');
  el(D, 'blocks', { x: 1360, y: 40, w: 260, dom: 'ide', icon: 'blocks', tag: 'In the IDE', title: 'Blocks on the V2', body: '“set pin” offers only free pins; tone defaults to IO47; USER reads IO42.' });
  art('ex', 360, 420, 'examples/*.ino', 'firmware/RoboCore/examples: BoardTest + 15 examples.');
  el(D, 'gene', { x: 700, y: 420, w: 240, dom: 'infra', icon: 'terminal', tag: 'tools/', title: 'gen_examples.py', body: 'Writes the Dart examples.' });
  art('exdart', 1020, 420, 'robocore_v2_examples.dart', 'lib/data — generated, do not edit.', 'ide');
  el(D, 'expage', { x: 1360, y: 420, w: 260, dom: 'ide', icon: 'book-open', tag: 'In the IDE', title: 'Examples page (V2)', body: 'The same sketches the library ships and CI compiles.' });
  el(D, 'ci', { x: 1020, y: 230, w: 260, dom: 'infra', icon: 'workflow', tag: 'firmware.yml · host job', title: 'Sync check', body: 'gen_pins.py --check and gen_examples.py --check fail the build on any drift.' });
  edge(D, 'sch', 'pinsh', { from: 'r', to: 'l', mid: 320, label: 'checked by hand' });
  edge(D, 'sch', 'pinout', { from: 'r', to: 'l', mid: 320 });
  edge(D, 'pinsh', 'genp', {});
  edge(D, 'genp', 'pinsdart', {});
  edge(D, 'pinsdart', 'blocks', {});
  edge(D, 'ex', 'gene', {});
  edge(D, 'gene', 'exdart', {});
  edge(D, 'exdart', 'expage', {});
  edge(D, 'ci', 'pinsdart', { dash: true, label: 'checks' });
  edge(D, 'ci', 'exdart', { dash: true, label: 'checks' });
  return finishDiagram(D);
}
