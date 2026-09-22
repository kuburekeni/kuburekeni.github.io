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

// ------------------------------------------------------------------ building helpers
// timber house: two rows of roof, one row of wall with a door (E = enterable, D = locked)
function house(b, x, y, w, doorX, door = 'E') {
  b.rect(x, y, w, 2, 'R');
  b.rect(x, y + 2, w, 1, 'W');
  b.set(doorX, y + 2, door);
}
// dressed-stone hall: roof rows, then stone walls with windows; doors on the bottom row
function stoneHall(b, x, y, w, roofRows, wallRows, doors, door = ']') {
  b.rect(x, y, w, roofRows, 'R');
  b.rect(x, y + roofRows, w, wallRows, '+');
  for (let r = 0; r < wallRows - 1; r++) for (let i = x + 1; i < x + w - 1; i += 3) b.set(i, y + roofRows + r, '[');
  const by = y + roofRows + wallRows - 1;
  for (let i = x + 2; i < x + w - 2; i += 4) b.set(i, by, '[');
  for (const dx of doors) { b.set(dx, by, door); }
  return by;
}
// clear walkable ground in front of every door so nothing ever blocks it
function frontClear(b, pts, c = '=') { for (const [x, y] of pts) b.set(x, y, c); }

// ------------------------------------------------------------------ VALENFORD (home)
function buildValenford() {
  const b = MB(48, 38, '.', 101);
  b.scatter('T', 0.05).scatter(',', 0.05, ['.']).scatter('f', 0.025, ['.']);
  b.border('T');
  for (let y = 1; y < 37; y++) { if (b.rnd() < 0.6) b.set(1, y, 'T'); if (b.rnd() < 0.6) b.set(46, y, 'T'); }
  // clear the heart of town
  b.rect(3, 2, 42, 33, '.');
  b.scatter(',', 0.04, ['.']).scatter('f', 0.02, ['.']);
  // Valen Manor
  b.rect(13, 1, 22, 11, '.');
  stoneHall(b, 15, 1, 18, 2, 4, [23, 24]);
  b.rect(15, 7, 18, 5, ':');
  b.rect(14, 7, 1, 5, '4'); b.rect(33, 7, 1, 5, '4');
  b.set(18, 9, '6').set(29, 9, '6');
  b.set(15, 7, '@').set(32, 7, '@');
  // training yard (west)
  b.rect(2, 3, 11, 8, ';');
  b.rect(2, 3, 11, 1, 'F').rect(2, 10, 11, 1, 'F').rect(2, 3, 1, 8, 'F').rect(12, 3, 1, 8, 'F');
  b.set(12, 7, ';').set(12, 8, ';');
  b.set(4, 5, '>').set(10, 5, '>').set(4, 8, '<');
  b.set(13, 6, 'S');
  // stables (east)
  house(b, 36, 2, 9, 40, 'D');
  b.rect(35, 6, 11, 5, ';');
  b.rect(35, 10, 11, 1, 'F'); b.rect(45, 6, 1, 5, 'F'); b.set(35, 6, 'F');
  b.set(37, 7, '>').set(43, 7, '>').set(44, 9, '>');
  // roads
  b.path([[23, 12], [23, 37]], '=').path([[24, 12], [24, 37]], '=');
  b.path([[4, 20], [44, 20]], '=');
  b.path([[33, 8], [36, 8]], ';');
  b.path([[7, 11], [7, 20]], '=');
  // houses along the high street
  house(b, 4, 15, 7, 7);     // Harlan's Goods (shop)
  house(b, 13, 15, 8, 16);   // The Gilded Stirrup (inn)
  house(b, 28, 15, 6, 30, 'D');
  house(b, 37, 15, 7, 40, 'D');
  frontClear(b, [[7, 18], [7, 19], [16, 18], [16, 19], [30, 18], [30, 19], [40, 18], [40, 19]]);
  // market square
  b.rect(18, 22, 12, 5, ':');
  b.set(21, 24, '0');
  b.set(26, 22, '*').set(28, 22, '*').set(26, 26, '*');
  b.set(25, 19, 'Q');
  b.set(22, 21, '@').set(25, 21, '@');
  // lower houses
  house(b, 5, 23, 6, 8, 'D'); house(b, 12, 24, 5, 14, 'D'); house(b, 31, 23, 6, 33, 'D');
  frontClear(b, [[8, 26], [14, 27], [33, 26]], '.');
  // farmland south-east
  b.rect(33, 28, 12, 7, '%');
  b.rect(34, 29, 10, 2, '&').rect(34, 32, 10, 2, '&');
  // graveyard south-west
  b.rect(3, 29, 10, 6, '.');
  b.rect(3, 29, 10, 1, '4');
  for (let i = 4; i < 12; i += 2) { b.set(i, 31, '?'); b.set(i + 1, 33, '?'); }
  b.set(24, 34, 'S');
  return b.rows();
}
const MANOR_ROWS = (() => {
  const b = MB(22, 14, 'o', 3);
  b.border('V');
  for (const x of [3, 9, 12, 18]) b.set(x, 0, 'y');
  b.rect(7, 1, 1, 5, 'V').rect(14, 1, 1, 5, 'V');
  b.set(7, 4, 'o').set(14, 4, 'o');
  // nursery / your room (west)
  b.set(1, 1, '{').set(5, 1, '$').set(6, 1, 'h').set(1, 5, 'k').set(4, 3, 'm');
  // great hall
  b.set(8, 1, 'b').set(9, 1, 'b').set(10, 1, 'z').set(11, 1, 'z').set(12, 1, 'b').set(13, 1, 'b');
  // study (east)
  b.rect(15, 1, 6, 1, 'b').set(17, 3, 't').set(18, 3, 't').set(16, 3, 'u').set(19, 3, 'u');
  b.rect(10, 2, 2, 12, '-');
  b.set(2, 8, 'e').set(19, 8, 'e').set(4, 10, 't').set(5, 10, 't').set(16, 10, 't').set(17, 10, 't');
  b.set(3, 10, 'u').set(6, 10, 'u').set(15, 10, 'u').set(18, 10, 'u');
  b.set(1, 12, 'k').set(20, 12, 'k');
  b.set(10, 13, 'x').set(11, 13, 'x');
  return b.rows();
})();

