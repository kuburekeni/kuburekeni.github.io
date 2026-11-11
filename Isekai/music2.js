// =====================================================================
//  music2.js : the orchestra, upgraded
//   The live synth has to keep every instrument cheap, because it builds
//   a little graph of oscillators for every single note. Here each
//   instrument is played *once*, at its best, into a sample — seven-voice
//   string sections with bow noise and body resonance, breathy flutes
//   with a chiff, brass with a lip, a formant choir, plucked harp and
//   lute strings modelled properly, and a new grand piano — then the
//   score plays those samples, repitched. It sounds richer and costs the
//   Pi far less, since each note is one sample instead of a dozen nodes.
//   Loudness is matched to the original instruments automatically.
//   Until a sample set is ready (a few seconds after the first sound),
//   the original synth plays, so nothing ever goes silent.
// =====================================================================
const Sampler = {
  SR: 32000, sets: {}, ready: {}, building: false,
  // instrument -> [lowest midi, highest midi, step, seconds, release]
  PLAN: {
    harp: [36, 100, 4, 3.0, 0], pluck: [36, 88, 4, 1.6, 0], piano: [33, 100, 3, 3.2, 0.25],
    strings: [36, 96, 4, 4.6, 0.5], flute: [55, 100, 4, 4.0, 0.2], brass: [36, 84, 4, 4.0, 0.22],
    horn: [36, 80, 4, 4.0, 0.3], choir: [43, 84, 4, 4.6, 0.8]
  },
  ORDER: ['harp', 'strings', 'flute', 'piano', 'pluck', 'brass', 'horn', 'choir'],

  start() {
    if (this.building || !Sound.ctx) return;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return;
    this.building = true;
    (async () => {
      for (const name of this.ORDER) {
        try { await this.buildSet(name); this.ready[name] = true; }
        catch (e) { console.warn('sampler', name, e); }
      }
    })();
  },
  wait(ms) { return new Promise(r => setTimeout(r, ms)); },
  async buildSet(name) {
    const [lo, hi, step, secs] = this.PLAN[name], set = [];
    for (let m = lo; m <= hi; m += step) {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      let buf, f0 = f;
      if (name === 'harp' || name === 'pluck') ({ buf, f0 } = this.ks(f, secs, name));
      else if (name === 'piano') buf = this.piano(f, secs);
      else buf = await this.offline(name, f, secs);
      set.push({ m, f: f0, buf });
      await this.wait(12);                       // keep the game smooth while we work
    }
    // match loudness to the instrument it replaces, measured mid-range
    if (Sound.INST0[name] || name === 'piano') {
      const ref = set[Math.floor(set.length / 2)];
      const orig = await this.offlineOrig(name === 'piano' ? 'epiano' : name, ref.f, Math.min(2.4, this.PLAN[name][3]));
      const a = this.rms(orig, 0.05, name === 'harp' || name === 'pluck' || name === 'piano' ? 0.6 : 1.6), b = this.rms(ref.buf, 0.05, name === 'harp' || name === 'pluck' || name === 'piano' ? 0.6 : 1.6);
      const k = a > 1e-6 && b > 1e-6 ? a / b : 0.2;
      for (const s of set) { const d = s.buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] *= k; }
    }
    this.sets[name] = set;
  },
  rms(buf, t0, t1) { const d = buf.getChannelData(0), sr = buf.sampleRate, a = Math.floor(t0 * sr), b = Math.min(d.length, Math.floor(t1 * sr)); let s = 0; for (let i = a; i < b; i++) s += d[i] * d[i]; return Math.sqrt(s / Math.max(1, b - a)); },
  mkBuf(len) { return Sound.ctx.createBuffer(1, len, this.SR); },

  // ---- plucked strings: Karplus–Strong, with pluck position and a body
  ks(f, secs, kind) {
    const sr = this.SR, N = Math.max(2, Math.round(sr / f)), len = Math.floor(secs * sr), buf = this.mkBuf(len), y = buf.getChannelData(0);
    const ring = new Float32Array(N);
    // excitation: noise, softened (harp: warm; lute: brighter), with a comb for pluck position
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    const passes = kind === 'harp' ? 3 : 1;
    for (let p = 0; p < passes; p++) { let prev = ring[N - 1]; for (let i = 0; i < N; i++) { const v = ring[i]; ring[i] = (v + prev) * 0.5; prev = v; } }
    const pos = Math.max(1, Math.floor(N * (kind === 'harp' ? 0.5 : 0.18)));
    const ex = Float32Array.from(ring); for (let i = 0; i < N; i++) ring[i] = ex[i] - 0.6 * ex[(i + pos) % N];
    let mean = 0; for (let i = 0; i < N; i++) mean += ring[i]; mean /= N; for (let i = 0; i < N; i++) ring[i] -= mean;
    // decay per period: longer for low notes, harp rings longer than lute
    const t60 = kind === 'harp' ? Math.min(4.5, 1.2 + 900 / f) : Math.min(2.2, 0.5 + 300 / f);
    const g = Math.pow(0.001, 1 / (t60 * f));
    const bright = kind === 'harp' ? 0.42 : 0.5;
    let idx = 0, lp = 0, hp = 0, hpx = 0;
    for (let i = 0; i < len; i++) {
      const a = ring[idx], b = ring[(idx + 1) % N];
      const v = g * (bright * a + (1 - bright) * b);
      ring[idx] = v; idx = (idx + 1) % N;
      // body: gentle low-pass and a DC blocker
      lp += (a - lp) * (kind === 'harp' ? 0.55 : 0.75);
      hp = lp - hpx + 0.995 * hp; hpx = lp;
      y[i] = hp;
    }
    // a soft fade at the very end
    const fl = Math.floor(0.08 * sr); for (let i = 0; i < fl; i++) y[len - 1 - i] *= i / fl;
    this.norm(y);
    return { buf, f0: sr / N };
  },
  // ---- grand piano: inharmonic partials, two strings per note beating, a hammer thump
  piano(f, secs) {
    const sr = this.SR, len = Math.floor(secs * sr), buf = this.mkBuf(len), y = buf.getChannelData(0);
    const B = 0.00012 * Math.pow(f / 261.6, 1.1) + 0.00003;
    const base60 = Math.min(7, 2.4 * Math.pow(261.6 / f, 0.55) + 0.6);
    for (const det of [-0.0006, 0.0006]) {
      for (let n = 1; n <= 18; n++) {
        const fn = n * f * Math.sqrt(1 + B * n * n) * (1 + det); if (fn > sr * 0.45) break;
        const amp = Math.pow(n, -1.25) * (n === 1 ? 1 : 0.9) * Math.exp(-n * f / 9000) * 0.5;
        const t60 = base60 / (1 + (n - 1) * 0.32), k = Math.log(0.001) / (t60 * sr);
        const w = 2 * Math.PI * fn / sr; let c = Math.cos(w), s = Math.sin(w), re = 1, im = 0, e = 1, de = Math.exp(k);
        for (let i = 0; i < len; i++) { y[i] += amp * im * e; const r2 = re * c - im * s; im = re * s + im * c; re = r2; e *= de; if (e < 1e-5) break; }
      }
    }
    // hammer thump + attack shaping
    let lp = 0; for (let i = 0; i < Math.floor(0.03 * sr); i++) { lp += ((Math.random() * 2 - 1) - lp) * 0.25; y[i] += lp * 0.25 * (1 - i / (0.03 * sr)); }
    for (let i = 0; i < 64; i++) y[i] *= i / 64;
    const fl = Math.floor(0.1 * sr); for (let i = 0; i < fl; i++) y[len - 1 - i] *= i / fl;
    this.norm(y);
    return buf;
  },
  norm(y) { let p = 0; for (let i = 0; i < y.length; i++) p = Math.max(p, Math.abs(y[i])); if (p > 0) for (let i = 0; i < y.length; i++) y[i] /= p; },

  // ---- sustained instruments, rendered through a full-quality graph offline
  async offline(name, f, secs) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const c = new OAC(1, Math.floor(secs * this.SR), this.SR);
    const out = c.createGain(); out.connect(c.destination);
    const noise = c.createBuffer(1, this.SR * 2, this.SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const end = secs;
    const osc = (type, fr, det, dest, lvl) => { const o = c.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det || 0; const g = c.createGain(); g.gain.value = lvl == null ? 1 : lvl; o.connect(g); g.connect(dest); o.start(0); o.stop(end); return o; };
    const lfo = (rate, depth, delay, targets) => { const l = c.createOscillator(), g = c.createGain(); l.frequency.value = rate; g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, delay); g.gain.linearRampToValueAtTime(depth, delay + 0.5); l.connect(g); for (const t of targets) g.connect(t.detune); l.start(0); l.stop(end); };
    const filt = (type, fr, q, gain) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = fr; b.Q.value = q || 0.7; if (gain != null) b.gain.value = gain; return b; };
    const nz = (dest, type, fr, q, lvl) => { const s = c.createBufferSource(); s.buffer = noise; s.loop = true; const b = filt(type, fr, q); const g = c.createGain(); g.gain.value = lvl; s.connect(b); b.connect(g); g.connect(dest); s.start(0); s.stop(end); return g; };
    const env = c.createGain(); env.connect(out);
    switch (name) {
      case 'strings': {
        env.gain.setValueAtTime(0, 0); env.gain.linearRampToValueAtTime(1, 0.2);
        const body3 = filt('highshelf', 6000, 0.7, -5); body3.connect(env);
        const body2 = filt('peaking', 1200, 1.2, 2.5); body2.connect(body3);
        const body1 = filt('peaking', 420, 1.1, 3.5); body1.connect(body2);
        const lp = filt('lowpass', Math.min(7000, 1400 + f * 1.7), 0.5); lp.connect(body1);
        const os = [];
        for (const d of [-15, -10, -5, 0, 5, 10, 15]) { const o = osc('sawtooth', f, d + (Math.random() - 0.5) * 3, lp, 0.14); os.push(o); }
        for (let i = 0; i < os.length; i++) lfo(4.6 + i * 0.17, 7 + (i % 3) * 2, 0.22 + i * 0.03, [os[i]]);
        nz(lp, 'bandpass', Math.min(8000, f * 3), 1.5, 0.02);              // bow noise
        break;
      }
      case 'flute': {
        env.gain.setValueAtTime(0, 0); env.gain.linearRampToValueAtTime(1, 0.06);
        const os = [osc('sine', f, 0, env, 0.62), osc('sine', f * 2, 2, env, 0.13), osc('sine', f * 3, 0, env, 0.04), osc('triangle', f, 1, env, 0.08)];
        lfo(5.3, 11, 0.32, os);
        const br = nz(env, 'bandpass', Math.min(9000, f * 1.6), 2.2, 0.06);
        const ch = c.createGain(); ch.gain.setValueAtTime(0.35, 0); ch.gain.exponentialRampToValueAtTime(0.001, 0.07); nz(ch, 'bandpass', Math.min(10000, f * 4), 3, 1); ch.connect(env);
        // a little breath flutter
        const fl = c.createOscillator(), fg = c.createGain(); fl.frequency.value = 3.1; fg.gain.value = 0.02; fl.connect(fg); fg.connect(br.gain); fl.start(0); fl.stop(end);
        break;
      }
      case 'brass': {
        env.gain.setValueAtTime(0, 0); env.gain.linearRampToValueAtTime(1, 0.035);
        const lp = filt('lowpass', 300, 1.2); lp.connect(env);
        lp.frequency.setValueAtTime(260, 0); lp.frequency.linearRampToValueAtTime(Math.min(8000, f * 7), 0.07); lp.frequency.setTargetAtTime(Math.min(4600, f * 3.6), 0.08, 0.3);
        const os = [osc('sawtooth', f, -7, lp, 0.32), osc('sawtooth', f, 6, lp, 0.32), osc('sawtooth', f, 0, lp, 0.25), osc('square', f / 2, 0, lp, 0.12)];
        for (const o of os) { o.detune.setValueAtTime(o.detune.value - 35, 0); o.detune.linearRampToValueAtTime(o.detune.value, 0.05); }
        lfo(5.4, 6, 0.35, os);
        nz(lp, 'bandpass', Math.min(6000, f * 2), 2, 0.015);
        break;
      }
      case 'horn': {
        env.gain.setValueAtTime(0, 0); env.gain.linearRampToValueAtTime(1, 0.08);
        const bell = filt('peaking', 650, 1, 4); bell.connect(env);
        const lp = filt('lowpass', 200, 0.8); lp.connect(bell); lp.frequency.setValueAtTime(220, 0); lp.frequency.linearRampToValueAtTime(Math.min(3200, f * 3.2), 0.12); lp.frequency.setTargetAtTime(Math.min(2000, f * 2.3), 0.14, 0.3);
        const os = [osc('sawtooth', f, -5, lp, 0.36), osc('sawtooth', f, 5, lp, 0.3), osc('triangle', f, 0, lp, 0.4)];
        lfo(5, 5, 0.4, os);
        break;
      }
      case 'choir': {
        env.gain.setValueAtTime(0, 0); env.gain.linearRampToValueAtTime(1, 0.35);
        const mix = c.createGain();
        for (const [fq, q, lv] of [[730, 7, 2.2], [1090, 8, 1.5], [2440, 9, 0.6], [3300, 10, 0.25]]) { const b = filt('bandpass', fq, q); const g = c.createGain(); g.gain.value = lv; mix.connect(b); b.connect(g); g.connect(env); }
        const body = filt('lowpass', 900, 0.4); const bg = c.createGain(); bg.gain.value = 0.22; body.connect(bg); bg.connect(env);
        const os = [];
        for (const d of [-16, -9, -3, 3, 9, 16]) { const o = osc('sawtooth', f, d, mix, 0.17); o.connect(body); os.push(o); }
        for (let i = 0; i < os.length; i++) lfo(4.9 + i * 0.13, 12, 0.25 + i * 0.04, [os[i]]);
        nz(mix, 'bandpass', 1800, 1, 0.03);
        break;
      }
    }
    const b = await c.startRendering();
    const y = b.getChannelData(0); this.norm(y);
    return b;
  },
  // the original live instrument, recorded, for loudness matching
  async offlineOrig(name, f, secs) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const c = new OAC(1, Math.floor(secs * this.SR), this.SR);
    const px = Object.create(Sound);
    px.ctx = c;
    px.noiseBuf = c.createBuffer(1, this.SR, this.SR); { const d = px.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const fn = Sound.INST0[name] || Sound.INST[name];
    try { fn.call(px, f, 0.0, secs * 0.8, 1, 0, c.destination); } catch (e) { console.warn(e); }
    return await c.startRendering();
  },

  // ---- playback
  play(name, f, t, d, v, pan, dest) {
    const set = this.sets[name]; if (!set || !set.length) return false;
    const m = 69 + 12 * Math.log2(f / 440);
    let best = set[0]; for (const s of set) if (Math.abs(s.m - m) < Math.abs(best.m - m)) best = s;
    if (Math.abs(best.m - m) > 7) return false;
    const c = Sound.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = best.buf; src.playbackRate.value = f / best.f;
    const rate = f / best.f, bufDur = best.buf.duration / rate, rel = this.PLAN[name][4];
    const out = Sound._out(dest, pan);
    const plucked = name === 'harp' || name === 'pluck';
    g.gain.setValueAtTime(v, t);
    let stop;
    if (plucked) stop = t + bufDur;
    else {
      const hold = Math.max(0.03, d);
      if (hold + rel > bufDur - 0.05) { src.loop = true; src.loopStart = 1.4; src.loopEnd = best.buf.duration - 0.15; }
      g.gain.setValueAtTime(v, t + hold); g.gain.setTargetAtTime(0.0001, t + hold, Math.max(0.03, rel / 3));
      stop = t + hold + rel * 2.2 + 0.05;
      if (name === 'piano') stop = Math.min(t + bufDur, stop);
    }
    src.connect(g); g.connect(out);
    src.start(t); src.stop(stop);
    return true;
  }
};

