// ============================================================================
// 03 — IDE app: components and classes (robocore-ide/lib)
// ============================================================================

function buildIde(page) {
  const root = pageRoot(page, {
    title: 'IDE app',
    intro: 'How the Flutter app in robocore-ide/lib is organised. Widgets never talk to the hardware or the network themselves: they read AppState and call its actions, and AppState uses the engine, the simulated board, the compile client and the USB link.',
  });
  componentDiagram(root);
  projectModelDiagram(root);
  buildModelDiagram(root);
  return root;
}

function comp2(D, id, x, y, w, o) {
  return el(D, id, Object.assign({ x, y, w, uml: 'component', dom: 'ide' }, o));
}
function componentDiagram(parent) {
  const D = newDiagram(parent, {
    num: '3.1', kind: 'UML component diagram', title: 'Layers of the RoboCore IDE',
    desc: 'Five layers, top to bottom: widgets, state, the engine that understands Arduino C++, the hardware and network clients, and the data the app ships with. Arrows show which part calls or uses which.',
  });
  boundary(D, { rect: { x: 20, y: 0, w: 1560, h: 250 }, tag: 'lib/ui', label: 'Widgets', dash: false, stroke: 'color/border/default', fill: 'color/bg/app', fillOpacity: 0.6 });
  boundary(D, { rect: { x: 20, y: 300, w: 920, h: 350 }, tag: 'lib/state', label: 'State', dash: false, stroke: 'color/border/default', fill: 'color/bg/app', fillOpacity: 0.6 });
  boundary(D, { rect: { x: 980, y: 300, w: 600, h: 350 }, tag: 'lib/hw', label: 'Hardware & network clients', dash: false, stroke: 'color/border/default', fill: 'color/bg/app', fillOpacity: 0.6 });
  boundary(D, { rect: { x: 20, y: 700, w: 1560, h: 290 }, tag: 'lib/engine + lib/state/sim_board.dart', label: 'Engine and preview board', dash: false, stroke: 'color/border/default', fill: 'color/bg/app', fillOpacity: 0.6 });
  boundary(D, { rect: { x: 20, y: 1040, w: 1560, h: 250 }, tag: 'lib/data + assets', label: 'Data shipped with the app', dash: false, stroke: 'color/border/default', fill: 'color/bg/app', fillOpacity: 0.6 });

  comp2(D, 'shell', 60, 64, 280, { tag: 'ui/shell.dart', title: 'Shell', body: 'Top bar, sidebar, status bar, board menu, search and toasts.' });
  comp2(D, 'pages', 400, 64, 300, { tag: 'ui/pages', title: 'Pages', body: 'Home, Projects, Examples, Libraries, Board Setup, Serial Monitor, Settings, Welcome.' });
  comp2(D, 'editor', 780, 64, 300, { tag: 'ui/editor', title: 'Editor', body: 'BlocksView (palette, canvas, drag and drop), CodeView (highlighting, autocomplete, find), console, live board.' });
  comp2(D, 'theme', 1180, 64, 300, { tag: 'theme.dart + ui/widgets', title: 'Theme & widgets', body: 'RC theme extension (Paper and Navy), buttons, inputs, cards, icons. Used by every screen.' });

  comp2(D, 'models', 60, 350, 260, { tag: 'state/models.dart', title: 'Models', body: 'Project, ProjectFile, Settings, LogLine, OutLine.' });
  el(D, 'storage', { x: 60, y: 520, w: 260, kind: 'store', dom: 'ide', icon: 'database', tag: 'package', title: 'shared_preferences', body: 'localStorage on the web; app preferences on the native apps.' });
  comp2(D, 'app', 400, 340, 500, { tag: 'state/app_state.dart · ChangeNotifier', title: 'AppState', body: 'All app state and the build / upload flow. Widgets read it through AppScope (an InheritedNotifier) and rebuild on notifyListeners().', mono: ['load() · persist()', 'createProject() · openExample()', 'addBlock() · moveBlock() · undo() · redo()', 'verify() · upload() · connectUsb()'] });

  comp2(D, 'cclient', 1020, 350, 520, { tag: 'hw/compile_client.dart', title: 'CompileClient', body: 'POST /compile and GET /health over http; turns the reply into a ServerBuild (problems, sizes, program parts).' });
  comp2(D, 'usb', 1020, 500, 520, { tag: 'hw/usb_link*.dart', title: 'UsbLink', body: '_WebUsb on the web (dart:js_interop → window.robocoreUsb); _NoUsb elsewhere, which answers “unsupported”.' });

  comp2(D, 'codegen', 60, 760, 260, { tag: 'engine/codegen.dart', title: 'Codegen', body: 'genBlocks(): blocks → an Arduino sketch, with RoboCore helpers on the V2.' });
  comp2(D, 'parser', 360, 760, 260, { tag: 'engine/lexer + parser', title: 'Lexer & parser', body: 'Tokens and a syntax tree for the Arduino C++ the preview understands.' });
  comp2(D, 'check', 660, 760, 260, { tag: 'engine/compiler.dart', title: 'Preview check', body: 'compileSketch(): missing includes, undeclared names, types and board support, worded like the Arduino compiler.' });
  comp2(D, 'interp', 960, 760, 260, { tag: 'engine/interpreter.dart', title: 'Interpreter', body: 'Runs setup() and loop() against BoardIO; stops runaway recursion at 200 calls.' });
  comp2(D, 'sim', 1260, 760, 280, { tag: 'state/sim_board.dart', title: 'SimBoard (preview board)', body: 'Implements BoardIO: RGB LED, USER button, motors, servo, sonar, line sensor, IMU, battery and serial.' });

  comp2(D, 'catalog', 60, 1100, 380, { tag: 'data/catalog.dart', title: 'Catalog', body: 'Boards (RoboCore V2, ESP32 DevKit, NodeMCU-32S, Uno), libraries, examples, 8 block categories and 16 block types.' });
  comp2(D, 'gen', 500, 1100, 440, { tag: 'generated — do not edit', title: 'Generated data', mono: ['robocore_v2_pins.dart     ← RoboCoreV2Pins.h', 'robocore_v2_examples.dart ← firmware examples'], body: 'Written by tools/gen_pins.py and tools/gen_examples.py; CI fails if they drift.' });
  comp2(D, 'assets', 1000, 1100, 300, { tag: 'assets/', title: 'Fonts & images', body: 'Barlow, Barlow Condensed, JetBrains Mono; board, robot and contour art.' });

  el(D, 'xsrv', { x: 1640, y: 350, w: 250, kind: 'ext', dom: 'server', icon: 'server', tag: 'Container', title: 'Compile server', body: 'See 2.1.' });
  el(D, 'xjs', { x: 1640, y: 500, w: 250, kind: 'ext', dom: 'ide', icon: 'usb', tag: 'JavaScript', title: 'robocore_usb.js + esptool-js', body: 'Web Serial in the browser.' });

  const dep = { dash: true };
  edge(D, 'pages', 'app', Object.assign({ label: 'read state,\ncall actions' }, dep));
  edge(D, 'editor', 'app', Object.assign({ label: 'edits blocks\nand code' }, dep));
  edge(D, 'shell', 'app', Object.assign({ from: 'b', to: 't', tf: 0.1, mid: 280 }, dep));
  edge(D, 'app', 'models', { label: 'owns' });
  edge(D, 'app', 'storage', { label: 'persist()' });
  edge(D, 'app', 'cclient', { label: 'compile()' });
  edge(D, 'app', 'usb', { label: 'connect · flash · write' });
  edge(D, 'cclient', 'xsrv', { label: 'HTTPS' });
  edge(D, 'usb', 'xjs', { label: 'JS interop' });
  edge(D, 'app', 'codegen', { from: 'b', to: 't', fa: 440, mid: 680, label: 'genBlocks()' });
  edge(D, 'app', 'check', { from: 'b', to: 't', fa: 790, ta: 790, label: 'compileSketch()' });
  edge(D, 'check', 'parser', { label: 'tokens,\ntree' });
  edge(D, 'check', 'interp', { label: 'Compile-\nResult' });
  edge(D, 'app', 'sim', { from: 'b', to: 't', fa: 880, mid: 668, lp: 0.62, label: 'run · stop' });
  edge(D, 'interp', 'sim', { label: 'BoardIO\ncalls' });
  edge(D, 'codegen', 'catalog', Object.assign({ label: 'block types' }, dep));
  edge(D, 'check', 'catalog', Object.assign({ from: 'b', to: 't', tf: 0.92, mid: 1015, lp: 0.55, label: 'boards, libraries' }, dep));
  edge(D, 'catalog', 'gen', Object.assign({ label: 'imports' }, dep));
  return finishDiagram(D, [
    ['One source of state', 'AppState is the only ChangeNotifier the screens listen to (plus a ValueNotifier for serial lines, so only the log views redraw on every line).'],
    ['Same engine for both checks', 'Without a compile server, Verify runs the preview check; Upload to the preview board then runs the same CompileResult in the interpreter.'],
    ['Web or native', 'usb_link.dart picks _WebUsb when dart:js_interop exists (the web build) and _NoUsb otherwise, so the rest of the app never checks the platform.'],
  ]);
}

