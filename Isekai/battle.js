// =====================================================================
//  battle.js : turn-based combat
//   · you control the hero; companions fight on their own
//   · the hero has a time limit per turn (shorter the bigger the party)
//   · attacks use a timing bar, blade skills a chain of presses, spells a
//     rune sequence; enemy blows can be parried on reaction
//   · every enemy has a Break gauge; break it and it reels
//   · the party shares a Resolve gauge that pays for team techniques
// =====================================================================
const BG = {
  forest: ['#6fa8c8', '#cfe6c4', '#4f8a3e', '#2f5a28'],
  cave: ['#0c0808', '#241a18', '#3e3028', '#241c16'],
  wastes: ['#2a0e10', '#a8401e', '#4e4448', '#2e2629'],
  castle: ['#0a0614', '#34163c', '#342a48', '#1e182e'],
  dojo: ['#3a2a1a', '#8a6a44', '#b8905c', '#8a6a44'],
  village: ['#8ac0e0', '#f0e0c0', '#5ea84a', '#3a7a30'],
  road: ['#7ab4dc', '#f2e6c0', '#6aa84e', '#3f6f33'],
  yard: ['#8ac0e0', '#e8dcc0', '#8a7a58', '#5a4a34'],
  night: ['#0d1230', '#2a3468', '#2a4030', '#16241c']
};
const PS = 96; // size party members are drawn at in battle (exactly 3x the 32px sprite, so pixels stay square)
const ELEM_COL = { fire: '#f07a2a', ice: '#9ae0ff', thunder: '#f2e94c', dark: '#b04aff', holy: '#ffe9a0', heal: '#7ed36f', none: '#ffffff' };
const STATUS_ICON = {
  burn: ['🔥', '#f07a2a'], poison: ['☠', '#9ad84a'], freeze: ['❄', '#9ae0ff'], slow: ['⏳', '#b0a8c0'],
  blind: ['◐', '#8a84a0'], weak: ['▼', '#c86a6a'], marked: ['◎', '#f2c94c'], regen: ['✚', '#7ed36f'],
  shield: ['⬡', '#6fb7f2'], cover: ['⛨', '#f2c94c'], riposte: ['⚔', '#f28fad'], evade: ['≈', '#cfd8e8'],
  taunt: ['!', '#e5534b'], rage: ['▲', '#e5534b'], guard: ['⬛', '#8a93a6'], stun: ['✦', '#f2c94c'], broken: ['✸', '#f2a33a']
};

// ---------------------------------------------------------------- turn clock
const BattleClock = {
  active: false, t: 0, max: 0, paused: false, onExpire: null,
  start(max, onExpire) { this.active = true; this.t = max; this.max = max; this.onExpire = onExpire; this.paused = false; },
  stop() { this.active = false; this.onExpire = null; },
  update(dt) {
    if (!this.active || this.paused) return;
    this.t -= dt;
    if (this.t <= 0) { this.t = 0; this.active = false; const f = this.onExpire; this.onExpire = null; if (f) f(); }
  }
};

function areaScale(mapId) {
  if (!G.postgame) return 1;
  const al = (MAPS[mapId] && MAPS[mapId].lvl) || 3;
  return Math.max(1, partyLevel() / al);
}

function makeEnemy(g, mapId) {
  const id = typeof g === 'string' ? g : g.id;
  const d = ENEMIES[id];
  const s = d.boss || (d.human && id !== 'bandit') ? 1 : areaScale(mapId);
  const e = {
    id, name: d.name, sprKey: enemySprKey(id), boss: !!d.boss, king: !!d.king, human: !!d.human, demon: !!d.demon,
    maxhp: Math.floor(d.hp * Math.pow(s, 1.15)), atk: Math.floor(d.atk * Math.pow(s, 0.9)), def: Math.floor(d.def * Math.pow(s, 0.9)),
    mag: Math.floor(d.mag * Math.pow(s, 0.9)), spd: d.spd, xp: Math.floor(d.xp * s), gold: Math.floor(d.gold * s),
    weak: d.weak, resist: d.resist, skills: (d.skills || []).slice(), ai: d.ai || [], status: {}, enemy: true,
    flash: 0, shake: 0, alpha: 1, lunge: 0, pose: '', swing: 0
  };
  if (g.elite) {
    e.name = g.elite.name; e.elite = true;
    e.maxhp = Math.floor(e.maxhp * 3 * g.elite.mult); e.atk = Math.floor(e.atk * 1.35 * g.elite.mult);
    e.def = Math.floor(e.def * 1.3 * g.elite.mult); e.mag = Math.floor(e.mag * 1.35 * g.elite.mult);
    e.xp *= 5; e.gold *= 6; e.spd += 2;
  }
  if (g.half) { e.maxhp = Math.max(6, Math.floor(e.maxhp * 0.45)); e.xp = Math.floor(e.xp * 0.4); e.gold = Math.floor(e.gold * 0.4); e.name += ' (split)'; }
  e.hp = e.maxhp;
  e.brkMax = Math.max(20, d.brk || Math.round(20 + e.maxhp * 0.35));
  e.brk = e.brkMax;
  const mon = e.sprKey.startsWith('m:');
  e.size = id === 'king' ? 176 : id === 'golem' ? 168 : id === 'treant' ? 140 : (id === 'chief' || id === 'duel') ? 120 : e.elite ? 112 : 96;
  return e;
}

class BattleScene {
  constructor(group, opts) {
    this.opts = opts || {};
    this.bg = BG[this.opts.bg] ? this.opts.bg : 'forest';
    this.enemies = group.map(g => makeEnemy(g, G.map));
    this.nameEnemies();
    this.layoutEnemies();
    for (const m of G.party) { m.status = {}; m.defending = false; m.lunge = 0; m.flash = 0; m.shake = 0; m.pose = ''; m.swing = 0; }
    this.msg = ''; this.fx = []; this.shakeT = 0; this.flashT = 0; this.cross = null;
    this.active = null; this.okWaiter = null; this.round = 0; this.strike = null;
    this.resolve = this.opts.resolve || 0;
    this.isBoss = this.enemies.some(e => e.boss);
    this.noRun = this.opts.noRun || this.isBoss || this.opts.tutorial || this.opts.spar || this.opts.permadeath;
    this.score = 0;   // used by the childhood training bout
  }
  nameEnemies() {
    const counts = {};
    for (const e of this.enemies) counts[e.name] = (counts[e.name] || 0) + 1;
    const seen = {};
    for (const e of this.enemies) if (counts[e.name] > 1) { seen[e.name] = (seen[e.name] || 0) + 1; e.name += ' ' + 'ABCD'[seen[e.name] - 1]; }
  }
  layoutEnemies() {
    const n = this.enemies.length;
    this.enemies.forEach((e, i) => {
      e.x = 54 + (i + 0.5) * (300 / n);
      e.y = 300 + (n > 1 ? (i % 2 ? 20 : -16) : 0) + (i > 2 ? 12 : 0);
    });
  }
  // feet positions: leader in front, the rest staggered behind
  memberPos(m) {
    const i = G.party.indexOf(m);
    const slots = [[W - 262, 318], [W - 196, 262], [W - 150, 322], [W - 122, 262]];
    return slots[i] || slots[0];
  }

