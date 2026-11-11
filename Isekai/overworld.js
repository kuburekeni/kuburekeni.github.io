// =====================================================================
//  overworld.js : Eldoria, all of it, in one piece
//   - one big top-down map you walk across: fifteen regions, roads and
//     trails, rivers, a lake with a drowned city in it, the coast, the
//     moor, the fen, mountains, the snow, and the ash at the Rift
//   - every town and dungeon is entered from it; leaving a town by its
//     road puts you back out in the country at its gate
//   - waystones for fast travel, signposts, road encounters, region
//     music, weather and colour, and a world map (Y on a controller, N
//     on a keyboard) that fills in as you explore
//  Before senior year the old road scenes still run as they always did.
// =====================================================================
const OW = {
  W: 200, H: 150,
  REGIONS: {
    valen:   { name: 'The Valen Hills', c: [52, 60], lvl: 3, music: 'overworld', bg: 'road', grade: null, table: [['slime', 3], ['wolf', 2], ['bat', 2]] },
    brook:   { name: 'Brook Meadows', c: [84, 50], lvl: 4, music: 'overworld', bg: 'road', table: [['slime', 2], ['wolf', 3], ['wisp', 1], ['bandit', 1]] },
    ald:     { name: 'The Aldmere Fields', c: [116, 66], lvl: 5, music: 'overworld', bg: 'village', table: [['wolf', 3], ['goblin', 2], ['spider', 1], ['bandit', 1]] },
    whisper: { name: 'Whisperwood', c: [146, 56], lvl: 5, music: 'forest', bg: 'forest', table: [['wolf', 2], ['goblin', 3], ['spider', 2], ['slime', 1]] },
    fern:    { name: 'The Fernwoods', c: [120, 30], lvl: 7, music: 'forest', bg: 'forest', table: [['wolf', 3], ['spider', 3], ['wisp', 1], ['poacher', 1]] },
    silvane: { name: 'The Silvane Old-Growth', c: [86, 16], lvl: 10, music: 'forest', bg: 'grove', table: [['sprite', 3], ['moth', 3], ['blightwolf', 1]] },
    iron:    { name: 'The Ironhold Mountains', c: [156, 24], lvl: 12, music: 'highland', bg: 'moor', table: [['harpy', 2], ['cragling', 2], ['cavebat', 2], ['skeleton', 1]] },
    frost:   { name: 'Frostpeak', c: [184, 14], lvl: 17, music: 'snow', bg: 'snow', weather: 'snow', table: [['frostwolf', 3], ['icewisp', 2], ['iceslime', 2], ['yeti', 1]] },
    crown:   { name: 'The Crownlands', c: [86, 104], lvl: 6, music: 'overworld', bg: 'road', table: [['wolf', 2], ['bandit', 2], ['thug', 1], ['slime', 1]] },
    mirrow:  { name: 'Lake Mirrow', c: [106, 82], lvl: 12, music: 'lake', bg: 'coast', table: [['tideslime', 2], ['naga', 1], ['wisp', 2], ['serpent', 1]] },
    coast:   { name: 'The Saltmarsh Coast', c: [28, 112], lvl: 6, music: 'coast', bg: 'coast', table: [['crab', 3], ['gull', 3], ['tideslime', 2]] },
    moor:    { name: 'Highmoor', c: [30, 30], lvl: 8, music: 'moor', bg: 'moor', table: [['moorwolf', 3], ['boar', 2], ['raven', 2], ['wight', 1]] },
    red:     { name: 'The Redcrag Hills', c: [62, 86], lvl: 9, music: 'overworld', bg: 'road', table: [['redcrag', 3], ['hound', 2], ['archer', 1]] },
    fen:     { name: 'Mirefen', c: [156, 120], lvl: 13, music: 'fen', bg: 'fen', weather: 'fog', table: [['bogslime', 3], ['serpent', 2], ['fenwisp', 2]] },
    rift:    { name: 'The Rift Marches', c: [182, 70], lvl: 16, music: 'wastes', bg: 'wastes', weather: 'ashfall', table: [['swolf', 2], ['orc', 2], ['imp', 2], ['rslime', 1]] }
  },
  // how each town or dungeon sits on the map: style, centre, and which sides it opens on
  SITES: {
    valenford:  { style: 'town', c: [52, 60], sides: { S: [23, 35, 'up'] }, label: 'Valenford' },
    brookvale:  { style: 'town', c: [84, 54], sides: { W: [1, 15, 'right'], E: [42, 15, 'left'] }, label: 'Brookvale' },
    village:    { style: 'town', c: [114, 62], sides: { E: [28, 9, 'left'] }, label: 'Aldmere' },
    forest:     { style: 'grove', c: [142, 58], sides: { W: [1, 12, 'right'], N: [34, 1, 'down'] }, label: 'Deep Whisperwood' },
    fernhollow: { style: 'town', c: [118, 30], sides: { W: [1, 10, 'right'] }, label: 'Fernhollow', wood: 1 },
    solmere:    { style: 'city', c: [86, 102], sides: { S: [25, 39, 'up'] }, label: 'Solmere' },
    ironhold:   { style: 'hold', c: [156, 24], sides: { S: [14, 19, 'up'] }, label: 'Ironhold' },
    gullhaven:  { style: 'town', c: [32, 112], sides: { N: [22, 1, 'down'] }, label: 'Gullhaven' },
    cairnstead: { style: 'town', c: [30, 28], sides: { S: [19, 28, 'up'] }, label: 'Cairnstead' },
    mirewatch:  { style: 'town', c: [150, 116], sides: { W: [1, 15, 'right'] }, label: 'Mirewatch', wood: 1 },
    silvane:    { style: 'grove', c: [88, 16], sides: { S: [22, 32, 'up'] }, label: 'Silvane Grove', sakura: 1 },
    redcrag:    { style: 'fort', c: [62, 88], sides: { S: [19, 28, 'up'] }, label: 'Redcrag Fort' },
    barrow:     { style: 'cave', c: [16, 42], sides: { S: [17, 27, 'up'] }, label: 'The Hollow Barrow' },
    shrine:     { style: 'temple', c: [166, 128], sides: { S: [17, 25, 'up'] }, label: 'The Sunken Shrine' },
    aurel:      { style: 'temple', c: [104, 80], sides: { S: [19, 30, 'up'] }, label: 'Old Aurel' },
    rimeheart:  { style: 'cave', c: [186, 20], sides: { S: [18, 25, 'up'] }, label: 'Rimeheart Hollow' },
    wastes:     { style: 'rift', c: [190, 67], sides: { W: [2, 13, 'right'] }, label: 'The Rift' }
  },
  WAYSTONES: [
    { id: 'valen', name: 'Valenford Road', map: 'overworld', x: 55, y: 68 }, { id: 'brook', name: 'Brookvale Bridge', map: 'overworld', x: 76, y: 58 },
    { id: 'ald', name: 'Aldmere Crossing', map: 'overworld', x: 126, y: 64 }, { id: 'crown', name: 'Solmere Gate', map: 'overworld', x: 90, y: 111 },
    { id: 'fern', name: 'Fernwood Trail', map: 'overworld', x: 108, y: 28 }, { id: 'gull', name: 'Gullhaven', map: 'gullhaven', x: 25, y: 3 },
    { id: 'cairn', name: 'Cairnstead', map: 'cairnstead', x: 22, y: 27 }, { id: 'mire', name: 'Mirewatch', map: 'mirewatch', x: 3, y: 13 },
    { id: 'iron', name: 'Ironhold Pass', map: 'overworld', x: 159, y: 32 }, { id: 'rift', name: 'The Last Camp Road', map: 'overworld', x: 182, y: 70 },
    { id: 'lake', name: 'Lake Mirrow', map: 'overworld', x: 108, y: 70 }, { id: 'frost', name: 'Frostpeak', map: 'overworld', x: 182, y: 23 }
  ],
  links: {},     // filled in by the builder: map id -> side -> { gate:[x,y,w,h], out:[x,y,dir], arrive:[x,y,dir] }
  region: null   // Uint8Array of region indices, one per tile
};
OW.RKEYS = Object.keys(OW.REGIONS);

