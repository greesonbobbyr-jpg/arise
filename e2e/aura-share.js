// The shadow aura as a reward (every muscle region trained in a week), and inviting friends by link and QR code.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html?demo#progress" "" 390 e2e/aura-share.js
const path = require('path'), fs = require('fs');
module.exports = async (ctx) => {
  const { evalFn, shot, sleep } = ctx;
  const { check, click, type, txt, has, st, dismissNotify, clearSystem, done, SHOTS } = require('./lib')(ctx);
  const P = n => path.join(SHOTS, n);
  const auraCount = () => evalFn(`document.querySelectorAll('.bodymap .aura').length`);

  // --- a normal week: no aura, and the app says what is missing
  check('demo week has no aura', (await auraCount()) === 0);
  const line = await txt('.bm-aura');
  check('progress line counts regions and names what is missing', /Shadow aura · \d+ \/ 16 trained this week/.test(line) && /Missing: .*Calves/.test(line), line);
  check('legend explains the reward', /Aura: train every muscle in a week/.test(await txt('.bm-legend')));

  // --- everything but calves this week, then a calf workout completes it
  await evalFn(`(() => {
    const st = window.ARISE.state, ent = (id) => ({ exId: id, sets: [{ w: 50, r: 10, warmup: false }] });
    st.sessions.push({ id: 'full-week', date: Date.now() - 86400000, endedAt: Date.now() - 86400000 + 3600000, name: 'Full body', entries: ['bb_bench', 'bb_ohp', 'bb_row', 'db_curl', 'mc_pushdown', 'mc_cable_crunch', 'bb_squat', 'bb_deadlift'].map(ent) });
    window.ARISE.render();
  })()`); await sleep(200);
  check('15 of 16, only calves missing', /15 \/ 16/.test(await txt('.bm-aura')) && /Missing: Calves$/.test(await txt('.bm-aura')), await txt('.bm-aura'));
  check('still no aura at 15 of 16', (await auraCount()) === 0);
  await evalFn(`document.querySelector('.bm-aura').scrollIntoView({block:'center'})`); await sleep(150);
  await shot(P('aura-1-missing.png'));

  const calfWorkout = async () => {
    await click('[data-tab="workout"]'); await click('#start-empty');
    await click('#add-ex'); await sleep(300); await click('[data-pick="mc_calf"]'); await click('#padd'); await sleep(300);
    await type('[data-w="0:0"]', 140); await type('[data-r="0:0"]', 12); await click('[data-ck="0:0"]'); await sleep(250); await dismissNotify();
    await click('#finish'); await sleep(200); await click('#modal .acts button.primary'); await sleep(500);
    await click('#modal .acts button.primary'); await sleep(400);   // close the summary
    await clearSystem();
  };
  await calfWorkout();
  let moment = false;
  for (let i = 0; i < 20 && !moment; i++) { moment = await evalFn(`!!document.querySelector('.arise-fx') && /AWAKENED/.test(document.querySelector('.arise-fx').textContent)`); if (!moment) await sleep(200); }
  check('the workout that completes the set plays the awakening', moment);
  if (moment) { await shot(P('aura-2-awakened.png')); check('it says why', /every muscle trained this week/.test(await txt('.arise-fx .ar-s'))); }
  for (let i = 0; i < 20 && (await has('.arise-fx')); i++) await sleep(250);
  await click('[data-tab="progress"]'); await sleep(300);
  check('aura on both views now', (await auraCount()) === 2);
  check('progress line celebrates it', /Shadow aura awakened/.test(await txt('.bm-aura')), await txt('.bm-aura'));
  await evalFn(`document.querySelector('.bodymap').scrollIntoView({block:'center'})`); await sleep(250);
  await shot(P('aura-3-unlocked.png'));
  // it plays once: another workout in the same week does not repeat it
  await calfWorkout(); await sleep(600);
  check('no second awakening while it is already on', !(await has('.arise-fx')));

  // --- invite: share sheet, clipboard fallback, QR code
  await click('[data-tab="profile"]'); await sleep(200);
  check('Profile has an invite card', /Invite a hunter/.test(await txt('.invite')) && (await has('#p-share')) && (await has('#p-qr')));
  await evalFn(`window.__shared = null; navigator.share = d => { window.__shared = d; return Promise.resolve(); }`);
  await click('#p-share'); await sleep(200);
  const shared = await evalFn('window.__shared');
  check('Share link hands the app link and a short invite to the share sheet', shared && shared.url === 'http://127.0.0.1:8765/' && /Arise/.test(shared.text) && shared.title === 'Arise', shared);
  await evalFn(`delete navigator.share; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); window.__copied = null; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copied = t; return Promise.resolve(); } }, configurable: true })`);
  await click('#p-share'); await sleep(250);
  check('without a share sheet the link is copied', (await evalFn('window.__copied')) === 'http://127.0.0.1:8765/' && /Link copied/.test(await txt('#toast')));
  await click('#p-qr'); await sleep(400);
  check('QR panel opens with the code, the link and how to use it', (await has('.qr-fx svg.qr')) && /127\.0\.0\.1:8765\//.test(await txt('.qr-url')) && /Point a phone camera here/.test(await txt('.qr-fx')));
  await shot(P('share-1-qr.png'));
  // decode the drawn QR with an independent reader (test-only)
  const jsqr = fs.readFileSync(path.join(__dirname, 'vendor', 'jsQR.js'), 'utf8');
  await evalFn(`(() => { const s = document.createElement('script'); s.textContent = ${JSON.stringify(jsqr)}; document.head.appendChild(s); })()`);
  const decoded = await evalFn(`(async () => {
    const svg = document.querySelector('.qr-fx svg.qr'), xml = new XMLSerializer().serializeToString(svg);
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = 400; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, 400, 400);
    const r = window.jsQR(g.getImageData(0, 0, 400, 400).data, 400, 400); return r ? r.data : null;
  })()`);
  check('the QR code decodes to the exact app link', decoded === 'http://127.0.0.1:8765/', decoded);
  await click('#qr-close'); await sleep(150);
  check('Close removes the panel', !(await has('.qr-fx')));
  const ov = await evalFn(`({w: innerWidth, sw: document.documentElement.scrollWidth})`);
  check('no horizontal overflow', ov.sw <= ov.w, ov);
  done('aura and share');
};
