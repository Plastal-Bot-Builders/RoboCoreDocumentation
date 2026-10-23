// ============================================================================
// 04 — Key flows (UML sequence diagrams)
// ============================================================================

function buildFlows(page) {
  const root = pageRoot(page, {
    title: 'Key flows',
    intro: 'Three things the IDE does all the time, step by step, with the real function names from robocore-ide. Solid arrows with a filled head are calls; dashed arrows are replies; open heads are messages that do not wait for an answer.',
  });
  uploadSequence(root);
  previewSequence(root);
  connectSequence(root);
  return root;
}

function uploadSequence(parent) {
  const D = seq(parent, {
    num: '4.1', title: 'Upload to a real RoboCore V2', colW: 196,
    desc: 'Port = USB-C and a compile server is set. The sketch is compiled in the cloud, the program comes back in four parts, and esptool-js writes them to the board over the same USB-C cable the Serial Monitor uses.',
    parts: [
      { id: 'student', title: 'Student', icon: 'user', dom: 'people', kind: 'quiet' },
      { id: 'ui', title: 'Editor + top bar', icon: 'code', dom: 'ide', tag: 'Widgets' },
      { id: 'app', title: 'AppState', icon: 'layers', dom: 'ide', tag: 'State' },
      { id: 'cc', title: 'CompileClient', icon: 'send', dom: 'ide', tag: 'lib/hw' },
      { id: 'srv', title: 'Compile API', icon: 'server', dom: 'server', tag: 'Node 22' },
      { id: 'cli', title: 'arduino-cli', icon: 'terminal', dom: 'ext', tag: 'Toolchain', kind: 'ext' },
      { id: 'usb', title: '_WebUsb', icon: 'usb', dom: 'ide', tag: 'lib/hw' },
      { id: 'js', title: 'robocore_usb.js', icon: 'usb', dom: 'ide', tag: 'JavaScript' },
      { id: 'esp', title: 'esptool-js', icon: 'download', dom: 'ext', tag: 'Library', kind: 'ext' },
      { id: 'chip', title: 'ESP32-S3', icon: 'cpu', dom: 'hardware', tag: 'RoboCore V2', kind: 'hw' },
    ],
    msgs: [
      { a: 'student', b: 'ui', t: 'press Upload', k: 'async' },
      { a: 'ui', b: 'app', t: 'upload()' },
      { act: 'app' },
      { a: 'app', b: 'app', t: 'syncCode(): blocks → C++, unless the code was edited by hand', lw: 150 },
      { a: 'app', b: 'cc', t: 'compile(server, "v2", files)' },
      { a: 'cc', b: 'srv', t: 'POST /compile { board, files }' },
      { act: 'srv' },
      { a: 'srv', b: 'srv', t: 'check names and sizes, rate limit, queue', lw: 140 },
      { a: 'srv', b: 'cli', t: 'compile --fqbn esp32s3:… --library RoboCore (throwaway folder)', lw: 170 },
      { a: 'cli', b: 'srv', t: 'diagnostics + build files', k: 'return' },
      { a: 'srv', b: 'cc', t: '{ ok, problems, sizes, image.parts × 4 } (base64)', k: 'return', lw: 180 },
      { end: 'srv' },
      { a: 'cc', b: 'app', t: 'ServerBuild', k: 'return' },
      { frag: 'alt', label: '[compile errors]' },
      { a: 'app', b: 'ui', t: 'Problems tab: file:line:column', k: 'async' },
      { else: '[compiled]' },
      { a: 'app', b: 'usb', t: 'flash({ parts, chip: esp32s3, baud: 921600, monitorBaud })', lw: 330 },
      { a: 'usb', b: 'js', t: 'robocoreUsb.flash(json)' },
      { act: 'js' },
      { a: 'js', b: 'js', t: 'close the Serial Monitor reader and the port', lw: 150 },
      { a: 'js', b: 'esp', t: 'load bundle.js; new ESPLoader(transport)' },
      { a: 'esp', b: 'chip', t: 'reset into the ROM bootloader' },
      { a: 'chip', b: 'esp', t: 'chip = ESP32-S3', k: 'return' },
      { note: 'No answer → code “bootloader”: “Hold BOOT, tap RESET, release BOOT, then Upload again.” Wrong chip → “wrong-chip”.', on: 'esp', w: 300, dx: -40 },
      { a: 'esp', b: 'chip', t: 'writeFlash: bootloader 0x0, partitions 0x8000, boot_app0 0xE000, app 0x10000', lw: 175 },
      { a: 'js', b: 'app', t: 'progress events → “Uploading 42 %”', k: 'async' },
      { a: 'esp', b: 'chip', t: 'hard reset' },
      { a: 'js', b: 'js', t: 'wait up to 9 s for the board to come back, reopen the Serial Monitor', lw: 150 },
      { a: 'js', b: 'usb', t: '{ ok, bytes, chip, reopened }', k: 'return' },
      { end: 'js' },
      { a: 'usb', b: 'app', t: 'UsbResult', k: 'return' },
      { a: 'app', b: 'ui', t: '“Upload complete” · status Uploaded', k: 'async' },
      { endfrag: true },
      { end: 'app' },
      { a: 'chip', b: 'js', t: 'serial text: “RoboCore V2 ready”', k: 'async' },
      { a: 'js', b: 'app', t: 'onText → Serial Monitor', k: 'async' },
    ],
  });
  return finishDiagram(D, [
    ['Without a compile server', 'Upload stops with “Uploading to a real board needs the compile server” and a toast pointing to Settings → Compile server.'],
    ['Without a board', 'If the port is not open, AppState first tries usb.reconnect(); if that fails it asks the student to plug in the RoboCore and press Connect.'],
    ['Sizes', 'Blink for the V2 is about 290 KB of program in a 3 MB app partition; the server reports flash and RAM use with every build.'],
  ]);
}

