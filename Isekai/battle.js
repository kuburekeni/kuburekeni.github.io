// =====================================================================
//  battle.js : turn-based combat
// =====================================================================
const BG = {
  forest: ['#7ec8e8', '#cfeecf', '#4f9a3e', '#3a7a30'],
  cave:   ['#140e10', '#2a1f1c', '#4a3a30', '#3a2e26'],
  wastes: ['#4a1a1a', '#b8502a', '#5a5055', '#4a4045'],
  castle: ['#0e0818', '#3a1a40', '#3a3050', '#2e2640'],
  void:   ['#05030c', '#1a1040', '#2a2050', '#1a1438']
};
const ELEM_COL = { fire: '#f07a2a', ice: '#9ae0ff', thunder: '#f2e94c', dark: '#b04aff', heal: '#7ed36f', none: '#ffffff' };

function areaScale(mapId) {
  if (!G.postgame) return 1;
  const al = (MAPS[mapId] && MAPS[mapId].lvl) || 3;
  return Math.max(1, partyLevel() / al);
}

function makeEnemy(g, mapId) {
  const id = typeof g === 'string' ? g : g.id;
  const d = ENEMIES[id];
  const s = d.boss ? 1 : areaScale(mapId);
  const e = {
    id, name: d.name, sprKey: enemySprKey(id), boss: !!d.boss, king: !!d.king,
    maxhp: Math.floor(d.hp * Math.pow(s, 1.15)), atk: Math.floor(d.atk * Math.pow(s, 0.9)), def: Math.floor(d.def * Math.pow(s, 0.9)),
    mag: Math.floor(d.mag * Math.pow(s, 0.9)), spd: d.spd, xp: Math.floor(d.xp * s), gold: Math.floor(d.gold * s),
    weak: d.weak, resist: d.resist, skills: d.skills || [], status: {}, enemy: true,
    flash: 0, shake: 0, alpha: 1, lunge: 0
  };
  if (g.elite) {
    e.name = g.elite.name; e.elite = true;
    e.maxhp = Math.floor(e.maxhp * 3 * g.elite.mult); e.atk = Math.floor(e.atk * 1.35 * g.elite.mult);
    e.def = Math.floor(e.def * 1.3 * g.elite.mult); e.mag = Math.floor(e.mag * 1.35 * g.elite.mult);
    e.xp *= 5; e.gold *= 6; e.spd += 2;
  }
  e.hp = e.maxhp;
  e.size = id === 'king' ? 150 : id === 'golem' ? 140 : id === 'chief' ? 104 : e.elite ? 88 : 68;
  return e;
}

class BattleScene {
  constructor(group, opts) {
    this.opts = opts || {};
    this.bg = BG[this.opts.bg] ? this.opts.bg : 'forest';
    this.enemies = group.map(g => makeEnemy(g, G.map));
    const counts = {};
    for (const e of this.enemies) counts[e.name] = (counts[e.name] || 0) + 1;
    const seen = {};
    for (const e of this.enemies) if (counts[e.name] > 1) { seen[e.name] = (seen[e.name] || 0) + 1; e.name += ' ' + 'ABC'[seen[e.name] - 1]; }
    const n = this.enemies.length;
    this.enemies.forEach((e, i) => {
      e.x = 40 + (i + 0.5) * (320 / n);
      e.y = 262 + (n > 1 ? (i % 2 ? 18 : -14) : 0);
    });
    for (const m of G.party) { m.status = {}; m.defending = false; m.lunge = 0; m.flash = 0; m.shake = 0; }
    this.msg = ''; this.fx = []; this.shakeT = 0; this.flashT = 0; this.truck = null;
    this.active = null; this.okWaiter = null; this.round = 0;
    this.isBoss = this.enemies.some(e => e.boss);
  }
  memberPos(m) { const i = G.party.indexOf(m); return [500 + i * 22, 132 + i * 72]; }

