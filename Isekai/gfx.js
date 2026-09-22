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

// ---------------------------------------------------------------- humanoids
function charDef(key) {
  if (key === 'hero') {
    const girl = G && G.gender === 'girl';
    return { pal: { h: (G && G.hair) || '#1e1a26', s: (G && G.skin) || SK, c: '#2b3a67', d: '#1b2440', p: girl ? ((G && G.skin) || SK) : '#1b2440', b: '#1a1418', n: '#b83a4a' }, mods: girl ? ['girl', 'skirt', 'tie'] : ['tie'] };
  }
  return CHARS[key] || CHARS.villager;
}
function charSprite(key, dir, frame) {
  if (key.startsWith('m:')) return monsterSprite(key.slice(2), dir === 'left', 32);
  const tag = key === 'hero' && G ? G.hair + G.gender + G.skin : '';
  const id = key + tag + dir + frame;
  if (SpriteCache[id]) return SpriteCache[id];
  const def = charDef(key);
  const side = dir === 'left' || dir === 'right';
  let c = drawHumanoid(def, side ? 'side' : dir, frame);
  if (dir === 'left') c = flipped(c);
  SpriteCache[id] = c;
  return c;
}

function drawHumanoid(def, view, frame) {
  const [c, x] = mkCanvas(32, 32);
  const P = def.pal, M = new Set(def.mods || []);
  const R = (X, Y, w, h, col) => px(x, col, X, Y, w, h);
  const s = P.s, s2 = shade(s, -0.16), h = P.h, h2 = shade(h, -0.25), hl = shade(h, 0.28);
  const cc = P.c, cd = P.d, pp = P.p, bb = P.b, eye = P.e || '#1a1426', n = P.n || '#d8d0c0';
  const child = M.has('child'), stout = M.has('stout');
  const oy = child ? 4 : 0;                    // children are shorter
  const bob = frame ? -1 : 0;                  // upper body lifts on each step
  const U = oy + bob;                          // upper-body y offset
  const legTop = (child ? 26 : stout ? 25 : 24);
  const bw = stout ? 14 : child ? 10 : 12, bx = 16 - bw / 2;  // torso
  // ---------- cape behind
  if (M.has('cape') && view !== 'side') {
    const col = view === 'up' ? cd : shade(cd, -0.2);
    R(bx - 2, 16 + U, bw + 4, view === 'up' ? 13 : 12, col);
    if (view === 'up') R(bx - 1, 28 + oy, bw + 2, 2, shade(cd, -0.3));
  }
  if (M.has('cape') && view === 'side') { R(8, 16 + U, 5, 12, shade(cd, -0.2)); }
  // ---------- legs
  const legs = () => {
    if (M.has('hakama')) {
      R(bx - 1, 21 + U, bw + 2, 9 - bob, pp); R(15, 23 + U, 2, 7 - bob, shade(pp, -0.3));
      R(bx, 29 + oy, 3, 2, bb); R(bx + bw - 3, 29 + oy, 3, 2, bb); return;
    }
    const lh = 31 - legTop;
    if (view === 'side') {
      const f = frame === 1 ? 2 : frame === 2 ? -2 : 0;
      R(13 - f, legTop, 3, lh, shade(pp, -0.2)); R(13 - f, 29, 3, 2, shade(bb, -0.2));
      R(16 + f, legTop, 3, lh, pp); R(16 + f, 29, 4, 2, bb);
    } else {
      const lu = frame === 1 ? 1 : 0, ru = frame === 2 ? 1 : 0;
      R(12, legTop, 3, lh - lu, pp); R(12, 29 - lu, 3, 2, bb);
      R(17, legTop, 3, lh - ru, pp); R(17, 29 - ru, 3, 2, bb);
      R(14, legTop, 1, 3, shade(pp, -0.25));
    }
  };
  legs();
  // ---------- torso
  const ty = 16 + U, th = legTop - 16 - bob + 1;
  if (view === 'side') {
    R(11, ty, 10, th, cc); R(18, ty, 3, th, cd); R(11, ty + th - 1, 10, 1, cd);
  } else {
    R(bx, ty, bw, th, cc); R(bx + bw - 3, ty, 3, th, cd); R(bx, ty + th - 1, bw, 1, cd);
    if (view === 'down') {
      R(14, ty, 4, 1, s2);                                     // neck
      if (M.has('tie')) { R(15, ty + 1, 2, 5, n); R(15, ty + 5, 2, 1, shade(n, -0.3)); }
      if (M.has('apron')) R(bx + 2, ty + 2, bw - 4, th - 2, '#6a4a2a');
      R(bx, ty + th - 3, bw, 1, shade(cd, -0.2));              // belt
    }
  }
  if (M.has('skirt') && view !== 'side') { R(bx - 1, legTop - 2, bw + 2, 4, cc); R(bx - 1, legTop + 1, bw + 2, 1, cd); }
  if (M.has('skirt') && view === 'side') { R(10, legTop - 2, 12, 4, cc); R(10, legTop + 1, 12, 1, cd); }
  // ---------- arms
  if (view === 'side') {
    const sw = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    R(14 + sw, ty + 1, 4, 7, cd); R(14 + sw, ty + 8, 4, 2, s);
  } else {
    const la = frame === 1 ? -1 : 0, ra = frame === 2 ? -1 : 0;
    R(bx - 2, ty + 1 + la, 2, 7, view === 'up' ? cc : cd); R(bx - 2, ty + 8 + la, 2, 2, s);
    R(bx + bw, ty + 1 + ra, 2, 7, cd); R(bx + bw, ty + 8 + ra, 2, 2, s);
  }
  // ---------- head
  const hy = 3 + U, hx = view === 'side' ? 10 : 9, hw = view === 'side' ? 12 : 14;
  // back hair (long) drawn before the head for side/front
  const girl = M.has('girl');
  if (girl && view === 'down') { R(7, hy + 5, 3, 13, h2); R(22, hy + 5, 3, 13, h2); }
  if (girl && view === 'side') { R(8, hy + 4, 6, 14, h2); }
  R(hx, hy + 1, hw, 11, s); R(hx + 1, hy, hw - 2, 13, s);    // rounded skull
  R(hx + hw - 2, hy + 2, 2, 9, s2); R(hx + 1, hy + 12, hw - 2, 1, s2);
  // ears
  if (M.has('ears')) {
    if (view === 'down') { R(6, hy + 5, 3, 2, s); R(5, hy + 4, 2, 1, s); R(23, hy + 5, 3, 2, s2); R(25, hy + 4, 2, 1, s2); }
    if (view === 'side') { R(9, hy + 5, 3, 2, s); R(8, hy + 4, 2, 1, s); }
    if (view === 'up') { R(6, hy + 5, 3, 2, s); R(23, hy + 5, 3, 2, s); }
  }
  // face
  if (view === 'down') {
    R(12, hy + 7, 2, 3, eye); R(18, hy + 7, 2, 3, eye);
    R(12, hy + 7, 1, 1, '#ffffff'); R(18, hy + 7, 1, 1, '#ffffff');
    R(11, hy + 10, 2, 1, shade(s, -0.08)); R(19, hy + 10, 2, 1, shade(s, -0.08)); // cheeks
    if (!M.has('beard')) R(15, hy + 11, 2, 1, shade(s, -0.3));
    if (M.has('tusks')) { R(13, hy + 11, 1, 2, '#f0ece0'); R(18, hy + 11, 1, 2, '#f0ece0'); }
  }
  if (view === 'side') {
    R(18, hy + 7, 2, 3, eye); R(19, hy + 7, 1, 1, '#ffffff');
    R(21, hy + 8, 1, 2, s); // nose
    if (!M.has('beard')) R(19, hy + 11, 2, 1, shade(s, -0.3));
    if (M.has('tusks')) R(20, hy + 11, 1, 2, '#f0ece0');
  }
  if (M.has('beard')) {
    const bc = shade(h, 0.08);
    if (view === 'down') { R(10, hy + 9, 12, 5, bc); R(11, hy + 14, 10, 2, bc); R(14, hy + 16, 4, 1, bc); R(14, hy + 10, 4, 1, shade(s, -0.3)); }
    if (view === 'side') { R(15, hy + 9, 7, 5, bc); R(16, hy + 14, 5, 2, bc); }
  }
  // hair / hood / helm
  const hood = M.has('hood'), helm = M.has('helm');
  const hc = hood ? cd : helm ? shade(cc, 0.1) : h, hc2 = shade(hc, -0.25), hcl = shade(hc, 0.25);
  if (view === 'down') {
    R(hx - 1, hy - 1, hw + 2, 5, hc); R(hx, hy - 2, hw, 2, hc);
    R(hx - 1, hy + 3, 2, hood ? 11 : 7, hc); R(hx + hw - 1, hy + 3, 2, hood ? 11 : 7, hc2);
    if (!helm) { // fringe
      R(hx + 1, hy + 4, 3, 2, hc); R(hx + 5, hy + 4, 2, 3, hc); R(hx + 8, hy + 4, 3, 2, hc); R(hx + 11, hy + 4, 2, 3, hc2);
    } else { R(15, hy + 3, 2, 5, shade(hc, -0.2)); }
    R(hx + 2, hy - 1, 6, 1, hcl);
    if (hood) { R(hx - 2, hy + 12, hw + 4, 3, cd); }
  } else if (view === 'up') {
    R(hx - 1, hy - 1, hw + 2, 13, hc); R(hx, hy - 2, hw, 2, hc); R(hx, hy + 12, hw, 1, hc2);
    R(hx + hw - 2, hy, 2, 12, hc2); R(hx + 2, hy - 1, 6, 1, hcl);
    if (girl && !hood && !helm) { R(hx + 1, hy + 12, hw - 2, 8, hc); R(hx + hw - 3, hy + 12, 2, 8, hc2); }
  } else {
    R(hx - 1, hy - 1, hw + 1, 5, hc); R(hx, hy - 2, hw - 1, 2, hc);
    R(hx - 1, hy + 3, 6, hood ? 11 : 8, hc); R(hx + 5, hy + 4, 2, 2, hc); R(hx + 8, hy + 4, 3, 2, hc);
    R(hx + 1, hy - 1, 6, 1, hcl);
    if (girl && !hood && !helm) R(hx - 1, hy + 11, 5, 8, hc2);
  }
  // horns
  if (M.has('horns')) {
    const H = (X, Y) => R(X, Y, 2, 2, n);
    if (view === 'side') { H(12, hy - 1); H(11, hy - 3); H(10, hy - 5); R(9, hy - 6, 2, 1, shade(n, -0.2)); }
    else { H(hx, hy - 1); H(hx - 1, hy - 3); H(hx - 2, hy - 5); H(hx + hw - 2, hy - 1); H(hx + hw - 1, hy - 3); H(hx + hw, hy - 5); }
  }
  if (M.has('bones') && view === 'down') { for (let i = 0; i < 3; i++) R(bx + 2, ty + 2 + i * 2, bw - 4, 1, '#6a6860'); }
  return outline(c, UI.ink, false);
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
  golem:  { type: 'golem', g: '#8a8478', d: '#4e4a40', r: '#6af0ff' }
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
  outline(c);
  let out = c;
  if (res !== S) { const [r, rx] = mkCanvas(res, res); rx.imageSmoothingEnabled = false; rx.drawImage(c, 0, 0, res, res); out = r; }
  if (flip) out = flipped(out);
  SpriteCache[key] = out;
  return out;
}

