// Arise math tests — run with: node tests.js
const C = require('./core.js').ARISE_CORE;
const DAY = C.DAY;
let pass = 0, fail = 0;
function eq(name, got, want, tol) {
  const ok = tol == null ? got === want : Math.abs(got - want) <= tol;
  if (ok) { pass++; console.log('  ok   ' + name + '  → ' + JSON.stringify(got)); }
  else { fail++; console.log('  FAIL ' + name + '  got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); }
}
const exById = {}; C.EX.forEach(e => exById[e.id] = e);
const squat = exById.bb_squat, bench = exById.bb_bench, pullup = exById.bw_pullup;
// helper: build a session with one exercise
let sid = 0;
function S(dayOffset, exId, sets, base) {
  base = base || Date.UTC(2026, 5, 1); // Jun 1 2026
  return { id: 's' + (++sid), date: base + dayOffset * DAY, name: 'w', entries: [{ exId, sets: sets.map(([w, r, warm]) => ({ w, r, warmup: !!warm })) }] };
}

console.log('\n§4 Epley');
eq('170×5 → 198', Math.round(C.epley(170, 5)), 198);
eq('170×8 → 215', Math.round(C.epley(170, 8)), 215);
eq('delta +8.6%', +((C.epley(170, 8) / C.epley(170, 5) - 1) * 100).toFixed(1), 8.6);
eq('reps=1 → weight', C.epley(225, 1), 225);
eq('reps capped at 12 (200×15 == 200×12)', C.epley(200, 15), C.epley(200, 12));
eq('>10 reps flagged less precise', C.isRough(11), true);
eq('0 reps → 0', C.epley(200, 0), 0);

console.log('\n§4 Bodyweight load');
const pu = C.setE1RM(pullup, { w: 45, r: 5 }, 180);
eq('pull-up 180 bw + 45 × 5 → ~262', Math.round(pu), 262, 1);
eq('push-up factor 0.64 @ 180 bw, +0 → 115.2 load', C.setLoad(exById.bw_pushup, { w: 0 }, 180), 115.2, 0.01);

console.log('\n§4 Baseline window (first 14 days only)');
{
  const now = Date.UTC(2026, 5, 1) + 40 * DAY;
  const sessions = [
    S(0, 'bb_bench', [[135, 5]]),   // e1RM 157.5
    S(7, 'bb_bench', [[140, 5]]),   // 163.3
    S(13, 'bb_bench', [[145, 5]]),  // 169.2  ← last inside 14-day window
    S(15, 'bb_bench', [[185, 5]]),  // 215.8  ← must NOT enter baseline
    S(30, 'bb_bench', [[150, 5]]),  // 175
  ];
  const a = C.analyze('bb_bench', sessions, bench, 180, now);
  eq('baseline = best of first 14 days', +a.baseline.toFixed(1), 169.2, 0.1);
  eq('current = best of last 28 days', +a.current.toFixed(1), 215.8, 0.1);
  eq('formed (3+ sessions, 14+ days)', a.formed, true);
  eq('change %', +a.change.toFixed(1), +((215.8333 / 169.1667 - 1) * 100).toFixed(1), 0.1);
}
{
  const now = Date.UTC(2026, 5, 1) + 10 * DAY;
  const a = C.analyze('bb_bench', [S(0, 'bb_bench', [[135, 5]]), S(3, 'bb_bench', [[140, 5]])], bench, 180, now);
  eq('2 sessions → baseline still forming (change null)', a.change, null);
  eq('formed false', a.formed, false);
}
{
  // warmups excluded
  const a = C.analyze('bb_bench', [S(0, 'bb_bench', [[300, 10, true], [135, 5]])], bench, 180, Date.UTC(2026, 5, 2));
  eq('warmup set excluded from best', +a.current.toFixed(1), 157.5, 0.1);
}
{
  // not trained in 28+ days → fallback to most recent session
  const now = Date.UTC(2026, 5, 1) + 90 * DAY;
  const a = C.analyze('bb_bench', [S(0, 'bb_bench', [[135, 5]]), S(10, 'bb_bench', [[155, 5]]), S(20, 'bb_bench', [[145, 5]])], bench, 180, now);
  eq('stale → current = most recent session (145×5)', +a.current.toFixed(1), 169.2, 0.1);
}

console.log('\n§6 Stall detection');
{
  // squat: identical 225×8 for 4 sessions over 6 weeks
  const now = Date.UTC(2026, 5, 1) + 45 * DAY;
  const sessions = [0, 10, 20, 30, 40].map(d => S(d, 'bb_squat', [[225, 8], [225, 8], [225, 8]]));
  const a = C.analyze('bb_squat', sessions, squat, 180, now);
  eq('stalled', !!a.stall, true);
  eq('code top_of_range', a.stall && a.stall.code, 'top_of_range');
  eq('squat suggestion = +10 → 235', a.stall && a.stall.weight, 235);
  eq('weight rounds to 5', a.stall.weight % 5, 0);
}
{
  // bench identical at 5 reps → chase reps
  const now = Date.UTC(2026, 5, 1) + 45 * DAY;
  const sessions = [0, 7, 14, 21, 28, 35].map(d => S(d, 'bb_bench', [[185, 5], [185, 5], [185, 5]]));
  const a = C.analyze('bb_bench', sessions, bench, 180, now);
  eq('bench <8 reps → chase_reps', a.stall && a.stall.code, 'chase_reps');
}
{
  // fatigue: trending down
  const now = Date.UTC(2026, 5, 1) + 45 * DAY;
  const sessions = [[0, 225], [7, 230], [14, 225], [21, 220], [28, 215], [35, 210]].map(([d, w]) => S(d, 'bb_squat', [[w, 5], [w, 5], [w, 5]]));
  const a = C.analyze('bb_squat', sessions, squat, 180, now);
  eq('fatigue detected', a.stall && a.stall.code, 'fatigue');
  eq('90% of 210 rounds to 190', a.stall && a.stall.weight, 190);
}
{
  // frequency: >10 day gaps
  const now = Date.UTC(2026, 5, 1) + 70 * DAY;
  const sessions = [[0, 225], [14, 230], [28, 225], [42, 225], [56, 228]].map(([d, w]) => S(d, 'bb_squat', [[w, 5], [w, 5], [w, 5]]));
  const a = C.analyze('bb_squat', sessions, squat, 180, now);
  eq('frequency flagged', a.stall && a.stall.code, 'frequency');
}
{
  // volume: <3 sets
  const now = Date.UTC(2026, 5, 1) + 45 * DAY;
  const sessions = [[0, 225], [7, 230], [14, 225], [21, 228], [28, 225], [35, 227]].map(([d, w]) => S(d, 'bb_squat', [[w, 5], [w, 4]]));
  const a = C.analyze('bb_squat', sessions, squat, 180, now);
  eq('volume flagged', a.stall && a.stall.code, 'volume');
}
{
  // not stalled: recent PR
  const now = Date.UTC(2026, 5, 1) + 45 * DAY;
  const sessions = [0, 10, 20, 30, 40].map((d, i) => S(d, 'bb_squat', [[225 + i * 5, 5], [225, 5], [225, 5]]));
  const a = C.analyze('bb_squat', sessions, squat, 180, now);
  eq('progressing lift not stalled', a.stall, null);
}
{
  // only 3 sessions → never stalled
  const now = Date.UTC(2026, 5, 1) + 60 * DAY;
  const sessions = [0, 10, 20].map(d => S(d, 'bb_squat', [[225, 8], [225, 8], [225, 8]]));
  eq('3 sessions → not stalled', C.analyze('bb_squat', sessions, squat, 180, now).stall, null);
}
eq('round5(221) → 220', C.round5(221), 220);
eq('round5(223) → 225', C.round5(223), 225);

console.log('\nStrength standards (published, by bodyweight, among lifters)');
{
  const P = (e, bw, key, sex, age) => C.percentile(e, bw, sex || 'm', age || 30, key);
  eq('bench 243 @200 lb is the published 50th percentile', P(243, 200, 'bench').pct, 50, 0.01);
  eq('tier at threshold = Intermediate', P(243, 200, 'bench').tierName, 'Intermediate');
  eq('deadlift 382 @200 lb → 50th (old table demanded 450)', P(382, 200, 'deadlift').pct, 50, 0.01);
  eq('deadlift 400 @200 lb is Intermediate, not Novice', P(400, 200, 'deadlift').tierName, 'Intermediate');
  eq('squat novice threshold 255 @200 → 20th', P(255, 200, 'squat').pct, 20, 0.01);
  eq('midpoint novice/intermediate → 35th', P((255 + 329) / 2, 200, 'squat').pct, 35, 0.01);
  eq('female bench 120 @160 lb → 50th', P(120, 160, 'bench', 'f').pct, 50, 0.01);
  eq('interpolates: deadlift intermediate @180 within 2% of published 348', Math.abs(C.thresholds('deadlift', 'm', 180)[2] - 348) / 348 < 0.02, true);
  eq('interpolates: squat advanced @230 within 2% of published 462', Math.abs(C.thresholds('squat', 'm', 230)[3] - 462) / 462 < 0.02, true);
  eq('heavier lifters need a lower ratio (bench intermediate ÷ bw at 300 < at 160)', C.thresholds('bench', 'm', 300)[2] / 300 < C.thresholds('bench', 'm', 160)[2] / 160, true);
  let mono = true;
  for (const key of Object.keys(C.STDS.lifts)) for (const sex of ['m', 'f']) for (let bw = 90; bw <= 340; bw += 10) {
    const t = C.thresholds(key, sex, bw); for (let k = 1; k < 5; k++) if (!(t[k] > t[k - 1]) || !(t[0] > 0)) mono = false;
  }
  eq('thresholds positive and increasing for every lift, sex and bodyweight 90–340 lb', mono, true);
  const low = P(0, 200, 'squat');
  eq('below Beginner → "Starting out", percentile floors at 1', low.below && low.tierName === 'Starting out' && Math.abs(low.pct - 1) < 0.01, true);
  eq('far above Elite caps at 99', P(2000, 200, 'squat').pct, 99, 0.01);
  const nx = P(400, 200, 'deadlift').next;
  eq('names the next level and its weight (Advanced at 476)', nx.name + ' ' + Math.round(nx.weight) + ' gap ' + Math.round(nx.gap), 'Advanced 476 gap 76');
  eq('Elite has no next level', P(600, 200, 'deadlift').next, null);
  eq('age 45 eases targets by 6%: 229 bench @200 → 50th', P(243 / 1.06, 200, 'bench', 'm', 45).pct, 50, 0.05);
  eq('dumbbell bench compares per dumbbell: 98s @200 → 50th', P(98, 200, 'db_bench').pct, 50, 0.01);
  eq('pull-up compares total load: bodyweight × 12 at 200 lb is Intermediate', P(C.setE1RM(pullup, { w: 0, r: 12 }, 200), 200, 'pull_up').tierName, 'Intermediate');
  eq('sumo deadlift has its own table', exById.bb_sumo.std, 'sumo_deadlift');
  eq('push-up has no weight standard (progress only)', exById.bw_pushup.std, undefined);
  eq('no standards → null', P(100, 200, 'nope'), null);
  eq('no bodyweight → null', P(100, 0, 'bench'), null);
  // estimate against all men/women, including the majority who do not lift (CDC share by sex and age)
  eq('estimate: lifter 50th, man aged 30 → stronger than ~78% of all men', C.popEstimate(50, 'm', 30), 78);
  eq('estimate: lifter 20th (Novice), man aged 30 → ~64%', C.popEstimate(20, 'm', 30), 64);
  eq('estimate uses the age band: man aged 50 → 85%', C.popEstimate(50, 'm', 50), 85);
  eq('estimate for women aged 30 at lifter 50th → 83%', C.popEstimate(50, 'f', 30), 83);
  eq('no estimate below Novice', C.popEstimate(19, 'm', 30), null);
}
eq('age 45 mult = 1.06', C.ageMult(45), 1.06, 1e-9);
eq('age 100 mult capped 1.35', C.ageMult(100), 1.35, 1e-9);
eq('age 16 mult = 1.06', C.ageMult(16), 1.06, 1e-9);

console.log('\ne1RM source and shadow');
{
  const curl = exById.db_curl, t0 = Date.UTC(2026, 5, 1);
  const one = [S(0, 'db_curl', [[50, 12], [50, 8], [50, 7]])];
  const a = C.analyze('db_curl', one, curl, 180, t0 + DAY);
  eq('per-set estimates for 50 × 12 / 8 / 7 are 70 / 63.3 / 61.7', [12, 8, 7].map(r => +C.epley(50, r).toFixed(1)).join(' / '), '70 / 63.3 / 61.7');
  eq('session e1RM is the best set (70), later sets do not lower it', a.current, 70, 0.01);
  eq('it names the set it came from (50 × 12)', a.currentFrom.top.w + '×' + a.currentFrom.top.r, '50×12');
  eq('a 12-rep top set is flagged less precise', a.rough, true);
  eq('10 reps is not flagged', C.isRough(10), false);
  eq('first session has no shadow verdict yet', a.lastVsShadow, null);
  const two = one.concat([S(7, 'db_curl', [[55, 10]])]);                    // 73.3 beats 70
  const b = C.analyze('db_curl', two, curl, 180, t0 + 8 * DAY);
  eq('last session beat the shadow', b.lastVsShadow.beat, true);
  eq('by +3.3', b.lastVsShadow.delta, 3.33, 0.01);
  eq('the shadow is now that set, dated that session', b.shadow.top.w + '×' + b.shadow.top.r + '@' + (b.shadow.date === two[1].date), '55×10@true');
  const three = two.concat([S(14, 'db_curl', [[55, 8], [55, 8]])]);         // 69.7, short of 73.3
  const c = C.analyze('db_curl', three, curl, 180, t0 + 15 * DAY);
  eq('next session fell short: not beaten', c.lastVsShadow.beat, false);
  eq('short by 3.7', c.lastVsShadow.delta, -3.67, 0.01);
  eq('shadow unchanged (55 × 10)', c.shadow.top.w + '×' + c.shadow.top.r, '55×10');
}
eq('ordinal 72 → 72nd', C.ordinal(72), '72nd');
eq('ordinal 11 → 11th', C.ordinal(11), '11th');

console.log('\nReadout');
{
  const now = Date.UTC(2026, 5, 1) + 60 * DAY;
  const sessions = [];
  [0, 7, 14, 21, 28, 35, 42, 49].forEach((d, i) => {
    sessions.push(S(d, 'bb_bench', [[135 + i * 3, 5], [135, 5], [135, 5]]));
    sessions.push(S(d + 1, 'bb_ohp', [[95 + i * 2, 5], [95, 5], [95, 5]]));
    sessions.push(S(d + 2, 'bb_row', [[135 + i * 1, 5], [135, 5], [135, 5]]));
    sessions.push(S(d + 3, 'bb_squat', [[225, 8], [225, 8], [225, 8]]));
  });
  const an = C.EX.map(e => C.analyze(e.id, sessions, e, 180, now)).filter(Boolean);
  const text = C.readout(an, exById, now);
  console.log('  → ' + text);
  eq('mentions overall %', /overall/.test(text), true);
  eq('names leading pattern', /Push is carrying it/.test(text), true);
  eq('names stalled squat', /Back Squat hasn't moved/.test(text), true);
}
eq('empty readout is honest', /Log a workout/.test(C.readout([], exById)), true);

console.log('\nGamification');
eq('level 1 at 0 xp', C.levelFromXp(0).level, 1);
eq('rank E at level 1', C.levelFromXp(0).rank, 'E');
eq('xpForLevel monotonic', C.xpForLevel(10) > C.xpForLevel(9), true);
eq('rank S at level 31', C.levelFromXp(C.xpForLevel(31)).rank, 'S');
{
  const now = Date.UTC(2026, 5, 17, 12); // Wed Jun 17 2026
  const sess = [];
  [-16, -14, -12, -9, -7, -5, -2, -1].forEach(d => sess.push({ date: now + d * DAY, entries: [] }));
  const st = C.streak(sess, 3, now);
  eq('this week count 2 (Mon 15, Tue 16)', st.thisWeek, 2);
  eq('streak counts prior full weeks (2)', st.weeks, 2);
  eq('left this week 1', st.left, 1);
}

console.log('\nStreak shield');
{
  const now = Date.UTC(2026, 5, 17, 12); // Wed Jun 17 2026; weeks start Mon
  const wk = n => now - n * 7 * DAY; // n weeks ago, same weekday
  const mkWeeks = arr => arr.flatMap(n => [0, 1, 2].map(k => ({ date: wk(n) - k * DAY + 12 * 3600e3, entries: [] })));
  // week n ago starts: 1→Jun 8, 2→Jun 1, 3→May 25, 4→May 18, 5→May 11, 6→May 4, 7→Apr 27
  const s1 = C.streak(mkWeeks([1, 2, 4, 5]), 3, now);
  eq('one missed week (May 25) forgiven → 4', s1.weeks, 4);
  eq('shield recorded', s1.shieldsUsed.length, 1);
  eq('June shield still ready (miss was in May)', s1.shieldReady, true);
  const s2 = C.streak(mkWeeks([1, 2, 5, 6]), 3, now);
  eq('two consecutive misses end the streak → 2', s2.weeks, 2);
  // misses in weeks 3 (May 25) and 5 (May 11): both May → only the first forgiven → 1,2 met + 4 met = 3
  const s3 = C.streak(mkWeeks([1, 2, 4, 6, 7]), 3, now);
  eq('one shield per month → 3', s3.weeks, 3);
  // miss in week 1 (Jun 8) forgiven with June shield; weeks 2,3 met → 2, shield used this month
  const s5 = C.streak(mkWeeks([2, 3]), 3, now);
  eq('June miss forgiven → 2', s5.weeks, 2);
  eq('shieldReady false when used this month', s5.shieldReady, false);
  eq('shieldReady true with no miss', C.streak(mkWeeks([1, 2]), 3, now).shieldReady, true);
  eq('trailing miss with nothing before it is not forgiven', C.streak(mkWeeks([1, 2, 4]), 3, now).weeks, 3);
}

console.log('\nRank');
eq('no formed lifts → E', C.rankFor([]), 'E');
eq('novice → D', C.rankFor([0, 1]), 'D');
eq('intermediate → C', C.rankFor([1, 2]), 'C');
eq('advanced → B', C.rankFor([3, 1]), 'B');
eq('elite → A', C.rankFor([4, 2]), 'A');
eq('two elite → S', C.rankFor([4, 4]), 'S');
eq('elite + two advanced → S', C.rankFor([4, 3, 3]), 'S');
{
  // at 180 lb: bench Intermediate ≈ 220, squat Intermediate ≈ 297
  const lifts = [{ exId: 'bb_squat', name: 'Back Squat', current: 280, tier: 1, std: 'squat' }, { exId: 'bb_bench', name: 'Bench Press', current: 215, tier: 1, std: 'bench' }];
  const n = C.rankNext(lifts, 180, 'm', 30);
  eq('rank D → next C', n.next, 'C');
  eq('closest lift by relative gap is bench (215 → 220, 2%)', n.exId, 'bb_bench');
  eq('target rounds to 5', n.target % 5, 0);
  eq('target = published Intermediate at 180 lb (220)', n.target, 220);
  eq('text gives the weight with its unit', /Bench Press hits 220 lb e1RM \(Intermediate\)/.test(n.text), true);
  eq('age 45 lowers the target (220 / 1.06 → 205)', C.rankNext([{ exId: 'bb_bench', name: 'Bench Press', current: 200, tier: 1, std: 'bench' }], 180, 'm', 45).target, 205);
  eq('already past every line → rule text, no target', C.rankNext([{ exId: 'bb_squat', name: 'Back Squat', current: 300, tier: 1, std: 'squat' }, { exId: 'bb_bench', name: 'Bench Press', current: 225, tier: 1, std: 'bench' }], 180, 'm', 45).target, undefined);
  // bodyweight lifts: the target comes back as added weight (Intermediate at 200 lb = 278 total = +78 → +80)
  const pu = C.rankNext([{ exId: 'bw_pullup', name: 'Pull-Up', current: 250, tier: 1, std: 'pull_up', base: 200, words: ' added' }], 200, 'm', 30);
  eq('pull-up target is expressed as added weight', pu.target + ' ' + /hits \+80 lb added e1RM/.test(pu.text), '80 true');
  eq('S rank has no next', C.rankNext([{ exId: 'a', name: 'a', current: 1, tier: 4, std: 'squat' }, { exId: 'b', name: 'b', current: 1, tier: 4, std: 'bench' }], 180, 'm', 30).next, null);
}

console.log('\nDaily quest');
{
  const now = Date.UTC(2026, 5, 17, 12); // Wednesday → 5 days left in week
  const stAtRisk = { left: 2, weeks: 4 }, stSafe = { left: 0, weeks: 4 };
  eq('streak quest only when days left ≤ sessions left', C.dailyQuest({}, exById, { left: 5, weeks: 4 }, now).kind, 'streak');
  eq('no streak pressure → not streak', C.dailyQuest({}, exById, stAtRisk, now).kind !== 'streak', true);
  eq('empty data → log quest', C.dailyQuest({}, exById, stSafe, now).kind, 'log');
  const base = Date.UTC(2026, 5, 1);
  const sessions = [165, 170, 175, 180, 185, 185, 185].map((w, i) => S(i * 7, 'bb_bench', [[w, 5], [w, 5], [w, 5]]));
  const an = { bb_bench: C.analyze('bb_bench', sessions, bench, 180, base + 45 * DAY) };
  const q = C.dailyQuest(an, exById, stSafe, base + 45 * DAY);
  eq('near-PR lift → pr quest (+5 lb upper)', q.kind === 'pr' && q.target === 190 && q.reps === 5, true);
  eq('pr quest done when session beats best', C.questDone(q, { entries: [{ exId: 'bb_bench', sets: [{ w: 190, r: 5 }] }] }, bench, 180, an.bb_bench.allTimeBest), true);
  eq('pr quest not done on same numbers', C.questDone(q, { entries: [{ exId: 'bb_bench', sets: [{ w: 185, r: 5 }] }] }, bench, 180, an.bb_bench.allTimeBest), false);
  // stalled squat (identical sessions, best long ago) → stall quest when no near-PR candidate
  const sq = [0, 10, 20, 30, 40].map(d => S(d, 'bb_squat', [[225, 8], [225, 8], [225, 8]]));
  const an2 = { bb_squat: C.analyze('bb_squat', sq, squat, 180, base + 45 * DAY) };
  const q2 = C.dailyQuest(an2, exById, stSafe, base + 45 * DAY);
  eq('stalled lift → stall quest with 235 target', q2.kind === 'stall' && q2.target === 235, true);
  eq('stall quest done when 235 is loaded', C.questDone(q2, { entries: [{ exId: 'bb_squat', sets: [{ w: 235, r: 6 }] }] }, squat, 180, 0), true);
  eq('same key all day', C.dailyQuest(an, exById, stSafe, base + 45 * DAY + 3600e3 * 3).key, q.key);
}

console.log('\nWeight convention (total / per dumbbell / per side)');
{
  const dbb = exById.db_bench, fly = exById.mc_cable_fly, gob = exById.db_goblet, bss = exById.db_bss;
  eq('db bench entered per dumbbell', C.loadMode(dbb), 'db');
  eq('cable fly entered per side', C.loadMode(fly), 'side');
  eq('goblet squat (one dumbbell) is total', C.loadMode(gob), 'total');
  eq('barbell bench is total', C.loadMode(bench), 'total');
  eq('pull-up is added weight', C.loadMode(pullup), 'bw');
  // e1RM stays in the entered unit so progress compares like with like
  eq('60 lb dumbbells × 8 → e1RM 76 per dumbbell', Math.round(C.setE1RM(dbb, { w: 60, r: 8 }, 180)), 76);
  // volume counts both hands / both sides
  const sess = { entries: [{ exId: 'db_bench', sets: [{ w: 60, r: 10 }] }, { exId: 'mc_cable_fly', sets: [{ w: 20, r: 12 }] }, { exId: 'bb_bench', sets: [{ w: 135, r: 5 }] }] };
  eq('volume: 2×60×10 + 2×20×12 + 135×5 = 2355', C.sessionVolume(sess, exById, 180), 2355);
  // standards are published per dumbbell, the unit we log in: 80s × 5 → 93.3 per dumbbell, Intermediate at 180 lb is 89
  eq('80s × 5 is Intermediate on dumbbell bench', C.percentile(C.setE1RM(dbb, { w: 80, r: 5 }, 180), 180, 'm', 30, 'db_bench').tierName, 'Intermediate');
  // rank targets come back in the entered unit (per dumbbell)
  const n = C.rankNext([{ exId: 'db_bench', name: 'Dumbbell Bench Press', current: 70, tier: 1, std: 'db_bench', words: ' per dumbbell' }], 180, 'm', 30);
  eq('rank target for db bench is per dumbbell (published Intermediate at 180 lb ≈ 89 → 90)', n.target, 90);
  eq('rank text says per dumbbell', /90 lb per dumbbell e1RM/.test(n.text), true);
  // stall prescriptions: +5 per dumbbell even on lower-body dumbbell lifts, and say so
  const now = Date.UTC(2026, 5, 1) + 45 * DAY;
  const sessions = [0, 10, 20, 30, 40].map(d => S(d, 'db_bss', [[40, 10], [40, 10], [40, 10]]));
  const a = C.analyze('db_bss', sessions, bss, 180, now);
  eq('split squat stalled at top of range → +5 per dumbbell (45)', a.stall && a.stall.weight, 45);
  eq('stall text names the unit', /45 lb per dumbbell/.test(a.stall.text), true);
  const sq = [0, 10, 20, 30, 40].map(d => S(d, 'bb_squat', [[225, 8], [225, 8], [225, 8]]));
  eq('barbell squat still +10 total', C.analyze('bb_squat', sq, squat, 180, now).stall.weight, 235);
}

console.log('\nCalendar / plan');
{
  const K = (y, m, d) => C.dateKey(new Date(y, m - 1, d).getTime());
  eq('dateKey is a local YYYY-MM-DD', K(2026, 10, 5), '2026-10-05');
  eq('addDays crosses a month', C.addDays('2026-10-30', 3), '2026-11-02');
  eq('dowOf: Monday = 0 (2026-10-12 is a Monday)', C.dowOf('2026-10-12'), 0);
  eq('dowOf: Sunday = 6', C.dowOf('2026-10-18'), 6);
  const plan = { days: { '2026-10-14': 'push', '2026-10-19': '', '2026-10-20': 'legs' }, repeats: [{ id: 'r1', dow: 0, routineId: 'pull', from: '2026-10-12' }] };
  eq('a day entry is planned', C.plannedFor(plan, '2026-10-14').routineId, 'push');
  eq('repeat fills its weekday from its start date', C.plannedFor(plan, '2026-10-12').routineId + '/' + C.plannedFor(plan, '2026-10-26').source, 'pull/repeat');
  eq('repeat does not reach back before its start', C.plannedFor(plan, '2026-10-05'), null);
  eq('a skip on one day cancels the repeat that day only', C.plannedFor(plan, '2026-10-19'), null);
  eq('a day entry beats a repeat', C.plannedFor({ days: { '2026-10-12': 'legs' }, repeats: plan.repeats }, '2026-10-12').routineId, 'legs');
  eq('an ended repeat stops after its until date', C.plannedFor({ days: {}, repeats: [{ id: 'r', dow: 0, routineId: 'pull', from: '2026-10-12', until: '2026-10-18' }] }, '2026-10-19'), null);
  eq('the newest repeat for a weekday wins', C.plannedFor({ days: {}, repeats: [{ id: 'a', dow: 0, routineId: 'pull', from: '2026-10-05' }, { id: 'b', dow: 0, routineId: 'legs', from: '2026-10-19' }] }, '2026-10-26').routineId, 'legs');
  eq('nothing planned → null', C.plannedFor(plan, '2026-10-15'), null);
  eq('empty plan → null', C.plannedFor({}, '2026-10-15'), null);
  // status
  const at = (y, m, d, rid) => ({ id: 's' + d, date: new Date(y, m - 1, d, 18).getTime(), routineId: rid || null, entries: [] });
  const byDay = C.sessionsByDay([at(2026, 10, 12, 'pull'), at(2026, 10, 13)]);
  const today = '2026-10-15';
  eq('planned + trained that day = done', C.dayStatus(plan, byDay, '2026-10-12', today).state, 'done');
  eq('…and it knows it was the planned routine', C.dayStatus(plan, byDay, '2026-10-12', today).match, true);
  eq('trained with nothing planned = extra', C.dayStatus(plan, byDay, '2026-10-13', today).state, 'extra');
  eq('planned, past, not trained = missed', C.dayStatus(plan, byDay, '2026-10-14', today).state, 'missed');
  eq('planned, today or later = planned', C.dayStatus(plan, byDay, '2026-10-20', today).state, 'planned');
  eq('nothing = none', C.dayStatus(plan, byDay, '2026-10-16', today).state, 'none');
  // grid
  const g = C.monthGrid(2026, 9);   // October 2026 starts on a Thursday
  eq('month grid starts on the Monday before the 1st', g[0].key, '2026-09-28');
  eq('grid is whole weeks', g.length % 7, 0);
  eq('October has 31 in-month cells', g.filter(c => c.inMonth).length, 31);
  eq('February 2027 (starts Monday, 28 days) is 4 or 5 rows', C.monthGrid(2027, 1).length <= 35, true);
  // rotation
  const rot = C.fillRotation(['push', 'pull', null, 'legs'], '2026-10-12', 1);
  eq('rotation cycles its order across days', ['12', '13', '14', '15', '16'].map(d => rot['2026-10-' + d] || 'rest').join(','), 'push,pull,rest,legs,push');
  eq('rotation writes weeks × 7 days', Object.keys(rot).length, 7);
  eq('rest days are stored as skips', rot['2026-10-14'], '');
  // adherence
  const p2 = { days: { '2026-10-05': 'a', '2026-10-07': 'a', '2026-10-12': 'a', '2026-10-14': 'a' }, repeats: [] };
  const s2 = [at(2026, 10, 5, 'a'), at(2026, 10, 7, 'a'), at(2026, 10, 12, 'a')];
  const ps = C.planStats(p2, s2, new Date(2026, 9, 19, 12).getTime());
  eq('planned days trained on the day', ps.plannedDone, 3);
  eq('one fully kept week (Oct 5–11), the next had a miss', ps.perfectWeeks, 1);
  eq('no plan → zeros', JSON.stringify(C.planStats({}, s2, Date.now())), '{"plannedDone":0,"perfectWeeks":0}');
}

console.log('\nTitles catalog');
const T = require('./titles.js').ARISE_TITLES;
{
  const count = g => T.TITLES.filter(t => t.grade === g).length;
  eq('about 125 titles (18 original + about 100 new)', T.TITLES.length >= 118 && T.TITLES.length <= 130, true);
  eq('ids are unique', new Set(T.TITLES.map(t => t.id)).size, T.TITLES.length);
  eq('names are unique', new Set(T.TITLES.map(t => t.name)).size, T.TITLES.length);
  eq('every title has its own emblem (grade + glyph + mark)', new Set(T.TITLES.map(t => t.grade + '|' + t.glyph + '|' + t.mark)).size, T.TITLES.length);
  eq('every grade is well represented', count('common') >= 25 && count('rare') >= 25 && count('epic') >= 20 && count('legendary') >= 8, true);
  eq('grades are valid', T.TITLES.every(t => T.GRADES.includes(t.grade)), true);
  eq('every category is known and used', T.TITLES.every(t => T.CATS.some(c => c[0] === t.cat)) && T.CATS.every(c => T.TITLES.some(t => t.cat === c[0])), true);
  eq('every title has a condition and a System line', T.TITLES.every(t => t.desc.length > 8 && t.flavor.length > 8 && t.target > 0), true);
  eq('marks fit the emblem (6 characters at most)', T.TITLES.every(t => t.mark.length <= 6), true);
  eq('the 18 original titles keep their ids', ['first', 'w10', 'w50', 'w100', 'pr1', 'pr25', 'streak3', 'streak5', 'streak12', 'tier_int', 'tier_adv', 'tier_elite', 'dl2x', 'sq15', 'bench1x', 'pullup10', 'up10', 'vol10k'].every(id => T.BY_ID[id]), true);
  eq('estimated-1RM titles say so', ['dl2x', 'sq15', 'bench1x'].every(id => /estimated 1RM/.test(T.BY_ID[id].desc)), true);
  eq('Deadlift 405 is on the list and is not easy', T.BY_ID.d405.grade + ' ' + T.BY_ID.d405.stat, 'epic lift_deadlift');
  eq('an empty log earns nothing', T.earned(T.stats({ sessions: [], exById, analyses: {}, bodyweight: 180 })).length, 0);
  eq('stat kinds', [T.kind('lift_bench'), T.kind('total3'), T.kind('lifeVolume'), T.kind('bw_squat'), T.kind('overall'), T.kind('workouts')].join(','), 'lb,lb,vol,x,pct,n');
}

console.log('\nTitles from a log');
{
  const at = (y, m, d, hh, mm, mins, entries) => { const t = new Date(y, m - 1, d, hh, mm).getTime(); return { id: 't' + d + hh, date: t, endedAt: mins ? t + mins * 60000 : undefined, entries: entries.map(([exId, sets]) => ({ exId, sets: sets.map(([w, r, warm]) => ({ w, r, warmup: !!warm })) })) }; };
  const log = [
    at(2026, 9, 1, 18, 0, 95, [['bb_bench', [[315, 1, true], [205, 10], [225, 5]]], ['bb_squat', [[315, 3]]], ['bb_deadlift', [[405, 1]]]]),   // Tue evening, 95 min
    at(2026, 10, 3, 5, 30, 40, [['bb_ohp', [[135, 1]]], ['bw_pullup', [[0, 12], [45, 3]]]]),                                                  // Sat 5:30 am, after 32 days away
    at(2026, 10, 4, 22, 15, 30, [['db_bench', [[75, 8]]], ['bw_dip', [[0, 20]]]]),                                                             // Sun 10:15 pm
  ];
  const now = new Date(2026, 9, 19, 12).getTime();
  const S = T.stats({ sessions: log, exById, analyses: {}, bodyweight: 180, xp: C.xpForLevel(5), prs: [{ sessionId: 't118' }, { sessionId: 't118' }, { sessionId: 't118' }, { sessionId: 't35' }], questCount: 10, now });
  const E = new Set(T.earned(S)), hasAll = ids => ids.filter(id => !E.has(id)).join(',') || 'ok', hasNone = ids => ids.filter(id => E.has(id)).join(',') || 'ok';
  eq('lifted weight is the heaviest logged set, not an estimate (205 × 10 estimates 273, bench stays 225)', S.lift_bench, 225);
  eq('warm-up sets never count (315 warm-up ignored)', E.has('b315'), false);
  eq('bench titles up to two plates', hasAll(['b135', 'b185', 'b225']) + '/' + hasNone(['b275', 'b315']), 'ok/ok');
  eq('squat and deadlift titles from actual weight', hasAll(['s135', 's225', 's315', 'd135', 'd225', 'd315', 'd405']) + '/' + hasNone(['s405', 'd495']), 'ok/ok');
  eq('overhead press 135', hasAll(['o95', 'o135']), 'ok');
  eq('big-three total is 225 + 315 + 405 = 945', S.total3, 945);
  eq('…so 750 total yes, 1,000 not yet', E.has('t750') + ',' + E.has('t1000'), 'true,false');
  eq('total needs all three lifts on record', T.stats({ sessions: [log[1]], exById, analyses: {}, bodyweight: 180, now }).total3, 0);
  eq('bodyweight multiples use actual lifts: deadlift 405 at 180 lb = 2.25×', S.bw_deadlift, 2.25, 1e-9);
  eq('…2.5× not earned', E.has('bw_d25'), false);
  eq('rep feats: 225 × 5, and bodyweight × 10 from the 205 set', hasAll(['f_b225x5', 'f_bbw10']) + '/' + hasNone(['f_b225x10']), 'ok/ok');
  eq('pull-ups: 12 reps and +45 lb', hasAll(['pu1', 'pu5', 'pullup10', 'pu45']) + '/' + hasNone(['pu20', 'pu90']), 'ok/ok');
  eq('dips and dumbbells', hasAll(['dip20', 'db50', 'db75']) + '/' + hasNone(['dip45', 'db100']), 'ok/ok');
  eq('habits: dawn, night, weekend, comeback, 90 minutes', hasAll(['early', 'late', 'weekend', 'comeback', 'long90']), 'ok');
  eq('shadows beaten: 4 in total, 3 in one workout', S.shadows + ',' + S.shadowsInSession + ',' + E.has('pr3x') + ',' + E.has('pr5'), '4,3,true,false');
  eq('level and quests', hasAll(['lvl5', 'q1', 'q10']) + '/' + hasNone(['lvl10', 'q50']), 'ok/ok');
  eq('first workout earned, ten not yet', E.has('first') + ',' + E.has('w10'), 'true,false');
  const p = T.progress(T.BY_ID.b275, S);
  eq('progress toward a locked title: 225 of 275', p.value + '/' + p.target + ' ' + p.frac.toFixed(2), '225/275 0.82');
  // tiers, rank and growth come from the analyses
  const S2 = T.stats({ sessions: log, exById, analyses: { bb_bench: { formed: true, current: 250, change: 30 } }, bodyweight: 200, sex: 'm', age: 30, now });
  const E2 = new Set(T.earned(S2));
  eq('250 bench at 200 lb is Intermediate → tier and rank titles', [S2.maxTier, S2.tierInt, S2.rank, E2.has('tier_int'), E2.has('rankC'), E2.has('rankB'), E2.has('int3')].join(','), '2,1,2,true,true,false,false');
  eq('growth titles from change against baseline', [E2.has('up10'), E2.has('o25'), E2.has('g25'), E2.has('g50')].join(','), 'true,true,true,false');
  // a planned day trained on the day
  const S3 = T.stats({ sessions: log, exById, analyses: {}, bodyweight: 180, plan: { days: { '2026-10-03': 'x', '2026-10-06': 'x' }, repeats: [] }, now });
  eq('training on a scheduled day counts once', S3.plannedDone + ',' + T.has(T.BY_ID.pl1, S3), '1,true');
}

console.log('\nLibrary and programs');
{
  const ids = new Set(C.EX.map(e => e.id));
  eq('no duplicate exercise ids', ids.size, C.EX.length);
  eq('every standards key exists in the published data', C.EX.every(e => !e.std || C.STDS.lifts[e.std]), true);
  eq('22 lifts have published standards', Object.keys(C.STDS.lifts).length, 22);
  const p = C.PROGRAMS[0];
  eq('PPLP has 4 routines', p.routines.length, 4);
  eq('every program exercise exists in the library', p.routines.every(r => r.items.every(i => ids.has(i[0]))), true);
  eq('every program item has sets, reps range, rest', p.routines.every(r => r.items.every(i => i[1] > 0 && i[2] > 0 && i[3] >= i[2] && i[4] >= 0)), true);
  eq('30 exercise slots (6 / 7 / 8 / 9)', p.routines.map(r => r.items.length).join('/'), '6/7/8/9');
  eq('Push order: bench, cable lateral, incline DB, fly, pushdown, OH ext', p.routines[0].items.map(i => i[0]).join(','), 'bb_bench,mc_cable_lateral,db_incline,mc_cable_fly,mc_pushdown,mc_oh_tri_ext');
  eq('Legs uses seated calf raise 4×10–15', JSON.stringify(p.routines[2].items[2].slice(0, 4)), JSON.stringify(['mc_seated_calf', 4, 10, 15]));
  eq('Pretty opens with seated DB shoulder press 3×8–12', JSON.stringify(p.routines[3].items[0].slice(0, 4)), JSON.stringify(['db_shoulder', 3, 8, 12]));
  eq('rest: heavy compounds ≥150 s, isolation ≤90 s', p.routines.every(r => r.items.every(i => ['bb_bench', 'bb_squat', 'bb_rdl', 'bw_pullup'].includes(i[0]) ? i[4] >= 150 : ['db_incline', 'db_shoulder', 'mc_cs_row', 'mc_leg_press'].includes(i[0]) ? i[4] >= 90 && i[4] <= 120 : i[4] <= 90)), true);
}

console.log('\nShadow aura (reward for a full-body week)');
{
  const all = {}; C.AURA_REGIONS.forEach(k => all[k] = 3);
  eq('16 regions on the body map', C.AURA_REGIONS.length, 16);
  eq('every region trained → aura', C.auraStatus(all).full, true);
  const some = Object.assign({}, all); delete some.calves; some.forearms = 0;
  const st = C.auraStatus(some);
  eq('two regions missing → no aura', st.full, false);
  eq('count of trained regions', st.done + '/' + st.total, '14/16');
  eq('missing regions named, in body-map order', st.missing.join(), 'forearms,calves');
  eq('nothing trained → all missing', C.auraStatus({}).missing.length, 16);
  eq('every region has a display name', C.AURA_REGIONS.every(k => C.AURA_NAMES[k]), true);
}

console.log('\nCharacters (characters.js)');
{
  const fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'characters.js'), 'utf8');
  const A = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
  const BUILDS = ['lean', 'athletic', 'powerful'], KEYS = new Set(C.AURA_REGIONS);
  const inside = (F, d) => /^M\d+ \d+( L\d+ \d+){2,} Z$/.test(d) && d.match(/\d+ \d+/g).every(p => { const [x, y] = p.split(' ').map(Number); return x <= F.w && y <= F.h; });
  for (const sex of ['m', 'f']) for (const b of BUILDS) {
    const seen = new Set();
    for (const v of ['front', 'back']) {
      const F = A[sex] && A[sex][b] && A[sex][b][v], t = sex + ' ' + b + ' ' + v + ': ';
      eq(t + 'image on disk, canvas size, feet line near the bottom', !!(F && fs.existsSync(path.join(__dirname, F.img)) && F.w > 250 && F.h > 900 && F.feet > 0.92 * F.h && F.feet <= F.h), true);
      eq(t + 'every muscle shape belongs to a body-map region and is a closed path on the canvas', F.regions.length >= 20 && F.regions.every(([k, d]) => KEYS.has(k) && inside(F, d)), true);
      eq(t + 'the body below the neck has an outline, and any plain panels are paths on the canvas', F.body.length >= 1 && F.body.every(d => inside(F, d)) && F.panels.every(d => inside(F, d)), true);
      F.regions.forEach(([k]) => seen.add(k));
    }
    eq(sex + ' ' + b + ': every muscle shows in the front or the back view', C.AURA_REGIONS.filter(k => !seen.has(k)).join(), '');
  }
  const front = k => (sx, b) => A[sx][b].front.regions.some(r => r[0] === k), back = k => (sx, b) => A[sx][b].back.regions.some(r => r[0] === k);
  eq('chest, abs and biceps on the front; lats, rhomboids, lower back and hamstrings on the back', ['m', 'f'].every(sx => BUILDS.every(b => ['chest', 'abs', 'biceps'].every(k => front(k)(sx, b)) && ['lats', 'rhomboids', 'erectors', 'hams'].every(k => back(k)(sx, b)))), true);
  // her muscles come from his detailed traced figure (only her chest is her own), so both are equally defined
  eq('her back is as detailed as his (glutes in parts, hamstring heads)', ['lean', 'athletic', 'powerful'].every(b => ['glutes', 'hams'].every(k => A.f[b].back.regions.filter(r => r[0] === k).length >= A.m[b].back.regions.filter(r => r[0] === k).length - 2)), true);
  eq('the three builds share one canvas, so the figure does not jump when the body grows', ['m', 'f'].every(sx => ['front', 'back'].every(v => new Set(BUILDS.map(b => A[sx][b][v].w + 'x' + A[sx][b][v].h)).size === 1)), true);
  eq('build by Hunter rank (E D C B A S)', C.RANK_ORDER.map(C.buildFor).join(), 'lean,lean,athletic,athletic,powerful,powerful');
  eq('no rank yet → lean', C.buildFor(undefined), 'lean');
}

console.log('\nTitles for women');
{
  const M = T.forSex('m'), W = T.forSex('f');
  eq('men keep the original set', M.TITLES === T.TITLES, true);
  eq('same ids, grades and categories for women', W.TITLES.map(t => t.id + t.grade + t.cat).join() === T.TITLES.map(t => t.id + t.grade + t.cat).join(), true);
  eq('every women\'s override is a real title', Object.keys(T.FEMALE).every(id => T.BY_ID[id]), true);
  eq('about 60 weight-based titles have women\'s targets', Object.keys(T.FEMALE).length >= 55 && Object.keys(T.FEMALE).length <= 66, true);
  const FEATS = ['reps_bench225', 'reps_dl405', 'reps_benchBW', 'reps_squatBW'];
  eq('women\'s targets are lower than the men\'s', Object.keys(T.FEMALE).filter(id => !FEATS.includes(T.BY_ID[id].stat)).every(id => W.BY_ID[id].target < M.BY_ID[id].target), true);
  eq('rep feats are counted at lighter weights for women', ['bench', 'deadlift', 'benchBW', 'squatBW'].every(k => T.FEAT.f[k] < T.FEAT.m[k]), true);
  eq('titles not tied to weight are the same for everyone', W.TITLES.filter(t => !T.FEMALE[t.id]).every(t => t === T.BY_ID[t.id]), true);
  eq('women\'s names are unique', new Set(W.TITLES.map(t => t.name)).size, W.TITLES.length);
  eq('women\'s emblems are unique', new Set(W.TITLES.map(t => t.grade + '|' + t.glyph + '|' + t.mark)).size, W.TITLES.length);
  // ladders still climb: within a stat, a higher grade never asks for less
  const G = { common: 0, rare: 1, epic: 2, legendary: 3 }, byStat = {};
  for (const t of W.TITLES) (byStat[t.stat] = byStat[t.stat] || []).push(t);
  eq('women\'s ladders climb with grade', Object.values(byStat).every(list => list.slice().sort((a, b) => a.target - b.target).every((t, i, arr) => !i || G[t.grade] >= G[arr[i - 1].grade])), true);
  // equal difficulty: each target sits at about the same percentile among women who lift as the men's does among men
  const rows = require('./tools/women-titles.js').rows().filter(r => r.pm != null);
  const off = rows.filter(r => !r.capped && (Math.abs(r.pf - r.pm) > 12 || Math.abs(r.pf2 - r.pm2) > 12));
  eq('women\'s targets within 12 percentile points of the men\'s (180 vs 140 lb and 200 vs 150 lb)', off.map(r => r.id + ' ' + Math.round(r.pm) + '/' + Math.round(r.pf)).join(), '');
  eq('top rungs are top rungs for women too (≥ 90th percentile)', rows.filter(r => r.capped).every(r => r.pf >= 90), true);
  eq('checked against standards: at least 40 titles', rows.length >= 40, true);
  // rep feats count at the women's weights
  const day = (d, entries) => ({ id: 'w' + d, date: new Date(2026, 9, d, 18).getTime(), entries: entries.map(([exId, sets]) => ({ exId, sets: sets.map(([w, r]) => ({ w, r })) })) });
  const wlog = [day(1, [['bb_bench', [[115, 6], [105, 10]]], ['bb_squat', [[115, 20]]], ['bb_deadlift', [[225, 5]]]]), day(3, [['bw_pullup', [[0, 3]]], ['bb_ohp', [[65, 3]]]])];
  const Sw = T.stats({ sessions: wlog, exById, analyses: {}, bodyweight: 140, sex: 'f', now: new Date(2026, 9, 10).getTime() });
  const Sm = T.stats({ sessions: wlog, exById, analyses: {}, bodyweight: 140, sex: 'm', now: new Date(2026, 9, 10).getTime() });
  eq('women: 115 × 6 counts toward "115 for 5"', Sw.reps_bench225, 6);
  eq('men: the same set does not count toward "225 for 5"', Sm.reps_bench225, 0);
  eq('women: 105 × 10 counts as reps at 75% of bodyweight', Sw.reps_benchBW, 10);
  eq('women: squat 115 × 20 counts as 75% of bodyweight for 20', Sw.reps_squatBW, 20);
  eq('women: deadlift 225 × 5 counts toward "225 for 5"', Sw.reps_dl405, 5);
  const got = new Set(T.earned(Sw, 'f')), gotM = new Set(T.earned(Sm, 'm'));
  eq('a woman\'s log earns her bench, squat, deadlift, press and pull-up titles', ['b135', 'b185', 'b225', 's225', 'd315', 'o135', 'pu5', 'f_b225x5', 'f_bbw10', 'f_s20', 'f_d405x5'].filter(id => !got.has(id)).join(), '');
  eq('the same log as a man earns far fewer', gotM.size < got.size && !gotM.has('d405') && !gotM.has('f_d405x5'), true);
  eq('progress uses the women\'s target', JSON.stringify(T.progress(W.BY_ID.b275, Sw)), JSON.stringify({ value: 115, target: 135, frac: 115 / 135 }));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
