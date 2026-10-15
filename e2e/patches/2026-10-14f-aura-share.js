// Patch: the shadow aura becomes a reward (every muscle region trained in a week), and Share / QR code invites.
// run once: node e2e/patches/2026-10-14f-aura-share.js
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected one match, found ' + n + ': ' + a.slice(0, 90)); s = s.split(a).join(b); };

// ---- the aura only appears when asked for
R(`'"><div class="stage">' + ring + aura + s + '</div>'`, `'"><div class="stage">' + ring + (o.aura ? aura : '') + s + '</div>'`);

// ---- body map: sets per region this week, aura when all 16 are trained, and what is still missing
R(`function bodyMap() {
  if (!window.ARISE_ANATOMY) return '';
  const cut = Date.now() - 7 * DAY; bmSets = {};
  for (const s of state.sessions) if (s.date >= cut) for (const e of s.entries || []) {
    const ex = exById[e.exId]; if (!ex) continue; const n = e.sets.filter(x => !x.warmup).length; if (!n) continue;
    for (const k of (BM_MUSCLE[ex.muscle] || BM_GROUP[ex.group] || [])) bmSets[k] = (bmSets[k] || 0) + n;
  }
  const rank = currentRank(), sex = P().sex === 'f' ? 'f' : 'm';`, `// working sets per body-map region over the last 7 days
function weekSets(now) {
  const cut = (now || Date.now()) - 7 * DAY, out = {};
  for (const s of state.sessions) if (s.date >= cut) for (const e of s.entries || []) {
    const ex = exById[e.exId]; if (!ex) continue; const n = e.sets.filter(x => !x.warmup).length; if (!n) continue;
    for (const k of (BM_MUSCLE[ex.muscle] || BM_GROUP[ex.group] || [])) out[k] = (out[k] || 0) + n;
  }
  return out;
}
function auraLine(st) {
  if (st.full) return '<div class="bm-aura on"><b>Shadow aura awakened</b> · every muscle trained this week</div>';
  const miss = st.missing.map(k => C.AURA_NAMES[k]);
  return '<div class="bm-aura"><b>Shadow aura</b> · ' + st.done + ' / ' + st.total + ' trained this week<span class="miss">Missing: ' + esc(miss.slice(0, 6).join(', ') + (miss.length > 6 ? ' and ' + (miss.length - 6) + ' more' : '')) + '</span></div>';
}
function bodyMap() {
  if (!window.ARISE_ANATOMY) return '';
  bmSets = weekSets();
  const st = C.auraStatus(bmSets);
  const rank = currentRank(), sex = P().sex === 'f' ? 'f' : 'm';`);
R(`charSVG(sex, 'front', { lit: bmSets, rank, id: 'bm-f', label: 'Front', tap: true }) + charSVG(sex, 'back', { lit: bmSets, rank, id: 'bm-b', label: 'Back', tap: true }) + '</div>' +`,
  `charSVG(sex, 'front', { lit: bmSets, rank, aura: st.full, id: 'bm-f', label: 'Front', tap: true }) + charSVG(sex, 'back', { lit: bmSets, rank, aura: st.full, id: 'bm-b', label: 'Back', tap: true }) + '</div>' + auraLine(st) +`);
R(`<span><i style="background:#6A4BFF;box-shadow:0 0 6px #6A4BFF"></i>Aura grows with your rank</span>`, `<span><i style="background:#6A4BFF;box-shadow:0 0 6px #6A4BFF"></i>Aura: train every muscle in a week</span>`);

// ---- the moment it unlocks: once, on the workout that completes the set
R(`  const rankBefore = currentRank(), tiersBefore = tierMap();
  state.sessions.push(session);`, `  const rankBefore = currentRank(), tiersBefore = tierMap(), auraBefore = C.auraStatus(weekSets()).full;
  state.sessions.push(session);`);
R(`  if (unseenIds().length) await revealTitles(unseenIds());
  if (C.RANK_ORDER.indexOf(rankAfter)`, `  if (unseenIds().length) await revealTitles(unseenIds());
  if (!auraBefore && C.auraStatus(weekSets()).full) await ariseMoment(P().sex, { title: 'AWAKENED', sub: 'Shadow aura · every muscle trained this week' });
  if (C.RANK_ORDER.indexOf(rankAfter)`);
R(`function ariseMoment(sex) {`, `function ariseMoment(sex, words) {`);
R(`d.innerHTML = charSVG(sex, 'front', { lit: all, rank: 'S', id: 'ar' }) + '<div class="ar-t">ARISE</div><div class="ar-s">The System has registered you</div>';`,
  `const w = words || { title: 'ARISE', sub: 'The System has registered you' };
    d.innerHTML = charSVG(sex, 'front', { lit: all, rank: 'S', aura: true, id: 'ar' }) + '<div class="ar-t">' + esc(w.title) + '</div><div class="ar-s">' + esc(w.sub) + '</div>';`);
R(`['chest', 'delts', 'abs', 'obliques', 'quads', 'adductors', 'glutes', 'biceps', 'triceps', 'forearms', 'calves', 'traps'].forEach(k => all[k] = 8);`, `C.AURA_REGIONS.forEach(k => all[k] = 8);`);
// setup cards: no aura before you have trained
R(`charSVG(sx, 'front', { lit: SU_LIT, rank: su.sex === sx ? 'B' : 'E', id: 'su-' + sx })`, `charSVG(sx, 'front', { lit: SU_LIT, rank: 'E', id: 'su-' + sx })`);

