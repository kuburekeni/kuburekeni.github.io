// =====================================================================
//  I GOT ISEKAI'D — THE VIDEO GAME
//  data.js : sprites, classes, skills, enemies, items, shops, music
// =====================================================================

// ---------------------------------------------------------------- colours
const UI = {
  ink: '#161226',       // outlines / deep shadow
  win: '#1f2547',       // window fill (ai-iro indigo)
  win2: '#141a36',
  paper: '#f3e6c4',     // text / window border (washi cream)
  dim: '#9a93a8',
  sakura: '#f28fad',    // cursor / highlight
  gold: '#f2c94c',
  hp: '#7ed36f', mp: '#6fb7f2', bad: '#e5534b'
};

// ---------------------------------------------------------------- sprites
// 16x16 pixel templates. Palette keys:
//  . transparent  k outline  h hair  s skin  e eye  c clothes  d clothes-dark
//  p legs  b boots  w white  n horn  g monster body  r monster eye  x accent
const HUMAN = {
  down: [
    '................',
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhhk...',
    '...khhhhhhhhk...',
    '...khsssssshk...',
    '...ksessssesk...',
    '...kssssssssk...',
    '....kssssssk....',
    '...kcccccccck...',
    '..kscccddcccsk..',
    '..ksccccccccsk..',
    '...kddddddddk...',
    '...kpppkkpppk...',
    '...kpppkkpppk...',
    '...kbbbkkbbbk...'
  ],
  up: [
    '................',
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhhk...',
    '...khhhhhhhhk...',
    '...khhhhhhhhk...',
    '...khhhhhhhhk...',
    '...kshhhhhhsk...',
    '....kssssssk....',
    '...kcccccccck...',
    '..ksccccccccsk..',
    '..ksccccccccsk..',
    '...kddddddddk...',
    '...kpppkkpppk...',
    '...kpppkkpppk...',
    '...kbbbkkbbbk...'
  ],
  side: [
    '................',
    '.....kkkkk......',
    '....khhhhhk.....',
    '...khhhhhhhk....',
    '...khhhhhhhk....',
    '...khhhssssk....',
    '...khhsssesk....',
    '...khssssssk....',
    '....kssssk......',
    '....kcccccck....',
    '....kccsscck....',
    '....kccsscck....',
    '....kddddddk....',
    '....kppppppk....',
    '....kppppppk....',
    '....kbbbbbbk....'
  ]
};
const STEP = {
  down: { 13: '...kpppkkpppk...', 14: '...kbbbkkpppk...', 15: '....kkk.kbbbk...' },
  up:   { 13: '...kpppkkpppk...', 14: '...kbbbkkpppk...', 15: '....kkk.kbbbk...' },
  side: { 13: '....kppkkppk....', 14: '...kppk..kppk...', 15: '...kbbk..kbbk...' }
};
// overlays: [x, y, key] per direction
const MODS = {
  girl: {
    down: [[3,6,'h'],[3,7,'h'],[3,8,'h'],[4,8,'h'],[11,8,'h'],[12,8,'h'],[12,7,'h'],[3,9,'h'],[12,9,'h']],
    up:   [[4,8,'h'],[5,8,'h'],[6,8,'h'],[7,8,'h'],[8,8,'h'],[9,8,'h'],[10,8,'h'],[11,8,'h'],[4,9,'h'],[11,9,'h'],[5,9,'h'],[10,9,'h']],
    side: [[3,8,'h'],[4,8,'h'],[3,9,'h'],[4,9,'h'],[4,10,'h']]
  },
  ears: {
    down: [[2,5,'s'],[1,4,'s'],[13,5,'s'],[14,4,'s']],
    up:   [[2,5,'s'],[1,4,'s'],[13,5,'s'],[14,4,'s']],
    side: [[5,4,'s'],[6,3,'s']]
  },
  beard: {
    down: [[4,7,'h'],[11,7,'h'],[5,8,'h'],[6,8,'h'],[7,8,'h'],[8,8,'h'],[9,8,'h'],[10,8,'h'],[6,9,'h'],[7,9,'h'],[8,9,'h'],[9,9,'h'],[7,10,'h'],[8,10,'h']],
    up: [],
    side: [[7,7,'h'],[8,7,'h'],[9,7,'h'],[10,7,'h'],[6,8,'h'],[7,8,'h'],[8,8,'h'],[8,9,'h'],[9,9,'h']]
  },
  horns: {
    down: [[3,0,'n'],[12,0,'n'],[3,1,'n'],[4,1,'n'],[11,1,'n'],[12,1,'n'],[2,0,'n'],[13,0,'n']],
    up:   [[3,0,'n'],[12,0,'n'],[3,1,'n'],[4,1,'n'],[11,1,'n'],[12,1,'n'],[2,0,'n'],[13,0,'n']],
    side: [[7,0,'n'],[8,0,'n'],[6,1,'n'],[9,0,'n']]
  },
  hood: {
    down: [[3,5,'c'],[12,5,'c'],[3,6,'c'],[12,6,'c'],[3,7,'c'],[12,7,'c'],[4,2,'c'],[11,2,'c'],[5,1,'c'],[10,1,'c']],
    up:   [[3,5,'c'],[12,5,'c'],[3,6,'c'],[12,6,'c']],
    side: [[3,5,'c'],[3,6,'c'],[3,7,'c'],[4,2,'c']]
  }
};

