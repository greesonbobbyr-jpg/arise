// Sound effects: render every sound offline and check it is audible, not clipping and the right length.
// Also writes WAV previews so a person can listen. Nobody can hear a headless browser, so this is the automated half.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html?demo#profile" "" 390 e2e/sound.js
const path = require('path'), fs = require('fs');
module.exports = async (ctx) => {
  const { evalFn } = ctx;
  const { check, done, SHOTS } = require('./lib')(ctx);
  const OUT = path.join(SHOTS, 'sounds'); fs.mkdirSync(OUT, { recursive: true });
  check('sound engine is loaded', await evalFn(`!!window.ARISE_SFX && window.ARISE_SFX.supported && window.ARISE_SFX.names.join(',') === 'notify,seal,tick,accept,rankup'`), await evalFn('window.ARISE_SFX && window.ARISE_SFX.names'));
  // name, options, file, min seconds, max seconds
  const cases = [
    ['notify', {}, '1-notification', 1.2, 2],
    ['seal', { power: 1 }, '2-seal-common', 1.6, 3],
    ['seal', { power: 1.35 }, '3-seal-rare', 1.8, 3.2],
    ['seal', { power: 1.75 }, '4-seal-epic', 2, 3.6],
    ['seal', { power: 2.4 }, '5-seal-legendary', 3, 5],
    ['tick', { step: 0 }, '6-cascade-tick', 0.2, 0.7],
    ['accept', {}, '7-accept', 0.2, 0.7],
    ['rankup', {}, '8-rank-up', 2, 3.2],
  ];
  const res = {};
  for (const [name, opts, file, lo, hi] of cases) {
    const r = await evalFn(`(async () => {
      const r = await window.ARISE_SFX.render(${JSON.stringify(name)}, ${JSON.stringify(opts)}); if (!r) return null;
      const s = r.samples, sr = r.sampleRate; let nan = 0, dc = 0, early = 0, late = 0, last = 0;
      for (let i = 0; i < s.length; i++) { const v = s[i]; if (!(v === v)) nan++; dc += v; if (i < sr * 0.12) early += v * v; if (i > s.length - sr * 0.1) late += v * v; if (Math.abs(v) > 0.003) last = i; }
      const bytes = window.ARISE_SFX.wav(r); let bin = ''; for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
      return { seconds: r.seconds, peak: r.peak, rms: r.rms, nan, dc: Math.abs(dc / s.length), early: Math.sqrt(early / (sr * 0.12)), tail: Math.sqrt(late / (sr * 0.1)), audible: last / sr, wav: btoa(bin) };
    })()`);
    if (!r) { check(file + ' renders', false); continue; }
    fs.writeFileSync(path.join(OUT, 'arise-' + file + '.wav'), Buffer.from(r.wav, 'base64'));
    res[file] = r;
    const ok = r.nan === 0 && r.seconds >= lo && r.seconds <= hi && r.peak >= 0.12 && r.peak <= 0.99 && r.rms >= 0.012 && r.dc < 0.01 && r.early > 0.01 && r.tail < 0.02;
    check(file + ': audible, no clipping, clean start and finish', ok, { s: +r.seconds.toFixed(2), peak: +r.peak.toFixed(2), rms: +r.rms.toFixed(3), attack: +r.early.toFixed(3), tail: +r.tail.toFixed(4), heardFor: +r.audible.toFixed(2) });
  }
  const a = n => res[n] ? res[n].audible : 0;
  check('higher grades ring longer (common < rare < epic < legendary)', a('2-seal-common') < a('3-seal-rare') && a('3-seal-rare') <= a('4-seal-epic') && a('4-seal-epic') < a('5-seal-legendary'), [a('2-seal-common'), a('3-seal-rare'), a('4-seal-epic'), a('5-seal-legendary')].map(x => +x.toFixed(2)));
  check('the cascade tick climbs in pitch', await evalFn(`(async () => { const z = async st => { const r = await window.ARISE_SFX.render('tick', { step: st }); let c = 0; for (let i = 1; i < r.sampleRate * 0.1; i++) if ((r.samples[i - 1] < 0) !== (r.samples[i] < 0)) c++; return c; }; return (await z(0)) < (await z(4)) && (await z(4)) < (await z(9)); })()`));
  check('play() respects the off switch', await evalFn(`(() => { const S = window.ARISE_SFX, was = S.enabled; S.enabled = false; const off = S.play('accept'); S.enabled = was; return off === false; })()`));
  console.log('  previews written to ' + OUT);
  done('sound');
};
