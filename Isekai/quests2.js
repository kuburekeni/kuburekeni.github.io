// =====================================================================
//  quests2.js : new stories in the new country
//   GULLHAVEN   The Drowned Light (the Wreckers' Grotto) · Message in a
//               Bottle · Wren's Mother
//   CAIRNSTEAD  Wolves of the Moor · The Lost Flock · The Barrow King
//               (the Hollow Crown) · The Speaking Stone
//   MIREWATCH   The Bog Witch's Bargain · The Drowned God (the Sunken
//               Shrine) · Oswin and the Rot
//   THE CROWN   Redcrag · The Lost Caravan · The Ashcombe Letters
//   THE OLD     The True Accord (Old Aurel) · Where the Elves Went
//               (Silvane, Lyra) · The White Wolf (Rimeheart, Kestrel)
//               · The Hermit of the Pass
//   FRIENDS     Garrick's Brother · Sable's Debt · Varek's Sister
// =====================================================================

// ---------------------------------------------------------------- helpers
const withParty = id => has(id);
async function bossFight(group, opts) { const r = await startBattle(group, Object.assign({ bg: MAPS[G.map].bg }, opts || {})); return r === 'win' || r === 'deal'; }
function reward(gold, items, line) {
  if (gold) G.gold += gold;
  for (const [id, q] of items || []) addItem(id, q);
  Sound.sfx('coin');
  const parts = []; if (gold) parts.push(`${gold} G`); for (const [id, q] of items || []) parts.push(`${q > 1 ? q + '× ' : ''}${ITEMS[id].name}`);
  return say(null, (line || 'Received ') + parts.join(', ') + '.');
}
// people and bosses
const NPC = (map, o) => MAPS[map].npcs.push(o);
NPC('gull_harbour', { id: 'ines', x: 4, y: 4, spr: 'ines', dir: 'down', script: 'ines' });
NPC('gull_light', { id: 'mabry', x: 8, y: 6, spr: 'mabry', dir: 'down', script: 'mabry' });
NPC('gull_keeper', { id: 'pip', x: 4, y: 4, spr: 'pip', dir: 'down', script: 'pip' });
NPC('grotto', { id: 'sorrel', x: 34, y: 5, spr: 'sorrel', dir: 'down', script: 'sorrel', show: '!sorrelDone' });
NPC('grotto', { id: 'wrk1', x: 32, y: 6, spr: 'wrecker', dir: 'right', script: 'sorrel', show: '!sorrelDone' });
NPC('grotto', { id: 'wrk2', x: 36, y: 6, spr: 'wrecker', dir: 'left', script: 'sorrel', show: '!sorrelDone' });
NPC('cairn_long', { id: 'bryony', x: 12, y: 2, spr: 'bryony', dir: 'down', script: 'bryony' });
NPC('cairn_seer', { id: 'morwen', x: 8, y: 4, spr: 'morwen', dir: 'down', script: 'morwen' });
NPC('cairnstead', { id: 'ewanHome', x: 9, y: 13, spr: 'ewan', dir: 'down', script: 'ewan', show: 'sheepDone' });
NPC('barrow', { id: 'hollowking', x: 17, y: 4, spr: 'hollowking', dir: 'down', script: 'hollowKing', show: '!barrowDone' });
NPC('mire_hesk', { id: 'hesk', x: 5, y: 4, spr: 'hesk', dir: 'down', script: 'hesk' });
NPC('shrine', { id: 'hydra', x: 17, y: 3, spr: 'm:hydra', dir: 'down', script: 'hydra', show: '!hydraDone' });
NPC('aurel', { id: 'sentinel', x: 19, y: 4, spr: 'm:sentinel', dir: 'down', script: 'sentinel', show: '!sentinelDone' });
NPC('silvane', { id: 'blight', x: 22, y: 4, spr: 'm:blight', dir: 'down', script: 'blightHeart', show: '!silvaneDone' });
NPC('silvane', { id: 'elfghost', x: 26, y: 19, spr: 'ghostgirl', dir: 'down', script: 'elfGhost', show: 'silvaneDone&in_lyra&!lyraQuestDone' });
NPC('rimeheart', { id: 'rimefang', x: 28, y: 5, spr: 'm:rimefang', dir: 'left', script: 'rimefang', show: '!rimeDone' });
NPC('redcrag', { id: 'kettle', x: 20, y: 11, spr: 'kettle', dir: 'down', script: 'kettle', show: '!kettleDone' });
NPC('redcrag', { id: 'rcGuard1', x: 18, y: 12, spr: 'bandit', dir: 'right', script: 'kettle', show: '!kettleDone' });
NPC('redcrag', { id: 'rcGuard2', x: 22, y: 12, spr: 'bandit', dir: 'left', script: 'kettle', show: '!kettleDone' });
NPC('redcrag', { id: 'rcPrisoner', x: 28, y: 20, spr: 'villager', dir: 'left', script: 'caravanMan', show: 'kettleDone&!caravanFreed' });
NPC('solmere', { id: 'hale', x: 26, y: 37, spr: 'captain', dir: 'up', script: 'hale' });
NPC('solmere', { id: 'lucanSol', x: 38, y: 13, spr: 'lucan', dir: 'left', script: 'lucanSol', show: 'youth&!lettersShown' });
NPC('solmere', { id: 'hollin', x: 7, y: 34, spr: 'hollin', dir: 'right', script: 'hollin', show: 'in_sable&!hollinDone' });
NPC('overworld', { id: 'tobin', x: 70, y: 98, spr: 'merchant', dir: 'down', script: 'tobin', show: '!caravanDone' });
NPC('wastes', { id: 'ilsa', x: 17, y: 14, spr: 'ilsa', dir: 'down', script: 'ilsa', show: 'kharn&!end_purge' });
for (const [i, x, y] of [[1, 14, 26], [2, 38, 14], [3, 46, 36]]) NPC('overworld', { id: 'pack' + i, x, y, spr: 'm:moorwolf', dir: 'left', script: 'wolfPack', show: 'wolvesAsked&!pack' + i, pack: i, emote: '!' });
for (const [i, x, y] of [[1, 12, 36], [2, 47, 22], [3, 20, 12], [4, 44, 43]]) NPC('overworld', { id: 'lostsheep' + i, x, y, spr: 'pet:sheep', dir: 'left', script: 'lostSheep', show: 'sheepAsked&!sheep' + i, sheep: i, wander: 1, emote: '?' });
// Garrick's brother's cairn in the Wastes
{ const r = MAPS.wastes.rows.map(s => s.split('')); r[10][36] = '¢'; MAPS.wastes.rows = r.map(s => s.join('')); }

