// =====================================================================
//  travel.js : the road between places — the party walks, the country
//  changes around them, and things happen on the way
// =====================================================================

const NODES = {
  valenford: { name: 'Valenford', map: 'valenford', at: [23, 35, 'up'] },
  brookvale: { name: 'Brookvale', map: 'brookvale', at: [1, 15, 'right'], from: { village: [42, 15, 'left'], fernhollow: [42, 15, 'left'] } },
  village: { name: 'Aldmere', map: 'village', at: [28, 9, 'left'] },
  forest: { name: 'Whisperwood', map: 'forest', at: [1, 12, 'right'], from: { ironhold: [34, 1, 'down'], wastes: [34, 1, 'down'] } },
  fernhollow: { name: 'Fernhollow', map: 'fernhollow', at: [1, 10, 'right'] },
  solmere: { name: 'Solmere', map: 'solmere', at: [25, 39, 'up'] },
  ironhold: { name: 'Ironhold', map: 'ironhold', at: [14, 19, 'up'] },
  wastes: { name: 'The Ashen Wastes', map: 'wastes', at: [2, 13, 'right'] }
};

// [a, b, minutes of walking (seconds of animation), route from a to b]
const EDGES = [
  ['valenford', 'brookvale', 13, 'farm'],
  ['valenford', 'solmere', 17, 'city'],
  ['brookvale', 'village', 13, 'farm'],
  ['brookvale', 'fernhollow', 15, 'farm2forest'],
  ['village', 'solmere', 16, 'city'],
  ['village', 'forest', 10, 'farm2forest'],
  ['fernhollow', 'forest', 12, 'forest'],
  ['forest', 'ironhold', 14, 'mountain'],
  ['forest', 'wastes', 18, 'rift']
];
const REVERSE = { farm: 'farm', forest: 'forest', farm2forest: 'forest2farm', forest2farm: 'farm2forest', city: 'fromcity', fromcity: 'city', mountain: 'frommountain', frommountain: 'mountain', rift: 'fromrift', fromrift: 'rift' };

function edgeBetween(a, b) {
  for (const [x, y, d, k] of EDGES) {
    if (x === a && y === b) return { dur: d, kind: k };
    if (y === a && x === b) return { dur: d, kind: REVERSE[k] || k };
  }
  return null;
}
function routeLocked(a, b) {
  if ((a === 'forest' && b === 'ironhold') || (a === 'ironhold' && b === 'forest')) {
    if (!G.flags.chief) return 'The goblins hold the north road. Clear the camp in Whisperwood first.';
  }
  if ((a === 'forest' && b === 'wastes')) {
    if (!G.flags.golem) return 'The Rift is sealed. The dwarves say the Warden beneath Ironhold holds the stone that opens it.';
  }
  return null;
}

// the exit warp asked for the road: pick where to go
async function travelFrom(warp) {
  const here = MAPS[G.map].node;
  const dests = warp.dests.filter(d => NODES[d]);
  const items = dests.map(d => {
    const e = edgeBetween(here, d);
    const lock = routeLocked(here, d);
    return {
      label: NODES[d].name, right: lock ? '✕' : `${e ? e.dur : 10} min`,
      disabled: !!lock,
      desc: lock || `Walk to ${NODES[d].name}. ${ROUTE_DESC[e ? e.kind : 'farm'] || ''}`
    };
  });
  items.push({ label: 'Stay here', desc: 'Turn back into town.' });
  const i = await list({ x: 16, y: 16, w: 330, items, title: 'Where to?', rows: 6 });
  const p = World.player;
  // step back off the road tile either way
  const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[p.dir] || [0, -1];
  p.fx = p.x; p.fy = p.y; p.x += back[0]; p.y += back[1]; p.t = 0;
  World.syncFollowers();
  if (i < 0 || i >= dests.length) return;
  await travelTo(here, dests[i]);
}

const ROUTE_DESC = {
  farm: 'Cart track through the barley.', farm2forest: 'Fields first, then the trees close in.',
  forest2farm: 'Out of the trees and into open country.', forest: 'Deep woods the whole way.',
  city: 'The high road, all the way to the walls.', fromcity: 'Out of the gates and back into the fields.',
  mountain: 'Uphill, into the pines and the cold.', frommountain: 'Downhill, out of the pines.',
  rift: 'East, until the green gives out. The Rift stands at the end of it.',
  fromrift: 'Back through the Rift, into the world you know.'
};

