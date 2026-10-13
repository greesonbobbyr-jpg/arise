// One-off patch (kept for the record): Calendar tab — month grid, drag and drop, day sheet, auto-fill, home Today card.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = h.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 120)); h = h.replace(a, () => b); };

// ---- tab bar: fifth tab
R(`  <button data-tab="progress">`,
  `  <button data-tab="calendar"><svg class="i" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/></svg>Calendar</button>
  <button data-tab="progress">`);
R(`['workout', 'routines', 'progress', 'profile'].includes(hashTab)`, `['workout', 'routines', 'calendar', 'progress', 'profile'].includes(hashTab)`);
R(`  else if (tab === 'progress') s.innerHTML = viewProgress();`, `  else if (tab === 'calendar') s.innerHTML = viewCalendar();\n  else if (tab === 'progress') s.innerHTML = viewProgress();`);
R(`  if (tab === 'profile') bindProfile();`, `  if (tab === 'calendar') bindCalendar();\n  if (tab === 'profile') bindProfile();`);

// ---- state
R(`routines: [], sessions: [], active: null, custom: [], exRest: {},`, `routines: [], sessions: [], active: null, custom: [], exRest: {}, plan: { days: {}, repeats: [] },`);
R(`function load() {`, `function normPlan() {
  if (!state.plan || typeof state.plan !== 'object') state.plan = { days: {}, repeats: [] };
  if (!state.plan.days || typeof state.plan.days !== 'object') state.plan.days = {};
  if (!Array.isArray(state.plan.repeats)) state.plan.repeats = [];
}
function load() {`);
R(`      ['routines', 'sessions', 'custom'].forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });`, `      ['routines', 'sessions', 'custom'].forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });\n      normPlan();`);
R(`      ['routines', 'custom'].forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });`, `      ['routines', 'custom'].forEach(k => { if (!Array.isArray(state[k])) state[k] = []; }); normPlan();`);

// ---- CSS
R(`.sheet-h{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);font-weight:600;margin:14px 0 4px}`,
`.sheet-h{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);font-weight:600;margin:14px 0 4px}
.cal-head{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.cal-head .m{flex:1;font-weight:700;font-size:17px;text-align:center}
.cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;font-size:10px;letter-spacing:.1em;color:var(--tx3);text-align:center;font-weight:600}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal .d{min-height:58px;min-width:0;border-radius:8px;background:var(--s1);padding:5px 3px 4px;display:flex;flex-direction:column;align-items:stretch;gap:4px;text-align:left;overflow:hidden;transition:background var(--t),box-shadow var(--t)}
.cal .d .n{font-family:var(--f-num);font-size:12px;font-weight:600;color:var(--tx2);padding-left:2px;line-height:1}
.cal .d.out{opacity:.38}
.cal .d.today{box-shadow:inset 0 0 0 1.5px var(--cy)}
.cal .d.today .n{color:var(--cy)}
.cal .d.over{background:var(--cy-tint);box-shadow:inset 0 0 0 2px var(--cy)}
.cal .chip2{display:block;font-size:10px;font-weight:700;line-height:1;padding:5px 2px;border-radius:5px;white-space:nowrap;overflow:hidden;text-align:center;color:var(--tx2)}
.cal .chip2[data-drag-day]{touch-action:none;cursor:grab}
.cal .planned .chip2{box-shadow:inset 0 0 0 1px var(--cy-line);color:var(--cy)}
.cal .done .chip2,.cal .extra .chip2{background:var(--gr-tint);color:var(--gr)}
.cal .missed .chip2{box-shadow:inset 0 0 0 1px rgba(255,92,92,.5);color:var(--rd)}
.cal-legend{display:flex;gap:14px;flex-wrap:wrap;margin:10px 4px 0;font-size:11px;color:var(--tx3)}
.cal-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;vertical-align:-1px;margin-right:5px}
.tray{display:flex;flex-wrap:wrap;gap:8px}
.tray .rc{touch-action:none;cursor:grab;-webkit-user-select:none;user-select:none;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:10px;background:var(--s2);font-weight:600}
.tray .rc::before{content:"";width:8px;height:14px;background:radial-gradient(circle,var(--tx3) 1.2px,transparent 1.6px) 0 0/4px 5px}
.ghost{position:fixed;z-index:90;pointer-events:none;transform:translate(-50%,-135%);padding:9px 14px;border-radius:10px;background:var(--cy);color:var(--cy-ink);font-weight:700;white-space:nowrap;box-shadow:0 10px 30px -8px rgba(62,230,255,.7)}
.dropzone{position:fixed;left:12px;right:12px;top:calc(var(--sat) + 10px);height:52px;border-radius:12px;background:#2A1416;color:var(--rd);display:none;align-items:center;justify-content:center;font-weight:700;z-index:45;box-shadow:inset 0 0 0 1.5px rgba(255,92,92,.5)}
.dropzone.on{display:flex}
.dropzone.over{background:var(--rd);color:#fff}
.wstrip{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:12px;cursor:pointer}
.wd{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 0;border-radius:8px;background:var(--s2);min-height:44px;min-width:0}
.wd i{font-style:normal;font-size:10px;color:var(--tx3);font-weight:600}
.wd b{font-size:10px;font-weight:700;color:var(--tx3);white-space:nowrap;overflow:hidden;max-width:100%}
.wd.today{box-shadow:inset 0 0 0 1.5px var(--cy)}
.wd.planned b{color:var(--cy)}.wd.done b,.wd.extra b{color:var(--gr)}.wd.missed b{color:var(--rd)}
.frow{display:grid;grid-template-columns:96px 1fr;gap:10px;align-items:center;margin-bottom:8px}
.frow.slot{grid-template-columns:28px 1fr 44px}`);

