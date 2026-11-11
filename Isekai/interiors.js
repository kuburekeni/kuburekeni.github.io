// =====================================================================
//  interiors.js : bigger, fuller rooms
//   - every inn and tavern grows a fireside lounge, a dining hall and a
//     kitchen; every shop a stockroom and racks of gear; cottages get a
//     bedroom and a kitchen; Valen Manor gets a dining room, a library,
//     a foyer, the kitchens and a room of your own (with a mirror)
//   - new furniture: plants, paintings, tapestries, stairs, stoves,
//     wardrobes, candle stands, rugs, crates, sacks, weapon racks,
//     armour stands, cauldrons, long tables, bottle shelves, mirrors
//  The old rooms sit in the top-left corner of the new ones, so everyone
//  who stood somewhere before still stands somewhere sensible.
// =====================================================================

// ---------------------------------------------------------------- furniture tiles
const INT_TILES = {
  'ç': { solid: 1, base: 'o', say: ['A potted fern. Somebody waters it every morning.', 'A little lemon tree in a pot. One lemon, guarded jealously.'] },
  'é': { solid: 1, base: 'V', say: ['A painting of the sea at Gullhaven, all grey and gold.', 'A portrait of someone stern, in a ruff. The eyes follow you, a little.', 'A painting of the hills above Valenford in spring.'] },
  'è': { solid: 1, base: 'V', say: ['A tapestry: the Accord of Dawn, three hundred years ago. Everybody in it is smiling except the Ashborn.', 'A woven banner with the crest of the house.'] },
  'ë': { solid: 1, base: 'o', say: ['The stairs lead up to the rooms. The landlord keeps them for paying guests.', 'Stairs to the upper floor. You can hear someone snoring up there.'] },
  'ï': { solid: 1, base: 'o', say: ['A black iron stove, ticking with heat. A pot of something with barley in it.', 'The oven. It smells of bread.'] },
  'ô': { solid: 1, base: 'o', say: ['A heavy oak wardrobe. The hinges complain.', 'A dresser. The top drawer sticks.'] },
  'û': { solid: 1, base: 'o', say: ['A tall candle stand. The wax has run down in long pale ropes.'] },
  'à': { solid: 0, base: 'o' },
  'â': { solid: 0, base: 'o' },
  'ù': { solid: 1, base: 'o', say: ['Crates of stock, stamped with the names of half a dozen towns.', 'Crates. One of them says FRAGILE in three languages.'] },
  'ò': { solid: 1, base: 'o', say: ['Sacks of flour and oats.', 'A sack of potatoes, slumped against the wall like a tired man.'] },
  'ì': { solid: 1, base: 'o', say: ['A rack of spears and swords, oiled and waiting.', 'A weapon rack. Every blade has a price tag tied to it with string.'] },
  'í': { solid: 1, base: 'o', say: ['An armour stand wearing a breastplate and a bored expression.', 'A suit of mail on a stand. It has been polished until it is mostly shine.'] },
  'ó': { solid: 1, base: 'o', say: ['A cauldron of something green. It burps.', 'A copper still, dripping something blue into a jar.'] },
  'ú': { solid: 1, base: 'o', say: ['A long table laid with bread, cheese and a pot of stew.', 'A long trestle table, scarred by a hundred years of elbows.'] },
  'ñ': { solid: 1, base: 'V', say: ['Shelves of bottles behind the bar: cider, plum brandy, something with a snake in it.'] },
  'Ñ': { solid: 1, base: 'o', say: ['A kitchen counter: knives, onions, a cat that is not supposed to be up here.', 'A chopping block, worn into a dip in the middle.'] },
  'Ç': { solid: 1, base: 'o' }
};
for (const k in INT_TILES) if (INT_TILES[k].solid) SOLID.add(k);
Object.assign(LIGHT_TILES, { 'ï': ['rgba(255,150,60,.45)', 70], 'û': ['rgba(255,210,130,.5)', 72], 'ó': ['rgba(120,255,160,.35)', 60] });
ANIMATED.add('û'); ANIMATED.add('ó'); ANIMATED.add('ï');
TALL.add('é'); TALL.add('è'); TALL.add('ñ');

