// =====================================================================
//  story.js : NPC scripts, story events, endings, game over
// =====================================================================
function hero() { return G.name; }
function has(cls) { return G.party.some(m => m.cls === cls); }
// 0 = rescue Lyra, 1 = reach Ironhold/Garrick, 2 = clear mine, 3 = castle, 4 = postgame
function stage() {
  if (!G.flags.chief) return 0;
  if (!G.flags.garrick) return 1;
  if (!G.flags.golem) return 2;
  if (!G.flags.ended) return 3;
  return 4;
}
function byEnd(o) { return o[G.ending] || o.hero; }
function joinParty(cls, name) {
  const m = recruit(cls, name);
  World.syncFollowers();
  Sound.sfx('levelup');
  toast(`${name} joined the party! (Lv ${m.lvl})`, UI.gold);
  return m;
}

function storyObjective() {
  switch (stage()) {
    case 0: return G.flags.metElder
      ? 'Rescue the elf taken by goblins. Their camp is in the north-east of Whisperwood, east of Aldmere. (Suggested level: 4+)'
      : 'Talk to the village elder in front of the house in the north-west of Aldmere.';
    case 1: return 'Head north through Whisperwood, past the old goblin camp, to the dwarf town of Ironhold.';
    case 2: return G.flags.garrick
      ? 'Clear the Old Mine north of Ironhold. Something huge blocks the far eastern tunnel. (Suggested level: 9+)'
      : 'Find a way into the Old Mine.';
    case 3: return 'Cross the Ashen Wastes beyond the mine and storm the Demon Castle. Malgrath waits on his throne. (Suggested level: 18+)';
    default: return `The story is over (${byEnd({ hero: 'Hero ending', mercy: 'Mercy ending', throne: 'Throne ending' })}). The quest board in Aldmere always needs a hand — monsters everywhere now grow with you.`;
  }
}

