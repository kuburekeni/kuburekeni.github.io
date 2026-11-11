// =====================================================================
//  decor.js : a world to get lost in
//   - props: barrels, crates, sacks, flowerpots, firewood, benches,
//     churns, nets and lobster pots by the sea, book stacks, globes,
//     spinning wheels, sleeping cats and dogs... set along house fronts
//     and in the corners of rooms. They're solid, and you can look at
//     every one of them. They're only ever put where nothing gets cut
//     off: every tile you could reach before, you can still reach.
//   - walls: paintings (each one different), clocks that tell the real
//     game time, shelves of crockery, herbs drying, wreaths, sconces
//     that light the room, antlers in the inns, banners in the halls;
//     lanterns beside doors outside that light up at dusk, ivy
//   - roofs: chimneys with smoke drifting on the wind, pigeons on the
//     ridges that scatter when you walk up
//   - tables: candles, mugs, bread, books, flowers, fruit
//   - life: butterflies in the meadows, townsfolk you overhear as you
//     pass ("Rain by supper, mark me.")
//   - light: buildings throw shadows that follow the sun; people and
//     animals are reflected in the water
// =====================================================================
const Decor = {
  maps: {}, C: {},
  H(x, y, k = 0) { return hash2(x * 11 + 977 + k * 131, y * 17 + 4421 + k * 53); },

  // ------------------------------------------------------------ what kind of place is this
  kindOf(id, m) {
    if (m.interior) {
      if (/inn|tavern|lodge/.test(id)) return 'inn';
      if (/shop|curio/.test(id)) return 'shop';
      if (/manor|palace|lib|chapel|long|ac_|aurel/.test(id)) return 'grand';
      return 'home';
    }
    if (/gull/.test(id)) return 'coast';
    if (/rime|frost/.test(id)) return 'snow';
    if (/mire|fen/.test(id)) return 'fen';
    if (/solmere|academy/.test(id)) return 'city';
    return 'town';
  },
  POOLS: {
    town: ['barrel', 'barrel', 'crates', 'sacks', 'pot', 'pot', 'firewood', 'bench', 'bucket', 'churns', 'barrow', 'broom'],
    city: ['pot', 'pot', 'bench', 'barrel', 'crates', 'pot', 'bucket'],
    coast: ['nets', 'lobster', 'rope', 'barrel', 'crates', 'anchor', 'pot', 'bench'],
    snow: ['snowbarrel', 'firewood', 'firewood', 'crates', 'sacks', 'bench', 'snowbarrel'],
    fen: ['barrel', 'sacks', 'nets', 'pot', 'firewood', 'bucket', 'crates'],
    inn: ['keg', 'barrel', 'crates', 'sacks', 'fern', 'basket', 'barrel'],
    shop: ['crates', 'sacks', 'basket', 'barrel', 'fern', 'basket'],
    home: ['fern', 'basket', 'books', 'spinning', 'fern', 'broom', 'basket'],
    grand: ['fern', 'globe', 'books', 'fern', 'books']
  },

  // ------------------------------------------------------------ placement
  get(w) {
    const id = G.map, c = this.maps[id];
    if (c && c.rows === w.rows) return c;
    return (this.maps[id] = this.build(w, id));
  },
  build(w, id) {
    const m = w.map, out = { rows: w.rows, props: new Map(), kind: this.kindOf(id, m) };
    if (id === 'overworld' || m.gates || m.tutorial || m.dark || m.noProps || m.theme === 'tokyo' || /^tk_|konbini/.test(id)) return out;
    const W_ = w.w, H_ = w.h;
    const pass = (x, y) => x >= 0 && y >= 0 && x < W_ && y < H_ && !SOLID.has(w.tile(x, y)) && !DOOR_TILES.has(w.tile(x, y)) && w.tile(x, y) !== '~' && !out.props.has(x + ',' + y);
    const res = new Set();
    const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) res.add((x + dx) + ',' + (y + dy)); };
    for (const n of m.npcs || []) mark(n.x, n.y, 1 + (n.wander || 0));
    for (const ch of m.chests || []) mark(ch.x, ch.y, 1);
    for (const p of m.pois || []) mark(p.x, p.y, 1);
    for (const wp of m.warps || []) for (let yy = wp.y; yy < wp.y + (wp.h || 1); yy++) for (let xx = wp.x; xx < wp.x + (wp.w || 1); xx++) mark(xx, yy, 2);
    for (const t of m.triggers || []) for (let yy = t.y; yy < t.y + (t.h || 1); yy++) for (let xx = t.x; xx < t.x + (t.w || 1); xx++) mark(xx, yy, 1);
    for (const k in m.signs || {}) { const [a, b] = k.split(',').map(Number); mark(a, b, 1); }
    for (const q of (G.quests || [])) { if (q.map === id && q.spots) for (const [a, b] of q.spots) mark(a, b, 1); if (q.map === id && q.pos) mark(q.pos[0], q.pos[1], 1); }
    // doors: keep the way in and out clear
    for (let y = 0; y < H_; y++) for (let x = 0; x < W_; x++) { const t = w.tile(x, y); if (DOOR_TILES.has(t) || t === 'E' || t === 'D') { mark(x, y, 1); res.add(x + ',' + (y + 2)); } }
    const st = m.interior && typeof Rooms !== 'undefined' ? Rooms.build(w) : null;
    if (st) for (let i = 0; i < st.w * st.h; i++) if (st.door[i]) mark(i % st.w, (i / st.w) | 0, 1);
    // solid neighbours must be plain walls / hedges, never anything you might want to use
    const PLAIN = m.interior ? new Set(['V', 'y', 'é', 'è', 'W']) : new Set(['W', 'R', '+', '[', '4', 'F', 'T', 'X', 'r', 'Ä', 'Ö']);
    const cands = [];
    for (let y = 1; y < H_ - 1; y++) for (let x = 1; x < W_ - 1; x++) {
      if (!pass(x, y) || res.has(x + ',' + y)) continue;
      const t = w.tile(x, y);
      if (m.interior ? !'om'.includes(t) : !'.,=:_sdjfä'.includes(t)) continue;
      let walls = 0, bad = false, front = false;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const n = w.tile(x + dx, y + dy);
        if (SOLID.has(n)) { if (PLAIN.has(n)) { walls++; if (dy === -1 && (n === 'W' || n === 'V' || n === 'y')) front = true; } else bad = true; }
        if (DOOR_TILES.has(n) || n === 'E' || n === 'D') bad = true;
      }
      if (bad || !walls) continue;
      // outside, things are only left by people: next to a building
      if (!m.interior && ![[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => 'WRED+['.includes(w.tile(x + dx, y + dy)))) continue;
      // outside: house fronts and gable ends only; inside: along the walls, corners first
      if (!m.interior && !front && walls < 1) continue;
      const score = this.H(x, y, 1) % 1000 + (walls >= 2 ? 400 : 0);
      cands.push([score, x, y, walls]);
    }
    cands.sort((a, b) => b[0] - a[0]);
    const cap = m.interior ? Math.min(12, Math.round(W_ * H_ / 26)) : Math.min(46, Math.round(cands.length * 0.3));
    const pool = this.POOLS[out.kind] || this.POOLS.town;
    // a vertex can go if its open neighbours can still reach one another without it
    const keepsWay = (x, y) => {
      const ns = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => pass(a, b));
      if (ns.length <= 1) return true;
      out.props.set(x + ',' + y, 1);
      const seen = new Set([ns[0].join(',')]), q = [ns[0]], want = new Set(ns.slice(1).map(p => p.join(',')));
      let found = 0, steps = 0;
      while (q.length && found < want.size && steps < 20000) {
        const [a, b] = q.shift(); steps++;
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          const k = (a + dx) + ',' + (b + dy);
          if (seen.has(k) || !pass(a + dx, b + dy)) continue;
          seen.add(k); q.push([a + dx, b + dy]); if (want.has(k)) found++;
        }
      }
      out.props.delete(x + ',' + y);
      return found === want.size;
    };
    let placed = 0;
    // pets first: a cat (or dog) asleep on the rug or by the hearth
    if (m.interior && (out.kind === 'home' || out.kind === 'inn') && this.H(W_, H_, 9) % 10 < 7) {
      const spots = [];
      for (let y = 1; y < H_ - 1; y++) for (let x = 1; x < W_ - 1; x++) {
        if (!pass(x, y) || res.has(x + ',' + y)) continue;
        const t = w.tile(x, y), near = [[0, -1], [1, 0], [-1, 0], [0, 1]].some(([dx, dy]) => 'zï'.includes(w.tile(x + dx, y + dy)));
        if ('âà'.includes(t) || near) spots.push([near ? 2 : 1, this.H(x, y, 4), x, y]);
      }
      spots.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
      for (const [, , x, y] of spots) if (keepsWay(x, y)) { out.props.set(x + ',' + y, { kind: this.H(x, y, 6) % 4 === 0 ? 'dog' : 'cat', v: this.H(x, y, 7) % 4 }); break; }
    }
    for (const [, x, y] of cands) {
      if (placed >= cap) break;
      if (out.props.has(x + ',' + y)) continue;
      // don't crowd: at most one neighbour prop
      let near = 0; for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (out.props.has((x + dx) + ',' + (y + dy))) near++;
      if (near > 1) continue;
      if (!m.interior && this.H(x, y, 2) % 100 > 55) continue;
      if (!keepsWay(x, y)) continue;
      const h = this.H(x, y, 3);
      out.props.set(x + ',' + y, { kind: pool[h % pool.length], v: (h >> 5) % 4 });
      placed++;
    }
    return out;
  },
  propAt(w, x, y) {
    if (!w.map || G.map === 'overworld') return null;
    const d = this.get(w), p = d.props.get(x + ',' + y);
    if (!p || p === 1) return null;
    if (w.player && w.player.x === x && w.player.y === y) return null;     // never trap you
    if (w.npcs && w.npcs.some(n => n.x === x && n.y === y)) return null;
    return p;
  },

  // ------------------------------------------------------------ sprites (32 x 48, standing on the bottom 32)
  S(key, fn) { if (this.C[key]) return this.C[key]; const [c, x] = mkCanvas(32, 48); fn(x, rng(key.length * 977 + key.charCodeAt(0) * 31 + (key.charCodeAt(key.length - 1) || 0))); return (this.C[key] = c); },
  prop(kind, v) {
    return this.S('p' + kind + v, (x, r) => {
      const R = (a, b, ww, hh, c) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
      const E = (cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, 7); x.fill(); };
      const ink = '#2a1c14', sh = 'rgba(0,0,0,.28)';
      const barrel = (cx, top, wd, ht, snow) => {
        E(cx, top + ht + 1, wd / 2 + 2, 3, sh);
        R(cx - wd / 2 - 1, top, wd + 2, ht + 1, ink);
        R(cx - wd / 2, top + 1, wd, ht - 1, '#8a5a30'); R(cx - wd / 2 + 2, top + 1, 3, ht - 1, '#a8743e'); R(cx + wd / 2 - 4, top + 1, 3, ht - 1, '#6a4020');
        for (const yy of [top + 4, top + ht - 5]) { R(cx - wd / 2, yy, wd, 2, '#4a4038'); R(cx - wd / 2, yy, wd, 1, '#7a7068'); }
        E(cx, top + 1, wd / 2, 3, '#6a4020'); E(cx, top + 1, wd / 2 - 2, 2, '#9a6a38');
        if (snow) { E(cx, top, wd / 2 + 1, 3.5, '#f4f8ff'); R(cx - 3, top - 2, 6, 2, '#ffffff'); R(cx + wd / 2 - 2, top + 2, 2, 4, '#e8f0ff'); }
      };
      switch (kind) {
        case 'barrel': barrel(16, 24, 18, 20); if (v % 2) { R(14, 22, 4, 3, '#c83a2a'); R(15, 21, 2, 1, '#6a8a3a'); } break;
        case 'snowbarrel': barrel(16, 24, 18, 20, true); break;
        case 'keg': { E(16, 46, 14, 3, sh); R(5, 36, 3, 10, '#4a2e18'); R(24, 36, 3, 10, '#4a2e18'); R(4, 26, 24, 14, ink); R(5, 27, 22, 12, '#8a5a30'); R(5, 27, 22, 3, '#a8743e'); R(9, 27, 2, 12, '#4a4038'); R(21, 27, 2, 12, '#4a4038'); E(5, 33, 3, 6, '#6a4020'); R(14, 36, 4, 4, '#c8a040'); R(15, 40, 2, 2, '#8a7020'); break; }
        case 'crates': {
          const box = (a, b, s, c1) => { R(a - 1, b - 1, s + 2, s + 2, ink); R(a, b, s, s, c1); R(a, b, s, 2, shade(c1, 0.2)); R(a, b + s - 2, s, 2, shade(c1, -0.25)); R(a + 2, b + 2, s - 4, 1, shade(c1, -0.2)); x.strokeStyle = shade(c1, -0.3); x.lineWidth = 2; x.beginPath(); x.moveTo(a + 2, b + 2); x.lineTo(a + s - 2, b + s - 2); x.stroke(); };
          R(3, 44, 27, 3, sh); box(4, 30, 15, '#b08048'); box(17, 33, 12, '#a07040'); if (v % 2) box(8, 18, 12, '#c09058');
          if (v === 2) { R(6, 33, 9, 3, '#e8dcc0'); R(7, 34, 5, 1, '#6a4a3a'); }
          break;
        }
        case 'sacks': {
          R(3, 44, 27, 3, sh);
          const sack = (cx, cy, s, c1) => { E(cx, cy, s * 0.62, s * 0.55, ink); E(cx, cy, s * 0.58, s * 0.5, c1); E(cx - 2, cy - 3, s * 0.3, s * 0.22, shade(c1, 0.18)); R(cx - 2, cy - s * 0.55 - 2, 4, 4, shade(c1, -0.2)); R(cx - 3, cy - s * 0.55 + 1, 6, 1, '#6a4a2a'); };
          sack(10, 37, 15, '#d8c8a0'); sack(22, 38, 13, '#c8b890'); if (v % 2) { R(9, 34, 3, 3, '#e0d0a0'); R(18, 35, 6, 2, '#a83a2a'); }
          break;
        }
        case 'pot': {
          const fl = [['#e5534b', '#ff8a7a'], ['#f2c94c', '#fff0a0'], ['#9a6ae8', '#c8a8ff'], ['#ffffff', '#ffe8f0']][v];
          R(7, 44, 19, 3, sh); R(8, 33, 16, 12, ink); R(9, 34, 14, 10, '#b8603a'); R(9, 34, 14, 2, '#d8804a'); R(9, 41, 14, 3, '#8a4024'); R(7, 32, 18, 3, '#c86a40');
          for (let i = 0; i < 7; i++) { const a = -2.8 + i * 0.45, len = 8 + (i % 3) * 2; x.strokeStyle = i % 2 ? '#2f7a34' : '#1f5a28'; x.lineWidth = 2; x.beginPath(); x.moveTo(16, 33); x.lineTo(16 + Math.cos(a) * len, 31 + Math.sin(a) * len); x.stroke(); }
          for (let i = 0; i < 6; i++) { const a = 6 + r() * 20, b = 18 + r() * 10; E(a, b, 2.4, 2.4, fl[0]); R(Math.round(a) - 1, Math.round(b) - 1, 1, 1, fl[1]); R(Math.round(a), Math.round(b), 1, 1, '#ffd84a'); }
          break;
        }
        case 'firewood': {
          R(2, 44, 29, 3, sh);
          for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
            const cx = 7 + i * 6 + row * 3, cy = 40 - row * 6;
            E(cx, cy, 3.6, 3.4, '#4a2e18'); E(cx, cy, 2.8, 2.6, '#c89a60'); E(cx, cy, 1.2, 1.1, '#a87a48');
          }
          if (v % 2) { R(26, 26, 2, 18, '#6a4020'); R(22, 22, 9, 5, '#8a8a90'); R(22, 22, 9, 1, '#c8c8d0'); }
          break;
        }
        case 'bench': { R(1, 44, 31, 3, sh); R(3, 36, 3, 9, '#4a2e18'); R(26, 36, 3, 9, '#4a2e18'); R(1, 33, 30, 5, ink); R(2, 34, 28, 3, '#9a6a38'); R(2, 34, 28, 1, '#c08a50'); R(2, 26, 28, 3, '#8a5a30'); R(3, 26, 2, 8, '#6a4020'); R(27, 26, 2, 8, '#6a4020'); if (v === 3) { E(22, 31, 4, 2.5, '#d8a040'); } break; }
        case 'bucket': { E(16, 45, 9, 2.5, sh); R(9, 33, 14, 12, ink); R(10, 34, 12, 10, '#8a5a30'); R(10, 36, 12, 2, '#5a5048'); R(10, 41, 12, 2, '#5a5048'); E(16, 34, 6, 2, '#3a6ab0'); R(13, 33, 4, 1, '#9ac8ff'); x.strokeStyle = '#4a4038'; x.lineWidth = 1; x.beginPath(); x.arc(16, 33, 7, Math.PI, 0); x.stroke(); break; }
        case 'churns': { R(4, 44, 25, 3, sh); for (const cx of [10, 22]) { R(cx - 5, 28, 10, 17, ink); R(cx - 4, 29, 8, 15, '#a8b0b8'); R(cx - 4, 29, 2, 15, '#d8e0e8'); R(cx - 4, 33, 8, 1, '#7a828a'); R(cx - 3, 25, 6, 4, '#8a929a'); R(cx - 2, 24, 4, 1, '#c8d0d8'); } break; }
        case 'barrow': { E(16, 45, 13, 2.5, sh); R(4, 32, 20, 9, ink); R(5, 33, 18, 7, '#8a5a30'); R(5, 33, 18, 2, '#a8743e'); E(24, 41, 4, 4, '#3a2a1a'); E(24, 41, 2, 2, '#8a6a4a'); R(1, 36, 6, 2, '#6a4020'); R(4, 40, 2, 6, '#6a4020'); for (let i = 0; i < 4; i++) E(9 + i * 4, 32, 2.6, 2.4, i % 2 ? '#c8a050' : '#7aa848'); break; }
        case 'broom': { R(12, 44, 14, 2, sh); R(17, 12, 2, 28, '#8a6a40'); R(18, 12, 1, 28, '#b08a58'); x.fillStyle = '#c8a050'; x.beginPath(); x.moveTo(14, 38); x.lineTo(22, 38); x.lineTo(24, 46); x.lineTo(12, 46); x.fill(); R(14, 38, 8, 2, '#8a4a2a'); if (v % 2) { R(4, 36, 9, 9, ink); R(5, 37, 7, 7, '#8a5a30'); R(5, 39, 7, 1, '#5a5048'); } break; }
        case 'nets': { E(16, 44, 14, 3, sh); x.fillStyle = '#6a7a6a'; x.beginPath(); x.ellipse(16, 38, 13, 7, 0, 0, 7); x.fill(); x.strokeStyle = '#3a4a3a'; x.lineWidth = 1; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(4 + i * 3.4, 32); x.lineTo(8 + i * 2.8, 45); x.stroke(); } for (let i = 0; i < 4; i++) { E(7 + i * 6, 34 + (i % 2) * 5, 2.2, 2.2, i % 2 ? '#e8a030' : '#e5534b'); } break; }
        case 'lobster': { E(16, 45, 13, 2.5, sh); R(3, 28, 26, 17, ink); R(4, 29, 24, 15, '#8a6a40'); for (let i = 0; i < 6; i++) R(5 + i * 4, 29, 1, 15, '#4a3a20'); R(4, 33, 24, 1, '#4a3a20'); R(4, 38, 24, 1, '#4a3a20'); x.fillStyle = '#c84a2a'; x.beginPath(); x.ellipse(16, 38, 4, 2.5, 0, 0, 7); x.fill(); break; }
        case 'rope': { E(16, 44, 12, 3, sh); for (let i = 0; i < 4; i++) { x.strokeStyle = i % 2 ? '#c8a060' : '#a8804a'; x.lineWidth = 3; x.beginPath(); x.ellipse(16, 39 - i * 1.5, 11 - i * 2, 5 - i, 0, 0, 7); x.stroke(); } R(25, 37, 6, 2, '#a8804a'); break; }
        case 'anchor': { R(6, 44, 22, 3, sh); x.strokeStyle = '#4a4a52'; x.lineWidth = 4; x.beginPath(); x.moveTo(16, 18); x.lineTo(16, 42); x.moveTo(9, 24); x.lineTo(23, 24); x.stroke(); x.beginPath(); x.arc(16, 34, 9, 0.2, Math.PI - 0.2); x.stroke(); x.strokeStyle = '#7a7a84'; x.lineWidth = 1; x.beginPath(); x.moveTo(15, 18); x.lineTo(15, 41); x.stroke(); x.strokeStyle = '#4a4a52'; x.lineWidth = 2; x.beginPath(); x.arc(16, 15, 3, 0, 7); x.stroke(); break; }
        case 'fern': {
          R(8, 44, 17, 3, sh); R(9, 34, 14, 11, ink); R(10, 35, 12, 9, v % 2 ? '#3a6aa8' : '#b8603a'); R(10, 35, 12, 2, v % 2 ? '#5a8ac8' : '#d8804a');
          const leaf = ['#1f5a28', '#2f7a34', '#4a9a44', '#7ac860'];
          for (let i = 0; i < 11; i++) { const a = -3.0 + i * 0.3 + (r() - 0.5) * 0.2, len = 12 + r() * 8; const ex = 16 + Math.cos(a) * len, ey = 32 + Math.sin(a) * len * 0.9; x.strokeStyle = leaf[i % 2]; x.lineWidth = 2; x.beginPath(); x.moveTo(16, 34); x.quadraticCurveTo(16 + Math.cos(a) * len * 0.4, 30 + Math.sin(a) * len * 0.3 - 6, ex, ey); x.stroke(); for (let k = 0.4; k < 1; k += 0.2) R(Math.round(16 + (ex - 16) * k), Math.round(34 + (ey - 34) * k) - 1, 2, 1, leaf[3 - (i % 2)]); }
          break;
        }
        case 'basket': {
          E(16, 45, 12, 2.5, sh); R(5, 34, 22, 11, ink); R(6, 35, 20, 9, '#c89a50');
          for (let i = 0; i < 5; i++) R(6 + i * 4, 35, 2, 9, '#a87a38'); R(6, 38, 20, 1, '#a87a38'); R(6, 41, 20, 1, '#a87a38');
          const food = [['#d8303a', '#ff7a6a'], ['#e8b040', '#ffe090'], ['#7ab848', '#b8e880'], ['#c87a3a', '#e8a860']][v];
          for (let i = 0; i < 5; i++) { const a = 9 + i * 3.5, b = 33 - (i % 2) * 2; E(a, b, 2.8, 2.6, food[0]); R(Math.round(a) - 1, Math.round(b) - 2, 1, 1, food[1]); }
          x.strokeStyle = '#a87a38'; x.lineWidth = 2; x.beginPath(); x.arc(16, 34, 9, Math.PI, 0); x.stroke();
          break;
        }
        case 'books': {
          R(5, 44, 22, 3, sh);
          const cols = ['#8a2a2a', '#2a4a8a', '#2a6a3a', '#6a3a7a', '#a8742a', '#3a3a4a'];
          let yy = 44; for (let i = 0; i < 5 + v % 2; i++) { const wd = 16 + (this.H(i, v) % 6), xx = 6 + (this.H(v, i) % 5), c = cols[(i + v) % 6]; yy -= 4; R(xx, yy, wd, 4, ink); R(xx + 1, yy + 1, wd - 2, 2, c); R(xx + wd - 3, yy + 1, 2, 2, '#e8dcc0'); }
          if (v === 2) { R(18, yy - 3, 5, 3, '#f2c94c'); R(20, yy - 9, 1, 6, '#e8e0d0'); }
          break;
        }
        case 'globe': { R(8, 44, 17, 3, sh); R(14, 34, 4, 10, '#6a4020'); R(9, 42, 14, 3, '#4a2e18'); E(16, 25, 9, 9, ink); E(16, 25, 8, 8, '#3a6ab0'); x.fillStyle = '#5a9a4a'; x.beginPath(); x.ellipse(13, 23, 3.4, 4.5, 0.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(20, 28, 2.6, 2.2, 0, 0, 7); x.fill(); R(11, 20, 3, 1, '#a8d8ff'); x.strokeStyle = '#c8a040'; x.lineWidth = 1.5; x.beginPath(); x.arc(16, 25, 10, -1.9, 1.9); x.stroke(); break; }
        case 'spinning': { E(16, 45, 13, 2.5, sh); R(4, 38, 22, 3, '#6a4020'); R(6, 40, 2, 6, '#4a2e18'); R(22, 40, 2, 6, '#4a2e18'); x.strokeStyle = '#8a5a30'; x.lineWidth = 2; x.beginPath(); x.arc(20, 28, 9, 0, 7); x.stroke(); x.lineWidth = 1; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(20, 28); x.lineTo(20 + Math.cos(i) * 9, 28 + Math.sin(i) * 9); x.stroke(); } R(19, 27, 3, 3, '#4a2e18'); R(6, 28, 2, 11, '#8a5a30'); E(7, 27, 3, 4, '#e8dcc0'); break; }
      }
    });
  },
  // pets are drawn live so they breathe
  pet(kind, v, sx, sy) {
    const br = Math.sin(TIME * 2.2 + v) * 0.8, tail = Math.sin(TIME * 0.9 + v * 2);
    const col = kind === 'cat' ? [['#e8a050', '#c87a30', '#fff0d8'], ['#3a3438', '#1e1a1e', '#8a8088'], ['#c8c0b8', '#8a8078', '#ffffff'], ['#8a6a4a', '#5a4030', '#e8d8c0']][v] : [['#c89a60', '#8a6a40', '#f0e0c0'], ['#3a3430', '#1a1614', '#c8b8a0'], ['#e8e0d0', '#b8a890', '#ffffff'], ['#8a5a30', '#5a3a1a', '#e8c890']][v];
    const cx = sx + 16, cy = sy + 22;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, cy + 6, kind === 'cat' ? 11 : 13, 3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col[1]; ctx.beginPath(); ctx.ellipse(cx, cy, (kind === 'cat' ? 10 : 12) + br * 0.3, 6 + br * 0.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col[0]; ctx.beginPath(); ctx.ellipse(cx - 1, cy - 1, (kind === 'cat' ? 9 : 11) + br * 0.3, 5 + br * 0.4, 0, 0, 7); ctx.fill();
    // head tucked in
    const hx = cx - (kind === 'cat' ? 8 : 10), hy = cy - 2;
    ctx.fillStyle = col[0]; ctx.beginPath(); ctx.ellipse(hx, hy, 5, 4, 0, 0, 7); ctx.fill();
    if (kind === 'cat') { ctx.fillStyle = col[0]; ctx.fillRect(hx - 4, hy - 6, 2, 3); ctx.fillRect(hx + 1, hy - 6, 2, 3); ctx.fillStyle = '#e8a0a0'; ctx.fillRect(hx - 3, hy - 5, 1, 1); }
    else { ctx.fillStyle = col[1]; ctx.fillRect(hx - 5, hy - 3, 3, 6); ctx.fillStyle = '#1a1414'; ctx.fillRect(hx - 6, hy + 1, 2, 2); }
    ctx.fillStyle = '#1a1414'; ctx.fillRect(hx - 2, hy, 2, 1); ctx.fillRect(hx + 1, hy, 2, 1);
    // tail
    ctx.strokeStyle = col[1]; ctx.lineWidth = kind === 'cat' ? 3 : 4; ctx.beginPath(); ctx.moveTo(cx + 8, cy + 2); ctx.quadraticCurveTo(cx + 14, cy + 2 + tail * 3, cx + 8 + tail * 3, cy + 7); ctx.stroke();
    ctx.fillStyle = col[2]; ctx.fillRect(cx - 3, cy - 4, 5, 1);
    // zzz
    const zt = (TIME * 0.6 + v) % 3;
    if (zt < 1.6) { ctx.globalAlpha = Math.sin(zt / 1.6 * Math.PI) * 0.8; text('z', hx + 4 + zt * 4, hy - 14 - zt * 6, '#e8f0ff', 10); ctx.globalAlpha = 1; }
  },

  // wall pieces (32 x 32, painted onto a wall face)
  wall(kind, v, seed) {
    return this.S('w' + kind + v + '_' + (seed % 7), (x, r) => {
      const R = (a, b, ww, hh, c) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
      const E = (cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
      switch (kind) {
        case 'painting': {
          const fr = ['#c8a040', '#6a4020', '#3a2a1a', '#a8a8b0'][v];
          R(5, 6, 22, 17, 'rgba(0,0,0,.25)'); R(4, 4, 24, 18, fr); R(5, 5, 22, 16, shade(fr, 0.25)); R(6, 6, 20, 14, '#1a1414');
          const sub = seed % 5;
          if (sub === 0) { // hills
            const g = x.createLinearGradient(0, 6, 0, 20); g.addColorStop(0, '#8ac8f0'); g.addColorStop(1, '#f0e0b0'); x.fillStyle = g; x.fillRect(6, 6, 20, 14);
            E(19, 10, 2, 2, '#fff0a0'); x.fillStyle = '#5a9a4a'; x.beginPath(); x.moveTo(6, 16); x.quadraticCurveTo(12, 11, 18, 15); x.quadraticCurveTo(22, 13, 26, 15); x.lineTo(26, 20); x.lineTo(6, 20); x.fill(); R(6, 18, 20, 2, '#3a7a3a');
          } else if (sub === 1) { // the sea
            R(6, 6, 20, 7, '#c8d8e8'); R(6, 13, 20, 7, '#3a6a9a'); R(8, 14, 6, 1, '#8ac0e8'); R(16, 16, 5, 1, '#8ac0e8'); R(17, 9, 1, 4, '#3a2a1a'); x.fillStyle = '#f4f0e0'; x.beginPath(); x.moveTo(18, 9); x.lineTo(22, 12); x.lineTo(18, 12); x.fill();
          } else if (sub === 2) { // a portrait
            R(6, 6, 20, 14, ['#3a2a4a', '#2a3a3a', '#4a2a2a'][seed % 3]); E(16, 12, 3.5, 4, '#c89070'); R(11, 15, 10, 5, ['#6a2a2a', '#2a3a6a', '#2a5a3a'][seed % 3]); R(13, 8, 7, 3, ['#3a2a1a', '#d8c8a0', '#1a1414'][seed % 3]); R(15, 12, 1, 1, '#1a1414'); R(17, 12, 1, 1, '#1a1414');
          } else if (sub === 3) { // still life
            R(6, 6, 20, 14, '#4a3a2a'); R(6, 17, 20, 3, '#6a4a2a'); E(12, 15, 3, 3, '#d8303a'); E(17, 15, 3, 3, '#e8b040'); R(20, 9, 3, 8, '#5a8aa8'); R(20, 9, 3, 1, '#a8d8f0');
          } else { // night forest
            R(6, 6, 20, 14, '#1c2448'); E(21, 9, 2, 2, '#f0f0d0'); for (let i = 0; i < 4; i++) { x.fillStyle = '#0e1a20'; x.beginPath(); x.moveTo(8 + i * 5, 20); x.lineTo(10 + i * 5, 11 + (i % 2) * 2); x.lineTo(12 + i * 5, 20); x.fill(); } R(7, 8, 1, 1, '#fff'); R(13, 7, 1, 1, '#fff');
          }
          R(4, 4, 24, 1, shade(fr, 0.45));
          break;
        }
        case 'shelf': {
          R(3, 14, 26, 3, '#6a4020'); R(3, 14, 26, 1, '#8a5a30'); R(5, 17, 2, 4, '#4a2e18'); R(25, 17, 2, 4, '#4a2e18');
          const items = v % 2 ? 'plates' : 'jars';
          if (items === 'plates') for (let i = 0; i < 4; i++) { E(7 + i * 6, 9, 3, 4.6, '#e8e4dc'); E(7 + i * 6, 9, 1.8, 3, i % 2 ? '#3a6ab0' : '#c8503a'); }
          else for (let i = 0; i < 5; i++) { const c = ['#a83a2a', '#e8b040', '#5a8a3a', '#8a6ab8', '#c87a3a'][(i + seed) % 5]; R(4 + i * 5, 7 + (i % 2) * 2, 4, 7 - (i % 2) * 2, '#d8e8f0'); R(4 + i * 5, 9 + (i % 2) * 2, 4, 5 - (i % 2) * 2, c); R(4 + i * 5, 6 + (i % 2) * 2, 4, 1, '#8a6a40'); }
          break;
        }
        case 'herbs': { R(3, 5, 26, 2, '#6a4020'); for (let i = 0; i < 4; i++) { const cx = 6 + i * 7, c = ['#5a8a3a', '#8a9a4a', '#6a7a3a', '#9a6aa8'][(i + seed) % 4]; R(cx, 7, 1, 3, '#c8a060'); x.fillStyle = c; x.beginPath(); x.moveTo(cx - 3, 10); x.lineTo(cx + 3, 10); x.lineTo(cx + 1, 20); x.lineTo(cx - 1, 20); x.fill(); R(cx - 2, 11, 1, 6, shade(c, 0.25)); } break; }
        case 'wreath': { x.strokeStyle = '#2f6a34'; x.lineWidth = 5; x.beginPath(); x.arc(16, 14, 7, 0, 7); x.stroke(); for (let i = 0; i < 10; i++) { const a = i * 0.63; R(Math.round(16 + Math.cos(a) * 7) - 1, Math.round(14 + Math.sin(a) * 7) - 1, 2, 2, i % 3 ? '#4a9a44' : '#d8303a'); } R(14, 20, 4, 3, '#c8303a'); R(13, 22, 2, 4, '#c8303a'); R(17, 22, 2, 4, '#c8303a'); break; }
        case 'antlers': { R(12, 12, 8, 9, '#6a4020'); R(13, 13, 6, 7, '#8a5a30'); x.strokeStyle = '#e8dcc0'; x.lineWidth = 2; x.beginPath(); x.moveTo(14, 13); x.quadraticCurveTo(6, 10, 5, 2); x.moveTo(9, 9); x.lineTo(7, 4); x.moveTo(18, 13); x.quadraticCurveTo(26, 10, 27, 2); x.moveTo(23, 9); x.lineTo(25, 4); x.stroke(); break; }
        case 'shield': { x.strokeStyle = '#a8a8b0'; x.lineWidth = 2; x.beginPath(); x.moveTo(4, 4); x.lineTo(28, 26); x.moveTo(28, 4); x.lineTo(4, 26); x.stroke(); R(3, 3, 3, 3, '#c8a040'); R(26, 3, 3, 3, '#c8a040'); x.fillStyle = '#1a1414'; x.beginPath(); x.moveTo(9, 6); x.lineTo(23, 6); x.lineTo(23, 15); x.lineTo(16, 24); x.lineTo(9, 15); x.fill(); x.fillStyle = v % 2 ? '#2e4fa8' : '#a83a2a'; x.beginPath(); x.moveTo(10, 7); x.lineTo(22, 7); x.lineTo(22, 15); x.lineTo(16, 22); x.lineTo(10, 15); x.fill(); R(15, 8, 2, 12, '#f2c94c'); R(11, 12, 10, 2, '#f2c94c'); break; }
        case 'banner': { R(5, 2, 22, 2, '#6a4020'); const c = ['#2e4fa8', '#a83a2a', '#2a6a3a', '#6a3a7a'][v]; x.fillStyle = c; x.beginPath(); x.moveTo(7, 4); x.lineTo(25, 4); x.lineTo(25, 26); x.lineTo(16, 21); x.lineTo(7, 26); x.fill(); R(7, 4, 2, 20, shade(c, 0.2)); R(14, 9, 4, 6, '#f2c94c'); R(12, 11, 8, 2, '#f2c94c'); break; }
        case 'map': { R(4, 5, 24, 17, '#c8b080'); R(5, 6, 22, 15, '#e8d8b0'); x.strokeStyle = '#8a6a40'; x.lineWidth = 1; x.beginPath(); x.moveTo(7, 14); x.quadraticCurveTo(12, 9, 16, 13); x.quadraticCurveTo(20, 17, 25, 11); x.stroke(); R(9, 16, 4, 3, '#7aa868'); R(19, 8, 3, 3, '#6a8ab8'); R(15, 15, 2, 2, '#c8303a'); R(4, 5, 2, 2, '#a83a2a'); R(26, 5, 2, 2, '#a83a2a'); break; }
        case 'notes': { R(4, 4, 24, 20, '#8a5a30'); R(5, 5, 22, 18, '#a8743e'); for (let i = 0; i < 4; i++) { const a = 6 + (i % 2) * 10, b = 6 + Math.floor(i / 2) * 8; R(a, b, 9, 7, '#f0e8d0'); R(a + 1, b + 2, 6, 1, '#8a8070'); R(a + 1, b + 4, 5, 1, '#8a8070'); R(a + 4, b, 1, 1, '#c8303a'); } break; }
        case 'sampler': { R(6, 5, 20, 18, '#6a4020'); R(7, 6, 18, 16, '#f0e8d8'); for (let i = 0; i < 3; i++) R(9, 8 + i * 4, 14, 2, ['#c8303a', '#3a6ab0', '#3a8a3a'][i]); R(14, 19, 4, 2, '#c8303a'); break; }
        case 'mugs': { R(3, 14, 26, 3, '#6a4020'); R(3, 14, 26, 1, '#8a5a30'); for (let i = 0; i < 5; i++) { R(4 + i * 5, 8, 4, 6, i % 2 ? '#c8a060' : '#8a8a92'); R(8 + i * 5, 9, 1, 3, '#5a5048'); R(4 + i * 5, 8, 4, 1, '#fff8e0'); } break; }
      }
    });
  },
  WALLS: {
    home: ['painting', 'painting', 'shelf', 'herbs', 'wreath', 'sampler', 'clock', 'sconce'],
    inn: ['antlers', 'sconce', 'mugs', 'painting', 'notes', 'sconce', 'shelf', 'clock'],
    shop: ['shelf', 'shelf', 'sconce', 'clock', 'notes', 'herbs'],
    grand: ['painting', 'banner', 'sconce', 'shield', 'map', 'painting', 'clock']
  },
  wallAt(w, tx, ty) {
    const m = w.map; if (!m.interior) return null;
    const ch = w.tile(tx, ty); if (ch !== 'V') return null;
    const below = w.tile(tx, ty + 1); if (SOLID.has(below) && !'ouxm'.includes(below)) return null;
    if (!below || below === 'V' || DOOR_TILES.has(below)) return null;
    if (w.tile(tx - 1, ty + 1) === 'x' || w.tile(tx + 1, ty + 1) === 'x' || below === 'x') return null;
    const h = this.H(tx, ty, 11); if (h % 100 > 34) return null;
    const pool = this.WALLS[this.kindOf(G.map, m)] || this.WALLS.home;
    return { kind: pool[(h >> 7) % pool.length], v: (h >> 4) % 4, seed: h >> 9 };
  },

  // ------------------------------------------------------------ words for things
  SAY: {
    barrel: ['A barrel. Something sloshes inside.', 'A rain barrel, half full. A water boatman skates across the top.', 'A barrel of apples, mostly. One of them is a potato.'],
    snowbarrel: ['A barrel wearing a hat of snow.', 'The barrel is frozen to the ground. So is the bucket next to it.'],
    keg: ['A keg on a cradle. The tap drips, patiently.'],
    crates: ['Crates, stencilled with the names of towns you haven\'t been to yet.', 'Stacked crates. Something inside one of them is ticking. Probably a clock.', 'A crate of straw-packed bottles.'],
    sacks: ['Sacks of grain, tied with twine.', 'A sack of onions. Your eyes water a little.', 'Flour sacks. There\'s a floury handprint on one.'],
    pot: ['Flowers in a clay pot. Somebody\'s pride and joy.', 'A potted geranium. A bee is very busy in it.', 'Flowers, deadheaded with care.'],
    firewood: ['Firewood, split and stacked against the winter.', 'A woodpile. A spider has made a very nice home in it.'],
    bench: ['A bench, worn smooth by a lot of sitting and a lot of talking.', 'Someone has carved initials into the bench. Two of them, inside a heart.'],
    bucket: ['A bucket of well water. Cold enough to make your teeth ache.'],
    churns: ['Milk churns, waiting for the cart.'],
    barrow: ['A wheelbarrow with a squeaky wheel. You can tell just by looking at it.'],
    broom: ['A broom, leaning where someone left it mid-sweep.'],
    nets: ['Fishing nets, drying. They smell exactly like you think.', 'Nets heaped with cork floats, waiting to be mended.'],
    lobster: ['A lobster pot. Empty, except for a very offended crab.'],
    rope: ['A coil of rope, tarred against the salt.'],
    anchor: ['An old anchor, rusted to the colour of a sunset.'],
    fern: ['A fern in a pot. It has been talked to, kindly, every day of its life.', 'A tall potted palm. A long way from wherever it grew up.'],
    basket: ['A basket of fruit. One of them has a bite out of it.', 'A basket of fresh bread. It\'s still warm.'],
    books: ['A stack of books: poetry, a treatise on goats, a romance with the cover torn off.', 'Books, piled up for later. Later never seems to come.'],
    globe: ['A globe. Aldmere is painted a little larger than it really is.'],
    spinning: ['A spinning wheel. A curl of wool waits on the distaff.'],
    cat: ['The cat opens one eye, decides you\'re not worth waking up for, and closes it again.', 'You scratch the cat behind the ears. It purrs like a little engine.', 'The cat stretches, rolls over, and offers its belly. It is a trap. You know it is a trap.'],
    dog: ['The dog\'s tail thumps the floor twice without the rest of it waking up.', 'The dog sighs the deep, contented sigh of a dog by a fire.'],
    painting: null, clock: null,
    shelf: ['Crockery, lined up neatly. One plate is chipped and has been turned to hide it.', 'Jars of preserves: plum, bramble, something labelled DO NOT.'],
    herbs: ['Herbs hung up to dry: sage, thyme, something that makes you sneeze.'],
    wreath: ['A wreath of holly and ribbon.'],
    antlers: ['A pair of antlers. The landlord swears he caught the stag with his bare hands.'],
    shield: ['A shield and crossed swords. Polished, never used.'],
    banner: ['A banner with the crest of the house.'],
    map: ['A map of Aldmere. Someone has drawn a little dragon in the empty bit.'],
    notes: ['Notices: LOST — ONE GOAT. FOR SALE — ONE GOAT. Hm.', 'A board of notes: lodgings, a lost glove, a poem nobody asked for.'],
    sampler: ['An embroidered sampler: HOME IS WHERE THE STEW IS.'],
    mugs: ['Tankards on a shelf, each with somebody\'s name scratched into it.'],
    sconce: ['A candle in an iron sconce. The flame leans towards the door.'],
    lantern: ['A lantern hung by the door, for whoever comes home late.'],
    chimney: null
  },
  PAINT: ['A painting of hills in spring, all soft green and yellow.', 'A painting of the sea, grey and gold, with one small boat in it.', 'A portrait of someone who looks like they disapprove of you specifically.', 'A still life: fruit, a jug, a knife. The fruit looks very good.', 'A painting of a forest at night. You can almost hear the owls.'],
  sayFor(d) {
    if (d.kind === 'painting') return this.PAINT[d.seed % 5];
    if (d.kind === 'clock') return `The clock ticks. It says ${DN.clockText()}.${DN.isNight() ? ' Late.' : ''}`;
    const l = this.SAY[d.kind]; return l ? l[(this.H(d.v, d.seed || 0) + Math.floor(TIME / 5)) % l.length] : null;
  }
};

// =====================================================================
//  hooks
// =====================================================================
(function () {
  const P = WorldScene.prototype;
  // props are solid
  const st0 = P.solidTile;
  P.solidTile = function (x, y) { if (st0.call(this, x, y)) return true; return !!Decor.propAt(this, x, y); };
  // ...and worth a look
  const ia0 = P.interact;
  P.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy;
    if (!this.npcAt(x, y) && !this.chestAt(x, y) && !this.followerAt(x, y)) {
      const pr = Decor.propAt(this, x, y);
      if (pr) { const line = Decor.sayFor(pr); if (line) { if (pr.kind === 'cat' || pr.kind === 'dog') Sound.sfx('chime'); this.run(() => say(null, line)); return; } }
      if (p.dir === 'up') {
        const wd = Decor.wallAt(this, x, y);
        if (wd) { const line = Decor.sayFor(wd); if (line) { this.run(() => say(null, line)); return; } }
      }
    }
    return ia0.call(this);
  };
  // never place on top of where you are on arrival
  const ld0 = P.load;
  P.load = function (...a) { const r = ld0.apply(this, a); try { Decor.get(this); } catch (e) { console.error(e); } return r; };

  // ------------------------------------------------------------ ground layer
  const g0 = Detail.ground;
  Detail.ground = function (w, camX, camY, x0, y0) {
    g0.call(this, w, camX, camY, x0, y0);
    try { Decor.ground(w, camX, camY, x0, y0); } catch (e) { console.error(e); }
  };
  const e0 = Detail.ents;
  Detail.ents = function (w, ents, camX, camY, x0, y0) {
    e0.call(this, w, ents, camX, camY, x0, y0);
    try { Decor.ents(w, ents, camX, camY, x0, y0); } catch (e) { console.error(e); }
  };
  const a0 = Detail.air;
  Detail.air = function (w, camX, camY) { a0.call(this, w, camX, camY); try { Decor.air(w, camX, camY); } catch (e) { console.error(e); } };
  const l0 = Detail.lights;
  Detail.lights = function (w, camX, camY) { l0.call(this, w, camX, camY); for (const [x, y, r, c, a] of Decor.glows || []) FX.addLight(x, y, r, c, a); };
  const p0 = Detail.post;
  Detail.post = function (w, camX, camY) { p0.call(this, w, camX, camY); try { Decor.post(w, camX, camY); } catch (e) { console.error(e); } };
})();

