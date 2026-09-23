// =====================================================================
//  epilogue.js : after the war. You can keep adventuring for as long as
//  you like. When you're ready, King Aurel offers you lands of your own,
//  and the story skips ahead: a proposal, a wedding, a kingdom, and a
//  child born into it. And on the other side of the world, someone
//  hears the bell. (Setting up the second game.)
// =====================================================================

Object.assign(ITEMS, {
  royal: { name: 'Royal Regalia', type: 'armor', kind: 'light', def: 18, mag: 6, price: 0, desc: 'Deep blue and gold, cut for someone who has to stand still in it for hours. The crest is your own now.', look: { style: 'noble', c: '#3a2a7a', d: '#241a52', t: '#f2c94c', p: '#241a52', b: '#1a1010', n: '#f2c94c' } }
});

// your castle, and the nursery beside the throne room
MAPS.realm_palace = {
  get name() { return 'Castle ' + ((G && G.kingdom) || 'Valen'); },
  music: 'capital', theme: 'castle', edge: '#', interior: true, ambient: 'rgba(255,210,140,.16)', encounters: null,
  rows: withDoors(PALACE_ROWS, [[23, 8, ']']]),
  npcs: [
    { id: 'rSpouse', x: 13, y: 2, spr: 'hero', dir: 'down', script: 'realmSpouse', show: 'epilogueDone&hasSpouse' },
    { id: 'rFather', x: 8, y: 5, spr: 'father', dir: 'right', script: 'realmParents' },
    { id: 'rMother', x: 15, y: 5, spr: 'mother', dir: 'left', script: 'realmParents' },
    { id: 'rHerald', x: 10, y: 10, spr: 'herald', dir: 'down', script: 'crowd', name: 'Royal Herald', lines: () => [`Petitions at noon, Your Majesty. There are always petitions at noon.`, `The Ashborn envoy, the Ironhold council and a man with a very large goose all wish to see you.`] },
    { id: 'rGuard1', x: 9, y: 13, spr: 'royalguard', dir: 'down', script: 'crowd', name: 'Royal Guard', lines: [`For the crown.`, `Quiet day. The best kind.`] },
    { id: 'rGuard2', x: 14, y: 13, spr: 'royalguard', dir: 'down', script: 'crowd', name: 'Royal Guard', lines: [`Your child has your frown, Majesty. Respectfully.`] }
  ],
  warps: [
    { x: 11, y: 15, w: 2, h: 1, to: 'valenford', tx: 23, ty: 33, dir: 'down', clamp: true },
    { x: 23, y: 8, w: 1, h: 1, to: 'realm_home', tx: 5, ty: 6, dir: 'up' }
  ],
  chests: [], signs: {}
};
MAPS.realm_home = {
  name: 'The Royal Nursery', music: 'cradle', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,200,140,.12)', encounters: null,
  rows: HOME_ROWS.map((r, y) => y === 3 ? r.slice(0, 5) + '$' + r.slice(6) : r),
  pois: HOME_POIS,
  npcs: [{ id: 'rNurse', x: 8, y: 4, spr: 'nanny', dir: 'left', script: 'crowd', name: 'Nanny Perrin', lines: () => [`I raised you, and now I'm raising yours. I'm too old for this. I have never been happier.`, `${G.childName || 'The baby'} cried for a whole minute and then stopped, and just listened. Like you did. Like they were waiting for a bell.`] }],
  warps: [{ x: 5, y: 7, w: 2, h: 1, to: 'realm_palace', tx: 22, ty: 8, dir: 'left' }],
  chests: [], signs: {}
};
MAPS.valenford.npcs.push({ id: 'royalCoach', x: 25, y: 33, spr: 'royalguard', dir: 'left', script: 'royalCoach', show: 'epilogueDone' });
STORY.royalCoach = async function () {
  if (await confirm('Coachman', `Back to the castle, Your Majesty?`, 'royalguard')) {
    await fadeOut(0.5); World.load('realm_palace', 11, 14, 'up'); World.syncFollowers(); await fadeIn(0.5);
  }
};
function applyRealm() {
  const sp = MAPS.realm_palace.npcs.find(n => n.id === 'rSpouse');
  if (G && G.spouse) { sp.spr = 'c:' + G.spouse; G.flags.hasSpouse = true; }
}
{
  const load0 = WorldScene.prototype.load;
  WorldScene.prototype.load = function (id, ...a) { if (/^realm/.test(id)) applyRealm(); return load0.call(this, id, ...a); };
}
STORY.realmSpouse = async function () {
  const id = G.spouse, N = COMPANIONS[id].name, s = 'c:' + id;
  const L = {
    wren: [`The stables here are bigger than the whole of Old Pike's. I go and stand in them sometimes, just to be quiet.`, `${G.childName} grabbed my ponytail today and would not let go. I think that's the Valen grip.`],
    lyra: [`I've started writing it all down. The Rift, the goddess, you. Someone should read it who isn't a chronicler.`, `${G.childName} made a light today. A tiny one. I didn't teach them that.`],
    garrick: [`Dunstan says the throne's too soft. I told him to sit in it himself. He did. For an hour.`, `A dwarf, married to a king. My grandmother would have fainted. Then asked for the seating plan.`],
    sable: [`I still check the exits in the throne room. Old habits. There are four. I added one.`, `${G.childName} stole my spoon at breakfast. I've never been prouder of anything.`],
    oswin: [`I still say the morning prayers. They're different now. More questions in them.`, `Every child born in this kingdom gets a blessing from me. Even the loud ones. Especially ours.`],
    kestrel: [`Finch visits every spring. He's teaching ${G.childName} bird calls. It's unbearable. I love it.`, `The woods on our border are older than Fernhollow's. I walk them at dawn. Come with me some time.`],
    varek: [`My sister and Nyx came to court last week. Nyx asked if she could plant something in the throne room. I said yes.`, `Our child has my horns coming in. Small ones. The court pretends not to stare.`]
  }[id] || [`Hello, you.`];
  await say(N, pick(L), s);
};
STORY.realmParents = async function () {
  await say(pick(['Lord Aldric Valen', 'Lady Ysolde Valen']), pick([`We came for a week. That was four months ago.`, `You are a better ruler than you were a child. Which is not saying much, but I'm proud of you anyway.`, `${G.childName || 'The baby'} has your stubbornness. And your mother's hands.`]), pick(['father', 'mother']));
};
{
  const int0 = WorldScene.prototype.interact;
  WorldScene.prototype.interact = function () {
    const [dx, dy] = DIRS[this.player.dir], t = this.tile(this.player.x + dx, this.player.y + dy);
    if (G.map === 'realm_home' && t === '$') { this.run(() => say(null, pick([`${G.childName} is asleep, one fist curled up by one ear. Somewhere in the room, very faintly, a bell rings once. You don't hear it. The baby does.`, `${G.childName} opens their eyes and looks at you as if they're trying to remember where they've seen you before.`]))); return; }
    return int0.call(this);
  };
}