// ---------------------------------------------------------------- scripts
const STORY = {
  // ------------------------------------------------------------ Aldmere
  async elder() {
    const s = 'elder', N = 'Elder Bram';
    if (!G.flags.metElder) {
      await talk([
        [N, `Easy now, easy. You dropped out of the sky in a column of light and landed in my turnips. Twice, somehow.`, s],
        [N, `Strange clothes… that look in your eyes… You're one of the "Otherworlders" from the old stories, aren't you?`, s],
        [hero(), `I was hit by a truck. Then a goddess apologised a lot. Then turnips.`, 'hero'],
        [N, `Yes, that's usually how it goes. Listen — the Demon King Malgrath has woken in his castle beyond the Ashen Wastes.`, s],
        [N, `His monsters grow bolder by the day. Just this morning goblins carried off a young elf mage who'd been staying at our inn.`, s],
        [N, `Their camp is in the north-east corner of Whisperwood, east of the village. We're farmers. We can't fight them. But you…`, s],
        [N, `Take these. And that wooden sword — it was my grandson's. He'd want it swung at goblins, not hung on a wall.`, s]
      ]);
      G.flags.metElder = true;
      addItem('potion', 3); G.gold += 60;
      Sound.sfx('chest');
      await say(null, 'Received 3 Potions and 60 G!');
      await say(N, `The shop and inn are just east of here. The quest board by the well pays coin for odd jobs, too. Be safe, Otherworlder.`, s);
      return;
    }
    const lines = [
      [`The goblin camp is in the far north-east of Whisperwood. Rest at the inn first if you're hurt.`],
      [`You saved the elf! Ha! North past the old goblin camp is Ironhold, the dwarf town. They'll know more about Malgrath's movements.`],
      [`The dwarves' mine is overrun? Hmph. Dwarves always dig one tunnel too many.`],
      [`The Demon Castle… Otherworlder, whatever happens in there, you've already done more than anyone asked of you.`],
      [byEnd({
        hero: `The Hero of Aldmere, standing in my turnip patch again! Everyone in the kingdom knows your name now.`,
        mercy: `Malgrath asked me how deep to plant carrots. MALGRATH. Asked ME. I've lived too long, and I love it.`,
        throne: `…Your Majesty. The village will pay its tribute on time. Please don't turn my turnips into demons.`
      })]
    ][stage()];
    await say(N, lines[0], s);
  },

  async shopVillage() { await shopScene('village', 'Shopkeeper Mott', 'shop'); },
  async inn() { await innScene(G.map === 'ironhold' ? 'Innkeeper Brunhild' : 'Innkeeper Suzu', 'inn'); },

  async kid() {
    const N = 'Pip', s = 'kid';
    const opts = [
      `Is it true you're from another world?! Do they have dragons? …No dragons? What do you even DO there?`,
      `Mum says I can't go into the forest. Can you punch a slime for me? A big one? Thanks.`,
      `I'm training to be an Otherworlder too. Step one: stand near a road. Mum says no.`
    ];
    if (stage() === 4) opts.push(byEnd({ hero: `When I grow up I'm gonna be the Hero of Aldmere too!`, mercy: `The scary demon man taught me to juggle fireballs! Don't tell Mum.`, throne: `Are you REALLY the Demon Lord now? …Can I have a pet imp?` }));
    await say(N, pick(opts), s);
  },

  async woman() {
    const N = 'Hana', s = 'woman';
    const lines = [
      `Poor Lyra. That elf girl was so polite — she even paid for her room in advance. Please bring her back.`,
      `Lyra's safe? Oh, thank the goddess! You two look good together out there. As a party, I mean!`,
      `Word is the dwarves of Ironhold have stopped sending ore. Something's wrong in their mine.`,
      `The sky over the east has gone red. My laundry won't dry and I blame Malgrath personally.`,
      byEnd({ hero: `My laundry dries again! Thank you, hero!`, mercy: `Malgrath helped me carry the washing today. Very strong. Surprisingly gentle with the delicates.`, throne: `Everything's fine. Everything's fine. The new Demon Lord is very reasonable. Everything's fine.` })
    ];
    await say(N, lines[stage()], s);
  },

  async guardVillage() {
    const N = 'Guard Tomas', s = 'guard';
    if (stage() === 0) await say(N, `East leads into Whisperwood. Slimes, bats, wolves… and goblins, lately. If you're hurt, come back and rest. No shame in it.`, s);
    else if (stage() < 4) await say(N, `Hold Shift to run. Not an official guard tip, just something I've noticed about adventurers.`, s);
    else await say(N, byEnd({ hero: `Standing guard is a lot less stressful now. Thanks for that.`, mercy: `I'm meant to guard the village from the Demon King. He lives here now. I'm not sure what my job is anymore.`, throne: `I… guard the village… for you… my lord. Please don't eat me.` }), s);
  },

  async farmer() {
    const N = 'Farmer Tobbs', s = 'villager';
    await say(N, pick([
      `Crops are good this year. Well, aside from the bits you landed on.`,
      `If you find any Moonpetals out in the woods, the quest board sometimes wants 'em. Worth a pretty coin.`,
      `An Otherworlder in Aldmere! My great-grandad met one. Said he kept yelling about "status windows".`
    ]), s);
  },

  async malgrathVillage() {
    const N = 'Malgrath', s = 'king';
    await say(N, pick([
      `Three hundred years of ruling darkness, and it turns out I'm rather good at turnips.`,
      `Your elder says I'm "too intense" with the scarecrows. I simply gave them a menacing aura.`,
      `You spared me, ${hero()}. Nobody has ever done that. I'm still deciding how I feel. Mostly… grateful.`
    ]), s);
    const c = await ask(N, `Still, my fists get restless. Care for a friendly rematch? No hard feelings. Some hard punches.`, ['Rematch!', 'Maybe later'], s);
    if (c !== 0) { await say(N, `Coward. Kidding. Mostly.`, s); return; }
    const res = await startBattle(['king'], { bg: 'forest', music: 'boss' });
    if (res === 'lose') return;
    if (res === 'win') {
      const g = 800 + heroLevel() * 20;
      G.gold += g; Sound.sfx('coin');
      await say(N, `Ha… HA! Still got it. Here, the villagers pay me in coin for scaring crows. Take it — ${g} G.`, s);
    }
  },

  // ------------------------------------------------------------ Whisperwood: goblin camp
  async lyraTied() { await chiefEvent(); },
  async chief() { await chiefEvent(); },
  async goblinGuard() {
    await say('Goblin', pick([`Oi! No humans past here! Chief's orders!`, `Grk! Go bother the Chief if you wanna die!`, `This road's closed. Goblin toll: everything you own.`]), 'goblin');
  },

  // ------------------------------------------------------------ Ironhold
  async garrick() {
    const N = 'Garrick', s = 'garrick';
    await talk([
      [N, `Hold it. Nobody's going in that mine. Not since the old golem woke up at the bottom and the dead started walking.`, s],
      [N, `My brother Dunstan was down there when it happened. Three weeks, now. …You've got the look of someone about to do something stupid.`, s]
    ]);
    if (has('lyra')) await say('Lyra', `We're heading for the Demon Castle. The only road east goes through that mine.`, 'lyra');
    await talk([
      [hero(), `We'll get through. And if your brother's down there, we'll look for him.`, 'hero'],
      [N, `…Hah. Otherworlder, eh? Fine. Stupid things go better with a shield in front of them. I'm coming with you.`, s]
    ]);
    G.flags.garrick = true;
    joinParty('garrick', 'Garrick');
    await say(N, `The mine's through the gate up north. Torches won't reach far down there, so stay close. And buy some Phoenix Downs. Trust me.`, s);
  },
  async mineGuard() { await say('Dwarf Sentry', `Mine's sealed. Talk to Garrick if you've got a death wish — he's the only one who'll go down there.`, 'dwarf'); },
  async shopIronhold() { await shopScene('ironhold', 'Quartermaster Olga', 'shop'); },

  async smith() {
    const N = 'Smith Haldor', s = 'smith';
    if (G.flags.ended && !G.flags.truckblade) {
      await say(N, `You. Otherworlder. I've heard the tales. "Truck-kun." A great metal beast from another world.`, s);
      await say(N, `I've dreamt of forging a blade from its spirit ever since. Bring me 2500 G for materials and I'll make you the finest sword in Eldoria.`, s);
      if (G.gold < 2500) { await say(N, `…You don't have it. Come back when you do. The dream can wait. Barely.`, s); return; }
      if (!(await confirm(N, `Pay 2500 G to forge the Truckblade?`, s))) { await say(N, `Hmph. The forge will be here.`, s); return; }
      G.gold -= 2500; G.flags.truckblade = true;
      await fadeOut(0.4); Sound.sfx('crash'); await wait(0.6); Sound.sfx('horn'); await wait(0.8); await fadeIn(0.4);
      addItem('truckblade'); Sound.sfx('levelup');
      await say(null, 'Received the Truckblade! (Equip it from the menu.)');
      await say(N, `It honks when you swing it. I didn't put that there. I'm choosing not to think about it.`, s);
      return;
    }
    if (G.flags.truckblade) { await say(N, `How's the Truckblade? Still honking? …Good. Good.`, s); return; }
    await say(N, pick([
      `Olga sells my work up front. Steel Blade, War Axe, Chain Mail — all Haldor originals.`,
      `An Otherworlder, eh? Some day, when your journey's done, come see me. I have an idea. A big, loud idea.`,
      `A blade is only as good as the arm swinging it. Level up, then upgrade.`
    ]), s);
  },

  async dwarfTalk() {
    const lines = [
      `Garrick's been standing at that gate for weeks. Stubborn as bedrock, that one.`,
      `You got Garrick to move? Ha! You've got a silver tongue, human.`,
      `Ironhold was built by dwarves who dug too deep. Then we built the mine by digging deeper. We don't learn.`
    ];
    await say('Dwarf', stage() === 4 ? byEnd({ hero: `The ore carts are rolling again! Drinks are on Ironhold, hero.`, mercy: `You let the Demon King LIVE? …Well, I suppose we let Garrick live, and he's worse.`, throne: `We dwarves bow to no king. …We'll make an exception for you. Out of caution.` }) : pick(lines), 'dwarf');
  },
  async dwarfTalk2() {
    await say('Old Miner', pick([
      `Fire won't do much to that golem. Stone doesn't burn. Lightning, though — lightning splits rock.`,
      `The mine's dark as a dragon's belly. The deeper you go, the nastier it gets.`,
      `Beyond the mine lie the Ashen Wastes. There's a camp at the edge — a merchant and a healer, last I heard.`
    ]), 'dwarf');
  },
  async kidIronhold() {
    await say('Dwarf Kid', pick([
      `I'm not short. I'm a dwarf. There's a difference and I'll fight you about it.`,
      `Garrick can lift a cart with one arm! …A small cart. An empty one. Still!`,
      `Is it true Otherworlders get "cheat skills"? That's not fair. I want a cheat skill.`
    ]), 'kid');
  },

  // ------------------------------------------------------------ Old Mine
  async golem() {
    await say(null, 'An enormous stone figure blocks the tunnel. Runes flare blue across its chest as you approach.');
    if (has('garrick')) await say('Garrick', `That's it. The Warden. It was built to guard the deep vaults… something woke it and turned it mean.`, 'garrick');
    if (!(await confirm(null, 'The Stone Golem turns towards you. Fight it?'))) return;
    const res = await startBattle(['golem'], { bg: 'cave' });
    if (res !== 'win') return;
    G.flags.golem = true;
    await say(null, 'The golem crumbles into a pile of rubble. Fresh, hot air blows through the tunnel beyond.');
    if (has('garrick')) {
      await talk([
        ['Garrick', `…There's scratching on the wall behind it. "Dunstan was here. Went east. Don't follow, idiot." That's him! He's alive!`, 'garrick'],
        ['Garrick', `Well. I'm following. That's the way to the Wastes anyway.`, 'garrick']
      ]);
    }
    toast('The path to the Ashen Wastes is open.', UI.gold);
  },

  // ------------------------------------------------------------ Ashen Wastes camp
  async shopCamp() {
    if (!G.flags.metDunstan && has('garrick')) {
      G.flags.metDunstan = true;
      await talk([
        ['Merchant', `Garrick?! You great lump, I TOLD you not to follow me!`, 'merchant'],
        ['Garrick', `…Dunstan? Why are you in a robe?`, 'garrick'],
        ['Merchant', `I escaped the mine, made it to the Wastes, and started selling potions to adventurers. Business is booming. Literally, there's a lot of fire out here.`, 'merchant'],
        ['Garrick', `Mother thinks you're dead.`, 'garrick'],
        ['Merchant', `Mother always thinks I'm dead. Here — family discount. For the next five seconds.`, 'merchant']
      ]);
      addItem('phoenix', 2); addItem('hipotion', 3); Sound.sfx('chest');
      await say(null, 'Received 2 Phoenix Downs and 3 Hi-Potions!');
    }
    await shopScene('camp', G.flags.metDunstan ? 'Dunstan' : 'Merchant', 'merchant');
  },
  async healer() {
    if (stage() === 3) await say('Healer Sera', `The castle is north-east, past the lava. Whatever you face there, face it rested.`, 'healer');
    await innScene('Healer Sera', 'healer', true);
  },

  // ------------------------------------------------------------ Demon Castle
  async king() {
    const N = 'Malgrath', s = 'king';
    if (!G.flags.metKing) {
      G.flags.metKing = true;
      Sound.stop(); Sound.play('dark');
      await talk([
        [N, `So. The goddess sent another one.`, s],
        [N, `Do you know how many Otherworlders have stood where you stand, ${hero()}? Eleven. Eleven trucks. Eleven "chosen ones".`, s],
        [N, `Not one of them could make me bleed. I've spent three centuries on this throne waiting for someone worth fighting.`, s]
      ]);
      if (has('lyra')) await say('Lyra', `You burned my village's forest to draw out a hero?!`, 'lyra');
      if (has('lyra')) await say(N, `It worked, didn't it?`, s);
      if (has('garrick')) await say('Garrick', `Enough talk. I've got a shield and a bad mood.`, 'garrick');
    }
    if (!(await confirm(N, `Well, Otherworlder? Show me why that truck chose you.`, s))) {
      await say(N, `Go, then. Rest. Sharpen your little sword. I have waited three hundred years — I can wait for you to use the toilet.`, s);
      Sound.stop(); Sound.play('castle');
      return;
    }
    const res = await startBattle(['king'], { bg: 'castle', music: 'boss' });
    if (res !== 'win') return;
    await endingSequence();
  }
};

