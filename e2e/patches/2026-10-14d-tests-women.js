// Patch: unit tests for the female figure data and the women's titles.
// run once: node e2e/patches/2026-10-14d-tests-women.js
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', '..', 'tests.js');
let s = fs.readFileSync(F, 'utf8');
const anchor = "console.log(`\\n${pass} passed, ${fail} failed`);";
if (s.split(anchor).length !== 2) throw new Error('summary line not found');
s = s.replace(anchor, () => `console.log('\\nCharacters (anatomy.js)');
{
  const src = require('fs').readFileSync(require('path').join(__dirname, 'anatomy.js'), 'utf8');
  const A = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
  const KEYS = new Set(['traps', 'chest', 'delts', 'biceps', 'triceps', 'forearms', 'obliques', 'abs', 'glutes', 'quads', 'calves', 'adductors', 'rhomboids', 'lats', 'erectors', 'hams']);
  for (const sex of ['m', 'f']) for (const v of ['front', 'back']) {
    const F = A[sex] && A[sex][v];
    eq(sex + ' ' + v + ': present with outline, muscles, nerves, feet line', !!(F && F.outline.length && F.muscles.length >= 26 && F.nerves.length === 5 && F.feet > 1000), true);
    eq(sex + ' ' + v + ': every muscle maps to a body-map key', F.muscles.every(m => KEYS.has(m.key) && m.d.length && /^M/.test(m.d[0])), true);
    eq(sex + ' ' + v + ': eyes on the front view only', v === 'front' ? !!(F.eye && F.eye.y > 60 && F.eye.y < 260 && F.eye.w > 80) : !F.eye, true);
  }
  // the male figure is the one the app always showed: same counts, same first path
  eq('male figure unchanged (26 front / 30 back muscles)', A.m.front.muscles.length + '/' + A.m.back.muscles.length, '26/30');
  eq('male front outline starts where it always did', A.m.front.outline[0].slice(0, 20), 'M512 70C511 70 509 7');
  eq('female figure is its own data', A.f.front.outline[0] !== A.m.front.outline[0] && A.f.front.viewBox !== A.m.front.viewBox, true);
  // reshaped: the female waist is narrower than her hips (outline width at the obliques vs the upper thighs)
  const width = (F, y) => { const n = F.outline[0].match(/-?\\d+/g).map(Number), xs = []; for (let i = 0; i + 1 < n.length; i += 2) if (Math.abs(n[i + 1] - y) < 8 && Math.abs(n[i] - 512) < 200) xs.push(n[i]); return Math.max(...xs) - Math.min(...xs); };
  const box = (F, key) => { const n = F.muscles.filter(m => m.key === key).flatMap(m => m.d[0].match(/-?\\d+/g).map(Number)); let y0 = 1e9, y1 = -1e9; for (let i = 1; i < n.length; i += 2) { y0 = Math.min(y0, n[i]); y1 = Math.max(y1, n[i]); } return [y0, y1]; };
  const fb = A.f.back, ob = box(fb, 'obliques'), gl = box(fb, 'glutes');
  eq('female back: waist narrower than hips', width(fb, (ob[0] + ob[1]) / 2) < width(fb, (gl[0] + gl[1]) / 2), true);
}

console.log('\\nTitles for women');
{
  const M = T.forSex('m'), W = T.forSex('f');
  eq('men keep the original set', M.TITLES === T.TITLES, true);
  eq('same ids, grades and categories for women', W.TITLES.map(t => t.id + t.grade + t.cat).join() === T.TITLES.map(t => t.id + t.grade + t.cat).join(), true);
  eq('every women\\'s override is a real title', Object.keys(T.FEMALE).every(id => T.BY_ID[id]), true);
  eq('about 60 weight-based titles have women\\'s targets', Object.keys(T.FEMALE).length >= 55 && Object.keys(T.FEMALE).length <= 66, true);
  eq('women\\'s targets are lower than the men\\'s', Object.keys(T.FEMALE).every(id => W.BY_ID[id].target < M.BY_ID[id].target || (id === 'pu1')), true);
  eq('titles not tied to weight are the same for everyone', W.TITLES.filter(t => !T.FEMALE[t.id]).every(t => t === T.BY_ID[t.id]), true);
  eq('women\\'s names are unique', new Set(W.TITLES.map(t => t.name)).size, W.TITLES.length);
  eq('women\\'s emblems are unique', new Set(W.TITLES.map(t => t.grade + '|' + t.glyph + '|' + t.mark)).size, W.TITLES.length);
  // ladders still climb: within a stat, a higher grade never asks for less
  const G = { common: 0, rare: 1, epic: 2, legendary: 3 }, byStat = {};
  for (const t of W.TITLES) (byStat[t.stat] = byStat[t.stat] || []).push(t);
  eq('women\\'s ladders climb with grade', Object.values(byStat).every(list => list.slice().sort((a, b) => a.target - b.target).every((t, i, arr) => !i || G[t.grade] >= G[arr[i - 1].grade])), true);
  // equal difficulty: each target sits at about the same percentile among women who lift as the men's does among men
  const rows = require('./tools/women-titles.js').rows().filter(r => r.pm != null);
  const off = rows.filter(r => !r.capped && (Math.abs(r.pf - r.pm) > 12 || Math.abs(r.pf2 - r.pm2) > 12));
  eq('women\\'s targets within 12 percentile points of the men\\'s (180 vs 140 lb and 200 vs 150 lb)', off.map(r => r.id + ' ' + Math.round(r.pm) + '/' + Math.round(r.pf)).join(), '');
  eq('top rungs are top rungs for women too (≥ 90th percentile)', rows.filter(r => r.capped).every(r => r.pf >= 90), true);
  eq('checked against standards: at least 40 titles', rows.length >= 40, true);
  // rep feats count at the women's weights
  const day = (d, entries) => ({ id: 'w' + d, date: new Date(2026, 9, d, 18).getTime(), entries: entries.map(([exId, sets]) => ({ exId, sets: sets.map(([w, r]) => ({ w, r })) })) });
  const wlog = [day(1, [['bb_bench', [[115, 6], [105, 10]]], ['bb_squat', [[105, 20]]], ['bb_deadlift', [[225, 5]]]]), day(3, [['bw_pullup', [[0, 3]]], ['bb_ohp', [[65, 3]]]])];
  const Sw = T.stats({ sessions: wlog, exById, analyses: {}, bodyweight: 140, sex: 'f', now: new Date(2026, 9, 10).getTime() });
  const Sm = T.stats({ sessions: wlog, exById, analyses: {}, bodyweight: 140, sex: 'm', now: new Date(2026, 9, 10).getTime() });
  eq('women: 115 × 6 counts toward "115 for 5"', Sw.reps_bench225, 6);
  eq('men: the same set does not count toward "225 for 5"', Sm.reps_bench225, 0);
  eq('women: 105 × 10 counts as 75% of bodyweight for 10', Sw.reps_benchBW, 10);
  eq('women: squat 105 × 20 counts as 75% of bodyweight for 20', Sw.reps_squatBW, 20);
  eq('women: deadlift 225 × 5 counts toward "225 for 5"', Sw.reps_dl405, 5);
  const got = new Set(T.earned(Sw, 'f')), gotM = new Set(T.earned(Sm, 'm'));
  eq('a woman\\'s log earns her bench, squat, deadlift, press and pull-up titles', ['b135', 'b185', 'b225', 's225', 'd405', 'o135', 'pu5', 'f_b225x5', 'f_bbw10', 'f_s20', 'f_d405x5'].filter(id => !got.has(id)).join(), '');
  eq('the same log as a man earns far fewer', gotM.size < got.size && !gotM.has('d405') && !gotM.has('f_d405x5'), true);
  eq('progress uses the women\\'s target', JSON.stringify(T.progress(W.BY_ID.b275, Sw)), JSON.stringify({ value: 115, target: 135, frac: 115 / 135 }));
}

` + anchor);
fs.writeFileSync(F, s);
console.log('tests patch applied');
