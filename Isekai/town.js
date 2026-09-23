// =====================================================================
//  town.js : the lived-in world. Extra townsfolk, animals, homes you can
//  walk into, bunting over the streets, cloud shadows and water glints.
// =====================================================================

// ---------------------------------------------------------------- homes
const HOME_ROWS = [
  'VVyVVVVVyVVV',
  'V{hhozzob{bV',
  'VooooooooooV',
  'VoutuooommoV',
  'VooooooooooV',
  'VkooooooookV',
  'VooooooooeoV',
  'VVVVVxxVVVVV'
];
const HOME_POIS = [{ x: 6, y: 2, dir: 'up', act: 'fire' }, { x: 2, y: 4, dir: 'up', act: 'sit' }, { x: 9, y: 2, dir: 'up', act: 'book' }, { x: 6, y: 6, dir: 'down', act: 'door' }];
function homeMap(name, back, bx, by, npcs, amb) {
  return {
    name, music: MAPS[back].music, theme: 'interior', edge: 'V', interior: true, ambient: amb || 'rgba(255,180,100,.10)',
    rows: HOME_ROWS, pois: HOME_POIS, encounters: null, npcs,
    warps: [{ x: 5, y: 7, w: 2, h: 1, to: back, tx: bx, ty: by, dir: 'down' }],
    chests: [], signs: {}
  };
}
MAPS.valen_home = homeMap('Aldra\'s Cottage', 'valenford', 30, 18, [
  { id: 'bennet', x: 3, y: 2, spr: 'farmer', dir: 'down', script: 'bennet' },
  { id: 'aldraIn', x: 8, y: 4, spr: 'woman2', dir: 'down', script: 'valenFolk2', show: 'levyDone' },
  { id: 'colHome', x: 4, y: 5, spr: 'villager', dir: 'right', script: 'colHome', show: 'levyHome' },
  { id: 'lisbet', x: 9, y: 5, spr: 'kid2', dir: 'left', script: 'crowd', wander: 1, lines: [`Col's my brother. He's in the army. He's going to be a captain.`, `Mum cries when she thinks I'm asleep.`] }
]);
MAPS.cobb_home = homeMap('The Cobb House', 'brookvale', 22, 21, [
  { id: 'maren', x: 7, y: 2, spr: 'woman', dir: 'down', script: 'maren' },
  { id: 'nell', x: 3, y: 4, spr: 'kid', dir: 'right', script: 'nell', show: 'wispsDone' },
  { id: 'cobbCat', x: 9, y: 5, spr: 'pet:cat', dir: 'left', script: 'critter', wander: 1 }
]);
MAPS.elder_home = homeMap('Elder Bram\'s House', 'village', 5, 5, [
  { id: 'wila', x: 8, y: 2, spr: 'woman', dir: 'down', script: 'crowd', name: 'Wila', lines: () => [
    `Grandad talks about the last war like it was yesterday. Some days I think it still is, for him.`,
    `My brother Aric had the room upstairs. The potions Grandad gave you were his. …Use them. That's what they're for.`,
    stage() >= 3 ? `Ash on the windowsill again this morning. It's coming in on the east wind now.` : `Would you like tea? There's always tea.`] },
  { id: 'elderDog', x: 3, y: 5, spr: 'pet:dog', dir: 'right', script: 'critter', wander: 1 }
]);
MAPS.curio_shop = {
  name: 'Quill\'s Curiosities', music: 'capital', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(200,160,255,.10)',
  rows: SHOP_ROWS, pois: SHOP_POIS, encounters: null,
  npcs: [{ id: 'quill', x: 2, y: 2, spr: 'noble', dir: 'down', script: 'quill' },
         { id: 'quillCat', x: 8, y: 5, spr: 'pet:blackcat', dir: 'left', script: 'critter', wander: 1 }],
  warps: [{ x: 5, y: 8, w: 2, h: 1, to: 'solmere', tx: 30, ty: 31, dir: 'down' }],
  chests: [], signs: {}
};
MAPS.valenford.warps.push({ x: 30, y: 17, w: 1, h: 1, to: 'valen_home', tx: 5, ty: 6, dir: 'up' });
MAPS.brookvale.warps.push({ x: 22, y: 20, w: 1, h: 1, to: 'cobb_home', tx: 5, ty: 6, dir: 'up' });
MAPS.village.warps.push({ x: 5, y: 4, w: 1, h: 1, to: 'elder_home', tx: 5, ty: 6, dir: 'up' });
MAPS.solmere.warps.push({ x: 30, y: 30, w: 1, h: 1, to: 'curio_shop', tx: 5, ty: 7, dir: 'up' });
// the elder stood right on his own doorstep; move him to the garden
{ const e = MAPS.village.npcs.find(n => n.id === 'elder'); e.x = 7; e.y = 5; }

