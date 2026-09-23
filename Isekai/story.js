// =====================================================================
//  story.js : Tokyo, the crossing, the childhood of House Valen, the war
//  with the Ashborn, the companions, the Rift, and the endings
// =====================================================================
function hero() { return G.name; }
function has(cls) { return inParty(cls); }
// 0 see the king · 1 the goblins hold the north road · 2 the mine and the Warden
// 3 the Rift · 4 Castle Vharn · 5 after an ending
function stage() {
  if (!G.flags.writ) return 0;
  if (!G.flags.chief) return 1;
  if (!G.flags.golem) return 2;
  if (!G.flags.throughRift) return 3;
  if (!G.ending) return 4;
  return 5;
}
function byEnd(o) { return o[G.ending] || o.door; }

function storyObjective() {
  if (G.map === 'tokyo' || G.map === 'konbini') {
    if (!G.flags.tk_aoi) return 'Talk to Aoi by the school gate.';
    if (!G.flags.tk_spar) return 'Daichi is waiting outside the kendo dojo for your last practice spar.';
    if (!G.flags.tk_cake) return 'Buy Mei\'s birthday cake at the Family Mart across the courtyard wall, to the east.';
    if (!G.flags.tk_shrine) return 'Mum asked you to make a wish for Mei at Kitazawa Shrine, in the north-east.';
    return 'Head home. Cross the road at the crosswalk by the vending machines.';
  }
  if (G.age === 'child') {
    if (!G.flags.trainBlade) return 'Master Corwin is waiting in the practice yard, west of the manor.';
    if (!G.flags.trainMagic) return 'Court Mage Isolde is waiting in the manor study, on the east side of the hall.';
    if (!G.flags.millDone) return 'Night. Something is happening down at the old mill. Follow the path north.';
    return 'Go back to the manor.';
  }
  switch (stage()) {
    case 0: return 'Your father\'s orders, from the capital: present yourself to King Aurel in Solmere and take the royal writ. The south road leaves Valenford.';
    case 1: return 'The goblins of Whisperwood hold the north road to Ironhold. Clear the camp — and there is an elf tied up in it.';
    case 2: return 'The dwarves of Ironhold keep the Dawnstone that seals the Rift, and the Warden in the Old Mine is sitting on it.';
    case 3: return 'You have the Dawnstone. Take the east road out of Whisperwood and walk to the Rift.';
    case 4: return 'Cross the Ashen Wastes to Castle Vharn. The sealed door of the throne room waits at the top of the great hall. (Suggested level: 18+)';
    default: return byEnd({
      door: 'You turned back at the Rift. The war goes on, and the quest boards are full. The Rift is still out there, east of Whisperwood.',
      deal: 'The Treaty of Ash holds, for now. Keep the peace: the quest boards have work on both sides of the Rift.',
      purge: 'The Ashborn are gone from the land. It is very quiet. The quest boards still have work.'
    });
  }
}

