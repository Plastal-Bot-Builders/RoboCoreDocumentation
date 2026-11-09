# RoboCore V2 controller: pin reference

Which pin drives each part of the RoboCore V2 board, and how to use each part from Arduino code.

This guide covers the board as built (V2-01 and V2-02, November 2026). It was checked against the board files, the bring-up program and version 3.3.11 of the ESP32 Arduino core on 2026-11-09. Every sketch in it compiles for the board.

## The short version

- **A pin number is the ESP32-S3's GPIO number.** The board and this guide print it as IO plus the number, so IO47 is pin 47.
- **The buzzer is on IO47**, so a beep is `tone(47, 2000, 100);`.
- **The RoboCore library names every pin.** With it you can write `tone(RC_PIN_BUZZER, 2000, 100);` instead of the number.
- **The Arduino Uno's numbers don't carry over.** On the V2:
  - pin 8 is the I²C data line, not a free pin;
  - `A0` means IO1, the motion sensor's interrupt;
  - the parts on the board have no pin number printed next to them, which is why this table exists.

## Board settings

**Arduino IDE.** In Boards Manager, install **esp32 by Espressif Systems** (3.3.x). Then set these in the Tools menu and leave the rest at their defaults:

| Setting | Value |
|---|---|
| Board | ESP32S3 Dev Module |
| USB CDC On Boot | Enabled |
| Flash Size | 8MB (64Mb) |
| Partition Scheme | 8M with spiffs (3MB APP/1.5MB SPIFFS) |
| PSRAM | QSPI PSRAM |

**arduino-cli.** Use this FQBN: `esp32:esp32:esp32s3:CDCOnBoot=cdc,FlashSize=8M,PartitionScheme=default_8MB,PSRAM=enabled`

**RoboCore IDE.** Choose RoboCore V2 as the board. Its blocks write the library names from this guide into the code.

**USB.**
- `Serial` talks over the USB cable.
- Opening the serial port restarts the board, so the first lines of `setup()` can be gone before the monitor opens.
- If an upload doesn't start, hold BOOT, tap RESET, release BOOT, then upload again.

**The RoboCore library.**
- The RoboCore IDE already includes it.
- For the Arduino IDE, copy the `RoboCore` folder from the robocore-ide repository (`firmware/RoboCore`) into your Arduino `libraries` folder.
- Start sketches that use it with `#include <RoboCore.h>`.

## Parts on the board

| Part | Pin | Library name | Use it with |
|---|---|---|---|
| Buzzer | IO47 | `RC_PIN_BUZZER` | `tone(47, hz)`, `noTone(47)` |
| RGB LED | IO48 | `RC_PIN_RGB_LED`, or the core's `RGB_BUILTIN` | `rgbLedWrite(RGB_BUILTIN, r, g, b)` |
| USER button | IO42 | `RC_PIN_USER_BUTTON` | `digitalRead(42)`: LOW while pressed |
| BOOT button | IO0 | `RC_PIN_BOOT_BUTTON` | `digitalRead(0)`: LOW while pressed |
| Motion sensor (IMU) | I²C on IO8/IO9, address 0x6A; interrupt on IO1 | `RC_PIN_I2C_SDA`, `RC_PIN_I2C_SCL`, `RC_IMU_I2C_ADDR`, `RC_PIN_IMU_INT1` | `Wire`, or the library's `IMU` |
| Battery voltage | IO4 | `RC_PIN_BATTERY_SENSE` | `analogReadMilliVolts(4) * 2` |
| Motor 1 | IO11 forward, IO12 reverse | `RC_PIN_MOTOR1_IN1`, `RC_PIN_MOTOR1_IN2` | The library's `RoboCoreMotors` |
| Motor 2 | IO13 forward, IO14 reverse | `RC_PIN_MOTOR2_IN1`, `RC_PIN_MOTOR2_IN2` | The library's `RoboCoreMotors` |
| Motor currents | IO5 (motor 1), IO6 (motor 2) | `RC_PIN_MOTOR1_ISENSE`, `RC_PIN_MOTOR2_ISENSE` | `analogReadMilliVolts(5) / 3300.0` = amps |
| Encoders | IO15/IO16 (motor 1 A/B), IO17/IO18 (motor 2 A/B) | `RC_PIN_ENC1_A` … `RC_PIN_ENC2_B` | The library's `RoboCoreMotors` |
| Motor driver fault | IO21 | `RC_PIN_MOTOR_NFAULT` | `digitalRead(21)`: LOW on a fault |

