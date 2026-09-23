// =====================================================================
//  gfx.js : all art. 32px characters, procedural monsters, autotiled
//  32px tiles, lights and particles. Everything is drawn in code.
// =====================================================================
const SpriteCache = {};
const TileCache = {};

function px(x, c, X, Y, w = 1, h = 1) { x.fillStyle = c; x.fillRect(X, Y, w, h); }
function flipped(c) { const [f, x] = mkCanvas(c.width, c.height); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f; }
// 1px dark outline around every opaque pixel (the "pixel art" look)
function outline(c, col = UI.ink, threshold = true) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const d = x.getImageData(0, 0, w, h), p = d.data;
  if (threshold) for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 110 ? 255 : 0;
  const out = new Uint8ClampedArray(p);
  const [r, g, b] = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
    const i = (y * w + X) * 4;
    if (p[i + 3]) continue;
    const n = (X > 0 && p[i - 1]) || (X < w - 1 && p[i + 7]) || (y > 0 && p[i - w * 4 + 3]) || (y < h - 1 && p[i + w * 4 + 3]);
    if (n) { out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255; }
  }
  x.putImageData(new ImageData(out, w, h), 0, 0);
  return c;
}
function whiteSilhouette(c) {
  if (c._white) return c._white;
  const [w, x] = mkCanvas(c.width, c.height);
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  c._white = w; return w;
}

// softer, colour-tinted outline (closer to 16-bit sprite work than pure black)
function outlineSoft(c) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 110 ? 255 : 0;
  const out = new Uint8ClampedArray(p);
  const ink = [18, 14, 31];
  for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
    const i = (y * w + X) * 4;
    if (p[i + 3]) continue;
    let n = -1;
    if (y < h - 1 && p[i + w * 4 + 3]) n = i + w * 4;
    else if (X > 0 && p[i - 1]) n = i - 4;
    else if (X < w - 1 && p[i + 7]) n = i + 4;
    else if (y > 0 && p[i - w * 4 + 3]) n = i - w * 4;
    if (n < 0) continue;
    out[i] = Math.round(p[n] * 0.32 + ink[0] * 0.68); out[i + 1] = Math.round(p[n + 1] * 0.32 + ink[1] * 0.68); out[i + 2] = Math.round(p[n + 2] * 0.32 + ink[2] * 0.68); out[i + 3] = 255;
  }
  x.putImageData(new ImageData(out, w, h), 0, 0);
  return c;
}

// Sprite lighting: a rim of light on the upper-left inner edge, core shadow
// on the lower-right, so every flat-coloured sprite reads as a rounded form.
function shadeSprite(c, strength = 1) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const d = x.getImageData(0, 0, w, h), p = d.data;
  const A = (X, Y) => (X < 0 || Y < 0 || X >= w || Y >= h) ? 0 : p[(Y * w + X) * 4 + 3];
  const edge = new Uint8Array(w * h);
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) if (A(X, Y) && (!A(X - 1, Y) || !A(X + 1, Y) || !A(X, Y - 1) || !A(X, Y + 1))) edge[Y * w + X] = 1;
  const E = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && edge[Y * w + X];
  const out = new Uint8ClampedArray(p);
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
    const i = (Y * w + X) * 4; if (!p[i + 3] || edge[Y * w + X]) continue;
    const lum = p[i] * 0.3 + p[i + 1] * 0.55 + p[i + 2] * 0.15;
    if (lum < 34) continue;                           // leave outlines and pupils alone
    const lit = E(X - 1, Y) || E(X, Y - 1), dark = E(X + 1, Y) || E(X, Y + 1), dark2 = E(X + 2, Y + 1) || E(X + 1, Y + 2);
    if (lit && !dark) { const t = 0.2 * strength; out[i] += (255 - p[i]) * t; out[i + 1] += (246 - p[i + 1]) * t; out[i + 2] += (226 - p[i + 2]) * t; }
    else if (dark && !lit) { const t = 0.2 * strength; out[i] = p[i] * (1 - t) + 34 * t; out[i + 1] = p[i + 1] * (1 - t) + 26 * t; out[i + 2] = p[i + 2] * (1 - t) + 64 * t; }
    else if (dark2 && !lit) { const t = 0.09 * strength; out[i] = p[i] * (1 - t) + 34 * t; out[i + 1] = p[i + 1] * (1 - t) + 26 * t; out[i + 2] = p[i + 2] * (1 - t) + 64 * t; }
  }
  x.putImageData(new ImageData(out, w, h), 0, 0);
  return c;
}

// ---------------------------------------------------------------- humanoids
function lookOf(m) { const a = m && m.equip && ITEMS[m.equip.armor]; return a && a.look; }
function charDef(key) {
  if (key === 'hero') {
    const girl = G && G.gender === 'girl';
    const m = G && G.party && G.party[0];
    const look = lookOf(m) || (G && G.age === 'child' ? ITEMS.childclothes.look : ITEMS.uniform.look);
    const mods = [];
    if (girl) mods.push('girl');
    if (G && G.age === 'child') mods.push('child');
    if (look.style === 'uniform') { mods.push('tie'); if (girl) mods.push('skirt'); }
    if (look.style === 'noble' && !(G && G.age === 'child')) mods.push('cape');
    const hs = G && G.age === 'teen' && !G.flags.reborn ? (girl ? 'long' : 'spiky') : (G && G.hairStyle) || 'short';
    return {
      pal: { h: (G && G.hair) || '#16121c', s: (G && G.skin) || SK, c: look.c, d: look.d, t: look.t, p: look.style === 'uniform' && girl ? ((G && G.skin) || SK) : look.p, b: look.b, n: look.n || '#b83a4a' },
      hair: hs, outfit: look.style, mods, star: look.star
    };
  }
  if (key.startsWith('c:')) {
    const id = key.slice(2), base = CHARS[id] || CHARS.villager, m = memberFor(id), look = lookOf(m);
    if (!look) return base;
    const keep = (base.mods || []).filter(k => !['cape', 'hood', 'helm', 'skirt', 'apron'].includes(k));
    if ((base.mods || []).includes('cape') && (look.style === 'robe' || look.style === 'plate' || look.style === 'noble')) keep.push('cape');
    return { pal: { ...base.pal, c: look.c, d: look.d, t: look.t || base.pal.t, p: look.p, b: look.b, n: look.n || base.pal.n }, hair: base.hair, outfit: look.style, mods: keep, star: look.star };
  }
  return CHARS[key] || CHARS.villager;
}
function spriteTag(key) {
  if (!G) return '';
  if (key === 'hero') { const m = G.party && G.party[0]; return [G.hair, G.hairStyle, G.gender, G.skin, G.age, G.flags && G.flags.reborn ? 1 : 0, m && m.equip.armor].join('|'); }
  if (key.startsWith('c:')) { const m = memberFor(key.slice(2)); return m ? m.equip.armor : ''; }
  return '';
}
function charSprite(key, dir, frame, pose = '') {
  if (key.startsWith('m:')) return monsterSprite(key.slice(2), dir === 'left', 32);
  const id = key + spriteTag(key) + dir + frame + pose;
  if (SpriteCache[id]) return SpriteCache[id];
  const def = charDef(key);
  const side = dir === 'left' || dir === 'right';
  let c = drawHumanoid(def, side ? 'side' : dir, frame, pose);
  const hand = c.hand;
  shadeSprite(c, 0.9);
  if (dir === 'left') { c = flipped(c); if (hand) c.hand = [31 - hand[0], hand[1]]; }
  SpriteCache[id] = c;
  return c;
}
function clearHeroSprites() { for (const k in SpriteCache) if (k.startsWith('hero') || k.startsWith('c:')) delete SpriteCache[k]; }