// ---------------------------------------------------------------- the crowd
// ordinary people with their own small lives. `lines` may be a function of the story so far.
function folk(id, x, y, spr, name, lines, extra) { return Object.assign({ id, x, y, spr, dir: 'down', script: 'crowd', name, lines, wander: 2 }, extra || {}); }
function pet(id, x, y, kind, wander = 2) { return { id, x, y, spr: 'pet:' + kind, dir: pick(['left', 'right']), script: 'critter', wander }; }
const CROWD = {
  valenford: [
    folk('vfBaker', 21, 18, 'shop', 'Baker Hesk', [`Fresh loaves! Well. Fresh this morning. Fresh-ish.`, `Your mother orders the seed cake every Sunday and pretends it's for the servants.`]),
    folk('vfWasher', 3, 21, 'woman', 'Liesl', [`If you're going to stand there, hold this sheet.`, `Wind's from the east today. Everything smells of smoke.`], { wander: 1 }),
    folk('vfLads', 33, 20, 'villager2', 'Stable Lad', () => !G.flags.questGiven ? [`You're the Valen kid! Can you do magic yet? Show me! …Please?`] : stage() === 0 ? [`Is it true? The herald came for YOU?`] : [`Wren sends letters to Old Pike, you know. He reads them to the horses.`]),
    folk('vfOld', 15, 22, 'elder', 'Old Tam', [`I carved that statue's nose. The first one fell off.`, `Your great-grandfather was a terrible dancer. I say that with love.`], { wander: 1 }),
    folk('vfGirl', 28, 27, 'villager3', 'Maddy', [`I'm practising sword on the hay. Don't tell Master Corwin, he'll make me do it properly.`, `When you come back, will you tell us what's on the other side?`]),
    folk('vfFarm2', 40, 29, 'farmer', 'Farmhand', [`Barley's high. We'll cut it next week if the ash holds off.`, `Pigs got out again. Don't ask.`]),
    folk('vfGuard2', 25, 12, 'guard', 'Manor Guard', [`All quiet, my lord. Except the geese. The geese are never quiet.`], { wander: 0 }),
    pet('vfCat', 11, 21, 'cat'), pet('vfDog', 26, 27, 'dog', 3),
    pet('vfHen1', 35, 27, 'chicken', 2), pet('vfHen2', 37, 26, 'chicken', 2), pet('vfHen3', 44, 30, 'chicken', 1)
  ],
  brookvale: [
    folk('bvFish', 26, 18, 'hunter2', 'Fisher Ode', [`River's full of trout this year. And something big. I've named it Duncan.`, `The wisps come out over the millpond at night. Pretty. Don't follow them.`], { dir: 'right', wander: 0 }),
    folk('bvWife', 8, 21, 'woman2', 'Hedda', [`My man's got the fever. Or had it. Depends which day you ask.`, `If you see Brother Oswin, tell him to eat.`], { wander: 1 }),
    folk('bvBoy', 22, 22, 'kid2', 'Cobb\'s Boy', () => G.flags.wispsDone ? [`Nell's all right! She says the lights sang to her. She's weird.`] : [`My dad's the miller. My sister keeps talking about the pretty lights on the water.`]),
    folk('bvStall', 13, 17, 'villager2', 'Stallholder', [`Honey, candles, fishing hooks. The honey and the hooks are separate, I promise.`], { wander: 0, dir: 'up' }),
    folk('bvOld', 35, 12, 'elder', 'Old Wenna', [`I've seen three wars from this bridge. They all started with people being very sure of themselves.`], { wander: 1 }),
    pet('bvGoose1', 31, 17, 'goose', 2), pet('bvGoose2', 32, 20, 'goose', 2), pet('bvCat', 7, 14, 'cat', 1), pet('bvHen', 38, 16, 'chicken', 2)
  ],
  village: [
    folk('alSmithy', 23, 9, 'smith', 'Farrier Joss', [`Shoes for your horse? No horse? Shoes for you, then.`, `Half my iron's gone east for spearheads.`], { wander: 1 }),
    folk('alMilitia', 27, 13, 'guard', 'Militia Recruit', () => stage() >= 5 ? [`Eleven weeks in the militia and I've only ever fought a goat.`] : [`They gave me a spear and a hat. The hat's too big.`, `Everybody says the ash is coming. I say let it come. …I don't mean that.`]),
    folk('alGran', 12, 14, 'woman', 'Gran Petty', [`Lyra — the elf girl — taught our Pip a light spell. He uses it to read under the blankets.`], { wander: 1 }),
    folk('alBard', 19, 7, 'villager2', 'Wandering Bard', () => [`♪ The Valen child went into the dark… ♪ I'm still working on the second verse.`, stage() >= 5 ? `I've got three endings for the song. Which one's true? You'd know.` : `Tell me something heroic. Anything. I'll exaggerate it.`], { wander: 0 }),
    pet('alSheep1', 15, 11, 'sheep', 1), pet('alSheep2', 17, 12, 'sheep', 1), pet('alCat', 3, 10, 'cat', 2), pet('alHen', 22, 14, 'chicken', 2)
  ],
  solmere: [
    folk('smCrier', 24, 17, 'herald', 'Town Crier', () => stage() === 0 ? [`HEAR YE! The levy is called again! All able hands to the muster at Aldmere!`] : stage() < 5 ? [`HEAR YE! The Valen heir rides east! Pray for the Valen heir! Also: bread prices are up.`] : [byEnd({ door: `HEAR YE! Raids on the east road! Travel in company!`, deal: `HEAR YE! By treaty, the Ashborn envoy has the freedom of the city! Please stop throwing cabbages at him!`, purge: `HEAR YE! Victory! The memorial will be unveiled at midsummer!` })], { wander: 1 }),
    folk('smLady', 30, 20, 'noblewoman', 'Lady Venn', [`Have you tried the candied figs? They're the only good thing about the capital.`, `My son is a knight. He writes that the ash tastes of pennies.`]),
    folk('smMerch', 27, 25, 'merchant', 'Spice Merchant', [`Pepper from the south coast! Saffron! One pinch will change your life, or at least your soup.`], { wander: 0, dir: 'up' }),
    folk('smKnight', 38, 19, 'royalguard', 'Knight of the Sun', [`We march east in the spring. Everyone says it will be over by summer. Everyone always says that.`], { wander: 1 }),
    folk('smSeam', 9, 23, 'villager3', 'Seamstress Ula', [`I've sewn nine banners with your house's colours this month. You're very fashionable now, my lord.`]),
    folk('smKids', 21, 27, 'kid', 'Street Kid', [`Race you to the fountain!`, `Is it true you're from another world? My sister says you've got a funny accent.`]),
    folk('smPriest', 36, 11, 'healer', 'Sister of the Dawn', [`The Dawn blesses all who walk toward the light. …And the ones who walk away from it, I'm told. Eventually.`], { wander: 1 }),
    folk('smPorter', 44, 20, 'thug', 'Porter', [`Mind your back! Crates coming through! …There are no crates. I just like saying it.`]),
    folk('smScholar', 8, 12, 'courtmage', 'Archivist Pell', () => [`The royal archive lists eleven "Heroes of the Dawn" before you. All foundlings. All from nowhere. Curious, isn't it?`, `Strange names, those heroes had. Hiroshi. Amaka. Joon. Names from nowhere.`], { wander: 1 }),
    pet('smPig1', 22, 19, 'pigeon', 3), pet('smPig2', 29, 19, 'pigeon', 3), pet('smPig3', 26, 22, 'pigeon', 2), pet('smCat', 6, 27, 'cat', 2), pet('smDog', 40, 34, 'dog', 3)
  ],
  ironhold: [
    folk('ihMiner', 18, 3, 'dwarf', 'Tired Miner', [`Twelve hours at the face. My beard's got more stone in it than the mine.`], { wander: 1 }),
    folk('ihCook', 24, 10, 'shop', 'Stew-Wife Brenna', [`Stew! It's got meat in it! Some kind!`], { wander: 0 }),
    folk('ihTwins', 9, 11, 'kid2', 'Dwarf Twins', [`We're twins! He's the ugly one.`, `When we grow up we're going to be the Warden.`]),
    folk('ihGuard', 16, 12, 'guard', 'Hold Guard', [`The deep tunnels echo at night. Could be the Warden. Could be my stomach.`], { wander: 1 }),
    pet('ihGoat', 22, 19, 'goat', 2), pet('ihDog', 6, 12, 'dog', 2)
  ],
  fernhollow: [
    folk('fhFletch', 20, 12, 'hunter', 'Fletcher Ivo', [`Grey goose feathers fly true. White ones fly pretty. Know which you want.`], { wander: 1 }),
    folk('fhGirl', 11, 9, 'villager3', 'Tansy', [`I found a fox kit under the lodge. Kestrel says I can keep it if I stop naming the arrows.`]),
    pet('fhFox', 17, 14, 'fox', 2), pet('fhDog', 15, 7, 'dog', 2)
  ],
  wastes: [
    folk('wsDeserter', 11, 14, 'demonm', 'Ashborn Deserter', () => G.ending === 'deal' ? [`I have a spade now. A spade! I dig all day. It is wonderful.`] : [`Don't look at me like that. I ran from the same war you're walking into.`, `The ash moves west a little every week. Like it's looking for something.`], { wander: 1 }),
    folk('wsTrader', 14, 14, 'villager2', 'Eldorian Trader', [`Dunstan says you can sell anything to anyone if you stand close enough to the fire.`], { wander: 1 }),
    folk('wsChild', 10, 13, 'nyx', 'Ashborn Child', () => G.ending === 'purge' ? null : [`Is it green where you're from? Really green? Like in the stories?`], { show: '!end_purge', wander: 1 })
  ]
};
for (const id in CROWD) MAPS[id].npcs.push(...CROWD[id]);

