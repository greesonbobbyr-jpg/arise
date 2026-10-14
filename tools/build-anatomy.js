// Builds anatomy.js (the male and female body figures) from MuscleMap's traced path data.
// usage:  npm pack @musclemap/assets@1.1.0   (in an empty folder), then extract it:  tar -xzf musclemap-assets-1.1.0.tgz
//         node tools/build-anatomy.js <extracted package folder>
// Source: https://github.com/Jsplice/MuscleMap (MIT). See THIRD_PARTY.md.
//
// - Male: copied unchanged from the current anatomy.js (the hand-placed nerve lines and the paths the app already shows).
//   A rebuild of the male from the package matches it except for two small knee pieces the first build skipped.
// - Female: the package's female front and back, converted the same way (coordinates rounded, one entry per muscle piece),
//   then given feminine proportions with a smooth reshape anchored on the figure's own muscles (narrower neck, shoulders
//   and waist, slimmer arms, softer chest, fuller hips and glutes). Nothing is redrawn by hand. WARP=0 turns it off.
// - Nerve lines for the female are carried over from the male: each point is pinned to its nearest muscle and placed
//   at the same spot on the matching female muscle; hands and feet continue the previous segment.
// - Every view also gets the geometry the character styling needs: eye line and head width (front), and the feet line.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'anatomy.js');
const pkg = process.argv[2];
if (!pkg) { console.error('usage: node tools/build-anatomy.js <extracted @musclemap/assets folder>'); process.exit(1); }
const WARP = process.env.WARP === undefined ? 1 : +process.env.WARP;

