// =====================================================================
//  I GOT ISEKAI'D — THE VIDEO GAME   (v3: "Born Again")
//  data.js : palettes, looks, characters, companions, classes, skills,
//            enemies, items, shops, music
// =====================================================================

// ---------------------------------------------------------------- colours
const UI = {
  ink: '#120e1f',       // outlines / deep shadow
  win: '#1c2244',       // window fill
  win2: '#10152e',
  paper: '#f3e6c4',     // text / window border
  dim: '#9a93a8',
  sakura: '#f28fad',    // cursor / highlight
  gold: '#f2c94c',
  hp: '#7ed36f', mp: '#6fb7f2', bad: '#e5534b', brk: '#f2a33a'
};

// ---------------------------------------------------------------- looks
const SKIN_TONES = [
  { name: 'Porcelain', c: '#f7dcc4' }, { name: 'Fair', c: '#f1c7a3' }, { name: 'Warm', c: '#dca77c' },
  { name: 'Tan', c: '#bd8256' }, { name: 'Brown', c: '#8f5a37' }, { name: 'Umber', c: '#6e4228' }, { name: 'Deep', c: '#4e2e1c' }
];
const HAIR_COLOURS = [
  { name: 'Black', c: '#16121c' }, { name: 'Soft Black', c: '#2a2026' }, { name: 'Dark Brown', c: '#3e2618' },
  { name: 'Chestnut', c: '#6e3c1e' }, { name: 'Ash Blonde', c: '#d8c690' }, { name: 'Silver', c: '#d0d4de' },
  { name: 'Sakura', c: '#e98aa8' }, { name: 'Deep Blue', c: '#34508e' }, { name: 'Crimson', c: '#a8322e' }
];
// every style works for either sex
const HAIR_STYLES = [
  { id: 'buzz', name: 'Buzz Cut' }, { id: 'short', name: 'Short' }, { id: 'twists', name: 'Twists' },
  { id: 'afro', name: 'Afro' }, { id: 'locs', name: 'Locs' }, { id: 'braids', name: 'Braids' },
  { id: 'spiky', name: 'Spiky' }, { id: 'ponytail', name: 'Ponytail' }, { id: 'bun', name: 'Bun' }, { id: 'long', name: 'Long' }
];

