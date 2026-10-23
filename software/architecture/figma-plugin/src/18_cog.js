// ============================================================================
// 08 — Cog (planned) and the roadmap
// ============================================================================

function buildCog(page) {
  const root = pageRoot(page, {
    title: 'Cog & roadmap',
    intro: 'Cog is the planned AI coding assistant and learning partner from the IDE design. Nothing here is built yet: these diagrams show one way to build it that keeps the design’s rules (hints before answers, show what it read, nothing changes without Apply). The roadmap lists what is still open across the platform.',
  });
  cogComponents(root);
  cogSequence(root);
  roadmap(root);
  return root;
}

function cogComponents(parent) {
  const D = newDiagram(parent, {
    num: '8.1', kind: 'UML component diagram · proposed', title: 'A possible shape for Cog',
    desc: 'The IDE gathers only what the student can see in the Cog panel’s context chips, and sends it to a small Cog service. The service applies the class’s settings, removes names, and asks a language model. The answer comes back as text, a hint or a diff; the IDE applies a diff only when the student presses Apply.',
  });
  el(D, 'editor', { x: 40, y: 80, w: 280, dom: 'ide', icon: 'code', uml: 'component', tag: 'Built today', title: 'Editor, Output and Problems', body: 'The open file and cursor line, compiler problems, the Serial Monitor, the selected block.' });
  el(D, 'settings', { x: 40, y: 330, w: 280, kind: 'planned', dom: 'cog', icon: 'sliders', uml: 'component', title: 'Cog settings', body: 'Help style (Hints first, Explain the answer, Write code for me), level, “may read my project”; teachers can lock them.' });
  el(D, 'ctx', { x: 420, y: 80, w: 300, kind: 'planned', dom: 'cog', icon: 'layers', uml: 'component', title: 'Context builder', body: 'Collects the file and line, the problems and output, the board and its pins, the selected block and its C++, and the help style.' });
  el(D, 'panel', { x: 420, y: 330, w: 300, kind: 'planned', dom: 'cog', icon: 'sparkles', uml: 'component', title: 'Cog panel', body: 'Chat, context chips, Explain lens, one hint at a time, the fix as a diff, Apply with undo, a quick check.' });
  el(D, 'svc', { x: 860, y: 200, w: 300, kind: 'planned', dom: 'cog', icon: 'server', uml: 'component', title: 'Cog service', body: 'Checks the class policy, removes names, limits use per class, builds the prompt, returns hints, explanations or a diff.' });
  el(D, 'policy', { x: 860, y: 470, w: 300, kind: 'planned', dom: 'cog', icon: 'database', title: 'Class policies', body: 'Teacher locks, help style and usage limits per class.' });
  el(D, 'llm', { x: 1280, y: 200, w: 260, kind: 'planned', dom: 'ext', icon: 'globe', title: 'Language-model provider', body: 'To be chosen: cost per student, privacy terms, quality on beginner C++.' });
  boundary(D, { ids: ['editor', 'settings', 'ctx', 'panel'], pad: 28, top: 52, tag: 'Browser', label: 'RoboCore IDE' });
  boundary(D, { ids: ['svc', 'policy'], pad: 28, top: 52, tag: 'Cloud · proposed', label: 'Cog backend', dash: [2, 3] });
  edge(D, 'editor', 'ctx', { dash: true, label: 'reads (if allowed)' });
  edge(D, 'settings', 'ctx', { from: 'r', to: 'l', tf: 0.8, mid: 370, dash: true, label: 'help style' });
  edge(D, 'panel', 'ctx', { from: 't', to: 'b', label: 'gather()' });
  edge(D, 'panel', 'svc', { from: 'r', to: 'l', tf: 0.7, dash: 'dot', label: 'HTTPS (planned)', tail: 'open' });
  edge(D, 'svc', 'policy', {});
  edge(D, 'svc', 'llm', { dash: 'dot', label: 'model API' });
  return finishDiagram(D, [
    ['Offline', 'Without internet the Cog panel shows the offline note; coding, Verify, Upload and the Serial Monitor keep working.'],
    ['Student code and privacy', 'Before building Cog: consent for sending code, no names in prompts, how long anything is kept, and what teachers can see.'],
    ['Cost', 'A per-class limit in the service keeps a school’s cost predictable; the model choice decides the price per hint.'],
  ]);
}

