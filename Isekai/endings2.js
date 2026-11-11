// =====================================================================
//  endings2.js : three more ways it can end
//   IV  THE TRUE ACCORD — bring the original Accord from Old Aurel and
//       the Ashcombe Letters (with Lucan's word behind them) to the
//       throne room, and show Malgrath the truth instead of a blade
//   V   THE HOLLOW REGENT — keep the Hollow Crown from the barrow, win
//       the last fight, and put it on. The Ashborn kneel. To you.
//   VI  HOMEWARD — after the war, with all twenty Memory Shards and the
//       shrine bell, the goddess offers you the road home
// =====================================================================
function accordReady() { return itemCount('accord') && (G.flags.lucanTestifies || itemCount('letters')); }

// ---------------------------------------------------------------- the choice in the throne room
{
  // after his speech, before the first blow: show him the truth instead
  const sb0 = startBattle;
  startBattle = async function (group, opts) {
    if (group && group[0] === 'king' && !G.flags.kingDone && !G.ending) {
      if (accordReady() && !G.flags.accordAsked2) {
        G.flags.accordAsked2 = true;
        const c = await ask(null, 'You have the True Accord in your pack, and the Ashcombe Letters, and Lucan\'s sworn word.', ['Show him the Accord and the letters.', 'Say nothing. Draw.'], null, false);
        if (c === 0) { G.flags.accordChosen = true; return 'accord'; }
      }
      if (G.flags.accordChosen) return 'accord';
    }
    return sb0(group, opts);
  };
  const ep0 = endingPurge;
  endingPurge = async function () {
    if (G.flags.accordChosen) return endingAccord();
    if (itemCount('crown') && G.flags.crownKept) {
      await say(null, 'Malgrath is on his knees. The Hollow Crown is cold against your back, through the pack. It is very quiet in the hall. You can hear it whispering.');
      const c = await ask('The Hollow Crown', `"He is finished. They will need a king. Put me on."`, ['Put on the crown.', 'Leave it in the pack.'], null, false);
      if (c === 0) return endingRegent();
    }
    return ep0();
  };
}

// ---------------------------------------------------------------- IV · THE TRUE ACCORD
async function endingAccord() {
  const N = 'Malgrath', s = 'demonking';
  Sound.stop(); Sound.play('void');
  await talk([
    [null, 'You do not draw. You take the Accord from your pack, and the letters, and you walk up the hall and put them in his hands.'],
    [N, `…What is this.`, s],
    [null, 'He reads. The great black hall is so quiet that you can hear the pages. He reads the clause at the bottom twice. Then he reads the letters.'],
    [N, `"The door belongs to both." My grandmother's grandmother signed this. They told us she sold us into the ash. She signed this.`, s],
    [N, `And this — "burn the village, leave their spears". Aldmere. Your people raided Aldmere in our colours. And I answered it. I answered it with fire.`, s]
  ]);
  if (has('varek')) await say('Varek', `My king. They lied to both of us. For three hundred years.`, 'c:varek');
  if (has('lyra')) await say('Lyra', `It isn't either of yours. It never was. Somebody made money on it.`, 'c:lyra');
  await talk([
    [N, `What do you want, Valen? You could have killed me. You might have managed it.`, s],
    [hero(), `I want you to come to Solmere with me. With this. In front of the King and the whole court. Lucan Ashcombe will swear to the letters. You'll swear to the rest.`, 'hero'],
    [N, `They will laugh. Or they will hang me.`, s],
    [hero(), `Then I'll stand next to you while they try.`, 'hero'],
    ['Seris', `…Father. Do it. I am tired of being your blade. I would like to be something else.`, 'seris'],
    [N, `…Very well. For her. And for the girl who signed it.`, s]
  ]);
  G.flags.accordChosen = true; G.flags.kingDone = true;
  G.ending = 'deal'; G.flags.end_deal = true; G.flags.end_accord = true; G.postgame = true; G.flags.doorOpen = true;
  removeItem('accord'); if (itemCount('letters')) removeItem('letters');
  moraleAll(20);
  await fadeOut(1.2);
  await epilogue('deal', [
    'The King of the Ashborn walks into Solmere under a flag of truce, with the heir of House Valen beside him, and the whole city comes out to see.',
    'In the Sunlit Palace, Lucan Ashcombe reads his father\'s letters aloud. Lord Ashcombe is taken from the hall in chains before he finishes.',
    'King Aurel reads the True Accord. He reads the clause at the bottom twice. Then he sets his own name beneath the old ones.',
    'The Rift is a door again. It belongs to both. Ashborn farmers cross it with seed, and dwarves cross it with picks, and the first market in three hundred years opens on the grey side of it.',
    'Malgrath gives his crown to Seris, and goes to live by a river, and learns — badly — to fish.',
    'The chronicles call it the Second Accord. They put your name in the margin.'
  ]);
  await rollEnding('ENDING IV — THE TRUE ACCORD');
  World.load('wastes', 12, 13, 'down'); World.syncFollowers(); saveGame();
  await fadeIn(0.8);
  toast('Game saved.', UI.hp);
  await say(null, 'Peace. Real peace, this time. The quest boards carry work from both sides of the Rift now, and Emberhollow is growing.');
  await say(null, 'Monsters everywhere now grow with your party. There may still be things to find in Eldoria.');
}