const MONSTER_TPL = {
  slime: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......kkkk......',
    '....kkggggkk....',
    '...kgggggggwk...',
    '..kggggggggwgk..',
    '..kggkggggkggk..',
    '.kgggkggggkgggk.',
    '.kggggggggggggk.',
    '.kggggddddggggk.',
    '.kdggggggggggdk.',
    '..kddddddddddk..',
    '...kkkkkkkkkk...'
  ],
  bat: [
    '................',
    '................',
    '................',
    '.k............k.',
    '.kk....kk....kk.',
    '.kgk..kggk..kgk.',
    '.kggkkggggkkggk.',
    '.kggggrggrggggk.',
    '.kggggggggggggk.',
    '..kgggkwwkgggk..',
    '...kgk.kk.kgk...',
    '....k......k....',
    '................',
    '................',
    '................',
    '................'
  ],
  wolf: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '...........k.k..',
    '..........kgkgk.',
    'k.........kggrgk',
    'kgk......kggggkk',
    '.kgkkkkkkggggk..',
    '..kgggggggggk...',
    '..kgdgggggdgk...',
    '..kgk.kgk.kgk...',
    '..kdk.kdk.kdk...',
    '..kk..kk..kk....',
    '................'
  ],
  golem: [
    '................',
    '....kkkkkkkk....',
    '...kggggggggk...',
    '...kgrrggrrgk...',
    '...kggggggggk...',
    '.kkkggdddgggkkk.',
    'kgggkkggggkkgggk',
    'kggdgggggggggdgk',
    'kggkgggxxgggkggk',
    'kggkggxxxxggkggk',
    '.kk.kgggggggk.k.',
    '....kggkkggk....',
    '...kgggkkgggk...',
    '...kgggkkgggk...',
    '..kddddkkddddk..',
    '..kkkkkk.kkkkk..'
  ]
};

