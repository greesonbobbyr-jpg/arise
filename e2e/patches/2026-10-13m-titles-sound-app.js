// One-off patch (kept for the record): the app uses titles.js (125 titles), gets a Titles screen, a one-time
// check of the whole log, and sound effects with a Profile toggle. core.js drops the old 18-item list.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const make = (file) => {
  let s = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return { R(a, b, count) { const n = s.split(a).length - 1; if (n !== (count || 1)) throw new Error(file + ': expected ' + (count || 1) + ' match, got ' + n + ':\n' + a.slice(0, 120)); s = s.split(a).join(b); },
    cut(from, to) { const i = s.indexOf(from), j = s.indexOf(to, i); if (i < 0 || j < 0) throw new Error(file + ': cut markers not found: ' + from.slice(0, 50)); s = s.slice(0, i) + s.slice(j); },
    save() { fs.writeFileSync(path.join(ROOT, file), s); } };
};

// ================= core.js: titles now live in titles.js
const core = make('core.js');
core.cut('  const ACHIEVEMENTS = [', '  // total weight moved: per-dumbbell and per-side sets count both hands / both sides');
core.R('streak, ACHIEVEMENTS, sessionVolume,', 'streak, sessionVolume,');
core.save();

// ================= index.html
const h = make('index.html');
h.R('<script src="system.js"></script>', '<script src="sfx.js"></script>\n<script src="system.js"></script>');
h.R('<script src="core.js"></script>', '<script src="core.js"></script>\n<script src="titles.js"></script>');
h.R(`const C = window.ARISE_CORE, DAY = C.DAY;`, `const C = window.ARISE_CORE, DAY = C.DAY;
const T = window.ARISE_TITLES, TITLES_VERSION = 2;      // bump when titles are added so the whole log is checked once`);
h.R(`name: 'Hunter', keepAwake: true, notify: 'unasked' },`, `name: 'Hunter', keepAwake: true, notify: 'unasked', sound: true },`);
h.R(`game: { xp: 0, achievements: {}, prs: [], rank: 'E', quest: null, unseen: [] },`, `game: { xp: 0, achievements: {}, prs: [], rank: 'E', quest: null, unseen: [], questCount: 0, achVersion: 0 },`);

// ---- CSS for the Titles screen
h.R(`.frow.slot{grid-template-columns:28px 1fr 44px}`, `.frow.slot{grid-template-columns:28px 1fr 44px}
.tcat{display:flex;align-items:baseline;gap:8px;margin:22px 4px 8px}
.tcat b{font-size:17px}
.tcard{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--s1);border-radius:var(--r);padding:10px 12px;margin-bottom:8px;min-height:78px;transition:transform var(--t)}
.tcard:active{transform:scale(.98)}
.tcard .em{width:58px;height:58px;flex:none}
.tcard .em svg{width:100%;height:100%;display:block}
.tcard .n{font-weight:700;line-height:1.2}
.tcard .d{font-size:var(--fs-s);color:var(--tx2);line-height:1.3;margin-top:2px}
.tcard .gtag{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--cy);margin-top:4px}
.tcard.g-epic .gtag{color:var(--gr)}
.tcard.g-legendary .gtag{color:#F2FFE4;text-shadow:0 0 8px var(--gr)}
.tcard.locked .n{color:var(--tx2)}
.tcard.locked .gtag{color:var(--tx3);text-shadow:none}
.tcard.sealed{box-shadow:inset 0 0 0 1.5px var(--cy);animation:sealpulse 1.6s ease-in-out infinite}
.tcard.sealed .n{color:var(--cy);font-family:var(--f-num);letter-spacing:.24em}
.tcard.sealed .d{color:var(--cy)}
.tcard .pb{height:4px;background:var(--s3);border-radius:2px;overflow:hidden;margin-top:7px}
.tcard .pb i{display:block;height:100%;background:var(--cy);opacity:.55;border-radius:2px}
.tcard .pv{font-family:var(--f-num);font-size:11px;color:var(--tx3);margin-top:3px}
.tsum{display:flex;gap:6px;margin-top:10px}
.tsum svg{width:44px;height:44px}`);