// ---------------------------------------------------------------- how you propose, to each of them
const PROPOSALS = {
  wren: { map: 'valenford', at: [40, 8], lines: [
    ['Wren', `The stables. Of course it's the stables.`],
    ['hero', `It's where you told me to take you with me. So — I'm asking you to come with me. For good this time.`],
    ['Wren', `…You stood in the dark once while I shouted. I've spent every year since watching you walk into the light first.`],
    ['Wren', `Yes. Obviously yes. Where you go, I go. That was always the arrangement.`]] },
  lyra: { map: 'aldmere_inn', at: [11, 6], lines: [
    ['Lyra', `The Crooked Lantern. Where you gave me back my mother's book.`],
    ['hero', `I promised myself I'd ask you here, where you first trusted someone who came to save you.`],
    ['Lyra', `Elves live a very long time. I want you to understand what you're asking me to spend on you.`],
    ['Lyra', `…Every day of it. Yes.`]] },
  garrick: { map: 'ironhold_tavern', at: [11, 6], lines: [
    ['Garrick', `You've gone red. Is it the ale? It's not the ale.`],
    ['hero', `You always stood in front of me. I'd like to stand next to you instead. For the rest of it.`],
    ['Garrick', `…Hah. A dwarf and a Valen. The Hold will talk for a century.`],
    ['Garrick', `Let them. Yes. Get Dunstan, he'll never forgive me if he misses this.`]] },
  sable: { map: 'solmere_tavern', at: [11, 6], lines: [
    ['Sable', `The Gutter Rose. Very romantic. Did you check the exits?`],
    ['hero', `Three. Four if you count the window. Marigold — will you stay?`],
    ['Sable', `…Nobody's ever asked me to stay. People ask me to leave. Politely, usually with a guard.`],
    ['Sable', `Yes. Don't look so smug. And the ring's mine now, I'm not giving it back.`]] },
  oswin: { map: 'brookvale_chapel', at: [7, 3], lines: [
    ['Brother Oswin', `The chapel. You know I'll be terrible at this. I've only ever officiated.`],
    ['hero', `You kept every one of us alive. I'd like to keep you.`],
    ['Brother Oswin', `…The Dawn does not care who you were. Only what you do next.`],
    ['Brother Oswin', `And what I'd like to do next is say yes. So — yes.`]] },
  kestrel: { map: 'fern_lodge', at: [11, 6], lines: [
    ['Kestrel', `You walked in with mud to your knees the first time. You've done it again. On purpose?`],
    ['hero', `On purpose. Marry me, Kestrel.`],
    ['Kestrel', `…Wind's changed. I should have known.`],
    ['Kestrel', `Yes. Quietly. No trumpets. …Fine, one trumpet.`]] },
  varek: { map: 'wastes', at: [12, 14], lines: [
    ['Varek', `The camp at the edge of the ash. Where I told you I'd stopped fighting.`],
    ['hero', `You walked into the ash so a boy could live. Walk out of it with me.`],
    ['Varek', `An Ashborn at a human wedding. Half of them will bring swords.`],
    ['Varek', `…I have spent my life being afraid of the wrong things. Yes.`]] }
};
const KINGDOM_LAND = {
  door: 'the Eastmarch, the hard country between Eldoria and the Rift. Someone has to hold it, and the people there have asked for you by name.',
  deal: 'the Treaty Lands, where the green meets the grey. Human and Ashborn villages, side by side, and you to keep the peace between them.',
  purge: 'the Greening: the empty Wastes, slowly coming back to life. A king who did not know what else to give you has given you that.'
};

