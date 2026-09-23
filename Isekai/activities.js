// =====================================================================
//  activities.js : the road in senior year. New bosses on the way to
//  Malgrath, the Crown Arena, busking for coin, fishing for loot, and
//  swapping friends in and out by letter from any inn.
// =====================================================================

// ---------------------------------------------------------------- items
Object.assign(ITEMS, {
  lute:     { name: 'Travelling Lute', type: 'key', price: 180, desc: 'Five strings, one of them borrowed. Face a fountain, well or statue in a town and play for coin.' },
  rod:      { name: 'Fishing Rod', type: 'key', price: 80, desc: 'Ash pole, horsehair line. Face any water and press to cast. (Lava works too. Don\'t ask how.)' },
  perch:    { name: 'River Perch', type: 'use', price: 24, heal: 40, target: 'ally', desc: 'Grilled on a stick. Restores 40 HP.' },
  trout:    { name: 'Speckled Trout', type: 'use', price: 44, heal: 90, target: 'ally', desc: 'A handsome fish. Restores 90 HP.' },
  eel:      { name: 'Moss Eel', type: 'use', price: 50, mpheal: 25, target: 'ally', desc: 'Slippery, oddly calming. Restores 25 MP.' },
  glowfin:  { name: 'Glowfin', type: 'use', price: 96, mpheal: 55, target: 'ally', desc: 'A blind cave fish that shines. Restores 55 MP.' },
  cavecrab: { name: 'Cave Crab', type: 'use', price: 120, heal: 160, target: 'ally', desc: 'Armoured, grumpy, delicious. Restores 160 HP.' },
  emberkoi: { name: 'Ember Koi', type: 'use', price: 320, heal: 180, target: 'allies', desc: 'It lives in lava. It is still warm. Restores 180 HP to the whole party.' },
  oldboot:  { name: 'Old Boot', type: 'misc', price: 2, desc: 'A boot. Left foot. The river has had it for a long time.' },
  bottle:   { name: 'Message in a Bottle', type: 'misc', price: 30, desc: 'The note inside is too water-stained to read, except the last line: "…and tell her I went back for it."' },
  duncan:   { name: 'Duncan', type: 'key', price: 0, desc: 'The biggest trout in Brookvale. Fisher Ode named him. Fisher Ode will want to see him.' }
});
SHOPS.brookvale.push('rod'); SHOPS.fernhollow.push('rod'); SHOPS.solmere.push('lute');

