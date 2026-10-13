// One-off patch (kept for the record): core.js moves to published, bodyweight-specific standards,
// adds the all-men estimate, and exposes where e1RM and the shadow come from.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'core.js');
let s = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 110)); s = s.replace(a, () => b); };

// 1. standards: replace the hand-written ratio table with the published, bodyweight-specific data
const a = s.indexOf('  // ---------- Strength standards (§5)'), b = s.indexOf('  const PCTS = [5, 20, 50, 80, 95];');
if (a < 0 || b < 0) throw new Error('STD block not found');
s = s.slice(0, a) + `  // ---------- Strength standards ----------
  // Published 1RM standards by bodyweight (see standards.js / tools/build-standards.js). Levels are percentiles
  // among PEOPLE WHO LIFT AND LOG THEIR LIFTS of the same sex and bodyweight — not the general population.
  const STDS = (typeof window !== 'undefined' && window.ARISE_STANDARDS) || (typeof require === 'function' ? require('./standards.js').ARISE_STANDARDS : null);
` + s.slice(b);
R("{ id: 'bb_sumo',       name: 'Sumo Deadlift',           cat: 'hinge', equip: 'Barbell', muscle: 'Glutes',     group: 'glutes',    std: 'deadlift' },",
  "{ id: 'bb_sumo',       name: 'Sumo Deadlift',           cat: 'hinge', equip: 'Barbell', muscle: 'Glutes',     group: 'glutes',    std: 'sumo_deadlift' },");
R("group: 'chest',     bw: 0.64, std: 'push_up' },", "group: 'chest',     bw: 0.64 },");   // no weight-based push-up standard is published

// 2. estimates from sets above 10 reps are less precise
R("function isRough(r) { return (+r || 0) > 12; }", "function isRough(r) { return (+r || 0) > 10; }");

// 3. dumbbell standards are published per dumbbell, the same unit we log in: no conversion needed
R("  // Anything that needs the whole load (volume, strength standards) multiplies by loadMult / stdMult.\n", "  // Volume needs the whole load, so it multiplies by loadMult. Standards are published in the entered unit.\n");
R("  function stdMult(ex) { return loadMode(ex) === 'db' ? 2 : 1; }                                 // dumbbell standards are for the pair\n", "");

// 4. analyze: where the current number came from, the shadow, and how the last session did against it
R(`    const current = Math.max(...curWin.map(x => x.best));`,
  `    const current = Math.max(...curWin.map(x => x.best));
    const curFrom = curWin.find(x => x.best === current);            // the session whose best set is the current e1RM`);
R(`    const rough = h[h.length - 1].sets.some(s => isRough(s.r));`,
  `    const rough = isRough(curFrom.top.r);
    // Shadow = the all-time best set. lastVsShadow = how the most recent session did against the best BEFORE it.
    const n = h.length, prevBest = n > 1 ? Math.max(...h.slice(0, n - 1).map(x => x.best)) : 0;
    const lastVsShadow = n > 1 ? { beat: h[n - 1].best > prevBest + 1e-9, delta: h[n - 1].best - prevBest, last: h[n - 1].best, prevBest, date: h[n - 1].date } : null;`);
R(`      lastDate: last, rough,`,
  `      lastDate: last, rough,
      currentFrom: { top: curFrom.top, date: curFrom.date },
      shadow: { top: h[bestIdx].top, best, date: h[bestIdx].date },
      lastVsShadow,`);

