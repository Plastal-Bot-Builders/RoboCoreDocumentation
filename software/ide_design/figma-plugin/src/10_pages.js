// ============================================================================
// 02 — Components page layout + 05 — Prototype wiring
// ============================================================================

function family(root, title, desc, o = {}) {
  const f = box({ name: 'Family — ' + title, dir: 'V', gap: 20, pad: 32, parent: root, wSize: 'fill', fill: 'color/bg/panel', radius: 12, stroke: 'color/border/default' });
  const h = box({ name: 'Doc header', dir: 'V', gap: 4, parent: f });
  txt(title, { style: 'Heading/H1', parent: h, name: 'Title' });
  if (desc) txt(desc, { style: 'Body/Small', color: 'color/text/secondary', parent: h, name: 'Description', w: 1000 });
  return box({ name: 'Content', dir: 'H', wrap: true, gap: o.gap || 32, rowGap: o.gap || 32, parent: f, wSize: 'fill', cross: 'start' });
}
async function yieldUI() { await new Promise(r => setTimeout(r, 0)); }

async function buildComponentsPage(page) {
  const root = box({ name: 'Component library', dir: 'V', gap: 24, pad: 64, w: 2200, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;
  txt('Components', { style: 'Heading/Display', parent: root, name: 'Title' });
  const t0 = Date.now();
  const brand = family(root, 'Logo & icons', 'Single-ink logo from the box; Lucide line icons at 20px.');
  buildLogos(brand); buildIcons(brand);
  await yieldUI();
  const act = family(root, 'Actions', 'Button, icon button and the build controls.');
  buildButton(act); buildIconButton(act); buildToolbarActions(act);
  const nav = family(root, 'Navigation', 'Sidebar items, mode switch and tabs.');
  buildNavItem(nav); buildModeSwitch(nav); buildFileTab(nav); buildPanelTab(nav);
  const hw = family(root, 'Hardware', 'Board selector, connection status, board card and menu.');
  buildBadge(hw); buildConnection(hw); buildBoardSelector(hw);
  const forms = family(root, 'Forms & feedback', 'Inputs, selects, menus, toggles, tooltip, toasts.');
  buildInputs(forms); buildMenu(forms); buildControls(forms); buildTooltip(forms); buildAvatar(forms); buildToast(forms);
  await yieldUI();
  const blocks = family(root, 'Blocks', 'Toolbox categories and the block library: control (yellow), action (navy), value (outlined). Each block lists the C++ it generates.', { gap: 28 });
  buildCategoryItem(blocks);
  const chrome = family(root, 'App chrome', 'Top bar (box yellow), sidebar and status bar.');
  buildProjectPill(chrome); buildSidebar(chrome); buildTopBar(chrome); buildStatusBar(chrome);
  buildBoardInfo(hw); buildBoardMenu(hw);
  const cards = family(root, 'Cards & dialogs', 'Project and example cards, template tile, dialogs.');
  buildProjectCard(cards); buildExampleCard(cards); buildTiles(cards); buildDialogs(cards);
  await yieldUI();
  buildBlockLibrary(blocks);
  REPORT.timings.components = Date.now() - t0;
  return root;
}

// ---------------------------------------------------------------- prototype
const EASE = { type: 'EASE_OUT' };
function reaction(dest, o = {}) {
  return { trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: { type: o.t || 'SMART_ANIMATE', easing: EASE, duration: o.d || 0.25 }, resetScrollPosition: true }] };
}
async function hotspot(frame, x, y, w, h, dest, name, o) {
  const hs = figma.createFrame();
  hs.name = 'Hotspot · ' + name;
  hs.fills = [];
  frame.appendChild(hs);
  if (isAL(frame)) hs.layoutPositioning = 'ABSOLUTE';
  hs.resize(Math.max(1, w), Math.max(1, h)); hs.x = x; hs.y = y;
  await hs.setReactionsAsync([reaction(dest, o)]);
  REPORT.counts.reactions = (REPORT.counts.reactions || 0) + 1;
  return hs;
}
async function go(frame, nodeName, dest, o = {}) {
  if (!frame || !dest) return;
  const scope = o.within || frame;
  const n = scope.findOne(x => x.name === nodeName && x.visible !== false);
  if (!n) { warn('proto: no "' + nodeName + '" in ' + frame.name); return; }
  try {
    await n.setReactionsAsync([reaction(dest, o)]);
    REPORT.counts.reactions = (REPORT.counts.reactions || 0) + 1;
  } catch (e) {
    const p = relPos(n, frame);
    await hotspot(frame, p.x, p.y, p.w, p.h, dest, nodeName, o);
  }
}
async function buildPrototype(page, IDE, SCR) {
  const P = {};
  const pick = [
    ['home', SCR.home, 'Home'], ['homeNew', SCR.homeNew, 'Home — New project'], ['projects', SCR.projects, 'Projects'], ['examples', SCR.examples, 'Examples'],
    ['libraries', SCR.libraries, 'Libraries'], ['boardSetup', SCR.boardSetup, 'Board Setup'], ['serial', SCR.serial, 'Serial Monitor'], ['settings', SCR.settings, 'Settings'],
    ['blocks', IDE.blocks, 'IDE — Blocks'], ['blocksCollapsed', IDE.blocksCollapsed, 'IDE — Blocks · Console collapsed'], ['code', IDE.code, 'IDE — Code'], ['codeCollapsed', IDE.codeCollapsed, 'IDE — Code · Console collapsed'],
    ['boardMenu', IDE.boardMenu, 'IDE — Board selector'], ['settingsDlg', IDE.settings, 'IDE — Project settings'],
  ];
  let i = 0;
  for (const [k, src, name] of pick) {
    if (!src) { warn('proto source missing ' + k); continue; }
    const c = src.clone();
    page.appendChild(c);
    c.name = 'P · ' + name;
    c.x = (i % 4) * 1600; c.y = Math.floor(i / 4) * 1200;
    P[k] = c; i++;
  }
  const navMap = [['Nav/Home', 'home'], ['Nav/Projects', 'projects'], ['Nav/Libraries', 'libraries'], ['Nav/Examples', 'examples'], ['Nav/Board Setup', 'boardSetup'], ['Nav/Serial Monitor', 'serial'], ['Nav/Settings', 'settings'], ['Open project', 'blocks']];
  for (const f of Object.values(P)) {
    if (f === P.homeNew || f === P.boardMenu || f === P.settingsDlg) continue;
    for (const [n, k] of navMap) if (P[k] !== f) await go(f, n, P[k], { t: 'DISSOLVE', d: 0.15 });
  }
  // 1 · open a project
  await go(P.home, 'Project Blink LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.home, 'Open Blink LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.home, 'New project', P.homeNew, { t: 'DISSOLVE', d: 0.15, within: P.home.findOne(n => n.name === 'Hero') });
  await go(P.homeNew, 'Create project', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  for (const n of ['Cancel', 'Close']) await go(P.homeNew, n, P.home, { t: 'DISSOLVE', d: 0.15 });
  await go(P.projects, 'Project Blink LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.projects, 'Project Obstacle avoider', P.code, { t: 'DISSOLVE', d: 0.2 });
  // 2 · Blocks ↔ Code
  for (const [a, b] of [['blocks', 'code'], ['blocksCollapsed', 'codeCollapsed'], ['boardMenu', 'code']]) await go(P[a], 'Segment Code', P[b]);
  for (const [a, b] of [['code', 'blocks'], ['codeCollapsed', 'blocksCollapsed']]) await go(P[a], 'Segment Blocks', P[b]);
  // 3 · board selector
  for (const k of ['blocks', 'code', 'blocksCollapsed', 'codeCollapsed']) await go(P[k], 'Board selector', P.boardMenu, { t: 'DISSOLVE', d: 0.12 });
  if (P.boardMenu) {
    const menu = P.boardMenu.findOne(n => n.name === 'Board menu');
    if (menu) {
      const dz = await hotspot(P.boardMenu, 0, 0, SW, SH, P.blocks, 'Dismiss menu', { t: 'DISSOLVE', d: 0.12 });
      P.boardMenu.insertChild(P.boardMenu.children.indexOf(menu), dz);
      for (const b of BOARDS) await go(P.boardMenu, 'Board ' + b[0], P.blocks, { t: 'DISSOLVE', d: 0.12 });
      await go(P.boardMenu, 'Board setup', P.boardSetup, { t: 'DISSOLVE', d: 0.15, within: menu });
    }
  }
  // 4 · console collapse / expand
  await go(P.blocks, 'Collapse panel', P.blocksCollapsed);
  await go(P.blocksCollapsed, 'Expand panel', P.blocks);
  await go(P.code, 'Collapse panel', P.codeCollapsed);
  await go(P.codeCollapsed, 'Expand panel', P.code);
  // 5 · examples
  await go(P.examples, 'Example Blink an LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  if (P.home) {
    const rp = P.home.findOne(n => n.name === 'Section header Recent projects');
    const tp = P.home.findOne(n => n.name === 'Section header Start from a template');
    if (rp) await go(P.home, 'Link', P.projects, { t: 'DISSOLVE', d: 0.15, within: rp });
    if (tp) await go(P.home, 'Link', P.examples, { t: 'DISSOLVE', d: 0.15, within: tp });
  }
  // 6 · project settings
  for (const k of ['blocks', 'code', 'blocksCollapsed', 'codeCollapsed']) await go(P[k], 'Project switcher', P.settingsDlg, { t: 'DISSOLVE', d: 0.15 });
  for (const n of ['Cancel', 'Save', 'Close']) await go(P.settingsDlg, n, P.blocks, { t: 'DISSOLVE', d: 0.15 });
  const flows = [['1 · Open a project', P.home], ['2 · Switch Blocks ↔ Code', P.code], ['3 · Board selector', P.blocks], ['4 · Serial monitor expand / collapse', P.blocksCollapsed], ['5 · Navigate to Examples', P.projects], ['6 · Project settings', P.codeCollapsed]].filter(x => x[1]);
  page.flowStartingPoints = flows.map(([name, f]) => ({ nodeId: f.id, name }));
  const lg = box({ name: 'Prototype guide', dir: 'V', gap: 8, pad: 32, w: 1440, radius: 12, fill: 'color/bg/brand', parent: page });
  lg.x = 0; lg.y = -360;
  txt('Prototype', { style: 'Heading/H1', parent: lg, name: 'Title' });
  for (const l of ['1 · Open a project — Home → “Blink LED” or New project → Create project.', '2 · Switch Blocks ↔ Code — the mode switch.', '3 · Board selector — the board chip in the top bar; click outside to close.', '4 · Serial monitor — chevron on the bottom panel.', '5 · Examples — sidebar → Examples → “Blink an LED”.', '6 · Project settings — the project name in the top bar.']) txt(l, { style: 'Body/Default', parent: lg, name: 'Step', fill: true });
  return P;
}
