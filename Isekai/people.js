// =====================================================================
//  people.js : who lives in the new country, and what lies about in it
//   - the folk of Gullhaven, Cairnstead and Mirewatch; travellers,
//     patrols, pilgrims, shepherds and a hermit out on the roads
//   - Pim, the wandering merchant; Ottilie, the cartographer
//   - pickups: Memory Shards, bogbloom, firewood — glinting where they lie
//   - Memory Shards: twenty slivers of your old life, each one a memory
//   - hunting marks: six named beasts, and a huntmaster who pays for them
// =====================================================================

// ---------------------------------------------------------------- inns and shops
{
  const inn0 = STORY.inn;
  STORY.inn = async function (n) {
    const who = { gull_inn: ['Bess', 'fishwife'], cairn_inn: ['Ailsa', 'inn'], mire_inn: ['Tull', 'fenfolk'] }[G.map];
    if (who) return innScene(who[0], who[1]);
    return inn0.call(this, n);
  };
}
STORY.shopGull = async function () { await shopScene('gullhaven', 'Tidewright', 'sailor'); };
STORY.shopCairn = async function () { await shopScene('cairnstead', 'Gorse', 'highlander'); };
STORY.shopMire = async function () { await shopScene('mirewatch', 'Odds', 'fenfolk'); };