// ---------------------------------------------------------------- build the land
(function buildOverworld() {
  const Wd = OW.W, Ht = OW.H;
  const b = MB(Wd, Ht, '.', 777);
  // smooth value noise
  const vn = (x, y, s, k) => {
    const fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const h = (a, c) => (hash2(a * 7 + k * 131, c * 13 + k * 71) % 1000) / 1000;
    const sm = t => t * t * (3 - 2 * t), a = h(ix, iy), bb = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
    return a + (bb - a) * sm(tx) + (c - a) * sm(ty) + (a - bb - c + d) * sm(tx) * sm(ty);
  };
  const noise = (x, y, k = 0) => vn(x, y, 9, k) * 0.6 + vn(x, y, 4, k + 3) * 0.3 + vn(x, y, 2, k + 9) * 0.1;
  // regions: nearest centre, warped by noise so borders wander
  const keys = OW.RKEYS, R = new Uint8Array(Wd * Ht);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    let best = 0, bd = 1e9;
    const wx = x + (noise(x, y, 41) - 0.5) * 18, wy = y + (noise(x, y, 43) - 0.5) * 18;
    keys.forEach((k, i) => { const [cx, cy] = OW.REGIONS[k].c, d = (wx - cx) ** 2 + (wy - cy) ** 2; if (d < bd) { bd = d; best = i; } });
    // hard edges that the map is built around
    if (x >= 137 && x <= 176 && y >= 4 && y <= 41) best = keys.indexOf('iron');
    if (x >= 177 && y <= 30) best = keys.indexOf('frost');
    if (y >= 97 && x >= 124) best = keys.indexOf('fen');
    if (x >= 168 && y > 41 && y < 97) best = keys.indexOf('rift');
    if (x <= 54 && y >= 96) best = keys.indexOf('coast');
    if (x <= 50 && y <= 46) best = keys.indexOf('moor');
    R[y * Wd + x] = best;
  }
  OW.region = R;
  const reg = (x, y) => keys[R[y * Wd + x]];
  // ground and growth for each region
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const k = reg(x, y), n = noise(x, y, 5), h = hash2(x, y) % 1000;
    let c = '.';
    switch (k) {
      case 'moor': c = n > 0.45 ? 'å' : '.'; if (h < 30) c = 'r'; else if (h < 42) c = 'T'; else if (h < 90 && c === '.') c = ','; break;
      case 'fen': c = 'ü'; if (n > 0.6) c = 'µ'; else if (h < 110) c = 'ø'; else if (h < 130) c = 'X'; else if (h < 160) c = 'T'; break;
      case 'frost': c = 'ö'; if (n > 0.66) c = 'Ä'; else if (h < 150) c = 'Ö'; break;
      case 'iron': c = '.'; if (n > 0.62) c = 'Ä'; else if (h < 110) c = 'T'; else if (h < 150) c = 'r'; break;
      case 'whisper': c = h < 430 ? 'T' : h < 520 ? ',' : '.'; break;
      case 'fern': c = h < 340 ? 'T' : h < 430 ? ',' : h < 450 ? 'f' : '.'; break;
      case 'silvane': c = h < 360 ? 'T' : h < 420 ? 'q' : h < 480 ? ',' : h < 500 ? 'f' : '.'; break;
      case 'rift': { const ashy = (x - 166) / 26 + n * 0.6; c = ashy > 0.7 ? 'a' : '.'; if (h < 60) c = 'X'; else if (h < 90) c = 'r'; else if (h < 120 && c === '.') c = ','; break; }
      case 'red': c = h < 160 && n > 0.5 ? ',' : '.'; if (h < 70) c = 'r'; else if (h < 95) c = 'T'; break;
      case 'coast': c = h < 40 ? 'T' : h < 110 ? ',' : h < 125 ? 'f' : '.'; break;
      default: c = h < 55 ? 'T' : h < 135 && n > 0.45 ? ',' : h < 160 ? 'f' : h < 168 ? 'r' : '.'; if (n > 0.72 && h < 300) c = 'T';
    }
    b.set(x, y, c);
  }
  // the sea to the west and south-west, a beach along it, rocks on the moor shore
  for (let y = 0; y < Ht; y++) {
    const coast = y < 92 ? 5 + Math.round(noise(0, y, 61) * 5) : 5 + Math.round((y - 92) * 0.78 + noise(0, y, 61) * 5);
    for (let x = 0; x < Math.min(Wd, coast); x++) b.set(x, y, '~');
    for (let x = coast; x < coast + 3 && x < Wd; x++) b.set(x, y, y < 47 ? (x === coast ? 'r' : '.') : 'ä');
  }
  for (let x = 0; x < 76; x++) { const sy = 141 + Math.round(noise(x, 0, 63) * 4) + Math.max(0, Math.round((x - 50) * 0.3)); for (let y = sy; y < Ht; y++) b.set(x, y, '~'); for (let y = sy - 2; y < sy; y++) if (y > 0 && b.get(x, y) !== '~') b.set(x, y, 'ä'); }
  // mountains along the north and east edges; trees along the bottom
  for (let x = 0; x < Wd; x++) { const t = 2 + Math.round(noise(x, 0, 65) * 3); for (let y = 0; y < t; y++) if (b.get(x, y) !== '~') b.set(x, y, 'Ä'); }
  for (let y = 0; y < Ht; y++) { const t = 3 + Math.round(noise(0, y, 67) * 3); for (let x = Wd - t; x < Wd; x++) b.set(x, y, 'Ä'); }
  for (let x = 76; x < Wd; x++) { b.set(x, Ht - 1, 'T'); if (hash2(x, 3) % 2) b.set(x, Ht - 2, 'T'); }
  // the mountain ring around Ironhold, and the wall south of Frostpeak
  for (let y = 3; y <= 42; y++) for (let x = 134; x <= 178; x++) {
    const edge = Math.min(x - 134, 178 - x, y - 3, 42 - y), th = 2 + Math.round(noise(x, y, 69) * 2);
    if (edge < th) b.set(x, y, 'Ä');
  }
  for (let x = 176; x < Wd; x++) for (let y = 29; y <= 31 + Math.round(noise(x, 0, 71) * 2); y++) b.set(x, y, 'Ä');
  // Lake Mirrow, with its island
  for (let y = 66; y < 96; y++) for (let x = 86; x < 124; x++) {
    const d = ((x - 104) / 13) ** 2 + ((y - 80) / 8.5) ** 2 + (noise(x, y, 73) - 0.5) * 0.5;
    if (d < 1) b.set(x, y, '~'); else if (d < 1.18 && b.get(x, y) !== '~') b.set(x, y, hash2(x, y) % 3 ? 'ä' : ',');
  }
  for (let y = 75; y <= 85; y++) for (let x = 98; x <= 110; x++) if (((x - 104) / 6) ** 2 + ((y - 80) / 5) ** 2 < 1) b.set(x, y, hash2(x, y) % 9 ? '.' : ',');
  // the river, from the northern mountains to the lake, and on to the sea
  const riv = [];
  for (let y = 2; y <= 72; y++) riv.push([Math.round(94 + 4 * Math.sin(y / 9) + y / 76 * 6), y]);
  for (let i = 0; i <= 60; i++) { const t = i / 60; riv.push([Math.round(99 - t * 32 + Math.sin(t * 9) * 3), Math.round(88 + t * 58)]); }
  for (let i = 0; i < riv.length; i++) {
    const [rx, ry] = riv[i], nxt = riv[i + 1];
    const pts = [[rx, ry]];
    if (nxt) { const steps = Math.max(Math.abs(nxt[0] - rx), Math.abs(nxt[1] - ry)); for (let s = 1; s < steps; s++) pts.push([Math.round(rx + (nxt[0] - rx) * s / steps), Math.round(ry + (nxt[1] - ry) * s / steps)]); }
    for (const [px_, py_] of pts) for (let dx = -1; dx <= 1; dx++) if (py_ < Ht - 1 && b.get(px_ + dx, py_) !== 'Ä') b.set(px_ + dx, py_, '~');
  }
  // ---- roads ('=') and trails (';'), bridges where they cross water
  const road = (pts, c = '=', w = 2) => {
    for (let i = 0; i < pts.length - 1; i++) {
      let [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1], dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
      while (true) {
        for (let a = 0; a < w; a++) {
          const x = dx !== 0 ? x0 : x0 + a, y = dx !== 0 ? y0 + a : y0, cur = b.get(x, y);
          if (cur === null) continue;
          b.set(x, y, cur === '~' || cur === 'µ' || cur === 'B' ? 'B' : c);
        }
        if (x0 === x1 && y0 === y1) break;
        x0 += dx; y0 += dy;
      }
    }
  };
  OW.ROADS = [
    [[51, 65], [51, 72], [70, 72], [70, 54], [77, 54]],                       // Valenford - Brookvale
    [[90, 54], [101, 54], [101, 68], [124, 68], [124, 62], [120, 62]],        // Brookvale - Aldmere
    [[124, 62], [130, 62], [130, 58], [135, 58]],                             // Aldmere - Whisperwood
    [[141, 53], [141, 46], [150, 46], [150, 30], [155, 30], [155, 29]],       // Whisperwood - Ironhold
    [[141, 48], [168, 48], [168, 67], [188, 67]],                             // Whisperwood - the Rift
    [[101, 54], [101, 40], [105, 40], [105, 30], [111, 30]],                  // Brookvale - Fernhollow
    [[51, 72], [51, 96], [75, 96], [75, 114], [85, 114], [85, 109]],      // Valenford - Solmere
    [[51, 96], [61, 96], [61, 93]],                                           // Redcrag
    [[124, 68], [124, 114], [85, 114]],                                       // Aldmere - Solmere
    [[51, 72], [40, 72], [40, 100], [31, 100], [31, 107]],                    // Valenford - Gullhaven
    [[40, 72], [40, 46], [29, 46], [29, 33]],                                 // Valenford - Cairnstead
    [[124, 114], [124, 117], [143, 117], [143, 116]],                         // Solmere - Mirewatch
    [[155, 30], [164, 30], [164, 16], [180, 16], [180, 24], [186, 24], [186, 22]]                   // Ironhold - Frostpeak
  ];
  OW.TRAILS = [
    [[29, 46], [16, 46], [16, 44]],                                           // the Barrow
    [[143, 117], [143, 134], [166, 134], [166, 131]],                         // the Sunken Shrine
    [[105, 30], [105, 24], [87, 24], [87, 21]],                               // Silvane
    [[104, 68], [104, 72]],                                                   // the causeway, north end
    [[61, 100], [61, 108], [66, 108]],                                        // an old shepherds' path
    [[168, 67], [168, 90], [176, 90]]                                         // the ash road south
  ];
  for (const r of OW.ROADS) road(r);
  for (const r of OW.TRAILS) road(r, ';', 1);
  for (let y = 72; y <= 76; y++) b.set(104, y, 'B');                          // causeway to the island
  for (let y = 76; y <= 84; y++) for (let x = 99; x <= 109; x++) if (b.get(x, y) === '~' && ((x - 104) / 6) ** 2 + ((y - 80) / 5) ** 2 < 1.05) b.set(x, y, '.');
  // ---- sites: the towns and dungeons, drawn small, with gates that are warps
  const warps = [];
  const clearRect = (x0, y0, w, h, ch) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (b.get(x, y) !== null && b.get(x, y) !== '~') b.set(x, y, ch); };
  for (const id in OW.SITES) {
    const S = OW.SITES[id], [cx, cy] = S.c, link = OW.links[id] = {};
    const groundCh = ['frost'].includes(reg(cx, cy)) ? 'ö' : reg(cx, cy) === 'fen' ? 'ü' : reg(cx, cy) === 'rift' ? 'a' : '.';
    let box;
    if (S.style === 'town' || S.style === 'city' || S.style === 'hold' || S.style === 'fort') {
      const hw = S.style === 'city' ? 8 : 6, hh = S.style === 'city' ? 6 : 4;
      box = [cx - hw, cy - hh, hw * 2, hh * 2 + 1];
      clearRect(box[0] - 1, box[1] - 1, box[2] + 2, box[3] + 2, groundCh);
      const wall = S.style === 'city' ? '+' : S.style === 'hold' ? 'r' : 'F';
      for (let x = box[0]; x < box[0] + box[2]; x++) { b.set(x, box[1], wall); b.set(x, box[1] + box[3] - 1, wall); }
      for (let y = box[1]; y < box[1] + box[3]; y++) { b.set(box[0], y, wall); b.set(box[0] + box[2] - 1, y, wall); }
      for (let y = box[1] + 1; y < box[1] + box[3] - 1; y++) for (let x = box[0] + 1; x < box[0] + box[2] - 1; x++) b.set(x, y, S.style === 'fort' ? ';' : ':');
      // little houses inside: rows of roofs over walls
      const rows = S.style === 'city' ? [box[1] + 1, box[1] + 5, box[1] + 9] : [box[1] + 1, box[1] + 5];
      for (const ry of rows) for (let x = box[0] + 2; x < box[0] + box[2] - 3; x += 4) {
        if (S.style === 'fort') { b.set(x + 1, ry + 1, 'N'); continue; }
        b.set(x, ry, 'R'); b.set(x + 1, ry, 'R'); b.set(x + 2, ry, 'R'); b.set(x, ry + 1, 'W'); b.set(x + 1, ry + 1, 'D'); b.set(x + 2, ry + 1, 'W');
      }
      if (S.style === 'city') { for (let y = box[1] - 1; y >= box[1] - 1; y--) for (let x = box[0] + 4; x < box[0] + box[2] - 4; x++) b.set(x, box[1] + 1, 'R'); b.set(cx - 1, box[1] + 2, '+'); b.set(cx, box[1] + 2, '+'); }
      if (S.style === 'city' || S.style === 'hold' || S.style === 'fort') for (const [x, y] of [[box[0], box[1]], [box[0] + box[2] - 1, box[1]], [box[0], box[1] + box[3] - 1], [box[0] + box[2] - 1, box[1] + box[3] - 1]]) b.set(x, y, '!');
      if (S.wood) for (let x = box[0] - 1; x <= box[0] + box[2]; x += 3) { if (b.get(x, box[1] - 1) !== null) b.set(x, box[1] - 1, 'T'); }
    } else if (S.style === 'grove') {
      box = [cx - 5, cy - 4, 11, 9];
      for (let y = box[1] - 2; y < box[1] + box[3] + 2; y++) for (let x = box[0] - 2; x < box[0] + box[2] + 2; x++) {
        const inner = x >= box[0] && x < box[0] + box[2] && y >= box[1] && y < box[1] + box[3];
        b.set(x, y, inner ? (hash2(x, y) % 5 ? 'T' : S.sakura ? 'q' : 'T') : (hash2(x, y) % 3 ? 'T' : ','));
      }
    } else if (S.style === 'temple') {
      box = [cx - 3, cy - 2, 7, 5];
      clearRect(box[0] - 1, box[1] - 1, 9, 7, id === 'aurel' ? '.' : groundCh);
      for (let x = box[0]; x < box[0] + 7; x++) { b.set(x, box[1], 'R'); b.set(x, box[1] + 1, 'R'); for (let y = box[1] + 2; y < box[1] + 5; y++) b.set(x, y, '+'); }
      b.set(box[0] + 1, box[1] + 3, '['); b.set(box[0] + 5, box[1] + 3, '[');
      for (const [x, y] of [[box[0] - 1, box[1] + 4], [box[0] + 7, box[1] + 4]]) b.set(x, y, '¤');
    } else if (S.style === 'cave') {
      box = [cx - 2, cy - 2, 5, 4];
      for (let y = box[1] - 1; y < box[1] + 4; y++) for (let x = box[0] - 1; x < box[0] + 6; x++) b.set(x, y, 'Ä');
      clearRect(cx - 1, cy + 2, 3, 2, groundCh);
    } else if (S.style === 'rift') {
      clearRect(cx - 4, cy - 4, 9, 9, 'a');
      for (let y = cy - 1; y <= cy + 1; y++) b.set(cx, y, '«');
      for (const [x, y] of [[cx + 1, cy - 2], [cx + 1, cy + 2], [cx - 1, cy - 3], [cx + 2, cy + 3]]) b.set(x, y, 'X');
    }
    // the gates
    for (const side in S.sides) {
      const arrive = S.sides[side];
      let gate, out;
      if (S.style === 'temple' || S.style === 'cave') {
        const dx = cx, dy = S.style === 'temple' ? cy + 2 : cy + 1;
        b.set(dx, dy, S.style === 'temple' ? ']' : '»');
        gate = [dx, dy, 1, 1]; out = [dx, dy + 1, 'down'];
      } else if (S.style === 'rift') {
        gate = null; out = [cx - 3, cy, 'left'];
      } else {
        const [x0, y0, w, h] = box;
        if (side === 'S') { gate = [cx - 1, y0 + h - 1, 2, 1]; out = [cx - 1, y0 + h, 'down']; }
        if (side === 'N') { gate = [cx - 1, y0, 2, 1]; out = [cx - 1, y0 - 1, 'up']; }
        if (side === 'W') { gate = [x0, cy, 1, 2]; out = [x0 - 1, cy, 'left']; }
        if (side === 'E') { gate = [x0 + w - 1, cy, 1, 2]; out = [x0 + w, cy, 'right']; }
        for (let y = gate[1]; y < gate[1] + gate[3]; y++) for (let x = gate[0]; x < gate[0] + gate[2]; x++) b.set(x, y, S.style === 'grove' ? ';' : '=');
        // a short lane out from the gate so nothing ever blocks it
        for (let k = 1; k <= 2; k++) for (let y = gate[1]; y < gate[1] + gate[3]; y++) for (let x = gate[0]; x < gate[0] + gate[2]; x++) {
          const ox = side === 'W' ? x - k : side === 'E' ? x + k : x, oy = side === 'N' ? y - k : side === 'S' ? y + k : y;
          const cur = b.get(ox, oy); if (cur !== null && cur !== '=' && cur !== 'B') b.set(ox, oy, cur === '~' ? 'B' : S.style === 'grove' ? ';' : '=');
        }
      }
      link[side] = { gate, out, arrive };
      if (gate) warps.push({ x: gate[0], y: gate[1], w: gate[2], h: gate[3], to: id, tx: arrive[0], ty: arrive[1], dir: arrive[2], ow: true });
    }
  }
  // the road from the island temple's door round to the causeway
  road([[104, 83], [100, 83], [100, 77], [104, 77]], ';', 1);
  road([[104, 77], [104, 76]], ';', 1);
  // ---- gates the story opens: the goblin barricade on the north pass, the snow on the Frostpeak pass
  OW.GATES = [
    { x: 149, y: 40, w: 4, h: 1, ch: '¦', open: () => !!G.flags.chief, msg: () => say(null, 'A barricade of sharpened stakes across the pass, hung with goblin charms. Beyond it, the road climbs to Ironhold. The goblins of Whisperwood hold this road — clear their camp in the deep wood first.') },
    { x: 172, y: 16, w: 4, h: 2, ch: 'Ö', solidSnow: true, open: () => !!G.flags.golem, msg: () => say(null, 'The pass east is buried in snow higher than your head. The dwarves of Ironhold say they will clear it once the Warden in the Old Mine is dealt with.') }
  ];
  for (let x = 147; x <= 154; x++) for (const y of [39, 40, 41]) if (x < 149 || x > 152) b.set(x, y, 'Ä');
  for (let x = 171; x <= 176; x++) for (const y of [14, 15, 18, 19]) b.set(x, y, 'Ä');
  // ---- waystones, signposts, campfires
  for (const w of OW.WAYSTONES) if (w.map === 'overworld') { const gch = { frost: 'ö', fen: 'ü', rift: 'a' }[reg(w.x, w.y)] || '.'; b.set(w.x, w.y, '°'); for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0]]) { const c = b.get(w.x + dx, w.y + dy); if (c && SOLID.has(c) && c !== '~') b.set(w.x + dx, w.y + dy, gch); } }
  OW.SIGNS = {
    '53,74': 'North: Cairnstead and the moor. East: Brookvale. South: Solmere, past the Redcrag hills. West: Gullhaven and the sea.',
    '72,71': 'Brookvale, north-east. Valenford, west.',
    '103,55': 'West: Brookvale. North: Fernhollow. South-east: Aldmere and the Crownlands.',
    '126,70': 'North: Aldmere. East: Whisperwood. South: Solmere, the Crown City.',
    '139,47': 'North: Ironhold, over the pass. East: the Rift Marches. Turn back if you are not ready.',
    '80,113': 'SOLMERE. East: Mirewatch and the fen. North-west: Valenford.',
    '42,98': 'West: Gullhaven, on the sea. North: Valenford.',
    '42,47': 'North-west: Cairnstead. West: the barrow on the moor. Mind the stones.',
    '126,119': 'East: Mirewatch. Mind the bog. The bog does not mind you.',
    '106,70': 'Lake Mirrow. They say a city sank here, the year the Accord was signed. On still days you can see its roofs.',
    '166,47': 'THE RIFT MARCHES. The ash begins here. So does the war.',
    '162,32': 'East: the Frostpeak pass. Cold all year. Colder than that at night.'
  };
  for (const k in OW.SIGNS) { const [x, y] = k.split(',').map(Number); b.set(x, y, 'S'); }
  for (const [x, y] of [[45, 70], [96, 66], [133, 64], [37, 98], [74, 99], [160, 50], [118, 116], [178, 70], [179, 24], [28, 50]]) { b.set(x, y, 'O'); }
  // a broken watchtower, a ring of stones on the moor, a few ruins about the place
  for (const [x, y] of [[22, 22], [24, 20], [27, 20], [29, 22], [27, 25], [24, 25]]) b.set(x, y, 'r');
  for (const [x, y] of [[88, 70], [119, 74], [93, 90], [115, 88], [190, 40], [184, 100], [70, 30], [44, 126]]) b.set(x, y, '¤');
  MAPS.overworld = {
    name: 'Eldoria', music: 'overworld', theme: 'grass', edge: 'Ä', noDensify: true, overworld: true, fx: 'leaves', ambient: 'rgba(255,220,160,.04)',
    rows: b.rows(), npcs: [], warps, chests: [], signs: OW.SIGNS, gates: OW.GATES, encounters: [['slime', 1]], bg: 'road', lvl: 3
  };
})();