// ---------------------------------------------------------------- side story tracker
SIDE.push(
  { id: 'light', title: 'The Drowned Light', status: () => !G.flags.lightAsked ? null : G.flags.lightDone ? 'done' : itemCount('lens') ? 'Take the Starglass Lens back to old Mabry at the Gullhaven lighthouse.' : G.flags.lensKnown ? 'The wreckers took the lens. Their cave is under the east cliffs of Gullhaven.' : 'Speak to the lighthouse keeper on the point, south-west of Gullhaven.' },
  { id: 'wrenMum', title: 'Wren\'s Mother', status: () => !G.flags.wrenMumSeen ? null : G.flags.wrenMumDone ? 'done' : 'Wren knows who the harbourmaster of Gullhaven is. Bring her back when she\'s ready.' },
  { id: 'wolves', title: 'Wolves of the Moor', status: () => !G.flags.wolvesAsked ? null : G.flags.wolvesDone ? 'done' : [1, 2, 3].every(i => G.flags['pack' + i]) ? 'Tell Chieftain Bryony the packs are broken.' : `Break the three wolf packs on Highmoor. (${[1, 2, 3].filter(i => G.flags['pack' + i]).length}/3)` },
  { id: 'flock', title: 'The Lost Flock', status: () => !G.flags.sheepAsked ? null : G.flags.sheepDone ? 'done' : [1, 2, 3, 4].every(i => G.flags['sheep' + i]) ? 'Tell Ewan his sheep are home.' : `Find Ewan's four blue-bottomed sheep on the moor. (${[1, 2, 3, 4].filter(i => G.flags['sheep' + i]).length}/4)` },
  { id: 'barrow', title: 'The Barrow King', status: () => !G.flags.barrowAsked ? null : G.flags.crownChosen ? 'done' : G.flags.barrowDone ? 'Decide what to do with the Hollow Crown. Morwen and Bryony both have opinions.' : 'Something walks out of the Hollow Barrow at night. It is west of the moor road, under the hill.' },
  { id: 'bloom', title: 'The Bog Witch\'s Bargain', status: () => !G.flags.bloomAsked ? null : G.flags.blooms ? 'done' : itemCount('bogbloom') >= 3 ? 'Take the bogblooms to Granny Hesk in Mirewatch.' : `Find three bogblooms in the deep fen, east and south of Mirewatch. (${itemCount('bogbloom')}/3)` },
  { id: 'hydra', title: 'The Drowned God', status: () => !G.flags.hydraAsked ? null : G.flags.hydraDone ? 'done' : 'Something wakes in the Sunken Shrine, south-east of Mirewatch down the old trail.' },
  { id: 'redcrag', title: 'Redcrag', status: () => !G.flags.redcragAsked ? null : G.flags.redcragPaid ? 'done' : G.flags.kettleDone ? 'Report to Captain Hale at Solmere\'s south gate.' : 'Clear the bandits out of Redcrag Fort, in the red hills between Valenford and Solmere.' },
  { id: 'caravan', title: 'The Lost Caravan', status: () => !G.flags.caravanAsked ? null : G.flags.caravanDone ? 'done' : G.flags.caravanFreed ? 'Tell Tobin his carter is safe.' : 'Tobin\'s carter was taken by the Redcrag bandits.' },
  { id: 'letters', title: 'The Ashcombe Letters', status: () => !itemCount('letters') && !G.flags.lettersShown ? null : G.flags.lettersShown ? 'done' : 'Letters under the Ashcombe seal. Lucan Ashcombe is in Solmere, by the palace.' },
  { id: 'accord', title: 'The True Accord', status: () => !G.flags.accordAsked ? null : itemCount('accord') ? 'done' : G.flags.v_aurel ? 'Wake the three levers of Old Aurel to open the archive.' : 'Old Fennick says the original Accord sank with Old Aurel, under Lake Mirrow. A causeway runs to the island.' },
  { id: 'silvane', title: 'Where the Elves Went', status: () => !G.flags.silvaneAsked ? null : (G.flags.lyraQuestDone || (G.flags.silvaneDone && !G.flags.lyraSilvane)) ? 'done' : G.flags.silvaneDone ? 'Bring Lyra to the pool at the heart of the grove.' : 'Silvane Grove lies north-west of Fernhollow. The blight is spreading from its heart.' },
  { id: 'rime', title: 'The White Wolf', status: () => !G.flags.rimeAsked ? null : G.flags.rimeDone ? 'done' : 'Rimefang lairs in Rimeheart Hollow, past the Frostpeak pass.' },
  { id: 'hermit', title: 'The Hermit of the Pass', status: () => !G.flags.woodAsked ? null : G.flags.woodDone ? 'done' : `Old Sverra needs dry firewood from around the pass. (${itemCount('firewood')}/4)` },
  { id: 'torvald', title: 'Garrick\'s Brother', status: () => !G.flags.torvaldKnown ? null : G.flags.torvaldDone ? 'done' : 'Bring Garrick to the cairn in the east of the Ashen Wastes.' },
  { id: 'hollin', title: 'Sable\'s Debt', status: () => !G.flags.hollinMet ? null : G.flags.hollinDone ? 'done' : 'Hollin the Hook wants Sable back. He\'s in the Gutter, in Solmere.' },
  { id: 'ilsa', title: 'Varek\'s Sister', status: () => !G.flags.ilsaMet ? null : G.flags.ilsaDone ? 'done' : 'Bring Varek to Ilsa, at the camp in the Ashen Wastes.' }
);