{
  const dt0 = drawTile;
  drawTile = function (x, ch, theme, v, frame, mask, up, under) {
    const T = INT_TILES[ch];
    if (!T) return dt0(x, ch, theme, v, frame, mask, up, under);
    dt0(x, T.base, theme, v, 0, T.base === 'V' ? mask : 0, up, '');
    const R = (X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
    const E = (cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
    const ink = UI.ink, sh = 'rgba(0,0,0,.28)';
    switch (ch) {
      case 'ç': { // potted plant
        R(9, 27, 15, 3, sh);
        R(10, 20, 12, 9, ink); R(11, 21, 10, 7, '#b8603a'); R(11, 21, 10, 2, '#d8804a'); R(11, 26, 10, 2, '#8a4024');
        const leaf = ['#1f5a28', '#2f7a34', '#4a9a44', '#7ac860'];
        for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.6, len = 8 + (i % 3) * 3; const ex = 16 + Math.cos(a) * len, ey = 18 + Math.sin(a) * len; x.strokeStyle = leaf[i % 2]; x.lineWidth = 3; x.beginPath(); x.moveTo(16, 20); x.quadraticCurveTo(16 + Math.cos(a) * 3, 12, ex, ey); x.stroke(); R(Math.round(ex) - 1, Math.round(ey) - 1, 3, 2, leaf[2 + (i % 2)]); }
        x.lineWidth = 1;
        if (v % 2) { R(19, 9, 3, 3, '#f2c94c'); R(19, 9, 1, 1, '#fff3a0'); }
        break;
      }
      case 'é': { // framed painting on the wall
        R(5, 6, 22, 17, ink); R(6, 7, 20, 15, '#c8a040'); R(7, 8, 18, 13, '#8a6420');
        const s = v % 3;
        if (s === 0) { R(8, 9, 16, 6, '#6a8ab8'); R(8, 15, 16, 5, '#3a5a78'); R(8, 14, 16, 1, '#f2d890'); R(18, 10, 3, 3, '#f2e8c0'); }
        else if (s === 1) { R(8, 9, 16, 11, '#3a2a3a'); E(16, 14, 4, 5, '#d8b8a0'); R(12, 17, 8, 3, '#2a2a5a'); R(13, 10, 6, 3, '#2a1a10'); }
        else { R(8, 9, 16, 7, '#9ad0f0'); R(8, 16, 16, 4, '#4a8a3a'); E(12, 16, 6, 3, '#5aa84a'); E(21, 16, 5, 2, '#3a7a30'); R(19, 10, 3, 3, '#fff3a0'); }
        R(6, 7, 20, 1, '#f2d890');
        break;
      }
      case 'è': { // tapestry / banner
        R(8, 3, 16, 2, '#4a3020'); R(7, 3, 1, 2, '#c8a040'); R(24, 3, 1, 2, '#c8a040');
        const c = v % 2 ? '#2e3f82' : '#8a1e2a';
        R(9, 5, 14, 20, ink); R(10, 5, 12, 19, c); R(10, 5, 2, 19, shade(c, 0.15)); R(20, 5, 2, 19, shade(c, -0.25));
        R(12, 9, 8, 8, '#e0b84a'); R(14, 11, 4, 4, c); R(15, 12, 2, 2, '#e0b84a');
        for (let i = 0; i < 6; i++) R(10 + i * 2, 24, 1, 3 + (i % 2), '#e0b84a');
        break;
      }
      case 'ë': { // stairs going up
        for (let i = 0; i < 6; i++) { const y = 28 - i * 5; R(3, y - 5, 26, 5, ink); R(4, y - 4, 24, 4, shade('#8a5a30', i * 0.04)); R(4, y - 4, 24, 1, '#b8844a'); }
        R(2, 0, 2, 32, '#5a3418'); R(28, 0, 2, 32, '#5a3418'); R(2, 0, 2, 32, 'rgba(255,255,255,.1)');
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(4, 0, 24, 6);
        break;
      }
      case 'ï': { // iron stove
        R(4, 28, 25, 3, sh);
        R(4, 6, 24, 23, ink); R(5, 7, 22, 21, '#3a3640'); R(5, 7, 22, 3, '#5a5660'); R(5, 25, 22, 3, '#26222a');
        R(9, 14, 14, 9, ink); R(10, 15, 12, 7, frame ? '#e5534b' : '#c83a2a'); R(11, 17, 10, 4, frame ? '#f2a03a' : '#f28030'); R(13, 18, 6, 2, '#fff3a0');
        R(10, 3, 6, 4, '#2a2630'); E(21, 6, 5, 2, '#5a5660'); R(17, 2, 2, 2, 'rgba(220,220,230,.5)');
        break;
      }
      case 'ô': { // wardrobe
        R(5, 28, 23, 3, sh);
        R(4, 2, 24, 27, ink); R(5, 3, 22, 25, '#7a4a24'); R(5, 3, 22, 2, '#9a6434'); R(15, 5, 2, 22, '#4a2a12');
        R(6, 5, 8, 20, '#8a5a2c'); R(18, 5, 8, 20, '#8a5a2c'); R(13, 13, 1, 4, '#e0b84a'); R(18, 13, 1, 4, '#e0b84a');
        R(5, 26, 22, 2, '#5a3418');
        break;
      }
      case 'û': { // candle stand
        R(10, 28, 12, 3, sh);
        R(14, 10, 4, 18, '#3a3030'); R(10, 26, 12, 3, '#3a3030'); R(9, 9, 14, 2, '#5a4a40');
        for (const cx of [10, 15, 20]) { R(cx, 3, 3, 7, '#f0e8d0'); R(cx, 3, 1, 7, '#ffffff'); const fl = frame ? 1 : 0; R(cx + 1 - fl, 0, 2, 3, '#f2c94c'); R(cx + 1, 1, 1, 1, '#fff3c0'); }
        break;
      }
      case 'à': case 'â': { // rugs: a border and a pattern, joined with neighbours
        const c = ch === 'à' ? ['#8a2234', '#b83a4a', '#e0b84a'] : ['#24407a', '#3a5aa8', '#d8c8a0'];
        R(0, 0, 32, 32, c[0]);
        for (let i = 0; i < 32; i += 8) for (let j = 0; j < 32; j += 8) { R(i + 3, j + 3, 2, 2, c[2]); R(i + 2, j + 4, 4, 0.0001, c[2]); }
        for (let i = 0; i < 32; i += 4) R(i, (i * 3 + v * 5) % 32, 2, 1, c[1]);
        if (mask & 1) { R(0, 0, 32, 3, c[2]); R(0, 3, 32, 1, c[1]); }
        if (mask & 4) { R(0, 29, 32, 3, c[2]); R(0, 28, 32, 1, c[1]); for (let i = 1; i < 32; i += 3) R(i, 31, 1, 1, '#f0e0c0'); }
        if (mask & 8) { R(0, 0, 3, 32, c[2]); R(3, 0, 1, 32, c[1]); }
        if (mask & 2) { R(29, 0, 3, 32, c[2]); R(28, 0, 1, 32, c[1]); }
        break;
      }
      case 'ù': { // indoor crates
        R(2, 27, 28, 4, sh);
        const crate = (a, b, s) => { R(a - 1, b - 1, s + 2, s + 2, ink); R(a, b, s, s, '#a8743a'); R(a, b, s, 2, '#c8945a'); R(a, b + s - 2, s, 2, '#7a4e22'); R(a + (s >> 1) - 1, b, 2, s, '#7a4e22'); };
        crate(3, 14, 13); crate(16, 16, 11); crate(7, 3, 11);
        break;
      }
      case 'ò': { // sacks
        R(3, 27, 26, 4, sh);
        for (const [cx, cy, c] of [[10, 20, '#d8c8a0'], [21, 21, '#c8b890'], [15, 13, '#e0d4b0']]) { E(cx, cy, 8, 8, ink); E(cx, cy, 7, 7, c); R(cx - 2, cy - 9, 4, 3, shade(c, -0.25)); E(cx - 2, cy - 2, 2, 2, shade(c, 0.15)); }
        R(13, 12, 4, 1, '#8a6a3a');
        break;
      }
      case 'ì': { // weapon rack
        R(3, 28, 27, 3, sh);
        R(3, 24, 26, 4, ink); R(4, 25, 24, 2, '#6a4424'); R(3, 8, 26, 3, ink); R(4, 9, 24, 1, '#8a5a30');
        const blades = [['#c8ccd8', 6], ['#9aa0aa', 12], ['#d8dce8', 18], ['#b8bcc8', 24]];
        for (const [c, bx] of blades) { R(bx, 2, 2, 24, ink); R(bx, 3, 1, 21, c); R(bx - 2, 20, 6, 2, '#5a3418'); R(bx, 22, 2, 4, '#4a2a14'); }
        break;
      }
      case 'í': { // armour stand
        R(8, 28, 17, 3, sh);
        R(15, 22, 2, 7, '#5a3418'); R(10, 27, 12, 2, '#4a2a14');
        R(9, 9, 14, 14, ink); R(10, 10, 12, 12, '#9aa0aa'); R(10, 10, 4, 12, '#c8ccd8'); R(19, 10, 3, 12, '#6a707a'); R(10, 17, 12, 1, '#6a707a');
        R(7, 9, 4, 5, '#9aa0aa'); R(21, 9, 4, 5, '#6a707a');
        R(12, 2, 8, 7, ink); R(13, 3, 6, 6, '#b8bcc8'); R(14, 5, 4, 1, ink); R(15, 3, 2, 1, '#e8ecf4');
        break;
      }
      case 'ó': { // cauldron
        R(6, 27, 21, 4, sh);
        R(9, 25, 3, 4, ink); R(21, 25, 3, 4, ink);
        E(16, 19, 12, 9, ink); E(16, 19, 11, 8, '#2a2630'); E(12, 16, 3, 2, '#4a4650');
        E(16, 12, 11, 3, ink); E(16, 12, 10, 2.5, frame ? '#5ae07a' : '#48c868'); E(13, 12, 2, 1, '#c8ffd0');
        if (frame) { R(19, 7, 2, 2, '#8affa0'); R(11, 5, 2, 2, '#8affa0'); } else R(15, 6, 2, 2, '#8affa0');
        break;
      }
      case 'ú': { // long table, set
        R(0, 26, 32, 4, sh);
        R(0, 8, 32, 17, ink); R(0, 9, 32, 14, '#8a5a30'); R(0, 9, 32, 2, '#a87440'); R(0, 21, 32, 2, '#6a4020');
        if (!(mask & 8)) R(0, 8, 32, 17, '#8a5a30'), R(0, 9, 32, 2, '#a87440');
        R(2, 23, 3, 6, '#5a3418'); R(27, 23, 3, 6, '#5a3418');
        const food = v % 4;
        E(9, 15, 5, 3, '#e8e0d0'); E(9, 14, 3.5, 2, food === 0 ? '#c8783a' : food === 1 ? '#e8c060' : '#a84a2a');
        R(19, 11, 4, 7, '#c8c0b0'); R(19, 11, 4, 1, '#ffffff'); R(25, 13, 3, 4, '#c8a040'); R(25, 12, 3, 1, '#f0e0a0');
        if (food === 3) { E(22, 16, 4, 2, '#d8b070'); R(20, 15, 1, 1, '#ffffff'); }
        break;
      }
      case 'ñ': { // shelves of bottles on the wall
        for (const y of [8, 18]) { R(2, y + 8, 28, 2, '#5a3418'); R(2, y + 8, 28, 1, '#8a5a30'); }
        const cols = ['#3a7a4a', '#8a2234', '#c8a040', '#4a6aa8', '#e8e0d0', '#6a2a7a'];
        for (let i = 0; i < 7; i++) { const c = cols[(i + v) % cols.length], bx = 3 + i * 4; R(bx, 9, 3, 7, ink); R(bx, 10, 2, 6, c); R(bx, 10, 1, 2, 'rgba(255,255,255,.5)'); R(bx, 7, 2, 2, '#4a3020'); }
        for (let i = 0; i < 6; i++) { const c = cols[(i * 2 + v) % cols.length], bx = 4 + i * 4.5; R(bx, 20, 3, 6, ink); R(bx, 21, 2, 5, c); R(bx, 21, 1, 1, '#ffffff'); }
        break;
      }
      case 'Ñ': { // kitchen counter
        R(0, 27, 32, 4, sh);
        R(0, 10, 32, 18, ink); R(0, 11, 32, 16, '#8a6038'); R(0, 11, 32, 3, '#c8b8a0'); R(0, 11, 32, 1, '#e8dcc8');
        R(3, 17, 12, 8, '#6a4424'); R(17, 17, 12, 8, '#6a4424'); R(9, 20, 2, 2, '#e0b84a'); R(21, 20, 2, 2, '#e0b84a');
        if (v % 2) { E(10, 10, 4, 2, '#e8e0d0'); R(8, 8, 2, 2, '#e05a3a'); R(11, 8, 2, 2, '#8ad06a'); } else { R(20, 6, 2, 6, '#c8ccd8'); R(19, 11, 4, 1, '#5a3418'); E(9, 10, 4, 2, '#d8c8a0'); }
        break;
      }
      case 'Ç': { // a tall mirror in a gilt frame
        R(6, 28, 21, 3, sh);
        R(7, 1, 18, 28, ink); R(8, 2, 16, 26, '#c8a040'); R(10, 4, 12, 22, '#5a7080');
        x.save(); x.globalAlpha = 0.25; x.fillStyle = '#fff'; x.beginPath(); x.moveTo(11, 24); x.lineTo(17, 5); x.lineTo(20, 5); x.lineTo(14, 24); x.fill(); x.restore();
        R(8, 2, 16, 1, '#f2d890');
        break;
      }
    }
  };
  // rugs join up with each other like paths do
  const sg0 = sameGroup;
  sameGroup = function (a, b) { if (a === 'à' || a === 'â') return b === a; return sg0(a, b); };
}
// things you can look at
{
  const it0 = WorldScene.prototype.interact;
  WorldScene.prototype.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy;
    const t = this.tile(x, y), T = INT_TILES[t];
    if (T && !this.npcAt(x, y) && !this.chestAt(x, y)) {
      if (t === 'Ç') { this.run(() => G.age === 'child' ? say(null, 'Your reflection pulls a face at you. You pull one back.') : wardrobe('The mirror', null, 'Your reflection looks back at you. Change something?')); return; }
      if (T.say) { this.run(() => say(null, pick(T.say))); return; }
    }
    return it0.call(this);
  };
}

