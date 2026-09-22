// =====================================================================
//  engine.js : canvas, input, timers, sprites, tiles, UI, scenes, save
// =====================================================================
const W = 640, H = 480, TS = 32;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
let TIME = 0;
const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

function fitCanvas() {
  const res = typeof Controls !== 'undefined' ? Controls.reserve() : 0; // room for touch controls in portrait
  const s = Math.min(window.innerWidth / W, (window.innerHeight - res) / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  document.body.style.paddingBottom = res + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// ------------------------------------------------------------------ input
const Input = {
  down: new Set(), pressedSet: new Set(), typed: [],
  map: {
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    ok: ['KeyZ', 'Enter', 'Space'], cancel: ['KeyX', 'Backspace', 'Escape'],
    menu: ['Escape', 'KeyM', 'KeyC'], run: ['ShiftLeft', 'ShiftRight']
  },
  held(a) { return this.map[a].some(k => this.down.has(k)); },
  pressed(a) { return this.map[a].some(k => this.pressedSet.has(k)); },
  endFrame() { this.pressedSet.clear(); this.typed.length = 0; }
};
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace'].includes(e.code)) e.preventDefault();
  const dirKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code);
  if (!e.repeat || dirKey || e.code === 'Backspace') Input.pressedSet.add(e.code);
  Input.down.add(e.code);
  if (e.key.length === 1) Input.typed.push(e.key);
  else if (e.key === 'Backspace') Input.typed.push('\b');
  Sound.unlock();
});
window.addEventListener('keyup', e => Input.down.delete(e.code));
window.addEventListener('blur', () => Input.down.clear());
canvas.addEventListener('mousedown', () => Sound.unlock());

// ------------------------------------------------------------------ timers & tweens
const Timers = {
  list: [],
  update(dt) {
    const l = this.list; this.list = [];
    const keep = [];
    for (const t of l) {
      t.t += dt;
      if (t.step) t.step(Math.min(1, t.t / t.dur));
      if (t.t >= t.dur) t.done(); else keep.push(t);
    }
    this.list = keep.concat(this.list);
  }
};
function wait(sec) { return new Promise(res => Timers.list.push({ t: 0, dur: sec, done: res })); }
function tween(obj, props, dur, ease = e => e) {
  const from = {}; for (const k in props) from[k] = obj[k];
  return new Promise(res => Timers.list.push({
    t: 0, dur, done: () => { Object.assign(obj, props); res(); },
    step: p => { const e = ease(p); for (const k in props) obj[k] = from[k] + (props[k] - from[k]) * e; }
  }));
}
const easeOut = p => 1 - (1 - p) * (1 - p);
const easeIn = p => p * p;

// ------------------------------------------------------------------ helpers
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0); }
function weighted(list) { // [[id, weight], ...]
  const tot = list.reduce((a, b) => a + b[1], 0); let r = Math.random() * tot;
  for (const [id, w] of list) { if ((r -= w) <= 0) return id; }
  return list[0][0];
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function shade(hex, amt) { // amt -1..1
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}

// ------------------------------------------------------------------ sprites
const SpriteCache = {};
function paintTemplate(rows, pal) {
  const [c, x] = mkCanvas(16, 16);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const k = rows[j][i];
    if (k === '.' || k === ' ') continue;
    x.fillStyle = pal[k] || (k === 'k' ? UI.ink : k === 'e' ? UI.ink : k === 'w' ? '#ffffff' : '#ff00ff');
    x.fillRect(i, j, 1, 1);
  }
  return c;
}
function flipped(c) {
  const [f, x] = mkCanvas(c.width, c.height);
  x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f;
}
function charDef(key) {
  if (key === 'hero') {
    return { pal: { h: G.hair || '#1e1a26', s: SKIN, c: '#2b3a67', d: '#1b2440', p: G.gender === 'girl' ? SKIN : '#1b2440', b: '#111' }, mods: G.gender === 'girl' ? ['girl'] : [] };
  }
  return CHARS[key];
}
// dir: down/up/left/right, frame: 0 stand, 1 step, 2 step-mirror
function charSprite(key, dir, frame) {
  if (key.startsWith('m:')) return monsterSprite(key.slice(2), dir === 'left');
  const heroTag = key === 'hero' ? (G.hair + G.gender) : '';
  const id = key + heroTag + dir + frame;
  if (SpriteCache[id]) return SpriteCache[id];
  const def = charDef(key);
  const base = dir === 'left' || dir === 'right' ? 'side' : dir;
  let rows = HUMAN[base].slice();
  if (frame > 0) { const st = STEP[base]; for (const r in st) rows[r] = st[r]; }
  rows = rows.map(r => r.split(''));
  for (const m of def.mods || []) for (const [x, y, k] of MODS[m][base]) rows[y][x] = k;
  if (key === 'hero' && G.gender === 'girl' && base !== 'up') { // skirt
    rows[12] = rows[12].map(k => k === 'd' ? 'c' : k);
  }
  let c = paintTemplate(rows.map(r => r.join('')), Object.assign({ k: UI.ink, e: UI.ink }, def.pal));
  if (dir === 'left') c = flipped(c);
  if (frame === 2 && base !== 'side') c = flipped(c);
  if (frame === 2 && base === 'side') c = charSprite(key, dir, 1);
  SpriteCache[id] = c;
  return c;
}
function monsterSprite(id, flip) {
  const key = 'mon_' + id + (flip ? 'f' : '');
  if (SpriteCache[key]) return SpriteCache[key];
  const m = MONSTERS[id];
  let c = paintTemplate(MONSTER_TPL[m.tpl], Object.assign({ k: UI.ink }, m.pal));
  if (flip) c = flipped(c);
  SpriteCache[key] = c; return c;
}
function whiteSilhouette(c) {
  const key = c; if (c._white) return c._white;
  const [w, x] = mkCanvas(c.width, c.height);
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  c._white = w; return w;
}

