// =====================================================================
//  maps.js : world maps, NPC placement, warps, chests, encounter tables
// =====================================================================

function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Tiny map builder
function MB(w, h, fill, seed) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(fill));
  const rnd = mulberry(seed || 1);
  const B = {
    w, h, g, rnd,
    ok(x, y) { return x >= 0 && y >= 0 && x < w && y < h; },
    set(x, y, c) { if (B.ok(x, y)) g[y][x] = c; return B; },
    get(x, y) { return B.ok(x, y) ? g[y][x] : null; },
    rect(x, y, rw, rh, c) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) B.set(i, j, c); return B; },
    border(c, t = 1) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        if (x < t || y < t || x >= w - t || y >= h - t) g[y][x] = c;
      return B;
    },
    scatter(c, dens, on) {
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++)
        if ((!on || on.includes(g[y][x])) && rnd() < dens) g[y][x] = c;
      return B;
    },
    blob(cx, cy, rx, ry, c, on) {
      for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
        const d = ((x - cx) / (rx + 0.5)) ** 2 + ((y - cy) / (ry + 0.5)) ** 2;
        if (d <= 1 && (!on || on.includes(B.get(x, y)))) B.set(x, y, c);
      }
      return B;
    },
    // axis-aligned polyline, carving `width` tiles of c (centred)
    path(pts, c, width = 1) {
      const off = Math.floor((width - 1) / 2);
      for (let i = 0; i < pts.length - 1; i++) {
        let [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
        let x = x0, y = y0;
        while (true) {
          for (let a = 0; a < width; a++) {
            if (dx !== 0) B.set(x, y - off + a, c); else B.set(x - off + a, y, c);
          }
          if (x === x1 && y === y1) break;
          x += dx; y += dy;
        }
      }
      return B;
    },
    rows() { return g.map(r => r.join('')); }
  };
  return B;
}

function house(b, x, y, w, doorX) {
  b.rect(x, y, w, 2, 'R');
  b.rect(x, y + 2, w, 1, 'W');
  b.set(doorX, y + 2, 'D');
}

// ------------------------------------------------------------------ VILLAGE
const VILLAGE_ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T..f.........f..........f...TT',
  'T..RRRRR.....RRRRRRR........TT',
  'T..RRRRR.....RRRRRRR...RRRRR.T',
  'T..WWDWW.....WWWDWWW...RRRRR.T',
  'T....=..........=......WWDWW.T',
  'T....=..........=........=...T',
  'T....============Q========...T',
  'T.........=..........f...=....',
  'T..f......=..............=====',
  'T.........=...FFFFF......=====',
  'T..~~~~...=...F...F......=...T',
  'T.~~~~~~..=...F.f.F..f...=...T',
  'T.~~~~~~..=...FF.FF......=...T',
  'T..~~~~...=..............=...T',
  'T.........===============..f.T',
  'T..f..............f.........TT',
  'T.......TT..........f......TTT',
  'T..T...TTT.....T..........TTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
];

// ------------------------------------------------------------------ FOREST
function buildForest() {
  const b = MB(44, 28, '.', 7);
  b.scatter('T', 0.17).scatter(',', 0.06, ['.']).scatter('f', 0.02, ['.']);
  b.blob(9, 5, 4, 2, ',').blob(30, 21, 5, 2, ',').blob(14, 19, 3, 2, ',');
  b.border('T');
  b.blob(22, 13, 5, 3, '~');
  // clear corridors then lay paths
  const main = [[0, 12], [16, 12], [16, 12], [28, 12], [34, 12], [34, 6]];
  b.path(main, '.', 3);
  b.path([[10, 12], [10, 23]], '.', 3).path([[34, 12], [40, 12], [40, 21]], '.', 3);
  b.blob(22, 13, 5, 3, '~', ['.', ',', 'f', 'T']);
  b.path([[0, 12], [16, 12]], '=').path([[16, 12], [28, 12]], 'B').path([[28, 12], [34, 12], [34, 6]], '=');
  b.path([[10, 12], [10, 22]], '=').path([[34, 12], [40, 12], [40, 19]], '=');
  b.blob(10, 23, 3, 2, '.').blob(40, 21, 2, 2, '.');
  // goblin camp
  b.rect(27, 1, 15, 6, '.');
  b.set(28, 2, 'N').set(40, 2, 'N').set(40, 5, 'N').set(28, 5, 'N');
  b.set(33, 4, 'O');
  b.rect(33, 0, 3, 1, '.');
  b.set(3, 11, 'S');
  // entry clear
  b.rect(0, 11, 2, 3, '.').rect(0, 12, 2, 1, '=');
  b.set(1, 10, 'T').set(1, 14, 'T');
  return b.rows();
}

