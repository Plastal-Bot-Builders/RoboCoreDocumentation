// Dry-run code.js against the mock Figma API: node test/run.js
const vm = require('vm'), fs = require('fs'), path = require('path');
const { figma, allNodes } = require('./mock_figma.js');
globalThis.figma = figma; globalThis.__html__ = '<html></html>';
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8'), { filename: 'code.js' });
const poll = setInterval(() => {
  if (figma._closed === undefined) return;
  clearInterval(poll);
  const R = vm.runInThisContext('REPORT');
  console.log('closePlugin:', figma._closed);
  console.log('errors:', JSON.stringify(R.errors, null, 1));
  console.log('warnings (' + R.warnings.length + '):', JSON.stringify(R.warnings.slice(0, 20), null, 1));
  console.log('counts:', JSON.stringify(R.counts));
  for (const p of figma.root.children) console.log('PAGE', p.name, '→', p.children.map(c => c.type + ':' + c.name + ' ' + Math.round(c.width) + 'x' + Math.round(c.height)).join(' | ').slice(0, 400));
}, 50);
