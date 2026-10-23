// ============================================================================
// 05 — State machines
// ============================================================================

function buildStates(page) {
  const root = pageRoot(page, {
    title: 'State machines',
    intro: 'Three things in the IDE that change state: the USB link to the board, the build and upload status shown in the status bar, and whether a project’s C++ still follows its blocks. Transitions read “event [condition] / effect”.',
  });
  usbStates(root);
  buildStatus(root);
  modeStates(root);
  return root;
}

function usbStates(parent) {
  const D = newDiagram(parent, {
    num: '5.1', kind: 'UML state machine', title: 'The USB link (web/robocore_usb.js)',
    desc: 'The bridge remembers whether the student wants to stay connected (want) and which board it last used (VID:PID). That is what lets it reconnect by itself after an unplug or an upload, without asking again.',
  });
  initialNode(D, 'init', 40, 116);
  stateBox(D, 'closed', { x: 140, y: 90, w: 200, title: 'Closed', lines: ['want = false'] });
  stateBox(D, 'choosing', { x: 460, y: 90, w: 200, title: 'Choosing a port', lines: ['browser chooser open'] });
  stateBox(D, 'opening', { x: 780, y: 90, w: 200, title: 'Opening', lines: ['port.open(baud)'] });
  stateBox(D, 'open', { x: 1100, y: 90, w: 220, title: 'Open · reading', lines: ['Serial Monitor live', 'want = true'] });
  stateBox(D, 'unsup', { x: 140, y: 350, w: 220, title: 'Unsupported', lines: ['no Web Serial: Safari,', 'Firefox, native apps'], prose: true });
  stateBox(D, 'waiting', { x: 1100, y: 350, w: 220, title: 'Waiting for the board', lines: ['unplugged, want = true'] });
  const F = [['f1', 'Freeing the port', 'stop the reader, close'], ['f2', 'Bootloader', 'esptool default_reset'], ['f3', 'Writing', '4 parts, compressed'], ['f4', 'Resetting', 'hard_reset'], ['f5', 'Reopening', 'wait ≤ 9 s, open']];
  F.forEach(([id, t, l], i) => stateBox(D, id, { x: 160 + i * 250, y: 670, w: 200, title: t, lines: [l] }));
  for (let i = 0; i < F.length - 1; i++) edge(D, F[i][0], F[i + 1][0], {});
  boundary(D, { id: 'flash', ids: F.map(f => f[0]), pad: 28, top: 52, tag: 'Composite state', label: 'Flashing  (busy = true)', dash: false, fill: 'color/bg/app', fillOpacity: 0.7 });

  edge(D, 'init', 'closed', { label: '[Web Serial]', ldy: -14 });
  edge(D, 'init', 'unsup', { from: 'b', to: 'l', label: '[no Web Serial]' });
  edge(D, 'closed', 'choosing', { label: 'connect()\n[a click]' });
  edge(D, 'choosing', 'opening', { label: 'port picked' });
  edge(D, 'choosing', 'closed', { from: 'b', to: 'b', mid: 220, label: 'cancelled' });
  edge(D, 'opening', 'open', { label: 'opened /\nstart read loop' });
  edge(D, 'opening', 'closed', { from: 't', to: 't', tf: 0.7, mid: 58, label: 'open failed', lp: 0.5 });
  edge(D, 'open', 'closed', { from: 't', to: 't', tf: 0.3, mid: 24, label: 'disconnect() / want = false', lxy: [1000, 24] });
  edge(D, 'open', 'waiting', { label: '“disconnect” event' });
  edge(D, 'waiting', 'opening', { from: 'l', to: 'b', label: '“connect” event\n[same VID:PID]' });
  edge(D, 'open', 'flash', { from: 'r', to: 'r', fa: 140, ta: 755, mid: 1430, label: 'flash(job)', lxy: [1430, 520] });
  edge(D, 'f5', 'open', { from: 'r', to: 'r', ta: 170, mid: 1480, label: 'reopened', lxy: [1480, 300] });
  edge(D, 'flash', 'waiting', { from: 't', to: 'b', fa: 1000, tf: 0.3, label: 'any failure / try to give\nthe Serial Monitor back', lp: 0.4 });
  return finishDiagram(D, [
    ['Busy guard', 'While Flashing, a second flash() answers “busy” and the unplug notice is suppressed, because the board drops off USB when it resets.'],
    ['After an upload', 'The ESP32-S3 re-enumerates after the hard reset, so Reopening waits up to 9 s for a port with the same VID:PID and opens it at the Serial Monitor’s baud rate.'],
  ]);
}