// ---------------------------------------------------------------- tiles
// solid (blocks movement). Z = the boss door (opens after the final battle)
const SOLID = new Set('T~RWDQFSNOrXL#PHZVyCbhetzkAJIUvgiqlw12357789'.split(''));
const ANIMATED = new Set(['~', 'L', 'O', 'z', 'I', 'l', 'v']);
const TALL = new Set('TRWD#VyJIUw58qgiEn9b'.split(''));        // things that cast a shadow on the tile below
const GRASSY = new Set('.,fQFSNOTX2q7'.split(''));
const THEME_GROUND = { grass: '#5ea84a', town: '#8f8a80', cave: '#4a3a30', ash: '#5a5055', castle: '#2a2238', tokyo: '#6a6470', interior: '#7a5a3a' };

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function speckle(x, r, base, cols, n, sz = 2) {
  px(x, base, 0, 0, 32, 32);
  for (let i = 0; i < n; i++) px(x, cols[Math.floor(r() * cols.length)], Math.floor(r() * 16) * 2, Math.floor(r() * 16) * 2, sz, sz);
}
function grassBase(x, r, theme) {
  if (theme === 'ash') { speckle(x, r, '#5a5055', ['#4a4045', '#6a6065', '#544a50'], 40); return; }
  if (theme === 'tokyo') { speckle(x, r, '#4e7a44', ['#426a3a', '#5a8a4e'], 40); return; }
  speckle(x, r, '#5ea84a', ['#529a40', '#6cb656', '#4f9340', '#72bd5a'], 46);
  for (let i = 0; i < 6; i++) { const a = Math.floor(r() * 30), b = Math.floor(r() * 28) + 2; px(x, '#7ccf62', a, b, 1, 2); px(x, '#4a8a3a', a + 1, b + 1, 1, 2); }
}
// mask bits: 1 up, 2 right, 4 down, 8 left (set when that neighbour is "different")
function drawTile(x, ch, theme, v, frame, mask, up) {
  const r = rng(v * 977 + ch.charCodeAt(0) * 131 + frame * 7 + 1);
  const G_ = () => grassBase(x, r, theme);
  const shadowTop = () => { if (TALL.has(up)) { const g = x.createLinearGradient(0, 0, 0, 12); g.addColorStop(0, 'rgba(10,6,20,.45)'); g.addColorStop(1, 'rgba(10,6,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 12); } };
  switch (ch) {
    // ------------------------------------------------ ground
    case '.': G_(); if (v === 0) { px(x, '#8ad870', 8, 10, 2, 2); px(x, '#8ad870', 22, 20, 2, 2); } shadowTop(); break;
    case ',': G_(); for (let i = 0; i < 9; i++) { const a = Math.floor(r() * 28) + 1, b = Math.floor(r() * 18) + 10; px(x, '#2f7428', a, b - 5, 2, 7); px(x, '#46963a', a + 1, b - 6, 1, 5); px(x, '#84d068', a, b - 7, 1, 2); } shadowTop(); break;
    case 'f': G_(); for (const [c, a, b] of [['#f28fad', 6, 8], ['#fff3a0', 22, 12], ['#f28fad', 13, 22], ['#ffffff', 26, 26], ['#a8c8ff', 4, 26]]) { px(x, c, a - 2, b, 5, 1); px(x, c, a, b - 2, 1, 5); px(x, c, a - 1, b - 1, 3, 3); px(x, '#ffd84a', a, b, 1, 1); px(x, '#2f7428', a, b + 3, 1, 3); } shadowTop(); break;
    case '=': case 'd': case 's': case 'j': {
      const base = ch === '=' ? '#c4a468' : ch === 'd' ? '#3e3438' : ch === 's' ? '#a8a49c' : '#9c96a0';
      const cols = ch === '=' ? ['#b4945a', '#d4b47a', '#a8884a', '#bc9c62'] : ch === 'd' ? ['#4a3f44', '#2f2729', '#554a50'] : ch === 's' ? ['#989488', '#b8b4ac', '#8a867c'] : ['#8c8690', '#aca6b0'];
      speckle(x, r, base, cols, 34);
      if (ch === 's') { x.strokeStyle = '#7a766e'; x.lineWidth = 1; x.strokeRect(1.5, 1.5, 29, 29); px(x, '#c0bcb4', 2, 2, 12, 1); }
      if (ch === 'j') { px(x, '#7c7680', 0, 15, 32, 1); px(x, '#7c7680', v % 2 ? 8 : 24, 0, 1, 15); px(x, '#7c7680', v % 2 ? 24 : 8, 16, 1, 16); }
      if (ch === '=' || ch === 'd') { // soft grass fringe where the path meets grass
        const gc = theme === 'ash' || ch === 'd' ? '#5a5055' : '#5ea84a', gd = shade(gc, -0.15);
        const fringe = (horiz, at) => { for (let i = 0; i < 32; i += 2) { const d = 2 + Math.floor(r() * 4); if (horiz) px(x, i % 4 ? gc : gd, i, at ? 32 - d : 0, 2, d); else px(x, i % 4 ? gc : gd, at ? 32 - d : 0, i, d, 2); } };
        if (mask & 1) fringe(true, 0); if (mask & 4) fringe(true, 1); if (mask & 8) fringe(false, 0); if (mask & 2) fringe(false, 1);
      }
      shadowTop(); break;
    }
    case '_': speckle(x, r, '#8f8a80', ['#7f7a70', '#a39e94', '#7a756b'], 26); px(x, '#6e695f', 0, 15, 32, 1); px(x, '#6e695f', v % 2 ? 8 : 22, 0, 1, 15); px(x, '#6e695f', v % 2 ? 22 : 8, 16, 1, 16); px(x, '#a8a398', 1, 1, 12, 1); shadowTop(); break;
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
      x.fillStyle = 'rgba(10,20,10,.35)'; x.beginPath(); x.ellipse(16, 27, 12, 4, 0, 0, 7); x.fill();
      px(x, '#5a3a20', 13, 18, 6, 10); px(x, '#3e2814', 17, 18, 2, 10); px(x, '#7a5230', 14, 19, 1, 8);
      const [c1, c2, c3] = sak ? ['#c8607e', '#e48aa8', '#f6bcd0'] : v % 2 ? ['#24602a', '#327a34', '#4c9a46'] : ['#1f5a28', '#2f7430', '#469242'];
      E(16, 12, 12, c1); E(9, 15, 7, c1); E(23, 15, 7, c1);
      E(15, 10, 10, c2); E(10, 13, 5, c2); E(22, 12, 6, c2);
      E(12, 7, 5, c3); E(19, 9, 3, c3);
      if (sak) for (let i = 0; i < 5; i++) px(x, '#fff0f4', 6 + Math.floor(r() * 20), 4 + Math.floor(r() * 16), 2, 2);
      break;
    }
    case 'X': { speckle(x, r, '#5a5055', ['#4a4045', '#62585c'], 30); x.strokeStyle = '#1e1618'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(16, 31); x.lineTo(16, 12); x.lineTo(9, 5); x.moveTo(16, 16); x.lineTo(24, 8); x.lineTo(26, 3); x.moveTo(16, 21); x.lineTo(8, 16); x.stroke(); x.lineWidth = 1; break; }
    case '~': {
      const g = x.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, '#3a7ad0'); g.addColorStop(1, '#2a5aa8'); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
      const o = frame * 6;
      for (let j = 3; j < 32; j += 8) { px(x, '#7ab4f4', (o + j * 5) % 26, j, 7, 1); px(x, '#1e4a8a', (o * 2 + j * 7 + 10) % 26, j + 3, 5, 1); }
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
      const base = theme === 'town' ? '#5a6a7a' : '#a8413a', dk = shade(base, -0.3), lt = shade(base, 0.2);
      px(x, base, 0, 0, 32, 32);
      for (let j = 0; j < 32; j += 8) { px(x, dk, 0, j + 6, 32, 2); for (let i = (j % 16 ? 4 : 0); i < 32; i += 8) { px(x, lt, i, j, 5, 2); px(x, dk, i + 6, j, 1, 6); } }
      if (mask & 4) { px(x, shade(base, -0.45), 0, 27, 32, 5); px(x, lt, 0, 26, 32, 1); }
      if (mask & 1) px(x, shade(base, 0.35), 0, 0, 32, 2);
      break;
    }
    case 'W': case 'D': case 'E': {
      const wall = theme === 'town' ? '#b8b0a0' : '#e8d8b0', beam = theme === 'town' ? '#5a4a3a' : '#7a5030';
      px(x, wall, 0, 0, 32, 32); px(x, shade(wall, -0.08), 0, 16, 32, 16);
      px(x, beam, 0, 0, 32, 3); px(x, beam, 0, 0, 3, 32); px(x, beam, 29, 0, 3, 32); px(x, shade(beam, -0.2), 0, 29, 32, 3);
      if (TALL.has(up) && up === 'R') { const g = x.createLinearGradient(0, 0, 0, 10); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 10); }
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
    default: px(x, '#ff00ff', 0, 0, 32, 32);
  }
}
function pick2(r, a) { return a[Math.floor(r() * a.length)]; }
function tileCanvas(ch, theme, v, frame, mask = 0, up = '') {
  const key = ch + theme + v + frame + ':' + mask + (TALL.has(up) ? up : '');
  if (TileCache[key]) return TileCache[key];
  const [c, x] = mkCanvas(32, 32);
  drawTile(x, ch, theme, v, frame, mask, up);
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
const LIGHT_TILES = { O: ['rgba(255,150,60,.55)', 90], L: ['rgba(255,90,30,.35)', 48], z: ['rgba(255,150,60,.5)', 110], l: ['rgba(255,236,170,.5)', 96], I: ['rgba(255,220,140,.14)', 40], y: ['rgba(255,220,140,.18)', 50], W: ['rgba(255,220,140,.10)', 36], U: ['rgba(220,240,255,.3)', 60], n: ['rgba(220,240,255,.3)', 60], v: ['rgba(255,240,240,.25)', 40], H: ['rgba(255,40,60,.18)', 80] };
let DarkCanvas = null;
