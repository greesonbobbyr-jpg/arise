// One-off patch (kept for the record): program Replace flow, top-of-range cue, one-tap weight bump.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = h.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 120)); h = h.replace(a, () => b); };  // function form: "$" and "h = h.replace(a, b); };" in b stay literal

R('.exsub .ld{color:var(--tx3)}',
  '.exsub .ld{color:var(--tx3)}\n.exsub .tgt.up{background:var(--gr-tint);color:var(--gr);border:0;cursor:pointer;height:32px;padding:0 12px}\n.exsub .tgt.up:active{transform:scale(.97)}');

// Programs: "Update" when you already have its routines; Replace rewrites them in place (same id keeps history links)
R(`<button class="btn ghost sm" data-program="' + esc(p.id) + '">Add</button>`,
  `<button class="btn ghost sm" data-program="' + esc(p.id) + '">' + (p.routines.every(r => state.routines.some(x => x.name === r.name)) ? 'Update' : 'Add') + '</button>`);
R(`  const existing = p.routines.filter(r => state.routines.some(x => x.name === r.name));
  if (!(await confirmDlg('Add ' + p.name + '?', p.routines.map(r => r.name).join(', ') + ' will be added as routines you can edit.' + (existing.length ? ' You already have ' + existing.map(r => r.name).join(', ') + '; those will be added as copies.' : ''), 'Add ' + p.routines.length + ' routines'))) return;
  for (const r of p.routines) state.routines.push({ id: uid(), name: r.name, items: r.items.map(([exId, sets, reps, repsMax, restSec]) => ({ exId, sets, reps, repsMax, restSec })) });
  save(); toast(p.routines.length + ' routines added'); render();`,
  `  const existing = p.routines.filter(r => state.routines.some(x => x.name === r.name));
  const items = r => r.items.map(([exId, sets, reps, repsMax, restSec]) => ({ exId, sets, reps, repsMax, restSec }));
  let mode = 'add';
  if (existing.length) {
    mode = await modal({ title: 'Update ' + p.name + '?', body: 'You already have ' + existing.map(r => r.name).join(', ') + '. Replace swaps in the latest exercises, sets, rep ranges and rest times and keeps your workout history. Anything you edited in those routines is overwritten.',
      buttons: [{ label: 'Cancel', value: null }, { label: 'Add copies', value: 'add' }, { label: 'Replace', value: 'replace', primary: true }] });
    if (!mode) return;
  } else if (!(await confirmDlg('Add ' + p.name + '?', p.routines.map(r => r.name).join(', ') + ' will be added as routines you can edit.', 'Add ' + p.routines.length + ' routines'))) return;
  let replaced = 0;
  for (const r of p.routines) {
    const cur = mode === 'replace' && state.routines.find(x => x.name === r.name);
    if (cur) { cur.items = items(r); replaced++; } else state.routines.push({ id: uid(), name: r.name, items: items(r) });
  }
  save(); toast(replaced ? replaced + ' routines updated' : p.routines.length + ' routines added'); render();`);

// Top of range = every working set reached the top rep of the target range
R(`function repRange(t) {`, `function topOfRange(sets, t) {
  if (!t || !t.repsMax) return false;
  const w = sets.filter(s => !s.warmup && +s.r > 0);
  return w.length >= (t.sets || 1) && w.every(s => +s.r >= t.repsMax);
}
function repRange(t) {`);

// next session after hitting the top: offer the weight bump
R(`  if (reps) entry.target = { sets: n, reps, repsMax: ranged ? repsMax : undefined };`,
  `  if (reps) entry.target = { sets: n, reps, repsMax: ranged ? repsMax : undefined };
  if (ranged && prev && topOfRange(prev.sets, entry.target)) {
    const from = Math.max(...prev.sets.filter(s => !s.warmup).map(s => +s.w || 0));
    entry.bump = { from, to: C.round5(from + C.loadStep(ex)) };
  }`);
R(`    if (rr || hint) html += '<div class="exsub">' + (rr ? '<span class="tgt">' + tgt.sets + ' × ' + rr + ' reps</span>' : '') + (hint ? '<span class="ld">' + hint + '</span>' : '') + '</div>';`,
  `    const bump = e.bump && !e.bumped ? '<button class="tgt up" data-bump="' + ei + '">Top of range last time · go to ' + fw(e.bump.to) + ' ' + wHead(ex) + '</button>' : '';
    if (rr || hint || bump) html += '<div class="exsub">' + (rr ? '<span class="tgt">' + tgt.sets + ' × ' + rr + ' reps</span>' : '') + (hint ? '<span class="ld">' + hint + '</span>' : '') + bump + '</div>';`);

// live cue during the workout
R(`  if (rough) out += '<span class="dim">est. rough (&gt;12 reps)</span>';
  return out;`,
  `  if (rough) out += '<span class="dim">est. rough (&gt;12 reps)</span>';
  if (topOfRange(done, entryTarget(e))) out += '<span class="badge pr">Top of range</span><span class="gr">Add weight next workout</span>';
  return out;`);

// tap the bump chip: load the new weight into every open working set, clear reps so the range shows
R(`      const ad = e.target.closest('[data-addset]'); if (ad) {`,
  `      const bp = e.target.closest('[data-bump]'); if (bp) {
        const en = state.active.entries[+bp.dataset.bump];
        for (const s of en.sets) if (!s.done && !s.warmup) { s.w = en.bump.to; s.r = 0; }
        en.bumped = true; save(); render(); toast('Loaded ' + fw(en.bump.to) + ' ' + wHead(exById[en.exId]) + '. Expect a few fewer reps.'); return;
      }
      const ad = e.target.closest('[data-addset]'); if (ad) {`);

R(`const APP_VERSION = '1.4.0';`, `const APP_VERSION = '1.5.0';`);
fs.writeFileSync(FILE, h);
console.log('patched ok');
