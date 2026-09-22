// =====================================================================
//  main.js : title, opening cutscene, character creator, the Void
//  (personality quiz + class), arrival in Eldoria, main loop
// =====================================================================
let World = null;

function startWorld() {
  Scenes.clear();
  World = new WorldScene();
  Scenes.push(World);
  World.load(G.map, G.x, G.y, G.dir);
}
function goTitle() {
  Sound.stop();
  Scenes.clear();
  Fade.a = 0;
  Scenes.push(new TitleScene());
}

// ---------------------------------------------------------------- shared backdrop: night sky + sakura
const Petals = Array.from({ length: 34 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 2 + Math.random() * 3, v: 18 + Math.random() * 30, p: Math.random() * 7 }));
function drawSkyBackdrop(dt) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b0826'); g.addColorStop(0.6, '#2a1a4e'); g.addColorStop(1, '#5a2248');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const x = hash2(i, 1) % W, y = hash2(i, 2) % 300; ctx.fillStyle = Math.sin(TIME * 1.5 + i) > 0.7 ? '#fff' : '#8a88c0'; ctx.fillRect(x, y, 2, 2); }
  glow(520, 90, 120, 'rgba(255,240,200,.18)');
  ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.arc(520, 90, 36, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(506, 80, 8, 6); ctx.fillRect(530, 100, 10, 8);
  ctx.fillStyle = '#1a1030';
  ctx.beginPath(); ctx.moveTo(0, 390);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 380 - Math.sin(x / 70) * 22 - Math.sin(x / 23) * 6);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillRect(470, 300, 90, 80); ctx.fillRect(460, 270, 22, 110); ctx.fillRect(548, 260, 22, 120); ctx.fillRect(500, 240, 30, 70);
  ctx.beginPath(); ctx.moveTo(456, 272); ctx.lineTo(471, 240); ctx.lineTo(486, 272); ctx.fill();
  ctx.beginPath(); ctx.moveTo(544, 262); ctx.lineTo(559, 226); ctx.lineTo(574, 262); ctx.fill();
  ctx.beginPath(); ctx.moveTo(496, 242); ctx.lineTo(515, 200); ctx.lineTo(534, 242); ctx.fill();
  if (Math.sin(TIME * 3) > -0.5) { glow(514, 266, 14, 'rgba(255,60,90,.8)'); ctx.fillStyle = '#ff4060'; ctx.fillRect(511, 262, 6, 8); ctx.fillRect(466, 300, 5, 6); }
  ctx.fillStyle = '#0e0820'; ctx.fillRect(0, 420, W, 60);
  for (const p of Petals) {
    p.y += p.v * dt; p.x += Math.sin(TIME + p.p) * 20 * dt - 8 * dt;
    if (p.y > H) { p.y = -6; p.x = Math.random() * W; }
    if (p.x < -6) p.x = W;
    ctx.fillStyle = '#f7a8c4'; ctx.fillRect(p.x, p.y, p.s, p.s * 0.7);
  }
}

