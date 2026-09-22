// =====================================================================
//  I GOT ISEKAI'D — THE VIDEO GAME
//  data.js : palettes, characters, classes, skills, enemies, items, shops, music
// =====================================================================

// ---------------------------------------------------------------- colours
const UI = {
  ink: '#120e1f',       // outlines / deep shadow
  win: '#1c2244',       // window fill (ai-iro indigo)
  win2: '#10152e',
  paper: '#f3e6c4',     // text / window border (washi cream)
  dim: '#9a93a8',
  sakura: '#f28fad',    // cursor / highlight
  gold: '#f2c94c',
  hp: '#7ed36f', mp: '#6fb7f2', bad: '#e5534b'
};

// ---------------------------------------------------------------- characters
// pal keys: h hair  s skin  e eyes  c coat  d coat-shade  p legs  b boots  n horns/accent
// mods: girl (long hair) ears beard horns hood skirt child cape
const SKIN_TONES = [
  { name: 'Porcelain', c: '#f7dcc4' }, { name: 'Fair', c: '#f1c7a3' }, { name: 'Warm', c: '#dca77c' },
  { name: 'Tan', c: '#bd8256' }, { name: 'Brown', c: '#8f5a37' }, { name: 'Deep', c: '#5f3a23' }
];
const HAIR_COLOURS = [
  { name: 'Midnight', c: '#1e1a26' }, { name: 'Chestnut', c: '#6e3c1e' }, { name: 'Ash Blonde', c: '#d8c690' },
  { name: 'Silver', c: '#d0d4de' }, { name: 'Sakura', c: '#e98aa8' }, { name: 'Deep Blue', c: '#34508e' },
  { name: 'Crimson', c: '#a8322e' }
];
const SK = '#f1c7a3', SK2 = '#dca77c', SK3 = '#bd8256', SK4 = '#8f5a37', ASH = '#8e7f9a', ASH2 = '#6d5f7d';
const CHARS = {
  // --- Tokyo
  aoi:      { pal: { h:'#2a1c20', s:SK,  c:'#2b3a67', d:'#1b2440', p:SK,  b:'#2a2020', n:'#b83a4a' }, mods:['girl','skirt','tie'] },
  daichi:   { pal: { h:'#141018', s:SK2, c:'#e8e6ee', d:'#3a3e6a', p:'#26284a', b:'#26284a' }, mods:['hakama'] },
  clerk:    { pal: { h:'#5a3a22', s:SK,  c:'#3a8ad0', d:'#2a5a9a', p:'#2a2a3a', b:'#222' }, mods:[] },
  salary:   { pal: { h:'#1e1a1e', s:SK2, c:'#3a3e4a', d:'#262a34', p:'#262a34', b:'#111' }, mods:['tie'] },
  student:  { pal: { h:'#3a2a1a', s:SK,  c:'#2b3a67', d:'#1b2440', p:'#1b2440', b:'#111' }, mods:[] },
  priest:   { pal: { h:'#c8c8c8', s:SK2, c:'#f0ece0', d:'#b0a890', p:'#a83a30', b:'#3a2a1a' }, mods:['hakama'] },
  girlchild:{ pal: { h:'#2a1a14', s:SK,  c:'#f2c94c', d:'#c89a2a', p:SK,  b:'#d24a5a' }, mods:['girl','skirt','child'] },
  // --- Eldoria
  goddess:  { pal: { h:'#f4e6b0', s:'#fbe9da', c:'#ffffff', d:'#d6d0ee', p:'#ffffff', b:'#e8d8a0', n:'#f2c94c' }, mods:['girl','cape'] },
  elder:    { pal: { h:'#e8e4dc', s:SK2, c:'#6a4a2e', d:'#4a3220', p:'#4a3220', b:'#2a1a10' }, mods:['beard'] },
  villager: { pal: { h:'#5e3a20', s:SK3, c:'#4f7a4b', d:'#35552f', p:'#5a4a3a', b:'#3a2a1a' } },
  woman:    { pal: { h:'#a8502a', s:SK,  c:'#8e3e5a', d:'#62283e', p:'#62283e', b:'#3a2a1a' }, mods:['girl','skirt'] },
  kid:      { pal: { h:'#d8b850', s:SK,  c:'#4a6ea8', d:'#2f4d80', p:'#3a3a55', b:'#3a2a1a' }, mods:['child'] },
  shop:     { pal: { h:'#3a2a1a', s:SK3, c:'#b89a50', d:'#8a7030', p:'#5a4a3a', b:'#3a2a1a' } },
  inn:      { pal: { h:'#6a4a7a', s:SK,  c:'#e2dace', d:'#aea290', p:'#6a4a3a', b:'#3a2a1a' }, mods:['girl','skirt'] },
  guard:    { pal: { h:'#555a66', s:SK2, c:'#8a93a6', d:'#5b6377', p:'#454b5a', b:'#2a2a33' }, mods:['helm'] },
  lyra:     { pal: { h:'#f0dc8a', s:SK,  c:'#2f7a58', d:'#1f5a3e', p:'#1f5a3e', b:'#4a3020', n:'#c8a86a' }, mods:['girl','ears','cape'] },
  garrick:  { pal: { h:'#8a4424', s:SK3, c:'#8a93a0', d:'#5a6270', p:'#4a3e30', b:'#2a1e14' }, mods:['beard','stout'] },
  dwarf:    { pal: { h:'#c8c8c8', s:SK3, c:'#7a4e30', d:'#54321c', p:'#4a3e30', b:'#2a1e14' }, mods:['beard','stout'] },
  smith:    { pal: { h:'#1e1e1e', s:SK4, c:'#4a4a4a', d:'#2e2e2e', p:'#2e2e2e', b:'#1a1a1a' }, mods:['beard','stout','apron'] },
  merchant: { pal: { h:'#3a2a1a', s:SK3, c:'#5a3e7a', d:'#3a2458', p:'#3a2458', b:'#1a1010' }, mods:['hood','beard','stout'] },
  healer:   { pal: { h:'#f0f0f0', s:SK,  c:'#dcdcee', d:'#9c9cbc', p:'#9c9cbc', b:'#5a5a7a' }, mods:['girl','hood'] },
  goblin:   { pal: { h:'#2a2014', s:'#6ea040', e:'#e5534b', c:'#6a4e30', d:'#4a3020', p:'#4a3020', b:'#1a1008' }, mods:['ears','child'] },
  chief:    { pal: { h:'#8a1e1e', s:'#4f8a30', e:'#ffe050', c:'#5a3016', d:'#3a1a08', p:'#3a1a08', b:'#140a04', n:'#e8e0c8' }, mods:['ears','stout','horns'] },
  skeleton: { pal: { h:'#e8e6dc', s:'#e8e6dc', e:'#1a1226', c:'#c8c6bc', d:'#9a988e', p:'#c8c6bc', b:'#9a988e' }, mods:['bones'] },
  orc:      { pal: { h:'#1e1e1e', s:'#5e7a40', e:'#e5534b', c:'#6a2424', d:'#421616', p:'#3a3a2a', b:'#161616' }, mods:['stout','tusks'] },
  bandit:   { pal: { h:'#3a2616', s:SK3, c:'#5a4a3a', d:'#3a2e22', p:'#2e2a26', b:'#1a1614' }, mods:['hood'] },
  dknight:  { pal: { h:'#241e30', s:'#241e30', e:'#ff3b3b', c:'#332a48', d:'#1f1830', p:'#1f1830', b:'#120e1c', n:'#b8b0c8' }, mods:['horns','helm','cape'] },
  king:     { pal: { h:'#16101e', s:'#9a8aae', e:'#ff3030', c:'#2a1030', d:'#5a1020', p:'#1a0a20', b:'#0a0510', n:'#e8e0cc' }, mods:['horns','cape'] },
  varek:    { pal: { h:'#2a2030', s:ASH, e:'#f2c94c', c:'#4a3a3a', d:'#2e2424', p:'#2e2424', b:'#161010', n:'#d8d0c0' }, mods:['horns','hood'] },
  demonm:   { pal: { h:'#3a2a40', s:ASH, e:'#f2c94c', c:'#6a4a3a', d:'#4a3226', p:'#3a2a22', b:'#1a1210', n:'#d8d0c0' }, mods:['horns'] },
  demonf:   { pal: { h:'#5a2a4a', s:ASH, e:'#f2c94c', c:'#7a3a4a', d:'#52263a', p:'#52263a', b:'#1a1210', n:'#d8d0c0' }, mods:['horns','girl','skirt'] },
  nyx:      { pal: { h:'#3a2a5a', s:'#a898b8', e:'#f2c94c', c:'#b85a4a', d:'#8a3a30', p:'#a898b8', b:'#3a2a22', n:'#e8e0d0' }, mods:['horns','girl','skirt','child'] }
};