// ---------------------------------------------------------------- V · THE HOLLOW REGENT
async function endingRegent() {
  Sound.stop(); Sound.sfx('dark');
  removeItem('crown');
  await talk([
    [null, 'You put on the Hollow Crown.'],
    [null, 'It is cold, and then it is not cold, and then it is the most natural thing in the world. You can hear them now — every Ashborn soldier in the castle, every one in the Wastes. Kneeling.'],
    ['Malgrath', `…Ah. So that is what came out of the barrow. You poor child.`, 'demonking'],
    [null, 'He bows his head. Not to you. To the crown.']
  ]);
  if (has('wren')) await say('Wren', `Take it off. Please. You look like someone else.`, 'c:wren');
  if (has('lyra')) await say('Lyra', `I can't feel your heartbeat any more. I can always feel it. Take it off.`, 'c:lyra');
  if (has('varek')) await say('Varek', `…My regent.`, 'c:varek');
  G.ending = 'deal'; G.flags.end_deal = true; G.flags.end_regent = true; G.postgame = true; G.flags.doorOpen = true; G.flags.kingDone = true;
  for (const m of companionsInParty()) if (m.cls !== 'varek') addMorale(m.cls, -15);
  await fadeOut(1.4);
  await epilogue('purge', [
    'The Ashborn armies do not break. They turn, all at once, to face the Rift, and wait for an order.',
    'Malgrath lives, in a tower, under guard. Seris serves. Everyone serves.',
    'In Solmere they call you the Regent of the Ash, and King Aurel sends gifts, and his ministers do not sleep.',
    'The war is over. Nobody on either side of the Rift is quite sure who won it.',
    'At night, the crown tells you about the eleven who came before you, and what they could have been, if they had only been brave enough to wear it.',
    'You are still here. Are you?'
  ], true);
  await rollEnding('ENDING V — THE HOLLOW REGENT');
  World.load('castle', 12, 6, 'down'); World.syncFollowers(); saveGame();
  await fadeIn(0.8);
  toast('Game saved.', UI.hp);
  await say(null, 'The Ashborn are yours to command, and the land is quiet out of fear. The quest boards still have work. The crown is patient.');
}