  // ------------------------------------------------------------ helpers
  async say(m, t = 0.75) { this.msg = m; await wait(Input.held('ok') ? t * 0.5 : t); }
  waitOk() { return new Promise(r => this.okWaiter = r); }
  aliveEnemies() { return this.enemies.filter(e => e.hp > 0); }
  aliveParty() { return G.party.filter(m => m.hp > 0); }
  S(u, k) {
    if (!u.enemy) return stat(u, k);
    let v = u[k];
    if (k === 'def' && u.status.defup) v *= 1.5;
    return v;
  }
  pos(u) { if (u.enemy) return [u.x, u.y - u.size / 2]; const [x, y] = this.memberPos(u); return [x + 24, y - 24]; }
  num(u, txt, col) { const [x, y] = this.pos(u); this.fx.push({ type: 'num', x: x + rand(-8, 8), y: y - 10, txt: String(txt), col, t: 0, dur: 1.0 }); }
  burst(u, col) { const [x, y] = this.pos(u); this.fx.push({ type: 'burst', x, y, col, t: 0, dur: 0.5 }); }

  calc(src, tgt, sk) {
    let dmg, crit = false, tag = '';
    const def = this.S(tgt, 'def');
    if (sk.kind === 'mag') dmg = (sk.power || 0) + this.S(src, 'mag') * (sk.mult || 1) - def * 0.3;
    else {
      dmg = this.S(src, 'atk') * (sk.mult || 1) - def * (sk.pierce ? 0.2 : 0.5);
      if (Math.random() < 0.07) { crit = true; dmg *= 1.6; }
    }
    dmg *= rand(0.88, 1.12);
    if (sk.elem && tgt.weak === sk.elem) { dmg *= 1.6; tag = 'weak'; }
    if (sk.elem && tgt.resist === sk.elem) { dmg *= 0.5; tag = 'resist'; }
    if (tgt.defending) dmg *= 0.5;
    return { dmg: Math.max(1, Math.round(dmg)), crit, tag };
  }

  async hurt(tgt, amount, col = '#ffffff', crit) {
    tgt.hp = Math.max(0, tgt.hp - amount);
    tgt.flash = 0.3; tgt.shake = 0.3;
    this.num(tgt, amount, crit ? UI.gold : col);
    if (crit) this.shakeT = 0.3;
    Sound.sfx(tgt.enemy ? (crit ? 'crit' : 'hit') : 'hurt');
    if (tgt.hp <= 0) {
      if (tgt.enemy) { Sound.sfx('enemyDie'); tween(tgt, { alpha: 0 }, 0.5); }
      else { tgt.status = {}; }
    }
  }
  heal(tgt, amount) {
    const b = tgt.hp; tgt.hp = Math.min(tgt.enemy ? tgt.maxhp : maxHP(tgt), tgt.hp + amount);
    this.num(tgt, tgt.hp - b, UI.hp); this.burst(tgt, ELEM_COL.heal);
    return tgt.hp - b;
  }
  retarget(src, tgt) {
    if (tgt && tgt.hp > 0) return tgt;
    const pool = tgt && tgt.enemy ? this.aliveEnemies() : this.aliveParty();
    return pool.length ? pick(pool) : null;
  }