(function () {
  const S = Sound;
  S.INST0 = Object.assign({}, S.INST);
  for (const name of ['harp', 'pluck', 'strings', 'flute', 'brass', 'horn', 'choir']) {
    const orig = S.INST[name];
    S.INST[name] = function (f, t, d, v, pan, dest) { if (Sampler.ready[name] && Sampler.play(name, f, t, d, v, pan, dest)) return; return orig.call(this, f, t, d, v, pan, dest); };
  }
  // a new grand piano (falls back to the electric piano until it's ready)
  S.INST.piano = function (f, t, d, v, pan, dest) { if (Sampler.ready.piano && Sampler.play('piano', f, t, d, v, pan, dest)) return; return S.INST0.epiano.call(this, f, t, d, v, pan, dest); };
  // Tokyo was always meant to be a piano piece
  if (SCORE.tokyo) for (const sec of SCORE.tokyo.secs) for (const L of sec.m || []) if (L.i === 'epiano') L.i = 'piano';
  if (SCORE.tokyo && SCORE.tokyo.acc && SCORE.tokyo.acc.arp === 'epiano') SCORE.tokyo.acc.arp = 'piano';
  // start building once the audio is unlocked
  const un = S.unlock;
  S.unlock = function () { const r = un.apply(this, arguments); try { if (this.ctx) setTimeout(() => Sampler.start(), 400); } catch (e) {} return r; };
  if (S.ctx) setTimeout(() => Sampler.start(), 400);
})();
