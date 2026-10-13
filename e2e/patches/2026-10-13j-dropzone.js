// One-off patch: the remove zone sits above the tab bar, clear of the toast that confirms the previous move.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const a = `.dropzone{position:fixed;left:12px;right:12px;top:calc(var(--sat) + 10px);height:52px;border-radius:12px;background:#2A1416;color:var(--rd);display:none;align-items:center;justify-content:center;font-weight:700;z-index:45;`;
const b = `.dropzone{position:fixed;left:12px;right:12px;bottom:calc(var(--tabs) + var(--sab) + 10px);height:56px;border-radius:12px;background:#2A1416;color:var(--rd);display:none;align-items:center;justify-content:center;font-weight:700;z-index:46;`;
if (h.split(a).length - 1 !== 1) throw new Error('pattern not found');
h = h.split(a).join(b);
fs.writeFileSync(FILE, h);
console.log('patched ok');
