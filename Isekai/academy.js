// =====================================================================
//  academy.js : the school years. After the mill, the Valen child is sent
//  to the Aurelian Academy in Solmere to train as a Blade, a Spellcaster
//  or both. First year: lessons, a rival, three friends and a sealed
//  vault. Then four years pass, and in senior year the orders come.
// =====================================================================

// ---------------------------------------------------------------- people, gear, monsters
Object.assign(CHARS, {
  headmistress: { pal: { h: '#e8e0d0', s: SK2, c: '#6a1e2e', d: '#4a1420', t: '#e0b84a', p: '#4a1420', b: '#1a1010', n: '#e0b84a' }, hair: 'bun', outfit: 'robe', mods: ['girl'] },
  dorran:   { pal: { h: '#3a2a1a', s: SK4, c: '#8a93a6', d: '#5b6377', t: '#6a1e2e', p: '#454b5a', b: '#2a2a33' }, hair: 'buzz', outfit: 'plate', mods: ['beard'] },
  oriel:    { pal: { h: '#16121c', s: SK5, c: '#2a3a7a', d: '#1a2452', t: '#bfe6ff', p: '#1a2452', b: '#0a0a1a' }, hair: 'locs', outfit: 'robe', mods: ['girl'] },
  lucan:    { pal: { h: '#f0dc8a', s: SK, c: '#6a1e2e', d: '#4a1420', t: '#e0b84a', p: '#2a2438', b: '#1a1418', n: '#e0b84a' }, hair: 'short', outfit: 'uniform', mods: ['tie'] },
  crony:    { pal: { h: '#5a3a20', s: SK3, c: '#6a1e2e', d: '#4a1420', t: '#e0b84a', p: '#2a2438', b: '#1a1418', n: '#8a8a8a' }, hair: 'buzz', outfit: 'uniform', mods: ['tie', 'stout'] },
  cadet:    { pal: { h: '#16121c', s: SK4, c: '#6a1e2e', d: '#4a1420', t: '#e0b84a', p: '#2a2438', b: '#1a1418', n: '#e0b84a' }, hair: 'twists', outfit: 'uniform', mods: ['tie'] },
  cadetf:   { pal: { h: '#a8502a', s: SK, c: '#6a1e2e', d: '#4a1420', t: '#e0b84a', p: SK, b: '#1a1418', n: '#e0b84a' }, hair: 'ponytail', outfit: 'uniform', mods: ['girl', 'tie', 'skirt'] },
  cadet2:   { pal: { h: '#2a1c16', s: SK2, c: '#6a1e2e', d: '#4a1420', t: '#e0b84a', p: SK2, b: '#1a1418', n: '#e0b84a' }, hair: 'long', outfit: 'uniform', mods: ['girl', 'tie', 'skirt'] },
  brim:     { pal: { h: '#8a8480', s: SK3, c: '#3a3a4a', d: '#26262e', t: '#e0b84a', p: '#26262e', b: '#1a1a22' }, hair: 'short', outfit: 'noble', mods: ['stout', 'beard'] },
  tolly:    { pal: { h: '#c8c4bc', s: SK4, c: '#5a6a3a', d: '#3a4a24', p: '#4a3a2a', b: '#2a1a10' }, hair: 'buzz', outfit: 'ranger', mods: ['beard'] },
  kharn:    { pal: { h: '#1a1216', s: '#6a5a6e', e: '#ff3b3b', c: '#3a2226', d: '#241418', t: '#8a2a2a', p: '#241418', b: '#0e0a0c', n: '#d8d0c0' }, hair: 'buzz', outfit: 'plate', mods: ['horns', 'stout', 'beard', 'tusks'] },
  seris:    { pal: { h: '#e8e0f0', s: '#9a8aae', e: '#ff5050', c: '#2a1030', d: '#5a1020', t: '#e8e0cc', p: '#1a0a20', b: '#0a0510', n: '#e8e0cc' }, hair: 'long', outfit: 'plate', mods: ['girl', 'horns', 'cape'] },
  galen:    { pal: { h: '#c8c4bc', s: SK3, c: '#c8ccd8', d: '#8a90a6', t: '#f2c94c', p: '#454b5a', b: '#2a2a33' }, hair: 'short', outfit: 'plate', mods: ['beard', 'cape'] },
  brask:    { pal: { h: '#16121c', s: SK5, c: '#8a2a2a', d: '#5a1818', t: '#e0b84a', p: '#3a2a22', b: '#1a1210' }, hair: 'buzz', outfit: 'leather', mods: ['stout'] }
});
Object.assign(ITEMS, {
  cadet: { name: 'Academy Uniform', type: 'armor', kind: 'light', def: 3, price: 60, desc: 'Aurelian burgundy and gold. It has never once fitted properly.', look: { style: 'uniform', c: '#6a1e2e', d: '#4a1420', t: '#e0b84a', p: '#2a2438', b: '#1a1418', n: '#e0b84a' } },
  dawnblade: { name: 'Hiroshi\'s Blade', type: 'weapon', kind: 'sword', atk: 28, mag: 6, price: 0, desc: 'A single-edged sword in black lacquer, three hundred years old. The hilt says 広. It rings, faintly, when you draw it.' },
  dawnstaff: { name: 'Hiroshi\'s Ferrule', type: 'weapon', kind: 'staff', atk: 6, mag: 24, price: 0, desc: 'The first hero\'s sword-fitting, set on a rowan staff by the Academy. It rings, faintly, when you raise it.' }
});
Object.assign(MONSTERS, {
  direwolf:  { type: 'wolf', g: '#6a6470', d: '#34303c', r: '#ffe050' },
  inkling:   { type: 'slime', g: '#4a3a7a', d: '#1a1030', w: '#d8c8ff' },
  gargoyle:  { type: 'golem', g: '#7a7a88', d: '#44444f', r: '#e5534b' },
  ashwraith: { type: 'wisp', g: '#8a7a86', d: '#2a1a26', r: '#ff7030' }
});
Object.assign(ENEMIES, {
  lucan:     { name: 'Lucan Ashcombe', spr: 'lucan', hp: 64, atk: 8, def: 3, mag: 4, spd: 7, xp: 20, gold: 0, skills: ['feint', 'lunge'], human: true, brk: 40, wpn: 'isword' },
  crony:     { name: 'Crony', spr: 'crony', hp: 32, atk: 6, def: 2, mag: 0, spd: 5, xp: 8, gold: 4, skills: ['blind'], human: true, wpn: 'wsword' },
  sableKid:  { name: 'Hooded Thief', spr: 'sable', hp: 72, atk: 8, def: 3, mag: 0, spd: 13, xp: 22, gold: 0, skills: ['feint', 'blind', 'pilfer'], human: true, brk: 40, wpn: 'dagger1' },
  greymane:  { name: 'Old Greymane', spr: 'direwolf', hp: 230, atk: 13, def: 5, mag: 0, spd: 9, xp: 110, gold: 60, boss: true, weak: 'fire', skills: ['bite', 'howl', 'crush'], brk: 90 },
  inkling:   { name: 'Inkling', spr: 'inkling', hp: 22, atk: 8, def: 3, mag: 6, spd: 5, xp: 9, gold: 6, weak: 'holy', ai: ['split'] },
  gargoyle:  { name: 'Library Gargoyle', spr: 'gargoyle', hp: 50, atk: 11, def: 9, mag: 0, spd: 3, xp: 18, gold: 12, weak: 'thunder', skills: ['guardup', 'smash'] },
  ashwraith: { name: 'The Ash Wraith', spr: 'ashwraith', hp: 380, atk: 12, def: 6, mag: 15, spd: 8, xp: 260, gold: 150, boss: true, weak: 'holy', resist: 'fire', skills: ['wail', 'drain', 'firebolt', 'darkflame'], brk: 110 },
  kharn:     { name: 'Warlord Kharn', spr: 'kharn', hp: 1150, atk: 40, def: 20, mag: 0, spd: 8, xp: 950, gold: 400, boss: true, demon: true, weak: 'holy', skills: ['smash', 'crush', 'howl', 'guardup', 'quake'], brk: 220, wpn: 'axe3' },
  seris:     { name: 'Seris, First Blade of Vharn', spr: 'seris', hp: 1400, atk: 47, def: 22, mag: 40, spd: 14, xp: 1300, gold: 0, boss: true, demon: true, skills: ['lunge', 'darkflame', 'cleaveE', 'guardup', 'feint'], brk: 240, wpn: 'gsword2' },
  galen:     { name: 'Ser Galen the Unbroken', spr: 'galen', hp: 1600, atk: 50, def: 28, mag: 10, spd: 10, xp: 1400, gold: 0, boss: true, human: true, skills: ['lunge', 'crush', 'guardup', 'smash'], brk: 260, wpn: 'msword' }
});
{
  const mk0 = makeEnemy;
  const SIZE = { greymane: 132, ashwraith: 140, kharn: 136, seris: 124, galen: 120, gargoyle: 104, lucan: 100 };
  makeEnemy = function (g, mapId) { const e = mk0(g, mapId); if (SIZE[e.id]) e.size = SIZE[e.id]; return e; };
}

