// =====================================================================
//  detail.js : a richer world
//   - fuller countryside: extra trees, bushes, rocks, tall-grass and
//     flower patches grown into the open fields (never on paths,
//     doors, people or story spots — and every map stays walkable)
//   - big trees: tall two-tile oaks, pines and sakura that you walk
//     behind, swaying in the wind, see-through when you're behind them
//   - ground detail: pebbles, clover, mushrooms, fallen leaves, ruts,
//     puddles, cracks and moss, bones and glowing fissures in the ash,
//     crystals in the caves
//   - moving grass, shoreline foam, drifting light on water, lily pads,
//     fish rings, bubbling lava and rising embers
//   - cloud shadows over sunny maps, fireflies at night, drifting
//     leaves and pollen in the woods, sunbeams through windows indoors
//  Toggle in Settings -> "Map detail & tall trees".
// =====================================================================
if (Gfx.detail === undefined) Gfx.detail = true;

// ---------------------------------------------------------------- denser maps
(function densify() {
  const DENS = { grass: 1, forestv: 1.35, night: 0.8, ash: 0.8 };
  const OPEN = '.,f';
  for (const id in MAPS) {
    const m = MAPS[id];
    if (m.interior || !DENS[m.theme] || m.noDensify) continue;
    const rows = m.rows.map(r => r.split('')), h = rows.length, w = rows[0].length, dens = DENS[m.theme];
    const keep = new Set();
    const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) keep.add((x + dx) + ',' + (y + dy)); };
    const markRect = (x, y, ww, hh, r) => { for (let yy = y - r; yy < y + hh + r; yy++) for (let xx = x - r; xx < x + ww + r; xx++) keep.add(xx + ',' + yy); };
    for (const n of m.npcs || []) mark(n.x, n.y, 2 + (n.wander || 0));
    for (const c of m.chests || []) mark(c.x, c.y, 2);
    for (const p of m.pois || []) mark(p.x, p.y, 1);
    for (const wp of m.warps || []) markRect(wp.x, wp.y, wp.w || 1, wp.h || 1, 3);
    for (const t of m.triggers || []) markRect(t.x, t.y, t.w || 1, t.h || 1, 2);
    const seed = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);
    const H = (x, y, k) => hash2(x * 7 + seed % 997 + k * 131, y * 13 + (seed >> 10) % 991 + k * 71);
    const open8 = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!OPEN.includes(rows[y + dy][x + dx])) return false; return true; };
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (rows[y][x] !== '.' || keep.has(x + ',' + y)) continue;
      const r = H(x, y, 1) % 1000;
      if (open8(x, y)) {
        if (m.theme === 'ash') { if (r < 14 * dens) { rows[y][x] = 'X'; continue; } if (r < 26 * dens) { rows[y][x] = 'r'; continue; } }
        else {
          if (r < 20 * dens) { rows[y][x] = 'T'; continue; }
          if (r < 28 * dens) { rows[y][x] = '4'; continue; }
          if (r < 33 * dens) { rows[y][x] = 'r'; continue; }
        }
      }
      if (m.theme === 'ash') continue;
      // walk-through patches, grown in 2x2 clumps so they read as meadows rather than noise
      const cell = H(x >> 1, y >> 1, 2) % 100;
      if (cell < 8 * dens) rows[y][x] = ',';
      else if (cell > 96 - 2 * dens && m.theme !== 'night') rows[y][x] = 'f';
    }
    m.rows = rows.map(r => r.join(''));
  }
})();

// never leave a saved player or an old herb spot inside something solid
(function () {
  const _load = WorldScene.prototype.load;
  WorldScene.prototype.load = function (mapId, x, y, dir) {
    const m = MAPS[mapId];
    const solid = (a, b) => { const r = m.rows[b]; return !r || a < 0 || a >= r.length || SOLID.has(r[a]); };
    const nearest = (a, b) => {
      if (!solid(a, b)) return [a, b];
      for (let d = 1; d < 6; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === d && !solid(a + dx, b + dy) && !DOOR_TILES.has(m.rows[b + dy][a + dx])) return [a + dx, b + dy];
      return [a, b];
    };
    if (m && !m.interior && m.rows[y] && m.rows[y][x] && 'T4rX'.includes(m.rows[y][x])) [x, y] = nearest(x, y);
    if (m && typeof G !== 'undefined' && G.quests) for (const q of G.quests) if (q.map === mapId && q.spots) q.spots = q.spots.map(([a, b]) => nearest(a, b));
    return _load.call(this, mapId, x, y, dir);
  };
})();

