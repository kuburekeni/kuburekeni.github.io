// =====================================================================
//  prologue.js : a longer beginning, and more of who you were
//   1. Tokyo, morning: breakfast with Mum and Mei, a call from Dad in
//      Osaka, the family shrine, a birthday promise
//   2. Seiryo High: homeroom, a pop quiz, Daichi's challenge, lunch on
//      the roof with Aoi — and a little brass bell on your school bag
//   3. then the afternoon you already know: the cake, the shrine, the crossing
//   4. the Void: Aetheria tells you more, and offers a gift for the road
//      (courage, insight, or kinship — it stays with you all game)
//   5. House Valen: the Festival of First Light, the day before your
//      training — a lost kite, a puppet show, sky lanterns with Mother
// =====================================================================
Object.assign(CHARS, {
  mum:     { pal: { h: '#1e1618', s: SK, c: '#c87a8a', d: '#9a5a6a', t: '#f0ece0', p: '#3a3a55', b: '#2a2020' }, hair: 'bun', outfit: 'dress', mods: ['girl', 'skirt', 'apron'] },
  teacher: { pal: { h: '#2a2026', s: SK2, c: '#4a5a7a', d: '#2e3a5a', t: '#e8e8f0', p: '#2e3a5a', b: '#1a1418', n: '#8a2a3a' }, hair: 'short', outfit: 'noble', mods: ['tie'] },
  classmate:{ pal: { h: '#4a2a1a', s: SK, c: '#2b3a67', d: '#1b2440', p: SK, b: '#2a2020', n: '#b83a4a' }, hair: 'bun', outfit: 'uniform', mods: ['girl', 'skirt', 'tie'] },
  classmate2:{ pal: { h: '#16121c', s: SK3, c: '#2b3a67', d: '#1b2440', p: '#1b2440', b: '#111', n: '#b83a4a' }, hair: 'twists', outfit: 'uniform', mods: ['tie'] },
  puppeteer:{ pal: { h: '#e8c060', s: SK2, c: '#8a3a8a', d: '#5a2460', t: '#f2c94c', p: '#3a2a3a', b: '#1a1010' }, hair: 'long', outfit: 'cloak', mods: ['beard'] }
});
// a blackboard on a classroom wall, and a TV stand for the flat
const PRO_TILES = { 'Þ': { solid: 1, base: 'V' }, 'þ': { solid: 1, base: 'o' } };
for (const k in PRO_TILES) SOLID.add(k);
{
  const dt0 = drawTile;
  drawTile = function (x, ch, theme, v, frame, mask, up, under) {
    if (!PRO_TILES[ch]) return dt0(x, ch, theme, v, frame, mask, up, under);
    dt0(x, PRO_TILES[ch].base, theme, v, 0, mask, up, '');
    const R = (X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
    if (ch === 'Þ') { R(0, 6, 32, 20, '#5a3418'); R(0, 8, 32, 16, '#2e4a3a'); for (let i = 0; i < 4; i++) R(3 + (v * 5 + i * 7) % 24, 11 + (i % 3) * 4, 5 + (i % 2) * 3, 1, '#d8e0d8'); R(0, 24, 32, 2, '#8a6a40'); R(6, 23, 4, 1, '#ffffff'); }
    else { R(4, 18, 24, 10, '#3a2a1e'); R(4, 18, 24, 2, '#5a4430'); R(7, 6, 18, 12, UI.ink); R(8, 7, 16, 10, '#2a3a5a'); R(8, 7, 16, 3, '#4a6a9a'); R(15, 17, 2, 2, UI.ink); }
  };
}

// ---------------------------------------------------------------- the flat in Setagaya
const TK_HOME_ROWS = (() => {
  const b = MB(18, 12, 'o', 41); b.border('V');
  for (const x of [3, 7, 13]) b.set(x, 0, 'y');
  b.set(10, 0, 'é');
  // the kitchen
  b.set(1, 1, 'ï').set(2, 1, 'Ñ').set(3, 1, 'Ñ').set(4, 1, 'h').set(1, 2, 'Ñ');
  b.set(5, 4, 't').set(6, 4, 't').set(4, 4, 'u').set(7, 4, 'u');
  // the living room
  b.rect(9, 3, 5, 3, 'â'); b.set(10, 1, 'þ').set(12, 5, 'u').set(10, 5, 'u').set(16, 1, 'ç');
  // the hall and the bedrooms
  b.rect(1, 7, 16, 1, 'V'); b.set(4, 7, 'o').set(12, 7, 'o').set(8, 7, 'o');
  b.rect(8, 8, 1, 3, 'V');
  b.set(1, 8, '{').set(1, 9, '{').set(5, 8, 'b').set(6, 8, 'ô').set(3, 10, 'û');                // your room
  b.set(16, 8, '{').set(16, 9, '{').set(10, 8, 'ô').set(13, 8, 'ç').set(11, 10, 't');          // Mei's room
  b.set(15, 1, 'è');   // the family shrine shelf
  b.set(8, 11, 'x').set(9, 11, 'x');
  b.set(8, 10, 'o').set(9, 10, 'o').set(9, 8, 'o').set(9, 9, 'o');
  return b.rows();
})();
const TK_CLASS_ROWS = (() => {
  const b = MB(20, 14, 'o', 42); b.border('V');
  for (let x = 2; x < 18; x += 3) b.set(x, 0, 'y');
  b.rect(6, 0, 8, 1, 'Þ');
  b.set(9, 2, 'ú').set(10, 2, 'ú');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) { const x = 3 + col * 4, y = 5 + row * 3; b.set(x, y, 't').set(x + 1, y, 't'); b.set(x, y + 1, 'u').set(x + 1, y + 1, 'u'); }
  b.rect(1, 12, 18, 1, 'h'); b.set(9, 12, 'o'); b.set(10, 12, 'o');
  b.set(18, 1, 'ç').set(1, 1, 'ç');
  b.set(9, 13, 'x').set(10, 13, 'x');
  return b.rows();
})();
Object.assign(MAPS, {
  tk_home: {
    name: 'Home — Setagaya', music: 'tokyo', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(255,230,190,.10)', encounters: null, tutorial: true,
    rows: TK_HOME_ROWS, pois: [], chests: [],
    npcs: [
      { id: 'mum', x: 2, y: 2, spr: 'mum', dir: 'down', script: 'tkMum' },
      { id: 'meiHome', x: 6, y: 3, spr: 'mei', dir: 'down', script: 'tkMei' }
    ],
    warps: [], triggers: [{ x: 8, y: 10, w: 2, h: 1, script: 'tkLeaveHome' }], signs: {}
  },
  tk_class: {
    name: 'Seiryo High — Class 2-B', music: 'academy', theme: 'interior', edge: 'V', interior: true, ambient: 'rgba(230,240,255,.10)', encounters: null, tutorial: true,
    rows: TK_CLASS_ROWS, pois: [], chests: [],
    npcs: [
      { id: 'teacher', x: 9, y: 3, spr: 'teacher', dir: 'down', script: 'tkTeacher' },
      { id: 'aoiC', x: 8, y: 7, spr: 'aoi', dir: 'up', script: 'tkAoiClass' },
      { id: 'daichiC', x: 12, y: 10, spr: 'daichi', dir: 'up', script: 'tkDaichiClass' },
      { id: 'cm1', x: 4, y: 7, spr: 'classmate', dir: 'up', script: 'tkClassmate1' },
      { id: 'cm2', x: 16, y: 4, spr: 'classmate2', dir: 'left', script: 'tkClassmate2', wander: 1 },
      { id: 'cm3', x: 2, y: 10, spr: 'student', dir: 'right', script: 'tkClassmate3' }
    ],
    warps: [], triggers: [{ x: 9, y: 12, w: 2, h: 1, script: 'tkLeaveClass' }], signs: {}
  }
});
TEX.MAP.tk_home = { floor: 'birch', iwall: 'plaster' };
TEX.MAP.tk_class = { floor: 'birch', iwall: 'plaster' };

