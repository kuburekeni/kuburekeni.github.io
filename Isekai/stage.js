// =====================================================================
//  stage.js : conversations become little scenes. When someone speaks,
//  the view cuts to a painted backdrop of wherever you are (a tavern,
//  the manor hall, the woods, the Wastes...) with the people talking
//  standing on it: you and your companions on the left, everyone else
//  on the right. The speaker steps forward and talks; everyone else
//  waits a little in shadow. When the talking stops, it cuts back.
// =====================================================================

const BACKDROPS = {};
function stageKind(id) {
  const m = MAPS[id] || {};
  if (/konbini/.test(id)) return 'konbini';
  if (/tavern|_inn|lodge/.test(id)) return 'tavern';
  if (/shop|curio|emporium/.test(id)) return 'shop';
  if (/chapel/.test(id)) return 'chapel';
  if (/palace|manor|ac_hall/.test(id)) return 'hall';
  if (/home|dorm/.test(id)) return 'home';
  if (/ac_lib|ac_arcane/.test(id)) return 'library';
  if (/ac_blade/.test(id)) return 'dojo';
  if (id === 'castle') return 'castle';
  if (id === 'vault') return 'vault';
  if (id === 'mine' || m.theme === 'cave') return 'cave';
  if (id === 'millnight' || m.theme === 'night') return 'night';
  if (id === 'tokyo') return 'tokyo';
  if (id === 'wastes' || m.theme === 'ash') return 'ash';
  if (id === 'ironhold') return 'hold';
  if (id === 'solmere' || id === 'academy') return 'city';
  if (/forest|fern|woods/.test(id) || m.theme === 'forestv') return 'forest';
  return m.interior ? 'home' : 'town';
}
function paintBackdrop(kind, seed) {
  const [cv, c] = mkCanvas(W, H);
  c.imageSmoothingEnabled = true;
  const r = kvRng(seed);
  const floorY = 330;
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const grad = (y0, y1, stops) => { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([p, col]) => g.addColorStop(p, col)); return g; };
  const planks = (y0, base, line) => { R(0, y0, W, H - y0, base); for (let y = y0; y < H; y += 14) { R(0, y, W, 1, line); for (let x = (y / 14 % 2) * 40; x < W; x += 80) R(x, y, 1, 14, line); } };
  const wallBoards = (top, bot, base, line) => { R(0, top, W, bot - top, base); for (let x = 0; x < W; x += 36) R(x, top, 2, bot - top, line); };
  const stoneWall = (top, bot, base, joint) => { R(0, top, W, bot - top, joint); for (let y = top; y < bot; y += 22) for (let x = -((y / 22) % 2) * 30; x < W; x += 60) R(x + 2, y + 2, 56, 18, shade(base, (r() - 0.5) * 0.12)); };
  const window_ = (x, y, w, h, glass) => { R(x - 6, y - 6, w + 12, h + 12, '#3a2618'); R(x, y, w, h, glass); R(x + w / 2 - 2, y, 4, h, '#3a2618'); R(x, y + h / 2 - 2, w, 4, '#3a2618'); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 4, y + 4, w / 2 - 8, h / 2 - 8); };
  const sky = (a, b2) => { c.fillStyle = grad(0, floorY, [[0, a], [1, b2]]); c.fillRect(0, 0, W, floorY); };
  const hills = (y, amp, col, sd) => { const rr = kvRng(sd); c.fillStyle = col; c.beginPath(); c.moveTo(0, H); let yy = y; for (let x = 0; x <= W; x += 16) { yy += (rr() - 0.5) * amp; yy = clamp(yy, y - amp * 2, y + amp); c.lineTo(x, yy); } c.lineTo(W, H); c.fill(); };
  const tree = (x, y, s, col) => { R(x - 4 * s, y - 30 * s, 8 * s, 30 * s, '#4a3020'); c.fillStyle = col; for (const [dx, dy, rr] of [[0, -54, 26], [-18, -38, 20], [18, -38, 20], [0, -30, 22]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, rr * s, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x - 8 * s, y - 62 * s, 10 * s, 0, 7); c.fill(); };
  const house = (x, y, w, h, wall, roof) => { R(x, y - h, w, h, wall); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 10, y - h); c.lineTo(x + w / 2, y - h - 40); c.lineTo(x + w + 10, y - h); c.fill(); R(x + w / 2 - 10, y - 36, 20, 36, '#5a3a22'); R(x + 10, y - h + 16, 18, 16, '#f2d88a'); R(x + w - 28, y - h + 16, 18, 16, '#f2d88a'); };
  const shelf = (x, y, w, rows, items) => { R(x, y, w, rows * 34 + 8, '#5a3418'); for (let i = 0; i < rows; i++) { R(x + 4, y + 4 + i * 34, w - 8, 28, '#3a2210'); for (let k = x + 8; k < x + w - 12; k += 10 + r() * 8) { const hh = 12 + r() * 12; R(k, y + 32 + i * 34 - hh, 7, hh, pick2(r, items)); } R(x, y + 32 + i * 34, w, 4, '#7a4a24'); } };
  switch (kind) {
    case 'tavern': case 'home': {
      wallBoards(0, floorY, kind === 'home' ? '#7a5a40' : '#6a4a30', '#4a3020');
      R(0, 0, W, 26, '#3a2414'); for (let x = 20; x < W; x += 140) R(x, 0, 16, floorY, '#4a2e18');
      planks(floorY, '#8a5e36', '#6a4424');
      // hearth
      R(430, 170, 150, 160, '#5a5a5e'); R(430, 170, 150, 14, '#7a7a80'); R(455, 230, 100, 100, '#1a1210');
      if (kind === 'tavern') { shelf(40, 90, 200, 3, ['#6a8a4a', '#8a3a3a', '#c8a050', '#3a5a8a', '#a8c8e0']); R(20, 250, 280, 80, '#5a3418'); R(20, 250, 280, 10, '#8a5a32'); }
      else { window_(90, 90, 110, 90, '#a8d0f0'); R(250, 240, 120, 90, '#e8e0d0'); R(250, 240, 120, 20, '#7a2a4a'); R(240, 230, 10, 100, '#5a3418'); }
      break;
    }
    case 'shop': case 'konbini': {
      if (kind === 'konbini') { R(0, 0, W, floorY, '#e8eef4'); for (let i = 0; i < 4; i++) shelf(20 + i * 160, 60, 140, 4, ['#e5534b', '#6fb7f2', '#f2c94c', '#7ed36f', '#ffffff', '#f28fad']); R(0, floorY, W, H, '#c8ccd4'); for (let x = 0; x < W; x += 40) R(x, floorY, 1, H, '#b0b4bc'); break; }
      wallBoards(0, floorY, '#7a5a3a', '#5a3a22');
      shelf(20, 50, 260, 4, ['#e5534b', '#6fb7f2', '#f2c94c', '#7ed36f', '#c88aff', '#e8e0d0']);
      shelf(360, 50, 260, 4, ['#8a8a94', '#c8a050', '#a86a3a', '#e8e0d0', '#5a8a3a']);
      planks(floorY, '#8a5e36', '#6a4424');
      break;
    }
    case 'chapel': {
      stoneWall(0, floorY, '#c8c0b0', '#8a8478');
      for (const x of [100, 470]) { c.fillStyle = '#3a2a2a'; c.beginPath(); c.moveTo(x - 50, 260); c.lineTo(x - 50, 110); c.arc(x, 110, 50, Math.PI, 0); c.lineTo(x + 50, 260); c.fill();
        const cols = ['#e5534b', '#f2c94c', '#6fb7f2', '#7ed36f', '#c88aff']; for (let i = 0; i < 18; i++) { c.fillStyle = cols[i % 5]; c.fillRect(x - 44 + (i % 3) * 30, 120 + Math.floor(i / 3) * 24, 26, 20); } }
      c.fillStyle = 'rgba(255,240,200,.18)'; c.beginPath(); c.moveTo(60, 110); c.lineTo(300, floorY); c.lineTo(180, floorY); c.lineTo(20, 250); c.fill();
      R(0, floorY, W, H, '#9a948a'); for (let x = 0; x < W; x += 64) R(x, floorY, 2, H, '#8a8478');
      break;
    }
    case 'hall': case 'castle': case 'vault': case 'library': case 'dojo': {
      const dark = kind === 'castle' || kind === 'vault';
      if (kind === 'library') { wallBoards(0, floorY, '#5a3a22', '#3a2412'); for (let i = 0; i < 4; i++) shelf(10 + i * 160, 30, 150, 8, ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#c8a050', '#6a3a7a', '#e8dcc0']); planks(floorY, '#6a4424', '#4a2e16'); break; }
      if (kind === 'dojo') { wallBoards(0, floorY, '#b8905a', '#8a6a3a'); for (let i = 0; i < 8; i++) { R(60 + i * 70, 120, 4, 120, '#6a4a2a'); R(52 + i * 70, 120, 20, 6, '#c8c8d0'); } R(0, 250, W, 12, '#6a4a2a'); planks(floorY, '#c8a070', '#a8804a'); break; }
      stoneWall(0, floorY, dark ? '#3a2e48' : '#a8a098', dark ? '#1e1628' : '#7a7468');
      for (const x of [120, 320, 520]) { // tall windows / banners
        if (dark) { R(x - 22, 40, 44, 180, '#6a1426'); R(x - 22, 40, 44, 6, '#d8a840'); c.fillStyle = '#6a1426'; c.beginPath(); c.moveTo(x - 22, 220); c.lineTo(x, 200); c.lineTo(x + 22, 220); c.fill(); }
        else { c.fillStyle = '#3a2a2a'; c.beginPath(); c.moveTo(x - 34, 250); c.lineTo(x - 34, 90); c.arc(x, 90, 34, Math.PI, 0); c.lineTo(x + 34, 250); c.fill(); c.fillStyle = '#bfe0ff'; c.beginPath(); c.moveTo(x - 28, 244); c.lineTo(x - 28, 92); c.arc(x, 92, 28, Math.PI, 0); c.lineTo(x + 28, 244); c.fill(); R(x - 2, 60, 4, 186, '#3a2a2a'); }
      }
      if (!dark) { R(220, 30, 200, 26, '#2e3f82'); R(220, 30, 200, 4, '#e0b84a'); }
      R(0, floorY, W, H, dark ? '#241c34' : '#8a8478');
      c.fillStyle = dark ? '#5a1020' : '#2e3f82'; c.beginPath(); c.moveTo(W / 2 - 60, floorY); c.lineTo(W / 2 + 60, floorY); c.lineTo(W / 2 + 160, H); c.lineTo(W / 2 - 160, H); c.fill();
      break;
    }
    case 'cave': {
      c.fillStyle = grad(0, H, [[0, '#1a1418'], [1, '#3a2e2a']]); c.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { c.fillStyle = shade('#4a3a32', (r() - 0.5) * 0.3); c.beginPath(); c.arc(r() * W, r() * floorY, 30 + r() * 60, 0, 7); c.fill(); }
      R(0, floorY, W, H, '#3a2e26'); for (let i = 0; i < 30; i++) R(r() * W, floorY + r() * 140, 6, 3, '#2a201a');
      R(120, 150, 6, 180, '#5a3a22'); R(110, 140, 26, 20, '#2a2a30'); R(114, 144, 18, 12, '#ffd070');
      break;
    }
    case 'night': {
      sky('#060818', '#1a2448');
      for (let i = 0; i < 80; i++) R(r() * W, r() * 220, 2, 2, 'rgba(220,230,255,.7)');
      c.fillStyle = '#f0f0e0'; c.beginPath(); c.arc(520, 80, 30, 0, 7); c.fill();
      hills(250, 14, '#0e1a24', 7); for (let i = 0; i < 9; i++) tree(r() * W, floorY - 10 + r() * 10, 1.4 + r() * 0.6, '#0e2418');
      R(0, floorY, W, H, '#10241a');
      break;
    }
    case 'forest': {
      sky('#9ad0e8', '#d8f0e0');
      for (let i = 0; i < 14; i++) tree(r() * W, 230 + r() * 20, 1 + r() * 0.5, '#4a8a4a');
      for (let i = 0; i < 9; i++) tree(r() * W, 300 + r() * 20, 1.6 + r() * 0.6, '#2f6a32');
      c.fillStyle = 'rgba(255,250,200,.18)'; for (let i = 0; i < 5; i++) { const x = r() * W; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 40, 0); c.lineTo(x + 140, floorY); c.lineTo(x + 60, floorY); c.fill(); }
      R(0, floorY, W, H, '#4f8a3e'); for (let i = 0; i < 60; i++) R(r() * W, floorY + r() * 150, 3, 6, '#3a7030');
      break;
    }
    case 'ash': {
      sky('#2a0a0a', '#a04a2a');
      hills(240, 12, '#3a2226', 3);
      c.fillStyle = '#1a1014'; c.beginPath(); c.moveTo(430, 240); c.lineTo(460, 120); c.lineTo(480, 150); c.lineTo(500, 90); c.lineTo(530, 150); c.lineTo(560, 240); c.fill();   // Castle Vharn
      for (let i = 0; i < 4; i++) { const x = 40 + i * 110; c.fillStyle = '#c8b48a'; c.beginPath(); c.moveTo(x, floorY); c.lineTo(x + 40, floorY - 60); c.lineTo(x + 80, floorY); c.fill(); }
      R(0, floorY, W, H, '#4a4045');
      break;
    }
    case 'hold': {
      stoneWall(0, 200, '#6a6460', '#4a4440');
      sky('#3a3040', '#6a5a5a'); stoneWall(120, floorY, '#8a847a', '#5a5450');
      for (const x of [60, 260, 460]) { R(x, 170, 110, 160, '#5a5450'); R(x + 40, 260, 30, 70, '#3a2a1a'); R(x + 10, 200, 24, 20, '#ffb060'); R(x + 76, 200, 24, 20, '#ffb060'); }
      R(0, floorY, W, H, '#8f8a80');
      break;
    }
    case 'tokyo': {
      sky('#3a2a5a', '#e0806a');
      for (let i = 0; i < 9; i++) { const bw = 60 + r() * 40, bh = 120 + r() * 120, x = i * 74 - 10; R(x, floorY - bh, bw, bh, '#2a2038'); for (let k = 0; k < 12; k++) if (r() < 0.5) R(x + 8 + (k % 3) * 18, floorY - bh + 14 + Math.floor(k / 3) * 24, 8, 10, 'rgba(255,220,150,.7)'); }
      c.strokeStyle = '#1a1420'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 90); c.quadraticCurveTo(W / 2, 130, W, 80); c.stroke();
      R(0, floorY, W, H, '#6a6470');
      break;
    }
    case 'city': {
      sky('#8ac0e8', '#f0e8d0');
      for (let i = 0; i < 6; i++) { const x = 20 + i * 110, h = 130 + r() * 60; R(x, floorY - h, 70, h, '#d8d4c8'); R(x, floorY - h, 12, h, '#b8b4a8'); c.fillStyle = '#3e4e7e'; c.beginPath(); c.moveTo(x - 8, floorY - h); c.lineTo(x + 35, floorY - h - 50); c.lineTo(x + 78, floorY - h); c.fill(); R(x + 26, floorY - h + 30, 18, 24, '#8a7a50'); }
      for (let x = 0; x < W; x += 90) { R(x + 40, 180, 4, 150, '#6a5230'); c.fillStyle = ['#c83a3a', '#2e3f82', '#3a9a4a', '#d8a030'][x / 90 % 4]; c.beginPath(); c.moveTo(x + 44, 184); c.lineTo(x + 70, 194); c.lineTo(x + 44, 204); c.fill(); }
      R(0, floorY, W, H, '#b0a898'); for (let y = floorY; y < H; y += 16) for (let x = (y / 16 % 2) * 20; x < W; x += 40) R(x, y, 38, 14, '#a29a8a');
      break;
    }
    default: { // a village street
      sky('#8ac8f0', '#e0f0e8');
      hills(220, 10, '#8ab8a8', 5); hills(250, 8, '#5a9a5a', 9);
      house(40, floorY, 160, 90, '#e8dcc0', '#b84a3a'); house(420, floorY, 170, 100, '#e0d4b8', '#8a3a3a');
      tree(290, floorY, 1.6, '#3a7a3a'); tree(620, floorY, 1.3, '#4a8a4a');
      R(0, floorY, W, H, '#6aaa4a'); c.fillStyle = '#d8b878'; c.beginPath(); c.moveTo(W / 2 - 80, floorY); c.lineTo(W / 2 + 80, floorY); c.lineTo(W / 2 + 220, H); c.lineTo(W / 2 - 220, H); c.fill();
    }
  }
  // depth and mood
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, floorY, W, 6);
  const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  return cv;
}
function backdropFor(id) {
  const kind = stageKind(id), k = id + '|' + kind;
  if (!BACKDROPS[k]) BACKDROPS[k] = paintBackdrop(kind, [...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0);
  return [BACKDROPS[k], kind];
}
function darkSprite(img) {
  if (img._dark) return img._dark;
  const [c, x] = mkCanvas(img.width, img.height);
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgba(10,6,20,1)'; x.fillRect(0, 0, c.width, c.height);
  return (img._dark = c);
}

// ---------------------------------------------------------------- the stage itself
class StageScene {
  constructor() { this.t0 = TIME; this.actors = []; this.speaker = null; this.idle = 0; this.out = 0; this.closing = false; }
  addActor(key, silent) {
    if (!key || key.startsWith('m:') || key.startsWith('pet:')) return;
    if (!silent) this.speaker = key;
    if (this.actors.some(a => a.key === key)) return;
    const ours = key === 'hero' || key.startsWith('c:');
    this.actors.push({ key, left: ours, t0: TIME });
  }
  get t() { return TIME - this.t0; }
  update(dt) {
    // nothing talking on top of us for a moment: the scene is over
    if (Scenes.top() === this) { this.idle += dt; if (this.idle > 0.3 && !this.closing) this.close(); }
    else this.idle = 0;
    if (this.closing) { this.out += dt; if (this.out > 0.22) { Scenes.remove(this); if (Stage.scene === this) Stage.scene = null; } }
  }
  close() { this.closing = true; }
  layout() {
    // you (and whoever's with you) on the left, everyone else on the right
    const L = this.actors.filter(a => a.left), Rt = this.actors.filter(a => !a.left);
    if (!L.some(a => a.key === 'hero')) L.unshift({ key: 'hero', left: true, t0: this.t0, extra: true });
    const out = [];
    L.sort((a, b) => (a.key === 'hero' ? 0 : 1) - (b.key === 'hero' ? 0 : 1));
    L.slice(0, 3).forEach((a, i) => out.push({ a, x: [170, 70, 262][i], y: 338 + [0, -8, -10][i], size: [184, 150, 150][i], dir: 'right' }));
    Rt.slice(-3).forEach((a, i, arr) => out.push({ a, x: [470, 570, 378][arr.length - 1 - i] || 470, y: 338 - (arr.length - 1 - i) * 8, size: arr.length - 1 - i ? 150 : 184, dir: 'left' }));
    return out;
  }
  draw() {
    const [bd, kind] = backdropFor(G.map);
    const inA = clamp(this.t / 0.22, 0, 1), outA = this.closing ? 1 - clamp(this.out / 0.22, 0, 1) : 1;
    const a = Math.min(inA, outA);
    // the world underneath fades out as the stage fades in
    if (a < 1 && World) { World.draw(); }
    ctx.save(); ctx.globalAlpha = a;
    const drift = Math.sin(this.t * 0.3) * 4;
    ctx.drawImage(bd, drift - 4, 0, W + 8, H);
    this.ambient(kind);
    const talking = Scenes.top() instanceof DialogScene && Scenes.top().chars < Scenes.top().full;
    const slots = this.layout().sort((p, q) => (p.a.key === this.speaker) - (q.a.key === this.speaker));
    for (const s of slots) {
      const sp = s.a.key === this.speaker;
      const enter = easeOut(clamp((TIME - (s.a.t0 || this.t0)) / 0.3, 0, 1));
      const x = s.x + (1 - enter) * (s.dir === 'right' ? -200 : 200);
      const bob = sp && talking ? Math.abs(Math.sin(TIME * 14)) * 3 : Math.sin(TIME * 2 + s.x) * 1;
      const size = s.size * (sp ? 1.04 : 1);
      let img; try { img = charSprite(s.a.key, s.dir, sp && talking && Math.floor(TIME * 7) % 2 ? 1 : 0); } catch (e) { continue; }
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, s.y - 4, size * 0.22, size * 0.05, 0, 0, 7); ctx.fill();
      ctx.imageSmoothingEnabled = false;
      const dx = Math.round(x - size / 2), dy = Math.round(s.y - size - bob);
      ctx.drawImage(img, dx, dy, Math.round(size), Math.round(size));
      if (!sp) { ctx.save(); ctx.globalAlpha = a * 0.42; ctx.drawImage(darkSprite(img), dx, dy, Math.round(size), Math.round(size)); ctx.restore(); }
      else if (talking) { glow(x, s.y - size * 0.55, size * 0.5, 'rgba(255,240,200,.08)'); }
    }
    ctx.restore();
    // letterbox edges slide in
    const lb = 18 * a;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, lb);
    ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, H - 6, W, 6);
    // the place name, briefly
    if (this.t < 2.2 && !this.closing) { ctx.globalAlpha = a * clamp((2.2 - this.t) / 0.5, 0, 1); text(areaName(G.map), 14, lb + 6, 'rgba(255,255,255,.75)', 12, 'left'); ctx.globalAlpha = 1; }
  }
  ambient(kind) {
    const t = this.t;
    if (kind === 'tavern' || kind === 'home') { const f = 0.8 + Math.sin(TIME * 9) * 0.1 + Math.sin(TIME * 23) * 0.05; glow(505, 290, 120 * f, 'rgba(255,150,60,.35)'); for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffd070' : '#f07a2a'; ctx.fillRect(470 + (i * 13) % 70, 300 - ((TIME * 30 + i * 20) % 60), 3, 3); } }
    else if (kind === 'hall' || kind === 'chapel' || kind === 'library') { for (let i = 0; i < 24; i++) { ctx.fillStyle = 'rgba(255,240,200,.35)'; ctx.fillRect((hash2(i, 1) % W + TIME * 6) % W, (hash2(i, 2) % 300 + Math.sin(TIME + i) * 10), 2, 2); } }
    else if (kind === 'castle' || kind === 'vault') { for (let i = 0; i < 20; i++) { ctx.fillStyle = i % 3 ? 'rgba(180,170,170,.5)' : '#ff7a3a'; ctx.fillRect((hash2(i, 1) % W - TIME * 10 + W) % W, (hash2(i, 2) % H + TIME * 16) % H, 2, 2); } }
    else if (kind === 'ash') { for (let i = 0; i < 50; i++) { ctx.fillStyle = i % 6 ? 'rgba(190,180,178,.6)' : '#ffa040'; ctx.fillRect((hash2(i, 3) % W - TIME * 30 + W * 4) % W, (hash2(i, 4) % H + TIME * 22) % H, 2, 2); } }
    else if (kind === 'forest' || kind === 'town' || kind === 'city') {
      for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,255,255,.55)'; const x = ((hash2(i, 9) % W) + TIME * 8) % (W + 200) - 100; ctx.beginPath(); ctx.ellipse(x, 50 + i * 26, 60, 12, 0, 0, 7); ctx.fill(); }
    } else if (kind === 'night') { for (let i = 0; i < 16; i++) { const a = 0.5 + Math.sin(TIME * 3 + i) * 0.5; ctx.fillStyle = `rgba(220,255,140,${a})`; ctx.fillRect((hash2(i, 5) % W + Math.sin(TIME + i) * 20), 200 + (hash2(i, 6) % 140), 3, 3); } }
    // weather, if you're outdoors in it
    const outdoors = !(MAPS[G.map] || {}).interior && !['cave', 'vault', 'castle'].includes(kind);
    if (outdoors && Weather.raining()) { ctx.strokeStyle = 'rgba(190,210,255,.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 90; i++) { const x = (hash2(i, 7) % W + TIME * 80) % W, y = (hash2(i, 8) % H + TIME * 700) % H; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); } ctx.stroke(); ctx.fillStyle = 'rgba(40,50,80,.2)'; ctx.fillRect(0, 0, W, H); }
    if (outdoors && Weather.kind === 'ashfall' && kind !== 'ash') { for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(190,180,178,.6)'; ctx.fillRect((hash2(i, 3) % W - TIME * 20 + W * 4) % W, (hash2(i, 4) % H + TIME * 18) % H, 2, 2); } }
    void t;
  }
}
const Stage = {
  scene: null,
  // put people on stage before anyone speaks (weddings, courts, crowds)
  cast(keys) {
    if (!this.enabled() || !World) return;
    if (!(this.scene && Scenes.stack.includes(this.scene))) {
      if (!(Scenes.top() instanceof WorldScene)) return;
      this.scene = new StageScene(); Scenes.push(this.scene);
    }
    for (const k of keys) this.scene.addActor(k, true);
  },
  enabled() { return !(typeof Gfx !== 'undefined' && Gfx.stage === false); },
  // called whenever a line of dialogue is about to be shown
  onLine(spr) {
    if (!this.enabled() || !G || !World) return;
    const top = Scenes.top();
    if (this.scene && Scenes.stack.includes(this.scene)) {
      if (this.scene.closing && top === this.scene) { this.scene.closing = false; this.scene.out = 0; }
      if (spr) this.scene.addActor(spr);
      return;
    }
    // only open over the walking-around view, and only when a person is speaking
    if (!spr || spr.startsWith('m:') || spr.startsWith('pet:') || !(top instanceof WorldScene)) return;
    const s = new StageScene();
    s.addActor(spr);
    this.scene = s;
    Scenes.push(s);
  }
};
{
  const push0 = Scenes.push.bind(Scenes);
  Scenes.push = function (s) {
    if (s instanceof DialogScene) Stage.onLine(s.spr);
    return push0(s);
  };
}

// ---------------------------------------------------------------- a settings switch, for anyone who prefers the old way
if (typeof Gfx !== 'undefined' && Gfx.stage === undefined) Gfx.stage = true;
{
  const sm0 = settingsMenu;
  settingsMenu = async function () {
    // add a toggle row at the top of the usual settings list
    const c = await list({ x: 196, y: 16, w: W - 224, title: 'Settings', rows: 3, items: [
      { label: 'Dialogue scenes', right: Gfx.stage ? 'On' : 'Off', desc: 'Conversations cut to a painted scene of where you are, with the people talking on stage.' },
      { label: 'Sound, graphics & controls…', desc: 'Everything else.' }
    ] });
    if (c === 0) { Gfx.stage = !Gfx.stage; try { saveSettings(); } catch (e) { } Sound.sfx('ok'); return settingsMenu(); }
    if (c === 1) return sm0();
  };
}

// ---------------------------------------------------------------- small fixes that ride along
// recruiting someone refreshes who's standing around, so they don't stay rooted to the spot
{
  const jp0 = joinParty;
  joinParty = async function (id, m) { const ok = await jp0(id, m); if (World) World.refreshNpcs(); return ok; };
}
// people who live in Castle Vharn once there's peace
MAPS.castle.npcs.push(
  { id: 'vharnCook', x: 20, y: 17, spr: 'demonf', dir: 'down', script: 'crowd', name: 'Castle Cook', show: 'end_deal', wander: 1, lines: [`We have flour now. Real flour, from Aldmere. I keep touching it.`, `The kitchen's warm again. Sit, sit. You look like you've walked through the Wastes. You have, haven't you.`] },
  { id: 'vharnArchivist', x: 4, y: 4, spr: 'demonm', dir: 'down', script: 'crowd', name: 'Royal Archivist', show: 'end_deal', lines: [`Eleven heroes, in our records. Eleven entries that end the same way. Yours will not. I've left the page blank.`, `These shelves survived the Burning. So did I, in a manner of speaking.`] },
  { id: 'vharnGuard', x: 4, y: 24, spr: 'dknight', dir: 'right', script: 'crowd', name: 'Off-duty Knight', show: 'end_deal', wander: 1, lines: [`I was going to kill you, you know. Nothing personal. Now I'm going to learn to fish.`] }
);