The five small status LEDs (CHG, FULL, USB, 3V3, MOT) are wired to the power circuits. A program can't change them.

### Buzzer (IO47)

The buzzer (BZ201) is a small magnetic speaker, switched by a transistor (Q201). It makes a sound only while the pin switches on and off quickly, so drive it with `tone()`.

```cpp
// Three beeps, then a rising scale on the buzzer (IO47).
const int BUZZER = 47;

void setup() {
  for (int i = 0; i < 3; i++) {
    tone(BUZZER, 2000, 100);  // 2000 Hz for 100 ms. tone() doesn't wait...
    delay(200);               // ...so wait here before the next beep
  }
  int notes[] = {262, 330, 392, 523};  // C4, E4, G4, C5
  for (int hz : notes) {
    tone(BUZZER, hz);  // plays until the next tone() or noTone()
    delay(300);
  }
  noTone(BUZZER);  // always finish with noTone()
}

void loop() {}
```

**How it behaves**
- `tone(pin, hz)` plays until `noTone(pin)`.
- `tone(pin, hz, ms)` stops by itself.
- Neither of them waits, so put a `delay()` between notes.

**Don't use `digitalWrite(47, HIGH)`.**
- That is how you drive the "active" buzzer in many Arduino kits.
- Here it only clicks, and it leaves the coil switched on, draining the battery, until the pin goes LOW again.

**With the library:**
- `RoboCore::beep(2000, 80);` beeps and waits until it ends.
- `RoboCore::melody(MELODY_SUCCESS);` plays a built-in tune.

The buzzer pin also comes out on expansion A pin 10.

### RGB LED (IO48)

The LED (D201) is a WS2812B addressable colour LED. It takes colour data, not on and off, so set it with `rgbLedWrite()`.

```cpp
// Red, green, blue, off on the RGB LED (IO48).
void setup() {}

void loop() {
  rgbLedWrite(RGB_BUILTIN, 80, 0, 0);  // red (0-255 each; 255 is very bright)
  delay(500);
  rgbLedWrite(RGB_BUILTIN, 0, 80, 0);  // green
  delay(500);
  rgbLedWrite(RGB_BUILTIN, 0, 0, 80);  // blue
  delay(500);
  rgbLedWrite(RGB_BUILTIN, 0, 0, 0);   // off
  delay(500);
}
```

**Blink sketches.**
- There is no single-colour LED to blink.
- `digitalWrite(LED_BUILTIN, HIGH)` lights the RGB LED dim white, so the standard Blink example works.
- `digitalWrite(48, HIGH)` doesn't light it. Use `LED_BUILTIN`, `RGB_BUILTIN` or `rgbLedWrite()`.

**With the library:**
- `RoboCore::rgb(r, g, b);` sets the colour.
- `RoboCore::ledBrightness(percent);` scales the brightness.

**More LEDs.** The LED's data output comes out on expansion A pin 11, so you can chain more WS2812 LEDs. To drive the chain, use a NeoPixel library on pin 48.

### USER and BOOT buttons (IO42, IO0)

Both buttons read LOW while pressed. The board has a 10 kΩ pull-up on each, so `INPUT` is enough.

```cpp
// The RGB LED turns green while USER (IO42) is held down.
const int USER_BUTTON = 42;

void setup() {
  pinMode(USER_BUTTON, INPUT);  // the board has its own pull-up
}

void loop() {
  if (digitalRead(USER_BUTTON) == LOW) {
    rgbLedWrite(RGB_BUILTIN, 0, 60, 0);
  } else {
    rgbLedWrite(RGB_BUILTIN, 0, 0, 0);
  }
  delay(20);
}
```

**BOOT** is free to read once your program runs. If you hold it while the board resets or powers up, the board waits for an upload instead of running your program.

**RESET** restarts the board. A program can't read it.

**With the library:** `RoboCore::userPressed()` is true while USER is held down, and `RoboCore::waitForUser()` waits for one press.

### Motion sensor (IMU)

