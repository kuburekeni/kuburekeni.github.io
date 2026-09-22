// =====================================================================
//  world.js : overworld scene
// =====================================================================
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

class WorldScene {
  constructor() { this.lock = 0; this.banner = null; this.bannerT = 0; this.msgT = 0; }

  load(mapId, x, y, dir) {
    this.map = MAPS[mapId];
    G.map = mapId; G.x = x; G.y = y; if (dir) G.dir = dir;
    this.rows = this.map.rows; this.w = this.rows[0].length; this.h = this.rows.length;
    this.player = { x, y, fx: x, fy: y, t: 1, dir: G.dir, anim: 0 };
    this.syncFollowers();
    this.refreshNpcs(true);
    this.enc = this.rollEnc();
    this.banner = this.map.name; this.bannerT = 0;
    Sound.play(G.flags.ended && mapId === 'castle' ? 'dark' : this.map.music);
  }
  syncFollowers() {
    const p = this.player;
    this.followers = G.party.slice(1).map(() => ({ x: p.x, y: p.y, fx: p.x, fy: p.y, dir: p.dir }));
  }
  refreshNpcs(reset) {
    const old = {};
    if (!reset && this.npcs) for (const n of this.npcs) old[n.id] = n;
    this.npcs = this.map.npcs.filter(n => !n.show || flag(n.show)).map(n => old[n.id] || ({
      ...n, fx: n.x, fy: n.y, t: 1, hx: n.x, hy: n.y, wt: rand(1, 3), anim: 0
    }));
  }
  rollEnc() { return irand(16, 30); }