// ---------------------------------------------------------------- characters
// pal keys: h hair  s skin  e eyes  c coat  d coat-shade  t trim  p legs  b boots  n accent
// hair: a HAIR_STYLES id. outfit: tunic noble uniform robe leather chain plate cloak ranger rogue dress
// mods: girl ears beard horns hood helm skirt child cape stout tusks bones apron tie hakama
const SK = '#f1c7a3', SK2 = '#dca77c', SK3 = '#bd8256', SK4 = '#8f5a37', SK5 = '#6e4228', ASH = '#8e7f9a';
const CHARS = {
  // --- Tokyo
  aoi:      { pal: { h:'#2a1c20', s:SK,  c:'#2b3a67', d:'#1b2440', p:SK,  b:'#2a2020', n:'#b83a4a' }, hair:'long', outfit:'uniform', mods:['girl','skirt','tie'] },
  daichi:   { pal: { h:'#141018', s:SK2, c:'#e8e6ee', d:'#3a3e6a', p:'#26284a', b:'#26284a' }, hair:'short', mods:['hakama'] },
  clerk:    { pal: { h:'#5a3a22', s:SK,  c:'#3a8ad0', d:'#2a5a9a', p:'#2a2a3a', b:'#222' } },
  salary:   { pal: { h:'#1e1a1e', s:SK2, c:'#3a3e4a', d:'#262a34', p:'#262a34', b:'#111', n:'#8a2a2a' }, mods:['tie'] },
  student:  { pal: { h:'#3a2a1a', s:SK,  c:'#2b3a67', d:'#1b2440', p:'#1b2440', b:'#111' }, outfit:'uniform' },
  priest:   { pal: { h:'#c8c8c8', s:SK2, c:'#f0ece0', d:'#b0a890', p:'#a83a30', b:'#3a2a1a' }, hair:'buzz', mods:['hakama'] },
  girlchild:{ pal: { h:'#2a1a14', s:SK,  c:'#f2c94c', d:'#c89a2a', p:SK,  b:'#d24a5a' }, hair:'bun', mods:['girl','skirt','child'] },
  // --- the Void
  goddess:  { pal: { h:'#f4e6b0', s:'#fbe9da', c:'#ffffff', d:'#d6d0ee', t:'#f2c94c', p:'#ffffff', b:'#e8d8a0', n:'#f2c94c' }, hair:'long', outfit:'robe', mods:['girl','cape'] },
  // --- House Valen
  father:   { pal: { h:'#2a1c16', s:SK4, c:'#3a2a5a', d:'#241a3a', t:'#d8a840', p:'#241a3a', b:'#1a1010', n:'#8a1e2a' }, hair:'short', outfit:'noble', mods:['beard','cape'] },
  mother:   { pal: { h:'#1a1210', s:SK4, c:'#7a2a4a', d:'#521a30', t:'#e8c870', p:'#521a30', b:'#2a1010' }, hair:'braids', outfit:'dress', mods:['girl','skirt'] },
  nanny:    { pal: { h:'#8a8480', s:SK2, c:'#6a7a9a', d:'#4a5a7a', t:'#e8e0d0', p:'#4a5a7a', b:'#2a2020' }, hair:'bun', outfit:'dress', mods:['girl','skirt','apron'] },
  swordmaster:{ pal: { h:'#c8c4bc', s:SK3, c:'#5a6a7a', d:'#3a4a5a', t:'#b8c0c8', p:'#3a3a4a', b:'#1a1a22' }, hair:'buzz', outfit:'chain', mods:['beard'] },
  courtmage:{ pal: { h:'#e8e4f0', s:SK,  c:'#3a2a7a', d:'#241a52', t:'#f2c94c', p:'#241a52', b:'#1a1030' }, hair:'long', outfit:'robe', mods:['beard'] },
  butler:   { pal: { h:'#d8d8d8', s:SK2, c:'#1e1e26', d:'#121218', t:'#e8e8e8', p:'#121218', b:'#0a0a0e' }, hair:'short', outfit:'noble' },
  maid:     { pal: { h:'#3a2418', s:SK3, c:'#2a2a36', d:'#1a1a24', t:'#f0f0f0', p:'#1a1a24', b:'#0e0e14' }, hair:'bun', outfit:'dress', mods:['girl','skirt','apron'] },
  stablehand:{ pal: { h:'#3a2a1a', s:SK4, c:'#7a6a4a', d:'#5a4a30', p:'#4a3a2a', b:'#2a1a10' }, hair:'short', mods:['stout'] },
  wrenkid:  { pal: { h:'#a8502a', s:SK2, c:'#5a7a4a', d:'#3a5a30', p:'#5a4a3a', b:'#3a2a1a' }, hair:'ponytail', mods:['girl','child'] },
  // --- common folk
  elder:    { pal: { h:'#e8e4dc', s:SK2, c:'#6a4a2e', d:'#4a3220', p:'#4a3220', b:'#2a1a10' }, hair:'buzz', mods:['beard'] },
  villager: { pal: { h:'#5e3a20', s:SK3, c:'#4f7a4b', d:'#35552f', p:'#5a4a3a', b:'#3a2a1a' } },
  villager2:{ pal: { h:'#16121c', s:SK5, c:'#8a5a2a', d:'#6a4020', p:'#4a3a2a', b:'#2a1a10' }, hair:'twists' },
  villager3:{ pal: { h:'#16121c', s:SK4, c:'#3a6a8a', d:'#24506a', p:'#4a3a2a', b:'#2a1a10' }, hair:'locs', mods:['girl','skirt'] },
  farmer:   { pal: { h:'#6a4a2a', s:SK3, c:'#a8884a', d:'#7a6030', p:'#4a5a7a', b:'#3a2a1a' }, hair:'short', mods:['stout'] },
  woman:    { pal: { h:'#a8502a', s:SK,  c:'#8e3e5a', d:'#62283e', p:'#62283e', b:'#3a2a1a' }, hair:'long', mods:['girl','skirt'] },
  woman2:   { pal: { h:'#16121c', s:SK5, c:'#c8783a', d:'#9a5424', p:'#9a5424', b:'#3a2a1a' }, hair:'afro', mods:['girl','skirt'] },
  kid:      { pal: { h:'#d8b850', s:SK,  c:'#4a6ea8', d:'#2f4d80', p:'#3a3a55', b:'#3a2a1a' }, mods:['child'] },
  kid2:     { pal: { h:'#16121c', s:SK4, c:'#c84a4a', d:'#9a2a2a', p:'#3a3a55', b:'#3a2a1a' }, hair:'afro', mods:['child'] },
  shop:     { pal: { h:'#3a2a1a', s:SK3, c:'#b89a50', d:'#8a7030', p:'#5a4a3a', b:'#3a2a1a' }, mods:['apron'] },
  inn:      { pal: { h:'#6a4a7a', s:SK,  c:'#e2dace', d:'#aea290', p:'#6a4a3a', b:'#3a2a1a' }, hair:'bun', mods:['girl','skirt','apron'] },
  guard:    { pal: { h:'#555a66', s:SK2, c:'#8a93a6', d:'#5b6377', t:'#3a5aa8', p:'#454b5a', b:'#2a2a33' }, outfit:'chain', mods:['helm'] },
  royalguard:{ pal: { h:'#555a66', s:SK4, c:'#c8ccd8', d:'#8a90a6', t:'#a82a3a', p:'#454b5a', b:'#2a2a33' }, outfit:'plate', mods:['helm','cape'] },
  noble:    { pal: { h:'#d8c690', s:SK,  c:'#2a6a5a', d:'#1a4a3e', t:'#e8c870', p:'#1a4a3e', b:'#1a1010' }, hair:'short', outfit:'noble' },
  noblewoman:{ pal: { h:'#3a2418', s:SK2, c:'#6a3a8a', d:'#4a2466', t:'#e8c870', p:'#4a2466', b:'#1a1010' }, hair:'long', outfit:'dress', mods:['girl','skirt'] },
  king:     { pal: { h:'#e8e4dc', s:SK3, c:'#8a1e2a', d:'#5a1018', t:'#f2c94c', p:'#3a1018', b:'#1a0808', n:'#f2c94c' }, hair:'short', outfit:'noble', mods:['beard','cape'] },
  herald:   { pal: { h:'#3a2a1a', s:SK, c:'#e8c870', d:'#b8983a', t:'#8a1e2a', p:'#8a1e2a', b:'#2a1010' }, outfit:'noble' },
  thug:     { pal: { h:'#16121c', s:SK3, c:'#4a3a3a', d:'#2e2424', p:'#2e2a26', b:'#1a1614' }, hair:'buzz', outfit:'leather', mods:['stout'] },
  beggar:   { pal: { h:'#6a6460', s:SK2, c:'#6a5a4a', d:'#4a3e30', p:'#4a3e30', b:'#2a2018' }, outfit:'cloak', mods:['hood','beard'] },
  hunter:   { pal: { h:'#5a3a1e', s:SK3, c:'#4a6a3a', d:'#2e4a24', p:'#5a4a30', b:'#3a2a1a' }, hair:'short', outfit:'ranger' },
  hunter2:  { pal: { h:'#16121c', s:SK5, c:'#6a5a3a', d:'#4a3e24', p:'#5a4a30', b:'#3a2a1a' }, hair:'locs', outfit:'ranger' },
  miller:   { pal: { h:'#d8d0c0', s:SK2, c:'#e8e0d0', d:'#b8b0a0', p:'#6a5a4a', b:'#3a2a1a' }, hair:'short', mods:['stout','apron','beard'] },
  ghostgirl:{ pal: { h:'#c8d8f0', s:'#dce8f8', e:'#6a8ab8', c:'#b8c8e8', d:'#8aa0c8', p:'#dce8f8', b:'#8aa0c8' }, hair:'long', mods:['girl','skirt','child'] },
  poacher:  { pal: { h:'#3a2616', s:SK3, c:'#5a5a3a', d:'#3a3a24', p:'#2e2a26', b:'#1a1614' }, outfit:'cloak', mods:['hood'] },
  // --- companions (base looks; armour changes their clothes)
  lyra:     { pal: { h:'#f0dc8a', s:SK,  c:'#2f7a58', d:'#1f5a3e', t:'#c8a86a', p:'#1f5a3e', b:'#4a3020', n:'#c8a86a' }, hair:'long', mods:['girl','ears','cape'] },
  garrick:  { pal: { h:'#8a4424', s:SK3, c:'#8a93a0', d:'#5a6270', p:'#4a3e30', b:'#2a1e14' }, hair:'short', mods:['beard','stout'] },
  poster:   { pal: { h:'#2a2026', s:SK3, c:'#3a4e8a', d:'#26346a', t:'#e0c46a', p:'#2a2438', b:'#3a2a1a', n:'#c04a4a' }, hair:'twists', outfit:'noble', mods:['cape'] },
  posterf:  { pal: { h:'#3e2618', s:SK2, c:'#7a3a5a', d:'#5a2842', t:'#e0c46a', p:'#3a2438', b:'#3a2a1a', n:'#e0c46a' }, hair:'braids', outfit:'noble', mods:['girl','cape'] },
  wren:     { pal: { h:'#a8502a', s:SK2, c:'#5a7a4a', d:'#3a5a30', t:'#c8a86a', p:'#5a4a3a', b:'#3a2a1a' }, hair:'ponytail', mods:['girl'] },
  sable:    { pal: { h:'#16121c', s:SK4, c:'#2a2430', d:'#1a1620', t:'#a8322e', p:'#1a1620', b:'#0e0a10', n:'#a8322e' }, hair:'short', outfit:'rogue', mods:['girl'] },
  oswin:    { pal: { h:'#d8d0c0', s:SK3, c:'#e8e0d0', d:'#b8a890', t:'#d8a840', p:'#b8a890', b:'#5a4a3a' }, hair:'buzz', outfit:'robe', mods:['stout'] },
  kestrel:  { pal: { h:'#16121c', s:SK5, c:'#4a6a3a', d:'#2e4a24', t:'#8a6a3a', p:'#4a3a2a', b:'#2a1a10' }, hair:'locs', outfit:'ranger' },
  varek:    { pal: { h:'#2a2030', s:ASH, e:'#f2c94c', c:'#3a2e3a', d:'#241c24', t:'#8a2a2a', p:'#241c24', b:'#120a10', n:'#d8d0c0' }, hair:'long', outfit:'plate', mods:['horns'] },
  // --- the old story
  healer:   { pal: { h:'#f0f0f0', s:SK,  c:'#dcdcee', d:'#9c9cbc', p:'#9c9cbc', b:'#5a5a7a' }, outfit:'robe', mods:['girl','hood'] },
  dwarf:    { pal: { h:'#c8c8c8', s:SK3, c:'#7a4e30', d:'#54321c', p:'#4a3e30', b:'#2a1e14' }, mods:['beard','stout'] },
  smith:    { pal: { h:'#1e1e1e', s:SK4, c:'#4a4a4a', d:'#2e2e2e', p:'#2e2e2e', b:'#1a1a1a' }, hair:'buzz', mods:['beard','stout','apron'] },
  merchant: { pal: { h:'#3a2a1a', s:SK3, c:'#5a3e7a', d:'#3a2458', p:'#3a2458', b:'#1a1010' }, outfit:'cloak', mods:['hood','beard','stout'] },
  goblin:   { pal: { h:'#2a2014', s:'#6ea040', e:'#e5534b', c:'#6a4e30', d:'#4a3020', p:'#4a3020', b:'#1a1008' }, hair:'buzz', mods:['ears','child'] },
  chief:    { pal: { h:'#8a1e1e', s:'#4f8a30', e:'#ffe050', c:'#5a3016', d:'#3a1a08', p:'#3a1a08', b:'#140a04', n:'#e8e0c8' }, hair:'spiky', mods:['ears','stout','horns'] },
  skeleton: { pal: { h:'#e8e6dc', s:'#e8e6dc', e:'#1a1226', c:'#c8c6bc', d:'#9a988e', p:'#c8c6bc', b:'#9a988e' }, hair:'none', mods:['bones'] },
  orc:      { pal: { h:'#1e1e1e', s:'#5e7a40', e:'#e5534b', c:'#6a2424', d:'#421616', p:'#3a3a2a', b:'#161616' }, hair:'buzz', outfit:'leather', mods:['stout','tusks'] },
  bandit:   { pal: { h:'#3a2616', s:SK3, c:'#5a4a3a', d:'#3a2e22', p:'#2e2a26', b:'#1a1614' }, outfit:'cloak', mods:['hood'] },
  banditboss:{ pal: { h:'#16121c', s:SK4, c:'#6a2a2a', d:'#4a1a1a', t:'#b8a078', p:'#2e2a26', b:'#1a1614' }, hair:'afro', outfit:'leather', mods:['beard','stout'] },
  dknight:  { pal: { h:'#241e30', s:'#241e30', e:'#ff3b3b', c:'#332a48', d:'#1f1830', t:'#6a1a2a', p:'#1f1830', b:'#120e1c', n:'#b8b0c8' }, outfit:'plate', mods:['horns','helm','cape'] },
  demonking:{ pal: { h:'#16101e', s:'#9a8aae', e:'#ff3030', c:'#2a1030', d:'#5a1020', t:'#e8e0cc', p:'#1a0a20', b:'#0a0510', n:'#e8e0cc' }, hair:'long', outfit:'plate', mods:['horns','cape'] },
  demonm:   { pal: { h:'#3a2a40', s:ASH, e:'#f2c94c', c:'#6a4a3a', d:'#4a3226', p:'#3a2a22', b:'#1a1210', n:'#d8d0c0' }, mods:['horns'] },
  demonf:   { pal: { h:'#5a2a4a', s:ASH, e:'#f2c94c', c:'#7a3a4a', d:'#52263a', p:'#52263a', b:'#1a1210', n:'#d8d0c0' }, hair:'long', mods:['horns','girl','skirt'] },
  nyx:      { pal: { h:'#3a2a5a', s:'#a898b8', e:'#f2c94c', c:'#b85a4a', d:'#8a3a30', p:'#a898b8', b:'#3a2a22', n:'#e8e0d0' }, hair:'bun', mods:['horns','girl','skirt','child'] }
};

