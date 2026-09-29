// Shared helpers for step files.
const path = require('path'), fs = require('fs'), os = require('os');
const SHOTS = path.join(os.tmpdir(), 'arise-shots'); fs.mkdirSync(SHOTS, { recursive: true });
module.exports = ({ evalFn, sleep }) => {
  let fails = 0;
  const check = (name, ok, extra) => { console.log((ok ? '  ok   ' : '  FAIL ') + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); if (!ok) fails++; };
  const click = async (sel) => { const r = await evalFn(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return 'MISSING'; el.click(); return 'ok'})()`); if (r !== 'ok') throw new Error('click failed: ' + sel); await sleep(250); };
  const type = async (sel, v) => { await evalFn(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); el.value=${JSON.stringify(String(v))}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));})()`); await sleep(100); };
  const txt = sel => evalFn(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
  const st = () => evalFn('JSON.parse(JSON.stringify(window.ARISE.state))');
  const modalOpen = () => evalFn(`document.querySelector('#modalbg').classList.contains('on')`);
  // dismiss the one-time "buzz when rest is over?" prompt if it appeared
  const dismissNotify = async () => { if (await modalOpen() && /Buzz when rest/.test(await txt('#modal'))) { await click('#modal .acts button'); await sleep(200); } };
  const done = (label) => console.log(fails ? `\n${fails} ${label} CHECKS FAILED` : `\nall ${label} checks passed`);
  return { check, click, type, txt, st, modalOpen, dismissNotify, done, SHOTS, get fails() { return fails; } };
};
