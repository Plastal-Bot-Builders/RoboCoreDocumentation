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
  await buildSelects(forms);
  buildChoiceGroup(forms, 'Mode Choice', [['Blocks', 'Blocks', 'Drag and drop', 'blocks'], ['C++', 'C++', 'Arduino C++', 'code']], { dir: 'H', w: 452, desc: 'New-project mode: Blocks or C++ (you can switch later).' });
  buildChoiceGroup(forms, 'Help Style', [['Hints first', 'Hints first', 'Explains the problem, then one hint at a time. Shows the fix only when asked.'], ['Explain the answer', 'Explain the answer', 'Explains what is wrong and how to fix it.'], ['Write code for me', 'Write code for me', 'Can write and change code (with Apply). Off for students.']], { w: 500, desc: 'How much Cog helps. Teachers can lock it for a class.' });
  buildChoiceGroup(forms, 'Theme Choice', [['Paper', 'Paper', 'Light · the box colours'], ['Navy', 'Navy', 'Dark · the box, inverted']], { dir: 'H', w: 500, desc: 'Theme. Paper = light, Navy = dark (page 06).' });
  buildLibraryAction(forms); buildServerTest(forms);
  await yieldUI();
  const blocks = family(root, 'Blocks', 'Toolbox categories and the block library. Colour = category (ten print-like inks, navy line-art outlines; hardware-first, see docs/block-catalogue.md); shape = how a block fits. Each block lists the C++ it generates.', { gap: 28 });
  buildCategoryItem(blocks);
  const cog = family(root, 'Cog — learning partner', 'AI coding assistant. Guides before it fixes: explains, gives one hint at a time, shows the fix only when asked, never edits without Apply, and always shows what it read.');
  buildAssistantComponents(cog);
  const chrome = family(root, 'App chrome', 'Top bar (box yellow), sidebar and status bar.');
  buildProjectPill(chrome); buildSidebar(chrome); buildTopBar(chrome); buildStatusBar(chrome);
  buildBoardInfo(hw); buildBoardMenu(hw);
  const cards = family(root, 'Cards & dialogs', 'Project and example cards, template tile, dialogs.');
  buildProjectCard(cards); buildExampleCard(cards); buildTiles(cards); buildDialogs(cards);
  await yieldUI();
  buildBlockLibrary(blocks);
  await yieldUI();
  const bly = family(root, 'Blockly', 'The parts that come from Google Blockly (Zelos renderer + RoboCore theme): category toolbox with a flyout over the workspace, zoom controls, trashcan.');
  buildPalette(bly); buildZoomControls(bly); buildTrashcan(bly);
  const mon = family(root, 'Monaco', 'The parts that come from the Monaco editor: the banner above it and the find widget. Suggest, hover, error hover and code actions are drawn on the screens.');
  buildCodeBanner(mon); buildFindWidget(mon);
  const pan = family(root, 'Panels', 'Interactive panels: the console (scenario × tab), Cog step by step, and the preview board.');
  buildConsolePanel(pan); buildCogPanel(pan); buildPreviewBoard(pan);
  await yieldUI();
  await wireComponentInteractions(); await wirePalette(); await wireTrashcan(); await wireConsolePanel(); await wireCogPanel(); await wirePreviewBoard();
  stackForOverflow(root);
  REPORT.timings.components = Date.now() - t0;
  return root;
}
