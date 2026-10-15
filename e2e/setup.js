// First-run setup: name, choose your character, stats, the ARISE moment; then the female character everywhere.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html" "" 390 e2e/setup.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, nav, sleep } = ctx;
  const { check, click, type, txt, has, st, done, SHOTS } = require('./lib')(ctx);
  const P = n => path.join(SHOTS, n);
  const tabsShown = () => evalFn(`getComputedStyle(document.querySelector('#tabs')).display !== 'none'`);

  // --- step 1: name
  check('a fresh install opens on setup, with the tab bar hidden', (await has('.setup')) && !(await tabsShown()));
  check('step 1 asks for a name', /You have been chosen/.test(await txt('.setup')) && (await has('#su-name')));
  await shot(P('setup-1-name.png'));
  await type('#su-name', 'Rin'); await click('#su-next');

  // --- step 2: character
  check('step 2 shows both characters', /Choose your character/.test(await txt('.setup')) && (await evalFn(`[...document.querySelectorAll('.su-pick .char')].map(c => c.dataset.sex).join()`)) === 'm,f');
  check('continue waits for a choice', await evalFn(`document.querySelector('#su-next').disabled`));
  await click('[data-su-sex="f"]'); await sleep(200);
  check('choosing Female marks it; no aura yet (it is earned by training every muscle)', (await has('.su-pick.on[data-su-sex="f"]')) && !(await has('.su-pick .aura')));
  check('both are the illustrated hunters at their starting build', (await evalFn(`[...document.querySelectorAll('.su-pick .char')].map(c => c.dataset.build + ':' + /-lean-front\\.webp$/.test(c.querySelector('image').getAttribute('href'))).join()`)) === 'lean:true,lean:true');
  await shot(P('setup-2-character.png'));
  await click('#su-next');

  // --- step 3: stats
  check('step 3 asks for bodyweight, age, weekly goal', /Your stats/.test(await txt('.setup')) && (await has('#su-bw')) && (await has('#su-age')) && (await has('#su-week')));
  check('placeholder suggests a typical weight for the character', (await evalFn(`document.querySelector('#su-bw').placeholder`)) === '140');
  await click('#su-finish'); await sleep(150);
  check('finishing without a bodyweight explains what is missing', /Enter your bodyweight/.test(await txt('#su-err')) && (await has('.setup')));
  await type('#su-bw', 140); await click('#su-units button[data-v="kg"]'); await sleep(100);
  check('switching to kg converts what was typed', (await evalFn(`document.querySelector('#su-bw').value`)) === '63.5', await evalFn(`document.querySelector('#su-bw').value`));
  await click('#su-units button[data-v="lb"]'); await sleep(100);
  check('and back to lb', (await evalFn(`document.querySelector('#su-bw').value`)) === '140');
  await type('#su-age', 9); await click('#su-finish'); await sleep(150);
  check('an impossible age is caught', /Enter your age/.test(await txt('#su-err')));
  await type('#su-age', 27); await click('#su-week button[data-v="4"]');
  await shot(P('setup-3-stats.png'));
  await click('#su-finish'); await sleep(700);

  // --- ARISE
  check('ARISE moment plays with the chosen character fully lit', (await has('.arise-fx')) && /ARISE/.test(await txt('.arise-fx .ar-t')) && (await evalFn(`document.querySelector('.arise-fx .char').dataset.sex`)) === 'f' && (await evalFn(`document.querySelectorAll('.arise-fx .mu.lit').length === window.ARISE_CHARS.f.lean.front.regions.length`)) && (await has('.arise-fx .aura')));
  await shot(P('setup-4-arise.png'));
  for (let i = 0; i < 12 && (await has('.arise-fx')); i++) await sleep(300);
  check('then Home, with the tab bar back', !(await has('.arise-fx')) && !(await has('.setup')) && (await tabsShown()) && (await has('#start-empty')));
  const p = (await st()).profile;
  check('profile saved', p.setupDone === true && p.name === 'Rin' && p.sex === 'f' && p.bodyweight === 140 && p.age === 27 && p.weeklyTarget === 4 && p.units === 'lb', p);
  check('home greets the hunter by name', /Rin/.test(await txt('#screen')));

  // --- the female character on Progress
  await click('[data-tab="progress"]'); await sleep(300);
  check('Progress draws the female character, front and back', (await evalFn(`[...document.querySelectorAll('.bodymap .char')].map(c => c.dataset.sex + c.dataset.view).join()`)) === 'ffront,fback');
  check('both have a summoning circle; nothing lit and no aura before any training', (await evalFn(`document.querySelectorAll('.bodymap .ring').length`)) === 4 && (await evalFn(`document.querySelectorAll('.bodymap .mu.lit, .bodymap .halo, .bodymap .aura').length`)) === 0);
  check('every muscle can be tapped, front and back', (await evalFn(`document.querySelectorAll('.bodymap [data-bm]').length === window.ARISE_CHARS.f.lean.front.regions.length + window.ARISE_CHARS.f.lean.back.regions.length`)));
  check('a new hunter sees all 16 regions still to train', /0 \/ 16 trained this week/.test(await txt('.bm-aura')), await txt('.bm-aura'));
  check('the status frame shows name and rank', /Status · Rin/.test(await txt('.bm-hud')) && /Rank E/.test(await txt('.bm-hud')), await txt('.bm-hud'));
  await evalFn(`document.querySelector('.bodymap').scrollIntoView({block:'center'})`); await sleep(300);
  await shot(P('setup-5-progress-female.png'));
  // tapping a muscle still names it
  await evalFn(`document.querySelector('.bodymap [data-bm="glutes"]').dispatchEvent(new MouseEvent('click', {bubbles: true}))`); await sleep(200);
  check('tapping a muscle names it', /Glute/.test(await txt('#toast')), await txt('#toast'));

  // --- Profile switch swaps the character
  await click('[data-tab="profile"]'); await sleep(200);
  check('Profile shows Female selected', await has('#p-sex button.on[data-v="f"]'));
  await click('#p-sex button[data-v="m"]'); await sleep(200); await click('[data-tab="progress"]'); await sleep(300);
  check('switching to Male swaps the character', (await evalFn(`document.querySelector('.bodymap .char').dataset.sex`)) === 'm');
  await click('[data-tab="profile"]'); await click('#p-sex button[data-v="f"]'); await sleep(200);

  // --- a reload does not show setup again
  await evalFn(`window.dispatchEvent(new Event('pagehide'))`);
  await nav('http://127.0.0.1:8765/index.html'); await sleep(300);
  check('setup does not come back after a reload', !(await has('.setup')) && (await tabsShown()));

  // --- someone who used the app before setup existed never sees it
  await evalFn(`(() => { localStorage.setItem('arise.v1', JSON.stringify({ profile: { name: 'Old', sex: 'm', bodyweight: 200 }, sessions: [{ id: 'x', date: Date.now() - 86400000, entries: [{ exId: 'bb_bench', sets: [{ w: 185, r: 5 }] }] }] })); })()`);
  await nav('http://127.0.0.1:8765/index.html'); await sleep(300);
  check('an existing log skips setup', !(await has('.setup')) && (await st()).profile.setupDone === true);
  const ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('no horizontal overflow', ov.sw <= ov.w, ov);
  done('setup');
};
