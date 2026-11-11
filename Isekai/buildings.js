// =====================================================================
//  buildings.js : towns you look *up* at
//   - every house is redrawn as a real building: the ground floor where
//     the doors are, then one, two or three storeys above it, then a
//     steep roof — so buildings stand taller than you and you mostly
//     see their faces, not their roofs
//   - long houses are split into rows of narrow townhouses, each with
//     its own colour, height, timber framing, shutters, balconies,
//     dormers and chimneys, so streets read as packed terraces
//   - the capital and Ironhold get whole new blocks of houses you can't
//     go into, packed along new streets (nothing you could reach
//     before is ever cut off)
//   - walk behind anything taller than you — a building, a big tree, a
//     mountain peak, bunting over the street — and it fades so you can
//     still see yourself
//   - windows on every floor light up at night
// =====================================================================

// ---------------------------------------------------------------- see-through when you're behind it
const Occlude = {
  a: new Map(),
  // rect in screen space; baseY = screen y of the thing's footing
  alpha(key, x, y, w, h, baseY, minA = 0.5) {
    let tgt = 1;
    const wd = typeof World !== 'undefined' ? World : null;
    if (wd && wd.player && wd.camX != null) {
      const p = wd.player, t = p.t;
      const px = (p.fx + (p.x - p.fx) * t) * TS - wd.camX, py = (p.fy + (p.y - p.fy) * t) * TS - wd.camY;
      // the hero's body: roughly x+6..x+26, y-6..y+30
      if (py + 30 < baseY + 2 && px + 24 > x && px + 8 < x + w && py + 30 > y + 12 && py - 6 < y + h) tgt = minA;
    }
    const cur = this.a.has(key) ? this.a.get(key) : tgt;
    const dt = Math.min(0.1, TIME - (this._t || TIME)) || 0.016;
    const v = cur + (tgt - cur) * Math.min(1, dt * 9);
    this.a.set(key, v);
    return v;
  },
  frame() { this._t = this._now; this._now = TIME; },
  reset() { this.a.clear(); }
};

// ---------------------------------------------------------------- denser towns: whole new blocks
// [x, top, width, roof rows, door columns]; each is only built if nothing you could reach before is cut off
const CITY_FILL = {
  solmere: { clear: 'q:', blocks: [[2, 2, 12, 3, [5, 10]], [38, 2, 12, 3, [41, 46]], [37, 34, 13, 2, [40, 46]], [19, 34, 4, 2, [20]]], move: { smDog: [44, 38, 1] } }
};
(function densifyCities() {
  for (const id in CITY_FILL) {
    const m = MAPS[id]; if (!m) continue;
    const cfg = CITY_FILL[id];
    for (const n of m.npcs || []) if (cfg.move && cfg.move[n.id]) { const [x, y, wd] = cfg.move[n.id]; n.x = x; n.y = y; n.wander = wd; }
    const rows = m.rows.map(r => r.split('')), h = rows.length, w = rows[0].length;
    const T = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? '#' : rows[y][x];
    const pass = (x, y) => { const c = T(x, y); return c !== '#' && !SOLID.has(c) && c !== '~'; };
    const key = (x, y) => x + ',' + y;
    const start = (() => { const wp = (m.warps || []).find(v => v.to === '@travel') || m.warps[0]; for (const [dx, dy] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) if (pass(wp.x + dx, wp.y + dy)) return [wp.x + dx, wp.y + dy]; return [wp.x, wp.y]; })();
    const reach = () => { const seen = new Set([key(...start)]), q = [start]; while (q.length) { const [a, b] = q.pop(); for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const k = key(a + dx, b + dy); if (!seen.has(k) && pass(a + dx, b + dy)) { seen.add(k); q.push([a + dx, b + dy]); } } } return seen; };
    const people = [...(m.npcs || []), ...(m.chests || [])];
    let placed = 0;
    for (const [x0, top, bw, rr, doors] of cfg.blocks) {
      const x1 = x0 + bw - 1, bot = top + rr;
      let ok = true;
      for (let y = top; y <= bot && ok; y++) for (let x = x0; x <= x1 && ok; x++) if (!cfg.clear.includes(T(x, y))) ok = false;
      if (ok && people.some(n => n.x >= x0 && n.x <= x1 && n.y >= top - 1 && n.y <= bot)) ok = false;
      if (ok && (m.warps || []).some(v => v.x + (v.w || 1) > x0 && v.x <= x1 && v.y + (v.h || 1) > top - 1 && v.y <= bot + 1)) ok = false;
      if (!ok) { console.warn('city block skipped', id, x0, top); continue; }
      const before = reach(), saved = [];
      for (let y = top; y <= bot; y++) for (let x = x0; x <= x1; x++) { saved.push([x, y, rows[y][x]]); rows[y][x] = y === bot ? (doors.includes(x) ? 'D' : 'W') : 'R'; }
      const after = reach();
      // everything still reachable (bar the new footprint), and every person can still be walked up to
      let fine = after.size >= before.size - saved.filter(([x, y]) => before.has(key(x, y))).length;
      for (const n of m.npcs || []) if (fine && before.has(key(n.x, n.y)) && ![[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => after.has(key(n.x + dx, n.y + dy)))) fine = false;
      if (!fine) { for (const [x, y, c] of saved) rows[y][x] = c; console.warn('city block would cut something off', id, x0, top); continue; }
      placed++;
    }
    m.rows = rows.map(r => r.join(''));
    m._cityBlocks = placed;
  }
})();

