// ============================================================================
// App icon geometry: pure functions that return SVG path data using only absolute
// M / L / C / Z commands, so the same strings work in an SVG preview and in Figma
// (vectorPaths accept only those commands). Shared by app-icon/preview.js and the
// Figma plugin's icon page.
// ============================================================================

const IG = (() => {
  const K = 0.5522847498; // cubic handle length for a quarter circle
  const f = (v) => (Math.round(v * 100) / 100).toString();
  const pt = (p) => f(p[0]) + ' ' + f(p[1]);
  const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const rad = (deg) => (deg * Math.PI) / 180;

  // circle as 4 cubic arcs; dir = 1 clockwise on screen, -1 counter-clockwise (for holes)
  function circle(cx, cy, r, dir = 1) {
    const k = r * K, s = dir > 0 ? 1 : -1;
    return 'M' + pt([cx + r, cy]) +
      ' C' + pt([cx + r, cy + s * k]) + ' ' + pt([cx + k, cy + s * r]) + ' ' + pt([cx, cy + s * r]) +
      ' C' + pt([cx - k, cy + s * r]) + ' ' + pt([cx - r, cy + s * k]) + ' ' + pt([cx - r, cy]) +
      ' C' + pt([cx - r, cy - s * k]) + ' ' + pt([cx - k, cy - s * r]) + ' ' + pt([cx, cy - s * r]) +
      ' C' + pt([cx + k, cy - s * r]) + ' ' + pt([cx + r, cy - s * k]) + ' ' + pt([cx + r, cy]) + ' Z';
  }

  // closed polygon with filleted corners. pts: [[x, y, r], ...] (r = 0 → sharp corner)
  function roundPoly(pts) {
    const n = pts.length, segs = [];
    for (let i = 0; i < n; i++) {
      const P = pts[i], A = pts[(i - 1 + n) % n], B = pts[(i + 1) % n];
      const r = P[2] || 0;
      if (!r) { segs.push({ a: [P[0], P[1]] }); continue; }
      const u = unit(sub(A, P)), v = unit(sub(B, P));
      const theta = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1])));
      if (theta > Math.PI - 1e-3) { segs.push({ a: [P[0], P[1]] }); continue; }
      let d = r / Math.tan(theta / 2);
      d = Math.min(d, len(sub(A, P)) * 0.5, len(sub(B, P)) * 0.5);
      const rr = d * Math.tan(theta / 2);              // radius actually achievable
      const h = (4 / 3) * Math.tan((Math.PI - theta) / 4) * rr;
      const p1 = add(P, mul(u, d)), p2 = add(P, mul(v, d));
      segs.push({ a: p1, b: p2, c1: add(p1, mul(mul(u, -1), h)), c2: add(p2, mul(mul(v, -1), h)) });
    }
    const endOf = (g) => g.b || g.a;
    let s = 'M' + pt(endOf(segs[n - 1]));
    for (let i = 0; i < n; i++) {
      const g = segs[i];
      s += ' L' + pt(g.a);
      if (g.b) s += ' C' + pt(g.c1) + ' ' + pt(g.c2) + ' ' + pt(g.b);
    }
    return s + ' Z';
  }

  // gear outline points. o = { cx, cy, n, rTip, rRoot, wTip, wRoot, rTipCorner, rRootCorner, phase, arcStep }
  // wTip / wRoot = tooth width in px at the tip circle and at the root circle
  function gearPoints(o) {
    const n = o.n, step = (2 * Math.PI) / n, ph = o.phase === undefined ? -Math.PI / 2 : o.phase;
    const aT = Math.asin(o.wTip / 2 / o.rTip), aR = Math.asin(o.wRoot / 2 / o.rRoot);
    const as = o.arcStep || 0.1, pts = [];
    for (let i = 0; i < n; i++) {
      const t = ph + i * step;
      pts.push([...polar(o.cx, o.cy, o.rRoot, t - aR), o.rRootCorner || 0]);
      const m1 = Math.max(1, Math.round((2 * aT) / as));
      const sk = o.skew || 0; // lean every tooth forward (clockwise) by this angle at the tip
      for (let k = 0; k <= m1; k++) pts.push([...polar(o.cx, o.cy, o.rTip, t + sk - aT + (2 * aT * k) / m1), (k === 0 || k === m1) ? (o.rTipCorner || 0) : 0]);
      pts.push([...polar(o.cx, o.cy, o.rRoot, t + aR), o.rRootCorner || 0]);
      const a0 = t + aR, a1 = t + step - aR, m2 = Math.max(1, Math.round((a1 - a0) / as));
      for (let k = 1; k < m2; k++) pts.push([...polar(o.cx, o.cy, o.rRoot, a0 + ((a1 - a0) * k) / m2), 0]);
    }
    return pts;
  }
  function gear(o) {
    let d = roundPoly(gearPoints(o));
    if (o.hole) d += ' ' + circle(o.cx, o.cy, o.hole, -1);
    return d;
  }

  // outline of an open polyline (centreline c) with width w; end corners rounded by rEnd,
  // the outer join by rOut and the inner join by rIn
  function strokePoly(c, w, rEnd, rOut, rIn) {
    const hw = w / 2, L = [], R = [];
    const nrm = (a, b) => { const d = unit(sub(b, a)); return [-d[1], d[0]]; };
    for (let i = 0; i < c.length; i++) {
      if (i === 0 || i === c.length - 1) {
        const nn = i === 0 ? nrm(c[0], c[1]) : nrm(c[i - 1], c[i]);
        L.push(add(c[i], mul(nn, hw))); R.push(add(c[i], mul(nn, -hw)));
      } else {
        const n1 = nrm(c[i - 1], c[i]), n2 = nrm(c[i], c[i + 1]);
        const m = unit(add(n1, n2)), k = hw / (m[0] * n1[0] + m[1] * n1[1]);
        L.push(add(c[i], mul(m, k))); R.push(add(c[i], mul(m, -k)));
      }
    }
    const e = rEnd === undefined ? hw * 0.95 : rEnd, ro = rOut === undefined ? hw * 0.6 : rOut, ri = rIn === undefined ? hw * 0.15 : rIn;
    const pts = [];
    L.forEach((p, i) => pts.push([p[0], p[1], (i === 0 || i === L.length - 1) ? e : ro]));
    R.slice().reverse().forEach((p, i) => pts.push([p[0], p[1], (i === 0 || i === R.length - 1) ? e : ri]));
    return { d: roundPoly(pts), L, R };
  }

  // chevron "<" (dir -1) or ">" (dir 1): tip at (x, y), arms reach `depth` back and `h` up/down
  function chevron(x, y, depth, h, w, dir, rEnd, rOut, rIn) {
    const back = x - dir * depth;
    // the stroke's outer point should sit at x, so move the centreline tip inwards by the miter half-length
    const ang = Math.atan2(h, depth);
    const miter = (w / 2) / Math.sin(ang);
    const tx = x - dir * miter;
    return strokePoly([[back - dir * 0, y - h], [tx, y], [back, y + h]], w, rEnd, rOut, rIn).d;
  }

  function rrect(x, y, w, h, r) {
    return roundPoly([[x, y, r], [x + w, y, r], [x + w, y + h, r], [x, y + h, r]]);
  }

  // Figma-style smoothed rounded rectangle ("squircle"): corner radius r, smoothing s (0..1).
  // Same construction as the figma-squircle library (MIT), with the arc converted to a cubic.
  function squircle(x, y, w, h, r, s) {
    s = s === undefined ? 0.6 : s;
    const maxR = Math.min(w, h) / 2;
    r = Math.min(r, maxR);
    const p = Math.min((1 + s) * r, maxR);
    const arcMeasure = 90 * (1 - s);
    const arcLen = Math.sin(rad(arcMeasure / 2)) * r * Math.SQRT2;
    const alpha = (90 - arcMeasure) / 2;
    const p3p4 = r * Math.tan(rad(alpha / 2));
    const beta = 45 * s;
    const c = p3p4 * Math.cos(rad(beta));
    const d = c * Math.tan(rad(beta));
    const b = (p - arcLen - c - d) / 3;
    const a = 2 * b;
    const arcH = (4 / 3) * Math.tan(rad(arcMeasure / 4)) * r;
    const P1 = [a + b + c, d];
    const P2 = [P1[0] + arcLen, P1[1] + arcLen];
    const t1 = unit([c, d]), t2 = unit([d, c]);
    const seg = [
      [[a, 0], [a + b, 0], P1],
      [add(P1, mul(t1, arcH)), sub(P2, mul(t2, arcH)), P2],
      [[P2[0] + d, P2[1] + c], [P2[0] + d, P2[1] + b + c], [P2[0] + d, P2[1] + a + b + c]],
    ];
    const corners = [
      { o: [x + w - p, y], R: (v) => [v[0], v[1]] },     // top-right: along +x, turning to +y
      { o: [x + w, y + h - p], R: (v) => [-v[1], v[0]] }, // bottom-right: along +y, turning to -x
      { o: [x + p, y + h], R: (v) => [-v[0], -v[1]] },    // bottom-left: along -x, turning to -y
      { o: [x, y + p], R: (v) => [v[1], -v[0]] },         // top-left: along -y, turning to +x
    ];
    let out = 'M' + pt([x + p, y]);
    for (const cr of corners) {
      out += ' L' + pt(cr.o);
      for (const sg of seg) {
        const q = sg.map((v) => add(cr.o, cr.R(v)));
        out += ' C' + pt(q[0]) + ' ' + pt(q[1]) + ' ' + pt(q[2]);
      }
    }
    return out + ' Z';
  }


  // ---- defiant gear helpers (2026-10-19, second round) ----
  // ratchet teeth: a ramp up to the tip, a short flat, then a straight radial drop (spins clockwise on screen)
  // o = { cx, cy, n, rTip, rRoot, ramp, flat (fractions of the tooth pitch), rTipCorner, rRootCorner, rFoot, phase, arcStep }
  function ratchetPoints(o) {
    const step = (2 * Math.PI) / o.n, ph = o.phase === undefined ? -Math.PI / 2 : o.phase, as = o.arcStep || 0.08, pts = [];
    for (let i = 0; i < o.n; i++) {
      const t = ph + i * step, a1 = t + o.ramp * step, a2 = a1 + o.flat * step;
      pts.push([...polar(o.cx, o.cy, o.rRoot, t), o.rFoot || 0]);
      // optional bulge: lifts the middle of the ramp so the flank reads as a tooth, not a saw blade
      if (o.bulge) { const u = 0.5; pts.push([...polar(o.cx, o.cy, o.rRoot + (o.rTip - o.rRoot) * u + o.bulge, t + (a1 - t) * u), 0]); }
      pts.push([...polar(o.cx, o.cy, o.rTip, a1), o.rTipCorner || 0]);
      const m = Math.max(1, Math.round((a2 - a1) / as));
      for (let k = 1; k < m; k++) pts.push([...polar(o.cx, o.cy, o.rTip, a1 + ((a2 - a1) * k) / m), 0]);
      pts.push([...polar(o.cx, o.cy, o.rTip, a2), o.rTipCorner || 0]);
      pts.push([...polar(o.cx, o.cy, o.rRoot, a2), o.rRootCorner || 0]);
      const m2 = Math.max(1, Math.round((t + step - a2) / as));
      for (let k = 1; k < m2; k++) pts.push([...polar(o.cx, o.cy, o.rRoot, a2 + ((t + step - a2) * k) / m2), 0]);
    }
    return pts;
  }
  // gear whose tooth i has its own tip radius (spiky bursts): o.rTips = [r0, r1, ...] repeats
  function burstPoints(o) {
    const step = (2 * Math.PI) / o.n, ph = o.phase === undefined ? -Math.PI / 2 : o.phase, as = o.arcStep || 0.08, pts = [];
    for (let i = 0; i < o.n; i++) {
      const t = ph + i * step, rT = o.rTips[i % o.rTips.length];
      const aR = Math.asin(o.wRoot / 2 / o.rRoot), aT = Math.asin(Math.max(0.5, o.wTip) / 2 / rT);
      pts.push([...polar(o.cx, o.cy, o.rRoot, t - aR), o.rRootCorner || 0]);
      pts.push([...polar(o.cx, o.cy, rT, t - aT), o.rTipCorner || 0]);
      if (o.wTip > 1) pts.push([...polar(o.cx, o.cy, rT, t + aT), o.rTipCorner || 0]);
      pts.push([...polar(o.cx, o.cy, o.rRoot, t + aR), o.rRootCorner || 0]);
      const a0 = t + aR, a1 = t + step - aR, m = Math.max(1, Math.round((a1 - a0) / as));
      for (let k = 1; k < m; k++) pts.push([...polar(o.cx, o.cy, o.rRoot, a0 + ((a1 - a0) * k) / m), 0]);
    }
    return pts;
  }
  // circle as a polygon (for clipping), clockwise unless dir = -1
  function circlePts(cx, cy, r, n, dir) {
    const pts = [];
    for (let i = 0; i < (n || 96); i++) { const a = (dir === -1 ? -1 : 1) * (2 * Math.PI * i) / (n || 96); pts.push([...polar(cx, cy, r, a), 0]); }
    return pts;
  }
  // solid ">" chevron polygon (dir 1) or "<" (dir -1): centre (cx, cy), half height h, depth d, horizontal thickness t
  function chevronPoly(cx, cy, h, d, t, dir, r) {
    const s = dir || 1, x0 = cx - s * (d + t) / 2;
    const P = [[x0, cy - h], [x0 + s * t, cy - h], [x0 + s * (t + d), cy], [x0 + s * t, cy + h], [x0, cy + h], [x0 + s * d, cy]];
    return (s > 0 ? P : P.reverse()).map((p) => [p[0], p[1], r || 0]);
  }
  // keep the part of a polygon on the left of the directed line a→b (Sutherland–Hodgman, one edge)
  function clipHalf(pts, a, b) {
    const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const P = pts[i], Q = pts[(i + 1) % pts.length], sp = side(P), sq = side(Q);
      if (sp >= 0) out.push(P);
      if ((sp >= 0) !== (sq >= 0)) {
        const u = sp / (sp - sq);
        out.push([P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u, 0]);
      }
    }
    return out;
  }

  // clip a polygon to the left of a→b and carve a round hole (centre c, radius r) out of the cut edge,
  // so a gear sliced through its hub stays one simple outline per half
  function cutWithHole(pts, a, b, cx, cy, r, holeCorner) {
    const kept = clipHalf(pts, a, b);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L;
    const side = (p) => dx * (p[1] - a[1]) - dy * (p[0] - a[0]);
    const tOf = (p) => (p[0] - a[0]) * dx + (p[1] - a[1]) * dy;
    let i = -1;
    for (let k = 0; k < kept.length; k++) { const P = kept[k], Q = kept[(k + 1) % kept.length]; if (Math.abs(side(P)) < 0.01 && Math.abs(side(Q)) < 0.01) { i = k; break; } }
    if (i < 0) return kept;
    const fx = a[0] - cx, fy = a[1] - cy, B = fx * dx + fy * dy, C = fx * fx + fy * fy - r * r, disc = B * B - C;
    if (disc <= 0) return kept;
    const t1 = -B - Math.sqrt(disc), t2 = -B + Math.sqrt(disc);
    const H = (t) => [a[0] + dx * t, a[1] + dy * t];
    const P = kept[i], Q = kept[(i + 1) % kept.length];
    const up = tOf(Q) > tOf(P);
    const hs = up ? H(t1) : H(t2), he = up ? H(t2) : H(t1);
    const as = Math.atan2(hs[1] - cy, hs[0] - cx), ae = Math.atan2(he[1] - cy, he[0] - cx);
    let sweep = ae - as; while (sweep <= 0) sweep += 2 * Math.PI;      // try the positive way round
    const mid = [cx + r * Math.cos(as + sweep / 2), cy + r * Math.sin(as + sweep / 2)];
    if (side(mid) < 0) sweep -= 2 * Math.PI;                           // the arc must stay on the kept side
    const arc = [[hs[0], hs[1], holeCorner || 0]];
    const m = Math.max(4, Math.round(Math.abs(sweep) / 0.08));
    for (let k = 1; k < m; k++) arc.push([cx + r * Math.cos(as + (sweep * k) / m), cy + r * Math.sin(as + (sweep * k) / m), 0]);
    arc.push([he[0], he[1], holeCorner || 0]);
    return kept.slice(0, i + 1).concat(arc, kept.slice(i + 1));
  }

  // ---- orbit helpers (round 3: planet marks) ----
  const rotPts = (pts, cx, cy, ang) => { const c = Math.cos(ang), sn = Math.sin(ang); return pts.map((p) => [cx + (p[0] - cx) * c - (p[1] - cy) * sn, cy + (p[0] - cx) * sn + (p[1] - cy) * c, p[2] || 0]); };
  // keep the part of a polygon where inside(p) is true; walk(a, b) gives the boundary points between an
  // exit point a and the next entry point b. Works when the kept part is one piece.
  function clipRegion(pts, inside, walk) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const P = pts[i], Q = pts[(i + 1) % n], ip = inside(P), iq = inside(Q);
      if (ip) out.push([P[0], P[1], P[2] || 0, null]);
      if (ip !== iq) {
        let lo = 0, hi = 1;
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (inside([P[0] + (Q[0] - P[0]) * m, P[1] + (Q[1] - P[1]) * m]) === ip) lo = m; else hi = m; }
        const u = (lo + hi) / 2;
        out.push([P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u, 0, ip ? 'exit' : 'entry']);
      }
    }
    const res = [];
    for (let k = 0; k < out.length; k++) {
      res.push(out[k]);
      const nx = out[(k + 1) % out.length];
      if (out[k][3] === 'exit' && nx && nx[3] === 'entry') for (const w of walk(out[k], nx)) res.push(w);
    }
    return res.map((p) => [p[0], p[1], p[2] || 0]);
  }
  // half of an ellipse centred on (cx, cy) with half-width a: lower (sign 1) or upper (sign -1) arc, from x0 to x1
  function arcPts(cx, cy, a, b, sign, x0, x1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      // cosine spacing puts more points near the pointed tips
      const t = x0 + (x1 - x0) * (0.5 - 0.5 * Math.cos(Math.PI * i / n));
      const sv = Math.sqrt(Math.max(0, 1 - (t * t) / (a * a)));
      pts.push([cx + t, cy + sign * b * sv, 0]);
    }
    return pts;
  }
  // four-point sparkle with slightly pinched sides
  function sparkle(cx, cy, r, k) {
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 4, rr = i % 2 ? r * (k || 0.3) : r; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a), 0]); }
    return pts;
  }
  const movePts = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy, p[2] || 0]);
  const scalePts = (pts, cx, cy, k) => pts.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k, (p[2] || 0) * k]);

  return { circle, roundPoly, gearPoints, gear, strokePoly, chevron, rrect, squircle, polar, f, pt, rad, ratchetPoints, burstPoints, circlePts, chevronPoly, clipHalf, cutWithHole, movePts, scalePts, rotPts, clipRegion, arcPts, sparkle };
})();

if (typeof module !== 'undefined') module.exports = IG;
// Icon concepts on a 1024 × 1024 canvas (centre 512). Each concept returns its glyph as
// layers: [{ name, d, role }] where role picks the colour from the active theme
// ('ink' = main glyph colour, 'accent' = second colour, 'hole' = cut-outs drawn in the plate colour).
// IG (geom.js) is a global here: concatenated before this file in the plugin, set on globalThis by preview.js.
const ICX = 512, ICY = 512;

// the RoboCore logo gear, simplified: 8 teeth, round hub
function coreGear(cx, cy, s, extra) {
  return IG.gear(Object.assign({
    cx, cy, n: 8, rTip: 132 * s, rRoot: 104 * s, wTip: 50 * s, wRoot: 70 * s,
    rTipCorner: 9 * s, rRootCorner: 12 * s, hole: 44 * s,
  }, extra || {}));
}