// ---------------------------------------------------------------- companions
// morale 0-100. Below 35 when you send them away and they will not come back.
const COMPANIONS = {
  wren:    { name: 'Wren',    title: 'Stable-girl turned sword', home: 'valenford', homeName: 'the Valen stables',
             pros: 'Balanced fighter. Can Cover allies. Loyal if she trusts you.', cons: 'Average at everything. Her morale remembers the night by the mill.' },
  lyra:    { name: 'Lyra',    title: 'Elven mage', home: 'aldmere_inn', homeName: 'the Crooked Lantern in Aldmere',
             pros: 'Devastating elemental magic and healing.', cons: 'Very fragile. Dislikes cruelty.' },
  garrick: { name: 'Garrick', title: 'Dwarven guardian', home: 'ironhold_tavern', homeName: 'the Deep Hearth in Ironhold',
             pros: 'Huge HP and defence. Taunts enemies away from you.', cons: 'Slow. Almost no magic.' },
  sable:   { name: 'Sable',   title: 'Solmere pickpocket', home: 'solmere_tavern', homeName: 'the Gutter Rose in Solmere',
             pros: 'Fastest in the party. Steals, poisons, lands critical hits.', cons: 'Paper-thin. Loses heart when you give things away.' },
  oswin:   { name: 'Oswin',   title: 'Brother of the Dawn', home: 'brookvale_chapel', homeName: 'the chapel in Brookvale',
             pros: 'The best healer. Can raise the fallen and cure ailments.', cons: 'Barely hurts anything that isn\'t a demon. Distrusts Varek.' },
  kestrel: { name: 'Kestrel', title: 'Fernhollow ranger', home: 'fernhollow', homeName: 'the lodge in Fernhollow',
             pros: 'Pinpoint arrows that shatter enemy guard (Break).', cons: 'Low MP and weak against magic.' },
  varek:   { name: 'Varek',   title: 'Ashborn deserter', home: 'wastes', homeName: 'the camp in the Ashen Wastes',
             pros: 'The hardest hitter alive. Dark blade arts.', cons: 'His skills cost HP. Shopkeepers charge more while he walks with you.' }
};
const COMPANION_IDS = Object.keys(COMPANIONS);

// ---------------------------------------------------------------- classes
const HERO_CLASSES = {
  blade: { name: 'Blade', desc: 'Steel and nerve. The highest strength and toughness, but little magic.' },
  mage:  { name: 'Spellcaster', desc: 'Old words, sharp as glass. Devastating elemental magic, but a fragile body.' },
  none:  { name: 'Master of None', desc: 'Good at both, great at neither. You can wield sword and staff, and answer anything.' }
};
const CLASSES = {
  hero_child: {
    base: { hp:30, mp:10, atk:6, def:3, mag:6, spd:6 }, grow: { hp:4, mp:1, atk:1, def:1, mag:1, spd:0.5 },
    skills: [[1,'power']], weapon:'Stick'
  },
  hero_blade: {
    base: { hp:50, mp:10, atk:10, def:5, mag:3, spd:6 }, grow: { hp:10, mp:1.5, atk:2.5, def:1.8, mag:0.7, spd:0.8 },
    skills: [[1,'power'],[3,'rally'],[5,'cross'],[7,'riposte'],[9,'guardbreak'],[12,'whirl'],[15,'bladestorm']], weapon:'Sword'
  },
  hero_mage: {
    base: { hp:36, mp:22, atk:4, def:3, mag:11, spd:6 }, grow: { hp:6.8, mp:3.4, atk:0.9, def:1.1, mag:2.7, spd:0.8 },
    skills: [[1,'fire'],[1,'ice'],[3,'heal'],[5,'thunder'],[7,'barrier'],[9,'frostbind'],[12,'firestorm'],[14,'meteor']], weapon:'Staff'
  },
  hero_none: {
    base: { hp:42, mp:15, atk:7, def:4, mag:7, spd:7 }, grow: { hp:8.2, mp:2.4, atk:1.8, def:1.4, mag:1.8, spd:0.9 },
    skills: [[1,'power'],[1,'fire'],[3,'aid'],[4,'ice'],[6,'spellblade'],[8,'thunder'],[10,'riposte'],[12,'frostblade']], weapon:'Sword/Staff'
  },
  wren: {
    base: { hp:46, mp:10, atk:9, def:6, mag:3, spd:7 }, grow: { hp:9, mp:1.4, atk:2.1, def:1.8, mag:0.6, spd:0.8 },
    skills: [[1,'quickcut'],[1,'cover'],[5,'rally'],[9,'cross'],[13,'valiant']], weapon:'Sword'
  },
  lyra: {
    base: { hp:32, mp:22, atk:5, def:3, mag:11, spd:7 }, grow: { hp:6.5, mp:3.5, atk:1, def:1.1, mag:2.6, spd:0.9 },
    skills: [[1,'fire'],[1,'ice'],[1,'heal'],[5,'thunder'],[9,'healall'],[12,'frostbind'],[14,'meteor']], weapon:'Staff'
  },
  garrick: {
    base: { hp:72, mp:8, atk:13, def:10, mag:2, spd:4 }, grow: { hp:12, mp:1.2, atk:2.4, def:2.2, mag:0.5, spd:0.6 },
    skills: [[1,'bash'],[1,'taunt'],[10,'cleave'],[14,'ironwill']], weapon:'Axe'
  },
  sable: {
    base: { hp:34, mp:12, atk:10, def:3, mag:4, spd:12 }, grow: { hp:6.6, mp:1.8, atk:2.2, def:0.9, mag:0.8, spd:1.3 },
    skills: [[1,'steal'],[1,'venom'],[6,'backstab'],[10,'smoke'],[14,'fanstorm']], weapon:'Dagger'
  },
  oswin: {
    base: { hp:44, mp:24, atk:5, def:6, mag:9, spd:4 }, grow: { hp:8, mp:3.6, atk:0.9, def:1.6, mag:2.1, spd:0.5 },
    skills: [[1,'heal'],[1,'cure'],[4,'raise'],[6,'sanctus'],[9,'regen'],[11,'healall'],[15,'judgement']], weapon:'Mace'
  },
  kestrel: {
    base: { hp:38, mp:9, atk:11, def:4, mag:3, spd:10 }, grow: { hp:7.2, mp:1.2, atk:2.4, def:1.1, mag:0.6, spd:1.1 },
    skills: [[1,'aimed'],[1,'mark'],[6,'volley'],[10,'pin'],[14,'skypierce']], weapon:'Bow'
  },
  varek: {
    base: { hp:62, mp:12, atk:16, def:9, mag:8, spd:7 }, grow: { hp:10.5, mp:1.5, atk:2.8, def:1.8, mag:1.4, spd:0.8 },
    skills: [[1,'ashblade'],[1,'soulrend'],[18,'dread'],[20,'hellfire']], weapon:'Greatsword'
  }
};

