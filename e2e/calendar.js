// Calendar: month grid, drag and drop (real pointer events), day sheet with search, repeat, auto-fill, home Today card.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html?demo#calendar" "" 390 e2e/calendar.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, sleep } = ctx;
  const { check, click, type, txt, st, dismissNotify, clearSystem, modalOpen, done, SHOTS } = require('./lib')(ctx);
  const P = n => path.join(SHOTS, n);
  const key = n => evalFn(`window.ARISE_CORE.addDays(window.ARISE_CORE.dateKey(Date.now()), ${n})`);
  const planned = k => evalFn(`(() => { const p = window.ARISE_CORE.plannedFor(window.ARISE.state.plan, ${JSON.stringify(k)}); return p ? p.routineId + ':' + p.source : null; })()`);
  const cell = k => '#cal [data-day="' + k + '"]';
  const has = sel => evalFn(`!!document.querySelector(${JSON.stringify(sel)})`);
  // drag with pointer events, the way a finger does it: down on the source, move past the threshold, move to the target, up
  const drag = (srcSel, dstSel) => evalFn(`(async () => {
    const src = document.querySelector(${JSON.stringify(srcSel)}), dst = document.querySelector(${JSON.stringify(dstSel)});
    if (!src || !dst) return 'MISSING ' + (!src ? 'source' : 'target');
    const mid = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const [x0, y0] = mid(src), wait = ms => new Promise(r => setTimeout(r, ms));
    const ev = (t, x, y, on) => (on || document).dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0 }));
    ev('pointerdown', x0, y0, src); ev('pointermove', x0 + 14, y0 - 14); await wait(40);
    const [x1, y1] = mid(document.querySelector(${JSON.stringify(dstSel)}));       // the remove zone only exists once a drag is under way
    ev('pointermove', x1, y1); await wait(40); ev('pointermove', x1, y1);
    const over = !!document.querySelector('.cal .d.over, .dropzone.over'), ghost = !!document.querySelector('.dragghost');
    ev('pointerup', x1, y1); await wait(60);
    return 'ok over=' + over + ' ghost=' + ghost;
  })()`);

  const k2 = await key(2), k4 = await key(4), kPast = await key(-2), kToday = await key(0), k9 = await key(9), k16 = await key(16);
  await evalFn('window.scrollTo(0, 0)');

  // --- grid
  const info = await evalFn(`({ n: document.querySelectorAll('#cal .d').length, today: document.querySelectorAll('#cal .d.today').length, logged: document.querySelectorAll('#cal .d.extra, #cal .d.done').length, tabs: document.querySelectorAll('#tabs button').length, tray: [...document.querySelectorAll('#tray .rc')].map(e => e.textContent) })`);
  check('five tabs, Calendar selected', info.tabs === 5 && (await evalFn(`document.querySelector('#tabs button.on').dataset.tab`)) === 'calendar');
  check('month grid is whole weeks with today marked', info.n % 7 === 0 && info.n >= 28 && info.today === 1, info);
  check('past workouts show on their days', info.logged >= 3, info.logged);
  check('routine tray lists both routines', info.tray.join(',') === 'Upper A,Lower A', info.tray);

  // --- drag from the tray onto a day
  let r = await drag('[data-drag-routine="demoA"]', cell(k2));
  check('dragging shows a ghost and highlights the day', r === 'ok over=true ghost=true', r);
  check('drop saves the routine to that day only', (await planned(k2)) === 'demoA:day' && (await planned(k9)) === null, await planned(k2));
  check('the day shows the routine as planned', /Upper A/.test(await txt(cell(k2))) && (await has(cell(k2) + '.planned')));
  check('ghost is cleaned up', !(await has('.dragghost')));
  await shot(P('cal-1-planned.png'));
  // --- move it to another day by dragging the chip
  r = await drag(cell(k2) + ' [data-drag-day]', cell(k4));
  check('dragging a planned workout moves it', (await planned(k2)) === null && (await planned(k4)) === 'demoA:day', r);
  // --- drag it to the remove zone
  r = await drag(cell(k4) + ' [data-drag-day]', '#dropzone');
  check('dropping on the remove zone clears the day', (await planned(k4)) === null, r);
  // --- past days cannot be planned
  r = await drag('[data-drag-routine="demoB"]', cell(kPast));
  check('dropping on a past day does nothing', (await planned(kPast)) === null, r);

  // --- tap a day: search, pick, repeat
  await click(cell(k2)); await sleep(300);
  check('day sheet opens with the date', (await has('#sheet.on')) && (await txt('#ds-title')).length > 6, await txt('#ds-title'));
  await type('#ds-q', 'squat'); await sleep(150);
  const found = await evalFn(`[...document.querySelectorAll('[data-ds-pick]')].map(e => e.dataset.dsPick)`);
  check('search finds routines by exercise (squat → Lower A)', found.join(',') === 'demoB', found);
  check('search keeps focus while typing', (await evalFn(`document.activeElement && document.activeElement.id`)) === 'ds-q');
  await click('[data-ds-pick="demoB"]'); await sleep(200);
  check('picking saves it to this day only', (await planned(k2)) === 'demoB:day' && /this day only/.test(await txt('#ds-planned')), await txt('#ds-planned'));
  await shot(P('cal-2-day-sheet.png'));
  await click('#ds-repeat button[data-v="1"]'); await sleep(200);
  const rep = (await st()).plan.repeats;
  check('Repeat turns it into a weekly rule from this date', rep.length === 1 && rep[0].routineId === 'demoB' && rep[0].from === k2 && (await planned(k9)) === 'demoB:repeat' && (await planned(k16)) === 'demoB:repeat', rep);
  check('sheet says it repeats', /repeats every \w+day/.test(await txt('#ds-planned')));
  await click('#ds-close'); await sleep(250);
  // --- skip one occurrence, then stop the repeat
  if (!(await has(cell(k9)))) { await click('#cal-next'); await sleep(200); }
  await click(cell(k9)); await sleep(250);
  await click('#ds-remove'); await sleep(200);
  check('Skip this day cancels one occurrence only', (await planned(k9)) === null && (await planned(k16)) === 'demoB:repeat' && (await planned(k2)) === 'demoB:repeat');
  await click('#ds-close'); await sleep(250);
  await click('#cal-today'); await sleep(200);
  await click(cell(k2)); await sleep(250);
  await click('#ds-stop'); await sleep(200);
  check('Stop repeating ends it from that day on', (await planned(k2)) === null && (await planned(k16)) === null);
  await click('#ds-close'); await sleep(250);

  // --- today: plan it, start it from the home card, finish, see it done
  await click(cell(kToday)); await sleep(250);
  await click('[data-ds-pick="demoA"]'); await sleep(200);
  check('today can be started from the day sheet', await has('#ds-start'));
  await click('#ds-close'); await sleep(250);
  await click('[data-tab="workout"]'); await sleep(200);
  const home = await txt('#today-card');
  check('home shows what is planned today with Start', /Planned today/.test(home) && /Upper A/.test(home) && (await has('#today-start')), home.slice(0, 80));
  check('home shows the week strip', (await evalFn(`document.querySelectorAll('#home-strip .wd').length`)) === 7);
  await evalFn('window.scrollTo(0, 0)'); await shot(P('cal-3-home.png'));
  await click('#today-start'); await sleep(400);
  let s = await st();
  check('Start begins the planned routine', !!s.active && s.active.routineId === 'demoA' && s.active.entries.length === 3);
  await click('[data-ck="0:0"]'); await sleep(300); await dismissNotify();
  await click('#finish'); await sleep(200); await click('#modal .acts button.primary'); await sleep(600);
  await click('#modal .acts button.primary'); await sleep(300); await clearSystem();
  if (await evalFn(`document.querySelector('#rankup').classList.contains('on')`)) { await sleep(1500); await click('#rankup'); }
  check('home marks today done', /Planned today · done/.test(await txt('#today-card')), (await txt('#today-card')).slice(0, 60));
  await click('[data-tab="calendar"]'); await sleep(200);
  check('calendar marks today done', await has(cell(kToday) + '.done'));

  // --- auto-fill: weekly pattern
  await click('#cal-fill'); await sleep(300);
  await evalFn(`(() => { const set = (d, v) => { const el = document.querySelector('[data-fl-dow="' + d + '"]'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }; for (let d = 0; d < 7; d++) set(d, ''); set(0, 'demoA'); set(3, 'demoB'); })()`);
  await click('#fl-apply'); await sleep(250);
  check('weekly pattern asks first', /Apply weekly pattern\?/.test(await txt('#modal')) && /2 training days a week/.test(await txt('#modal')));
  await click('#modal .acts button.primary'); await sleep(300);
  const weekly = await evalFn(`(() => { const C = window.ARISE_CORE, tk = C.dateKey(Date.now()), out = {}; for (let i = 1; i <= 14; i++) { const k = C.addDays(tk, i), p = C.plannedFor(window.ARISE.state.plan, k); if (p) out[C.dowOf(k)] = (out[C.dowOf(k)] || '') + p.routineId + ' '; } return out; })()`);
  check('weekly pattern plans every Monday and Thursday', /demoA demoA/.test(weekly[0] || '') && /demoB demoB/.test(weekly[3] || '') && Object.keys(weekly).length === 2, weekly);
  await shot(P('cal-4-weekly.png'));
  // --- auto-fill: rotation
  await click('#cal-fill'); await sleep(300);
  await click('#fl-mode button[data-v="rotation"]'); await sleep(200);
  check('rotation offers the routines in a loop with a rest day', (await evalFn(`[...document.querySelectorAll('[data-fl-slot]')].map(e => e.value || 'rest').join(',')`)) === 'demoA,demoB,rest');
  await shot(P('cal-5-rotation.png'));
  await click('#fl-apply'); await sleep(250); await click('#modal .acts button.primary'); await sleep(300);
  const rot = await evalFn(`(() => { const C = window.ARISE_CORE, tk = C.dateKey(Date.now()); return [0, 1, 2, 3, 4, 27, 28].map(i => { const p = C.plannedFor(window.ARISE.state.plan, C.addDays(tk, i)); return p ? p.routineId : 'rest'; }).join(','); })()`);
  check('rotation writes 28 days in order, ignoring weekdays', /^demoA,demoB,rest,demoA,demoB,/.test(rot), rot);
  // --- clear
  await click('#cal-fill'); await sleep(300); await click('#fl-clear'); await sleep(250); await click('#modal .acts button.danger'); await sleep(300);
  s = await st();
  const future = await evalFn(`(() => { const C = window.ARISE_CORE, tk = C.dateKey(Date.now()); let n = 0; for (let i = 1; i <= 60; i++) if (C.plannedFor(window.ARISE.state.plan, C.addDays(tk, i))) n++; return n; })()`);
  check('clear removes everything from today on, keeps the log', future === 0 && s.sessions.length > 20, future);
  // --- deleting a routine removes it from the calendar
  await drag('[data-drag-routine="demoB"]', cell(k4));
  await click('[data-tab="routines"]'); await click('[data-edit-routine="demoB"]'); await click('#r-delete'); await sleep(200); await click('#modal .acts button.danger'); await sleep(300);
  check('deleting a routine clears its planned days', (await planned(k4)) === null);
  const ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('no horizontal overflow', ov.sw <= ov.w, ov);
  done('calendar');
};