// pose (side view only): '' walk · ready · windup · attack · cast · hurt · guard · victory
function drawHumanoid(def, view, frame, pose) {
  const [c, x] = mkCanvas(32, 32);
  const P = def.pal, M = new Set(def.mods || []);
  const R = (X, Y, w, h, col) => { if (w > 0 && h > 0) px(x, col, X, Y, w, h); };
  const E = (cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  const s = P.s, s2 = shade(s, -0.16), s3 = shade(s, -0.32);
  const h = P.h || '#16121c', h2 = shade(h, -0.3), h3 = shade(h, -0.5), hl = shade(h, h === '#16121c' || parseInt(h.slice(1), 16) < 0x303030 ? 0.22 : 0.3);
  const cc = P.c, cd = P.d, cl = shade(cc, 0.18), cdd = shade(cd, -0.25), tr = P.t || shade(cc, 0.4), pp = P.p, bb = P.b, eye = P.e || '#1a1426', n = P.n || '#d8d0c0';
  const outfit = def.outfit || (M.has('hakama') ? 'hakama' : 'tunic');
  const style = def.hair || (M.has('girl') ? 'long' : 'short');
  const child = M.has('child'), stout = M.has('stout');
  const oy = child ? 4 : 0;
  const bob = frame && !pose ? -1 : 0;
  const U = oy + bob;
  const legTop = child ? 26 : stout ? 25 : 24;
  const bw = stout ? 14 : child ? 10 : 12, bx = 16 - bw / 2;
  const side = view === 'side', up = view === 'up', down = view === 'down';
  const longSkirt = outfit === 'robe' || outfit === 'dress';
  const ty = 16 + U, th = legTop - 16 - bob + 1;
  const hy = 3 + U + (pose === 'hurt' ? 1 : 0), hx = side ? 10 + (pose === 'attack' ? 1 : pose === 'hurt' ? -1 : 0) : 9, hw = side ? 12 : 14;
  const hood = M.has('hood'), helm = M.has('helm');
  const sleeve = outfit === 'plate' ? cc : outfit === 'leather' ? tr : outfit === 'uniform' ? cc : cd;

  // ---------- cape behind
  if (M.has('cape')) {
    const col = up ? cd : shade(cd, -0.2);
    if (side) R(7, 16 + U, 6, 13 - (child ? 2 : 0), shade(n, -0.25) === shade(n, -0.25) ? shade(outfit === 'noble' ? n : cd, -0.15) : col);
    else { R(bx - 2, 16 + U, bw + 4, up ? 14 : 12, outfit === 'noble' ? shade(n, up ? 0 : -0.2) : col); if (up) R(bx - 1, 29 + oy, bw + 2, 2, shade(outfit === 'noble' ? n : cd, -0.35)); }
  }
  // ---------- hair that sits behind the body
  hairBack();
  // ---------- legs
  const legs = () => {
    if (M.has('hakama')) {
      R(bx - 1, 21 + U, bw + 2, 9 - bob, pp); R(15, 23 + U, 2, 7 - bob, shade(pp, -0.3));
      R(bx, 29 + oy, 3, 2, bb); R(bx + bw - 3, 29 + oy, 3, 2, bb); return;
    }
    const lh = 31 - legTop;
    const lp = outfit === 'plate' ? cd : pp, lp2 = shade(lp, -0.22);
    if (side) {
      let f = frame === 1 ? 2 : frame === 2 ? -2 : 0;
      if (pose === 'attack') f = 3; if (pose === 'windup') f = -1; if (pose === 'cast' || pose === 'victory') f = 1;
      R(13 - f, legTop, 3, lh, lp2); R(13 - f, 29, 3, 2, shade(bb, -0.2));
      R(16 + f, legTop, 3, lh, lp); R(16 + f, 29, 4, 2, bb); R(16 + f, 29, 4, 1, shade(bb, 0.2));
      if (outfit === 'plate') R(16 + f, legTop + 2, 3, 1, shade(cc, 0.3));
    } else {
      const lu = frame === 1 ? 1 : 0, ru = frame === 2 ? 1 : 0;
      R(12, legTop, 3, lh - lu, lp); R(12, 29 - lu, 3, 2, bb); R(12, 29 - lu, 3, 1, shade(bb, 0.2));
      R(17, legTop, 3, lh - ru, lp2); R(17, 29 - ru, 3, 2, bb); R(17, 29 - ru, 3, 1, shade(bb, 0.15));
      R(14, legTop, 1, 3, shade(lp, -0.3));
      if (outfit === 'plate') { R(12, legTop + 2, 3, 1, shade(cc, 0.3)); R(17, legTop + 2, 3, 1, cc); }
    }
  };
  if (!longSkirt) legs();
  else { // just the feet under a long hem
    if (side) { R(13, 29, 3, 2, shade(bb, -0.2)); R(16 + (frame === 1 ? 1 : 0), 29, 4, 2, bb); }
    else { R(12, 30 - (frame === 1 ? 1 : 0), 3, 2, bb); R(17, 30 - (frame === 2 ? 1 : 0), 3, 2, bb); }
  }
  // ---------- far arm (side view, behind the body)
  if (side) {
    const sw = frame === 1 ? -2 : frame === 2 ? 2 : 0;
    if (pose === 'cast') { R(13, ty - 3, 3, 5, shade(sleeve, -0.25)); R(13, ty - 5, 3, 2, s3); }
    else if (pose !== 'victory' && pose !== 'attack') R(13 + sw, ty + 1, 3, 6, shade(sleeve, -0.3));
  }
  // ---------- torso
  const T0 = side ? 11 : bx, TW = side ? 10 : bw;
  R(T0, ty, TW, th, cc);
  R(T0, ty, 1, th, cl);
  R(T0 + TW - 3, ty, 3, th, cd);
  R(T0, ty + th - 1, TW, 1, cd);
  if (down || side) {
    if (down) R(14, ty, 4, 1, s2);                                     // neck
    const beltY = ty + th - 3;
    switch (outfit) {
      case 'noble':
        if (down) { R(13, ty, 6, 2, tr); R(15, ty + 2, 2, th - 3, tr); for (let j = ty + 3; j < beltY; j += 2) R(15, j, 1, 1, shade(tr, 0.4)); R(bx - 1, ty, 2, 2, tr); R(bx + bw - 1, ty, 2, 2, tr); for (let k = 0; k < bw - 3; k++) R(bx + 1 + k, ty + 1 + Math.floor(k * 0.55), 1, 1, n); }
        else { R(18, ty, 3, 2, tr); R(20, ty + 2, 1, th - 3, tr); }
        R(T0, beltY, TW, 1, shade(tr, -0.35)); R(down ? 15 : 19, beltY, 2, 1, tr);
        break;
      case 'uniform':
        if (down) { R(14, ty, 4, 3, '#e8e8f0'); R(13, ty + 1, 1, 4, cd); R(18, ty + 1, 1, 4, cd); }
        if (M.has('tie') && down) { R(15, ty + 1, 2, 5, n); R(15, ty + 5, 2, 1, shade(n, -0.3)); }
        if (side) R(19, ty, 2, 3, '#e8e8f0');
        break;
      case 'leather':
        if (down) { R(14, ty + 1, 4, th - 2, tr); R(bx + 1, ty + 1, 1, th - 2, cdd); R(bx + bw - 2, ty + 1, 1, th - 2, cdd); for (let k = 0; k < 6; k++) R(bx + 2 + k, ty + 1 + k, 1, 1, cdd); }
        else R(19, ty + 1, 2, th - 2, tr);
        R(T0, beltY, TW, 1, cdd); R(down ? 15 : 18, beltY, 2, 1, '#d8c070');
        break;
      case 'chain':
        for (let j = ty + 1; j < ty + th - 1; j++) for (let i = T0 + 1; i < T0 + TW - 1; i++) if ((i + j) % 2 === 0) R(i, j, 1, 1, (i > T0 + TW - 4) ? cdd : cd);
        if (down) { R(14, ty + 2, 4, th - 1, tr); R(14, ty + 2, 1, th - 1, shade(tr, 0.2)); }
        else R(18, ty + 2, 2, th - 1, tr);
        R(T0, beltY, TW, 1, '#4a3a2a');
        break;
      case 'plate': {
        const hi = shade(cc, 0.42);
        if (down) { R(bx + 2, ty + 1, 2, th - 4, hi); R(15, ty + 1, 1, th - 4, cd); R(bx - 2, ty - 1, 4, 4, cc); R(bx - 2, ty - 1, 4, 1, hi); R(bx + bw - 2, ty - 1, 4, 4, cd); R(bx + bw - 2, ty - 1, 4, 1, cl); R(14, beltY + 1, 4, 3, tr); }
        else { R(12, ty + 1, 2, th - 4, hi); R(9, ty - 1, 5, 4, cc); R(9, ty - 1, 5, 1, hi); R(18, beltY + 1, 3, 3, tr); }
        R(T0, beltY, TW, 1, cdd);
        break;
      }
      case 'robe': case 'dress':
        if (down) { if (outfit === 'robe') R(15, ty + 1, 2, th, tr); else { R(bx, ty + th - 4, bw, 1, tr); R(13, ty, 6, 1, tr); } }
        else if (outfit === 'robe') R(19, ty + 1, 1, th, tr);
        break;
      case 'cloak':
        R(T0 - 1, ty, TW + 2, th + 3, cc); R(T0 - 1, ty, 1, th + 3, cl); R(T0 + TW - 2, ty, 3, th + 3, cd);
        if (down) { R(15, ty + 1, 2, th + 2, cdd); R(15, ty, 2, 1, tr); }
        break;
      case 'ranger':
        if (down) { for (let k = 0; k < bw - 1; k++) R(bx + k, ty + Math.floor(k * 0.6), 1, 1, tr); R(12, ty, 8, 1, cd); }
        else R(12, ty + 1, 1, th - 2, tr);
        R(T0, beltY, TW, 1, '#5a3a1e'); R(down ? 15 : 19, beltY, 2, 1, '#c8a86a');
        break;
      case 'rogue':
        if (down) { R(12, ty, 8, 2, n); R(18, ty + 2, 2, 3, shade(n, -0.2)); for (let k = 0; k < bw - 2; k++) { R(bx + 1 + k, ty + 2 + Math.floor(k * 0.5), 1, 1, cdd); } }
        else { R(16, ty, 5, 2, n); R(10, ty + 1, 2, 4, shade(n, -0.2)); }
        R(T0, beltY, TW, 1, cdd);
        break;
      case 'hakama': break;
      default: // tunic
        if (down) { R(13, ty, 6, 1, tr); R(15, ty + 1, 2, 2, shade(cc, -0.1)); }
        R(T0, beltY, TW, 1, cdd); R(down ? 15 : 18, beltY, 2, 1, tr);
    }
    if (M.has('apron') && down) { R(bx + 2, ty + 2, bw - 4, th - 1, '#e8e0d0'); R(bx + 2, ty + 2, bw - 4, 1, '#ffffff'); }
    if (M.has('apron') && side) R(18, ty + 2, 3, th, '#e8e0d0');
  } else if (up) {
    if (outfit === 'robe') R(15, ty, 2, th, cd);
    if (outfit === 'ranger') { R(20, ty - 1, 3, 9, '#6a4a2a'); R(20, ty - 3, 1, 3, '#e8e0d0'); R(22, ty - 3, 1, 3, '#e8e0d0'); }
    if (outfit === 'cloak') R(T0 - 1, ty, TW + 2, th + 3, cc);
    R(T0, ty + th - 3, TW, 1, cdd);
  }
  // ---------- skirt / long hem
  if (longSkirt) {
    const top = legTop - 3, flare = outfit === 'dress' ? 2 : 1;
    if (side) { R(10, top, 12, 31 - top, cc); R(19, top, 3, 31 - top, cd); R(10, 30, 12, 1, outfit === 'robe' ? tr : cd); }
    else {
      R(bx - flare, top, bw + flare * 2, 31 - top, cc); R(bx - flare, top, 1, 31 - top, cl); R(bx + bw + flare - 3, top, 3, 31 - top, cd);
      R(bx - flare, 30, bw + flare * 2, 1, outfit === 'robe' ? tr : cd);
      if (outfit === 'robe' && down) R(15, top, 2, 30 - top, tr);
    }
    if (def.star) for (let i = 0; i < 6; i++) R(bx + (i * 5) % bw, ty + 2 + (i * 7) % 12, 1, 1, '#bfe6ff');
  } else if (M.has('skirt')) {
    if (side) { R(10, legTop - 2, 12, 4, cc); R(10, legTop + 1, 12, 1, cd); }
    else { R(bx - 1, legTop - 2, bw + 2, 4, cc); R(bx - 1, legTop + 1, bw + 2, 1, cd); }
  }
  // ---------- arms
  let hand = null;
  const sl2 = shade(sleeve, -0.12);
  if (side) {
    const sw = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    switch (pose) {
      case 'ready': R(16, ty + 1, 3, 6, sleeve); R(17, ty + 6, 3, 2, s); hand = [18, ty + 7]; break;
      case 'windup': R(12, ty - 3, 3, 5, sleeve); R(11, ty - 5, 3, 2, s); hand = [12, ty - 4]; break;
      case 'attack': R(17, ty + 1, 7, 3, sleeve); R(24, ty + 1, 2, 3, s); hand = [25, ty + 2]; break;
      case 'cast': R(17, ty - 3, 3, 5, sleeve); R(18, ty - 5, 3, 2, s); hand = [19, ty - 4]; break;
      case 'hurt': R(11, ty + 2, 3, 6, sleeve); R(10, ty + 7, 3, 2, s); hand = [11, ty + 8]; break;
      case 'guard': R(17, ty + 2, 4, 3, sleeve); R(21, ty + 2, 2, 3, s); hand = [22, ty + 3]; break;
      case 'victory': R(16, ty - 6, 3, 7, sleeve); R(16, ty - 8, 3, 2, s); hand = [17, ty - 8]; break;
      default: R(14 + sw, ty + 1, 4, 7, sleeve); R(14 + sw, ty + 1, 1, 7, shade(sleeve, 0.15)); R(14 + sw, ty + 8, 4, 2, s); hand = [16 + sw, ty + 9];
    }
    if (longSkirt && outfit === 'robe' && !pose) R(13 + sw, ty + 6, 6, 2, sleeve);
  } else {
    const la = frame === 1 ? -1 : 0, ra = frame === 2 ? -1 : 0;
    const wide = outfit === 'robe' ? 1 : 0, pl = outfit === 'plate' ? 1 : 0;
    R(bx - 2 - wide - pl, ty + 1 + la, 2 + wide, 7, up ? sleeve : sl2); R(bx - 2 - pl, ty + 8 + la, 2, 2, s);
    R(bx + bw + pl, ty + 1 + ra, 2 + wide, 7, shade(sleeve, -0.22)); R(bx + bw + pl, ty + 8 + ra, 2, 2, s2);
    if (outfit === 'plate') { R(bx - 3, ty + 7 + la, 3, 1, shade(cc, 0.3)); R(bx + bw + 1, ty + 7 + ra, 3, 1, cc); }
  }
  // ---------- head
  if (down) { R(hx, hy + 1, hw, 11, s); R(hx + 1, hy, hw - 2, 13, s); R(hx + hw - 2, hy + 2, 2, 9, s2); R(hx + 1, hy + 12, hw - 2, 1, s2); }
  else if (up) { R(hx, hy + 1, hw, 11, s2); R(hx + 1, hy, hw - 2, 13, s2); }
  else { R(hx, hy + 1, hw, 11, s); R(hx + 1, hy, hw - 2, 13, s); R(hx + 1, hy + 12, hw - 3, 1, s2); R(hx, hy + 8, 3, 4, s2); }
  // ears
  if (M.has('ears')) {
    if (down) { R(6, hy + 5, 3, 2, s); R(5, hy + 4, 2, 1, s); R(23, hy + 5, 3, 2, s2); R(25, hy + 4, 2, 1, s2); }
    if (side) { R(hx - 1, hy + 5, 3, 2, s); R(hx - 2, hy + 4, 2, 1, s); }
    if (up) { R(6, hy + 5, 3, 2, s); R(23, hy + 5, 3, 2, s); }
  } else if (down && !hood && !helm && ['buzz', 'short', 'spiky', 'bun', 'braids', 'ponytail'].includes(style)) { R(hx - 1, hy + 6, 1, 3, s2); R(hx + hw, hy + 6, 1, 3, s3); }
  // face
  const hurt = pose === 'hurt';
  if (down) {
    if (hurt) { R(12, hy + 8, 3, 1, eye); R(18, hy + 8, 3, 1, eye); }
    else { R(12, hy + 7, 2, 3, eye); R(18, hy + 7, 2, 3, eye); R(12, hy + 7, 1, 1, '#ffffff'); R(18, hy + 7, 1, 1, '#ffffff'); R(12, hy + 9, 2, 1, shade(eye, 0.35)); R(18, hy + 9, 2, 1, shade(eye, 0.35)); }
    if (!hood && !helm && style !== 'none') { R(12, hy + 6, 2, 1, h2); R(18, hy + 6, 2, 1, h2); }
    R(11, hy + 10, 2, 1, shade(s, -0.07)); R(19, hy + 10, 2, 1, shade(s, -0.07));
    if (!M.has('beard')) R(15, hy + 11, 2, 1, s3);
    if (M.has('tusks')) { R(13, hy + 11, 1, 2, '#f0ece0'); R(18, hy + 11, 1, 2, '#f0ece0'); }
  }
  if (side) {
    const ex = hx + 8;
    if (hurt) R(ex, hy + 8, 3, 1, eye);
    else { R(ex, hy + 7, 2, 3, eye); R(ex + 1, hy + 7, 1, 1, '#ffffff'); }
    if (!hood && !helm && style !== 'none') R(ex, hy + 6, 3, 1, h2);
    R(hx + hw - 1, hy + 8, 1, 2, s); // nose
    if (!M.has('beard')) R(ex + 1, hy + 11, 2, 1, s3);
    if (M.has('tusks')) R(ex + 2, hy + 11, 1, 2, '#f0ece0');
  }
  if (M.has('beard')) {
    const bc = shade(h, 0.08);
    if (down) { R(10, hy + 9, 12, 5, bc); R(11, hy + 14, 10, 2, bc); R(14, hy + 16, 4, 1, bc); R(14, hy + 10, 4, 1, s3); R(11, hy + 9, 1, 3, shade(bc, 0.2)); }
    if (side) { R(hx + 5, hy + 9, 7, 5, bc); R(hx + 6, hy + 14, 5, 2, bc); }
  }
  // ---------- hair / hood / helm
  if (hood || helm) {
    const hc = hood ? cd : shade(cc, 0.1), hc2 = shade(hc, -0.25), hcl = shade(hc, 0.25);
    if (down) {
      R(hx - 1, hy - 1, hw + 2, 5, hc); R(hx, hy - 2, hw, 2, hc); R(hx - 1, hy + 3, 2, hood ? 11 : 7, hc); R(hx + hw - 1, hy + 3, 2, hood ? 11 : 7, hc2);
      if (helm) { R(15, hy + 3, 2, 5, shade(hc, -0.2)); R(hx + 1, hy + 3, hw - 2, 1, hc2); } else R(hx - 2, hy + 12, hw + 4, 3, cd);
      R(hx + 2, hy - 1, 6, 1, hcl);
    } else if (up) { R(hx - 1, hy - 1, hw + 2, 13, hc); R(hx, hy - 2, hw, 2, hc); R(hx + hw - 2, hy, 2, 12, hc2); R(hx + 2, hy - 1, 6, 1, hcl); }
    else { R(hx - 1, hy - 1, hw + 1, 5, hc); R(hx, hy - 2, hw - 1, 2, hc); R(hx - 1, hy + 3, 6, hood ? 11 : 8, hc); R(hx + 1, hy - 1, 6, 1, hcl); if (helm) R(hx + 4, hy + 3, hw - 4, 1, hc2); }
  } else hairFront();
  // horns
  if (M.has('horns')) {
    const H_ = (X, Y) => R(X, Y, 2, 2, n);
    if (side) { H_(hx + 2, hy - 1); H_(hx + 1, hy - 3); H_(hx, hy - 5); R(hx - 1, hy - 6, 2, 1, shade(n, -0.2)); }
    else { H_(hx, hy - 1); H_(hx - 1, hy - 3); H_(hx - 2, hy - 5); H_(hx + hw - 2, hy - 1); H_(hx + hw - 1, hy - 3); H_(hx + hw, hy - 5); }
  }
  if (M.has('bones') && down) { for (let i = 0; i < 3; i++) R(bx + 2, ty + 2 + i * 2, bw - 4, 1, '#6a6860'); }
  outlineSoft(c);
  c.hand = hand;
  return c;

  // ================================================= hair styles
  function tex(x0, y0, w, h_, col, every = 3, seed = 1) { for (let j = y0; j < y0 + h_; j++) for (let i = x0; i < x0 + w; i++) if (hash2(i * 7 + seed, j * 13) % every === 0) R(i, j, 1, 1, col); }
  function blob(cx, cy, rx, ry, filter, col, texCol) {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const d = ((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2;
      const edge = d > 0.82 && hash2(i, j) % 3 === 0;
      if (d > 1 || edge) continue;
      if (filter && !filter(i, j)) continue;
      R(i, j, 1, 1, texCol && hash2(i * 3, j * 5) % 5 === 0 ? texCol : (texCol && hash2(i * 11, j * 7) % 7 === 0 ? h3 : col));
    }
  }
  function strand(X, Y0, Y1, col, dark) { for (let j = Y0; j < Y1; j++) R(X, j, 2, 1, (j + X) % 3 === 0 ? dark : col); R(X, Y1, 2, 1, dark); }
  function hairBack() {
    if (style === 'none' || hood || helm) return;
    const hy_ = hy;
    if (style === 'long') {
      if (down) { R(7, hy_ + 5, 3, 13, h2); R(22, hy_ + 5, 3, 13, h2); }
      if (side) R(8, hy_ + 4, 6, 14, h2);
    }
    if (style === 'afro') {
      if (down) blob(16, hy_ + 3, 11.5, 8.5, null, h2, hl);
      if (side) blob(15, hy_ + 3, 10.5, 8.5, null, h2, hl);
    }
    if (style === 'twists') {
      if (down) blob(16, hy_ + 3, 9.5, 7, null, h2);
      if (side) blob(15, hy_ + 3, 9, 7, null, h2);
    }
    if (style === 'locs') {
      if (down) for (const X of [7, 9, 21, 23]) strand(X, hy_ + 5, hy_ + 17, h2, h3);
      if (side) for (const X of [7, 9, 11]) strand(X, hy_ + 3, hy_ + 17, h2, h3);
    }
    if (style === 'braids') {
      if (down) { strand(8, hy_ + 7, hy_ + 17, h2, h3); strand(22, hy_ + 7, hy_ + 17, h2, h3); }
      if (side) strand(9, hy_ + 5, hy_ + 17, h2, h3);
    }
    if (style === 'ponytail' && side) { R(hx - 3, hy_ + 3, 3, 3, h); for (let j = 0; j < 9; j++) R(hx - 4 + (j > 5 ? 1 : 0), hy_ + 5 + j, 3, 1, j % 3 ? h : h2); }
  }
  function hairFront() {
    if (style === 'none') return;
    if (down) {
      switch (style) {
        case 'buzz':
          R(hx + 1, hy - 1, hw - 2, 1, h); R(hx, hy, hw, 2, h); R(hx, hy + 2, 2, 3, h); R(hx + hw - 2, hy + 2, 2, 3, h2); R(hx + 2, hy + 2, hw - 4, 1, h2);
          tex(hx + 1, hy - 1, hw - 2, 3, hl, 4, 3); break;
        case 'afro':
          blob(16, hy + 3, 11.5, 8.5, (i, j) => j <= hy + 3 || i < hx + 1 || i > hx + hw - 2, h, hl); break;
        case 'twists':
          blob(16, hy + 3, 9.5, 7, (i, j) => j <= hy + 3 || ((i < hx + 1 || i > hx + hw - 2) && j < hy + 8), h);
          for (let i = hx - 1; i < hx + hw + 1; i += 2) { R(i, hy - 3 + (i % 4 ? 1 : 0), 1, 3, hl); R(i + 1, hy - 2, 1, 5, h3); } break;
        case 'locs':
          R(hx - 1, hy - 1, hw + 2, 4, h); R(hx, hy - 2, hw, 2, h); R(hx - 1, hy + 3, 2, 3, h); R(hx + hw - 1, hy + 3, 2, 3, h2);
          for (let i = hx; i < hx + hw; i += 2) R(i, hy - 1, 1, 3, hl);
          for (const X of [hx - 2, hx + hw]) strand(X, hy + 3, hy + 15, h, h3);
          strand(hx, hy + 3, hy + 6, h, h3); strand(hx + hw - 2, hy + 3, hy + 6, h, h3); break;
        case 'braids':
          R(hx, hy - 1, hw, 4, h); R(hx + 1, hy - 2, hw - 2, 1, h); R(hx - 1, hy + 2, 2, 4, h); R(hx + hw - 1, hy + 2, 2, 4, h2);
          for (let i = hx + 1; i < hx + hw - 1; i += 3) R(i, hy - 2, 1, 5, h3);
          R(hx + 2, hy - 1, 1, 1, hl); R(hx + 8, hy - 1, 1, 1, hl); break;
        case 'spiky':
          R(hx - 1, hy - 1, hw + 2, 5, h); R(hx, hy - 2, hw, 2, h); R(hx - 1, hy + 3, 2, 6, h); R(hx + hw - 1, hy + 3, 2, 6, h2);
          for (const [X, Y, hh] of [[hx - 1, hy - 4, 3], [hx + 2, hy - 5, 4], [hx + 6, hy - 6, 5], [hx + 10, hy - 5, 4], [hx + 12, hy - 3, 2]]) { R(X, Y, 2, hh, h); R(X, Y, 1, 1, hl); }
          R(hx + 1, hy + 4, 2, 3, h); R(hx + 4, hy + 4, 3, 2, h); R(hx + 7, hy + 4, 2, 3, h); R(hx + 10, hy + 4, 3, 2, h2); R(hx + 2, hy - 1, 6, 1, hl); break;
        case 'bun':
          R(hx, hy - 1, hw, 4, h); R(hx + 1, hy - 2, hw - 2, 1, h); R(hx - 1, hy + 2, 2, 5, h); R(hx + hw - 1, hy + 2, 2, 5, h2); R(hx + 2, hy + 3, 4, 1, h); R(hx + 8, hy + 3, 4, 1, h2);
          E(16, hy - 3, 4, 3, h); R(14, hy - 5, 3, 1, hl); R(hx + 2, hy - 1, 5, 1, hl); break;
        case 'ponytail':
          R(hx - 1, hy - 1, hw + 2, 5, h); R(hx, hy - 2, hw, 2, h); R(hx - 1, hy + 3, 2, 5, h); R(hx + hw - 1, hy + 3, 2, 5, h2);
          R(hx + 1, hy + 4, 4, 2, h); R(hx + 6, hy + 4, 2, 3, h); R(hx + 9, hy + 4, 4, 2, h2); R(hx + 2, hy - 1, 6, 1, hl); break;
        case 'long':
          R(hx - 1, hy - 1, hw + 2, 5, h); R(hx, hy - 2, hw, 2, h); R(hx - 1, hy + 3, 2, 9, h); R(hx + hw - 1, hy + 3, 2, 9, h2);
          R(hx + 1, hy + 4, 3, 2, h); R(hx + 5, hy + 4, 2, 3, h); R(hx + 8, hy + 4, 3, 2, h); R(hx + 11, hy + 4, 2, 3, h2); R(hx + 2, hy - 1, 6, 1, hl); break;
        default: // short
          R(hx - 1, hy - 1, hw + 2, 5, h); R(hx, hy - 2, hw, 2, h); R(hx - 1, hy + 3, 2, 6, h); R(hx + hw - 1, hy + 3, 2, 6, h2);
          R(hx + 1, hy + 4, 3, 2, h); R(hx + 5, hy + 4, 2, 3, h); R(hx + 8, hy + 4, 3, 2, h); R(hx + 11, hy + 4, 2, 3, h2); R(hx + 2, hy - 1, 6, 1, hl);
      }
    } else if (up) {
      switch (style) {
        case 'buzz': R(hx + 1, hy - 1, hw - 2, 1, h); R(hx, hy, hw, 11, h); R(hx + hw - 2, hy, 2, 11, h2); tex(hx, hy - 1, hw, 12, hl, 4, 5); break;
        case 'afro': blob(16, hy + 3, 11.5, 8.5, null, h, hl); break;
        case 'twists': blob(16, hy + 3, 9.5, 7, null, h); for (let i = hx - 1; i < hx + hw + 1; i += 2) R(i, hy - 3, 1, 12, i % 4 ? h3 : hl); break;
        case 'locs': R(hx - 1, hy - 1, hw + 2, 6, h); R(hx, hy - 2, hw, 2, h); for (let X = hx - 2; X <= hx + hw; X += 2) strand(X, hy + 3, hy + 17 - (X % 4 ? 1 : 0), X % 4 ? h : h2, h3); break;
        case 'braids': R(hx, hy - 1, hw, 12, h); for (let i = hx + 1; i < hx + hw - 1; i += 3) R(i, hy - 1, 1, 12, h3); strand(12, hy + 10, hy + 18, h, h3); strand(18, hy + 10, hy + 18, h, h3); break;
        case 'bun': R(hx, hy - 1, hw, 12, h); R(hx + hw - 2, hy, 2, 11, h2); E(16, hy - 2, 4, 3, h); R(14, hy - 4, 3, 1, hl); break;
        case 'ponytail': R(hx - 1, hy - 1, hw + 2, 13, h); R(hx, hy - 2, hw, 2, h); R(hx + hw - 2, hy, 2, 12, h2); R(15, hy + 7, 3, 2, n); for (let j = 0; j < 10; j++) R(15 + (j > 6 ? 0 : 0), hy + 9 + j, 3, 1, j % 3 ? h : h2); break;
        case 'spiky': R(hx - 1, hy - 1, hw + 2, 13, h); R(hx, hy - 2, hw, 2, h); R(hx + hw - 2, hy, 2, 12, h2); for (const X of [hx, hx + 4, hx + 8, hx + 12]) R(X, hy - 4, 2, 3, h); break;
        case 'long': R(hx - 1, hy - 1, hw + 2, 13, h); R(hx, hy - 2, hw, 2, h); R(hx + 1, hy + 12, hw - 2, 8, h); R(hx + hw - 3, hy + 12, 2, 8, h2); R(hx + hw - 2, hy, 2, 12, h2); break;
        default: R(hx - 1, hy - 1, hw + 2, 13, h); R(hx, hy - 2, hw, 2, h); R(hx, hy + 12, hw, 1, h2); R(hx + hw - 2, hy, 2, 12, h2);
      }
      if (!['afro', 'twists'].includes(style)) R(hx + 2, hy - 1, 6, 1, hl);
    } else { // side, facing right
      switch (style) {
        case 'buzz': R(hx + 1, hy - 1, hw - 3, 1, h); R(hx, hy, hw - 2, 2, h); R(hx - 1, hy + 1, 6, 8, h); R(hx + 5, hy + 2, 1, 3, h2); tex(hx - 1, hy - 1, hw - 2, 9, hl, 4, 7); break;
        case 'afro': blob(15, hy + 3, 10.5, 8.5, (i, j) => j <= hy + 4 || i < hx + 6, h, hl); break;
        case 'twists': blob(15, hy + 3, 9, 7, (i, j) => j <= hy + 3 || i < hx + 6, h); for (let i = hx - 1; i < hx + hw; i += 2) R(i, hy - 3, 1, 3, hl); break;
        case 'locs': R(hx - 1, hy - 1, hw + 1, 4, h); R(hx, hy - 2, hw - 1, 2, h); R(hx - 1, hy + 3, 6, 4, h); strand(hx + 3, hy + 3, hy + 13, h, h3); strand(hx + 1, hy + 3, hy + 16, h, h3); break;
        case 'braids': R(hx, hy - 1, hw - 1, 4, h); R(hx - 1, hy + 2, 6, 5, h); for (let i = hx; i < hx + hw - 1; i += 3) R(i, hy - 1, 3, 1, h3); break;
        case 'spiky': R(hx - 1, hy - 1, hw + 1, 5, h); R(hx, hy - 2, hw - 1, 2, h); R(hx - 1, hy + 3, 6, 8, h); for (const [X, Y] of [[hx - 3, hy], [hx - 1, hy - 4], [hx + 3, hy - 5], [hx + 7, hy - 4]]) R(X, Y, 3, 3, h); R(hx + 8, hy + 4, 3, 2, h); break;
        case 'bun': R(hx, hy - 1, hw - 1, 4, h); R(hx - 1, hy + 2, 6, 6, h); E(hx + 1, hy - 1, 3.5, 3, h); R(hx, hy - 3, 2, 1, hl); break;
        case 'ponytail': R(hx - 1, hy - 1, hw + 1, 5, h); R(hx, hy - 2, hw - 1, 2, h); R(hx - 1, hy + 3, 6, 5, h); R(hx + 8, hy + 4, 3, 2, h); R(hx - 2, hy + 3, 2, 2, n); break;
        case 'long': R(hx - 1, hy - 1, hw + 1, 5, h); R(hx, hy - 2, hw - 1, 2, h); R(hx - 1, hy + 3, 6, 10, h); R(hx + 5, hy + 4, 2, 2, h); R(hx + 8, hy + 4, 3, 2, h); break;
        default: R(hx - 1, hy - 1, hw + 1, 5, h); R(hx, hy - 2, hw - 1, 2, h); R(hx - 1, hy + 3, 6, 8, h); R(hx + 5, hy + 4, 2, 2, h); R(hx + 8, hy + 4, 3, 2, h);
      }
      if (!['afro', 'twists', 'buzz'].includes(style)) R(hx + 1, hy - 1, 6, 1, hl);
    }
  }
}

// the newborn, swaddled. cry: 0/1 animation frame
function babySprite(cry) {
  const key = 'baby' + (cry ? 1 : 0) + (G ? G.skin : '');
  if (SpriteCache[key]) return SpriteCache[key];
  const [c, x] = mkCanvas(32, 32);
  const R = (X, Y, w, h, col) => px(x, col, X, Y, w, h);
  const E = (cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  const s = (G && G.skin) || SK;
  E(16, 21, 10, 7, '#e8e0f0'); E(16, 22, 9, 6, '#c8c0e0'); R(9, 20, 14, 1, '#6a8ac8'); R(15, 23, 2, 2, '#e0b84a');
  E(16, 13, 7, 6, s); E(18, 14, 4, 4, shade(s, -0.12));
  E(16, 9, 8, 4, '#f0f0f8'); R(8, 9, 16, 2, '#f0f0f8'); R(9, 11, 2, 3, '#f0f0f8'); R(21, 11, 2, 3, '#f0f0f8');
  if (cry) { R(12, 13, 3, 1, '#1a1426'); R(17, 13, 3, 1, '#1a1426'); E(16, 17, 2, 1.6, '#6a2030'); R(11, 14, 1, 3, '#9ad0ff'); R(20, 14, 1, 3, '#9ad0ff'); }
  else { R(12, 13, 2, 2, '#1a1426'); R(18, 13, 2, 2, '#1a1426'); R(15, 16, 2, 1, shade(s, -0.3)); }
  R(11, 15, 2, 1, '#f0a0a8'); R(19, 15, 2, 1, '#f0a0a8');
  outlineSoft(c);
  SpriteCache[key] = c; return c;
}

// weapons are drawn separately so battle swings can rotate them. (x, y) is the hand.
// Every weapon item has its own look: practice gear is wood and bamboo, and each
// tier of steel, stave, axe, knife, bow and mace is visibly different.
const WEAPON_LOOK = {
  stick:      { k: 'wood', len: 12, wood: '#c8aa78', dk: '#8a6a40', wrap: '#e8e0d0' },
  shinai:     { k: 'shinai', len: 17 },
  wsword:     { k: 'wood', len: 15, wood: '#a8784a', dk: '#6a4526', guard: '#4a2e16' },
  valensword: { k: 'sword', len: 16, blade: '#dfe4ee', hi: '#ffffff', dk: '#8a94a8', guard: '#d8a840', grip: '#2e3f82', gem: '#5a8ae8', fuller: 1 },
  isword:     { k: 'sword', len: 15, blade: '#a4aab4', hi: '#ccd0d8', dk: '#62686f', guard: '#56565e', grip: '#4a2a10' },
  ssword:     { k: 'sword', len: 17, blade: '#e0e6f0', hi: '#ffffff', dk: '#8a92a0', guard: '#9a9aa8', grip: '#2a1a10', fuller: 1, cross: 1 },
  msword:     { k: 'sword', len: 17, blade: '#bfe6ff', hi: '#ffffff', dk: '#5a9ad0', guard: '#eef2fa', grip: '#3a5a8a', fuller: 1, cross: 1, glow: 'rgba(150,220,255,.45)', trail: 'rgba(150,220,255,.6)' },
  otherblade: { k: 'sword', len: 19, blade: '#2a2e3e', hi: '#6af0ff', dk: '#12141e', guard: '#f28fad', grip: '#1a1a22', core: '#6af0ff', cross: 1, glow: 'rgba(106,240,255,.5)', trail: 'rgba(106,240,255,.7)' },
  gsword1:    { k: 'sword', len: 21, w: 3, blade: '#6a6470', hi: '#9a90a8', dk: '#3e3a44', guard: '#4a3a3a', grip: '#2a1a1a', notch: 1 },
  gsword2:    { k: 'sword', len: 22, w: 3, blade: '#1e181c', hi: '#f07a2a', dk: '#0e0a0c', guard: '#3a1a1a', grip: '#1a0e0e', core: '#f07a2a', glow: 'rgba(240,122,42,.45)', trail: 'rgba(255,140,60,.7)' },
  wand:       { k: 'staff', len: 12, wood: '#e8e0d0', dk: '#a89a80', thin: 1, tip: '#fff4c0' },
  ostaff:     { k: 'staff', len: 22, wood: '#8a5a30', dk: '#5a3a1a', knob: '#6a4020' },
  valenstaff: { k: 'staff', len: 21, wood: '#4a3a5a', dk: '#2a1e36', cap: '#d8a840', gem: '#3a6ad8', glow: 'rgba(90,140,255,.45)' },
  rstaff:     { k: 'staff', len: 22, wood: '#6a3a2a', dk: '#3e1e14', cap: '#c8a040', gem: '#e5334b', glow: 'rgba(255,70,80,.45)' },
  astaff:     { k: 'staff', len: 24, wood: '#e8e4f0', dk: '#a8a0c0', cap: '#d8c8ff', gem: '#bfe6ff', moon: 1, glow: 'rgba(190,230,255,.55)' },
  otherstaff: { k: 'staff', len: 24, wood: '#1e2030', dk: '#0e0e18', cap: '#6af0ff', gem: '#ffffff', prism: 1, glow: 'rgba(242,143,173,.5)' },
  axe1:       { k: 'axe', len: 14, haft: '#6a4020', head: '#8a9098', hi: '#c0c6ce' },
  axe2:       { k: 'axe', len: 17, haft: '#4a2e16', head: '#c8ced8', hi: '#f0f4f8', dbl: 1 },
  axe3:       { k: 'hammer', len: 17, haft: '#3a2a20', head: '#5a5a6a', hi: '#8a8a9a', rune: '#6af0ff', glow: 'rgba(106,240,255,.4)' },
  dagger1:    { k: 'dagger', len: 6, blade: '#b0b4bc', hi: '#d8dce4', guard: '#5a4a3a', grip: '#3a2210' },
  dagger2:    { k: 'dagger', len: 9, w: 1, blade: '#e8ecf4', hi: '#ffffff', guard: '#c8a040', grip: '#1a1a22' },
  dagger3:    { k: 'dagger', len: 8, blade: '#3a2a4a', hi: '#b04aff', guard: '#1a1022', grip: '#1a1022', glow: 'rgba(176,74,255,.45)', trail: 'rgba(176,74,255,.6)' },
  bow1:       { k: 'bow', r: 9, wood: '#8a5a2a', string: '#e8e0d0' },
  bow2:       { k: 'bow', r: 12, wood: '#5a3a1a', string: '#e8e0d0', grip: '#8a2a2a' },
  bow3:       { k: 'bow', r: 12, wood: '#d8dce8', string: '#bfffd8', grip: '#3a8a5a', glow: 'rgba(160,255,200,.4)' },
  mace1:      { k: 'mace', len: 12, haft: '#6a4a2a', head: '#8a8a94', hi: '#c0c0cc' },
  mace2:      { k: 'mace', len: 13, haft: '#8a5a2a', head: '#e8c860', hi: '#fff0b0', glow: 'rgba(255,220,120,.35)' },
  mace3:      { k: 'flail', len: 10, haft: '#6a4a2a', head: '#ffcc50', hi: '#fff4c0', glow: 'rgba(255,200,80,.6)', trail: 'rgba(255,200,80,.6)' }
};
function weaponLook(id, kind) { return WEAPON_LOOK[id] || WEAPON_LOOK[{ staff: 'ostaff', axe: 'axe1', dagger: 'dagger1', bow: 'bow1', mace: 'mace1', greatsword: 'gsword1' }[kind] || 'isword']; }
function drawWeapon(kind, x, y, ang, sc, flip, id) {
  const L = weaponLook(id, kind);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (flip) ctx.scale(-1, 1); ctx.scale(sc, sc);
  const R = (X, Y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(X, Y, w, h); };
  const O = (X, Y, w, h) => R(X - 0.7, Y - 0.7, w + 1.4, h + 1.4, UI.ink);
  const GL = (X, Y, w, h) => { if (!L.glow) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; R(X - 2, Y - 2, w + 4, h + 4, L.glow); R(X - 1, Y - 1, w + 2, h + 2, L.glow); ctx.restore(); };
  const n = L.len || 15;
  switch (L.k) {
    case 'shinai': // four bamboo slats, leather tip, round tsuba, long white grip
      O(-1, -n, 2, n + 6);
      R(-1, -n, 2, n, '#e8d49a'); R(-1, -n, 1, n, '#f8ecc0'); for (let i = -n + 3; i < 0; i += 4) R(-1, i, 2, 1, '#c8b070');
      R(-1, -n, 2, 2, '#6a3a1e'); R(-1, -n + 6, 2, 1, '#6a3a1e');
      O(-2.5, 0, 5, 1.4); R(-2.5, 0, 5, 1.4, '#2a1a10');
      R(-1, 1.4, 2, 5, '#f4f0e8'); R(-1, 1.4, 1, 5, '#ffffff'); R(-1, 6, 2, 0.8, '#6a3a1e');
      break;
    case 'wood': // bokken / stick: one piece of wood, no steel
      O(-1, -n, 2, n + 5);
      R(-1, -n, 2, n + 5, L.wood); R(-1, -n, 1, n + 5, shade(L.wood, 0.2)); R(0, -n + 2, 1, n - 2, L.dk);
      R(-0.5, -n - 0.6, 1, 0.8, shade(L.wood, 0.25));
      if (L.guard) { O(-2.5, 0, 5, 1.2); R(-2.5, 0, 5, 1.2, L.guard); }
      if (L.wrap) R(-1, 1, 2, 3, L.wrap);
      break;
    case 'sword': {
      const w = L.w || 2;
      GL(-w / 2, -n, w, n);
      O(-w / 2, -n, w, n); R(-w / 2, -n, w, n, L.blade); R(-w / 2, -n, 1, n, L.hi); R(w / 2 - 0.6, -n, 0.6, n, L.dk);
      R(-0.5, -n - 1, 1, 1, L.hi);                                            // point
      if (L.fuller) R(-0.2, -n + 3, 0.5, n - 5, L.dk);
      if (L.core) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; R(-0.3, -n + 1, 0.8, n - 2, L.core); ctx.restore(); }
      if (L.notch) { R(w / 2 - 1, -n + 5, 1, 1, UI.ink); R(-w / 2, -n + 9, 1, 1, UI.ink); }
      const gw = L.cross ? 9 : 7;
      O(-gw / 2, 0, gw, 1.6); R(-gw / 2, 0, gw, 1.6, L.guard); R(-gw / 2, 0, gw, 0.6, shade(L.guard, 0.3));
      if (L.cross) { R(-gw / 2 - 0.6, -0.6, 1.2, 2.8, L.guard); R(gw / 2 - 0.6, -0.6, 1.2, 2.8, L.guard); }
      O(-1, 1.6, 2, 4); R(-1, 1.6, 2, 4, L.grip); R(-1, 2.4, 2, 0.5, shade(L.grip, 0.3)); R(-1, 4, 2, 0.5, shade(L.grip, 0.3));
      O(-1.2, 5.6, 2.4, 1.4); R(-1.2, 5.6, 2.4, 1.4, L.gem || L.guard);
      if (L.gem) R(-0.4, 5.8, 0.8, 0.6, '#ffffff');
      break;
    }
    case 'staff': {
      const w = L.thin ? 1.2 : 2;
      O(-w / 2, -n, w, n + 8); R(-w / 2, -n, w, n + 8, L.wood); R(-w / 2, -n, w / 2, n + 8, shade(L.wood, 0.18)); R(w / 2 - 0.5, -n, 0.5, n + 8, L.dk);
      if (L.knob) { O(-2, -n - 3, 4, 4); R(-2, -n - 3, 4, 4, L.knob); R(-2, -n - 3, 2, 1, shade(L.knob, 0.3)); }
      if (L.tip) { R(-0.6, -n - 1.4, 1.2, 1.4, L.tip); }
      if (L.cap) { O(-2, -n - 1, 4, 1.6); R(-2, -n - 1, 4, 1.6, L.cap); R(-1.5, 3, 3, 1, L.cap); }
      if (L.moon) { ctx.strokeStyle = UI.ink; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, -n - 6, 4.5, 0.4, Math.PI - 0.4, true); ctx.stroke(); ctx.strokeStyle = L.cap; ctx.lineWidth = 1.2; ctx.stroke(); }
      if (L.gem) {
        const gy = L.moon ? -n - 7.5 : -n - 5;
        if (L.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = L.glow; ctx.beginPath(); ctx.arc(0, gy + 2, 6, 0, 7); ctx.fill(); ctx.restore(); }
        if (L.prism) { ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.moveTo(0, gy - 3); ctx.lineTo(3.4, gy + 2); ctx.lineTo(0, gy + 5); ctx.lineTo(-3.4, gy + 2); ctx.fill();
          const hue = (TIME * 90) % 360; ctx.fillStyle = `hsl(${hue},90%,80%)`; ctx.beginPath(); ctx.moveTo(0, gy - 2); ctx.lineTo(2.4, gy + 2); ctx.lineTo(0, gy + 4); ctx.lineTo(-2.4, gy + 2); ctx.fill(); R(-0.6, gy - 0.5, 1, 1.5, '#ffffff'); }
        else { O(-2, gy, 4, 4); R(-2, gy, 4, 4, L.gem); R(-1.4, gy + 0.6, 1.4, 1.4, '#ffffff'); R(0.6, gy + 2.6, 1.4, 1.4, shade(L.gem, -0.3)); }
      }
      break;
    }
    case 'axe': case 'hammer': {
      O(-1, -n, 2, n + 5); R(-1, -n, 2, n + 5, L.haft); R(-1, -n, 1, n + 5, shade(L.haft, 0.2)); R(-1, 1, 2, 1, shade(L.haft, -0.3));
      if (L.k === 'hammer') {
        GL(-5, -n - 2, 10, 6);
        O(-5, -n - 2, 10, 6); R(-5, -n - 2, 10, 6, L.head); R(-5, -n - 2, 10, 1.4, L.hi); R(-5, -n + 3, 10, 1, shade(L.head, -0.3));
        if (L.rune) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const on = 0.6 + Math.sin(TIME * 5) * 0.4; ctx.globalAlpha = on; R(-3.5, -n, 1, 2, L.rune); R(-0.5, -n - 0.5, 1, 3, L.rune); R(2.5, -n, 1, 2, L.rune); ctx.restore(); }
      } else {
        const bit = (s) => { ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.moveTo(s * 0.6, -n + 0.5); ctx.lineTo(s * 7.5, -n - 3); ctx.lineTo(s * 7.5, -n + 7); ctx.lineTo(s * 0.6, -n + 4.5); ctx.fill();
          ctx.fillStyle = L.head; ctx.beginPath(); ctx.moveTo(s * 1, -n + 1.2); ctx.lineTo(s * 6.8, -n - 1.8); ctx.lineTo(s * 6.8, -n + 5.8); ctx.lineTo(s * 1, -n + 3.8); ctx.fill();
          R(s > 0 ? 5.6 : -6.8, -n - 1.8, 1.2, 7.6, L.hi); };
        bit(1); if (L.dbl) bit(-1);
      }
      break;
    }
    case 'dagger': {
      const w = L.w || 2;
      GL(-w / 2, -n, w, n);
      O(-w / 2, -n, w, n); R(-w / 2, -n, w, n, L.blade); R(-w / 2, -n, Math.min(1, w), n, L.hi); R(-0.5, -n - 1, 1, 1, L.hi);
      O(-2, 0, 4, 1); R(-2, 0, 4, 1, L.guard); O(-1, 1, 2, 3); R(-1, 1, 2, 3, L.grip);
      break;
    }
    case 'bow': {
      const r = L.r || 9;
      if (L.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = L.glow; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-4, 0, r, -1.2, 1.2); ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = UI.ink; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.arc(-4, 0, r, -1.2, 1.2); ctx.stroke();
      ctx.strokeStyle = L.wood; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-4, 0, r, -1.2, 1.2); ctx.stroke();
      ctx.strokeStyle = shade(L.wood, 0.3); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(-4.4, 0, r, -1.1, 1.1); ctx.stroke();
      const ey = Math.sin(1.2) * r, ex = -4 + Math.cos(1.2) * r;
      ctx.strokeStyle = L.string; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(ex, -ey); ctx.lineTo(ex, ey); ctx.stroke();
      if (L.grip) R(r - 5.2, -1.5, 1.6, 3, L.grip);
      break;
    }
    case 'mace': case 'flail': {
      O(-1, -n, 2, n + 5); R(-1, -n, 2, n + 5, L.haft); R(-1, -n, 1, n + 5, shade(L.haft, 0.2));
      let hx = 0, hy = -n - 3;
      if (L.k === 'flail') { const sw = Math.sin(TIME * 6) * 3; hx = sw; hy = -n - 7; ctx.strokeStyle = '#8a8a94'; ctx.lineWidth = 0.9; ctx.setLineDash([1, 0.8]); ctx.beginPath(); ctx.moveTo(0, -n); ctx.lineTo(hx, hy); ctx.stroke(); ctx.setLineDash([]); }
      if (L.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = L.glow; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.arc(hx, hy, 4, 0, 7); ctx.fill();
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; R(hx + Math.cos(a) * 4.2 - 0.8, hy + Math.sin(a) * 4.2 - 0.8, 1.6, 1.6, UI.ink); R(hx + Math.cos(a) * 4 - 0.5, hy + Math.sin(a) * 4 - 0.5, 1, 1, L.hi); }
      ctx.fillStyle = L.head; ctx.beginPath(); ctx.arc(hx, hy, 3.2, 0, 7); ctx.fill();
      R(hx - 1.6, hy - 1.8, 1.4, 1.2, L.hi);
      break;
    }
  }
  ctx.restore();
  return L;
}

