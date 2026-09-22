// =====================================================================
//  main.js : title screen, character creator, prologue, main loop
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
const Petals = Array.from({ length: 34 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, s: 2 + Math.random() * 3, v: 18 + Math.random() * 30, p: Math.random() * 7 }));
function drawSkyBackdrop(dt) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b0826'); g.addColorStop(0.6, '#2a1a4e'); g.addColorStop(1, '#6a2a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = hash2(i, 1) % W, y = hash2(i, 2) % 300;
    ctx.fillStyle = Math.sin(TIME * 1.5 + i) > 0.7 ? '#fff' : '#8a88c0'; ctx.fillRect(x, y, 2, 2);
  }
  // moon
  ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.arc(520, 90, 38, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(506, 80, 8, 6); ctx.fillRect(530, 100, 10, 8);
  // hills + castle silhouette
  ctx.fillStyle = '#1a1030';
  ctx.beginPath(); ctx.moveTo(0, 390);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 380 - Math.sin(x / 70) * 22 - Math.sin(x / 23) * 6);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillRect(470, 300, 90, 80); ctx.fillRect(460, 270, 22, 110); ctx.fillRect(548, 260, 22, 120); ctx.fillRect(500, 240, 30, 70);
  ctx.beginPath(); ctx.moveTo(456, 272); ctx.lineTo(471, 240); ctx.lineTo(486, 272); ctx.fill();
  ctx.beginPath(); ctx.moveTo(544, 262); ctx.lineTo(559, 226); ctx.lineTo(574, 262); ctx.fill();
  ctx.beginPath(); ctx.moveTo(496, 242); ctx.lineTo(515, 200); ctx.lineTo(534, 242); ctx.fill();
  ctx.fillStyle = '#ff4060'; if (Math.sin(TIME * 3) > -0.5) { ctx.fillRect(511, 262, 6, 8); ctx.fillRect(466, 300, 5, 6); }
  ctx.fillStyle = '#0e0820'; ctx.fillRect(0, 420, W, 60);
  // petals
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
    this.sel = hasSave() ? 1 : 0; this.busy = false; this.truckX = -400; this.truckT = 4; this.started = !!Sound.ctx;
    if (Cloud.code) Cloud.syncOnBoot().then(r => {
      if (r === 'pulled') { toast('Newer cloud save downloaded ☁', UI.mp); if (!this.busy) this.sel = 1; }
      if (r === 'offline') toast('Offline — using the save on this device.', UI.dim);
    });
  }
  items() { return [{ label: 'New Game' }, { label: 'Continue', disabled: !hasSave() }, { label: 'Cloud Save' }, { label: 'Settings' }]; }
  update(dt) {
    this.dt = dt;
    this.truckT -= dt;
    if (this.truckT < 0 && this.truckX < -350) { this.truckX = W + 20; this.truckT = rand(10, 18); if (Sound.ctx) Sound.sfx('horn'); }
    if (this.truckX > -350) this.truckX -= dt * 520;
    if (!this.started) { if (Sound.ctx || Controls.tapped || Input.pressedSet.size) this.started = true; return; } // wait for first key/tap so audio can start (and swallow that press)
    if (Sound.trackName !== 'title') Sound.play('title');
    if (this.busy) return;
    const it = this.items();
    const n = it.length;
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
    if (this.truckX > -350) {
      ctx.save(); ctx.translate(this.truckX, 318); ctx.scale(0.45, 0.45);
      BattleScene.prototype.drawTruck.call({}, 0, 0);
      ctx.restore();
    }
    // logo
    const bob = Math.sin(TIME * 1.6) * 3;
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
  startWorld();
  await fadeIn(0.5);
  toast(`Welcome back, ${G.name}.`, UI.gold);
}