// ---------------------------------------------------------------- maps
function buildAcademy() {
  const b = MB(46, 34, '.', 777);
  b.border('+', 1);
  b.rect(14, 7, 18, 17, ':');                                  // courtyard
  b.path([[1, 15], [45, 15]], ':');                            // the long avenue, east gate at the end
  b.path([[22, 23], [22, 33]], ':').path([[23, 23], [23, 33]], ':');   // south path to the main gate
  stoneHall(b, 15, 1, 16, 3, 3, [22, 23]);                     // Great Hall
  stoneHall(b, 2, 2, 11, 2, 3, [7]);                           // Blade Hall
  stoneHall(b, 33, 2, 11, 2, 3, [38]);                         // Arcane Hall
  b.path([[7, 7], [7, 15]], ':').path([[38, 7], [38, 15]], ':');
  house(b, 3, 20, 9, 7);                                       // dormitory
  b.path([[7, 23], [7, 25], [12, 25], [12, 15]], ':');
  stoneHall(b, 33, 19, 11, 2, 3, [38]);                        // library
  b.path([[38, 24], [38, 26], [32, 26], [32, 15]], ':');
  // stable yard
  b.rect(10, 27, 11, 6, ';');
  b.rect(10, 27, 11, 1, 'F').rect(10, 32, 11, 1, 'F').rect(10, 27, 1, 6, 'F').rect(20, 27, 1, 6, 'F');
  b.set(20, 29, ';').set(20, 30, ';').set(21, 29, ':').set(21, 30, ':');
  b.set(12, 28, '>').set(18, 28, '>').set(12, 31, '>');
  // the pond behind the library, for anyone with a rod and an afternoon
  b.blob(39, 29, 4, 2, '~', ['.']);
  // courtyard dressing
  b.set(22, 11, '6').set(23, 11, '6');
  b.set(22, 18, '£').set(23, 18, ')');
  for (const [x, y] of [[15, 8], [30, 8], [15, 22], [30, 22]]) b.set(x, y, '@');
  for (const [x, y] of [[14, 10], [14, 12], [31, 10], [31, 12], [14, 18], [31, 18]]) b.set(x, y, '4');
  b.set(16, 8, '|').set(29, 8, '|');
  for (const [x, y] of [[17, 20], [28, 20], [18, 13], [27, 13]]) b.set(x, y, ')');
  b.set(26, 21, '*').set(19, 21, '(');
  b.set(21, 7, 'S');
  b.set(45, 15, ':').set(22, 33, ':').set(23, 33, ':');
  // lawns: trees and flowerbeds, only on open grass
  const r = b.rnd;
  for (let y = 2; y < 33; y++) for (let x = 2; x < 44; x++) {
    if (b.get(x, y) !== '.') continue;
    const nearPath = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ':E]'.includes(b.get(x + dx, y + dy)));
    if (nearPath) { if (r() < 0.18) b.set(x, y, '"'); continue; }
    const v = r();
    if (v < 0.07) b.set(x, y, 'q'); else if (v < 0.12) b.set(x, y, '"'); else if (v < 0.16) b.set(x, y, 'f');
  }
  return b.rows();
}
function roomRows(w, h, fn) { const b = MB(w, h, 'o', 5); b.border('V'); fn(b); return b.rows(); }
const AC_HALL_ROWS = roomRows(22, 12, b => {
  for (const x of [3, 7, 14, 18]) b.set(x, 0, 'y');
  b.rect(1, 1, 3, 1, 'b').rect(18, 1, 3, 1, 'b').set(10, 1, 'z').set(11, 1, 'z');
  b.rect(10, 2, 2, 10, '-');
  for (const y of [4, 7]) { b.rect(2, y, 6, 1, 't'); b.rect(14, y, 6, 1, 't'); b.rect(2, y + 1, 6, 1, 'u'); b.rect(14, y + 1, 6, 1, 'u'); }
  b.set(1, 10, 'k').set(20, 10, 'k').set(10, 11, 'x').set(11, 11, 'x');
});
const AC_BLADE_ROWS = roomRows(16, 10, b => {
  for (const x of [3, 12]) b.set(x, 0, 'y');
  b.rect(2, 1, 4, 1, 'e').rect(10, 1, 4, 1, 'e');
  b.rect(4, 3, 8, 4, '-');
  b.set(1, 8, 'k').set(14, 8, 'k').set(1, 3, 'k').set(14, 3, 'k');
  b.set(7, 9, 'x').set(8, 9, 'x');
});
const AC_ARCANE_ROWS = roomRows(16, 10, b => {
  for (const x of [3, 12]) b.set(x, 0, 'y');
  b.rect(1, 1, 5, 1, 'b').rect(10, 1, 5, 1, 'b');
  b.rect(3, 4, 2, 1, 't').rect(11, 4, 2, 1, 't').set(2, 4, 'u').set(5, 4, 'u').set(10, 4, 'u').set(13, 4, 'u');
  b.set(1, 7, 'e').set(14, 7, 'e').rect(6, 3, 4, 3, '-');
  b.set(7, 9, 'x').set(8, 9, 'x');
});
const AC_DORM_ROWS = roomRows(16, 10, b => {
  for (const x of [3, 12]) b.set(x, 0, 'y');
  for (const x of [1, 3, 5, 10, 12, 14]) { b.set(x, 1, '{'); b.set(x, 2, 'k'); }
  for (const x of [1, 14]) { b.set(x, 5, '{'); b.set(x, 6, 'k'); }
  b.rect(6, 4, 4, 1, 't').set(6, 5, 'u').set(9, 5, 'u');
  b.set(7, 9, 'x').set(8, 9, 'x');
});
const AC_LIB_ROWS = roomRows(18, 12, b => {
  for (const x of [4, 13]) b.set(x, 0, 'y');
  b.rect(1, 1, 14, 1, 'b');
  for (const y of [4, 7]) { b.rect(2, y, 5, 1, 'b'); b.rect(10, y, 5, 1, 'b'); }
  b.set(16, 1, 'G');
  b.rect(7, 9, 3, 1, 't').set(1, 10, 'k').set(16, 10, 'k');
  b.set(8, 11, 'x').set(9, 11, 'x');
});
function buildAcWoods() {
  const b = MB(40, 24, '.', 515);
  b.scatter('T', 0.18).scatter(',', 0.07, ['.']).scatter('f', 0.02, ['.']);
  b.border('T');
  b.path([[0, 12], [18, 12], [18, 6], [34, 6]], '.', 3);
  b.path([[18, 12], [18, 19], [31, 19]], '.', 3);
  b.path([[0, 12], [18, 12], [18, 6], [34, 6]], '=');
  b.blob(34, 6, 4, 3, '.');
  b.blob(8, 19, 3, 2, '.').path([[8, 12], [8, 19]], '.', 1);
  b.blob(26, 14, 3, 2, '~', ['.', ',', 'T', 'f']);
  b.set(33, 4, 'r').set(37, 7, 'r').set(31, 8, 'r');
  b.rect(0, 11, 2, 3, '.').set(0, 12, '=').set(1, 12, '=');
  return b.rows();
}
function buildVault() {
  const b = MB(30, 22, '#', 616);
  b.path([[15, 21], [15, 15], [5, 15], [5, 5], [24, 5], [24, 12]], 'p', 3);
  b.path([[15, 15], [24, 15]], 'p', 3);
  b.blob(24, 16, 4, 3, 'p').blob(5, 5, 3, 2, 'p').blob(15, 10, 3, 2, 'p');
  b.path([[15, 15], [15, 10]], 'p', 1);
  for (const [x, y] of [[4, 11], [6, 11], [21, 15], [27, 15], [22, 18], [26, 18]]) b.set(x, y, 'P');
  b.set(3, 4, 'L').set(7, 4, 'L');
  b.rect(14, 21, 3, 1, 'p');
  return b.rows();
}
Object.assign(MAPS, {
  academy: {
    name: 'The Aurelian Academy', music: 'capital', theme: 'city', edge: '+', fx: 'petals', ambient: 'rgba(255,220,160,.05)', encounters: null,
    rows: buildAcademy(),
    npcs: [
      { id: 'lucanYard', x: 25, y: 16, spr: 'lucan', dir: 'down', script: 'lucanIdle', show: 'ac_lesson&!ac_vaultOpen', wander: 2 },
      { id: 'wrenAc', x: 16, y: 29, spr: 'cadetf', dir: 'down', script: 'wrenAc', show: '!ac_wren', fixed: true },
      { id: 'bully1', x: 15, y: 30, spr: 'crony', dir: 'right', script: 'wrenAc', show: 'ac_lesson&!ac_wren' },
      { id: 'bully2', x: 17, y: 30, spr: 'crony', dir: 'left', script: 'wrenAc', show: 'ac_lesson&!ac_wren' },
      { id: 'tolly', x: 23, y: 26, spr: 'tolly', dir: 'left', script: 'tolly' },
      { id: 'acS1', x: 18, y: 16, spr: 'cadet', dir: 'right', script: 'crowd', name: 'First-year', wander: 2, lines: [`Did you see the size of the Blade Hall? I'm going to die. I'm going to die in there.`, `They say the Sealed Archive hums at night. Lucan says he's going to open it. Lucan says a lot of things.`] },
      { id: 'acS2', x: 27, y: 10, spr: 'cadet2', dir: 'down', script: 'crowd', name: 'Second-year', wander: 1, lines: [`First-years. So small. So loud.`, `The statue is of the first hero. Nobody knows his real name. The plinth just says "He came from nowhere and stayed."`] },
      { id: 'acS3', x: 10, y: 16, spr: 'cadetf', dir: 'down', script: 'crowd', name: 'Squire-cadet', wander: 2, lines: [`Captain Dorran made me run the wall twelve times. Twelve!`, `If you're in the Arcane Hall, don't sit at the back. Magister Oriel throws chalk. With magic.`] },
      { id: 'acS4', x: 35, y: 17, spr: 'student', dir: 'left', script: 'crowd', name: 'Librarian\'s Aide', wander: 1, lines: [`Quiet near the library, please. The books are sleeping. Some of them bite.`] },
      { id: 'acS5', x: 29, y: 24, spr: 'kid2', dir: 'down', script: 'crowd', name: 'Kitchen Boy', wander: 2, lines: [`Somebody's nicking bread from the kitchens every night. Brim thinks it's me. It's not me. Mostly.`] },
      { id: 'acCat', x: 20, y: 9, spr: 'pet:cat', dir: 'left', script: 'critter', wander: 3 },
      { id: 'acHorse', x: 14, y: 30, spr: 'pet:goat', dir: 'right', script: 'critter', wander: 1 }
    ],
    warps: [
      { x: 22, y: 6, w: 2, h: 1, to: 'ac_hall', tx: 10, ty: 10, dir: 'up' },
      { x: 7, y: 6, w: 1, h: 1, to: 'ac_blade', tx: 7, ty: 8, dir: 'up' },
      { x: 38, y: 6, w: 1, h: 1, to: 'ac_arcane', tx: 7, ty: 8, dir: 'up' },
      { x: 7, y: 22, w: 1, h: 1, to: 'ac_dorm', tx: 7, ty: 8, dir: 'up' },
      { x: 38, y: 23, w: 1, h: 1, to: 'ac_lib', tx: 8, ty: 10, dir: 'up' },
      { x: 45, y: 15, w: 1, h: 1, to: 'acwoods', tx: 1, ty: 12, dir: 'right' }
    ],
    triggers: [{ x: 22, y: 32, w: 2, h: 1, script: 'acGate' }],
    chests: [{ id: 'ac1', x: 44, y: 24, item: 'ether', qty: 2 }],
    signs: { '21,7': 'THE AURELIAN ACADEMY. Blade Hall — west. Arcane Hall — east. The Sealed Archive — nowhere, as far as first-years are concerned.' }
  },
  ac_hall: {
    name: 'The Great Hall', music: 'capital', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,200,120,.10)', encounters: null,
    rows: AC_HALL_ROWS, pois: [{ x: 9, y: 3, dir: 'up', act: 'fire' }, { x: 3, y: 6, dir: 'up', act: 'sit' }, { x: 16, y: 6, dir: 'up', act: 'sit' }, { x: 11, y: 10, dir: 'down', act: 'door' }],
    npcs: [
      { id: 'crane', x: 11, y: 3, spr: 'headmistress', dir: 'down', script: 'crane' },
      { id: 'sableNight', x: 19, y: 9, spr: 'sable', dir: 'left', script: 'sableNight', show: 'ac_night&!ac_thief' },
      { id: 'acDiner1', x: 4, y: 6, spr: 'cadet', dir: 'up', script: 'crowd', name: 'Hungry Cadet', lines: [`Porridge again. It's always porridge. The porridge is sentient.`] },
      { id: 'acDiner2', x: 17, y: 9, spr: 'cadet2', dir: 'up', script: 'crowd', name: 'Senior', lines: [`Enjoy first year. After this they start sending you places.`] }
    ],
    warps: [{ x: 10, y: 11, w: 2, h: 1, to: 'academy', tx: 22, ty: 7, dir: 'down', clamp: true }], chests: [], signs: {}
  },
  ac_blade: {
    name: 'Blade Hall', music: 'training', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,110,.10)', encounters: null,
    rows: AC_BLADE_ROWS, pois: [{ x: 3, y: 2, dir: 'up', act: 'display' }, { x: 12, y: 7, dir: 'up', act: 'sit' }, { x: 8, y: 8, dir: 'down', act: 'door' }],
    npcs: [{ id: 'dorran', x: 8, y: 2, spr: 'dorran', dir: 'down', script: 'dorran' },
           { id: 'acSpar', x: 5, y: 7, spr: 'cadet', dir: 'right', script: 'crowd', name: 'Cadet', lines: [`Shoulders down. Weight forward. Cry later.`] }],
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'academy', tx: 7, ty: 7, dir: 'down', clamp: true }], chests: [], signs: {}
  },
  ac_arcane: {
    name: 'Arcane Hall', music: 'void', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(160,170,255,.14)', encounters: null,
    rows: AC_ARCANE_ROWS, pois: [{ x: 3, y: 2, dir: 'up', act: 'book' }, { x: 12, y: 2, dir: 'up', act: 'book' }, { x: 8, y: 8, dir: 'down', act: 'door' }],
    npcs: [{ id: 'oriel', x: 7, y: 2, spr: 'oriel', dir: 'down', script: 'oriel' },
           { id: 'acMage', x: 11, y: 6, spr: 'cadet2', dir: 'up', script: 'crowd', name: 'Arcane Student', lines: [`I set my eyebrows on fire. Both of them. At once. Oriel said it was "ambitious".`] }],
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'academy', tx: 38, ty: 7, dir: 'down', clamp: true }], chests: [], signs: {}
  },
  ac_dorm: {
    name: 'First-Year Dormitory', music: 'manor', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,180,110,.10)', encounters: null,
    rows: AC_DORM_ROWS, pois: [{ x: 7, y: 3, dir: 'up', act: 'sit' }, { x: 2, y: 3, dir: 'up', act: 'book' }, { x: 8, y: 8, dir: 'down', act: 'door' }],
    npcs: [{ id: 'brim', x: 8, y: 3, spr: 'brim', dir: 'down', script: 'brim' },
           { id: 'acBed', x: 12, y: 3, spr: 'student', dir: 'down', script: 'crowd', name: 'Roommate', lines: [`You snore. Just so you know. It's fine. It's rhythmic.`, `My mum sends cake every week and it's gone by morning. The Gutter rats, Brim says.`] }],
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'academy', tx: 7, ty: 23, dir: 'down', clamp: true }], chests: [], signs: {}
  },
  ac_lib: {
    name: 'The Academy Library', music: 'void', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(200,180,255,.10)', encounters: null,
    rows: AC_LIB_ROWS, pois: [{ x: 4, y: 3, dir: 'up', act: 'book' }, { x: 12, y: 6, dir: 'up', act: 'book' }, { x: 8, y: 10, dir: 'down', act: 'door' }],
    npcs: [{ id: 'librarian', x: 8, y: 8, spr: 'elder', dir: 'down', script: 'crowd', name: 'Librarian Soames', lines: () => G.flags.ac_vaultOpen && !G.flags.ac_vault ? [`The seal is broken. The Ashcombe boy went down an hour ago. Go! Go on!`] : [`Shh.`, `The door in the corner goes to the Sealed Archive. It is sealed. It is in the name.`, `Three hundred years ago a boy from nowhere left something down there, and the Academy was built on top to keep it.`] }],
    warps: [{ x: 8, y: 11, w: 2, h: 1, to: 'academy', tx: 38, ty: 24, dir: 'down', clamp: true }, { x: 16, y: 1, w: 1, h: 1, to: 'vault', tx: 15, ty: 20, dir: 'up' }],
    chests: [], signs: {}
  },
  acwoods: {
    name: 'The Academy Woods', music: 'field', theme: 'grass', edge: 'T', lvl: 3, fx: 'leaves', ambient: 'rgba(20,60,40,.10)',
    rows: buildAcWoods(), encounters: [['slime', 3], ['bat', 2], ['wolf', 1]], bg: 'forest',
    npcs: [
      { id: 'kestrelAc', x: 14, y: 11, spr: 'kestrel', dir: 'right', script: 'kestrelAc', show: 'ac_huntAsked&!ac_hunt' },
      { id: 'greymane', x: 35, y: 6, spr: 'm:direwolf', dir: 'left', script: 'greymane', show: '!ac_hunt' }
    ],
    warps: [{ x: 0, y: 11, w: 1, h: 3, to: 'academy', tx: 44, ty: 15, dir: 'left', clamp: true }],
    chests: [{ id: 'aw1', x: 8, y: 19, item: 'potion', qty: 3 }, { id: 'aw2', x: 31, y: 19, item: 'ether', qty: 2 }],
    signs: {}, safe: [[0, 10, 6, 5]]
  },
  vault: {
    name: 'The Sealed Archive', music: 'mine', theme: 'castle', edge: '#', lvl: 5, dark: true, fx: 'dust', ambient: 'rgba(60,20,80,.2)',
    rows: buildVault(), encounters: [['inkling', 3], ['bat', 2], ['gargoyle', 1]], bg: 'castle',
    npcs: [
      { id: 'wraith', x: 24, y: 18, spr: 'm:ashwraith', dir: 'left', script: 'wraith', show: '!ac_vault' },
      { id: 'lucanTrapped', x: 22, y: 16, spr: 'lucan', dir: 'right', script: 'wraith', show: '!ac_vault' }
    ],
    warps: [{ x: 14, y: 21, w: 3, h: 1, to: 'ac_lib', tx: 16, ty: 2, dir: 'down', clamp: true }],
    chests: [{ id: 'vt1', x: 4, y: 5, item: 'hipotion', qty: 2 }, { id: 'vt2', x: 15, y: 9, item: 'tonic', qty: 1 }, { id: 'vt3', x: 26, y: 16, gold: 150 }],
    signs: {}, safe: [[13, 18, 5, 4]]
  }
});

