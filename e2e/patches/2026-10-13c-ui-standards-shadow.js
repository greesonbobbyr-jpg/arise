// One-off patch (kept for the record): tier wording + info sheet, e1RM source, shadow verdicts.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const R = (a, b, count) => { const n = h.split(a).length - 1; if (n !== (count || 1)) throw new Error('expected ' + (count || 1) + ' match, got ' + n + ':\n' + a.slice(0, 120)); h = h.split(a).join(b); };

R('<script src="core.js"></script>', '<script src="standards.js"></script>\n<script src="core.js"></script>');

// ---- CSS
R('.shadow.beat .k,.shadow.beat .mono{color:var(--gr)}',
  `.shadow.beat .k,.shadow.beat .mono{color:var(--gr)}
.shadowv{padding:0 8px 8px;margin-top:-4px;font-size:var(--fs-s);color:var(--tx3)}
.tier-lines{margin-top:10px;font-size:var(--fs-s);line-height:1.5}
.tier-lines .main{font-size:var(--fs-m);color:var(--tx)}
.tier-lines .main b{color:var(--cy);font-family:var(--f-num)}
.ilink{color:var(--cy);font-weight:600;font-size:var(--fs-s);min-height:32px;padding:4px 0;text-decoration:underline;text-underline-offset:3px}
.lvl{display:grid;grid-template-columns:1fr auto;gap:2px 12px;align-items:baseline;padding:8px 0;border-top:1px solid var(--line)}
.lvl .w{font-family:var(--f-num);font-weight:600}
.lvl.you{color:var(--cy)}
.lvl .s{grid-column:1/-1;font-size:12px;color:var(--tx3)}
.sheet-p{color:var(--tx2);font-size:var(--fs-s);line-height:1.5;margin-bottom:10px}
.sheet-h{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);font-weight:600;margin:14px 0 4px}`);

// ---- tier lookup uses real lb at the user's bodyweight, in the unit the lift is logged in
R(`  return C.percentile(e1rm * C.stdMult(ex) / BW(), P().sex, P().age, ex.std);`,
  `  return C.percentile(e1rm, BW(), P().sex, P().age, ex.std);`);
R(`out.push({ exId: id, name: ex.name, current: a.current, tier: t.tier, std: ex.std, mult: C.stdMult(ex), words: C.loadWords(ex) }); }`,
  `out.push({ exId: id, name: ex.name, current: a.current, tier: t.tier, pct: t.pct, std: ex.std, base: ex.bw ? BW() * ex.bw : 0, words: C.loadWords(ex) }); }`);
R(`  const lifts = strengthLifts().sort((a, b) => b.current * b.mult - a.current * a.mult).slice(0, 3);`,
  `  const lifts = strengthLifts().sort((a, b) => b.pct - a.pct).slice(0, 3);`);

// ---- shadow: defined, dated, and a verdict on the last session
R(`function shadowTop(exId) { const a = analyses()[exId]; if (!a) return null; for (const h of a.history) if (Math.abs(h.best - a.allTimeBest) < 1e-6) return { top: h.top, best: a.allTimeBest }; return null; }
function shadowLine(e, ex) {
  const sh = shadowTop(e.exId); if (!sh) return '';
  return '<div class="shadow" id="shadow-' + state.active.entries.indexOf(e) + '"><span class="k">Shadow</span><span class="mono">' + fmtSet(ex, sh.top) + '</span><span class="dim">·</span><span class="mono">' + fw(sh.best) + ' e1RM' + wTag(ex) + '</span></div>';
}`,
`// The shadow is the all-time best set on a lift.
function shadowTop(exId) { const a = analyses()[exId]; return a ? a.shadow : null; }
// small weights keep one decimal so "+0" never shows for a real difference
function fwd(lb) { const v = P().units === 'kg' ? lb * KG : lb; return (Math.abs(v) < 10 ? (+v.toFixed(1)).toString() : String(Math.round(v))); }
// how the last session of this lift did against the best before it
function shadowVerdict(a) {
  const v = a && a.lastVsShadow; if (!v) return '';
  const when = C.fmtDate(v.date);
  if (v.beat) return '<span class="gr">You beat your shadow last time (' + when + ', +' + fwd(v.delta) + ' ' + U() + ')</span>';
  if (Math.abs(v.delta) < 0.05) return '<span>Last time (' + when + ') you matched your shadow</span>';
  return '<span>Last time (' + when + '): ' + fw(v.last) + ' e1RM, ' + fwd(-v.delta) + ' ' + U() + ' short of your shadow</span>';
}
function shadowLine(e, ex) {
  const sh = shadowTop(e.exId); if (!sh) return '';
  const verdict = shadowVerdict(analyses()[e.exId]);
  return '<div class="shadow" id="shadow-' + state.active.entries.indexOf(e) + '"><span class="k">Shadow · your best</span><span class="mono">' + fmtSet(ex, sh.top) + '</span><span class="dim">·</span><span class="mono">' + fw(sh.best) + ' e1RM' + wTag(ex) + '</span><span class="dim">· ' + C.fmtDate(sh.date) + '</span></div>' +
    (verdict ? '<div class="shadowv">' + verdict + '</div>' : '');
}`);

