const SOUNDSCAPE = 1;
// =====================================================================
//  soundscape.js : the audio upgrade
//   - a proper mastering chain (EQ, glue compressor, limiter) and
//     room-aware reverb/echo for effects (caves echo, halls ring)
//   - new instruments: accordion, fiddle, marimba, glockenspiel,
//     music box, cello, shakuhachi, dulcimer
//   - eight new pieces: tavern jig, shop, chapel hymn, library,
//     academy, training hall, forest, cradle lullaby
//   - the score now breathes: humanised timing and dynamics, intros
//     that build, drum fills at phrase ends, and a counter-melody /
//     sparkle layer that joins on repeats so loops don't feel looped
//   - a live ambience layer: wind, leaves, birdsong, crickets, owls,
//     frogs, crowds, tavern clinks, clocks, forge hammers, cave drips,
//     traffic and level-crossing bells, rain — plus water, fire and
//     lava that get louder (and pan) as you walk near them
//   - footsteps that match the ground, and a voice for every speaker
// =====================================================================
(function () {
  const S = Sound;
  if (S.vol.amb == null) S.vol.amb = 0.7;

  // ------------------------------------------------------------ mix upgrade
  const _build = S._build;
  S._build = function (c) {
    _build.call(this, c);
    // master: EQ -> glue compressor -> brickwall limiter
    this.master.disconnect();
    const lo = c.createBiquadFilter(); lo.type = 'lowshelf'; lo.frequency.value = 110; lo.gain.value = 2.5;
    const mud = c.createBiquadFilter(); mud.type = 'peaking'; mud.frequency.value = 330; mud.Q.value = 1; mud.gain.value = -2;
    const air = c.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 9000; air.gain.value = 2;
    const glue = c.createDynamicsCompressor(); glue.threshold.value = -18; glue.knee.value = 12; glue.ratio.value = 2.5; glue.attack.value = 0.01; glue.release.value = 0.25;
    const lim = c.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
    this.master.connect(lo); lo.connect(mud); mud.connect(air); air.connect(glue); glue.connect(lim); lim.connect(c.destination);
    // music: wider, a touch more hall
    this.musicBus.disconnect(); this.musicBus.connect(this.master);
    const ms = c.createGain(); ms.gain.value = 0.42; this.musicBus.connect(ms); ms.connect(this.verb);
    const hd = c.createDelay(0.05); hd.delayTime.value = 0.017; const hg = c.createGain(); hg.gain.value = 0.16;
    const hp = c.createStereoPanner ? c.createStereoPanner() : null;
    this.musicBus.connect(hd); hd.connect(hg); if (hp) { hp.pan.value = 0.8; hg.connect(hp); hp.connect(this.master); } else hg.connect(this.master);
    // effects: reverb and echo that follow the room you're in
    this.sfxBus.disconnect(); this.sfxBus.connect(this.master);
    this.sfxSend = c.createGain(); this.sfxSend.gain.value = 0.12; this.sfxBus.connect(this.sfxSend); this.sfxSend.connect(this.verb);
    this.echoSend = c.createGain(); this.echoSend.gain.value = 0;
    const dl = c.createDelay(1); dl.delayTime.value = 0.24; const fb = c.createGain(); fb.gain.value = 0.34;
    const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400;
    this.sfxBus.connect(this.echoSend); this.echoSend.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(this.master);
    // ambience
    this.ambBus = c.createGain(); this.ambBus.connect(this.master);
    this.ambMix = c.createGain(); this.ambMix.gain.value = 0; this.ambMix.connect(this.ambBus);
    this.ambSend = c.createGain(); this.ambSend.gain.value = 0.15; this.ambMix.connect(this.ambSend); this.ambSend.connect(this.verb);
    this.ambEcho = c.createGain(); this.ambEcho.gain.value = 0; this.ambMix.connect(this.ambEcho); this.ambEcho.connect(dl);
  };
  const _apply = S.applyVolume;
  S.applyVolume = function () { _apply.call(this); if (this.ambBus) this.ambBus.gain.value = this.vol.amb * 0.9; };

  const SPACES = { outdoor: [0.07, 0, 0.1, 0], room: [0.2, 0, 0.22, 0], hall: [0.32, 0.06, 0.38, 0.04], cave: [0.4, 0.3, 0.5, 0.22] };
  S.setSpace = function (k) {
    if (!this.ctx || !this.sfxSend || this._space === k) return;
    this._space = k; const p = SPACES[k] || SPACES.outdoor, t = this.ctx.currentTime;
    this.sfxSend.gain.setTargetAtTime(p[0], t, 0.4); this.echoSend.gain.setTargetAtTime(p[1], t, 0.4);
    this.ambSend.gain.setTargetAtTime(p[2], t, 0.4); this.ambEcho.gain.setTargetAtTime(p[3], t, 0.4);
  };

  // ------------------------------------------------------------ instruments
  Object.assign(S.INST, {
    accordion(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), end = this._env(g, t, 0.03, d, v * 0.26, 0.12);
      const trem = c.createGain(); trem.gain.value = 0.8; trem.connect(g);
      const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.6; lg.gain.value = 0.2; l.connect(lg); lg.connect(trem.gain); l.start(t); l.stop(end + 0.05);
      const lp = this._lp(Math.min(5200, f * 6), 0.7, trem);
      this._osc('sawtooth', f, t, end, -9, lp, 0.55); this._osc('square', f, t, end, 8, lp, 0.35); this._osc('sawtooth', f * 2, t, end, 3, lp, 0.12);
    },
    fiddle(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), end = this._env(g, t, 0.035, d, v * 0.3, 0.14);
      const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 2600; pk.Q.value = 1.5; pk.gain.value = 6; pk.connect(g);
      const lp = this._lp(Math.min(7000, f * 5), 1, pk);
      const os = [this._osc('sawtooth', f, t, end, -4, lp), this._osc('sawtooth', f, t, end, 5, lp, 0.7)];
      this._vib(t, end, 6.2, 16, 0.12, os);
    },
    marimba(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), dec = 0.25 + 260 / f; v *= 0.65;
      [[1, 1, dec], [4, 0.14, 0.07], [10, 0.05, 0.02]].forEach(([h, l, dd]) => {
        const pg = c.createGain(); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(v * l, t + 0.002);
        pg.gain.exponentialRampToValueAtTime(0.0001, t + dd); pg.connect(g); this._osc('sine', f * h, t, t + dd, 0, pg);
      });
    },
    glock(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan);
      [[1, 0.8, 1.6], [2, 0.18, 0.5], [3.01, 0.08, 0.2]].forEach(([h, l, dd]) => {
        const pg = c.createGain(); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(v * l, t + 0.002);
        pg.gain.exponentialRampToValueAtTime(0.0001, t + dd); pg.connect(g); this._osc('sine', f * h, t, t + dd, 0, pg);
      });
      this._nz(t, 0.02, g, 'highpass', 7000, 0.7, v * 0.12);
    },
    musicbox(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan);
      [[1, 1, 1.8, 0], [2, 0.22, 0.6, 3], [5.4, 0.05, 0.1, 0]].forEach(([h, l, dd, det]) => {
        const pg = c.createGain(); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(v * l, t + 0.003);
        pg.gain.exponentialRampToValueAtTime(0.0001, t + dd); pg.connect(g); this._osc('sine', f * h, t, t + dd, det, pg);
      });
    },
    cello(f, t, d, v, pan, dest) {
      const g = this._out(dest, pan), end = this._env(g, t, Math.min(0.2, d * 0.4), d, v * 0.34, 0.4);
      const lp = this._lp(Math.min(3000, 600 + f * 1.6), 0.6, g);
      const os = [-7, 0, 8].map(dt => this._osc('sawtooth', f, t, end, dt, lp, 0.7));
      this._vib(t, end, 5.2, 12, 0.2, os);
    },
    shaku(f, t, d, v, pan, dest) {
      const c = this.ctx, g = this._out(dest, pan), end = this._env(g, t, 0.09, d, v * 0.7, 0.25);
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.14);
      o.connect(g); o.start(t); o.stop(end + 0.05);
      const o2 = this._osc('triangle', f, t, end, 3, g, 0.2);
      this._vib(t, end, 4.8, 20, 0.3, [o, o2]);
      this._nz(t, Math.max(0.2, d + 0.2), g, 'bandpass', f * 1.5, 2, v * 0.28);
    },
    dulcimer(f, t, d, v, pan, dest) { this.INST.pluck.call(this, f, t, d, v * 0.7, pan - 0.1, dest); this.INST.pluck.call(this, f * 1.004, t + 0.004, d, v * 0.5, pan + 0.1, dest); this.INST.glock.call(this, f * 2, t, d, v * 0.08, pan, dest); }
  });

  Object.assign(PERC, {
    jig:   { k: 'x.....x.....', t: '....x.....x.' },
    drive: { b: 'X...x.x.X...x.x.', s: '....x.......x...', h: '..x...x...x...x.' },
    shuffle: { k: 'x.......x.......', t: '..x...x...x...xx' }
  });

  // ------------------------------------------------------------ accompaniment: a jig pattern
  const _span = S._chordSpan;
  S._chordSpan = function (A, ch, t, span, beat, meter, out) {
    if (A.arpPat !== 'jig') return _span.call(this, A, ch, t, span, beat, meter, out);
    const n8 = Math.max(1, Math.round(span / (beat / 2))), e = beat / 2;
    const vs = this._voice(ch, A.arpLo || 60), r = this._bassN(ch);
    const pads = A.pad ? (Array.isArray(A.pad) ? A.pad : [A.pad]) : [];
    pads.forEach((inst, pi) => { const pv = Array.isArray(A.padV) ? A.padV[pi] : (A.padV || 0.03); vs.forEach((n, i) => this._inst(inst, this.m2f(n), t, span * 0.98, pv, (i - 1) * 0.3, out)); });
    for (let i = 0; i < n8; i++) {
      const tt = t + i * e + (Math.random() - 0.5) * 0.008;
      if (i % 3 === 0 && A.bass) this._inst(A.bass, this.m2f(i % 6 === 3 ? r + 7 : r), tt, e * 1.4, (A.bassV || 0.13) * (i === 0 ? 1.1 : 0.9), 0, out);
      if (i % 3 === 2 && A.arp) vs.forEach((n, k) => this._inst(A.arp, this.m2f(n), tt + k * 0.01, e * 0.9, (A.arpV || 0.05) * (0.9 + Math.random() * 0.2), (k - 1) * 0.35, out));
    }
  };

  // ------------------------------------------------------------ the player, humanised
  const _bar = S._bar;
  S._bar = function (tr, S2, bi, t, barDur, beat, meter) {
    // first time through, the drums hold back for two bars and let the tune introduce itself
    if (tr.pass === 0 && tr.sec === 0 && bi < 2 && !tr.piece.noIntro && (S2.acc.perc || S2.acc.timp)) S2 = Object.assign({}, S2, { acc: Object.assign({}, S2.acc, { perc: null, timp: bi === 0 ? S2.acc.timp : null }) });
    _bar.call(this, tr, S2, bi, t, barDur, beat, meter);
    if (bi === S2.bars.length - 1 && (tr.pass + tr.sec) % 2 === 1) this._fill(S2.acc, t, barDur, beat, tr.out);
  };
  S._fill = function (A, t, barDur, beat, out) {
    const pat = A.perc && PERC[A.perc], t0 = t + barDur - beat;
    if (pat && pat.s) { for (let i = 0; i < 4; i++) this._snare(t0 + i * beat / 4, 0.07 + i * 0.03, out); }
    else if (pat && (pat.b || pat.k)) { this._taiko(t0, 0.35, out); this._taiko(t0 + beat / 2, 0.45, out); }
    else if (A.timp) { this._roll(this.m2f(45), t0, beat * 0.95, 0.05, 0.22, out); }
  };
  S._sched = function (tr, until) {
    const P = tr.piece, N = tr.n, bs = N.barSteps, stepDur = 60 / P.bpm / 2;
    if (tr.pass == null) tr.pass = 0;
    const legacy = !P.secs.some(s => s.m && s.m.some(L => L.i !== 'chip'));
    while (tr.t < until && !tr.done) {
      const Sc = N.secs[tr.sec];
      const bi = Math.floor(tr.step / bs), si = tr.step % bs;
      if (si === 0) this._bar(tr, Sc, bi, tr.t, stepDur * bs, 60 / P.bpm, P.meter || 4);
      const chords = Sc.bars[bi] || [null];
      const ch = chords[Math.min(chords.length - 1, Math.floor(si / (bs / chords.length)))];
      Sc.mel.forEach((L, li) => {
        const k = tr.step % L.toks.length, tk = L.toks[k];
        if (tk === '-' || tk === '.') return;
        let h = 1; while (L.toks[(k + h) % L.toks.length] === '-' && h < 32) h++;
        const hz = this.freq(tk) * Math.pow(2, (L.oct || 0) / 12), d = h * stepDur * (L.leg || 0.96);
        if (!hz) return;
        const human = legacy ? 0 : (Math.random() - 0.5) * 0.014;
        const vel = legacy ? L.v : L.v * (0.9 + Math.random() * 0.16) * (si % 2 === 0 ? 1.05 : 0.95);
        const tt = tr.t + human;
        this._inst(L.i, hz, tt, d, vel, L.pan, tr.out);
        if (L.also) this._inst(L.alsoI || L.i, hz * Math.pow(2, L.also / 12), tt, d, L.alsoV || vel * 0.6, -(L.pan || 0) || -0.2, tr.out);
        if (legacy || li !== 0) return;
        // a counter-voice a third-to-sixth below, from the chord, joins on repeats
        if (tr.pass >= 1 && ch && h >= 2 && P.counter !== false) {
          const m = Math.round(69 + 12 * Math.log2(hz / 440)), pcs = ch.iv.map(i => (ch.root + i) % 12);
          let n = m - 3; while (n > m - 10 && !pcs.includes(((n % 12) + 12) % 12)) n--;
          if (n > m - 10 && n > 45) this._inst(P.counterI || 'cello', this.m2f(n), tt + 0.012, d, vel * 0.4, -(L.pan || 0) - 0.3, tr.out);
        }
        // and on every other repeat, a glockenspiel sparkle an octave up
        if (tr.pass >= 2 && tr.pass % 2 === 0 && h >= 2 && hz < 1400 && P.sparkle !== false && L.i !== 'glock' && L.i !== 'bell' && L.i !== 'musicbox') this._inst('glock', hz * 2, tt, d, vel * 0.16, 0.35, tr.out);
      });
      tr.step++; tr.t += stepDur;
      if (tr.step >= Sc.total) {
        tr.step = 0; tr.sec++;
        if (tr.sec >= N.secs.length) {
          if (P.loop === false) { tr.done = true; clearInterval(this.timer); this.timer = null; return; }
          tr.sec = P.loopFrom || 0; tr.pass++;
        }
      }
    }
  };

  // ------------------------------------------------------------ new pieces
  Object.assign(SCORE, {
    // tavern: a jig in 6/8 — fiddle, accordion, lute, bodhran
    tavern: { bpm: 126, meter: 3, gain: 1.1, counterI: 'accordion',
      acc: { arp: 'pluck', arpPat: 'jig', arpV: 0.05, arpLo: 57, bass: 'pizz', bassV: 0.13, perc: 'jig', percV: 0.6 },
      secs: [
        { c: 'D | G | D | A | D | G | D,A | D',
          m: [{ i: 'fiddle', v: 0.13, n: 'A4 D5 F#5 A5 F#5 D5 | B4 D5 G5 B5 G5 D5 | A4 D5 F#5 A5 B5 A5 | E5 C#5 A4 E5 C#5 A4 | A4 D5 F#5 A5 F#5 D5 | G5 B5 D6 B5 G5 D5 | F#5 A5 F#5 E5 C#5 E5 | D5 - - D5 - .' }] },
        { c: 'G | D | Em | A | G | D | Em,A | D', acc: { pad: 'accordion', padV: 0.018 },
          m: [{ i: 'fiddle', v: 0.13, also: -12, alsoI: 'accordion', alsoV: 0.06, n: 'B5 - A5 G5 - B5 | A5 - F#5 D5 - F#5 | G5 - E5 B4 - E5 | C#5 D5 E5 A5 - . | B5 - A5 G5 - B5 | A5 F#5 D5 A5 F#5 D5 | E5 G5 B5 A5 G5 E5 | D5 - - D5 - .' }] }
      ] },
    // shop: a breezy little marimba tune
    shop: { bpm: 100, gain: 1.4, counterI: 'pizz',
      acc: { pad: 'strings', padV: 0.018, arp: 'dulcimer', arpPat: 'broken8', arpV: 0.035, arpLo: 57, bass: 'pizz', bassPat: 'boom', bassV: 0.13, perc: 'shuffle', percV: 0.45 },
      secs: [
        { c: 'F | Dm | Bb | C | F | Dm | Gm7,C | F',
          m: [{ i: 'marimba', v: 0.14, n: 'C5 . F5 . A5 G5 F5 . | D5 . F5 . A5 - . . | Bb4 . D5 . F5 E5 D5 . | C5 - E5 - G5 - . . | C5 . F5 . A5 G5 F5 . | A5 . C6 . D6 - C6 . | Bb5 A5 G5 F5 E5 - G5 - | F5 - - - . . . .' }] },
        { c: 'Bb | C | Am | Dm | Bb | C | F,Dm | Gm7,C',
          m: [{ i: 'flute', v: 0.08, n: 'D6 - C6 Bb5 A5 - F5 - | E5 - G5 - C6 - . . | C6 - A5 - E5 - A5 - | F5 - - - D5 - . . | D6 - C6 Bb5 A5 - F5 - | G5 - A5 Bb5 C6 - . . | A5 - G5 - F5 - D5 - | E5 - - - . . . .' },
              { i: 'marimba', v: 0.07, n: '. . F4 . . . F4 . | . . G4 . . . G4 . | . . E4 . . . E4 . | . . F4 . . . D4 . | . . F4 . . . F4 . | . . G4 . . . E4 . | . . A4 . . . A4 . | . . Bb4 . . . E4 .' }] }
      ] },
    // chapel: a hymn — organ, choir, a single bell
    chapel: { bpm: 64, gain: 1.35, counterI: 'choir', sparkle: false,
      acc: { pad: ['organ', 'strings'], padV: [0.035, 0.02], padLo: 50, bass: 'organ', bassV: 0.05 },
      secs: [
        { c: 'G | C/G | G | D | Em | C | G/D,D | G',
          m: [{ i: 'choir', v: 0.11, n: 'B4 - - - D5 - - - | E5 - - - C5 - - - | D5 - - - B4 - - - | A4 - - - - - - - | B4 - - - E5 - - - | E5 - - - C5 - - - | D5 - - - C5 - A4 - | G4 - - - - - - -' },
              { i: 'bell', v: 0.03, n: 'G6 - - - - - - - | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . . | D6 - - - - - - -' }] },
        { c: 'C | G | Am | D | C | G/B | Am7,D | G',
          m: [{ i: 'flute', v: 0.07, n: 'E5 - - - G5 - - - | D5 - - - B4 - - - | C5 - - - E5 - - - | F#5 - - - - - - - | G5 - - - E5 - - - | D5 - - - B4 - - - | C5 - - - A4 - F#4 - | G4 - - - - - - -' }] }
      ] },
    // library / arcane: glass, harp and hush
    library: { bpm: 72, gain: 2.0, counterI: 'flute',
      acc: { pad: 'strings', padV: 0.026, padLo: 50, arp: 'harp', arpPat: 'up8', arpV: 0.03, arpLo: 57, bass: 'cello', bassV: 0.07 },
      secs: [
        { c: 'Dm | Bb | F | C | Dm | Gm | Bb | A',
          m: [{ i: 'glock', v: 0.08, n: 'A5 - - - F5 - D5 - | D6 - - - Bb5 - F5 - | C6 - - - A5 - F5 - | E5 - - - - - . . | A5 - - - D6 - F6 - | E6 - - - D6 - Bb5 - | D6 - - - C6 - Bb5 - | A5 - - - C#6 - - -' }] },
        { c: 'Gm | Dm | Eb | Bb | Gm | Dm | Eb | A7',
          m: [{ i: 'shaku', v: 0.07, n: 'D5 - - - Bb4 - G4 - | A4 - - - F4 - D4 - | G4 - - - Bb4 - Eb5 - | D5 - - - - - . . | D5 - - - G5 - Bb5 - | A5 - - - F5 - D5 - | Eb5 - - - G5 - Bb5 - | A5 - - - C#5 - - -' }] }
      ] },
    // the Academy: bright, a little pompous, very young
    academy: { bpm: 108, gain: 1.05,
      acc: { pad: 'strings', padV: 0.026, arp: 'pizz', arpPat: 'updown8', arpV: 0.055, arpLo: 55, bass: 'bass', bassPat: 'march', bassV: 0.11, perc: 'lite', percV: 0.5 },
      secs: [
        { c: 'C | G/B | Am | Em | F | C/E | Dm7 | G',
          m: [{ i: 'strings', v: 0.11, also: 12, alsoI: 'glock', alsoV: 0.04, n: 'G5 - E5 - C5 - E5 G5 | D6 - - - B5 - G5 - | C6 - B5 - A5 - E5 - | G5 - - - - - . . | A5 - C6 - F5 - A5 - | G5 - E5 - C5 - E5 - | F5 - E5 - D5 - C5 D5 | D5 - - - - - . .' }] },
        { c: 'F | G | Em | Am | Dm | G | C,Am | Dm7,G', crash: true, acc: { pad: ['strings', 'horn'], padV: [0.028, 0.02], timp: 'end', timpV: 0.2 },
          m: [{ i: 'horn', v: 0.13, n: 'A5 - - G5 F5 - C5 - | B5 - - A5 G5 - D5 - | G5 - - F5 E5 - B4 - | C5 - - - E5 - A5 - | F5 - - E5 D5 - A5 - | G5 - - - B5 - D6 - | C6 - - - A5 - E5 - | F5 - - - D5 - B4 -', oct: -12 }] }
      ] },
    // training hall: taiko, driving strings
    training: { bpm: 132, gain: 0.75,
      acc: { pad: 'strings', padV: 0.022, padLo: 50, arp: 'stac', arpPat: 'ost16', arpV: 0.06, bass: 'bass', bassPat: 'eighths', bassV: 0.1, perc: 'drive', percV: 0.7, timp: 'beat13', timpV: 0.25 },
      secs: [
        { c: 'Em | C | D | Bm | Em | C | Am | B', crash: true,
          m: [{ i: 'brass', v: 0.13, also: -12, alsoI: 'horn', alsoV: 0.07, n: 'E5 - - B4 E5 - G5 - | G5 - - E5 C5 - - - | D5 - - A4 D5 - F#5 - | F#5 - - - D5 - B4 - | E5 - - B4 E5 - G5 - | A5 - G5 - E5 - C5 - | C5 - D5 - E5 - A5 - | B5 - - - D#5 - - -' }] },
        { c: 'C | D | Em | Em | C | D | B | B7',
          m: [{ i: 'strings', v: 0.12, also: 12, alsoI: 'flute', alsoV: 0.04, n: 'G5 - - - A5 - B5 - | A5 - - - F#5 - D5 - | E5 - - - B4 - E5 - | G5 - - - - - . . | E6 - - - D6 - C6 - | D6 - - - A5 - F#5 - | B5 - - - F#5 - D#5 - | B5 - - - - - . .' }] }
      ] },
    // forest: 3/4, harp and wooden flute, old and green
    forest: { bpm: 86, meter: 3, gain: 1.35, counterI: 'strings',
      acc: { pad: 'strings', padV: 0.026, padLo: 50, arp: 'harp', arpPat: 'up8', arpV: 0.04, arpLo: 57, bass: 'cello', bassPat: 'waltz', bassV: 0.08 },
      secs: [
        { c: 'Am | G | Am | Em | F | G | Am | E',
          m: [{ i: 'shaku', v: 0.09, n: 'E5 - A5 - B5 - | D6 - B5 - G5 - | A5 - - - E5 - | G5 - - - - - | F5 - A5 - C6 - | B5 - A5 - G5 - | A5 - - - C6 - | B5 - - - G#5 -' }] },
        { c: 'F | C | G | Am | F | C | Dm | E', acc: { pad: ['strings', 'choir'], padV: [0.026, 0.018] },
          m: [{ i: 'flute', v: 0.09, n: 'A5 - - G5 F5 - | E5 - - - C5 - | D5 - - E5 B4 - | C5 - - - A4 - | A5 - - G5 F5 - | G5 - - - C6 - | A5 - F5 - D5 - | E5 - - - - -' },
              { i: 'bell', v: 0.02, n: '. . . . E7 - | . . . . . . | . . . . D7 - | . . . . . . | . . . . C7 - | . . . . . . | . . . . . . | B6 - - - - -' }] }
      ] },
    // the royal nursery: a music box
    cradle: { bpm: 80, meter: 3, gain: 1.8, sparkle: false, counterI: 'flute',
      acc: { pad: 'strings', padV: 0.016, arp: 'musicbox', arpPat: 'waltz', arpV: 0.03, arpLo: 60, bass: 'harp', bassPat: 'waltz', bassV: 0.05 },
      secs: [
        { c: 'F | C/E | Dm | Bb | F | Gm | C | F',
          m: [{ i: 'musicbox', v: 0.1, n: 'C6 - A5 - F5 - | E5 - G5 - C6 - | D6 - C6 - A5 - | Bb5 - - - - - | A5 - C6 - F6 - | E6 - D6 - Bb5 - | G5 - A5 - E5 - | F5 - - - - -' }] },
        { c: 'Bb | F | Gm | C | Bb | F/A | Gm,C | F',
          m: [{ i: 'musicbox', v: 0.09, n: 'D6 - - - F6 - | C6 - - - A5 - | Bb5 - - - D6 - | C6 - - - - - | D6 - - - F6 - | C6 - - - A5 - | Bb5 - A5 - G5 - | F5 - - - - -' }] }
      ] }
  });
  SCORE_ALIASES.unshift([/portal|goddess/, 'void'], [/lullaby|nursery|baby/, 'cradle']);

  // the right music for the room you're in
  const _musicFor = musicFor;
  musicFor = function (id) {
    const base = _musicFor(id), m = MAPS[id] || {};
    const k = typeof stageKind === 'function' ? stageKind(id) : '';
    if (id === 'realm_home') return 'cradle';
    if (id === 'academy' || id === 'ac_hall') return 'academy';
    if (k === 'tavern') return 'tavern';
    if (k === 'shop' && id !== 'konbini') return 'shop';
    if (k === 'chapel') return 'chapel';
    if (k === 'library') return 'library';
    if (k === 'dojo') return 'training';
    if (k === 'forest' && !m.interior && base === 'field') return 'forest';
    return base;
  };

  // ------------------------------------------------------------ voices
  S._talk = function () {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + 0.003, nm = this.voice;
    if (!nm) { this.tone(760 + Math.random() * 60, t, 0.016, 'sine', 0.016, this.sfxBus); return; }
    let h = 7; for (let i = 0; i < nm.length; i++) h = (h * 31 + nm.charCodeAt(i)) >>> 0;
    const base = 150 + (h % 11) * 34;
    const f = base * Math.pow(2, (Math.floor(Math.random() * 5) - 2) * 0.12);
    const type = ['triangle', 'square', 'triangle', 'sawtooth'][(h >> 5) & 3];
    const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1400 + ((h >> 9) % 1400); lp.Q.value = 2;
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (Math.random() < 0.5 ? 1.07 : 0.94), t + 0.05);
    const pk = type === 'triangle' ? 0.1 : 0.05;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
    o.connect(lp); lp.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + 0.08);
  };
  const _push = Scenes.push;
  Scenes.push = function (s) { if (typeof DialogScene !== 'undefined' && s instanceof DialogScene) S.voice = s.name || null; return _push.apply(this, arguments); };

  // ------------------------------------------------------------ footsteps
  S.step = function (surf) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + 0.002; this._stepN = (this._stepN || 0) + 1;
    const out = this._out(this.sfxBus, this._stepN % 2 ? -0.12 : 0.12), r = 0.88 + Math.random() * 0.24;
    switch (surf) {
      case 'grass': this._nz(t, 0.1, out, 'bandpass', 2400 * r, 0.9, 0.05, 1300); this._nz(t + 0.01, 0.05, out, 'lowpass', 380, 0.7, 0.04); break;
      case 'tall': this._nz(t, 0.18, out, 'bandpass', 3000 * r, 0.7, 0.07, 1500); this._nz(t + 0.05, 0.12, out, 'highpass', 4500, 0.7, 0.025); break;
      case 'dirt': this._nz(t, 0.07, out, 'lowpass', 850 * r, 0.8, 0.08); this._nz(t, 0.04, out, 'bandpass', 2300, 1, 0.022); break;
      case 'stone': this._nz(t, 0.028, out, 'bandpass', 3300 * r, 1.4, 0.05); this.tone(150 * r, t, 0.05, 'triangle', 0.035, out, 90); break;
      case 'wood': this.tone(200 * r, t, 0.08, 'triangle', 0.06, out, 120); this._nz(t, 0.04, out, 'bandpass', 1300 * r, 2, 0.04); break;
      case 'carpet': this._nz(t, 0.06, out, 'lowpass', 480 * r, 0.7, 0.05); break;
      case 'water': this._nz(t, 0.16, out, 'bandpass', 1200 * r, 1.2, 0.06, 3000); this._nz(t + 0.03, 0.1, out, 'highpass', 4000, 0.7, 0.028); break;
      case 'ash': this._nz(t, 0.11, out, 'bandpass', 1700 * r, 0.6, 0.06, 650); break;
      case 'gravel': this._nz(t, 0.09, out, 'bandpass', 2600 * r, 0.8, 0.05); for (let i = 0; i < 3; i++) this._nz(t + i * 0.018, 0.012, out, 'highpass', 3500, 1, 0.02); break;
    }
  };
  function surfaceAt(w, tx, ty) {
    const c = w.tile(tx, ty), m = w.map;
    if (!m.interior && (Weather.kind === 'rain' || Weather.kind === 'storm')) return 'water';
    if (c === ',') return 'tall';
    if ('.f"'.includes(c)) return m.theme === 'ash' ? 'ash' : m.theme === 'cave' ? 'gravel' : m.theme === 'castle' ? 'stone' : m.interior ? 'wood' : m.theme === 'tokyo' || m.theme === 'city' || m.theme === 'town' ? 'stone' : 'grass';
    if (c === '=') return 'dirt';
    if ('c;'.includes(c)) return 'gravel';
    if (c === 'a') return 'ash';
    if ('K-'.includes(c)) return 'carpet';
    if ('ouxm'.includes(c)) return 'wood';
    if ('B'.includes(c)) return 'wood';
    if ('s_jdp:'.includes(c)) return 'stone';
    return m.interior ? 'wood' : m.theme === 'castle' ? 'stone' : 'dirt';
  }
  const _foot = WorldScene.prototype.footstep;
  WorldScene.prototype.footstep = function (tx, ty, e) {
    if (e === this.player) S.step(surfaceAt(this, tx, ty));
    return _foot.call(this, tx, ty, e);
  };

  // extra body on a few effects
  const _sfx = S.sfx;
  S.sfx = function (name) {
    if (!this.ctx) return;
    if (name === 'talk') return this._talk();
    if (name === 'step') return this.step('dirt');
    _sfx.call(this, name);
    const c = this.ctx, t = c.currentTime + 0.005, B = this.sfxBus;
    switch (name) {
      case 'door': { const o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(70, t + 0.3); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 7; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32); o.connect(bp); bp.connect(g); g.connect(B); o.start(t); o.stop(t + 0.34); break; }
      case 'hit': this._kick(t + 0.05, 0.3, B); break;
      case 'crit': this._kick(t + 0.06, 0.45, B); this._crash(t + 0.06, 0.05, B); break;
      case 'chest': this._nz(t, 0.18, B, 'bandpass', 600, 4, 0.06, 380); break;
      case 'coin': this.INST.glock.call(this, 2637, t + 0.12, 0.2, 0.03, 0.2, B); break;
      case 'levelup': this._timp(this.m2f(43), t + 0.42, 0.35, B); this._crash(t + 0.42, 0.05, B); break;
    }
  };

  // ------------------------------------------------------------ ambience
  const AMB = {
    town:    { wind: 0.22, leaves: 0.12, crowd: 0.3, birds: 1, space: 'outdoor' },
    city:    { wind: 0.14, crowd: 0.65, birds: 0.5, clop: 1, space: 'outdoor' },
    hold:    { wind: 0.3, crowd: 0.3, clang: 1, space: 'outdoor' },
    forest:  { wind: 0.3, leaves: 0.55, birds: 1.7, pecker: 1, space: 'outdoor' },
    night:   { wind: 0.2, leaves: 0.15, crickets: 1, owl: 1, space: 'outdoor', night: true },
    ash:     { wind: 0.75, rumble: 0.5, boom: 1, space: 'outdoor' },
    cave:    { cave: 0.6, drips: 1.2, space: 'cave' },
    vault:   { cave: 0.45, drips: 0.6, space: 'cave' },
    castle:  { wind: 0.45, cave: 0.3, drips: 0.35, chains: 1, space: 'hall' },
    tokyo:   { hum: 0.55, wind: 0.1, cars: 1, crossing: 1, space: 'outdoor', night: true },
    konbini: { room: 0.35, fridge: 0.7, space: 'room' },
    tavern:  { room: 0.35, crowd: 0.55, clinks: 1, space: 'room' },
    shop:    { room: 0.35, creak: 1, space: 'room' },
    chapel:  { room: 0.3, wind: 0.07, space: 'hall' },
    hall:    { room: 0.35, crowd: 0.1, space: 'hall' },
    home:    { room: 0.3, clock: 1, space: 'room' },
    library: { room: 0.3, clock: 0.8, pages: 1, space: 'hall' },
    dojo:    { room: 0.35, clang: 0.5, space: 'hall' },
    road:    { wind: 0.4, leaves: 0.25, birds: 0.8, space: 'outdoor' },
    title:   { wind: 0.55, rumble: 0.15, space: 'outdoor' },
    none:    {}
  };
  function ambKind(id) {
    const m = MAPS[id] || {};
    if (m.theme === 'night' && !m.interior) return 'night';
    const k = typeof stageKind === 'function' ? stageKind(id) : 'town';
    return AMB[k] ? k : (m.interior ? 'home' : 'town');
  }
  S.ambKind = ambKind;

  // a bed is a looping, filtered noise source with a slow wobble
  S._bed = function (name, chain, lfo, pan) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true; src.playbackRate.value = 0.9 + Math.random() * 0.2;
    let node = src;
    let first = null;
    for (const [type, f, q] of chain) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; node.connect(b); node = b; first = first || b; }
    const mod = c.createGain(); mod.gain.value = 1; node.connect(mod);
    if (lfo) for (const [rate, depth, target] of lfo) {
      const o = c.createOscillator(), og = c.createGain(); o.frequency.value = rate * (0.9 + Math.random() * 0.2); og.gain.value = depth;
      o.connect(og); og.connect(target === 'f' ? first.frequency : mod.gain); o.start();
    }
    const g = c.createGain(); g.gain.value = 0; mod.connect(g);
    let p = null;
    if (c.createStereoPanner) { p = c.createStereoPanner(); p.pan.value = pan || 0; g.connect(p); p.connect(this.ambMix); } else g.connect(this.ambMix);
    src.start(0, Math.random() * 1.9);
    return { g, p };
  };
  S._ambInit = function () {
    if (this._beds || !this.ctx || !this.ambMix) return;
    const B = this._beds = {};
    B.wind = this._bed('wind', [['bandpass', 450, 0.6]], [[0.07, 220, 'f'], [0.11, 0.45, 'g']], -0.5);
    B.wind2 = this._bed('wind2', [['bandpass', 720, 0.6]], [[0.05, 300, 'f'], [0.09, 0.45, 'g']], 0.5);
    B.leaves = this._bed('leaves', [['highpass', 3000, 0.5], ['lowpass', 7500, 0.5]], [[0.21, 0.55, 'g']], 0.2);
    B.crowd = this._bed('crowd', [['bandpass', 650, 0.9]], [[0.31, 0.25, 'g'], [0.47, 180, 'f']], -0.1);
    B.room = this._bed('room', [['lowpass', 320, 0.3]], null, 0);
    B.hum = this._bed('hum', [['lowpass', 150, 0.8]], [[0.13, 0.3, 'g']], 0);
    B.cave = this._bed('cave', [['lowpass', 110, 0.8]], [[0.05, 0.4, 'g']], 0);
    B.rumble = this._bed('rumble', [['lowpass', 70, 1.2]], [[0.09, 0.6, 'g']], 0);
    B.fridge = this._bed('fridge', [['bandpass', 120, 4]], [[0.2, 0.1, 'g']], 0.3);
    B.rain = this._bed('rain', [['highpass', 1500, 0.5], ['lowpass', 8000, 0.5]], [[0.3, 0.12, 'g']], 0);
    B.rainLow = this._bed('rainLow', [['lowpass', 450, 0.6]], null, 0);
    B.water = this._bed('water', [['bandpass', 1000, 0.45]], [[2.3, 0.28, 'g'], [0.4, 250, 'f']], 0);
    B.fire = this._bed('fire', [['lowpass', 260, 0.6]], [[7, 0.3, 'g']], 0);
    B.lava = this._bed('lava', [['lowpass', 95, 2]], [[0.3, 0.4, 'g']], 0);
    this._nextClock = 0; this._clockN = 0;
    this._ambTimer = setInterval(() => { try { this._ambTick(); } catch (e) { console.warn('amb', e); } }, 200);
  };
  const BASE = { wind: 0.18, wind2: 0.14, leaves: 0.07, crowd: 0.18, room: 0.07, hum: 0.22, cave: 0.4, rumble: 0.6, fridge: 0.1, rain: 0.16, rainLow: 0.2, water: 0.15, fire: 0.2, lava: 0.5 };
  function near(w, set, rad) {
    const p = w.player; let acc = 0, pa = 0;
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (!set.includes(w.tile(p.x + dx, p.y + dy))) continue;
      const d = Math.sqrt(dx * dx + dy * dy); if (d > rad) continue;
      const k = Math.pow(1 - d / (rad + 0.5), 2); acc += k; pa += k * dx / rad;
    }
    return [Math.min(1, acc / 4), acc ? Math.max(-1, Math.min(1, pa / acc * 1.4)) : 0];
  }
  S._ambTick = function () {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const now = c.currentTime, dt = 0.2;
    const st = (Scenes.stack || []).map(s => s && s.constructor && s.constructor.name);
    let kind = 'none', duck = 1, w = null;
    if (st.includes('BattleScene') || st.includes('ResolveCut')) duck = 0.12;
    if (['CreditsScene', 'HookScene', 'BirthScene', 'CardScene', 'GameOverScene'].some(n => st.includes(n))) duck = 0;
    if (st.includes('TravelScene')) kind = 'road';
    else if (st.includes('WorldScene') && typeof World !== 'undefined' && World && World.map && G) { w = World; kind = ambKind(G.map); }
    else if (st.includes('TitleScene')) kind = 'title';
    const cfg = AMB[kind] || AMB.none;
    const m = w ? w.map : null, out = !m || !m.interior;
    this.setSpace(cfg.space || 'outdoor');
    const wet = out && kind !== 'title' && (Weather.kind === 'rain' || Weather.kind === 'storm'), storm = out && Weather.kind === 'storm';
    const tgt = {};
    for (const k in BASE) tgt[k] = cfg[k] || 0;
    tgt.wind2 = tgt.wind;
    if (wet) { tgt.rain = storm ? 1 : 0.6; tgt.rainLow = storm ? 0.9 : 0.4; tgt.wind += storm ? 0.4 : 0.1; tgt.wind2 = tgt.wind; tgt.crowd *= 0.4; }
    else if (m && m.interior && Weather.kind && (Weather.kind === 'rain' || Weather.kind === 'storm')) tgt.rainLow = 0.25;
    let waterP = 0, fireL = 0, lavaL = 0;
    if (w && w.player) {
      const [wl, wp] = near(w, '~B', 7); tgt.water = wl; waterP = wl;
      if (this._beds.water.p) this._beds.water.p.pan.setTargetAtTime(wp, now, 0.3);
      const [fl, fp] = near(w, 'zO!', 5); tgt.fire = fl; fireL = fl;
      if (this._beds.fire.p) this._beds.fire.p.pan.setTargetAtTime(fp, now, 0.3);
      const [ll, lp] = near(w, 'L^', 6); tgt.lava = ll; lavaL = ll;
      if (this._beds.lava.p) this._beds.lava.p.pan.setTargetAtTime(lp, now, 0.3);
    }
    for (const k in this._beds) this._beds[k].g.gain.setTargetAtTime(tgt[k] * BASE[k], now, k === 'water' || k === 'fire' ? 0.5 : 1.4);
    this.ambMix.gain.setTargetAtTime(duck, now, duck < 1 ? 0.25 : 0.8);
    if (duck < 0.5) return;
    // occasional sounds
    const R = (rate) => Math.random() < rate * dt;
    const bird = (cfg.birds || 0) * (wet || cfg.night ? 0 : 1);
    if (bird && R(0.3 * bird)) this._bird();
    if (cfg.crickets && R(2.2)) this._cricket();
    if (cfg.owl && R(0.035)) this._owl();
    if ((cfg.night || kind === 'night') && waterP > 0.15 && R(0.7 * waterP)) this._frog();
    if (waterP > 0.2 && !cfg.night && R(0.12 * waterP)) this._plop();
    if (cfg.drips && R(0.6 * cfg.drips)) this._drip();
    if (fireL > 0.05 && R(4 * fireL)) this._crackle(fireL);
    if (lavaL > 0.05 && R(1.5 * lavaL)) this._blub(lavaL);
    if (cfg.crowd && R(2.4 * cfg.crowd * (wet ? 0.3 : 1))) this._babble(cfg.crowd);
    if (cfg.crowd && R(0.04 * cfg.crowd)) this._laugh();
    if (cfg.clinks && R(0.3)) this._clink();
    if (cfg.pages && R(0.08)) this._page();
    if (cfg.clang && R(0.3 * cfg.clang)) this._anvil();
    if (cfg.chains && R(0.05)) this._chains();
    if (cfg.boom && R(0.06)) this._boom();
    if (cfg.cars && R(0.14)) this._car();
    if (cfg.crossing && R(0.012)) this._crossing();
    if (cfg.creak && R(0.04)) this._creak();
    if (cfg.pecker && !wet && R(0.03)) this._pecker();
    if (cfg.clop && !wet && R(0.05)) this._clop();
    if (cfg.clock) {
      if (this._nextClock < now) this._nextClock = now + 0.05;
      while (this._nextClock < now + 0.4) { this._tick(this._nextClock, this._clockN++ % 2, cfg.clock); this._nextClock += 1; }
    }
  };
  // ---- the little sounds
  S._ping = function (t, f, f2, dur, v, pan, type) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), dest = this._out(this.ambMix, pan);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(0.012, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  };
  S._bird = function () {
    const t = this.ctx.currentTime + 0.02, pan = Math.random() * 1.8 - 0.9, sp = Math.floor(Math.random() * 4), v = 0.012 + Math.random() * 0.018;
    const f0 = 2200 + Math.random() * 2000;
    if (sp === 0) { const n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) this._ping(t + i * (0.09 + Math.random() * 0.06), f0 * (1 + Math.random() * 0.2), f0 * (0.75 + Math.random() * 0.6), 0.06 + Math.random() * 0.05, v, pan); }
    else if (sp === 1) { for (let i = 0; i < 9; i++) this._ping(t + i * 0.045, f0 * 1.2, f0 * 1.05, 0.035, v * 0.8, pan); }
    else if (sp === 2) { this._ping(t, f0 * 0.7, f0 * 1.1, 0.22, v, pan); this._ping(t + 0.3, f0 * 1.1, f0 * 0.65, 0.3, v, pan); }
    else { for (let i = 0; i < 3; i++) { this._ping(t + i * 0.28, f0, f0 * 1.5, 0.08, v, pan); this._ping(t + i * 0.28 + 0.09, f0 * 1.4, f0 * 0.9, 0.1, v * 0.8, pan); } }
  };
  S._cricket = function () {
    const t = this.ctx.currentTime + 0.02, pan = Math.random() * 2 - 1, f = 4300 + Math.random() * 500, n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) this._ping(t + i * 0.035, f, 0, 0.022, 0.009, pan);
  };
  S._owl = function () {
    const t = this.ctx.currentTime + 0.05, pan = Math.random() * 1.4 - 0.7, f = 330 + Math.random() * 40;
    this._ping(t, f, f * 0.94, 0.4, 0.03, pan); this._ping(t + 0.6, f, f * 0.95, 0.18, 0.025, pan); this._ping(t + 0.82, f * 1.02, f * 0.92, 0.45, 0.03, pan);
  };
  S._frog = function () {
    const t = this.ctx.currentTime + 0.02, pan = Math.random() * 2 - 1, f = 90 + Math.random() * 50, c = this.ctx;
    for (let i = 0; i < 2; i++) { const o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t + i * 0.16); o.frequency.linearRampToValueAtTime(f * 1.2, t + i * 0.16 + 0.1); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 3; g.gain.setValueAtTime(0.0001, t + i * 0.16); g.gain.linearRampToValueAtTime(0.04, t + i * 0.16 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.12); o.connect(bp); bp.connect(g); g.connect(this._out(this.ambMix, pan)); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.14); }
  };
  S._plop = function () { const t = this.ctx.currentTime + 0.02, pan = Math.random() * 1.6 - 0.8; this._ping(t, 500 + Math.random() * 300, 1300, 0.07, 0.03, pan); };
  S._drip = function () {
    const t = this.ctx.currentTime + 0.02, pan = Math.random() * 1.8 - 0.9, f = 1300 + Math.random() * 1400;
    this._ping(t, f, f * 0.65, 0.05, 0.035, pan); this._ping(t + 0.26, f, f * 0.65, 0.05, 0.012, -pan); this._ping(t + 0.52, f, f * 0.65, 0.05, 0.005, pan);
  };
  S._crackle = function (lv) { const t = this.ctx.currentTime + Math.random() * 0.15; const d = this._out(this.ambMix, (Math.random() - 0.5) * 0.4); this._nz(t, 0.012 + Math.random() * 0.02, d, 'highpass', 1800 + Math.random() * 2500, 0.8, 0.05 * lv + 0.02); };
  S._blub = function (lv) { const t = this.ctx.currentTime + 0.02; this._ping(t, 60 + Math.random() * 60, 190, 0.14, 0.09 * lv, Math.random() - 0.5); this._nz(t + 0.1, 0.08, this.ambMix, 'lowpass', 500, 0.7, 0.05 * lv); };
  S._babble = function (lv) {
    const c = this.ctx, t0 = c.currentTime + Math.random() * 0.2, pan = Math.random() * 1.8 - 0.9, f = 120 + Math.random() * 160, n = 2 + Math.floor(Math.random() * 4);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 600; bp.Q.value = 2.5; bp.connect(this._out(this.ambMix, pan));
    let t = t0;
    for (let i = 0; i < n; i++) {
      const d = 0.06 + Math.random() * 0.08, o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f * (0.9 + Math.random() * 0.25), t); o.frequency.linearRampToValueAtTime(f * (0.85 + Math.random() * 0.3), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.012 + 0.01 * lv, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(bp); o.start(t); o.stop(t + d + 0.02); t += d + 0.02 + Math.random() * 0.05;
    }
  };
  S._laugh = function () {
    const c = this.ctx, t0 = c.currentTime + 0.02, pan = Math.random() * 1.6 - 0.8, f = 200 + Math.random() * 120;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1000; bp.Q.value = 2; bp.connect(this._out(this.ambMix, pan));
    for (let i = 0; i < 5; i++) { const t = t0 + i * 0.13, o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * (1 - i * 0.04), t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g); g.connect(bp); o.start(t); o.stop(t + 0.1); }
  };
  S._clink = function () { const t = this.ctx.currentTime + 0.02, pan = Math.random() * 1.6 - 0.8, f = 2300 + Math.random() * 900; this._ping(t, f, 0, 0.25, 0.018, pan); this._ping(t, f * 2.7, 0, 0.12, 0.008, pan); if (Math.random() < 0.5) { this._ping(t + 0.07, f * 1.1, 0, 0.22, 0.014, pan); } };
  S._page = function () { this._nz(this.ctx.currentTime + 0.02, 0.28, this._out(this.ambMix, Math.random() - 0.5), 'bandpass', 2600, 1.2, 0.03, 1100); };
  S._anvil = function () {
    const t = this.ctx.currentTime + 0.02, pan = this._anvilPan = this._anvilPan != null ? this._anvilPan : Math.random() * 1.2 - 0.6;
    for (let k = 0; k < 2; k++) for (const [h, l, d] of [[1, 1, 0.6], [2.4, 0.5, 0.4], [4.1, 0.3, 0.25]]) this._ping(t + k * 0.42, 820 * h, 0, d, 0.014 * l * (k ? 0.8 : 1), pan);
  };
  S._chains = function () { const t = this.ctx.currentTime + 0.02, pan = Math.random() * 1.6 - 0.8, n = 5 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) this._ping(t + i * (0.05 + Math.random() * 0.05), 2800 + Math.random() * 2200, 0, 0.07, 0.01, pan); };
  S._boom = function () { const t = this.ctx.currentTime + 0.02; this._nz(t, 2.2, this.ambMix, 'lowpass', 180, 0.8, 0.12, 50); this._ping(t, 48, 32, 1.6, 0.06, 0); };
  S._car = function () {
    const c = this.ctx, t = c.currentTime + 0.02, dir = Math.random() < 0.5 ? 1 : -1, d = 2.6 + Math.random() * 1.5;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(350, t); bp.frequency.linearRampToValueAtTime(520, t + d / 2); bp.frequency.linearRampToValueAtTime(300, t + d); bp.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + d / 2); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(bp); bp.connect(g);
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.setValueAtTime(-dir, t); p.pan.linearRampToValueAtTime(dir, t + d); g.connect(p); p.connect(this.ambMix); } else g.connect(this.ambMix);
    s.start(t, Math.random()); s.stop(t + d + 0.05);
  };
  S._crossing = function () { const t = this.ctx.currentTime + 0.05; for (let i = 0; i < 12; i++) this._ping(t + i * 0.42, i % 2 ? 760 : 700, 0, 0.3, 0.012, 0.6, 'triangle'); this._nz(t + 1.5, 3.5, this._out(this.ambMix, 0.5), 'lowpass', 160, 0.7, 0.08); };
  S._creak = function () { const c = this.ctx, t = c.currentTime + 0.02, o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(55 + Math.random() * 30, t + 0.5); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 9; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(bp); bp.connect(g); g.connect(this._out(this.ambMix, Math.random() - 0.5)); o.start(t); o.stop(t + 0.6); };
  S._pecker = function () { const t = this.ctx.currentTime + 0.02, pan = Math.random() * 1.6 - 0.8, d = this._out(this.ambMix, pan); for (let i = 0; i < 12; i++) this._nz(t + i * 0.045, 0.012, d, 'bandpass', 1500, 3, 0.05 * (1 - i / 16)); };
  S._clop = function () { const t = this.ctx.currentTime + 0.02, dir = Math.random() < 0.5 ? 1 : -1; for (let i = 0; i < 10; i++) { const pan = -dir + dir * 2 * i / 9, tt = t + i * 0.2 + (i % 2) * 0.05; this._ping(tt, 420 + Math.random() * 60, 300, 0.04, 0.02, pan, 'triangle'); } };
  S._tick = function (t, alt, lv) { this._ping(t, alt ? 1650 : 1900, 0, 0.02, 0.012 * lv, 0.2, 'triangle'); this._nz(t, 0.01, this.ambMix, 'bandpass', 3200, 3, 0.02 * lv); };

  const _unlock = S.unlock;
  S.unlock = function () { _unlock.call(this); this.applyVolume(); this._ambInit(); };
})();
