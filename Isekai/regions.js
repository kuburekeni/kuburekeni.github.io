// =====================================================================
//  regions.js : the new country
//   - biome tiles: sand, snow, mud, bog water, reeds, heather, peaks,
//     snowy pines, waystones, ruined pillars, barricades, the Rift,
//     cave mouths, boats, ice, flooded floors, levers and rune doors
//   - new beasts: crabs, serpents, bears, raptors, boars
//   - three new towns (Gullhaven, Cairnstead, Mirewatch) with inns,
//     shops and homes, and seven new places to explore: the Wreckers'
//     Grotto, the Hollow Barrow, Silvane Grove, the Sunken Shrine,
//     Old Aurel, Rimeheart Hollow and Redcrag Fort
//  Loads before detail.js so the outdoor maps get the fuller countryside.
// =====================================================================

// ---------------------------------------------------------------- doors that open with the story
// map.gates: [{ x, y, w, h, ch, open() }] — while shut, those tiles read as ch
{
  const t0 = WorldScene.prototype.tile;
  WorldScene.prototype.tile = function (x, y) {
    const gs = this.map && this.map.gates;
    if (gs) for (const g of gs) if (x >= g.x && x < g.x + (g.w || 1) && y >= g.y && y < g.y + (g.h || 1) && !g.open()) return g.ch;
    return t0.call(this, x, y);
  };
  const it0 = WorldScene.prototype.interact;
  WorldScene.prototype.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy;
    const gs = this.map.gates;
    if (gs) for (const g of gs) if (x >= g.x && x < g.x + (g.w || 1) && y >= g.y && y < g.y + (g.h || 1) && !g.open()) { this.run(() => g.msg ? (typeof g.msg === 'function' ? g.msg() : say(null, g.msg)) : say(null, 'The way is shut.')); return; }
    return it0.call(this);
  };
}

