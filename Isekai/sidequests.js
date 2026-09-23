// =====================================================================
//  sidequests.js : the stories off the main road. Dreams of home, the
//  truth about the goddess, fireside talks with companions, and side
//  stories before and after the end of the war.
// =====================================================================

// ---------------------------------------------------------------- new items and people
Object.assign(ITEMS, {
  suzu:     { name: 'Shrine Bell', type: 'key', price: 0, desc: 'A small brass bell on a faded red cord. KITAZAWA INARI is stamped on the clapper, in letters nobody here can read. You can.' },
  stariron: { name: 'Star Iron', type: 'key', price: 0, desc: 'A fist of black metal from the Warden\'s chamber. It is heavier than it should be, and warm.' },
  seeds:    { name: 'Valenford Seed Barley', type: 'key', price: 0, desc: 'A sack of Farmer Oakes\'s best seed. "Tell them it likes to be sung to. It doesn\'t. But tell them."' },
  mercy:    { name: 'Ashen Charm', type: 'key', price: 0, desc: 'A charm of braided grey hair and a red bead. Teth\'s mother made it. He wanted you to have it.' }
});
Object.assign(CHARS, {
  mei:     { pal: { h: '#16121c', s: SK, c: '#2b3a67', d: '#1b2440', p: SK, b: '#2a2020', n: '#e5534b' }, hair: 'ponytail', outfit: 'uniform', mods: ['girl', 'tie', 'skirt'] },
  meiold:  { pal: { h: '#16121c', s: SK, c: '#e8ecf4', d: '#b8c0d0', t: '#6fb7f2', p: '#3a3a55', b: '#2a2020' }, hair: 'long', mods: ['girl'] },
  col:     { pal: { h: '#6a3a1e', s: SK3, c: '#6a7a8a', d: '#4a5a6a', t: '#3a5aa8', p: '#4a3e30', b: '#2a1e14' }, hair: 'short', outfit: 'chain' },
  teth:    { pal: { h: '#3a2a40', s: ASH, e: '#f2c94c', c: '#5a3a3a', d: '#3a2226', p: '#2a1a1e', b: '#120a10', n: '#d8d0c0' }, hair: 'short', outfit: 'leather', mods: ['horns'] },
  ember:   { pal: { h: '#6a2a3a', s: '#a898b8', e: '#f2c94c', c: '#6a6a7a', d: '#4a4a5a', p: '#a898b8', b: '#2a2222', n: '#e8e0d0' }, hair: 'long', mods: ['girl', 'child', 'horns'] }
});

// ---------------------------------------------------------------- side story tracker
// status(): null = not started, 'done', or the current objective
const SIDE = [
  { id: 'locket', title: 'The Tin Locket', status: () => !G.flags.elsieMet ? null : G.flags.elsieDone ? 'done' : itemCount('locket') ? 'Bring the locket back to the girl in the Brookvale graveyard.' : 'Search the Whisperwood, south-west of the road, for a tin locket.' },
  { id: 'fever', title: 'The Shaking Fever', status: () => !G.flags.feverQuest ? null : G.flags.feverCured ? 'done' : itemCount('moonpetal') >= 3 ? 'Take the moonpetal to Brother Oswin in Brookvale.' : 'Find three moonpetals in the deep woods past Fernhollow.' },
  { id: 'snare', title: 'The Snare Line', status: () => !G.flags.kestrelMet ? null : G.flags.poachers ? 'done' : 'Clear the poachers out of Fernhollow\'s east hollow.' },
  { id: 'letter', title: 'A Letter Home', status: () => !itemCount('letter') && !G.flags.letterSent ? null : G.flags.letterReply ? 'done' : G.flags.letterSent ? 'Your letter is on its way. Visit your mother at Valen Manor.' : 'Finish the letter to your mother. Any innkeeper will send it on — rest at an inn.' },
  { id: 'levy', title: 'The Levy Boy', status: () => !G.flags.levyAsked ? null : G.flags.levyDone ? 'done' : 'Aldra\'s son Col ran from the levy. Someone saw a soldier hiding by the Brookvale mill.' },
  { id: 'wisps', title: 'Lights on the Millpond', status: () => !G.flags.wispsAsked ? null : G.flags.wispsDone ? 'done' : 'Nell Cobb followed the wisps. Search the east bank of the Brookvale river, by the mill.' },
  { id: 'bell', title: 'The Bell That Rang Alone', status: () => !G.flags.bellSeen ? null : itemCount('suzu') || G.flags.bellRung ? 'done' : 'Quill of Quill\'s Curiosities, in Solmere, has a bell that rang on its own at midwinter.' },
  { id: 'scout', title: 'The Wounded Scout', status: () => !G.flags.scoutMet ? null : G.flags.scoutDone ? 'done' : 'A wounded Ashborn scout is hiding in the south-east of the Whisperwood.' },
  { id: 'star', title: 'Star Iron', status: () => !G.flags.starAsked ? null : G.flags.starDone ? 'done' : itemCount('stariron') ? 'Bring the Star Iron to Smith Haldor in Ironhold.' : 'Smith Haldor says a seam of star iron fell from the roof of the Warden\'s chamber, deep in the Old Mine.' },
  { id: 'ledger', title: 'The Goddess\'s Ledger', status: () => !G.flags.ledgerCalled ? null : G.flags.ledgerDone ? 'done' : 'Aetheria is waiting at the forgotten shrine in the south-west of the Whisperwood.' },
  { id: 'hold', title: 'Hold the Line', status: () => !G.flags.holdAsked ? null : G.flags.holdDone ? 'done' : 'Aldmere expects a raid. Speak to Guard Tomas when you are ready to stand with them.' },
  { id: 'seeds', title: 'Seeds for Emberhollow', status: () => !G.flags.seedsAsked ? null : G.flags.seedsDone ? 'done' : itemCount('seeds') ? 'Bring the seed barley to Nyx\'s mother in the camp beyond the Rift.' : 'Ask Farmer Oakes in Valenford for seed that can grow in poor ground.' },
  { id: 'merrow', title: 'The Treaty-Breakers', status: () => !G.flags.merrowAsked ? null : G.flags.merrowDone ? 'done' : 'The Ashborn envoy in Aldmere knows where Captain Merrow\'s riders are hiding.' },
  { id: 'ember', title: 'The Last Ember', status: () => !G.flags.emberAsked ? null : G.flags.emberDone ? 'done' : 'A soldier swears an Ashborn child is still hiding in the lower hall of Castle Vharn.' }
];
function sideStories() { return SIDE.map(s => ({ s, st: s.status() })).filter(o => o.st); }
questsMenu = async function () {
  const items = [{ label: 'Main story', right: '', desc: storyObjective(), color: UI.gold }];
  for (const { s, st } of sideStories()) items.push({ label: s.title, right: st === 'done' ? 'Done' : 'Story', color: st === 'done' ? '#8a86a8' : '#f7b8cc', desc: st === 'done' ? 'Finished.' : st });
  for (const q of G.quests) items.push({ label: q.title, right: q.have >= q.need ? 'Turn in' : questProgress(q), color: q.have >= q.need ? UI.hp : undefined, desc: q.desc + `  Reward: ${q.gold} G, ${q.xp} XP.` });
  await list({ x: 196, y: 16, w: W - 224, items, title: 'Quests', rows: 9 });
};
function sideStart(title) { Sound.sfx('buff'); toast(`Side story: ${title}`, '#f7b8cc'); }
function sideDone(title) { Sound.sfx('levelup'); toast(`Side story complete: ${title}`, UI.hp); saveGame(); }

