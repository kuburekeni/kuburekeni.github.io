// =====================================================================
//  engine.js : canvas, input, timers, sprites, tiles, UI, scenes, save
// =====================================================================
let W = 640, H = 480;            // the drawing surface; W widens on wide screens so fullscreen has no bars
const BASE_W = 640, TS = 32;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
let TIME = 0;
const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

// Match the drawing surface to the window's shape so going fullscreen fills the screen
// edge to edge instead of sitting inside black bars. Height stays 480; width grows.
function setViewport() {
  const res = typeof Controls !== 'undefined' ? Controls.reserve() : 0;
  const availH = Math.max(160, window.innerHeight - res);
  const aspect = window.innerWidth / availH;
  const wide = typeof Controls === 'undefined' || Controls.mode !== 'touch' || !!document.fullscreenElement;
  let w = BASE_W;
  if (wide && aspect > 1.34) w = clamp(Math.round(H * aspect / 2) * 2, BASE_W, 960);
  if (w === W) return false;
  W = w;
  canvas.width = W;
  ctx.imageSmoothingEnabled = false;
  if (typeof DarkCanvas !== 'undefined') DarkCanvas = null;
  if (typeof FX !== 'undefined') FX.resize();
  return true;
}
function fitCanvas() {
  setViewport();
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
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
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
    if (!this.stack.length) return;
    let i = this.stack.length - 1;
    while (i > 0 && this.stack[i].transparent) i--;
    for (; i < this.stack.length; i++) if (this.stack[i]) this.stack[i].draw();
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
const SAVE_KEY = 'isekai_save_v3';   // v3 = "Born Again" (earlier saves are not compatible)
const SETTINGS_KEY = 'isekai_settings_v2';
// graphics options (saved with the sound settings)
const Gfx = { bloom: true, weather: true, drops: true, flare: true, shake: true };
function validSave(d) { return d && d.ver >= 3 && d.party && d.party.length; }
function hasSave() { try { const s = localStorage.getItem(SAVE_KEY); return !!s && validSave(JSON.parse(s)); } catch (e) { return false; } }
function saveGame(noCloud) {
  if (!G || G.flags.noSave) return false;
  try { G.savedAt = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G)); }
  catch (e) { return false; }
  if (!noCloud && typeof Cloud !== 'undefined' && Cloud.code) Cloud.push(true).then(ok => toast(ok ? 'Cloud synced \u2601' : 'Offline \u2014 will sync later', ok ? UI.mp : UI.dim));
  return true;
}
function loadGame() {
  try {
    const s = localStorage.getItem(SAVE_KEY); if (!s) return false;
    const d = JSON.parse(s); if (!validSave(d)) return false;
    G = Object.assign(newGameState(), d); return true;
  } catch (e) { return false; }
}
// permadeath: erase the save on this device and in the cloud
async function wipeSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  if (typeof Cloud !== 'undefined' && Cloud.code) {
    try { await Cloud.rpc('isekai_delete', { p_code: Cloud.code }); Cloud.pending = false; }
    catch (e) { try { localStorage.setItem('isekai_cloud_wipe', '1'); } catch (_) { } }
  }
}
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (s.vol) Object.assign(Sound.vol, s.vol); else Object.assign(Sound.vol, s);
    if (s.gfx) Object.assign(Gfx, s.gfx);
  } catch (e) { }
}
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ vol: Sound.vol, gfx: Gfx })); } catch (e) { } }
