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
