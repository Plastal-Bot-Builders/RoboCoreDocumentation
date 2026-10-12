// ============================================================================
// Tokens — the RoboCore V2 box palette: navy ink + RoboCore yellow on cream paper.
// Monochrome by design: every colour is the box navy, a navy tint, the box yellow
// (plus its ochre contour shade) or paper. Collections: Primitives (hidden),
// Color (mode "Paper"), Dimensions. Starter plans allow one mode per collection.
// ============================================================================

const PRIMITIVES = {
  // navy ink (box) and its tints over paper
  'navy/100': '#1B2A41', 'navy/deep': '#111C2D', 'navy/88': '#364357', 'navy/72': '#5B6573', 'navy/66': '#6A7380', 'navy/58': '#7B828D',
  'navy/40': '#A4A8AD', 'navy/32': '#B6B9BB', 'navy/24': '#C8CACA', 'navy/16': '#DBDBD8', 'navy/10': '#E7E5E0', 'navy/6': '#F0EDE7',
  'navy/scrim': '#1B2A4173',
  // RoboCore yellow (box field) and its ochre contour shade
  'yellow/100': '#F2B01E', 'yellow/hover': '#F5C04A', 'yellow/pressed': '#D99A0F', 'yellow/tint': '#FCE9BF', 'yellow/soft': '#FDF1D5',
  'ochre/ink': '#8A5A00', 'ochre/contour': '#D9971A',
  // paper
  'paper/cream': '#F7F1E3', 'paper/sheet': '#FFFCF5', 'paper/white': '#FFFFFF',
};
const BG = ['FRAME_FILL', 'SHAPE_FILL'], BR = ['STROKE_COLOR'], TX = ['TEXT_FILL'], ALLC = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'], IC = ['SHAPE_FILL', 'STROKE_COLOR'];
const SEMANTIC = [
  ['color/bg/app', 'paper/cream', BG, 'App background (box cream)'],
  ['color/bg/chrome', 'paper/cream', BG, 'Sidebar and status bar'],
  ['color/bg/brand', 'yellow/100', BG, 'Top bar and brand panels (box yellow)'],
  ['color/bg/panel', 'paper/sheet', BG, 'Panels, cards, editor'],
  ['color/bg/raised', 'paper/white', BG, 'Menus, dialogs'],
  ['color/bg/input', 'paper/white', BG, 'Inputs and selects'],
  ['color/bg/hover', 'navy/6', BG, 'Hover on rows and items'],
  ['color/bg/subtle', 'navy/6', BG, 'Quiet fills (thumbnails, segmented control)'],
  ['color/bg/editor', 'paper/sheet', BG, 'Code editor'],
  ['color/bg/canvas', 'paper/sheet', BG, 'Blocks workspace'],
  ['color/bg/console', 'paper/sheet', BG, 'Serial / compiler output'],
  ['color/bg/selected', 'yellow/tint', BG, 'Selected / active item'],
  ['color/bg/inverse', 'navy/100', BG, 'Tooltips, error toasts, primary buttons'],
  ['color/bg/overlay', 'navy/scrim', BG, 'Modal scrim (45% navy)'],
  ['color/border/subtle', 'navy/10', BR, 'Dividers, panel edges'],
  ['color/border/default', 'navy/16', BR, 'Cards, inputs'],
  ['color/border/strong', 'navy/40', BR, 'Hovered inputs'],
  ['color/border/ink', 'navy/100', BR, 'Line-art outlines, focus, selected'],
  ['color/text/primary', 'navy/100', TX, 'Primary text — 13.6:1 on paper'],
  ['color/text/secondary', 'navy/72', TX, 'Secondary text — 5.8:1 on paper'],
  ['color/text/tertiary', 'navy/66', TX, 'Meta text — 4.7:1 on paper'],
  ['color/text/disabled', 'navy/40', TX, 'Disabled (non-essential only)'],
  ['color/text/on-ink', 'paper/cream', TX, 'Text on navy — 12.8:1'],
  ['color/text/brand', 'ochre/ink', TX, 'Yellow-family text (warnings, values) — 5.8:1'],
  ['color/icon/default', 'navy/72', IC, 'Default icon'],
  ['color/icon/muted', 'navy/58', IC, 'Muted icon'],
  ['color/icon/strong', 'navy/100', IC, 'Active / emphasised icon'],
  ['color/icon/on-ink', 'paper/cream', IC, 'Icon on navy'],
  ['color/icon/brand', 'yellow/100', IC, 'Yellow icon on navy'],
  ['color/icon/disabled', 'navy/32', IC, 'Disabled icon'],
  ['color/ink/default', 'navy/100', ALLC, 'Primary actions, connected, success'],
  ['color/ink/hover', 'navy/88', ALLC, 'Primary hover'],
  ['color/ink/pressed', 'navy/deep', ALLC, 'Primary pressed'],
  ['color/brand/default', 'yellow/100', ALLC, 'RoboCore yellow — brand, active indicator, progress'],
  ['color/brand/hover', 'yellow/hover', ALLC, ''],
  ['color/brand/pressed', 'yellow/pressed', ALLC, ''],
  ['color/brand/tint', 'yellow/tint', ALLC, 'Selected backgrounds'],
  ['color/brand/soft', 'yellow/soft', ALLC, 'Quiet brand backgrounds'],
  ['color/decor/contour', 'ochre/contour', IC, 'Topography contour lines (decoration only)'],
  ['color/block/control', 'yellow/100', ALLC, 'Control blocks: start, loops, waits, if'],
  ['color/block/action', 'navy/100', ALLC, 'Action blocks: outputs, motors, serial, variables'],
  ['color/block/value', 'paper/white', ALLC, 'Value blocks: sensors, inputs, maths (outlined)'],
  ['color/block/outline', 'navy/100', ALLC, 'Block outline (line-art)'],
  ['color/block/field', 'paper/white', ALLC, 'Field pills'],
  ['color/control/track-off', 'navy/24', BG, 'Toggle track off'],
  ['color/control/knob', 'paper/white', BG, 'Toggle knob'],
  ['color/syntax/keyword', 'navy/100', TX, 'Keywords & types (bold)'],
  ['color/syntax/function', 'navy/100', TX, 'Functions'],
  ['color/syntax/value', 'ochre/ink', TX, 'Numbers, strings, constants'],
  ['color/syntax/comment', 'navy/66', TX, 'Comments'],
  ['color/syntax/plain', 'navy/88', TX, 'Identifiers, punctuation'],
  ['color/syntax/line-number', 'navy/40', TX, 'Gutter'],
  ['color/syntax/line-number-active', 'navy/100', TX, 'Current line number'],
];
const DIMENSIONS = [
  ['spacing/0', 0, ['GAP']], ['spacing/050', 2, ['GAP']], ['spacing/100', 4, ['GAP']], ['spacing/150', 6, ['GAP']], ['spacing/200', 8, ['GAP']],
  ['spacing/300', 12, ['GAP']], ['spacing/400', 16, ['GAP']], ['spacing/500', 20, ['GAP']], ['spacing/600', 24, ['GAP']], ['spacing/800', 32, ['GAP']],
  ['spacing/1000', 40, ['GAP']], ['spacing/1200', 48, ['GAP']],
  ['radius/xs', 4, ['CORNER_RADIUS']], ['radius/sm', 6, ['CORNER_RADIUS']], ['radius/md', 8, ['CORNER_RADIUS']], ['radius/lg', 12, ['CORNER_RADIUS']],
  ['radius/full', 999, ['CORNER_RADIUS']],
  ['size/top-bar', 56, ['WIDTH_HEIGHT']], ['size/status-bar', 28, ['WIDTH_HEIGHT']], ['size/sidebar', 208, ['WIDTH_HEIGHT']], ['size/sidebar-collapsed', 64, ['WIDTH_HEIGHT']],
  ['size/control', 32, ['WIDTH_HEIGHT']],
];
// [name, family-key, style, size, lineHeight, letterSpacing%, textCase, usage]   cond = Barlow Condensed (box headlines)
const TEXT_STYLES = [
  ['Brand/Wordmark', 'cond', 'Bold', 20, 24, 2, 'UPPER', '"IDE" next to the logo'],
  ['Heading/Display', 'cond', 'Bold', 36, 40, 0, 'UPPER', 'Home hero (box front style)'],
  ['Heading/H1', 'cond', 'Bold', 26, 32, 1, 'UPPER', 'Screen titles'],
  ['Heading/H2', 'cond', 'SemiBold', 18, 24, 3, 'UPPER', 'Section and dialog titles'],
  ['Heading/H3', 'ui', 'SemiBold', 15, 20, 0, null, 'Card titles'],
  ['Body/Default', 'ui', 'Regular', 14, 20, 0, null, 'Body copy'],
  ['Body/Small', 'ui', 'Regular', 13, 18, 0, null, 'Descriptions'],
  ['Label/Default', 'ui', 'Medium', 13, 16, 0, null, 'Controls, tabs, nav'],
  ['Label/Strong', 'ui', 'SemiBold', 13, 16, 0, null, 'Buttons, emphasis'],
  ['Label/Small', 'ui', 'Medium', 12, 16, 0, null, 'Badges, meta'],
  ['Caption/Default', 'ui', 'Regular', 12, 16, 0, null, 'Captions, timestamps'],
  ['Caption/Overline', 'cond', 'SemiBold', 12, 16, 8, 'UPPER', 'Section labels'],
  ['Code/Default', 'mono', 'Regular', 13, 20, 0, null, 'Code editor, output'],
  ['Code/Small', 'mono', 'Regular', 12, 18, 0, null, 'Serial monitor'],
  ['Block/Label', 'ui', 'SemiBold', 13, 16, 0, null, 'Text on blocks'],
  ['Block/Field', 'ui', 'SemiBold', 12, 16, 0, null, 'Values in block fields'],
];
let FONT_COND = 'Barlow Condensed', FONT_UI = 'Barlow';
let PICK = null;

