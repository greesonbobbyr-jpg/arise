// Prints a few tier lookups next to the published values, as a human-readable sanity check.
// usage: node tools/spot-check-standards.js
const C = require('../core.js').ARISE_CORE;
const p = (e, bw, k, sex) => { const r = C.percentile(e, bw, sex || 'm', 30, k); return Math.round(r.pct) + '% ' + r.tierName + (r.next ? ' -> ' + r.next.name + ' at ' + Math.round(r.next.weight) : ''); };
const t = (k, bw, sex) => C.thresholds(k, sex || 'm', bw).map(Math.round).join(',');
console.log('deadlift 400 @200 lb  :', p(400, 200, 'deadlift'), '  (was "Novice" under the old table)');
console.log('deadlift 382 @200 lb  :', p(382, 200, 'deadlift'));
console.log('squat 340 @200 lb     :', p(340, 200, 'squat'));
console.log('bench 243 @200 lb     :', p(243, 200, 'bench'));
console.log('db bench 98/DB @200   :', p(98, 200, 'db_bench'));
console.log('pull-up BW x12 @200   :', p(280, 200, 'pull_up'), '  (280 total = 200 x 1.4)');
console.log('female bench 120 @160 :', p(120, 160, 'bench', 'f'));
console.log('thresholds deadlift @180:', t('deadlift', 180), ' published 201,268,348,438,535');
console.log('thresholds bench    @180:', t('bench', 180), ' published 127,169,220,277,339');
console.log('thresholds squat    @230:', t('squat', 230), ' published 227,294,373,462,555');
console.log('thresholds bench    @330:', t('bench', 330), '| @105:', t('bench', 105), ' (extrapolated; published 110 = 60,90,128,172,221)');
console.log('all-men estimate at lifter 20/50/80/95 (male, 30):', [20, 50, 80, 95].map(x => C.popEstimate(x, 'm', 30)).join(' / '), '| below Novice:', C.popEstimate(12, 'm', 30));
