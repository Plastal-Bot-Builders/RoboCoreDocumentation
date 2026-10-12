// ============================================================================
// Tokens: variables (Primitives / Color / Dimensions), text styles, effect styles
// Starter plans allow one mode per collection, so the Color collection ships a
// single "Dark" mode; a Light mode can be added later on a paid plan.
// ============================================================================

const PRIMITIVES = {
  'navy/1000': '#050D18', 'navy/950': '#07111F', 'navy/925': '#08131F', 'navy/900': '#0A0E27', 'navy/875': '#0A1624',
  'navy/850': '#0D1B2A', 'navy/800': '#12233A', 'navy/775': '#15283F', 'navy/750': '#1A2B42', 'navy/700': '#243954', 'navy/650': '#34507A',
  'slate/500': '#4A5870', 'slate/450': '#6D7F9C', 'slate/400': '#7C8AA0', 'slate/300': '#A7B1C2', 'slate/200': '#D4DAE3', 'slate/50': '#F5F5F5',
  'white': '#FFFFFF', 'scrim': '#02060DB8',
  'teal/300': '#5CF0C8', 'teal/400': '#2EE6B8', 'teal/500': '#00D9A3', 'teal/600': '#00B88A', 'teal/900': '#0B3A35', 'teal/950': '#0A2A2C',
  'yellow/400': '#F7C54A', 'yellow/500': '#F3B51B', 'yellow/600': '#D99E0B', 'yellow/900': '#3D3014', 'yellow/950': '#2A2414',
  'red/500': '#FF5D6C', 'red/950': '#3A1A24', 'orange/500': '#FF9F43', 'orange/950': '#3A2716', 'blue/500': '#5AA9FF', 'blue/950': '#13294A',
  'violet/300': '#C792EA', 'sky/400': '#5EC4FF', 'peach/400': '#FF9F6B', 'green/300': '#9BE38A', 'pink/400': '#FF7AB6',
  'block/output': '#3B78E7', 'block/input': '#8256E8', 'block/control': '#D9730D', 'block/math': '#2A9349', 'block/variables': '#C2409F',
  'block/robotics': '#E0503A', 'block/sensors': '#0E8FA3', 'block/communication': '#5F8A12', 'block/more': '#5B6B82',
};
// 16% alpha versions of the block colours for tinted surfaces (variable alpha drives paint opacity)
for (const c of ['output', 'input', 'control', 'math', 'variables', 'robotics', 'sensors', 'communication']) PRIMITIVES['block/' + c + '-a16'] = PRIMITIVES['block/' + c] + '29';
const BG = ['FRAME_FILL', 'SHAPE_FILL'], BR = ['STROKE_COLOR'], TX = ['TEXT_FILL'], ALLC = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'], IC = ['SHAPE_FILL', 'STROKE_COLOR'];
const SEMANTIC = [
  ['color/bg/app', 'navy/950', BG, 'App background behind panels'],
  ['color/bg/chrome', 'navy/900', BG, 'Top bar, sidebar, status bar'],
  ['color/bg/panel', 'navy/850', BG, 'Panels and cards'],
  ['color/bg/raised', 'navy/800', BG, 'Raised surfaces, menus, flyout'],
  ['color/bg/hover', 'navy/775', BG, 'Hover state on rows and items'],
  ['color/bg/input', 'navy/875', BG, 'Inputs, selects, segmented controls'],
  ['color/bg/editor', 'navy/925', BG, 'Code editor surface'],
  ['color/bg/canvas', 'navy/925', BG, 'Blocks workspace surface'],
  ['color/bg/console', 'navy/1000', BG, 'Serial monitor / console output'],
  ['color/bg/selected', 'teal/950', BG, 'Selected / active item background'],
  ['color/bg/overlay', 'scrim', BG, 'Modal scrim (72% opacity)'],
  ['color/border/subtle', 'navy/750', BR, 'Dividers, panel edges'],
  ['color/border/default', 'navy/700', BR, 'Inputs, cards'],
  ['color/border/strong', 'navy/650', BR, 'Hovered inputs, emphasis'],
  ['color/border/focus', 'teal/500', BR, 'Keyboard focus ring'],
  ['color/text/primary', 'slate/50', TX, 'Primary text — 15.9:1 on panel'],
  ['color/text/secondary', 'slate/300', TX, 'Secondary text — 8.0:1 on panel'],
  ['color/text/tertiary', 'slate/400', TX, 'Tertiary/meta text — 5.0:1 on panel'],
  ['color/text/disabled', 'slate/500', TX, 'Disabled text (non-essential only)'],
  ['color/text/on-accent', 'navy/1000', TX, 'Text on teal/yellow fills — 10.3:1'],
  ['color/text/link', 'teal/400', TX, 'Links'],
  ['color/icon/default', 'slate/300', IC, 'Default icon stroke'],
  ['color/icon/muted', 'slate/400', IC, 'Muted icon stroke'],
  ['color/icon/active', 'teal/500', IC, 'Active icon stroke'],
  ['color/icon/brand', 'yellow/500', IC, 'Brand icon stroke'],
  ['color/icon/strong', 'slate/50', IC, 'Hovered / emphasised icon stroke'],
  ['color/icon/on-accent', 'navy/1000', IC, 'Icon on teal/yellow fills'],
  ['color/icon/disabled', 'slate/500', IC, 'Disabled icon stroke'],
  ['color/bg/inverse', 'slate/50', BG, 'Tooltips'],
  ['color/text/inverse', 'navy/1000', TX, 'Text on inverse surfaces'],
  ['color/control/track-off', 'navy/650', BG, 'Toggle track when off'],
  ['color/control/knob', 'slate/50', BG, 'Toggle knob'],
  ['color/accent/default', 'teal/500', ALLC, 'Primary actions, active states, success'],
  ['color/accent/hover', 'teal/400', ALLC, 'Primary hover'],
  ['color/accent/pressed', 'teal/600', ALLC, 'Primary pressed'],
  ['color/accent/subtle', 'teal/950', ALLC, 'Tinted active backgrounds'],
  ['color/accent/muted', 'teal/900', ALLC, 'Tinted borders on active items'],
  ['color/brand/default', 'yellow/500', ALLC, 'RoboCore brand yellow — identity & highlights'],
  ['color/brand/hover', 'yellow/400', ALLC, 'Brand hover'],
  ['color/brand/pressed', 'yellow/600', ALLC, 'Brand pressed'],
  ['color/brand/subtle', 'yellow/950', ALLC, 'Tinted brand background'],
  ['color/status/success', 'teal/500', ALLC, 'Connected, compiled, uploaded'],
  ['color/status/success-subtle', 'teal/950', ALLC, ''],
  ['color/status/warning', 'orange/500', ALLC, 'Warnings'],
  ['color/status/warning-subtle', 'orange/950', ALLC, ''],
  ['color/status/error', 'red/500', ALLC, 'Errors, failed uploads'],
  ['color/status/error-subtle', 'red/950', ALLC, ''],
  ['color/status/info', 'blue/500', ALLC, 'Information'],
  ['color/status/info-subtle', 'blue/950', ALLC, ''],
  ['color/block/output', 'block/output', ALLC, 'Output blocks — LEDs, pins, tones'],
  ['color/block/input', 'block/input', ALLC, 'Input blocks — digital/analog reads'],
  ['color/block/control', 'block/control', ALLC, 'Control blocks — start, loops, waits, if'],
  ['color/block/math', 'block/math', ALLC, 'Math & logic blocks'],
  ['color/block/variables', 'block/variables', ALLC, 'Variable blocks'],
  ['color/block/robotics', 'block/robotics', ALLC, 'Robotics blocks — motors, servos, drive'],
  ['color/block/sensors', 'block/sensors', ALLC, 'Sensor blocks — ultrasonic, line, IMU, temp'],
  ['color/block/communication', 'block/communication', ALLC, 'Communication — serial print/read'],
  ['color/block/more', 'block/more', ALLC, 'Functions / more'],
  ['color/block/text', 'white', TX, 'Block label text'],
  ...['output', 'input', 'control', 'math', 'variables', 'robotics', 'sensors', 'communication'].map(c => ['color/block/' + c + '-subtle', 'block/' + c + '-a16', BG, 'Tinted ' + c + ' surface (16%)']),
  ['color/syntax/keyword', 'violet/300', TX, 'if, for, while, return, const'],
  ['color/syntax/type', 'sky/400', TX, 'void, int, bool, Serial'],
  ['color/syntax/function', 'yellow/500', TX, 'pinMode, digitalWrite, delay'],
  ['color/syntax/constant', 'peach/400', TX, 'HIGH, LOW, OUTPUT, LED_BUILTIN'],
  ['color/syntax/number', 'peach/400', TX, 'Numeric literals'],
  ['color/syntax/string', 'green/300', TX, 'String literals'],
  ['color/syntax/comment', 'slate/450', TX, 'Comments — 4.6:1 on editor'],
  ['color/syntax/preprocessor', 'pink/400', TX, '#include, #define'],
  ['color/syntax/plain', 'slate/200', TX, 'Identifiers, punctuation'],
  ['color/syntax/line-number', 'slate/500', TX, 'Gutter line numbers'],
  ['color/syntax/line-number-active', 'slate/300', TX, 'Current line number'],
];
const DIMENSIONS = [
  ['spacing/0', 0, ['GAP']], ['spacing/050', 2, ['GAP']], ['spacing/100', 4, ['GAP']], ['spacing/150', 6, ['GAP']], ['spacing/200', 8, ['GAP']],
  ['spacing/300', 12, ['GAP']], ['spacing/400', 16, ['GAP']], ['spacing/500', 20, ['GAP']], ['spacing/600', 24, ['GAP']], ['spacing/800', 32, ['GAP']],
  ['spacing/1000', 40, ['GAP']], ['spacing/1200', 48, ['GAP']],
  ['radius/xs', 4, ['CORNER_RADIUS']], ['radius/sm', 6, ['CORNER_RADIUS']], ['radius/md', 8, ['CORNER_RADIUS']], ['radius/lg', 12, ['CORNER_RADIUS']],
  ['radius/xl', 16, ['CORNER_RADIUS']], ['radius/full', 999, ['CORNER_RADIUS']],
  ['size/top-bar', 56, ['WIDTH_HEIGHT']], ['size/status-bar', 28, ['WIDTH_HEIGHT']], ['size/sidebar', 216, ['WIDTH_HEIGHT']], ['size/sidebar-collapsed', 64, ['WIDTH_HEIGHT']],
  ['size/control-sm', 28, ['WIDTH_HEIGHT']], ['size/control-md', 32, ['WIDTH_HEIGHT']], ['size/control-lg', 40, ['WIDTH_HEIGHT']],
];
// [name, family-key, style, size, lineHeight, letterSpacing%, textCase, usage]
const TEXT_STYLES = [
  ['Brand/Wordmark', 'brand', 'Bold', 18, 24, 2, null, 'Product name next to the logo'],
  ['Heading/Display', 'ui', 'Semi Bold', 30, 38, -1, null, 'Home greeting'],
  ['Heading/H1', 'ui', 'Semi Bold', 22, 30, -0.5, null, 'Screen titles, doc titles'],
  ['Heading/H2', 'ui', 'Semi Bold', 17, 24, 0, null, 'Section titles, dialog titles'],
  ['Heading/H3', 'ui', 'Semi Bold', 15, 22, 0, null, 'Card titles'],
  ['Body/Default', 'ui', 'Regular', 14, 20, 0, null, 'Body copy'],
  ['Body/Medium', 'ui', 'Medium', 14, 20, 0, null, 'Emphasised body, nav labels'],
  ['Body/Small', 'ui', 'Regular', 13, 18, 0, null, 'Descriptions, secondary copy'],
  ['Label/Default', 'ui', 'Medium', 13, 16, 0, null, 'Buttons, tabs, controls'],
  ['Label/Strong', 'ui', 'Semi Bold', 13, 16, 0, null, 'Primary buttons, emphasised labels'],
  ['Label/Small', 'ui', 'Medium', 12, 16, 0, null, 'Badges, meta labels'],
  ['Caption/Default', 'ui', 'Regular', 12, 16, 0, null, 'Captions, timestamps'],
  ['Caption/Overline', 'ui', 'Semi Bold', 11, 16, 6, 'UPPER', 'Section labels'],
  ['Code/Default', 'mono', 'Regular', 13, 20, 0, null, 'Code editor, compiler output'],
  ['Code/Small', 'mono', 'Regular', 12, 18, 0, null, 'Serial monitor, inline code'],
  ['Block/Label', 'ui', 'Semi Bold', 13, 16, 0, null, 'Text on programming blocks'],
  ['Block/Field', 'ui', 'Semi Bold', 12, 16, 0, null, 'Values inside block fields'],
];