// ---------------------------------------------------------------- gates and doors
{
  const warp0 = WorldScene.prototype.useWarp;
  WorldScene.prototype.useWarp = function (w, fx, fy) {
    const stop = msg => { const p = this.player; if (!DOOR_TILES.has(this.tile(fx, fy)) && (p.x !== p.fx || p.y !== p.fy)) { p.x = p.fx; p.y = p.fy; p.t = 1; G.x = p.x; G.y = p.y; } this.run(() => say(null, msg)); };
    if (w.to === 'acwoods' && !G.flags.ac_huntAsked) return stop('The east gate to the Academy Woods is chained. A sign: "Students only with a master\'s leave."');
    if (w.to === 'vault' && !G.flags.ac_vaultOpen) return stop('A round door of black iron, sealed with a sunburst of gold wax. It is very, very sealed.');
    if (w.to === 'castle' && !G.flags.kharn && !G.flags.kingDone && !G.flags.v_castle && !G.ending) return stop('Warlord Kharn and his guard stand in front of the gate.');
    return warp0.call(this, w, fx, fy);
  };
}
STORY.acGate = async function () {
  await say(null, 'The main gate. A porter in Academy burgundy looks up from his book. "Term-time, cadet. Nobody leaves the grounds without the Headmistress\'s say-so."');
  const p = World.player; p.fx = p.x; p.fy = p.y; p.y -= 1; p.t = 0; p.dir = 'up';
};

