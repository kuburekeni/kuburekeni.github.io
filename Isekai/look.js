// =====================================================================
//  look.js : character customisation and character detail
//   - choose your Tokyo self at the start (hair, eyes, glasses), then
//     your new face at the mirror in House Valen: hair, colour, skin,
//     eyes, build, face marks, glasses, an accessory and an accent colour
//   - the wardrobe: change your look later (Tess at Valen Manor,
//     Odette's in Solmere, the barber in Gullhaven)
//   - everyone blinks; people notice you walking up; little emotes
// =====================================================================
const EYE_COLOURS = [
  { name: 'Dark Brown', c: '#2a1810' }, { name: 'Brown', c: '#5a3418' }, { name: 'Hazel', c: '#7a6a2a' }, { name: 'Green', c: '#2f7a4a' },
  { name: 'Blue', c: '#2f5aa8' }, { name: 'Grey', c: '#6a7486' }, { name: 'Amber', c: '#b8761e' }, { name: 'Violet', c: '#6a3aa8' }, { name: 'Black', c: '#16121c' }
];
const BUILDS = [{ id: 'slim', name: 'Slim' }, { id: 'standard', name: 'Standard' }, { id: 'sturdy', name: 'Sturdy' }];
const MARKS = [{ id: 'none', name: 'None' }, { id: 'freckles', name: 'Freckles' }, { id: 'blush', name: 'Rosy cheeks' }, { id: 'mole', name: 'Beauty mark' }, { id: 'scar', name: 'Scar' }, { id: 'paint', name: 'Face paint' }];
const GLASSES = [{ id: 'none', name: 'None' }, { id: 'round', name: 'Round' }, { id: 'square', name: 'Square' }];
const ACCESSORIES = [{ id: 'none', name: 'None' }, { id: 'headband', name: 'Headband' }, { id: 'ribbon', name: 'Ribbon' }, { id: 'flower', name: 'Hair flower' }, { id: 'earring', name: 'Earrings' }, { id: 'bandana', name: 'Bandana' }, { id: 'clips', name: 'Hair clips' }];
const ACCENTS = [
  { name: 'Valen Crimson', c: '#8a1e2a' }, { name: 'Royal Blue', c: '#2e4fa8' }, { name: 'Forest', c: '#2f7a4a' }, { name: 'Gold', c: '#d8a840' },
  { name: 'Plum', c: '#6a2a7a' }, { name: 'Sky', c: '#5ab0e0' }, { name: 'Rose', c: '#e07898' }, { name: 'Snow', c: '#eeeaf2' }, { name: 'Ink', c: '#22202a' }
];
function heroLook() {
  if (!G) return {};
  if (!G.look) G.look = { eyes: EYE_COLOURS[0].c, build: 'standard', mark: 'none', glasses: 'none', acc: 'none', accent: ACCENTS[0].c };
  return G.look;
}
function tokyoLook() {
  if (!G) return {};
  if (!G.tk) G.tk = { hair: '#16121c', hairStyle: G.gender === 'girl' ? 'long' : 'spiky', eyes: EYE_COLOURS[0].c, glasses: 'none', skin: G.skin };
  return G.tk;
}
const teenNow = () => G && G.age === 'teen' && !G.flags.reborn;

// ---------------------------------------------------------------- hero definition
{
  const cd0 = charDef;
  charDef = function (key) {
    const d = cd0(key);
    if (key !== 'hero' || !G) return d;
    const out = { ...d, pal: { ...d.pal }, mods: [...(d.mods || [])] };
    if (teenNow()) {
      const t = tokyoLook();
      out.hair = t.hairStyle; out.pal.h = t.hair; out.pal.e = t.eyes; out.pal.s = t.skin || out.pal.s;
      out.acc = { glasses: t.glasses, mark: 'none', acc: 'none', accent: out.pal.n };
      return out;
    }
    const L = heroLook();
    out.pal.e = L.eyes;
    if (L.accent) out.pal.n = L.accent;
    if (L.build === 'sturdy' && !out.mods.includes('stout') && G.age !== 'child') out.mods.push('stout');
    out.acc = { glasses: L.glasses, mark: L.mark, acc: L.acc, accent: L.accent, slim: L.build === 'slim' };
    return out;
  };
  const st0 = spriteTag;
  spriteTag = function (key) {
    const t = st0(key);
    if (key !== 'hero' || !G) return t;
    const L = teenNow() ? tokyoLook() : heroLook();
    return t + '|' + Object.values(L).join(',');
  };
}