// ---------------------------------------------------------------- the people of the new towns
const PEOPLE = {
  gullhaven: [
    folk('gFisher', 13, 23, 'sailor', 'Old Salt Dace', () => [
      G.flags.lightDone ? `The light's back. First night I slept since spring.` : `Three boats lost since the light went out. Three. My brother was on the second.`,
      `You want to know where the fish went? Ask the gulls. They know everything and tell nobody.`,
      `Mind the piers after dark. The boards have opinions.`]),
    folk('gFishwife', 25, 23, 'fishwife', 'Marta', [`Herring, mackerel, something with too many eyes — all fresh this morning.`, `If you see my husband in the Salt & Sixpence, tell him the nets won't mend themselves.`, `The harbourmaster's a good woman. Hard, mind. The sea makes you hard or it makes you drowned.`], { wander: 2 }),
    folk('gSailor', 31, 13, 'sailor', 'Deckhand Rook', () => [
      `I've seen lights on the cliffs at night. Not the lighthouse. Someone waving a lantern where no sane person stands.`,
      G.flags.sorrelDone ? `Sorrel's crew's broken. Good. Sorrel herself — I don't know what I think about Sorrel.` : `They say the wreckers have a cave under the east cliff. They say a lot of things in the Sixpence after midnight.`,
      `The Ashborn never came this far west. The sea scares them, I think. It scares me too.`], { wander: 2 }),
    folk('gKid', 18, 18, 'kid', 'Wim', [`Pip says she found a bottle with a magic glass in it! She won't let me hold it.`, `When I'm big I'm going to be a lighthouse.`, `Not a lighthouse KEEPER. A lighthouse.`], { wander: 2 }),
    folk('gGuard', 24, 2, 'patrol', 'Harbour Watch', [`Gullhaven. Mind your purse at the market and your feet on the piers.`, `Valenford's back up the road, north-east. The capital's beyond that.`]),
    folk('gOld', 40, 9, 'elder', 'Grandmother Wynne', [`I remember the year the light was first lit. I was six. My father cried. He never cried.`, `Sit with me a while. The sea's better company when there's two of you.`, `Do you hear it? The bell, out on the water. No? I hear it some nights. Like a little brass bell on a string.`]),
    pet('gCat', 15, 10, 'cat', 2), pet('gGull1', 9, 24, 'pigeon', 2), pet('gGull2', 34, 24, 'pigeon', 2)
  ],
  gull_inn: [
    folk('giPatron', 18, 4, 'sailor', 'Bosun Haggard', [`Sit, sit. Anybody who's walked the coast road deserves a drink.`, `I sailed to the Spice Isles once. Came back with three teeth fewer and a parrot that only swears in elvish.`]),
    folk('giPatron2', 3, 12, 'fishwife', 'Nan Pelling', [`The fish stew's the best on the coast. Don't ask what's in it. Nobody knows. That's why it's good.`]),
    folk('giBard', 22, 8, 'villager2', 'Sea Singer', [`A sea song? All right. "Oh, the light went out on the western shore…" — no, too sad. Too true.`, `Every sailor's song is about coming home. Nobody writes them about leaving.`], { emote: '♪' })
  ],
  gull_shop: [folk('gsAppr', 14, 9, 'kid2', 'Apprentice Lo', [`Mister Tidewright says I'm not allowed to sell the anchors. They're very heavy. I tried.`])],
  cairnstead: [
    folk('cHerder', 8, 14, 'highlander', 'Herder Calum', () => [
      G.flags.wolvesDone ? `Not a wolf on the moor this past week. The ewes are fattening up again.` : `Lost six ewes this month to the wolves. Six! The pack's grown bold since the winter.`,
      `Don't stand in the stone circle at midnight. Not because of ghosts. Because Morwen will tell you off.`]),
    folk('cWoman', 22, 22, 'woman', 'Ishbel', [`The barrow on the moor's been quiet three hundred years. Since spring, the dead have been walking out of it.`, `My grandmother says the king under the barrow was a man once. A good one, even, before the crown got him.`], { wander: 2 }),
    folk('cKid', 16, 20, 'kid2', 'Fionn', [`Ewan lost his sheep again! He loses them every week. They're not even hiding, they just walk off.`, `I'm going to be a chieftain like Bryony. She can lift a cow. I've seen her.`], { wander: 2 }),
    folk('cGuard', 21, 26, 'highlander', 'Watcher Gregor', [`Cairnstead. Highmoor's last village before the sea. Speak plain and you'll be welcome.`, `Bryony's in the longhouse. Morwen's hut is east, past the stones.`]),
    folk('cPiper', 24, 13, 'highlander', 'Old Angus', [`The pipes? Aye. I play them for the stones. They've no ears but they like it.`, `There's a tune for every death on the moor. I know four hundred of them. I'm hoping not to learn more.`], { emote: '♪' }),
    pet('cSheep1', 7, 13, 'sheep', 2), pet('cSheep2', 10, 15, 'sheep', 2), pet('cSheep3', 6, 15, 'sheep', 1), pet('cGoat', 30, 16, 'goat', 2), pet('cDog', 14, 10, 'dog', 2)
  ],
  cairn_long: [
    folk('clGuard1', 9, 2, 'highlander', 'Hearth-Guard', [`The chieftain will see you. Mind the fire, and mind your tongue.`]),
    folk('clGuard2', 14, 2, 'highlander', 'Hearth-Guard', [`Bryony took the chieftain's seat at twenty. Nobody argued. Not twice.`])
  ],
  cairn_inn: [
    folk('ciPatron', 18, 4, 'highlander', 'Drover Neil', [`Drove two hundred head over the pass to Valenford last autumn. Came back with a bad knee and a good story.`, `The whisky here would strip paint. Have some.`]),
    folk('ciPatron2', 10, 12, 'woman2', 'Kirsty', [`Ailsa makes the best oatcakes on the moor. She'll tell you so. She's right, though.`])
  ],
  mirewatch: [
    folk('mFerry', 6, 16, 'ferryman', 'Ferryman Cole', [`The boards go everywhere worth going. The fen goes everywhere else.`, `I've poled this fen forty years. I've seen the lights. I've never followed them. That's how you get to forty years.`]),
    folk('mWoman', 22, 16, 'fenfolk', 'Moss', () => [
      G.flags.blooms ? `Granny Hesk's brewing again! The whole village smells of it. In a good way. Mostly.` : `The rot's in half the houses now. Hesk says she can cure it, but she needs the bloom from the deep fen.`,
      `We're fen-folk. We've been here since before the kings. The kings never wanted the fen, so they let us keep it.`], { wander: 2 }),
    folk('mKid', 19, 23, 'kid', 'Tadpole', [`My real name's Tad. Everyone calls me Tadpole. I'm going to grow into a frog, Granny Hesk says.`, `There's a temple under the water! I saw the roof when the water was low. Mum says don't be daft.`], { wander: 1 }),
    folk('mOld', 34, 12, 'fenfolk', 'Old Bracken', () => [
      G.flags.hydraDone ? `The water's clearing. I saw a fish yesterday. A fish! In the Mire!` : `Something's waking in the Sunken Shrine. The water's gone sour, and the frogs have stopped singing.`,
      `The shrine's south-east, off the trail. Old stones under the water. Older than Solmere.`]),
    pet('mGoose', 27, 13, 'goose', 2), pet('mCat', 12, 7, 'blackcat', 1)
  ],
  mire_inn: [
    folk('miPatron', 18, 4, 'fenfolk', 'Eel-Catcher Brine', [`Eel pie? Eel stew? Eel on a stick? I've got eel.`, `Don't drink the water. Drink the ale. The ale's made from the water, but it's been through a process.`]),
    folk('miPatron2', 3, 12, 'pilgrim', 'Pilgrim Asa', [`I walk to the Sunken Shrine every spring to pray. This spring I turned back at the water. Something was looking at me from it.`])
  ]
};
for (const id in PEOPLE) MAPS[id].npcs.push(...PEOPLE[id]);

