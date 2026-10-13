// Prints a summary of the titles catalog: counts by grade and category, and any duplicate ids or emblems.
// usage: node tools/titles-report.js
const T = require('../titles.js').ARISE_TITLES;
const by = (f) => T.TITLES.reduce((m, t) => (m[f(t)] = (m[f(t)] || 0) + 1, m), {});
console.log('titles:', T.TITLES.length);
console.log('by grade:', JSON.stringify(by(t => t.grade)));
console.log('by category:', T.CATS.map(([id, name]) => name + ' ' + (by(t => t.cat)[id] || 0)).join(' · '));
const dup = (f, label) => { const seen = {}, d = []; for (const t of T.TITLES) { const k = f(t); if (seen[k]) d.push(k + ' (' + seen[k] + ', ' + t.id + ')'); seen[k] = t.id; } console.log('duplicate ' + label + ':', d.length ? d.join('; ') : 'none'); };
dup(t => t.id, 'ids'); dup(t => t.name, 'names'); dup(t => t.grade + '|' + t.glyph + '|' + t.mark, 'emblems');
console.log('unknown categories:', T.TITLES.filter(t => !T.CATS.some(c => c[0] === t.cat)).map(t => t.id).join(',') || 'none');
console.log('glyphs used:', [...new Set(T.TITLES.map(t => t.glyph))].sort().join(', '));
console.log('longest mark:', T.TITLES.reduce((a, t) => t.mark.length > a.length ? t.mark : a, ''), '| longest name:', T.TITLES.reduce((a, t) => t.name.length > a.length ? t.name : a, ''));
const s0 = T.stats({ sessions: [], exById: {}, analyses: {}, bodyweight: 180 });
console.log('earned with an empty log:', T.earned(s0).join(',') || 'none');