// ---------------------------------------------------------------- the bigger rooms
// copy an old room into the top-left of a bigger one; the old door row becomes a wall you can fix up
function growRoom(old, w, h, seed) {
  const b = MB(w, h, 'o', seed); b.border('V');
  for (let y = 0; y < old.length - 1; y++) for (let x = 0; x < old[0].length; x++) b.set(x, y, old[y][x]);
  b.rect(1, old.length - 1, w - 2, 1, 'V');
  return b;
}
const TAVERN_BIG = (() => {
  const b = growRoom(TAVERN_ROWS, 26, 16, 61);
  // the old east wall opens into the lounge
  b.set(15, 4, 'o').set(15, 5, 'o').set(15, 6, 'o');
  // the old door becomes the way through to the dining hall; a second arch in the east
  b.set(7, 9, 'o').set(8, 9, 'o').set(19, 9, 'o').set(20, 9, 'o');
  // back wall: windows, bottles behind the bar, a painting and a banner
  b.set(1, 0, 'ñ').set(4, 0, 'ñ').set(17, 0, 'y').set(20, 0, 'é').set(23, 0, 'y').set(10, 0, 'è');
  // the lounge: big hearth, armchairs on a rug, the stairs, plants, a bard's corner
  b.set(19, 1, 'z').set(20, 1, 'z');
  b.rect(17, 3, 6, 4, 'à');
  b.set(17, 3, 'u').set(22, 3, 'u').set(19, 5, 't').set(20, 5, 't');
  b.set(24, 1, 'ë').set(24, 2, 'ë');
  b.set(16, 1, 'ç').set(16, 8, 'ç').set(24, 8, 'ç');
  b.rect(21, 7, 3, 2, 'â');
  b.set(17, 8, 'k').set(18, 8, 'û');
  // the dining hall: two long tables with benches, a kitchen corner, a reading nook
  b.rect(4, 11, 6, 1, 'u').rect(4, 12, 6, 1, 'ú').rect(4, 13, 6, 1, 'u');
  b.rect(15, 11, 6, 1, 'u').rect(15, 12, 6, 1, 'ú').rect(15, 13, 6, 1, 'u');
  b.set(1, 10, 'ï').set(1, 11, 'Ñ').set(1, 12, 'Ñ').set(1, 14, 'ò').set(2, 14, 'ò').set(2, 10, 'k');
  b.set(24, 10, 'b').set(24, 11, 'b').set(23, 14, 'ç').set(24, 14, 'û').set(22, 10, 'ç');
  b.rect(11, 10, 3, 5, 'à');
  b.set(12, 15, 'x').set(13, 15, 'x');
  return b.rows();
})();
const TAVERN_POIS_BIG = TAVERN_POIS.concat([
  { x: 19, y: 2, dir: 'up', act: 'fire' }, { x: 18, y: 3, dir: 'left', act: 'sit' }, { x: 21, y: 3, dir: 'right', act: 'sit' },
  { x: 22, y: 8, dir: 'up', act: 'display' }, { x: 3, y: 12, dir: 'right', act: 'sit' }, { x: 14, y: 12, dir: 'right', act: 'sit' },
  { x: 23, y: 11, dir: 'right', act: 'book' }, { x: 2, y: 11, dir: 'left', act: 'bar' }
]);