// ---------------------------------------------------------------- goblin chief event
async function chiefEvent() {
  if (G.flags.chief) return;
  const L = 'Lyra', C = 'Goblin Chief';
  if (!G.flags.sawCamp) {
    G.flags.sawCamp = true;
    await talk([
      [C, `HRAAH! A human! Lads, look — dinner walked in by itself!`, 'chief'],
      [L, `Hey! You! Weird clothes! Yes, you! Cut these ropes and I'll deal with the rest!`, 'lyra'],
      [C, `Shut it, elf! You're worth a fortune to the Demon King's men!`, 'chief']
    ]);
  }
  if (!(await confirm(null, 'Cut Lyra free and fight the Goblin Chief? (Suggested level: 4+)'))) {
    await say(L, `Don't leave me here! …Okay, go heal up, but hurry! He keeps singing!`, 'lyra');
    return;
  }
  await say(null, `You slash through Lyra's ropes!`);
  joinParty('lyra', 'Lyra');
  await say(L, `Finally! I'm Lyra — elf, mage, extremely annoyed. Let's roast him!`, 'lyra');
  const res = await startBattle(['goblin', 'chief'], { bg: 'forest' });
  if (res !== 'win') return;
  G.flags.chief = true;
  World.refreshNpcs(true);
  await talk([
    [null, `The goblins scatter into the trees, dragging their chief behind them.`],
    [L, `Phew. Thank you, really. The Demon King's men pay goblins to snatch elves — something about our magic. It's getting worse.`, 'lyra'],
    [hero(), `The elder said Malgrath woke up. I'm… apparently supposed to stop him. A goddess said so. After a truck.`, 'hero'],
    [L, `An Otherworlder?! Oh, you are SO lucky I'm the one you rescued. I've read every Otherworlder chronicle there is.`, 'lyra'],
    [L, `I'm coming with you. Don't argue. North of here is Ironhold, the dwarf town — they'll know the way east.`, 'lyra']
  ]);
  toast('The road north to Ironhold is open.', UI.gold);
}

