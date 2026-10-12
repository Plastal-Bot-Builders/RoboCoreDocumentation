// ============================================================================
// 02 — Components page layout + 05 — Prototype wiring
// ============================================================================

function family(root, overline, title, desc, o = {}) {
  const f = box({ name: 'Family — ' + title, dir: 'V', gap: 24, pad: 40, parent: root, wSize: 'fill', fill: 'color/bg/chrome', radius: 16, stroke: 'color/border/subtle' });
  docHeader(f, overline, title, desc, 1200);
  const content = box({ name: 'Content', dir: 'H', wrap: true, gap: o.gap || 40, rowGap: o.gap || 40, parent: f, wSize: 'fill', cross: 'start' });
  return content;
}
async function yieldUI() { await new Promise(r => setTimeout(r, 0)); }

async function buildComponentsPage(page) {
  const root = box({ name: 'Component library', dir: 'V', gap: 40, pad: 64, w: 2600, fill: 'color/bg/app', parent: page });
  root.x = 0; root.y = 0;
  const hdr = box({ name: 'Header', dir: 'V', gap: 8, parent: root, wSize: 'fill' });
  txt('COMPONENTS', { style: 'Caption/Overline', color: 'color/brand/default', parent: hdr, name: 'Overline' });
  txt('RoboCore IDE component library', { style: 'Heading/Display', parent: hdr, name: 'Title' });
  txt('Every component uses auto layout and is bound to the Color / Dimensions variables and the text + effect styles. Variant properties are named Property=Value; text, boolean and icon-swap properties are exposed in the instance panel.', { style: 'Body/Default', color: 'color/text/secondary', parent: hdr, name: 'Desc', w: 1200 });

  const t0 = Date.now();
  const brand = family(root, 'Brand', 'Logo & icons', 'Logo built from the official RoboCore wordmark (gear “o”) recoloured for dark UI. Icons: Lucide set, 20px.');
  buildLogos(brand);
  buildIcons(brand);
  await yieldUI();
  const btn = family(root, 'Actions', 'Buttons & toolbar controls', 'Button (4 variants × 5 states), Icon Button (3 × 4) and the build controls used in the top bar.');
  buildButton(btn); buildIconButton(btn); buildToolbarActions(btn);
  const nav = family(root, 'Navigation', 'Navigation & tabs', 'Sidebar items, the Blocks/Code mode switch, sketch file tabs and bottom-panel tabs.');
  buildNavItem(nav); buildModeSwitch(nav); buildFileTab(nav); buildPanelTab(nav);
  const hw = family(root, 'Hardware', 'Board selector & connection', 'Board + port picker, connection indicator, compact board info and the board menu.');
  buildBadge(hw); buildConnection(hw); buildBoardSelector(hw);
  const forms = family(root, 'Forms', 'Inputs, dropdowns & menus', 'Text inputs with labels and helper text, search, selects, menus, toggles, checkboxes, radios and tooltips.');
  buildInputs(forms); buildMenu(forms); buildControls(forms); buildTooltip(forms); buildAvatar(forms);
  await yieldUI();
  const fb = family(root, 'Feedback', 'Toasts', 'Success, error, info and warning notifications.');
  buildToast(fb);
  const blocks = family(root, 'Blocks', 'Block programming', 'Toolbox categories and the block library. Shapes follow Blockly/Scratch conventions: notch on top, tab below, hats start a script, C-blocks wrap statements. Each block lists the C++ it generates in its description.', { gap: 32 });
  buildCategoryItem(blocks);
  await yieldUI();
  // composites (order matters)
  const chrome = family(root, 'App chrome', 'Sidebar, top bar & status bar', 'Composite components used by every screen.');
  buildProjectPill(chrome); buildSidebar(chrome); buildTopBar(chrome); buildStatusBar(chrome);
  buildBoardInfo(hw); buildBoardMenu(hw);
  const cards = family(root, 'Content', 'Cards & tiles', 'Project cards, example cards, template tiles and quick actions.');
  buildProjectCard(cards); buildExampleCard(cards); buildTiles(cards);
  const dialogs = family(root, 'Overlays', 'Dialogs', 'Modal dialogs: 16px radius, Elevation/3 Modal over a 72% scrim. Destructive dialogs name the consequence and offer undo where possible.');
  buildDialogs(dialogs);
  await yieldUI();
  buildBlockLibrary(blocks);
  // block anatomy
  const an = box({ name: 'Block anatomy', dir: 'V', gap: 16, pad: 24, w: 560, radius: 12, fill: 'color/bg/canvas', stroke: 'color/border/subtle', parent: blocks });
  txt('Anatomy', { style: 'Heading/H3', parent: an, name: 'Title' });
  const prog = buildBlinkProgram({ selected: true });
  an.appendChild(prog);
  for (const l of ['Hat block (on start / forever) starts a script — maps to setup() / loop().', 'Statement blocks stack: the tab below fits the notch above (40px body, 6px tab).', 'Dropdown fields are tinted; number/text fields are white pills with dark text.', 'Teal outline = selected / keyboard-focused block.']) txt('• ' + l, { style: 'Body/Small', color: 'color/text/secondary', parent: an, name: 'Note', fill: true });
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
    ['codePreview', IDE.codePreview, 'IDE — Blocks · Code preview'], ['boardMenu', IDE.boardMenu, 'IDE — Blocks · Board menu'], ['boardMenuCode', IDE.boardMenuCode, 'IDE — Code · Board menu'], ['settingsDlg', IDE.settings, 'IDE — Project settings'],
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
  // sidebar navigation on every frame
  const navMap = [['Nav/Home', 'home'], ['Nav/Projects', 'projects'], ['Nav/Libraries', 'libraries'], ['Nav/Examples', 'examples'], ['Nav/Board Setup', 'boardSetup'], ['Nav/Serial Monitor', 'serial'], ['Nav/Settings', 'settings'], ['Open project', 'blocks']];
  for (const f of Object.values(P)) {
    if (f === P.homeNew || f === P.boardMenu || f === P.boardMenuCode || f === P.settingsDlg) continue;
    for (const [n, k] of navMap) if (P[k] !== f) await go(f, n, P[k], { t: 'DISSOLVE', d: 0.15 });
  }
  // 1 · open a project (Home → recent card → IDE)
  await go(P.home, 'Project Blink LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.home, 'Quick action New blocks project', P.homeNew, { t: 'DISSOLVE', d: 0.15 });
  await go(P.homeNew, 'Create project', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.homeNew, 'Cancel', P.home, { t: 'DISSOLVE', d: 0.15 });
  await go(P.homeNew, 'Close', P.home, { t: 'DISSOLVE', d: 0.15 });
  await go(P.projects, 'Project Blink LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  await go(P.projects, 'Project Obstacle avoider', P.code, { t: 'DISSOLVE', d: 0.2 });
  // 2 · switch Blocks ↔ Code
  for (const [a, b] of [['blocks', 'code'], ['blocksCollapsed', 'codeCollapsed'], ['codePreview', 'code'], ['boardMenu', 'code']]) await go(P[a], 'Segment Code', P[b]);
  for (const [a, b] of [['code', 'blocks'], ['codeCollapsed', 'blocksCollapsed'], ['boardMenuCode', 'blocks']]) await go(P[a], 'Segment Blocks', P[b]);
  await go(P.blocks, 'Show code', P.codePreview);
  await go(P.codePreview, 'Show code', P.blocks);
  await go(P.codePreview, 'Close preview', P.blocks);
  // 3 · board selector
  await go(P.blocks, 'Board selector', P.boardMenu, { t: 'DISSOLVE', d: 0.12 });
  await go(P.code, 'Board selector', P.boardMenuCode, { t: 'DISSOLVE', d: 0.12 });
  for (const [k, back] of [['boardMenu', 'blocks'], ['boardMenuCode', 'code']]) {
    const f = P[k];
    const menu = f && f.findOne(n => n.name === 'Board menu');
    if (!menu) continue;
    // click outside closes: transparent dismiss layer under the menu
    const dz = await hotspot(f, 0, 0, SW, SH, P[back], 'Dismiss menu', { t: 'DISSOLVE', d: 0.12 });
    f.insertChild(f.children.indexOf(menu), dz);
    for (const b of BOARDS) await go(f, 'Board ' + b[0], P[back], { t: 'DISSOLVE', d: 0.12 });
    await go(f, 'Board setup', P.boardSetup, { t: 'DISSOLVE', d: 0.15 });
  }
  // 4 · serial monitor expand / collapse
  await go(P.blocks, 'Collapse panel', P.blocksCollapsed);
  await go(P.blocksCollapsed, 'Expand panel', P.blocks);
  await go(P.code, 'Collapse panel', P.codeCollapsed);
  await go(P.codeCollapsed, 'Expand panel', P.code);
  await go(P.blocks, 'Maximise panel', P.serial, { t: 'DISSOLVE', d: 0.2 });
  // 5 · examples
  await go(P.examples, 'Example Blink an LED', P.blocks, { t: 'DISSOLVE', d: 0.2 });
  if (P.home) {
    const rp = P.home.findOne(n => n.name === 'Section header Recent projects');
    const st = P.home.findOne(n => n.name === 'Section header Starter templates');
    if (rp) await go(P.home, 'Link', P.projects, { t: 'DISSOLVE', d: 0.15, within: rp });
    if (st) await go(P.home, 'Link', P.examples, { t: 'DISSOLVE', d: 0.15, within: st });
  }
  // 6 · project settings
  for (const k of ['blocks', 'code', 'codePreview', 'blocksCollapsed', 'codeCollapsed']) await go(P[k], 'Project switcher', P.settingsDlg, { t: 'DISSOLVE', d: 0.15 });
  for (const n of ['Cancel', 'Save changes', 'Close']) await go(P.settingsDlg, n, P.blocks, { t: 'DISSOLVE', d: 0.15 });
  // flows (one starting frame per flow)
  const flows = [['1 · Open a project', P.home], ['2 · Switch Blocks ↔ Code', P.blocks], ['3 · Board selector', P.code], ['4 · Serial monitor expand / collapse', P.blocksCollapsed], ['5 · Navigate to Examples', P.projects], ['6 · Project settings', P.codePreview]].filter(x => x[1]);
  page.flowStartingPoints = flows.map(([name, f]) => ({ nodeId: f.id, name }));
  // legend
  const lg = box({ name: 'Prototype guide', dir: 'V', gap: 10, pad: 32, w: 1440, radius: 16, fill: 'color/bg/chrome', stroke: 'color/border/subtle', parent: page });
  lg.x = 0; lg.y = -420;
  txt('PROTOTYPE', { style: 'Caption/Overline', color: 'color/brand/default', parent: lg, name: 'Overline' });
  txt('Clickable flows — press Present (▶) and pick a flow', { style: 'Heading/H1', parent: lg, name: 'Title' });
  for (const l of ['1 · Open a project — Home → click the “Blink LED” card (or New blocks project → Create project).', '2 · Switch Blocks ↔ Code — use the mode switch; “Show code” opens the generated C++ preview.', '3 · Board selector — click the board chip in the top bar; pick a board or click outside to close.', '4 · Serial monitor — use the chevron to collapse or expand the bottom panel; the maximise button opens the full Serial Monitor.', '5 · Navigate to Examples — sidebar → Examples → open “Blink an LED”.', '6 · Project settings — click the project name in the top bar; Cancel / Save return to the editor.', 'Every sidebar destination works on every screen. Transitions: Smart Animate 250 ms for mode/panel changes, Dissolve 150 ms for navigation.']) txt(l, { style: 'Body/Default', color: 'color/text/secondary', parent: lg, name: 'Step', fill: true });
  return P;
}