// the old mill, the night of the prologue
function buildMillNight() {
  const b = MB(30, 24, '.', 55);
  b.scatter('T', 0.1).scatter(',', 0.08, ['.']);
  b.border('T');
  b.blob(8, 14, 5, 3, '&', ['.', ',', 'T']);
  b.blob(22, 9, 3, 2, '~', ['.', ',', 'T']);
  b.rect(10, 2, 10, 8, '.');
  house(b, 11, 3, 8, 15, 'D');
  b.set(19, 5, '>').set(10, 5, '>');
  b.path([[15, 23], [15, 6]], '=');
  b.path([[15, 14], [20, 14], [20, 11]], ';');
  b.rect(18, 10, 6, 5, '.');
  b.set(14, 21, '@').set(16, 17, '@');
  return b.rows();
}

// ------------------------------------------------------------------ BROOKVALE
function buildBrookvale() {
  const b = MB(44, 30, '.', 202);
  b.scatter('T', 0.04).scatter(',', 0.05, ['.']).scatter('f', 0.03, ['.']);
  b.border('T');
  // river
  b.path([[28, 0], [28, 29]], '~').path([[29, 0], [29, 29]], '~');
  b.set(27, 7, '~').set(30, 22, '~');
  // chapel of the Dawn
  b.rect(4, 1, 14, 8, '.');
  stoneHall(b, 5, 1, 12, 2, 4, [10, 11]);
  b.set(5, 7, '4').set(16, 7, '4').set(6, 7, '@').set(15, 7, '@');
  // graveyard
  b.rect(19, 2, 7, 7, '.');
  b.rect(19, 2, 7, 1, 'F').rect(19, 8, 7, 1, 'F').rect(25, 2, 1, 7, 'F');
  for (let i = 20; i < 25; i += 2) { b.set(i, 4, '?'); b.set(i + 1, 6, '?'); }
  b.set(19, 5, '.');
  // homes
  house(b, 3, 10, 7, 6);       // The Mossy Kettle (inn)
  house(b, 12, 10, 6, 14);     // Pell's Provisions (shop)
  house(b, 20, 10, 6, 22, 'D');
  house(b, 4, 18, 6, 6, 'D'); house(b, 13, 18, 6, 15, 'D'); house(b, 20, 18, 5, 22, 'D');
  frontClear(b, [[6, 13], [14, 13], [22, 13], [6, 21], [15, 21], [22, 21]], '.');
  // the road and the bridge
  b.path([[0, 15], [43, 15]], '=');
  b.path([[28, 15], [29, 15]], 'B');
  b.path([[10, 8], [10, 15]], '=').path([[11, 8], [11, 15]], '=');
  b.set(18, 14, 'Q').set(9, 16, '0');
  // east bank: the mill and the fields
  house(b, 33, 4, 7, 36, 'D');
  b.set(32, 7, '>').set(40, 7, '>');
  b.rect(32, 18, 10, 8, '%');
  b.rect(33, 19, 8, 2, '&').rect(33, 22, 8, 2, '&');
  b.path([[36, 8], [36, 15]], ';');
  b.set(2, 14, 'S').set(41, 14, 'S');
  return b.rows();
}
const CHAPEL_ROWS = (() => {
  const b = MB(16, 12, 'o', 9);
  b.border('V');
  for (const x of [2, 5, 10, 13]) b.set(x, 0, 'y');
  b.rect(7, 1, 2, 11, '-');
  b.set(6, 1, 'e').set(9, 1, 'e').set(1, 1, 'b').set(2, 1, 'b').set(13, 1, 'b').set(14, 1, 'b');
  for (const y of [4, 6, 8]) { b.rect(2, y, 4, 1, 'u'); b.rect(10, y, 4, 1, 'u'); }
  b.set(1, 10, 'k').set(14, 10, 'k');
  b.set(7, 11, 'x').set(8, 11, 'x');
  return b.rows();
})();

// ------------------------------------------------------------------ FERNHOLLOW (forest village + the deep woods)
function buildFernhollow() {
  const b = MB(46, 36, '.', 303);
  b.scatter('T', 0.2).scatter(',', 0.07, ['.']).scatter('f', 0.02, ['.']);
  b.border('T');
  // the glade
  b.blob(14, 10, 11, 7, '.', ['T', ',', 'f', '.']);
  house(b, 8, 3, 9, 12);           // ranger lodge
  b.set(19, 5, '<').set(22, 6, '<').set(6, 12, '*').set(20, 10, 'O').set(24, 12, '<');
  b.set(5, 7, '>').set(18, 12, '0');
  frontClear(b, [[12, 6]], '.');
  // paths into the woods
  b.path([[0, 10], [14, 10]], '=').path([[12, 7], [12, 10]], '=');
  b.path([[14, 10], [14, 18], [30, 18], [30, 24], [34, 24]], '.', 3);
  b.path([[30, 24], [30, 30], [40, 30], [40, 32]], '.', 3);
  b.path([[14, 18], [8, 18], [8, 28]], '.', 3);
  b.path([[14, 10], [14, 18], [30, 18], [30, 24]], ';');
  b.path([[30, 24], [30, 30], [40, 30]], ';').path([[14, 18], [8, 18], [8, 27]], ';');
  // poachers' camp
  b.blob(35, 23, 5, 3, '.');
  b.set(33, 21, '<').set(38, 21, '<').set(36, 25, 'O').set(39, 25, 'k');
  // the Old Thorn's hollow
  b.blob(40, 31, 4, 3, ',');
  b.blob(8, 29, 3, 2, '.');
  b.blob(22, 26, 3, 2, '~', ['.', ',', 'T', 'f']);
  b.set(3, 9, 'S');
  b.rect(0, 9, 2, 3, '.').set(0, 10, '=').set(1, 10, '=');
  return b.rows();
}