Object.assign(Decor, {
  TALLSH: new Set(['R', 'W', 'E', 'D', ']', '+', '[']),
  ground(w, camX, camY, x0, y0) {
    const m = w.map, x1 = x0 + Math.ceil(W / TS), y1 = y0 + Math.ceil(H / TS);
    const detail = Detail.on(w), out = !m.interior;
    this.glows = [];
    // building shadows, cast away from the sun
    const sun = out && detail ? w.sunPos() : null;
    if (sun) {
      const ox = Math.round(clamp((W / 2 - sun[0]) / W * 34, -22, 22)), oy = Math.round(clamp(10 + (150 - sun[1]) / 150 * -4 + 8, 6, 22));
      const n = typeof DN !== 'undefined' ? DN.day() : 1;
      ctx.fillStyle = `rgba(14,18,40,${0.22 * n})`;
      for (let ty = y0 - 1; ty <= y1; ty++) for (let tx = x0 - 1; tx <= x1; tx++) {
        if (!this.TALLSH.has(w.tile(tx, ty))) continue;
        const sx = tx * TS - camX + ox, sy = ty * TS - camY + oy;
        // split across the (up to) four tiles the offset square lands on, shading only open ground
        const ax = Math.floor((tx * TS + ox) / TS), ay = Math.floor((ty * TS + oy) / TS);
        for (let j = 0; j <= 1; j++) for (let i = 0; i <= 1; i++) {
          const gx = ax + i, gy = ay + j, t = w.tile(gx, gy);
          if (this.TALLSH.has(t) || SOLID.has(t) && t !== '~') continue;
          const rx0 = Math.max(sx, gx * TS - camX), ry0 = Math.max(sy, gy * TS - camY), rx1 = Math.min(sx + TS, (gx + 1) * TS - camX), ry1 = Math.min(sy + TS, (gy + 1) * TS - camY);
          if (rx1 > rx0 && ry1 > ry0) ctx.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
        }
      }
    }
    // reflections in the water
    if (out && detail && Gfx.flare) this.reflections(w, camX, camY);
    const night = typeof DN !== 'undefined' && DN.applies(m) ? DN.night() : (m.theme === 'night' ? 1 : 0);
    for (let ty = y0 - 1; ty <= y1 + 1; ty++) for (let tx = x0 - 1; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) continue;
      const ch = w.tile(tx, ty), sx = tx * TS - camX, sy = ty * TS - camY;
      if (m.interior) {
        const wd = this.wallAt(w, tx, ty);
        if (wd) {
          if (wd.kind === 'clock') this.drawClock(sx, sy);
          else if (wd.kind === 'sconce') { this.drawSconce(sx, sy, tx); this.glows.push([sx + 16, sy + 12, 70, 'rgba(255,190,110,1)', 0.55]); }
          else ctx.drawImage(this.wall(wd.kind, wd.v, wd.seed), sx, sy);
        }
        if (ch === 't' && detail) this.tableTop(tx, ty, sx, sy, night);
        continue;
      }
      if (!detail) continue;
      // outside: lanterns by doors, ivy, chimneys, pigeons
      if (ch === 'W') {
        const h = this.H(tx, ty, 21);
        const doorR = w.tile(tx + 1, ty) === 'E', doorL = w.tile(tx - 1, ty) === 'E';
        if (doorR || doorL) this.drawLantern(sx + (doorR ? 26 : 1), sy + 3, night);
        else if (h % 9 === 0) this.drawIvy(sx, sy, h);
      }
      if (ch === 'R' && w.tile(tx, ty - 1) !== 'R' && w.tile(tx - 1, ty) === 'R' && w.tile(tx + 1, ty) === 'R' && !(typeof Buildings !== 'undefined' && Buildings.get(w).cover.has(tx + ',' + ty))) {
        const h = this.H(tx, ty, 22);
        if (h % 6 === 0) this.drawChimney(sx, sy, h);
      }
    }
  },
  drawClock(sx, sy) {
    const R = (a, b, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(sx + a, sy + b, ww, hh); };
    R(10, 2, 12, 28, '#4a2e18'); R(11, 3, 10, 26, '#7a4a28'); R(11, 3, 10, 1, '#9a6a38');
    ctx.fillStyle = '#f0e8d0'; ctx.beginPath(); ctx.arc(sx + 16, sy + 9, 4.5, 0, 7); ctx.fill();
    const h = typeof DN !== 'undefined' ? DN.hour() : 12, ha = (h % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = (h % 1) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#1a1414'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx + 16, sy + 9); ctx.lineTo(sx + 16 + Math.cos(ha) * 2.5, sy + 9 + Math.sin(ha) * 2.5); ctx.moveTo(sx + 16, sy + 9); ctx.lineTo(sx + 16 + Math.cos(ma) * 3.8, sy + 9 + Math.sin(ma) * 3.8); ctx.stroke();
    R(13, 15, 6, 12, '#2a1a10');
    const sw = Math.sin(TIME * 3.1) * 2.2;
    ctx.strokeStyle = '#c8a040'; ctx.beginPath(); ctx.moveTo(sx + 16, sy + 15); ctx.lineTo(sx + 16 + sw, sy + 23); ctx.stroke();
    ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.arc(sx + 16 + sw, sy + 24, 2, 0, 7); ctx.fill();
  },
  drawSconce(sx, sy, tx) {
    ctx.fillStyle = '#3a3438'; ctx.fillRect(sx + 13, sy + 14, 6, 3); ctx.fillRect(sx + 15, sy + 10, 2, 6);
    ctx.fillStyle = '#f0e8d0'; ctx.fillRect(sx + 14, sy + 6, 4, 6);
    const f = Math.sin(TIME * 11 + tx) * 0.7;
    ctx.fillStyle = '#ffb040'; ctx.fillRect(sx + 15 + Math.round(f * 0.6), sy + 2, 2, 4); ctx.fillStyle = '#fff0b0'; ctx.fillRect(sx + 15, sy + 4, 2, 2);
  },
  drawLantern(x, y, night) {
    ctx.fillStyle = '#2a2420'; ctx.fillRect(x, y, 5, 1); ctx.fillRect(x + 2, y, 1, 4);
    ctx.fillStyle = '#3a3438'; ctx.fillRect(x, y + 4, 5, 8); ctx.fillStyle = night > 0.2 ? '#ffd27a' : '#c8b890'; ctx.fillRect(x + 1, y + 5, 3, 6);
    ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 1, y + 3, 7, 1); ctx.fillRect(x, y + 12, 5, 1);
    if (night > 0.2) this.glows.push([x + 2.5, y + 8, 60, 'rgba(255,190,100,1)', 0.7 * night]);
  },
  drawIvy(sx, sy, h) {
    for (let i = 0; i < 14; i++) {
      const a = sx + 1 + ((h >> (i % 9)) % 7) + (i % 3), b = sy + 30 - i * 2 - ((h >> i) % 3);
      ctx.fillStyle = i % 3 ? '#2f6a34' : '#4a9a44'; ctx.fillRect(a, b, 3, 2);
      if (i % 4 === 0) { ctx.fillStyle = '#7ac860'; ctx.fillRect(a + 2, b - 1, 1, 1); }
    }
  },
  drawChimney(sx, sy, h) {
    const x = sx + 8 + (h % 10), y = sy - 10;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 2, y + 18, 13, 3);
    ctx.fillStyle = '#3a2a24'; ctx.fillRect(x - 1, y - 1, 12, 20);
    ctx.fillStyle = '#8a4a3a'; ctx.fillRect(x, y, 10, 18); ctx.fillStyle = '#a85a44'; ctx.fillRect(x, y, 3, 18);
    for (let r = 0; r < 4; r++) { ctx.fillStyle = '#6a3a2a'; ctx.fillRect(x, y + 4 + r * 4, 10, 1); }
    ctx.fillStyle = '#4a4040'; ctx.fillRect(x - 2, y - 3, 14, 3); ctx.fillStyle = '#1a1414'; ctx.fillRect(x + 1, y - 3, 8, 1);
    (this.smoke || (this.smoke = [])).push([x + 5, y - 3, h]);
  },
  tableTop(tx, ty, sx, sy, night) {
    const h = this.H(tx, ty, 31), k = h % 7;
    if (k > 4) return;
    const R = (a, b, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(sx + a, sy + b, ww, hh); };
    switch (k) {
      case 0: { R(14, 8, 4, 8, '#f0e8d0'); R(13, 15, 6, 2, '#c8a040'); const f = Math.sin(TIME * 10 + tx) * 0.6; R(15 + Math.round(f), 4, 2, 4, '#ffb040'); R(15, 6, 2, 2, '#fff0b0'); this.glows.push([sx + 16, sy + 6, 60 + night * 20, 'rgba(255,190,110,1)', 0.45 + night * 0.25]); break; }
      case 1: R(8, 9, 5, 6, '#c8a060'); R(8, 9, 5, 1, '#fff8e0'); R(13, 10, 1, 3, '#8a6a40'); R(19, 10, 5, 6, '#8a8a92'); R(19, 10, 5, 1, '#fff8e0'); R(24, 11, 1, 3, '#5a5a62'); break;
      case 2: ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.ellipse(sx + 16, sy + 13, 7, 3.5, 0, 0, 7); ctx.fill(); R(11, 10, 10, 4, '#c8904a'); R(12, 10, 8, 1, '#e8b870'); R(14, 11, 1, 2, '#8a5a2a'); R(18, 11, 1, 2, '#8a5a2a'); break;
      case 3: R(9, 10, 14, 7, '#e8dcc0'); R(16, 10, 1, 7, '#a8987a'); R(10, 12, 5, 1, '#8a8070'); R(18, 12, 4, 1, '#8a8070'); R(10, 14, 4, 1, '#8a8070'); R(18, 14, 5, 1, '#8a8070'); R(22, 9, 1, 3, '#c8303a'); break;
      case 4: R(13, 9, 6, 8, '#5a8aa8'); R(13, 9, 6, 1, '#a8d8f0'); for (const [a, b, c] of [[12, 4, '#e5534b'], [16, 3, '#f2c94c'], [19, 5, '#ffffff'], [14, 6, '#9a6ae8']]) { R(a, b, 3, 3, c); } R(15, 6, 1, 3, '#2f7a34'); break;
    }
  },
  reflections(w, camX, camY) {
    const items = [];
    const add = (spr, dir, frame, e, n) => {
      const t = e.t == null ? 1 : e.t, x = e.fx != null ? e.fx + (e.x - e.fx) * t : e.x, y = e.fy != null ? e.fy + (e.y - e.fy) * t : e.y;
      const tx = Math.round(x), ty = Math.round(y);
      if (w.tile(tx, ty + 1) !== '~' && w.tile(tx, Math.floor(y) + 1) !== '~') return;
      items.push([spr, dir, frame, x * TS - camX, y * TS - camY, tx, Math.floor(y) + 1, n]);
    };
    for (const n of w.npcs || []) if (n.spr) add(n.spr, n.dir, 0, n, n);
    const p = w.player; add('hero', p.dir, 0, p, p);
    for (const f of w.followers || []) add(memberKey(f.m), f.dir, 0, w.map.interior ? f : { ...f, t: p.t }, null);
    if (!items.length) return;
    for (const [spr, dir, frame, sx, sy, tx, ty, n] of items) {
      ctx.save();
      // clip to the water tiles below
      ctx.beginPath(); let any = false;
      for (let dy = 0; dy < 2; dy++) for (let dx = -1; dx <= 1; dx++) if (w.tile(tx + dx, ty + dy) === '~') { ctx.rect((tx + dx) * TS - camX, (ty + dy) * TS - camY, TS, TS); any = true; }
      if (!any) { ctx.restore(); continue; }
      ctx.clip();
      const axis = sy + 31;
      ctx.translate(Math.sin(TIME * 2 + sx * 0.1) * 1.2, 2 * axis); ctx.scale(1, -1);
      ctx.globalAlpha = 0.32;
      try { w.drawChar(spr, dir, frame, sx, sy, n); } catch (e) {}
      ctx.restore();
      // ripple lines across the reflection
      ctx.fillStyle = 'rgba(200,230,255,.18)';
      for (let i = 0; i < 3; i++) ctx.fillRect(sx + 6 + ((i * 7 + Math.floor(TIME * 6)) % 16), sy + 38 + i * 6, 8, 1);
    }
  },
  ents(w, ents, camX, camY, x0, y0) {
    const d = this.get(w); if (!d.props.size) return;
    const x1 = x0 + Math.ceil(W / TS) + 1, y1 = y0 + Math.ceil(H / TS) + 2;
    for (const [k, pr] of d.props) {
      if (pr === 1) continue;
      const i = k.indexOf(','), tx = +k.slice(0, i), ty = +k.slice(i + 1);
      if (tx < x0 - 1 || tx > x1 || ty < y0 - 1 || ty > y1) continue;
      if (!this.propAt(w, tx, ty)) continue;
      const sx = tx * TS - camX, sy = ty * TS - camY;
      if (pr.kind === 'cat' || pr.kind === 'dog') ents.push({ y: sy - 0.2, draw: () => this.pet(pr.kind, pr.v, sx, sy) });
      else ents.push({ y: sy - 0.2, draw: () => ctx.drawImage(this.prop(pr.kind, pr.v), sx, sy - 16) });
    }
    // pigeons on the ridges (drawn above roofs)
    if (!w.map.interior && Detail.on(w)) this.birds(w, ents, camX, camY, x0, y0, x1, y1);
  },
  birds(w, ents, camX, camY, x0, y0, x1, y1) {
    const B = this.birdState || (this.birdState = {});
    const p = w.player, px = p.fx + (p.x - p.fx) * p.t, py = p.fy + (p.y - p.fy) * p.t;
    const night = typeof DN !== 'undefined' && DN.applies(w.map) ? DN.night() : 0;
    if (night > 0.6 || ['rain', 'storm'].includes(Weather.kind)) return;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (w.tile(tx, ty) !== 'R' || w.tile(tx, ty - 1) === 'R') continue;
      if (typeof Buildings !== 'undefined' && Buildings.get(w).cover.has(tx + ',' + ty)) continue;
      const h = this.H(tx, ty, 41); if (h % 9 !== 0) continue;
      const key = G.map + tx + ',' + ty, s = B[key] || (B[key] = { gone: -1 });
      const dist = Math.hypot(px - tx, py - ty);
      if (s.gone < 0 && dist < 2.6) { s.gone = TIME; Sound.sfx && Math.random() < 0.6 && Sound._nz && Sound.ctx && Sound._nz(Sound.ctx.currentTime, 0.25, Sound.sfxBus, 'bandpass', 3000, 2, 0.06, 1200); }
      if (s.gone >= 0 && TIME - s.gone > 25 && dist > 5) s.gone = -1;
      const sx = tx * TS - camX, sy = ty * TS - camY, n = 1 + h % 2;
      for (let i = 0; i < n; i++) {
        const bx0 = sx + 8 + i * 11 + (h >> 4) % 6, by0 = sy - 1;
        if (s.gone >= 0) {
          const t = TIME - s.gone; if (t > 3) continue;
          const dir = (h + i) % 2 ? 1 : -1, bx = bx0 + dir * t * 90, by = by0 - t * 70 - Math.sin(t * 9) * 3;
          ents.push({ y: 9e9, draw: () => this.pigeon(bx, by, true, h + i) });
        } else {
          const peck = Math.sin(TIME * (1.3 + i * 0.4) + h) > 0.7 ? 1 : 0;
          ents.push({ y: 9e9, draw: () => this.pigeon(bx0, by0 + peck, false, h + i) });
        }
      }
    }
  },
  pigeon(x, y, fly, h) {
    x = Math.round(x); y = Math.round(y);
    const body = ['#8a8a98', '#6a6a78', '#c8c0b8'][h % 3];
    ctx.fillStyle = 'rgba(0,0,0,.2)'; if (!fly) ctx.fillRect(x - 1, y + 4, 7, 1);
    ctx.fillStyle = body; ctx.fillRect(x, y, 6, 4); ctx.fillStyle = shade(body, 0.2); ctx.fillRect(x + 5, y - 2, 3, 3);
    ctx.fillStyle = '#1a1414'; ctx.fillRect(x + 6, y - 1, 1, 1); ctx.fillStyle = '#e8a040'; ctx.fillRect(x + 8, y - 1, 1, 1);
    ctx.fillStyle = '#5a8a7a'; ctx.fillRect(x + 4, y + 1, 2, 1);
    if (fly) { const f = Math.floor(TIME * 18 + h) % 2; ctx.fillStyle = shade(body, -0.15); ctx.fillRect(x + 1, y - (f ? 4 : -2), 4, 3); }
  },
  air(w, camX, camY) {
    const m = w.map, out = !m.interior;
    // chimney smoke drifting on the wind
    const wind = (Weather.wind || -0.1) * -40;
    for (const [x, y, h] of this.smoke || []) {
      for (let i = 0; i < 6; i++) {
        const per = 4.5, ph = ((TIME * 0.9 + i * per / 6 + (h % 10) * 0.3) % per) / per;
        const px = x + ph * (18 + wind * 1.2) + Math.sin(TIME * 1.3 + i + h) * 3 * ph, py = y - ph * 46;
        const r = 2 + ph * 7;
        ctx.globalAlpha = (1 - ph) * 0.38; ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    this.smoke = [];
    // butterflies over the meadows by day
    if (out && Detail.on(w) && !['rain', 'storm', 'snow', 'fog'].includes(Weather.kind) && !['ash', 'cave', 'castle', 'tokyo', 'night'].includes(m.theme)) {
      const day = typeof DN !== 'undefined' && DN.applies(m) ? DN.day() : 1;
      if (day > 0.5) for (let i = 0; i < 7; i++) {
        const bx = (i * 173 + 89) % (W + 60) - 30, by = (i * 239 + 53) % (H + 60) - 30;
        let wx = bx + Math.floor(camX / W) * W; if (wx < camX - 30) wx += W;
        let wy = by + Math.floor(camY / H) * H; if (wy < camY - 30) wy += H;
        const ch = w.tile(Math.floor(wx / TS), Math.floor(wy / TS)); if (!',f.'.includes(ch)) continue;
        const sx = wx - camX + Math.sin(TIME * 0.7 + i * 2.1) * 40 + Math.sin(TIME * 2.3 + i) * 6, sy = wy - camY + Math.sin(TIME * 0.5 + i * 1.3) * 26 + Math.sin(TIME * 3.1 + i) * 4;
        const flap = Math.abs(Math.sin(TIME * 14 + i * 3)), c = ['#ffffff', '#f2c94c', '#8ab8f0', '#f0a0c8', '#ff9a40'][i % 5];
        ctx.fillStyle = c; ctx.fillRect(Math.round(sx - 1 - flap * 2), Math.round(sy - 1), Math.max(1, Math.round(flap * 2)), 3); ctx.fillRect(Math.round(sx + 1), Math.round(sy - 1), Math.max(1, Math.round(flap * 2)), 3);
        ctx.fillStyle = '#2a2420'; ctx.fillRect(Math.round(sx), Math.round(sy - 1), 1, 3);
      }
    }
  },
  post(w, camX, camY) {
    for (const [x, y, r, c, a] of this.glows || []) if (r <= 70 && (typeof Rooms === 'undefined' || Rooms.shown(Math.floor((x + camX) / TS), Math.floor((y + camY) / TS)))) glow(x, y, 9, 'rgba(255,220,150,.45)', Math.min(1, a));
    this.barks(w, camX, camY);
  }
});