// ---------------------------------------------------------------- where you are
function owRegion(x, y) {
  if (!OW.region) return 'valen';
  x = clamp(x | 0, 0, OW.W - 1); y = clamp(y | 0, 0, OW.H - 1);
  return OW.RKEYS[OW.region[y * OW.W + x]];
}
function owOpen() { return !!(G && (G.flags.youth || G.flags.questGiven) && G.age !== 'student' && G.age !== 'child'); }
function owState() { if (!G.ow) G.ow = { ways: {}, seen: '', regions: {} }; return G.ow; }
function owApplyRegion(k, quiet) {
  const R = OW.REGIONS[k], m = MAPS.overworld;
  m.lvl = R.lvl; m.bg = R.bg; m.encounters = R.table; m.region = k;
  m.fx = k === 'frost' ? null : k === 'fen' ? 'fireflies' : k === 'rift' ? 'embers' : /whisper|fern|silvane/.test(k) ? 'leaves' : 'leaves';
  Particles.set(m.fx || null);
  if (!quiet) {
    const st = owState();
    if (!st.regions[k]) { st.regions[k] = true; toast(`Discovered: ${R.name}`, UI.gold); Sound.sfx('buff'); }
    if (World) { World.banner = R.name; World.bannerStart = TIME; }
  }
  if (Gfx.weather) {
    if (R.weather) Weather.set(R.weather, 1);
    else if (Weather.kind === 'snow' || Weather.kind === 'fog' || Weather.kind === 'ashfall') Weather.forMap('overworld');
  }
  const want = musicFor('overworld');
  if (Sound.trackName !== want && World && World.map === m) Sound.play(want);
}
// music, stage kind, weather, colour grade and tier all follow the region
{
  const mf0 = musicFor;
  musicFor = function (id) {
    if (id === 'overworld' && MAPS.overworld.region) {
      const k = MAPS.overworld.region, R = OW.REGIONS[k];
      if (k === 'rift' && G.ending === 'deal') return 'moor';
      return R.music;
    }
    return mf0(id);
  };
  const sk0 = stageKind;
  stageKind = function (id) {
    if (id === 'barrow' || id === 'shrine') return 'vault';
    if (id === 'aurel') return 'library';
    if (id === 'cairn_long') return 'hall';
    if (id === 'gull_light' || id === 'gull_barber' || id === 'gull_keeper' || id === 'gull_harbour' || id === 'cairn_seer' || id === 'mire_hesk') return 'home';
    if (id !== 'overworld') return sk0(id);
    const k = MAPS.overworld.region || 'valen';
    return { whisper: 'forest', fern: 'forest', silvane: 'forest', rift: 'ash', fen: 'night' }[k] || 'road';
  };
  const at0 = areaTier;
  areaTier = function (mapId) {
    const m = MAPS[mapId];
    if (m && m.lvl && (mapId === 'overworld' || m.region)) return m.lvl < 6 ? 1 : m.lvl < 11 ? 2 : m.lvl < 15 ? 3 : 4;
    return at0(mapId);
  };
  const OW_GRADE = { frost: 'rgba(160,190,255,.16)', fen: 'rgba(90,140,90,.18)', rift: 'rgba(200,90,60,.16)', coast: 'rgba(255,230,180,.10)', moor: 'rgba(150,140,190,.14)', silvane: 'rgba(120,255,200,.10)', red: 'rgba(220,140,90,.10)', mirrow: 'rgba(140,200,255,.10)', iron: 'rgba(170,170,200,.10)' };
  const dg0 = drawGrade;
  drawGrade = function (world) {
    if (world.map === MAPS.overworld) { const g = OW_GRADE[world.map.region]; if (g) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); } return; }
    return dg0(world);
  };
}