// ---------------------------------------------------------------- out on the roads
MAPS.overworld.npcs.push(
  folk('owTrav1', 66, 70, 'villager', 'Traveller', [`Walking to Brookvale. My feet hate me. My feet have always hated me.`, `There's a fire by the roadside west of Valenford. Folk share it. Mind the bandits south, in the red hills.`], { wander: 2 }),
  folk('owTrav2', 112, 70, 'woman', 'Carter\'s Wife', [`Our cart threw a wheel outside Aldmere. My husband's walking back for a new one. I'm sitting here being decorative.`]),
  folk('owPilgrim', 98, 28, 'pilgrim', 'Pilgrim Orrin', [`I'm walking to the Silvane Grove. The elves are gone, but the trees still pray, if you listen.`, `The grove's north-west of Fernhollow, up the old trail. Something has gone wrong there. The trees are grey at the edges.`]),
  folk('owPatrol1', 80, 98, 'patrol', 'Crown Patrol', () => [G.flags.kettleDone ? `Redcrag's cleared, thanks to you. The roads are almost safe. Almost.` : `Redcrag Fort, in the hills west of here. Bandits. Captain Hale at the city gate is offering silver for anyone fool enough.`, `The capital's south gate is just there. Keep your blade peace-bound inside the walls.`]),
  folk('owPatrol2', 128, 112, 'patrol', 'Crown Patrol', [`East is Mirewatch. Fen-folk. Good people, strange tea.`, `Don't step off the boards in the fen. I'm serious. My sergeant stepped off the boards.`]),
  folk('owShep', 36, 38, 'ewan', 'Ewan', [`Have you seen my sheep? Four of them. They've got blue paint on their bums. Please don't laugh.`], { script: 'ewan' }),
  folk('owSverra', 179, 26, 'sverra', 'Old Sverra', [], { script: 'sverra' }),
  folk('owOttilie', 104, 57, 'ottilie', 'Ottilie the Cartographer', [], { script: 'ottilie' }),
  folk('owPim', 46, 71, 'pim', 'Pim', [], { script: 'pim', fixed: true }),
  folk('owDwarf', 147, 50, 'dwarf', 'Dwarf Prospector', () => [G.flags.chief ? `Pass is open again! Back to Ironhold, and a bath, and another bath.` : `The goblins have barricaded the pass. Two weeks I've been camped here. I've eaten my boots. Not both. One and a half.`, `There's star-iron in those mountains. And harpies. Mostly harpies.`]),
  folk('owFisher', 92, 72, 'fisherOde', 'Lake Fisher', [`Lake Mirrow. Best fishing in Eldoria, if you don't mind the odd drowned roof.`, `On still mornings you can see the towers of Old Aurel down there. The causeway's from the old days. Someone still keeps it mended. I've never seen who.`]),
  folk('owAshScout', 172, 74, 'demonm', 'Ashborn Wanderer', () => [G.ending === 'deal' ? `Peace. Strange word. I'm still learning to say it without laughing.` : G.ending === 'purge' ? `…` : `Don't draw. I'm not a soldier. I came through the Rift with my family when it cracked. We just want somewhere that isn't ash.`, `The Rift is east. You can feel it in your teeth.`], { show: '!end_purge' }),
  pet('owSheep1', 30, 44, 'sheep', 2), pet('owSheep2', 33, 50, 'sheep', 2), pet('owGoat1', 158, 34, 'goat', 2), pet('owFox', 125, 34, 'fox', 2), pet('owGull', 22, 102, 'pigeon', 2)
);
if (!CHARS.fisherOde) CHARS.fisherOde = CHARS.hunter;

