// =====================================================================
//  textures.js : more materials, so every town looks like itself
//   - roofs: red tile, golden thatch, blue slate, terracotta, mossy
//     shingle, copper green
//   - walls: timber frame, dressed stone, whitewashed plaster, log,
//     sea-blue boards
//   - floors: oak, dark walnut, pale birch, flagstones, chequered tile,
//     woven reed;  inside walls: panelling, stone, plaster, logs
//   - trees: autumn oaks in the south, birches by the river, pines
//     under snow in the mountains, willows in the fen
//   - snow, sand and ground get more grain
//  Each town has a style; out on the overworld the style follows the
//  region, so the little towns on the map match the real ones.
// =====================================================================
const TEX = {
  ROOF: { red: null, thatch: ['#c8a050', '#8a6424'], slate: ['#5a6684', '#2e3650'], terracotta: ['#d07040', '#8a3a1e'], moss: ['#6a7444', '#3a4224'], copper: ['#3a8a7a', '#1e4a44'] },
  WALL: { timber: null, stone: ['#a8a49c', '#6a665e'], plaster: ['#f0ece2', '#c8c0b0'], log: ['#8a5a30', '#4a2e16'], blue: ['#6a8ab8', '#3a5078'] },
  FLOOR: { oak: null, walnut: ['#6a4024', '#3a2010'], birch: ['#d8c090', '#a88a5a'], stone: ['#8a8680', '#5a5650'], tile: ['#c8a088', '#8a5a48'], reed: ['#b8a468', '#7a6a38'] },
  IWALL: { panel: null, stone: ['#7a766e', '#4a4640'], plaster: ['#e0d8c8', '#a89c88'], log: ['#7a5030', '#3a2412'] },
  MAP: {
    brookvale: { roof: 'thatch' }, village: { roof: 'thatch', wall: 'plaster' }, fernhollow: { roof: 'moss', wall: 'log' },
    solmere: { roof: 'slate', wall: 'plaster' }, ironhold: { wall: 'stone' }, gullhaven: { roof: 'terracotta', wall: 'blue' },
    cairnstead: { roof: 'thatch', wall: 'stone' }, mirewatch: { roof: 'moss', wall: 'log' }, redcrag: { roof: 'moss', wall: 'log' },
    valen_inn: { floor: 'walnut' }, valen_shop: { floor: 'birch' }, valen_home: { floor: 'birch', iwall: 'plaster' },
    brookvale_inn: { floor: 'oak', iwall: 'plaster' }, brookvale_shop: { floor: 'reed', iwall: 'plaster' }, brookvale_chapel: { floor: 'stone', iwall: 'stone' }, cobb_home: { floor: 'reed', iwall: 'plaster' },
    aldmere_inn: { floor: 'walnut', iwall: 'plaster' }, aldmere_shop: { floor: 'birch', iwall: 'plaster' }, elder_home: { floor: 'reed', iwall: 'plaster' },
    fern_lodge: { floor: 'walnut', iwall: 'log' }, solmere_shop: { floor: 'tile', iwall: 'plaster' }, solmere_tavern: { floor: 'walnut' }, curio_shop: { floor: 'tile' },
    ironhold_shop: { floor: 'stone', iwall: 'stone' }, ironhold_tavern: { floor: 'stone', iwall: 'stone' },
    gull_inn: { floor: 'birch', iwall: 'plaster' }, gull_shop: { floor: 'birch', iwall: 'plaster' }, gull_harbour: { floor: 'birch', iwall: 'plaster' }, gull_barber: { floor: 'tile', iwall: 'plaster' },
    gull_keeper: { floor: 'reed', iwall: 'plaster' }, gull_light: { floor: 'stone', iwall: 'stone' },
    cairn_inn: { floor: 'stone', iwall: 'stone' }, cairn_shop: { floor: 'stone', iwall: 'stone' }, cairn_long: { floor: 'walnut', iwall: 'log' }, cairn_seer: { floor: 'reed', iwall: 'log' },
    mire_inn: { floor: 'reed', iwall: 'log' }, mire_shop: { floor: 'reed', iwall: 'log' }, mire_hesk: { floor: 'reed', iwall: 'log' },
    valen_manor: { floor: 'oak' }
  },
  OW_ROOF: { coast: 'terracotta', moor: 'thatch', fen: 'moss', crown: 'slate', iron: 'slate', fern: 'moss', brook: 'thatch', ald: 'thatch', red: 'moss', rift: 'slate' },
  OW_WALL: { coast: 'blue', moor: 'stone', fen: 'log', crown: 'plaster', iron: 'stone', fern: 'log', ald: 'plaster' },
  C: {}
};
// recolour a tile: keep its light and shade, swap its colour for a two-tone ramp
function texRecolour(src, ramp, key, minLum = 0) {
  if (TEX.C[key]) return TEX.C[key];
  const [c, x] = mkCanvas(32, 32); x.drawImage(src, 0, 0);
  const d = x.getImageData(0, 0, 32, 32), p = d.data;
  const hi = parseInt(ramp[0].slice(1), 16), lo = parseInt(ramp[1].slice(1), 16);
  const H = [hi >> 16, (hi >> 8) & 255, hi & 255], L = [lo >> 16, (lo >> 8) & 255, lo & 255];
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 10) continue;
    const lum = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255;
    if (lum < minLum) continue;
    const t = clamp((lum - 0.12) / 0.7, 0, 1.25);
    for (let k = 0; k < 3; k++) p[i + k] = clamp(Math.round(L[k] + (H[k] - L[k]) * t), 0, 255);
  }
  x.putImageData(d, 0, 0);
  return (TEX.C[key] = c);
}
// extra surface for some materials, drawn on top of the recoloured tile
function texOverlay(c, kind, mat, v, mask) {
  const x = c.getContext('2d'), R = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); }, r = rng(v * 131 + mat.length * 17 + kind.length);
  if (kind === 'roof' && mat === 'thatch') {
    for (let i = 0; i < 70; i++) { const a = Math.floor(r() * 32), b = Math.floor(r() * 30); R(a, b, 1, 3, r() < 0.5 ? '#e8c878' : '#8a6424'); }
    for (let j = 7; j < 32; j += 8) R(0, j, 32, 1, 'rgba(90,60,20,.45)');
  }
  if (kind === 'roof' && mat === 'moss') for (let i = 0; i < 8; i++) { const a = Math.floor(r() * 28), b = Math.floor(r() * 28); R(a, b, 3 + Math.floor(r() * 3), 2, '#7a9a44'); R(a + 1, b, 1, 1, '#a8c860'); }
  if (kind === 'roof' && mat === 'terracotta') for (let j = 0; j < 32; j += 8) for (let i = (j % 16 ? 4 : 0); i < 32; i += 8) { x.fillStyle = 'rgba(255,220,180,.25)'; x.beginPath(); x.arc(i + 3, j + 3, 3, Math.PI, 0); x.fill(); }
  if (kind === 'roof' && mat === 'copper') for (let i = 0; i < 6; i++) R(Math.floor(r() * 30), Math.floor(r() * 30), 2, 4, 'rgba(160,230,210,.35)');
  if (kind === 'wall' && mat === 'stone') { for (let j = 3; j < 29; j += 6) { R(0, j, 32, 1, 'rgba(40,36,30,.35)'); for (let i = (j % 12 === 3 ? 2 : 8); i < 32; i += 12) R(i, j, 1, 6, 'rgba(40,36,30,.35)'); } }
  if (kind === 'wall' && mat === 'log') for (let j = 2; j < 30; j += 5) { R(0, j, 32, 1, 'rgba(30,18,8,.5)'); R(0, j + 1, 32, 1, 'rgba(255,220,170,.18)'); if (v % 2) { x.fillStyle = 'rgba(60,36,16,.6)'; x.beginPath(); x.arc(2, j + 2.5, 2, 0, 7); x.fill(); } }
  if (kind === 'wall' && mat === 'blue') for (let i = 4; i < 32; i += 6) R(i, 3, 1, 26, 'rgba(20,30,60,.35)');
  if (kind === 'floor' && mat === 'stone') { R(0, 0, 32, 32, 'rgba(0,0,0,0)'); for (const [a, b, w, h] of [[0, 0, 15, 10], [16, 0, 16, 14], [0, 11, 10, 11], [11, 15, 21, 8], [0, 23, 18, 9], [19, 24, 13, 8]]) { x.strokeStyle = 'rgba(30,28,24,.45)'; x.strokeRect(a + 0.5, b + 0.5, w, h); R(a + 1, b + 1, w - 1, 1, 'rgba(255,255,255,.08)'); } }
  if (kind === 'floor' && mat === 'tile') for (let j = 0; j < 32; j += 8) for (let i = 0; i < 32; i += 8) if (((i + j) / 8) % 2) R(i, j, 8, 8, 'rgba(250,240,220,.35)');
  if (kind === 'floor' && mat === 'reed') for (let j = 0; j < 32; j += 4) for (let i = (j % 8 ? 2 : 0); i < 32; i += 4) R(i, j, 2, 4, 'rgba(255,240,190,.18)');
  if (kind === 'iwall' && mat === 'plaster') { R(0, 22, 32, 10, 'rgba(110,70,40,.55)'); R(0, 22, 32, 1, 'rgba(255,240,220,.4)'); }
  if (kind === 'iwall' && mat === 'stone') for (let j = 4; j < 30; j += 7) { R(0, j, 32, 1, 'rgba(20,18,14,.4)'); for (let i = (j % 14 === 4 ? 4 : 11); i < 32; i += 14) R(i, j, 1, 7, 'rgba(20,18,14,.4)'); }
  if (kind === 'iwall' && mat === 'log') for (let j = 3; j < 30; j += 6) R(0, j, 32, 1, 'rgba(30,18,8,.5)');
  return c;
}
function texStyled(ch, theme, v, mask, up, under, st) {
  let kind, mat, set;
  if (ch === 'R') { kind = 'roof'; mat = st.roof; set = TEX.ROOF; }
  else if (ch === 'W' || ch === 'D' || ch === 'E') { kind = 'wall'; mat = st.wall; set = TEX.WALL; }
  else if (ch === 'o' || ch === 'x' || ch === 'm') { kind = 'floor'; mat = st.floor; set = TEX.FLOOR; }
  else if (ch === 'V') { kind = 'iwall'; mat = st.iwall; set = TEX.IWALL; }
  if (!kind || !mat || !set[mat]) return null;
  const key = 'tx:' + ch + theme + v + ':' + mask + up + '/' + under + '|' + mat;
  if (TEX.C[key]) return TEX.C[key];
  const base = tileCanvas(ch, theme, v, 0, mask, up, under);
  // walls keep their doors and windows: recolour only the plaster parts by masking out the darkest pixels
  const c = texRecolour(base, set[mat], key + '~', kind === 'wall' ? 0.5 : 0);
  const [out, ox] = mkCanvas(32, 32); ox.drawImage(c, 0, 0);
  if (kind === 'wall' && ch !== 'W') { // doors stay wood
    const d = ox.getImageData(0, 0, 32, 32), bd = base.getContext('2d').getImageData(0, 0, 32, 32);
    for (let yy = 8; yy < 32; yy++) for (let xx = 9; xx < 23; xx++) { const i = (yy * 32 + xx) * 4; for (let k = 0; k < 4; k++) d.data[i + k] = bd.data[i + k]; }
    ox.putImageData(d, 0, 0);
  }
  texOverlay(out, kind, mat, v, mask);
  return (TEX.C[key] = out);
}
// which style applies right now
function texStyleFor(w, tx, ty) {
  const id = G && G.map;
  if (w.map === MAPS.overworld) { const k = owRegion(tx, ty); return { roof: TEX.OW_ROOF[k], wall: TEX.OW_WALL[k] }; }
  return TEX.MAP[id] || null;
}
{
  const ti0 = Detail.tileImg.bind(Detail);
  Detail.tileImg = function (w, ch, tx, ty, theme, v) {
    const r = ti0(w, ch, tx, ty, theme, v);
    if (r) return r;
    if (!'RWDEoxmV'.includes(ch)) return null;
    const st = texStyleFor(w, tx, ty);
    if (!st) return null;
    return texStyled(ch, theme, v, w.tileMask(tx, ty, ch), w.tile(tx, ty - 1), ON_GROUND.has(ch) ? w.groundUnder(tx, ty) : '', st);
  };
}

