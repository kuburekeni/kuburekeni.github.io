// =====================================================================
//  story.js : Tokyo tutorial, the Eldoria story, companions, the boss
//  door, the three endings, game over and permadeath
// =====================================================================
function hero() { return G.name; }
function has(cls) { return inParty(cls); }
// 0 rescue Lyra · 1 reach Ironhold / open the mine · 2 cross the mine · 3 the castle · 4 after an ending
function stage() {
  if (!G.flags.chief) return 0;
  if (!G.flags.mineOpen) return 1;
  if (!G.flags.golem) return 2;
  if (!G.ending) return 3;
  return 4;
}
function byEnd(o) { return o[G.ending] || o.door; }
function joinParty(cls, name) {
  const m = G.flags['bench_' + cls] ? rejoin(cls) : recruit(cls, name);
  if (cls === 'lyra') G.flags.lyraWaits = false;
  if (cls === 'garrick') G.flags.garrickWaits = false;
  World.syncFollowers();
  Sound.sfx('levelup');
  toast(`${name} joined the party (Lv ${m.lvl}). Your turn timer is now ${turnTime()}s.`, UI.gold);
  return m;
}

function storyObjective() {
  if (G.map === 'tokyo' || G.map === 'konbini') {
    if (!G.flags.tk_aoi) return 'Talk to Aoi by the school gate.';
    if (!G.flags.tk_spar) return 'Daichi is waiting outside the kendo dojo for your last practice spar.';
    if (!G.flags.tk_cake) return 'Buy Mei\'s birthday cake at the Family Mart across the courtyard wall, to the east.';
    if (!G.flags.tk_shrine) return 'Mum asked you to make a wish for Mei at Kitazawa Shrine, in the north-east.';
    return 'Head home. Cross the road at the crosswalk by the vending machines.';
  }
  const intro = INTRO();
  switch (stage()) {
    case 0: return !G.flags.metElder ? 'Speak with the old man who found you.'
      : `Rescue the elf held at the goblin camp, north-east through Whisperwood (east of Aldmere). Suggested level: ${intro ? '5+. You may have to face the chief alone.' : '4+.'}`;
    case 1:
      if (G.flags.lyraWaits && !has('lyra') && itemCount('grimoire')) return 'The elf fled. Return her grimoire at the Crooked Lantern in Aldmere, or press on alone to Ironhold, north through Whisperwood.';
      if (G.flags.garrickMet && !G.flags.mineOpen) return 'Garrick won\'t open the mine for a stranger. Prove yourself to him.';
      return 'Travel north through Whisperwood to the dwarf town of Ironhold. The Old Mine beyond it is the only road east.';
    case 2: return 'Cross the Old Mine. Something ancient blocks the far eastern tunnel. (Suggested level: 9+)';
    case 3: return 'Cross the Ashen Wastes to Castle Vharn. The sealed door of the throne room waits at the top of the great hall. (Suggested level: 18+)';
    default: return byEnd({
      door: 'The war goes on. Ashborn raiders roam every road, and the quest board in Aldmere needs you. Behind the sealed door, Malgrath still waits.',
      deal: 'The Treaty of Ash holds, for now. Keep the peace: the quest board in Aldmere has work on both sides of the border.',
      purge: 'The Ashborn are gone from the land. It is very quiet. The quest board in Aldmere still has work.'
    });
  }
}