const CONCEPTS = {
  // 1 — code brackets around the RoboCore gear: ‹ ⚙ ›
  brackets: {
    title: 'Core Brackets',
    note: 'Code chevrons around the RoboCore gear. Reads as "code" first, robotics second.',
    // master proportions (1024 canvas, glyph sized for the 824 px macOS plate)
    defaults: { stroke: 88, h: 164, depth: 132, gap: 314, gearScale: 1.18, gear: { hole: 50 } },
    // tuned for 16–32 px on a full-canvas plate: heavier strokes, 6-tooth gear, bigger hub
    small: { stroke: 132, h: 250, depth: 168, gap: 404, gearScale: 1.62, gear: { n: 6, wTip: 92, wRoot: 120, rTipCorner: 10, rRootCorner: 10, hole: 66 } },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const w = o.stroke, h = o.h, depth = o.depth, gap = o.gap;
      return [
        { name: 'Bracket left', role: 'ink', d: IG.chevron(ICX - gap, ICY, depth, h, w, -1) },
        { name: 'Bracket right', role: 'ink', d: IG.chevron(ICX + gap, ICY, depth, h, w, 1) },
        { name: 'Core gear', role: 'accent', d: coreGear(ICX, ICY, o.gearScale || 1, o.gear) },
      ];
    },
  },

  // 2 — the gear opens into a "C" (Code / Core / Cog) with a prompt caret inside
  opencog: {
    title: 'Open Cog',
    note: 'The gear opens like a C toward a prompt caret: the robot\'s core, ready for code.',
    glyph(o = {}) {
      const rT = 300, rR = 250, rIn = 168, n = 10;
      const open = IG.rad(o.open || 34);             // half-angle of the opening (right side)
      const step = (2 * Math.PI) / n;
      // teeth centred away from the opening: phase so that one tooth sits at 180°
      const all = IG.gearPoints({ cx: ICX, cy: ICY, n, rTip: rT, rRoot: rR, wTip: 64, wRoot: 92, rTipCorner: 10, rRootCorner: 14, phase: Math.PI / 10, arcStep: 0.06 });
      const angOf = (p) => { let a = Math.atan2(p[1] - ICY, p[0] - ICX); return a; };
      // keep outer points outside the opening wedge (|angle| > open), ordered clockwise starting just below the opening
      const keep = all.filter((p) => Math.abs(angOf(p)) > open + 0.0001);
      // rotate list so it starts at the first point after the opening (angle just above +open, clockwise = increasing)
      const sorted = keep.map((p) => ({ p, a: (angOf(p) - open + 2 * Math.PI) % (2 * Math.PI) })).sort((x, y) => x.a - y.a).map((x) => x.p);
      const endR = rR - 6;
      const pts = [];
      pts.push([...IG.polar(ICX, ICY, endR, open), 22]);
      sorted.forEach((p) => pts.push(p));
      pts.push([...IG.polar(ICX, ICY, endR, -open), 22]);
      // inner arc back, counter-clockwise from -open to +open (through 180°)
      const m = 40;
      for (let k = 0; k <= m; k++) {
        const a = -open - ((2 * Math.PI - 2 * open) * k) / m;
        pts.push([...IG.polar(ICX, ICY, rIn, a), (k === 0 || k === m) ? 22 : 0]);
      }
      const ring = IG.roundPoly(pts);
      const caret = IG.chevron(ICX + 70, ICY, 92, 112, 70, 1);
      return [
        { name: 'Open cog', role: 'ink', d: ring },
        { name: 'Caret', role: 'accent', d: caret },
      ];
    },
  },

  // 3 — a friendly robot head whose face is a prompt: > _
  bot: {
    title: 'Bot Prompt',
    note: 'A robot head whose face is a command prompt (>_), which also reads as a wink.',
    glyph() {
      const head = IG.squircle(ICX - 270, ICY - 190, 540, 430, 150, 0.6);
      const screen = IG.squircle(ICX - 196, ICY - 118, 392, 286, 92, 0.6);
      const earL = IG.rrect(ICX - 318, ICY - 40, 60, 140, 26);
      const earR = IG.rrect(ICX + 258, ICY - 40, 60, 140, 26);
      const stem = IG.rrect(ICX - 22, ICY - 268, 44, 90, 14);
      const ball = IG.circle(ICX, ICY - 282, 44);
      const eye = IG.chevron(ICX - 78, ICY + 22, 70, 62, 52, 1);
      const bar = IG.rrect(ICX + 22, ICY + 60, 112, 50, 22);
      return [
        { name: 'Head', role: 'ink', d: head + ' ' + earL + ' ' + earR + ' ' + stem + ' ' + ball },
        { name: 'Face', role: 'face', d: screen },
        { name: 'Prompt', role: 'accent2', d: eye + ' ' + bar },
      ];
    },
  },
  // ---- round 2 (2026-10-19): keep the gear, make it defiant ----
  // a ratchet only turns one way: sharp sloped teeth, a > prompt punched through the hub
  ratchet: {
    title: 'Ratchet',
    note: 'Ratchet teeth that only turn one way, with a > prompt punched through the hub.',
    defaults: { n: 9, rTip: 306, rRoot: 236, ramp: 0.52, flat: 0.15, phase: -Math.PI / 2 - 0.12, chev: [112, 96, 74] },
    small: { n: 7, rTip: 404, rRoot: 300, ramp: 0.5, flat: 0.2, phase: -Math.PI / 2 - 0.12, chev: [150, 120, 108] },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const k = o.rTip / 306;
      const body = IG.ratchetPoints({ cx: ICX, cy: ICY, n: o.n, rTip: o.rTip, rRoot: o.rRoot, ramp: o.ramp, flat: o.flat, phase: o.phase, rTipCorner: 6 * k, rRootCorner: 10 * k, rFoot: 18 * k });
      const [h, d, t] = o.chev;
      const hole = IG.chevronPoly(ICX + 12 * k, ICY, h, d, t, 1, 10 * k);
      return [{ name: 'Gear', role: 'accent', d: IG.roundPoly(body) + ' ' + IG.roundPoly(hole) }];
    },
  },
  // the gear sliced by a "/" and knocked out of line: broken, not beaten
  split: {
    title: 'Split Gear',
    note: 'A heavy gear sliced by a / (code\'s own slash) with one half knocked forward.',
    defaults: { n: 8, rTip: 306, rRoot: 244, wTip: 90, wRoot: 134, hole: 96, gap: 17, slide: 22, angle: 62, phase: -Math.PI / 2 + Math.PI / 8 },
    small: { n: 6, rTip: 404, rRoot: 316, wTip: 150, wRoot: 210, hole: 120, gap: 26, slide: 30, angle: 62, phase: -Math.PI / 2 + Math.PI / 6 },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const k = o.rTip / 306;
      const outer = IG.gearPoints({ cx: ICX, cy: ICY, n: o.n, rTip: o.rTip, rRoot: o.rRoot, wTip: o.wTip, wRoot: o.wRoot, rTipCorner: 5 * k, rRootCorner: 9 * k, phase: o.phase, arcStep: 0.05 });
      const dir = [Math.cos(IG.rad(o.angle)), -Math.sin(IG.rad(o.angle))];   // up and to the right: "/"
      const nrm = [-dir[1], dir[0]];
      const at = (off, t) => [ICX + nrm[0] * off + dir[0] * t, ICY + nrm[1] * off + dir[1] * t];
      // upper-left half: left of the line going up; lower-right half: the other side
      const ul = IG.cutWithHole(outer, at(-o.gap, -600), at(-o.gap, 600), ICX, ICY, o.hole, 0);
      const lr = IG.cutWithHole(outer, at(o.gap, 600), at(o.gap, -600), ICX, ICY, o.hole, 0);
      const slid = IG.movePts(ul, dir[0] * o.slide, dir[1] * o.slide);
      return [
        { name: 'Gear half (lit)', role: 'accent', d: IG.roundPoly(slid) },
        { name: 'Gear half (shade)', role: 'accentShade', d: IG.roundPoly(lr) },
      ];
    },
  },
  // all spikes: a gear that has become a burst of energy
  burst: {
    title: 'Spike Gear',
    note: 'Teeth sharpened into spikes, long and short, around a solid hub.',
    defaults: { n: 12, rTips: [316, 262], rRoot: 204, wRoot: 104, hole: 80 },
    small: { n: 8, rTips: [410, 340], rRoot: 270, wRoot: 170, hole: 104 },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const pts = IG.burstPoints({ cx: ICX, cy: ICY, n: o.n, rTips: o.rTips, rRoot: o.rRoot, wTip: 0, wRoot: o.wRoot, rTipCorner: 3, rRootCorner: 8, phase: -Math.PI / 2 });
      return [{ name: 'Gear', role: 'accent', d: IG.roundPoly(pts) + ' ' + IG.circle(ICX, ICY, o.hole, -1) }];
    },
  },
  // the RoboCore gear, sharpened: every tooth leans forward, a > prompt is cut through the hub
  slant: {
    title: 'Forward Gear',
    note: 'The RoboCore gear, sharpened: every tooth leans forward, a > prompt is cut through the hub and a hard / of light splits it.',
    defaults: { n: 8, rTip: 306, rRoot: 240, wTip: 86, wRoot: 124, skew: 7, tipR: 4, rootR: 10, hub: 'chevron', chev: [110, 94, 78], hole: 92, phase: -90, facet: true },
    small: { n: 6, rTip: 404, rRoot: 314, wTip: 150, wRoot: 200, skew: 8, tipR: 10, rootR: 16, hub: 'chevron', chev: [150, 120, 112], hole: 120, phase: -90, facet: false },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const k = o.rTip / 306;
      const outer = IG.gearPoints({ cx: ICX, cy: ICY, n: o.n, rTip: o.rTip, rRoot: o.rRoot, wTip: o.wTip, wRoot: o.wRoot, skew: IG.rad(o.skew), rTipCorner: o.tipR * k, rRootCorner: o.rootR * k, phase: IG.rad(o.phase), arcStep: 0.06 });
      let d = IG.roundPoly(outer);
      if (o.hub === 'chevron') { const [h, dd, t] = o.chev; d += ' ' + IG.roundPoly(IG.chevronPoly(ICX + 10 * k, ICY, h, dd, t, 1, 8 * k)); }
      else if (o.hub === 'circle') d += ' ' + IG.circle(ICX, ICY, o.hole, -1);
      return [{ name: o.facet ? 'Gear' : 'Gear (flat)', role: o.facet ? 'facet' : 'accent', d }];
    },
  },
  // round 3 (2026-10-19): the gear as a planet inside a tapered orbit ring, in one ink, after Fred's planet-logo sheet
  orbit: {
    title: 'Orbit Gear',
    note: 'The RoboCore gear as a planet, with a tapered orbit ring sweeping across it, in one ink.',
    defaults: { n: 8, rTip: 262, rRoot: 214, wTip: 82, wRoot: 112, tipR: 8, rootR: 10, phase: 0, tilt: -22, a: 396, front: [70, 166], back: [86, 104], gap: 24, ring: 'full', face: 'none', spark: null, moon: null, dy: 0 },
    // 16–32 px: 6 teeth, a bolder ring that only passes in front, and no slice of gear below it
    small: { n: 6, rTip: 310, rRoot: 244, wTip: 146, wRoot: 190, tipR: 10, rootR: 12, phase: 0, tilt: -22, a: 486, front: [120, 250], back: [104, 130], gap: 46, ring: 'front', hideBelow: true, face: 'none', spark: null, moon: null, dy: -20 },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const cx = ICX, cy = ICY + o.dy, th = IG.rad(o.tilt), k = o.rTip / 262;
      const s = (x) => Math.sqrt(Math.max(0, 1 - (x * x) / (o.a * o.a)));
      const hIn = (x) => o.front[0] * s(x) - o.gap, hOut = (x) => o.front[1] * s(x) + o.gap;
      const walkH = (h) => (A, B) => { const r = []; for (let i = 1; i < 24; i++) { const x = A[0] + (B[0] - A[0]) * i / 24; r.push([x, cy + h(x - cx), 0]); } return r; };
      // gear without a hub, in the ring's frame (ring along x)
      const gear = IG.rotPts(IG.gearPoints({ cx, cy, n: o.n, rTip: o.rTip, rRoot: o.rRoot, wTip: o.wTip, wRoot: o.wRoot, rTipCorner: o.tipR * k, rRootCorner: o.rootR * k, phase: -Math.PI / 2 + IG.rad(o.phase) - th, arcStep: 0.05 }), cx, cy, 0);
      const front = o.ring !== 'none';
      const upper = front ? IG.clipRegion(gear, (p) => p[1] - cy < hIn(p[0] - cx), walkH(hIn)) : gear;
      const lower = front && !o.hideBelow ? IG.clipRegion(gear, (p) => p[1] - cy > hOut(p[0] - cx), walkH(hOut)) : null;
      const back = (o.ring === 'full');
      const rc = o.rTip + o.gap;
      const walkC = (A, B) => {
        let a0 = Math.atan2(A[1] - cy, A[0] - cx), a1 = Math.atan2(B[1] - cy, B[0] - cx), d = a1 - a0;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const r = []; for (let i = 1; i < 16; i++) { const a = a0 + d * i / 16; r.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a), 0]); } return r;
      };
      const uniq = (pts) => pts.filter((p, i) => { const q = pts[(i + 1) % pts.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.01; });
      const crescent = (bOut, bIn, sign) => uniq(IG.arcPts(cx, cy, o.a, bOut, sign, -o.a, o.a, 96).concat(IG.arcPts(cx, cy, o.a, bIn, sign, o.a, -o.a, 96)));
      const R = (pts) => IG.rotPts(pts, cx, cy, th);
      const layers = [];
      let gearD = IG.roundPoly(R(upper));
      if (lower && lower.length > 2) gearD += ' ' + IG.roundPoly(R(lower));
      if (o.face === 'eyes') for (const sx of [-1, 1]) gearD += ' ' + IG.circle(cx + sx * 66 * k, cy - 70 * k, 30 * k, -1);
      if (o.face === 'prompt') gearD += ' ' + IG.roundPoly(IG.chevronPoly(cx + 6 * k, cy - 86 * k, 62 * k, 54 * k, 46 * k, 1, 6 * k));
      if (o.face === 'hub') gearD += ' ' + IG.circle(cx, cy - 92 * k, 46 * k, -1);
      layers.push({ name: 'Planet gear', role: 'ink', d: gearD });
      if (front) {
        let ringD = IG.roundPoly(R(crescent(o.front[1], o.front[0], 1)));
        if (back) {
          const B = crescent(o.back[1], o.back[0], -1);
          for (const [p1, p2] of [[[cx, cy + 2000], [cx, cy - 2000]], [[cx, cy - 2000], [cx, cy + 2000]]]) {
            const half = IG.clipHalf(B, p1, p2);
            const vis = IG.clipRegion(half, (p) => Math.hypot(p[0] - cx, p[1] - cy) > rc, walkC);
            if (vis.length > 2) ringD += ' ' + IG.roundPoly(R(vis));
          }
        }
        layers.push({ name: 'Orbit ring', role: 'ink', d: ringD });
      }
      if (o.spark) layers.push({ name: 'Spark', role: 'ink', d: IG.roundPoly(IG.sparkle(cx + o.spark[0], cy + o.spark[1], o.spark[2], 0.26)) });
      if (o.moon) layers.push({ name: 'Moon', role: 'ink', d: IG.circle(cx + o.moon[0], cy + o.moon[1], o.moon[2]) });
      return layers;
    },
  },
  // round 3b (2026-10-19, Fred's pick from four sketches): a smooth planet whose ring is a gear, seen in perspective
  gearring: {
    title: 'Geared Ring',
    note: 'A planet whose ring is the RoboCore gear, seen edge-on: teeth all the way round, in one ink.',
    defaults: { n: 12, rTip: 400, rRoot: 348, wTip: 74, wRoot: 100, rIn: 254, squash: 0.42, planet: 212, gap: 22, tilt: -20, tipR: 5, rootR: 6, face: 'none', moon: null },
    // 16–32 px: fewer, bigger teeth, a thicker ring and a bigger planet on a full-canvas plate
    small: { n: 10, rTip: 470, rRoot: 398, wTip: 104, wRoot: 136, rIn: 300, squash: 0.44, planet: 250, gap: 36, tilt: -20, tipR: 8, rootR: 8, face: 'none', moon: null },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const cx = ICX, cy = ICY, th = IG.rad(o.tilt), q = o.squash, k = o.rTip / 400;
      const sq = (pts) => pts.map((p) => [p[0], cy + (p[1] - cy) * q, (p[2] || 0)]);
      // the gear ring, flattened into an ellipse (ring frame: axis along x)
      const outer = sq(IG.gearPoints({ cx, cy, n: o.n, rTip: o.rTip, rRoot: o.rRoot, wTip: o.wTip, wRoot: o.wRoot, rTipCorner: o.tipR, rRootCorner: o.rootR, phase: 0, arcStep: 0.035 }));
      const onAxis = (p) => Math.abs(p[1] - cy) < 0.01;
      // half of the ring: half of the toothed disc with the half inner ellipse carved out of its straight edge
      const half = (sign) => {
        const a = sign > 0 ? [cx - 2000, cy] : [cx + 2000, cy], b = sign > 0 ? [cx + 2000, cy] : [cx - 2000, cy];
        const hp = IG.clipHalf(outer, a, b);                       // keeps y >= cy (front) or y <= cy (back)
        let i = -1;
        for (let j = 0; j < hp.length; j++) if (onAxis(hp[j]) && onAxis(hp[(j + 1) % hp.length])) { i = j; break; }
        if (i < 0) return hp;
        const P = hp[i], Q = hp[(i + 1) % hp.length];
        const dir = Q[0] > P[0] ? 1 : -1;
        const arc = IG.arcPts(cx, cy, o.rIn, o.rIn * q, sign, -dir * o.rIn, dir * o.rIn, 64).map((p) => [p[0], p[1], 0]);
        return hp.slice(0, i + 1).concat(arc, hp.slice(i + 1));
      };
      const front = half(1), back = half(-1);
      // planet: cut by the front of the ring (plus a gap) — above the inner edge and below the tooth tips
      const sIn = (x) => Math.sqrt(Math.max(0, 1 - (x * x) / (o.rIn * o.rIn)));
      const sOut = (x) => Math.sqrt(Math.max(0, 1 - (x * x) / (o.rTip * o.rTip)));
      const hIn = (x) => o.rIn * q * sIn(x) - o.gap, hOut = (x) => o.rTip * q * sOut(x) + o.gap;
      const walkH = (h) => (A, B) => { const r = []; for (let j = 1; j < 24; j++) { const x = A[0] + (B[0] - A[0]) * j / 24; r.push([x, cy + h(x - cx), 0]); } return r; };
      const disc = IG.circlePts(cx, cy, o.planet, 160);
      const pUp = IG.clipRegion(disc, (p) => p[1] - cy < hIn(p[0] - cx), walkH(hIn));
      const pDown = IG.clipRegion(disc, (p) => p[1] - cy > hOut(p[0] - cx), walkH(hOut));
      // back of the ring: hidden behind the planet (plus a gap), left and right pieces clipped separately
      const rc = o.planet + o.gap;
      const walkC = (A, B) => {
        const a0 = Math.atan2(A[1] - cy, A[0] - cx); let d = Math.atan2(B[1] - cy, B[0] - cx) - a0;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const r = []; for (let j = 1; j < 20; j++) { const a = a0 + d * j / 20; r.push([cx + rc * Math.cos(a), cy + rc * Math.sin(a), 0]); } return r;
      };
      const R = (pts) => IG.rotPts(pts, cx, cy, th);
      let ringD = IG.roundPoly(R(front));
      for (const [p1, p2] of [[[cx, cy + 2000], [cx, cy - 2000]], [[cx, cy - 2000], [cx, cy + 2000]]]) {
        const vis = IG.clipRegion(IG.clipHalf(back, p1, p2), (p) => Math.hypot(p[0] - cx, p[1] - cy) > rc, walkC);
        if (vis.length > 2) ringD += ' ' + IG.roundPoly(R(vis));
      }
      let planetD = IG.roundPoly(R(pUp));
      if (pDown.length > 2) planetD += ' ' + IG.roundPoly(R(pDown));
      if (o.face === 'prompt') planetD += ' ' + IG.roundPoly(IG.chevronPoly(cx + 8 * k, cy - 70 * k, 56 * k, 50 * k, 42 * k, 1, 6 * k));
      if (o.face === 'eyes') for (const sx of [-1, 1]) planetD += ' ' + IG.circle(cx + sx * 58 * k, cy - 74 * k, 26 * k, -1);
      const layers = [{ name: 'Planet', role: 'ink', d: planetD }, { name: 'Gear ring', role: 'ink', d: ringD }];
      if (o.moon) layers.push({ name: 'Moon', role: 'ink', d: IG.circle(cx + o.moon[0], cy + o.moon[1], o.moon[2]) });
      return layers;
    },
  },
  // a solid gear with a sharp run arrow cut through it
  run: {
    title: 'Run Gear',
    note: 'A solid, chunky gear with a sharp Run / Upload arrow cut clean through it.',
    defaults: { n: 8, rTip: 306, rRoot: 248, wTip: 92, wRoot: 134, tri: 112 },
    small: { n: 6, rTip: 404, rRoot: 320, wTip: 150, wRoot: 210, tri: 150 },
    glyph(o) {
      o = Object.assign({}, this.defaults, o || {});
      const k = o.rTip / 306, t = o.tri;
      const outer = IG.gearPoints({ cx: ICX, cy: ICY, n: o.n, rTip: o.rTip, rRoot: o.rRoot, wTip: o.wTip, wRoot: o.wRoot, rTipCorner: 6 * k, rRootCorner: 10 * k, phase: -Math.PI / 2 + Math.PI / o.n });
      const tri = [[ICX - t * 0.62, ICY - t, 14 * k], [ICX + t * 1.08, ICY, 14 * k], [ICX - t * 0.62, ICY + t, 14 * k]];
      return [{ name: 'Gear', role: 'accent', d: IG.roundPoly(outer) + ' ' + IG.roundPoly(tri) }];
    },
  },
};

if (typeof module !== 'undefined') module.exports = { CONCEPTS, coreGear, ICX, ICY };
// The current app icon (robocore-ide web/icons/Icon-512.png at 256 px), shown as "Before" on page 07.
const AI_BEFORE_PNG = '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';
// ============================================================================
// RoboCore IDE Design Builder — core helpers
// Builds the RoboCore IDE design file (tokens, components, screens, prototype).
// Standard Figma Plugin API only, documentAccess: dynamic-page.
// ============================================================================

const PAGE_NAMES = {
  foundations: '01 — Foundations',
  components: '02 — Components',
  ide: '03 — Main IDE',
  screens: '04 — Additional Screens',
  prototype: '05 — Prototype',
  dark: '06 — Dark Mode',
};

const REPORT = { errors: [], warnings: [], counts: {}, timings: {} };
const V = {};      // variables by name
const TS = {};     // text style specs by name: { font, size, lh, ls, tc, id }
const ES = {};     // effect styles by name
const ICON = {};   // icon components by name
const CMP = {};    // components / component sets by key
const LINKS = [];  // deferred style links: [node, kind, name]
const VAR_HEX = {}; // variable name -> resolved hex (raw fallback colour for bound paints)
const POST = [];    // edits that must run after text styles are linked (bold ranges)
let FONT_MONO = 'JetBrains Mono';
let FONT_BRAND = 'Barlow';