// ---- invite a hunter: share link and QR code
R(`<button class="btn primary sm" id="p-card">Make card</button></div></div>' +`, `<button class="btn primary sm" id="p-card">Make card</button></div></div>' +
    '<div class="card invite"><div class="kicker">Invite a hunter</div><div class="small muted" style="margin-top:2px">Friends get their own Arise and their own log. Nothing of yours is shared.</div>' +
    '<div class="row" style="gap:8px;margin-top:10px"><button class="btn primary sm grow" id="p-share">Share link</button><button class="btn ghost sm grow" id="p-qr">QR code</button></div></div>' +`);
R(`  $('#p-card').onclick = rankCard;`, `  $('#p-card').onclick = rankCard;
  $('#p-share').onclick = shareApp;
  $('#p-qr').onclick = showQR;`);
R(`async function doInstall() {`, `// ---------- invite: the app's own address, shared or shown as a QR code ----------
function appUrl() { return location.origin + location.pathname.replace(/index\\.html$/, ''); }
const SHARE_TEXT = 'Train like a Hunter. Arise is a free strength tracker: open the link and add it to your home screen.';
async function shareApp() {
  const url = appUrl();
  if (navigator.share) { try { await navigator.share({ title: 'Arise', text: SHARE_TEXT, url }); } catch (e) {} return; }
  try { await navigator.clipboard.writeText(url); toast('Link copied. Paste it to a friend.'); }
  catch (e) { showQR(); }
}
// QR as SVG: dark squares on a light panel (every camera reads that), four-module quiet zone
function qrSVG(text) {
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), m = 4, size = n + m * 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
  return '<svg class="qr" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="QR code for ' + esc(text) + '"><rect width="' + size + '" height="' + size + '" fill="#F2FDFF"/><path d="' + d + '" fill="#04121A"/></svg>';
}
function showQR() {
  if (document.querySelector('.qr-fx')) return;
  const url = appUrl(), d = document.createElement('div');
  d.className = 'qr-fx'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Invite a hunter');
  d.innerHTML = '<div class="qr-win"><div class="su-head"><span class="su-bang">!</span><span class="su-sys">INVITE A HUNTER</span></div>' +
    '<div class="qr-box">' + (window.qrcode ? qrSVG(url) : '') + '</div>' +
    '<div class="qr-url">' + esc(url) + '</div><p class="qr-hint">Point a phone camera here. It opens Arise; then add it to the home screen.</p>' +
    '<div class="row" style="gap:8px"><button class="btn primary grow" id="qr-share">Share link</button><button class="btn ghost grow" id="qr-close">Close</button></div></div>';
  document.body.appendChild(d);
  const close = () => d.remove();
  d.querySelector('#qr-close').onclick = close;
  d.querySelector('#qr-share').onclick = shareApp;
  d.onclick = e => { if (e.target === d) close(); };
}
async function doInstall() {`);

// ---- styles
R('.share-i{', `.bm-aura{margin:10px 4px 0;text-align:center;font-size:12px;color:var(--tx2);line-height:1.5}
.bm-aura b{color:#9C8CFF;font-family:var(--f-num);letter-spacing:.12em;text-transform:uppercase;font-size:11px}
.bm-aura .miss{display:block;color:var(--tx3)}
.bm-aura.on b{color:#C9BCFF;text-shadow:0 0 12px #6A4BFF}
.qr-fx{position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,6,10,.86);animation:arin .25s ease-out}
.qr-win{width:100%;max-width:360px;padding:20px 18px 16px;border:1px solid var(--cy-line);border-radius:4px;background:linear-gradient(180deg,rgba(62,230,255,.08),rgba(62,230,255,.02)),var(--bg);box-shadow:0 0 40px -12px rgba(62,230,255,.6)}
.qr-box{margin:6px auto 12px;width:min(260px,70vw);aspect-ratio:1;padding:6px;border-radius:10px;background:#F2FDFF;box-shadow:0 0 0 1px var(--cy-line),0 0 30px -6px rgba(62,230,255,.7)}
.qr-box svg{display:block;width:100%;height:100%}
.qr-url{font-family:var(--f-num);font-size:12px;color:var(--cy);text-align:center;word-break:break-all}
.qr-hint{font-size:var(--fs-s);color:var(--tx2);text-align:center;margin:6px 0 14px;line-height:1.45}
.share-i{`);

// ---- version and the QR library
R(`const APP_VERSION = '1.10.0'`, `const APP_VERSION = '1.11.0'`);
R(`<script src="titles.js"></script>`, `<script src="titles.js"></script>\n<script src="qr.js"></script>`);
fs.writeFileSync(F, s);

// service worker: new version, QR library in the offline shell
const SW = path.join(__dirname, '..', '..', 'sw.js');
let w = fs.readFileSync(SW, 'utf8');
const RW = (a, b) => { if (w.split(a).length !== 2) throw new Error('sw: ' + a); w = w.split(a).join(b); };
RW(`const VERSION = 'arise-v17';`, `const VERSION = 'arise-v18';`);
RW(`  './titles.js',\n`, `  './titles.js',\n  './qr.js',\n`);
fs.writeFileSync(SW, w);
console.log('aura + share patch applied');