// ---- one summary of the log, one check
h.cut('function gameCtx() {', '// ---------- the System: earned titles stay sealed until the user opens them ----------');
h.R(`// ---------- the System: earned titles stay sealed until the user opens them ----------
function unseenIds() { return (state.game.unseen || []).filter(id => state.game.achievements[id] && C.ACHIEVEMENTS.some(a => a.id === id)); }`,
`// Titles are rows in titles.js, each checked against one summary of the log (T.stats).
function titleStats() {
  return T.stats({ sessions: state.sessions, exById, analyses: analyses(), bodyweight: BW(), sex: P().sex, age: P().age, xp: state.game.xp, prs: state.game.prs,
    questCount: state.game.questCount, plan: state.plan, weeklyTarget: P().weeklyTarget, now: Date.now() });
}
function checkAchievements() {
  const S = titleStats(), fresh = [];
  for (const t of T.TITLES) {
    if (state.game.achievements[t.id] || !T.has(t, S)) continue;
    state.game.achievements[t.id] = Date.now(); state.game.unseen = (state.game.unseen || []).concat(t.id); fresh.push(t);
  }
  return fresh;
}
// ---------- the System: earned titles stay sealed until the user opens them ----------
function unseenIds() { return (state.game.unseen || []).filter(id => state.game.achievements[id] && T.BY_ID[id]); }`);
h.R(`  const items = ids.map(id => C.ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean).map(a => ({ id: a.id, name: a.name, desc: a.desc, flavor: a.flavor, rarity: a.rarity, icon: a.icon }));`,
    `  const items = ids.map(id => T.BY_ID[id]).filter(Boolean).map(t => ({ id: t.id, name: t.name, desc: unitText(t.desc), flavor: t.flavor, grade: t.grade, glyph: t.glyph, mark: t.mark }));`);

// ---- a completed quest counts toward quest titles
h.R(`  if (questHit) { xp += quest.xp; state.game.quest = { key: quest.key, done: true, date: Date.now() }; }`,
    `  if (questHit) { xp += quest.xp; state.game.quest = { key: quest.key, done: true, date: Date.now() }; state.game.questCount = (state.game.questCount || 0) + 1; }`);

// ---- rank-up has a sound
h.R(`  el.classList.add('on'); if (navigator.vibrate) navigator.vibrate([40, 60, 40, 60, 120]);`,
    `  el.classList.add('on'); if (navigator.vibrate) navigator.vibrate([40, 60, 40, 60, 120]);
  if (window.ARISE_SFX) window.ARISE_SFX.play('rankup');`);

// ---- Profile: titles summary + sound toggle; the full list moves to its own screen
h.R(`  else s.innerHTML = viewProfile();`, `  else s.innerHTML = sub && sub.view === 'titles' ? viewTitles() : viewProfile();`);
h.R(`  if (tab === 'profile') bindProfile();`, `  if (tab === 'profile') { if (sub && sub.view === 'titles') bindTitles(); else bindProfile(); }`);
h.R(`  const sealedSet = new Set(unseenIds());
  const ach = C.ACHIEVEMENTS.map(a => { const got = !!state.game.achievements[a.id], sealed = sealedSet.has(a.id);
    return '<button class="a' + (sealed ? ' sealed' : got ? ' on r-' + a.rarity : '') + '" data-ach="' + a.id + '"><span class="dot"></span><span class="n">' + (sealed ? '???' : esc(a.name)) + '</span><span class="d">' + (sealed ? 'New title · tap to reveal' : esc(a.desc)) + '</span></button>'; }).join('');`,
`  const sealedSet = new Set(unseenIds()), earnedT = T.TITLES.filter(t => state.game.achievements[t.id]);
  const latest = earnedT.filter(t => !sealedSet.has(t.id)).sort((a, b) => state.game.achievements[b.id] - state.game.achievements[a.id]).slice(0, 5);
  const emb = (t, o) => window.ARISE_SYSTEM ? window.ARISE_SYSTEM.emblem(t, Object.assign({ mini: true }, o)) : '';`);
h.R(`    '<div class="field"><label>Keep screen on during workouts</label><div class="seg" id="p-awake"><button data-v="1" class="' + (p.keepAwake ? 'on' : '') + '">On</button><button data-v="0" class="' + (!p.keepAwake ? 'on' : '') + '">Off</button></div></div>' +`,
`    '<div class="field"><label>Keep screen on during workouts</label><div class="seg" id="p-awake"><button data-v="1" class="' + (p.keepAwake ? 'on' : '') + '">On</button><button data-v="0" class="' + (!p.keepAwake ? 'on' : '') + '">Off</button></div></div>' +
    '<div class="field"><label>Sound effects (title reveals and rank-ups)</label><div class="row" style="gap:8px"><div class="seg grow" id="p-sound"><button data-v="1" class="' + (p.sound !== false ? 'on' : '') + '">On</button><button data-v="0" class="' + (p.sound === false ? 'on' : '') + '">Off</button></div><button class="btn ghost sm" id="p-sound-test" style="min-height:48px">Test</button></div></div>' +`);
