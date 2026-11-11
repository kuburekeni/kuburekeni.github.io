// =====================================================================
//  rooms.js : Pokémon-style interiors. Indoors you only see the room
//  you're standing in; the rest of the building stays dark until you
//  walk through a doorway, when the next room fades in.
//  Rooms are found automatically from each interior's walls, so every
//  building (old and new) gets this for free.
// =====================================================================
const Rooms = {
  cache: new Map(),      // map object -> { w, h, label, walls, rooms }
  st: null,              // current map's state
  alpha: null,           // per-tile darkness, 0 = visible, 1 = black
  target: null,
  key: '',
  enabled() { return G && G.settings ? G.settings.roomView !== false : true; },

  // ------------------------------------------------------------ analysis
  build(ws) {
    const m = ws.map, w = ws.w, h = ws.h;
    if (this.cache.has(m) && this.cache.get(m).rows === ws.rows) return this.cache.get(m);
    // wall characters: the solid tiles the building's outline is made of
    const warpAt = (x, y) => (m.warps || []).some(v => x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h);
    const wallCh = new Set(['V', 'W']);
    for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { const c = ws.tile(x, y); if (SOLID.has(c) && !DOOR_TILES.has(c) && !warpAt(x, y)) wallCh.add(c); }
    for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const c = ws.tile(x, y); if (SOLID.has(c) && !DOOR_TILES.has(c) && !warpAt(x, y)) wallCh.add(c); }
    const wall = new Uint8Array(w * h);
    const isW = (x, y) => x < 0 || y < 0 || x >= w || y >= h || wall[y * w + x] === 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (wallCh.has(ws.tile(x, y))) wall[y * w + x] = 1;
    // doorways: a gap of 1–2 tiles in a wall line, with open floor through it
    const door = new Uint8Array(w * h);
    const sideOk = (x, y, ax) => ax === 'h' ? !(isW(x, y - 1) && isW(x, y + 1)) : !(isW(x - 1, y) && isW(x + 1, y));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (isW(x, y)) continue;
      // gap in a horizontal wall (you walk through it vertically)
      let a = x, b = x; while (!isW(a - 1, y) && x - a < 2) a--; while (!isW(b + 1, y) && b - x < 2) b++;
      if (isW(a - 1, y) && isW(b + 1, y) && b - a <= 1 && !isW(x, y - 1) && !isW(x, y + 1)
        && a - 1 >= 0 && b + 1 < w && sideOk(a - 1, y, 'h') && sideOk(b + 1, y, 'h') && (isW(a - 2, y) || isW(b + 2, y))) { door[y * w + x] = 1; continue; }
      // gap in a vertical wall (you walk through it sideways)
      a = y; b = y; while (!isW(x, a - 1) && y - a < 2) a--; while (!isW(x, b + 1) && b - y < 2) b++;
      if (isW(x, a - 1) && isW(x, b + 1) && b - a <= 1 && !isW(x - 1, y) && !isW(x + 1, y)
        && a - 1 >= 0 && b + 1 < h && sideOk(x, a - 1, 'v') && sideOk(x, b + 1, 'v') && (isW(x, a - 2) || isW(x, b + 2))) door[y * w + x] = 1;
    }
    // flood the floor into rooms, stopping at doorways
    const label = new Int16Array(w * h).fill(-1);
    let rooms = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (wall[i] || door[i] || label[i] >= 0) continue;
      const q = [i]; label[i] = rooms;
      while (q.length) {
        const j = q.pop(), jx = j % w, jy = (j / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = jx + dx, ny = jy + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const k = ny * w + nx; if (wall[k] || door[k] || label[k] >= 0) continue;
          label[k] = rooms; q.push(k);
        }
      }
      rooms++;
    }
    // little pockets with no floor worth showing (1–2 tiles boxed in by furniture walls) join their neighbour
    const st = { rows: ws.rows, w, h, wall, door, label, rooms };
    this.cache.set(m, st);
    return st;
  },
  // which rooms the tile x,y belongs to (a doorway belongs to every room it touches)
  roomsAt(st, x, y) {
    const out = new Set(), i = y * st.w + x;
    if (x < 0 || y < 0 || x >= st.w || y >= st.h) return out;
    if (st.label[i] >= 0) { out.add(st.label[i]); return out; }
    if (st.door[i]) {
      // walk across the doorway (it can be 2 tiles deep) to the rooms either side
      const seen = new Set([i]), q = [i];
      while (q.length) {
        const j = q.pop(), jx = j % st.w, jy = (j / st.w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = jx + dx, ny = jy + dy; if (nx < 0 || ny < 0 || nx >= st.w || ny >= st.h) continue;
          const k = ny * st.w + nx; if (seen.has(k)) continue; seen.add(k);
          if (st.label[k] >= 0) out.add(st.label[k]); else if (st.door[k]) q.push(k);
        }
      }
    }
    return out;
  },
  visible(st, set) {
    const { w, h, label, wall, door } = st, vis = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (label[i] >= 0 && set.has(label[i])) vis[i] = 1;
    // the walls, doorways and wall-decor framing those rooms
    const add = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!vis[y * w + x]) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx; if (wall[k] || door[k]) add[k] = 1;
      }
    }
    // tall back walls: show the wall tile above a visible wall too (2-high wall faces)
    for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) if (add[y * w + x] && wall[(y - 1) * w + x] && !vis[(y - 1) * w + x]) {
      // only if the tile above is wall all the way to the top or another wall row
      if (y - 1 === 0) add[(y - 1) * w + x] = 1;
    }
    for (let i = 0; i < w * h; i++) if (add[i]) vis[i] = 1;
    return vis;
  },

  // ------------------------------------------------------------ per frame
  update(ws, dt) {
    if (!ws.map.interior || !this.enabled()) { this.st = null; return; }
    const st = this.build(ws);
    if (st.rooms <= 1) { this.st = null; return; }
    const p = ws.player, fresh = this.st !== st;
    const key = p.x + ',' + p.y;
    if (fresh || key !== this.key) {
      let set = this.roomsAt(st, p.x, p.y);
      if (!set.size) set = this.lastSet && !fresh ? this.lastSet : set;
      if (set.size) {
        const changed = !this.lastSet || fresh || [...set].some(r => !this.lastSet.has(r));
        this.target = this.visible(st, set);
        if (changed && !fresh) this.regather(ws, st, set);
        this.lastSet = set;
      }
      this.key = key;
    }
    if (fresh) {
      this.st = st;
      this.alpha = new Float32Array(st.w * st.h);
      for (let i = 0; i < this.alpha.length; i++) this.alpha[i] = this.target && this.target[i] ? 0 : 1;
      this.regather(ws, st, this.lastSet || new Set(), true);
      return;
    }
    const k = Math.min(1, dt * 5.5);
    for (let i = 0; i < this.alpha.length; i++) {
      const t = this.target[i] ? 0 : 1;
      this.alpha[i] += (t - this.alpha[i]) * k;
    }
  },
  // party members follow you into the room you've gone into
  regather(ws, st, set, first) {
    if (!ws.followers || !ws.followers.length || !set.size) return;
    const inRoom = (x, y) => { const r = this.roomsAt(st, x, y); for (const v of r) if (set.has(v)) return true; return false; };
    const taken = new Set(ws.followers.filter(f => f.poi && inRoom(f.poi.x, f.poi.y)).map(f => f.poi.x + ',' + f.poi.y));
    const p = ws.player;
    ws.followers.forEach((f, i) => {
      if (f.poi && inRoom(f.poi.x, f.poi.y) && inRoom(f.x, f.y)) return;
      if (!first && inRoom(f.x, f.y) && !f.poi) return;
      let pois = (ws.map.pois || []).filter(q => inRoom(q.x, q.y) && !taken.has(q.x + ',' + q.y) && !ws.npcAt(q.x, q.y) && !(q.x === p.x && q.y === p.y));
      let spot = pois.length ? pois[(i + hash2(p.x, p.y)) % pois.length] : null;
      if (!spot) {
        // no point of interest here: stand somewhere near you in the same room
        let best = null, bd = 1e9;
        for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) {
          if (!inRoom(x, y) || ws.blocked(x, y, true) || taken.has(x + ',' + y) || st.door[y * st.w + x]) continue;
          const d = Math.abs(x - p.x) + Math.abs(y - p.y) + ((x * 7 + y * 3 + i * 5) % 3) * 0.3;
          if (d >= 2 && d < bd) { bd = d; best = { x, y, dir: 'down', act: null }; }
        }
        spot = best;
      }
      if (!spot) return;
      taken.add(spot.x + ',' + spot.y);
      f.poi = spot; f.path = []; f.act = null; f.wait = first ? f.wait : 0.15 + i * 0.3;
    });
  },
  draw(ws, camX, camY) {
    if (!this.st || !this.alpha || !ws.map.interior) return;
    const st = this.st, x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
    const x1 = Math.min(st.w - 1, x0 + Math.ceil(W / TS) + 1), y1 = Math.min(st.h - 1, y0 + Math.ceil(H / TS) + 1);
    ctx.save();
    ctx.fillStyle = '#05030a';
    // one tile past the walls too, so nothing glows out over the edge of a dark room
    for (let y = y0 - 2; y <= y1 + 2; y++) for (let x = x0 - 2; x <= x1 + 2; x++) {
      const cx = Math.max(0, Math.min(st.w - 1, x)), cy = Math.max(0, Math.min(st.h - 1, y));
      const a = this.alpha[cy * st.w + cx];
      if (a < 0.01) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillRect(x * TS - camX, y * TS - camY, TS, TS);
    }
    ctx.restore();
    // a soft shadow where the light from your room falls off into a doorway
    ctx.save();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * st.w + x;
      if (!st.door[i] || this.alpha[i] > 0.5) continue;
      const sx = x * TS - camX, sy = y * TS - camY;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= st.w || ny >= st.h) continue;
        const a = this.alpha[ny * st.w + nx]; if (a < 0.5) continue;
        const g = ctx.createLinearGradient(sx + 16 - dx * 16, sy + 16 - dy * 16, sx + 16 + dx * 16, sy + 16 + dy * 16);
        g.addColorStop(0, 'rgba(5,3,10,0)'); g.addColorStop(1, `rgba(5,3,10,${0.7 * a})`);
        ctx.fillStyle = g; ctx.fillRect(sx, sy, TS, TS);
      }
    }
    ctx.restore();
  },
  // is a tile currently lit (used to hide lamps' glow in other rooms)
  shown(x, y) { if (!this.st || !this.alpha) return true; if (x < 0 || y < 0 || x >= this.st.w || y >= this.st.h) return true; return this.alpha[y * this.st.w + x] < 0.6; }
};

(() => {
  const up = WorldScene.prototype.update;
  WorldScene.prototype.update = function (dt) { up.call(this, dt); try { Rooms.update(this, dt); } catch (e) { console.error(e); } };
  const sync = WorldScene.prototype.syncFollowers;
  WorldScene.prototype.syncFollowers = function () {
    sync.call(this);
    try { if (this.map && this.map.interior) { Rooms.st = null; Rooms.key = ''; Rooms.lastSet = null; Rooms.update(this, 0); } } catch (e) { console.error(e); }
  };
  const post = Detail.post;
  Detail.post = function (w, camX, camY) { post.call(this, w, camX, camY); Rooms.draw(w, camX, camY); };
  // lamps in rooms you can't see don't light up the one you're in
  if (typeof FX !== 'undefined' && FX.addLight) {
    const al = FX.addLight;
    FX.addLight = function (x, y, ...rest) {
      const s = Scenes.top && Scenes.top();
      if (Rooms.st && s instanceof WorldScene && s.map.interior) {
        const tx = Math.floor((x + (s.camX || 0)) / TS), ty = Math.floor((y + (s.camY || 0)) / TS);
        if (!Rooms.shown(tx, ty)) return;
      }
      return al.call(this, x, y, ...rest);
    };
  }
})();