// ---------------------------------------------------------------- the new start
LATE.push(() => { newGame = async function () {
  await fadeOut(0.4);
  Scenes.stack.length = 0;
  Sound.stop();
  const sexScene = new ChoiceCardScene('Who are you?', ['A boy', 'A girl'], 'You will choose a new face later, too.');
  Scenes.push(sexScene);
  await fadeIn(0.4);
  const sx = await sexScene.promise;
  Scenes.remove(sexScene);
  const ns = new NameEntryScene(sx === 0 ? 'Kaito' : 'Hana');
  Scenes.push(ns);
  const name = await ns.promise;
  Scenes.remove(ns);
  startNewGame(name, sx === 0 ? 'boy' : 'girl');
  G.hairStyle = sx === 0 ? 'short' : 'long';
  tokyoLook();
  clearHeroSprites();
  await fadeOut(0.3);
  // who you were
  const ls = new LookScene('tokyo'); Scenes.push(ls);
  Sound.play('tokyo');
  await fadeIn(0.5);
  await ls.promise;
  await fadeOut(0.5);
  Scenes.remove(ls);
  G.skin = tokyoLook().skin;
  clearHeroSprites();
  // morning
  startWorld();
  World.load('tk_home', 9, 9, 'up');
  await titleCard('Tokyo', 'Setagaya ward — a Tuesday in May, 07:10');
  await fadeIn(1.0);
  Sound.play('tokyo');
  await World.run(async () => {
    await say(null, `Your name is ${G.name}. You are sixteen. Your last exam is in two weeks, and your sister Mei turns thirteen today.`);
    await say(null, 'The flat smells of miso and burnt toast. Mum is in the kitchen. Mei is at the table, pretending she is not excited about today.');
    await say(null, `TIP: Walk up to people and press ${Controls.label('ok')} to talk. The front door is south.`);
  });
}; });
{
  const so0 = storyObjective;
  storyObjective = function () {
    if (G.map === 'tk_home') {
      if (!G.flags.tk_mum) return 'Say good morning to Mum in the kitchen.';
      if (!G.flags.tk_mei) return 'Mei is at the table. It\'s her birthday.';
      if (!G.flags.tk_dad) return 'Your phone is buzzing in your room (west). It\'s Dad.';
      if (!G.flags.tk_altar) return 'Light incense at the family shrine shelf, by the window in the living room.';
      return 'Leave for school. The front door is south.';
    }
    if (G.map === 'tk_class') {
      if (!G.flags.tk_quiz) return 'Take your seat. Ms. Tanabe is waiting to begin.';
      if (!G.flags.tk_daichiC) return 'Daichi wants a word, at the back of the room.';
      return 'Lunch. Aoi has gone up to the roof. The door is south.';
    }
    if (G.age === 'child' && !G.flags.festDone) {
      if (!G.flags.fest_kite) return 'The Festival of First Light! Bram has lost his kite somewhere in town.';
      if (!G.flags.fest_puppets) return 'There is a puppet show on the market square.';
      return 'Dusk. Mother is waiting at the market square to release the lanterns.';
    }
    return so0();
  };
}
Object.assign(STORY, {
  async tkMum() {
    const N = 'Mum', s = 'mum';
    if (!G.flags.tk_mum) {
      G.flags.tk_mum = true;
      await talk([
        [N, `Morning, sleepyhead. Toast's burnt. It's always burnt. The toaster hates this family.`, s],
        [N, `Listen — I'm on a late shift at the hospital, so I need you to pick up Mei's cake on the way home. Strawberry shortcake, from the Family Mart. She'll pretend she doesn't care. She cares.`, s],
        [N, `And stop at Kitazawa shrine for me, would you? Make a wish for her. Your grandmother always did, on our birthdays.`, s],
        [N, `Here. Lunch money. Don't spend it all on melon bread.`, s]
      ]);
      G.gold += 800;
      await say(null, 'Received ¥800.');
      return;
    }
    await say(N, pick([`Cake, shrine, home by seven. Don't make me write it on your hand.`, `Your dad called last night. He's trying to get the early train on Friday.`, `You've got your father's frown. Stop it, you'll give yourself wrinkles.`]), s);
  },
  async tkMei() {
    const N = 'Mei', s = 'mei';
    if (!G.flags.tk_mei) {
      G.flags.tk_mei = true;
      await talk([
        [N, `…What.`, s],
        [hero(), `Happy birthday.`, 'hero'],
        [N, `It's not a big deal. Thirteen isn't even a real age. It's just twelve but more annoying.`, s],
        [N, `…Are you coming home straight after kendo? You always say you will and then Daichi makes you do "one more round".`, s]
      ]);
      const c = await ask(null, 'Mei is very carefully not looking at you.', ['"I promise. Straight home. With cake."', '"Depends on Daichi."', '"Do you want me to skip kendo?"'], null, false);
      if (c === 0) { G.flags.tk_promise = true; await say(N, `…Pinky promise. No, a real one. Okay. Good.`, s); }
      else if (c === 1) await say(N, `Ugh. Tell Daichi he's not invited to my birthday. Ever. Even when I'm forty.`, s);
      else await say(N, `No! Then you'll be grumpy. Just — come home. Before the candles.`, s);
      await say(null, 'She ties something to the strap of your school bag while you\'re talking: a little brass bell on a red cord. It rings once, very small.');
      await say(N, `It's from the shrine. For luck. For your exams. Don't make it weird.`, s);
      G.flags.tk_bell = true;
      return;
    }
    await say(N, pick([`Stop looking at me like that. You look like Mum.`, `If the cake has "Happy Birthday Mei" on it I'm running away from home.`, `…Thanks for the bell thing. Not making it weird. Bye.`]), s);
  },
  async tkLeaveHome() {
    if (!G.flags.tk_mum || !G.flags.tk_mei || !G.flags.tk_dad || !G.flags.tk_altar) {
      await say(null, !G.flags.tk_mum ? 'Mum is calling from the kitchen.' : !G.flags.tk_mei ? 'You can\'t leave without saying something to Mei. It\'s her birthday.' : !G.flags.tk_dad ? 'Your phone is buzzing on your bed.' : 'Mum likes you to light incense before you go. Your grandfather would have.');
      const p = World.player; p.fx = p.x; p.fy = p.y; p.y -= 1; p.t = 0; p.dir = 'up';
      return;
    }
    await say(null, '"Ittekimasu!" you call. "I\'m off!"');
    await say('Mum & Mei', `"Itterasshai!"`);
    await fadeOut(0.8);
    World.load('tk_class', 9, 11, 'up');
    await titleCard('Seiryo High School', 'Class 2-B — second period');
    await fadeIn(0.6);
    await World.run(async () => { await say(null, 'Second period. Maths. Ms. Tanabe has the look of someone about to announce a quiz.'); });
  }
});
// the phone in your room and the shrine shelf in the living room
{
  const it0 = WorldScene.prototype.interact;
  WorldScene.prototype.interact = function () {
    const p = this.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy, t = this.tile(x, y);
    if (G.map === 'tk_home') {
      if (t === '{' && x === 1) { this.run(tkDad); return; }
      if (t === 'è') { this.run(tkAltar); return; }
      if (t === 'þ') { this.run(() => say(null, 'Morning news. A typhoon off Okinawa. A lost dog in Nerima. Somebody in a suit saying traffic accidents are up this year.')); return; }
      if (t === '{' && x === 16) { this.run(() => say(null, 'Mei\'s bed, buried under plushies. There is a doctor\'s kit for children on the pillow. She has had it since she was six.')); return; }
    }
    if (G.map === 'tk_class' && t === 'Þ') { this.run(() => say(null, 'The blackboard: a quadratic equation, the date, and in the corner in tiny writing, "DAICHI ♥ KENDO". You know who wrote it.')); return; }
    return it0.call(this);
  };
}
async function tkDad() {
  if (G.flags.tk_dad) { await say(null, 'Your bed. Unmade. Mum will notice.'); return; }
  G.flags.tk_dad = true;
  Sound.sfx('talk');
  await talk([
    [null, 'Your phone is buzzing under your pillow. DAD.'],
    ['Dad (phone)', `There you are! Is your sister awake? Don't tell her I called you first. She'll make a face.`],
    ['Dad (phone)', `Osaka's fine. The project's a mess. I'm trying for the early train on Friday so we can do a proper birthday dinner. Somewhere with a tablecloth.`],
    ['Dad (phone)', `Look after them for me, champ. Your mum's on nights again and Mei pretends she's fine. You know what she's like.`]
  ]);
  const c = await ask(null, 'What do you say?', ['"Yeah, yeah. I will."', '"I will, Dad. Promise."'], null, false);
  if (c === 0) await say(null, 'He laughs. "Good. Love you." The line clicks. You meant to say it back. You will next time.');
  else { await say('Dad (phone)', `…That's my kid. Love you. See you Friday.`); G.flags.tk_dadPromise = true; }
}
async function tkAltar() {
  if (G.flags.tk_altar) { await say(null, 'The incense is burning down. Grandfather\'s photo smiles out of a frame that is too big for it.'); return; }
  G.flags.tk_altar = true;
  await talk([
    [null, 'A little shelf by the window: Grandfather\'s photograph, an incense holder, a cup of rice and a tangerine.'],
    [null, 'He taught you kendo before Daichi ever did. He used to say a blade is a promise you keep with your hands.'],
    [null, 'You light a stick of incense and put your hands together. For no reason you can name, you think of a bell.']
  ]);
}
Object.assign(STORY, {
  async tkTeacher() {
    const N = 'Ms. Tanabe', s = 'teacher';
    if (G.flags.tk_quiz) { await say(N, pick([`Lunch is for eating, not for loitering in my classroom.`, `If you put half the effort into maths that you put into kendo, I'd be out of a job.`]), s); return; }
    await say(N, `Seats, everyone. Phones away. Yes, ${G.name}, that means yours. Pop quiz. Three questions. Don't look at me like that, it's good for you.`, s);
    let score = 0;
    const Q = [
      ['x² − 5x + 6 = 0. What is x?', ['2 and 3', '−2 and −3', '1 and 6'], 0],
      ['A train leaves Osaka at 90 km/h. Tokyo is 500 km away. Roughly how long?', ['About 3 hours', 'About 5½ hours', 'About 8 hours'], 1],
      ['What is the angle sum of a triangle?', ['90°', '360°', '180°'], 2]
    ];
    for (const [q, opts, a] of Q) { const c = await ask(N, q, opts.slice(), s, false); if (c === a) { score++; Sound.sfx('ok'); } else Sound.sfx('buzz'); }
    G.flags.tk_quiz = true; G.flags.tk_quizScore = score;
    await say(N, score === 3 ? `Three out of three. Somebody's been studying. Don't let it go to your head.` : score === 2 ? `Two out of three. Respectable.` : score === 1 ? `One out of three. We'll call that a beginning.` : `Zero. Impressive, in its way. See me after the exams.`, s);
    if (score === 3) { addItem('onigiri', 1); await say(null, 'Aoi slides an onigiri across the desk while Ms. Tanabe isn\'t looking. "For the genius."'); }
    await say(null, 'The lunch bell goes. Half the class is out of the door before it stops.');
  },
  async tkAoiClass() {
    const N = 'Aoi', s = 'aoi';
    if (!G.flags.tk_quiz) { await say(N, `Psst. She's going to do a quiz. I can feel it. My left eye twitches when there's going to be a quiz.`, s); return; }
    await say(N, `I'm going up to the roof. Come on. I want to ask you something and I don't want Daichi listening.`, s);
  },
  async tkDaichiClass() {
    const N = 'Daichi', s = 'daichi';
    if (!G.flags.tk_quiz) { await say(N, `Not now. Quiz face. Shh.`, s); return; }
    if (G.flags.tk_daichiC) { await say(N, `After school. The dojo. Don't make me come and find you.`, s); return; }
    G.flags.tk_daichiC = true;
    await talk([
      [N, `After school. One last practice before exams. Three minutes, full focus.`, s],
      [N, `After the exams they choose a new captain. I want to see you fight properly once before that. Not the lazy way. Properly.`, s],
      [hero(), `It's Mei's birthday. I've got to get home.`, 'hero'],
      [N, `Three minutes. I'll time it. …Tell her happy birthday from the captain.`, s]
    ]);
  },
  async tkClassmate1() { await say('Haruka', pick([`Are you going to the summer festival? Everyone's going. Even Daichi, and he hates fun.`, `I heard Aoi got into the Kyoto summer programme. She hasn't told anyone. Act surprised.`]), 'classmate'); },
  async tkClassmate2() { await say('Ren', pick([`My cousin got isekai'd. In a manga. He drew it. It was terrible.`, `If I got hit by a truck I'd want to come back as a cat. Cats have it figured out.`]), 'classmate2'); },
  async tkClassmate3() { await say('Kenji', pick([`I didn't study. I'm going to fail. I'm at peace with it.`, `The crossing by the vending machines — my mum says it's dangerous. People take that corner too fast.`]), 'student'); },
  async tkLeaveClass() {
    if (!G.flags.tk_quiz || !G.flags.tk_daichiC) {
      await say(null, !G.flags.tk_quiz ? 'Ms. Tanabe clears her throat. You are not going anywhere until after the quiz.' : 'Daichi is giving you a look from the back of the room. He wants a word first.');
      const p = World.player; p.fx = p.x; p.fy = p.y; p.y -= 1; p.t = 0; p.dir = 'up';
      return;
    }
    await rooftop();
  }
});

