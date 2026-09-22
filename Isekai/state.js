// =====================================================================
//  state.js : game state, party stats, levelling, inventory
// =====================================================================
let G = null;

function newGameState() {
  return {
    name: 'Haruto', gender: 'boy', hair: '#1e1a26',
    party: [], inv: {}, gold: 0, flags: {},
    map: 'village', x: 5, y: 6, dir: 'up',
    quests: [], board: [], questCounter: 0, questsDone: 0,
    playTime: 0, ending: null, postgame: false, kills: 0
  };
}

function makeMember(cls, name, lvl = 1) {
  const m = { cls, name, lvl, xp: 0, hp: 1, mp: 1, equip: {} };
  if (cls === 'hero') m.equip = { weapon: 'wsword', armor: 'uniform' };
  if (cls === 'lyra') m.equip = { weapon: 'ostaff', armor: 'tunic' };
  if (cls === 'garrick') m.equip = { weapon: 'axe1', armor: 'tunic' };
  m.hp = maxHP(m); m.mp = maxMP(m);
  return m;
}

function baseStat(m, k) {
  const c = CLASSES[m.cls];
  return Math.floor(c.base[k] + c.grow[k] * (m.lvl - 1));
}
function equipBonus(m, k) {
  let b = 0;
  for (const slot of ['weapon', 'armor']) { const it = ITEMS[m.equip[slot]]; if (it && it[k]) b += it[k]; }
  return b;
}
function stat(m, k) {
  let v = baseStat(m, k) + equipBonus(m, k);
  if (m.status && k === 'def' && m.status.defup) v = Math.floor(v * 1.5);
  return v;
}
function maxHP(m) { return baseStat(m, 'hp'); }
function maxMP(m) { return baseStat(m, 'mp'); }
function xpToNext(l) { return Math.floor(8 * Math.pow(l, 1.5)) + 4; }
function knownSkills(m) { return CLASSES[m.cls].skills.filter(([l]) => l <= m.lvl).map(([, s]) => s); }
function partyLevel() { return G.party.length ? Math.round(G.party.reduce((a, m) => a + m.lvl, 0) / G.party.length) : 1; }
function heroLevel() { return G.party[0] ? G.party[0].lvl : 1; }
function alive(m) { return m.hp > 0; }

// returns list of message strings describing level ups
function gainXP(m, amount) {
  const msgs = [];
  if (m.hp <= 0) return msgs;
  m.xp += amount;
  while (m.xp >= xpToNext(m.lvl) && m.lvl < 60) {
    m.xp -= xpToNext(m.lvl);
    const oldHP = maxHP(m), oldMP = maxMP(m), before = knownSkills(m);
    m.lvl++;
    m.hp += maxHP(m) - oldHP; m.mp += maxMP(m) - oldMP;
    msgs.push(`${m.name} reached level ${m.lvl}!`);
    for (const s of knownSkills(m)) if (!before.includes(s)) msgs.push(`${m.name} learned ${SKILLS[s].name}!`);
  }
  return msgs;
}

function healParty() { for (const m of G.party) { m.hp = maxHP(m); m.mp = maxMP(m); } }

function addItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) + n; }
function removeItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) - n; if (G.inv[id] <= 0) delete G.inv[id]; }
function itemCount(id) { return G.inv[id] || 0; }

function recruit(cls, name) {
  const lvl = Math.max(heroLevel(), cls === 'lyra' ? 3 : 7);
  const m = makeMember(cls, name, lvl);
  G.party.push(m);
  return m;
}

function priceMult() { return G.ending === 'throne' ? 1.5 : G.ending === 'hero' ? 0.85 : 1; }
function areaName(id) { return MAPS[id] ? MAPS[id].name : id; }
function fmtTime(s) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return `${h}:${String(m).padStart(2, '0')}`; }
function flag(f) { return f.startsWith('!') ? !G.flags[f.slice(1)] : !!G.flags[f]; }