// ---------------------------------------------------------------- objectives
function academyObjective() {
  const F = G.flags, c = G.heroClass;
  if (!F.ac_lesson) {
    const need = [];
    if ((c === 'blade' || c === 'none') && !F.ac_blade) need.push('Captain Dorran in the Blade Hall (west)');
    if ((c === 'mage' || c === 'none') && !F.ac_arcane) need.push('Magister Oriel in the Arcane Hall (east)');
    return 'Your first lesson: ' + need.join(', then ') + '.';
  }
  if (F.ac_vaultOpen && !F.ac_vault) return 'Lucan broke the seal on the Sealed Archive. Go down through the library, in the south-east of the grounds.';
  const todo = [];
  if (!F.ac_wren) todo.push('trouble in the stable yard (south)');
  if (!F.ac_thiefAsked) todo.push('Housemaster Brim in the dormitory (south-west)');
  else if (!F.ac_thief) todo.push(F.ac_night ? 'catch the thief in the Great Hall' : 'rest in your dormitory bed, then watch the Great Hall at night');
  if (!F.ac_huntAsked) todo.push('Groundskeeper Tolly by the south path');
  else if (!F.ac_hunt) todo.push('hunt the beast in the Academy Woods (east gate)');
  if (todo.length) return 'First year: ' + todo.join(' · ') + '.';
  return 'The Headmistress has asked for you in the Great Hall.';
}
{
  const so0 = storyObjective;
  storyObjective = function () { if (G.age === 'student') return academyObjective(); return so0(); };
}