function warn(msg) { REPORT.warnings.push(msg); }

// ---------- colour ----------
function hexToRgba(h) {
  h = h.replace('#', '');
  const n = parseInt(h.slice(0, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
}
function hexToRgb(h) { const c = hexToRgba(h); return { r: c.r, g: c.g, b: c.b }; }
function solid(hex, opacity) { return { type: 'SOLID', color: hexToRgb(hex), opacity: opacity === undefined ? 1 : opacity }; }
// paint bound to a colour variable; falls back to a raw hex if the name starts with '#'
function paint(name, opacity) {
  if (!name) return null;
  if (name[0] === '#') return solid(name, opacity);
  const v = V[name];
  if (!v) throw new Error('Unknown colour variable ' + name);
  // the raw colour is the resolved value, so the paint is correct even where a binding is dropped
  const rgba = VAR_HEX[name] ? hexToRgba(VAR_HEX[name]) : { r: 0, g: 0, b: 0, a: 1 };
  const p = { type: 'SOLID', color: { r: rgba.r, g: rgba.g, b: rgba.b }, opacity: opacity === undefined ? rgba.a : opacity };
  const b = figma.variables.setBoundVariableForPaint(p, 'color', v);
  // binding resets paint opacity to the variable's alpha, so re-apply the requested opacity
  return opacity === undefined ? b : Object.assign({}, b, { opacity });
}
function boundId(p) { return p && p.boundVariables && p.boundVariables.color && p.boundVariables.color.id; }
// re-colour a fill only when it actually changes (overriding an instance paint with its own variable renders black)
function refill(node, name, opacity) {
  const cur = node.fills && node.fills[0];
  if (V[name] && boundId(cur) === V[name].id && (opacity === undefined || Math.abs((cur.opacity === undefined ? 1 : cur.opacity) - opacity) < 0.001)) return;
  node.fills = [paint(name, opacity)];
}

// ---------- spacing / radius tokens ----------
const SPACE_TOKENS = { 0: 'spacing/0', 2: 'spacing/050', 4: 'spacing/100', 6: 'spacing/150', 8: 'spacing/200', 12: 'spacing/300', 16: 'spacing/400', 20: 'spacing/500', 24: 'spacing/600', 32: 'spacing/800', 40: 'spacing/1000', 48: 'spacing/1200' };
const RADIUS_TOKENS = { 4: 'radius/xs', 6: 'radius/sm', 8: 'radius/md', 12: 'radius/lg', 16: 'radius/xl', 999: 'radius/full' };
function bindNum(node, field, value, table) {
  const key = table[value];
  if (key && V[key]) { try { node.setBoundVariable(field, V[key]); } catch (e) { /* keep raw value */ } }
}

// ---------- frames ----------
const ALIGN = { start: 'MIN', center: 'CENTER', end: 'MAX', between: 'SPACE_BETWEEN' };
const CROSS = { start: 'MIN', center: 'CENTER', end: 'MAX', baseline: 'BASELINE' };
function isAL(n) { return n && 'layoutMode' in n && n.layoutMode !== 'NONE'; }

// box(o): o = { name, dir:'H'|'V', gap, pad:[t,r,b,l]|n, px, py, w, h, wSize:'fixed'|'hug'|'fill', hSize,
//   align, cross, fill, fillOpacity, stroke, strokeW, sides:{t,r,b,l}, radius, clip, effect, parent, abs, x, y, grow, wrap }
function box(o = {}) {
  const f = figma.createFrame();
  f.name = o.name || 'Frame';
  f.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  f.clipsContent = !!o.clip;
  if (o.dir) {
    f.layoutMode = o.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
    if (o.wrap) f.layoutWrap = 'WRAP';
    f.itemSpacing = o.gap || 0;
    if (o.wrap && o.rowGap !== undefined) f.counterAxisSpacing = o.rowGap;
    let p = o.pad === undefined ? 0 : o.pad;
    if (typeof p === 'number') p = [p, p, p, p];
    if (o.px !== undefined) { p[1] = o.px; p[3] = o.px; }
    if (o.py !== undefined) { p[0] = o.py; p[2] = o.py; }
    f.paddingTop = p[0]; f.paddingRight = p[1]; f.paddingBottom = p[2]; f.paddingLeft = p[3];
    f.primaryAxisAlignItems = ALIGN[o.align || 'start'];
    f.counterAxisAlignItems = CROSS[o.cross || 'start'];
    bindNum(f, 'itemSpacing', f.itemSpacing, SPACE_TOKENS);
    bindNum(f, 'paddingTop', p[0], SPACE_TOKENS); bindNum(f, 'paddingRight', p[1], SPACE_TOKENS);
    bindNum(f, 'paddingBottom', p[2], SPACE_TOKENS); bindNum(f, 'paddingLeft', p[3], SPACE_TOKENS);
  }
  if (o.w !== undefined || o.h !== undefined) f.resize(Math.max(0.01, o.w === undefined ? 100 : o.w), Math.max(0.01, o.h === undefined ? 100 : o.h));
  if (o.stroke) {
    f.strokes = [paint(o.stroke, o.strokeOpacity)];
    f.strokeAlign = o.strokeAlign || 'INSIDE';
    if (o.sides) {
      f.strokeTopWeight = o.sides.t || 0; f.strokeRightWeight = o.sides.r || 0;
      f.strokeBottomWeight = o.sides.b || 0; f.strokeLeftWeight = o.sides.l || 0;
    } else f.strokeWeight = o.strokeW || 1;
    if (o.dash) f.dashPattern = o.dash;
  }
  if (o.radius !== undefined) setRadius(f, o.radius);
  if (o.effect) LINKS.push([f, 'effect', o.effect]);
  if (o.opacity !== undefined) f.opacity = o.opacity;
  if (o.parent) o.parent.appendChild(f);
  if (o.abs && o.parent && isAL(o.parent)) f.layoutPositioning = 'ABSOLUTE';
  if (o.x !== undefined) f.x = o.x;
  if (o.y !== undefined) f.y = o.y;
  const inAL = o.parent && isAL(o.parent) && !o.abs;
  const sizeOf = (s, given) => s || (given !== undefined ? 'fixed' : (o.dir ? 'hug' : 'fixed'));
  const ws = sizeOf(o.wSize, o.w), hs = sizeOf(o.hSize, o.h);
  const ok = (s) => s === 'fixed' || (s === 'hug' && o.dir) || (s === 'fill' && inAL);
  if (ok(ws)) f.layoutSizingHorizontal = ws.toUpperCase(); else if (ws !== 'fixed') warn('box ' + f.name + ': cannot ' + ws + ' width');
  if (ok(hs)) f.layoutSizingVertical = hs.toUpperCase(); else if (hs !== 'fixed') warn('box ' + f.name + ': cannot ' + hs + ' height');
  if (o.grow && inAL) f.layoutGrow = 1;
  return f;
}
function setRadius(n, r) {
  if (Array.isArray(r)) {
    n.topLeftRadius = r[0]; n.topRightRadius = r[1]; n.bottomRightRadius = r[2]; n.bottomLeftRadius = r[3];
    bindNum(n, 'topLeftRadius', r[0], RADIUS_TOKENS); bindNum(n, 'topRightRadius', r[1], RADIUS_TOKENS);
    bindNum(n, 'bottomRightRadius', r[2], RADIUS_TOKENS); bindNum(n, 'bottomLeftRadius', r[3], RADIUS_TOKENS);
  } else {
    n.cornerRadius = r;
    for (const k of ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius']) bindNum(n, k, r, RADIUS_TOKENS);
  }
}
// fixed-size spacer / flexible spacer
function spacer(parent, size, grow) {
  const s = figma.createFrame();
  s.name = grow ? 'Spacer (flex)' : 'Spacer';
  s.fills = [];
  s.resize(Math.max(0.01, size || 1), Math.max(0.01, size || 1));
  parent.appendChild(s);
  if (grow) { s.layoutGrow = 1; }
  return s;
}
function rect(o = {}) {
  const r = figma.createRectangle();
  r.name = o.name || 'Rectangle';
  r.resize(Math.max(0.01, o.w || 10), Math.max(0.01, o.h || 10));
  r.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.stroke) { r.strokes = [paint(o.stroke)]; r.strokeWeight = o.strokeW || 1; r.strokeAlign = 'INSIDE'; }
  if (o.radius !== undefined) setRadius(r, o.radius);
  if (o.parent) o.parent.appendChild(r);
  if (o.abs && o.parent && isAL(o.parent)) r.layoutPositioning = 'ABSOLUTE';
  if (o.x !== undefined) r.x = o.x;
  if (o.y !== undefined) r.y = o.y;
  if (o.wSize === 'fill' && o.parent && isAL(o.parent)) r.layoutSizingHorizontal = 'FILL';
  if (o.hSize === 'fill' && o.parent && isAL(o.parent)) r.layoutSizingVertical = 'FILL';
  if (o.opacity !== undefined) r.opacity = o.opacity;
  return r;
}
function dot(parent, color, size = 8, name = 'Status dot') {
  const e = figma.createEllipse();
  e.name = name;
  e.resize(size, size);
  e.fills = [paint(color)];
  parent.appendChild(e);
  return e;
}
function divider(parent, dir = 'V', len, color = 'color/border/subtle', name = 'Divider') {
  const r = figma.createRectangle();
  r.name = name;
  if (dir === 'V') r.resize(1, len || 20); else r.resize(len || 20, 1);
  r.fills = [paint(color)];
  parent.appendChild(r);
  if (!len && isAL(parent)) { if (dir === 'V') r.layoutSizingVertical = 'FILL'; else r.layoutSizingHorizontal = 'FILL'; }
  return r;
}

// ---------- text ----------
// txt(chars, o): o = { style, color, parent, name, w, fill:true, align:'LEFT'|'CENTER'|'RIGHT', truncate, maxLines, abs, x, y }
function txt(chars, o = {}) {
  const st = TS[o.style || 'Body/Default'];
  if (!st) throw new Error('Unknown text style ' + o.style);
  const t = figma.createText();
  t.fontName = st.font;
  t.fontSize = st.size;
  t.lineHeight = { unit: 'PIXELS', value: st.lh };
  t.letterSpacing = { unit: 'PERCENT', value: st.ls };
  if (st.tc) t.textCase = st.tc;
  t.characters = String(chars);
  t.name = o.name || String(chars).slice(0, 48);
  t.fills = [paint(o.color || 'color/text/primary')];
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.parent) o.parent.appendChild(t);
  if (o.abs && o.parent && isAL(o.parent)) t.layoutPositioning = 'ABSOLUTE';
  if (o.x !== undefined) t.x = o.x;
  if (o.y !== undefined) t.y = o.y;
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, Math.max(1, t.height)); }
  if (o.fill && o.parent && isAL(o.parent)) { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; }
  if (o.grow && o.parent && isAL(o.parent)) { t.textAutoResize = 'HEIGHT'; t.layoutGrow = 1; }
  if (o.truncate) { t.textTruncation = 'ENDING'; t.maxLines = o.maxLines || 1; }
  if (o.opacity !== undefined) t.opacity = o.opacity;
  if (!o.noStyle) LINKS.push([t, 'text', o.style || 'Body/Default']);
  return t;
}

// ---------- icons ----------
function iconInst(name, parent, color, size) {
  const c = ICON[name];
  if (!c) { warn('missing icon ' + name); return null; }
  const i = c.createInstance();
  if (parent) parent.appendChild(i);
  if (size && size !== 20) i.resize(size, size);
  if (color) tint(i, color);
  return i;
}
function tint(node, color) {
  const vecs = node.findAll ? node.findAll(n => n.type === 'VECTOR' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE' || n.type === 'POLYGON' || n.type === 'LINE' || n.type === 'BOOLEAN_OPERATION') : [];
  const id = V[color] && V[color].id;
  for (const v of vecs) {
    if (v.strokes && v.strokes.length && !(id && boundId(v.strokes[0]) === id)) v.strokes = [paint(color)];
  }
}

// ---------- components ----------
function setText(node, name, value) {
  const t = node.type === 'TEXT' && node.name === name ? node : node.findOne(n => n.type === 'TEXT' && n.name === name);
  if (!t) { warn('setText: no text "' + name + '" in ' + node.name); return null; }
  const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters;
  if (ref) {
    // text bound to a component property: set the property on the nearest instance
    let p = t.parent;
    while (p && p.type !== 'INSTANCE') p = p.parent;
    if (p && p.componentProperties && p.componentProperties[ref]) { const o = {}; o[ref] = String(value); p.setProperties(o); return t; }
  }
  t.characters = String(value);
  return t;
}
function setProp(inst, propName, value) {
  const props = inst.componentProperties;
  const key = Object.keys(props).find(k => k.split('#')[0] === propName);
  if (!key) { if (typeof value === 'string') { setText(inst, propName, value); return; } warn('setProp: no property ' + propName + ' on ' + inst.name); return; }
  const o = {}; o[key] = value;
  inst.setProperties(o);
}
function variantOf(set, props) {
  const want = Object.entries(props);
  const c = set.children.find(ch => {
    const parts = {};
    ch.name.split(',').forEach(s => { const [k, v] = s.split('=').map(x => x.trim()); parts[k] = v; });
    return want.every(([k, v]) => parts[k] === v);
  });
  if (!c) throw new Error('No variant ' + JSON.stringify(props) + ' in ' + set.name);
  return c;
}
function inst(key, props, parent, opts = {}) {
  const src = CMP[key];
  if (!src) throw new Error('Unknown component ' + key);
  const comp = src.type === 'COMPONENT_SET' ? variantOf(src, props || {}) : src;
  const i = comp.createInstance();
  if (parent) parent.appendChild(i);
  if (opts.name) i.name = opts.name;
  if (opts.abs && parent && isAL(parent)) i.layoutPositioning = 'ABSOLUTE';
  if (opts.x !== undefined) i.x = opts.x;
  if (opts.y !== undefined) i.y = opts.y;
  if (opts.wSize === 'fill' && parent && isAL(parent)) i.layoutSizingHorizontal = 'FILL';
  if (opts.hSize === 'fill' && parent && isAL(parent)) i.layoutSizingVertical = 'FILL';
  if (opts.grow && parent && isAL(parent)) i.layoutGrow = 1;
  if (opts.text) for (const [k, v] of Object.entries(opts.text)) setText(i, k, v);
  if (opts.props) for (const [k, v] of Object.entries(opts.props)) setProp(i, k, v);
  return i;
}
// lays out variants of a component set in a grid and sizes the set
function gridVariants(set, cols, gapX = 24, gapY = 24, pad = 24) {
  const kids = set.children.slice();
  let x = pad, y = pad, rowH = 0, maxW = 0;
  kids.forEach((k, i) => {
    if (i > 0 && i % cols === 0) { x = pad; y += rowH + gapY; rowH = 0; }
    k.x = x; k.y = y;
    x += k.width + gapX;
    rowH = Math.max(rowH, k.height);
    maxW = Math.max(maxW, x);
  });
  set.resize(Math.max(1, maxW - gapX + pad), Math.max(1, y + rowH + pad));
  set.fills = [paint('color/bg/app')];
  set.strokes = [paint('color/border/default')];
  set.dashPattern = [6, 4];
  set.strokeWeight = 1;
  set.cornerRadius = 12;
}
// combine components into a set inside parent
function makeSet(comps, name, parent, cols, desc) {
  const set = figma.combineAsVariants(comps, parent);
  set.name = name;
  if (desc) set.description = desc;
  gridVariants(set, cols);
  return set;
}
function comp(name, desc) {
  const c = figma.createComponent();
  c.name = name;
  c.fills = [];
  if (desc) c.description = desc;
  return c;
}
// turn a component into an auto-layout container quickly
function al(node, o = {}) {
  node.layoutMode = o.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
  node.itemSpacing = o.gap || 0;
  let p = o.pad === undefined ? 0 : o.pad;
  if (typeof p === 'number') p = [p, p, p, p];
  if (o.px !== undefined) { p[1] = o.px; p[3] = o.px; }
  if (o.py !== undefined) { p[0] = o.py; p[2] = o.py; }
  node.paddingTop = p[0]; node.paddingRight = p[1]; node.paddingBottom = p[2]; node.paddingLeft = p[3];
  node.primaryAxisAlignItems = ALIGN[o.align || 'start'];
  node.counterAxisAlignItems = CROSS[o.cross || 'center'];
  bindNum(node, 'itemSpacing', node.itemSpacing, SPACE_TOKENS);
  bindNum(node, 'paddingTop', p[0], SPACE_TOKENS); bindNum(node, 'paddingRight', p[1], SPACE_TOKENS);
  bindNum(node, 'paddingBottom', p[2], SPACE_TOKENS); bindNum(node, 'paddingLeft', p[3], SPACE_TOKENS);
  if (o.w !== undefined || o.h !== undefined) node.resize(o.w || node.width, o.h || node.height);
  node.layoutSizingHorizontal = o.w !== undefined ? 'FIXED' : 'HUG';
  node.layoutSizingVertical = o.h !== undefined ? 'FIXED' : 'HUG';
  if (o.fill) node.fills = [paint(o.fill, o.fillOpacity)];
  if (o.stroke) { node.strokes = [paint(o.stroke)]; node.strokeWeight = o.strokeW || 1; node.strokeAlign = 'INSIDE'; }
  if (o.radius !== undefined) setRadius(node, o.radius);
  if (o.effect) LINKS.push([node, 'effect', o.effect]);
  return node;
}

// ---------- page documentation helpers ----------
function section(page, name, x, y, w, h) {
  const s = figma.createSection();
  s.name = name;
  page.appendChild(s);
  s.x = x; s.y = y;
  s.resizeWithoutConstraints(w, h);
  s.fills = [paint('color/bg/chrome')];
  return s;
}
// documentation header block: overline + title + description
function docHeader(parent, overline, title, desc, w = 900) {
  const h = box({ name: 'Doc header', dir: 'V', gap: 8, parent });
  if (overline) txt(overline, { style: 'Caption/Overline', color: 'color/text/brand', parent: h });
  txt(title, { style: 'Heading/H1', parent: h });
  if (desc) txt(desc, { style: 'Body/Default', color: 'color/text/secondary', parent: h, w });
  return h;
}
function placeRight(page, gap = 200) {
  let maxX = 0;
  for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);
  return maxX + gap;
}

// ---------- box artwork ----------
const IMG = {};
function artHash(key) {
  if (!IMG[key]) IMG[key] = figma.createImage(figma.base64Decode(ART[key].png)).hash;
  return IMG[key];
}
// navy line drawing from the box (robot / board) as an image-filled rectangle, width w
function artRect(parent, key, w, name) {
  const a = ART[key];
  const r = figma.createRectangle();
  r.name = name || ('Line art / ' + key);
  r.resize(w, Math.round(w * a.h / a.w));
  r.fills = [{ type: 'IMAGE', imageHash: artHash(key), scaleMode: 'FIT' }];
  if (parent) parent.appendChild(r);
  return r;
}
// the box's topography contours (Fred's contour SVG), scaled to cover w x h and clipped
function contours(parent, w, h, color, opacity) {
  const svg = '<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    ART.contours.map(d => '<path d="' + d + '" stroke="#D9971A" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>').join('') + '</svg>';
  const art = figma.createNodeFromSvg(svg);
  art.name = 'Contour lines';
  art.rescale(Math.max(w, h) / 1080);
  for (const v of art.findAll(n => n.type === 'VECTOR')) { v.strokes = [paint(color || 'color/decor/contour')]; v.strokeWeight = 1.25; }
  const g = figma.createFrame();
  g.name = 'Contours';
  g.fills = []; g.clipsContent = true;
  g.resize(w, h);
  g.appendChild(art);
  art.x = Math.round((w - art.width) / 2); art.y = Math.round((h - art.height) / 2);
  g.locked = true;
  if (opacity !== undefined) g.opacity = opacity;
  if (parent) { parent.appendChild(g); if (isAL(parent)) g.layoutPositioning = 'ABSOLUTE'; g.x = 0; g.y = 0; g.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }; }
  return g;
}
// ============================================================================
// Tokens — the RoboCore V2 box palette: navy ink + RoboCore yellow on cream paper.
// Monochrome by design: every colour is the box navy, a navy tint, the box yellow
// (plus its ochre contour shade) or paper. Collections: Primitives (hidden),
// Color (mode "Paper"), Dimensions. Starter plans allow one mode per collection.
// ============================================================================

