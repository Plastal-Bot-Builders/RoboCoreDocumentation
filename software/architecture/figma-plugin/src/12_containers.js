// ============================================================================
// 02 — Containers & deployment
// ============================================================================

function buildContainers(page) {
  const root = pageRoot(page, {
    title: 'Containers & deployment',
    intro: 'What runs where. The IDE is a Flutter web app with a small JavaScript USB bridge; the compile server is one Docker image; the board runs the student’s sketch on top of the RoboCore library. GitHub builds everything and hosts the web app.',
  });
  containerDiagram(root);
  deploymentDiagram(root);
  return root;
}

function containerDiagram(parent) {
  const D = newDiagram(parent, {
    num: '2.1', kind: 'C4 container diagram', title: 'The running pieces and how they talk',
    desc: 'Four places: the student’s browser, the cloud host of the compile server, the RoboCore board, and GitHub. The browser never compiles C++ itself: it sends the files to the compile server and writes the returned program to the board over USB-C.',
  });
  // browser
  el(D, 'store', { x: 60, y: 70, w: 300, kind: 'store', dom: 'ide', icon: 'database', tag: 'Data store · shared_preferences', title: 'Browser storage', body: 'Key robocore-ide-v1: projects, settings and profile. Damaged entries are set aside under a backup key, never deleted.' });
  el(D, 'web', { x: 520, y: 70, w: 300, dom: 'ide', icon: 'code', tag: 'Container · Flutter web (Dart)', title: 'RoboCore IDE web app', body: 'Every screen of the design. Blocks → C++ code generation, the preview check and the simulated board. State lives in AppState.' });
  el(D, 'esptool', { x: 60, y: 330, w: 300, kind: 'ext', dom: 'ext', icon: 'download', tag: 'Library · esptool-js 0.6.1', title: 'Flasher', body: 'Loaded only when an upload starts. Puts the ESP32-S3 into its bootloader and writes the program.' });
  el(D, 'usb', { x: 520, y: 330, w: 300, dom: 'ide', icon: 'usb', tag: 'Container · JavaScript module', title: 'USB bridge (web/robocore_usb.js)', body: 'window.robocoreUsb: connect, read and write, reset, auto-reconnect and flash. Every answer is JSON; it never throws.' });
  // cloud
  el(D, 'api', { x: 1140, y: 70, w: 340, dom: 'server', icon: 'server', tag: 'Container · Node 22, no npm packages', title: 'Compile API (server/src/server.js)', body: 'POST /compile, GET /health, GET /boards. One build at a time, 8 waiting, 20 a minute per client, 2-minute limit, CORS allow-list.' });
  el(D, 'cli', { x: 1640, y: 70, w: 320, kind: 'ext', dom: 'ext', icon: 'terminal', tag: 'Tool · arduino-cli 1.5.1', title: 'Arduino toolchain', body: 'esp32 core 3.3.12, AVR core 1.8.6; ESP32Servo, Adafruit NeoPixel, NewPing, LiquidCrystal I2C.' });
  el(D, 'build', { x: 1140, y: 330, w: 340, kind: 'store', dom: 'server', icon: 'hard-drive', tag: 'Temporary storage', title: 'Build folder', body: 'One per request, deleted afterwards. Builds run as an unprivileged user (uid 10001) with nothing secret in reach.' });
  el(D, 'lib', { x: 1640, y: 330, w: 320, dom: 'firmware', icon: 'layers', tag: 'Component · C++', title: 'RoboCore Arduino library', body: 'firmware/RoboCore, copied into the image: motors, sonar, line sensor, IMU, board helpers and pin names.' });
  // board
  el(D, 'rom', { x: 60, y: 740, w: 300, kind: 'hw', dom: 'hardware', icon: 'cpu', tag: 'In the chip', title: 'ESP32-S3 ROM bootloader', body: 'Download mode over the chip’s own USB (Serial/JTAG). esptool resets into it, or hold BOOT and tap RESET.' });
  el(D, 'sketch', { x: 520, y: 740, w: 300, kind: 'hw', dom: 'firmware', icon: 'bot', tag: 'Firmware · Arduino C++', title: 'Student sketch + RoboCore library', body: 'On Arduino-ESP32 3.3.12 (ESP-IDF, FreeRTOS). Serial goes over native USB CDC at 115,200 baud.' });
  // github
  el(D, 'actions', { x: 1140, y: 740, w: 340, dom: 'infra', icon: 'workflow', tag: 'CI · GitHub Actions', title: 'build.yml + firmware.yml', body: 'Analyse, test and build for web, Android, Windows, macOS and iOS; compile every example; test the server image.' });
  el(D, 'pages', { x: 1640, y: 740, w: 320, kind: 'ext', dom: 'infra', icon: 'globe', tag: 'Static hosting · GitHub Pages', title: 'Web app hosting', body: 'Serves the web build. Needs Pages switched on once in the repository settings.' });

  boundary(D, { id: 'browser', ids: ['store', 'web', 'esptool', 'usb'], pad: 30, top: 56, tag: 'Student’s computer', label: 'Chrome or Edge (Web Serial)' });
  boundary(D, { id: 'cloud', ids: ['api', 'cli', 'build', 'lib'], pad: 30, top: 56, tag: 'Cloud host', label: 'Render (free) or Google Cloud Run · one Docker image' });
  boundary(D, { id: 'board', ids: ['rom', 'sketch'], pad: 30, top: 56, tag: 'Hardware', label: 'RoboCore V2 controller · ESP32-S3-WROOM-1-N8R2' });
  boundary(D, { id: 'gh', ids: ['actions', 'pages'], pad: 30, top: 56, tag: 'GitHub', label: 'Plastal-Bot-Builders/robocore-ide' });

  edge(D, 'web', 'store', { label: 'load at start;\nsave 0.4 s after a change' });
  edge(D, 'web', 'usb', { tail: 'open', label: 'dart:js_interop calls,\nJSON answers + events' });
  edge(D, 'usb', 'esptool', { label: 'loaded on\nthe first Upload' });
  edge(D, 'esptool', 'rom', { label: 'writes the program\nat 921,600 baud' });
  edge(D, 'usb', 'sketch', { tail: 'open', label: 'Serial Monitor\n(USB CDC, 115,200)' });
  edge(D, 'web', 'api', { lw: 150, label: 'POST /compile (HTTPS JSON) → problems, sizes, program parts' });
  edge(D, 'api', 'cli', { label: 'arduino-cli compile\n(execFile, 2-min limit)' });
  edge(D, 'api', 'build', { label: 'writes the files,\nreads the output' });
  edge(D, 'cli', 'lib', { label: '--library', lmono: true });
  edge(D, 'actions', 'cloud', { from: 't', to: 'b', fa: 1310, ta: 1310, ldy: 10, label: 'Render redeploys\nserver/Dockerfile on push' });
  edge(D, 'actions', 'pages', { label: 'publishes the\nweb build' });
  edge(D, 'pages', 'browser', { from: 't', to: 'r', fa: 1800, via: [[1800, 600], [980, 600], [980, 470]], ta: 470, lxy: [1580, 600], label: 'serves the web app (HTTPS)' });
  return finishDiagram(D, [
    ['Why compile on a server?', 'The ESP32 toolchain is several hundred MB. Schools’ internet is slow, so one pinned toolchain runs in the cloud and the browser downloads only the finished program (a few hundred KB).'],
    ['Why Web Serial?', 'Nothing to install on school computers: Chrome or Edge talks to the board over USB-C directly. The ESP32-S3 has USB built in, so the board needs no USB-serial chip.'],
    ['When things are missing', 'No compile server: Verify uses the built-in preview check. No board: Upload runs the sketch on the preview board. The native apps use the preview board for now.'],
  ]);
}

