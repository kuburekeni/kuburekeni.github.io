// =====================================================================
//  main.js : the title screen, the opening, character creation and the loop
// =====================================================================

// ---------------------------------------------------------------- key visual
// The poster the game is named on: sky, sun, the party, and the logo.
// Used by the title screen and by the app icon.
function drawKeyVisual(c, w, h, opts = {}) {
  const t = opts.still ? 0 : TIME;
  const sc = h / 480;
  // sky
  const g = c.createLinearGradient(0, 0, 0, h * 0.72);
  g.addColorStop(0, '#2a6ad0'); g.addColorStop(0.5, '#7ab8e8'); g.addColorStop(1, '#ffe2a8');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // clouds
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 140 + t * 4) % (w + 240)) - 120, cy = h * (0.08 + (i % 3) * 0.07);
    c.fillStyle = 'rgba(255,255,255,.75)';
    c.beginPath(); c.ellipse(cx, cy, 52 * sc, 15 * sc, 0, 0, 7); c.ellipse(cx + 34 * sc, cy - 8 * sc, 34 * sc, 13 * sc, 0, 0, 7); c.fill();
  }
  // sun
  const sunX = w * 0.76, sunY = h * 0.17;
  c.save(); c.globalCompositeOperation = 'lighter';
  const sg = c.createRadialGradient(sunX, sunY, 4, sunX, sunY, 150 * sc);
  sg.addColorStop(0, 'rgba(255,255,235,.95)'); sg.addColorStop(0.3, 'rgba(255,230,160,.5)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = sg; c.fillRect(sunX - 160 * sc, sunY - 160 * sc, 320 * sc, 320 * sc);
  c.restore();
  // hills
  const hill = (base, amp, freq, col, seed) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) c.lineTo(x, base - Math.abs(Math.sin(x / freq + seed)) * amp);
    c.lineTo(w, h); c.fill();
  };
  hill(h * 0.60, 50 * sc, 130, '#6f9cb4', 1.2);
  hill(h * 0.66, 36 * sc, 90, '#4d8a52', 2.4);
  // the castle on the far hill
  c.fillStyle = '#4a3a58';
  const kx = w * 0.14, ky = h * 0.60;
  c.fillRect(kx, ky, 30 * sc, 42 * sc); c.fillRect(kx + 36 * sc, ky - 10 * sc, 22 * sc, 52 * sc);
  c.beginPath(); c.moveTo(kx - 4 * sc, ky); c.lineTo(kx + 15 * sc, ky - 22 * sc); c.lineTo(kx + 34 * sc, ky); c.fill();
  // ground
  const gg = c.createLinearGradient(0, h * 0.64, 0, h);
  gg.addColorStop(0, '#61a047'); gg.addColorStop(1, '#255022');
  c.fillStyle = gg; c.fillRect(0, h * 0.64, w, h * 0.36);
  const rg = c.createLinearGradient(0, h * 0.66, 0, h);
  rg.addColorStop(0, '#d2ae6c'); rg.addColorStop(1, '#8a6a3a');
  c.fillStyle = rg;
  c.beginPath(); c.moveTo(w * 0.10, h); c.lineTo(w * 0.40, h * 0.655); c.lineTo(w * 0.62, h * 0.655); c.lineTo(w * 1.02, h); c.fill();
  // grass tufts
  for (let i = 0; i < 40; i++) {
    const x = (hash2(i, 5) % w), y = h * 0.66 + (hash2(i, 9) % Math.floor(h * 0.32));
    c.fillStyle = i % 3 ? '#4f8a3e' : '#7ec463'; c.fillRect(x, y, 3 * sc, 5 * sc);
  }
  // the party, running out of the poster
  const heroKey = (typeof G !== 'undefined' && G && G.party) ? 'hero' : (opts.girl ? 'posterf' : 'poster');
  const cast = opts.cast || [
    ['c:garrick', 0.13, 0.62], ['c:oswin', 0.87, 0.60],
    ['c:wren', 0.29, 0.78], ['c:lyra', 0.72, 0.80],
    [heroKey, 0.50, 1.00]
  ];
  const baseY = h * (opts.baseFrac || (opts.tall ? 0.92 : 0.74));
  cast.slice().sort((a, b) => a[2] - b[2]).forEach(([key, fx, s], i) => {
    const size = 210 * sc * s;
    const bob = Math.abs(Math.sin(t * 6 + i * 1.4)) * 5 * sc * s;
    const x = w * fx - size / 2, y = baseY - size - bob;
    c.fillStyle = 'rgba(0,0,0,.28)';
    c.beginPath(); c.ellipse(w * fx, baseY - 2, size * 0.24, size * 0.05, 0, 0, 7); c.fill();
    const frame = Math.floor(t * 8 + i) % 4 === 1 ? 1 : Math.floor(t * 8 + i) % 4 === 3 ? 2 : 0;
    let img;
    try { img = charSprite(key, 'down', opts.still ? (i % 2 ? 1 : 2) : frame); } catch (e) { console.warn(key, e); return; }
    c.imageSmoothingEnabled = false;
    c.drawImage(img, Math.round(x), Math.round(y), Math.round(size), Math.round(size));
  });
  // dust kicked up along the road
  c.fillStyle = 'rgba(255,240,200,.5)';
  for (let i = 0; i < 14; i++) {
    const p = (t * 0.6 + i / 14) % 1;
    c.globalAlpha = 0.35 * (1 - p);
    c.beginPath(); c.arc(w * (0.5 + (i % 2 ? -1 : 1) * p * 0.42), baseY - p * 26 * sc, (4 + p * 13) * sc, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  // warm grade + flare
  c.save(); c.globalCompositeOperation = 'lighter';
  const wg = c.createLinearGradient(w, 0, 0, h);
  wg.addColorStop(0, 'rgba(255,214,150,.30)'); wg.addColorStop(1, 'rgba(255,180,120,0)');
  c.fillStyle = wg; c.fillRect(0, 0, w, h);
  c.restore();
  if (c === ctx) FX.lensFlare(sunX, sunY, 0.9 * sc, [255, 240, 190]);
  else keyVisualFlare(c, sunX, sunY, w, h, sc);
  // vignette
  const vg = c.createRadialGradient(w / 2, h / 2, h * 0.42, w / 2, h / 2, h * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,6,30,.45)');
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
}
// a flare for canvases that are not the game screen (the icon generator)
function keyVisualFlare(c, x, y, w, h, sc) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const core = c.createRadialGradient(x, y, 0, x, y, 70 * sc);
  core.addColorStop(0, 'rgba(255,255,255,.85)'); core.addColorStop(1, 'rgba(255,240,180,0)');
  c.fillStyle = core; c.fillRect(x - 80 * sc, y - 80 * sc, 160 * sc, 160 * sc);
  const gr = c.createLinearGradient(x - 220 * sc, y, x + 220 * sc, y);
  gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.5, 'rgba(255,240,190,.35)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
  c.fillStyle = gr; c.fillRect(x - 220 * sc, y - 2 * sc, 440 * sc, 4 * sc);
  const dx = w / 2 - x, dy = h / 2 - y;
  for (const [tt, rad, a] of [[0.35, 14, .16], [0.7, 24, .12], [1.2, 12, .14], [1.7, 30, .08]]) {
    c.fillStyle = tt > 1 ? `rgba(140,200,255,${a})` : `rgba(255,210,140,${a})`;
    c.beginPath(); c.arc(x + dx * 2 * tt, y + dy * 2 * tt, rad * sc, 0, 7); c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------- the logo
// Chunky pixel letters with a gold-to-sunset gradient, a hard outline and a shine.
function drawLogo(c, cx, y, scale, t) {
  const big = 'I GOT ISEKAI\'D';
  const s1 = Math.round(52 * scale), s2 = Math.round(19 * scale);
  c.save();
  c.textAlign = 'center'; c.textBaseline = 'top';
  // the plate behind the words
  const wpx = c.measureText ? 0 : 0;
  c.font = `${s1}px ${FONT}`;
  const w1 = c.measureText(big).width;
  c.save();
  const pg = c.createRadialGradient(cx, y + s1 * 0.6, 10, cx, y + s1 * 0.6, w1 * 0.75);
  pg.addColorStop(0, 'rgba(24,8,40,.62)'); pg.addColorStop(1, 'rgba(24,8,40,0)');
  c.fillStyle = pg;
  c.fillRect(cx - w1, y - 40 * scale, w1 * 2, s1 + s2 + 110 * scale);
  c.restore();
  // shadow layers give the letters depth, pixel-poster style
  for (let d = 6; d >= 1; d--) {
    c.fillStyle = d > 3 ? '#2a1038' : '#6a1030';
    c.fillText(big, cx + d * scale, y + d * scale);
  }
  const g = c.createLinearGradient(0, y, 0, y + s1);
  g.addColorStop(0, '#fff6d0'); g.addColorStop(0.42, '#f2c94c'); g.addColorStop(0.62, '#f0913a'); g.addColorStop(1, '#e5534b');
  c.fillStyle = g;
  c.fillText(big, cx, y);
  // sheen sweeping across the letters
  const sw = ((t * 0.35) % 1.6) - 0.3;
  c.save();
  c.beginPath(); c.rect(cx - w1 / 2, y, w1, s1); c.clip();
  const sg = c.createLinearGradient(cx - w1 / 2 + w1 * sw - 60 * scale, y, cx - w1 / 2 + w1 * sw + 60 * scale, y + s1);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg; c.fillRect(cx - w1 / 2, y, w1, s1);
  c.restore();
  // subtitle bar
  const sub = 'THE VIDEO GAME';
  c.font = `${s2}px ${FONT}`;
  const w2 = c.measureText(sub).width;
  const by = y + s1 + 10 * scale;
  c.fillStyle = '#1a0a2a'; c.fillRect(cx - w2 / 2 - 14 * scale, by - 4 * scale, w2 + 28 * scale, s2 + 12 * scale);
  c.fillStyle = '#f2c94c'; c.fillRect(cx - w2 / 2 - 14 * scale, by - 4 * scale, w2 + 28 * scale, 2 * scale);
  c.fillRect(cx - w2 / 2 - 14 * scale, by + s2 + 6 * scale, w2 + 28 * scale, 2 * scale);
  c.fillStyle = '#f7ead2';
  c.fillText(sub, cx, by);
  c.restore();
  return by + s2 + 14 * scale;
}

class TitleScene {
  constructor() {
    this.sel = 0; this.t = 0;
    this.opts = [hasSave() ? 'Continue' : 'New Game', hasSave() ? 'New Game' : null, 'Cloud Save', 'Settings'].filter(Boolean);
  }
  update(dt) {
    this.t += dt;
    const n = this.opts.length;
    if (Input.pressed('up')) { this.sel = (this.sel + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('down')) { this.sel = (this.sel + 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) {
      Sound.sfx('ok');
      const o = this.opts[this.sel];
      if (o === 'Continue') continueGame();
      else if (o === 'New Game') newGame();
      else if (o === 'Cloud Save') titleCloud();
      else settingsMenu();
    }
  }
  draw() {
    drawKeyVisual(ctx, W, H, { girl: false });
    Weather.drawWorld();
    FX.bloom(0.3);
    Weather.drawScreen();
    // a band along the bottom to sit the menu in
    const bandY = H - 148;
    const bg = ctx.createLinearGradient(0, bandY - 30, 0, H);
    bg.addColorStop(0, 'rgba(10,5,22,0)'); bg.addColorStop(0.4, 'rgba(10,5,22,.86)'); bg.addColorStop(1, 'rgba(6,3,14,.97)');
    ctx.fillStyle = bg; ctx.fillRect(0, bandY - 30, W, H - bandY + 30);
    ctx.fillStyle = 'rgba(242,201,76,.35)'; ctx.fillRect(0, bandY + 2, W, 1);
    drawLogo(ctx, W / 2, 26, Math.min(1.25, W / 640), this.t);
    this.opts.forEach((o, i) => {
      const y = bandY + 14 + i * 32;
      const on = i === this.sel;
      const w = Math.max(220, textWidth(o, 20) + 80);
      if (on) {
        ctx.fillStyle = 'rgba(242,201,76,.14)'; ctx.fillRect(W / 2 - w / 2, y - 6, w, 30);
        ctx.fillStyle = UI.sakura; ctx.fillRect(W / 2 - w / 2, y - 6, 3, 30);
      }
      text(o, W / 2, y, on ? UI.paper : 'rgba(240,232,220,.6)', 20, 'center');
      if (on) drawCursor(W / 2 - w / 2 + 16, y + 3);
    });
    text('© Kundai  ·  ' + (Controls.mode === 'touch' ? 'Tap to choose' : 'Arrows / WASD  ·  Z or Enter'), W / 2, H - 22, 'rgba(255,255,255,.55)', 12, 'center', false);
  }
}

// ---------------------------------------------------------------- boot flow
function goTitle() {
  Scenes.stack.length = 0;
  Sound.stop(); Sound.play('title');
  Weather.set('clear', 0);
  Scenes.push(new TitleScene());
  fadeIn(0.6);
}
async function continueGame() {
  if (!loadGame()) { toast('No save found.', UI.bad); return; }
  await fadeOut(0.4);
  startWorld();
  await fadeIn(0.5);
  toast(`Welcome back, ${G.name}.`, UI.gold);
}
function startWorld() {
  Scenes.stack.length = 0;
  World = new WorldScene();
  Scenes.push(World);
  World.load(G.map, G.x, G.y, G.dir);
}

async function newGame() {
  await fadeOut(0.4);
  Scenes.stack.length = 0;
  Sound.stop();
  // 1. boy or girl — the rest of the face comes later, in the mirror
  const sexScene = new ChoiceCardScene('Who are you?', ['A boy', 'A girl'], 'You choose how you look a little later on.');
  Scenes.push(sexScene);
  await fadeIn(0.4);
  const sx = await sexScene.promise;
  Scenes.remove(sexScene);
  // 2. name
  const ns = new NameEntryScene(sx === 0 ? 'Kaito' : 'Hana');
  Scenes.push(ns);
  const name = await ns.promise;
  Scenes.remove(ns);
  await fadeOut(0.3);
  startNewGame(name, sx === 0 ? 'boy' : 'girl');
  G.hairStyle = sx === 0 ? 'short' : 'long';
  clearHeroSprites();
  // 3. one evening in Tokyo
  startWorld();
  World.load('tokyo', 15, 8, 'down');
  await titleCard('Tokyo', 'Setagaya ward — a Tuesday in May, 18:40');
  await fadeIn(1.0);
  Sound.play('tokyo');
  await World.run(async () => {
    await say(null, `Your name is ${G.name}. You are sixteen, your last exam is in two weeks, and your sister Mei turns thirteen today.`);
    await say(null, 'Aoi is waiting by the school gate.');
  });
}

// a plain full-screen question, used before the game state exists
class ChoiceCardScene {
  constructor(title, opts, sub) { this.title = title; this.opts = opts; this.sub = sub; this.sel = 0; this.t = 0; this.promise = new Promise(r => this.resolve = r); }
  update(dt) {
    this.t += dt;
    if (Input.pressed('up') || Input.pressed('left')) { this.sel = (this.sel + this.opts.length - 1) % this.opts.length; Sound.sfx('cursor'); }
    if (Input.pressed('down') || Input.pressed('right')) { this.sel = (this.sel + 1) % this.opts.length; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) { Sound.sfx('ok'); this.resolve(this.sel); }
  }
  draw() {
    ctx.fillStyle = '#0d0a18'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) { const x = hash2(i, 3) % W, y = (hash2(i, 7) % H + TIME * 6) % H; ctx.fillStyle = '#2a2450'; ctx.fillRect(x, y, 2, 2); }
    text(this.title, W / 2, 120, UI.paper, 26, 'center');
    if (this.sub) text(this.sub, W / 2, 162, UI.dim, 14, 'center', false);
    this.opts.forEach((o, i) => {
      const y = 230 + i * 44, on = i === this.sel, w = 260;
      drawWindow(W / 2 - w / 2, y - 8, w, 38, on ? 0.95 : 0.7);
      text(o, W / 2, y, on ? UI.gold : UI.dim, 20, 'center');
      if (on) drawCursor(W / 2 - w / 2 + 16, y + 3);
    });
  }
}

// ---------------------------------------------------------------- the goddess
class VoidScene {
  constructor() { this.t = 0; this.stars = Array.from({ length: 120 }, () => ({ x: rand(0, 640), y: rand(0, 480), s: rand(0.3, 1.6), r: rand(1, 2.4) })); }
  update(dt) { this.t += dt; for (const s of this.stars) { s.y += s.s * 14 * dt; if (s.y > H) { s.y = -4; s.x = rand(0, W); } } }
  draw() {
    const g = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 420);
    g.addColorStop(0, '#1d1740'); g.addColorStop(1, '#05030e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const s of this.stars) { ctx.globalAlpha = 0.4 + Math.sin(TIME * 2 + s.x) * 0.3; ctx.fillStyle = '#cfd8ff'; ctx.fillRect(s.x, s.y, s.r, s.r); }
    ctx.globalAlpha = 1;
    const cy = H / 2 - 30 + Math.sin(TIME * 1.2) * 6;
    glow(W / 2, cy, 150, 'rgba(180,160,255,.28)');
    glow(W / 2, cy, 70, 'rgba(255,255,255,.22)');
    const img = charSprite('goddess', 'down', 0);
    ctx.drawImage(img, W / 2 - 84, cy - 84, 168, 168);
    FX.bloom(0.4);
  }
}
async function voidSequence() {
  Scenes.stack.length = 0;
  const v = new VoidScene();
  Scenes.push(v);
  Sound.stop(); Sound.play('void');
  await fadeIn(2.0);
  await wait(0.8);
  const Gd = 'Aetheria', s = 'goddess';
  await talk([
    [null, 'You are lying on something that is not a road. There is no sky. There is a woman here, and she looks as if she has been dreading this.'],
    [Gd, `Hello. I am so sorry.`, s],
    [Gd, `You were not supposed to die today. Not at sixteen, not on a Tuesday, not for a ball.`, s],
    [Gd, `That was my error. A gap in the weave, a moment I did not watch, and a truck that should have stopped.`, s]
  ]);
  const c = await ask(Gd, `Is there anything you want to ask me?`, ['Is Mei all right?', 'Is the girl all right?', 'Can I go back?'], s, false);
  if (c === 0) await say(Gd, `Your sister is alive and she is thirteen and she will be sad for a very long time. I am not going to lie to you about that.`, s);
  else if (c === 1) await say(Gd, `She is home. Her mother has not let go of her hand in an hour. You did that.`, s);
  else await say(Gd, `No. I can't undo it. If I could, I would have done it before you had time to ask.`, s);
  await talk([
    [Gd, `What I can do is put you somewhere else. Somewhere you get a whole life, properly, from the beginning.`, s],
    [Gd, `There is a house in a land called Eldoria. House Valen. Not kings — the sort of family the kings send for when something needs doing.`, s],
    [Gd, `They are expecting a child. They have wanted one for eleven years.`, s],
    [Gd, `You will not remember me. You will remember a road, and a girl in a yellow coat, and the sound of a bell — and you will not know why.`, s],
    [Gd, `Go on, then. Be a person. …And ${G.name}? I'm sorry about the cake.`, s]
  ]);
  Sound.sfx('magic');
  await fadeOut(2.4, '#ffffff');
  Scenes.remove(v);
  await nurserySequence();
}

// ---------------------------------------------------------------- born again
class NurseryScene {
  constructor() { this.t = 0; this.cry = 0; this.cried = false; this.promise = new Promise(r => this.resolve = r); this.blink = 0; }
  update(dt) {
    this.t += dt;
    this.blink = (this.blink + dt) % 4;
    if (this.cry > 0) this.cry -= dt;
    if (this.t > 2.5 && !this.cried && Input.pressed('ok')) {
      this.cried = true; this.cry = 1.4;
      Sound.sfx('hurt');
      setTimeout(() => this.resolve(), 2000);
    }
  }
  draw() {
    // seen from inside the crib, looking up at a warm ceiling
    const g = ctx.createRadialGradient(W / 2, H * 0.3, 40, W / 2, H * 0.5, 460);
    g.addColorStop(0, '#5a4438'); g.addColorStop(1, '#1a1218');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3a2a22';
    for (let i = 0; i < 9; i++) ctx.fillRect(i * (W / 8) - 10, 0, 16, H * 0.28);
    ctx.fillStyle = '#4a3428'; ctx.fillRect(0, H * 0.26, W, 14);
    glow(W * 0.2, H * 0.12, 160, 'rgba(255,190,120,.35)');
    // the baby
    const img = babySprite(this.cry > 0);
    const s = 190, bx = W / 2 - s / 2, by = H * 0.42;
    ctx.fillStyle = '#e8dcc4'; ctx.fillRect(bx - 40, by + 40, s + 80, 200);
    ctx.fillStyle = '#d8c8ac'; ctx.fillRect(bx - 40, by + 40, s + 80, 10);
    ctx.drawImage(img, bx, by, s, s);
    if (this.cry > 0) {
      const a = Math.min(1, this.cry);
      for (let i = 0; i < 8; i++) { ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#9fd8ff'; ctx.fillRect(bx + 60 + (i % 2) * 70, by + 110 + ((TIME * 120 + i * 30) % 90), 4, 9); }
      ctx.globalAlpha = 1;
    }
    FX.bloom(0.25);
    const lines = this.cried
      ? ['"There. There he is." "…She. It\'s a she, Aldric." "…I know. I know."']
      : ['Everything is warm, and very loud, and much too bright.', 'Something in you knows what to do here.'];
    drawWindow(40, H - 118, W - 80, 96);
    wrap(lines.join(' '), W - 140, 16).forEach((l, i) => text(l, 64, H - 102 + i * 24, UI.paper, 16, 'left', false));
    if (this.t > 2.5 && !this.cried && Math.floor(TIME * 2) % 2) text(`Press ${Controls.label('ok')} to cry`, W / 2, H - 34, UI.gold, 14, 'center');
  }
}
async function nurserySequence() {
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
  await titleCard('Six years later', 'House Valen, in the hills above Valenford');
  // now the child chooses their own face
  G.age = 'child';
  const h = G.party[0];
  h.cls = 'hero';
  h.equip = { weapon: 'stick', armor: 'childclothes' };
  h.lvl = 1; h.xp = 0; h.hp = maxHP(h); h.mp = maxMP(h);
  G.inv = {}; G.gold = 0;
  clearHeroSprites();
  await mirrorSequence();
  startWorld();
  World.load('valen_manor', 10, 6, 'down');
  Sound.stop(); Sound.play('manor');
  await fadeIn(1.2);
  await World.run(async () => {
    await say('Nanny Perrin', `Up, up, up. Today is the day your father has been threatening you with since you could walk.`, 'nanny');
    await say('Nanny Perrin', `One morning with Master Corwin in the yard, one with Mage Isolde in the study. Blade and word. Then he decides what you are.`, 'nanny');
    await say(null, `TIP: The practice yard is west through the hall; the study is east. Do both.`);
  });
}

// ---------------------------------------------------------------- the mirror
class CreatorScene {
  constructor() {
    this.row = 0; this.t = 0;
    this.rows = [
      { label: 'Hair', key: 'hairStyle', vals: HAIR_STYLES.map(h => h.id), names: HAIR_STYLES.map(h => h.name) },
      { label: 'Hair colour', key: 'hair', vals: HAIR_COLOURS.map(h => h.c), names: HAIR_COLOURS.map(h => h.name) },
      { label: 'Skin', key: 'skin', vals: SKIN_TONES.map(s => s.c), names: SKIN_TONES.map(s => s.name) },
      { label: 'Done', done: true }
    ];
    this.promise = new Promise(r => this.resolve = r);
  }
  cur() { return this.rows[this.row]; }
  shift(d) {
    const r = this.cur();
    if (r.done) return;
    const i = r.vals.indexOf(G[r.key]);
    const n = (i + d + r.vals.length) % r.vals.length;
    G[r.key] = r.vals[n];
    clearHeroSprites();
    Sound.sfx('cursor');
  }
  update(dt) {
    this.t += dt;
    if (Input.pressed('up')) { this.row = (this.row + this.rows.length - 1) % this.rows.length; Sound.sfx('cursor'); }
    if (Input.pressed('down')) { this.row = (this.row + 1) % this.rows.length; Sound.sfx('cursor'); }
    if (Input.pressed('left')) this.shift(-1);
    if (Input.pressed('right')) this.shift(1);
    if (Input.pressed('ok')) { if (this.cur().done) { Sound.sfx('ok'); this.resolve(); } else this.shift(1); }
  }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a1e2c'); g.addColorStop(1, '#120c16');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // a tall mirror
    const mx = W * 0.22, my = 70, mw = 190, mh = 320;
    ctx.fillStyle = '#6a4a28'; ctx.fillRect(mx - 14, my - 14, mw + 28, mh + 28);
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(mx - 8, my - 8, mw + 16, mh + 16);
    const mg = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
    mg.addColorStop(0, '#3a4a58'); mg.addColorStop(0.5, '#5a7080'); mg.addColorStop(1, '#2e3a46');
    ctx.fillStyle = mg; ctx.fillRect(mx, my, mw, mh);
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(mx + 20, my + mh); ctx.lineTo(mx + 90, my); ctx.lineTo(mx + 130, my); ctx.lineTo(mx + 60, my + mh); ctx.fill(); ctx.restore();
    const img = charSprite('hero', 'down', Math.floor(this.t * 3) % 2 ? 0 : 0);
    ctx.drawImage(img, mx + mw / 2 - 110, my + 40, 220, 220);
    glow(mx + mw / 2, my + 120, 150, 'rgba(255,220,170,.18)');
    // candles
    for (const cx of [mx - 40, mx + mw + 40]) { const fy = 200 + Math.sin(TIME * 8 + cx) * 2; ctx.fillStyle = '#e8dcc0'; ctx.fillRect(cx - 4, 210, 8, 40); glow(cx, fy, 40, 'rgba(255,190,110,.5)'); ctx.fillStyle = '#f2c94c'; ctx.fillRect(cx - 2, fy - 6, 4, 8); }
    FX.bloom(0.3);
    // the options
    const px = W * 0.58;
    drawWindow(px - 20, 70, W - px, 300);
    text('Your reflection', px, 84, UI.gold, 18);
    text('You are six years old and you have', px, 112, UI.dim, 13, 'left', false);
    text('opinions about your own hair.', px, 130, UI.dim, 13, 'left', false);
    this.rows.forEach((r, i) => {
      const y = 166 + i * 40, on = i === this.row;
      if (r.done) { text('Done', px + 10, y, on ? UI.paper : UI.dim, 18); if (on) drawCursor(px - 8, y + 2); return; }
      text(r.label, px + 10, y - 12, on ? UI.paper : UI.dim, 13);
      const val = r.names[Math.max(0, r.vals.indexOf(G[r.key]))];
      text('◀', px + 10, y + 6, on ? UI.sakura : UI.dim, 14);
      text(val, px + 100, y + 6, on ? UI.paper : UI.dim, 15, 'center');
      text('▶', px + 180, y + 6, on ? UI.sakura : UI.dim, 14);
      if (on) drawCursor(px - 8, y + 8);
    });
    text('◀ ▶ change   ▲ ▼ move', px + 10, 336, UI.dim, 12, 'left', false);
  }
}
async function mirrorSequence() {
  Scenes.stack.length = 0;
  const c = new CreatorScene();
  Scenes.push(c);
  Sound.stop(); Sound.play('manor');
  await fadeIn(0.8);
  await c.promise;
  await fadeOut(0.8);
  Scenes.remove(c);
  clearHeroSprites();
}

// ---------------------------------------------------------------- the rune trial
class RuneTrialScene {
  constructor(n) {
    this.n = n; this.i = 0; this.score = 0; this.streak = 0; this.best = 0;
    this.seq = Array.from({ length: n }, () => pick(GLYPHS));
    this.t = 0; this.per = 1.25; this.done = false; this.endT = 0;
    this.promise = new Promise(r => this.resolve = r);
    this.flash = null;
  }
  answer(ok) {
    this.seq[this.i].ok = ok;
    if (ok) { this.score++; this.streak++; this.best = Math.max(this.best, this.streak); Sound.sfx('magic'); this.flash = { col: UI.mp, t: 0.3 }; }
    else { this.streak = 0; Sound.sfx('buzz'); this.flash = { col: UI.bad, t: 0.3 }; }
    this.i++; this.t = 0;
    this.per = Math.max(0.62, this.per - 0.05);
    if (this.i >= this.n) { this.done = true; Sound.sfx(this.score > this.n * 0.7 ? 'levelup' : 'cancel'); }
  }
  update(dt) {
    this.t += dt;
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
    if (this.done) {
      this.endT += dt;
      if (this.endT > 1 && Input.pressed('ok')) {
        const pct = Math.round((this.score / this.n) * 80 + (this.best / this.n) * 20);
        this.resolve(clamp(pct, 0, 100));
      }
      return;
    }
    const want = this.seq[this.i];
    for (const g of GLYPHS) if (Input.pressed(g.a)) { this.answer(g.a === want.a); return; }
    if (this.t > this.per) this.answer(false);
  }
  draw() {
    const g = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 420);
    g.addColorStop(0, '#26203e'); g.addColorStop(1, '#0c0a18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const a = TIME * 0.3 + i, r = 150 + (i % 5) * 30; ctx.fillStyle = 'rgba(140,160,255,.25)'; ctx.fillRect(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r * 0.6, 2, 2); }
    // the study, the mage, and a floating rune
    ctx.drawImage(charSprite('courtmage', 'right', 0), 60, 250, 120, 120);
    ctx.drawImage(charSprite('hero', 'left', 0), W - 190, 250, 120, 120);
    if (!this.done) {
      const want = this.seq[this.i];
      const p = this.t / this.per;
      const cx = W / 2, cy = 190;
      glow(cx, cy, 90 - p * 40, this.flash ? (this.flash.col === UI.bad ? 'rgba(229,83,75,.5)' : 'rgba(111,183,242,.6)') : 'rgba(150,140,255,.45)');
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(Math.sin(TIME * 2) * 0.06);
      ctx.strokeStyle = '#b0b8ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 62, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 50, TIME, TIME + 4.2); ctx.stroke();
      ctx.restore();
      text(want.icon, cx, cy - 22, '#e8e2ff', 44, 'center');
      bar(cx - 120, cy + 84, 240, 10, this.per - this.t, this.per, p > 0.6 ? UI.bad : UI.mp);
      text(`Rune ${this.i + 1} of ${this.n}`, cx, cy + 104, UI.dim, 13, 'center', false);
    } else {
      const pct = Math.round((this.score / this.n) * 80 + (this.best / this.n) * 20);
      text(`${this.score} of ${this.n} runes answered`, W / 2, 170, UI.paper, 22, 'center');
      text(`Longest chain: ${this.best}`, W / 2, 208, UI.dim, 16, 'center', false);
      text(`SCORE ${pct}/100`, W / 2, 250, UI.gold, 26, 'center');
      if (this.endT > 1 && Math.floor(TIME * 2) % 2) text(`Press ${Controls.label('ok')}`, W / 2, 310, UI.dim, 14, 'center', false);
    }
    // the runes you have answered so far
    const bw = Math.min(W - 80, this.n * 34);
    this.seq.forEach((s, i) => {
      const x = W / 2 - bw / 2 + i * (bw / this.n) + 8, y = H - 70;
      ctx.fillStyle = s.ok === true ? UI.hp : s.ok === false ? UI.bad : '#2a2448';
      ctx.fillRect(x, y, bw / this.n - 6, 18);
    });
    text('Answer each rune before it fades', W / 2, H - 40, UI.dim, 13, 'center', false);
    FX.bloom(0.35);
  }
}

// ---------------------------------------------------------------- title cards
class CardScene {
  constructor(title, sub) { this.title = title; this.sub = sub; this.t = 0; }
  update(dt) { this.t += dt; }
  draw() {
    ctx.fillStyle = '#07050d'; ctx.fillRect(0, 0, W, H);
    const a = Math.min(1, this.t * 1.6);
    ctx.globalAlpha = a;
    text(this.title, W / 2, H / 2 - 30, UI.paper, 30, 'center');
    if (this.sub) text(this.sub, W / 2, H / 2 + 20, UI.dim, 15, 'center', false);
    ctx.fillStyle = UI.sakura;
    ctx.fillRect(W / 2 - 80 * a, H / 2 + 4, 160 * a, 2);
    ctx.globalAlpha = 1;
  }
}
async function titleCard(title, sub, hold = 2.6) {
  const c = new CardScene(title, sub);
  Scenes.push(c);
  await fadeIn(0.8);
  await wait(hold);
  await fadeOut(0.8);
  Scenes.remove(c);
}

// ---------------------------------------------------------------- the loop
let World = null;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  TIME += dt;
  Timers.update(dt);
  Weather.update(dt);                    // rain keeps falling while people talk
  const top = Scenes.top();
  if (top && top.update) top.update(dt);
  BattleClock.update(dt);
  if (typeof Controls !== 'undefined' && Controls.update) Controls.update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  Scenes.draw();
  drawFade();
  drawToasts(dt);
  if (Controls.mode === 'touch') Controls.draw();
  Input.endFrame();
  requestAnimationFrame(frame);
}

async function boot() {
  loadSettings();
  Controls.build();
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  document.addEventListener('fullscreenchange', () => { fitCanvas(); Controls.layout(); });

  Fade.a = 1;
  Scenes.push(new CardScene('I GOT ISEKAI\'D', 'The Video Game'));
  requestAnimationFrame(frame);          // start drawing before anything that might wait on the network
  await fadeIn(0.6);
  await wait(0.6);
  if (typeof Cloud !== 'undefined') { try { await Cloud.syncOnBoot(); } catch (e) { console.warn(e); } }
  await fadeOut(0.4);
  goTitle();
}
boot();