  // ------------------------------------------------------------ helpers
  async say(m, t = 0.75) { this.msg = m; await wait(Input.held('ok') ? t * 0.5 : t); }
  waitOk() { return new Promise(r => this.okWaiter = r); }
  aliveEnemies() { return this.enemies.filter(e => e.hp > 0); }
  aliveParty() { return G.party.filter(m => m.hp > 0); }
  S(u, k) {
    if (!u.enemy) return stat(u, k);
    let v = u[k];
    const st = u.status || {};
    if (k === 'def' && st.guard) v *= 2;
    if (k === 'def' && st.broken) v *= 0.5;
    if (k === 'atk' && st.rage) v *= 1.4;
    if (k === 'atk' && st.weak) v *= 0.7;
    if (k === 'spd' && st.slow) v *= 0.5;
    return v;
  }
  pos(u) { if (u.enemy) return [u.x, u.y - u.size / 2]; const [x, y] = this.memberPos(u); return [x + PS / 2, y - PS / 2]; }
  num(u, txt, col, big) { const [x, y] = this.pos(u); this.fx.push({ type: 'num', x: x + rand(-8, 8), y: y - 10, txt: String(txt), col, t: 0, dur: 1.0, big }); }
  // ------------------------------------------------------------ particles
  part(o) { (this.parts || (this.parts = [])).push(Object.assign({ t: 0, life: 0.6, vx: 0, vy: 0, g: 0, drag: 0.9, sz: 3, add: true, delay: 0 }, o)); }
  impact(u, crit, col) {
    const [x, y] = this.pos(u), c = col && col.startsWith('#') ? col : '#ffffff';
    const n = crit ? 22 : 12;
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.283), s = rand(90, crit ? 340 : 230);
      this.part({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, g: 520, drag: 0.93, life: rand(0.25, 0.5), col: i % 3 ? c : '#ffffff', sz: crit ? 4 : 3 });
    }
    this.part({ k: 'ring', x, y, life: crit ? 0.35 : 0.25, col: c, r: crit ? 70 : 44, add: true });
    if (crit) this.part({ k: 'star', x, y, life: 0.22, col: '#fff8d0', r: 90 });
    this.punch = crit ? 0.2 : 0.1; this.punchX = x; this.punchY = y;
  }
  // defeated foes come apart into their own pixels, top row first
  dissolve(u) {
    const mon = u.sprKey.startsWith('m:');
    const img = mon ? monsterSprite(u.sprKey.slice(2), false, 48) : charSprite(u.sprKey, 'right', 0, 'hurt');
    const w = img.width, h = img.height, sc = u.size / w;
    let d; try { d = img.getContext('2d').getImageData(0, 0, w, h).data; } catch (e) { return; }
    const x0 = u.x - u.size / 2 - u.lunge, y0 = u.y - u.size, step = w > 40 ? 2 : 1;
    for (let Y = 0; Y < h; Y += step) for (let X = 0; X < w; X += step) {
      const i = (Y * w + X) * 4; if (d[i + 3] < 128) continue;
      this.part({ k: 'pix', x: x0 + (X + step / 2) * sc, y: y0 + (Y + step / 2) * sc, vx: rand(-30, 30) + (X - w / 2) * 2, vy: rand(-90, -30), g: -40, drag: 0.97,
        life: rand(0.5, 0.9), delay: Y / h * 0.45 + rand(0, 0.08), col: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`, sz: Math.ceil(step * sc), add: false });
    }
    for (let i = 0; i < 16; i++) this.part({ k: 'mote', x: u.x + rand(-u.size * 0.3, u.size * 0.3), y: u.y - rand(0, u.size), vx: rand(-20, 20), vy: rand(-80, -30), life: rand(0.6, 1.1), col: '#fff4d8', sz: 2, delay: rand(0, 0.4) });
  }
  // every spell or strike effect sheds particles when it starts
  emitFor(f) {
    const { x, y } = f, C = f.col || '#ffffff';
    const P = o => this.part(o);
    switch (f.type) {
      case 'slash': for (let i = 0; i < 8; i++) { const a = -0.9 + f.seed + rand(0, 2.4); P({ k: 'spark', x: x + Math.cos(a) * 46, y: y + Math.sin(a) * 46, vx: Math.cos(a + 1.57) * rand(60, 160), vy: Math.sin(a + 1.57) * rand(60, 160), g: 300, life: 0.3, col: i % 2 ? C : '#fff', sz: 2 }); } break;
      case 'flame': for (let i = 0; i < 26; i++) P({ k: 'ember', x: x + rand(-30, 30), y: y + rand(-10, 30), vx: rand(-30, 30), vy: rand(-180, -60), g: -60, drag: 0.95, life: rand(0.5, 1), col: pick(['#ffe070', '#f07a2a', '#ffb040', '#fff4c0']), sz: pick([2, 3, 4]), delay: rand(0, 0.25) }); break;
      case 'ice': for (let i = 0; i < 18; i++) { const a = rand(0, 6.283); P({ k: 'shard', x, y, vx: Math.cos(a) * rand(80, 220), vy: Math.sin(a) * rand(80, 220) - 60, g: 420, life: rand(0.5, 0.8), col: pick(['#e8f8ff', '#9ae0ff', '#bfe6ff']), sz: 3, rot: a, delay: 0.18 }); }
        for (let i = 0; i < 10; i++) P({ k: 'mist', x: x + rand(-40, 40), y: y + rand(-20, 30), vx: rand(-20, 20), vy: rand(-10, 5), life: 1, col: '#dff4ff', r: rand(14, 26), add: false }); break;
      case 'bolt': for (let i = 0; i < 20; i++) { const a = rand(0, 6.283); P({ k: 'zap', x, y, vx: Math.cos(a) * rand(120, 300), vy: Math.sin(a) * rand(120, 300), life: rand(0.15, 0.35), col: i % 2 ? '#fff8a0' : '#ffffff', sz: 2, delay: 0.05 }); } break;
      case 'holy': for (let i = 0; i < 22; i++) P({ k: 'mote', x: x + rand(-40, 40), y: y + rand(-10, 40), vx: rand(-10, 10), vy: rand(-110, -40), life: rand(0.7, 1.2), col: pick(['#fff4c0', '#ffffff', '#ffe9a0']), sz: pick([2, 3]), delay: rand(0, 0.3) }); break;
      case 'dark': for (let i = 0; i < 24; i++) { const a = rand(0, 6.283), r = rand(60, 110); P({ k: 'orbit', x, y, a, r, spin: rand(4, 7), life: rand(0.6, 0.9), col: pick(['#b04aff', '#6a20b0', '#e0a0ff']), sz: 3, add: false }); } break;
      case 'heal': for (let i = 0; i < 14; i++) P({ k: 'plus', x: x + rand(-34, 34), y: y + rand(-10, 40), vy: rand(-80, -40), life: rand(0.7, 1), col: pick(['#b0ffb0', '#ffffff', '#7ed36f']), sz: 2, delay: rand(0, 0.35) }); break;
      case 'break': for (let i = 0; i < 26; i++) { const a = rand(0, 6.283); P({ k: 'shard', x, y, vx: Math.cos(a) * rand(120, 360), vy: Math.sin(a) * rand(120, 360) - 80, g: 600, life: rand(0.5, 0.9), col: pick([UI.brk, '#ffffff', '#ffd890']), sz: 4, rot: a }); } this.shakeT = Math.max(this.shakeT, 0.25); break;
      case 'burst': for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; P({ k: 'spark', x, y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, g: 200, life: 0.4, col: C, sz: 3 }); } break;
      case 'circle': for (let i = 0; i < 16; i++) { const a = rand(0, 6.283); P({ k: 'mote', x: x + Math.cos(a) * 40, y: y + Math.sin(a) * 12, vx: 0, vy: rand(-90, -40), life: rand(0.5, 0.9), col: C, sz: 2, delay: rand(0, 0.3) }); } break;
      case 'charge': for (let i = 0; i < 18; i++) { const a = rand(0, 6.283), r = rand(70, 110); P({ k: 'suck', x, y, a, r, life: rand(0.4, 0.7), col: '#ff9080', sz: 2 }); } break;
      case 'team': for (let i = 0; i < 24; i++) { const t = Math.random(); P({ k: 'mote', x: f.x + (f.x2 - f.x) * t, y: f.y + (f.y2 - f.y) * t, vx: rand(-40, 40), vy: rand(-60, 20), life: rand(0.4, 0.8), col: '#f7b8cc', sz: 3 }); } break;
    }
  }
  drawParts() {
    if (!this.parts || !this.parts.length) return;
    for (const p of this.parts) {
      if (p.t < 0) continue;
      const q = p.t / p.life;
      ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      ctx.globalAlpha = p.k === 'pix' ? (q < 0.6 ? 1 : (1 - q) / 0.4) : Math.max(0, 1 - q);
      ctx.fillStyle = p.col;
      switch (p.k) {
        case 'ring': ctx.strokeStyle = p.col; ctx.lineWidth = 6 * (1 - q) + 1; ctx.beginPath(); ctx.arc(p.x, p.y, 10 + q * p.r, 0, 7); ctx.stroke(); break;
        case 'star': { const r = p.r * (0.4 + q); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, rr = i % 2 ? r * 0.18 : r; ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); } ctx.fill(); break; }
        case 'mist': ctx.globalAlpha *= 0.3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + q), 0, 7); ctx.fill(); break;
        case 'shard': { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + p.t * 9); ctx.fillRect(-p.sz / 2, -p.sz * 1.5, p.sz, p.sz * 3); ctx.restore(); break; }
        case 'zap': ctx.fillRect(p.x, p.y, p.sz, p.sz); ctx.fillRect(p.x - p.vx * 0.02, p.y - p.vy * 0.02, 1, 1); break;
        case 'plus': ctx.fillRect(p.x - 3, p.y - 1, 7, 2); ctx.fillRect(p.x - 1, p.y - 3, 2, 7); break;
        case 'orbit': case 'suck': { const r = p.k === 'suck' ? p.r * (1 - q) : p.r * (1 - q * 0.7), a = p.a + p.t * (p.spin || 3); ctx.fillRect(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.55, p.sz, p.sz); break; }
        case 'spark': case 'ember': ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz); if (p.k === 'spark') { ctx.globalAlpha *= 0.5; ctx.fillRect(p.x - p.vx * 0.015, p.y - p.vy * 0.015, 2, 2); } break;
        default: ctx.fillRect(Math.round(p.x - p.sz / 2), Math.round(p.y - p.sz / 2), p.sz, p.sz);
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.lineWidth = 1;
  }
  burst(u, col) { const [x, y] = this.pos(u); this.fx.push({ type: 'burst', x, y, col, t: 0, dur: 0.5 }); }
  effect(u, kind, col) { const [x, y] = this.pos(u); this.fx.push({ type: kind, x, y, col, t: 0, dur: kind === 'bolt' ? 0.45 : 0.7, seed: Math.random() * 99 }); }
  gainResolve(v) { this.resolve = clamp(this.resolve + v, 0, 100); }

  calc(src, tgt, sk, mult = 1) {
    let dmg, crit = false, tag = '';
    const def = this.S(tgt, 'def');
    if (sk.kind === 'mag') dmg = (sk.power || 0) + this.S(src, 'mag') * (sk.mult || 1) - def * 0.3;
    else if (sk.kind === 'hybrid') dmg = (this.S(src, 'atk') + this.S(src, 'mag')) * 0.55 * (sk.mult || 1) - def * 0.4;
    else {
      dmg = this.S(src, 'atk') * (sk.mult || 1) - def * (sk.pierce ? 0.2 : 0.5);
      const cc = (sk.crit || 0) + 0.07 + (!src.enemy && src.cls !== 'hero' && moraleOf(src.cls) > 85 ? 0.08 : 0);
      if (Math.random() < cc) { crit = true; dmg *= 1.6; }
    }
    dmg *= rand(0.92, 1.08) * mult;
    if (mult >= 1.3) crit = true;
    if (sk.elem && tgt.weak === sk.elem) { dmg *= 1.6; tag = 'weak'; }
    if (sk.elem && tgt.resist === sk.elem) { dmg *= 0.5; tag = 'resist'; }
    if (tgt.status && tgt.status.marked) dmg *= 1.3;
    if (tgt.status && tgt.status.broken) dmg *= 1.5;
    if (sk.brokenBonus && tgt.status && tgt.status.broken) dmg *= sk.brokenBonus;
    if (tgt.status && tgt.status.shield && !sk.pierce) dmg *= 0.75;
    if (tgt.defending) dmg *= 0.5;
    if (src.status && src.status.blind && sk.kind === 'phys' && Math.random() < 0.4) return { dmg: 0, miss: true, crit: false, tag: '' };
    return { dmg: Math.max(1, Math.round(dmg)), crit, tag };
  }

  // Break: chip the gauge, and when it empties the enemy reels
  async chip(tgt, sk, r) {
    if (!tgt.enemy || tgt.hp <= 0 || tgt.status.broken) return;
    let amount = sk.brk || (sk.kind === 'phys' ? 12 : sk.kind === 'mag' ? 9 : 10);
    if (r && r.tag === 'weak') amount += 14;
    if (r && r.crit) amount *= 1.3;
    if (tgt.status.marked) amount *= 1.5;
    tgt.brk = Math.max(0, tgt.brk - Math.round(amount));
    if (tgt.brk <= 0) {
      tgt.status.broken = 2;
      delete tgt.charging;
      tgt.brk = 0;
      Sound.sfx('crash'); this.shakeT = 0.4; this.flashT = 0.25;
      this.effect(tgt, 'break', UI.brk);
      this.gainResolve(15);
      await this.say(`BREAK! ${tgt.name} reels — defence down, and it loses its next move.`, 1.1);
    }
  }

  async hurt(tgt, amount, col = '#ffffff', crit) {
    tgt.hp = Math.max(0, tgt.hp - amount);
    if (!tgt.enemy && tgt.hp <= 0 && (this.opts.tutorial || this.opts.spar || this.opts.training)) tgt.hp = 0;
    tgt.flash = 0.3; tgt.shake = 0.3;
    if (!tgt.enemy) { tgt.pose = 'hurt'; setTimeout(() => { if (tgt.hp > 0) tgt.pose = ''; }, 260); this.gainResolve(Math.min(14, amount / maxHP(tgt) * 40)); }
    if (tgt.status && tgt.status.freeze) { delete tgt.status.freeze; this.num(tgt, 'THAW', UI.mp); }
    this.num(tgt, amount, crit ? UI.gold : col, crit);
    this.impact(tgt, crit, col);
    if (crit) this.shakeT = 0.3;
    Sound.sfx(tgt.enemy ? (crit ? 'crit' : 'hit') : 'hurt');
    if (tgt.hp <= 0) {
      if (tgt.enemy) { Sound.sfx('enemyDie'); this.dissolve(tgt); tween(tgt, { alpha: 0 }, 0.3); }
      else { tgt.status = {}; }
    }
  }
  heal(tgt, amount) {
    const b = tgt.hp; tgt.hp = Math.min(tgt.enemy ? tgt.maxhp : maxHP(tgt), tgt.hp + amount);
    this.num(tgt, tgt.hp - b, UI.hp); this.effect(tgt, 'heal', ELEM_COL.heal);
    return tgt.hp - b;
  }
  retarget(src, tgt) {
    if (tgt && tgt.hp > 0) {
      // someone covering steps in front
      if (!tgt.enemy) {
        const cov = this.aliveParty().find(m => m.status.cover && m !== tgt);
        if (cov && tgt.hp < maxHP(tgt) * 0.5) return cov;
      }
      return tgt;
    }
    const pool = tgt && tgt.enemy ? this.aliveEnemies() : this.aliveParty();
    return pool.length ? pick(pool) : null;
  }

  // ------------------------------------------------------------ the hero's timed turn
  async heroTurn(m) {
    this.active = m;
    m.pose = 'ready';
    let expire;
    const timeout = new Promise(r => expire = r);
    BattleClock.start(turnTime(), () => {
      while (Scenes.top() !== this && Scenes.stack.includes(this)) Scenes.pop(); // close any open menu
      this.strike = null;
      expire('timeout');
    });
    if (this.opts.tutorial && !this.tutorialShown) { BattleClock.paused = true; await this.tutorial(); BattleClock.paused = false; }
    let a = await Promise.race([this.commandFor(m), timeout]);
    if (a !== 'timeout' && a && this.needsInput(a)) {
      const res = await Promise.race([this.runInput(a), timeout]);
      if (res === 'timeout' || res === 'miss') a = 'miss';
      else a.mult = res;
    }
    BattleClock.stop();
    this.active = null;
    m.pose = '';
    if (a === 'timeout' || a === 'miss') return this.autoGuard(m, a === 'timeout');
    return a;
  }
  needsInput(a) {
    if (a.type === 'attack') return true;
    if (a.type === 'skill') { const k = SKILLS[a.skill].kind; return k === 'phys' || k === 'mag' || k === 'hybrid'; }
    return false;
  }
  async autoGuard(m, late) {
    const loss = Math.max(1, Math.round(maxHP(m) * 0.02));
    m.hp = Math.max(1, m.hp - loss);
    m.defending = true;
    m.shake = 0.3; this.num(m, loss, UI.bad);
    Sound.sfx('miss');
    await this.say(late ? `Too slow! ${m.name} falls back into a guard. (−${loss} HP)` : `Missed! ${m.name} falls back into a guard. (−${loss} HP)`, 1.1);
    return { type: 'guarded', src: m };
  }
  runInput(a) {
    const sk = a.type === 'skill' ? SKILLS[a.skill] : null;
    const kind = sk ? sk.kind : 'phys';
    let s;
    if (sk && sk.input === 'chain') s = new ChainScene(this, sk);
    else if (sk && sk.input === 'glyph') s = new GlyphScene(this, sk);
    else s = new StrikeScene(this, kind, sk ? sk.name : 'Attack');
    Scenes.push(s);
    this.strike = s;
    return s.promise;
  }

  async commandFor(m) {
    while (true) {
      const ready = this.resolve >= 100;
      const cmds = [
        { label: 'Attack' }, { label: 'Skill' }, { label: 'Item' },
        { label: 'Resolve' + (ready ? ' ★' : ''), disabled: !ready, color: ready ? UI.sakura : undefined },
        { label: 'Defend' }, { label: 'Run', disabled: this.noRun }
      ];
      const c = await list({ x: 16, y: H - 178, w: 200, items: cmds, rows: 6, rowH: 24, showDesc: false, cancel: false, index: m._lastCmd || 0 });
      if (c < 0) continue;
      m._lastCmd = c;
      if (c === 0) { const t = await this.pickTarget('enemy'); if (t) return { type: 'attack', src: m, tgt: t }; }
      if (c === 1) {
        const sk = knownSkills(m);
        const items = sk.map(s => ({ label: SKILLS[s].name, right: SKILLS[s].mp + ' MP', desc: SKILLS[s].desc, disabled: m.mp < SKILLS[s].mp }));
        const i = await list({ x: 16, y: 72, w: 380, items, title: `${m.name} — ${m.mp} MP`, rows: 6, index: m._lastSkill || 0 });
        if (i < 0) continue;
        m._lastSkill = i;
        const s = SKILLS[sk[i]];
        const t = await this.pickTarget(s.target, m);
        if (t) return { type: 'skill', src: m, skill: sk[i], tgt: t };
      }
      if (c === 2) {
        const ids = Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].type === 'use');
        const items = ids.map(k => ({ label: ITEMS[k].name, right: '×' + G.inv[k], desc: ITEMS[k].desc }));
        const i = await list({ x: 16, y: 72, w: 380, items, title: 'Items', rows: 6, empty: 'No items.' });
        if (i < 0 || !ids.length) continue;
        const it = ITEMS[ids[i]];
        if (it.resolve) return { type: 'item', src: m, item: ids[i], tgt: m };
        const t = await this.pickTarget(it.target, m);
        if (t) return { type: 'item', src: m, item: ids[i], tgt: t };
      }
      if (c === 3) {
        const techs = this.resolveTechs(m);
        const items = techs.map(t => ({ label: t.name, right: t.who, desc: SKILLS[t.id].desc }));
        const i = await list({ x: 16, y: 72, w: 400, items, title: 'Resolve — the gauge empties when you use it', rows: 6 });
        if (i < 0) continue;
        return { type: 'skill', src: m, skill: techs[i].id, tgt: SKILLS[techs[i].id].target === 'enemy' ? await this.pickTarget('enemy') : SKILLS[techs[i].id].target, resolve: true, partner: techs[i].partner };
      }
      if (c === 4) return { type: 'defend', src: m };
      if (c === 5) return { type: 'run', src: m };
    }
  }
  resolveTechs(m) {
    const out = [];
    const own = { blade: 'crossingB', mage: 'crossingM', none: 'crossingH' }[G.heroClass || 'none'];
    out.push({ id: own, name: SKILLS[own].name, who: 'alone' });
    for (const c of this.aliveParty()) {
      if (c.cls === 'hero') continue;
      const id = 't_' + c.cls;
      if (SKILLS[id]) out.push({ id, name: SKILLS[id].name, who: 'with ' + c.name, partner: c });
    }
    return out;
  }
  async pickTarget(kind, src) {
    if (kind === 'enemies' || kind === 'allies' || kind === 'self') return kind;
    let pool;
    if (kind === 'enemy') pool = this.aliveEnemies();
    else if (kind === 'dead') pool = G.party.filter(m => m.hp <= 0);
    else pool = this.aliveParty();
    if (!pool.length) { Sound.sfx('buzz'); return null; }
    const ts = new TargetScene(this, pool, kind === 'enemy' ? 0 : Math.max(0, pool.indexOf(src)));
    Scenes.push(ts);
    return await ts.promise;
  }

  // ------------------------------------------------------------ companions decide for themselves
  allyAI(m) {
    const party = this.aliveParty(), foes = this.aliveEnemies();
    const known = knownSkills(m);
    const has = s => known.includes(s) && m.mp >= SKILLS[s].mp;
    const morale = moraleOf(m.cls);
    if (morale < 28 && Math.random() < 0.22) return { type: 'sulk', src: m };
    const down = G.party.filter(p => p.hp <= 0);
    if (down.length && has('raise') && Math.random() < 0.9) return { type: 'skill', src: m, skill: 'raise', tgt: down[0] };
    const sick = party.find(p => p.status.poison || p.status.burn || p.status.freeze || p.status.blind);
    if (sick && has('cure') && Math.random() < 0.6) return { type: 'skill', src: m, skill: 'cure', tgt: sick };
    const hurt = party.filter(p => p.hp < maxHP(p) * 0.45);
    if (hurt.length >= 2 && has('healall')) return { type: 'skill', src: m, skill: 'healall', tgt: 'allies' };
    if (hurt.length && has('heal')) return { type: 'skill', src: m, skill: 'heal', tgt: hurt.sort((a, b) => a.hp / maxHP(a) - b.hp / maxHP(b))[0] };
    const hero = G.party[0];
    if (m.cls === 'garrick') {
      if (hero.hp > 0 && hero.hp < maxHP(hero) * 0.55 && has('taunt') && !m.status.taunt) return { type: 'skill', src: m, skill: 'taunt', tgt: 'self' };
      if (this.isBoss && this.round % 4 === 1 && has('ironwill') && !m.status.shield) return { type: 'skill', src: m, skill: 'ironwill', tgt: 'allies' };
    }
    if (m.cls === 'wren' && hero.hp > 0 && hero.hp < maxHP(hero) * 0.4 && has('cover') && !m.status.cover) return { type: 'skill', src: m, skill: 'cover', tgt: 'self' };
    if (m.cls === 'kestrel' && foes.length && has('mark')) { const big = foes.slice().sort((a, b) => b.hp - a.hp)[0]; if (!big.status.marked && Math.random() < 0.5) return { type: 'skill', src: m, skill: 'mark', tgt: big }; }
    if (m.cls === 'sable' && has('steal') && this.round === 1 && Math.random() < 0.5) return { type: 'skill', src: m, skill: 'steal', tgt: pick(foes) };
    if (m.cls === 'oswin' && foes.some(f => f.demon) && has('sanctus')) return { type: 'skill', src: m, skill: 'sanctus', tgt: foes.find(f => f.demon) };
    // otherwise, hit whatever gives the best return
    const reserve = (m.cls === 'lyra' || m.cls === 'oswin') ? 6 : 0;
    const opts = known.map(s => [s, SKILLS[s]]).filter(([, s]) => (s.kind === 'phys' || s.kind === 'mag' || s.kind === 'hybrid') && m.mp - s.mp >= reserve && (!s.hpCost || m.hp > maxHP(m) * (s.hpCost + 0.15)));
    let best = null, bestScore = 0;
    for (const [id, s] of opts) {
      for (const t of (s.target === 'enemies' ? [foes[0]] : foes)) {
        if (!t) continue;
        let score = (s.kind === 'mag' ? (s.power || 0) + stat(m, 'mag') * (s.mult || 1) : stat(m, 'atk') * (s.mult || 1)) * (s.hits || 1);
        if (s.elem && t.weak === s.elem) score *= 1.6;
        if (s.elem && t.resist === s.elem) score *= 0.5;
        if (s.target === 'enemies') score *= Math.min(foes.length, 3) * 0.8;
        if (s.brokenBonus && t.status.broken) score *= s.brokenBonus;
        if (s.stun && !t.boss) score *= 1.15;
        if (score > bestScore) { bestScore = score; best = { type: 'skill', src: m, skill: id, tgt: s.target === 'enemies' ? 'enemies' : t }; }
      }
    }
    const atkScore = stat(m, 'atk');
    if (best && bestScore > atkScore * 1.15 && Math.random() < 0.85) return best;
    const weakest = foes.slice().sort((a, b) => (a.status.broken ? -1 : 0) - (b.status.broken ? -1 : 0) || a.hp - b.hp)[0];
    return { type: 'attack', src: m, tgt: weakest };
  }

  // ------------------------------------------------------------ main loop
  async run() {
    const names = this.enemies.map(e => e.name);
    await this.say(this.opts.intro || (this.isBoss ? `${this.enemies.find(e => e.boss).name} stands before you.` : names.length === 1 ? `${ENEMIES[this.enemies[0].id].human ? '' : 'A '}${names[0]} appears!` : `${names.length} enemies appear!`), 1.0);
    while (true) {
      this.round++;
      if (this.opts.maxRounds && this.round > this.opts.maxRounds) return 'time';
      const acts = [];
      this.msg = '';
      for (const m of this.aliveParty()) {
        if (m.status.stun) { acts.push({ type: 'stunned', src: m }); continue; }
        if (m.status.freeze) { acts.push({ type: 'frozen', src: m }); continue; }
        if (m.cls === 'hero') { this.msg = `${m.name}'s turn.`; acts.push(await this.heroTurn(m)); }
        else acts.push(this.allyAI(m));
      }
      for (const e of this.aliveEnemies()) {
        const times = e.twice ? 2 : 1;
        for (let k = 0; k < times; k++) acts.push(e.status.stun || e.status.broken ? { type: 'stunned', src: e } : this.enemyAI(e));
      }
      for (const a of acts) a.ord = a.type === 'defend' || a.type === 'guarded' ? 999 : a.type === 'run' ? 998 : (a.skill && SKILLS[a.skill] && SKILLS[a.skill].first ? 9999 : this.S(a.src, 'spd') * rand(0.8, 1.2));
      acts.sort((a, b) => b.ord - a.ord);
      for (const a of acts) {
        if (a.src.hp <= 0) continue;
        const r = await this.exec(a);
        if (r === 'run') return 'run';
        if (!this.aliveEnemies().length) return await this.victory();
        if (!this.aliveParty().length) {
          if (this.opts.tutorial || this.opts.spar || this.opts.training) { await this.say(this.opts.training ? 'You go down on one knee, breathing hard. The bout is over.' : this.opts.spar ? 'You drop to one knee. The duel is over.' : 'Daichi lowers his shinai.', 1.4); return 'yield'; }
          await this.say('The party has fallen…', 1.4); return 'lose';
        }
        const ph = await this.checkPhase();
        if (ph) return ph;
      }
      await this.endOfRound();
    }
  }
  async endOfRound() {
    for (const u of [...G.party, ...this.enemies]) {
      if (u.hp <= 0) continue;
      u.defending = false;
      const st = u.status || {};
      const mx = u.enemy ? u.maxhp : maxHP(u);
      if (st.burn) { const d = Math.max(1, Math.round(mx * 0.06)); await this.hurt(u, d, ELEM_COL.fire); this.effect(u, 'flame', ELEM_COL.fire); }
      if (u.hp > 0 && st.poison) { const d = Math.max(1, Math.round(mx * 0.08)); await this.hurt(u, d, '#9ad84a'); }
      if (u.hp > 0 && st.regen) { this.heal(u, Math.round(mx * 0.08)); }
      for (const k of Object.keys(st)) { if (k === 'stun') continue; st[k]--; if (st[k] <= 0) delete st[k]; }
      if (u.enemy && !st.broken && u.brk < u.brkMax && !u.wasBroken) u.brk = Math.min(u.brkMax, u.brk + Math.round(u.brkMax * 0.05));
      if (u.enemy && u.wasBroken && !st.broken) { u.brk = u.brkMax; u.wasBroken = false; }
      if (u.enemy && st.broken) u.wasBroken = true;
    }
  }

  async tutorial() {
    this.tutorialShown = true;
    const D = 'Daichi';
    await talk([
      [D, `Same as always. You don't get to think forever in a real fight, so you don't here either.`, 'daichi'],
      [null, `TIMED TURNS: a timer runs at the top of the screen on your turn. Choose before it empties, or you fall back into a guard.`],
      [null, `TIMED STRIKES: when you attack, a bar appears. Press ${Controls.label('ok')} while the marker is in the light. The bright centre is a perfect strike.`],
      [null, `PARRY: when a blow comes at you, a ! flashes. Press ${Controls.label('ok')} then and you turn most of it aside.`],
      [D, `Ready? Kamae.`, 'daichi']
    ]);
  }

  enemyAI(e) {
    const party = this.aliveParty();
    const taunter = party.find(m => m.status.taunt);
    const choose = () => taunter && Math.random() < 0.85 ? taunter : pick(party);
    // finish a wind-up from last round
    if (e.charging) { const s = e.charging; delete e.charging; return { type: 'skill', src: e, skill: s, tgt: SKILLS[s].target === 'enemies' ? 'enemies' : choose(), charged: true }; }
    // healers look after their friends
    if (e.ai.includes('healer')) {
      const hurtFriend = this.aliveEnemies().find(o => o.hp < o.maxhp * 0.45);
      if (hurtFriend && e.skills.includes('mend') && Math.random() < 0.7) return { type: 'skill', src: e, skill: 'mend', tgt: hurtFriend };
    }
    if (e.hp < e.maxhp * 0.3 && e.skills.includes('guardup') && !e.status.guard && Math.random() < 0.4) return { type: 'skill', src: e, skill: 'guardup', tgt: 'self' };
    const skillChance = e.king ? 0.6 : e.boss ? 0.45 : 0.35;
    if (e.skills.length && Math.random() < skillChance) {
      const s = pick(e.skills);
      const sk = SKILLS[s];
      if (sk.charge) return { type: 'charge', src: e, skill: s };
      return { type: 'skill', src: e, skill: s, tgt: sk.target === 'enemies' ? 'enemies' : sk.target === 'self' || sk.target === 'ally' ? e : choose() };
    }
    return { type: 'attack', src: e, tgt: choose() };
  }

  // ------------------------------------------------------------ animation
  async lunge(u, big) {
    const d = u.enemy ? (big ? 44 : 26) : (big ? -66 : -40);
    u.pose = 'windup';
    await tween(u, { lunge: d * 0.3 }, 0.12, easeOut);
    u.pose = 'attack'; u.swing = 0;
    tween(u, { swing: 1 }, 0.18);
    await tween(u, { lunge: d }, 0.1, easeIn);
    tween(u, { lunge: 0 }, 0.26);
    setTimeout(() => { u.pose = ''; u.swing = 0; }, 240);
  }
  async castAnim(u, sk) {
    u.pose = 'cast';
    const [x, y] = this.pos(u);
    this.fx.push({ type: 'circle', x, y: y + (u.enemy ? u.size / 2 : PS / 2) - 6, col: ELEM_COL[sk.elem || (sk.kind === 'heal' ? 'heal' : 'none')], t: 0, dur: 0.75, seed: 0 });
    Sound.sfx(sk.kind === 'heal' ? 'heal' : sk.kind === 'buff' ? 'buff' : sk.elem || 'magic');
    await wait(0.42);
    setTimeout(() => { u.pose = ''; }, 300);
  }
  slashFx(tgt, col, n = 1) {
    const [x, y] = this.pos(tgt);
    for (let i = 0; i < n; i++) this.fx.push({ type: 'slash', x: x + rand(-10, 10), y: y + rand(-10, 10), col, t: -i * 0.06, dur: 0.34, seed: Math.random() * 6 });
  }

  // a blow aimed at you can be turned aside if you react in time
  async tryParry(tgt, src) {
    if (!tgt || tgt.enemy || tgt.cls !== 'hero' || tgt.hp <= 0) return 1;
    const p = new ParryScene(this, tgt, src);
    Scenes.push(p);
    const r = await p.promise;
    if (r === 'perfect') {
      this.gainResolve(8);
      tgt.pose = 'guard'; setTimeout(() => { tgt.pose = ''; }, 300);
      return tgt.status.riposte ? 0 : 0.35;
    }
    if (r === 'early') return 1.1;
    return 1;
  }

  async exec(a) {
    const s = a.src;
    const mult = a.mult || 1;
    const perfect = mult >= 1.3 ? 'Perfect strike! ' : '';
    if (a.type === 'guarded') return;
    if (a.type === 'sulk') { await this.say(`${s.name} hangs back, jaw set. (Low morale)`, 0.9); return; }
    if (a.type === 'stunned') {
      if (s.status.broken) { await this.say(`${s.name} is Broken and cannot move!`, 0.8); return; }
      delete s.status.stun; await this.say(`${s.name} is stunned and can't move!`, 0.8); return;
    }
    if (a.type === 'frozen') { await this.say(`${s.name} is frozen solid!`, 0.8); return; }
    if (a.type === 'defend') { s.defending = true; s.pose = 'guard'; setTimeout(() => { s.pose = ''; }, 600); await this.say(`${s.name} braces.`, 0.6); return; }
    if (a.type === 'charge') {
      s.charging = a.skill;
      s.pose = 'windup';
      this.effect(s, 'charge', UI.bad);
      Sound.sfx('buff');
      await this.say(`${s.name} is winding up ${SKILLS[a.skill].name}! Break it, or brace.`, 1.2);
      return;
    }
    if (a.type === 'run') {
      const ps = this.aliveParty().reduce((t, m) => t + stat(m, 'spd'), 0) / this.aliveParty().length;
      const es = this.aliveEnemies().reduce((t, e) => t + e.spd, 0) / this.aliveEnemies().length;
      const chance = clamp(0.55 + (ps - es) * 0.03, 0.2, 0.95);
      if (Math.random() < chance) { Sound.sfx('run'); await this.say('You got away.', 0.9); return 'run'; }
      await this.say('Couldn\'t escape!', 0.8); return;
    }
    if (a.type === 'attack') {
      const t = this.retarget(s, a.tgt); if (!t) return;
      let guardMult = 1;
      if (s.enemy) guardMult = await this.tryParry(t, s);
      await this.lunge(s);
      this.slashFx(t, '#ffffff');
      if (s.enemy && (Math.random() < 0.05 || (t.status && t.status.evade && Math.random() < 0.4))) { Sound.sfx('miss'); this.num(t, 'Miss', UI.dim); await this.say(`${s.name} attacks, and misses.`, 0.7); return; }
      const r = this.calc(s, t, { kind: 'phys', mult: 1 }, mult);
      if (r.miss) { Sound.sfx('miss'); this.num(t, 'Miss', UI.dim); await this.say(`${s.name} swings blind and misses.`, 0.7); return; }
      const dmg = Math.max(1, Math.round(r.dmg * guardMult));
      await this.hurt(t, dmg, '#ffffff', r.crit);
      await this.chip(t, { kind: 'phys' }, r);
      if (!s.enemy) this.gainResolve(mult >= 1.3 ? 10 : 6);
      if (guardMult === 0 && t.status.riposte) {
        await this.say(`${t.name} turns the blow and answers it!`, 0.6);
        const rr = this.calc(t, s, { kind: 'phys', mult: 1.3 });
        await this.hurt(s, rr.dmg, UI.sakura, true);
        await this.chip(s, { kind: 'phys', brk: 20 }, rr);
        return;
      }
      await this.say(`${perfect}${!perfect && r.crit ? 'Critical hit! ' : ''}${s.name} hits ${t.name} for ${dmg}.${guardMult < 1 ? ' Parried!' : ''}${t.hp <= 0 ? this.downText(t) : ''}`, 0.85);
      return;
    }
    if (a.type === 'item') {
      const it = ITEMS[a.item];
      if (!itemCount(a.item)) { await this.say(`No ${it.name} left!`, 0.6); return; }
      removeItem(a.item);
      await this.say(`${s.name} uses a ${it.name}.`, 0.5);
      if (it.resolve) { this.gainResolve(it.resolve); Sound.sfx('buff'); this.effect(s, 'heal', UI.sakura); await this.say('Resolve surges.', 0.7); return; }
      if (it.cure) { const t = a.tgt; for (const k of ['poison', 'burn', 'freeze', 'blind', 'weak']) delete t.status[k]; Sound.sfx('heal'); await this.say(`${t.name} is cured.`, 0.7); return; }
      if (it.target === 'enemies') {
        Sound.sfx('fire');
        for (const e of this.aliveEnemies()) { this.effect(e, 'flame', ELEM_COL.fire); let d = it.dmg; if (e.weak === 'fire') d *= 1.6; if (e.resist === 'fire') d *= 0.5; await this.hurt(e, Math.round(d), ELEM_COL.fire); await this.chip(e, { kind: 'mag' }); }
        await this.say('The bomb bursts into flame.', 0.5); return;
      }
      if (it.target === 'allies') { Sound.sfx('heal'); for (const m of this.aliveParty()) this.heal(m, it.heal); await this.say('The party recovers.', 0.7); return; }
      const t = a.tgt;
      if (it.revive) {
        if (t.hp > 0) { await this.say('It had no effect.', 0.6); return; }
        t.hp = Math.floor(maxHP(t) * it.revive); Sound.sfx('heal'); this.effect(t, 'heal', ELEM_COL.heal);
        await this.say(`${t.name} is back on their feet.`, 0.8); return;
      }
      if (t.hp <= 0) { await this.say('It had no effect.', 0.6); return; }
      if (it.heal) { Sound.sfx('heal'); const h = this.heal(t, it.heal); await this.say(`${t.name} recovers ${h} HP.`, 0.7); }
      if (it.mpheal) { Sound.sfx('heal'); const b = t.mp; t.mp = Math.min(maxMP(t), t.mp + it.mpheal); this.num(t, t.mp - b, UI.mp); await this.say(`${t.name} recovers ${t.mp - b} MP.`, 0.7); }
      return;
    }
    if (a.type === 'skill') {
      const sk = SKILLS[a.skill];
      if (!s.enemy) {
        if (a.resolve) { this.resolve = 0; }
        else {
          if (s.mp < sk.mp) { await this.say(`${s.name} doesn't have enough MP!`, 0.7); return; }
          s.mp -= sk.mp;
        }
        if (sk.hpCost) { const c = Math.max(1, Math.round(maxHP(s) * sk.hpCost)); s.hp = Math.max(1, s.hp - c); this.num(s, c, UI.bad); }
      }
      this.msg = `${perfect}${s.name} uses ${sk.name}!`;
      if (a.charged) { this.msg = `${s.name} unleashes ${sk.name}!`; this.shakeT = 0.4; }
      if (sk.fx === 'crossing') await this.crossingFx();
      else if (a.resolve && a.partner) await this.teamUpFx(s, a.partner, sk);
      else if (sk.kind === 'phys') await this.lunge(s, !!a.resolve);
      else await this.castAnim(s, sk);
      const foes = s.enemy ? this.aliveParty() : this.aliveEnemies();
      const friends = s.enemy ? this.aliveEnemies() : this.aliveParty();
      let targets;
      if (a.tgt === 'enemies') targets = foes;
      else if (a.tgt === 'allies') targets = friends;
      else if (a.tgt === 'self' || sk.target === 'self') targets = [s];
      else if (sk.kind === 'heal' || sk.kind === 'eheal' || sk.kind === 'cure' || sk.kind === 'raise') targets = a.tgt ? [a.tgt] : [];
      else { const t = this.retarget(s, a.tgt); targets = t ? [t] : []; }
      if (!targets.length) { await this.say('There was no target.', 0.6); return; }

      if (sk.kind === 'sanctuary') {
        for (const t of G.party) { t.hp = t.hp <= 0 ? Math.floor(maxHP(t) * 0.6) : maxHP(t); t.mp = Math.min(maxMP(t), t.mp + Math.floor(maxMP(t) * 0.4)); t.status = { regen: 4 }; this.effect(t, 'heal', ELEM_COL.heal); }
        Sound.sfx('levelup');
        await this.say('Light falls over the whole party. Wounds close, and the fallen stand up.', 1.4);
        return;
      }
      if (sk.kind === 'raise') {
        const t = targets[0];
        if (t.hp > 0) { await this.say('It had no effect.', 0.6); return; }
        t.hp = Math.floor(maxHP(t) * 0.5); Sound.sfx('levelup'); this.effect(t, 'heal', ELEM_COL.holy);
        await this.say(`${t.name} is back on their feet.`, 0.9); return;
      }
      if (sk.kind === 'cure') {
        const t = targets[0];
        for (const k of ['poison', 'burn', 'freeze', 'blind', 'weak', 'slow']) delete t.status[k];
        Sound.sfx('heal'); this.effect(t, 'heal', ELEM_COL.heal);
        await this.say(`${t.name} is cured.`, 0.8); return;
      }
      if (sk.kind === 'steal') {
        const t = targets[0];
        const table = DROP_TABLE[clamp(areaTier(G.map), 1, 4)];
        if (t.boss || Math.random() < 0.35) { await this.say(`${s.name} comes away with nothing.`, 0.8); return; }
        if (Math.random() < 0.45 && t.gold) { const g = Math.round(t.gold * rand(0.5, 1.2)); G.gold += g; Sound.sfx('coin'); await this.say(`${s.name} lifts ${g} G from ${t.name}.`, 0.9); return; }
        const id = pick(table); addItem(id); Sound.sfx('pickup');
        await this.say(`${s.name} steals a ${ITEMS[id].name}!`, 0.9); return;
      }
      if (sk.kind === 'heal' || sk.kind === 'eheal') {
        const total = [];
        for (const t of targets) total.push(this.heal(t, Math.floor((sk.power || 0) + this.S(s, sk.useAtk ? 'atk' : 'mag') * (sk.scale || 1))));
        Sound.sfx('heal');
        await this.say(targets.length > 1 ? 'The party is healed.' : `${targets[0].name} recovers ${total[0]} HP.`, 0.8);
        return;
      }
      if (sk.kind === 'buff' || sk.kind === 'ebuff') {
        for (const t of targets) { t.status[sk.status] = sk.turns || 3; this.effect(t, 'heal', UI.gold); }
        Sound.sfx('buff');
        await this.say(sk.status === 'taunt' ? `${s.name} roars and draws every eye!` : sk.status === 'cover' ? `${s.name} moves to cover the party.` : sk.status === 'riposte' ? `${s.name} settles into a counter stance.` : `${targets.length > 1 ? 'The party' : targets[0].name} is warded.`, 0.8);
        return;
      }
      if (sk.kind === 'debuff') {
        for (const t of targets) { t.status[sk.status] = sk.turns || 3; this.effect(t, 'dark', ELEM_COL.dark); }
        Sound.sfx('dark');
        await this.say(sk.status === 'marked' ? `${targets[0].name} is marked — it will take more, and Break faster.` : `${targets.length > 1 ? 'The enemy' : targets[0].name} falters.`, 0.9);
        return;
      }
      // damage
      const hits = sk.hits || 1;
      const lines = [];
      let anyGuard = 1;
      if (s.enemy && targets.length === 1 && sk.kind === 'phys') anyGuard = await this.tryParry(targets[0], s);
      for (let h = 0; h < hits; h++) {
        for (const t of targets) {
          if (t.hp <= 0) continue;
          const col = ELEM_COL[sk.elem || 'none'];
          if (sk.kind === 'phys' || sk.kind === 'hybrid') this.slashFx(t, col);
          else this.effect(t, sk.elem === 'fire' ? 'flame' : sk.elem === 'ice' ? 'ice' : sk.elem === 'thunder' ? 'bolt' : sk.elem === 'dark' ? 'dark' : sk.elem === 'holy' ? 'holy' : 'burst', col);
          const r = this.calc(s, t, sk, mult * (a.charged ? 1.35 : 1) / (hits > 1 ? 1 : 1));
          if (r.miss) { this.num(t, 'Miss', UI.dim); continue; }
          const dmg = Math.max(1, Math.round(r.dmg * (s.enemy ? anyGuard : 1)));
          await this.hurt(t, dmg, col, r.crit);
          await this.chip(t, sk, r);
          if (!s.enemy) this.gainResolve(4);
          if (r.tag === 'weak') this.fx.push({ type: 'num', x: this.pos(t)[0], y: this.pos(t)[1] - 34, txt: 'WEAK!', col: UI.sakura, t: 0, dur: 1 });
          if (sk.drain) { const hgain = Math.floor(dmg * 0.6); s.hp = Math.min(s.enemy ? s.maxhp : maxHP(s), s.hp + hgain); this.num(s, hgain, UI.hp); }
          if (sk.status && t.hp > 0 && Math.random() < (sk.chance || 1)) { t.status[sk.status] = sk.turns || 3; this.num(t, sk.status.toUpperCase(), STATUS_ICON[sk.status] ? STATUS_ICON[sk.status][1] : UI.paper); }
          if (sk.stun && t.hp > 0 && !t.boss && Math.random() < sk.stun) { t.status.stun = 1; lines.push(`${t.name} is stunned!`); }
          if (sk.steal && Math.random() < 0.5 && G.gold > 0) { const g = Math.min(G.gold, irand(5, 25)); G.gold -= g; lines.push(`${s.name} snatches ${g} G!`); }
          if (targets.length === 1 && hits === 1) lines.unshift(`${t.name} takes ${dmg} damage${r.tag === 'weak' ? ', a weak point' : r.tag === 'resist' ? ', but resists' : ''}.`);
        }
        if (hits > 1) await wait(0.1);
      }
      if (sk.healParty) { for (const m of this.aliveParty()) this.heal(m, Math.round(maxHP(m) * sk.healParty)); lines.push('The party is healed.'); }
      if (sk.selfCost) { const c = Math.round(maxHP(s) * sk.selfCost); s.hp = Math.max(1, s.hp - c); this.num(s, c, UI.bad); }
      // splitters break in two when they are hurt badly
      await this.checkSplit();
      const dead = targets.filter(t => t.hp <= 0).map(t => t.name);
      if (dead.length) lines.push(`${dead.join(', ')} ${dead.length > 1 ? 'are' : 'is'} ${s.enemy ? 'down' : 'defeated'}.`);
      await this.say(lines.join(' ') || `${sk.name} tears through everything in its path.`, 0.9);
    }
  }
  async checkSplit() {
    if (this.enemies.length >= 5) return;
    const sp = this.enemies.find(e => e.hp > 0 && e.ai && e.ai.includes('split') && !e.didSplit && e.hp < e.maxhp * 0.5);
    if (!sp) return;
    sp.didSplit = true;
    const half = makeEnemy({ id: sp.id, half: true }, G.map);
    half.hp = Math.max(1, Math.round(sp.hp * 0.6));
    sp.hp = Math.max(1, Math.round(sp.hp * 0.6));
    this.enemies.push(half);
    this.nameEnemies(); this.layoutEnemies();
    Sound.sfx('magic');
    await this.say(`${sp.name} splits in two!`, 1.0);
  }
  downText(t) {
    if (!t.enemy) return ` ${t.name} falls!`;
    if (t.id === 'kendo') return ` Daichi steps back and bows.`;
    if (t.id === 'swordmaster') return ` Master Corwin lowers his blade.`;
    if (t.id === 'duel') return ` Garrick drops his axe.`;
    return ` ${t.name} is defeated.`;
  }

  // Last Crossing: headlights in the dark, then white
  async crossingFx() {
    this.cross = { t: 0 };
    Sound.stop();
    await tween(this.cross, { t: 1 }, 1.1, easeIn);
    Sound.sfx('crash'); this.shakeT = 0.6; this.flashT = 0.5;
    this.cross = null;
    await wait(0.3);
    Sound.play(this.opts.music || (this.isBoss ? 'boss' : 'battle'));
  }
  async teamUpFx(a, b, sk) {
    a.pose = 'windup'; b.pose = 'windup';
    this.flashT = 0.3; Sound.sfx('buff');
    await wait(0.35);
    const [ax, ay] = this.pos(a), [bx, by] = this.pos(b);
    this.fx.push({ type: 'team', x: ax, y: ay, x2: bx, y2: by, col: UI.sakura, t: 0, dur: 0.6 });
    await tween(a, { lunge: -80 }, 0.16, easeIn); tween(b, { lunge: -70 }, 0.18);
    a.pose = 'attack'; b.pose = 'attack'; a.swing = 0; b.swing = 0;
    tween(a, { swing: 1 }, 0.2); tween(b, { swing: 1 }, 0.2);
    Sound.sfx('crit'); this.shakeT = 0.5;
    await wait(0.2);
    tween(a, { lunge: 0 }, 0.3); tween(b, { lunge: 0 }, 0.3);
    setTimeout(() => { a.pose = ''; b.pose = ''; a.swing = 0; b.swing = 0; }, 300);
  }

  async checkPhase() {
    const k = this.enemies.find(e => e.king && e.hp > 0 && !e.offered && e.hp <= e.maxhp * 0.5);
    if (!k) return null;
    k.offered = true;
    this.flashT = 0.4; Sound.stop();
    await this.say('Malgrath lowers his blade.', 1.4);
    this.msg = '';
    await talk([
      ['Malgrath', `Enough.`, 'demonking'],
      ['Malgrath', `You are stronger than the others they sent. Strong enough to finish this. So before you do, hear me once.`, 'demonking'],
      ['Malgrath', `Three hundred years ago your kind drove mine into the Ashen Wastes. Nothing grows there. Our children eat ash and call it bread.`, 'demonking'],
      ['Malgrath', `Every village I have burned, I burned for land. Give the Ashborn the Wastes as our own, under treaty, recognised by your kings, and I will end this war tonight.`, 'demonking']
    ]);
    const c = await ask('Malgrath', `Make the deal. Or finish what they sent you here to do.`, ['Accept the deal.', 'Refuse.'], 'demonking', false);
    if (c === 0) { this.msg = 'The battle ends.'; return 'deal'; }
    await say('Malgrath', `…Then there is nothing left to say.`, 'demonking');
    Sound.play('boss');
    this.flashT = 0.6; Sound.sfx('dark'); this.shakeT = 0.6;
    k.atk = Math.floor(k.atk * 1.25); k.mag = Math.floor(k.mag * 1.25); k.def = Math.floor(k.def * 1.15); k.twice = true;
    k.hp = Math.min(k.maxhp, k.hp + Math.floor(k.maxhp * 0.12));
    k.brk = k.brkMax;
    await this.say('Ashfire pours from Malgrath\'s wounds. He will act twice each turn.', 1.8);
    return null;
  }

  async victory() {
    Sound.stop(); Sound.play('victory');
    for (const m of G.party) m.pose = 'victory';
    setTimeout(() => { for (const m of G.party) m.pose = ''; }, 2500);
    if (this.opts.tutorial || this.opts.spar || this.opts.training) { await wait(1.2); return 'win'; }
    const xp = this.enemies.reduce((t, e) => t + e.xp, 0);
    const gold = this.enemies.reduce((t, e) => t + e.gold, 0);
    G.gold += gold; G.kills += this.enemies.length;
    for (const e of this.enemies) for (const q of G.quests) if (q.type === 'hunt' && q.enemy === e.id && q.have < q.need) q.have++;
    if (this.enemies.some(e => e.king)) { this.msg = 'Malgrath falls.'; await wait(2); return 'win'; }
    this.msg = `Victory. Gained ${xp} XP and ${gold} G.`;
    await this.waitOk();
    const drops = rollDrops(G.map, this.enemies);
    const dl = Object.entries(drops);
    if (dl.length) {
      for (const [id, n] of dl) addItem(id, n);
      Sound.sfx('pickup');
      this.msg = 'Found: ' + dl.map(([id, n]) => (n > 1 ? n + '× ' : '') + ITEMS[id].name).join(', ') + '.';
      await this.waitOk();
    }
    const msgs = [];
    for (const m of G.party) msgs.push(...gainXP(m, xp));
    for (const l of msgs) { if (l.includes('reached')) Sound.sfx('levelup'); this.msg = l; await this.waitOk(); }
    const done = G.quests.filter(q => q.type === 'hunt' && q.have >= q.need && !q._told);
    for (const q of done) { q._told = true; this.msg = `Quest ready to turn in: ${q.title}`; await this.waitOk(); }
    return 'win';
  }

  // ------------------------------------------------------------ frame
  update(dt) {
    if (this.okWaiter && (Input.pressed('ok') || Input.pressed('cancel'))) { const r = this.okWaiter; this.okWaiter = null; Sound.sfx('cursor'); r(); }
    this.tick(dt);
  }
  tick(dt) {
    for (const u of [...G.party, ...this.enemies]) { if (u.flash > 0) u.flash -= dt; if (u.shake > 0) u.shake -= dt; }
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    for (const f of this.fx) { f.t += dt; if (f.t >= 0 && !f._em) { f._em = 1; this.emitFor(f); } }
    this.fx = this.fx.filter(f => f.t < f.dur);
    if (this.parts) {
      for (const p of this.parts) {
        if (p.delay > 0) { p.delay -= dt; continue; }
        p.t += dt; p.vy += p.g * dt; p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60); p.x += p.vx * dt; p.y += p.vy * dt;
      }
      this.parts = this.parts.filter(p => p.t < p.life);
    }
    if (this.punch > 0) this.punch -= dt;

    this.bgT = (this.bgT || 0) + dt;
  }

  drawBackground() {
    const [sky1, sky2, g1, g2] = BG[this.bg];
    const HOR = 230;
    const g = ctx.createLinearGradient(0, 0, 0, HOR);
    g.addColorStop(0, sky1); g.addColorStop(1, sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR);
    const r = mulberry(this.bg.length * 31);
    const layer = (col, base, amp, freq, seed) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, HOR); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base - Math.abs(Math.sin(x / freq + seed)) * amp - Math.sin(x / (freq * 0.37) + seed) * amp * 0.25); ctx.lineTo(W, HOR); ctx.fill(); };
    if (this.bg === 'forest' || this.bg === 'village' || this.bg === 'road' || this.bg === 'yard') {
      glow(W * 0.8, 70, 110, 'rgba(255,245,200,.45)');
      ctx.fillStyle = 'rgba(255,255,230,.6)'; ctx.beginPath(); ctx.arc(W * 0.8, 70, 30, 0, 7); ctx.fill();
      { const t = this.bgT || 0, cr = mulberry(21);
        for (let i = 0; i < 6; i++) { const cw = 60 + cr() * 90, cy = 20 + cr() * 90, cx = ((cr() * (W + 300) + t * (6 + i * 2)) % (W + 300)) - 150;
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(cx, cy, cw / 2, cw / 7, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx - cw * 0.15, cy - cw / 9, cw / 4, cw / 7, 0, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(200,215,235,.35)'; ctx.fillRect(cx - cw / 2.4, cy + cw / 14, cw / 1.2, 2); } }
      layer('#8ab0a0', 170, 50, 90, 1); layer('#5a8a5e', 195, 40, 60, 2);
      const trees = this.bg === 'road' ? 10 : 22;
      for (let i = 0; i < trees; i++) { const x = r() * W, h = 70 + r() * 70; ctx.fillStyle = i % 2 ? '#24582a' : '#2f6b30'; ctx.beginPath(); ctx.moveTo(x - 26, HOR); ctx.lineTo(x, HOR - h); ctx.lineTo(x + 26, HOR); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(x, HOR - h); ctx.lineTo(x - 26, HOR); ctx.lineTo(x - 10, HOR); ctx.fill(); }
      if (this.bg === 'road') { ctx.fillStyle = '#c8a84a'; for (let i = 0; i < 26; i++) { const x = r() * W, y = 250 + r() * 120; ctx.fillRect(x, y, 2, 10); } }
    } else if (this.bg === 'cave') {
      for (let i = 0; i < 18; i++) { const x = r() * W, h = 30 + r() * 80; ctx.fillStyle = i % 2 ? '#1a1210' : '#221816'; ctx.beginPath(); ctx.moveTo(x - 16, 0); ctx.lineTo(x, h); ctx.lineTo(x + 16, 0); ctx.fill(); }
      layer('#2a1e1a', 210, 40, 50, 3);
      for (let i = 0; i < 14; i++) { const x = r() * W, y = 60 + r() * 150; glow(x, y, 14, 'rgba(106,240,255,.45)'); ctx.fillStyle = '#bff8ff'; ctx.fillRect(x - 1, y - 1, 3, 3); }
    } else if (this.bg === 'wastes') {
      glow(W * 0.22, 110, 120, 'rgba(255,150,60,.4)');
      ctx.fillStyle = 'rgba(255,190,110,.5)'; ctx.beginPath(); ctx.arc(W * 0.22, 110, 46, 0, 7); ctx.fill();
      layer('#4a1c1c', 160, 70, 120, 4); layer('#2e1216', 200, 40, 70, 5);
      ctx.fillStyle = 'rgba(255,120,40,.16)'; ctx.fillRect(0, 170, W, 60);
    } else if (this.bg === 'castle') {
      for (let i = 0; i < Math.ceil(W / 96); i++) {
        const x = 30 + i * 96; ctx.fillStyle = '#160e22'; ctx.fillRect(x, 30, 40, 200); ctx.fillStyle = '#231a34'; ctx.fillRect(x + 4, 30, 8, 200);
        ctx.fillStyle = '#4a0e1c'; ctx.fillRect(x + 12, 70, 16, 40); ctx.fillStyle = '#6a1426'; ctx.fillRect(x + 14, 72, 12, 36);
        const fy = 54 + Math.sin(TIME * 7 + i) * 2; glow(x + 20, fy, 26, 'rgba(255,150,60,.45)'); ctx.fillStyle = '#f2c94c'; ctx.fillRect(x + 17, fy, 6, 8);
      }
    } else if (this.bg === 'night') {
      for (let i = 0; i < 90; i++) { const x = hash2(i, 3) % W, y = hash2(i, 7) % 200; ctx.fillStyle = Math.sin(TIME * 2 + i) > 0.6 ? '#fff' : '#8a88c0'; ctx.fillRect(x, y, 2, 2); }
      glow(W * 0.7, 60, 90, 'rgba(210,220,255,.35)'); ctx.fillStyle = '#e8ecff'; ctx.beginPath(); ctx.arc(W * 0.7, 60, 22, 0, 7); ctx.fill();
      layer('#1a2a22', 190, 50, 80, 2);
      for (let i = 0; i < 14; i++) { const x = r() * W, h = 70 + r() * 60; ctx.fillStyle = '#12281c'; ctx.beginPath(); ctx.moveTo(x - 24, HOR); ctx.lineTo(x, HOR - h); ctx.lineTo(x + 24, HOR); ctx.fill(); }
    } else if (this.bg === 'dojo') {
      ctx.fillStyle = '#5a4028'; ctx.fillRect(0, 0, W, 60); ctx.fillStyle = '#e8dcc0';
      for (let i = 0; i < Math.ceil(W / 80); i++) { ctx.fillRect(20 + i * 80, 70, 64, 120); ctx.fillStyle = '#8a6a44'; ctx.fillRect(50 + i * 80, 70, 4, 120); ctx.fillRect(20 + i * 80, 128, 64, 4); ctx.fillStyle = '#e8dcc0'; }
      ctx.fillStyle = '#2a1a0e'; ctx.fillRect(W / 2 - 40, 76, 80, 40); text('心', W / 2, 78, '#e8dcc0', 30, 'center');
    }
    const gg = ctx.createLinearGradient(0, HOR, 0, H);
    gg.addColorStop(0, g1); gg.addColorStop(1, g2);
    ctx.fillStyle = gg; ctx.fillRect(0, HOR, W, H - HOR);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let i = 0; i < 40; i++) ctx.fillRect(r() * W, HOR + 6 + r() * 150, 6 + r() * 24, 2);
    if (this.bg === 'dojo') { ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, HOR, 2, H - HOR); }
  }

  // drifting clouds, swaying grass in front of the camera, floating motes
  // zoom the camera in on whoever is about to be hit
  applyFocus() {
    const f = this.focus; if (!f || f.k <= 0) return;
    const k = f.k * f.k * (3 - 2 * f.k), z = 1 + 0.6 * k;
    const tx = (W / 2 - f.x) * k * 0.9, ty = (H * 0.45 - f.y) * k * 0.9;
    ctx.translate(f.x + tx, f.y + ty); ctx.scale(z, z); ctx.translate(-f.x, -f.y);
  }
  focusPt(x, y) {
    const f = this.focus; if (!f || f.k <= 0) return [x, y];
    const k = f.k * f.k * (3 - 2 * f.k), z = 1 + 0.6 * k;
    return [(x - f.x) * z + f.x + (W / 2 - f.x) * k * 0.9, (y - f.y) * z + f.y + (H * 0.45 - f.y) * k * 0.9];
  }
  drawForeground() {
    const t = this.bgT || 0, outdoors = ['forest', 'village', 'road', 'yard', 'night'].includes(this.bg);
    if (outdoors) {
      const r = mulberry(77);
      for (let i = 0; i < 46; i++) {
        const x = r() * W, h = 10 + r() * 20, y = H + 2, sway = Math.sin(t * 1.6 + x * 0.05) * 4;
        ctx.fillStyle = this.bg === 'night' ? (i % 2 ? '#0e1c14' : '#16281c') : (i % 2 ? '#2a5a24' : '#3a7430');
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x + sway * 0.5, y - h * 0.6, x + sway, y - h); ctx.lineTo(x + 3, y); ctx.fill();
      }
    }
    const kind = this.bg === 'wastes' ? 'ember' : this.bg === 'cave' ? 'drip' : this.bg === 'castle' ? 'ash' : this.bg === 'night' ? 'fly' : 'leaf';
    const r = mulberry(5);
    for (let i = 0; i < 18; i++) {
      const sp = 0.4 + r() * 0.6, ph = r() * 50;
      let x, y;
      if (kind === 'ember' || kind === 'ash') { y = H - ((t * 40 * sp + ph * 20) % (H + 40)); x = (r() * W + Math.sin(t + ph) * 30 + W) % W; }
      else if (kind === 'drip') { x = r() * W; y = ((t * 220 * sp + ph * 30) % 520) - 20; if (y > 260) continue; }
      else if (kind === 'fly') { x = r() * W + Math.sin(t * 0.7 + ph) * 40; y = 200 + r() * 180 + Math.cos(t * 0.9 + ph) * 20; }
      else { y = ((t * 36 * sp + ph * 20) % (H + 40)) - 20; x = (r() * W + Math.sin(t * 1.3 + ph) * 40 + W) % W; }
      ctx.globalAlpha = kind === 'fly' ? 0.5 + 0.5 * Math.sin(t * 3 + ph) : 0.8;
      ctx.fillStyle = kind === 'ember' ? (i % 2 ? '#ffb040' : '#f07a2a') : kind === 'ash' ? '#8a8098' : kind === 'drip' ? '#9ad0e8' : kind === 'fly' ? '#e8ff90' : (i % 2 ? '#c8a040' : '#6aa84a');
      if (kind === 'drip') ctx.fillRect(x, y, 1, 5); else ctx.fillRect(Math.round(x), Math.round(y), kind === 'leaf' ? 3 : 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  drawFighter(u) {
    if (u.enemy) {
      if (u.alpha <= 0) return;
      const sx = u.x - u.size / 2 - u.lunge + (u.shake > 0 ? rand(-4, 4) : 0), sy = u.y - u.size;
      ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(u.x, u.y - 2, u.size * 0.34, u.size * 0.09, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = u.alpha;
      if (u.king) glow(u.x, u.y - u.size / 2, u.size * 0.75, u.offered && u.twice ? 'rgba(255,40,60,.35)' : 'rgba(140,40,200,.3)');
      if (u.elite) glow(u.x, u.y - u.size / 2, u.size * 0.6, 'rgba(229,83,75,.35)');
      if (u.status.broken) glow(u.x, u.y - u.size / 2, u.size * 0.7, 'rgba(242,163,58,.4)');
      const mon = u.sprKey.startsWith('m:');
      const type = mon && MONSTERS[u.sprKey.slice(2)] ? MONSTERS[u.sprKey.slice(2)].type : 'human';
      const ph = TIME + u.x * 0.013;
      // each kind of creature has its own idle: slimes squash, bats flap, wisps drift, big things breathe
      let bob = 0, sxk = 1, syk = 1;
      if (type === 'slime') { const q = Math.sin(ph * 4); syk = 1 + q * 0.07; sxk = 1 - q * 0.05; bob = 0; }
      else if (type === 'bat' || type === 'imp') { bob = Math.sin(ph * 3) * 6; sxk = 1 - Math.abs(Math.sin(ph * 14)) * 0.18; }
      else if (type === 'wisp') { bob = Math.sin(ph * 2) * 7; sxk = 1 + Math.sin(ph * 5) * 0.04; syk = 1 - Math.sin(ph * 5) * 0.04; }
      else if (type === 'golem' || type === 'treant') { syk = 1 + Math.sin(ph * 1.4) * 0.025; }
      else if (type === 'wolf' || type === 'spider') { syk = 1 + Math.sin(ph * 3.2) * 0.035; bob = Math.max(0, Math.sin(ph * 3.2)) * -1; }
      else { bob = Math.sin(ph * 2.2) > 0.5 ? -Math.round(u.size / 32) : 0; }
      const img = mon ? monsterSprite(u.sprKey.slice(2), false, 48) : charSprite(u.sprKey, 'right', 0, u.pose || '');
      const dw = u.size * sxk, dh = u.size * syk;
      const draw = (im, ox, a) => { ctx.globalAlpha = u.alpha * a; ctx.drawImage(im, u.x - dw / 2 - u.lunge + (sx - (u.x - u.size / 2 - u.lunge)) - ox, u.y - dh + bob, dw, dh); };
      if (Math.abs(u.lunge) > 6) { draw(img, -u.lunge * 0.5, 0.25); draw(img, -u.lunge * 0.25, 0.4); }
      draw(u.flash > 0 && Math.floor(u.flash * 20) % 2 ? whiteSilhouette(img) : img, 0, 1);
      // armed people hold their weapon (Daichi's shinai, a bandit's sword…), mirrored because they face right
      const wid = !mon && ENEMIES[u.id] && ENEMIES[u.id].wpn;
      if (wid && img.hand && u.alpha > 0.3) {
        const ex = u.x - dw / 2 - u.lunge + (sx - (u.x - u.size / 2 - u.lunge)), ey = u.y - dh + bob;
        const hx = ex + img.hand[0] * dw / 32, hy = ey + img.hand[1] * dh / 32, pose = u.pose || '';
        let ang = -0.4;
        if (pose === 'windup') ang = -2.1; else if (pose === 'attack') ang = -2.1 + (u.swing || 0) * 3.0; else if (pose === 'guard') ang = -1.3;
        ctx.globalAlpha = u.alpha;
        const wl = drawWeapon(ITEMS[wid].kind, hx, hy, -ang, u.size / 32 * 0.95, false, wid);
        if (pose === 'attack' && (u.swing || 0) > 0.15) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = wl.trail || (wl.k === 'wood' || wl.k === 'shinai' ? 'rgba(240,220,170,.35)' : 'rgba(255,255,255,.5)'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 40, 2.1 - Math.PI - u.swing * 3.0, 2.1 - Math.PI, false); ctx.stroke(); ctx.restore(); }
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = 1;
      if (u.charging) { const p = 0.5 + Math.sin(TIME * 9) * 0.5; glow(u.x, u.y - u.size * 0.6, 40 + p * 16, 'rgba(229,83,75,.5)'); text('⚠ ' + SKILLS[u.charging].name, u.x, sy - 28, UI.bad, 13, 'center'); }
      this.drawStatusIcons(u, u.x, sy - 8);
      if (u.hp > 0) {
        const bw = Math.min(120, u.size + 24);
        if (this.isBoss && u.boss || u.elite || u.human || u.status.broken) bar(u.x - bw / 2, sy - 14, bw, 6, u.hp, u.maxhp, UI.bad);
        bar(u.x - bw / 2, sy - 6, bw, 3, u.brk, u.brkMax, u.status.broken ? UI.dim : UI.brk);
      }
      return;
    }
    const m = u;
    const [bx, by] = this.memberPos(m);
    const x = bx + m.lunge + (m.shake > 0 ? rand(-3, 3) : 0), y = by - PS;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(bx + PS / 2, by - 3, PS * 0.3, PS * 0.08, 0, 0, 7); ctx.fill();
    const key = memberKey(m);
    if (m.hp <= 0) {
      ctx.save(); ctx.globalAlpha = 0.6; ctx.translate(x + PS / 2, by - PS * 0.22); ctx.rotate(-Math.PI / 2);
      ctx.drawImage(charSprite(key, 'left', 0), -PS / 2, -PS / 2, PS, PS); ctx.restore(); return;
    }
    const act = this.active === m;
    const pose = m.pose || '';
    const frame = pose ? 0 : (act ? (Math.floor(TIME * 4) % 2) : 0);
    const img = charSprite(key, 'left', frame, pose);
    const breathe = !pose && !act && Math.sin(TIME * 2.2 + bx * 0.05) > 0.5 ? -3 : 0;
    const yy = y + (act && !pose ? -4 : 0) + breathe;
    if (Math.abs(m.lunge) > 8) { ctx.globalAlpha = 0.22; ctx.drawImage(img, x - m.lunge * 0.5, yy, PS, PS); ctx.globalAlpha = 0.4; ctx.drawImage(img, x - m.lunge * 0.25, yy, PS, PS); ctx.globalAlpha = 1; }
    if (m.hp > 0 && m.hp < maxHP(m) * 0.25 && !pose && Math.floor(TIME * 1.5) % 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18; ctx.drawImage(whiteSilhouette(img), x, yy, PS, PS); ctx.restore(); }
    ctx.drawImage(m.flash > 0 && Math.floor(m.flash * 20) % 2 ? whiteSilhouette(img) : img, x, yy, PS, PS);
    // the weapon, drawn separately so it can swing
    const it = ITEMS[m.equip.weapon];
    if (it && img.hand) {
      const sc = PS / 32;
      const hx = x + img.hand[0] * sc, hy = yy + img.hand[1] * sc;
      let ang = -0.4;
      if (pose === 'windup') ang = -2.1;
      else if (pose === 'attack') ang = -2.1 + (m.swing || 0) * 3.0;
      else if (pose === 'cast') ang = -0.2;
      else if (pose === 'guard') ang = -1.3;
      else if (pose === 'victory') ang = -0.9;
      const wl = drawWeapon(it.kind || 'sword', hx, hy, ang, sc * 0.95, true, m.equip.weapon);
      if (pose === 'attack' && (m.swing || 0) > 0.15) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = wl.trail || (wl.k === 'wood' || wl.k === 'shinai' ? 'rgba(240,220,170,.35)' : 'rgba(255,255,255,.5)'); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(hx, hy, 40, -2.1 + Math.PI, (-2.1 + m.swing * 3.0) + Math.PI); ctx.stroke(); ctx.restore();
      }
    }
    if (m.defending) { ctx.strokeStyle = 'rgba(111,183,242,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + PS / 2, y + PS * 0.53, PS * 0.53, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); ctx.lineWidth = 1; }
    this.drawStatusIcons(m, x + PS / 2, y - 6);
    if (act) drawCursor(x - 14, y + PS * 0.4);
  }
  drawStatusIcons(u, cx, cy) {
    const ks = Object.keys(u.status || {}).filter(k => STATUS_ICON[k]);
    if (!ks.length) return;
    const w = ks.length * 16;
    ks.forEach((k, i) => text(STATUS_ICON[k][0], cx - w / 2 + i * 16 + 8, cy - 10, STATUS_ICON[k][1], 13, 'center'));
  }

  draw() {
    const sh = this.shakeT > 0 && Gfx.shake ? rand(-5, 5) : 0;
    ctx.save(); ctx.translate(sh, sh * 0.5);
    if (this.punch > 0 && Gfx.shake) { const z = 1 + this.punch * 0.12; ctx.translate(this.punchX, this.punchY); ctx.scale(z, z); ctx.translate(-this.punchX, -this.punchY); }
    // let go of a parry zoom on real time, whatever else is going on
    { const now = performance.now() / 1000, dtr = Math.min(0.1, now - (this._fl || now)); this._fl = now;
      if (this.focus && this.focus.release) { this.focus.k -= dtr * 3.5; if (this.focus.k <= 0) this.focus = null; } }
    this.applyFocus();
    this.drawBackground();
    for (const e of this.enemies) this.drawFighter(e);
    G.party.forEach(m => this.drawFighter(m));
    this.drawForeground();
    this.drawFx();
    this.drawParts();
    ctx.restore();
    // lighting & weather over the battlefield
    const amb = this.bg === 'cave' ? '#4a4050' : this.bg === 'castle' ? '#7a6080' : this.bg === 'wastes' ? '#e0b09a' : this.bg === 'night' ? '#5a6aa0' : '#f4ead8';
    FX.beginLights(amb);
    for (const e of this.enemies) if (e.hp > 0 && (e.king || e.elite || e.status.broken)) FX.addLight(e.x, e.y - e.size / 2, e.size, e.status.broken ? 'rgba(242,163,58,1)' : 'rgba(255,90,90,1)', 0.5);
    for (const f of this.fx) if (f.col && f.t < f.dur * 0.6) FX.addLight(f.x, f.y, 90, f.col.startsWith('#') ? f.col : 'rgba(255,255,255,1)', 0.7);
    if (this.bg !== 'cave') FX.addLight(W * (this.bg === 'wastes' ? 0.22 : 0.8), this.bg === 'wastes' ? 110 : 70, 280, 'rgba(255,240,200,1)', 0.5);
    FX.endLights();
    Weather.drawWorld();
    FX.bloom(0.32);
    if (this.bg === 'forest' || this.bg === 'village' || this.bg === 'road' || this.bg === 'yard') FX.lensFlare(W * 0.8, 70, 0.55, [255, 245, 200]);
    Weather.drawScreen();
    // parry moment: the world drains to grey, only you and the blow keep their colour
    if (this.focus && this.focus.k > 0) {
      const k = clamp(this.focus.k, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.fillStyle = `rgba(8,6,18,${0.4 * k})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(sh, sh * 0.5); this.applyFocus();
      if (this.focus.src && this.focus.src.hp > 0) this.drawFighter(this.focus.src);
      this.drawFighter(this.focus.who);
      ctx.restore();
      const vg = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.42, H * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${0.55 * k})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }
    // Last Crossing: darkness, two headlights, white
    if (this.cross) {
      const t = this.cross.t;
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.92, t * 2)})`; ctx.fillRect(0, 0, W, H);
      const r = 6 + t * t * 240;
      for (const dx of [-1, 1]) glow(W / 2 + dx * (20 + t * t * 160), H / 2 + 20, r, 'rgba(255,248,220,.95)');
    }
    // message bar
    if (this.msg) {
      const lines = wrap(this.msg, W - 60, 16);
      const h = lines.length * 22 + 22;
      drawWindow(16, 8, W - 32, h);
      lines.forEach((l, i) => text(l, 32, 19 + i * 22, UI.paper, 16, 'left', false));
      if (this.okWaiter) { const b = Math.floor(TIME * 4) % 2; ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(W - 40, h - 6 + b); ctx.lineTo(W - 28, h - 6 + b); ctx.lineTo(W - 34, h + 1 + b); ctx.fill(); }
    }
    // turn timer
    if (BattleClock.active || (this.active && BattleClock.t > 0)) {
      const f = BattleClock.t / BattleClock.max;
      const col = f > 0.5 ? UI.hp : f > 0.25 ? UI.gold : UI.bad;
      const ty = 82;
      const tw = Math.min(392, W - 248);
      drawWindow(W - tw - 16, ty, tw, 34);
      text(`⏱ ${BattleClock.t.toFixed(1)}s`, W - tw, ty + 8, col, 15);
      bar(W - tw + 82, ty + 13, tw - 100, 8, BattleClock.t, BattleClock.max, col);
      if (f < 0.25 && Math.floor(TIME * 6) % 2) { ctx.strokeStyle = UI.bad; ctx.lineWidth = 2; ctx.strokeRect(W - tw - 15, ty + 1, tw - 2, 32); ctx.lineWidth = 1; }
    }
    // party status + resolve
    const pw = Math.min(392, W - 232);
    const px = W - pw - 16, py = H - 150;
    drawWindow(px, py, pw, 142);
    G.party.forEach((m, i) => {
      const y = py + 14 + i * 28;
      const col = m.hp <= 0 ? UI.bad : this.active === m ? UI.gold : UI.paper;
      text(m.name + (m.cls !== 'hero' ? '' : ''), px + 16, y, col, 15);
      bar(px + 140, y + 5, 96, 7, m.hp, maxHP(m), m.hp < maxHP(m) * 0.25 ? UI.bad : UI.hp);
      text(`${m.hp}`, px + 280, y, col, 14, 'right');
      bar(px + 288, y + 5, 40, 7, m.mp, maxMP(m), UI.mp);
      text(`${m.mp}`, px + pw - 16, y, UI.mp, 14, 'right');
    });
    const ry = py + 120;
    text('RESOLVE', px + 16, ry, this.resolve >= 100 ? UI.sakura : UI.dim, 12);
    bar(px + 92, ry + 3, pw - 120, 8, this.resolve, 100, this.resolve >= 100 ? UI.sakura : UI.gold);
    if (this.resolve >= 100 && Math.floor(TIME * 3) % 2) text('READY', px + pw - 16, ry, UI.sakura, 12, 'right');
    if (this.flashT > 0) { ctx.globalAlpha = Math.min(1, this.flashT * 2); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
  drawFx() {
    for (const f of this.fx) {
      if (f.t < 0) continue;
      const p = f.t / f.dur;
      if (f.type === 'num') {
        ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
        // digits bounce in one after another, big ones overshoot
        const base = f.big ? 32 : 24;
        if (!/^\d+$/.test(f.txt)) {           // words (WEAK, PARRY, MISS…) pop in as one piece
          const q = clamp(p * 5, 0, 1), sz = Math.round(base * 0.85 * (q < 1 ? 0.5 + q * 0.7 : 1.2 - Math.min(0.2, p)));
          const yy = f.y - 30 - p * 24;
          text(f.txt, f.x + 2, yy + 2, UI.ink, sz, 'center'); text(f.txt, f.x, yy, f.col, sz, 'center');
          ctx.globalAlpha = 1; continue;
        }
        const cw = base * 0.55, n = f.txt.length, x0 = f.x - (n - 1) * cw / 2;
        for (let i = 0; i < n; i++) {
          const q = clamp(p * 5 - i * 0.35, 0, 1);
          const hop = Math.sin(q * Math.PI) * (f.big ? 22 : 14) * (q < 1 ? 1 : 0);
          const sz = Math.round(base * (q < 0.3 ? 0.6 + q * 2 : 1.2 - Math.min(0.2, (q - 0.3) * 0.6)));
          const yy = f.y - p * 18 - hop;
          if (q <= 0) continue;
          text(f.txt[i], x0 + i * cw + 2, yy + 2, UI.ink, sz, 'center'); text(f.txt[i], x0 + i * cw, yy, f.col, sz, 'center');
        }
        ctx.globalAlpha = 1;
      } else if (f.type === 'burst') {
        ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.col; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(f.x, f.y, 8 + p * 46, 0, 7); ctx.stroke();
        ctx.fillStyle = f.col;
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + p; ctx.fillRect(f.x + Math.cos(a) * p * 60 - 3, f.y + Math.sin(a) * p * 60 - 3, 6, 6); }
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
      } else if (f.type === 'slash') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.col; ctx.lineWidth = 6 * (1 - p) + 1;
        const a0 = -0.9 + f.seed, sweep = 2.4, e = a0 + sweep * Math.min(1, p * 2.2), s0 = Math.max(a0, e - 1.6);
        // filled crescent, thick in the middle and razor-thin at the ends
        ctx.fillStyle = f.col; ctx.beginPath();
        for (let k = 0; k <= 16; k++) { const a = s0 + (e - s0) * k / 16; ctx.lineTo(f.x + Math.cos(a) * 50, f.y + Math.sin(a) * 50); }
        for (let k = 16; k >= 0; k--) { const a = s0 + (e - s0) * k / 16, th = Math.sin(k / 16 * Math.PI) * 12 * (1 - p); ctx.lineTo(f.x + Math.cos(a) * (50 - th), f.y + Math.sin(a) * (50 - th)); }
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(f.x, f.y, 50, s0, e); ctx.stroke();
        ctx.restore();
      } else if (f.type === 'flame') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 14; i++) {
          const a = f.seed + i, rr = 10 + (i % 5) * 9;
          const yy = f.y + 30 - p * 80 - (i % 3) * 12;
          ctx.globalAlpha = (1 - p) * 0.9;
          ctx.fillStyle = i % 3 === 0 ? '#ffe070' : i % 3 === 1 ? '#f07a2a' : '#c83a1a';
          ctx.beginPath(); ctx.arc(f.x + Math.sin(a + p * 4) * rr, yy, 8 * (1 - p) + 3, 0, 7); ctx.fill();
        }
        ctx.restore();
      } else if (f.type === 'ice') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = f.col; ctx.globalAlpha = 1 - p;
        for (let i = 0; i < 7; i++) {
          const a = f.seed + i * 0.9, d = (1 - p) * 60;
          const x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d;
          ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 12); ctx.lineTo(x - 6, y); ctx.fill();
        }
        ctx.restore();
      } else if (f.type === 'bolt') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = f.col; ctx.lineWidth = 4 * (1 - p) + 1;
        ctx.beginPath(); ctx.moveTo(f.x, 0);
        let x = f.x, y = 0;
        while (y < f.y) { y += 26; x += Math.sin(f.seed + y * 0.1) * 18; ctx.lineTo(x, y); }
        ctx.stroke();
        glow(f.x, f.y, 70 * (1 - p), 'rgba(242,233,76,.7)');
        ctx.restore();
      } else if (f.type === 'holy') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - p) * 0.9;
        const g = ctx.createLinearGradient(0, f.y - 200, 0, f.y + 40);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,240,180,.9)');
        ctx.fillStyle = g; ctx.fillRect(f.x - 34 * (1 - p), f.y - 200, 68 * (1 - p), 240);
        ctx.restore();
      } else if (f.type === 'dark') {
        ctx.save(); ctx.globalAlpha = 1 - p;
        for (let i = 0; i < 10; i++) {
          const a = f.seed + i + p * 6, d = 12 + i * 5 * (1 - p * 0.5);
          ctx.fillStyle = i % 2 ? '#b04aff' : '#3a1060';
          ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * 0.7, 7 * (1 - p) + 2, 0, 7); ctx.fill();
        }
        ctx.restore();
      } else if (f.type === 'heal') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - p;
        for (let i = 0; i < 12; i++) {
          const a = f.seed + i * 1.1;
          ctx.fillStyle = f.col;
          ctx.fillRect(f.x + Math.sin(a + p * 3) * 26, f.y + 30 - p * 70 - i * 3, 3, 3);
        }
        ctx.restore();
      } else if (f.type === 'circle') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - p) * 0.8;
        ctx.strokeStyle = f.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, 44 * (0.4 + p), 14 * (0.4 + p), 0, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(f.x, f.y, 30 * (0.4 + p), 9 * (0.4 + p), 0, 0, 7); ctx.stroke();
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + p * 3; ctx.fillStyle = f.col; ctx.fillRect(f.x + Math.cos(a) * 44 * (0.4 + p), f.y + Math.sin(a) * 14 * (0.4 + p), 3, 3); }
        ctx.restore();
      } else if (f.type === 'break') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = UI.brk; ctx.lineWidth = 5 * (1 - p) + 1;
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + f.seed; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(a) * (30 + p * 90), f.y + Math.sin(a) * (30 + p * 90)); ctx.stroke(); }
        ctx.restore();
        if (p < 0.5) text('BREAK', f.x, f.y - 50, UI.brk, 26, 'center');
      } else if (f.type === 'charge') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = UI.bad; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, 70 * (1 - p) + 10, 0, 7); ctx.stroke();
        ctx.restore();
      } else if (f.type === 'team') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = f.col; ctx.lineWidth = 5 * (1 - p) + 1;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x2, f.y2); ctx.stroke();
        glow(f.x, f.y, 70, 'rgba(242,143,173,.6)'); glow(f.x2, f.y2, 70, 'rgba(242,143,173,.6)');
        ctx.restore();
      }
    }
  }
}