// ---------------------------------------------------------------- classes
// the hero's class is chosen in the Void: blade (melee), mage (magic), none (master of none)
const HERO_CLASSES = {
  blade: { name: 'Blade', desc: 'Steel and nerve. The highest strength and toughness, but little magic.' },
  mage:  { name: 'Spellcaster', desc: 'The words the goddess taught you. Devastating elemental magic, but a fragile body.' },
  none:  { name: 'Master of None', desc: 'A little of everything. Weaker than a specialist at any one thing, but you can answer anything.' }
};
const CLASSES = {
  hero_blade: {
    base: { hp:50, mp:8,  atk:10, def:5, mag:3,  spd:6 }, grow: { hp:10, mp:1.4, atk:2.5, def:1.8, mag:0.7, spd:0.8 },
    skills: [[1,'power'],[4,'rally'],[6,'cross'],[9,'guardbreak'],[11,'crossingB'],[15,'bladestorm']], weapon:'Sword'
  },
  hero_mage: {
    base: { hp:36, mp:20, atk:4,  def:3, mag:11, spd:6 }, grow: { hp:6.8, mp:3.4, atk:0.9, def:1.1, mag:2.7, spd:0.8 },
    skills: [[1,'fire'],[1,'ice'],[3,'heal'],[5,'thunder'],[8,'barrier'],[11,'crossingM'],[14,'meteor']], weapon:'Staff'
  },
  hero_none: {
    base: { hp:42, mp:13, atk:7,  def:4, mag:7,  spd:7 }, grow: { hp:8.2, mp:2.3, atk:1.8, def:1.4, mag:1.8, spd:0.9 },
    skills: [[1,'power'],[1,'fire'],[3,'aid'],[4,'ice'],[6,'spellblade'],[8,'thunder'],[10,'rally'],[11,'crossingH']], weapon:'Sword/Staff'
  },
  lyra: {
    base: { hp:32, mp:22, atk:5, def:3, mag:11, spd:7 }, grow: { hp:6.5, mp:3.5, atk:1, def:1.1, mag:2.6, spd:0.9 },
    skills: [[1,'fire'],[1,'ice'],[1,'heal'],[5,'thunder'],[9,'healall'],[14,'meteor']], weapon:'Staff'
  },
  garrick: {
    base: { hp:72, mp:8, atk:13, def:10, mag:2, spd:4 }, grow: { hp:12, mp:1.2, atk:2.4, def:2.2, mag:0.5, spd:0.6 },
    skills: [[1,'bash'],[1,'taunt'],[10,'cleave'],[14,'ironwill']], weapon:'Axe'
  }
};