// ---- live line: which set the e1RM came from
R(`  let best = 0, rough = false;
  for (const s of done) { const v = C.setE1RM(ex, s, BW()); if (v > best) best = v; if (C.isRough(s.r)) rough = true; }
  const a = analyses()[ex.id];
  let out = '<span>e1RM <b class="num cy">' + fw(best) + '</b>' + wTag(ex) + '</span>';`,
`  let best = 0, src = null;
  for (const s of done) { const v = C.setE1RM(ex, s, BW()); if (v > best) { best = v; src = s; } }
  const rough = !!src && C.isRough(src.r);
  const setNo = src ? e.sets.filter(x => !x.warmup).indexOf(src) + 1 : 0;
  const a = analyses()[ex.id];
  let out = '<span>e1RM <b class="num cy">' + fw(best) + '</b>' + wTag(ex) + (src ? ' <span class="dim">from set ' + setNo + ' (' + fmtSet(ex, src) + ')</span>' : '') + '</span>';`);
R(`  if (best > allTimeBest(ex.id) + 1e-6 && a) out += '<span class="badge pr">PR</span>';`,
  `  if (best > allTimeBest(ex.id) + 1e-6 && a) out += '<span class="badge pr">Shadow beaten</span>';`);
R(`  if (rough) out += '<span class="dim">est. rough (&gt;12 reps)</span>';`,
  `  if (rough) out += '<span class="dim">less precise above 10 reps</span>';`);
R(`toast('NEW PR — ' + ex.name + ' ' + fw(C.setE1RM(ex, s, BW())) + ' ' + U() + C.loadWords(ex) + ' e1RM', 'pr');`,
  `toast('SHADOW BEATEN · ' + ex.name + ' ' + fw(C.setE1RM(ex, s, BW())) + ' ' + U() + C.loadWords(ex) + ' e1RM, a new best', 'pr');`);

// ---- one vocabulary: a new best is a shadow beaten
R(`(prs ? ' · <span class="gr">' + prs + ' PR</span>' : '')`, `(prs ? ' · <span class="gr">' + prs + (prs === 1 ? ' shadow' : ' shadows') + ' beaten</span>' : '')`, 2);
R(`(prIds.has(e.exId) ? ' <span class="badge pr">PR</span>' : '')`, `(prIds.has(e.exId) ? ' <span class="badge pr">Shadow beaten</span>' : '')`);
R(`'<div class="kicker" style="margin-bottom:6px">Personal records</div>'`, `'<div class="kicker" style="margin-bottom:6px">Shadows beaten · new bests</div>'`);
R(`'<p class="small dim">No PRs this time. Showing up counts.</p>'`, `'<p class="small dim">No shadows beaten this time. Showing up counts.</p>'`);
R(`<div class="kicker">PRs · 7d</div>`, `<div class="kicker">Shadows · 7d</div>`);