// ---------------------------------------------------------------- the timing bar
class StrikeScene {
  constructor(battle, kind, label) {
    this.transparent = true; this.b = battle; this.kind = kind; this.label = label;
    this.p = 0; this.dir = 1; this.done = false; this.flash = 0;
    this.speed = [0, 0.58, 0.7, 0.82, 0.94][Math.min(4, G.party.length)];
    this.good = kind === 'mag' ? 0.2 : 0.17;
    this.perfect = 0.045;
    this.center = rand(0.35, 0.65);
    this.promise = new Promise(r => this.resolve = r);
  }
  update(dt) {
    this.b.tick(dt);
    if (this.done) { this.flash -= dt; if (this.flash <= 0) { Scenes.remove(this); this.resolve(this.result); } return; }
    this.p += this.dir * this.speed * dt;
    if (this.p >= 1) { this.p = 1; this.dir = -1; }
    if (this.p <= 0) { this.p = 0; this.dir = 1; }
    if (Input.pressed('ok')) {
      const d = Math.abs(this.p - this.center);
      this.result = d <= this.perfect ? 1.35 : d <= this.good ? 1 : 'miss';
      Sound.sfx(this.result === 'miss' ? 'buzz' : this.result > 1 ? 'crit' : 'ok');
      this.done = true; this.flash = 0.35;
    }
  }
  draw() {
    const w = 400, x = (W - w) / 2, y = 196, h = 26;
    drawWindow(x - 20, y - 44, w + 40, 92);
    text(this.label.toUpperCase(), x, y - 34, this.kind === 'mag' ? UI.mp : UI.gold, 14);
    text(`Press ${Controls.label('ok')} in the light`, x + w, y - 34, UI.dim, 13, 'right', false);
    ctx.fillStyle = UI.ink; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#2a2448'; ctx.fillRect(x, y, w, h);
    const zc = this.kind === 'mag' ? '111,183,242' : '242,201,76';
    ctx.fillStyle = `rgba(${zc},.45)`; ctx.fillRect(x + (this.center - this.good) * w, y, this.good * 2 * w, h);
    ctx.fillStyle = `rgba(${zc},1)`; ctx.fillRect(x + (this.center - this.perfect) * w, y, this.perfect * 2 * w, h);
    const mx = x + this.p * w;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 2, y - 6, 4, h + 12);
    ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(mx - 7, y - 10); ctx.lineTo(mx + 7, y - 10); ctx.lineTo(mx, y - 2); ctx.fill();
    if (this.done) {
      const t = this.result === 'miss' ? 'MISS' : this.result > 1 ? 'PERFECT' : 'HIT';
      text(t, W / 2, y + 34, this.result === 'miss' ? UI.bad : this.result > 1 ? UI.gold : UI.paper, 16, 'center');
    }
  }
}