const SKILLS = {
  power:     { name:'Power Strike',  mp:3,  target:'enemy',   kind:'phys', mult:1.8, desc:'A heavy, committed swing.' },
  rally:     { name:'Second Wind',   mp:5,  target:'self',    kind:'heal', power:18, scale:1.2, useAtk:true, desc:'Steady your breathing and recover HP.' },
  cross:     { name:'Cross Slash',   mp:8,  target:'enemies', kind:'phys', mult:1.2, desc:'Two sweeping cuts that reach every enemy.' },
  guardbreak:{ name:'Sunder',        mp:6,  target:'enemy',   kind:'phys', mult:1.4, pierce:true, desc:'A strike aimed at the gaps in armour. Ignores most defence.' },
  bladestorm:{ name:'Bladestorm',    mp:16, target:'enemies', kind:'phys', mult:2.0, desc:'A relentless flurry across the whole battlefield.' },
  crossingB: { name:'Last Crossing', mp:18, target:'enemies', kind:'phys', mult:2.6, pierce:true, fx:'crossing', desc:'The memory of the moment you died, given edge. Hits every enemy.' },
  crossingM: { name:'Last Crossing', mp:22, target:'enemies', kind:'mag',  power:34, mult:2.2, fx:'crossing', desc:'The light you saw before the dark, unleashed. Hits every enemy.' },
  crossingH: { name:'Last Crossing', mp:20, target:'enemies', kind:'hybrid', mult:2.3, fx:'crossing', desc:'Blade and light together, from the moment between worlds.' },
  spellblade:{ name:'Spellblade',    mp:6,  target:'enemy',   kind:'hybrid', mult:1.6, elem:'fire', desc:'Fire poured down the length of your weapon.' },
  barrier:   { name:'Barrier',       mp:8,  target:'allies',  kind:'buff', status:'defup', turns:3, desc:'A ward of light that raises the party\'s defence.' },
  aid:       { name:'First Aid',     mp:4,  target:'ally',    kind:'heal', power:22, scale:2, desc:'Bind wounds and restore HP to one ally.' },
  fire:      { name:'Fire',          mp:4,  target:'enemy',   kind:'mag',  power:10, mult:1.6, elem:'fire', desc:'Fire damage to one enemy.' },
  ice:       { name:'Ice',           mp:4,  target:'enemy',   kind:'mag',  power:10, mult:1.6, elem:'ice', desc:'Ice damage to one enemy.' },
  heal:      { name:'Heal',          mp:5,  target:'ally',    kind:'heal', power:30, scale:2.2, desc:'Restore HP to one ally.' },
  thunder:   { name:'Thunder',       mp:7,  target:'enemies', kind:'mag',  power:8,  mult:1.2, elem:'thunder', desc:'Lightning strikes every enemy.' },
  healall:   { name:'Heal All',      mp:12, target:'allies',  kind:'heal', power:24, scale:1.6, desc:'Restore HP to the whole party.' },
  meteor:    { name:'Meteor',        mp:22, target:'enemies', kind:'mag',  power:30, mult:2.2, elem:'fire', desc:'Call down burning stone on every enemy.' },
  bash:      { name:'Shield Bash',   mp:3,  target:'enemy',   kind:'phys', mult:1.4, stun:0.4, desc:'Hit with the shield. May stun.' },
  taunt:     { name:'Taunt',         mp:3,  target:'self',    kind:'buff', status:'taunt', turns:3, desc:'Draw enemy attacks for 3 turns.' },
  cleave:    { name:'Cleave',        mp:6,  target:'enemies', kind:'phys', mult:1.1, desc:'A wide axe swing across every enemy.' },
  ironwill:  { name:'Iron Will',     mp:8,  target:'allies',  kind:'buff', status:'defup', turns:3, desc:'Raise the party\'s defence for 3 turns.' },
  // enemy skills
  bite:      { name:'Bite',        target:'enemy',   kind:'phys', mult:1.4 },
  smash:     { name:'Smash',       target:'enemy',   kind:'phys', mult:1.6 },
  quake:     { name:'Quake',       target:'enemies', kind:'phys', mult:0.9 },
  drain:     { name:'Life Drain',  target:'enemy',   kind:'mag',  power:10, mult:1.0, drain:true },
  icebolt:   { name:'Ice Bolt',    target:'enemy',   kind:'mag',  power:8,  mult:1.3, elem:'ice' },
  firebolt:  { name:'Fire Bolt',   target:'enemy',   kind:'mag',  power:10, mult:1.3, elem:'fire' },
  firebreath:{ name:'Fire Breath', target:'enemies', kind:'mag',  power:8,  mult:1.0, elem:'fire' },
  darkflame: { name:'Ashfire',     target:'enemies', kind:'mag',  power:20, mult:1.1, elem:'dark' },
  cleaveE:   { name:'Abyss Cleave',target:'enemies', kind:'phys', mult:1.0 },
  feint:     { name:'Feint',       target:'enemy',   kind:'phys', mult:1.1 }
};