// ---------------------------------------------------------------- VI · HOMEWARD
function homeReady() { return G.ending && G.flags.shardsAll && (itemCount('suzu') || G.flags.bellRung) && !G.flags.homeChosen; }
{
  const in0 = innScene;
  innScene = async function (name, spr, free) {
    const r = await in0(name, spr, free);
    if (homeReady()) await homewardDream();
    return r;
  };
}
async function homewardDream() {
  const Gd = 'Aetheria', s = 'goddess';
  saveGame(true);
  await fadeOut(0.8, '#ffffff');
  const d = new DreamScene('void'); Scenes.push(d);
  Sound.stop(); Sound.play('void');
  Fade.col = '#ffffff'; await fadeIn(1.2);
  await talk([
    [null, 'You are lying on something that is not a road. You have been here before.'],
    [Gd, `Hello again. You found them all. Every piece. And the bell, too.`, s],
    [Gd, `Twenty shards of glass and one brass bell. That is enough to make a road. A short one. Only one way, and only once.`, s],
    [Gd, `I promised the first of you, Hiroshi, that if any of you ever wanted to go home, I would let them. None of the others did. Or none of them found the pieces.`, s],
    [Gd, `If you go, you will wake in the place you left. It has been years there too. You will be — I won't lie — a stranger who knows everyone. Mei is a doctor now. She still talks to you at the shrine.`, s],
    [Gd, `If you stay, the road closes, and you live this life to the end. Both are good lives. I am not going to choose for you. I have chosen for you enough.`, s]
  ]);
  const c = await ask(Gd, 'Do you want to go home?', ['Go home.', 'Stay in Eldoria.'], s, false);
  if (c === 1) {
    G.flags.homeChosen = true; G.flags.stayed = true;
    await talk([
      [hero(), `I'm already home. Both of them are. But I've got people here now who'd be standing at a crossing for me.`, 'hero'],
      [Gd, `…Yes. I thought you might say that. Then take this. A blessing — it isn't much. It's the only one I have left that is mine to give.`, s]
    ]);
    addItem('elixir', 5); moraleAll(15);
    await fadeOut(1.0, '#ffffff'); Scenes.remove(d); Fade.col = '#000';
    Sound.stop(); Sound.play(musicFor(G.map)); await fadeIn(0.8);
    await say(null, 'You wake in the inn with the shrine bell in your hand, and someone in the next room singing badly, and you are very glad to be here.');
    saveGame();
    return;
  }
  // the road home
  await talk([
    [hero(), `I want to see her. I want to tell Mei I'm sorry about the cake.`, 'hero'],
    [Gd, `Then say goodbye, if you want to. They'll understand. Some of them will understand later.`, s]
  ]);
  for (const m of companionsInParty()) {
    const L = { wren: `Go. Go on. I'll keep the stables. I'll keep a horse saddled for you, in case.`, lyra: `I'll remember you in every spell. Every single one.`, garrick: `Dwarves don't cry. That's dust. Go.`, sable: `I'm not stealing your boots. I want to make that clear. I'm borrowing them forever.`, oswin: `The Dawn goes where you go. So do I, in a way. Go safely.`, kestrel: `Mark. Loose. Again. Keep walking, Valen.`, varek: `In the old script, the word for "goodbye" is the same as "until". Until, then.` }[m.cls];
    if (L) await say(m.name, L, 'c:' + m.cls);
  }
  await fadeOut(1.4, '#ffffff'); Scenes.remove(d);
  // Tokyo, years later
  const h = new HomeScene(); Scenes.push(h);
  Sound.stop(); Sound.play('tokyo');
  Fade.col = '#ffffff'; await fadeIn(2.0); Fade.col = '#000';
  await talk([
    [null, 'A hospital ceiling. A window over the train line. The 23:14 rattles the glass.'],
    [null, 'The nurses say you were found at the Kitazawa shrine at dawn, with a little brass bell in your hand, and no idea how you got there.'],
    [null, 'Your face is not the face you had at sixteen. It is not quite the face you had in Eldoria, either. It is somewhere between.'],
    [null, 'The doctor on the ward comes in reading your chart. She is twenty-five, and tired, and she has your mother\'s eyes.'],
    ['Dr. Mei', `Good evening. You gave everyone a fright. Do you know your name? Do you — I'm sorry, you just look very like someone I…`],
    [null, 'You hold up the bell. It rings once, very small.'],
    ['Dr. Mei', `…Onii-chan?`]
  ]);
  G.flags.homeChosen = true; G.flags.wentHome = true;
  await fadeOut(1.6);
  Scenes.remove(h);
  await rollEnding('ENDING VI — HOMEWARD');
  G.flags.homeChosen = false; G.flags.wentHome = false;  // the save stays as it was before the dream: this ending is a road not every save has to take
  await say(null, 'That was one ending. Your save from before the dream is still there, if you would rather the road had stayed closed.');
  goTitle();
}
class HomeScene {
  constructor() { this.t = 0; }
  update(dt) { this.t += dt; }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1a2e'); g.addColorStop(0.6, '#3a3456'); g.addColorStop(1, '#1a1428');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // a window over the city at night, a train going past
    ctx.fillStyle = '#0a0a18'; ctx.fillRect(W * 0.15, 50, W * 0.7, 220);
    for (let i = 0; i < 14; i++) { const bx = W * 0.15 + i * (W * 0.05), bh = 40 + (hash2(i, 9) % 120); ctx.fillStyle = '#16162a'; ctx.fillRect(bx, 270 - bh, W * 0.045, bh); for (let w = 0; w < 10; w++) if (hash2(i, w) % 3 === 0) { ctx.fillStyle = 'rgba(255,220,150,.7)'; ctx.fillRect(bx + 4 + (w % 3) * 8, 278 - bh + Math.floor(w / 3) * 14, 4, 6); } }
    const tx = ((this.t * 220) % (W * 1.6)) - W * 0.3;
    ctx.fillStyle = '#c8c8d0'; ctx.fillRect(tx, 238, W * 0.45, 22); for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(255,240,200,.9)'; ctx.fillRect(tx + 8 + i * 22, 242, 14, 8); }
    ctx.fillStyle = '#3a2618'; ctx.fillRect(W * 0.15 - 8, 42, W * 0.7 + 16, 8); ctx.fillRect(W * 0.15 - 8, 270, W * 0.7 + 16, 8); ctx.fillRect(W / 2 - 4, 50, 8, 220);
    ctx.fillStyle = '#e8e4ec'; ctx.fillRect(0, 300, W, 180);
    ctx.fillStyle = '#d8d4e0'; ctx.fillRect(40, 330, W - 80, 90);
    ctx.drawImage(charSprite('meiold', 'left', 0), W * 0.62, 250, 128, 128);
    glow(W * 0.42, 340, 30 + Math.sin(this.t * 3) * 4, 'rgba(255,220,140,.6)');
    ctx.fillStyle = '#d8a840'; ctx.fillRect(W * 0.42 - 4, 336, 8, 8);
    FX.bloom(0.3);
  }
}

