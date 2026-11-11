// =====================================================================
//  daynight.js : the world keeps time
//   - a clock that runs while you explore (a full day is ~14 minutes)
//   - dawn blush, bright day, golden dusk, moonlit night, on every
//     outdoor map that isn't already night, a cave or a castle
//   - the sun moves: god rays, flare and shadows follow it
//   - at night windows light up (and go dark as the town goes to bed),
//     lamps burn brighter, stars shiver on the water, fireflies come
//     out over the grass, moths circle the lamps, bats flit at dusk
//   - indoors, window light turns from sunbeams to moonlight
//   - the score has night arrangements: softer, slower, no drums
//   - resting at an inn wakes you at seven in the morning
// =====================================================================
const DN = {
  RATE: 1 / 0.58,          // game minutes per real second
  hour() { return ((G && G.clock != null ? G.clock : 510) / 60) % 24; },
  // 0 = night, 1 = full day
  day(h = this.hour()) {
    if (h < 4.6 || h >= 19.6) return 0;
    if (h < 6.6) return smooth01((h - 4.6) / 2);
    if (h < 17.2) return 1;
    return 1 - smooth01((h - 17.2) / 2.4);
  },
  dusk(h = this.hour()) { return h >= 16.6 && h < 20.2 ? Math.sin(Math.PI * (h - 16.6) / 3.6) : 0; },
  dawn(h = this.hour()) { return h >= 4.4 && h < 7.4 ? Math.sin(Math.PI * (h - 4.4) / 3) : 0; },
  night(h) { return 1 - this.day(h); },
  isNight() { const h = this.hour(); return h >= 19.75 || h < 5.25; },
  applies(m) {
    if (!m || m.dark || m.tutorial || m.fixedTime) return false;
    if (m.interior) return !['tk_home', 'tk_class', 'konbini'].includes(G.map);
    return !['tokyo', 'night', 'cave', 'castle'].includes(m.theme);
  },
  outdoorsLive(w) { return w && w.map && !w.map.interior && this.applies(w.map); },
  label(h = this.hour()) {
    return h < 5 ? 'Small hours' : h < 7 ? 'Dawn' : h < 11 ? 'Morning' : h < 13.5 ? 'Midday' : h < 17 ? 'Afternoon' : h < 19.5 ? 'Evening' : h < 23 ? 'Night' : 'Midnight';
  },
  clockText(h = this.hour()) {
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 10) * 10, ap = hh < 12 ? 'am' : 'pm';
    return `${(hh % 12) || 12}:${String(mm).padStart(2, '0')} ${ap}`;
  }
};
function smooth01(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

(function () {
  const P = WorldScene.prototype;

  // ------------------------------------------------------------ the clock
  const up0 = P.update;
  P.update = function (dt) {
    if (G && G.clock == null) G.clock = 510;
    if (G && this.lock === 0 && Scenes.top() === this) G.clock = (G.clock + dt * DN.RATE) % 1440;
    up0.call(this, dt);
    // swap the score between day and night arrangements as the hour turns
    const n = DN.isNight() && DN.outdoorsLive(this);
    if (this._wasNight !== undefined && n !== this._wasNight && Scenes.top() === this && Sound._base) Sound.play(Sound._base);
    this._wasNight = n;
  };

  // ------------------------------------------------------------ the light
  const amb0 = P.ambientLight;
  P.ambientLight = function () {
    let c = amb0.call(this);
    const m = this.map;
    if (!DN.applies(m)) return c;
    const flat = typeof Perf !== 'undefined' && !Gfx.lights;
    if (m.interior) {
      const n = DN.night();
      return n > 0 ? mixCol(c, '#8a7896', 0.32 * n) : c;
    }
    const n = DN.night(), du = DN.dusk(), da = DN.dawn();
    if (du > 0) c = mixCol(c, '#ff7a40', 0.46 * du);
    if (da > 0) c = mixCol(c, '#e6a0c8', 0.3 * da);
    if (n > 0) c = mixCol(c, flat ? '#6a78b8' : '#28336e', (flat ? 0.55 : 0.82) * n);
    return c;
  };
  const sun0 = P.sunPos;
  P.sunPos = function () {
    const s = sun0.call(this);
    if (!s || !DN.applies(this.map) || this.map.interior) return s;
    const h = DN.hour(), d = DN.day(h);
    if (d < 0.18) return null;
    const p = Math.max(0, Math.min(1, (h - 5.5) / 13.5));            // 0 sunrise .. 1 sunset
    const elev = Math.sin(Math.PI * p);
    const x = W * (0.96 - 0.92 * p), y = 150 - elev * 110;
    const warm = 1 - Math.min(1, elev * 1.6);
    const col = [255, Math.round(240 - 100 * warm), Math.round(190 - 120 * warm)];
    return [x, y, col];
  };

  // extra light sources after dark
  const lights0 = Detail.lights;
  Detail.lights = function (w, camX, camY) {
    lights0.call(this, w, camX, camY);
    if (!DN.outdoorsLive(w)) return;
    const n = DN.night(); if (n < 0.05) return;
    const h = DN.hour(), x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    const late = h >= 22.5 || h < 5;
    for (let ty = y0 - 1; ty <= y0 + Math.ceil(H / TS) + 1; ty++) for (let tx = x0 - 1; tx <= x0 + Math.ceil(W / TS) + 1; tx++) {
      const ch = w.tile(tx, ty), sx = tx * TS - camX, sy = ty * TS - camY;
      if (ch === 'W') {
        const hh = hash2(tx * 3, ty * 5);
        if (late && hh % 3 !== 0) continue;                       // the town goes to bed
        const fl = 0.9 + Math.sin(TIME * (2 + hh % 3) + hh) * 0.06;
        FX.addLight(sx + 16, sy + 30, 44 * fl, 'rgba(255,186,100,1)', 0.75 * n);   // the window and its pool of light below
      } else if (ch === '@') FX.addLight(sx + 16, sy + 10, 120, 'rgba(255,176,96,1)', 0.5 * n);
      else if (ch === 'E' || ch === ']') FX.addLight(sx + 16, sy + 20, 42, 'rgba(255,180,100,1)', 0.4 * n);
    }
    // the moon: a cool wash so the night is blue rather than black
    FX.addLight(W * 0.25, -60, 700, 'rgba(90,120,220,1)', 0.12 * n);
  };

  // ------------------------------------------------------------ night life
  const air0 = Detail.air;
  Detail.air = function (w, camX, camY) {
    air0.call(this, w, camX, camY);
    if (!this.on(w) || !DN.outdoorsLive(w)) return;
    const n = DN.night(), du = DN.dusk(), x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    this.dnFlies = [];
    const wet = ['rain', 'storm', 'snow'].includes(Weather.kind);
    // fireflies drift over the grass after dark
    if (n > 0.4 && !wet) {
      for (let i = 0; i < 22; i++) {
        const bx = (i * 157 + 41) % (W + 40) - 20, by = (i * 211 + 17) % (H + 40) - 20;
        let wx = bx + Math.floor(camX / W) * W; if (wx < camX - 20) wx += W;
        let wy = by + Math.floor(camY / H) * H; if (wy < camY - 20) wy += H;
        const tx = Math.floor(wx / TS), ty = Math.floor(wy / TS), ch = w.tile(tx, ty);
        if (!'.,f4T'.includes(ch)) continue;
        const sx = wx - camX + Math.sin(TIME * 0.5 + i * 1.9) * 30, sy = wy - camY + Math.sin(TIME * 0.37 + i * 2.7) * 20;
        const a = (0.5 + Math.sin(TIME * 2.1 + i * 1.7) * 0.5) * n; if (a < 0.08) continue;
        this.dnFlies.push([sx, sy, a]);
        ctx.globalAlpha = a; ctx.fillStyle = '#eaffa0'; ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    // moths around lamp posts
    if (n > 0.3) for (let ty = y0; ty <= y0 + 15; ty++) for (let tx = x0; tx <= x0 + 20; tx++) {
      if (w.tile(tx, ty) !== '@') continue;
      const cx = tx * TS - camX + 16, cy = ty * TS - camY - 2;
      for (let i = 0; i < 3; i++) {
        const a = TIME * (2.6 + i * 0.7) + i * 2.1 + tx;
        const mx = cx + Math.cos(a) * (7 + i * 3), my = cy + Math.sin(a * 1.3) * (5 + i * 2);
        ctx.fillStyle = 'rgba(240,230,210,.85)'; ctx.fillRect(Math.round(mx), Math.round(my), Math.floor(TIME * 18 + i) % 2 ? 2 : 1, 1);
      }
    }
    // bats at dusk
    if (du > 0.35 && !wet) {
      for (let i = 0; i < 4; i++) {
        const per = 7 + i * 1.3, ph = ((TIME + i * 3.3) % per) / per;
        const sx = -30 + ph * (W + 60), sy = 40 + i * 37 + Math.sin(ph * 25 + i) * 14;
        const flap = Math.floor(TIME * 14 + i) % 2;
        ctx.fillStyle = 'rgba(20,14,26,.9)';
        ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
        ctx.fillRect(Math.round(sx) - 3, Math.round(sy) - (flap ? 1 : -1), 3, 1); ctx.fillRect(Math.round(sx) + 2, Math.round(sy) - (flap ? 1 : -1), 3, 1);
      }
    }
  };
  const post0 = Detail.post;
  Detail.post = function (w, camX, camY) {
    // window sunbeams indoors fade out at night (post0 draws them) — dim them by drawing them at a lower alpha
    const m = w && w.map, nightIn = m && m.interior && DN.applies(m) ? DN.night() : 0;
    if (nightIn > 0.02) { ctx.save(); ctx.globalAlpha = 1 - nightIn * 0.9; post0.call(this, w, camX, camY); ctx.restore(); }
    else post0.call(this, w, camX, camY);
    if (!w || !DN.outdoorsLive(w) || !this.on(w)) return;
    const n = DN.night(); if (n < 0.05) return;
    const h = DN.hour(), late = h >= 22.5 || h < 5, x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    for (let ty = y0; ty <= y0 + Math.ceil(H / TS); ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / TS); tx++) {
      const ch = w.tile(tx, ty), sx = tx * TS - camX, sy = ty * TS - camY, hh = hash2(tx * 3, ty * 5);
      // lit window glass
      if (ch === 'W' && !(late && hh % 3 !== 0)) {
        ctx.globalAlpha = 0.85 * n; ctx.fillStyle = '#ffe2a0'; ctx.fillRect(sx + 10, sy + 10, 12, 10);
        ctx.fillStyle = '#fff4d0'; ctx.fillRect(sx + 10, sy + 10, 5, 4);
        ctx.fillStyle = '#7a5030'; ctx.fillRect(sx + 15, sy + 10, 2, 10); ctx.fillRect(sx + 10, sy + 14, 12, 2);
        // a silhouette now and then
        if (hh % 7 === 0) { const sh = Math.sin(TIME * 0.3 + hh) > 0.3; if (sh) { ctx.fillStyle = 'rgba(60,30,20,.55)'; ctx.fillRect(sx + 17, sy + 13, 4, 7); ctx.fillRect(sx + 18, sy + 11, 2, 2); } }
        ctx.globalAlpha = 1;
        glow(sx + 16, sy + 15, 20, 'rgba(255,200,120,.35)', n);
      }
      // stars shivering on still water
      if (ch === '~' && w.tileMask(tx, ty, '~') === 0) {
        for (let k = 0; k < 2; k++) {
          const tw = 0.5 + Math.sin(TIME * (1.5 + k) + hh + k * 3) * 0.5;
          if (tw < 0.35) continue;
          ctx.globalAlpha = tw * n * 0.8; ctx.fillStyle = '#e8f0ff';
          ctx.fillRect(sx + 4 + ((hh >> (k * 5)) % 24), sy + 4 + ((hh >> (k * 4 + 8)) % 24), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    }
    for (const [x, y, a] of this.dnFlies || []) glow(x + 1, y + 1, 10, 'rgba(220,255,150,.55)', a);
  };
  // fireflies light their surroundings a little
  const l2 = Detail.lights;
  Detail.lights = function (w, camX, camY) { l2.call(this, w, camX, camY); for (const [x, y, a] of this.dnFlies || []) FX.addLight(x, y, 24, 'rgba(210,255,140,1)', 0.45 * a); };

  // ------------------------------------------------------------ the HUD: a small sky dial
  const draw0 = P.draw;
  P.draw = function () {
    draw0.call(this);
    if (!DN.applies(this.map) || this.map.interior || !(G.settings ? G.settings.clockHud !== false : true)) return;
    if (Scenes.top() !== this) return;
    const h = DN.hour(), x = 14, y = typeof Perf !== 'undefined' && Perf.showFps ? 40 : 14, r = 11;
    ctx.save(); ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(14,12,26,.72)'; ctx.beginPath(); ctx.arc(x + r, y + r, r + 3, 0, 7); ctx.fill();
    // sky colour behind the dial
    const d = DN.day(h), sky = mixCol(mixCol('#1c2450', '#7ab8f0', d), '#ff9a60', DN.dusk(h) * 0.6 + DN.dawn(h) * 0.4);
    ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(x + r, y + r, r, 0, 7); ctx.fill();
    // sun or moon travelling across it
    const a = Math.PI + ((h % 24) / 24) * Math.PI * 2 - Math.PI / 2;
    const bx = x + r + Math.cos(a) * (r - 4), by = y + r + Math.sin(a) * (r - 4);
    if (d > 0.3) { ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(bx, by, 3.2, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = '#eef2ff'; ctx.beginPath(); ctx.arc(bx, by, 3, 0, 7); ctx.fill(); ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(bx + 1.5, by - 1, 2.4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + r, y + r, r, 0, 7); ctx.stroke();
    text(DN.clockText(h), x + r * 2 + 8, y + 4, UI.paper, 12);
    ctx.restore();
  };

  // ------------------------------------------------------------ music: night arrangements
  const NIGHT_TRACKS = new Set(['field', 'town', 'village', 'manor', 'capital', 'overworld', 'coast', 'moor', 'fen', 'snow', 'highland', 'lake', 'forest', 'travel']);
  const play0 = Sound.play.bind(Sound);
  Sound.play = function (name) {
    this._base = name;
    let real = name;
    const w = typeof World !== 'undefined' ? World : null;
    if (typeof name === 'string' && DN.isNight() && w && DN.outdoorsLive(w) && Scenes.stack.includes(w)) {
      const piece = this.resolve(name);
      const key = Object.keys(SCORE).find(k => SCORE[k] === piece);
      if (key && NIGHT_TRACKS.has(key)) real = key + '@night';
    }
    return play0(real);
  };
  const res0 = Sound.resolve.bind(Sound);
  Sound.resolve = function (name) {
    if (typeof name === 'string' && name.endsWith('@night')) {
      const base = res0(name.slice(0, -6));
      return base._night || (base._night = nightVersion(base));
    }
    return res0(name);
  };
  const SWAP = { brass: 'horn', strings: 'strings', stac: 'pizz', pluck: 'harp', fiddle: 'flute', accordion: 'strings', marimba: 'musicbox', glock: 'musicbox', chip: 'flute' };
  function nightVersion(P) {
    const accN = a => {
      if (!a) return a;
      const o = Object.assign({}, a);
      delete o.perc; delete o.timp; delete o.crashEvery;
      if (o.arp) { o.arp = SWAP[o.arp] || o.arp; if (o.arpPat === '16' || o.arpPat === 'ost16' || o.arpPat === 'gallop' || o.arpPat === 'strum') o.arpPat = 'updown8'; o.arpV = (o.arpV || 0.06) * 0.75; }
      if (o.pad) { const pads = Array.isArray(o.pad) ? o.pad : [o.pad]; o.pad = pads.map(p => SWAP[p] || p); o.padV = Array.isArray(o.padV) ? o.padV.map(v => v * 0.8) : (o.padV || 0.05) * 0.8; }
      if (o.bass) { o.bassPat = 'whole'; o.bassV = (o.bassV || 0.12) * 0.7; }
      return o;
    };
    const N = { ...P, _n: null, _night: null, bpm: Math.round(P.bpm * 0.84), gain: (P.gain || 1) * 0.85, acc: accN(P.acc) };
    N.secs = P.secs.map((S, si) => ({
      ...S, crash: false, acc: S.acc ? accN(Object.assign({}, S.acc)) : S.acc,
      m: (S.m || []).map((L, li) => ({ ...L, i: SWAP[L.i] || (li === 0 && L.i === 'strings' ? 'flute' : L.i), alsoI: L.alsoI ? (SWAP[L.alsoI] || L.alsoI) : L.alsoI, v: L.v * 0.82, leg: Math.max(L.leg || 0.96, 0.98) }))
        .concat(si % 2 ? [{ i: 'musicbox', v: 0.025, oct: 12, n: (S.m && S.m[0] ? S.m[0].n : '.') }] : [])
    }));
    // each night section also gets a soft choir bed
    N.acc = Object.assign({}, N.acc, { pad: [].concat(N.acc && N.acc.pad ? N.acc.pad : []).concat(N.acc && N.acc.pad && [].concat(N.acc.pad).includes('choir') ? [] : ['choir']), padV: [].concat(N.acc && N.acc.padV != null ? N.acc.padV : []).concat([0.022]) });
    if (N.acc.pad.length !== N.acc.padV.length) N.acc.padV = N.acc.pad.map((_, i) => N.acc.padV[i] != null ? N.acc.padV[i] : 0.03);
    return N;
  }
  DN.nightVersion = nightVersion;

  // ------------------------------------------------------------ sleep resets the clock
  const wrapInn = () => {
    if (typeof innScene !== 'function' || innScene._dn) return;
    const i0 = innScene;
    innScene = async function (...a) {
      const before = G.gold, r = await i0.apply(this, a);
      // only if they actually stayed (paid, or it was free)
      if (G.gold < before || a[2]) G.clock = 7 * 60;
      return r;
    };
    innScene._dn = true;
  };
  wrapInn();
  if (typeof LATE !== 'undefined') LATE.push(wrapInn);
})();