function buildStatus(parent) {
  const D = newDiagram(parent, {
    num: '5.2', kind: 'UML state machine', title: 'Build and upload status (AppState.stateLabel)',
    desc: 'The words in the status bar. Verify and Upload take the compile server when one is set and the port is USB-C; otherwise the preview check and the preview board. From any end state, the next Verify or Upload starts again.',
  });
  initialNode(D, 'init', 30, 320);
  stateBox(D, 'ready', { x: 90, y: 300, w: 170, title: 'Ready' });
  stateBox(D, 'compiling', { x: 380, y: 110, w: 190, title: 'Compiling…', lines: ['on the compile server'], prose: true });
  stateBox(D, 'noserver', { x: 380, y: 300, w: 190, title: 'No compile server', fill: 'color/bg/app' });
  stateBox(D, 'verifying', { x: 380, y: 480, w: 190, title: 'Verifying…', lines: ['preview check'], prose: true });
  stateBox(D, 'unreach', { x: 700, y: 0, w: 210, title: 'Server not reachable · Build failed', fill: 'color/bg/app' });
  stateBox(D, 'verified', { x: 700, y: 170, w: 210, title: 'Verified', lines: ['sizes shown'], prose: true });
  stateBox(D, 'errors', { x: 700, y: 330, w: 210, title: 'Errors', lines: ['Problems tab opens'], prose: true, fill: 'color/bg/app' });
  stateBox(D, 'uploading', { x: 1000, y: 110, w: 200, title: 'Uploading n %', lines: ['esptool-js over USB-C'], prose: true });
  stateBox(D, 'simup', { x: 1000, y: 520, w: 200, title: 'Uploading…', lines: ['simulated log'], prose: true });
  stateBox(D, 'uploaded', { x: 1300, y: 20, w: 190, title: 'Uploaded' });
  stateBox(D, 'failed', { x: 1300, y: 150, w: 190, title: 'Upload failed', lines: ['BOOT + RESET tip'], prose: true, fill: 'color/bg/app' });
  stateBox(D, 'notconn', { x: 1300, y: 290, w: 190, title: 'Not connected', fill: 'color/bg/app' });
  stateBox(D, 'running', { x: 1300, y: 520, w: 190, title: 'Running', lines: ['on the preview board'], prose: true });
  stateBox(D, 'stopped', { x: 1580, y: 520, w: 170, title: 'Stopped' });

  edge(D, 'init', 'ready', {});
  edge(D, 'ready', 'compiling', { from: 'r', to: 'l', ff: 0.2, mid: 320, lp: 0.75, label: 'Verify / Upload\n[server set]', ldx: -10 });
  edge(D, 'ready', 'noserver', { label: 'Upload\n[USB-C, no server]', ldy: -4 });
  edge(D, 'ready', 'verifying', { from: 'r', to: 'l', ff: 0.8, mid: 320, lp: 0.75, label: 'Verify / Upload\n[no server or preview]', ldx: -10 });
  edge(D, 'compiling', 'unreach', { from: 'r', to: 'l', ff: 0.15, mid: 625, label: '[no reply]' });
  edge(D, 'compiling', 'verified', { from: 'r', to: 'l', ff: 0.5, tf: 0.3, mid: 625 });
  edge(D, 'compiling', 'errors', { from: 'r', to: 'l', ff: 0.85, tf: 0.3, mid: 650 });
  edge(D, 'compiling', 'uploading', { from: 't', to: 't', ff: 0.75, mid: 90, label: '[ok, Upload]' });
  edge(D, 'verifying', 'errors', { from: 'r', to: 'l', ff: 0.15, tf: 0.75, mid: 650, label: '[errors]', lp: 0.6 });
  edge(D, 'verifying', 'verified', { from: 'r', to: 'l', ff: 0.45, tf: 0.75, mid: 610, label: '[ok, Verify]', lp: 0.35 });
  edge(D, 'verifying', 'simup', { from: 'r', to: 'l', ff: 0.85, mid: 780, label: '[ok, Upload, preview]', lp: 0.7 });
  edge(D, 'uploading', 'uploaded', { from: 'r', to: 'l', ff: 0.2, mid: 1250, label: '[ok]' });
  edge(D, 'uploading', 'failed', { from: 'r', to: 'l', ff: 0.5, mid: 1250, label: '[failed]', lp: 0.8 });
  edge(D, 'uploading', 'notconn', { from: 'r', to: 'l', ff: 0.8, mid: 1270, label: '[no board]', lp: 0.8 });
  edge(D, 'simup', 'running', { label: 'done' });
  edge(D, 'running', 'stopped', { label: 'Stop or a\nruntime error' });
  return finishDiagram(D, [
    ['Busy', 'AppState.busy is “verify” or “upload” while a build runs; both buttons ignore presses until it clears.'],
    ['Errors point to code', 'Each problem names its file, line and column; “go to problem” opens the file and moves the cursor there. Errors inside a library name the library file.'],
  ]);
}