// ---------------------------------------------------------------- biome tiles
const BIOME_TILES = {
  'ä': { solid: 0 }, 'ö': { solid: 0 }, 'ü': { solid: 0 }, 'µ': { solid: 1, anim: 1 }, 'ø': { solid: 0 }, 'å': { solid: 0 },
  'Ä': { solid: 1 }, 'Ö': { solid: 1 }, '°': { solid: 1, ground: 1 }, '¤': { solid: 1, ground: 1 }, '¦': { solid: 1, ground: 1 },
  '«': { solid: 1, anim: 1, ground: 1 }, '»': { solid: 1, door: 1 }, 'ß': { solid: 1, anim: 1 }, '¿': { solid: 0 }, '¡': { solid: 1 },
  'ÿ': { solid: 0, anim: 1 }, '÷': { solid: 1, ground: 1 }, '¬': { solid: 1, ground: 1 }, '×': { solid: 1 }, '¢': { solid: 1, ground: 1 }, '¸': { solid: 0, anim: 1 }
};
for (const k in BIOME_TILES) {
  const T = BIOME_TILES[k];
  if (T.solid) SOLID.add(k);
  if (T.door) DOOR_TILES.add(k);
  if (T.anim) ANIMATED.add(k);
  if (T.ground) ON_GROUND.add(k);
}
Object.assign(LIGHT_TILES, { '°': ['rgba(140,200,255,.45)', 70], '«': ['rgba(200,60,255,.55)', 150], '¸': ['rgba(255,240,170,.6)', 46] });
{
  const sg0 = sameGroup;
  sameGroup = function (a, b) {
    if (a === 'Ä') return b === 'Ä';
    if (a === 'µ') return b === 'µ' || b === 'B';
    if (a === 'ä') return b === 'ä' || b === '~' || b === 'B' || b === 'ß';
    if (a === 'ö') return b === 'ö' || b === 'Ö' || b === 'Ä';
    if (a === '¡') return b === '¡';
    if (a === 'ÿ') return b === 'ÿ' || b === '~';
    if (a === '~' && (b === 'ß')) return true;
    return sg0(a, b);
  };
  const dt0 = drawTile;
  drawTile = function (x, ch, theme, v, frame, mask, up, under) {
    if (!BIOME_TILES[ch]) return dt0(x, ch, theme, v, frame, mask, up, under);
    const r = rng(v * 977 + ch.charCodeAt(0) * 131 + frame * 7 + 1);
    const R = (X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
    const E = (cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
    const ground = () => under ? drawTile(x, under, theme, v, 0, 0, '', '') : dt0(x, '.', theme, v, 0, 0, '');
    const ink = UI.ink;
    switch (ch) {
      case 'ä': { // sand, with ripples and the odd shell; it meets water in a wet band
        R(0, 0, 32, 32, '#e6d29a');
        ditherBlob(x, r, '#dcc488', 3, 4, 9); ditherBlob(x, r, '#f0e0b0', 2, 3, 7);
        for (let i = 0; i < 40; i++) R(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1, r() < 0.5 ? '#cdb47a' : '#f6ecc8');
        for (let i = 0; i < 3; i++) { const yy = 6 + i * 9 + Math.floor(r() * 3); R(3 + Math.floor(r() * 6), yy, 10 + Math.floor(r() * 10), 1, '#d4bc82'); }
        if (v === 1) { R(20, 20, 4, 3, '#f4e8e0'); R(21, 21, 2, 1, '#e8a8a0'); }
        if (v === 3) { R(8, 22, 3, 2, '#8a8478'); }
        if (mask & 1) R(0, 0, 32, 3, 'rgba(120,150,90,.35)');
        break;
      }
      case 'ö': { // snow
        R(0, 0, 32, 32, '#bfcadb');
        ditherBlob(x, r, '#aebbd0', 3, 4, 10); ditherBlob(x, r, '#d0d9e6', 3, 3, 8);
        for (let i = 0; i < 24; i++) R(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1, r() < 0.6 ? '#a4b2c8' : '#e8eef6');
        if (v === 2) { R(10, 14, 2, 1, '#b8c4d8'); R(13, 16, 2, 1, '#b8c4d8'); R(16, 14, 2, 1, '#b8c4d8'); }
        if (v === 0) { R(22, 8, 3, 2, '#8a8478'); R(22, 8, 3, 1, '#f8fbff'); }
        break;
      }
      case 'ü': { // fen mud with a few tufts
        R(0, 0, 32, 32, '#5e5638');
        ditherBlob(x, r, '#524a30', 3, 4, 10); ditherBlob(x, r, '#6a6444', 3, 3, 8);
        for (let i = 0; i < 30; i++) R(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1, r() < 0.5 ? '#4a4228' : '#746e4c');
        for (let i = 0; i < 4; i++) { const a = Math.floor(r() * 26) + 2, b = Math.floor(r() * 22) + 8; R(a, b - 4, 1, 5, '#5a7a3a'); R(a + 1, b - 5, 1, 5, '#6a8a44'); R(a - 1, b - 3, 1, 3, '#4a6a30'); }
        if (v === 1) { E(18, 22, 5, 2, '#3a3a2a'); E(17, 21, 3, 1, 'rgba(160,190,200,.35)'); }
        break;
      }
      case 'µ': { // bog water: dark, still, lily pads and bubbles
        R(0, 0, 32, 32, '#2e3a2a');
        ditherBlob(x, r, '#26321f', 3, 5, 10); ditherBlob(x, r, '#3a4a34', 2, 3, 7);
        for (let i = 0; i < 5; i++) R(Math.floor(r() * 26), Math.floor(r() * 30), 5 + Math.floor(r() * 5), 1, 'rgba(160,190,150,.18)');
        if (v % 2 === 0) { E(10, 12, 4, 3, '#3a6a2a'); R(10, 12, 3, 1, '#2e3a2a'); E(10, 11, 1, 1, '#e890b0'); }
        if (frame) { E(22, 22, 1.5, 1.5, 'rgba(200,220,190,.55)'); E(25, 19, 1, 1, 'rgba(200,220,190,.45)'); } else E(23, 21, 2, 1, 'rgba(200,220,190,.25)');
        if (!(mask & 1)) {} else { R(0, 0, 32, 3, '#4a4430'); R(0, 3, 32, 1, '#3a3a24'); }
        if (mask & 8) R(0, 0, 2, 32, '#4a4430'); if (mask & 2) R(30, 0, 2, 32, '#4a4430'); if (mask & 4) R(0, 30, 32, 2, '#3a3a24');
        break;
      }
      case 'ø': { // reeds over mud
        drawTile(x, 'ü', theme, v, 0, 0, '', '');
        for (let i = 0; i < 10; i++) { const a = 2 + Math.floor(r() * 28), h = 12 + Math.floor(r() * 12); R(a, 30 - h, 1, h, i % 2 ? '#6a7a3a' : '#5a6a30'); R(a + 1, 31 - h, 1, h - 2, '#7a8a44'); if (i % 3 === 0) { R(a - 1, 30 - h - 4, 3, 5, '#6a4a2a'); R(a, 30 - h - 5, 1, 1, '#8a6a3a'); } }
        break;
      }
      case 'å': { // heather on the moor
        dt0(x, '.', theme, v, 0, 0, '');
        x.fillStyle = 'rgba(110,80,110,.18)'; x.fillRect(0, 0, 32, 32);
        for (let i = 0; i < 14; i++) { const a = Math.floor(r() * 30), b = Math.floor(r() * 26) + 4; R(a, b, 2, 3, '#4a6a34'); R(a, b - 2, 2, 2, r() < 0.5 ? '#a86aa8' : '#c88ac0'); R(a + 1, b - 3, 1, 1, '#e0b0e0'); }
        break;
      }
      case 'Ä': { // mountain: craggy grey stone; peaks where the tile above is open sky
        const top = !(mask & 1) ? 0 : 1;
        R(0, 0, 32, 32, '#6a6470');
        ditherBlob(x, r, '#5a5460', 3, 5, 10); ditherBlob(x, r, '#7a7480', 3, 4, 9);
        for (let i = 0; i < 5; i++) { const a = Math.floor(r() * 28), b = Math.floor(r() * 28); R(a, b, 4 + Math.floor(r() * 5), 1, '#8a8490'); R(a, b + 1, 3, 1, '#4a4450'); }
        for (let i = 0; i < 3; i++) { const a = Math.floor(r() * 24); x.strokeStyle = '#4a4450'; x.beginPath(); x.moveTo(a, 0); x.lineTo(a + 4, 14); x.lineTo(a + 1, 32); x.stroke(); }
        if (top) {
          ground();
          x.fillStyle = '#3a3440'; x.beginPath(); x.moveTo(-1, 33); x.lineTo(14 + (v % 3) * 2, 2); x.lineTo(33, 33); x.fill();
          x.fillStyle = '#6a6470'; x.beginPath(); x.moveTo(1, 33); x.lineTo(14 + (v % 3) * 2, 4); x.lineTo(31, 33); x.fill();
          x.fillStyle = '#8a8490'; x.beginPath(); x.moveTo(5, 33); x.lineTo(14 + (v % 3) * 2, 4); x.lineTo(15, 33); x.fill();
          if (theme === 'snow' || v % 2 === 0) { x.fillStyle = '#f0f4fa'; x.beginPath(); x.moveTo(9 + (v % 3) * 2, 13); x.lineTo(14 + (v % 3) * 2, 4); x.lineTo(20 + (v % 3) * 2, 13); x.lineTo(16 + (v % 3) * 2, 11); x.lineTo(13 + (v % 3) * 2, 14); x.fill(); }
        }
        if (mask & 4) { R(0, 29, 32, 3, 'rgba(20,12,30,.35)'); }
        break;
      }
      case 'Ö': { // pine under snow
        drawTile(x, 'ö', theme, v, 0, 0, '', '');
        E(16, 29, 10, 3, 'rgba(60,70,100,.3)');
        R(14, 22, 4, 8, '#4a2e18');
        const P = ['#0e2e22', '#1f5836', '#327444'];
        for (let i = 0; i < 3; i++) { const ay = 2 + i * 7, hw = 6 + i * 4, by = ay + 11; x.fillStyle = P[0]; x.beginPath(); x.moveTo(16, ay - 1); x.lineTo(16 + hw + 1, by + 1); x.lineTo(16 - hw - 1, by + 1); x.fill(); x.fillStyle = P[1]; x.beginPath(); x.moveTo(16, ay); x.lineTo(16 + hw, by); x.lineTo(16 - hw, by); x.fill(); x.fillStyle = '#f4f8ff'; x.beginPath(); x.moveTo(16, ay); x.lineTo(16 - hw * 0.8, by - 3); x.lineTo(16 - hw * 0.2, by - 5); x.lineTo(16 + hw * 0.4, by - 3); x.fill(); }
        break;
      }
      case '°': { // waystone: a standing stone with a blue rune
        ground();
        E(16, 29, 9, 3, 'rgba(0,0,0,.3)');
        R(10, 4, 12, 26, ink); R(11, 5, 10, 24, '#8a8a98'); R(11, 5, 3, 24, '#a8a8b8'); R(18, 5, 3, 24, '#6a6a78'); R(12, 3, 8, 2, ink); R(13, 3, 6, 2, '#9a9aa8');
        const gl = frame ? '#bfe6ff' : '#8ac8ff';
        R(15, 10, 2, 12, gl); R(13, 13, 6, 2, gl); R(14, 19, 4, 1, gl); R(15, 9, 2, 1, '#ffffff');
        break;
      }
      case '¤': { // ruined pillar
        ground();
        E(16, 29, 9, 3, 'rgba(0,0,0,.3)');
        R(10, 6 + (v % 2) * 6, 12, 24 - (v % 2) * 6, ink); R(11, 7 + (v % 2) * 6, 10, 22 - (v % 2) * 6, '#d0ccc0'); R(11, 7 + (v % 2) * 6, 2, 22 - (v % 2) * 6, '#e8e4d8'); R(18, 7 + (v % 2) * 6, 3, 22 - (v % 2) * 6, '#a8a498');
        for (let i = 0; i < 3; i++) R(13 + i * 3, 9 + (v % 2) * 6, 1, 18 - (v % 2) * 6, '#b8b4a8');
        R(8, 26, 16, 4, ink); R(9, 27, 14, 3, '#c0bcb0');
        if (v % 2) { R(9, 10, 5, 2, '#b8b4a8'); } else { R(8, 4, 16, 4, ink); R(9, 5, 14, 3, '#d8d4c8'); }
        R(12, 14 + (v % 3) * 3, 3, 4, '#5a8a3a'); R(13, 13 + (v % 3) * 3, 2, 2, '#7aaa4a');
        break;
      }
      case '¦': { // barricade of sharpened stakes
        ground();
        R(0, 26, 32, 4, 'rgba(0,0,0,.25)');
        for (let i = 0; i < 4; i++) { const bx = 2 + i * 8; R(bx, 8, 5, 20, ink); R(bx + 1, 9, 3, 18, '#7a5230'); R(bx + 1, 9, 1, 18, '#9a7040'); x.fillStyle = '#c8a878'; x.beginPath(); x.moveTo(bx, 9); x.lineTo(bx + 2.5, 2); x.lineTo(bx + 5, 9); x.fill(); }
        R(0, 14, 32, 3, ink); R(0, 15, 32, 1, '#5a3a20'); R(0, 21, 32, 3, ink); R(0, 22, 32, 1, '#5a3a20');
        R(12, 15, 8, 6, '#8a2a2a'); R(14, 16, 4, 1, '#e8e0d0');
        break;
      }
      case '«': { // the Rift: a tear in the world, turning
        ground();
        const t = frame;
        x.save(); x.translate(16, 16);
        for (let i = 0; i < 4; i++) { x.rotate(0.8 + t * 0.4); x.fillStyle = ['#2a0a3a', '#6a1a8a', '#c040ff', '#ff6040'][i]; x.beginPath(); x.ellipse(0, 0, 13 - i * 3, 6 - i, 0, 0, 7); x.fill(); }
        x.restore();
        E(16, 16, 3, 3, '#ffffff');
        break;
      }
      case '»': { // cave mouth in a rock face
        R(0, 0, 32, 32, '#5a5460'); ditherBlob(x, r, '#4a4450', 3, 5, 10); ditherBlob(x, r, '#6a6470', 2, 4, 8);
        E(16, 22, 12, 13, ink); E(16, 23, 10, 11, '#0a070e'); R(4, 23, 24, 9, '#0a070e'); R(4, 28, 24, 4, '#140e18');
        for (let i = 0; i < 4; i++) R(7 + i * 5, 11 + (i % 2) * 2, 2, 4, '#3a3440');
        R(3, 30, 26, 2, '#7a6a5a');
        break;
      }
      case 'ß': { // a rowing boat moored on the water
        dt0(x, '~', theme, v, frame, 15, '');
        const b = frame ? 1 : 0;
        E(16, 21 + b, 13, 6, ink); E(16, 20 + b, 12, 5, '#8a5a30'); E(16, 19 + b, 10, 3, '#5a3418'); R(6, 18 + b, 20, 1, '#a87440');
        R(9, 18 + b, 2, 3, '#6a4020'); R(21, 18 + b, 2, 3, '#6a4020'); R(4, 23 + b, 24, 1, 'rgba(255,255,255,.3)');
        break;
      }
      case '¿': { // ice floor
        R(0, 0, 32, 32, '#a8d0e8'); ditherBlob(x, r, '#98c4e0', 3, 5, 10); ditherBlob(x, r, '#c8e8f8', 3, 3, 8);
        for (let i = 0; i < 3; i++) { const a = Math.floor(r() * 24); x.strokeStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.moveTo(a, Math.floor(r() * 32)); x.lineTo(a + 6, Math.floor(r() * 32)); x.stroke(); }
        R(4 + (v * 7) % 20, 6, 3, 1, '#ffffff');
        break;
      }
      case '¡': { // ice wall
        R(0, 0, 32, 32, '#4a7a9a'); ditherBlob(x, r, '#3a6a8a', 3, 5, 10); ditherBlob(x, r, '#6a9aba', 3, 4, 9);
        for (let i = 0; i < 4; i++) { const a = 2 + Math.floor(r() * 26); x.fillStyle = 'rgba(200,240,255,.5)'; x.beginPath(); x.moveTo(a, 32); x.lineTo(a + 3, 4 + Math.floor(r() * 10)); x.lineTo(a + 6, 32); x.fill(); }
        if (mask & 4) { R(0, 26, 32, 6, '#2a4a6a'); R(0, 26, 32, 1, '#9ad0f0'); for (let i = 0; i < 32; i += 5) R(i, 26, 2, 4, '#c8f0ff'); }
        break;
      }
      case 'ÿ': { // flooded flagstones
        R(0, 0, 32, 32, '#4a5a6a');
        for (let j = 0; j < 32; j += 8) for (let i = (j / 8) % 2 * 8; i < 32; i += 16) R(i + 1, j + 1, 14, 6, '#566878');
        x.fillStyle = 'rgba(80,140,170,.45)'; x.fillRect(0, 0, 32, 32);
        R(3 + frame * 4, 9, 7, 1, 'rgba(220,240,255,.45)'); R(18 - frame * 3, 22, 8, 1, 'rgba(220,240,255,.35)');
        break;
      }
      case '÷': case '¬': { // a lever in a stone socket
        ground();
        R(8, 22, 16, 8, ink); R(9, 23, 14, 6, '#6a6a78'); R(9, 23, 14, 1, '#9a9aa8');
        const down = ch === '¬';
        x.strokeStyle = ink; x.lineWidth = 4; x.beginPath(); x.moveTo(16, 24); x.lineTo(down ? 24 : 8, 8); x.stroke();
        x.strokeStyle = '#a87440'; x.lineWidth = 2; x.beginPath(); x.moveTo(16, 24); x.lineTo(down ? 24 : 8, 8); x.stroke(); x.lineWidth = 1;
        E(down ? 24 : 8, 8, 3, 3, '#e5534b');
        break;
      }
      case '×': { // sealed rune door
        R(0, 0, 32, 32, '#2a2238'); R(2, 0, 28, 32, ink); R(3, 1, 26, 31, '#3a3048'); R(15, 1, 2, 31, ink);
        for (let i = 0; i < 4; i++) R(5, 4 + i * 7, 22, 1, '#4a4058');
        E(16, 15, 8, 8, '#1a1428'); x.strokeStyle = '#c88aff'; x.lineWidth = 2; x.beginPath(); x.arc(16, 15, 6, 0, 7); x.stroke(); R(15, 9, 2, 12, '#c88aff'); R(10, 14, 12, 2, '#c88aff'); x.lineWidth = 1;
        break;
      }
      case '¢': { // a cairn of stones
        ground();
        E(16, 29, 11, 3, 'rgba(0,0,0,.3)');
        for (const [cx, cy, rr] of [[10, 25, 6], [22, 25, 6], [16, 26, 6], [13, 19, 5], [20, 19, 5], [16, 13, 5], [16, 8, 3]]) { E(cx, cy, rr + 1, rr * 0.8 + 1, ink); E(cx, cy, rr, rr * 0.8, '#8a8478'); E(cx - 1, cy - 1, rr * 0.5, rr * 0.4, '#a8a498'); }
        break;
      }
      case '¸': { // a glint on the ground: something worth picking up
        drawTile(x, under || '.', theme, v, 0, 0, '', '');
        const s = frame ? 3 : 2;
        R(16 - s, 18, s * 2 + 1, 1, '#fff8d0'); R(16, 18 - s, 1, s * 2 + 1, '#fff8d0'); R(15, 17, 3, 3, '#ffe880');
        break;
      }
    }
  };
}

// ---------------------------------------------------------------- new beasts
Object.assign(MONSTERS, {
  crab:     { type: 'crab', g: '#d8603a', d: '#8a2e1a', r: '#1a1426' },
  tidecrab: { type: 'crab', g: '#4a9aa8', d: '#1e5a6a', r: '#1a1426' },
  serpent:  { type: 'serpent', g: '#4a8a4a', d: '#1e4a28', r: '#ffe050' },
  hydra:    { type: 'serpent', g: '#3a6a5a', d: '#142a24', r: '#ff5050', big: 1 },
  naga:     { type: 'serpent', g: '#3a8aa8', d: '#14405a', r: '#bfe6ff' },
  bear:     { type: 'bear', g: '#6a4a30', d: '#3a2618', r: '#1a1426' },
  yeti:     { type: 'bear', g: '#e8ecf4', d: '#9aa4b8', r: '#4a8ad8' },
  gull:     { type: 'raptor', g: '#e8ecf0', d: '#8a94a0', r: '#f2a03a' },
  raven:    { type: 'raptor', g: '#2a2436', d: '#120e1a', r: '#e5534b' },
  harpy:    { type: 'raptor', g: '#a8743a', d: '#5a3418', r: '#f2c94c' },
  boar:     { type: 'boar', g: '#6a4a3a', d: '#3a2418', r: '#e5534b' },
  tusk:     { type: 'boar', g: '#8a6a5a', d: '#4a3020', r: '#ffe050' },
  moorwolf: { type: 'wolf', g: '#8a7a6a', d: '#4a3e34', r: '#ffd050' },
  frostwolf:{ type: 'wolf', g: '#e8eef8', d: '#8a9ab8', r: '#4ad0ff' },
  rimefang: { type: 'wolf', g: '#cfe8ff', d: '#5a7aa8', r: '#4ad0ff', glow: '#9ae0ff' },
  hound:    { type: 'wolf', g: '#a85a3a', d: '#5a2a18', r: '#ffe050' },
  tideslime:{ type: 'slime', g: '#5ad0c0', d: '#1e7a80', w: '#e8fff8' },
  bogslime: { type: 'slime', g: '#7a8a4a', d: '#3a4220', w: '#f0f8d8' },
  iceslime: { type: 'slime', g: '#c8ecff', d: '#5a9ad8', w: '#ffffff' },
  wight:    { type: 'wisp', g: '#c8f0c0', d: '#4a8a5a', r: '#ffffff' },
  fenwisp:  { type: 'wisp', g: '#d8ff90', d: '#6a8a2a', r: '#ffffff' },
  icewisp:  { type: 'wisp', g: '#e8f8ff', d: '#6aa8e0', r: '#ffffff' },
  sprite:   { type: 'imp', g: '#5aa84a', d: '#2a5a24', r: '#ffe050', n: '#e8d8c0' },
  moth:     { type: 'bat', g: '#d8c8a0', d: '#8a7a5a', r: '#4a2a6a' },
  blight:   { type: 'treant', g: '#6a3a7a', d: '#3a2030', r: '#ff60c0' },
  sentry:   { type: 'golem', g: '#6a7a9a', d: '#3a4458', r: '#8affc8' },
  sentinel: { type: 'golem', g: '#c8a848', d: '#6a5420', r: '#ffffff' },
  crag:     { type: 'golem', g: '#7a6a5a', d: '#4a3e30', r: '#ff8040' },
  mossgolem:{ type: 'golem', g: '#5a7a4a', d: '#2e4224', r: '#e8ff60' },
  widow:    { type: 'spider', g: '#2a2430', d: '#120e18', r: '#e5534b' }
});
{
  const ms0 = monsterSprite;
  monsterSprite = function (id, flip, res = 48) {
    const m = MONSTERS[id];
    if (!m || !['crab', 'serpent', 'bear', 'raptor', 'boar'].includes(m.type)) return ms0(id, flip, res);
    const key = 'mon_' + id + (flip ? 'f' : '') + res;
    if (SpriteCache[key]) return SpriteCache[key];
    const S = 48, [c, x] = mkCanvas(S, S);
    const E = (cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, 7); x.fill(); };
    const Pl = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); };
    const L = (pts, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.stroke(); x.lineWidth = 1; };
    const g = m.g, d = m.d, hl = shade(g, 0.25);
    if (m.type === 'crab') {
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) L([24 + s * 10, 34 + i * 2, 24 + s * (17 + i * 2), 30 + i * 3, 24 + s * (20 + i * 2), 42 + i], d, 2);
      L([16, 30, 8, 22, 6, 14], d, 3); L([32, 30, 40, 22, 42, 14], d, 3);
      E(6, 12, 6, 5, g); Pl([1, 9, 6, 13, 0, 15], d); E(42, 12, 6, 5, g); Pl([47, 9, 42, 13, 48, 15], d);
      E(24, 34, 15, 9, d); E(24, 32, 14, 8, g); E(20, 29, 6, 3, hl);
      L([20, 26, 19, 19], d, 2); L([28, 26, 29, 19], d, 2); E(19, 18, 2.5, 2.5, '#f0f0f0'); E(29, 18, 2.5, 2.5, '#f0f0f0'); E(19.5, 18, 1.2, 1.2, m.r); E(29.5, 18, 1.2, 1.2, m.r);
      for (let i = 0; i < 4; i++) E(17 + i * 5, 36, 1.2, 1.2, shade(g, -0.2));
    } else if (m.type === 'serpent') {
      const big = m.big;
      x.lineCap = 'round';
      x.strokeStyle = d; x.lineWidth = 12; x.beginPath(); x.moveTo(4, 42); x.bezierCurveTo(14, 46, 30, 46, 34, 36); x.bezierCurveTo(38, 26, 26, 22, 28, 12); x.stroke();
      x.strokeStyle = g; x.lineWidth = 9; x.beginPath(); x.moveTo(4, 42); x.bezierCurveTo(14, 46, 30, 46, 34, 36); x.bezierCurveTo(38, 26, 26, 22, 28, 12); x.stroke();
      x.strokeStyle = shade(g, 0.35); x.lineWidth = 3; x.beginPath(); x.moveTo(8, 43); x.bezierCurveTo(16, 45, 28, 44, 32, 36); x.stroke(); x.lineWidth = 1;
      if (big) for (const [hx, hy] of [[12, 16], [40, 18]]) { x.strokeStyle = d; x.lineWidth = 8; x.beginPath(); x.moveTo(28, 30); x.quadraticCurveTo(hx + 4, hy + 14, hx, hy); x.stroke(); x.strokeStyle = g; x.lineWidth = 5; x.stroke(); x.lineWidth = 1; E(hx, hy, 6, 4.5, g); E(hx, hy - 1, 4, 2, hl); E(hx + 2, hy - 1, 1.3, 1.3, m.r); }
      E(29, 10, 8, 6, d); E(29, 9, 7, 5, g); Pl([33, 11, 40, 13, 33, 14], d); E(27, 7, 3, 2, hl);
      E(31, 8, 1.6, 1.6, m.r); L([36, 13, 41, 15, 43, 13], '#e5534b', 1);
      for (let i = 0; i < 6; i++) E(10 + i * 4, 43 - (i > 3 ? (i - 3) * 2 : 0), 1, 1, shade(g, -0.3));
      Pl([20, 4, 24, 0, 26, 5], shade(d, -0.2)); Pl([28, 3, 32, 0, 32, 5], shade(d, -0.2));
    } else if (m.type === 'bear') {
      E(24, 32, 17, 12, d); E(24, 30, 16, 11, g); E(18, 26, 8, 5, hl);
      for (const lx of [10, 17, 27, 34]) { x.fillStyle = lx < 20 ? d : g; x.fillRect(lx, 36, 6, 10); x.fillStyle = shade(d, -0.3); x.fillRect(lx, 44, 7, 2); }
      E(37, 20, 10, 9, g); E(42, 23, 5, 4, shade(g, 0.15)); E(45, 22, 2, 1.6, '#1a1426');
      E(32, 12, 3.5, 3.5, g); E(41, 12, 3.5, 3.5, g); E(32, 12, 1.6, 1.6, d); E(41, 12, 1.6, 1.6, d);
      E(38, 18, 1.8, 1.8, m.r); L([42, 26, 46, 26], shade(d, -0.3), 1);
      if (id === 'yeti') { for (let i = 0; i < 12; i++) E(10 + (i * 7) % 28, 22 + (i * 5) % 16, 2, 3, '#ffffff'); }
    } else if (m.type === 'raptor') {
      Pl([24, 22, 2, 8, 8, 22, 4, 28, 16, 28], d); Pl([24, 22, 46, 8, 40, 22, 44, 28, 32, 28], d);
      Pl([24, 22, 6, 12, 12, 22, 16, 26], g); Pl([24, 22, 42, 12, 36, 22, 32, 26], g);
      E(24, 28, 7, 9, g); E(24, 31, 5, 6, shade(g, 0.18));
      Pl([20, 36, 24, 46, 28, 36], d);
      E(24, 18, 5, 5, g); Pl([27, 18, 33, 20, 27, 21], m.r); E(25.5, 17, 1.4, 1.4, '#1a1426');
      L([21, 37, 19, 44], m.r, 2); L([27, 37, 29, 44], m.r, 2);
    } else if (m.type === 'boar') {
      E(22, 30, 16, 10, d); E(22, 28, 15, 9, g);
      for (let i = 0; i < 9; i++) Pl([10 + i * 3, 20, 12 + i * 3, 14 - (i % 2) * 2, 14 + i * 3, 21], shade(d, -0.15));
      for (const lx of [10, 16, 26, 32]) { x.fillStyle = lx < 20 ? d : g; x.fillRect(lx, 34, 5, 10); x.fillStyle = '#1a1210'; x.fillRect(lx, 42, 5, 2); }
      E(38, 28, 9, 8, g); E(45, 31, 4, 4, shade(g, 0.15)); E(46, 31, 1, 1, '#1a1426'); E(46, 33, 1, 1, '#1a1426');
      Pl([40, 33, 44, 36, 47, 28, 45, 35], '#f0ece0'); Pl([35, 22, 36, 16, 39, 21], d);
      E(39, 25, 1.8, 1.8, m.r);
      L([5, 26, 2, 22, 4, 19], d, 2);
    }
    { const rr = rng(id.length * 91 + 7), dd = x.getImageData(0, 0, S, S), p = dd.data;
      for (let i = 0; i < p.length; i += 4) if (p[i + 3] > 110 && rr() < 0.22) { const k = 1 + (rr() - 0.5) * 0.16; p[i] *= k; p[i + 1] *= k; p[i + 2] *= k; }
      x.putImageData(dd, 0, 0); }
    outline(c); shadeSprite(c, 1.1);
    let out = c;
    if (res !== S) { const [rc, rx] = mkCanvas(res, res); rx.imageSmoothingEnabled = false; rx.drawImage(c, 0, 0, res, res); out = rc; }
    if (flip) out = flipped(out);
    SpriteCache[key] = out;
    return out;
  };
  // world sprites for the new beasts: wolves, slimes and bats already draw themselves small
  const dc0 = WorldScene.prototype.drawChar;
  WorldScene.prototype.drawChar = function (key, dir, frame, sx, sy, n) {
    if (key.startsWith('m:') && MONSTERS[key.slice(2)] && ['crab', 'serpent', 'bear', 'raptor', 'boar'].includes(MONSTERS[key.slice(2)].type)) {
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx + 16, sy + 30, 12, 4, 0, 0, 7); ctx.fill();
      const bob = Math.round(Math.sin(TIME * 4 + sx) * 1.5);
      ctx.drawImage(monsterSprite(key.slice(2), dir === 'left', 48), sx - 8, sy - 16 + bob); return;
    }
    return dc0.call(this, key, dir, frame, sx, sy, n);
  };
}

