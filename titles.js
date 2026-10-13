/* Arise titles (achievements). Pure data and functions, no DOM. Loaded after core.js; also used by tests.js in Node.

   Every title is one row checked against a single summary of the log:   earned  ⇔  stats[stat] >= target
   Lifted-weight titles use weight ACTUALLY LOGGED for at least one rep (never an estimated 1RM).
   The three older estimated-1RM titles say "(estimated 1RM)" in their text.

   ARISE_TITLES.TITLES            [{ id, name, cat, grade, glyph, mark, stat, target, desc, flavor }]
   ARISE_TITLES.stats(input)      → summary object (see below)
   ARISE_TITLES.earned(stats)     → [ids]
   ARISE_TITLES.progress(t, s)    → { value, target, frac } for a locked title */
(function (root) {
  'use strict';
  const C = (typeof window !== 'undefined' && window.ARISE_CORE) || require('./core.js').ARISE_CORE;
  const DAY = C.DAY;

  const CATS = [
    ['path', 'The Path'], ['streak', 'Discipline'], ['shadow', 'Shadows'], ['volume', 'Tonnage'],
    ['bench', 'Bench Press'], ['squat', 'Squat'], ['deadlift', 'Deadlift'], ['press', 'Overhead Press'], ['total', 'The Total'],
    ['feats', 'Feats'], ['body', 'Bodyweight'], ['iron', 'Dumbbells and Machines'],
    ['rank', 'Rank and Tier'], ['system', 'The System'], ['plan', 'The Plan'], ['growth', 'Growth'], ['life', 'Habits'],
  ];
  const GRADES = ['common', 'rare', 'epic', 'legendary'];
  const G = { c: 'common', r: 'rare', e: 'epic', l: 'legendary' };

  // id, name, cat, grade, glyph, mark, stat, target, condition, System line
  const ROWS = [
    // ---- The Path: showing up
    ['first', 'Awakened', 'path', 'c', 'eye', '', 'workouts', 1, 'Finish your first workout', 'The System acknowledges you.'],
    ['w10', 'Regular', 'path', 'c', 'dumbbell', '10', 'workouts', 10, 'Finish 10 workouts', 'Discipline is becoming habit.'],
    ['w25', 'Committed', 'path', 'c', 'dumbbell', '25', 'workouts', 25, 'Finish 25 workouts', 'Twenty-five gates cleared.'],
    ['w50', 'Veteran', 'path', 'r', 'dumbbell', '50', 'workouts', 50, 'Finish 50 workouts', 'Fifty gates entered. Fifty gates cleared.'],
    ['w100', 'Centurion', 'path', 'e', 'dumbbell', '100', 'workouts', 100, 'Finish 100 workouts', 'One hundred raids. You do not miss.'],
    ['w365', 'Year of Iron', 'path', 'e', 'dumbbell', '365', 'workouts', 365, 'Finish 365 workouts', 'A workout for every day of a year.'],
    ['w500', 'Monarch of Habit', 'path', 'l', 'dumbbell', '500', 'workouts', 500, 'Finish 500 workouts', 'Habit no longer describes it. This is who you are.'],
    ['w1000', 'Thousand Gates', 'path', 'l', 'dumbbell', '1K', 'workouts', 1000, 'Finish 1,000 workouts', 'A thousand gates. None of them held you.'],
    // ---- Discipline: streaks and full weeks
    ['streak3', 'Consistent', 'streak', 'c', 'flame', '3W', 'streakWeeks', 3, 'Hold a 3-week streak', 'Three weeks without retreat.'],
    ['streak5', 'Unbroken', 'streak', 'r', 'flame', '5W', 'streakWeeks', 5, 'Hold a 5-week streak', 'The chain holds.'],
    ['streak8', 'Two Months Standing', 'streak', 'r', 'flame', '8W', 'streakWeeks', 8, 'Hold an 8-week streak', 'Two months, and the fire still burns.'],
    ['streak12', 'Iron Will', 'streak', 'e', 'flame', '12W', 'streakWeeks', 12, 'Hold a 12-week streak', 'A full season. No excuses were accepted.'],
    ['streak26', 'Half-Year Vow', 'streak', 'e', 'flame', '26W', 'streakWeeks', 26, 'Hold a 26-week streak', 'Half a year. The vow was kept.'],
    ['streak52', 'The Unbroken Year', 'streak', 'l', 'flame', '52W', 'streakWeeks', 52, 'Hold a 52-week streak', 'Fifty-two weeks. Not one surrendered.'],
    ['week4', 'Four-Day Hunter', 'streak', 'c', 'calendar', '4/W', 'weekMax', 4, 'Train 4 times in one week', 'Four raids in seven days.'],
    ['week5', 'Five-Day Hunter', 'streak', 'r', 'calendar', '5/W', 'weekMax', 5, 'Train 5 times in one week', 'Five raids in seven days. Rest was earned.'],
    ['month1', 'Perfect Month', 'streak', 'r', 'calcheck', '1M', 'perfectMonths', 1, 'Hit your weekly goal every week of a month', 'A whole month, and no week fell short.'],
    ['month3', 'Perfect Season', 'streak', 'e', 'calcheck', '3M', 'perfectMonths', 3, 'Hit your weekly goal every week for 3 separate months', 'Three flawless months on record.'],
    // ---- Shadows: beating your own best
    ['pr1', 'First Blood', 'shadow', 'c', 'bolt', '1', 'shadows', 1, 'Beat your shadow for the first time', 'Your former self has fallen.'],
    ['pr5', 'Shadow Hunter', 'shadow', 'c', 'bolt', '5', 'shadows', 5, 'Beat your shadow 5 times', 'Five shadows behind you.'],
    ['pr10', 'Shadow Breaker', 'shadow', 'c', 'bolt', '10', 'shadows', 10, 'Beat your shadow 10 times', 'Ten former selves, outgrown.'],
    ['pr25', 'Relentless', 'shadow', 'r', 'bolt', '25', 'shadows', 25, 'Beat your shadow 25 times', 'Twenty-five limits broken.'],
    ['pr50', 'Shadow Reaper', 'shadow', 'e', 'bolt', '50', 'shadows', 50, 'Beat your shadow 50 times', 'Fifty shadows reaped.'],
    ['pr100', 'Shadow Monarch', 'shadow', 'l', 'bolt', '100', 'shadows', 100, 'Beat your shadow 100 times', 'A hundred shadows stand behind you now.'],
    ['pr3x', 'Triple Kill', 'shadow', 'r', 'sword', 'x3', 'shadowsInSession', 3, 'Beat 3 shadows in one workout', 'Three shadows fell in a single session.'],
    ['pr5x', 'Massacre', 'shadow', 'e', 'sword', 'x5', 'shadowsInSession', 5, 'Beat 5 shadows in one workout', 'Five in one session. Nothing was spared.'],
    // ---- Tonnage: total work
    ['vol10k', 'Tonnage', 'volume', 'r', 'stack', '10K', 'maxVolume', 10000, 'Move 10,000 lb in one workout', 'Five tons moved in a single session.'],
    ['vol25k', 'Heavy Day', 'volume', 'r', 'stack', '25K', 'maxVolume', 25000, 'Move 25,000 lb in one workout', 'Twelve tons, one session.'],
    ['vol50k', 'Crushing Day', 'volume', 'e', 'stack', '50K', 'maxVolume', 50000, 'Move 50,000 lb in one workout', 'Twenty-five tons before you went home.'],
    ['life100k', 'First Hundred Thousand', 'volume', 'c', 'mountain', '100K', 'lifeVolume', 100000, 'Move 100,000 lb in total', 'The first hundred thousand is behind you.'],
    ['life1m', 'Million Pound March', 'volume', 'r', 'mountain', '1M', 'lifeVolume', 1000000, 'Move 1,000,000 lb in total', 'One million pounds, one rep at a time.'],
    ['life10m', 'Mover of Mountains', 'volume', 'l', 'mountain', '10M', 'lifeVolume', 10000000, 'Move 10,000,000 lb in total', 'Ten million pounds. The mountain moved.'],
    ['sets1k', 'A Thousand Sets', 'volume', 'r', 'tally', '1K', 'lifeSets', 1000, 'Complete 1,000 working sets', 'A thousand sets logged. Each one counted.'],
    ['sets10k', 'Ten Thousand Sets', 'volume', 'l', 'tally', '10K', 'lifeSets', 10000, 'Complete 10,000 working sets', 'Ten thousand sets. Mastery is repetition.'],
    // ---- Bench press: weight actually lifted
    ['b135', 'One Plate', 'bench', 'c', 'bench', '135', 'lift_bench', 135, 'Bench press 135 lb', 'A plate on each side. It begins.'],
    ['b185', 'Past the Plate', 'bench', 'c', 'bench', '185', 'lift_bench', 185, 'Bench press 185 lb', 'The plate was only the first gate.'],
    ['b225', 'Two Plates', 'bench', 'r', 'bench', '225', 'lift_bench', 225, 'Bench press 225 lb', 'Two plates. Most never get here.'],
    ['b275', 'Heavy Hands', 'bench', 'r', 'bench', '275', 'lift_bench', 275, 'Bench press 275 lb', 'The bar bends a little now.'],
    ['b315', 'Three Plates', 'bench', 'e', 'bench', '315', 'lift_bench', 315, 'Bench press 315 lb', 'Three plates. The room noticed.'],
    ['b365', 'Iron Chest', 'bench', 'e', 'bench', '365', 'lift_bench', 365, 'Bench press 365 lb', 'Few hunters have pressed this.'],
    ['b405', 'Four Plates', 'bench', 'l', 'bench', '405', 'lift_bench', 405, 'Bench press 405 lb', 'Four plates. A monarch of the bench.'],
    ['bench1x', 'Plate Club', 'bench', 'r', 'bench', '1xE', 'e1_bench_bw', 1, 'Reach a 1× bodyweight bench (estimated 1RM)', 'Your own weight, pressed.'],
    // ---- Squat
    ['s135', 'Under the Bar', 'squat', 'c', 'squat', '135', 'lift_squat', 135, 'Squat 135 lb', 'You stood up with it. That is how it starts.'],
    ['s225', 'Two-Plate Squat', 'squat', 'c', 'squat', '225', 'lift_squat', 225, 'Squat 225 lb', 'Two plates down and back up.'],
    ['s315', 'Three-Plate Squat', 'squat', 'r', 'squat', '315', 'lift_squat', 315, 'Squat 315 lb', 'Three plates. Your legs have changed.'],
    ['s405', 'Four-Plate Squat', 'squat', 'e', 'squat', '405', 'lift_squat', 405, 'Squat 405 lb', 'Four plates. The floor felt it.'],
    ['s495', 'Five-Plate Squat', 'squat', 'l', 'squat', '495', 'lift_squat', 495, 'Squat 495 lb', 'Five plates. Almost no one stands up from this.'],
    ['sq15', 'Foundation', 'squat', 'r', 'squat', '1.5xE', 'e1_sq_bw', 1.5, 'Reach a 1.5× bodyweight squat (estimated 1RM)', 'Strong legs carry everything else.'],
    // ---- Deadlift
    ['d135', 'Off the Floor', 'deadlift', 'c', 'deadlift', '135', 'lift_deadlift', 135, 'Deadlift 135 lb', 'The bar left the floor. Good.'],
    ['d225', 'Two-Plate Pull', 'deadlift', 'c', 'deadlift', '225', 'lift_deadlift', 225, 'Deadlift 225 lb', 'Two plates, pulled clean.'],
    ['d315', 'Three-Plate Pull', 'deadlift', 'r', 'deadlift', '315', 'lift_deadlift', 315, 'Deadlift 315 lb', 'Three plates. Your grip held.'],
    ['d405', 'Four-Plate Pull', 'deadlift', 'e', 'deadlift', '405', 'lift_deadlift', 405, 'Deadlift 405 lb', 'Four hundred pounds obeyed you.'],
    ['d495', 'Five-Plate Pull', 'deadlift', 'e', 'deadlift', '495', 'lift_deadlift', 495, 'Deadlift 495 lb', 'Five plates. The bar bowed first.'],
    ['d585', 'Six-Plate Pull', 'deadlift', 'l', 'deadlift', '585', 'lift_deadlift', 585, 'Deadlift 585 lb', 'Six plates. The System has few records like this.'],
    ['dl2x', 'Twice Yourself', 'deadlift', 'e', 'deadlift', '2xE', 'e1_dl_bw', 2, 'Reach a 2× bodyweight deadlift (estimated 1RM)', 'You lifted two of yourself off the ground.'],
    // ---- Overhead press
    ['o95', 'Overhead', 'press', 'c', 'press', '95', 'lift_ohp', 95, 'Overhead press 95 lb', 'Arms locked, weight overhead.'],
    ['o135', 'Plate Overhead', 'press', 'r', 'press', '135', 'lift_ohp', 135, 'Overhead press 135 lb', 'A plate a side, straight up.'],
    ['o185', 'Strongman Press', 'press', 'e', 'press', '185', 'lift_ohp', 185, 'Overhead press 185 lb', 'Shoulders like a gate that does not open.'],
    ['o225', 'Two Plates Overhead', 'press', 'l', 'press', '225', 'lift_ohp', 225, 'Overhead press 225 lb', 'Two plates overhead. Almost unheard of.'],
    // ---- The Total: best bench + squat + deadlift actually lifted
    ['t500', 'Five Hundred Total', 'total', 'c', 'sigma', '500', 'total3', 500, 'Reach a 500 lb total (bench + squat + deadlift)', 'Three lifts, five hundred pounds.'],
    ['t750', 'Seven-Fifty Total', 'total', 'r', 'sigma', '750', 'total3', 750, 'Reach a 750 lb total', 'The total is climbing.'],
    ['t1000', 'Thousand Pound Club', 'total', 'e', 'sigma', '1000', 'total3', 1000, 'Reach a 1,000 lb total', 'One thousand pounds. The door opens for you.'],
    ['t1500', 'Fifteen Hundred Total', 'total', 'l', 'sigma', '1500', 'total3', 1500, 'Reach a 1,500 lb total', 'Fifteen hundred. A national-level number.'],
    ['bw_b15', 'Press and a Half', 'total', 'e', 'bench', '1.5x', 'bw_bench', 1.5, 'Bench press 1.5× your bodyweight', 'One and a half of you, pressed.'],
    ['bw_s2', 'Double Squat', 'total', 'e', 'squat', '2x', 'bw_squat', 2, 'Squat 2× your bodyweight', 'Two of you on your back, and you stood.'],
    ['bw_d25', 'Two and a Half', 'total', 'e', 'deadlift', '2.5x', 'bw_deadlift', 2.5, 'Deadlift 2.5× your bodyweight', 'Two and a half times yourself.'],
    ['bw_d3', 'Triple Bodyweight', 'total', 'l', 'deadlift', '3x', 'bw_deadlift', 3, 'Deadlift 3× your bodyweight', 'Three of you, off the floor.'],
    // ---- Feats: weight for reps
    ['f_b225x5', 'Two Plates for Five', 'feats', 'r', 'loop', '225x5', 'reps_bench225', 5, 'Bench press 225 lb for 5 reps', 'Not once. Five times.'],
    ['f_b225x10', 'Two Plates for Ten', 'feats', 'e', 'loop', '225x10', 'reps_bench225', 10, 'Bench press 225 lb for 10 reps', 'Ten reps with two plates.'],
    ['f_bbw10', 'Yourself, Ten Times', 'feats', 'r', 'loop', 'BWx10', 'reps_benchBW', 10, 'Bench press your bodyweight for 10 reps', 'Your own weight, ten times over.'],
    ['f_s20', 'Widowmaker', 'feats', 'e', 'loop', 'BWx20', 'reps_squatBW', 20, 'Squat your bodyweight for 20 reps in one set', 'Twenty reps. You stayed under the bar.'],
    ['f_d405x5', 'Four Plates for Five', 'feats', 'e', 'loop', '405x5', 'reps_dl405', 5, 'Deadlift 405 lb for 5 reps', 'Five pulls at four plates.'],
    // ---- Bodyweight
    ['pu1', 'First Ascent', 'body', 'c', 'bar', 'x1', 'reps_pullup', 1, 'Do your first pull-up or chin-up', 'You pulled yourself over the bar.'],
    ['pu5', 'Five Clean', 'body', 'c', 'bar', 'x5', 'reps_pullup', 5, 'Do 5 pull-ups in one set', 'Five clean pulls.'],
    ['pullup10', 'Bar Hanger', 'body', 'r', 'bar', 'x10', 'reps_pullup', 10, 'Do 10 pull-ups in one set', 'Ten clean pulls. Gravity noticed.'],
    ['pu20', 'Twenty Strict', 'body', 'e', 'bar', 'x20', 'reps_pullup', 20, 'Do 20 pull-ups in one set', 'Twenty. Gravity gave up.'],
    ['pu45', 'Plate Pull-Up', 'body', 'e', 'bar', '+45', 'lift_pullAdded', 45, 'Do a pull-up with 45 lb added', 'You, plus a plate, over the bar.'],
    ['pu90', 'Two-Plate Pull-Up', 'body', 'l', 'bar', '+90', 'lift_pullAdded', 90, 'Do a pull-up with 90 lb added', 'Two plates hanging. Still you rose.'],
    ['dip20', 'Twenty Dips', 'body', 'r', 'dip', 'x20', 'reps_dip', 20, 'Do 20 dips in one set', 'Twenty deep.'],
    ['dip45', 'Plate Dip', 'body', 'r', 'dip', '+45', 'lift_dipAdded', 45, 'Do a dip with 45 lb added', 'A plate on the belt.'],
    ['dip90', 'Two-Plate Dip', 'body', 'e', 'dip', '+90', 'lift_dipAdded', 90, 'Do a dip with 90 lb added', 'Two plates, full depth.'],
    ['push50', 'Fifty Push-Ups', 'body', 'r', 'pushup', 'x50', 'reps_pushup', 50, 'Do 50 push-ups in one set', 'Fifty without standing up.'],
    // ---- Dumbbells and machines
    ['db50', 'Fifties', 'iron', 'c', 'db', '50s', 'lift_dbpress', 50, 'Press 50 lb dumbbells (bench or incline)', 'The fifties are yours.'],
    ['db75', 'Seventy-Fives', 'iron', 'r', 'db', '75s', 'lift_dbpress', 75, 'Press 75 lb dumbbells', 'Heavy enough that people look.'],
    ['db100', 'Hundreds', 'iron', 'e', 'db', '100s', 'lift_dbpress', 100, 'Press 100 lb dumbbells', 'The hundreds. End of the rack.'],
    ['dbs50', 'Fifties Overhead', 'iron', 'r', 'db', 'OH50', 'lift_dbshoulder', 50, 'Shoulder press 50 lb dumbbells', 'Fifties, overhead, under control.'],
    ['curl45', 'Forty-Five Curl', 'iron', 'r', 'curl', '45s', 'lift_curl', 45, 'Curl 45 lb dumbbells', 'A plate in each hand, curled.'],
    ['lp400', 'Sled Driver', 'iron', 'c', 'sled', '400', 'lift_legpress', 400, 'Leg press 400 lb', 'The sled moved.'],
    ['lp800', 'Sled Breaker', 'iron', 'e', 'sled', '800', 'lift_legpress', 800, 'Leg press 800 lb', 'Eight hundred. The sled ran out of room.'],
    ['ht225', 'Hip Drive', 'iron', 'c', 'hip', '225', 'lift_hip', 225, 'Hip thrust 225 lb', 'Power starts at the hips.'],
    ['ht405', 'Iron Hips', 'iron', 'e', 'hip', '405', 'lift_hip', 405, 'Hip thrust 405 lb', 'Four plates, driven up.'],
    // ---- Rank and tier (against lifters your size)
    ['tier_int', 'Intermediate', 'rank', 'r', 'chevrons', 'INT', 'maxTier', 2, 'Reach Intermediate on any lift', 'Stronger than half of those who lift.'],
    ['tier_adv', 'Advanced', 'rank', 'e', 'chevrons', 'ADV', 'maxTier', 3, 'Reach Advanced on any lift', 'Few hunters ever reach this floor.'],
    ['tier_elite', 'Elite', 'rank', 'l', 'crown', '', 'maxTier', 4, 'Reach Elite on any lift', 'The System has no further standard for you.'],
    ['int3', 'Well-Rounded', 'rank', 'r', 'chevrons', 'INTx3', 'tierInt', 3, 'Reach Intermediate on 3 lifts', 'No weak side left to find.'],
    ['adv3', 'Triple Threat', 'rank', 'e', 'chevrons', 'ADVx3', 'tierAdv', 3, 'Reach Advanced on 3 lifts', 'Advanced, three times over.'],
    ['elite2', 'Double Crown', 'rank', 'l', 'crown', 'x2', 'tierElite', 2, 'Reach Elite on 2 lifts', 'Two crowns. One head.'],
    ['rankD', 'D-Rank Hunter', 'rank', 'c', 'shield', 'D', 'rank', 1, 'Reach Hunter rank D', 'You are on the board.'],
    ['rankC', 'C-Rank Hunter', 'rank', 'r', 'shield', 'C', 'rank', 2, 'Reach Hunter rank C', 'The guild knows your name.'],
    ['rankB', 'B-Rank Hunter', 'rank', 'e', 'shield', 'B', 'rank', 3, 'Reach Hunter rank B', 'Strong enough to lead a raid.'],
    ['rankA', 'A-Rank Hunter', 'rank', 'e', 'shield', 'A', 'rank', 4, 'Reach Hunter rank A', 'One step from the summit.'],
    ['rankS', 'S-Rank Hunter', 'rank', 'l', 'shield', 'S', 'rank', 5, 'Reach Hunter rank S', 'There is no rank above this one.'],
    // ---- The System: levels and quests
    ['lvl5', 'Leveling Up', 'system', 'c', 'star', 'LV5', 'level', 5, 'Reach level 5', 'The numbers have started to climb.'],
    ['lvl10', 'Double Digits', 'system', 'c', 'star', 'LV10', 'level', 10, 'Reach level 10', 'Level ten. The easy levels are over.'],
    ['lvl20', 'Seasoned Player', 'system', 'r', 'star', 'LV20', 'level', 20, 'Reach level 20', 'Twenty levels of proof.'],
    ['q1', 'Quest Accepted', 'system', 'c', 'scroll', '1', 'quests', 1, 'Complete a daily quest', 'The System issued a quest. You answered.'],
    ['q10', 'Quest Runner', 'system', 'c', 'scroll', '10', 'quests', 10, 'Complete 10 daily quests', 'Ten quests closed.'],
    ['q50', 'Quest Master', 'system', 'e', 'scroll', '50', 'quests', 50, 'Complete 50 daily quests', 'Fifty quests. None left open.'],
    // ---- The Plan: doing what you scheduled
    ['pl1', 'As Planned', 'plan', 'c', 'calcheck', '1', 'plannedDone', 1, 'Train on a day you scheduled', 'You said you would. You did.'],
    ['pl10', 'On Schedule', 'plan', 'c', 'calcheck', '10', 'plannedDone', 10, 'Train on 10 days you scheduled', 'Ten promises kept.'],
    ['pl50', 'Clockwork', 'plan', 'e', 'calcheck', '50', 'plannedDone', 50, 'Train on 50 days you scheduled', 'Fifty planned days, fifty kept.'],
    ['pw1', 'A Week Kept', 'plan', 'c', 'calendar', 'WK', 'perfectWeeks', 1, 'Complete every workout you planned in a week', 'The whole week, exactly as written.'],
    ['pw4', 'A Month Kept', 'plan', 'r', 'calendar', '4WK', 'perfectWeeks', 4, 'Complete every planned workout in 4 separate weeks', 'Four weeks, nothing skipped.'],
    // ---- Growth: against your own baseline
    ['up10', 'Leveling', 'growth', 'r', 'trend', '+10%', 'overall', 10, 'Gain 10% overall strength', 'Ten percent stronger than the day you began.'],
    ['o25', 'Remade', 'growth', 'e', 'trend', 'ALL25', 'overall', 25, 'Gain 25% overall strength', 'A quarter stronger everywhere.'],
    ['g25', 'Ascending', 'growth', 'r', 'trend', '+25%', 'liftGain', 25, 'Raise any lift 25% above its baseline', 'One lift has left its old self far behind.'],
    ['g50', 'Half Again', 'growth', 'e', 'trend', '+50%', 'liftGain', 50, 'Raise any lift 50% above its baseline', 'Half again as strong as when you started.'],
    // ---- Habits
    ['ex10', 'Armory', 'life', 'c', 'grid', '10', 'exercises', 10, 'Log 10 different exercises', 'Ten weapons learned.'],
    ['ex25', 'Arsenal', 'life', 'r', 'grid', '25', 'exercises', 25, 'Log 25 different exercises', 'A full arsenal.'],
    ['allgroups', 'Whole Body', 'life', 'r', 'body', '', 'groupsWeek', 7, 'Train every muscle group in one week', 'Nothing was left untrained.'],
    ['early', 'Dawn Raid', 'life', 'c', 'sun', '', 'early', 1, 'Start a workout before 6 am', 'The gate opened before the sun did.'],
    ['late', 'Night Raid', 'life', 'c', 'moon', '', 'late', 1, 'Start a workout after 9 pm', 'Everyone else had gone home.'],
    ['weekend', 'Weekend Warrior', 'life', 'c', 'twin', '', 'weekendDouble', 1, 'Train on both Saturday and Sunday of one weekend', 'No days off this weekend.'],
    ['comeback', 'Reawakened', 'life', 'c', 'return', '', 'comebacks', 1, 'Return after 14 or more days away', 'You were gone. You came back. That counts.'],
    ['long90', 'Long Raid', 'life', 'c', 'hourglass', '90m', 'longestMin', 90, 'Train for 90 minutes in one session', 'Ninety minutes inside the gate.'],
  ];
  const TITLES = ROWS.map(r => ({ id: r[0], name: r[1], cat: r[2], grade: G[r[3]], rarity: G[r[3]], glyph: r[4], icon: r[4], mark: r[5], stat: r[6], target: r[7], desc: r[8], flavor: r[9] }));
  const BY_ID = {}; TITLES.forEach(t => BY_ID[t.id] = t);

  // which exercises feed each lifted-weight stat
  const LIFT_GROUPS = {
    lift_bench: ['bb_bench'], lift_squat: ['bb_squat'], lift_deadlift: ['bb_deadlift', 'bb_sumo'], lift_ohp: ['bb_ohp'],
    lift_hip: ['bb_hip_thrust'], lift_legpress: ['mc_leg_press'], lift_dbpress: ['db_bench', 'db_incline'], lift_dbshoulder: ['db_shoulder'],
    lift_curl: ['db_curl', 'db_hammer', 'db_incline_curl'], lift_pullAdded: ['bw_pullup', 'bw_chinup'], lift_dipAdded: ['bw_dip'],
  };
  const LIFT_OF = {}; for (const k in LIFT_GROUPS) for (const id of LIFT_GROUPS[k]) LIFT_OF[id] = k;
  const REPS_OF = { bw_pullup: 'reps_pullup', bw_chinup: 'reps_pullup', bw_dip: 'reps_dip', bw_pushup: 'reps_pushup' };

  // input: { sessions, exById, analyses, bodyweight, sex, age, xp, prs, questCount, plan, weeklyTarget, now }
  function stats(input) {
    const sessions = input.sessions || [], exById = input.exById || {}, bw = +input.bodyweight || 0, now = input.now || Date.now();
    const target = Math.max(1, +input.weeklyTarget || 3), prs = input.prs || [], an = input.analyses || {};
    const S = { workouts: sessions.length, shadows: prs.length, quests: +input.questCount || 0, level: C.levelFromXp(+input.xp || 0).level };
    for (const k in LIFT_GROUPS) S[k] = 0;
    for (const k of ['reps_pullup', 'reps_dip', 'reps_pushup', 'reps_bench225', 'reps_benchBW', 'reps_squatBW', 'reps_dl405', 'maxVolume', 'lifeVolume', 'lifeSets', 'longestMin', 'early', 'late', 'weekendDouble', 'comebacks', 'groupsWeek', 'weekMax']) S[k] = 0;
    S.streakWeeks = C.streak(sessions, target, now).weeks;
    // shadows beaten in a single workout
    const perSession = {}; for (const p of prs) if (p.sessionId) perSession[p.sessionId] = (perSession[p.sessionId] || 0) + 1;
    S.shadowsInSession = Math.max(0, ...Object.values(perSession));
    const weeks = {}, weekGroups = {}, days = {}, exSeen = {}, weekendDays = {};
    const sorted = sessions.slice().sort((a, b) => a.date - b.date);
    sorted.forEach((s, i) => {
      const wk = C.startOfWeek(s.date), d = new Date(s.date), hr = d.getHours(), dow = (d.getDay() + 6) % 7;
      weeks[wk] = (weeks[wk] || 0) + 1; days[C.dateKey(s.date)] = 1;
      if (hr >= 3 && hr < 6) S.early++;
      if (hr >= 21 || hr < 3) S.late++;
      if (dow >= 5) (weekendDays[wk] = weekendDays[wk] || {})[dow] = 1;
      if (i && s.date - sorted[i - 1].date >= 14 * DAY) S.comebacks++;
      if (s.endedAt && s.endedAt > s.date) S.longestMin = Math.max(S.longestMin, (s.endedAt - s.date) / 60000);
      const vol = C.sessionVolume(s, exById, bw); S.lifeVolume += vol; if (vol > S.maxVolume) S.maxVolume = vol;
      for (const e of s.entries || []) {
        const ex = exById[e.exId]; exSeen[e.exId] = 1;
        if (ex && ex.group) (weekGroups[wk] = weekGroups[wk] || {})[ex.group] = 1;
        const liftKey = LIFT_OF[e.exId], repKey = REPS_OF[e.exId];
        for (const st of e.sets || []) {
          const w = +st.w || 0, r = +st.r || 0; if (st.warmup || r < 1) continue;
          S.lifeSets++;
          if (liftKey && w > S[liftKey]) S[liftKey] = w;
          if (repKey && r > S[repKey]) S[repKey] = r;
          if (e.exId === 'bb_bench') { if (w >= 225 && r > S.reps_bench225) S.reps_bench225 = r; if (bw > 0 && w >= bw && r > S.reps_benchBW) S.reps_benchBW = r; }
          if (e.exId === 'bb_squat' && bw > 0 && w >= bw && r > S.reps_squatBW) S.reps_squatBW = r;
          if ((e.exId === 'bb_deadlift' || e.exId === 'bb_sumo') && w >= 405 && r > S.reps_dl405) S.reps_dl405 = r;
        }
      }
    });
    S.days = Object.keys(days).length; S.exercises = Object.keys(exSeen).length;
    S.weekMax = Math.max(0, ...Object.values(weeks));
    S.groupsWeek = Math.max(0, ...Object.values(weekGroups).map(g => Object.keys(g).length));
    S.weekendDouble = Object.values(weekendDays).filter(d => d[5] && d[6]).length;
    // a perfect month: at least four weeks begin in that calendar month and every one of them met the weekly goal
    const months = {};
    if (sorted.length) for (let wk = C.startOfWeek(sorted[0].date), end = C.startOfWeek(now); wk < end; wk = C.startOfWeek(wk + 7 * DAY + 3600000)) {
      const m = C.monthKey(wk); months[m] = months[m] || { n: 0, met: 0 }; months[m].n++; if ((weeks[wk] || 0) >= target) months[m].met++;
    }
    S.perfectMonths = Object.values(months).filter(m => m.n >= 4 && m.met === m.n).length;
    // the big-three total needs all three lifts on record
    S.total3 = S.lift_bench && S.lift_squat && S.lift_deadlift ? S.lift_bench + S.lift_squat + S.lift_deadlift : 0;
    S.bw_bench = bw ? S.lift_bench / bw : 0; S.bw_squat = bw ? S.lift_squat / bw : 0; S.bw_deadlift = bw ? S.lift_deadlift / bw : 0;
    const e1 = id => (an[id] && bw ? an[id].current / bw : 0);
    S.e1_bench_bw = e1('bb_bench'); S.e1_sq_bw = e1('bb_squat'); S.e1_dl_bw = e1('bb_deadlift');
    // tiers among lifters, growth against baseline
    const tiers = [], changes = [];
    for (const id in an) {
      const a = an[id], ex = exById[id]; if (!a || !ex || !a.formed) continue;
      changes.push(a.change);
      if (ex.std && bw) { const p = C.percentile(a.current, bw, input.sex, input.age, ex.std); if (p) tiers.push(p.below ? -1 : p.tier); }
    }
    S.maxTier = tiers.length ? Math.max(...tiers) : -1;
    S.tierInt = tiers.filter(t => t >= 2).length; S.tierAdv = tiers.filter(t => t >= 3).length; S.tierElite = tiers.filter(t => t >= 4).length;
    S.rank = C.RANK_ORDER.indexOf(C.rankFor(tiers.map(t => Math.max(0, t))));
    S.overall = changes.length ? C.median(changes) : 0; S.liftGain = changes.length ? Math.max(...changes) : 0;
    const ps = C.planStats(input.plan || {}, sessions, now); S.plannedDone = ps.plannedDone; S.perfectWeeks = ps.perfectWeeks;
    return S;
  }
  const has = (t, S) => (S[t.stat] || 0) >= t.target - 1e-9;
  function earned(S) { return TITLES.filter(t => has(t, S)).map(t => t.id); }
  function progress(t, S) { const v = S[t.stat] || 0; return { value: v, target: t.target, frac: Math.max(0, Math.min(1, v / t.target)) }; }
  // how a stat reads: 'lb' weights, 'vol' large totals, 'x' bodyweight multiples, 'pct' percentages, 'n' counts
  function kind(stat) { return /^(lift_|total3)/.test(stat) ? 'lb' : /Volume$/.test(stat) ? 'vol' : /^(bw_|e1_)/.test(stat) ? 'x' : /^(overall|liftGain)$/.test(stat) ? 'pct' : 'n'; }

  root.ARISE_TITLES = { TITLES, BY_ID, CATS, GRADES, stats, earned, has, progress, kind, LIFT_GROUPS };
})(typeof module !== 'undefined' && module.exports ? module.exports : window);
