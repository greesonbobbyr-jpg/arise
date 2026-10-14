// Patch: male/female characters with the Solo Leveling look (aura by rank, eyes, summoning circle, System frame).
// run once: node e2e/patches/2026-10-14a-characters.js
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected one match, found ' + n + ': ' + a.slice(0, 80)); s = s.split(a).join(b); };

// ---- CSS: the old body map block becomes the character styles
const cssStart = s.indexOf('.bodymap{display:flex;justify-content:center;gap:4%;padding:6px 0 0}');
const cssEnd = s.indexOf('.bm-legend{');
if (cssStart < 0 || cssEnd < 0 || cssEnd < cssStart) throw new Error('body map CSS not found');
s = s.slice(0, cssStart) + `/* characters: traced male/female figures with the System look. Only opacity and transform animate. */
.bodymap{position:relative;display:flex;justify-content:center;gap:2%;padding:16px 4px 2px;overflow:hidden}
.bodymap::before{content:"";position:absolute;inset:4px;pointer-events:none;opacity:.55;background-repeat:no-repeat;
  background-image:linear-gradient(var(--cy),var(--cy)),linear-gradient(var(--cy),var(--cy)),linear-gradient(var(--cy),var(--cy)),linear-gradient(var(--cy),var(--cy)),linear-gradient(var(--cy),var(--cy)),linear-gradient(var(--cy),var(--cy)),linear-gradient(var(--cy),var(--cy)),linear-gradient(var(--cy),var(--cy));
  background-size:18px 1.5px,1.5px 18px,18px 1.5px,1.5px 18px,18px 1.5px,1.5px 18px,18px 1.5px,1.5px 18px;
  background-position:0 0,0 0,100% 0,100% 0,0 100%,0 100%,100% 100%,100% 100%}
.bodymap::after{content:"";position:absolute;left:4px;right:4px;height:40%;top:0;transform:translateY(-100%);pointer-events:none;background:linear-gradient(transparent,rgba(62,230,255,.06),transparent);animation:bmscan 5s linear infinite}
@keyframes bmscan{to{transform:translateY(260%)}}
.char{position:relative;width:48%}
.char > svg.fig{position:relative;width:100%;height:auto;overflow:visible;display:block}
.char .aura{position:absolute;left:0;top:0;width:100%;height:auto;overflow:visible;pointer-events:none;opacity:var(--a);animation:bmbreathe 3.4s ease-in-out infinite;will-change:opacity,transform}
@keyframes bmbreathe{0%,100%{opacity:calc(var(--a) * .78);transform:translateY(0) scale(1)}50%{opacity:var(--a);transform:translateY(-1.2%) scale(1.012)}}
.char .ring{position:absolute;left:50%;width:78%;aspect-ratio:1;transform:translate(-50%,-50%) scaleY(.26);pointer-events:none}
.char .ring svg{width:100%;height:100%;overflow:visible;animation:bmspin 18s linear infinite}
.char .ring svg.r2{animation-direction:reverse;animation-duration:26s}
.char .ring circle{fill:none;stroke:var(--cy)}
@keyframes bmspin{to{transform:rotate(360deg)}}
.char .lab2{text-align:center;margin-top:16px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx3);font-weight:600}
.char path,.char polyline{vector-effect:non-scaling-stroke}
.char .sil{fill:#07090D;stroke:rgba(62,230,255,.35);stroke-width:.8}
.char .mu{fill:#141C25;stroke:rgba(62,230,255,.55);stroke-width:.6;stroke-linejoin:round;cursor:pointer;transition:fill var(--t)}
.char .mu.lit{fill:var(--gr);stroke:rgba(182,255,59,.9)}
.char .fib{pointer-events:none;stroke:none}
.char .glow{pointer-events:none;fill:var(--gr);opacity:.7}
.char .nerve{fill:none;stroke:var(--cy);stroke-width:.6;opacity:.22;stroke-linecap:round}
.char .nerve.live{opacity:.75;stroke-dasharray:3 5;animation:nflow 1.6s linear infinite}
.char .node{fill:var(--cy);opacity:.35}
.char .node.live{opacity:1;fill:var(--gr)}
.char .eye{fill:#E9FDFF}
.char .eyeglow{fill:var(--cy)}
.bm-hud{display:flex;justify-content:space-between;gap:8px;margin:2px 2px 0;font-family:var(--f-num);font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#58798A}
.bm-hud b{color:var(--cy)}
@keyframes nflow{to{stroke-dashoffset:-16}}
@keyframes bmpulse{0%,100%{opacity:.35}50%{opacity:.8}}
.char .glow.pulse{animation:bmpulse 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.char .nerve.live,.char .glow.pulse,.char .aura,.char .ring svg,.bodymap::after{animation:none}}
` + s.slice(cssEnd);
R('.bm-legend{display:flex;gap:14px;justify-content:center;', '.bm-legend{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;');