// ---------------------------------------------------------------- the offer
{
  const k0 = STORY.kingAurel;
  STORY.kingAurel = async function () {
    await k0.apply(this, arguments);
    if (!G.ending || G.flags.epilogueDone) return;
    const c = await ask('King Aurel III', `There is one more thing. The crown would give you lands of your own, ${heroTitle()} — a kingdom, in all but the name. It would mean putting down the sword. When you are ready.`, ['Not yet. There\'s still work to do.', 'I\'m ready. (Skip ahead years to the epilogue)'], 'king', false);
    if (c !== 1) { await say('King Aurel III', `Then go. The offer does not expire. Neither, I suspect, do you.`, 'king'); return; }
    if (!(await confirm(null, 'This skips ahead many years to the end of your story. You can keep exploring afterwards as a ruler. Begin the epilogue?'))) return;
    await epilogueChapter();
  };
  const so0 = storyObjective;
  storyObjective = function () {
    if (G.flags.epilogueDone) return `You rule the Kingdom of ${G.kingdom}. ${G.childName} was born this year. (The story continues in the next game.)`;
    const o = so0();
    return G.ending ? o + ' When you are ready to settle down, King Aurel in Solmere has an offer.' : o;
  };
}

// ---------------------------------------------------------------- the epilogue
function spouseCandidates() {
  return COMPANION_IDS.filter(id => G.roster[id] && (G.roster[id].status === 'party' || G.roster[id].status === 'waiting'));
}
async function epilogueChapter() {
  // who?
  const ids = spouseCandidates();
  const items = ids.map(id => ({ label: COMPANIONS[id].name, right: moraleWord(moraleOf(id)), color: moraleColour(moraleOf(id)), disabled: moraleOf(id) < 55,
    desc: moraleOf(id) < 55 ? `${COMPANIONS[id].name} doesn't feel that way about you. Not yet — more time together, kindness, keeping your word might change that.` : `${COMPANIONS[id].title}. You have been through the Rift and back together.` }));
  items.push({ label: 'No one — I\'ll rule alone', desc: 'Your heir will be a foundling you take in, the way the goddess once took you.' });
  let pickI = -1;
  while (pickI < 0) pickI = await list({ x: 196, y: 16, w: W - 224, items, title: 'Who do you want to spend your life with?', rows: 8 });
  const spouse = pickI < ids.length ? ids[pickI] : null;
  G.spouse = spouse;
  Sound.stop();
  await fadeOut(1.2);
  await titleCard('Five years later', 'Peace, of a kind. Long enough for other things.');
  G.age = 'adult';
  for (const m of G.party) { m.lvl = Math.max(m.lvl, 30); m.hp = maxHP(m); m.mp = maxMP(m); }
  // the proposal, somewhere that matters
  if (spouse) {
    if (!G.party.some(m => m.cls === spouse)) { const r = rosterOf(spouse); if (partyFull()) { const out = G.party[G.party.length - 1]; G.party.pop(); G.flags['in_' + out.cls] = false; rosterOf(out.cls).status = 'waiting'; rosterOf(out.cls).member = out; } recruit(spouse); void r; }
    const P = PROPOSALS[spouse];
    World.load(P.map, P.at[0], P.at[1] + 1, 'up'); World.syncFollowers();
    Sound.play('ending');
    await fadeIn(1.0);
    await World.run(async () => {
      Stage.cast(['hero', 'c:' + spouse]);
      for (const [who, line] of P.lines) await say(who === 'hero' ? G.name : who, line, who === 'hero' ? 'hero' : 'c:' + spouse);
    });
    Sound.sfx('levelup'); addMorale(spouse, 30, true);
    await fadeOut(1.0);
    // the wedding
    World.load('brookvale_chapel', 7, 6, 'up'); World.syncFollowers();
    await fadeIn(1.0);
    const officiant = spouse === 'oswin' || !G.roster.oswin || G.roster.oswin.status === 'unmet' ? ['Headmistress Crane', 'headmistress'] : ['Brother Oswin', 'c:oswin'];
    await World.run(async () => {
      Stage.cast(['hero', 'c:' + spouse, 'mother', officiant[1]]);
      await talk([
        [null, 'Brookvale\'s chapel has never held so many people. They are standing in the graveyard, on the bridge, in the river.'],
        [officiant[0], `Friends. Family. Several people who once tried to kill each other, and have agreed not to today.`, officiant[1]],
        [officiant[0], `The Dawn does not care who you were. Only what you do next. And what these two are doing next is each other.`, officiant[1]],
        ['Lady Ysolde Valen', `Come back, I told you. That was my entire instruction. …You came back with someone. That's allowed.`, 'mother'],
        [COMPANIONS[spouse].name, `I do. Obviously. Hurry up.`, 'c:' + spouse]
      ]);
      const guests = COMPANION_IDS.filter(id => id !== spouse && G.roster[id] && G.roster[id].status !== 'unmet' && G.roster[id].status !== 'gone');
      const toasts = { wren: `To the stable-girl's favourite noble. Don't make me cry, I'm in a dress.`, lyra: `I'm writing this down. For the chronicles. The true ones.`, garrick: `To the pair of you! Dunstan, stop crying. …I'm not crying. It's the incense.`, sable: `I've stolen nothing today. That's my gift. Treasure it.`, oswin: `Every blessing I've got. And I've been saving some.`, kestrel: `One trumpet. I counted. Well done.`, varek: `My people have a toast: "may the ash never find your door." It sounds better in Ashborn.` };
      for (const g of guests.slice(0, 3)) await say(COMPANIONS[g].name, toasts[g], 'c:' + g);
      if (G.flags.lucanFriend) await say('Lucan Ashcombe', `I'd like it noted that I, Lucan Ashcombe, was invited. In writing.`, 'lucan');
    });
    await fadeOut(1.2);
  } else {
    await fadeIn(0.6); await fadeOut(0.6);
  }
  // the kingdom
  const names = ['Valenmere', 'Dawnhollow', 'Ashcrest', 'Name it yourself…'];
  const ns = await (async () => { await fadeIn(0.4); const c = await list({ x: 196, y: 120, w: W - 224, items: names.map(n => ({ label: n })), title: 'What will your kingdom be called?', rows: 4 }); await fadeOut(0.3); return c; })();
  let kingdom = names[Math.max(0, ns)];
  if (ns === 3) { const e = new NameEntryScene('Valenmere'); Scenes.push(e); await fadeIn(0.3); kingdom = await e.promise; Scenes.remove(e); await fadeOut(0.3); }
  G.kingdom = kingdom;
  await titleCard('One year later', `The Kingdom of ${kingdom}`);
  G.party[0].equip.armor = 'royal'; clearHeroSprites();
  applyRealm();
  World.load('realm_palace', 11, 7, 'up'); World.syncFollowers();
  Sound.play('capital');
  await fadeIn(1.0);
  await World.run(async () => {
    Stage.cast(['hero', ...(spouse ? ['c:' + spouse] : []), 'father', 'herald']);
    await talk([
      [null, `Your lands are ${KINGDOM_LAND[G.ending] || KINGDOM_LAND.door}`],
      ['Royal Herald', `Presenting ${heroTitle() === 'Princess' ? 'Queen' : 'King'} ${G.name} of ${kingdom}${spouse ? `, and ${COMPANIONS[spouse].name}, consort` : ''}! …The petitioners are asked to please stop cheering.`, 'herald'],
      ['Lord Aldric Valen', `House Valen was never a great house. We were the house the kings sent for when something needed doing.`, 'father'],
      ['Lord Aldric Valen', `Now the kings will have to send for you. I find I do not mind that at all.`, 'father']
    ]);
  });
  // a child
  await fadeOut(1.0);
  const b = new BirthScene(spouse);
  Scenes.push(b);
  Sound.stop(); Sound.play('cradle');
  Fade.col = '#ffffff'; await fadeIn(2.0); Fade.col = '#000';
  await b.promise;
  const g = await ask(null, 'Your child is here.', ['A daughter.', 'A son.'], null, false);
  G.childGender = g === 0 ? 'girl' : 'boy';
  const cn = new NameEntryScene(g === 0 ? 'Hana' : 'Hiro');
  Scenes.push(cn);
  G.childName = await cn.promise; Scenes.remove(cn);
  b.named = G.childName;
  await say(spouse ? COMPANIONS[spouse].name : null, spouse ? `${G.childName}. …Hello, ${G.childName}. We've been waiting for you.` : `${G.childName}. You say it out loud, and it fits.`, spouse ? 'c:' + spouse : null);
  await say(null, `${G.childName} cries for a long time, and then stops, and listens — to something neither of you can hear.`);
  await fadeOut(1.4);
  Scenes.remove(b);
  // the hook: a bell, on the other side of the world
  const h = new HookScene();
  Scenes.push(h);
  Sound.play('void');
  await fadeIn(2.0);
  await talk([
    [null, 'Tokyo. Setagaya ward. A Tuesday in May, very late.'],
    [null, 'Kitazawa Inari Shrine is closed. A woman in her thirties is sitting on the steps anyway, still in her hospital scrubs, the way she does every year on this date.'],
    ['Mei', `Happy birthday to me. You still owe me a cake.`],
    [null, 'Behind her, the shrine bell rings. Once. There is no wind.'],
    [null, 'She turns round. The bell rings again — and very faintly, from somewhere that is not here, a baby is crying.'],
    ['Mei', `…${sib()}?`],
    [null, 'Grey flakes begin to fall on the shrine steps. Ash. The fox statues are looking at the gate. Between the posts of the torii, the dark has gone thin, like cloth held up to a lamp.'],
    [null, 'Mei stands up. She has been waiting for this for twenty years. She did not know it until now.'],
    [null, 'She walks towards the light.']
  ]);
  h.end = true;
  await wait(2.5);
  await fadeOut(2.0);
  Scenes.remove(h);
  G.flags.epilogueDone = true; G.flags.hasSpouse = !!spouse;
  await rollCreditsEpilogue();
  World.load('realm_palace', 11, 7, 'up'); World.syncFollowers();
  saveGame();
  Sound.play('capital');
  await fadeIn(0.8);
  toast('Game saved. Your kingdom is yours to explore.', UI.hp);
}

