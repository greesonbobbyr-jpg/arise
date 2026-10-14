// Checks the women's title targets (FEMALE in titles.js) against the published standards.
// For each weight-based title it prints where the men's target sits among men who lift (180 lb man) and where the
// women's target sits among women who lift (140 lb woman), plus the same check at 200 lb vs 150 lb.
// usage: node tools/women-titles.js            prints the table
//        require('./tools/women-titles.js')    → rows, for tests
const path = require('path');
const C = require(path.join(__dirname, '..', 'core.js')).ARISE_CORE;
const T = require(path.join(__dirname, '..', 'titles.js')).ARISE_TITLES;
const STD = { lift_bench: 'bench', lift_squat: 'squat', lift_deadlift: 'deadlift', lift_ohp: 'ohp', lift_dbpress: 'db_bench', lift_dbshoulder: 'db_shoulder',
  lift_curl: 'barbell_curl', lift_legpress: 'leg_press', lift_hip: 'hip_thrust', bw_bench: 'bench', bw_squat: 'squat', bw_deadlift: 'deadlift',
  e1_bench_bw: 'bench', e1_sq_bw: 'squat', e1_dl_bw: 'deadlift', reps_bench225: 'bench', reps_dl405: 'deadlift', reps_benchBW: 'bench', reps_squatBW: 'squat' };
const ep = (w, r) => w * (1 + Math.min(r, 12) / 30);
// the 1RM-equivalent load a title asks for, for a given sex and bodyweight
function load(t, sex, bw) {
  const ft = T.FEAT[sex], v = t.target;
  switch (t.stat) {
    case 'bw_bench': case 'bw_squat': case 'bw_deadlift': case 'e1_bench_bw': case 'e1_sq_bw': case 'e1_dl_bw': return v * bw;
    case 'reps_bench225': return ep(ft.bench, v);
    case 'reps_dl405': return ep(ft.deadlift, v);
    case 'reps_benchBW': return ep(bw * ft.benchBW, v);
    case 'reps_squatBW': return ep(bw * ft.squatBW, v);
    default: return v;
  }
}
const pct = (t, sex, bw) => { const k = STD[t.stat]; if (!k) return null; const p = C.percentile(load(t, sex, bw), bw, sex, 30, k); return p ? p.pct : null; };
function rows() {
  const m = T.forSex('m').BY_ID, f = T.forSex('f').BY_ID, out = [];
  for (const id in T.FEMALE) {
    const tm = m[id], tf = f[id], row = { id, stat: tm.stat, grade: tm.grade, men: tm.target, women: tf.target, ratio: tf.target / tm.target };
    if (STD[tm.stat]) { row.pm = pct(tm, 'm', 180); row.pf = pct(tf, 'f', 140); row.pm2 = pct(tm, 'm', 200); row.pf2 = pct(tf, 'f', 150); row.gap = row.pf - row.pm; row.capped = row.pm >= 95; }
    out.push(row);
  }
  return out;
}
module.exports = { rows };
if (require.main === module) {
  const r = rows(), f = n => n == null ? '  -' : String(Math.round(n)).padStart(3);
  console.log('id'.padEnd(11) + 'grade'.padEnd(10) + 'men'.padStart(9) + 'women'.padStart(9) + '  p(m180) p(f140) gap | p(m200) p(f150)');
  for (const x of r) console.log(x.id.padEnd(11) + x.grade.padEnd(10) + String(x.men).padStart(9) + String(x.women).padStart(9) + '    ' + f(x.pm) + '     ' + f(x.pf) + '  ' + (x.gap == null ? '  -' : (x.gap >= 0 ? '+' : '') + Math.round(x.gap)).padStart(4) + ' |   ' + f(x.pm2) + '     ' + f(x.pf2) + (x.capped ? '  (top rung)' : '') + (x.pm == null ? '  ratio ' + x.ratio.toFixed(2) : ''));
}