// ------------------------------------------------------------------ tiles
const SOLID = new Set('T~RWDQFSNOr#PHXL'.split(''));
const TileCache = {};
const THEME_GROUND = { grass: '#5ea84a', town: '#8f8a80', cave: '#4a3a30', ash: '#5a5055', castle: '#2a2238' };
function px(x, c, X, Y, w = 1, h = 1) { x.fillStyle = c; x.fillRect(X, Y, w, h); }
function speckle(x, r, base, cols, n) {
  px(x, base, 0, 0, 16, 16);
  for (let i = 0; i < n; i++) px(x, cols[Math.floor(r() * cols.length)], Math.floor(r() * 16), Math.floor(r() * 16));
}
function drawTileArt(x, ch, theme, v, frame) {
  const r = mulberry(v * 97 + ch.charCodeAt(0) * 13 + frame * 7);
  const grass = () => speckle(x, r, '#5ea84a', ['#4f9a3e', '#6fbd57', '#4f9a3e'], 22);
  switch (ch) {
    case '.': grass(); if (v === 0) { px(x, '#7ccf62', 4, 5); px(x, '#7ccf62', 11, 10); } break;
    case ',': grass(); for (let i = 0; i < 7; i++) { const a = Math.floor(r() * 14) + 1, b = Math.floor(r() * 10) + 4; px(x, '#3f8a32', a, b, 1, 3); px(x, '#7ccf62', a, b - 1); } break;
    case 'f': grass(); [['#f28fad', 3, 4], ['#fff3a0', 11, 6], ['#f28fad', 7, 11], ['#ffffff', 13, 13]].forEach(([c, a, b]) => { px(x, c, a, b); px(x, c, a - 1, b); px(x, c, a + 1, b); px(x, c, a, b - 1); px(x, c, a, b + 1); px(x, '#ffd84a', a, b); }); break;
    case 'T':
      grass();
      px(x, 'rgba(0,0,0,.25)', 3, 12, 11, 3);
      px(x, '#6a4526', 7, 10, 3, 5);
      px(x, '#2f6b2a', 2, 3, 12, 8); px(x, '#2f6b2a', 4, 1, 8, 11);
      px(x, '#3f8a38', 3, 3, 9, 6); px(x, '#3f8a38', 5, 2, 6, 8);
      px(x, '#5aa84a', 5, 3, 3, 2); px(x, '#5aa84a', 4, 5, 2, 1);
      px(x, UI.ink, 2, 11, 1, 1); break;
    case '=': speckle(x, r, '#c8a86a', ['#b8985a', '#d8b87a', '#a8884a'], 18); break;
    case 'd': speckle(x, r, '#3e3438', ['#4a3f44', '#2f2729', '#554a50'], 20); break;
    case '~': {
      px(x, '#3a78c8', 0, 0, 16, 16);
      const o = frame ? 4 : 0;
      for (let j = 2; j < 16; j += 5) { px(x, '#6aa8f0', (o + j * 3) % 12, j, 4, 1); px(x, '#2a5a9a', (o + j * 5 + 6) % 12, j + 2, 3, 1); }
      break;
    }
    case 'B': px(x, '#3a78c8', 0, 0, 16, 16); px(x, '#8a5a32', 0, 1, 16, 14); for (let i = 0; i < 16; i += 4) px(x, '#6a4020', i, 1, 1, 14); px(x, '#b07a48', 0, 1, 16, 1); px(x, '#5a3418', 0, 14, 16, 1); break;
    case 'R': px(x, '#a8413a', 0, 0, 16, 16); for (let j = 0; j < 16; j += 4) { px(x, '#7e2e2a', 0, j + 3, 16, 1); for (let i = (j % 8 ? 2 : 0); i < 16; i += 4) px(x, '#c85a4a', i, j, 2, 1); } break;
    case 'W': px(x, '#e8d8b0', 0, 0, 16, 16); px(x, '#7a5030', 0, 0, 16, 2); px(x, '#7a5030', 0, 0, 2, 16); px(x, '#7a5030', 14, 0, 2, 16); px(x, '#6a9ad8', 5, 5, 6, 5); px(x, '#7a5030', 7, 5, 1, 5); px(x, '#7a5030', 5, 7, 6, 1); break;
    case 'D': px(x, '#e8d8b0', 0, 0, 16, 16); px(x, '#7a5030', 0, 0, 16, 2); px(x, '#5a3418', 3, 2, 10, 14); px(x, '#7a4a28', 4, 3, 8, 13); px(x, '#f2c94c', 10, 9, 1, 2); break;
    case 'Q': grass(); px(x, '#6a4526', 3, 9, 2, 7); px(x, '#6a4526', 11, 9, 2, 7); px(x, '#8a5a32', 1, 2, 14, 9); px(x, '#b07a48', 2, 3, 12, 7); px(x, '#f3e6c4', 3, 4, 4, 3); px(x, '#f3e6c4', 8, 5, 4, 4); px(x, '#e5534b', 5, 4, 1, 1); px(x, '#e5534b', 10, 5, 1, 1); break;
    case 'F': grass(); px(x, '#b07a48', 0, 6, 16, 2); px(x, '#b07a48', 0, 11, 16, 2); px(x, '#8a5a32', 2, 3, 2, 12); px(x, '#8a5a32', 12, 3, 2, 12); break;
    case 'S': (theme === 'ash' ? speckle(x, r, '#5a5055', ['#4a4045', '#6a6065'], 20) : theme === 'town' ? speckle(x, r, '#8f8a80', ['#7f7a70', '#9f9a90'], 20) : grass()); px(x, '#6a4526', 7, 8, 2, 8); px(x, '#b07a48', 2, 2, 12, 7); px(x, '#8a5a32', 2, 8, 12, 1); px(x, '#5a3418', 4, 4, 8, 1); px(x, '#5a3418', 4, 6, 6, 1); break;
    case 'N': { const g = theme === 'ash' ? '#5a5055' : '#5ea84a'; px(x, g, 0, 0, 16, 16); px(x, '#8a6a3a', 1, 5, 14, 11); px(x, '#a8844a', 3, 3, 10, 13); px(x, '#6a4a22', 7, 2, 2, 14); px(x, '#2a1a0a', 6, 10, 4, 6); break; }
    case 'O': { const g = theme === 'ash' ? '#5a5055' : '#5ea84a'; px(x, g, 0, 0, 16, 16); px(x, '#555', 3, 11, 10, 3); px(x, '#6a4526', 4, 10, 8, 2); px(x, '#e5534b', 5, 5 - frame, 6, 6); px(x, '#f2c94c', 6, 7 - frame, 4, 4); px(x, '#fff3a0', 7, 9, 2, 2); break; }
    case '_': speckle(x, r, '#8f8a80', ['#7f7a70', '#a39e94', '#7a756b'], 16); px(x, '#7a756b', 0, 7, 16, 1); px(x, '#7a756b', v % 2 ? 4 : 11, 0, 1, 7); px(x, '#7a756b', v % 2 ? 11 : 4, 8, 1, 8); break;
    case 'r': {
      const g = THEME_GROUND[theme] || '#4a3a30';
      if (theme === 'cave') { speckle(x, r, '#3a2e28', ['#4a3c34', '#2a201c', '#554438'], 30); px(x, '#221a16', 0, 14, 16, 2); px(x, '#5a4a3e', 0, 0, 16, 1); }
      else { speckle(x, r, g, [shade(g, -0.2)], 10); px(x, '#6a6a72', 1, 3, 14, 12); px(x, '#8a8a92', 3, 2, 10, 10); px(x, '#a8a8b0', 4, 3, 5, 3); px(x, '#4a4a52', 1, 13, 14, 2); }
      break;
    }
    case 'M': px(x, '#8f8a80', 0, 0, 16, 16); px(x, '#6a4526', 0, 0, 16, 3); px(x, '#6a4526', 0, 0, 2, 16); px(x, '#6a4526', 14, 0, 2, 16); px(x, '#120c0a', 2, 3, 12, 13); break;
    case 'c': speckle(x, r, '#5a4638', ['#4e3c30', '#665244', '#4a3a2e'], 22); break;
    case 'a': speckle(x, r, '#5a5055', ['#4a4045', '#6a6065', '#554a50'], 22); if (v === 1) px(x, '#e5534b', 6, 9); break;
    case 'X': speckle(x, r, '#5a5055', ['#4a4045'], 12); px(x, '#2a1f22', 7, 5, 2, 11); px(x, '#2a1f22', 3, 4, 4, 1); px(x, '#2a1f22', 3, 2, 1, 2); px(x, '#2a1f22', 9, 7, 4, 1); px(x, '#2a1f22', 12, 4, 1, 3); px(x, '#2a1f22', 6, 2, 1, 3); break;
    case 'L': {
      px(x, '#c8321a', 0, 0, 16, 16);
      const o = frame ? 3 : 0;
      for (let i = 0; i < 6; i++) px(x, i % 2 ? '#f2c94c' : '#f07a2a', (i * 5 + o) % 14, (i * 7 + o) % 14, 3, 2);
      break;
    }
    case '#': px(x, '#2e2440', 0, 0, 16, 16); for (let j = 0; j < 16; j += 4) { px(x, '#1e1630', 0, j + 3, 16, 1); for (let i = (j % 8 ? 4 : 0); i < 16; i += 8) px(x, '#1e1630', i, j, 1, 3); } px(x, '#3e3456', 1, 0, 6, 1); break;
    case 'p': px(x, '#3a3050', 0, 0, 16, 16); px(x, '#2e2640', 0, 0, 16, 1); px(x, '#2e2640', 0, 0, 1, 16); px(x, '#453b5e', 1, 1, 6, 6); px(x, '#453b5e', 9, 9, 6, 6); break;
    case 'P': px(x, '#3a3050', 0, 0, 16, 16); px(x, 'rgba(0,0,0,.35)', 3, 13, 12, 3); px(x, '#6a6078', 3, 0, 10, 15); px(x, '#8a8098', 4, 0, 3, 15); px(x, '#4a4058', 11, 0, 2, 15); px(x, '#8a8098', 2, 13, 12, 2); break;
    case 'K': px(x, '#7a1a2a', 0, 0, 16, 16); px(x, '#f2c94c', 0, 0, 1, 16); px(x, '#f2c94c', 15, 0, 1, 16); px(x, '#9a2a3a', 3, 0, 1, 16); px(x, '#9a2a3a', 12, 0, 1, 16); break;
    case 'H': px(x, '#3a3050', 0, 0, 16, 16); px(x, '#5a1020', 1, 0, 14, 16); px(x, '#f2c94c', 1, 0, 14, 2); px(x, '#8a1a30', 3, 3, 10, 10); px(x, '#f2c94c', 0, 12, 16, 4); break;
    case 'G': px(x, '#2e2440', 0, 0, 16, 16); px(x, '#0a0610', 2, 2, 12, 14); px(x, '#6a1020', 2, 2, 12, 1); px(x, '#6a1020', 2, 2, 1, 14); px(x, '#6a1020', 13, 2, 1, 14); break;
    default: px(x, '#ff00ff', 0, 0, 16, 16);
  }
}
function tileCanvas(ch, theme, v, frame) {
  const key = ch + theme + v + frame;
  if (TileCache[key]) return TileCache[key];
  const [c, x] = mkCanvas(16, 16);
  drawTileArt(x, ch, theme, v, frame);
  TileCache[key] = c; return c;
}
const ANIMATED = new Set(['~', 'L', 'O']);