// ---------------------------------------------------------------- new foes
function mkFoe(name, spr, L, o = {}) {
  const hp = Math.round((L < 10 ? 5.2 : 6.2) * L + 8), atk = Math.round(2 * L + 3), def = Math.round(L * 0.85 + 1);
  return Object.assign({ name, spr, hp, atk, def, mag: o.magic ? Math.round(2.2 * L + 4) : 0, spd: 7, xp: Math.round(1.1 * Math.pow(L, 1.55) + 3), gold: Math.round(L * 2.2 + 2), skills: [] }, o);
}
Object.assign(ENEMIES, {
  // the coast
  crab:      mkFoe('Shore Crab', 'crab', 6, { def: 9, spd: 4, weak: 'thunder', skills: ['guardup', 'crush'] }),
  gull:      mkFoe('Storm Gull', 'gull', 5, { spd: 14, weak: 'thunder', skills: ['blind', 'pilfer'] }),
  tideslime: mkFoe('Tide Slime', 'tideslime', 6, { magic: 1, weak: 'thunder', resist: 'ice', skills: ['icebolt'], ai: ['split'] }),
  wrecker:   mkFoe('Wrecker', 'wrecker', 8, { human: true, skills: ['feint', 'blind', 'pilfer'], wpn: 'isword' }),
  // the moor
  moorwolf:  mkFoe('Moor Wolf', 'moorwolf', 8, { spd: 10, weak: 'fire', skills: ['bite', 'howl'] }),
  boar:      mkFoe('Bristleback', 'boar', 8, { hp: 70, skills: ['crush', 'smash'] }),
  wight:     mkFoe('Barrow Wight', 'wight', 10, { magic: 1, weak: 'holy', resist: 'ice', skills: ['wail', 'drain'] }),
  raven:     mkFoe('Carrion Raven', 'raven', 7, { spd: 15, skills: ['blind', 'pilfer'] }),
  barrowbones: mkFoe('Barrow Guard', 'skeleton', 11, { weak: 'holy', resist: 'ice', skills: ['guardup', 'smash'] }),
  // Redcrag
  redcrag:   mkFoe('Redcrag Cutthroat', 'bandit', 9, { human: true, spd: 10, skills: ['feint', 'blind', 'pilfer'], wpn: 'dagger1' }),
  archer:    mkFoe('Redcrag Archer', 'poacher', 10, { human: true, spd: 11, skills: ['feint', 'blind'], wpn: 'bow1' }),
  hound:     mkFoe('Fort Hound', 'hound', 9, { spd: 12, weak: 'fire', skills: ['bite', 'howl'] }),
  // Silvane
  sprite:    mkFoe('Thorn Sprite', 'sprite', 10, { magic: 1, spd: 13, weak: 'fire', skills: ['firebolt', 'mend'], ai: ['healer'] }),
  moth:      mkFoe('Dusk Moth', 'moth', 10, { spd: 13, weak: 'fire', skills: ['drain', 'blind'] }),
  blightwolf:mkFoe('Blighted Wolf', 'swolf', 11, { spd: 12, weak: 'fire', skills: ['bite', 'howl'] }),
  // the mountains and the pass
  harpy:     mkFoe('Crag Harpy', 'harpy', 12, { spd: 15, weak: 'thunder', skills: ['blind', 'drain'] }),
  cragling:  mkFoe('Cragling', 'crag', 12, { def: 16, spd: 3, weak: 'thunder', resist: 'fire', skills: ['smash', 'guardup'] }),
  // the fen
  bogslime:  mkFoe('Bog Slime', 'bogslime', 12, { magic: 1, weak: 'fire', skills: ['poisonfang'], ai: ['split'] }),
  serpent:   mkFoe('Mire Serpent', 'serpent', 13, { spd: 11, weak: 'ice', skills: ['poisonfang', 'bite'] }),
  fenwisp:   mkFoe('Fen Light', 'fenwisp', 12, { magic: 1, spd: 12, weak: 'holy', skills: ['wail', 'drain'] }),
  // Old Aurel
  sentry:    mkFoe('Ruin Sentry', 'sentry', 14, { def: 20, spd: 4, weak: 'thunder', skills: ['smash', 'guardup', 'quake'] }),
  drowned:   mkFoe('Drowned Soldier', 'skeleton', 14, { weak: 'holy', resist: 'ice', skills: ['guardup', 'smash', 'drain'] }),
  naga:      mkFoe('Archive Naga', 'naga', 15, { magic: 1, spd: 12, weak: 'thunder', resist: 'ice', skills: ['icebolt', 'poisonfang'] }),
  // Frostpeak
  frostwolf: mkFoe('Frost Wolf', 'frostwolf', 16, { spd: 14, weak: 'fire', resist: 'ice', skills: ['bite', 'howl'] }),
  yeti:      mkFoe('Yeti', 'yeti', 17, { hp: 160, weak: 'fire', resist: 'ice', skills: ['crush', 'smash', 'quake'] }),
  icewisp:   mkFoe('Rime Wisp', 'icewisp', 16, { magic: 1, spd: 12, weak: 'fire', resist: 'ice', skills: ['icebolt', 'drain'] }),
  iceslime:  mkFoe('Glacier Slime', 'iceslime', 16, { magic: 1, weak: 'fire', resist: 'ice', skills: ['icebolt'], ai: ['split'] }),
  // bosses
  sorrel:    { name: 'Sorrel the Wrecker Queen', spr: 'sorrel', hp: 420, atk: 24, def: 11, mag: 0, spd: 11, xp: 260, gold: 300, boss: true, human: true, skills: ['feint', 'crush', 'blind', 'guardup'], brk: 120, wpn: 'axe2' },
  hollowking:{ name: 'The Hollow King', spr: 'hollowking', hp: 560, atk: 27, def: 14, mag: 26, spd: 8, xp: 340, gold: 360, boss: true, weak: 'holy', resist: 'ice', skills: ['darkflame', 'drain', 'smash', 'crush'], brk: 150, wpn: 'gsword1' },
  blightheart:{ name: 'The Blighted Heart', spr: 'blight', hp: 640, atk: 28, def: 15, mag: 30, spd: 6, xp: 400, gold: 380, boss: true, weak: 'fire', skills: ['crush', 'quake', 'mend', 'poisonfang'], brk: 160 },
  kettle:    { name: 'Mother Kettle', spr: 'kettle', hp: 480, atk: 26, def: 12, mag: 0, spd: 9, xp: 300, gold: 500, boss: true, human: true, skills: ['crush', 'howl', 'smash', 'guardup'], brk: 130, wpn: 'axe2' },
  hydra:     { name: 'The Mire Hydra', spr: 'hydra', hp: 900, atk: 34, def: 17, mag: 30, spd: 9, xp: 600, gold: 500, boss: true, weak: 'ice', skills: ['poisonfang', 'bite', 'firebreath', 'crush'], brk: 200 },
  sentinel:  { name: 'The Archive Sentinel', spr: 'sentinel', hp: 1050, atk: 36, def: 22, mag: 0, spd: 5, xp: 720, gold: 600, boss: true, weak: 'thunder', resist: 'fire', skills: ['smash', 'quake', 'crush', 'guardup'], brk: 240 },
  rimefang:  { name: 'Rimefang', spr: 'rimefang', hp: 1350, atk: 46, def: 22, mag: 34, spd: 15, xp: 1100, gold: 800, boss: true, weak: 'fire', resist: 'ice', skills: ['bite', 'howl', 'icebolt', 'crush'], brk: 260 }
});
for (const id of ['hydra', 'sentinel', 'rimefang']) ENEMIES[id].bigBoss = true;
{
  const mk0 = makeEnemy;
  makeEnemy = function (g, mapId) {
    const e = mk0(g, mapId), id = typeof g === 'string' ? g : g.id;
    if (ENEMIES[id] && ENEMIES[id].bigBoss) e.size = 168;
    else if (['blightheart', 'yeti', 'boar'].includes(id)) e.size = e.size < 120 ? (id === 'blightheart' ? 150 : 112) : e.size;
    return e;
  };
}