// Characters (NPCs + party). tpl: 'human' or monster template key
const SKIN = '#f4c9a0', SKIN2 = '#d9a47a';
const CHARS = {
  elder:   { pal: { h:'#e8e4dc', s:SKIN, c:'#7a4a2a', d:'#5a321a', p:'#5a321a', b:'#3a2a1a' }, mods:['beard'] },
  villager:{ pal: { h:'#6b3f22', s:SKIN, c:'#4f8a4b', d:'#35602f', p:'#5a4a3a', b:'#3a2a1a' } },
  woman:   { pal: { h:'#c0602a', s:SKIN, c:'#b24a6a', d:'#7d2f4a', p:'#7d2f4a', b:'#3a2a1a' }, mods:['girl'] },
  kid:     { pal: { h:'#f0d060', s:SKIN, c:'#4a7ab8', d:'#2f5585', p:'#3a3a55', b:'#3a2a1a' } },
  shop:    { pal: { h:'#3a2a1a', s:SKIN2, c:'#e0c060', d:'#a88830', p:'#5a4a3a', b:'#3a2a1a' } },
  inn:     { pal: { h:'#8a5a9a', s:SKIN, c:'#e8e0d0', d:'#b0a090', p:'#6a4a3a', b:'#3a2a1a' }, mods:['girl'] },
  guard:   { pal: { h:'#555a66', s:SKIN, c:'#8a93a6', d:'#5b6377', p:'#454b5a', b:'#2a2a33' } },
  goddess: { pal: { h:'#ffe27a', s:'#ffe9d6', c:'#ffffff', d:'#d8d0f0', p:'#ffffff', b:'#e8d8a0' }, mods:['girl'] },
  lyra:    { pal: { h:'#f6e08a', s:SKIN, c:'#3f9a6a', d:'#2a6a48', p:'#2a6a48', b:'#5a3a22' }, mods:['girl','ears'] },
  garrick: { pal: { h:'#a0522d', s:SKIN2, c:'#9aa3b0', d:'#6a7382', p:'#5a4a3a', b:'#3a2a1a' }, mods:['beard'] },
  dwarf:   { pal: { h:'#d8d8d8', s:SKIN2, c:'#8a5a3a', d:'#5a3a22', p:'#5a4a3a', b:'#3a2a1a' }, mods:['beard'] },
  smith:   { pal: { h:'#222222', s:SKIN2, c:'#5a5a5a', d:'#3a3a3a', p:'#3a3a3a', b:'#222' }, mods:['beard'] },
  merchant:{ pal: { h:'#3a2a1a', s:SKIN2, c:'#6a4a8a', d:'#4a2a6a', p:'#4a2a6a', b:'#2a1a1a' }, mods:['hood'] },
  healer:  { pal: { h:'#ffffff', s:SKIN, c:'#e8e8f8', d:'#a8a8c8', p:'#a8a8c8', b:'#6a6a8a' }, mods:['girl','hood'] },
  goblin:  { pal: { h:'#3a2a1a', s:'#7cbf4a', e:'#e5534b', c:'#7a5a3a', d:'#5a3a22', p:'#5a3a22', b:'#2a1a0a' }, mods:['ears'] },
  chief:   { pal: { h:'#aa2222', s:'#5aa03a', e:'#ffe050', c:'#6a3a1a', d:'#3a1a0a', p:'#3a1a0a', b:'#1a0a0a' }, mods:['ears','beard'] },
  skeleton:{ pal: { h:'#e8e8e0', s:'#e8e8e0', e:'#161226', c:'#c8c8c0', d:'#9a9a90', p:'#c8c8c0', b:'#9a9a90' } },
  orc:     { pal: { h:'#2a2a2a', s:'#6a8a4a', e:'#e5534b', c:'#7a2a2a', d:'#4a1a1a', p:'#3a3a2a', b:'#1a1a1a' }, mods:['beard'] },
  dknight: { pal: { h:'#2a2233', s:'#2a2233', e:'#ff3b3b', c:'#3a3050', d:'#241d33', p:'#241d33', b:'#15101f', n:'#b8b0c8' }, mods:['horns'] },
  king:    { pal: { h:'#1a1020', s:'#c8b8d8', e:'#ff2020', c:'#2a1030', d:'#6a1020', p:'#1a0a20', b:'#0a0510', n:'#f0e8d0' }, mods:['horns'] },
  student: { pal: { h:'#1e1a26', s:SKIN, c:'#2b3a67', d:'#1b2440', p:'#1b2440', b:'#111' } }
};
const HAIR_COLOURS = [
  { name: 'Midnight', c: '#1e1a26' }, { name: 'Chestnut', c: '#7a4422' },
  { name: 'Sakura', c: '#f28fad' }, { name: 'Silver', c: '#d8dce6' },
  { name: 'Electric Blue', c: '#3f7df2' }, { name: 'Blaze', c: '#e5534b' }
];

