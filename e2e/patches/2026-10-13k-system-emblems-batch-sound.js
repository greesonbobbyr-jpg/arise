// One-off patch (kept for the record): system.js — per-title emblems, reveal-all cascade, sound hooks.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', '..', 'system.js');
let s = fs.readFileSync(FILE, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('expected 1 match, got ' + n + ':\n' + a.slice(0, 110)); s = s.replace(a, () => b); };

// ---- header
R(`   API  ARISE_SYSTEM.reveal(items, { sealed = true, onRevealed(id) }) → Promise, resolves when every item is accepted
        item: { id, name, desc, flavor, rarity: common | rare | epic | legendary, icon }`,
  `   API  ARISE_SYSTEM.reveal(items, { sealed = true, onRevealed(id) }) → Promise, resolves when every item is accepted
        item: { id, name, desc, flavor, grade: common | rare | epic | legendary, glyph, mark }
        ARISE_SYSTEM.emblem(item, { sealed, mini, locked }) → SVG string. Every title has its own emblem:
        a frame for its grade, a glyph for its kind, and a mark (a number or code) unique to the title.
   With more than three titles waiting, the window offers REVEAL ALL (a fast cascade) or one at a time.
   Sounds come from sfx.js when it is loaded and enabled.`);

// ---- glyphs
R(`    stack:    'M3 20h18M6 20v-9h12v9M9 11V6h6v5',
  };`,
  `    stack:    'M3 20h18M6 20v-9h12v9M9 11V6h6v5',
    bench:    'M3 9h18M5 6v6M19 6v6M6 16h12M8 16v4M16 16v4',
    squat:    'M3 7h18M6 4v6M18 4v6M9 21v-5l3-4 3 4v5',
    deadlift: 'M2 18h20M5 15v6M8 13v10M16 13v10M19 15v6M12 12V3M9 6l3-3 3 3',
    press:    'M3 6h18M5 3v6M19 3v6M12 21V11M9 14l3-3 3 3',
    sigma:    'M17 5H7l6 7-6 7h10',
    loop:     'M4 12a8 8 0 0 1 13.7-5.7L20 4v6h-6l2.3-2.3A5 5 0 0 0 7 12M20 12a8 8 0 0 1-13.7 5.7L4 20v-6h6l-2.3 2.3A5 5 0 0 0 17 12',
    dip:      'M4 5v15M20 5v15M4 9h4M16 9h4M12 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4M12 10v6M9 20l3-4 3 4',
    pushup:   'M3 19h18M5 15l13-5M7 15v4M16 11v8M19.5 7.5a1.8 1.8 0 1 0 .1 0',
    db:       'M6 14l-3 3 4 4 3-3M18 10l3-3-4-4-3 3M9 15l6-6',
    curl:     'M7 21v-8l5-3V4h3v8l-4 3v6z',
    sled:     'M3 20h18M6 20l10-13M14 5l5 4-3 4',
    hip:      'M3 19h18M5 19c2-8 12-8 14 0M12 13V5M9 8l3-3 3 3',
    star:     'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    scroll:   'M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h3',
    grid:     'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    sun:      'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
    moon:     'M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z',
    hourglass:'M6 3h12M6 21h12M7 3c0 5 5 5 5 9s-5 4-5 9M17 3c0 5-5 5-5 9s5 4 5 9',
    mountain: 'M2 20l7-12 4 7 3-4 6 9z',
    tally:    'M5 5v14M9 5v14M13 5v14M17 5v14M3 16l16-8',
    return:   'M4 12a8 8 0 1 0 3-6.2M4 4v5h5',
    shield:   'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
    sword:    'M19 5L9 15M19 5h-5M19 5v5M6 12l6 6M4 20l4-4',
    twin:     'M4 6h7v12H4zM13 6h7v12h-7z',
    body:     'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 9h10M12 9v6M9 21l3-6 3 6',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    calcheck: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4',
  };`);

