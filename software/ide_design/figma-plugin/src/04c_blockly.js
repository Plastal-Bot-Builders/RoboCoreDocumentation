// ============================================================================
// Blockly (13.x, Zelos renderer + a RoboCore theme): the parts of the blocks
// workspace that come from Blockly, drawn the way Blockly lays them out.
// - Category toolbox; the flyout opens OVER the workspace (it does not push it).
// - Zoom controls bottom-right, top to bottom: reset, zoom in, zoom out; the
//   trashcan sits under them, 20 px from the corner.
// - Context menus (block / workspace), dropdown and text field editors,
//   comments, "Create variable…" flyout button.
// ============================================================================

const BL = { TOOLBOX_W: 160, FLYOUT_W: 288, PALETTE_H: 600, FLYW: {} };  // FLYW: measured flyout width per category
const BLOCK_COUNT = 8; // the Blink program: on start, 2 serial blocks, forever, 4 blocks inside

// ---------------------------------------------------------------- palette (toolbox + flyout)
// every block of a category, in BLOCK_LIBRARY order (Blockly's flyout scrolls; it widens to the widest block)
function flyoutKeys(cat) { return BLOCK_LIBRARY.filter(b => b[0] === cat).map(b => cat + '/' + b[1]); }
function flyoutButton(parent, label) {
  const b = box({ name: 'Flyout button ' + label, dir: 'H', pad: [0, 14, 0, 14], h: 32, cross: 'center', radius: 6, fill: 'color/bg/panel', stroke: 'color/border/ink', parent });
  txt(label, { style: 'Label/Strong', parent: b, name: 'Label' });
  return b;
}
function scrollbar(parent, vertical, len, at) {
  const r = rect({ name: vertical ? 'Scrollbar vertical' : 'Scrollbar horizontal', w: vertical ? 6 : len, h: vertical ? len : 6, radius: 3, fill: 'color/border/strong', parent, abs: true });
  r.opacity = 0.7;
  if (at) { r.x = at[0]; r.y = at[1]; }
  return r;
}
function buildPalette(parent) {
  const comps = [];
  for (const active of ['None'].concat(BLOCK_CATS.map(c => c[0]))) {
    const c = comp('Category=' + active);
    al(c, { dir: 'V', gap: 2, pad: [12, 8, 12, 8], w: BL.TOOLBOX_W, h: BL.PALETTE_H, cross: 'start', fill: 'color/bg/panel', stroke: 'color/border/subtle' });
    c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeBottomWeight = 0; c.strokeRightWeight = 1;
    c.clipsContent = false;
    for (const [cat] of BLOCK_CATS) inst('Block Category', { Category: cat, State: cat === active ? 'Active' : 'Default' }, c, { name: 'Category ' + cat });
    if (active !== 'None') {
      const fl = box({ name: 'Flyout', dir: 'V', gap: 16, pad: [16, 18, 16, 18], w: BL.FLYOUT_W, h: BL.PALETTE_H, fill: 'color/bg/app', stroke: 'color/border/subtle', clip: true, parent: c, abs: true, x: BL.TOOLBOX_W, y: 0 });
      fl.strokeTopWeight = 0; fl.strokeLeftWeight = 0; fl.strokeBottomWeight = 0; fl.strokeRightWeight = 1;
      fl.constraints = { horizontal: 'MIN', vertical: 'STRETCH' };
      const fh = box({ name: 'Flyout label', dir: 'H', gap: 10, cross: 'center', parent: fl });
      box({ name: 'Category swatch', w: 14, h: 14, radius: 4, fill: STYLE(active).fill, parent: fh });
      txt(active, { style: 'Heading/H2', parent: fh, name: 'Title' });
      if (active === 'Variables') flyoutButton(fl, 'Create variable…');
      if (active === 'My Blocks') flyoutButton(fl, 'Make a block…');
      for (const key of flyoutKeys(active)) blk(key, null, fl);
      // Blockly sizes the flyout to its widest block
      const widest = Math.max(...fl.children.map(k => k.width));
      const fw = Math.max(BL.FLYOUT_W, Math.ceil(widest) + 36 + 8);
      fl.resize(fw, BL.PALETTE_H); BL.FLYW[active] = fw;
      scrollbar(fl, true, 120, [fw - 10, 12]);
    }
    comps.push(c);
  }
  CMP['Blockly Palette'] = makeSet(comps, 'Blockly Palette', parent, 3, 'Blockly category toolbox. Clicking a category opens its flyout over the workspace; clicking it again, or dragging a block out, closes it. Variables has a “Create variable…” button.');
  // leave room for each variant's flyout (it overflows to the right, over the workspace)
  const ps = CMP['Blockly Palette'];
  const maxFly = Math.max(BL.FLYOUT_W, ...Object.values(BL.FLYW));
  gridVariants(ps, 3, maxFly + 40);
  ps.resize(ps.width + maxFly, ps.height);
}
async function wirePalette() {
  const set = CMP['Blockly Palette'];
  for (const v of set.children) {
    const active = propsOf(v).Category;
    for (const [cat] of BLOCK_CATS) {
      const row = v.findOne(n => n.name === 'Category ' + cat);
      if (row) await addReaction(row, changeTo(variantOf(set, { Category: cat === active ? 'None' : cat })));
    }
  }
}