async function travelTo(from, to) {
  const e = edgeBetween(from, to) || { dur: 12, kind: 'farm' };
  const node = NODES[to];
  Sound.stop();
  await fadeOut(0.4);
  const t = new TravelScene(from, to, e.kind, e.dur);
  Scenes.push(t);
  Sound.play(e.kind === 'rift' ? 'portal' : 'travel');
  await fadeIn(0.5);
  const res = await t.promise;
  Scenes.remove(t);
  if (res === 'turnback') { // the Rift: you chose not to go through
    await fadeOut(0.5);
    World.load(NODES[from].map, ...(NODES[from].from && NODES[from].from[to] || NODES[from].at));
    await fadeIn(0.5);
    return;
  }
  await fadeOut(0.5);
  const at = (node.from && node.from[from]) || node.at;
  World.load(node.map, at[0], at[1], at[2]);
  G.flags['travelled'] = true;
  await fadeIn(0.5);
  await onEnterMap(node.map);
  saveGame(true);
}

// ---------------------------------------------------------------- the scene
const SCROLL = 62;   // pixels of road per second

class TravelScene {
  constructor(from, to, kind, dur) {
    this.from = from; this.to = to; this.kind = kind; this.dur = dur;
    this.p = 0; this.t = 0; this.scroll = 0; this.spawnX = 0;
    this.objs = []; this.busy = false; this.done = false;
    this.events = [0.26, 0.58, 0.84].filter(() => true);
    this.fired = [];
    this.portalStop = false;
    this.promise = new Promise(r => this.resolve = r);
    for (let i = 0; i < 40; i++) this.spawnAhead(rand(0, W + 200));
  }
  biome(p) {
    const k = this.kind;
    if (k === 'farm') return p < 0.12 || p > 0.88 ? 'village' : 'farm';
    if (k === 'forest') return 'forest';
    if (k === 'farm2forest') return p < 0.4 ? 'farm' : p < 0.62 ? 'edge' : 'forest';
    if (k === 'forest2farm') return p < 0.38 ? 'forest' : p < 0.6 ? 'edge' : 'farm';
    if (k === 'city') return p < 0.55 ? 'farm' : p < 0.85 ? 'road' : 'city';
    if (k === 'fromcity') return p < 0.15 ? 'city' : p < 0.45 ? 'road' : 'farm';
    if (k === 'mountain') return p < 0.4 ? 'forest' : p < 0.75 ? 'pines' : 'rock';
    if (k === 'frommountain') return p < 0.25 ? 'rock' : p < 0.6 ? 'pines' : 'forest';
    if (k === 'rift') return p < 0.3 ? 'forest' : p < 0.55 ? 'dead' : 'ash';
    if (k === 'fromrift') return p < 0.3 ? 'ash' : p < 0.55 ? 'dead' : 'forest';
    return 'farm';
  }
  spawnAhead(atX) {
    const p = clamp(this.p + (atX - this.scroll % 1) / (this.dur * SCROLL), 0, 1);
    const b = this.biome(p);
    const r = Math.random();
    const push = (type, layer, y, s) => this.objs.push({ x: atX, type, layer, y, s: s || rand(0.85, 1.2), seed: Math.random() * 99 });
    if (b === 'forest' || b === 'edge') { if (r < (b === 'forest' ? 0.85 : 0.45)) push('tree', 1, rand(250, 300)); else if (r < 0.9) push('bush', 2, rand(320, 350)); else push('rock', 2, 340); }
    else if (b === 'pines') { if (r < 0.8) push('pine', 1, rand(240, 290)); else push('rock', 2, 340); }
    else if (b === 'rock') { if (r < 0.55) push('rock', 1, rand(280, 330)); else if (r < 0.8) push('pine', 1, rand(250, 290)); else push('bush', 2, 344); }
    else if (b === 'farm') { if (r < 0.45) push('crop', 2, rand(300, 344)); else if (r < 0.6) push('fence', 2, 318); else if (r < 0.72) push('tree', 1, rand(255, 285)); else if (r < 0.78) push('hay', 2, 322); else if (r < 0.84) push('cottage', 1, 292); else push('bush', 2, 340); }
    else if (b === 'village') { if (r < 0.5) push('cottage', 1, 292); else if (r < 0.7) push('fence', 2, 318); else push('tree', 1, 270); }
    else if (b === 'road') { if (r < 0.3) push('post', 2, 318); else if (r < 0.55) push('crop', 2, 330); else if (r < 0.75) push('cart', 2, 320); else push('tree', 1, 268); }
    else if (b === 'city') { if (r < 0.65) push('tower', 0, 250); else push('post', 2, 318); }
    else if (b === 'dead') { if (r < 0.7) push('deadtree', 1, rand(250, 300)); else push('rock', 2, 340); }
    else if (b === 'ash') { if (r < 0.5) push('rock', 1, rand(290, 330)); else if (r < 0.8) push('deadtree', 1, rand(250, 300)); else push('bones', 2, 340); }
  }