// ---------------------------------------------------------------- people
Object.assign(CHARS, {
  wrecker:  { pal: { h: '#3a2616', s: SK3, c: '#3a4a5a', d: '#24323e', t: '#a8a088', p: '#2e2a26', b: '#1a1614' }, hair: 'short', outfit: 'leather', mods: ['beard'] },
  sorrel:   { pal: { h: '#a8322e', s: SK2, c: '#2a3a4a', d: '#1a2430', t: '#c8a040', p: '#2a2430', b: '#140e10', n: '#c8a040' }, hair: 'braids', outfit: 'leather', mods: ['girl', 'cape'] },
  kettle:   { pal: { h: '#8a8480', s: SK4, c: '#5a2a2a', d: '#3a1a1a', t: '#b8a078', p: '#2e2a26', b: '#1a1614' }, hair: 'bun', outfit: 'leather', mods: ['girl', 'stout'] },
  hollowking:{ pal: { h: '#e8e6dc', s: '#d8d6cc', e: '#7affb0', c: '#3a3a48', d: '#22222e', t: '#c8a040', p: '#3a3a48', b: '#1a1a22', n: '#c8a040' }, hair: 'none', outfit: 'plate', mods: ['bones', 'cape'] },
  ines:     { pal: { h: '#a8502a', s: SK2, c: '#2e3f62', d: '#1e2a42', t: '#e0b84a', p: '#2a2438', b: '#1a1418' }, hair: 'bun', outfit: 'noble', mods: ['girl'] },
  mabry:    { pal: { h: '#e8e4dc', s: SK3, c: '#3a5a7a', d: '#24405a', p: '#2e2a26', b: '#1a1614' }, hair: 'short', outfit: 'cloak', mods: ['beard', 'stout'] },
  pip:      { pal: { h: '#e8c060', s: SK, c: '#c84a4a', d: '#8a2a2a', p: '#3a3a55', b: '#3a2a1a' }, hair: 'ponytail', mods: ['girl', 'child'] },
  sailor:   { pal: { h: '#16121c', s: SK5, c: '#e8e8f0', d: '#2e3f82', t: '#2e3f82', p: '#2e3f82', b: '#1a1418' }, hair: 'buzz', mods: ['beard'] },
  fishwife: { pal: { h: '#6a3a1e', s: SK3, c: '#6a7a5a', d: '#4a5a3a', p: '#4a5a3a', b: '#2a1e14' }, hair: 'bun', mods: ['girl', 'skirt', 'apron', 'stout'] },
  bryony:   { pal: { h: '#c8783a', s: SK2, c: '#4a6a3a', d: '#2e4a24', t: '#c8a040', p: '#3a4a2a', b: '#2a1a10', n: '#8a2a2a' }, hair: 'braids', outfit: 'chain', mods: ['girl', 'cape'] },
  morwen:   { pal: { h: '#d8d4e8', s: SK, c: '#4a3a6a', d: '#2e2448', t: '#bfe6ff', p: '#2e2448', b: '#1a1428' }, hair: 'long', outfit: 'robe', mods: ['girl', 'hood'] },
  ewan:     { pal: { h: '#a8502a', s: SK, c: '#8a7a4a', d: '#5a4a2a', p: '#4a3a2a', b: '#2a1a10' }, hair: 'short', mods: ['child'] },
  highlander:{ pal: { h: '#6a3a1e', s: SK2, c: '#4a6a3a', d: '#2e4a24', t: '#8a2a2a', p: '#3a4a2a', b: '#2a1a10' }, hair: 'long', outfit: 'tunic', mods: ['beard'] },
  hesk:     { pal: { h: '#c8c4bc', s: SK3, c: '#3a4a2a', d: '#24301a', t: '#8a6a3a', p: '#24301a', b: '#1a1410' }, hair: 'long', outfit: 'cloak', mods: ['girl', 'hood'] },
  fenfolk:  { pal: { h: '#3a2a1a', s: SK4, c: '#5a5a3a', d: '#3a3a24', p: '#3a3a24', b: '#2a2014' }, hair: 'short', outfit: 'tunic' },
  ferryman: { pal: { h: '#16121c', s: SK5, c: '#2a2a36', d: '#1a1a24', p: '#1a1a24', b: '#0e0e14' }, outfit: 'cloak', mods: ['hood', 'beard'] },
  captain:  { pal: { h: '#3a2a1a', s: SK3, c: '#c8ccd8', d: '#8a90a6', t: '#2e4fa8', p: '#454b5a', b: '#2a2a33' }, hair: 'short', outfit: 'plate', mods: ['beard'] },
  pim:      { pal: { h: '#e8c060', s: SK2, c: '#8a3a6a', d: '#5a2448', t: '#e0b84a', p: '#3a2a3a', b: '#1a1010' }, hair: 'spiky', outfit: 'cloak', mods: ['stout'] },
  ottilie:  { pal: { h: '#16121c', s: SK4, c: '#5a6a8a', d: '#3a4a6a', t: '#e0b84a', p: '#3a3a4a', b: '#1a1a22' }, hair: 'afro', outfit: 'ranger', mods: ['girl'] },
  sverra:   { pal: { h: '#e8e4dc', s: SK2, c: '#8a6a4a', d: '#5a4430', t: '#e8e4dc', p: '#5a4430', b: '#2a1a10' }, hair: 'braids', outfit: 'cloak', mods: ['girl', 'hood'] },
  ilsa:     { pal: { h: '#2a2030', s: ASH, e: '#f2c94c', c: '#5a3a3a', d: '#3a2226', t: '#8a2a2a', p: '#2a1a1e', b: '#120a10', n: '#d8d0c0' }, hair: 'ponytail', outfit: 'chain', mods: ['horns', 'girl'] },
  hollin:   { pal: { h: '#16121c', s: SK3, c: '#3a2a2a', d: '#241a1a', t: '#c8a040', p: '#241a1a', b: '#100a0a' }, hair: 'buzz', outfit: 'rogue', mods: ['beard', 'stout'] },
  pilgrim:  { pal: { h: '#8a8480', s: SK2, c: '#a8987a', d: '#7a6a50', t: '#d8a840', p: '#7a6a50', b: '#3a2a1a' }, outfit: 'robe', mods: ['hood'] },
  patrol:   { pal: { h: '#555a66', s: SK3, c: '#8a93a6', d: '#5b6377', t: '#8a1e2a', p: '#454b5a', b: '#2a2a33' }, outfit: 'chain', mods: ['helm'] }
});