function cogSequence(parent) {
  const D = seq(parent, {
    num: '8.2', kind: 'UML sequence diagram · proposed', title: 'Explain an error (planned)', colW: 230,
    desc: 'The flow from the IDE design: Cog explains without giving the answer away, offers one hint at a time, shows the fix only when asked, and changes nothing until Apply.',
    parts: [
      { id: 'student', title: 'Student', icon: 'user', dom: 'people', kind: 'quiet' },
      { id: 'ui', title: 'Output / Problems', icon: 'code', dom: 'ide', tag: 'Built today' },
      { id: 'panel', title: 'Cog panel', icon: 'sparkles', dom: 'cog', kind: 'planned' },
      { id: 'ctx', title: 'Context builder', icon: 'layers', dom: 'cog', kind: 'planned' },
      { id: 'svc', title: 'Cog service', icon: 'server', dom: 'cog', kind: 'planned' },
      { id: 'llm', title: 'Language model', icon: 'globe', dom: 'ext', kind: 'planned' },
    ],
    msgs: [
      { a: 'student', b: 'ui', t: 'press Explain on the error', k: 'async' },
      { a: 'ui', b: 'panel', t: 'open with the problem (file, line)' },
      { a: 'panel', b: 'ctx', t: 'gather(problem, help style)' },
      { a: 'ctx', b: 'panel', t: 'context → shown as chips', k: 'return' },
      { a: 'panel', b: 'svc', t: 'explain(context, step 1)' },
      { a: 'svc', b: 'svc', t: 'check policy, remove names', lw: 160 },
      { a: 'svc', b: 'llm', t: 'prompt' },
      { a: 'llm', b: 'svc', t: 'explanation + first hint', k: 'return' },
      { a: 'svc', b: 'panel', t: 'what went wrong, hint 1 (no answer)', k: 'return' },
      { frag: 'opt', label: '[asks for another hint]' },
      { a: 'student', b: 'panel', t: 'Another hint', k: 'async' },
      { a: 'panel', b: 'svc', t: 'next hint' },
      { a: 'svc', b: 'panel', t: 'hint 2', k: 'return' },
      { endfrag: true },
      { frag: 'opt', label: '[asks to see the fix, and the help style allows it]' },
      { a: 'student', b: 'panel', t: 'Show the fix', k: 'async' },
      { a: 'panel', b: 'svc', t: 'fix(context)' },
      { a: 'svc', b: 'panel', t: 'diff', k: 'return' },
      { a: 'student', b: 'panel', t: 'Apply', k: 'async' },
      { a: 'panel', b: 'ui', t: 'edit the code as one undo step' },
      { endfrag: true },
      { a: 'panel', b: 'student', t: 'quick check: one question', k: 'async' },
    ],
  });
  return finishDiagram(D);
}

function roadmap(parent) {
  const card = docCard(parent, { num: '8.3', kind: 'Roadmap', title: 'What is still open', desc: 'Across the whole platform, from the code, the board’s test checklist and the design. Order is roughly by when it can happen.' });
  table(card, [['Item', 300], ['Why', 560], ['Depends on', 360], ['Status', 180]], [
    ['First real-board tests', 'The 12-sketch checklist: BoardTest, Blink, ButtonLed, MotorControl, UltrasonicDistance, LineFollower, SensorsToSerial, buzzer, RGB, servo, obstacle avoider, serial echo.', 'The first V2 boards arriving', 'Waiting'],
    ['Direction and polarity defaults', 'If a wheel or encoder runs backwards, or the line sensor is inverted, change the library defaults so every example stays the same.', 'The checklist (MotorControl, LineFollower)', 'Waiting'],
    ['Host the compile server', 'Deploy with render.yaml (free) or Cloud Run, then put its address in Settings → Compile server.', 'A Render or Google Cloud account', 'Ready to do'],
    ['Turn on GitHub Pages', 'So the Publish web app job can deploy the web IDE.', 'A repository admin, once', 'Ready to do'],
    ['USB on the native apps', 'Android (USB OTG) and desktop serial, so the native apps can upload too.', 'A serial plugin per platform', 'Planned'],
    ['Upload to an Arduino Uno', 'The server already builds Uno .hex files; the browser cannot write them yet.', 'An AVR flasher in the USB bridge', 'Planned'],
    ['Lessons and teacher training', 'Step-by-step builds and lessons that fit the curriculum.', 'Pilot schools, the Curriculum Development Centre', 'Planned'],
    ['Cog', 'The AI learning partner from the design.', 'A model provider, privacy rules, a budget', 'Design only'],
    ['Offline classrooms', 'Run the compile server on a laptop (Docker, localhost), or use Arduino IDE 2 with the RoboCore library.', 'Teacher guide', 'Possible today'],
    ['MicroPython option', 'Near-instant uploads with no compiler, as on the XRP. Considered on 12 Oct 2026; the IDE uses Arduino C++ for now.', 'A robocore Python library', 'Not chosen'],
  ], { name: 'Roadmap table' });
  return card;
}