const MONSTERS = {
  slime:  { tpl:'slime', pal:{ g:'#6ccf5a', d:'#3f8f3a', w:'#e8ffe0' } },
  bslime: { tpl:'slime', pal:{ g:'#6ab8f0', d:'#3a78b8', w:'#e8f6ff' } },
  rslime: { tpl:'slime', pal:{ g:'#f06a3a', d:'#a83a1a', w:'#ffe8a0' } },
  bat:    { tpl:'bat',   pal:{ g:'#7a5aa8', r:'#ff5050', w:'#fff' } },
  cavebat:{ tpl:'bat',   pal:{ g:'#3a6a9a', r:'#ffe050', w:'#fff' } },
  imp:    { tpl:'bat',   pal:{ g:'#b83a4a', r:'#ffe050', w:'#fff' } },
  wolf:   { tpl:'wolf',  pal:{ g:'#9aa0aa', r:'#ffd050', d:'#6a707a' } },
  swolf:  { tpl:'wolf',  pal:{ g:'#3a2f4a', r:'#ff3050', d:'#241d33' } },
  golem:  { tpl:'golem', pal:{ g:'#8a8478', r:'#6af0ff', d:'#5a5448', x:'#6af0ff' } }
};

// ---------------------------------------------------------------- classes
const CLASSES = {
  hero: {
    base: { hp:44, mp:10, atk:8, def:4, mag:5, spd:6 },
    grow: { hp:9, mp:2, atk:2.2, def:1.6, mag:1.4, spd:0.8 },
    skills: [[1,'power'],[3,'aid'],[6,'cross'],[11,'truck']],
    weapon:'Sword'
  },
  lyra: {
    base: { hp:32, mp:22, atk:5, def:3, mag:11, spd:7 },
    grow: { hp:6.5, mp:3.5, atk:1, def:1.1, mag:2.6, spd:0.9 },
    skills: [[1,'fire'],[1,'ice'],[1,'heal'],[5,'thunder'],[9,'healall'],[14,'meteor']],
    weapon:'Staff'
  },
  garrick: {
    base: { hp:72, mp:8, atk:13, def:10, mag:2, spd:4 },
    grow: { hp:12, mp:1.2, atk:2.4, def:2.2, mag:0.5, spd:0.6 },
    skills: [[1,'bash'],[1,'taunt'],[10,'cleave'],[14,'ironwill']],
    weapon:'Axe'
  }
};

const SKILLS = {
  power:   { name:'Power Strike', mp:3,  target:'enemy',   kind:'phys', mult:1.8, desc:'A heavy two-handed swing.' },
  aid:     { name:'First Aid',    mp:4,  target:'ally',    kind:'heal', power:24, scale:2, desc:'Patch up one ally. You watched a lot of medical dramas.' },
  cross:   { name:'Cross Slash',  mp:8,  target:'enemies', kind:'phys', mult:1.2, desc:'An X-shaped slash that hits every enemy.' },
  truck:   { name:'Truck-kun!',   mp:18, target:'enemies', kind:'phys', mult:2.6, pierce:true, fx:'truck', desc:'Summon the truck that sent you here. Hits all enemies.' },
  fire:    { name:'Fire',         mp:4,  target:'enemy',   kind:'mag',  power:10, mult:1.6, elem:'fire', desc:'Fire damage to one enemy.' },
  ice:     { name:'Ice',          mp:4,  target:'enemy',   kind:'mag',  power:10, mult:1.6, elem:'ice', desc:'Ice damage to one enemy.' },
  heal:    { name:'Heal',         mp:5,  target:'ally',    kind:'heal', power:30, scale:2.2, desc:'Restore HP to one ally.' },
  thunder: { name:'Thunder',      mp:7,  target:'enemies', kind:'mag',  power:8,  mult:1.2, elem:'thunder', desc:'Lightning strikes every enemy.' },
  healall: { name:'Heal All',     mp:12, target:'allies',  kind:'heal', power:24, scale:1.6, desc:'Restore HP to the whole party.' },
  meteor:  { name:'Meteor',       mp:22, target:'enemies', kind:'mag',  power:30, mult:2.2, elem:'fire', desc:'Drop a star on everything. Very rude.' },
  bash:    { name:'Shield Bash',  mp:3,  target:'enemy',   kind:'phys', mult:1.4, stun:0.4, desc:'Hit with the shield. May stun.' },
  taunt:   { name:'Taunt',        mp:3,  target:'self',    kind:'buff', status:'taunt', turns:3, desc:'Draw all enemy attacks for 3 turns.' },
  cleave:  { name:'Cleave',       mp:6,  target:'enemies', kind:'phys', mult:1.1, desc:'A wide axe swing across every enemy.' },
  ironwill:{ name:'Iron Will',    mp:8,  target:'allies',  kind:'buff', status:'defup', turns:3, desc:'Raise the party\'s defence for 3 turns.' },
  // enemy skills
  bite:      { name:'Bite',        target:'enemy',   kind:'phys', mult:1.4 },
  smash:     { name:'Smash',       target:'enemy',   kind:'phys', mult:1.6 },
  quake:     { name:'Quake',       target:'enemies', kind:'phys', mult:0.9 },
  drain:     { name:'Life Drain',  target:'enemy',   kind:'mag',  power:10, mult:1.0, drain:true },
  icebolt:   { name:'Ice Bolt',    target:'enemy',   kind:'mag',  power:8,  mult:1.3, elem:'ice' },
  firebolt:  { name:'Fire Bolt',   target:'enemy',   kind:'mag',  power:10, mult:1.3, elem:'fire' },
  firebreath:{ name:'Fire Breath', target:'enemies', kind:'mag',  power:8,  mult:1.0, elem:'fire' },
  darkflame: { name:'Dark Flame',  target:'enemies', kind:'mag',  power:20, mult:1.1, elem:'dark' },
  cleaveE:   { name:'Abyss Cleave',target:'enemies', kind:'phys', mult:1.0 }
};