// ---- emblem CSS: keyed on .emb so the same art works in the window and on title cards
R(`.sys-emblem .hex{fill:rgba(62,230,255,.07);stroke:var(--sc);stroke-width:2;stroke-linejoin:round}
.sys-emblem .hex.in{fill:none;stroke-width:.8;opacity:.55}
.sys-emblem .ring{fill:none;stroke:var(--sc);stroke-width:1.2;stroke-dasharray:3 8;opacity:.7;transform-origin:60px 60px;animation:sysspin 16s linear infinite}
.sys-emblem .ring.r2{stroke-dasharray:16 11;opacity:.4;animation-duration:9s;animation-direction:reverse}
@keyframes sysspin{to{transform:rotate(360deg)}}
.sys-emblem .q{font-family:var(--f-num,ui-monospace,monospace);font-size:52px;font-weight:700;fill:var(--sc)}
.sys-emblem .glyph path{fill:none;stroke:var(--sc);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}`,
  `.emb{--ec:#3EE6FF;overflow:visible}
.emb.g-epic{--ec:#B6FF3B}.emb.g-legendary{--ec:#F2FFE4}.emb.sealed{--ec:#3EE6FF}.emb.locked{--ec:#46505F}
.emb .fr{fill:color-mix(in srgb,var(--ec) 9%,transparent);stroke:var(--ec);stroke-width:2;stroke-linejoin:round}
.emb .fr.in{fill:none;stroke-width:.8;opacity:.55}
.emb .fr.tk{fill:none;stroke-width:1.7;stroke-linecap:round}
.emb.g-rare:not(.locked) .fr.tk{stroke:#B6FF3B}
.emb.g-legendary:not(.locked) .fr.tk{stroke:#B6FF3B}
.emb .ring{fill:none;stroke:var(--ec);stroke-width:1.2;stroke-dasharray:3 8;opacity:.7;transform-origin:60px 60px}
.emb .ring.r2{stroke-dasharray:16 11;opacity:.4}
.emb .q{font-family:var(--f-num,ui-monospace,monospace);font-size:52px;font-weight:700;fill:var(--ec)}
.emb .glyph path{fill:none;stroke:var(--ec);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.emb .mk{font-family:var(--f-num,ui-monospace,monospace);font-weight:700;fill:var(--ec);letter-spacing:-.03em}
.sys-emblem .emb .ring{animation:sysspin 16s linear infinite}
.sys-emblem .emb .ring.r2{animation-duration:9s;animation-direction:reverse}
@keyframes sysspin{to{transform:rotate(360deg)}}`);
R(`.sys-emblem.revealed .hex{fill:color-mix(in srgb,var(--sc) 16%,transparent)}
.sys-emblem.revealed .ring{animation-duration:5s;opacity:.9}`,
  `.sys-emblem.revealed .emb .fr:not(.in):not(.tk){fill:color-mix(in srgb,var(--ec) 16%,transparent)}
.sys-emblem.revealed .emb .ring{animation-duration:5s;opacity:.9}`);
R(`@media (prefers-reduced-motion:reduce){.sys *,.sys-win{animation:none!important;transition:none!important}}`,
  `.sys-alt{display:block;margin:12px auto 0;min-height:44px;padding:0 12px;background:none;border:0;color:#9FD4E4;font-family:var(--f-ui,system-ui,sans-serif);font-size:14px;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
.sys[data-stage="summary"] .sys-emblem{display:none}
.sys[data-stage="summary"] .sys-stack{min-height:0}
.sys-big{font-family:var(--f-num,ui-monospace,monospace);font-size:64px;line-height:1;font-weight:700;color:var(--sc);text-shadow:0 0 26px var(--sc)}
.sys-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 6px;width:100%;max-height:min(300px,38vh);overflow-y:auto;margin-top:14px;padding:6px 2px 2px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.sys-cell{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
.sys-cell svg{width:46px;height:46px}
.sys-cell b{font-size:10px;line-height:1.15;font-weight:600;color:#BFE6F2;text-align:center;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.sys *,.sys-win{animation:none!important;transition:none!important}}`);

// ---- a lighter burst for the cascade
R(`    // continuous aura: fire along the bottom edge, drifting motes, optional halo behind the emblem`,
  `    // a small pop for each title in the reveal-all cascade: one ring and a few sparks, no pillar
    function pop(x, y, pal, power) {
      ring(x, y, 6, 560, pal[0], 3); sparks(x, y, Math.round(22 * power), pal, 420);
      for (let i = 0; i < 8; i++) parts.push({ k: 'flame', front: true, x: x + rnd(-30, 30), y: y + rnd(-10, 30), vx: rnd(-60, 60), vy: rnd(-220, -80), age: 0, max: rnd(.4, .8), r: rnd(18, 40), c: pick(pal.slice(0, 2)), a: .4 });
    }
    // continuous aura: fire along the bottom edge, drifting motes, optional halo behind the emblem`);