// ---------------------------------------------------------------- Pim, who is never in the same place twice
const PIM_SPOTS = [[46, 71], [120, 70], [82, 112], [146, 120], [104, 42], [32, 98]];
{
  const rn0 = WorldScene.prototype.refreshNpcs;
  WorldScene.prototype.refreshNpcs = function (reset) {
    if (this.map === MAPS.overworld) {
      const n = this.map.npcs.find(q => q.id === 'owPim');
      if (n) { const s = PIM_SPOTS[Math.floor((G.playTime || 0) / 900) % PIM_SPOTS.length]; n.x = s[0]; n.y = s[1]; }
    }
    return rn0.call(this, reset);
  };
}
STORY.pim = async function () {
  if (!G.flags.pimMet) {
    G.flags.pimMet = true;
    await talk([
      ['Pim', `A customer! On this road! I knew today felt lucky. I'm Pim — merchant, explorer, occasional poet. Mostly merchant.`, 'pim'],
      ['Pim', `I don't keep a shop. Shops are for people who like being found. I keep a cart, and the cart keeps moving.`, 'pim'],
      ['Pim', `Things I've found in ruins and won off dwarves at cards. Expensive, and worth it. Usually worth it.`, 'pim']
    ]);
  } else await say('Pim', pick([`You again! Fate, or you're following me. Either is good for business.`, `New stock! Well. Old stock, new to you.`, `I was at the coast last week. I'll be somewhere else next week. That's the charm.`]), 'pim');
  await shopScene('pim', 'Pim', 'pim');
};

// ---------------------------------------------------------------- Ottilie and her map of the world
STORY.ottilie = async function () {
  const N = 'Ottilie', s = 'ottilie', st = owState(), found = Object.keys(st.regions).length, all = OW.RKEYS.length;
  if (G.flags.mapDone) { await say(N, pick([`My map's at the printer's in Solmere. Your name's in the corner. Small. But there.`, `Every map is wrong. Ours is the least wrong one there's ever been.`]), s); return; }
  if (!G.flags.mapAsked) {
    G.flags.mapAsked = true; sideStart('The Whole of the World');
    await talk([
      [N, `Hold still. No — move left. You're standing on the river. I mean the river on my map.`, s],
      [N, `I'm Ottilie. Royal Cartographer, or I will be, the day I finish this. Nobody's mapped all of Eldoria since the Accord. Half the old maps have dragons drawn where the fen should be.`, s],
      [N, `You're a traveller. You look like one, anyway — mud to the knees. Walk the whole country for me: every region, from the coast to the snow to the ash. Come back and tell me what's really there.`, s]
    ]);
  }
  if (found >= all) {
    G.flags.mapDone = true;
    await talk([
      [N, `All ${all}? The moor, the fen, the Frostpeak snow — the Rift Marches? …You walked to the Rift Marches.`, s],
      [N, `This is the first true map of Eldoria in three hundred years. Take these. Explorers' things. They belong with someone who explores.`, s]
    ]);
    addItem('star', 1); addItem('elixir', 2); G.gold += 1500; Sound.sfx('coin');
    await say(null, 'Received a Starlight Robe, 2 Elixirs and 1500 G.');
    sideDone('The Whole of the World');
    return;
  }
  const missing = OW.RKEYS.filter(k => !st.regions[k]).map(k => OW.REGIONS[k].name);
  await say(N, `${found} of ${all} regions so far. Still blank on my map: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', and more' : ''}.`, s);
};

