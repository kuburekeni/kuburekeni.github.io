// =====================================================================
//  audio.js : procedural ORCHESTRAL score + sound effects (WebAudio)
//  Still zero audio files: every instrument is synthesised live —
//  string sections, brass, choir, harp, flute, bells, organ, timpani,
//  taiko, snare — through a generated concert-hall reverb.
//  Public API is unchanged: Sound.unlock / play / stop / sfx / vol /
//  applyVolume, so it drops straight into the existing build.
// =====================================================================
const Sound = {
  ctx: null, master: null, musicBus: null, sfxBus: null, noiseBuf: null, verb: null,
  vol: { music: 0.6, sfx: 0.8 },
  track: null, trackName: null, timer: null, pending: null,

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this._build(new AC()); } catch (e) { this.ctx = null; return; }
    this.applyVolume();
    if (this.pending) { const p = this.pending; this.pending = null; this.trackName = null; this.play(p); }
  },
  _build(c) {
    this.ctx = c;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 3.2;
    comp.attack.value = 0.008; comp.release.value = 0.3;
    this.master = c.createGain(); this.master.gain.value = 0.95;
    this.master.connect(comp); comp.connect(c.destination);
    this.verb = c.createConvolver(); this.verb.buffer = this._impulse(c, 3.4, 2.8);
    this.verb.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.connect(this.master);
    const ms = c.createGain(); ms.gain.value = 0.45; this.musicBus.connect(ms); ms.connect(this.verb);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    const ss = c.createGain(); ss.gain.value = 0.14; this.sfxBus.connect(ss); ss.connect(this.verb);
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },
  // Synthetic hall impulse: stereo decaying noise that darkens over time
  _impulse(c, sec, decay) {
    const len = Math.floor(c.sampleRate * sec), pre = Math.floor(c.sampleRate * 0.018);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let y = 0;
      for (let i = pre; i < len; i++) {
        const p = (i - pre) / (len - pre);
        const a = 0.85 - 0.72 * p;                       // damping: highs die first
        y += a * ((Math.random() * 2 - 1) - y);
        d[i] = y * Math.pow(1 - p, decay) * (i < pre + 2400 ? 1.4 : 1);
      }
    }
    return b;
  },
  applyVolume() {
    if (!this.ctx) return;
    this.musicBus.gain.value = this.vol.music;
    this.sfxBus.gain.value = this.vol.sfx;
  },

  freq(note) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
    if (!m) return 0;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = 12 * (parseInt(m[3]) + 1) + base;
    return 440 * Math.pow(2, (midi - 69) / 12);
  },
  m2f(m) { return 440 * Math.pow(2, (m - 69) / 12); },

  // ---------------------------------------------------------- low-level helpers
  tone(f, t, dur, type = 'square', vol = 0.1, bus = this.sfxBus, slideTo = null) {
    const c = this.ctx; if (!c || !f) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.setValueAtTime(vol, t + Math.max(0.01, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(t, dur, vol = 0.1, bus = this.sfxBus, hp = 1000) {
    this._nz(t, dur, bus, 'highpass', hp, 0.7, vol);
  },
  _nz(t, dur, dest, type, fq, q, v, fqTo) {
    const c = this.ctx; if (!c) return;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(fq, t); f.Q.value = q;
    if (fqTo) f.frequency.exponentialRampToValueAtTime(fqTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
  },
  _out(dest, pan) {
    const c = this.ctx, g = c.createGain();
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(dest); }
    else g.connect(dest);
    return g;
  },
  // attack a, sustain level v until t+d, release r. returns end time
  _env(g, t, a, d, v, r) {
    const hold = Math.max(a + 0.005, d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setValueAtTime(v, t + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + hold + r);
    return t + hold + r;
  },
  _osc(type, f, t, end, det, dest, lvl) {
    const c = this.ctx, o = c.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det;
    if (lvl != null && lvl !== 1) { const g = c.createGain(); g.gain.value = lvl; o.connect(g); g.connect(dest); }
    else o.connect(dest);
    o.start(t); o.stop(end + 0.05);
    return o;
  },
  _vib(t, end, rate, depth, delay, oscs) {
    const c = this.ctx, l = c.createOscillator(), g = c.createGain();
    l.frequency.value = rate * (0.92 + Math.random() * 0.16);
    g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(0, t + delay);
    g.gain.linearRampToValueAtTime(depth, t + delay + 0.35);
    l.connect(g); for (const o of oscs) g.connect(o.detune);
    l.start(t); l.stop(end + 0.05);
  },
  _lp(f, q, dest) { const n = this.ctx.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = f; n.Q.value = q || 0.5; n.connect(dest); return n; },

  // ---------------------------------------------------------- instruments
  // every instrument: (f, t, dur, vel, pan, dest)
  INST: {
    strings(f, t, d, v, pan, dest) {
      const g = this._out(dest, pan), end = this._env(g, t, Math.min(0.16, d * 0.4), d, v * 0.3, 0.5);
      const lp = this._lp(Math.min(6500, 1300 + f * 1.3), 0.4, g);
      const os = [-10, -3, 4, 11].map(dt => this._osc('sawtooth', f, t, end, dt, lp, 0.75));
      this._vib(t, end, 5, 9, 0.18, os);
    },
    stac(f, t, d, v, pan, dest) {            // short bowed strokes for ostinati
      const g = this._out(dest, pan), c = this.ctx;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.45, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.09, d) + 0.08);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8;
      lp.frequency.setValueAtTime(3800, t); lp.frequency.exponentialRampToValueAtTime(900, t + 0.14); lp.connect(g);
      const end = t + Math.max(0.09, d) + 0.1;
      this._osc('sawtooth', f, t, end, -6, lp); this._osc('sawtooth', f, t, end, 7, lp);
    },
    pizz(f, t, d, v, pan, dest) {
      const g = this._out(dest, pan);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      const lp = this._lp(Math.min(3000, f * 5), 1, g);
      this._osc('triangle', f, t, t + 0.46, 0, lp); this._osc('sawtooth', f, t, t + 0.46, 3, lp, 0.35);
    },
    brass(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), end = this._env(g, t, 0.035, d, v * 0.42, 0.22);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.3;
      lp.frequency.setValueAtTime(260, t);
      lp.frequency.linearRampToValueAtTime(Math.min(7500, f * 7), t + 0.07);
      lp.frequency.setTargetAtTime(Math.min(4200, f * 3.4), t + 0.08, 0.25);
      lp.connect(g);
      const os = [this._osc('sawtooth', f, t, end, -7, lp), this._osc('sawtooth', f, t, end, 6, lp), this._osc('square', f / 2, t, end, 0, lp, 0.3)];
      this._vib(t, end, 5.5, 6, 0.3, os);
    },
    horn(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), end = this._env(g, t, 0.07, d, v * 0.5, 0.3);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9;
      lp.frequency.setValueAtTime(200, t); lp.frequency.linearRampToValueAtTime(Math.min(3000, f * 3.2), t + 0.12);
      lp.frequency.setTargetAtTime(Math.min(1800, f * 2.2), t + 0.14, 0.3); lp.connect(g);
      const os = [this._osc('sawtooth', f, t, end, -5, lp), this._osc('triangle', f, t, end, 4, lp, 0.8)];
      this._vib(t, end, 5, 5, 0.35, os);
    },
    choir(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), end = this._env(g, t, Math.min(0.4, d * 0.5), d, v, 0.8);
      const mix = c.createGain(); mix.gain.value = 1;
      [[720, 6, 2.4], [1150, 7, 1.5], [2600, 8, 0.5]].forEach(([fq, q, lv]) => {
        const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fq; b.Q.value = q;
        const bg = c.createGain(); bg.gain.value = lv; mix.connect(b); b.connect(bg); bg.connect(g);
      });
      const body = this._lp(900, 0.3, c.createGain()); body.disconnect(); body.connect(g);
      const bodyIn = c.createGain(); bodyIn.gain.value = 0.18; bodyIn.connect(body);
      const os = [];
      for (const dt of [-12, -4, 5, 13]) { const o = this._osc('sawtooth', f, t, end, dt, mix, 0.5); o.connect(bodyIn); os.push(o); }
      this._vib(t, end, 5.2, 14, 0.25, os);
    },
    organ(f, t, d, v, pan, dest) {
      const g = this._out(dest, pan), end = this._env(g, t, 0.06, d, v * 0.4, 0.35);
      const os = [[1, 1], [2, 0.55], [3, 0.3], [4, 0.2], [0.5, 0.45]].map(([h, l]) => this._osc('sine', f * h, t, end, 0, g, l));
      this._vib(t, end, 6.5, 4, 0.05, os);
    },
    flute(f, t, d, v, pan, dest) {
      const g = this._out(dest, pan), end = this._env(g, t, 0.07, d, v * 0.7, 0.18);
      const os = [this._osc('sine', f, t, end, 0, g), this._osc('triangle', f, t, end, 2, g, 0.35), this._osc('sine', f * 2, t, end, 0, g, 0.08)];
      this._vib(t, end, 5.6, 11, 0.22, os);
      this._nz(t, Math.min(0.25, d), g, 'bandpass', f * 2, 3, v * 0.12);
    },
    harp(f, t, d, v, pan, dest) {
      const g = this._out(dest, pan), ring = Math.min(2.4, 0.8 + 400 / f);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
      const lp = this._lp(Math.min(5000, f * 6), 0.7, g);
      this._osc('triangle', f, t, t + ring, 0, lp); this._osc('sine', f * 2, t, t + ring, 0, lp, 0.22);
      this._osc('sine', f * 3, t, t + 0.3, 0, lp, 0.06);
    },
    pluck(f, t, d, v, pan, dest) {           // lute / guitar
      const c = this.ctx, g = this._out(dest, pan);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.8, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
      lp.frequency.setValueAtTime(Math.min(6000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 0.3); lp.connect(g);
      this._osc('sawtooth', f, t, t + 0.9, 0, lp); this._osc('triangle', f, t, t + 0.9, 4, lp, 0.6);
    },
    bell(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan);
      [[1, 1, 2.6], [2.76, 0.35, 1.2], [5.4, 0.14, 0.6], [2, 0.2, 1.8]].forEach(([h, l, dur]) => {
        const pg = c.createGain(); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(v * l, t + 0.003);
        pg.gain.exponentialRampToValueAtTime(0.0001, t + dur); pg.connect(g);
        this._osc('sine', f * h, t, t + dur, 0, pg);
      });
    },
    epiano(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), rel = t + Math.max(0.2, d);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.7, t + 0.005);
      g.gain.exponentialRampToValueAtTime(v * 0.25, rel); g.gain.exponentialRampToValueAtTime(0.0001, rel + 0.4);
      this._osc('sine', f, t, rel + 0.4, 0, g); this._osc('triangle', f, t, rel + 0.4, 5, g, 0.25);
      const tg = c.createGain(); tg.gain.setValueAtTime(v * 0.3, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); tg.connect(g);
      this._osc('sine', f * 4, t, t + 0.26, 0, tg);
    },
    bass(f, t, d, v, pan, dest) {            // contrabass section
      const g = this._out(dest, pan), end = this._env(g, t, 0.05, d, v * 0.5, 0.25);
      const lp = this._lp(Math.min(900, 280 + f * 2), 0.8, g);
      const os = [this._osc('sawtooth', f, t, end, -5, lp), this._osc('sawtooth', f, t, end, 6, lp), this._osc('triangle', f, t, end, 0, g, 0.5)];
      this._vib(t, end, 4.5, 5, 0.3, os);
    },
    chip(f, t, d, v, pan, dest) { this.tone(f, t, d, 'square', v, this._out(dest, pan)); }
  },
  _inst(name, f, t, d, v, pan, dest) {
    const fn = this.INST[name] || this.INST.strings;
    if (f > 0 && v > 0) fn.call(this, f, t, d, v, pan || 0, dest);
  },

  // ---------------------------------------------------------- percussion
  _kick(t, v, dest) {
    const c = this.ctx, g = c.createGain(), o = c.createOscillator();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.42);
    this._nz(t, 0.05, dest, 'lowpass', 900, 0.7, v * 0.3);
  },
  _taiko(t, v, dest) {
    const c = this.ctx, g = c.createGain(), o = c.createOscillator();
    o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.92);
    this._nz(t, 0.35, dest, 'lowpass', 500, 1, v * 0.6);
  },
  _snare(t, v, dest) {
    this._nz(t, 0.16, dest, 'bandpass', 2200, 0.6, v);
    this._nz(t, 0.08, dest, 'highpass', 5000, 0.5, v * 0.5);
    const c = this.ctx, g = c.createGain(), o = c.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.12);
  },
  _hat(t, v, dest) { this._nz(t, 0.045, dest, 'highpass', 8000, 0.7, v); },
  _tamb(t, v, dest) { this._nz(t, 0.1, dest, 'bandpass', 8500, 1.5, v); this._nz(t, 0.05, dest, 'highpass', 6000, 0.7, v * 0.5); },
  _crash(t, v, dest) { this._nz(t, 2.2, dest, 'highpass', 4500, 0.4, v); this._nz(t, 1.2, dest, 'bandpass', 7000, 0.8, v * 0.5); },
  _timp(f, t, v, dest) {
    const c = this.ctx, g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
    o.frequency.setValueAtTime(f * 1.05, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    o2.frequency.value = f * 1.51; g2.gain.setValueAtTime(v * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(dest); o2.connect(g2); g2.connect(dest);
    o.start(t); o.stop(t + 1.32); o2.start(t); o2.stop(t + 0.52);
    this._nz(t, 0.07, dest, 'lowpass', 350, 0.8, v * 0.5);
  },
  _roll(f, t, dur, v0, v1, dest) {
    const n = Math.floor(dur / 0.055);
    for (let i = 0; i < n; i++) this._timp(f, t + i * 0.055, v0 + (v1 - v0) * (i / n), dest);
  },

  // ---------------------------------------------------------- harmony
  CHORD: { '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7],
    maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14], '5': [0, 7] },
  _pc(l, acc) { return ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[l] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + 12) % 12; },
  _chord(s) {
    const m = /^([A-G])(#|b)?(maj7|m7|m9|dim|aug|sus2|sus4|add9|m|7|5)?(?:\/([A-G])(#|b)?)?$/.exec(s);
    if (!m) return null;
    const root = this._pc(m[1], m[2]);
    return { root, iv: this.CHORD[m[3] || ''], bass: m[4] ? this._pc(m[4], m[5]) : root };
  },
  _voice(ch, lo) { return ch.iv.map(i => { let n = ch.root + i; while (n < lo) n += 12; while (n >= lo + 12 + (i > 11 ? 12 : 0)) n -= 12; return n; }).sort((a, b) => a - b); },
  _bassN(ch) { return 36 + ch.bass; },               // C2..B2

  // ---------------------------------------------------------- score compilation
  _compile(P) {
    if (P._n) return P._n;
    const barSteps = (P.meter || 4) * 2;
    const secs = P.secs.map(S => {
      const bars = S.c.trim().split(/\s*\|\s*|\s+/).filter(Boolean).map(b => b === '_' ? [null] : b.split(',').map(x => this._chord(x)));
      const mel = (S.m || []).map(L => ({ ...L, toks: (Array.isArray(L.n) ? L.n.join(' ') : L.n).trim().split(/\s+/).filter(x => x !== '|') }));
      return { bars, mel, acc: Object.assign({}, P.acc || {}, S.acc || {}), crash: S.crash, total: bars.length * barSteps };
    });
    return (P._n = { secs, barSteps });
  },

  // ---------------------------------------------------------- music player
  resolve(name) {
    if (SCORE[name]) return SCORE[name];
    const n = String(name || '').toLowerCase();
    for (const [re, id] of SCORE_ALIASES) if (re.test(n)) return SCORE[id];
    if (typeof MUSIC !== 'undefined' && MUSIC[name]) return this._legacy(MUSIC[name]);
    return SCORE.field;
  },
  _legacy(def) {                              // old chiptune defs still play
    if (def._piece) return def._piece;
    const lens = def.ch.map(c => c.n.trim().split(/\s+/).length);
    const bars = Math.ceil(Math.max(...lens) / 8);
    return (def._piece = { bpm: def.bpm, loop: def.loop, secs: [{ c: Array(bars).fill('_').join(' '),
      m: def.ch.filter(c => c.w !== 'noise').map(c => ({ i: 'chip', n: c.n, v: c.v })) }] });
  },
  play(name) {
    if (this.trackName === name) return;
    const piece = this.ctx ? this.resolve(name) : null;
    if (piece && this.track && this.track.piece === piece && !this.track.done) { this.trackName = name; return; }
    this.stop();
    this.trackName = name;
    if (!this.ctx) { this.pending = name; return; }
    if (!piece) return;
    const c = this.ctx, out = c.createGain();
    out.gain.setValueAtTime(0.0001, c.currentTime);
    out.gain.linearRampToValueAtTime(piece.gain || 1, c.currentTime + 0.5);
    out.connect(this.musicBus);
    const tr = { piece, out, t: c.currentTime + 0.12, sec: 0, step: 0, n: this._compile(piece) };
    this.track = tr;
    const tick = () => { if (this.track !== tr) return; try { this._sched(tr, c.currentTime + 0.3); } catch (e) { console.warn('music', e); this.stop(); } };
    tick();
    this.timer = setInterval(tick, 40);
  },
  stop(fade = 0.6) {
    if (this.timer) clearInterval(this.timer);
    const tr = this.track;
    if (tr && this.ctx) {
      const t = this.ctx.currentTime, g = tr.out.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0.0001, t + fade);
      setTimeout(() => { try { tr.out.disconnect(); } catch (e) {} }, (fade + 4) * 1000);
    }
    this.timer = null; this.track = null; this.trackName = null; this.pending = null;
  },
  _sched(tr, until) {
    const P = tr.piece, N = tr.n, bs = N.barSteps, stepDur = 60 / P.bpm / 2;
    while (tr.t < until && !tr.done) {
      const S = N.secs[tr.sec];
      const bi = Math.floor(tr.step / bs), si = tr.step % bs;
      if (si === 0) this._bar(tr, S, bi, tr.t, stepDur * bs, 60 / P.bpm, P.meter || 4);
      for (const L of S.mel) {
        const k = tr.step % L.toks.length, tk = L.toks[k];
        if (tk === '-' || tk === '.') continue;
        let h = 1; while (L.toks[(k + h) % L.toks.length] === '-' && h < 32) h++;
        const f = this.freq(tk) * Math.pow(2, (L.oct || 0) / 12), d = h * stepDur * (L.leg || 0.96);
        this._inst(L.i, f, tr.t, d, L.v, L.pan, tr.out);
        if (L.also) this._inst(L.alsoI || L.i, f * Math.pow(2, L.also / 12), tr.t, d, L.alsoV || L.v * 0.6, -(L.pan || 0) || -0.2, tr.out);
      }
      tr.step++; tr.t += stepDur;
      if (tr.step >= S.total) {
        tr.step = 0; tr.sec++;
        if (tr.sec >= N.secs.length) {
          if (P.loop === false) { tr.done = true; clearInterval(this.timer); this.timer = null; return; }
          tr.sec = P.loopFrom || 0;
        }
      }
    }
  },
  _bar(tr, S, bi, t, barDur, beat, meter) {
    const A = S.acc, out = tr.out, chords = S.bars[bi];
    const span = barDur / chords.length;
    chords.forEach((ch, k) => { if (ch) this._chordSpan(A, ch, t + k * span, span, beat, meter, out); });
    const first = chords[0];
    // percussion
    if (A.perc && PERC[A.perc]) {
      const pat = PERC[A.perc], q = beat / 4, pv = A.percV || 1;
      for (const [key, str] of Object.entries(pat)) {
        const s = meter === 3 && str.length === 16 ? str.slice(0, 12) : str;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i]; if (ch === '.') continue;
          const tt = t + i * q, v = (ch === 'X' ? 1.4 : 1) * pv;
          if (key === 'k') this._kick(tt, 0.5 * v, out);
          else if (key === 'b') this._taiko(tt, 0.55 * v, out);
          else if (key === 's') this._snare(tt, 0.16 * v, out);
          else if (key === 'h') this._hat(tt, 0.05 * v, out);
          else if (key === 't') this._tamb(tt, 0.06 * v, out);
        }
      }
    }
    if ((S.crash && bi === 0) || (A.crashEvery && bi % A.crashEvery === 0)) this._crash(t, 0.1, out);
    if (A.timp && first) {
      let r = this._bassN(first); if (r < 41) r += 12;
      const f = this.m2f(r), f5 = this.m2f(r - 5), tv = A.timpV || 0.35;
      switch (A.timp) {
        case 'down': this._timp(f, t, tv, out); break;
        case 'beat13': this._timp(f, t, tv, out); if (meter >= 4) this._timp(f5, t + beat * 2, tv * 0.75, out); break;
        case 'drive': for (let i = 0; i < meter * 2; i++) this._timp(i % 4 === 3 ? f5 : f, t + i * beat / 2, tv * (i % 2 ? 0.55 : 0.9), out); break;
        case 'heart': this._timp(f, t, tv, out); this._timp(f, t + beat * 0.45, tv * 0.6, out); break;
        case 'roll': this._roll(f, t, barDur * 0.98, tv * 0.25, tv, out); break;
        case 'end': if (bi % 4 === 3) this._roll(f, t + beat * (meter - 1), beat, tv * 0.3, tv, out); else this._timp(f, t, tv * 0.6, out); break;
      }
    }
  },
  _chordSpan(A, ch, t, span, beat, meter, out) {
    const beats = Math.max(1, Math.round(span / beat));
    // sustained pads
    const pads = A.pad ? (Array.isArray(A.pad) ? A.pad : [A.pad]) : [];
    pads.forEach((inst, pi) => {
      const vs = this._voice(ch, A.padLo || 55), pv = Array.isArray(A.padV) ? A.padV[pi] : (A.padV || 0.05);
      vs.forEach((n, i) => this._inst(inst, this.m2f(n), t, span * 0.99, pv, (i / Math.max(1, vs.length - 1) - 0.5) * 0.7, out));
    });
    // arpeggio / ostinato
    if (A.arp) {
      const vs = this._voice(ch, A.arpLo || 60), pat = A.arpPat || 'up8', av = A.arpV || 0.06;
      const seqUp = [...vs, ...vs.map(n => n + 12)];
      const play = (n, tt, d, v) => this._inst(A.arp, this.m2f(n), tt, d, v || av, ((n % 12) / 11 - 0.5) * 0.8, out);
      let dt, seq;
      switch (pat) {
        case 'slow': dt = beat; seq = seqUp; break;
        case 'up8': dt = beat / 2; seq = seqUp; break;
        case 'updown8': dt = beat / 2; seq = [...seqUp, ...seqUp.slice(1, -1).reverse()]; break;
        case '16': dt = beat / 4; seq = [...seqUp, ...vs.map(n => n + 24)]; break;
        case 'broken8': dt = beat / 2; seq = [vs[0], vs[2] || vs[1], vs[1], vs[2] || vs[1], vs[0] + 12, vs[2] || vs[1], vs[1], vs[2] || vs[1]]; break;
        case 'strum':
          for (let b = 0; b < beats; b++) vs.forEach((n, i) => play(n, t + b * beat + i * 0.018, beat * 0.9, av * (b % 2 ? 0.7 : 1)));
          return this._bassPart(A, ch, t, span, beat, beats, out);
        case 'waltz':
          for (let b = 0; b < beats; b++) if (b % 3) vs.forEach((n, i) => play(n, t + b * beat + i * 0.012, beat * 0.8, av));
          return this._bassPart(A, ch, t, span, beat, beats, out);
        case 'ost16': {
          const r = 48 + ch.root, p = [0, 0, 12, 0, 7, 0, 12, 7];
          const n16 = Math.round(span / (beat / 4));
          for (let i = 0; i < n16; i++) play(r + p[i % 8], t + i * beat / 4, beat / 4 * 0.85, av * (i % 4 === 0 ? 1.25 : 0.85));
          return this._bassPart(A, ch, t, span, beat, beats, out);
        }
        case 'gallop': {
          const r = 48 + ch.root;
          for (let b = 0; b < beats; b++) [0, 0.5, 0.75].forEach((o, i) => play(i === 0 ? r : r + 7, t + (b + o) * beat, beat / 4 * 0.9, av * (i === 0 ? 1.2 : 0.8)));
          return this._bassPart(A, ch, t, span, beat, beats, out);
        }
        default: dt = beat / 2; seq = seqUp;
      }
      const cnt = Math.round(span / dt);
      for (let i = 0; i < cnt; i++) play(seq[i % seq.length], t + i * dt, dt * 1.6);
    }
    this._bassPart(A, ch, t, span, beat, beats, out);
  },
  _bassPart(A, ch, t, span, beat, beats, out) {
    if (!A.bass) return;
    const r = this._bassN(ch), f = this.m2f(r), f5 = this.m2f(r + 7 > 47 ? r - 5 : r + 7), bv = A.bassV || 0.14, I = A.bass;
    switch (A.bassPat || 'whole') {
      case 'whole': this._inst(I, f, t, span * 0.98, bv, 0, out); break;
      case 'half': for (let b = 0; b < beats; b += 2) this._inst(I, b % 4 ? f5 : f, t + b * beat, Math.min(2, beats - b) * beat * 0.95, bv, 0, out); break;
      case 'march': for (let b = 0; b < beats; b++) this._inst(I, b % 2 ? f5 : f, t + b * beat, beat * (b % 2 ? 0.5 : 0.9), bv * (b % 2 ? 0.7 : 1), 0, out); break;
      case 'boom': for (let b = 0; b < beats; b++) if (b % 2 === 0) this._inst(I, b % 4 ? f5 : f, t + b * beat, beat * 0.8, bv, 0, out); break;
      case 'eighths': for (let i = 0; i < beats * 2; i++) this._inst(I, i % 8 === 7 ? f5 : f, t + i * beat / 2, beat * 0.42, bv * (i % 2 ? 0.7 : 1), 0, out); break;
      case 'pulse': for (let i = 0; i < beats * 2; i++) this._inst(I, f, t + i * beat / 2, beat * 0.3, bv * (i === 0 ? 1.2 : 0.55), 0, out); break;
      case 'waltz': this._inst(I, f, t, beat * 0.95, bv, 0, out); break;
    }
  },

  // ---------------------------------------------------------- sound effects
  sfx(name) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + 0.005, B = this.sfxBus;
    const T = (f, d, w, v, off = 0, s) => this.tone(f, t + off, d, w, v, B, s);
    const I = (inst, note, off, d, v, pan) => this._inst(inst, typeof note === 'number' ? note : this.freq(note), t + off, d, v, pan || 0, B);
    const whoosh = (off, dur, v, f0, f1) => this._nz(t + off, dur, B, 'bandpass', f0, 1.6, v, f1);
    switch (name) {
      case 'cursor': T(1320, 0.03, 'triangle', 0.05); T(2640, 0.02, 'sine', 0.02); break;
      case 'ok': I('bell', 'E6', 0, 0.2, 0.06); I('bell', 'B6', 0.05, 0.2, 0.05); break;
      case 'cancel': T(520, 0.06, 'triangle', 0.07); T(390, 0.09, 'triangle', 0.07, 0.05); break;
      case 'buzz': T(110, 0.16, 'sawtooth', 0.07); T(116, 0.16, 'sawtooth', 0.05); break;
      case 'talk': T(480 + Math.random() * 90, 0.028, 'triangle', 0.035); break;
      case 'swing': case 'slash': case 'whoosh': whoosh(0, 0.18, 0.35, 900, 3200); break;
      case 'hit': whoosh(0, 0.1, 0.25, 1400, 2800); this._nz(t + 0.06, 0.14, B, 'lowpass', 1400, 0.7, 0.4); T(150, 0.14, 'triangle', 0.18, 0.06, 55); break;
      case 'crit': whoosh(0, 0.12, 0.3, 1000, 4000); this._nz(t + 0.07, 0.3, B, 'lowpass', 2200, 0.7, 0.55); T(210, 0.22, 'sawtooth', 0.14, 0.07, 45); I('bell', 'E7', 0.07, 0.3, 0.05); break;
      case 'hurt': this._nz(t, 0.18, B, 'lowpass', 900, 0.7, 0.4); T(190, 0.2, 'triangle', 0.16, 0, 70); break;
      case 'parry': case 'block': case 'guard': case 'clang':
        [1, 2.41, 3.87, 5.2].forEach((h, i) => T(720 * h, 0.5 - i * 0.08, 'sine', 0.06 / (i + 1))); this._nz(t, 0.05, B, 'highpass', 3000, 0.7, 0.3); break;
      case 'miss': whoosh(0, 0.22, 0.25, 2400, 500); break;
      case 'magic': [0, 4, 7, 11, 14, 19].forEach((s, i) => I('bell', this.m2f(72 + s), i * 0.035, 0.3, 0.035, (i % 2 ? 0.4 : -0.4))); T(300, 0.4, 'sawtooth', 0.03, 0, 1200); break;
      case 'fire': this._nz(t, 0.55, B, 'lowpass', 300, 0.5, 0.35, 2500); this._nz(t + 0.05, 0.45, B, 'bandpass', 900, 0.8, 0.2); T(140, 0.4, 'sawtooth', 0.07, 0, 60); break;
      case 'ice': [1400, 1870, 2350, 1760, 2800].forEach((f, i) => I('bell', f, i * 0.045, 0.2, 0.045, (i - 2) * 0.2)); this._nz(t, 0.3, B, 'highpass', 6000, 0.7, 0.08); break;
      case 'thunder': case 'bolt': this._nz(t, 0.08, B, 'highpass', 2000, 0.7, 0.5); this._nz(t + 0.04, 1.4, B, 'lowpass', 400, 0.6, 0.6, 60); T(70, 1, 'sawtooth', 0.12, 0.04, 30); break;
      case 'dark': T(110, 0.8, 'sawtooth', 0.06, 0, 55); T(113, 0.8, 'sawtooth', 0.05, 0, 52); I('choir', this.m2f(50), 0, 0.5, 0.08); I('choir', this.m2f(51), 0, 0.5, 0.06); break;
      case 'heal': [72, 76, 79, 84, 88].forEach((m, i) => I('bell', this.m2f(m), i * 0.07, 0.3, 0.05, (i - 2) * 0.2)); I('choir', this.m2f(72), 0, 0.5, 0.06); break;
      case 'buff': [67, 72, 76, 79].forEach((m, i) => I('harp', this.m2f(m), i * 0.05, 0.2, 0.1)); I('brass', this.m2f(79), 0.2, 0.25, 0.08); break;
      case 'charge': T(200, 0.7, 'sawtooth', 0.05, 0, 1400); this._nz(t, 0.7, B, 'bandpass', 400, 3, 0.15, 4000); break;
      case 'break': case 'shatter': [3100, 4200, 2600, 5300, 3700].forEach((f, i) => T(f, 0.25, 'square', 0.03, i * 0.02, f * 0.7)); this._nz(t, 0.4, B, 'highpass', 3000, 0.7, 0.35); this._kick(t, 0.4, B); break;
      case 'resolve': case 'limit':
        [60, 64, 67, 72].forEach((m, i) => I('brass', this.m2f(m), 0.1 * i, 0.5 - i * 0.05, 0.1, (i - 1.5) * 0.3)); I('choir', this.m2f(72), 0, 0.9, 0.1); this._crash(t + 0.3, 0.08, B); break;
      case 'levelup': [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => I('harp', this.m2f(m), i * 0.055, 0.2, 0.1)); I('brass', this.m2f(72), 0.42, 0.5, 0.1); I('brass', this.m2f(76), 0.42, 0.5, 0.08); I('bell', this.m2f(96), 0.42, 0.3, 0.04); break;
      case 'coin': I('bell', 'B6', 0, 0.1, 0.05); I('bell', 'E7', 0.06, 0.2, 0.05); break;
      case 'chest': [67, 71, 74, 79, 83, 86].forEach((m, i) => I('harp', this.m2f(m), i * 0.045, 0.2, 0.1)); I('bell', this.m2f(91), 0.3, 0.3, 0.04); break;
      case 'door': this._nz(t, 0.25, B, 'bandpass', 700, 2, 0.15, 350); this._kick(t + 0.18, 0.25, B); break;
      case 'step': this._nz(t, 0.05, B, 'lowpass', 600, 0.7, 0.08); break;
      case 'encounter': whoosh(0, 0.4, 0.3, 400, 5000); [0, 3, 6, 9, 12].forEach((s, i) => I('stac', this.m2f(57 + s), i * 0.05, 0.08, 0.14)); this._timp(this.m2f(45), t + 0.28, 0.5, B); this._crash(t + 0.28, 0.07, B); break;
      case 'run': whoosh(0, 0.3, 0.25, 600, 2500); break;
      case 'death': I('horn', this.m2f(57), 0, 0.3, 0.1); I('horn', this.m2f(52), 0.3, 0.8, 0.1); this._timp(this.m2f(40), t + 0.3, 0.4, B); break;
      case 'enemyDie': this._nz(t, 0.5, B, 'bandpass', 2400, 1, 0.25, 300); [84, 79, 76, 72].forEach((m, i) => I('bell', this.m2f(m), i * 0.05, 0.15, 0.03)); break;
      case 'horn': I('horn', 'D4', 0, 0.45, 0.16, -0.3); I('horn', 'A4', 0, 0.45, 0.13, 0.3); I('horn', 'D4', 0.55, 0.9, 0.16, -0.3); I('horn', 'A4', 0.55, 0.9, 0.13, 0.3); break;
      case 'crash': this._nz(t, 1.2, B, 'lowpass', 1200, 0.5, 0.6, 80); this._nz(t, 0.5, B, 'highpass', 3000, 0.5, 0.3); T(90, 0.7, 'sawtooth', 0.15, 0, 30); this._kick(t, 0.6, B); break;
      case 'save': [79, 83, 86, 91].forEach((m, i) => I('bell', this.m2f(m), i * 0.09, 0.3, 0.05)); break;
      case 'pickup': I('bell', 'C7', 0, 0.1, 0.05); I('bell', 'G7', 0.06, 0.2, 0.04); break;
      case 'chime': I('bell', 'E6', 0, 0.3, 0.06); break;
    }
  }
};