R(`      size, burst, ambient,`, `      size, burst, pop, ambient,`);

// ---- CSS is global (title cards use the emblem styles before any reveal has opened)
R(`  let root = null, el = {}, fx = null, pendingTap = null, queue = Promise.resolve(), gen = 0;`,
  `  let root = null, el = {}, fx = null, pendingTap = null, pendingChoice = null, queue = Promise.resolve(), gen = 0;
  (function injectCSS() { const st = document.createElement('style'); st.id = 'arise-system-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); })();
  const sfx = (name, opts) => { try { if (window.ARISE_SFX) window.ARISE_SFX.play(name, opts); } catch (e) {} };
  const escHTML = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));`);

// ---- the emblem: frame by grade + glyph by kind + mark by title
R(`  function emblemSVG(icon, sealed) {
    return '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring" cx="60" cy="60" r="57"/><circle class="ring r2" cx="60" cy="60" r="51"/>' +
      '<path class="hex" d="M60 12L101.6 36V84L60 108L18.4 84V36Z"/><path class="hex in" d="M60 22L92.9 41V79L60 98L27.1 79V41Z"/>' +
      (sealed ? '<text class="q" x="60" y="78" text-anchor="middle">?</text>' : '<g class="glyph" transform="translate(36 36) scale(2)"><path d="' + (ICONS[icon] || ICONS.eye) + '"/></g>') + '</svg>';
  }`,
  `  const HEX = 'M60 12L101.6 36V84L60 108L18.4 84V36Z', HEX_IN = 'M60 22L92.9 41V79L60 98L27.1 79V41Z';
  function starPath(n, R1, R2) { let d = ''; for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? R2 : R1; d += (i ? 'L' : 'M') + (60 + Math.cos(a) * r).toFixed(1) + ' ' + (60 + Math.sin(a) * r).toFixed(1); } return d + 'Z'; }
  const STAR = starPath(12, 55, 45);
  // common: hexagon · rare: hexagon with six struts · epic: shield with wings · legendary: twelve-point star
  function frameSVG(grade) {
    if (grade === 'rare') return '<path class="fr" d="' + HEX + '"/><path class="fr in" d="' + HEX_IN + '"/><path class="fr tk" d="M60 12V4M101.6 36l7-4M101.6 84l7 4M60 108v8M18.4 84l-7 4M18.4 36l-7-4"/>';
    if (grade === 'epic') return '<path class="fr" d="M60 9L100 24V66C100 88 82 103 60 112C38 103 20 88 20 66V24Z"/><path class="fr in" d="M60 19L91 31V66C91 82 77 94 60 101C43 94 29 82 29 66V31Z"/><path class="fr tk" d="M20 30L8 24M20 44L6 42M100 30l12-6M100 44l14-2"/>';
    if (grade === 'legendary') return '<path class="fr" d="' + STAR + '"/><path class="fr in" d="' + HEX_IN + '"/><path class="fr tk" d="M60 2v6M60 112v6M2 60h6M112 60h6"/>';
    return '<path class="fr" d="' + HEX + '"/><path class="fr in" d="' + HEX_IN + '"/>';
  }
  // item: { grade | rarity, glyph | icon, mark }. opts: sealed (hide everything), mini (no rings), locked (greyed)
  function emblemSVG(item, opts) {
    opts = opts || {}; item = item || {};
    const grade = opts.sealed ? 'common' : (item.grade || item.rarity || 'common'), mark = String(item.mark || ''), d = ICONS[item.glyph || item.icon] || ICONS.eye;
    const size = mark.length <= 2 ? 21 : mark.length === 3 ? 18 : mark.length === 4 ? 15.5 : mark.length === 5 ? 13 : 11;
    const inner = opts.sealed ? '<text class="q" x="60" y="78" text-anchor="middle">?</text>'
      : mark ? '<g class="glyph" transform="translate(43.8 27) scale(1.35)"><path d="' + d + '"/></g><text class="mk" x="60" y="86" text-anchor="middle" font-size="' + size + '">' + escHTML(mark) + '</text>'
      : '<g class="glyph" transform="translate(36 36) scale(2)"><path d="' + d + '"/></g>';
    return '<svg class="emb g-' + grade + (opts.sealed ? ' sealed' : '') + (opts.locked ? ' locked' : '') + '" viewBox="0 0 120 120" aria-hidden="true">' +
      (opts.mini ? '' : '<circle class="ring" cx="60" cy="60" r="57"/><circle class="ring r2" cx="60" cy="60" r="51"/>') + frameSVG(grade) + inner + '</svg>';
  }`);