// ---------------------------------------------------------------- enemies
const ENEMIES = {
  slime:   { name:'Slime',       spr:'slime',   hp:16,  atk:7,  def:2,  mag:0,  spd:3,  xp:5,   gold:4,  weak:'fire' },
  bat:     { name:'Bat',         spr:'bat',     hp:12,  atk:7,  def:1,  mag:0,  spd:10, xp:5,   gold:3,  weak:'thunder' },
  wolf:    { name:'Wolf',        spr:'wolf',    hp:24,  atk:10, def:3,  mag:0,  spd:8,  xp:8,   gold:6,  weak:'fire', skills:['bite'] },
  goblin:  { name:'Goblin',      spr:'goblin',  hp:28,  atk:11, def:4,  mag:0,  spd:5,  xp:9,   gold:10 },
  chief:   { name:'Goblin Chief',spr:'chief',   hp:150, atk:15, def:6,  mag:0,  spd:5,  xp:60,  gold:100, boss:true, skills:['smash'] },
  skeleton:{ name:'Skeleton',    spr:'skeleton',hp:46,  atk:18, def:9,  mag:0,  spd:6,  xp:24,  gold:14, weak:'fire', resist:'ice' },
  cavebat: { name:'Cave Bat',    spr:'cavebat', hp:30,  atk:15, def:5,  mag:10, spd:13, xp:20,  gold:9,  weak:'thunder', skills:['drain'] },
  bslime:  { name:'Frost Slime', spr:'bslime',  hp:42,  atk:14, def:8,  mag:15, spd:4,  xp:22,  gold:12, weak:'fire', resist:'ice', skills:['icebolt'] },
  golem:   { name:'Stone Golem', spr:'golem',   hp:440, atk:26, def:18, mag:0,  spd:3,  xp:300, gold:300, boss:true, weak:'thunder', resist:'fire', skills:['smash','quake'] },
  orc:     { name:'Orc Brute',   spr:'orc',     hp:95,  atk:30, def:15, mag:0,  spd:6,  xp:70,  gold:35, skills:['smash'] },
  rslime:  { name:'Magma Slime', spr:'rslime',  hp:68,  atk:22, def:12, mag:28, spd:5,  xp:62,  gold:28, weak:'ice', resist:'fire', skills:['firebreath'] },
  swolf:   { name:'Shadow Wolf', spr:'swolf',   hp:78,  atk:32, def:12, mag:0,  spd:15, xp:72,  gold:30, weak:'fire', skills:['bite'] },
  dknight: { name:'Demon Knight',spr:'dknight', hp:130, atk:38, def:22, mag:22, spd:9,  xp:115, gold:55, weak:'thunder', skills:['smash','darkflame'] },
  imp:     { name:'Imp',         spr:'imp',     hp:62,  atk:20, def:10, mag:34, spd:14, xp:95,  gold:40, weak:'ice', skills:['firebolt'] },
  king:    { name:'Demon King Malgrath', spr:'king', hp:1700, atk:58, def:30, mag:52, spd:12, xp:0, gold:0, boss:true, king:true, skills:['darkflame','drain','smash','cleaveE'] }
};

