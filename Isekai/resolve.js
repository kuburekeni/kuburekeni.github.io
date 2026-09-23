// =====================================================================
//  resolve.js : Resolve techniques get their own animated cutscenes.
//  Every one opens on a cut-in (you and your partner slam onto the
//  screen with the technique's name), plays its own set-piece, and ends
//  on a white-out impact. Your part changes with your path: a Blade
//  swings, a Spellcaster casts, a Master of None does both.
// =====================================================================

const RES_COL = {
  solo: ['#f2c94c', '#ffffff', '#1a1030'], wren: ['#6fb7f2', '#f2c94c', '#10182e'], lyra: ['#bfe6ff', '#c88aff', '#0a0a24'],
  garrick: ['#f2a03a', '#ffe070', '#1e140e'], sable: ['#e5534b', '#ffffff', '#120608'], oswin: ['#fff3c0', '#f2c94c', '#2a200e'],
  kestrel: ['#7ed36f', '#fff4d0', '#0e1a10'], varek: ['#ff5a2a', '#1a0a10', '#0a0408']
};
const RES_LINES = {
  solo: { blade: 'The moment you died, given an edge.', mage: 'The light you saw before the dark.', none: 'Blade and light, from the moment between worlds.' },
  wren: 'Two blades. One promise.', lyra: 'Your power, poured through her spell.', garrick: 'Up you go, old man.', sable: 'Blink and you missed it.',
  oswin: 'Let the light hold them.', kestrel: 'Mark. Loose. Again.', varek: 'Back to back, into the ash.'
};