function previewSequence(parent) {
  const D = seq(parent, {
    num: '4.2', title: 'Run on the preview board (no hardware, no internet)', colW: 220,
    desc: 'Port = Preview board. Everything happens inside the app: the blocks become C++, the preview check reads it like the Arduino compiler would, and the interpreter runs setup() and loop() against the simulated RoboCore.',
    parts: [
      { id: 'student', title: 'Student', icon: 'user', dom: 'people', kind: 'quiet' },
      { id: 'ui', title: 'Editor + live board', icon: 'code', dom: 'ide', tag: 'Widgets' },
      { id: 'app', title: 'AppState', icon: 'layers', dom: 'ide', tag: 'State' },
      { id: 'gen', title: 'Codegen', icon: 'blocks', dom: 'ide', tag: 'Engine' },
      { id: 'check', title: 'Preview check', icon: 'check-circle', dom: 'ide', tag: 'Engine' },
      { id: 'sim', title: 'SimBoard', icon: 'bot', dom: 'ide', tag: 'Preview board' },
      { id: 'interp', title: 'Interpreter', icon: 'play', dom: 'ide', tag: 'Engine' },
    ],
    msgs: [
      { a: 'student', b: 'ui', t: 'press Upload', k: 'async' },
      { a: 'ui', b: 'app', t: 'upload()' },
      { act: 'app' },
      { a: 'app', b: 'app', t: 'verify(fromUpload: true)' },
      { a: 'app', b: 'gen', t: 'genBlocks(name, setup, loop, board)' },
      { a: 'gen', b: 'app', t: 'Blink.ino (C++ text)', k: 'return' },
      { a: 'app', b: 'check', t: 'compileSketch(files, "v2", installed libraries)', lw: 300 },
      { a: 'check', b: 'check', t: 'lex, parse; check includes, names, types and board support', lw: 170 },
      { a: 'check', b: 'app', t: 'CompileResult { errors | size, ram }', k: 'return' },
      { frag: 'alt', label: '[errors]' },
      { a: 'app', b: 'ui', t: 'Problems tab + “Compilation failed”', k: 'async' },
      { else: '[no errors]' },
      { a: 'app', b: 'ui', t: 'sizes, simulated “Writing at 0x…” log', k: 'async' },
      { a: 'app', b: 'sim', t: 'run(result, name)' },
      { act: 'sim' },
      { a: 'sim', b: 'interp', t: 'run(program, io: SimBoard, stop token)' },
      { frag: 'loop', label: '[until Stop or a runtime error]', cover: ['ui', 'app', 'gen', 'check', 'sim', 'interp'] },
      { a: 'interp', b: 'sim', t: 'digitalWrite · rgb · motors · serialWrite … (BoardIO)', lw: 190 },
      { a: 'sim', b: 'ui', t: 'notifyListeners → LED, motors, Serial Monitor', k: 'async' },
      { endfrag: true },
      { end: 'sim' },
      { endfrag: true },
      { end: 'app' },
      { a: 'student', b: 'ui', t: 'press Stop', k: 'async' },
      { a: 'ui', b: 'app', t: 'stopSketch()' },
      { a: 'app', b: 'sim', t: 'stop() → the stop token ends the run' },
    ],
  });
  return finishDiagram(D, [
    ['What the preview board can do', 'RGB LED, USER button, two motors, a servo, sonar, line sensor, IMU tilt and temperature, battery voltage, and serial in and out. Unsupported calls are listed once in the Output panel.'],
    ['Runtime errors', 'A runtime error stops the sketch and points at its line. Runaway recursion stops at 200 calls with “A function that calls itself needs a way to stop”.'],
  ]);
}

