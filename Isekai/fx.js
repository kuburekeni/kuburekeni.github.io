// =====================================================================
//  fx.js : the lighting layer — coloured light passes, bloom, god rays,
//          lens flare, weather, and rain that lands on the screen itself
// =====================================================================

const FX = {
  light: null, lx: null,      // light buffer (multiplied over the scene)
  small: null, sx: null,      // half-size buffer for bloom
  tiny: null, tx: null,       // quarter-size buffer for bloom
  w: 0, h: 0,

  resize() { this.light = this.small = this.tiny = null; },
  ensure() {
    if (this.light && this.w === W && this.h === H) return;
    this.w = W; this.h = H;
    // light is soft, so its buffer is a quarter the size and smoothed back up: same look, 1/16 the pixels
    this.ls = 0.25;
    [this.light, this.lx] = mkCanvas(Math.ceil(W * this.ls), Math.ceil(H * this.ls));
    this.lx.setTransform(this.ls, 0, 0, this.ls, 0, 0);
    this.lx.imageSmoothingEnabled = true;
    [this.small, this.sx] = mkCanvas(Math.ceil(W / 2), Math.ceil(H / 2));
    [this.tiny, this.tx] = mkCanvas(Math.ceil(W / 8), Math.ceil(H / 8));
    this.sx.imageSmoothingEnabled = true;
    this.tx.imageSmoothingEnabled = true;
  },

  // ---------------------------------------------------------------- lights
  // ambient is the colour the whole scene is multiplied by; lights punch it back up.
  beginLights(ambient) {
    this.ensure();
    const x = this.lx;
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    x.fillStyle = ambient;
    x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
  },
  addLight(cx, cy, r, col, a = 1) {
    if (cx < -r || cy < -r || cx > W + r || cy > H + r) return;
    const x = this.lx;
    // a light is a cached soft sprite, stretched: far cheaper than a new gradient every call
    const spr = lightSprite(col, 1);
    x.globalAlpha = a; x.drawImage(spr, cx - r, cy - r, r * 2, r * 2);
    x.globalAlpha = 1;
  },
  endLights() {
    // the world's edge-darkening rides along in the light buffer (multiplying twice = one pass fewer over the screen)
    this.vigDone = false;
    if (this.vig) {
      const x = this.lx; x.globalCompositeOperation = 'multiply'; x.globalAlpha = 1;
      x.drawImage(vignetteSprite(W, H), 0, 0, W, H);
      x.globalCompositeOperation = 'source-over'; this.vigDone = true;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.light, 0, 0, W, H);
    ctx.restore();
  },

  // ---------------------------------------------------------------- bloom
  // downsample twice, smear, then add back: bright pixels glow like film.
  bloom(amount = 0.34, cut = 0.62) {
    if (!Gfx.bloom || amount <= 0) return;
    this.ensure();
    const sw = this.small.width, sh = this.small.height, tw = this.tiny.width, th = this.tiny.height;
    this.sx.globalCompositeOperation = 'source-over';
    this.sx.clearRect(0, 0, sw, sh);
    this.sx.drawImage(canvas, 0, 0, sw, sh);
    // keep only the bright parts
    this.sx.globalCompositeOperation = 'multiply';
    this.sx.fillStyle = `rgba(255,255,255,1)`;
    this.sx.globalAlpha = 1;
    this.sx.drawImage(this.small, 0, 0);           // square the image: darks fall away fast
    this.sx.globalCompositeOperation = 'source-over';
    this.tx.clearRect(0, 0, tw, th);
    this.tx.drawImage(this.small, 0, 0, tw, th);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = amount;
    ctx.drawImage(this.tiny, 0, 0, W, H);
    ctx.globalAlpha = amount * 0.55;
    ctx.drawImage(this.small, 0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    ctx.restore();
  },

  // ---------------------------------------------------------------- sun, god rays, lens flare
  // shafts of light falling across the scene from the sun
  godRays(sx, sy, col = 'rgba(255,238,190,.09)', n = 7) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const o = i * 74 + Math.sin(TIME * 0.12 + i) * 16;
      ctx.beginPath();
      ctx.moveTo(sx + o - 26, sy); ctx.lineTo(sx + o + 18, sy);
      ctx.lineTo(sx + o - 230, H + 40); ctx.lineTo(sx + o - 300, H + 40);
      ctx.fill();
    }
    ctx.restore();
  },
  lensFlare(sx, sy, strength = 1, col = [255, 236, 180]) {
    if (!Gfx.flare || strength <= 0.01) return;
    const [r, g, b] = col;
    const dx = W / 2 - sx, dy = H / 2 - sy;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // core + halo
    glow(sx, sy, 90 * strength, `rgba(${r},${g},${b},${0.5 * strength})`);
    glow(sx, sy, 26 * strength, `rgba(255,255,255,${0.75 * strength})`);
    // anamorphic streak
    const gr = ctx.createLinearGradient(sx - 260 * strength, sy, sx + 260 * strength, sy);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(${r},${g},${b},${0.3 * strength})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(sx - 260 * strength, sy - 2, 520 * strength, 4);
    // ghosts along the line through the centre of the screen
    const ghosts = [[0.32, 16, .18], [0.55, 9, .14], [0.78, 26, .12], [1.15, 13, .15], [1.5, 34, .08], [1.85, 8, .12]];
    for (const [t, rad, a] of ghosts) {
      const gx = sx + dx * 2 * t, gy = sy + dy * 2 * t;
      const tint = t > 1 ? `rgba(${Math.round(r * 0.5)},${Math.round(g * 0.8)},255,${a * strength})` : `rgba(${r},${Math.round(g * 0.85)},${Math.round(b * 0.6)},${a * strength})`;
      ctx.fillStyle = tint;
      ctx.beginPath(); ctx.arc(gx, gy, rad * strength, 0, 7); ctx.fill();
      ctx.strokeStyle = tint; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(gx, gy, rad * 1.5 * strength, 0, 7); ctx.stroke();
    }
    ctx.restore();
  },
  // a quick starburst, used for hits, magic and the rift
  sparkle(x, y, r, col, spikes = 4) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(x, y, r, col);
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    for (let i = 0; i < spikes; i++) {
      const a = i / spikes * Math.PI * 2 + TIME * 0.4;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r * 0.6); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6); ctx.stroke();
    }
    ctx.restore();
  }
};