The LSM6DSOX accelerometer and gyroscope sits on the I²C bus:
- SDA is IO8 and SCL is IO9, the default `Wire` pins for this board setting.
- Its address is 0x6A.
- Its interrupt output goes to IO1.

The X and Y arrows printed beside it show its axes. It shares the bus with the Qwiic socket, so don't plug in another device that uses address 0x6A.

```cpp
// Prints how far the board is tilted, using the RoboCore library.
#include <RoboCore.h>

IMU imu;

void setup() {
  Serial.begin(115200);
  imu.begin();
}

void loop() {
  Serial.printf("Tilt: %.1f degrees\n", imu.tiltDeg());
  delay(200);
}
```

The library's `IMU` class also has `accelX()`…`accelZ()` (in g), `gyroX()`…`gyroZ()` (in degrees per second) and `temperature()`.

### Battery voltage (IO4)

IO4 sees half the battery voltage, through a 100 kΩ/100 kΩ divider.

```cpp
// Prints the battery voltage once a second.
void setup() {
  Serial.begin(115200);
}

void loop() {
  float volts = analogReadMilliVolts(4) * 2 / 1000.0;  // IO4 sees half the battery voltage
  Serial.printf("Battery: %.2f V\n", volts);
  delay(1000);
}
```

On USB with no battery fitted it still reads about 4 V, because that is the charger's output. So it can't tell whether a cell is fitted.

**With the library:** `RoboCore::batteryVolts()` and `RoboCore::batteryPercent()`.

### Motors and encoders

| | Motor 1 (MOTOR socket J301) | Motor 2 (MOTOR socket J302) |
|---|---|---|
| Forward input (IN1) | IO11 | IO13 |
| Reverse input (IN2) | IO12 | IO14 |
| Current (3.3 V per amp) | IO5 | IO6 |
| Encoder A / B | IO15 / IO16 | IO17 / IO18 |

The DRV8411A driver pulls IO21 LOW when it shuts down for over-current, overheating or low voltage.

**How the inputs work**
- PWM on IN1, with IN2 LOW, drives forward. PWM on IN2, with IN1 LOW, drives in reverse.
- Both LOW lets the motor coast.
- The library does all of this for you, at 20 kHz so the motors don't whine. In the library, motor 1 is the left wheel.

```cpp
// Both motors forward at half speed for a second, then stop for a second.
#include <RoboCore.h>

RoboCoreMotors motors;

void setup() {
  motors.begin();
}

void loop() {
  motors.drive(50, 50);  // left %, right % (negative = reverse)
  delay(1000);
  motors.stop();
  delay(1000);
}
```

**Before you run the motors:**
- **XRP motors need a reversed cable.** On V2 boards, the motor sockets are wired back to front for SparkFun XRP motors (errata E-015). Use a 6-way JST SH cable that is reversed (pin 1 to pin 6), or the motor won't turn and its encoder can be damaged.
- **Motors and servos need the battery and the switch ON.** Their 5.5 V supply (VMOT) is off when the switch is OFF, even on USB. On USB alone, a motor can't start (errata E-014).

## Connectors

The pin names in bold are the ones printed beside each header on the board.

### Servos 1 to 4

| Header | Signal pin | Library port |
|---|---|---|
| SERVO 1 (J401) | IO38 | `servos.write(1, …)` |
| SERVO 2 (J402) | IO39 | `servos.write(2, …)` |
| SERVO 3 (J407) | IO35 | `servos.write(3, …)` |
| SERVO 4 (J408) | IO36 | `servos.write(4, …)` |

Each header's pins are printed as **IOnn, 5.5V, GND**: signal, power, ground. Plug the servo's brown or black wire into GND.

```cpp
// Swings the servo on SERVO 1 (IO38) between 0 and 180 degrees.
#include <RoboCore.h>

RoboCoreServos servos;

void setup() {}

void loop() {
  servos.write(1, 0);    // port 1 to 0 degrees
  delay(1000);
  servos.write(1, 180);
  delay(1000);
}
```

Servos only move while the switch is ON. `servos.release(1)` stops the pulses, so the servo goes limp.

### Ultrasonic (J403)

The pins are printed as **3V3, TRIG, ECHO, GND**, the same order as an HC-SR04, so a straight cable works. TRIG is IO40 and ECHO is IO41. Use a module that runs on 3.3 V, such as the HC-SR04+ or RCWL-1601.