// ---------------------------------------------------------------- title
class TitleScene {
  constructor() {
    this.sel = hasSave() ? 1 : 0; this.busy = false; this.started = !!Sound.ctx;
    if (Cloud.code) Cloud.syncOnBoot().then(r => {
      if (r === 'pulled') { toast('Newer cloud save downloaded ☁', UI.mp); if (!this.busy) this.sel = 1; }
      if (r === 'offline') toast('Offline — using the save on this device.', UI.dim);
    });
  }
  items() { return [{ label: 'New Game' }, { label: 'Continue', disabled: !hasSave() }, { label: 'Cloud Save' }, { label: 'Settings' }]; }
  update(dt) {
    this.dt = dt;
    if (!this.started) { if (Sound.ctx || Controls.tapped || Input.pressedSet.size) this.started = true; return; }
    if (Sound.trackName !== 'title') Sound.play('title');
    if (this.busy) return;
    const it = this.items(), n = it.length;
    if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) {
      if (it[this.sel].disabled) { Sound.sfx('buzz'); return; }
      Sound.sfx('ok');
      this.busy = true;
      const f = [newGameFlow, continueFlow, async () => { await cloudMenu(false); }, async () => { await settingsMenu(); }][this.sel];
      f().catch(e => console.error(e)).finally(() => { this.busy = false; });
    }
  }
  draw() {
    drawSkyBackdrop(this.dt || 0.016);
    const bob = Math.sin(TIME * 1.2) * 2;
    text('I GOT', W / 2, 58 + bob, UI.paper, 22, 'center');
    for (const [dx, dy, col] of [[3, 3, '#1a0a20'], [0, 0, UI.sakura]]) text("ISEKAI'D", W / 2 + dx, 84 + dy + bob, col, 64, 'center');
    text('~ THE VIDEO GAME ~', W / 2, 160 + bob, UI.gold, 18, 'center');
    if (!this.started) {
      if (Math.floor(TIME * 2) % 2) text(Controls.mode === 'touch' ? 'Tap to start' : 'Press any key', W / 2, 300, UI.paper, 20, 'center');
    } else if (!this.busy || Scenes.top() !== this) {
      const it = this.items();
      drawWindow(W / 2 - 110, 228, 220, it.length * 34 + 24);
      it.forEach((o, i) => {
        text(o.label, W / 2 - 60, 244 + i * 34, o.disabled ? '#6a6480' : i === this.sel ? UI.paper : UI.dim, 18);
        if (i === this.sel) drawCursor(W / 2 - 84, 246 + i * 34);
      });
    }
    const hint = { keys: 'Arrows / WASD move  ·  Z / Enter confirm  ·  X back  ·  Esc menu', touch: 'D-pad move  ·  A confirm  ·  B back  ·  MENU menu', pad: 'Stick / D-pad move  ·  Ⓐ confirm  ·  Ⓑ back  ·  Start menu' }[Controls.mode];
    text(hint, W / 2, H - 28, UI.dim, 12, 'center', false);
    if (Cloud.code) text({ synced: '☁ Cloud linked', syncing: '☁ Syncing…', offline: '☁ Offline', off: '' }[Cloud.status] || '', W - 14, 12, Cloud.status === 'offline' ? UI.dim : UI.mp, 12, 'right');
  }
}

async function continueFlow() {
  if (!loadGame()) { toast('Save file could not be read.', UI.bad); return; }
  await fadeOut(0.5);
  Sound.stop();
  if (G.flags.kingFight) {   // the game was closed during the battle with Malgrath
    Scenes.clear();
    await finalDeath();
    return;
  }
  startWorld();
  await fadeIn(0.5);
  toast(`Welcome back, ${G.name}.`, UI.gold);
}

async function newGameFlow() {
  if (hasSave() && !(await confirm(null, 'Start a new game? Your old save is kept until you save over it.'))) return;
  G = newGameState();
  await fadeOut(0.6);
  Sound.stop();
  await openingCutscene();
  const cr = new CreatorScene();
  Scenes.push(cr);
  await fadeIn(0.5);
  const ok = await cr.run();
  Scenes.remove(cr);
  if (!ok) { G = null; return; }
  await fadeOut(0.8);
  Sound.stop();
  // Tokyo: the tutorial
  G.party = [makeMember('hero', G.name)];
  G.gold = 1500;
  G.map = 'tokyo'; G.x = 6; G.y = 5; G.dir = 'down';
  await titleCard('Setagaya, Tokyo', '6:40 PM, the evening of Mei\'s thirteenth birthday');
  startWorld();
  World.lock++; await fadeIn(1.0); World.lock--;
  await World.run(async () => {
    await say(null, 'The school day is over. The courtyard smells of cherry blossom and floor polish.');
    await say(null, `TIP: Move with ${Controls.mode === 'touch' ? 'the D-pad' : Controls.mode === 'pad' ? 'the stick or D-pad' : 'the arrow keys or WASD'}. Your current objective is shown in the bottom-left corner.`);
  });
}