  // ------------------------------------------------------------ command input
  async commandFor(m) {
    this.active = m;
    while (true) {
      const cmds = ['Attack', 'Skill', 'Item', 'Defend', 'Run'];
      const items = cmds.map(c => ({ label: c, disabled: (c === 'Run' && (this.opts.noRun || this.isBoss)) }));
      const c = await list({ x: 16, y: 330, w: 208, items, rows: 5, rowH: 24, showDesc: false, cancel: true, index: m._lastCmd || 0 });
      if (c < 0) return 'back';
      m._lastCmd = c;
      if (c === 0) { const t = await this.pickTarget('enemy'); if (t) return { type: 'attack', src: m, tgt: t }; }
      if (c === 1) {
        const sk = knownSkills(m);
        const items = sk.map(s => ({ label: SKILLS[s].name, right: SKILLS[s].mp + ' MP', desc: SKILLS[s].desc, disabled: m.mp < SKILLS[s].mp }));
        const i = await list({ x: 16, y: 56, w: 380, items, title: `${m.name} — ${m.mp} MP`, rows: 6, index: m._lastSkill || 0 });
        if (i < 0) continue;
        m._lastSkill = i;
        const s = SKILLS[sk[i]];
        const t = await this.pickTarget(s.target, m);
        if (t) return { type: 'skill', src: m, skill: sk[i], tgt: t };
      }
      if (c === 2) {
        const ids = Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].type === 'use');
        const items = ids.map(k => ({ label: ITEMS[k].name, right: '×' + G.inv[k], desc: ITEMS[k].desc }));
        const i = await list({ x: 16, y: 56, w: 380, items, title: 'Items', rows: 6, empty: 'No items.' });
        if (i < 0 || !ids.length) continue;
        const it = ITEMS[ids[i]];
        const t = await this.pickTarget(it.target, m);
        if (t) return { type: 'item', src: m, item: ids[i], tgt: t };
      }
      if (c === 3) return { type: 'defend', src: m };
      if (c === 4) return { type: 'run', src: m };
    }
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

  // ------------------------------------------------------------ main loop
  async run() {
    const names = this.enemies.map(e => e.name);
    await this.say(this.isBoss ? `${this.enemies.find(e => e.boss).name} attacks!` : names.length === 1 ? `A ${names[0]} appears!` : `${names.length} monsters appear!`, 1.0);
    while (true) {
      this.round++;
      // --- commands
      const actors = this.aliveParty().filter(m => !m.status.stun);
      const acts = [];
      let i = 0;
      this.msg = '';
      while (i < actors.length) {
        this.msg = `What will ${actors[i].name} do?`;
        const a = await this.commandFor(actors[i]);
        if (a === 'back') { if (i > 0) { i--; acts.pop(); } continue; }
        acts[i] = a; i++;
      }
      this.active = null;
      for (const m of this.aliveParty()) if (m.status.stun) { acts.push({ type: 'stunned', src: m }); }
      // --- enemy actions
      for (const e of this.aliveEnemies()) {
        const times = e.twice ? 2 : 1;
        for (let k = 0; k < times; k++) acts.push(e.status.stun ? { type: 'stunned', src: e } : this.enemyAI(e));
      }
      // --- order: defend first, run first, then by speed
      for (const a of acts) a.ord = a.type === 'defend' ? 999 : a.type === 'run' ? 998 : this.S(a.src, 'spd') * rand(0.75, 1.25);
      acts.sort((a, b) => b.ord - a.ord);
      for (const a of acts) {
        if (a.src.hp <= 0) continue;
        const r = await this.exec(a);
        if (r === 'run') return 'run';
        if (!this.aliveEnemies().length) return await this.victory();
        if (!this.aliveParty().length) { await this.say('The party has fallen…', 1.4); return 'lose'; }
        await this.checkPhase();
      }
      // --- end of round
      for (const u of [...G.party, ...this.enemies]) {
        u.defending = false;
        for (const k of Object.keys(u.status || {})) { if (k === 'stun') continue; u.status[k]--; if (u.status[k] <= 0) delete u.status[k]; }
      }
    }
  }

  enemyAI(e) {
    const party = this.aliveParty();
    const taunter = party.find(m => m.status.taunt);
    const choose = () => taunter && Math.random() < 0.85 ? taunter : pick(party);
    const skillChance = e.king ? 0.55 : e.boss ? 0.4 : 0.33;
    if (e.skills.length && Math.random() < skillChance) {
      const s = pick(e.skills);
      return { type: 'skill', src: e, skill: s, tgt: SKILLS[s].target === 'enemies' ? 'enemies' : choose() };
    }
    return { type: 'attack', src: e, tgt: choose() };
  }

  async lunge(u) {
    const d = u.enemy ? 22 : -34;
    await tween(u, { lunge: d }, 0.12, easeOut);
    tween(u, { lunge: 0 }, 0.18);
  }

  async exec(a) {
    const s = a.src;
    if (a.type === 'stunned') { delete s.status.stun; await this.say(`${s.name} is stunned and can't move!`, 0.8); return; }
    if (a.type === 'defend') { s.defending = true; await this.say(`${s.name} braces for impact.`, 0.6); return; }
    if (a.type === 'run') {
      const ps = this.aliveParty().reduce((t, m) => t + stat(m, 'spd'), 0) / this.aliveParty().length;
      const es = this.aliveEnemies().reduce((t, e) => t + e.spd, 0) / this.aliveEnemies().length;
      const chance = clamp(0.55 + (ps - es) * 0.03, 0.2, 0.95);
      if (Math.random() < chance) { Sound.sfx('run'); await this.say('You got away safely!', 0.9); return 'run'; }
      await this.say('Couldn\'t escape!', 0.8); return;
    }
    if (a.type === 'attack') {
      const t = this.retarget(s, a.tgt); if (!t) return;
      await this.lunge(s);
      if (Math.random() < (t.enemy ? 0.04 : 0.05)) { Sound.sfx('miss'); this.num(t, 'Miss', UI.dim); await this.say(`${s.name} attacks… and misses!`, 0.7); return; }
      const r = this.calc(s, t, { kind: 'phys', mult: 1 });
      await this.hurt(t, r.dmg, '#ffffff', r.crit);
      await this.say(`${r.crit ? 'Critical hit! ' : ''}${s.name} attacks ${t.name} for ${r.dmg}.${t.hp <= 0 ? (t.enemy ? ` ${t.name} is defeated!` : ` ${t.name} falls!`) : ''}`, 0.85);
      return;
    }
    if (a.type === 'item') {
      const it = ITEMS[a.item];
      if (!itemCount(a.item)) { await this.say(`No ${it.name} left!`, 0.6); return; }
      removeItem(a.item);
      await this.say(`${s.name} uses a ${it.name}.`, 0.5);
      if (it.target === 'enemies') {
        Sound.sfx('fire');
        for (const e of this.aliveEnemies()) { this.burst(e, ELEM_COL.fire); let d = it.dmg; if (e.weak === 'fire') d *= 1.6; if (e.resist === 'fire') d *= 0.5; await this.hurt(e, Math.round(d), ELEM_COL.fire); }
        await this.say('Boom!', 0.5); return;
      }
      if (it.target === 'allies') { Sound.sfx('heal'); for (const m of this.aliveParty()) this.heal(m, it.heal); await this.say('The party recovers!', 0.7); return; }
      const t = a.tgt;
      if (it.revive) {
        if (t.hp > 0) { await this.say('It had no effect.', 0.6); return; }
        t.hp = Math.floor(maxHP(t) * it.revive); Sound.sfx('heal'); this.burst(t, ELEM_COL.heal);
        await this.say(`${t.name} is revived!`, 0.8); return;
      }
      if (t.hp <= 0) { await this.say('It had no effect.', 0.6); return; }
      if (it.heal) { Sound.sfx('heal'); const h = this.heal(t, it.heal); await this.say(`${t.name} recovers ${h} HP.`, 0.7); }
      if (it.mpheal) { Sound.sfx('heal'); const b = t.mp; t.mp = Math.min(maxMP(t), t.mp + it.mpheal); this.num(t, t.mp - b, UI.mp); await this.say(`${t.name} recovers ${t.mp - b} MP.`, 0.7); }
      return;
    }
    if (a.type === 'skill') {
      const sk = SKILLS[a.skill];
      if (!s.enemy) {
        if (s.mp < sk.mp) { await this.say(`${s.name} doesn't have enough MP!`, 0.7); return; }
        s.mp -= sk.mp;
      }
      this.msg = `${s.name} uses ${sk.name}!`;
      if (sk.fx === 'truck') await this.truckFx();
      else { if (sk.kind !== 'heal' && sk.kind !== 'buff') await this.lunge(s); Sound.sfx(sk.kind === 'heal' ? 'heal' : sk.kind === 'buff' ? 'buff' : sk.elem || (sk.kind === 'mag' ? 'magic' : 'hit')); await wait(0.25); }
      const foes = s.enemy ? this.aliveParty() : this.aliveEnemies();
      const friends = s.enemy ? this.aliveEnemies() : this.aliveParty();
      let targets;
      if (a.tgt === 'enemies') targets = foes;
      else if (a.tgt === 'allies') targets = friends;
      else if (a.tgt === 'self' || sk.target === 'self') targets = [s];
      else { const t = sk.kind === 'heal' ? (a.tgt.hp > 0 ? a.tgt : null) : this.retarget(s, a.tgt); targets = t ? [t] : []; }
      if (!targets.length) { await this.say('But there was no target.', 0.6); return; }
      if (sk.kind === 'heal') {
        let total = [];
        for (const t of targets) total.push(this.heal(t, Math.floor(sk.power + this.S(s, 'mag') * sk.scale)));
        await this.say(targets.length > 1 ? 'The party is healed!' : `${targets[0].name} recovers ${total[0]} HP.`, 0.8);
        return;
      }
      if (sk.kind === 'buff') {
        for (const t of targets) { t.status[sk.status] = sk.turns; this.burst(t, UI.gold); }
        await this.say(sk.status === 'taunt' ? `${s.name} draws the enemy's attention!` : 'The party\'s defence rises!', 0.8);
        return;
      }
      const lines = [];
      for (const t of targets) {
        this.burst(t, ELEM_COL[sk.elem || 'none']);
        const r = this.calc(s, t, sk);
        await this.hurt(t, r.dmg, ELEM_COL[sk.elem || 'none'], r.crit);
        if (r.tag === 'weak') this.fx.push({ type: 'num', x: this.pos(t)[0], y: this.pos(t)[1] - 34, txt: 'WEAK!', col: UI.sakura, t: 0, dur: 1 });
        if (sk.drain) { const h = Math.floor(r.dmg * 0.6); s.hp = Math.min(s.enemy ? s.maxhp : maxHP(s), s.hp + h); this.num(s, h, UI.hp); }
        if (sk.stun && t.hp > 0 && !t.boss && Math.random() < sk.stun) { t.status.stun = 1; lines.push(`${t.name} is stunned!`); }
        if (targets.length === 1) lines.unshift(`${t.name} takes ${r.dmg} damage${r.tag === 'weak' ? ' — it\'s super effective' : r.tag === 'resist' ? ' — it resists' : ''}.`);
        if (targets.length > 1) await wait(0.08);
      }
      const dead = targets.filter(t => t.hp <= 0).map(t => t.name);
      if (dead.length) lines.push(`${dead.join(', ')} ${dead.length > 1 ? 'are' : 'is'} ${s.enemy ? 'knocked out' : 'defeated'}!`);
      await this.say(lines.join(' ') || `${sk.name} hits everyone!`, 0.9);
    }
  }

  async truckFx() {
    this.truck = { x: W + 40 };
    Sound.sfx('horn');
    await wait(0.4);
    await tween(this.truck, { x: -340 }, 0.7, easeIn);
    Sound.sfx('crash'); this.shakeT = 0.5; this.flashT = 0.25;
    this.truck = null;
  }

  async checkPhase() {
    const k = this.enemies.find(e => e.king && e.hp > 0 && !e.phase2 && e.hp <= e.maxhp * 0.5);
    if (!k) return;
    k.phase2 = true;
    this.flashT = 0.6; Sound.sfx('dark'); this.shakeT = 0.6;
    await this.say('Malgrath: "Three hundred years I\'ve waited for someone who could make me bleed."', 2.2);
    await this.say('Malgrath: "Don\'t you dare stop now. SHOW ME WHAT TRUCK-KUN GAVE YOU!"', 2.2);
    k.atk = Math.floor(k.atk * 1.2); k.mag = Math.floor(k.mag * 1.2); k.def = Math.floor(k.def * 1.1); k.twice = true;
    k.hp = Math.min(k.maxhp, k.hp + Math.floor(k.maxhp * 0.1));
    await this.say('Malgrath\'s true power awakens! He will act twice each turn.', 1.6);
  }

  async victory() {
    Sound.stop(); Sound.play('victory');
    const xp = this.enemies.reduce((t, e) => t + e.xp, 0);
    const gold = this.enemies.reduce((t, e) => t + e.gold, 0);
    G.gold += gold; G.kills += this.enemies.length;
    for (const e of this.enemies) for (const q of G.quests) if (q.type === 'hunt' && q.enemy === e.id && q.have < q.need) q.have++;
    if (this.enemies.some(e => e.king)) { this.msg = 'Malgrath falls to one knee…'; await wait(1.6); return 'win'; }
    this.msg = `Victory! Gained ${xp} XP and ${gold} G.`;
    await this.waitOk();
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
    for (const u of [...G.party, ...this.enemies]) { if (u.flash > 0) u.flash -= dt; if (u.shake > 0) u.shake -= dt; }
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter(f => f.t < f.dur);
  }

  drawBackground() {
    const [sky1, sky2, g1, g2] = BG[this.bg];
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, sky1); g.addColorStop(1, sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
    const r = mulberry(this.bg.length * 31);
    if (this.bg === 'forest') {
      for (let i = 0; i < 18; i++) { const x = r() * W, h = 60 + r() * 60; ctx.fillStyle = i % 2 ? '#2f6b2a' : '#3f8a38'; ctx.beginPath(); ctx.moveTo(x - 30, 200); ctx.lineTo(x, 200 - h); ctx.lineTo(x + 30, 200); ctx.fill(); }
    } else if (this.bg === 'cave') {
      for (let i = 0; i < 16; i++) { const x = r() * W, h = 30 + r() * 70; ctx.fillStyle = '#1e1614'; ctx.beginPath(); ctx.moveTo(x - 14, 0); ctx.lineTo(x, h); ctx.lineTo(x + 14, 0); ctx.fill(); }
      for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(106,240,255,.5)'; ctx.fillRect(r() * W, 60 + r() * 130, 3, 3); }
    } else if (this.bg === 'wastes') {
      for (let i = 0; i < 6; i++) { const x = r() * W; ctx.fillStyle = '#2a1618'; ctx.beginPath(); ctx.moveTo(x - 90, 200); ctx.lineTo(x, 110 + r() * 40); ctx.lineTo(x + 90, 200); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,120,40,.12)'; ctx.fillRect(0, 150, W, 50);
    } else if (this.bg === 'castle') {
      for (let i = 0; i < 7; i++) { const x = 40 + i * 95; ctx.fillStyle = '#1a1026'; ctx.fillRect(x, 40, 34, 160); ctx.fillStyle = '#6a1020'; ctx.fillRect(x + 12, 70, 10, 26); ctx.fillStyle = '#f2c94c'; ctx.fillRect(x + 15, 60 + Math.sin(TIME * 6 + i) * 2, 4, 6); }
    }
    const gg = ctx.createLinearGradient(0, 200, 0, H);
    gg.addColorStop(0, g1); gg.addColorStop(1, g2);
    ctx.fillStyle = gg; ctx.fillRect(0, 200, W, H - 200);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let i = 0; i < 40; i++) ctx.fillRect(r() * W, 205 + r() * 120, 6 + r() * 20, 2);
  }

  draw() {
    const sh = this.shakeT > 0 ? rand(-5, 5) : 0;
    ctx.save(); ctx.translate(sh, sh * 0.5);
    this.drawBackground();
    // enemies
    for (const e of this.enemies) {
      if (e.alpha <= 0) continue;
      const sx = e.x - e.size / 2 + e.lunge + (e.shake > 0 ? rand(-4, 4) : 0), sy = e.y - e.size;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 2, e.size * 0.36, e.size * 0.1, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = e.alpha;
      if (e.king) { ctx.globalAlpha = e.alpha * (0.3 + Math.sin(TIME * 3) * 0.1); ctx.fillStyle = e.phase2 ? '#ff2040' : '#8a20c0'; ctx.beginPath(); ctx.ellipse(e.x, e.y - e.size / 2, e.size * 0.55, e.size * 0.6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = e.alpha; }
      if (e.elite) { ctx.globalAlpha = e.alpha * 0.35; ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.ellipse(e.x, e.y - e.size / 2, e.size * 0.5, e.size * 0.5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = e.alpha; }
      const bob = e.sprKey.startsWith('m:') ? Math.sin(TIME * 3 + e.x) * 2 : 0;
      const img = charSprite(e.sprKey, e.sprKey.startsWith('m:') ? 'right' : 'right', 0);
      const mimg = e.sprKey.startsWith('m:') ? monsterSprite(e.sprKey.slice(2), false) : img;
      ctx.drawImage(e.flash > 0 && Math.floor(e.flash * 20) % 2 ? whiteSilhouette(mimg) : mimg, sx, sy + bob, e.size, e.size);
      ctx.globalAlpha = 1;
      if (e.status.stun) text('✦ ✦', e.x, sy - 4, UI.gold, 14, 'center');
      if (this.isBoss && e.boss && e.hp > 0) { bar(e.x - 60, sy - 16, 120, 6, e.hp, e.maxhp, UI.bad); }
    }
    // party
    G.party.forEach((m, i) => {
      const [bx, by] = this.memberPos(m);
      const x = bx + m.lunge + (m.shake > 0 ? rand(-3, 3) : 0), y = by - 48;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(bx + 24, by - 2, 18, 5, 0, 0, 7); ctx.fill();
      const key = m.cls === 'hero' ? 'hero' : m.cls;
      if (m.hp <= 0) {
        ctx.save(); ctx.globalAlpha = 0.6; ctx.translate(x + 24, by - 10); ctx.rotate(-Math.PI / 2);
        ctx.drawImage(charSprite(key, 'left', 0), -24, -24, 48, 48); ctx.restore(); return;
      }
      const moving = this.active === m;
      const img = charSprite(key, 'left', moving ? (Math.floor(TIME * 4) % 2) : 0);
      ctx.drawImage(m.flash > 0 && Math.floor(m.flash * 20) % 2 ? whiteSilhouette(img) : img, x, y + (moving ? -4 : 0), 48, 48);
      if (m.defending) text('🛡', x - 8, y + 4, UI.paper, 14);
      if (m.status.taunt) text('!', x + 24, y - 14, UI.bad, 16, 'center');
      if (m.status.defup) { ctx.strokeStyle = 'rgba(242,201,76,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + 24, y + 26, 28, 30, 0, 0, 7); ctx.stroke(); }
      if (moving) drawCursor(x - 18, y + 16);
    });
    // truck
    if (this.truck) this.drawTruck(this.truck.x, 170);
    // fx
    for (const f of this.fx) {
      const p = f.t / f.dur;
      if (f.type === 'num') {
        ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
        text(f.txt, f.x, f.y - p * 30 - Math.sin(Math.min(1, p * 3) * Math.PI) * 10, f.col, 22, 'center');
        ctx.globalAlpha = 1;
      } else if (f.type === 'burst') {
        ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.col; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(f.x, f.y, 8 + p * 46, 0, 7); ctx.stroke();
        ctx.fillStyle = f.col;
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + p; ctx.fillRect(f.x + Math.cos(a) * p * 60 - 3, f.y + Math.sin(a) * p * 60 - 3, 6, 6); }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    // message bar
    if (this.msg) {
      const lines = wrap(this.msg, 580, 16);
      const h = lines.length * 22 + 22;
      drawWindow(16, 8, 608, h);
      lines.forEach((l, i) => text(l, 32, 19 + i * 22, UI.paper, 16, 'left', false));
      if (this.okWaiter) { const b = Math.floor(TIME * 4) % 2; ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(600, h - 6 + b); ctx.lineTo(612, h - 6 + b); ctx.lineTo(606, h + 1 + b); ctx.fill(); }
    }
    // status window
    drawWindow(232, 330, 392, 142);
    G.party.forEach((m, i) => {
      const y = 346 + i * 40;
      const col = m.hp <= 0 ? UI.bad : this.active === m ? UI.gold : UI.paper;
      text(m.name, 250, y, col, 16);
      bar(356, y + 6, 110, 7, m.hp, maxHP(m), m.hp < maxHP(m) * 0.25 ? UI.bad : UI.hp);
      text(`${m.hp}`, 506, y, col, 15, 'right');
      bar(520, y + 6, 50, 7, m.mp, maxMP(m), UI.mp);
      text(`${m.mp}`, 608, y, UI.mp, 15, 'right');
    });
    if (this.flashT > 0) { ctx.globalAlpha = this.flashT * 2; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  drawTruck(x, y) {
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 10, y + 118, 300, 12);
    ctx.fillStyle = UI.ink; ctx.fillRect(x - 3, y + 17, 306, 104);
    ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x + 90, y + 20, 210, 90);
    ctx.fillStyle = '#c83a3a'; ctx.fillRect(x + 90, y + 58, 210, 10);
    text('TRUCK-KUN EXPRESS', x + 195, y + 34, '#c83a3a', 16, 'center');
    ctx.fillStyle = '#3a78c8'; ctx.fillRect(x, y + 40, 90, 70);
    ctx.fillStyle = '#a8e0ff'; ctx.fillRect(x + 10, y + 48, 44, 28);
    ctx.fillStyle = '#fff3a0'; ctx.fillRect(x - 4, y + 88, 10, 12);
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.moveTo(x, y + 94); ctx.lineTo(x - 120, y + 60); ctx.lineTo(x - 120, y + 130); ctx.fill(); ctx.globalAlpha = 1;
    for (const wx of [30, 200, 260]) { ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x + wx, y + 112, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(x + wx, y + 112, 6, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 310 + i * 26, y + 40 + i * 14, 30, 3);
  }
}

class TargetScene {
  constructor(battle, pool, idx) { this.transparent = true; this.b = battle; this.pool = pool; this.i = idx; this.promise = new Promise(r => this.resolve = r); }
  update() {
    const n = this.pool.length;
    if (Input.pressed('left') || Input.pressed('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('right') || Input.pressed('down')) { this.i = (this.i + 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) { Sound.sfx('ok'); Scenes.remove(this); this.resolve(this.pool[this.i]); }
    if (Input.pressed('cancel')) { Sound.sfx('cancel'); Scenes.remove(this); this.resolve(null); }
  }
  draw() {
    const t = this.pool[this.i];
    const [x, y] = this.b.pos(t);
    const off = t.enemy ? t.size / 2 + 10 : 34;
    const bb = Math.sin(TIME * 8) * 3;
    ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.moveTo(x - 10, y - off - 16 + bb); ctx.lineTo(x + 10, y - off - 16 + bb); ctx.lineTo(x, y - off - 2 + bb); ctx.fill();
    ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(x - 7, y - off - 14 + bb); ctx.lineTo(x + 7, y - off - 14 + bb); ctx.lineTo(x, y - off - 5 + bb); ctx.fill();
    const label = t.enemy ? `${t.name}${t.weak ? '' : ''}` : `${t.name}  ${t.hp}/${maxHP(t)}`;
    const w = textWidth(label, 15) + 28;
    drawWindow(W / 2 - w / 2, 290, w, 34);
    text(label, W / 2, 299, UI.paper, 15, 'center');
  }
}

// ------------------------------------------------------------------ entry points
async function battleTransition() {
  for (let i = 0; i < 2; i++) { await fadeOut(0.06, '#ffffff'); await fadeIn(0.06); }
  await fadeOut(0.22, '#000');
}
async function startBattle(group, opts = {}) {
  Sound.sfx('encounter');
  await battleTransition();
  const b = new BattleScene(group, opts);
  Scenes.push(b);
  Sound.stop(); Sound.play(opts.music || (b.isBoss ? 'boss' : 'battle'));
  await fadeIn(0.2);
  const res = await b.run();
  await fadeOut(0.35);
  Scenes.remove(b);
  for (const m of G.party) { m.status = {}; m.defending = false; }
  if (res === 'lose') {
    await gameOver();
    return 'lose';
  }
  Sound.stop(); Sound.play(World.map.music);
  await fadeIn(0.3);
  return res;
}
async function bountyBattle(q) {
  const ok = await confirm(null, `${q.eliteName} glares at you. Fight it?`);
  if (!ok) return;
  const res = await startBattle([{ id: q.enemy, elite: { name: q.eliteName, mult: q.mult } }], { bg: MAPS[q.map].bg });
  if (res === 'win') { q.have = 1; Sound.sfx('coin'); toast(`Bounty complete! Return to the quest board.`, UI.hp); }
}