// ---------------------------------------------------------------- scripts
const STORY = {
  none() { },

  // ================================================================ TOKYO
  async aoi() {
    const A = 'Aoi', s = 'aoi';
    if (!G.flags.tk_aoi) {
      await talk([
        [A, `There you are. I thought you'd already gone. Daichi's been pacing outside the dojo for ten minutes.`, s],
        [A, `He says it's your last practice before exams, and he's "not letting you skip out on it like last week."`, s],
        [hero(), `I'll be quick. It's Mei's birthday. I promised I'd bring the cake home before dinner.`, 'hero'],
        [A, `Thirteen, right? She's going to be taller than you soon.`, s],
        [A, `The Family Mart across the road still has strawberry shortcake. I saw it this morning. Go. Spar first, or Daichi will follow you home.`, s]
      ]);
      G.flags.tk_aoi = true;
      await say(null, `TIP: Walk up to people and press ${Controls.label('ok')} to talk. Hold RUN to move faster.`);
      return;
    }
    if (!G.flags.tk_cake) await say(A, `Cake. Family Mart. Don't forget, or Mei will never let you hear the end of it.`, s);
    else await say(A, `Tell Mei happy birthday from me. See you tomorrow.`, s);
  },
  async daichi() {
    const D = 'Daichi', s = 'daichi';
    if (!G.flags.tk_aoi) { await say(D, `…Aoi was looking for you. Talk to her first.`, s); return; }
    if (G.flags.tk_spar) { await say(D, `Good match. Go on, your sister's waiting.`, s); return; }
    await talk([
      [D, `You came. Good.`, s],
      [D, `Three minutes. Full focus. After exams the club gets a new captain, and I want to see you fight properly once before that.`, s]
    ]);
    if (!(await confirm(D, 'Ready?', s))) { await say(D, `I'll be here.`, s); return; }
    const res = await startBattle(['kendo'], { bg: 'dojo', music: 'battle', tutorial: true, intro: 'Daichi takes his stance.' });
    healParty();
    G.flags.tk_spar = true;
    if (res === 'win') await say(D, `…That's the one. That's the strike I've been waiting two years for.`, s);
    else await say(D, `You hesitated. Everyone does. The trick is to hesitate less than the other person.`, s);
    await talk([
      [D, `Here. From the club.`, s],
      [null, 'Daichi hands you two onigiri wrapped in cling film.'],
      [D, `Go home. Tell Mei the captain said happy birthday.`, s]
    ]);
    addItem('onigiri', 2);
    await say(null, `TIP: Press ${Controls.label('menu')} to open the menu. You can check your items and equipment there.`);
  },
  async tStudent() { await say('Student', pick(['Are you going to the festival next week?', 'I failed the maths quiz. Again.', 'The kendo club\'s still here? Don\'t they ever go home?']), 'student'); },
  async tStudent2() { await say('Student', 'I\'m waiting for my brother. He always takes forever.', 'aoi'); },
  async tSalary() { await say('Office Worker', pick(['Another late one. At least the sunset\'s nice.', 'Watch the crossing by the vending machines. Drivers take that corner too fast.']), 'salary'); },
  async tPriest() {
    await say('Priest', 'The shrine is open until dark. Make your wish from the heart, and the kami will hear it.', 'priest');
  },
  async tClerk() {
    if (!G.flags.tk_cake && !itemCount('cake')) await say('Clerk', 'Welcome! We\'ve got one strawberry shortcake left, if you\'re after one.', 'clerk');
    await shopScene('konbini', 'Clerk', 'clerk');
    if (itemCount('cake') && !G.flags.tk_cake) {
      G.flags.tk_cake = true;
      await say('Clerk', 'Happy birthday to whoever it\'s for! Careful with the box.', 'clerk');
      toast('Objective updated.', UI.gold);
    }
  },
  async tVending() {
    if (G.map !== 'tokyo') return;
    if (G.gold < 130) { await say(null, 'A vending machine. You don\'t have ¥130.'); return; }
    if (await confirm(null, 'Buy a can of warm milk tea for ¥130?')) { G.gold -= 130; Sound.sfx('coin'); await say(null, 'Clunk. The can is warm in your hands. You drink it on the spot.'); }
  },
  async tShrine() {
    if (G.map !== 'tokyo') return;
    if (G.flags.tk_shrine) { await say(null, 'The shrine is silent.'); return; }
    await say(null, 'You toss a coin into the offering box, bow twice, clap twice, and close your eyes.');
    const c = await ask(null, 'What do you wish for?', ['That Mei has a happy birthday.', 'That Mei grows up safe.', 'That nothing ever changes.'], null, false);
    G.flags.tk_wish = c;
    Sound.stop(); Sound.sfx('magic');
    await wait(0.8);
    await say('???', '"…I hear you."');
    await say(null, 'A woman\'s voice. You open your eyes. There is no one there. Only the fox statues, and the last of the light.');
    Sound.play('tokyo');
    G.flags.tk_shrine = true;
    await say(null, `TIP: Your journey is saved automatically at key moments. In the other world, rest at inns to save, or save from the menu.`);
  },
  async tLeaveSchool(tr) {
    if (G.flags.tk_spar) return;
    await say(null, G.flags.tk_aoi ? 'Daichi is still waiting at the dojo. You promised.' : 'Aoi is waving at you from by the gate.');
    World.player.fx = World.player.x; World.player.fy = World.player.y; World.player.y -= 1; World.player.t = 0; World.player.dir = 'up';
  },
  async tCrossing() {
    if (!G.flags.tk_cake || !G.flags.tk_shrine) {
      await say(null, !G.flags.tk_cake ? 'You can\'t go home without Mei\'s cake.' : 'Mum asked you to stop at the shrine for Mei first.');
      World.player.fx = World.player.x; World.player.fy = World.player.y; World.player.y -= 1; World.player.t = 0; World.player.dir = 'up';
      return;
    }
    await crossingCutscene();
  },

  // ================================================================ ALDMERE
  async elder() {
    const s = 'elder', N = 'Elder Bram';
    if (!G.flags.metElder) {
      G.flags.metElder = true;
      await talk([
        [N, `Easy. Don't try to stand yet. We found you in the barley at first light, not a mark on you.`, s],
        [hero(), `Where… is this? I was on the road. There was a girl, and a truck, and…`, 'hero'],
        [N, `A truck. I don't know the word. But I know the look on your face.`, s],
        [N, `You're in Aldmere, in the kingdom of Eldoria. The old stories speak of people like you. Souls the goddess carries across from another world, in the Kingdom's darkest hours.`, s],
        [N, `And these are dark hours. Malgrath, King of the Ashborn, has led his people out of the Wastes. Villages east of here have burned. We have lost sons to his raiders.`, s],
        [N, `Three days ago, goblins came out of Whisperwood. They took an elf who was staying at the inn. A mage. They sell captives to the Ashborn.`, s],
        [N, `I won't pretend I have the right to ask you anything. You've only just arrived. But their camp is in the north-east of the forest, and no one here can fight.`, s],
        [N, `Take these. And this. It was my grandson's. He'd want it used.`, s]
      ]);
      G.flags.metElder = true;
      addItem('potion', 3); G.gold += 60;
      const hm = G.party[0];
      if (G.heroClass !== 'mage') { hm.equip.weapon = 'wsword'; } // the shinai is carried as a keepsake
      Sound.sfx('chest');
      await say(null, `Received 3 Potions and 60 G.${G.heroClass !== 'mage' ? ' You equip the wooden sword.' : ''}`);
      await say(N, `The shop and the Crooked Lantern inn are across the green. The quest board by the pond pays coin for honest work. Whatever you decide, Otherworlder, thank you for listening.`, s);
      return;
    }
    const lines = [
      `The goblin camp is in the far north-east of Whisperwood. Rest at the inn first. There's no shame in it.`,
      `North through the forest is Ironhold, the dwarf town. The only road east goes under the mountain.`,
      `The dwarves' mine is overrun? Then the Ashborn found another way in. Be careful down there.`,
      `The castle… Whatever you find behind that door, you've already done more than any of us had the right to ask.`,
      byEnd({
        door: `The raids haven't stopped. We bury someone every week. I don't blame you. I only wish I knew what you saw behind that door.`,
        deal: `A treaty with the Ashborn. My grandson died fighting them. I don't know whether to curse you or thank you. Maybe both, for a while.`,
        purge: `They say the Wastes are empty now. That the war is over for good. I should feel relief. I keep thinking about how quiet it must be out there.`
      })
    ];
    await say(N, lines[stage()], s);
  },
  async shopVillage() { await shopScene('village', 'Mott', 'shop'); },
  async inn() { await innScene(G.map === 'ironhold_tavern' ? 'Brunhild' : 'Suzu', 'inn'); },
  async kid() {
    const N = 'Pip', s = 'kid';
    const lines = [
      `Are you really from another world? …Do people there fight wars too?`,
      `My dad went east with the militia. He said he'd be back before the harvest.`,
      `Mum says I'm not allowed past the fence anymore. Not since the raid at Thornby.`,
      stage() === 4 ? byEnd({ door: `Dad still isn't back.`, deal: `There's an Ashborn man in the square. He has horns! He said his daughter is my age.`, purge: `Everyone's celebrating. Mum cried, though. I don't know if it was the happy kind.` }) : `I'm going to be a knight when I grow up. Then I'll protect everyone.`
    ];
    await say(N, pick(lines), s);
  },
  async woman() {
    const N = 'Hana', s = 'woman';
    const lines = [
      `Lyra, the elf, she was kind to my boy. Taught him a light spell. Please bring her back.`,
      `You found her? Thank the goddess. Nobody comes back once the goblins have them.`,
      `The dwarves haven't sent ore in weeks. Without it, the smiths can't arm anyone.`,
      `The sky in the east has gone red. My husband says that's the Wastes burning.`,
      byEnd({ door: `They took the Harlow boy on the east road last night. Raiders. Just a boy.`, deal: `I don't trust them. But nobody has died on the east road since the treaty. That has to count for something.`, purge: `We won. That's what the heralds say. We won.` })
    ];
    await say(N, lines[stage()], s);
  },
  async guardVillage() {
    const N = 'Guard Tomas', s = 'guard';
    if (stage() === 0) await say(N, `East is Whisperwood. Slimes, bats, wolves, and goblins, lately. If you're hurt, come back. Dead heroes don't rescue anyone.`, s);
    else if (stage() < 4) await say(N, `Travel light and rest often. The road east only gets worse.`, s);
    else await say(N, byEnd({ door: `Double watches now. The raiders come at night.`, deal: `I'm told to salute the Ashborn envoy when he passes. I'm still getting used to it.`, purge: `They've cut the watch down to one man. Nothing left out there to watch for.` }), s);
  },
  async farmer() { await say('Farmer Tobbs', pick([`Harvest's thin this year. Half the lads are gone east.`, `If you're after work, check the quest board. People need herbs gathered and roads cleared.`, `An Otherworlder in my barley. My grandfather saw one once, he said. Said she never smiled.`]), 'villager'); },
  async refugee() { await say('Refugee', `We came from Thornby. There's no Thornby now. The Ashborn came in the night, and the war goes on, and nobody is coming to end it.`, 'woman'); },
  async soldierPurge() { await say('Soldier', `I marched in the last push into the Wastes. We burned everything. Orders were orders. …I don't sleep much.`, 'guard'); },
  async envoyVillage() { await say('Ashborn Envoy', `I am here under the Treaty of Ash, to settle disputes at the border. Your people stare. Mine did too, when the first human merchant came to Vharn. Staring is better than fighting.`, 'demonm'); },
  async patron() { await say('Patron', pick([`The Crooked Lantern's been here two hundred years. Survived two wars. It'll survive this one.`, `Don't mind me. Just drinking to my brother. He's with the militia, somewhere east.`]), 'villager'); },

  // ================================================================ WHISPERWOOD
  async lyraTied() { await chiefEvent(); },
  async chief() { await chiefEvent(); },
  async goblinGuard() { await say('Goblin', pick([`No humans past here. Chief's orders.`, `Go away. The elf's already sold.`, `The Ashborn pay in silver. What've you got?`]), 'goblin'); },
  async lyraTavern() {
    const L = 'Lyra', s = 'lyra';
    if (G.flags['bench_lyra']) {
      if (await confirm(L, `You're back. Do you want me walking with you again?`, s)) { joinParty('lyra', 'Lyra'); await say(L, `Let's go, then.`, s); }
      else await say(L, `I'll be here. The fire's warm and the books are old.`, s);
      return;
    }
    if (!itemCount('grimoire')) { await say(L, `You're the one from the camp. …Thank you. I mean it. But I travel alone.`, s); return; }
    await talk([
      [L, `You. From the camp.`, s],
      [null, 'You set the grimoire on the table between you. Her hand goes to it before she can stop herself.'],
      [L, `…My mother's. The goblins tore the clasp off, but it's all here. You carried this all the way back?`, s],
      [L, `I ran from you at the camp. I'm sorry. The last time I trusted someone who came to save me, it didn't end well.`, s],
      [L, `You're going east, aren't you? Toward the war.`, s]
    ]);
    removeItem('grimoire');
    const c = await ask(L, `Then I'd like to go with you. If you'll have me.`, ['Travel together.', 'I\'m better alone.'], s, false);
    if (c === 0) { joinParty('lyra', 'Lyra'); await say(L, `Then I'll watch your back. Try to watch mine.`, s); }
    else { G.flags['bench_lyra'] = { cls: 'lyra', name: 'Lyra', lvl: Math.max(heroLevel(), 3), xp: 0, hp: 1, mp: 1, equip: { weapon: 'ostaff', armor: 'tunic' } }; await say(L, `I understand that better than you'd think. If you change your mind, I'll be here.`, s); }
  },

  // ================================================================ IRONHOLD
  async garrick() {
    const N = 'Garrick', s = 'garrick';
    await talk([
      [N, `Stop there. The mine is sealed. Nobody goes down.`, s],
      [N, `Three weeks ago the Ashborn broke into the deep tunnels and woke the Warden, the stone guardian our ancestors built. My brother Dunstan was down there when it happened.`, s]
    ]);
    if (has('lyra')) await say('Lyra', `We have to get east. The mine is the only road left.`, 'lyra');
    G.flags.garrickMet = true;
    if (!INTRO()) {
      await talk([
        [hero(), `Then let us through. And if your brother is down there, we'll look for him with you.`, 'hero'],
        [N, `…You'd do that for a stranger's brother? Hah. Fine. You're going to get yourself killed, so you might as well have a shield in front of you.`, s]
      ]);
      G.flags.mineOpen = true;
      joinParty('garrick', 'Garrick');
      await say(N, `Stock up at Olga's and get some rest at the Deep Hearth. The mine is dark, and it's long.`, s);
      return;
    }
    await talk([
      [hero(), `I need to go east.`, 'hero'],
      [N, `Everybody needs something. I don't know you. You don't talk much, and people who don't talk much make me nervous.`, s],
      [N, `If you want through that gate, show me you can survive what's down there. The practice yard is right here. Stand against me.`, s]
    ]);
    await STORY.garrickDuel();
  },
  async garrickDuel() {
    const N = 'Garrick', s = 'garrick';
    if (!(await confirm(N, `A duel. First to drop yields. Ready?`, s))) { await say(N, `Come back when you are.`, s); return; }
    const res = await startBattle(['duel'], { bg: 'village', spar: true, intro: 'Garrick raises his shield.' });
    healParty();
    if (res !== 'win') { await say(N, `Not yet. Get stronger and come find me. I'm not going anywhere.`, s); return; }
    G.flags.mineOpen = true;
    await talk([
      [N, `…Hah. Well. You don't talk much, but you hit like you mean it.`, s],
      [N, `The gate's yours. And if you'd have an old dwarf at your side down there, I'd like to look for my brother.`, s]
    ]);
    const c = await ask(N, `What do you say?`, ['Come with me.', 'I\'ll go alone.'], s, false);
    if (c === 0) { joinParty('garrick', 'Garrick'); await say(N, `Good. Stay behind the shield.`, s); }
    else { G.flags.garrickWaits = true; G.flags['bench_garrick'] = { cls: 'garrick', name: 'Garrick', lvl: Math.max(heroLevel(), 7), xp: 0, hp: 1, mp: 1, equip: { weapon: 'axe1', armor: 'tunic' } }; await say(N, `Suit yourself. You'll find me at the Deep Hearth if you change your mind.`, s); }
  },
  async garrickTavern() {
    const N = 'Garrick', s = 'garrick';
    if (await confirm(N, `Back again. Want the shield in front of you?`, s)) { joinParty('garrick', 'Garrick'); await say(N, `Then let's get moving.`, s); }
    else await say(N, `I'll be here, making this ale disappear.`, s);
  },
  async mineGuard() {
    if (G.flags.garrickMet && !G.flags.mineOpen) { await STORY.garrickDuel(); return; }
    await say('Dwarf Sentry', `Mine's sealed by order of the Hold. Talk to Garrick. It's his brother down there.`, 'dwarf');
  },
  async shopIronhold() { await shopScene('ironhold', 'Olga', 'shop'); },
  async smith() {
    const N = 'Smith Haldor', s = 'smith';
    if (G.ending && !G.flags.otherForged) {
      const id = G.heroClass === 'mage' ? 'otherstaff' : 'otherblade';
      await say(N, `Otherworlder. You carry something that doesn't belong to this world. I can feel it on you like heat off a forge.`, s);
      await say(N, `Let me work it into a ${G.heroClass === 'mage' ? 'staff' : 'blade'}. Materials will cost 2500 G. The work I'd do for free.`, s);
      if (G.gold < 2500) { await say(N, `Come back when you have the coin.`, s); return; }
      if (!(await confirm(N, `Pay 2500 G?`, s))) return;
      G.gold -= 2500; G.flags.otherForged = true;
      await fadeOut(0.4); Sound.sfx('crash'); await wait(0.9); await fadeIn(0.4);
      addItem(id); Sound.sfx('levelup');
      await say(null, `Received the ${ITEMS[id].name}.`);
      await say(N, `When I quenched it I heard something. Like a crowd, far away, and a bell. …Keep it close.`, s);
      return;
    }
    await say(N, pick([`Olga sells my work up front. Steel, chain, the good stuff.`, `Without ore from the mine, I'm melting down horseshoes. That's how bad it is.`, `A blade is only as good as the arm swinging it.`]), s);
  },
  async dwarfTalk() {
    await say('Dwarf', stage() === 4 ? byEnd({ door: `The Ashborn tried the mine again last week. We drove them off. For now.`, deal: `An Ashborn trader bought three carts of iron today. Paid fair, too. Strange times.`, purge: `The mine's open, the ore's flowing, and nobody's coming out of the east ever again. Good for business.` }) : pick([`Garrick's been standing at that gate for three weeks. Won't sleep, won't eat.`, `The Warden was built to guard the deep vaults. If it's awake, something woke it.`]), 'dwarf');
  },
  async dwarfTalk2() { await say('Old Miner', pick([`Fire does nothing to the Warden. Stone doesn't burn. Lightning, though. Lightning splits rock.`, `Beyond the mine are the Ashen Wastes. There's a camp at the edge, if it's still standing.`]), 'dwarf'); },
  async kidIronhold() { await say('Dwarf Child', pick([`My uncle went into the mine and didn't come out.`, `Are the Ashborn going to come here too?`]), 'kid'); },
  async patronI() { await say('Miner', pick([`To the Warden. May it sleep again.`, `Garrick's brother Dunstan owed me six silver. I'd forgive it if he walked through that door.`]), 'dwarf'); },
  async ashbornTavern() { await say('Ashborn Traveller', `The dwarves serve me now. Slowly, and with a lot of staring. But they serve me. My grandmother would not believe it.`, 'demonf'); },

  // ================================================================ OLD MINE
  async golem() {
    await say(null, 'A colossus of carved stone blocks the tunnel. Blue runes flare across its chest as you approach.');
    if (has('garrick')) await say('Garrick', `The Warden. Our ancestors built it to guard these halls. Someone has burned Ashborn sigils into it. It doesn't know friend from foe anymore.`, 'garrick');
    if (!(await confirm(null, 'The Warden turns towards you. Fight?'))) return;
    const res = await startBattle(['golem'], { bg: 'cave' });
    if (res !== 'win') return;
    G.flags.golem = true;
    await say(null, 'The Warden\'s runes gutter and die. It kneels, slowly, as if it were tired, and is still.');
    await talk(has('garrick') ? [
      ['Garrick', `…There. Scratched into the wall behind it. "Dunstan passed. Gone east. Don't follow."`, 'garrick'],
      ['Garrick', `Idiot. He's alive. And of course I'm following.`, 'garrick']
    ] : [[null, 'Scratched into the wall behind it: "Dunstan passed. Gone east."']]);
    toast('The road to the Ashen Wastes is open.', UI.gold);
  },

  // ================================================================ ASHEN WASTES
  async shopCamp() {
    if (!G.flags.metDunstan && has('garrick')) {
      G.flags.metDunstan = true;
      await talk([
        ['Merchant', `Garrick? You stubborn…! I left a message! I carved "don't follow" into a wall!`, 'merchant'],
        ['Garrick', `…Dunstan.`, 'garrick'],
        [null, 'Garrick crosses the camp in four strides and pulls his brother into a crushing embrace. Neither of them says anything for a while.'],
        ['Dunstan', `I got out past the Warden when it woke. Couldn't go back. So I came here and started trading with anyone who came through. Even Ashborn deserters.`, 'merchant'],
        ['Dunstan', `Take these. Don't argue. You came all this way for me.`, 'merchant']
      ]);
      addItem('phoenix', 2); addItem('hipotion', 3); Sound.sfx('chest');
      await say(null, 'Received 2 Phoenix Downs and 3 Hi-Potions.');
    }
    await shopScene(G.ending === 'deal' ? 'ember' : 'camp', G.flags.metDunstan ? 'Dunstan' : 'Merchant', 'merchant');
  },
  async healer() {
    if (stage() === 3) await say('Healer Sera', `The castle is north-east, past the lava fields. Rest before you go. Nobody should walk into that place tired.`, 'healer');
    await innScene('Healer Sera', 'healer', true);
  },
  async varek() {
    const N = 'Varek', s = 'varek';
    if (!G.flags.metVarek) {
      G.flags.metVarek = true;
      await talk([
        [N, `Put the weapon down, human. I'm not here to fight. I'm here because I stopped fighting.`, s],
        [N, `I was a soldier of the Ashborn. Six raids. On the seventh, they told us to burn a farm with a family still inside it. I walked into the Wastes instead.`, s],
        [N, `Do you know what the Wastes are? Three hundred years ago your Accord of Dawn drove my people there. Nothing grows. We eat what the ash leaves us.`, s],
        [N, `Malgrath is not a good king. But he is a desperate one, and so are we. Remember that, when you stand in front of him.`, s]
      ]);
      return;
    }
    await say(N, pick([`There's a village beyond the castle. Emberhollow. My sister lives there with her daughter. If the war comes to it…`, `The goddess chose your side three hundred years ago. Did she tell you that?`]), s);
  },
  async nyx() {
    await say('Nyx', pick([`Mama says the treaty means we can plant things. Real things. Not just ash-root.`, `Are you the one who talked to the king? Thank you. I don't know what you said, but thank you.`, `I planted a seed yesterday. Nothing yet. Mama says that's normal.`]), 'nyx');
  },
  async nyxMother() { await say('Ashborn Mother', `My brother Varek told me about you. That you listened. We are building a village by the river where the Wastes meet the green. My daughter will grow up there.`, 'demonf'); },
  async emberTrader() { await say('Ashborn Trader', `Welcome to Emberhollow's market stall. The first honest trade between our peoples in three centuries. Dunstan sells my goods. I sell his.`, 'demonm'); },

  // ================================================================ CASTLE VHARN
  async king() { await say('Malgrath', `…`, 'king'); },
  async kingDeal() {
    await say('Malgrath', pick([`The treaty holds. My people plant crops by the river. I have not seen that in my lifetime.`, `Your kings send envoys who hate me. Mine hate them back. And yet no one has died. You did that.`, `You could have ended me. I think about that more than you'd guess.`]), 'king');
  }
};