// ---------------------------------------------------------------- the renderer
const Detail = {
  C: {},
  on(w) { return Gfx.detail !== false && w && w.map; },
  H(tx, ty, k = 0) { return hash2(tx * 3 + 1013 + k * 57, ty * 5 + 2029 + k * 91); },

  // ---- big trees ------------------------------------------------------
  tree(kind, n) {
    const key = kind + n; if (this.C[key]) return this.C[key];
    const r = rng(n * 7919 + kind.length * 31 + 5), CW = 64, CH = 80, GY = 76;
    const [tc, tx] = mkCanvas(CW, CH), [lc, lx] = mkCanvas(CW, CH);
    const s = 0.86 + (n % 3) * 0.1;
    const E = (x, cx, cy, rr, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, Math.max(0.5, rr), 0, 7); x.fill(); };
    const trunk = (top, wdt) => {
      const x0 = 32 - wdt / 2;
      tx.fillStyle = '#4a2e18'; tx.fillRect(x0 - 1, top, wdt + 2, GY - top);
      tx.fillStyle = '#6a4424'; tx.fillRect(x0, top, wdt, GY - top);
      tx.fillStyle = '#8a5a34'; tx.fillRect(x0 + 1, top + 2, 2, GY - top - 4);
      tx.fillStyle = '#3a2412'; tx.fillRect(x0 + wdt - 2, top, 2, GY - top);
      tx.fillStyle = '#5a3a20'; tx.fillRect(x0 - 3, GY - 3, 4, 3); tx.fillRect(x0 + wdt - 1, GY - 3, 4, 3);
      for (let i = 0; i < 4; i++) { tx.fillStyle = '#3e2814'; tx.fillRect(x0 + 2 + Math.floor(r() * (wdt - 3)), top + 4 + Math.floor(r() * (GY - top - 8)), 1, 3); }
    };
    if (kind === 'pine') {
      trunk(GY - 16, 6);
      const tiers = 4, top = GY - 14 - Math.round(60 * s);
      const P = n % 2 ? ['#0c2a1c', '#133d26', '#1b5230', '#2c6c3c', '#4a8c50'] : ['#0e2e22', '#16432c', '#1f5836', '#327444', '#56985a'];
      for (let i = 0; i < tiers; i++) {
        const ay = top + i * 13 * s, hw = (9 + i * 6.5) * s, by = ay + 22 * s;
        lx.fillStyle = P[0]; lx.beginPath(); lx.moveTo(32, ay - 1.5); lx.lineTo(32 + hw + 1.5, by + 1); lx.lineTo(32 - hw - 1.5, by + 1); lx.fill();
        lx.fillStyle = P[1]; lx.beginPath(); lx.moveTo(32, ay); lx.lineTo(32 + hw, by); lx.lineTo(32 - hw, by); lx.fill();
        lx.fillStyle = P[2]; lx.beginPath(); lx.moveTo(32, ay + 1); lx.lineTo(32 + hw * 0.1, by - 1); lx.lineTo(32 - hw * 0.95, by - 1); lx.fill();
        lx.fillStyle = P[3]; lx.beginPath(); lx.moveTo(32, ay + 2); lx.lineTo(32 - hw * 0.25, by - 3); lx.lineTo(32 - hw * 0.8, by - 2); lx.fill();
        for (let k = 0; k < 7; k++) { const px_ = 32 - hw * 0.8 + r() * hw * 1.2, py_ = ay + 6 + r() * 14 * s; lx.fillStyle = r() < 0.5 ? P[4] : P[0]; lx.fillRect(Math.round(px_), Math.round(py_), 2, 1); }
        lx.fillStyle = 'rgba(0,0,0,.18)'; lx.fillRect(Math.round(32 - hw), Math.round(by - 1), Math.round(hw * 2), 2);
      }
    } else {
      const sak = kind === 'sakura';
      const R = 21 * s, cy = GY - 28 - R * 0.75;
      trunk(Math.round(cy + R * 0.3), 8);
      // a couple of branches reaching into the crown
      tx.strokeStyle = '#5a3a20'; tx.lineWidth = 3; tx.beginPath(); tx.moveTo(32, cy + R * 0.6); tx.lineTo(22, cy + R * 0.1); tx.moveTo(33, cy + R * 0.5); tx.lineTo(43, cy); tx.stroke();
      const P = sak ? ['#7a3050', '#9a4060', '#c8607e', '#e48aa8', '#f6bcd0'] : n % 2 ? ['#0c2616', '#15452a', '#24602a', '#327a34', '#5aa84e'] : ['#0a2414', '#123e24', '#1f5a28', '#2f7430', '#4f9a44'];
      const lobes = [[32, cy, R], [32 - R * 0.62, cy + R * 0.38, R * 0.62], [32 + R * 0.62, cy + R * 0.38, R * 0.62], [32 - R * 0.2, cy - R * 0.5, R * 0.62], [32 + R * 0.35, cy - R * 0.35, R * 0.55]];
      for (const [a, b, rr] of lobes) E(lx, a, b, rr + 1.6, P[0]);
      for (const [a, b, rr] of lobes) E(lx, a, b, rr, P[1]);
      for (let i = 0; i < 90; i++) {
        const ang = r() * 6.283, d = Math.sqrt(r()) * R * 1.05, cx = 32 + Math.cos(ang) * d * 1.15, cyy = cy + Math.sin(ang) * d * 0.95;
        const lit = (38 - cx) * 0.45 + (cy + 6 - cyy) * 0.9;
        const col = lit > 16 ? P[4] : lit > 7 ? P[3] : lit > -2 ? P[2] : P[1];
        E(lx, cx, cyy, 2.4 + r() * 2.4, col);
        if (lit > 6) { lx.fillStyle = shade(col, 0.16); lx.fillRect(Math.floor(cx - 1), Math.floor(cyy - 2), 2, 1); }
      }
      // shade under the crown
      lx.globalCompositeOperation = 'source-atop'; const g = lx.createLinearGradient(0, cy, 0, cy + R * 1.2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,20,20,.35)'); lx.fillStyle = g; lx.fillRect(0, 0, CW, CH); lx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 26; i++) { const a = 32 - R + r() * R * 2, b = cy - R + r() * R * 1.6; lx.fillStyle = r() > 0.5 ? shade(P[4], 0.12) : P[0]; lx.fillRect(Math.round(a), Math.round(b), 1, 1); }
      if (sak) for (let i = 0; i < 14; i++) { lx.fillStyle = '#fff0f4'; lx.fillRect(Math.round(32 - R + r() * R * 2), Math.round(cy - R * 0.8 + r() * R * 1.4), 2, 2); }
      else if (n % 5 === 4) for (let i = 0; i < 5; i++) { const a = 32 - R * 0.7 + r() * R * 1.4, b = cy - R * 0.3 + r() * R; lx.fillStyle = '#d8303a'; lx.fillRect(Math.round(a), Math.round(b), 2, 2); lx.fillStyle = '#ff9a90'; lx.fillRect(Math.round(a), Math.round(b), 1, 1); }
    }
    return (this.C[key] = { trunk: tc, leaves: lc });
  },
  treeKind(w, tx, ty, ch) {
    if (ch === 'q') return 'sakura';
    const h = this.H(tx, ty, 3) % 100, t = w.map.theme;
    const pine = t === 'forestv' ? 45 : /forest|woods/.test(G.map) ? 35 : t === 'night' ? 25 : 12;
    return h < pine ? 'pine' : 'oak';
  },
  bigTrees(w) { return this.on(w) && !w.map.interior && w.map.theme !== 'tokyo' && w.map.theme !== 'castle'; },
  tileImg(w, ch, tx, ty, theme, v) {
    if ((ch !== 'T' && ch !== 'q') || !this.bigTrees(w)) return null;
    const under = w.groundUnder(tx, ty) || '.';
    return tileCanvas(under, theme, v, 0, under === '.' ? 0 : w.tileMask(tx, ty, under), w.tile(tx, ty - 1), '');
  },
  ents(w, ents, camX, camY, x0, y0) {
    if (!this.bigTrees(w)) return;
    const p = w.player, t = p.t, psx = (p.fx + (p.x - p.fx) * t) * TS - camX, psy = (p.fy + (p.y - p.fy) * t) * TS - camY;
    const x1 = x0 + Math.ceil(W / TS) + 1, y1 = y0 + Math.ceil(H / TS) + 2;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0 - 1; tx <= x1; tx++) {
      const ch = w.tile(tx, ty); if (ch !== 'T' && ch !== 'q') continue;
      const sx = tx * TS - camX, sy = ty * TS - camY;
      const img = this.tree(this.treeKind(w, tx, ty, ch), this.H(tx, ty, 4) % 6);
      const behind = psy < sy && psy > sy - 70 && Math.abs(psx - sx) < 36;
      ents.push({ y: sy - 0.5, draw: () => {
        const sway = Math.round(Math.sin(TIME * 1.3 + tx * 0.7 + ty * 0.4) * 1.1 + Math.sin(TIME * 0.5 - tx * 0.2) * 0.6);
        ctx.drawImage(img.trunk, sx - 16, sy - 44);
        if (behind) ctx.globalAlpha = 0.55;
        ctx.drawImage(img.leaves, sx - 16 + sway, sy - 44);
        ctx.globalAlpha = 1;
      } });
    }
  },

  // ---- ground decals ---------------------------------------------------
  decal(kind, n) {
    const key = 'd' + kind + n; if (this.C[key]) return this.C[key];
    const [c, x] = mkCanvas(32, 32), r = rng(n * 131 + kind.length * 977 + 3);
    const P = (col, a, b, ww = 1, hh = 1) => { x.fillStyle = col; x.fillRect(a, b, ww, hh); };
    const at = () => [4 + Math.floor(r() * 22), 6 + Math.floor(r() * 20)];
    switch (kind) {
      case 'pebbles': for (let i = 0; i < 4; i++) { const [a, b] = at(), w2 = 2 + Math.floor(r() * 2); P('rgba(0,0,0,.25)', a + 1, b + 2, w2, 1); P('#8a8478', a, b, w2, 2); P('#b8b2a4', a, b, 1, 1); } break;
      case 'clover': for (let i = 0; i < 3; i++) { const [a, b] = at(); for (const [dx, dy] of [[0, 0], [2, 0], [1, -2]]) { P('#3f8a34', a + dx, b + dy + 1, 2, 1); P('#7ccc60', a + dx, b + dy, 2, 1); } } break;
      case 'mushrooms': { const [a, b] = at(); const cap = r() < 0.5 ? ['#c8342a', '#f06a5a'] : ['#a8743a', '#d8a060']; for (const [dx, sz] of [[0, 4], [5, 3], [3, 2]]) { P('#e8dcc4', a + dx + 1, b - 1, 1, 3); P(cap[0], a + dx - 1, b - 2 - (sz > 2 ? 1 : 0), sz, 2); P(cap[1], a + dx - 1, b - 3 - (sz > 2 ? 1 : 0), sz - 1, 1); if (sz > 3) P('#fff', a + dx, b - 3, 1, 1); } P('rgba(0,0,0,.2)', a - 1, b + 2, 9, 1); break; }
      case 'daisies': for (let i = 0; i < 4; i++) { const [a, b] = at(); P('#2f7428', a, b + 1, 1, 2); P('#ffffff', a - 1, b, 3, 1); P('#ffffff', a, b - 1, 1, 3); P('#ffd84a', a, b, 1, 1); } break;
      case 'bluebells': for (let i = 0; i < 3; i++) { const [a, b] = at(); P('#2f7428', a, b, 1, 4); P('#6a7ae8', a - 1, b - 1, 2, 2); P('#9aa8ff', a + 1, b + 1, 2, 2); } break;
      case 'leaves': for (let i = 0; i < 5; i++) { const [a, b] = at(); const col = ['#c87a2a', '#a85a20', '#d8a040', '#8a6a2a'][Math.floor(r() * 4)]; P(col, a, b, 3, 2); P(shade(col, -0.25), a + 1, b + 1, 1, 1); } break;
      case 'stick': { const [a, b] = at(); P('#5a3a20', a, b, 8, 1); P('#7a5230', a + 1, b - 1, 5, 1); P('#5a3a20', a + 5, b - 2, 1, 2); P('rgba(0,0,0,.2)', a, b + 1, 8, 1); break; }
      case 'stone': { const [a, b] = at(); P('rgba(0,0,0,.25)', a, b + 3, 7, 2); P('#7a7a72', a, b, 7, 4); P('#9a9a90', a + 1, b, 5, 1); P('#5a8a3a', a, b, 2, 1); P('#5a8a3a', a + 5, b + 3, 2, 1); break; }
      case 'ruts': P('rgba(90,60,30,.22)', 8, 0, 2, 32); P('rgba(90,60,30,.22)', 22, 0, 2, 32); P('rgba(255,240,200,.12)', 10, 0, 1, 32); break;
      case 'prints': for (let i = 0; i < 3; i++) { const a = 10 + (i % 2) * 8, b = 4 + i * 10; P('rgba(80,55,30,.28)', a, b, 3, 4); P('rgba(80,55,30,.2)', a, b + 5, 3, 2); } break;
      case 'puddle': { x.fillStyle = 'rgba(60,70,90,.45)'; x.beginPath(); x.ellipse(16, 18, 9 + r() * 4, 4 + r() * 2, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(180,210,255,.35)'; x.fillRect(11, 16, 6, 1); x.fillRect(19, 19, 3, 1); break; }
      case 'crack': { x.strokeStyle = 'rgba(30,24,28,.55)'; x.lineWidth = 1; x.beginPath(); let a = 4 + r() * 8, b = 4 + r() * 8; x.moveTo(a, b); for (let i = 0; i < 5; i++) { a += 3 + r() * 4; b += (r() - 0.3) * 6; x.lineTo(a, b); } x.stroke(); break; }
      case 'moss': for (let i = 0; i < 10; i++) { const [a, b] = at(); P(r() < 0.5 ? '#5a8a3a' : '#6a9a44', a, b, 2, 1); } break;
      case 'bones': { const [a, b] = at(); P('#d8d0c0', a, b, 7, 2); P('#d8d0c0', a - 1, b - 1, 2, 4); P('#d8d0c0', a + 6, b - 1, 2, 4); P('#a8a090', a + 1, b + 1, 5, 1); if (r() < 0.5) { P('#e8e0d0', a + 10, b - 3, 5, 4); P('#3a3030', a + 11, b - 2, 1, 1); P('#3a3030', a + 13, b - 2, 1, 1); } break; }
      case 'charred': { x.fillStyle = 'rgba(20,14,16,.35)'; x.beginPath(); x.ellipse(16, 16, 10, 6, r(), 0, 7); x.fill(); break; }
      case 'fissure': { x.strokeStyle = '#2a1414'; x.lineWidth = 3; x.beginPath(); let a = 3, b = 10 + r() * 12; x.moveTo(a, b); for (let i = 0; i < 5; i++) { a += 5 + r() * 2; b += (r() - 0.5) * 8; x.lineTo(a, b); } x.stroke(); x.strokeStyle = '#ff7a2a'; x.lineWidth = 1; x.stroke(); break; }
      case 'crystal': { const [a, b] = at(); const col = r() < 0.5 ? ['#6ab0ff', '#b8e0ff', '#3a6ab0'] : ['#b07aff', '#e0c8ff', '#6a3ab0']; for (const [dx, hh] of [[0, 8], [3, 11], [6, 6]]) { P(col[2], a + dx, b - hh, 3, hh); P(col[0], a + dx, b - hh, 2, hh - 1); P(col[1], a + dx, b - hh, 1, Math.ceil(hh / 2)); } P('rgba(0,0,0,.3)', a - 1, b, 11, 1); break; }
      case 'rubble': for (let i = 0; i < 5; i++) { const [a, b] = at(); P('rgba(0,0,0,.3)', a + 1, b + 1, 3, 2); P('#6a5a4e', a, b, 3, 2); P('#8a7a6a', a, b, 1, 1); } break;
      case 'knot': { const [a, b] = at(); x.strokeStyle = 'rgba(60,34,16,.35)'; x.beginPath(); x.ellipse(a, b, 3, 1.5, 0, 0, 7); x.stroke(); break; }
      case 'scuff': P('rgba(255,240,210,.07)', 6, 12, 18, 2); P('rgba(40,20,10,.1)', 9, 20, 14, 1); break;
      case 'rune': { x.strokeStyle = 'rgba(190,120,255,.55)'; x.lineWidth = 1; x.beginPath(); x.arc(16, 16, 9, 0, 7); x.moveTo(16, 7); x.lineTo(16, 25); x.moveTo(8, 12); x.lineTo(24, 20); x.stroke(); break; }
    }
    return (this.C[key] = c);
  },
  DECALS: {
    grass: [['pebbles', 3], ['clover', 3], ['mushrooms', 1], ['daisies', 2], ['bluebells', 1], ['leaves', 1], ['stick', 1], ['stone', 1]],
    forest: [['mushrooms', 3], ['leaves', 3], ['stick', 2], ['clover', 2], ['pebbles', 1], ['stone', 2], ['bluebells', 1]],
    path: [['ruts', 3], ['prints', 2], ['pebbles', 3], ['puddle', 1]],
    stone: [['crack', 3], ['moss', 3], ['puddle', 1], ['leaves', 1]],
    ash: [['bones', 1], ['charred', 3], ['fissure', 2], ['crack', 2], ['pebbles', 2]],
    cave: [['crystal', 2], ['rubble', 3], ['puddle', 1], ['bones', 1]],
    wood: [['knot', 3], ['scuff', 2]],
    castle: [['crack', 3], ['rune', 1], ['rubble', 1]]
  },
  groupFor(w, ch) {
    const t = w.map.theme, m = w.map;
    if (m.interior) return t === 'castle' ? ('pj'.includes(ch) ? 'castle' : null) : ('ouxm'.includes(ch) ? 'wood' : null);
    if (ch === '.') return t === 'ash' ? 'ash' : t === 'cave' ? 'cave' : t === 'castle' ? 'castle' : t === 'tokyo' ? null : (t === 'forestv' || /forest|woods/.test(G.map)) ? 'forest' : 'grass';
    if (ch === '=') return 'path';
    if ('s_j'.includes(ch)) return t === 'castle' ? 'castle' : 'stone';
    if (ch === 'a') return 'ash';
    if ('c;'.includes(ch)) return 'cave';
    if (ch === 'p' && t === 'castle') return 'castle';
    return null;
  },
  pickDecal(list, h) {
    let tot = 0; for (const [, wgt] of list) tot += wgt;
    let k = h % tot; for (const [name, wgt] of list) { if (k < wgt) return name; k -= wgt; }
    return list[0][0];
  },

  // ---- per-frame passes --------------------------------------------------
  ground(w, camX, camY, x0, y0) {
    this.glows = [];
    if (!this.on(w)) return;
    const m = w.map, t = m.theme, outdoors = !m.interior;
    const x1 = x0 + Math.ceil(W / TS), y1 = y0 + Math.ceil(H / TS);
    const swayOK = outdoors && (t === 'grass' || t === 'forestv' || t === 'night');
    const wet = outdoors && (Weather.kind === 'rain' || Weather.kind === 'storm');
    const big = this.bigTrees(w);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) continue;
      const ch = w.tile(tx, ty), sx = tx * TS - camX, sy = ty * TS - camY, h = this.H(tx, ty);
      if (big && (ch === 'T' || ch === 'q')) { ctx.fillStyle = 'rgba(10,24,12,.32)'; ctx.beginPath(); ctx.ellipse(sx + 16, sy + 28, 19, 6, 0, 0, 7); ctx.fill(); continue; }
      if (ch === '~') { this.water(w, tx, ty, sx, sy, h, t); continue; }
      if (ch === 'L') { this.lava(sx, sy, h); continue; }
      const grp = this.groupFor(w, ch);
      if (grp) {
        const dens = grp === 'wood' ? 5 : grp === 'path' ? 9 : grp === 'grass' || grp === 'forest' ? 11 : 9;
        if (h % 100 < dens + (wet && grp === 'path' ? 8 : 0)) {
          const kind = wet && grp === 'path' && h % 3 === 0 ? 'puddle' : this.pickDecal(this.DECALS[grp], (h >> 7));
          ctx.drawImage(this.decal(kind, (h >> 3) % 4), sx, sy);
          if (kind === 'fissure') this.glows.push([sx + 16, sy + 16, 30 + Math.sin(TIME * 2 + h) * 6, 'rgba(255,110,40,1)', 0.55]);
          if (kind === 'crystal') this.glows.push([sx + 16, sy + 14, 34, h % 2 ? 'rgba(120,180,255,1)' : 'rgba(190,130,255,1)', 0.6]);
          if (kind === 'rune') this.glows.push([sx + 16, sy + 16, 30, 'rgba(190,120,255,1)', 0.35 + Math.sin(TIME * 1.5 + h) * 0.15]);
        }
      }
      // grass that moves in the wind
      if (swayOK && (ch === ',' || (ch === '.' && h % 5 === 0))) {
        const n = ch === ',' ? 6 : 3, wave = Math.sin(TIME * 1.8 - tx * 0.35 - ty * 0.18) * (Weather.kind === 'storm' ? 2.6 : 1.3);
        for (let i = 0; i < n; i++) {
          const bx = sx + 4 + ((h >> (i + 2)) % 24), by = sy + 10 + ((h >> (i + 5)) % 18), hh = ch === ',' ? 7 + (i % 3) : 4 + (i % 2);
          const lean = Math.round(wave * (0.6 + (i % 3) * 0.25));
          ctx.fillStyle = '#2f7428'; ctx.fillRect(bx, by - 2, 1, 3);
          ctx.fillStyle = '#46963a'; ctx.fillRect(bx + Math.round(lean * 0.5), by - hh + 2, 1, hh - 3);
          ctx.fillStyle = '#84d068'; ctx.fillRect(bx + lean, by - hh, 1, 2);
        }
      }
    }
    // fish rings on open water
    const L = this.life || (this.life = { rings: [], last: TIME });
    if (L.map !== m) { L.map = m; L.rings = []; }
    const dt = Math.min(0.1, TIME - L.last); L.last = TIME;
    if (outdoors && Math.random() < dt * 0.5) {
      for (let k = 0; k < 6; k++) { const tx = x0 + irand(0, x1 - x0), ty = y0 + irand(0, y1 - y0); if (w.tile(tx, ty) === '~' && w.tileMask(tx, ty, '~') === 0) { L.rings.push({ x: tx * TS + irand(6, 26), y: ty * TS + irand(6, 26), t: 0 }); break; } }
    }
    for (const rg of L.rings) {
      rg.t += dt; const p = rg.t / 1.4;
      ctx.globalAlpha = (1 - p) * 0.6; ctx.strokeStyle = '#d8ecff'; ctx.lineWidth = 1;
      for (const k of [1, 0.55]) { ctx.beginPath(); ctx.ellipse(rg.x - camX, rg.y - camY, 2 + p * 12 * k, 1 + p * 4.5 * k, 0, 0, 7); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    L.rings = L.rings.filter(rg => rg.t < 1.4);
  },
  water(w, tx, ty, sx, sy, h, theme) {
    const mask = w.tileMask(tx, ty, '~');
    // light sliding across the surface
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    for (let i = 0; i < 2; i++) { const a = Math.floor((TIME * (7 + i * 3) + (h >> (i * 4))) % 34) - 2, b = 4 + ((h >> (i * 3 + 6)) % 24); ctx.fillRect(sx + Math.max(0, a), sy + b, Math.min(5, 32 - Math.max(0, a)), 1); }
    // lapping foam along the shore
    ctx.fillStyle = 'rgba(232,244,255,.7)';
    if (mask & 1) for (let x = 0; x < 32; x += 2) ctx.fillRect(sx + x, sy + 5 + Math.round(Math.sin(TIME * 2.2 + (tx * 32 + x) * 0.21) * 1.2), 2, 1);
    if (mask & 8) for (let y = 0; y < 32; y += 2) ctx.fillRect(sx + 3 + Math.round(Math.sin(TIME * 2 + (ty * 32 + y) * 0.2) * 1.2), sy + y, 1, 2);
    if (mask & 2) for (let y = 0; y < 32; y += 2) ctx.fillRect(sx + 28 + Math.round(Math.sin(TIME * 2 + (ty * 32 + y) * 0.2 + 1) * 1.2), sy + y, 1, 2);
    // lily pads on still, green-country water
    if (mask === 0 && h % 17 === 0 && (theme === 'grass' || theme === 'forestv' || theme === 'night')) {
      const bob = Math.sin(TIME * 1.2 + h) * 0.8, a = sx + 8 + (h >> 4) % 14, b = sy + 10 + (h >> 8) % 12 + bob;
      ctx.fillStyle = '#1f5a28'; ctx.beginPath(); ctx.ellipse(a, b + 1, 6, 3.4, 0, 0.5, 6.0); ctx.lineTo(a, b + 1); ctx.fill();
      ctx.fillStyle = '#3f8a34'; ctx.beginPath(); ctx.ellipse(a, b, 6, 3.2, 0, 0.5, 6.0); ctx.lineTo(a, b); ctx.fill();
      if (h % 3 === 0) { ctx.fillStyle = '#f6bcd0'; ctx.fillRect(a - 2, b - 3, 4, 2); ctx.fillStyle = '#fff'; ctx.fillRect(a - 1, b - 4, 2, 1); }
    }
  },
  lava(sx, sy, h) {
    for (let i = 0; i < 2; i++) {
      const per = 1.6 + (h >> (i * 3)) % 10 / 10, ph = ((TIME + (h >> i) % 7) % per) / per;
      const a = sx + 6 + ((h >> (i * 5 + 2)) % 20), b = sy + 6 + ((h >> (i * 4 + 7)) % 20);
      if (ph < 0.8) { const rr = 1 + ph * 3.5; ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(a, b, rr, 0, 7); ctx.fill(); ctx.fillStyle = '#fff3c0'; ctx.fillRect(Math.round(a - rr * 0.4), Math.round(b - rr * 0.5), 1, 1); }
      else { ctx.strokeStyle = 'rgba(255,220,120,' + (1 - ph) * 4 + ')'; ctx.beginPath(); ctx.arc(a, b, 5 + (ph - 0.8) * 20, 0, 7); ctx.stroke(); }
    }
  },
  air(w, camX, camY) {
    if (!this.on(w)) return;
    const m = w.map, outdoors = !m.interior, x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    // embers rising from lava
    for (let ty = y0; ty <= y0 + 16; ty++) for (let tx = x0; tx <= x0 + 21; tx++) {
      if (w.tile(tx, ty) !== 'L') continue; const h = this.H(tx, ty, 9); if (h % 2) continue;
      const per = 2.4, ph = ((TIME + h % 10) % per) / per, sx = tx * TS - camX + 8 + (h >> 3) % 16 + Math.sin(TIME * 3 + h) * 3, sy = ty * TS - camY + 16 - ph * 70;
      ctx.globalAlpha = 1 - ph; ctx.fillStyle = ph < 0.5 ? '#ffd060' : '#ff7a2a'; ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
    }
    ctx.globalAlpha = 1;
    // cloud shadows sliding over sunny country
    const sun = w.sunPos(), calm = !['rain', 'storm', 'fog', 'mist'].includes(Weather.kind);
    if (outdoors && sun && calm && m.theme !== 'tokyo') {
      const span = w.w * TS + 700;
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 431 + TIME * (10 + i * 2)) % span) - 350, by = (i * 283 + 90) % Math.max(200, w.h * TS - 100);
        const cx = bx - camX, cy = by - camY; if (cx < -300 || cx > W + 300 || cy < -200 || cy > H + 200) continue;
        ctx.fillStyle = 'rgba(16,24,40,.10)';
        for (const [dx, dy, rx, ry] of [[0, 0, 110, 46], [70, 18, 80, 40], [-80, 14, 70, 34], [20, -26, 70, 30]]) { ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, 7); ctx.fill(); }
      }
    }
    // pollen in the woods by day, fireflies by night
    const forest = /forest|woods|fern/.test(G.map) || m.theme === 'forestv';
    const night = m.theme === 'night' || (Weather.kind === 'night');
    this.flies = [];
    if (outdoors && (night || forest) && !['rain', 'storm'].includes(Weather.kind)) {
      const n = night ? 16 : 22;
      for (let i = 0; i < n; i++) {
        const bx = (i * 113 + 37) % W, by = (i * 197 + 11) % H;
        let wx = bx + Math.floor(camX / W) * W; if (wx < camX - 20) wx += W;
        let wy = by + Math.floor(camY / H) * H; if (wy < camY - 20) wy += H;
        const sx = wx - camX + Math.sin(TIME * 0.6 + i * 1.7) * 26, sy = wy - camY + Math.sin(TIME * 0.45 + i * 2.3) * 18 + (night ? 0 : Math.sin(TIME * 0.2 + i) * 12);
        if (night) { const a = 0.5 + Math.sin(TIME * 2.4 + i * 1.3) * 0.5; if (a < 0.1) continue; this.flies.push([sx, sy, a]); ctx.globalAlpha = a; ctx.fillStyle = '#eaffa0'; ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2); }
        else { ctx.globalAlpha = 0.5; ctx.fillStyle = i % 3 ? '#fff6c0' : '#ffffff'; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1); }
      }
      ctx.globalAlpha = 1;
    }
    // leaves drifting down under big trees
    if (outdoors && forest && this.bigTrees(w)) {
      for (let i = 0; i < 9; i++) {
        const bx = (i * 151 + 60) % W, per = 9 + i % 4, ph = ((TIME + i * 2.1) % per) / per;
        let wx = bx + Math.floor(camX / W) * W; if (wx < camX - 20) wx += W;
        const sx = wx - camX + Math.sin(TIME * 1.6 + i) * 14 + ph * 40, sy = ph * (H + 40) - 20;
        ctx.globalAlpha = Math.min(1, (1 - ph) * 3); ctx.fillStyle = ['#84d068', '#d8a040', '#5aa84e'][i % 3];
        const flip = Math.floor(TIME * 4 + i) % 2; ctx.fillRect(Math.round(sx), Math.round(sy), flip ? 3 : 2, flip ? 1 : 2);
      }
      ctx.globalAlpha = 1;
    }
  },
  lights(w, camX, camY) {
    if (!this.on(w)) return;
    for (const [x, y, r, col, a] of this.glows || []) FX.addLight(x, y, r, col, a);
    for (const [x, y, a] of this.flies || []) FX.addLight(x, y, 26, 'rgba(210,255,140,1)', 0.5 * a);
  },
  // after the lighting: sunbeams through windows, glints on fireflies
  post(w, camX, camY) {
    if (!this.on(w)) return;
    const m = w.map;
    for (const [x, y, a] of this.flies || []) glow(x + 1, y + 1, 10, 'rgba(220,255,150,.5)', a);
    if (!m.interior || m.dark) return;
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let ty = Math.max(0, y0); ty <= y0 + 15; ty++) for (let tx = x0; tx <= x0 + 21; tx++) {
      const ch = w.tile(tx, ty); if (ch !== 'y' && ch !== 'W') continue;
      const sx = tx * TS - camX, sy = ty * TS - camY, len = 150, dx = 55;
      const g = ctx.createLinearGradient(0, sy + 26, 0, sy + 26 + len);
      g.addColorStop(0, 'rgba(255,236,190,.11)'); g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx + 6, sy + 26); ctx.lineTo(sx + 26, sy + 26); ctx.lineTo(sx + 26 + dx, sy + 26 + len); ctx.lineTo(sx + 6 + dx, sy + 26 + len); ctx.fill();
      const h = this.H(tx, ty, 5);
      ctx.fillStyle = 'rgba(255,245,220,.5)';
      for (let i = 0; i < 5; i++) { const p = ((TIME * 0.05 + i * 0.2 + (h % 10) / 10) % 1), mx = sx + 10 + (i * 7 + h) % 14 + p * dx + Math.sin(TIME + i) * 3, my = sy + 30 + p * (len - 20); ctx.fillRect(Math.round(mx), Math.round(my), 1, 1); }
    }
    ctx.restore();
  }
};