function artifact(D, id, x, y, title, body, dom, w) {
  return el(D, id, { x, y, w: w || 250, dom: dom || 'ide', icon: 'file', tag: '«artifact»', title, body, pad: [10, 12, 12, 12] });
}
function deploymentDiagram(parent) {
  const D = newDiagram(parent, {
    num: '2.2', kind: 'UML deployment diagram', title: 'Where each built file runs',
    desc: 'Nodes are drawn as boxes in 3-D, with the files (artifacts) deployed on them. Lines are communication paths. The classroom server on the right is an option for slow or no internet: it is the same Docker image, run on the teacher’s laptop.',
  });
  // school computer
  artifact(D, 'a_web', 90, 130, 'main.dart.js + CanvasKit', 'The Flutter web build, from the web-build branch / Pages.');
  artifact(D, 'a_usb', 370, 130, 'robocore_usb.js', 'The USB bridge module, loaded by index.html.');
  artifact(D, 'a_esp', 90, 290, 'vendor/esptool-js/bundle.js', 'esptool-js 0.6.1, loaded on the first upload.', 'ext');
  artifact(D, 'a_store', 370, 290, 'localStorage · robocore-ide-v1', 'Projects, settings, profile (JSON).');
  boundary(D, { id: 'env', ids: ['a_web', 'a_usb', 'a_esp', 'a_store'], pad: 20, top: 52, tag: '«execution environment»', label: 'Chrome or Edge 89+ (Web Serial)', fill: PAPER });
  cube(D, { id: 'pc', ids: ['env'], pad: 24, top: 56, tag: '«device»', label: 'School computer (Windows, macOS, Linux or ChromeOS)' });
  // board
  artifact(D, 'b_boot', 90, 700, 'bootloader @ 0x0000', 'Second-stage bootloader from the esp32 core.', 'hardware');
  artifact(D, 'b_part', 370, 700, 'partitions @ 0x8000', '8 MB layout: app 3 MB, SPIFFS 1.5 MB.', 'hardware');
  artifact(D, 'b_app0', 90, 840, 'boot_app0 @ 0xE000', 'Chooses which app slot boots.', 'hardware');
  artifact(D, 'b_app', 370, 840, 'app @ 0x10000', 'The student’s sketch + RoboCore library.', 'firmware');
  boundary(D, { id: 'chip', ids: ['b_boot', 'b_part', 'b_app0', 'b_app'], pad: 20, top: 52, tag: '«execution environment»', label: 'ESP32-S3 · 8 MB flash, 2 MB PSRAM', fill: PAPER });
  cube(D, { id: 'v2', ids: ['chip'], pad: 24, top: 56, tag: '«device»', label: 'RoboCore V2 controller (Rev 2.0)' });
  // github pages
  artifact(D, 'p_web', 880, 130, 'Web build', 'CanvasKit bundled, so it does not depend on a CDN.', 'infra', 280);
  cube(D, { id: 'gp', ids: ['p_web'], pad: 24, top: 56, tag: '«cloud service»', label: 'GitHub Pages' });
  // render / cloud run
  artifact(D, 'r_srv', 900, 470, 'src/server.js', 'Node 22, port 8080, /health checked every 30 s.', 'server');
  artifact(D, 'r_cli', 1180, 470, 'arduino-cli + cores', 'arduino-cli 1.5.1, esp32 3.3.12, AVR 1.8.6.', 'ext');
  artifact(D, 'r_lib', 900, 620, 'Libraries', 'RoboCore library + ESP32Servo, NeoPixel, NewPing, LiquidCrystal I2C.', 'firmware');
  artifact(D, 'r_cache', 1180, 620, 'Warm build cache', 'Blink is compiled when the image is built, so the first real build is quicker.', 'server');
  boundary(D, { id: 'img', ids: ['r_srv', 'r_cli', 'r_lib', 'r_cache'], pad: 20, top: 52, tag: '«container»', label: 'robocore-compile image (node:22-bookworm-slim)', fill: PAPER });
  cube(D, { id: 'render', ids: ['img'], pad: 24, top: 56, tag: '«cloud service»', label: 'Render web service (free, 512 MB) or Cloud Run (2 GiB)' });
  // native apps
  artifact(D, 'n_apk', 1580, 130, 'app-release.apk', 'Android.', 'ide', 260);
  artifact(D, 'n_win', 1580, 250, 'robocore-ide-windows', 'Windows folder.', 'ide', 260);
  artifact(D, 'n_mac', 1580, 370, 'robocore-ide-macos.zip', 'macOS.', 'ide', 260);
  artifact(D, 'n_ios', 1580, 490, 'Runner.app (unsigned)', 'iOS; store builds need signing.', 'ide', 260);
  cube(D, { id: 'native', ids: ['n_apk', 'n_win', 'n_mac', 'n_ios'], pad: 24, top: 56, tag: '«device»', label: 'Phone, tablet or desktop (native app)' });
  // classroom option
  el(D, 'c_srv', { x: 1580, y: 800, w: 260, kind: 'planned', dom: 'server', icon: 'file', tag: '«artifact»', title: 'robocore-compile image', body: 'Docker on the teacher’s laptop, at http://localhost:8080. Other laptops would need HTTPS.' });
  cube(D, { id: 'class', ids: ['c_srv'], pad: 24, top: 56, tag: '«device» · option', label: 'Classroom server', dash: [2, 3], fill: 'color/brand/tint' });

  edge(D, 'pc', 'gp', { head: 'none', label: '«HTTPS»' });
  edge(D, 'pc', 'render', { head: 'none', lw: 140, label: '«HTTPS» POST /compile (CORS allow-list)' });
  edge(D, 'pc', 'v2', { head: 'none', label: '«USB-C» USB Serial/JTAG (CDC)' });
  return finishDiagram(D, [
    ['Native apps', 'The same Flutter code builds for Android, Windows, macOS and iOS. They use the preview board for now: USB serial on those platforms is a later step.'],
    ['Allowed callers', 'The server only answers browsers from plastal-bot-builders.github.io and localhost (ALLOWED_ORIGINS), and limits each client to 20 compiles a minute.'],
    ['Free hosting trade-off', 'Render’s free plan sleeps after 15 minutes idle, so the first compile after a pause waits about a minute. Cloud Run has more memory and a free tier too.'],
  ]);
}
