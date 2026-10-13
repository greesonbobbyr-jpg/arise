// Tier wording against published standards, the "how this is measured" sheet, e1RM source, shadow verdicts.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html?demo#progress" "" 390 e2e/tiers-and-shadow.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, sleep } = ctx;
  const { check, click, type, txt, st, dismissNotify, clearSystem, modalOpen, done, SHOTS } = require('./lib')(ctx);
  const P = n => path.join(SHOTS, n);
  const card = id => txt('[data-lift="' + id + '"]');

  // --- Progress: demo deadlift e1RM 338 at 180 lb. Published thresholds at 180: 201 / 268 / 348 / 438 / 535.
  const dl = await card('bb_deadlift');
  check('says who you are compared to', /Stronger than \d+% of men who lift at 180 lb · Novice/.test(dl), dl.slice(0, 260));
  check('names the next level and the gap', /Intermediate at 34[78] lb · \d+(\.\d)? lb to go/.test(dl), (dl.match(/Intermediate at[^E]*/) || [''])[0]);
  check('gives the all-men estimate, labelled as an estimate', /Est\. stronger than ~7\d% of all men/.test(dl));
  check('shows which set the number came from', /From your best set in the last 28 days: 290 × 5 on /.test(dl));
  check('defines the shadow and dates it', /Shadow \(your all-time best\): 290 × 5 · 338 lb e1RM · /.test(dl));
  check('deadlift: last session beat the shadow', /You beat your shadow last time/.test(dl));
  const sq = await card('bb_squat');
  check('squat (same numbers every week): matched, not beaten', /you matched your shadow/.test(sq), (sq.match(/Last time[^.]*/) || [''])[0]);
  const pu = await card('bw_pullup');
  check('pull-up target is given as added weight', /Intermediate at \+\d+ lb added/.test(pu), (pu.match(/Intermediate at[^·]*/) || [''])[0]);
  await evalFn(`document.querySelector('[data-lift="bb_deadlift"]').scrollIntoView({block:'start'}); window.scrollBy(0,-10)`); await sleep(200);
  await shot(P('tier-1-card.png'));

  // --- info sheet
  await click('[data-lift="bb_deadlift"] [data-tierinfo]'); await sleep(300);
  const sheet = await txt('#modal');
  check('info sheet opens', (await modalOpen()) && /how this is measured/.test(sheet));
  check('card did not toggle open from that tap', !(await evalFn(`document.querySelector('[data-lift="bb_deadlift"]').classList.contains('open')`)));
  check('sheet: comparison group and that it is not the general population', /Men who lift and log their lifts, at your bodyweight \(180 lb\)/.test(sheet) && /not the general population/.test(sheet));
  check('sheet: five levels in lb with meanings, and your line', ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'].every(n => sheet.includes(n)) && /stronger than 50% · about two years/.test(sheet) && /You · estimated 1RM338 lb/.test(sheet.replace(/\s+/g, ' ').replace('1RM 338', '1RM338')));
  check('sheet: thresholds at 180 lb within a pound of published 201 / 268 / 348', /20[01] lb/.test(sheet) && /26[78] lb/.test(sheet) && /34[78] lb/.test(sheet), (sheet.match(/Elite.*Beginner[^s]*/) || [''])[0].slice(0, 120));
  check('sheet: all-men estimate explains its CDC basis', /CDC survey data says about 45% of men your age/.test(sheet) && /estimate/.test(sheet));
  check('sheet: explains best-set rule with the curl example', /50 × 12, 50 × 8, 50 × 7 gives 70, 63 and 62/.test(sheet) && /later sets with fewer reps never lower it/.test(sheet));
  await shot(P('tier-2-sheet.png'));
  await click('#modal .acts button'); await sleep(200);

  // --- workout: shadow line is defined and dated, with the verdict for last time
  await click('[data-tab="workout"]');
  const upper = (await st()).routines.find(r => r.name === 'Upper A');
  await click('[data-start-routine="' + upper.id + '"]'); await sleep(400);
  const shadow = await txt('#shadow-0'), verdict = await txt('.exblock[data-e="0"] .shadowv');
  check('shadow line: "your best", set, e1RM, date', /Shadow · your best163 × 6·196 e1RM· /.test(shadow.replace(/\s+/g, ' ').replace(/ · /g, '·').replace('best 163', 'best163')) || /Shadow · your best/.test(shadow) && /163 × 6/.test(shadow) && /196 e1RM/.test(shadow), shadow);
  check('verdict under it: beat it last time', /You beat your shadow last time \(.+, \+\d/.test(verdict), verdict);
  await shot(P('tier-3-shadow.png'));
  await type('[data-w="0:0"]', 190); await type('[data-r="0:0"]', 8); await click('[data-ck="0:0"]'); await sleep(300); await dismissNotify();
  const live = await txt('#exstats-0');
  check('live line names the source set', /e1RM 241 from set 1 \(190 × 8\)/.test(live.replace(/\s+/g, ' ')), live);
  await click('#finish'); await sleep(200); await click('#modal .acts button.primary'); await sleep(600);
  check('summary lists shadows beaten', /Shadows beaten · new bests/.test(await txt('#modal')));
  await click('#modal .acts button.primary'); await sleep(300); await clearSystem();
  if (await evalFn(`document.querySelector('#rankup').classList.contains('on')`)) { await sleep(1500); await click('#rankup'); }

  // --- next session falls short → the following one says so
  await click('#start-empty'); await click('#add-ex'); await sleep(300); await click('[data-pick="bb_bench"]'); await click('#padd'); await sleep(300);
  check('after beating it: verdict says so', /You beat your shadow last time/.test(await txt('.shadowv')), await txt('.shadowv'));
  await type('[data-w="0:0"]', 135); await type('[data-r="0:0"]', 5); await click('[data-ck="0:0"]'); await sleep(300); await dismissNotify();
  await click('#finish'); await sleep(200); await click('#modal .acts button.primary'); await sleep(600);
  check('summary: none beaten this time', /No shadows beaten this time/.test(await txt('#modal')));
  await click('#modal .acts button.primary'); await sleep(300); await clearSystem();
  await click('#start-empty'); await click('#add-ex'); await sleep(300); await click('[data-pick="bb_bench"]'); await click('#padd'); await sleep(300);
  const short = await txt('.shadowv');
  check('after falling short: verdict gives the gap', /Last time \(.+\): 158 e1RM, 8[34] lb short of your shadow/.test(short), short);
  const ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('no horizontal overflow', ov.sw <= ov.w, ov);
  done('tiers and shadow');
};
