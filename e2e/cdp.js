// Minimal Chrome DevTools Protocol driver for Arise's browser tests.
// usage: node e2e/cdp.js <url> <out.png|""> [width] [stepsFile]
// stepsFile exports async ({ evalFn, shot, nav, sleep, S, url }) => {}
// Needs Chrome at CHROME_PATH (defaults to the standard Windows install) and Node 22+ (global WebSocket).
// Exit codes: 0 finished, 1 the steps threw, 3 the browser stopped responding (infrastructure; safe to retry).
const { spawn } = require('child_process');
const fs = require('fs'), http = require('http'), path = require('path'), os = require('os');
const [,, url, out, widthArg, stepsFile] = process.argv;
const W = +widthArg || 390, H = 844;
const CH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CMD_TIMEOUT = 30000;                                   // one protocol call
const FLOW_TIMEOUT = +process.env.ARISE_FLOW_TIMEOUT || 240000;   // the whole flow
const port = 9300 + Math.floor(Math.random() * 500);
// A profile folder nobody has used before: a reused one would carry another run's localStorage into this test.
const prof = path.join(os.tmpdir(), 'arise-cdp-' + process.pid + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
try { // best-effort sweep of profiles left behind by earlier runs (Windows sometimes refuses the delete at exit)
  for (const d of fs.readdirSync(os.tmpdir())) if (/^arise-cdp-/.test(d)) { const p = path.join(os.tmpdir(), d); try { if (Date.now() - fs.statSync(p).mtimeMs > 10 * 60 * 1000) fs.rmSync(p, { recursive: true, force: true }); } catch (e) {} }
} catch (e) {}
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
const get = u => new Promise((res, rej) => http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const quit = (code) => { try { chrome.kill(); } catch (e) {} try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} process.exit(code); };
class Stalled extends Error {}
setTimeout(() => { console.error('BROWSER STALLED: flow exceeded ' + FLOW_TIMEOUT / 1000 + ' s'); quit(3); }, FLOW_TIMEOUT).unref();
(async () => {
  let info;
  for (let i = 0; i < 75 && !info; i++) { try { info = JSON.parse(await get(`http://127.0.0.1:${port}/json/version`)); } catch (e) { await sleep(200); } }
  if (!info) throw new Stalled('Chrome did not start');
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((r, rej) => { ws.onopen = r; ws.onerror = () => rej(new Stalled('could not connect to Chrome')); });
  let id = 0; const pending = {}; const events = [];
  ws.onmessage = m => { const o = JSON.parse(m.data); if (o.id && pending[o.id]) { pending[o.id].res(o); delete pending[o.id]; } else if (o.method) events.push(o); };
  ws.onclose = () => { for (const k in pending) { pending[k].rej(new Stalled('Chrome closed the connection')); delete pending[k]; } };
  const send = (method, params, sessionId) => new Promise((res, rej) => {
    const i = ++id, t = setTimeout(() => { delete pending[i]; rej(new Stalled('no reply to ' + method + ' in ' + CMD_TIMEOUT / 1000 + ' s')); }, CMD_TIMEOUT);
    pending[i] = { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } };
    ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId }));
  });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable'); await S('Network.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await S('Emulation.setTouchEmulationEnabled', { enabled: true });
  // wait for the page to finish loading and, for the app, for it to boot (window.ARISE) — not a fixed delay
  const nav = async (u) => {
    events.length = 0; await S('Page.navigate', { url: u });
    let up = false;
    for (let i = 0; i < 80 && !up; i++) {
      await sleep(250);
      const r = await S('Runtime.evaluate', { expression: "document.readyState === 'complete' && (!!window.ARISE || !document.querySelector('#app'))", returnByValue: true });
      up = !!(r.result && r.result.result && r.result.result.value === true);
    }
    if (!up) console.log('  FAIL the app did not start at ' + u);   // a check on a page that never booted proves nothing
    await sleep(500);
  };
  const evalFn = async (js) => {
    const r = await S('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description || r.result.exceptionDetails.text));
    return r.result.result.value;
  };
  const shot = async (file) => { const r = await S('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.result.data, 'base64')); };
  await nav(url);
  if (stepsFile) await require(path.resolve(stepsFile))({ evalFn, shot, nav, sleep, out, S, url });
  if (out) await shot(out);
  const errs = [];
  for (const e of events) if (e.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description || e.params.exceptionDetails.text));
  for (const e of events) if (e.method === 'Runtime.consoleAPICalled' && (e.params.type === 'error' || e.params.type === 'warning')) errs.push(e.params.type + ': ' + e.params.args.map(a => a.value || a.description).join(' '));
  // files that did not arrive: a script that fails to load shows up later as a confusing "undefined" error, so name it here
  const reqUrl = {}; for (const e of events) if (e.method === 'Network.requestWillBeSent') reqUrl[e.params.requestId] = e.params.request.url;
  for (const e of events) if (e.method === 'Network.loadingFailed' && !e.params.canceled) errs.push('failed to load: ' + (reqUrl[e.params.requestId] || '?') + ' (' + e.params.errorText + ')');
  for (const e of events) if (e.method === 'Network.responseReceived' && e.params.response.status >= 400) errs.push('HTTP ' + e.params.response.status + ': ' + e.params.response.url);
  console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'no console errors');
  try { ws.close(); } catch (e) {}
  quit(0);
})().catch(e => {
  if (e instanceof Stalled) { console.error('BROWSER STALLED: ' + e.message); quit(3); }
  console.error(e); quit(1);
});