const PRIMITIVES = {
  // navy ink (box) and its tints over paper
  'navy/100': '#1B2A41', 'navy/deep': '#111C2D', 'navy/88': '#364357', 'navy/72': '#5B6573', 'navy/66': '#6A7380', 'navy/58': '#7B828D',
  'navy/40': '#A4A8AD', 'navy/32': '#B6B9BB', 'navy/24': '#C8CACA', 'navy/16': '#DBDBD8', 'navy/10': '#E7E5E0', 'navy/6': '#F0EDE7',
  'navy/scrim': '#1B2A4173',
  // RoboCore yellow (box field) and its ochre contour shade
  'yellow/100': '#F2B01E', 'yellow/hover': '#F5C04A', 'yellow/pressed': '#D99A0F', 'yellow/tint': '#FCE9BF', 'yellow/soft': '#FDF1D5',
  'ochre/ink': '#8A5A00', 'ochre/contour': '#D9971A',
  // block categories — print-like inks chosen to sit with navy and yellow; cream labels >= 4.5:1
  'block/output': '#2F6BBF', 'block/input': '#7A4FB5', 'block/math': '#2F7A4C', 'block/variables': '#B23E7A',
  'block/robotics': '#B84A26', 'block/sensors': '#0F7680', 'block/communication': '#1B2A41',
  // paper
  'paper/cream': '#F7F1E3', 'paper/sheet': '#FFFCF5', 'paper/white': '#FFFFFF',
};
// Dark mode ("Navy"): the box inverted — navy surfaces, cream ink, the same yellow.
const DARK_PRIMS = {
  'night/950': '#0B1422', 'night/900': '#0E1828', 'night/850': '#121E31', 'night/800': '#16233A', 'night/750': '#17253A', 'night/700': '#1B2A41',
  'night/650': '#22344F', 'night/600': '#26395A', 'night/550': '#2E4363', 'night/500': '#33496B', 'night/450': '#4A6085', 'night/400': '#56709A',
  'cream/100': '#F7F1E3', 'cream/90': '#E1DDD3', 'cream/78': '#C7C5BF', 'cream/60': '#9FA1A2', 'cream/42': '#777E85', 'cream/32': '#616A75',
  'cream/hover': '#E8E0CD', 'cream/pressed': '#D9CFB8', 'night/yellow-tint': '#46453A', 'night/yellow-soft': '#2C353E', 'night/contour': '#695122',
  'night/value': '#F2C14E', 'night/scrim': '#05090FB3', 'night/communication': '#3E5A86',
};
const DARK_MAP = {
  'color/bg/app': 'night/850', 'color/bg/chrome': 'night/850', 'color/bg/brand': 'night/900', 'color/bg/panel': 'night/700', 'color/bg/raised': 'night/650',
  'color/bg/input': 'night/800', 'color/bg/hover': 'night/600', 'color/bg/subtle': 'night/650', 'color/bg/editor': 'night/700', 'color/bg/canvas': 'night/750',
  'color/bg/console': 'night/800', 'color/bg/selected': 'night/yellow-tint', 'color/bg/inverse': 'cream/100', 'color/bg/overlay': 'night/scrim',
  'color/border/subtle': 'night/650', 'color/border/default': 'night/550', 'color/border/strong': 'night/450', 'color/border/ink': 'cream/100',
  'color/text/primary': 'cream/100', 'color/text/secondary': 'cream/78', 'color/text/tertiary': 'cream/60', 'color/text/disabled': 'cream/42',
  'color/text/on-ink': 'night/700', 'color/text/brand': 'yellow/100', 'color/text/on-bright': 'navy/100',
  'color/icon/default': 'cream/78', 'color/icon/muted': 'cream/60', 'color/icon/strong': 'cream/100', 'color/icon/on-ink': 'night/700', 'color/icon/brand': 'yellow/100',
  'color/icon/disabled': 'cream/32', 'color/icon/on-bright': 'navy/100',
  'color/ink/default': 'cream/100', 'color/ink/hover': 'cream/hover', 'color/ink/pressed': 'cream/pressed',
  'color/brand/default': 'yellow/100', 'color/brand/hover': 'yellow/hover', 'color/brand/pressed': 'yellow/pressed', 'color/brand/tint': 'night/yellow-tint', 'color/brand/soft': 'night/yellow-soft',
  'color/decor/contour': 'night/contour',
  'color/block/control': 'yellow/100', 'color/block/output': 'block/output', 'color/block/input': 'block/input', 'color/block/math': 'block/math',
  'color/block/variables': 'block/variables', 'color/block/robotics': 'block/robotics', 'color/block/sensors': 'block/sensors', 'color/block/communication': 'night/communication',
  'color/block/label': 'paper/cream', 'color/block/outline': 'night/950', 'color/block/field': 'paper/white',
  'color/control/track-off': 'night/400', 'color/control/knob': 'night/900',
  'color/syntax/keyword': 'cream/100', 'color/syntax/function': 'cream/100', 'color/syntax/value': 'night/value', 'color/syntax/comment': 'cream/60',
  'color/syntax/plain': 'cream/90', 'color/syntax/line-number': 'cream/42', 'color/syntax/line-number-active': 'cream/100',
};
// how dark frames get their colours: a real "Navy" mode when the plan allows it, otherwise a parallel collection
const THEME = { modes: false, collection: null, modeId: null };
const VD = {}, DARK_BY_ID = {}, DARK_HEX = {};
const BG = ['FRAME_FILL', 'SHAPE_FILL'], BR = ['STROKE_COLOR'], TX = ['TEXT_FILL'], ALLC = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'], IC = ['SHAPE_FILL', 'STROKE_COLOR'];
const SEMANTIC = [
  ['color/bg/app', 'paper/cream', BG, 'App background (box cream)'],
  ['color/bg/chrome', 'paper/cream', BG, 'Sidebar and status bar'],
  ['color/bg/brand', 'yellow/100', BG, 'Top bar and brand panels (box yellow)'],
  ['color/bg/panel', 'paper/sheet', BG, 'Panels, cards, editor'],
  ['color/bg/raised', 'paper/white', BG, 'Menus, dialogs'],
  ['color/bg/input', 'paper/white', BG, 'Inputs and selects'],
  ['color/bg/hover', 'navy/6', BG, 'Hover on rows and items'],
  ['color/bg/subtle', 'navy/6', BG, 'Quiet fills (thumbnails, segmented control)'],
  ['color/bg/editor', 'paper/sheet', BG, 'Code editor'],
  ['color/bg/canvas', 'paper/sheet', BG, 'Blocks workspace'],
  ['color/bg/console', 'paper/sheet', BG, 'Serial / compiler output'],
  ['color/bg/selected', 'yellow/tint', BG, 'Selected / active item'],
  ['color/bg/inverse', 'navy/100', BG, 'Tooltips, error toasts, primary buttons'],
  ['color/bg/overlay', 'navy/scrim', BG, 'Modal scrim (45% navy)'],
  ['color/border/subtle', 'navy/10', BR, 'Dividers, panel edges'],
  ['color/border/default', 'navy/16', BR, 'Cards, inputs'],
  ['color/border/strong', 'navy/40', BR, 'Hovered inputs'],
  ['color/border/ink', 'navy/100', BR, 'Line-art outlines, focus, selected'],
  ['color/text/primary', 'navy/100', TX, 'Primary text — 13.6:1 on paper'],
  ['color/text/secondary', 'navy/72', TX, 'Secondary text — 5.8:1 on paper'],
  ['color/text/tertiary', 'navy/66', TX, 'Meta text — 4.7:1 on paper'],
  ['color/text/disabled', 'navy/40', TX, 'Disabled (non-essential only)'],
  ['color/text/on-ink', 'paper/cream', TX, 'Text on navy — 12.8:1'],
  ['color/text/brand', 'ochre/ink', TX, 'Yellow-family text (warnings, values) — 5.8:1'],
  ['color/text/on-bright', 'navy/100', TX, 'Text on yellow, cream or white surfaces — navy in both themes'],
  ['color/icon/default', 'navy/72', IC, 'Default icon'],
  ['color/icon/muted', 'navy/58', IC, 'Muted icon'],
  ['color/icon/strong', 'navy/100', IC, 'Active / emphasised icon'],
  ['color/icon/on-ink', 'paper/cream', IC, 'Icon on navy'],
  ['color/icon/brand', 'yellow/100', IC, 'Yellow icon on navy'],
  ['color/icon/disabled', 'navy/32', IC, 'Disabled icon'],
  ['color/icon/on-bright', 'navy/100', IC, 'Icon on yellow, cream or white — navy in both themes'],
  ['color/ink/default', 'navy/100', ALLC, 'Primary actions, connected, success'],
  ['color/ink/hover', 'navy/88', ALLC, 'Primary hover'],
  ['color/ink/pressed', 'navy/deep', ALLC, 'Primary pressed'],
  ['color/brand/default', 'yellow/100', ALLC, 'RoboCore yellow — brand, active indicator, progress'],
  ['color/brand/hover', 'yellow/hover', ALLC, ''],
  ['color/brand/pressed', 'yellow/pressed', ALLC, ''],
  ['color/brand/tint', 'yellow/tint', ALLC, 'Selected backgrounds'],
  ['color/brand/soft', 'yellow/soft', ALLC, 'Quiet brand backgrounds'],
  ['color/decor/contour', 'ochre/contour', IC, 'Topography contour lines (decoration only)'],
  ['color/block/control', 'yellow/100', ALLC, 'Control blocks — box yellow, navy labels'],
  ['color/block/output', 'block/output', ALLC, 'Output blocks — cobalt'],
  ['color/block/input', 'block/input', ALLC, 'Input blocks — violet'],
  ['color/block/math', 'block/math', ALLC, 'Math blocks — green'],
  ['color/block/variables', 'block/variables', ALLC, 'Variable blocks — berry'],
  ['color/block/robotics', 'block/robotics', ALLC, 'Robotics blocks — brick'],
  ['color/block/sensors', 'block/sensors', ALLC, 'Sensor blocks — teal'],
  ['color/block/communication', 'block/communication', ALLC, 'Communication blocks — box navy'],
  ['color/block/label', 'paper/cream', ALLC, 'Cream label text and icons on coloured blocks'],
  ['color/block/outline', 'navy/100', ALLC, 'Block outline (line-art)'],
  ['color/block/field', 'paper/white', ALLC, 'Field pills'],
  ['color/control/track-off', 'navy/24', BG, 'Toggle track off'],
  ['color/control/knob', 'paper/white', BG, 'Toggle knob'],
  ['color/syntax/keyword', 'navy/100', TX, 'Keywords & types (bold)'],
  ['color/syntax/function', 'navy/100', TX, 'Functions'],
  ['color/syntax/value', 'ochre/ink', TX, 'Numbers, strings, constants'],
  ['color/syntax/comment', 'navy/66', TX, 'Comments'],
  ['color/syntax/plain', 'navy/88', TX, 'Identifiers, punctuation'],
  ['color/syntax/line-number', 'navy/40', TX, 'Gutter'],
  ['color/syntax/line-number-active', 'navy/100', TX, 'Current line number'],
];
const DIMENSIONS = [
  ['spacing/0', 0, ['GAP']], ['spacing/050', 2, ['GAP']], ['spacing/100', 4, ['GAP']], ['spacing/150', 6, ['GAP']], ['spacing/200', 8, ['GAP']],
  ['spacing/300', 12, ['GAP']], ['spacing/400', 16, ['GAP']], ['spacing/500', 20, ['GAP']], ['spacing/600', 24, ['GAP']], ['spacing/800', 32, ['GAP']],
  ['spacing/1000', 40, ['GAP']], ['spacing/1200', 48, ['GAP']],
  ['radius/xs', 4, ['CORNER_RADIUS']], ['radius/sm', 6, ['CORNER_RADIUS']], ['radius/md', 8, ['CORNER_RADIUS']], ['radius/lg', 12, ['CORNER_RADIUS']],
  ['radius/full', 999, ['CORNER_RADIUS']],
  ['size/top-bar', 56, ['WIDTH_HEIGHT']], ['size/status-bar', 28, ['WIDTH_HEIGHT']], ['size/sidebar', 208, ['WIDTH_HEIGHT']], ['size/sidebar-collapsed', 64, ['WIDTH_HEIGHT']],
  ['size/control', 32, ['WIDTH_HEIGHT']],
];
// [name, family-key, style, size, lineHeight, letterSpacing%, textCase, usage]   cond = Barlow Condensed (box headlines)
const TEXT_STYLES = [
  ['Brand/Wordmark', 'cond', 'Bold', 20, 24, 2, 'UPPER', '"IDE" next to the logo'],
  ['Heading/Display', 'cond', 'Bold', 36, 40, 0, 'UPPER', 'Home hero (box front style)'],
  ['Heading/H1', 'cond', 'Bold', 26, 32, 1, 'UPPER', 'Screen titles'],
  ['Heading/H2', 'cond', 'SemiBold', 18, 24, 3, 'UPPER', 'Section and dialog titles'],
  ['Heading/H3', 'ui', 'SemiBold', 15, 20, 0, null, 'Card titles'],
  ['Body/Default', 'ui', 'Regular', 14, 20, 0, null, 'Body copy'],
  ['Body/Small', 'ui', 'Regular', 13, 18, 0, null, 'Descriptions'],
  ['Label/Default', 'ui', 'Medium', 13, 16, 0, null, 'Controls, tabs, nav'],
  ['Label/Strong', 'ui', 'SemiBold', 13, 16, 0, null, 'Buttons, emphasis'],
  ['Label/Small', 'ui', 'Medium', 12, 16, 0, null, 'Badges, meta'],
  ['Caption/Default', 'ui', 'Regular', 12, 16, 0, null, 'Captions, timestamps'],
  ['Caption/Overline', 'cond', 'SemiBold', 12, 16, 8, 'UPPER', 'Section labels'],
  ['Code/Default', 'mono', 'Regular', 13, 20, 0, null, 'Code editor, output'],
  ['Code/Small', 'mono', 'Regular', 12, 18, 0, null, 'Serial monitor'],
  ['Block/Label', 'ui', 'SemiBold', 13, 16, 0, null, 'Text on blocks'],
  ['Block/Field', 'ui', 'SemiBold', 12, 16, 0, null, 'Values in block fields'],
];
let FONT_COND = 'Barlow Condensed', FONT_UI = 'Barlow';
let PICK = null;

async function setupFonts() {
  const fonts = await figma.listAvailableFontsAsync();
  const fam = {};
  for (const f of fonts) { (fam[f.fontName.family] = fam[f.fontName.family] || new Set()).add(f.fontName.style); }
  FONT_UI = fam['Barlow'] ? 'Barlow' : 'Inter';
  FONT_COND = fam['Barlow Condensed'] ? 'Barlow Condensed' : FONT_UI;
  FONT_MONO = ['JetBrains Mono', 'Roboto Mono', 'IBM Plex Mono', 'Source Code Pro'].find(f => fam[f]) || FONT_UI;
  FONT_BRAND = FONT_COND;
  const pick = (family, style) => {
    const s = fam[family];
    if (s) {
      if (s.has(style)) return { family, style };
      const alt = [...s].find(x => x.replace(/\s/g, '').toLowerCase() === style.replace(/\s/g, '').toLowerCase());
      if (alt) return { family, style: alt };
      if (s.has('Regular')) return { family, style: 'Regular' };
    }
    return { family: 'Inter', style: 'Regular' };
  };
  PICK = pick;
  const famKey = { ui: FONT_UI, mono: FONT_MONO, cond: FONT_COND };
  const toLoad = {};
  for (const [name, fk, style, size, lh, ls, tc] of TEXT_STYLES) {
    const font = pick(famKey[fk], style);
    TS[name] = { font, size, lh, ls, tc };
    toLoad[font.family + '|' + font.style] = font;
  }
  for (const f of [pick('Inter', 'Regular'), pick(FONT_UI, 'Bold'), pick(FONT_UI, 'SemiBold'), pick(FONT_MONO, 'Bold'), pick(FONT_COND, 'Bold')]) toLoad[f.family + '|' + f.style] = f;
  await Promise.all(Object.values(toLoad).map(f => figma.loadFontAsync(f)));
  REPORT.fonts = { ui: FONT_UI, cond: FONT_COND, mono: FONT_MONO, loaded: Object.keys(toLoad) };
}

async function setupTokens() {
  const colls = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  const keep = new Set();
  const getColl = (name, mode) => {
    let c = colls.find(x => x.name === name);
    if (!c) c = figma.variables.createVariableCollection(name);
    if (c.modes[0].name !== mode) c.renameMode(c.modes[0].modeId, mode);
    return c;
  };
  const mk = (coll, name, type, value, scopes, web, desc) => {
    let v = vars.find(x => x.name === name && x.variableCollectionId === coll.id);
    if (!v) v = figma.variables.createVariable(name, coll, type);
    v.setValueForMode(coll.modes[0].modeId, value);
    v.scopes = scopes;
    if (web) v.setVariableCodeSyntax('WEB', web);
    v.description = desc || '';
    V[name] = v; keep.add(v.id);
    return v;
  };
  const css = (n) => 'var(--rc-' + n.replace(/\//g, '-') + ')';
  for (const [k, h] of Object.entries(PRIMITIVES)) VAR_HEX[k] = h;
  for (const [n, p] of SEMANTIC) VAR_HEX[n] = PRIMITIVES[p];
  const P = getColl('Primitives', 'Value');
  P.hiddenFromPublishing = true;
  const prim = {};
  for (const [k, h] of Object.entries(PRIMITIVES)) prim[k] = mk(P, k, 'COLOR', hexToRgba(h), [], css('primitive/' + k), h.toUpperCase());
  const C = getColl('Color', 'Paper');
  for (const [n, p, sc, desc] of SEMANTIC) mk(C, n, 'COLOR', { type: 'VARIABLE_ALIAS', id: prim[p].id }, sc, css(n), desc);
  const D = getColl('Dimensions', 'Value');
  for (const [n, v, sc] of DIMENSIONS) mk(D, n, 'FLOAT', v, sc, css(n));
  // dark mode: Navy values, as a second mode if the plan allows, else as a parallel collection
  const dprim = {};
  for (const [k, h] of Object.entries(DARK_PRIMS)) dprim[k] = mk(P, k, 'COLOR', hexToRgba(h), [], css('primitive/' + k), h.toUpperCase());
  const darkPrim = (n) => dprim[DARK_MAP[n]] || prim[DARK_MAP[n]] || prim[SEMANTIC.find(x => x[0] === n)[1]];
  for (const [n] of SEMANTIC) DARK_HEX[n] = DARK_PRIMS[DARK_MAP[n]] || PRIMITIVES[DARK_MAP[n]] || VAR_HEX[n];
  let navy = C.modes.find(m => m.name === 'Navy');
  let navyId = navy ? navy.modeId : null;
  if (!navyId) { try { navyId = C.addMode('Navy'); } catch (e) { navyId = null; REPORT.themeNote = 'one mode per collection on this plan — dark frames use the "Color · Navy" collection'; } }
  const ours = new Set([P.id, C.id, D.id]);
  if (navyId) {
    THEME.modes = true; THEME.collection = C; THEME.modeId = navyId;
    for (const [n] of SEMANTIC) V[n].setValueForMode(navyId, { type: 'VARIABLE_ALIAS', id: darkPrim(n).id });
  } else {
    const CD = getColl('Color · Navy', 'Navy');
    ours.add(CD.id);
    for (const [n, p, sc, desc] of SEMANTIC) {
      let v = vars.find(x => x.name === n && x.variableCollectionId === CD.id);
      if (!v) v = figma.variables.createVariable(n, CD, 'COLOR');
      v.setValueForMode(CD.modes[0].modeId, { type: 'VARIABLE_ALIAS', id: darkPrim(n).id });
      v.scopes = sc; v.setVariableCodeSyntax('WEB', css(n)); v.description = (desc || '') + ' (Navy)';
      VD[n] = v; DARK_BY_ID[V[n].id] = v; keep.add(v.id);
    }
  }
  REPORT.counts.darkModes = THEME.modes ? 'mode' : 'collection';
  // remove variables left over from earlier builds

  let removed = 0;
  for (const v of vars) if (ours.has(v.variableCollectionId) && !keep.has(v.id)) { try { v.remove(); removed++; } catch (e) { /* in use */ } }
  REPORT.counts.variables = Object.keys(V).length;
  REPORT.counts.variablesRemoved = removed;

  const localTS = await figma.getLocalTextStylesAsync();
  const tsNames = new Set(TEXT_STYLES.map(t => t[0]));
  const liveTS = [];
  for (const s of localTS) { if (!tsNames.has(s.name)) { try { s.remove(); } catch (e) { /* ignore */ } } else liveTS.push(s); }
  for (const [name, fk, style, size, lh, ls, tc, usage] of TEXT_STYLES) {
    const spec = TS[name];
    const s = liveTS.find(x => x.name === name) || figma.createTextStyle();
    s.name = name; s.fontName = spec.font; s.fontSize = size;
    s.lineHeight = { unit: 'PIXELS', value: lh };
    s.letterSpacing = { unit: 'PERCENT', value: ls };
    s.textCase = tc || 'ORIGINAL';
    s.description = usage + ' — ' + spec.font.family + ' ' + spec.font.style + ' ' + size + '/' + lh;
    spec.id = s.id;
  }
  const ink = (a) => ({ r: 27 / 255, g: 42 / 255, b: 65 / 255, a });
  const sh = (a, y, r) => ({ type: 'DROP_SHADOW', color: ink(a), offset: { x: 0, y }, radius: r, spread: 0, visible: true, blendMode: 'NORMAL' });
  const EFFECTS = [
    ['Elevation/Popover', [sh(0.10, 2, 6), sh(0.14, 10, 28)], 'Menus, dropdowns, toasts'],
    ['Elevation/Modal', [sh(0.22, 20, 56)], 'Dialogs'],
    ['Elevation/Drag', [sh(0.22, 8, 18)], 'Block being dragged'],
    ['Focus/Ring', [{ type: 'DROP_SHADOW', color: { r: 242 / 255, g: 176 / 255, b: 30 / 255, a: 0.85 }, offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: 'NORMAL' }], 'Keyboard focus: navy border + yellow halo'],
  ];
  const localES = await figma.getLocalEffectStylesAsync();
  const esNames = new Set(EFFECTS.map(e => e[0]));
  const liveES = [];
  for (const s of localES) { if (!esNames.has(s.name)) { try { s.remove(); } catch (e) { /* ignore */ } } else liveES.push(s); }
  for (const [name, eff, desc] of EFFECTS) {
    const s = liveES.find(x => x.name === name) || figma.createEffectStyle();
    s.name = name; s.effects = eff; s.description = desc;
    ES[name] = s;
  }
  REPORT.counts.textStyles = TEXT_STYLES.length;
  REPORT.counts.effectStyles = EFFECTS.length;
}

async function applyLinks() {
  let ok = 0, fail = 0;
  for (const [node, kind, name] of LINKS) {
    try {
      if (node.removed) continue;
      if (kind === 'text') await node.setTextStyleIdAsync(TS[name].id);
      else if (kind === 'effect') await node.setEffectStyleIdAsync(ES[name].id);
      ok++;
    } catch (e) { fail++; if (fail < 10) warn('link ' + kind + ' ' + name + ': ' + e.message); }
  }
  LINKS.length = 0;
  for (const fn of POST) { try { fn(); } catch (e) { warn('post: ' + e.message); } }
  POST.length = 0;
  REPORT.counts.styleLinks = (REPORT.counts.styleLinks || 0) + ok;
  REPORT.counts.styleLinkFailures = (REPORT.counts.styleLinkFailures || 0) + fail;
}
// ============================================================================
// Helpers shared with the IDE design builder (figma-plugin/src/09_foundations.js,
// 10_pages.js and 11_main.js): doc sections and the local review bridge.
// ============================================================================

function docSection(parent, title, desc) {
  const s = box({ name: 'Section — ' + title, dir: 'V', gap: 20, pad: 40, parent, wSize: 'fill', fill: 'color/bg/panel', radius: 12, stroke: 'color/border/default' });
  const h = box({ name: 'Doc header', dir: 'V', gap: 6, parent: s });
  txt(title, { style: 'Heading/H1', parent: h, name: 'Title' });
  if (desc) txt(desc, { style: 'Body/Default', color: 'color/text/secondary', parent: h, name: 'Description', w: 1000 });
  return s;
}
async function yieldUI() { await new Promise(r => setTimeout(r, 0)); }

function waitForUI(type, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { figma.ui.off('message', h); resolve(null); }, ms);
    const h = (msg) => { if (msg && msg.type === type) { clearTimeout(t); figma.ui.off('message', h); resolve(msg); } };
    figma.ui.on('message', h);
  });
}
let UI_OPEN = false;
async function openReview() {
  if (!UI_OPEN) { figma.showUI(__html__, { visible: false, width: 240, height: 80 }); UI_OPEN = true; }
  for (let i = 0; i < 4; i++) {
    figma.ui.postMessage({ type: 'ping' });
    const pong = await waitForUI('pong', 3000);
    if (pong && pong.ok) return true;
  }
  return false;
}
async function exportForReview(items) {
  let n = 0;
  for (const [name, node, scale] of items) {
    if (!node || node.removed) continue;
    try {
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      figma.ui.postMessage({ type: 'png', name, bytes });
      await waitForUI('ack', 20000);
      n++;
    } catch (e) { warn('export ' + name + ': ' + e.message); }
  }
  REPORT.exported = (REPORT.exported || 0) + n;
}
async function sendReport() {
  try {
    figma.ui.postMessage({ type: 'report', report: REPORT });
    await waitForUI('ack', 8000);
  } catch (e) { /* UI not open */ }
}
// ============================================================================
// The App Icon page (its own design file, "RoboCore IDE — App Icon"): the refreshed
// RoboCore IDE app icon — concepts, master + construction, appearances, small sizes,
// every platform's rules and mock-ups, and real-size export frames named after the
// files in the robocore-ide repo. Geometry comes from app-icon/geom.js (IG) and
// app-icon/concepts.js (CONCEPTS), which build.sh puts in front of src/.
// ============================================================================