// ------------------------------------------------------------------ SOLMERE (the capital)
function buildSolmere() {
  const b = MB(52, 42, ':', 404);
  b.border('+', 2);
  for (let x = 2; x < 50; x += 4) b.set(x, 1, '!');
  // palace
  b.rect(2, 2, 48, 10, ':');
  stoneHall(b, 15, 2, 22, 3, 4, [25, 26]);
  b.rect(14, 2, 1, 7, '4'); b.rect(37, 2, 1, 7, '4');
  // grand plaza
  b.set(25, 13, '6').set(26, 13, '6');
  b.set(21, 12, '@').set(30, 12, '@').set(21, 16, '@').set(30, 16, '@');
  b.rect(16, 11, 1, 7, '4').rect(35, 11, 1, 7, '4');
  b.set(33, 11, 'Q');
  // gardens with trees
  for (const [x, y] of [[4, 4], [7, 6], [10, 4], [42, 4], [45, 6], [40, 7], [5, 9], [46, 9]]) b.set(x, y, 'q');
  // west quarter: shop
  house(b, 4, 14, 8, 8);
  // market row
  for (let x = 18; x < 34; x += 3) b.set(x, 21, '*');
  // east quarter: homes of the well-off
  house(b, 39, 14, 8, 42, 'D'); house(b, 39, 22, 8, 43, 'D');
  // the Gutter (south-west) and the Gutter Rose
  b.rect(3, 26, 16, 12, ';');
  house(b, 5, 28, 9, 9);
  house(b, 15, 31, 4, 16, 'D');
  b.set(4, 35, 'k').set(12, 35, 'k').set(17, 26, 'k');
  // south-east: barracks yard and a well
  house(b, 36, 30, 10, 40, 'D');
  b.set(30, 33, '0');
  frontClear(b, [[25, 9], [26, 9], [8, 17], [42, 17], [43, 25], [9, 31], [16, 34], [40, 33]], ':');
  // south gate
  b.rect(24, 40, 4, 2, ':');
  b.set(23, 39, '!').set(28, 39, '!');
  b.set(22, 37, 'S');
  return b.rows();
}
const PALACE_ROWS = (() => {
  const b = MB(24, 16, 'p', 12);
  b.border('#');
  b.rect(11, 1, 2, 15, 'K');
  b.set(11, 1, 'H').set(12, 1, 'H');
  for (let y = 3; y < 15; y += 3) { b.set(6, y, 'P'); b.set(17, y, 'P'); }
  b.set(3, 1, 'L').set(20, 1, 'L');
  b.set(11, 15, 'x').set(12, 15, 'x');
  return b.rows();
})();

// ------------------------------------------------------------------ WHISPERWOOD
function buildForest() {
  const b = MB(44, 28, '.', 7);
  b.scatter('T', 0.17).scatter(',', 0.06, ['.']).scatter('f', 0.02, ['.']);
  b.blob(9, 5, 4, 2, ',').blob(30, 21, 5, 2, ',').blob(14, 19, 3, 2, ',');
  b.border('T');
  b.blob(22, 13, 5, 3, '~');
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
  b.rect(0, 11, 2, 3, '.').rect(0, 12, 2, 1, '=');
  b.set(1, 10, 'T').set(1, 14, 'T');
  // a forgotten shrine in the south-west
  b.blob(4, 22, 3, 2, '.');
  b.set(4, 21, '?');
  return b.rows();
}
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

// ------------------------------------------------------------------ Tokyo (tutorial)
function buildTokyo() {
  const b = MB(44, 26, 'j', 11);
  b.rect(0, 0, 44, 2, 'J');
  for (let x = 0; x < 44; x += 3) b.set(x, 1, 'I');
  // school compound
  b.rect(0, 2, 18, 10, 'w');
  b.rect(1, 3, 16, 8, '_');
  b.rect(1, 3, 11, 2, '8');
  b.rect(12, 5, 4, 3, '5');
  b.set(3, 6, 'q').set(3, 9, 'q').set(16, 9, 'q');
  b.set(5, 8, '1');
  b.set(7, 11, '9').set(10, 11, '9');
  b.rect(8, 11, 2, 1, '_');
  // shops row
  b.rect(19, 2, 2, 10, 'J'); b.set(19, 4, 'I').set(19, 8, 'I');
  b.rect(22, 6, 7, 5, 'J'); b.set(23, 7, 'I').set(26, 8, 'I');
  b.rect(22, 11, 7, 1, 'U'); b.set(25, 11, 'n');
  b.set(29, 11, 'v').set(30, 11, 'v');
  b.rect(21, 2, 12, 4, 'J'); b.set(24, 3, 'I').set(28, 4, 'I');
  b.set(31, 9, '7').set(21, 9, '7');
  // shrine
  b.rect(33, 2, 11, 10, '2');
  b.rect(34, 3, 9, 8, '.');
  b.rect(35, 3, 6, 2, 'i');
  b.rect(37, 5, 2, 7, 's');
  b.set(36, 11, 'g').set(39, 11, 'g');
  b.rect(37, 11, 2, 1, 's');
  b.set(34, 4, 'q').set(42, 4, 'q').set(34, 9, 'q').set(42, 8, 'q');
  b.set(35, 7, '1').set(41, 7, '1');
  // street
  for (let x = 2; x < 44; x += 7) if (x !== 30) b.set(x, 12, 'l');
  b.set(32, 12, '3');
  b.rect(0, 14, 44, 4, 'A');
  b.rect(30, 14, 2, 4, 'Y');
  // the far side (home)
  b.rect(0, 18, 44, 2, 'j');
  for (let x = 4; x < 44; x += 7) b.set(x, 18, 'l');
  b.set(32, 18, '3');
  b.rect(0, 20, 44, 6, 'J');
  for (let x = 1; x < 44; x += 3) b.set(x, 21, 'I');
  for (let x = 2; x < 44; x += 4) b.set(x, 23, 'I');
  b.set(33, 20, 'E');
  return b.rows();
}

// ------------------------------------------------------------------ interiors
const SHOP_ROWS = [
  'VVVyVVVVyVVV',
  'VhhhhVVhhhhV',
  'VooooooooooV',
  'VCCCCooooeeV',
  'VooooooooooV',
  'VhooommoooeV',
  'VhooommoooeV',
  'VkoooooooookV'.slice(0, 11) + 'V',
  'VVVVVxxVVVVV'
];
const TAVERN_ROWS = [
  'VVyVVVVyVVVVyVVV',
  'VkkooooooobbozzV',
  'VCCCCCCooooooooV',
  'VuuuuuuooooooooV',
  'VoooooooommmmooV',
  'VotuootuommmmooV',
  'VoooooooommmmooV',
  'VotuootuoooooooV',
  'Vk' + 'o'.repeat(12) + 'kV',
  'VVVVVVVxxVVVVVVV'
];
const KONBINI_ROWS = [
  'VVyVVVVVVyVV',
  'VeehhhhhhheV',
  'VooooooooooV',
  'VohhoohhoooV',
  'VooooooooooV',
  'VohhoohhCCCV',
  'VooooooooooV',
  'VVVVVxxVVVVV'
];
const SHOP_POIS = [
  { x: 9, y: 4, dir: 'up', act: 'display' }, { x: 2, y: 5, dir: 'left', act: 'display' },
  { x: 7, y: 7, dir: 'down', act: 'door' }, { x: 8, y: 2, dir: 'up', act: 'display' }
];
const TAVERN_POIS = [
  { x: 10, y: 2, dir: 'up', act: 'book' }, { x: 13, y: 2, dir: 'up', act: 'fire' },
  { x: 8, y: 8, dir: 'down', act: 'door' }, { x: 5, y: 3, dir: 'up', act: 'bar' },
  { x: 3, y: 5, dir: 'left', act: 'sit' }
];