// ================================================================= GULLHAVEN
STORY.ines = async function () {
  const N = 'Harbourmaster Ines', s = 'ines';
  // Wren knows this woman
  if (withParty('wren') && !G.flags.wrenMumDone) return wrenMother();
  if (!G.flags.lightAsked) {
    G.flags.lightAsked = true; sideStart('The Drowned Light');
    await talk([
      [N, `You're not from the coast. You walk like the ground's going to stay still. Sit.`, s],
      [N, `I'm harbourmaster here. Which means for the last month I've been counting boats that don't come home.`, s],
      [N, `The light on the point went dark in spring. Old Mabry says it's the lens — gone, stolen. And since it went dark, there've been lights on the cliffs. Lanterns, swung by somebody who wants ships on the rocks.`, s],
      [N, `Wreckers. We hanged the last of them when I was a girl. Somebody's remembered how it's done.`, s],
      [N, `Talk to Mabry, at the light on the point. If you can get that lamp lit again, Gullhaven will owe you more than I can pay. I'll pay anyway.`, s]
    ]);
    return;
  }
  if (G.flags.lightDone) { await say(N, pick([`The light's burning. I stood on the quay last night and watched it sweep. I didn't realise I'd stopped breathing properly until I started again.`, `Four boats in, none lost, this week. I'd forgotten what it was like.`]), s); return; }
  await say(N, G.flags.lensKnown ? `The east cliffs, then. Under them. The tide comes into those caves faster than you'd believe. Go quick, come back quicker.` : `Mabry's at the light, on the point. South-west of here, past the market.`, s);
};
STORY.mabry = async function () {
  const N = 'Old Mabry', s = 'mabry';
  if (G.flags.lightDone) { await say(N, pick([`Forty-two years I've kept this light. I'd like to keep it forty-two more. My knees disagree.`, `Pip's been up the stairs ten times today to look at it. I don't blame her.`]), s); return; }
  if (itemCount('lens')) {
    removeItem('lens');
    await talk([
      [N, `Is that — oh, let me see it. Let me see it.`, s],
      [null, 'He unwraps the sailcloth with hands that shake, and holds the Starglass up to the window. Light comes through it in a long white bar across the floor.'],
      [N, `Not a scratch. Come up. Come up with me.`, s]
    ]);
    await fadeOut(0.6);
    await say(null, 'You climb the spiral stair together, a hundred and twelve steps. At the top Mabry fits the lens into its iron cradle, and lights the lamp.');
    Sound.sfx('magic');
    await say(null, 'The beam swings out over the sea. Far off, a fishing boat that has been waiting all night outside the reef turns, very slowly, towards home.');
    await fadeIn(0.6);
    G.flags.lightDone = true;
    G.rep = (G.rep || 0) + 2; moraleAll(5);
    await say(N, `There. There she is. You've no idea. Or — you have, maybe. You've the look of someone who's been a long way from home.`, s);
    await reward(600, [['seaglass', 1], ['hipotion', 3]], 'From the harbour purse, and from Mabry: ');
    sideDone('The Drowned Light');
    return;
  }
  if (!G.flags.lensKnown) {
    G.flags.lensKnown = true; G.flags.lightAsked = true;
    await talk([
      [N, `Ines sent you? Good woman. Hard. Like her father.`, s],
      [N, `The Starglass Lens. Ground by the dwarves of Ironhold, two hundred years ago. Without it the flame's just a candle in a big room.`, s],
      [N, `Somebody came up those stairs in the night, in spring, and unbolted it and carried it away. A woman's voice, giving orders. I heard her. I was hiding under the bed, I'm ashamed to say.`, s],
      [N, `There's caves under the east cliffs. The old wreckers used them. If the lens is anywhere, it's down there with the people who want my light dark.`, s]
    ]);
    return;
  }
  await say(N, `The east cliffs. The cave mouth's past the end of the market, behind the sign. Mind the tide.`, s);
};
STORY.sorrel = async function () {
  const N = 'Sorrel', s = 'sorrel';
  await talk([
    [N, `Well. The Crown's sent a child. In nice boots.`, s],
    [N, `You'll want the lens. Of course you will. Everyone wants that light lit again. Do you know what the light did for my husband?`, s],
    [N, `He was on the Crown's supply ship, the winter of the long war. They ran the blockade with the lamp burning so the Ashborn could see them coming. Bait. The Crown used the light as bait, and the light did what it was told.`, s],
    [N, `Every ship that goes down on those rocks is a ship the Crown can't use. That's my war. You've got yours. Let's see whose is better.`, s]
  ]);
  const ok = await bossFight(['wrecker', 'sorrel', 'wrecker']);
  if (!ok) return;
  G.flags.sorrelDone = true;
  addItem('lens');
  await say(null, 'Sorrel is on her knees, her axe across the cave floor. Behind her, wrapped in sailcloth and lashed to a crate: the Starglass Lens.');
  const c = await ask(N, `Go on, then. Hang me. Ines will want to watch.`, ['Hand her to the harbour watch.', 'Let her go — leave Gullhaven and never come back.'], s, false);
  if (c === 0) { await say(N, `…Fair. It's what I'd do.`, s); G.flags.sorrelJailed = true; }
  else {
    await say(N, `…Why?`, s);
    await say(hero(), `Because you're right about the Crown. And because the next boat on the rocks would have been somebody's husband too.`, 'hero');
    await say(N, `Hm. Maybe you're worth those boots after all.`, s);
    G.flags.sorrelFreed = true; if (withParty('sable')) addMorale('sable', 5); if (withParty('oswin')) addMorale('oswin', 5);
  }
  await say(null, 'Received the Starglass Lens.');
};
STORY.pip = async function () {
  const N = 'Pip', s = 'pip';
  if (!G.flags.pipBottle && (G.flags.lensKnown || G.flags.lightDone)) {
    G.flags.pipBottle = true;
    await talk([
      [N, `You're the one helping Grandad! Want to see my treasure? You can't keep it. Well. Maybe you can keep it.`, s],
      [null, 'She holds out a green glass bottle, salt-crusted. Inside it, a sliver of glass glints as if lit from inside.'],
      [N, `It washed up on the beach the morning after the light went out. When I look in it I see a street with tall glowing towers. I think it's a fairy city. Is it a fairy city?`, s],
      [hero(), `…It's Tokyo.`, 'hero'],
      [N, `Tow-kee-oh. That's a good fairy name. You have it. It looks at you funny. Like it knows you.`, s]
    ]);
    await gainShard();
    return;
  }
  await say(N, pick([G.flags.lightDone ? `The light's ON! I can see it from my bed! I'm never sleeping again!` : `Grandad hasn't slept proper since the light went out. He sits up all night with the candle.`, `When I'm big I'm going to keep the light. Grandad says you have to like stairs. I LOVE stairs.`]), s);
};
async function wrenMother() {
  const N = 'Harbourmaster Ines', s = 'ines', R = 'Wren', w = 'c:wren';
  G.flags.wrenMumSeen = true;
  if (!G.flags.wrenMumSaw) {
    G.flags.wrenMumSaw = true;
    await talk([
      [null, 'Wren has gone very still in the doorway. The harbourmaster looks up from her ledger, and her pen stops.'],
      [N, `…Wren?`, s],
      [R, `You know my name. That's something, I suppose.`, w],
      [N, `I — you were four. Your father had just gone down with the Gannet and I couldn't — I couldn't look at the sea and I couldn't look at you, because you had his face. Old Pike said he'd keep you till I was well.`, s],
      [N, `I meant to come back. Every year I meant to come back. And every year it got harder to walk up that road and be the woman who left.`, s],
      [R, `…I want to go. I think I want to go. Can we go?`, w]
    ]);
    const c = await ask(null, 'Wren is looking at you, not at her mother.', ['"Stay. Talk to her. I\'ll wait outside."', '"We\'ll go. Come back when you\'re ready."'], null, false);
    if (c === 0) {
      await talk([
        [null, 'You step outside. The gulls are loud and the sun is very bright on the water. It is a long time before the door opens again.'],
        [R, `She kept every letter Pike ever wrote her about me. Every one. In a box. She's read them so many times they've gone soft.`, w],
        [R, `I don't forgive her. Not yet. But I think I'd like to, one day. …Thank you for waiting.`, w]
      ]);
      await finishWrenMother();
    } else {
      await say(R, `Thanks. I'm — yeah. Another time.`, w);
      addMorale('wren', 3);
    }
    return;
  }
  await talk([[null, 'Wren takes a breath, and walks in first this time.'], [N, `You came back.`, s], [R, `I'm better at that than you are.`, w], [N, `…Yes. You are.`, s]]);
  await finishWrenMother();
}
async function finishWrenMother() {
  G.flags.wrenMumDone = true;
  await talk([
    ['Harbourmaster Ines', `Take this. Your father's sword. I carried it on every ship I've sailed since. I think it'd rather be with you.`, 'ines'],
    ['Wren', `…Seawall. He named his sword Seawall. Of course he did.`, 'c:wren']
  ]);
  addItem('seawall'); addMorale('wren', 15);
  await say(null, 'Received Seawall (Wren can equip it).');
  sideDone('Wren\'s Mother');
}

