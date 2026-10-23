#!/usr/bin/env node
// Renders concept sheets as HTML (+ PNG through headless Chrome) for quick review.
//   node app-icon/preview.js <out-dir>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const IG = require('./geom.js');
globalThis.IG = IG;
const { CONCEPTS } = require('./concepts.js');

const OUT = process.argv[2] || path.join(__dirname, 'preview-out');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const THEMES = {
  sun: { plate: ['#FFCC47', '#F2B01E', '#E09A10'], ink: ['#2A3F62', '#16233A'], accent: ['#2A3F62', '#16233A'], face: ['#FFF8E6', '#F2E6C8'], accent2: ['#2A3F62', '#16233A'], accentShade: ['#1C2C49', '#0B1322'], shadow: '#7A4A00' },
  night: { plate: ['#2E4670', '#1B2A41', '#111B2C'], ink: ['#FFFDF6', '#EFE6D0'], accent: ['#FFCC47', '#E9A417'], face: ['#FFCC47', '#E9A417'], accent2: ['#1B2A41', '#111B2C'], accentShade: ['#E9A417', '#C68709'], shadow: '#05090F' },
};

let uid = 0;
function iconSvg(conceptKey, themeKey, size, opts = {}) {
  const c = CONCEPTS[conceptKey], t = THEMES[themeKey], id = 'i' + (uid++);
  const layers = c.glyph(opts.glyph || {});
  const plate = IG.squircle(100, 100, 824, 824, 185, 0.6);
  const grad = (name, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}${name}" x1="0" y1="0" x2="${x2}" y2="${y2}">` +
    stops.map((s, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${s}"/>`).join('') + '</linearGradient>';
  const defs = [
    grad('plate', t.plate, 0.35, 1),
    grad('ink', t.ink), grad('accent', t.accent), grad('face', t.face), grad('accent2', t.accent2), grad('accentShade', t.accentShade),
    `<linearGradient id="${id}facet" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="${t.accent[0]}"/><stop offset="0.5" stop-color="${t.accent[1]}"/><stop offset="0.5" stop-color="${t.accentShade[1]}"/><stop offset="1" stop-color="${t.accentShade[1]}"/></linearGradient>`,
    `<linearGradient id="${id}hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>`,
    `<filter id="${id}os" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000" flood-opacity=".28"/></filter>`,
    `<filter id="${id}gs" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="${t.shadow}" flood-opacity=".32"/></filter>`,
    `<clipPath id="${id}clip"><path d="${plate}"/></clipPath>`,
  ].join('');
  const glyph = layers.map((l) => `<path d="${l.d}" fill="url(#${id}${l.role})" fill-rule="evenodd"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}"><defs>${defs}</defs>` +
    `<path d="${plate}" fill="url(#${id}plate)" filter="url(#${id}os)"/>` +
    `<g clip-path="url(#${id}clip)"><g filter="url(#${id}gs)">${glyph}</g></g>` +
    `<path d="${plate}" fill="url(#${id}hl)" style="mix-blend-mode:soft-light"/>` +
    `<path d="${plate}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3" clip-path="url(#${id}clip)"/>` +
    '</svg>';
}

function sheet() {
  let rows = '';
  for (const k of Object.keys(CONCEPTS)) {
    const c = CONCEPTS[k];
    const small = (th) => [128, 64, 32, 16].map((s) => `<div class="sm">${iconSvg(k, th, s)}<span>${s}</span></div>`).join('');
    rows += `<section><h2>${c.title}</h2><p>${c.note}</p><div class="row">` +
      `<div class="big">${iconSvg(k, 'sun', 300)}</div><div class="big dark">${iconSvg(k, 'night', 300)}</div>` +
      `<div class="col"><div class="smalls">${small('sun')}</div><div class="smalls dark">${small('night')}</div></div></div></section>`;
  }
  return `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;background:#E9E2D2;font:14px -apple-system,system-ui;color:#1B2A41}
section{margin-bottom:28px}h2{margin:0 0 4px;font-size:20px}p{margin:0 0 10px;color:#4b5568}
.row{display:flex;gap:16px;align-items:flex-start}.big{background:#F7F1E3;border-radius:16px;padding:10px}
.dark{background:#121E31!important;color:#cdd}.col{display:flex;flex-direction:column;gap:10px}
.smalls{display:flex;gap:14px;align-items:flex-end;background:#F7F1E3;border-radius:12px;padding:10px 14px}
.sm{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px}
</style>${rows}`;
}

function render(name, html, w, h) {
  const file = path.join(OUT, name + '.html');
  fs.writeFileSync(file, html);
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--screenshot=${path.join(OUT, name + '.png')}`, `--window-size=${w},${h}`, 'file://' + file], { stdio: 'ignore' });
  console.log('wrote', path.join(OUT, name + '.png'));
}

if (require.main === module) render('concepts', sheet(), 1200, 1180);
module.exports = { iconSvg, THEMES, render };
