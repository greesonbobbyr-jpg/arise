// Minimal Chrome DevTools Protocol driver for Arise's browser tests.
// usage: node e2e/cdp.js <url> <out.png|""> [width] [stepsFile]
// stepsFile exports async ({ evalFn, shot, nav, sleep, S, url }) => {}
// Needs Chrome at CHROME_PATH (defaults to the standard Windows install) and Node 22+ (global WebSocket).
const { spawn } = require('child_process');
const fs = require('fs'), http = require('http'), path = require('path'), os = require('os');
const [,, url, out, widthArg, stepsFile] = process.argv;
const W = +widthArg || 390, H = 844;
const CH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = path.join(os.tmpdir(), 'arise-cdp-' + port);
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
const get = u => new Promise((res, rej) => http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let info;
  for (let i = 0; i < 50; i++) { try { info = JSON.parse(await get(`http://127.0.0.1:${port}/json/version`)); break; } catch (e) { await sleep(200); } }
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = {}; const events = [];
  ws.onmessage = m => { const o = JSON.parse(m.data); if (o.id && pending[o.id]) { pending[o.id](o); delete pending[o.id]; } else if (o.method) events.push(o); };
  const send = (method, params, sessionId) => new Promise(res => { const i = ++id; pending[i] = res; ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId })); });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await S('Emulation.setTouchEmulationEnabled', { enabled: true });
  const nav = async (u) => { events.length = 0; await S('Page.navigate', { url: u }); await sleep(1500); };
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
  console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'no console errors');
  ws.close(); chrome.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
  process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