async function setupFonts() {
  const fonts = await figma.listAvailableFontsAsync();
  const fam = {};
  for (const f of fonts) { (fam[f.fontName.family] = fam[f.fontName.family] || new Set()).add(f.fontName.style); }
  FONT_MONO = ['JetBrains Mono', 'Roboto Mono', 'IBM Plex Mono', 'Source Code Pro', 'Fira Code'].find(f => fam[f]) || 'Inter';
  FONT_BRAND = ['Barlow', 'Inter'].find(f => fam[f]) || 'Inter';
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
  const famKey = { ui: 'Inter', mono: FONT_MONO, brand: FONT_BRAND };
  const toLoad = {};
  for (const [name, fk, style, size, lh, ls, tc] of TEXT_STYLES) {
    const font = pick(famKey[fk], style);
    TS[name] = { font, size, lh, ls, tc };
    toLoad[font.family + '|' + font.style] = font;
  }
  // extra weights used directly
  for (const f of [pick('Inter', 'Bold'), pick('Inter', 'Regular'), pick('Inter', 'Medium'), pick('Inter', 'Semi Bold'), pick(FONT_MONO, 'Medium'), pick(FONT_MONO, 'Bold'), pick(FONT_BRAND, 'Semi Bold')]) toLoad[f.family + '|' + f.style] = f;
  await Promise.all(Object.values(toLoad).map(f => figma.loadFontAsync(f)));
  REPORT.fonts = { mono: FONT_MONO, brand: FONT_BRAND, loaded: Object.keys(toLoad) };
}

