// =====================================================================
//  perf.js : graphics quality tiers for slower machines (Raspberry Pi)
//   Low    — flat lighting outside the dark places, no bloom, no flare,
//            no screen rain, simple ground, fewer particles
//   Medium — map detail and tall trees, coloured lighting, no bloom
//   High   — everything
//   Auto   — starts on High and steps down by itself if the frame rate
//            drops, so the game stays smooth
//  Also: an optional FPS counter, and the new top-level Settings menu.
// =====================================================================
const Perf = {
  TIERS: ['Low', 'Medium', 'High'],
  // a Pi: by its user agent, or because the console kiosk serves the game on 127.0.0.1:8080 (Chromium on the Pi reports x86_64)
  isPi: (/aarch64|armv7|armv8|arm64|raspberry/i.test((navigator.userAgent || '') + ' ' + (navigator.platform || '')) && /linux/i.test(navigator.userAgent || '')) || (location.hostname === '127.0.0.1' && location.port === '8080'),
  fps: 60, acc: 0, n: 0, slow: 0, lastDrop: 0, showFps: false,
  init() {
    if (Gfx.quality === undefined) Gfx.quality = 'Auto';
    if (Gfx.tier === undefined) Gfx.tier = 2;
    if (Gfx.lights === undefined) Gfx.lights = true;
    this.showFps = !!Gfx.fps;
    this.apply(Gfx.quality === 'Auto' ? Gfx.tier : this.TIERS.indexOf(Gfx.quality), true);
  },
  tierNow() { return Gfx.quality === 'Auto' ? Gfx.tier : Math.max(0, this.TIERS.indexOf(Gfx.quality)); },
  apply(t, quiet) {
    t = clamp(t, 0, 2);
    if (Gfx.quality === 'Auto') Gfx.tier = t;
    const S = [
      { bloom: false, flare: false, drops: false, detail: false, lights: true, weather: true, particles: 0.4 },
      { bloom: false, flare: false, drops: false, detail: true, lights: true, weather: true, particles: 0.7 },
      { bloom: true, flare: true, drops: true, detail: true, lights: true, weather: true, particles: 1 }
    ][t];
    Object.assign(Gfx, S);
    if (!quiet) saveSettings();
  },
  // called once a frame with the real time step
  tick(dt) {
    this.acc += dt; this.n++;
    if (this.acc >= 1) { this.fps = Math.round(this.n / this.acc); this.acc = 0; this.n = 0; this.judge(); }
  },
  judge() {
    if (Gfx.quality !== 'Auto' || document.hidden) return;
    const playing = World && Scenes.top() === World;
    if (!playing) { this.slow = 0; return; }
    if (this.fps < 42) this.slow++; else this.slow = Math.max(0, this.slow - 1);
    if (this.slow >= 4 && Gfx.tier > 0 && TIME - this.lastDrop > 12) {
      this.lastDrop = TIME; this.slow = 0;
      this.apply(Gfx.tier - 1);
      toast(`Graphics lowered to ${this.TIERS[Gfx.tier]} to keep things smooth`, UI.dim);
    }
  },
  drawFps() {
    if (!this.showFps) return;
    const s = this.fps + ' fps · ' + this.TIERS[this.tierNow()][0];
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(4, 4, 74, 16);
    text(s, 8, 5, this.fps < 40 ? UI.bad : this.fps < 55 ? UI.gold : UI.hp, 11, 'left', false);
  }
};

// flat lighting: on Low, outdoor and lit indoor maps skip the light buffer entirely
{
  const b0 = FX.beginLights, a0 = FX.addLight, e0 = FX.endLights;
  FX.beginLights = function (amb) {
    this.flat = !Gfx.lights && !(World && World.map && World.map.dark && Scenes.stack.includes(World));
    if (this.flat) { this.flatCol = amb; return; }
    return b0.call(this, amb);
  };
  FX.addLight = function () { if (this.flat) return; return a0.apply(this, arguments); };
  FX.endLights = function () {
    if (!this.flat) return e0.call(this);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = this.flatCol; ctx.fillRect(0, 0, W, H); ctx.restore();
  };
}
// fewer particles on lower tiers
{
  const u0 = Particles.update;
  Particles.update = function (dt, camX, camY) {
    u0.call(this, dt, camX, camY);
    const keep = Math.ceil(this.list.length * (Gfx.particles ?? 1));
    if (keep < this.list.length) this.list.length = keep;
  };
}
// measure the frame rate from the main loop without touching it: piggy-back on Timers
{
  let lastT = performance.now();
  const tu0 = Timers.update.bind(Timers);
  Timers.update = function (dt) {
    const now = performance.now(); Perf.tick((now - lastT) / 1000); lastT = now;
    return tu0(dt);
  };
  const dt0 = drawToasts;
  drawToasts = function (dt) { dt0(dt); Perf.drawFps(); };
}
Perf.init();
// patches to things main.js defines (it loads last) are queued here and applied when the game boots
const LATE = [];
{ const ls0 = loadSettings; loadSettings = function () {
  ls0();
  // one-time reset: earlier builds started a Pi lower (or had stepped down on a weak power supply)
  if (!Gfx.fullPower) { Gfx.fullPower = true; if (Gfx.quality === 'Auto') Gfx.tier = 2; saveSettings(); }
  Perf.init(); if (!LATE.done) { LATE.done = true; for (const f of LATE) { try { f(); } catch (e) { console.error(e); } } } }; }