// ---------------------------------------------------------------- the time skip: to school instead of to adulthood
growUp = async function () {
  await fadeOut(1.4);
  Sound.stop();
  await titleCard('Seven years later', 'The Aurelian Academy, Solmere — the first day of term');
  G.age = 'student'; G.flags.student = true;
  clearHeroSprites();
  const h = G.party[0];
  h.lvl = Math.max(h.lvl, 3); h.xp = 0;
  h.equip = { weapon: G.heroClass === 'mage' ? 'wand' : 'isword', armor: 'cadet' };
  h.hp = maxHP(h); h.mp = maxMP(h);
  G.gold = Math.max(G.gold, 120);
  addItem('potion', 3);
  startWorld();
  World.load('academy', 22, 24, 'up');
  await fadeIn(1.2);
  await World.run(async () => {
    const C = 'Headmistress Crane', s = 'headmistress';
    await say(null, 'You are thirteen. Your trunk has your name painted on it in your mother\'s hand, and you have been told eleven times not to lose it.');
    await talk([
      [C, `First-years. Look at me, please, not at the fountain.`, s],
      [C, `This is the Aurelian Academy. For two hundred years we have trained the crown's blades in the west hall and its minds in the east.`, s],
      [C, G.heroClass === 'none' ? `Some of you have been sent to both. My condolences, and my congratulations.` : `You have each been sent to one. You will each wish, at least once, that it was the other.`, s],
      [C, `Three rules. Nobody leaves the grounds in term-time. Nobody duels without a master present. And nobody — nobody — goes near the Sealed Archive under the library.`, s],
      [C, `Classes begin now. Off you go.`, s]
    ]);
    await say(null, `TIP: ${G.heroClass === 'none' ? 'You attend both halls: the Blade Hall is west, the Arcane Hall is east.' : G.heroClass === 'blade' ? 'Your lessons are in the Blade Hall, west across the courtyard.' : 'Your lessons are in the Arcane Hall, east across the courtyard.'}`);
  });
  saveGame();
};

// ---------------------------------------------------------------- lessons
async function acLessonDone() {
  const c = G.heroClass, F = G.flags;
  if (((c === 'blade' || c === 'none') && !F.ac_blade) || ((c === 'mage' || c === 'none') && !F.ac_arcane)) return;
  F.ac_lesson = true;
  World.refreshNpcs(true);
  await say(null, 'Your first day is done. On the way back across the courtyard you hear someone shouting in the stable yard, south of the fountain.');
  toast('New: things are happening around the grounds.', UI.gold);
  saveGame();
}
STORY.dorran = async function () {
  const N = 'Captain Dorran', s = 'dorran';
  if (G.heroClass === 'mage') { await say(N, `Arcane Hall's the other way, Valen. Unless you've come to be hit. Some of them do.`, s); return; }
  if (G.flags.ac_blade) { await say(N, pick([`Again tomorrow. And the day after. That's the secret. There's no secret.`, `Ashcombe's quick. You're steadier. Steady wins more often than it looks like it should.`]), s); return; }
  await talk([
    [N, `Valen. Corwin wrote to me about you. He says you have a strange sort of nerve. We'll see.`, s],
    [N, `First bout of the year. You'll face the other new noble. Ashcombe! Up.`, s],
    ['Lucan Ashcombe', `A Valen. My father says your house are the crown's errand-runners. Let's see you run.`, 'lucan']
  ]);
  const res = await startBattle(['lucan'], { bg: 'dojo', spar: true, noRun: true, music: 'training', intro: 'Lucan salutes with a flourish that is mostly for the girls watching.' });
  healParty();
  G.flags.ac_blade = true; G.flags.lucanBeat = res === 'win';
  for (const l of gainXP(G.party[0], 40)) await say(null, l);
  await say(N, res === 'win' ? `Good. You didn't show off. He did. That's the whole lesson.` : `You lost. You got up. Ashcombe has never once got up. Remember that.`, s);
  if (res === 'win') await say('Lucan Ashcombe', `…That was luck. Do it again in a week and I'll have you.`, 'lucan');
  await acLessonDone();
};
STORY.oriel = async function () {
  const N = 'Magister Oriel', s = 'oriel';
  if (G.heroClass === 'blade') { await say(N, `Blade Hall is west, dear. Though you're welcome to sit at the back and duck.`, s); return; }
  if (G.flags.ac_arcane) { await say(N, pick([`A rune is a promise. Keep them small until you can keep them.`, `Your mother's hands, Isolde said. I'm starting to see it.`]), s); return; }
  await talk([
    [N, `Valen. Isolde's student. She warned me you panic less than you should.`, s],
    [N, `Today, the same trial you took as a child, only faster. Mr Ashcombe will go after you and try very hard to beat your score.`, s],
    ['Lucan Ashcombe', `I will beat it. Obviously.`, 'lucan']
  ]);
  const sc = new RuneTrialScene(10);
  sc.per = 1.6;
  Scenes.push(sc);
  const score = await sc.promise;
  Scenes.remove(sc);
  G.flags.ac_arcane = true; G.flags.lucanBeat = G.flags.lucanBeat || score >= 60;
  for (const l of gainXP(G.party[0], 40)) await say(null, l);
  await say(N, score >= 80 ? `Oh, well done. Mr Ashcombe, you'll need to sit down for this.` : score >= 50 ? `Serviceable. Better than serviceable. Don't let it go to your head.` : `Not today. But you didn't freeze. That's rarer than talent.`, s);
  await say('Lucan Ashcombe', score >= 60 ? `…${score}. Fine. FINE.` : `Ha! Errand-runner.`, 'lucan');
  await acLessonDone();
};
STORY.lucanIdle = async function () {
  const N = 'Lucan Ashcombe', s = 'lucan';
  await say(N, G.flags.ac_wren ? pick([`That was a cheap shot in the yard, Valen. My father will hear about it.`, `The Sealed Archive has the first hero's sword in it. When I bring it out, they'll put MY statue up.`]) : pick([`Out of my way, errand-runner.`, `The stable girl's in my seat. In the yard. Where she doesn't belong.`]), s);
};

