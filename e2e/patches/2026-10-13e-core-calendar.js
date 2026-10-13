// One-off patch (kept for the record): calendar / plan helpers in core.js.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'core.js');
let s = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 110)); s = s.replace(a, () => b); };

R(`  root.ARISE_CORE = {`, `  // ---------- Calendar / plan ----------
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

  root.ARISE_CORE = {`);
R(`loadMode, loadMult, loadWords, loadTag, loadStep, thresholds, popEstimate, lifterShare,`,
  `loadMode, loadMult, loadWords, loadTag, loadStep, thresholds, popEstimate, lifterShare,
    dateKey, keyDate, addDays, dowOf, plannedFor, sessionsByDay, dayStatus, monthGrid, fillRotation, planStats,`);
fs.writeFileSync(FILE, s);
console.log('core.js calendar helpers added');
