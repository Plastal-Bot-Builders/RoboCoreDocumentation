// ============================================================================
// Orchestration: guard → pages → tokens → components → foundations → screens
// → prototype → (optional) PNG export to a local review server
// ============================================================================

async function preparePages() {
  const managed = Object.values(PAGE_NAMES);
  for (const p of figma.root.children) await p.loadAsync();
  const foreign = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length > 0);
  if (foreign.length) throw new Error('This file already has other content (page "' + foreign[0].name + '"). Run the builder in a new, empty design file.');
  // never wipe generated pages by accident: that needs the explicit Rebuild command
  const built = figma.root.children.filter(p => managed.indexOf(p.name) >= 0 && p.children.length > 0);
  if (built.length && figma.command !== 'rebuild') throw new Error('This file already has the generated pages. Use Plugins → Development → RoboCore IDE Design Builder → Rebuild to regenerate them (manual edits on those pages are replaced; version history keeps the old version).');
  const pages = {};
  // rename an empty default page to Foundations
  const empties = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length === 0);
  for (const [key, name] of Object.entries(PAGE_NAMES)) {
    let p = figma.root.children.find(x => x.name === name);
    if (!p && empties.length) { p = empties.shift(); p.name = name; }
    if (!p) { p = figma.createPage(); p.name = name; }
    pages[key] = p;
  }
  // order pages 01..05
  Object.values(PAGE_NAMES).forEach((name, i) => { const p = figma.root.children.find(x => x.name === name); if (p) figma.root.insertChild(i, p); });
  // remove leftover empty pages
  for (const p of figma.root.children.slice()) if (managed.indexOf(p.name) < 0 && p.children.length === 0 && figma.root.children.length > 5) p.remove();
  // clear managed pages (re-run safety: everything here is generated)
  for (const p of Object.values(pages)) for (const c of p.children.slice()) c.remove();
  return pages;
}

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
  figma.ui.postMessage({ type: 'ping' });
  const pong = await waitForUI('pong', 4000);
  return !!(pong && pong.ok);
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

async function main() {
  const T = Date.now();
  const mark = (k) => { REPORT.timings[k] = Date.now() - T; };
  const pages = await preparePages();
  mark('pages');
  await setupFonts();
  await setupTokens();
  mark('tokens');

  await figma.setCurrentPageAsync(pages.components);
  await buildComponentsPage(pages.components);
  await applyLinks();
  mark('components');

  await figma.setCurrentPageAsync(pages.foundations);
  buildFoundations(pages.foundations);
  await applyLinks();
  mark('foundations');

  await figma.setCurrentPageAsync(pages.ide);
  const IDE = buildIdePage(pages.ide);
  await applyLinks();
  mark('ide');
  await yieldUI();

  await figma.setCurrentPageAsync(pages.screens);
  const SCR = buildScreensPage(pages.screens);
  await applyLinks();
  mark('screens');
  await yieldUI();

  await figma.setCurrentPageAsync(pages.prototype);
  await buildPrototype(pages.prototype, IDE, SCR);
  mark('prototype');

  // page canvas backgrounds
  for (const p of Object.values(pages)) p.backgrounds = [{ type: 'SOLID', color: hexToRgb('#050A14') }];

  REPORT.counts.ideFrames = Object.keys(IDE).length;
  REPORT.counts.screenFrames = Object.keys(SCR).length;

  // optional: export PNGs for review (only if the local review server answers)
  const review = await openReview();
  REPORT.export = review ? 'on' : 'skipped (no local review server)';
  if (review) {
    await figma.setCurrentPageAsync(pages.ide);
    const items = [];
    for (const [k, f] of Object.entries(IDE)) items.push(['ide_' + k + '.png', f, 1]);
    for (const [k, f] of Object.entries(SCR)) items.push(['screen_' + k + '.png', f, 1]);
    await exportForReview(items);
    await figma.setCurrentPageAsync(pages.components);
    const comps = pages.components.children[0];
    if (comps) await exportForReview(comps.children.map(fam => ['comp_' + fam.name.replace(/[^\w]+/g, '_') + '.png', fam, 0.6]));
    await figma.setCurrentPageAsync(pages.foundations);
    const fnd = pages.foundations.children[0];
    if (fnd) await exportForReview(fnd.children.map(sec => ['found_' + sec.name.replace(/[^\w]+/g, '_') + '.png', sec, 0.6]));
    await figma.setCurrentPageAsync(pages.prototype);
    await exportForReview(pages.prototype.children.filter(c => c.type === 'FRAME').slice(0, 3).map(c => ['proto_' + c.name.replace(/[^\w]+/g, '_') + '.png', c, 0.5]));
  }
  REPORT.timings.total = Date.now() - T;
  await sendReport();
  await figma.setCurrentPageAsync(pages.foundations);
  figma.viewport.scrollAndZoomIntoView(pages.foundations.children);
}

main().then(() => {
  const msg = 'RoboCore IDE design built — ' + (REPORT.errors.length ? REPORT.errors.length + ' error(s), ' : '') + (REPORT.counts.icons || 0) + ' icons, ' + (REPORT.counts.blocks || 0) + ' blocks, ' + ((REPORT.counts.ideFrames || 0) + (REPORT.counts.screenFrames || 0)) + ' screens';
  figma.closePlugin(msg);
}).catch(async (e) => {
  REPORT.errors.push('FATAL: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 6).join(' | '));
  try { if (await openReview()) await sendReport(); } catch (x) { /* ignore */ }
  figma.closePlugin('RoboCore IDE builder stopped: ' + e.message);
});