function projectModelDiagram(parent) {
  const D = newDiagram(parent, {
    num: '3.2', kind: 'UML class diagram', title: 'Projects, blocks and boards',
    desc: 'What a project is made of and how it is saved. A project keeps both its blocks and its files; while the C++ has not been edited by hand, the first file is regenerated from the blocks.',
  });
  classBox(D, 'app', { x: 40, y: 40, w: 330, name: 'AppState', stereo: '«ChangeNotifier»', attrs: ['user, school : String', 'board : String = \'v2\'', 'port : String  (sim | usb)', 'baud : int = 115200', 'settings : Settings', 'projects : List<Project>', 'libs : Map<String, bool>', 'view : Screen', 'pid : String?  (open project)'], ops: ['load() / persist()', 'createProject(name, mode, boardId)', 'openExample(id)', 'setMode(m) / editCode(text)', 'rebuildFromBlocks()', 'addBlock(t) / moveBlock(…)', 'undo() / redo()'] });
  classBox(D, 'settings', { x: 40, y: 560, w: 330, name: 'Settings', attrs: ['theme : String  (paper | navy)', 'fontSize : int = 13', 'autocomplete, wrap : bool', 'autosave : bool = true', 'lang : String', 'compileServer : String'] });
  classBox(D, 'project', { x: 480, y: 40, w: 340, name: 'Project', attrs: ['id, name : String', 'board : String  (v2 | devkit | nodemcu | uno)', 'mode : String  (blocks | code)', 'setup, loop : List<Block>', 'files : List<ProjectFile>', 'codeEdited : bool', 'autosave : bool', 'updated : int  (ms)'], ops: ['generate() : String', 'syncCode()', 'toJson() / fromJson()', 'copy() : Project'] });
  classBox(D, 'pfile', { x: 480, y: 540, w: 340, name: 'ProjectFile', attrs: ['name : String  (e.g. Blink.ino, config.h)', 'content : String'] });
  classBox(D, 'block', { x: 940, y: 40, w: 300, name: 'Block', stereo: '«typedef» Map<String, dynamic>', attrs: ['t : String  (block type id)', '…field values (pin, state, secs)'] });
  classBox(D, 'btype', { x: 940, y: 330, w: 300, name: 'BlockType', attrs: ['cat : String', 'parts : List<Object>  (labels, fields)', 'def : Map  (default values)'], ops: ['isControl : bool'] });
  classBox(D, 'bcat', { x: 1340, y: 40, w: 260, name: 'BlockCat', attrs: ['id, name, icon : String'], sub: 'Output, Input, Control, Math, Variables, Robotics, Sensors, Communication' });
  classBox(D, 'bfield', { x: 1340, y: 330, w: 260, name: 'BField', attrs: ['k : String', 'type : String  (sel | num | text)', 'opts : List<String>'] });
  classBox(D, 'board', { x: 940, y: 610, w: 300, name: 'BoardDef', attrs: ['id, name, chip, arch, mcu', 'led : int  (LED_BUILTIN)', 'max, ram : int  (flash, RAM)', 'details : List<List<String>>'], sub: 'kBoards: v2, devkit, nodemcu, uno' });
  classBox(D, 'example', { x: 1340, y: 610, w: 260, name: 'Example', attrs: ['id, name, cat, level', 'code : String', 'blocks : Map?', 'v2 : String?  (library example)', 'realOnly : bool'] });
  classBox(D, 'libdef', { x: 1680, y: 610, w: 260, name: 'LibDef', attrs: ['id, name, ver', 'h : String  (header)', 'kind : included | opt', 'arch : any | esp32 | v2'] });

  edge(D, 'app', 'project', { head: 'none', tail: 'diamond', ma: '1', mb: '0..*', label: 'projects' });
  edge(D, 'app', 'settings', { head: 'none', tail: 'diamond', mb: '1' });
  edge(D, 'project', 'pfile', { head: 'none', tail: 'diamond', mb: '1..*', label: 'files' });
  edge(D, 'project', 'block', { head: 'none', tail: 'diamond', mb: '0..*', label: 'setup, loop' });
  edge(D, 'block', 'btype', { dash: true, label: 't →' });
  edge(D, 'btype', 'bcat', { from: 't', to: 'b', ff: 0.85, mid: 250, label: 'cat' });
  edge(D, 'btype', 'bfield', { head: 'none', tail: 'diamond', mb: '0..*', label: 'parts' });
  edge(D, 'project', 'board', { from: 'r', to: 'l', ff: 0.82, mid: 880, label: 'board (id)' });
  edge(D, 'example', 'board', { dash: true, label: 'boards' });
  edge(D, 'example', 'libdef', { dash: true, label: 'needs' });
  return finishDiagram(D, [
    ['Saved as one JSON document', 'AppState.toJson() → { v: 1, profile, user, school, board, port, baud, settings, libs, projects: [...] } under the key robocore-ide-v1.'],
    ['Read one piece at a time', 'On load, each project and setting is parsed on its own. A damaged one is kept under robocore-ide-v1-damaged-… and a notice says so; the rest load normally.'],
    ['From an example', 'projectFrom(example, board) makes a new Project: the example’s blocks if it has them, its code, and a config.h.'],
  ]);
}

