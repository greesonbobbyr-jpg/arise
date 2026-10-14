// Patch: iPhone "Add to Home Screen" card, and a backup reminder (logs live only on the phone).
// run once: node e2e/patches/2026-10-14e-ios-backup.js
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected one match, found ' + n + ': ' + a.slice(0, 90)); s = s.split(a).join(b); };

// state: small per-phone reminders (snoozes, last backup)
R("  game: { xp: 0, achievements: {}, prs: [], rank: 'E', quest: null, unseen: [], questCount: 0, achVersion: 0 },\n});",
  "  game: { xp: 0, achievements: {}, prs: [], rank: 'E', quest: null, unseen: [], questCount: 0, achVersion: 0 },\n  hints: {},   // lastExport, backupLater, iosLater (timestamps)\n});");
R("      normPlan();\n", "      normPlan();\n      if (!state.hints || typeof state.hints !== 'object') state.hints = {};\n");

// cards and the shared export
R("async function doInstall() {", `// iPhone: Safari has no install button, and can clear a website's data after about a week without a visit
function isIOS() { const ua = navigator.userAgent || ''; return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
const SHARE_ICON = '<svg class="share-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11v9h12v-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function iosCard(where) {
  if (!isIOS() || isStandalone()) return '';
  if (where === 'home' && (state.hints.iosLater || 0) > Date.now()) return '';
  return '<div class="card quest" id="ios-card-' + where + '" style="border-left-color:var(--cy)"><div class="kicker">iPhone</div><div style="font-weight:600;margin-top:2px">Add Arise to your Home Screen</div>' +
    '<div class="small muted" style="margin-top:4px;line-height:1.5">In Safari, tap <b class="cy">Share</b> ' + SHARE_ICON + ' then <b class="cy">Add to Home Screen</b>. Until you do, Safari can erase your log after about a week without a visit.</div>' +
    (where === 'home' ? '<div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn ghost sm" id="ios-later">Later</button></div>' : '') + '</div>';
}
// with no account, the log lives only on this phone: nudge a backup file every 30 days once there is something to lose
function backupCard() {
  const h = state.hints, now = Date.now();
  if (state.sessions.length < 10 || now - (h.lastExport || 0) < 30 * DAY || (h.backupLater || 0) > now) return '';
  return '<div class="card quest" id="backup-card" style="border-left-color:var(--cy)"><div class="kicker">Backup</div><div style="font-weight:600;margin-top:2px">Your log lives only on this phone</div>' +
    '<div class="small muted" style="margin-top:2px">Save a backup file so a lost or reset phone does not take your ' + state.sessions.length + ' workouts with it.' + (h.lastExport ? ' Last backup ' + C.fmtDate(h.lastExport) + '.' : '') + '</div>' +
    '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn ghost sm" id="backup-later">Later</button><button class="btn primary sm" id="backup-now">Export backup</button></div></div>';
}
function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: 'arise', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'arise-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  state.hints.lastExport = Date.now(); save();
  toast('Backup saved. Keep the file somewhere safe, like cloud storage or email.');
}
async function doInstall() {`);
R(`  $('#p-export').onclick = () => {
    const blob = new Blob([JSON.stringify({ app: 'arise', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'arise-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };`, `  $('#p-export').onclick = exportBackup;`);

// placement: Home (iPhone card near the top, backup after today's plan) and Profile (iPhone steps above Backup & data)
R("installCard() + systemCard() + todayCard() + levelCard()", "installCard() + iosCard('home') + systemCard() + todayCard() + backupCard() + levelCard()");
R(`'<div class="card" style="padding:0"><button class="lrow" id="p-data-toggle"`, `iosCard('profile') + '<div class="card" style="padding:0"><button class="lrow" id="p-data-toggle"`);
R("    const hi = $('#home-install'); if (hi) hi.onclick = doInstall;\n", `    const hi = $('#home-install'); if (hi) hi.onclick = doInstall;
    const il = $('#ios-later'); if (il) il.onclick = () => { state.hints.iosLater = Date.now() + 14 * DAY; save(); render(); };
    const bn = $('#backup-now'); if (bn) bn.onclick = () => { exportBackup(); render(); };
    const bl = $('#backup-later'); if (bl) bl.onclick = () => { state.hints.backupLater = Date.now() + 14 * DAY; save(); render(); toast('Backup reminder snoozed for two weeks.'); };
`);
R('.bm-legend{display:flex;', '.share-i{width:15px;height:15px;vertical-align:-2px;color:var(--cy)}\n.bm-legend{display:flex;');
fs.writeFileSync(F, s);
console.log('iPhone and backup patch applied');