// ---------------------------------------------------------------- workspace controls
function buildZoomControls(parent) {
  const c = comp('Blockly Zoom', 'Blockly zoom controls (bottom-right): reset, zoom in, zoom out. 32 px each; 11 px under reset, 2 px between in and out.');
  al(c, { dir: 'V', gap: 0, cross: 'center' });
  const b = (name, icon) => {
    const x = box({ name, dir: 'H', w: 32, h: 32, align: 'center', cross: 'center', radius: 8, fill: 'color/bg/raised', stroke: 'color/border/default', parent: c });
    iconSlot(x, icon, 'color/icon/strong', 18, 'Icon');
    return x;
  };
  b('Zoom reset', 'fit'); spacer(c, 11); b('Zoom in', 'zoom-in'); spacer(c, 2); b('Zoom out', 'zoom-out');
  CMP['Blockly Zoom'] = c; parent.appendChild(c);
}
function trashcanArt(parent, open, full) {
  const t = figma.createFrame(); t.name = 'Trashcan art'; t.fills = []; t.clipsContent = false; t.resize(40, 50);
  parent.appendChild(t);
  const body = rect({ name: 'Can', w: 30, h: 34, radius: [2, 2, 6, 6], fill: 'color/bg/panel', stroke: 'color/border/ink', strokeW: 1.5, parent: t, x: 5, y: 15 });
  for (const x of [13, 20, 27]) rect({ name: 'Rib', w: 1.5, h: 22, radius: 1, fill: 'color/border/ink', parent: t, x, y: 21 });
  const lid = figma.createFrame(); lid.name = 'Lid'; lid.fills = []; lid.clipsContent = false; lid.resize(36, 10); t.appendChild(lid);
  rect({ name: 'Lid bar', w: 36, h: 5, radius: 2, fill: 'color/bg/panel', stroke: 'color/border/ink', strokeW: 1.5, parent: lid, x: 0, y: 5 });
  rect({ name: 'Handle', w: 12, h: 5, radius: 2, fill: 'color/bg/panel', stroke: 'color/border/ink', strokeW: 1.5, parent: lid, x: 12, y: 1 });
  lid.x = 2; lid.y = 5;
  if (open) { lid.rotation = 24; lid.x = 0; lid.y = 4; }
  else if (full) { lid.rotation = 8; lid.x = 1; lid.y = 4; }
  if (full) { const b = box({ name: 'Count', dir: 'H', pad: [0, 5, 0, 5], h: 16, cross: 'center', radius: 8, fill: 'color/ink/default', parent: t, abs: false }); txt('1', { style: 'Label/Small', color: 'color/text/on-ink', parent: b, name: 'N' }); b.x = 26; b.y = 30; }
  return t;
}
function buildTrashcan(parent) {
  const comps = [];
  for (const contents of ['Empty', 'Full']) for (const state of ['Closed', 'Open']) {
    const c = comp('Contents=' + contents + ', State=' + state);
    al(c, { w: 44, h: 54, align: 'center', cross: 'center' });
    c.clipsContent = false;
    trashcanArt(c, state === 'Open', contents === 'Full');
    comps.push(c);
  }
  CMP['Blockly Trashcan'] = makeSet(comps, 'Blockly Trashcan', parent, 4, 'Blockly trashcan. Drop a block on it to delete; the lid opens while a block is over it. With deleted blocks, click it to reopen them in a flyout.');
}
async function wireTrashcan() {
  const set = CMP['Blockly Trashcan'];
  await addReaction(variantOf(set, { Contents: 'Full', State: 'Closed' }), changeTo(variantOf(set, { Contents: 'Full', State: 'Open' }), HOVER));
  await addReaction(variantOf(set, { Contents: 'Empty', State: 'Closed' }), changeTo(variantOf(set, { Contents: 'Empty', State: 'Open' }), HOVER));
}

