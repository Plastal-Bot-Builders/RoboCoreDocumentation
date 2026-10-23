// ============================================================================
// Entry point. Runs last so every file above is loaded.
// "icon" (the original menu item) builds every round; "forward" / "orbit" build one page.
// ============================================================================

const AI_RUN = figma.command === 'orbit' ? ['orbit'] : figma.command === 'forward' ? ['icon'] : ['icon', 'orbit'];
(async () => { for (const v of AI_RUN) await buildAppIconPage(v); })().then(() => {
  figma.closePlugin('RoboCore app icon: ' + AI_RUN.map(v => AI_VERSIONS[v].page).join(' + ') + ' built' + (REPORT.errors.length ? ' — ' + REPORT.errors.length + ' error(s)' : ''));
}).catch(async (e) => {
  REPORT.errors.push('FATAL: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(0, 6).join(' | '));
  try { if (await openReview()) await sendReport(); } catch (x) { /* ignore */ }
  figma.closePlugin('RoboCore app icon builder stopped: ' + e.message);
});
