// One-off patch: waitChoice re-arms itself with a named handler (arrow functions have no arguments.callee).
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'system.js');
let s = fs.readFileSync(FILE, 'utf8');
const a = `  function waitChoice(delay) { const t0 = performance.now(); return new Promise(res => { pendingChoice = v => { if (performance.now() - t0 < delay) { pendingChoice = arguments.callee; return; } res(v); }; }); }`;
const b = `  function waitChoice(delay) { const t0 = performance.now(); return new Promise(res => { const h = v => { if (performance.now() - t0 < delay) { pendingChoice = h; return; } res(v); }; pendingChoice = h; }); }`;
if (s.split(a).length - 1 !== 1) throw new Error('pattern not found');
fs.writeFileSync(FILE, s.split(a).join(b));
console.log('patched ok');
