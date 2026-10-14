// Program Replace keeps routine ids/history; top-of-range cue; next-session one-tap weight bump.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html#routines" "" 390 e2e/program-update.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, sleep } = ctx;
  const { check, click, type, txt, st, dismissNotify, clearSystem, doSetup, done, SHOTS } = require('./lib')(ctx);
  check('a fresh install opens on the setup screen, and it can be finished', await doSetup());
  // simulate the old layout: add the program, then put Seated DB Shoulder Press back into Push
  await click('[data-tab="routines"]');
  await click('[data-program="pplp"]'); await sleep(200); await click('#modal .acts button.primary'); await sleep(300);
  await evalFn(`(()=>{const r=window.ARISE.state.routines.find(x=>x.name==='Push'); r.items.splice(2,0,{exId:'db_shoulder',sets:3,reps:8,repsMax:12,restSec:120}); window.ARISE.render();})()`);
  let s = await st();
  const pushId = s.routines.find(r => r.name === 'Push').id;
  // log a Push session where bench hits the top of 5–8 on every set
  await click('[data-start-routine="' + pushId + '"]'); await sleep(400);
  for (let i = 0; i < 3; i++) { await type(`[data-w="0:${i}"]`, 185); await type(`[data-r="0:${i}"]`, 8); await click(`[data-ck="0:${i}"]`); await sleep(150); await dismissNotify(); }
  const live = await txt('#exstats-0');
  check('live cue: top of range → add weight next workout', /Top of range/.test(live) && /Add weight next workout/.test(live), live);
  await type('[data-w="2:0"]', 50); await type('[data-r="2:0"]', 10); await click('[data-ck="2:0"]'); await sleep(150);
  check('7-rep middle set does not trigger the cue', !/Top of range/.test(await txt('#exstats-2')));
  await click('#finish'); await sleep(200); await click('#modal .acts button.primary'); await sleep(500);
  await click('#modal .acts button.primary'); await sleep(300);
  await clearSystem();
  if (await evalFn(`document.querySelector('#rankup').classList.contains('on')`)) { await sleep(1500); await click('#rankup'); }
  // Update the program → Replace
  await click('[data-tab="routines"]');
  check('program button reads Update', (await txt('[data-program="pplp"]')) === 'Update');
  await click('[data-program="pplp"]'); await sleep(200);
  check('update dialog offers Replace', /Replace/.test(await txt('#modal')) && /keeps your workout history/.test(await txt('#modal')));
  await click('#modal .acts button.primary'); await sleep(300);
  s = await st();
  const push = s.routines.filter(r => r.name === 'Push');
  check('still one Push routine, same id', push.length === 1 && push[0].id === pushId, push.map(r => r.id));
  check('Push now matches the new layout (no shoulder press)', push[0].items.map(i => i.exId).join(',') === 'bb_bench,mc_cable_lateral,db_incline,mc_cable_fly,mc_pushdown,mc_oh_tri_ext', push[0].items.map(i => i.exId));
  check('4 routines total', s.routines.length === 4, s.routines.map(r => r.name));
  check('Push card still shows last performed', /Last /.test(await evalFn(`[...document.querySelectorAll('.card')].find(c=>/^Push/.test(c.textContent)).textContent`)));
  // next Push: bench offers the bump; tapping it loads 190 into open sets and clears reps
  await click('[data-start-routine="' + pushId + '"]'); await sleep(400);
  const chip = await txt('[data-bump="0"]');
  check('bench offers go to 190', /go to 190 lb/.test(chip), chip);
  check('cable lateral (no history) has no bump', !(await evalFn(`!!document.querySelector('[data-bump="1"]')`)));
  await shot(path.join(SHOTS, 'bump-chip.png'));
  await click('[data-bump="0"]'); await sleep(250);
  s = await st();
  check('bump loads 190 into all bench sets, reps cleared', s.active.entries[0].sets.every(x => x.w === 190 && x.r === 0), s.active.entries[0].sets);
  check('chip hides after use', !(await evalFn(`!!document.querySelector('[data-bump="0"]')`)));
  done('program update');
};
