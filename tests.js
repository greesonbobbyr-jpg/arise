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
eq('>12 reps flagged rough', C.isRough(15), true);
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

console.log('\n§5 Percentile');
eq('intermediate threshold → 50', C.percentile(1.75, 'm', 30, 'squat').pct, 50, 0.01);
eq('tier at threshold = Intermediate', C.percentile(1.75, 'm', 30, 'squat').tierName, 'Intermediate');
eq('novice threshold → 20', C.percentile(1.25, 'm', 30, 'squat').pct, 20, 0.01);
eq('midpoint nov/int → 35', C.percentile(1.5, 'm', 30, 'squat').pct, 35, 0.01);
eq('female bench 0.70 → 50', C.percentile(0.70, 'f', 30, 'bench').pct, 50, 0.01);
eq('below beginner floors at 1', C.percentile(0, 'm', 30, 'squat').pct, 1, 0.01);
eq('way above elite caps at 99', C.percentile(10, 'm', 30, 'squat').pct, 99, 0.01);
eq('age 45 mult = 1.06', C.ageMult(45), 1.06, 1e-9);
eq('age 100 mult capped 1.35', C.ageMult(100), 1.35, 1e-9);
eq('age 16 mult = 1.06', C.ageMult(16), 1.06, 1e-9);
eq('age adj: 1.65 @ 45 → 1.749 ≈ 49.9 pct', C.percentile(1.65, 'm', 45, 'squat').pct, 49.9, 0.5);
eq('no standards → null', C.percentile(1, 'm', 30, 'nope'), null);
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
  const lifts = [{ exId: 'bb_squat', name: 'Back Squat', current: 300, tier: 1, std: 'squat' }, { exId: 'bb_bench', name: 'Bench Press', current: 215, tier: 1, std: 'bench' }];
  const n = C.rankNext(lifts, 180, 'm', 30);
  eq('rank D → next C', n.next, 'C');
  eq('closest lift by relative gap is bench (215 → 225, 4.6%)', n.exId, 'bb_bench');
  eq('target rounds to 5', n.target % 5, 0);
  eq('target = 1.25 × 180 = 225', n.target, 225);
  eq('age 45 lowers the target (225 / 1.06 → 210)', C.rankNext([{ exId: 'bb_bench', name: 'Bench Press', current: 200, tier: 1, std: 'bench' }], 180, 'm', 45).target, 210);
  eq('already past every line → rule text, no target', C.rankNext(lifts, 180, 'm', 45).target, undefined);
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

console.log('\nLibrary and programs');
{
  const ids = new Set(C.EX.map(e => e.id));
  eq('no duplicate exercise ids', ids.size, C.EX.length);
  eq('every standards key exists', C.EX.every(e => !e.std || C.STD[e.std]), true);
  const p = C.PROGRAMS[0];
  eq('PPLP has 4 routines', p.routines.length, 4);
  eq('every program exercise exists in the library', p.routines.every(r => r.items.every(i => ids.has(i[0]))), true);
  eq('every program item has sets, reps range, rest', p.routines.every(r => r.items.every(i => i[1] > 0 && i[2] > 0 && i[3] >= i[2] && i[4] >= 0)), true);
  eq('31 exercise slots', p.routines.reduce((n, r) => n + r.items.length, 0), 31);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