// ------------------------------------------------------------------ text & windows
function setFont(size = 16, bold = true) { ctx.font = (bold ? 'bold ' : '') + size + 'px ' + FONT; }
function text(str, x, y, col = UI.paper, size = 16, align = 'left', bold = true) {
  setFont(size, bold);
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = col; ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}
function textWidth(str, size = 16) { setFont(size); return ctx.measureText(str).width; }
function wrap(str, maxW, size = 16) {
  setFont(size);
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}
function drawWindow(x, y, w, h, alpha = 0.94) {
  x = Math.round(x); y = Math.round(y);
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, UI.win); g.addColorStop(1, UI.win2);
  ctx.fillStyle = g; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = UI.ink; ctx.fillRect(x, y + 2, 2, h - 4); ctx.fillRect(x + w - 2, y + 2, 2, h - 4); ctx.fillRect(x + 2, y, w - 4, 2); ctx.fillRect(x + 2, y + h - 2, w - 4, 2);
  ctx.strokeStyle = UI.paper; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = UI.sakura; ctx.fillRect(x + 3, y + 3, 4, 4); ctx.fillRect(x + w - 7, y + 3, 4, 4); ctx.fillRect(x + 3, y + h - 7, 4, 4); ctx.fillRect(x + w - 7, y + h - 7, 4, 4);
  ctx.restore();
}
function drawCursor(x, y) {
  const b = Math.sin(TIME * 10) * 2;
  ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.moveTo(x + b - 1, y - 1); ctx.lineTo(x + 11 + b, y + 7); ctx.lineTo(x + b - 1, y + 15); ctx.fill();
  ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(x + b, y + 1); ctx.lineTo(x + 9 + b, y + 7); ctx.lineTo(x + b, y + 13); ctx.fill();
}
function bar(x, y, w, h, v, max, col) {
  ctx.fillStyle = UI.ink; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#3a3050'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, Math.round(w * clamp(v / max, 0, 1))), h);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, y, Math.round(w * clamp(v / max, 0, 1)), 1);
}

