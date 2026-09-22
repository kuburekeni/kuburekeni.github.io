// =====================================================================
//  state.js : game state, classes, levelling, inventory, loot,
//             companions + morale, personality, reputation
// =====================================================================
let G = null;
const SAVE_VERSION = 3;
const PARTY_MAX = 4;          // you + up to three companions

// build a fresh game and install it as the current one
function startNewGame(name, gender) {
  G = newGameState();
  G.name = name; G.gender = gender;
  G.party = [makeMember('hero', name)];
  G.party[0].hp = maxHP(G.party[0]); G.party[0].mp = maxMP(G.party[0]);
  for (const id of COMPANION_IDS) G.roster[id] = { status: 'unmet', morale: 60, member: null };
  addItem('potion', 2);
  return G;
}
function newGameState() {
  return {
    ver: SAVE_VERSION,
    name: 'Haruto', gender: 'boy', hair: HAIR_COLOURS[0].c, hairStyle: 'short', skin: SKIN_TONES[1].c,
    age: 'teen',              // teen (Tokyo) · baby · child · youth (the journey)
    heroClass: null, personality: null, train: { blade: 0, magic: 0 },
    party: [], roster: {}, inv: {}, gold: 0, flags: {}, side: {},
    map: 'tokyo', x: 6, y: 5, dir: 'down',
    quests: [], board: [], questCounter: 0, questsDone: 0,
    playTime: 0, ending: null, postgame: false, kills: 0, rep: 0
  };
}

// ---------------------------------------------------------------- members
function classOf(m) {
  if (m.cls === 'hero') return CLASSES[G.heroClass ? 'hero_' + G.heroClass : (G.age === 'child' ? 'hero_child' : 'hero_none')];
  return CLASSES[m.cls];
}
const START_GEAR = {
  wren: { weapon: 'isword', armor: 'squire' }, lyra: { weapon: 'ostaff', armor: 'elfrobe' },
  garrick: { weapon: 'axe1', armor: 'chain' }, sable: { weapon: 'dagger1', armor: 'rogue' },
  oswin: { weapon: 'mace1', armor: 'vestment' }, kestrel: { weapon: 'bow1', armor: 'ranger' },
  varek: { weapon: 'gsword1', armor: 'ashmail' }
};
function makeMember(cls, name, lvl = 1) {
  const m = { cls, name, lvl, xp: 0, hp: 1, mp: 1, equip: {} };
  if (cls === 'hero') m.equip = { weapon: 'shinai', armor: 'uniform' };
  else m.equip = { ...(START_GEAR[cls] || { weapon: 'isword', armor: 'tunic' }) };
  m.hp = maxHP(m); m.mp = maxMP(m);
  return m;
}
function baseStat(m, k) {
  const c = classOf(m);
  let v = Math.floor(c.base[k] + c.grow[k] * (m.lvl - 1));
  return v;
}
function equipBonus(m, k) {
  let b = 0;
  for (const slot of ['weapon', 'armor']) { const it = ITEMS[m.equip[slot]]; if (it && it[k]) b += it[k]; }
  return b;
}
function stat(m, k) {
  let v = baseStat(m, k) + equipBonus(m, k);
  const st = m.status || {};
  if (k === 'def' && st.shield) v = Math.floor(v * 1.5);
  if (k === 'atk' && st.weak) v = Math.floor(v * 0.7);
  if (k === 'atk' && st.burn) v = Math.floor(v * 0.85);
  if (k === 'spd' && st.slow) v = Math.floor(v * 0.5);
  // morale: a companion who believes in you fights harder
  if (m.cls !== 'hero' && (k === 'atk' || k === 'mag')) v = Math.round(v * (0.9 + moraleOf(m.cls) / 500));
  return Math.max(0, v);
}
function maxHP(m) { return baseStat(m, 'hp'); }
function maxMP(m) { return baseStat(m, 'mp'); }
function xpToNext(l) { return Math.floor(8 * Math.pow(l, 1.5)) + 4; }
function knownSkills(m) { return classOf(m).skills.filter(([l]) => l <= m.lvl).map(([, s]) => s); }
function partyLevel() { return G.party.length ? Math.round(G.party.reduce((a, m) => a + m.lvl, 0) / G.party.length) : 1; }
function heroLevel() { return G.party[0] ? G.party[0].lvl : 1; }
function alive(m) { return m.hp > 0; }
function heroWeaponKind() { const it = ITEMS[G.party[0] && G.party[0].equip.weapon]; return it ? it.kind : 'sword'; }
function weaponLabel(m) {
  if (m.cls !== 'hero') return classOf(m).weapon;
  return G.heroClass === 'mage' ? 'Staff' : G.heroClass === 'none' ? 'Weapon' : 'Sword';
}
function memberKey(m) { return m.cls === 'hero' ? 'hero' : 'c:' + m.cls; }
function memberFor(cls) { if (!G || !G.party) return null; return G.party.find(m => m.cls === cls) || (G.roster[cls] && G.roster[cls].member); }

