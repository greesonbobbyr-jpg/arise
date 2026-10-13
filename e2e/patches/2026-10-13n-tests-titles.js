// One-off patch (kept for the record): unit tests for titles.js replace the old 18-achievement tests.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'tests.js');
let s = fs.readFileSync(FILE, 'utf8');
const a = s.indexOf("console.log('\\nTitles (achievement presentation)');"), b = s.indexOf("console.log('\\nLibrary and programs');");
if (a < 0 || b < 0 || b < a) throw new Error('markers not found');
s = s.slice(0, a) + `console.log('\\nTitles catalog');
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

console.log('\\nTitles from a log');
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

` + s.slice(b);
fs.writeFileSync(FILE, s);
console.log('titles tests written');