async function newGameFlow() {
  if (hasSave() && !(await confirm(null, 'Start a new game? Your old save is kept until you save over it.'))) return;
  G = newGameState();
  const cr = new CreatorScene();
  Scenes.push(cr);
  const ok = await cr.run();
  Scenes.remove(cr);
  if (!ok) { G = null; return; }
  await fadeOut(0.8);
  Sound.stop();
  await prologue();
  // arrive in Aldmere
  G.party = [makeMember('hero', G.name)];
  G.map = 'village'; G.x = 5; G.y = 6; G.dir = 'up';
  startWorld();
  saveGame();
  await fadeIn(1.2);
  await say(null, '…Something soft and leafy is under your face. It smells like soil and turnips.');
  await World.run(() => STORY.elder());
}

// ---------------------------------------------------------------- character creator
class CreatorScene {
  constructor() { this.sel = 0; this.hair = 0; this.promise = null; this.busy = false; }
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
      ['Hair', '◀ ' + HAIR_COLOURS[this.hair].name + ' ▶'], ['Begin your new life', ''], ['Back', '']
    ];
  }
  update() {
    if (this.busy) return;
    const n = 5;
    if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Sound.sfx('cursor'); }
    const side = Input.pressed('left') ? -1 : Input.pressed('right') ? 1 : 0;
    if (side && this.sel === 1) { G.gender = G.gender === 'boy' ? 'girl' : 'boy'; Sound.sfx('cursor'); }
    if (side && this.sel === 2) { this.hair = (this.hair + side + HAIR_COLOURS.length) % HAIR_COLOURS.length; G.hair = HAIR_COLOURS[this.hair].c; Sound.sfx('cursor'); }
    if (Input.pressed('cancel')) { Sound.sfx('cancel'); this.resolve(false); return; }
    if (Input.pressed('ok')) {
      Sound.sfx('ok');
      if (this.sel === 0) {
        this.busy = true;
        const ne = new NameEntryScene(G.name); Scenes.push(ne);
        ne.promise.then(v => { G.name = v; this.busy = false; });
      } else if (this.sel === 1) G.gender = G.gender === 'boy' ? 'girl' : 'boy';
      else if (this.sel === 2) { this.hair = (this.hair + 1) % HAIR_COLOURS.length; G.hair = HAIR_COLOURS[this.hair].c; }
      else if (this.sel === 3) this.resolve(true);
      else this.resolve(false);
    }
  }
  draw() {
    drawSkyBackdrop(0.016);
    ctx.fillStyle = 'rgba(8,6,20,.55)'; ctx.fillRect(0, 0, W, H);
    text('Who were you, before the truck?', W / 2, 28, UI.gold, 20, 'center');
    // preview
    drawWindow(40, 80, 250, 300);
    ctx.fillStyle = '#2a3263'; ctx.fillRect(56, 96, 218, 268);
    const dirs = ['down', 'left', 'up', 'right'];
    const d = dirs[Math.floor(TIME / 1.2) % 4];
    const fr = Math.floor(TIME * 5) % 4; const f = fr === 1 ? 1 : fr === 3 ? 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(165, 322, 54, 14, 0, 0, 7); ctx.fill();
    ctx.drawImage(charSprite('hero', d, f), 69, 136, 192, 192);
    text(G.name, 165, 104, UI.paper, 18, 'center');
    // options
    const rs = this.rows();
    drawWindow(320, 110, 280, rs.length * 40 + 24);
    rs.forEach(([a, b], i) => {
      const y = 126 + i * 40;
      text(a, 356, y, i === this.sel ? UI.paper : UI.dim, 17);
      if (b) text(b, 584, y + 1, i === this.sel ? UI.gold : UI.dim, 15, 'right');
      if (i === this.sel) drawCursor(334, y + 2);
      if (i === 2) { ctx.fillStyle = UI.ink; ctx.fillRect(452, y + 4, 14, 14); ctx.fillStyle = HAIR_COLOURS[this.hair].c; ctx.fillRect(454, y + 6, 10, 10); }
    });
    text(`◀ ▶ to change  ·  ${Controls.label('ok')} to select  ·  ${Controls.label('cancel')} to go back`, W / 2, H - 40, UI.dim, 13, 'center', false);
  }
}

