// =====================================================================
//  chunks.js : the ground is painted once, not every frame
//  The map is cut into 8x8-tile chunks. Each chunk near the player is
//  painted into its own picture the first time it's needed (twice if it
//  has water or other two-frame tiles). Each frame then draws about 20
//  pictures instead of a few hundred tiles. Pixels are identical to
//  drawing tile by tile. Chunks far from the player are forgotten.
// =====================================================================
const Chunks = {
  N: 8, MAX: 72, cache: new Map(), key: null, lightTiles: null,
  sig(w) { return [w.rows, w.map.theme, typeof Detail !== 'undefined' && Detail.bigTrees(w), Gfx.tier]; },
  reset(w) { this.cache.clear(); this.key = this.sig(w); },
  same(a, b) { if (!a) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; },
  build(w, cx, cy) {
    const N = this.N, S = N * TS, theme = w.map.theme;
    let anim = false; const lights = [];
    const tiles = [];
    for (let ty = cy * N; ty < cy * N + N; ty++) for (let tx = cx * N; tx < cx * N + N; tx++) {
      if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) continue;
      const ch = w.tile(tx, ty);
      if (ANIMATED.has(ch)) anim = true;
      if (LIGHT_TILES[ch]) lights.push([tx, ty, ch]);
      tiles.push([tx, ty, ch]);
    }
    const paint = frame => {
      const [c, x] = mkCanvas(S, S);
      for (const [tx, ty, ch] of tiles) {
        const v = hash2(tx, ty) % 4;
        const img = (typeof Detail !== 'undefined' && Detail.tileImg(w, ch, tx, ty, theme, v)) || tileCanvas(ch, theme, v, ANIMATED.has(ch) ? frame : 0, w.tileMask(tx, ty, ch), w.tile(tx, ty - 1), ON_GROUND.has(ch) ? w.groundUnder(tx, ty) : '');
        x.drawImage(img, (tx - cx * N) * TS, (ty - cy * N) * TS);
      }
      return c;
    };
    const f0 = paint(0);
    return { f: [f0, anim ? paint(1) : f0], lights, used: 0 };
  },
  get(w, cx, cy, now) {
    const k = cx + ',' + cy; let e = this.cache.get(k);
    if (!e) {
      e = this.build(w, cx, cy); this.cache.set(k, e);
      if (this.cache.size > this.MAX) {           // forget the chunks used longest ago
        const old = [...this.cache.entries()].sort((a, b) => a[1].used - b[1].used).slice(0, this.cache.size - this.MAX);
        for (const [kk] of old) this.cache.delete(kk);
      }
    }
    e.used = now; return e;
  },
  // draws the ground; fills `lights` exactly like the tile loop did. Returns false to fall back.
  draw(w, camX, camY, x0, y0, frame, lights) {
    if (!this.on) return false;
    const s = this.sig(w); if (!this.same(this.key, s)) this.reset(w);
    const N = this.N, S = N * TS, now = performance.now();
    const x1 = x0 + Math.ceil(W / TS), y1 = y0 + Math.ceil(H / TS);
    const cx0 = Math.floor(Math.max(0, x0) / N), cy0 = Math.floor(Math.max(0, y0) / N);
    const cx1 = Math.floor(Math.min(w.w - 1, x1) / N), cy1 = Math.floor(Math.min(w.h - 1, y1) / N);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const e = this.get(w, cx, cy, now);
      ctx.drawImage(e.f[frame], cx * S - camX, cy * S - camY);
      for (const [tx, ty, ch] of e.lights) if (tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1) lights.push([tx * TS - camX + 16, ty * TS - camY + 16, ch]);
    }
    // paint one chunk ahead in the direction of travel while there's time, so walking never waits
    if (!this._pre || now - this._pre > 120) {
      this._pre = now;
      for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
        if (cx < 0 || cy < 0 || cx * N >= w.w || cy * N >= w.h || this.cache.has(cx + ',' + cy)) continue;
        this.get(w, cx, cy, now); return true;   // one per pass
      }
    }
    return true;
  },
  on: true
};