h.R(`    '<div class="card"><div class="kicker" style="margin-bottom:10px">Achievements · ' + Object.keys(state.game.achievements).length + '/' + C.ACHIEVEMENTS.length + '</div><div class="ach">' + ach + '</div><div class="small dim" style="margin-top:10px">Tap an earned title to replay its reveal.</div></div>' +`,
`    '<button class="card' + (sealedSet.size ? ' sysnote-ring' : '') + '" id="p-titles" style="width:100%;text-align:left"><div class="row"><div class="grow"><div class="kicker">Titles · ' + earnedT.length + '/' + T.TITLES.length + (sealedSet.size ? ' · <span class="cy">' + sealedSet.size + ' sealed</span>' : '') + '</div>' +
      (latest.length ? '<div class="tsum">' + latest.map(t => emb(t)).join('') + '</div>' : '<div class="small muted" style="margin-top:4px">Earn titles by training. ' + T.TITLES.length + ' to find.</div>') + '</div><span class="cy" style="font-weight:600">View all</span></div></button>' +`);
h.R(`  $$('[data-ach]').forEach(b => b.onclick = () => {
    const id = b.dataset.ach, a = C.ACHIEVEMENTS.find(x => x.id === id), un = unseenIds();
    if (un.includes(id)) revealTitles([id].concat(un.filter(x => x !== id)));
    else if (state.game.achievements[id]) revealTitles([id], true);
    else toast('Locked · ' + a.desc);
  });`,
`  $('#p-titles').onclick = () => { sub = { view: 'titles' }; render(); window.scrollTo(0, 0); };
  $$('#p-sound button').forEach(b => b.onclick = () => { P().sound = b.dataset.v === '1'; if (window.ARISE_SFX) window.ARISE_SFX.enabled = P().sound; save(); render(); });
  $('#p-sound-test').onclick = () => { const S = window.ARISE_SFX; if (!S || !S.supported) return toast('This browser has no sound support'); if (!S.enabled) return toast('Sound effects are off'); S.play('seal', { power: 1.4 }); };`);