  tile(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this.map.edge; return this.rows[y][x]; }
  chestAt(x, y) { return this.map.chests.find(c => c.x === x && c.y === y); }
  npcAt(x, y) { return this.npcs.find(n => (n.x === x && n.y === y)); }
  bountyAt(x, y) { return G.quests.find(q => q.type === 'bounty' && q.map === G.map && q.have < q.need && q.pos[0] === x && q.pos[1] === y); }
  blocked(x, y, forNpc) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    if (SOLID.has(this.tile(x, y))) return true;
    if (this.chestAt(x, y) || this.npcAt(x, y) || this.bountyAt(x, y)) return true;
    if (forNpc) {
      if (this.player.x === x && this.player.y === y) return true;
      if (this.warpAt(x, y)) return true;
      if (this.followers.some(f => f.x === x && f.y === y)) return true;
    }
    return false;
  }
  warpAt(x, y) { return this.map.warps.find(w => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h); }
  inSafe(x, y) { return (this.map.safe || []).some(([a, b, w, h]) => x >= a && x < a + w && y >= b && y < b + h); }

  run(fn) {
    this.lock++;
    return (async () => {
      try { await fn(); }
      catch (e) { console.error(e); }
      finally { this.lock--; this.refreshNpcs(); }
    })();
  }

  update(dt) {
    G.playTime += dt;
    this.bannerT += dt;
    const p = this.player;
    const speed = Input.held('run') ? 8.5 : 5;
    // animate NPCs
    for (const n of this.npcs) {
      if (n.t < 1) { n.t = Math.min(1, n.t + dt * 3); n.anim += dt * 8; }
      else if (n.wander && this.lock === 0) {
        n.wt -= dt;
        if (n.wt <= 0) {
          n.wt = rand(1.2, 3.5);
          const d = pick(Object.keys(DIRS)); const [dx, dy] = DIRS[d];
          const nx = n.x + dx, ny = n.y + dy;
          n.dir = d;
          if (Math.abs(nx - n.hx) <= n.wander && Math.abs(ny - n.hy) <= n.wander && !this.blocked(nx, ny, true)) {
            n.fx = n.x; n.fy = n.y; n.x = nx; n.y = ny; n.t = 0;
          }
        }
      }
    }
    if (p.t < 1) {
      p.t = Math.min(1, p.t + dt * speed); p.anim += dt * speed * 2;
      for (const f of this.followers) f.t = p.t;
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
    // followers chain
    let px = p.x, py = p.y, pd = p.dir;
    for (const f of this.followers) {
      const ox = f.x, oy = f.y;
      f.fx = f.x; f.fy = f.y;
      if (f.x !== px || f.y !== py) {
        f.dir = px > f.x ? 'right' : px < f.x ? 'left' : py > f.y ? 'down' : 'up';
      }
      f.x = px; f.y = py;
      px = ox; py = oy;
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
      this.run(async () => {
        Sound.sfx('door');
        await fadeOut(0.25);
        this.load(w.to, tx, ty, p.dir);
        await fadeIn(0.25);
        await onEnterMap(w.to);
      });
      return;
    }
    // herbs
    for (const q of G.quests) {
      if (q.type !== 'gather' || q.map !== G.map) continue;
      const i = q.spots.findIndex(s => s[0] === p.x && s[1] === p.y);
      if (i >= 0) {
        q.spots.splice(i, 1); q.have++;
        Sound.sfx('pickup');
        toast(`${q.itemName} ${q.have}/${q.need}` + (q.have >= q.need ? ' — return to the quest board!' : ''), UI.hp);
      }
    }
    // encounters
    if (this.map.encounters && !this.inSafe(p.x, p.y) && !G.flags.noEncounters) {
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
    const x = p.x + dx, y = p.y + dy;
    const n = this.npcAt(x, y);
    if (n) {
      const face = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
      if (!n.spr.startsWith('m:')) n.dir = face;
      const fn = STORY[n.script];
      if (fn) this.run(() => fn(n));
      return;
    }
    const c = this.chestAt(x, y);
    if (c) { this.run(() => openChest(c)); return; }
    const bq = this.bountyAt(x, y);
    if (bq) { this.run(() => bountyBattle(bq)); return; }
    const t = this.tile(x, y);
    if (t === 'S') { const msg = this.map.signs[x + ',' + y]; if (msg) this.run(() => say(null, msg)); return; }
    if (t === 'Q') { this.run(() => questBoard()); return; }
    if (t === '~' && Math.random() < 0.3) this.run(() => say(null, pick(['The water is clear and cold.', 'A fish looks at you. You look at the fish. Nobody wins.', 'Your reflection looks tired. Being reincarnated is a lot.'])));
    if (t === 'O') this.run(() => say(null, 'The fire crackles. It\'s surprisingly cosy for the end of the world.'));
    if (t === 'D') this.run(() => say(null, pick(['Locked. Everyone here seems to prefer chatting on the doorstep.', 'The door is shut tight.'])));
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
  draw() {
    const [camX, camY] = this.camera();
    this.camX = camX; this.camY = camY;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
    const frame = Math.floor(TIME * 2) % 2;
    const theme = this.map.theme;
    for (let ty = y0; ty <= y0 + Math.ceil(H / TS); ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / TS); tx++) {
      const ch = this.tile(tx, ty);
      const v = hash2(tx, ty) % 4;
      const img = tileCanvas(ch, theme, v, ANIMATED.has(ch) ? frame : 0);
      ctx.drawImage(img, tx * TS - camX, ty * TS - camY, TS, TS);
    }
    // herbs
    for (const q of G.quests) if (q.type === 'gather' && q.map === G.map) for (const [hx, hy] of q.spots) {
      const sx = hx * TS - camX, sy = hy * TS - camY, b = Math.sin(TIME * 4 + hx) * 2;
      ctx.fillStyle = '#2f7a3a'; ctx.fillRect(sx + 12, sy + 16, 8, 10);
      ctx.fillStyle = '#c8a0ff'; ctx.fillRect(sx + 10, sy + 10 + b, 12, 6); ctx.fillRect(sx + 13, sy + 7 + b, 6, 12);
      ctx.fillStyle = '#fff'; if (Math.floor(TIME * 3 + hx) % 3 === 0) ctx.fillRect(sx + 22, sy + 6, 3, 3);
    }
    // chests
    for (const c of this.map.chests) {
      const sx = c.x * TS - camX, sy = c.y * TS - camY, open = G.flags['chest_' + c.id];
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(sx + 4, sy + 26, 24, 4);
      ctx.fillStyle = UI.ink; ctx.fillRect(sx + 3, sy + 9, 26, 19);
      ctx.fillStyle = open ? '#5a3418' : '#9a5a2a'; ctx.fillRect(sx + 5, sy + 11, 22, 15);
      ctx.fillStyle = open ? '#2a1a0a' : '#b87a3a'; ctx.fillRect(sx + 5, sy + 11, 22, 6);
      ctx.fillStyle = UI.gold; ctx.fillRect(sx + 14, sy + 16, 4, 5);
    }
    // entities, sorted by y
    const ents = [];
    const lerp = (e, t) => [(e.fx + (e.x - e.fx) * t) * TS - camX, (e.fy + (e.y - e.fy) * t) * TS - camY];
    for (const n of this.npcs) { const [sx, sy] = lerp(n, n.t); ents.push({ y: sy, draw: () => this.drawChar(n.spr, n.dir, n.t < 1 ? 1 + Math.floor(n.anim) % 2 : 0, sx, sy, n) }); }
    for (const q of G.quests) if (q.type === 'bounty' && q.map === G.map && q.have < q.need) {
      const sx = q.pos[0] * TS - camX, sy = q.pos[1] * TS - camY;
      ents.push({ y: sy, draw: () => { ctx.globalAlpha = 0.35 + Math.sin(TIME * 5) * 0.15; ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.ellipse(sx + 16, sy + 26, 18, 8, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; this.drawChar(enemySprKey(q.enemy), 'left', 0, sx, sy - Math.abs(Math.sin(TIME * 3)) * 3); text('!', sx + 16, sy - 18, UI.bad, 18, 'center'); } });
    }
    const p = this.player;
    const walkFrame = e => (e.t < 1 || this.lock === 0 && p.t < 1) ? (Math.floor(p.anim) % 4 === 1 ? 1 : Math.floor(p.anim) % 4 === 3 ? 2 : 0) : 0;
    this.followers.forEach((f, i) => {
      const [sx, sy] = lerp(f, p.t);
      const m = G.party[i + 1];
      if (m) ents.push({ y: sy - 0.1, draw: () => this.drawChar(m.cls, f.dir, p.t < 1 ? walkFrame(p) : 0, sx, sy) });
    });
    const [px, py] = lerp(p, p.t);
    ents.push({ y: py, draw: () => this.drawChar('hero', p.dir, p.t < 1 ? walkFrame(p) : 0, px, py) });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    // darkness in caves
    if (this.map.dark) {
      const g = ctx.createRadialGradient(px + 16, py + 16, 60, px + 16, py + 16, 260);
      g.addColorStop(0, 'rgba(8,4,12,0)'); g.addColorStop(1, 'rgba(8,4,12,.82)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (G.map === 'castle') { ctx.fillStyle = 'rgba(80,0,40,.12)'; ctx.fillRect(0, 0, W, H); }
    if (G.map === 'wastes') { ctx.fillStyle = 'rgba(120,30,10,.08)'; ctx.fillRect(0, 0, W, H); }
    // area banner
    if (this.banner && this.bannerT < 3) {
      const a = this.bannerT < 0.4 ? this.bannerT / 0.4 : this.bannerT > 2.4 ? (3 - this.bannerT) / 0.6 : 1;
      ctx.globalAlpha = a;
      const bw = textWidth(this.banner, 22) + 60;
      drawWindow(W / 2 - bw / 2, 24, bw, 46);
      text(this.banner, W / 2, 36, UI.paper, 22, 'center');
      ctx.globalAlpha = 1;
    }
  }
  drawChar(key, dir, frame, sx, sy, n) {
    const img = charSprite(key, dir, frame);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(sx + 16, sy + 29, 10, 4, 0, 0, 7); ctx.fill();
    if (key === 'm:golem') { ctx.drawImage(img, sx - 8, sy - 16, 48, 48); return; }
    ctx.drawImage(img, Math.round(sx), Math.round(sy) - 2, TS, TS);
    if (n && n.id === 'lyraTied') { ctx.strokeStyle = '#c8a86a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + 6, sy + 18); ctx.lineTo(sx + 26, sy + 22); ctx.moveTo(sx + 6, sy + 22); ctx.lineTo(sx + 26, sy + 18); ctx.stroke(); }
  }
}

function enemySprKey(id) {
  const s = ENEMIES[id].spr;
  return MONSTERS[s] ? 'm:' + s : s;
}

async function openChest(c) {
  if (G.flags['chest_' + c.id]) { await say(null, 'The chest is empty.'); return; }
  G.flags['chest_' + c.id] = true;
  Sound.sfx('chest');
  if (c.gold) { G.gold += c.gold; await say(null, `You found ${c.gold} G!`); }
  else { addItem(c.item, c.qty); await say(null, `You found ${c.qty > 1 ? c.qty + '× ' : 'a '}${ITEMS[c.item].name}!`); }
}

async function randomEncounter() {
  const map = MAPS[G.map];
  const count = weighted([[1, 3], [2, 4], [3, 3]]);
  const group = [];
  for (let i = 0; i < count; i++) group.push(weighted(map.encounters));
  await startBattle(group, { bg: map.bg });
}