// ------------------------------------------------------------------ IRONHOLD
function buildIronhold() {
  const b = MB(30, 22, '_', 11);
  b.border('r', 2);
  b.scatter('r', 0.03, ['_']);
  // buildings
  house(b, 4, 4, 6, 6);     // shop
  house(b, 20, 4, 6, 23);   // inn
  house(b, 4, 13, 6, 7);    // forge
  house(b, 20, 13, 6, 22);  // house
  // mine corridor
  b.rect(12, 0, 6, 5, 'r');
  b.rect(14, 2, 2, 4, '_');
  b.set(14, 2, 'M').set(15, 2, 'M');
  // main road
  b.path([[14, 21], [14, 6]], '=').path([[15, 21], [15, 6]], '=');
  b.path([[4, 8], [26, 8]], '=').path([[4, 17], [26, 17]], '=');
  b.rect(14, 20, 2, 2, '=');
  // decorations
  b.set(11, 10, 'S');
  b.blob(8, 10, 1, 0, 'f', ['_']).blob(22, 10, 1, 0, 'f', ['_']);
  b.set(3, 8, '_').set(26, 17, '=');
  // keep door fronts clear
  [[6, 7], [23, 7], [7, 16], [22, 16]].forEach(([x, y]) => b.set(x, y, '='));
  return b.rows();
}

// ------------------------------------------------------------------ MINE
function buildMine() {
  const b = MB(40, 30, 'r', 21);
  b.path([[20, 29], [20, 22], [6, 22], [6, 10], [26, 10], [26, 5], [31, 5]], 'c', 3);
  b.path([[6, 22], [6, 26]], 'c', 3).blob(6, 26, 2, 1, 'c');
  b.path([[26, 10], [34, 10], [34, 19]], 'c', 3).blob(34, 20, 2, 1, 'c');
  b.path([[14, 10], [14, 16]], 'c', 3).blob(14, 17, 3, 2, 'c');
  b.blob(15, 18, 2, 1, '~', ['c']);
  b.blob(31, 5, 4, 3, 'c');
  b.path([[35, 5], [39, 5]], 'c', 1);
  b.scatter('r', 0.03, ['c']);
  // guarantee main route stays clear after scatter
  b.path([[20, 29], [20, 22], [6, 22], [6, 10], [26, 10], [26, 5], [31, 5], [39, 5]], 'c', 1);
  b.path([[6, 22], [6, 26]], 'c').path([[26, 10], [34, 10], [34, 20]], 'c').path([[14, 10], [14, 16]], 'c');
  return b.rows();
}

// ------------------------------------------------------------------ WASTES
function buildWastes() {
  const b = MB(40, 26, 'a', 33);
  b.scatter('X', 0.06).scatter('r', 0.05, ['a']);
  b.blob(20, 20, 3, 2, 'L').blob(35, 19, 2, 2, 'L').blob(6, 21, 2, 1, 'L').blob(24, 7, 2, 1, 'L');
  b.border('r');
  b.rect(19, 0, 21, 3, '#');
  b.path([[0, 13], [30, 13], [30, 3]], 'a', 3);
  b.blob(12, 13, 4, 3, 'a');
  b.path([[0, 13], [30, 13], [30, 3]], 'd');
  b.set(30, 2, 'G');
  b.set(12, 11, 'O').set(9, 11, 'N').set(15, 11, 'N');
  b.set(3, 12, 'S');
  b.rect(0, 12, 1, 3, 'a').set(0, 13, 'd');
  return b.rows();
}