// =====================================================================
//  PERCUSSION PATTERNS — one char per 16th note (4/4 = 16 chars)
//  k kick  b taiko  s snare  h hat  t tambourine   x hit  X accent
// =====================================================================
const PERC = {
  march:  { s: 'X..x..x.x..x.xx.', b: 'x.......x.......' },
  battle: { gain: 0.9, k: 'X..x..x.x..x..x.', s: '....X.......X..x', h: 'x.x.x.x.x.x.x.x.' },
  boss:   { b: 'X..x..x.X..x.xx.', s: '....X.......X.xx', h: 'x.xxx.xxx.xxx.xx' },
  lite:   { k: 'x.......x.......', h: '..x...x...x...x.' },
  folk:   { b: 'x.....x.x.......', t: '..x...x...x...X.' },
  tribal: { b: 'X..x....x.x...x.' },
  waltz:  { t: '....x...x...' },
  pulse:  { k: 'x...x...x...x...' }
};

// =====================================================================
//  THE SCORE
//  c: one chord per bar ('|' or spaces). 'F,G' splits a bar. '_' = none
//  m: melody lines — one token per 8th note, '-' holds, '.' rests.
//     i instrument, v velocity, oct transpose, also = doubled at interval
//  acc: pad / arp / bass / perc / timp accompaniment (per piece or section)
// =====================================================================
const SCORE = {
  // ------------------------------------------------ Title — overture
  title: { bpm: 76, acc: { pad: 'strings', padV: 0.045, arp: 'harp', arpPat: 'up8', arpV: 0.055, bass: 'bass', bassV: 0.12 },
    secs: [
      { c: 'D | Bm | G | A | D/F# | G | Em7 | A',
        m: [{ i: 'flute', v: 0.1, n: 'F#5 - - - E5 - D5 - | F#5 - - - A5 - - - | G5 - F#5 - E5 - D5 - | E5 - - - - - - - | F#5 - - - E5 - D5 - | B4 - D5 - G5 - - - | F#5 - E5 - D5 - E5 - | A4 - - - - - . .' }] },
      { c: 'G | A | F#m | Bm | Em | A | Bb,C | D', crash: true,
        acc: { pad: ['strings', 'choir'], padV: [0.05, 0.05], arpPat: '16', arpV: 0.045, bassPat: 'half', timp: 'end', timpV: 0.4 },
        m: [{ i: 'brass', v: 0.15, also: -12, alsoI: 'horn', alsoV: 0.1, n: 'D5 - - B4 D5 - G5 - | F#5 - E5 - C#5 - A4 - | C#5 - - A4 C#5 - F#5 - | F#5 - - - D5 - - - | G5 - F#5 - E5 - B4 - | E5 - - F#5 E5 - C#5 - | D5 - - - E5 - - - | F#5 - - - - - - -' }] },
      { c: 'D | Bm | G | A | D/F# | G | Em7,A | D',
        acc: { pad: ['strings', 'choir'], padV: [0.045, 0.035], arpPat: 'up8', bassPat: 'half' },
        m: [{ i: 'strings', v: 0.11, also: 12, alsoI: 'flute', alsoV: 0.06, n: 'F#5 - - - E5 - D5 - | F#5 - - - A5 - - - | G5 - F#5 - E5 - D5 - | E5 - - - - - - - | F#5 - - - A5 - D6 - | D6 - - - B5 - G5 - | F#5 - - - E5 - - - | D5 - - - - - . .' }] }
    ] },

  // ------------------------------------------------ Tokyo — bittersweet city
  tokyo: { bpm: 90, acc: { pad: 'strings', padV: 0.03, arp: 'epiano', arpPat: 'broken8', arpV: 0.07, bass: 'bass', bassPat: 'half', bassV: 0.11, perc: 'lite', percV: 0.6 },
    secs: [
      { c: 'Fmaj7 | G | Em7 | Am | Fmaj7 | G | Am,G | C',
        m: [{ i: 'epiano', v: 0.12, n: 'A5 - G5 - E5 - C5 - | D5 - - E5 D5 - B4 - | E5 - - - G5 - E5 - | A5 - - - - - . . | A5 - G5 - E5 - C5 - | D5 - E5 - G5 - A5 - | C6 - B5 - A5 - G5 - | E5 - - - - - . .' }] },
      { c: 'Dm7 | Em7 | Fmaj7 | G | Fmaj7 | Em7 | Dm7,E7 | Am', acc: { pad: ['strings'], padV: 0.04 },
        m: [{ i: 'strings', v: 0.1, n: 'F5 - E5 - D5 - A4 - | G5 - F5 - E5 - B4 - | A5 - G5 - F5 - C5 - | D5 - - - - - B4 - | C5 - - F5 E5 - - C5 | B4 - - E5 D5 - - B4 | A4 - B4 - C5 - D5 - | E5 - - - - - . .' },
            { i: 'bell', v: 0.03, n: '. . . . . . . . | . . . . . . . . | . . . . C6 - - - | . . . . D6 - - - | . . . . . . . . | . . . . . . . . | . . . . . . . . | E6 - - - - - - -' }] }
    ] },

  // ------------------------------------------------ The Void / the goddess
  void: { gain: 1.5, bpm: 58, acc: { pad: ['choir', 'strings'], padV: [0.05, 0.025], arp: 'harp', arpPat: 'slow', arpV: 0.05, arpLo: 64, bass: 'strings', bassV: 0.06 },
    secs: [
      { c: 'E | F#/E | C#m | A | E | F#/E | B | Bsus4,B',
        m: [{ i: 'bell', v: 0.07, n: 'B5 - - - G#5 - - - | A#5 - - - F#5 - - - | G#5 - - - E5 - C#5 - | E5 - - - - - - - | B5 - - - E6 - - - | C#6 - - - A#5 - - - | B5 - - - F#5 - D#5 - | F#5 - - - - - - -' },
            { i: 'flute', v: 0.05, n: '. . . . . . . . | . . . . . . . . | . . . . . . . . | C#5 - - - B4 - - - | . . . . . . . . | . . . . . . . . | . . . . . . . . | E5 - - - D#5 - - -' }] }
    ] },

  // ------------------------------------------------ Noble manor / nursery (lullaby waltz)
  manor: { gain: 1.4, bpm: 92, meter: 3, acc: { pad: 'strings', padV: 0.03, arp: 'harp', arpPat: 'waltz', arpV: 0.05, bass: 'pizz', bassPat: 'waltz', bassV: 0.13 },
    secs: [
      { c: 'G | Em | C | D | G | Em | Am,D | G',
        m: [{ i: 'bell', v: 0.07, n: 'D5 - B4 - G4 - | B4 - - - E5 - | E5 - D5 - C5 - | D5 - - - - - | G5 - F#5 - E5 - | E5 - D5 - B4 - | C5 - A4 - F#4 - | G4 - - - - -' },
            { i: 'flute', v: 0.06, oct: -12, n: '. . . . . . | G5 - - - . . | . . . . . . | F#5 - - - A5 - | . . . . . . | G5 - - - . . | . . . . . . | B5 - - - - -' }] },
      { c: 'C | D | Bm | Em | Am | D | G,Em | Am,D',
        m: [{ i: 'flute', v: 0.08, n: 'E5 - - - G5 - | F#5 - - - A5 - | D5 - - - F#5 - | E5 - - - B4 - | C5 - E5 - A5 - | F#5 - - - D5 - | B4 - - - G5 - | A5 - - - F#5 -' }] }
    ] },

  // ------------------------------------------------ Village — pastoral 3/4
  village: { gain: 1.3, bpm: 104, meter: 3, acc: { pad: 'strings', padV: 0.028, arp: 'harp', arpPat: 'waltz', arpV: 0.05, bass: 'pizz', bassPat: 'waltz', bassV: 0.14, perc: 'waltz', percV: 0.5 },
    secs: [
      { c: 'F | C/E | Dm | Bb | F | Gm7 | C | C7',
        m: [{ i: 'flute', v: 0.1, n: 'C5 - F5 - A5 - | G5 - - - E5 - | F5 - E5 - D5 - | D5 - - - Bb4 C5 | A4 - C5 - F5 - | Bb5 - A5 - G5 - | E5 - G5 - C5 - | E5 - - - . .' }] },
      { c: 'Bb | C | Am | Dm | Gm | C | F | F',
        acc: { pad: 'strings', padV: 0.04 },
        m: [{ i: 'flute', v: 0.1, n: 'D6 - - C6 Bb5 - | C6 - - Bb5 A5 - | A5 - G5 - E5 - | F5 - - - D5 - | G5 - Bb5 - D6 - | C6 - Bb5 - E5 - | F5 - - - - - | . . C5 - D5 E5' },
            { i: 'horn', v: 0.07, n: 'F4 - - - - - | G4 - - - - - | E4 - - - - - | F4 - - - - - | Bb4 - - - - - | G4 - - - - - | A4 - - - - - | . . . . . .' }] }
    ] },

  // ------------------------------------------------ Field — heroic adventure
  field: { bpm: 116, acc: { pad: 'strings', padV: 0.03, padLo: 50, arp: 'stac', arpPat: 'gallop', arpV: 0.07, bass: 'bass', bassPat: 'march', bassV: 0.12, perc: 'march', percV: 0.6, timp: 'down', timpV: 0.28 },
    secs: [
      { c: 'D | C | G | D | D | C | G | A',
        m: [{ i: 'strings', v: 0.12, also: -12, n: 'A4 - D5 - - E5 F#5 G5 | A5 - - - G5 - E5 - | D5 - - B4 D5 - G5 - | F#5 - - - - - . . | A4 - D5 - - E5 F#5 G5 | A5 - - - C6 - B5 A5 | B5 - - A5 G5 - D5 - | E5 - - - - - . .' }] },
      { c: 'Bm | G | D | A | Bm | G | Em | A7', crash: true, acc: { pad: ['strings', 'horn'], padV: [0.035, 0.03], timp: 'end' },
        m: [{ i: 'brass', v: 0.14, n: 'F#5 - - - D5 - B4 - | D5 - - - B4 - G4 - | A4 - - D5 F#5 - A5 - | G5 - F#5 - E5 - - - | F#5 - - - B5 - - - | A5 - - G5 F#5 - D5 - | G5 - - F#5 E5 - B4 - | C#5 - - - E5 - - -' }] }
    ] },

  // ------------------------------------------------ Town — lively market
  town: { bpm: 112, acc: { pad: 'strings', padV: 0.022, arp: 'pluck', arpPat: 'strum', arpV: 0.06, bass: 'pizz', bassPat: 'boom', bassV: 0.14, perc: 'folk', percV: 0.7 },
    secs: [
      { c: 'G | D | Em | C | G | D | C,D | G',
        m: [{ i: 'flute', v: 0.1, n: 'D5 - G5 - A5 B5 A5 G5 | F#5 - A5 - - - D5 - | E5 - G5 - B5 - A5 G5 | E5 - - - - - . . | D5 - G5 - A5 B5 C6 B5 | A5 - F#5 - D5 - E5 F#5 | G5 - E5 - F#5 - A5 - | G5 - - - - - . .' }] },
      { c: 'C | G | Am | D | C | G | Am,D | G',
        m: [{ i: 'pluck', v: 0.12, n: 'E5 - - D5 C5 - E5 - | D5 - - C5 B4 - D5 - | C5 - - B4 A4 - C5 - | B4 - A4 - F#4 - - - | E5 - G5 - C6 - B5 A5 | B5 - G5 - D5 - G5 - | A5 - - - F#5 - - - | G5 - - - - - . .' },
            { i: 'flute', v: 0.06, n: '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . A5 - - - | G5 - - - - - . . | . . . . . . . . | . . . . . . . . | . . . . D5 E5 F#5 -' }] }
    ] },

  // ------------------------------------------------ Mines / caves / dungeons
  mine: { gain: 1.2, bpm: 70, acc: { pad: 'strings', padV: 0.035, padLo: 48, arp: 'harp', arpPat: 'slow', arpV: 0.035, arpLo: 57, bass: 'bass', bassV: 0.12, timp: 'down', timpV: 0.14 },
    secs: [
      { c: 'Am | Am | F | E | Am | Dm | F | E7',
        m: [{ i: 'flute', v: 0.08, oct: -12, n: 'A5 - - - C6 - B5 - | A5 - - - - - E5 - | F5 - - - A5 - C6 - | B5 - - - G#5 - - - | A5 - - - C6 - E6 - | F6 - - - E6 - D6 - | C6 - - - A5 - F5 - | G#5 - - - - - . .' },
            { i: 'bell', v: 0.025, n: '. . . . . . E7 - | . . . . . . . . | . . . . . C7 - - | . . . . . . . . | . . . . . . A6 - | . . . . . . . . | . . . . F6 - - - | . . . . . . . .' }] }
    ] },

  // ------------------------------------------------ Ash wastes
  wastes: { gain: 0.85, bpm: 88, acc: { pad: ['strings', 'choir'], padV: [0.035, 0.03], padLo: 50, bass: 'bass', bassV: 0.13, perc: 'tribal', percV: 0.8 },
    secs: [
      { c: 'Dm | Eb | Dm | C | Dm | Eb | Bb | A',
        m: [{ i: 'horn', v: 0.13, n: 'D5 - - - - - A4 - | Bb4 - - - G4 - - - | A4 - F4 - D4 - F4 - | G4 - - - - - . . | D5 - - - F5 - - - | G5 - F5 - Eb5 - D5 - | D5 - - - Bb4 - - - | A4 - - - C#5 - - -' }] },
      { c: 'Gm | Dm | Eb | A | Gm | Dm | Eb,Bb | A', acc: { timp: 'beat13', timpV: 0.3 },
        m: [{ i: 'strings', v: 0.11, also: -12, n: 'Bb5 - - - A5 - G5 - | A5 - - - F5 - D5 - | G5 - - - Bb5 - Eb6 - | C#6 - - - - - . . | D6 - - - Bb5 - G5 - | F5 - - - A5 - D6 - | Eb6 - - - D6 - - - | C#6 - - - - - . .' }] }
    ] },

  // ------------------------------------------------ Castle — the Demon King's seat
  castle: { bpm: 68, acc: { pad: ['organ', 'choir'], padV: [0.04, 0.035], padLo: 52, bass: 'bass', bassV: 0.13, timp: 'down', timpV: 0.3 },
    secs: [
      { c: 'Em | C | Am | B | Em | G/D | C | B7',
        m: [{ i: 'organ', v: 0.1, n: 'E5 - - - G5 - B5 - | C6 - - - B5 - A5 - | A5 - - - E5 - C5 - | D#5 - - - - - . . | B4 - E5 - G5 - E5 - | D5 - G5 - B5 - D6 - | E6 - D6 - C6 - B5 - | B5 - - - - - . .' }] },
      { c: 'Am | Em | F | B | Am | Em | C,B | Em', crash: true, acc: { timp: 'heart', timpV: 0.35, arp: 'stac', arpPat: 'ost16', arpV: 0.045 },
        m: [{ i: 'choir', v: 0.12, n: 'C6 - - - - - B5 - | B5 - - - G5 - - - | A5 - - - C6 - - - | B5 - - - - - . . | E6 - - - D6 - C6 - | B5 - - - G5 - - - | E6 - - - D#6 - - - | E6 - - - - - . .' },
            { i: 'brass', v: 0.08, oct: -12, n: 'A4 - - - - - - - | G4 - - - - - - - | F4 - - - - - - - | F#4 - - - - - - - | A4 - - - - - - - | G4 - - - - - - - | G4 - - - F#4 - - - | E4 - - - - - - -' }] }
    ] },

  // ------------------------------------------------ Battle
  battle: { bpm: 148, acc: { pad: 'strings', padV: 0.025, padLo: 52, arp: 'stac', arpPat: 'ost16', arpV: 0.075, bass: 'bass', bassPat: 'eighths', bassV: 0.11, perc: 'battle', percV: 0.75, timp: 'beat13', timpV: 0.3 },
    secs: [
      { c: 'Am | F | G | Em | Am | F | G | E', crash: true,
        m: [{ i: 'brass', v: 0.14, also: -12, alsoI: 'horn', alsoV: 0.08, n: 'A4 - - C5 E5 - A5 - | G5 - F5 - E5 - C5 - | D5 - - B4 D5 - G5 - | E5 - - - - - . . | A4 - - C5 E5 - A5 - | C6 - B5 - A5 - F5 - | G5 - A5 - B5 - D6 - | E6 - - - B5 - G#5 -' }] },
      { c: 'Dm | Am | Dm | E | F | G | Am | E7',
        acc: { pad: ['strings', 'choir'], padV: [0.03, 0.03] },
        m: [{ i: 'strings', v: 0.12, also: 12, alsoI: 'flute', alsoV: 0.05, n: 'F5 - - - - E5 D5 - | E5 - - - C5 - A4 - | F5 - - - A5 - D6 - | B5 - - - G#5 - - - | A5 - - - C6 - A5 - | B5 - - - D6 - B5 - | C6 - B5 - A5 - E5 - | G#5 - - - B5 - - -' },
            { i: 'brass', v: 0.07, oct: -12, n: 'D5 - - - - - - - | C5 - - - - - - - | D5 - - - - - - - | E5 - - - - - - - | C5 - - - - - - - | D5 - - - - - - - | E5 - - - - - - - | E5 - - - D5 - - -' }] }
    ] },

  // ------------------------------------------------ Boss — Demon King
  boss: { gain: 0.8, bpm: 138, acc: { pad: ['choir', 'strings'], padV: [0.05, 0.03], padLo: 50, arp: 'stac', arpPat: 'ost16', arpV: 0.08, bass: 'bass', bassPat: 'eighths', bassV: 0.12, perc: 'boss', percV: 0.8, timp: 'drive', timpV: 0.3 },
    secs: [
      { c: 'Dm | Bb | C | A | Dm | Bb | Gm | A', crash: true,
        m: [{ i: 'choir', v: 0.14, n: 'D5 - - - - - - - | F5 - - - - - D5 - | E5 - - - - - G5 - | A5 - - - - - - - | A5 - - - F5 - - - | Bb5 - - - A5 - G5 - | G5 - - - Bb5 - - - | A5 - - - C#6 - - -' },
            { i: 'brass', v: 0.1, oct: -12, n: 'D5 - - - - - - - | D5 - - - - - - - | C5 - - - - - - - | C#5 - - - - - - - | D5 - - - - - - - | D5 - - - - - - - | Bb4 - - - D5 - - - | C#5 - - - E5 - - -' }] },
      { c: 'Dm | Dm/C | Bb | A | Gm | Bb | A | A7', crash: true, acc: { crashEvery: 4 },
        m: [{ i: 'brass', v: 0.16, also: -12, alsoI: 'horn', alsoV: 0.1, n: 'D5 - F5 A5 D6 - - - | C6 - A5 - F5 - - - | Bb5 - A5 - G5 - F5 - | E5 - - - A4 - - - | G5 - - - Bb5 - D6 - | F6 - - - D6 - Bb5 - | C#6 - - - A5 - E5 - | C#6 - - - E6 - - -' },
            { i: 'choir', v: 0.07, n: 'A5 - - - - - - - | A5 - - - - - - - | F5 - - - - - - - | E5 - - - - - - - | D5 - - - - - - - | F5 - - - - - - - | E5 - - - - - - - | G5 - - - - - - -' }] }
    ] },

  // ------------------------------------------------ Victory fanfare (then a calm loop)
  victory: { bpm: 120, loopFrom: 1,
    secs: [
      { c: 'C | Am | F,G | C', crash: true,
        acc: { pad: ['strings', 'choir'], padV: [0.045, 0.035], bass: 'bass', bassV: 0.13, timp: 'roll', timpV: 0.35 },
        m: [{ i: 'brass', v: 0.16, also: -12, alsoI: 'horn', alsoV: 0.1, n: 'G4 . G4 . C5 - E5 - | G5 - - - E5 - C5 - | A5 - - - B5 - - - | C6 - - - - - - -' }] },
      { c: 'F | C | Dm | G | F | C/E | Dm,G | C',
        acc: { pad: 'strings', padV: 0.03, arp: 'harp', arpPat: 'up8', arpV: 0.05, bass: 'pizz', bassPat: 'half', bassV: 0.12 },
        m: [{ i: 'flute', v: 0.08, n: 'A5 - - G5 F5 - C5 - | E5 - - - G5 - - - | F5 - E5 - D5 - A4 - | B4 - - - D5 - - - | A5 - - G5 F5 - C6 - | C6 - - B5 C6 - G5 - | F5 - E5 - D5 - B4 - | C5 - - - - - . .' }] }
    ] },

  // ------------------------------------------------ Ending
  ending: { gain: 1.3, bpm: 70, acc: { pad: 'strings', padV: 0.035, arp: 'harp', arpPat: 'up8', arpV: 0.05, bass: 'bass', bassV: 0.1 },
    secs: [
      { c: 'C | G/B | Am | Em/G | F | C/E | Dm7 | G',
        m: [{ i: 'strings', v: 0.11, oct: -12, n: 'E5 - - - G5 - C6 - | B5 - - - - - G5 - | A5 - - - C6 - E6 - | D6 - - - B5 - - - | A5 - - - C6 - F6 - | E6 - - - D6 - C6 - | D6 - - - C6 - A5 - | B5 - - - - - . .' }] },
      { c: 'F | G | Em | Am | Dm | G | C | C', crash: true,
        acc: { pad: ['strings', 'choir'], padV: [0.04, 0.04], timp: 'down', timpV: 0.2 },
        m: [{ i: 'strings', v: 0.12, also: -12, alsoI: 'horn', alsoV: 0.06, n: 'C6 - - - A5 - F5 - | D6 - - - B5 - G5 - | E6 - - - B5 - G5 - | A5 - - - - - E5 - | F5 - - - A5 - D6 - | D6 - - - C6 - B5 - | C6 - - - - - - - | - - - - . . . .' }] }
    ] },

  // ------------------------------------------------ Dark / tension
  dark: { gain: 1.3, bpm: 64, acc: { pad: 'strings', padV: 0.04, padLo: 48, bass: 'bass', bassPat: 'pulse', bassV: 0.12, timp: 'heart', timpV: 0.25 },
    secs: [
      { c: 'Cm | Cm | Ab | G | Cm | Db | Ab | G',
        m: [{ i: 'strings', v: 0.08, oct: -12, n: 'C6 - - - - - Eb6 - | D6 - - - - - . . | C6 - - - Ab5 - - - | B5 - - - - - . . | Eb6 - - - G6 - - - | Ab6 - - - F6 - - - | Eb6 - - - C6 - - - | B5 - - - D6 - - -' },
            { i: 'choir', v: 0.04, n: '. . . . . . . . | . . . . . . . . | . . . . . . . . | G4 - - - - - - - | . . . . . . . . | . . . . . . . . | . . . . . . . . | G4 - - - - - - -' }] }
    ] },

  // ------------------------------------------------ Game over / lament
  gameover: { gain: 1.4, bpm: 60, acc: { pad: 'strings', padV: 0.035, arp: 'harp', arpPat: 'slow', arpV: 0.045, bass: 'bass', bassV: 0.09 },
    secs: [
      { c: 'Am | F | Dm | E | Am | F | E | Am',
        m: [{ i: 'flute', v: 0.08, n: 'E5 - - - C5 - - - | A4 - - - C5 - - - | D5 - - - F5 - E5 - | E5 - - - - - . . | C5 - - - B4 - A4 - | A4 - - - C5 - - - | B4 - - - G#4 - - - | A4 - - - - - . .' }] }
    ] },

  // ------------------------------------------------ Travel — the open road
  travel: { bpm: 106, acc: { pad: 'strings', padV: 0.03, arp: 'pizz', arpPat: 'updown8', arpV: 0.07, arpLo: 55, bass: 'bass', bassPat: 'march', bassV: 0.11, perc: 'lite', percV: 0.5 },
    secs: [
      { c: 'Eb | Bb/D | Cm | Ab | Eb/G | Ab | Fm7,Bb | Eb',
        m: [{ i: 'strings', v: 0.12, oct: -12, also: 12, alsoI: 'flute', alsoV: 0.04, n: 'G5 - - - Bb5 - Eb6 - | D6 - - - Bb5 - F5 - | G5 - - - C6 - Eb6 - | C6 - - - - - . . | Bb5 - - - G5 - Eb5 - | Ab5 - - - C6 - Eb6 - | D6 - - - C6 - D6 - | Eb6 - - - - - . .' }] },
      { c: 'Ab | Bb | Gm | Cm | Ab | Bb | Eb,Cm | Bb', acc: { pad: ['strings', 'horn'], padV: [0.03, 0.025], timp: 'end', timpV: 0.22 },
        m: [{ i: 'horn', v: 0.14, n: 'C5 - - Bb4 Ab4 - Eb4 - | D5 - - C5 Bb4 - F4 - | Bb4 - - Ab4 G4 - D4 - | Eb4 - - - G4 - - - | Ab4 - - - C5 - Eb5 - | F5 - - - D5 - Bb4 - | G5 - - - Eb5 - - - | F5 - - - - - . .' }] }
    ] },

  // ------------------------------------------------ Night — quiet danger
  night: { gain: 1.45, bpm: 78, acc: { pad: 'strings', padV: 0.028, arp: 'harp', arpPat: 'up8', arpV: 0.035, arpLo: 57, bass: 'bass', bassV: 0.09 },
    secs: [
      { c: 'Dm | Bb | Gm | A | Dm | F | Gm | A7',
        m: [{ i: 'flute', v: 0.08, n: 'A4 - - - D5 - F5 - | F5 - E5 - D5 - - - | D5 - - - Bb4 - G4 - | A4 - - - - - . . | A4 - - - D5 - A5 - | A5 - G5 - F5 - C5 - | D5 - - - E5 - F5 - | E5 - - - C#5 - - -' },
            { i: 'bell', v: 0.02, n: '. . . . . . D7 - | . . . . . . . . | . . . . . . . . | . . . . E7 - - - | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . .' }] }
    ] },

  // ------------------------------------------------ Royal capital
  royal: { bpm: 96, acc: { pad: ['strings', 'horn'], padV: [0.035, 0.02], arp: 'harp', arpPat: 'up8', arpV: 0.045, bass: 'bass', bassPat: 'march', bassV: 0.12, perc: 'march', percV: 0.55, timp: 'end', timpV: 0.3 },
    secs: [
      { c: 'Bb | F/A | Gm | Eb | Bb/F | Eb | F | Bb', crash: true,
        m: [{ i: 'brass', v: 0.15, also: -12, alsoI: 'horn', alsoV: 0.08, n: 'F4 . F4 . Bb4 - D5 - | F5 - - - C5 - A4 - | Bb4 - D5 - G5 - - - | G5 - F5 - Eb5 - - - | D5 - - F5 Bb5 - - - | G5 - - - Eb5 - C5 - | C5 - D5 - Eb5 - F5 - | D5 - - - - - . .' }] },
      { c: 'Eb | Bb | Cm | F | Eb | Bb/D | Cm7,F | Bb',
        m: [{ i: 'strings', v: 0.11, also: 12, alsoI: 'flute', alsoV: 0.05, n: 'G5 - - F5 Eb5 - Bb4 - | D5 - - - F5 - - - | Eb5 - - D5 C5 - G4 - | A4 - - - C5 - - - | G5 - - - Bb5 - Eb6 - | D6 - - - Bb5 - F5 - | G5 - - - A5 - - - | Bb5 - - - - - . .' }] }
    ] }
};