// 5. percentile against bodyweight-specific thresholds
const p0 = s.indexOf('  function percentile(ratio, sex, age, key) {'), p1 = s.indexOf('  function ordinal(n) {');
if (p0 < 0 || p1 < 0) throw new Error('percentile block not found');
s = s.slice(0, p0) + `  // Thresholds [Beginner, Novice, Intermediate, Advanced, Elite] in lb for this lift, sex and bodyweight.
  // Linear between the published bodyweight anchors; beyond the lightest/heaviest anchor it continues the edge slope.
  function thresholds(key, sex, bw) {
    const L = STDS && STDS.lifts[key]; bw = +bw || 0;
    if (!L || bw <= 0) return null;
    const sx = sex === 'f' ? 'f' : 'm', A = STDS.anchors[sx], Rw = L[sx], n = A.length;
    let i = 0; while (i < n - 2 && bw > A[i + 1]) i++;
    const f = (bw - A[i]) / (A[i + 1] - A[i]);
    const t = Rw[i].map((v, k) => v + f * (Rw[i + 1][k] - v));
    for (let k = 0; k < 5; k++) t[k] = Math.max(t[k], Rw[0][k] * 0.5);      // floor when far below the lightest anchor
    for (let k = 1; k < 5; k++) if (t[k] <= t[k - 1]) t[k] = t[k - 1] + 1;
    return t;
  }
  // Where an estimated 1RM sits among lifters of the same sex and bodyweight.
  // e1rm is in the unit the lift is logged in (per dumbbell for dumbbell lifts, total load for bodyweight lifts).
  function percentile(e1rm, bw, sex, age, key) {
    const raw = thresholds(key, sex, bw); if (!raw) return null;
    const m = ageMult(age), t = raw.map(v => v / m), x = +e1rm || 0;   // age eases the targets, same effect as before
    let pct, tier, pos, below = false;
    if (x < t[0]) {
      pct = 1 + 4 * (x / t[0]); tier = 0; pos = 0; below = true;
    } else if (x >= t[4]) {
      const slope = (PCTS[4] - PCTS[3]) / (t[4] - t[3]);
      pct = Math.min(99, PCTS[4] + (x - t[4]) * slope);
      tier = 4; pos = 0.8 + 0.2 * Math.min(1, (x - t[4]) / (t[4] * 0.25));
    } else {
      let i = 0; while (i < 3 && x >= t[i + 1]) i++;
      const f = (x - t[i]) / (t[i + 1] - t[i]);
      pct = PCTS[i] + f * (PCTS[i + 1] - PCTS[i]);
      tier = i; pos = (i + f) / 5;
    }
    const ni = below ? 0 : tier + 1;
    const next = ni <= 4 ? { tier: ni, name: TIERS[ni], weight: t[ni], gap: t[ni] - x } : null;
    return { pct: Math.max(1, Math.min(99, pct)), tier, tierName: below ? 'Starting out' : TIERS[tier], below, pos, thresholds: t, next };
  }
  // No measured strength data exists for the general population on these lifts. This ESTIMATE combines the lifter
  // percentile with the share of adults who do strength training at all (CDC NHIS 2020: met the muscle-strengthening
  // guideline), assuming people who do not train sit below the lifter Novice line. Only given from Novice up.
  const LIFTER_SHARE = { m: [[45, .445], [65, .299], [999, .22]], f: [[45, .341], [65, .238], [999, .172]] };
  function lifterShare(sex, age) { const a = +age >= 18 ? +age : 30; for (const [lim, sh] of LIFTER_SHARE[sex === 'f' ? 'f' : 'm']) if (a < lim) return sh; return .22; }
  function popEstimate(pct, sex, age) { if (!(pct >= 20)) return null; const sh = lifterShare(sex, age); return Math.round((1 - sh) * 100 + sh * pct); }
` + s.slice(p1);

// 6. rank targets from the same thresholds, in the unit the lift is logged in
const r0 = s.indexOf('  // lifts: [{exId, name, current, tier, std, mult?, words?}]'), r1 = s.indexOf("    if (rank === 'S') return { rank, next: null");
if (r0 < 0 || r1 < 0) throw new Error('rankNext head not found');
s = s.slice(0, r0) + `  // lifts: [{exId, name, current, tier, std, base?, words?}]. current is the e1RM in the logged unit (total load for
  // bodyweight lifts, where base is the bodyweight part). Returns the closest concrete target for the next rank.
  function rankNext(lifts, bodyweight, sex, age) {
    const rank = rankFor(lifts.map(l => l.tier));
    const mult = ageMult(age);
    const need = (l, tierIdx) => { const t = thresholds(l.std, sex, bodyweight); return t ? t[tierIdx] / mult : null; };
    const closest = (tierIdx, filter) => {
      let best = null;
      for (const l of lifts) {
        if (filter && !filter(l)) continue;
        const target = need(l, tierIdx); if (target == null || target <= l.current) continue;
        const gap = (target - l.current) / l.current;
        if (!best || gap < best.gap) best = { exId: l.exId, name: l.name, target: round5(target - (l.base || 0)), added: !!l.base, gap, tierIdx, words: l.words || '' };
      }
      return best;
    };
` + s.slice(r1);
R("      text: 'Rank ' + nx + ' when ' + c.name + ' hits ' + c.target + ' e1RM' + c.words + ' (' + TIERS[c.tierIdx] + ').' };",
  "      text: 'Rank ' + nx + ' when ' + c.name + ' hits ' + (c.added ? '+' : '') + c.target + ' lb' + c.words + ' e1RM (' + TIERS[c.tierIdx] + ').' };");

// 7. exports
R("DAY, EX, PROGRAMS, GROUPS, STD, PCTS,", "DAY, EX, PROGRAMS, GROUPS, STDS, PCTS,");
R("loadMode, loadMult, stdMult, loadWords, loadTag, loadStep,", "loadMode, loadMult, loadWords, loadTag, loadStep, thresholds, popEstimate, lifterShare,");

fs.writeFileSync(FILE, s);
console.log('core.js patched');