async function setupFonts() {
  const fonts = await figma.listAvailableFontsAsync();
  const fam = {};
  for (const f of fonts) { (fam[f.fontName.family] = fam[f.fontName.family] || new Set()).add(f.fontName.style); }
  FONT_UI = fam['Barlow'] ? 'Barlow' : 'Inter';
  FONT_COND = fam['Barlow Condensed'] ? 'Barlow Condensed' : FONT_UI;
  FONT_MONO = ['JetBrains Mono', 'Roboto Mono', 'IBM Plex Mono', 'Source Code Pro'].find(f => fam[f]) || FONT_UI;
  FONT_BRAND = FONT_COND;
  const pick = (family, style) => {
    const s = fam[family];
    if (s) {
      if (s.has(style)) return { family, style };
      const alt = [...s].find(x => x.replace(/\s/g, '').toLowerCase() === style.replace(/\s/g, '').toLowerCase());
      if (alt) return { family, style: alt };
      if (s.has('Regular')) return { family, style: 'Regular' };
    }
    return { family: 'Inter', style: 'Regular' };
  };
  PICK = pick;
  const famKey = { ui: FONT_UI, mono: FONT_MONO, cond: FONT_COND };
  const toLoad = {};
  for (const [name, fk, style, size, lh, ls, tc] of TEXT_STYLES) {
    const font = pick(famKey[fk], style);
    TS[name] = { font, size, lh, ls, tc };
    toLoad[font.family + '|' + font.style] = font;
  }
  for (const f of [pick('Inter', 'Regular'), pick(FONT_UI, 'Bold'), pick(FONT_UI, 'SemiBold'), pick(FONT_MONO, 'Bold'), pick(FONT_COND, 'Bold')]) toLoad[f.family + '|' + f.style] = f;
  await Promise.all(Object.values(toLoad).map(f => figma.loadFontAsync(f)));
  REPORT.fonts = { ui: FONT_UI, cond: FONT_COND, mono: FONT_MONO, loaded: Object.keys(toLoad) };
}

