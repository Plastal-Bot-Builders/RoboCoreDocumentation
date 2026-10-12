/* Host unit tests for arm_decel_limiter.
 * Build:  cc -std=c99 -Wall -Wextra -Werror -lm \
 *            ../arm_decel_limiter.c test_arm_decel_limiter.c -o test && ./test
 */
#include "../arm_decel_limiter.h"

#include <math.h>
#include <stdio.h>

static int failures = 0;

#define CHECK(cond, msg)                                                  \
    do {                                                                  \
        if (cond) {                                                       \
            printf("PASS  %s\n", msg);                                    \
        } else {                                                          \
            printf("FAIL  %s\n", msg);                                    \
            failures++;                                                   \
        }                                                                 \
    } while (0)

/* Tip threshold from the RoboCore v4 CAD analysis: deployed + 300 g. */
#define TIP_THRESHOLD_DEPLOYED 7.51f

static float brake_time(adl_state_t *s, float v0, float dt)
{
    /* time to slew from v0 to 0 with v_cmd = 0 every tick */
    adl_reset(s, v0);
    float t = 0.0f;
    for (int i = 0; i < 100000; i++) {
        float v = adl_limit_velocity(s, 0.0f, dt);
        t += dt;
        if (fabsf(v) < 1e-4f) break;
    }
    return t;
}

int main(void)
{
    adl_state_t s;

    /* -- defaults + safety property ------------------------------------ */
    adl_init(&s, NULL);
    CHECK(s.cfg.a_brake_deployed < 0.75f * TIP_THRESHOLD_DEPLOYED,
          "deployed brake cap keeps >= 25% margin below the tip threshold");
    CHECK(adl_a_brake_max(&s, 0.0f) == s.cfg.a_brake_stowed,
          "stowed angle gives the stowed cap");
    CHECK(adl_a_brake_max(&s, 90.0f) == s.cfg.a_brake_deployed,
          "full deploy gives the deployed cap");
    float prev = adl_a_brake_max(&s, 0.0f);
    int mono = 1;
    for (int d = 1; d <= 90; d++) {
        float a = adl_a_brake_max(&s, (float)d);
        if (a > prev + 1e-6f) mono = 0;
        prev = a;
    }
    CHECK(mono, "cap decreases monotonically with deploy angle");

    /* -- deployed braking is clamped ----------------------------------- */
    adl_init(&s, NULL);
    adl_set_arm_deploy(&s, 90.0f);
    float t_deployed = brake_time(&s, 0.8f, 0.01f);
    float t_min = 0.8f / s.cfg.a_brake_deployed;
    CHECK(t_deployed >= t_min - 0.011f,
          "deployed: 0.8 m/s stop takes >= v/a_cap (decel clamped)");
    CHECK(t_deployed <= t_min + 0.03f,
          "deployed: limiter does not over-restrict braking");

    /* -- stowed braking is faster -------------------------------------- */
    adl_set_arm_deploy(&s, 0.0f);
    float t_stowed = brake_time(&s, 0.8f, 0.01f);
    CHECK(t_stowed < t_deployed,
          "stowed braking is quicker than deployed braking");

    /* -- reverse throttle-up (also rearward accel) is clamped ----------- */
    adl_init(&s, NULL);
    adl_set_arm_deploy(&s, 90.0f);
    adl_reset(&s, 0.0f);
    float v = adl_limit_velocity(&s, -1.0f, 0.01f);
    CHECK(fabsf(v - (-s.cfg.a_brake_deployed * 0.01f)) < 1e-5f,
          "reverse throttle step clamped to the same rearward-accel cap");

    /* -- forward acceleration unaffected by the arm --------------------- */
    adl_init(&s, NULL);
    adl_set_arm_deploy(&s, 90.0f);
    adl_reset(&s, 0.0f);
    v = adl_limit_velocity(&s, 1.0f, 0.01f);
    CHECK(v == 1.0f, "forward accel passes through when a_fwd_max disabled");

    adl_config_t cfg = s.cfg;
    cfg.a_fwd_max = 2.0f;
    adl_init(&s, &cfg);
    adl_reset(&s, 0.0f);
    v = adl_limit_velocity(&s, 1.0f, 0.01f);
    CHECK(fabsf(v - 0.02f) < 1e-6f, "generic forward slew limit works when set");

    /* -- robustness ------------------------------------------------------ */
    adl_init(&s, NULL);
    adl_reset(&s, 0.5f);
    CHECK(adl_limit_velocity(&s, 0.0f, 0.0f) == 0.5f, "dt=0 is a no-op");
    CHECK(adl_limit_velocity(&s, NAN, 0.01f) == 0.5f, "NaN command is a no-op");
    adl_set_arm_deploy(&s, NAN);
    CHECK(s.arm_deploy_deg == 0.0f, "NaN arm angle ignored");
    adl_set_arm_deploy(&s, 400.0f);
    CHECK(s.arm_deploy_deg == 90.0f, "arm angle clamped to 90");

    printf(failures ? "\n%d FAILURE(S)\n" : "\nALL TESTS PASSED\n", failures);
    return failures ? 1 : 0;
}