// ---------------------------------------------------------------- new things to find
Object.assign(ITEMS, {
  lens:      { name: 'Starglass Lens', type: 'key', price: 0, desc: 'A great disc of polished glass, wrapped in a sailcloth. The Gullhaven light has been dark without it.' },
  crown:     { name: 'The Hollow Crown', type: 'key', price: 0, desc: 'A crown of black iron, cold as a well. When you hold it you can hear, very faintly, people kneeling.' },
  accord:    { name: 'The True Accord', type: 'key', price: 0, desc: 'The original Accord of Dawn, sealed in wax three hundred years old. The Ashborn signatures are still on it. So is a clause nobody alive has read.' },
  letters:   { name: 'The Ashcombe Letters', type: 'key', price: 0, desc: 'Letters under the Ashcombe seal, paying Redcrag\'s bandits to raid Ashborn camps — and to raid human villages dressed as Ashborn.' },
  bogbloom:  { name: 'Bogbloom', type: 'key', price: 0, desc: 'A fat white flower that only grows where the fen is deepest. Granny Hesk wants these.' },
  shard:     { name: 'Memory Shard', type: 'key', price: 0, desc: 'A sliver of something like glass. When you hold one up to the light you see a street in Tokyo.' },
  tmap:      { name: 'Treasure Map', type: 'key', price: 0, desc: 'A scrap of map with an X on it. Read it from the Key Items in your bag.' },
  firewood:  { name: 'Dry Firewood', type: 'key', price: 0, desc: 'A bundle of split pine. Old Sverra on the pass is always short of it.' },
  torvald:   { name: 'Torvald\'s Hammer', type: 'weapon', kind: 'axe', atk: 31, price: 0, desc: 'Garrick\'s brother\'s hammer, found on his cairn beyond the Rift. The rune on the head reads HOME.' },
  seawall:   { name: 'Seawall', type: 'weapon', kind: 'sword', atk: 27, mag: 2, price: 0, desc: 'A sailor\'s broadsword. Ines carried it twenty years. Now Wren does.' },
  bough:     { name: 'Silvane Bough', type: 'weapon', kind: 'staff', atk: 6, mag: 30, price: 0, desc: 'A living branch of the First Tree. It flowers when Lyra casts.' },
  gutterfang:{ name: 'Gutterfang', type: 'weapon', kind: 'dagger', atk: 28, price: 0, desc: 'Sable\'s old knife, won back from Hollin. She says it is not sentimental. She has named it.' },
  lantern:   { name: 'Dawn Lantern', type: 'weapon', kind: 'mace', atk: 18, mag: 22, price: 0, desc: 'A mace with a lamp in its head. Granny Hesk lit it with fen-fire and Oswin blessed it. It has opinions now.' },
  whitefang: { name: 'Whitefang', type: 'weapon', kind: 'bow', atk: 33, price: 0, desc: 'Strung with Rimefang\'s sinew. Kestrel says her father would have liked it. She says it twice.' },
  kinblade:  { name: 'Kinblade', type: 'weapon', kind: 'greatsword', atk: 36, mag: 6, price: 0, desc: 'Ilsa\'s sword, given to her brother. Ashborn steel, with a new name on it in the old script.' },
  tideblade: { name: 'Tidecutter', type: 'weapon', kind: 'sword', atk: 20, price: 820, desc: 'Gullhaven steel, salt-blued.' },
  coralstaff:{ name: 'Coral Rod', type: 'weapon', kind: 'staff', atk: 3, mag: 13, price: 780, desc: 'A rod of red coral that hums with the tide.' },
  moorcloak: { name: 'Highland Plaid', type: 'armor', kind: 'light', def: 10, price: 640, desc: 'Cairnstead wool. Warm, waterproof, and very, very green.', look: { style: 'cloak', c: '#3a6a3a', d: '#2a4a2a', t: '#8a2a2a', p: '#3a4a2a', b: '#2a1a10' } },
  fenrobe:   { name: 'Fen-Witch Shawl', type: 'armor', kind: 'robe', def: 11, mag: 8, price: 900, desc: 'Woven by Granny Hesk. Smells faintly of peat and good luck.', look: { style: 'robe', c: '#3a4a2a', d: '#24301a', t: '#c8b060', p: '#24301a', b: '#1a1410' } },
  frostmail: { name: 'Frostforged Mail', type: 'armor', kind: 'heavy', def: 22, price: 2200, desc: 'Dwarf steel quenched in glacier water. It never quite warms up.', look: { style: 'chain', c: '#c8d8e8', d: '#8a9ab0', t: '#4a8ad8', p: '#6a7a8a', b: '#2a2a33' } },
  hollowgarb:{ name: 'Hollow Regalia', type: 'armor', kind: 'heavy', def: 18, mag: 10, price: 0, desc: 'Black and silver, taken from the barrow. It fits as if it had been waiting for you.', look: { style: 'plate', c: '#2a2a36', d: '#16161e', t: '#c8c8d8', p: '#16161e', b: '#0a0a10', n: '#c8c8d8' } },
  seaglass:  { name: 'Mariner\'s Coat', type: 'armor', kind: 'light', def: 12, price: 980, desc: 'A long blue coat with brass buttons. Every sailor in Gullhaven salutes it.', look: { style: 'noble', c: '#24407a', d: '#1a2a5a', t: '#e0b84a', p: '#1a2a5a', b: '#1a1418', n: '#e0b84a' } }
});
for (const k in ITEMS) ITEMS[k].id = k;
Object.assign(SHOPS, {
  gullhaven: ['potion', 'hipotion', 'antidote', 'ether', 'phoenix', 'bomb', 'tideblade', 'coralstaff', 'dagger2', 'bow2', 'seaglass', 'leather'],
  cairnstead:['potion', 'hipotion', 'antidote', 'ether', 'phoenix', 'tonic', 'axe2', 'mace2', 'moorcloak', 'chain', 'ssword', 'rstaff'],
  mirewatch: ['hipotion', 'mega', 'antidote', 'hiether', 'phoenix', 'bomb', 'tonic', 'fenrobe', 'dagger3', 'bow3', 'msword', 'astaff'],
  pim:       ['elixir', 'hiether', 'tonic', 'phoenix', 'frostmail', 'gsword2', 'mace3', 'star']
});

// ---------------------------------------------------------------- battle backdrops for the new country
Object.assign(BG, {
  coast: ['#7ab8e0', '#d8ecf4', '#e6d29a', '#c8b07a'],
  moor:  ['#8a98b8', '#d8d0d8', '#6a7a4a', '#4a5a34'],
  snow:  ['#a8c0e0', '#e8f0fa', '#e8eef6', '#c8d4e8'],
  fen:   ['#4a5a4a', '#8a9a7a', '#5e5638', '#3a3424'],
  ruins: ['#5a6a8a', '#a8b8c8', '#6a7a8a', '#3a4a5a'],
  ice:   ['#1a2a3a', '#4a7a9a', '#a8d0e8', '#6a9ab8'],
  grove: ['#2a4a3a', '#8ab8a0', '#3a6a3a', '#1e4224']
});
{
  const P = BattleScene.prototype, db0 = P.drawBackground, df0 = P.drawForeground;
  P.drawBackground = function () {
    const k = this.bg;
    if (!['coast', 'moor', 'snow', 'fen', 'ruins', 'ice', 'grove'].includes(k)) return db0.call(this);
    const [sky1, sky2, g1, g2] = BG[k], HOR = 230, r = mulberry(k.length * 53);
    const g = ctx.createLinearGradient(0, 0, 0, HOR); g.addColorStop(0, sky1); g.addColorStop(1, sky2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR);
    const layer = (col, base, amp, freq, seed) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, HOR); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base - Math.abs(Math.sin(x / freq + seed)) * amp - Math.sin(x / (freq * 0.37) + seed) * amp * 0.25); ctx.lineTo(W, HOR); ctx.fill(); };
    const t = this.bgT || 0;
    if (k === 'coast') {
      glow(W * 0.75, 70, 120, 'rgba(255,245,210,.5)'); ctx.fillStyle = 'rgba(255,255,230,.7)'; ctx.beginPath(); ctx.arc(W * 0.75, 70, 28, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a7aa8'; ctx.fillRect(0, 180, W, 50); for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect((r() * W + t * 10) % W, 184 + r() * 44, 10 + r() * 20, 1); }
      layer('#8a8478', 190, 30, 70, 2); ctx.fillStyle = '#f0ece0'; ctx.fillRect(60, 120, 18, 70); ctx.fillStyle = '#c83a3a'; ctx.fillRect(60, 140, 18, 10); ctx.fillRect(60, 165, 18, 8); glow(69, 116, 30, 'rgba(255,240,160,.6)');
    } else if (k === 'moor') {
      for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse((r() * W + t * 6) % (W + 200) - 100, 30 + r() * 80, 90, 14, 0, 0, 7); ctx.fill(); }
      layer('#6a7a8a', 175, 45, 110, 1); layer('#5a6a44', 205, 30, 70, 3);
      for (let i = 0; i < 6; i++) { const x = 60 + i * 90 + r() * 30; ctx.fillStyle = '#7a7a84'; ctx.fillRect(x, 170 - r() * 20, 12, 40); ctx.fillStyle = '#9a9aa4'; ctx.fillRect(x, 170 - 10, 4, 30); }
    } else if (k === 'snow') {
      layer('#c8d8ec', 150, 70, 120, 1); layer('#e8f0fa', 140, 50, 90, 2); layer('#a8b8d0', 200, 40, 60, 4);
      for (let i = 0; i < 16; i++) { const x = r() * W, h = 50 + r() * 50; ctx.fillStyle = '#2a4a3a'; ctx.beginPath(); ctx.moveTo(x - 18, HOR); ctx.lineTo(x, HOR - h); ctx.lineTo(x + 18, HOR); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 6, HOR - h * 0.6); ctx.lineTo(x, HOR - h); ctx.lineTo(x + 6, HOR - h * 0.6); ctx.fill(); }
    } else if (k === 'fen') {
      ctx.fillStyle = 'rgba(200,220,190,.25)'; ctx.fillRect(0, 140, W, 90);
      for (let i = 0; i < 12; i++) { const x = r() * W; ctx.strokeStyle = '#2a2a1e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, HOR); ctx.lineTo(x + 4, HOR - 90 - r() * 50); ctx.lineTo(x + 20, HOR - 120 - r() * 30); ctx.stroke(); ctx.lineWidth = 1; }
      for (let i = 0; i < 10; i++) glow(r() * W, 120 + r() * 100, 10, 'rgba(220,255,150,.5)');
    } else if (k === 'ruins' || k === 'ice') {
      for (let i = 0; i < Math.ceil(W / 110); i++) { const x = 20 + i * 110; ctx.fillStyle = k === 'ice' ? '#3a6a8a' : '#4a5a6a'; ctx.fillRect(x, 40, 34, 190); ctx.fillStyle = k === 'ice' ? '#6aa0c0' : '#6a7a8a'; ctx.fillRect(x + 4, 40, 6, 190); }
      if (k === 'ice') for (let i = 0; i < 20; i++) { const x = r() * W; ctx.fillStyle = 'rgba(200,240,255,.5)'; ctx.beginPath(); ctx.moveTo(x - 8, 0); ctx.lineTo(x, 30 + r() * 50); ctx.lineTo(x + 8, 0); ctx.fill(); }
      else for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(160,220,255,.15)'; ctx.fillRect(r() * W, 0, 2, 230); }
    } else if (k === 'grove') {
      for (let i = 0; i < 18; i++) { const x = r() * W, h = 120 + r() * 80; ctx.fillStyle = i % 2 ? '#1e4a2a' : '#2a5a34'; ctx.fillRect(x - 8, HOR - h, 16, h); ctx.beginPath(); ctx.arc(x, HOR - h, 34, 0, 7); ctx.fill(); }
      for (let i = 0; i < 14; i++) glow(r() * W, 40 + r() * 160, 12, 'rgba(200,255,220,.45)');
    }
    const gg = ctx.createLinearGradient(0, HOR, 0, H); gg.addColorStop(0, g1); gg.addColorStop(1, g2); ctx.fillStyle = gg; ctx.fillRect(0, HOR, W, H - HOR);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 40; i++) ctx.fillRect(r() * W, HOR + 6 + r() * 150, 6 + r() * 24, 2);
  };
}