  update(dt) {
    this.t += dt;
    if (this.busy || this.done) return;
    const fast = Input.held('ok') || Input.held('run') ? 2.2 : 1;
    const step = dt * fast;
    this.p = Math.min(1, this.p + step / this.dur);
    this.scroll += SCROLL * step * fast * 0 + SCROLL * step;
    // scenery
    this.objs = this.objs.filter(o => o.x - this.scroll > -260);
    let last = 0;
    for (const o of this.objs) last = Math.max(last, o.x);
    while (last < this.scroll + W + 320) { last += rand(26, 90); this.spawnAhead(last); }
    // events on the way
    for (let i = 0; i < this.events.length; i++) {
      if (this.fired[i] || this.p < this.events[i]) continue;
      this.fired[i] = true;
      if (this.p > 0.95) break;
      this.runEvent();
      return;
    }
    if (this.p >= 1) {
      if (this.kind === 'rift' && !this.portalStop) { this.portalStop = true; this.busy = true; this.runPortal(); return; }
      this.done = true;
      this.resolve('arrived');
    }
  }
  async runEvent() {
    this.busy = true;
    try { await roadEvent(this); }
    catch (e) { console.error(e); }
    this.busy = false;
  }
  async runPortal() {
    try {
      const res = await portalChoice(this);
      if (res === 'in') { this.done = true; this.resolve('arrived'); }
      else { this.done = true; this.resolve('turnback'); }
    } catch (e) { console.error(e); this.done = true; this.resolve('arrived'); }
  }

