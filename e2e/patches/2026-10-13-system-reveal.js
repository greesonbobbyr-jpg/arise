// One-off patch (kept for the record): sealed titles + System reveal wiring in index.html.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = h.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 120)); h = h.replace(a, () => b); };  // function form: "$" and "h = h.replace(a, b); };" in b stay literal

// --- script tag
R('<script src="anatomy.js"></script>', '<script src="anatomy.js"></script>\n<script src="system.js"></script>');

// --- CSS: System note (summary + home), sealed and graded cards on the Profile grid
R('.ach .a.on .dot{background:var(--cy);box-shadow:0 0 10px var(--cy)}',
  `.ach .a.on .dot{background:var(--cy);box-shadow:0 0 10px var(--cy)}
.ach .a{width:100%;cursor:pointer;transition:transform var(--t)}
.ach .a:active{transform:scale(.96)}
.ach .a.on.r-epic{box-shadow:inset 0 0 0 1.5px rgba(182,255,59,.45)}
.ach .a.on.r-epic .n{color:var(--gr)}
.ach .a.on.r-epic .dot{background:var(--gr);box-shadow:0 0 10px var(--gr)}
.ach .a.on.r-legendary{box-shadow:inset 0 0 0 1.5px #F2FFE4,0 0 18px -6px var(--gr)}
.ach .a.on.r-legendary .n{color:#F2FFE4;text-shadow:0 0 10px var(--gr)}
.ach .a.on.r-legendary .dot{background:#F2FFE4;box-shadow:0 0 12px var(--gr)}
.ach .a.sealed{box-shadow:inset 0 0 0 1.5px var(--cy);animation:sealpulse 1.6s ease-in-out infinite}
.ach .a.sealed .n{color:var(--cy);font-family:var(--f-num);letter-spacing:.24em}
.ach .a.sealed .d{color:var(--cy)}
.ach .a.sealed .dot{background:var(--cy);box-shadow:0 0 12px var(--cy)}
@keyframes sealpulse{0%,100%{background:var(--s2)}50%{background:var(--cy-tint)}}
.sysnote{display:flex;gap:12px;align-items:center;width:100%;text-align:left;margin-top:12px;padding:12px 14px;border-radius:10px;background:var(--cy-tint);box-shadow:inset 0 0 0 1px var(--cy-line)}
.sysnote .bang{width:26px;height:26px;flex:none;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--cy);color:var(--cy);font-family:var(--f-num);font-weight:700;box-shadow:0 0 10px -2px var(--cy)}
.sysnote b{display:block;letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:var(--cy);font-family:var(--f-num)}
.sysnote.live{margin:0 0 12px;animation:sealpulse 1.6s ease-in-out infinite;cursor:pointer}
.sysnote.live .go{margin-left:auto;color:var(--cy);font-family:var(--f-num);font-weight:700;font-size:12px;letter-spacing:.16em;white-space:nowrap}`);

// --- state: which earned titles are still sealed
R(`game: { xp: 0, achievements: {}, prs: [], rank: 'E', quest: null },`, `game: { xp: 0, achievements: {}, prs: [], rank: 'E', quest: null, unseen: [] },`);
R(`      state.game = Object.assign(DEFAULT().game, state.game || {});`, `      state.game = Object.assign(DEFAULT().game, state.game || {});\n      if (!Array.isArray(state.game.unseen)) state.game.unseen = [];`);
R(`state.game = Object.assign(DEFAULT().game, d.game || {});`, `state.game = Object.assign(DEFAULT().game, d.game || {}); if (!Array.isArray(state.game.unseen)) state.game.unseen = [];`);
R(`    if (ok) { state.game.achievements[a.id] = Date.now(); fresh.push(a); }
  }
  return fresh;
}`,
`    if (ok) { state.game.achievements[a.id] = Date.now(); state.game.unseen = (state.game.unseen || []).concat(a.id); fresh.push(a); }
  }
  return fresh;
}
// ---------- the System: earned titles stay sealed until the user opens them ----------
function unseenIds() { return (state.game.unseen || []).filter(id => state.game.achievements[id] && C.ACHIEVEMENTS.some(a => a.id === id)); }
async function revealTitles(ids, replay) {
  const items = ids.map(id => C.ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean).map(a => ({ id: a.id, name: a.name, desc: a.desc, flavor: a.flavor, rarity: a.rarity, icon: a.icon }));
  if (!items.length) return;
  const seen = id => { state.game.unseen = (state.game.unseen || []).filter(x => x !== id); save(); };
  if (!window.ARISE_SYSTEM) { items.forEach(i => seen(i.id)); toast('Title acquired: ' + items.map(i => i.name).join(', ')); render(); return; }
  await window.ARISE_SYSTEM.reveal(items, { sealed: !replay, onRevealed: replay ? null : seen });
  if (!state.active) render();
}
function systemCard() {
  const n = unseenIds().length; if (!n) return '';
  return '<button class="sysnote live" id="sys-open"><span class="bang">!</span><span><b>System notification</b><span class="small muted">' + (n === 1 ? 'A new title has been acquired.' : n + ' new titles have been acquired.') + '</span></span><span class="go">OPEN</span></button>';
}`);

