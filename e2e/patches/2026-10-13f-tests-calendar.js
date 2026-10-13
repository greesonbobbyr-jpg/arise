// One-off patch (kept for the record): unit tests for the calendar helpers.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'tests.js');
let s = fs.readFileSync(FILE, 'utf8');
const a = "console.log('\\nTitles (achievement presentation)');";
if (s.split(a).length - 1 !== 1) throw new Error('anchor not found');
s = s.replace(a, () => `console.log('\\nCalendar / plan');
{
  const K = (y, m, d) => C.dateKey(new Date(y, m - 1, d).getTime());
  eq('dateKey is a local YYYY-MM-DD', K(2026, 10, 5), '2026-10-05');
  eq('addDays crosses a month', C.addDays('2026-10-30', 3), '2026-11-02');
  eq('dowOf: Monday = 0 (2026-10-12 is a Monday)', C.dowOf('2026-10-12'), 0);
  eq('dowOf: Sunday = 6', C.dowOf('2026-10-18'), 6);
  const plan = { days: { '2026-10-14': 'push', '2026-10-19': '', '2026-10-20': 'legs' }, repeats: [{ id: 'r1', dow: 0, routineId: 'pull', from: '2026-10-12' }] };
  eq('a day entry is planned', C.plannedFor(plan, '2026-10-14').routineId, 'push');
  eq('repeat fills its weekday from its start date', C.plannedFor(plan, '2026-10-12').routineId + '/' + C.plannedFor(plan, '2026-10-26').source, 'pull/repeat');
  eq('repeat does not reach back before its start', C.plannedFor(plan, '2026-10-05'), null);
  eq('a skip on one day cancels the repeat that day only', C.plannedFor(plan, '2026-10-19'), null);
  eq('a day entry beats a repeat', C.plannedFor({ days: { '2026-10-12': 'legs' }, repeats: plan.repeats }, '2026-10-12').routineId, 'legs');
  eq('an ended repeat stops after its until date', C.plannedFor({ days: {}, repeats: [{ id: 'r', dow: 0, routineId: 'pull', from: '2026-10-12', until: '2026-10-18' }] }, '2026-10-19'), null);
  eq('the newest repeat for a weekday wins', C.plannedFor({ days: {}, repeats: [{ id: 'a', dow: 0, routineId: 'pull', from: '2026-10-05' }, { id: 'b', dow: 0, routineId: 'legs', from: '2026-10-19' }] }, '2026-10-26').routineId, 'legs');
  eq('nothing planned → null', C.plannedFor(plan, '2026-10-15'), null);
  eq('empty plan → null', C.plannedFor({}, '2026-10-15'), null);
  // status
  const at = (y, m, d, rid) => ({ id: 's' + d, date: new Date(y, m - 1, d, 18).getTime(), routineId: rid || null, entries: [] });
  const byDay = C.sessionsByDay([at(2026, 10, 12, 'pull'), at(2026, 10, 13)]);
  const today = '2026-10-15';
  eq('planned + trained that day = done', C.dayStatus(plan, byDay, '2026-10-12', today).state, 'done');
  eq('…and it knows it was the planned routine', C.dayStatus(plan, byDay, '2026-10-12', today).match, true);
  eq('trained with nothing planned = extra', C.dayStatus(plan, byDay, '2026-10-13', today).state, 'extra');
  eq('planned, past, not trained = missed', C.dayStatus(plan, byDay, '2026-10-14', today).state, 'missed');
  eq('planned, today or later = planned', C.dayStatus(plan, byDay, '2026-10-20', today).state, 'planned');
  eq('nothing = none', C.dayStatus(plan, byDay, '2026-10-16', today).state, 'none');
  // grid
  const g = C.monthGrid(2026, 9);   // October 2026 starts on a Thursday
  eq('month grid starts on the Monday before the 1st', g[0].key, '2026-09-28');
  eq('grid is whole weeks', g.length % 7, 0);
  eq('October has 31 in-month cells', g.filter(c => c.inMonth).length, 31);
  eq('February 2027 (starts Monday, 28 days) is 4 or 5 rows', C.monthGrid(2027, 1).length <= 35, true);
  // rotation
  const rot = C.fillRotation(['push', 'pull', null, 'legs'], '2026-10-12', 1);
  eq('rotation cycles its order across days', ['12', '13', '14', '15', '16'].map(d => rot['2026-10-' + d] || 'rest').join(','), 'push,pull,rest,legs,push');
  eq('rotation writes weeks × 7 days', Object.keys(rot).length, 7);
  eq('rest days are stored as skips', rot['2026-10-14'], '');
  // adherence
  const p2 = { days: { '2026-10-05': 'a', '2026-10-07': 'a', '2026-10-12': 'a', '2026-10-14': 'a' }, repeats: [] };
  const s2 = [at(2026, 10, 5, 'a'), at(2026, 10, 7, 'a'), at(2026, 10, 12, 'a')];
  const ps = C.planStats(p2, s2, new Date(2026, 9, 19, 12).getTime());
  eq('planned days trained on the day', ps.plannedDone, 3);
  eq('one fully kept week (Oct 5–11), the next had a miss', ps.perfectWeeks, 1);
  eq('no plan → zeros', JSON.stringify(C.planStats({}, s2, Date.now())), '{"plannedDone":0,"perfectWeeks":0}');
}

console.log('\\nTitles (achievement presentation)');`);
fs.writeFileSync(FILE, s);
console.log('calendar tests added');
