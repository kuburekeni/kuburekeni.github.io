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
      desc: lock || `Walk to ${NODES[d].name}. ${ROUTE_DESC[e ? e.kind : 'farm'] || ''}${e && e.kind !== 'rift' && e.kind !== 'fromrift' ? ` Or ride with the carter: ${cartFare(e.dur)} G.` : ''}`
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
  const to = dests[i], e = edgeBetween(here, to) || { dur: 12, kind: 'farm' };
  if (e.kind !== 'rift' && e.kind !== 'fromrift') {
    const fare = cartFare(e.dur);
    const c = await ask('Carter', `Going to ${NODES[to].name}? I'll have you and yours there before you can blink. ${fare} G for the lot of you.`,
      ['Walk (free)', `Take the cart (${fare} G)`], null, false);
    if (c < 0) return;
    if (c === 1) {
      if (G.gold < fare) { Sound.sfx('buzz'); await say('Carter', `That's not ${fare}. Walk it, then, or come back with coin.`); return; }
      G.gold -= fare; Sound.sfx('coin');
      await cartTo(here, to);
      return;
    }
  }
  await travelTo(here, to);
}

// ---------------------------------------------------------------- the carter
// skip the walk: pay, climb in the back, and you're there. No road events, no fights.
function cartFare(dur) { return Math.round((dur * 4 + 8 * G.party.length) / 5) * 5; }
async function cartTo(from, to) {
  const node = NODES[to];
  Sound.stop();
  await fadeOut(0.4);
  const cs = new CartRideScene(from, to);
  Scenes.push(cs);
  Sound.play('travel');
  await fadeIn(0.3);
  await cs.promise;
  await fadeOut(0.4);
  Scenes.remove(cs);
  const at = (node.from && node.from[from]) || node.at;
  World.load(node.map, at[0], at[1], at[2]);
  G.flags.travelled = true;
  await fadeIn(0.5);
  await say(null, `The carter drops you at ${node.name}, touches his cap, and turns the horse around.`);
  await onEnterMap(node.map);
  saveGame(true);
}
class CartRideScene {
  constructor(from, to) { this.from = from; this.to = to; this.t = 0; this.promise = new Promise(r => this.resolve = r); this.done = false; }
  update(dt) { this.t += dt; if (!this.done && (this.t > 2.2 || (this.t > 0.4 && Input.pressed('ok')))) { this.done = true; this.resolve(); } }
  draw() {
    const t = this.t, g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f0a868'); g.addColorStop(0.55, '#f6d8a0'); g.addColorStop(0.56, '#6a9a4e'); g.addColorStop(1, '#3a6a30');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#7ea070'; for (let i = 0; i < 8; i++) { const x = ((i * 160 - t * 90) % (W + 200) + W + 200) % (W + 200) - 100; ctx.beginPath(); ctx.ellipse(x, H * 0.56, 120, 34, 0, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#c4a468'; ctx.fillRect(0, H * 0.72, W, H * 0.12);
    for (let i = 0; i < 18; i++) { const x = ((i * 70 - t * 420) % (W + 100) + W + 100) % (W + 100) - 50; ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(x, H * 0.76 + (i % 3) * 8, 26, 3); }
    // horse and cart, bouncing
    const cx = W / 2 - 40, cy = H * 0.72, b = Math.abs(Math.sin(t * 14)) * 3;
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(cx + 70, cy - 46 - b, 70, 26); ctx.fillRect(cx + 130, cy - 66 - b, 18, 30); ctx.fillRect(cx + 140, cy - 72 - b, 22, 14);
    for (let k = 0; k < 4; k++) ctx.fillRect(cx + 76 + k * 16, cy - 22 - b, 6, 22 + (k % 2 ? Math.sin(t * 14) * 4 : -Math.sin(t * 14) * 4));
    ctx.fillStyle = '#3a2616'; ctx.fillRect(cx + 150, cy - 70 - b, 6, 10); ctx.fillRect(cx + 60, cy - 36 - b, 34, 3);   // mane, shafts
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(cx + 62, cy - 46 - b + Math.sin(t * 9) * 2, 10, 4);               // tail
    ctx.fillStyle = '#1a1210'; ctx.fillRect(cx + 154, cy - 66 - b, 3, 3);                                       // eye
    ctx.fillStyle = '#8a3a2a'; ctx.fillRect(cx + 128, cy - 48 - b, 4, 14);                                     // harness
    ctx.fillStyle = '#7a5230'; ctx.fillRect(cx - 90, cy - 50 - b, 150, 24); ctx.fillStyle = '#9a7040'; ctx.fillRect(cx - 90, cy - 50 - b, 150, 4);
    G.party.forEach((m, i) => ctx.drawImage(charSprite(memberKey(m), 'right', 0), cx - 86 + i * 34, cy - 94 - b + (i % 2) * 4, 48, 48));
    ctx.fillStyle = '#7a5230'; ctx.fillRect(cx - 90, cy - 38 - b, 150, 14);
    for (const wx of [cx - 60, cx + 30]) { ctx.fillStyle = '#3a2616'; ctx.beginPath(); ctx.arc(wx, cy - 14, 16, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = t * 12 + k * 0.785; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * 14, cy - 14 - Math.sin(a) * 14); ctx.lineTo(wx + Math.cos(a) * 14, cy - 14 + Math.sin(a) * 14); ctx.stroke(); } }
    ctx.lineWidth = 1;
    drawWindow(W / 2 - 180, 28, 360, 56);
    text(`${NODES[this.from].name}  →  ${NODES[this.to].name}`, W / 2, 40, UI.paper, 16, 'center');
    bar(W / 2 - 150, 66, 300, 8, Math.min(1, t / 2.2), 1, UI.gold);
  }
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
    // 3–5 things happen on each walk, spread along the road
    const nEv = irand(3, 5);
    this.events = Array.from({ length: nEv }, (_, i) => clamp((i + 0.5) / nEv + rand(-0.06, 0.06), 0.12, 0.9));
    this.fired = []; this.seen = new Set();
    this.spawnDist = 0;
    this.portalStop = false;
    this.promise = new Promise(r => this.resolve = r);
    for (let x = -120; x < W + 160; x += rand(22, 60)) this.spawnAhead(x);
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
  // Everything stands on the ground at a "base" line. The further back the base,
  // the smaller and slower it scrolls, and things are drawn back-to-front by base,
  // so wheat never floats in front of a house or through a cart.
  spawnAhead(sx) {
    const p = clamp(this.p + sx / (this.dur * SCROLL), 0, 1);
    const b = this.biome(p);
    const r = Math.random();
    const FAR = ['tree', 'pine', 'deadtree', 'cottage'];
    const push = (type, sc) => {
      const far = FAR.includes(type);
      // never let two big things stand in the same spot (towers, cottages, signposts clipping through each other)
      const wide = { tower: 78, cottage: 90, post: 60, cart: 70, fence: 70 }[type];
      if (wide && this.objs.some(o => (type === 'tower' ? o.type === 'tower' : ['cottage', 'post', 'cart', 'fence'].includes(o.type)) && Math.abs(o.sx - sx) < wide)) return;
      const base = type === 'tower' ? 300 : far ? rand(298, 326) : rand(318, 342);
      const sp = type === 'tower' ? 0.35 : 0.58 + (base - 296) / 48 * 0.42;
      const s0 = (sc || rand(0.85, 1.15)) * (type === 'tower' ? 1 : 0.8 + (base - 296) / 48 * 0.3);
      this.objs.push({ sx, type, base, sp, s: s0, seed: Math.random() * 99 });
    };
    if (b === 'forest' || b === 'edge') { if (r < (b === 'forest' ? 0.8 : 0.45)) push('tree'); else if (r < 0.9) push('bush'); else push('rock'); }
    else if (b === 'pines') { if (r < 0.8) push('pine'); else push('rock'); }
    else if (b === 'rock') { if (r < 0.55) push('rock', rand(1, 1.6)); else if (r < 0.8) push('pine'); else push('bush'); }
    else if (b === 'farm') { if (r < 0.42) push('crop'); else if (r < 0.54) push('fence'); else if (r < 0.66) push('tree'); else if (r < 0.74) push('hay'); else if (r < 0.82) push('cottage'); else push('bush'); }
    else if (b === 'village') { if (r < 0.45) push('cottage'); else if (r < 0.65) push('fence'); else if (r < 0.8) push('tree'); else push('crop'); }
    else if (b === 'road') { if (r < 0.25) push('post'); else if (r < 0.5) push('crop'); else if (r < 0.65) push('cart'); else push('tree'); }
    else if (b === 'city') { if (r < 0.6) push('tower'); else push('post'); }
    else if (b === 'dead') { if (r < 0.7) push('deadtree'); else push('rock'); }
    else if (b === 'ash') { if (r < 0.5) push('rock'); else if (r < 0.8) push('deadtree'); else push('bones'); }
  }

  update(dt) {
    this.t += dt;
    if (this.busy || this.done) return;
    const fast = Input.held('ok') || Input.held('run') ? 2.2 : 1;
    const step = dt * fast;
    this.p = Math.min(1, this.p + step / this.dur);
    const d = SCROLL * step;
    this.scroll += d;
    // scenery: each thing slides at its own depth's speed, spawns off the right edge
    for (const o of this.objs) o.sx -= d * o.sp;
    this.objs = this.objs.filter(o => o.sx > -220);
    this.spawnDist -= d;
    while (this.spawnDist <= 0) { this.spawnDist += rand(22, 60); this.spawnAhead(W + 180 + rand(0, 40)); }
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
    this.busy = true; this.wobble = 0;
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
    // scenery, back to front
    const sorted = this.objs.slice().sort((a, b) => (a.type === 'tower' ? -1 : a.base) - (b.type === 'tower' ? -1 : b.base));
    for (const o of sorted) {
      if (o.sx < -160 || o.sx > W + 160) continue;
      if (o.type !== 'tower' && o.type !== 'crop') { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(o.sx + (o.type === 'fence' ? 35 * o.s : 0), o.base, (o.type === 'cottage' ? 38 : o.type === 'fence' ? 38 : o.type === 'cart' ? 26 : 16) * o.s, 3.5 * o.s, 0, 0, 7); ctx.fill(); }
      this.drawObj(o, o.sx, o.base);
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
  // (x, g): g is the ground line the object stands on
  drawObj(o, x, g) {
    const s = o.s;
    const R = (X, Y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(X, Y, w, h); };
    const E = (X, Y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X, Y, rx, ry, 0, 0, 7); ctx.fill(); };
    const sway = Math.sin(this.t * 1.8 + o.seed) * 1.5 * s;
    if (o.type === 'tree') {
      const h = 60 * s;
      R(x - 5 * s, g - h * 0.5, 10 * s, h * 0.5, '#5a3a22'); R(x - 5 * s, g - h * 0.5, 3 * s, h * 0.5, '#6e4a2e');
      R(x - 8 * s, g - 3 * s, 16 * s, 3 * s, '#4a2e1a');
      for (const [dy, rad, col] of [[0, 30, '#2a5e2c'], [-12, 25, '#347a34'], [-24, 17, '#46983e'], [-30, 9, '#62b252']]) E(x + sway * (1 - dy / 40) * 0.3, g - h * 0.62 + dy * s, rad * s, rad * 0.8 * s, col);
    } else if (o.type === 'pine') {
      const h = 76 * s;
      R(x - 4 * s, g - h * 0.36, 8 * s, h * 0.36, '#4a3220');
      for (let i = 0; i < 3; i++) { const w = (30 - i * 7) * s, yb = g - h * 0.3 - i * 20 * s; ctx.fillStyle = i % 2 ? '#256a3a' : '#1f5a32'; ctx.beginPath(); ctx.moveTo(x - w, yb); ctx.lineTo(x + sway * 0.3, yb - 34 * s); ctx.lineTo(x + w, yb); ctx.fill(); }
    } else if (o.type === 'deadtree') {
      R(x - 4 * s, g - 46 * s, 8 * s, 46 * s, '#3a2e30');
      ctx.strokeStyle = '#3a2e30'; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(x, g - 36 * s); ctx.lineTo(x - 20 * s, g - 56 * s); ctx.moveTo(x, g - 28 * s); ctx.lineTo(x + 22 * s, g - 52 * s); ctx.stroke(); ctx.lineWidth = 1;
    } else if (o.type === 'bush') {
      E(x, g - 8 * s, 16 * s, 10 * s, '#3f7a38'); E(x - 4 * s, g - 11 * s, 9 * s, 6 * s, '#54a848'); E(x + 6 * s, g - 9 * s, 6 * s, 4 * s, '#62b252');
    } else if (o.type === 'rock') {
      E(x, g - 8 * s, 18 * s, 11 * s, '#6e6a64'); E(x - 4 * s, g - 12 * s, 10 * s, 6 * s, '#9a968e'); R(x - 8 * s, g - 15 * s, 4 * s, 2 * s, '#b8b4ac');
    } else if (o.type === 'crop') {
      // a clump of wheat rooted in the soil, heads nodding in the wind
      E(x + 18 * s, g, 26 * s, 3 * s, 'rgba(90,70,30,.35)');
      for (let i = 0; i < 9; i++) {
        const cx = x + i * 4.5 * s, hh = (15 + ((i * 7 + Math.floor(o.seed)) % 6)) * s, sw = Math.sin(this.t * 2.2 + o.seed + i * 0.4) * 2 * s;
        ctx.strokeStyle = i % 2 ? '#b89a3a' : '#a8883a'; ctx.lineWidth = 1.4 * s;
        ctx.beginPath(); ctx.moveTo(cx, g); ctx.quadraticCurveTo(cx, g - hh * 0.6, cx + sw, g - hh); ctx.stroke();
        E(cx + sw, g - hh - 3 * s, 1.8 * s, 4 * s, i % 3 ? '#e0c060' : '#f0d478');
        R(cx + sw - 0.5, g - hh - 6 * s, 1, 2 * s, '#fff0b0');
      }
      ctx.lineWidth = 1;
    } else if (o.type === 'fence') {
      for (let i = 0; i < 4; i++) { R(x + i * 22 * s, g - 26 * s, 4 * s, 26 * s, '#7a5230'); R(x + i * 22 * s, g - 26 * s, 1.5 * s, 26 * s, '#9a7040'); }
      R(x, g - 20 * s, 70 * s, 3 * s, '#8a5e36'); R(x, g - 10 * s, 70 * s, 3 * s, '#8a5e36');
    } else if (o.type === 'hay') {
      E(x, g - 12 * s, 20 * s, 13 * s, '#c09048'); E(x - 4 * s, g - 16 * s, 12 * s, 8 * s, '#e0c070');
      for (let i = 0; i < 5; i++) R(x - 14 * s + i * 7 * s, g - 20 * s + (i % 2) * 3 * s, 1, 8 * s, '#a87a38');
    } else if (o.type === 'cottage') {
      const w = 64 * s, h = 40 * s, y = g - h;
      R(x - w / 2, y, w, h, '#e8d8b0'); R(x - w / 2, y, 5 * s, h, '#d0c098');
      R(x - w / 2, y + h - 4 * s, w, 4 * s, '#8a7a60');
      ctx.fillStyle = '#a8413a'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8 * s, y); ctx.lineTo(x, y - 26 * s); ctx.lineTo(x + w / 2 + 8 * s, y); ctx.fill();
      ctx.fillStyle = '#c85a4a'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8 * s, y); ctx.lineTo(x, y - 26 * s); ctx.lineTo(x - 4 * s, y); ctx.fill();
      R(x + 16 * s, y - 24 * s, 7 * s, 14 * s, '#6a5a50');
      R(x - 7 * s, y + h - 20 * s, 14 * s, 20 * s, '#5a4030');
      R(x + 14 * s, y + 10 * s, 12 * s, 10 * s, '#f2d88a'); R(x + 19.5 * s, y + 10 * s, 1, 10 * s, '#8a6a40');
      R(x - 26 * s, y + 10 * s, 12 * s, 10 * s, '#f2d88a');
      glow(x + 20 * s, y + 15 * s, 30 * s, 'rgba(255,220,140,.25)');
    } else if (o.type === 'tower') {
      // a far tower of the city wall: it stands on the horizon line, so nothing nearer ever cuts into it
      const s2 = s * 0.8, h = 120 * s2, y = g, top = y - h;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y, 30 * s2, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#d8d4c8'; ctx.fillRect(x - 24 * s2, top, 48 * s2, h);
      ctx.fillStyle = '#b8b4a8'; ctx.fillRect(x - 24 * s2, top, 8 * s2, h);
      ctx.fillStyle = '#c8c4b8'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 24 * s2 + k * 13 * s2, top - 6 * s2, 8 * s2, 6 * s2);
      ctx.fillStyle = '#3e4e7e'; ctx.beginPath(); ctx.moveTo(x - 30 * s2, top - 6 * s2); ctx.lineTo(x, top - 56 * s2); ctx.lineTo(x + 30 * s2, top - 6 * s2); ctx.fill();
      ctx.fillStyle = '#8a7a50'; ctx.fillRect(x - 8 * s2, top + 30 * s2, 16 * s2, 22 * s2);
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 9 * s2, y - 30 * s2, 18 * s2, 30 * s2);
    } else if (o.type === 'post') {
      R(x, g - 30 * s, 5 * s, 30 * s, '#6a5230');
      R(x - 12 * s, g - 38 * s, 30 * s, 12 * s, '#a8884a'); R(x - 12 * s, g - 38 * s, 30 * s, 2 * s, '#c8a868');
      R(x - 8 * s, g - 33 * s, 18 * s, 1.5 * s, '#5a4020');
    } else if (o.type === 'cart') {
      R(x - 22 * s, g - 22 * s, 44 * s, 12 * s, '#7a5230'); R(x - 22 * s, g - 22 * s, 44 * s, 2 * s, '#9a7040');
      R(x - 20 * s, g - 30 * s, 40 * s, 8 * s, '#c8a050');                    // sacks
      R(x + 22 * s, g - 16 * s, 16 * s, 2 * s, '#6a4a2a');
      for (const wx of [-12, 12]) { E(x + wx * s, g - 7 * s, 7 * s, 7 * s, '#3a2616'); E(x + wx * s, g - 7 * s, 2 * s, 2 * s, '#8a6a40'); }
    } else if (o.type === 'bones') {
      R(x - 14 * s, g - 4 * s, 28 * s, 4 * s, '#d8d4c4'); R(x - 6 * s, g - 12 * s, 12 * s, 9 * s, '#e8e4d4'); R(x - 3 * s, g - 9 * s, 2 * s, 2 * s, '#2a2020'); R(x + 1 * s, g - 9 * s, 2 * s, 2 * s, '#2a2020');
    }
  }
}

