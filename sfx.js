/* Arise sound effects. Synthesized with the Web Audio API: no audio files, works offline.
   Sounds only play for the System (title notification, seal break, accept) and rank-ups. Nothing during set logging.

   API  ARISE_SFX.play(name, { power })   name: notify | seal | accept | rankup   power 1 (common) … 2.4 (legendary)
        ARISE_SFX.enabled = true|false     (Profile toggle)
        ARISE_SFX.unlock()                 call inside a tap so mobile browsers allow audio
        ARISE_SFX.render(name, opts)       → Promise<{ samples: Float32Array, sampleRate, peak, rms, seconds }>, offline, for tests
        ARISE_SFX.wav(rendered)            → Uint8Array (16-bit mono WAV), for previews */
(function () {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  let ctx = null, bus = null, enabled = true;

  // ---- building blocks. Every helper schedules nodes on `ac` into `out`, starting at time t.
  function env(g, t, peak, attack, decay) {       // fast attack, exponential decay to silence
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function tone(ac, out, o) {                      // o: type, f0, f1?, t, gain, attack, decay, detune?
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f0, o.t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, o.t + (o.glide || o.decay));
    if (o.detune) osc.detune.value = o.detune;
    env(g, o.t, o.gain, o.attack || 0.005, o.decay);
    osc.connect(g); g.connect(out);
    osc.start(o.t); osc.stop(o.t + (o.attack || 0.005) + o.decay + 0.05);
  }
  let noiseCache = null;
  function noiseBuffer(ac) {
    if (noiseCache && noiseCache.sampleRate === ac.sampleRate) return noiseCache;
    const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0);
    let seed = 1234567;                              // deterministic, so offline renders are repeatable
    for (let i = 0; i < d.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = seed / 2147483648 - 1; }
    return (noiseCache = b);
  }
  function noise(ac, out, o) {                     // o: t, dur, gain, type, f0, f1?, q, attack?
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuffer(ac); src.loop = true;
    f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f0, o.t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, o.t + o.dur);
    g.gain.setValueAtTime(0.0001, o.t);
    g.gain.exponentialRampToValueAtTime(o.gain, o.t + (o.attack || o.dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(o.t); src.stop(o.t + o.dur + 0.05);
  }
  function impact(ac, out, t, gain) {              // a low hit: pitch drops from 120 Hz to 36 Hz, with a short click on top
    tone(ac, out, { type: 'sine', f0: 120, f1: 36, glide: 0.34, t, gain, attack: 0.004, decay: 0.55 });
    tone(ac, out, { type: 'triangle', f0: 62, f1: 31, glide: 0.4, t, gain: gain * 0.5, attack: 0.004, decay: 0.7 });
    noise(ac, out, { t, dur: 0.07, gain: gain * 0.5, type: 'highpass', f0: 1800, q: 0.7, attack: 0.002 });
  }
  function echo(ac, out, time, feedback) {         // returns an input node; dry passes straight through, repeats fade
    const input = ac.createGain(), d = ac.createDelay(1), fb = ac.createGain(), wet = ac.createGain();
    d.delayTime.value = time; fb.gain.value = feedback; wet.gain.value = 0.5;
    input.connect(out); input.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(out);
    return input;
  }

  // ---- the sounds. Each returns its length in seconds.
  const D5 = 587.33, FS5 = 739.99, A5 = 880, D6 = 1174.66, FS6 = 1479.98, A6 = 1760, E6 = 1318.51, A3 = 220, E4 = 329.63, A4 = 440, CS5 = 554.37;
  const SOUNDS = {
    // the System window opens: two glassy notes a fifth apart, with a soft echo
    notify(ac, out, t) {
      const e = echo(ac, out, 0.17, 0.28);
      tone(ac, e, { type: 'sine', f0: A5, t, gain: 0.3, attack: 0.004, decay: 0.5 });
      tone(ac, e, { type: 'triangle', f0: A5 * 2, t, gain: 0.05, attack: 0.004, decay: 0.25 });
      tone(ac, e, { type: 'sine', f0: E6, t: t + 0.12, gain: 0.26, attack: 0.004, decay: 0.6 });
      tone(ac, e, { type: 'triangle', f0: E6 * 2, t: t + 0.12, gain: 0.04, attack: 0.004, decay: 0.3 });
      return 1.4;
    },
    // the seal breaks: low impact, a rising rush of air, then a bright chord that hangs. Higher grades hit again and ring longer.
    seal(ac, out, t, o) {
      const p = Math.max(1, Math.min(2.4, (o && o.power) || 1)), tail = 1.1 + 0.55 * p;
      impact(ac, out, t, 0.9);
      noise(ac, out, { t, dur: 0.55, gain: 0.3, type: 'bandpass', f0: 280, f1: 6400, q: 1.4 });
      const e = echo(ac, out, 0.23, 0.22);
      const chord = p >= 1.7 ? [D5, A5, D6, FS6, A6] : p >= 1.3 ? [D5, A5, D6, FS6] : [D5, A5, D6];
      chord.forEach((f, i) => {
        tone(ac, e, { type: 'triangle', f0: f, t: t + 0.07 + i * 0.012, gain: 0.11, attack: 0.05, decay: tail, detune: i % 2 ? 6 : -6 });
        tone(ac, e, { type: 'sine', f0: f * 2, t: t + 0.07 + i * 0.012, gain: 0.03, attack: 0.08, decay: tail * 0.7 });
      });
      if (p >= 1.3) impact(ac, out, t + 0.3, 0.5);
      if (p >= 1.7) { impact(ac, out, t + 0.56, 0.42); noise(ac, out, { t: t + 0.28, dur: 0.5, gain: 0.16, type: 'bandpass', f0: 500, f1: 8000, q: 1.2 }); }
      if (p >= 2.2) {                                 // legendary: a rising figure over the chord, and one more hit
        [D5, FS5, A5, D6, FS6, A6].forEach((f, i) => tone(ac, e, { type: 'sine', f0: f, t: t + 0.62 + i * 0.075, gain: 0.16, attack: 0.006, decay: 0.55 }));
        impact(ac, out, t + 0.82, 0.38);
        return 0.62 + 6 * 0.075 + tail + 0.4;
      }
      return 0.2 + tail + 0.5;
    },
    // accepting a title: a short, low confirmation
    accept(ac, out, t) {
      tone(ac, out, { type: 'triangle', f0: 520, f1: 392, glide: 0.09, t, gain: 0.28, attack: 0.003, decay: 0.14 });
      tone(ac, out, { type: 'sine', f0: 1040, t, gain: 0.07, attack: 0.002, decay: 0.05 });
      return 0.3;
    },
    // rank up: two hits and a rising major chord
    rankup(ac, out, t) {
      impact(ac, out, t, 0.9); impact(ac, out, t + 0.22, 0.6);
      const e = echo(ac, out, 0.2, 0.25);
      [A3, E4, A4, CS5, A5].forEach((f, i) => {
        tone(ac, e, { type: 'triangle', f0: f, t: t + 0.1 + i * 0.07, gain: 0.13, attack: 0.02, decay: 1.5 });
        tone(ac, e, { type: 'sine', f0: f * 2, t: t + 0.1 + i * 0.07, gain: 0.04, attack: 0.04, decay: 1.0 });
      });
      noise(ac, out, { t, dur: 0.6, gain: 0.22, type: 'bandpass', f0: 300, f1: 5200, q: 1.3 });
      return 2.4;
    },
  };

  // master: a little headroom, then a compressor so stacked layers never clip
  function makeBus(ac) {
    const g = ac.createGain(), c = ac.createDynamicsCompressor();
    g.gain.value = 0.7; c.threshold.value = -14; c.knee.value = 12; c.ratio.value = 6; c.attack.value = 0.003; c.release.value = 0.2;
    g.connect(c); c.connect(ac.destination);
    return g;
  }
  function ensure() {
    if (!AC) return false;
    if (!ctx) { try { ctx = new AC(); bus = makeBus(ctx); } catch (e) { ctx = null; return false; } }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return true;
  }
  function play(name, opts) {
    if (!enabled || !SOUNDS[name] || !ensure()) return false;
    try { SOUNDS[name](ctx, bus, ctx.currentTime + 0.02, opts || {}); return true; } catch (e) { return false; }
  }
  // offline render of one sound, for automated checks and previews
  async function render(name, opts) {
    if (!OAC || !SOUNDS[name]) return null;
    const sr = 44100, probe = new OAC(1, sr, sr), len = SOUNDS[name](probe, probe.destination, 0, opts || {});
    const ac = new OAC(1, Math.ceil(sr * (len + 0.2)), sr);
    SOUNDS[name](ac, makeBus(ac), 0.01, opts || {});
    const buf = await ac.startRendering(), samples = buf.getChannelData(0);
    let peak = 0, sum = 0; for (let i = 0; i < samples.length; i++) { const a = Math.abs(samples[i]); if (a > peak) peak = a; sum += a * a; }
    return { samples, sampleRate: sr, peak, rms: Math.sqrt(sum / samples.length), seconds: samples.length / sr };
  }
  function wav(r) {
    const n = r.samples.length, out = new Uint8Array(44 + n * 2), v = new DataView(out.buffer);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, r.sampleRate, true); v.setUint32(28, r.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, r.samples[i])) * 32767, true);
    return out;
  }

  window.ARISE_SFX = {
    play, render, wav, names: Object.keys(SOUNDS),
    unlock() { if (enabled) ensure(); },
    get enabled() { return enabled; }, set enabled(v) { enabled = !!v; },
    get supported() { return !!AC; },
  };
})();