// ---------------------------------------------------------------- lunch on the roof
class RooftopScene {
  constructor() { this.t = 0; }
  update(dt) { this.t += dt; }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5ab0e8'); g.addColorStop(0.6, '#bfe0f4'); g.addColorStop(0.61, '#9a96a0'); g.addColorStop(1, '#7a7680');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // clouds
    for (let i = 0; i < 6; i++) { const cx = ((i * 190 + this.t * (6 + i)) % (W + 240)) - 120, cy = 40 + (i % 3) * 30; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 16, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx - 20, cy - 10, 30, 14, 0, 0, 7); ctx.fill(); }
    // the city
    for (let i = 0; i < 16; i++) { const bw = 30 + (hash2(i, 2) % 40), bh = 40 + (hash2(i, 5) % 110), bx = i * (W / 15) - 10; ctx.fillStyle = i % 2 ? '#8aa0b8' : '#7a90a8'; ctx.fillRect(bx, 288 - bh, bw, bh); for (let w = 0; w < 8; w++) if (hash2(i, w) % 3 === 0) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(bx + 4 + (w % 3) * 9, 296 - bh + Math.floor(w / 3) * 14, 5, 6); } }
    ctx.fillStyle = '#c8c4cc'; ctx.fillRect(W * 0.78, 120, 6, 170); ctx.fillStyle = '#e5534b'; ctx.fillRect(W * 0.78 - 10, 120, 26, 10); ctx.fillRect(W * 0.78 - 6, 170, 18, 8);
    // fence
    ctx.fillStyle = '#5a6a5a'; ctx.fillRect(0, 286, W, 4);
    for (let x = 0; x < W; x += 14) ctx.fillRect(x, 230, 2, 60);
    ctx.fillStyle = '#6a7a6a'; ctx.fillRect(0, 230, W, 3);
    // the two of you on the bench
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(W / 2 - 110, 360, 220, 12); ctx.fillRect(W / 2 - 100, 372, 8, 30); ctx.fillRect(W / 2 + 92, 372, 8, 30);
    ctx.drawImage(charSprite('aoi', 'right', 0), W / 2 - 100, 268, 104, 104);
    ctx.drawImage(charSprite('hero', 'left', 0), W / 2, 268, 104, 104);
    // petals
    for (let i = 0; i < 18; i++) { const px_ = ((i * 97 + this.t * 30) % W), py_ = ((i * 53 + this.t * 24) % H); ctx.fillStyle = '#f7b8cc'; ctx.fillRect(px_, py_, 3, 2); }
    FX.bloom(0.22);
  }
}
async function rooftop() {
  await fadeOut(0.6);
  const s = new RooftopScene(); Scenes.push(s);
  Sound.stop(); Sound.play('tokyo');
  await fadeIn(0.8);
  const A = 'Aoi', a = 'aoi';
  await talk([
    [null, 'The roof is the one place in school nobody else bothers with. Aoi is sitting on the bench by the fence, eating a melon bread with great seriousness.'],
    [A, `Sit. Half?`, a],
    [A, `I got into the Kyoto summer programme. Medicine. Six weeks. I haven't told anyone because if I say it out loud it's real and then I have to go.`, a],
    [A, `Everyone thinks I've got it all worked out. I don't have anything worked out. I just make lists.`, a]
  ]);
  const c = await ask(null, 'Aoi is picking at her melon bread.', ['"You should go. You\'d be brilliant."', '"Are you scared?"', '"I\'d miss you. Go anyway."'], null, false);
  if (c === 0) await say(A, `…You always say things like you mean them. It's really annoying. Thank you.`, a);
  else if (c === 1) await say(A, `Terrified. Of being bad at it. Of being good at it, and then having to keep being good at it forever. Is that stupid?`, a);
  else await say(A, `…Okay. Okay, I'll go. But you have to write. Real letters. Nobody writes real letters any more.`, a);
  await talk([
    [A, `What about you? After exams. Do you know what you want?`, a],
    [hero(), `I want…`, 'hero']
  ]);
  const d = await ask(null, 'What do you want?', ['"To be strong enough to look after people."', '"To understand how things work. Everything."', '"For nothing to change. Ever."'], null, false);
  G.flags.tk_want = d;
  await say(A, d === 0 ? `That's very you. You'd jump in front of a train for a stranger, you know. Don't, though.` : d === 1 ? `That's a big want. I like it. You'd make a good teacher. Don't tell Ms. Tanabe I said that.` : `…Yeah. Me too, some days. But things change anyway. That's sort of the point of them.`, a);
  await say(A, `Is that a bell on your bag? It's cute. Mei?`, a);
  await say(hero(), `For luck. Exams.`, 'hero');
  await say(A, `Lucky bell. Okay. Come on, the bell's going. The other bell. The real one.`, a);
  await fadeOut(0.8);
  Scenes.remove(s);
  // and now the afternoon you already know
  World.load('tokyo', 15, 8, 'down');
  await titleCard('After school', 'Setagaya ward — 18:40');
  await fadeIn(1.0);
  Sound.play('tokyo');
  await World.run(async () => {
    await say(null, 'The sun is going down orange over the shrine roofs. You promised Mei. Cake, shrine, home.');
    await say(null, 'Aoi is waiting by the school gate.');
  });
}