// ---------------------------------------------------------------- chained blade skills
class ChainScene {
  constructor(battle, sk) {
    this.transparent = true; this.b = battle; this.sk = sk;
    this.n = Math.max(2, Math.min(5, (sk.hits || 1) + 1));
    this.zones = [];
    for (let i = 0; i < this.n; i++) this.zones.push({ c: (i + 0.5) / this.n + rand(-0.04, 0.04), hit: 0 });
    this.p = 0; this.speed = 0.34 + this.n * 0.035 + G.party.length * 0.025;
    this.done = false; this.flash = 0; this.i = 0;
    this.promise = new Promise(r => this.resolve = r);
  }
  finish() {
    const good = this.zones.filter(z => z.hit).length;
    const perf = this.zones.filter(z => z.hit === 2).length;
    this.result = good === 0 ? 'miss' : 0.55 + 0.55 * (good / this.n) + 0.18 * (perf / this.n);
    if (good === this.n && perf >= this.n - 1) this.result = 1.45;
    this.done = true; this.flash = 0.4;
    Sound.sfx(good === 0 ? 'buzz' : good === this.n ? 'crit' : 'ok');
  }
  update(dt) {
    this.b.tick(dt);
    if (this.done) { this.flash -= dt; if (this.flash <= 0) { Scenes.remove(this); this.resolve(this.result); } return; }
    this.p += this.speed * dt;
    if (Input.pressed('ok')) {
      const z = this.zones[this.i];
      if (z) {
        const d = Math.abs(this.p - z.c);
        if (d < 0.035) { z.hit = 2; Sound.sfx('crit'); this.b.shakeT = 0.12; }
        else if (d < 0.09) { z.hit = 1; Sound.sfx('hit'); }
        else { Sound.sfx('buzz'); }
        this.i++;
      }
    }
    while (this.i < this.n && this.p > this.zones[this.i].c + 0.09) this.i++;
    if (this.p >= 1.05 || this.i >= this.n) this.finish();
  }
  draw() {
    const w = 440, x = (W - w) / 2, y = 196, h = 30;
    drawWindow(x - 20, y - 46, w + 40, 100);
    text(this.sk.name.toUpperCase(), x, y - 36, UI.gold, 14);
    text(`${this.n} presses — hit each mark`, x + w, y - 36, UI.dim, 13, 'right', false);
    ctx.fillStyle = UI.ink; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#2a2448'; ctx.fillRect(x, y, w, h);
    for (const z of this.zones) {
      ctx.fillStyle = z.hit === 2 ? UI.gold : z.hit ? 'rgba(242,201,76,.55)' : 'rgba(242,201,76,.22)';
      ctx.fillRect(x + (z.c - 0.045) * w, y, 0.09 * w, h);
      ctx.fillStyle = z.hit === 2 ? '#fff' : 'rgba(255,255,255,.5)';
      ctx.fillRect(x + z.c * w - 1, y, 2, h);
    }
    const mx = x + clamp(this.p, 0, 1) * w;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 2, y - 6, 4, h + 12);
    ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(mx - 7, y - 10); ctx.lineTo(mx + 7, y - 10); ctx.lineTo(mx, y - 2); ctx.fill();
    if (this.done) {
      const good = this.zones.filter(z => z.hit).length;
      text(good === 0 ? 'MISS' : good === this.n ? 'FULL CHAIN!' : `${good}/${this.n} HITS`, W / 2, y + 38, good === 0 ? UI.bad : good === this.n ? UI.gold : UI.paper, 16, 'center');
    }
  }
}

