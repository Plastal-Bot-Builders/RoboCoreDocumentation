// ============================================================================
// The block library: hardware-first blocks for the RoboCore V2, in the spirit of
// LEGO SPIKE Prime's word blocks (ideas only, not their art): blocks talk about the
// robot ("move forward for 10 cm", "when obstacle is closer than 20 cm"), every
// action has a "for …" / "start …" / "stop" form, and every sensor gives a value,
// a yes/no question and (in Events) a "when …" hat.
// Everything on the board is built in, so there are no port dropdowns (servos 1–4 only).
//
// [category, name, parts, kind, generates, library]
//   kind: statement | reporter | boolean | hatC (hat that holds blocks) | c | cElse
//   generates: the Arduino C++ the block writes (what the Code view shows)
//   library: what the RoboCore library needs: '' = exists today, otherwise the helper to add
// Also written to docs/block-catalogue.md by tools/blocks_md.js.
// ============================================================================

const BLOCK_CATS = [
  ['Events', 'zap', 'events', 'Program start, forever, and “when …” hats'],
  ['Movement', 'bot', 'movement', 'Drive the robot: move, turn, steer, speed'],
  ['Motors', 'gauge', 'motors', 'One wheel motor at a time, and servos 1–4'],
  ['Light & Sound', 'lightbulb', 'light', 'The RGB LED and the buzzer'],
  ['Sensors', 'radio', 'sensors', 'Distance, line, tilt, button, battery, timer'],
  ['Control', 'repeat', 'control', 'Wait, repeat, if, wait until'],
  ['Operators', 'sigma', 'operators', 'Maths, comparisons, and / or / not, text'],
  ['Variables', 'variable', 'variables', 'Set, change and read variables'],
  ['My Blocks', 'blocks', 'myblocks', 'Make your own block (a function)'],
  ['Pins & Serial', 'plug', 'pins', 'Expansion pins and the serial port (Advanced)'],
];