  // ---------------------------------------------------------------- draw
  skyCols() {
    const b = this.biome(this.p);
    if (b === 'ash') return ['#2a0e14', '#8a3418'];
    if (b === 'dead') return ['#3c3244', '#8a7a70'];
    if (b === 'rock' || b === 'pines') return ['#4a6a9a', '#c8d8e0'];
    if (b === 'city') return ['#5a8ad0', '#f0e0c0'];
    if (b === 'forest') return ['#5e9ad0', '#cfe6c4'];
    return ['#6fb0e0', '#f2e6c0'];
  }
  draw() {
    const b = this.biome(this.p);
    const [s1, s2] = this.skyCols();
    const HOR = 300;
    const g = ctx.createLinearGradient(0, 0, 0, HOR);
    g.addColorStop(0, s1); g.addColorStop(1, s2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sun / sky features
    const sunX = W * 0.74, sunY = 78;
    if (b !== 'ash') { glow(sunX, sunY, 120, 'rgba(255,240,190,.4)'); ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(sunX, sunY, 26, 0, 7); ctx.fill(); }
    else { glow(W * 0.3, 90, 180, 'rgba(255,90,40,.35)'); }
    // clouds
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 220 - this.scroll * 0.06) % (W + 400)) - 200, cy = 40 + (i % 3) * 34;
      ctx.fillStyle = b === 'ash' ? 'rgba(80,40,40,.5)' : 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 58, 16, 0, 0, 7); ctx.ellipse(cx + 34, cy - 8, 40, 14, 0, 0, 7); ctx.fill();
    }
    // far hills
    const far = this.scroll * 0.12;
    ctx.fillStyle = b === 'ash' ? '#4a2020' : b === 'rock' || b === 'pines' ? '#7a8ab0' : '#8ab0a0';
    ctx.beginPath(); ctx.moveTo(0, HOR);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 236 - Math.abs(Math.sin((x + far) / 150)) * (b === 'rock' ? 96 : 54));
    ctx.lineTo(W, HOR); ctx.fill();
    ctx.fillStyle = b === 'ash' ? '#361818' : b === 'rock' || b === 'pines' ? '#5a6a8a' : '#5f8f62';
    ctx.beginPath(); ctx.moveTo(0, HOR);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 262 - Math.abs(Math.sin((x + far * 1.6) / 90)) * 38);
    ctx.lineTo(W, HOR); ctx.fill();
    // ground
    const gg = ctx.createLinearGradient(0, HOR - 20, 0, H);
    if (b === 'ash') { gg.addColorStop(0, '#5a4a48'); gg.addColorStop(1, '#2a2022'); }
    else if (b === 'rock') { gg.addColorStop(0, '#8a8a84'); gg.addColorStop(1, '#4a4a48'); }
    else { gg.addColorStop(0, '#6aa84e'); gg.addColorStop(1, '#3a6a30'); }
    ctx.fillStyle = gg; ctx.fillRect(0, HOR - 20, W, H - HOR + 20);
    // the road itself
    ctx.fillStyle = b === 'ash' ? '#3e3438' : b === 'city' ? '#a8a49c' : '#c4a468';
    ctx.beginPath(); ctx.moveTo(0, 344); ctx.lineTo(W, 344); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let i = 0; i < 40; i++) { const x = (i * 46 - this.scroll) % (W + 60) - 30; ctx.fillRect(x, 350 + (i % 5) * 12, 18 + (i % 3) * 10, 3); }
    // scenery, far layers first
    for (const layer of [0, 1, 2]) {
      const sp = layer === 0 ? 0.35 : layer === 1 ? 0.78 : 1;
      for (const o of this.objs) {
        if (o.layer !== layer) continue;
        const x = o.x - this.scroll * sp;
        if (x < -160 || x > W + 160) continue;
        this.drawObj(o, x, o.y);
      }
    }
    // the party, walking
    const frame = Math.floor(this.t * 7) % 4;
    const f = frame === 1 ? 1 : frame === 3 ? 2 : 0;
    const bob = (i) => Math.abs(Math.sin(this.t * 7 + i * 1.3)) * 2;
    const S = 92;
    const walking = !this.busy && !this.done;
    G.party.forEach((m, i) => {
      const x = 386 - i * 66, y = 292 + (i % 2 ? 10 : 0);
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(x + S / 2, y + S - 4, S * 0.26, 5, 0, 0, 7); ctx.fill();
      const img = charSprite(memberKey(m), 'right', walking ? f : 0);
      ctx.drawImage(img, x, y - (walking ? bob(i) : 0), S, S);
    });
    // the Rift, at the end of that road
    if (this.kind === 'rift') {
      const appear = clamp((this.p - 0.72) / 0.28, 0, 1);
      if (appear > 0) {
        const px = W - 150, py = 250;
        const r = 40 + appear * 66;
        FX.sparkle(px, py, r * 1.4, 'rgba(150,70,255,.45)', 6);
        ctx.save();
        const rg = ctx.createRadialGradient(px, py, 4, px, py, r);
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.25, '#c890ff'); rg.addColorStop(0.7, '#4a1080'); rg.addColorStop(1, 'rgba(20,4,40,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.ellipse(px, py + 60, r * 0.62, r * 1.15, 0, 0, 7); ctx.fill();
        ctx.restore();
        for (let i = 0; i < 16; i++) {
          const a = this.t * 1.2 + i, rr = r * (0.5 + (i % 5) * 0.14);
          ctx.fillStyle = 'rgba(210,170,255,.7)';
          ctx.fillRect(px + Math.cos(a) * rr * 0.6, py + 60 + Math.sin(a) * rr, 3, 3);
        }
      }
    }
    Weather.drawWorld();
    FX.bloom(0.3);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (b !== 'ash') FX.lensFlare(sunX, sunY, 0.7, [255, 240, 190]);
    Weather.drawScreen();
    // progress
    const barW = W - 160;
    drawWindow(70, 14, W - 140, 52);
    text(NODES[this.from].name, 86, 24, UI.dim, 14);
    text(NODES[this.to].name, W - 86, 24, UI.paper, 14, 'right');
    bar(86, 46, barW - 32, 10, this.p, 1, UI.sakura);
    const walkerX = 86 + (barW - 32) * this.p;
    ctx.fillStyle = UI.gold; ctx.fillRect(walkerX - 2, 42, 4, 4);
    const left = Math.max(0, Math.ceil((1 - this.p) * this.dur));
    text(`${left} min`, W / 2, 44, UI.dim, 12, 'center', false);
    if (!this.busy && !this.done) text(`Hold ${Controls.label('ok')} to walk faster`, W / 2, H - 26, 'rgba(240,230,210,.6)', 12, 'center', false);
  }
  drawObj(o, x, y) {
    const s = o.s;
    const R = (X, Y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(X, Y, w, h); };
    if (o.type === 'tree') {
      const h = 60 * s;
      R(x - 5 * s, y + h * 0.6, 10 * s, h * 0.45, '#5a3a22');
      for (const [dy, rad, col] of [[0, 30, '#2f6b30'], [-14, 24, '#3f8a38'], [-26, 16, '#54a848']]) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y + h * 0.55 + dy * s, rad * s, (rad * 0.8) * s, 0, 0, 7); ctx.fill();
      }
    } else if (o.type === 'pine') {
      const h = 76 * s;
      R(x - 4 * s, y + h * 0.66, 8 * s, h * 0.38, '#4a3220');
      ctx.fillStyle = '#1f5a32';
      for (let i = 0; i < 3; i++) { const w = (30 - i * 7) * s; ctx.beginPath(); ctx.moveTo(x - w, y + (h * 0.7) - i * 20 * s); ctx.lineTo(x, y + (h * 0.36) - i * 22 * s); ctx.lineTo(x + w, y + (h * 0.7) - i * 20 * s); ctx.fill(); }
    } else if (o.type === 'deadtree') {
      R(x - 4 * s, y + 20 * s, 8 * s, 46 * s, '#3a2e30');
      ctx.strokeStyle = '#3a2e30'; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(x, y + 30 * s); ctx.lineTo(x - 20 * s, y + 10 * s); ctx.moveTo(x, y + 38 * s); ctx.lineTo(x + 22 * s, y + 14 * s); ctx.stroke(); ctx.lineWidth = 1;
    } else if (o.type === 'bush') {
      ctx.fillStyle = '#3f7a38'; ctx.beginPath(); ctx.ellipse(x, y, 16 * s, 10 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#54a848'; ctx.beginPath(); ctx.ellipse(x - 4 * s, y - 3 * s, 9 * s, 6 * s, 0, 0, 7); ctx.fill();
    } else if (o.type === 'rock') {
      ctx.fillStyle = '#7a7670'; ctx.beginPath(); ctx.ellipse(x, y, 18 * s, 11 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#9a968e'; ctx.beginPath(); ctx.ellipse(x - 4 * s, y - 4 * s, 10 * s, 6 * s, 0, 0, 7); ctx.fill();
    } else if (o.type === 'crop') {
      ctx.fillStyle = '#c8a84a';
      for (let i = 0; i < 7; i++) { const cx = x + i * 7 * s; ctx.fillRect(cx, y - 14 * s, 2 * s, 14 * s); ctx.fillRect(cx - 1, y - 18 * s, 4 * s, 5 * s); }
    } else if (o.type === 'fence') {
      ctx.fillStyle = '#7a5230';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + i * 22 * s, y, 4 * s, 26 * s);
      ctx.fillRect(x, y + 6 * s, 70 * s, 3 * s); ctx.fillRect(x, y + 16 * s, 70 * s, 3 * s);
    } else if (o.type === 'hay') {
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.ellipse(x, y, 20 * s, 14 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e0c070'; ctx.beginPath(); ctx.ellipse(x - 4 * s, y - 4 * s, 12 * s, 8 * s, 0, 0, 7); ctx.fill();
    } else if (o.type === 'cottage') {
      const w = 64 * s, h = 40 * s;
      ctx.fillStyle = '#e8d8b0'; ctx.fillRect(x - w / 2, y, w, h);
      ctx.fillStyle = '#a8413a'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8 * s, y); ctx.lineTo(x, y - 26 * s); ctx.lineTo(x + w / 2 + 8 * s, y); ctx.fill();
      ctx.fillStyle = '#5a4030'; ctx.fillRect(x - 7 * s, y + h - 20 * s, 14 * s, 20 * s);
      ctx.fillStyle = '#f2d88a'; ctx.fillRect(x + 14 * s, y + 10 * s, 12 * s, 10 * s);
      glow(x + 20 * s, y + 15 * s, 30 * s, 'rgba(255,220,140,.25)');
    } else if (o.type === 'tower') {
      const h = 150 * s;
      ctx.fillStyle = '#d8d4c8'; ctx.fillRect(x - 24 * s, y - h + 60, 48 * s, h);
      ctx.fillStyle = '#b8b4a8'; ctx.fillRect(x - 24 * s, y - h + 60, 8 * s, h);
      ctx.fillStyle = '#3e4e7e'; ctx.beginPath(); ctx.moveTo(x - 30 * s, y - h + 60); ctx.lineTo(x, y - h + 10); ctx.lineTo(x + 30 * s, y - h + 60); ctx.fill();
      ctx.fillStyle = '#8a7a50'; ctx.fillRect(x - 8 * s, y - h + 96, 16 * s, 22 * s);
    } else if (o.type === 'post') {
      ctx.fillStyle = '#6a5230'; ctx.fillRect(x, y, 5, 30);
      ctx.fillStyle = '#a8884a'; ctx.fillRect(x - 12, y - 8, 30, 12);
    } else if (o.type === 'cart') {
      ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 22, y - 12, 44, 16);
      ctx.fillStyle = '#4a3220'; ctx.beginPath(); ctx.arc(x - 12, y + 6, 8, 0, 7); ctx.arc(x + 12, y + 6, 8, 0, 7); ctx.fill();
    } else if (o.type === 'bones') {
      ctx.fillStyle = '#d8d4c4';
      ctx.fillRect(x - 14, y, 28, 4); ctx.fillRect(x - 6, y - 8, 12, 10);
    }
  }
}