// ---------------------------------------------------------------- title cards & opening
class CardScene {
  constructor(a, b) { this.a = a; this.b = b; this.t = 0; }
  update(dt) { this.t += dt; }
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, this.t * 1.2);
    text(this.a, W / 2, H / 2 - 24, UI.paper, 24, 'center');
    ctx.globalAlpha = Math.min(1, Math.max(0, this.t - 0.6) * 1.2);
    text(this.b, W / 2, H / 2 + 14, UI.dim, 15, 'center', false);
    ctx.globalAlpha = 1;
  }
}
async function titleCard(a, b) {
  const c = new CardScene(a, b);
  Scenes.push(c); Fade.a = 0;
  await wait(3.2);
  await fadeOut(0.8);
  Scenes.remove(c);
}

const OPENING = [
  { art: 'valley', text: 'Eldoria.' },
  { art: 'dawn', text: 'Three hundred years ago, the goddess Amaterine blessed the kingdoms of the Dawn.' },
  { art: 'exodus', text: 'With her light, the Dawn drove the Ashborn out of the green lands and into the Wastes.' },
  { art: 'wastes', text: 'Nothing grows in the Wastes. The Ashborn endured anyway, one generation after another.' },
  { art: 'castle', text: 'Now their king, Malgrath, has marched out of the ash to take the land back.' },
  { art: 'void', text: 'And once more, the goddess is reaching across the dark for a hero.' },
  { art: 'tokyo', text: 'Far away, in another world, someone is running late for their sister\'s birthday.' }
];
class OpeningScene {
  constructor() { this.i = 0; this.t = 0; this.promise = new Promise(r => this.resolve = r); }
  update(dt) {
    this.t += dt;
    if (Input.pressed('cancel')) { this.resolve(); return; }
    if ((this.t > 1.2 && Input.pressed('ok')) || this.t > 7.5) {
      this.i++; this.t = 0;
      if (this.i >= OPENING.length) this.resolve();
    }
  }
  draw() {
    const p = OPENING[Math.min(this.i, OPENING.length - 1)];
    const t = this.t, pan = t * 6;
    ctx.save();
    drawOpeningArt(p.art, t, pan);
    ctx.restore();
    const a = Math.min(1, t / 0.8) * Math.min(1, (7.5 - t) / 0.6);
    ctx.fillStyle = `rgba(0,0,0,${0.55 * Math.max(0, a)})`; ctx.fillRect(0, 360, W, 90);
    ctx.globalAlpha = Math.max(0, a);
    const ls = wrap(p.text, 560, 17);
    ls.forEach((l, k) => text(l, W / 2, 392 - ls.length * 11 + k * 24, UI.paper, 17, 'center', false));
    ctx.globalAlpha = 1;
    text(`${Controls.label('cancel')}: skip`, W - 14, H - 20, 'rgba(154,147,168,.6)', 11, 'right', false);
  }
}
function drawOpeningArt(art, t, pan) {
  const sky = (a, b) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  const hills = (col, base, amp, f, s) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base - Math.abs(Math.sin((x + pan * s) / f)) * amp); ctx.lineTo(W, H); ctx.fill(); };
  if (art === 'valley') {
    sky('#6aa8d8', '#f0e0b0'); glow(480, 120, 160, 'rgba(255,240,180,.6)');
    hills('#8ab0a0', 260, 60, 110, 0.3); hills('#5e9a50', 310, 40, 70, 0.6); hills('#3e7a36', 360, 30, 50, 1);
    for (let i = 0; i < 6; i++) { const x = 90 + i * 90 - pan * 0.5; ctx.fillStyle = '#e8d8b0'; ctx.fillRect(x, 330, 26, 18); ctx.fillStyle = '#a8413a'; ctx.beginPath(); ctx.moveTo(x - 4, 330); ctx.lineTo(x + 13, 318); ctx.lineTo(x + 30, 330); ctx.fill(); }
  } else if (art === 'dawn') {
    sky('#f2c060', '#fff4d0');
    for (let i = 0; i < 12; i++) { ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(W / 2, -40); ctx.lineTo(W / 2 + Math.cos(i / 12 * 3.14 + t * 0.05) * 700, 500); ctx.lineTo(W / 2 + Math.cos((i + 0.4) / 12 * 3.14 + t * 0.05) * 700, 500); ctx.fill(); }
    ctx.globalAlpha = 1;
    hills('#c89a50', 380, 30, 80, 0.5);
    for (let i = 0; i < 14; i++) { const x = 40 + i * 44; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x, 340, 6, 30); ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.moveTo(x + 6, 340); ctx.lineTo(x + 22, 346); ctx.lineTo(x + 6, 352); ctx.fill(); }
  } else if (art === 'exodus') {
    sky('#2a0e10', '#c8501e'); glow(W / 2, 330, 260, 'rgba(255,120,40,.4)');
    hills('#3a1414', 350, 30, 90, 0.4);
    for (let i = 0; i < 18; i++) {
      const x = 40 + i * 34 + pan * 1.2 % 34, h = i % 3 === 0 ? 20 : 34;
      ctx.fillStyle = '#0e0606'; ctx.fillRect(x, 400 - h, 10, h); ctx.beginPath(); ctx.arc(x + 5, 400 - h - 5, 6, 0, 7); ctx.fill();
      ctx.fillRect(x + 2, 400 - h - 14, 2, 6); ctx.fillRect(x + 7, 400 - h - 14, 2, 6);
    }
    ctx.fillStyle = '#0a0404'; ctx.fillRect(0, 400, W, 80);
  } else if (art === 'wastes') {
    sky('#3a3438', '#7a6a66');
    hills('#4a4246', 330, 40, 120, 0.3); hills('#342e30', 380, 20, 60, 0.6);
    for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(200,190,180,.4)'; ctx.fillRect((hash2(i, 1) % W + t * 20) % W, (hash2(i, 2) % H + t * 30) % H, 2, 2); }
    for (const x of [260, 290, 320]) { ctx.fillStyle = '#1e1a1c'; ctx.fillRect(x, 360, 10, 22); ctx.beginPath(); ctx.arc(x + 5, 356, 7, 0, 7); ctx.fill(); ctx.fillRect(x + 1, 344, 2, 6); ctx.fillRect(x + 7, 344, 2, 6); }
  } else if (art === 'castle') {
    sky('#0a0410', '#6a1020');
    ctx.fillStyle = '#060206';
    ctx.fillRect(250, 150, 140, 240); ctx.fillRect(230, 110, 36, 280); ctx.fillRect(374, 100, 36, 290); ctx.fillRect(300, 70, 40, 100);
    for (const [x, y] of [[248, 112], [392, 102], [320, 72]]) { ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x, y - 50); ctx.lineTo(x + 24, y); ctx.fill(); }
    glow(320, 220, 30, 'rgba(255,40,60,.7)');
    for (let i = 0; i < 40; i++) { const x = (i * 16 + t * 8) % W, y = 400 + (i % 4) * 10; ctx.fillStyle = '#0a0406'; ctx.fillRect(x, y - 12, 3, 14); glow(x + 1, y - 14, 8, 'rgba(255,170,60,.8)'); }
    ctx.fillStyle = '#050204'; ctx.fillRect(0, 420, W, 60);
  } else if (art === 'void') {
    ctx.fillStyle = '#04020a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 100; i++) { const x = hash2(i, 5) % W, y = hash2(i, 8) % H; ctx.fillStyle = i % 9 === 0 ? '#f7a8c4' : '#6a6ab0'; ctx.fillRect(x, y, 2, 2); }
    const r = 20 + t * 14;
    glow(W / 2, 200, r * 3, 'rgba(255,240,200,.35)'); glow(W / 2, 200, r, 'rgba(255,255,240,.8)');
  } else if (art === 'tokyo') {
    sky('#2a2a6a', '#e07a5a');
    for (let i = 0; i < 16; i++) {
      const bw = 40 + hash2(i, 9) % 40, bh = 100 + hash2(i, 4) % 170, bx = i * 44 - 20 - pan * 0.6;
      ctx.fillStyle = i % 2 ? '#1c1a34' : '#24203f'; ctx.fillRect(bx, 380 - bh, bw, bh);
      ctx.fillStyle = '#ffd87a';
      for (let wy = 380 - bh + 10; wy < 370; wy += 16) for (let wx = bx + 6; wx < bx + bw - 8; wx += 12) if (hash2(Math.floor(wx - bx) + i * 7, wy) % 3 === 0) ctx.fillRect(wx, wy, 5, 7);
    }
    ctx.fillStyle = '#34303a'; ctx.fillRect(0, 380, W, 100);
    ctx.fillStyle = '#e8e8e8'; for (let i = 0; i < 8; i++) ctx.fillRect(240 + i * 22, 392, 12, 70);
  }
}
async function openingCutscene() {
  Sound.play('void');
  const s = new OpeningScene();
  Scenes.push(s);
  await fadeIn(1.0);
  await s.promise;
  await fadeOut(0.8);
  Scenes.remove(s);
  Sound.stop();
}