// ================================================================= CAIRNSTEAD
STORY.bryony = async function () {
  const N = 'Chieftain Bryony', s = 'bryony';
  if (!G.flags.wolvesAsked) {
    G.flags.wolvesAsked = true; sideStart('Wolves of the Moor');
    await talk([
      [N, `A Valen. Down from the lowlands to look at the savages on the moor? Sit, then. The savages have mead.`, s],
      [N, `I'll be plain, because I'm always plain. Three wolf packs have come down off the high moor since the winter. They're taking ewes, dogs, and last week a boy's leg.`, s],
      [N, `My people can hunt, but we can't hunt three packs and mind the flocks besides. You have a sword and nothing to mind. Break the packs. I'll make it worth the walking.`, s]
    ]);
    return;
  }
  if (!G.flags.wolvesDone && [1, 2, 3].every(i => G.flags['pack' + i])) {
    G.flags.wolvesDone = true;
    await say(N, `All three? …Calum said you'd be dead by Tuesday. I'll enjoy telling him.`, s);
    await reward(700, [['moorcloak', 1], ['tonic', 2]], 'Bryony pays you: ');
    sideDone('Wolves of the Moor');
  }
  if (G.flags.wolvesDone && !G.flags.barrowAsked) {
    G.flags.barrowAsked = true; sideStart('The Barrow King');
    await talk([
      [N, `There's another thing. Worse than wolves. I didn't want to ask a stranger, so I asked the wolves first.`, s],
      [N, `West of the moor road there's a barrow — a hill with a door in it. A king's buried there. Was buried. Three hundred years he's slept, and in spring he stopped.`, s],
      [N, `Dead things walk out of that hill at night. They don't attack. They just walk, east, towards the Rift, as if somebody called them. Last week one of them was my grandfather.`, s],
      [N, `Go into the barrow. Put him back to sleep. Morwen says it's the crown he was buried in. Morwen says a lot of things, but she's usually right.`, s]
    ]);
    return;
  }
  if (G.flags.barrowDone && !G.flags.crownChosen) { await crownChoice(); return; }
  if (G.flags.barrowAsked && !G.flags.barrowDone) { await say(N, `The barrow's west of the moor road, under the long hill. Take a light. Take two.`, s); return; }
  await say(N, pick([`The moor's quiet. I almost don't trust it.`, `If you ever tire of the lowlands, there's a seat by this fire. I mean it.`, G.flags.crownKept ? `You kept it. The crown. I can see it in how you stand. Be careful, Valen.` : `The dead are sleeping again. My grandfather's back under his stone. Thank you.`]), s);
};
STORY.wolfPack = async function (n) {
  const ok = await confirm(null, 'A wolf pack, gaunt and grey, watching you from the heather. The leader is twice the size of the others. Fight?');
  if (!ok) return;
  const win = await bossFight([{ id: 'moorwolf', elite: { name: 'Pack Leader', mult: 0.8 } }, 'moorwolf', 'moorwolf'], { bg: 'moor' });
  if (win) { G.flags['pack' + n.pack] = true; toast(`Wolf pack broken (${[1, 2, 3].filter(i => G.flags['pack' + i]).length}/3)`, UI.hp); }
};
STORY.ewan = async function () {
  const N = 'Ewan', s = 'ewan';
  if (G.flags.sheepDone) { await say(N, pick([`They're all home. Bluebell keeps trying to leave again. She's got a wandering soul, Mum says.`, `Thank you. Really. I'd have been in SO much trouble.`]), s); return; }
  if (!G.flags.sheepAsked) {
    G.flags.sheepAsked = true; sideStart('The Lost Flock');
    await talk([
      [N, `Please don't laugh. I've lost four sheep. AGAIN. They've got blue paint on their bottoms so you'll know they're mine.`, s],
      [N, `They wander off across the moor every time the wind changes. If you find them, just talk to them nicely and they'll walk home. They like being talked to. Bluebell likes compliments.`, s]
    ]);
    return;
  }
  if ([1, 2, 3, 4].every(i => G.flags['sheep' + i])) {
    G.flags.sheepDone = true;
    await say(N, `ALL OF THEM? Even Bluebell? Here — it's not much. It's all my birthday money. Please take it, or I'll feel bad.`, s);
    await reward(150, [['tonic', 1]]);
    moraleAll(2);
    sideDone('The Lost Flock');
    return;
  }
  await say(N, `${[1, 2, 3, 4].filter(i => G.flags['sheep' + i]).length} home so far. The others are out on the moor somewhere. Blue bottoms!`, s);
};
STORY.lostSheep = async function (n) {
  const lines = [`The sheep regards you with deep suspicion. You tell it it has a lovely fleece. It considers this, and sets off home.`, `"Bluebell?" The sheep looks round. Of course it's Bluebell. You tell her she is the finest sheep on Highmoor. She trots off, pleased with herself.`, `This sheep is standing on a rock for no reason. You talk it down. It goes home in a huff.`, `A sheep with a blue bottom, eating a thistle with tremendous concentration. You compliment its choice of thistle. It heads for Cairnstead.`];
  await say(null, lines[(n.sheep - 1) % lines.length]);
  G.flags['sheep' + n.sheep] = true;
  toast(`Sheep sent home (${[1, 2, 3, 4].filter(i => G.flags['sheep' + i]).length}/4)`, UI.hp);
};
STORY.hollowKing = async function () {
  const N = 'The Hollow King', s = 'hollowking';
  await talk([
    [null, 'On a throne of black stone sits a king made of bones and silver. A crown of black iron rests on his skull. His eye-sockets light green when you come near.'],
    [N, `Another. Another one comes, called by the tear in the world.`, s],
    [N, `I was Aedan. I was king of the moor. I wore this crown, and the crown wore me, and I ruled well for a while and then I ruled long.`, s],
    [N, `The crown wants a head. Any head. It hears the Rift calling every king who ever was, and it wants to answer. Take it off me. I cannot. I have tried for three hundred years.`, s]
  ]);
  const ok = await bossFight(['barrowbones', 'hollowking', 'barrowbones'], { bg: 'castle' });
  if (!ok) return;
  G.flags.barrowDone = true;
  addItem('crown'); addItem('hollowgarb');
  await say(null, 'The bones fold quietly onto the throne. The crown rolls to your feet, ringing like a bell. When you pick it up, you hear — very faintly — people kneeling.');
  await say('Aedan', `…Thank you. Do not wear it. Or do. It will be honest with you about what it wants. That is more than most crowns.`, 'hollowking');
  await say(null, 'Received the Hollow Crown and the Hollow Regalia.');
};
async function crownChoice() {
  const N = 'Chieftain Bryony', s = 'bryony';
  await talk([
    [N, `Grandfather's back in the ground. The walking's stopped. And you've got that thing in your pack. I can hear it from here.`, s],
    [N, `Morwen says break it on the Speaking Stone. I say bury it under the longhouse and put a cow on it. What do you say?`, s]
  ]);
  const c = await ask(null, 'The Hollow Crown is cold in your hands.', ['Break it on the Speaking Stone.', 'Bury it under the longhouse.', 'Keep it.'], null, false);
  G.flags.crownChosen = true;
  if (c === 0) {
    await fadeOut(0.5); await say(null, 'At the stone circle Morwen sings something very old, and you bring the crown down on the Speaking Stone. It breaks like ice. The sound goes on and on, across the whole moor.'); await fadeIn(0.5);
    removeItem('crown'); G.flags.crownBroken = true; moraleAll(6); G.rep = (G.rep || 0) + 1;
    await say(N, `There. Whatever kings it was calling can call someone else.`, s);
    await reward(500, [['elixir', 1]]);
  } else if (c === 1) {
    removeItem('crown'); G.flags.crownBuried = true;
    await say(N, `Good. Practical. I'll get the cow.`, s);
    await reward(500, [['mega', 2]]);
  } else {
    G.flags.crownKept = true;
    await say(N, `…Keep it, then. I won't fight you for it. But I'll be watching which way you walk, Valen.`, s);
    for (const m of companionsInParty()) addMorale(m.cls, m.cls === 'varek' ? 3 : -6);
    await say(null, 'The crown settles into your pack like it has been waiting to be carried. Some nights, in the dark, you hear it whispering about thrones.');
  }
  sideDone('The Barrow King');
}
STORY.morwen = async function () {
  const N = 'Morwen', s = 'morwen';
  if (!G.flags.morwenMet) {
    G.flags.morwenMet = true;
    await talk([
      [N, `Sit. No — there. The other chair bites.`, s],
      [N, `I see what's on people. Some have grief on them. Some have luck. You have… a road. A grey road, in a city of glass, and a girl standing at the end of it.`, s],
      [N, `You're not from here. Not the way the rest of us are. You were brought. You're the twelfth, aren't you? I can count the threads.`, s],
      [hero(), `How do you know about that?`, 'hero'],
      [N, `The stones told me. The stones were here when the first one came, Hiroshi, and the stones remember everything. They remember the goddess crying.`, s],
      [N, `Here. This came out of the Speaking Stone the night you were born into this world. I've been keeping it. I think it's yours.`, s]
    ]);
    await gainShard();
    return;
  }
  if (G.flags.barrowDone && !G.flags.crownChosen) { await say(N, `Bring it to the stone. Break it. Please. I've seen what it wants, and it wants you.`, s); return; }
  await say(N, pick([
    `The stone in the circle speaks if you put your hand on it. Not words. Not quite.`,
    G.flags.shardsAll ? `All twenty. You're carrying a whole person now. Two people. That's heavy. Sit down sometimes.` : `There are more glass pieces of you scattered about. The Rift shook them loose when it opened. Find them, if you want to remember.`,
    `There are three ways the war can end, they say. There's a fourth, if you find the truth. There's a fifth, if you find the way home.`]), s);
};
// the Speaking Stone, in the circle
{
  const it0 = WorldScene.prototype.interact;
  WorldScene.prototype.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy, t = this.tile(x, y);
    if (t === '¢' && G.map === 'cairnstead') { this.run(speakingStone); return; }
    if (t === '¢' && G.map === 'wastes') { this.run(torvaldCairn); return; }
    if (t === '÷' && G.map === 'aurel') { this.run(() => aurelLever(x, y)); return; }
    if (t === '/' && G.map === 'redcrag' && x === 29 && y === 21) { this.run(caravanCart); return; }
    return it0.call(this);
  };
}
async function speakingStone() {
  const visions = [
    [`You lay your hand on the stone. It is warm. You see a young man in a black lacquered breastplate, kneeling in the rain three hundred years ago. He is crying. A woman made of light is crying with him.`],
    [`You see eleven people, one after another, stepping out of the light onto this same moor. A sailor. A soldier. A girl in a nurse's uniform. A boy younger than you. All of them look up at the sky as if someone had just turned it on.`],
    [`You see the Rift opening — not as a wound, but as a door, held from both sides. On one side, a queen of the Ashborn. On the other, a king in gold. Between them, the Accord, unsigned.`],
    [`You see a crossing, and a truck, and the goddess's hand reaching for it too late. Or not too late. You can't tell. You don't want to tell.`]
  ];
  const i = (G.flags.stoneN || 0) % visions.length; G.flags.stoneN = i + 1;
  Sound.sfx('magic');
  for (const l of visions[i]) await say(null, l);
  if (i === 3 && !G.flags.stoneAll) { G.flags.stoneAll = true; moraleAll(2); }
}