// ---------------------------------------------------------------- overlays: faces, glasses, accessories, blinking
{
  const dh0 = drawHumanoid;
  drawHumanoid = function (def, view, frame, pose) {
    const c = dh0(def, view, frame, pose);
    const A = def.acc, blink = pose === 'blink';
    if (!A && !blink) return c;
    const x = c.getContext('2d');
    const R = (X, Y, w, h, col) => { if (w > 0 && h > 0) { x.fillStyle = col; x.fillRect(X, Y, w, h); } };
    const M = new Set(def.mods || []), child = M.has('child');
    const oy = child ? 4 : 0, bob = frame && !pose ? -1 : 0, U = oy + bob;
    const hy = 3 + U + (pose === 'hurt' ? 1 : 0);
    const side = view === 'side', down = view === 'down', up = view === 'up';
    const hx = side ? 10 + (pose === 'attack' ? 1 : pose === 'hurt' ? -1 : 0) : 9, hw = side ? 12 : 14;
    const s = (def.pal && def.pal.s) || SK, s2 = shade(s, -0.16), s3 = shade(s, -0.32);
    const ac = (A && A.accent) || (def.pal && def.pal.n) || '#8a1e2a', acd = shade(ac, -0.3), acl = shade(ac, 0.3);
    // ---- blink: lids over the eyes, one frame in a few seconds
    if (blink) {
      if (down) { R(12, hy + 7, 2, 3, s); R(18, hy + 7, 2, 3, s); R(12, hy + 9, 2, 1, s3); R(18, hy + 9, 2, 1, s3); }
      if (side) { const ex = hx + 8; R(ex, hy + 7, 2, 3, s); R(ex, hy + 9, 2, 1, s3); }
    }
    if (!A) return c;
    // ---- face marks
    if (A.mark === 'freckles') { if (down) for (const [a, b] of [[11, 10], [13, 11], [12, 12], [19, 10], [20, 11], [18, 12]]) R(a, hy + b - 1, 1, 1, shade(s, -0.28)); if (side) for (const [a, b] of [[6, 10], [8, 11], [9, 10]]) R(hx + a, hy + b - 1, 1, 1, shade(s, -0.28)); }
    if (A.mark === 'blush') { if (down) { R(11, hy + 10, 2, 1, '#e8808e'); R(19, hy + 10, 2, 1, '#e8808e'); } if (side) R(hx + 7, hy + 10, 2, 1, '#e8808e'); }
    if (A.mark === 'mole') { if (down) R(20, hy + 11, 1, 1, '#2a1a14'); if (side) R(hx + 9, hy + 11, 1, 1, '#2a1a14'); }
    if (A.mark === 'scar') { const sc = '#c0707a'; if (down) for (let i = 0; i < 6; i++) R(19 + (i > 2 ? 1 : 0), hy + 5 + i, 1, 1, sc); if (side) for (let i = 0; i < 5; i++) R(hx + 7 + (i > 2 ? 1 : 0), hy + 5 + i, 1, 1, sc); }
    if (A.mark === 'paint') { if (down) { R(11, hy + 10, 3, 1, ac); R(18, hy + 10, 3, 1, ac); R(15, hy + 3, 2, 1, ac); } if (side) R(hx + 7, hy + 10, 4, 1, ac); }
    // ---- glasses
    if (A.glasses !== 'none' && A.glasses) {
      const fr = '#241c24', lens = 'rgba(210,235,255,.45)';
      if (down) {
        for (const ex of [11, 17]) {
          if (A.glasses === 'round') { R(ex, hy + 6, 4, 1, fr); R(ex, hy + 10, 4, 1, fr); R(ex - 1, hy + 7, 1, 3, fr); R(ex + 4, hy + 7, 1, 3, fr); }
          else { R(ex - 1, hy + 6, 6, 1, fr); R(ex - 1, hy + 10, 6, 1, fr); R(ex - 1, hy + 6, 1, 5, fr); R(ex + 4, hy + 6, 1, 5, fr); }
          R(ex, hy + 7, 4, 3, lens);
        }
        R(15, hy + 7, 2, 1, fr); R(hx - 1, hy + 7, 2, 1, fr); R(hx + hw - 1, hy + 7, 2, 1, fr);
        R(12, hy + 7, 2, 3, def.pal.e || '#1a1426'); R(18, hy + 7, 2, 3, def.pal.e || '#1a1426');
        if (blink) { R(12, hy + 7, 2, 3, s); R(18, hy + 7, 2, 3, s); R(12, hy + 9, 2, 1, s3); R(18, hy + 9, 2, 1, s3); }
        R(12, hy + 7, 1, 1, '#ffffff');
      } else if (side) {
        const ex = hx + 7;
        R(ex, hy + 6, 5, 1, fr); R(ex, hy + 10, 5, 1, fr); R(ex + 4, hy + 6, 1, 5, fr); R(ex, hy + 7, 4, 3, lens);
        R(ex + 1, hy + 7, 2, 3, blink ? s : (def.pal.e || '#1a1426'));
        R(hx + 2, hy + 7, ex - hx - 2, 1, fr);
      }
    }
    // ---- accessories
    switch (A.acc) {
      case 'headband':
        if (down) { R(hx, hy + 2, hw, 2, ac); R(hx, hy + 2, hw, 1, acl); }
        else if (up) { R(hx - 1, hy + 3, hw + 2, 2, ac); R(14, hy + 5, 2, 4, acd); R(17, hy + 5, 2, 3, ac); }
        else { R(hx, hy + 2, hw - 1, 2, ac); R(hx - 3, hy + 3, 3, 1, ac); R(hx - 4, hy + 4, 2, 2, acd); }
        break;
      case 'bandana':
        if (down) { R(hx - 1, hy - 2, hw + 2, 5, ac); R(hx, hy - 3, hw, 1, ac); for (let i = hx; i < hx + hw; i += 3) R(i, hy - 1, 1, 1, acl); }
        else if (up) { R(hx - 1, hy - 2, hw + 2, 6, ac); R(14, hy + 4, 4, 2, acd); R(13, hy + 6, 2, 3, ac); R(17, hy + 6, 2, 3, ac); }
        else { R(hx - 1, hy - 2, hw, 5, ac); R(hx - 4, hy + 2, 4, 2, acd); R(hx - 5, hy + 4, 2, 2, ac); }
        break;
      case 'ribbon': {
        const bx = down ? hx + hw - 3 : up ? hx + 2 : hx - 1, by = hy - 3;
        R(bx - 2, by, 2, 3, ac); R(bx + 2, by, 2, 3, ac); R(bx, by + 1, 2, 1, acd); R(bx - 2, by, 1, 1, acl); R(bx + 3, by, 1, 1, acl);
        break;
      }
      case 'flower': {
        const fx = down ? hx + 1 : up ? hx + hw - 3 : hx + 3, fy = hy;
        R(fx, fy - 1, 3, 1, '#f7b8cc'); R(fx - 1, fy, 5, 1, '#f28fad'); R(fx, fy + 1, 3, 1, '#f7b8cc'); R(fx + 1, fy, 1, 1, '#ffe070');
        break;
      }
      case 'earring':
        if (down) { R(hx - 1, hy + 9, 1, 2, '#f2c94c'); R(hx + hw, hy + 9, 1, 2, '#f2c94c'); }
        else if (side) R(hx + 3, hy + 10, 1, 2, '#f2c94c');
        break;
      case 'clips':
        if (down) { R(hx + 2, hy + 1, 3, 1, ac); R(hx + 3, hy + 2, 3, 1, acl); }
        else if (side) R(hx + 6, hy + 1, 3, 1, ac);
        break;
    }
    return c;
  };
}