const SHOP_BIG = (() => {
  const b = growRoom(SHOP_ROWS, 20, 13, 62);
  b.set(11, 4, 'o').set(11, 5, 'o').set(11, 6, 'o');
  b.set(5, 8, 'o').set(6, 8, 'o').set(14, 8, 'o').set(15, 8, 'o');
  b.set(14, 0, 'y').set(17, 0, 'é').set(12, 0, 'è');
  b.set(13, 1, 'ì').set(15, 1, 'ì').set(17, 1, 'ì');
  b.set(13, 4, 'í').set(17, 4, 'í').set(15, 4, 'ç');
  b.set(18, 7, 'ù').set(17, 7, 'ù').set(12, 7, 'ò');
  b.set(18, 1, 'ç');
  b.set(1, 9, 'k').set(1, 11, 'k').set(2, 11, 'ò').set(4, 9, 'h').set(5, 9, 'h');
  b.set(13, 10, 'e').set(14, 10, 'e').set(17, 9, 'ù').set(18, 11, 'ç').set(18, 9, 'û');
  b.rect(8, 9, 4, 3, 'â');
  b.set(9, 12, 'x').set(10, 12, 'x');
  return b.rows();
})();
const SHOP_POIS_BIG = SHOP_POIS.concat([{ x: 14, y: 2, dir: 'up', act: 'display' }, { x: 15, y: 5, dir: 'down', act: 'display' }, { x: 13, y: 9, dir: 'down', act: 'display' }, { x: 3, y: 10, dir: 'left', act: 'display' }]);

