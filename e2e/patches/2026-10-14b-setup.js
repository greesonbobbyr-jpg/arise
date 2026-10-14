// Patch: first-run setup ("Awakening"): name, choose your character (male/female), stats, then an ARISE moment.
// run once: node e2e/patches/2026-10-14b-setup.js
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected one match, found ' + n + ': ' + a.slice(0, 90)); s = s.split(a).join(b); };

// ---- CSS
R('.bm-legend{display:flex;', `/* first-run setup */
body.setup-on .tabs{display:none}
.setup{position:relative;margin-top:6px;padding:22px 18px 18px;border:1px solid var(--cy-line);border-radius:4px;overflow:hidden;
  background:linear-gradient(180deg,rgba(62,230,255,.07),rgba(62,230,255,.015));box-shadow:0 0 40px -14px rgba(62,230,255,.55),inset 0 0 30px -12px rgba(62,230,255,.3);animation:suin .45s ease-out}
.setup::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(62,230,255,.03) 0 1px,transparent 1px 3px)}
.setup > *{position:relative}
@keyframes suin{from{opacity:0;transform:scaleY(.96)}}
.su-head{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.su-bang{width:26px;height:26px;flex:none;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--cy);color:var(--cy);font-family:var(--f-num);font-weight:700;box-shadow:0 0 10px -2px var(--cy)}
.su-sys{font-family:var(--f-num);font-weight:700;letter-spacing:.3em;font-size:13px}
.su-dots{margin-left:auto;display:flex;gap:6px}
.su-dots i{width:18px;height:3px;border-radius:2px;background:var(--s3)}
.su-dots i.done{background:var(--cy-line)}
.su-dots i.on{background:var(--cy);box-shadow:0 0 8px var(--cy)}
.su-h{font-family:var(--f-num);font-size:21px;line-height:1.25;letter-spacing:.06em;text-transform:uppercase;margin:2px 0 8px;color:#F2FDFF;text-shadow:0 0 18px rgba(62,230,255,.45)}
.su-p{color:var(--tx2);line-height:1.5;margin:0 0 16px}
.su-go{width:100%;margin-top:6px;font-family:var(--f-num);letter-spacing:.2em}
.su-go[disabled]{opacity:.35;box-shadow:none}
.su-back{display:block;margin:8px auto 0;min-height:44px;padding:0 14px;color:var(--tx2);font-size:14px}
.su-chars{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:4px 0 12px}
.su-pick{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px 10px;border-radius:12px;background:var(--s1);box-shadow:inset 0 0 0 1px var(--cy-line);overflow:hidden;transition:box-shadow var(--t),transform var(--t)}
.su-pick .char{width:80%}
.su-pick b{font-family:var(--f-num);letter-spacing:.24em;text-transform:uppercase;font-size:13px;color:var(--tx2);margin-top:2px}
.su-pick.on{box-shadow:inset 0 0 0 2px var(--gr),0 0 26px -6px var(--gr)}
.su-pick.on b{color:var(--gr)}
.su-pick:active{transform:scale(.98)}
.su-note{font-size:var(--fs-s);color:var(--tx2);line-height:1.45;margin:0 2px 8px}
.su-err{min-height:20px;color:var(--rd);font-size:var(--fs-s);margin:0 2px 4px}
.arise-fx{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 55%,rgba(91,59,255,.3),rgba(5,6,10,.97) 62%);animation:arin .35s ease-out}
.arise-fx .char{width:46vw;max-width:220px;animation:arup 1.9s cubic-bezier(.2,.8,.2,1) both}
.arise-fx .ar-t{margin-top:4px;font-family:var(--f-num);font-weight:800;font-size:42px;letter-spacing:.42em;padding-left:.42em;color:#F4F0FF;text-shadow:0 0 24px #7B5CFF,0 0 60px #5B3BFF;animation:art 1.9s ease-out both}
.arise-fx .ar-s{margin-top:10px;font-family:var(--f-num);font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#9C8CFF}
.arise-fx.out{animation:arout .4s ease-in forwards}
@keyframes arin{from{opacity:0}}
@keyframes arout{to{opacity:0}}
@keyframes arup{0%{opacity:0;transform:translateY(30px) scale(.9)}40%{opacity:1}100%{transform:none}}
@keyframes art{0%{opacity:0;letter-spacing:1em}50%{opacity:1}100%{letter-spacing:.42em}}
@media (prefers-reduced-motion:reduce){.setup,.arise-fx,.arise-fx .char,.arise-fx .ar-t{animation:none}}
.bm-legend{display:flex;`);