// ---------------------------------------------------------------- WREN: the stable yard
STORY.wrenAc = async function () {
  const N = 'Wren', s = 'cadetf';
  if (!G.flags.ac_lesson) {
    await say(N, G.flags.millWatched ? `…Oh. It's you. Your father pays my fees, so I'm meant to be grateful. I'm grooming a horse. Go away.` : `It's you! Your father sent me here — a squire-scholarship, can you believe it? I'd hug you but I smell of horse.`, s);
    return;
  }
  await talk([
    [null, 'Lucan\'s two friends have Wren backed against the stable wall. One of them has her practice sword and is holding it out of reach.'],
    ['Crony', `Squire-scholar. That's a stable girl in a borrowed coat.`, 'crony'],
    [N, `Give it back. That's issued. I have to sign for it.`, s]
  ]);
  const c = await askTimed(null, 'They haven\'t noticed you yet.', ['Step in.', 'Wait and see if she handles it.'], 4);
  if (c !== 0) {
    await say(null, 'You wait. She doesn\'t handle it. One of them shoves her into the straw.');
    await say(N, G.flags.millWatched ? `Standing in the dark again? Some things don't change.` : `…Oi! Valen! A hand?`, s);
    addMorale('wren', -6, true);
  }
  await say(N, `Right. Two of them. You take the tall one.`, s);
  const r = rosterOf('wren');
  if (!r.member) r.member = makeMember('wren', 'Wren', heroLevel());
  r.member.equip = { weapon: 'wsword', armor: 'cadet' };
  const joined = await joinParty('wren', r.morale);
  const res = await startBattle(['crony', 'crony'], { bg: 'yard', noRun: true, spar: true, intro: 'The cronies put up their fists. Wren puts up hers.' });
  healParty();
  if (res !== 'win') { await say('Crony', `Ha! …Let's go before Dorran comes.`, 'crony'); }
  G.flags.ac_wren = true; G.flags.wrenAsked = true; G.flags.acWren = true;
  World.refreshNpcs(true);
  await talk([
    [N, res === 'win' ? `…Not bad, noble.` : `Well. We lost. But they ran. That counts.`, s],
    [N, G.flags.millWatched ? `I haven't forgiven you for the mill. I want that clear. But I'd rather not do this place alone either.` : `You ran straight in again. Same as the mill. Stick with me, will you? This place is full of Lucans.`, s]
  ]);
  if (joined) toast('Wren is now your friend. She\'ll stay in your party.', UI.gold);
  addMorale('wren', 10);
  saveGame();
};

// ---------------------------------------------------------------- SABLE: the kitchen thief
STORY.brim = async function () {
  const N = 'Housemaster Brim', s = 'brim';
  if (!G.flags.ac_lesson) { await say(N, `Your bed is the one by the window. Your trunk goes under it. Your opinions go in the trunk.`, s); return; }
  if (!G.flags.ac_thiefAsked) {
    await talk([
      [N, `Valen. You're a Valen, and Valens are meant to be useful, so be useful.`, s],
      [N, `Every night something is stolen. Bread from the Hall. Cake from the dorms. Last night, Lucan Ashcombe's signet ring, which I am never going to hear the end of.`, s],
      [N, `Get some sleep in your bunk, then sit up in the Great Hall after lights-out and catch whoever it is. Quietly.`, s]
    ]);
    G.flags.ac_thiefAsked = true; sideStart('The Kitchen Thief');
    return;
  }
  if (!G.flags.ac_night && !G.flags.ac_thief) {
    if (await confirm(null, 'Your bunk is by the window. Sleep until lights-out, then sneak to the Great Hall?')) {
      await fadeOut(0.8); healParty(); G.flags.ac_night = true; await wait(0.6);
      World.load('ac_hall', 10, 10, 'up'); World.refreshNpcs(true);
      await fadeIn(0.8);
      await say(null, 'The Great Hall at night. Moonlight on the long tables. Something small and quick is going through the bread baskets at the far end.');
    }
    return;
  }
  await say(N, G.flags.ac_thief ? (G.flags.sableCovered ? `No thefts for a week. The new kitchen girl works like three people. Curious.` : `They caught a Gutter child, they say. Over the wall and gone. Well. Good riddance.`) : `The Great Hall. After lights-out. Quietly.`, s);
};
STORY.sableNight = async function () {
  const N = '???', s = 'sable';
  await talk([
    [null, 'A girl about your age, all elbows and a hood, freezes with half a loaf in her mouth.'],
    [N, `…You didn't see me. You're asleep. This is a dream about bread.`, s],
    [null, 'She bolts for the kitchen door — then sees it\'s locked, and turns, and pulls a knife she clearly knows how to use.']
  ]);
  const res = await startBattle(['sableKid'], { bg: 'castle', spar: true, noRun: true, intro: 'She is very fast, and very hungry.' });
  healParty();
  await talk([
    [N, res === 'win' ? `Ow. OW. Fine! Fine. You got me.` : `Ha — no, wait, you've got my sleeve — fine. FINE.`, s],
    ['Sable', `Sable. From the Gutter. The Academy throws out more bread in a night than my street sees in a week, so I come over the wall and I eat it.`, s],
    ['Sable', `And I took the ring because Ashcombe kicked a dog on the way in. Here. Take it. Hand me in. Whatever.`, s]
  ]);
  const c = await ask(null, 'Brim is going to ask who it was.', ['Cover for her — ask Father to sponsor her as a kitchen scholar.', 'Hand her in to Brim.'], null, false);
  G.flags.ac_thief = true; G.flags.sableMet = true; G.flags.sableFought = true;
  World.refreshNpcs(true);
  if (c === 0) {
    G.flags.sableCovered = true; G.flags.acSable = true;
    await talk([
      [null, 'You write to your father that night. His reply comes in four days: one line, and a banker\'s note. "If you vouch for her, so does the house."'],
      ['Sable', `…Nobody's ever vouched for me. For anything. I don't know what to do with my face.`, s],
      ['Sable', `All right, Valen. I'm yours. Don't make it weird.`, s]
    ]);
    const r = rosterOf('sable');
    if (!r.member) r.member = makeMember('sable', 'Sable', heroLevel());
    r.member.equip = { weapon: 'dagger1', armor: 'cadet' };
    await joinParty('sable', 78);
  } else {
    G.flags.sableTurnedIn = true;
    await say(null, 'Brim marches her to the gate. At the last moment she wriggles out of the coat he is holding and is over the wall before he turns round.');
    await say('Sable', `(from the top of the wall) No hard feelings, Valen! …Some hard feelings!`, s);
  }
  addItem('signet');
  await say(null, 'You still have Lucan\'s signet ring.');
  sideDone('The Kitchen Thief');
  saveGame();
};
ITEMS.signet = { name: 'Ashcombe Signet', type: 'key', price: 0, desc: 'Lucan Ashcombe\'s family ring. A rearing stag. He will want it back. He will not want to say thank you.' };