// ---------------------------------------------------------------- prologue cutscene
class CutsceneScene {
  constructor() { this.mode = 'tokyo'; this.stuX = -40; this.stuDir = 'right'; this.walk = true; this.kitten = null; this.truckX = null; this.goddessA = 0; this.phone = true; }
  update() { }
  draw() {
    if (this.mode === 'tokyo') this.drawTokyo();
    else this.drawVoid();
  }
  drawTokyo() {
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, '#2a2a6a'); g.addColorStop(1, '#e07a5a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // skyline
    for (let i = 0; i < 14; i++) {
      const bw = 40 + hash2(i, 9) % 40, bh = 90 + hash2(i, 4) % 150, bx = i * 48 - 10;
      ctx.fillStyle = i % 2 ? '#1c1a34' : '#24203f'; ctx.fillRect(bx, 300 - bh, bw, bh);
      ctx.fillStyle = '#ffd87a';
      for (let wy = 300 - bh + 10; wy < 290; wy += 16) for (let wx = bx + 6; wx < bx + bw - 8; wx += 12) if (hash2(wx, wy) % 3 === 0) ctx.fillRect(wx, wy, 5, 7);
    }
    ctx.fillStyle = '#ff5a8a'; ctx.fillRect(96, 196, 64, 18); text('カラオケ', 128, 197, '#fff', 12, 'center');
    ctx.fillStyle = '#5affd0'; ctx.fillRect(400, 170, 18, 70);
    // sidewalk + road
    ctx.fillStyle = '#6a6470'; ctx.fillRect(0, 300, W, 40);
    ctx.fillStyle = '#34303a'; ctx.fillRect(0, 340, W, 110);
    ctx.fillStyle = '#e8e8e8'; for (let i = 0; i < 8; i++) ctx.fillRect(250 + i * 18, 346, 10, 98);
    ctx.fillStyle = '#6a6470'; ctx.fillRect(0, 450, W, 30);
    // traffic light
    ctx.fillStyle = '#222'; ctx.fillRect(230, 230, 6, 72); ctx.fillRect(222, 214, 22, 34);
    ctx.fillStyle = Math.floor(TIME * 2) % 2 ? '#40ff70' : '#1a4a2a'; ctx.fillRect(227, 234, 12, 10);
    // kitten
    if (this.kitten) {
      const k = this.kitten; ctx.fillStyle = '#f0a040';
      ctx.fillRect(k.x, k.y, 18, 10); ctx.fillRect(k.x + 14, k.y - 6, 10, 9); ctx.fillRect(k.x + 15, k.y - 9, 3, 4); ctx.fillRect(k.x + 21, k.y - 9, 3, 4); ctx.fillRect(k.x - 5, k.y - 4, 6, 3);
      ctx.fillStyle = '#111'; ctx.fillRect(k.x + 20, k.y - 3, 2, 2);
    }
    // student
    const fr = this.walk ? (Math.floor(TIME * 6) % 4 === 1 ? 1 : Math.floor(TIME * 6) % 4 === 3 ? 2 : 0) : 0;
    ctx.drawImage(charSprite('hero', this.stuDir, fr), this.stuX, this.stuY || 250, 72, 72);
    if (this.phone && this.stuDir === 'right') { ctx.fillStyle = '#9ae0ff'; ctx.fillRect(this.stuX + 50, (this.stuY || 250) + 38, 6, 9); }
    if (this.truckX !== null) BattleScene.prototype.drawTruck.call({}, this.truckX, 300);
  }
  drawVoid() {
    ctx.fillStyle = '#05030c'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const x = (hash2(i, 5) % W + TIME * (10 + i % 5 * 6)) % W, y = hash2(i, 8) % H;
      ctx.fillStyle = i % 7 === 0 ? '#f7a8c4' : '#6a6ab0'; ctx.fillRect(x, y, 2, 2);
    }
    const a = this.goddessA;
    if (a > 0) {
      ctx.globalAlpha = a;
      const gy = 70 + Math.sin(TIME * 1.4) * 8;
      const g = ctx.createRadialGradient(W / 2, gy + 100, 10, W / 2, gy + 100, 220);
      g.addColorStop(0, 'rgba(255,240,200,.55)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(charSprite('goddess', 'down', 0), W / 2 - 96, gy, 192, 192);
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2, gy + 14, 40, 9, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

async function prologue() {
  const cs = new CutsceneScene();
  Scenes.push(cs);
  Sound.play('tokyo');
  cs.stuY = 250;
  await fadeIn(1.0);
  tween(cs, { stuX: 150 }, 3.0);
  await wait(1.2);
  await say(G.name, `Ugh. Cram school ran late again. If I hurry I can still catch the new episode of "Reincarnated as a Vending Machine"…`, 'hero');
  await wait(1.2);
  cs.walk = false;
  cs.kitten = { x: 330, y: 318 };
  await say(null, 'A tiny orange kitten wobbles off the kerb and into the crosswalk.');
  await tween(cs.kitten, { y: 390 }, 1.2);
  cs.phone = false;
  await say(G.name, `Hey — hey, no! Little guy, that's a ROAD!`, 'hero');
  Sound.sfx('horn');
  await say(null, 'HOOOOONK!');
  cs.walk = true;
  cs.truckX = W + 20;
  tween(cs, { stuX: 290, stuY: 356 }, 0.5, easeOut);
  await wait(0.5);
  cs.kitten.x = 360; cs.kitten.y = 322; // shoved to safety
  cs.walk = false;
  await tween(cs, { truckX: 150 }, 0.35, easeIn);
  Sound.stop(); Sound.sfx('crash');
  await fadeOut(0.08, '#ffffff');
  Scenes.remove(cs);
  // ---- the void
  const vs = new CutsceneScene(); vs.mode = 'void';
  Scenes.push(vs);
  await wait(1.2);
  await fadeIn(2.0);
  Sound.play('void');
  await say(null, 'It is very quiet. It is very dark. Nothing hurts, which is suspicious.');
  await tween(vs, { goddessA: 1 }, 1.5);
  const Gd = 'Goddess Amaterine', s = 'goddess';
  await talk([
    [Gd, `Oh! Oh no. Um — hi! Welcome! You're dead. Sorry! Very sorry. Congratulations? No. Sorry.`, s],
    [Gd, `The kitten's fine, by the way! Very brave. Very stupid. Mostly brave.`, s],
    [Gd, `That truck was Truck-kun. He's… sort of our recruiter. We don't talk about it.`, s],
    [Gd, `So! Here's the deal. There's a world called Eldoria. It has swords, magic, elves, and a Demon King named Malgrath who has recently woken up and is being extremely rude.`, s]
  ]);
  const c = await ask(Gd, `I can reincarnate you there — same face, same name, ${G.name}. Will you save Eldoria?`, ['Obviously.', 'Can I just go home instead?'], s, false);
  if (c === 1) await say(Gd, `Legally I have to say "no". Emotionally I also say "no". Off you go!`, s);
  else await say(Gd, `Yay! I love an enthusiastic one!`, s);
  await talk([
    [Gd, `I'll grant you a blessing to help. When you're strong enough, you'll be able to call upon the very truck that sent you here.`, s],
    [G.name, `…That's the worst blessing I've ever heard of.`, 'hero'],
    [Gd, `It's a GREAT blessing. You'll see. Around level eleven. Okay, bye! Try not to land on anything!`, s]
  ]);
  Sound.stop(); Sound.sfx('magic');
  await fadeOut(1.0, '#ffffff');
  Scenes.remove(vs);
  Fade.col = '#000';
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