// --- workout summary: tease, do not spoil. Then play the reveal before any rank-up.
R(`    (fresh.length ? '<div class="kicker" style="margin:12px 0 6px">Unlocked</div>' + fresh.map(f => '<div class="row" style="min-height:30px"><span class="badge cy">' + esc(f.name) + '</span><span class="small muted">' + esc(f.desc) + '</span></div>').join('') : '') +`,
  `    (fresh.length ? '<div class="sysnote"><span class="bang">!</span><span><b>System notification</b><span class="small muted">' + (fresh.length === 1 ? 'A new title has been acquired.' : fresh.length + ' new titles have been acquired.') + ' Sealed until you open ' + (fresh.length === 1 ? 'it' : 'them') + '.</span></span></div>' : '') +`);
R(`  for (const k in prToasted) delete prToasted[k];
  render();
  if (C.RANK_ORDER.indexOf(rankAfter)`,
  `  for (const k in prToasted) delete prToasted[k];
  render();
  if (unseenIds().length) await revealTitles(unseenIds());
  if (C.RANK_ORDER.indexOf(rankAfter)`);

// --- home: a live System banner while titles are unopened
R(`installCard() + levelCard() + dailyQuestCard()`, `installCard() + systemCard() + levelCard() + dailyQuestCard()`);
R(`    const hi = $('#home-install'); if (hi) hi.onclick = doInstall;`, `    const hi = $('#home-install'); if (hi) hi.onclick = doInstall;\n    const so = $('#sys-open'); if (so) so.onclick = () => revealTitles(unseenIds());`);

// --- profile grid: sealed cards hide name, grade and condition; earned cards replay; locked cards say what they need
R(`  const ach = C.ACHIEVEMENTS.map(a => '<div class="a' + (state.game.achievements[a.id] ? ' on' : '') + '"><span class="dot"></span><span class="n">' + esc(a.name) + '</span><span class="d">' + esc(a.desc) + '</span></div>').join('');`,
  `  const sealedSet = new Set(unseenIds());
  const ach = C.ACHIEVEMENTS.map(a => { const got = !!state.game.achievements[a.id], sealed = sealedSet.has(a.id);
    return '<button class="a' + (sealed ? ' sealed' : got ? ' on r-' + a.rarity : '') + '" data-ach="' + a.id + '"><span class="dot"></span><span class="n">' + (sealed ? '???' : esc(a.name)) + '</span><span class="d">' + (sealed ? 'New title · tap to reveal' : esc(a.desc)) + '</span></button>'; }).join('');`);
R(`<div class="ach">' + ach + '</div></div>' +`, `<div class="ach">' + ach + '</div><div class="small dim" style="margin-top:10px">Tap an earned title to replay its reveal.</div></div>' +`);
R(`function bindProfile() {`, `function bindProfile() {
  $$('[data-ach]').forEach(b => b.onclick = () => {
    const id = b.dataset.ach, a = C.ACHIEVEMENTS.find(x => x.id === id), un = unseenIds();
    if (un.includes(id)) revealTitles([id].concat(un.filter(x => x !== id)));
    else if (state.game.achievements[id]) revealTitles([id], true);
    else toast('Locked · ' + a.desc);
  });`);

// --- demo data: titles already opened unless ?demo&sealed asks for two sealed ones
R(`  invalidate(); checkAchievements(); state.game.rank = currentRank(); save();`, `  invalidate(); checkAchievements(); state.game.unseen = location.search.includes('sealed') ? state.game.unseen.slice(0, 2) : []; state.game.rank = currentRank(); save();`);
R(`window.ARISE_DEBUG = { showRankUp, rankCard };`, `window.ARISE_DEBUG = { showRankUp, rankCard, revealTitles };`);
R(`const APP_VERSION = '1.5.0';`, `const APP_VERSION = '1.6.0';`);

fs.writeFileSync(FILE, h);
console.log('patched ok');