// ---------------------------------------------------------------- rune sequences for spells
// A rune is just a number; how you answer it depends on what you're playing with.
// Keyboard: it shows a letter and you type that letter. Touch or controller: it shows
// an arrow and you press that direction on the D-pad.
const RUNE_LETTERS = 'ASDFGHJKLQWERTUP'.split('');
const RUNE_DIRS = ['up', 'right', 'down', 'left'];
const Runes = {
  make() { return { n: irand(0, 9999) }; },
  keys() { return Controls.mode === 'keys'; },
  want(r) { return this.keys() ? 'Key' + RUNE_LETTERS[r.n % RUNE_LETTERS.length] : RUNE_DIRS[r.n % 4]; },
  // what the player answered this frame, or null
  pressed() {
    if (this.keys()) { for (const k of Input.pressedSet) if (/^Key[A-Z]$/.test(k) && !['KeyZ', 'KeyX', 'KeyC', 'KeyM'].includes(k)) return k; return null; }
    for (const d of RUNE_DIRS) if (Input.pressed(d)) return d;
    return null;
  },
  hint() { return this.keys() ? 'Type the letter' : 'Press the arrow'; },
  draw(r, cx, cy, size, col) {
    if (this.keys()) { text(RUNE_LETTERS[r.n % RUNE_LETTERS.length], cx, cy - size * 0.55, col, size, 'center'); return; }
    const d = RUNE_DIRS[r.n % 4], a = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI }[d], s = size * 0.5;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.moveTo(s + 3, 0); ctx.lineTo(-s * 0.2, -s - 3); ctx.lineTo(-s * 0.2, -s * 0.4); ctx.lineTo(-s - 3, -s * 0.4); ctx.lineTo(-s - 3, s * 0.4); ctx.lineTo(-s * 0.2, s * 0.4); ctx.lineTo(-s * 0.2, s + 3); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.1, -s); ctx.lineTo(-s * 0.1, -s * 0.3); ctx.lineTo(-s, -s * 0.3); ctx.lineTo(-s, s * 0.3); ctx.lineTo(-s * 0.1, s * 0.3); ctx.lineTo(-s * 0.1, s); ctx.fill();
    ctx.restore();
  }
};
class GlyphScene {
  constructor(battle, sk) {
    this.transparent = true; this.b = battle; this.sk = sk;
    this.n = sk.glyphs || 3;
    this.seq = Array.from({ length: this.n }, () => Runes.make());
    this.i = 0; this.good = 0; this.wrong = 0;
    this.per = Math.max(1.0, 1.9 - G.party.length * 0.08 - this.n * 0.03);
    this.t = 0; this.done = false; this.flash = 0;
    this.promise = new Promise(r => this.resolve = r);
  }
  finish() {
    this.result = this.good === 0 ? 'miss' : 0.5 + 0.7 * (this.good / this.n) + (this.good === this.n ? 0.2 : 0);
    this.done = true; this.flash = 0.4;
    Sound.sfx(this.good === 0 ? 'buzz' : this.good === this.n ? 'magic' : 'ok');
  }
  update(dt) {
    this.b.tick(dt);
    if (this.done) { this.flash -= dt; if (this.flash <= 0) { Scenes.remove(this); this.resolve(this.result); } return; }
    this.t += dt;
    const want = this.seq[this.i];
    const got = Runes.pressed();
    if (got) {
      if (got === Runes.want(want)) { this.good++; this.seq[this.i].ok = true; Sound.sfx('cursor'); }
      else { this.wrong++; this.seq[this.i].ok = false; Sound.sfx('buzz'); }
      this.i++; this.t = 0;
      if (this.i >= this.n) this.finish();
      return;
    }
    if (this.t > this.per) { this.seq[this.i].ok = false; this.i++; this.t = 0; Sound.sfx('buzz'); if (this.i >= this.n) this.finish(); }
  }
  draw() {
    const w = Math.min(460, W - 80), x = (W - w) / 2, y = 180;
    drawWindow(x, y, w, 120);
    text(this.sk.name.toUpperCase(), x + 20, y + 12, UI.mp, 14);
    text(Runes.hint() + (Runes.keys() ? 's' : 's'), x + w - 20, y + 12, UI.dim, 13, 'right', false);
    const gw = w / (this.n + 1);
    this.seq.forEach((g, i) => {
      const gx = x + gw * (i + 0.5) + gw * 0.25, gy = y + 48;
      const cur = i === this.i && !this.done;
      const col = g.ok === true ? UI.hp : g.ok === false ? UI.bad : cur ? UI.paper : UI.dim;
      if (cur) { glow(gx + 14, gy + 16, 34, 'rgba(111,183,242,.6)'); ctx.strokeStyle = UI.sakura; ctx.lineWidth = 2; ctx.strokeRect(gx - 4, gy - 4, 36, 40); }
      ctx.fillStyle = UI.ink; ctx.fillRect(gx, gy, 28, 32);
      ctx.fillStyle = '#2a2448'; ctx.fillRect(gx + 2, gy + 2, 24, 28);
      Runes.draw(g, gx + 14, gy + 17, 20, col);
    });
    if (!this.done) bar(x + 20, y + 100, w - 40, 6, this.per - this.t, this.per, this.t > this.per * 0.6 ? UI.bad : UI.mp);
    else text(this.good === this.n ? 'PERFECT CASTING!' : this.good ? `${this.good}/${this.n} runes` : 'FIZZLE', W / 2, y + 96, this.good === this.n ? UI.gold : this.good ? UI.paper : UI.bad, 16, 'center');
  }
}

