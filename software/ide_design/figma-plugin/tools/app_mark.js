// Writes src/00_app_mark.js from the approved Geared Ring master in ../app-icon (CONCEPTS.gearring).
// Run again if the icon master changes:  node tools/app_mark.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', '..');
const IG = require(path.join(dir, 'app-icon/geom.js')); globalThis.IG = IG;
const { CONCEPTS } = require(path.join(dir, 'app-icon/concepts.js'));
const c = CONCEPTS.gearring;
function bbox(d) {
  const nums = d.replace(/[MLCZ]/g, ' ').trim().split(/[\s,]+/).map(Number);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i + 1 < nums.length; i += 2) { const x = nums[i], y = nums[i + 1]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}
const out = {};
for (const [k, o] of [['master', c.defaults], ['small', c.small]]) {
  const layers = c.glyph(o);
  const b = layers.map(l => bbox(l.d)).reduce((a, q) => [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[2]), Math.max(a[3], q[3])]);
  out[k] = { box: b.map(v => Math.round(v * 10) / 10), layers: layers.map(l => ({ name: l.name, d: l.d })) };
  console.error(k, 'bbox', out[k].box, 'w', (b[2] - b[0]).toFixed(1), 'h', (b[3] - b[1]).toFixed(1), 'chars', layers.map(l => l.d.length));
}
const js = '// Geared Ring app mark (final icon, confirmed by Fred 2026-10-19), generated from\n' +
  '// RoboCore_IDE_Design/app-icon/concepts.js (CONCEPTS.gearring) by tools/app_mark.js. Do not edit by hand.\n' +
  '// master = 12 teeth (64 px and up); small = 10 teeth, thicker ring (16–48 px). 1024 canvas, centre 512,512.\n' +
  'const APP_MARK = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(dir, 'figma-plugin/src/00_app_mark.js'), js);
console.error('wrote', js.length, 'bytes');