// ---------------------------------------------------------------- the goddess says more, and gives a gift
LATE.push(() => {
  const talk0 = talk;
  const vs0 = voidSequence;
  voidSequence = async function () {
    // her speech ends with "I'm sorry about the cake" — add more before we fall into the light
    talk = async function (lines) {
      const last = lines[lines.length - 1];
      if (last && typeof last[1] === 'string' && last[1].includes('sorry about the cake')) {
        await talk0(lines.slice(0, -1));
        talk = talk0;
        await goddessMore();
        await talk0([last]);
        return;
      }
      return talk0(lines);
    };
    try { await vs0(); } finally { talk = talk0; }
  };
});
async function goddessMore() {
  const Gd = 'Aetheria', s = 'goddess';
  await talk([
    [Gd, `Before you go — there is something I should tell you, while you can still remember me telling it.`, s],
    [Gd, `You are not the first. There have been others. Children from your world, brought into this one when it needed them. Eleven.`, s],
    [Gd, `I am not proud of all of it. Some of them were very brave and very unhappy. I hope you will be happier than they were. I hope you will be braver, too, in a different way.`, s],
    [Gd, `I cannot give you back what you lost. But I can give you one thing for the road. It will be small. It will stay with you all your life.`, s]
  ]);
  const want = G.flags.tk_want;
  const c = await ask(Gd, want === 0 ? `You told your friend you wanted to look after people. Which gift?` : want === 1 ? `You told your friend you wanted to understand everything. Which gift?` : `You told your friend you wanted nothing to change. Everything will. Which gift?`,
    ['Courage — a steadier hand, a harder blow.', 'Insight — a sharper mind for the old words.', 'Kinship — people will find it easier to trust you.'], s, false);
  G.flags.boon = ['courage', 'insight', 'kinship'][c];
  await say(Gd, c === 0 ? `Courage. Of course. You already had most of it. I'm only lending you the rest.` : c === 1 ? `Insight. Good. Look carefully at everything, especially the things people tell you are true.` : `Kinship. That's the one I hoped you'd pick. Nobody should walk this alone.`, s);
  await say(null, `Gift received: ${['Courage (+10% attack)', 'Insight (+10% magic)', 'Kinship (companions start with more trust)'][c]}.`);
  await say(Gd, `And the bell. Your sister's bell. Keep listening for it. One day it might ring for you.`, s);
}
{
  const st0 = stat;
  stat = function (m, k) {
    let v = st0(m, k);
    if (G && m.cls === 'hero') { if (G.flags.boon === 'courage' && k === 'atk') v = Math.round(v * 1.1); if (G.flags.boon === 'insight' && k === 'mag') v = Math.round(v * 1.1); }
    return v;
  };
  const rc0 = recruit;
  recruit = function (id, startMorale) {
    const fresh = !rosterOf(id).member;
    const m = rc0(id, startMorale);
    if (fresh && G.flags.boon === 'kinship') rosterOf(id).morale = clamp(rosterOf(id).morale + 10, 0, 100);
    return m;
  };
}