// ---------------------------------------------------------------- more kinds of tree
{
  const tk0 = Detail.treeKind.bind(Detail);
  Detail.treeKind = function (w, tx, ty, ch) {
    const base = tk0(w, tx, ty, ch);
    if (ch === 'q') return base;
    const h = this.H(tx, ty, 9) % 100;
    let k = null;
    if (w.map === MAPS.overworld) k = owRegion(tx, ty);
    else k = (w.map.region) || ({ brookvale: 'brook', village: 'ald', valenford: 'valen', fernhollow: 'fern', forest: 'whisper', solmere: 'crown' })[G.map] || null;
    if (k === 'red' || k === 'crown' || k === 'ald') { if (h < 30) return 'autumn'; if (h < 38) return 'birch'; }
    if (k === 'brook' || k === 'valen') { if (h < 14) return 'birch'; if (h < 20) return 'autumn'; }
    if (k === 'iron' && base === 'pine' && h < 70) return 'snowpine';
    if (k === 'iron' && h < 40) return 'snowpine';
    if (k === 'fen') return h < 60 ? 'willow' : 'deadoak';
    if (k === 'moor' && h < 40) return 'birch';
    if (k === 'rift') return 'deadoak';
    if (k === 'coast' && h < 30) return 'pine';
    if (k === 'whisper' && h < 10) return 'autumn';
    return base;
  };
  const tr0 = Detail.tree.bind(Detail);
  const recol = (src, map, key) => {
    if (Detail.C[key]) return Detail.C[key];
    const [c, x] = mkCanvas(src.width, src.height); x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, src.width, src.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) if (p[i + 3] > 0) { const o = map(p[i], p[i + 1], p[i + 2]); p[i] = o[0]; p[i + 1] = o[1]; p[i + 2] = o[2]; if (o[3] !== undefined) p[i + 3] = o[3]; }
    x.putImageData(d, 0, 0); return (Detail.C[key] = c);
  };
  Detail.tree = function (kind, n) {
    if (kind === 'autumn') {
      const b = tr0('oak', n), key = 'autumn' + n;
      if (!this.C[key]) this.C[key] = { trunk: b.trunk, leaves: recol(b.leaves, (r, g, bb) => { const l = (r + g + bb) / 3; const pal = n % 3 === 0 ? [255, 190, 60] : n % 3 === 1 ? [235, 110, 40] : [200, 70, 40]; const t = l / 140; return [clamp(pal[0] * t, 0, 255), clamp(pal[1] * t, 0, 255), clamp(pal[2] * t * 0.7, 0, 255)]; }, key + 'L') };
      return this.C[key];
    }
    if (kind === 'birch') {
      const b = tr0('oak', n), key = 'birch' + n;
      if (!this.C[key]) this.C[key] = {
        trunk: recol(b.trunk, (r, g, bb) => { const l = (r + g + bb) / 3; return l < 70 ? [40, 36, 40] : [235 - (80 - l) * 0.3, 230 - (80 - l) * 0.3, 220 - (80 - l) * 0.3]; }, key + 'T'),
        leaves: recol(b.leaves, (r, g, bb) => [clamp(r * 1.1 + 30, 0, 255), clamp(g * 1.15 + 30, 0, 255), clamp(bb * 0.8 + 10, 0, 255)], key + 'L')
      };
      return this.C[key];
    }
    if (kind === 'snowpine') {
      const b = tr0('pine', n), key = 'snowpine' + n;
      if (!this.C[key]) {
        const [c, x] = mkCanvas(b.leaves.width, b.leaves.height); x.drawImage(b.leaves, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height), p = d.data, Wc = c.width;
        for (let i = 0; i < p.length; i += 4) { if (p[i + 3] === 0) continue; const above = i - Wc * 4 * 2; if (above < 0 || p[above + 3] === 0 || (hash2(i, 7) % 7 === 0)) { p[i] = 240; p[i + 1] = 246; p[i + 2] = 255; } }
        x.putImageData(d, 0, 0);
        this.C[key] = { trunk: b.trunk, leaves: c };
      }
      return this.C[key];
    }
    if (kind === 'willow') {
      const b = tr0('oak', n), key = 'willow' + n;
      if (!this.C[key]) {
        const leaves = recol(b.leaves, (r, g, bb) => [clamp(r * 0.8 + 30, 0, 255), clamp(g * 0.95 + 20, 0, 255), clamp(bb * 0.6, 0, 255)], key + 'L');
        const [c, x] = mkCanvas(leaves.width, leaves.height); x.drawImage(leaves, 0, 0);
        const rr = rng(n * 17 + 3);
        for (let i = 0; i < 22; i++) { const sx = 10 + rr() * 44, sy = 20 + rr() * 20, len = 14 + rr() * 22; x.fillStyle = rr() < 0.5 ? '#5a7a34' : '#7a9a44'; x.fillRect(Math.round(sx), Math.round(sy), 1, Math.round(len)); }
        this.C[key] = { trunk: b.trunk, leaves: c };
      }
      return this.C[key];
    }
    if (kind === 'deadoak') {
      const b = tr0('oak', n), key = 'deadoak' + n;
      if (!this.C[key]) {
        const [c, x] = mkCanvas(64, 80); const rr = rng(n * 23 + 5);
        x.strokeStyle = '#3a2a22'; x.lineCap = 'round';
        const branch = (x0, y0, a, len, w) => { if (len < 4) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); branch(x1, y1, a - 0.4 - rr() * 0.3, len * 0.7, Math.max(1, w - 1)); branch(x1, y1, a + 0.4 + rr() * 0.3, len * 0.65, Math.max(1, w - 1)); };
        branch(32, 52, -Math.PI / 2, 16, 4);
        x.lineWidth = 1;
        this.C[key] = { trunk: b.trunk, leaves: c };
      }
      return this.C[key];
    }
    return tr0(kind, n);
  };
}