// =====================================================================
//  overheard: people talk among themselves, and you catch bits of it
// =====================================================================
const BARKS = {
  town: ['Rain by supper, mark me.', 'Have you seen the price of eggs?', 'My knee says winter\'s early.', 'He never did pay me back for that goat.', 'Lovely day for it.', 'Mind the cart!', 'They say the Rift glows brighter every year.', '...and she said yes!', 'Back in my day the roads were safe.', 'Lost a button. Again.', 'Someone\'s baking. Smell that?', 'I\'ll get to it tomorrow.'],
  night: ['Late to be out walking.', 'Can\'t sleep either?', 'Look at all those stars.', 'Lock your doors, they say.', 'Goodnight, then.', 'Was that an owl?', '*yawn*'],
  rain: ['Soaked to the bone.', 'Good for the crops, I suppose.', 'Should\'ve brought a coat.', 'Splash!'],
  coast: ['Tide\'s turning.', 'Good catch this morning.', 'Gulls had my sandwich.', 'Smell that salt.', 'Fog\'s coming in off the water.'],
  snow: ['Cold enough to freeze your words.', 'Stamp your boots, it helps.', 'Fire\'s lit at the longhouse.', 'Snow again. Of course.'],
  fen: ['Don\'t step off the boards.', 'The frogs are loud tonight.', 'Smells like rot and lilies.'],
  city: ['The King\'s in a mood, I hear.', 'Have you been to the academy?', 'Tea at four, don\'t be late.', 'The fountain\'s lovely this time of year.', 'Tax collectors. Ugh.'],
  inn: ['Another round!', 'Ha! You should\'ve seen his face.', 'This stew\'s better than last week.', 'Who\'s playing next?', 'To absent friends.', '*hic*'],
  shop: ['Just looking, thanks.', 'Is that price right?', 'Do you have it in blue?'],
  home: ['Wipe your feet.', 'Kettle\'s on.', 'Where did I put my glasses?', 'Mm.'],
  grand: ['Hush. This is a place of learning.', 'Mind the portraits.', 'Mm-hm.']
};
Object.assign(Decor, {
  barkState: new Map(),
  barks(w, camX, camY) {
    if (!w.npcs || Scenes.top() !== w || w.lock > 0) return;
    const m = w.map, kind = this.kindOf(G.map, m);
    if (G.map === 'overworld' || m.tutorial) return;
    const night = typeof DN !== 'undefined' && DN.applies(m) && DN.isNight();
    const rain = !m.interior && (Weather.kind === 'rain' || Weather.kind === 'storm');
    const pool = m.interior ? BARKS[kind] || BARKS.home : rain ? BARKS.rain.concat(BARKS[kind] || []) : night ? BARKS.night : (BARKS[kind] || BARKS.town).concat(BARKS.town);
    const p = w.player, px = p.fx + (p.x - p.fx) * p.t, py = p.fy + (p.y - p.fy) * p.t;
    let shown = 0;
    for (const n of w.npcs) {
      if (!n.spr || n.spr.startsWith('m:') || n.spr.startsWith('pet:') || !n.script) continue;
      const d = Math.hypot(n.x - px, n.y - py);
      let s = this.barkState.get(n); if (!s) { s = { next: TIME + rand(2, 10), t: -1, line: '' }; this.barkState.set(n, s); }
      if (s.t < 0 && d < 5 && d > 1.2 && TIME > s.next && shown < 1) {
        s.t = TIME; s.line = pick(pool); s.next = TIME + rand(14, 30);
      }
      if (s.t >= 0) {
        const age = TIME - s.t;
        if (age > 3.4 || d > 7) { s.t = -1; continue; }
        if (typeof Rooms !== 'undefined' && !Rooms.shown(n.x, n.y)) continue;
        shown++;
        const a = Math.min(1, age * 4, (3.4 - age) * 3);
        const sx = (n.fx + (n.x - n.fx) * n.t) * TS - camX + 16, sy = (n.fy + (n.y - n.fy) * n.t) * TS - camY - 22 - Math.min(age, 0.25) * 8;
        ctx.save(); ctx.globalAlpha = a * 0.95;
        const tw = textWidth(s.line, 11) + 14;
        const bx = clamp(sx - tw / 2, 4, W - tw - 4);
        ctx.fillStyle = 'rgba(250,246,236,.94)'; roundRect(bx, sy - 9, tw, 18, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx - 4, sy + 8); ctx.lineTo(sx + 2, sy + 8); ctx.lineTo(sx - 2, sy + 13); ctx.fill();
        text(s.line, bx + tw / 2, sy - 7, '#3a2a2a', 11, 'center', false);
        ctx.restore();
      }
    }
  }
});
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
