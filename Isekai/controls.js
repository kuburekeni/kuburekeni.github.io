// =====================================================================
//  controls.js : on-screen touch controls + gamepad, with automatic
//  switching between keyboard / touch / controller based on what you
//  last used. Everything feeds the same Input object the game reads.
// =====================================================================
const Controls = {
  mode: (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 'touch' : 'keys',
  run: false, held: new Set(), rep: {}, padPrev: {}, el: null,

  setMode(m) {
    if (this.mode === m) return;
    this.mode = m;
    if (this.el) this.el.classList.toggle('on', m === 'touch');
    document.body.classList.toggle('touchmode', m === 'touch');
    if (m !== 'touch' && this.run) this.toggleRun(false);
    fitCanvas();
  },
  label(a) {
    const L = { keys: { ok: 'Z', cancel: 'X', menu: 'Esc' }, touch: { ok: 'A', cancel: 'B', menu: 'MENU' }, pad: { ok: 'Ⓐ', cancel: 'Ⓑ', menu: 'Start' } };
    return L[this.mode][a];
  },
  // space the canvas must leave free at the bottom (portrait phones)
  reserve() {
    if (this.mode !== 'touch') return 0;
    const portrait = window.innerHeight > window.innerWidth * 1.1;
    return portrait ? Math.min(Math.round(window.innerHeight * 0.4), 320) : 0;
  },

  press(code) { Input.down.add(code); Input.pressedSet.add(code); this.held.add(code); Sound.unlock(); },
  release(code) { if (code === 'ShiftLeft' && this.run) return; Input.down.delete(code); this.held.delete(code); delete this.rep[code]; },
  toggleRun(v = !this.run) {
    this.run = v;
    if (v) Input.down.add('ShiftLeft'); else Input.down.delete('ShiftLeft');
    const b = document.getElementById('t-run'); if (b) b.classList.toggle('lit', v);
  },

  build() {
    const css = document.createElement('style');
    css.textContent = `
      #touch { position: fixed; inset: 0; pointer-events: none; display: none; z-index: 5; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
      #touch.on { display: block; }
      #touch * { touch-action: none; }
      .tbtn { position: absolute; pointer-events: auto; border: 3px solid #161226; color: #fff4e0; font: bold 18px "Trebuchet MS", sans-serif;
              display: flex; align-items: center; justify-content: center; box-shadow: inset 0 -4px 0 rgba(0,0,0,.35), 0 3px 10px rgba(0,0,0,.4); }
      .tbtn.down { transform: translateY(2px); filter: brightness(1.35); box-shadow: inset 0 -1px 0 rgba(0,0,0,.35); }
      #t-dpad { position: absolute; pointer-events: auto; border-radius: 50%; background: radial-gradient(circle, rgba(58,50,110,.55), rgba(22,18,38,.55)); border: 3px solid rgba(22,18,38,.8); }
      #t-dpad .arm { position: absolute; background: #3a3470; border: 3px solid #161226; border-radius: 8px; }
      #t-dpad .arm.lit { background: #f28fad; }
      #t-a { background: #d9577f; border-radius: 50%; font-size: 26px; }
      #t-b { background: #3f5fb8; border-radius: 50%; font-size: 24px; }
      .tsys { background: #2a2450; border-radius: 12px; font-size: 13px; letter-spacing: 1px; opacity: .92; }
      .tsys.lit { background: #e5b53a; color: #161226; }
      body.touchmode #hint { display: none; }
      body.touchmode.portrait { align-items: flex-start; padding-top: calc(env(safe-area-inset-top, 0px) + 7vh); }
      body.touchmode.portrait #touch { background: linear-gradient(to bottom, transparent calc(100% - var(--res)), #0d0a22 calc(100% - var(--res))); }`;
    document.head.appendChild(css);
    const el = document.createElement('div'); el.id = 'touch';
    el.innerHTML = `<div id="t-dpad"><div class="arm" data-d="up"></div><div class="arm" data-d="down"></div><div class="arm" data-d="left"></div><div class="arm" data-d="right"></div></div>
      <div class="tbtn" id="t-a" data-k="KeyZ">A</div><div class="tbtn" id="t-b" data-k="KeyX">B</div>
      <div class="tbtn tsys" id="t-menu" data-k="Escape">MENU</div><div class="tbtn tsys" id="t-run">RUN</div><div class="tbtn tsys" id="t-fs">⛶</div>`;
    document.body.appendChild(el);
    this.el = el;
    el.classList.toggle('on', this.mode === 'touch');
    document.body.classList.toggle('touchmode', this.mode === 'touch');

    // A / B / MENU: multitouch-safe press/release
    for (const b of el.querySelectorAll('[data-k]')) {
      const code = b.dataset.k;
      b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) { } b.classList.add('down'); this.press(code); if (navigator.vibrate) navigator.vibrate(8); });
      const up = e => { b.classList.remove('down'); this.release(code); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    }
    const run = el.querySelector('#t-run');
    run.addEventListener('pointerdown', e => { e.preventDefault(); this.toggleRun(); });
    const fs = el.querySelector('#t-fs');
    fs.addEventListener('pointerdown', e => {
      e.preventDefault();
      const d = document, de = d.documentElement;
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else { const f = de.requestFullscreen || de.webkitRequestFullscreen; if (f) Promise.resolve(f.call(de)).then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (_) { } }).catch(() => { }); }
    });
    if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) fs.style.display = 'none';

    // D-pad: slide your thumb around, direction follows it
    const pad = el.querySelector('#t-dpad');
    let pid = null, dir = null;
    const codes = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    const setDir = d => {
      if (d === dir) return;
      if (dir) { this.release(codes[dir]); pad.querySelector(`[data-d=${dir}]`).classList.remove('lit'); }
      dir = d;
      if (d) { this.press(codes[d]); pad.querySelector(`[data-d=${d}]`).classList.add('lit'); if (navigator.vibrate) navigator.vibrate(5); }
    };
    const track = e => {
      const r = pad.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.14) return setDir(null);
      setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    pad.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { pad.setPointerCapture(pid); } catch (_) { } track(e); });
    pad.addEventListener('pointermove', e => { if (e.pointerId === pid) track(e); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; setDir(null); };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end); pad.addEventListener('lostpointercapture', end);
    this.layout();
  },

  // position everything for portrait (controls under the game) or landscape (controls either side)
  layout() {
    if (!this.el) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const portrait = vh > vw * 1.1;
    document.body.classList.toggle('portrait', portrait);
    const res = this.reserve();
    document.documentElement.style.setProperty('--res', res + 'px');
    const $ = id => this.el.querySelector(id);
    const place = (e, x, y, w, h) => Object.assign(e.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    const u = portrait ? Math.min(vw / 390, res / 300) : Math.min(vh / 390, 1.2);
    const P = Math.round(150 * u), B = Math.round(70 * u), gap = Math.round(14 * u);
    const baseY = portrait ? vh - res / 2 : vh - P / 2 - 24 * u;
    const padX = portrait ? 18 * u : 22 * u;
    place($('#t-dpad'), padX, baseY - P / 2, P, P);
    const arm = Math.round(P * 0.3), len = Math.round(P * 0.34);
    for (const a of this.el.querySelectorAll('.arm')) {
      const d = a.dataset.d, v = d === 'up' || d === 'down';
      const w = v ? arm : len, h = v ? len : arm;
      const x = d === 'left' ? P * 0.08 : d === 'right' ? P - len - P * 0.08 - 6 : (P - arm) / 2 - 3;
      const y = d === 'up' ? P * 0.08 : d === 'down' ? P - len - P * 0.08 - 6 : (P - arm) / 2 - 3;
      place(a, x, y, w, h);
    }
    const ax = vw - B - 20 * u, ay = baseY - B * 0.95;
    place($('#t-a'), ax, ay, B, B);
    place($('#t-b'), ax - B - gap, ay + B * 0.6, B, B);
    const sw = Math.round(74 * u), sh = Math.round(32 * u);
    if (portrait) {
      const sy = vh - res + 12 * u;
      place($('#t-menu'), vw / 2 - sw - 6, sy, sw, sh);
      place($('#t-run'), vw / 2 + 6, sy, sw, sh);
      place($('#t-fs'), vw - sh - 12, sy, sh, sh);
    } else {
      place($('#t-menu'), vw - sw - 14, 14, sw, sh);
      place($('#t-run'), 14, 14, sw, sh);
      place($('#t-fs'), vw - sw - sh - 28, 14, sh, sh);
    }
    for (const b of this.el.querySelectorAll('.tbtn')) b.style.fontSize = Math.round((b.id === 't-a' || b.id === 't-b' ? 26 : 13) * Math.max(0.8, u)) + 'px';
  },

  // called every frame: key-repeat for held directions + gamepad polling
  update(dt) {
    for (const code of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      if (!this.held.has(code)) continue;
      const r = this.rep[code] = (this.rep[code] || 0) + dt;
      if (r > 0.38) { Input.pressedSet.add(code); this.rep[code] = 0.38 - 0.11; }
    }
    this.pollPad();
  },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null; for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) return;
    const btn = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, dead = 0.5;
    const state = {
      ArrowUp: btn(12) || ay < -dead, ArrowDown: btn(13) || ay > dead,
      ArrowLeft: btn(14) || ax < -dead, ArrowRight: btn(15) || ax > dead,
      KeyZ: btn(0), KeyX: btn(1), Escape: btn(9) || btn(8), ShiftLeft: btn(2) || btn(5) || btn(7)
    };
    let any = false;
    for (const code in state) {
      const now = state[code], was = !!this.padPrev[code];
      if (now && !was) { any = true; if (code === 'ShiftLeft') Input.down.add(code); else this.press(code); }
      if (!now && was) { if (code === 'ShiftLeft') { if (!this.run) Input.down.delete(code); } else this.release(code); }
      this.padPrev[code] = now;
    }
    if (any) this.setMode('pad');
  }
};