// ---------------------------------------------------------------- monsters
const MONSTERS = {
  slime:  { type: 'slime', g: '#6ccf5a', d: '#2f7f36', w: '#e8ffe0' },
  bslime: { type: 'slime', g: '#6ab8f0', d: '#2e6aa8', w: '#e8f6ff' },
  rslime: { type: 'slime', g: '#f0703a', d: '#9a2e14', w: '#ffe8a0', glow: '#ffb040' },
  bat:    { type: 'bat',   g: '#6e52a0', d: '#3e2a66', r: '#ff5050' },
  cavebat:{ type: 'bat',   g: '#3a6a9a', d: '#1e3a5e', r: '#ffe050' },
  imp:    { type: 'imp',   g: '#a8384a', d: '#62182a', r: '#ffe050', n: '#e8d8c0' },
  wolf:   { type: 'wolf',  g: '#9aa0aa', d: '#5a606a', r: '#ffd050' },
  swolf:  { type: 'wolf',  g: '#3a2f4a', d: '#1a1428', r: '#ff3050', glow: '#8a40ff' },
  golem:  { type: 'golem', g: '#8a8478', d: '#4e4a40', r: '#6af0ff' },
  spider: { type: 'spider', g: '#5a4a3a', d: '#2e241c', r: '#e5534b' },
  wisp:   { type: 'wisp',  g: '#bfe6ff', d: '#6a8ac8', r: '#ffffff' },
  treant: { type: 'treant', g: '#4a7a3a', d: '#4a3220', r: '#f2c94c' }
};
function monsterSprite(id, flip, res = 48) {
  const key = 'mon_' + id + (flip ? 'f' : '') + res;
  if (SpriteCache[key]) return SpriteCache[key];
  const m = MONSTERS[id];
  const S = 48;
  const [c, x] = mkCanvas(S, S);
  const E = (cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  const Pl = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); };
  if (m.type === 'slime') {
    const gr = x.createLinearGradient(0, 14, 0, 46); gr.addColorStop(0, shade(m.g, 0.15)); gr.addColorStop(1, m.d);
    x.fillStyle = gr; x.beginPath(); x.moveTo(4, 44); x.quadraticCurveTo(2, 20, 24, 12); x.quadraticCurveTo(46, 20, 44, 44); x.closePath(); x.fill();
    E(24, 44, 20, 3, shade(m.d, -0.2));
    E(15, 22, 6, 4, 'rgba(255,255,255,.7)'); E(12, 20, 2, 2, '#fff');
    E(17, 30, 3, 4, '#1a1426'); E(31, 30, 3, 4, '#1a1426'); E(16, 29, 1, 1.2, '#fff'); E(30, 29, 1, 1.2, '#fff');
    if (m.glow) { E(24, 38, 8, 3, m.glow); }
  } else if (m.type === 'bat' || m.type === 'imp') {
    Pl([24, 22, 2, 10, 6, 20, 2, 28, 12, 26, 16, 32, 24, 28], m.d);
    Pl([24, 22, 46, 10, 42, 20, 46, 28, 36, 26, 32, 32, 24, 28], m.d);
    x.strokeStyle = shade(m.d, -0.3); x.lineWidth = 1;
    x.beginPath(); x.moveTo(24, 22); x.lineTo(6, 20); x.moveTo(24, 22); x.lineTo(12, 26); x.moveTo(24, 22); x.lineTo(42, 20); x.moveTo(24, 22); x.lineTo(36, 26); x.stroke();
    E(24, 26, 8, 9, m.g); E(24, 30, 6, 5, shade(m.g, -0.15));
    if (m.type === 'imp') { Pl([18, 18, 16, 8, 21, 17], m.n); Pl([30, 18, 32, 8, 27, 17], m.n); Pl([24, 34, 26, 44, 30, 46, 27, 40], m.d); }
    else { Pl([18, 20, 17, 13, 21, 18], m.g); Pl([30, 20, 31, 13, 27, 18], m.g); }
    E(21, 24, 1.8, 1.8, m.r); E(27, 24, 1.8, 1.8, m.r);
    Pl([22, 29, 23, 32, 24, 29], '#fff'); Pl([24, 29, 25, 32, 26, 29], '#fff');
  } else if (m.type === 'wolf') {
    Pl([8, 26, 2, 20, 4, 30], m.d);                                   // tail
    E(22, 28, 15, 8, m.g); E(22, 32, 13, 4, m.d);                     // body
    for (const lx of [11, 17, 27, 33]) { x.fillStyle = lx < 20 ? m.d : m.g; x.fillRect(lx, 32, 4, 12); x.fillStyle = shade(m.d, -0.3); x.fillRect(lx, 42, 5, 2); }
    E(37, 20, 8, 7, m.g); Pl([40, 20, 47, 23, 46, 26, 38, 26], shade(m.g, -0.05)); // head + snout
    Pl([33, 15, 34, 7, 37, 14], m.g); Pl([37, 14, 40, 7, 41, 15], m.g); Pl([34, 14, 35, 10, 36, 14], shade(m.d, -0.2));
    E(46, 23, 1.5, 1.5, '#1a1426'); E(39, 19, 1.8, 1.4, m.r);
    x.strokeStyle = m.d; x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(14 + i * 5, 22); x.lineTo(16 + i * 5, 25); } x.stroke();
    if (m.glow) { x.globalAlpha = 0.5; E(22, 26, 10, 4, m.glow); x.globalAlpha = 1; }
  } else if (m.type === 'golem') {
    const rock = (X, Y, w, h, col) => { px(x, col, X, Y, w, h); px(x, shade(col, 0.15), X, Y, w, 2); px(x, shade(col, -0.25), X, Y + h - 2, w, 2); };
    rock(14, 4, 20, 14, m.g);
    rock(8, 18, 32, 16, m.g);
    rock(2, 18, 8, 18, m.d); rock(38, 18, 8, 18, m.d);
    rock(12, 34, 9, 12, m.d); rock(27, 34, 9, 12, m.d);
    px(x, m.r, 18, 9, 4, 3); px(x, m.r, 26, 9, 4, 3);
    px(x, m.r, 22, 22, 4, 2); px(x, m.r, 20, 24, 8, 2); px(x, m.r, 22, 26, 4, 4);
    x.strokeStyle = shade(m.d, -0.3); x.beginPath(); x.moveTo(12, 20); x.lineTo(16, 28); x.lineTo(13, 32); x.moveTo(34, 20); x.lineTo(31, 27); x.stroke();
  }
  else if (m.type === 'spider') {
    E(24, 30, 11, 8, m.d); E(24, 28, 10, 7, m.g); E(24, 20, 7, 6, m.g);
    x.strokeStyle = m.d; x.lineWidth = 2;
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(24 + s * 6, 26 + i * 2); x.lineTo(24 + s * (14 + i * 2), 20 + i * 4); x.lineTo(24 + s * (18 + i * 2), 36 + i * 2); x.stroke(); }
    x.lineWidth = 1;
    for (let i = 0; i < 3; i++) E(20 + i * 4, 17, 1.3, 1.3, m.r); E(22, 21, 1.6, 1.6, m.r); E(26, 21, 1.6, 1.6, m.r);
    E(24, 30, 4, 3, shade(m.g, 0.2)); px(x, '#e8e0d0', 21, 24, 2, 3); px(x, '#e8e0d0', 25, 24, 2, 3);
  } else if (m.type === 'wisp') {
    const gr = x.createRadialGradient(24, 26, 2, 24, 26, 18); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, m.g); gr.addColorStop(1, 'rgba(106,138,200,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(24, 6); x.quadraticCurveTo(40, 22, 36, 34); x.quadraticCurveTo(30, 46, 24, 38); x.quadraticCurveTo(18, 46, 12, 34); x.quadraticCurveTo(8, 22, 24, 6); x.fill();
    E(20, 26, 2, 3, '#2a3a6a'); E(28, 26, 2, 3, '#2a3a6a'); E(24, 32, 2, 1.5, '#2a3a6a');
  } else if (m.type === 'treant') {
    px(x, m.d, 16, 18, 16, 28); px(x, shade(m.d, 0.2), 17, 18, 4, 28); px(x, shade(m.d, -0.3), 28, 18, 4, 28);
    x.strokeStyle = m.d; x.lineWidth = 4; x.beginPath(); x.moveTo(16, 24); x.lineTo(4, 16); x.lineTo(2, 8); x.moveTo(32, 24); x.lineTo(44, 18); x.lineTo(46, 10); x.moveTo(18, 44); x.lineTo(10, 47); x.moveTo(30, 44); x.lineTo(38, 47); x.stroke(); x.lineWidth = 1;
    E(24, 12, 16, 10, shade(m.g, -0.2)); E(18, 10, 9, 7, m.g); E(31, 9, 8, 6, m.g); E(24, 6, 7, 5, shade(m.g, 0.25));
    px(x, '#1a1008', 19, 26, 4, 3); px(x, '#1a1008', 26, 26, 4, 3); px(x, m.r, 20, 27, 2, 1); px(x, m.r, 27, 27, 2, 1); px(x, '#1a1008', 20, 34, 9, 3);
  }
  // texture: fur / stone / goo grain, then lighting
  { const rr = rng(id.length * 91 + 7), d = x.getImageData(0, 0, S, S), p = d.data;
    const grain = m.type === 'slime' || m.type === 'wisp' ? 0 : m.type === 'golem' ? 0.14 : 0.09;
    if (grain) for (let i = 0; i < p.length; i += 4) if (p[i + 3] > 110 && rr() < 0.22) { const k = 1 + (rr() - 0.5) * grain * 2; p[i] *= k; p[i + 1] *= k; p[i + 2] *= k; }
    x.putImageData(d, 0, 0); }
  outline(c);
  shadeSprite(c, 1.1);
  if (m.type === 'slime') { x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(11, 18, 3, 2); x.fillRect(10, 20, 2, 3); x.fillRect(36, 34, 2, 2); }
  let out = c;
  if (res !== S) { const [r, rx] = mkCanvas(res, res); rx.imageSmoothingEnabled = false; rx.drawImage(c, 0, 0, res, res); out = r; }
  if (flip) out = flipped(out);
  SpriteCache[key] = out;
  return out;
}