// ---------------------------------------------------------------- goblin camp
async function chiefEvent() {
  if (G.flags.chief) return;
  const L = 'Lyra', C = 'Goblin Chief';
  if (!G.flags.sawCamp) {
    G.flags.sawCamp = true;
    await talk([
      [C, `A human. Alone. Walking into my camp.`, 'chief'],
      [L, `Whoever you are, you shouldn't be here. They'll sell you too.`, 'lyra'],
      [C, `The Ashborn pay double for elves. I wonder what they'll pay for whatever you are.`, 'chief']
    ]);
  }
  if (!(await confirm(null, `Cut the elf free and fight the Goblin Chief? (Suggested level: ${INTRO() ? '5' : '4'}+)`))) {
    await say(L, `Go. Get stronger. …And please come back.`, 'lyra');
    return;
  }
  await say(null, `You slash through the ropes holding the elf.`);
  let group = ['goblin', 'chief'];
  if (!INTRO()) {
    await say(L, `Thank you. I'm Lyra. Now let me return the favour.`, 'lyra');
    joinParty('lyra', 'Lyra');
  } else {
    await say(L, `…I can manage from here.`, 'lyra');
    await say(null, 'Before you can speak, the elf is gone, vanishing into the trees. The chief laughs and raises his club. You face him alone.');
    group = ['chief'];
  }
  const res = await startBattle(group, { bg: 'forest' });
  if (res !== 'win') return;
  G.flags.chief = true;
  World.refreshNpcs(true);
  if (!INTRO()) {
    await talk([
      [null, `The surviving goblins scatter into the trees.`],
      [L, `The Ashborn pay goblins to take elves. Something about our magic. I don't want to know what they do with it.`, 'lyra'],
      [hero(), `The old man in Aldmere says I came from another world. A goddess sent me. I died, and I woke up here.`, 'hero'],
      [L, `An Otherworlder. The chronicles say the goddess only sends them when the Kingdom is about to fall.`, 'lyra'],
      [L, `You saved my life. I'm coming with you. North is Ironhold, the dwarf town. The only road east is under the mountain.`, 'lyra']
    ]);
  } else {
    await say(null, 'Among the chief\'s hoard you find a leather spellbook with a torn clasp. The elf\'s, surely.');
    addItem('grimoire'); G.flags.lyraWaits = true;
    await say(null, 'Perhaps someone in Aldmere has seen her.');
  }
  toast('The road north to Ironhold is open.', UI.gold);
}