```cpp
// Prints the distance from the ultrasonic sensor 10 times a second.
const int TRIG = 40, ECHO = 41;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
}

void loop() {
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 30000);  // 0 when nothing echoes back within about 5 m
  Serial.printf("%.1f cm\n", us / 58.0);
  delay(100);
}
```

**With the library:** `Sonar sonar;` then `sonar.distanceCm()`.

### Line sensor (J404)

The pins are printed as **3V3, GND, L, C, R**:
- L is IO7, C is IO10 and R is IO2;
- all three are analog inputs, reading 0 to 4095;
- they work with Wi-Fi on.

Line modules differ, so check your module's pin order against these labels before you plug it in (errata E-009).

```cpp
// Prints the three line-sensor readings 10 times a second.
void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.printf("L %4d   C %4d   R %4d\n", analogRead(7), analogRead(10), analogRead(2));
  delay(100);
}
```

**With the library:** `LineSensor line;` then `line.left()`, `line.centre()`, `line.right()`, or `line.read()` for the line position (−1 far left, 0 centred, 1 far right).

### Qwiic (J201)

The pins are GND, 3.3 V, SDA (IO8) and SCL (IO9), the same bus as the motion sensor. Use 3.3 V Qwiic or STEMMA QT boards only.

### Expansion headers A (J405) and B (J406)

The pin names are printed on the back of the board.

| Pin | Expansion A | Expansion B |
|---|---|---|
| 1 | 3.3 V | 3.3 V |
| 2 | GND | GND |
| 3 | Line sensor L (IO7) | I²C SDA (IO8) ⚠ |
| 4 | Line sensor C (IO10) | I²C SCL (IO9) ⚠ |
| 5 | Line sensor R (IO2) | UART TX (IO43) |
| 6 | Ultrasonic TRIG (IO40) | UART RX (IO44) |
| 7 | Ultrasonic ECHO (IO41) | Servo 3 (IO35) |
| 8 | Servo 1 (IO38) | Servo 4 (IO36) |
| 9 | Servo 2 (IO39) | IO37 |
| 10 | Buzzer (IO47) ⚠ | IMU interrupt (IO1) ⚠ |
| 11 | RGB LED data out ⚠ | USER button (IO42) ⚠ |
| 12 | IO3 | EN (reset) ⚠ |
| 13 | VMOT 5.5 V ⚠ | VSYS_SW, the battery after the switch ⚠ |
| 14 | GND | GND |

**Protection on these pins**
- The pins without ⚠ have a 330 Ω resistor between the header and the ESP32.
- The pins marked ⚠ connect straight through, with no resistor (errata E-001 to E-004).
- If pin 13's 5.5 V reaches a ⚠ pin, it can destroy the ESP32, the motion sensor or the LED.
- Keep wires off pins 12 to 14 unless you need power from them.

## Pins free for your own parts

| Pin | Where | Notes |
|---|---|---|
| IO37 | Expansion B pin 9 | Free |
| IO43, IO44 | Expansion B pins 5, 6 | UART TX and RX. `Serial` uses USB, so these are free: `Serial0.begin(9600);` |
| IO3 | Expansion A pin 12 | Free, and an analog input. The ESP32 reads it at power-up: connect nothing that pulls it HIGH or LOW at that moment |
| IO38, IO39, IO35, IO36 | Servo headers, expansion | Free when no servo is plugged into that header. Digital only |
| IO40, IO41 | Ultrasonic header, expansion A | Free when no ultrasonic sensor is plugged in. Digital only |
| IO7, IO10, IO2 | Line header, expansion A | Free when no line sensor is plugged in. Analog inputs |

**Analog inputs.** The ESP32-S3 can read analog (`analogRead()`) only on IO1 to IO20. Of the pins you can reach, that leaves IO3 and the line-sensor pins IO2, IO7 and IO10. IO35 to IO44 are digital only.

**Leave these alone**
- IO19 and IO20 carry USB.
- IO45 and IO46 are not connected (the ESP32 reads them at power-up).
- IO8 and IO9 are the I²C bus. Add I²C devices to the bus, but don't use them as plain pins.
- IO11 to IO18 and IO21 belong to the motors.

