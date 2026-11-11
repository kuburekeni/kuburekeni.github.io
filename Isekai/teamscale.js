// =====================================================================
//  teamscale.js : fights scale with the size of your party
//  A full party of four used to flatten anything, because four people
//  hit four times as hard while the enemy stayed the same. Now foes
//  meet you on your terms:
//   - more health, harder hits, a sturdier guard (break gauge)
//   - against three or four of you, enemies may press a second attack
//     in a round — bosses most of all
//   - a full party sometimes draws one more foe into a random fight
//   - and a little more experience and gold for the trouble
//  Tutorials, sparring, training and story bouts are left alone.
// =====================================================================
const TEAM = {
  HP: [1, 1, 1.4, 2.2, 3.0],         // ordinary foes, by party size (0..4)
  ATK: [1, 1, 1.05, 1.15, 1.25],
  BOSS_HP: [1, 1, 1, 1.7, 2.4],    // bosses are built for a party already, so gentler
  BOSS_ATK: [1, 1, 1, 1.05, 1.1],
  EXTRA: [0, 0, 0, 0.12, 0.22],        // chance an ordinary foe acts twice this round
  BOSS_EXTRA: [0, 0, 0, 0.15, 0.3],
  ADD: [0, 0, 0, 0.22, 0.42],         // chance a full party draws an extra foe
  XP: [1, 1, 1.08, 1.2, 1.35]
};
(function () {
  const P = BattleScene.prototype;
  const lay0 = P.layoutEnemies;
  P.layoutEnemies = function () {
    if (!this._teamScaled) {
      this._teamScaled = true;
      try { teamScale(this); } catch (e) { console.error(e); }
    }
    return lay0.call(this);
  };
  // re-roll who presses the attack each round
  const eor0 = P.endOfRound;
  P.endOfRound = async function () { const r = await eor0.call(this); rollPress(this); return r; };

  function partySize() { return Math.min(4, G.party.filter(m => m.hp > 0).length || 1); }
  function exempt(b) {
    const o = b.opts || {};
    return o.tutorial || o.spar || o.training || o.noScale || o.permadeath === 'duel' || (typeof INTRO === 'function' && INTRO());
  }
  function teamScale(b) {
    const n = partySize();
    b.teamN = n;
    if (n <= 1 || exempt(b)) return;
    const boss = b.enemies.some(e => e.boss);
    // a full party sometimes draws one more foe into an ordinary fight
    if (!boss && !b.opts.noExtra && b.enemies.length < 4 && b.enemies.every(e => !e.human && !e.elite) && Math.random() < TEAM.ADD[n]) {
      const pickE = b.enemies[Math.floor(Math.random() * b.enemies.length)];
      const extra = makeEnemy(pickE.id, G.map);
      b.enemies.push(extra);
      for (const e of b.enemies) if (!e.elite) e.name = ENEMIES[e.id].name;
      b.nameEnemies();
      b.addedFoe = extra.name;
    }
    for (const e of b.enemies) {
      const hf = e.boss ? TEAM.BOSS_HP[n] : TEAM.HP[n], af = e.boss ? TEAM.BOSS_ATK[n] : TEAM.ATK[n];
      e.maxhp = Math.round(e.maxhp * hf); e.hp = e.maxhp;
      e.atk = Math.round(e.atk * af); e.mag = Math.round(e.mag * af);
      e.def = Math.round(e.def * (1 + (af - 1) * 0.5));
      e.brkMax = Math.round(e.brkMax * Math.sqrt(hf)); e.brk = e.brkMax;
      e.xp = Math.round(e.xp * TEAM.XP[n]); e.gold = Math.round(e.gold * (1 + (TEAM.XP[n] - 1) * 0.6));
      e.baseTwice = !!e.twice;
    }
    rollPress(b);
  }
  function rollPress(b) {
    const n = b.teamN || 1;
    if (n <= 1 || exempt(b)) return;
    for (const e of b.enemies) {
      if (e.baseTwice) continue;
      const ch = e.boss ? TEAM.BOSS_EXTRA[n] : TEAM.EXTRA[n];
      e.twice = Math.random() < ch;
      e.pressing = e.twice;
    }
  }
  // say so when a foe presses the attack, so it doesn't feel random
  const ex0 = P.exec;
  P.exec = async function (a) {
    if (a && a.src && a.src.enemy && a.src.pressing && a.src.hp > 0) {
      a.src._pressCount = (a.src._pressRound === this.round ? a.src._pressCount : 0) + 1; a.src._pressRound = this.round;
      if (a.src._pressCount === 2) await this.say(`${a.src.name} presses the attack!`, 0.6);
    }
    return ex0.call(this, a);
  };
  // mention the extra foe in the opening line
  const run0 = P.run;
  P.run = function () {
    if (this.addedFoe && !this.opts.intro) { const n = this.enemies.length; this.opts.intro = `${n} enemies appear! Your numbers drew another ${ENEMIES[this.enemies[n - 1].id].name.toLowerCase()} in.`; }
    return run0.call(this);
  };
})();