// ---------------------------------------------------------------- the road to Malgrath: two more guardians
MAPS.wastes.npcs.push(
  { id: 'kharn', x: 30, y: 3, spr: 'kharn', dir: 'down', script: 'kharn', show: '!kharn&!kingDone&!v_castle', fixed: true },
  { id: 'lucanCamp', x: 6, y: 12, spr: 'lucan', dir: 'right', script: 'lucanCamp', show: 'acDone&!end_purge', wander: 1 }
);
MAPS.castle.npcs.push(
  { id: 'seris', x: 12, y: 16, spr: 'seris', dir: 'down', script: 'seris', show: '!seris&!kingDone', fixed: true },
  { id: 'serisDeal', x: 14, y: 5, spr: 'seris', dir: 'down', script: 'serisDeal', show: 'end_deal' }
);
STORY.kharn = async function () {
  const N = 'Warlord Kharn', s = 'kharn';
  await talk([
    [null, 'Before the black gate of Castle Vharn: an Ashborn in scorched plate, leaning on an axe as tall as you are. Behind him, a dozen of his guard, very still.'],
    [N, `So. The twelfth. They said you'd be small.`, s],
    [N, `I am Kharn. I burned the fields at Thornby and Harlow's Cross and the barley at Aldmere, so your people would be hungry enough to go home.`, s],
    [N, `It did not work. Your people are stubborn. I respect that. I will still split you in half.`, s]
  ]);
  if (has('varek')) await talk([['Varek', `Kharn. You gave the order at the farm.`, 'c:varek'], [N, `Varek. The deserter. I wondered where you'd crawled to. Behind a human child, I see.`, s]]);
  if (has('kestrel') && G.flags.askFinch) await say('Kestrel', `Harlow's Cross. My brother was stationed at Harlow's Cross.`, 'c:kestrel');
  if (!(await confirm(null, 'Warlord Kharn blocks the castle gate. Fight? (Suggested level 16+)'))) { await say(N, `Go and eat something. I'll wait. I've waited three hundred years.`, s); return; }
  const res = await startBattle(['kharn', 'orc'], { bg: 'wastes', music: 'boss' });
  if (res !== 'win') return;
  G.flags.kharn = true; World.refreshNpcs(true);
  await talk([
    [null, 'Kharn goes down on one knee in the ash. His guard do not move to help him; they simply lower their spears, one by one.'],
    [N, `…Go on, then. The gate's yours. Let the king judge you. I've burned enough fields to know when I've lost.`, s],
    [N, `One thing. His daughter stands before the throne. Seris. If you hurt her, you'll never get him to listen.`, s]
  ]);
  if (has('varek')) { addMorale('varek', 10); await say('Varek', `He will live. …Good. Let him see what comes next.`, 'c:varek'); }
  addItem('mega', 2); Sound.sfx('chest'); await say(null, 'His guard set down two Mega Potions at your feet, wordlessly, and step aside.');
  saveGame();
};
STORY.seris = async function () {
  const N = 'Seris', s = 'seris';
  await talk([
    [null, 'Before the throne-room door stands a woman in black plate with her father\'s horns and her mother\'s silver hair. She has not drawn her sword. She does not look as if she needs to.'],
    [N, `Seris. First Blade of Vharn. Malgrath's daughter.`, s],
    [N, `Eleven heroes have walked up this hall. I was a child for the last one. I watched him through the banisters.`, s],
    [N, `My father will talk to you. He always talks. He has never once been listened to. So before you go in, I will find out what you are.`, s]
  ]);
  const c = await ask(null, 'What do you tell her?', ['"I\'m here to end the war."', '"I\'m here to listen."', '"Stand aside."'], null, false);
  await say(N, [`Every one of them said that. Ended it how? — Show me.`, `…Nobody has ever said that. Show me you can survive long enough to do it.`, `No.`][c], s);
  if (c === 1) G.flags.serisListen = true;
  const res = await startBattle(['seris'], { bg: 'castle', music: 'boss' });
  if (res !== 'win') return;
  G.flags.seris = true; World.refreshNpcs(true);
  await talk([
    [null, 'Seris lowers her blade, and then — carefully, as if it costs her something — sheathes it.'],
    [N, G.flags.serisListen ? `You meant it. About listening. …Go in. I'll be right behind you. Not to fight.` : `You're strong. That isn't the question. Go in. Whatever you decide in there, I will remember it.`, s]
  ]);
  healParty(); Sound.sfx('heal');
  await say(null, 'She presses her palm to each of you in turn, and warmth runs back into your arms. The Ashborn blade-blessing. Your party is fully restored.');
  saveGame();
};
STORY.serisDeal = async function () { await say('Seris', pick([`The treaty holds. My father sleeps now. Did you know he never used to sleep?`, `You listened. I told the whole court: the twelfth one listened.`, `If you ever want a sparring partner, the First Blade of Vharn is very bored.`]), 'seris'); };
STORY.lucanCamp = async function () {
  const N = 'Lucan Ashcombe', s = 'lucan';
  if (!G.flags.lucanCampMet) {
    G.flags.lucanCampMet = true;
    await talk([
      [N, `Valen! Don't look so surprised. My father bought me a commission in the Eastern Relief. I asked for the worst posting. They gave me this one.`, s],
      [N, G.flags.lucanFriend ? `I never said it properly. The Archive. Thank you. Here — the relief wagons had these, and I'm very good at signing for things.` : `I still think you're an errand-runner. But you're an errand-runner who came down into the dark for me. Here.`, s]
    ]);
    addItem('mega', G.flags.lucanFriend ? 3 : 1); addItem('phoenix', 2); Sound.sfx('chest');
    await say(null, `Received ${G.flags.lucanFriend ? 3 : 1} Mega Potion${G.flags.lucanFriend ? 's' : ''} and 2 Phoenix Downs.`);
    return;
  }
  await say(N, G.ending ? pick([`It's over? …You look older. We all do.`, `I'm writing to Crane. She'll want to know you're alive. She'll pretend she doesn't.`]) : pick([`Kharn's lot come out of the ash at night. We hold the camp. You go and do the part nobody else can.`, `If you see Dorran again, tell him I finally learned to get up.`]), s);
};
{
  const bd0 = bossDoor;
  bossDoor = async function () {
    if (!G.flags.seris && !G.flags.doorOpen) { await say(null, 'Seris, First Blade of Vharn, stands before the door. Nobody passes her without her leave.'); return; }
    return bd0.apply(this, arguments);
  };
  const so0 = storyObjective;
  storyObjective = function () {
    if (G.age !== 'student' && G.flags.throughRift && !G.ending) {
      if (!G.flags.kharn) return 'Cross the Ashen Wastes to Castle Vharn, north-east. Warlord Kharn holds the gate. (Suggested level 16+)';
      if (G.map === 'castle' && !G.flags.seris) return 'Seris, Malgrath\'s daughter, guards the throne-room door at the top of the great hall. (Suggested level 18+)';
    }
    return so0();
  };
}

// ---------------------------------------------------------------- the first hero's sword arrives
{
  const enter0 = onEnterMap;
  onEnterMap = async function (id) {
    await enter0(id);
    if (G.flags.acDone && G.flags.golem && !G.flags.relicSent && !MAPS[id].interior && MAPS[id].node && id !== 'wastes') {
      G.flags.relicSent = true;
      const relic = G.heroClass === 'mage' ? 'dawnstaff' : 'dawnblade';
      await talk([
        [null, 'A rider in Academy burgundy is waiting for you, mud to the saddle-girth. He has a long bundle wrapped in oilcloth and a letter with Headmistress Crane\'s seal.'],
        ['Headmistress Crane (letter)', `Valen — the first hero's sword has been ringing every night since the Warden fell. It woke the whole library. It does not want to be here any more.`],
        ['Headmistress Crane (letter)', `I said it would want to go with you when the world needed you to be older. I dislike being right about things like this. Bring it back, if you can. Bring yourself back regardless.`],
        [null, G.heroClass === 'mage' ? 'Inside: the old sword-fitting, set by the Academy smiths on a rowan staff. It hums in your hand like a held note.' : 'Inside: the single-edged blade in black lacquer. It slides from the scabbard for you as if it had been waiting.']
      ]);
      addItem(relic); Sound.sfx('levelup');
      await say(null, `Received ${ITEMS[relic].name}. (Equip it from the menu.)`);
    }
  };
}