// ================================================================= NEW TOWNS
// ---------------------------------------------------------------- GULLHAVEN, the port
function buildGullhaven() {
  const b = MB(46, 34, '.', 501);
  b.scatter(',', 0.05, ['.']).scatter('f', 0.02, ['.']);
  b.border('T');
  // the sea to the south and west, a beach in front of it
  b.rect(0, 26, 46, 8, '~'); b.rect(0, 0, 2, 34, '~');
  for (let x = 0; x < 46; x++) { const y = 24 + (hash2(x, 3) % 2); b.rect(x, y, 1, 26 - y, 'ä'); }
  b.rect(2, 0, 2, 26, 'ä');
  b.rect(2, 1, 1, 24, 'ä');
  // the exit north
  b.rect(21, 0, 3, 2, '.');
  // the high street and the harbour front
  b.path([[22, 0], [22, 23]], '=').path([[23, 0], [23, 23]], '=');
  b.path([[5, 12], [42, 12]], '=');
  b.rect(6, 21, 34, 3, ':');
  // buildings
  house(b, 6, 5, 9, 10);              // the Salt & Sixpence (inn)
  house(b, 26, 5, 8, 29);             // Tidewright's Chandlery (shop)
  house(b, 6, 14, 8, 9);              // the harbourmaster's house
  house(b, 26, 14, 6, 28, 'D');
  house(b, 35, 5, 7, 38, 'E');        // Quint the barber
  house(b, 35, 14, 7, 38, 'E');       // the keeper's cottage
  house(b, 15, 14, 5, 17, 'D');
  frontClear(b, [[10, 8], [29, 8], [9, 17], [28, 17], [38, 8], [38, 17], [17, 17], [10, 9], [29, 9], [38, 9], [9, 18], [38, 18]], '.');
  // the fish market
  for (let x = 9; x < 38; x += 4) if (x !== 21 && x !== 22 && x !== 23) b.set(x, 22, '*');
  // piers, boats and the light on the point
  b.rect(12, 24, 2, 9, 'B'); b.rect(31, 24, 2, 9, 'B');
  b.set(11, 29, 'ß').set(14, 31, 'ß').set(30, 28, 'ß').set(33, 31, 'ß').set(19, 30, 'ß');
  b.rect(2, 20, 4, 5, 'ä');
  b.rect(2, 18, 4, 2, 'R'); b.rect(2, 20, 4, 3, '+'); b.set(3, 22, ']'); b.set(3, 23, 'ä');
  b.set(2, 21, '['); b.set(5, 21, '[');
  // the cliffs and the wreckers' cave in the east
  b.rect(40, 18, 6, 10, 'r'); b.set(43, 22, '»'); b.rect(42, 23, 3, 3, 'ä'); b.rect(39, 23, 4, 1, 'ä');
  // props
  b.set(20, 3, 'S').set(25, 3, '°').set(24, 11, '|').set(21, 11, '|').set(15, 9, '(').set(16, 9, '(').set(33, 9, '/').set(19, 20, 'k');
  for (const [x, y] of [[5, 10], [18, 10], [34, 10], [43, 10], [5, 19], [43, 13]]) if (b.get(x, y) === '.' || b.get(x, y) === ',') b.set(x, y, '!');
  for (let x = 7; x < 15; x++) if (b.get(x, 4) === '.') b.set(x, 4, '"');
  b.set(39, 22, 'S').set(8, 23, '(').set(36, 23, '(').set(37, 23, 'k');
  return b.rows();
}
const LIGHT_ROWS = (() => {
  const b = MB(12, 10, 'o', 11); b.border('V');
  for (const x of [2, 5, 9]) b.set(x, 0, 'y');
  b.set(5, 2, 'û').set(6, 2, 'û').set(1, 1, '{').set(10, 1, 'ô').set(1, 7, 'k').set(10, 7, 'ò').set(8, 4, 't').set(9, 4, 'u').set(10, 4, 'b').set(10, 5, 'b');
  b.set(3, 1, 'ë').set(3, 2, 'ë');
  b.rect(4, 5, 4, 3, 'â');
  b.set(5, 9, 'x').set(6, 9, 'x');
  return b.rows();
})();

// ---------------------------------------------------------------- CAIRNSTEAD, on the moor
function buildCairnstead() {
  const b = MB(40, 30, 'å', 502);
  b.scatter('.', 0.35, ['å']).scatter(',', 0.04, ['.', 'å']);
  b.border('r');
  for (let y = 1; y < 29; y++) { if (b.rnd() < 0.5) b.set(1, y, 'T'); if (b.rnd() < 0.5) b.set(38, y, 'T'); }
  b.rect(18, 28, 4, 2, '.');
  b.path([[19, 29], [19, 18]], '=').path([[20, 29], [20, 18]], '=');
  b.path([[6, 9], [33, 9]], '=');
  b.path([[19, 9], [19, 18]], '=');
  // the stone circle
  for (let a = 0; a < 10; a++) { const x = Math.round(20 + Math.cos(a / 10 * 6.283) * 5), y = Math.round(14 + Math.sin(a / 10 * 6.283) * 3.4); if (a % 5 !== 2) b.set(x, y, 'r'); }
  b.rect(18, 13, 4, 3, '.'); b.set(20, 14, '¢');
  // the chieftain's longhouse
  b.rect(3, 2, 14, 2, 'R'); b.rect(3, 4, 14, 2, '+'); b.set(9, 5, ']'); b.set(10, 5, ']'); b.set(4, 4, '[').set(15, 4, '[');
  // the inn, the shop, the seer's hut, homes
  house(b, 25, 3, 9, 29);            // the Thistle Hearth
  house(b, 25, 19, 7, 28);           // Gorse & Iron
  house(b, 32, 11, 5, 34);           // Morwen's hut
  house(b, 4, 20, 6, 6, 'D'); house(b, 11, 23, 5, 13, 'D'); house(b, 26, 24, 6, 28, 'D');
  frontClear(b, [[9, 6], [10, 6], [29, 6], [28, 22], [34, 14], [6, 23], [13, 26], [28, 27], [29, 7], [34, 15]], '.');
  b.path([[34, 15], [34, 16], [21, 16]], '=');
  b.path([[28, 22], [28, 18], [21, 18]], '=');
  // sheep pens
  b.rect(4, 11, 10, 1, 'F').rect(4, 17, 10, 1, 'F').rect(4, 11, 1, 7, 'F').rect(13, 11, 1, 7, 'F');
  b.rect(5, 12, 8, 5, '.'); b.set(13, 14, '.');
  // props
  b.set(22, 27, '°').set(17, 27, 'S').set(23, 9, 'O').set(16, 8, '(').set(31, 8, 'k').set(24, 17, '/');
  for (const [x, y] of [[18, 7], [21, 7], [32, 17], [8, 8]]) if (!SOLID.has(b.get(x, y))) b.set(x, y, '!');
  return b.rows();
}
const LONGHOUSE_ROWS = (() => {
  const b = MB(24, 13, 'o', 13); b.border('V');
  for (const x of [3, 8, 15, 20]) b.set(x, 0, 'y');
  b.set(11, 0, 'è').set(12, 0, 'è');
  b.rect(10, 3, 4, 4, 'z');
  b.set(11, 1, 'H').set(12, 1, 'H');
  b.rect(3, 3, 1, 6, 'ú').rect(2, 3, 1, 6, 'u').rect(4, 3, 1, 6, 'u');
  b.rect(20, 3, 1, 6, 'ú').rect(19, 3, 1, 6, 'u').rect(21, 3, 1, 6, 'u');
  b.set(1, 1, 'ì').set(22, 1, 'ì').set(1, 11, 'k').set(22, 11, 'k').set(6, 11, 'ò').set(17, 11, 'ù').set(6, 1, 'í').set(17, 1, 'í');
  b.rect(10, 8, 4, 4, 'à');
  b.set(11, 12, 'x').set(12, 12, 'x');
  return b.rows();
})();

// ---------------------------------------------------------------- MIREWATCH, on stilts in the fen
function buildMirewatch() {
  const b = MB(40, 32, 'ü', 503);
  b.border('T');
  for (const [cx, cy, rx, ry] of [[14, 13, 4, 3], [28, 12, 5, 3], [20, 24, 7, 3], [33, 25, 4, 3], [6, 26, 3, 2], [35, 4, 3, 2]]) b.blob(cx, cy, rx, ry, 'µ', ['ü']);
  b.scatter('ø', 0.07, ['ü']).scatter('X', 0.02, ['ü']);
  // boardwalks
  b.path([[0, 16], [38, 16]], 'B').path([[0, 15], [6, 15]], 'B');
  b.path([[11, 16], [11, 8]], 'B').path([[25, 16], [25, 8]], 'B').path([[31, 16], [31, 22]], 'B').path([[19, 16], [19, 27]], 'B');
  b.path([[11, 8], [25, 8]], 'B');
  // huts on dry ground
  b.rect(7, 3, 9, 4, '.'); house(b, 7, 3, 8, 11);          // the Leaning Heron
  b.rect(21, 3, 8, 4, '.'); house(b, 21, 3, 7, 25);         // Odds & Bogs
  b.rect(28, 19, 7, 4, '.'); house(b, 29, 19, 5, 31);       // Granny Hesk
  b.rect(2, 18, 6, 4, '.'); house(b, 2, 18, 5, 4, 'D');
  b.rect(14, 19, 4, 4, '.'); house(b, 14, 19, 4, 15, 'D');
  b.rect(33, 7, 6, 4, '.'); house(b, 33, 7, 5, 35, 'D');
  frontClear(b, [[11, 6], [11, 7], [25, 6], [25, 7], [31, 22], [31, 23]], 'B');
  b.set(4, 21, 'B').set(4, 22, 'B').set(4, 23, 'B').set(4, 17, 'B').set(15, 22, 'B').set(15, 17, 'B').set(15, 18, 'B').set(35, 10, 'B').set(35, 11, 'B').set(35, 12, 'B').set(35, 13, 'B').set(35, 14, 'B').set(35, 15, 'B');
  b.rect(2, 13, 4, 2, '.'); b.set(3, 13, '°'); b.set(2, 14, 'S');
  b.set(20, 15, 'O').set(18, 14, '(').set(27, 14, 'k').set(9, 17, '!').set(29, 17, '!').set(22, 17, '!');
  return b.rows();
}