// ---------------------------------------------------------------- tiles
// solid (blocks movement). Z = the boss door (opens after the final battle)
const SOLID = new Set('T~RWDQFSNOrXL#PHZVyCbhetzkAJIUvgiqlw12357789+[]046*^@<>!?{}$EMGn()|/£'.split(''));
// doors you walk INTO (the warp fires when you bump them, so you never stand on top of a door)
const DOOR_TILES = new Set(['E', ']', 'M', 'G', 'n']);
const ANIMATED = new Set(['~', 'L', 'O', 'z', 'I', 'l', 'v', '6', '^', '!', '|']);
const TALL = new Set('RWDE#VyJIUw58gin9b+[]M'.split(''));   // building fronts that cast a soft shadow on the tile below (trees and rocks draw their own)
const GRASSY = new Set('.,fQFSNOTX2q7%&04>?"'.split(''));
const THEME_GROUND = { grass: '#5ea84a', night: '#5ea84a', town: '#8f8a80', city: '#9a948a', cave: '#4a3a30', ash: '#5a5055', castle: '#2a2238', tokyo: '#6a6470', interior: '#7a5a3a' };

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function speckle(x, r, base, cols, n, sz = 2) {
  px(x, base, 0, 0, 32, 32);
  for (let i = 0; i < n; i++) px(x, cols[Math.floor(r() * cols.length)], Math.floor(r() * 16) * 2, Math.floor(r() * 16) * 2, sz, sz);
}
// soft dithered patch of colour (stays inside the tile so neighbours never show a seam)
function ditherBlob(x, r, col, n, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    const rad = rmin + r() * (rmax - rmin), cx = rad + 1 + r() * (30 - rad * 2), cy = rad + 1 + r() * (30 - rad * 2);
    for (let yy = -rad; yy <= rad; yy++) for (let xx = -rad; xx <= rad; xx++) {
      const d = (xx * xx + yy * yy) / (rad * rad); if (d > 1) continue;
      const X = Math.floor(cx + xx), Y = Math.floor(cy + yy);
      if (d > 0.5 && (X + Y) & 1) continue;
      px(x, col, X, Y, 1, 1);
    }
  }
}
function grassTuft(x, a, b, dk, md, lt) {
  px(x, dk, a, b - 1, 1, 2); px(x, md, a - 1, b - 3, 1, 3); px(x, md, a + 1, b - 3, 1, 3);
  px(x, lt, a - 1, b - 4, 1, 1); px(x, lt, a + 1, b - 4, 1, 1); px(x, md, a, b - 4, 1, 3); px(x, lt, a, b - 5, 1, 1);
}
function grassBase(x, r, theme) {
  if (theme === 'ash') {
    px(x, '#5a5055', 0, 0, 32, 32); ditherBlob(x, r, '#4e454b', 3, 4, 8); ditherBlob(x, r, '#655b60', 2, 3, 6);
    for (let i = 0; i < 40; i++) px(x, r() > 0.5 ? '#6a6065' : '#433b40', Math.floor(r() * 32), Math.floor(r() * 32), 1, 1);
    for (let i = 0; i < 3; i++) { const a = 3 + Math.floor(r() * 26), b = 3 + Math.floor(r() * 26); px(x, '#3a3236', a, b, 3, 2); px(x, '#7a7075', a, b, 2, 1); }
    return;
  }
  const P = theme === 'tokyo' ? ['#3a6232', '#436e3a', '#4e7a44', '#5a8a4e', '#6a9a5a'] : ['#438c36', '#4f9d41', '#5bad4a', '#69bb55', '#7ecb66'];
  px(x, P[2], 0, 0, 32, 32);
  ditherBlob(x, r, P[1], 3, 4, 9);
  ditherBlob(x, r, P[3], 3, 3, 7);
  for (let i = 0; i < 70; i++) px(x, r() > 0.55 ? P[4] : P[0], Math.floor(r() * 32), Math.floor(r() * 32), 1, 1);
  for (let i = 0; i < 7; i++) grassTuft(x, 2 + Math.floor(r() * 28), 6 + Math.floor(r() * 25), P[0], P[1], P[4]);
  if (r() < 0.35) { const a = 4 + Math.floor(r() * 24), b = 4 + Math.floor(r() * 24); px(x, '#8a8478', a, b, 2, 2); px(x, '#b0aa9c', a, b, 1, 1); px(x, P[0], a, b + 2, 2, 1); }
  if (r() < 0.3 && theme !== 'tokyo') { const a = 4 + Math.floor(r() * 24), b = 4 + Math.floor(r() * 24); px(x, '#ffffff', a, b, 1, 1); px(x, '#fff3a0', a + 3, b + 2, 1, 1); }
}
// natural stone paving: rows of irregular stones with lit tops and dark joints
function cobbles(x, r, base, joint, rowH = 8) {
  px(x, joint, 0, 0, 32, 32);
  for (let y = 0; y < 32; y += rowH) {
    let X = -Math.floor(r() * 6);
    while (X < 32) {
      const w = 6 + Math.floor(r() * 6), col = shade(base, (r() - 0.5) * 0.16);
      const x0 = Math.max(0, X + 1), x1 = Math.min(32, X + w);
      if (x1 > x0) {
        px(x, col, x0, y + 1, x1 - x0, rowH - 2);
        px(x, shade(col, 0.2), x0, y + 1, x1 - x0, 1); px(x, shade(col, 0.12), x0, y + 1, 1, rowH - 2);
        px(x, shade(col, -0.2), x0, y + rowH - 2, x1 - x0, 1);
        if (r() < 0.3) px(x, shade(col, -0.1), x0 + 2, y + 3, 2, 1);
      }
      X += w;
    }
  }
}
function pebbles(x, r, col, n) {
  for (let i = 0; i < n; i++) {
    const a = 2 + Math.floor(r() * 27), b = 2 + Math.floor(r() * 27), w = r() < 0.5 ? 2 : 3;
    px(x, shade(col, -0.35), a + 1, b + 1, w, 2); px(x, col, a, b, w, 2); px(x, shade(col, 0.3), a, b, 1, 1);
  }
}
// mask bits: 1 up, 2 right, 4 down, 8 left (set when that neighbour is "different")
function drawTile(x, ch, theme, v, frame, mask, up, under) {
  const r = rng(v * 977 + ch.charCodeAt(0) * 131 + frame * 7 + 1);
  const G_ = () => under ? drawTile(x, under, theme, v, 0, 0, '') : grassBase(x, r, theme);
  // soft contact shadow under building fronts, consistent across walls, windows and doors
  const shadowTop = () => { if (TALL.has(up)) { const g = x.createLinearGradient(0, 0, 0, 9); g.addColorStop(0, 'rgba(20,12,30,.30)'); g.addColorStop(1, 'rgba(20,12,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 9); } };
  switch (ch) {
    // ------------------------------------------------ ground
    case '.': G_(); if (v === 0) { px(x, '#8ad870', 8, 10, 2, 2); px(x, '#8ad870', 22, 20, 2, 2); } shadowTop(); break;
    case ',': G_(); for (let i = 0; i < 9; i++) { const a = Math.floor(r() * 28) + 1, b = Math.floor(r() * 18) + 10; px(x, '#2f7428', a, b - 5, 2, 7); px(x, '#46963a', a + 1, b - 6, 1, 5); px(x, '#84d068', a, b - 7, 1, 2); } shadowTop(); break;
    case 'f': G_(); for (const [c, a, b] of [['#f28fad', 6, 8], ['#fff3a0', 22, 12], ['#f28fad', 13, 22], ['#ffffff', 26, 26], ['#a8c8ff', 4, 26]]) { px(x, c, a - 2, b, 5, 1); px(x, c, a, b - 2, 1, 5); px(x, c, a - 1, b - 1, 3, 3); px(x, '#ffd84a', a, b, 1, 1); px(x, '#2f7428', a, b + 3, 1, 3); } shadowTop(); break;
    case '=': case 'd': case 's': case 'j': {
      const base = ch === '=' ? '#c4a468' : ch === 'd' ? '#3e3438' : ch === 's' ? '#a8a49c' : '#9c96a0';
      if (ch === 's') cobbles(x, r, '#b0aca2', '#7a766c');
      else if (ch === 'j') cobbles(x, r, '#a29ca6', '#6c6670', 16);
      else {
        const cols = ch === '=' ? ['#b4945a', '#d4b47a', '#a8884a', '#bc9c62'] : ['#4a3f44', '#2f2729', '#554a50'];
        px(x, base, 0, 0, 32, 32);
        ditherBlob(x, r, shade(base, -0.07), 2, 4, 8); ditherBlob(x, r, shade(base, 0.06), 2, 3, 6);
        for (let i = 0; i < 60; i++) px(x, cols[Math.floor(r() * cols.length)], Math.floor(r() * 32), Math.floor(r() * 32), 1, 1);
        pebbles(x, r, ch === '=' ? '#d8c49a' : '#6a5f64', 4);
        if (ch === '=' && !(mask & 10)) { px(x, shade(base, -0.1), 9, 0, 1, 32); px(x, shade(base, -0.1), 22, 0, 1, 32); }
        if (ch === '=' && !(mask & 5) && (mask & 10) !== 10) { px(x, shade(base, -0.1), 0, 9, 32, 1); px(x, shade(base, -0.1), 0, 22, 32, 1); }
      }
      if (ch === '=' || ch === 'd') { // grass creeping over the path edge
        const gc = theme === 'ash' || ch === 'd' ? '#5a5055' : '#5ea84a', gd = shade(gc, -0.18), gl = shade(gc, 0.18);
        const fringe = (horiz, at) => {
          for (let i = 0; i < 32; i++) {
            const d = 2 + Math.floor(r() * 3) + (i % 5 === 0 ? 2 : 0);
            if (horiz) { px(x, gc, i, at ? 32 - d : 0, 1, d); px(x, gd, i, at ? 32 - d : d - 1, 1, 1); if (i % 5 === 0) px(x, gl, i, at ? 32 - d : 0, 1, 1); }
            else { px(x, gc, at ? 32 - d : 0, i, d, 1); px(x, gd, at ? 32 - d : d - 1, i, 1, 1); }
          }
        };
        if (mask & 1) fringe(true, 0); if (mask & 4) fringe(true, 1); if (mask & 8) fringe(false, 0); if (mask & 2) fringe(false, 1);
      }
      shadowTop(); break;
    }
    case '_': cobbles(x, r, '#96918a', '#65605a'); for (let i = 0; i < 3; i++) px(x, '#5a7a3a', Math.floor(r() * 30), Math.floor(r() * 4) * 8, 2, 1); shadowTop(); break;
    case 'c': speckle(x, r, '#54423a', ['#4a3a32', '#62503f', '#44362c', '#5a4a3c'], 44); if (v === 2) { px(x, '#6a5848', 10, 14, 4, 3); px(x, '#3a2c24', 10, 17, 4, 1); } shadowTop(); break;
    case 'a': speckle(x, r, '#5a5055', ['#4a4045', '#6a6065', '#554a50', '#62585c'], 44); if (v === 1) { x.strokeStyle = '#e5534b'; x.globalAlpha = 0.6 + frame * 0; x.beginPath(); x.moveTo(6, 20); x.lineTo(12, 18); x.lineTo(16, 22); x.stroke(); x.globalAlpha = 1; } shadowTop(); break;
    case 'p': px(x, '#342a48', 0, 0, 32, 32); px(x, '#2a2240', 0, 0, 32, 1); px(x, '#2a2240', 0, 0, 1, 32); px(x, '#3e3456', 1, 1, 14, 14); px(x, '#3e3456', 17, 17, 14, 14); px(x, '#463c60', 2, 2, 6, 1); shadowTop(); break;
    case 'K': px(x, '#6a1426', 0, 0, 32, 32); px(x, '#8a2234', 3, 0, 26, 32); px(x, '#d8a840', 1, 0, 1, 32); px(x, '#d8a840', 30, 0, 1, 32); for (let j = 4; j < 32; j += 10) { px(x, '#a8324a', 12, j, 8, 2); px(x, '#a8324a', 15, j - 2, 2, 6); } shadowTop(); break;
    case 'M': speckle(x, r, '#8f8a80', ['#7f7a70'], 20); px(x, '#6a4526', 0, 0, 32, 5); px(x, '#6a4526', 0, 0, 4, 32); px(x, '#6a4526', 28, 0, 4, 32); px(x, '#8a5a32', 0, 0, 32, 2); { const g = x.createLinearGradient(0, 5, 0, 32); g.addColorStop(0, '#050304'); g.addColorStop(1, '#241a16'); x.fillStyle = g; x.fillRect(4, 5, 24, 27); } break;
    case 'G': px(x, '#2e2440', 0, 0, 32, 32); { const g = x.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, '#0a0610'); g.addColorStop(1, '#2a1030'); x.fillStyle = g; x.fillRect(4, 4, 24, 28); } px(x, '#6a1020', 4, 4, 24, 2); px(x, '#6a1020', 4, 4, 2, 28); px(x, '#6a1020', 26, 4, 2, 28); break;
    // ------------------------------------------------ nature
    case 'T': case 'q': {
      G_();
      const sak = ch === 'q';
      const E = (cx, cy, rr, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); };
      x.fillStyle = 'rgba(10,20,10,.32)'; x.beginPath(); x.ellipse(16, 28, 12, 3.5, 0, 0, 7); x.fill();
      px(x, '#5a3a20', 13, 17, 6, 11); px(x, '#3e2814', 17, 17, 2, 11); px(x, '#7a5230', 14, 18, 1, 9); px(x, '#5a3a20', 11, 26, 3, 2); px(x, '#4a2e18', 18, 26, 3, 2);
      const [c0, c1, c2, c3] = sak ? ['#9a4060', '#c8607e', '#e48aa8', '#f6bcd0'] : v % 2 ? ['#15452a', '#24602a', '#327a34', '#5aa84e'] : ['#123e24', '#1f5a28', '#2f7430', '#4f9a44'];
      px(x, '#2e1c0e', 14, 24, 1, 3); px(x, '#8a5a34', 15, 19, 1, 6);          // bark lines
      E(16, 14, 13.5, '#0c2616'); E(7.5, 17, 7.5, '#0c2616'); E(24.5, 17, 7.5, '#0c2616');   // dark rim
      E(16, 13, 13, c0); E(8, 16, 7, c0); E(24, 16, 7, c0);
      // leaf clumps: lighter toward the top-left where the sun is
      for (let i = 0; i < 34; i++) {
        const a = r() * 6.283, d = Math.sqrt(r()) * 11, cx = 16 + Math.cos(a) * d * 1.1, cy = 12 + Math.sin(a) * d * 0.85;
        const lit = (22 - cx) * 0.6 + (18 - cy);
        const col = lit > 14 ? c3 : lit > 7 ? c2 : lit > 0 ? c1 : c0;
        E(cx, cy, 2.2 + r() * 1.8, col);
        if (lit > 4) px(x, shade(col, 0.18), Math.floor(cx - 1), Math.floor(cy - 2), 2, 1);
      }
      for (let i = 0; i < 22; i++) { const a = 5 + Math.floor(r() * 22), b = 3 + Math.floor(r() * 19); px(x, r() > 0.55 ? shade(c3, 0.15) : c0, a, b, 1, 1); }
      px(x, shade(c3, 0.35), 10, 3, 3, 1); px(x, shade(c3, 0.25), 8, 5, 2, 1);
      if (!sak && v === 3 && r() < 0.5) { for (const [a, b] of [[10, 12], [20, 9], [15, 17]]) { px(x, '#d8303a', a, b, 2, 2); px(x, '#ff9a90', a, b, 1, 1); } }
      if (sak) for (let i = 0; i < 5; i++) px(x, '#fff0f4', 6 + Math.floor(r() * 20), 4 + Math.floor(r() * 16), 2, 2);
      break;
    }
    case 'X': { speckle(x, r, '#5a5055', ['#4a4045', '#62585c'], 30); x.strokeStyle = '#1e1618'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(16, 31); x.lineTo(16, 12); x.lineTo(9, 5); x.moveTo(16, 16); x.lineTo(24, 8); x.lineTo(26, 3); x.moveTo(16, 21); x.lineTo(8, 16); x.stroke(); x.lineWidth = 1; break; }
    case '~': {
      const g = x.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, '#3a7ad0'); g.addColorStop(1, '#2a5aa8'); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
      ditherBlob(x, r, '#2f66b8', 2, 4, 8);
      const o = frame * 4;
      for (let j = 2; j < 32; j += 6) {
        const a = (o + j * 5 + v * 7) % 30, b = (j * 9 + v * 3 - o + 64) % 28;
        px(x, '#6aa6ec', a, j, 5, 1); px(x, '#a8d4ff', a + 1, j, 2, 1);
        px(x, '#224c96', b, j + 3, 6, 1); px(x, '#4a8ae0', b + 1, j + 2, 3, 1);
      }
      if ((v + frame) % 3 === 0) { const a = 6 + v * 5, b = 8 + frame * 9; px(x, '#ffffff', a, b, 1, 1); px(x, '#d8ecff', a - 1, b, 3, 1); px(x, '#d8ecff', a, b - 1, 1, 3); }
      const foam = '#d8ecff';
      if (mask & 1) { px(x, '#8a6a3a', 0, 0, 32, 3); px(x, foam, 0, 3, 32, 2); px(x, foam, frame ? 4 : 10, 5, 6, 1); }
      if (mask & 4) { px(x, foam, 0, 29, 32, 1); px(x, '#1e4a8a', 0, 30, 32, 2); }
      if (mask & 8) { px(x, '#6aa0e0', 0, 0, 3, 32); px(x, foam, 0, 0, 1, 32); }
      if (mask & 2) { px(x, '#6aa0e0', 29, 0, 3, 32); px(x, foam, 31, 0, 1, 32); }
      break;
    }
    case 'B': px(x, '#2a5aa8', 0, 0, 32, 32); px(x, '#8a5a32', 0, 3, 32, 26); for (let i = 0; i < 32; i += 8) { px(x, '#6a4020', i, 3, 1, 26); px(x, '#a8784a', i + 1, 3, 6, 1); } px(x, '#b07a48', 0, 3, 32, 2); px(x, '#4a2a10', 0, 27, 32, 2); break;
    case 'L': {
      px(x, '#c02a14', 0, 0, 32, 32);
      const o = frame * 5;
      for (let i = 0; i < 10; i++) px(x, i % 2 ? '#f2c94c' : '#f07a2a', (i * 9 + o) % 28, (i * 13 + o) % 28, 5, 3);
      px(x, '#ffe8a0', (o * 3) % 26, (o * 5 + 8) % 26, 3, 2);
      if (mask & 1) px(x, '#3a2a2a', 0, 0, 32, 3);
      break;
    }
    // ------------------------------------------------ buildings
    case 'R': {
      const base = theme === 'town' ? '#5a6a7a' : theme === 'city' ? '#3e4e7e' : theme === 'forestv' ? '#6a5a3a' : '#a8413a', dk = shade(base, -0.3), lt = shade(base, 0.2);
      px(x, base, 0, 0, 32, 32);
      for (let j = 0; j < 32; j += 8) { px(x, shade(base, -0.08), 0, j + 3, 32, 3); px(x, dk, 0, j + 6, 32, 2); for (let i = (j % 16 ? 4 : 0); i < 32; i += 8) { px(x, lt, i, j, 5, 2); px(x, shade(base, 0.35), i, j, 2, 1); px(x, dk, i + 6, j, 1, 6); } }
      if (mask & 4) { px(x, shade(base, -0.45), 0, 27, 32, 5); px(x, lt, 0, 26, 32, 1); }
      if (mask & 1) px(x, shade(base, 0.35), 0, 0, 32, 2);
      break;
    }
    case 'W': case 'D': case 'E': {
      const wall = theme === 'town' ? '#b8b0a0' : theme === 'city' ? '#e8e4dc' : '#e8d8b0', beam = theme === 'town' ? '#5a4a3a' : theme === 'city' ? '#3e4e7e' : '#7a5030';
      px(x, wall, 0, 0, 32, 32); px(x, shade(wall, -0.08), 0, 16, 32, 16);
      px(x, beam, 0, 0, 32, 3); px(x, beam, 0, 0, 3, 32); px(x, beam, 29, 0, 3, 32); px(x, shade(beam, -0.2), 0, 29, 32, 3);
      if (up === 'R') { const g = x.createLinearGradient(0, 0, 0, 7); g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 7); }
      if (ch === 'W') {
        px(x, beam, 8, 8, 16, 14); px(x, '#f2d88a', 10, 10, 12, 10); px(x, '#ffeebb', 10, 10, 5, 4); px(x, beam, 15, 10, 2, 10); px(x, beam, 10, 14, 12, 2);
        px(x, '#6a8a3a', 7, 22, 18, 3); px(x, '#e5534b', 9, 21, 2, 2); px(x, '#f2c94c', 18, 21, 2, 2);
      } else {
        px(x, '#3a2210', 6, 4, 20, 28); px(x, ch === 'E' ? '#8a5a30' : '#6a4020', 8, 6, 16, 26);
        px(x, shade('#8a5a30', 0.2), 8, 6, 16, 2); px(x, '#4a2a10', 15, 6, 2, 26);
        px(x, '#f2c94c', 20, 18, 2, 3);
        if (ch === 'E') { px(x, '#f2d88a', 11, 9, 3, 5); px(x, '#f2d88a', 18, 9, 3, 5); }
      }
      break;
    }
    case 'Q': G_(); px(x, '#5a3a1e', 6, 18, 3, 14); px(x, '#5a3a1e', 23, 18, 3, 14); px(x, '#7a4e2a', 2, 3, 28, 18); px(x, '#a8784a', 4, 5, 24, 14); px(x, '#f3e6c4', 6, 7, 8, 6); px(x, '#e8dcc0', 16, 8, 9, 8); px(x, '#f3e6c4', 9, 13, 7, 5); px(x, '#e5534b', 9, 7, 2, 2); px(x, '#e5534b', 20, 8, 2, 2); px(x, '#3a2a1a', 7, 10, 6, 1); px(x, '#3a2a1a', 17, 11, 7, 1); break;
    case 'F': G_(); px(x, '#a8784a', 0, 10, 32, 3); px(x, '#a8784a', 0, 20, 32, 3); px(x, '#6a4526', 0, 12, 32, 1); px(x, '#6a4526', 0, 22, 32, 1); px(x, '#8a5a32', 4, 5, 4, 24); px(x, '#8a5a32', 24, 5, 4, 24); px(x, '#c8986a', 4, 5, 4, 2); px(x, '#c8986a', 24, 5, 4, 2); break;
    case 'S': (theme === 'ash' || theme === 'town' || theme === 'tokyo') ? speckle(x, r, THEME_GROUND[theme], [shade(THEME_GROUND[theme], -0.1)], 30) : G_(); px(x, '#5a3a1e', 14, 16, 4, 16); px(x, '#a8784a', 4, 4, 24, 14); px(x, '#7a4e2a', 4, 16, 24, 2); px(x, '#4a2a10', 8, 8, 16, 2); px(x, '#4a2a10', 8, 12, 12, 2); break;
    case 'N': { (theme === 'ash' ? speckle(x, r, '#5a5055', ['#4a4045'], 30) : G_()); x.fillStyle = '#8a6a3a'; x.beginPath(); x.moveTo(2, 30); x.lineTo(16, 3); x.lineTo(30, 30); x.fill(); x.fillStyle = '#a8844a'; x.beginPath(); x.moveTo(8, 30); x.lineTo(16, 3); x.lineTo(20, 30); x.fill(); px(x, '#2a1a0a', 12, 20, 8, 10); px(x, '#5a3a1a', 15, 2, 2, 4); break; }
    case 'O': { (theme === 'ash' ? speckle(x, r, '#5a5055', ['#4a4045'], 30) : G_()); for (let i = 0; i < 6; i++) px(x, '#6a6a6a', 6 + i * 4, 24 + (i % 2), 4, 4); px(x, '#5a3a1e', 8, 20, 16, 4); px(x, '#3a2410', 12, 18, 8, 3); const f = frame; x.fillStyle = '#e5534b'; x.beginPath(); x.moveTo(8, 22); x.quadraticCurveTo(16, -2 + f * 3, 24, 22); x.fill(); x.fillStyle = '#f2a03a'; x.beginPath(); x.moveTo(11, 22); x.quadraticCurveTo(16 + (f ? 2 : -2), 6, 21, 22); x.fill(); x.fillStyle = '#fff3a0'; x.beginPath(); x.moveTo(13, 22); x.quadraticCurveTo(16, 12 + f * 2, 19, 22); x.fill(); break; }
    case 'r': {
      const g = THEME_GROUND[theme] || '#4a3a30';
      if (theme === 'cave') {
        if (mask & 4) { // front face of the cave wall
          speckle(x, r, '#3a2e28', ['#4a3c34', '#2e241e'], 30);
          const gr = x.createLinearGradient(0, 12, 0, 32); gr.addColorStop(0, '#4a3c34'); gr.addColorStop(1, '#1e1612'); x.fillStyle = gr; x.fillRect(0, 12, 32, 20);
          for (let i = 0; i < 4; i++) px(x, '#2a201a', 3 + i * 8, 14, 1, 16);
          px(x, '#6a5848', 0, 11, 32, 2);
        } else { speckle(x, r, '#2e241e', ['#3a2e26', '#241c16', '#42362c'], 40); }
      } else if (theme === 'town' || theme === 'ash' || theme === 'grass') {
        speckle(x, r, theme === 'town' ? '#6e6a62' : g, [shade(g, -0.2)], 20);
        x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(16, 27, 13, 4, 0, 0, 7); x.fill();
        const rc = theme === 'ash' ? '#4e4650' : '#7a7a84';
        x.fillStyle = rc; x.beginPath(); x.moveTo(2, 27); x.lineTo(5, 8); x.lineTo(14, 3); x.lineTo(26, 6); x.lineTo(30, 26); x.closePath(); x.fill();
        x.fillStyle = shade(rc, 0.25); x.beginPath(); x.moveTo(6, 10); x.lineTo(14, 5); x.lineTo(22, 7); x.lineTo(15, 13); x.closePath(); x.fill();
        px(x, shade(rc, -0.3), 4, 24, 26, 3);
      } else { speckle(x, r, '#2e2440', ['#241c34'], 20); }
      break;
    }
    case '#': px(x, '#2e2440', 0, 0, 32, 32); for (let j = 0; j < 32; j += 8) { px(x, '#1e1630', 0, j + 6, 32, 2); for (let i = (j % 16 ? 8 : 0); i < 32; i += 16) px(x, '#1e1630', i, j, 2, 6); px(x, '#3e3456', (j % 16 ? 10 : 2), j, 12, 1); } if (mask & 4) { px(x, '#16102a', 0, 26, 32, 6); } break;
    case 'P': px(x, '#342a48', 0, 0, 32, 32); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(6, 26, 24, 6); px(x, '#5a5068', 7, 0, 18, 30); px(x, '#7a7090', 9, 0, 5, 30); px(x, '#3e3450', 21, 0, 4, 30); px(x, '#8a8098', 5, 26, 22, 4); px(x, '#8a8098', 5, 0, 22, 3); break;
    case 'H': px(x, '#342a48', 0, 0, 32, 32); px(x, '#4a0c1a', 3, 0, 26, 32); px(x, '#d8a840', 3, 0, 26, 4); px(x, '#6a1426', 7, 6, 18, 18); px(x, '#8a2234', 9, 8, 14, 12); px(x, '#d8a840', 0, 24, 32, 8); px(x, '#f2c94c', 0, 24, 32, 2); break;
    case 'Z': {
      const open = G && G.flags && G.flags.doorOpen;
      px(x, '#2e2440', 0, 0, 32, 32);
      if (open) { const g = x.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, '#0a0610'); g.addColorStop(1, '#3a1030'); x.fillStyle = g; x.fillRect(2, 0, 28, 32); break; }
      px(x, '#3a1a1e', 2, 0, 28, 32); px(x, '#5a2a2e', 4, 2, 24, 28);
      for (let i = 0; i < 4; i++) px(x, '#241014', 4, 6 + i * 7, 24, 1);
      px(x, '#b8a078', 2, 0, 28, 2); px(x, '#8a7858', 15, 0, 2, 32);
      px(x, '#e5534b', 12, 13, 8, 6); px(x, '#ffb080', 14, 14, 4, 4);
      break;
    }
    // ------------------------------------------------ interiors
    case 'o': case 'u': case 'x': case 'm': {
      px(x, '#8a5e36', 0, 0, 32, 32);
      for (let j = 0; j < 32; j += 8) { px(x, '#6e4826', 0, j + 7, 32, 1); px(x, '#9c6c40', 0, j, 32, 1); px(x, '#6e4826', (j * 5 + v * 7) % 32, j, 1, 7); }
      if (ch === 'm') { px(x, '#7a2a30', 0, 0, 32, 32); px(x, '#9a3a3a', 2, 2, 28, 28); px(x, '#d8a840', 4, 4, 24, 1); px(x, '#d8a840', 4, 27, 24, 1); px(x, '#b84a4a', 10, 10, 12, 12); }
      if (ch === 'x') { px(x, '#4a5a3a', 4, 6, 24, 20); px(x, '#6a7a4a', 6, 8, 20, 16); }
      if (ch === 'u') { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(9, 24, 14, 4); px(x, '#5a3a1e', 9, 12, 14, 5); px(x, '#7a5230', 9, 12, 14, 2); px(x, '#4a2a10', 10, 17, 2, 9); px(x, '#4a2a10', 20, 17, 2, 9); }
      shadowTop();
      break;
    }
    case 'V': case 'y': {
      px(x, '#6a5040', 0, 0, 32, 32); px(x, '#7e6250', 0, 0, 32, 20); px(x, '#4a3428', 0, 20, 32, 12);
      for (let i = 0; i < 32; i += 8) px(x, '#5a4234', i, 0, 1, 20);
      px(x, '#3a2618', 0, 18, 32, 3);
      if (ch === 'y') { px(x, '#3a2618', 7, 3, 18, 14); const lit = theme === 'tokyo' ? '#a8c8e8' : '#f2d88a'; px(x, lit, 9, 5, 14, 10); px(x, shade(lit, 0.3), 9, 5, 6, 4); px(x, '#3a2618', 15, 5, 2, 10); }
      break;
    }
    case 'C': px(x, '#8a5e36', 0, 0, 32, 32); px(x, '#6a4020', 0, 6, 32, 26); px(x, '#a87a48', 0, 4, 32, 6); px(x, '#c8986a', 0, 4, 32, 2); px(x, '#4a2a10', 0, 28, 32, 4); for (let i = 4; i < 32; i += 10) px(x, '#5a3418', i, 12, 1, 14); break;
    case 'b': case 'h': {
      px(x, '#4a3020', 0, 0, 32, 32); px(x, '#6a4428', 2, 0, 28, 30);
      for (let j = 0; j < 3; j++) {
        const y0 = 2 + j * 9; px(x, '#3a2214', 2, y0 + 7, 28, 2);
        for (let i = 3; i < 29;) {
          const w = ch === 'b' ? 2 + Math.floor(r() * 3) : 4 + Math.floor(r() * 3);
          const col = ch === 'b' ? pick2(r, ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#c8a050', '#6a3a7a', '#a86a3a']) : pick2(r, ['#e5534b', '#6fb7f2', '#f2c94c', '#7ed36f', '#e8dcc0']);
          if (ch === 'b') px(x, col, i, y0 + 1 + Math.floor(r() * 2), w, 6); else { px(x, col, i, y0 + 3, w, 4); px(x, shade(col, 0.3), i, y0 + 3, w, 1); }
          i += w + (ch === 'b' ? 0 : 2);
        }
      }
      break;
    }
    case 'e': px(x, '#8a5e36', 0, 0, 32, 32); px(x, '#5a3418', 1, 12, 30, 20); px(x, '#a8d8f0', 3, 4, 26, 12); px(x, 'rgba(255,255,255,.7)', 5, 5, 6, 2); px(x, '#c8b060', 8, 10, 6, 5); px(x, '#b0b8c8', 18, 8, 3, 8); px(x, '#e5534b', 23, 11, 3, 3); px(x, '#3a2214', 1, 16, 30, 2); break;
    case 't': px(x, '#8a5e36', 0, 0, 32, 32); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(3, 24, 28, 6); px(x, '#6a4020', 2, 6, 28, 16); px(x, '#a87a48', 2, 4, 28, 14); px(x, '#c8986a', 2, 4, 28, 2); px(x, '#4a2a10', 4, 18, 3, 10); px(x, '#4a2a10', 25, 18, 3, 10); px(x, '#e8e0d0', 12, 8, 6, 4); px(x, '#f2c94c', 20, 7, 3, 5); break;
    case 'k': px(x, '#8a5e36', 0, 0, 32, 32); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(6, 26, 22, 5); px(x, '#6a4020', 7, 4, 18, 24); px(x, '#8a5a32', 9, 4, 14, 24); px(x, '#3a3a3a', 7, 8, 18, 2); px(x, '#3a3a3a', 7, 22, 18, 2); px(x, '#a87a48', 9, 3, 14, 3); break;
    case 'z': { px(x, '#6a5040', 0, 0, 32, 32); px(x, '#5a5a5e', 2, 2, 28, 30); px(x, '#3a3a3e', 2, 2, 28, 3); px(x, '#1a1210', 6, 10, 20, 22); const f = frame; x.fillStyle = '#e5534b'; x.beginPath(); x.moveTo(8, 30); x.quadraticCurveTo(16, 10 + f * 3, 24, 30); x.fill(); x.fillStyle = '#f2c94c'; x.beginPath(); x.moveTo(11, 30); x.quadraticCurveTo(16, 17 - f * 2, 21, 30); x.fill(); px(x, '#5a3a1e', 9, 29, 14, 3); break; }
    // ------------------------------------------------ Tokyo
    case 'A': case 'Y': {
      speckle(x, r, '#3a3640', ['#34303a', '#423e48', '#302c36'], 40);
      if (ch === 'Y') { for (let i = 2; i < 32; i += 8) px(x, '#e8e6ea', i, 0, 5, 32); }
      if (ch === 'A' && (v === 0 || v === 2) && !(mask & 1) && !(mask & 4)) { px(x, '#d8b840', 4, 15, 12, 2); }
      if (mask & 1) { px(x, '#8a8490', 0, 0, 32, 3); px(x, '#5a5460', 0, 3, 32, 1); }
      if (mask & 4) { px(x, '#5a5460', 0, 28, 32, 1); px(x, '#8a8490', 0, 29, 32, 3); }
      break;
    }
    case 'J': case 'I': case '8': {
      const base = ch === '8' ? '#d8d4c8' : v % 2 ? '#5a5664' : '#4e4a58';
      px(x, base, 0, 0, 32, 32); px(x, shade(base, -0.2), 0, 28, 32, 4);
      const lit = ch === 'I' ? (hash2(v, frame) % 3 ? '#f2d88a' : '#ffe8b0') : ch === '8' ? '#8ab0d0' : '#2a2838';
      for (const [wx, wy] of [[4, 6], [18, 6], [4, 17], [18, 17]]) { px(x, shade(base, -0.35), wx - 1, wy - 1, 12, 9); px(x, (ch === 'I' && (v + wx + wy) % 5 === 0) ? '#2a2838' : lit, wx, wy, 10, 7); px(x, shade(base, -0.35), wx + 4, wy, 1, 7); }
      if (mask & 4 && ch !== '8') px(x, '#2a2838', 0, 30, 32, 2);
      break;
    }
    case 'U': case 'n': {
      px(x, '#e8e8ec', 0, 0, 32, 32); px(x, '#3a8ad0', 0, 0, 32, 7); px(x, '#f2c94c', 0, 7, 32, 2); px(x, '#7ed36f', 0, 9, 32, 2);
      if (ch === 'U') { px(x, '#cfe8f4', 3, 13, 26, 17); px(x, '#f2e8a0', 5, 16, 6, 10); px(x, '#e5534b', 13, 18, 4, 8); px(x, '#6fb7f2', 20, 15, 6, 11); px(x, 'rgba(255,255,255,.6)', 4, 14, 3, 14); }
      else { px(x, '#9ac8e0', 4, 12, 24, 20); px(x, '#dff4ff', 4, 12, 11, 20); px(x, '#5a8aa0', 15, 12, 2, 20); }
      break;
    }
    case 'v': px(x, '#9c96a0', 0, 0, 32, 32); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(5, 27, 24, 5); px(x, '#c83a3a', 5, 1, 22, 28); px(x, '#e8e8ec', 7, 3, 18, 12); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) px(x, ['#3a8ad0', '#f2c94c', '#7ed36f'][(i + j) % 3], 8 + i * 6, 4 + j * 6, 4, 5); px(x, '#1a1a1a', 8, 18, 16, 6); px(x, frame ? '#ffe070' : '#d8b840', 21, 16, 3, 2); break;
    case 'g': px(x, '#a8a49c', 0, 0, 32, 32); speckle(x, r, '#a8a49c', ['#989488'], 16); px(x, '#c83a2a', 10, 0, 12, 32); px(x, '#e5534b', 11, 0, 4, 32); px(x, '#1a1210', 8, 28, 16, 4); break;
    case 'i': px(x, '#6a3a2a', 0, 0, 32, 32); px(x, '#3a2a2a', 0, 0, 32, 8); px(x, '#c83a2a', 0, 8, 32, 3); px(x, '#e8dcc0', 2, 12, 28, 18); px(x, '#6a3a2a', 15, 12, 2, 18); px(x, '#6a3a2a', 2, 20, 28, 1); px(x, '#f2c94c', 14, 2, 4, 4); break;
    case 'l': { speckle(x, r, '#9c96a0', ['#8c8690', '#aca6b0'], 30); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(10, 27, 12, 4); px(x, '#3a3a44', 15, 4, 3, 26); px(x, '#3a3a44', 12, 28, 9, 3); px(x, '#3a3a44', 12, 2, 10, 4); px(x, frame ? '#fff0c0' : '#ffe8a8', 13, 5, 8, 3); break; }
    case 'w': case '9': case '5': {
      const base = ch === '5' ? '#8a6a4a' : '#c8c4bc';
      px(x, base, 0, 0, 32, 32); px(x, shade(base, 0.15), 0, 0, 32, 4); px(x, shade(base, -0.25), 0, 28, 32, 4);
      for (let i = 0; i < 32; i += 8) px(x, shade(base, -0.12), i, 4, 1, 24);
      if (ch === '9') { px(x, '#8a8680', 4, 0, 24, 32); px(x, '#a8a49c', 6, 0, 20, 4); px(x, '#3a3a44', 10, 12, 12, 10); px(x, '#e8e6ea', 11, 13, 10, 8); }
      if (ch === '5') { px(x, '#3a2a1a', 0, 0, 32, 5); px(x, '#e8e0d0', 6, 8, 20, 14); px(x, '#8a6a4a', 15, 8, 2, 14); px(x, '#8a6a4a', 6, 14, 20, 2); }
      break;
    }
    case '1': speckle(x, r, '#9c96a0', ['#8c8690'], 20); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(3, 24, 27, 5); px(x, '#6a4526', 2, 12, 28, 4); px(x, '#6a4526', 2, 17, 28, 4); px(x, '#3a3a44', 4, 21, 3, 6); px(x, '#3a3a44', 25, 21, 3, 6); px(x, '#8a5a32', 2, 12, 28, 1); break;
    case '2': case '7': { const base = ch === '7' ? '#9c96a0' : THEME_GROUND[theme] || '#5ea84a'; px(x, base, 0, 0, 32, 32); if (ch === '7') { px(x, '#7a6a5a', 4, 14, 24, 16); px(x, '#5a4a3a', 4, 28, 24, 2); } const E = (cx, cy, rr, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); }; E(8, 12, 8, '#2f6a30'); E(22, 12, 9, '#2f6a30'); E(15, 8, 8, '#3f8a3a'); E(11, 6, 3, '#5aa84a'); E(24, 9, 3, '#5aa84a'); if (ch === '7') { px(x, '#f28fad', 9, 6, 2, 2); px(x, '#f2c94c', 20, 8, 2, 2); } break; }
    case '3': speckle(x, r, '#9c96a0', ['#8c8690'], 20); px(x, '#2a2a30', 15, 6, 3, 26); px(x, '#2a2a30', 10, 0, 13, 12); px(x, frame ? '#e5534b' : '#5a1a1a', 12, 2, 4, 4); px(x, frame ? '#1a4a2a' : '#40ff70', 17, 2, 4, 4); break;

    // ------------------------------------------------ v3: farms, towns, the capital, the manor, the rift
    case '%': { // tilled farmland
      speckle(x, r, '#6a4a2e', ['#5e4028', '#76543a', '#624630'], 30);
      for (let j = 3; j < 32; j += 8) { px(x, '#4e3420', 0, j + 4, 32, 2); px(x, '#86644a', 0, j, 32, 1); for (let i = 2 + (j % 16 ? 3 : 0); i < 32; i += 6) { px(x, '#4f9a3e', i, j - 2, 2, 3); px(x, '#7ccf62', i, j - 3, 1, 1); } }
      shadowTop(); break;
    }
    case '&': { // wheat
      G_();
      for (let i = 0; i < 16; i++) { const a = (i * 7 + v * 3) % 30 + 1, b = 6 + (i * 5) % 18; px(x, '#b8963a', a, b, 1, 32 - b); px(x, frame ? '#f2d470' : '#e8c860', a - 1 + (frame && i % 2 ? 1 : 0), b - 4, 3, 5); px(x, '#fff0b0', a, b - 4, 1, 2); }
      break;
    }
    case '+': case '[': { // dressed stone wall (manor, city)
      px(x, '#8a8478', 0, 0, 32, 32);
      for (let j = 0; j < 32; j += 8) { px(x, '#6a6458', 0, j + 7, 32, 1); for (let i = (j % 16 ? 8 : 0); i < 32; i += 16) { px(x, '#6a6458', i, j, 1, 7); px(x, '#a8a294', i + 1, j, 14, 1); } }
      speckle(x, r, 'rgba(0,0,0,0)', ['rgba(0,0,0,.08)', 'rgba(255,255,255,.06)'], 20);
      if (mask & 1) { px(x, '#b8b2a4', 0, 0, 32, 3); px(x, '#5a5448', 0, 3, 32, 1); }
      if (mask & 4) { px(x, '#5a5448', 0, 29, 32, 3); }
      if (ch === '[') { px(x, '#4a4438', 9, 6, 14, 18); x.fillStyle = '#4a4438'; x.beginPath(); x.arc(16, 7, 7, Math.PI, 0); x.fill(); const lit = theme === 'night' ? '#f2d88a' : '#9ab8d8'; px(x, lit, 11, 8, 10, 15); x.fillStyle = lit; x.beginPath(); x.arc(16, 8, 5, Math.PI, 0); x.fill(); px(x, '#4a4438', 15, 4, 2, 19); px(x, '#4a4438', 11, 14, 10, 1); px(x, 'rgba(255,255,255,.5)', 12, 9, 2, 5); }
      break;
    }
    case ']': { // grand double door
      px(x, '#8a8478', 0, 0, 32, 32); px(x, '#5a5448', 2, 0, 28, 32);
      x.fillStyle = '#3a2210'; x.beginPath(); x.moveTo(4, 32); x.lineTo(4, 10); x.arc(16, 10, 12, Math.PI, 0); x.lineTo(28, 32); x.fill();
      px(x, '#7a4a24', 6, 10, 9, 22); px(x, '#7a4a24', 17, 10, 9, 22); px(x, '#9a6a3a', 6, 10, 9, 1); px(x, '#9a6a3a', 17, 10, 9, 1);
      for (const yy of [14, 22]) { px(x, '#3a3a3a', 6, yy, 9, 1); px(x, '#3a3a3a', 17, yy, 9, 1); }
      px(x, '#e0b84a', 13, 19, 2, 3); px(x, '#e0b84a', 17, 19, 2, 3);
      break;
    }
    case ':': { // cobbled plaza
      px(x, '#9a948a', 0, 0, 32, 32);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const ox = (j % 2) * 4, c1 = ['#aaa498', '#8e887e', '#a29c90'][(i + j + v) % 3]; px(x, c1, i * 8 + ox + 1, j * 8 + 1, 6, 6); px(x, shade(c1, 0.12), i * 8 + ox + 1, j * 8 + 1, 6, 1); px(x, shade(c1, -0.15), i * 8 + ox + 1, j * 8 + 6, 6, 1); }
      shadowTop(); break;
    }
    case ';': speckle(x, r, '#4a4a3a', ['#3e3e30', '#56563e', '#5a5040'], 44); for (let i = 0; i < 6; i++) { const a = Math.floor(r() * 30), b = Math.floor(r() * 26) + 4; px(x, '#6a6448', a, b, 1, 3); } shadowTop(); break;
    case '-': { // Valen blue carpet
      px(x, '#1e2a5a', 0, 0, 32, 32); px(x, '#2e3f82', 3, 0, 26, 32); px(x, '#e0b84a', 1, 0, 1, 32); px(x, '#e0b84a', 30, 0, 1, 32);
      for (let j = 4; j < 32; j += 12) { px(x, '#4a5aa8', 12, j, 8, 2); px(x, '#4a5aa8', 15, j - 2, 2, 6); }
      shadowTop(); break;
    }
    case '0': { // well
      (theme === 'town' || theme === 'city') ? speckle(x, r, '#9a948a', ['#8e887e'], 20) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(16, 27, 12, 4, 0, 0, 7); x.fill();
      px(x, '#7a7a84', 5, 16, 22, 11); px(x, '#9a9aa4', 5, 16, 22, 2); px(x, '#5a5a64', 5, 25, 22, 2); for (let i = 7; i < 27; i += 5) px(x, '#5a5a64', i, 18, 1, 7);
      px(x, '#1a2a4a', 8, 13, 16, 4); px(x, '#5a3a1e', 6, 2, 2, 15); px(x, '#5a3a1e', 24, 2, 2, 15); px(x, '#8a4a2a', 3, 0, 26, 4); px(x, '#a85a32', 3, 0, 26, 1); px(x, '#3a2a1a', 15, 4, 1, 8); px(x, '#8a6a3a', 13, 11, 5, 3);
      break;
    }
    case '4': { // hedge / bush
      (theme === 'city' || theme === 'town') ? speckle(x, r, '#9a948a', ['#8e887e'], 20) : G_();
      const E_ = (cx, cy, rr, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); };
      x.fillStyle = 'rgba(10,20,10,.3)'; x.beginPath(); x.ellipse(16, 28, 13, 4, 0, 0, 7); x.fill();
      E_(10, 20, 8, '#2a6a2e'); E_(22, 20, 8, '#2a6a2e'); E_(16, 15, 9, '#357a36'); E_(13, 12, 4, '#4c9a46'); E_(21, 14, 3, '#4c9a46');
      if (v === 1) { px(x, '#f28fad', 9, 15, 2, 2); px(x, '#f28fad', 20, 19, 2, 2); px(x, '#fff3a0', 15, 11, 2, 2); }
      break;
    }
    case '6': { // fountain
      speckle(x, r, '#9a948a', ['#8e887e', '#a29c90'], 24);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(16, 27, 15, 5, 0, 0, 7); x.fill();
      x.fillStyle = '#b8b2a4'; x.beginPath(); x.ellipse(16, 21, 15, 8, 0, 0, 7); x.fill();
      x.fillStyle = '#3a7ad0'; x.beginPath(); x.ellipse(16, 20, 12, 6, 0, 0, 7); x.fill();
      px(x, '#7ab4f4', 8 + frame * 3, 19, 5, 1); px(x, '#7ab4f4', 18 - frame * 2, 22, 4, 1);
      px(x, '#b8b2a4', 14, 6, 4, 14); px(x, '#d8d2c4', 14, 6, 1, 14); px(x, '#b8b2a4', 11, 5, 10, 2);
      px(x, '#bfe6ff', 15, 1 + frame, 2, 5); px(x, '#e8f6ff', 12 - frame, 3, 1, 3); px(x, '#e8f6ff', 20 + frame, 3, 1, 3);
      break;
    }
    case '*': { // market stall
      (theme === 'city' || theme === 'town') ? speckle(x, r, '#9a948a', ['#8e887e'], 20) : G_();
      const aw = ['#c83a3a', '#3a7ad0', '#3a9a4a', '#d8a030'][v];
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(3, 26, 28, 5);
      px(x, '#6a4020', 3, 8, 2, 20); px(x, '#6a4020', 27, 8, 2, 20);
      for (let i = 0; i < 28; i += 4) { px(x, i % 8 ? '#f0e8d8' : aw, 2 + i, 2, 4, 8); px(x, i % 8 ? '#f0e8d8' : aw, 2 + i, 10, 4, 2); }
      px(x, shade(aw, -0.3), 2, 11, 28, 1);
      px(x, '#8a5a32', 2, 18, 28, 6); px(x, '#a8784a', 2, 18, 28, 2);
      const goods = [['#e5534b', '#f2c94c', '#7ed36f'], ['#e8dcc0', '#c8a060', '#a86a3a'], ['#6fb7f2', '#b8c0c8', '#f28fad'], ['#f2a33a', '#7ed36f', '#e5534b']][v];
      for (let i = 0; i < 6; i++) { px(x, goods[i % 3], 4 + i * 4, 15, 3, 3); px(x, shade(goods[i % 3], 0.3), 4 + i * 4, 15, 1, 1); }
      break;
    }
    case '^': { // the rift
      px(x, '#0a0410', 0, 0, 32, 32);
      const t = frame;
      for (let k = 0; k < 5; k++) { x.strokeStyle = ['#6a1a8a', '#9a3ad0', '#c86aff', '#3a0a5a', '#e0a8ff'][k]; x.lineWidth = 2; x.beginPath(); x.ellipse(16, 16, 14 - k * 2.4, 14 - k * 2.4, t * 0.6 + k, k * 0.6, 4.2 + k * 0.4); x.stroke(); }
      x.lineWidth = 1; px(x, '#ffffff', 15, 15, 2, 2);
      break;
    }
    case '@': { // lamp post
      (theme === 'city' || theme === 'town') ? speckle(x, r, '#9a948a', ['#8e887e'], 20) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(11, 27, 10, 4);
      px(x, '#2a2a30', 15, 8, 3, 21); px(x, '#2a2a30', 12, 27, 9, 3); px(x, '#2a2a30', 11, 3, 11, 2); px(x, '#2a2a30', 12, 11, 9, 1);
      px(x, '#ffe8a8', 12, 5, 9, 6); px(x, '#fff8e0', 13, 6, 3, 3);
      break;
    }
    case '<': { // tent
      theme === 'ash' ? speckle(x, r, '#5a5055', ['#4a4045'], 30) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(2, 27, 30, 4);
      x.fillStyle = '#c8b48a'; x.beginPath(); x.moveTo(1, 29); x.lineTo(16, 3); x.lineTo(31, 29); x.fill();
      x.fillStyle = '#a8946a'; x.beginPath(); x.moveTo(16, 3); x.lineTo(31, 29); x.lineTo(20, 29); x.fill();
      x.fillStyle = '#2a1a0a'; x.beginPath(); x.moveTo(11, 29); x.lineTo(16, 16); x.lineTo(21, 29); x.fill();
      px(x, '#5a3a1a', 15, 1, 2, 4);
      break;
    }
    case '>': { // haystack
      G_(); x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(16, 28, 13, 4, 0, 0, 7); x.fill();
      x.fillStyle = '#c8a040'; x.beginPath(); x.moveTo(3, 28); x.quadraticCurveTo(4, 4, 16, 4); x.quadraticCurveTo(28, 4, 29, 28); x.fill();
      x.fillStyle = '#e8c860'; x.beginPath(); x.moveTo(7, 20); x.quadraticCurveTo(8, 8, 16, 7); x.quadraticCurveTo(12, 12, 11, 22); x.fill();
      for (let i = 0; i < 8; i++) px(x, '#a8802a', 6 + i * 3, 12 + (i % 3) * 5, 1, 4);
      break;
    }
    case '!': { // torch post
      theme === 'ash' || theme === 'castle' ? speckle(x, r, THEME_GROUND[theme] || '#5a5055', ['#4a4045'], 24) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(12, 28, 8, 3);
      px(x, '#4a2a14', 15, 12, 3, 17); px(x, '#6a4a2a', 13, 10, 7, 3);
      x.fillStyle = '#e5534b'; x.beginPath(); x.moveTo(13, 11); x.quadraticCurveTo(16, -2 + frame * 3, 20, 11); x.fill();
      x.fillStyle = '#ffe070'; x.beginPath(); x.moveTo(15, 11); x.quadraticCurveTo(16.5, 4 - frame * 2, 18, 11); x.fill();
      break;
    }
    case '?': { // gravestone
      G_(); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(8, 26, 18, 4);
      px(x, '#8a8a94', 9, 10, 14, 17); x.fillStyle = '#8a8a94'; x.beginPath(); x.arc(16, 11, 7, Math.PI, 0); x.fill();
      px(x, '#aaaab4', 9, 10, 2, 17); px(x, '#5a5a64', 13, 13, 6, 1); px(x, '#5a5a64', 15, 11, 2, 6); px(x, '#6a6a74', 12, 20, 8, 1);
      break;
    }
    case '{': case '$': { // bed / crib
      px(x, '#8a5e36', 0, 0, 32, 32);
      for (let j = 0; j < 32; j += 8) px(x, '#6e4826', 0, j + 7, 32, 1);
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(4, 26, 26, 5);
      if (ch === '{') {
        px(x, '#5a3418', 3, 1, 26, 5); px(x, '#7a4a24', 3, 1, 26, 2);
        px(x, '#e8e0d0', 4, 6, 24, 21); px(x, '#ffffff', 6, 7, 10, 5);
        px(x, v % 2 ? '#2e3f82' : '#7a2a4a', 4, 13, 24, 14); px(x, shade(v % 2 ? '#2e3f82' : '#7a2a4a', 0.2), 4, 13, 24, 2); px(x, '#e0b84a', 4, 16, 24, 1);
      } else {
        px(x, '#c8a878', 3, 6, 26, 20); px(x, '#e8e0f0', 5, 9, 22, 15); px(x, '#6a8ac8', 5, 16, 22, 8);
        for (let i = 3; i < 30; i += 4) px(x, '#a8885a', i, 4, 2, 22); px(x, '#e8c898', 3, 4, 26, 2);
      }
      break;
    }
    // ------------------------------------------------ town dressing (added for busier streets)
    case '(': { // crates and a barrel
      (theme === 'city' || theme === 'town') ? speckle(x, r, THEME_GROUND[theme], [shade(THEME_GROUND[theme], -0.08)], 20) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(2, 26, 29, 5);
      const crate = (a, b, s) => { px(x, UI.ink, a - 1, b - 1, s + 2, s + 2); px(x, '#a8743a', a, b, s, s); px(x, '#c8945a', a, b, s, 2); px(x, '#7a4e22', a, b + s - 2, s, 2); px(x, '#7a4e22', a + (s >> 1) - 1, b, 2, s); px(x, '#6a4020', a, b, 1, s); px(x, '#6a4020', a + s - 1, b, 1, s); };
      crate(2, 15, 12); crate(4, 5, 9);
      px(x, UI.ink, 16, 9, 14, 20); px(x, '#8a5a2e', 17, 10, 12, 18); px(x, '#a8743a', 18, 10, 4, 18); px(x, '#5a5a64', 17, 12, 12, 2); px(x, '#5a5a64', 17, 23, 12, 2); px(x, '#b8b8c4', 18, 12, 3, 1);
      if (v % 2) { px(x, '#e5534b', 6, 3, 3, 3); px(x, '#7ed36f', 9, 2, 2, 2); px(x, '#f2c94c', 20, 7, 3, 3); }
      break;
    }
    case ')': { // flower planter
      (theme === 'city' || theme === 'town') ? speckle(x, r, THEME_GROUND[theme], [shade(THEME_GROUND[theme], -0.08)], 20) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(3, 26, 27, 5);
      px(x, UI.ink, 2, 15, 28, 13); px(x, '#8a5a32', 3, 16, 26, 11); px(x, '#a8784a', 3, 16, 26, 2); px(x, '#6a4020', 3, 25, 26, 2);
      const fl = [['#f28fad', '#fff3a0'], ['#e5534b', '#ffd070'], ['#a8c8ff', '#ffffff'], ['#f2a03a', '#f28fad']][v];
      for (let i = 0; i < 9; i++) { const a = 4 + i * 3, b = 8 + (i * 5) % 7; px(x, '#2f7428', a + 1, b + 2, 1, 16 - b); px(x, '#46963a', a - 1, b + 5, 2, 2); px(x, fl[i % 2], a, b, 3, 3); px(x, '#ffffff', a + 1, b, 1, 1); }
      break;
    }
    case '|': { // pennant pole (bunting is strung between neighbouring poles)
      (theme === 'city' || theme === 'town') ? speckle(x, r, THEME_GROUND[theme], [shade(THEME_GROUND[theme], -0.08)], 20) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(12, 27, 10, 4);
      px(x, UI.ink, 14, 1, 5, 29); px(x, '#8a5a2e', 15, 2, 3, 27); px(x, '#b8844a', 15, 2, 1, 27); px(x, '#f2c94c', 14, 0, 5, 3);
      const pc = ['#c83a3a', '#2e3f82', '#3a9a4a', '#d8a030'][v];
      x.fillStyle = pc; x.beginPath(); x.moveTo(18, 3); x.lineTo(30, 7 + frame); x.lineTo(18, 11); x.fill();
      px(x, shade(pc, 0.35), 18, 4, 6, 1);
      break;
    }
    case '"': { // flowerbed you can walk through
      G_();
      const cols = [['#f28fad', '#fff3a0', '#ffffff'], ['#e5534b', '#f2c94c', '#ffffff'], ['#a8c8ff', '#f28fad', '#fff3a0'], ['#c88aff', '#ffffff', '#f2a03a']][v];
      for (let i = 0; i < 16; i++) {
        const a = 2 + Math.floor(r() * 27), b = 4 + Math.floor(r() * 25), c0 = cols[i % 3];
        px(x, '#2f7428', a + 1, b + 2, 1, 3); px(x, c0, a, b, 3, 2); px(x, c0, a + 1, b - 1, 1, 4); px(x, shade(c0, 0.4), a + 1, b, 1, 1);
      }
      break;
    }
    case '/': { // a handcart piled with produce (or ore, in Ironhold)
      (theme === 'city' || theme === 'town') ? speckle(x, r, THEME_GROUND[theme], [shade(THEME_GROUND[theme], -0.08)], 20) : G_();
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(2, 26, 29, 5);
      px(x, UI.ink, 1, 12, 30, 11); px(x, '#8a5a2e', 2, 13, 28, 9); px(x, '#b8844a', 2, 13, 28, 2); px(x, '#6a4020', 9, 13, 1, 9); px(x, '#6a4020', 20, 13, 1, 9);
      const ore = theme === 'town';
      const goods = ore ? ['#5a5a64', '#8a8a94', '#6a5a50', '#d8a840'] : ['#e5534b', '#7ed36f', '#f2c94c', '#f2a03a'];
      for (let i = 0; i < 11; i++) { const a = 3 + i * 2.5, b = 6 + (i % 3) * 2; x.fillStyle = goods[i % 4]; x.beginPath(); x.arc(a + 1, b + 3, 2.4, 0, 7); x.fill(); px(x, '#ffffff', Math.round(a), b + 2, 1, 1); }
      for (const wx of [7, 23]) { x.fillStyle = UI.ink; x.beginPath(); x.arc(wx, 24, 5, 0, 7); x.fill(); x.fillStyle = '#6a4020'; x.beginPath(); x.arc(wx, 24, 4, 0, 7); x.fill(); px(x, '#b8844a', wx - 1, 21, 2, 6); px(x, '#b8844a', wx - 3, 23, 6, 2); }
      px(x, '#6a4020', 28, 16, 4, 2);
      break;
    }
    case '£': { // a statue on a plinth
      (theme === 'city' || theme === 'town') ? speckle(x, r, THEME_GROUND[theme], [shade(THEME_GROUND[theme], -0.08)], 20) : G_();
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(3, 26, 27, 5);
      px(x, UI.ink, 4, 19, 24, 10); px(x, '#b8b2a4', 5, 20, 22, 8); px(x, '#d8d2c4', 5, 20, 22, 2); px(x, '#8a8478', 5, 26, 22, 2);
      const st = '#9aa8a0', sd = '#6a7a72', sl = '#c8d8d0';
      px(x, UI.ink, 11, 1, 10, 19); px(x, st, 12, 2, 8, 6); px(x, sl, 12, 2, 3, 2); px(x, st, 11, 8, 10, 11); px(x, sd, 18, 8, 3, 11); px(x, sl, 11, 8, 2, 11);
      px(x, UI.ink, 21, 0, 3, 14); px(x, sl, 22, 1, 1, 12); px(x, sd, 20, 12, 5, 2);
      px(x, '#f2c94c', 15, 22, 2, 2);
      break;
    }
    default: px(x, '#ff00ff', 0, 0, 32, 32);
  }
}
function pick2(r, a) { return a[Math.floor(r() * a.length)]; }
// props that normally stand on grass; in a yard or street they take the ground around them
const ON_GROUND = new Set('!&*04<>?@FNOQSTq()|/£'.split(''));
function tileCanvas(ch, theme, v, frame, mask = 0, up = '', under = '') {
  const key = ch + theme + v + frame + ':' + mask + (TALL.has(up) ? up : '') + (under ? '/' + under : '');
  if (TileCache[key]) return TileCache[key];
  const [c, x] = mkCanvas(32, 32);
  drawTile(x, ch, theme, v, frame, mask, up, under);
  TileCache[key] = c; return c;
}
// which neighbours count as "the same" for autotiling
function sameGroup(a, b) {
  if (a === '=' || a === 'd') return b === a || b === 'B' || b === 'E' || b === 'D' || b === 'M' || b === 'G' || b === '_' || b === 'S';
  if (a === '~') return b === '~' || b === 'B';
  if (a === 'r') return b === 'r';
  if (a === 'R') return b === 'R';
  if (a === 'L') return b === 'L';
  if (a === '#') return b === '#';
  if (a === '+' || a === '[') return '+[]'.includes(b);
  if (a === 'A' || a === 'Y') return b === 'A' || b === 'Y';
  if ('JI'.includes(a)) return 'JIUn'.includes(b);
  return true;
}