// ---- JS: one renderer for both characters; the body map and the setup cards use it
const jsStart = s.indexOf('function bodyMap() {');
const jsEnd = s.indexOf('function viewProgress() {');
if (jsStart < 0 || jsEnd < jsStart) throw new Error('bodyMap not found');
s = s.slice(0, jsStart) + `// A character: the traced figure for a sex and view, with the System look.
// opts: lit {muscleKey: sets}, rank 'E'..'S' (aura strength), id (unique per figure on screen), label, tap (muscles answer taps)
function charSVG(sex, view, opts) {
  const A = window.ARISE_ANATOMY; if (!A) return '';
  const F = (A[sex === 'f' ? 'f' : 'm'] || A.m)[view], o = opts || {}, lit = o.lit || {}, id = o.id || (sex + view);
  const anyLit = Object.keys(lit).length > 0, vb = F.viewBox.split(' ').map(Number);
  // aura: violet smoke hugging the body, tongues of it rising, a thin cyan rim; stronger at higher Hunter ranks
  const R = Math.max(0, 'EDCBAS'.indexOf(o.rank || 'E')), a = (0.42 + R * 0.116).toFixed(2), grow = 6 + R * 2.4, tear = 26 + R * 10, rise = 16 + R * 9;
  const aura = '<svg class="aura" viewBox="' + F.viewBox + '" style="--a:' + a + '" aria-hidden="true"><defs><filter id="au-' + id + '" x="-35%" y="-30%" width="170%" height="150%">' +
    '<feMorphology in="SourceAlpha" operator="dilate" radius="' + grow + '" result="g"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.016 0.005" numOctaves="3" seed="' + (view === 'front' ? 7 : 11) + '" result="n"/>' +
    '<feDisplacementMap in="g" in2="n" scale="' + tear + '" xChannelSelector="R" yChannelSelector="G" result="t"/>' +
    '<feGaussianBlur in="t" stdDeviation="12" result="b"/><feFlood flood-color="#5B3BFF"/><feComposite in2="b" operator="in" result="v"/>' +
    '<feTurbulence type="turbulence" baseFrequency="0.03 0.007" numOctaves="2" seed="' + (view === 'front' ? 3 : 5) + '" result="n2"/>' +
    '<feDisplacementMap in="g" in2="n2" scale="' + (tear * 1.6) + '" xChannelSelector="R" yChannelSelector="G" result="t2"/>' +
    '<feOffset in="t2" dy="-' + rise + '" result="t3"/><feGaussianBlur in="t3" stdDeviation="9" result="b3"/><feFlood flood-color="#8F6BFF" flood-opacity=".75"/><feComposite in2="b3" operator="in" result="w"/>' +
    '<feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="r0"/><feFlood flood-color="#3EE6FF" flood-opacity=".5"/><feComposite in2="r0" operator="in" result="r1"/><feComposite in="r1" in2="SourceAlpha" operator="out" result="rim"/>' +
    '<feMerge><feMergeNode in="w"/><feMergeNode in="v"/><feMergeNode in="rim"/></feMerge></filter></defs>' +
    '<g filter="url(#au-' + id + ')">' + F.outline.map(d => '<path d="' + d + '"/>').join('') + '</g></svg>';
  let s = '<svg class="fig" viewBox="' + F.viewBox + '" role="img" aria-label="' + (sex === 'f' ? 'Female' : 'Male') + ' ' + view + ' body map"><defs>' +
    '<filter id="gl-' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter>' +
    '<filter id="ey-' + id + '" x="-200%" y="-400%" width="500%" height="900%"><feGaussianBlur stdDeviation="5"/></filter>' +
    '<pattern id="fb-' + id + '" patternUnits="userSpaceOnUse" width="13" height="13" patternTransform="rotate(78)"><path d="M0,0 V13" style="stroke:rgba(62,230,255,.14);stroke-width:2.6;fill:none"/></pattern>' +
    '<pattern id="fl-' + id + '" patternUnits="userSpaceOnUse" width="13" height="13" patternTransform="rotate(78)"><path d="M0,0 V13" style="stroke:rgba(12,50,8,.32);stroke-width:2.2;fill:none"/></pattern>' +
    '<radialGradient id="sh-' + id + '" cx="45%" cy="22%" r="85%"><stop offset="0" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
  s += F.outline.map(d => '<path class="sil" d="' + d + '"/>').join('');
  for (const n of F.nerves || []) {
    const live = n.keys.some(k => lit[k]);
    s += '<polyline class="nerve' + (live ? ' live' : '') + '" points="' + n.pts.map(p => p.join(',')).join(' ') + '"/>';
    for (const p of n.pts.slice(1, -1)) s += '<circle class="node' + (live ? ' live' : '') + '" cx="' + p[0] + '" cy="' + p[1] + '" r="7"/>';
  }
  for (const m of F.muscles) {
    if (!bmNames[m.key]) bmNames[m.key] = m.name;
    const n = lit[m.key] || 0, on = n > 0, op = on ? Math.min(1, 0.55 + n / 20) : 0, d = m.d.join(' ');
    if (on) s += '<path class="glow' + (anyLit ? ' pulse' : '') + '" d="' + d + '" filter="url(#gl-' + id + ')" style="opacity:' + (op * 0.6).toFixed(2) + '"/>';
    s += '<path class="mu' + (on ? ' lit' : '') + '" d="' + d + '"' + (o.tap ? ' data-bm="' + m.key + '"' : '') + (on ? ' style="fill-opacity:' + op.toFixed(2) + '"' : '') + '>' +
      (o.tap ? '<title>' + m.name + (on ? ' · ' + n + ' sets this week' : ' · not trained this week') + '</title>' : '') + '</path>';
    s += '<path class="fib" d="' + d + '" fill="url(#' + (on ? 'fl-' : 'fb-') + id + ')"/><path class="fib" d="' + d + '" fill="url(#sh-' + id + ')"/>';
  }
  if (F.eye) {   // shadow-soldier eyes: two thin glowing slits, tilted up at the outer corners
    const ex = F.eye.w * 0.19, rx = F.eye.w * 0.085, ry = F.eye.w * 0.024, y = F.eye.y;
    for (const sg of [-1, 1]) { const x = 512 + sg * ex, t = 'rotate(' + (-sg * 9) + ' ' + x + ' ' + y + ')';
      s += '<ellipse class="eyeglow" filter="url(#ey-' + id + ')" cx="' + x + '" cy="' + y + '" rx="' + (rx * 1.6) + '" ry="' + (ry * 3) + '" transform="' + t + '"/><ellipse class="eye" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="' + t + '"/>'; }
  }
  s += '</svg>';
  const cy = ((F.feet - vb[1]) / vb[3] * 100).toFixed(1);   // summoning circle under the feet
  const ring = '<div class="ring" style="top:' + cy + '%"><svg viewBox="-100 -100 200 200" aria-hidden="true"><circle r="92" stroke-width="1.6" stroke-dasharray="2 6" opacity=".7"/><circle r="80" stroke-width="1" opacity=".45"/><circle r="66" stroke-width="3" stroke-dasharray="24 10 4 10" opacity=".55"/></svg></div>' +
    '<div class="ring" style="top:' + cy + '%"><svg class="r2" viewBox="-100 -100 200 200" aria-hidden="true"><circle r="98" stroke-width=".8" stroke-dasharray="40 14" opacity=".35"/><circle r="52" stroke-width="1.2" stroke-dasharray="1 5" opacity=".6"/></svg></div>';
  return '<div class="char" data-sex="' + (sex === 'f' ? 'f' : 'm') + '" data-view="' + view + '">' + ring + aura + s + (o.label ? '<div class="lab2">' + o.label + '</div>' : '') + '</div>';
}
function bodyMap() {
  if (!window.ARISE_ANATOMY) return '';
  const cut = Date.now() - 7 * DAY; bmSets = {};
  for (const s of state.sessions) if (s.date >= cut) for (const e of s.entries || []) {
    const ex = exById[e.exId]; if (!ex) continue; const n = e.sets.filter(x => !x.warmup).length; if (!n) continue;
    for (const k of (BM_MUSCLE[ex.muscle] || BM_GROUP[ex.group] || [])) bmSets[k] = (bmSets[k] || 0) + n;
  }
  const rank = currentRank(), sex = P().sex === 'f' ? 'f' : 'm';
  return '<div class="bm-hud"><span>Status · <b>' + esc(P().name || 'Hunter') + '</b></span><span>Rank <b>' + rank + '</b></span></div>' +
    '<div class="bodymap">' + charSVG(sex, 'front', { lit: bmSets, rank, id: 'bm-f', label: 'Front', tap: true }) + charSVG(sex, 'back', { lit: bmSets, rank, id: 'bm-b', label: 'Back', tap: true }) + '</div>' +
    '<div class="bm-legend"><span><i style="background:var(--gr);box-shadow:0 0 6px var(--gr)"></i>Trained · brighter = more sets</span><span><i style="background:#18222C;box-shadow:inset 0 0 0 1px rgba(62,230,255,.4)"></i>Not yet this week</span><span><i style="background:#6A4BFF;box-shadow:0 0 6px #6A4BFF"></i>Aura grows with your rank</span></div>';
}
` + s.slice(jsEnd);
fs.writeFileSync(F, s);
console.log('characters patch applied');