// ---------------------------------------------------------------- moving between the overworld and places
async function owGoto(mapId, x, y, dir) {
  const w = World;
  Sound.sfx('door');
  await fadeOut(0.3);
  w.load(mapId, x, y, dir);
  await fadeIn(0.3);
  if (mapId !== 'overworld') await onEnterMap(mapId);
  saveGame(true);
}
function owSideOf(m, wp) {
  const mw = m.rows[0].length, mh = m.rows.length;
  if (wp.x === 0) return 'W';
  if (wp.x + (wp.w || 1) >= mw) return 'E';
  if (wp.y === 0) return 'N';
  return 'S';
}
{
  const uw0 = WorldScene.prototype.useWarp;
  WorldScene.prototype.useWarp = function (w, fx, fy) {
    const id = G.map;
    // leaving a town or dungeon by its road
    if ((w.to === '@travel' || w.to === '@ow') && (owOpen() || w.to === '@ow')) {
      const links = OW.links[id];
      if (links) {
        const side = links[owSideOf(this.map, w)] ? owSideOf(this.map, w) : Object.keys(links)[0];
        const L = links[side];
        return this.run(async () => { await owGoto('overworld', L.out[0], L.out[1], L.out[2]); });
      }
    }
    // stepping through a gate on the overworld
    if (w.ow) {
      if (id === 'overworld' && w.to === 'solmere' && G.flags.youth && !G.flags.writ && !G.flags.v_solmere) { /* the capital always lets the Valen heir in */ }
      return this.run(async () => { await owGoto(w.to, w.tx, w.ty, w.dir); });
    }
    return uw0.call(this, w, fx, fy);
  };
}
// the Rift itself
async function owRift() {
  if (!G.flags.golem) { await say(null, 'A hole in the world, three times your height, turning slowly. Your hand stops an inch from it, as if the air had set hard. The dwarves say the Dawnstone, beneath Ironhold, is the only key.'); return; }
  const res = await portalChoice(null);
  if (res === 'in') {
    const a = OW.SITES.wastes.sides.W;
    World.load('wastes', a[0], a[1], a[2]);
    await fadeIn(0.8);
    await onEnterMap('wastes');
    saveGame(true);
  } else if (res === 'back') { const p = World.player; p.dir = 'left'; }
}
{
  const tm0 = WorldScene.prototype.tryMove;
  WorldScene.prototype.tryMove = function (d) {
    if (this.map.overworld) {
      const [dx, dy] = DIRS[d], nx = this.player.x + dx, ny = this.player.y + dy;
      if (this.tile(nx, ny) === '«') { this.player.dir = d; G.dir = d; this.run(owRift); return; }
    }
    return tm0.call(this, d);
  };
}