// ---- tier bar: who you are compared to, the next target, and the all-men estimate
R(`  const labs = C.TIER_SHORT.map((t, i) => '<span class="' + (i === cur.tier ? 'on' : '') + '">' + t + '</span>').join('');
  return '<div class="tier"><div class="segs">' + segs + '</div><div class="labs">' + labs + '</div>' +
    '<div class="small muted" style="margin-top:8px"><span class="mono">' + (a.current * C.stdMult(ex) / BW()).toFixed(2) + '×</span> bodyweight' + (C.stdMult(ex) > 1 ? ' (both dumbbells)' : '') + ' · ' + cur.tierName + ' · ~' + C.ordinal(cur.pct) + ' percentile</div></div>';
}`,
`  const labs = C.TIER_SHORT.map((t, i) => '<span class="' + (i === cur.tier && !cur.below ? 'on' : '') + '">' + t + '</span>').join('');
  const who = (P().sex === 'f' ? 'women' : 'men'), est = C.popEstimate(cur.pct, P().sex, P().age);
  const main = cur.below
    ? 'Starting out · below the Beginner line for ' + who + ' who lift at ' + fw(BW()) + ' ' + U()
    : 'Stronger than <b>' + Math.round(cur.pct) + '%</b> of ' + who + ' who lift at ' + fw(BW()) + ' ' + U() + ' · ' + cur.tierName;
  const next = cur.next ? cur.next.name + ' at ' + stdWeight(ex, cur.next.weight) + ' · ' + fwd(Math.ceil(cur.next.gap)) + ' ' + U() + ' to go' : 'Top level: stronger than 95% of ' + who + ' who lift';
  return '<div class="tier"><div class="segs">' + segs + '</div><div class="labs">' + labs + '</div>' +
    '<div class="tier-lines"><div class="main">' + main + '</div><div class="muted">' + next + '</div>' +
    '<div class="dim">' + (est ? 'Est. stronger than ~' + est + '% of all ' + who + ' · ' : '') + '<button class="ilink" data-tierinfo="' + esc(ex.id) + '">How this is measured</button></div></div></div>';
}
// a standards weight written the way this lift is logged: bodyweight lifts as added weight, with the rep count that equals it
function stdWeight(ex, w) {
  if (!ex.bw) return fw(Math.ceil(w)) + ' ' + U() + (C.loadTag(ex) ? ' ' + C.loadTag(ex) : '');
  const base = BW() * ex.bw, add = w - base, reps = Math.ceil((w / base - 1) * 30);
  if (add <= 0) return 'one bodyweight rep';
  return '+' + fw(Math.ceil(add)) + ' ' + U() + ' added' + (reps >= 2 && reps <= 12 ? ' (or ' + reps + ' reps at bodyweight)' : '');
}
const LEVEL_NOTES = ['stronger than 5% of lifters · about a month of training', 'stronger than 20% · about six months', 'stronger than 50% · about two years', 'stronger than 80% · five years or more', 'stronger than 95% · competitive level'];
function tierInfoSheet(exId) {
  const ex = exById[exId], a = analyses()[exId]; if (!ex || !a) return;
  const cur = tierInfo(ex, a.current); if (!cur) return;
  const who = (P().sex === 'f' ? 'women' : 'men'), est = C.popEstimate(cur.pct, P().sex, P().age), share = Math.round(C.lifterShare(P().sex, P().age) * 100);
  const mult = C.ageMult(P().age);
  let rows = '', placed = false;
  const you = '<div class="lvl you"><span>You · estimated 1RM</span><span class="w">' + fw(a.current) + ' ' + U() + wTag(ex) + '</span></div>';
  for (let i = 4; i >= 0; i--) {
    if (!placed && a.current >= cur.thresholds[i]) { rows += you; placed = true; }
    rows += '<div class="lvl"><span>' + C.TIERS[i] + '</span><span class="w">' + stdWeight(ex, cur.thresholds[i]) + '</span><span class="s">' + LEVEL_NOTES[i] + '</span></div>';
  }
  if (!placed) rows += you;
  const from = a.currentFrom;
  modal({ title: ex.name + ' · how this is measured', html:
    '<div class="sheet-h">Who you are compared to</div>' +
    '<p class="sheet-p">' + who[0].toUpperCase() + who.slice(1) + ' who lift and log their lifts, at your bodyweight (' + fw(BW()) + ' ' + U() + '). The levels come from Strength Level\\'s published standards, built from about 48 million logged lifts. This is not the general population: most people do not lift, so even Novice is above the typical untrained ' + (P().sex === 'f' ? 'woman' : 'man') + '.</p>' +
    '<div class="sheet-h">Levels for you on this lift</div>' + rows +
    (mult > 1 ? '<p class="sheet-p" style="margin-top:8px">Targets are eased ' + Math.round((mult - 1) * 100) + '% for your age.</p>' : '') +
    '<div class="sheet-h">Against everyone, not just lifters</div>' +
    '<p class="sheet-p">Nobody has measured these lifts across the general population, so this is an estimate. CDC survey data says about ' + share + '% of ' + who + ' your age do strength training twice a week or more. Assuming people who do not train sit below the lifter Novice line, ' + (est ? 'your level is stronger than roughly ' + est + '% of all ' + who + '.' : 'the estimate starts once you reach Novice.') + '</p>' +
    '<div class="sheet-h">Where your number comes from</div>' +
    '<p class="sheet-p">Your estimated 1RM is ' + fw(a.current) + ' ' + U() + wTag(ex) + ', from your best set in the last 28 days: ' + fmtSet(ex, from.top) + ' on ' + C.fmtDate(from.date) + '. Every working set gets its own estimate (weight × (1 + reps ÷ 30), reps capped at 12). A session counts its highest set, so later sets with fewer reps never lower it. Example: 50 × 12, 50 × 8, 50 × 7 gives 70, 63 and 62, and the session counts 70. Sets above 10 reps are less precise.</p>',
    buttons: [{ label: 'Close', primary: true, value: true }] });
}`);