// ---------------------------------------------------------------- more grain on the ground
{
  const dt0 = drawTile;
  drawTile = function (x, ch, theme, v, frame, mask, up, under) {
    dt0(x, ch, theme, v, frame, mask, up, under);
    const R = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
    const r = rng(v * 313 + ch.charCodeAt(0) * 7 + 99);
    if (ch === 'ö') {      // drifts and blue shadows
      for (let i = 0; i < 3; i++) { const y = 6 + i * 10 + Math.floor(r() * 4), x0 = Math.floor(r() * 12); x.fillStyle = 'rgba(120,150,200,.28)'; x.beginPath(); x.ellipse(x0 + 10, y, 10, 2, 0, 0, 7); x.fill(); R(x0 + 4, y - 2, 12, 1, 'rgba(255,255,255,.7)'); }
      for (let i = 0; i < 4; i++) R(Math.floor(r() * 31), Math.floor(r() * 31), 1, 1, '#ffffff');
    } else if (ch === 'ä' && !(mask & 4)) { // little prints in the sand
      if (v === 2) for (let i = 0; i < 3; i++) { R(6 + i * 7, 12 + (i % 2) * 6, 2, 3, 'rgba(160,130,80,.35)'); }
    } else if (ch === '.' && theme === 'grass') {
      // a few more kinds of patch: dry ground, dandelions, clover, dark soil
      const k = (v * 7 + (mask || 0)) % 5;
      if (k === 1) for (let i = 0; i < 4; i++) { const a = Math.floor(r() * 28) + 2, b = Math.floor(r() * 26) + 3; R(a, b, 2, 2, '#f2d84a'); R(a, b + 2, 1, 2, '#3a7a30'); }
      if (k === 3) { x.fillStyle = 'rgba(150,120,60,.18)'; x.beginPath(); x.ellipse(10 + r() * 12, 12 + r() * 10, 7, 4, 0, 0, 7); x.fill(); }
    }
  };
}