// ================================================================= MIREWATCH
STORY.hesk = async function () {
  const N = 'Granny Hesk', s = 'hesk';
  if (!G.flags.bloomAsked) {
    G.flags.bloomAsked = true; sideStart('The Bog Witch\'s Bargain');
    await talk([
      [N, `Come in, come in, mind the cauldron, it's in a mood. Witch? Yes. Wicked? Only on Thursdays.`, s],
      [N, `The rot's in Mirewatch. Grey patches on the skin, and then it goes inside. Half the village has it. I can brew a cure, but I need bogbloom, and the bogbloom grows where the fen's deepest.`, s],
      [N, `Three of them. Big white flowers, east and south of here, where the water's black. Bring me three and I'll brew enough for everyone. I'll even teach you a thing or two.`, s]
    ]);
    if (withParty('oswin')) await talk([['Oswin', `Mother Hesk — I've treated the rot in Brookvale. The Dawn's prayers help the pain. Let me sit with the sick while we're gone.`, 'c:oswin'], [N, `A priest who asks a witch for permission. Wonders never cease. Yes, Brother. Sit with them.`, s]]);
    return;
  }
  if (!G.flags.blooms && itemCount('bogbloom') >= 3) {
    removeItem('bogbloom', 3); G.flags.blooms = true;
    await fadeOut(0.5); await say(null, 'Granny Hesk boils the bogblooms all night. The smell is extraordinary. By dawn the whole village is queuing at her door with cups.'); await fadeIn(0.5);
    await say(N, `There. They'll be grey for a week and then they'll be pink and complaining. That's how you know it's worked.`, s);
    await reward(500, [['elixir', 2]], 'Hesk gives you: ');
    if (withParty('oswin')) { addMorale('oswin', 8); await say('Oswin', `Faith and herbs. I've always said they were cousins.`, 'c:oswin'); }
    sideDone('The Bog Witch\'s Bargain');
  }
  if (G.flags.blooms && !G.flags.hydraAsked) {
    G.flags.hydraAsked = true; sideStart('The Drowned God');
    await talk([
      [N, `The rot came from somewhere, though. I know where. I've always known where.`, s],
      [N, `South-east, down the old trail, there's a shrine under the water. Fen-folk built it before the kings. We put something to sleep in it, long ago. A thing with many heads that drank the bad out of the water.`, s],
      [N, `It's not drinking the bad out any more. It's spitting it back. Something woke it angry, round the time the Rift tore. Put it down. Gently, if you can. Not gently, if you can't.`, s]
    ]);
    return;
  }
  if (G.flags.hydraDone && !G.flags.hydraPaid) {
    G.flags.hydraPaid = true;
    await say(N, `The water's clearing. The frogs are singing again — dreadful racket, I love it.`, s);
    if (withParty('oswin') && !G.flags.lanternGiven) {
      G.flags.lanternGiven = true;
      await talk([[N, `Brother. Your mace. Give it here.`, s], [null, 'She sets a little lamp into the head of Oswin\'s mace, lights it with green fen-fire from her cauldron, and hands it back.'], ['Oswin', `…It's warm. It's — Mother Hesk, it's praying.`, 'c:oswin'], [N, `It's humming. Close enough.`, s]]);
      addItem('lantern'); addMorale('oswin', 15); await say(null, 'Received the Dawn Lantern (Oswin can equip it).');
    }
    await reward(800, [['fenrobe', 1]]);
    sideDone('The Drowned God');
    return;
  }
  // Hesk sells her brews once the rot is cured
  if (G.flags.blooms) { const c = await ask(N, pick([`What'll it be, dearie?`, `Back again. Want something bubbling?`]), ['Buy from Hesk', 'Just visiting'], s); if (c === 0) await shopScene('hesk', 'Granny Hesk', 'hesk'); return; }
  await say(N, `Three bogblooms. The deep fen, east and south. Black water. Mind your feet.`, s);
};
SHOPS.hesk = ['elixir', 'mega', 'hiether', 'antidote', 'tonic', 'fenrobe'];
STORY.hydra = async function () {
  await say(null, 'The water at the heart of the shrine heaves. Three heads rise out of it, then a fourth, swaying, their eyes full of old green light. The smell is the smell of the rot.');
  const ok = await bossFight(['hydra'], { bg: 'ruins', music: 'boss' });
  if (!ok) return;
  G.flags.hydraDone = true;
  await say(null, 'The heads sink back one by one, and the water goes still, then clear. Somewhere a frog clears its throat, experimentally.');
};