// ---------------------------------------------------------------- companions talk
async function companionTalk(f) {
  const m = f.m, act = f.act, L = 'Lyra', Gk = 'Garrick';
  let lines;
  if (m.cls === 'lyra') lines = {
    book: [`This history says the Ashborn farmed the valley where Aldmere stands. That isn't in the version they teach children.`, `Listen: "And the Dawn drove the Ash from the green places, and the goddess smiled." …She smiled.`],
    display: [`I used to want a ring like this. Before. It doesn't matter now.`, `Look at the craftsmanship. Someone loved making this.`],
    fire: [`My mother used to say fire is the only magic everyone knows.`, `Sit a moment. We don't get many of these.`],
    door: [`I'll watch the door. Old habit, since the camp.`],
    bar: [`Elves aren't supposed to like ale. I've decided I'm an exception.`],
    sit: [`My feet hurt. Don't tell anyone.`]
  }[act];
  else lines = {
    book: [`Bah. Letters. Give me a good rune any day.`],
    display: [`Good steel. Bad price.`, `My brother would haggle this down to half. He always could.`],
    fire: [`Dwarves say a hearth is a promise. Somebody will always come back to it.`],
    door: [`I'll keep watch. Somebody should.`, `Take your time. I'm not going anywhere.`],
    bar: [`One more and then we go. …Two more.`],
    sit: [`Rest your legs. The road's long.`]
  }[act];
  if (!lines) lines = m.cls === 'lyra'
    ? [[`We should keep moving.`], [`Something about this place makes me uneasy.`]][stage() % 2]
    : [[`Lead on.`], [`Stay behind the shield.`]][stage() % 2];
  await say(m.name, pick(lines), m.cls);
}