// ---------------------------------------------------------------- joining and parting
async function joinParty(id, startMorale) {
  if (partyFull()) {
    const others = G.party.slice(1);
    const items = others.map(m => ({
      label: m.name, right: moraleWord(moraleOf(m.cls)), color: moraleColour(moraleOf(m.cls)),
      desc: `Send ${m.name} back to ${COMPANIONS[m.cls].homeName}. ` + (moraleOf(m.cls) < 45 ? 'They are not happy with you. If you send them away now, they may not be there when you come back.' : 'They will wait for you there.')
    }));
    items.push({ label: 'Never mind', desc: 'Your party is full. Nobody leaves.' });
    const i = await list({ x: 196, y: 16, w: 428, items, title: `Your party is full (${PARTY_MAX}). Who goes home?`, rows: 5 });
    if (i < 0 || i >= others.length) return false;
    const m = others[i];
    if (!(await confirm(null, `Send ${m.name} home?`))) return false;
    await partWith(m);
  }
  const m = recruit(id, startMorale);
  World.syncFollowers();
  Sound.sfx('levelup');
  toast(`${COMPANIONS[id].name} joined the party (Lv ${m.lvl}). Turn timer: ${turnTime()}s.`, UI.gold);
  return true;
}
async function partWith(m) {
  const id = m.cls;
  addMorale(id, -20, true);
  const st = dismiss(m);
  G.flags[id + 'Gone'] = st === 'gone';
  G.flags[id + 'Waits'] = st === 'waiting';
  World.syncFollowers();
  if (st === 'gone') {
    await say(COMPANIONS[id].name, GONE_LINES[id] || `…Right. Don't come looking.`, 'c:' + id);
    toast(`${COMPANIONS[id].name} has left for good.`, UI.bad);
  } else {
    await say(COMPANIONS[id].name, WAIT_LINES[id] || `I'll be at ${COMPANIONS[id].homeName}. Come and find me.`, 'c:' + id);
    toast(`${COMPANIONS[id].name} is waiting at ${COMPANIONS[id].homeName}.`, UI.gold);
  }
}
const WAIT_LINES = {
  wren: `The stables, then. Don't leave it too long.`,
  lyra: `…All right. You know where I'll be.`,
  garrick: `Hmph. The Deep Hearth, then. Don't take too long.`,
  sable: `Gutter Rose. Mind who you drink with.`,
  oswin: `The chapel needs hands anyway. Go safely.`,
  kestrel: `I'll keep the lodge warm. Whistle when you need me.`,
  varek: `The camp, then. I am used to waiting in ash.`
};
const GONE_LINES = {
  wren: `No. I've stood in the dark waiting on you once already. Find someone else.`,
  lyra: `I ran from a camp once because I trusted the wrong person. I'm not doing this twice.`,
  garrick: `Second time you've put me down for somebody shinier. There won't be a third.`,
  sable: `See, this is why I don't do people. Good luck, my lord.`,
  oswin: `I forgive you. I am not coming back, but I do forgive you.`,
  kestrel: `I'm going home. Try not to get anyone killed out there.`,
  varek: `Of course. When you have no further use for the Ashborn, you send him into the ash.`
};

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
    await say(null, `TIP: Press ${Controls.label('menu')} to open the menu.`);
  },
  async tStudent() { await say('Student', pick(['Are you going to the festival next week?', 'I failed the maths quiz. Again.', 'The kendo club\'s still here? Don\'t they ever go home?']), 'student'); },
  async tStudent2() { await say('Student', 'I\'m waiting for my brother. He always takes forever.', 'aoi'); },
  async tSalary() { await say('Office Worker', pick(['Another late one. At least the sunset\'s nice.', 'Watch the crossing by the vending machines. Drivers take that corner too fast.']), 'salary'); },
  async tPriest() { await say('Priest', 'The shrine is open until dark. Make your wish from the heart, and the kami will hear it.', 'priest'); },
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
  },
  async tLeaveSchool() {
    if (G.flags.tk_spar) return;
    await say(null, G.flags.tk_aoi ? 'Daichi is still waiting at the dojo. You promised.' : 'Aoi is waving at you from by the gate.');
    const p = World.player; p.fx = p.x; p.fy = p.y; p.y -= 1; p.t = 0; p.dir = 'up';
  },
  async tCrossing() {
    if (!G.flags.tk_cake || !G.flags.tk_shrine) {
      await say(null, !G.flags.tk_cake ? 'You can\'t go home without Mei\'s cake.' : 'Mum asked you to stop at the shrine for Mei first.');
      const p = World.player; p.fx = p.x; p.fy = p.y; p.y -= 1; p.t = 0; p.dir = 'up';
      return;
    }
    await crossingCutscene();
  },

  // ================================================================ CHILDHOOD: HOUSE VALEN
  async nanny() {
    const N = 'Nanny Perrin', s = 'nanny';
    if (!G.flags.trainBlade) await say(N, `Yard first, little lord. Master Corwin has been sharpening things since dawn and it is making the maids nervous.`, s);
    else if (!G.flags.trainMagic) await say(N, `Now the study. Mage Isolde does not like waiting, and she has a way of letting you know it.`, s);
    else await say(N, `Both in one morning. Your mother will be unbearable at dinner.`, s);
  },
  async father() {
    const N = 'Lord Aldric Valen', s = 'father';
    if (G.age === 'child') {
      if (!G.flags.trainBlade && !G.flags.trainMagic) await say(N, `Today you start. One try at the blade, one try at the word. I do not want you good at everything. I want you honest about what you are.`, s);
      else if (G.flags.trainDone) await say(N, `Corwin says you have a strange sort of nerve. Isolde says something less flattering. Sleep. Tomorrow you start again.`, s);
      else await say(N, `Finish what you started. Then we eat.`, s);
      return;
    }
    if (!G.flags.questGiven) { await questGiven(); return; }
    if (stage() === 0) await say(N, `The capital, then Ironhold, then whatever waits behind the Rift. Send word at every town. Your mother counts the days, whatever she says.`, s);
    else if (stage() < 5) await say(N, pick([`House Valen is not the royal line. That means when we are asked, we go. That is the whole of it.`, `Your grandfather rode east in the last war. He came back with fewer men and more silence.`]), s);
    else await say(N, byEnd({
      door: `You came home. I am not going to pretend I am disappointed about that, whatever the heralds say.`,
      deal: `Half the court calls you a traitor and half of them call you a saint. Both halves are alive to do it.`,
      purge: `They have put your name on a war memorial in Solmere. You are standing in front of me and they have carved your name in stone.`
    }), s);
  },
  async mother() {
    const N = 'Lady Ysolde Valen', s = 'mother';
    if (G.age === 'child') { await say(N, pick([`Come here. Let me look at you. …Good. Go on, then.`, `Whatever Isolde says about the old words, remember that they are only words until someone means them.`]), s); return; }
    if (stage() === 0) await say(N, `Your father will give you a speech about duty. I will give you this instead: come back. That is my entire instruction.`, s);
    else await say(N, pick([`Eat properly. You look like a hedge.`, `I wrote to you twice. You have not written once. I am not angry, I am simply keeping count.`]), s);
    if (stage() === 0 && !itemCount('letter')) { addItem('letter'); await say(null, 'She presses an unfinished letter into your hand — one you started and never sent. "Finish it somewhere on the road."'); }
  },
  async courtmage() {
    const N = 'Court Mage Isolde', s = 'courtmage';
    if (G.age === 'child' && !G.flags.trainMagic) {
      if (!G.flags.trainBlade) { await say(N, `Yard first. I am not competing with Corwin for your morning.`, s); return; }
      await magicTraining();
      return;
    }
    if (G.age === 'child') { await say(N, `Runes are not spelling. They are agreements. Say one sloppily and it will hold you to it.`, s); return; }
    await say(N, pick([`The Rift is not a door. It is a tear. You do not open a tear — you decide whether to step through it.`, `Whatever the Dawn chronicles say, the Ashborn had cities before we had roads.`]), s);
  },
  async butler() { await say('Merrick', pick([`The hall was cold this morning, so I lit both fires. Your mother will complain about the wood.`, `Your bed is made, my lord. Whether you use it is another matter.`, `Someone has been at the pantry again. I suspect the stable girl.`]), 'butler'); },
  async maid() { await say('Tess', pick([`Careful on the carpet, I've just beaten it.`, `Wren's down at the stables. She's always down at the stables.`]), 'maid'); },
  async corwin() {
    const N = 'Master Corwin', s = 'swordmaster';
    if (G.age === 'child' && !G.flags.trainBlade) { await bladeTraining(); return; }
    if (G.age === 'child') { await say(N, `One bout, one lesson. You'll get the rest of your life to practise it.`, s); return; }
    await say(N, pick([`Shoulders down. You still drop your guard on the third beat.`, `They say the Ashborn fight in threes. Keep your back to a wall or a friend.`, `I taught your father. He was worse than you at your age. Don't tell him I said the "at your age" part.`]), s);
  },
  async stablehand() { await say('Old Pike', pick([`Wren does the work of three lads and eats like two. Worth every crust.`, `Horses won't go east past the Whisperwood. They know something.`]), 'stablehand'); },
  async valenFolk1() {
    const lines = G.rep < 0
      ? [`You're the one who stood and watched, aren't you. …No, no. Good morning, my lord.`, `They still talk about that night at the mill. Small town.`]
      : [`Morning, my lord! The whole street heard about the mill.`, `My boy says he's going to be like you. Goddess help me.`];
    await say('Townswoman', pick(lines), 'villager3');
  },
  async valenFolk2() { await say('Aldra', pick([`Barley's good this year. Everything else is worse.`, `They took two more lads for the levy last week.`]), 'woman2'); },
  async valenKid() { await say('Bram', pick([`Is it true you can do magic AND swords?`, `When I'm big I'm going to fight the Demon Lord too!`, `Wren says you're all right. Wren doesn't say that about anyone.`]), 'kid2'); },
  async valenFarmer() { await say('Farmer Oakes', pick([`Rain's late. Rain's always late.`, `If you're going east, tell them we sent our grain already. Twice.`]), 'farmer'); },
  async valenMarket() { await say('Stallholder', pick([`Apples, three for a copper. Your father's house buys the bruised ones, bless him.`, `The capital's raising prices again. War does that.`]), 'villager2'); },
  async valenGuard() {
    if (stage() === 0) await say('Gate Guard', `South road, my lord. Brookvale one way, Solmere the other. Mind the bandits past the third milestone.`, 'guard');
    else await say('Gate Guard', pick([`Safe roads, my lord.`, `Two carts came through from Aldmere with nothing in them. That's the second time this month.`]), 'guard');
  },
  async valenGrave() {
    await say('Noblewoman', `My husband is under that stone. He went east with your grandfather. …Bring some of them back this time.`, 'noblewoman');
  },
  async valenPatron() { await say('Traveller', pick([`Walked from Fernhollow. Three days, and something followed me for one of them.`, `Rangers out east say the woods have gone wrong past the old boundary stones.`]), 'hunter2'); },
  async valenBard() { await say('Singer', pick([`I'm writing a song about you. It doesn't rhyme yet.`, `Do you want the sad version or the brave version? They're the same song.`]), 'villager2'); },
  async shopValen() { await shopScene('valenford', 'Harlan', 'shop'); },
  async inn() { await innScene(G.map === 'ironhold_tavern' ? 'Brunhild' : G.map === 'solmere_tavern' ? 'Mags' : G.map === 'fern_lodge' ? 'Warden Holt' : 'Suzu', G.map === 'fern_lodge' ? 'hunter' : 'inn'); },

  // ---- Wren, at the stables
  async wren() {
    const s = 'wren', N = 'Wren';
    if (G.roster.wren && G.roster.wren.status === 'gone') { await say(N, `…`, s); return; }
    const first = !G.flags.wrenAsked;
    if (first) {
      G.flags.wrenAsked = true;
      if (INTRO()) {
        await talk([
          [N, `So it's true. They're sending you to kill the Demon Lord.`, s],
          [N, `I've been carrying a sword since the mill, you know. Pike lets me practise on the feed sacks.`, s],
          [N, `I'd come with you. I'm saying it once, and you can do what you like with it.`, s]
        ]);
      } else {
        await talk([
          [N, `You're going. Of course you're going.`, s],
          [N, `Look — the night at the mill, you came in without thinking. I've thought about what I'd have done. I didn't like the answer.`, s],
          [N, `So take me. Let me be the kind of person who goes in.`, s]
        ]);
      }
    }
    const c = await ask(N, first ? `Well?` : `Changed your mind about me?`, ['Come with me.', 'Not this time.'], s, false);
    if (c !== 0) { await say(N, `Right. I'll be here. Mucking out.`, s); return; }
    const start = G.flags.millWatched ? 42 : 82;
    if (await joinParty('wren', G.roster.wren && G.roster.wren.member ? undefined : start)) {
      await say(N, G.flags.millWatched ? `…All right. Let's see how you are in daylight.` : `Then let's go. I've had a pack ready for a week.`, s);
    }
  },

  // ================================================================ BROOKVALE
  async brookFolk() { await say('Villager', pick([`Half the village has the shaking fever. Brother Oswin hasn't slept in days.`, `The moonpetals only grow out past Fernhollow, and nobody's fool enough to go.`, `We're a chapel, a mill and a bridge. That's Brookvale.`]), 'villager'); },
  async brookFolk2() { await say('Merle', pick([`If you're going into the woods, take salt. Don't ask.`, `That girl in the graveyard — no, never mind. You'll see her or you won't.`]), 'woman'); },
  async brookKid() { await say('Tam', pick([`My sister's sick. Brother Oswin says she'll be all right but he says that with his face all wrong.`, `There's a ghost by the graves! I've seen her twice!`]), 'kid'); },
  async brookPatron() { await say('Farmhand', pick([`Fernhollow's a day north-east. Rangers there, good ones.`, `Aldmere's east along the road. Quiet little place. Was, anyway.`]), 'farmer'); },
  async brookGuard() { await say('Watchman', `East: Aldmere and the Whisperwood. North-east over the hills: Fernhollow. West: Valenford, and your father's roof.`, 'guard'); },
  async miller() { await say('Miller Cobb', pick([`Mill's been in the family four generations. The wheel's older than the family.`, `Wisps out on the water some nights. Pretty, if you don't get close.`]), 'miller'); },
  async shopBrook() { await shopScene('brookvale', 'Pell', 'shop'); },
  async feverPatient() { await say('Patient', pick([`It comes in waves. Cold, then hot, then the shaking.`, `Brother Oswin sat with my boy all night. All night, and then he went to the next house.`]), 'villager'); },
  async ghostgirl() {
    const N = '???', s = 'ghostgirl';
    if (!G.flags.elsieMet) {
      G.flags.elsieMet = true;
      await talk([
        [null, 'A girl in a grey dress stands among the headstones. The grass under her feet is not bent.'],
        [N, `Have you seen it? A tin locket. It has a flower in it.`, s],
        [N, `I dropped it in the wood when we ran. Mother said don't go back for it. I went back for it.`, s],
        [null, 'She is already fading when you think to ask her name. The stone she is standing over says ELSIE, and a date a long time ago.']
      ]);
      toast('Side story: The Tin Locket — search Whisperwood.', UI.gold);
      return;
    }
    if (itemCount('locket')) {
      removeItem('locket');
      G.flags.elsieDone = true;
      await talk([
        ['Elsie', `You found it. You went back for it.`, s],
        [null, 'She closes her hands around it, and the shape of her goes soft at the edges, like a held breath let out.'],
        ['Elsie', `Tell my mother I wasn\'t frightened at the end. It isn\'t true, but tell her anyway.`, s]
      ]);
      G.gold += 300; addItem('phoenix', 2);
      Sound.sfx('levelup');
      moraleAll(5);
      await say(null, 'Where she stood there is a small pile of old coin — 300 G — and two Phoenix Downs, as if someone had been saving them for a traveller.');
      return;
    }
    await say(N, `A tin locket. In the wood, west of the goblins. Please.`, s);
  },
  // ---- Oswin
  async oswin() {
    const N = 'Brother Oswin', s = 'oswin';
    if (!G.flags.oswinMet) {
      G.flags.oswinMet = true;
      await talk([
        [N, `Forgive me, I won't get up. If I get up I'll fall over.`, s],
        [N, `Shaking fever. Nine houses so far. I can hold it off, I cannot cure it — for that I need moonpetal, and moonpetal grows in the deep woods past Fernhollow.`, s],
        [N, `Everyone who can walk is nursing someone who can't. So I'm asking a stranger with a sword. Bring me three, and the village will owe you more than it can pay.`, s]
      ]);
      G.flags.feverQuest = true;
      toast('Side story: The Shaking Fever — find Moonpetal near Fernhollow.', UI.gold);
      return;
    }
    if (G.flags.feverQuest && !G.flags.feverCured && itemCount('moonpetal') >= 3) {
      removeItem('moonpetal', 3);
      G.flags.feverCured = true;
      await fadeOut(0.6); await wait(1.0); await fadeIn(0.6);
      await talk([
        [null, 'He works through the night. By morning the shaking has stopped in six houses, and by evening in the rest.'],
        [N, `There. Now I can stand up.`, s],
        [N, `You are going east to the Rift, they say. Against the Ashborn.`, s],
        [N, `I have patched up people who came back from that border. I would rather patch them up before they get there. Take me with you.`, s]
      ]);
      G.gold += 250;
      if (await joinParty('oswin', 78)) await say(N, `Then I'll keep you alive, and you keep me honest about who deserves it.`, s);
      return;
    }
    if (G.flags.feverCured) {
      const c = await ask(N, has('oswin') ? `Need something?` : `Do you want me on the road with you?`, has('oswin') ? ['Just checking in.'] : ['Come with me.', 'Not right now.'], s, false);
      if (!has('oswin') && c === 0) { if (await joinParty('oswin')) await say(N, `Then let's go. I'll pack the good bandages.`, s); }
      else await say(N, pick([`The Dawn does not care who you were. Only what you do next. I find that a relief.`, `Sanctus burns the Ashborn badly. Remember that it burns them. That should never be a comfortable thought.`]), s);
      return;
    }
    await say(N, `Three moonpetals. Deep woods past Fernhollow — south-east of the lodge, where the light goes green.`, s);
  },

  // ================================================================ ALDMERE
  async elder() {
    const s = 'elder', N = 'Elder Bram';
    if (!G.flags.metElder) {
      G.flags.metElder = true;
      await talk([
        [N, `A Valen. In Aldmere. I'd bow, but my back gave out in the last war.`, s],
        [N, `You're the one they're sending east. Good. Because three days ago goblins came out of Whisperwood and took an elf who was lodging at the Lantern. A mage.`, s],
        [N, `They sell captives over the border. Their camp is north-east in the wood, and it sits right across the only road to Ironhold.`, s],
        [N, `So you'll be going through them whether you like it or not. Take these. They were my grandson's.`, s]
      ]);
      addItem('potion', 3); G.gold += 60;
      Sound.sfx('chest');
      await say(null, `Received 3 Potions and 60 G.`);
      return;
    }
    const lines = [
      `The capital first, is it? Go on, then. Kings like to be seen agreeing with themselves.`,
      `The goblin camp is north-east through the wood. Rest at the Lantern first. There's no shame in it.`,
      `The dwarves have sealed their mine. Whatever the Warden is guarding, they want it kept.`,
      `Take the east road out of the wood and you'll see the Rift before you're ready to.`,
      `Castle Vharn. Whatever's behind that door, you've already gone further than any of us had the right to ask.`,
      byEnd({
        door: `The raids haven't stopped. We bury someone every week. I don't blame you. I only wish I knew what you saw out there.`,
        deal: `A treaty with the Ashborn. My grandson died fighting them. I don't know whether to curse you or thank you. Maybe both, for a while.`,
        purge: `They say the Wastes are empty now. I should feel relief. I keep thinking about how quiet it must be out there.`
      })
    ];
    await say(N, lines[stage()], s);
  },
  async shopVillage() { await shopScene('village', 'Mott', 'shop'); },
  async kid() {
    const N = 'Pip', s = 'kid';
    await say(N, pick([
      `Are you really a prince? You don't look like one.`,
      `My dad went east with the militia. He said he'd be back before the harvest.`,
      `Mum says I'm not allowed past the fence anymore. Not since the raid at Thornby.`,
      stage() === 5 ? byEnd({ door: `Dad still isn't back.`, deal: `There's an Ashborn man in the square. He has horns! He said his daughter is my age.`, purge: `Everyone's celebrating. Mum cried, though. I don't know if it was the happy kind.` }) : `I'm going to be a knight when I grow up. Then I'll protect everyone.`
    ]), s);
  },
  async woman() {
    const N = 'Hana', s = 'woman';
    const lines = [
      `A Valen on the road. That's either very good news or very bad news.`,
      `Lyra, the elf, she was kind to my boy. Taught him a light spell. Please bring her back.`,
      `The dwarves haven't sent ore in weeks. Without it the smiths can't arm anyone.`,
      `The sky in the east has gone red. My husband says that's the Wastes burning.`,
      `You're going through the Rift? …Then goddess keep you. Truly.`,
      byEnd({ door: `They took the Harlow boy on the east road last night. Just a boy.`, deal: `I don't trust them. But nobody has died on the east road since the treaty.`, purge: `We won. That's what the heralds say. We won.` })
    ];
    await say(N, lines[stage()], s);
  },
  async guardVillage() {
    const N = 'Guard Tomas', s = 'guard';
    if (stage() <= 1) await say(N, `East is Whisperwood. Slimes, bats, wolves, and goblins, lately. If you're hurt, come back. Dead heroes rescue nobody.`, s);
    else if (stage() < 5) await say(N, `Travel light and rest often. The road east only gets worse.`, s);
    else await say(N, byEnd({ door: `Double watches now. The raiders come at night.`, deal: `I'm told to salute the Ashborn envoy when he passes. I'm still getting used to it.`, purge: `They've cut the watch down to one man. Nothing left out there to watch for.` }), s);
  },
  async farmer() { await say('Farmer Tobbs', pick([`Harvest's thin this year. Half the lads are gone east.`, `If you're after work, check the quest board. People need herbs gathered and roads cleared.`, `A Valen in my barley. My grandfather saw a prince once, he said. Said he never smiled.`]), 'villager'); },
  async refugee() { await say('Refugee', `We came from Thornby. There's no Thornby now. The Ashborn came in the night, and the war goes on, and nobody is coming to end it.`, 'woman'); },
  async soldierPurge() { await say('Soldier', `I marched in the last push through the Rift. We burned everything. Orders were orders. …I don't sleep much.`, 'guard'); },
  async envoyVillage() { await say('Ashborn Envoy', `I am here under the Treaty of Ash, to settle disputes at the border. Your people stare. Mine did too, when the first human merchant came to Vharn. Staring is better than fighting.`, 'demonm'); },
  async patron() { await say('Patron', pick([`The Crooked Lantern's been here two hundred years. Survived two wars. It'll survive this one.`, `Don't mind me. Just drinking to my brother. He's with the militia, somewhere east.`]), 'villager'); },

  // ================================================================ WHISPERWOOD
  async lyraTied() { await chiefEvent(); },
  async chief() { await chiefEvent(); },
  async goblinGuard() { await say('Goblin', pick([`No humans past here. Chief's orders.`, `Go away. The elf's already sold.`, `The Ashborn pay in silver. What've you got?`]), 'goblin'); },
  async lyraTavern() {
    const L = 'Lyra', s = 'lyra';
    if (G.roster.lyra && G.roster.lyra.status === 'waiting') {
      const c = await ask(L, `You're back. Do you want me walking with you again?`, ['Yes.', 'Not yet.'], s, false);
      if (c === 0) { if (await joinParty('lyra')) await say(L, `Let's go, then.`, s); }
      else await say(L, `I'll be here. The fire's warm and the books are old.`, s);
      return;
    }
    if (!itemCount('grimoire')) { await say(L, `You're the one from the camp. …Thank you. I mean it. But I travel alone.`, s); return; }
    await talk([
      [L, `You. From the camp.`, s],
      [null, 'You set the grimoire on the table between you. Her hand goes to it before she can stop herself.'],
      [L, `…My mother's. The goblins tore the clasp off, but it's all here. You carried this all the way back?`, s],
      [L, `I ran from you at the camp. I'm sorry. The last time I trusted someone who came to save me, it didn't end well.`, s],
      [L, `You're going east, aren't you. Toward the Rift.`, s]
    ]);
    removeItem('grimoire');
    const c = await ask(L, `Then I'd like to go with you. If you'll have me.`, ['Travel together.', 'I\'m better alone.'], s, false);
    if (c === 0) { if (await joinParty('lyra', 70)) await say(L, `Then I'll watch your back. Try to watch mine.`, s); }
    else { G.flags.lyraWaits = true; rosterOf('lyra').status = 'waiting'; rosterOf('lyra').morale = 55; await say(L, `I understand that better than you'd think. If you change your mind, I'll be here.`, s); }
  },

  // ================================================================ FERNHOLLOW
  async fernFolk() { await say('Ranger', pick([`Poachers in the east hollow. They're setting snares big enough for a person.`, `The Old Thorn's awake. Big tree-shaped problem, south-east. Leave it be unless you fancy it.`, `Moonpetal grows where the light goes green. South, past the water.`]), 'hunter'); },
  async fernKid() { await say('Rook', pick([`Kestrel can shoot a coin off a post. I've seen it. Twice!`, `Don't go past the boundary stones. That's where the Thorn is.`]), 'kid2'); },
  async shopFern() { await shopScene('fernhollow', 'Trapper Wend', 'hunter2'); },
  async poachers() {
    if (G.flags.poachers) return;
    await talk([
      ['Poacher', `Wrong hollow, friend. Walk back the way you came and we'll all have a nice day.`, 'poacher'],
      [null, 'There are snare lines strung between the trees behind them, and something in one of them that has stopped moving.']
    ]);
    const c = await ask(null, 'Three of them, and one of you (and whoever walks with you).', ['Cut the snares.', 'Walk away.'], null, false);
    if (c !== 0) return;
    const res = await startBattle(['poacher', 'poacher', 'bandit'], { bg: 'forest' });
    if (res !== 'win') return;
    G.flags.poachers = true;
    World.refreshNpcs(true);
    addItem('moonpetal', 3); Sound.sfx('chest');
    await say(null, 'Among their haul: a bundle of pale flowers that glow faintly. Moonpetal — three of them, exactly what Brookvale needs.');
    toast('Obtained 3 Moonpetal.', UI.hp);
    moraleAll(4);
  },
  async kestrel() {
    const N = 'Kestrel', s = 'kestrel';
    if (G.roster.kestrel && G.roster.kestrel.status === 'gone') { await say(N, `…`, s); return; }
    if (!G.flags.kestrelMet) {
      G.flags.kestrelMet = true;
      await talk([
        [N, `You're the Valen heir. You walked in with mud to your knees, so I'll assume you're the useful kind.`, s],
        [N, `There are poachers in the east hollow. Not the hungry sort — the sort with a buyer. They took a boy's dog last week and he hasn't spoken since.`, s],
        [N, `Clear them out and I'll owe you a debt. And I pay in arrows.`, s]
      ]);
      toast('Side story: The Snare Line — the east hollow, Fernhollow.', UI.gold);
      return;
    }
    if (G.flags.poachers && !has('kestrel')) {
      const c = await ask(N, G.flags.kestrelJoined ? `Room for a bow?` : `Snares are down and the hollow's quiet. I keep my debts. Take me east with you.`, ['Come with me.', 'Not this time.'], s, false);
      if (c === 0) { G.flags.kestrelJoined = true; if (await joinParty('kestrel', 75)) await say(N, `Good. I'll take the high ground and you take the shouting.`, s); }
      else await say(N, `Fair. The lodge doesn't move.`, s);
      return;
    }
    await say(N, has('kestrel') ? pick([`Wind's from the east. Keep it on your cheek and you'll hear things sooner.`, `I mark the big one first. Everything after that is easier.`]) : `Poachers first. East hollow. Then we'll talk.`, s);
  },
  async oldThorn() {
    if (G.flags.thorn) return;
    await say(null, 'What you took for a dead oak turns its head. Two knots open. They are not knots.');
    if (has('kestrel')) await say('Kestrel', `That's the Old Thorn. It was here before the lodge. It only wakes when the wood is hurt.`, 'c:kestrel');
    const c = await ask(null, 'The Old Thorn (elite — suggested level 8+). Fight it?', ['Fight.', 'Back away slowly.'], null, false);
    if (c !== 0) return;
    const res = await startBattle(['treant'], { bg: 'forest' });
    if (res !== 'win') return;
    G.flags.thorn = true;
    World.refreshNpcs(true);
    addItem('mega', 2); addItem('moonpetal', 1);
    await say(null, 'The Old Thorn settles back into the shape of a dead oak. In the hollow of it: two Mega Potions and a single moonpetal, growing in the dark.');
  },

  // ================================================================ SOLMERE
  async royalGuard() { await say('Royal Guard', pick([`Blades peace-bound within the walls, my lord. Yours included.`, `His Majesty is receiving. Straight up the plaza steps.`]), 'royalguard'); },
  async solNoble() { await say('Court Noble', pick([`House Valen, is it? Sending your own heir east. Very… sincere of you.`, `The crown asks the minor houses for heirs and the great houses for grain. Do the arithmetic yourself.`]), 'noble'); },
  async solNoble2() { await say('Lady Cassin', pick([`They've stopped printing the casualty lists. That's how you know.`, `You're the one going through the Rift? You're very young. …They're always very young.`]), 'noblewoman'); },
  async solStall() { await say('Stallholder', pick([`Capital prices, capital quality. Mostly.`, `Watch your purse in the plaza. There's a girl working the crowd and the watch can't catch her.`]), 'villager2'); },
  async solKid() { await say('Street Child', pick([`Give us a copper? Go on.`, `Sable gave me half a pie once. Don't tell her I told you.`]), 'kid'); },
  async beggar() {
    const N = 'Old Soldier', s = 'beggar';
    if (!G.flags.gaveBeggar && G.gold >= 20) {
      const c = await ask(N, `Spare a coin for the eastern campaign, my lord? I was in it. Some of me still is.`, ['Give 20 G.', 'Sorry.'], s, false);
      if (c === 0) { G.gold -= 20; G.flags.gaveBeggar = true; Sound.sfx('coin'); moraleAll(3); await say(N, `Bless you. …Listen. Past the Rift, the ash gets in your food and your dreams. Eat before you go through. Trust me on that.`, s); return; }
    }
    await say(N, pick([`Nobody comes back the same. That's not a warning, it's just the arithmetic.`, `I knew a Valen once. Big man. Kind.`]), s);
  },
  async solHerald() { await say('Crown Herald', pick([`The Rift opened at midwinter. Everything since has been the consequence of that one morning.`, `His Majesty has called the levy three times this year.`]), 'herald'); },
  async solGate() { await say('Gate Sergeant', `North road: Valenford. East road: Aldmere and the Whisperwood. Both are safer than they were last month, which is not saying much.`, 'guard'); },
  async shopSol() { await shopScene('solmere', 'Quartermaster', 'merchant'); },
  async rosePatron() { await say('Drinker', pick([`You're the Valen brat. Sit down before somebody notices.`, `Sable? Haven't seen her. Haven't seen anyone.`]), 'thug'); },
  async palaceHerald() { await say('Crown Herald', `Approach the throne, my lord. Kneel, speak when spoken to, and do not mention the treasury.`, 'herald'); },
  async kingAurel() {
    const N = 'King Aurel III', s = 'king';
    if (!G.flags.writ) {
      await talk([
        [N, `Rise, Valen. You are younger than I hoped and steadier than I expected.`, s],
        [N, `At midwinter, the Rift east of Whisperwood tore itself open. Through it came the Ashborn, and at their head a king: Malgrath.`, s],
        [N, `The great houses have given me grain and excuses. Your father gave me his heir. I will not forget which.`, s],
        [N, `So: cross the Rift. Reach Castle Vharn. End Malgrath, and this war with him.`, s],
        [N, `The Rift is sealed on our side — the dwarves of Ironhold hold the Dawnstone that seals it, and their mine is shut. Start there.`, s],
        [N, `Take this writ. Every road in Eldoria opens to it. Whether anything opens on the other side, I cannot say.`, s]
      ]);
      G.flags.writ = true;
      addItem('writ'); G.gold += 500;
      addItem('hipotion', 3);
      Sound.sfx('levelup');
      await say(null, 'Received the Royal Writ, 500 G and 3 Hi-Potions.');
      await say(N, `One more thing, and I will say it once. I am not sending you because you are the best sword in Eldoria. I am sending you because you will actually go.`, s);
      World.refreshNpcs(true);
      saveGame();
      return;
    }
    if (stage() < 5) await say(N, pick([`Still here? The Rift will not walk to you.`, `The dwarves are stubborn, not disloyal. Give them a reason and they'll give you the stone.`, `If you find something behind that door that the chronicles did not prepare you for — decide for yourself. That is an order.`]), s);
    else await say(N, byEnd({
      door: `You came back without an ending. The court is scandalised. I find I am mostly relieved, and I will deny saying so.`,
      deal: `A treaty. With Malgrath. Half my council wants your head and the other half wants your seat. Sit down; we have work.`,
      purge: `It is done. The songs are already written. …You have not looked up from the floor since you came in.`
    }), s);
  },
  // ---- Sable
  async sableStreet() {
    const N = '???', s = 'sable';
    G.flags.sableMet = true;
    const lost = Math.min(G.gold, 120);
    G.gold -= lost;
    Sound.sfx('cancel');
    await talk([
      [null, 'Someone bumps your shoulder in the crowd, apologises beautifully, and is four strides away before your hand reaches your belt.'],
      [null, `Your purse is lighter by ${lost} G.`],
      [N, `Sorry, my lord! Terrible crowds!`, s]
    ]);
    World.refreshNpcs(true);
    toast('She went into the Gutter, south-west. The Gutter Rose.', UI.gold);
  },
  async sableTavern() {
    const N = 'Sable', s = 'sable';
    if (G.roster.sable && G.roster.sable.status === 'gone') { await say(N, `…`, s); return; }
    if (!G.flags.sableFought) {
      await talk([
        [N, `Took you an hour. I'd have found me in twenty minutes.`, s],
        [N, `Here's how this goes. You can call the watch, and I'm gone out the back before they're up the stairs. Or you can take it off me.`, s]
      ]);
      const c = await ask(N, `Well, my lord?`, ['Take it off you, then.', 'Keep it. Buy something to eat.'], s, false);
      if (c === 0) {
        const res = await startBattle(['sableE'], { bg: 'village', spar: true, noRun: true, intro: 'Sable flips a knife into her hand and grins.' });
        healParty();
        G.flags.sableFought = true;
        if (res === 'win') {
          G.gold += 120;
          await talk([
            [N, `All right! All right. Take it.`, s],
            [N, `Nobody's caught me in three years. You're going east, aren't you — the Rift thing. Everyone in the Gutter's talking about it.`, s],
            [N, `Take me. I'm faster than anything you'll meet and I steal from people who deserve it. Mostly.`, s]
          ]);
          if (await joinParty('sable', 60)) await say(N, `Right. Don't get sentimental about me and we'll get on fine.`, s);
        } else {
          await say(N, `And that's why nobody catches me. …Oh, keep your coin, I'm not a monster. Come back when you can stand up.`, s);
          G.gold += 120;
        }
        return;
      }
      G.flags.sableFought = true; G.flags.sableGift = true;
      await talk([
        [N, `…What?`, s],
        [N, `No. People don't do that. People shout, or they call the watch, or they hit me.`, s],
        [N, `…Fine. Fine! I'm coming with you. Don't look pleased about it.`, s]
      ]);
      if (await joinParty('sable', 80)) await say(N, `And I'm keeping the hundred and twenty.`, s);
      return;
    }
    if (!has('sable')) {
      const c = await ask(N, `Want me back?`, ['Come with me.', 'Not now.'], s, false);
      if (c === 0) { if (await joinParty('sable')) await say(N, `Obviously.`, s); }
      else await say(N, `Suit yourself.`, s);
      return;
    }
    await say(N, pick([`Gutter Rose does a stew. Don't ask what's in it.`, `Broken enemies can't watch their pockets. That's where I come in.`]), s);
  },
  async thugs() {
    if (G.flags.thugs) return;
    await talk([
      ['Gutter Thug', `Protection money. For the Rose. You look like you can afford it.`, 'thug'],
      ['Mags', `They've been bleeding me for six months. The watch won't come down here.`, 'inn']
    ]);
    const c = await ask(null, 'Two of them, and they are not in a hurry.', ['Run them off.', 'Pay them 200 G.', 'Not your business.'], null, false);
    if (c === 0) {
      const res = await startBattle(['thug', 'thug'], { bg: 'village' });
      if (res !== 'win') return;
      G.flags.thugs = true; World.refreshNpcs(true);
      G.rep += 5; moraleAll(4);
      if (has('sable')) { addMorale('sable', 10); await say('Sable', `That's my street. Was my street. …Thanks.`, 'c:sable'); }
      await say('Mags', `Drinks are free for you here. Forever. I mean it, don't test it.`, 'inn');
      addItem('hipotion', 2);
    } else if (c === 1 && G.gold >= 200) {
      G.gold -= 200; G.flags.thugs = true; World.refreshNpcs(true);
      if (has('sable')) addMorale('sable', -8);
      await say(null, 'They take the coin and swagger off. Mags does not look at you.');
    }
  },

  // ================================================================ IRONHOLD
  async garrick() {
    const N = 'Garrick', s = 'garrick';
    await talk([
      [N, `Stop there. The mine is sealed. Nobody goes down.`, s],
      [N, `Three weeks ago the Ashborn broke into the deep tunnels and woke the Warden, the stone guardian our ancestors built. My brother Dunstan was down there when it happened.`, s]
    ]);
    if (has('lyra')) await say('Lyra', `We need the Dawnstone. The Warden is sitting on it.`, 'c:lyra');
    G.flags.garrickMet = true;
    if (!INTRO()) {
      await talk([
        [hero(), `Then let us through. And if your brother is down there, we'll look for him with you.`, 'hero'],
        [N, `…You'd do that for a stranger's brother? Hah. Fine. You're going to get yourself killed, so you might as well have a shield in front of you.`, s]
      ]);
      G.flags.mineOpen = true;
      World.refreshNpcs(true);
      if (await joinParty('garrick', 70)) await say(N, `Stock up at Olga's and get some rest at the Deep Hearth. The mine is dark, and it's long.`, s);
      return;
    }
    await talk([
      [hero(), `I need the Dawnstone.`, 'hero'],
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
    World.refreshNpcs(true);
    await talk([
      [N, `…Hah. Well. You don't talk much, but you hit like you mean it.`, s],
      [N, `The gate's yours. And if you'd have an old dwarf at your side down there, I'd like to look for my brother.`, s]
    ]);
    const c = await ask(N, `What do you say?`, ['Come with me.', 'I\'ll go alone.'], s, false);
    if (c === 0) { if (await joinParty('garrick', 70)) await say(N, `Good. Stay behind the shield.`, s); }
    else { G.flags.garrickWaits = true; rosterOf('garrick').status = 'waiting'; await say(N, `Suit yourself. You'll find me at the Deep Hearth if you change your mind.`, s); }
  },
  async garrickTavern() {
    const N = 'Garrick', s = 'garrick';
    const c = await ask(N, `Back again. Want the shield in front of you?`, ['Yes.', 'Not now.'], s, false);
    if (c === 0) { if (await joinParty('garrick')) await say(N, `Then let's get moving.`, s); }
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
      await say(N, `Otherworlder. Yes, I said it. You carry something that doesn't belong to this world, and I can feel it on you like heat off a forge.`, s);
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
    await say('Dwarf', stage() === 5 ? byEnd({ door: `The Ashborn tried the mine again last week. We drove them off. For now.`, deal: `An Ashborn trader bought three carts of iron today. Paid fair, too. Strange times.`, purge: `Mine's open, ore's flowing, and nothing's coming out of the east ever again. Good for business.` }) : pick([`Garrick's been standing at that gate for three weeks. Won't sleep, won't eat.`, `The Dawnstone's down there with the Warden. Our ancestors built one to guard the other.`]), 'dwarf');
  },
  async dwarfTalk2() { await say('Old Miner', pick([`Fire does nothing to the Warden. Stone doesn't burn. Lightning, though. Lightning splits rock.`, `Break its guard before you swing big. That thing shrugs off anything it sees coming.`]), 'dwarf'); },
  async kidIronhold() { await say('Dwarf Child', pick([`My uncle went into the mine and didn't come out.`, `Are the Ashborn going to come here too?`]), 'kid'); },
  async patronI() { await say('Miner', pick([`To the Warden. May it sleep again.`, `Garrick's brother Dunstan owed me six silver. I'd forgive it if he walked through that door.`]), 'dwarf'); },
  async ashbornTavern() { await say('Ashborn Traveller', `The dwarves serve me now. Slowly, and with a lot of staring. But they serve me. My grandmother would not believe it.`, 'demonf'); },

  // ================================================================ OLD MINE
  async golem() {
    await say(null, 'A colossus of carved stone blocks the tunnel. Blue runes flare across its chest as you approach — and something else glows behind them, pale and cold.');
    if (has('garrick')) await say('Garrick', `The Warden. Our ancestors built it to hold the Dawnstone. Someone's burned Ashborn sigils into it — it doesn't know friend from foe anymore.`, 'c:garrick');
    if (!(await confirm(null, 'The Warden turns towards you. Fight? (Suggested level: 10+)'))) return;
    const res = await startBattle(['golem'], { bg: 'cave' });
    if (res !== 'win') return;
    G.flags.golem = true;
    World.refreshNpcs(true);
    await say(null, 'The Warden\'s runes gutter and die. It kneels, slowly, as if it were tired, and is still.');
    addItem('dawnstone');
    Sound.sfx('levelup');
    await say(null, 'Set into its chest, cool as a river stone: the DAWNSTONE. The Rift will open for you now.');
    await talk(has('garrick') ? [
      ['Garrick', `…There. Scratched into the wall behind it. "Dunstan passed. Gone east. Don't follow."`, 'c:garrick'],
      ['Garrick', `Idiot. He's alive. And of course I'm following.`, 'c:garrick']
    ] : [[null, 'Scratched into the wall behind it: "Dunstan passed. Gone east."']]);
    toast('The Rift east of Whisperwood will open now.', UI.gold);
    saveGame();
  },

  // ================================================================ THE WASTES
  async shopCamp() {
    if (!G.flags.metDunstan && has('garrick')) {
      G.flags.metDunstan = true;
      await talk([
        ['Merchant', `Garrick? You stubborn…! I left a message! I carved "don't follow" into a wall!`, 'merchant'],
        ['Garrick', `…Dunstan.`, 'c:garrick'],
        [null, 'Garrick crosses the camp in four strides and pulls his brother into a crushing embrace. Neither of them says anything for a while.'],
        ['Dunstan', `I got out past the Warden when it woke. Couldn't go back. So I came through the Rift and started trading with anyone who came through. Even Ashborn deserters.`, 'merchant'],
        ['Dunstan', `Take these. Don't argue.`, 'merchant']
      ]);
      addItem('phoenix', 2); addItem('hipotion', 3); Sound.sfx('chest');
      addMorale('garrick', 15);
      await say(null, 'Received 2 Phoenix Downs and 3 Hi-Potions.');
    }
    await shopScene(G.ending === 'deal' ? 'ember' : 'camp', G.flags.metDunstan ? 'Dunstan' : 'Merchant', 'merchant');
  },
  async healer() {
    if (stage() === 4) await say('Healer Sera', `The castle is north-east, past the lava fields. Rest before you go. Nobody should walk into that place tired.`, 'healer');
    await innScene('Healer Sera', 'healer', true);
  },
  async varek() {
    const N = 'Varek', s = 'varek';
    if (G.roster.varek && G.roster.varek.status === 'gone') { await say(N, `…`, s); return; }
    if (!G.flags.metVarek) {
      G.flags.metVarek = true;
      await talk([
        [N, `Put the weapon down, human. I'm not here to fight. I'm here because I stopped fighting.`, s],
        [N, `I was a soldier of the Ashborn. Six raids. On the seventh, they told us to burn a farm with a family still inside it. I walked into the Wastes instead.`, s],
        [N, `Do you know what the Wastes are? Three hundred years ago your Accord of Dawn drove my people here. Nothing grows. We eat what the ash leaves us.`, s],
        [N, `Malgrath is not a good king. But he is a desperate one, and so are we. Remember that, when you stand in front of him.`, s]
      ]);
      const c = await ask(N, `You are going to the castle. I know the halls, the guard rotations, and the man on the throne. Take me, and I will get you there.`, ['Walk with me.', 'I\'ll go without you.'], s, false);
      if (c === 0) {
        if (has('oswin')) await say('Oswin', `…My lord. He is Ashborn.`, 'c:oswin');
        if (await joinParty('varek', 55)) {
          if (has('oswin')) { addMorale('oswin', -10); await say('Oswin', `I will walk behind him. That is all I can promise today.`, 'c:oswin'); }
          await say(N, `Then let us be clear: I am not doing this for Eldoria. I am doing it for a village called Emberhollow.`, s);
        }
      } else await say(N, `As you wish. I will be here, being stared at.`, s);
      return;
    }
    if (!has('varek')) {
      const c = await ask(N, `Changed your mind?`, ['Walk with me.', 'No.'], s, false);
      if (c === 0) { if (await joinParty('varek')) await say(N, `Good. Stay behind me in the halls.`, s); }
      else await say(N, `Mm.`, s);
      return;
    }
    await say(N, pick([`There's a village beyond the castle. Emberhollow. My sister lives there with her daughter.`, `The goddess of the Dawn chose your side three hundred years ago. Did anyone tell you that?`]), s);
  },
  async nyx() { await say('Nyx', pick([`Mama says the treaty means we can plant things. Real things. Not just ash-root.`, `Are you the one who talked to the king? Thank you. I don't know what you said, but thank you.`, `I planted a seed yesterday. Nothing yet. Mama says that's normal.`]), 'nyx'); },
  async nyxMother() { await say('Ashborn Mother', `My brother Varek told me about you. That you listened. We are building a village by the river where the Wastes meet the green. My daughter will grow up there.`, 'demonf'); },
  async emberTrader() { await say('Ashborn Trader', `Welcome to Emberhollow's market stall. The first honest trade between our peoples in three centuries. Dunstan sells my goods. I sell his.`, 'demonm'); },

  // ================================================================ CASTLE VHARN
  async malgrath() { await say('Malgrath', `…`, 'demonking'); },
  async kingDeal() { await say('Malgrath', pick([`The treaty holds. My people plant crops by the river. I have not seen that in my lifetime.`, `Your kings send envoys who hate me. Mine hate them back. And yet no one has died. You did that.`, `You could have ended me. I think about that more than you'd guess.`]), 'demonking'); },

  // ================================================================ misc
  async grave(x, y) {
    if (G.map === 'valenford') { await say(null, 'VALEN. Your family, stacked up in stone. There is a space left at the end of the row.'); return; }
    await say(null, pick(['A worn headstone. The name has gone soft with weather.', 'Somebody has left a cup of milk on this one. It is fresh.']));
  },
  async millEvent() { await millNight(); },
  async millBack() {
    if (!G.flags.millDone) { await say(null, 'Whatever that noise was, it came from the mill. You are not going home yet.'); const p = World.player; p.fx = p.x; p.fy = p.y; p.y -= 1; p.t = 0; p.dir = 'up'; }
  }
};

// ---------------------------------------------------------------- childhood training
async function bladeTraining() {
  const N = 'Master Corwin', s = 'swordmaster';
  await talk([
    [N, `There you are. Stand there. No — there.`, s],
    [N, `One bout. One. I do not care if you win; I care what you do with the three seconds where you might.`, s],
    [null, `TIMED STRIKES: when you attack, press ${Controls.label('ok')} while the marker is inside the light. The bright middle is a perfect strike.`],
    [null, `PARRY: when his blade comes at you, a ! flashes over your head. Press ${Controls.label('ok')} right then and you turn it aside.`]
  ]);
  if (!(await confirm(N, `Ready? One try. That is the whole point of it.`, s))) { await say(N, `I'll wait. I have nothing else on.`, s); return; }
  const res = await startBattle(['swordmaster'], { bg: 'yard', spar: true, training: true, noRun: true, maxRounds: 6, music: 'training', intro: 'Master Corwin raises his practice blade.' });
  const b = LAST_BATTLE;
  const e = b && b.enemies[0];
  const score = e ? Math.round(clamp((1 - e.hp / e.maxhp) * 125, 0, 100)) : 0;
  G.train.blade = score;
  G.flags.trainBlade = true;
  healParty();
  await say(N, score >= 80 ? `…Well. I shall have to start trying.` : score >= 55 ? `Good. You commit. That is most of it.` : score >= 30 ? `Adequate. You flinch on the third beat, like your father.` : `You are not a swordsman. That is not an insult. It is a map.`, s);
  toast(`Blade training: ${score}/100`, score >= 70 ? UI.hp : UI.paper);
  await checkTrainingDone();
}
async function magicTraining() {
  const N = 'Court Mage Isolde', s = 'courtmage';
  await talk([
    [N, `Sit. Hands flat. Good.`, s],
    [N, `A spell is a sequence. Each rune carries a mark: ${Runes.keys() ? 'a letter. Type that letter' : 'an arrow. Press that direction'} before the rune fades. Answer wrongly and nothing happens, which is the polite outcome.`, s],
    [N, `Twelve runes. One attempt. Begin when the first one lights.`, s]
  ]);
  if (!(await confirm(N, `Ready?`, s))) { await say(N, `Then come back when you are.`, s); return; }
  const sc = new RuneTrialScene(12);
  Scenes.push(sc);
  const score = await sc.promise;
  Scenes.remove(sc);
  G.train.magic = score;
  G.flags.trainMagic = true;
  await say(N, score >= 80 ? `Oh. Oh, that is irritating. You have your mother's hands.` : score >= 55 ? `Serviceable. You will not burn the house down, probably.` : score >= 30 ? `Slow, but you did not panic. Panic is the killer.` : `You have the magical aptitude of a nice chair. We shall work on it.`, s);
  toast(`Magic training: ${score}/100`, score >= 70 ? UI.hp : UI.paper);
  await checkTrainingDone();
}
async function checkTrainingDone() {
  if (!G.flags.trainBlade || !G.flags.trainMagic) return;
  G.flags.trainDone = true;
  const b = G.train.blade, m = G.train.magic;
  G.heroClass = (b >= 70 && m >= 70) ? 'none' : b >= m ? 'blade' : 'mage';
  await wait(0.4);
  Sound.sfx('levelup');
  await talk([
    [null, `Blade: ${b}/100.   Magic: ${m}/100.`],
    ['Lord Aldric Valen', G.heroClass === 'none'
      ? `Both. Corwin says both, and Isolde says both, and neither of them looks happy about it. You will be a MASTER OF NONE, child — good at everything, great at nothing. It is a harder road and a wider one.`
      : G.heroClass === 'blade'
        ? `Steel, then. You are a BLADE. Corwin will have you every morning from now until you leave this house.`
        : `The old words, then. You are a SPELLCASTER. Isolde will have you every morning, and you will complain about it.`, 'father'],
    ['Lady Ysolde Valen', `Enough. Both of you. It is dark and the child has not eaten.`, 'mother']
  ]);
  await say(null, `Your path: ${HERO_CLASSES[G.heroClass].name}. ${HERO_CLASSES[G.heroClass].desc}`);
  saveGame();
  await wait(0.3);
  await nightCall();
}

// the last night of childhood: the friend at the mill
async function nightCall() {
  await fadeOut(1.0);
  Sound.stop();
  await titleCard('That night', 'Something wakes you — a shout, a long way off, down by the old mill');
  G.flags.night = true;
  World.load('millnight', 15, 22, 'up');
  await fadeIn(1.2);
  await World.run(async () => {
    await say(null, 'The house is asleep. You are out of the window and over the wall before you have decided to be.');
    await say(null, 'The mill path runs north. Someone is shouting down there — a girl\'s voice, and under it, something lower.');
  });
}
async function millNight() {
  if (G.flags.millDone || G.flags.millBusy) return;
  G.flags.millBusy = true;
  G.flags.millWolves = true;
  World.refreshNpcs(true);
  await say(null, 'Two wolves have a girl backed against the mill wall. She is your age. She has a pitchfork and no idea what to do with it.');
  await say('Girl', `Get back! GET BACK!`, 'wrenkid');
  await say(null, 'One of the wolves lunges. The pitchfork goes flying. She screams.');
  const c = await askTimed(null, 'You are standing in the dark, and they have not seen you. MOVE — or don\'t.', ['Run in now!', 'Stay in the dark and watch a moment.'], 5);
  if (c === 0) {
    G.flags.millWatched = false;
    G.personality = 'extro';
    await say(null, 'You do not decide to move. You are already moving, shouting, waving your arms like a lunatic.');
  } else if (c === 1) {
    G.flags.millWatched = true;
    G.personality = 'intro';
    await say(null, 'You wait. You count the wolves, you watch how they circle, you pick the one to hit first.');
    await say(null, 'It takes eleven seconds. It is a long eleven seconds for her.');
    await say('Girl', `IS SOMEONE THERE? I CAN SEE YOU!`, 'wrenkid');
    await say(null, 'Then you come out of the dark.');
  } else {
    // too slow: the moment chose for you
    G.flags.millWatched = true; G.flags.millFroze = true;
    G.personality = 'intro';
    Sound.sfx('buzz');
    await say(null, 'You mean to move. Your legs do not agree. Your heart is so loud you are sure the wolves can hear it.');
    await say(null, 'Somewhere very far away there is a road, and headlights, and a girl in a yellow coat — and this time you are standing still.');
    await say('Girl', `PLEASE! SOMEBODY!`, 'wrenkid');
    await say(null, 'It is her voice that breaks it. You come out of the dark late, and you both know it.');
  }
  const res = await startBattle(['ywolf', 'ywolf'], { bg: 'night', noRun: true, music: 'battle', intro: 'The wolves turn on you.' });
  if (res === 'lose') return;
  G.flags.millWolves = false;
  G.flags.millDone = true;
  World.refreshNpcs(true);
  healParty();
  const s = 'wrenkid';
  if (G.flags.millWatched) {
    await talk([
      ['Girl', `…You were there. Before. In the dark.`, s],
      ['Girl', `I saw you. I was shouting and you were standing there.`, s],
      [hero(), G.flags.millFroze ? `I… couldn't move. I'm sorry.` : `I was working out how to win.`, 'hero'],
      ['Girl', `I'm Wren. I work the Valen stables. You're the Valen child, aren't you.`, s],
      ['Girl', `Thank you for the end bit. I mean that. I'm just going to be honest and say the first bit is going to sit with me.`, s]
    ]);
    G.rep -= 10;
    await say(null, 'By morning the whole town knows two things: that the Valen child killed two wolves at the mill, and that the Valen child watched first.');
    await say(null, 'INTROVERT. You keep your own counsel. Companions will take more convincing — but you notice what others miss, and what you find will be rarer and better.');
  } else {
    await talk([
      ['Girl', `You— you just ran straight in. At wolves. With a stick.`, s],
      [hero(), `It was a very good stick.`, 'hero'],
      ['Girl', `I'm Wren. I work the Valen stables. …I'd have frozen. I know I would.`, s],
      ['Girl', `If you ever go anywhere, take me. I'm serious. I'll learn.`, s]
    ]);
    G.rep += 10;
    await say(null, 'By morning the whole town knows: the Valen child went straight in, in the dark, for a stable girl.');
    await say(null, 'EXTROVERT. People reach back when you reach for them. Companions come willingly — and you find more, if less remarkable, on the road.');
  }
  rosterOf('wren').morale = G.flags.millWatched ? 42 : 82;
  saveGame();
  await wait(0.4);
  await growUp();
}

// ---------------------------------------------------------------- the time skip
async function growUp() {
  await fadeOut(1.4);
  Sound.stop();
  await titleCard('Ten years later', 'House Valen, on the morning the herald came');
  G.age = 'youth';
  G.flags.youth = true;
  clearHeroSprites();
  // rebuild the hero as the young noble they grew into
  const h = G.party[0];
  h.lvl = 4; h.xp = 0;
  h.equip = { weapon: G.heroClass === 'mage' ? 'valenstaff' : 'valensword', armor: 'noble' };
  h.hp = maxHP(h); h.mp = maxMP(h);
  G.gold = 300;
  addItem('potion', 3); addItem('ether', 2);
  World.load('valen_manor', 10, 11, 'up');
  await fadeIn(1.2);
  await World.run(async () => {
    await say(null, 'You are taller than your mother now, which she mentions roughly once a day.');
    await questGiven();
  });
}
async function questGiven() {
  if (G.flags.questGiven) return;
  G.flags.questGiven = true;
  const F = 'Lord Aldric Valen', M = 'Lady Ysolde Valen';
  await talk([
    [null, 'A herald came at first light with the crown seal on his coat, and your father has not sat down since.'],
    [F, `It is done, then. The crown has asked, and House Valen answers.`, 'father'],
    [F, `At midwinter a Rift tore open east of the Whisperwood and the Ashborn came through it, led by their king. Malgrath.`, 'father'],
    [F, `The great houses sent grain. We are not a great house. So we send you.`, 'father'],
    [M, `Say the rest of it, Aldric.`, 'mother'],
    [F, `…The order is to cross the Rift and end the Demon Lord. That is the order. What you do when you are standing in front of him is between you and whatever you are.`, 'father'],
    [M, `Take the south road to Solmere. Present yourself to King Aurel and take his writ. Then east, and do not be brave for its own sake.`, 'mother'],
    [F, `Your grandfather's sword. It has been behind glass for forty years and it is sick of it.`, 'father']
  ]);
  Sound.sfx('levelup');
  await say(null, `You are the ${heroTitle()} of House Valen, and you have a war to walk into.`);
  toast('Main quest: present yourself to King Aurel in Solmere.', UI.gold);
  saveGame();
}

// ---------------------------------------------------------------- goblin camp
async function chiefEvent() {
  if (G.flags.chief) return;
  const L = 'Lyra', C = 'Goblin Chief';
  if (!G.flags.sawCamp) {
    G.flags.sawCamp = true;
    await talk([
      [C, `A human. Walking into my camp.`, 'chief'],
      [L, `Whoever you are, you shouldn't be here. They'll sell you too.`, 'lyra'],
      [C, `The Ashborn pay double for elves. I wonder what they'd pay for a Valen.`, 'chief']
    ]);
  }
  if (!(await confirm(null, `Cut the elf free and fight the Goblin Chief? (Suggested level: ${INTRO() ? '7' : '6'}+)`))) {
    await say(L, `Go. Get stronger. …And please come back.`, 'lyra');
    return;
  }
  await say(null, `You slash through the ropes holding the elf.`);
  let group = ['goblin', 'chief', 'goblin'];
  if (!INTRO()) {
    await say(L, `Thank you. I'm Lyra. Now let me return the favour.`, 'lyra');
    if (!(await joinParty('lyra', 70))) { await say(L, `…Then I'll fight beside you anyway, for this.`, 'lyra'); }
  } else {
    await say(L, `…I can manage from here.`, 'lyra');
    await say(null, 'Before you can speak, the elf is gone, vanishing into the trees. The chief laughs and raises his club.');
    group = ['chief', 'goblin'];
  }
  const res = await startBattle(group, { bg: 'forest' });
  if (res !== 'win') return;
  G.flags.chief = true;
  World.refreshNpcs(true);
  if (!INTRO() && has('lyra')) {
    await talk([
      [null, `The surviving goblins scatter into the trees.`],
      [L, `The Ashborn pay goblins to take elves. Something about our magic. I don't want to know what they do with it.`, 'c:lyra'],
      [L, `You're the one they're sending through the Rift. …Then I'm coming. North is Ironhold, and the road is open now.`, 'c:lyra']
    ]);
  } else {
    await say(null, 'Among the chief\'s hoard you find a leather spellbook with a torn clasp. The elf\'s, surely.');
    addItem('grimoire'); G.flags.lyraWaits = true; rosterOf('lyra').status = 'waiting';
    await say(null, 'Perhaps someone in Aldmere has seen her.');
  }
  toast('The north road to Ironhold is open.', UI.gold);
  saveGame();
}

// ---------------------------------------------------------------- companions, on the road
async function companionTalk(f) {
  const m = f.m, act = f.act, id = m.cls;
  const byAct = COMPANION_ACT[id] && COMPANION_ACT[id][act];
  const lines = byAct || COMPANION_IDLE[id] || [`Lead on.`];
  await say(m.name, pick(lines), 'c:' + id);
}
const COMPANION_ACT = {
  lyra: {
    book: [`This history says the Ashborn farmed the valley where Aldmere stands. That isn't in the version they teach children.`, `Listen: "And the Dawn drove the Ash from the green places, and the goddess smiled." …She smiled.`],
    display: [`I used to want a ring like this. Before. It doesn't matter now.`],
    fire: [`My mother used to say fire is the only magic everyone knows.`],
    door: [`I'll watch the door. Old habit, since the camp.`],
    bar: [`Elves aren't supposed to like ale. I've decided I'm an exception.`],
    sit: [`My feet hurt. Don't tell anyone.`]
  },
  garrick: {
    book: [`Bah. Letters. Give me a good rune any day.`], display: [`Good steel. Bad price.`],
    fire: [`Dwarves say a hearth is a promise. Somebody will always come back to it.`],
    door: [`I'll keep watch. Somebody should.`], bar: [`One more and then we go. …Two more.`], sit: [`Rest your legs. The road's long.`]
  },
  wren: {
    book: [`I can read. Slowly. Don't laugh.`], display: [`My whole wage for a year, that.`],
    fire: [`Stables were colder than this. I'm not complaining, I'm comparing.`],
    door: [`I've got the door. Go on.`], bar: [`One. I'm on watch after.`], sit: [`Feels strange, sitting while other people work.`]
  },
  sable: { book: [`Books. Heavy, hard to sell.`], display: [`Ooh. …I'm looking. Looking is free.`], fire: [`Never had a fire that was just mine.`], door: [`Two exits in here. Three if you count the window.`], bar: [`Buy me one and I'll tell you who in here is armed.`], sit: [`Sit down. You make people nervous, standing.`] },
  oswin: { book: [`A primer. Someone learned their letters on this.`], display: [`Gold on a shelf and fever in the next street.`], fire: [`Warmth is the Dawn's smallest miracle and the one people actually need.`], door: [`I'll say a word at the door. It costs nothing.`], bar: [`Water, thank you. …Well. Half.`], sit: [`Sit. Eat something. That is a religious instruction.`] },
  kestrel: { book: [`Maps at the back. Wrong, mostly.`], display: [`Pretty. Useless.`], fire: [`Green wood. Whoever laid this has never slept out.`], door: [`Clear sightline from here to the road.`], bar: [`One, and I'll still outshoot you.`], sit: [`Quiet, this. I like quiet.`] },
  varek: { book: [`Your histories have a chapter about my grandmother. It is four lines long and two of them are wrong.`], display: [`Ashborn silverwork used to be finer than this. It is all melted into arrowheads now.`], fire: [`Fire, in a room, for pleasure. What a thing.`], door: [`I will stand where people can see me. It is easier for everyone.`], bar: [`They served me. Slowly, but they served me.`], sit: [`Sit down, my lord. You look like your father in that chair.`] }
};
const COMPANION_IDLE = {
  lyra: [`We should keep moving.`, `Something about this place makes me uneasy.`, `Ask me about the old words sometime. I'll bore you senseless.`],
  garrick: [`Lead on.`, `Stay behind the shield.`],
  wren: [`Where you go, I go. That was the arrangement.`, `I keep expecting someone to tell me to get back to the stables.`],
  sable: [`Try to look less like a noble. It's the walk.`, `Anything you want lifted, say the word.`],
  oswin: [`Are you sleeping? Properly, I mean.`, `Whenever you're ready.`],
  kestrel: [`Wind's changed.`, `I'll take point if you like.`],
  varek: [`Whenever you are ready, my lord.`, `They watch me. Let them.`]
};

// ---------------------------------------------------------------- the Rift
async function portalChoice(scene) {
  Sound.stop(); Sound.play('portal');
  await say(null, 'The road gives out at a hole in the world. The Rift stands three times your height, turning slowly, and the air in front of it smells of ash and hot metal.');
  if (has('lyra')) await say('Lyra', `The Dawnstone is humming. It'll hold the way open, but only while we're carrying it.`, 'c:lyra');
  if (has('wren')) await say('Wren', `Whatever you decide here, I'm behind you. I want you to know I mean that literally as well.`, 'c:wren');
  if (has('varek')) await say('Varek', `Through there is my home. It has not been a kind one. Neither has this side.`, 'c:varek');
  if (has('garrick')) await say('Garrick', `My brother went through this. So it can be done.`, 'c:garrick');
  while (true) {
    const c = await ask(null, 'You stand in front of the Rift.', ['Step through.', 'Turn back.', 'Wait a while.'], null, false);
    if (c === 0) {
      await say(null, 'You put your hand through first. Then the rest of you.');
      Sound.sfx('magic');
      await fadeOut(1.0, '#ffffff');
      G.flags.throughRift = true;
      await wait(0.8);
      Fade.col = '#000';
      return 'in';
    }
    if (c === 1) {
      if (G.ending) { await say(null, 'You turn away from it. Again.'); return 'back'; }
      const sure = await ask(null, 'Turn your back on the Rift for good? The story ends here: Malgrath lives, the war goes on, and the land will be harder for it.', ['Walk away.', 'Stay a moment longer.'], null, false);
      if (sure === 0) { await endingDoor(); return 'ended'; }
      continue;
    }
    await say(null, pick(['You watch it turn. It does not care that you are watching.', 'Somewhere behind you, a bird carries on as if none of this were happening.']));
  }
}

// ---------------------------------------------------------------- the boss door
async function bossDoor() {
  if (G.flags.doorOpen) return;
  await say(null, 'A great door of black iron, sealed with a burning sigil. Behind it, you can feel something waiting. It has been waiting a long time.');
  const withMe = G.party.find(m => m.cls !== 'hero');
  if (withMe) await say(withMe.name, DOOR_LINES[withMe.cls] || `Whatever you decide, I'm with you.`, 'c:' + withMe.cls);
  const c = await ask(null, 'Open the door and face Malgrath?', ['Open the door.', 'Not yet.'], null, false);
  if (c !== 0) return;
  const sure = await ask(null, 'WARNING: If you fall in this battle, your journey ends. Your save file will be permanently erased, on this device and in the cloud. There is no retry.', ['I understand. Open it.', 'Not yet.'], null, false);
  if (sure !== 0) return;
  await enterThrone();
}
const DOOR_LINES = {
  wren: `Straight in, then. Like the mill.`,
  lyra: `Whatever you decide, I'm with you.`,
  garrick: `Your call. I'll follow.`,
  sable: `For the record: there is no back door. I checked.`,
  oswin: `I'll be right behind you, and so will the Dawn, and one of us is reliable.`,
  kestrel: `Say when.`,
  varek: `He will talk first. He always talks first. Listen anyway.`
};

async function enterThrone() {
  Sound.stop(); Sound.sfx('dark');
  await fadeOut(1.0);
  G.flags.doorOpen = true;
  World.load('castle', 12, 12, 'up');
  Sound.play('dark');
  await fadeIn(1.0);
  const N = 'Malgrath', s = 'demonking';
  await talk([
    [N, `So. They sent a child of a minor house.`, s],
    [N, `Do you know how many heroes have come through that door, ${hero()}? You are the twelfth. Twelve blades, pointed at the Ashborn by kings who have never seen ash.`, s],
    [N, `Did they tell you what the Accord of Dawn was? Your chronicles call it a victory. My grandmother called it the Burning. Three hundred years in the Wastes. Children born to ash.`, s],
    [N, `I am not asking for your pity. I am telling you what you are about to fight. Not a monster. A king whose people are starving.`, s]
  ]);
  if (has('lyra')) await say('Lyra', `…Varek said the same thing.`, 'c:lyra');
  if (has('garrick')) await say('Garrick', `Your soldiers burned half the villages east of Ironhold.`, 'c:garrick');
  if (has('varek')) await say('Varek', `My king.`, 'c:varek');
  await say(N, `Yes. They did. And I will not apologise for wanting to live. Come, then.`, s);
  G.flags.noSave = false;
  const res = await startBattle(['king'], { bg: 'castle', music: 'boss', permadeath: true, keepDark: true });
  if (res === 'lose') return;
  // the fight ends: bring the hall back up so the last words happen in front of you, not over black
  Sound.stop();
  const king = World.npcs && World.npcs.find(n => n.spr === 'demonking' || n.id === 'demonking' || n.id === 'king');
  if (king) { king.dir = 'down'; }
  await fadeIn(0.9);
  await wait(0.4);
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
  if (id === 'solmere') await say(null, 'Solmere. The walls are so high that the road goes dark before the gate, and then it is all light again.');
  if (id === 'forest' && stage() <= 1) await say(null, 'Whisperwood. Fresh tracks lead off to the north-east: small, clawed feet, and one pair of boots being dragged.');
  if (id === 'fernhollow') await say(null, 'Fernhollow smells of woodsmoke and wet bark. Somebody is singing badly in the lodge.');
  if (id === 'ironhold' && has('lyra')) await say('Lyra', `Ironhold. Everyone's watching that gate to the north. Something's wrong.`, 'c:lyra');
  if (id === 'mine' && has('garrick')) await say('Garrick', `Stay close. The Warden sleeps at the far eastern end. Everything between here and there wants us dead.`, 'c:garrick');
  if (id === 'wastes') {
    await say(null, 'Through the Rift: the air tastes of smoke, the ground is grey to the horizon, and far to the north-east a black castle stands against a red sky.');
    await say(null, 'There is a camp to the west of the road. You should stop there before you go anywhere near that castle.');
  }
  if (id === 'castle') { Sound.sfx('dark'); await say(null, 'Castle Vharn. The great hall runs north to a sealed iron door. You can feel the heat of it from here.'); }
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
  for (const [x, y] of [[32, 17], [31, 17], [31, 16]]) { girl.fx = girl.x; girl.fy = girl.y; girl.x = x; girl.y = y; girl.t = 0; await wait(0.36); }
  girl.dir = 'down';
  const ov = new CrossingOverlay(); Scenes.push(ov);
  ov.lights = 46;
  await say(null, 'Then the light changes. Headlights come around the corner, too fast. She doesn\'t see them.');
  tween(ov, { lights: 36 }, 1.4);
  await say(null, 'You don\'t decide to move. You\'re already moving.');
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
  await voidSequence();   // main.js: the goddess, and then being born
}

// ---------------------------------------------------------------- endings
async function endingDoor() {
  Sound.stop();
  await fadeOut(1.2);
  G.ending = 'door'; G.postgame = true; G.flags.end_door = true;
  await epilogue('door', [
    'You turn your back on the Rift, and you walk west, and nothing in the world stops you.',
    'The crown calls it dereliction. Your father says nothing at all, which is worse and kinder.',
    'The war goes on. Raiders come through the tear in the world, and the militias push them back, and every month there are new graves on both sides of it.',
    'The chronicles will not remember the heir who turned around.',
    'But you are still here. And there are people who still need help.'
  ]);
  await afterEnding('valenford', 23, 20);
}
async function endingDeal() {
  const N = 'Malgrath', s = 'demonking';
  Sound.stop(); Sound.play('ending');
  await talk([
    [N, `…You would take my word. After everything.`, s],
    [hero(), `I'm not doing it for you. I'm doing it so nobody else dies for a war that started three hundred years before either of us.`, 'hero'],
    [N, `Then we are agreed. The Wastes for the Ashborn, under treaty. My soldiers go home tonight.`, s],
    [N, `Your kings will call you a traitor. Mine will call me a coward. Perhaps that is how you know it is a fair deal.`, s]
  ]);
  if (has('lyra')) await say('Lyra', `I think… this is the first time one of these has ended without ending a people.`, 'c:lyra');
  if (has('varek')) await say('Varek', `My sister will plant something this year. …Thank you.`, 'c:varek');
  if (has('garrick')) await say('Garrick', `Dunstan's going to want to trade with them. I just know it.`, 'c:garrick');
  G.ending = 'deal'; G.postgame = true; G.flags.end_deal = true; G.flags.doorOpen = true;
  await fadeOut(1.2);
  await epilogue('deal', [
    'The Treaty of Ash is signed at Ironhold, on neutral stone, before King Aurel of Eldoria and the King of the Ashborn.',
    'It is not a happy peace. Men who lost sons spit at Ashborn envoys. Ashborn who lost everything spit back.',
    'But where the grey meets the green, the Ashborn build a village by the river and call it Emberhollow.',
    'A little girl named Nyx plants the first seed.',
    'Nobody is sure yet whether it will grow.'
  ]);
  await afterEnding('wastes', 12, 13);
}
async function endingPurge() {
  const N = 'Malgrath', s = 'demonking';
  Sound.stop();
  await talk([
    [N, `…So. That is your answer.`, s],
    [N, `Then listen. When your kings march through that Rift, and they will, remember that you could have stopped them.`, s],
    [N, `There are children in Emberhollow…`, s]
  ]);
  await say(null, 'Malgrath does not finish. He is still.');
  if (has('varek')) await say('Varek', `…`, 'c:varek');
  else if (has('lyra')) await say('Lyra', `…It's over. It's really over.`, 'c:lyra');
  G.ending = 'purge'; G.postgame = true; G.flags.end_purge = true; G.flags.doorOpen = true;
  await fadeOut(1.4);
  await epilogue('purge', [
    'With Malgrath dead, the Ashborn armies break. The armies of Eldoria come through the Rift to make sure the war can never return.',
    'They are thorough.'
  ], true);
  await burningVillage();
  await epilogue('purge', [
    'In Valenford, and Solmere, and a hundred villages between them, there are bells and bonfires. Your name is sung in every tavern in Eldoria.',
    'No one sings about Emberhollow.',
    'The Wastes are empty now. The land is safe.',
    'You are still here.'
  ], true);
  await afterEnding('valenford', 23, 20);
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
    for (let i = 0; i < 8; i++) { ctx.globalAlpha = 0.18; ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.ellipse(120 + i * 60 + Math.sin(this.t * 0.3 + i) * 20, 120 - i * 6 - this.t * 3 % 40, 90, 40, 0, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
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
    for (let i = 0; i < 12; i++) { const x = 60 + i * 46 + Math.sin(this.t * 0.6 + i) * 6, y = base + 18 + (i % 3) * 6; ctx.fillStyle = '#0a0404'; ctx.fillRect(x, y - 10, 3, 12); glow(x + 1, y - 12, 10, 'rgba(255,190,80,.8)'); }
    ctx.fillStyle = '#060203'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 400); ctx.quadraticCurveTo(200, 360, 360, 392); ctx.quadraticCurveTo(520, 420, W, 404); ctx.lineTo(W, H); ctx.fill();
    const img = charSprite('nyx', 'up', 0);
    ctx.drawImage(img, W / 2 - 48, 312, 96, 96);
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
    door: 'The war continues. Ashborn raiders roam the eastern roads, and the quest boards are full of requests to hold them back. The Rift is still there, if you ever change your mind.',
    deal: 'The border must be kept. The quest boards now carry peacekeeping work, and requests from Ashborn settlers in Emberhollow.',
    purge: 'The Ashborn are gone. The quest boards still have work: beasts, bandits, the ordinary troubles of a land at peace.'
  }));
  await say(null, 'Monsters everywhere now grow with your party. The smith in Ironhold may have something to offer you.');
}

class CreditsScene {
  constructor(ending) {
    this.y = H + 20; this.done = false;
    this.promise = new Promise(r => this.resolve = r);
    const title = { door: 'ENDING I — THE RIFT LEFT OPEN', deal: 'ENDING II — THE TREATY OF ASH', purge: 'ENDING III — DAWN WITHOUT MERCY' }[ending];
    const crew = COMPANION_IDS.filter(id => G.roster[id] && G.roster[id].status !== 'unmet').map(id => [`${COMPANIONS[id].name}, ${COMPANIONS[id].title}`, UI.paper, 17]);
    this.lines = [
      [title, UI.gold, 22], ['', 0, 30],
      ['I GOT ISEKAI\'D', UI.sakura, 26], ['The Video Game', UI.paper, 18], ['', 0, 30],
      ['Starring', UI.dim, 14], [`${heroTitle()} ${G.name} of House Valen`, UI.paper, 17],
      ...crew,
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