// ---------------------------------------------------------------- parrying
class ParryScene {
  // Time slows, the camera closes in on you, the world goes grey, and a ring
  // closes around you. Press when it lands.
  constructor(battle, who, src) {
    this.transparent = true; this.b = battle; this.who = who; this.src = src;
    this.t = 0; this.window = [0.72, 1.18];
    this.dur = 1.4; this.result = 'none'; this.pressed = false; this.endAt = 0;
    const [x, y] = battle.pos(who);
    battle.focus = { x, y: y - 20, k: 0, who, src, release: false };
    this.lunge0 = src ? src.lunge : 0;
    if (src && src.sprKey && !src.sprKey.startsWith('m:')) src.pose = 'windup';
    Sound.sfx('charge');
    this.promise = new Promise(r => this.resolve = r);
  }
  update(dt) {
    this.b.tick(dt * 0.35);                       // everything else in slow motion
    this.t += dt;
    const f = this.b.focus;
    if (f && !f.release) f.k = Math.min(1, this.t / 0.3);
    if (this.src && !this.pressed) this.src.lunge = this.lunge0 + Math.min(1, this.t / this.window[0]) * 40;
    if (!this.pressed && this.t > 0.15 && Input.pressed('ok')) {
      this.pressed = true;
      this.result = (this.t >= this.window[0] && this.t <= this.window[1]) ? 'perfect' : 'early';
      if (this.result === 'perfect') {
        Sound.sfx('parry'); Sound.sfx('resolve'); this.b.shakeT = 0.2; this.flash = 1;
        const [x, y] = this.b.pos(this.who); this.b.impact(this.who, true, '#9ad0ff');
        if (this.src) this.src.lunge = this.lunge0 - 10;
      } else Sound.sfx('miss');
      this.endAt = this.t + (this.result === 'perfect' ? 0.7 : 0.35);
    }
    if (this.flash > 0) this.flash -= dt * 4;
    if ((this.pressed && this.t >= this.endAt) || (!this.pressed && this.t >= this.dur)) {
      if (this.src) { this.src.lunge = this.lunge0; if (this.src.pose === 'windup') this.src.pose = ''; }
      if (this.b.focus) this.b.focus.release = true;
      Scenes.remove(this); this.resolve(this.result);
    }
  }
  draw() {
    const [x0, y0] = this.b.pos(this.who);
    const [x, y] = this.b.focusPt(x0, y0 - 20);
    const [w0, w1] = this.window, t = this.t;
    const live = t >= w0 && t <= w1;
    if (!this.pressed) {
      // the closing ring
      const q = clamp((t - 0.1) / (w0 - 0.1), 0, 1), r = 170 - q * 110;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = live ? `rgba(242,143,173,${0.7 + 0.3 * Math.sin(TIME * 30)})` : 'rgba(255,255,255,.55)';
      ctx.lineWidth = live ? 7 : 3; ctx.beginPath(); ctx.arc(x, y, live ? 60 : r, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(242,143,173,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 60, 0, 7); ctx.stroke();
      ctx.restore();
      if (live) {
        glow(x, y - 96, 60, 'rgba(242,143,173,.6)');
        text('PARRY!', x, y - 118, UI.sakura, 30, 'center');
        const lbl = Controls.label('ok'), kw = Math.max(34, textWidth(lbl, 18) + 18);
        drawWindow(x - kw / 2, y - 80, kw, 30, 0.95); text(lbl, x, y - 74, UI.paper, 18, 'center');
      } else if (t < w0) {
        text('Get ready…', x, y - 110, 'rgba(240,230,210,.85)', 16, 'center');
      }
    } else if (this.result === 'perfect') {
      const p = clamp((t - (this.endAt - 0.7)) / 0.7, 0, 1), sz = Math.round(38 + (1 - p) * 20);
      glow(x, y - 100, 90, 'rgba(154,208,255,.7)');
      text('PARRIED!', x + 2, y - 118 + 2, UI.ink, sz, 'center'); text('PARRIED!', x, y - 118, '#bfe6ff', sz, 'center');
      if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
    } else {
      text('Too early!', x, y - 110, UI.dim, 20, 'center');
    }
  }
}

class TargetScene {
  constructor(battle, pool, idx) { this.transparent = true; this.b = battle; this.pool = pool; this.i = idx; this.promise = new Promise(r => this.resolve = r); }
  update(dt) {
    this.b.tick(dt);
    const n = this.pool.length;
    if (Input.pressed('left') || Input.pressed('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('right') || Input.pressed('down')) { this.i = (this.i + 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) { Sound.sfx('ok'); Scenes.remove(this); this.resolve(this.pool[this.i]); }
    if (Input.pressed('cancel')) { Sound.sfx('cancel'); Scenes.remove(this); this.resolve(null); }
  }
  draw() {
    const t = this.pool[this.i];
    const [x, y] = this.b.pos(t);
    const off = t.enemy ? t.size / 2 + 10 : 40;
    const bb = Math.sin(TIME * 8) * 3;
    ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.moveTo(x - 10, y - off - 16 + bb); ctx.lineTo(x + 10, y - off - 16 + bb); ctx.lineTo(x, y - off - 2 + bb); ctx.fill();
    ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(x - 7, y - off - 14 + bb); ctx.lineTo(x + 7, y - off - 14 + bb); ctx.lineTo(x, y - off - 5 + bb); ctx.fill();
    const label = t.enemy ? `${t.name}${t.weak ? `  (weak: ${t.weak})` : ''}${t.status.broken ? '  BROKEN' : ''}` : `${t.name}  ${t.hp}/${maxHP(t)}`;
    const w = textWidth(label, 15) + 28;
    drawWindow(W / 2 - w / 2, 250, w, 34);
    text(label, W / 2, 259, UI.paper, 15, 'center');
  }
}

// ---------------------------------------------------------------- entry points
async function battleTransition() {
  for (let i = 0; i < 2; i++) { await fadeOut(0.06, '#ffffff'); await fadeIn(0.06); }
  await fadeOut(0.22, '#000');
}
// opts: bg, music, intro, tutorial, spar, training, permadeath, noRun, maxRounds, returnTrack
async function startBattle(group, opts = {}) {
  if (opts.permadeath) { G.flags.kingFight = true; saveGame(true); if (typeof Cloud !== 'undefined' && Cloud.code) await Cloud.push(true); }
  Sound.sfx('encounter');
  await battleTransition();
  const b = new BattleScene(group, opts);
  Scenes.push(b);
  Sound.stop(); Sound.play(opts.music || (b.isBoss ? 'boss' : 'battle'));
  await fadeIn(0.2);
  const res = await b.run();
  BattleClock.stop();
  LAST_BATTLE = b;
  await fadeOut(0.35);
  Scenes.remove(b);
  for (const m of G.party) { m.status = {}; m.defending = false; m.pose = ''; if ((opts.tutorial || opts.spar || opts.training) && m.hp <= 0) m.hp = 1; }
  if (res === 'lose') {
    if (opts.permadeath) { await finalDeath(); return 'lose'; }
    await gameOver();
    return 'lose';
  }
  if (opts.permadeath) delete G.flags.kingFight;
  if (!opts.keepDark) { Sound.stop(); Sound.play(opts.returnTrack || musicFor(G.map)); await fadeIn(0.3); }
  return res;
}
let LAST_BATTLE = null;

async function bountyBattle(q) {
  const ok = await confirm(null, `${q.eliteName} blocks your path. Fight?`);
  if (!ok) return;
  const res = await startBattle([{ id: q.enemy, elite: { name: q.eliteName, mult: q.mult } }], { bg: MAPS[q.map].bg });
  if (res === 'win') { q.have = 1; Sound.sfx('coin'); toast(`Bounty complete. Return to a quest board.`, UI.hp); }
}