function modeStates(parent) {
  const D = newDiagram(parent, {
    num: '5.3', kind: 'UML state machine', title: 'Blocks and C++: who drives the code',
    desc: 'A project can be seen as blocks or as C++. While nobody has typed in the main file, the C++ is regenerated from the blocks; the first hand edit sets codeEdited and the blocks stop driving it, until “Rebuild code from blocks” overwrites the file again.',
  });
  initialNode(D, 'init', 40, 150);
  stateBox(D, 'blocks', { x: 150, y: 110, w: 250, title: 'Blocks · code follows the blocks', lines: ['mode = blocks', 'codeEdited = false'] });
  stateBox(D, 'gen', { x: 560, y: 110, w: 250, title: 'C++ view · generated', lines: ['mode = code', 'codeEdited = false'] });
  stateBox(D, 'edited', { x: 970, y: 110, w: 250, title: 'C++ view · edited by hand', lines: ['mode = code', 'codeEdited = true'] });
  stateBox(D, 'stale', { x: 970, y: 400, w: 250, title: 'Blocks · code no longer follows', lines: ['mode = blocks', 'codeEdited = true'] });
  stateBox(D, 'cpp', { x: 150, y: 580, w: 250, title: 'C++ only project', lines: ['mode = code', 'no blocks'] });
  edge(D, 'init', 'blocks', { label: '' });
  edge(D, 'init', 'cpp', { from: 'b', to: 'l', label: 'new C++ project, or an\nexample without blocks' });
  edge(D, 'blocks', 'gen', { ff: 0.3, tf: 0.3, label: 'switch to C++ / syncCode()' });
  edge(D, 'gen', 'blocks', { ff: 0.75, tf: 0.75, label: 'switch to Blocks' });
  edge(D, 'gen', 'edited', { label: 'type in the main file' });
  edge(D, 'edited', 'stale', { label: 'switch to Blocks' });
  edge(D, 'stale', 'blocks', { from: 'l', to: 'b', label: 'Rebuild code from blocks\n/ overwrites the main file', lp: 0.3 });
  edge(D, 'edited', 'gen', { from: 't', to: 't', mid: 60, label: 'Rebuild code from blocks' });
  return finishDiagram(D, [
    ['Why keep both', 'Students can move from blocks to C++ at their own pace and see exactly what each block becomes, without losing their typed changes by accident.'],
    ['Other files', 'Only the first file (the .ino) is generated. config.h and any extra tabs are always the student’s own.'],
  ]);
}