const HOME_BIG = (() => {
  const b = growRoom(HOME_ROWS, 16, 11, 63);
  b.set(11, 2, 'o').set(11, 3, 'o').set(11, 4, 'o');
  b.set(5, 7, 'o').set(6, 7, 'o');
  b.set(13, 0, 'y').set(4, 0, 'é');
  b.set(13, 1, '{').set(14, 1, 'ô').set(12, 1, 'û').set(14, 6, 'ç').set(12, 6, 'k');
  b.rect(12, 3, 3, 2, 'â');
  b.set(1, 8, 'ï').set(2, 8, 'Ñ').set(3, 8, 'Ñ').set(1, 9, 'ò').set(14, 8, 'ç').set(12, 8, 'b').set(13, 8, 'b');
  b.set(9, 8, 't').set(10, 8, 't');
  b.rect(6, 8, 2, 2, 'à');
  b.set(7, 10, 'x').set(8, 10, 'x');
  return b.rows();
})();
const HOME_POIS_BIG = HOME_POIS.concat([{ x: 12, y: 4, dir: 'up', act: 'sit' }, { x: 4, y: 9, dir: 'left', act: 'bar' }]);

const MANOR_BIG = (() => {
  const b = growRoom(MANOR_ROWS, 32, 21, 64);
  // doors through the old east wall and the old front door
  b.set(21, 4, 'o').set(21, 9, 'o');
  b.set(10, 13, '-').set(11, 13, '-');
  // the dining room
  b.set(24, 0, 'y').set(26, 0, 'é').set(28, 0, 'y').set(30, 0, 'è');
  b.rect(24, 2, 5, 1, 'u').rect(24, 3, 5, 1, 'ú').rect(24, 4, 5, 1, 'u');
  b.set(30, 1, 'ô').set(22, 1, 'û').set(30, 6, 'ç').set(22, 6, 'ç');
  b.rect(22, 7, 9, 1, 'V'); b.set(26, 7, 'o');
  // the library
  b.rect(23, 8, 7, 1, 'b');
  b.set(25, 10, 't').set(26, 10, 't').set(24, 10, 'u').set(27, 10, 'u');
  b.set(30, 12, 'ç').set(22, 12, 'û').set(30, 9, 'b').set(30, 10, 'b');
  b.rect(23, 11, 6, 1, 'â');
  // the foyer
  b.rect(10, 14, 2, 6, '-');
  b.set(8, 15, 'í').set(13, 15, 'í').set(9, 19, 'ç').set(12, 19, 'ç');
  // the kitchens
  b.rect(7, 14, 1, 6, 'V'); b.set(7, 17, 'o');
  b.set(1, 14, 'ï').set(2, 14, 'ï').set(3, 14, 'Ñ').set(4, 14, 'Ñ').set(6, 14, 'k').set(1, 19, 'ò').set(2, 19, 'ò').set(3, 17, 'ú').set(4, 17, 'ú');
  // your own room
  b.rect(16, 14, 1, 6, 'V'); b.set(16, 16, 'o');
  b.set(29, 14, '{').set(30, 14, '{').set(27, 14, 'ô').set(18, 14, 't').set(19, 14, 'u').set(24, 14, 'Ç').set(30, 19, 'ç').set(22, 14, 'û');
  b.rect(20, 16, 7, 3, 'â');
  b.set(10, 20, 'x').set(11, 20, 'x');
  return b.rows();
})();
const MANOR_POIS_BIG = (MAPS.valen_manor.pois || []).filter(p => p.act !== 'door').concat([
  { x: 25, y: 5, dir: 'up', act: 'sit' }, { x: 26, y: 9, dir: 'up', act: 'book' }, { x: 3, y: 16, dir: 'up', act: 'bar' }, { x: 10, y: 19, dir: 'down', act: 'door' }
]);