// ---------------------------------------------------------------- KESTREL: the beast in the woods
STORY.tolly = async function () {
  const N = 'Groundskeeper Tolly', s = 'tolly';
  if (!G.flags.ac_lesson) { await say(N, pick([`Mind the flowerbeds. The Headmistress counts them.`, `Stables are that way. The horses bite. So do the stable-hands.`]), s); return; }
  if (!G.flags.ac_huntAsked) {
    await talk([
      [N, `Two of the Academy horses, dead in the paddock. Throats out. Something big came over the east fence in the night.`, s],
      [N, `The masters say leave it to the huntsmen. The huntsmen are in Solmere, drinking. There's a Fernhollow girl on an archery scholarship who's already gone after it, and nobody's stopping her.`, s],
      [N, `I'll unchain the east gate for you. Don't tell Crane.`, s]
    ]);
    G.flags.ac_huntAsked = true; sideStart('The Beast in the Woods'); World.refreshNpcs(true);
    return;
  }
  await say(N, G.flags.ac_hunt ? `Old Greymane. I'd heard of him. I never thought a pair of first-years would bring back his tooth.` : `East gate, past the avenue. Mind yourself.`, s);
};
STORY.kestrelAc = async function () {
  const N = 'Kestrel', s = 'kestrel';
  G.flags.kestrelMet = true;
  await talk([
    [N, `Stop. You're standing on its track. …You're the Valen they're all talking about. Mud to your ankles. Good.`, s],
    [N, `Kestrel. Fernhollow. It's a direwolf — old, alone, big as a pony. Whatever drove it out of the deep woods, it's hungry.`, s],
    [N, `Its den's north-east, up the hill. I'm going in. You can come, if you keep up and don't shout.`, s]
  ]);
  const r = rosterOf('kestrel');
  if (!r.member) r.member = makeMember('kestrel', 'Kestrel', heroLevel());
  if (await joinParty('kestrel', 70)) { G.flags.kestrelJoined = true; await say(N, `High ground's mine. You take the shouting.`, 'c:kestrel'); }
};
STORY.greymane = async function () {
  await say(null, 'The den. Bones in the bracken. And rising out of the dark between two rocks, grey to the muzzle and scarred all over: the wolf.');
  if (has('kestrel')) await say('Kestrel', `Old Greymane. My da tracked him for years. He's too old to hunt deer any more. That's why he came for the horses.`, 'c:kestrel');
  if (!(await confirm(null, 'Fight Old Greymane? (Suggested level 4+)'))) return;
  const res = await startBattle(['greymane', 'wolf'], { bg: 'forest' });
  if (res !== 'win') return;
  G.flags.ac_hunt = true; G.flags.acKestrel = has('kestrel');
  World.refreshNpcs(true);
  addItem('hipotion', 2); G.gold += 120;
  await say(null, 'Received 2 Hi-Potions and 120 G from the bounty the Academy quietly paid.');
  if (has('kestrel')) await talk([
    ['Kestrel', `…Clean. He didn't suffer. Good.`, 'c:kestrel'],
    ['Kestrel', `You didn't shout once. I've decided I like you. Don't let it go to your head, it's a very small like.`, 'c:kestrel']
  ]);
  sideDone('The Beast in the Woods');
  saveGame();
};

// ---------------------------------------------------------------- the Sealed Archive
STORY.crane = async function () {
  const N = 'Headmistress Crane', s = 'headmistress';
  const F = G.flags;
  if (!F.ac_lesson || !F.ac_wren || !F.ac_thief || !F.ac_hunt) {
    await say(N, pick([`The Academy is not a place, cadet. It's a habit. Get into it.`, `The first hero founded nothing, you know. We built on top of what he left. That's what academies do.`, `Your father was a terrible student. Wonderful at the one thing that mattered, though. He always went.`]), s);
    return;
  }
  if (!F.ac_vaultOpen) {
    await talk([
      [N, `Valen. Sit. …No, don't sit, there isn't time.`, s],
      [N, `Lucan Ashcombe has broken the seal on the Sealed Archive. Soames heard him go down an hour ago, boasting that he'd bring up the first hero's sword.`, s],
      [N, `There is something down there with it. It has been asleep for three hundred years, and Mr Ashcombe has just woken it up.`, s],
      [N, `The masters are in Solmere for the Crown Council. You and your friends are the only cadets in this Academy I would trust with this. Go and get him out.`, s]
    ]);
    F.ac_vaultOpen = true; World.refreshNpcs(true);
    toast('The Sealed Archive is open: library, south-east.', UI.gold);
    return;
  }
  if (!F.ac_vault) { await say(N, `The library. Now. Please.`, s); return; }
  await say(N, `Rest. Summer is coming. You have earned a very dull one.`, s);
};
STORY.wraith = async function () {
  if (G.flags.ac_vault) return;
  await talk([
    [null, 'The deepest room of the Archive. On a stone table: a single-edged sword in a black lacquered scabbard, very plain, very old.'],
    [null, 'Between you and it, a shape of grey smoke with coals for eyes. It is holding Lucan Ashcombe off the ground by his collar.'],
    ['Lucan Ashcombe', `V-Valen! I only wanted to LOOK at it—`, 'lucan'],
    ['???', `…ANOTHER ONE. ANOTHER CHILD WITH THE SMELL OF THE OTHER SHORE ON IT.`, null]
  ]);
  if (!(await confirm(null, 'The Ash Wraith turns to you. Fight? (Suggested level 6+)'))) return;
  const res = await startBattle(['ashwraith', 'gargoyle'], { bg: 'castle', music: 'boss' });
  if (res !== 'win') return;
  G.flags.ac_vault = true; World.refreshNpcs(true);
  await talk([
    [null, 'The wraith comes apart like a fire kicked over. For a moment the ash hangs in the air in the shape of a man — tired, sad, in armour from the Burning — and then it is just ash.'],
    ['Lucan Ashcombe', `You… you came down here for ME? After the yard, and the ring, and—`, 'lucan']
  ]);
  if (itemCount('signet')) {
    const c = await ask(null, 'You still have his ring.', ['Give Lucan his ring back.', 'Keep it. He owes you.'], null, false);
    if (c === 0) { removeItem('signet'); G.flags.lucanFriend = true; await say('Lucan Ashcombe', `…Thank you. I mean it. Don't tell anyone I said that. Actually — tell them. I don't care.`, 'lucan'); }
    else { await say('Lucan Ashcombe', `…Fair. I'd have kept it too. …Probably.`, 'lucan'); }
  }
  await talk([
    [null, 'You step up to the stone table. The sword\'s hilt is wrapped in faded cord, and on the pommel is a single character you have never seen in this world.'],
    [null, '広. Hiro. You can read it. You have no idea how you can read it.'],
    [null, 'You touch the scabbard, and very softly, from somewhere inside the steel, a bell rings.']
  ]);
  await fadeOut(0.8);
  World.load('ac_hall', 10, 5, 'up');
  await fadeIn(0.8);
  await talk([
    ['Headmistress Crane', `The first hero's sword. It has not made a sound in three hundred years. We tested that. Extensively.`, 'headmistress'],
    ['Headmistress Crane', `…It rang for you. I don't know what that means, and I dislike not knowing things. It stays in the Academy for now.`, 'headmistress'],
    ['Headmistress Crane', `When you're older, and the world needs you to be — I think it will want to go with you.`, 'headmistress']
  ]);
  for (const m of G.party) for (const l of gainXP(m, 60)) if (m.cls === 'hero') await say(null, l);
  saveGame();
  await seniorYear();
};