// input: 'bar' timing bar (default for attacks), 'chain' multi-press bar (blade skills), 'glyph' rune matching (spells)
const SKILLS = {
  power:     { name:'Power Strike',  mp:3,  target:'enemy',   kind:'phys', mult:1.8, brk:18, input:'chain', hits:1, desc:'A heavy, committed swing. Good for Break.' },
  rally:     { name:'Second Wind',   mp:5,  target:'self',    kind:'heal', power:18, scale:1.2, useAtk:true, desc:'Steady your breathing and recover HP.' },
  cross:     { name:'Cross Slash',   mp:8,  target:'enemies', kind:'phys', mult:1.15, input:'chain', hits:2, desc:'Two sweeping cuts that reach every enemy.' },
  riposte:   { name:'Riposte',       mp:4,  target:'self',    kind:'buff', status:'riposte', turns:2, desc:'A counter stance. For 2 turns, every parry is perfect and strikes back.' },
  guardbreak:{ name:'Sunder',        mp:6,  target:'enemy',   kind:'phys', mult:1.4, pierce:true, brk:40, input:'chain', hits:1, desc:'Aimed at the gaps in armour. Ignores defence, shatters guard.' },
  whirl:     { name:'Whirlwind',     mp:12, target:'enemies', kind:'phys', mult:1.4, brk:16, input:'chain', hits:3, desc:'Three spinning cuts across the whole field.' },
  bladestorm:{ name:'Bladestorm',    mp:18, target:'enemies', kind:'phys', mult:2.0, brk:20, input:'chain', hits:4, desc:'A relentless flurry across the whole battlefield.' },
  spellblade:{ name:'Spellblade',    mp:6,  target:'enemy',   kind:'hybrid', mult:1.6, elem:'fire', status:'burn', chance:0.4, input:'chain', hits:2, desc:'Fire poured down your weapon. May burn.' },
  frostblade:{ name:'Frostblade',    mp:9,  target:'enemy',   kind:'hybrid', mult:1.9, elem:'ice', status:'freeze', chance:0.3, input:'chain', hits:2, desc:'An edge of rime. May freeze solid.' },
  barrier:   { name:'Barrier',       mp:8,  target:'allies',  kind:'buff', status:'shield', turns:3, desc:'A ward of light that raises the party\'s defence.' },
  aid:       { name:'First Aid',     mp:4,  target:'ally',    kind:'heal', power:22, scale:2, desc:'Bind wounds and restore HP to one ally.' },
  fire:      { name:'Fire',          mp:4,  target:'enemy',   kind:'mag',  power:10, mult:1.6, elem:'fire', status:'burn', chance:0.25, input:'glyph', glyphs:3, desc:'Fire damage to one enemy. May burn.' },
  ice:       { name:'Ice',           mp:4,  target:'enemy',   kind:'mag',  power:10, mult:1.6, elem:'ice', status:'freeze', chance:0.15, input:'glyph', glyphs:3, desc:'Ice damage to one enemy. May freeze.' },
  thunder:   { name:'Thunder',       mp:7,  target:'enemies', kind:'mag',  power:8,  mult:1.2, elem:'thunder', brk:12, input:'glyph', glyphs:4, desc:'Lightning strikes every enemy. Good for Break.' },
  frostbind: { name:'Frostbind',     mp:10, target:'enemy',   kind:'mag',  power:14, mult:1.5, elem:'ice', status:'freeze', chance:0.8, input:'glyph', glyphs:4, desc:'Lock one enemy in ice. Frozen foes lose their turn.' },
  firestorm: { name:'Firestorm',     mp:14, target:'enemies', kind:'mag',  power:18, mult:1.6, elem:'fire', status:'burn', chance:0.35, input:'glyph', glyphs:5, desc:'A wall of flame over every enemy.' },
  heal:      { name:'Heal',          mp:5,  target:'ally',    kind:'heal', power:30, scale:2.2, desc:'Restore HP to one ally.' },
  healall:   { name:'Heal All',      mp:12, target:'allies',  kind:'heal', power:24, scale:1.6, desc:'Restore HP to the whole party.' },
  meteor:    { name:'Meteor',        mp:22, target:'enemies', kind:'mag',  power:30, mult:2.2, elem:'fire', brk:24, input:'glyph', glyphs:6, desc:'Call down burning stone on every enemy.' },
  bash:      { name:'Shield Bash',   mp:3,  target:'enemy',   kind:'phys', mult:1.4, stun:0.4, brk:22, desc:'Hit with the shield. May stun.' },
  taunt:     { name:'Taunt',         mp:3,  target:'self',    kind:'buff', status:'taunt', turns:3, desc:'Draw enemy attacks for 3 turns.' },
  cleave:    { name:'Cleave',        mp:6,  target:'enemies', kind:'phys', mult:1.1, desc:'A wide axe swing across every enemy.' },
  ironwill:  { name:'Iron Will',     mp:8,  target:'allies',  kind:'buff', status:'shield', turns:3, desc:'Raise the party\'s defence for 3 turns.' },
  quickcut:  { name:'Quick Cut',     mp:2,  target:'enemy',   kind:'phys', mult:1.3, first:true, desc:'A fast cut that always goes first.' },
  cover:     { name:'Cover',         mp:3,  target:'self',    kind:'buff', status:'cover', turns:2, desc:'Step in front of whoever is hurt most.' },
  valiant:   { name:'Valiant Charge',mp:10, target:'enemy',   kind:'phys', mult:2.4, brk:30, desc:'Everything she has, in one charge.' },
  steal:     { name:'Steal',         mp:0,  target:'enemy',   kind:'steal', desc:'Lift an item or coin from an enemy.' },
  venom:     { name:'Venom Edge',    mp:4,  target:'enemy',   kind:'phys', mult:1.0, status:'poison', chance:0.85, desc:'A poisoned cut.' },
  backstab:  { name:'Backstab',      mp:6,  target:'enemy',   kind:'phys', mult:1.6, crit:0.5, brokenBonus:1.6, desc:'Deadly against a Broken enemy.' },
  smoke:     { name:'Smoke Bomb',    mp:6,  target:'allies',  kind:'buff', status:'evade', turns:2, desc:'Enemies may lose sight of the party for 2 turns.' },
  fanstorm:  { name:'Fan of Knives', mp:12, target:'enemies', kind:'phys', mult:1.3, status:'poison', chance:0.4, desc:'Blades in every direction.' },
  cure:      { name:'Cure',          mp:3,  target:'ally',    kind:'cure', desc:'Remove poison, burn, freeze and weakness from one ally.' },
  raise:     { name:'Raise',         mp:10, target:'dead',    kind:'raise', desc:'Bring a fallen ally back with half their HP.' },
  sanctus:   { name:'Sanctus',       mp:6,  target:'enemy',   kind:'mag',  power:14, mult:1.4, elem:'holy', desc:'Holy light. Devastating against demons.' },
  regen:     { name:'Regen',         mp:7,  target:'allies',  kind:'buff', status:'regen', turns:4, desc:'The party slowly recovers HP for 4 turns.' },
  judgement: { name:'Judgement',     mp:20, target:'enemies', kind:'mag',  power:30, mult:2.0, elem:'holy', desc:'The Dawn\'s verdict on every enemy.' },
  aimed:     { name:'Aimed Shot',    mp:3,  target:'enemy',   kind:'phys', mult:1.7, pierce:true, brk:26, desc:'A careful shot that ignores armour and cracks guard.' },
  mark:      { name:'Hunter\'s Mark',mp:2,  target:'enemy',   kind:'debuff', status:'marked', turns:3, desc:'Marked enemies take 30% more damage and Break faster.' },
  volley:    { name:'Volley',        mp:6,  target:'enemies', kind:'phys', mult:0.9, hits:2, desc:'Two arrows into everything.' },
  pin:       { name:'Pinning Shot',  mp:5,  target:'enemy',   kind:'phys', mult:1.2, stun:0.6, desc:'Pin an enemy in place. Likely to stun.' },
  skypierce: { name:'Sky Piercer',   mp:10, target:'enemy',   kind:'phys', mult:3.0, pierce:true, brk:50, desc:'One arrow, fired straight up, that comes down like judgement.' },
  ashblade:  { name:'Ashblade',      mp:0, hpCost:0.08, target:'enemy', kind:'phys', mult:2.1, elem:'dark', brk:22, desc:'Costs 8% of Varek\'s HP. Burning dark steel.' },
  soulrend:  { name:'Soulrend',      mp:0, hpCost:0.05, target:'enemy', kind:'phys', mult:1.4, elem:'dark', drain:true, desc:'Costs 5% HP, then drinks it back.' },
  dread:     { name:'Dread',         mp:6,  target:'enemies', kind:'debuff', status:'weak', turns:3, desc:'Every enemy loses its nerve: attack down for 3 turns.' },
  hellfire:  { name:'Hellfire',      mp:0, hpCost:0.15, target:'enemies', kind:'mag', power:26, mult:1.8, elem:'dark', desc:'Costs 15% HP. The fire of the Wastes.' },
  // Resolve techniques (use the whole Resolve gauge, no MP)
  crossingB: { name:'Last Crossing', mp:0, target:'enemies', kind:'phys', mult:2.8, pierce:true, fx:'crossing', brk:60, desc:'The moment you died, given an edge.' },
  crossingM: { name:'Last Crossing', mp:0, target:'enemies', kind:'mag',  power:34, mult:2.4, fx:'crossing', brk:60, desc:'The light you saw before the dark.' },
  crossingH: { name:'Last Crossing', mp:0, target:'enemies', kind:'hybrid', mult:2.5, fx:'crossing', brk:60, desc:'Blade and light, from the moment between worlds.' },
  t_wren:    { name:'Oath of Valen', mp:0, target:'enemies', kind:'phys', mult:2.2, brk:40, healParty:0.2, desc:'Two blades, one promise. Hits all and heals the party.' },
  t_lyra:    { name:'Starfall',      mp:0, target:'enemies', kind:'mag',  power:40, mult:2.6, elem:'thunder', brk:40, desc:'Your power poured through Lyra\'s spell.' },
  t_garrick: { name:'Anvil Breaker', mp:0, target:'enemy',   kind:'phys', mult:4.5, pierce:true, brk:999, desc:'He throws, you strike. Instantly Breaks.' },
  t_sable:   { name:'Twin Fang',     mp:0, target:'enemy',   kind:'phys', mult:1.2, hits:5, crit:1, desc:'Five hits, every one a critical.' },
  t_oswin:   { name:'Sanctuary',     mp:0, target:'allies',  kind:'sanctuary', desc:'Full heal, cure, raise and regen for the whole party.' },
  t_kestrel: { name:'Arrow Storm',   mp:0, target:'enemies', kind:'phys', mult:0.9, hits:6, brk:60, desc:'A sky full of arrows. Massive Break.' },
  t_varek:   { name:'Ashen Pact',    mp:0, target:'enemies', kind:'mag',  power:50, mult:3.0, elem:'dark', selfCost:0.1, desc:'Borrowed fire from the Wastes. Costs you 10% HP.' },
  // enemy skills (charge: true = spends a turn winding up; you can see it coming)
  bite:      { name:'Bite',        target:'enemy',   kind:'phys', mult:1.4 },
  smash:     { name:'Smash',       target:'enemy',   kind:'phys', mult:1.6 },
  crush:     { name:'Crushing Blow', target:'enemy', kind:'phys', mult:2.6, charge:true },
  quake:     { name:'Quake',       target:'enemies', kind:'phys', mult:1.2, charge:true },
  drain:     { name:'Life Drain',  target:'enemy',   kind:'mag',  power:10, mult:1.0, drain:true },
  icebolt:   { name:'Ice Bolt',    target:'enemy',   kind:'mag',  power:8,  mult:1.3, elem:'ice' },
  firebolt:  { name:'Fire Bolt',   target:'enemy',   kind:'mag',  power:10, mult:1.3, elem:'fire', status:'burn', chance:0.25 },
  firebreath:{ name:'Fire Breath', target:'enemies', kind:'mag',  power:8,  mult:1.0, elem:'fire' },
  darkflame: { name:'Ashfire',     target:'enemies', kind:'mag',  power:24, mult:1.3, elem:'dark', charge:true },
  cleaveE:   { name:'Abyss Cleave',target:'enemies', kind:'phys', mult:1.0 },
  feint:     { name:'Feint',       target:'enemy',   kind:'phys', mult:1.1 },
  poisonfang:{ name:'Venom Fang',  target:'enemy',   kind:'phys', mult:1.1, status:'poison', chance:0.6 },
  web:       { name:'Web',         target:'enemy',   kind:'phys', mult:0.5, status:'slow', chance:0.9 },
  howl:      { name:'Howl',        target:'self',    kind:'ebuff', status:'rage', turns:3 },
  guardup:   { name:'Brace',       target:'self',    kind:'ebuff', status:'guard', turns:2 },
  mend:      { name:'Mend',        target:'ally',    kind:'eheal', power:30 },
  pilfer:    { name:'Pilfer',      target:'enemy',   kind:'phys', mult:0.8, steal:true },
  wail:      { name:'Wail',        target:'enemies', kind:'mag',  power:6, mult:0.8, status:'weak', chance:0.4 },
  blind:     { name:'Sand Throw',  target:'enemy',   kind:'phys', mult:0.4, status:'blind', chance:0.8 },
  lunge:     { name:'Lunging Thrust', target:'enemy', kind:'phys', mult:1.3 }
};

