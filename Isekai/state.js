// =====================================================================
//  state.js : game state, classes, levelling, inventory, loot, personality
// =====================================================================
let G = null;
const SAVE_VERSION = 2;

function newGameState() {
  return {
    ver: SAVE_VERSION,
    name: 'Haruto', gender: 'boy', hair: HAIR_COLOURS[0].c, skin: SKIN_TONES[1].c,
    heroClass: null, personality: null, quiz: [],
    party: [], inv: {}, gold: 0, flags: {},
    map: 'tokyo', x: 6, y: 5, dir: 'down',
    quests: [], board: [], questCounter: 0, questsDone: 0,
    playTime: 0, ending: null, postgame: false, kills: 0
  };
}

// ---------------------------------------------------------------- members
function classOf(m) { return m.cls === 'hero' ? CLASSES['hero_' + (G.heroClass || 'blade')] : CLASSES[m.cls]; }
function makeMember(cls, name, lvl = 1) {
  const m = { cls, name, lvl, xp: 0, hp: 1, mp: 1, equip: {} };
  if (cls === 'hero') {
    const hc = G.heroClass;
    m.equip = { weapon: hc === 'mage' ? 'wand' : G.map === 'tokyo' ? 'shinai' : 'wsword', armor: 'uniform' };
  }
  if (cls === 'lyra') m.equip = { weapon: 'ostaff', armor: 'tunic' };
  if (cls === 'garrick') m.equip = { weapon: 'axe1', armor: 'tunic' };
  m.hp = maxHP(m); m.mp = maxMP(m);
  return m;
}
function baseStat(m, k) { const c = classOf(m); return Math.floor(c.base[k] + c.grow[k] * (m.lvl - 1)); }
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
function knownSkills(m) { return classOf(m).skills.filter(([l]) => l <= m.lvl).map(([, s]) => s); }
function partyLevel() { return G.party.length ? Math.round(G.party.reduce((a, m) => a + m.lvl, 0) / G.party.length) : 1; }
function heroLevel() { return G.party[0] ? G.party[0].lvl : 1; }
function alive(m) { return m.hp > 0; }
function weaponLabel(m) { return m.cls === 'hero' ? (G.heroClass === 'mage' ? 'Staff' : G.heroClass === 'none' ? 'Weapon' : 'Sword') : classOf(m).weapon; }

// what each member can wear. Master of None can use both swords and staves.
function canEquip(m, it) {
  if (!it || (it.type !== 'weapon' && it.type !== 'armor')) return false;
  const hc = G.heroClass;
  if (it.type === 'weapon') {
    if (m.cls === 'lyra') return it.kind === 'staff';
    if (m.cls === 'garrick') return it.kind === 'axe';
    if (hc === 'blade') return it.kind === 'sword';
    if (hc === 'mage') return it.kind === 'staff';
    return it.kind === 'sword' || it.kind === 'staff';
  }
  if (m.cls === 'lyra') return it.kind !== 'heavy';
  if (m.cls === 'garrick') return it.kind !== 'robe';
  if (hc === 'blade') return it.kind !== 'robe';
  if (hc === 'mage') return it.kind !== 'heavy';
  return true;
}
function whoCanEquip(it) {
  const names = [];
  const fake = cls => ({ cls });
  if (canEquip(fake('hero'), it)) names.push(G.name);
  if (canEquip(fake('lyra'), it)) names.push('Lyra');
  if (canEquip(fake('garrick'), it)) names.push('Garrick');
  return names;
}

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
  G.flags['in_' + cls] = true;
  return m;
}
function dismiss(m) {
  G.party.splice(G.party.indexOf(m), 1);
  G.flags['in_' + m.cls] = false;
  G.flags['bench_' + m.cls] = m; // remembered, waits at their tavern
}
function rejoin(cls) {
  const m = G.flags['bench_' + cls];
  if (!m) return recruit(cls, cls === 'lyra' ? 'Lyra' : 'Garrick');
  G.party.push(m); delete G.flags['bench_' + cls]; G.flags['in_' + cls] = true;
  m.lvl = Math.max(m.lvl, heroLevel() - 2); m.hp = maxHP(m); m.mp = maxMP(m);
  return m;
}
function inParty(cls) { return G.party.some(m => m.cls === cls); }

// ---------------------------------------------------------------- personality
const INTRO = () => G.personality === 'intro';
// the time you have to act in battle: solo 15s, two 10s, a full party 5s
function turnTime() { return [15, 15, 10, 5][Math.min(3, G.party.length)]; }

function areaTier(mapId) { return { tokyo: 1, forest: 1, mine: 2, wastes: 3, castle: 4 }[mapId] || 1; }
// battle drops
function rollDrops(mapId, enemies) {
  const out = {};
  const tier = areaTier(mapId);
  for (const e of enemies) {
    const chance = (INTRO() ? 0.28 : 0.62) * (e.boss ? 3 : e.elite ? 2 : 1);
    if (Math.random() > chance) continue;
    const t = clamp(tier + (INTRO() ? 1 : -1) + (e.elite || e.boss ? 1 : 0), 1, 4);
    const id = pick(DROP_TABLE[t]);
    const n = INTRO() ? 1 : irand(1, 2);
    out[id] = (out[id] || 0) + n;
  }
  return out;
}
// chest contents shift with personality
function chestLoot(c) {
  if (c.gold) return { gold: Math.round(c.gold * (INTRO() ? 1 : 1.5)) };
  const it = ITEMS[c.item];
  if (it.type !== 'use') return { item: c.item, qty: c.qty };
  if (INTRO()) return { item: LOOT_UP[c.item] || c.item, qty: Math.max(1, Math.ceil(c.qty / 2)) };
  return { item: LOOT_DOWN[c.item] || c.item, qty: c.qty * 2 };
}

function priceMult() { return G.ending === 'purge' ? 0.9 : 1; }
function areaName(id) { return MAPS[id] ? MAPS[id].name : id; }
function fmtTime(s) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return `${h}:${String(m).padStart(2, '0')}`; }
function flag(f) { return f.split('&').every(p => p.startsWith('!') ? !G.flags[p.slice(1)] : !!G.flags[p]); }