let AI_PAGE_NAME = 'Round 2 · Forward Gear'; // set per version by aiUseVersion()
const AI = { comps: {}, small: {}, glyph: null, glyphSmall: null };

// ---------- paints and effects ----------
function aiRgba(hex, a) { const c = hexToRgb(hex); return { r: c.r, g: c.g, b: c.b, a: a === undefined ? 1 : a }; }
// linear gradient from p0 to p1 in the node's unit box; stops: [[position, hex, alpha?], ...]
function aiLin(stops, p0, p1) {
  p0 = p0 || [0.5, 0]; p1 = p1 || [0.5, 1];
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l2 = dx * dx + dy * dy;
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[dx / l2, dy / l2, -(p0[0] * dx + p0[1] * dy) / l2], [-dy / l2, dx / l2, (p0[0] * dy - p0[1] * dx) / l2 + 0.5]],
    gradientStops: stops.map(([pos, hex, a]) => ({ position: pos, color: aiRgba(hex, a) })),
  };
}
function aiDrop(hex, a, y, blur) { return { type: 'DROP_SHADOW', color: aiRgba(hex, a), offset: { x: 0, y }, radius: blur, spread: 0, visible: true, blendMode: 'NORMAL' }; }
function aiInner(hex, a, y, blur) { return { type: 'INNER_SHADOW', color: aiRgba(hex, a), offset: { x: 0, y }, radius: blur, spread: 0, visible: true, blendMode: 'NORMAL' }; }

// ---------- looks (appearances) and plate shapes ----------
const NAVY_GRAD = [[0, '#2D446B'], [1, '#14203A']];
const AI_LOOKS_FORWARD = {
  Default: {
    plate: [[0, '#FFD45A'], [0.5, '#F2B01E'], [1, '#DA920B']], ink: NAVY_GRAD, accent: NAVY_GRAD,
    face: [[0, '#FFFCF2'], [1, '#F0E3C2']], accent2: NAVY_GRAD, shadow: ['#6B3F00', 0.36], rim: 0.5,
    facet: [[0, '#2D446B'], [0.5, '#1C2C49'], [0.5, '#0D1626'], [1, '#0A111E']], accentShade: [[0, '#1C2C49'], [1, '#0B1322']],
    spec: 'Plate #FFD45A → #F2B01E → #DA920B · gear #2D446B → #1C2C49, shade #0D1626 → #0A111E',
  },
  Dark: {
    plate: [[0, '#324C74'], [0.5, '#1B2A41'], [1, '#0E1828']], ink: [[0, '#FFFDF7'], [1, '#EBE1C8']], accent: [[0, '#FFD45A'], [1, '#E5A015']],
    face: [[0, '#FFD45A'], [1, '#E5A015']], accent2: [[0, '#1F3050'], [1, '#111C2D']], shadow: ['#02060C', 0.5], rim: 0.22,
    facet: [[0, '#FFD45A'], [0.5, '#F2B01E'], [0.5, '#C98A0B'], [1, '#B57A06']], accentShade: [[0, '#E9A417'], [1, '#C68709']],
    spec: 'Plate #324C74 → #1B2A41 → #0E1828 · gear #FFD45A → #F2B01E, shade #C98A0B → #B57A06',
  },
  Tinted: {
    plate: [[0, '#3C3C40'], [1, '#121214']], ink: [[0, '#FFFFFF'], [1, '#CFCFD3']], accent: [[0, '#FFFFFF'], [1, '#CFCFD3']],
    face: [[0, '#FFFFFF'], [1, '#CFCFD3']], accent2: [[0, '#3C3C40'], [1, '#121214']], shadow: ['#000000', 0.45], rim: 0.18,
    facet: [[0, '#FFFFFF'], [0.5, '#E4E4E8'], [0.5, '#AEAEB4'], [1, '#9C9CA2']], accentShade: [[0, '#BDBDC2'], [1, '#9C9CA2']],
    spec: 'Greyscale: plate #3C3C40 → #121214 · gear #FFFFFF → #E4E4E8, shade #AEAEB4 → #9C9CA2',
  },
  Clear: {
    glass: true, ink: [[0, '#FFFFFF', 0.96], [1, '#FFFFFF', 0.8]], accent: [[0, '#FFFFFF', 0.96], [1, '#FFFFFF', 0.8]],
    face: [[0, '#FFFFFF', 0.5], [1, '#FFFFFF', 0.35]], accent2: [[0, '#FFFFFF', 0.95], [1, '#FFFFFF', 0.85]], shadow: ['#000000', 0.2], rim: 0.7,
    facet: [[0, '#FFFFFF', 0.96], [0.5, '#FFFFFF', 0.9], [0.5, '#FFFFFF', 0.62], [1, '#FFFFFF', 0.55]], accentShade: [[0, '#FFFFFF', 0.7], [1, '#FFFFFF', 0.55]],
    spec: 'Glass: white 30 % → 10 % plate, 30 px background blur, white glyph',
  },
};
let AI_HERO = 'slant'; // the master glyph (concepts.js), set per version
const AI_ROLE = { 'Planet': 'ink', 'Gear ring': 'ink', 'Planet gear': 'ink', 'Orbit ring': 'ink', 'Spark': 'ink', 'Moon': 'ink', 'Gear': 'facet', 'Gear (flat)': 'accent', 'Gear half (lit)': 'accent', 'Gear half (shade)': 'accentShade',
  'Bracket left': 'ink', 'Bracket right': 'ink', 'Core gear': 'accent', 'Open cog': 'ink', 'Caret': 'accent', 'Head': 'ink', 'Face': 'face', 'Prompt': 'accent2' };
// gradient direction per role (default: top → bottom). The facet is a hard light split along a "/" line.
const AI_DIR = { facet: [[0.15, 0], [0.85, 1]] };
const AI_SHAPES = {
  macOS: { plate: [100, 100, 824, 824], r: 185.4, s: 0.6, drop: true },
  Square: { plate: [0, 0, 1024, 1024], r: 0, s: 0, safe: 450 },
  Rounded: { plate: [0, 0, 1024, 1024], r: 229, s: 0.6, safe: 450 },
  // full bleed like Square, with the glyph kept inside the 80 % safe circle of maskable PWA icons
  Maskable: { plate: [0, 0, 1024, 1024], r: 0, s: 0, safe: 0.8 * 512 },
};

// Round 3 looks: one ink, flat (no gradients, sheen or glyph shadows), like the box print
const flatStops = (h, a) => [[0, h, a], [1, h, a]];
const monoLook = (plate, ink, back, spec) => ({ plate: flatStops(plate), ink: flatStops(ink), accent: flatStops(ink), facet: flatStops(ink), accentShade: flatStops(ink), face: flatStops(back || plate), accent2: flatStops(plate), shadow: ['#000000', 0], rim: 0, spec });
const AI_LOOKS_MONO = {
  Default: monoLook('#F2B01E', '#1B2A41', null, 'One ink: navy #1B2A41 on RoboCore yellow #F2B01E, the box print'),
  Dark: monoLook('#1B2A41', '#F2B01E', null, 'Inverted: yellow #F2B01E on navy #1B2A41'),
  Tinted: monoLook('#1C1C1E', '#FFFFFF', null, 'White on near-black #1C1C1E; the system tints it'),
  Clear: Object.assign(monoLook('#FFFFFF', '#FFFFFF', null, 'Glass plate, white glyph'), { glass: true, ink: flatStops('#FFFFFF', 0.94), accent: flatStops('#FFFFFF', 0.94), shadow: ['#000000', 0.15], rim: 0.7 }),
};
// each menu command builds one round on its own page
const AI_VERSIONS = {
  icon: { key: 'forward', page: 'Round 2 · Forward Gear', hero: 'slant', looks: AI_LOOKS_FORWARD, flat: false, extent: 306, fg: 0.86 },
  orbit: { key: 'orbit', page: 'Round 3 · Geared Ring', hero: 'gearring', looks: AI_LOOKS_MONO, flat: true, extent: 404, fg: 0.7, scale: 0.94 },
};
const AI_LEGACY_PAGES = ['App Icon']; // the first build's page name; becomes the Round 2 page
let AI_V = AI_VERSIONS.icon, AI_LOOKS = AI_LOOKS_FORWARD, AI_FLAT = false;
function aiUseVersion(cmd) {
  AI_V = AI_VERSIONS[cmd] || AI_VERSIONS.icon;
  AI_PAGE_NAME = AI_V.page; AI_HERO = AI_V.hero; AI_LOOKS = AI_V.looks; AI_FLAT = AI_V.flat;
}
// run fn with another round's looks (for "other rounds" thumbnails), then switch back
function aiWithVersion(cmd, fn) {
  const keep = AI_V;
  aiUseVersion(cmd);
  try { return fn(); } finally { aiUseVersion(Object.keys(AI_VERSIONS).find(k => AI_VERSIONS[k] === keep)); }
}

// ---------- vectors, glyphs, icons ----------
// vector from absolute path data in a 1024 space, appended to parent at the same coordinates
function aiVec(d, name, parent, fills) {
  const wrap = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path d="' + d + '" fill="#000000" fill-rule="evenodd"/></svg>');
  const v = wrap.findOne(n => n.type === 'VECTOR');
  const x = v.absoluteTransform[0][2] - wrap.absoluteTransform[0][2], y = v.absoluteTransform[1][2] - wrap.absoluteTransform[1][2];
  parent.appendChild(v); v.x = x; v.y = y;
  wrap.remove();
  v.name = name; v.fills = fills; v.strokes = [];
  return v;
}
function aiPaint(node, look, mono) {
  const L = AI_LOOKS[look];
  for (const v of node.findAll(n => n.type === 'VECTOR')) {
    if (mono) { v.fills = [solid(mono)]; continue; }
    const role = AI_ROLE[v.name];
    if (role && L[role]) v.fills = [aiLin(L[role], ...(AI_DIR[role] || []))];
  }
}
// glyph layers → a 1024 frame (or component) of vectors in a look
function aiGlyphNode(layers, look, asComponent, name) {
  const g = asComponent ? figma.createComponent() : figma.createFrame();
  g.name = name || 'Glyph'; g.resize(1024, 1024); g.fills = []; g.clipsContent = false;
  for (const l of layers) aiVec(l.d, l.name, g, [aiLin(AI_LOOKS[look][l.role], ...(AI_DIR[l.role] || []))]);
  return g;
}
function aiGlyphShadow(look, k) {
  const L = AI_LOOKS[look];
  return [aiDrop(L.shadow[0], L.shadow[1], 14 * k, 28 * k), aiDrop(L.shadow[0], L.shadow[1] * 0.5, 3 * k, 4 * k)];
}
// one icon on a 1024 canvas: plate (shape) + sheen + glyph (look).
// o = { name, look, shape, glyph: () => 1024 node, fit: 'master' (drawn for the 824 plate) | 'small' (drawn for a full canvas), component, noGlyph, tone }
function aiIcon(o) {
  const S = AI_SHAPES[o.shape], L = AI_LOOKS[o.look];
  const f = o.component ? figma.createComponent() : figma.createFrame();
  f.name = o.name || (o.look + ' · ' + o.shape); f.resize(1024, 1024); f.fills = []; f.clipsContent = false;
  const [px, py, pw, ph] = S.plate;
  const plate = figma.createFrame(); plate.name = 'Plate'; f.appendChild(plate);
  plate.resize(pw, ph); plate.x = px; plate.y = py; plate.clipsContent = true;
  plate.cornerRadius = S.r; if (S.s) plate.cornerSmoothing = S.s;
  const eff = [];
  if (S.drop) eff.push(aiDrop('#000000', L.glass ? 0.12 : 0.28, 10, 20));
  if (L.glass) plate.fills = [aiLin([[0, '#FFFFFF', 0.3], [1, '#FFFFFF', 0.1]])];
  else plate.fills = [aiLin(o.tone || L.plate, [0.3, 0], [0.7, 1])];
  if (!AI_FLAT || L.glass) eff.push(aiInner('#FFFFFF', L.rim, 4, 6), aiInner('#000000', L.glass ? 0.04 : 0.12, -6, 12));
  if (L.glass) eff.push({ type: 'BACKGROUND_BLUR', radius: 30, visible: true });
  plate.effects = eff;
  if (!L.glass && !AI_FLAT) {
    const sheen = figma.createRectangle(); sheen.name = 'Sheen'; plate.appendChild(sheen);
    sheen.resize(pw, ph); sheen.x = 0; sheen.y = 0;
    sheen.fills = [aiLin([[0, '#FFFFFF', 0.28], [0.36, '#FFFFFF', 0], [0.72, '#000000', 0], [1, '#000000', 0.1]])];
  }
  if (o.noGlyph) return f;
  const g = o.glyph(); plate.appendChild(g); g.name = 'Glyph';
  let k = (pw / (o.fit === 'small' ? 1024 : 824)) * (o.scale || (o.fit === 'small' ? 1 : (AI_V.scale || 1)));
  if (S.safe && o.fit !== 'small') k = Math.min(k, S.safe / AI_V.extent); // keep the glyph's farthest point inside the shape's safe radius
  if (Math.abs(k - 1) > 1e-6) g.rescale(k);
  g.x = pw / 2 - 512 * k; g.y = ph / 2 - 512 * k;
  aiPaint(g, o.look);
  g.effects = AI_FLAT ? [] : aiGlyphShadow(o.look, k);
  return f;
}
// instance of the App icon component set, scaled to `size` px (≤ 32 px → small glyph where it exists)
function aiUse(look, shape, size, o = {}) {
  const small = o.small !== undefined ? o.small : (size <= 32 && shape !== 'Square');
  const c = (small ? AI.small : AI.comps)[look + '|' + shape] || AI.comps[look + '|' + shape];
  const i = c.createInstance();
  if (size !== 1024) i.rescale(size / 1024);
  i.name = o.name || ('App icon ' + look + ' · ' + shape + ' · ' + size);
  if (o.parent) o.parent.appendChild(i);
  return i;
}
// glyph scale on a full-bleed 1024 canvas, matching Shape=Square
function aiSquareFit() { return Math.min((1024 / 824) * (AI_V.scale || 1), AI_SHAPES.Square.safe / AI_V.extent); }
// glyph without a plate on a transparent 1024 canvas (iOS dark, Android layers)
function aiGlyphOnly(look, scale, mono, name) {
  const f = figma.createFrame(); f.name = name || 'Glyph only'; f.resize(1024, 1024); f.fills = []; f.clipsContent = false;
  const g = AI.glyph.createInstance(); f.appendChild(g);
  if (scale !== 1) g.rescale(scale);
  g.x = 512 - 512 * scale; g.y = 512 - 512 * scale;
  aiPaint(g, look, mono);
  if (!mono && !AI_FLAT) g.effects = aiGlyphShadow(look, scale);
  return f;
}
// a plain neutral app tile for mock-ups (never another product's icon)
const AI_TONES = [[[0, '#B9C2CF'], [1, '#8893A4']], [[0, '#8C9AB0'], [1, '#5D6B82']], [[0, '#D3D7DD'], [1, '#A9B0BA']], [[0, '#7E8796'], [1, '#535B68']]];
function aiBlank(shape, size, i) {
  const b = aiIcon({ shape, look: 'Default', noGlyph: true, tone: AI_TONES[i % AI_TONES.length], name: 'Other app (placeholder)' });
  const dot = figma.createEllipse(); dot.name = 'Mark'; b.children[0].appendChild(dot);
  const pw = b.children[0].width; dot.resize(pw * 0.34, pw * 0.34); dot.x = pw * 0.33; dot.y = pw * 0.33; dot.fills = [solid('#FFFFFF', 0.55)];
  b.rescale(size / 1024);
  return b;
}
function aiScaled(node, size) { node.rescale(size / node.width); return node; }

// ---------- documentation helpers ----------
function aiFigure(parent, node, caption, sub) {
  const fig = box({ name: 'Figure — ' + caption, dir: 'V', gap: 8, cross: 'center', parent });
  fig.appendChild(node);
  txt(caption, { style: 'Label/Small', parent: fig, name: 'Caption', align: 'CENTER' });
  if (sub) txt(sub, { style: 'Caption/Default', color: 'color/text/tertiary', parent: fig, name: 'Sub', align: 'CENTER' });
  return fig;
}
function aiRow(parent, name, gap, cross) { return box({ name, dir: 'H', gap: gap === undefined ? 24 : gap, cross: cross || 'end', parent }); }
function aiBullets(parent, items, w) {
  const col = box({ name: 'Notes', dir: 'V', gap: 6, parent, w, wSize: w ? 'fixed' : 'fill' });
  for (const it of items) txt('•  ' + it, { style: 'Body/Small', color: 'color/text/secondary', parent: col, name: it.slice(0, 40), fill: true });
  return col;
}
function aiTile(parent, name, w, h, fills, radius) {
  const t = box({ name, dir: 'H', align: 'center', cross: 'center', w, h, radius: radius === undefined ? 12 : radius, parent });
  t.fills = fills;
  return t;
}
function aiChip(parent, label, dark) {
  const c = box({ name: 'Chip ' + label, dir: 'H', pad: [4, 10, 4, 10], cross: 'center', radius: 999, fill: dark ? 'color/ink/default' : 'color/brand/default', parent });
  txt(label, { style: 'Caption/Overline', color: dark ? 'color/text/on-ink' : 'color/text/on-bright', parent: c, name: 'Label' });
  return c;
}
function aiCard(parent, title, o = {}) {
  const c = box({ name: title, dir: 'V', gap: o.gap || 16, pad: 28, parent, fill: 'color/bg/raised', radius: 12, stroke: 'color/border/default', w: o.w, wSize: o.w ? 'fixed' : 'fill', grow: o.grow });
  const h = box({ name: 'Card header', dir: 'H', gap: 10, cross: 'center', parent: c, wSize: 'fill' });
  txt(title, { style: 'Heading/H2', parent: h, name: 'Title' });
  if (o.chip) aiChip(h, o.chip);
  if (o.sub) txt(o.sub, { style: 'Caption/Default', color: 'color/text/tertiary', parent: c, name: 'Sub', fill: true });
  return c;
}

