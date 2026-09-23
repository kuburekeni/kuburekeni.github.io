// =====================================================================
//  world.js : overworld scene — movement, party, interiors, lighting,
//             weather, doors and the roads between places
// =====================================================================
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// blend two hex colours
function mixCol(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const f = (sh) => Math.round((((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
  return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1);
}

class WorldScene {
  constructor() { this.lock = 0; this.banner = null; this.bannerT = 0; }

  load(mapId, x, y, dir) {
    this.map = MAPS[mapId];
    G.map = mapId; G.x = x; G.y = y; if (dir) G.dir = dir;
    this.rows = this.map.rows; this.w = this.rows[0].length; this.h = this.rows.length;
    this.player = { x, y, fx: x, fy: y, t: 1, dir: G.dir, anim: 0 };
    this.refreshNpcs(true);
    this.syncFollowers();
    this.enc = this.rollEnc();
    this.banner = this.map.name; this.bannerStart = TIME;
    Particles.set(this.map.fx || null);
    Weather.forMap(mapId);
    Sound.play(musicFor(mapId));
  }
  // party members: a chain behind you outside; indoors they wander off to look at things
  syncFollowers() {
    const p = this.player;
    this.followers = G.party.slice(1).map(m => ({ m, x: p.x, y: p.y, fx: p.x, fy: p.y, t: 1, dir: p.dir, path: [], act: null, poi: null, wait: 0.3, anim: 0 }));
    if (this.map.interior && this.map.pois) {
      const taken = new Set();
      this.followers.forEach((f, i) => {
        const pois = this.map.pois.filter(q => !taken.has(q.x + ',' + q.y) && !this.npcAt(q.x, q.y));
        if (!pois.length) return;
        const q = pois[(i * 2 + hash2(G.party.length, i + G.map.length)) % pois.length];
        taken.add(q.x + ',' + q.y);
        f.poi = q; f.wait = 0.25 + i * 0.35;
      });
    }
  }
  refreshNpcs(reset) {
    const old = {};
    if (!reset && this.npcs) for (const n of this.npcs) old[n.id] = n;
    this.npcs = this.map.npcs.filter(n => !n.show || flag(n.show)).map(n => old[n.id] || ({
      ...n, fx: n.x, fy: n.y, t: 1, hx: n.x, hy: n.y, wt: rand(1, 3), anim: 0
    }));
  }
  rollEnc() { return irand(18, 32); }

  tile(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this.map.edge; return this.rows[y][x]; }
  solidTile(x, y) { const t = this.tile(x, y); if (t === 'Z' && G.flags.doorOpen) return false; return SOLID.has(t); }
  chestAt(x, y) { return this.map.chests.find(c => c.x === x && c.y === y); }
  npcAt(x, y) { return this.npcs && this.npcs.find(n => n.x === x && n.y === y); }
  followerAt(x, y) { return this.followers && this.followers.find(f => f.x === x && f.y === y && f.t >= 1); }
  bountyAt(x, y) { return G.quests.find(q => q.type === 'bounty' && q.map === G.map && q.have < q.need && q.pos && q.pos[0] === x && q.pos[1] === y); }
  blocked(x, y, forNpc) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    if (this.solidTile(x, y)) return true;
    if (this.chestAt(x, y) || this.npcAt(x, y) || this.bountyAt(x, y)) return true;
    if (forNpc) {
      if (this.player.x === x && this.player.y === y) return true;
      if (this.warpAt(x, y)) return true;
      if (this.followers.some(f => f.x === x && f.y === y)) return true;
    }
    return false;
  }
  warpAt(x, y) { return this.map.warps.find(w => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h); }
  triggerAt(x, y) { return (this.map.triggers || []).find(t => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h); }
  inSafe(x, y) { return (this.map.safe || []).some(([a, b, w, h]) => x >= a && x < a + w && y >= b && y < b + h); }

  run(fn) {
    this.lock++;
    return (async () => {
      try { await fn(); }
      catch (e) { console.error(e); }
      finally { this.lock--; if (G && Scenes.stack.includes(this)) this.refreshNpcs(); }
    })();
  }

  // BFS path for indoor wandering
  pathTo(sx, sy, tx, ty) {
    const key = (x, y) => x + ',' + y, prev = {}, q = [[sx, sy]]; prev[key(sx, sy)] = null;
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (k in prev || nx < 0 || ny < 0 || nx >= this.w || ny >= this.h || this.solidTile(nx, ny) || this.npcAt(nx, ny) || this.warpAt(nx, ny)) continue;
        prev[k] = [x, y]; q.push([nx, ny]);
      }
    }
    if (!(key(tx, ty) in prev)) return [];
    const out = []; let c = [tx, ty];
    while (c && !(c[0] === sx && c[1] === sy)) { out.unshift(c); c = prev[key(c[0], c[1])]; }
    return out;
  }

  update(dt) {
    G.playTime += dt;
    const p = this.player;
    const speed = Input.held('run') ? 8.5 : 5;
    Particles.update(dt, this.camX || 0, this.camY || 0);
    this.updateLife(dt);
    // NPCs
    for (const n of this.npcs) {
      if (n.t < 1) { n.t = Math.min(1, n.t + dt * 3); n.anim += dt * 8; }
      else if (!n.wander && this.lock === 0 && n.spr && !n.spr.startsWith('m:') && !n.fixed) {
        // people who stand still still glance around now and then
        if (n.dir0 === undefined) { n.dir0 = n.dir; n.lookT = rand(3, 8); }
        n.lookT -= dt;
        if (n.lookT <= 0) {
          if (n.dir !== n.dir0) { n.dir = n.dir0; n.lookT = rand(4, 9); }
          else { n.dir = pick(['left', 'right', 'down', 'up'].filter(d => d !== n.dir0)); n.lookT = rand(0.8, 1.8); }
        }
      }
      else if (n.wander && this.lock === 0) {
        n.wt -= dt;
        if (n.wt <= 0) {
          n.wt = rand(1.2, 3.5);
          const d = pick(Object.keys(DIRS)); const [dx, dy] = DIRS[d];
          const nx = n.x + dx, ny = n.y + dy;
          n.dir = d;
          if (Math.abs(nx - n.hx) <= n.wander && Math.abs(ny - n.hy) <= n.wander && !this.blocked(nx, ny, true) && !this.triggerAt(nx, ny)) {
            n.fx = n.x; n.fy = n.y; n.x = nx; n.y = ny; n.t = 0;
          }
        }
      }
    }
    // indoor followers walk to their spot and do something there
    if (this.map.interior) for (const f of this.followers) {
      if (f.t < 1) { f.t = Math.min(1, f.t + dt * 3.4); f.anim += dt * 7; continue; }
      if (f.wait > 0) { f.wait -= dt; continue; }
      if (f.poi && !f.path.length && !f.act && !(f.x === f.poi.x && f.y === f.poi.y)) { f.path = this.pathTo(f.x, f.y, f.poi.x, f.poi.y); if (!f.path.length) f.poi = null; }
      if (f.path.length) {
        const [nx, ny] = f.path.shift();
        f.dir = nx > f.x ? 'right' : nx < f.x ? 'left' : ny > f.y ? 'down' : 'up';
        f.fx = f.x; f.fy = f.y; f.x = nx; f.y = ny; f.t = 0;
      } else if (f.poi && f.x === f.poi.x && f.y === f.poi.y && !f.act) {
        f.act = f.poi.act; f.dir = f.act === 'book' || f.act === 'door' ? 'down' : f.poi.dir; f.actT = 0;
      }
      if (f.act) f.actT = (f.actT || 0) + dt;
    }
    if (p.t < 1) {
      p.t = Math.min(1, p.t + dt * speed); p.anim += dt * speed * 2;
      if (!this.map.interior) for (const f of this.followers) f.t = p.t;
      if (p.t >= 1) this.onStep();
      return;
    }
    if (this.lock > 0) return;
    if (Input.pressed('menu')) { this.run(async () => { await pauseMenu(); }); return; }
    if (Input.pressed('ok')) { this.interact(); return; }
    for (const d of ['up', 'down', 'left', 'right']) {
      if (Input.held(d)) { this.tryMove(d); return; }
    }
    p.anim = 0;
  }

  tryMove(d) {
    const p = this.player; p.dir = d; G.dir = d;
    const [dx, dy] = DIRS[d];
    const nx = p.x + dx, ny = p.y + dy;
    const bq = this.bountyAt(nx, ny);
    if (bq) { this.run(() => bountyBattle(bq)); return; }
    // doors are solid: walking into one takes you through it instead of standing on it
    if (DOOR_TILES.has(this.tile(nx, ny))) {
      const w = this.warpAt(nx, ny);
      if (w) { this.useWarp(w, nx, ny); return; }
    }
    if (this.blocked(nx, ny)) return;
    if (!this.map.interior) {
      let px_ = p.x, py_ = p.y;
      for (const f of this.followers) {
        const ox = f.x, oy = f.y;
        f.fx = f.x; f.fy = f.y;
        if (f.x !== px_ || f.y !== py_) f.dir = px_ > f.x ? 'right' : px_ < f.x ? 'left' : py_ > f.y ? 'down' : 'up';
        f.x = px_; f.y = py_;
        px_ = ox; py_ = oy;
      }
    }
    p.fx = p.x; p.fy = p.y; p.x = nx; p.y = ny; p.t = 0;
  }

  useWarp(w, fromX, fromY) {
    const p = this.player;
    if (w.to === '@travel') { this.run(() => travelFrom(w)); return; }
    let tx = w.tx + (fromX - w.x), ty = w.ty + (fromY - w.y);
    if (w.clamp) { tx = w.tx + Math.min(fromX - w.x, 1); ty = w.ty + Math.min(fromY - w.y, 1); if (w.w === 1) tx = w.tx; if (w.h === 1) ty = w.ty; }
    if (MAPS[w.to].interior || this.map.interior || DOOR_TILES.has(this.tile(fromX, fromY))) { tx = w.tx; ty = w.ty; }
    this.run(async () => {
      Sound.sfx('door');
      await fadeOut(0.25);
      this.load(w.to, tx, ty, w.dir || p.dir);
      await fadeIn(0.25);
      await onEnterMap(w.to);
    });
  }

  onStep() {
    const p = this.player;
    G.x = p.x; G.y = p.y;
    const w = this.warpAt(p.x, p.y);
    if (w) { this.useWarp(w, p.x, p.y); return; }
    const tr = this.triggerAt(p.x, p.y);
    if (tr && STORY[tr.script]) { this.run(() => STORY[tr.script](tr)); return; }
    // herbs for gather quests
    for (const q of G.quests) {
      if (q.type !== 'gather' || q.map !== G.map) continue;
      const i = q.spots.findIndex(s => s[0] === p.x && s[1] === p.y);
      if (i >= 0) {
        q.spots.splice(i, 1); q.have++;
        Sound.sfx('pickup');
        toast(`${q.itemName} ${q.have}/${q.need}` + (q.have >= q.need ? ' — return to a quest board.' : ''), UI.hp);
      }
    }
    // random encounters
    const table = encounterTable(G.map);
    if (table && table.length && !this.inSafe(p.x, p.y) && !G.flags.noEncounters) {
      const t = this.tile(p.x, p.y);
      this.enc -= t === ',' ? 1.6 : (t === '=' || t === 'B' || t === 'd' || t === 'K' || t === ';') ? 0.6 : 1;
      if (this.enc <= 0) {
        this.enc = this.rollEnc();
        this.run(() => randomEncounter());
      }
    }
  }

  interact() {
    const p = this.player;
    const [dx, dy] = DIRS[p.dir];
    let x = p.x + dx, y = p.y + dy;
    // talk across a counter or a market stall
    if ('Ce*'.includes(this.tile(x, y)) && this.npcAt(x + dx, y + dy)) { x += dx; y += dy; }
    const face = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
    const n = this.npcAt(x, y);
    if (n) {
      if (!n.spr.startsWith('m:')) n.dir = face;
      const fn = STORY[n.script];
      if (fn) this.run(() => fn(n));
      return;
    }
    const f = this.followerAt(x, y);
    if (f) { this.run(() => companionTalk(f)); return; }
    const c = this.chestAt(x, y);
    if (c) { this.run(() => openChest(c)); return; }
    const bq = this.bountyAt(x, y);
    if (bq) { this.run(() => bountyBattle(bq)); return; }
    const t = this.tile(x, y);
    if (t === 'S') { const msg = this.map.signs[x + ',' + y]; if (msg) this.run(() => say(null, msg)); return; }
    if (t === 'Q') { this.run(() => questBoard()); return; }
    if (t === 'Z') { this.run(() => bossDoor()); return; }
    if (t === 'i') { this.run(() => STORY.tShrine()); return; }
    if (t === 'v') { this.run(() => STORY.tVending()); return; }
    if (t === '?') { this.run(() => STORY.grave(x, y)); return; }
    if (DOOR_TILES.has(t)) { const w = this.warpAt(x, y); if (w) { this.useWarp(w, x, y); return; } }
    const flavour = {
      '~': ['The water is cold and clear.', 'Your reflection looks like someone you used to know.'],
      'O': ['The fire is warm. For a moment, nothing is chasing you.'],
      'D': ['The door is locked.'], 'b': ['Old books: histories of the Accord of Dawn, almanacs, a child\'s primer.', 'A book on Ashborn customs. Most of the pages have been torn out.'],
      'h': ['Shelves of supplies, neatly labelled.'], 'z': ['The hearth crackles.'], 'k': ['A barrel. It smells of ale.'],
      'e': ['A glass case of trinkets.'], 'U': ['Through the glass: bright shelves, magazines, a clock reading 6:52.'],
      '8': ['Seiryo High. The windows are dark now.'], '5': ['The dojo. It smells of old wood and effort.'],
      'l': ['A streetlight hums.'], 'q': ['Cherry blossoms, the last of the season.'], '3': ['The crossing signal.'],
      'H': ['The throne of the Ashborn kings. It is older than anything in Aldmere.'],
      '0': ['The well is deep. You can hear water a long way down.'], '6': ['The fountain throws up light along with the water.'],
      '>': ['Hay. It smells of summer and horses.'], '*': ['A market stall, half packed up.'], '{': ['A bed. You could sleep for a week.'],
      '$': ['Your crib. It looks impossibly small now.'], '&': ['Barley, almost ready to cut.'], '%': ['Turned earth, ready for planting.'],
      '?': ['A worn headstone. The name has gone soft with weather.']
    }[t];
    if (flavour) this.run(() => say(null, pick(flavour)));
  }

  // ---------------------------------------------------------------- draw
  camera() {
    const p = this.player;
    const e = p.t;
    const cx = (p.fx + (p.x - p.fx) * e) * TS + TS / 2, cy = (p.fy + (p.y - p.fy) * e) * TS + TS / 2;
    let camX = cx - W / 2, camY = cy - H / 2;
    const mw = this.w * TS, mh = this.h * TS;
    camX = mw <= W ? (mw - W) / 2 : clamp(camX, 0, mw - W);
    camY = mh <= H ? (mh - H) / 2 : clamp(camY, 0, mh - H);
    return [Math.round(camX), Math.round(camY)];
  }
  tileMask(tx, ty, ch) {
    let m = 0;
    if (!sameGroup(ch, this.tile(tx, ty - 1))) m |= 1;
    if (!sameGroup(ch, this.tile(tx + 1, ty))) m |= 2;
    if (!sameGroup(ch, this.tile(tx, ty + 1))) m |= 4;
    if (!sameGroup(ch, this.tile(tx - 1, ty))) m |= 8;
    return m;
  }
  // the colour the whole scene is multiplied by before the lights go in
  ambientLight() {
    const m = this.map;
    let base = '#f4e8d4';
    if (m.dark) base = '#241c34';
    else if (m.interior) base = '#e4d6c2';
    else if (m.theme === 'night') base = '#3e4c86';
    else if (m.theme === 'castle') base = '#6a5070';
    else if (m.theme === 'cave') base = '#3a3040';
    else if (m.theme === 'ash') base = '#d8a894';
    else if (m.theme === 'tokyo') base = '#c8a8c8';
    const t = Weather.tint();
    if (t && !m.interior) base = mixCol(base, t, Weather.kind === 'storm' ? 0.6 : 0.42);
    if (Weather.flash > 0 && !m.interior) base = mixCol(base, '#ffffff', Math.min(0.75, Weather.flash * 0.8));
    return base;
  }
  sunPos() {
    const m = this.map;
    if (m.dark || m.interior || m.theme === 'cave' || m.theme === 'night') return null;
    if (m.theme === 'ash' || m.theme === 'castle') return [W * 0.18, 60, [255, 150, 90]];
    if (m.theme === 'tokyo') return [W * 0.82, 96, [255, 170, 140]];
    return [W * 0.78, 52, [255, 240, 190]];
  }
  // the floor a prop is standing on: the most common walkable, non-grass neighbour (grass wins ties)
  groundUnder(tx, ty) {
    const k = tx + ',' + ty; this._under = this._under || {};
    if (this._underMap !== this.map) { this._under = {}; this._underMap = this.map; }
    if (k in this._under) return this._under[k];
    const cnt = {}; let grass = 0;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const c = this.tile(tx + dx, ty + dy);
      if ('.,f'.includes(c)) grass++;
      else if (c && !SOLID.has(c) && !DOOR_TILES.has(c)) cnt[c] = (cnt[c] || 0) + 1;
    }
    let best = '', n = 0; for (const c in cnt) if (cnt[c] > n) { best = c; n = cnt[c]; }
    return (this._under[k] = n > grass ? best : '');
  }
  draw() {
    const [camX, camY] = this.camera();
    this.camX = camX; this.camY = camY;
    ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    const frame = Math.floor(TIME * 2) % 2;
    const theme = this.map.theme;
    const lights = [];
    for (let ty = y0; ty <= y0 + Math.ceil(H / TS); ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / TS); tx++) {
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
      const ch = this.tile(tx, ty);
      const v = hash2(tx, ty) % 4;
      const img = tileCanvas(ch, theme, v, ANIMATED.has(ch) ? frame : 0, this.tileMask(tx, ty, ch), this.tile(tx, ty - 1), ON_GROUND.has(ch) ? this.groundUnder(tx, ty) : '');
      ctx.drawImage(img, tx * TS - camX, ty * TS - camY);
      if (LIGHT_TILES[ch]) lights.push([tx * TS - camX + 16, ty * TS - camY + 16, ch]);
    }
    // herbs
    for (const q of G.quests) if (q.type === 'gather' && q.map === G.map) for (const [hx, hy] of q.spots) {
      const sx = hx * TS - camX, sy = hy * TS - camY, b = Math.sin(TIME * 4 + hx) * 2;
      ctx.fillStyle = '#2f7a3a'; ctx.fillRect(sx + 14, sy + 16, 4, 12);
      ctx.fillStyle = '#c8a0ff'; ctx.fillRect(sx + 10, sy + 10 + b, 12, 6); ctx.fillRect(sx + 13, sy + 7 + b, 6, 12);
      glow(sx + 16, sy + 14, 22, 'rgba(200,160,255,.35)');
    }
    // chests
    for (const c of this.map.chests) {
      const sx = c.x * TS - camX, sy = c.y * TS - camY, open = G.flags['chest_' + c.id];
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(sx + 4, sy + 26, 24, 4);
      ctx.fillStyle = UI.ink; ctx.fillRect(sx + 3, sy + 9, 26, 19);
      ctx.fillStyle = open ? '#5a3418' : '#9a5a2a'; ctx.fillRect(sx + 5, sy + 11, 22, 15);
      ctx.fillStyle = open ? '#2a1a0a' : '#b87a3a'; ctx.fillRect(sx + 5, sy + 11, 22, 6);
      ctx.fillStyle = '#3a2210'; ctx.fillRect(sx + 5, sy + 17, 22, 1);
      ctx.fillStyle = UI.gold; ctx.fillRect(sx + 14, sy + 16, 4, 5);
      if (!open) { ctx.fillStyle = '#ffe8a0'; ctx.fillRect(sx + 7, sy + 12, 6, 1); }
    }
    this.drawDoorSigns(camX, camY);
    this.drawLifeGround(camX, camY);
    // entities, y-sorted
    const ents = [];
    const lerp = (e, t) => [(e.fx + (e.x - e.fx) * t) * TS - camX, (e.fy + (e.y - e.fy) * t) * TS - camY];
    for (const n of this.npcs) { const [sx, sy] = lerp(n, n.t); ents.push({ y: sy, draw: () => this.drawChar(n.spr, n.dir, n.t < 1 ? 1 + Math.floor(n.anim) % 2 : 0, sx, sy, n) }); }
    for (const q of G.quests) if (q.type === 'bounty' && q.map === G.map && q.have < q.need && q.pos) {
      const sx = q.pos[0] * TS - camX, sy = q.pos[1] * TS - camY;
      ents.push({ y: sy, draw: () => { glow(sx + 16, sy + 22, 34, 'rgba(229,83,75,.5)', 0.6 + Math.sin(TIME * 5) * 0.3); this.drawChar(enemySprKey(q.enemy), 'left', 0, sx, sy - Math.abs(Math.sin(TIME * 3)) * 3); text('!', sx + 16, sy - 18, UI.bad, 18, 'center'); } });
    }
    const p = this.player;
    const stepFrame = a => (Math.floor(a) % 4 === 1 ? 1 : Math.floor(a) % 4 === 3 ? 2 : 0);
    for (const f of this.followers) {
      const t = this.map.interior ? f.t : p.t;
      const [sx, sy] = lerp(f, t);
      const moving = this.map.interior ? f.t < 1 : p.t < 1;
      ents.push({ y: sy - 0.1, draw: () => { this.drawChar(memberKey(f.m), f.dir, moving ? stepFrame(this.map.interior ? f.anim : p.anim) : 0, sx, sy + (f.act === 'sit' ? 3 : 0)); this.drawActivity(f, sx, sy); } });
    }
    const [px_, py_] = lerp(p, p.t);
    ents.push({ y: py_, draw: () => { this.drawChar('hero', p.dir, p.t < 1 ? stepFrame(p.anim) : 0, px_, py_, p); this.drawGrassOver(p, px_, py_); } });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    this.drawLifeAir(camX, camY);
    Particles.draw(camX, camY);

    // ---- the lighting pass: everything above is multiplied by the ambient, then lit
    const sun = this.sunPos();
    FX.beginLights(this.ambientLight());
    for (const [lx, ly, ch] of lights) {
      const [col, r] = LIGHT_TILES[ch];
      const fl = ch === 'O' || ch === 'z' || ch === '!' ? 0.86 + Math.sin(TIME * 9 + lx) * 0.1 + Math.sin(TIME * 23) * 0.04 : 1;
      FX.addLight(lx, ly, r * 1.5 * fl, col.replace(/[\d.]+\)$/, '1)'), 0.8);
    }
    for (const [lx, ly] of this._doorLights || []) FX.addLight(lx, ly, 70 + Math.sin(TIME * 8 + lx) * 4, 'rgba(255,200,120,1)', 0.7);
    if (this.map.dark) FX.addLight(px_ + 16, py_ + 16, 210 + Math.sin(TIME * 7) * 6, 'rgba(255,206,140,1)', 0.95);
    if (sun) FX.addLight(sun[0], sun[1], 320, `rgba(${sun[2].join(',')},1)`, 0.45);
    FX.endLights();
    // additive sparkle on top of the lit scene
    for (const [lx, ly, ch] of lights) {
      const [col, r] = LIGHT_TILES[ch];
      const fl = ch === 'O' || ch === 'z' ? 0.85 + Math.sin(TIME * 9 + lx) * 0.12 : 1;
      glow(lx, ly, r * 0.7 * fl, col);
    }
    if (sun && !this.map.interior && Weather.kind !== 'storm' && Weather.kind !== 'rain') {
      FX.godRays(sun[0], sun[1], `rgba(${sun[2].join(',')},.07)`);
      FX.lensFlare(sun[0], sun[1], 0.85 + Math.sin(TIME * 0.7) * 0.06, sun[2]);
    }
    Weather.drawWorld();
    FX.bloom(this.map.dark ? 0.42 : 0.26);
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.92);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    Weather.drawScreen();
    for (const [name, cx, ty, al] of this._plates || []) { const tw = textWidth(name, 13) + 20; ctx.globalAlpha = al; drawWindow(cx - tw / 2, ty, tw, 24, 0.92); text(name, cx, ty + 4, UI.gold, 13, 'center'); ctx.globalAlpha = 1; }
    // area banner
    const bt = TIME - (this.bannerStart || 0);
    if (this.banner && bt < 3.2) {
      const a = bt < 0.4 ? bt / 0.4 : bt > 2.6 ? (3.2 - bt) / 0.6 : 1;
      ctx.globalAlpha = a;
      const label = this.banner + (Weather.label() && !this.map.interior ? '  ·  ' + Weather.label() : '');
      const bw = textWidth(label, 22) + 60;
      drawWindow(W / 2 - bw / 2, 24, bw, 46);
      text(label, W / 2, 36, UI.paper, 22, 'center');
      ctx.globalAlpha = 1;
    }
    // objective tracker
    if ((this.map.tutorial || G.flags.showObjective !== false) && this.lock === 0 && !this.map.interior) {
      const o = storyObjective();
      const lines = wrap(o, 250, 13);
      drawWindow(12, H - 22 - lines.length * 18, 278, lines.length * 18 + 16, 0.8);
      lines.forEach((l, i) => text(l, 24, H - 14 - lines.length * 18 + i * 18, UI.paper, 13, 'left', false));
    }
  }

  // ------------------------------------------------------------ living world
  // footstep dust, rustling grass, butterflies, birds, chimney smoke
  updateLife(dt) {
    const L = this.life || (this.life = { fx: [], birdT: rand(4, 10), bugs: [], smokeT: 0 });
    if (L.map !== this.map) { L.map = this.map; L.fx = []; L.bugs = []; L.birdT = rand(3, 8); }
    const camX = this.camX || 0, camY = this.camY || 0, m = this.map;
    const outdoors = !m.interior && !m.dark && m.theme !== 'cave';
    const day = outdoors && m.theme !== 'night' && m.theme !== 'castle' && Weather.kind !== 'storm';
    // footsteps
    for (const e of [this.player, ...(this.followers || []), ...(this.npcs || [])]) {
      if (e._lx === undefined) { e._lx = e.x; e._ly = e.y; continue; }
      if (e.x !== e._lx || e.y !== e._ly) { this.footstep(e._lx, e._ly, e); e._lx = e.x; e._ly = e.y; }
    }
    // butterflies around flowers on sunny grass maps
    if (day && m.theme === 'grass' && L.bugs.length < 5 && Math.random() < dt * 0.8) {
      const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
      for (let k = 0; k < 6; k++) {
        const tx = x0 + irand(0, Math.ceil(W / TS)), ty = y0 + irand(0, Math.ceil(H / TS));
        if (this.tile(tx, ty) === 'f') { L.bugs.push({ x: tx * TS + 16, y: ty * TS + 12, hx: tx * TS + 16, hy: ty * TS + 12, t: 0, life: rand(8, 16), seed: rand(0, 9), col: pick(['#fff4f8', '#f7b8cc', '#fff3a0', '#a8c8ff', '#f2a03a']) }); break; }
      }
    }
    for (const b of L.bugs) { b.t += dt; b.x = b.hx + Math.sin(b.t * 0.9 + b.seed) * 26 + Math.sin(b.t * 2.3) * 6; b.y = b.hy + Math.cos(b.t * 0.7 + b.seed) * 14 - Math.abs(Math.sin(b.t * 5)) * 4; }
    L.bugs = L.bugs.filter(b => b.t < b.life);
    // a flock crossing the sky, shadows sliding over the ground
    if (day) {
      L.birdT -= dt;
      if (L.birdT <= 0) {
        L.birdT = rand(9, 20);
        const dir = Math.random() < 0.5 ? 1 : -1, y = camY + rand(40, H - 80), n = irand(2, 5);
        for (let i = 0; i < n; i++) L.fx.push({ k: 'bird', x: camX + (dir > 0 ? -30 - i * 18 : W + 30 + i * 18), y: y + (i % 2 ? 10 : -6) * Math.ceil(i / 2), vx: dir * rand(70, 90), vy: rand(-8, 8), t: rand(0, 1), life: 30 });
      }
    }
    // chimney smoke from the peaks of roofs
    if (outdoors) {
      L.smokeT -= dt;
      if (L.smokeT <= 0) {
        L.smokeT = 0.35;
        const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
        for (let ty = y0; ty <= y0 + Math.ceil(H / TS); ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / TS); tx++) {
          if (this.tile(tx, ty) !== 'R' || this.tile(tx, ty - 1) === 'R' || hash2(tx, ty) % 6 !== 0) continue;
          L.fx.push({ k: 'smoke', x: tx * TS + 22 + rand(-2, 2), y: ty * TS + 2, vx: rand(4, 10), vy: rand(-16, -11), t: 0, life: rand(2.2, 3.2), r: rand(2, 3) });
        }
      }
    }
    for (const f of L.fx) {
      f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.k === 'leaf') { f.vy += 60 * dt; f.vx *= 0.96; }
      if (f.k === 'dust') { f.vx *= 0.9; f.vy *= 0.9; }
      if (f.k === 'smoke') f.vx += Math.sin(f.t * 2 + f.x) * 3 * dt;
    }
    L.fx = L.fx.filter(f => f.t < f.life && f.x > camX - 200 && f.x < camX + W + 200);
    if (L.fx.length > 260) L.fx.splice(0, L.fx.length - 260);
  }
  footstep(tx, ty, e) {
    const L = this.life; if (!L) return;
    const c = this.tile(tx, ty), cx = tx * TS + 16, cy = ty * TS + 28;
    const wet = !this.map.interior && (Weather.kind === 'rain' || Weather.kind === 'storm');
    if (wet) { L.fx.push({ k: 'ripple', x: cx, y: cy, vx: 0, vy: 0, t: 0, life: 0.5 }); return; }
    if ('=d;ca_'.includes(c) || this.map.theme === 'ash') {
      const col = c === '=' ? '#e0cc9c' : c === ';' || c === 'c' ? '#8a7a5a' : '#b8b0a8';
      for (let i = 0; i < 4; i++) L.fx.push({ k: 'dust', x: cx + rand(-6, 6), y: cy + rand(-2, 2), vx: rand(-18, 18), vy: rand(-12, -2), t: 0, life: rand(0.35, 0.6), col, r: rand(1.5, 3) });
    } else if (c === ',') {
      for (let i = 0; i < 3; i++) L.fx.push({ k: 'leaf', x: cx + rand(-6, 6), y: cy - 6, vx: rand(-30, 30), vy: rand(-50, -25), t: 0, life: 0.55, col: pick(['#84d068', '#46963a', '#6ab454']) });
      e._rustle = TIME;
    }
  }
  drawLifeGround(camX, camY) {
    const L = this.life; if (!L) return;
    for (const f of L.fx) {
      const p = f.t / f.life, sx = f.x - camX, sy = f.y - camY;
      if (f.k === 'dust') { ctx.globalAlpha = (1 - p) * 0.55; ctx.fillStyle = f.col; const r = f.r * (1 + p * 1.5); ctx.fillRect(Math.round(sx - r), Math.round(sy - r * 0.6), Math.ceil(r * 2), Math.ceil(r * 1.2)); }
      else if (f.k === 'ripple') { ctx.globalAlpha = (1 - p) * 0.6; ctx.strokeStyle = '#cfe4ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(sx, sy, 3 + p * 10, 1 + p * 3.5, 0, 0, 7); ctx.stroke(); }
      else if (f.k === 'bird') { ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(sx + 40, sy + 90, 5, 2, 0, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  drawLifeAir(camX, camY) {
    const L = this.life; if (!L) return;
    for (const f of L.fx) {
      const p = f.t / f.life, sx = Math.round(f.x - camX), sy = Math.round(f.y - camY);
      if (f.k === 'leaf') { ctx.globalAlpha = 1 - p; ctx.fillStyle = f.col; ctx.fillRect(sx, sy, 2, 1); ctx.fillRect(sx + 1, sy + 1, 1, 1); }
      else if (f.k === 'smoke') { ctx.globalAlpha = (p < 0.15 ? p / 0.15 : 1 - p) * 0.35; ctx.fillStyle = '#d8d4e0'; const r = f.r + p * 7; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.globalAlpha *= 0.4; ctx.beginPath(); ctx.arc(sx - r * 0.3, sy - r * 0.3, r * 0.5, 0, 7); ctx.fill(); }
      else if (f.k === 'bird') {
        const up = Math.floor(f.t * 8) % 2; ctx.globalAlpha = 1; ctx.fillStyle = '#2a2436';
        ctx.fillRect(sx - 1, sy, 3, 2);
        if (up) { ctx.fillRect(sx - 4, sy - 2, 3, 1); ctx.fillRect(sx + 2, sy - 2, 3, 1); ctx.fillRect(sx - 2, sy - 1, 1, 1); ctx.fillRect(sx + 2, sy - 1, 1, 1); }
        else { ctx.fillRect(sx - 4, sy + 1, 3, 1); ctx.fillRect(sx + 2, sy + 1, 3, 1); }
      }
    }
    for (const b of L.bugs) {
      const a = Math.min(1, b.t, b.life - b.t), sx = Math.round(b.x - camX), sy = Math.round(b.y - camY), open = Math.floor(b.t * 12) % 2;
      ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(sx - 1, sy + 14, 3, 1);
      ctx.fillStyle = b.col;
      if (open) { ctx.fillRect(sx - 3, sy - 1, 2, 3); ctx.fillRect(sx + 2, sy - 1, 2, 3); } else { ctx.fillRect(sx - 1, sy - 2, 1, 3); ctx.fillRect(sx + 1, sy - 2, 1, 3); }
      ctx.fillStyle = '#2a2436'; ctx.fillRect(sx, sy - 1, 1, 3);
    }
    ctx.globalAlpha = 1;
  }
  // tall grass swallows your ankles, and sways when you walk through it
  drawGrassOver(e, sx, sy) {
    const tx = e.t < 1 ? e.x : e.x, ty = e.y;
    if (this.tile(tx, ty) !== ',' || e.t < 0.5) return;
    const sway = e._rustle && TIME - e._rustle < 0.6 ? Math.sin((TIME - e._rustle) * 30) * 1.5 * (1 - (TIME - e._rustle) / 0.6) : 0;
    for (let i = 0; i < 9; i++) {
      const bx = Math.round(sx + 6 + i * 2.5 + sway * (i % 2 ? 1 : -1)), h = 5 + (i * 7) % 4;
      ctx.fillStyle = i % 3 === 0 ? '#2f7428' : '#46963a'; ctx.fillRect(bx, sy + 30 - h, 1, h);
      ctx.fillStyle = '#84d068'; ctx.fillRect(bx, sy + 30 - h, 1, 1);
    }
  }

  // ------------------------------------------------------------ shop fronts
  // every door that leads somewhere public gets a sign, an awning and a name
  // that appears as you walk up to it, so shops, inns and taverns read at a glance
  doorKind(to) {
    if (!to || to[0] === '@') return null;
    if (/shop|konbini|market|smith/.test(to)) return 'shop';
    if (/inn|lodge/.test(to)) return 'inn';
    if (/tavern|bar/.test(to)) return 'tavern';
    if (/chapel|church|shrine/.test(to)) return 'chapel';
    if (/palace|manor|hall/.test(to)) return 'hall';
    return null;
  }
  drawDoorSigns(camX, camY) {
    this._doorLights = []; this._plates = [];
    if (this.map.interior || !this.map.warps) return;
    const S = {
      shop:   { board: '#2e6a3a', rim: '#d8a840', aw: ['#c83a3a', '#f4ecd8'] },
      inn:    { board: '#2e3f82', rim: '#d8a840', aw: ['#3a5aa8', '#f4ecd8'], lamp: 1 },
      tavern: { board: '#6a3a1e', rim: '#c8a040', aw: ['#3a7a4a', '#f0e0b0'], lamp: 1 },
      chapel: { board: '#e8e4f0', rim: '#d8a840', aw: null },
      hall:   { board: '#6a1426', rim: '#f2c94c', aw: null, banner: 1 }
    };
    const p = this.player;
    for (const wp of this.map.warps) {
      const kind = this.doorKind(wp.to); if (!kind) continue;
      const st = S[kind], dw = (wp.w || 1) * TS, dx = wp.x * TS - camX, dy = wp.y * TS - camY;
      if (dx < -96 || dx > W + 96 || dy < -96 || dy > H + 96) continue;
      const cx = dx + dw / 2;
      const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
      // awning over the door
      if (st.aw) {
        const aw = dw + 16, ax = cx - aw / 2, ay = dy - 5;
        R(ax - 1, ay - 1, aw + 2, 11, UI.ink);
        for (let i = 0; i < aw; i += 4) R(ax + i, ay, 4, 8, (i / 4) % 2 ? st.aw[1] : st.aw[0]);
        R(ax, ay, aw, 1, 'rgba(255,255,255,.35)');
        for (let i = 0; i < aw; i += 4) R(ax + i + 1, ay + 8, 2, 2, (i / 4) % 2 ? st.aw[1] : st.aw[0]);
        R(ax, ay + 10, aw, 2, 'rgba(0,0,0,.25)');
      }
      // hanging signboard beside the door, on an iron bracket
      const sx0 = cx + dw / 2 + 2, sy0 = dy - 16;
      ctx.save(); ctx.translate(sx0, sy0); ctx.scale(1.5, 1.5); ctx.translate(-sx0, -sy0);
      const sx = sx0, sy = sy0;
      R(sx - 2, sy - 2, 14, 2, '#2a2a30'); R(sx + 10, sy - 2, 2, 5, '#2a2a30');
      R(sx + 1, sy, 1, 3, '#4a4a52'); R(sx + 8, sy, 1, 3, '#4a4a52');
      const swing = Math.sin(TIME * 1.6 + wp.x) * 0.6;
      const bx = sx - 4 + swing, by = sy + 3;
      R(bx - 1, by - 1, 20, 18, UI.ink); R(bx, by, 18, 16, st.rim); R(bx + 1, by + 1, 16, 14, st.board);
      R(bx + 1, by + 1, 16, 1, 'rgba(255,255,255,.25)');
      const ix = bx + 9, iy = by + 8;
      if (kind === 'shop') {         // potion flask
        R(ix - 1, iy - 6, 3, 2, '#e8e0d0'); R(ix - 2, iy - 4, 5, 1, '#8a5a30');
        R(ix - 4, iy - 3, 9, 7, UI.ink); R(ix - 3, iy - 2, 7, 5, '#e5534b'); R(ix - 3, iy - 2, 7, 2, '#ffffff'); R(ix - 2, iy - 1, 2, 1, '#ffd0d0');
      } else if (kind === 'inn') {   // bed
        R(ix - 6, iy - 2, 2, 7, '#e8c898'); R(ix + 4, iy, 2, 5, '#e8c898');
        R(ix - 4, iy + 1, 8, 3, '#e8e0f0'); R(ix - 4, iy - 1, 3, 2, '#ffffff'); R(ix - 1, iy, 5, 3, '#c83a3a');
        R(ix + 2, iy - 5, 1, 1, '#fff3a0'); R(ix + 4, iy - 6, 1, 1, '#fff3a0');
      } else if (kind === 'tavern') { // frothing mug
        R(ix - 4, iy - 3, 7, 8, UI.ink); R(ix - 3, iy - 2, 5, 6, '#e8b040'); R(ix - 3, iy - 4, 5, 2, '#ffffff'); R(ix - 4, iy - 5, 3, 1, '#ffffff');
        R(ix + 3, iy - 1, 2, 1, '#8a5a30'); R(ix + 4, iy - 1, 1, 4, '#8a5a30'); R(ix + 3, iy + 2, 2, 1, '#8a5a30');
      } else if (kind === 'chapel') { // gold star
        R(ix - 1, iy - 6, 2, 12, '#d8a840'); R(ix - 5, iy - 1, 10, 2, '#d8a840'); R(ix - 3, iy - 3, 6, 6, '#f2c94c'); R(ix - 1, iy - 1, 2, 2, '#fff4c0');
      } else {                        // crown
        R(ix - 5, iy - 1, 10, 5, '#f2c94c'); R(ix - 5, iy - 4, 2, 3, '#f2c94c'); R(ix - 1, iy - 5, 2, 4, '#f2c94c'); R(ix + 3, iy - 4, 2, 3, '#f2c94c'); R(ix - 1, iy + 1, 2, 2, '#e5534b');
      }
      ctx.restore();
      if (st.banner) for (const bxx of [dx - 8, dx + dw + 2]) { R(bxx, dy - 20, 6, 22, UI.ink); R(bxx + 1, dy - 19, 4, 20, '#8a2234'); R(bxx + 2, dy - 15, 2, 3, '#f2c94c'); R(bxx + 1, dy + 1, 2, 2, '#8a2234'); R(bxx + 3, dy + 1, 2, 2, '#8a2234'); }
      // lanterns either side of inns and taverns
      if (st.lamp) for (const lx of [dx - 5, dx + dw + 1]) {
        R(lx - 1, dy + 6, 6, 1, '#2a2a30'); R(lx, dy + 7, 5, 9, UI.ink); R(lx + 1, dy + 8, 3, 7, '#ffd070'); R(lx + 1, dy + 8, 1, 2, '#fff4c0'); R(lx, dy + 16, 5, 1, '#2a2a30');
        this._doorLights.push([lx + 2, dy + 8]);
      }
      // name plate as you come near
      const dist = Math.hypot(p.x - (wp.x + ((wp.w || 1) - 1) / 2), p.y - wp.y);
      const a = clamp((3.2 - dist) / 1.2, 0, 1);
      if (a > 0 && this.lock === 0) {
        const nm = (MAPS[wp.to] && MAPS[wp.to].name) || wp.to;
        const tag = { shop: 'Shop', inn: 'Inn', tavern: 'Tavern', chapel: 'Chapel', hall: '' }[kind];
        const name = tag && !nm.toLowerCase().includes(tag.toLowerCase()) ? `${tag} · ${nm}` : nm;
        this._plates.push([name, cx, dy - 44 - (1 - a) * 6, a]);
      }
    }
  }
  drawChar(key, dir, frame, sx, sy, n) {
    const sun = this.sunPos();
    const off = sun ? clamp((sx + 16 - sun[0]) / 90, -6, 6) : 0;
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(sx + 16 + off * 0.5, sy + 30, 10 + Math.abs(off) * 0.4, 4, 0, 0, 7); ctx.fill();
    if (key.startsWith('m:') && key !== 'm:wolf' && key !== 'm:slime' && key !== 'm:bat') { ctx.drawImage(monsterSprite(key.slice(2), dir === 'left', 48), sx - 8, sy - 16); return; }
    const img = charSprite(key, dir, frame);
    // idle breathing: a gentle 1px rise every couple of seconds, each character on its own rhythm
    const moving = n && n.t !== undefined && n.t < 1;
    const breathe = !frame && !moving && Math.sin(TIME * 2.4 + (key.length * 1.7 + (n && n.hx || 0) * 0.9)) > 0.55 ? 1 : 0;
    ctx.drawImage(img, Math.round(sx), Math.round(sy) - 2 - breathe);
    if (n && n.id === 'lyraTied') { ctx.strokeStyle = '#c8a86a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + 7, sy + 18); ctx.lineTo(sx + 25, sy + 23); ctx.moveTo(sx + 7, sy + 23); ctx.lineTo(sx + 25, sy + 18); ctx.stroke(); ctx.lineWidth = 1; }
  }
  drawActivity(f, sx, sy) {
    if (!f.act) return;
    const t = f.actT || 0;
    if (f.act === 'book') {
      const flip = Math.floor(t / 2.4) % 2;
      ctx.fillStyle = UI.ink; ctx.fillRect(sx + 8, sy + 19, 16, 9);
      ctx.fillStyle = '#7a2a2a'; ctx.fillRect(sx + 9, sy + 20, 14, 7);
      ctx.fillStyle = '#f3e6c4'; ctx.fillRect(sx + 10, sy + 20, 6, 6); ctx.fillRect(sx + 16, sy + 20, 6, 6);
      ctx.fillStyle = '#9a8a70'; ctx.fillRect(sx + 11, sy + 22, 4, 1); ctx.fillRect(sx + 17, sy + 22, 4, 1); ctx.fillRect(sx + 11, sy + 24, 3, 1);
      if (flip && (t % 2.4) < 0.3) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 16, sy + 17, 5, 5); }
    }
    if (f.act === 'display' && (t % 5) > 3.6) { drawWindow(sx + 18, sy - 16, 26, 18, 0.9); text('…', sx + 31, sy - 16, UI.paper, 13, 'center'); }
    if (f.act === 'fire') glow(sx + 16, sy + 8, 28, 'rgba(255,150,60,.25)');
    if (f.act === 'bar' && (t % 7) > 5.8) { ctx.fillStyle = '#c8a040'; ctx.fillRect(sx + 22, sy + 16, 5, 6); ctx.fillStyle = '#fff'; ctx.fillRect(sx + 22, sy + 15, 5, 2); }
  }
}

function musicFor(id) {
  if (id === 'castle' && G.ending === 'purge') return 'dark';
  if (id === 'castle' && G.ending === 'deal') return 'wastes';
  return MAPS[id].music;
}
function enemySprKey(id) {
  const s = ENEMIES[id].spr;
  return MONSTERS[s] ? 'm:' + s : s;
}
// the land changes with the ending you chose
function encounterTable(mapId) {
  const m = MAPS[mapId];
  let t = m.encounters ? m.encounters.slice() : null;
  if (!t) return null;
  if (G.ending === 'door' && mapId !== 'castle') t.push(['imp', 1.5], ['dknight', 1]);
  if (G.ending === 'deal') {
    if (mapId === 'castle') return null;              // Castle Vharn is Ashborn land now: no fighting there
    t = t.filter(([id]) => !ENEMIES[id].demon);
    if (mapId === 'forest' || mapId === 'wastes') t.push(['bandit', 1.5]);
  }
  if (G.ending === 'purge') { t = t.filter(([id]) => !ENEMIES[id].demon); if (!t.length) t = [['swolf', 1]]; }
  return t;
}

async function openChest(c) {
  if (G.flags['chest_' + c.id]) { await say(null, 'The chest is empty.'); return; }
  G.flags['chest_' + c.id] = true;
  Sound.sfx('chest');
  let cc = c;
  if (c.item === 'otherblade' && G.heroClass === 'mage') cc = { ...c, item: 'otherstaff' };
  const l = chestLoot(cc);
  if (l.gold) { G.gold += l.gold; await say(null, `You found ${l.gold} G.`); }
  else { addItem(l.item, l.qty); await say(null, `You found ${l.qty > 1 ? l.qty + '× ' : 'a '}${ITEMS[l.item].name}.`); }
  if (c.item === 'locket' && !G.flags.elsieFound) { G.flags.elsieFound = true; await say(null, 'The locket is dented, and there is a pressed flower inside. The name "Elsie" is scratched on the back.'); }
}

async function randomEncounter() {
  const map = MAPS[G.map];
  const table = encounterTable(G.map);
  const count = weighted([[1, 3], [2, 4], [3, 3]]);
  const group = [];
  for (let i = 0; i < count; i++) group.push(weighted(table));
  await startBattle(group, { bg: map.bg });
}