// ================================================================= NEW PLACES
// a cave or dungeon carved along a route, with side chambers
function carve(b, route, floor, width, rooms) {
  b.path(route, floor, width);
  for (const [cx, cy, rx, ry] of rooms || []) b.blob(cx, cy, rx, ry, floor);
  b.path(route, floor, 1);
  return b;
}
function buildGrotto() {
  const b = MB(40, 28, 'r', 601);
  carve(b, [[2, 25], [8, 25], [8, 18], [18, 18], [18, 10], [28, 10], [28, 5], [35, 5]], 'c', 3, [[8, 12, 3, 3], [24, 21, 5, 3], [34, 18, 3, 3], [34, 5, 4, 3], [14, 4, 4, 2]]);
  b.path([[18, 14], [24, 14], [24, 20]], 'c', 2).path([[28, 10], [34, 10], [34, 16]], 'c', 2).path([[18, 10], [14, 10], [14, 5]], 'c', 2).path([[8, 18], [8, 14]], 'c', 2);
  b.blob(22, 22, 3, 1, '~', ['c']); b.blob(12, 18, 2, 1, '~', ['c']);
  b.path([[2, 25], [8, 25], [8, 18], [18, 18], [18, 10], [28, 10], [28, 5], [35, 5]], 'c', 1);
  b.rect(0, 24, 2, 3, 'c');
  b.set(32, 3, 'N').set(36, 3, 'N').set(33, 7, 'O').set(26, 20, 'O').set(10, 11, '(').set(15, 3, '(').set(16, 3, 'k').set(35, 19, '(');
  return b.rows();
}
function buildBarrow() {
  const b = MB(36, 30, '#', 602);
  const room = (x, y, w, h) => b.rect(x, y, w, h, 'p');
  room(15, 23, 6, 6); room(16, 14, 4, 9); room(6, 16, 8, 6); room(22, 16, 8, 6); room(4, 6, 8, 7); room(24, 6, 8, 7); room(13, 2, 10, 9);
  b.rect(14, 18, 2, 2, 'p').rect(20, 18, 2, 2, 'p').rect(8, 13, 2, 3, 'p').rect(26, 13, 2, 3, 'p').rect(12, 8, 1, 2, 'p').rect(23, 8, 1, 2, 'p');
  b.rect(17, 11, 2, 3, 'p');
  for (const [x, y] of [[7, 17], [9, 17], [11, 17], [7, 20], [11, 20], [23, 17], [25, 17], [27, 17], [23, 20], [27, 20], [5, 7], [10, 7], [25, 7], [30, 7]]) b.set(x, y, '?');
  for (const [x, y] of [[14, 4], [21, 4], [14, 8], [21, 8]]) b.set(x, y, 'P');
  b.set(17, 2, 'H').set(18, 2, 'H').rect(17, 3, 2, 8, 'K');
  b.set(15, 3, 'L').set(20, 3, 'L');
  b.rect(17, 28, 2, 2, 'p');
  return b.rows();
}
function buildSilvane() {
  const b = MB(44, 34, '.', 603);
  b.scatter('T', 0.28).scatter('q', 0.04, ['.']).scatter(',', 0.08, ['.']).scatter('f', 0.03, ['.']);
  b.border('T');
  b.blob(22, 17, 9, 6, '.', ['T', 'q', ',', 'f', '.']);
  b.blob(22, 17, 3, 2, '~');
  b.path([[22, 33], [22, 24]], '.', 3).path([[22, 10], [22, 3]], '.', 3).path([[13, 17], [5, 17], [5, 8]], '.', 3).path([[31, 17], [38, 17], [38, 26]], '.', 3);
  b.blob(22, 4, 6, 3, '.'); b.blob(5, 7, 3, 3, '.'); b.blob(38, 27, 4, 3, '.');
  b.path([[22, 33], [22, 24]], ';').path([[22, 10], [22, 4]], ';').path([[13, 17], [5, 17], [5, 8]], ';').path([[31, 17], [38, 17], [38, 26]], ';');
  for (const [x, y] of [[16, 13], [28, 13], [16, 21], [28, 21], [19, 11], [25, 11], [18, 4], [26, 4], [3, 5], [7, 5], [36, 25], [40, 25]]) b.set(x, y, '¤');
  // the blight in the north
  for (let y = 1; y < 8; y++) for (let x = 14; x < 31; x++) if (b.get(x, y) === 'T' && hash2(x, y) % 3 === 0) b.set(x, y, 'X');
  b.set(22, 33, '.').set(21, 33, '.').set(23, 33, '.');
  return b.rows();
}
function buildShrine() {
  const b = MB(36, 28, '#', 604);
  b.rect(15, 21, 6, 7, 'ÿ'); b.rect(16, 12, 4, 9, 'ÿ'); b.rect(5, 13, 9, 6, 'ÿ'); b.rect(22, 13, 9, 6, 'ÿ'); b.rect(10, 2, 16, 9, 'ÿ');
  b.rect(14, 15, 2, 2, 'ÿ').rect(20, 15, 2, 2, 'ÿ').rect(17, 11, 2, 1, 'ÿ');
  b.blob(9, 16, 2, 1, '~', ['ÿ']); b.blob(26, 16, 2, 1, '~', ['ÿ']); b.blob(14, 6, 2, 2, '~', ['ÿ']); b.blob(22, 6, 2, 2, '~', ['ÿ']);
  for (const [x, y] of [[11, 3], [24, 3], [11, 9], [24, 9], [6, 13], [12, 18], [23, 13], [29, 18]]) b.set(x, y, 'P');
  b.set(17, 2, 'L').set(18, 2, 'L');
  b.rect(17, 26, 2, 2, 'ÿ');
  return b.rows();
}
function buildAurel() {
  const b = MB(40, 32, '#', 605);
  b.rect(17, 24, 6, 8, 'p'); b.rect(8, 18, 24, 6, 'p'); b.rect(2, 10, 9, 8, 'p'); b.rect(29, 10, 9, 8, 'p'); b.rect(16, 11, 8, 7, 'p'); b.rect(12, 2, 16, 7, 'p');
  b.rect(11, 13, 5, 2, 'p').rect(24, 13, 5, 2, 'p').rect(19, 9, 2, 2, 'p');
  for (let x = 9; x < 31; x += 3) { b.set(x, 18, 'b'); }
  for (const [x, y] of [[3, 11], [5, 11], [7, 11], [3, 16], [30, 11], [32, 11], [34, 11], [36, 16]]) b.set(x, y, 'b');
  for (const [x, y] of [[17, 12], [22, 12], [17, 16], [22, 16], [14, 3], [25, 3], [14, 7], [25, 7]]) b.set(x, y, 'P');
  b.set(2, 14, '÷').set(37, 14, '÷').set(19, 22, '÷');
  b.blob(10, 21, 1, 1, '~', ['p']); b.blob(29, 21, 1, 1, '~', ['p']);
  b.set(19, 2, 'H').set(20, 2, 'H').rect(19, 3, 2, 6, 'K');
  b.set(13, 2, 'L').set(26, 2, 'L');
  return b.rows();
}
function buildRimeheart() {
  const b = MB(36, 28, '¡', 606);
  carve(b, [[18, 27], [18, 21], [8, 21], [8, 12], [18, 12], [18, 5], [28, 5]], '¿', 3, [[8, 25, 3, 2], [27, 17, 4, 3], [28, 5, 5, 3], [10, 5, 3, 2]]);
  b.path([[18, 12], [18, 17]], '¿', 2).path([[18, 16], [27, 16]], '¿', 2).path([[8, 12], [8, 6], [10, 6]], '¿', 2).path([[8, 21], [8, 25]], '¿', 2);
  b.path([[18, 27], [18, 21], [8, 21], [8, 12], [18, 12], [18, 5], [28, 5]], '¿', 1);
  b.rect(17, 26, 3, 2, '¿');
  return b.rows();
}
function buildRedcrag() {
  const b = MB(40, 30, '.', 607);
  b.scatter('r', 0.06).scatter(';', 0.12, ['.']).scatter('T', 0.03, ['.']);
  b.border('r');
  b.rect(8, 4, 24, 20, ';');
  b.rect(8, 4, 24, 1, 'F').rect(8, 23, 24, 1, 'F').rect(8, 4, 1, 20, 'F').rect(31, 4, 1, 20, 'F');
  b.rect(19, 23, 2, 1, ';');
  b.rect(19, 24, 2, 6, ';');
  b.set(8, 4, '!').set(31, 4, '!').set(8, 23, '!').set(31, 23, '!');
  house(b, 14, 5, 12, 20, 'D');
  for (const [x, y] of [[11, 10], [11, 14], [11, 18], [28, 10], [28, 14], [28, 18]]) b.set(x, y, 'N');
  b.set(20, 13, 'O').set(15, 19, 'O').set(25, 19, 'O');
  b.set(10, 8, '(').set(29, 8, '(').set(10, 21, 'k').set(29, 21, '/');
  b.path([[20, 29], [20, 23]], ';');
  return b.rows();
}

