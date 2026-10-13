// One-off patch: the tier estimate and its "How this is measured" link sit on separate lines (no dangling dot).
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'index.html');
let h = fs.readFileSync(FILE, 'utf8');
const a = `'<div class="dim">' + (est ? 'Est. stronger than ~' + est + '% of all ' + who + ' · ' : '') + '<button class="ilink" data-tierinfo="' + esc(ex.id) + '">How this is measured</button></div></div></div>';`;
const b = `(est ? '<div class="dim">Est. stronger than ~' + est + '% of all ' + who + '</div>' : '') + '<button class="ilink" data-tierinfo="' + esc(ex.id) + '">How this is measured</button></div></div>';`;
if (h.split(a).length - 1 !== 1) throw new Error('pattern not found');
h = h.split(a).join(b);
fs.writeFileSync(FILE, h);
console.log('patched ok');