// ---------------------------------------------------------------- character creator
class CreatorScene {
  constructor() { this.sel = 0; this.hair = 0; this.skin = 1; this.busy = false; }
  async run() {
    this.busy = true;
    const ne = new NameEntryScene(G.name);
    Scenes.push(ne);
    G.name = await ne.promise;
    this.busy = false;
    return new Promise(r => this.resolve = r);
  }
  rows() {
    return [
      ['Name', G.name], ['Look', G.gender === 'boy' ? '◀ Boy ▶' : '◀ Girl ▶'],
      ['Skin', '◀ ' + SKIN_TONES[this.skin].name + ' ▶'],
      ['Hair', '◀ ' + HAIR_COLOURS[this.hair].name + ' ▶'], ['Begin', ''], ['Back', '']
    ];
  }
  update() {
    if (this.busy) return;
    const n = 6;
    if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Sound.sfx('cursor'); }
    const side = Input.pressed('left') ? -1 : Input.pressed('right') ? 1 : 0;
    const cycle = d => {
      if (this.sel === 1) G.gender = G.gender === 'boy' ? 'girl' : 'boy';
      if (this.sel === 2) { this.skin = (this.skin + d + SKIN_TONES.length) % SKIN_TONES.length; G.skin = SKIN_TONES[this.skin].c; }
      if (this.sel === 3) { this.hair = (this.hair + d + HAIR_COLOURS.length) % HAIR_COLOURS.length; G.hair = HAIR_COLOURS[this.hair].c; }
      Sound.sfx('cursor');
    };
    if (side && this.sel >= 1 && this.sel <= 3) cycle(side);
    if (Input.pressed('cancel')) { Sound.sfx('cancel'); this.resolve(false); return; }
    if (Input.pressed('ok')) {
      Sound.sfx('ok');
      if (this.sel === 0) { this.busy = true; const ne = new NameEntryScene(G.name); Scenes.push(ne); ne.promise.then(v => { G.name = v; this.busy = false; }); }
      else if (this.sel <= 3) cycle(1);
      else if (this.sel === 4) this.resolve(true);
      else this.resolve(false);
    }
  }
  draw() {
    drawSkyBackdrop(0.016);
    ctx.fillStyle = 'rgba(8,6,20,.55)'; ctx.fillRect(0, 0, W, H);
    text('Who were you, before?', W / 2, 28, UI.gold, 20, 'center');
    drawWindow(40, 80, 250, 300);
    const g = ctx.createLinearGradient(0, 96, 0, 364); g.addColorStop(0, '#34407a'); g.addColorStop(1, '#1e2448');
    ctx.fillStyle = g; ctx.fillRect(56, 96, 218, 268);
    const d = ['down', 'left', 'up', 'right'][Math.floor(TIME / 1.4) % 4];
    const fr = Math.floor(TIME * 5) % 4; const f = fr === 1 ? 1 : fr === 3 ? 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(165, 326, 50, 12, 0, 0, 7); ctx.fill();
    ctx.drawImage(charSprite('hero', d, f), 69, 136, 192, 192);
    text(G.name, 165, 104, UI.paper, 18, 'center');
    const rs = this.rows();
    drawWindow(320, 100, 290, rs.length * 40 + 24);
    rs.forEach(([a, b], i) => {
      const y = 116 + i * 40;
      text(a, 356, y, i === this.sel ? UI.paper : UI.dim, 17);
      if (b) text(b, 594, y + 1, i === this.sel ? UI.gold : UI.dim, 15, 'right');
      if (i === this.sel) drawCursor(334, y + 2);
      const sw = i === 2 ? SKIN_TONES[this.skin].c : i === 3 ? HAIR_COLOURS[this.hair].c : null;
      if (sw) { ctx.fillStyle = UI.ink; ctx.fillRect(420, y + 3, 16, 16); ctx.fillStyle = sw; ctx.fillRect(422, y + 5, 12, 12); }
    });
    text(`◀ ▶ to change  ·  ${Controls.label('ok')} to select  ·  ${Controls.label('cancel')} to go back`, W / 2, H - 40, UI.dim, 13, 'center', false);
  }
}