// ---------------------------------------------------------------- enemies
// ai: list of behaviours. demon: Ashborn (affected by the ending). brk: break gauge size.
const ENEMIES = {
  kendo:   { name:'Daichi',      spr:'daichi',  hp:40,  atk:6,  def:2,  mag:0,  spd:5,  xp:0,   gold:0, skills:['feint'], human:true, brk:40, wpn:'shinai' },
  swordmaster:{ name:'Master Corwin', spr:'swordmaster', hp:120, atk:5, def:3, mag:0, spd:5, xp:0, gold:0, skills:['lunge','crush'], human:true, brk:60, wpn:'wsword' },
  ywolf:   { name:'Grey Wolf',   spr:'wolf',    hp:34,  atk:6,  def:2,  mag:0,  spd:7,  xp:10,  gold:0, weak:'fire', skills:['bite','howl'] },
  slime:   { name:'Slime',       spr:'slime',   hp:16,  atk:7,  def:2,  mag:0,  spd:3,  xp:5,   gold:4,  weak:'fire', ai:['split'] },
  bat:     { name:'Bat',         spr:'bat',     hp:12,  atk:7,  def:1,  mag:0,  spd:10, xp:5,   gold:3,  weak:'thunder' },
  wolf:    { name:'Wolf',        spr:'wolf',    hp:24,  atk:10, def:3,  mag:0,  spd:8,  xp:8,   gold:6,  weak:'fire', skills:['bite','howl'] },
  spider:  { name:'Thornback Spider', spr:'spider', hp:30, atk:11, def:4, mag:0, spd:7, xp:10, gold:7, weak:'fire', skills:['poisonfang','web'] },
  goblin:  { name:'Goblin',      spr:'goblin',  hp:28,  atk:11, def:4,  mag:0,  spd:5,  xp:9,   gold:10, skills:['pilfer','blind'] },
  chief:   { name:'Goblin Chief',spr:'chief',   hp:180, atk:15, def:6,  mag:0,  spd:5,  xp:60,  gold:100, boss:true, skills:['smash','crush','howl'], brk:90 },
  duel:    { name:'Garrick',     spr:'garrick', hp:260, atk:17, def:12, mag:0,  spd:4,  xp:40,  gold:0,  skills:['smash','crush','guardup'], human:true, brk:120, wpn:'axe1' },
  bandit:  { name:'Road Bandit', spr:'bandit',  hp:34,  atk:12, def:4,  mag:0,  spd:8,  xp:12,  gold:18, skills:['feint','blind','pilfer'], human:true, wpn:'isword' },
  banditboss:{ name:'Rafe the Red', spr:'banditboss', hp:120, atk:17, def:7, mag:0, spd:7, xp:50, gold:80, skills:['crush','howl'], human:true, elite:true, brk:80, wpn:'axe2' },
  thug:    { name:'Gutter Thug', spr:'thug',    hp:40,  atk:13, def:5,  mag:0,  spd:6,  xp:14,  gold:12, skills:['smash','guardup'], human:true, wpn:'mace1' },
  sableE:  { name:'Sable',       spr:'sable',   hp:110, atk:12, def:4,  mag:0,  spd:14, xp:30,  gold:0,  skills:['feint','blind','pilfer'], human:true, brk:60, wpn:'dagger1' },
  poacher: { name:'Poacher',     spr:'poacher', hp:42,  atk:14, def:5,  mag:0,  spd:9,  xp:16,  gold:14, skills:['feint','blind'], human:true, wpn:'bow1' },
  wisp:    { name:'Mill Wisp',   spr:'wisp',    hp:26,  atk:4,  def:2,  mag:12, spd:9,  xp:12,  gold:5,  weak:'holy', resist:'ice', skills:['wail','drain'] },
  treant:  { name:'Old Thorn',   spr:'treant',  hp:160, atk:18, def:10, mag:6,  spd:3,  xp:70,  gold:40, weak:'fire', skills:['crush','quake','mend'], elite:true, brk:100 },
  bandit2: { name:'Border Raider',spr:'bandit', hp:70,  atk:24, def:10, mag:0,  spd:9,  xp:48,  gold:30, skills:['feint','blind'], human:true, wpn:'isword' },
  skeleton:{ name:'Skeleton',    spr:'skeleton',hp:46,  atk:18, def:9,  mag:0,  spd:6,  xp:24,  gold:14, weak:'holy', resist:'ice', skills:['guardup'] },
  cavebat: { name:'Cave Bat',    spr:'cavebat', hp:30,  atk:15, def:5,  mag:10, spd:13, xp:20,  gold:9,  weak:'thunder', skills:['drain'] },
  bslime:  { name:'Frost Slime', spr:'bslime',  hp:42,  atk:14, def:8,  mag:15, spd:4,  xp:22,  gold:12, weak:'fire', resist:'ice', skills:['icebolt'], ai:['split'] },
  golem:   { name:'The Warden',  spr:'golem',   hp:520, atk:26, def:18, mag:0,  spd:3,  xp:300, gold:300, boss:true, weak:'thunder', resist:'fire', skills:['smash','quake','crush','guardup'], brk:160 },
  orc:     { name:'Ashborn Brute',spr:'orc',    hp:95,  atk:30, def:15, mag:0,  spd:6,  xp:70,  gold:35, skills:['smash','crush'], demon:true, weak:'holy' },
  rslime:  { name:'Magma Slime', spr:'rslime',  hp:68,  atk:22, def:12, mag:28, spd:5,  xp:62,  gold:28, weak:'ice', resist:'fire', skills:['firebreath'], ai:['split'] },
  swolf:   { name:'Shadow Wolf', spr:'swolf',   hp:78,  atk:32, def:12, mag:0,  spd:15, xp:72,  gold:30, weak:'fire', skills:['bite','howl'] },
  dknight: { name:'Ashborn Knight',spr:'dknight',hp:130,atk:38, def:22, mag:22, spd:9,  xp:115, gold:55, weak:'holy', skills:['smash','darkflame','guardup'], demon:true },
  imp:     { name:'Ashborn Imp', spr:'imp',     hp:62,  atk:20, def:10, mag:34, spd:14, xp:95,  gold:40, weak:'ice', skills:['firebolt','mend'], demon:true, ai:['healer'] },
  king:    { name:'Malgrath',    spr:'demonking',hp:2000, atk:58, def:30, mag:52, spd:12, xp:0, gold:0, boss:true, king:true, skills:['darkflame','drain','smash','cleaveE','crush'], demon:true, brk:260 }
};