// ---------- components ----------
function aiBuildComponents(page) {
  const B = CONCEPTS[AI_HERO];
  const holder = box({ name: 'App icon — components', dir: 'V', gap: 48, pad: 64, fill: 'color/bg/app', radius: 24, parent: page });
  docHeader(holder, 'COMPONENTS', 'App icon components', 'Edit the shape in the two Glyph components; every variant, mock-up and export frame on this page uses instances, so they update together. Colours per appearance are instance overrides.', 1400);
  const gl = aiRow(holder, 'Glyphs', 64, 'start');
  AI.glyph = aiGlyphNode(B.glyph(), 'Default', true, 'App icon/Glyph');
  AI.glyph.description = 'Forward Gear on a 1024 canvas, drawn for the 824 px macOS plate: 8 teeth leaning 7° forward, a > prompt cut through the hub, hard-stop facet fill.';
  gl.appendChild(AI.glyph);
  AI.glyphSmall = aiGlyphNode(B.glyph(B.small), 'Default', true, 'App icon/Glyph · Small');
  AI.glyphSmall.description = 'Small-size glyph for 16–32 px on a full-canvas plate: 6 bigger teeth, a heavier > and a flat fill (no facet).';
  gl.appendChild(AI.glyphSmall);

  const comps = [];
  for (const look of ['Default', 'Dark', 'Tinted', 'Clear']) for (const shape of ['macOS', 'Square', 'Rounded']) {
    const c = aiIcon({ component: true, name: 'Appearance=' + look + ', Shape=' + shape, look, shape, glyph: () => AI.glyph.createInstance(), fit: 'master' });
    comps.push(c); AI.comps[look + '|' + shape] = c;
  }
  const mc = aiIcon({ component: true, name: 'Appearance=Default, Shape=Maskable', look: 'Default', shape: 'Maskable', glyph: () => AI.glyph.createInstance(), fit: 'master' });
  comps.push(mc); AI.comps['Default|Maskable'] = mc;
  const set = figma.combineAsVariants(comps, holder);
  set.name = 'App icon';
  set.description = 'RoboCore IDE app icon. Shape: macOS = 1024 canvas with the 824 squircle plate + shadow; Square = full bleed, opaque (iOS, Android legacy background, Play Store, maskable PWA); Rounded = full-canvas squircle (Windows, Linux, web); Maskable = full bleed with the glyph inside the 80 % safe circle (PWA maskable).';
  aiGridVariants(set, 3, 96);
  const smalls = [];
  for (const look of ['Default', 'Dark']) for (const shape of ['macOS', 'Rounded']) {
    const c = aiIcon({ component: true, name: 'Appearance=' + look + ', Shape=' + shape, look, shape, glyph: () => AI.glyphSmall.createInstance(), fit: 'small' });
    smalls.push(c); AI.small[look + '|' + shape] = c;
  }
  const sset = figma.combineAsVariants(smalls, holder);
  sset.name = 'App icon · Small';
  sset.description = 'For 16, 24 and 32 px exports: same plates, the small glyph.';
  aiGridVariants(sset, 2, 96);
  return holder;
}
function aiGridVariants(set, cols, gap) {
  set.children.forEach((c, i) => { c.x = gap + (i % cols) * (1024 + gap); c.y = gap + Math.floor(i / cols) * (1024 + gap); });
  const rows = Math.ceil(set.children.length / cols);
  set.resize(gap + cols * (1024 + gap), gap + rows * (1024 + gap));
  set.fills = [solid('#E9E2D2')];
}

// ---------- page sections ----------
function aiHeader(root) {
  const s = box({ name: 'Header', dir: 'H', gap: 64, pad: 48, cross: 'center', parent: root, wSize: 'fill', fill: 'color/bg/brand', radius: 16 });
  const col = box({ name: 'Intro', dir: 'V', gap: 14, parent: s, w: 1080 });
  txt('APP ICON · OCTOBER 2026', { style: 'Caption/Overline', color: 'color/text/primary', parent: col });
  txt('RoboCore IDE app icon — refresh', { style: 'Heading/Display', parent: col, name: 'Title' });
  txt('The RoboCore gear, made sharper and more defiant. The teeth lean forward like they are already turning, a hard diagonal of light splits the gear like a slash, and a > prompt is cut straight through the hub, so the gear says "code" and reads as a tool rather than a settings icon. One master, four appearances and a tuned small glyph cover every platform the IDE ships on: web, macOS, Windows, Linux, Android and iOS.', { style: 'Body/Default', parent: col, w: 1080 });
  const pr = box({ name: 'Principles', dir: 'H', gap: 12, parent: col, wrap: true, w: 1080 });
  for (const [t, d] of [['Still the gear', 'The RoboCore mark, nothing added around it'], ['Attitude', 'Teeth lean 7° forward; a hard / of light'], ['Code inside', 'A > prompt cut through the hub'], ['Tuned per size', 'Flat 6-tooth glyph for 16–32 px']]) {
    const c = box({ name: 'Principle ' + t, dir: 'V', gap: 2, pad: [10, 14, 10, 14], radius: 10, fill: '#FFFFFF', fillOpacity: 0.55, parent: pr, w: 258 });
    txt(t, { style: 'Label/Strong', parent: c }); txt(d, { style: 'Caption/Default', color: 'color/text/secondary', parent: c, fill: true });
  }
  const ba = box({ name: 'Before → after', dir: 'H', gap: 28, pad: [28, 36, 24, 36], cross: 'center', parent: s, fill: 'color/bg/app', radius: 20 });
  const before = figma.createRectangle(); before.name = 'Current icon (Icon-512.png)'; before.resize(200, 200);
  before.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(AI_BEFORE_PNG)).hash, scaleMode: 'FIT' }];
  aiFigure(ba, before, 'Before', 'flat gear');
  txt('→', { style: 'Code/Default', parent: ba, name: 'Arrow', noStyle: true }).fontSize = 40;
  aiFigure(ba, aiUse('Default', 'macOS', 300), 'After · Default', 'Forward Gear');
  aiFigure(ba, aiUse('Dark', 'macOS', 300), 'After · Dark', 'dark appearance');
}