// ---------------------------------------------------------------- particles & light
const Particles = {
  list: [], kind: null,
  set(kind) { if (kind !== this.kind) { this.kind = kind; this.list = []; } },
  update(dt, camX, camY) {
    const k = this.kind; if (!k) return;
    const target = { fireflies: 26, dust: 30, embers: 44, petals: 30, leaves: 14, sparks: 24, motes: 16 }[k] || 0;
    while (this.list.length < target) this.list.push(this.spawn(camX, camY, true));
    for (const p of this.list) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (k === 'fireflies' || k === 'motes') { p.vx += Math.sin(p.t * 1.7 + p.seed) * 6 * dt; p.vy += Math.cos(p.t * 1.3 + p.seed) * 6 * dt; }
      if (k === 'petals' || k === 'leaves') p.x += Math.sin(p.t * 2 + p.seed) * 14 * dt;
    }
    this.list = this.list.map(p => (p.t > p.life || p.x < camX - 40 || p.x > camX + W + 40 || p.y < camY - 40 || p.y > camY + H + 40) ? this.spawn(camX, camY) : p);
  },
  spawn(camX, camY, anywhere) {
    const k = this.kind;
    const p = { x: camX + Math.random() * W, y: camY + Math.random() * H, t: 0, seed: Math.random() * 9, vx: 0, vy: 0, life: rand(4, 9) };
    if (k === 'embers' || k === 'sparks') { if (!anywhere) p.y = camY + H + 10; p.vx = rand(-12, 12); p.vy = rand(-50, -20); }
    if (k === 'petals' || k === 'leaves') { if (!anywhere) p.y = camY - 10; p.vx = rand(-24, -8); p.vy = rand(18, 34); }
    if (k === 'dust') { p.vx = rand(-4, 4); p.vy = rand(-3, 3); }
    return p;
  },
  draw(camX, camY) {
    const k = this.kind; if (!k) return;
    for (const p of this.list) {
      const a = Math.min(1, p.t, (p.life - p.t)) ;
      const sx = p.x - camX, sy = p.y - camY;
      if (k === 'fireflies' || k === 'motes') {
        const on = 0.5 + 0.5 * Math.sin(p.t * 3 + p.seed);
        ctx.globalAlpha = a * on * 0.9; ctx.fillStyle = k === 'motes' ? '#bfe6ff' : '#e8ff90';
        ctx.fillRect(sx, sy, 2, 2); ctx.globalAlpha = a * on * 0.25; ctx.beginPath(); ctx.arc(sx + 1, sy + 1, 6, 0, 7); ctx.fill();
      } else if (k === 'embers' || k === 'sparks') { ctx.globalAlpha = a * 0.85; ctx.fillStyle = p.seed > 4.5 ? '#f2c94c' : '#f07a2a'; ctx.fillRect(sx, sy, 2, 2); }
      else if (k === 'dust') { ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#d8c8b0'; ctx.fillRect(sx, sy, 2, 2); }
      else if (k === 'petals') { ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#f7b8cc'; ctx.fillRect(sx, sy, 3, 2); }
      else if (k === 'leaves') { ctx.globalAlpha = a * 0.8; ctx.fillStyle = p.seed > 4.5 ? '#c8a040' : '#6aa84a'; ctx.fillRect(sx, sy, 3, 2); }
    }
    ctx.globalAlpha = 1;
  }
};
// glow at a point (additive)
function glow(x, y, r, col, a = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
const LIGHT_TILES = { O: ['rgba(255,150,60,.55)', 90], L: ['rgba(255,90,30,.35)', 48], z: ['rgba(255,150,60,.5)', 110], l: ['rgba(255,236,170,.5)', 96], I: ['rgba(255,220,140,.14)', 40], y: ['rgba(255,220,140,.18)', 50], W: ['rgba(255,220,140,.10)', 36], U: ['rgba(220,240,255,.3)', 60], n: ['rgba(220,240,255,.3)', 60], v: ['rgba(255,240,240,.25)', 40], H: ['rgba(255,40,60,.18)', 80], '6': ['rgba(160,210,255,.18)', 50], '^': ['rgba(180,80,255,.5)', 120], '@': ['rgba(255,236,170,.45)', 90], '!': ['rgba(255,150,60,.5)', 80], '[': ['rgba(255,220,140,.12)', 40] };
let DarkCanvas = null;
