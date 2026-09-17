/* Arise — core: exercise library, strength standards, and all analysis math.
   Pure functions, no DOM. Loaded by index.html and by tests.js (Node). */
(function (root) {
  'use strict';
  const DAY = 86400000;

  // ---------- Exercise library (§7) ----------
  // cat: push | pull | squat | hinge | arms | core
  // group (picker chips): chest | back | shoulders | legs | glutes | arms | core
  const EX = [
    // Barbell
    { id: 'bb_squat',      name: 'Back Squat',              cat: 'squat', equip: 'Barbell', muscle: 'Quads',      group: 'legs',      std: 'squat' },
    { id: 'bb_front_squat',name: 'Front Squat',             cat: 'squat', equip: 'Barbell', muscle: 'Quads',      group: 'legs',      std: 'front_squat' },
    { id: 'bb_bench',      name: 'Bench Press',             cat: 'push',  equip: 'Barbell', muscle: 'Chest',      group: 'chest',     std: 'bench' },
    { id: 'bb_incline',    name: 'Incline Bench Press',     cat: 'push',  equip: 'Barbell', muscle: 'Upper chest',group: 'chest',     std: 'incline_bench' },
    { id: 'bb_cgbp',       name: 'Close-Grip Bench Press',  cat: 'push',  equip: 'Barbell', muscle: 'Triceps',    group: 'arms',      std: 'close_grip' },
    { id: 'bb_ohp',        name: 'Overhead Press',          cat: 'push',  equip: 'Barbell', muscle: 'Shoulders',  group: 'shoulders', std: 'ohp' },
    { id: 'bb_push_press', name: 'Push Press',              cat: 'push',  equip: 'Barbell', muscle: 'Shoulders',  group: 'shoulders', std: 'push_press' },
    { id: 'bb_deadlift',   name: 'Deadlift',                cat: 'hinge', equip: 'Barbell', muscle: 'Posterior chain', group: 'back', std: 'deadlift' },
    { id: 'bb_sumo',       name: 'Sumo Deadlift',           cat: 'hinge', equip: 'Barbell', muscle: 'Glutes',     group: 'glutes',    std: 'deadlift' },
    { id: 'bb_rdl',        name: 'Romanian Deadlift',       cat: 'hinge', equip: 'Barbell', muscle: 'Hamstrings', group: 'legs',      std: 'rdl' },
    { id: 'bb_row',        name: 'Barbell Row',             cat: 'pull',  equip: 'Barbell', muscle: 'Upper back', group: 'back',      std: 'barbell_row' },
    { id: 'bb_pendlay',    name: 'Pendlay Row',             cat: 'pull',  equip: 'Barbell', muscle: 'Upper back', group: 'back',      std: 'barbell_row' },
    { id: 'bb_hip_thrust', name: 'Hip Thrust',              cat: 'hinge', equip: 'Barbell', muscle: 'Glutes',     group: 'glutes',    std: 'hip_thrust' },
    { id: 'bb_curl',       name: 'Barbell Curl',            cat: 'arms',  equip: 'Barbell', muscle: 'Biceps',     group: 'arms',      std: 'barbell_curl' },
    { id: 'bb_clean',      name: 'Power Clean',             cat: 'hinge', equip: 'Barbell', muscle: 'Full body',  group: 'back',      std: 'power_clean' },
    { id: 'bb_shrug',      name: 'Barbell Shrug',           cat: 'pull',  equip: 'Barbell', muscle: 'Traps',      group: 'back' },
    { id: 'bb_skull',      name: 'Skullcrusher',            cat: 'arms',  equip: 'Barbell', muscle: 'Triceps',    group: 'arms' },
    // Dumbbell (weight = per dumbbell)
    { id: 'db_bench',      name: 'Dumbbell Bench Press',    cat: 'push',  equip: 'Dumbbell', muscle: 'Chest',     group: 'chest',     std: 'db_bench', perHand: true },
    { id: 'db_incline',    name: 'Dumbbell Incline Press',  cat: 'push',  equip: 'Dumbbell', muscle: 'Upper chest', group: 'chest',   std: 'db_incline', perHand: true },
    { id: 'db_shoulder',   name: 'Dumbbell Shoulder Press', cat: 'push',  equip: 'Dumbbell', muscle: 'Shoulders', group: 'shoulders', std: 'db_shoulder', perHand: true },
    { id: 'db_row',        name: 'Dumbbell Row',            cat: 'pull',  equip: 'Dumbbell', muscle: 'Lats',      group: 'back',      perHand: true },
    { id: 'db_curl',       name: 'Dumbbell Curl',           cat: 'arms',  equip: 'Dumbbell', muscle: 'Biceps',    group: 'arms',      perHand: true },
    { id: 'db_hammer',     name: 'Hammer Curl',             cat: 'arms',  equip: 'Dumbbell', muscle: 'Biceps',    group: 'arms',      perHand: true },
    { id: 'db_lateral',    name: 'Lateral Raise',           cat: 'push',  equip: 'Dumbbell', muscle: 'Side delts', group: 'shoulders', perHand: true },
    { id: 'db_rdl',        name: 'Dumbbell RDL',            cat: 'hinge', equip: 'Dumbbell', muscle: 'Hamstrings', group: 'legs',     perHand: true },
    { id: 'db_bss',        name: 'Bulgarian Split Squat',   cat: 'squat', equip: 'Dumbbell', muscle: 'Quads',     group: 'legs',      perHand: true },
    { id: 'db_lunge',      name: 'Dumbbell Lunge',          cat: 'squat', equip: 'Dumbbell', muscle: 'Quads',     group: 'legs',      perHand: true },
    { id: 'db_goblet',     name: 'Goblet Squat',            cat: 'squat', equip: 'Dumbbell', muscle: 'Quads',     group: 'legs' },
    // Bodyweight (weight = added load)
    { id: 'bw_pullup',     name: 'Pull-Up',                 cat: 'pull',  equip: 'Bodyweight', muscle: 'Lats',    group: 'back',      bw: 1.0,  std: 'pull_up' },
    { id: 'bw_chinup',     name: 'Chin-Up',                 cat: 'pull',  equip: 'Bodyweight', muscle: 'Lats',    group: 'back',      bw: 1.0,  std: 'chin_up' },
    { id: 'bw_dip',        name: 'Dip',                     cat: 'push',  equip: 'Bodyweight', muscle: 'Chest',   group: 'chest',     bw: 1.0,  std: 'dip' },
    { id: 'bw_pushup',     name: 'Push-Up',                 cat: 'push',  equip: 'Bodyweight', muscle: 'Chest',   group: 'chest',     bw: 0.64, std: 'push_up' },
    { id: 'bw_inv_row',    name: 'Inverted Row',            cat: 'pull',  equip: 'Bodyweight', muscle: 'Upper back', group: 'back',   bw: 0.60 },
    { id: 'bw_hlr',        name: 'Hanging Leg Raise',       cat: 'core',  equip: 'Bodyweight', muscle: 'Abs',     group: 'core',      bw: 0.50 },
    { id: 'bw_ab_wheel',   name: 'Ab Wheel Rollout',        cat: 'core',  equip: 'Bodyweight', muscle: 'Abs',     group: 'core',      bw: 0.55 },
    { id: 'bw_back_ext',   name: 'Back Extension',          cat: 'hinge', equip: 'Bodyweight', muscle: 'Lower back', group: 'back',   bw: 0.55 },
    // Machine & cable
    { id: 'mc_pulldown',   name: 'Lat Pulldown',            cat: 'pull',  equip: 'Cable',   muscle: 'Lats',       group: 'back',      std: 'lat_pulldown' },
    { id: 'mc_seated_row', name: 'Seated Cable Row',        cat: 'pull',  equip: 'Cable',   muscle: 'Upper back', group: 'back' },
    { id: 'mc_leg_press',  name: 'Leg Press',               cat: 'squat', equip: 'Machine', muscle: 'Quads',      group: 'legs',      std: 'leg_press' },
    { id: 'mc_hack',       name: 'Hack Squat',              cat: 'squat', equip: 'Machine', muscle: 'Quads',      group: 'legs' },
    { id: 'mc_leg_ext',    name: 'Leg Extension',           cat: 'squat', equip: 'Machine', muscle: 'Quads',      group: 'legs' },
    { id: 'mc_leg_curl',   name: 'Leg Curl',                cat: 'hinge', equip: 'Machine', muscle: 'Hamstrings', group: 'legs' },
    { id: 'mc_calf',       name: 'Calf Raise',              cat: 'squat', equip: 'Machine', muscle: 'Calves',     group: 'legs' },
    { id: 'mc_chest_press',name: 'Machine Chest Press',     cat: 'push',  equip: 'Machine', muscle: 'Chest',      group: 'chest' },
    { id: 'mc_pec_deck',   name: 'Pec Deck',                cat: 'push',  equip: 'Machine', muscle: 'Chest',      group: 'chest' },
    { id: 'mc_cable_fly',  name: 'Cable Fly',               cat: 'push',  equip: 'Cable',   muscle: 'Chest',      group: 'chest' },
    { id: 'mc_face_pull',  name: 'Face Pull',               cat: 'pull',  equip: 'Cable',   muscle: 'Rear delts', group: 'shoulders' },
    { id: 'mc_pushdown',   name: 'Tricep Pushdown',         cat: 'arms',  equip: 'Cable',   muscle: 'Triceps',    group: 'arms' },
    { id: 'mc_cable_curl', name: 'Cable Curl',              cat: 'arms',  equip: 'Cable',   muscle: 'Biceps',     group: 'arms' },
    { id: 'mc_cable_crunch',name:'Cable Crunch',            cat: 'core',  equip: 'Cable',   muscle: 'Abs',        group: 'core' },
  ];

  const GROUPS = ['chest', 'back', 'shoulders', 'legs', 'glutes', 'arms', 'core'];
  const LOWER_CATS = { squat: 1, hinge: 1 };

  // ---------- Strength standards (§5): e1RM / bodyweight at 5th,20th,50th,80th,95th pct ----------
  const STD = {
    squat:         { m: [0.75, 1.25, 1.75, 2.40, 3.00], f: [0.50, 0.85, 1.25, 1.80, 2.30] },
    front_squat:   { m: [0.60, 1.00, 1.40, 1.90, 2.40], f: [0.40, 0.70, 1.00, 1.40, 1.85] },
    bench:         { m: [0.50, 0.75, 1.25, 1.75, 2.15], f: [0.25, 0.45, 0.70, 1.05, 1.35] },
    incline_bench: { m: [0.40, 0.65, 1.05, 1.50, 1.85], f: [0.20, 0.38, 0.60, 0.90, 1.15] },
    close_grip:    { m: [0.40, 0.65, 1.05, 1.45, 1.80], f: [0.20, 0.38, 0.60, 0.88, 1.12] },
    ohp:           { m: [0.35, 0.55, 0.80, 1.10, 1.40], f: [0.18, 0.32, 0.50, 0.72, 0.95] },
    push_press:    { m: [0.45, 0.70, 1.00, 1.35, 1.70], f: [0.24, 0.42, 0.64, 0.90, 1.18] },
    deadlift:      { m: [1.00, 1.50, 2.25, 3.00, 3.60], f: [0.55, 1.00, 1.50, 2.10, 2.75] },
    rdl:           { m: [0.70, 1.10, 1.65, 2.25, 2.80], f: [0.40, 0.72, 1.10, 1.55, 2.05] },
    barbell_row:   { m: [0.50, 0.75, 1.05, 1.40, 1.80], f: [0.28, 0.45, 0.68, 0.95, 1.25] },
    lat_pulldown:  { m: [0.50, 0.75, 1.05, 1.40, 1.75], f: [0.30, 0.48, 0.70, 0.98, 1.25] },
    hip_thrust:    { m: [1.00, 1.50, 2.25, 3.10, 4.00], f: [0.70, 1.15, 1.80, 2.55, 3.35] },
    leg_press:     { m: [1.20, 2.00, 3.00, 4.20, 5.40], f: [0.80, 1.40, 2.20, 3.10, 4.00] },
    barbell_curl:  { m: [0.25, 0.40, 0.60, 0.85, 1.10], f: [0.13, 0.22, 0.35, 0.52, 0.70] },
    power_clean:   { m: [0.60, 0.90, 1.30, 1.70, 2.10], f: [0.35, 0.55, 0.82, 1.12, 1.42] },
    db_bench:      { m: [0.40, 0.60, 1.00, 1.40, 1.75], f: [0.20, 0.36, 0.58, 0.85, 1.10] },
    db_incline:    { m: [0.34, 0.52, 0.86, 1.22, 1.55], f: [0.17, 0.31, 0.50, 0.74, 0.97] },
    db_shoulder:   { m: [0.30, 0.45, 0.70, 1.00, 1.30], f: [0.15, 0.27, 0.44, 0.65, 0.86] },
    pull_up:       { m: [0.90, 1.05, 1.30, 1.60, 1.95], f: [0.85, 0.98, 1.18, 1.44, 1.75] },
    chin_up:       { m: [0.92, 1.08, 1.35, 1.65, 2.00], f: [0.87, 1.00, 1.22, 1.48, 1.80] },
    dip:           { m: [0.90, 1.10, 1.45, 1.80, 2.15], f: [0.82, 0.98, 1.25, 1.55, 1.90] },
    push_up:       { m: [0.50, 0.58, 0.68, 0.80, 0.95], f: [0.46, 0.53, 0.62, 0.73, 0.87] },
  };
  const PCTS = [5, 20, 50, 80, 95];
  const TIERS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
  const TIER_SHORT = ['Beg', 'Nov', 'Int', 'Adv', 'Elite'];

  // ---------- e1RM (§4) ----------
  function epley(w, r) {
    w = +w || 0; r = Math.floor(+r || 0);
    if (r <= 0 || w <= 0) return 0;
    if (r === 1) return w;
    return w * (1 + Math.min(r, 12) / 30);
  }
  function isRough(r) { return (+r || 0) > 12; }
  function round5(x) { return Math.round(x / 5) * 5; }
  // total load for a set (bodyweight exercises fold bodyweight in)
  function setLoad(ex, set, bodyweight) {
    const added = +set.w || 0;
    if (ex && ex.bw) return (+bodyweight || 0) * ex.bw + added;
    return added;
  }
  function setE1RM(ex, set, bodyweight) { return epley(setLoad(ex, set, bodyweight), set.r); }

  // ---------- Per-lift history ----------
  // returns [{date, best, top:{w,r}, nSets, sets:[...]}] chronological; warmups excluded
  function history(exId, sessions, ex, bodyweight) {
    const out = [];
    for (const s of sessions || []) {
      let best = 0, top = null, working = [];
      for (const e of s.entries || []) {
        if (e.exId !== exId) continue;
        for (const st of e.sets || []) {
          if (st.warmup || !(+st.r > 0)) continue;
          working.push(st);
          const v = setE1RM(ex, st, bodyweight);
          if (v > best) { best = v; top = { w: +st.w || 0, r: +st.r }; }
        }
      }
      if (working.length && best > 0) out.push({ date: s.date, best, top, nSets: working.length, sets: working, sessionId: s.id });
    }
    out.sort((a, b) => a.date - b.date);
    return out;
  }

  function median(arr) {
    if (!arr.length) return 0;
    const a = arr.slice().sort((x, y) => x - y), m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  // ---------- Baseline / current / change (§4) ----------
  function analyze(exId, sessions, ex, bodyweight, now) {
    now = now || Date.now();
    const h = history(exId, sessions, ex, bodyweight);
    if (!h.length) return null;
    const first = h[0].date, last = h[h.length - 1].date;
    const baseWin = h.filter(x => x.date <= first + 14 * DAY);
    const baseline = Math.max(...baseWin.map(x => x.best));
    let curWin = h.filter(x => x.date >= now - 28 * DAY);
    if (!curWin.length) curWin = [h[h.length - 1]];
    const current = Math.max(...curWin.map(x => x.best));
    const spanDays = (last - first) / DAY;
    const formed = h.length >= 3 && spanDays >= 14;
    const change = formed ? (current / baseline - 1) * 100 : null;
    // all-time best and when it was first achieved
    let best = 0, bestIdx = -1;
    h.forEach((x, i) => { if (x.best > best + 1e-9) { best = x.best; bestIdx = i; } });
    const sessionsSinceBest = h.length - 1 - bestIdx;
    const daysSinceBest = (now - h[bestIdx].date) / DAY;
    const rough = h[h.length - 1].sets.some(s => isRough(s.r));
    return {
      exId, history: h, sessions: h.length, spanDays, baseline, current, change, formed,
      allTimeBest: best, bestDate: h[bestIdx].date, sessionsSinceBest, daysSinceBest,
      lastDate: last, rough,
      stall: stall(h, ex, now, best, bestIdx),
    };
  }

  // ---------- Stall detection and fix (§6) ----------
  function stall(h, ex, now, best, bestIdx) {
    if (h.length < 4) return null;
    const sessionsSinceBest = h.length - 1 - bestIdx;
    const daysSinceBest = (now - h[bestIdx].date) / DAY;
    if (!(daysSinceBest >= 28 && sessionsSinceBest >= 3)) return null;
    const n = h.length, latest = h[n - 1], lower = !!(ex && LOWER_CATS[ex.cat]);
    const inc = lower ? 10 : 5;
    const unit = 'lb';
    // 1. trending down → fatigue
    if (latest.best < 0.98 * h[n - 4].best) {
      const w = round5(latest.top.w * 0.9);
      return { code: 'fatigue', title: 'Fatigue, not a plateau',
        text: `Your e1RM has dropped over the last three sessions. Take one session at ${w} ${unit} for ${latest.top.r} reps, then come back to ${round5(latest.top.w)} ${unit}.`,
        weight: w };
    }
    // 2. frequency
    const avgGap = (h[n - 1].date - h[0].date) / DAY / (n - 1);
    if (avgGap > 10) {
      return { code: 'frequency', title: 'Train it more often',
        text: `You're averaging ${Math.round(avgGap)} days between sessions on this lift. Get it to every 5–7 days before changing the loading.` };
    }
    // 3. volume
    const avgSets = h.reduce((a, x) => a + x.nSets, 0) / n;
    if (avgSets < 3) {
      return { code: 'volume', title: 'Add volume first',
        text: `You're averaging ${avgSets.toFixed(1)} working sets per session. Add a set at ${round5(latest.top.w)} ${unit} before adding weight.`,
        weight: round5(latest.top.w) };
    }
    // 4/5. identical top set for 3 sessions
    const l3 = h.slice(-3);
    const same = l3.every(x => x.top.w === l3[0].top.w && x.top.r === l3[0].top.r);
    if (same && l3[0].top.r >= 8) {
      const w = round5(latest.top.w + inc);
      return { code: 'top_of_range', title: 'Time to add weight',
        text: `Three sessions at ${round5(latest.top.w)} × ${latest.top.r}. Go to ${w} ${unit} and expect 2–3 fewer reps. That's still progress.`,
        weight: w };
    }
    if (same) {
      return { code: 'chase_reps', title: 'Chase one more rep',
        text: `Three sessions at ${round5(latest.top.w)} × ${latest.top.r}. Hold ${round5(latest.top.w)} ${unit} and chase ${latest.top.r + 1} on the first set. Add weight once you hit 8.`,
        weight: round5(latest.top.w) };
    }
    // 6. fallback: both levers
    const up = round5(latest.top.w + inc);
    return { code: 'levers', title: 'Pick a lever',
      text: `No new best in ${Math.round(daysSinceBest)} days. Either load ${up} ${unit} for ${Math.max(1, latest.top.r - 2)} reps, or stay at ${round5(latest.top.w)} ${unit} and hit ${latest.top.r + 1}. Commit to one for three sessions.`,
      weight: up };
  }

  // ---------- Percentile / tier (§5) ----------
  function ageMult(age) {
    age = +age || 0;
    if (age > 35) return Math.min(1.35, 1 + (age - 35) * 0.006);
    if (age > 0 && age < 18) return 1.06;
    return 1;
  }
  function percentile(ratio, sex, age, key) {
    const tbl = STD[key]; if (!tbl) return null;
    const t = tbl[sex === 'f' ? 'f' : 'm'];
    const adj = (+ratio || 0) * ageMult(age);
    let pct, tier, pos;
    if (adj < t[0]) {
      pct = 1 + 4 * (adj / t[0]);
      tier = 0; pos = 0;
    } else if (adj >= t[4]) {
      const slope = (PCTS[4] - PCTS[3]) / (t[4] - t[3]);
      pct = Math.min(99, PCTS[4] + (adj - t[4]) * slope);
      tier = 4; pos = 0.8 + 0.2 * Math.min(1, (adj - t[4]) / (t[4] * 0.25));
    } else {
      let i = 0; while (i < 3 && adj >= t[i + 1]) i++;
      const f = (adj - t[i]) / (t[i + 1] - t[i]);
      pct = PCTS[i] + f * (PCTS[i + 1] - PCTS[i]);
      tier = i; pos = (i + f) / 5;
    }
    return { pct: Math.max(1, Math.min(99, pct)), tier, tierName: TIERS[tier], pos, adjRatio: adj };
  }
  function ordinal(n) {
    n = Math.round(n); const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // ---------- Readout (Progress tab §3.4) ----------
  const CAT_NAMES = { push: 'Push', pull: 'Pull', squat: 'Squat', hinge: 'Hinge', arms: 'Arms', core: 'Core' };
  function fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function readout(analyses, exById, now) {
    now = now || Date.now();
    const all = analyses.filter(Boolean);
    if (!all.length) return 'Log a workout and the readout appears here. It will tell you in plain English what is moving, what is lagging, and what to do about it.';
    const formed = all.filter(a => a.formed);
    if (!formed.length) {
      const soonest = all.slice().sort((a, b) => b.sessions - a.sessions)[0];
      return `Baselines are still forming. Change figures unlock once a lift has 3 sessions across 14 days. ${exById[soonest.exId] ? exById[soonest.exId].name : 'Your top lift'} is closest with ${soonest.sessions} session${soonest.sessions === 1 ? '' : 's'} so far.`;
    }
    const overall = median(formed.map(a => a.change));
    const since = Math.min(...formed.map(a => a.history[0].date));
    const parts = [];
    const sign = overall >= 0 ? 'up' : 'down';
    parts.push(`You're ${sign} ${Math.abs(overall).toFixed(1)}% overall since ${fmtDate(since)}.`);
    // category patterns
    const byCat = {};
    for (const a of formed) {
      const ex = exById[a.exId]; if (!ex) continue;
      (byCat[ex.cat] = byCat[ex.cat] || []).push(a);
    }
    const cats = Object.keys(byCat).map(c => ({ cat: c, avg: median(byCat[c].map(a => a.change)), lifts: byCat[c] }))
      .sort((a, b) => b.avg - a.avg);
    if (cats.length >= 2) {
      const lead = cats[0], lag = cats[cats.length - 1];
      const leadNames = lead.lifts.slice().sort((a, b) => b.change - a.change).slice(0, 2).map(a => exById[a.exId].name.toLowerCase());
      parts.push(`${CAT_NAMES[lead.cat]} is carrying it — ${leadNames.join(' and ')} ${leadNames.length > 1 ? 'are' : 'is'} near ${Math.round(lead.avg)}%.`);
      if (lag.avg < lead.avg) {
        const hint = lag.avg < 2 ? ', which usually means volume, not effort' : '';
        parts.push(`${CAT_NAMES[lag.cat]} is slower at ${Math.round(lag.avg)}%${hint}.`);
      }
    } else if (cats.length === 1) {
      const top = formed.slice().sort((a, b) => b.change - a.change)[0];
      parts.push(`${exById[top.exId].name} leads at ${top.change >= 0 ? '+' : ''}${top.change.toFixed(1)}%.`);
    }
    const stalled = all.filter(a => a.stall);
    for (const a of stalled.slice(0, 2)) {
      const weeks = Math.floor(a.daysSinceBest / 7);
      parts.push(`${exById[a.exId].name} hasn't moved in ${weeks} week${weeks === 1 ? '' : 's'}.`);
    }
    if (stalled.length > 2) parts.push(`${stalled.length - 2} more lift${stalled.length - 2 === 1 ? '' : 's'} stalled below.`);
    const formingCount = all.length - formed.length;
    if (formingCount) parts.push(`${formingCount} lift${formingCount === 1 ? ' is' : 's are'} still forming a baseline.`);
    return parts.join(' ');
  }

  // ---------- Gamification ----------
  const XP = { set: 10, beatLast: 25, pr: 50, workout: 40 };
  const RANKS = [
    { rank: 'E', from: 1 }, { rank: 'D', from: 6 }, { rank: 'C', from: 11 },
    { rank: 'B', from: 16 }, { rank: 'A', from: 23 }, { rank: 'S', from: 31 },
  ];
  function xpForLevel(L) { return L <= 1 ? 0 : Math.round(200 * Math.pow(L - 1, 1.4)); }
  function levelFromXp(xp) {
    xp = Math.max(0, +xp || 0);
    let L = 1; while (xpForLevel(L + 1) <= xp) L++;
    const cur = xpForLevel(L), next = xpForLevel(L + 1);
    let rank = 'E'; for (const r of RANKS) if (L >= r.from) rank = r.rank;
    return { level: L, rank, into: xp - cur, need: next - cur, frac: (xp - cur) / (next - cur) };
  }

  function startOfWeek(ts) {
    const d = new Date(ts); d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    return d.getTime();
  }
  // Streak with shield: one missed week per calendar month is forgiven (it does not add to the
  // streak length) as long as the streak continues on the far side of it.
  function monthKey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() + 1); }
  function streak(sessions, target, now) {
    now = now || Date.now(); target = Math.max(1, +target || 3);
    const weeks = {};
    for (const s of sessions || []) { const k = startOfWeek(s.date); weeks[k] = (weeks[k] || 0) + 1; }
    const thisWeek = startOfWeek(now);
    const thisCount = weeks[thisWeek] || 0;
    let count = 0;
    const shieldsUsed = [], months = {};
    if (thisCount >= target) count++;
    let w = startOfWeek(thisWeek - DAY);
    while (true) {
      if ((weeks[w] || 0) >= target) { count++; w = startOfWeek(w - DAY); continue; }
      // missed week: forgive once per calendar month, only if the week before it was met
      const mk = monthKey(w), prev = startOfWeek(w - DAY);
      if (!months[mk] && (weeks[prev] || 0) >= target) { months[mk] = 1; shieldsUsed.push(w); w = prev; continue; }
      break;
    }
    const shieldReady = !months[monthKey(thisWeek)];
    return { weeks: count, thisWeek: thisCount, target, left: Math.max(0, target - thisCount), metThisWeek: thisCount >= target, shieldsUsed, shieldReady };
  }

  // ---------- Hunter rank derived from strength tiers ----------
  // tiers: array of tier indexes (0 Beg … 4 Elite) for lifts with a formed baseline and a standards table
  const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S'];
  const RANK_RULES = {
    E: 'No lift has a formed baseline yet', D: 'Beginner or Novice on your best lift', C: 'Intermediate on any lift',
    B: 'Advanced on any lift', A: 'Elite on any lift', S: 'Elite on two lifts, or Elite on one and Advanced on two more',
  };
  function rankFor(tiers) {
    tiers = (tiers || []).filter(t => t != null);
    if (!tiers.length) return 'E';
    const elite = tiers.filter(t => t >= 4).length, adv = tiers.filter(t => t === 3).length, max = Math.max(...tiers);
    if (elite >= 2 || (elite >= 1 && adv >= 2)) return 'S';
    if (elite >= 1) return 'A';
    if (max >= 3) return 'B';
    if (max >= 2) return 'C';
    return 'D';
  }
  // lifts: [{exId, name, current, tier, std}] ; returns the closest concrete target for the next rank
  function rankNext(lifts, bodyweight, sex, age) {
    const rank = rankFor(lifts.map(l => l.tier));
    const mult = ageMult(age), s = sex === 'f' ? 'f' : 'm';
    const need = (l, tierIdx) => STD[l.std][s][tierIdx] * bodyweight / mult;
    const closest = (tierIdx, filter) => {
      let best = null;
      for (const l of lifts) {
        if (!STD[l.std] || (filter && !filter(l))) continue;
        const target = need(l, tierIdx); if (target <= l.current) continue;
        const gap = (target - l.current) / l.current;
        if (!best || gap < best.gap) best = { exId: l.exId, name: l.name, target: round5(target), gap, tierIdx };
      }
      return best;
    };
    if (rank === 'S') return { rank, next: null, text: 'Top rank. Keep it.' };
    if (rank === 'E') return { rank, next: 'D', text: 'Form a baseline: 3 sessions over 14 days on any standard lift.' };
    let c;
    if (rank === 'D') c = closest(2);
    else if (rank === 'C') c = closest(3);
    else if (rank === 'B') c = closest(4);
    else c = closest(4, l => l.tier < 4); // A → S: a second Elite lift
    const nx = RANK_ORDER[RANK_ORDER.indexOf(rank) + 1];
    if (!c) return { rank, next: nx, text: 'Next rank ' + nx + ': ' + RANK_RULES[nx] + '.' };
    return { rank, next: nx, exId: c.exId, target: c.target, tier: TIERS[c.tierIdx],
      text: 'Rank ' + nx + ' when ' + c.name + ' hits ' + c.target + ' e1RM (' + TIERS[c.tierIdx] + ').' };
  }

  // ---------- Daily quest ----------
  // Deterministic for a calendar day. Returns {key, kind, title, text, exId, target, xp}
  function dailyQuest(analyses, exById, st, now) {
    now = now || Date.now();
    const d = new Date(now); const dayIdx = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY);
    const dow = (d.getDay() + 6) % 7, daysLeft = 7 - dow;
    const xp = 30;
    if (st && st.left > 0 && daysLeft <= st.left && st.weeks > 0) {
      return { key: 'streak-' + dayIdx, kind: 'streak', title: 'Keep the streak', text: 'Train today to keep your ' + st.weeks + '-week streak alive.', xp };
    }
    const all = Object.values(analyses || {}).filter(a => a && a.sessions >= 2 && a.allTimeBest > 0);
    const near = all.filter(a => a.history[a.history.length - 1].best >= 0.97 * a.allTimeBest && !a.stall);
    if (near.length) {
      const a = near[dayIdx % near.length], ex = exById[a.exId];
      let bestTop = null; for (const h of a.history) if (Math.abs(h.best - a.allTimeBest) < 1e-6) { bestTop = h.top; break; }
      const inc = LOWER_CATS[ex.cat] ? 10 : 5, w = round5(bestTop.w + inc);
      return { key: 'pr-' + dayIdx, kind: 'pr', exId: a.exId, target: w, reps: bestTop.r, title: 'Clear the shadow',
        text: ex.name + ': ' + w + ' × ' + bestTop.r + ' beats your best (' + Math.round(a.allTimeBest) + ' e1RM).', xp };
    }
    const stalled = all.filter(a => a.stall && a.stall.weight && a.stall.code !== 'fatigue');
    if (stalled.length) {
      const a = stalled[dayIdx % stalled.length], ex = exById[a.exId];
      return { key: 'stall-' + dayIdx, kind: 'stall', exId: a.exId, target: a.stall.weight, title: 'Break the stall',
        text: ex.name + ': ' + a.stall.title.toLowerCase() + '. Load ' + a.stall.weight + ' today.', xp };
    }
    return { key: 'log-' + dayIdx, kind: 'log', title: 'Show up', text: 'Log a workout today.', xp };
  }
  // does a finished session satisfy the quest? (bestBefore = all-time best e1RM of quest lift before this session)
  function questDone(q, session, ex, bodyweight, bestBefore) {
    if (!q || !session) return false;
    if (q.kind === 'streak' || q.kind === 'log') return true;
    const e = (session.entries || []).find(x => x.exId === q.exId); if (!e) return false;
    if (q.kind === 'pr') { let best = 0; for (const s of e.sets) if (!s.warmup) best = Math.max(best, setE1RM(ex, s, bodyweight)); return best > bestBefore + 1e-6; }
    if (q.kind === 'stall') return e.sets.some(s => !s.warmup && +s.w >= q.target && +s.r > 0);
    return false;
  }

  const ACHIEVEMENTS = [
    { id: 'first',     name: 'Awakened',        desc: 'Finish your first workout',            check: c => c.sessions.length >= 1 },
    { id: 'w10',       name: 'Regular',         desc: '10 workouts',                          check: c => c.sessions.length >= 10 },
    { id: 'w50',       name: 'Veteran',         desc: '50 workouts',                          check: c => c.sessions.length >= 50 },
    { id: 'w100',      name: 'Centurion',       desc: '100 workouts',                         check: c => c.sessions.length >= 100 },
    { id: 'pr1',       name: 'First Blood',     desc: 'Set your first PR',                    check: c => c.prCount >= 1 },
    { id: 'pr25',      name: 'Relentless',      desc: '25 PRs',                               check: c => c.prCount >= 25 },
    { id: 'streak3',   name: 'Consistent',      desc: '3-week streak',                        check: c => c.streak.weeks >= 3 },
    { id: 'streak5',   name: 'Unbroken',        desc: '5-week streak',                        check: c => c.streak.weeks >= 5 },
    { id: 'streak12',  name: 'Iron Will',       desc: '12-week streak',                       check: c => c.streak.weeks >= 12 },
    { id: 'tier_int',  name: 'Intermediate',    desc: 'Reach Intermediate on any lift',       check: c => c.maxTier >= 2 },
    { id: 'tier_adv',  name: 'Advanced',        desc: 'Reach Advanced on any lift',           check: c => c.maxTier >= 3 },
    { id: 'tier_elite',name: 'Elite',           desc: 'Reach Elite on any lift',              check: c => c.maxTier >= 4 },
    { id: 'dl2x',      name: 'Twice Yourself',  desc: '2× bodyweight deadlift e1RM',          check: c => c.ratio('bb_deadlift') >= 2 },
    { id: 'sq15',      name: 'Foundation',      desc: '1.5× bodyweight squat e1RM',           check: c => c.ratio('bb_squat') >= 1.5 },
    { id: 'bench1x',   name: 'Plate Club',      desc: '1× bodyweight bench e1RM',             check: c => c.ratio('bb_bench') >= 1 },
    { id: 'pullup10',  name: 'Bar Hanger',      desc: '10 pull-ups in one set',               check: c => c.maxReps('bw_pullup') >= 10 },
    { id: 'up10',      name: 'Leveling',        desc: '+10% overall strength',                check: c => c.overall >= 10 },
    { id: 'vol10k',    name: 'Tonnage',         desc: '10,000 lb in one workout',             check: c => c.maxVolume >= 10000 },
  ];

  function sessionVolume(s, exById, bodyweight) {
    let v = 0;
    for (const e of s.entries || []) for (const st of e.sets || []) {
      if (st.warmup) continue;
      v += setLoad(exById[e.exId], st, bodyweight) * (+st.r || 0);
    }
    return v;
  }

  root.ARISE_CORE = {
    DAY, EX, GROUPS, STD, PCTS, TIERS, TIER_SHORT, CAT_NAMES, LOWER_CATS,
    epley, isRough, round5, setLoad, setE1RM, history, analyze, stall, percentile, ageMult, ordinal,
    readout, median, XP, RANKS, xpForLevel, levelFromXp, startOfWeek, streak, ACHIEVEMENTS, sessionVolume, fmtDate,
    RANK_ORDER, RANK_RULES, rankFor, rankNext, dailyQuest, questDone, monthKey,
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : window);
