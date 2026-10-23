// Dry-run code.js against the mock Figma API: node test/run.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { figma, allNodes } = require('./mock_figma.js');
globalThis.figma = figma;
globalThis.__html__ = '<html></html>';
const code = fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8');
// Figma's plugin sandbox rejects any source text that looks like a dynamic import, even inside a string
if (/\bimport\s*\(/.test(code)) { console.error('code.js contains "import(": Figma will refuse to run it'); process.exit(1); }
const t0 = Date.now();
vm.runInThisContext(code, { filename: 'code.js' });
const poll = setInterval(() => {
  if (figma._closed !== undefined) {
    clearInterval(poll);
    const R = vm.runInThisContext('REPORT');
    console.log('closePlugin:', figma._closed);
    console.log('errors:', JSON.stringify(R.errors, null, 1));
    console.log('warnings (' + R.warnings.length + '):', JSON.stringify(R.warnings.slice(0, 40), null, 1));
    console.log('counts:', JSON.stringify(R.counts));
    console.log('nodes:', allNodes.size, 'time', Date.now() - t0, 'ms');
    const byPage = figma.root.children.map(p => p.name + ': ' + p.children.length + ' top-level');
    console.log(byPage.join('\n'));
  }
}, 50);
setTimeout(() => {
  for (const p of figma.root.children) console.log('PAGE', p.name, '→', p.children.map(c => c.type + ':' + c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height)).join(' | ').slice(0, 600));
}, 2000);