// ---------------------------------------------------------------- critters
const CRITTER_LINES = {
  cat: [`The cat allows you to exist near it.`, `The cat blinks at you, slowly. You have been approved of.`, `The cat is asleep in the one patch of sun. It will not be moving.`],
  blackcat: [`A black cat with one white whisker. It watches the door as if expecting someone else.`],
  dog: [`The dog leans its whole weight against your legs. This is a great honour.`, `The dog brings you a stick. You throw it. It is the best thing that has happened today, for both of you.`],
  chicken: [`Bawk.`, `The hen regards you with one furious eye.`],
  goose: [`The goose hisses. You back away. Some battles are not worth it.`],
  sheep: [`Baa.`, `The sheep is chewing thoughtfully. It has no opinions about the war.`],
  pigeon: [`The pigeon struts off, deeply offended.`],
  goat: [`The goat is eating a crate. Not the contents. The crate.`],
  fox: [`A fox kit! It tumbles over its own tail and pretends it meant to.`]
};
const CRITTER_LOOK = {
  cat: { b: '#e0903a', d: '#b8682a', l: '#f8c070', s: 'cat' }, blackcat: { b: '#2a2430', d: '#16121c', l: '#4a4458', s: 'cat' },
  dog: { b: '#a8744a', d: '#7a4e2a', l: '#d8a878', s: 'dog' }, fox: { b: '#e0702a', d: '#a84a1a', l: '#fff0e0', s: 'cat' },
  chicken: { b: '#f4f0e8', d: '#c8c0b0', l: '#ffffff', s: 'bird', c: '#e5534b' }, goose: { b: '#e8e8ec', d: '#a8a8b0', l: '#ffffff', s: 'bird', c: '#f2a03a', big: 1 },
  pigeon: { b: '#8a8aa0', d: '#5a5a70', l: '#b8b8d0', s: 'bird', c: '#8ac0a0' },
  sheep: { b: '#f0ece0', d: '#c8c0b0', l: '#ffffff', s: 'sheep' }, goat: { b: '#d8d0c0', d: '#9a9080', l: '#f0e8d8', s: 'sheep', horn: 1 }
};
function drawCritter(kind, dir, moving, sx, sy, n) {
  const L = CRITTER_LOOK[kind] || CRITTER_LOOK.cat;
  const flip = dir === 'left' ? -1 : 1;
  const t = TIME + (n ? n.hx * 0.7 + n.hy : 0);
  const bob = moving ? Math.abs(Math.sin(t * 16)) * 2 : 0;
  const cx = Math.round(sx + 16), base = Math.round(sy + 28 - bob);
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(flip > 0 ? cx + x : cx - x - w, base + y, w, h); };
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(cx, sy + 29, L.big || L.s === 'sheep' ? 9 : 7, 2.5, 0, 0, 7); ctx.fill();
  const ink = UI.ink;
  if (L.s === 'cat' || L.s === 'dog') {
    const dog = L.s === 'dog', tail = Math.sin(t * (dog ? 10 : 3)) * 2;
    R(-8, -8, 13, 7, ink); R(-7, -7, 11, 5, L.b); R(-7, -7, 11, 1, L.l); R(-7, -3, 11, 1, L.d);   // body
    R(-7, -2, 2, 3, ink); R(1, -2, 2, 3, ink); if (moving && Math.floor(t * 12) % 2) { R(-5, -2, 2, 3, ink); R(3, -2, 2, 3, ink); }
    R(-10, -11 + tail, 3, 5, ink); R(-9, -10 + tail, 1, 4, L.b);                                    // tail
    R(2, -14, 8, 8, ink); R(3, -13, 6, 6, L.b); R(3, -13, 6, 1, L.l);                               // head
    if (dog) { R(2, -13, 2, 5, L.d); R(8, -10, 3, 3, ink); R(8, -10, 2, 2, L.b); } else { R(3, -16, 2, 3, ink); R(7, -16, 2, 3, ink); R(3, -15, 1, 1, L.l); R(7, -15, 1, 1, L.l); }
    R(7, -11, 1, 2, '#1a1426'); if (kind === 'fox') R(8, -9, 2, 2, L.l);
  } else if (L.s === 'bird') {
    const peck = !moving && Math.sin(t * 3) > 0.6 ? 3 : 0, big = L.big ? 2 : 0;
    R(-6 - big, -8 - big, 11 + big, 8 + big, ink); R(-5 - big, -7 - big, 9 + big, 6 + big, L.b); R(-5 - big, -7 - big, 9 + big, 1, L.l); R(-3, -5, 5, 2, L.d);
    R(-8 - big, -9 - big, 3, 3, ink); R(-7 - big, -8 - big, 2, 2, L.d);                           // tail
    R(2, -12 - big - (L.big ? 4 : 0) + peck, 5, 6 + (L.big ? 4 : 0), ink); R(3, -11 - big - (L.big ? 4 : 0) + peck, 3, 5 + (L.big ? 4 : 0), L.b);
    R(6, -9 - big - (L.big ? 4 : 0) + peck, 3, 2, L.c); R(5, -10 - big - (L.big ? 4 : 0) + peck, 1, 1, '#1a1426');
    if (kind === 'chicken') R(3, -13 + peck, 3, 2, '#e5534b');
    R(-2, 0, 1, 2, '#e0a040'); R(1, 0, 1, 2, '#e0a040');
  } else { // sheep / goat
    const puff = L.horn ? 0 : 1;
    R(-9, -11, 16, 10, ink); R(-8, -10, 14, 8, L.b); if (puff) for (let i = 0; i < 5; i++) R(-8 + i * 3, -11, 2, 1, L.l);
    R(-8, -10, 14, 1, L.l); R(-8, -4, 14, 2, L.d);
    R(-7, -2, 2, 3, ink); R(3, -2, 2, 3, ink); R(-4, -2, 2, 3, ink); R(0, -2, 2, 3, ink);
    R(5, -13, 6, 7, ink); R(6, -12, 4, 5, L.horn ? L.b : '#3a3040'); R(8, -10, 1, 1, '#ffffff');
    if (L.horn) { R(5, -15, 2, 3, '#8a7a6a'); R(8, -15, 2, 3, '#8a7a6a'); R(10, -7, 1, 3, L.l); }
  }
}