// ---------------------------------------------------------------- credits for any ending
async function rollEnding(title) {
  Sound.stop(); Sound.play('ending');
  const c = new CreditsScene(G.ending || 'deal');
  c.lines[0][0] = title;
  Scenes.push(c);
  await fadeIn(0.8);
  await c.promise;
  await fadeOut(0.8);
  Scenes.remove(c);
  Sound.stop();
}
// the epilogue (adulthood) credits use the right ending title too
{
  const CS = CreditsScene;
  CreditsScene = class extends CS {
    constructor(ending) {
      super(ending);
      if (G && G.flags.end_accord && /II —/.test(this.lines[0][0])) this.lines[0][0] = 'ENDING IV — THE TRUE ACCORD';
      if (G && G.flags.end_regent && /II —/.test(this.lines[0][0])) this.lines[0][0] = 'ENDING V — THE HOLLOW REGENT';
    }
  };
}
// the world remembers which kind of peace it is
{
  const so0 = storyObjective;
  storyObjective = function () {
    if (G.flags.end_accord) return 'The Second Accord holds. Both sides of the Rift are open. There is still work on the quest boards, and still things to find in Eldoria.';
    if (G.flags.end_regent) return 'The Ashborn kneel to the Regent of the Ash. The quest boards still have work. The crown is patient.';
    const o = so0();
    if (stage() === 4 && accordReady()) return o + ' You carry the True Accord and the Ashcombe Letters.';
    return o;
  };
}
// side story: the road home
SIDE.push({ id: 'home', title: 'The Road Home', status: () => !G.flags.shards ? null : G.flags.stayed ? 'done' : G.flags.shardsAll ? (G.ending ? (itemCount('suzu') || G.flags.bellRung ? 'Rest at an inn. Someone wants to talk to you in your sleep.' : 'You have every shard. The shrine bell from Quill\'s Curiosities is missing.') : 'You have every shard. Finish the war first; the goddess is waiting for that.') : (G.flags.shards >= 20 ? 'You have all twenty shards. Show them to Quill, in Solmere.' : `Memory Shards found: ${G.flags.shards}/20. They glint where they lie.`) });
