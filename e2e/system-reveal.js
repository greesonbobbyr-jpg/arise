// The System: titles arrive sealed, reveal on tap, persist as seen; Profile grid seals/replays; summary does not spoil.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html?demo&sealed#workout" "" 390 e2e/system-reveal.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, sleep } = ctx;
  const { check, click, type, txt, st, dismissNotify, sysOpen, clearSystem, done, SHOTS } = require('./lib')(ctx);
  const tap = async () => { await evalFn(`document.querySelector('.sys').click()`); };
  const stage = () => evalFn(`(document.querySelector('.sys')||{dataset:{}}).dataset.stage || ''`);
  const P = n => path.join(SHOTS, n);

  // --- home banner announces sealed titles without naming them
  let s = await st();
  check('demo starts with 2 sealed titles', s.game.unseen.length === 2, s.game.unseen);
  const banner = await txt('#sys-open');
  check('home shows a System banner', /System notification/.test(banner) && /2 new titles/.test(banner), banner);
  check('banner does not name the titles', !/Awakened|Regular/.test(banner));
  await shot(P('sys-0-home-banner.png'));

  // --- sealed window
  await click('#sys-open'); await sleep(1300);
  check('System window opens sealed', (await sysOpen()) && (await stage()) === 'sealed');
  const sealedTxt = await txt('.sys');
  check('sealed window hides the title', /NOTIFICATION/.test(sealedTxt) && /You have acquired a new title/.test(sealedTxt) && !/Awakened/.test(sealedTxt), sealedTxt.slice(0, 90));
  check('reveal button + 1 / 2 counter', /REVEAL/.test(await txt('.sys-btn')) && /1 \/ 2/.test(await txt('.sys-count')));
  await shot(P('sys-1-sealed.png'));

  // --- the reveal
  await tap(); await sleep(90);
  await shot(P('sys-2-burst.png'));
  check('effects are running', (await evalFn('window.ARISE_SYSTEM.particles')) > 40, await evalFn('window.ARISE_SYSTEM.particles'));
  await sleep(330); await shot(P('sys-3-mid.png'));
  await sleep(1100);
  check('stage is revealed', (await stage()) === 'revealed');
  check('title name decoded', (await txt('.sys-name')) === 'Awakened', await txt('.sys-name'));
  const rev = await txt('.sys');
  check('header, grade, condition and flavor shown', /TITLE ACQUIRED/.test(rev) && /Common title/.test(rev) && /Finish your first workout/.test(rev) && /The System acknowledges you/.test(rev), rev.slice(0, 160));
  s = await st();
  check('revealed title is saved as seen immediately', !s.game.unseen.includes('first') && s.game.unseen.length === 1, s.game.unseen);
  await shot(P('sys-4-revealed.png'));

  // --- second title, then close
  await tap(); await sleep(900);
  check('next title arrives sealed', (await stage()) === 'sealed' && !/Regular/.test(await txt('.sys')));
  await tap(); await sleep(1500);
  check('second title revealed', (await txt('.sys-name')) === 'Regular' && /ACCEPT/.test(await txt('.sys-btn')), await txt('.sys-name'));
  await tap(); await sleep(500);
  check('window closes after the last accept', !(await sysOpen()));
  check('nothing left sealed, banner gone', (await st()).game.unseen.length === 0 && !(await evalFn(`!!document.querySelector('#sys-open')`)));

  // --- Profile grid: sealed card, replay, locked
  await evalFn(`(()=>{window.ARISE.state.game.unseen=['streak3'];})()`);
  await click('[data-tab="profile"]'); await sleep(200);
  const card = await txt('[data-ach="streak3"]');
  check('sealed card hides name and condition', /\?\?\?/.test(card) && /tap to reveal/.test(card) && !/Consistent|3-week/.test(card), card);
  await evalFn(`document.querySelector('[data-ach="streak3"]').scrollIntoView({block:'center'})`); await sleep(150);
  await shot(P('sys-5-profile-sealed.png'));
  await click('[data-ach="streak3"]'); await sleep(1200);
  check('tapping a sealed card opens it sealed', (await stage()) === 'sealed');
  await clearSystem();
  check('card now shows its name', /Consistent/.test(await txt('[data-ach="streak3"]')));
  await click('[data-ach="first"]'); await sleep(1700);
  check('tapping an earned title replays straight to the reveal', (await stage()) === 'revealed' && (await txt('.sys-name')) === 'Awakened');
  await clearSystem();
  await click('[data-ach="w100"]'); await sleep(200);
  check('locked title says what it needs and does not open', /Locked/.test(await txt('#toast')) && !(await sysOpen()), await txt('#toast'));

  // --- finishing a workout: summary teases, then the sealed window plays
  await click('[data-tab="workout"]'); await click('#start-empty');
  await click('#add-ex'); await sleep(300); await click('[data-pick="bb_bench"]'); await click('#padd'); await sleep(300);
  await type('[data-w="0:0"]', 205); await type('[data-r="0:0"]', 8); await click('[data-ck="0:0"]'); await sleep(300); await dismissNotify();
  await click('#finish'); await sleep(200); await click('#modal .acts button.primary'); await sleep(600);
  const sum = await txt('#modal');
  check('summary announces a sealed title', /System notification/.test(sum) && /Sealed until you open it/.test(sum), sum.slice(-140));
  check('summary does not spoil First Blood', !/First Blood/.test(sum));
  await shot(P('sys-6-summary.png'));
  await click('#modal .acts button.primary'); await sleep(1300);
  check('sealed window plays right after the summary', (await sysOpen()) && (await stage()) === 'sealed');
  await tap(); await sleep(1600);
  check('First Blood revealed', (await txt('.sys-name')) === 'First Blood', await txt('.sys-name'));
  await clearSystem();

  // --- legendary grade, for the look
  await evalFn(`(window.ARISE_SYSTEM.reveal([{id:'tier_elite',name:'Elite',desc:'Reach Elite on any lift',flavor:'The System has no further standard for you.',rarity:'legendary',icon:'crown'}],{sealed:false}), 1)`);
  await sleep(420); await shot(P('sys-7-legendary-burst.png'));
  await sleep(1500); await shot(P('sys-8-legendary.png'));
  check('legendary title renders', (await txt('.sys-name')) === 'Elite' && /Legendary title/.test(await txt('.sys')));
  await clearSystem();
  const ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('no horizontal overflow', ov.sw <= ov.w, ov);
  done('system reveal');
};