// what each member can wear. Master of None can use both swords and staves.
const WEAPON_KINDS = { wren: ['sword'], lyra: ['staff'], garrick: ['axe'], sable: ['dagger'], oswin: ['mace'], kestrel: ['bow'], varek: ['greatsword', 'sword'] };
const ARMOR_BAN = { lyra: ['heavy'], garrick: ['robe'], sable: ['heavy'], oswin: [], kestrel: ['heavy'], wren: ['robe'], varek: ['robe'] };
function canEquip(m, it) {
  if (!it || (it.type !== 'weapon' && it.type !== 'armor')) return false;
  const hc = G.heroClass;
  if (it.type === 'weapon') {
    if (m.cls !== 'hero') return (WEAPON_KINDS[m.cls] || []).includes(it.kind);
    if (hc === 'blade') return it.kind === 'sword';
    if (hc === 'mage') return it.kind === 'staff';
    return it.kind === 'sword' || it.kind === 'staff';
  }
  if (it.id === 'childclothes') return false;
  if (m.cls !== 'hero') return !(ARMOR_BAN[m.cls] || []).includes(it.kind);
  if (hc === 'blade') return it.kind !== 'robe';
  if (hc === 'mage') return it.kind !== 'heavy';
  return true;
}
function whoCanEquip(it) {
  const names = [];
  if (canEquip({ cls: 'hero' }, it)) names.push(G.name);
  for (const id of COMPANION_IDS) if (G.roster[id] && G.roster[id].status !== 'unmet' && canEquip({ cls: id }, it)) names.push(COMPANIONS[id].name);
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
function healParty() { for (const m of G.party) { m.hp = maxHP(m); m.mp = maxMP(m); m.status = {}; } }

function addItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) + n; }
function removeItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) - n; if (G.inv[id] <= 0) delete G.inv[id]; }
function itemCount(id) { return G.inv[id] || 0; }

// ---------------------------------------------------------------- companions & morale
// roster[id] = { status: 'unmet' | 'waiting' | 'party' | 'gone', morale, member }
function rosterOf(id) {
  if (!G.roster[id]) G.roster[id] = { status: 'unmet', morale: 60, member: null };
  return G.roster[id];
}
function moraleOf(id) { return G.roster[id] ? G.roster[id].morale : 60; }
function moraleWord(v) { return v >= 85 ? 'Devoted' : v >= 65 ? 'Trusting' : v >= 45 ? 'Steady' : v >= 30 ? 'Uneasy' : 'Resentful'; }
function moraleColour(v) { return v >= 65 ? UI.hp : v >= 45 ? UI.paper : v >= 30 ? UI.gold : UI.bad; }
function addMorale(id, d, quiet) {
  const r = G.roster[id]; if (!r || r.status === 'gone' || r.status === 'unmet') return;
  const before = r.morale;
  r.morale = clamp(Math.round(r.morale + d), 0, 100);
  if (!quiet && r.morale !== before) toast(`${COMPANIONS[id].name}  ${d > 0 ? '♥ +' + (r.morale - before) : '♡ −' + (before - r.morale)}`, d > 0 ? UI.sakura : UI.dim);
}
function moraleAll(d, quiet) { for (const m of G.party) if (m.cls !== 'hero') addMorale(m.cls, d, quiet); }
function partyHas(cls) { return G.party.some(m => m.cls === cls); }
function inParty(cls) { return partyHas(cls); }
function partyFull() { return G.party.length >= PARTY_MAX; }
function companionsInParty() { return G.party.filter(m => m.cls !== 'hero'); }