// ---------------------------------------------------------------- pickups: things that glint on the ground
// [id, map, x, y, kind, show]
const PICKUPS = [
  // memory shards out in the world
  ['sh_o1', 'overworld', 23, 22, 'shard'], ['sh_o2', 'overworld', 12, 120, 'shard'], ['sh_o3', 'overworld', 100, 79, 'shard'], ['sh_o4', 'overworld', 160, 140, 'shard'],
  ['sh_o5', 'overworld', 190, 44, 'shard'], ['sh_o6', 'overworld', 70, 31, 'shard'], ['sh_o7', 'overworld', 145, 25, 'shard'], ['sh_o8', 'overworld', 186, 12, 'shard'],
  ['sh_o9', 'overworld', 58, 120, 'shard'], ['sh_o10', 'overworld', 132, 46, 'shard'],
  // bogbloom for Granny Hesk, deep in the fen
  ['bb1', 'overworld', 172, 110, 'bogbloom', 'bloomAsked'], ['bb2', 'overworld', 138, 138, 'bogbloom', 'bloomAsked'], ['bb3', 'overworld', 182, 132, 'bogbloom', 'bloomAsked'],
  // dry firewood for Old Sverra, on the pass
  ['fw1', 'overworld', 184, 8, 'firewood', 'woodAsked'], ['fw2', 'overworld', 192, 20, 'firewood', 'woodAsked'], ['fw3', 'overworld', 179, 6, 'firewood', 'woodAsked'], ['fw4', 'overworld', 188, 26, 'firewood', 'woodAsked']
];
function pickupsHere() { return PICKUPS.filter(p => p[1] === G.map && !G.flags['pk_' + p[0]] && (!p[5] || flag(p[5]))); }
{
  const P = WorldScene.prototype;
  // every pickup must stand on open ground; nudge any that landed on something solid
  const fixPickups = () => {
    for (const p of PICKUPS) {
      const m = MAPS[p[1]], ok = (x, y) => m.rows[y] && m.rows[y][x] !== undefined && !SOLID.has(m.rows[y][x]) && !(m.warps || []).some(w => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h);
      if (ok(p[2], p[3])) continue;
      outer: for (let d = 1; d < 8; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (ok(p[2] + dx, p[3] + dy)) { p[2] += dx; p[3] += dy; break outer; }
    }
  };
  fixPickups();
  const step0 = P.onStep;
  P.onStep = function () {
    const p = this.player;
    const pk = pickupsHere().find(q => q[2] === p.x && q[3] === p.y);
    if (pk) { this.run(() => takePickup(pk)); return; }
    return step0.call(this);
  };
  const gr0 = P.drawLifeGround;
  P.drawLifeGround = function (camX, camY) {
    gr0.call(this, camX, camY);
    for (const q of pickupsHere()) {
      const sx = q[2] * TS - camX + 16, sy = q[3] * TS - camY + 20;
      if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
      const col = { shard: 'rgba(190,220,255,.6)', bogbloom: 'rgba(240,255,220,.55)', firewood: 'rgba(255,200,140,.4)' }[q[4]];
      glow(sx, sy, 16 + Math.sin(TIME * 4 + q[2]) * 3, col);
      const s = 2 + Math.round((Math.sin(TIME * 5 + q[3]) + 1) * 1.5);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - s, sy, s * 2 + 1, 1); ctx.fillRect(sx, sy - s, 1, s * 2 + 1);
      if (q[4] === 'shard') { ctx.fillStyle = '#bfe6ff'; ctx.fillRect(sx - 1, sy - 2, 3, 5); }
      if (q[4] === 'bogbloom') { ctx.fillStyle = '#f4f8e8'; ctx.fillRect(sx - 2, sy - 1, 5, 3); ctx.fillStyle = '#4a7a3a'; ctx.fillRect(sx, sy + 2, 1, 3); }
      if (q[4] === 'firewood') { ctx.fillStyle = '#8a5a30'; ctx.fillRect(sx - 4, sy + 1, 9, 2); ctx.fillRect(sx - 3, sy - 1, 7, 2); }
    }
  };
}
async function takePickup(p) {
  G.flags['pk_' + p[0]] = true;
  Sound.sfx('pickup');
  if (p[4] === 'shard') return gainShard();
  if (p[4] === 'bogbloom') { addItem('bogbloom'); await say(null, `A bogbloom, fat and white, growing where the water is blackest. (${itemCount('bogbloom')}/3)`); return; }
  if (p[4] === 'firewood') { addItem('firewood'); await say(null, `A bundle of dry pine, sheltered under an overhang. (${itemCount('firewood')}/4)`); return; }
}