// ---------------------------------------------------------------- senior year
async function seniorYear() {
  await fadeOut(1.4);
  Sound.stop();
  await titleCard('Four years later', 'Senior year — the last week of term');
  G.age = 'youth'; G.flags.youth = true; G.flags.acDone = true;
  clearHeroSprites();
  const h = G.party[0];
  h.lvl = Math.max(h.lvl, 7); h.xp = 0;
  h.equip = { weapon: G.heroClass === 'mage' ? 'valenstaff' : 'valensword', armor: 'noble' };
  for (const m of G.party) {
    if (m.cls === 'hero') continue;
    m.lvl = Math.max(m.lvl, 6); m.xp = 0;
    m.equip = { ...(START_GEAR[m.cls] || m.equip) };
  }
  for (const m of G.party) { m.hp = maxHP(m); m.mp = maxMP(m); }
  G.gold = Math.max(G.gold, 300);
  addItem('potion', 3); addItem('ether', 2);
  World.load('academy', 22, 12, 'down');
  World.syncFollowers();
  await fadeIn(1.2);
  await World.run(async () => {
    await say(null, 'You are seventeen. You are taller than Headmistress Crane now, which she mentions roughly once a term.');
    const friends = companionsInParty().map(m => m.cls);
    if (friends.includes('wren')) await say('Wren', `Last week. Four years of Dorran shouting at us and it's nearly done. I might actually miss it. Don't tell him.`, 'c:wren');
    if (friends.includes('sable')) await say('Sable', `Top of the class in "Unarmed Retrieval". They invented the subject for me, you know.`, 'c:sable');
    if (friends.includes('kestrel')) await say('Kestrel', `There's a herald at the gate. Crown seal. He's asked for you by name.`, 'c:kestrel');
    else await say(null, 'A herald is waiting at the gate, with the crown seal on his coat. He has asked for you by name.');
    if (G.flags.lucanFriend) await say('Lucan Ashcombe', `Valen. Whatever the herald says — you pulled me out of the Archive. If you need a sword, the Ashcombes have a lot of them. Write.`, 'lucan');
  });
  await fadeOut(1.0);
  World.load('valen_manor', 10, 11, 'up');
  World.syncFollowers();
  Sound.stop(); Sound.play('manor');
  await fadeIn(1.2);
  await World.run(async () => {
    await say(null, 'You ride home to Valenford with your friends, and your father meets you in the hall with the herald\'s letter already open in his hand.');
    await questGiven();
  });
}
{
  const qg0 = questGiven;
  questGiven = async function () {
    const already = G.flags.questGiven;
    await qg0();
    if (already) return;
    const F = 'Lord Aldric Valen', M = 'Lady Ysolde Valen';
    const friends = companionsInParty().map(m => m.cls);
    if (!friends.length) return;
    await talk([
      [F, `And your friends. The crown's letter names them too — "the Valen heir, and such companions as the heir shall choose". The King reads the Academy reports, it seems.`, 'father'],
      ...(friends.includes('wren') ? [[F, `Wren. You have been in this house since you could walk. You do not have to go.`, 'father'], ['Wren', `With respect, my lord — yes, I do.`, 'c:wren']] : []),
      ...(friends.includes('sable') ? [[M, `Sable. You'll keep my child out of trouble.`, 'mother'], ['Sable', `My lady, I am trouble. I'll keep the other trouble off.`, 'c:sable']] : []),
      ...(friends.includes('kestrel') ? [['Kestrel', `Fernhollow's on the way east. I'll show you the roads the maps get wrong.`, 'c:kestrel']] : []),
      [M, `All of you, then. Come back. That is my entire instruction, and it applies to every one of you.`, 'mother']
    ]);
    await say(null, 'TIP: You can still meet new companions on the road. When your party is full, send someone home — or write to a friend from any inn after a night\'s rest, and they\'ll swap in by morning.');
  };
}
// companions met at school are glad to see you on the road
{
  const k0 = STORY.kestrel;
  STORY.kestrel = async function () {
    if (G.flags.acKestrel && !has('kestrel') && G.roster.kestrel && G.roster.kestrel.status !== 'gone') {
      const c = await ask('Kestrel', `Valen! Room for a bow?`, ['Come with me.', 'Not this time.'], 'kestrel', false);
      if (c === 0) { if (await joinParty('kestrel')) await say('Kestrel', `Like old times. Try not to shout.`, 'c:kestrel'); }
      else await say('Kestrel', `Fair. The lodge doesn't move.`, 'kestrel');
      return;
    }
    return k0.apply(this, arguments);
  };
  const ct0 = companionTalk;
  const MEM = {
    wren: [`Remember Dorran's twelve laps? This is worse. This is so much worse.`, `First year, you stepped in at the stable yard. I think about that more than the mill, now.`],
    sable: [`Four years of Academy porridge and I still pocket bread. Some habits are load-bearing.`, `Your father never asked for the money back. I checked. I'm still checking.`],
    kestrel: [`Greymane's tooth is on my bowstring. For luck. Don't laugh.`, `The Academy woods were a nursery compared to this.`]
  };
  companionTalk = async function (f) {
    const id = f.m.cls;
    if (G.flags.acDone && MEM[id] && Math.random() < 0.35) { await say(f.m.name, pick(MEM[id]), 'c:' + id); return; }
    return ct0(f);
  };
}
// side story tracker entries for the school
SIDE.push(
  { id: 'acThief', title: 'The Kitchen Thief', status: () => !G.flags.ac_thiefAsked ? null : G.flags.ac_thief ? 'done' : academyObjective() },
  { id: 'acHunt', title: 'The Beast in the Woods', status: () => !G.flags.ac_huntAsked ? null : G.flags.ac_hunt ? 'done' : 'Hunt the beast in the Academy Woods, through the east gate.' }
);