function aiConcepts(root) {
  const s = docSection(root, 'Concepts', 'Round 2, after the feedback "keep the gear, make it better and more defiant". Three gear directions in the box palette, each in the Default and Dark looks, then at 64, 32 and 16 px. Forward Gear is developed below.');
  const row = box({ name: 'Concept cards', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const before = aiCard(row, 'Current icon', { w: 380, sub: 'Shipped in robocore-ide today (web/icons/Icon-512.png).' });
  const img = figma.createRectangle(); img.name = 'Current icon'; img.resize(200, 200);
  img.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(AI_BEFORE_PNG)).hash, scaleMode: 'FIT' }];
  before.appendChild(img);
  aiBullets(before, ['The right idea: the gear is the RoboCore mark.', 'But a plain, upright gear is also the Settings icon on iOS, macOS and Android, so it looks polite and generic.', 'Flat, with no depth, and nothing in it says "code".'], 324);
  const mkFor = (key) => (look, size, small) => key === AI_HERO
    ? aiUse(look, 'macOS', size, { small: !!small })
    : aiScaled(aiIcon({ look, shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS[key].glyph(small ? CONCEPTS[key].small : undefined), look, false), fit: small ? 'small' : 'master', name: CONCEPTS[key].title + ' · ' + look }), size);
  const concept = (parent, key, chip, pros) => {
    const C = CONCEPTS[key], mk = mkFor(key);
    const card = aiCard(parent, C.title, { grow: true, chip, sub: C.note });
    const big = aiRow(card, 'Looks', 16, 'center');
    big.appendChild(mk('Default', 200)); big.appendChild(mk('Dark', 200));
    const sm = aiRow(card, 'Small sizes', 16, 'end');
    for (const z of [64, 32, 16]) aiFigure(sm, mk('Default', z, z <= 32), z + ' px');
    aiBullets(card, pros);
  };
  concept(row, AI_HERO, 'RECOMMENDED', ['Still the RoboCore gear, so the brand carries over from the current icon and the wordmark.', 'Teeth leaning forward and the hard diagonal light give it attitude and motion.', 'The > prompt in the hub says "code", and points forward: Run.', 'At 16–32 px a flat 6-tooth version keeps the > readable.']);
  concept(row, 'split', null, ['The most rebellious: the gear sliced by code\'s own slash and knocked out of line.', 'The cut and offset blur at 16–32 px, and a broken gear can also read as "broken".']);
  concept(row, 'run', null, ['The calmest and clearest: a chunky gear with a Run arrow.', 'Less attitude, and the arrow reads as media "play" as much as "run code".']);

  const row2 = box({ name: 'Inspiration and round 1', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const mood = aiCard(row2, 'What we took from the references', { w: 760, sub: 'Pinterest search "icon logos ideas" (the first screen of results; scrolling needs a sign-in).' });
  aiBullets(mood, ['Heavy single-colour marks with hard contrast: one solid gear on a strong plate.', 'Sharp points and hard corners: small tip radii, teeth that lean.', 'A diagonal slash through a shape: the hard / of light across the gear.', 'Negative-space cut-outs (an arrow or letter inside the mark): the > prompt in the hub.', 'A forward lean that suggests motion: 7° clockwise lean, like a ratchet that only turns forward.']);
  const r1 = aiCard(row2, 'Round 1 (earlier)', { grow: true, sub: 'Feedback on these: keep the gear, make it better and more defiant.' });
  const r1row = aiRow(r1, 'Round 1 icons', 24, 'end');
  for (const key of ['brackets', 'opencog', 'bot']) aiFigure(r1row, mkFor(key)('Default', 140), CONCEPTS[key].title);
  const r1x = aiRow(r1, 'Also tried', 24, 'end');
  for (const key of ['ratchet', 'burst']) aiFigure(r1x, mkFor(key)('Default', 110), CONCEPTS[key].title, key === 'ratchet' ? 'read as a saw blade' : 'read as a sun');
}

function aiMaster(root) {
  const B = CONCEPTS[AI_HERO].defaults;
  const s = docSection(root, 'Master and construction', 'Drawn on Apple\'s 1024 macOS grid. The gear\'s tip circle is 612 px (74 % of the plate), so the same glyph fits the Android 66 dp safe circle and the 80 % maskable-PWA circle without redrawing.');
  const row = box({ name: 'Master row', dir: 'H', gap: 48, parent: s, wSize: 'fill' });
  const holder = figma.createFrame(); holder.name = 'Master + keylines'; holder.resize(1024, 1024); holder.fills = []; holder.clipsContent = false;
  const icon = AI.comps['Default|macOS'].createInstance(); holder.appendChild(icon); icon.x = 0; icon.y = 0;
  const G = figma.createFrame(); G.name = 'Keylines'; holder.appendChild(G); G.resize(1024, 1024); G.fills = []; G.clipsContent = false;
  const line = '#2F6BBF';
  const st = (n, dash) => { n.fills = []; n.strokes = [solid(line, 0.9)]; n.strokeWeight = 2.5; n.strokeAlign = 'CENTER'; if (dash) n.dashPattern = [12, 10]; };
  const r0 = figma.createRectangle(); G.appendChild(r0); r0.name = 'Canvas 1024'; r0.resize(1024, 1024); st(r0, true);
  const r1 = figma.createRectangle(); G.appendChild(r1); r1.name = 'Plate 824, r 185.4, smoothing 60 %'; r1.x = 100; r1.y = 100; r1.resize(824, 824); r1.cornerRadius = 185.4; r1.cornerSmoothing = 0.6; st(r1);
  const circ = (r, name, dash) => { const e = figma.createEllipse(); G.appendChild(e); e.name = name; e.resize(2 * r, 2 * r); e.x = 512 - r; e.y = 512 - r; st(e, dash); };
  circ(B.rTip, 'Gear tip circle Ø ' + 2 * B.rTip, true); circ(B.rRoot, 'Gear root circle Ø ' + 2 * B.rRoot, false);
  for (const [n, x, y, w, h] of [['Centre vertical', 511, 60, 2, 904], ['Centre horizontal', 60, 511, 904, 2]]) {
    const r = figma.createRectangle(); G.appendChild(r); r.name = n; r.x = x; r.y = y; r.resize(w, h); r.fills = [solid(line, 0.55)];
  }
  // the facet's hard edge: perpendicular to the gradient axis (0.70, 1) through the centre
  const ux = 1 / Math.hypot(1, 0.7), uy = -0.7 / Math.hypot(1, 0.7);
  const fl = figma.createLine(); G.appendChild(fl); fl.name = 'Facet line'; fl.resize(800, 0);
  fl.x = 512 - 400 * ux; fl.y = 512 - 400 * uy; fl.rotation = Math.atan2(-uy, ux) * 180 / Math.PI;
  fl.strokes = [solid(line, 0.9)]; fl.strokeWeight = 2.5; fl.dashPattern = [4, 8];
  const [ch, cd, ct] = B.chev;
  const cb = figma.createRectangle(); G.appendChild(cb); cb.name = 'Prompt box'; cb.resize(cd + ct, 2 * ch); cb.x = 512 + 10 - (cd + ct) / 2; cb.y = 512 - ch; st(cb, true);
  holder.rescale(720 / 1024);
  row.appendChild(holder);
  const spec = box({ name: 'Spec', dir: 'V', gap: 18, parent: row, grow: true });
  const block = (title, lines) => { const b = box({ name: title, dir: 'V', gap: 6, parent: spec, wSize: 'fill' }); txt(title, { style: 'Heading/H3', parent: b }); for (const l of lines) txt(l, { style: 'Code/Small', color: 'color/text/secondary', parent: b, fill: true, name: l.slice(0, 40) }); return b; };
  block('Layers (top to bottom)', [
    'Glyph       instance of App icon/Glyph · shadow #6B3F00 36 % y14 b28 + 18 % y3 b4',
    '  Gear      ' + B.n + ' teeth, tip Ø ' + 2 * B.rTip + ', root Ø ' + 2 * B.rRoot + ', tooth ' + B.wRoot + ' → ' + B.wTip + ' wide, tips lean ' + B.skew + '° clockwise',
    '            corners: ' + B.tipR + ' at the tips, ' + B.rootR + ' at the roots (hard, not soft)',
    '            hub: > prompt cut out, ' + 2 * ch + ' tall, depth ' + cd + ', stroke ' + ct,
    '            fill: hard-stop gradient along a / line: lit above, deep shade below',
    'Sheen       white 28 % → 0 (top 36 %), black 0 → 10 % (bottom)',
    'Plate       squircle 824 × 824, radius 185.4, corner smoothing 60 %',
    '            rim light: inner shadow white 50 % y4 b6, black 12 % y−6 b12',
    '            macOS only: drop shadow black 28 % y10 b20 (inside the canvas)',
  ]);
  block('Colours', [AI_LOOKS.Default.spec, AI_LOOKS.Dark.spec, AI_LOOKS.Tinted.spec, 'All from the box palette: navy #1B2A41, yellow #F2B01E, cream #F7F1E3.']);
  block('Keylines (blue)', ['dashed square   1024 canvas', 'solid squircle  824 plate (100 px margin)', 'dashed circle   gear tip circle Ø ' + 2 * B.rTip + ' (74 % of the plate)', 'solid circle    gear root circle Ø ' + 2 * B.rRoot, 'dotted line     the facet\'s hard edge', 'dashed box      the > prompt', 'lines           centre axes']);
  const sw = box({ name: 'Swatches', dir: 'H', gap: 12, parent: spec, wSize: 'fill' });
  for (const look of ['Default', 'Dark', 'Tinted']) {
    const L = AI_LOOKS[look];
    const c = box({ name: 'Swatch ' + look, dir: 'V', gap: 6, parent: sw, w: 200 });
    aiTile(c, 'Plate gradient', 200, 56, [aiLin(L.plate, [0, 0.5], [1, 0.5])], 8);
    aiTile(c, 'Gear facet', 200, 28, [aiLin(L.facet, [0, 0.5], [1, 0.5])], 6);
    txt(look, { style: 'Label/Small', parent: c });
  }
}

// ---------- Round 3 (Orbit Gear) sections ----------
const AI_ORBIT_VARIANTS = [
  ['Geared Ring', {}, {}, 'RECOMMENDED', 'A smooth planet whose ring is the RoboCore gear, seen edge-on.', ['The cleanest: one ink, one planet, one ring, like the marks on the reference sheet.', 'The gear is still the hero: 12 teeth all the way round the ring.', 'The ring passes in front with a clean gap and hides behind the planet, so it reads in one colour without outlines.']],
  ['Geared Ring · Prompt', { face: 'prompt' }, { face: 'prompt' }, null, 'A > prompt cut into the planet says "code".', ['Says IDE most directly.', 'A second cut-out makes it busier, and the > is gone below 32 px.']],
  ['Geared Ring · Bot', { face: 'eyes' }, { face: 'eyes' }, null, 'Two eyes turn the planet into a friendly robot.', ['Most fun for young learners.', 'Less like a tool, and the eyes disappear at small sizes.']],
  ['Geared Ring · Moon', { moon: [300, -292, 40] }, { moon: [360, -360, 54] }, null, 'A small moon in orbit, like the reference marks.', ['Adds a sense of motion and scale.', 'One more element; at 16 px it reads as a speck.']],
];
function aiOrbitIcon(opts, smallOpts, look, size, small) {
  const C = CONCEPTS[AI_HERO];
  if (!small && !Object.keys(opts).length) return aiUse(look, 'macOS', size, { small: false });
  if (small && !Object.keys(smallOpts).length) return aiUse(look, 'macOS', size, { small: true });
  const o = small ? Object.assign({}, C.small, smallOpts) : opts;
  return aiScaled(aiIcon({ look, shape: 'macOS', glyph: () => aiGlyphNode(C.glyph(o), look, false), fit: small ? 'small' : 'master', name: C.title + ' · ' + look }), size);
}
function aiHeaderOrbit(root) {
  const s = box({ name: 'Header', dir: 'H', gap: 64, pad: 48, cross: 'center', parent: root, wSize: 'fill', fill: 'color/bg/brand', radius: 16 });
  const col = box({ name: 'Intro', dir: 'V', gap: 14, parent: s, w: 1080 });
  txt('APP ICON · ROUND 3 · ONE INK', { style: 'Caption/Overline', color: 'color/text/primary', parent: col });
  txt('Geared Ring — one ink', { style: 'Heading/Display', parent: col, name: 'Title' });
  txt('A clean, one-ink planet mark from the reference sheet, where the planet\'s ring is the RoboCore gear seen edge-on. The ring passes in front of the planet with a cut gap and disappears behind it, so the mark needs no outlines. It is navy on RoboCore yellow, the box\'s own single ink, with no gradients or shadows. Round 2 (Forward Gear) is on its own page.', { style: 'Body/Default', parent: col, w: 1080 });
  const pr = box({ name: 'Principles', dir: 'H', gap: 12, parent: col, wrap: true, w: 1080 });
  for (const [t, d] of [['One ink', 'Navy on yellow, or yellow on navy'], ['Planet + gear', 'The ring is the RoboCore gear'], ['Negative space', 'A 22 px gap where the ring crosses'], ['Tuned per size', '10 bigger teeth for 16–32 px']]) {
    const c = box({ name: 'Principle ' + t, dir: 'V', gap: 2, pad: [10, 14, 10, 14], radius: 10, fill: '#FFFFFF', fillOpacity: 0.55, parent: pr, w: 258 });
    txt(t, { style: 'Label/Strong', parent: c }); txt(d, { style: 'Caption/Default', color: 'color/text/secondary', parent: c, fill: true });
  }
  const ba = box({ name: 'Before → after', dir: 'H', gap: 28, pad: [28, 36, 24, 36], cross: 'center', parent: s, fill: 'color/bg/app', radius: 20 });
  const before = figma.createRectangle(); before.name = 'Current icon (Icon-512.png)'; before.resize(200, 200);
  before.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(AI_BEFORE_PNG)).hash, scaleMode: 'FIT' }];
  aiFigure(ba, before, 'Before', 'flat gear');
  txt('→', { style: 'Code/Default', parent: ba, name: 'Arrow', noStyle: true }).fontSize = 40;
  aiFigure(ba, aiUse('Default', 'macOS', 300), 'After · Default', 'Geared Ring');
  aiFigure(ba, aiUse('Dark', 'macOS', 300), 'After · Dark', 'inverted ink');
}
function aiConceptsOrbit(root) {
  const s = docSection(root, 'Concepts', 'Round 3, picked from four sketches: the planet\'s ring is the gear. Four takes, all in one ink. Each is shown navy on yellow and inverted, then at 64, 32 and 16 px. Geared Ring is developed below.');
  const row = box({ name: 'Concept cards', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  for (const [title, opts, smallOpts, chip, note, pros] of AI_ORBIT_VARIANTS) {
    const card = aiCard(row, title, { grow: true, chip, sub: note });
    const big = aiRow(card, 'Looks', 16, 'center');
    big.appendChild(aiOrbitIcon(opts, smallOpts, 'Default', 200, false)); big.appendChild(aiOrbitIcon(opts, smallOpts, 'Dark', 200, false));
    const sm = aiRow(card, 'Small sizes', 16, 'end');
    for (const z of [64, 32, 16]) aiFigure(sm, aiOrbitIcon(opts, smallOpts, 'Default', z, z <= 32), z + ' px');
    aiBullets(card, pros);
  }
  const row2 = box({ name: 'Reference and other rounds', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const ref = aiCard(row2, 'What we took from the reference sheet', { w: 900, sub: 'The planet-logo sheet Fred shared (nine Saturn-style marks).' });
  aiBullets(ref, ['A solid planet with a ring sweeping across it: here the ring is the RoboCore gear, seen edge-on.', 'The ring is thicker in front and thinner behind, and its far side is hidden by the planet.', 'Negative space instead of outlines: a gap is cut where the ring passes in front.', 'One flat colour, so it prints, embroiders and laser-cuts as well as it renders.', 'Small extras (a moon, a face) are optional; the plain version is the cleanest.']);
  const other = aiCard(row2, 'Other directions', { grow: true, sub: 'Orbit Gear was the first take on the sheet (not picked); Round 2 has its own page; round 1 is kept for history.' });
  const orow = aiRow(other, 'Other round icons', 24, 'end');
  aiFigure(orow, aiScaled(aiIcon({ look: 'Default', shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS.orbit.glyph(), 'Default', false), fit: 'master', name: 'Orbit Gear' }), 140), 'Orbit Gear', 'round 3, first take');
  aiWithVersion('icon', () => {
    aiFigure(orow, aiScaled(aiIcon({ look: 'Default', shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS.slant.glyph(), 'Default', false), fit: 'master', name: 'Forward Gear' }), 140), 'Forward Gear', 'round 2');
    aiFigure(orow, aiScaled(aiIcon({ look: 'Default', shape: 'macOS', glyph: () => aiGlyphNode(CONCEPTS.brackets.glyph(), 'Default', false), fit: 'master', name: 'Core Brackets' }), 140), 'Core Brackets', 'round 1');
  });
}
function aiMasterOrbit(root) {
  const B = CONCEPTS[AI_HERO].defaults;
  const s = docSection(root, 'Master and construction', 'Drawn on Apple\'s 1024 macOS grid. The gear ring is a flat gear (12 teeth, tip Ø ' + 2 * B.rTip + ') squashed to ' + Math.round(B.squash * 100) + ' % of its height and tilted ' + (-B.tilt) + '°. Its teeth reach ' + B.rTip + ' px from the centre, so Android and the maskable PWA icon use the glyph slightly smaller (Shape=Maskable) to keep them inside the safe circles.');
  const row = box({ name: 'Master row', dir: 'H', gap: 48, parent: s, wSize: 'fill' });
  const holder = figma.createFrame(); holder.name = 'Master + keylines'; holder.resize(1024, 1024); holder.fills = []; holder.clipsContent = false;
  const icon = AI.comps['Default|macOS'].createInstance(); holder.appendChild(icon); icon.x = 0; icon.y = 0;
  const G = figma.createFrame(); G.name = 'Keylines'; holder.appendChild(G); G.resize(1024, 1024); G.fills = []; G.clipsContent = false;
  const line = '#2F6BBF';
  const st = (n, dash) => { n.fills = []; n.strokes = [solid(line, 0.9)]; n.strokeWeight = 2.5; n.strokeAlign = 'CENTER'; if (dash) n.dashPattern = [12, 10]; };
  const r0 = figma.createRectangle(); G.appendChild(r0); r0.name = 'Canvas 1024'; r0.resize(1024, 1024); st(r0, true);
  const r1 = figma.createRectangle(); G.appendChild(r1); r1.name = 'Plate 824, r 185.4, smoothing 60 %'; r1.x = 100; r1.y = 100; r1.resize(824, 824); r1.cornerRadius = 185.4; r1.cornerSmoothing = 0.6; st(r1);
  const circ = (r, name, dash) => { const e = figma.createEllipse(); G.appendChild(e); e.name = name; e.resize(2 * r, 2 * r); e.x = 512 - r; e.y = 512 - r; st(e, dash); };
  circ(B.planet, 'Planet Ø ' + 2 * B.planet, false); circ(B.planet + B.gap, 'Back of the ring hidden inside this circle', true);
  const th = IG.rad(B.tilt);
  const ellV = (rx, name, dash) => { const e = aiVec(IG.roundPoly(IG.rotPts(IG.arcPts(512, 512, rx, rx * B.squash, 1, -rx, rx, 48).concat(IG.arcPts(512, 512, rx, rx * B.squash, -1, rx, -rx, 48).slice(1, -1)), 512, 512, th)), name, G, []); st(e, dash); return e; };
  ellV(B.rTip, 'Tooth tips (ellipse)', true); ellV(B.rIn, 'Inner edge (ellipse)', false);
  const ax = figma.createLine(); G.appendChild(ax); ax.name = 'Ring axis (tilt ' + (-B.tilt) + '°)'; ax.resize(2 * B.rTip, 0);
  ax.x = 512 - B.rTip * Math.cos(th); ax.y = 512 - B.rTip * Math.sin(th); ax.rotation = -B.tilt; ax.strokes = [solid(line, 0.9)]; ax.strokeWeight = 2.5; ax.dashPattern = [4, 8];
  holder.rescale(720 / 1024);
  row.appendChild(holder);
  const spec = box({ name: 'Spec', dir: 'V', gap: 18, parent: row, grow: true });
  const block = (title, lines) => { const b = box({ name: title, dir: 'V', gap: 6, parent: spec, wSize: 'fill' }); txt(title, { style: 'Heading/H3', parent: b }); for (const l of lines) txt(l, { style: 'Code/Small', color: 'color/text/secondary', parent: b, fill: true, name: l.slice(0, 40) }); return b; };
  block('Layers (top to bottom)', [
    'Glyph       instance of App icon/Glyph, one ink, no effects',
    '  Gear ring  ' + B.n + ' teeth, tip Ø ' + 2 * B.rTip + ', root Ø ' + 2 * B.rRoot + ', inner Ø ' + 2 * B.rIn + ', tooth ' + B.wRoot + ' → ' + B.wTip,
    '             squashed to ' + Math.round(B.squash * 100) + ' % (seen edge-on), tilted ' + (-B.tilt) + '° (rising to the right)',
    '             front half drawn over the planet; back half hidden inside planet + ' + B.gap,
    '  Planet     circle Ø ' + 2 * B.planet + ', cut by the front of the ring with a ' + B.gap + ' px gap',
    'Plate       squircle 824 × 824, radius 185.4, corner smoothing 60 %, flat colour',
    '            macOS only: drop shadow black 28 % y10 b20 (inside the canvas)',
  ]);
  block('Colours', [AI_LOOKS.Default.spec, AI_LOOKS.Dark.spec, AI_LOOKS.Tinted.spec, 'Two colours per look, never more: the plate and one ink.']);
  block('Keylines (blue)', ['dashed square   1024 canvas', 'solid squircle  824 plate (100 px margin)', 'solid circle    planet; dashed circle: where the back of the ring is hidden', 'dashed ellipse  tooth tips; solid ellipse: inner edge of the ring', 'dotted line     ring axis']);
  const sw = box({ name: 'Swatches', dir: 'H', gap: 12, parent: spec, wSize: 'fill' });
  for (const look of ['Default', 'Dark', 'Tinted']) {
    const L = AI_LOOKS[look];
    const c = box({ name: 'Swatch ' + look, dir: 'H', gap: 0, parent: sw, w: 200, h: 56, radius: 8, clip: true });
    aiTile(c, 'Plate', 100, 56, [solid(L.plate[0][1])], 0); aiTile(c, 'Ink', 100, 56, [solid(L.ink[0][1])], 0);
    txt(look, { style: 'Label/Small', parent: sw });
  }
}

function aiAppearances(root) {
  const s = docSection(root, 'Appearances', 'One master in four looks. iOS 18+ and macOS 26 switch between Default, Dark and Tinted (and Clear, from Liquid Glass) with the system setting; the other platforms use Default.');
  const row = box({ name: 'Appearance cards', dir: 'H', gap: 24, parent: s, wSize: 'fill' });
  const items = [
    ['Default', [[0, '#F7F1E3'], [1, '#EDE4CF']], 'Everywhere by default. Yellow is the box, and it stands out in a dock full of blue and black editor icons.'],
    ['Dark', [[0, '#16233A'], [1, '#0B1422']], 'iOS 18+ and macOS 26 dark appearance, and the dark favicon. Matches the IDE\'s Navy dark mode.'],
    ['Tinted', [[0, '#3A3F4A'], [1, '#1A1D24']], 'iOS 18+ and macOS 26 tinted appearance: greyscale art that the system colours with the user\'s tint.'],
    ['Clear', [[0, '#5B8BD6'], [0.5, '#C76B9E'], [1, '#F2B01E']], 'Liquid Glass "Clear" (iOS 26, macOS 26), mocked up over a wallpaper. The system makes it from the layered icon.'],
  ];
  for (const [look, bg, use] of items) {
    const c = aiCard(row, look, { grow: true });
    const t = aiTile(c, look + ' backdrop', 300, 300, [aiLin(bg, [0, 0], [1, 1])], 16);
    t.layoutSizingHorizontal = 'FILL';
    aiUse(look, 'macOS', 260, { parent: t });
    txt(use, { style: 'Body/Small', color: 'color/text/secondary', parent: c, fill: true });
  }
  const mono = aiCard(row, 'Mono glyph', { grow: true });
  const mt = box({ name: 'Mono tiles', dir: 'H', gap: 12, parent: mono, wSize: 'fill' });
  const t1 = aiTile(mt, 'On cream', 144, 300, [solid('#F7F1E3')], 16); t1.layoutGrow = 1;
  t1.appendChild(aiScaled(aiGlyphOnly('Default', 1.1, '#1B2A41', 'Mono glyph navy'), 130));
  const t2 = aiTile(mt, 'On navy', 144, 300, [solid('#1B2A41')], 16); t2.layoutGrow = 1;
  t2.appendChild(aiScaled(aiGlyphOnly('Default', 1.1, '#F7F1E3', 'Mono glyph cream'), 130));
  txt('Single ink, no plate: the Android 13+ monochrome layer (themed icons), Linux symbolic icons and mask icons.', { style: 'Body/Small', color: 'color/text/secondary', parent: mono, fill: true });
}

function aiSizes(root) {
  const s = docSection(root, 'Sizes and the small glyph', AI_V.key === 'orbit' ? 'Shown at real size. At 32 px and below 12 thin teeth merge into a blur, so those sizes use App icon/Glyph · Small: 10 bigger teeth, a thicker ring and a bigger planet, drawn for a full-canvas plate.' : 'Shown at real size. At 32 px and below the leaning teeth and the facet blur together, so those sizes use App icon/Glyph · Small: 6 bigger teeth, a heavier > and a flat fill, drawn for a full-canvas plate.');
  const r1 = aiRow(s, 'macOS sizes', 28);
  for (const z of [512, 256, 128, 64, 32, 16]) aiFigure(r1, aiUse('Default', 'macOS', z), z + ' px', z <= 32 ? 'small glyph' : null);
  const r2 = aiRow(s, 'Rounded sizes', 28);
  for (const z of [256, 128, 64, 48, 32, 24, 16]) aiFigure(r2, aiUse('Default', 'Rounded', z), z + ' px', z <= 32 ? 'small glyph' : null);
  for (const z of [256, 64, 32, 24, 16]) aiFigure(r2, aiUse('Dark', 'Rounded', z), z + ' px', 'Dark');
  txt('Scaled master vs small glyph (1× and enlarged 4×)', { style: 'Heading/H3', parent: s });
  const r3 = aiRow(s, 'Comparison', 40);
  for (const z of [32, 24, 16]) {
    const pair = aiRow(r3, 'Pair ' + z, 16);
    aiFigure(pair, aiUse('Default', 'Rounded', z, { small: false }), z + ' master');
    aiFigure(pair, aiUse('Default', 'Rounded', z, { small: true }), z + ' small');
    aiFigure(pair, aiUse('Default', 'Rounded', z * 4, { small: false }), '4× master');
    aiFigure(pair, aiUse('Default', 'Rounded', z * 4, { small: true }), '4× small');
  }
}

// ---------- platform mock-ups ----------
function aiAbsCenter(parent, node, cx, cy) { parent.appendChild(node); node.x = cx - node.width / 2; node.y = cy - node.height / 2; return node; }
function aiDock(w) {
  const wall = figma.createFrame(); wall.name = 'macOS Dock (mock-up)'; wall.resize(w, 250); wall.cornerRadius = 12; wall.clipsContent = true;
  wall.fills = [aiLin([[0, '#46679A'], [0.6, '#1B2A41'], [1, '#0E1828']], [0, 0], [1, 1])];
  const dock = figma.createFrame(); dock.name = 'Dock'; wall.appendChild(dock);
  const n = 7, cell = 96, gap = 6, pad = 10, ours = 3;
  dock.resize(pad * 2 + n * cell + (n - 1) * gap, cell + pad * 2); dock.cornerRadius = 26;
  dock.fills = [solid('#FFFFFF', 0.16)]; dock.strokes = [solid('#FFFFFF', 0.3)]; dock.strokeWeight = 1; dock.strokeAlign = 'INSIDE';
  dock.effects = [{ type: 'BACKGROUND_BLUR', radius: 24, visible: true }];
  dock.x = (w - dock.width) / 2; dock.y = 250 - dock.height - 18;
  for (let i = 0; i < n; i++) {
    const ic = i === ours ? aiUse('Default', 'macOS', cell) : aiBlank('macOS', cell, i);
    dock.appendChild(ic); ic.x = pad + i * (cell + gap); ic.y = pad;
  }
  const dot = figma.createEllipse(); dot.name = 'Running'; wall.appendChild(dot); dot.resize(6, 6); dot.fills = [solid('#FFFFFF', 0.85)];
  dot.x = dock.x + pad + ours * (cell + gap) + cell / 2 - 3; dot.y = dock.y + dock.height - 7;
  const tip = box({ name: 'Tooltip', dir: 'H', pad: [6, 12, 6, 12], radius: 8, fill: '#111C2D', fillOpacity: 0.85, parent: wall });
  txt('RoboCore', { style: 'Label/Default', color: 'color/text/on-ink', parent: tip });
  tip.x = dock.x + pad + ours * (cell + gap) + cell / 2 - tip.width / 2; tip.y = dock.y - tip.height - 10;
  return wall;
}
function aiPhone(look, label) {
  const ph = figma.createFrame(); ph.name = 'iPhone home screen · ' + label + ' (mock-up)'; ph.resize(250, 300); ph.cornerRadius = 36; ph.clipsContent = true;
  const wall = { Default: [[0, '#FCE9BF'], [1, '#E8C77A']], Dark: [[0, '#1E2F4B'], [1, '#05090F']], Tinted: [[0, '#2B2620'], [1, '#0B0A08']] }[look];
  ph.fills = [aiLin(wall, [0, 0], [1, 1])];
  const shape = 'Rounded', z = 46;
  for (let i = 0; i < 8; i++) {
    const col = i % 4, rowi = Math.floor(i / 4);
    const x = 18 + col * 56, y = 34 + rowi * 84;
    const ic = i === 5 ? aiUse(look === 'Default' ? 'Default' : look, shape, z, { small: false }) : aiBlank(shape, z, i);
    if (i !== 5 && look !== 'Default') { const pl = ic.children[0]; pl.fills = [aiLin([[0, look === 'Tinted' ? '#4A4740' : '#2E4166'], [1, look === 'Tinted' ? '#1A1916' : '#141F33']], [0.3, 0], [0.7, 1])]; }
    ph.appendChild(ic); ic.x = x; ic.y = y;
    const t = txt(i === 5 ? 'RoboCore' : 'App', { style: 'Caption/Default', color: look === 'Default' ? '#1B2A41' : '#F7F1E3', parent: ph, noStyle: true, align: 'CENTER' });
    t.fontSize = 10; t.lineHeight = { unit: 'PIXELS', value: 12 };
    t.x = x + z / 2 - t.width / 2; t.y = y + z + 4;
  }
  return ph;
}
function aiAdaptive(mask, look, size, themed) {
  // a launcher icon: 108 dp layers drawn at size × 1.5, masked to the 72 dp viewport
  const m = figma.createFrame(); m.name = 'Mask · ' + mask; m.resize(size, size); m.clipsContent = true; m.fills = [];
  if (mask === 'Circle') m.cornerRadius = size / 2;
  else if (mask === 'Squircle') { m.cornerRadius = size * 0.4; m.cornerSmoothing = 1; }
  else if (mask === 'Rounded square') m.cornerRadius = size * 0.2;
  else if (mask === 'Teardrop') { m.topLeftRadius = size / 2; m.topRightRadius = size / 2; m.bottomLeftRadius = size / 2; m.bottomRightRadius = size * 0.12; }
  const L = size * 1.5;
  const bg = figma.createRectangle(); bg.name = 'Background layer'; m.appendChild(bg); bg.resize(L, L); bg.x = -size * 0.25; bg.y = -size * 0.25;
  bg.fills = themed ? [solid(themed[0])] : [aiLin(AI_LOOKS[look].plate, [0.3, 0], [0.7, 1])];
  const fg = aiGlyphOnly(look, AI_V.fg, themed ? themed[1] : null, 'Foreground layer'); fg.rescale(L / 1024); m.appendChild(fg); fg.x = -size * 0.25; fg.y = -size * 0.25;
  return m;
}
function aiSafeZone(size) {
  // foreground layer with the 72 dp viewport and the 66 dp safe circle
  const f = figma.createFrame(); f.name = 'Foreground + safe zone'; f.resize(size, size); f.fills = [solid('#EDE4CF')]; f.cornerRadius = 8; f.clipsContent = true;
  const fg = aiGlyphOnly('Default', AI_V.fg, null, 'Foreground layer'); fg.rescale(size / 1024); f.appendChild(fg); fg.x = 0; fg.y = 0;
  const vp = figma.createRectangle(); vp.name = 'Visible 72 dp'; f.appendChild(vp); vp.resize(size * 72 / 108, size * 72 / 108); vp.x = vp.y = size * 18 / 108;
  vp.fills = []; vp.strokes = [solid('#2F6BBF', 0.9)]; vp.dashPattern = [6, 5]; vp.strokeWeight = 1.5;
  const sc = figma.createEllipse(); sc.name = 'Safe circle 66 dp'; f.appendChild(sc); sc.resize(size * 66 / 108, size * 66 / 108); sc.x = sc.y = size * 21 / 108;
  sc.fills = []; sc.strokes = [solid('#2F6BBF', 0.9)]; sc.strokeWeight = 1.5;
  return f;
}
function aiTaskbar(w, dark) {
  const bar = figma.createFrame(); bar.name = 'Windows 11 taskbar · ' + (dark ? 'dark' : 'light') + ' (mock-up)'; bar.resize(w, 56); bar.cornerRadius = 10; bar.clipsContent = true;
  bar.fills = [solid(dark ? '#202020' : '#F3F3F3')];
  const n = 6, ours = 3, cell = 44;
  const x0 = (w - n * cell) / 2;
  for (let i = 0; i < n; i++) {
    const ic = i === ours ? aiUse('Default', 'Rounded', 24) : aiBlank('Rounded', 24, i);
    bar.appendChild(ic); ic.x = x0 + i * cell + (cell - 24) / 2; ic.y = 14;
    if (i === ours) {
      const hl = figma.createRectangle(); hl.name = 'Hover'; bar.insertChild(0, hl); hl.resize(40, 40); hl.cornerRadius = 6; hl.x = x0 + i * cell + 2; hl.y = 6; hl.fills = [solid(dark ? '#FFFFFF' : '#000000', 0.07)];
      const pill = figma.createRectangle(); pill.name = 'Running'; bar.appendChild(pill); pill.resize(16, 3); pill.cornerRadius = 2; pill.x = x0 + i * cell + cell / 2 - 8; pill.y = 49; pill.fills = [solid('#F2B01E')];
    }
  }
  return bar;
}
function aiDash(w) {
  const wall = figma.createFrame(); wall.name = 'Linux dock (GNOME-style mock-up)'; wall.resize(w, 120); wall.cornerRadius = 12; wall.clipsContent = true;
  wall.fills = [aiLin([[0, '#2B3A55'], [1, '#121821']], [0, 0], [1, 1])];
  const n = 5, ours = 2, cell = 64;
  const dash = figma.createFrame(); dash.name = 'Dash'; wall.appendChild(dash); dash.resize(n * cell + 16, cell + 16); dash.cornerRadius = 22; dash.fills = [solid('#242424', 0.92)];
  dash.x = (w - dash.width) / 2; dash.y = (120 - dash.height) / 2;
  for (let i = 0; i < n; i++) {
    const ic = i === ours ? aiUse('Default', 'Rounded', 48) : aiBlank('Rounded', 48, i);
    dash.appendChild(ic); ic.x = 8 + i * cell + 8; ic.y = 12;
  }
  const dot = figma.createEllipse(); dot.name = 'Running'; dash.appendChild(dot); dot.resize(5, 5); dot.fills = [solid('#FFFFFF', 0.9)]; dot.x = 8 + ours * cell + 8 + 24 - 2.5; dot.y = cell + 6;
  return wall;
}
function aiTabs(w, dark) {
  const bar = figma.createFrame(); bar.name = 'Browser tabs · ' + (dark ? 'dark' : 'light') + ' (mock-up)'; bar.resize(w, 52); bar.cornerRadius = 10; bar.clipsContent = true;
  bar.fills = [solid(dark ? '#1F2023' : '#DEE1E6')];
  const tab = (x, active, title, fav) => {
    const t = box({ name: 'Tab ' + title, dir: 'H', gap: 8, pad: [0, 12, 0, 12], cross: 'center', w: 240, h: 40, radius: [10, 10, 0, 0], parent: bar });
    t.fills = active ? [solid(dark ? '#35363A' : '#FFFFFF')] : [];
    t.x = x; t.y = 12;
    t.appendChild(fav);
    txt(title, { style: 'Label/Default', color: dark ? '#E8EAED' : '#3C4043', parent: t, grow: true });
    txt('×', { style: 'Label/Default', color: dark ? '#9AA0A6' : '#5F6368', parent: t });
    return t;
  };
  tab(10, true, 'RoboCore IDE', aiUse(dark ? 'Dark' : 'Default', 'Rounded', 16));
  const ph = figma.createEllipse(); ph.name = 'Placeholder favicon'; ph.resize(16, 16); ph.fills = [solid(dark ? '#5F6368' : '#9AA0A6')];
  tab(256, false, 'Docs', ph);
  return bar;
}

// ---------- exports (one list drives the frames and the table) ----------
const AI_RES = 'android/app/src/main/res/';
const AI_MAC = 'macos/Runner/Assets.xcassets/AppIcon.appiconset/';
const AI_IOS = 'ios/Runner/Assets.xcassets/AppIcon.appiconset/';
function aiExportList() {
  const U = (look, shape, z, small) => () => aiUse(look, shape, 1024, { small: small !== undefined ? small : (z <= 32 && shape !== 'Square') });
  const plateOnly = () => aiIcon({ look: 'Default', shape: 'Square', noGlyph: true, name: 'Background layer' });
  const L = [];
  for (const z of [1024, 512, 256, 128, 64, 32, 16]) L.push(['macOS', AI_MAC + 'app_icon_' + z, z, U('Default', 'macOS', z), 'PNG', 'macOS shape' + (z <= 32 ? ', small glyph' : '')]);
  L.push(['iOS', AI_IOS + 'Icon-App-1024x1024@1x', 1024, U('Default', 'Square', 1024), 'PNG', 'opaque, square; Xcode/flutter_launcher_icons makes the other sizes']);
  L.push(['iOS', AI_IOS + 'Icon-App-Dark-1024x1024@1x', 1024, () => aiGlyphOnly('Dark', aiSquareFit(), null, 'iOS dark glyph'), 'PNG', 'glyph on transparent; iOS adds the dark backdrop']);
  L.push(['iOS', AI_IOS + 'Icon-App-Tinted-1024x1024@1x', 1024, U('Tinted', 'Square', 1024), 'PNG', 'greyscale; iOS tints it']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher_background', 432, plateOnly, 'PNG', '108 dp × 4; or a colour/gradient drawable']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher_foreground', 432, () => aiGlyphOnly('Default', AI_V.fg, null, 'Android foreground'), 'PNG', 'glyph inside the 66 dp safe circle']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher_monochrome', 432, () => aiGlyphOnly('Default', AI_V.fg, '#1B2A41', 'Android monochrome'), 'PNG', 'themed icons (Android 13+): alpha only']);
  L.push(['Android', AI_RES + 'mipmap-xxxhdpi/ic_launcher', 192, U('Default', 'Rounded', 192), 'PNG', 'legacy 48 dp launcher icon']);
  L.push(['Android', 'android/play_store_512', 512, U('Default', 'Square', 512), 'PNG', 'Google Play listing; Play rounds it']);
  for (const z of [256, 64, 48, 32, 24, 16]) L.push(['Windows', 'windows/ico/app_icon_' + z, z, U('Default', 'Rounded', z), 'PNG', 'into windows/runner/resources/app_icon.ico']);
  L.push(['Linux', 'linux/runner/resources/app_icon', 256, U('Default', 'Rounded', 256), 'PNG', 'window icon (Flutter runner)']);
  L.push(['Linux', 'linux/hicolor/scalable/apps/robocore', 1024, U('Default', 'Rounded', 1024), 'SVG', 'scalable hicolor icon']);
  for (const z of [512, 128, 64, 48, 32, 16]) L.push(['Linux', 'linux/hicolor/' + z + 'x' + z + '/apps/robocore', z, U('Default', 'Rounded', z), 'PNG', 'hicolor theme']);
  L.push(['Web', 'web/favicon', 1024, U('Default', 'Rounded', 1024), 'SVG', 'favicon.svg (add a prefers-color-scheme block for Dark)']);
  L.push(['Web', 'web/favicon', 32, U('Default', 'Rounded', 32), 'PNG', 'replaces the 64 px favicon.png; small glyph']);
  L.push(['Web', 'web/favicon-16', 16, U('Default', 'Rounded', 16), 'PNG', 'small glyph']);
  L.push(['Web', 'web/icons/apple-touch-icon', 180, U('Default', 'Square', 180), 'PNG', 'opaque; iOS rounds it']);
  L.push(['Web', 'web/icons/Icon-192', 192, U('Default', 'Rounded', 192), 'PNG', 'manifest, purpose any']);
  L.push(['Web', 'web/icons/Icon-512', 512, U('Default', 'Rounded', 512), 'PNG', 'manifest, purpose any']);
  L.push(['Web', 'web/icons/Icon-maskable-192', 192, U('Default', 'Maskable', 192), 'PNG', 'manifest, purpose maskable']);
  L.push(['Web', 'web/icons/Icon-maskable-512', 512, U('Default', 'Maskable', 512), 'PNG', 'manifest, purpose maskable']);
  return L;
}
function aiExportFrame(name, size, build, format) {
  const f = figma.createFrame(); f.name = name; f.resize(size, size); f.fills = []; f.clipsContent = true;
  const n = build(); if (size !== 1024) n.rescale(size / 1024); f.appendChild(n); n.x = 0; n.y = 0;
  f.exportSettings = [format === 'SVG' ? { format: 'SVG' } : { format: 'PNG', constraint: { type: 'SCALE', value: 1 } }];
  return f;
}
function aiBuildExports(page, list) {
  const holder = box({ name: 'App icon — exports (real size)', dir: 'V', gap: 48, pad: 64, fill: 'color/bg/app', radius: 24, parent: page });
  docHeader(holder, 'EXPORTS', 'Export frames, real size', 'Select a frame (or a whole row) and press Export: each frame is named after its path in the robocore-ide repo and already has its PNG/SVG export setting. The Windows PNGs go into app_icon.ico.', 1400);
  const groups = {};
  for (const [plat, name, size, build, fmt] of list) {
    if (!groups[plat]) {
      txt(plat, { style: 'Heading/H2', parent: holder });
      groups[plat] = box({ name: 'Exports — ' + plat, dir: 'H', gap: 32, cross: 'end', parent: holder, wrap: true, w: 4200, rowGap: 32 });
    }
    const f = aiExportFrame(name, size, build, fmt);
    const fig = box({ name: 'Export — ' + name, dir: 'V', gap: 8, parent: groups[plat] });
    fig.appendChild(f);
    txt(name.split('/').pop() + '.' + fmt.toLowerCase() + ' · ' + size + ' px', { style: 'Code/Small', color: 'color/text/secondary', parent: fig });
  }
  return holder;
}
function aiExportTable(root, list) {
  const s = docSection(root, 'Export map', 'Every file the icon needs, by platform. The frames are in "App icon — exports (real size)" to the right of this column. Paths are relative to the robocore-ide repo; Windows and Linux hicolor files are collected by the packaging step.');
  const head = box({ name: 'Header row', dir: 'H', gap: 16, pad: [8, 12, 8, 12], fill: 'color/bg/subtle', radius: 6, parent: s, wSize: 'fill' });
  const cols = [['Platform', 140], ['File', 980], ['Size', 120], ['Format', 90], ['Notes', 760]];
  for (const [c, w] of cols) txt(c, { style: 'Label/Strong', parent: head, w });
  const table = box({ name: 'Rows', dir: 'V', gap: 0, parent: s, wSize: 'fill' });
  for (const [plat, name, size, , fmt, note] of list) {
    const r = box({ name: 'Row ' + name, dir: 'H', gap: 16, pad: [7, 12, 7, 12], parent: table, wSize: 'fill', stroke: 'color/border/subtle', sides: { b: 1 } });
    const vals = [plat, name + '.' + fmt.toLowerCase(), size + ' × ' + size, fmt, note];
    vals.forEach((v, i) => txt(v, { style: i === 1 ? 'Code/Small' : 'Body/Small', color: i === 1 ? 'color/text/primary' : 'color/text/secondary', parent: r, w: cols[i][1] }));
  }
}

function aiPlatforms(root) {
  const s = docSection(root, 'Platforms', 'What each platform expects, previews of the deliverables and a mock-up in context. Other apps in the mock-ups are neutral placeholders.');
  const grid = box({ name: 'Platform cards', dir: 'H', gap: 32, parent: s, wSize: 'fill', wrap: true, rowGap: 32 });
  const W = 1072; // two columns + 32 gap inside the 2192 px section
  const fig = (row, node, cap, sub) => aiFigure(row, node, cap, sub);

  // macOS
  let c = aiCard(grid, 'macOS', { w: W, sub: 'macOS 11–15 icon grid; macOS 26 (Tahoe) Liquid Glass' });
  aiBullets(c, [
    '1024 × 1024 canvas with the 824 × 824 squircle plate (100 px margin) and a soft shadow inside the canvas: Apple\'s macOS grid.',
    'AppIcon.appiconset: 16, 32, 64, 128, 256, 512 and 1024 px (Flutter names them app_icon_N.png). 16 and 32 px use the small glyph.',
    'macOS 26 puts icons that don\'t fill the squircle into a grey box; this plate already is the squircle. For full Liquid Glass, rebuild the two layers below in Apple\'s Icon Composer; it adds the glass light itself' + (AI_V.key === 'orbit' ? ', and this art is already one flat ink.' : ', so the gear layer is flat (no facet).'),
  ]);
  let row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'macOS', 200), 'app_icon_1024', 'shown at 200');
  for (const z of [128, 64, 32, 16]) fig(row, aiUse('Default', 'macOS', z), z + ' px');
  const layers = aiRow(c, 'Icon Composer layers', 16);
  const lt = (name, build) => { const t = aiTile(layers, name, 150, 150, [solid('#EDE4CF')], 12); t.appendChild(build()); return fig(layers, t, name); };
  lt('Background', () => { const b = aiIcon({ look: 'Default', shape: 'Rounded', noGlyph: true, name: 'Background' }); b.rescale(120 / 1024); return b; });
  lt(AI_V.key === 'orbit' ? 'Layer 1 · Planet + gear ring' : 'Layer 1 · Gear (flat)', () => { const g = aiGlyphOnly('Default', 1, '#1B2A41', 'Gear'); g.rescale(130 / 1024); return g; });
  c.appendChild(aiDock(W - 56));

  // iOS
  c = aiCard(grid, 'iOS and iPadOS', { w: W, sub: 'iOS 18 appearances; iOS 26 Liquid Glass' });
  aiBullets(c, [
    'One 1024 × 1024 PNG, opaque, with square corners: iOS applies the rounded mask itself.',
    'iOS 18+: a Dark variant (glyph on transparent; iOS draws the dark backdrop) and a Tinted variant (greyscale; iOS tints it).',
    'iOS 26: build the same two Icon Composer layers as macOS to get Liquid Glass, Clear and Tinted for free.',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'Square', 160), 'Icon-App-1024', 'square, opaque');
  fig(row, aiUse('Default', 'Rounded', 160), 'as iOS shows it', 'system mask');
  const dk = aiTile(null, 'Dark variant backdrop', 160, 160, [aiLin([[0, '#2A2D33'], [1, '#0B0C0E']])], 36);
  dk.appendChild(aiScaled(aiGlyphOnly('Dark', aiSquareFit(), null, 'Dark glyph'), 160));
  fig(row, dk, 'Dark', 'glyph on transparent');
  fig(row, aiUse('Tinted', 'Rounded', 160), 'Tinted', 'greyscale');
  const phones = aiRow(c, 'Home screens', 16, 'start');
  for (const [look, label] of [['Default', 'Light'], ['Dark', 'Dark'], ['Tinted', 'Tinted']]) fig(phones, aiPhone(look, label), label);

  // Android
  c = aiCard(grid, 'Android', { w: W, sub: 'Adaptive icon (Android 8+); themed icon (Android 13+)' });
  aiBullets(c, [
    'Adaptive icon: 108 × 108 dp background and foreground layers. Launchers show the centre 72 dp and may cut anything outside the 66 dp safe circle; the glyph stays inside it.',
    'Monochrome layer (Android 13+): the launcher recolours it from the wallpaper for themed icons.',
    'Legacy ic_launcher PNG (48 dp) for old launchers; Google Play listing icon 512 × 512, square (Play rounds the corners).',
  ]);
  row = aiRow(c, 'Layers', 20);
  fig(row, aiTile(null, 'Background layer', 150, 150, [aiLin(AI_LOOKS.Default.plate, [0.3, 0], [0.7, 1])], 0), 'Background', '108 dp');
  fig(row, aiSafeZone(150), 'Foreground', '72 dp view, 66 dp circle');
  const mono = aiTile(null, 'Monochrome layer', 150, 150, [solid('#EDE4CF')], 0);
  mono.appendChild(aiScaled(aiGlyphOnly('Default', AI_V.fg, '#1B2A41', 'Monochrome'), 150));
  fig(row, mono, 'Monochrome', 'Android 13+');
  fig(row, aiUse('Default', 'Square', 150), 'Play Store 512');
  const masks = figma.createFrame(); masks.name = 'Launcher masks (mock-up)'; masks.resize(W - 56, 210); masks.cornerRadius = 12; masks.clipsContent = true;
  masks.fills = [aiLin([[0, '#DCE6F5'], [1, '#B9CBE6']], [0, 0], [1, 1])];
  const mrow = box({ name: 'Masks', dir: 'H', gap: 28, cross: 'center', parent: masks, x: 28, y: 26 });
  for (const m of ['Circle', 'Squircle', 'Rounded square', 'Teardrop']) aiFigure(mrow, aiAdaptive(m, 'Default', 112), m);
  aiFigure(mrow, aiAdaptive('Circle', 'Default', 112, ['#D9E2FF', '#1F3A73']), 'Themed', 'system colours');
  aiFigure(mrow, aiAdaptive('Circle', 'Default', 112, ['#22304A', '#C9D6FF']), 'Themed dark');
  c.appendChild(masks);

  // Windows
  c = aiCard(grid, 'Windows', { w: W, sub: 'Windows 10 and 11, .ico' });
  aiBullets(c, [
    'app_icon.ico with 16, 24, 32, 48, 64 and 256 px. Windows draws icons unmasked, so the rounded plate is part of the art and fills the canvas.',
    'The taskbar shows 24 px at 100 % scale and 32 px at 125–150 %; Start and Explorer use 32–256 px. 16–32 px use the small glyph.',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'Rounded', 128), '256 px', 'shown at 128');
  for (const z of [64, 48, 32, 24, 16]) fig(row, aiUse('Default', 'Rounded', z), z + ' px');
  c.appendChild(aiTaskbar(W - 56, true));
  c.appendChild(aiTaskbar(W - 56, false));

  // Linux
  c = aiCard(grid, 'Linux', { w: W, sub: 'freedesktop hicolor theme (GNOME, KDE)' });
  aiBullets(c, [
    'Install apps/robocore.png at 16–512 px plus scalable/apps/robocore.svg into the hicolor theme; the .desktop file says Icon=robocore. GNOME and KDE show icons unmasked.',
    'The Flutter runner sets the window icon from data/app_icon.png (256 px).',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  for (const z of [128, 64, 48, 32, 24, 16]) fig(row, aiUse('Default', 'Rounded', z), z + ' px');
  fig(row, aiUse('Dark', 'Rounded', 64), 'Dark', 'optional');
  c.appendChild(aiDash(W - 56));

  // Web
  c = aiCard(grid, 'Web app and PWA', { w: W, sub: 'Chrome, Edge, Safari; installable PWA' });
  aiBullets(c, [
    'favicon.svg scales to any size and can switch to the Dark look with a prefers-color-scheme block; favicon.png (32 px, small glyph) for older browsers.',
    'apple-touch-icon.png 180 × 180, opaque (iOS rounds it).',
    'Manifest: Icon-192/512 (purpose any, Rounded) and Icon-maskable-192/512 (full bleed; the glyph sits inside the 80 % safe circle).',
  ]);
  row = aiRow(c, 'Deliverables', 20);
  fig(row, aiUse('Default', 'Rounded', 32), 'favicon 32');
  fig(row, aiUse('Default', 'Rounded', 16), 'favicon 16');
  fig(row, aiUse('Default', 'Square', 120), 'apple-touch-icon', '180, shown at 120');
  fig(row, aiUse('Default', 'Rounded', 120), 'Icon-512', 'shown at 120');
  const mk = figma.createFrame(); mk.name = 'Maskable + safe circle'; mk.resize(120, 120); mk.fills = []; mk.clipsContent = true;
  mk.appendChild(aiUse('Default', 'Maskable', 120));
  const sz = figma.createEllipse(); sz.name = 'Safe circle 80 %'; mk.appendChild(sz); sz.resize(96, 96); sz.x = 12; sz.y = 12; sz.fills = []; sz.strokes = [solid('#2F6BBF', 0.95)]; sz.strokeWeight = 1.5; sz.dashPattern = [5, 4];
  fig(row, mk, 'Icon-maskable-512', '80 % safe circle');
  c.appendChild(aiTabs(W - 56, false));
  c.appendChild(aiTabs(W - 56, true));
}

// ---------- page ----------
// the builder owns this file: one page per round. It reuses an empty page (or its own page) and refuses files with other content.
async function aiPreparePage() {
  for (const p of figma.root.children) await p.loadAsync();
  const ours = Object.values(AI_VERSIONS).map(v => v.page).concat(AI_LEGACY_PAGES);
  const foreign = figma.root.children.filter(p => ours.indexOf(p.name) < 0 && p.children.length > 0);
  if (foreign.length) throw new Error('This file has other content (page "' + foreign[0].name + '"). Run the App Icon builder in its own design file.');
  const legacy = figma.root.children.find(p => AI_LEGACY_PAGES.indexOf(p.name) >= 0);
  if (legacy && !figma.root.children.find(p => p.name === AI_VERSIONS.icon.page)) legacy.name = AI_VERSIONS.icon.page;
  let page = figma.root.children.find(p => p.name === AI_PAGE_NAME) || figma.root.children.find(p => p.children.length === 0 && ours.indexOf(p.name) < 0);
  if (!page) page = figma.createPage();
  page.name = AI_PAGE_NAME;
  for (const p of figma.root.children.slice()) if (p !== page && p.children.length === 0 && ours.indexOf(p.name) < 0 && figma.root.children.length > 1) p.remove();
  // newest round first
  Object.values(AI_VERSIONS).map(v => v.page).reverse().forEach((name, idx) => { const p = figma.root.children.find(x => x.name === name); if (p) figma.root.insertChild(Math.min(idx, figma.root.children.length - 1), p); });
  for (const c of page.children.slice()) c.remove();
  page.backgrounds = [{ type: 'SOLID', color: hexToRgb('#E9E2D2') }];
  return page;
}

async function buildAppIconPage(cmd) {
  const T = Date.now();
  aiUseVersion(cmd);
  AI.comps = {}; AI.small = {}; AI.glyph = null; AI.glyphSmall = null;
  const page = await aiPreparePage();
  await figma.setCurrentPageAsync(page);
  await setupFonts();
  await setupTokens();
  REPORT.timings.setup = Date.now() - T;

  const comps = aiBuildComponents(page);
  await yieldUI();
  const root = box({ name: 'App icon — ' + AI_V.page, dir: 'V', gap: 40, pad: 64, w: 2400, fill: 'color/bg/app', radius: 24, parent: page });
  root.x = 0; root.y = 0;
  if (AI_V.key === 'orbit') { aiHeaderOrbit(root); aiConceptsOrbit(root); } else { aiHeader(root); aiConcepts(root); }
  await yieldUI();
  if (AI_V.key === 'orbit') aiMasterOrbit(root); else aiMaster(root);
  aiAppearances(root);
  aiSizes(root);
  await yieldUI();
  aiPlatforms(root);
  const list = aiExportList();
  aiExportTable(root, list);
  await applyLinks();
  REPORT.timings.docs = Date.now() - T;

  comps.x = 2600; comps.y = 0;
  const ex = aiBuildExports(page, list);
  await applyLinks();
  ex.x = 2600; ex.y = comps.y + comps.height + 200;
  REPORT.counts.exportFrames = list.length;
  REPORT.counts.variants = Object.keys(AI.comps).length + Object.keys(AI.small).length;
  REPORT.timings.total = Date.now() - T;

  const review = await openReview();
  REPORT.export = review ? 'on' : 'skipped (no local review server)';
  if (review) {
    const items = root.children.map(sec => [AI_V.key + '_doc_' + sec.name.replace(/[^\w]+/g, '_') + '.png', sec, 0.5]);
    items.push([AI_V.key + '_comp_default_macos.png', AI.comps['Default|macOS'], 0.5], [AI_V.key + '_comp_dark_macos.png', AI.comps['Dark|macOS'], 0.5], [AI_V.key + '_comp_clear_macos.png', AI.comps['Clear|macOS'], 0.5]);
    items.push([AI_V.key + '_components.png', comps, 0.12], [AI_V.key + '_exports.png', ex, 0.15]);
    for (const z of [16, 32]) {
      const f = ex.findOne(n => n.type === 'FRAME' && n.name === 'web/favicon' && Math.round(n.width) === z) || ex.findOne(n => n.type === 'FRAME' && n.name === 'web/favicon-16');
      if (f) items.push([AI_V.key + '_favicon_' + z + '.png', f, 1]);
    }
    await exportForReview(items);
  }
  await sendReport();
  figma.viewport.scrollAndZoomIntoView([root]);
}
// ============================================================================
// Entry point. Runs last so every file above is loaded.
// "icon" (the original menu item) builds every round; "forward" / "orbit" build one page.
// ============================================================================

const AI_RUN = figma.command === 'orbit' ? ['orbit'] : figma.command === 'forward' ? ['icon'] : ['icon', 'orbit'];
(async () => { for (const v of AI_RUN) await buildAppIconPage(v); })().then(() => {
  figma.closePlugin('RoboCore app icon: ' + AI_RUN.map(v => AI_VERSIONS[v].page).join(' + ') + ' built' + (REPORT.errors.length ? ' — ' + REPORT.errors.length + ' error(s)' : ''));
}).catch(async (e) => {
  REPORT.errors.push('FATAL: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 6).join(' | '));
  try { if (await openReview()) await sendReport(); } catch (x) { /* ignore */ }
  figma.closePlugin('RoboCore app icon builder stopped: ' + e.message);
});