// ---------------------------------------------------------------- items
// weapons: sword staff axe dagger bow mace. armour: light heavy robe.
// look = what the wearer's clothes look like (style + colours)
const ITEMS = {
  onigiri: { name:'Onigiri',      type:'use', price:150, heal:40,  target:'ally', desc:'A rice ball from the konbini. Restores 40 HP. It tastes like a life you had.' },
  potion:  { name:'Potion',       type:'use', price:25,  heal:60,  target:'ally', desc:'Restores 60 HP.' },
  hipotion:{ name:'Hi-Potion',    type:'use', price:90,  heal:200, target:'ally', desc:'Restores 200 HP.' },
  mega:    { name:'Mega Potion',  type:'use', price:320, heal:180, target:'allies', desc:'Restores 180 HP to the whole party.' },
  elixir:  { name:'Elixir',       type:'use', price:900, heal:9999, mpheal:9999, target:'ally', desc:'Fully restores one ally\'s HP and MP.' },
  ether:   { name:'Ether',        type:'use', price:80,  mpheal:30, target:'ally', desc:'Restores 30 MP.' },
  hiether: { name:'Hi-Ether',     type:'use', price:260, mpheal:90, target:'ally', desc:'Restores 90 MP.' },
  phoenix: { name:'Phoenix Down', type:'use', price:150, revive:0.5, target:'dead', desc:'Revives a fallen ally with half HP.' },
  antidote:{ name:'Remedy',       type:'use', price:20,  cure:true, target:'ally', desc:'Cures poison, burn, freeze, blindness and weakness.' },
  bomb:    { name:'Fire Bomb',    type:'use', price:60,  dmg:60, elem:'fire', target:'enemies', battleOnly:true, desc:'Deals 60 fire damage to all enemies.' },
  tonic:   { name:'Resolve Tonic',type:'use', price:200, resolve:50, target:'self', battleOnly:true, desc:'Bitter and bracing. Fills the Resolve gauge by half.' },
  cake:    { name:'Birthday Cake',type:'key', price:1200, desc:'Strawberry shortcake with "Happy 13th, Mei" piped in pink. For your sister.' },
  grimoire:{ name:'Lyra\'s Grimoire', type:'key', price:0, desc:'A leather-bound spellbook. The goblins tore the clasp off.' },
  dawnstone:{ name:'Dawnstone',  type:'key', price:0, desc:'A pale stone taken from the Warden. It hums when you carry it east. The Rift opens for it.' },
  writ:    { name:'Royal Writ',   type:'key', price:0, desc:'Sealed by King Aurel III. Grants House Valen\'s heir passage on every road in Eldoria.' },
  locket:  { name:'Tin Locket',   type:'key', price:0, desc:'A dented locket. Inside, a pressed flower and the name "Elsie".' },
  moonpetal:{ name:'Moonpetal',   type:'key', price:0, desc:'A pale flower that glows faintly. Brother Oswin needs these for the fever.' },
  letter:  { name:'Unsent Letter',type:'key', price:0, desc:'A letter home to your mother. You keep meaning to finish it.' },
  // weapons
  stick:   { name:'Practice Stick', type:'weapon', kind:'sword', atk:0, price:0, desc:'An ash stick wrapped in cloth. For children.' },
  shinai:  { name:'Shinai',         type:'weapon', kind:'sword', atk:1, price:0, desc:'A bamboo practice sword.' },
  wsword:  { name:'Wooden Sword',   type:'weapon', kind:'sword', atk:2, price:10, desc:'A training sword.' },
  valensword:{ name:'Valen Longsword', type:'weapon', kind:'sword', atk:6, price:120, desc:'Your house\'s crest is etched above the guard. Your father\'s first sword.' },
  isword:  { name:'Iron Sword',     type:'weapon', kind:'sword', atk:7, price:130, desc:'A dependable iron blade.' },
  ssword:  { name:'Steel Blade',    type:'weapon', kind:'sword', atk:14, price:480, desc:'Dwarf-forged steel.' },
  msword:  { name:'Mythril Edge',   type:'weapon', kind:'sword', atk:23, price:1500, desc:'Light, keen, and old.' },
  otherblade:{ name:'Blade of the Other Shore', type:'weapon', kind:'sword', atk:36, mag:8, price:4000, desc:'Forged around a fragment of your old world. It hums like distant traffic.' },
  wand:    { name:'Birch Wand',     type:'weapon', kind:'staff', atk:1, mag:3, price:10, desc:'A simple focus for a new caster.' },
  valenstaff:{ name:'Valen Rod',    type:'weapon', kind:'staff', atk:2, mag:6, price:120, desc:'Your mother\'s rod. The sapphire is the colour of House Valen.' },
  ostaff:  { name:'Oak Staff',      type:'weapon', kind:'staff', atk:1, mag:3, price:10, desc:'A plain travelling staff.' },
  rstaff:  { name:'Ruby Staff',     type:'weapon', kind:'staff', atk:3, mag:9, price:420, desc:'A ruby hums inside the wood.' },
  astaff:  { name:'Archmage Staff', type:'weapon', kind:'staff', atk:5, mag:16, price:1450, desc:'Staff of the old elven archmages.' },
  otherstaff:{ name:'Staff of the Other Shore', type:'weapon', kind:'staff', atk:8, mag:30, price:4000, desc:'Crowned with glass from a world that isn\'t this one.' },
  axe1:    { name:'Hand Axe',       type:'weapon', kind:'axe', atk:5, price:10, desc:'Garrick\'s old axe. Nicked and well loved.' },
  axe2:    { name:'War Axe',        type:'weapon', kind:'axe', atk:14, price:520, desc:'A proper dwarven war axe.' },
  axe3:    { name:'Rune Hammer',    type:'weapon', kind:'axe', atk:25, price:1550, desc:'Runes flare when it strikes.' },
  dagger1: { name:'Alley Knife',    type:'weapon', kind:'dagger', atk:5, price:40, desc:'Sharp enough. Stolen, probably.' },
  dagger2: { name:'Stiletto',       type:'weapon', kind:'dagger', atk:12, price:450, desc:'Thin as a secret.' },
  dagger3: { name:'Nightfang',      type:'weapon', kind:'dagger', atk:21, price:1400, desc:'The edge drinks light.' },
  bow1:    { name:'Hunting Bow',    type:'weapon', kind:'bow', atk:6, price:60, desc:'Fernhollow yew.' },
  bow2:    { name:'Longbow',        type:'weapon', kind:'bow', atk:14, price:500, desc:'Taller than a dwarf.' },
  bow3:    { name:'Windpiercer',    type:'weapon', kind:'bow', atk:24, price:1500, desc:'The string sings.' },
  mace1:   { name:'Pilgrim\'s Mace',type:'weapon', kind:'mace', atk:3, mag:3, price:40, desc:'Blessed iron.' },
  mace2:   { name:'Dawn Hammer',    type:'weapon', kind:'mace', atk:9, mag:8, price:480, desc:'Warm to the touch.' },
  mace3:   { name:'Sunflail',       type:'weapon', kind:'mace', atk:16, mag:14, price:1450, desc:'It glows at the sight of ash.' },
  gsword1: { name:'Deserter\'s Blade', type:'weapon', kind:'greatsword', atk:14, price:0, desc:'Varek\'s Ashborn issue greatsword. He filed the crest off.' },
  gsword2: { name:'Cinderbrand',    type:'weapon', kind:'greatsword', atk:26, price:1600, desc:'Black iron from Vharn\'s forges.' },
  // armour — look.style changes the wearer's clothes
  childclothes:{ name:'Nursery Clothes', type:'armor', kind:'light', def:0, price:0, desc:'Soft wool, embroidered with the Valen crest.', look:{ style:'tunic', c:'#6a8ac8', d:'#4a6aa8', t:'#e8c870', p:'#4a4a6a', b:'#3a2a1a' } },
  uniform: { name:'School Uniform', type:'armor', kind:'light', def:2, price:10, desc:'Your uniform from Seiryo High.', look:{ style:'uniform', c:'#2b3a67', d:'#1b2440', t:'#b83a4a', p:'#1b2440', b:'#1a1418' } },
  noble:   { name:'Valen Noble Garb', type:'armor', kind:'light', def:3, price:80, desc:'Deep blue with gold thread. Everyone knows whose child you are.', look:{ style:'noble', c:'#2e3f82', d:'#1e2a5a', t:'#e0b84a', p:'#1e2a5a', b:'#1a1010', n:'#8a1e2a' } },
  tunic:   { name:'Travel Clothes', type:'armor', kind:'light', def:1, price:10, desc:'Basic travelling gear.', look:{ style:'tunic', c:'#6a5a3a', d:'#4a3e24', t:'#a8884a', p:'#4a3e30', b:'#2a1e14' } },
  squire:  { name:'Squire\'s Tabard', type:'armor', kind:'light', def:4, price:70, desc:'Valen blue over padded cloth.', look:{ style:'tunic', c:'#3a5aa8', d:'#24407a', t:'#e0b84a', p:'#4a3e30', b:'#2a1e14' } },
  leather: { name:'Leather Armor',  type:'armor', kind:'light', def:5, price:90, desc:'Light leather armour.', look:{ style:'leather', c:'#7a4e2a', d:'#54321a', t:'#c8a86a', p:'#4a3a2a', b:'#2a1a10' } },
  rogue:   { name:'Shadow Leathers',type:'armor', kind:'light', def:6, price:260, desc:'Dyed black and oiled quiet.', look:{ style:'rogue', c:'#2a2430', d:'#1a1620', t:'#a8322e', p:'#1a1620', b:'#0e0a10', n:'#a8322e' } },
  ranger:  { name:'Ranger\'s Coat', type:'armor', kind:'light', def:7, price:300, desc:'Waxed green wool with a hundred pockets.', look:{ style:'ranger', c:'#4a6a3a', d:'#2e4a24', t:'#8a6a3a', p:'#4a3a2a', b:'#2a1a10' } },
  robe:    { name:'Mage Robe',      type:'armor', kind:'robe', def:6, mag:4, price:320, desc:'Woven with focusing thread.', look:{ style:'robe', c:'#3a3a8a', d:'#24245a', t:'#c8b060', p:'#24245a', b:'#1a1030' } },
  vestment:{ name:'Dawn Vestment',  type:'armor', kind:'robe', def:5, mag:3, price:200, desc:'White linen and a gold sun.', look:{ style:'robe', c:'#e8e0d0', d:'#b8a890', t:'#d8a840', p:'#b8a890', b:'#5a4a3a' } },
  elfrobe: { name:'Elven Mantle',   type:'armor', kind:'robe', def:4, mag:5, price:280, desc:'Leaf-green, light as breath.', look:{ style:'robe', c:'#2f7a58', d:'#1f5a3e', t:'#c8a86a', p:'#1f5a3e', b:'#4a3020' } },
  chain:   { name:'Chain Mail',     type:'armor', kind:'heavy', def:11, price:420, desc:'Rings of dwarven steel.', look:{ style:'chain', c:'#9aa0aa', d:'#6a707a', t:'#3a5aa8', p:'#4a4a5a', b:'#2a2a33' } },
  ashmail: { name:'Ashborn Plate',  type:'armor', kind:'heavy', def:14, price:0, desc:'Black plate from the Vharn armoury. Varek never talks about how he got it.', look:{ style:'plate', c:'#3a2e3a', d:'#241c24', t:'#8a2a2a', p:'#241c24', b:'#120a10' } },
  star:    { name:'Starlight Robe', type:'armor', kind:'robe', def:13, mag:9, price:1500, desc:'Glows faintly in the dark.', look:{ style:'robe', c:'#2a2a5a', d:'#1a1a3a', t:'#bfe6ff', p:'#1a1a3a', b:'#0a0a1a', star:true } },
  steel:   { name:'Steel Plate',    type:'armor', kind:'heavy', def:16, price:980, desc:'Full plate. Loud, heavy, safe.', look:{ style:'plate', c:'#b8bcc8', d:'#7a7e8a', t:'#3a5aa8', p:'#7a7e8a', b:'#3a3a44' } },
  dragon:  { name:'Dragon Mail',    type:'armor', kind:'heavy', def:20, price:1650, desc:'Scales of a long-dead dragon.', look:{ style:'plate', c:'#8a2a2a', d:'#5a1818', t:'#e0b84a', p:'#5a1818', b:'#2a0e0e' } }
};

