// One-off patch: calendar chip labels keep names of up to 7 characters whole ("Upper A", "Pretty").
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = h.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 120)); h = h.replace(a, () => b); };
R(`function shortName(name) { name = String(name || ''); if (name.length <= 6) return name; const w = name.split(/\\s+/); return w.length > 1 ? w[0].slice(0, 4) + ' ' + w[1][0] : name.slice(0, 6); }`,
  `function shortName(name) { name = String(name || ''); if (name.length <= 7) return name; const w = name.split(/\\s+/); return w.length > 1 ? w[0].slice(0, 5) + ' ' + w[1][0] : name.slice(0, 7); }`);
R(`.cal .chip2{display:block;font-size:10px;font-weight:700;line-height:1;padding:5px 2px;`, `.cal .chip2{display:block;font-size:10px;letter-spacing:-.02em;font-weight:700;line-height:1;padding:5px 1px;`);
fs.writeFileSync(FILE, h);
console.log('patched ok');