// ------------------------------------------------------------------ CASTLE
function buildCastle() {
  const b = MB(26, 30, '#', 44);
  b.rect(2, 2, 22, 26, 'p');
  b.rect(2, 14, 22, 1, '#');
  b.rect(11, 14, 4, 1, 'p');
  b.set(4, 14, 'p').set(21, 14, 'p');
  for (let y = 5; y < 27; y += 4) { b.set(7, y, 'P'); b.set(18, y, 'P'); }
  b.rect(12, 4, 2, 26, 'K');
  b.set(12, 3, 'H').set(13, 3, 'H');
  b.rect(12, 28, 2, 2, 'K');
  b.set(4, 3, 'L').set(21, 3, 'L');
  return b.rows();
}

// ------------------------------------------------------------------ MAP TABLE
const MAPS = {
  village: {
    name: 'Aldmere Village', music: 'village', theme: 'grass', edge: 'T',
    rows: VILLAGE_ROWS, encounters: null,
    npcs: [
      { id: 'elder', x: 5, y: 5, spr: 'elder', dir: 'down', script: 'elder' },
      { id: 'shopkeep', x: 16, y: 5, spr: 'shop', dir: 'down', script: 'shopVillage' },
      { id: 'innkeep', x: 25, y: 6, spr: 'inn', dir: 'down', script: 'inn' },
      { id: 'kid', x: 8, y: 12, spr: 'kid', dir: 'down', script: 'kid', wander: 2 },
      { id: 'woman', x: 4, y: 9, spr: 'woman', dir: 'down', script: 'woman', wander: 1 },
      { id: 'guard', x: 27, y: 7, spr: 'guard', dir: 'left', script: 'guardVillage' },
      { id: 'farmer', x: 20, y: 11, spr: 'villager', dir: 'down', script: 'farmer', wander: 2 },
      { id: 'malgrathV', x: 22, y: 15, spr: 'king', dir: 'down', script: 'malgrathVillage', show: 'end_mercy' }
    ],
    warps: [{ x: 29, y: 8, w: 1, h: 3, to: 'forest', tx: 1, ty: 11 }],
    chests: [],
    signs: {}
  },
  forest: {
    name: 'Whisperwood', music: 'field', theme: 'grass', edge: 'T', lvl: 3,
    rows: buildForest(),
    encounters: [['slime', 3], ['bat', 2], ['wolf', 2], ['goblin', 1]], bg: 'forest',
    npcs: [
      { id: 'lyraTied', x: 31, y: 3, spr: 'lyra', dir: 'down', script: 'lyraTied', show: '!chief' },
      { id: 'chief', x: 34, y: 3, spr: 'chief', dir: 'down', script: 'chief', show: '!chief' },
      { id: 'gob1', x: 33, y: 1, spr: 'goblin', dir: 'down', script: 'goblinGuard', show: '!chief' },
      { id: 'gob2', x: 35, y: 1, spr: 'goblin', dir: 'down', script: 'goblinGuard', show: '!chief' },
      { id: 'gob3', x: 34, y: 1, spr: 'goblin', dir: 'down', script: 'goblinGuard', show: '!chief' }
    ],
    warps: [
      { x: 0, y: 11, w: 1, h: 3, to: 'village', tx: 28, ty: 8 },
      { x: 33, y: 0, w: 3, h: 1, to: 'ironhold', tx: 14, ty: 20, clamp: true }
    ],
    chests: [
      { id: 'f1', x: 10, y: 24, item: 'potion', qty: 3 },
      { id: 'f2', x: 41, y: 22, item: 'ether', qty: 2 },
      { id: 'f3', x: 39, y: 3, gold: 80 }
    ],
    signs: { '3,11': 'West: Aldmere Village.  North: Ironhold (past the goblin camp, sorry).' }
  },
  ironhold: {
    name: 'Ironhold', music: 'town', theme: 'town', edge: 'r',
    rows: buildIronhold(), encounters: null,
    npcs: [
      { id: 'garrick', x: 14, y: 5, spr: 'garrick', dir: 'down', script: 'garrick', show: '!garrick' },
      { id: 'mineguard', x: 15, y: 5, spr: 'dwarf', dir: 'down', script: 'mineGuard', show: '!garrick' },
      { id: 'shopI', x: 6, y: 7, spr: 'shop', dir: 'down', script: 'shopIronhold' },
      { id: 'innI', x: 23, y: 7, spr: 'inn', dir: 'down', script: 'inn' },
      { id: 'smith', x: 7, y: 16, spr: 'smith', dir: 'down', script: 'smith' },
      { id: 'dwarf1', x: 18, y: 11, spr: 'dwarf', dir: 'down', script: 'dwarfTalk', wander: 2 },
      { id: 'dwarf2', x: 7, y: 19, spr: 'dwarf', dir: 'down', script: 'dwarfTalk2', wander: 2 },
      { id: 'kidI', x: 22, y: 16, spr: 'kid', dir: 'down', script: 'kidIronhold' }
    ],
    warps: [
      { x: 14, y: 21, w: 2, h: 1, to: 'forest', tx: 34, ty: 1, clamp: true },
      { x: 14, y: 2, w: 2, h: 1, to: 'mine', tx: 20, ty: 28, clamp: true }
    ],
    chests: [],
    signs: { '11,10': 'IRONHOLD — Est. by Dwarves Who Dig Too Deep. North: the Old Mine.' }
  },
  mine: {
    name: 'The Old Mine', music: 'mine', theme: 'cave', edge: 'r', lvl: 9, dark: true,
    rows: buildMine(),
    encounters: [['skeleton', 3], ['cavebat', 3], ['bslime', 2]], bg: 'cave',
    npcs: [
      { id: 'golem', x: 36, y: 5, spr: 'm:golem', dir: 'left', script: 'golem', show: '!golem' }
    ],
    warps: [
      { x: 19, y: 29, w: 3, h: 1, to: 'ironhold', tx: 14, ty: 3, clamp: true },
      { x: 39, y: 5, w: 1, h: 1, to: 'wastes', tx: 1, ty: 13 }
    ],
    chests: [
      { id: 'm1', x: 6, y: 27, item: 'phoenix', qty: 1 },
      { id: 'm2', x: 34, y: 21, gold: 300 },
      { id: 'm3', x: 11, y: 17, item: 'hipotion', qty: 2 }
    ],
    signs: {}
  },
  wastes: {
    name: 'Ashen Wastes', music: 'wastes', theme: 'ash', edge: 'r', lvl: 15,
    rows: buildWastes(),
    encounters: [['orc', 2], ['rslime', 3], ['swolf', 2]], bg: 'wastes',
    npcs: [
      { id: 'merchant', x: 10, y: 12, spr: 'merchant', dir: 'down', script: 'shopCamp' },
      { id: 'healer', x: 14, y: 12, spr: 'healer', dir: 'down', script: 'healer' }
    ],
    warps: [
      { x: 0, y: 12, w: 1, h: 3, to: 'mine', tx: 38, ty: 5, clamp: true },
      { x: 30, y: 2, w: 1, h: 1, to: 'castle', tx: 12, ty: 27 }
    ],
    chests: [{ id: 'w1', x: 36, y: 22, item: 'mega', qty: 1 }],
    signs: { '3,12': 'The camp ahead is the last safe fire before the Demon Castle.' },
    safe: [[8, 10, 9, 7]]
  },
  castle: {
    name: 'Demon Castle', music: 'castle', theme: 'castle', edge: '#', lvl: 18,
    rows: buildCastle(),
    encounters: [['dknight', 2], ['imp', 3], ['swolf', 1]], bg: 'castle',
    npcs: [
      { id: 'king', x: 12, y: 4, spr: 'king', dir: 'down', script: 'king', show: '!ended' }
    ],
    warps: [{ x: 12, y: 29, w: 2, h: 1, to: 'wastes', tx: 30, ty: 3, clamp: true }],
    chests: [
      { id: 'c1', x: 3, y: 16, item: 'truckblade', qty: 1 },
      { id: 'c2', x: 22, y: 16, item: 'mega', qty: 2 },
      { id: 'c3', x: 3, y: 26, item: 'phoenix', qty: 2 },
      { id: 'c4', x: 22, y: 26, gold: 800 }
    ],
    signs: {},
    safe: [[2, 2, 22, 6]]
  }
};

const QUEST_AREAS = ['forest', 'mine', 'wastes', 'castle'];
