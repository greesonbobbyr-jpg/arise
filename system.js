/* Arise — the System. Notification window and title-reveal effects.
   Self-contained: injects its own CSS, draws effects on two canvases (behind and in front of the window), no assets.

   API  ARISE_SYSTEM.reveal(items, { sealed = true, onRevealed(id) }) → Promise, resolves when every item is accepted
        item: { id, name, desc, flavor, rarity: common | rare | epic | legendary, icon }
   Each title arrives SEALED (name hidden). A tap breaks the seal: flash, light pillar, shockwaves, sparks, shards,
   rising flames, then the name decodes. A second tap accepts it and moves to the next one. */
(function () {
  'use strict';

  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const CYAN = [62, 230, 255], GREEN = [182, 255, 59], WHITE = [255, 255, 255];
  const GRADE = {
    common:    { label: 'Common title',    css: '#3EE6FF', c: [CYAN, [170, 246, 255], WHITE],          power: 1 },
    rare:      { label: 'Rare title',      css: '#3EE6FF', c: [CYAN, GREEN, WHITE],                    power: 1.35 },
    epic:      { label: 'Epic title',      css: '#B6FF3B', c: [GREEN, CYAN, WHITE],                    power: 1.75 },
    legendary: { label: 'Legendary title', css: '#F2FFE4', c: [[206, 255, 120], CYAN, WHITE], flash: '#B6FF3B', power: 2.4 },
  };
  const SEAL = { css: '#3EE6FF', c: [CYAN, [70, 130, 255], WHITE] };

  // 24×24 stroke glyphs
  const ICONS = {
    eye:      'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    dumbbell: 'M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12',
    bolt:     'M13 2L4 14h7l-1 8 9-12h-7z',
    flame:    'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z',
    chevrons: 'M6 13l6-6 6 6M6 20l6-6 6 6',
    crown:    'M3 19h18M4 16L3 7l5 4 4-7 4 7 5-4-1 9z',
    barbell:  'M2 12h20M5 8v8M8 6v12M16 6v12M19 8v8',
    bar:      'M3 4h18M8 4v4M16 4v4M9.5 11.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0M12 14v7M9 17h6',
    trend:    'M4 18l6-7 4 4 6-8M15 7h5v5',
    stack:    'M3 20h18M6 20v-9h12v9M9 11V6h6v5',
  };

  // ------------------------------------------------------------------ CSS
  const CSS = `
.sys{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;background:rgba(3,5,9,.92);overflow:hidden;touch-action:manipulation;-webkit-user-select:none;user-select:none;--sc:#3EE6FF;font-family:var(--f-ui,system-ui,sans-serif)}
.sys.on{display:flex}
.sys canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.sys .sys-front{z-index:3}
.sys-flash{position:absolute;inset:0;z-index:4;background:radial-gradient(circle at 50% 42%,#fff 0,var(--sf,var(--sc)) 24%,rgba(0,0,0,0) 66%);opacity:0;pointer-events:none}
.sys-flash.go{animation:sysflash 560ms ease-out}
@keyframes sysflash{0%{opacity:.95}100%{opacity:0}}
.sys-win{position:relative;z-index:2;width:min(344px,calc(100vw - 44px));padding-bottom:16px;color:#DDF6FF;background:rgba(7,15,25,.86);border-left:1px solid rgba(62,230,255,.22);border-right:1px solid rgba(62,230,255,.22);box-shadow:0 0 70px -14px var(--sc),inset 0 0 44px rgba(62,230,255,.07);transition:box-shadow 400ms}
.sys-win::before,.sys-win::after{content:"";position:absolute;left:-12px;right:-12px;height:2px;background:var(--sc);box-shadow:0 0 14px var(--sc),0 0 3px #fff;transition:background 300ms,box-shadow 300ms}
.sys-win::before{top:0}.sys-win::after{bottom:0}
.sys-win.open{animation:sysopen 460ms cubic-bezier(.2,.9,.2,1)}
@keyframes sysopen{0%{transform:scale(0,.012);opacity:.2;filter:brightness(3)}32%{transform:scale(1,.012);opacity:1;filter:brightness(3)}100%{transform:none;filter:none}}
.sys-win.swap{animation:sysswap 300ms steps(6)}
@keyframes sysswap{0%{transform:translateX(0);opacity:1;clip-path:inset(0)}20%{transform:translateX(-6px);opacity:.5;clip-path:inset(12% 0 55% 0)}40%{transform:translateX(5px);clip-path:inset(48% 0 18% 0)}60%{transform:translateX(-3px);opacity:.8;clip-path:inset(4% 0 70% 0)}100%{transform:none;opacity:1;clip-path:inset(0)}}
.sys-win.shake{animation:sysshake 420ms cubic-bezier(.3,.7,.4,1)}
@keyframes sysshake{0%{transform:translate(0,0) scale(1.04)}15%{transform:translate(-7px,4px) scale(1.03)}30%{transform:translate(6px,-5px)}45%{transform:translate(-5px,-3px)}60%{transform:translate(4px,3px)}80%{transform:translate(-2px,1px)}100%{transform:none}}
.sys.closing .sys-win{animation:sysclose 220ms ease-in forwards}
@keyframes sysclose{to{transform:scale(1,.012);opacity:0;filter:brightness(3)}}
.sys.closing{transition:background 220ms;background:rgba(3,5,9,0)}
.sys-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(62,230,255,.04) 0 1px,rgba(0,0,0,0) 1px 3px);pointer-events:none}
.sys-head{display:flex;align-items:center;justify-content:center;gap:11px;padding:17px 16px 13px}
.sys-bang{width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--sc);color:var(--sc);font-family:var(--f-num,ui-monospace,monospace);font-weight:700;font-size:16px;box-shadow:0 0 12px -2px var(--sc),inset 0 0 8px -2px var(--sc)}
.sys-title{font-size:15px;font-weight:700;letter-spacing:.3em;color:#EAFBFF;text-shadow:0 0 14px var(--sc);font-family:var(--f-num,ui-monospace,monospace);white-space:nowrap}
.sys-rule{height:1px;margin:0 18px;background:linear-gradient(90deg,rgba(0,0,0,0),var(--sc),rgba(0,0,0,0));opacity:.7}
.sys-body{padding:14px 20px 0;display:flex;flex-direction:column;align-items:center;text-align:center}
.sys-emblem{width:136px;height:136px;position:relative}
.sys-emblem svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 10px var(--sc))}
.sys-emblem .hex{fill:rgba(62,230,255,.07);stroke:var(--sc);stroke-width:2;stroke-linejoin:round}
.sys-emblem .hex.in{fill:none;stroke-width:.8;opacity:.55}
.sys-emblem .ring{fill:none;stroke:var(--sc);stroke-width:1.2;stroke-dasharray:3 8;opacity:.7;transform-origin:60px 60px;animation:sysspin 16s linear infinite}
.sys-emblem .ring.r2{stroke-dasharray:16 11;opacity:.4;animation-duration:9s;animation-direction:reverse}
@keyframes sysspin{to{transform:rotate(360deg)}}
.sys-emblem .q{font-family:var(--f-num,ui-monospace,monospace);font-size:52px;font-weight:700;fill:var(--sc)}
.sys-emblem .glyph path{fill:none;stroke:var(--sc);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.sys-emblem.sealed svg{animation:syspulse 1.7s ease-in-out infinite}
@keyframes syspulse{0%,100%{transform:scale(1);opacity:.82}50%{transform:scale(1.05);opacity:1}}
.sys-emblem.revealed svg{animation:sysslam 560ms cubic-bezier(.2,1.5,.35,1)}
@keyframes sysslam{0%{transform:scale(2.6);opacity:0;filter:drop-shadow(0 0 40px #fff) brightness(3)}55%{opacity:1}100%{transform:none}}
.sys-emblem.revealed .hex{fill:color-mix(in srgb,var(--sc) 16%,transparent)}
.sys-emblem.revealed .ring{animation-duration:5s;opacity:.9}
.sys-stack{min-height:150px;width:100%;margin-top:8px;display:flex;flex-direction:column;align-items:center}
.sys-msg{font-size:16px;line-height:1.45;color:#D6F3FC;min-height:24px}
.sys-sub{margin-top:8px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--sc);opacity:.75;font-family:var(--f-num,ui-monospace,monospace)}
.sys-hint{margin-top:14px;font-size:13px;color:#7FA6B6}
.sys-name{font-family:var(--f-num,ui-monospace,monospace);font-size:27px;line-height:1.15;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--sc);text-shadow:0 0 20px var(--sc),0 0 2px #fff;min-height:32px;overflow-wrap:anywhere}
.sys.legendary .sys-name{text-shadow:0 0 22px #B6FF3B,0 0 44px #3EE6FF,0 0 2px #fff}
.sys.legendary .sys-win{box-shadow:0 0 70px -12px #B6FF3B,0 0 46px -14px #3EE6FF,inset 0 0 44px rgba(182,255,59,.08)}
.sys.legendary .sys-win::before,.sys.legendary .sys-win::after{background:#EAFFD0;box-shadow:0 0 16px #B6FF3B,0 0 34px #3EE6FF}
.sys.legendary .sys-emblem svg{filter:drop-shadow(0 0 12px #B6FF3B) drop-shadow(0 0 26px #3EE6FF)}
.sys-grade{margin-top:7px;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--sc);font-family:var(--f-num,ui-monospace,monospace)}
.sys-desc{margin-top:13px;font-size:14px;color:#D6F3FC}
.sys-desc b{color:#7FA6B6;font-weight:500}
.sys-flavor{margin-top:6px;font-size:13px;line-height:1.4;color:#7FA6B6;font-style:italic}
.sys-fade{opacity:0;transform:translateY(6px)}
.sys-fade.show{opacity:1;transform:none;transition:opacity 320ms,transform 320ms}
.sys-btn{display:block;margin:16px auto 0;min-width:212px;height:48px;padding:0 18px;border:1px solid var(--sc);background:rgba(62,230,255,.07);color:var(--sc);font-family:var(--f-num,ui-monospace,monospace);font-size:14px;font-weight:700;letter-spacing:.22em;opacity:.45;transition:opacity 200ms,background 200ms,color 200ms,box-shadow 200ms;cursor:pointer}
.sys-btn.armed{opacity:1;animation:sysarm 1.5s ease-in-out infinite}
@keyframes sysarm{0%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 0 22px -4px var(--sc)}}
.sys-btn.solid.armed{background:var(--sc);color:#04121A;animation:none;box-shadow:0 0 28px -4px var(--sc)}
.sys-count{margin-top:10px;text-align:center;font-size:11px;letter-spacing:.22em;color:#58798A;font-family:var(--f-num,ui-monospace,monospace);min-height:14px}
@media (prefers-reduced-motion:reduce){.sys *,.sys-win{animation:none!important;transition:none!important}}
`;

  // ------------------------------------------------------------------ canvas effects
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  function makeFX(back, front) {
    const B = back.getContext('2d'), F = front.getContext('2d');
    let W = 0, H = 0, parts = [], rings = [], pillar = null, amb = null, alive = false, last = 0, timers = [];
    const sprites = {};
    function sprite(c) {
      const k = c.join(',');
      if (sprites[k]) return sprites[k];
      const s = document.createElement('canvas'); s.width = s.height = 64;
      const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, rgba(c, .95)); gr.addColorStop(.3, rgba(c, .45)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      return (sprites[k] = s);
    }
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = back.clientWidth; H = back.clientHeight;
      for (const cv of [back, front]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
    }
    function ring(x, y, r, v, c, w, delay) { const add = () => rings.push({ x, y, r, v, c, w, a: 1 }); if (delay) timers.push(setTimeout(add, delay)); else add(); }
    function sparks(x, y, n, pal, speed) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, sp = rnd(.25, 1) * speed;
        parts.push({ k: 'spark', front: true, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 60, age: 0, max: rnd(.55, 1.35), s: rnd(1, 2.6), c: pick(pal), drag: rnd(1.4, 2.6), g: rnd(120, 300) });
      }
    }
    function shards(x, y, n, pal) {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, sp = rnd(140, 460);
        parts.push({ k: 'shard', front: true, x: x + Math.cos(ang) * 30, y: y + Math.sin(ang) * 30, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, age: 0, max: rnd(.6, 1.1), s: rnd(6, 15), rot: rnd(0, 6.3), vr: rnd(-9, 9), c: pal[0], drag: 1.6, g: 260 });
      }
    }
    // the seal breaks
    function burst(x, y, pal, power) {
      pillar = { x, age: 0, a: 1, w: 46 + 26 * power, c: pal[0] };
      ring(x, y, 8, 980, pal[0], 5); ring(x, y, 4, 620, WHITE, 2.5, 60); ring(x, y, 4, 430, pal[1], 3, 150);
      sparks(x, y, Math.round(80 * power), pal, 640);
      shards(x, y, Math.round(12 + 5 * power), pal);
      for (let i = 0; i < 26 * power; i++) parts.push({ k: 'flame', front: true, x: x + rnd(-40, 40), y: y + rnd(-20, 40), vx: rnd(-90, 90), vy: rnd(-320, -90), age: 0, max: rnd(.5, 1.1), r: rnd(22, 60), c: pick(pal.slice(0, 2)), a: .5 });
      // stronger grades hit again
      const waves = power >= 2.2 ? [260, 520, 800] : power >= 1.6 ? [280, 560] : power >= 1.3 ? [300] : [];
      waves.forEach((ms, i) => timers.push(setTimeout(() => {
        if (!alive) return;
        ring(x, y, 6, 820 - i * 90, pal[i % 2], 4); sparks(x, y, Math.round(34 * power), pal, 520); pillar = { x, age: .12, a: .7, w: 40 + 18 * power, c: pal[(i + 1) % 2] };
      }, ms)));
    }
    // continuous aura: fire along the bottom edge, drifting motes, optional halo behind the emblem
    function ambient(cfg) { amb = cfg ? Object.assign({ acc: 0 }, cfg) : null; }
    function emit(dt) {
      if (!amb) return;
      amb.acc += dt * amb.rate;
      while (amb.acc >= 1) {
        amb.acc -= 1;
        parts.push({ k: 'flame', x: rnd(-10, W + 10), y: H + 24, vx: rnd(-14, 14), vy: -rnd(150, 340) * amb.lift, age: 0, max: rnd(.7, 1.5), r: rnd(16, 40), tall: rnd(1.7, 2.6), c: pick(amb.c.slice(0, 2)), a: amb.alpha });
        if (Math.random() < .22) parts.push({ k: 'mote', front: true, x: rnd(0, W), y: rnd(H * .3, H), vx: rnd(-10, 10), vy: -rnd(16, 60), age: 0, max: rnd(1.8, 3.6), r: rnd(.7, 2), c: pick(amb.c) });
        if (amb.halo && Math.random() < .3) {
          const ang = Math.random() * Math.PI * 2, rr = rnd(34, 70);
          parts.push({ k: 'flame', front: true, x: amb.x + Math.cos(ang) * rr, y: amb.y + Math.sin(ang) * rr * .7 + 14, vx: rnd(-20, 20), vy: -rnd(40, 120), age: 0, max: rnd(.7, 1.4), r: rnd(16, 34), c: pick(amb.c.slice(0, 2)), a: amb.alpha * .55 });
        }
      }
    }
    function frame(now) {
      if (!alive) return;
      const dt = Math.min(.034, Math.max(.001, (now - last) / 1000)); last = now;
      emit(dt);
      B.clearRect(0, 0, W, H); F.clearRect(0, 0, W, H);
      B.globalCompositeOperation = F.globalCompositeOperation = 'lighter';
      if (pillar) {
        pillar.age += dt; pillar.a *= Math.pow(.07, dt);
        if (pillar.a < .015) pillar = null;
        else for (const [ctx, k] of [[B, 1], [F, .28]]) {
          const top = H * Math.max(0, 1 - pillar.age / .14), w = pillar.w * (.45 + .55 * pillar.a);
          const g = ctx.createLinearGradient(pillar.x - w, 0, pillar.x + w, 0);
          g.addColorStop(0, rgba(pillar.c, 0)); g.addColorStop(.35, rgba(pillar.c, .5 * pillar.a * k)); g.addColorStop(.5, rgba(WHITE, .95 * pillar.a * k)); g.addColorStop(.65, rgba(pillar.c, .5 * pillar.a * k)); g.addColorStop(1, rgba(pillar.c, 0));
          ctx.fillStyle = g; ctx.fillRect(pillar.x - w, top, w * 2, H - top);
        }
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.r += r.v * dt; r.v *= 1 - 1.5 * dt; r.a -= 1.25 * dt;
        if (r.a <= 0) { rings.splice(i, 1); continue; }
        F.strokeStyle = rgba(r.c, r.a * .9); F.lineWidth = 1 + r.w * r.a; F.beginPath(); F.arc(r.x, r.y, r.r, 0, 6.2832); F.stroke();
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age >= p.max) { parts.splice(i, 1); continue; }
        const t = p.age / p.max, ctx = p.front ? F : B;
        if (p.k === 'flame') {
          p.x += (p.vx + Math.sin(p.age * 5 + p.r) * 16) * dt; p.y += p.vy * dt;
          const a = p.a * (t < .18 ? t / .18 : 1 - (t - .18) / .82), r = p.r * (1 - .5 * t);
          const hh = r * (p.tall || 1); ctx.globalAlpha = Math.max(0, a); ctx.drawImage(sprite(p.c), p.x - r, p.y - hh, r * 2, hh * 2); ctx.globalAlpha = 1;
        } else if (p.k === 'mote') {
          p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.fillStyle = rgba(p.c, .8 * Math.sin(Math.PI * t)); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        } else {
          p.vx *= 1 - p.drag * dt; p.vy = p.vy * (1 - p.drag * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.k === 'spark') {
            ctx.strokeStyle = rgba(p.c, 1 - t); ctx.lineWidth = p.s * (1 - .5 * t); ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); ctx.stroke();
          } else {
            p.rot += p.vr * dt;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillStyle = rgba(p.c, .32 * (1 - t)); ctx.strokeStyle = rgba(p.c, .95 * (1 - t)); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.lineTo(p.s * .8, p.s * .7); ctx.lineTo(-p.s * .6, p.s * .4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
          }
        }
      }
      if (parts.length > 900) parts.splice(0, parts.length - 900);
      requestAnimationFrame(frame);
    }
    return {
      start() { if (alive) return; size(); alive = true; last = performance.now(); requestAnimationFrame(frame); },
      stop() { alive = false; parts = []; rings = []; pillar = null; amb = null; timers.forEach(clearTimeout); timers = []; B.clearRect(0, 0, W, H); F.clearRect(0, 0, W, H); },
      size, burst, ambient,
      get count() { return parts.length + rings.length; },
    };
  }

  // ------------------------------------------------------------------ DOM
  let root = null, el = {}, fx = null, pendingTap = null, queue = Promise.resolve(), gen = 0;

  function emblemSVG(icon, sealed) {
    return '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring" cx="60" cy="60" r="57"/><circle class="ring r2" cx="60" cy="60" r="51"/>' +
      '<path class="hex" d="M60 12L101.6 36V84L60 108L18.4 84V36Z"/><path class="hex in" d="M60 22L92.9 41V79L60 98L27.1 79V41Z"/>' +
      (sealed ? '<text class="q" x="60" y="78" text-anchor="middle">?</text>' : '<g class="glyph" transform="translate(36 36) scale(2)"><path d="' + (ICONS[icon] || ICONS.eye) + '"/></g>') + '</svg>';
  }
  function ensure() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.className = 'sys'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'System notification');
    root.innerHTML = '<canvas class="sys-back"></canvas>' +
      '<div class="sys-win"><div class="sys-scan"></div>' +
      '<div class="sys-head"><span class="sys-bang">!</span><span class="sys-title" aria-live="assertive"></span></div><div class="sys-rule"></div>' +
      '<div class="sys-body"><div class="sys-emblem"></div><div class="sys-stack"></div></div>' +
      '<button class="sys-btn" type="button" data-sys-next></button><div class="sys-count"></div></div>' +
      '<canvas class="sys-front"></canvas><div class="sys-flash"></div>';
    document.body.appendChild(root);
    for (const k of ['win', 'title', 'emblem', 'stack', 'btn', 'count', 'flash']) el[k] = root.querySelector('.sys-' + k);
    fx = makeFX(root.querySelector('.sys-back'), root.querySelector('.sys-front'));
    root.addEventListener('click', () => { if (pendingTap) pendingTap(); });
    document.addEventListener('keydown', e => { if (root.classList.contains('on') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (pendingTap) pendingTap(); } });
    window.addEventListener('resize', () => { if (root.classList.contains('on')) fx.size(); });
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function anim(node, cls, ms) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); return sleep(ms).then(() => node.classList.remove(cls)); }
  function waitTap(delay) {
    el.btn.classList.remove('armed');
    const arm = setTimeout(() => el.btn.classList.add('armed'), delay);
    return new Promise(res => { const t0 = performance.now(); pendingTap = () => { if (performance.now() - t0 < delay) return; clearTimeout(arm); pendingTap = null; el.btn.classList.remove('armed'); res(); }; });
  }
  function typeText(node, text, cps) {
    if (reduced()) { node.textContent = text; return Promise.resolve(); }
    const my = gen; node.textContent = '';
    return new Promise(res => { let i = 0; const t = setInterval(() => { if (my !== gen) { clearInterval(t); return res(); } node.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(t); res(); } }, 1000 / cps); });
  }
  function decode(node, text, ms) {
    if (reduced()) { node.textContent = text; return Promise.resolve(); }
    const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%<>/', my = gen, t0 = performance.now();
    return new Promise(res => (function tick(now) {
      if (my !== gen) return res();
      const p = Math.min(1, (now - t0) / ms), n = Math.floor(p * text.length); let out = '';
      for (let i = 0; i < text.length; i++) out += i < n || text[i] === ' ' ? text[i] : pool[(Math.random() * pool.length) | 0];
      node.textContent = out;
      if (p < 1) requestAnimationFrame(tick); else { node.textContent = text; res(); }
    })(t0));
  }
  const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  function emblemCenter() { const r = el.emblem.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function setColor(css, flash) { root.style.setProperty('--sc', css); root.style.setProperty('--sf', flash || css); }

  async function showSealed(item, i, total, first) {
    gen++; root.dataset.stage = 'sealed'; root.classList.remove('legendary'); setColor(SEAL.css);
    el.title.textContent = 'NOTIFICATION';
    el.emblem.className = 'sys-emblem sealed'; el.emblem.innerHTML = emblemSVG(null, true);
    el.stack.innerHTML = '<div class="sys-msg"></div><div class="sys-sub sys-fade">Sealed</div><div class="sys-hint sys-fade">Tap to break the seal.</div>';
    el.btn.className = 'sys-btn'; el.btn.textContent = '[ REVEAL ]';
    el.count.textContent = total > 1 ? (i + 1) + ' / ' + total : '';
    fx.ambient({ rate: 46, lift: .75, alpha: .34, c: SEAL.c });
    buzz(25);
    if (!reduced()) await anim(el.win, first ? 'open' : 'swap', first ? 460 : 300);
    const wait = waitTap(420);
    typeText(el.stack.querySelector('.sys-msg'), 'You have acquired a new title.', 46).then(() => { el.stack.querySelectorAll('.sys-fade').forEach((n, k) => setTimeout(() => n.classList.add('show'), 140 * k)); });
    await wait;
  }
  async function showRevealed(item, i, total, first, onRevealed) {
    gen++; const g = GRADE[item.rarity] || GRADE.common;
    root.dataset.stage = 'revealed'; root.classList.toggle('legendary', item.rarity === 'legendary'); setColor(g.css, g.flash);
    el.emblem.className = 'sys-emblem revealed'; el.emblem.innerHTML = emblemSVG(item.icon, false);
    el.stack.innerHTML = '<div class="sys-name"></div><div class="sys-grade sys-fade"></div><div class="sys-desc sys-fade"></div><div class="sys-flavor sys-fade"></div>';
    const q = s => el.stack.querySelector(s);
    q('.sys-grade').textContent = g.label; q('.sys-desc').innerHTML = '<b>Condition met</b> · '; q('.sys-desc').appendChild(document.createTextNode(item.desc || '')); q('.sys-flavor').textContent = item.flavor || '';
    el.btn.className = 'sys-btn solid'; el.btn.textContent = i < total - 1 ? '[ NEXT ]' : '[ ACCEPT ]';
    el.count.textContent = total > 1 ? (i + 1) + ' / ' + total : '';
    if (onRevealed) { try { onRevealed(item.id); } catch (e) {} }
    if (!reduced()) {
      if (first && !root.dataset.opened) { root.dataset.opened = '1'; await anim(el.win, 'open', 300); }
      const [x, y] = emblemCenter();
      fx.burst(x, y, g.c, g.power);
      fx.ambient({ rate: 60 + 38 * g.power, lift: .95 + .22 * g.power, alpha: .36 + .06 * g.power, c: g.c, halo: true, x, y });
      anim(el.flash, 'go', 560); anim(el.win, 'shake', 420);
      buzz(g.power >= 2.2 ? [40, 50, 40, 50, 40, 60, 220] : g.power >= 1.6 ? [40, 50, 40, 60, 160] : [35, 45, 110]);
    }
    decode(el.title, 'TITLE ACQUIRED', 420);
    const wait = waitTap(1150);
    await sleep(reduced() ? 0 : 240);
    await decode(q('.sys-name'), item.name, 780);
    ['.sys-grade', '.sys-desc', '.sys-flavor'].forEach((s, k) => setTimeout(() => { const n = q(s); if (n) n.classList.add('show'); }, 90 * k));
    await wait;
  }

  async function run(items, opts) {
    ensure(); delete root.dataset.opened;
    root.classList.remove('closing'); root.classList.add('on'); fx.start();
    const sealed = opts.sealed !== false;
    for (let i = 0; i < items.length; i++) {
      if (sealed) await showSealed(items[i], i, items.length, i === 0);
      if (sealed) root.dataset.opened = '1';
      await showRevealed(items[i], i, items.length, i === 0, opts.onRevealed);
    }
    gen++; root.classList.add('closing');
    await sleep(reduced() ? 0 : 230);
    root.classList.remove('on', 'closing', 'legendary'); delete root.dataset.stage; fx.stop();
  }
  function reveal(items, opts) {
    items = (items || []).filter(Boolean);
    if (!items.length) return Promise.resolve();
    queue = queue.then(() => run(items, opts || {})).catch(e => { console.warn('system reveal failed', e); if (root) { root.classList.remove('on'); if (fx) fx.stop(); } });
    return queue;
  }

  window.ARISE_SYSTEM = { reveal, GRADE, get active() { return !!(root && root.classList.contains('on')); }, get particles() { return fx ? fx.count : 0; } };
})();
