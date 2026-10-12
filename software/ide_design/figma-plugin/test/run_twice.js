// Second run without the rebuild command must refuse; with it, must succeed.
const vm = require('vm'); const fs = require('fs'); const path = require('path');
const { figma } = require('./mock_figma.js');
globalThis.figma = figma; globalThis.__html__ = '';
const code = fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8');
const ctxRun = (cmd) => new Promise((res) => { figma._closed = undefined; figma.command = cmd; vm.runInNewContext(code, { figma, __html__: '', setTimeout, clearTimeout, console }); const t = setInterval(() => { if (figma._closed !== undefined) { clearInterval(t); res(figma._closed); } }, 50); });
(async () => { console.log('1:', await ctxRun('build')); console.log('2:', await ctxRun('build')); console.log('3:', await ctxRun('rebuild')); })();