// Map names the game might use (including new areas) onto the score.
const SCORE_ALIASES = [
  [/title|menu|overture/, 'title'],
  [/game ?over|gameover|lose|lament|sorrow|sad|grief|funeral|tragic/, 'gameover'],
  [/boss|demon[ _-]?(king|lord)|final/, 'boss'],
  [/victory|win|fanfare|triumph/, 'victory'],
  [/battle|fight|bandit|combat|duel|skirmish|ambush/, 'battle'],
  [/ending|credits|epilogue|finale/, 'ending'],
  [/tokyo|japan|school|city|truck|earth/, 'tokyo'],
  [/void|god|heaven|divine|afterlife|celest|shrine|spirit/, 'void'],
  [/nursery|manor|home|noble|estate|baby|lullaby|child|house|family/, 'manor'],
  [/travel|road|journey|world ?map|overworld|caravan/, 'travel'],
  [/night|mill|moon|dusk|ghost|haunt/, 'night'],
  [/capital|royal|palace|throne|court|king/, 'royal'],
  [/castle|demon|lair|fortress|keep|citadel|rift/, 'castle'],
  [/dark|tense|danger|threat|dread|evil/, 'dark'],
  [/mine|cave|dungeon|crypt|ruin|tomb|sewer|under/, 'mine'],
  [/waste|ash|desert|burn|scorch|lava/, 'wastes'],
  [/town|market|shop|inn|tavern|bar|port|harbou?r|guild/, 'town'],
  [/village|farm|brook|hamlet|fern|chapel|church|rest/, 'village'],
  [/field|plain|meadow|hill|forest|wood|train|prologue|practice/, 'field']
];