// put the new rooms in place and move every door that led into them
(function regrow() {
  const R = [
    { old: TAVERN_ROWS, rows: TAVERN_BIG, pois: TAVERN_POIS_BIG, oldDoor: [7, 9], door: [12, 15], oldIn: [7, 8], newIn: [12, 14] },
    { old: SHOP_ROWS, rows: SHOP_BIG, pois: SHOP_POIS_BIG, oldDoor: [5, 8], door: [9, 12], oldIn: [5, 7], newIn: [9, 11] },
    { old: HOME_ROWS, rows: HOME_BIG, pois: HOME_POIS_BIG, oldDoor: [5, 7], door: [7, 10], oldIn: [5, 6], newIn: [7, 9] },
    { old: MANOR_ROWS, rows: MANOR_BIG, pois: MANOR_POIS_BIG, oldDoor: [10, 13], door: [10, 20], oldIn: [10, 12], newIn: [10, 19] }
  ];
  const grown = {};
  for (const id in MAPS) {
    const m = MAPS[id], r = R.find(r => m.rows === r.old);
    if (!r) continue;
    m.rows = r.rows;
    if (!m.pois || m.pois === SHOP_POIS || m.pois === TAVERN_POIS || m.pois === HOME_POIS || id === 'valen_manor') m.pois = r.pois;
    for (const w of m.warps) if (w.x === r.oldDoor[0] && w.y === r.oldDoor[1]) { w.x = r.door[0]; w.y = r.door[1]; }
    grown[id] = r;
  }
  for (const id in MAPS) for (const w of MAPS[id].warps) {
    const r = grown[w.to];
    if (r && w.tx === r.oldIn[0] && w.ty === r.oldIn[1]) { w.tx = r.newIn[0]; w.ty = r.newIn[1]; }
  }
  MAPS.valen_manor.npcs.push({ id: 'manorCook', x: 3, y: 16, spr: 'inn', dir: 'up', script: 'crowd', name: 'Cook Hesper', lines: () => [
    G.age === 'child' ? `Out of my kitchen, little lord. …Here. One biscuit. Now out.` : `Home! You're too thin. Sit. Eat. No, you're not too busy.`,
    `Lady Ysolde wants the venison for Sunday. The venison wants to stay in the woods. Nobody asks me.`,
    stage() >= 3 ? `They're rationing salt in Solmere. Salt! I've hidden two sacks under the stairs. You didn't hear that.` : `Mind the stove. It bites.`] });
  MAPS.valen_manor.npcs.push({ id: 'manorLib', x: 28, y: 10, spr: 'butler', dir: 'left', script: 'crowd', name: 'Old Fennick', lines: [
    `Your great-grandmother collected maps. Half of them are wrong. The wrong ones are the interesting ones.`,
    `The Accord of Dawn, first printing. Look — the Ashborn signatures have been scratched out. Not by time. By someone with a knife.`,
    `Shh. Not because of the books. I was asleep.`] });
})();