// ---------------------------------------------------------------- enemies
// demon: true marks Ashborn soldiers (affected by the ending you choose)
const ENEMIES = {
  kendo:   { name:'Daichi',      spr:'daichi',  hp:40,  atk:6,  def:2,  mag:0,  spd:5,  xp:0,   gold:0, skills:['feint'], human:true },
  slime:   { name:'Slime',       spr:'slime',   hp:16,  atk:7,  def:2,  mag:0,  spd:3,  xp:5,   gold:4,  weak:'fire' },
  bat:     { name:'Bat',         spr:'bat',     hp:12,  atk:7,  def:1,  mag:0,  spd:10, xp:5,   gold:3,  weak:'thunder' },
  wolf:    { name:'Wolf',        spr:'wolf',    hp:24,  atk:10, def:3,  mag:0,  spd:8,  xp:8,   gold:6,  weak:'fire', skills:['bite'] },
  goblin:  { name:'Goblin',      spr:'goblin',  hp:28,  atk:11, def:4,  mag:0,  spd:5,  xp:9,   gold:10 },
  chief:   { name:'Goblin Chief',spr:'chief',   hp:150, atk:15, def:6,  mag:0,  spd:5,  xp:60,  gold:100, boss:true, skills:['smash'] },
  duel:    { name:'Garrick',     spr:'garrick', hp:260, atk:17, def:12, mag:0,  spd:4,  xp:40,  gold:0,  skills:['smash'], human:true },
  bandit:  { name:'Border Raider',spr:'bandit', hp:70,  atk:24, def:10, mag:0,  spd:9,  xp:48,  gold:30, skills:['feint'], human:true },
  skeleton:{ name:'Skeleton',    spr:'skeleton',hp:46,  atk:18, def:9,  mag:0,  spd:6,  xp:24,  gold:14, weak:'fire', resist:'ice' },
  cavebat: { name:'Cave Bat',    spr:'cavebat', hp:30,  atk:15, def:5,  mag:10, spd:13, xp:20,  gold:9,  weak:'thunder', skills:['drain'] },
  bslime:  { name:'Frost Slime', spr:'bslime',  hp:42,  atk:14, def:8,  mag:15, spd:4,  xp:22,  gold:12, weak:'fire', resist:'ice', skills:['icebolt'] },
  golem:   { name:'The Warden',  spr:'golem',   hp:440, atk:26, def:18, mag:0,  spd:3,  xp:300, gold:300, boss:true, weak:'thunder', resist:'fire', skills:['smash','quake'] },
  orc:     { name:'Ashborn Brute',spr:'orc',    hp:95,  atk:30, def:15, mag:0,  spd:6,  xp:70,  gold:35, skills:['smash'], demon:true },
  rslime:  { name:'Magma Slime', spr:'rslime',  hp:68,  atk:22, def:12, mag:28, spd:5,  xp:62,  gold:28, weak:'ice', resist:'fire', skills:['firebreath'] },
  swolf:   { name:'Shadow Wolf', spr:'swolf',   hp:78,  atk:32, def:12, mag:0,  spd:15, xp:72,  gold:30, weak:'fire', skills:['bite'] },
  dknight: { name:'Ashborn Knight',spr:'dknight',hp:130,atk:38, def:22, mag:22, spd:9,  xp:115, gold:55, weak:'thunder', skills:['smash','darkflame'], demon:true },
  imp:     { name:'Ashborn Imp', spr:'imp',     hp:62,  atk:20, def:10, mag:34, spd:14, xp:95,  gold:40, weak:'ice', skills:['firebolt'], demon:true },
  king:    { name:'Malgrath',    spr:'king',    hp:1700, atk:58, def:30, mag:52, spd:12, xp:0, gold:0, boss:true, king:true, skills:['darkflame','drain','smash','cleaveE'], demon:true }
};