function buildModelDiagram(parent) {
  const D = newDiagram(parent, {
    num: '3.3', kind: 'UML class diagram', title: 'Building, uploading and the preview board',
    desc: 'The classes behind Verify and Upload. A real build comes back from the compile server as a ServerBuild; a preview check produces a CompileResult that the interpreter can run on SimBoard. Both report Problems in the same shape.',
  });
  classBox(D, 'app', { x: 560, y: 40, w: 340, name: 'AppState', stereo: '«ChangeNotifier»', attrs: ['busy : String?  (verify | upload)', 'problems : List<Problem>', 'port : String', 'usbOpen : bool', 'uploadPct : int?'], ops: ['verify({fromUpload})', 'upload()', '_buildOnServer(p, {flash})', '_flash(p, board, build)', 'connectUsb() / _autoReconnect()', 'sendSerial(text)'] });
  classBox(D, 'cclient', { x: 40, y: 440, w: 330, name: 'CompileClient', ops: ['compile(serverUrl, board, files)', '    : Future<ServerBuild>', 'health(url) : Future<(bool, String)>'] });
  classBox(D, 'sbuild', { x: 40, y: 720, w: 330, name: 'ServerBuild', attrs: ['ok : bool', 'problems : List<Problem>', 'log : String', 'image : Map?  (parts, chip)', 'flashUsed, flashMax : int?', 'ramUsed, ramMax : int?', 'error : String?', 'retry : bool'] });
  classBox(D, 'problem', { x: 460, y: 760, w: 290, name: 'Problem', attrs: ['file : String', 'line, column : int', 'severity : String', 'msg : String'], ops: ['isError : bool'] });
  classBox(D, 'cresult', { x: 460, y: 1060, w: 290, name: 'CompileResult', attrs: ['errors : List<Problem>', 'size, ram : int', 'board : BoardDef', '(the parsed program)'] });
  classBox(D, 'usb', { x: 820, y: 440, w: 340, name: 'UsbLink', stereo: '«abstract»', attrs: ['onText : (String) → void', 'onEvent : (type, msg) → void', 'supported, isOpen : bool'], ops: ['connect(baud, espressifOnly)', 'reconnect(baud) / disconnect()', 'setBaud(baud) / write(text)', 'reset() / flash(job)', '    : Future<UsbResult>'] });
  classBox(D, 'webusb', { x: 820, y: 860, w: 160, name: '_WebUsb', sub: 'window.robocoreUsb' });
  classBox(D, 'nousb', { x: 1000, y: 860, w: 160, name: '_NoUsb', sub: 'unsupported' });
  classBox(D, 'uresult', { x: 1240, y: 440, w: 260, name: 'UsbResult', attrs: ['ok : bool', 'code, message : String', 'data : Map'], ops: ['parse(json)', 'unsupported'] });
  classBox(D, 'sim', { x: 1600, y: 440, w: 300, name: 'SimBoard', stereo: '«ChangeNotifier»', attrs: ['led, rgbColor, toneHz', 'motorSpeeds : List<int>', 'servoAngle : int?', 'user, running : bool'], ops: ['run(result, name)', 'stop()'] });
  classBox(D, 'interp', { x: 1240, y: 860, w: 280, name: 'Interpreter', ops: ['run(program, io, stop)', 'max call depth 200'] });
  classBox(D, 'boardio', { x: 1600, y: 860, w: 300, name: 'BoardIO', stereo: '«interface»', ops: ['pinMode() / digitalWrite() / digitalRead()', 'analogRead() / tone() / rgb()', 'motors(l, r) / servo(a)', 'distance() / lineRead() / tilt()', 'batteryVolts() / serialWrite(s)'] });

  edge(D, 'app', 'cclient', { from: 'l', to: 't', label: 'compiler', lp: 0.3 });
  edge(D, 'app', 'usb', { label: 'usb' });
  edge(D, 'app', 'sim', { from: 'r', to: 't', head: 'none', tail: 'diamond', mb: '1', label: 'sim', lp: 0.35 });
  edge(D, 'cclient', 'sbuild', { dash: true, label: '«creates»' });
  edge(D, 'sbuild', 'problem', { head: 'none', tail: 'diamond', mb: '0..*' });
  edge(D, 'cresult', 'problem', { from: 't', to: 'b', head: 'none', tail: 'diamond', mb: '0..*' });
  edge(D, 'webusb', 'usb', { from: 't', to: 'b', head: 'hollow', ta: 900 });
  edge(D, 'nousb', 'usb', { from: 't', to: 'b', head: 'hollow', ta: 1080 });
  edge(D, 'usb', 'uresult', { dash: true, label: 'returns' });
  edge(D, 'sim', 'boardio', { from: 'b', to: 't', fa: 1820, ta: 1820, head: 'hollow', dash: true, label: 'implements' });
  edge(D, 'sim', 'interp', { from: 'b', to: 't', fa: 1660, mid: 800, label: 'run() starts' });
  edge(D, 'interp', 'boardio', { label: 'io' });
  return finishDiagram(D, [
    ['Errors are data', 'Neither the compile client nor the USB link throws. Failures come back as ServerBuild.error / retry or UsbResult.code (bootloader, wrong-chip, no-port, busy…), which AppState turns into messages.'],
    ['Same Problem everywhere', 'Problems from arduino-cli and from the preview check both carry file, line, column and severity, so the Problems tab and “go to line” work the same for both.'],
  ]);
}