// ---- CSS no longer injected lazily; taps can target a specific choice
R(`    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div');`,
  `    if (root) return;
    root = document.createElement('div');`);
R(`    root.addEventListener('click', () => { if (pendingTap) pendingTap(); });`,
  `    root.addEventListener('click', e => {
      if (pendingChoice) { const c = e.target.closest('[data-sys-choice]'); if (c) { const f = pendingChoice; pendingChoice = null; f(c.dataset.sysChoice); } return; }
      if (pendingTap) pendingTap();
    });`);
R(`  const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };`,
  `  const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  // wait for a tap on an element marked data-sys-choice (taps elsewhere are ignored)
  function waitChoice(delay) { const t0 = performance.now(); return new Promise(res => { pendingChoice = v => { if (performance.now() - t0 < delay) { pendingChoice = arguments.callee; return; } res(v); }; }); }`);

// ---- sealed / revealed: new emblem calls and sound
R(`    el.emblem.className = 'sys-emblem sealed'; el.emblem.innerHTML = emblemSVG(null, true);
    el.stack.innerHTML = '<div class="sys-msg"></div><div class="sys-sub sys-fade">Sealed</div><div class="sys-hint sys-fade">Tap to break the seal.</div>';`,
  `    el.emblem.className = 'sys-emblem sealed'; el.emblem.innerHTML = emblemSVG(null, { sealed: true });
    el.stack.innerHTML = '<div class="sys-msg"></div><div class="sys-sub sys-fade">Sealed</div><div class="sys-hint sys-fade">Tap to break the seal.</div>';
    sfx('notify');`);
R(`    el.emblem.className = 'sys-emblem revealed'; el.emblem.innerHTML = emblemSVG(item.icon, false);`,
  `    el.emblem.className = 'sys-emblem revealed'; el.emblem.innerHTML = emblemSVG(item);`);
R(`    gen++; const g = GRADE[item.rarity] || GRADE.common;
    root.dataset.stage = 'revealed'; root.classList.toggle('legendary', item.rarity === 'legendary'); setColor(g.css, g.flash);`,
  `    gen++; const grade = item.grade || item.rarity, g = GRADE[grade] || GRADE.common;
    root.dataset.stage = 'revealed'; root.classList.toggle('legendary', grade === 'legendary'); setColor(g.css, g.flash);
    sfx('seal', { power: g.power });`);