const NEW = (s) => 'new: ' + s;
const BLOCK_LIBRARY = [
  // ---- Events: hats. on start → setup(), forever → loop(); the "when …" hats are checked on every pass of loop()
  ['Events', 'On start', ['on start'], 'hatC', 'void setup() { … }', ''],
  ['Events', 'Forever', ['forever'], 'hatC', 'void loop() { … }', ''],
  ['Events', 'When USER pressed', ['when USER button is pressed'], 'hatC', 'if (RoboCore::userJustPressed()) { … }', NEW('RoboCore::userJustPressed() (true once per press)')],
  ['Events', 'When obstacle closer', ['when obstacle is closer than', N('20'), 'cm'], 'hatC', 'if (sonar.justCloserThan(20)) { … }', NEW('Sonar::justCloserThan(cm)')],
  ['Events', 'When line', ['when the line is', D('found')], 'hatC', 'if (line.justFound()) { … }', NEW('LineSensor::justFound() / justLost()')],
  ['Events', 'When tilted', ['when the robot is', D('tilted')], 'hatC', 'if (imu.justTilted()) { … }', NEW('IMU::justTilted() / justShaken() / justFlat()')],
  ['Events', 'When timer', ['when timer >', N('10'), 's'], 'hatC', 'if (RoboCore::timerPassed(10)) { … }', NEW('RoboCore::timerPassed(s)')],
  ['Events', 'When condition', ['when', { t: 'slot' }], 'hatC', 'if (becameTrue(condition)) { … }', NEW('edge detector for any condition')],
  ['Events', 'When I receive', ['when I receive', D('message1')], 'hatC', 'void on_message1() { … }', ''],
  ['Events', 'Broadcast', ['broadcast', D('message1')], 'statement', 'on_message1();', ''],

  // ---- Movement: both wheels together (a driving base), using the encoders and the IMU
  ['Movement', 'Move', [{ t: 'icon', v: 'bot' }, 'move', D('forward'), 'for', N('10'), D('cm')], 'statement', 'robot.move(10, CM);', NEW('RoboCoreDrive robot: move(amount, CM | ROTATIONS | SECONDS)')],
  ['Movement', 'Turn', [{ t: 'icon', v: 'bot' }, 'turn', D('right'), 'for', N('90'), '°'], 'statement', 'robot.turn(90);', NEW('robot.turn(degrees), using the IMU yaw')],
  ['Movement', 'Start moving', [{ t: 'icon', v: 'bot' }, 'start moving', D('forward')], 'statement', 'robot.start(FORWARD);', NEW('robot.start(FORWARD | BACKWARD)')],
  ['Movement', 'Steer', [{ t: 'icon', v: 'bot' }, 'start moving, steering', N('30')], 'statement', 'robot.steer(30);', NEW('robot.steer(-100 … 100)')],
  ['Movement', 'Drive', [{ t: 'icon', v: 'bot' }, 'drive left', N('50'), '% right', N('50'), '%'], 'statement', 'motors.drive(50, 50);', ''],
  ['Movement', 'Stop moving', [{ t: 'icon', v: 'bot' }, 'stop moving'], 'statement', 'robot.stop();', NEW('robot.stop() (brake)')],
  ['Movement', 'Movement speed', [{ t: 'icon', v: 'bot' }, 'set movement speed to', N('50'), '%'], 'statement', 'robot.setSpeed(50);', NEW('robot.setSpeed(percent)')],
  ['Movement', 'Wheel size', [{ t: 'icon', v: 'bot' }, 'set 1 wheel turn to', N('18.8'), 'cm'], 'statement', 'robot.setWheelCm(18.8);', NEW('robot.setWheelCm(cm) (60 mm wheel = 18.8 cm)')],
  ['Movement', 'Distance moved', ['distance moved (cm)'], 'reporter', 'robot.distanceCm()', NEW('robot.distanceCm() from the encoders')],

  // ---- Motors: one wheel motor at a time, and the servo ports
  ['Motors', 'Run motor', [{ t: 'icon', v: 'gauge' }, 'run', D('left'), 'motor for', N('1'), D('rotations')], 'statement', 'motors.run(LEFT, 1, ROTATIONS);', NEW('RoboCoreMotors::run(side, amount, unit)')],
  ['Motors', 'Start motor', [{ t: 'icon', v: 'gauge' }, 'start', D('left'), 'motor at', N('50'), '%'], 'statement', 'motors.start(LEFT, 50);', NEW('RoboCoreMotors::start(side, percent)')],
  ['Motors', 'Stop motor', [{ t: 'icon', v: 'gauge' }, 'stop', D('left'), 'motor'], 'statement', 'motors.stop(LEFT);', NEW('RoboCoreMotors::stop(side)')],
  ['Motors', 'Reset motor', [{ t: 'icon', v: 'gauge' }, 'reset', D('left'), 'motor position'], 'statement', 'motors.resetPosition(LEFT);', NEW('RoboCoreMotors::resetPosition(side)')],
  ['Motors', 'Motor position', [D('left'), 'motor position (°)'], 'reporter', 'motors.positionDeg(LEFT)', NEW('positionDeg(side) (needs encoder counts per wheel turn)')],
  ['Motors', 'Motor speed', [D('left'), 'motor speed (%)'], 'reporter', 'motors.speedPercent(LEFT)', NEW('speedPercent(side)')],
  ['Motors', 'Set servo', [{ t: 'icon', v: 'gauge' }, 'set servo', D('1'), 'to', N('90'), '°'], 'statement', 'servos.write(1, 90);', NEW('RoboCoreServos servos: write(port, degrees)')],
  ['Motors', 'Servo angle', ['servo', D('1'), 'angle (°)'], 'reporter', 'servos.angle(1)', NEW('servos.angle(port)')],

  // ---- Light & Sound: the RGB LED (also LED_BUILTIN) and the buzzer
  ['Light & Sound', 'Turn LED', ['turn LED', D('on')], 'statement', 'digitalWrite(LED_BUILTIN, HIGH);', ''],
  ['Light & Sound', 'LED colour', ['set LED to', D('red')], 'statement', 'RoboCore::rgb(255, 0, 0);', ''],
  ['Light & Sound', 'LED brightness', ['set LED brightness to', N('50'), '%'], 'statement', 'RoboCore::ledBrightness(50);', NEW('RoboCore::ledBrightness(percent)')],
  ['Light & Sound', 'Play beep', ['play beep', D('C5'), 'for', N('0.2'), 's'], 'statement', 'RoboCore::beep(523, 200);', ''],
  ['Light & Sound', 'Start beep', ['start playing beep', D('C5')], 'statement', 'tone(RC_PIN_BUZZER, 523);', ''],
  ['Light & Sound', 'Play melody', ['play melody', D('power up')], 'statement', 'RoboCore::melody(MELODY_POWER_UP);', NEW('RoboCore::melody(id) + a few built-in tunes')],
  ['Light & Sound', 'Stop sound', ['stop sound'], 'statement', 'noTone(RC_PIN_BUZZER);', ''],

  // ---- Sensors: value + yes/no question for each sensor (the "when" forms are in Events)
  ['Sensors', 'Distance', ['distance (cm)'], 'reporter', 'sonar.distanceCm()', ''],
  ['Sensors', 'Is closer than', ['is obstacle closer than', N('20'), 'cm?'], 'boolean', 'sonar.distanceCm() < 20', ''],
  ['Sensors', 'Line position', ['line position'], 'reporter', 'line.read()', ''],
  ['Sensors', 'On the line', ['is', D('centre'), 'sensor on the line?'], 'boolean', 'line.centre() > 0.5', ''],
  ['Sensors', 'Line sensor', [D('centre'), 'line sensor (%)'], 'reporter', 'line.centre() * 100', ''],
  ['Sensors', 'Tilt angle', ['tilt angle (°)'], 'reporter', 'imu.tiltDeg()', ''],
  ['Sensors', 'Angle', [D('yaw'), 'angle (°)'], 'reporter', 'imu.yawDeg()', NEW('IMU::yawDeg() / pitchDeg() / rollDeg()')],
  ['Sensors', 'Reset yaw', ['set yaw angle to 0'], 'statement', 'imu.resetYaw();', NEW('IMU::resetYaw()')],
  ['Sensors', 'Is tilted', ['is the robot', D('tilted'), '?'], 'boolean', 'imu.isTilted()', NEW('IMU::isTilted() / isShaken() / isFlat()')],
  ['Sensors', 'USER pressed', ['is USER button pressed?'], 'boolean', 'RoboCore::userPressed()', ''],
  ['Sensors', 'Battery', ['battery', D('%')], 'reporter', 'RoboCore::batteryPercent()', NEW('RoboCore::batteryPercent() (volts: batteryVolts() exists)')],
  ['Sensors', 'Temperature', ['temperature (°C)'], 'reporter', 'imu.temperature()', ''],
  ['Sensors', 'Timer', ['timer (s)'], 'reporter', 'RoboCore::timer()', NEW('RoboCore::timer() / resetTimer()')],
  ['Sensors', 'Reset timer', ['reset timer'], 'statement', 'RoboCore::resetTimer();', NEW('RoboCore::resetTimer()')],

  // ---- Control
  ['Control', 'Wait', ['wait', N('1'), D('secs')], 'statement', 'delay(1000);', ''],
  ['Control', 'Repeat', ['repeat', N('5'), 'times'], 'c', 'for (int i = 0; i < 5; i++) { … }', ''],
  ['Control', 'If', ['if', { t: 'slot' }, 'then'], 'c', 'if (condition) { … }', ''],
  ['Control', 'If else', ['if', { t: 'slot' }, 'then'], 'cElse', 'if (condition) { … } else { … }', ''],
  ['Control', 'Wait until', ['wait until', { t: 'slot' }], 'statement', 'while (!(condition)) delay(10);', ''],
  ['Control', 'Repeat until', ['repeat until', { t: 'slot' }], 'c', 'while (!(condition)) { … }', ''],
  ['Control', 'Stop program', ['stop program'], 'statement', 'RoboCore::stopProgram();', NEW('RoboCore::stopProgram() (motors off, then idle)')],

  // ---- Operators
  ['Operators', 'Arithmetic', [N('0'), D('+'), N('0')], 'reporter', '(a + b)', ''],
  ['Operators', 'Compare', [N('0'), D('<'), N('20')], 'boolean', '(a < b)', ''],
  ['Operators', 'And or', [{ t: 'slot' }, D('and'), { t: 'slot' }], 'boolean', '(a && b)', ''],
  ['Operators', 'Not', ['not', { t: 'slot' }], 'boolean', '!(a)', ''],
  ['Operators', 'Random', ['pick random', N('1'), 'to', N('10')], 'reporter', 'random(1, 11)', ''],
  ['Operators', 'In between', ['is', N('0'), 'between', N('-10'), 'and', N('10'), '?'], 'boolean', '(x >= -10 && x <= 10)', ''],
  ['Operators', 'Maths', [D('round'), N('3.6')], 'reporter', 'round(3.6)', ''],
  ['Operators', 'Join', ['join', T('cm: '), T('20')], 'reporter', 'String("cm: ") + "20"', ''],

  // ---- Variables (Blockly's variables; "Create variable…" button in the flyout)
  ['Variables', 'Set variable', ['set', D('distance'), 'to', N('0')], 'statement', 'distance = 0;', ''],
  ['Variables', 'Change variable', ['change', D('count'), 'by', N('1')], 'statement', 'count += 1;', ''],
  ['Variables', 'Variable', ['distance'], 'reporter', 'distance', ''],

  // ---- My Blocks (Blockly procedures; "Make a block…" button in the flyout)
  ['My Blocks', 'Define', ['define', T('blink twice')], 'hatC', 'void blinkTwice() { … }', ''],
  ['My Blocks', 'Call', ['blink twice'], 'statement', 'blinkTwice();', ''],

  // ---- Pins & Serial (shown at the Intermediate and Advanced levels)
  ['Pins & Serial', 'Set digital pin', ['set pin', D('IO37'), 'to', D('HIGH')], 'statement', 'digitalWrite(RC_PIN_EXP_IO37, HIGH);', ''],
  ['Pins & Serial', 'Read digital pin', ['read pin', D('IO37')], 'reporter', 'digitalRead(RC_PIN_EXP_IO37)', ''],
  ['Pins & Serial', 'Read analog pin', ['read analog pin', D('IO37')], 'reporter', 'analogRead(RC_PIN_EXP_IO37)', ''],
  ['Pins & Serial', 'Serial begin', ['start serial at', D('115200'), 'baud'], 'statement', 'Serial.begin(115200);', ''],
  ['Pins & Serial', 'Print to serial', ['print', T('RoboCore V2 ready')], 'statement', 'Serial.println("RoboCore V2 ready");', ''],
  ['Pins & Serial', 'Serial read line', ['serial read line'], 'reporter', 'Serial.readStringUntil(\'\\n\')', ''],
];

// block text in Scratch-style notation, for the catalogue: [dropdown] (number) “text” < > (empty yes / no slot)
function blockText(parts) {
  return parts.map(p => typeof p === 'string' ? p : p.t === 'drop' ? '[' + p.v + ']' : p.t === 'num' ? '(' + p.v + ')' : p.t === 'text' ? '“' + p.v + '”' : p.t === 'slot' ? '< >' : '')
    .filter(Boolean).join(' ').replace(/ \?/g, '?').replace(/ %/g, ' %');
}
const BLOCK_SHAPE = { statement: 'stack', reporter: 'value', boolean: 'yes / no', hatC: 'hat', c: 'C (loop / if)', cElse: 'C (if / else)' };
function blockCatalogueRows() {
  return BLOCK_LIBRARY.map(([cat, , parts, kind, gen, lib]) => [cat, blockText(parts), BLOCK_SHAPE[kind] || kind, gen, lib ? lib.replace(/^new: /, 'add ') : 'exists']);
}
