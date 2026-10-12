# arm_decel_limiter — closing the 0.77 g braking-tip flag

## The problem it closes

From the RoboCore v4 CAD tipping analysis (2026-07-14, corrected mass model):

| State | CoG (X, Z) mm | Forward-tip threshold* |
|---|---|---|
| Arm stowed, no payload | (11.8, 42.2) | 14.7 m/s² = **1.50 g** |
| Arm deployed + 300 g payload | (34.6, 52.8) | 7.51 m/s² = **0.77 g** |

\* about the front contact patches at X = +75 mm; `a = g·(75 − CoG_x)/CoG_z`.

Hard braking on a small differential-drive robot reaches 0.5–0.8 g, so with
the intake arm out and loaded the robot can pitch over its front axle. The
hardware fix options (less payload, shorter reach, pack rearward) all cost
capability; the firmware fix costs nothing.

## What the module does

`adl_limit_velocity()` slew-limits the commanded body velocity so that the
**rearward acceleration** (braking from forward travel, or throttling up in
reverse — both push the CoG toward the front patches) never exceeds a cap
interpolated from the arm's deploy angle:

| Deploy angle | Cap (default) | Margin below tip threshold |
|---|---|---|
| ≤ 10° (stowed) | 11.0 m/s² (1.12 g) | 25% below the 1.50 g stow threshold |
| 90° (deployed) | 5.5 m/s² (0.56 g) | **27% below the 0.77 g worst case** |

The deployed cap conservatively assumes the full 300 g payload whenever the
arm is out (firmware cannot know the actual payload). Forward acceleration is
not safety-limited (rear-tip threshold ≈ 2.0 g, unreachable by the TT
drivetrain) but an optional generic slew limit is available (`a_fwd_max`).

## Integration (ESP32, 100 Hz control loop)

```c
#include "motion/arm_decel_limiter.h"

static adl_state_t adl;

void setup_motion(void) {
    adl_init(&adl, NULL);              // defaults per the table above
}

void set_intake_arm(float servo_deg) { // 0 = stowed .. 90 = deployed
    intake_servo_write(servo_deg);
    adl_set_arm_deploy(&adl, servo_deg);
}

void control_loop_100hz(float v_cmd_mps, float omega_cmd, float dt_s) {
    float v_safe = adl_limit_velocity(&adl, v_cmd_mps, dt_s);
    mix_differential(v_safe, omega_cmd);   // -> left/right wheel targets
}
```

Notes:
- Apply the limiter to the **body velocity before differential mixing**, not
  per wheel — spins in place don't need limiting; linear deceleration does.
- Call `adl_reset(&adl, measured_v)` after an e-stop or mode change so the
  limiter's internal state matches reality (encoders make `measured_v` easy).
- Velocity units are m/s. Wheel Ø70 mm ⇒ v = ω_wheel · 0.035. If the drive
  layer is open-loop PWM, map duty→velocity with the no-load 0.73 m/s top
  speed as a first approximation; the caps are conservative enough to absorb
  the error.
- If the CAD changes (pack position, wheelbase, arm reach), recompute the two
  thresholds from the table formula and update `a_brake_stowed` /
  `a_brake_deployed` in `adl_config_t`.

## Tests

```
cd Firmware/motion/test
cc -std=c99 -Wall -Wextra -Werror ../arm_decel_limiter.c test_arm_decel_limiter.c -lm -o test_adl
./test_adl        # 14 checks, including the ≥25%-margin safety property
```