// ---- lift card: source set + shadow line with verdict
R(`      (a.formed ? '<div class="small dim">vs baseline ' + fw(a.baseline) + ' ' + U() + ' (first 14 days)</div>' : '<div class="small dim">' + a.sessions + '/3 sessions · ' + Math.min(14, Math.floor(a.spanDays)) + '/14 days</div>') +`,
  `      (a.formed ? '<div class="small dim">vs baseline ' + fw(a.baseline) + ' ' + U() + ' (first 14 days)</div>' : '<div class="small dim">' + a.sessions + '/3 sessions · ' + Math.min(14, Math.floor(a.spanDays)) + '/14 days</div>') +
      '<div class="small dim">From your best set in the last 28 days: ' + fmtSet(ex, a.currentFrom.top) + ' on ' + C.fmtDate(a.currentFrom.date) + '</div>' +
      '<div class="small muted" style="margin-top:6px">Shadow (your all-time best): ' + fmtSet(ex, a.shadow.top) + ' · ' + fw(a.shadow.best) + ' ' + U() + ' e1RM · ' + C.fmtDate(a.shadow.date) + '</div>' +
      (shadowVerdict(a) ? '<div class="small muted">' + shadowVerdict(a) + '</div>' : '') +`);
R(`All-time best ' + fw(a.allTimeBest) + ' ' + U() + C.loadWords(ex) + ' on ' + C.fmtDate(a.bestDate) + '</div></div>';`,
  `Shadow (all-time best) ' + fw(a.allTimeBest) + ' ' + U() + C.loadWords(ex) + ' on ' + C.fmtDate(a.bestDate) + '</div></div>';`);
R(`$$('[data-lift]').forEach(el => el.onclick = e => { if (e.target.closest('.callout')) return;`,
  `$$('[data-lift]').forEach(el => el.onclick = e => { const ti = e.target.closest('[data-tierinfo]'); if (ti) { tierInfoSheet(ti.dataset.tierinfo); return; } if (e.target.closest('.callout')) return;`);

// ---- honest footers
R(`Tiers and percentiles are estimates from published strength standards, adjusted for bodyweight, sex and age. They are not a live leaderboard.`,
  `Tiers compare your estimated 1RM with people who lift and log their lifts, same sex and bodyweight (Strength Level's published standards). That is not the general population. Tap "How this is measured" on any lift.`);
R(`Strength tiers and percentiles are estimates from published strength standards, not from other users. e1RM uses Epley with reps capped at 12. Baseline is your best in the first 14 days on a lift; current is your best in the last 28.`,
  `Strength tiers compare you with people who lift and log their lifts, same sex and bodyweight, using Strength Level's published standards. They are not the general population and not other users of this app. e1RM uses Epley with reps capped at 12 and counts your best set. Baseline is your best in the first 14 days on a lift; current is your best in the last 28.`);

R(`const APP_VERSION = '1.6.0';`, `const APP_VERSION = '1.7.0';`);
fs.writeFileSync(FILE, h);
console.log('patched ok');
