// Program routines show rep ranges during the workout; each exercise labels how weight is entered.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html#routines" "" 390 e2e/load-and-ranges.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, sleep } = ctx;
  const { check, click, type, txt, st, dismissNotify, doSetup, done, SHOTS } = require('./lib')(ctx);
  check('a fresh install opens on the setup screen, and it can be finished', await doSetup());
  await click('[data-tab="routines"]');
  await click('[data-program="pplp"]'); await sleep(200);
  await click('#modal .acts button.primary'); await sleep(300);
  const s = await st();
  const push = s.routines.find(r => r.name === 'Push');
  check('4 routines added', ['Push', 'Pull', 'Legs', 'Pretty'].every(n => s.routines.some(r => r.name === n)));
  await click('[data-start-routine="' + push.id + '"]'); await sleep(400);
  const blocks = await evalFn(`[...document.querySelectorAll('.exblock')].map(b => ({ name: b.querySelector('h2').textContent, sub: (b.querySelector('.exsub')||{}).textContent||'', head: b.querySelectorAll('.thead span')[2].textContent, wph: b.querySelector('[data-w]').placeholder, rph: b.querySelector('[data-r]').placeholder, rval: b.querySelector('[data-r]').value }))`);
  const by = n => blocks.find(b => b.name === n) || {};
  check('bench shows target 3 × 5–8', /3 × 5–8 reps/.test(by('Bench Press').sub), by('Bench Press'));
  check('bench weight column is total lb', by('Bench Press').head === 'lb', by('Bench Press').head);
  check('bench reps blank with 5–8 placeholder', by('Bench Press').rval === '' && by('Bench Press').rph === '5–8', by('Bench Press'));
  check('db incline: per dumbbell + 8–12', /8–12 reps/.test(by('Dumbbell Incline Press').sub) && /Weight per dumbbell/.test(by('Dumbbell Incline Press').sub) && by('Dumbbell Incline Press').head === 'lb/DB', by('Dumbbell Incline Press'));
  check('cable lateral: per side', /Weight per side/.test(by('Cable Lateral Raise').sub) && by('Cable Lateral Raise').head === 'lb/side', by('Cable Lateral Raise'));
  check('cable fly: per side', by('Cable Fly').head === 'lb/side', by('Cable Fly'));
  check('pushdown: total, no hint', by('Tricep Pushdown').head === 'lb' && !/Weight per/.test(by('Tricep Pushdown').sub), by('Tricep Pushdown'));
  const a = (await st()).active;
  check('target stored on entry', a.entries[0].target && a.entries[0].target.reps === 5 && a.entries[0].target.repsMax === 8, a.entries[0].target);
  await shot(path.join(SHOTS, 'push-targets.png'));
  await type('[data-w="2:0"]', 60); await type('[data-r="2:0"]', 10);
  await click('[data-ck="2:0"]'); await sleep(300); await dismissNotify();
  check('live e1RM tagged /DB', /e1RM 80 \/DB/.test(await txt('#exstats-2')), await txt('#exstats-2'));
  await click('#finish'); await sleep(200); await click('#modal .acts button.primary'); await sleep(600);
  const sum = (await txt('#modal')).replace(/\s/g, '');
  check('summary volume counts both dumbbells (1200 lb)', /Volume1200/.test(sum), sum.slice(0, 120));
  done('load/range');
};