// ================================================================= THE CROWNLANDS
STORY.hale = async function () {
  const N = 'Captain Hale', s = 'captain';
  if (!G.flags.redcragAsked) {
    G.flags.redcragAsked = true; sideStart('Redcrag');
    await talk([
      [N, `Valen. I've heard of you. Everyone has, it seems. Good — I need someone the bandits have heard of.`, s],
      [N, `Redcrag Fort. An old border fort in the red hills between here and your father's lands. A woman calls herself Mother Kettle has filled it with cutthroats, and they're bleeding every road in the Crownlands.`, s],
      [N, `I'd send the watch, but the watch is guarding the walls against an army that may or may not be coming. Clear the fort and the Crown pays a thousand.`, s]
    ]);
    return;
  }
  if (G.flags.kettleDone && !G.flags.redcragPaid) {
    G.flags.redcragPaid = true;
    await say(N, `Kettle's done? …You don't do things by halves, do you. The roads will be safe by the harvest. That's thanks to you.`, s);
    await reward(1000, [['steel', 1]], 'From the Crown: ');
    sideDone('Redcrag');
    if (itemCount('letters')) await say(N, `What's that, letters? Ashcombe's seal. …I didn't see that. Take it to someone who's allowed to see it. Lord Ashcombe's son is in the city, if you're brave.`, s);
    return;
  }
  await say(N, G.flags.kettleDone ? `Safe roads. I'd forgotten what that was like.` : `Redcrag's in the red hills, north-west of the city. Mind the archers on the walls.`, s);
};
STORY.kettle = async function () {
  const N = 'Mother Kettle', s = 'kettle';
  await talk([
    [N, `Look at you. Like a lamb walking into the kitchen.`, s],
    [N, `You know who feeds my boys? Not the roads. Not the farmers. Somebody with a big house and a seal ring pays me to burn things, and I burn them.`, s],
    [N, `Ashborn camps, human villages — makes no difference. The more they hate each other, the more he pays. Lovely little war. I'd hate for it to end.`, s]
  ]);
  const ok = await bossFight(['redcrag', 'kettle', 'archer'], { bg: 'road' });
  if (!ok) return;
  G.flags.kettleDone = true; addItem('letters');
  await say(null, 'In Kettle\'s strongbox, under the silver: a bundle of letters, each sealed in blue wax with a falcon. The Ashcombe falcon.');
  await say(null, 'They are payment orders. Raid this Ashborn camp. Burn that human village, and leave Ashborn spears in the ashes. Keep the war hot. Every one is signed: A.');
  await say(null, 'Received the Ashcombe Letters.');
  if (G.flags.lucanFriend) await say(null, 'Ashcombe. Lucan\'s father.');
};
STORY.tobin = async function () {
  const N = 'Tobin', s = 'merchant';
  if (!G.flags.caravanAsked) {
    G.flags.caravanAsked = true; sideStart('The Lost Caravan');
    await say(N, `Bandits took my cart AND my carter, outside Redcrag. The cart I can replace. Jory's my wife's brother. I'd rather not replace Jory. Well — she'd rather I didn't.`, s);
    return;
  }
  if (G.flags.caravanFreed) { G.flags.caravanDone = true; await say(N, `Jory's home? With the cart? My wife's going to kiss you. Run, if you like. Here — take this, and the cart's thanks.`, s); await reward(400, [['hipotion', 4]]); sideDone('The Lost Caravan'); return; }
  await say(N, `The fort's in the red hills, west of here. If you see a man complaining loudly about the food, that's Jory.`, s);
};
STORY.caravanMan = async function () {
  G.flags.caravanFreed = true;
  await say('Jory', `Are they gone? Are they ALL gone? Thank the Dawn. The food was dreadful. I'm taking the cart. I'm taking the cart and I'm never coming west of Solmere again.`, 'villager');
  World.refreshNpcs();
};
async function caravanCart() { await say(null, G.flags.caravanFreed ? 'Tobin\'s cart, being lovingly re-packed by Jory.' : 'A merchant\'s cart, half-looted. The name TOBIN & SONS is painted on the side.'); }
STORY.lucanSol = async function () {
  const N = 'Lucan Ashcombe', s = 'lucan';
  if (!itemCount('letters')) { await say(N, pick([`Valen! The court is unbearable. My father hosts a dinner every night for men who want the war to go on forever. I sit at the end and count the forks.`, `If you need anything in the capital — a door opened, a name — ask. I owe you a vault.`]), s); return; }
  await talk([
    [N, `What's that — that's our seal. Where did you —`, s],
    [null, 'He reads the first letter. Then the second. By the fourth his hands are shaking.'],
    [N, `This is his hand. This is my father's hand. "Burn the village, leave their spears." Valen, the raid on Aldmere, two years ago — the one that started the levy — that was —`, s],
    [N, `He told me the Ashborn did it. He sat across the table from me and told me.`, s]
  ]);
  const c = await ask(N, `What do I do?`, ['"Testify. Tell the King what your father did."', '"Keep the letters secret. For now."'], s, false);
  G.flags.lettersShown = true;
  if (c === 0) {
    await talk([[N, `…Yes. I'll swear to every word, in front of the King and the whole court. And when you stand in front of Malgrath, you'll have this to show him too. The war was a lie. Part of it, anyway.`, s], [null, 'Lucan writes out a sworn statement under his own seal and gives it to you with the letters.']]);
    G.flags.lucanTestifies = true; G.rep = (G.rep || 0) + 2;
  } else { await say(N, `…All right. But keep them safe. Somebody should know.`, s); }
  sideDone('The Ashcombe Letters');
  if (itemCount('accord')) await say(null, 'With the True Accord and the Ashcombe Letters, you have the whole truth of the war. If Malgrath will listen to anything, he might listen to this.');
};

// ================================================================= OLD AUREL
{
  const ml0 = STORY.crowd;
  STORY.crowd = async function (n) {
    if (n.id === 'manorLib' && G.age === 'youth' && !G.flags.accordAsked && stage() >= 1) {
      G.flags.accordAsked = true; sideStart('The True Accord');
      await talk([
        ['Old Fennick', `Ah. The heir. Look at this — the Accord of Dawn, first printing. The Ashborn names, scratched out with a knife.`, 'butler'],
        ['Old Fennick', `This is a copy. The original was kept in the Archive of Old Aurel, the city under Lake Mirrow. It sank the year the Accord was signed. Convenient, wouldn't you say?`, 'butler'],
        ['Old Fennick', `The fishermen say the causeway to the island still stands. If anyone has read the true Accord in three hundred years, it's the fish.`, 'butler']
      ]);
      return;
    }
    return ml0.call(this, n);
  };
}
async function aurelLever(x, y) {
  const which = x < 10 ? 'w' : x > 30 ? 'e' : 's';
  if (G.flags['lever_' + which]) return;
  await say(null, 'A lever of black iron, green with age. It moves stiffly, then all at once.');
  G.flags['lever_' + which] = true; Sound.sfx('door');
  const n = ['w', 'e', 's'].filter(k => G.flags['lever_' + k]).length;
  await say(null, n < 3 ? `Somewhere deep in the ruin, a socket lights violet. (${n}/3)` : 'The third socket lights. Far off, a great door groans, and the sound of it goes on and on through the drowned halls.');
}
STORY.sentinel = async function () {
  await say(null, 'At the end of the archive, a figure of gold and stone stands before a sealed case. Words of light crawl over it in a script you have only seen on Hiroshi\'s sword.');
  await say('The Archive Sentinel', `THE ACCORD IS KEPT. THE ACCORD IS NOT TO BE READ BY THOSE WHO WOULD BURY IT AGAIN.`);
  const ok = await bossFight(['sentinel'], { bg: 'ruins', music: 'boss' });
  if (!ok) return;
  G.flags.sentinelDone = true;
  addItem('accord');
  await talk([
    [null, 'Inside the case: a long parchment sealed in wax, three hundred years old. You break the seal.'],
    [null, 'Two columns of names. Human kings, Ashborn queens. And at the bottom, a clause in both scripts:'],
    [null, '"The Rift is a door, and the door belongs to both. Neither people shall hold the far side alone. Should either break this, the other is released from every promise."'],
    [null, 'The Crown broke it first. The Ashborn were never meant to be in the Wastes at all.'],
    [null, 'Received the True Accord.']
  ]);
  sideDone('The True Accord');
};