## Every GPIO in number order

| GPIO | Part | Library name | Where you can reach it |
|---|---|---|---|
| IO0 | BOOT button | `RC_PIN_BOOT_BUTTON` | Button |
| IO1 | IMU interrupt 1 | `RC_PIN_IMU_INT1` | Expansion B 10 |
| IO2 | Line sensor R | `RC_PIN_LINE_RIGHT` | Line header, expansion A 5 |
| IO3 | Free (read at power-up) | `RC_PIN_EXP_IO3` | Expansion A 12 |
| IO4 | Battery voltage ÷ 2 | `RC_PIN_BATTERY_SENSE` | — |
| IO5 | Motor 1 current | `RC_PIN_MOTOR1_ISENSE` | — |
| IO6 | Motor 2 current | `RC_PIN_MOTOR2_ISENSE` | — |
| IO7 | Line sensor L | `RC_PIN_LINE_LEFT` | Line header, expansion A 3 |
| IO8 | I²C SDA | `RC_PIN_I2C_SDA` (core: `SDA`) | Qwiic, expansion B 3 |
| IO9 | I²C SCL | `RC_PIN_I2C_SCL` (core: `SCL`) | Qwiic, expansion B 4 |
| IO10 | Line sensor C | `RC_PIN_LINE_CENTRE` | Line header, expansion A 4 |
| IO11 | Motor 1 forward | `RC_PIN_MOTOR1_IN1` | Motor socket 1 |
| IO12 | Motor 1 reverse | `RC_PIN_MOTOR1_IN2` | Motor socket 1 |
| IO13 | Motor 2 forward | `RC_PIN_MOTOR2_IN1` | Motor socket 2 |
| IO14 | Motor 2 reverse | `RC_PIN_MOTOR2_IN2` | Motor socket 2 |
| IO15 | Encoder 1 A | `RC_PIN_ENC1_A` | Motor socket 1 |
| IO16 | Encoder 1 B | `RC_PIN_ENC1_B` | Motor socket 1 |
| IO17 | Encoder 2 A | `RC_PIN_ENC2_A` | Motor socket 2 |
| IO18 | Encoder 2 B | `RC_PIN_ENC2_B` | Motor socket 2 |
| IO19, IO20 | USB | — | USB-C |
| IO21 | Motor driver fault | `RC_PIN_MOTOR_NFAULT` | — |
| IO35 | Servo 3 | `RC_PIN_SERVO3` | SERVO 3, expansion B 7 |
| IO36 | Servo 4 | `RC_PIN_SERVO4` | SERVO 4, expansion B 8 |
| IO37 | Free | `RC_PIN_EXP_IO37` | Expansion B 9 |
| IO38 | Servo 1 | `RC_PIN_SERVO1` | SERVO 1, expansion A 8 |
| IO39 | Servo 2 | `RC_PIN_SERVO2` | SERVO 2, expansion A 9 |
| IO40 | Ultrasonic TRIG | `RC_PIN_SONAR_TRIG` | Ultrasonic header, expansion A 6 |
| IO41 | Ultrasonic ECHO | `RC_PIN_SONAR_ECHO` | Ultrasonic header, expansion A 7 |
| IO42 | USER button | `RC_PIN_USER_BUTTON` | Button, expansion B 11 |
| IO43 | UART TX | `RC_PIN_UART_TX` (core: `TX`) | Expansion B 5 |
| IO44 | UART RX | `RC_PIN_UART_RX` (core: `RX`) | Expansion B 6 |
| IO45, IO46 | Not connected | — | — |
| IO47 | Buzzer | `RC_PIN_BUZZER` | Expansion A 10 |
| IO48 | RGB LED | `RC_PIN_RGB_LED` (core: `RGB_BUILTIN`) | LED data out on expansion A 11 |

**Sources:**
- the schematic, `RoboCore_V2.kicad_sch`;
- the pin check against the ESP32 module's pads (2026-11-06) in `firmware/v2_bringup/v2_bringup.ino`;
- the library's pin header, `RoboCoreV2Pins.h`, in the robocore-ide repository;
- `RoboCore_V2_errata.md`.

If a pin ever changes, change this file, `RoboCoreV2Pins.h` and the IDE's `hardware/pinout.md` together.
