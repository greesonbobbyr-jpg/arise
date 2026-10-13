// One-off patch: (1) the drag ghost must not share the "ghost" class used by secondary buttons,
// (2) ending a repeat also drops the skip markers that only existed to cancel it,
// (3) applying a weekly pattern replaces everything planned after today.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = h.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 120)); h = h.replace(a, () => b); };

R(`.ghost{position:fixed;z-index:90;pointer-events:none;`, `.dragghost{position:fixed;z-index:90;pointer-events:none;`);
R(`d.ghost.className = 'ghost';`, `d.ghost.className = 'dragghost';`);

R(`  for (const r of state.plan.repeats) if (r.dow === dow && (!r.until || r.until >= key)) r.until = C.addDays(key, -1);
  state.plan.repeats = state.plan.repeats.filter(r => !r.until || r.until >= r.from);`,
  `  for (const r of state.plan.repeats) if (r.dow === dow && (!r.until || r.until >= key)) r.until = C.addDays(key, -1);
  state.plan.repeats = state.plan.repeats.filter(r => !r.until || r.until >= r.from);
  for (const k of Object.keys(state.plan.days)) if (state.plan.days[k] === '' && k >= key && C.dowOf(k) === dow) delete state.plan.days[k];   // skips that only cancelled that repeat`);

R(`'<p class="note" style="margin:10px 0 14px">Repeats every week from today until you change it. Days you set by hand stay as they are.</p><button class="btn primary full" id="fl-apply">Apply weekly pattern</button>'`,
  `'<p class="note" style="margin:10px 0 14px">Repeats every week from today until you change it. It replaces everything planned after today.</p><button class="btn primary full" id="fl-apply">Apply weekly pattern</button>'`);
R(`n + ' training day' + (n === 1 ? '' : 's') + ' a week, repeating from today. This replaces your current weekly repeats.', 'Apply'))) return;
        for (let d = 0; d < 7; d++) {`,
  `n + ' training day' + (n === 1 ? '' : 's') + ' a week, repeating from today. This replaces everything planned after today.', 'Apply'))) return;
        for (const k of Object.keys(state.plan.days)) if (k > tk) delete state.plan.days[k];
        for (let d = 0; d < 7; d++) {`);
fs.writeFileSync(FILE, h);
console.log('patched ok');