// ---------------------------------------------------------------- menus and field editors
const CTX_BLOCK = [['Duplicate', ''], ['Copy', 'Ctrl+C'], ['Add Comment', ''], ['Collapse Block', ''], ['Disable Block', ''], ['Delete Block', 'Delete'], ['Help', '']];
const CTX_WS = [['Undo', 'Ctrl+Z'], ['Redo', 'Ctrl+Shift+Z'], ['Paste', 'Ctrl+V'], ['Clean up Blocks', ''], ['Collapse Blocks', ''], ['Expand Blocks', ''], ['Delete ' + BLOCK_COUNT + ' Blocks', '']];
// a Blockly context menu (WidgetDiv), styled with the theme: rows are Menu Items (hover works)
function blocklyMenu(parent, items, name) {
  const m = box({ name: name || 'Blockly menu', dir: 'V', gap: 0, pad: 4, w: 232, fill: 'color/bg/raised', radius: 8, stroke: 'color/border/default', effect: 'Elevation/Popover', parent });
  for (const [label, key] of items) {
    const r = inst('Menu Item', { State: 'Default' }, m, { name: 'Item ' + label });
    setProp(r, 'Label', label); setProp(r, 'Show icon', false); setProp(r, 'Show check', false);
    if (key) { setProp(r, 'Show shortcut', true); setProp(r, 'Shortcut', key); }
    r.layoutSizingHorizontal = 'FILL';
  }
  return m;
}
// Blockly DropDownDiv under a field: rows + check on the current value, small arrow to the field
function blocklyDropdown(parent, options, current, name) {
  const w = box({ name: name || 'Dropdown', dir: 'V', gap: 0, parent });
  const arrow = figma.createNodeFromSvg('<svg width="16" height="8" viewBox="0 0 16 8" xmlns="http://www.w3.org/2000/svg"><path d="M0 8 L8 0 L16 8 Z" fill="#FFFFFF" stroke="#1B2A41" stroke-opacity="0.16"/></svg>');
  arrow.name = 'Arrow'; w.appendChild(arrow);
  for (const v of arrow.findAll(n => n.type === 'VECTOR')) v.fills = [paint('color/bg/raised')];
  const m = box({ name: 'Options', dir: 'V', gap: 0, pad: 4, w: 180, fill: 'color/bg/raised', radius: 8, stroke: 'color/border/default', effect: 'Elevation/Popover', parent: w });
  for (const o of options) {
    const r = inst('Menu Item', { State: o === current ? 'Selected' : 'Default' }, m, { name: 'Option ' + o });
    setProp(r, 'Label', o); setProp(r, 'Show icon', false); setProp(r, 'Show check', o === current);
    r.layoutSizingHorizontal = 'FILL';
  }
  arrow.layoutPositioning = 'AUTO';
  return w;
}
// inline text / number editor that Blockly puts over the field while you type
function blocklyFieldEditor(parent, value, w, name) {
  const e = box({ name: name || 'Field editor', dir: 'H', pad: [0, 8, 0, 8], w: w || 44, h: 26, cross: 'center', align: 'center', radius: 999, fill: 'color/block/field', stroke: 'color/border/ink', strokeW: 2, parent });
  LINKS.push([e, 'effect', 'Focus/Ring']);
  const hl = box({ name: 'Selection', dir: 'H', pad: [0, 2, 0, 2], h: 18, cross: 'center', radius: 2, fill: 'color/brand/default', fillOpacity: 0.45, parent: e });
  txt(value, { style: 'Block/Field', color: 'color/text/on-bright', parent: hl, name: 'Value' });
  return e;
}
function blocklyComment(parent, text) {
  const c = box({ name: 'Block comment', dir: 'V', gap: 6, pad: [8, 10, 10, 10], w: 200, fill: 'color/brand/tint', radius: 6, stroke: 'color/border/ink', parent });
  const hd = box({ name: 'Comment header', dir: 'H', gap: 6, cross: 'center', parent: c, wSize: 'fill' });
  iconSlot(hd, 'message', 'color/icon/strong', 14, 'Icon');
  txt('Comment', { style: 'Label/Small', parent: hd, name: 'Title', grow: true });
  iconSlot(hd, 'x', 'color/icon/muted', 14, 'Delete comment');
  txt(text, { style: 'Body/Small', parent: c, name: 'Text', fill: true });
  return c;
}
// the full blocks workspace controls, pinned bottom-right of a canvas (after layout)
function blocklyControls(cv, o = {}) {
  const cw = Math.round(cv.width), chh = Math.round(cv.height);
  const tr = inst('Blockly Trashcan', { Contents: o.trashFull ? 'Full' : 'Empty', State: 'Closed' }, cv, { name: 'Trashcan' });
  tr.x = cw - 20 - 44; tr.y = chh - 20 - 54; tr.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  const z = inst('Blockly Zoom', null, cv, { name: 'Zoom controls' });
  z.x = cw - 20 - 6 - 32; z.y = tr.y - 16 - z.height; z.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  scrollbar(cv, true, Math.round(chh * 0.42), [cw - 9, 40]).constraints = { horizontal: 'MAX', vertical: 'MIN' };
  scrollbar(cv, false, Math.round(cw * 0.36), [Math.round(cw * 0.32), chh - 9]).constraints = { horizontal: 'MIN', vertical: 'MAX' };
}