// ---------------------------------------------------------------- mode switching
window.addEventListener('keydown', () => Controls.setMode('keys'), true);
window.addEventListener('touchstart', () => { Controls.setMode('touch'); Sound.unlock(); }, { passive: true, capture: true });
window.addEventListener('pointerdown', e => { Controls.tapped = true; if (e.pointerType === 'mouse' && Controls.mode === 'touch' && !e.target.closest('#touch')) Controls.setMode('keys'); Sound.unlock(); });
window.addEventListener('gamepadconnected', () => { Controls.setMode('pad'); toast('Controller connected 🎮', UI.gold); });
window.addEventListener('resize', () => { Controls.layout(); fitCanvas(); });
window.addEventListener('orientationchange', () => setTimeout(() => { Controls.layout(); fitCanvas(); }, 250));
document.addEventListener('contextmenu', e => { if (Controls.mode === 'touch') e.preventDefault(); });
document.addEventListener('gesturestart', e => e.preventDefault());

// app switched away (phone locked, notification, etc): pause audio and quick-save if safe
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Input.down.clear(); Controls.held.clear(); if (Controls.run) Controls.toggleRun(false);
    if (Sound.ctx && Sound.ctx.state === 'running') Sound.ctx.suspend();
    if (G && World && Scenes.top() === World && World.lock === 0 && World.player.t >= 1) { saveGame(); }
  } else if (Sound.ctx) Sound.ctx.resume();
});

Controls.build();