// ---------------------------------------------------------------- Memory Shards
const SHARD_MEMORIES = [
  [`Mei, aged five, in a paper crown. She has decided she is the Empress of the Living Room. You are her horse.`],
  [`Mum's handwriting on a note on the fridge: "Rice in the cooker. Don't let your sister have the last pudding. I love you both. Even when you fight."`],
  [`Daichi, first year, holding a shinai like it might bite him. "I'm only joining because my dad made me." He became captain.`],
  [`The rooftop at lunch. Aoi is pretending not to cry about something. You split your melon bread with her and don't ask. She remembers that for years.`],
  [`A summer festival. Yukata, goldfish in a bag, Mei asleep on your back on the walk home, sticky with candy floss.`],
  [`Dad's last call from Osaka, the week before. "Look after them for me, champ." You said "Yeah, yeah." You'd say it properly now.`],
  [`The kendo hall at 6 a.m. in winter. Bare feet on frozen boards. You hated it. You'd give a lot to feel the cold again.`],
  [`Kitazawa shrine at New Year. Mum paid for a fortune. It said "Great blessing, after great loss." She laughed and tied it to the tree.`],
  [`Your room: a poster with a corner coming off, a window over the train line, the 23:14 rattling the glass every night.`],
  [`Mei asking if heaven has wifi. You said probably not. She said then she isn't going.`],
  [`The konbini clerk who always gave you an extra pair of chopsticks. You never learned her name.`],
  [`A rainy Sunday, all four of you in the tiny living room, watching a terrible film. Nobody wanted to be anywhere else.`],
  [`Daichi, after your first tournament loss: "You'll hesitate less next time." You did. Just not soon enough, in the end.`],
  [`Aoi, at the school gate, the last day: "Don't be late tomorrow." You weren't late. You just didn't come.`],
  [`The smell of Mum's curry on a Tuesday. You can't remember the recipe. You'd give anything for the recipe.`],
  [`Mei's thirteenth birthday cake, strawberry shortcake, in a box on the pavement by the crossing. Nobody ate it.`],
  [`A bell. Small, brass, on a red cord. Mei tied it to your school bag for luck in your first year. You never took it off.`],
  [`Your own funeral. You were not there, and you saw it anyway. Mei did not cry until everyone had gone home.`],
  [`Mei, older now, at the shrine, alone. She is talking to you. She does this every year. She tells you about her life. She is going to be a doctor.`],
  [`A voice — a woman's, kind and tired — saying, "This one will be the twelfth. I'm sorry. I'm so sorry. Let them find their way home, if they want to."`]
];
function shardCount() { return G.flags.shards || 0; }
async function gainShard() {
  const i = shardCount();
  G.flags.shards = i + 1;
  addItem('shard');
  Sound.sfx('magic');
  toast(`Memory Shard ${i + 1}/20`, '#bfe6ff');
  await shardVision(i);
}
async function shardVision(i) {
  const lines = SHARD_MEMORIES[Math.min(i, SHARD_MEMORIES.length - 1)];
  await fadeOut(0.4, '#ffffff');
  const s = new DreamScene(i >= 17 ? 'crossing2' : i % 3 === 2 ? 'void' : 'crossing');
  Scenes.push(s);
  const tr = Sound.trackName; Sound.stop(); Sound.play('void');
  Fade.col = '#ffffff'; await fadeIn(0.8);
  await say(null, 'You hold the shard up to the light. Behind the glass, a street you know.');
  for (const l of lines) await say(null, l);
  await fadeOut(0.6, '#ffffff');
  Scenes.remove(s); Fade.col = '#000';
  Sound.stop(); Sound.play(musicFor(G.map));
  await fadeIn(0.5);
  if (i + 1 === 5 || i + 1 === 10 || i + 1 === 15 || i + 1 === 20) await say(null, `You have ${i + 1} Memory Shards. Quill, the antiquarian in Solmere, collects strange glass. He might know what they are.`);
}
// chests that hold shards play the memory too
{
  const oc0 = openChest;
  openChest = async function (c) {
    if (c.item === 'shard' && !G.flags['chest_' + c.id]) { G.flags['chest_' + c.id] = true; Sound.sfx('chest'); await say(null, 'Inside, wrapped in a scrap of sailcloth: a sliver of glass that shines from the inside.'); await gainShard(); return; }
    return oc0(c);
  };
}
// Quill pays for them
{
  const q0 = STORY.quill;
  STORY.quill = async function (n) {
    const c = shardCount(), paid = G.flags.shardPaid || 0, tiers = [5, 10, 15, 20];
    let next = tiers.find(t => t > paid && c >= t), paidAny = false;
    while (next) {
      paidAny = true;
      G.flags.shardPaid = next;
      const R = { 5: [['hiether', 3]], 10: [['elixir', 2]], 15: [['tonic', 4], ['elixir', 1]], 20: [['elixir', 3]] }[next];
      await talk([
        ['Quill', next === 5 ? `Glass that shows a city that isn't anywhere? May I? …Oh. Oh my. Those are towers taller than the palace. Those carts have no horses.` : next === 10 ? `Ten. Do you know, I dreamed of your city last night. A crossing, a red light. It felt like grief.` : next === 15 ? `Fifteen. They're pieces of a person, I think. Whoever you were before. I'm almost afraid to ask.` : `All twenty. A whole life, in glass. I won't ask what it costs to carry. Keep them. They're yours. They were always yours.`, 'noble'],
        ['Quill', `Here — take these. I can't pay you what they're worth. Nobody could.`, 'noble']
      ]);
      for (const [id, q] of R) addItem(id, q);
      Sound.sfx('coin'); await say(null, 'Received ' + R.map(([id, q]) => `${q}× ${ITEMS[id].name}`).join(', ') + '.');
      if (next === 20) { G.flags.shardsAll = true; await say('Quill', `There's something else. The bell — the one that rang alone. The shards hum when they're near it. If anyone could tell you what that means, it's the goddess's people. Or the goddess.`, 'noble'); }
      next = tiers.find(t => t > G.flags.shardPaid && c >= t);
    }
    if (paidAny) return;
    return q0 ? q0.call(this, n) : undefined;
  };
}