// blinking: the world tells charSprite which entity is drawing right now
let BLINK_NOW = false;
{
  const cs0 = charSprite;
  charSprite = function (key, dir, frame, pose = '') {
    if (BLINK_NOW && !frame && !pose && dir !== 'up' && !key.startsWith('m:') && !key.startsWith('pet:')) pose = 'blink';
    return cs0(key, dir, frame, pose);
  };
  const dc0 = WorldScene.prototype.drawChar;
  WorldScene.prototype.drawChar = function (key, dir, frame, sx, sy, n) {
    const seed = (key.length * 977 + ((n && (n.hx || n.x)) || 0) * 131 + ((n && (n.hy || n.y)) || 0) * 71) % 5000;
    BLINK_NOW = !frame && ((TIME * 1000 + seed) % (3400 + seed % 1600)) < 120;
    try { return dc0.call(this, key, dir, frame, sx, sy, n); } finally { BLINK_NOW = false; }
  };
}

// ---------------------------------------------------------------- people notice you
// a little "!" or "♪" over someone's head the first time you walk up to them on a visit
const Emotes = {
  list: [],
  add(x, y, kind, dur = 1.3) { this.list.push({ x, y, kind, t: 0, dur }); },
  draw(camX, camY) {
    for (const e of this.list) {
      e.t += 1 / 60;
      const sx = e.x * TS - camX + 16, sy = e.y * TS - camY - 18 - Math.min(1, e.t * 6) * 4;
      const a = e.t > e.dur - 0.25 ? (e.dur - e.t) / 0.25 : 1;
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.ellipse(sx, sy, 9, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.ellipse(sx, sy, 8, 7, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx - 2, sy + 6); ctx.lineTo(sx + 1, sy + 11); ctx.lineTo(sx + 3, sy + 5); ctx.fill();
      const col = { '!': '#e5534b', '?': '#4a8ad8', '♪': '#c84a8a', '…': '#5a5470', '♥': '#e5534b', '💤': '#5a5470' }[e.kind] || '#333';
      text(e.kind, sx, sy - 7, col, 11, 'center');
      ctx.globalAlpha = 1;
    }
    this.list = this.list.filter(e => e.t < e.dur);
  }
};
{
  const up0 = WorldScene.prototype.update;
  WorldScene.prototype.update = function (dt) {
    up0.call(this, dt);
    if (!this.npcs || this.lock) return;
    if (this._noticeMap !== this.map) { this._noticeMap = this.map; this._noticed = new Set(); }
    const p = this.player;
    for (const n of this.npcs) {
      if (!n.spr || n.spr.startsWith('m:') || n.spr.startsWith('pet:') || this._noticed.has(n.id)) continue;
      if (Math.abs(n.x - p.x) + Math.abs(n.y - p.y) <= 2) {
        this._noticed.add(n.id);
        const kind = n.emote || (/kid|child/.test(n.spr) ? '!' : /bard|singer/.test(n.script || '') ? '♪' : hash2(n.x, n.y) % 3 === 0 ? '…' : '!');
        if (hash2(n.x * 3, n.y) % 2 === 0 || n.emote) Emotes.add(n.x, n.y, kind);
        if (!n.wander && !n.fixed) n.dir = p.x < n.x ? 'left' : p.x > n.x ? 'right' : p.y < n.y ? 'up' : 'down';
      }
    }
  };
  const air0 = WorldScene.prototype.drawLifeAir;
  WorldScene.prototype.drawLifeAir = function (camX, camY) { air0.call(this, camX, camY); Emotes.draw(camX, camY); };
}

// ---------------------------------------------------------------- the creator
// rows are [label, getter, setter, options]. Shared by the Tokyo creator, the mirror and the wardrobe.
class LookScene {
  constructor(mode) {
    this.mode = mode; this.row = 0; this.t = 0; this.turn = 0;
    this.promise = new Promise(r => this.resolve = r);
    const L = mode === 'tokyo' ? tokyoLook() : heroLook();
    const opt = (label, list, get, set, nameOf, valOf) => ({ label, list, get, set, nameOf: nameOf || (o => o.name), valOf: valOf || (o => o.c) });
    if (mode === 'tokyo') {
      this.rows = [
        opt('Hair', HAIR_STYLES, () => L.hairStyle, v => L.hairStyle = v, o => o.name, o => o.id),
        opt('Hair colour', HAIR_COLOURS.slice(0, 5), () => L.hair, v => L.hair = v),
        opt('Skin', SKIN_TONES, () => L.skin, v => L.skin = v),
        opt('Eyes', EYE_COLOURS.slice(0, 3).concat([EYE_COLOURS[8]]), () => L.eyes, v => L.eyes = v),
        opt('Glasses', GLASSES, () => L.glasses, v => L.glasses = v, o => o.name, o => o.id)
      ];
    } else {
      this.rows = [
        opt('Hair', HAIR_STYLES, () => G.hairStyle, v => G.hairStyle = v, o => o.name, o => o.id),
        opt('Hair colour', HAIR_COLOURS, () => G.hair, v => G.hair = v),
        opt('Skin', SKIN_TONES, () => G.skin, v => G.skin = v),
        opt('Eyes', EYE_COLOURS, () => L.eyes, v => L.eyes = v),
        opt('Build', BUILDS, () => L.build, v => L.build = v, o => o.name, o => o.id),
        opt('Face', MARKS, () => L.mark, v => L.mark = v, o => o.name, o => o.id),
        opt('Glasses', GLASSES, () => L.glasses, v => L.glasses = v, o => o.name, o => o.id),
        opt('Accessory', ACCESSORIES, () => L.acc, v => L.acc = v, o => o.name, o => o.id),
        opt('Accent colour', ACCENTS, () => L.accent, v => L.accent = v)
      ];
      if (mode === 'wardrobe') this.rows.splice(2, 1);       // nobody changes their skin at a tailor's
    }
    this.rows.push({ label: 'Random', random: true });
    this.rows.push({ label: 'Done', done: true });
  }
  shift(d) {
    const r = this.rows[this.row];
    if (r.done) return;
    if (r.random) { for (const q of this.rows) if (q.list) { const o = pick(q.list); q.set(q.valOf(o)); } clearHeroSprites(); Sound.sfx('magic'); return; }
    const vals = r.list.map(r.valOf);
    const i = Math.max(0, vals.indexOf(r.get()));
    r.set(vals[(i + d + vals.length) % vals.length]);
    clearHeroSprites(); Sound.sfx('cursor');
  }
  update(dt) {
    this.t += dt; this.turn += dt;
    const n = this.rows.length;
    if (Input.pressed('up')) { this.row = (this.row + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('down')) { this.row = (this.row + 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('left')) this.shift(-1);
    if (Input.pressed('right')) this.shift(1);
    if (Input.pressed('pgup')) this.turn += 1.2;
    if (Input.pressed('ok')) { const r = this.rows[this.row]; if (r.done) { Sound.sfx('ok'); this.resolve(); } else this.shift(1); }
    if (Input.pressed('cancel') && this.mode === 'wardrobe') { Sound.sfx('cancel'); this.resolve(); }
  }
  draw() {
    const tok = this.mode === 'tokyo';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, tok ? '#2a2440' : '#2a1e2c'); g.addColorStop(1, tok ? '#0e0c1a' : '#120c16');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (tok) { for (let i = 0; i < 40; i++) { const x = hash2(i, 9) % W, y = hash2(i, 4) % 260; ctx.fillStyle = 'rgba(255,220,150,.25)'; ctx.fillRect(x, y, 6, 9); } }
    // the mirror and a turning reflection
    const mx = Math.round(W * 0.27) - 95, my = 60, mw = 190, mh = 330;
    ctx.fillStyle = tok ? '#3a3e4a' : '#6a4a28'; ctx.fillRect(mx - 14, my - 14, mw + 28, mh + 28);
    ctx.fillStyle = tok ? '#5a5e6a' : '#8a6a3a'; ctx.fillRect(mx - 8, my - 8, mw + 16, mh + 16);
    const mg = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
    mg.addColorStop(0, '#3a4a58'); mg.addColorStop(0.5, '#5a7080'); mg.addColorStop(1, '#2e3a46');
    ctx.fillStyle = mg; ctx.fillRect(mx, my, mw, mh);
    ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx + 20, my + mh); ctx.lineTo(mx + 90, my); ctx.lineTo(mx + 130, my); ctx.lineTo(mx + 60, my + mh); ctx.fill(); ctx.restore();
    const dirs = ['down', 'right', 'up', 'left'], dir = dirs[Math.floor(this.turn / 1.6) % 4];
    const walk = Math.floor(this.t * 5) % 4, frame = walk === 1 ? 1 : walk === 3 ? 2 : 0;
    glow(mx + mw / 2, my + 150, 150, 'rgba(255,220,170,.16)');
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(mx + mw / 2, my + 280, 60, 14, 0, 0, 7); ctx.fill();
    ctx.drawImage(charSprite('hero', dir, frame), mx + mw / 2 - 112, my + 64, 224, 224);
    // the big face, down-facing, for detail
    ctx.fillStyle = UI.ink; ctx.fillRect(mx + mw - 64, my + 8, 58, 58); ctx.fillStyle = '#2a3263'; ctx.fillRect(mx + mw - 62, my + 10, 54, 54);
    ctx.drawImage(charSprite('hero', 'down', 0), 7, 0, 18, 18, mx + mw - 60, my + 12, 50, 50);
    if (!tok) for (const cx of [mx - 40, mx + mw + 40]) { const fy = 200 + Math.sin(TIME * 8 + cx) * 2; ctx.fillStyle = '#e8dcc0'; ctx.fillRect(cx - 4, 210, 8, 40); glow(cx, fy, 40, 'rgba(255,190,110,.5)'); ctx.fillStyle = '#f2c94c'; ctx.fillRect(cx - 2, fy - 6, 4, 8); }
    FX.bloom(0.25);
    // options
    const px_ = Math.round(W * 0.54), pw = W - px_ - 16;
    drawWindow(px_ - 16, 22, pw + 16, H - 44);
    text(tok ? 'You, before' : this.mode === 'wardrobe' ? 'A new look' : 'Your reflection', px_, 36, UI.gold, 18);
    const sub = tok ? 'Seiryo High, second year. Who looks back at you?' : this.mode === 'wardrobe' ? 'Change as much or as little as you like.' : 'Six years old, and very sure about your hair.';
    wrap(sub, pw - 20, 12).forEach((l, i) => text(l, px_, 60 + i * 15, UI.dim, 12, 'left', false));
    const rowH = Math.min(34, Math.floor((H - 170) / this.rows.length));
    this.rows.forEach((r, i) => {
      const y = 96 + i * rowH, on = i === this.row;
      if (on) { ctx.fillStyle = 'rgba(242,143,173,.12)'; ctx.fillRect(px_ - 6, y - 4, pw - 8, rowH - 2); drawCursor(px_ - 2, y + 2); }
      if (r.done || r.random) { text(r.label, px_ + 18, y + 2, on ? (r.done ? UI.gold : UI.paper) : UI.dim, 16); return; }
      text(r.label, px_ + 18, y + 2, on ? UI.paper : UI.dim, 13);
      const o = r.list.find(o => r.valOf(o) === r.get()) || r.list[0];
      const vx = px_ + pw - 110;
      text('◀', vx - 14, y + 1, on ? UI.sakura : '#5a5470', 13);
      if (o.c) { ctx.fillStyle = UI.ink; ctx.fillRect(vx + 2, y + 2, 12, 12); ctx.fillStyle = o.c; ctx.fillRect(vx + 3, y + 3, 10, 10); }
      text(r.nameOf(o), vx + (o.c ? 50 : 40), y + 2, on ? UI.paper : UI.dim, 13, 'center');
      text('▶', vx + 86, y + 1, on ? UI.sakura : '#5a5470', 13);
    });
    text(Controls.mode === 'pad' ? '◀ ▶ change · ▲ ▼ move · LB turn' : '◀ ▶ change · ▲ ▼ move', px_, H - 44, UI.dim, 11, 'left', false);
  }
}
async function lookCreator(mode) {
  const s = new LookScene(mode);
  Scenes.push(s);
  if (Fade.a > 0) fadeIn(0.6);
  await s.promise;
  Scenes.remove(s);
  clearHeroSprites();
}
// the mirror at six now uses the full creator
LATE.push(() => { mirrorSequence = async function () {
  Scenes.stack.length = 0;
  Sound.stop(); Sound.play('manor');
  const s = new LookScene('mirror'); Scenes.push(s);
  await fadeIn(0.8);
  await s.promise;
  await fadeOut(0.8);
  Scenes.remove(s);
  clearHeroSprites();
}; });

// ---------------------------------------------------------------- the wardrobe
async function wardrobe(who, spr, line) {
  if (G.age === 'teen' || G.age === 'baby') { await say(who, `Come back when you're a bit older.`, spr); return; }
  const price = G.age === 'child' || G.map === 'valen_manor' ? 0 : 50;
  const c = await ask(who, line || `A new look? ${price ? price + ' G, and I\'ll do your hair and find you something to wear with it.' : 'Sit still, then.'}`, ['Yes, please.', 'Not today.'], spr);
  if (c !== 0) return;
  if (price && G.gold < price) { Sound.sfx('buzz'); await say(who, `That's not ${price}.`, spr); return; }
  G.gold -= price; if (price) Sound.sfx('coin');
  await fadeOut(0.4);
  const keep = JSON.stringify([G.hair, G.hairStyle, G.look]);
  await lookCreator('wardrobe');
  await fadeIn(0.4);
  const changed = keep !== JSON.stringify([G.hair, G.hairStyle, G.look]);
  await say(who, changed ? pick([`There. Go and frighten someone with how good you look.`, `Much better. Don't tell your mother I did it in ten minutes.`, `Turn round. …Yes. Yes, that's you.`]) : `Change of heart? It happens. Come back whenever.`, spr);
  if (changed) for (const m of G.party) if (m.cls !== 'hero') { addMorale(m.cls, 1, true); }
  saveGame(true);
}
{
  const maid0 = STORY.maid;
  STORY.maid = async function (n) {
    if (G.age === 'child' || G.age === 'baby') return maid0.call(this, n);
    const c = await ask('Tess', pick([`Look at the state of your hair. Want me to sort it?`, `Home again. Need anything?`]), ['Change my look', 'Just saying hello'], 'maid');
    if (c === 0) await wardrobe('Tess', 'maid', `Sit on the chest. No, the other chest. Right — what are we doing?`);
    else await maid0.call(this, n);
  };
}
Object.assign(CHARS, {
  odette: { pal: { h: '#e98aa8', s: SK2, c: '#3a2a5a', d: '#241a3a', t: '#e8c870', p: '#241a3a', b: '#1a1010', n: '#e8c870' }, hair: 'bun', outfit: 'dress', mods: ['girl', 'skirt'] },
  barber: { pal: { h: '#16121c', s: SK5, c: '#e8e0d0', d: '#b8b0a0', p: '#3a3040', b: '#1a1418' }, hair: 'buzz', mods: ['apron', 'beard'] }
});
STORY.odette = async function () { await wardrobe('Odette', 'odette', `Welcome to Odette's. The Crown City's finest scissors, and the only honest mirror. A new look is 50 G.`); };
STORY.barber = async function () { await wardrobe('Barber Quint', 'barber', `Sit down, sit down. Sea air does terrible things to hair. 50 G and you'll walk out a new person.`); };
MAPS.solmere.npcs.push({ id: 'odette', x: 32, y: 31, spr: 'odette', dir: 'down', script: 'odette' });

// ---------------------------------------------------------------- livelier movement
//  - running: a lean into the stride and a puff of dust every few steps
//  - talking: whoever is speaking bobs gently while their words come out
//  - opening a chest: a burst of sparkles
//  - arriving somewhere: a little settle as you land
{
  const P = WorldScene.prototype;
  const dc0 = P.drawChar;
  P.drawChar = function (key, dir, frame, sx, sy, n) {
    let ox = 0, oy = 0;
    // the speaker bobs
    const d = Scenes.top();
    if (d instanceof DialogScene && d.chars < d.full && n && d.name) {
      const nm = (n.name || (n.spr && CHARS[n.spr] && '') || '');
      if ((n === this.player && d.name === G.name) || (n.name && d.name.startsWith(n.name)) || (n.spr && d.spr === n.spr)) oy = -Math.abs(Math.sin(TIME * 14)) * 1.5;
    }
    // running lean
    if (n === this.player && n.t < 1 && Input.held('run')) { const [dx] = DIRS[dir] || [0, 0]; ox = dx * 1; oy -= Math.abs(Math.sin(n.anim * 1.6)) * 1.2; }
    // landing settle after a warp
    if (n === this.player && this._landT !== undefined) { const t = TIME - this._landT; if (t < 0.25) oy += Math.sin(t / 0.25 * Math.PI) * 2; }
    return dc0.call(this, key, dir, frame, sx + ox, sy + oy, n);
  };
  const ld0 = P.load;
  P.load = function (...a) { const r = ld0.apply(this, a); this._landT = TIME; return r; };
  const fs0 = P.footstep;
  P.footstep = function (tx, ty, e) {
    fs0.call(this, tx, ty, e);
    if (e === this.player && Input.held('run') && this.life && !this.map.interior) {
      e._runN = (e._runN || 0) + 1;
      if (e._runN % 2 === 0) for (let i = 0; i < 3; i++) this.life.fx.push({ k: 'dust', x: tx * TS + 16 + rand(-5, 5), y: ty * TS + 28, vx: rand(-25, 25), vy: rand(-16, -4), t: 0, life: rand(0.3, 0.5), col: '#d8ccb0', r: rand(2, 3.5) });
    }
  };
}
{
  const oc0 = openChest;
  openChest = async function (c) {
    const fresh = !G.flags['chest_' + c.id];
    if (fresh && World && World.life) for (let i = 0; i < 18; i++) { const a = rand(0, 6.283); World.life.fx.push({ k: 'spark', x: c.x * TS + 16, y: c.y * TS + 14, vx: Math.cos(a) * rand(30, 90), vy: Math.sin(a) * rand(30, 90) - 40, t: 0, life: rand(0.5, 0.9) }); }
    return oc0(c);
  };
  const air0 = WorldScene.prototype.drawLifeAir;
  WorldScene.prototype.drawLifeAir = function (camX, camY) {
    air0.call(this, camX, camY);
    const L = this.life; if (!L) return;
    for (const f of L.fx) if (f.k === 'spark') { const p = f.t / f.life; ctx.globalAlpha = 1 - p; ctx.fillStyle = p < 0.5 ? '#fff8c0' : '#f2c94c'; ctx.fillRect(Math.round(f.x - camX), Math.round(f.y - camY), 2, 2); }
    ctx.globalAlpha = 1;
  };
}