// first time: build them at roughly your level. Returns the member.
function recruit(id, startMorale) {
  const r = rosterOf(id);
  if (!r.member) {
    const minLvl = { wren: 3, lyra: 4, sable: 5, oswin: 5, kestrel: 6, garrick: 8, varek: 18 }[id] || 1;
    r.member = makeMember(id, COMPANIONS[id].name, Math.max(heroLevel(), minLvl));
    if (startMorale !== undefined) r.morale = startMorale;
  }
  const m = r.member;
  m.lvl = Math.max(m.lvl, heroLevel() - 2);
  m.hp = maxHP(m); m.mp = maxMP(m); m.status = {};
  r.status = 'party';
  G.party.push(m);
  G.flags['in_' + id] = true;
  return m;
}
// send someone home. Low morale means they will not come back.
function dismiss(m) {
  const r = rosterOf(m.cls);
  G.party.splice(G.party.indexOf(m), 1);
  G.flags['in_' + m.cls] = false;
  r.member = m;
  r.status = r.morale < 35 ? 'gone' : 'waiting';
  return r.status;
}
function waitingAt(id, mapId) { const r = G.roster[id]; return r && r.status === 'waiting' && COMPANIONS[id].home === mapId; }

// ---------------------------------------------------------------- personality
const INTRO = () => G.personality === 'intro';
// the time you have to act in battle shrinks as your party grows
function turnTime() { return [15, 15, 12, 9, 7][Math.min(4, G.party.length)]; }

function areaTier(mapId) { return { tokyo: 1, valenford: 1, forest: 1, brookvale: 1, fernhollow: 2, solmere: 2, mine: 2, wastes: 3, castle: 4 }[mapId] || 1; }
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
function chestLoot(c) {
  if (c.gold) return { gold: Math.round(c.gold * (INTRO() ? 1 : 1.5)) };
  const it = ITEMS[c.item];
  if (it.type !== 'use') return { item: c.item, qty: c.qty };
  if (INTRO()) return { item: LOOT_UP[c.item] || c.item, qty: Math.max(1, Math.ceil(c.qty / 2)) };
  return { item: LOOT_DOWN[c.item] || c.item, qty: c.qty * 2 };
}

// shop prices: the ending, the rumours from your childhood, and who you walk with
function priceMult() {
  let m = G.ending === 'purge' ? 0.9 : 1;
  if (G.map === 'valenford' || G.map === 'valen_shop') m *= G.rep < 0 ? 1.15 : 0.9;
  if (partyHas('varek') && G.ending !== 'deal') m *= 1.2;
  return m;
}
function areaName(id) { return MAPS[id] ? MAPS[id].name : (typeof NODES !== 'undefined' && NODES[id] ? NODES[id].name : id); }
function fmtTime(s) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return `${h}:${String(m).padStart(2, '0')}`; }
function flag(f) { return f.split('&').every(p => p.startsWith('!') ? !G.flags[p.slice(1)] : !!G.flags[p]); }
function heroTitle() { return G.gender === 'girl' ? 'Princess' : 'Prince'; }
function heroHonor() { return G.gender === 'girl' ? 'my lady' : 'my lord'; }