// ---------------------------------------------------------------- the overworld, as you walk it
{
  const ld0 = WorldScene.prototype.load;
  WorldScene.prototype.load = function (mapId, x, y, dir) {
    if (mapId === 'overworld') { const k = owRegion(x, y); MAPS.overworld.region = null; owApplyRegion(k, true); this._owRegion = k; }
    const r = ld0.call(this, mapId, x, y, dir);
    if (mapId === 'overworld') { MAPS.overworld.region = null; owApplyRegion(this._owRegion, true); this.banner = OW.REGIONS[this._owRegion].name; this.bannerStart = TIME; owReveal(x, y); owState().regions[this._owRegion] = true; }
    return r;
  };
  const step0 = WorldScene.prototype.onStep;
  WorldScene.prototype.onStep = function () {
    if (this.map.overworld) {
      const p = this.player, k = owRegion(p.x, p.y);
      if (k !== this._owRegion) { this._owRegion = k; owApplyRegion(k); }
      owReveal(p.x, p.y);
      // road events: every so often on a road, something happens
      const t = this.tile(p.x, p.y);
      if ((t === '=' || t === ';' || t === 'B') && !G.flags.noEncounters) {
        this._roadSteps = (this._roadSteps || 0) + 1;
        if (this._roadSteps > (this._roadNext || (this._roadNext = irand(140, 240)))) {
          this._roadSteps = 0; this._roadNext = irand(160, 280);
          if (Math.random() < 0.7) { this.run(() => owRoadEvent()); return; }
        }
      }
    }
    return step0.call(this);
  };
}
async function owRoadEvent() {
  const k = owRegion(World.player.x, World.player.y);
  const biome = { whisper: 'forest', fern: 'forest', silvane: 'forest', iron: 'pines', frost: 'pines', rift: 'ash', fen: 'dead', crown: 'city' }[k] || 'farm';
  const scene = { biome: () => biome, p: 0, seen: OW.seenEvents || (OW.seenEvents = new Set()) };
  if (OW.seenEvents.size > 8) OW.seenEvents.clear();
  await roadEvent(scene);
  Sound.play(musicFor('overworld'));
}
// encounter tables, adjusted by the ending, come from the region
{
  const et0 = encounterTable;
  encounterTable = function (mapId) {
    if (mapId === 'overworld') {
      const k = MAPS.overworld.region || 'valen';
      if (['valen'].includes(k) && stage() === 0 && !G.ending) return OW.REGIONS.valen.table;
    }
    return et0(mapId);
  };
}