// ---- the Titles screen
h.R(`function bindProfile() {`, `// ---------- TITLES ----------
let titleFilter = 'all';
function fmtStat(t, v) {
  const k = T.kind(t.stat);
  if (k === 'lb') return fw(v) + ' ' + U();
  if (k === 'vol') { const u = P().units === 'kg' ? v * KG : v; return (u >= 1e6 ? (u / 1e6).toFixed(u >= 1e7 ? 0 : 1) + 'M' : u >= 1e3 ? Math.round(u / 1e3) + 'K' : String(Math.round(u))) + ' ' + U(); }
  if (k === 'x') return (+v.toFixed(2)) + '×';
  if (k === 'pct') return Math.round(v) + '%';
  return String(Math.floor(v));
}
function viewTitles() {
  const S = titleStats(), sealedSet = new Set(unseenIds()), got = t => !!state.game.achievements[t.id];
  const emb = (t, o) => window.ARISE_SYSTEM ? window.ARISE_SYSTEM.emblem(t, Object.assign({ mini: true }, o)) : '';
  const show = t => titleFilter === 'all' || (titleFilter === 'earned' ? got(t) : titleFilter === 'locked' ? !got(t) : t.grade === titleFilter);
  const chips = [['all', 'All'], ['earned', 'Earned'], ['locked', 'Locked'], ['common', 'Common'], ['rare', 'Rare'], ['epic', 'Epic'], ['legendary', 'Legendary']]
    .map(c => '<button class="chip' + (titleFilter === c[0] ? ' on' : '') + '" data-tf="' + c[0] + '">' + c[1] + '</button>').join('');
  let html = '<div class="top"><button class="icon-btn" id="t-back" aria-label="Back">' + icon('back') + '</button><h1 class="grow">Titles</h1><span class="kicker" id="t-count">' + T.TITLES.filter(got).length + '/' + T.TITLES.length + '</span></div>' +
    '<div class="chips" id="t-chips">' + chips + '</div>' +
    (sealedSet.size ? '<button class="sysnote live" id="t-open"><span class="bang">!</span><span><b>System notification</b><span class="small muted">' + (sealedSet.size === 1 ? 'One title is sealed.' : sealedSet.size + ' titles are sealed.') + '</span></span><span class="go">OPEN</span></button>' : '');
  let any = false;
  for (const [cat, catName] of T.CATS) {
    const all = T.TITLES.filter(t => t.cat === cat), list = all.filter(show); if (!list.length) continue; any = true;
    html += '<div class="tcat"><b>' + esc(catName) + '</b><span class="small dim mono">' + all.filter(got).length + '/' + all.length + '</span></div>';
    for (const t of list) {
      const have = got(t), sealed = sealedSet.has(t.id), grade = t.grade[0].toUpperCase() + t.grade.slice(1);
      if (sealed) { html += '<button class="tcard sealed" data-ach="' + t.id + '"><span class="em">' + emb(null, { sealed: true }) + '</span><span class="grow"><span class="n">???</span><div class="d">New title · tap to reveal</div></span></button>'; continue; }
      const pr = T.progress(t, S);
      html += '<button class="tcard ' + (have ? 'earned' : 'locked') + ' g-' + t.grade + '" data-ach="' + t.id + '"><span class="em">' + emb(t, { locked: !have }) + '</span><span class="grow"><div class="n">' + esc(t.name) + '</div><div class="d">' + esc(unitText(t.desc)) + '</div>' +
        (have ? '<div class="gtag">' + grade + ' · ' + C.fmtDate(state.game.achievements[t.id]) + '</div>'
              : '<div class="pb"><i style="width:' + (pr.frac * 100).toFixed(1) + '%"></i></div><div class="pv">' + fmtStat(t, pr.value) + ' / ' + fmtStat(t, pr.target) + ' · ' + grade + '</div>') + '</span></button>';
    }
  }
  if (!any) html += '<div class="empty">No titles match this filter.</div>';
  return html + '<p class="note" style="margin:16px 4px 20px">Lifted-weight titles count weight you actually logged for at least one rep. Tap an earned title to replay its reveal.</p>';
}
function bindTitles() {
  $('#t-back').onclick = () => { sub = null; render(); window.scrollTo(0, 0); };
  $$('#t-chips [data-tf]').forEach(b => b.onclick = () => { titleFilter = b.dataset.tf; render(); });
  const op = $('#t-open'); if (op) op.onclick = () => revealTitles(unseenIds());
  $$('[data-ach]').forEach(b => b.onclick = () => {
    const id = b.dataset.ach, t = T.BY_ID[id], un = unseenIds();
    if (un.includes(id)) revealTitles([id]);
    else if (state.game.achievements[id]) revealTitles([id], true);
    else toast('Locked · ' + unitText(t.desc));
  });
}
function bindProfile() {`);

// ---- demo seed and the one-time check of the whole log
h.R(`  invalidate(); checkAchievements(); state.game.unseen = location.search.includes('sealed') ? state.game.unseen.slice(0, 2) : []; state.game.rank = currentRank(); save();`,
    `  invalidate(); checkAchievements(); state.game.achVersion = TITLES_VERSION;
  state.game.unseen = location.search.includes('sealedall') ? state.game.unseen : location.search.includes('sealed') ? state.game.unseen.slice(0, 2) : [];
  state.game.rank = currentRank(); save();`);
h.R(`const hashTab = location.hash.replace('#', '');`,
    `// New titles are checked against the whole log once, so history counts. They arrive sealed, on the home banner.
if ((state.game.achVersion || 0) < TITLES_VERSION) { if (state.sessions.length) checkAchievements(); state.game.achVersion = TITLES_VERSION; save(); }
if (window.ARISE_SFX) { window.ARISE_SFX.enabled = P().sound !== false; document.addEventListener('pointerdown', () => window.ARISE_SFX.unlock(), true); }
const hashTab = location.hash.replace('#', '');`);
h.R(`window.ARISE_DEBUG = { showRankUp, rankCard, revealTitles };`, `window.ARISE_DEBUG = { showRankUp, rankCard, revealTitles, titleStats, checkAchievements };`);
h.R(`const APP_VERSION = '1.8.0';`, `const APP_VERSION = '1.9.0';`);
h.save();
console.log('core.js and index.html patched');
