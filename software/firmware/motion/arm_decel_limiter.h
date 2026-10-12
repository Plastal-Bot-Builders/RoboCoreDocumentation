/*
 * arm_decel_limiter — braking limiter for the RoboCore intake-arm robot.
 *
 * WHY THIS EXISTS
 * ---------------
 * From the RoboCore v4 CAD tipping analysis (2026-07-14):
 *   - front contact patches at X = +75 mm from chassis origin
 *   - arm DEPLOYED + 300 g payload: CoG = (34.6, 0.5, 52.8) mm
 *     -> forward-tip threshold a = g*(75-34.6)/52.8 = 7.51 m/s^2 = 0.77 g
 *   - arm STOWED, no payload:      CoG = (11.8, 0.6, 42.2) mm
 *     -> threshold a = g*(75-11.8)/42.2 = 14.7 m/s^2 = 1.50 g
 * Hard braking on a small differential-drive robot reaches 0.5-0.8 g, so a
 * loaded, deployed arm can tip the robot over its front axle. This module
 * clamps the commanded deceleration as a function of arm deploy angle so the
 * worst case keeps >= 25% margin below the tip threshold.
 *
 * The dangerous acceleration direction is REARWARD in the robot frame
 * (braking while driving forward, or throttle-up in reverse): the inertial
 * reaction pushes the CoG forward over the front patches. Forward
 * acceleration is limited only by the generic (non-safety) slew limit
 * (rear-tip threshold is ~2.0 g and never governs).
 *
 * USAGE (100 Hz control loop, ESP32/Arduino or ESP-IDF):
 *
 *   adl_state_t adl;
 *   adl_init(&adl, NULL);                     // NULL -> default config
 *   ...
 *   adl_set_arm_deploy(&adl, servo_cmd_deg);  // whenever the servo moves
 *   ...
 *   // in the control loop, before differential mixing:
 *   float v_safe = adl_limit_velocity(&adl, v_cmd_mps, dt_s);
 *   mix_differential(v_safe, omega_cmd);
 *
 * Pure C99, no dependencies, no dynamic allocation. Host-testable.
 */

#ifndef ARM_DECEL_LIMITER_H
#define ARM_DECEL_LIMITER_H

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    /* Max rearward acceleration (m/s^2, positive numbers) allowed when the
     * arm is stowed / fully deployed. Interpolated linearly in between.
     * Defaults: stowed 11.0 (0.75 * 14.7 stow threshold),
     *           deployed 5.5 (0.73 * 7.51 deployed+payload threshold). */
    float a_brake_stowed;
    float a_brake_deployed;

    /* Arm angle (deg, 0 = stowed .. 90 = fully deployed) where derating
     * starts and where it reaches a_brake_deployed. */
    float deploy_start_deg;
    float deploy_full_deg;

    /* Generic forward-acceleration slew limit (m/s^2). Not a safety limit;
     * set <= 0 to disable. */
    float a_fwd_max;
} adl_config_t;

typedef struct {
    adl_config_t cfg;
    float arm_deploy_deg;   /* last commanded arm angle, clamped 0..90  */
    float v_actual;         /* limiter's internal (slewed) velocity state */
} adl_state_t;

/* Initialise with cfg, or defaults when cfg == NULL. */
void adl_init(adl_state_t *s, const adl_config_t *cfg);

/* Report the current arm deploy angle in degrees (0 = stowed). Call from the
 * same place that commands the intake servo. Values are clamped to 0..90. */
void adl_set_arm_deploy(adl_state_t *s, float deg);

/* Allowed rearward (braking-direction) acceleration at a deploy angle. */
float adl_a_brake_max(const adl_state_t *s, float deploy_deg);

/* Slew-limit the commanded body velocity (m/s, +forward). Returns the safe
 * velocity to pass to the differential mixer. dt is the loop period in
 * seconds; non-positive or non-finite inputs leave the state unchanged. */
float adl_limit_velocity(adl_state_t *s, float v_cmd, float dt);

/* Reset the internal velocity state (e.g., after e-stop) so the limiter
 * does not command a phantom ramp. */
void adl_reset(adl_state_t *s, float v_now);

#ifdef __cplusplus
}
#endif

#endif /* ARM_DECEL_LIMITER_H */