// ---------------------------------------------------------------- the renderer
const Buildings = {
  C: {}, maps: {},
  STYLE: {
    village: { walls: ['#efe4cc', '#f2e6c0', '#e8d4b8', '#f4ecd8', '#ecd8c0', '#f0e0a8'], trim: ['#7a5030', '#6a4024', '#8a5a34'], roofs: ['#a8413a', '#b8503a', '#983a32', '#a85a3a', '#8a3a2e'], timber: 0.6, shutter: ['#3a6a4a', '#4a5a8a', '#8a3a2a', '#6a4a2a'], storeys: 1 },
    city: { walls: ['#f2e8d8', '#e8d0c8', '#d8e4ec', '#e4ecd8', '#f0dcb0', '#e8c8b8', '#d0d8e8', '#f4f0e8'], trim: ['#4a4a5a', '#5a4a3a', '#3e4e7e'], roofs: ['#3e4e7e', '#4a5a8a', '#2e6a6a', '#a8413a', '#5a4a6a', '#3a5a7a'], timber: 0.15, shutter: ['#2e4f7a', '#4a7a5a', '#7a3a3a', '#5a5a6a'], storeys: 2, stone: true },
    town: { walls: ['#b8b0a0', '#a8a094', '#c8bca8', '#9a948a'], trim: ['#4a3a2a', '#3a3030'], roofs: ['#5a6a7a', '#4a5a6a', '#6a6a72', '#5a5a64'], timber: 0.7, shutter: ['#4a3a2a', '#5a4030'], storeys: 1, stone: true },
    coast: { walls: ['#f4f4f0', '#eef2f4', '#f2ece0', '#e8f0f4'], trim: ['#3a6a9a', '#2e5a7a', '#4a7aa8'], roofs: ['#b85a3a', '#3a6a9a', '#a8503a', '#c86a4a'], timber: 0.1, shutter: ['#3a7ab0', '#2e8a9a', '#4a6ab8'], storeys: 1 },
    snow: { walls: ['#8a6a4a', '#7a5a3a', '#9a7a58'], trim: ['#3a2a1a', '#4a3020'], roofs: ['#5a4a4a', '#4a4040', '#6a5248'], timber: 0.8, shutter: ['#7a3a2a', '#3a4a5a'], storeys: 1, snow: true },
    fen: { walls: ['#7a6a50', '#6a5a44', '#8a7a5a'], trim: ['#3a2a1a'], roofs: ['#b89a5a', '#a88a4a', '#c8a868'], timber: 0.5, shutter: ['#4a5a3a', '#5a4a2a'], storeys: 1, thatch: true },
    moor: { walls: ['#a8a090', '#b8b0a0', '#9a9488'], trim: ['#4a3a2a'], roofs: ['#b89a5a', '#a88a4a', '#c8a868'], timber: 0.2, shutter: ['#4a5a3a', '#5a3a2a'], storeys: 1, stone: true, thatch: true }
  },
  styleFor(id, m) {
    if (/solmere|academy/.test(id)) return this.STYLE.city;
    if (/ironhold|redcrag/.test(id)) return this.STYLE.town;
    if (/gull/.test(id)) return this.STYLE.coast;
    if (/rime|frost/.test(id)) return this.STYLE.snow;
    if (/mire/.test(id)) return this.STYLE.fen;
    if (/cairn/.test(id)) return this.STYLE.moor;
    return this.STYLE.village;
  },
  on(w) { return w && w.map && !w.map.interior && w.map.theme !== 'tokyo'; },

  // find every house: rows of roof over one row of wall
  get(w) {
    const id = G.map, c = this.maps[id];
    if (c && c.rows === w.rows) return c;
    const out = { rows: w.rows, list: [], cover: new Set() };
    if (!this.on(w)) return (this.maps[id] = out);
    const st = this.styleFor(id, w.map);
    for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
      if (w.tile(x, y) !== 'R' || w.tile(x, y - 1) === 'R' || w.tile(x - 1, y) === 'R') continue;
      let x1 = x; while (w.tile(x1 + 1, y) === 'R') x1++;
      let bot = y; while ([...Array(x1 - x + 1)].every((_, i) => w.tile(x + i, bot + 1) === 'R')) bot++;
      const wall = bot + 1;
      if (![...Array(x1 - x + 1)].every((_, i) => 'WED'.includes(w.tile(x + i, wall)))) continue;
      if (x1 - x < 1) continue;
      const b = { x0: x, x1, top: y, wall, id: id + ':' + x + ',' + y };
      b.segs = this.segments(b, st, id);
      out.list.push(b);
      for (let yy = y; yy <= wall; yy++) for (let xx = x; xx <= x1; xx++) out.cover.add(xx + ',' + yy);
    }
    return (this.maps[id] = out);
  },
  segments(b, st, id) {
    const n = b.x1 - b.x0 + 1, segs = [], H = (k) => hash2(b.x0 * 31 + k * 7 + id.length, b.top * 17 + k * 13);
    let x = 0, k = 0;
    while (x < n) {
      let sw = n <= 3 ? n : 2 + H(k) % 3;
      if (n - x - sw === 1) sw++;
      if (x + sw > n) sw = n - x;
      const h = H(k + 50);
      const roofRows = b.wall - b.top;
      segs.push({
        x, w: sw, wall: st.walls[h % st.walls.length], trim: st.trim[(h >> 3) % st.trim.length], roof: st.roofs[(h >> 6) % st.roofs.length],
        shutter: st.shutter[(h >> 9) % st.shutter.length], timber: ((h >> 12) % 100) / 100 < st.timber,
        gable: sw <= 3 && (h >> 14) % 3 === 0, drop: ((h >> 16) % 3) * 6, extra: Math.min(2, Math.max(0, st.storeys - 1 + ((h >> 18) % 3 === 0 ? 1 : 0) + (roofRows >= 3 ? 1 : 0) - (sw === n && n > 5 ? 1 : 0))),
        balcony: (h >> 20) % 4 === 0, chimney: (h >> 22) % 3 === 0, dormer: sw >= 3 && (h >> 24) % 2 === 0, k
      });
      x += sw; k++;
    }
    return segs;
  },
  // the sprite: everything above the ground-floor row, plus a little above the footprint
  sprite(b, st) {
    const key = b.id + (st.snow ? 's' : '');
    if (this.C[key]) return this.C[key];
    const wpx = (b.x1 - b.x0 + 1) * TS, rr = b.wall - b.top;
    const OV = 40, SH = rr * TS + OV, PAD = 6;
    const [c, x] = mkCanvas(wpx + PAD * 2, SH);
    const meta = { wins: [], smoke: [], ridges: [], OV, PAD, SH };
    const R = (a, bb, ww, hh, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(bb), Math.round(ww), Math.round(hh)); };
    const r = rng(hash2(b.x0, b.top) + 3);
    // draw eave-roofed segments first, gabled fronts on top
    const order = b.segs.slice().sort((p, q) => (p.gable ? 1 : 0) - (q.gable ? 1 : 0));
    for (const s of order) {
      const sx = PAD + s.x * TS, sw = s.w * TS;
      const roofH = s.gable ? 30 + s.w * 4 : (st.thatch ? 46 : 40) + (rr >= 3 ? 6 : 0);
      const wallH = Math.max(30, SH - roofH - s.drop - (2 - Math.min(2, s.extra)) * 0);
      const storeys = Math.max(1, Math.min(4, Math.round(wallH / 34)));
      const sh = wallH / storeys, wallTop = SH - wallH;
      // the walls
      R(sx, wallTop, sw, wallH, s.wall);
      R(sx, wallTop, sw, 6, shade(s.wall, -0.18));                       // shade under the eaves
      for (let i = 0; i < wallH; i += 3) if (r() < 0.25) R(sx + r() * sw, wallTop + i, 2, 1, shade(s.wall, -0.05));
      if (st.stone && !s.timber) {
        for (let yy = wallTop + 8; yy < SH; yy += 8) for (let xx = sx + ((yy / 8) % 2) * 6; xx < sx + sw; xx += 12) R(xx, yy, 1, 7, shade(s.wall, -0.07));
        for (let yy = wallTop + 2; yy < SH; yy += 8) R(sx, yy, 4 + ((yy / 8) % 2) * 2, 6, shade(s.wall, 0.08));
        for (let yy = wallTop + 2; yy < SH; yy += 8) R(sx + sw - 4 - ((yy / 8) % 2) * 2, yy, 4 + ((yy / 8) % 2) * 2, 6, shade(s.wall, 0.08));
      }
      // storey lines, timber framing
      for (let f = 0; f < storeys; f++) {
        const fy = wallTop + f * sh;
        if (f > 0) { R(sx, fy - 1, sw, 3, s.timber ? s.trim : shade(s.wall, -0.15)); R(sx, fy + 2, sw, 1, shade(s.wall, 0.12)); }
        if (s.timber) {
          for (let xx = 0; xx <= s.w; xx++) R(sx + Math.min(sw - 3, xx * TS - (xx ? 1 : 0)), fy, 3, sh, s.trim);
          for (let xx = 0; xx < s.w; xx++) if ((xx + f + s.k) % 2 === 0) {
            x.strokeStyle = s.trim; x.lineWidth = 2; x.beginPath();
            x.moveTo(sx + xx * TS + 3, fy + sh - 2); x.lineTo(sx + xx * TS + 9, fy + 3);
            x.moveTo(sx + xx * TS + TS - 3, fy + sh - 2); x.lineTo(sx + xx * TS + TS - 9, fy + 3); x.stroke();
          }
        }
      }
      R(sx, wallTop, 2, wallH, shade(s.wall, -0.22)); R(sx + sw - 2, wallTop, 2, wallH, shade(s.wall, -0.12));
      // windows on every floor
      for (let f = 0; f < storeys; f++) {
        const fy = wallTop + f * sh;
        for (let col = 0; col < s.w; col++) {
          const hh = hash2(b.x0 + s.x + col, b.top * 7 + f + 3);
          if (hh % 9 === 0) continue;
          const ww = st.stone ? 10 : 12, wh = Math.min(sh - 10, st.stone ? 16 : 12), wx = sx + col * TS + (TS - ww) / 2, wy = fy + (sh - wh) / 2 + 1;
          const arched = st === this.STYLE.city && f === 0;
          R(wx - 2, wy - 2, ww + 4, wh + 4, s.trim);
          R(wx, wy, ww, wh, '#2a3a5a'); R(wx, wy, ww, 2, '#4a6a9a'); R(wx + 1, wy + 1, 3, wh * 0.45, 'rgba(200,225,255,.55)');
          R(wx + ww / 2 - 1, wy, 2, wh, s.trim); if (wh > 12) R(wx, wy + wh / 2 - 1, ww, 2, s.trim);
          if (arched) { x.fillStyle = s.trim; x.beginPath(); x.arc(wx + ww / 2, wy, ww / 2 + 2, Math.PI, 0); x.fill(); x.fillStyle = '#2a3a5a'; x.beginPath(); x.arc(wx + ww / 2, wy, ww / 2, Math.PI, 0); x.fill(); }
          meta.wins.push([wx, wy, ww, wh, hh]);
          // shutters / sills / flower boxes / a balcony
          if (!st.stone || hh % 3 === 0) { R(wx - 7, wy - 1, 4, wh + 2, s.shutter); R(wx + ww + 3, wy - 1, 4, wh + 2, s.shutter); R(wx - 6, wy + 2, 2, 1, shade(s.shutter, 0.25)); R(wx + ww + 4, wy + 2, 2, 1, shade(s.shutter, 0.25)); }
          R(wx - 3, wy + wh + 2, ww + 6, 2, shade(s.trim, 0.15));
          if (hh % 4 === 1) { R(wx - 2, wy + wh + 3, ww + 4, 4, '#6a4024'); for (let i = 0; i < 5; i++) R(wx - 1 + i * (ww / 4), wy + wh + 1 - (i % 2), 3, 3, ['#e5534b', '#f2c94c', '#f28fad', '#ffffff', '#9a6ae8'][(hh + i) % 5]); R(wx - 2, wy + wh + 3, ww + 4, 1, '#2f7a34'); }
        }
        if (f === storeys - 1 && storeys > 1 && s.balcony && s.w >= 2) {
          const by = fy + sh - 4;
          R(sx + 4, by, sw - 8, 3, shade(s.trim, -0.1)); for (let xx = sx + 5; xx < sx + sw - 5; xx += 4) R(xx, by - 8, 1, 8, s.trim); R(sx + 4, by - 9, sw - 8, 2, s.trim);
          for (let i = 0; i < s.w * 2; i++) R(sx + 8 + i * 14, by - 5, 4, 4, ['#2f7a34', '#4a9a44'][i % 2]);
        }
      }
      // the roof
      if (!s.gable) {
        const rt = Math.max(0, wallTop - roofH), rx = sx - 4, rw = sw + 8;
        const base = s.roof;
        R(rx, rt, rw, roofH, shade(base, -0.1));
        if (st.thatch) {
          for (let yy = rt; yy < rt + roofH; yy += 3) for (let xx = rx; xx < rx + rw; xx += 2) R(xx, yy + (r() * 2 | 0), 1, 3 + (r() * 2 | 0), r() < 0.5 ? shade(base, 0.12) : shade(base, -0.18));
          x.fillStyle = shade(base, -0.35); x.beginPath(); x.ellipse(rx + rw / 2, rt + roofH, rw / 2 + 2, 5, 0, 0, Math.PI); x.fill();
        } else {
          for (let yy = rt + 4, row = 0; yy < rt + roofH - 2; yy += 6, row++) {
            const t = (yy - rt) / roofH, col = shade(base, 0.18 - t * 0.32);
            R(rx, yy, rw, 6, col);
            for (let xx = rx + (row % 2) * 4; xx < rx + rw; xx += 8) { R(xx, yy + 5, 7, 1, shade(col, -0.3)); R(xx + 7, yy, 1, 6, shade(col, -0.22)); R(xx + 1, yy + 1, 3, 1, shade(col, 0.2)); }
          }
        }
        R(rx, rt, rw, 4, shade(base, 0.3)); R(rx, rt + 3, rw, 1, shade(base, -0.3));        // ridge
        R(rx, rt + roofH - 3, rw, 3, shade(base, -0.45)); R(rx, rt + roofH, rw, 2, 'rgba(0,0,0,.25)');   // eave + its shadow
        if (st.snow) { R(rx - 1, rt, rw + 2, 9, '#f4f8ff'); for (let xx = rx; xx < rx + rw; xx += 5) R(xx, rt + 9, 3, 2 + (r() * 4 | 0), '#e8f0ff'); R(rx, rt + roofH - 5, rw, 2, '#e8f0ff'); for (let xx = rx + 2; xx < rx + rw; xx += 7) R(xx, rt + roofH - 2, 1, 3 + (r() * 3 | 0), 'rgba(220,240,255,.85)'); }
        meta.ridges.push([rx + 6, rx + rw - 10, rt]);
        // dormer windows
        if (s.dormer && roofH >= 38) for (let i = 0; i < Math.floor(s.w / 2); i++) {
          const dx = sx + 14 + i * 64, dy = rt + roofH - 26;
          R(dx - 1, dy - 1, 18, 18, shade(base, -0.4)); R(dx, dy + 4, 16, 13, s.wall); R(dx + 4, dy + 7, 8, 8, '#2a3a5a'); R(dx + 5, dy + 8, 2, 3, 'rgba(200,225,255,.6)');
          x.fillStyle = shade(base, 0.1); x.beginPath(); x.moveTo(dx - 3, dy + 5); x.lineTo(dx + 8, dy - 4); x.lineTo(dx + 19, dy + 5); x.fill();
          meta.wins.push([dx + 4, dy + 7, 8, 8, hash2(dx, dy)]);
        }
        if (s.chimney) {
          const cx = sx + sw - 18 - (s.k * 7) % 10, ch = 18, cy = rt - ch + 8;
          R(cx - 1, cy - 1, 12, ch + 1, '#2a1e1a'); R(cx, cy, 10, ch, '#8a4a3a'); R(cx, cy, 3, ch, '#a85a44');
          for (let i = 0; i < 3; i++) R(cx, cy + 4 + i * 5, 10, 1, '#6a3a2a');
          R(cx - 2, cy - 3, 14, 3, '#4a4040'); if (st.snow) R(cx - 2, cy - 5, 14, 3, '#f4f8ff');
          meta.smoke.push([cx + 5, cy - 3]);
        }
      } else {
        // a gable end facing the street
        const peak = Math.max(2, wallTop - roofH), mid = sx + sw / 2;
        x.fillStyle = s.wall; x.beginPath(); x.moveTo(sx, wallTop + 1); x.lineTo(mid, peak + 4); x.lineTo(sx + sw, wallTop + 1); x.fill();
        if (s.timber) { x.strokeStyle = s.trim; x.lineWidth = 3; x.beginPath(); x.moveTo(mid, peak + 6); x.lineTo(mid, wallTop); x.moveTo(sx + sw * 0.25, wallTop); x.lineTo(mid, peak + 14); x.lineTo(sx + sw * 0.75, wallTop); x.stroke(); }
        const aw = 8, ah = 9, ay = wallTop - roofH * 0.55;
        R(mid - aw / 2 - 2, ay - 2, aw + 4, ah + 4, s.trim); R(mid - aw / 2, ay, aw, ah, '#2a3a5a'); R(mid - aw / 2 + 1, ay + 1, 2, 3, 'rgba(200,225,255,.55)');
        meta.wins.push([mid - aw / 2, ay, aw, ah, hash2(mid, ay)]);
        // the two roof slopes as thick bargeboards with tiles
        const slope = (x0_, x1_) => { x.strokeStyle = shade(s.roof, -0.35); x.lineWidth = 9; x.beginPath(); x.moveTo(x0_, wallTop + 4); x.lineTo(mid, peak); x.lineTo(x1_, wallTop + 4); x.stroke(); x.strokeStyle = s.roof; x.lineWidth = 6; x.stroke(); x.strokeStyle = shade(s.roof, 0.3); x.lineWidth = 1; x.stroke(); };
        slope(sx - 5, sx + sw + 5);
        if (st.snow) { x.strokeStyle = '#f4f8ff'; x.lineWidth = 3; x.beginPath(); x.moveTo(sx - 4, wallTop); x.lineTo(mid, peak - 3); x.lineTo(sx + sw + 4, wallTop); x.stroke(); }
        R(mid - 2, peak - 6, 4, 6, s.trim);
      }
    }
    return (this.C[key] = { c, meta });
  },
  // the ground-floor row gets the same paint as the storeys above it
  groundFloor(w, b, st, camX, camY) {
    const gx = b.x0 * TS - camX, gy = b.wall * TS - camY;
    if (gx > W || gx + (b.x1 - b.x0 + 1) * TS < 0 || gy > H || gy < -TS) return;
    if (!b.gf) {
      const [gc, gcx] = mkCanvas((b.x1 - b.x0 + 1) * TS, TS); b.gf = gc;
      for (const s of b.segs) for (let i = 0; i < s.w; i++) {
        const tx = b.x0 + s.x + i, ch = w.tile(tx, b.wall), sx = (s.x + i) * TS, sy = 0;
        const R = (a, bb, ww, hh, col) => { gcx.fillStyle = col; gcx.fillRect(sx + a, sy + bb, ww, hh); };
        this.paintFloor(R, s, st, i, ch);
      }
    }
    ctx.drawImage(b.gf, gx, gy);
  },
  paintFloor(R, s, st, i, ch) {
    {
      R(0, 0, 32, 32, s.wall); R(0, 20, 32, 12, shade(s.wall, -0.08)); R(0, 0, 32, 2, shade(s.trim, 0.1));
      if (st.stone && !s.timber) { for (let yy = 4; yy < 32; yy += 8) for (let xx = (yy / 8 % 2) * 6; xx < 32; xx += 12) R(xx, yy, 1, 7, shade(s.wall, -0.07)); }
      if (s.timber || !st.stone) { R(0, 0, 3, 32, s.trim); R(29, 0, 3, 32, s.trim); }
      if (i === 0) R(0, 0, 2, 32, shade(s.wall, -0.25));
      R(0, 29, 32, 3, shade(s.trim, -0.25));
      if (ch === 'W') {
        R(8, 8, 16, 14, s.trim); R(10, 10, 12, 10, '#f2d88a'); R(10, 10, 5, 4, '#ffeebb'); R(15, 10, 2, 10, s.trim); R(10, 14, 12, 2, s.trim);
        R(3, 8, 4, 14, s.shutter); R(25, 8, 4, 14, s.shutter);
        R(7, 22, 18, 3, '#6a8a3a'); R(9, 21, 2, 2, '#e5534b'); R(18, 21, 2, 2, '#f2c94c'); R(13, 20, 2, 2, '#f28fad');
      } else {
        R(6, 4, 20, 28, '#3a2210'); R(8, 6, 16, 26, ch === 'E' ? '#8a5a30' : '#6a4020');
        R(8, 6, 16, 2, shade('#8a5a30', 0.2)); R(15, 6, 2, 26, '#4a2a10'); R(20, 18, 2, 3, '#f2c94c');
        if (ch === 'E') { R(11, 9, 3, 5, '#f2d88a'); R(18, 9, 3, 5, '#f2d88a'); }
        R(4, 2, 24, 3, s.trim); R(7, 30, 18, 2, '#8a8478');
      }
    }
  },
  ents(w, ents, camX, camY) {
    const d = this.get(w); if (!d.list.length) return;
    const st = this.styleFor(G.map, w.map);
    const night = typeof DN !== 'undefined' && DN.applies(w.map) ? DN.night() : 0, h = typeof DN !== 'undefined' ? DN.hour() : 12, late = h >= 22.5 || h < 5;
    this.lights = [];
    for (const b of d.list) {
      const sp = this.sprite(b, st), M = sp.meta;
      const sx = b.x0 * TS - camX - M.PAD, sy = b.wall * TS - camY - M.SH;
      if (sx > W || sx + sp.c.width < 0 || sy > H || sy + M.SH < -20) continue;
      for (const [a, c] of M.smoke) (Decor.smoke || (Decor.smoke = [])).push([sx + a, sy + c, b.x0 * 7 + b.top]);
      if (night > 0.05) for (const [wx, wy, ww, wh, hh] of M.wins) if (!(late && hh % 3)) this.lights.push([sx + wx + ww / 2, sy + wy + wh / 2, night]);
      const base = b.wall * TS - camY;
      ents.push({ y: base - 1, draw: () => {
        const a = Occlude.alpha(b.id, sx + M.PAD + 6, sy, sp.c.width - M.PAD * 2 - 12, M.SH, base, 0.55);
        ctx.globalAlpha = a; ctx.drawImage(sp.c, Math.round(sx), Math.round(sy));
        if (night > 0.05) for (const [wx, wy, ww, wh, hh] of M.wins) {
          if (late && hh % 3) continue;
          ctx.globalAlpha = a * night * 0.9; ctx.fillStyle = hh % 5 ? '#ffd890' : '#ffe8b0'; ctx.fillRect(Math.round(sx + wx), Math.round(sy + wy), ww, wh);
          ctx.fillStyle = '#fff4d0'; ctx.fillRect(Math.round(sx + wx), Math.round(sy + wy), Math.ceil(ww / 2) - 1, Math.ceil(wh / 2) - 1);
          if (hh % 11 === 0 && Math.sin(TIME * 0.25 + hh) > 0.4) { ctx.fillStyle = 'rgba(60,30,20,.6)'; ctx.fillRect(Math.round(sx + wx + ww / 2), Math.round(sy + wy + 3), 3, wh - 3); }
        }
        ctx.globalAlpha = 1;
        // pigeons on the ridge by day
        if (night < 0.5 && Detail.on(w) && !['rain', 'storm'].includes(Weather.kind)) for (const [r0, r1, ry] of M.ridges) {
          const hh = hash2(b.x0 + r0, b.top); if (hh % 3) continue;
          const bx = sx + r0 + hh % Math.max(1, r1 - r0), by = sy + ry - 3;
          const key = 'bp' + b.id + r0, S = Decor.birdState || (Decor.birdState = {}), s = S[key] || (S[key] = { gone: -1 });
          const p = w.player, pxx = (p.fx + (p.x - p.fx) * p.t) * TS - camX, pyy = (p.fy + (p.y - p.fy) * p.t) * TS - camY;
          const dist = Math.hypot(pxx - bx, pyy - by) / TS;
          if (s.gone < 0 && dist < 2.8) s.gone = TIME;
          if (s.gone >= 0 && TIME - s.gone > 25 && dist > 6) s.gone = -1;
          if (s.gone >= 0) { const t = TIME - s.gone; if (t < 3) Decor.pigeon(bx + (hh % 2 ? 1 : -1) * t * 90, by - t * 70, true, hh); }
          else Decor.pigeon(bx, by + (Math.sin(TIME * 1.4 + hh) > 0.7 ? 1 : 0), false, hh);
        }
      } });
    }
  }
};

// ---------------------------------------------------------------- hooks
(function () {
  const g0 = Detail.ground;
  Detail.ground = function (w, camX, camY, x0, y0) {
    g0.call(this, w, camX, camY, x0, y0);
    Occlude.frame();
    try { const d = Buildings.get(w); if (d.list.length) { const st = Buildings.styleFor(G.map, w.map); for (const b of d.list) Buildings.groundFloor(w, b, st, camX, camY); } } catch (e) { console.error(e); }
  };
  const e0 = Detail.ents;
  Detail.ents = function (w, ents, camX, camY, x0, y0) { e0.call(this, w, ents, camX, camY, x0, y0); try { Buildings.ents(w, ents, camX, camY); } catch (e) { console.error(e); } };
  const l0 = Detail.lights;
  Detail.lights = function (w, camX, camY) { l0.call(this, w, camX, camY); for (const [x, y, n] of Buildings.lights || []) FX.addLight(x, y, 20, 'rgba(255,190,110,1)', 0.42 * n); };
  const ld = WorldScene.prototype.load;
  WorldScene.prototype.load = function (...a) { Occlude.reset(); return ld.apply(this, a); };
})();