// ---------------------------------------------------------------- items
// kind: sword / staff / axe (weapons), light / heavy / robe (armour). See canEquip() in state.js
const ITEMS = {
  onigiri: { name:'Onigiri',      type:'use', price:150, heal:40,  target:'ally', desc:'A rice ball from the konbini. Restores 40 HP. It still tastes like home.' },
  potion:  { name:'Potion',       type:'use', price:25,  heal:60,  target:'ally', desc:'Restores 60 HP.' },
  hipotion:{ name:'Hi-Potion',    type:'use', price:90,  heal:200, target:'ally', desc:'Restores 200 HP.' },
  mega:    { name:'Mega Potion',  type:'use', price:320, heal:180, target:'allies', desc:'Restores 180 HP to the whole party.' },
  elixir:  { name:'Elixir',       type:'use', price:900, heal:9999, mpheal:9999, target:'ally', desc:'Fully restores one ally\'s HP and MP.' },
  ether:   { name:'Ether',        type:'use', price:80,  mpheal:30, target:'ally', desc:'Restores 30 MP.' },
  hiether: { name:'Hi-Ether',     type:'use', price:260, mpheal:90, target:'ally', desc:'Restores 90 MP.' },
  phoenix: { name:'Phoenix Down', type:'use', price:150, revive:0.5, target:'dead', desc:'Revives a fallen ally with half HP.' },
  bomb:    { name:'Fire Bomb',    type:'use', price:60,  dmg:60, elem:'fire', target:'enemies', battleOnly:true, desc:'Deals 60 fire damage to all enemies.' },
  cake:    { name:'Birthday Cake',type:'key', price:1200, desc:'Strawberry shortcake with "Happy 13th, Mei" piped in pink. For your sister.' },
  grimoire:{ name:'Lyra\'s Grimoire', type:'key', price:0, desc:'A leather-bound spellbook. The goblins tore the clasp off. It belongs to the elf.' },
  // weapons
  shinai:  { name:'Shinai',         type:'weapon', kind:'sword', atk:1, price:0, desc:'A bamboo practice sword. It came through with you.' },
  wsword:  { name:'Wooden Sword',   type:'weapon', kind:'sword', atk:2, price:10, desc:'A training sword. The elder\'s grandson carved his name in the hilt.' },
  isword:  { name:'Iron Sword',     type:'weapon', kind:'sword', atk:7, price:130, desc:'A dependable iron blade.' },
  ssword:  { name:'Steel Blade',    type:'weapon', kind:'sword', atk:14, price:480, desc:'Dwarf-forged steel.' },
  msword:  { name:'Mythril Edge',   type:'weapon', kind:'sword', atk:23, price:1500, desc:'Light, keen, and old.' },
  otherblade:{ name:'Blade of the Other Shore', type:'weapon', kind:'sword', atk:36, mag:8, price:4000, desc:'Forged around a fragment of your old world. It hums with a sound like distant traffic.' },
  wand:    { name:'Birch Wand',     type:'weapon', kind:'staff', atk:1, mag:3, price:10, desc:'A simple focus for a new caster.' },
  ostaff:  { name:'Oak Staff',      type:'weapon', kind:'staff', atk:1, mag:3, price:10, desc:'A plain travelling staff.' },
  rstaff:  { name:'Ruby Staff',     type:'weapon', kind:'staff', atk:3, mag:9, price:420, desc:'A ruby hums inside the wood.' },
  astaff:  { name:'Archmage Staff', type:'weapon', kind:'staff', atk:5, mag:16, price:1450, desc:'Staff of the old elven archmages.' },
  otherstaff:{ name:'Staff of the Other Shore', type:'weapon', kind:'staff', atk:8, mag:30, price:4000, desc:'A staff crowned with glass from a world that isn\'t this one.' },
  axe1:    { name:'Hand Axe',       type:'weapon', kind:'axe', atk:5, price:10, desc:'Garrick\'s old axe. Nicked and well loved.' },
  axe2:    { name:'War Axe',        type:'weapon', kind:'axe', atk:14, price:520, desc:'A proper dwarven war axe.' },
  axe3:    { name:'Rune Hammer',    type:'weapon', kind:'axe', atk:25, price:1550, desc:'Runes flare when it strikes.' },
  // armour
  uniform: { name:'School Uniform', type:'armor', kind:'light', def:2, price:10, desc:'Your uniform from Seiryo High. Still creased from this morning.' },
  tunic:   { name:'Travel Cloak',   type:'armor', kind:'light', def:1, price:10, desc:'Basic travelling gear.' },
  leather: { name:'Leather Armor',  type:'armor', kind:'light', def:5, price:90, desc:'Light leather armour.' },
  robe:    { name:'Mage Robe',      type:'armor', kind:'robe', def:6, mag:4, price:320, desc:'Woven with focusing thread.' },
  chain:   { name:'Chain Mail',     type:'armor', kind:'heavy', def:11, price:420, desc:'Rings of dwarven steel.' },
  star:    { name:'Starlight Robe', type:'armor', kind:'robe', def:13, mag:9, price:1500, desc:'Glows faintly in the dark.' },
  dragon:  { name:'Dragon Mail',    type:'armor', kind:'heavy', def:20, price:1650, desc:'Scales of a long-dead dragon.' }
};