// ================================================================= SILVANE GROVE
{
  // Lyra asks to go home, once she trusts you
  const ct0 = companionTalk;
  companionTalk = async function (f) {
    const id = f.m.cls;
    if (id === 'lyra' && !G.flags.silvaneAsked && moraleOf('lyra') >= 55 && G.age === 'youth') {
      G.flags.silvaneAsked = true; G.flags.lyraSilvane = true; sideStart('Where the Elves Went');
      await talk([
        ['Lyra', `Can I ask you something? It's — selfish.`, 'c:lyra'],
        ['Lyra', `North-west of Fernhollow there's a grove. Silvane. My people lived there before they left. I was a baby. My mother stayed behind when the rest went west. Nobody ever told me why.`, 'c:lyra'],
        ['Lyra', `The pilgrims say the grove's going grey. If something's killing it, I want to know what. And I want to see where she was.`, 'c:lyra']
      ]);
      return;
    }
    return ct0(f);
  };
}
{
  const en0 = onEnterMap;
  onEnterMap = async function (id) {
    await en0(id);
    if (id === 'silvane' && !G.flags.silvaneAsked) { G.flags.silvaneAsked = true; sideStart('Where the Elves Went'); }
    if (id === 'silvane' && G.flags.v_silvane && !G.flags.silvaneIntro) {
      G.flags.silvaneIntro = true;
      await say(null, 'Silvane. The trees here are older than anything you have seen, and pale petals fall out of a clear sky. At the edges of everything the bark has gone grey, like ash, and it is spreading from the north.');
      if (withParty('lyra')) await say('Lyra', `It's… I know this. I don't remember it, but my feet do.`, 'c:lyra');
    }
    if (id === 'rimeheart' && !G.flags.rimeAsked) { G.flags.rimeAsked = true; sideStart('The White Wolf'); }
    if (id === 'aurel' && !G.flags.accordAsked) { G.flags.accordAsked = true; sideStart('The True Accord'); }
    if (id === 'grotto' && !G.flags.lightAsked) { G.flags.lightAsked = true; G.flags.lensKnown = true; }
  };
}
STORY.blightHeart = async function () {
  await say(null, 'At the head of the grove, a great tree has gone the colour of a bruise. Its roots have pulled out of the ground and are moving, slowly, like fingers looking for something.');
  if (withParty('lyra')) await say('Lyra', `That's the First Tree. That's — something's inside it. Something from the Rift.`, 'c:lyra');
  const ok = await bossFight(['sprite', 'blightheart', 'sprite'], { bg: 'grove' });
  if (!ok) return;
  G.flags.silvaneDone = true;
  await say(null, 'The purple drains out of the bark like water out of sand. The grey at the edges of the grove stops, and stays stopped.');
  if (!withParty('lyra')) { addItem('astaff', 1); await say(null, 'In the roots, you find an elven staff of white wood. (Received an Archmage Staff.)'); sideDone('Where the Elves Went'); }
  else await say('Lyra', `There's someone at the pool. Do you see her?`, 'c:lyra');
};
STORY.elfGhost = async function () {
  const N = 'Elf of Silvane', s = 'ghostgirl';
  await talk([
    [null, 'A woman of pale light stands at the edge of the pool. Her face is Lyra\'s face, older.'],
    [N, `Little leaf. You came home.`, s],
    ['Lyra', `…Mother?`, 'c:lyra'],
    [N, `When the Rift tore the first time, the First Tree took the wound. Someone had to stay and sing to it so the blight would sleep. I sang for twenty years. Then I was a song. Then I was this.`, s],
    [N, `You and your friend woke it and put it down for good. I don't need to sing any more. I can rest.`, s],
    [N, `Take this. A branch from the Tree. It will remember me when you cast. Go and be loud in the world, Lyra. I was quiet for both of us.`, s]
  ]);
  G.flags.lyraQuestDone = true;
  addItem('bough'); addMorale('lyra', 20);
  await say(null, 'The light fades into the water. Lyra stands there a long time. When she turns round, she is smiling, and crying, and she does not try to stop either.');
  await say(null, 'Received the Silvane Bough (Lyra can equip it).');
  sideDone('Where the Elves Went');
};

// ================================================================= FROSTPEAK
STORY.sverra = async function () {
  const N = 'Old Sverra', s = 'sverra';
  if (!G.flags.woodAsked) {
    G.flags.woodAsked = true; sideStart('The Hermit of the Pass');
    await talk([
      [N, `Ha! Visitors. You've walked a long way to see an old woman freeze.`, s],
      [N, `I've lived on this pass sixty winters. I watch the snow. Somebody should. This winter came early and it came angry — there's a wolf in the hollow up there the size of a cart, and it's calling the cold down.`, s],
      [N, `I'm out of dry wood, and I can't go far with my hip. Four bundles. There's dry pine under the overhangs all round the pass. Bring them and I'll tell you how to kill that wolf.`, s]
    ]);
    if (!G.flags.rimeAsked) { G.flags.rimeAsked = true; sideStart('The White Wolf'); }
    return;
  }
  if (!G.flags.woodDone && itemCount('firewood') >= 4) {
    removeItem('firewood', 4); G.flags.woodDone = true;
    await say(N, `Lovely. Lovely dry pine. Sit by the fire. Now listen: Rimefang hates fire like you hate debt. Burn it, and keep burning it. And don't let it howl twice — the second howl brings the cold right into your bones.`, s);
    await reward(300, [['elixir', 1], ['bomb', 4]]);
    sideDone('The Hermit of the Pass');
    return;
  }
  await say(N, G.flags.woodDone ? pick([`Fire's lovely. Thanks to you.`, G.flags.rimeDone ? `The cold's broken. First sun on the pass in a month.` : `The hollow's north-east. The wolf's at the far end. Fire!`]) : `Four bundles of dry pine. Under the overhangs. All round the pass.`, s);
};
STORY.rimefang = async function () {
  await say(null, 'At the back of the hollow, curled on a bed of blue ice, a wolf the size of a cart lifts its head. Its breath freezes into knives in the air.');
  if (withParty('kestrel')) await talk([['Kestrel', `That's it. That's the one. White mane, torn ear. My father put the tear in that ear the day it killed him.`, 'c:kestrel'], ['Kestrel', `I've been carrying an arrow for this for eleven years. Let me take the first shot.`, 'c:kestrel']]);
  const ok = await bossFight(['rimefang'], { bg: 'ice', music: 'boss' });
  if (!ok) return;
  G.flags.rimeDone = true;
  await say(null, 'Rimefang sinks into the ice, and outside, for the first time in a month, the wind drops.');
  if (withParty('kestrel')) {
    await talk([['Kestrel', `…It's done. I thought I'd feel more. I just feel tired. And a bit lighter. Is that how it works?`, 'c:kestrel'], [null, 'She takes a length of sinew from the great wolf, quietly, and restrings her bow with it.']]);
    addItem('whitefang'); addMorale('kestrel', 20);
    await say(null, 'Received Whitefang (Kestrel can equip it).');
  } else { addItem('bow3'); await say(null, 'In the ice behind the wolf lies an old ranger\'s bow. (Received a Windpiercer.)'); }
  sideDone('The White Wolf');
};