function loadDiagram(file) {   // the package's dist files are small ES modules exporting one diagram object
  const src = fs.readFileSync(file, 'utf8').replace(/^import .*$/mg, '').replace(/export const (\w+) =/g, 'out.$1 =').replace(/export \{[^}]*\};?/g, '').replace(/export default /g, 'out.default = ');
  const out = {}; new Function('out', src)(out);
  return Object.values(out).find(v => v && v.viewBox);
}
const GROUP = {
  TRAPEZIUS: ['traps', 'Traps'], CHEST: ['chest', 'Chest'], SHOULDERS_FRONT: ['delts', 'Front delts'], SHOULDERS_SIDE: ['delts', 'Side delts'],
  SHOULDERS_REAR: ['delts', 'Rear delts'], BICEPS: ['biceps', 'Biceps'], TRICEPS: ['triceps', 'Triceps'], FOREARMS: ['forearms', 'Forearms'],
  OBLIQUES: ['obliques', 'Obliques'], CORE: ['abs', 'Abs'], ABDUCTORS: ['glutes', 'Glute med / abductors'], QUADS: ['quads', 'Quads'],
  CALVES: ['calves', 'Calves'], ADDUCTORS: ['adductors', 'Adductors'], RHOMBOIDS: ['rhomboids', 'Rhomboids'], LATS: ['lats', 'Lats'],
  BACK_LOWER: ['erectors', 'Lower back'], GLUTES: ['glutes', 'Glutes'], HAMSTRINGS: ['hams', 'Hamstrings'],
};
const CX = 512;
const round = d => d.replace(/-?\d+(\.\d+)?/g, n => String(Math.round(+n)));
const nums = d => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
function bbox(ds) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const d of ds) { const n = nums(d); for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
const viewBoxOf = ds => { const b = bbox(ds); return [Math.round(b.x0) - 14, Math.round(b.y0) - 14, Math.round(b.x1) - Math.round(b.x0) + 28, Math.round(b.y1) - Math.round(b.y0) + 68].join(' '); };

// one view: outline and muscles, rounded; `slot` (surface id + occurrence) pairs the same piece across bodies
function convert(D) {
  const seen = {};
  const muscles = D.muscles.map(m => {
    const g = GROUP[m.group]; if (!g) throw new Error('unmapped muscle group ' + m.group);
    const id = m.id || m.group, k = (seen[id] = (seen[id] || 0) + 1);
    return { key: g[0], name: g[1], d: [round(m.d)], slot: id + '#' + k, box: bbox([m.d]) };
  });
  const outline = D.outline.map(o => round(o.d));
  return { viewBox: viewBoxOf(outline.concat(muscles.flatMap(m => m.d))), outline, muscles };
}

function carryNerves(maleNerves, M, F) {
  const bySlot = new Map(F.muscles.map(m => [m.slot, m]));
  return maleNerves.map(n => {
    const pts = n.pts.map(([x, y]) => {
      const onSpine = x === CX; let best = null, bd = 1e18;
      for (const m of M.muscles) { if (!bySlot.has(m.slot)) continue; if (!onSpine && (m.box.cx - CX) * (x - CX) < 0) continue; const d = (m.box.cx - x) ** 2 + (m.box.cy - y) ** 2; if (d < bd) { bd = d; best = m; } }
      const f = bySlot.get(best.slot), u = (x - best.box.x0) / best.box.w, v = (y - best.box.y0) / best.box.h;
      return [onSpine ? CX : Math.round(f.box.x0 + u * f.box.w), Math.round(f.box.y0 + v * f.box.h)];
    });
    const m = n.pts, k = pts.length;   // the end point (hand, foot) continues the previous segment, scaled to this body
    if (k >= 3) { const sm = Math.hypot(m[k - 2][0] - m[k - 3][0], m[k - 2][1] - m[k - 3][1]), sf = Math.hypot(pts[k - 2][0] - pts[k - 3][0], pts[k - 2][1] - pts[k - 3][1]), s = sm ? sf / sm : 1;
      pts[k - 1] = [Math.round(pts[k - 2][0] + (m[k - 1][0] - m[k - 2][0]) * s), Math.round(pts[k - 2][1] + (m[k - 1][1] - m[k - 2][1]) * s)]; }
    return { keys: n.keys, pts };
  });
}

// feminine proportions: Gaussian-weighted pulls and pushes, like a liquify brush, anchored on the female muscles
function reshape(V, view) {
  const by = slot => V.muscles.find(m => m.slot === slot), fields = [];
  const side = (l, r, f) => { for (const s of [l, r]) { const m = by(s); if (!m) throw new Error('reshape anchor missing: ' + s); f(m, Math.sign(m.box.cx - CX)); } };
  const squeeze = (x, y, amt, r, dir) => fields.push({ x, y, r, dx: -dir * amt, dy: 0 });
  const push = (x, y, amt, r, dir) => fields.push({ x, y, r, dx: dir * amt, dy: 0 });
  const bloat = (x, y, amt, r) => fields.push({ x, y, r, radial: amt });
  const pinch = (m, k, axisOnly) => fields.push({ x: m.box.cx, y: m.box.cy, r: Math.max(m.box.w, m.box.h) * 0.75, pinch: k, axisOnly });
  for (const m of V.muscles) if (['biceps', 'triceps', 'forearms'].includes(m.key)) pinch(m, 0.12 * WARP, true);   // slimmer arms
  const outlinePts = V.outline.flatMap(d => { const n = nums(d), p = []; for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]); return p; });
  const trapTop = Math.min(...V.muscles.filter(m => m.key === 'traps').map(m => m.box.y0)), ny = trapTop - 22;
  const neck = outlinePts.filter(p => Math.abs(p[1] - ny) < 8 && Math.abs(p[0] - CX) < 110).map(p => p[0]);
  if (neck.length) for (const x of [Math.min(...neck), Math.max(...neck)]) squeeze(x, ny, 11 * WARP, 30, Math.sign(x - CX));   // slimmer neck
  if (view === 'front') {
    side('SHOULDER_SIDE_LEFT#1', 'SHOULDER_SIDE_RIGHT#1', (m, d) => squeeze(d > 0 ? m.box.x1 : m.box.x0, m.box.cy, 19 * WARP, 110, d));
    side('TRAPEZIUS_LEFT#1', 'TRAPEZIUS_RIGHT#1', (m, d) => fields.push({ x: d > 0 ? m.box.x1 : m.box.x0, y: m.box.y0, r: 40, dx: 0, dy: 8 * WARP }));
    side('CHEST_LEFT#1', 'CHEST_RIGHT#1', (m, d) => { pinch(m, 0.07 * WARP); squeeze(d > 0 ? m.box.x1 : m.box.x0, m.box.y0 + m.box.h * 0.2, 7 * WARP, 45, d); bloat(m.box.cx + d * m.box.w * 0.08, m.box.y1 - m.box.h * 0.32, 8 * WARP, m.box.w * 0.42); });
    side('OBLIQUE_LEFT#1', 'OBLIQUE_RIGHT#1', (m, d) => squeeze(d > 0 ? m.box.x1 : m.box.x0, m.box.y1 - m.box.h * 0.4, 16 * WARP, 62, d));
    side('QUADRICEPS_LEFT#1', 'QUADRICEPS_RIGHT#1', (m, d) => push(d > 0 ? m.box.x1 : m.box.x0, m.box.y0 + m.box.h * 0.1, 17 * WARP, 88, d));
  } else {
    side('SHOULDER_SIDE_LEFT#1', 'SHOULDER_SIDE_RIGHT#1', (m, d) => squeeze(d > 0 ? m.box.x1 : m.box.x0, m.box.cy, 17 * WARP, 110, d));
    side('TRAPEZIUS_LEFT#1', 'TRAPEZIUS_RIGHT#1', (m, d) => fields.push({ x: d > 0 ? m.box.x1 : m.box.x0, y: m.box.y0 + 10, r: 42, dx: 0, dy: 7 * WARP }));
    side('OBLIQUE_LEFT#1', 'OBLIQUE_RIGHT#1', (m, d) => squeeze(d > 0 ? m.box.x1 : m.box.x0, m.box.cy, 13 * WARP, 62, d));
    side('GLUTEUS_LEFT#1', 'GLUTEUS_RIGHT#1', (m, d) => { push(d > 0 ? m.box.x1 : m.box.x0, m.box.cy, 14 * WARP, 90, d); bloat(m.box.cx, m.box.cy, 7 * WARP, m.box.w * 0.75); });
  }
  const move = (x, y) => {
    let dx = 0, dy = 0;
    for (const f of fields) {
      const ex = x - f.x, ey = y - f.y, w = Math.exp(-(ex * ex + ey * ey) / (f.r * f.r));
      if (f.pinch) { dx -= f.pinch * ex * w; if (!f.axisOnly) dy -= f.pinch * ey * w; }
      else if (f.radial) { const l = Math.hypot(ex, ey) || 1; dx += f.radial * w * ex / l; dy += f.radial * w * ey / l; }
      else { dx += f.dx * w; dy += f.dy * w; }
    }
    return [x + dx, y + dy];
  };
  const wp = d => d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (s, a, b) => { const [x, y] = move(+a, +b); return Math.round(x) + ' ' + Math.round(y); });
  const outline = V.outline.map(wp), muscles = V.muscles.map(m => Object.assign({}, m, { d: m.d.map(wp) }));
  return { viewBox: viewBoxOf(outline.concat(muscles.flatMap(m => m.d))), outline, muscles, move };
}