const SHOPS = {
  konbini:  ['onigiri', 'cake'],
  valenford:['potion','antidote','ether','leather','isword','wand','mace1','bow1'],
  brookvale:['potion','antidote','ether','bomb','leather','vestment','mace1','dagger1'],
  village:  ['potion','antidote','ether','bomb','isword','wand','leather','elfrobe'],
  solmere:  ['potion','hipotion','antidote','ether','phoenix','bomb','tonic','ssword','rstaff','dagger2','bow2','mace2','chain','robe','rogue'],
  fernhollow:['potion','antidote','ether','bow1','bow2','ranger','leather','dagger1'],
  ironhold: ['potion','hipotion','ether','phoenix','bomb','ssword','rstaff','axe2','chain','robe','steel','mace2'],
  camp:     ['hipotion','mega','hiether','phoenix','bomb','tonic','msword','astaff','axe3','dagger3','bow3','mace3','gsword2','dragon','star'],
  ember:    ['hipotion','hiether','elixir','phoenix','tonic','astaff','star','gsword2']
};

// loot ladders: introverts find the next item up, extroverts find more of the one below
const LOOT_UP = { onigiri:'potion', potion:'hipotion', hipotion:'mega', mega:'elixir', ether:'hiether', hiether:'elixir', bomb:'bomb', phoenix:'phoenix', antidote:'potion', tonic:'tonic' };
const LOOT_DOWN = { elixir:'mega', mega:'hipotion', hipotion:'potion', potion:'potion', hiether:'ether', ether:'ether', bomb:'bomb', phoenix:'potion', antidote:'antidote', tonic:'ether' };
const DROP_TABLE = {
  1: ['potion', 'potion', 'ether', 'bomb', 'antidote'],
  2: ['hipotion', 'ether', 'phoenix', 'bomb', 'antidote'],
  3: ['hipotion', 'mega', 'hiether', 'phoenix', 'tonic'],
  4: ['mega', 'hiether', 'elixir', 'phoenix', 'tonic']
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
  cradle: { bpm: 66, ch: [
    { w:'sine', v:0.09, n:'G5 - E5 - F5 - D5 - E5 - C5 - D5 - - - G5 - E5 - F5 - D5 - C5 - - - - - - -' },
    { w:'triangle', v:0.1, n:'C3 - G3 - A2 - E3 - F2 - C3 - G2 - D3 -' }
  ]},
  manor: { bpm: 92, ch: [
    { w:'square', v:0.05, n:'D5 - F#5 - A5 - G5 F#5 E5 - D5 - C#5 - A4 - B4 - D5 - G5 - F#5 E5 D5 - E5 - F#5 - - -' },
    { w:'triangle', v:0.15, n:'D3 . A3 . G2 . D3 . E2 . B2 . A2 . C#3 . D3 . A2 . G2 . D3 . A2 . E3 . D3 . A2 .' },
    { w:'sine', v:0.03, n:'F#4 A4 D5 A4 G4 B4 D5 B4 E4 G4 B4 G4 A4 C#5 E5 C#5' }
  ]},
  night: { bpm: 76, ch: [
    { w:'sine', v:0.08, n:'A4 - - C5 B4 - - E4 A4 - - C5 D5 - - - C5 - B4 - A4 - G#4 - A4 - - - . . . .' },
    { w:'triangle', v:0.15, n:'A2 - E3 - F2 - C3 - D2 - A2 - E2 - B2 -' }
  ]},
  training: { bpm: 132, ch: [
    { w:'square', v:0.055, n:'G4 . G4 B4 D5 . B4 . C5 . A4 . G4 - - . G4 . G4 B4 D5 . G5 . F#5 . D5 . E5 - - .' },
    { w:'triangle', v:0.16, n:'G2 G2 D3 D3 G2 G2 D3 D3 C3 C3 G2 G2 D3 D3 D2 D2' },
    { w:'noise', v:0.025, n:'x . x . x x x .' }
  ]},
  village: { bpm: 108, ch: [
    { w:'square', v:0.06, n:'A4 C5 F5 - E5 D5 C5 - A4 C5 D5 - C5 A4 G4 - A4 C5 F5 - G5 A5 G5 F5 E5 D5 C5 - F5 - - .' },
    { w:'triangle', v:0.16, n:'F2 . C3 . F2 . C3 . A#2 . F3 . C3 . G2 . F2 . C3 . A#2 . C3 . F2 . C3 .' },
    { w:'noise', v:0.015, n:'x . . . x . . .' }
  ]},
  capital: { bpm: 116, ch: [
    { w:'square', v:0.055, n:'C5 - E5 G5 C6 - B5 A5 G5 - E5 - F5 - A5 - G5 - E5 C5 D5 - G4 - C5 - E5 - D5 - - .' },
    { w:'triangle', v:0.16, n:'C3 . G2 . C3 . G2 . F2 . C3 . G2 . D3 . C3 . G2 . F2 . G2 . C3 . G2 .' },
    { w:'square', v:0.02, n:'E4 G4 C5 G4 F4 A4 C5 A4 D4 G4 B4 G4 E4 G4 C5 G4' },
    { w:'noise', v:0.02, n:'x . . x x . x .' }
  ]},
  travel: { bpm: 120, ch: [
    { w:'square', v:0.055, n:'E5 - D5 C5 D5 - G4 - A4 - C5 - D5 - - . E5 - G5 E5 D5 - C5 - A4 - G4 - A4 - - .' },
    { w:'triangle', v:0.16, n:'A2 . E3 . F2 . C3 . G2 . D3 . A2 . E3 . F2 . C3 . G2 . D3 . A2 . A2 .' },
    { w:'noise', v:0.02, n:'x . x . x . x x' }
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
  portal: { bpm: 60, ch: [
    { w:'sawtooth', v:0.025, n:'E4 - - - F4 - - - E4 - - - D#4 - - -' },
    { w:'sine', v:0.07, n:'B5 - - - - - - - C6 - - - - - - - A5 - - - - - - - B5 - - - - - - -' },
    { w:'triangle', v:0.16, n:'E2 - - - - - - - F2 - - - - - - -' }
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

// give every item its own id (used by canEquip and menus)
for (const k in ITEMS) ITEMS[k].id = k;