class ResolveCut {
  constructor(battle, kind, partner, sk) {
    this.b = battle; this.kind = kind; this.partner = partner; this.sk = sk;
    this.t = 0; this.dur = 3.4; this.fired = new Set();
    this.cls = G.heroClass || 'none';
    this.col = RES_COL[kind] || RES_COL.solo;
    this.foes = battle.aliveEnemies().slice(0, 5);
    this.parts = [];
    this.promise = new Promise(r => this.resolve = r);
    Sound.stop(); Sound.sfx('resolve');
  }
  cue(at, fn) { if (this.t >= at && !this.fired.has(at)) { this.fired.add(at); fn(); } }
  update(dt) {
    this.t += dt;
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; }
    this.parts = this.parts.filter(p => p.t < p.life);
    this.cues();
    if (this.t > 0.6 && Input.pressed('ok') && this.t < this.dur - 0.5) this.t = this.dur - 0.5;   // skip to the impact
    if (this.t >= this.dur) { Scenes.remove(this); this.resolve(); }
  }
  // --------------------------------------------------------------- helpers
  spr(key, x, y, size, dir = 'right', pose = '', alpha = 1) {
    let img; try { img = charSprite(key, dir, 0, pose); } catch (e) { return null; }
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x - size / 2), Math.round(y - size), Math.round(size), Math.round(size));
    ctx.restore();
    return { img, x: x - size / 2, y: y - size, s: size / 32 };
  }
  heroWeapon(h, ang, glow) {
    if (!h || !h.img.hand) return;
    const m = G.party[0], wid = m.equip.weapon, it = ITEMS[wid] || {};
    const hx = h.x + h.img.hand[0] * h.s, hy = h.y + h.img.hand[1] * h.s;
    if (glow) glow2(hx, hy, 60, glow);
    drawWeapon(it.kind || 'sword', hx, hy, ang, h.s * 0.95, false, wid);
    if (this.cls !== 'blade') {   // spellcasters (and the Master of None) carry a turning rune-circle in the free hand
      ctx.save(); ctx.translate(hx, hy - 6); ctx.rotate(TIME * 3); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(191,230,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = i * 1.2566; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.lineTo(Math.cos(a + 2.513) * 18, Math.sin(a + 2.513) * 18); ctx.stroke(); }
      ctx.restore(); glow2(hx, hy - 6, 30, 'rgba(191,230,255,.5)');
    }
  }
  heroPose(u) { return this.cls === 'mage' ? 'cast' : this.cls === 'none' ? (u > 0.5 ? 'cast' : 'attack') : (u > 0.35 ? 'attack' : 'windup'); }
  foeAt(i) { const n = this.foes.length, cx = W * 0.72, sp = n > 3 ? 70 : 90; return [cx + (i - (n - 1) / 2) * sp * 0.7, 330 + ((i % 2) ? 26 : -10)]; }
  drawFoes(hit, shake = 0) {
    this.foes.forEach((e, i) => {
      const [x, y] = this.foeAt(i), size = Math.min(180, e.size * 1.3);
      const mon = e.sprKey.startsWith('m:');
      const img = mon ? monsterSprite(e.sprKey.slice(2), true, 48) : charSprite(e.sprKey, 'left', 0, hit ? 'hurt' : '');
      const jx = hit ? Math.sin(TIME * 90 + i) * shake : 0;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, Math.round(x - size / 2 + jx), Math.round(y - size), Math.round(size), Math.round(size));
      if (hit) { ctx.save(); ctx.globalAlpha = 0.5 * Math.abs(Math.sin(TIME * 40)); ctx.drawImage(whiteSilhouette(img), Math.round(x - size / 2 + jx), Math.round(y - size), Math.round(size), Math.round(size)); ctx.restore(); }
    });
  }
  burst(x, y, n, col, speed = 260, life = 0.7, g = 0) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = speed * (0.3 + Math.random()); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: life * (0.5 + Math.random() * 0.8), col, r: 2 + Math.random() * 3, g }); }
  }
  drawParts() {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.parts) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  speedLines(dir, col, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 2;
    for (let i = 0; i < 36; i++) {
      const y = (hash2(i, 3) % H), len = 80 + hash2(i, 5) % 200, x = ((hash2(i, 7) % (W + 400)) + TIME * 2400 * dir) % (W + 400) - 200;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * dir, y); ctx.stroke();
    }
    ctx.restore();
  }
  shake(v) { ctx.translate((Math.random() - 0.5) * v, (Math.random() - 0.5) * v); }
  // --------------------------------------------------------------- the cut-in (0 → 1.0s)
  drawCutIn() {
    const t = this.t, [c1, c2, bg] = this.col;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    this.speedLines(1, c1, 0.35);
    // two slanted panels
    const slide = easeOut(clamp(t / 0.35, 0, 1)), slide2 = easeOut(clamp((t - 0.12) / 0.35, 0, 1));
    const panel = (y0, h, off, col, key, dir, pose, flip) => {
      ctx.save();
      ctx.beginPath(); ctx.moveTo(-W + off * W, y0); ctx.lineTo(off * W + 60, y0); ctx.lineTo(off * W, y0 + h); ctx.lineTo(-W + off * W - 60, y0 + h); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.clip();
      ctx.globalAlpha = 0.25; for (let i = 0; i < 10; i++) { ctx.fillStyle = '#ffffff'; ctx.fillRect(((i * 97 + TIME * 900 * (flip ? -1 : 1)) % (W + 100)) - 50, y0 + (i * 23) % h, 60, 2); } ctx.globalAlpha = 1;
      const size = 230, cx = flip ? W - off * W * 0.55 : off * W * 0.55;
      this.spr(key, cx, y0 + h + 30, size, dir, pose);
      ctx.restore();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-W + off * W, y0); ctx.lineTo(off * W + 60, y0); ctx.stroke();
    };
    const solo = this.kind === 'solo';
    ctx.save(); ctx.translate(0, 0);
    panel(solo ? 90 : 40, solo ? 260 : 190, slide, shade(c1, -0.35), 'hero', 'right', this.cls === 'mage' ? 'cast' : 'ready', false);
    if (!solo && this.partner) {
      ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1);
      panel(250, 190, slide2, shade(c2, -0.45), 'c:' + this.kind, 'right', 'ready', false);
      ctx.restore();
    }
    ctx.restore();
    // the name
    const nt = clamp((t - 0.3) / 0.25, 0, 1);
    if (nt > 0) {
      const nm = this.sk.name.toUpperCase(), sz = 44, y = solo ? 380 : 212;
      ctx.save(); ctx.globalAlpha = nt;
      const x = W / 2 + (1 - easeOut(nt)) * 300;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, y - 8, W, sz + 36);
      text('RESOLVE' + (solo ? '' : `  ·  ${G.name} & ${this.partner.name}`), x, y - 2, c2 === '#1a0a10' ? '#ff9a7a' : c2, 13, 'center');
      for (let d = 4; d >= 1; d--) text(nm, x + d, y + 14 + d, '#1a0822', sz, 'center');
      text(nm, x, y + 14, '#ffffff', sz, 'center');
      const line = solo ? RES_LINES.solo[this.cls] : RES_LINES[this.kind];
      if (line) text(line, x, y + 64, 'rgba(255,255,255,.75)', 13, 'center', false);
      ctx.restore();
    }
    if (t < 0.12) { ctx.fillStyle = `rgba(255,255,255,${1 - t / 0.12})`; ctx.fillRect(0, 0, W, H); }
  }
  // --------------------------------------------------------------- the impact (last 0.55s)
  drawImpact() {
    const u = (this.t - (this.dur - 0.55)) / 0.55;
    if (u < 0) return;
    ctx.fillStyle = `rgba(255,255,255,${u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7 * 0.6})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = Math.min(1, u * 3);
    text(this.sk.name.toUpperCase(), W / 2, H / 2 - 20, shade(this.col[0], -0.5), 30, 'center');
    ctx.restore();
  }
  // --------------------------------------------------------------- sounds and particles on a timeline
  cues() {
    const k = this.kind, T = 1.0;
    this.cue(0.02, () => Sound.sfx('limit'));
    this.cue(0.35, () => Sound.sfx('slash'));
    this.cue(this.dur - 0.55, () => { Sound.sfx('crash'); });
    const hitAll = (n, col) => this.foes.forEach((e, i) => { const [x, y] = this.foeAt(i); this.burst(x, y - 50, n, col); });
    if (k === 'solo') {
      this.cue(T + 0.1, () => Sound.sfx('horn'));
      this.cue(T + 0.9, () => Sound.sfx('chime'));
      this.cue(T + 1.45, () => { Sound.sfx(this.cls === 'mage' ? 'bolt' : 'crit'); hitAll(30, this.col[0]); });
    } else if (k === 'wren') {
      this.cue(T + 0.2, () => Sound.sfx('whoosh')); this.cue(T + 0.55, () => { Sound.sfx('crit'); hitAll(20, '#6fb7f2'); });
      this.cue(T + 0.8, () => { Sound.sfx('crit'); hitAll(20, '#f2c94c'); }); this.cue(T + 1.3, () => Sound.sfx('heal'));
    } else if (k === 'lyra') {
      this.cue(T + 0.1, () => Sound.sfx('magic')); this.cue(T + 0.6, () => Sound.sfx('thunder'));
      for (let i = 0; i < 6; i++) this.cue(T + 0.7 + i * 0.13, () => { Sound.sfx('bolt'); const [x, y] = this.foeAt(i % Math.max(1, this.foes.length)); this.burst(x, y - 50, 24, i % 2 ? '#c88aff' : '#bfe6ff'); });
    } else if (k === 'garrick') {
      this.cue(T + 0.15, () => Sound.sfx('whoosh')); this.cue(T + 0.95, () => Sound.sfx('charge'));
      this.cue(T + 1.2, () => { Sound.sfx('crash'); Sound.sfx('break'); this.foes.forEach((e, i) => { const [x, y] = this.foeAt(i); this.burst(x, y, 30, '#f2a03a', 380, 0.9, 500); }); });
    } else if (k === 'sable') {
      for (let i = 0; i < 10; i++) this.cue(T + 0.1 + i * 0.13, () => { Sound.sfx(i % 2 ? 'slash' : 'hit'); const [x, y] = this.foeAt(i % Math.max(1, this.foes.length)); this.burst(x, y - 50, 10, '#e5534b', 320, 0.4); });
    } else if (k === 'oswin') {
      this.cue(T + 0.1, () => Sound.sfx('choir')); this.cue(T + 0.9, () => Sound.sfx('heal')); this.cue(T + 1.3, () => Sound.sfx('levelup'));
    } else if (k === 'kestrel') {
      this.cue(T + 0.15, () => Sound.sfx('whoosh')); this.cue(T + 0.45, () => Sound.sfx('whoosh'));
      for (let i = 0; i < 8; i++) this.cue(T + 0.85 + i * 0.07, () => { Sound.sfx('hit'); hitAll(4, '#7ed36f'); });
    } else if (k === 'varek') {
      this.cue(T + 0.1, () => Sound.sfx('dark')); this.cue(T + 0.9, () => Sound.sfx('fire'));
      this.cue(T + 1.15, () => { Sound.sfx('crit'); hitAll(26, '#ff5a2a'); });
    }
  }
  // --------------------------------------------------------------- the set-pieces
  draw() {
    const t = this.t;
    ctx.save();
    if (t < 1.0) this.drawCutIn();
    else {
      const u = clamp((t - 1.0) / (this.dur - 1.55), 0, 1);
      (this['act_' + this.kind] || this.act_solo).call(this, u);
      this.drawParts();
    }
    ctx.restore();
    this.drawImpact();
    // letterbox
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 28); ctx.fillRect(0, H - 28, W, 28);
    if (t > 0.6 && t < this.dur - 0.5) text(`${Controls.label('ok')}: skip`, W - 12, H - 22, 'rgba(255,255,255,.4)', 11, 'right', false);
  }
  sky(top, bottom, ground) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(0.7, bottom); g.addColorStop(1, ground || bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 336, W, H - 336);
  }
  // THE LAST CROSSING (solo): the road you died on, remembered in the middle of a fight
  act_solo(u) {
    const cls = this.cls;
    this.sky('#0a0814', '#1e1a2a', '#141018');
    // the crossing: stripes, a signal, rain
    ctx.fillStyle = '#26222c'; ctx.fillRect(0, 300, W, 120);
    for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(232,228,236,.8)'; ctx.fillRect(20 + i * 64, 318, 36, 90); }
    for (let i = 0; i < 60; i++) { const x = (hash2(i, 1) % W + TIME * 60) % W, y = (hash2(i, 2) % H + TIME * 700) % H; ctx.fillStyle = 'rgba(180,200,255,.35)'; ctx.fillRect(x, y, 1, 10); }
    const red = u < 0.55;
    ctx.fillStyle = '#1a1820'; ctx.fillRect(560, 140, 8, 170); ctx.fillRect(548, 128, 32, 44);
    ctx.fillStyle = red ? '#e5534b' : '#3a2020'; ctx.fillRect(553, 134, 22, 14); ctx.fillStyle = red ? '#203a20' : '#7ed36f'; ctx.fillRect(553, 152, 22, 14);
    // headlights coming, then stopping dead when time does
    const stop = u > 0.5, lx = stop ? 470 : W + 200 - easeIn(u / 0.5) * 330;
    const la = 0.6 + (stop ? 0.4 : u);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const dy of [-18, 18]) glow2(lx, 300 + dy, 140 * la, 'rgba(255,248,220,.9)');
    ctx.fillStyle = `rgba(255,245,210,${0.25 * la})`; ctx.beginPath(); ctx.moveTo(lx, 270); ctx.lineTo(0, 150); ctx.lineTo(0, 470); ctx.lineTo(lx, 330); ctx.fill();
    ctx.restore();
    if (stop) { ctx.fillStyle = 'rgba(40,40,80,.35)'; ctx.fillRect(0, 0, W, H); }      // time holds its breath
    // the hero turns to face it
    const pose = u < 0.5 ? '' : u < 0.72 ? (cls === 'mage' ? 'cast' : 'windup') : (cls === 'mage' ? 'cast' : 'attack');
    const h = this.spr('hero', 170, 420, 190, 'right', pose);
    if (u > 0.5) this.heroWeapon(h, u < 0.72 ? -2.1 : -2.1 + clamp((u - 0.72) / 0.12, 0, 1) * 3, 'rgba(255,240,180,.4)');
    // a small brass bell rings once
    if (u > 0.5 && u < 0.75) { const a = 1 - Math.abs(u - 0.62) / 0.13; ctx.save(); ctx.globalAlpha = Math.max(0, a); text('♪', 260 + (u - 0.5) * 80, 150 - (u - 0.5) * 120, '#f2c94c', 26, 'center'); ctx.restore(); }
    if (u > 0.72) {
      const k = clamp((u - 0.72) / 0.14, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (cls !== 'mage') { // the slash cuts the light in half
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10 * (1 - k * 0.5); ctx.beginPath(); ctx.moveTo(120, 120 + k * 10); ctx.lineTo(120 + k * 560, 440 - k * 20); ctx.stroke();
        ctx.strokeStyle = 'rgba(242,201,76,.8)'; ctx.lineWidth = 24; ctx.beginPath(); ctx.moveTo(120, 124); ctx.lineTo(120 + k * 560, 436); ctx.stroke();
      }
      if (cls !== 'blade') { // the headlights folded into one beam
        ctx.fillStyle = `rgba(255,250,220,${0.8 * k})`; ctx.fillRect(200, 250 - 30 * k, W, 60 * k);
        glow2(200, 280, 90 * k, 'rgba(255,255,255,.9)');
      }
      ctx.restore();
      if (u > 0.86) { this.drawFoes(true, 6); ctx.fillStyle = `rgba(255,255,255,${(u - 0.86) * 4})`; ctx.fillRect(0, 0, W, H); }
    }
  }
  // OATH OF VALEN (Wren): two blades cross through the enemy line, then gold falls on the party
  act_wren(u) {
    this.sky('#1a2a5a', '#3a5aa8', '#1a2238');
    this.speedLines(1, 'rgba(255,255,255,.6)', u < 0.5 ? 0.5 : 0.15);
    this.drawFoes(u > 0.3 && u < 0.7, 5);
    const dash = clamp(u / 0.35, 0, 1);
    const hx = 120 + easeIn(dash) * 520, wx = 120 + easeIn(clamp((u - 0.05) / 0.35, 0, 1)) * 520;
    for (let g = 1; g <= 4; g++) { this.spr('hero', hx - g * 40 * (dash < 1 ? 1 : 0), 380, 150, 'right', 'attack', 0.15 * (5 - g)); this.spr('c:wren', wx - g * 40, 410, 150, 'right', 'attack', 0.15 * (5 - g)); }
    if (dash < 1) { const h = this.spr('hero', hx, 380, 150, 'right', 'attack'); this.heroWeapon(h, 0.9, 'rgba(111,183,242,.5)'); this.spr('c:wren', wx, 410, 150, 'right', 'attack'); }
    else { this.spr('hero', 560, 380, 150, 'left', 'victory'); this.spr('c:wren', 600, 410, 150, 'left', 'victory'); }
    if (u > 0.3) {  // the X
      const k = clamp((u - 0.3) / 0.2, 0, 1), cx = W * 0.72, cy = 270;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 14 * (1.2 - k);
      ctx.strokeStyle = '#6fb7f2'; ctx.beginPath(); ctx.moveTo(cx - 180 * k, cy - 140 * k); ctx.lineTo(cx + 180 * k, cy + 140 * k); ctx.stroke();
      ctx.strokeStyle = '#f2c94c'; ctx.beginPath(); ctx.moveTo(cx + 180 * k, cy - 140 * k); ctx.lineTo(cx - 180 * k, cy + 140 * k); ctx.stroke();
      ctx.restore();
    }
    if (u > 0.62) {  // golden feathers over the party
      for (let i = 0; i < 26; i++) { const x = (hash2(i, 4) % W), y = ((u - 0.62) * 900 + hash2(i, 9) % 300) % (H + 40) - 40; ctx.save(); ctx.translate(x + Math.sin(TIME * 3 + i) * 12, y); ctx.rotate(Math.sin(TIME * 2 + i)); ctx.fillStyle = i % 3 ? '#f2c94c' : '#fff3c0'; ctx.fillRect(-2, -7, 4, 14); ctx.fillRect(-4, -3, 8, 3); ctx.restore(); }
      glow2(W * 0.3, 360, 200, 'rgba(126,211,111,.25)');
    }
  }
  // STARFALL (Lyra): a circle drawn in the sky, and the stars come down through it
  act_lyra(u) {
    this.sky('#05041a', '#1a1450', '#0e0c24');
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(220,230,255,${0.3 + Math.sin(TIME * 3 + i) * 0.3})`; ctx.fillRect(hash2(i, 1) % W, hash2(i, 2) % 330, 2, 2); }
    this.drawFoes(u > 0.45, 4);
    const h = this.spr('hero', 150, 420, 170, 'right', this.cls === 'blade' ? 'victory' : 'cast');
    this.heroWeapon(h, 0.1, 'rgba(191,230,255,.6)');
    this.spr('c:lyra', 250, 400, 160, 'right', 'cast');
    // the circle
    const k = clamp(u / 0.35, 0, 1), cx = W * 0.62, cy = 110;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.35); ctx.rotate(TIME * 1.5);
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(191,230,255,${0.9 * k})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 170 * k, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 130 * k, 0, 7 * k); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 130 * k, Math.sin(a) * 130 * k); ctx.lineTo(Math.cos(a + 2.1) * 130 * k, Math.sin(a + 2.1) * 130 * k); ctx.stroke(); }
    ctx.restore();
    // a line of light from her staff to the circle
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(200,138,255,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(260, 290); ctx.lineTo(cx, cy); ctx.stroke(); ctx.restore();
    // meteors
    if (u > 0.3) for (let i = 0; i < 9; i++) {
      const s = clamp((u - 0.3 - i * 0.045) / 0.22, 0, 1); if (s <= 0 || s >= 1) continue;
      const [tx, ty] = this.foeAt(i % Math.max(1, this.foes.length));
      const x0 = cx + (i - 4) * 30, y0 = cy, x = x0 + (tx - x0) * s, y = y0 + (ty - 60 - y0) * s;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = i % 2 ? 'rgba(200,138,255,.8)' : 'rgba(191,230,255,.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0 + (tx - x0) * (s - 0.25), y0 + (ty - 60 - y0) * (s - 0.25)); ctx.lineTo(x, y); ctx.stroke();
      glow2(x, y, 26, 'rgba(255,255,255,.9)');
      ctx.restore();
    }
    if (u > 0.55 && Math.random() < 0.3) { ctx.fillStyle = 'rgba(191,230,255,.25)'; ctx.fillRect(0, 0, W, H); }
  }
  // ANVIL BREAKER (Garrick): you launch him skyward; he comes back down with the whole mountain
  act_garrick(u) {
    this.sky('#3a1e10', '#8a4a20', '#2a1a10');
    if (u > 0.62 && u < 0.8) this.shake(18);
    // cracked ground after the hit
    this.drawFoes(u > 0.62, 8);
    const h = this.spr('hero', 170, 420, 170, 'right', u < 0.25 ? 'windup' : this.cls === 'mage' ? 'cast' : 'victory');
    this.heroWeapon(h, u < 0.25 ? -1.2 : 0.1, 'rgba(255,224,112,.5)');
    if (this.cls !== 'blade' && u > 0.15 && u < 0.4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffe070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(250, 400, 60, 16, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    // his arc: up off the screen, then down onto the enemies, huge
    let gx, gy, gs;
    if (u < 0.35) { const s = u / 0.35; gx = 250 + s * 60; gy = 420 - easeOut(s) * 520; gs = 150; }
    else if (u < 0.5) { gx = W * 0.72; gy = -200; gs = 260; }
    else { const s = clamp((u - 0.5) / 0.12, 0, 1); gx = W * 0.72; gy = -200 + easeIn(s) * 600; gs = 260; }
    if (gy > -gs) {
      this.spr('c:garrick', gx, gy, gs, 'right', u < 0.5 ? 'windup' : 'attack');
      if (u > 0.4) { // the axe, glowing like a forge
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow2(gx, gy - gs * 0.7, gs * 0.6, 'rgba(242,160,58,.55)'); ctx.restore();
      }
    }
    if (u > 0.62) {
      const k = clamp((u - 0.62) / 0.3, 0, 1), cx = W * 0.72, cy = 340;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,224,112,${1 - k})`; ctx.lineWidth = 12 * (1 - k) + 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, 40 + k * 420, 10 + k * 90, 0, 0, 7); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = '#1a0e08'; ctx.lineWidth = 4;
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 60 * (1 + k * 3), cy - Math.sin(a) * 8 * (1 + k * 3) + 20); ctx.stroke(); }
    }
  }
  // TWIN FANG (Sable): the room goes red and you both vanish; the enemies find out afterwards
  act_sable(u) {
    this.sky('#1a0608', '#3a0a10', '#12040a');
    ctx.fillStyle = 'rgba(229,83,75,.12)'; ctx.fillRect(0, 0, W, H);
    this.drawFoes(u > 0.1, 4);
    const n = 10, i = Math.min(n - 1, Math.floor(u / 0.8 * n));
    if (u < 0.8) {
      for (let j = Math.max(0, i - 3); j <= i; j++) {
        const [fx, fy] = this.foeAt(j % Math.max(1, this.foes.length)), side = j % 2 ? 1 : -1;
        const who = j % 2 ? 'c:sable' : 'hero', a = j === i ? 1 : 0.25 * (1 - (i - j) / 4);
        const hh = this.spr(who, fx + side * 70, fy + 10, 130, side > 0 ? 'left' : 'right', 'attack', a);
        if (who === 'hero' && j === i) this.heroWeapon(hh, 0.8, 'rgba(229,83,75,.5)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = '#ff6a60'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(fx - 80, fy - 120 + j * 7 % 40); ctx.lineTo(fx + 80, fy - 20 - j * 11 % 50); ctx.stroke(); ctx.restore();
      }
    } else {
      this.spr('hero', 170, 420, 170, 'right', 'victory'); this.spr('c:sable', 260, 420, 160, 'right', 'victory');
      const k = (u - 0.8) / 0.2;
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 3); text('5 HITS', W * 0.72, 120, '#ff6a60', 34, 'center'); ctx.restore();
    }
  }
  // SANCTUARY (Oswin): a sun opens over the party and the light comes down like rain
  act_oswin(u) {
    this.sky('#2a200e', '#6a5020', '#2a200e');
    const k = clamp(u / 0.4, 0, 1);
    ctx.save(); ctx.translate(W * 0.35, 110); ctx.rotate(TIME * 0.4); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.fillStyle = `rgba(255,243,192,${0.25 * k})`; ctx.fillRect(0, -6, 420 * k, 12); }
    ctx.restore();
    glow2(W * 0.35, 110, 120 * k, 'rgba(255,250,220,.95)');
    // a pillar of light over everyone
    if (u > 0.3) { const p = clamp((u - 0.3) / 0.2, 0, 1); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,243,192,0)'); g.addColorStop(1, `rgba(255,243,192,${0.5 * p})`); ctx.fillStyle = g; ctx.fillRect(40, 0, 400 * p, H); ctx.restore(); }
    const alive = G.party.slice(0, 4);
    alive.forEach((m, i) => { const x = 90 + i * 100, s = this.spr(memberKey(m), x, 430 - (i % 2) * 20, 130, 'right', u > 0.5 ? 'victory' : '');
      if (s && u > 0.5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 + Math.sin(TIME * 8 + i) * 0.2; ctx.drawImage(whiteSilhouette(s.img), s.x, s.y, 130, 130); ctx.restore(); } });
    if (u > 0.45) for (let i = 0; i < 30; i++) { const x = 40 + hash2(i, 3) % 400, y = ((u - 0.45) * 700 + hash2(i, 5) % 400) % H; ctx.fillStyle = i % 2 ? '#fff3c0' : '#f2c94c'; ctx.fillRect(x + Math.sin(TIME * 4 + i) * 8, y, 3, 8); }
    this.drawFoes(false);
    if (u > 0.7) { ctx.fillStyle = `rgba(255,243,192,${(u - 0.7)})`; ctx.fillRect(W * 0.5, 0, W * 0.5, H); }
  }
  // ARROW STORM (Kestrel): one volley up into the clouds, and the sky answers
  act_kestrel(u) {
    this.sky('#3a6a8a', '#8ab0c0', '#2a3a2a');
    for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse((hash2(i, 1) % W + TIME * 20) % (W + 200) - 100, 60 + i * 20, 90, 18, 0, 0, 7); ctx.fill(); }
    this.drawFoes(u > 0.5, 3);
    this.spr('c:kestrel', 250, 420, 170, 'right', u < 0.45 ? 'cast' : 'ready');
    const h = this.spr('hero', 140, 430, 160, 'right', this.cls === 'mage' ? 'cast' : 'victory');
    this.heroWeapon(h, 0.1, 'rgba(126,211,111,.5)');
    if (this.cls !== 'blade' && u < 0.45) glow2(270, 280, 40, 'rgba(126,211,111,.7)');   // you set the arrowheads glowing
    // up…
    if (u < 0.45) for (let i = 0; i < 14; i++) { const s = clamp((u - i * 0.02) / 0.25, 0, 1); if (s <= 0 || s >= 1) continue; const x = 270 + s * 200 + i * 6, y = 290 - s * 360; ctx.fillStyle = '#fff4d0'; ctx.save(); ctx.translate(x, y); ctx.rotate(-1.1); ctx.fillRect(-14, -1, 28, 2); ctx.fillStyle = '#7ed36f'; ctx.fillRect(12, -2, 5, 4); ctx.restore(); }
    // …and down
    if (u > 0.45) for (let i = 0; i < 60; i++) {
      const s = clamp((u - 0.45 - (i % 12) * 0.02) / 0.25, 0, 1); if (s <= 0 || s >= 1) continue;
      const [tx, ty] = this.foeAt(i % Math.max(1, this.foes.length));
      const x = tx - 120 + (hash2(i, 3) % 240) + (1 - s) * 80, y = -20 + s * (ty - 20 + (hash2(i, 5) % 60));
      ctx.save(); ctx.translate(x, y); ctx.rotate(1.9); ctx.fillStyle = '#fff4d0'; ctx.fillRect(-14, -1, 28, 2); ctx.fillStyle = '#7ed36f'; ctx.fillRect(12, -2, 5, 4); ctx.restore();
    }
  }
  // ASHEN PACT (Varek): back to back in a storm of ash, two black flames cross the field
  act_varek(u) {
    this.sky('#0a0408', '#2a0a0a', '#0a0406');
    // the vortex
    ctx.save(); ctx.translate(W * 0.35, 280);
    for (let i = 0; i < 120; i++) { const a = i * 0.37 + TIME * (2 + (i % 5) * 0.4), r = 30 + (i * 7) % 260 * clamp(u * 2, 0, 1); ctx.fillStyle = i % 7 ? 'rgba(180,170,170,.55)' : '#ff7a3a'; ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r * 0.5, 3, 3); }
    ctx.restore();
    glow2(W * 0.35, 330, 160, 'rgba(255,90,42,.3)');
    this.drawFoes(u > 0.6, 6);
    const hh = this.spr('hero', W * 0.3, 420, 170, 'right', u < 0.5 ? 'ready' : this.cls === 'mage' ? 'cast' : 'attack');
    this.heroWeapon(hh, u < 0.5 ? 0.3 : 1.2, 'rgba(255,90,42,.5)');
    this.spr('c:varek', W * 0.4, 420, 180, 'left', u < 0.5 ? 'ready' : 'attack');
    if (u > 0.5) {
      const k = clamp((u - 0.5) / 0.25, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [dir, col] of [[1, '#ff5a2a'], [-1, '#c83a8a']]) {
        const x = dir > 0 ? -100 + k * (W + 200) : W + 100 - k * (W + 200);
        ctx.strokeStyle = col; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(x, 280, 150, dir > 0 ? -1.2 : 1.9, dir > 0 ? 1.2 : 4.3); ctx.stroke();
        ctx.strokeStyle = '#1a0a10'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x - dir * 6, 280, 150, dir > 0 ? -1.2 : 1.9, dir > 0 ? 1.2 : 4.3); ctx.stroke();
      }
      ctx.restore();
    }
  }
}
function glow2(x, y, r, col) {
  if (r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
async function playResolveCut(battle, kind, partner, sk) {
  const c = new ResolveCut(battle, kind, partner, sk);
  Scenes.push(c);
  await c.promise;
}
// swap the old quick flashes for the cutscenes
{
  const P = BattleScene.prototype;
  P.crossingFx = async function () {
    const sk = SKILLS[{ blade: 'crossingB', mage: 'crossingM', none: 'crossingH' }[G.heroClass || 'none']];
    await playResolveCut(this, 'solo', null, sk);
    Sound.sfx('crash'); this.shakeT = 0.6; this.flashT = 0.5;
    await wait(0.25);
    Sound.play(this.opts.music || (this.isBoss ? 'boss' : 'battle'));
  };
  P.teamUpFx = async function (a, b, sk) {
    await playResolveCut(this, b.cls, b, sk);
    Sound.sfx('crit'); this.shakeT = 0.5; this.flashT = 0.35;
    await wait(0.2);
    Sound.play(this.opts.music || (this.isBoss ? 'boss' : 'battle'));
  };
}