// ---------------------------------------------------------------- the fog of the world map
function owReveal(x, y) {
  const st = owState(), cw = 10, cols = Math.ceil(OW.W / cw), rows = Math.ceil(OW.H / cw);
  if (st.seen.length !== cols * rows) st.seen = '0'.repeat(cols * rows);
  const cx = Math.floor(x / cw), cy = Math.floor(y / cw);
  let s = st.seen.split(''), changed = false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const a = cx + dx, c = cy + dy; if (a < 0 || c < 0 || a >= cols || c >= rows) continue;
    const i = c * cols + a; if (s[i] !== '1') { s[i] = '1'; changed = true; }
  }
  if (changed) st.seen = s.join('');
}

// ---------------------------------------------------------------- waystones
async function waystone(ws) {
  const st = owState();
  if (!st.ways[ws.id]) {
    st.ways[ws.id] = true; Sound.sfx('magic');
    await say(null, `The rune on the stone wakes under your hand and burns a steady blue. ${ws.name} — attuned. You can return here from any waystone.`);
  }
  const known = OW.WAYSTONES.filter(w => st.ways[w.id] && w.id !== ws.id);
  if (!known.length) { await say(null, 'Touch other waystones on your travels, and you can step between them.'); return; }
  const items = known.map(w => ({ label: w.name, right: OW.REGIONS[w.map === 'overworld' ? owRegion(w.x, w.y) : MAPS[w.map].region || 'valen'].name.replace(/^The /, ''), desc: `Step through the stone to ${w.name}.` }));
  items.push({ label: 'Stay here', desc: '' });
  const i = await list({ x: 16, y: 16, w: 420, items, title: 'Travel by waystone', rows: 8 });
  if (i < 0 || i >= known.length) return;
  const to = known[i];
  Sound.sfx('magic');
  await fadeOut(0.5, '#bfe6ff');
  World.load(to.map, to.x, to.y + 1, 'down');
  World.syncFollowers();
  Fade.col = '#bfe6ff';
  await fadeIn(0.5);
  Fade.col = '#000';
  saveGame(true);
}
{
  const it0 = WorldScene.prototype.interact;
  WorldScene.prototype.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy;
    if (this.tile(x, y) === '°') { const ws = OW.WAYSTONES.find(w => w.map === G.map && w.x === x && w.y === y); if (ws) { this.run(() => waystone(ws)); return; } }
    if (this.tile(x, y) === '«' && this.map.overworld) { this.run(owRift); return; }
    return it0.call(this);
  };
  // the world map, from anywhere outdoors
  const up0 = WorldScene.prototype.update;
  WorldScene.prototype.update = function (dt) {
    if (this.lock === 0 && this.player.t >= 1 && Input.pressed('map') && owOpen()) { this.run(() => worldMap()); return; }
    return up0.call(this, dt);
  };
}