// ---------------------------------------------------------------- House Valen: the Festival of First Light
LATE.push(() => { nurserySequence = async function () {
  Scenes.stack.length = 0;
  G.age = 'baby';
  const n = new NurseryScene();
  Scenes.push(n);
  Sound.stop(); Sound.play('cradle');
  Fade.col = '#ffffff';
  await fadeIn(2.6);
  Fade.col = '#000';
  await n.promise;
  Scenes.remove(n);
  await fadeOut(1.6);
  await babyYears();
  await titleCard('Six years later', 'House Valen, in the hills above Valenford');
  G.age = 'child';
  const h = G.party[0];
  h.cls = 'hero'; h.equip = { weapon: 'stick', armor: 'childclothes' };
  h.lvl = 1; h.xp = 0; h.hp = maxHP(h); h.mp = maxMP(h);
  G.inv = {}; G.gold = 0;
  clearHeroSprites();
  await mirrorSequence();
  startWorld();
  World.load('valen_manor', 10, 6, 'down');
  Sound.stop(); Sound.play('manor');
  G.flags.festival = true;
  await fadeIn(1.2);
  await World.run(async () => {
    await say('Nanny Perrin', `Up, up, up! It's the Festival of First Light, and you've been awake since four asking if it's time yet.`, 'nanny');
    await say('Nanny Perrin', `Your father says tomorrow you start with Master Corwin and Mage Isolde, so today — just today — you may run about the town like a heathen. Within reason.`, 'nanny');
    await say('Nanny Perrin', `Be at the market square at dusk. Your mother wants you there for the lanterns.`, 'nanny');
    await say(null, `TIP: The town is south, out of the manor's front door. Talk to everyone. Your mother will be waiting at the market square.`);
  });
}; });
// the baby years, in a few quick memories
class MemoryCardScene {
  constructor(lines) { this.lines = lines; this.t = 0; }
  update(dt) { this.t += dt; }
  draw() {
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 460);
    g.addColorStop(0, '#4a3a30'); g.addColorStop(1, '#140e10');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) { const x = (hash2(i, 1) % W), y = ((hash2(i, 4) % H) - this.t * 10 + H * 2) % H; ctx.fillStyle = 'rgba(255,220,170,.25)'; ctx.fillRect(x, y, 2, 2); }
    glow(W / 2, H / 2 - 40, 160, 'rgba(255,200,140,.2)');
    ctx.drawImage(babySprite(false), W / 2 - 64, H / 2 - 120, 128, 128);
    FX.bloom(0.2);
  }
}
async function babyYears() {
  const s = new MemoryCardScene(); Scenes.push(s);
  await fadeIn(1.0);
  await say(null, 'You learn things in the wrong order.');
  await say(null, 'You know what a car is before you can say "Mama". You dream of a crossing, and wake crying, and nobody understands why.');
  await say(null, 'Your first word is not "Mama" or "Papa". It is a word nobody in House Valen knows. It sounds like "Mei".');
  await say(null, 'Your mother sings you a song about the Accord of Dawn. Your father carries you round the walls every evening and tells you the name of every hill.');
  await say(null, 'Slowly, the crossing goes. The bell stays.');
  await fadeOut(1.0);
  Scenes.remove(s);
}
// Corwin and Isolde wait until tomorrow
{
  const c0 = STORY.corwin, m0 = STORY.courtmage, n0 = STORY.nanny, k0 = STORY.valenKid, mo0 = STORY.mother;
  STORY.corwin = async function (n) { if (G.age === 'child' && G.flags.festival && !G.flags.festDone) { await say('Master Corwin', pick([`Tomorrow, little lord. Today, go and eat too much honey cake. That's an order.`, `I don't train children on festival days. I train them the day after, when they're sorry.`]), 'swordmaster'); return; } return c0.call(this, n); };
  STORY.courtmage = async function (n) { if (G.age === 'child' && G.flags.festival && !G.flags.festDone) { await say('Court Mage Isolde', `The old words will keep until tomorrow. Go and watch the lanterns. Watch how the warm air lifts them. That's a lesson too.`, 'courtmage'); return; } return m0.call(this, n); };
  STORY.nanny = async function (n) { if (G.age === 'child' && G.flags.festival && !G.flags.festDone) { await say('Nanny Perrin', `Out you go! Market square at dusk. And don't climb anything.`, 'nanny'); return; } return n0.call(this, n); };
  STORY.mother = async function (n) { if (G.age === 'child' && G.flags.festival && !G.flags.festDone && G.map === 'valen_manor') { await say('Lady Ysolde Valen', `I'll see you at the square at dusk. Go on — I can see you vibrating from here.`, 'mother'); return; } return mo0.call(this, n); };
  STORY.valenKid = async function (n) {
    if (G.age === 'child' && G.flags.festival && !G.flags.fest_kite) {
      if (!G.flags.fest_kiteAsked) {
        G.flags.fest_kiteAsked = true;
        await talk([['Bram', `My kite! My festival kite! The wind took it and it went right over the houses!`, 'kid2'], ['Bram', `It's red with a dragon on it. I think it went towards the graveyard. I'm not allowed in the graveyard. Are you allowed in the graveyard?`, 'kid2']]);
        return;
      }
      if (G.flags.fest_kiteFound) {
        G.flags.fest_kite = true;
        await talk([['Bram', `MY KITE! You found it! You're the best Valen ever! Better than your dad! Don't tell your dad!`, 'kid2']]);
        G.rep = (G.rep || 0) + 3; Sound.sfx('levelup');
        await say(null, 'Bram gives you his most treasured possession, a smooth round pebble. (You put it in your pocket. You keep it for years.)');
        return;
      }
      await say('Bram', `The graveyard! South-west! It's red with a dragon on it!`, 'kid2');
      return;
    }
    return k0.call(this, n);
  };
}
// the kite in the yew by the graveyard, the puppet show, and Mother at the square
MAPS.valenford.npcs.push(
  { id: 'kiteTree', x: 12, y: 31, spr: 'pet:fox', dir: 'left', script: 'festKite', show: 'festival&fest_kiteAsked&!fest_kiteFound', emote: '?', fixed: true },
  { id: 'puppets', x: 24, y: 23, spr: 'puppeteer', dir: 'down', script: 'festPuppets', show: 'festival&!festDone' },
  { id: 'festMum', x: 22, y: 25, spr: 'mother', dir: 'up', script: 'festMother', show: 'festival&!festDone&fest_kite&fest_puppets' },
  { id: 'festCake', x: 29, y: 21, spr: 'woman2', dir: 'down', script: 'festCake', show: 'festival&!festDone' }
);
STORY.festKite = async function () {
  G.flags.fest_kiteFound = true;
  await say(null, 'A fox kit is sitting under the old yew by the graveyard wall, very pleased with itself, on top of a torn red kite with a dragon on it.');
  await say(null, 'You negotiate. The fox kit accepts a crust from your pocket. You have the kite.');
  World.refreshNpcs();
};
STORY.festPuppets = async function () {
  const N = 'Puppeteer Loll', s = 'puppeteer';
  if (G.flags.fest_puppets) { await say(N, `Come back next year! The dragon gets a new hat.`, s); return; }
  G.flags.fest_puppets = true;
  await talk([
    [N, `Gather round, gather round! The tale of the First Hero, Hiroshi of the Other Shore, who came out of the light with a sword like a sliver of moon!`, s],
    [null, 'A little wooden swordsman in black lacquer bows to the crowd. A little wooden dragon roars. The children shriek.'],
    [N, `And when the war was done, the hero laid down his sword, and he said: "I came from a city of glass, where the carts have no horses. I will never see it again." And he wept, children, he wept!`, s],
    [null, 'Something about the way the puppet hero kneels makes your chest hurt. You don\'t know why. Everyone else is clapping.'],
    [N, `The end! Coins in the hat, if you've got them. If you haven't, applause in the hat.`, s]
  ]);
};
STORY.festCake = async function () {
  if (G.flags.fest_cake) { await say('Aldra', `One's your lot. Festival rules.`, 'woman2'); return; }
  G.flags.fest_cake = true;
  await say('Aldra', `Honey cake for the little Valen! Fresh from the oven. Don't tell your nanny.`, 'woman2');
  await say(null, 'It is sticky and too hot and the best thing you have ever eaten. In either life.');
};
STORY.festMother = async function () {
  const M = 'Lady Ysolde Valen', s = 'mother';
  await fadeOut(0.8);
  const sc = new LanternScene(); Scenes.push(sc);
  Sound.stop(); Sound.play('cradle');
  await fadeIn(1.2);
  await talk([
    [null, 'Dusk. The whole town is on the market square, holding paper lanterns. Your mother kneels down so she is your height.'],
    [M, `Every year on First Light we let a lantern go for someone we've lost, and one for someone we're waiting for.`, s],
    [M, `This one is for your grandfather. And this one…`, s],
    [M, `This one is for whoever you were waiting for, when you were born. You didn't cry. Did they tell you that? You just lay there, listening. As if you were waiting for a bell.`, s]
  ]);
  const c = await ask(null, 'Who is your lantern for?', ['"For Mei."', '"For someone I can\'t remember."', '"For you, Mother."'], null, false);
  await say(M, c === 0 ? `Mei. That's a pretty name. I don't know who she is. But I think she's lucky to have someone light a lantern for her.` : c === 1 ? `Those are the ones that matter most, I think. Let it go, love.` : `For me? I'm right here, you silly thing. …All right. Thank you.`, s);
  await say(null, 'You let the lantern go. It goes up, and up, and joins a hundred others, until you can\'t tell which one was yours.');
  await fadeOut(1.2);
  Scenes.remove(sc);
  G.flags.festDone = true; G.flags.festival = false;
  World.load('valen_manor', 10, 6, 'down');
  await titleCard('The next morning', 'The day you begin');
  Sound.play('manor');
  await fadeIn(1.0);
  await World.run(async () => {
    await say('Nanny Perrin', `Up, up, up. Today is the day your father has been threatening you with since you could walk.`, 'nanny');
    await say('Nanny Perrin', `One morning with Master Corwin in the yard, one with Mage Isolde in the study. Blade and word. Then he decides what you are.`, 'nanny');
    await say(null, `TIP: The practice yard is west of the town square; the study is in the manor, east of the hall. Do both.`);
  });
  saveGame();
};
class LanternScene {
  constructor() { this.t = 0; this.l = Array.from({ length: 70 }, (_, i) => ({ x: rand(0, W), y: rand(H * 0.4, H + 200), v: rand(14, 30), s: rand(0, 9), c: pick(['#ffd070', '#ffb050', '#ff9a60', '#fff0a0']) })); }
  update(dt) { this.t += dt; for (const l of this.l) { l.y -= l.v * dt; l.x += Math.sin(this.t * 0.6 + l.s) * 6 * dt; if (l.y < -20) { l.y = H + 20; l.x = rand(0, W); } } }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1438'); g.addColorStop(0.55, '#5a3a6a'); g.addColorStop(0.75, '#c8705a'); g.addColorStop(1, '#2a1a24');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = Math.sin(TIME * 2 + i) > 0.5 ? '#fff' : '#a8a0d0'; ctx.fillRect(hash2(i, 3) % W, hash2(i, 9) % 180, 2, 2); }
    // rooftops of Valenford
    ctx.fillStyle = '#1a1018';
    for (let i = 0; i < 9; i++) { const x = i * 80 - 20, w = 70, h = 40 + (i % 3) * 16; ctx.fillRect(x, 360 - h, w, h + 140); ctx.beginPath(); ctx.moveTo(x - 6, 360 - h); ctx.lineTo(x + w / 2, 330 - h); ctx.lineTo(x + w + 6, 360 - h); ctx.fill(); }
    for (const l of this.l) { glow(l.x, l.y, 14, 'rgba(255,190,90,.5)'); ctx.fillStyle = l.c; ctx.fillRect(l.x - 3, l.y - 4, 6, 8); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(l.x - 1, l.y - 3, 2, 2); }
    ctx.drawImage(charSprite('mother', 'up', 0), W / 2 - 70, 330, 96, 96);
    ctx.drawImage(charSprite('hero', 'up', 0), W / 2, 346, 80, 80);
    FX.bloom(0.4);
  }
}