function buildCastle2() {
  const rows = buildCastle().map(r => r.split(''));
  const r14 = rows[14];
  for (let x = 2; x < 24; x++) r14[x] = '#';
  r14[12] = 'Z'; r14[13] = 'Z';
  return rows.map(r => r.join(''));
}
function withDoors(rows, doors) {
  const g = rows.map(r => r.split(''));
  for (const [x, y, c] of doors) g[y][x] = c;
  return g.map(r => r.join(''));
}


// ------------------------------------------------------------------ MAP TABLE
// show: flag expression ('!x' = not set, 'a&b' = both). warps may set dir.
// to: '@travel' opens the road: dests lists the places you can walk to from that exit.
// door warps sit on the door tile itself (doors are solid; bumping one takes you through).
const TAVERN_NPCS = (id, keeper, script, extra) => [{ id: id + 'Keep', x: 3, y: 1, spr: keeper, dir: 'down', script }, ...(extra || [])];
const MAPS = {
  tokyo: {
    name: 'Setagaya, Tokyo', music: 'tokyo', theme: 'tokyo', edge: 'J', encounters: null, fx: 'petals', ambient: 'rgba(90,40,90,.18)', tutorial: true,
    rows: buildTokyo(),
    npcs: [
      { id: 'aoi', x: 8, y: 9, spr: 'aoi', dir: 'down', script: 'aoi' },
      { id: 'daichi', x: 13, y: 8, spr: 'daichi', dir: 'down', script: 'daichi' },
      { id: 'stu1', x: 4, y: 5, spr: 'student', dir: 'right', script: 'tStudent', wander: 2 },
      { id: 'stu2', x: 14, y: 4, spr: 'aoi', dir: 'down', script: 'tStudent2' },
      { id: 'salary', x: 17, y: 12, spr: 'salary', dir: 'left', script: 'tSalary', wander: 3 },
      { id: 'priest', x: 38, y: 6, spr: 'priest', dir: 'down', script: 'tPriest' },
      { id: 'girlchild', x: 33, y: 18, spr: 'girlchild', dir: 'up', script: 'none', show: 'crossing' }
    ],
    warps: [{ x: 25, y: 11, w: 1, h: 1, to: 'konbini', tx: 5, ty: 6, dir: 'up' }],
    triggers: [
      { x: 8, y: 12, w: 2, h: 1, script: 'tLeaveSchool' },
      { x: 30, y: 14, w: 2, h: 1, script: 'tCrossing' }
    ],
    chests: [],
    signs: { '12,4': 'Seiryo High School — Kendo Club. "Discipline is remembering what you want."', '37,11': 'Kitazawa Inari Shrine. Pray for those you love.', '21,12': '' }
  },
  konbini: {
    name: 'Family Mart', music: 'tokyo', theme: 'tokyo', edge: 'V', encounters: null, interior: true, ambient: 'rgba(200,230,255,.06)',
    rows: KONBINI_ROWS,
    npcs: [{ id: 'clerk', x: 9, y: 4, spr: 'clerk', dir: 'down', script: 'tClerk' }],
    warps: [{ x: 5, y: 7, w: 2, h: 1, to: 'tokyo', tx: 25, ty: 12, dir: 'down', clamp: true }],
    pois: [{ x: 3, y: 2, dir: 'up', act: 'display' }, { x: 7, y: 4, dir: 'up', act: 'display' }, { x: 6, y: 6, dir: 'down', act: 'door' }],
    chests: [], signs: {}
  },

  // ============================================================ HOUSE VALEN
  valenford: {
    name: 'Valenford', music: 'manor', theme: 'grass', edge: 'T', fx: 'leaves', ambient: 'rgba(255,210,140,.05)', encounters: null, node: 'valenford',
    rows: buildValenford(),
    npcs: [
      { id: 'corwin', x: 7, y: 6, spr: 'swordmaster', dir: 'down', script: 'corwin' },
      { id: 'wren', x: 39, y: 8, spr: 'wren', dir: 'down', script: 'wren', show: 'youth&!in_wren&!wrenGone' },
      { id: 'stablehand', x: 42, y: 8, spr: 'stablehand', dir: 'left', script: 'stablehand' },
      { id: 'vf1', x: 10, y: 21, spr: 'villager3', dir: 'down', script: 'valenFolk1', wander: 2 },
      { id: 'vf2', x: 30, y: 25, spr: 'woman2', dir: 'down', script: 'valenFolk2', wander: 1 },
      { id: 'vkid', x: 20, y: 27, spr: 'kid2', dir: 'down', script: 'valenKid', wander: 2 },
      { id: 'vfarm', x: 38, y: 27, spr: 'farmer', dir: 'down', script: 'valenFarmer', wander: 2 },
      { id: 'vmarket', x: 27, y: 23, spr: 'villager2', dir: 'down', script: 'valenMarket' },
      { id: 'vguard', x: 22, y: 34, spr: 'guard', dir: 'right', script: 'valenGuard' },
      { id: 'vgrave', x: 7, y: 32, spr: 'noblewoman', dir: 'up', script: 'valenGrave', show: 'youth' }
    ],
    warps: [
      { x: 23, y: 6, w: 2, h: 1, to: 'valen_manor', tx: 10, ty: 12, dir: 'up' },
      { x: 7, y: 17, w: 1, h: 1, to: 'valen_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 16, y: 17, w: 1, h: 1, to: 'valen_inn', tx: 7, ty: 8, dir: 'up' },
      { x: 23, y: 37, w: 2, h: 1, to: '@travel', dests: ['brookvale', 'solmere'] }
    ],
    chests: [{ id: 'vf1', x: 44, y: 34, item: 'potion', qty: 2 }],
    signs: { '13,6': 'The Valen practice yard. "A blade is a promise you keep with your hands."', '24,34': 'VALENFORD. South road: Brookvale (east), Solmere, the capital (south).' }
  },
  valen_manor: {
    name: 'Valen Manor', music: 'manor', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,200,120,.08)',
    rows: MANOR_ROWS, encounters: null,
    pois: [{ x: 9, y: 2, dir: 'up', act: 'book' }, { x: 11, y: 3, dir: 'up', act: 'fire' }, { x: 16, y: 2, dir: 'up', act: 'book' }, { x: 3, y: 9, dir: 'left', act: 'display' }, { x: 10, y: 11, dir: 'down', act: 'door' }],
    npcs: [
      { id: 'father', x: 9, y: 4, spr: 'father', dir: 'down', script: 'father' },
      { id: 'mother', x: 12, y: 4, spr: 'mother', dir: 'down', script: 'mother' },
      { id: 'nanny', x: 3, y: 4, spr: 'nanny', dir: 'down', script: 'nanny', show: '!youth' },
      { id: 'courtmage', x: 18, y: 2, spr: 'courtmage', dir: 'down', script: 'courtmage' },
      { id: 'butler', x: 14, y: 11, spr: 'butler', dir: 'left', script: 'butler' },
      { id: 'maid', x: 5, y: 8, spr: 'maid', dir: 'down', script: 'maid', wander: 2 }
    ],
    warps: [{ x: 10, y: 13, w: 2, h: 1, to: 'valenford', tx: 23, ty: 7, dir: 'down', clamp: true }],
    chests: [], signs: {}
  },
  valen_shop: {
    name: 'Harlan\'s Goods', music: 'manor', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,110,.08)',
    rows: SHOP_ROWS, pois: SHOP_POIS, encounters: null,
    npcs: [{ id: 'harlan', x: 2, y: 2, spr: 'shop', dir: 'down', script: 'shopValen' }],
    warps: [{ x: 5, y: 8, w: 2, h: 1, to: 'valenford', tx: 7, ty: 18, dir: 'down' }],
    chests: [], signs: {}
  },
  valen_inn: {
    name: 'The Gilded Stirrup', music: 'manor', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,170,90,.10)',
    rows: TAVERN_ROWS, pois: TAVERN_POIS, encounters: null,
    npcs: TAVERN_NPCS('valenInn', 'inn', 'inn', [
      { id: 'valenPatron', x: 7, y: 5, spr: 'hunter2', dir: 'left', script: 'valenPatron' },
      { id: 'valenBard', x: 12, y: 4, spr: 'villager2', dir: 'down', script: 'valenBard' }
    ]),
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'valenford', tx: 16, ty: 18, dir: 'down' }],
    chests: [], signs: {}
  },
  millnight: {
    name: 'The Old Mill, at night', music: 'night', theme: 'night', edge: 'T', encounters: null, dark: true, fx: 'fireflies', ambient: 'rgba(20,30,80,.35)',
    rows: buildMillNight(),
    npcs: [
      { id: 'wrenkid', x: 21, y: 11, spr: 'wrenkid', dir: 'left', script: 'none', show: '!millDone' },
      { id: 'mwolf1', x: 19, y: 12, spr: 'm:wolf', dir: 'right', script: 'none', show: 'millWolves' },
      { id: 'mwolf2', x: 23, y: 12, spr: 'm:wolf', dir: 'left', script: 'none', show: 'millWolves' }
    ],
    warps: [],
    triggers: [{ x: 13, y: 14, w: 5, h: 1, script: 'millEvent' }, { x: 14, y: 23, w: 3, h: 1, script: 'millBack' }],
    chests: [], signs: {}
  },

  // ============================================================ BROOKVALE
  brookvale: {
    name: 'Brookvale', music: 'village', theme: 'grass', edge: 'T', fx: 'leaves', ambient: 'rgba(255,200,120,.04)', encounters: null, node: 'brookvale',
    rows: buildBrookvale(),
    npcs: [
      { id: 'bfolk', x: 9, y: 17, spr: 'villager', dir: 'down', script: 'brookFolk', wander: 2 },
      { id: 'bfolk2', x: 24, y: 16, spr: 'woman', dir: 'down', script: 'brookFolk2', wander: 1 },
      { id: 'bkid', x: 17, y: 16, spr: 'kid', dir: 'down', script: 'brookKid', wander: 2 },
      { id: 'miller', x: 37, y: 8, spr: 'miller', dir: 'down', script: 'miller' },
      { id: 'ghost', x: 22, y: 5, spr: 'ghostgirl', dir: 'down', script: 'ghostgirl', show: '!elsieDone' },
      { id: 'bguard', x: 41, y: 16, spr: 'guard', dir: 'left', script: 'brookGuard' }
    ],
    warps: [
      { x: 10, y: 6, w: 2, h: 1, to: 'brookvale_chapel', tx: 7, ty: 10, dir: 'up' },
      { x: 6, y: 12, w: 1, h: 1, to: 'brookvale_inn', tx: 7, ty: 8, dir: 'up' },
      { x: 14, y: 12, w: 1, h: 1, to: 'brookvale_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 0, y: 15, w: 1, h: 1, to: '@travel', dests: ['valenford'] },
      { x: 43, y: 15, w: 1, h: 1, to: '@travel', dests: ['village', 'fernhollow'] }
    ],
    chests: [{ id: 'bv1', x: 41, y: 25, gold: 60 }],
    signs: { '2,14': 'West: Valenford.', '41,14': 'East: Aldmere and the Whisperwood. North-east, over the hills: Fernhollow.' }
  },
  brookvale_chapel: {
    name: 'Chapel of the Dawn', music: 'void', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,240,200,.10)',
    rows: CHAPEL_ROWS, encounters: null,
    pois: [{ x: 3, y: 5, dir: 'up', act: 'sit' }, { x: 11, y: 7, dir: 'up', act: 'sit' }, { x: 8, y: 9, dir: 'down', act: 'door' }],
    npcs: [
      { id: 'oswin', x: 7, y: 2, spr: 'oswin', dir: 'down', script: 'oswin', show: '!in_oswin&!oswinGone' },
      { id: 'sick', x: 12, y: 4, spr: 'villager', dir: 'left', script: 'feverPatient', show: '!feverCured' },
      { id: 'sick2', x: 3, y: 6, spr: 'woman', dir: 'right', script: 'feverPatient', show: '!feverCured' }
    ],
    warps: [{ x: 7, y: 11, w: 2, h: 1, to: 'brookvale', tx: 10, ty: 7, dir: 'down', clamp: true }],
    chests: [], signs: {}
  },
  brookvale_inn: {
    name: 'The Mossy Kettle', music: 'village', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,170,90,.10)',
    rows: TAVERN_ROWS, pois: TAVERN_POIS, encounters: null,
    npcs: TAVERN_NPCS('brookInn', 'inn', 'inn', [{ id: 'brookPatron', x: 7, y: 7, spr: 'farmer', dir: 'left', script: 'brookPatron' }]),
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'brookvale', tx: 6, ty: 13, dir: 'down' }],
    chests: [], signs: {}
  },
  brookvale_shop: {
    name: 'Pell\'s Provisions', music: 'village', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,110,.08)',
    rows: SHOP_ROWS, pois: SHOP_POIS, encounters: null,
    npcs: [{ id: 'pell', x: 2, y: 2, spr: 'shop', dir: 'down', script: 'shopBrook' }],
    warps: [{ x: 5, y: 8, w: 2, h: 1, to: 'brookvale', tx: 14, ty: 13, dir: 'down' }],
    chests: [], signs: {}
  },

  // ============================================================ ALDMERE
  village: {
    name: 'Aldmere Village', music: 'village', theme: 'grass', edge: 'T', fx: 'leaves', ambient: 'rgba(255,200,120,.05)', node: 'village',
    rows: withDoors(VILLAGE_ROWS, [[16, 4, 'E'], [25, 5, 'E']]), encounters: null,
    npcs: [
      { id: 'elder', x: 5, y: 5, spr: 'elder', dir: 'down', script: 'elder' },
      { id: 'kid', x: 8, y: 12, spr: 'kid', dir: 'down', script: 'kid', wander: 2 },
      { id: 'woman', x: 4, y: 9, spr: 'woman', dir: 'down', script: 'woman', wander: 1 },
      { id: 'guard', x: 27, y: 7, spr: 'guard', dir: 'left', script: 'guardVillage' },
      { id: 'farmer', x: 20, y: 11, spr: 'villager', dir: 'down', script: 'farmer', wander: 2 },
      { id: 'refugee', x: 22, y: 12, spr: 'woman', dir: 'down', script: 'refugee', show: 'end_door' },
      { id: 'soldierV', x: 22, y: 12, spr: 'guard', dir: 'down', script: 'soldierPurge', show: 'end_purge' },
      { id: 'envoyV', x: 22, y: 12, spr: 'demonm', dir: 'down', script: 'envoyVillage', show: 'end_deal' }
    ],
    warps: [
      { x: 29, y: 8, w: 1, h: 3, to: '@travel', dests: ['forest', 'brookvale', 'solmere'] },
      { x: 16, y: 4, w: 1, h: 1, to: 'aldmere_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 25, y: 5, w: 1, h: 1, to: 'aldmere_inn', tx: 7, ty: 8, dir: 'up' }
    ],
    chests: [],
    signs: {}
  },
  aldmere_shop: {
    name: 'Mott\'s General Store', music: 'village', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,110,.08)',
    rows: SHOP_ROWS, pois: SHOP_POIS, encounters: null,
    npcs: [{ id: 'shopkeep', x: 2, y: 2, spr: 'shop', dir: 'down', script: 'shopVillage' }],
    warps: [{ x: 5, y: 8, w: 2, h: 1, to: 'village', tx: 16, ty: 5, dir: 'down' }],
    chests: [], signs: {}
  },
  aldmere_inn: {
    name: 'The Crooked Lantern', music: 'village', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,170,90,.10)',
    rows: TAVERN_ROWS, pois: TAVERN_POIS, encounters: null,
    npcs: [
      { id: 'innkeep', x: 3, y: 1, spr: 'inn', dir: 'down', script: 'inn' },
      { id: 'patron', x: 7, y: 5, spr: 'villager', dir: 'left', script: 'patron' },
      { id: 'lyraWait', x: 12, y: 6, spr: 'lyra', dir: 'down', script: 'lyraTavern', show: 'lyraWaits&!in_lyra&!lyraGone' }
    ],
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'village', tx: 25, ty: 6, dir: 'down' }],
    chests: [], signs: {}
  },

  // ============================================================ WHISPERWOOD
  forest: {
    name: 'Whisperwood', music: 'field', theme: 'grass', edge: 'T', lvl: 4, fx: 'fireflies', ambient: 'rgba(20,60,40,.14)', node: 'forest',
    rows: buildForest(),
    encounters: [['slime', 3], ['bat', 2], ['wolf', 2], ['goblin', 2], ['spider', 1]], bg: 'forest',
    npcs: [
      { id: 'lyraTied', x: 31, y: 3, spr: 'lyra', dir: 'down', script: 'lyraTied', show: '!chief' },
      { id: 'chief', x: 34, y: 3, spr: 'chief', dir: 'down', script: 'chief', show: '!chief' },
      { id: 'gob1', x: 33, y: 1, spr: 'goblin', dir: 'down', script: 'goblinGuard', show: '!chief' },
      { id: 'gob2', x: 35, y: 1, spr: 'goblin', dir: 'down', script: 'goblinGuard', show: '!chief' },
      { id: 'gob3', x: 34, y: 1, spr: 'goblin', dir: 'down', script: 'goblinGuard', show: '!chief' }
    ],
    warps: [
      { x: 0, y: 11, w: 1, h: 3, to: '@travel', dests: ['village', 'fernhollow'] },
      { x: 33, y: 0, w: 3, h: 1, to: '@travel', dests: ['ironhold', 'wastes'] }
    ],
    chests: [
      { id: 'f1', x: 10, y: 24, item: 'potion', qty: 3 },
      { id: 'f2', x: 41, y: 22, item: 'ether', qty: 2 },
      { id: 'f3', x: 39, y: 3, gold: 80 },
      { id: 'f4', x: 5, y: 22, item: 'locket', qty: 1 }
    ],
    signs: { '3,11': 'West: Aldmere and Fernhollow.  North-east: the road to Ironhold, through the goblin camp.' }
  },

  // ============================================================ FERNHOLLOW
  fernhollow: {
    name: 'Fernhollow', music: 'field', theme: 'forestv', edge: 'T', lvl: 6, fx: 'fireflies', ambient: 'rgba(30,70,40,.12)', node: 'fernhollow',
    rows: buildFernhollow(),
    encounters: [['wolf', 3], ['spider', 3], ['wisp', 1], ['poacher', 1]], bg: 'forest',
    safe: [[3, 2, 23, 16]],
    npcs: [
      { id: 'fshop', x: 7, y: 12, spr: 'hunter2', dir: 'left', script: 'shopFern' },
      { id: 'ffolk', x: 16, y: 8, spr: 'hunter', dir: 'down', script: 'fernFolk', wander: 2 },
      { id: 'fkid', x: 22, y: 9, spr: 'kid2', dir: 'down', script: 'fernKid', wander: 1 },
      { id: 'poach1', x: 34, y: 23, spr: 'poacher', dir: 'down', script: 'poachers', show: '!poachers' },
      { id: 'poach2', x: 36, y: 22, spr: 'poacher', dir: 'left', script: 'poachers', show: '!poachers' },
      { id: 'poach3', x: 37, y: 24, spr: 'bandit', dir: 'left', script: 'poachers', show: '!poachers' },
      { id: 'thorn', x: 40, y: 31, spr: 'm:treant', dir: 'left', script: 'oldThorn', show: '!thorn' }
    ],
    warps: [
      { x: 12, y: 5, w: 1, h: 1, to: 'fern_lodge', tx: 7, ty: 8, dir: 'up' },
      { x: 0, y: 10, w: 1, h: 1, to: '@travel', dests: ['brookvale', 'forest'] }
    ],
    chests: [
      { id: 'fh1', x: 8, y: 29, item: 'ether', qty: 2 },
      { id: 'fh2', x: 42, y: 33, item: 'bow2', qty: 1 },
      { id: 'fh3', x: 39, y: 23, gold: 120 },
      { id: 'fh4', x: 24, y: 27, item: 'phoenix', qty: 1 }
    ],
    signs: { '3,9': 'FERNHOLLOW. Rangers\' lodge. The deep woods to the south-east are not safe after dark.' }
  },
  fern_lodge: {
    name: 'Rangers\' Lodge', music: 'field', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,170,90,.10)',
    rows: TAVERN_ROWS, pois: TAVERN_POIS, encounters: null,
    npcs: TAVERN_NPCS('fern', 'hunter', 'inn', [
      { id: 'kestrel', x: 12, y: 6, spr: 'kestrel', dir: 'down', script: 'kestrel', show: '!in_kestrel&!kestrelGone' }
    ]),
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'fernhollow', tx: 12, ty: 6, dir: 'down' }],
    chests: [], signs: {}
  },

  // ============================================================ SOLMERE
  solmere: {
    name: 'Solmere, the Crown City', music: 'capital', theme: 'city', edge: '+', fx: 'motes', ambient: 'rgba(255,220,160,.05)', encounters: null, node: 'solmere',
    rows: buildSolmere(),
    npcs: [
      { id: 'pg1', x: 24, y: 9, spr: 'royalguard', dir: 'down', script: 'royalGuard' },
      { id: 'pg2', x: 27, y: 9, spr: 'royalguard', dir: 'down', script: 'royalGuard' },
      { id: 'sn1', x: 19, y: 14, spr: 'noble', dir: 'down', script: 'solNoble', wander: 2 },
      { id: 'sn2', x: 32, y: 16, spr: 'noblewoman', dir: 'left', script: 'solNoble2', wander: 1 },
      { id: 'stall', x: 21, y: 22, spr: 'villager2', dir: 'up', script: 'solStall' },
      { id: 'skid', x: 28, y: 26, spr: 'kid', dir: 'down', script: 'solKid', wander: 2 },
      { id: 'beggar', x: 12, y: 24, spr: 'beggar', dir: 'down', script: 'beggar' },
      { id: 'thug1', x: 12, y: 32, spr: 'thug', dir: 'right', script: 'thugs', show: '!thugs' },
      { id: 'thug2', x: 14, y: 30, spr: 'thug', dir: 'left', script: 'thugs', show: '!thugs' },
      { id: 'sable', x: 26, y: 18, spr: 'sable', dir: 'down', script: 'sableStreet', show: 'writ&!sableMet' },
      { id: 'sgate', x: 22, y: 38, spr: 'guard', dir: 'right', script: 'solGate' },
      { id: 'sherald', x: 30, y: 10, spr: 'herald', dir: 'down', script: 'solHerald' }
    ],
    warps: [
      { x: 25, y: 8, w: 2, h: 1, to: 'solmere_palace', tx: 11, ty: 14, dir: 'up' },
      { x: 8, y: 16, w: 1, h: 1, to: 'solmere_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 9, y: 30, w: 1, h: 1, to: 'solmere_tavern', tx: 7, ty: 8, dir: 'up' },
      { x: 24, y: 41, w: 4, h: 1, to: '@travel', dests: ['valenford', 'village'] }
    ],
    chests: [{ id: 'sm1', x: 4, y: 36, item: 'antidote', qty: 3 }],
    signs: { '22,37': 'SOLMERE, the Crown City. By order of King Aurel III, all blades are to be peace-bound within the walls.' }
  },
  solmere_palace: {
    name: 'The Sunlit Palace', music: 'capital', theme: 'castle', edge: '#', interior: true, ambient: 'rgba(255,200,120,.16)',
    rows: PALACE_ROWS, encounters: null,
    npcs: [
      { id: 'king', x: 11, y: 2, spr: 'king', dir: 'down', script: 'kingAurel' },
      { id: 'rg1', x: 9, y: 4, spr: 'royalguard', dir: 'down', script: 'royalGuard' },
      { id: 'rg2', x: 14, y: 4, spr: 'royalguard', dir: 'down', script: 'royalGuard' },
      { id: 'pherald', x: 13, y: 2, spr: 'herald', dir: 'down', script: 'palaceHerald' }
    ],
    warps: [{ x: 11, y: 15, w: 2, h: 1, to: 'solmere', tx: 25, ty: 9, dir: 'down', clamp: true }],
    chests: [], signs: {}
  },
  solmere_shop: {
    name: 'The Crown Emporium', music: 'capital', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,190,110,.08)',
    rows: SHOP_ROWS, pois: SHOP_POIS, encounters: null,
    npcs: [{ id: 'emporium', x: 2, y: 2, spr: 'merchant', dir: 'down', script: 'shopSol' }],
    warps: [{ x: 5, y: 8, w: 2, h: 1, to: 'solmere', tx: 8, ty: 17, dir: 'down' }],
    chests: [], signs: {}
  },
  solmere_tavern: {
    name: 'The Gutter Rose', music: 'town', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(200,120,90,.12)',
    rows: TAVERN_ROWS, pois: TAVERN_POIS, encounters: null,
    npcs: TAVERN_NPCS('rose', 'inn', 'inn', [
      { id: 'sableT', x: 12, y: 6, spr: 'sable', dir: 'down', script: 'sableTavern', show: 'sableMet&!in_sable&!sableGone' },
      { id: 'roseThug', x: 7, y: 7, spr: 'thug', dir: 'left', script: 'rosePatron' }
    ]),
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'solmere', tx: 9, ty: 31, dir: 'down' }],
    chests: [], signs: {}
  },

  // ============================================================ IRONHOLD
  ironhold: {
    name: 'Ironhold', music: 'town', theme: 'town', edge: 'r', fx: 'sparks', ambient: 'rgba(255,140,60,.06)', node: 'ironhold',
    rows: withDoors(buildIronhold(), [[6, 6, 'E'], [23, 6, 'E']]), encounters: null,
    npcs: [
      { id: 'garrick', x: 14, y: 5, spr: 'garrick', dir: 'down', script: 'garrick', show: '!garrickMet' },
      { id: 'mineguard', x: 15, y: 5, spr: 'dwarf', dir: 'down', script: 'mineGuard', show: '!mineOpen' },
      { id: 'smith', x: 7, y: 16, spr: 'smith', dir: 'down', script: 'smith' },
      { id: 'dwarf1', x: 18, y: 11, spr: 'dwarf', dir: 'down', script: 'dwarfTalk', wander: 2 },
      { id: 'dwarf2', x: 7, y: 19, spr: 'dwarf', dir: 'down', script: 'dwarfTalk2', wander: 2 },
      { id: 'kidI', x: 22, y: 16, spr: 'kid', dir: 'down', script: 'kidIronhold' }
    ],
    warps: [
      { x: 14, y: 21, w: 2, h: 1, to: '@travel', dests: ['forest'] },
      { x: 14, y: 2, w: 2, h: 1, to: 'mine', tx: 20, ty: 28, clamp: true },
      { x: 6, y: 6, w: 1, h: 1, to: 'ironhold_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 23, y: 6, w: 1, h: 1, to: 'ironhold_tavern', tx: 7, ty: 8, dir: 'up' }
    ],
    chests: [],
    signs: { '11,10': 'IRONHOLD. North: the Old Mine (sealed by order of the Hold).' }
  },
  ironhold_shop: {
    name: 'Olga\'s Quartermastery', music: 'town', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,170,90,.08)',
    rows: SHOP_ROWS, pois: SHOP_POIS, encounters: null,
    npcs: [{ id: 'shopI', x: 2, y: 2, spr: 'shop', dir: 'down', script: 'shopIronhold' }],
    warps: [{ x: 5, y: 8, w: 2, h: 1, to: 'ironhold', tx: 6, ty: 7, dir: 'down' }],
    chests: [], signs: {}
  },
  ironhold_tavern: {
    name: 'The Deep Hearth', music: 'town', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,150,70,.10)',
    rows: TAVERN_ROWS, pois: TAVERN_POIS, encounters: null,
    npcs: [
      { id: 'innI', x: 3, y: 1, spr: 'inn', dir: 'down', script: 'inn' },
      { id: 'patronI', x: 7, y: 7, spr: 'dwarf', dir: 'left', script: 'patronI' },
      { id: 'garrickWait', x: 12, y: 6, spr: 'garrick', dir: 'down', script: 'garrickTavern', show: 'garrickWaits&!in_garrick&!garrickGone' },
      { id: 'ashbornI', x: 11, y: 4, spr: 'demonf', dir: 'down', script: 'ashbornTavern', show: 'end_deal' }
    ],
    warps: [{ x: 7, y: 9, w: 2, h: 1, to: 'ironhold', tx: 23, ty: 7, dir: 'down' }],
    chests: [], signs: {}
  },
  mine: {
    name: 'The Old Mine', music: 'mine', theme: 'cave', edge: 'r', lvl: 10, dark: true, fx: 'dust',
    rows: buildMine(),
    encounters: [['skeleton', 3], ['cavebat', 3], ['bslime', 2]], bg: 'cave',
    npcs: [
      { id: 'golem', x: 36, y: 5, spr: 'm:golem', dir: 'left', script: 'golem', show: '!golem' }
    ],
    warps: [
      { x: 19, y: 29, w: 3, h: 1, to: 'ironhold', tx: 14, ty: 3, clamp: true }
    ],
    chests: [
      { id: 'm1', x: 6, y: 27, item: 'phoenix', qty: 1 },
      { id: 'm2', x: 34, y: 21, gold: 300 },
      { id: 'm3', x: 11, y: 17, item: 'hipotion', qty: 2 },
      { id: 'm4', x: 38, y: 5, item: 'tonic', qty: 1 }
    ],
    signs: {}
  },

  // ============================================================ THE ASHEN REALM
  wastes: {
    name: 'Ashen Wastes', music: 'wastes', theme: 'ash', edge: 'r', lvl: 15, fx: 'embers', ambient: 'rgba(160,40,10,.10)', node: 'wastes',
    rows: buildWastes(),
    encounters: [['orc', 2], ['rslime', 3], ['swolf', 2]], bg: 'wastes',
    npcs: [
      { id: 'merchant', x: 10, y: 12, spr: 'merchant', dir: 'down', script: 'shopCamp' },
      { id: 'healer', x: 14, y: 12, spr: 'healer', dir: 'down', script: 'healer' },
      { id: 'varek', x: 12, y: 15, spr: 'varek', dir: 'down', script: 'varek', show: '!in_varek&!varekGone&!end_purge' },
      { id: 'nyx', x: 11, y: 16, spr: 'nyx', dir: 'down', script: 'nyx', show: 'end_deal' },
      { id: 'nyxMother', x: 13, y: 16, spr: 'demonf', dir: 'down', script: 'nyxMother', show: 'end_deal' },
      { id: 'emberTrader', x: 16, y: 13, spr: 'demonm', dir: 'left', script: 'emberTrader', show: 'end_deal' }
    ],
    warps: [
      { x: 0, y: 12, w: 1, h: 3, to: '@travel', dests: ['forest'] },
      { x: 30, y: 2, w: 1, h: 1, to: 'castle', tx: 12, ty: 27 }
    ],
    chests: [{ id: 'w1', x: 36, y: 22, item: 'mega', qty: 1 }],
    signs: { '3,12': 'West: the Rift, and the green world beyond it. The last camp before the Ashborn castle: keep your fire lit.' },
    safe: [[8, 10, 9, 7]]
  },
  castle: {
    name: 'Castle Vharn', music: 'castle', theme: 'castle', edge: '#', lvl: 18, fx: 'embers', ambient: 'rgba(70,0,40,.16)',
    rows: buildCastle2(),
    encounters: [['dknight', 2], ['imp', 3], ['swolf', 1]], bg: 'castle',
    npcs: [
      { id: 'king', x: 12, y: 4, spr: 'demonking', dir: 'down', script: 'malgrath', show: '!kingDone' },
      { id: 'kingDeal', x: 12, y: 4, spr: 'demonking', dir: 'down', script: 'kingDeal', show: 'end_deal' }
    ],
    warps: [{ x: 12, y: 29, w: 2, h: 1, to: 'wastes', tx: 30, ty: 3, clamp: true }],
    chests: [
      { id: 'c1', x: 3, y: 16, item: 'otherblade', qty: 1 },
      { id: 'c2', x: 22, y: 16, item: 'mega', qty: 2 },
      { id: 'c3', x: 3, y: 26, item: 'phoenix', qty: 2 },
      { id: 'c4', x: 22, y: 26, gold: 800 }
    ],
    signs: {},
    safe: [[2, 2, 22, 12]]
  }
};

const QUEST_AREAS = ['forest', 'fernhollow', 'mine', 'wastes', 'castle'];