// ---------------------------------------------------------------- the boss door
async function bossDoor() {
  if (G.flags.doorOpen) return;
  await say(null, 'A great door of black iron, sealed with a burning sigil. Behind it, you can feel something waiting. It has been waiting a long time.');
  if (has('lyra') || has('garrick')) await say(has('lyra') ? 'Lyra' : 'Garrick', has('lyra') ? `Whatever you decide, I'm with you.` : `Your call. I'll follow.`, has('lyra') ? 'lyra' : 'garrick');
  const c = await ask(null, 'Open the door and face Malgrath?', ['Open the door.', 'Turn away.'], null, false);
  if (c === 0) {
    const sure = await ask(null, 'WARNING: If you fall in this battle, your journey ends. Your save file will be permanently erased, on this device and in the cloud. There is no retry.', ['I understand. Open it.', 'Not yet.'], null, false);
    if (sure !== 0) return;
    await enterThrone();
    return;
  }
  if (G.ending === 'door') { await say(null, 'You turn away again. The door stays shut.'); return; }
  const end = await ask(null, 'Turn your back on the door for good? The story ends here: Malgrath lives, the war goes on, and the land will be harder for it.', ['Walk away.', 'Stay.'], null, false);
  if (end === 0) await endingDoor();
}

async function enterThrone() {
  Sound.stop(); Sound.sfx('dark');
  await fadeOut(1.0);
  G.flags.doorOpen = true;
  World.load('castle', 12, 12, 'up');
  Sound.play('dark');
  await fadeIn(1.0);
  const N = 'Malgrath', s = 'king';
  await talk([
    [N, `So. She sent another one.`, s],
    [N, `Do you know how many Otherworlders the goddess has thrown at my people, ${hero()}? You are the twelfth. Twelve souls, torn from their worlds and pointed at the Ashborn like arrows.`, s],
    [N, `Did she tell you what the Accord of Dawn was? Your chronicles call it a victory. My grandmother called it the Burning. Three hundred years in the Wastes. Children born to ash.`, s],
    [N, `I am not asking for your pity. I am telling you what you are about to fight. Not a monster. A king whose people are starving.`, s]
  ]);
  if (has('lyra')) await say('Lyra', `…Varek said the same thing.`, 'lyra');
  if (has('garrick')) await say('Garrick', `Your soldiers burned half the villages east of Ironhold.`, 'garrick');
  await say(N, `Yes. They did. And I will not apologise for wanting to live. Come, then, Otherworlder.`, s);
  G.flags.noSave = false;
  const res = await startBattle(['king'], { bg: 'castle', music: 'boss', permadeath: true, keepDark: true });
  if (res === 'lose') return;
  G.flags.kingDone = true;
  if (res === 'deal') await endingDeal();
  else await endingPurge();
}