async function setupTokens() {
  const colls = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
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
    if (desc) v.description = desc;
    V[name] = v;
    return v;
  };
  const css = (n) => 'var(--rc-' + n.replace(/\//g, '-') + ')';
  const P = getColl('Primitives', 'Value');
  P.hiddenFromPublishing = true;
  const prim = {};
  for (const [k, h] of Object.entries(PRIMITIVES)) VAR_HEX[k] = h;
  for (const [n, p] of SEMANTIC) VAR_HEX[n] = PRIMITIVES[p];
  for (const [k, h] of Object.entries(PRIMITIVES)) prim[k] = mk(P, k, 'COLOR', hexToRgba(h), [], css('primitive/' + k), h.toUpperCase());
  const C = getColl('Color', 'Dark');
  for (const [n, p, sc, desc] of SEMANTIC) mk(C, n, 'COLOR', { type: 'VARIABLE_ALIAS', id: prim[p].id }, sc, css(n), desc);
  const D = getColl('Dimensions', 'Value');
  for (const [n, v, sc] of DIMENSIONS) mk(D, n, 'FLOAT', v, sc, css(n));
  REPORT.counts.variables = Object.keys(V).length;

  // text styles
  const localTS = await figma.getLocalTextStylesAsync();
  for (const [name, fk, style, size, lh, ls, tc, usage] of TEXT_STYLES) {
    const spec = TS[name];
    let s = localTS.find(x => x.name === name) || figma.createTextStyle();
    s.name = name; s.fontName = spec.font; s.fontSize = size;
    s.lineHeight = { unit: 'PIXELS', value: lh };
    s.letterSpacing = { unit: 'PERCENT', value: ls };
    s.textCase = tc || 'ORIGINAL';
    s.description = usage + ' — ' + spec.font.family + ' ' + spec.font.style + ' ' + size + '/' + lh;
    spec.id = s.id;
  }
  // effect styles
  const k = (a) => ({ r: 0, g: 0, b: 0, a });
  const sh = (a, y, r) => ({ type: 'DROP_SHADOW', color: k(a), offset: { x: 0, y }, radius: r, spread: 0, visible: true, blendMode: 'NORMAL' });
  const EFFECTS = [
    ['Elevation/1 Raised', [sh(0.30, 1, 2)], 'Cards and raised controls'],
    ['Elevation/2 Popover', [sh(0.30, 2, 6), sh(0.45, 12, 32)], 'Menus, dropdowns, flyouts, toasts'],
    ['Elevation/3 Modal', [sh(0.55, 24, 64)], 'Dialogs'],
    ['Elevation/Drag', [sh(0.45, 10, 24)], 'Block being dragged'],
    ['Focus/Ring', [{ type: 'DROP_SHADOW', color: { r: 0, g: 217 / 255, b: 163 / 255, a: 0.45 }, offset: { x: 0, y: 0 }, radius: 0, spread: 3, visible: true, blendMode: 'NORMAL' }], 'Keyboard focus ring (with 1px teal stroke)'],
  ];
  const localES = await figma.getLocalEffectStylesAsync();
  for (const [name, eff, desc] of EFFECTS) {
    let s = localES.find(x => x.name === name) || figma.createEffectStyle();
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
  REPORT.counts.styleLinks = (REPORT.counts.styleLinks || 0) + ok;
  REPORT.counts.styleLinkFailures = (REPORT.counts.styleLinkFailures || 0) + fail;
}