// ---------------------------------------------------------------- bunting, clouds, glints
function drawBunting(world, camX, camY) {
  const x0 = Math.floor(camX / TS) - 20, y0 = Math.floor(camY / TS), x1 = x0 + Math.ceil(W / TS) + 21, y1 = y0 + Math.ceil(H / TS) + 1;
  const cols = ['#e5534b', '#f2c94c', '#3a7ad0', '#7ed36f', '#f28fad', '#ffffff'];
  for (let ty = y0; ty <= y1; ty++) for (let tx = Math.max(0, x0); tx <= x1; tx++) {
    if (world.tile(tx, ty) !== '|') continue;
    let ex = -1;
    for (let k = tx + 2; k < tx + 22 && k < world.w; k++) if (world.tile(k, ty) === '|') { ex = k; break; }
    if (ex < 0) continue;
    const ax = tx * TS + 16 - camX, bx = ex * TS + 16 - camX, ay = ty * TS - 2 - camY;
    const sag = 10 + (ex - tx) * 1.6, sway = Math.sin(TIME * 1.3 + tx) * 2;
    ctx.strokeStyle = 'rgba(60,40,30,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, ay + sag * 2 + sway, bx, ay); ctx.stroke();
    const n = Math.floor((bx - ax) / 11);
    for (let i = 1; i < n; i++) {
      const u = i / n, x = ax + (bx - ax) * u, y = ay + (1 - (2 * u - 1) ** 2) * (sag + sway / 2);
      const fl = Math.sin(TIME * 5 + i * 1.3 + tx) * 1.5;
      ctx.fillStyle = cols[(i + tx) % cols.length];
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineTo(x + fl, y + 8); ctx.fill();
    }
  }
}
function drawCloudShadows(world, camX, camY) {
  const m = world.map;
  if (m.interior || m.dark || m.theme === 'cave' || m.theme === 'night' || m.theme === 'castle' || !Gfx.weather) return;
  if (Weather.kind === 'storm' || Weather.kind === 'rain' || Weather.kind === 'fog') return;
  const mw = world.w * TS, mh = world.h * TS;
  ctx.save();
  ctx.fillStyle = m.theme === 'ash' ? 'rgba(20,0,0,.12)' : 'rgba(20,30,70,.11)';
  for (let i = 0; i < 5; i++) {
    const span = mw + 900;
    const wx = ((hash2(i, 5) % span) + TIME * (9 + i * 2)) % span - 450, wy = (hash2(i, 9) % Math.max(1, mh + 200)) - 100 + Math.sin(TIME * 0.05 + i) * 30;
    const sx = wx - camX, sy = wy - camY;
    if (sx < -300 || sx > W + 300 || sy < -200 || sy > H + 200) continue;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 150 + i * 20, 60 + i * 6, 0.1, 0, 7);
    ctx.ellipse(sx + 90, sy - 20, 90, 45, 0, 0, 7);
    ctx.ellipse(sx - 80, sy + 16, 80, 40, 0, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
function drawWaterGlints(world, camX, camY) {
  if (world.map.interior) return;
  const x0 = Math.floor(camX / TS), y0 = Math.floor(camY / TS);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let ty = y0; ty <= y0 + Math.ceil(H / TS); ty++) for (let tx = x0; tx <= x0 + Math.ceil(W / TS); tx++) {
    if (world.tile(tx, ty) !== '~') continue;
    for (let k = 0; k < 2; k++) {
      const ph = (TIME * 0.8 + (hash2(tx * 3 + k, ty) % 100) / 100) % 1;
      if (ph > 0.35) continue;
      const a = Math.sin(ph / 0.35 * Math.PI);
      const gx = tx * TS - camX + (hash2(tx, ty * 7 + k) % 26) + 3, gy = ty * TS - camY + (hash2(tx * 5 + k, ty) % 24) + 4;
      ctx.fillStyle = `rgba(255,255,240,${0.7 * a})`; ctx.fillRect(gx, gy, 3, 1); ctx.fillRect(gx + 1, gy - 1, 1, 3);
    }
  }
  ctx.restore();
}
// a gentle colour grade per place, so each region has its own mood
const GRADE = { grass: 'rgba(255,196,120,.10)', forestv: 'rgba(120,255,160,.07)', city: 'rgba(255,214,160,.10)', town: 'rgba(255,140,60,.05)', ash: 'rgba(255,80,40,.10)', castle: 'rgba(160,60,255,.08)', tokyo: 'rgba(255,120,200,.08)', night: 'rgba(80,120,255,.10)', cave: 'rgba(120,160,255,.06)' };
function drawGrade(world) {
  const g = GRADE[world.map.theme]; if (!g || world.map.interior) return;
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ---------------------------------------------------------------- hook it all into the world renderer
(function () {
  const P = WorldScene.prototype;
  const drawChar0 = P.drawChar;
  P.drawChar = function (key, dir, frame, sx, sy, n) {
    if (key.startsWith('pet:')) { drawCritter(key.slice(4), dir, n && n.t < 1, sx, sy, n); return; }
    return drawChar0.call(this, key, dir, frame, sx, sy, n);
  };
  const drawLifeAir0 = P.drawLifeAir;
  P.drawLifeAir = function (camX, camY) {
    drawLifeAir0.call(this, camX, camY);
    drawBunting(this, camX, camY);
    drawCloudShadows(this, camX, camY);
  };
  const drawLifeGround0 = P.drawLifeGround;
  P.drawLifeGround = function (camX, camY) { drawWaterGlints(this, camX, camY); drawLifeGround0.call(this, camX, camY); };
  // the grade goes on after the lighting and before bloom; the world calls Weather.drawWorld right there
  let drawingWorld = null;
  const draw0 = P.draw;
  P.draw = function () { drawingWorld = this; try { draw0.call(this); } finally { drawingWorld = null; } };
  const wdw = Weather.drawWorld.bind(Weather);
  Weather.drawWorld = function () { if (drawingWorld) drawGrade(drawingWorld); wdw(); };
})();

// ---------------------------------------------------------------- scripts for the crowd
STORY.crowd = async function (n) {
  let lines = typeof n.lines === 'function' ? n.lines() : n.lines;
  if (!lines || !lines.length) return;
  lines = lines.filter(Boolean);
  // cycle rather than repeat
  n._li = ((n._li === undefined ? Math.floor(Math.random() * lines.length) - 1 : n._li) + 1) % lines.length;
  await say(n.name || null, lines[n._li], n.spr);
};
STORY.critter = async function (n) {
  const kind = n.spr.slice(4);
  Sound.sfx('cursor');
  await say(null, pick(CRITTER_LINES[kind] || CRITTER_LINES.cat));
  if ((kind === 'cat' || kind === 'dog') && !G.flags['pet_' + n.id]) { G.flags['pet_' + n.id] = true; moraleAll(1, true); }
};