R(`    ['.sys-grade', '.sys-desc', '.sys-flavor'].forEach((s, k) => setTimeout(() => { const n = q(s); if (n) n.classList.add('show'); }, 90 * k));
    await wait;
  }`,
  `    ['.sys-grade', '.sys-desc', '.sys-flavor'].forEach((s, k) => setTimeout(() => { const n = q(s); if (n) n.classList.add('show'); }, 90 * k));
    await wait;
    sfx('accept');
  }

  // ---- many titles at once: choose, then a fast cascade and a summary
  async function chooseBatch(n) {
    gen++; root.dataset.stage = 'sealed'; root.classList.remove('legendary'); setColor(SEAL.css);
    el.title.textContent = 'NOTIFICATION';
    el.emblem.className = 'sys-emblem sealed'; el.emblem.innerHTML = emblemSVG(null, { sealed: true });
    el.stack.innerHTML = '<div class="sys-msg"></div><div class="sys-sub sys-fade">Sealed</div><button class="sys-alt sys-fade" type="button" data-sys-choice="each">Open them one at a time</button>';
    el.btn.className = 'sys-btn armed'; el.btn.textContent = '[ REVEAL ALL ]'; el.btn.dataset.sysChoice = 'all';
    el.count.textContent = n + ' waiting';
    fx.ambient({ rate: 46, lift: .75, alpha: .34, c: SEAL.c });
    buzz(25); sfx('notify');
    if (!reduced()) await anim(el.win, 'open', 460);
    root.dataset.opened = '1';
    typeText(el.stack.querySelector('.sys-msg'), 'You have acquired ' + n + ' new titles.', 46).then(() => { el.stack.querySelectorAll('.sys-fade').forEach((x, k) => setTimeout(() => x.classList.add('show'), 140 * k)); });
    const mode = await waitChoice(380);
    delete el.btn.dataset.sysChoice;
    return mode;
  }
  async function cascade(items, onRevealed) {
    gen++; root.dataset.stage = 'cascade';
    el.title.textContent = 'TITLES ACQUIRED'; el.btn.className = 'sys-btn armed'; el.btn.textContent = '[ SKIP ]';
    let skip = false; pendingTap = () => { skip = true; };
    for (let i = 0; i < items.length && !skip; i++) {
      const it = items[i], grade = it.grade || it.rarity, g = GRADE[grade] || GRADE.common;
      root.classList.toggle('legendary', grade === 'legendary'); setColor(g.css, g.flash);
      el.emblem.className = 'sys-emblem revealed'; el.emblem.innerHTML = emblemSVG(it);
      el.stack.innerHTML = '<div class="sys-name"></div><div class="sys-grade">' + g.label + '</div><div class="sys-desc"></div>';
      el.stack.querySelector('.sys-name').textContent = it.name; el.stack.querySelector('.sys-desc').textContent = it.desc || '';
      el.count.textContent = (i + 1) + ' / ' + items.length;
      if (onRevealed) { try { onRevealed(it.id); } catch (e) {} }
      if (!reduced()) { const [x, y] = emblemCenter(); fx.pop(x, y, g.c, g.power); fx.ambient({ rate: 70, lift: 1.1, alpha: .36, c: g.c }); }
      sfx('tick', { step: i }); buzz(12);
      await sleep(reduced() ? 220 : 560 + (g.power >= 1.7 ? 300 : 0));
    }
    pendingTap = null;
    for (const it of items) if (onRevealed) { try { onRevealed(it.id); } catch (e) {} }     // skipped ones are still opened
    // summary: everything that was just acquired
    gen++; root.dataset.stage = 'summary'; root.classList.remove('legendary'); setColor(GRADE.epic.css);
    el.title.textContent = 'TITLES ACQUIRED';
    el.stack.innerHTML = '<div class="sys-big">' + items.length + '</div><div class="sys-sub sys-fade show">new titles</div><div class="sys-grid">' +
      items.map(it => '<span class="sys-cell">' + emblemSVG(it, { mini: true }) + '<b>' + escHTML(it.name) + '</b></span>').join('') + '</div>';
    el.btn.className = 'sys-btn solid armed'; el.btn.textContent = '[ ACCEPT ]'; el.btn.dataset.sysChoice = 'accept';
    el.count.textContent = 'See them under Profile, Titles';
    if (!reduced()) { const r = el.win.getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.top + 120, GRADE.epic.c, 1.75); anim(el.flash, 'go', 560); anim(el.win, 'shake', 420); }
    sfx('seal', { power: 1.75 }); buzz([40, 50, 40, 60, 160]);
    await waitChoice(600);
    delete el.btn.dataset.sysChoice;
    sfx('accept');
  }`);

// ---- run: offer the cascade when more than three titles are waiting
R(`    const sealed = opts.sealed !== false;
    for (let i = 0; i < items.length; i++) {
      if (sealed) await showSealed(items[i], i, items.length, i === 0);
      if (sealed) root.dataset.opened = '1';
      await showRevealed(items[i], i, items.length, i === 0, opts.onRevealed);
    }`,
  `    const sealed = opts.sealed !== false;
    let chose = false, all = false;
    if (sealed && items.length > 3) { chose = true; all = (await chooseBatch(items.length)) === 'all'; }
    if (all) await cascade(items, opts.onRevealed);
    else for (let i = 0; i < items.length; i++) {
      if (sealed) await showSealed(items[i], i, items.length, i === 0 && !chose);
      if (sealed) root.dataset.opened = '1';
      await showRevealed(items[i], i, items.length, i === 0, opts.onRevealed);
    }`);
R(`    queue = queue.then(() => run(items, opts || {})).catch(e => { console.warn('system reveal failed', e); if (root) { root.classList.remove('on'); if (fx) fx.stop(); } });`,
  `    queue = queue.then(() => run(items, opts || {})).catch(e => { console.warn('system reveal failed', e); pendingTap = pendingChoice = null; if (root) { root.classList.remove('on'); if (fx) fx.stop(); } });`);
R(`  window.ARISE_SYSTEM = { reveal, GRADE, get active()`, `  window.ARISE_SYSTEM = { reveal, GRADE, emblem: emblemSVG, glyphs: Object.keys(ICONS), get active()`);

fs.writeFileSync(FILE, s);
console.log('system.js patched');