// ---------------------------------------------------------------- dreams
class DreamScene {
  constructor(kind) { this.kind = kind; this.t = 0; this.transparent = false; }
  update(dt) { this.t += dt; }
  draw() {
    const k = this.kind, t = this.t;
    if (k === 'void') {
      const g = ctx.createRadialGradient(W / 2, H / 2 - 40, 20, W / 2, H / 2, 420);
      g.addColorStop(0, '#2a2050'); g.addColorStop(1, '#05030e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++) { const x = hash2(i, 2) % W, y = (hash2(i, 5) % H + t * (4 + i % 5)) % H; ctx.globalAlpha = 0.3 + Math.sin(TIME * 2 + i) * 0.25; ctx.fillStyle = '#cfd8ff'; ctx.fillRect(x, y, 2, 2); }
      ctx.globalAlpha = 1;
      const cy = 150 + Math.sin(TIME * 1.1) * 5;
      glow(W / 2, cy, 140, 'rgba(180,160,255,.3)');
      ctx.drawImage(charSprite('goddess', 'down', 0), W / 2 - 72, cy - 80, 144, 144);
      // a thread of red, running out of her hands and off the edge of the world
      ctx.strokeStyle = 'rgba(229,83,75,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 + 20, cy + 20);
      for (let i = 0; i < 20; i++) ctx.lineTo(W / 2 + 20 + i * 18, cy + 20 + Math.sin(TIME + i * 0.6) * 12 + i * 3);
      ctx.stroke(); ctx.lineWidth = 1;
    } else {
      // Tokyo at dusk, remembered: soft, a little wrong. In the later dream, ash is falling on it.
      const ash = k === 'ashtokyo', later = k === 'crossing2';
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, ash ? '#2a1e24' : '#3a2a5a'); g.addColorStop(0.55, ash ? '#8a4a3a' : '#e0806a'); g.addColorStop(1, ash ? '#3a2a2a' : '#5a3a5a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) { const bw = 50 + (hash2(i, 3) % 50), bh = 90 + (hash2(i, 4) % 140), bx = i * 76 - 20; ctx.fillStyle = ash ? '#1e1618' : '#2a2038'; ctx.fillRect(bx, 250 - bh, bw, bh + 40); for (let w = 0; w < 12; w++) { if (hash2(i, w) % 3) continue; ctx.fillStyle = 'rgba(255,220,150,.6)'; ctx.fillRect(bx + 6 + (w % 4) * 11, 262 - bh + Math.floor(w / 4) * 18, 5, 7); } }
      ctx.fillStyle = '#26222c'; ctx.fillRect(0, 290, W, 190);
      for (let i = 0; i < 9; i++) { ctx.fillStyle = '#e8e4ec'; ctx.fillRect(40 + i * 64, 330, 36, 90); }
      ctx.fillStyle = '#3a3640'; ctx.fillRect(0, 286, W, 6);
      // the crossing signal
      ctx.fillStyle = '#1a1820'; ctx.fillRect(560, 190, 6, 100); ctx.fillRect(548, 180, 30, 40);
      const red = Math.floor(TIME * 1.5) % 2; ctx.fillStyle = red ? '#e5534b' : '#3a2020'; ctx.fillRect(553, 186, 20, 12); ctx.fillStyle = red ? '#203a20' : '#7ed36f'; ctx.fillRect(553, 202, 20, 12);
      // flowers left against the railing
      for (let i = 0; i < 7; i++) { ctx.fillStyle = ['#f28fad', '#fff3a0', '#ffffff', '#e5534b'][i % 4]; ctx.fillRect(470 + i * 7, 282 - (i % 3) * 3, 5, 5); ctx.fillStyle = '#2f7428'; ctx.fillRect(472 + i * 7, 287, 1, 6); }
      glow(560, 196, 50, red ? 'rgba(229,83,75,.35)' : 'rgba(126,211,111,.3)');
      const mei = later ? 'meiold' : 'mei';
      ctx.drawImage(charSprite(mei, ash ? 'up' : 'left', 0), 460, 196, 96, 96);
      if (ash) for (let i = 0; i < 120; i++) { const x = (hash2(i, 7) % W + Math.sin(t + i) * 10 - t * 12) % W, y = (hash2(i, 8) % H + t * (20 + i % 4 * 8)) % H; ctx.globalAlpha = 0.6; ctx.fillStyle = i % 9 ? '#b8aaa8' : '#ff9040'; ctx.fillRect((x + W) % W, y, 2, 2); }
      ctx.globalAlpha = 1;
    }
    // everything in a dream is a little out of focus at the edges
    const vg = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 420);
    vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(240,230,255,.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    FX.bloom(0.45);
  }
}
async function dream(kind, lines) {
  await fadeOut(0.6, '#ffffff');
  const d = new DreamScene(kind);
  Scenes.push(d);
  const track = Sound.trackName;
  Sound.stop(); Sound.play('void');
  await fadeIn(1.2, '#ffffff');
  await talk(lines);
  await fadeOut(1.0, '#ffffff');
  Scenes.remove(d);
  Fade.col = '#000';
  Sound.stop(); Sound.play(musicFor(G.map));
  await fadeIn(0.8);
}
const sib = () => G.gender === 'girl' ? 'Onee-chan' : 'Onii-chan';
const DREAMS = [
  { id: 'd1', when: () => stage() >= 1, run: () => dream('crossing', [
    [null, 'You dream of a road you have never seen and know by heart.'],
    [null, 'A crossing. A signal clicking from red to green. Evening, and the smell of curry from somewhere.'],
    ['???', `…${sib()}. It's a year today. Mum still puts your chopsticks out. Nobody says anything about it.`],
    [null, 'A girl in a school uniform is standing where the road meets the pavement. You know her face. You do not know her name. It hurts, not knowing.'],
    ['???', `I got taller. You'd be so annoyed.`],
    [null, 'Somewhere far off a bell rings once — a small bell, brass, on a red cord — and you wake with your hand closed around nothing.']
  ]) },
  { id: 'd2', when: () => stage() >= 2, run: () => dream('void', [
    [null, 'You dream of a place with no sky. You have been here before, though you could not say when.'],
    ['Aetheria', `You're doing well. Better than I hoped. Better than the others.`, 'goddess'],
    [hero(), `…What others?`, 'hero'],
    ['Aetheria', `Sleep. You have a long road tomorrow, and I have kept you long enough.`, 'goddess'],
    [null, 'She does not look at you when she says it. There is a thread of red running out of her hands and off the edge of the world, and she is holding it very tightly.']
  ]) },
  { id: 'd3', when: () => stage() >= 3, run: () => dream('ashtokyo', [
    [null, 'You dream of the crossing again. The signal. The railing. Flowers tied to it with tape, some fresh, some years old.'],
    [null, 'Grey flakes are falling on the road. On the cars. On the girl in the school uniform, who has stopped and is holding out her palm.'],
    ['???', `…Ash? Why is it snowing ash?`],
    [null, 'She turns, and looks straight at you.'],
    ['???', `${sib()}…? Is that you?`],
    [null, 'You try to say her name. You open your mouth and a bell rings instead, and you wake up, and the ash on the windowsill of the inn is real.']
  ]) },
  { id: 'd4', when: () => stage() >= 4, run: async () => {
    await dream('void', [
      [null, 'The place with no sky. She is waiting for you this time, and she has stopped pretending not to be.'],
      ['Aetheria', `You went through the Rift. So now you are going to hear it from Malgrath, and I would rather you heard it from me first.`, 'goddess'],
      ['Aetheria', `The truck did not come because I failed to watch. I watched. I let it come.`, 'goddess'],
      ['Aetheria', `Every few lifetimes the wall between your world and this one wears thin. When it tears, the Ash pours through — and the only thing I have ever found that closes a tear is a life given freely.`, 'goddess'],
      ['Aetheria', `So I look for them. The ones who run into roads. Who jump into rivers. Who go back for the locket. And when they do, I… catch them. And I bring them here.`, 'goddess'],
      ['Aetheria', `You are the twelfth.`, 'goddess']
    ]);
    G.flags.knowTruth = true;
    const c = await ask(null, 'You are awake. Your hands are shaking.', ['"She killed me."', '"She saved the girl. She could have let us both die."', 'Say nothing. Go back to sleep.'], null, false);
    G.flags.truthTake = c;
    if (c === 0) await say(null, 'You say it out loud, to the dark room. It does not feel better. It feels true.');
    else if (c === 1) await say(null, 'You remember the headlights, and a small yellow coat, and you find that you would do it again. That is the worst part.');
    else await say(null, 'You lie awake until the ash-light comes up grey through the shutters.');
    if (G.party.length > 1) { const m = G.party[1]; await say(m.name, FIRE_TRUTH[m.cls] || `Bad dream? …You were saying a name. Not one I know.`, 'c:' + m.cls); }
  } },
  { id: 'd5', when: () => !!G.ending, run: async () => {
    await dream('void', [
      ['Aetheria', `It's over. Your war, at least. You chose the way it ended, and I did not stop you.`, 'goddess'],
      ['Aetheria', `I owe you a reckoning. I owe eleven others one too, and they cannot come to collect it.`, 'goddess'],
      ['Aetheria', `Come to where the first of them sleeps. The old shrine in the Whisperwood, in the south-west, where the road forgets itself.`, 'goddess']
    ]);
    G.flags.ledgerCalled = true;
    sideStart('The Goddess\'s Ledger');
  } }
];
const FIRE_TRUTH = {
  wren: `You were talking in your sleep. Something about a road. …You don't have to tell me. But I'm here.`,
  lyra: `You were dreaming in a language I've never heard. It sounded like someone saying goodbye.`,
  garrick: `Bad dream, then. Dwarves say you tell a nightmare to the fire and it burns. Go on. Tell it.`,
  sable: `You talk in your sleep, you know. Don't worry. I only steal the interesting secrets.`,
  oswin: `The goddess? …I have prayed to her every morning of my life. Tell me what she said. Exactly what she said.`,
  kestrel: `You were saying "the twelfth" over and over. Whatever it is — you're not alone with it.`,
  varek: `So she came to you. My grandmother said the Dawn goddess only ever speaks to her weapons.`
};

// ---------------------------------------------------------------- fireside talks
// one per rest, each companion once: who they are when the road goes quiet
const FIRESIDE = {
  wren: async () => {
    const N = 'Wren', s = 'c:wren';
    if (G.flags.millWatched) {
      await talk([[N, `Can I say something? About the mill.`, s], [N, `I've been angry at you for ten years. For standing in the dark while I screamed.`, s], [N, `And now I've watched you walk into every bad place in Eldoria first. So I don't know what to do with the anger any more.`, s]]);
      const c = await ask(N, `Why did you wait?`, [G.flags.millFroze ? 'I froze. I was terrified.' : 'I was working out how to win.', 'I\'m sorry. I should have run in.', 'Does it matter now?'], s, false);
      if (c === 0) { addMorale('wren', 15); await say(N, G.flags.millFroze ? `…Terrified. Of course you were. You were six. …So was I. Thank you for telling me the truth.` : `…Yeah. And you did win. I think I needed you to say it wasn't easy.`, s); }
      else if (c === 1) { addMorale('wren', 12); await say(N, `…Okay. Okay. I've waited ten years to hear that and it turns out it's enough. Let's go and be brave somewhere.`, s); }
      else { addMorale('wren', -4); await say(N, `It does to me. …Forget it. Get some sleep.`, s); }
    } else {
      await talk([[N, `You ran straight in, at the mill. Ten years and I still don't understand it.`, s], [N, `Did it ever cross your mind that you might die?`, s]]);
      const c = await ask(N, ``, ['It never does. That\'s the problem.', 'Every time. I go anyway.'], s, false);
      addMorale('wren', 10);
      await say(N, c === 0 ? `…Then I'll think about it for both of us. Somebody has to.` : `Good. That means it's courage and not just stupid. …Mostly courage.`, s);
    }
  },
  lyra: async () => {
    const N = 'Lyra', s = 'c:lyra';
    await talk([[N, `You asked once why I ran from you at the camp.`, s], [N, `The last time I was taken, a man cut me loose and told me he was a hero. He sold me to the next buyer at the next town. My mother's grimoire paid for his boots.`, s], [N, `I got it back. I got out. And I promised I would never trust a rescue again.`, s]]);
    const c = await ask(N, `So why am I still here?`, ['Because I gave the book back.', 'Because you decided to. Not me.', 'I don\'t know. I\'m glad you are.'], s, false);
    addMorale('lyra', c === 1 ? 14 : 10);
    await say(N, c === 0 ? `That was the start of it. The rest was watching what you do when nobody's grateful.` : c === 1 ? `…Yes. I did. It's strange how much that matters.` : `So am I. Don't tell anyone; elves are meant to be aloof.`, s);
  },
  garrick: async () => {
    const N = 'Garrick', s = 'c:garrick';
    await talk([[N, G.flags.metDunstan ? `Dunstan's sending me letters now. Letters! Three pages about the price of pickled roots.` : `My brother's out there somewhere. Past the mine. Past everything.`, s], [N, `When we were lads our father used to say: a dwarf is only as strong as the one standing behind him.`, s], [N, `I was always the one in front. Dunstan was the one behind. I never once turned round to say thank you.`, s]]);
    const c = await ask(N, ``, ['Say it now. To me — I\'ll pass it on.', 'He knows.'], s, false);
    addMorale('garrick', 10);
    await say(N, c === 0 ? `…Hah. Thank you, Dunstan. …There. That was terrible. Never make me do that again.` : `Aye. Maybe. Dwarves aren't good at saying. We're good at showing up.`, s);
  },
  sable: async () => {
    const N = 'Sable', s = 'c:sable';
    await talk([[N, `Do you want to know something nobody in the Gutter knows?`, s], [N, `Sable isn't my name. It's a colour. I picked it off a bolt of cloth when I was eight, because it sounded like somebody who couldn't be caught.`, s], [N, `My real name is Marigold. If you laugh I will put a knife in your boot. Not your foot. Your boot. As a warning.`, s]]);
    const c = await ask(N, ``, ['Marigold suits you.', 'Your secret\'s safe.', 'Pfft— MARIGOLD?'], s, false);
    if (c === 2) { addMorale('sable', -3); await say(N, `Right. Check your boot in the morning.`, s); }
    else { addMorale('sable', 12); await say(N, c === 0 ? `…Shut up. …Thanks.` : `It better be. I know where all your secrets are too, my lord. I've been through your pack twice.`, s); }
  },
  oswin: async () => {
    const N = 'Brother Oswin', s = 'c:oswin';
    await talk([[N, `I have been a brother of the Dawn for thirty years. I have prayed to her every sunrise.`, s], [N, `Lately I have been reading the old chronicles again. The Burning. The Accord. The villages in the valley where the Ashborn used to farm.`, s], [N, G.flags.knowTruth ? `And now you tell me she brings children from another world to die for her wars. I don't know what I'm praying to any more.` : `And I find myself asking whether the goddess chose the right side. That is not a question a brother is supposed to ask.`, s]]);
    const c = await ask(N, ``, ['Keep asking it.', 'Faith is doing good anyway.', 'Maybe the goddess needs forgiving too.'], s, false);
    addMorale('oswin', 12);
    await say(N, [`Yes. …Yes. A faith that can't stand a question isn't worth the candles.`, `That's what I tell the fever patients. It's strange to hear it said back to me.`, `…Forgiving a goddess. What a heresy. I think I'll pray on it.`][c], s);
  },
  kestrel: async () => {
    const N = 'Kestrel', s = 'c:kestrel';
    await talk([[N, `I had a brother. Finch. Went east with the first muster, the week the Rift opened.`, s], [N, `He wrote twice. The second letter was mostly about the food. Then nothing.`, s], [N, `Every Ashborn I put an arrow in, I think: was it you? And then I think: somebody's sister is asking the same thing about me.`, s]]);
    const c = await ask(N, ``, ['We\'ll ask about him, over the Rift.', 'That thought is what makes you better than the war.'], s, false);
    addMorale('kestrel', 11);
    if (c === 0) G.flags.askFinch = true;
    await say(N, c === 0 ? `…You would? Then — yes. Ask. Whatever the answer is.` : `Maybe. Or maybe it's just what keeps me up at night. Could be both.`, s);
  },
  varek: async () => {
    const N = 'Varek', s = 'c:varek';
    await talk([[N, `The farm they told us to burn. I never told you the rest.`, s], [N, `There was a boy in the doorway. Seven, perhaps. Holding a wooden sword. He had drawn a Valen crest on it in charcoal.`, s], [N, `He wanted to be you. The heroes the heralds sing about. I put down my torch and I walked into the ash and I did not stop walking for nine days.`, s]]);
    const c = await ask(N, ``, ['You saved him.', 'You should have stopped the others too.', 'I\'m glad you walked.'], s, false);
    if (c === 1) { addMorale('varek', 4); await say(N, `Yes. I should have. I think about that more than you know.`, s); }
    else { addMorale('varek', 12); await say(N, c === 0 ? `I saved one. My sister says one is how everything starts.` : `…So am I. Most days.`, s); }
  }
};

// ---------------------------------------------------------------- after a night at an inn
async function afterRest() {
  // a letter home, finished by lamplight
  if (itemCount('letter') && !G.flags.letterSent && stage() >= 1) {
    const c = await ask(null, 'By the lamp, you find the unfinished letter to your mother. Finish it?', ['"I\'m fine. Don\'t worry about me."', '"I\'m frightened, most days."', '"Tell me about when I was small."', 'Not tonight.'], null, false);
    if (c < 3) {
      removeItem('letter'); G.flags.letterSent = true; G.flags.letterTone = c;
      await say(null, ['You write two pages about the weather and the food and nothing at all about the fighting.', 'You write one line, and then you cannot stop. By the end the candle is out.', 'You ask her about the nursery, and the first word you said, and whether you ever cried for no reason.'][c]);
      await say(null, 'In the morning you leave it with the innkeeper for the Valenford carrier.');
      toast('The letter is on its way home.', '#f7b8cc');
      return;
    }
  }
  // dreams come in order, one a night
  for (const d of DREAMS) {
    if (G.flags['dream_' + d.id]) continue;
    if (!d.when()) break;
    G.flags['dream_' + d.id] = true;
    await d.run();
    return;
  }
  // otherwise, someone by the fire wants to talk
  const who = companionsInParty().map(m => m.cls).find(id => FIRESIDE[id] && !G.flags['fire_' + id]);
  if (who) {
    G.flags['fire_' + who] = true;
    await say(null, `Late, by the fire. ${COMPANIONS[who].name} is still awake.`);
    await FIRESIDE[who]();
  }
}
{
  const inn0 = innScene;
  innScene = async function (name, spr, free) {
    const before = G.playTime, hp = G.party.map(m => m.hp).join();
    const flagKey = '_rested'; G.flags[flagKey] = false;
    const origHeal = healParty;
    let rested = false;
    healParty = function () { rested = true; return origHeal.apply(this, arguments); };
    try { await inn0(name, spr, free); } finally { healParty = origHeal; }
    delete G.flags[flagKey];
    if (rested) await afterRest();
  };
}

// ---------------------------------------------------------------- mother's reply
{
  const mother0 = STORY.mother;
  STORY.mother = async function () {
    if (G.age !== 'child' && G.flags.letterSent && !G.flags.letterReply) {
      const N = 'Lady Ysolde Valen', s = 'mother';
      G.flags.letterReply = true;
      await talk([
        [N, `Your letter came.`, s],
        [N, [`"I'm fine." Two pages of "I'm fine." You write exactly like your father. I read it eleven times.`, `You said you were frightened. …Good. I mean — not good. But you told me. Your father has never once told me.`, `You asked what you were like, small. You cried on your first night for a very long time, and then you stopped, and looked at me as if you were remembering someone. I have always wondered who.`][G.flags.letterTone || 0], s],
        [N, `Take these. They were meant for your father's campaign, and he is not going anywhere.`, s]
      ]);
      addItem('elixir'); addItem('hiether', 2); moraleAll(6);
      await say(null, 'Received an Elixir and 2 Hi-Ethers.');
      sideDone('A Letter Home');
      return;
    }
    return mother0.apply(this, arguments);
  };
}

// ---------------------------------------------------------------- THE LEVY BOY (Valenford → Brookvale)
MAPS.brookvale.npcs.push({ id: 'colHide', x: 40, y: 9, spr: 'col', dir: 'left', script: 'colHide', show: 'levyAsked&!levyDone' });
{ const vf2 = MAPS.valenford.npcs.find(n => n.id === 'vf2'); vf2.show = '!levyDone'; }
{
  const aldra0 = STORY.valenFolk2;
  STORY.valenFolk2 = async function () {
    const N = 'Aldra', s = 'woman2';
    if (stage() >= 1 && !G.flags.levyAsked) {
      await talk([
        [N, `My lord. Forgive me. I wouldn't ask, only there's nobody else to.`, s],
        [N, `My Col went with the levy in spring. Seventeen. Last week the muster-sergeant came to the door asking where he was. He never reached the camp.`, s],
        [N, `The miller's lad in Brookvale says there's a soldier sleeping rough behind the mill, east of the river. If it's him — if he's alive — I just want to know.`, s]
      ]);
      G.flags.levyAsked = true; sideStart('The Levy Boy'); return;
    }
    if (G.flags.levyAsked && !G.flags.levyDone) { await say(N, `Brookvale. Behind the mill, east of the river. Please.`, s); return; }
    if (G.flags.levyHome) { await say(N, pick([`He sleeps till noon and eats like a horse and I have never been so happy to be annoyed.`, `Thank you. That's all. Thank you.`]), s); return; }
    if (G.flags.levyCourt) { await say(N, `They say the court went easy on him, because you spoke. He won't look at me. …He's alive. I'll take it.`, s); return; }
    if (G.flags.levyMilitia) {
      if (G.ending === 'door') { await say(N, `They sent his boots home. Just his boots. The east road, they said. The raiders.`, s); await say(null, 'She does not say that it was your idea. She does not have to.'); return; }
      await say(N, G.ending ? `He came back from the east with a scar and a sweetheart. Both of them are loud.` : `He writes from the militia camp. His spelling is terrible. I read every word.`, s); return;
    }
    return aldra0.apply(this, arguments);
  };
}
STORY.colHide = async function () {
  const N = 'Col', s = 'col';
  await talk([
    [null, 'Behind the millhouse, a young man in a levy coat is crouched by a fire too small to cook on. He goes white when he sees your crest.'],
    [N, `Please. My lord. I know what you're here for.`, s],
    [N, `They marched us to Aldmere and showed us a cart. Just a cart, with sheets over it. Everyone knew what was under the sheets. That night I walked into the river and kept walking.`, s],
    [N, `I'm not a coward. I'm not. I just — I'm seventeen, and I don't want to be under a sheet.`, s]
  ]);
  const c = await ask(null, 'What do you tell him?', ['"Go home. Your mother is waiting."', '"Turn yourself in. I\'ll speak for you."', '"The militia at Aldmere needs you. Go back."'], null, false);
  G.flags.levyDone = true;
  World.refreshNpcs(true);
  if (c === 0) {
    G.flags.levyHome = true;
    await say(N, `…Home. Yes. Yes, my lord. Thank you.`, s);
    if (has('wren')) await say('Wren', `Good. There are enough people walking into the ash already.`, 'c:wren');
    if (has('garrick')) await say('Garrick', `Hmph. Soft. …Good call, mind.`, 'c:garrick');
    await say(null, 'A few days later, a parcel finds you on the road: a squire\'s tabard in Valen blue, mended and pressed, and a note in careful letters. "For whoever walks behind you. — A."');
    addItem('squire'); G.gold += 150; moraleAll(5); G.rep -= 2;
  } else if (c === 1) {
    G.flags.levyCourt = true;
    await say(N, `…If you'll speak for me. Yes. I don't want to run for the rest of my life.`, s);
    await say(null, 'You write to the muster court under the royal writ. The reply is short: a flogging, not a hanging, and the bounty on him is paid to you.');
    G.gold += 250; G.rep += 3;
  } else {
    G.flags.levyMilitia = true;
    await say(N, `…You're right. Somebody has to stand there. Better someone who knows what's under the sheets.`, s);
    await say(null, 'He kicks out his fire, and goes.');
    G.rep += 5; addItem('hipotion', 2);
  }
  sideDone('The Levy Boy');
};
STORY.bennet = async function () {
  const N = 'Bennet', s = 'farmer';
  if (G.flags.levyHome) await say(N, `He's upstairs. Asleep. I keep going up to check he's still there.`, s);
  else if (G.flags.levyDone) await say(N, `We heard. Whatever happens now, at least we heard.`, s);
  else await say(N, pick([`Aldra's not been sleeping. Neither have I.`, `The levy took my brother in the last war. Now it's took my son. There's always a war and there's always a levy.`]), s);
};
STORY.colHome = async function () { await say('Col', pick([`Mum makes me wash up every night now. I think it's so she can see me.`, `Thank you, my lord. I mean it. Every day I mean it.`]), 'col'); };

// ---------------------------------------------------------------- LIGHTS ON THE MILLPOND (Brookvale)
MAPS.brookvale.npcs.push(
  { id: 'nellLost', x: 33, y: 11, spr: 'kid', dir: 'up', script: 'wispPond', show: 'wispsAsked&!wispsDone', fixed: true },
  { id: 'wispA', x: 32, y: 10, spr: 'm:wisp', dir: 'right', script: 'wispPond', show: 'wispsAsked&!wispsDone' },
  { id: 'wispB', x: 34, y: 10, spr: 'm:wisp', dir: 'left', script: 'wispPond', show: 'wispsAsked&!wispsDone' }
);
STORY.maren = async function () {
  const N = 'Maren Cobb', s = 'woman';
  if (stage() >= 1 && !G.flags.wispsAsked) {
    await talk([
      [N, `My lord — oh gods, a sword, thank the Dawn. My Nell's gone.`, s],
      [N, `The lights. The wisps over the millpond. She's been talking about them for a week, how they sing. Last night she followed them out. Cobb's searching the river and he won't let me come.`, s],
      [N, `East bank, by the mill. Please.`, s]
    ]);
    G.flags.wispsAsked = true; sideStart('Lights on the Millpond'); World.refreshNpcs(true); return;
  }
  if (G.flags.wispsAsked && !G.flags.wispsDone) { await say(N, `East bank. By the mill. Please hurry.`, s); return; }
  await say(N, G.flags.wispsDone ? pick([`She's sleeping with a candle lit now. I don't mind the cost.`, `Cobb cried. Don't tell him I told you.`]) : pick([`Mind the flour on your boots.`, `The fever's broken in half the village. Brother Oswin is a saint.`]), s);
};
STORY.wispPond = async function () {
  await say(null, 'A little girl stands in the reeds at the edge of the water, perfectly still, smiling at nothing. Two pale lights turn slow circles around her head. They are humming.');
  await say('Nell', `Shh. They're singing. They say they're lost too.`, 'kid');
  if (!(await confirm(null, 'The wisps notice you. Drive them off?'))) return;
  const res = await startBattle(['wisp', 'wisp', 'wisp'], { bg: 'forest', intro: 'The lights stop singing.' });
  if (res !== 'win') return;
  G.flags.wispsDone = true; World.refreshNpcs(true);
  await talk([
    [null, 'The lights go out one by one, like candles pinched. Nell blinks, and looks down at the water up to her knees, and bursts into tears.'],
    ['Nell', `They said they were children. They said they drowned a long time ago and nobody came.`, 'kid'],
    [null, 'You carry her home. Maren meets you at the door and does not let go of her for a long time.']
  ]);
  if (G.flags.elsieDone) await say(null, 'On the way you pass the graveyard. For a moment you think you see a girl in a grey dress, waving from among the stones.');
  addItem('mace2'); G.gold += 200; moraleAll(5);
  await say('Miller Cobb', `Take this — the chapel gave it to my father for the flood year. A Dawn Hammer. It's meant for someone who goes into the water after other people's children.`, 'miller');
  sideDone('Lights on the Millpond');
};
STORY.nell = async function () { await say('Nell', pick([`I'm not allowed near the pond any more. I don't want to go anyway.`, `Do you think the lights were really children? Mum says no. Mum says it very fast.`]), 'kid'); };

// ---------------------------------------------------------------- THE BELL THAT RANG ALONE (Solmere)
STORY.quill = async function () {
  const N = 'Master Quill', s = 'noble';
  if (!G.flags.writ) { await say(N, `We open for customers of taste. And of the royal writ. You have neither yet, I'm afraid.`, s); return; }
  if (itemCount('suzu') || G.flags.bellRung) { await say(N, pick([`Nothing else rings by itself, I'm sorry to say. I've checked.`, `Come back when you've found something stranger. I'll pay well.`]), s); return; }
  if (!G.flags.bellSeen) {
    G.flags.bellSeen = true;
    await talk([
      [N, `Ah — House Valen! Welcome, welcome. Can I interest you in a curiosity?`, s],
      [null, 'He sets a small brass bell on the counter. It is tied to a faded red cord, and stamped with letters you have never seen. You can read them.'],
      [null, 'KITAZAWA INARI.'],
      [N, `A woodcutter found it in the Whisperwood on the morning the Rift opened. It was lying in the snow, ringing. By itself. For an hour.`, s],
      [N, `Nobody can read the letters. The court mage says it isn't magic. The chapel says it isn't holy. I say it's worth three hundred and fifty gold.`, s]
    ]);
    sideStart('The Bell That Rang Alone');
  }
  const opts = [`Buy it (350 G).`];
  if (has('sable')) opts.push(`Sable, a word…`);
  opts.push('Not now.');
  const c = await ask(N, `Well, my lord?`, opts, s, false);
  if (opts[c] === 'Not now.') { await say(N, `It'll keep. It's kept for a while.`, s); return; }
  if (opts[c].startsWith('Buy')) {
    if (G.gold < 350) { await say(N, `Ah. A little short. It'll wait for you.`, s); return; }
    G.gold -= 350; Sound.sfx('coin');
  } else {
    await say('Sable', `Oh, Master Quill, is that a genuine Solmere Guild seal on your door? It's crooked. No — the other way — lower—`, 'c:sable');
    await say(null, 'When he turns back from the door, the bell is gone and Sable is examining her fingernails.');
    addMorale('sable', 8); G.rep -= 2;
  }
  addItem('suzu');
  await wait(0.3); Sound.sfx('magic');
  await say(null, 'You pick it up. It rings once, clear and small, although your hand is perfectly still.');
  await say(null, 'For a second you are standing at a shrine in the evening. Fox statues. A woman\'s voice: "…I hear you."');
  await say(null, 'You know, without knowing how, that the last person to ring this bell was wishing for somebody. You know it was you.');
  sideDone('The Bell That Rang Alone');
};

// ---------------------------------------------------------------- THE WOUNDED SCOUT (Whisperwood)
MAPS.forest.npcs.push({ id: 'teth', x: 40, y: 21, spr: 'teth', dir: 'left', script: 'teth', show: 'chief&!scoutDone&!end_deal&!end_purge' });
MAPS.wastes.npcs.push({ id: 'tethCamp', x: 7, y: 13, spr: 'teth', dir: 'right', script: 'tethCamp', show: 'scoutSpared&!end_purge' });
STORY.teth = async function () {
  const N = 'Ashborn Scout', s = 'teth';
  if (!G.flags.scoutMet) {
    G.flags.scoutMet = true; sideStart('The Wounded Scout');
    await talk([
      [null, 'Wedged into a hollow under the roots: an Ashborn, young, with one horn snapped short and a goblin arrow through his thigh. He has a knife. He is too tired to lift it.'],
      [N, `Go on, then. Everyone says you Valens are quick about it.`, s]
    ]);
  }
  const c = await ask(null, 'He is barely older than you were at the mill.', ['Bind the wound.', 'End it.', 'Leave him.'], null, false);
  if (c === 2) { await say(null, 'You walk away. Behind you, you hear him let out a breath he had been holding.'); return; }
  G.flags.scoutDone = true; World.refreshNpcs(true);
  if (c === 0) {
    G.flags.scoutSpared = true;
    if (itemCount('potion')) removeItem('potion');
    await talk([
      [null, 'You cut the arrow, pack the wound, and give him your last clean water. He watches your hands the whole time, as if they might change their mind.'],
      ['Teth', `…Teth. My name. Since you've got your hands in my leg.`, s],
      ['Teth', `They say it in the camps, you know. When the goddess wants a war won, she sends a hero from nowhere. Always young. Always alone. Always, in the end, dead.`, s],
      ['Teth', `You'd be the twelfth. Grandmothers count them on their fingers to frighten children.`, s],
      ['Teth', `…Here. My mother made it. It's supposed to keep the ash off you. It hasn't worked for me, so maybe it's saving itself for someone.`, s]
    ]);
    addItem('mercy'); addItem('tonic', 2); moraleAll(6);
    if (has('oswin')) await say('Brother Oswin', `The Dawn does not care who you were. Only what you do next. …I don't think I've ever meant it before today.`, 'c:oswin');
    if (has('kestrel')) await say('Kestrel', `…I nearly put an arrow in him from the ridge. I'm glad I didn't.`, 'c:kestrel');
  } else {
    G.flags.scoutKilled = true;
    const res = await startBattle([{ id: 'orc', elite: { name: 'Teth, Ashborn Scout', mult: 0.55 } }], { bg: 'forest', intro: 'He finds the strength to lift the knife after all.' });
    if (res !== 'win') return;
    await say(null, 'Afterwards, in his pack: a map of the Aldmere road, a little money, and a charm of braided grey hair with a red bead. You leave the charm where it is.');
    G.gold += 180; moraleAll(-4);
    if (has('lyra')) await say('Lyra', `…He was a boy.`, 'c:lyra');
  }
  sideDone('The Wounded Scout');
};
STORY.tethCamp = async function () {
  const N = 'Teth', s = 'teth';
  if (!G.flags.tethThanks) {
    G.flags.tethThanks = true;
    await say(N, `The Valen who binds wounds! Nobody at the camp believed me. Here — the healer's been saving these for "someone who deserves them." I decided that's you.`, s);
    addItem('hiether', 3); Sound.sfx('chest'); await say(null, 'Received 3 Hi-Ethers.'); return;
  }
  await say(N, G.ending === 'deal' ? `I'm going to be a farmer. Can you imagine? Me, with a hoe. My mother is laughing at me already.` : pick([`The leg's healed. It aches when the ash is heavy. So always.`, `Twelfth. I still count you on my fingers. I just hope I get to stop at twelve.`]), s);
};

// ---------------------------------------------------------------- STAR IRON (Ironhold → the Old Mine)
MAPS.mine.chests.push({ id: 'm5', x: 34, y: 3, item: 'stariron', qty: 1 });
{
  const smith0 = STORY.smith;
  STORY.smith = async function () {
    const N = 'Smith Haldor', s = 'smith';
    if (G.flags.golem && !G.ending && !G.flags.starDone) {
      if (!G.flags.starAsked) {
        await talk([[N, `You put the Warden down. The whole hold heard it fall.`, s], [N, `When it fell, the roof of its chamber came down with it — and the old miners swore there was star iron in that roof. Metal from the sky. I've wanted to work it since I was a boy.`, s], [N, `Bring me a piece. I'll make you something that'll see you through the castle.`, s]]);
        G.flags.starAsked = true; sideStart('Star Iron'); return;
      }
      if (itemCount('stariron')) {
        removeItem('stariron'); G.flags.starDone = true;
        await fadeOut(0.4); Sound.sfx('crash'); await wait(0.5); Sound.sfx('crash'); await wait(0.6); await fadeIn(0.4);
        const id = G.heroClass === 'mage' ? 'astaff' : 'msword';
        addItem(id); if (has('garrick')) addItem('axe3');
        await say(N, `There. It rang like a bell every time I struck it. I don't know what that means. I don't want to.`, s);
        await say(null, `Received the ${ITEMS[id].name}${has('garrick') ? ' and a Rune Hammer for Garrick' : ''}.`);
        sideDone('Star Iron'); return;
      }
      await say(N, `The Warden's chamber. North-east corner, where the roof came in.`, s); return;
    }
    return smith0.apply(this, arguments);
  };
}
{
  const open0 = openChest;
  openChest = async function (c) {
    await open0(c);
    if (c.item === 'stariron' && !G.flags.starAsked) await say(null, 'It is warm to the touch, and heavier than it should be. A smith would know what to do with it.');
  };
}

// ---------------------------------------------------------------- THE GODDESS'S LEDGER (after any ending)
MAPS.forest.npcs.push({ id: 'aetheria', x: 5, y: 22, spr: 'goddess', dir: 'left', script: 'ledger', show: 'ledgerCalled&!ledgerDone' });
const ELEVEN = ['Hiroshi, a fisherman\'s son', 'Amaka, who could not swim', 'Joon, a cyclist', 'Sakura, a nurse', 'Tomás, who went back into the fire', 'Priya, fourteen', 'Ade, a bus driver', 'Lena, who caught a child on a stair', 'Yusuf, a lifeguard', 'Mika, a schoolteacher', 'Rowan, nobody at all, and everything'];
STORY.ledger = async function () {
  const N = 'Aetheria', s = 'goddess';
  Sound.stop(); Sound.play('void');
  await talk([
    [null, 'The goddess is sitting on the old stone with her knees drawn up, like somebody waiting for a bus. The grave behind her has a name cut into it in letters nobody in Eldoria can read. You can. It says HIROSHI.'],
    [N, `You came. I wasn't sure you would.`, s],
    [N, `This is the first. Three hundred and forty years ago. He pulled his little brother out of a harbour and I pulled him out of his world. He ended the Burning. He died of a fever at twenty-six, and they built a shrine, and then they forgot why.`, s],
    [N, `I remember all of them.`, s]
  ]);
  for (let i = 0; i < ELEVEN.length; i += 4) await say(N, ELEVEN.slice(i, i + 4).join('. ') + '.', s);
  await say(N, `And ${G.name}, who ran into the road for a girl in a yellow coat. Twelve.`, s);
  const c = await ask(null, 'What do you say to her?', ['"You owe them more than a list."', '"Did any of them get to go home?"', '"I forgive you."'], null, false);
  if (c === 0) await say(N, `I know. So here is what I can give: no thirteenth. The wall will have to hold without another child from another world. If it tears, this land will have to close it itself. I think… I think it can, now. You taught it how.`, s);
  else if (c === 1) await say(N, `No. None of them. There is no road back — I would have found it for Hiroshi. I looked for a hundred years.`, s);
  else { await say(N, `…Don't. Not yet. Be angry a while longer. You've earned it, and forgiveness this early is just tiredness.`, s); moraleAll(5); }
  G.flags.noThirteenth = c === 0;
  await say(N, `There is one thing I can do. The wall is thin here. Thin enough to look through, for a moment.`, s);
  if (itemCount('suzu')) await say(N, `Ring the bell. It was always a door. It only ever needed someone on this side to answer.`, s);
  await dream('crossing2', [
    [null, 'The crossing. Summer this time. A woman in her twenties is kneeling at the railing, tying fresh flowers where the old ones were.'],
    ['Mei', `Hi. It's me. I passed. The medical exams. I'm going to be a doctor, which you'd say is terrifying.`],
    ['Mei', `I stopped being angry at you for running into the road. It took a long time. I think I understand it now. I'd do it too.`],
    ...(itemCount('suzu') ? [[null, 'Somewhere a small brass bell rings, once. Mei looks up, straight at you, and her eyes go wide.'], ['Mei', `…${sib()}?`], [null, 'And then, very quietly, as if she is embarrassed to be heard: "Happy birthday to me. You still owe me a cake."']] : [[null, 'She looks up once, as if someone had called her name, and then shakes her head and smiles and goes home.']]),
    [null, 'The light changes. She is safe. She was always going to be safe. That was the point.']
  ]);
  if (itemCount('suzu')) { removeItem('suzu'); G.flags.bellRung = true; }
  G.flags.ledgerDone = true; World.refreshNpcs(true);
  addItem('elixir', 3); addItem('phoenix', 3); moraleAll(10);
  await say(null, 'When you look back at the stone, the goddess is gone. Three Elixirs and three Phoenix Downs sit on the grave, neatly stacked, like an apology somebody did not know how to say out loud.');
  sideDone('The Goddess\'s Ledger');
};

// ---------------------------------------------------------------- HOLD THE LINE (door ending, Aldmere)
{
  const guard0 = STORY.guardVillage;
  STORY.guardVillage = async function () {
    const N = 'Guard Tomas', s = 'guard';
    if (G.ending === 'door' && !G.flags.holdDone) {
      if (!G.flags.holdAsked) {
        await talk([[N, `You. Good. Our scouts saw fires on the east road — an Ashborn war-band, the one with the captain who burns the fields first.`, s], [N, `They'll come tonight. We've got the militia and a lot of pitchforks. We haven't got you.`, s]]);
        G.flags.holdAsked = true; sideStart('Hold the Line');
      }
      if (!(await confirm(N, `Stand with us tonight? There won't be time to rest between waves.`, s))) { await say(N, `Then come back before dark. Please.`, s); return; }
      await fadeOut(0.6); Weather.set('storm', 1); await wait(0.4); await fadeIn(0.6);
      await say(null, 'Night. Rain. Torches along the fence. Then shapes in the rain, and a horn.');
      const waves = [['imp', 'orc', 'imp'], ['dknight', 'orc', 'imp'], [{ id: 'dknight', elite: { name: 'Captain Vessk', mult: 1.35 } }, 'dknight', 'imp']];
      for (let i = 0; i < waves.length; i++) {
        const res = await startBattle(waves[i], { bg: 'village', intro: ['The first wave hits the fence.', 'They come again, heavier.', 'Captain Vessk rides out of the dark himself.'][i] });
        if (res !== 'win') return;
        if (i < 2) await say(null, ['The militia cheers. Then someone points east: more torches.', 'They break, and re-form. You hear a captain\'s voice cursing in Ashborn.'][i]);
      }
      G.flags.holdDone = true;
      await talk([[null, 'By dawn the rain has stopped and the east road is empty.'], [N, `We held. …We actually held. They'll sing about Aldmere, for once, instead of the ones who didn't.`, s]]);
      G.gold += 1500; addItem('dragon'); moraleAll(8);
      await say(null, 'Received 1500 G and a suit of Dragon Mail, "from the whole village".');
      Weather.forMap(G.map);
      sideDone('Hold the Line'); return;
    }
    return guard0.apply(this, arguments);
  };
}

// ---------------------------------------------------------------- SEEDS FOR EMBERHOLLOW + THE TREATY-BREAKERS (treaty ending)
{
  const nm0 = STORY.nyxMother;
  STORY.nyxMother = async function () {
    const N = 'Ashborn Mother', s = 'demonf';
    if (!G.flags.seedsAsked) {
      await talk([[N, `Nyx planted her seed. It came up grey, and then it lay down in the ash and died.`, s], [N, `We need seed that has grown in poor ground. Stubborn seed. Human seed, if I'm honest. I'm told your valley has a farmer who is famously stubborn.`, s]]);
      G.flags.seedsAsked = true; sideStart('Seeds for Emberhollow'); return;
    }
    if (itemCount('seeds') && !G.flags.seedsDone) {
      removeItem('seeds'); G.flags.seedsDone = true;
      await fadeOut(0.6); await wait(0.6); await fadeIn(0.6);
      await talk([[null, 'Nyx plants it with both hands, very seriously, and waters it from a cup. Then she sits down beside the row and refuses to leave.'], [null, 'Four days later a message comes over the Rift: there is green in Emberhollow. Real green. A whole row of it.'], ['Nyx', `IT'S GROWING! IT'S GROWING AND IT'S GREEN AND IT'S MINE!`, 'nyx']]);
      addItem('elixir', 2); G.gold += 600; moraleAll(8);
      if (has('varek')) { addMorale('varek', 12); await say('Varek', `…Green. In the Wastes. My grandmother would have wept. I think I might.`, 'c:varek'); }
      sideDone('Seeds for Emberhollow'); return;
    }
    return nm0.apply(this, arguments);
  };
  const oak0 = STORY.valenFarmer;
  STORY.valenFarmer = async function () {
    if (G.flags.seedsAsked && !G.flags.seedsDone && !itemCount('seeds')) {
      await talk([['Farmer Oakes', `Seed for the Ashborn? …For the little one? Hmph.`, 'farmer'], ['Farmer Oakes', `My barley grew in the flood year and the drought year and the year the rooks ate everything. If anything'll grow in ash, it's this. Tell them it likes to be sung to. It doesn't. But tell them.`, 'farmer']]);
      addItem('seeds'); Sound.sfx('chest'); await say(null, 'Received Valenford Seed Barley.'); return;
    }
    return oak0.apply(this, arguments);
  };
  const env0 = STORY.envoyVillage;
  STORY.envoyVillage = async function () {
    const N = 'Ashborn Envoy', s = 'demonm';
    if (G.ending === 'deal' && !G.flags.merrowDone) {
      if (!G.flags.merrowAsked) {
        await talk([[N, `I need to ask something that will make your people angry. Captain Merrow, of your own crown's cavalry, has taken forty riders into the Whisperwood.`, s], [N, `They burned an Ashborn trade wagon yesterday and left an Eldorian banner on it. They want us to break the treaty first.`, s]]);
        G.flags.merrowAsked = true; sideStart('The Treaty-Breakers');
      }
      if (!(await confirm(N, `If a Valen stops them, nobody can call it an Ashborn attack. Will you?`, s))) return;
      await say(null, 'You find them where the envoy said, in a clearing east of the bridge, sharpening their swords around a stolen Ashborn banner.');
      await say('Captain Merrow', `The Valen traitor. Good. Now I get to tell the King I killed you by accident.`, 'banditboss');
      const res = await startBattle([{ id: 'bandit2', elite: { name: 'Captain Merrow', mult: 1.4 } }, 'bandit2', 'bandit2'], { bg: 'forest' });
      if (res !== 'win') return;
      G.flags.merrowDone = true;
      await say(N, `It's done? …Then the treaty holds another season. That is how peace is kept, it turns out. One season at a time, by people who are very tired.`, s);
      G.gold += 1200; addItem('star'); moraleAll(6);
      await say(null, 'Received 1200 G and a Starlight Robe from the Border Council.');
      sideDone('The Treaty-Breakers'); return;
    }
    return env0.apply(this, arguments);
  };
}

// ---------------------------------------------------------------- THE LAST EMBER (purge ending)
MAPS.castle.npcs.push({ id: 'emberGirl', x: 3, y: 20, spr: 'ember', dir: 'right', script: 'emberGirl', show: 'emberAsked&!emberDone' });
MAPS.valen_manor.npcs.push({ id: 'emberManor', x: 4, y: 11, spr: 'ember', dir: 'down', script: 'emberManor', show: 'emberHome', wander: 1 });
{
  const sp0 = STORY.soldierPurge;
  STORY.soldierPurge = async function () {
    if (!G.flags.emberAsked && G.ending === 'purge') {
      await talk([['Soldier', `I have to tell someone. In the castle — the lower hall, west side. There was a girl. Little. Horns.`, 'guard'], ['Soldier', `The sergeant said check the cellars and I said I did and I didn't. I just didn't. She's still there. I leave bread by the grate.`, 'guard'], ['Soldier', `I can't go back. I can't. You could.`, 'guard']]);
      G.flags.emberAsked = true; sideStart('The Last Ember'); return;
    }
    return sp0.apply(this, arguments);
  };
}
STORY.emberGirl = async function () {
  const N = 'Ashborn Girl', s = 'ember';
  await talk([
    [null, 'In the corner of the hall, behind a fallen banner, a small girl with ash-grey skin and new, stubby horns is eating bread very fast.'],
    [null, 'She sees your crest. She stops chewing. She does not run. There is nowhere to run to; you made sure of that.'],
    [N, `…Are you the one who killed the king?`, s]
  ]);
  const c = await ask(null, '', ['"Yes. I\'m sorry. Come with me — you\'ll be safe."', '"Here. Take this coin and go west, where nobody knows you."'], null, false);
  G.flags.emberDone = true; World.refreshNpcs(true);
  if (c === 0) {
    G.flags.emberHome = true;
    await talk([[N, `…Safe where?`, s], [hero(), `My mother's house.`, 'hero'], [null, 'You carry her out through the ash. She falls asleep before the Rift. Your mother opens the door, looks at the horns, looks at your face, and takes the child without a word.'], ['Lady Ysolde Valen', `Her name?`, 'mother'], [N, `…Ember.`, s]]);
    moraleAll(10);
  } else {
    G.gold -= Math.min(G.gold, 200);
    await say(null, 'She takes the coin. She takes the rest of the bread. She goes, small and quick, into the grey, and does not look back. You will wonder about her for the rest of your life.');
  }
  sideDone('The Last Ember');
};
STORY.emberManor = async function () { await say('Ember', pick([`Nanny Perrin says I have to wear shoes inside. Why do humans have so many rules about feet?`, `Your mother is teaching me letters. I wrote "Ember" and "ash" and "sorry". She cried at the last one.`, `I don't hate you. I tried. It's very tiring.`]), 'ember'); };

// ---------------------------------------------------------------- the main story, a little deeper
// the ash creeps west once the Warden falls; after a peace, it stops
{
  const fm0 = Weather.forMap.bind(Weather);
  Weather.forMap = function (mapId) {
    fm0(mapId);
    if (!G || !Gfx.weather) return;
    const creeping = stage() >= 3 && (!G.ending || G.ending === 'door');
    if (creeping && ['forest', 'village', 'brookvale', 'fernhollow'].includes(mapId) && G.weather && (Math.floor(G.weather.until) % 10) < 6) this.set('ashfall', 1);
  };
}
{
  const enter0 = onEnterMap;
  onEnterMap = async function (id) {
    await enter0(id);
    if (!G.flags.ashSeen && stage() >= 3 && !G.ending && (id === 'village' || id === 'forest' || id === 'brookvale')) {
      G.flags.ashSeen = true;
      await say(null, 'Ash is falling. Fine grey flakes, blowing in from the east, settling on roofs and shoulders and the backs of people\'s hands.');
      await say(null, 'Nobody says it out loud, but everyone is thinking it: the Rift is open, and whatever is on the other side is coming this way.');
      if (G.party.length > 1) { const m = G.party[1]; await say(m.name, { wren: `It's in my hair. It's in everyone's hair.`, lyra: `The Wastes are breathing through the Rift. The longer it stays open, the further it'll reach.`, garrick: `Ash in Eldoria. My grandfather said he'd never see it again. He didn't.`, sable: `Great. Now everything tastes like a chimney.`, oswin: `Children are catching it on their tongues. They think it's snow.`, kestrel: `The birds went quiet an hour ago. I should have known.`, varek: `This is what we breathe every day. Now you know.` }[m.cls] || `…Ash.`, 'c:' + m.cls); }
    }
    if (id === 'wastes' && G.flags.askFinch && !G.flags.finchAnswered && has('kestrel')) {
      G.flags.finchAnswered = true;
      await say('Healer Sera', `Finch? A ranger, with a Fernhollow bow? …He came through here in the first month. Wounded. I patched him and he went home through the Rift a week later.`, 'healer');
      await say('Kestrel', `…Home. He went HOME? That — that idiot never wrote because he was — I'm going to kill him. I'm going to hug him and then kill him.`, 'c:kestrel');
      addMorale('kestrel', 20);
    }
  };
}
// Malgrath knows what the goddess is doing
{
  const src = enterThrone.toString();
  if (!src.includes('knowTruth')) {
    const et0 = enterThrone;
    const talk0 = talk;
    enterThrone = async function () {
      // slip the extra lines in after his "twelfth" speech
      talk = async function (lines) {
        await talk0(lines);
        if (lines.some(l => typeof l[1] === 'string' && l[1].includes('You are the twelfth'))) {
          talk = talk0;
          if (G.flags.knowTruth) await talk0([
            ['Malgrath', `But you know that already. I can see it on you. She told you what she is.`, 'demonking'],
            ['Malgrath', `Eleven children from nowhere, and she spent every one of them on us. And each time my people went back into the ash, and your chronicles wrote "and the goddess smiled."`, 'demonking']
          ]);
          else await talk0([['Malgrath', `All foundlings. All from nowhere. All with the same look you have now — as if they had left something on a road somewhere and could not remember what.`, 'demonking']]);
        }
      };
      try { await et0(); } finally { talk = talk0; }
    };
  }
}
// Isolde and the chronicles
{
  const cm0 = STORY.courtmage;
  STORY.courtmage = async function () {
    if (G.age !== 'child' && itemCount('suzu') && !G.flags.isoldeBell) {
      G.flags.isoldeBell = true;
      await talk([['Court Mage Isolde', `What is that on your belt? …May I?`, 'courtmage'], ['Court Mage Isolde', `There's no magic in it. None. And yet the runes on my desk are all pointing at it, like compass needles.`, 'courtmage'], ['Court Mage Isolde', `When you were born, you didn't cry for a whole minute. You just listened. As if you were waiting to hear something ring. I have never told your mother that.`, 'courtmage']]);
      return;
    }
    return cm0.apply(this, arguments);
  };
}