// ---------------------------------------------------------------- the map table
const TAV = (keeper, spr) => [{ id: keeper, x: 3, y: 1, spr, dir: 'down', script: 'inn' }];
Object.assign(MAPS, {
  // ---- Gullhaven
  gullhaven: {
    name: 'Gullhaven', music: 'coast', theme: 'grass', edge: '~', ambient: 'rgba(255,230,190,.05)', encounters: null, noDensify: true, region: 'coast',
    rows: buildGullhaven(), npcs: [], chests: [{ id: 'gh1', x: 44, y: 25, item: 'hipotion', qty: 2 }],
    warps: [
      { x: 21, y: 0, w: 3, h: 1, to: '@ow' },
      { x: 10, y: 7, w: 1, h: 1, to: 'gull_inn', tx: 12, ty: 14, dir: 'up' },
      { x: 29, y: 7, w: 1, h: 1, to: 'gull_shop', tx: 9, ty: 11, dir: 'up' },
      { x: 9, y: 16, w: 1, h: 1, to: 'gull_harbour', tx: 7, ty: 9, dir: 'up' },
      { x: 38, y: 7, w: 1, h: 1, to: 'gull_barber', tx: 7, ty: 9, dir: 'up' },
      { x: 38, y: 16, w: 1, h: 1, to: 'gull_keeper', tx: 7, ty: 9, dir: 'up' },
      { x: 3, y: 22, w: 1, h: 1, to: 'gull_light', tx: 5, ty: 8, dir: 'up' },
      { x: 43, y: 22, w: 1, h: 1, to: 'grotto', tx: 2, ty: 25, dir: 'right' }
    ],
    signs: { '20,3': 'GULLHAVEN. Fresh fish, honest weights, and the brightest light on the western sea. (The light is currently out.)', '39,22': 'DANGER. Sea caves. The tide comes in faster than you can run.' }
  },
  gull_inn: { name: 'The Salt & Sixpence', music: 'coast', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,170,90,.10)', rows: TAVERN_BIG, pois: TAVERN_POIS_BIG, encounters: null,
    npcs: TAV('gullKeep', 'fishwife'), warps: [{ x: 12, y: 15, w: 2, h: 1, to: 'gullhaven', tx: 10, ty: 8, dir: 'down' }], chests: [], signs: {} },
  gull_shop: { name: 'Tidewright\'s Chandlery', music: 'coast', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,110,.08)', rows: SHOP_BIG, pois: SHOP_POIS_BIG, encounters: null,
    npcs: [{ id: 'tidewright', x: 2, y: 2, spr: 'sailor', dir: 'down', script: 'shopGull' }], warps: [{ x: 9, y: 12, w: 2, h: 1, to: 'gullhaven', tx: 29, ty: 8, dir: 'down' }], chests: [], signs: {} },
  gull_harbour: { name: 'The Harbourmaster\'s House', music: 'coast', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,180,100,.10)', rows: HOME_BIG, pois: HOME_POIS_BIG, encounters: null,
    npcs: [], warps: [{ x: 7, y: 10, w: 2, h: 1, to: 'gullhaven', tx: 9, ty: 17, dir: 'down' }], chests: [], signs: {} },
  gull_barber: { name: 'Quint\'s', music: 'coast', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,140,.10)', rows: HOME_BIG, pois: HOME_POIS_BIG, encounters: null,
    npcs: [{ id: 'quint', x: 3, y: 4, spr: 'barber', dir: 'down', script: 'barber' }], warps: [{ x: 7, y: 10, w: 2, h: 1, to: 'gullhaven', tx: 38, ty: 8, dir: 'down' }], chests: [], signs: {} },
  gull_keeper: { name: 'The Keeper\'s Cottage', music: 'coast', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,180,100,.10)', rows: HOME_BIG, pois: HOME_POIS_BIG, encounters: null,
    npcs: [], warps: [{ x: 7, y: 10, w: 2, h: 1, to: 'gullhaven', tx: 38, ty: 17, dir: 'down' }], chests: [], signs: {} },
  gull_light: { name: 'Gullhaven Light', music: 'coast', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(200,220,255,.10)', rows: LIGHT_ROWS, encounters: null,
    pois: [{ x: 5, y: 3, dir: 'up', act: 'fire' }, { x: 8, y: 5, dir: 'up', act: 'book' }],
    npcs: [], warps: [{ x: 5, y: 9, w: 2, h: 1, to: 'gullhaven', tx: 3, ty: 23, dir: 'down' }], chests: [], signs: {} },
  grotto: {
    name: 'The Wreckers\' Grotto', music: 'mine', theme: 'cave', edge: 'r', lvl: 9, dark: true, fx: 'dust', region: 'coast',
    rows: buildGrotto(), encounters: [['wrecker', 3], ['tideslime', 3], ['crab', 2], ['cavebat', 1]], bg: 'cave',
    npcs: [], warps: [{ x: 0, y: 24, w: 1, h: 3, to: 'gullhaven', tx: 42, ty: 23, dir: 'left' }],
    chests: [{ id: 'gr1', x: 8, y: 11, item: 'hipotion', qty: 2 }, { id: 'gr2', x: 34, y: 19, gold: 260 }, { id: 'gr3', x: 13, y: 4, item: 'tideblade', qty: 1 }, { id: 'gr4', x: 37, y: 7, item: 'phoenix', qty: 1 }, { id: 'gr5', x: 26, y: 22, item: 'shard', qty: 1 }],
    signs: {}, safe: [[0, 22, 6, 6]]
  },
  // ---- Cairnstead
  cairnstead: {
    name: 'Cairnstead', music: 'moor', theme: 'grass', edge: 'r', fx: 'leaves', ambient: 'rgba(200,200,230,.06)', encounters: null, noDensify: true, region: 'moor',
    rows: buildCairnstead(), npcs: [], chests: [{ id: 'cs1', x: 36, y: 3, item: 'tonic', qty: 1 }],
    warps: [
      { x: 18, y: 29, w: 4, h: 1, to: '@ow' },
      { x: 9, y: 5, w: 2, h: 1, to: 'cairn_long', tx: 11, ty: 11, dir: 'up' },
      { x: 29, y: 5, w: 1, h: 1, to: 'cairn_inn', tx: 12, ty: 14, dir: 'up' },
      { x: 28, y: 21, w: 1, h: 1, to: 'cairn_shop', tx: 9, ty: 11, dir: 'up' },
      { x: 34, y: 13, w: 1, h: 1, to: 'cairn_seer', tx: 7, ty: 9, dir: 'up' }
    ],
    signs: { '17,27': 'CAIRNSTEAD. Mind the sheep. Mind the stones. Mind your manners at the longhouse.' }
  },
  cairn_long: { name: 'The Longhouse', music: 'moor', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,160,80,.12)', rows: LONGHOUSE_ROWS, encounters: null,
    pois: [{ x: 9, y: 4, dir: 'right', act: 'fire' }, { x: 14, y: 5, dir: 'left', act: 'fire' }, { x: 5, y: 5, dir: 'left', act: 'sit' }, { x: 18, y: 6, dir: 'right', act: 'sit' }],
    npcs: [], warps: [{ x: 11, y: 12, w: 2, h: 1, to: 'cairnstead', tx: 9, ty: 6, dir: 'down' }], chests: [], signs: {} },
  cairn_inn: { name: 'The Thistle Hearth', music: 'moor', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,170,90,.10)', rows: TAVERN_BIG, pois: TAVERN_POIS_BIG, encounters: null,
    npcs: TAV('cairnKeep', 'inn'), warps: [{ x: 12, y: 15, w: 2, h: 1, to: 'cairnstead', tx: 29, ty: 6, dir: 'down' }], chests: [], signs: {} },
  cairn_shop: { name: 'Gorse & Iron', music: 'moor', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,110,.08)', rows: SHOP_BIG, pois: SHOP_POIS_BIG, encounters: null,
    npcs: [{ id: 'gorse', x: 2, y: 2, spr: 'highlander', dir: 'down', script: 'shopCairn' }], warps: [{ x: 9, y: 12, w: 2, h: 1, to: 'cairnstead', tx: 28, ty: 22, dir: 'down' }], chests: [], signs: {} },
  cairn_seer: { name: 'Morwen\'s Hut', music: 'library', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(180,160,255,.12)', rows: HOME_BIG, pois: HOME_POIS_BIG, encounters: null,
    npcs: [], warps: [{ x: 7, y: 10, w: 2, h: 1, to: 'cairnstead', tx: 34, ty: 14, dir: 'down' }], chests: [], signs: {} },
  barrow: {
    name: 'The Hollow Barrow', music: 'castle', theme: 'castle', edge: '#', lvl: 11, dark: true, fx: 'dust', region: 'moor',
    rows: buildBarrow(), encounters: [['wight', 3], ['barrowbones', 3], ['raven', 1]], bg: 'castle',
    npcs: [], warps: [{ x: 17, y: 29, w: 2, h: 1, to: '@ow' }],
    chests: [{ id: 'br1', x: 5, y: 11, item: 'hiether', qty: 2 }, { id: 'br2', x: 30, y: 11, gold: 340 }, { id: 'br3', x: 13, y: 20, item: 'phoenix', qty: 2 }, { id: 'br4', x: 28, y: 20, item: 'shard', qty: 1 }],
    signs: {}, safe: [[15, 24, 6, 6]]
  },
  // ---- Mirewatch
  mirewatch: {
    name: 'Mirewatch', music: 'fen', theme: 'grass', edge: 'T', fx: 'fireflies', ambient: 'rgba(60,90,60,.14)', encounters: null, noDensify: true, region: 'fen',
    rows: buildMirewatch(), npcs: [], chests: [{ id: 'mw1', x: 38, y: 6, item: 'antidote', qty: 4 }],
    warps: [
      { x: 0, y: 15, w: 1, h: 2, to: '@ow' },
      { x: 11, y: 5, w: 1, h: 1, to: 'mire_inn', tx: 12, ty: 14, dir: 'up' },
      { x: 25, y: 5, w: 1, h: 1, to: 'mire_shop', tx: 9, ty: 11, dir: 'up' },
      { x: 31, y: 21, w: 1, h: 1, to: 'mire_hesk', tx: 7, ty: 9, dir: 'up' }
    ],
    signs: { '2,14': 'MIREWATCH. Stay on the boards. The fen keeps what it takes.' }
  },
  mire_inn: { name: 'The Leaning Heron', music: 'fen', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(200,170,90,.12)', rows: TAVERN_BIG, pois: TAVERN_POIS_BIG, encounters: null,
    npcs: TAV('mireKeep', 'fenfolk'), warps: [{ x: 12, y: 15, w: 2, h: 1, to: 'mirewatch', tx: 11, ty: 6, dir: 'down' }], chests: [], signs: {} },
  mire_shop: { name: 'Odds & Bogs', music: 'fen', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(200,190,110,.08)', rows: SHOP_BIG, pois: SHOP_POIS_BIG, encounters: null,
    npcs: [{ id: 'oddsbogs', x: 2, y: 2, spr: 'fenfolk', dir: 'down', script: 'shopMire' }], warps: [{ x: 9, y: 12, w: 2, h: 1, to: 'mirewatch', tx: 25, ty: 6, dir: 'down' }], chests: [], signs: {} },
  mire_hesk: { name: 'Granny Hesk\'s Hut', music: 'fen', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(120,220,140,.12)', rows: (() => { const r = HOME_BIG.map(s => s.split('')); r[3][3] = 'ó'; r[5][10] = 'ó'; r[1][5] = 'ò'; return r.map(s => s.join('')); })(), pois: HOME_POIS_BIG, encounters: null,
    npcs: [], warps: [{ x: 7, y: 10, w: 2, h: 1, to: 'mirewatch', tx: 31, ty: 22, dir: 'down' }], chests: [], signs: {} },
  shrine: {
    name: 'The Sunken Shrine', music: 'castle', theme: 'castle', edge: '#', lvl: 14, dark: true, fx: 'dust', region: 'fen',
    rows: buildShrine(), encounters: [['bogslime', 3], ['serpent', 2], ['fenwisp', 3]], bg: 'ruins',
    npcs: [], warps: [{ x: 17, y: 27, w: 2, h: 1, to: '@ow' }],
    chests: [{ id: 'sh1', x: 6, y: 17, item: 'mega', qty: 1 }, { id: 'sh2', x: 29, y: 14, gold: 520 }, { id: 'sh3', x: 11, y: 4, item: 'shard', qty: 1 }, { id: 'sh4', x: 24, y: 8, item: 'fenrobe', qty: 1 }],
    signs: {}, safe: [[15, 22, 6, 6]]
  },
  // ---- the old places
  silvane: {
    name: 'Silvane Grove', music: 'forest', theme: 'forestv', edge: 'T', lvl: 10, fx: 'motes', ambient: 'rgba(40,90,70,.14)', region: 'silvane',
    rows: buildSilvane(), encounters: [['sprite', 3], ['moth', 3], ['blightwolf', 2]], bg: 'grove',
    npcs: [], warps: [{ x: 21, y: 33, w: 3, h: 1, to: '@ow' }],
    chests: [{ id: 'sv1', x: 4, y: 7, item: 'hiether', qty: 2 }, { id: 'sv2', x: 40, y: 27, item: 'astaff', qty: 1 }, { id: 'sv3', x: 37, y: 28, item: 'shard', qty: 1 }, { id: 'sv4', x: 6, y: 8, gold: 300 }],
    signs: {}, safe: [[18, 26, 9, 8]]
  },
  aurel: {
    name: 'Old Aurel', music: 'library', theme: 'castle', edge: '#', lvl: 15, dark: true, fx: 'motes', region: 'mirrow',
    rows: buildAurel(), encounters: [['sentry', 2], ['drowned', 3], ['naga', 2]], bg: 'ruins',
    gates: [{ x: 2, y: 14, ch: '¬', open: () => !G.flags.lever_w, msg: 'The lever is down. Somewhere, a socket is glowing.' }, { x: 37, y: 14, ch: '¬', open: () => !G.flags.lever_e, msg: 'The lever is down. Somewhere, a socket is glowing.' }, { x: 19, y: 22, ch: '¬', open: () => !G.flags.lever_s, msg: 'The lever is down. Somewhere, a socket is glowing.' },
      { x: 19, y: 9, w: 2, h: 1, ch: '×', open: () => G.flags.lever_w && G.flags.lever_e && G.flags.lever_s, msg: 'A round door sealed with a rune of violet light. Three sockets around it are dark. Something, somewhere, has to be switched on.' }],
    npcs: [], warps: [{ x: 17, y: 31, w: 6, h: 1, to: '@ow' }],
    chests: [{ id: 'au1', x: 4, y: 16, item: 'elixir', qty: 1 }, { id: 'au2', x: 35, y: 16, gold: 700 }, { id: 'au3', x: 12, y: 22, item: 'shard', qty: 1 }, { id: 'au4', x: 27, y: 22, item: 'hiether', qty: 3 }],
    signs: {}, safe: [[17, 25, 6, 7]]
  },
  rimeheart: {
    name: 'Rimeheart Hollow', music: 'mine', theme: 'cave', edge: '¡', lvl: 18, fx: 'motes', ambient: 'rgba(120,180,255,.18)', region: 'frost',
    rows: buildRimeheart(), encounters: [['frostwolf', 3], ['icewisp', 2], ['iceslime', 2], ['yeti', 1]], bg: 'ice',
    npcs: [], warps: [{ x: 17, y: 27, w: 3, h: 1, to: '@ow' }],
    chests: [{ id: 'rh1', x: 9, y: 26, item: 'elixir', qty: 1 }, { id: 'rh2', x: 29, y: 18, item: 'frostmail', qty: 1 }, { id: 'rh3', x: 10, y: 5, item: 'shard', qty: 1 }, { id: 'rh4', x: 31, y: 7, gold: 900 }],
    signs: {}, safe: [[15, 24, 7, 4]]
  },
  redcrag: {
    name: 'Redcrag Fort', music: 'travel', theme: 'grass', edge: 'r', lvl: 10, fx: 'dust', ambient: 'rgba(200,120,80,.06)', noDensify: true, region: 'red',
    rows: buildRedcrag(), encounters: [['redcrag', 3], ['archer', 2], ['hound', 2]], bg: 'road',
    npcs: [], warps: [{ x: 19, y: 29, w: 2, h: 1, to: '@ow' }],
    chests: [{ id: 'rc1', x: 10, y: 6, item: 'hipotion', qty: 3 }, { id: 'rc2', x: 29, y: 6, gold: 400 }, { id: 'rc3', x: 13, y: 21, item: 'dagger2', qty: 1 }, { id: 'rc4', x: 26, y: 21, item: 'shard', qty: 1 }],
    signs: {}, safe: [[16, 24, 8, 6]]
  }
});
// barrow / dungeons count for the quest boards
QUEST_AREAS.push('grotto', 'barrow', 'silvane', 'shrine', 'redcrag');