// ---------------------------------------------------------------- settings
{
  const sm0 = settingsMenu;   // the dialogue-scenes menu from stage.js, which leads to the full list
  settingsMenu = async function () {
    let idx = 0;
    while (true) {
      const q = Gfx.quality;
      const items = [
        { label: 'Graphics quality', right: q === 'Auto' ? `Auto (${Perf.TIERS[Gfx.tier]})` : q, desc: 'Low: smoothest on a Raspberry Pi. Medium: tall trees and coloured lighting. High: bloom, lens flare and rain on the screen. Auto picks for you and steps down if the game slows.' },
        { label: 'Show frame rate', right: Perf.showFps ? 'On' : 'Off', desc: 'A small FPS counter in the top-left corner.' },
        { label: 'Controller setup', desc: 'Press each button when asked. Use this if your controller\'s buttons do the wrong things.' },
        { label: 'Reset controller', desc: 'Go back to the standard Xbox layout.' },
        { label: 'Controller rumble', right: Pad.noRumble ? 'Off' : 'On', desc: 'The controller rumbles on big hits.' },
        { label: 'More settings…', desc: 'Volume, dialogue scenes, and each graphics effect on its own.' }
      ];
      if (typeof Console !== 'undefined' && Console.on) items.push({ label: 'Power & controller…', desc: 'Pair a Bluetooth controller, restart, turn the console off, or go to the terminal.' });
      const l = new ListScene({ x: 196, y: 16, w: W - 224, items, title: 'Settings  (◀ ▶ to adjust)', index: idx, rows: 8 });
      const cycleQ = d => {
        const order = ['Auto', 'Low', 'Medium', 'High'];
        Gfx.quality = order[(order.indexOf(Gfx.quality) + d + order.length) % order.length];
        if (Gfx.quality === 'Auto') Perf.apply(2); else Perf.apply(Perf.TIERS.indexOf(Gfx.quality));
        saveSettings(); Sound.sfx('cursor');
        l.items[0].right = Gfx.quality === 'Auto' ? `Auto (${Perf.TIERS[Gfx.tier]})` : Gfx.quality;
        if (!Gfx.weather) Weather.set('clear', 0);
      };
      l.onSide = (i, d) => { if (i === 0) cycleQ(d); else if (i === 1) { Perf.showFps = Gfx.fps = !Perf.showFps; saveSettings(); l.items[1].right = Perf.showFps ? 'On' : 'Off'; } else if (i === 4) { Pad.noRumble = !Pad.noRumble; l.items[4].right = Pad.noRumble ? 'Off' : 'On'; } };
      Scenes.push(l);
      const i = await l.promise;
      if (i < 0) return;
      idx = i;
      if (i === 0) cycleQ(1);
      else if (i === 1) { Perf.showFps = Gfx.fps = !Perf.showFps; saveSettings(); }
      else if (i === 2) await padSetup();
      else if (i === 3) padReset();
      else if (i === 4) { Pad.noRumble = !Pad.noRumble; if (!Pad.noRumble) Pad.rumble(200, 0.8, 0.5); }
      else if (i === 5) await sm0();
      else if (i === 6 && typeof powerMenu === 'function') await powerMenu();
    }
  };
}

// Low graphics: skip the per-region colour grade. It's a full-screen 'overlay' blend, which the
// Pi's graphics chip can't do directly, so the browser has to copy the whole screen first.
LATE.push(() => {
  if (typeof drawGrade !== 'function' || drawGrade._perf) return;
  const g0 = drawGrade;
  drawGrade = function (world) { if (Perf.tierNow() === 0) return; return g0(world); };
  drawGrade._perf = true;
});