class BirthScene {
  constructor(spouse) { this.spouse = spouse; this.t = 0; this.named = null; this.promise = new Promise(r => this.resolve = r); this.done = false; }
  update(dt) { this.t += dt; if (!this.done && this.t > 3.4) { this.done = true; this.resolve(); } }
  draw() {
    const g = ctx.createRadialGradient(W / 2, H * 0.35, 40, W / 2, H * 0.5, 460);
    g.addColorStop(0, '#6a4a38'); g.addColorStop(1, '#1a1218');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    glow(W * 0.78, H * 0.2, 180, 'rgba(255,200,130,.35)');
    ctx.fillStyle = '#3a2a22'; for (let i = 0; i < 9; i++) ctx.fillRect(i * (W / 8) - 10, 0, 16, H * 0.22);
    // parents leaning over the cradle
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(charSprite('hero', 'right', 0), 40, 150, 220, 220);
    if (this.spouse) ctx.drawImage(charSprite('c:' + this.spouse, 'left', 0), W - 260, 150, 220, 220);
    ctx.fillStyle = '#8a5e36'; ctx.fillRect(W / 2 - 110, 310, 220, 90); ctx.fillStyle = '#e8dcc4'; ctx.fillRect(W / 2 - 100, 300, 200, 30);
    const cry = this.t < 2 && Math.floor(this.t * 6) % 2;
    ctx.drawImage(babySprite(cry), W / 2 - 70, 220, 140, 140);
    glow(W / 2, 290, 120, 'rgba(255,240,210,.18)');
    if (this.named) text(this.named, W / 2, 400, UI.gold, 22, 'center');
    FX.bloom(0.3);
  }
}
class HookScene {
  constructor() { this.t = 0; this.end = false; }
  update(dt) { this.t += dt; }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05040e'); g.addColorStop(1, '#1a1428');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // the torii
    const tx = W / 2, glowA = Math.min(1, this.t / 20);
    ctx.fillStyle = `rgba(255,245,220,${0.15 + glowA * 0.6})`; ctx.fillRect(tx - 70, 150, 140, 230);
    glow(tx, 260, 160 + glowA * 120, `rgba(255,240,210,${0.25 + glowA * 0.4})`);
    ctx.fillStyle = '#b8342a'; ctx.fillRect(tx - 110, 110, 220, 18); ctx.fillRect(tx - 96, 140, 192, 12); ctx.fillRect(tx - 90, 120, 18, 260); ctx.fillRect(tx + 72, 120, 18, 260);
    ctx.fillStyle = '#1a1010'; ctx.fillRect(tx - 124, 102, 248, 10);
    // steps and fox statues
    for (let i = 0; i < 4; i++) { ctx.fillStyle = shade('#5a5460', -i * 0.08); ctx.fillRect(tx - 180 + i * 10, 380 + i * 20, 360 - i * 20, 20); }
    for (const fx of [tx - 170, tx + 150]) { ctx.fillStyle = '#8a8478'; ctx.fillRect(fx, 300, 20, 60); ctx.fillRect(fx - 4, 290, 28, 14); ctx.fillStyle = '#b8342a'; ctx.fillRect(fx + 2, 318, 16, 5); }
    // Mei on the steps
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(charSprite('meiold', 'up', 0), tx - 40 + (this.end ? 0 : 0), this.end ? 250 : 330, 80, 80);
    // ash
    for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.6; ctx.fillStyle = i % 9 ? '#b8aaa8' : '#ffa040'; ctx.fillRect((hash2(i, 3) % W + Math.sin(TIME + i) * 10), (hash2(i, 4) % H + this.t * (12 + i % 5 * 4)) % H, 2, 2); }
    ctx.globalAlpha = 1;
    if (this.end) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.endT = (this.endT || 0) + 0.01)})`; ctx.fillRect(0, 0, W, H); }
    FX.bloom(0.4);
  }
}
async function rollCreditsEpilogue() {
  const c = new CreditsScene(G.ending);
  const cast = [`${heroTitle() === 'Princess' ? 'Queen' : 'King'} ${G.name} of ${G.kingdom}`, UI.paper, 17];
  c.lines.splice(0, 1, ['EPILOGUE — THE KINGDOM OF ' + G.kingdom.toUpperCase(), UI.gold, 22]);
  c.lines.splice(c.lines.findIndex(l => l[0] === 'Starring') + 1, 1, cast);
  if (G.spouse) c.lines.splice(c.lines.findIndex(l => l[0] === 'Starring') + 2, 0, [`${COMPANIONS[G.spouse].name}, consort`, UI.sakura, 17]);
  c.lines.splice(c.lines.length - 1, 1, ['TO BE CONTINUED', UI.sakura, 22], ['', 0, 10], [`${G.childName} and Mei will return in I GOT ISEKAI'D II`, UI.dim, 15]);
  c.total = c.lines.reduce((a, l) => a + l[2] + 16, 0);
  Scenes.push(c); Sound.stop(); Sound.play('ending');
  await fadeIn(0.8); await c.promise; await fadeOut(0.8); Scenes.remove(c); Sound.stop();
}
