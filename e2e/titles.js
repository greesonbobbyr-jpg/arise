// Titles: batch reveal (REVEAL ALL cascade and summary), the Titles screen with progress, unique emblems,
// the one-time check of the whole log, and the sound toggle.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html?demo&sealedall#workout" "" 390 e2e/titles.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, nav, sleep } = ctx;
  const { check, click, txt, has, st, sysOpen, clearSystem, done, SHOTS } = require('./lib')(ctx);
  const P = n => path.join(SHOTS, n);
  const stage = () => evalFn(`(document.querySelector('.sys')||{dataset:{}}).dataset.stage || ''`);
  const total = await evalFn('window.ARISE_TITLES.TITLES.length');

  // --- a batch waits on the home banner
  let s = await st();
  const n = s.game.unseen.length;
  check('the demo log earns a batch of sealed titles', n > 3 && n === Object.keys(s.game.achievements).length, n);
  check('home banner counts them', new RegExp(n + ' new titles have been acquired').test(await txt('#sys-open')), await txt('#sys-open'));

  // --- the window asks: reveal all, or one at a time
  await click('#sys-open'); await sleep(1500);
  const ask = await txt('.sys');
  check('window announces the count and offers both ways', new RegExp('You have acquired ' + n + ' new titles').test(ask) && /REVEAL ALL/.test(ask) && /Open them one at a time/.test(ask), ask.slice(0, 120));
  check('nothing is named yet', !/Awakened|Regular/.test(ask) && (await st()).game.unseen.length === n);
  await shot(P('titles-1-ask.png'));
  await evalFn(`document.querySelector('.sys').click()`); await sleep(300);
  check('a stray tap does not start anything', (await stage()) === 'sealed');

  // --- reveal all: a fast cascade, then a summary
  await evalFn(`document.querySelector('.sys .sys-btn[data-sys-choice="all"]').click()`); await sleep(900);
  check('cascade is running', (await stage()) === 'cascade' && /\d+ \/ \d+/.test(await txt('.sys-count')), await txt('.sys-count'));
  await shot(P('titles-2-cascade.png'));
  for (let i = 0; i < 60 && (await stage()) !== 'summary'; i++) await sleep(500);
  await sleep(700);
  const sum = await txt('.sys');
  check('summary shows how many were acquired', (await stage()) === 'summary' && (await txt('.sys-big')) === String(n), await txt('.sys-big'));
  check('summary lists every title with its emblem', (await evalFn(`document.querySelectorAll('.sys-grid .sys-cell svg.emb').length`)) === n && /Awakened/.test(sum));
  check('all of them are now opened', (await st()).game.unseen.length === 0);
  check('a long list says it scrolls', new RegExp('Scroll to see all ' + n).test(await txt('.sys-count')) && (await has('.sys-grid.more')), await txt('.sys-count'));
  await shot(P('titles-3-summary.png'));
  await evalFn(`(() => { const g = document.querySelector('.sys-grid'); g.scrollTop = g.scrollHeight; g.dispatchEvent(new Event('scroll')); })()`); await sleep(200);
  check('…and the fade lifts at the end of the list', !(await has('.sys-grid.more')));
  await evalFn(`document.querySelector('.sys-grid').click()`); await sleep(300);
  check('tapping inside the list does not dismiss', await sysOpen());
  await evalFn(`document.querySelector('.sys .sys-btn[data-sys-choice="accept"]').click()`); await sleep(600);
  check('ACCEPT closes the window and clears the banner', !(await sysOpen()) && !(await has('#sys-open')));

  // --- Profile summary → Titles screen
  await click('[data-tab="profile"]'); await sleep(200);
  check('Profile shows the count and recent emblems', new RegExp('Titles · ' + n + '/' + total).test(await txt('#p-titles')) && (await evalFn(`document.querySelectorAll('#p-titles .tsum svg.emb').length`)) >= 3, await txt('#p-titles'));
  await click('#p-titles'); await sleep(300);
  const view = await evalFn(`({ cards: document.querySelectorAll('.tcard').length, earned: document.querySelectorAll('.tcard.earned').length, locked: document.querySelectorAll('.tcard.locked').length, cats: document.querySelectorAll('.tcat').length, count: document.querySelector('#t-count').textContent })`);
  check('Titles screen lists every title by category', view.cards === total && view.earned === n && view.locked === total - n && view.cats >= 15 && view.count === n + '/' + total, view);
  const uniq = await evalFn(`new Set([...document.querySelectorAll('.tcard .em svg')].map(e => e.outerHTML.replace(' locked', ''))).size`);
  check('every title has its own emblem on screen', uniq === total, uniq);
  const b185 = await txt('[data-ach="b185"]');
  check('a locked title shows its condition and progress (bench 163 of 185)', /Bench press 185 lb/.test(b185) && /163 lb \/ 185 lb/.test(b185), b185);
  const w25 = await txt('[data-ach="w25"]');
  check('count progress reads as a count (21 of 25 workouts)', /21 \/ 25/.test(w25), w25);
  check('tier and rank progress read as names, not numbers', /(No tier yet|Beginner|Novice|Intermediate|Advanced) \/ Elite/.test(await txt('[data-ach="tier_elite"]')) && /Rank [EDCBA] \/ Rank S/.test(await txt('[data-ach="rankS"]')), [await txt('[data-ach="tier_elite"]'), await txt('[data-ach="rankS"]')]);
  check('an earned title shows its grade and date',/Common · \w+ \d+/.test(await txt('[data-ach="first"]')), await txt('[data-ach="first"]'));
  await evalFn('window.scrollTo(0, 0)'); await shot(P('titles-4-screen.png'));
  await evalFn(`document.querySelector('[data-ach="b135"]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -70)`); await sleep(200); await shot(P('titles-5-bench.png'));
  // filters
  await click('#t-chips [data-tf="earned"]'); await sleep(200);
  check('Earned filter', (await evalFn(`document.querySelectorAll('.tcard').length`)) === n && !(await has('.tcard.locked')));
  await click('#t-chips [data-tf="legendary"]'); await sleep(200);
  const leg = await evalFn(`[...document.querySelectorAll('.tcard')].map(c => c.dataset.ach)`);
  check('Legendary filter shows only legendary titles', leg.length >= 8 && leg.includes('d585') && leg.includes('rankS') && !leg.includes('first'), leg.length);
  await shot(P('titles-6-legendary.png'));
  await click('#t-chips [data-tf="all"]'); await sleep(200);
  // tap behaviour
  await click('[data-ach="d405"]'); await sleep(250);
  check('locked title says what it needs', /Locked · Deadlift 405 lb/.test(await txt('#toast')) && !(await sysOpen()), await txt('#toast'));
  await click('[data-ach="w10"]'); await sleep(1700);
  check('earned title replays its reveal', (await stage()) === 'revealed' && (await txt('.sys-name')) === 'Regular' && (await has('.sys-emblem svg.emb.g-common .mk')));
  await clearSystem();
  await click('#t-back'); await sleep(200);
  check('back returns to Profile', await has('#p-name'));

  // --- sound toggle
  const snd = await evalFn(`({ ok: !!window.ARISE_SFX, on: window.ARISE_SFX && window.ARISE_SFX.enabled })`);
  check('sound is available and on by default', snd.ok && snd.on === true, snd);
  await click('#p-sound button[data-v="0"]'); await sleep(200);
  check('turning sound off silences it and saves', (await evalFn('window.ARISE_SFX.enabled')) === false && (await st()).profile.sound === false && (await evalFn(`window.ARISE_SFX.play('seal')`)) === false);
  await click('#p-sound-test'); await sleep(200);
  check('Test says sound is off', /Sound effects are off/.test(await txt('#toast')));
  await click('#p-sound button[data-v="1"]'); await sleep(200);
  check('turning it back on', (await evalFn('window.ARISE_SFX.enabled')) === true && (await st()).profile.sound === true);

  // --- kg: lifted-weight conditions convert
  await click('#p-units button[data-v="kg"]'); await sleep(200); await click('#p-titles'); await sleep(250);
  check('conditions and progress convert to kg', /Bench press 85 kg/.test(await txt('[data-ach="b185"]')) && /kg \/ \d+(\.\d)? kg/.test(await txt('[data-ach="b185"]')), await txt('[data-ach="b185"]'));
  await click('#t-back'); await click('#p-units button[data-v="lb"]'); await sleep(200);

  // --- history counts: a log from before the new titles is checked once on open
  await evalFn(`(() => { const g = window.ARISE.state.game; g.achievements = { first: 1, w10: 1 }; g.unseen = []; g.achVersion = 1; window.dispatchEvent(new Event('pagehide')); })()`);
  await nav('http://127.0.0.1:8765/index.html'); await sleep(300);
  s = await st();
  check('on open, the whole log is checked once and new titles arrive sealed', s.game.achVersion === 2 && s.game.unseen.length === n - 2 && !s.game.unseen.includes('first'), s.game.unseen.length);
  check('home banner announces them', /new titles have been acquired/.test(await txt('#sys-open')));
  await nav('http://127.0.0.1:8765/index.html'); await sleep(300);
  check('it does not re-check on the next open', (await st()).game.unseen.length === n - 2);
  // one at a time is still available for a batch
  await click('#sys-open'); await sleep(1500);
  await evalFn(`document.querySelector('.sys [data-sys-choice="each"]').click()`); await sleep(900);
  check('one at a time: the first arrives sealed with a counter', (await stage()) === 'sealed' && /1 \/ \d+/.test(await txt('.sys-count')) && /REVEAL/.test(await txt('.sys-btn')));
  await evalFn(`document.querySelector('.sys').click()`); await sleep(1600);
  check('…and reveals on tap', (await stage()) === 'revealed' && (await txt('.sys-name')).length > 2, await txt('.sys-name'));
  // a long queue can be finished in one go from any card
  const rest = await txt('.sys [data-sys-rest]');
  check('the card offers to reveal the rest at once', new RegExp('Reveal the other ' + (n - 3) + ' at once').test(rest), rest);
  await shot(P('titles-9-one-at-a-time.png'));
  await evalFn(`document.querySelector('.sys [data-sys-rest]').click()`); await sleep(700);
  check('…which runs the cascade for what is left', (await stage()) === 'cascade' && new RegExp('\\d+ / ' + (n - 3)).test(await txt('.sys-count')), await txt('.sys-count'));
  await evalFn(`document.querySelector('.sys').click()`);
  for (let i = 0; i < 20 && (await stage()) !== 'summary'; i++) await sleep(300);
  check('a tap skips the cascade to the summary', (await stage()) === 'summary' && (await txt('.sys-big')) === String(n - 3) && (await st()).game.unseen.length === 0, await txt('.sys-big'));
  await clearSystem();
  check('window can be cleared', !(await sysOpen()));

  // --- contact sheet of every emblem, for a visual check
  await evalFn(`(() => { const T = window.ARISE_TITLES, S = window.ARISE_SYSTEM, d = document.createElement('div'); d.id = 'sheet-all';
    d.style.cssText = 'position:fixed;inset:0;z-index:999;background:#0A0B0F;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(7,1fr);gap:8px 4px;align-content:start';
    d.innerHTML = T.TITLES.map(t => '<span style="display:flex;flex-direction:column;align-items:center;gap:2px"><span style="width:46px;height:46px">' + S.emblem(t, { mini: true }).replace('<svg', '<svg style="width:46px;height:46px"') + '</span><b style="font:600 7px system-ui;color:#9AA3B2;text-align:center;line-height:1.1">' + t.name + '</b></span>').join('');
    document.body.appendChild(d); })()`);
  await sleep(200); await shot(P('titles-7-emblems-a.png'));
  await evalFn(`document.querySelector('#sheet-all').scrollTop = 780`); await sleep(200); await shot(P('titles-8-emblems-b.png'));
  await evalFn(`document.querySelector('#sheet-all').remove()`);
  const ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('no horizontal overflow', ov.sw <= ov.w, ov);
  done('titles');
};