// ---------------------------------------------------------------- the world map screen
const OW_COL = {
  '.': '#6ab04e', ',': '#4e9a3c', 'f': '#7ab85a', 'T': '#2e6a30', 'q': '#e48aa8', '~': '#3a7ab8', 'B': '#a8743a', '=': '#d8bc7a', ';': '#b89a6a',
  'ä': '#e6d29a', 'ö': '#e8eef6', 'Ö': '#3a5a4a', 'ü': '#5e5638', 'µ': '#2e3a2a', 'ø': '#6a7a3a', 'å': '#8a6a8a', 'Ä': '#6a6470', 'r': '#8a8478',
  'a': '#6a5a5e', 'X': '#4a3a3a', ':': '#b8b0a0', 'F': '#8a5a30', '+': '#c8c0b0', 'R': '#a83a3a', 'W': '#d8c8a8', 'D': '#6a4424', '!': '#f2c94c',
  '°': '#8ac8ff', '«': '#c040ff', ']': '#3a3040', '»': '#1a1420', 'N': '#a87440', 'O': '#f28030', 'S': '#a87440', '¤': '#d0ccc0', '¦': '#8a2a2a'
};
let OW_MINI = null;
function owMini() {
  if (OW_MINI) return OW_MINI;
  const [c, x] = mkCanvas(OW.W, OW.H), img = x.createImageData(OW.W, OW.H), rows = MAPS.overworld.rows;
  for (let y = 0; y < OW.H; y++) for (let xx = 0; xx < OW.W; xx++) {
    const col = OW_COL[rows[y][xx]] || '#6ab04e', n = parseInt(col.slice(1), 16), i = (y * OW.W + xx) * 4;
    const sh = (hash2(xx, y) % 9) - 4;
    img.data[i] = clamp((n >> 16) + sh, 0, 255); img.data[i + 1] = clamp(((n >> 8) & 255) + sh, 0, 255); img.data[i + 2] = clamp((n & 255) + sh, 0, 255); img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return (OW_MINI = c);
}
function owObjectiveSite() {
  if (G.ending) return null;
  return ['solmere', 'forest', 'ironhold', 'wastes', 'wastes'][stage()] || null;
}
class WorldMapScene {
  constructor() { this.promise = new Promise(r => this.resolve = r); this.t = 0; this.sel = 0; }
  update(dt) {
    this.t += dt;
    if (this.t > 0.2 && (Input.pressed('cancel') || Input.pressed('map') || Input.pressed('ok') || Input.pressed('menu'))) { Sound.sfx('cancel'); this.resolve(); }
  }
  draw() {
    ctx.fillStyle = '#0d0a18'; ctx.fillRect(0, 0, W, H);
    const sc = Math.min((W - 60) / OW.W, (H - 90) / OW.H), mw = Math.floor(OW.W * sc), mh = Math.floor(OW.H * sc), mx = Math.floor((W - mw) / 2), my = 46;
    // parchment frame
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(mx - 10, my - 10, mw + 20, mh + 20);
    ctx.fillStyle = '#e8d8b0'; ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(owMini(), mx, my, mw, mh);
    // fog over the parts you haven't seen
    const st = owState(), cw = 10, cols = Math.ceil(OW.W / cw);
    for (let i = 0; i < st.seen.length; i++) if (st.seen[i] !== '1') {
      const cx = i % cols, cy = Math.floor(i / cols);
      ctx.fillStyle = '#d8c8a0'; ctx.fillRect(mx + Math.floor(cx * cw * sc), my + Math.floor(cy * cw * sc), Math.ceil(cw * sc) + 1, Math.ceil(cw * sc) + 1);
      if ((cx + cy) % 2) { ctx.fillStyle = '#cdbb90'; ctx.fillRect(mx + Math.floor(cx * cw * sc) + 3, my + Math.floor(cy * cw * sc) + 3, 3, 1); }
    }
    const seenAt = (x, y) => st.seen[Math.floor(y / cw) * cols + Math.floor(x / cw)] === '1';
    // places
    const goal = owObjectiveSite();
    for (const id in OW.SITES) {
      const S = OW.SITES[id], [x, y] = S.c; if (!seenAt(x, y)) continue;
      const sx = mx + x * sc, sy = my + y * sc;
      const town = ['town', 'city', 'hold'].includes(S.style);
      ctx.fillStyle = UI.ink; ctx.fillRect(sx - 4, sy - 4, 8, 8);
      ctx.fillStyle = town ? '#f3e6c4' : S.style === 'rift' ? '#c040ff' : '#e5534b'; ctx.fillRect(sx - 3, sy - 3, 6, 6);
      text(S.label, sx, sy + 6, town ? UI.paper : '#ffd0d0', 10, 'center');
      if (goal === id) { const b = Math.sin(TIME * 5) * 2; text('▼', sx, sy - 18 + b, UI.gold, 13, 'center'); }
    }
    for (const w of OW.WAYSTONES) {
      if (!st.ways[w.id]) continue;
      let x = w.x, y = w.y; if (w.map !== 'overworld') [x, y] = OW.SITES[w.map].c;
      ctx.fillStyle = '#8ac8ff'; ctx.fillRect(mx + x * sc - 1, my + y * sc - 2, 3, 4);
    }
    // you
    let px_ = G.x, py_ = G.y;
    if (G.map !== 'overworld') { const s = OW.SITES[G.map] || (MAPS[G.map] && MAPS[G.map].interior && OW.SITES[owParentMap(G.map)]); if (s) [px_, py_] = s.c; else [px_, py_] = [-99, -99]; }
    if (px_ >= 0) {
      const sx = mx + px_ * sc, sy = my + py_ * sc, on = Math.floor(TIME * 3) % 2;
      ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = on ? UI.sakura : '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 7); ctx.fill();
    }
    const reg = G.map === 'overworld' ? OW.REGIONS[owRegion(G.x, G.y)].name : areaName(G.map);
    text('ELDORIA', W / 2, 10, UI.gold, 22, 'center');
    text(reg, 16, H - 34, UI.paper, 14, 'left');
    const found = Object.keys(owState().regions).length, ways = Object.keys(owState().ways).length;
    text(`Regions ${found}/${OW.RKEYS.length} · Waystones ${ways}/${OW.WAYSTONES.length}`, W - 16, H - 34, UI.dim, 12, 'right', false);
    text(`${Controls.label('cancel')} to close`, W / 2, H - 18, UI.dim, 11, 'center', false);
  }
}
function owParentMap(id) {
  for (const k in MAPS) for (const w of MAPS[k].warps || []) if (w.to === id && OW.SITES[k]) return k;
  return null;
}
async function worldMap() { const s = new WorldMapScene(); Scenes.push(s); Sound.sfx('menu' in Sound ? 'ok' : 'ok'); await s.promise; Scenes.remove(s); }
// the pause menu gets a Map tile
{
  const pm0 = pauseMenu;
  pauseMenu = async function () {
    return pm0.apply(this, arguments);
  };
}

// ---------------------------------------------------------------- the first time out
{
  const en0 = onEnterMap;
  onEnterMap = async function (id) {
    await en0(id);
    if (G.map === 'overworld' && !G.flags.owIntro && owOpen()) {
      G.flags.owIntro = true;
      await say(null, 'The road opens out in front of you. Eldoria — all of it, the hills and the woods and the long blue line of the sea — and nobody to tell you which way to walk.');
      await say(null, `TIP: Press ${Controls.label('map')} for the world map. Touch waystones (blue runestones) to travel between them. Signposts point the way, and the further you wander from the road, the stranger it gets.`);
    }
  };
  // arriving on the overworld counts as entering it
  const og0 = owGoto;
  owGoto = async function (mapId, x, y, dir) { await og0(mapId, x, y, dir); if (mapId === 'overworld') await onEnterMap('overworld'); };
}

// ---------------------------------------------------------------- music for the open country
Object.assign(SCORE, {
  // the overworld: the theme of the journey, horn and strings over a walking bass
  overworld: { bpm: 104, gain: 1.05, counterI: 'strings',
    acc: { pad: 'strings', padV: 0.024, arp: 'harp', arpPat: 'up8', arpV: 0.04, arpLo: 55, bass: 'bass', bassPat: 'boom', bassV: 0.11, perc: 'lite', percV: 0.45 },
    secs: [
      { c: 'D | A/C# | Bm | G | D | A | G,A | D',
        m: [{ i: 'horn', v: 0.12, n: 'F#5 - - - A5 - D6 - | E6 - - - C#6 - A5 - | B5 - - - F#5 - D5 - | G5 - - - - - . . | F#5 - - - A5 - D6 - | E6 - - - F#6 - E6 - | D6 - B5 - C#6 - E6 - | D6 - - - - - . .', oct: -12 }] },
      { c: 'G | D/F# | Em | A | G | D/F# | Em,A | D', acc: { pad: ['strings', 'choir'], padV: [0.026, 0.016] },
        m: [{ i: 'flute', v: 0.09, n: 'B5 - - A5 G5 - D5 - | A5 - - G5 F#5 - D5 - | G5 - - F#5 E5 - B4 - | C#5 - - - E5 - A5 - | B5 - - A5 G5 - D6 - | A5 - - - F#5 - A5 - | G5 - B5 - A5 - G5 - | F#5 - - - - - . .' }] }
    ] },
  // the coast: a shanty, accordion and fiddle on the swell
  coast: { bpm: 96, meter: 3, gain: 1.15, counterI: 'accordion',
    acc: { pad: 'accordion', padV: 0.016, arp: 'pluck', arpPat: 'waltz', arpV: 0.05, arpLo: 55, bass: 'pizz', bassPat: 'waltz', bassV: 0.12, perc: 'jig', percV: 0.4 },
    secs: [
      { c: 'Am | G | Am | E | Am | C | G | Am',
        m: [{ i: 'fiddle', v: 0.12, n: 'E5 - A5 - B5 - | D5 - G5 - B5 - | C6 - B5 - A5 - | B5 - - - G#5 - | A5 - E5 - A5 - | G5 - E5 - C5 - | D5 - G5 - B5 - | A5 - - - - -' }] },
      { c: 'C | G | Am | E | F | C | Dm,E | Am',
        m: [{ i: 'accordion', v: 0.1, n: 'E5 - - - G5 - | D5 - - - B4 - | C5 - - - E5 - | B4 - - - - - | A5 - - - F5 - | G5 - - - E5 - | F5 - D5 - B4 - | A4 - - - - -' }] }
    ] },
  // the moor: wide and lonely, pipes over a drone
  moor: { bpm: 84, gain: 1.3, counterI: 'cello',
    acc: { pad: ['strings', 'organ'], padV: [0.022, 0.016], padLo: 45, bass: 'cello', bassV: 0.08 },
    secs: [
      { c: 'D | D | C | D | D | Am | C | D',
        m: [{ i: 'shaku', v: 0.1, n: 'A5 - - - D6 - E6 - | F6 - - - E6 - D6 - | C6 - - - A5 - G5 - | A5 - - - - - . . | D6 - - - E6 - F6 - | E6 - - - C6 - A5 - | G5 - A5 - C6 - E6 - | D6 - - - - - . .' }] },
      { c: 'F | C | D | D | F | C | Am | D',
        m: [{ i: 'flute', v: 0.08, n: 'F5 - - E5 D5 - A4 - | E5 - - - C5 - . . | D5 - - - F5 - A5 - | D6 - - - - - . . | F5 - - E5 D5 - F5 - | G5 - - - E5 - C5 - | A4 - C5 - E5 - G5 - | D5 - - - - - . .' }] }
    ] },
  // the fen: slow, damp, uneasy
  fen: { bpm: 70, gain: 1.6, counterI: 'cello', sparkle: false,
    acc: { pad: 'strings', padV: 0.024, padLo: 45, arp: 'harp', arpPat: 'up8', arpV: 0.025, arpLo: 50, bass: 'cello', bassV: 0.08 },
    secs: [
      { c: 'Em | C | Em | B7 | Em | Am | C | B',
        m: [{ i: 'shaku', v: 0.09, n: 'B4 - - - E5 - - - | G5 - - - F#5 - E5 - | B4 - - - - - . . | D#5 - - - F#5 - - - | E5 - - - G5 - B5 - | A5 - - - C6 - - - | G5 - - - E5 - C5 - | B4 - - - - - - -' }] }
    ] },
  // the snow: glass and strings, very high and very cold
  snow: { bpm: 76, meter: 3, gain: 1.7, counterI: 'strings',
    acc: { pad: 'strings', padV: 0.024, padLo: 52, arp: 'musicbox', arpPat: 'waltz', arpV: 0.025, arpLo: 64, bass: 'harp', bassPat: 'waltz', bassV: 0.06 },
    secs: [
      { c: 'Bm | G | D | A | Bm | G | Em | F#',
        m: [{ i: 'glock', v: 0.07, n: 'F#6 - - - B6 - | G6 - - - D6 - | A6 - - - F#6 - | E6 - - - - - | F#6 - - - D7 - | B6 - - - G6 - | E6 - G6 - B6 - | A#6 - - - - -' }] }
    ] },
  // the mountains: a stern march, low brass
  highland: { bpm: 92, gain: 1.0, counterI: 'cello',
    acc: { pad: ['strings', 'horn'], padV: [0.024, 0.016], padLo: 45, bass: 'bass', bassPat: 'march', bassV: 0.12, perc: 'lite', percV: 0.5, timp: 'beat13', timpV: 0.18 },
    secs: [
      { c: 'Dm | Bb | C | Dm | Dm | Gm | A | Dm',
        m: [{ i: 'brass', v: 0.11, n: 'D5 - - - F5 - A5 - | Bb5 - - - A5 - F5 - | G5 - - - E5 - C5 - | D5 - - - - - . . | F5 - - - A5 - D6 - | Bb5 - - - G5 - D5 - | E5 - - - C#5 - E5 - | D5 - - - - - . .', oct: -12 }] }
    ] },
  // the lake: harp and still water
  lake: { bpm: 72, gain: 1.8, counterI: 'flute',
    acc: { pad: 'strings', padV: 0.022, arp: 'harp', arpPat: 'updown8', arpV: 0.035, arpLo: 55, bass: 'cello', bassV: 0.06 },
    secs: [
      { c: 'F | C/E | Dm | Bb | F | C | Bb,C | F',
        m: [{ i: 'flute', v: 0.08, n: 'A5 - - - C6 - F6 - | E6 - - - C6 - G5 - | F5 - - - A5 - D6 - | D6 - - - - - . . | A5 - - - C6 - F6 - | G6 - - - E6 - C6 - | D6 - C6 - Bb5 - G5 - | F5 - - - - - . .' }] }
    ] }
});