// ---------------------------------------------------------------- the Crown Arena (Solmere)
MAPS.solmere.npcs.push({ id: 'brask', x: 44, y: 21, spr: 'brask', dir: 'left', script: 'arena', show: 'writ' });
const ARENA = [
  { rank: 'Copper', lvl: 7, foes: ['bandit', 'thug', 'bandit'], gold: 250, items: [['hipotion', 2]], intro: 'Three brawlers from the docks. The crowd is mostly their cousins.' },
  { rank: 'Iron', lvl: 10, foes: ['poacher', 'bandit2', 'poacher'], gold: 500, items: [['tonic', 2]], intro: 'Sellswords out of the southern wars. They fight like it\'s a job, because it is.' },
  { rank: 'Silver', lvl: 13, foes: [{ id: 'dknight', elite: { name: 'The Black Stag', mult: 0.85 } }], gold: 900, items: [['dagger3', 1]], intro: 'An Ashborn knight who fights for purses now. Nobody knows his real name.' },
  { rank: 'Gold', lvl: 16, foes: ['swolf', 'swolf', 'orc'], gold: 1400, items: [['steel', 1]], intro: 'Beasts from the Wastes, caught by the Crown\'s hunters and very, very angry about it.' },
  { rank: 'Crown', lvl: 19, foes: ['galen'], gold: 3000, items: [['elixir', 3], ['mace3', 1]], intro: 'Ser Galen the Unbroken. Forty bouts. Forty wins. He bows to you, and means it.' }
];
STORY.arena = async function () {
  const N = 'Arena Master Brask', s = 'brask';
  const done = G.flags.arenaRank || 0;
  if (!G.flags.arenaMet) {
    G.flags.arenaMet = true;
    await talk([[N, `The Valen heir, in my arena! Welcome to the Crown Arena, where Solmere comes to shout.`, s], [N, `Five ranks. Copper up to Crown. Win a rank, take the purse. Lose, and you walk out on your own feet — we're civilised. Mostly.`, s]]);
    sideStart('The Crown Arena');
  }
  const items = ARENA.map((a, i) => ({
    label: `${a.rank} Rank`, right: i < done ? '✓' : `Lv ${a.lvl}+`, color: i < done ? UI.hp : i === done ? UI.gold : undefined,
    disabled: i > done && !(i === 4 && done >= 5),
    desc: i < done ? `Won. ${i === 4 ? 'Galen will fight you again for 500 G.' : ''}` : i === done ? `${a.intro}  Purse: ${a.gold} G${a.items.map(([id, n]) => `, ${n > 1 ? n + '× ' : ''}${ITEMS[id].name}`).join('')}.` : 'Win the rank below first.'
  }));
  items.push({ label: 'Leave', desc: 'Maybe later.' });
  const i = await list({ x: 196, y: 16, w: W - 224, items, title: 'The Crown Arena', rows: 6 });
  if (i < 0 || i === ARENA.length) return;
  const a = ARENA[i], rematch = i < done;
  if (rematch && i !== 4) { await say(N, `You've already won that one. The crowd wants something new.`, s); return; }
  if (!(await confirm(null, `Enter the ${a.rank} Rank? (Suggested level ${a.lvl}+)`))) return;
  await say(null, a.intro);
  const res = await startBattle(a.foes, { bg: 'yard', music: i === 4 ? 'boss' : 'battle', noRun: true, spar: true });
  healParty();
  if (res !== 'win') { await say(N, `Down you go! Up you get. The Arena will be here tomorrow.`, s); return; }
  Sound.sfx('coin');
  if (rematch) { G.gold += 500; await say(N, `Again! Again! The crowd loves you. 500 G, champion.`, s); return; }
  G.flags.arenaRank = i + 1;
  G.gold += a.gold; for (const [id, n] of a.items) addItem(id, n);
  moraleAll(4);
  await say(N, i === 4 ? `CHAMPION OF THE CROWN ARENA! Ser Galen himself is clapping! Take the purse — and your name goes on the wall!` : `The ${a.rank} Rank goes to House Valen! Your purse, as promised.`, s);
  await say(null, `Received ${a.gold} G${a.items.map(([id, n]) => ` and ${n > 1 ? n + '× ' : ''}${ITEMS[id].name}`).join('')}.`);
  if (i === 4) sideDone('The Crown Arena');
  saveGame();
};
SIDE.push({ id: 'arena', title: 'The Crown Arena', status: () => !G.flags.arenaMet ? null : (G.flags.arenaRank || 0) >= 5 ? 'done' : `Next: the ${ARENA[G.flags.arenaRank || 0].rank} Rank, with Arena Master Brask in Solmere (east side).` });