// ------------------------------------------------------------------ scenes
const Scenes = {
  stack: [],
  push(s) { this.stack.push(s); if (s.enter) s.enter(); return s; },
  pop() { const s = this.stack.pop(); if (s && s.exit) s.exit(); return s; },
  remove(s) { const i = this.stack.indexOf(s); if (i >= 0) { this.stack.splice(i, 1); if (s.exit) s.exit(); } },
  top() { return this.stack[this.stack.length - 1]; },
  clear() { while (this.stack.length) this.pop(); },
  draw() {
    let i = this.stack.length - 1;
    while (i > 0 && this.stack[i].transparent) i--;
    for (; i < this.stack.length; i++) this.stack[i].draw();
  }
};

const Fade = { a: 0, col: '#000' };
async function fadeOut(d = 0.35, col = '#000') { Fade.col = col; await tween(Fade, { a: 1 }, d); }
async function fadeIn(d = 0.35) { await tween(Fade, { a: 0 }, d); }
function drawFade() { if (Fade.a > 0) { ctx.globalAlpha = Fade.a; ctx.fillStyle = Fade.col; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } }

// toast (small popup that does not block)
const Toasts = [];
function toast(msg, col = UI.paper) { Toasts.push({ msg, col, t: 0 }); }
function drawToasts(dt) {
  let y = 12;
  for (let i = Toasts.length - 1; i >= 0; i--) {
    const t = Toasts[i]; t.t += dt;
    if (t.t > 2.6) { Toasts.splice(i, 1); continue; }
  }
  for (const t of Toasts) {
    const w = textWidth(t.msg, 14) + 28;
    const a = t.t < 0.2 ? t.t / 0.2 : t.t > 2.2 ? (2.6 - t.t) / 0.4 : 1;
    ctx.globalAlpha = a;
    drawWindow(W - w - 12, y, w, 32);
    text(t.msg, W - w + 2, y + 8, t.col, 14);
    ctx.globalAlpha = 1;
    y += 36;
  }
}

// ------------------------------------------------------------------ save
const SAVE_KEY = 'isekai_save_v1';
const SETTINGS_KEY = 'isekai_settings_v1';
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function saveGame(noCloud) {
  try { G.savedAt = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G)); }
  catch (e) { return false; }
  if (!noCloud && typeof Cloud !== 'undefined' && Cloud.code) Cloud.push(true).then(ok => toast(ok ? 'Cloud synced ☁' : 'Offline — will sync later', ok ? UI.mp : UI.dim));
  return true;
}
function loadGame() {
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; G = Object.assign(newGameState(), JSON.parse(s)); return true; }
  catch (e) { return false; }
}
function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); Object.assign(Sound.vol, s); } catch (e) { }
}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(Sound.vol)); } catch (e) { } }
