// ============================================================================
// Orchestration: guard → pages → tokens → assets → one page at a time
// → (optional) PNG export to a local review server
// ============================================================================

async function yieldUI() { await new Promise(r => setTimeout(r, 0)); }

async function preparePages() {
  const managed = Object.values(PAGE_NAMES);
  for (const p of figma.root.children) await p.loadAsync();
  const foreign = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length > 0);
  if (foreign.length) throw new Error('This file already has other content (page "' + foreign[0].name + '"). Run the builder in a new, empty design file.');
  const built = figma.root.children.filter(p => managed.indexOf(p.name) >= 0 && p.children.length > 0);
  if (built.length && figma.command !== 'rebuild') throw new Error('This file already has the generated pages. Use Plugins → Development → RoboCore Architecture Builder → Rebuild to regenerate them (manual edits on those pages are replaced; version history keeps the old version).');
  const pages = {};
  const empties = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length === 0);
  for (const [key, name] of Object.entries(PAGE_NAMES)) {
    let p = figma.root.children.find(x => x.name === name);
    if (!p && empties.length) { p = empties.shift(); p.name = name; }
    if (!p) { p = figma.createPage(); p.name = name; }
    pages[key] = p;
  }
  Object.values(PAGE_NAMES).forEach((name, i) => { const p = figma.root.children.find(x => x.name === name); if (p) figma.root.insertChild(i, p); });
  for (const p of figma.root.children.slice()) if (managed.indexOf(p.name) < 0 && p.children.length === 0 && figma.root.children.length > managed.length) p.remove();
  for (const p of Object.values(pages)) for (const c of p.children.slice()) c.remove();
  return pages;
}

function buildAssets(page) {
  const root = box({ name: 'Assets', dir: 'V', gap: 32, pad: 64, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;
  docHeader(root, 'Components used by the diagrams', 'Icons & logo', 'Lucide icons (2 px stroke on a 24 px grid) and the RoboCore wordmark, as components. The diagram pages use instances of these.');
  buildIcons(root);
  buildLogos(root);
  return root;
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

const BUILDERS = [
  ['cover', buildCover], ['context', buildContext], ['containers', buildContainers], ['ide', buildIde], ['flows', buildFlows],
  ['states', buildStates], ['hardware', buildHardware], ['delivery', buildDelivery], ['cog', buildCog], ['decisions', buildDecisions],
];

async function main() {
  const T = Date.now();
  const mark = (k) => { REPORT.timings[k] = Date.now() - T; };
  const pages = await preparePages();
  await setupFonts();
  await setupTokens();
  mark('tokens');
  await figma.setCurrentPageAsync(pages.assets);
  buildAssets(pages.assets);
  await applyLinks();
  mark('assets');
  const roots = {};
  for (const [key, fn] of BUILDERS) {
    await figma.setCurrentPageAsync(pages[key]);
    try {
      roots[key] = fn(pages[key]);
    } catch (e) {
      REPORT.errors.push(key + ': ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 4).join(' | '));
    }
    await applyLinks();
    mark(key);
    await yieldUI();
  }
  for (const p of Object.values(pages)) p.backgrounds = [{ type: 'SOLID', color: hexToRgb('#E9E2D2') }];

  const review = await openReview();
  REPORT.export = review ? 'on' : 'skipped (no local review server)';
  if (review) {
    for (const [key] of BUILDERS) {
      const r = roots[key];
      if (!r) continue;
      await figma.setCurrentPageAsync(pages[key]);
      const items = [[key + '__page.png', r, 0.25]];
      for (const c of r.children) {
        if (c.name.indexOf('Diagram') === 0) items.push([key + '_' + c.name.replace(/^Diagram /, '').replace(/[^\w.]+/g, '_').slice(0, 60) + '.png', c, 0.75]);
      }
      if (key === 'cover') for (const c of r.children) if (c.name !== 'Cover' && c.name.indexOf('Diagram') !== 0) items.push(['cover_' + c.name.replace(/[^\w]+/g, '_') + '.png', c, 0.6]);
      await exportForReview(items);
    }
  }
  REPORT.timings.total = Date.now() - T;
  await sendReport();
  await figma.setCurrentPageAsync(pages.cover);
  figma.viewport.scrollAndZoomIntoView(pages.cover.children);
}

main().then(() => {
  figma.closePlugin('RoboCore architecture built — ' + (REPORT.errors.length ? REPORT.errors.length + ' error(s), ' : '') + (REPORT.counts.diagrams || 0) + ' diagrams on ' + BUILDERS.length + ' pages');
}).catch(async (e) => {
  REPORT.errors.push('FATAL: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 6).join(' | '));
  try { if (await openReview()) await sendReport(); } catch (x) { /* ignore */ }
  figma.closePlugin('RoboCore architecture builder stopped: ' + e.message);
});