// ---------------------------------------------------------------- map entry triggers
async function onEnterMap(id) {
  const first = !G.flags['v_' + id];
  G.flags['v_' + id] = true;
  if (!first) return;
  if (id === 'forest' && stage() === 0) await say(null, 'Whisperwood. Fresh goblin tracks lead off to the north-east.');
  if (id === 'ironhold' && has('lyra')) await say('Lyra', `Ironhold! Mind your head — dwarf doorways. …Why is everyone staring at that gate up north?`, 'lyra');
  if (id === 'mine') {
    if (has('garrick')) await say('Garrick', `Stay close. The golem's lair is at the far eastern end. Everything between here and there wants us dead.`, 'garrick');
  }
  if (id === 'wastes' && stage() === 3) {
    await say(null, 'The air tastes of smoke. Far to the north-east, a black castle claws at a red sky.');
    if (has('lyra')) await say('Lyra', `There's a campfire to the west of the road. Let's stock up before we go anywhere near that castle.`, 'lyra');
  }
  if (id === 'castle' && stage() === 3) {
    Sound.sfx('dark');
    await say('???', `"Another one climbs my stairs. Come, then. The throne room is straight ahead. Don't keep me waiting."`);
  }
}

// ---------------------------------------------------------------- endings
async function endingSequence() {
  const N = 'Malgrath', s = 'king';
  Sound.stop(); Sound.play('dark');
  await talk([
    [N, `Hah… haha… Three hundred years. Finally. Finally someone who can make me bleed.`, s],
    [N, `Well, Otherworlder? This is the part where you decide. The stories only ever end one of three ways.`, s]
  ]);
  const c = await ask(N, `End me, spare me… or take my crown for yourself?`, ['End him. For everyone he hurt.', 'Spare him.', 'Take his crown.'], s, false);
  const ending = ['hero', 'mercy', 'throne'][c];
  if (ending === 'hero') {
    await talk([
      [hero(), `This is for Aldmere. For Lyra's forest. For everyone you hurt just to find a good fight.`, 'hero'],
      [N, `…Good. That's… the right answer. Make it quick, hero.`, s]
    ]);
    Sound.sfx('crash'); await fadeOut(0.2, '#ffffff'); await wait(0.6); await fadeIn(0.6);
    await say(null, 'Malgrath dissolves into black ash. The red sky cracks, and for the first time in weeks, sunlight pours in.');
  } else if (ending === 'mercy') {
    await talk([
      [hero(), `No. I didn't come here to kill anyone. I came to make it stop. It's over, Malgrath.`, 'hero'],
      [N, `…You would spare me? After everything?`, s],
      [hero(), `You said nobody could make you bleed. I think nobody ever tried to make you anything else, either.`, 'hero'],
      [N, `……I don't know what to do with that. Nobody has ever… Fine. FINE. I'll call off the armies. And then… I don't know. Farm?`, s]
    ]);
    if (has('lyra')) await say('Lyra', `Did we just recruit the Demon King as a turnip farmer?`, 'lyra');
    G.flags.end_mercy = true;
  } else {
    await talk([
      [hero(), `Actually… I think I'll take that throne.`, 'hero'],
      [N, `…Oh? Ohhh. Now THAT is a twist. Very well — the crown is yours, Demon Lord ${hero()}. I'll be in exile. Try not to be boring.`, s]
    ]);
    if (has('lyra')) await say('Lyra', `${hero()}?! What are you doing?!`, 'lyra');
    if (has('garrick')) await say('Garrick', `…Well. At least the dwarves will get a trade deal out of this. Right? Right?`, 'garrick');
    Sound.sfx('dark');
    await say(null, 'The crown settles on your head. Every demon in the castle falls silent, then kneels.');
  }
  G.ending = ending;
  G.flags.ended = true;
  G.postgame = true;
  await fadeOut(1.2);
  await rollCredits(ending);
  // wake up in the postgame
  if (ending === 'throne') World.load('castle', 12, 6, 'down');
  else World.load('village', 16, 8, 'down');
  World.syncFollowers();
  saveGame();
  await fadeIn(0.8);
  toast('Game saved.', UI.hp);
  await say(null, byEnd({
    hero: 'Aldmere throws a festival in your honour. Shops across the land now give you a hero\'s discount.',
    mercy: 'Malgrath keeps his word. The armies go home. He has moved to Aldmere and bought a small farm.',
    throne: 'You rule from the Demon Castle. Demons obey you… and merchants now charge you "Demon Lord prices".'
  }));
  await say(null, 'POSTGAME UNLOCKED: Monsters everywhere now grow with your party. Take on endless jobs from the Aldmere quest board, hunt elite bounties, and visit the Ironhold smith…');
}