// ================================================================= FRIENDS
async function torvaldCairn() {
  if (!G.flags.torvaldKnown) { G.flags.torvaldKnown = true; if (!withParty('garrick')) sideStart('Garrick\'s Brother'); }
  if (G.flags.torvaldDone) { await say(null, 'Garrick\'s brother\'s cairn. Someone has added a fresh stone to the top.'); return; }
  if (!withParty('garrick')) { await say(null, 'A cairn of grey stones, piled the dwarven way. A war hammer lies across the top. The rune on its head reads HOME. Garrick would want to see this.'); return; }
  await talk([
    ['Garrick', `…That's a dwarf cairn. That's — that's Torvald's hammer.`, 'c:garrick'],
    [null, 'Garrick kneels. He doesn\'t say anything for a long time. Then he takes a stone from his pocket — a small grey one, worn smooth — and sets it on top of the cairn.'],
    ['Garrick', `From the hearth at home. I've carried it since he went through. I was going to give it him back.`, 'c:garrick'],
    ['Garrick', `Somebody buried him proper. Out here, in the ash. Somebody who knew how dwarves are buried. An Ashborn, it'd have to be.`, 'c:garrick'],
    ['Garrick', `…I'll take the hammer. He'd want it swung. He'd hate it sitting on a pile of rocks.`, 'c:garrick']
  ]);
  G.flags.torvaldDone = true; addItem('torvald'); addMorale('garrick', 20);
  await say(null, 'Received Torvald\'s Hammer (Garrick can equip it).');
  sideDone('Garrick\'s Brother');
}
STORY.hollin = async function () {
  const N = 'Hollin the Hook', s = 'hollin';
  G.flags.hollinMet = true;
  await talk([
    [N, `Sable! My little magpie, flown home. And with nobs. You always did have ideas above your gutter.`, s],
    ['Sable', `Hollin. I paid my debt. I paid it twice.`, 'c:sable'],
    [N, `Debts are funny. They grow back. You owe me a knife, for a start — that pretty one I taught you with. And you owe me you. Come back to the crew, or your friends find out what a Gutter welcome feels like.`, s]
  ]);
  const c = await ask('Sable', `…Don't. This is mine to sort.`, ['"It\'s ours. We fight together."', '"Then sort it. I\'ve got your back."'], 'c:sable', false);
  await say('Sable', c === 0 ? `…Fine. Together. Don't get stabbed, I'd have to feel things about it.` : `Thanks. Stay close anyway. He cheats.`, 'c:sable');
  const ok = await bossFight(['thug', { id: 'thug', elite: { name: 'Hollin the Hook', mult: 0.9 } }, 'thug'], { bg: 'village' });
  if (!ok) return;
  G.flags.hollinDone = true;
  await talk([[N, `All right — all right! Take the knife. Take the — I'm done. I'm DONE.`, s], ['Sable', `Yes. You are.`, 'c:sable'], ['Sable', `…That's the first time I've walked out of the Gutter without looking back. Huh.`, 'c:sable']]);
  addItem('gutterfang'); addMorale('sable', 20);
  await say(null, 'Received Gutterfang (Sable can equip it).');
  sideDone('Sable\'s Debt');
};
STORY.ilsa = async function () {
  const N = 'Ilsa', s = 'ilsa';
  G.flags.ilsaMet = true;
  if (G.flags.ilsaDone) { await say(N, pick([`My brother keeps looking at me like I'll vanish. I might. I'll come back, though.`, `Kharn's guard is broken. I'm nobody's soldier now. It's very strange.`]), s); return; }
  if (!withParty('varek')) { await say(N, `You fought with Kharn. I was in his guard — they took me when I was fifteen. I'm free now, I suppose. Do you know a deserter called Varek? Tall, scowls, cuts his own hair badly?`, s); if (!G.flags.ilsaToldV) { G.flags.ilsaToldV = true; sideStart('Varek\'s Sister'); } return; }
  await talk([
    ['Varek', `…Ilsa.`, 'c:varek'],
    [N, `You cut your hair yourself again. You always made a mess of the back.`, s],
    ['Varek', `They told me you died at the Burning Ford. I deserted that night. I couldn't fight for a king who'd spend you.`, 'c:varek'],
    [N, `Kharn liked me alive. He said a deserter's sister was useful. Leverage, if you ever came back. You never came back.`, s],
    ['Varek', `I'm here now.`, 'c:varek'],
    [N, `Yes. You are. Take this. It was meant to be yours anyway — Father's sword, reforged. I kept it with my own. Give it a new name in the old script.`, s]
  ]);
  G.flags.ilsaDone = true; addItem('kinblade'); addMorale('varek', 25);
  await say(null, 'Received the Kinblade (Varek can equip it).');
  sideDone('Varek\'s Sister');
};

// ---------------------------------------------------------------- the quest boards reach the new places once you've been there
{
  const qa0 = questAreas;
  questAreas = function () { const base = qa0(); for (const a of ['grotto', 'barrow', 'silvane', 'shrine', 'redcrag']) if (G.flags['v_' + a] && !base.includes(a)) base.push(a); return base; };
}
// ---------------------------------------------------------------- companions say things about the new places
{
  const ct0 = companionTalk;
  const NEW = {
    overworld: {
      wren: [`It's so big out here. I'd only ever seen it from the top of the stable roof.`, `If we get lost, we follow the road. Roads always go somewhere.`],
      lyra: [`The trees out here talk more than the ones near Aldmere. They're not saying anything nice.`, `I like walking with you. Even when it's raining. Especially when it's raining.`],
      garrick: [`Dwarves don't do "open country." Too much sky. It's watching.`, `Mountains to the north. I can smell home. It smells of smoke and wet stone.`],
      sable: [`No walls, no alleys. Where do people hide out here? Behind sheep?`, `Pim's a crook. I respect that. He's a better crook than me.`],
      oswin: [`Every road ends at a door, and every door has someone behind it who needs something. That's my theology, roughly.`, `Look — a waystone. The old pilgrims raised those. Someone keeps them lit.`],
      kestrel: [`Tracks. Boar. Big one. Old Tusk, maybe. Want to go and say hello?`, `The maps say there's nothing east of the fen. The maps are lying.`],
      varek: [`It's green. Everything's so green. I keep waiting for it to catch fire.`, `The Rift's to the east. I can feel it pulling, like a tooth.`]
    }
  };
  companionTalk = async function (f) {
    const id = f.m.cls, set = NEW[G.map === 'overworld' ? 'overworld' : ''];
    if (set && set[id] && Math.random() < 0.55) { await say(f.m.name, pick(set[id]), 'c:' + id); return; }
    return ct0(f);
  };
}

// ---------------------------------------------------------------- nobody stands inside a rock
// people and beasts placed out in the country are nudged onto the nearest open ground
(function settle() {
  for (const id of ['overworld', 'gullhaven', 'cairnstead', 'mirewatch', 'silvane', 'redcrag', 'wastes']) {
    const m = MAPS[id], rows = m.rows;
    const open = (x, y) => rows[y] && rows[y][x] !== undefined && !SOLID.has(rows[y][x]) && !m.npcs.some(o => o.x === x && o.y === y) && !(m.warps || []).some(w => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h);
    for (const n of m.npcs) {
      const c = rows[n.y] && rows[n.y][n.x];
      if (c !== undefined && !SOLID.has(c)) continue;
      outer: for (let d = 1; d < 8; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (open(n.x + dx, n.y + dy)) { n.x += dx; n.y += dy; break outer; }
    }
  }
})();
// and out in the country, everyone and everything must be somewhere you can walk to
(function reachableOverworld() {
  const m = MAPS.overworld, rows = m.rows, Wd = rows[0].length, Ht = rows.length;
  const walk = (x, y) => x >= 0 && y >= 0 && x < Wd && y < Ht && !SOLID.has(rows[y][x]);
  const L = OW.links.valenford.S.out, seen = new Set([L[0] + ',' + L[1]]), q = [[L[0], L[1]]];
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && walk(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
  const taken = new Set(m.npcs.map(n => n.x + ',' + n.y));
  const fix = (x, y) => {
    if (seen.has(x + ',' + y)) return [x, y];
    for (let d = 1; d < 20; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) { const k = (x + dx) + ',' + (y + dy); if (seen.has(k) && !taken.has(k) && rows[y + dy][x + dx] !== '=' && rows[y + dy][x + dx] !== 'B') return [x + dx, y + dy]; }
    return [x, y];
  };
  for (const n of m.npcs) { const [a, b] = fix(n.x, n.y); if (a !== n.x || b !== n.y) { taken.delete(n.x + ',' + n.y); n.x = a; n.y = b; taken.add(a + ',' + b); } }
  for (const p of PICKUPS) if (p[1] === 'overworld') { const [a, b] = fix(p[2], p[3]); p[2] = a; p[3] = b; }
})();