// ---------------------------------------------------------------- map entry triggers
async function onEnterMap(id) {
  const first = !G.flags['v_' + id];
  G.flags['v_' + id] = true;
  if (!first) return;
  if (id === 'konbini') await say(null, 'The door chimes. Bright lights, a hum of fridges, the smell of fried chicken.');
  if (id === 'forest' && stage() === 0) await say(null, 'Whisperwood. Fresh tracks lead off to the north-east: small, clawed feet, and one pair of boots being dragged.');
  if (id === 'ironhold' && has('lyra')) await say('Lyra', `Ironhold. Everyone's watching that gate to the north. Something's wrong.`, 'lyra');
  if (id === 'mine' && has('garrick')) await say('Garrick', `Stay close. The Warden sleeps at the far eastern end. Everything between here and there wants us dead.`, 'garrick');
  if (id === 'wastes' && stage() === 3) {
    await say(null, 'The air tastes of smoke. The ground is grey to the horizon. Far to the north-east, a black castle stands against a red sky.');
    if (has('lyra')) await say('Lyra', `There's a campfire to the west of the road. We should stop there before we go anywhere near that castle.`, 'lyra');
  }
  if (id === 'castle' && stage() === 3) { Sound.sfx('dark'); await say(null, 'Castle Vharn. The great hall runs north to a sealed iron door. You can feel the heat of it from here.'); }
}

