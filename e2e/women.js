// Women's titles (targets, names, emblems, kg), the backup reminder, and the iPhone Add to Home Screen card.
// Runs at 360px so the longer women's names are checked on a small phone.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html?demo#profile" "" 360 e2e/women.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, nav, sleep, S } = ctx;
  const { check, click, txt, has, st, clearSystem, done, SHOTS } = require('./lib')(ctx);
  const P = n => path.join(SHOTS, n);
  const B = 'http://127.0.0.1:8765/index.html';

  // --- switch the demo hunter to Female: titles follow the women's targets
  const before = Object.keys((await st()).game.achievements).length;
  await click('#p-sex button[data-v="f"]'); await sleep(300);
  let s = await st();
  check('switching to Female re-checks titles against the women\'s targets', s.profile.sex === 'f' && Object.keys(s.game.achievements).length > before && s.game.unseen.length > 0, [before, Object.keys(s.game.achievements).length]);
  check('the new titles arrive sealed', s.game.unseen.includes('b275') && s.game.unseen.includes('o185'), s.game.unseen);
  await click('#p-titles'); await sleep(300);
  await clearSystem();
  await evalFn(`window.ARISE.state.game.unseen = []; window.ARISE.render()`); await sleep(200);
  const b275 = await txt('[data-ach="b275"]'), b315 = await txt('[data-ach="b315"]'), o185 = await txt('[data-ach="o185"]');
  check('women\'s bench rung: One Plate is 135 lb', /One Plate/.test(b275) && /Bench press 135 lb/.test(b275), b275);
  check('a locked women\'s rung shows progress toward its own target', /Heavy Hands/.test(b315) && /163 lb \/ 175 lb/.test(b315), b315);
  check('Strongwoman Press at 95 lb', /Strongwoman Press/.test(o185) && /Overhead press 95 lb/.test(o185), o185);
  check('women\'s emblems carry the women\'s numbers', /225/.test(await evalFn(`document.querySelector('[data-ach="b405"] .em svg').textContent`)) && /\.75x8/.test(await evalFn(`document.querySelector('[data-ach="f_bbw10"] .em svg').textContent`)));
  check('titles not tied to weight are unchanged', /Regular/.test(await txt('[data-ach="w10"]')) && /Finish 10 workouts/.test(await txt('[data-ach="w10"]')));
  const uniq = await evalFn(`new Set([...document.querySelectorAll('.tcard .em svg')].map(e => e.outerHTML.replace(' locked', ''))).size`);
  check('every women\'s title has its own emblem on screen', uniq === (await evalFn('window.ARISE_TITLES.TITLES.length')), uniq);
  await evalFn(`document.querySelector('[data-ach="b135"]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -70)`); await sleep(200);
  await shot(P('women-1-bench.png'));
  await evalFn(`document.querySelector('[data-ach="pu1"]').scrollIntoView({ block: 'start' }); window.scrollBy(0, -70)`); await sleep(200);
  await shot(P('women-2-bodyweight.png'));
  let ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('women\'s Titles screen fits at 360px', ov.sw <= ov.w, ov);
  await click('#t-back');
  // kg
  await click('#p-units button[data-v="kg"]'); await sleep(200); await click('#p-titles'); await sleep(250);
  check('women\'s conditions convert to kg', /Bench press 80 kg/.test(await txt('[data-ach="b315"]')), await txt('[data-ach="b315"]'));
  await click('#t-back'); await click('#p-units button[data-v="lb"]'); await sleep(200);

  // --- backup reminder: 21 workouts and never backed up
  await click('[data-tab="workout"]'); await sleep(200);
  check('Home asks for a backup', (await has('#backup-card')) && /Your log lives only on this phone/.test(await txt('#backup-card')) && /21 workouts/.test(await txt('#backup-card')), await txt('#backup-card'));
  await evalFn(`document.querySelector('#backup-card').scrollIntoView({block:'center'})`); await sleep(150);
  await shot(P('women-3-backup.png'));
  await click('#backup-later'); await sleep(200);
  check('Later hides it for two weeks', !(await has('#backup-card')) && (await st()).hints.backupLater > Date.now() + 13 * 86400000);
  await evalFn(`window.ARISE.state.hints.backupLater = 0; window.ARISE.render()`); await sleep(150);
  await click('#backup-now'); await sleep(300);
  check('Export backup saves the date and the card goes away', !(await has('#backup-card')) && Math.abs((await st()).hints.lastExport - Date.now()) < 60000 && /Backup saved/.test(await txt('#toast')));

  // --- iPhone: no card on Android/desktop, a card on iPhone Safari
  check('no iPhone card on other phones', !(await has('#ios-card-home')));
  await S('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
  await evalFn(`window.dispatchEvent(new Event('pagehide'))`);
  await nav(B + '#workout'); await sleep(300);
  check('iPhone Safari shows how to add Arise to the Home Screen', (await has('#ios-card-home')) && /Add to Home Screen/.test(await txt('#ios-card-home')) && /erase your log/.test(await txt('#ios-card-home')));
  await shot(P('women-4-iphone.png'));
  await click('#ios-later'); await sleep(200);
  check('Later hides it on Home', !(await has('#ios-card-home')));
  await click('[data-tab="profile"]'); await sleep(200);
  check('Profile keeps the steps', await has('#ios-card-profile'));
  ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('no horizontal overflow', ov.sw <= ov.w, ov);
  done('women and safety');
};