// ---------------------------------------------------------------- the Void: goddess, quiz, class
class VoidScene {
  constructor() { this.goddessA = 0; this.transparent = false; this.pulse = 0; }
  update(dt) { this.pulse += dt; }
  draw() {
    ctx.fillStyle = '#04020a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 110; i++) {
      const x = (hash2(i, 5) % W + TIME * (6 + i % 5 * 5)) % W, y = hash2(i, 8) % H;
      ctx.fillStyle = i % 7 === 0 ? '#f7a8c4' : '#5a5aa0'; ctx.fillRect(x, y, 2, 2);
    }
    const a = this.goddessA;
    if (a > 0) {
      ctx.globalAlpha = a;
      const gy = 60 + Math.sin(TIME * 1.1) * 6;
      glow(W / 2, gy + 110, 240, 'rgba(255,236,190,.35)');
      ctx.drawImage(charSprite('goddess', 'down', 0), W / 2 - 96, gy, 192, 192);
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2, gy + 6, 44, 9, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
    }
  }
}
const QUIZ = [
  ['After a long week, what restores you?', ['A quiet evening on your own.', 'A night out with friends.']],
  ['In a room full of strangers, you usually…', ['…find a corner and watch for a while.', '…introduce yourself to someone.']],
  ['When you face a hard problem, you…', ['…think it through alone first.', '…talk it out with someone.']],
  ['The journey you would choose is…', ['A lonely road where you rely on yourself.', 'A crowded road with companions beside you.']],
  ['When you get good news, you…', ['…keep it to yourself for a little while.', '…tell everyone straight away.']],
  ['Silence between two people feels…', ['Comfortable.', 'Like something that should be filled.']],
  ['At Mei\'s party tonight, you would have been…', ['In the kitchen, helping, away from the noise.', 'In the middle of the games.']]
];
async function voidSequence() {
  const v = new VoidScene();
  Scenes.clear();
  Scenes.push(v);
  Fade.col = '#ffffff';
  await fadeIn(2.4);
  Fade.col = '#000';
  Sound.play('void');
  await say(null, 'It is very quiet. It is very dark. There is no pain, and that is how you know.');
  await say(G.name, 'The girl. Did she…', 'hero');
  await tween(v, { goddessA: 1 }, 2.0);
  const Gd = 'Amaterine', s = 'goddess';
  await talk([
    [Gd, `She is alive. She is sitting on the kerb, crying, with her mother's arms around her. You pushed her clear.`, s],
    [Gd, `You did not.`, s],
    [G.name, `Mei… My sister. The cake. I told her two minutes.`, 'hero'],
    [Gd, `I know. I am sorry. I cannot send you back to her. That road is closed to me.`, s],
    [Gd, `I am Amaterine, the goddess of a world called Eldoria. My world is at war, and it is losing. I have been searching for someone who would step into the road without thinking.`, s],
    [Gd, `I can give you a second life there. It will not be an easy one.`, s],
    [Gd, `But first, let me see who you are. Answer honestly. There are no wrong answers, only true ones.`, s]
  ]);
  // personality quiz
  let intro = 0;
  const answers = [];
  for (let i = 0; i < QUIZ.length; i++) {
    const [q, opts] = QUIZ[i];
    const c = await ask(Gd, `(${i + 1}/${QUIZ.length}) ${q}`, opts, s, false);
    answers.push(c); if (c === 0) intro++;
  }
  G.quiz = answers;
  G.personality = intro >= 4 ? 'intro' : 'extro';
  Sound.sfx('magic');
  if (INTRO()) {
    await talk([
      [Gd, `A quiet soul. You keep your own counsel and trust yourself before others.`, s],
      [null, 'INTROVERT: Companions will be harder to win over. Each will ask something of you before they join.'],
      [null, 'But you notice what others miss: loot from battles and chests will be rarer, but of higher quality.']
    ]);
  } else {
    await talk([
      [Gd, `A bright soul. You reach for other people, and they reach back.`, s],
      [null, 'EXTROVERT: Companions will join you readily.'],
      [null, 'You find loot more often and in greater amounts, but it is of lower quality.']
    ]);
  }
  await say(null, `Remember: in battle, the more companions you have, the less time you get to act. 15 seconds alone, 10 with one ally, 5 with two. Companions act on their own.`);
  // class
  await say(Gd, `One more thing. What will you carry into the new world?`, s);
  let hc;
  while (true) {
    const c = await ask(Gd, 'Choose your path.', [HERO_CLASSES.blade.name + ' (melee)', HERO_CLASSES.mage.name + ' (magic)', HERO_CLASSES.none.name + ' (hybrid)'], s, false);
    hc = ['blade', 'mage', 'none'][c];
    if (await confirm(Gd, HERO_CLASSES[hc].desc + '  Is this your path?', s)) break;
  }
  G.heroClass = hc;
  // rebuild the hero for the new world
  const old = G.party[0];
  const heroM = makeMember('hero', G.name);
  heroM.equip.weapon = hc === 'mage' ? 'wand' : 'shinai';
  G.party = [heroM];
  G.gold = 0;
  await talk([
    [Gd, hc === 'blade' ? `Then take the discipline you already have, and make it sharper.` : hc === 'mage' ? `Then I will teach you the old words. Listen closely: I can only say them once.` : `Then be ready for anything. It is harder than it sounds.`, s],
    [Gd, `When you have grown strong enough, you will find you can call on the moment of your crossing. The light you saw last. Use it well.`, s],
    [G.name, `Why me?`, 'hero'],
    [Gd, `Because you stepped into the road for a child you had never met. Eldoria needs someone who does that.`, s],
    [Gd, `…Whatever you learn about my world, and about me, remember that you chose to go.`, s]
  ]);
  Sound.stop(); Sound.sfx('magic');
  await fadeOut(1.4, '#ffffff');
  Scenes.clear();
  Fade.col = '#000'; Fade.a = 1;
  // Eldoria
  G.map = 'village'; G.x = 5; G.y = 6; G.dir = 'up';
  G.flags.inEldoria = true;
  await titleCard('Eldoria', 'Aldmere Village, at first light');
  startWorld();
  saveGame();
  World.lock++; await fadeIn(1.2); World.lock--;
  await World.run(async () => {
    await say(null, 'Soil. Barley stalks. Birdsong. Someone is kneeling beside you.');
    if (itemCount('cake')) await say(null, 'The cake box is crushed in your arms. You don\'t let go of it.');
    await STORY.elder();
  });
}

// ---------------------------------------------------------------- main loop
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  TIME += dt;
  try {
    Controls.update(dt);
    Timers.update(dt);
    BattleClock.update(dt);
    const top = Scenes.top();
    if (top && top.update) top.update(dt);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    Scenes.draw();
    drawFade();
    drawToasts(dt);
  } catch (e) { console.error(e); }
  Input.endFrame();
  requestAnimationFrame(frame);
}

loadSettings();
goTitle();
requestAnimationFrame(frame);
