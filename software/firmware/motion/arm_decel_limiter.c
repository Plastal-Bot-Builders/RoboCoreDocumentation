#include "arm_decel_limiter.h"

#include <math.h>

static const adl_config_t ADL_DEFAULTS = {
    .a_brake_stowed = 11.0f,   /* 0.75 * 14.7 m/s^2 stowed tip threshold   */
    .a_brake_deployed = 5.5f,  /* 0.73 * 7.51 m/s^2 deployed+300g threshold */
    .deploy_start_deg = 10.0f,
    .deploy_full_deg = 90.0f,
    .a_fwd_max = 0.0f,         /* forward slew limiting disabled by default */
};

static float clampf(float v, float lo, float hi)
{
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}

void adl_init(adl_state_t *s, const adl_config_t *cfg)
{
    s->cfg = cfg ? *cfg : ADL_DEFAULTS;
    s->arm_deploy_deg = 0.0f;
    s->v_actual = 0.0f;
}

void adl_set_arm_deploy(adl_state_t *s, float deg)
{
    if (!isfinite(deg)) return;
    s->arm_deploy_deg = clampf(deg, 0.0f, 90.0f);
}

float adl_a_brake_max(const adl_state_t *s, float deploy_deg)
{
    const adl_config_t *c = &s->cfg;
    float d = clampf(deploy_deg, 0.0f, 90.0f);
    if (d <= c->deploy_start_deg) return c->a_brake_stowed;
    if (d >= c->deploy_full_deg) return c->a_brake_deployed;
    float t = (d - c->deploy_start_deg) / (c->deploy_full_deg - c->deploy_start_deg);
    return c->a_brake_stowed + t * (c->a_brake_deployed - c->a_brake_stowed);
}

void adl_reset(adl_state_t *s, float v_now)
{
    s->v_actual = isfinite(v_now) ? v_now : 0.0f;
}

float adl_limit_velocity(adl_state_t *s, float v_cmd, float dt)
{
    if (!isfinite(v_cmd) || !isfinite(dt) || dt <= 0.0f) {
        return s->v_actual;
    }

    float a_req = (v_cmd - s->v_actual) / dt;

    /* Rearward acceleration (a_req < 0 in the +forward convention) tips the
     * robot over the FRONT patches; clamp it by arm deploy angle. Forward
     * acceleration only gets the generic limit, if enabled. */
    float a_brake = adl_a_brake_max(s, s->arm_deploy_deg);
    if (a_req < -a_brake) {
        a_req = -a_brake;
    } else if (s->cfg.a_fwd_max > 0.0f && a_req > s->cfg.a_fwd_max) {
        a_req = s->cfg.a_fwd_max;
    }

    s->v_actual += a_req * dt;
    return s->v_actual;
}
