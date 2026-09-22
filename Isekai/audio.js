// =====================================================================
//  audio.js : procedural chiptune music + sound effects (WebAudio)
//  No audio files are shipped; everything is synthesised live.
// =====================================================================
const Sound = {
  ctx: null, master: null, musicBus: null, sfxBus: null, noiseBuf: null,
  vol: { music: 0.6, sfx: 0.8 },
  track: null, trackName: null, timer: null, pending: null,

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolume();
    if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
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
    const c = this.ctx; if (!c) return;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },

  // ---------------------------------------------------------- music
  play(name) {
    if (this.trackName === name) return;
    this.stop();
    this.trackName = name;
    if (!this.ctx) { this.pending = name; return; }
    const def = MUSIC[name]; if (!def) return;
    const step = 60 / def.bpm / 2;
    const chans = def.ch.map(ch => ({ ...ch, toks: ch.n.trim().split(/\s+/), i: 0 }));
    const len = Math.max(...chans.map(c => c.toks.length));
    this.track = { def, step, chans, next: this.ctx.currentTime + 0.08, count: 0, len };
    const tick = () => {
      const tr = this.track; if (!tr || this.trackName !== name) return;
      while (tr.next < this.ctx.currentTime + 0.15) {
        if (def.loop === false && tr.count >= len) { this.track = null; return; }
        for (const ch of tr.chans) {
          const tok = ch.toks[ch.i % ch.toks.length];
          if (tok !== '-' && tok !== '.') {
            if (ch.w === 'noise') this.noise(tr.next, 0.05, ch.v, this.musicBus, 6000);
            else {
              let holds = 1;
              while (ch.toks[(ch.i + holds) % ch.toks.length] === '-' && holds < 16) holds++;
              this.tone(this.freq(tok), tr.next, holds * step * 0.95, ch.w, ch.v, this.musicBus);
            }
          }
          ch.i++;
        }
        tr.next += step; tr.count++;
      }
    };
    tick();
    this.timer = setInterval(tick, 30);
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.track = null; this.trackName = null; this.pending = null;
  },

  // ---------------------------------------------------------- effects
  sfx(name) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + 0.005;
    const T = (f, d, w, v, off = 0, s) => this.tone(f, t + off, d, w, v, this.sfxBus, s);
    switch (name) {
      case 'cursor': T(880, 0.04, 'square', 0.05); break;
      case 'ok': T(660, 0.05, 'square', 0.06); T(990, 0.07, 'square', 0.06, 0.05); break;
      case 'cancel': T(440, 0.06, 'square', 0.06); T(330, 0.08, 'square', 0.06, 0.05); break;
      case 'buzz': T(120, 0.15, 'sawtooth', 0.08); break;
      case 'talk': T(520 + Math.random() * 80, 0.025, 'square', 0.025); break;
      case 'hit': this.noise(t, 0.12, 0.25, this.sfxBus, 600); T(160, 0.1, 'square', 0.1, 0, 60); break;
      case 'crit': this.noise(t, 0.2, 0.35, this.sfxBus, 400); T(220, 0.15, 'sawtooth', 0.12, 0, 50); T(880, 0.08, 'square', 0.06, 0.02); break;
      case 'hurt': this.noise(t, 0.15, 0.2, this.sfxBus, 300); T(200, 0.18, 'square', 0.1, 0, 80); break;
      case 'miss': T(900, 0.1, 'sine', 0.06, 0, 400); break;
      case 'magic': T(300, 0.35, 'sawtooth', 0.05, 0, 1200); T(600, 0.35, 'square', 0.04, 0.05, 1800); break;
      case 'fire': this.noise(t, 0.4, 0.2, this.sfxBus, 200); T(150, 0.35, 'sawtooth', 0.07, 0, 400); break;
      case 'ice': [1400, 1800, 2200, 1600].forEach((f, i) => T(f, 0.08, 'sine', 0.06, i * 0.05)); break;
      case 'thunder': this.noise(t, 0.5, 0.4, this.sfxBus, 100); T(80, 0.4, 'sawtooth', 0.12, 0, 40); break;
      case 'dark': T(200, 0.5, 'sawtooth', 0.08, 0, 60); T(203, 0.5, 'sawtooth', 0.06, 0, 55); break;
      case 'heal': [523, 659, 784, 1046].forEach((f, i) => T(f, 0.12, 'triangle', 0.08, i * 0.06)); break;
      case 'buff': [392, 523, 659].forEach((f, i) => T(f, 0.12, 'square', 0.05, i * 0.07)); break;
      case 'levelup': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => T(f, 0.1, 'square', 0.06, i * 0.07)); break;
      case 'coin': T(988, 0.06, 'square', 0.06); T(1318, 0.18, 'square', 0.06, 0.06); break;
      case 'chest': [392, 494, 587, 784].forEach((f, i) => T(f, 0.1, 'triangle', 0.08, i * 0.08)); break;
      case 'door': this.noise(t, 0.12, 0.08, this.sfxBus, 2000); T(180, 0.12, 'triangle', 0.1, 0.02, 120); break;
      case 'encounter': for (let i = 0; i < 6; i++) T(300 + i * 150, 0.05, 'square', 0.06, i * 0.04); break;
      case 'run': T(600, 0.2, 'square', 0.05, 0, 200); break;
      case 'death': T(400, 0.5, 'square', 0.08, 0, 60); break;
      case 'enemyDie': this.noise(t, 0.25, 0.15, this.sfxBus, 1500); T(500, 0.25, 'square', 0.06, 0, 100); break;
      case 'horn': T(350, 0.45, 'sawtooth', 0.12); T(440, 0.45, 'sawtooth', 0.1); T(350, 0.3, 'sawtooth', 0.12, 0.5); T(440, 0.3, 'sawtooth', 0.1, 0.5); break;
      case 'crash': this.noise(t, 0.8, 0.5, this.sfxBus, 80); T(90, 0.6, 'sawtooth', 0.15, 0, 30); break;
      case 'save': [784, 988, 1175].forEach((f, i) => T(f, 0.12, 'triangle', 0.08, i * 0.09)); break;
      case 'pickup': T(1046, 0.06, 'square', 0.05); T(1568, 0.1, 'square', 0.05, 0.06); break;
    }
  }
};
