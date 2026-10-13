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
    { id: 'bb_sumo',       name: 'Sumo Deadlift',           cat: 'hinge', equip: 'Barbell', muscle: 'Glutes',     group: 'glutes',    std: 'sumo_deadlift' },
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
    { id: 'bw_pushup',     name: 'Push-Up',                 cat: 'push',  equip: 'Bodyweight', muscle: 'Chest',   group: 'chest',     bw: 0.64 },
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
    { id: 'mc_seated_calf',name: 'Seated Calf Raise',       cat: 'squat', equip: 'Machine', muscle: 'Calves',     group: 'legs' },
    { id: 'mc_chest_press',name: 'Machine Chest Press',     cat: 'push',  equip: 'Machine', muscle: 'Chest',      group: 'chest' },
    { id: 'mc_pec_deck',   name: 'Pec Deck',                cat: 'push',  equip: 'Machine', muscle: 'Chest',      group: 'chest' },
    { id: 'mc_cable_fly',  name: 'Cable Fly',               cat: 'push',  equip: 'Cable',   muscle: 'Chest',      group: 'chest', perSide: true },
    { id: 'mc_face_pull',  name: 'Face Pull',               cat: 'pull',  equip: 'Cable',   muscle: 'Rear delts', group: 'shoulders' },
    { id: 'mc_pushdown',   name: 'Tricep Pushdown',         cat: 'arms',  equip: 'Cable',   muscle: 'Triceps',    group: 'arms' },
    { id: 'mc_cable_curl', name: 'Cable Curl',              cat: 'arms',  equip: 'Cable',   muscle: 'Biceps',     group: 'arms' },
    { id: 'mc_cable_crunch',name:'Cable Crunch',            cat: 'core',  equip: 'Cable',   muscle: 'Abs',        group: 'core' },
    { id: 'mc_oh_tri_ext',  name: 'Overhead Cable Triceps Extension', cat: 'arms', equip: 'Cable', muscle: 'Triceps', group: 'arms' },
    { id: 'mc_cs_row',      name: 'Chest-Supported Row',    cat: 'pull',  equip: 'Machine', muscle: 'Upper back', group: 'back' },
    { id: 'mc_one_arm_pulldown', name: 'One-Arm Cable Pulldown', cat: 'pull', equip: 'Cable', muscle: 'Lats',   group: 'back', perSide: true },
    { id: 'mc_rear_delt',   name: 'Reverse Pec Deck',       cat: 'pull',  equip: 'Machine', muscle: 'Rear delts', group: 'shoulders' },
    { id: 'mc_preacher',    name: 'Preacher Curl',          cat: 'arms',  equip: 'Machine', muscle: 'Biceps',     group: 'arms' },
    { id: 'mc_bayesian_curl', name: 'Bayesian Cable Curl',  cat: 'arms',  equip: 'Cable',   muscle: 'Biceps',     group: 'arms', perSide: true },
    { id: 'mc_incline_machine', name: 'Incline Machine Press', cat: 'push', equip: 'Machine', muscle: 'Upper chest', group: 'chest' },
    { id: 'db_incline_curl',name: 'Incline Dumbbell Curl',  cat: 'arms',  equip: 'Dumbbell', muscle: 'Biceps',    group: 'arms',      perHand: true },
    { id: 'mc_cable_lateral', name: 'Cable Lateral Raise',  cat: 'push',  equip: 'Cable',   muscle: 'Side delts', group: 'shoulders', perSide: true },
  ];

  // ---------- Built-in programs (one tap creates the routines) ----------
  // item: [exId, sets, repsMin, repsMax, restSec]
  // Rest: heavy compounds 150–180 s, moderate compounds 90–120 s, isolation 60–75 s.
  const PROGRAMS = [
    { id: 'pplp', version: 2, name: 'Push / Pull / Legs / Pretty',
      desc: '4-day recomposition program. Stay in the rep range with 1–2 reps in reserve; when every working set hits the top of the range, add weight next workout.',
      routines: [
        { name: 'Push', items: [
          ['bb_bench', 3, 5, 8, 150], ['mc_cable_lateral', 3, 12, 20, 60], ['db_incline', 3, 8, 12, 120],
          ['mc_cable_fly', 2, 10, 15, 75], ['mc_pushdown', 3, 10, 15, 60], ['mc_oh_tri_ext', 2, 10, 15, 60] ] },
        { name: 'Pull', items: [
          ['bw_pullup', 3, 6, 10, 150], ['mc_cs_row', 3, 8, 12, 120], ['mc_preacher', 3, 8, 12, 75], ['mc_rear_delt', 3, 12, 20, 60],
          ['mc_one_arm_pulldown', 2, 10, 15, 90], ['mc_bayesian_curl', 3, 10, 15, 60], ['db_hammer', 2, 10, 15, 60] ] },
        { name: 'Legs', items: [
          ['bb_squat', 3, 5, 8, 180], ['bb_rdl', 3, 8, 10, 150], ['mc_seated_calf', 4, 10, 15, 60], ['mc_leg_press', 3, 10, 15, 120],
          ['mc_leg_curl', 3, 10, 15, 75], ['mc_leg_ext', 2, 12, 15, 60], ['mc_cable_crunch', 3, 10, 15, 60], ['bw_hlr', 2, 10, 15, 60] ] },
        { name: 'Pretty', items: [
          ['db_shoulder', 3, 8, 12, 120], ['mc_cable_lateral', 4, 12, 20, 60], ['db_incline_curl', 2, 8, 12, 75], ['mc_rear_delt', 3, 15, 20, 60],
          ['mc_oh_tri_ext', 3, 10, 15, 60], ['mc_cable_curl', 2, 10, 15, 60], ['mc_pushdown', 2, 10, 15, 60], ['mc_cable_crunch', 3, 10, 15, 60], ['bw_hlr', 2, 10, 15, 60] ] },
      ] },
  ];


  const GROUPS = ['chest', 'back', 'shoulders', 'legs', 'glutes', 'arms', 'core'];
  const LOWER_CATS = { squat: 1, hinge: 1 };

  // ---------- Strength standards ----------
  // Published 1RM standards by bodyweight (see standards.js / tools/build-standards.js). Levels are percentiles
  // among PEOPLE WHO LIFT AND LOG THEIR LIFTS of the same sex and bodyweight — not the general population.
  const STDS = (typeof window !== 'undefined' && window.ARISE_STANDARDS) || (typeof require === 'function' ? require('./standards.js').ARISE_STANDARDS : null);
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
  function isRough(r) { return (+r || 0) > 10; }
  function round5(x) { return Math.round(x / 5) * 5; }
  // ---------- How weight is entered for an exercise ----------
  // 'db'   = per dumbbell (the number printed on one dumbbell)       — ex.perHand
  // 'side' = per side / per handle (single-arm or dual-stack cable)   — ex.perSide
  // 'bw'   = added weight on top of bodyweight                         — ex.bw
  // 'total'= everything else (barbell, machine stack, one dumbbell held in both hands)
  // e1RM, PREVIOUS, shadow and progress % all stay in the entered unit, so they compare like with like.
  // Volume needs the whole load, so it multiplies by loadMult. Standards are published in the entered unit.
  function loadMode(ex) { return !ex ? 'total' : ex.perHand ? 'db' : ex.perSide ? 'side' : ex.bw ? 'bw' : 'total'; }
  function loadMult(ex) { const m = loadMode(ex); return m === 'db' || m === 'side' ? 2 : 1; }   // both hands / both sides worked
  const LOAD_WORDS = { db: ' per dumbbell', side: ' per side', bw: ' added', total: '' };
  const LOAD_TAG = { db: '/DB', side: '/side', bw: '', total: '' };
  function loadWords(ex) { return LOAD_WORDS[loadMode(ex)]; }
  function loadTag(ex) { return LOAD_TAG[loadMode(ex)]; }
  // weight step for suggestions: dumbbells/handles move in 5s per hand; barbell lower body in 10s
  function loadStep(ex) { const m = loadMode(ex); if (m === 'db' || m === 'side') return 5; return ex && LOWER_CATS[ex.cat] ? 10 : 5; }

  // load for one entered set, in the entered unit (bodyweight exercises fold bodyweight in)
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
    const curFrom = curWin.find(x => x.best === current);            // the session whose best set is the current e1RM
    const spanDays = (last - first) / DAY;
    const formed = h.length >= 3 && spanDays >= 14;
    const change = formed ? (current / baseline - 1) * 100 : null;
    // all-time best and when it was first achieved
    let best = 0, bestIdx = -1;
    h.forEach((x, i) => { if (x.best > best + 1e-9) { best = x.best; bestIdx = i; } });
    const sessionsSinceBest = h.length - 1 - bestIdx;
    const daysSinceBest = (now - h[bestIdx].date) / DAY;
    const rough = isRough(curFrom.top.r);
    // Shadow = the all-time best set. lastVsShadow = how the most recent session did against the best BEFORE it.
    const n = h.length, prevBest = n > 1 ? Math.max(...h.slice(0, n - 1).map(x => x.best)) : 0;
    const lastVsShadow = n > 1 ? { beat: h[n - 1].best > prevBest + 1e-9, delta: h[n - 1].best - prevBest, last: h[n - 1].best, prevBest, date: h[n - 1].date } : null;
    return {
      exId, history: h, sessions: h.length, spanDays, baseline, current, change, formed,
      allTimeBest: best, bestDate: h[bestIdx].date, sessionsSinceBest, daysSinceBest,
      lastDate: last, rough,
      currentFrom: { top: curFrom.top, date: curFrom.date },
      shadow: { top: h[bestIdx].top, best, date: h[bestIdx].date },
      lastVsShadow,
      stall: stall(h, ex, now, best, bestIdx),
    };
  }

  // ---------- Stall detection and fix (§6) ----------
  function stall(h, ex, now, best, bestIdx) {
    if (h.length < 4) return null;
    const sessionsSinceBest = h.length - 1 - bestIdx;
    const daysSinceBest = (now - h[bestIdx].date) / DAY;
    if (!(daysSinceBest >= 28 && sessionsSinceBest >= 3)) return null;
    const n = h.length, latest = h[n - 1];
    const inc = loadStep(ex);
    const unit = 'lb' + loadWords(ex);
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
  // Thresholds [Beginner, Novice, Intermediate, Advanced, Elite] in lb for this lift, sex and bodyweight.
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
  // lifts: [{exId, name, current, tier, std, base?, words?}]. current is the e1RM in the logged unit (total load for
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
      text: 'Rank ' + nx + ' when ' + c.name + ' hits ' + (c.added ? '+' : '') + c.target + ' lb' + c.words + ' e1RM (' + TIERS[c.tierIdx] + ').' };
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
      const w = round5(bestTop.w + loadStep(ex));
      return { key: 'pr-' + dayIdx, kind: 'pr', exId: a.exId, target: w, reps: bestTop.r, title: 'Clear the shadow',
        text: ex.name + ': ' + w + ' lb' + loadWords(ex) + ' × ' + bestTop.r + ' beats your best (' + Math.round(a.allTimeBest) + ' e1RM).', xp };
    }
    const stalled = all.filter(a => a.stall && a.stall.weight && a.stall.code !== 'fatigue');
    if (stalled.length) {
      const a = stalled[dayIdx % stalled.length], ex = exById[a.exId];
      return { key: 'stall-' + dayIdx, kind: 'stall', exId: a.exId, target: a.stall.weight, title: 'Break the stall',
        text: ex.name + ': ' + a.stall.title.toLowerCase() + '. Load ' + a.stall.weight + ' lb' + loadWords(ex) + ' today.', xp };
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

  // total weight moved: per-dumbbell and per-side sets count both hands / both sides
  function sessionVolume(s, exById, bodyweight) {
    let v = 0;
    for (const e of s.entries || []) for (const st of e.sets || []) {
      if (st.warmup) continue;
      const ex = exById[e.exId];
      v += setLoad(ex, st, bodyweight) * loadMult(ex) * (+st.r || 0);
    }
    return v;
  }

  // ---------- Calendar / plan ----------
  // plan = { days: { 'YYYY-MM-DD': routineId | '' }, repeats: [{ id, dow, routineId, from, until? }] }
  // A day entry wins over a repeat. '' on a day means "skip" (cancels a repeat on that date only).
  // dow: Monday = 0 … Sunday = 6. Keys are LOCAL calendar dates and compare correctly as strings.
  const pad2 = n => String(n).padStart(2, '0');
  function dateKey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function keyDate(key) { const p = key.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(key, n) { const d = keyDate(key); d.setDate(d.getDate() + n); return dateKey(d.getTime()); }
  function dowOf(key) { return (keyDate(key).getDay() + 6) % 7; }
  function plannedFor(plan, key) {
    if (!plan) return null;
    const days = plan.days || {};
    if (Object.prototype.hasOwnProperty.call(days, key)) return days[key] ? { routineId: days[key], source: 'day' } : null;
    let hit = null; const dow = dowOf(key);
    for (const r of plan.repeats || []) if (r.dow === dow && key >= r.from && (!r.until || key <= r.until) && (!hit || r.from > hit.from)) hit = r;
    return hit ? { routineId: hit.routineId, source: 'repeat', repeatId: hit.id } : null;
  }
  function sessionsByDay(sessions) { const m = {}; for (const x of sessions || []) (m[dateKey(x.date)] = m[dateKey(x.date)] || []).push(x); return m; }
  // state: done (planned, trained that day) | missed (planned, day is past, no session) | planned (today or later)
  //        extra (trained with nothing planned) | none
  function dayStatus(plan, byDay, key, todayKey) {
    const planned = plannedFor(plan, key), done = byDay[key] || [];
    let state = 'none';
    if (planned) state = done.length ? 'done' : key < todayKey ? 'missed' : 'planned';
    else if (done.length) state = 'extra';
    return { planned, done, state, match: !!planned && done.some(x => x.routineId === planned.routineId) };
  }
  // six-week grid for a month, Monday first; each cell { key, inMonth }
  function monthGrid(year, month) {
    const first = new Date(year, month, 1), lead = (first.getDay() + 6) % 7, out = [];
    const start = new Date(year, month, 1 - lead);
    for (let i = 0; i < 42; i++) { const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i); out.push({ key: dateKey(d.getTime()), inMonth: d.getMonth() === month }); }
    while (out.length > 35 && out.slice(-7).every(c => !c.inMonth)) out.splice(-7);
    return out;
  }
  // order: array of routineId or null (rest day), cycled from startKey for weeks × 7 days. Rest days are written as skips.
  function fillRotation(order, startKey, weeks) {
    const out = {}; if (!order || !order.length) return out;
    for (let i = 0; i < weeks * 7; i++) out[addDays(startKey, i)] = order[i % order.length] || '';
    return out;
  }
  // adherence, for titles: planned days that were trained on the day, and fully kept Monday–Sunday weeks (already over)
  function planStats(plan, sessions, now) {
    const byDay = sessionsByDay(sessions), today = dateKey(now || Date.now());
    let first = today; for (const k in (plan && plan.days) || {}) if (k < first) first = k;
    for (const r of (plan && plan.repeats) || []) if (r.from < first) first = r.from;
    let plannedDone = 0, perfectWeeks = 0, week = { planned: 0, done: 0 };
    for (let k = first, guard = 0; k < today && guard < 4000; k = addDays(k, 1), guard++) {
      const st = dayStatus(plan, byDay, k, today);
      if (st.planned) { week.planned++; if (st.done.length) { week.done++; plannedDone++; } }
      if (dowOf(k) === 6) { if (week.planned >= 2 && week.done === week.planned) perfectWeeks++; week = { planned: 0, done: 0 }; }
    }
    const t = dayStatus(plan, byDay, today, today); if (t.planned && t.done.length) plannedDone++;
    return { plannedDone, perfectWeeks };
  }

  root.ARISE_CORE = {
    DAY, EX, PROGRAMS, GROUPS, STDS, PCTS, TIERS, TIER_SHORT, CAT_NAMES, LOWER_CATS,
    epley, isRough, round5, setLoad, setE1RM, history, analyze, stall, percentile, ageMult, ordinal,
    readout, median, XP, RANKS, xpForLevel, levelFromXp, startOfWeek, streak, sessionVolume, fmtDate,
    RANK_ORDER, RANK_RULES, rankFor, rankNext, dailyQuest, questDone, monthKey,
    loadMode, loadMult, loadWords, loadTag, loadStep, thresholds, popEstimate, lifterShare,
    dateKey, keyDate, addDays, dowOf, plannedFor, sessionsByDay, dayStatus, monthGrid, fillRotation, planStats,
  };
})(typeof module !== 'undefined' && module.exports ? module.exports : window);