// eye line and head width (front) and feet line, measured on the outline
function geometry(V, view) {
  const pts = V.outline.flatMap(d => { const n = nums(d), p = []; for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]); return p; });
  const top = Math.min(...pts.map(p => p[1])), feet = Math.max(...pts.map(p => p[1]));
  const width = y => { const xs = pts.filter(p => Math.abs(p[1] - y) < 7 && Math.abs(p[0] - CX) < 120).map(p => p[0]); return xs.length ? Math.max(...xs) - Math.min(...xs) : 0; };
  const g = { feet };
  if (view === 'front') {
    let neckY = top + 150, narrow = 1e9; for (let y = top + 110; y < top + 230; y += 4) { const w = width(y); if (w && w < narrow) { narrow = w; neckY = y; } }
    let eyeY = top + 80, wide = 0; for (let y = top + 40; y < neckY - 40; y += 3) { const w = width(y); if (w > wide) { wide = w; eyeY = y; } }
    g.eye = { y: eyeY - 6, w: wide };   // eyes sit just above the skull's widest line
  }
  return g;
}

// ---- build
const prevSrc = fs.readFileSync(OUT, 'utf8'), prev = JSON.parse(prevSrc.slice(prevSrc.indexOf('{'), prevSrc.lastIndexOf('}') + 1));
const male = prev.m || prev;   // first build had { front, back } for the male only
const out = { m: {}, f: {} };
for (const view of ['front', 'back']) {
  const M = male[view];
  out.m[view] = Object.assign({ viewBox: M.viewBox, outline: M.outline, muscles: M.muscles, nerves: M.nerves }, geometry(M, view));
  const pm = convert(loadDiagram(path.join(pkg, 'dist', 'male-' + view + '.js')));       // for pinning nerve points
  const pf = convert(loadDiagram(path.join(pkg, 'dist', 'female-' + view + '.js')));
  let nerves = carryNerves(M.nerves, pm, pf), F = pf;
  if (WARP) { F = reshape(pf, view); nerves = nerves.map(n => ({ keys: n.keys, pts: n.pts.map(([x, y]) => { const [a, b] = F.move(x, y); return [x === CX ? CX : Math.round(a), Math.round(b)]; }) })); }
  out.f[view] = Object.assign({ viewBox: F.viewBox, outline: F.outline, muscles: F.muscles.map(m => ({ key: m.key, name: m.name, d: m.d })), nerves }, geometry(F, view));
  console.log(view + ': male ' + out.m[view].muscles.length + ' muscles · female ' + out.f[view].muscles.length + ' muscles, viewBox ' + out.f[view].viewBox + (out.f[view].eye ? ', eyes at ' + out.f[view].eye.y : ''));
}
const header = '/* Arise anatomy figures, male (m) and female (f), front and back. Traced muscle paths from MuscleMap\n' +
  '   (https://github.com/Jsplice/MuscleMap), MIT License, Copyright (c) 2026 Jsplice / MuscleMap contributors. See THIRD_PARTY.md.\n' +
  '   Built by tools/build-anatomy.js; the female figure is reshaped from the traced data, not redrawn. */\n';
fs.writeFileSync(OUT, header + 'window.ARISE_ANATOMY = ' + JSON.stringify(out) + ';\n');
console.log('wrote anatomy.js, ' + fs.statSync(OUT).size + ' bytes');