// ---------------------------------------------------------------- busking
// Face a fountain, well or statue in town with a lute. Notes fall down four lanes; hit them on the line.
const BUSK_SONGS = [
  { name: 'The Valen Road', bpm: 116, notes: 'L:E5 U:G5 D:A5 R:B5 D:A5 U:G5 L:E5 . L:E5 U:G5 D:A5 R:D6 R:B5 . D:A5 . U:G5 D:A5 R:B5 . D:A5 U:G5 L:E5 . U:G5 . L:E5 D:D5 L:E5 . . .' },
  { name: 'Ash on the Wind', bpm: 104, notes: 'D:A4 L:C5 U:E5 . R:A5 . U:E5 L:C5 D:B4 . U:D5 R:F5 . U:E5 . . D:A4 L:C5 U:E5 R:G5 R:A5 . U:E5 . L:C5 D:B4 L:C5 . D:A4 . . .' },
  { name: 'Suzu (a tune from nowhere)', bpm: 124, notes: 'U:E5 R:G5 U:E5 D:D5 L:C5 . L:C5 D:D5 U:E5 R:G5 R:A5 . U:G5 R:A5 U:G5 U:E5 D:D5 . L:C5 D:D5 U:E5 . R:G5 U:E5 D:D5 L:C5 . . L:C5 . . .' }
];
const BUSK_PAY = { solmere: 3.0, valenford: 1.5, brookvale: 1.2, village: 1.3, ironhold: 2.0, academy: 1.0, fernhollow: 1.1 };
class BuskScene {
  constructor(song) {
    this.song = song; this.t = -2.0; this.fall = 1.6; this.done = false; this.endT = 0;
    const beat = 60 / song.bpm / 2;
    this.notes = [];
    song.notes.split(' ').forEach((tok, i) => { if (tok === '.') return; const [l, p] = tok.split(':'); this.notes.push({ lane: 'LDUR'.indexOf(l), pitch: p, time: i * beat, hit: null }); });
    this.len = this.notes[this.notes.length - 1].time + 1.2;
    this.perfect = 0; this.good = 0; this.miss = 0; this.combo = 0; this.best = 0; this.crowd = 0; this.fx = [];
    this.promise = new Promise(r => this.resolve = r);
  }
  update(dt) {
    this.t += dt;
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter(f => f.t < 0.6);
    if (this.done) { this.endT += dt; if (this.endT > 1 && Input.pressed('ok')) this.resolve(this); return; }
    const dirs = ['left', 'down', 'up', 'right'];
    for (let lane = 0; lane < 4; lane++) {
      if (!Input.pressed(dirs[lane])) continue;
      let best = null, bd = 9;
      for (const n of this.notes) if (n.hit === null && n.lane === lane) { const d = Math.abs(n.time - this.t); if (d < bd) { bd = d; best = n; } }
      if (best && bd < 0.2) {
        best.hit = bd < 0.08 ? 'perfect' : 'good';
        if (best.hit === 'perfect') this.perfect++; else this.good++;
        this.combo++; this.best = Math.max(this.best, this.combo); this.crowd = Math.min(12, this.crowd + (best.hit === 'perfect' ? 0.5 : 0.3));
        if (Sound.ctx) Sound._inst('harp', Sound.freq(best.pitch), Sound.ctx.currentTime, 0.5, 0.09, 0, Sound.sfxBus);
        this.fx.push({ lane, t: 0, txt: best.hit === 'perfect' ? 'PERFECT' : 'GOOD' });
        if (this.combo % 6 === 0) Sound.sfx('coin');
      } else { this.combo = 0; Sound.sfx('cursor'); }
    }
    for (const n of this.notes) if (n.hit === null && this.t - n.time > 0.2) { n.hit = 'miss'; this.miss++; this.combo = 0; this.crowd = Math.max(0, this.crowd - 0.6); this.fx.push({ lane: n.lane, t: 0, txt: 'miss' }); }
    if (this.t > this.len) { this.done = true; Sound.sfx(this.accuracy() > 0.7 ? 'levelup' : 'cancel'); }
  }
  accuracy() { return (this.perfect + this.good * 0.6) / this.notes.length; }
  draw() {
    // an evening square, a crowd that grows as you play
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a1e4a'); g.addColorStop(0.6, '#8a4a5a'); g.addColorStop(1, '#3a2a2a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = '#1e1628'; const bw = 70 + (hash2(i, 3) % 30), bh = 100 + (hash2(i, 5) % 80); ctx.fillRect(i * 84 - 10, 250 - bh, bw, bh + 40); for (let k = 0; k < 6; k++) if (hash2(i, k) % 2) { ctx.fillStyle = 'rgba(255,210,140,.65)'; ctx.fillRect(i * 84 + 8 + (k % 3) * 18, 262 - bh + Math.floor(k / 3) * 22, 7, 9); } }
    ctx.fillStyle = '#4a3a3a'; ctx.fillRect(0, 290, W, 190);
    glow(W / 2, 330, 180, 'rgba(255,190,110,.25)');
    const n = Math.floor(this.crowd) + 2, folkK = ['villager', 'woman2', 'kid', 'noble', 'villager3', 'farmer', 'woman', 'kid2', 'noblewoman', 'elder', 'hunter2', 'villager2', 'merchant', 'guard'];
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), x = W / 2 + side * (96 + k * 40), y = 262 + (k % 2) * 22;
      const bounce = this.combo > 4 ? Math.abs(Math.sin(TIME * 8 + i)) * 5 : 0;
      ctx.drawImage(charSprite(folkK[i % folkK.length], side > 0 ? 'left' : 'right', 0), Math.round(x - 32), Math.round(y - bounce), 64, 64);
    }
    ctx.drawImage(charSprite('hero', 'down', Math.floor(TIME * 4) % 2 ? 1 : 0), W / 2 - 48, 250, 96, 96);
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(W / 2 + 40, 330, 22, 10); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(W / 2 + 38, 328, 26, 3);    // the hat
    // lanes
    const lx = i => W / 2 - 150 + i * 100, hitY = 196;
    ctx.fillStyle = 'rgba(10,6,20,.55)'; ctx.fillRect(W / 2 - 200, 0, 400, 232);
    const arrows = ['◀', '▼', '▲', '▶'], cols = ['#f28fad', '#6fb7f2', '#7ed36f', '#f2c94c'];
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx(i), hitY, 20, 0, 7); ctx.stroke();
      text(arrows[i], lx(i), hitY - 10, 'rgba(255,255,255,.4)', 18, 'center');
    }
    for (const nt of this.notes) {
      if (nt.hit === 'perfect' || nt.hit === 'good') continue;
      const dy = (nt.time - this.t) / this.fall;
      if (dy > 1.1 || dy < -0.3) continue;
      const y = hitY - dy * 190;
      ctx.globalAlpha = nt.hit === 'miss' ? 0.3 : 1;
      ctx.fillStyle = cols[nt.lane]; ctx.beginPath(); ctx.arc(lx(nt.lane), y, 16, 0, 7); ctx.fill();
      text(arrows[nt.lane], lx(nt.lane), y - 10, UI.ink, 18, 'center');
      ctx.globalAlpha = 1;
    }
    for (const f of this.fx) { ctx.globalAlpha = 1 - f.t / 0.6; text(f.txt, lx(f.lane), hitY - 50 - f.t * 40, f.txt === 'miss' ? UI.bad : f.txt === 'PERFECT' ? UI.gold : UI.paper, 14, 'center'); }
    ctx.globalAlpha = 1;
    text('♪ ' + this.song.name, 16, 244, UI.paper, 14, 'left');
    if (this.combo > 2) text(`${this.combo} combo!`, W / 2 + 190, 40, UI.sakura, 16, 'right');
    if (this.t < 0) text(this.t < -1 ? 'Ready…' : 'Play!', W / 2, 110, UI.gold, 26, 'center');
    text(Controls.mode === 'touch' ? 'Press the D-pad direction as each note reaches its circle' : 'Arrow keys / WASD as each note reaches its circle', W / 2, H - 26, UI.dim, 13, 'center', false);
    if (this.done) {
      drawWindow(W / 2 - 170, 120, 340, 150);
      text(`${Math.round(this.accuracy() * 100)}% — ${this.accuracy() > 0.9 ? 'Magnificent!' : this.accuracy() > 0.7 ? 'The crowd loved it.' : this.accuracy() > 0.4 ? 'Polite applause.' : 'A dog howled along.'}`, W / 2, 140, UI.gold, 18, 'center');
      text(`Perfect ${this.perfect}  ·  Good ${this.good}  ·  Miss ${this.miss}`, W / 2, 176, UI.paper, 15, 'center', false);
      text(`Best combo ${this.best}`, W / 2, 204, UI.dim, 14, 'center', false);
      if (this.endT > 1) text(`Press ${Controls.label('ok')}`, W / 2, 238, UI.dim, 13, 'center', false);
    }
    FX.bloom(0.25);
  }
}
async function busk() {
  G.busk = G.busk || {};
  const last = G.busk[G.map];
  if (last !== undefined && G.playTime - last < 150) { await say(null, 'The crowd here has heard your set already. Give it a while — or try another town.'); return; }
  const songs = BUSK_SONGS.filter((s, i) => i < 2 || G.flags.bellRung || itemCount('suzu') || G.flags.acDone);
  const si = await list({ x: 196, y: 16, w: W - 224, items: songs.map(s => ({ label: s.name, right: `${s.bpm} bpm`, desc: s.name.includes('nowhere') ? 'A melody you have known all your life and never learned. People stop walking when you play it.' : 'A tavern favourite.' })).concat([{ label: 'Not now' }]), title: 'Busk — pick a tune', rows: 5 });
  if (si < 0 || si >= songs.length) return;
  Sound.stop();
  const sc = new BuskScene(songs[si]);
  await fadeOut(0.3); Scenes.push(sc); await fadeIn(0.3);
  await sc.promise;
  await fadeOut(0.3); Scenes.remove(sc); Sound.play(musicFor(G.map)); await fadeIn(0.3);
  G.busk[G.map] = G.playTime;
  const acc = sc.accuracy();
  let pay = (sc.perfect * 6 + sc.good * 3 + sc.best) * (BUSK_PAY[G.map] || 1);
  if (songs[si].name.includes('nowhere')) pay *= 1.3;
  const notes = [];
  if (has('sable')) { pay *= 1.25; notes.push(['Sable', `I "passed the hat". The hat did very well. Don't ask about the hat.`]); }
  if (has('lyra')) { pay *= 1.15; notes.push(['Lyra', `I sang the second verse. In Elvish. Nobody understood it and three people cried.`]); }
  if (has('garrick')) { pay *= 1.1; notes.push(['Garrick', `Drummed on a barrel. Dwarves have rhythm. It's the only thing we'll admit to.`]); }
  if (has('wren')) notes.push(['Wren', `I clapped. On the beat, mostly.`]);
  if (has('varek')) { pay *= G.ending === 'deal' ? 1.1 : 0.9; notes.push(['Varek', G.ending === 'deal' ? `A child asked to touch my horns. I let her. We made more money.` : `Some of them crossed the street when they saw me. The rest paid double, I think out of guilt.`]); }
  pay = Math.round(pay * (0.4 + acc));
  G.gold += pay; Sound.sfx('coin');
  await say(null, `The hat holds ${pay} G.`);
  if (notes.length) { const [who, line] = pick(notes); await say(who, line, 'c:' + who.toLowerCase()); }
  if (acc > 0.9) {
    const gift = pick(['hiether', 'phoenix', 'hipotion', 'tonic']);
    addItem(gift); await say(null, `A noblewoman at the back tucks something into the hat as she leaves: a ${ITEMS[gift].name}.`);
  }
  moraleAll(2, true);
}