// ---------------------------------------------------------------- hunting marks
const HUNT_MARKS = [
  { id: 'tusk', name: 'Old Tusk', foe: 'boar', mult: 1.25, map: 'overworld', x: 18, y: 32, spr: 'm:tusk', where: 'the western edge of Highmoor', reward: [600, 'tonic', 2] },
  { id: 'storm', name: 'Stormwing', foe: 'gull', mult: 1.4, map: 'overworld', x: 44, y: 128, spr: 'm:gull', where: 'the sea cliffs south of Gullhaven', reward: [600, 'hiether', 2] },
  { id: 'widow', name: 'The Grey Widow', foe: 'spider', mult: 1.6, map: 'overworld', x: 156, y: 70, spr: 'm:widow', where: 'the eastern Whisperwood', reward: [700, 'phoenix', 3] },
  { id: 'crag', name: 'Cragback', foe: 'cragling', mult: 1.3, map: 'overworld', x: 140, y: 12, spr: 'm:crag', where: 'the north-west peaks above Ironhold', reward: [1000, 'mega', 2] },
  { id: 'bogmaw', name: 'Bogmaw', foe: 'serpent', mult: 1.35, map: 'overworld', x: 186, y: 120, spr: 'm:hydra', where: 'the far east of Mirefen', reward: [1200, 'elixir', 1] },
  { id: 'white', name: 'Whitemane', foe: 'yeti', mult: 1.3, map: 'overworld', x: 192, y: 8, spr: 'm:yeti', where: 'the highest snows of Frostpeak', reward: [1800, 'elixir', 2] }
];
for (const k of HUNT_MARKS) MAPS[k.map].npcs.push({ id: 'mark_' + k.id, x: k.x, y: k.y, spr: k.spr, dir: 'left', script: 'markFight', show: 'marksAsked&!mark_' + k.id, mark: k.id, emote: '!' });
STORY.markFight = async function (n) {
  const k = HUNT_MARKS.find(q => q.id === n.mark);
  if (!(await confirm(null, `${k.name} — a hunting mark from the Fernhollow lodge. It has seen you. Fight?`))) return;
  const res = await startBattle([{ id: k.foe, elite: { name: k.name, mult: k.mult } }], { bg: MAPS[G.map].bg });
  if (res === 'win') { G.flags['mark_' + k.id] = true; Sound.sfx('coin'); toast(`${k.name} brought down. Report to the huntmaster in Fernhollow.`, UI.hp); }
};
MAPS.fern_lodge.npcs.push({ id: 'huntmaster', x: 18, y: 4, spr: 'hunter', dir: 'down', script: 'huntmaster' });
STORY.huntmaster = async function () {
  const N = 'Huntmaster Rook', s = 'hunter';
  if (!G.flags.marksAsked) {
    G.flags.marksAsked = true; sideStart('The Huntmaster\'s Marks');
    await talk([
      [N, `You've the look of someone who's killed a few things that needed killing. Good. Sit.`, s],
      [N, `Six beasts have got too big and too clever for the rangers. We call them marks. Each one's had a village or a herd or a hunter.`, s],
      [N, `Bring them down and I'll pay you out of the lodge purse. Here's the list.`, s]
    ]);
    for (const k of HUNT_MARKS) await say(null, `${k.name} — ${k.where}.`);
    await say(N, `They'll show on the world map as you find them. Mind yourself with Whitemane. Mind yourself with all of them, but especially Whitemane.`, s);
    return;
  }
  let paid = 0;
  for (const k of HUNT_MARKS) if (G.flags['mark_' + k.id] && !G.flags['markPaid_' + k.id]) {
    G.flags['markPaid_' + k.id] = true; paid++;
    G.gold += k.reward[0]; addItem(k.reward[1], k.reward[2]);
    await say(N, `${k.name}. You're sure? …Aye, that's the tooth. ${k.reward[0]} G, and ${k.reward[2]}× ${ITEMS[k.reward[1]].name}.`, s);
  }
  if (paid) Sound.sfx('coin');
  const left = HUNT_MARKS.filter(k => !G.flags['mark_' + k.id]);
  if (!left.length) { if (!G.flags.marksDone) { G.flags.marksDone = true; await say(N, `All six. The lodge owes you more than coin. Take my old bow — no, take it. I'm too old to be a legend. You're not.`, s); addItem('bow3', 1); sideDone('The Huntmaster\'s Marks'); } else await say(N, `Quiet season. Thanks to you.`, s); return; }
  if (!paid) await say(N, `Still out there: ${left.map(k => k.name).join(', ')}.`, s);
};

SIDE.push(
  { id: 'marks', title: 'The Huntmaster\'s Marks', status: () => !G.flags.marksAsked ? null : G.flags.marksDone ? 'done' : `Hunt the six marks for Huntmaster Rook in Fernhollow. (${HUNT_MARKS.filter(k => G.flags['mark_' + k.id]).length}/6)` },
  { id: 'map', title: 'The Whole of the World', status: () => !G.flags.mapAsked ? null : G.flags.mapDone ? 'done' : `Explore every region of Eldoria for Ottilie. (${Object.keys(owState().regions).length}/${OW.RKEYS.length})` }
);