// ---------------------------------------------------------------- road events
function partyIds() { return G.party.filter(m => m.cls !== 'hero').map(m => m.cls); }
function withMe(id) { return partyIds().includes(id); }

async function roadEvent(scene) {
  const b = scene.biome(scene.p);
  const ids = partyIds();
  const pool = ROAD_EVENTS.filter(e => e.when(b, ids, scene));
  if (!pool.length) return;
  const weights = pool.map(e => [e, e.w || 1]);
  const ev = weighted(weights.map(([e, w], i) => [i, w]));
  await pool[ev].run(scene, ids);
}

const ROAD_EVENTS = [
  {
    id: 'bandits', w: 3,
    when: (b, ids, s) => b !== 'ash' && b !== 'city' && !G.flags.noEncounters,
    run: async (s) => {
      await say(null, 'Three figures step out of the long grass with their hoods up. One of them is holding a billhook.');
      const boss = G.flags.roadFights >= 2 && !G.flags.rafe;
      if (boss) {
        G.flags.rafe = true;
        await say('Rafe the Red', `You\'re the Valen brat, aren\'t you? Word gets about. Purse, sword, and those nice boots.`, 'banditboss');
      }
      G.flags.roadFights = (G.flags.roadFights || 0) + 1;
      const group = boss ? ['bandit', 'banditboss', 'bandit'] : ['bandit', 'bandit'];
      const res = await startBattle(group, { bg: 'road', returnTrack: 'travel' });
      if (res === 'win') { moraleAll(3); if (boss) { addItem('hipotion', 2); await say(null, 'Rafe\'s purse holds 200 G and two Hi-Potions.'); G.gold += 200; } }
    }
  },
  {
    id: 'beasts', w: 3,
    when: (b) => b === 'forest' || b === 'edge' || b === 'pines' || b === 'dead',
    run: async (s) => {
      await say(null, 'Something moves between the trunks, keeping pace with you.');
      const table = { forest: ['wolf', 'spider'], edge: ['wolf', 'slime'], pines: ['wolf', 'skeleton'], dead: ['wisp', 'swolf'] }[s.biome(s.p)] || ['wolf'];
      const group = [pick(table), pick(table)];
      const res = await startBattle(group, { bg: 'forest', returnTrack: 'travel' });
      if (res === 'win') moraleAll(2);
    }
  },
  {
    id: 'ashborn', w: 3,
    when: (b) => b === 'ash',
    run: async () => {
      await say(null, 'Ash lifts off the ground in a line, the way it does when something walks through it.');
      const res = await startBattle(['orc', 'imp'], { bg: 'wastes', returnTrack: 'travel' });
      if (res === 'win') moraleAll(3);
    }
  },
  {
    id: 'camp', w: 2,
    when: (b, ids) => ids.length > 0,
    run: async (s, ids) => {
      const who = pick(ids);
      await say(null, 'The light goes orange, then blue. You stop for the night and build a small fire.');
      const c = await ask(null, 'How do you spend the evening?', ['Sit up talking with everyone.', 'Take first watch alone.', 'Sleep early. Tomorrow is a long walk.'], null, false);
      if (c === 0) { moraleAll(6); await say(COMPANIONS[who].name, pick([`You laugh like that more out here than you do at home.`, `Tell that one again. The one about the stable roof.`, `I'll take the last watch. Go on, keep talking.`]), 'c:' + who); }
      else if (c === 1) { addMorale(who, 4); if (INTRO()) await say(null, 'The quiet suits you. By dawn you have thought three things through properly.'); healParty(); await say(null, 'The party rests well. Everyone is back to full strength.'); }
      else { healParty(); moraleAll(1); await say(null, 'You sleep through until the birds start. Everyone is back to full strength.'); }
    }
  },
  {
    id: 'child', w: 2,
    when: (b) => b === 'farm' || b === 'village' || b === 'road',
    run: async (s, ids) => {
      await say(null, 'A boy is sitting on a milestone with no shoes on, eating nothing out of an empty cloth.');
      const c = await ask(null, 'He watches your party go past.', ['Give him 40 G.', 'Give him food from the packs.', 'Keep walking.'], null, false);
      if (c === 0 && G.gold >= 40) {
        G.gold -= 40; Sound.sfx('coin');
        for (const id of ['lyra', 'oswin', 'wren']) if (withMe(id)) addMorale(id, 6);
        if (withMe('sable')) addMorale('sable', -5);
        if (withMe('sable')) await say('Sable', `Forty. You know what forty buys in the Gutter? …Fine. Fine.`, 'c:sable');
      } else if (c === 1 && itemCount('potion')) {
        removeItem('potion');
        for (const id of ['oswin', 'kestrel', 'garrick']) if (withMe(id)) addMorale(id, 5);
        await say(null, 'He eats it in four bites and says nothing at all, which is its own kind of thank you.');
      } else {
        for (const id of ['lyra', 'oswin']) if (withMe(id)) addMorale(id, -5);
        if (withMe('sable')) addMorale('sable', 3);
        await say(null, 'You keep walking. It takes a while for the road to feel normal again.');
      }
    }
  },
  {
    id: 'argue', w: 2,
    when: (b, ids) => ids.length >= 2,
    run: async (s, ids) => {
      const [a, bb] = [ids[0], ids[1]];
      const A = COMPANIONS[a].name, B = COMPANIONS[bb].name;
      await say(null, `${A} and ${B} have been arguing about the same thing for two miles.`);
      await say(A, ROAD_ARGUE[a] || `We should be pushing harder. People are dying while we stroll.`, 'c:' + a);
      await say(B, ROAD_ARGUE[bb] || `And we'll be no use to them dead on our feet.`, 'c:' + bb);
      const c = await ask(null, 'They both look at you.', [`${A} has a point.`, `${B} has a point.`, `Tell them both to drop it.`], null, false);
      if (c === 0) { addMorale(a, 8); addMorale(bb, -6); }
      else if (c === 1) { addMorale(bb, 8); addMorale(a, -6); }
      else { addMorale(a, -2); addMorale(bb, -2); await say(null, 'They drop it. The silence afterwards is not exactly comfortable.'); }
    }
  },
  {
    id: 'wren', w: 3,
    when: (b, ids) => ids.includes('wren') && !G.flags.wrenTalk,
    run: async () => {
      G.flags.wrenTalk = true;
      await say('Wren', `Can I ask you something, and you answer honest?`, 'c:wren');
      if (INTRO()) {
        await say('Wren', `That night at the mill. You were there before you came out, weren't you. Standing in the dark, watching.`, 'c:wren');
        const c = await ask('Wren', `Why?`, ['I was afraid. I\'m sorry.', 'I was working out how to win.', 'You\'re alive, aren\'t you?'], 'c:wren', false);
        if (c === 0) { addMorale('wren', 14); await say('Wren', `…Right. All right. That, I understand. Thanks for not dressing it up.`, 'c:wren'); }
        else if (c === 1) { addMorale('wren', 4); await say('Wren', `Hm. That's the sort of thing a captain says. I'd rather you'd said you were scared.`, 'c:wren'); }
        else { addMorale('wren', -10); await say('Wren', `Yes. I am. I keep having to remind myself of that bit.`, 'c:wren'); }
      } else {
        await say('Wren', `That night at the mill, you came straight in. No hesitating. I think about it more than I should.`, 'c:wren');
        const c = await ask('Wren', `Why did you?`, ['You were in trouble. That was enough.', 'I didn\'t think about it at all.'], 'c:wren', false);
        addMorale('wren', c === 0 ? 10 : 8);
        await say('Wren', c === 0 ? `Then I'll be in trouble beside you instead. Fair's fair.` : `That's the bit that gets me. You just went.`, 'c:wren');
      }
    }
  },
  {
    id: 'sablesteal', w: 2,
    when: (b, ids) => ids.includes('sable') && (b === 'farm' || b === 'road' || b === 'village'),
    run: async () => {
      await say(null, 'A carter passes you going the other way. A little later, Sable is turning a silver spoon over in her fingers.');
      const c = await ask('Sable', `What? He had six.`, ['Put it back.', 'Keep it. He won\'t miss it.', 'Don\'t do that while you walk with me.'], 'c:sable', false);
      if (c === 0) { addMorale('sable', -4); if (withMe('wren')) addMorale('wren', 5); if (withMe('oswin')) addMorale('oswin', 6); await say('Sable', `…You're going to be exhausting, you know that?`, 'c:sable'); }
      else if (c === 1) { addMorale('sable', 7); if (withMe('oswin')) addMorale('oswin', -7); if (withMe('lyra')) addMorale('lyra', -3); G.gold += 30; }
      else { addMorale('sable', -8); if (withMe('oswin')) addMorale('oswin', 4); await say('Sable', `Fine. While I walk with you.`, 'c:sable'); }
    }
  },
  {
    id: 'varek', w: 3,
    when: (b, ids) => ids.includes('varek') && (b === 'village' || b === 'farm' || b === 'road' || b === 'city'),
    run: async () => {
      await say(null, 'A family on the road sees the horns, and the father steps in front of his children with a hand out.');
      const c = await ask(null, 'They are waiting for you to say something.', ['He walks with me. That should be enough.', 'Say nothing and keep moving.', 'Tell Varek to wait out of sight next time.'], null, false);
      if (c === 0) { addMorale('varek', 14); G.rep += 2; await say('Varek', `…You said that quickly. Most people have to think first.`, 'c:varek'); }
      else if (c === 1) { addMorale('varek', -6); await say('Varek', `I am used to it. That is not the same as being fine with it.`, 'c:varek'); }
      else { addMorale('varek', -16); if (withMe('lyra')) addMorale('lyra', -6); await say('Varek', `As you wish, my lord.`, 'c:varek'); }
    }
  },
  {
    id: 'kestrel', w: 2,
    when: (b, ids) => ids.includes('kestrel') && (b === 'forest' || b === 'edge' || b === 'pines'),
    run: async () => {
      await say('Kestrel', `Deer. Downwind, forty paces. Give me ten minutes and we eat properly tonight.`, 'c:kestrel');
      const c = await ask(null, 'Ten minutes off the road.', ['Go on, then.', 'We don\'t have ten minutes.'], null, false);
      if (c === 0) {
        addMorale('kestrel', 8); if (withMe('lyra')) addMorale('lyra', -3);
        for (const m of G.party) if (m.hp > 0) m.hp = Math.min(maxHP(m), m.hp + Math.floor(maxHP(m) * 0.4));
        await say(null, 'You eat well for the first time in days. Everyone recovers some HP.');
      } else { addMorale('kestrel', -5); await say('Kestrel', `Right. Hard bread again.`, 'c:kestrel'); }
    }
  },
  {
    id: 'lyra', w: 2,
    when: (b, ids) => ids.includes('lyra'),
    run: async () => {
      await say('Lyra', `Walk slower a moment. Look — the way the light comes down there. I used to be able to name every tree in a wood like this.`, 'c:lyra');
      const c = await ask(null, 'She is waiting to see if you stop.', ['Stop and look.', 'Keep the pace.'], null, false);
      if (c === 0) { addMorale('lyra', 8); if (withMe('garrick')) addMorale('garrick', -2); await say('Lyra', `Thank you. People don't, usually.`, 'c:lyra'); }
      else { addMorale('lyra', -4); }
    }
  },
  {
    id: 'garrick', w: 2,
    when: (b, ids) => ids.includes('garrick'),
    run: async () => {
      await say(null, 'Garrick has been quiet for an hour, which for Garrick is a scream.');
      await say('Garrick', `Pack strap's cut into my shoulder since Ironhold. It's nothing.`, 'c:garrick');
      const c = await ask(null, 'It is clearly not nothing.', ['Take half his load.', 'Call a rest.', 'He said it\'s nothing.'], null, false);
      if (c === 0) { addMorale('garrick', 12); await say('Garrick', `…Hmph. Give it back at the top of the hill.`, 'c:garrick'); }
      else if (c === 1) { addMorale('garrick', 6); moraleAll(2); }
      else { addMorale('garrick', -5); if (withMe('sable')) addMorale('sable', 2); }
    }
  },
  {
    id: 'oswin', w: 2,
    when: (b, ids) => ids.includes('oswin'),
    run: async () => {
      await say('Oswin', `There's a shrine stone off the path here. Old one. Would you kneel with me a minute?`, 'c:oswin');
      const c = await ask(null, 'He is already halfway off the road.', ['Kneel with him.', 'Stand watch while he prays.', 'We should keep moving.'], null, false);
      if (c === 0) { addMorale('oswin', 10); for (const m of G.party) if (m.hp > 0) m.mp = Math.min(maxMP(m), m.mp + Math.floor(maxMP(m) * 0.35)); await say(null, 'Your head clears. The party recovers some MP.'); }
      else if (c === 1) { addMorale('oswin', 5); }
      else { addMorale('oswin', -6); }
    }
  },
  {
    id: 'rain', w: 1,
    when: (b) => b !== 'ash',
    run: async () => {
      Weather.set('rain', 1); if (G.weather) { G.weather.kind = 'rain'; G.weather.until = G.playTime + 200; }
      await say(null, 'The sky goes the colour of an old coin, and then it comes down hard.');
      const c = await ask(null, 'There is a stand of oaks off the road.', ['Push on through it.', 'Shelter until it passes.'], null, false);
      if (c === 0) { moraleAll(-3); await say(null, 'You walk through it. Everyone is soaked and nobody says anything for a mile.'); }
      else { moraleAll(3); await say(null, 'You wait it out under the branches, watching the road turn to soup.'); }
    }
  },
  {
    id: 'find', w: 2,
    when: () => true,
    run: async () => {
      const loot = pick(['potion', 'potion', 'ether', 'antidote', 'hipotion']);
      await say(null, 'Half buried at the side of the road: a pack that someone dropped running, a long time ago.');
      addItem(loot, 1); Sound.sfx('pickup');
      await say(null, `You take a ${ITEMS[loot].name} from it and leave the rest where it is.`);
    }
  },
  {
    id: 'alone', w: 2,
    when: (b, ids) => ids.length === 0,
    run: async () => {
      const lines = [
        'You walk for an hour without meeting anyone. The road talks to itself: gravel, wind, one bird.',
        'You catch yourself narrating the walk to somebody who is not there.',
        'A cart passes going the other way. The driver nods. That is the whole conversation, and it is somehow enough.'
      ];
      await say(null, pick(lines));
      if (INTRO()) { await say(null, 'Walking alone suits you. You reach the next milestone quicker than you expected.'); }
      else { await say(null, 'By the next milestone you would happily talk to a fence post.'); }
    }
  }
];

const ROAD_ARGUE = {
  lyra: `We are walking past every village that needs us. That is a choice, and we keep making it.`,
  garrick: `Faster isn't better. Tired arms drop shields.`,
  wren: `We keep to the road and we keep to the plan. That's how people come back.`,
  sable: `Or we could take the smugglers' cut and be there by dark. Nobody has to know.`,
  oswin: `There is time to do this decently. There is always time for that.`,
  kestrel: `The road is watched. I'd rather go through the trees and be boring about it.`,
  varek: `You are all very concerned with being good. My people were good, and we starved for three hundred years.`
};