function connectSequence(parent) {
  const D = seq(parent, {
    num: '4.3', title: 'Connect over USB-C, unplug, reconnect', colW: 230,
    desc: 'Web Serial needs one click and the browser’s own port chooser the first time. After that the browser remembers the board, so the IDE reopens it by itself after an unplug, after an upload, and the next time it starts.',
    parts: [
      { id: 'student', title: 'Student', icon: 'user', dom: 'people', kind: 'quiet' },
      { id: 'page', title: 'Board Setup', icon: 'cpu', dom: 'ide', tag: 'Widgets' },
      { id: 'app', title: 'AppState', icon: 'layers', dom: 'ide', tag: 'State' },
      { id: 'usb', title: '_WebUsb', icon: 'usb', dom: 'ide', tag: 'lib/hw' },
      { id: 'js', title: 'robocore_usb.js', icon: 'usb', dom: 'ide', tag: 'JavaScript' },
      { id: 'br', title: 'navigator.serial', icon: 'globe', dom: 'ext', tag: 'Browser', kind: 'ext' },
      { id: 'chip', title: 'ESP32-S3', icon: 'cpu', dom: 'hardware', tag: 'RoboCore V2', kind: 'hw' },
    ],
    msgs: [
      { a: 'student', b: 'page', t: 'pick USB-C, press Connect', k: 'async' },
      { a: 'page', b: 'app', t: 'connectUsb()' },
      { a: 'app', b: 'usb', t: 'connect(baud: 115200)' },
      { a: 'usb', b: 'js', t: 'robocoreUsb.connect(115200, false)', lw: 200 },
      { a: 'js', b: 'br', t: 'requestPort()' },
      { a: 'br', b: 'student', t: 'port chooser: “USB JTAG/serial debug unit”', k: 'async', lw: 300 },
      { a: 'student', b: 'br', t: 'picks the board', k: 'async' },
      { a: 'br', b: 'js', t: 'SerialPort (VID 303A, PID 1001)', k: 'return' },
      { a: 'js', b: 'chip', t: 'open at 115,200 baud, start the read loop', lw: 200 },
      { a: 'js', b: 'usb', t: '{ ok, label: “ESP32-S3 USB (303A:1001)” }', k: 'return', lw: 200 },
      { a: 'usb', b: 'app', t: 'UsbResult → port = usb (saved)', k: 'return' },
      { a: 'app', b: 'page', t: '“Connected to ESP32-S3 USB”', k: 'async' },
      { frag: 'opt', label: '[the cable is unplugged]' },
      { a: 'br', b: 'js', t: '“disconnect” event', k: 'async' },
      { a: 'js', b: 'app', t: 'event unplugged → toast “Plug it back in”', k: 'async', lw: 300 },
      { a: 'br', b: 'js', t: '“connect” event, same VID:PID', k: 'async' },
      { a: 'js', b: 'chip', t: 'reopen at 115,200' },
      { a: 'js', b: 'app', t: 'event reconnected → “Board reconnected”', k: 'async', lw: 300 },
      { endfrag: true },
      { frag: 'opt', label: '[the next time the IDE starts, port was usb]' },
      { a: 'app', b: 'usb', t: 'load() → reconnect(baud)' },
      { a: 'usb', b: 'js', t: 'robocoreUsb.reconnect(115200)', lw: 200 },
      { a: 'js', b: 'br', t: 'getPorts(): boards allowed before, no chooser', lw: 200 },
      { a: 'js', b: 'chip', t: 'open' },
      { endfrag: true },
    ],
  });
  return finishDiagram(D, [
    ['Which browsers', 'Chrome or Edge on a computer (and Chrome on Android with USB OTG for the bridge itself). Other browsers get “USB needs the web app in Chrome or Edge”.'],
    ['Quiet resets', 'When the IDE resets the board on purpose, robocore_usb.js ignores the short drop-out instead of showing an unplug notice.'],
  ]);
}
