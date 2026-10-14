// Patch: fair titles for women. Same ids, grades and categories; weight-based titles get women's targets.
// run once: node e2e/patches/2026-10-14c-women-titles.js
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', '..', 'titles.js');
let s = fs.readFileSync(F, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected one match, found ' + n + ': ' + a.slice(0, 90)); s = s.split(a).join(b); };

R("   ARISE_TITLES.TITLES            [{ id, name, cat, grade, glyph, mark, stat, target, desc, flavor }]\n",
  "   ARISE_TITLES.TITLES            [{ id, name, cat, grade, glyph, mark, stat, target, desc, flavor }]   (the men's set)\n" +
  "   ARISE_TITLES.forSex(sex)       → { TITLES, BY_ID } for 'm' or 'f': women get their own targets on weight-based titles\n");

R("  const BY_ID = {}; TITLES.forEach(t => BY_ID[t.id] = t);\n", `  const BY_ID = {}; TITLES.forEach(t => BY_ID[t.id] = t);

  // ---- Women's versions of the weight-based titles: [target, mark, name, condition, flavor]; null keeps the men's text.
  // Same id, grade and category. Each target sits at about the same percentile among women who lift as the men's target
  // does among men (Strength Level standards, man 180 lb vs woman 140 lb), rounded to a weight you can load; the top rungs,
  // where the published data runs out, follow the Elite-level ratio. Check them with: node tools/women-titles.js
  // Rows marked (judgement) have no published standard: pull-up, dip and push-up counts, and weighted pull-ups and dips.
  const FEMALE = {
    vol10k: [6000, '6K', null, 'Move 6,000 lb in one workout', 'Three tons moved in a single session.'],
    vol25k: [15000, '15K', null, 'Move 15,000 lb in one workout', 'Seven and a half tons, one session.'],
    vol50k: [30000, '30K', null, 'Move 30,000 lb in one workout', 'Fifteen tons before you went home.'],
    life100k: [50000, '50K', 'First Fifty Thousand', 'Move 50,000 lb in total', 'The first fifty thousand is behind you.'],
    life1m: [500000, '500K', 'Half-Million March', 'Move 500,000 lb in total', 'Half a million pounds, one rep at a time.'],
    life10m: [5000000, '5M', null, 'Move 5,000,000 lb in total', 'Five million pounds. The mountain moved.'],
    b135: [65, '65', 'First Press', 'Bench press 65 lb', 'The bar and a little more. It begins.'],
    b185: [85, '85', 'Past the Bar', 'Bench press 85 lb', 'The empty bar is far behind you.'],
    b225: [105, '105', 'Triple Digits', 'Bench press 105 lb', 'Three digits on the bar.'],
    b275: [135, '135', 'One Plate', 'Bench press 135 lb', 'A plate on each side. The room noticed.'],
    b315: [175, '175', 'Heavy Hands', 'Bench press 175 lb', 'The bar bends a little now.'],
    b365: [205, '205', 'Iron Chest', 'Bench press 205 lb', 'Few hunters have pressed this.'],
    b405: [225, '225', 'Two Plates', 'Bench press 225 lb', 'Two plates. A monarch of the bench.'],
    bench1x: [0.6, '.6xE', 'Strong Press', 'Reach a 0.6× bodyweight bench (estimated 1RM)', 'Over half your own weight, pressed.'],
    s135: [65, '65', null, 'Squat 65 lb', null],
    s225: [115, '115', 'Triple-Digit Squat', 'Squat 115 lb', 'Over a hundred pounds, down and back up.'],
    s315: [175, '175', 'Deep Strength', 'Squat 175 lb', 'Your legs have changed.'],
    s405: [235, '235', 'Two Plates and Change', 'Squat 235 lb', 'Past two plates. The floor felt it.'],
    s495: [305, '305', 'Iron Throne', 'Squat 305 lb', 'Almost no one stands up from this.'],
    sq15: [1, '1xE', null, 'Reach a 1× bodyweight squat (estimated 1RM)', null],
    d135: [65, '65', null, 'Deadlift 65 lb', null],
    d225: [105, '105', 'Triple-Digit Pull', 'Deadlift 105 lb', 'Over a hundred pounds, pulled clean.'],
    d315: [165, '165', 'Grip of Iron', 'Deadlift 165 lb', 'Your grip held.'],
    d405: [235, '235', 'Two-Plate Pull', 'Deadlift 235 lb', 'Past two plates. The bar obeyed you.'],
    d495: [305, '305', 'Three-Plate Pull', 'Deadlift 305 lb', 'Three plates, near enough. The bar bowed first.'],
    d585: [355, '355', 'Shadow Pull', 'Deadlift 355 lb', 'The System has few records like this.'],
    dl2x: [1.5, '1.5xE', 'One and a Half', 'Reach a 1.5× bodyweight deadlift (estimated 1RM)', 'One and a half of you, off the ground.'],
    o95: [45, '45', 'Bar Overhead', 'Overhead press 45 lb', 'The bar, locked out overhead.'],
    o135: [65, '65', 'Overhead', 'Overhead press 65 lb', 'Arms locked, weight overhead.'],
    o185: [95, '95', 'Strongwoman Press', 'Overhead press 95 lb', 'Shoulders like a gate that does not open.'],
    o225: [125, '125', 'Crown Press', 'Overhead press 125 lb', 'Almost unheard of.'],
    t500: [250, '250', 'Two-Fifty Total', 'Reach a 250 lb total (bench + squat + deadlift)', 'Three lifts, two hundred fifty pounds.'],
    t750: [400, '400', 'Four Hundred Total', 'Reach a 400 lb total', 'The total is climbing.'],
    t1000: [550, '550', 'Five-Fifty Club', 'Reach a 550 lb total', 'Five hundred fifty. The door opens for you.'],
    t1500: [850, '850', 'Eight-Fifty Total', 'Reach an 850 lb total', 'Eight hundred fifty. A national-level number.'],
    bw_b15: [1, '1x', 'Bodyweight Bench', 'Bench press your bodyweight', 'Your own weight, pressed.'],
    bw_s2: [1.5, '1.5x', 'Squat and a Half', 'Squat 1.5× your bodyweight', 'One and a half of you on your back, and you stood.'],
    bw_d25: [2, '2x', 'Double Pull', 'Deadlift 2× your bodyweight', 'Two of you, off the floor.'],
    bw_d3: [2.5, '2.5x', 'Two and a Half', 'Deadlift 2.5× your bodyweight', 'Two and a half times yourself.'],
    f_b225x5: [5, '115x5', 'One-Fifteen for Five', 'Bench press 115 lb for 5 reps', 'Not once. Five times.'],
    f_b225x10: [10, '115x10', 'One-Fifteen for Ten', 'Bench press 115 lb for 10 reps', 'Ten reps at one-fifteen.'],
    f_bbw10: [10, '.75x10', 'Three-Quarters, Ten Times', 'Bench press 75% of your bodyweight for 10 reps', 'Three quarters of you, ten times over.'],
    f_s20: [20, '.75x20', null, 'Squat 75% of your bodyweight for 20 reps in one set', null],
    f_d405x5: [5, '225x5', 'Two Plates for Five', 'Deadlift 225 lb for 5 reps', 'Five pulls at two plates.'],
    pu5: [3, 'x3', 'Three Clean', 'Do 3 pull-ups in one set', 'Three clean pulls.'],                          // (judgement)
    pullup10: [5, 'x5', null, 'Do 5 pull-ups in one set', 'Five clean pulls. Gravity noticed.'],              // (judgement)
    pu20: [10, 'x10', 'Ten Strict', 'Do 10 pull-ups in one set', 'Ten. Gravity gave up.'],                    // (judgement)
    pu45: [10, '+10', 'Weighted Ascent', 'Do a pull-up with 10 lb added', 'You, plus iron, over the bar.'],   // (judgement)
    pu90: [25, '+25', 'Plate Pull-Up', 'Do a pull-up with 25 lb added', 'A plate hanging. Still you rose.'],  // (judgement)
    dip20: [10, 'x10', 'Ten Dips', 'Do 10 dips in one set', 'Ten deep.'],                                     // (judgement)
    dip45: [10, '+10', 'Weighted Dip', 'Do a dip with 10 lb added', 'Iron on the belt.'],                     // (judgement)
    dip90: [25, '+25', 'Plate Dip', 'Do a dip with 25 lb added', 'A plate on the belt, full depth.'],         // (judgement)
    push50: [25, 'x25', 'Twenty-Five Push-Ups', 'Do 25 push-ups in one set', 'Twenty-five without stopping.'], // (judgement)
    db50: [20, '20s', 'Twenties', 'Press 20 lb dumbbells (bench or incline)', 'The twenties are yours.'],
    db75: [35, '35s', 'Thirty-Fives', 'Press 35 lb dumbbells', 'Heavy enough that people look.'],
    db100: [50, '50s', 'Fifties', 'Press 50 lb dumbbells', 'The fifties. Few reach them.'],
    dbs50: [25, 'OH25', 'Twenty-Fives Overhead', 'Shoulder press 25 lb dumbbells', 'Twenty-fives, overhead, under control.'],
    curl45: [25, '25s', 'Twenty-Five Curl', 'Curl 25 lb dumbbells', 'Twenty-five in each hand, curled.'],
    lp400: [225, '225', null, 'Leg press 225 lb', null],
    lp800: [540, '540', null, 'Leg press 540 lb', 'Five hundred forty. The sled ran out of room.'],
    ht225: [135, '135', null, 'Hip thrust 135 lb', null],
    ht405: [275, '275', null, 'Hip thrust 275 lb', 'Heavy iron, driven up.'],
  };
  // the weight a rep feat is counted at: bench and deadlift in lb, bench and squat as a share of bodyweight
  const FEAT = { m: { bench: 225, deadlift: 405, benchBW: 1, squatBW: 1 }, f: { bench: 115, deadlift: 225, benchBW: 0.75, squatBW: 0.75 } };
  const SETS = {};
  function forSex(sex) {
    const k = sex === 'f' ? 'f' : 'm';
    if (!SETS[k]) {
      const list = k === 'm' ? TITLES : TITLES.map(t => {
        const o = FEMALE[t.id]; if (!o) return t;
        return Object.assign({}, t, { target: o[0], mark: o[1], name: o[2] || t.name, desc: o[3] || t.desc, flavor: o[4] || t.flavor });
      });
      const by = {}; list.forEach(t => by[t.id] = t);
      SETS[k] = { TITLES: list, BY_ID: by };
    }
    return SETS[k];
  }
`);

// stats: rep feats count at the sex's weights
R("    const target = Math.max(1, +input.weeklyTarget || 3), prs = input.prs || [], an = input.analyses || {};\n",
  "    const target = Math.max(1, +input.weeklyTarget || 3), prs = input.prs || [], an = input.analyses || {};\n    const FT = FEAT[input.sex === 'f' ? 'f' : 'm'];   // reps_bench225 / reps_dl405 count at 225 / 405 lb for men, 115 / 225 for women\n");
R("if (w >= 225 && r > S.reps_bench225) S.reps_bench225 = r; if (bw > 0 && w >= bw && r > S.reps_benchBW) S.reps_benchBW = r; }",
  "if (w >= FT.bench && r > S.reps_bench225) S.reps_bench225 = r; if (bw > 0 && w >= bw * FT.benchBW && r > S.reps_benchBW) S.reps_benchBW = r; }");
R("if (e.exId === 'bb_squat' && bw > 0 && w >= bw && r > S.reps_squatBW) S.reps_squatBW = r;",
  "if (e.exId === 'bb_squat' && bw > 0 && w >= bw * FT.squatBW && r > S.reps_squatBW) S.reps_squatBW = r;");
R("&& w >= 405 && r > S.reps_dl405) S.reps_dl405 = r;", "&& w >= FT.deadlift && r > S.reps_dl405) S.reps_dl405 = r;");
R("  function earned(S) { return TITLES.filter(t => has(t, S)).map(t => t.id); }", "  function earned(S, sex) { return forSex(sex).TITLES.filter(t => has(t, S)).map(t => t.id); }");
R("root.ARISE_TITLES = { TITLES, BY_ID, CATS, GRADES, stats, earned, has, progress, kind, LIFT_GROUPS };",
  "root.ARISE_TITLES = { TITLES, BY_ID, CATS, GRADES, FEMALE, FEAT, forSex, stats, earned, has, progress, kind, LIFT_GROUPS };");
fs.writeFileSync(F, s);
console.log('women titles patch applied');