// ---------------------------------------------------------------- Tokyo: the crossing
class CrossingOverlay {
  constructor() { this.transparent = true; this.lights = null; this.white = 0; }
  update() { }
  draw() {
    if (this.lights !== null) {
      const x = this.lights, y = 15.5 * TS - World.camY;
      const sx = x * TS - World.camX;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0c0a12'; ctx.fillRect(sx, y - 58, 180, 96);
      ctx.fillStyle = '#16141e'; ctx.fillRect(sx - 4, y - 30, 60, 68);
      for (const dy of [-10, 22]) glow(sx - 6, y + dy, 70, 'rgba(255,248,220,.9)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,245,210,.18)';
      ctx.beginPath(); ctx.moveTo(sx - 6, y - 20); ctx.lineTo(sx - 360, y - 90); ctx.lineTo(sx - 360, y + 120); ctx.lineTo(sx - 6, y + 32); ctx.fill(); ctx.restore();
    }
    if (this.white > 0) { ctx.globalAlpha = this.white; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
}
async function crossingCutscene() {
  const p = World.player;
  p.dir = 'down';
  await say(null, 'Your phone buzzes.');
  await talk([
    ['Mei (phone)', `Where are youuu? Mum made curry. And Dad's home early.`, null],
    [hero(), `Two minutes. I'm at the crossing. I've got the cake.`, 'hero'],
    ['Mei (phone)', `The strawberry one? …Okay. Hurry. I'm not blowing out the candles without you.`, null]
  ]);
  Sound.stop();
  await wait(0.6);
  G.flags.crossing = true; World.refreshNpcs(true);
  const girl = World.npcs.find(n => n.id === 'girlchild');
  await say(null, 'The light turns green. On the far side of the road, a little girl in a yellow raincoat is chasing a runaway ball.');
  // she steps into the road
  for (const [x, y] of [[32, 17], [31, 17], [31, 16]]) { girl.fx = girl.x; girl.fy = girl.y; girl.x = x; girl.y = y; girl.t = 0; await wait(0.36); }
  girl.dir = 'down';
  const ov = new CrossingOverlay(); Scenes.push(ov);
  ov.lights = 46;
  await say(null, 'Then the light changes. Headlights come around the corner, too fast. She doesn\'t see them.');
  tween(ov, { lights: 36 }, 1.4);
  await say(null, 'You don\'t decide to move. You\'re already moving.');
  // run into the road
  for (const [x, y] of [[30, 14], [30, 15], [31, 15]]) { p.fx = p.x; p.fy = p.y; p.x = x; p.y = y; p.t = 0; p.dir = y > p.fy ? 'down' : 'right'; await wait(0.14); }
  girl.fx = girl.x; girl.fy = girl.y; girl.x = 32; girl.y = 18; girl.t = 0; girl.dir = 'up';
  await tween(ov, { lights: 31.4 }, 0.35, easeIn);
  Sound.sfx('crash');
  ov.white = 1;
  await wait(0.2);
  Scenes.remove(ov);
  await fadeOut(0.01, '#ffffff');
  await wait(1.4);
  G.flags.crossing = false;
  await voidSequence();   // main.js: the goddess, the quiz, your class
}

// ---------------------------------------------------------------- endings
async function endingDoor() {
  Sound.stop();
  await fadeOut(1.2);
  G.ending = 'door'; G.postgame = true; G.flags.end_door = true;
  await epilogue('door', [
    'You walk back down the great hall, and the door stays shut behind you.',
    'Malgrath does not come after you. Perhaps he expected it. Perhaps he is disappointed.',
    'The war goes on. Raiders strike the eastern roads, and the militias strike back, and every month there are new graves on both sides of the border.',
    'The chronicles will not remember the Otherworlder who turned away.',
    'But you are still here. And there are people who still need help.'
  ]);
  await afterEnding('village', 16, 8);
}
async function endingDeal() {
  const N = 'Malgrath', s = 'king';
  Sound.stop(); Sound.play('ending');
  await talk([
    [N, `…You would take my word. After everything.`, s],
    [hero(), `I'm not doing it for you. I'm doing it so no one else has to die for a war that started three hundred years before either of us.`, 'hero'],
    [N, `Then we are agreed. The Wastes for the Ashborn, under treaty. My soldiers go home tonight.`, s],
    [N, `Your kings will call you a traitor, Otherworlder. Mine will call me a coward. Perhaps that is how you know it is a fair deal.`, s]
  ]);
  if (has('lyra')) await say('Lyra', `I think… this is the first time an Otherworlder has ended a war without ending a people.`, 'lyra');
  if (has('garrick')) await say('Garrick', `Dunstan's going to want to trade with them. I just know it.`, 'garrick');
  G.ending = 'deal'; G.postgame = true; G.flags.end_deal = true; G.flags.doorOpen = true;
  await fadeOut(1.2);
  await epilogue('deal', [
    'The Treaty of Ash is signed at Ironhold, on neutral stone, before the kings of Eldoria and the King of the Ashborn.',
    'It is not a happy peace. Men who lost sons spit at Ashborn envoys. Ashborn who lost everything spit back.',
    'But at the edge of the Wastes, where the grey meets the green, the Ashborn build a village by the river and call it Emberhollow.',
    'A little girl named Nyx plants the first seed.',
    'Nobody is sure yet whether it will grow.'
  ]);
  await afterEnding('wastes', 12, 13);
}
async function endingPurge() {
  const N = 'Malgrath', s = 'king';
  Sound.stop();
  await talk([
    [N, `…So. That is your answer.`, s],
    [N, `Then listen, Otherworlder. When your kings march into the Wastes, and they will, remember that you could have stopped them.`, s],
    [N, `There are children in Emberhollow…`, s]
  ]);
  await say(null, 'Malgrath does not finish. He is still.');
  if (has('lyra')) await say('Lyra', `…It's over. It's really over.`, 'lyra');
  G.ending = 'purge'; G.postgame = true; G.flags.end_purge = true; G.flags.doorOpen = true;
  await fadeOut(1.4);
  await epilogue('purge', [
    'With Malgrath dead, the Ashborn armies break. The kings of Eldoria march into the Wastes to make sure the war can never return.',
    'They are thorough.'
  ], true);
  await burningVillage();
  await epilogue('purge', [
    'In Aldmere, and Ironhold, and a hundred villages like them, there are bells and bonfires. The Otherworlder\'s name is sung in every tavern.',
    'No one sings about Emberhollow.',
    'The Wastes are empty now. The land is safe.',
    'You are still here.'
  ], true);
  await afterEnding('village', 16, 8);
}

class EpilogueScene {
  constructor(lines, kind) { this.lines = lines; this.i = 0; this.t = 0; this.kind = kind; this.promise = new Promise(r => this.resolve = r); }
  update(dt) {
    this.t += dt;
    if (this.t > 0.8 && Input.pressed('ok')) {
      Sound.sfx('cursor'); this.i++; this.t = 0;
      if (this.i >= this.lines.length) { this.resolve(); }
    }
  }
  draw() {
    const bg = { door: '#0e0a14', deal: '#10140e', purge: '#140808' }[this.kind];
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = hash2(i, 4) % W, y = (hash2(i, 9) % H + TIME * (6 + i % 4 * 3)) % H; ctx.globalAlpha = 0.35; ctx.fillStyle = this.kind === 'purge' ? '#f07a2a' : this.kind === 'deal' ? '#bfe6a0' : '#8a88c0'; ctx.fillRect(W - x, H - y, 2, 2); }
    ctx.globalAlpha = 1;
    const l = this.lines[Math.min(this.i, this.lines.length - 1)];
    ctx.globalAlpha = Math.min(1, this.t * 1.5);
    const ls = wrap(l, 520, 18);
    ls.forEach((s, k) => text(s, W / 2, H / 2 - ls.length * 14 + k * 28, UI.paper, 18, 'center', false));
    ctx.globalAlpha = 1;
    if (this.t > 0.8) text('▼', W / 2, H - 50, UI.dim, 14, 'center');
  }
}
async function epilogue(kind, lines, quiet) {
  if (!quiet && Sound.trackName !== 'ending') { Sound.stop(); Sound.play('ending'); }
  if (quiet) { Sound.stop(); Sound.play('dark'); }
  const e = new EpilogueScene(lines, kind);
  Scenes.push(e);
  await fadeIn(1.0);
  await e.promise;
  await fadeOut(1.0);
  Scenes.remove(e);
}

// the purge ending: a little Ashborn girl watches Emberhollow burn
class BurningVillageScene {
  constructor() { this.t = 0; this.promise = new Promise(r => this.resolve = r); this.embers = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(200, H), v: rand(20, 60), s: rand(0, 9) })); }
  update(dt) {
    this.t += dt;
    for (const e of this.embers) { e.y -= e.v * dt; e.x += Math.sin(this.t + e.s) * 12 * dt; if (e.y < 0) { e.y = H; e.x = rand(0, W); } }
    if (this.t > 5 && Input.pressed('ok')) this.resolve();
  }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0206'); g.addColorStop(0.55, '#5a140a'); g.addColorStop(1, '#1a0604');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // smoke
    for (let i = 0; i < 8; i++) { ctx.globalAlpha = 0.18; ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.ellipse(120 + i * 60 + Math.sin(this.t * 0.3 + i) * 20, 120 - i * 6 - this.t * 3 % 40, 90, 40, 0, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // the village below, burning
    const base = 330;
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 68, w = 44 + (i % 3) * 10, h = 30 + (i % 2) * 14;
      ctx.fillStyle = '#0e0606'; ctx.fillRect(x, base - h, w, h);
      ctx.beginPath(); ctx.moveTo(x - 6, base - h); ctx.lineTo(x + w / 2, base - h - 24); ctx.lineTo(x + w + 6, base - h); ctx.fill();
      const fl = Math.sin(this.t * 8 + i * 2) * 6;
      glow(x + w / 2, base - h - 10, 60 + fl, 'rgba(255,120,30,.55)');
      ctx.fillStyle = '#f2a03a'; ctx.beginPath(); ctx.moveTo(x + 4, base - h); ctx.quadraticCurveTo(x + w / 2, base - h - 44 - fl, x + w - 4, base - h); ctx.fill();
      ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.moveTo(x + 12, base - h); ctx.quadraticCurveTo(x + w / 2, base - h - 22 + fl, x + w - 12, base - h); ctx.fill();
    }
    // torches of soldiers
    for (let i = 0; i < 12; i++) { const x = 60 + i * 46 + Math.sin(this.t * 0.6 + i) * 6, y = base + 18 + (i % 3) * 6; ctx.fillStyle = '#0a0404'; ctx.fillRect(x, y - 10, 3, 12); glow(x + 1, y - 12, 10, 'rgba(255,190,80,.8)'); }
    // the ridge
    ctx.fillStyle = '#060203'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 400); ctx.quadraticCurveTo(200, 360, 360, 392); ctx.quadraticCurveTo(520, 420, W, 404); ctx.lineTo(W, H); ctx.fill();
    // the girl, seen from behind, holding a doll
    const img = charSprite('nyx', 'up', 0);
    ctx.drawImage(img, 206, 312, 96, 96);
    for (const e of this.embers) { ctx.globalAlpha = 0.8; ctx.fillStyle = e.s > 4.5 ? '#f2c94c' : '#f07a2a'; ctx.fillRect(e.x, e.y, 2, 2); }
    ctx.globalAlpha = 1;
    if (this.t > 2) { ctx.globalAlpha = Math.min(1, (this.t - 2) / 2); text('Emberhollow', W / 2, 40, '#e8b8a0', 20, 'center'); ctx.globalAlpha = 1; }
    if (this.t > 5) text('▼', W / 2, H - 30, '#8a6a60', 14, 'center');
  }
}
async function burningVillage() {
  Sound.stop();
  const s = new BurningVillageScene();
  Scenes.push(s);
  await fadeIn(2.0);
  await s.promise;
  await fadeOut(1.6);
  Scenes.remove(s);
}