// =====================================================================
//  weather
// =====================================================================
// outdoor themes get weather; interiors and caves do not
const WEATHER_BY_THEME = {
  grass: [['clear', 6], ['rain', 3], ['fog', 1], ['storm', 1]],
  forestv: [['clear', 5], ['rain', 3], ['fog', 2], ['storm', 1]],
  town: [['clear', 5], ['rain', 2], ['snow', 2], ['fog', 1]],
  city: [['clear', 6], ['rain', 3], ['fog', 1]],
  tokyo: [['clear', 7], ['rain', 3]],
  night: [['clear', 5], ['rain', 3], ['fog', 2]],
  ash: [['ashfall', 8], ['storm', 2]],
  castle: [['ashfall', 6], ['storm', 3]]
};

const Weather = {
  kind: 'clear', target: 'clear', power: 0, drops: [], splats: [], screen: [],
  flash: 0, boltT: 8, wind: -0.35, t: 0, indoors: false,

  // weather rolls over as you play, and is remembered in the save
  forMap(mapId) {
    const m = MAPS[mapId];
    const table = m && !m.interior ? WEATHER_BY_THEME[m.theme] : null;
    this.indoors = !!(m && (m.interior || m.dark));
    if (!table) { this.set(this.indoors ? 'clear' : 'clear', 0); return; }
    if (!G.weather || G.playTime > (G.weather.until || 0) || !table.some(([k]) => k === G.weather.kind)) {
      G.weather = { kind: weighted(table), until: G.playTime + rand(150, 420) };
    }
    this.set(G.weather.kind, 1);
  },
  set(kind, power = 1) {
    if (!Gfx.weather) { this.kind = 'clear'; this.power = 0; this.drops.length = 0; this.screen.length = 0; return; }
    if (kind !== this.kind) { this.drops.length = 0; this.splats.length = 0; }
    this.kind = kind; this.power = power;
    this.wind = kind === 'storm' ? -0.62 : kind === 'rain' ? -0.34 : kind === 'snow' ? -0.2 : -0.1;
    this.boltT = rand(3, 9);
  },
  raining() { return Gfx.weather && !this.indoors && (this.kind === 'rain' || this.kind === 'storm'); },
  targetCount() {
    if (this.indoors || !Gfx.weather) return 0;
    return { rain: 150, storm: 260, snow: 110, fog: 0, ashfall: 60, clear: 0 }[this.kind] || 0;
  },
  update(dt) {
    this.t += dt;
    const want = this.targetCount();
    while (this.drops.length < want) this.drops.push(this.spawn(true));
    while (this.drops.length > want) this.drops.pop();
    const snow = this.kind === 'snow', ash = this.kind === 'ashfall';
    const fall = snow ? 60 : ash ? 34 : this.kind === 'storm' ? 1150 : 780;
    for (const d of this.drops) {
      d.y += fall * d.s * dt;
      d.x += this.wind * fall * d.s * dt * (snow || ash ? 1.6 : 1) + (snow || ash ? Math.sin(this.t * 1.4 + d.seed) * 14 * dt : 0);
      if (d.y > H) {
        if (this.raining() && Math.random() < 0.5) this.splats.push({ x: d.x, y: H - rand(0, 140), t: 0 });
        Object.assign(d, this.spawn());
      }
      if (d.x < -40) d.x = W + 20;
    }
    { let j = 0; for (const s of this.splats) { s.t += dt; if (s.t < 0.3) this.splats[j++] = s; } this.splats.length = j; }
    // drops on the lens
    if (this.raining() && Gfx.drops) {
      const rate = this.kind === 'storm' ? 4.5 : 2.2;
      if (this.screen.length < 16 && Math.random() < rate * dt) this.screen.push({ x: rand(10, W - 10), y: rand(10, H - 120), r: rand(4, 12), t: 0, life: rand(2.2, 4.5), v: rand(5, 22) });
    }
    for (const s of this.screen) { s.t += dt; if (s.t > s.life * 0.35) s.y += s.v * dt * (s.r / 5); }
    { let j = 0; for (const s of this.screen) if (s.t < s.life) this.screen[j++] = s; this.screen.length = j; }
    // lightning
    if (this.flash > 0) this.flash -= dt * 2.4;
    if (this.kind === 'storm' && !this.indoors) {
      this.boltT -= dt;
      if (this.boltT <= 0) {
        this.boltT = rand(5, 14); this.flash = 1;
        this.bolt = { x: rand(60, W - 60), t: 0, seed: Math.random() * 99 };
        Sound.sfx('crash');
      }
    }
    if (this.bolt) { this.bolt.t += dt; if (this.bolt.t > 0.34) this.bolt = null; }
  },
  spawn(anywhere) {
    return { x: rand(-60, W + 60), y: anywhere ? rand(-H, H) : rand(-120, -10), s: rand(0.6, 1.25), seed: Math.random() * 9, len: rand(9, 22) };
  },

  // every rain streak length and every splash frame, drawn once into one sheet per weather kind
  // (one sheet = one texture, so the graphics chip draws all the drops in a single batch)
  rainSheet(k) {
    const C = this._sheets || (this._sheets = {});
    if (C[k]) return C[k];
    const wind = k === 'storm' ? -0.62 : -0.34, lw = k === 'storm' ? 2 : 1.4, pad = 2;
    const cells = {}; let x = 0, hMax = 0;
    for (let len = 8; len <= 23; len++) {
      const dx = wind * len, dy = len * 1.6;
      const w = Math.ceil(Math.abs(dx)) + pad * 2 + 2, h = Math.ceil(dy) + pad * 2 + 2;
      cells[len] = { x, y: 0, w, h, ox: pad + Math.abs(dx) + 1, oy: pad + 1, dx, dy };
      x += w + 1; hMax = Math.max(hMax, h);
    }
    const splash = []; for (let i = 0; i < 8; i++) splash.push({ x: i * 23, y: hMax + 1, w: 22, h: 10 });
    const c = document.createElement('canvas'); c.width = Math.max(x, 8 * 23); c.height = hMax + 12;
    const g = c.getContext('2d');
    g.strokeStyle = k === 'storm' ? 'rgba(206,222,255,.75)' : 'rgba(196,214,245,.6)'; g.lineWidth = lw;
    for (const len in cells) { const e = cells[len]; g.beginPath(); g.moveTo(e.x + e.ox, e.oy); g.lineTo(e.x + e.ox + e.dx, e.oy + e.dy); g.stroke(); }
    g.strokeStyle = 'rgba(210,230,255,.5)'; g.lineWidth = 1;
    splash.forEach((f, i) => {
      const p = (i + 0.5) / 8;
      g.globalAlpha = 1 - p; g.beginPath(); g.ellipse(f.x + 11, f.y + 5, 2 + p * 7, 1 + p * 2.5, 0, 0, 7); g.stroke();
    });
    return (C[k] = { c, cells, splash });
  },
  // the highlight and rim of a drop on the lens, drawn once per size (it used a blur before: slow on a Pi)
  bead(r) {
    const C = this._beads || (this._beads = {});
    if (C[r]) return C[r];
    const pad = 5, sz = r * 2 + pad * 2, c = document.createElement('canvas'); c.width = c.height = sz;
    const x = c.getContext('2d'), m = sz / 2;
    x.strokeStyle = 'rgba(232,244,255,.8)'; x.lineWidth = 1.5;
    x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 3;
    x.beginPath(); x.arc(m, m, r, 0, 7); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.75)';
    x.beginPath(); x.arc(m - r * 0.32, m - r * 0.36, Math.max(0.8, r * 0.24), 0, 7); x.fill();
    x.shadowBlur = 0;
    x.fillStyle = 'rgba(150,180,225,.4)';
    x.beginPath(); x.arc(m + r * 0.28, m + r * 0.34, r * 0.32, 0, 7); x.fill();
    return (C[r] = c);
  },

  // drawn over the world, under the interface
  drawWorld() {
    if (!Gfx.weather || this.indoors) return;
    const k = this.kind;
    if (k === 'fog') {
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const y = 60 + i * 90, off = (this.t * (8 + i * 4)) % (W + 400) - 200;
        ctx.globalAlpha = 0.10 + i * 0.012;
        ctx.fillStyle = '#cfd8e8';
        ctx.beginPath(); ctx.ellipse(off, y, 260, 44, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(off + 330, y + 30, 210, 36, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
      return;
    }
    if (!this.drops.length) return;
    ctx.save();
    if (k === 'snow' || k === 'ashfall') {
      ctx.fillStyle = k === 'snow' ? '#eef4ff' : '#c8bcb4';
      for (const d of this.drops) { ctx.globalAlpha = k === 'snow' ? 0.85 * d.s : 0.5 * d.s; ctx.fillRect(d.x, d.y, 2, 2); }
    } else {
      // each streak and splash is a small pre-drawn sprite: hundreds of cheap image copies
      // instead of one huge path the browser has to re-shape every frame
      const S = this.rainSheet(k), img = S.c;
      for (const d of this.drops) {
        const e = S.cells[Math.max(8, Math.min(23, Math.round(d.len)))];
        ctx.drawImage(img, e.x, e.y, e.w, e.h, Math.round(d.x - e.ox), Math.round(d.y - e.oy), e.w, e.h);
      }
      for (const s of this.splats) {
        const f = S.splash[Math.min(7, Math.floor(s.t / 0.3 * 8))];
        ctx.drawImage(img, f.x, f.y, f.w, f.h, Math.round(s.x - 11), Math.round(s.y - 5), f.w, f.h);
      }
    }
    ctx.restore();
  },

  // the lens: drops sitting on the "camera", plus the lightning flash
  drawScreen() {
    if (!Gfx.weather) return;
    if (this.bolt) {
      const b = this.bolt;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(220,235,255,.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x, -10);
      let x = b.x, y = -10;
      for (let i = 0; i < 8; i++) { x += Math.sin(b.seed + i * 2.3) * 26; y += 30 + i * 4; ctx.lineTo(x, y); }
      ctx.stroke();
      glow(b.x, 60, 200, 'rgba(180,210,255,.35)');
      ctx.restore();
    }
    if (this.flash > 0) {
      const a = Math.min(0.5, this.flash * this.flash * 0.5);
      ctx.fillStyle = `rgba(214,232,255,${a})`; ctx.fillRect(0, 0, W, H);
    }
    if (!Gfx.drops) return;
    if (!this.screen.length) return;
    // what's behind the drops: one copy of the screen per frame, not one per drop
    // (copying the canvas onto itself forced a full-screen copy for every bead)
    const snap = this._snap || (this._snap = document.createElement('canvas'));
    if (snap.width !== W || snap.height !== H) { snap.width = W; snap.height = H; }
    const sx2 = snap.getContext('2d');
    sx2.drawImage(canvas, 0, 0);
    for (const s of this.screen) {
      const fade = Math.min(1, s.t * 4) * Math.min(1, (s.life - s.t) * 2);
      const r = s.r, ri = Math.round(r);
      ctx.save();
      ctx.globalAlpha = 0.72 * fade;
      // the drop bends what is behind it: squash the screen behind it inside the bead
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7); ctx.clip();
      ctx.drawImage(snap, s.x - r * 1.6, s.y - r * 1.6, r * 3.2, r * 3.2, s.x - r, s.y - r, r * 2, r * 2);
      ctx.restore();
      ctx.globalAlpha = fade;
      const b = this.bead(ri);
      ctx.drawImage(b, s.x - b.width / 2, s.y - b.height / 2);
      // the trail it leaves as it runs down the glass
      if (s.t > s.life * 0.35) {
        ctx.globalAlpha = 0.18 * fade;
        ctx.fillStyle = 'rgba(220,236,255,1)';
        const tl = Math.min(40, (s.t - s.life * 0.35) * s.v * 1.2);
        ctx.fillRect(s.x - r * 0.28, s.y - tl, r * 0.56, tl);
      }
      ctx.globalAlpha = 1;
    }
  },
  // how much the weather darkens the world
  tint() {
    if (!Gfx.weather || this.indoors) return null;
    if (this.kind === 'storm') return '#3e4864';
    if (this.kind === 'rain') return '#6a7c9a';
    if (this.kind === 'fog') return '#9aa4b4';
    if (this.kind === 'snow') return '#aebad0';
    return null;
  },
  label() {
    return { clear: '', rain: 'Rain', storm: 'Thunderstorm', snow: 'Snow', fog: 'Mist', ashfall: 'Ashfall' }[this.kind] || '';
  }
};

// the edge-darkening as a picture: white in the middle, 42% darker at the corners
let VIG = null;
function vignetteSprite(w, h) {
  const k = w + 'x' + h; if (VIG && VIG.k === k) return VIG.c;
  const c = document.createElement('canvas'); c.width = Math.ceil(w / 4); c.height = Math.ceil(h / 4); const x = c.getContext('2d');
  x.scale(0.25, 0.25);
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
  const g = x.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, h * 0.92);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.42)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  VIG = { k, c }; return c;
}
// soft round light sprites, one per colour
const LIGHT_SPR = new Map();
function lightSprite(col, kind) {
  const k = col + '|' + kind; let c = LIGHT_SPR.get(k); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (kind === 1) { g.addColorStop(0, col); g.addColorStop(0.55, col.replace(/[\d.]+\)$/, '0.35)')); g.addColorStop(1, 'rgba(0,0,0,0)'); }
  else { g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); }
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  if (LIGHT_SPR.size > 300) LIGHT_SPR.clear();
  LIGHT_SPR.set(k, c); return c;
}
