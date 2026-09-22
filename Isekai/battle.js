// =====================================================================
//  battle.js : turn-based combat with timed strikes
//  - only the hero is player-controlled; companions act on their own
//  - the hero has a time limit per turn (15s solo, 10s with one ally, 5s with two)
//  - attacks and attack spells use a timing bar; missing it (or running out of
//    time) makes you fall back into a guard and lose 2% of your max HP
// =====================================================================
const BG = {
  forest: ['#6fa8c8', '#cfe6c4', '#4f8a3e', '#2f5a28'],
  cave:   ['#0c0808', '#241a18', '#3e3028', '#241c16'],
  wastes: ['#2a0e10', '#a8401e', '#4e4448', '#2e2629'],
  castle: ['#0a0614', '#34163c', '#342a48', '#1e182e'],
  dojo:   ['#3a2a1a', '#8a6a44', '#b8905c', '#8a6a44'],
  village:['#8ac0e0', '#f0e0c0', '#5ea84a', '#3a7a30']
};
const ELEM_COL = { fire: '#f07a2a', ice: '#9ae0ff', thunder: '#f2e94c', dark: '#b04aff', heal: '#7ed36f', none: '#ffffff' };

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
  const s = d.boss || d.human && id !== 'bandit' ? 1 : areaScale(mapId);
  const e = {
    id, name: d.name, sprKey: enemySprKey(id), boss: !!d.boss, king: !!d.king, human: !!d.human,
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
  const mon = e.sprKey.startsWith('m:');
  e.size = id === 'king' ? 176 : id === 'golem' ? 168 : id === 'chief' || id === 'duel' ? 120 : e.elite ? 112 : mon ? 96 : 96;
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
    this.enemies.forEach((e, i) => { e.x = 50 + (i + 0.5) * (320 / n); e.y = 300 + (n > 1 ? (i % 2 ? 16 : -14) : 0); });
    for (const m of G.party) { m.status = {}; m.defending = false; m.lunge = 0; m.flash = 0; m.shake = 0; }
    this.msg = ''; this.fx = []; this.shakeT = 0; this.flashT = 0; this.cross = null;
    this.active = null; this.okWaiter = null; this.round = 0; this.strike = null;
    this.isBoss = this.enemies.some(e => e.boss);
    this.noRun = this.opts.noRun || this.isBoss || this.opts.tutorial || this.opts.spar || this.opts.permadeath;
  }
  memberPos(m) { const i = G.party.indexOf(m); return [470 + i * 26, 150 + i * 74]; }

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
  pos(u) { if (u.enemy) return [u.x, u.y - u.size / 2]; const [x, y] = this.memberPos(u); return [x + 32, y - 30]; }
  num(u, txt, col) { const [x, y] = this.pos(u); this.fx.push({ type: 'num', x: x + rand(-8, 8), y: y - 10, txt: String(txt), col, t: 0, dur: 1.0 }); }
  burst(u, col) { const [x, y] = this.pos(u); this.fx.push({ type: 'burst', x, y, col, t: 0, dur: 0.5 }); }

  calc(src, tgt, sk, mult = 1) {
    let dmg, crit = false, tag = '';
    const def = this.S(tgt, 'def');
    if (sk.kind === 'mag') dmg = (sk.power || 0) + this.S(src, 'mag') * (sk.mult || 1) - def * 0.3;
    else if (sk.kind === 'hybrid') dmg = (this.S(src, 'atk') + this.S(src, 'mag')) * 0.55 * (sk.mult || 1) - def * 0.4;
    else {
      dmg = this.S(src, 'atk') * (sk.mult || 1) - def * (sk.pierce ? 0.2 : 0.5);
      if (Math.random() < 0.07) { crit = true; dmg *= 1.5; }
    }
    dmg *= rand(0.9, 1.1) * mult;
    if (mult >= 1.3) crit = true;
    if (sk.elem && tgt.weak === sk.elem) { dmg *= 1.6; tag = 'weak'; }
    if (sk.elem && tgt.resist === sk.elem) { dmg *= 0.5; tag = 'resist'; }
    if (tgt.defending) dmg *= 0.5;
    return { dmg: Math.max(1, Math.round(dmg)), crit, tag };
  }

  async hurt(tgt, amount, col = '#ffffff', crit) {
    tgt.hp = Math.max(0, tgt.hp - amount);
    if (!tgt.enemy && tgt.hp <= 0 && (this.opts.tutorial || this.opts.spar)) tgt.hp = 0;
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

  // ------------------------------------------------------------ the hero's timed turn
  async heroTurn(m) {
    this.active = m;
    let expire;
    const timeout = new Promise(r => expire = r);
    BattleClock.start(turnTime(), () => {
      while (Scenes.top() !== this && Scenes.stack.includes(this)) Scenes.pop(); // close any open menu
      this.strike = null;
      expire('timeout');
    });
    if (this.opts.tutorial && !this.tutorialShown) { BattleClock.paused = true; await this.tutorial(); BattleClock.paused = false; }
    let a = await Promise.race([this.commandFor(m), timeout]);
    if (a !== 'timeout' && a && this.needsStrike(a)) {
      const res = await Promise.race([this.runStrike(a), timeout]);
      if (res === 'timeout' || res === 'miss') a = 'miss';
      else a.mult = res;
    }
    BattleClock.stop();
    this.active = null;
    if (a === 'timeout' || a === 'miss') return this.autoGuard(m, a === 'timeout');
    return a;
  }
  needsStrike(a) {
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
  runStrike(a) {
    const kind = a.type === 'skill' ? SKILLS[a.skill].kind : 'phys';
    // the sweet spot shrinks a little for stronger skills, and the cursor speeds up in bigger parties
    const s = new StrikeScene(this, kind, a.type === 'skill' ? SKILLS[a.skill].name : 'Attack');
    Scenes.push(s);
    this.strike = s;
    return s.promise;
  }

  async commandFor(m) {
    while (true) {
      const cmds = ['Attack', 'Skill', 'Item', 'Defend', 'Run'];
      const items = cmds.map(c => ({ label: c, disabled: c === 'Run' && this.noRun }));
      const c = await list({ x: 16, y: 340, w: 208, items, rows: 5, rowH: 24, showDesc: false, cancel: false, index: m._lastCmd || 0 });
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

  // ------------------------------------------------------------ companions decide for themselves
  allyAI(m) {
    const party = this.aliveParty(), foes = this.aliveEnemies();
    const has = s => knownSkills(m).includes(s) && m.mp >= SKILLS[s].mp;
    const hurt = party.filter(p => p.hp < maxHP(p) * 0.45);
    if (hurt.length >= 2 && has('healall')) return { type: 'skill', src: m, skill: 'healall', tgt: 'allies' };
    if (hurt.length && has('heal')) return { type: 'skill', src: m, skill: 'heal', tgt: hurt.sort((a, b) => a.hp / maxHP(a) - b.hp / maxHP(b))[0] };
    const hero = G.party[0];
    if (m.cls === 'garrick') {
      if (hero.hp > 0 && hero.hp < maxHP(hero) * 0.5 && has('taunt') && !m.status.taunt) return { type: 'skill', src: m, skill: 'taunt', tgt: 'self' };
      if (this.isBoss && this.round % 4 === 1 && has('ironwill') && !m.status.defup) return { type: 'skill', src: m, skill: 'ironwill', tgt: 'allies' };
    }
    const reserve = m.cls === 'lyra' ? 5 : 0;
    const opts = knownSkills(m).map(s => SKILLS[s]).filter(s => (s.kind === 'phys' || s.kind === 'mag') && m.mp - s.mp >= reserve);
    let best = null, bestScore = 0;
    for (const s of opts) {
      const id = Object.keys(SKILLS).find(k => SKILLS[k] === s);
      const targets = s.target === 'enemies' ? foes : foes;
      for (const t of (s.target === 'enemies' ? [foes[0]] : targets)) {
        let score = (s.kind === 'mag' ? (s.power || 0) + stat(m, 'mag') * (s.mult || 1) : stat(m, 'atk') * (s.mult || 1));
        if (s.elem && t.weak === s.elem) score *= 1.6;
        if (s.elem && t.resist === s.elem) score *= 0.5;
        if (s.target === 'enemies') score *= Math.min(foes.length, 3) * 0.75;
        if (s.stun && !t.boss) score *= 1.15;
        if (score > bestScore) { bestScore = score; best = { type: 'skill', src: m, skill: id, tgt: s.target === 'enemies' ? 'enemies' : t }; }
      }
    }
    const atkScore = stat(m, 'atk');
    if (best && bestScore > atkScore * 1.15 && Math.random() < 0.85) return best;
    const weakest = foes.slice().sort((a, b) => a.hp - b.hp)[0];
    return { type: 'attack', src: m, tgt: weakest };
  }

  // ------------------------------------------------------------ main loop
  async run() {
    const names = this.enemies.map(e => e.name);
    await this.say(this.opts.intro || (this.isBoss ? `${this.enemies.find(e => e.boss).name} stands before you.` : names.length === 1 ? `${ENEMIES[this.enemies[0].id].human ? '' : 'A '}${names[0]} appears!` : `${names.length} enemies appear!`), 1.0);
    while (true) {
      this.round++;
      const acts = [];
      this.msg = '';
      for (const m of this.aliveParty()) {
        if (m.status.stun) { acts.push({ type: 'stunned', src: m }); continue; }
        if (m.cls === 'hero') { this.msg = `${m.name}'s turn.`; acts.push(await this.heroTurn(m)); }
        else acts.push(this.allyAI(m));
      }
      for (const e of this.aliveEnemies()) {
        const times = e.twice ? 2 : 1;
        for (let k = 0; k < times; k++) acts.push(e.status.stun ? { type: 'stunned', src: e } : this.enemyAI(e));
      }
      for (const a of acts) a.ord = a.type === 'defend' || a.type === 'guarded' ? 999 : a.type === 'run' ? 998 : this.S(a.src, 'spd') * rand(0.75, 1.25);
      acts.sort((a, b) => b.ord - a.ord);
      for (const a of acts) {
        if (a.src.hp <= 0) continue;
        const r = await this.exec(a);
        if (r === 'run') return 'run';
        if (!this.aliveEnemies().length) return await this.victory();
        if (!this.aliveParty().length) {
          if (this.opts.tutorial || this.opts.spar) { await this.say(this.opts.spar ? 'You drop to one knee. The duel is over.' : 'Daichi lowers his shinai.', 1.4); return 'yield'; }
          await this.say('The party has fallen…', 1.4); return 'lose';
        }
        const ph = await this.checkPhase();
        if (ph) return ph;
      }
      for (const u of [...G.party, ...this.enemies]) {
        u.defending = false;
        for (const k of Object.keys(u.status || {})) { if (k === 'stun') continue; u.status[k]--; if (u.status[k] <= 0) delete u.status[k]; }
      }
    }
  }

  async tutorial() {
    this.tutorialShown = true;
    const D = 'Daichi';
    await talk([
      [D, `Same as always. You don't get to think forever in a real fight, so you don't here either.`, 'daichi'],
      [null, `TIMED TURNS: When it's your turn, a timer runs at the top of the screen. Choose what to do before it empties.`],
      [null, `You have 15 seconds while you fight alone. Every companion who joins you later shortens it: 10 seconds with one, 5 seconds with two. Companions choose their own actions.`],
      [null, `TIMED STRIKES: When you attack, a bar appears. Press ${Controls.label('ok')} while the marker is inside the light zone. The bright centre is a perfect strike and deals extra damage.`],
      [null, `Miss the zone, or let the timer run out, and you automatically fall back into a guard. You'll take less damage this round, but lose 2% of your HP and your turn.`],
      [D, `Ready? Kamae.`, 'daichi']
    ]);
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
    const d = u.enemy ? 26 : -40;
    await tween(u, { lunge: d }, 0.12, easeOut);
    tween(u, { lunge: 0 }, 0.18);
  }

  async exec(a) {
    const s = a.src;
    const mult = a.mult || 1;
    const perfect = mult >= 1.3 ? 'Perfect strike! ' : '';
    if (a.type === 'guarded') return;
    if (a.type === 'stunned') { delete s.status.stun; await this.say(`${s.name} is stunned and can't move!`, 0.8); return; }
    if (a.type === 'defend') { s.defending = true; await this.say(`${s.name} braces.`, 0.6); return; }
    if (a.type === 'run') {
      const ps = this.aliveParty().reduce((t, m) => t + stat(m, 'spd'), 0) / this.aliveParty().length;
      const es = this.aliveEnemies().reduce((t, e) => t + e.spd, 0) / this.aliveEnemies().length;
      const chance = clamp(0.55 + (ps - es) * 0.03, 0.2, 0.95);
      if (Math.random() < chance) { Sound.sfx('run'); await this.say('You got away.', 0.9); return 'run'; }
      await this.say('Couldn\'t escape!', 0.8); return;
    }
    if (a.type === 'attack') {
      const t = this.retarget(s, a.tgt); if (!t) return;
      await this.lunge(s);
      if (s.enemy && Math.random() < 0.05) { Sound.sfx('miss'); this.num(t, 'Miss', UI.dim); await this.say(`${s.name} attacks, and misses.`, 0.7); return; }
      const r = this.calc(s, t, { kind: 'phys', mult: 1 }, mult);
      await this.hurt(t, r.dmg, '#ffffff', r.crit);
      await this.say(`${perfect}${!perfect && r.crit ? 'Critical hit! ' : ''}${s.name} hits ${t.name} for ${r.dmg}.${t.hp <= 0 ? this.downText(t) : ''}`, 0.85);
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
        await this.say('The bomb bursts into flame.', 0.5); return;
      }
      if (it.target === 'allies') { Sound.sfx('heal'); for (const m of this.aliveParty()) this.heal(m, it.heal); await this.say('The party recovers.', 0.7); return; }
      const t = a.tgt;
      if (it.revive) {
        if (t.hp > 0) { await this.say('It had no effect.', 0.6); return; }
        t.hp = Math.floor(maxHP(t) * it.revive); Sound.sfx('heal'); this.burst(t, ELEM_COL.heal);
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
        if (s.mp < sk.mp) { await this.say(`${s.name} doesn't have enough MP!`, 0.7); return; }
        s.mp -= sk.mp;
      }
      this.msg = `${perfect}${s.name} uses ${sk.name}!`;
      if (sk.fx === 'crossing') await this.crossingFx();
      else { if (sk.kind !== 'heal' && sk.kind !== 'buff') await this.lunge(s); Sound.sfx(sk.kind === 'heal' ? 'heal' : sk.kind === 'buff' ? 'buff' : sk.elem || (sk.kind === 'mag' ? 'magic' : 'hit')); await wait(0.25); }
      const foes = s.enemy ? this.aliveParty() : this.aliveEnemies();
      const friends = s.enemy ? this.aliveEnemies() : this.aliveParty();
      let targets;
      if (a.tgt === 'enemies') targets = foes;
      else if (a.tgt === 'allies') targets = friends;
      else if (a.tgt === 'self' || sk.target === 'self') targets = [s];
      else { const t = sk.kind === 'heal' ? (a.tgt.hp > 0 ? a.tgt : null) : this.retarget(s, a.tgt); targets = t ? [t] : []; }
      if (!targets.length) { await this.say('There was no target.', 0.6); return; }
      if (sk.kind === 'heal') {
        const total = [];
        for (const t of targets) total.push(this.heal(t, Math.floor(sk.power + this.S(s, sk.useAtk ? 'atk' : 'mag') * sk.scale)));
        await this.say(targets.length > 1 ? 'The party is healed.' : `${targets[0].name} recovers ${total[0]} HP.`, 0.8);
        return;
      }
      if (sk.kind === 'buff') {
        for (const t of targets) { t.status[sk.status] = sk.turns; this.burst(t, UI.gold); }
        await this.say(sk.status === 'taunt' ? `${s.name} draws the enemy's attention!` : 'The party\'s defence rises.', 0.8);
        return;
      }
      const lines = [];
      for (const t of targets) {
        this.burst(t, ELEM_COL[sk.elem || 'none']);
        const r = this.calc(s, t, sk, mult);
        await this.hurt(t, r.dmg, ELEM_COL[sk.elem || 'none'], r.crit);
        if (r.tag === 'weak') this.fx.push({ type: 'num', x: this.pos(t)[0], y: this.pos(t)[1] - 34, txt: 'WEAK!', col: UI.sakura, t: 0, dur: 1 });
        if (sk.drain) { const h = Math.floor(r.dmg * 0.6); s.hp = Math.min(s.enemy ? s.maxhp : maxHP(s), s.hp + h); this.num(s, h, UI.hp); }
        if (sk.stun && t.hp > 0 && !t.boss && Math.random() < sk.stun) { t.status.stun = 1; lines.push(`${t.name} is stunned!`); }
        if (targets.length === 1) lines.unshift(`${t.name} takes ${r.dmg} damage${r.tag === 'weak' ? ', a weak point' : r.tag === 'resist' ? ', but resists' : ''}.`);
        if (targets.length > 1) await wait(0.08);
      }
      const dead = targets.filter(t => t.hp <= 0).map(t => t.name);
      if (dead.length) lines.push(`${dead.join(', ')} ${dead.length > 1 ? 'are' : 'is'} ${s.enemy ? 'down' : 'defeated'}.`);
      await this.say(lines.join(' ') || `${sk.name} strikes everything in its path.`, 0.9);
    }
  }
  downText(t) {
    if (!t.enemy) return ` ${t.name} falls!`;
    if (t.id === 'kendo') return ` Daichi steps back and bows.`;
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
    Sound.play(this.isBoss ? 'boss' : 'battle');
  }

  async checkPhase() {
    const k = this.enemies.find(e => e.king && e.hp > 0 && !e.offered && e.hp <= e.maxhp * 0.5);
    if (!k) return null;
    k.offered = true;
    this.flashT = 0.4; Sound.stop();
    await this.say('Malgrath lowers his blade.', 1.4);
    this.msg = '';
    await talk([
      ['Malgrath', `Enough.`, 'king'],
      ['Malgrath', `You are stronger than the others the goddess sent. Strong enough to finish this. So before you do, hear me once.`, 'king'],
      ['Malgrath', `Three hundred years ago your kind drove mine into the Ashen Wastes. Nothing grows there. Our children eat ash and call it bread.`, 'king'],
      ['Malgrath', `Every village I have burned, I burned for land. Give the Ashborn the Wastes as our own, under treaty, recognised by your kings, and I will end this war tonight.`, 'king']
    ]);
    const c = await ask('Malgrath', `Make the deal, Otherworlder. Or finish what the goddess brought you here to do.`, ['Accept the deal.', 'Refuse.'], 'king', false);
    if (c === 0) { this.msg = 'The battle ends.'; return 'deal'; }
    await say('Malgrath', `…Then there is nothing left to say.`, 'king');
    Sound.play('boss');
    this.flashT = 0.6; Sound.sfx('dark'); this.shakeT = 0.6;
    k.atk = Math.floor(k.atk * 1.25); k.mag = Math.floor(k.mag * 1.25); k.def = Math.floor(k.def * 1.15); k.twice = true;
    k.hp = Math.min(k.maxhp, k.hp + Math.floor(k.maxhp * 0.12));
    await this.say('Ashfire pours from Malgrath\'s wounds. He will act twice each turn.', 1.8);
    return null;
  }

  async victory() {
    Sound.stop(); Sound.play('victory');
    if (this.opts.tutorial || this.opts.spar) { await wait(1.2); return 'win'; }
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
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter(f => f.t < f.dur);
  }

  drawBackground() {
    const [sky1, sky2, g1, g2] = BG[this.bg];
    const HOR = 230;
    const g = ctx.createLinearGradient(0, 0, 0, HOR);
    g.addColorStop(0, sky1); g.addColorStop(1, sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR);
    const r = mulberry(this.bg.length * 31);
    const layer = (col, base, amp, freq, seed) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, HOR); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base - Math.abs(Math.sin(x / freq + seed)) * amp - Math.sin(x / (freq * 0.37) + seed) * amp * 0.25); ctx.lineTo(W, HOR); ctx.fill(); };
    if (this.bg === 'forest' || this.bg === 'village') {
      ctx.fillStyle = 'rgba(255,255,230,.5)'; ctx.beginPath(); ctx.arc(520, 70, 30, 0, 7); ctx.fill();
      layer('#8ab0a0', 170, 50, 90, 1); layer('#5a8a5e', 195, 40, 60, 2);
      for (let i = 0; i < 22; i++) { const x = r() * W, h = 70 + r() * 70; ctx.fillStyle = i % 2 ? '#24582a' : '#2f6b30'; ctx.beginPath(); ctx.moveTo(x - 26, HOR); ctx.lineTo(x, HOR - h); ctx.lineTo(x + 26, HOR); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(x, HOR - h); ctx.lineTo(x - 26, HOR); ctx.lineTo(x - 10, HOR); ctx.fill(); }
      ctx.globalAlpha = 0.18; for (let i = 0; i < 4; i++) { ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.moveTo(380 + i * 60, 0); ctx.lineTo(420 + i * 60, 0); ctx.lineTo(300 + i * 60, HOR); ctx.lineTo(260 + i * 60, HOR); ctx.fill(); } ctx.globalAlpha = 1;
    } else if (this.bg === 'cave') {
      for (let i = 0; i < 18; i++) { const x = r() * W, h = 30 + r() * 80; ctx.fillStyle = i % 2 ? '#1a1210' : '#221816'; ctx.beginPath(); ctx.moveTo(x - 16, 0); ctx.lineTo(x, h); ctx.lineTo(x + 16, 0); ctx.fill(); }
      layer('#2a1e1a', 210, 40, 50, 3);
      for (let i = 0; i < 14; i++) { const x = r() * W, y = 60 + r() * 150; glowAt(x, y, 14, 'rgba(106,240,255,.45)'); ctx.fillStyle = '#bff8ff'; ctx.fillRect(x - 1, y - 1, 3, 3); }
    } else if (this.bg === 'wastes') {
      ctx.fillStyle = 'rgba(255,190,110,.5)'; ctx.beginPath(); ctx.arc(140, 110, 46, 0, 7); ctx.fill();
      layer('#4a1c1c', 160, 70, 120, 4); layer('#2e1216', 200, 40, 70, 5);
      ctx.fillStyle = 'rgba(255,120,40,.16)'; ctx.fillRect(0, 170, W, 60);
    } else if (this.bg === 'castle') {
      for (let i = 0; i < 7; i++) {
        const x = 30 + i * 96; ctx.fillStyle = '#160e22'; ctx.fillRect(x, 30, 40, 200); ctx.fillStyle = '#231a34'; ctx.fillRect(x + 4, 30, 8, 200);
        ctx.fillStyle = '#4a0e1c'; ctx.fillRect(x + 12, 70, 16, 40); ctx.fillStyle = '#6a1426'; ctx.fillRect(x + 14, 72, 12, 36);
        const fy = 54 + Math.sin(TIME * 7 + i) * 2; glowAt(x + 20, fy, 26, 'rgba(255,150,60,.45)'); ctx.fillStyle = '#f2c94c'; ctx.fillRect(x + 17, fy, 6, 8);
      }
    } else if (this.bg === 'dojo') {
      ctx.fillStyle = '#5a4028'; ctx.fillRect(0, 0, W, 60); ctx.fillStyle = '#e8dcc0'; for (let i = 0; i < 8; i++) { ctx.fillRect(20 + i * 80, 70, 64, 120); ctx.fillStyle = '#8a6a44'; ctx.fillRect(50 + i * 80, 70, 4, 120); ctx.fillRect(20 + i * 80, 128, 64, 4); ctx.fillStyle = '#e8dcc0'; }
      ctx.fillStyle = '#2a1a0e'; ctx.fillRect(280, 76, 80, 40); text('心', 320, 78, '#e8dcc0', 30, 'center');
    }
    const gg = ctx.createLinearGradient(0, HOR, 0, H);
    gg.addColorStop(0, g1); gg.addColorStop(1, g2);
    ctx.fillStyle = gg; ctx.fillRect(0, HOR, W, H - HOR);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let i = 0; i < 40; i++) ctx.fillRect(r() * W, HOR + 6 + r() * 150, 6 + r() * 24, 2);
    if (this.bg === 'dojo') { ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, HOR, 2, H - HOR); }
  }

  draw() {
    const sh = this.shakeT > 0 ? rand(-5, 5) : 0;
    ctx.save(); ctx.translate(sh, sh * 0.5);
    this.drawBackground();
    for (const e of this.enemies) {
      if (e.alpha <= 0) continue;
      const sx = e.x - e.size / 2 + e.lunge + (e.shake > 0 ? rand(-4, 4) : 0), sy = e.y - e.size;
      ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 2, e.size * 0.34, e.size * 0.09, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = e.alpha;
      if (e.king) glowAt(e.x, e.y - e.size / 2, e.size * 0.75, e.offered && e.twice ? 'rgba(255,40,60,.35)' : 'rgba(140,40,200,.3)');
      if (e.elite) glowAt(e.x, e.y - e.size / 2, e.size * 0.6, 'rgba(229,83,75,.35)');
      const mon = e.sprKey.startsWith('m:');
      const bob = mon ? Math.sin(TIME * 3 + e.x) * 3 : Math.sin(TIME * 2 + e.x) * 1;
      const img = mon ? monsterSprite(e.sprKey.slice(2), false, 48) : charSprite(e.sprKey, 'right', 0);
      ctx.drawImage(e.flash > 0 && Math.floor(e.flash * 20) % 2 ? whiteSilhouette(img) : img, sx, sy + bob, e.size, e.size);
      ctx.globalAlpha = 1;
      if (e.status.stun) text('✦ ✦', e.x, sy - 4, UI.gold, 14, 'center');
      if ((this.isBoss && e.boss || e.elite || e.human) && e.hp > 0) bar(e.x - 60, sy - 14, 120, 6, e.hp, e.maxhp, UI.bad);
    }
    G.party.forEach(m => {
      const [bx, by] = this.memberPos(m);
      const x = bx + m.lunge + (m.shake > 0 ? rand(-3, 3) : 0), y = by - 64;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(bx + 32, by - 2, 22, 6, 0, 0, 7); ctx.fill();
      const key = m.cls;
      if (m.hp <= 0) {
        ctx.save(); ctx.globalAlpha = 0.6; ctx.translate(x + 32, by - 14); ctx.rotate(-Math.PI / 2);
        ctx.drawImage(charSprite(key, 'left', 0), -32, -32, 64, 64); ctx.restore(); return;
      }
      const act = this.active === m;
      const img = charSprite(key, 'left', act ? (Math.floor(TIME * 4) % 2) : 0);
      ctx.drawImage(m.flash > 0 && Math.floor(m.flash * 20) % 2 ? whiteSilhouette(img) : img, x, y + (act ? -4 : 0), 64, 64);
      if (m.defending) { ctx.strokeStyle = 'rgba(111,183,242,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 32, y + 34, 34, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); ctx.lineWidth = 1; }
      if (m.status.taunt) text('!', x + 32, y - 14, UI.bad, 16, 'center');
      if (m.status.defup) { ctx.strokeStyle = 'rgba(242,201,76,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + 32, y + 34, 34, 38, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 1; }
      if (act) drawCursor(x - 18, y + 24);
    });
    for (const f of this.fx) {
      const p = f.t / f.dur;
      if (f.type === 'num') {
        ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
        const yy = f.y - p * 30 - Math.sin(Math.min(1, p * 3) * Math.PI) * 10;
        text(f.txt, f.x + 2, yy + 2, UI.ink, 24, 'center'); text(f.txt, f.x, yy, f.col, 24, 'center');
        ctx.globalAlpha = 1;
      } else if (f.type === 'burst') {
        ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.col; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(f.x, f.y, 8 + p * 46, 0, 7); ctx.stroke();
        ctx.fillStyle = f.col;
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + p; ctx.fillRect(f.x + Math.cos(a) * p * 60 - 3, f.y + Math.sin(a) * p * 60 - 3, 6, 6); }
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
      }
    }
    ctx.restore();
    // Last Crossing: darkness, two headlights, white
    if (this.cross) {
      const t = this.cross.t;
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.92, t * 2)})`; ctx.fillRect(0, 0, W, H);
      const r = 6 + t * t * 240;
      for (const dx of [-1, 1]) glowAt(W / 2 + dx * (20 + t * t * 160), H / 2 + 20, r, 'rgba(255,248,220,.95)');
    }
    // message bar
    if (this.msg) {
      const lines = wrap(this.msg, 580, 16);
      const h = lines.length * 22 + 22;
      drawWindow(16, 8, 608, h);
      lines.forEach((l, i) => text(l, 32, 19 + i * 22, UI.paper, 16, 'left', false));
      if (this.okWaiter) { const b = Math.floor(TIME * 4) % 2; ctx.fillStyle = UI.sakura; ctx.beginPath(); ctx.moveTo(600, h - 6 + b); ctx.lineTo(612, h - 6 + b); ctx.lineTo(606, h + 1 + b); ctx.fill(); }
    }
    // turn timer
    if (BattleClock.active || (this.active && BattleClock.t > 0)) {
      const f = BattleClock.t / BattleClock.max;
      const col = f > 0.5 ? UI.hp : f > 0.25 ? UI.gold : UI.bad;
      drawWindow(232, 290, 392, 34);
      text(`⏱ ${BattleClock.t.toFixed(1)}s`, 248, 298, col, 15);
      bar(330, 303, 280, 8, BattleClock.t, BattleClock.max, col);
      if (f < 0.25 && Math.floor(TIME * 6) % 2) { ctx.strokeStyle = UI.bad; ctx.lineWidth = 2; ctx.strokeRect(233, 291, 390, 32); ctx.lineWidth = 1; }
    }
    // status window
    drawWindow(232, 330, 392, 142);
    G.party.forEach((m, i) => {
      const y = 346 + i * 40;
      const col = m.hp <= 0 ? UI.bad : this.active === m ? UI.gold : UI.paper;
      text(m.name + (m.cls !== 'hero' ? '  ·AI' : ''), 250, y, col, 16);
      bar(386, y + 6, 100, 7, m.hp, maxHP(m), m.hp < maxHP(m) * 0.25 ? UI.bad : UI.hp);
      text(`${m.hp}`, 526, y, col, 15, 'right');
      bar(536, y + 6, 40, 7, m.mp, maxMP(m), UI.mp);
      text(`${m.mp}`, 610, y, UI.mp, 15, 'right');
    });
    if (this.flashT > 0) { ctx.globalAlpha = Math.min(1, this.flashT * 2); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
}
function glowAt(x, y, r, col) { glow(x, y, r, col); }

// ---------------------------------------------------------------- the timing bar
class StrikeScene {
  constructor(battle, kind, label) {
    this.transparent = true; this.b = battle; this.kind = kind; this.label = label;
    this.p = 0; this.dir = 1; this.done = false; this.flash = 0;
    // faster cursor when your party is larger — the whole turn is quicker
    this.speed = [0, 1.05, 1.3, 1.55][Math.min(3, G.party.length)];
    this.good = kind === 'mag' ? 0.2 : 0.17;       // half-width of the light zone
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
    const x = 120, y = 214, w = 400, h = 26;
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
    const label = t.enemy ? t.name + (t.weak ? `  (weak: ${t.weak})` : '') : `${t.name}  ${t.hp}/${maxHP(t)}`;
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
// opts: bg, music, intro, tutorial, spar, permadeath, noRun
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
  await fadeOut(0.35);
  Scenes.remove(b);
  for (const m of G.party) { m.status = {}; m.defending = false; if ((opts.tutorial || opts.spar) && m.hp <= 0) m.hp = 1; }
  if (res === 'lose') {
    if (opts.permadeath) { await finalDeath(); return 'lose'; }
    await gameOver();
    return 'lose';
  }
  if (opts.permadeath) delete G.flags.kingFight;
  if (!opts.keepDark) { Sound.stop(); Sound.play(musicFor(G.map)); await fadeIn(0.3); }
  return res;
}
async function bountyBattle(q) {
  const ok = await confirm(null, `${q.eliteName} blocks your path. Fight?`);
  if (!ok) return;
  const res = await startBattle([{ id: q.enemy, elite: { name: q.eliteName, mult: q.mult } }], { bg: MAPS[q.map].bg });
  if (res === 'win') { q.have = 1; Sound.sfx('coin'); toast(`Bounty complete. Return to the quest board.`, UI.hp); }
}