// ---- closing a sheet refreshes the screen behind a calendar sheet
R(`function closeSheet() { picker = null; $('#sheetbg').classList.remove('on'); $('#sheet').classList.remove('on'); }`,
  `function closeSheet() { const plan = daySheet || fillSheet; picker = null; daySheet = null; fillSheet = null; $('#sheetbg').classList.remove('on'); $('#sheet').classList.remove('on'); if (plan) render(); }`);

// ---- the calendar itself
R(`// ---------- ROUTINES ----------`, `// ---------- CALENDAR ----------
// state.plan = { days: { 'YYYY-MM-DD': routineId | '' }, repeats: [{ id, dow, routineId, from, until? }] }  (see core.js)
let calMonth = null, daySheet = null, fillSheet = null, dragState = null, suppressClick = false;
const DOW_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const todayKey = () => C.dateKey(Date.now());
const routineById = id => state.routines.find(r => r.id === id);
function plannedRoutine(key) { const p = C.plannedFor(state.plan, key), r = p && routineById(p.routineId); return r ? { p, r } : null; }
function shortName(name) { name = String(name || ''); if (name.length <= 6) return name; const w = name.split(/\\s+/); return w.length > 1 ? w[0].slice(0, 4) + ' ' + w[1][0] : name.slice(0, 6); }
function keyLabel(key, long) { return C.keyDate(key).toLocaleDateString(undefined, long ? { weekday: 'long', month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' }); }
// what a day shows: status plus the routine (a plan pointing at a deleted routine counts as nothing planned)
function dayView(key, byDay, tk) {
  const st = C.dayStatus(state.plan, byDay, key, tk), r = st.planned && routineById(st.planned.routineId);
  const state2 = st.planned && !r ? (st.done.length ? 'extra' : 'none') : st.state;
  return { st, r, state: state2, label: r ? shortName(r.name) : st.done.length ? shortName(st.done[0].name) : '' };
}
function planSet(key, rid) { state.plan.days[key] = rid; save(); }
function planClear(key) {
  const p = C.plannedFor(state.plan, key); if (!p) return;
  if (p.source === 'day') { delete state.plan.days[key]; if (C.plannedFor(state.plan, key)) state.plan.days[key] = ''; }   // do not let a repeat show through
  else state.plan.days[key] = '';
  save();
}
function endRepeats(dow, key) {
  for (const r of state.plan.repeats) if (r.dow === dow && (!r.until || r.until >= key)) r.until = C.addDays(key, -1);
  state.plan.repeats = state.plan.repeats.filter(r => !r.until || r.until >= r.from);
}
function repeatOn(key, rid) { const dow = C.dowOf(key); endRepeats(dow, key); state.plan.repeats.push({ id: uid(), dow, routineId: rid, from: key }); delete state.plan.days[key]; save(); }
function repeatOff(key) { const p = C.plannedFor(state.plan, key); endRepeats(C.dowOf(key), key); if (p) state.plan.days[key] = p.routineId; save(); }

function viewCalendar() {
  const now = new Date(); if (!calMonth) calMonth = { y: now.getFullYear(), m: now.getMonth() };
  const tk = todayKey(), byDay = C.sessionsByDay(state.sessions);
  const title = new Date(calMonth.y, calMonth.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const cells = C.monthGrid(calMonth.y, calMonth.m).map(c => {
    const v = dayView(c.key, byDay, tk), movable = v.r && c.key >= tk && !v.st.done.length;
    const chip = v.state === 'none' ? '' : '<span class="chip2"' + (movable ? ' data-drag-day="' + c.key + '"' : '') + '>' + (v.state === 'done' || v.state === 'extra' ? '✓ ' : '') + esc(v.label) + '</span>';
    return '<button class="d ' + v.state + (c.inMonth ? '' : ' out') + (c.key === tk ? ' today' : '') + (c.key < tk ? ' past' : '') + '" data-day="' + c.key + '" aria-label="' + esc(keyLabel(c.key, true) + (v.label ? ', ' + v.label + ', ' + v.state : '')) + '"><span class="n">' + (+c.key.slice(8)) + '</span>' + chip + '</button>';
  }).join('');
  const tray = state.routines.map(r => '<span class="rc" data-drag-routine="' + esc(r.id) + '">' + esc(r.name) + '</span>').join('');
  const fwd = icon('back').replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7');
  return '<div class="top"><h1>Calendar</h1><button class="btn ghost sm" id="cal-fill">Auto-fill</button></div>' +
    '<div class="cal-head"><button class="icon-btn" id="cal-prev" aria-label="Previous month">' + icon('back') + '</button><div class="m" id="cal-title">' + esc(title) + '</div><button class="btn ghost sm" id="cal-today">Today</button><button class="icon-btn" id="cal-next" aria-label="Next month">' + fwd + '</button></div>' +
    '<div class="cal-dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="cal" id="cal">' + cells + '</div>' +
    '<div class="cal-legend"><span><i style="box-shadow:inset 0 0 0 1px var(--cy)"></i>Planned</span><span><i style="background:var(--gr)"></i>Done</span><span><i style="box-shadow:inset 0 0 0 1px var(--rd)"></i>Missed</span></div>' +
    '<div class="kicker" style="margin:18px 4px 8px">Your routines</div>' +
    (tray ? '<div class="tray" id="tray">' + tray + '</div><p class="note" style="margin:10px 4px 0">Drag a routine onto a day, or tap a day to pick one. It saves to that day only unless you turn on Repeat.</p>'
          : '<div class="card"><div class="small muted">No routines yet. Create one in the Routines tab, then schedule it here.</div></div>') +
    '<div class="dropzone" id="dropzone">Drop here to remove</div>';
}
function bindCalendar() {
  const step = n => { calMonth.m += n; if (calMonth.m < 0) { calMonth.m = 11; calMonth.y--; } if (calMonth.m > 11) { calMonth.m = 0; calMonth.y++; } render(); };
  $('#cal-prev').onclick = () => step(-1); $('#cal-next').onclick = () => step(1);
  $('#cal-today').onclick = () => { calMonth = null; render(); };
  $('#cal-fill').onclick = openFillSheet;
  $$('#cal [data-day]').forEach(b => b.onclick = () => { if (suppressClick) return; openDaySheet(b.dataset.day); });
  $$('[data-drag-routine],[data-drag-day]').forEach(el => el.addEventListener('pointerdown', startDrag));
}
// drag a routine from the tray onto a day, or a planned workout to another day / the remove zone
function startDrag(e) {
  if (e.button > 0) return;
  const el = e.currentTarget, fromDay = el.dataset.dragDay || null, pr = fromDay && plannedRoutine(fromDay);
  const rid = el.dataset.dragRoutine || (pr && pr.r.id), r = rid && routineById(rid); if (!r) return;
  dragState = { rid, name: r.name, fromDay, x0: e.clientX, y0: e.clientY, active: false, ghost: null, over: null, zone: false };
  document.addEventListener('pointermove', moveDrag); document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', cancelDrag);
}
function moveDrag(e) {
  const d = dragState; if (!d) return;
  if (!d.active) {
    if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8) return;
    d.active = true; d.ghost = document.createElement('div'); d.ghost.className = 'ghost'; d.ghost.textContent = d.name; document.body.appendChild(d.ghost);
    if (d.fromDay) $('#dropzone').classList.add('on');
  }
  d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px';
  const under = document.elementFromPoint(e.clientX, e.clientY), cell = under && under.closest('[data-day]'), zone = !!(under && under.closest('#dropzone'));
  const ok = cell && cell.dataset.day >= todayKey() ? cell : null;       // past days cannot be planned
  if (d.over && d.over !== ok) d.over.classList.remove('over');
  if (ok) ok.classList.add('over');
  d.over = ok; d.zone = zone; $('#dropzone').classList.toggle('over', zone);
}
function cancelDrag() {
  const d = dragState; dragState = null;
  document.removeEventListener('pointermove', moveDrag); document.removeEventListener('pointerup', endDrag); document.removeEventListener('pointercancel', cancelDrag);
  if (d && d.ghost) d.ghost.remove();
  if (d && d.over) d.over.classList.remove('over');
  const z = $('#dropzone'); if (z) z.classList.remove('on', 'over');
  return d;
}
function endDrag() {
  const d = cancelDrag(); if (!d || !d.active) return;
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 350);       // the tap that ends a drag is not a tap on a day
  if (d.zone && d.fromDay) { planClear(d.fromDay); toast(d.name + ' removed from ' + keyLabel(d.fromDay)); }
  else if (d.over && d.over.dataset.day !== d.fromDay) {
    const key = d.over.dataset.day;
    if (d.fromDay) planClear(d.fromDay);
    planSet(key, d.rid); toast(d.name + (d.fromDay ? ' moved to ' : ' set for ') + keyLabel(key));
  }
  render();
}

// ---- day sheet: what is on a day, assign by search, repeat, remove
function openSheetEl() { $('#sheetbg').classList.add('on'); $('#sheet').classList.add('on'); }
function openDaySheet(key) { daySheet = { key, q: '' }; renderDaySheet(); openSheetEl(); }
function renderDaySheet(keepFocus) {
  const key = daySheet.key, tk = todayKey(), pr = plannedRoutine(key), done = C.sessionsByDay(state.sessions)[key] || [], past = key < tk, dowName = DOW_NAMES[C.dowOf(key)];
  let body = '';
  for (const s of done) {
    const n = s.entries.reduce((a, e) => a + e.sets.length, 0);
    body += '<div class="card"><div class="kicker gr">Done</div><div style="font-weight:700;font-size:17px">' + esc(s.name) + '</div><div class="small muted">' + s.entries.length + ' exercises · ' + n + ' sets' + (s.endedAt ? ' · ' + fmtDur(s.endedAt - s.date) : '') + '</div><button class="btn ghost sm" data-ds-hist="' + esc(s.id) + '" style="margin-top:10px">View in history</button></div>';
  }
  if (pr) {
    const rep = pr.p.source === 'repeat';
    body += '<div class="card" id="ds-planned"><div class="kicker' + (past && !done.length ? ' rd' : '') + '">' + (past && !done.length ? 'Missed' : 'Planned') + '</div><div style="font-weight:700;font-size:17px">' + esc(pr.r.name) + '</div><div class="small muted">' + pr.r.items.length + ' exercises' + (rep ? ' · repeats every ' + dowName : ' · this day only') + '</div>';
    if (!past) body += (key === tk && !done.length && !state.active ? '<button class="btn primary full" id="ds-start" style="margin-top:12px">Start workout</button>' : '') +
      '<div class="field" style="margin:14px 0 0"><label>Repeat every ' + dowName + '</label><div class="seg" id="ds-repeat"><button data-v="1" class="' + (rep ? 'on' : '') + '">On</button><button data-v="0" class="' + (rep ? '' : 'on') + '">Off</button></div></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn danger grow" id="ds-remove">' + (rep ? 'Skip this day' : 'Remove') + '</button>' + (rep ? '<button class="btn danger grow" id="ds-stop">Stop repeating</button>' : '') + '</div>';
    body += '</div>';
  }
  if (!past) {
    const q = daySheet.q.trim().toLowerCase();
    const list = state.routines.filter(r => !q || r.name.toLowerCase().includes(q) || r.items.some(i => ((exById[i.exId] || {}).name || '').toLowerCase().includes(q)));
    body += '<div class="kicker" style="margin:16px 4px 8px">' + (pr ? 'Change to' : 'Schedule a routine') + '</div><input class="in" id="ds-q" placeholder="Search routines or exercises" value="' + esc(daySheet.q) + '" autocomplete="off">' +
      '<div class="card" style="padding:4px 12px;margin-top:10px">' + (list.map(r => { const on = pr && pr.r.id === r.id; return '<div class="lrow" data-ds-pick="' + esc(r.id) + '"><div class="chk' + (on ? ' on' : '') + '">' + (on ? icon('check') : '') + '</div><div class="grow"><div class="t">' + esc(r.name) + '</div><div class="s">' + r.items.length + ' exercises</div></div></div>'; }).join('') ||
        '<div class="empty small">' + (state.routines.length ? 'Nothing matches.' : 'No routines yet. Create one in the Routines tab.') + '</div>') + '</div>';
  } else if (!pr && !done.length) body += '<div class="empty">Nothing was planned or logged on this day.</div>';
  const sheet = $('#sheet'), scroll = keepFocus && $('.body', sheet) ? $('.body', sheet).scrollTop : 0, caret = keepFocus && $('#ds-q') ? $('#ds-q').selectionStart : null;
  sheet.innerHTML = '<div class="sh"><div class="row"><h2 class="grow" style="font-size:var(--fs-l)" id="ds-title">' + esc(keyLabel(key, true)) + '</h2><button class="icon-btn" id="ds-close" aria-label="Close">' + icon('x') + '</button></div></div><div class="body" style="padding-bottom:24px">' + body + '</div>';
  if (keepFocus) { $('.body', sheet).scrollTop = scroll; const qi = $('#ds-q'); if (qi && caret != null) { qi.focus(); try { qi.setSelectionRange(caret, caret); } catch (e) {} } }
  const qi = $('#ds-q'); if (qi) qi.oninput = e => { daySheet.q = e.target.value; renderDaySheet(true); };
  sheet.onclick = e => {
    if (!daySheet) return;
    const t = e.target;
    if (t.closest('#ds-close')) return closeSheet();
    if (t.closest('#ds-start')) { const r = plannedRoutine(key).r; closeSheet(); return startWorkout(r); }
    const hist = t.closest('[data-ds-hist]'); if (hist) { const id = hist.dataset.dsHist; closeSheet(); tab = 'workout'; sub = { view: 'history' }; openHist = id; render(); window.scrollTo(0, 0); return; }
    const rp = t.closest('#ds-repeat button'); if (rp) { const cur = plannedRoutine(key); if (!cur) return; if (rp.dataset.v === '1') { if (cur.p.source !== 'repeat') { repeatOn(key, cur.r.id); toast(cur.r.name + ' every ' + dowName); } } else if (cur.p.source === 'repeat') { repeatOff(key); toast('Repeat off. Kept on this day.'); } return renderDaySheet(); }
    if (t.closest('#ds-remove')) { planClear(key); return renderDaySheet(); }
    if (t.closest('#ds-stop')) { endRepeats(C.dowOf(key), key); delete state.plan.days[key]; save(); toast('Stopped repeating from ' + keyLabel(key)); return renderDaySheet(); }
    const pick = t.closest('[data-ds-pick]'); if (pick) { const r = routineById(pick.dataset.dsPick); planSet(key, r.id); daySheet.q = ''; toast(r.name + ' set for ' + keyLabel(key)); renderDaySheet(); $('.body', sheet).scrollTop = 0; }
  };
}

// ---- auto-fill: a weekly pattern (repeats) or a rotation (written day by day)
function openFillSheet() {
  const tk = todayKey(), week = {};
  for (let i = 0; i < 7; i++) { const k = C.addDays(tk, i), p = C.plannedFor({ days: {}, repeats: state.plan.repeats }, k); week[C.dowOf(k)] = p && routineById(p.routineId) ? p.routineId : ''; }
  fillSheet = { mode: 'weekly', week, order: state.routines.map(r => r.id).concat(['']), start: tk, weeks: 4 };
  renderFillSheet(); openSheetEl();
}
function renderFillSheet() {
  const f = fillSheet, opts = sel => '<option value="">Rest</option>' + state.routines.map(r => '<option value="' + esc(r.id) + '"' + (sel === r.id ? ' selected' : '') + '>' + esc(r.name) + '</option>').join('');
  let body = '<div class="seg" id="fl-mode" style="margin-bottom:14px"><button data-v="weekly" class="' + (f.mode === 'weekly' ? 'on' : '') + '">Weekly pattern</button><button data-v="rotation" class="' + (f.mode === 'rotation' ? 'on' : '') + '">Rotation</button></div>';
  if (!state.routines.length) body += '<div class="card"><div class="small muted">No routines yet. Create one in the Routines tab first.</div></div>';
  else if (f.mode === 'weekly') {
    body += DOW_NAMES.map((n, d) => '<div class="frow"><span>' + n + '</span><select class="in" data-fl-dow="' + d + '">' + opts(f.week[d]) + '</select></div>').join('') +
      '<p class="note" style="margin:10px 0 14px">Repeats every week from today until you change it. Days you set by hand stay as they are.</p><button class="btn primary full" id="fl-apply">Apply weekly pattern</button>';
  } else {
    body += '<div class="kicker" style="margin:0 0 8px">Order · repeats in a loop</div>' + f.order.map((id, i) => '<div class="frow slot"><span class="dim mono">' + (i + 1) + '</span><select class="in" data-fl-slot="' + i + '">' + opts(id) + '</select><button class="icon-btn" data-fl-del="' + i + '" aria-label="Remove slot">' + icon('x') + '</button></div>').join('') +
      '<button class="btn ghost full" id="fl-add" style="margin-bottom:14px">' + icon('plus') + ' Add a day to the loop</button>' +
      '<div class="frow"><span>Start</span><input class="in" type="date" id="fl-start" value="' + f.start + '" min="' + todayKey() + '"></div>' +
      '<div class="frow"><span>For</span><div class="seg" id="fl-weeks">' + [4, 8, 12].map(w => '<button data-v="' + w + '" class="' + (f.weeks === w ? 'on' : '') + '">' + w + ' weeks</button>').join('') + '</div></div>' +
      '<p class="note" style="margin:10px 0 14px">Writes each day for that long, replacing what is planned on those days. Weekdays do not matter.</p><button class="btn primary full" id="fl-apply">Apply rotation</button>';
  }
  body += '<button class="btn danger full" id="fl-clear" style="margin-top:24px">Clear everything planned from today on</button>';
  const sheet = $('#sheet');
  sheet.innerHTML = '<div class="sh"><div class="row"><h2 class="grow" style="font-size:var(--fs-l)">Auto-fill</h2><button class="icon-btn" id="fl-close" aria-label="Close">' + icon('x') + '</button></div></div><div class="body" style="padding-bottom:24px">' + body + '</div>';
  sheet.onchange = e => {
    if (!fillSheet) return; const t = e.target;
    if (t.dataset.flDow != null) f.week[+t.dataset.flDow] = t.value;
    else if (t.dataset.flSlot != null) f.order[+t.dataset.flSlot] = t.value;
    else if (t.id === 'fl-start' && t.value >= todayKey()) f.start = t.value;
  };
  sheet.onclick = async e => {
    if (!fillSheet) return; const t = e.target;
    if (t.closest('#fl-close')) return closeSheet();
    const mode = t.closest('#fl-mode button'); if (mode) { f.mode = mode.dataset.v; return renderFillSheet(); }
    const wk = t.closest('#fl-weeks button'); if (wk) { f.weeks = +wk.dataset.v; return renderFillSheet(); }
    const del = t.closest('[data-fl-del]'); if (del) { f.order.splice(+del.dataset.flDel, 1); return renderFillSheet(); }
    if (t.closest('#fl-add')) { f.order.push(''); return renderFillSheet(); }
    if (t.closest('#fl-clear')) {
      if (!(await confirmDlg('Clear your plan?', 'Every workout planned from today on will be removed, including repeats. Past days and your workout log are not touched.', 'Clear', true))) return;
      const tk = todayKey(); for (const k of Object.keys(state.plan.days)) if (k >= tk) delete state.plan.days[k];
      for (let d = 0; d < 7; d++) endRepeats(d, tk);
      save(); toast('Plan cleared'); return closeSheet();
    }
    if (t.closest('#fl-apply')) {
      const tk = todayKey();
      if (f.mode === 'weekly') {
        const n = Object.values(f.week).filter(Boolean).length;
        if (!(await confirmDlg('Apply weekly pattern?', n + ' training day' + (n === 1 ? '' : 's') + ' a week, repeating from today. This replaces your current weekly repeats.', 'Apply'))) return;
        for (let d = 0; d < 7; d++) { endRepeats(d, tk); if (f.week[d]) state.plan.repeats.push({ id: uid(), dow: d, routineId: f.week[d], from: tk }); }
        save(); toast('Weekly pattern set');
      } else {
        const order = f.order.map(id => id || null);
        if (!order.some(Boolean)) return toast('Add at least one routine to the loop');
        if (!(await confirmDlg('Apply rotation?', 'This plans ' + (f.weeks * 7) + ' days starting ' + keyLabel(f.start) + ' and replaces what is on those days.', 'Apply'))) return;
        Object.assign(state.plan.days, C.fillRotation(order, f.start, f.weeks));
        save(); toast('Rotation planned for ' + f.weeks + ' weeks');
      }
      closeSheet();
    }
  };
}

// ---- home: what is planned today, and the week at a glance
function todayCard() {
  const tk = todayKey(), byDay = C.sessionsByDay(state.sessions), pr = plannedRoutine(tk), doneToday = (byDay[tk] || []).length > 0;
  const mon = C.addDays(tk, -C.dowOf(tk)); let strip = '', any = false;
  for (let i = 0; i < 7; i++) {
    const k = C.addDays(mon, i), v = dayView(k, byDay, tk); if (v.state !== 'none') any = true;
    strip += '<span class="wd ' + v.state + (k === tk ? ' today' : '') + '"><i>' + 'MTWTFSS'[i] + '</i><b>' + (v.r && v.state !== 'done' ? esc(shortName(v.r.name)) : v.st.done.length ? '✓' : '') + '</b></span>';
  }
  let head = '';
  if (pr && !doneToday) head = '<div class="row"><div class="grow"><div class="kicker">Planned today</div><div style="font-weight:700;font-size:17px;margin-top:2px">' + esc(pr.r.name) + '</div><div class="small muted">' + pr.r.items.length + ' exercises</div></div><button class="btn primary sm" id="today-start">Start</button></div>';
  else if (pr) head = '<div class="kicker gr">Planned today · done</div><div style="font-weight:700;font-size:17px;margin-top:2px">' + esc(pr.r.name) + '</div>';
  else for (let i = 1; i <= 21 && !head; i++) { const k = C.addDays(tk, i), nx = plannedRoutine(k); if (nx) head = '<div class="kicker">Next planned</div><div style="font-weight:700;font-size:17px;margin-top:2px">' + esc(nx.r.name) + ' <span class="muted" style="font-weight:500;font-size:var(--fs-m)">· ' + esc(keyLabel(k)) + '</span></div>'; }
  if (!head && !any) return state.routines.length ? '<button class="card lrow" id="home-plan" style="width:100%;text-align:left;padding:14px 16px"><div class="grow"><div class="t">Plan your week</div><div class="s">Put your routines on the Calendar</div></div><span class="cy" style="font-weight:600">Open</span></button>' : '';
  return '<div class="card" id="today-card">' + head + '<div class="wstrip" id="home-strip" role="button" aria-label="Open calendar">' + strip + '</div></div>';
}

// ---------- ROUTINES ----------`);

