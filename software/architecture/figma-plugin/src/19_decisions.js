// ============================================================================
// 09 — Decisions & glossary
// ============================================================================

function buildDecisions(page) {
  const root = pageRoot(page, {
    title: 'Decisions & glossary',
    intro: 'The main choices behind the platform, why they were made and what they cost, so that a new team member can tell which parts are deliberate and which are open to change.',
  });
  const c1 = docCard(root, { num: '9.1', kind: 'Architecture decision records', title: 'Why it is built this way' });
  table(c1, [['Decision', 300], ['Why', 520], ['Trade-off', 460], ['Status', 140]], [
    ['One Flutter codebase for web, Android, iOS, Windows and macOS', 'One small team, one UI that matches the Figma design everywhere.', 'USB works only in the web build for now.', 'Built'],
    ['USB from the browser: Web Serial + esptool-js', 'Nothing to install on school computers; the ESP32-S3’s own USB means no driver and no USB-serial chip.', 'Needs Chrome or Edge on a computer.', 'Built, waits for the board'],
    ['Compile on a server (arduino-cli in Docker)', 'The ESP32 toolchain is several hundred MB and school internet is slow; one pinned toolchain gives every student the same build.', 'Real uploads need internet and hosting; the free host sleeps (about a minute to wake).', 'Built'],
    ['A preview check and a simulated board in the app', 'Students can write, check and run code with no board and no internet, and see errors worded like the Arduino compiler’s.', 'Not a full C++ compiler: some sketches need the real board (marked realOnly).', 'Built'],
    ['Arduino C++, not MicroPython (for now)', 'Matches Arduino IDE 2, which works offline with the same library, and the C++ the blocks show.', 'Each upload compiles (seconds to tens of seconds). MicroPython stays an option.', 'Chosen'],
    ['Projects stay on the device; no accounts', 'No student data to protect or lose; nothing to sign up for.', 'No sync or sharing between devices yet.', 'Built'],
    ['One pin map, generated into the app and checked in CI', 'The library, the examples and the blocks can never disagree about a pin.', 'Changing a pin means editing the header and re-running the generator.', 'Built'],
    ['Pin every version', 'Flutter 3.47.7, arduino-cli 1.5.1, esp32 core 3.3.12, libraries and actions by commit, so builds repeat exactly.', 'Updates are deliberate work.', 'Built'],
    ['ESP32-S3 + XRP-compatible motors + 1S Li-ion with on-board charging and protection', 'Native USB, XRP’s proven motor and IMU choices, a battery that charges from USB-C and is protected from wrong packs.', 'The board needs 4 layers and small parts, so the first boards are made in China.', 'Board in manufacture'],
    ['A small, careful compile server', 'Compiles only, never runs code; unprivileged user; throwaway folders; size, time, queue and rate limits; a CORS allow-list.', 'One build at a time on the free plan.', 'Built'],
  ], { name: 'Decisions table' });
  const c2 = docCard(root, { num: '9.2', kind: 'Glossary', title: 'Words used in this file' });
  table(c2, [['Term', 260], ['Meaning', 900]], [
    ['AppState', 'The one object in the IDE that holds all state and runs Verify, Upload and the USB link. Screens listen to it.'],
    ['BoardIO', 'The interface the interpreter talks to when it runs a sketch; SimBoard implements it.'],
    ['CDC', 'USB Communications Device Class: how the board’s Serial appears as a serial port on the computer.'],
    ['Compile server', 'The Docker service that runs arduino-cli and returns the program in four parts.'],
    ['esptool-js', 'Espressif’s flasher in JavaScript; writes programs to ESP32 chips over Web Serial.'],
    ['FQBN', 'Fully qualified board name for arduino-cli; for the V2: esp32:esp32:esp32s3 with USB, flash, partition and PSRAM options.'],
    ['Preview board', 'The simulated RoboCore inside the IDE (SimBoard), used when no real board is connected.'],
    ['Preview check', 'The IDE’s own check of a sketch (compileSketch), used when no compile server is set.'],
    ['PSRAM', 'Extra RAM next to the ESP32-S3; the N8R2 module has 2 MB of quad PSRAM.'],
    ['RC_PIN_…', 'The pin names in RoboCoreV2Pins.h, e.g. RC_PIN_BUZZER = 47.'],
    ['1S, 1S3P', 'One cell in series; 1S3P = three cells in parallel, still 3.0–4.2 V.'],
    ['VMOT', 'The 5.5 V rail for the motors and servos, off when the switch is OFF.'],
    ['Web Serial', 'The browser API (Chrome, Edge) that lets a web page open a serial port after the user picks it.'],
    ['XRP', 'SparkFun’s Experiential Robotics Platform; RoboCore V2 uses the same motors and IMU and fixes some of its limits.'],
  ], { name: 'Glossary table' });
  return root;
}