async function setupTokens() {
  const colls = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  const keep = new Set();
  const getColl = (name, mode) => {
    let c = colls.find(x => x.name === name);
    if (!c) c = figma.variables.createVariableCollection(name);
    if (c.modes[0].name !== mode) c.renameMode(c.modes[0].modeId, mode);
    return c;
  };
  const mk = (coll, name, type, value, scopes, web, desc) => {
    let v = vars.find(x => x.name === name && x.variableCollectionId === coll.id);
    if (!v) v = figma.variables.createVariable(name, coll, type);
    v.setValueForMode(coll.modes[0].modeId, value);
    v.scopes = scopes;
    if (web) v.setVariableCodeSyntax('WEB', web);
    v.description = desc || '';
    V[name] = v; keep.add(v.id);
    return v;
  };
  const css = (n) => 'var(--rc-' + n.replace(/\//g, '-') + ')';
  for (const [k, h] of Object.entries(PRIMITIVES)) VAR_HEX[k] = h;
  for (const [n, p] of SEMANTIC) VAR_HEX[n] = PRIMITIVES[p];
  const P = getColl('Primitives', 'Value');
  P.hiddenFromPublishing = true;
  const prim = {};
  for (const [k, h] of Object.entries(PRIMITIVES)) prim[k] = mk(P, k, 'COLOR', hexToRgba(h), [], css('primitive/' + k), h.toUpperCase());
  const C = getColl('Color', 'Paper');
  for (const [n, p, sc, desc] of SEMANTIC) mk(C, n, 'COLOR', { type: 'VARIABLE_ALIAS', id: prim[p].id }, sc, css(n), desc);
  const D = getColl('Dimensions', 'Value');
  for (const [n, v, sc] of DIMENSIONS) mk(D, n, 'FLOAT', v, sc, css(n));
  // remove variables left over from earlier builds (the v1 dark palette)
  const ours = new Set([P.id, C.id, D.id]);
  let removed = 0;
  for (const v of vars) if (ours.has(v.variableCollectionId) && !keep.has(v.id)) { try { v.remove(); removed++; } catch (e) { /* in use */ } }
  REPORT.counts.variables = Object.keys(V).length;
  REPORT.counts.variablesRemoved = removed;

  const localTS = await figma.getLocalTextStylesAsync();
  const tsNames = new Set(TEXT_STYLES.map(t => t[0]));
  const liveTS = [];
  for (const s of localTS) { if (!tsNames.has(s.name)) { try { s.remove(); } catch (e) { /* ignore */ } } else liveTS.push(s); }
  for (const [name, fk, style, size, lh, ls, tc, usage] of TEXT_STYLES) {
    const spec = TS[name];
    const s = liveTS.find(x => x.name === name) || figma.createTextStyle();
    s.name = name; s.fontName = spec.font; s.fontSize = size;
    s.lineHeight = { unit: 'PIXELS', value: lh };
    s.letterSpacing = { unit: 'PERCENT', value: ls };
    s.textCase = tc || 'ORIGINAL';
    s.description = usage + ' — ' + spec.font.family + ' ' + spec.font.style + ' ' + size + '/' + lh;
    spec.id = s.id;
  }
  const ink = (a) => ({ r: 27 / 255, g: 42 / 255, b: 65 / 255, a });
  const sh = (a, y, r) => ({ type: 'DROP_SHADOW', color: ink(a), offset: { x: 0, y }, radius: r, spread: 0, visible: true, blendMode: 'NORMAL' });
  const EFFECTS = [
    ['Elevation/Popover', [sh(0.10, 2, 6), sh(0.14, 10, 28)], 'Menus, dropdowns, toasts'],
    ['Elevation/Modal', [sh(0.22, 20, 56)], 'Dialogs'],
    ['Elevation/Drag', [sh(0.22, 8, 18)], 'Block being dragged'],
    ['Focus/Ring', [{ type: 'DROP_SHADOW', color: { r: 242 / 255, g: 176 / 255, b: 30 / 255, a: 0.85 }, offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: 'NORMAL' }], 'Keyboard focus: navy border + yellow halo'],
  ];
  const localES = await figma.getLocalEffectStylesAsync();
  const esNames = new Set(EFFECTS.map(e => e[0]));
  const liveES = [];
  for (const s of localES) { if (!esNames.has(s.name)) { try { s.remove(); } catch (e) { /* ignore */ } } else liveES.push(s); }
  for (const [name, eff, desc] of EFFECTS) {
    const s = liveES.find(x => x.name === name) || figma.createEffectStyle();
    s.name = name; s.effects = eff; s.description = desc;
    ES[name] = s;
  }
  REPORT.counts.textStyles = TEXT_STYLES.length;
  REPORT.counts.effectStyles = EFFECTS.length;
}

async function applyLinks() {
  let ok = 0, fail = 0;
  for (const [node, kind, name] of LINKS) {
    try {
      if (node.removed) continue;
      if (kind === 'text') await node.setTextStyleIdAsync(TS[name].id);
      else if (kind === 'effect') await node.setEffectStyleIdAsync(ES[name].id);
      ok++;
    } catch (e) { fail++; if (fail < 10) warn('link ' + kind + ' ' + name + ': ' + e.message); }
  }
  LINKS.length = 0;
  for (const fn of POST) { try { fn(); } catch (e) { warn('post: ' + e.message); } }
  POST.length = 0;
  REPORT.counts.styleLinks = (REPORT.counts.styleLinks || 0) + ok;
  REPORT.counts.styleLinkFailures = (REPORT.counts.styleLinkFailures || 0) + fail;
}