const SHOPS = {
  konbini: ['onigiri', 'cake'],
  village: ['potion','ether','bomb','isword','wand','leather'],
  ironhold:['potion','hipotion','ether','phoenix','bomb','ssword','rstaff','axe2','chain','robe'],
  camp:    ['hipotion','mega','hiether','phoenix','bomb','msword','astaff','axe3','dragon','star'],
  ember:   ['hipotion','hiether','elixir','phoenix','astaff','star']
};

// loot ladders: introverts find the next item up, extroverts find more of the one below
const LOOT_UP = { onigiri:'potion', potion:'hipotion', hipotion:'mega', mega:'elixir', ether:'hiether', hiether:'elixir', bomb:'bomb', phoenix:'phoenix' };
const LOOT_DOWN = { elixir:'mega', mega:'hipotion', hipotion:'potion', potion:'potion', hiether:'ether', ether:'ether', bomb:'bomb', phoenix:'potion' };
const DROP_TABLE = { // by area tier
  1: ['potion', 'potion', 'ether', 'bomb'],
  2: ['hipotion', 'ether', 'phoenix', 'bomb'],
  3: ['hipotion', 'mega', 'hiether', 'phoenix'],
  4: ['mega', 'hiether', 'elixir', 'phoenix']
};

// ---------------------------------------------------------------- music
// tokens are 8th notes. '-' holds previous note, '.' is a rest. 'x' on a noise channel = hat
const MUSIC = {
  title: { bpm: 96, ch: [
    { w:'square', v:0.07, n:'E5 - G5 - C6 - B5 A5 G5 - E5 - D5 - C5 - D5 - E5 - G5 - A5 G5 E5 - D5 - - -' },
    { w:'triangle', v:0.16, n:'C3 . C3 . A2 . A2 . F2 . F2 . G2 . G2 .' },
    { w:'square', v:0.025, n:'G4 C5 E5 C5 E4 A4 C5 A4 F4 A4 C5 A4 G4 B4 D5 B4' }
  ]},
  tokyo: { bpm: 140, ch: [
    { w:'square', v:0.06, n:'E5 E5 . E5 . C5 E5 . G5 - - - G4 - - - C5 - G4 - E4 - A4 B4 A#4 A4 - G4 E5 G5 A5 -' },
    { w:'triangle', v:0.16, n:'C3 . G2 . C3 . G2 . E2 . G2 . F2 . G2 .' },
    { w:'noise', v:0.03, n:'x . x x x . x x' }
  ]},
  void: { bpm: 70, ch: [
    { w:'sine', v:0.09, n:'E5 - - - B4 - - - C5 - - - G4 - - - A4 - - - E4 - - - F4 - - - B4 - - -' },
    { w:'triangle', v:0.12, n:'E3 - - - - - - - C3 - - - - - - - A2 - - - - - - - B2 - - - - - - -' }
  ]},
  village: { bpm: 108, ch: [
    { w:'square', v:0.06, n:'A4 C5 F5 - E5 D5 C5 - A4 C5 D5 - C5 A4 G4 - A4 C5 F5 - G5 A5 G5 F5 E5 D5 C5 - F5 - - .' },
    { w:'triangle', v:0.16, n:'F2 . C3 . F2 . C3 . A#2 . F3 . C3 . G2 . F2 . C3 . A#2 . C3 . F2 . C3 .' },
    { w:'noise', v:0.015, n:'x . . . x . . .' }
  ]},
  field: { bpm: 128, ch: [
    { w:'square', v:0.06, n:'D5 . A4 D5 E5 F5 E5 D5 C5 . A4 C5 D5 - - . D5 . A4 D5 E5 F5 G5 A5 G5 F5 E5 C5 D5 - - .' },
    { w:'triangle', v:0.16, n:'D3 D3 A2 A2 D3 D3 A2 A2 C3 C3 G2 G2 D3 D3 A2 A2' },
    { w:'noise', v:0.02, n:'x . x . x . x x' }
  ]},
  town: { bpm: 100, ch: [
    { w:'square', v:0.055, n:'G4 - B4 D5 G5 - F#5 E5 D5 - B4 - C5 - A4 - G4 - B4 D5 E5 - D5 C5 B4 - A4 - G4 - - .' },
    { w:'triangle', v:0.16, n:'G2 . D3 . G2 . D3 . C3 . G2 . D3 . D2 .' }
  ]},
  mine: { bpm: 96, ch: [
    { w:'square', v:0.05, n:'A4 . . C5 B4 . . E4 A4 . . C5 D5 . B4 . A4 . . C5 B4 . G4 . A4 - - - . . . .' },
    { w:'triangle', v:0.17, n:'A2 . E2 . A2 . E2 . F2 . C3 . E2 . B1 .' },
    { w:'noise', v:0.015, n:'x . . . . . x .' }
  ]},
  wastes: { bpm: 112, ch: [
    { w:'square', v:0.055, n:'D5 - C5 A4 - G4 A4 - D5 - F5 E5 - C5 D5 - D5 - C5 A4 - G4 F4 - E4 - G4 A4 - - - -' },
    { w:'triangle', v:0.17, n:'D2 . D3 . D2 . D3 . C2 . C3 . A1 . A2 .' },
    { w:'noise', v:0.02, n:'x . . x . . x .' }
  ]},
  castle: { bpm: 84, ch: [
    { w:'square', v:0.05, n:'E4 - G4 - F#4 - B3 - E4 - G4 - A4 - G4 F#4 E4 - - - D4 - F#4 - B4 - - - A4 G4' },
    { w:'triangle', v:0.18, n:'E2 - - - C2 - - - A1 - - - B1 - - -' },
    { w:'sawtooth', v:0.02, n:'B3 - - - - - - - C4 - - - - - - - A3 - - - - - - - D#4 - - - - - - -' }
  ]},
  battle: { bpm: 152, ch: [
    { w:'square', v:0.06, n:'A4 C5 E5 A5 G5 E5 C5 E5 F5 A5 C6 A5 G5 E5 D5 B4 A4 C5 E5 A5 B5 A5 G5 E5 F5 E5 D5 C5 B4 - G#4 -' },
    { w:'triangle', v:0.17, n:'A2 A3 A2 A3 A2 A3 A2 A3 F2 F3 F2 F3 G2 G3 G2 G3 A2 A3 A2 A3 A2 A3 A2 A3 F2 F3 G2 G3 E2 E3 E2 E3' },
    { w:'noise', v:0.03, n:'x . x x x . x x' }
  ]},
  boss: { bpm: 164, ch: [
    { w:'square', v:0.06, n:'E5 F5 E5 . B4 . E5 F5 G5 F5 E5 . D5 . C5 B4 E5 F5 E5 . B4 . G5 A5 B5 A5 G5 F5 E5 - - .' },
    { w:'triangle', v:0.18, n:'E2 E2 E3 E2 F2 F2 F3 F2 E2 E2 E3 E2 D2 D2 C2 B1' },
    { w:'sawtooth', v:0.025, n:'E4 - - - F4 - - - G4 - - - F4 - - -' },
    { w:'noise', v:0.035, n:'x x x . x x x x' }
  ]},
  victory: { bpm: 150, loop:false, ch: [
    { w:'square', v:0.07, n:'C5 C5 C5 C5 - G#4 - A#4 - C5 . A#4 C5 - - - - - . .' },
    { w:'triangle', v:0.16, n:'C3 C3 C3 C3 - G#2 - A#2 - C3 . A#2 C3 - - - - - . .' }
  ]},
  ending: { bpm: 78, ch: [
    { w:'square', v:0.05, n:'C5 - E5 - G5 - E5 - F5 - A5 - G5 - - - E5 - D5 - C5 - A4 - B4 - C5 - - - - -' },
    { w:'triangle', v:0.15, n:'C3 - - - A2 - - - F2 - - - G2 - - -' },
    { w:'sine', v:0.04, n:'E4 G4 C5 G4 C4 E4 A4 E4 A3 C4 F4 C4 B3 D4 G4 D4' }
  ]},
  dark: { bpm: 72, ch: [
    { w:'sawtooth', v:0.03, n:'E4 - - - D#4 - - - C4 - - - B3 - - -' },
    { w:'triangle', v:0.17, n:'E2 - - - - - - - C2 - - - B1 - - -' }
  ]},
  gameover: { bpm: 80, loop:false, ch: [
    { w:'square', v:0.06, n:'A4 - G4 - F4 - E4 - - - - - . . . .' },
    { w:'triangle', v:0.15, n:'A2 - - - F2 - - - E2 - - - - - - -' }
  ]}
};