// ---------------------------------------------------------------- items
const ITEMS = {
  potion:  { name:'Potion',       type:'use', price:25,  heal:60,  target:'ally', desc:'Restores 60 HP.' },
  hipotion:{ name:'Hi-Potion',    type:'use', price:90,  heal:200, target:'ally', desc:'Restores 200 HP.' },
  mega:    { name:'Mega Potion',  type:'use', price:320, heal:180, target:'allies', desc:'Restores 180 HP to the whole party.' },
  ether:   { name:'Ether',        type:'use', price:80,  mpheal:30, target:'ally', desc:'Restores 30 MP.' },
  phoenix: { name:'Phoenix Down', type:'use', price:150, revive:0.5, target:'dead', desc:'Revives a fallen ally with half HP.' },
  bomb:    { name:'Fire Bomb',    type:'use', price:60,  dmg:60, elem:'fire', target:'enemies', battleOnly:true, desc:'Deals 60 fire damage to all enemies.' },
  // equipment
  uniform: { name:'School Uniform', type:'armor',  def:2,  who:['hero'], price:10, desc:'Still smells like the city.' },
  wsword:  { name:'Wooden Sword',   type:'weapon', atk:2,  who:['hero'], price:10, desc:'A training sword from the elder.' },
  isword:  { name:'Iron Sword',     type:'weapon', atk:7,  who:['hero'], price:130, desc:'A dependable iron blade.' },
  ssword:  { name:'Steel Blade',    type:'weapon', atk:14, who:['hero'], price:480, desc:'Dwarf-forged steel.' },
  msword:  { name:'Mythril Edge',   type:'weapon', atk:23, who:['hero'], price:1500, desc:'Light as a feather, sharp as regret.' },
  truckblade:{ name:'Truckblade',   type:'weapon', atk:36, who:['hero'], price:4000, desc:'Forged from the bumper of Truck-kun himself.' },
  ostaff:  { name:'Oak Staff',      type:'weapon', atk:1, mag:3,  who:['lyra'], price:10, desc:'Lyra\'s travel staff.' },
  rstaff:  { name:'Ruby Staff',     type:'weapon', atk:3, mag:9,  who:['lyra'], price:420, desc:'A ruby hums inside the wood.' },
  astaff:  { name:'Archmage Staff', type:'weapon', atk:5, mag:16, who:['lyra'], price:1450, desc:'Staff of the old elven archmages.' },
  axe1:    { name:'Hand Axe',       type:'weapon', atk:5,  who:['garrick'], price:10, desc:'Garrick\'s old axe. Nicked, loved.' },
  axe2:    { name:'War Axe',        type:'weapon', atk:14, who:['garrick'], price:520, desc:'A proper dwarven war axe.' },
  axe3:    { name:'Rune Hammer',    type:'weapon', atk:25, who:['garrick'], price:1550, desc:'Runes glow when it hits things.' },
  tunic:   { name:'Travel Cloak',   type:'armor',  def:1,  who:['lyra','garrick'], price:10, desc:'Basic travelling gear.' },
  leather: { name:'Leather Armor',  type:'armor',  def:5,  who:['hero','lyra','garrick'], price:90, desc:'Light leather armor.' },
  robe:    { name:'Mage Robe',      type:'armor',  def:6, mag:4, who:['lyra'], price:320, desc:'Woven with focusing thread.' },
  chain:   { name:'Chain Mail',     type:'armor',  def:11, who:['hero','garrick'], price:420, desc:'Rings of dwarven steel.' },
  star:    { name:'Starlight Robe', type:'armor',  def:13, mag:9, who:['lyra'], price:1500, desc:'Glows faintly in the dark.' },
  dragon:  { name:'Dragon Mail',    type:'armor',  def:20, who:['hero','garrick'], price:1650, desc:'Scales of a long-dead dragon.' }
};

const SHOPS = {
  village: ['potion','ether','bomb','isword','leather'],
  ironhold:['potion','hipotion','ether','phoenix','bomb','ssword','rstaff','axe2','chain','robe'],
  camp:    ['hipotion','mega','ether','phoenix','bomb','msword','astaff','axe3','dragon','star']
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