// ---- state: setupDone, and existing logs count as set up
R("name: 'Hunter', keepAwake: true, notify: 'unasked', sound: true },", "name: 'Hunter', keepAwake: true, notify: 'unasked', sound: true, setupDone: false },");
R("      normPlan();\n", "      normPlan();\n      // anyone who already has a log or routines was here before the setup screen existed\n      if (!state.profile.setupDone && (state.sessions.length || state.routines.length || state.active)) state.profile.setupDone = true;\n");

// ---- render: the setup screen replaces the app until it is finished
R("function render() {\n", "function render() {\n  if (!P().setupDone) { document.body.classList.add('setup-on'); $('#screen').innerHTML = viewSetup(); bindSetup(); return; }\n  document.body.classList.remove('setup-on');\n");

// ---- the setup screen itself, placed before HOME
R('// ---------- HOME (no active workout) ----------', `// ---------- FIRST-RUN SETUP ("Awakening") ----------
const su = { step: 0, name: '', sex: null, bw: '', age: '', week: 3, units: 'lb', err: '' };
const SU_LIT = { chest: 6, delts: 6, abs: 4, quads: 7, biceps: 4 };
function viewSetup() {
  const dots = [0, 1, 2].map(i => '<i class="' + (i === su.step ? 'on' : i < su.step ? 'done' : '') + '"></i>').join('');
  let h = '<div class="setup"><div class="su-head"><span class="su-bang">!</span><span class="su-sys">SYSTEM</span><span class="su-dots" aria-label="Step ' + (su.step + 1) + ' of 3">' + dots + '</span></div>';
  if (su.step === 0) {
    h += '<h1 class="su-h">You have been chosen.</h1><p class="su-p">The System records every set you lift and shows you how strong you are becoming. Rise through the ranks, from E to S.</p>' +
      '<label class="field"><span>What should the System call you?</span><input class="in" id="su-name" maxlength="24" placeholder="Hunter" autocomplete="nickname" value="' + esc(su.name) + '"></label>' +
      '<button class="btn primary su-go" id="su-next">[ CONTINUE ]</button>';
  } else if (su.step === 1) {
    const pick = (sx, label) => '<button class="su-pick' + (su.sex === sx ? ' on' : '') + '" data-su-sex="' + sx + '" aria-pressed="' + (su.sex === sx) + '">' +
      charSVG(sx, 'front', { lit: SU_LIT, rank: su.sex === sx ? 'B' : 'E', id: 'su-' + sx }) + '<b>' + label + '</b></button>';
    h += '<h1 class="su-h">Choose your character</h1><div class="su-chars">' + pick('m', 'Male') + pick('f', 'Female') + '</div>' +
      '<p class="su-note">Sets your character and the strength standards you are compared with. You can change it later in Profile.</p>' +
      '<button class="btn primary su-go" id="su-next"' + (su.sex ? '' : ' disabled') + '>[ CONTINUE ]</button><button class="su-back" id="su-back">Back</button>';
  } else {
    const ph = su.units === 'kg' ? (su.sex === 'f' ? '64' : '82') : (su.sex === 'f' ? '140' : '180');
    h += '<h1 class="su-h">Your stats</h1><p class="su-p">Used to compare your lifts with lifters your size and age.</p>' +
      '<div class="row" style="gap:12px;align-items:flex-end"><label class="field grow"><span>Bodyweight (' + su.units + ')</span><input class="in num" id="su-bw" type="number" inputmode="decimal" step="any" placeholder="' + ph + '" value="' + esc(su.bw) + '"></label>' +
      '<div class="field" style="width:118px"><div class="seg" id="su-units"><button data-v="lb" class="' + (su.units === 'lb' ? 'on' : '') + '">lb</button><button data-v="kg" class="' + (su.units === 'kg' ? 'on' : '') + '">kg</button></div></div></div>' +
      '<label class="field"><span>Age</span><input class="in num" id="su-age" type="number" inputmode="numeric" placeholder="30" value="' + esc(su.age) + '"></label>' +
      '<div class="field"><label>Workouts per week</label><div class="seg" id="su-week">' + [2, 3, 4, 5, 6].map(n => '<button data-v="' + n + '" class="' + (su.week === n ? 'on' : '') + '">' + n + '</button>').join('') + '</div></div>' +
      '<div class="su-err" id="su-err" role="alert">' + esc(su.err) + '</div>' +
      '<button class="btn primary su-go" id="su-finish">[ ARISE ]</button><button class="su-back" id="su-back">Back</button>';
  }
  return h + '</div>';
}
function bindSetup() {
  const val = (id, k) => { const el = $(id); if (el) el.oninput = e => { su[k] = e.target.value; }; };
  val('#su-name', 'name'); val('#su-bw', 'bw'); val('#su-age', 'age');
  const nm = $('#su-name'); if (nm) nm.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#su-next').click(); } };
  $$('[data-su-sex]').forEach(b => b.onclick = () => { su.sex = b.dataset.suSex; render(); });
  $$('#su-units button').forEach(b => b.onclick = () => {   // switching units converts what was typed
    const to = b.dataset.v, v = parseFloat(su.bw);
    if (to !== su.units && v > 0) su.bw = String(Math.round((to === 'kg' ? v * KG : v / KG) * 10) / 10);
    su.units = to; render();
  });
  $$('#su-week button').forEach(b => b.onclick = () => { su.week = +b.dataset.v; render(); });
  const nx = $('#su-next'); if (nx) nx.onclick = () => { if (su.step === 1 && !su.sex) return; su.step++; su.err = ''; render(); window.scrollTo(0, 0); };
  const bk = $('#su-back'); if (bk) bk.onclick = () => { su.step = Math.max(0, su.step - 1); su.err = ''; render(); };
  const fin = $('#su-finish'); if (fin) fin.onclick = finishSetup;
}
async function finishSetup() {
  const bw = parseFloat(su.bw), age = parseInt(su.age, 10), lb = su.units === 'kg' ? bw / KG : bw;
  if (!(lb >= 70 && lb <= 500)) { su.err = 'Enter your bodyweight (' + (su.units === 'kg' ? '32 to 227 kg' : '70 to 500 lb') + ').'; render(); return; }
  if (!(age >= 13 && age <= 100)) { su.err = 'Enter your age (13 to 100).'; render(); return; }
  Object.assign(P(), { name: su.name.trim().slice(0, 24) || 'Hunter', sex: su.sex === 'f' ? 'f' : 'm', units: su.units, bodyweight: Math.round(lb * 10) / 10, age, weeklyTarget: su.week, setupDone: true });
  save(); invalidate();
  await ariseMoment(P().sex);
  tab = 'workout'; sub = null; render(); window.scrollTo(0, 0);
}
// the character powers up: every muscle lit, full aura, ARISE
function ariseMoment(sex) {
  return new Promise(res => {
    const all = {}; ['chest', 'delts', 'abs', 'obliques', 'quads', 'adductors', 'glutes', 'biceps', 'triceps', 'forearms', 'calves', 'traps'].forEach(k => all[k] = 8);
    const d = document.createElement('div'); d.className = 'arise-fx'; d.setAttribute('role', 'status');
    d.innerHTML = charSVG(sex, 'front', { lit: all, rank: 'S', id: 'ar' }) + '<div class="ar-t">ARISE</div><div class="ar-s">The System has registered you</div>';
    document.body.appendChild(d);
    try { if (window.ARISE_SFX) window.ARISE_SFX.play('rankup'); } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([40, 50, 40, 60, 160]); } catch (e) {}
    let done = false; const end = () => { if (done) return; done = true; d.classList.add('out'); setTimeout(() => { d.remove(); res(); }, 380); };
    d.onclick = end; setTimeout(end, matchMedia('(prefers-reduced-motion: reduce)').matches ? 900 : 2300);
  });
}

// ---------- HOME (no active workout) ----------`);

// ---- demo data counts as set up; Profile names what the switch does
R("state.game.xp = 2600; state.profile.name = 'Sung';", "state.game.xp = 2600; state.profile.name = 'Sung'; state.profile.setupDone = true;");
R('<label>Sex (for standards)</label>', '<label>Character · standards</label>');
fs.writeFileSync(F, s);
console.log('setup patch applied');
