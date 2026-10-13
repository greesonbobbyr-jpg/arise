// Escapes the apostrophe in two footer strings written by 2026-10-13c (they sit inside single-quoted JS strings).
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const pairs = [
  ["same sex and bodyweight (Strength Level's published standards). That is not the general population.", "same sex and bodyweight (Strength Level\\'s published standards). That is not the general population."],
  ["same sex and bodyweight, using Strength Level's published standards. They are not", "same sex and bodyweight, using Strength Level\\'s published standards. They are not"],
];
for (const [a, b] of pairs) { const n = h.split(a).length - 1; if (n !== 1) throw new Error('expected 1, got ' + n + ': ' + a.slice(0, 60)); h = h.split(a).join(b); }
fs.writeFileSync(FILE, h);
console.log('apostrophes escaped');