// ---- home wiring
R(`installCard() + systemCard() + levelCard() + dailyQuestCard()`, `installCard() + systemCard() + todayCard() + levelCard() + dailyQuestCard()`);
R(`    const hi = $('#home-install'); if (hi) hi.onclick = doInstall;`,
  `    const hi = $('#home-install'); if (hi) hi.onclick = doInstall;
    const ts = $('#today-start'); if (ts) ts.onclick = e => { e.stopPropagation(); const pr = plannedRoutine(todayKey()); if (pr) startWorkout(pr.r); };
    const hs = $('#home-strip'); if (hs) hs.onclick = () => setTab('calendar');
    const hp = $('#home-plan'); if (hp) hp.onclick = () => setTab('calendar');`);

// ---- the daily quest points at the planned workout when the fallback quest is "just show up"
R(`  q.done = !!(g && g.key === q.key && g.done);`,
  `  q.done = !!(g && g.key === q.key && g.done);
  const planned = q.kind === 'log' && state.plan ? plannedRoutine(todayKey()) : null;
  if (planned) q.text = 'Complete the workout you planned for today: ' + planned.r.name + '.';`);

// ---- deleting a routine removes it from the calendar
R(`if (await confirmDlg('Delete routine?', draft.name + ' will be removed. Past workouts are kept.', 'Delete', true)) { state.routines = state.routines.filter(r => r.id !== draft.id); save();`,
  `if (await confirmDlg('Delete routine?', draft.name + ' will be removed, along with its place on your calendar. Past workouts are kept.', 'Delete', true)) { state.routines = state.routines.filter(r => r.id !== draft.id); for (const k of Object.keys(state.plan.days)) if (state.plan.days[k] === draft.id) delete state.plan.days[k]; state.plan.repeats = state.plan.repeats.filter(r => r.routineId !== draft.id); save();`);

R(`const APP_VERSION = '1.7.0';`, `const APP_VERSION = '1.8.0';`);
fs.writeFileSync(FILE, h);
console.log('patched ok');
