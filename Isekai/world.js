// =====================================================================
//  world.js : overworld scene — movement, party, interiors, lighting
// =====================================================================
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

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
    this.banner = this.map.name; this.bannerT = 0;
    Particles.set(this.map.fx || null);
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
    this.bannerT += dt;
    const p = this.player;
    const speed = Input.held('run') ? 8.5 : 5;
    Particles.update(dt, this.camX || 0, this.camY || 0);
    // NPCs
    for (const n of this.npcs) {
      if (n.t < 1) { n.t = Math.min(1, n.t + dt * 3); n.anim += dt * 8; }
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

  onStep() {
    const p = this.player;
    G.x = p.x; G.y = p.y;
    const w = this.warpAt(p.x, p.y);
    if (w) {
      let tx = w.tx + (p.x - w.x), ty = w.ty + (p.y - w.y);
      if (w.clamp) { tx = w.tx + Math.min(p.x - w.x, 1); ty = w.ty + Math.min(p.y - w.y, 1); if (w.w === 1) tx = w.tx; if (w.h === 1) ty = w.ty; }
      if (MAPS[w.to].interior || this.map.interior) { tx = w.tx; ty = w.ty; }
      this.run(async () => {
        Sound.sfx('door');
        await fadeOut(0.25);
        this.load(w.to, tx, ty, w.dir || p.dir);
        await fadeIn(0.25);
        await onEnterMap(w.to);
      });
      return;
    }
    const tr = this.triggerAt(p.x, p.y);
    if (tr && STORY[tr.script]) { this.run(() => STORY[tr.script](tr)); return; }
    // herbs for gather quests
    for (const q of G.quests) {
      if (q.type !== 'gather' || q.map !== G.map) continue;
      const i = q.spots.findIndex(s => s[0] === p.x && s[1] === p.y);
      if (i >= 0) {
        q.spots.splice(i, 1); q.have++;
        Sound.sfx('pickup');
        toast(`${q.itemName} ${q.have}/${q.need}` + (q.have >= q.need ? ' — return to the quest board.' : ''), UI.hp);
      }
    }
    // random encounters
    const table = encounterTable(G.map);
    if (table && table.length && !this.inSafe(p.x, p.y) && !G.flags.noEncounters) {
      const t = this.tile(p.x, p.y);
      this.enc -= t === ',' ? 1.6 : (t === '=' || t === 'B' || t === 'd' || t === 'K') ? 0.6 : 1;
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
    // talk across a counter
    if ('Ce'.includes(this.tile(x, y)) && this.npcAt(x + dx, y + dy)) { x += dx; y += dy; }
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
    const flavour = {
      '~': ['The water is cold and clear.', 'Your reflection looks like someone you used to know.'],
      'O': ['The fire is warm. For a moment, nothing is chasing you.'],
      'D': ['The door is locked.'], 'b': ['Old books: histories of the Accord of Dawn, almanacs, a child\'s primer.', 'A book on Ashborn customs. Most of the pages have been torn out.'],
      'h': ['Shelves of supplies, neatly labelled.'], 'z': ['The hearth crackles.'], 'k': ['A barrel. It smells of ale.'],
      'e': ['A glass case of trinkets.'], 'U': ['Through the glass: bright shelves, magazines, a clock reading 6:52.'],
      '8': ['Seiryo High. The windows are dark now.'], '5': ['The dojo. It smells of old wood and effort.'],
      'l': ['A streetlight hums.'], 'q': ['Cherry blossoms, the last of the season.'], '3': ['The crossing signal.'],
      'H': ['The throne of the Ashborn kings. It is older than anything in Aldmere.']
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
      const img = tileCanvas(ch, theme, v, ANIMATED.has(ch) ? frame : 0, this.tileMask(tx, ty, ch), this.tile(tx, ty - 1));
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
      ents.push({ y: sy - 0.1, draw: () => { this.drawChar(f.m.cls, f.dir, moving ? stepFrame(this.map.interior ? f.anim : p.anim) : 0, sx, sy + (f.act === 'sit' ? 3 : 0)); this.drawActivity(f, sx, sy); } });
    }
    const [px_, py_] = lerp(p, p.t);
    ents.push({ y: py_, draw: () => this.drawChar('hero', p.dir, p.t < 1 ? stepFrame(p.anim) : 0, px_, py_) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    Particles.draw(camX, camY);
    // ambience and light
    if (this.map.ambient) { ctx.fillStyle = this.map.ambient; ctx.fillRect(0, 0, W, H); }
    for (const [lx, ly, ch] of lights) {
      const [col, r] = LIGHT_TILES[ch];
      const fl = ch === 'O' || ch === 'z' ? 0.85 + Math.sin(TIME * 9 + lx) * 0.1 + Math.sin(TIME * 23) * 0.05 : 1;
      glow(lx, ly, r * fl, col);
    }
    if (this.map.dark) this.drawDarkness(px_ + 16, py_ + 16, lights);
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.38)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // area banner
    if (this.banner && this.bannerT < 3) {
      const a = this.bannerT < 0.4 ? this.bannerT / 0.4 : this.bannerT > 2.4 ? (3 - this.bannerT) / 0.6 : 1;
      ctx.globalAlpha = a;
      const bw = textWidth(this.banner, 22) + 60;
      drawWindow(W / 2 - bw / 2, 24, bw, 46);
      text(this.banner, W / 2, 36, UI.paper, 22, 'center');
      ctx.globalAlpha = 1;
    }
    // objective tracker (tutorial)
    if (this.map.tutorial && this.lock === 0) {
      const o = storyObjective();
      const lines = wrap(o, 250, 13);
      drawWindow(12, H - 22 - lines.length * 18, 278, lines.length * 18 + 16, 0.8);
      lines.forEach((l, i) => text(l, 24, H - 14 - lines.length * 18 + i * 18, UI.paper, 13, 'left', false));
    }
  }
  drawDarkness(cx, cy, lights) {
    if (!DarkCanvas) DarkCanvas = mkCanvas(W, H);
    const [dc, dx] = DarkCanvas;
    dx.globalCompositeOperation = 'source-over';
    dx.clearRect(0, 0, W, H);
    dx.fillStyle = 'rgba(6,3,10,.9)'; dx.fillRect(0, 0, W, H);
    dx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const g = dx.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); dx.fillStyle = g; dx.fillRect(x - r, y - r, r * 2, r * 2); };
    hole(cx, cy, 170 + Math.sin(TIME * 7) * 4);
    for (const [lx, ly, ch] of lights) hole(lx, ly, ch === 'L' ? 70 : 120);
    ctx.drawImage(dc, 0, 0);
    glow(cx, cy, 120, 'rgba(255,190,110,.10)');
  }
  drawChar(key, dir, frame, sx, sy, n) {
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(sx + 16, sy + 30, 10, 4, 0, 0, 7); ctx.fill();
    if (key === 'm:golem') { ctx.drawImage(monsterSprite('golem', dir === 'left', 48), sx - 8, sy - 16); return; }
    const img = charSprite(key, dir, frame);
    ctx.drawImage(img, Math.round(sx), Math.round(sy) - 2);
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
}

async function randomEncounter() {
  const map = MAPS[G.map];
  const table = encounterTable(G.map);
  const count = weighted([[1, 3], [2, 4], [3, 3]]);
  const group = [];
  for (let i = 0; i < count; i++) group.push(weighted(table));
  await startBattle(group, { bg: map.bg });
}