class CreditsScene {
  constructor(ending) {
    this.y = H + 20; this.t = 0; this.done = false;
    this.promise = new Promise(r => this.resolve = r);
    const title = { hero: 'ENDING I — THE HERO OF ALDMERE', mercy: 'ENDING II — THE TURNIP KING', throne: 'ENDING III — DEMON LORD ' + G.name.toUpperCase() }[ending];
    const blurb = {
      hero: ['The Demon King fell, and the sun returned.', 'Songs were written. Most of them rhymed "truck" with "luck".'],
      mercy: ['The Demon King lived, and learned to farm.', 'The turnips of Aldmere have never been so afraid.'],
      throne: ['A new Demon Lord rose from another world.', 'History will decide whether that was a good thing.']
    }[ending];
    this.lines = [
      [title, UI.gold, 22], ['', 0, 16], ...blurb.map(b => [b, UI.paper, 16]), ['', 0, 30],
      ['I GOT ISEKAI\'D', UI.sakura, 26], ['The Video Game', UI.paper, 18], ['', 0, 30],
      ['Starring', UI.dim, 14], [G.name + ' — the Otherworlder', UI.paper, 17],
      ...(G.party.some(m => m.cls === 'lyra') ? [['Lyra — elf, mage, extremely annoyed', UI.paper, 17]] : []),
      ...(G.party.some(m => m.cls === 'garrick') ? [['Garrick — shield, bad mood', UI.paper, 17]] : []),
      ['Malgrath — the Demon King', UI.paper, 17], ['Truck-kun — as himself', UI.paper, 17], ['', 0, 30],
      ['Created by', UI.dim, 14], ['Kundai', UI.paper, 18], ['', 0, 30],
      ['Playtime ' + fmtTime(G.playTime) + '   ·   Monsters defeated ' + G.kills, UI.dim, 15], ['', 0, 40],
      ['Thank you for playing!', UI.gold, 20], ['', 0, 20], ['The adventure continues…', UI.dim, 15]
    ];
    this.total = this.lines.reduce((a, l) => a + l[2] + 16, 0);
  }
  update(dt) {
    this.t += dt;
    const fast = Input.held('ok') ? 4 : 1;
    this.y -= dt * 34 * fast;
    if (this.y + this.total < H / 2 - 40) {
      this.y = H / 2 - 40 - this.total;
      this.done = true;
      if (Input.pressed('ok')) { Sound.sfx('ok'); this.resolve(); }
    }
  }
  draw() {
    ctx.fillStyle = '#07051a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      const x = (hash2(i, 3) % W), y = (hash2(i, 7) % H), tw = Math.sin(TIME * 2 + i) > 0.6;
      ctx.fillStyle = tw ? '#ffffff' : '#6a6aa0'; ctx.fillRect(x, y, 2, 2);
    }
    let y = this.y;
    for (const [s, col, size] of this.lines) { if (s) text(s, W / 2, y, col, size, 'center'); y += size + 16; }
    if (this.done) text(`Press ${Controls.label('ok')}`, W / 2, H - 40, UI.dim, 13, 'center', false);
  }
}
async function rollCredits(ending) {
  Sound.stop(); Sound.play('ending');
  const c = new CreditsScene(ending);
  Scenes.push(c);
  await fadeIn(0.8);
  await c.promise;
  await fadeOut(0.8);
  Scenes.remove(c);
  Sound.stop();
}