async function afterEnding(map, x, y) {
  await rollCredits(G.ending);
  World.load(map, x, y, 'down');
  World.syncFollowers();
  saveGame();
  await fadeIn(0.8);
  toast('Game saved.', UI.hp);
  await say(null, byEnd({
    door: 'The war continues. Ashborn raiders now roam every road, and the quest board is full of requests to hold them back. The sealed door in Castle Vharn is still there, if you ever change your mind.',
    deal: 'The border must be kept. The quest board now carries peacekeeping work, and requests from Ashborn settlers in Emberhollow.',
    purge: 'The Ashborn are gone. The quest board still has work: beasts, bandits, the ordinary troubles of a land at peace.'
  }));
  await say(null, 'Monsters everywhere now grow with your party. The smith in Ironhold may have something to offer you.');
}

class CreditsScene {
  constructor(ending) {
    this.y = H + 20; this.done = false;
    this.promise = new Promise(r => this.resolve = r);
    const title = { door: 'ENDING I — THE DOOR LEFT CLOSED', deal: 'ENDING II — THE TREATY OF ASH', purge: 'ENDING III — DAWN WITHOUT MERCY' }[ending];
    this.lines = [
      [title, UI.gold, 22], ['', 0, 30],
      ['I GOT ISEKAI\'D', UI.sakura, 26], ['The Video Game', UI.paper, 18], ['', 0, 30],
      ['Starring', UI.dim, 14], [G.name + ', the Otherworlder', UI.paper, 17],
      ...(G.party.some(m => m.cls === 'lyra') ? [['Lyra, of the western woods', UI.paper, 17]] : []),
      ...(G.party.some(m => m.cls === 'garrick') ? [['Garrick, son of Ironhold', UI.paper, 17]] : []),
      ['Malgrath, King of the Ashborn', UI.paper, 17], ['', 0, 16],
      ['Mei, who waited', UI.dim, 15], ['', 0, 30],
      ['Created by', UI.dim, 14], ['Kundai', UI.paper, 18], ['', 0, 30],
      ['Playtime ' + fmtTime(G.playTime) + '   ·   Enemies defeated ' + G.kills, UI.dim, 15], ['', 0, 40],
      ['Thank you for playing.', UI.gold, 20], ['', 0, 20], ['The journey continues.', UI.dim, 15]
    ];
    this.total = this.lines.reduce((a, l) => a + l[2] + 16, 0);
  }
  update(dt) {
    const fast = Input.held('ok') ? 4 : 1;
    this.y -= dt * 32 * fast;
    if (this.y + this.total < H / 2 - 40) {
      this.y = H / 2 - 40 - this.total; this.done = true;
      if (Input.pressed('ok')) { Sound.sfx('ok'); this.resolve(); }
    }
  }
  draw() {
    ctx.fillStyle = '#07051a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { const x = hash2(i, 3) % W, y = hash2(i, 7) % H; ctx.fillStyle = Math.sin(TIME * 2 + i) > 0.6 ? '#fff' : '#6a6aa0'; ctx.fillRect(x, y, 2, 2); }
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

// ---------------------------------------------------------------- game over & permadeath
class GameOverScene {
  constructor(final) {
    this.final = final; this.sel = 0; this.t = 0;
    this.promise = new Promise(r => this.resolve = r);
    this.opts = final ? ['Return to title'] : [hasSave() ? 'Load last save' : 'Try again', 'Title screen'];
  }
  update(dt) {
    this.t += dt;
    if (this.t < 1.2) return;
    if (this.opts.length > 1 && (Input.pressed('up') || Input.pressed('down'))) { this.sel ^= 1; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) { Sound.sfx('ok'); this.resolve(this.sel); }
  }
  draw() {
    ctx.fillStyle = '#0a0308'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 360);
    g.addColorStop(0, 'rgba(120,10,30,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (this.final) {
      text('YOUR JOURNEY HAS ENDED', W / 2, 120, UI.bad, 30, 'center');
      text('You fell before Malgrath.', W / 2, 180, UI.paper, 16, 'center', false);
      text('Your save file has been erased.', W / 2, 206, UI.dim, 15, 'center', false);
    } else {
      text('GAME OVER', W / 2, 130, UI.bad, 44, 'center');
      text('Not yet. Not like this.', W / 2, 196, UI.dim, 15, 'center', false);
    }
    if (this.t < 1.2) return;
    this.opts.forEach((o, i) => {
      text(o, W / 2, 290 + i * 36, i === this.sel ? UI.paper : UI.dim, 18, 'center');
      if (i === this.sel) drawCursor(W / 2 - textWidth(o, 18) / 2 - 26, 292 + i * 36);
    });
  }
}
async function gameOver() {
  Sound.stop(); Sound.play('gameover');
  const s = new GameOverScene(false);
  Scenes.push(s);
  await fadeIn(0.8);
  const c = await s.promise;
  await fadeOut(0.5);
  Sound.stop();
  if (c === 0 && loadGame()) { startWorld(); await fadeIn(0.5); return; }
  if (c === 0) { healParty(); startWorld(); await fadeIn(0.5); return; }
  goTitle();
}
async function finalDeath(reason) {
  Sound.stop(); Sound.play('gameover');
  await wipeSave();
  G.flags.noSave = true;
  const s = new GameOverScene(true);
  if (reason) s.reason = reason;
  Scenes.push(s);
  await fadeIn(1.2);
  await s.promise;
  await fadeOut(0.8);
  G = null;
  goTitle();
}