// ---------------------------------------------------------------- road events
function partyIds() { return G.party.filter(m => m.cls !== 'hero').map(m => m.cls); }
function withMe(id) { return partyIds().includes(id); }

async function roadEvent(scene) {
  const b = scene.biome(scene.p);
  const ids = partyIds();
  const pool = ROAD_EVENTS.filter(e => !scene.seen.has(e.id) && e.when(b, ids, scene));
  if (!pool.length) return;
  const weights = pool.map(e => [e, e.w || 1]);
  const ev = weighted(weights.map(([e, w], i) => [i, w]));
  scene.seen.add(pool[ev].id);
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
  // ---------------------------------------------------------------- more of the road
  {
    id: 'pedlar', w: 3,
    when: (b) => b !== 'ash' && b !== 'dead',
    run: async () => {
      await say(null, 'A pedlar with a mule and far too many pots on it waves you down. "Road prices, friend. Cheaper than any town."');
      const offer = [['potion', 30], ['ether', 60], ['antidote', 15], ['hipotion', 90]].filter(([id]) => ITEMS[id]);
      const opts = offer.map(([id, pr]) => `${ITEMS[id].name} — ${pr} G`).concat(['Nothing, thanks.']);
      for (;;) {
        const c = await ask('Pedlar', `You've ${G.gold} G. What'll it be?`, opts, null, false);
        if (c < 0 || c >= offer.length) break;
        const [id, pr] = offer[c];
        if (G.gold < pr) { Sound.sfx('buzz'); await say('Pedlar', `Not with that purse, you won't.`); continue; }
        G.gold -= pr; addItem(id, 1); Sound.sfx('coin');
      }
      await say('Pedlar', `Safe roads. Mind the ditches.`);
    }
  },
  {
    id: 'wounded', w: 2,
    when: (b) => b !== 'city',
    run: async (s, ids) => {
      await say(null, 'A man is sitting against a milestone with his leg bound in a torn shirt. The cloth is red through.');
      const c = await ask(null, '"Wolves," he says. "Last night. I\'m fine. I\'m fine."', ['Use a Potion on him.', 'Bind the leg properly and walk him to the next farm.', 'Point him to the nearest town and move on.'], null, false);
      if (c === 0 && itemCount('potion')) {
        removeItem('potion'); G.rep += 2; moraleAll(3); Sound.sfx('heal');
        await say(null, 'Colour comes back into his face. He presses 60 G into your hand and won\'t take it back.'); G.gold += 60;
      } else if (c === 1) {
        moraleAll(4); G.rep += 3; for (const id of ['oswin', 'lyra', 'wren']) if (withMe(id)) addMorale(id, 4);
        await say(null, 'It costs you an hour. At the farm gate his daughter runs out and nearly knocks him over.');
      } else {
        for (const id of ['oswin', 'lyra']) if (withMe(id)) addMorale(id, -4);
        await say(null, 'He nods like he expected it. You feel him watching you go.');
      }
    }
  },
  {
    id: 'stuckcart', w: 2,
    when: (b) => b === 'farm' || b === 'village' || b === 'road',
    run: async () => {
      await say(null, 'A farmer\'s cart is sunk to the axle in a rut, and the farmer is losing an argument with his ox.');
      const c = await ask(null, 'He looks at your party with naked hope.', ['Put your shoulders to it.', 'Keep walking.'], null, false);
      if (c === 0) {
        Sound.sfx('door'); moraleAll(3); if (withMe('garrick')) addMorale('garrick', 5);
        await say(null, 'Three heaves and it comes free with a noise like a boot leaving mud. He gives you a sack of apples and a fistful of coin.');
        G.gold += 40; addItem('potion', 1);
      } else if (withMe('garrick')) { addMorale('garrick', -4); await say('Garrick', `Would've taken a minute.`, 'c:garrick'); }
    }
  },
  {
    id: 'minstrel', w: 2,
    when: (b) => b !== 'ash' && b !== 'dead',
    run: async () => {
      await say(null, 'A minstrel is walking the same way, playing as he goes. It is a song about a hero. It is not very accurate.');
      const c = await ask(null, 'He holds out his hat without breaking the tune.', ['Toss him 10 G.', 'Ask him for a different song.', 'Walk faster.'], null, false);
      if (c === 0 && G.gold >= 10) { G.gold -= 10; Sound.sfx('coin'); moraleAll(4); await say(null, 'He plays you the next mile. It goes quicker than any mile has a right to.'); }
      else if (c === 1) { moraleAll(2); await say(null, 'He plays something slow and old about a river. Nobody talks for a while, in a good way.'); }
      else await say(null, 'The song follows you a long way down the road.');
    }
  },
  {
    id: 'shrine', w: 2,
    when: (b) => b !== 'city' && b !== 'ash',
    run: async () => {
      await say(null, 'A wayside shrine: a stone the height of a child, a bowl of rainwater, a few coins pressed into moss.');
      const c = await ask(null, 'Travellers leave something for luck.', ['Leave 20 G and drink from the bowl.', 'Just drink.', 'Take the coins. Nobody\'s watching.'], null, false);
      if (c === 0 && G.gold >= 20) { G.gold -= 20; for (const m of G.party) if (m.hp > 0) { m.hp = maxHP(m); m.mp = maxMP(m); } Sound.sfx('heal'); await say(null, 'The water is colder than it should be. Everyone is fully restored.'); }
      else if (c === 1) { for (const m of G.party) if (m.hp > 0) m.mp = Math.min(maxMP(m), m.mp + Math.floor(maxMP(m) * 0.3)); Sound.sfx('magic'); await say(null, 'Your head clears a little. The party recovers some MP.'); }
      else if (c === 2) { G.gold += 25; G.rep -= 2; for (const id of ['oswin', 'lyra']) if (withMe(id)) addMorale(id, -8); if (withMe('sable')) addMorale('sable', 4); await say(null, '25 G. It feels heavier than 25 G should.'); }
    }
  },
  {
    id: 'mushrooms', w: 2,
    when: (b) => b === 'forest' || b === 'edge',
    run: async () => {
      await say(null, 'A ring of pale mushrooms in the leaf litter, fat and glossy. Some of them are faintly glowing.');
      const c = await ask(null, 'Could be a meal. Could be a mistake.', ['Pick the glowing ones.', 'Pick the plain ones.', 'Leave them.'], null, false);
      if (c === 0) { if (Math.random() < 0.6) { addItem('ether', 1); Sound.sfx('pickup'); await say(null, 'They hum faintly in your hand. Brewed down, that\'s an Ether.'); } else { for (const m of G.party) if (m.hp > 0) m.hp = Math.max(1, m.hp - Math.floor(maxHP(m) * 0.15)); Sound.sfx('hurt'); await say(null, 'Your fingers go numb, then everyone\'s stomachs do. The party loses some HP.'); } }
      else if (c === 1) { for (const m of G.party) if (m.hp > 0) m.hp = Math.min(maxHP(m), m.hp + Math.floor(maxHP(m) * 0.25)); if (withMe('kestrel')) addMorale('kestrel', 4); await say(null, 'Fried on a flat stone with a little salt. Everyone recovers some HP.'); }
    }
  },
  {
    id: 'strongbox', w: 2,
    when: (b) => b !== 'city',
    run: async () => {
      await say(null, 'In the ditch: a strongbox, lock rusted shut, the kind merchants chain under wagons.');
      const c = await ask(null, 'Someone lost this. Or someone was made to lose it.', ['Force it open.', 'Leave it for whoever comes looking.'], null, false);
      if (c === 0) {
        const lead = G.party.find(m => m.hp > 0);
        if (lead) lead.hp = Math.max(1, lead.hp - Math.floor(maxHP(lead) * 0.1));
        const g = irand(60, 160); G.gold += g; Sound.sfx('chest');
        await say(null, `It takes skinned knuckles and a lot of swearing. Inside: ${g} G, wrapped in oilcloth.`);
        if (withMe('sable')) addMorale('sable', 5); if (withMe('oswin')) addMorale('oswin', -3);
      } else { G.rep += 1; if (withMe('oswin')) addMorale('oswin', 4); }
    }
  },
  {
    id: 'gambler', w: 1,
    when: (b) => b === 'road' || b === 'farm' || b === 'village',
    run: async () => {
      await say(null, 'A man sits on an upturned crate by the road with three cups and a pea. "Find the pea, double your coin."');
      const c = await ask(null, 'He rattles the cups.', ['Bet 50 G.', 'Bet 20 G.', 'Not a chance.'], null, false);
      const bet = c === 0 ? 50 : c === 1 ? 20 : 0;
      if (!bet) return;
      if (G.gold < bet) { await say('Gambler', `Come back when you've got it.`); return; }
      const pickCup = await ask(null, 'The cups stop.', ['Left cup.', 'Middle cup.', 'Right cup.'], null, false);
      const win = Math.random() < (withMe('sable') ? 0.6 : 0.34);
      if (withMe('sable')) await say('Sable', `Middle. …No. Left. Trust me, he palms it.`, 'c:sable');
      if (win) { G.gold += bet; Sound.sfx('coin'); await say(null, `The pea is right there. He pays up with the face of a man doing sums. (+${bet} G)`); }
      else { G.gold -= bet; Sound.sfx('buzz'); await say(null, `Empty. Of course it's empty. (−${bet} G)`); }
    }
  },
  {
    id: 'dog', w: 2,
    when: (b) => b === 'farm' || b === 'village' || b === 'edge',
    run: async () => {
      await say(null, 'A scruffy brown dog falls in beside the party as if it had always been there, tail going.');
      const c = await ask(null, 'It keeps looking up at you.', ['Scratch its ears.', 'Share some food.', 'Shoo it home.'], null, false);
      if (c === 0) { moraleAll(3); await say(null, 'It follows you for a mile, then trots off down a farm track, job done.'); }
      else if (c === 1) { moraleAll(5); await say(null, 'It eats, sits, and walks you all the way to the next milestone like an escort.'); }
      else await say(null, 'It goes, eventually, looking back twice.');
    }
  },
  {
    id: 'critters', w: 2,
    when: (b) => (b === 'farm' || b === 'edge' || b === 'village') && !G.flags.noEncounters,
    run: async () => {
      await say(null, 'The barley at the edge of the road starts moving against the wind.');
      const group = [pick(['slime', 'bat', 'ywolf'].filter(x => ENEMIES[x])), pick(['slime', 'bat'].filter(x => ENEMIES[x]))];
      const res = await startBattle(group, { bg: 'road', returnTrack: 'travel' });
      if (res === 'win') moraleAll(1);
    }
  },
  {
    id: 'lights', w: 2,
    when: (b) => b === 'dead' || b === 'forest' || b === 'pines',
    run: async () => {
      await say(null, 'Lights between the trees. Small, blue, bobbing at head height, and moving away from the road.');
      const c = await ask(null, 'They pause, as if waiting.', ['Follow them.', 'Stay on the road.'], null, false);
      if (c !== 0) { await say(null, 'The lights go out one at a time, like somebody blowing out candles.'); return; }
      if (Math.random() < 0.5) { addItem(ITEMS.hiether ? 'hiether' : 'ether', 1); Sound.sfx('chest'); await say(null, 'They lead you to a hollow stump. Inside, wrapped in old silk, a stoppered bottle that glows.'); }
      else { const res = await startBattle(['wisp', 'wisp'].filter(x => ENEMIES[x]), { bg: 'forest', returnTrack: 'travel' }); if (res === 'win') { G.gold += 50; await say(null, 'Where they burned out, 50 G worth of old coins lie in the moss.'); } }
    }
  },
  {
    id: 'ashspring', w: 2,
    when: (b) => b === 'ash',
    run: async () => {
      await say(null, 'Steam rising from a crack in the grey: a hot spring, ringed with Ashborn prayer stones.');
      const c = await ask(null, 'The water is clear and very hot.', ['Rest here a while.', 'Keep moving. This is their land.'], null, false);
      if (c === 0) { healParty(); if (withMe('varek')) addMorale('varek', 6); await say(null, 'The heat goes all the way to the bone. Everyone is back to full strength.'); }
      else { if (withMe('varek')) addMorale('varek', 8); G.rep += 1; await say(null, 'You walk on. If anyone was watching from the rocks, they let you go.'); }
    }
  },
  {
    id: 'stars', w: 1,
    when: (b, ids) => b !== 'ash',
    run: async (s, ids) => {
      await say(null, 'You make camp late. There is no moon, and the sky is so full of stars it looks spilled.');
      if (ids.length) { const who = pick(ids); await say(COMPANIONS[who].name, pick([`Back home you can't see half of these.`, `My mother used to say every star's someone who got where they were going.`, `Do you think there's a sky like this where you're from? Before, I mean.`]), 'c:' + who); addMorale(who, 4); }
      healParty(); await say(null, 'You sleep well. Everyone is back to full strength.');
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
