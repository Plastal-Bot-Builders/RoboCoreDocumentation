// ============================================================================
// Build: one page per piece. Rebuild replaces only these pages.
// ============================================================================

const PAGES = {
  kit: '01 — Brand kit', rollup: '02 — Roll-up banner', popup: '03 — Pop-up stand',
  banner: '04 — Outdoor banner', flyer: '05 — Flyer A5', brochure: '06 — Brochure A4 tri-fold',
};
async function preparePages() {
  const managed = Object.values(PAGES);
  for (const p of figma.root.children) await p.loadAsync();
  const foreign = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length > 0);
  if (foreign.length) throw new Error('This file already has other content (page "' + foreign[0].name + '"). Run the builder in a new, empty design file.');
  const empties = figma.root.children.filter(p => managed.indexOf(p.name) < 0 && p.children.length === 0);
  const pages = {};
  for (const [k, name] of Object.entries(PAGES)) {
    let p = figma.root.children.find(x => x.name === name);
    if (!p && empties.length) { p = empties.shift(); p.name = name; }
    if (!p) { p = figma.createPage(); p.name = name; }
    pages[k] = p;
  }
  managed.forEach((name, i) => { const p = figma.root.children.find(x => x.name === name); if (p) figma.root.insertChild(i, p); });
  for (const p of figma.root.children.slice()) if (managed.indexOf(p.name) < 0 && p.children.length === 0 && figma.root.children.length > managed.length) p.remove();
  for (const p of Object.values(pages)) for (const c of p.children.slice()) c.remove();
  return pages;
}
async function exportForReview(items) {
  let warm = false;
  for (const [name, node, scale] of items) {
    try {
      // the first export of a page can run before Figma has decoded its big image fills, so render one throwaway pass
      if (!warm) { await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } }); warm = true; }
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      figma.ui.postMessage({ type: 'png', name, bytes });
      await waitForUI('ack', 20000);
    } catch (e) { warn('export ' + name + ': ' + e.message); }
  }
}
async function sendReport() {
  if (!UI_OK) return;
  figma.ui.postMessage({ type: 'report', report: REPORT });
  await waitForUI('ack', 5000);
}
const reviewScale = (n, px) => Math.min(4, px / Math.max(n.width, n.height));

async function main() {
  const T = Date.now();
  const pages = await preparePages();
  await setupFonts();
  await setupVariables();
  await openBridge();
  for (const name of USED_IMAGES) if (IMG_SIZE[name]) await loadImage(name); else warn('image ' + name + ': not rendered yet');
  REPORT.counts.images = Object.values(IMG).filter(Boolean).length;
  const built = {};
  const step = async (key, fn) => {
    await figma.setCurrentPageAsync(pages[key]);
    try { built[key] = fn(pages[key]); }
    catch (e) { REPORT.errors.push(key + ': ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')); }
    REPORT.timings[key] = Date.now() - T;
  };
  await step('kit', (p) => buildBrandKit(p));
  await step('rollup', (p) => {
    const a = buildRollup(p, 0, 360);
    specCard(p, 0, 0, 'Roll-up banner', [['Visible', '850 × 2000 mm'], ['Artwork', '860 × 2105 mm: 5 mm bleed top and sides, 100 mm extra at the bottom for the base'], ['Export', 'Select the artboard, then Export as PDF (right panel)']], 1200);
    return a;
  });
  await step('popup', (p) => {
    const a = buildPopup(p, 0, 360);
    specCard(p, 0, 0, 'Pop-up stand · 3×3 curved', [['Graphic', '2880 × 2230 mm typical. Sizes differ between suppliers: get the template and resize the artboard before printing'], ['Bleed', '25 mm all round'], ['Keep clear', 'Text 300 mm from each side (wraps round the ends); key message above 1,000 mm from the floor']], 1800);
    return a;
  });
  await step('banner', (p) => {
    const a = buildBanner(p, 0, 360);
    specCard(p, 0, 0, 'Outdoor banner', [['Size', '3000 × 1000 mm PVC, hemmed, eyelets every 500 mm'], ['Safe', '60 mm from every edge'], ['Export', 'PDF at true size']], 1800);
    return a;
  });
  await step('flyer', (p) => {
    const a = buildFlyer(p, 0, 360);
    specCard(p, 0, 0, 'Flyer A5 · two sides', [['Trim', '148 × 210 mm'], ['Bleed', '3 mm'], ['Paper', '170 gsm silk']], 1000);
    return a;
  });
  await step('brochure', (p) => {
    const a = buildBrochure(p, 0, 360);
    specCard(p, 0, 0, 'Brochure A4 tri-fold', [['Trim', '297 × 210 mm, roll fold'], ['Panels', 'Outside 97 | 100 | 100 mm (flap, back, cover); inside 100 | 100 | 97 mm'], ['Bleed', '3 mm'], ['Paper', '150 gsm silk']], 1100);
    return a;
  });
  for (const p of Object.values(pages)) p.backgrounds = [{ type: 'SOLID', color: hexToRgb('#E9E2D2') }];
  // review PNGs (only with the local server running)
  if (UI_OK) {
    const items = [];
    for (const [key, val] of Object.entries(built)) {
      const nodes = Array.isArray(val) ? val : [val];
      nodes.forEach((n, i) => { if (n) items.push([key + (nodes.length > 1 ? '_' + (i + 1) : '') + '.png', n, reviewScale(n, 2600)]); });
    }
    for (const [key, page] of Object.entries(pages).filter(([k]) => k !== 'kit').concat([['kit', pages.kit]])) { await figma.setCurrentPageAsync(page); await exportForReview(items.filter(it => it[0].indexOf(key) === 0)); }
    await figma.setCurrentPageAsync(pages.kit);
    const kit = pages.kit.children[0];
    if (kit) await exportForReview(kit.children.map((s, i) => ['kit_' + i + '_' + s.name.replace(/[^\w]+/g, '_') + '.png', s, 1]));
  }
  REPORT.timings.total = Date.now() - T;
  await sendReport();
  await figma.setCurrentPageAsync(pages.kit);
}

main().then(() => {
  figma.closePlugin('RoboCore event branding built' + (REPORT.errors.length ? ' — ' + REPORT.errors.length + ' error(s)' : '') + ' · ' + (REPORT.counts.artboards || 0) + ' artboards');
}).catch(async (e) => {
  REPORT.errors.push('FATAL: ' + (e && e.message ? e.message : String(e)) + ' | ' + ((e && e.stack) || '').split('\n').slice(0, 6).join(' | '));
  try { await sendReport(); } catch (x) { /* ignore */ }
  figma.closePlugin('RoboCore event branding stopped: ' + (e && e.message ? e.message : String(e)));
});