// ---------------------------------------------------------------- game over
class GameOverScene {
  constructor() { this.sel = 0; this.promise = new Promise(r => this.resolve = r); this.opts = [hasSave() ? 'Load last save' : 'Try again', 'Title screen']; }
  update() {
    if (Input.pressed('up') || Input.pressed('down')) { this.sel ^= 1; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) { Sound.sfx('ok'); this.resolve(this.sel); }
  }
  draw() {
    ctx.fillStyle = '#0a0308'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 360);
    g.addColorStop(0, 'rgba(120,10,30,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    text('GAME OVER', W / 2, 130, UI.bad, 44, 'center');
    text('Maybe the goddess will give you a third try.', W / 2, 196, UI.dim, 15, 'center', false);
    this.opts.forEach((o, i) => {
      text(o, W / 2, 280 + i * 36, i === this.sel ? UI.paper : UI.dim, 18, 'center');
      if (i === this.sel) drawCursor(W / 2 - textWidth(o, 18) / 2 - 26, 282 + i * 36);
    });
  }
}
async function gameOver() {
  Sound.stop(); Sound.play('gameover');
  const s = new GameOverScene();
  Scenes.push(s);
  await fadeIn(0.8);
  const c = await s.promise;
  await fadeOut(0.5);
  Sound.stop();
  if (c === 0 && loadGame()) { startWorld(); await fadeIn(0.5); return; }
  if (c === 0) { // no save somehow: restart in Aldmere with the party revived
    healParty(); G.map = 'village'; G.x = 5; G.y = 6; startWorld(); await fadeIn(0.5); return;
  }
  goTitle();
}