// ---------------------------------------------------------------- fishing
const CATCH = {
  fresh: [['perch', 30], ['trout', 22], ['eel', 12], ['oldboot', 8], ['bottle', 3], ['gold', 10], ['potion', 6], ['ether', 4], ['phoenix', 2], ['hiether', 1.5], ['elixir', 0.4]],
  forest: [['ranger', 0.8], ['bow2', 0.8], ['dagger2', 0.6]],
  cave: [['glowfin', 26], ['cavecrab', 18], ['oldboot', 6], ['gold', 14], ['hipotion', 8], ['phoenix', 4], ['ssword', 1], ['chain', 1], ['elixir', 0.8]],
  lava: [['emberkoi', 30], ['gold', 22], ['mega', 8], ['tonic', 8], ['hiether', 6], ['gsword2', 1], ['star', 1], ['dragon', 0.6], ['elixir', 2]]
};
const FISH_DIFF = { perch: 0.25, trout: 0.5, eel: 0.65, glowfin: 0.55, cavecrab: 0.7, emberkoi: 0.85, duncan: 1 };
function rollCatch() {
  const m = MAPS[G.map], lava = World.tile(...facing()) === 'L';
  if (lava) return weighted(CATCH.lava);
  if (m.theme === 'cave' || G.map === 'mine') return weighted(CATCH.cave);
  if (G.map === 'brookvale' && !G.flags.duncan && Math.random() < 0.12) return 'duncan';
  const t = CATCH.fresh.slice();
  if (m.theme === 'forestv' || G.map === 'forest' || G.map === 'acwoods') t.push(...CATCH.forest);
  return weighted(t);
}
function facing() { const p = World.player, [dx, dy] = DIRS[p.dir]; return [p.x + dx, p.y + dy]; }
class FishScene {
  constructor(lava) {
    this.lava = lava; this.phase = 'wait'; this.t = 0; this.waitT = rand(1.5, 4.5); this.nib = 0;
    this.catchId = rollCatch(); this.diff = FISH_DIFF[this.catchId] || 0.4;
    this.zone = 0.2; this.zv = 0; this.zh = 0.3 - this.diff * 0.1;
    this.fish = 0.5; this.ft = 0.5; this.prog = 0.3; this.result = null;
    this.promise = new Promise(r => this.resolve = r);
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'wait') {
      if (Math.random() < dt * 0.8) this.nib = 0.25;
      this.nib = Math.max(0, this.nib - dt);
      if (Input.pressed('cancel')) { this.result = 'quit'; this.phase = 'end'; this.t = 0; }
      if (this.t > this.waitT) { this.phase = 'bite'; this.t = 0; Sound.sfx('encounter'); }
      return;
    }
    if (this.phase === 'bite') {
      if (Input.pressed('ok')) { this.phase = 'reel'; this.t = 0; Sound.sfx('swing'); return; }
      if (this.t > 0.9) { this.result = 'lost'; this.phase = 'end'; this.t = 0; Sound.sfx('cancel'); }
      return;
    }
    if (this.phase === 'reel') {
      // the fish darts about; hold to lift your catch-zone, let go to drop it
      if (Math.abs(this.fish - this.ft) < 0.03 || Math.random() < dt * (0.6 + this.diff * 1.8)) this.ft = rand(0, 1);
      this.fish += (this.ft - this.fish) * dt * (1.2 + this.diff * 3);
      this.zv += (Input.held('ok') ? 2.6 : -2.2) * dt;
      this.zv *= 0.92;
      this.zone = clamp(this.zone + this.zv * dt * 1.6, 0, 1 - this.zh);
      if (this.zone === 0 || this.zone === 1 - this.zh) this.zv *= -0.3;
      const inside = this.fish >= this.zone && this.fish <= this.zone + this.zh;
      this.prog = clamp(this.prog + (inside ? 0.32 : -0.22 - this.diff * 0.08) * dt, 0, 1);
      if (this.prog >= 1) { this.result = 'caught'; this.phase = 'end'; this.t = 0; Sound.sfx('levelup'); }
      else if (this.prog <= 0) { this.result = 'lost'; this.phase = 'end'; this.t = 0; Sound.sfx('cancel'); }
      return;
    }
    if (this.phase === 'end' && this.t > 0.6) this.resolve(this);
  }
  draw() {
    const bx = W / 2 + 150, by = 70, bh = 260;
    // the water, looking down from the bank
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (this.lava) { g.addColorStop(0, '#3a0a04'); g.addColorStop(1, '#c84a14'); } else { g.addColorStop(0, '#1a3a5a'); g.addColorStop(1, '#2a6a8a'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) { const y = (hash2(i, 4) % H + TIME * 12) % H, x = hash2(i, 7) % W; ctx.fillStyle = this.lava ? 'rgba(255,200,80,.3)' : 'rgba(255,255,255,.18)'; ctx.fillRect(x, y, 18 + i % 20, 2); }
    // line and bobber
    const bob = this.phase === 'bite' ? Math.sin(TIME * 40) * 6 + 8 : this.nib > 0 ? 4 : Math.sin(TIME * 2) * 2;
    ctx.strokeStyle = 'rgba(240,240,220,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(60, 0); ctx.quadraticCurveTo(160, 120, 220, 240 + bob); ctx.stroke();
    ctx.fillStyle = '#e5534b'; ctx.beginPath(); ctx.arc(220, 240 + bob, 8, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(214, 232 + bob, 12, 4);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(220, 250, 22 + Math.sin(TIME * 3) * 4, 6, 0, 0, 7); ctx.stroke();
    if (this.phase === 'bite') { text('!', 220, 180, UI.gold, 44, 'center'); text(`Press ${Controls.label('ok')}!`, 220, 290, UI.paper, 18, 'center'); }
    if (this.phase === 'wait') text(`Waiting for a bite…   (${Controls.label('cancel')} to reel in)`, W / 2, H - 40, UI.dim, 14, 'center', false);
    if (this.phase === 'reel' || (this.phase === 'end' && this.result === 'caught')) {
      drawWindow(bx - 30, by - 20, 110, bh + 40, 0.9);
      ctx.fillStyle = '#10324a'; ctx.fillRect(bx, by, 30, bh);
      const zy = by + bh - (this.zone + this.zh) * bh;
      ctx.fillStyle = 'rgba(126,211,111,.55)'; ctx.fillRect(bx, zy, 30, this.zh * bh);
      const fy = by + bh - this.fish * bh;
      ctx.fillStyle = this.lava ? '#ff8030' : '#bfe6ff'; ctx.beginPath(); ctx.ellipse(bx + 15, fy, 11, 6, 0, 0, 7); ctx.fill(); ctx.fillRect(bx + 24, fy - 5, 4, 10);
      ctx.fillStyle = '#20182a'; ctx.fillRect(bx + 44, by, 12, bh);
      ctx.fillStyle = this.prog > 0.6 ? UI.hp : this.prog > 0.25 ? UI.gold : UI.bad; ctx.fillRect(bx + 44, by + bh * (1 - this.prog), 12, bh * this.prog);
      text(`Hold ${Controls.label('ok')} to raise the green zone. Keep the fish inside it.`, W / 2 - 60, H - 40, UI.paper, 14, 'center', false);
    }
    if (this.phase === 'end') text(this.result === 'caught' ? 'Got it!' : this.result === 'quit' ? 'You reel in.' : 'It got away…', W / 2 - 60, 120, this.result === 'caught' ? UI.gold : UI.dim, 26, 'center');
  }
}
async function fish() {
  const lava = World.tile(...facing()) === 'L';
  const sc = new FishScene(lava);
  Sound.sfx('swing');
  await fadeOut(0.2); Scenes.push(sc); await fadeIn(0.2);
  await sc.promise;
  await fadeOut(0.2); Scenes.remove(sc); await fadeIn(0.2);
  if (sc.result !== 'caught') { if (sc.result === 'lost') await say(null, pick(['Whatever it was, it has better things to do.', 'The line goes slack. Something laughs at you, in fish.'])); return; }
  const id = sc.catchId;
  if (id === 'gold') { const g = irand(40, 140) * (lava ? 3 : 1); G.gold += g; Sound.sfx('coin'); await say(null, `You haul up a waterlogged purse. ${g} G inside.`); return; }
  addItem(id); Sound.sfx('pickup');
  if (id === 'duncan') { G.flags.duncan = true; await say(null, 'Something enormous breaks the surface: a speckled trout the length of your arm, with a torn fin and a look of profound betrayal. This must be Duncan.'); return; }
  G.fishCaught = (G.fishCaught || 0) + 1;
  await say(null, `You caught ${/^[aeiou]/i.test(ITEMS[id].name) ? 'an' : 'a'} ${ITEMS[id].name}!${ITEMS[id].type === 'weapon' || ITEMS[id].type === 'armor' ? ' Somebody lost this a long time ago.' : ''}`);
}

// ---------------------------------------------------------------- the lute and the rod
{
  const bvFish = MAPS.brookvale.npcs.find(n => n.id === 'bvFish'); if (bvFish) bvFish.script = 'fisherOde';
  const bard = MAPS.village.npcs.find(n => n.id === 'alBard'); if (bard) bard.script = 'bard';
}
STORY.fisherOde = async function () {
  const N = 'Fisher Ode', s = 'hunter2';
  if (itemCount('duncan')) {
    removeItem('duncan');
    await talk([[N, `…DUNCAN. You caught DUNCAN. Twelve years I've been after him.`, s], [N, `Put him back. No — let me look at him. …Right. Put him back. A fish like that deserves to be a story.`, s]]);
    await say(null, 'You let Duncan go. He swims off with enormous dignity.');
    addItem('bow3'); G.gold += 500; Sound.sfx('levelup');
    await say(N, `Here. My old Windpiercer, and every coin I bet against anyone catching him. You've earned both.`, s);
    await say(null, 'Received the Windpiercer and 500 G.');
    return;
  }
  if (!itemCount('rod')) {
    await talk([[N, `You've got the look of someone who's never held a rod. Here — take my spare.`, s], [N, `Face the water and cast. When the bobber dances, strike. Then hold, let go, hold — keep the fish in the green. Rivers give up more than fish, if you're patient.`, s]]);
    addItem('rod'); Sound.sfx('chest'); await say(null, 'Received a Fishing Rod. Face any water and press to fish.');
    return;
  }
  await say(N, pick([`River's full of trout this year. And something big. I've named it Duncan.`, `Caught ${G.fishCaught || 0}, have you? Keep at it.`, `Mine lake's got glowfin. The Wastes have… well. Don't fish in lava. I can't stop you, but don't.`]), s);
};
STORY.bard = async function () {
  const N = 'Wandering Bard', s = 'villager2';
  if (!itemCount('lute') && G.age === 'youth') {
    await talk([[N, `You! The Valen heir! You've got a face for the stage, you know. Tragic. Brave. Slightly lost.`, s], [N, `Take my spare lute. Stand by any fountain or well or statue in a town and play. People pay for a story, and you ARE a story.`, s]]);
    addItem('lute'); Sound.sfx('chest');
    await say(null, 'Received a Travelling Lute. Face a fountain, well or statue in a town to busk.');
    return;
  }
  await say(N, pick([`♪ The Valen child went into the dark… ♪ I'm still working on the second verse.`, `Solmere pays best. Fat purses, short attention.`, `Play the sad one. They always pay more for the sad one.`]), s);
};
{
  const int0 = WorldScene.prototype.interact;
  WorldScene.prototype.interact = function () {
    const [x, y] = facing(), t = this.tile(x, y);
    if (!this.npcAt(x, y) && !this.followerAt(x, y)) {
      if ((t === '~' || t === 'L') && itemCount('rod') && !this.map.interior) { this.run(() => fish()); return; }
      if ('60£'.includes(t) && itemCount('lute') && !this.map.interior && BUSK_PAY[G.map]) {
        this.run(async () => { if (await confirm(null, 'A good spot to busk. Play for coin?')) await busk(); else await say(null, t === '6' ? 'The fountain throws up light along with the water.' : t === '0' ? 'The well is deep. You can hear water a long way down.' : 'A statue. Someone has left flowers at its feet.'); });
        return;
      }
    }
    return int0.call(this);
  };
}

// ---------------------------------------------------------------- letters from the inn: swap a friend in by morning
function waitingFriends() { return COMPANION_IDS.filter(id => G.roster[id] && G.roster[id].status === 'waiting'); }
async function writeToFriend() {
  const ids = waitingFriends();
  const i = await list({
    x: 196, y: 16, w: W - 224, rows: 6, title: 'Write to…',
    items: ids.map(id => ({ label: COMPANIONS[id].name, right: `Lv ${G.roster[id].member ? G.roster[id].member.lvl : '?'}  ${moraleWord(moraleOf(id))}`, color: moraleColour(moraleOf(id)), desc: `${COMPANIONS[id].title}, waiting at ${COMPANIONS[id].homeName}.  + ${COMPANIONS[id].pros}  − ${COMPANIONS[id].cons}` }))
  });
  if (i < 0) return null;
  const want = ids[i];
  let out = null;
  if (partyFull()) {
    const others = companionsInParty();
    const j = await list({ x: 196, y: 16, w: W - 224, rows: 5, title: `Who goes home so ${COMPANIONS[want].name} can join?`, items: others.map(m => ({ label: m.name, right: moraleWord(moraleOf(m.cls)), color: moraleColour(moraleOf(m.cls)), desc: `${m.name} takes the morning carrier back to ${COMPANIONS[m.cls].homeName}, and will wait there. (No hard feelings — it was your letter that asked.)` })) });
    if (j < 0) return null;
    out = others[j];
  }
  return { want, out };
}
async function doSwap(sw) {
  if (!sw) return;
  const { want, out } = sw;
  await say(null, `You write to ${COMPANIONS[want].name} by candlelight, and leave the letter with the innkeeper for the night rider.`);
  return async () => {
    if (out) {
      const r = rosterOf(out.cls);
      G.party.splice(G.party.indexOf(out), 1); G.flags['in_' + out.cls] = false; r.member = out; r.status = 'waiting';
      G.flags[out.cls + 'Waits'] = true;
    }
    recruit(want);
    World.syncFollowers();
    await say(null, `By morning, ${COMPANIONS[want].name} is at the inn door, travel-stained and grinning.${out ? ` ${out.name} has already set off for ${COMPANIONS[out.cls].homeName}, with a wave.` : ''}`);
    const hi = { wren: `You wrote! I came as fast as the horse would let me.`, lyra: `Your handwriting is terrible. I came anyway.`, garrick: `A letter! From a Valen! I'm framing it. After we're done.`, sable: `I read your letter six times. Don't read into that.`, oswin: `I brought bandages. Your letter had that tone.`, kestrel: `I followed the road you'd have taken. You're predictable.`, varek: `You sent for an Ashborn. People will talk. Let them.` }[want];
    if (hi) await say(COMPANIONS[want].name, hi, 'c:' + want);
    toast(`${COMPANIONS[want].name} joined the party. Turn timer: ${turnTime()}s.`, UI.gold);
  };
}
// the inn: rest, or write to a friend and rest
innScene = async function (name, spr, free) {
  const cost = free ? 0 : 8 + heroLevel() * 3;
  const canWrite = waitingFriends().length > 0 && G.age !== 'student';
  const items = [{ label: free ? 'Rest by the fire' : `Rest for the night`, right: free ? 'free' : `${cost} G`, desc: 'Restores everyone and saves your game.' }];
  if (canWrite) items.push({ label: 'Write to a friend, then rest', right: free ? 'free' : `${cost} G`, desc: 'Send a letter tonight. By morning they\'ll be here, and whoever they replace heads home to wait for you.' });
  items.push({ label: 'Not now' });
  await say(name, free ? 'Rest by the fire? It\'s free, and I\'ll keep watch.' : `A warm bed for the night is ${cost} G.`, spr);
  const c = await list({ x: 196, y: 16, w: W - 224, items, title: name, rows: 4 });
  if (c < 0 || c === items.length - 1) return;
  if (G.gold < cost) { await say(name, 'Ah… you\'re a little short. Come back when you have the coin.', spr); return; }
  let morning = null;
  if (items[c].label.startsWith('Write')) { const sw = await writeToFriend(); if (!sw) return; morning = await doSwap(sw); }
  G.gold -= cost;
  await fadeOut(0.6);
  Sound.play('void');
  healParty();
  await wait(1.2);
  if (morning) await (async () => { await fadeIn(0.4); await morning(); await fadeOut(0.3); })();
  healParty();
  saveGame();
  Sound.stop();
  Sound.play(MAPS[G.map].music);
  await fadeIn(0.6);
  Sound.sfx('save');
  await say(name, free ? 'You look much better. The fire\'s a good friend. (Game saved.)' : 'Good morning! You look well rested. (Game saved.)', spr);
  await afterRest();
};
