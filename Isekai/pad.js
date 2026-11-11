// =====================================================================
//  pad.js : Xbox One / Xbox Series / generic controller support
//   - works with the standard mapping (USB, most Bluetooth drivers) and
//     the raw Linux Bluetooth layout an Xbox pad reports on a Raspberry Pi
//   - left stick or d-pad to move; push the stick all the way to run
//   - A talk/confirm · B back · X hold to run · Y world map
//   - Menu (☰) pause menu · View (⧉) world map · LB/RB page lists
//   - rumble on big hits, button prompts switch to Xbox letters
//   - Settings → "Controller setup" remaps buttons if a pad is unusual
// =====================================================================
const Pad = {
  map: null,          // custom button indices, saved per device
  prev: {}, gp: null, lastShake: 0, stickRun: false, connectedId: '',
  KEY: 'isekai_pad_v1',
  load() { try { const s = JSON.parse(localStorage.getItem(this.KEY) || '{}'); this.custom = s; } catch (e) { this.custom = {}; } },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.custom)); } catch (e) { } },
  // the layout a given pad most likely uses
  layoutFor(gp) {
    if (this.custom && this.custom[gp.id]) return this.custom[gp.id];
    if (gp.mapping === 'standard') return { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, view: 8, menu: 9, up: 12, down: 13, left: 14, right: 15 };
    // raw Xbox One pad over Bluetooth on Linux (no xpadneo): A B _ X Y _ LB RB _ _ View Menu Xbox LS RS
    if (/xbox|045e|microsoft/i.test(gp.id) && gp.buttons.length >= 15) return { a: 0, b: 1, x: 3, y: 4, lb: 6, rb: 7, view: 10, menu: 11, lt: -1, rt: -1, hat: true };
    // xpad-style raw layout: A B X Y LB RB View Menu Xbox LS RS, d-pad on axes 6/7
    return { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, view: 6, menu: 7, lt: -1, rt: -1, hat: true };
  },
  pick() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let best = null;
    for (const p of pads) if (p && p.connected) { if (!best || /xbox|045e/i.test(p.id)) best = p; }
    return best;
  },
  btn(gp, i) { return i >= 0 && gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5); },
  // the d-pad, from buttons or from the hat/axes some drivers use
  dpad(gp, L) {
    const d = { up: false, down: false, left: false, right: false };
    if (L.up !== undefined && gp.buttons.length > 15 && !L.hat) {
      d.up = this.btn(gp, L.up); d.down = this.btn(gp, L.down); d.left = this.btn(gp, L.left); d.right = this.btn(gp, L.right);
      return d;
    }
    const ax = gp.axes;
    if (ax.length >= 8 && (Math.abs(ax[6]) > 0.5 || Math.abs(ax[7]) > 0.5)) {
      d.left = ax[6] < -0.5; d.right = ax[6] > 0.5; d.up = ax[7] < -0.5; d.down = ax[7] > 0.5; return d;
    }
    if (ax.length >= 10 && ax[9] >= -1.01 && ax[9] <= 1.01) {
      // a single "hat" axis: -1 up, then clockwise in steps of 2/7; resting is ~1.28
      const v = ax[9], step = Math.round((v + 1) / (2 / 7));
      if (v < 1.1) {
        d.up = step === 0 || step === 1 || step === 7; d.right = step >= 1 && step <= 3;
        d.down = step >= 3 && step <= 5; d.left = step >= 5 && step <= 7;
      }
    }
    // standard pads also report the d-pad as buttons 12-15
    if (gp.buttons.length > 15) { d.up = d.up || this.btn(gp, 12); d.down = d.down || this.btn(gp, 13); d.left = d.left || this.btn(gp, 14); d.right = d.right || this.btn(gp, 15); }
    return d;
  },
  rumble(ms = 120, strong = 0.6, weak = 0.4) {
    const gp = this.gp; if (!gp || Pad.noRumble) return;
    try { if (gp.vibrationActuator) gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }); } catch (e) { }
  },
  poll() {
    const gp = this.pick(); this.gp = gp;
    if (!gp) return;
    if (gp.id !== this.connectedId) { this.connectedId = gp.id; this.prev = {}; }
    if (this.remap) return this.remapStep(gp);
    const L = this.layoutFor(gp), B = i => this.btn(gp, i);
    const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0, dead = 0.42, mag = Math.hypot(lx, ly);
    const dp = this.dpad(gp, L);
    // the stick picks one of four directions with a little stickiness so diagonals don't jitter
    let sd = null;
    if (mag > dead) sd = Math.abs(lx) > Math.abs(ly) * (this.lastAxis === 'y' ? 1.25 : 0.8) ? (lx > 0 ? 'right' : 'left') : (ly > 0 ? 'down' : 'up');
    this.lastAxis = sd === 'left' || sd === 'right' ? 'x' : sd ? 'y' : this.lastAxis;
    this.stickRun = mag > 0.93;
    const state = {
      ArrowUp: dp.up || sd === 'up', ArrowDown: dp.down || sd === 'down', ArrowLeft: dp.left || sd === 'left', ArrowRight: dp.right || sd === 'right',
      KeyZ: B(L.a), KeyX: B(L.b), KeyC: B(L.menu), KeyN: B(L.y) || B(L.view),
      PageUp: B(L.lb), PageDown: B(L.rb),
      ShiftLeft: B(L.x) || B(L.rt) || this.stickRun
    };
    let any = false;
    for (const code in state) {
      const now = state[code], was = !!this.prev[code];
      if (now && !was) { any = true; if (code === 'ShiftLeft') Input.down.add(code); else Controls.press(code); }
      if (!now && was) { if (code === 'ShiftLeft') { if (!Controls.run) Input.down.delete(code); } else Controls.release(code); }
      this.prev[code] = now;
    }
    if (any || mag > dead) Controls.setMode('pad');
    // rumble when a battle shakes the screen
    const bs = Scenes.stack.find(s => s && s.shakeT !== undefined);
    const sh = bs ? bs.shakeT : 0;
    if (sh > this.lastShake + 0.05) this.rumble(Math.round(120 + sh * 400), Math.min(1, 0.35 + sh), 0.3);
    this.lastShake = sh;
  },

  // ---------------------------------------------------------------- remapping
  REMAP_ORDER: [['a', 'A  (talk / confirm)'], ['b', 'B  (back)'], ['x', 'X  (hold to run)'], ['y', 'Y  (world map)'], ['menu', 'Menu ☰  (pause)'], ['view', 'View ⧉  (map)'], ['lb', 'LB  (page up)'], ['rb', 'RB  (page down)']],
  remapStep(gp) {
    const r = this.remap;
    const down = gp.buttons.map((b, i) => (b.pressed || b.value > 0.5) ? i : -1).filter(i => i >= 0);
    if (r.wait) { if (!down.length) r.wait = false; return; }
    if (down.length) {
      r.res[this.REMAP_ORDER[r.i][0]] = down[0]; r.i++; r.wait = true; Sound.sfx('cursor');
      if (r.i >= this.REMAP_ORDER.length) {
        const old = this.layoutFor(gp);
        const res = Object.assign({}, old, r.res);
        this.custom[gp.id] = res; this.save();
        const done = r.done; this.remap = null; done(true);
      }
    }
  }
};
Pad.load();
Input.map.map = ['KeyN'];
Input.map.pgup = ['PageUp'];
Input.map.pgdn = ['PageDown'];
Input.map.menu = ['KeyC', 'KeyM', 'Tab', 'Escape'];

Controls.pollPad = function () { Pad.poll(); };
Controls.label = function (a) {
  const L = {
    keys: { ok: 'Z', cancel: 'X', menu: 'C', map: 'N', run: 'Shift' },
    touch: { ok: 'A', cancel: 'B', menu: 'MENU', map: 'MAP', run: 'RUN' },
    pad: { ok: 'A', cancel: 'B', menu: 'Menu', map: 'Y', run: 'X' }
  };
  return (L[this.mode] || L.keys)[a] || a;
};
window.addEventListener('gamepaddisconnected', () => { toast('Controller disconnected', UI.dim); Input.down.clear(); Controls.held.clear(); Pad.prev = {}; });

// a screen that asks you to press each button in turn
class PadRemapScene {
  constructor() { this.promise = new Promise(r => this.resolve = r); this.t = 0; Pad.remap = { i: 0, res: {}, wait: true, done: ok => this.resolve(ok) }; }
  update(dt) {
    this.t += dt;
    if (!Pad.gp && this.t > 0.5 && Input.pressed('cancel')) { Pad.remap = null; this.resolve(false); }
    if (Input.down.has('Escape') && this.t > 0.5) { Pad.remap = null; this.resolve(false); }
  }
  draw() {
    ctx.fillStyle = 'rgba(7,5,20,.92)'; ctx.fillRect(0, 0, W, H);
    drawWindow(W / 2 - 220, 110, 440, 230);
    text('Controller setup', W / 2, 128, UI.gold, 20, 'center');
    if (!Pad.gp) { text('Plug in or pair a controller, then press any button.', W / 2, 190, UI.paper, 15, 'center', false); text('Esc to go back', W / 2, 300, UI.dim, 13, 'center', false); return; }
    text(Pad.gp.id.slice(0, 54), W / 2, 158, UI.dim, 11, 'center', false);
    const r = Pad.remap; if (!r) return;
    const [, label] = Pad.REMAP_ORDER[Math.min(r.i, Pad.REMAP_ORDER.length - 1)];
    text('Press the button for', W / 2, 196, UI.paper, 15, 'center', false);
    text(label, W / 2, 222, UI.sakura, 22, 'center');
    text(`${r.i + 1} of ${Pad.REMAP_ORDER.length}`, W / 2, 262, UI.dim, 13, 'center', false);
    drawPadGlyph(W / 2, 300, Pad.REMAP_ORDER[Math.min(r.i, Pad.REMAP_ORDER.length - 1)][0]);
  }
}
// a little picture of the button being asked for
function drawPadGlyph(cx, cy, which) {
  const col = { a: '#5cb85c', b: '#e5534b', x: '#4a8ad8', y: '#f2c94c' }[which];
  if (col) {
    ctx.fillStyle = UI.ink; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill();
    text(which.toUpperCase(), cx, cy - 8, '#fff', 15, 'center');
  } else { drawWindow(cx - 34, cy - 14, 68, 28, 0.9); text(which.toUpperCase(), cx, cy - 7, UI.paper, 13, 'center'); }
}
async function padSetup() {
  const s = new PadRemapScene(); Scenes.push(s);
  const ok = await s.promise; Scenes.remove(s);
  toast(ok ? 'Controller buttons saved.' : 'Controller setup cancelled.', ok ? UI.hp : UI.dim);
}
function padReset() { const gp = Pad.pick(); if (gp && Pad.custom[gp.id]) { delete Pad.custom[gp.id]; Pad.save(); } toast('Controller layout reset to default.', UI.gold); }

// lists: LB / RB (or PageUp / PageDown) jump a page
{
  const lu0 = ListScene.prototype.update;
  ListScene.prototype.update = function (dt) {
    if ((Input.pressed('pgup') || Input.pressed('pgdn')) && this.items && this.items.length) {
      const n = this.rows || 6, d = Input.pressed('pgup') ? -n : n;
      this.index = clamp(this.index + d, 0, this.items.length - 1); this.fixScroll(); Sound.sfx('cursor');
      if (this.onMove) this.onMove(this.index);
    }
    return lu0.call(this, dt);
  };
}

// name entry with a controller: an on-screen keyboard instead of a browser prompt
{
  const ROWS = ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ\'- ', 'abcdefghij', 'klmnopqrst', 'uvwxyz0123'];
  const nu0 = NameEntryScene.prototype.update, nd0 = NameEntryScene.prototype.draw;
  NameEntryScene.prototype.update = function (dt) {
    if (Controls.mode !== 'pad') return nu0.call(this, dt);
    if (this.kx === undefined) { this.kx = 0; this.ky = 0; }
    const rowsN = ROWS.length + 1;
    if (Input.pressed('up')) { this.ky = (this.ky + rowsN - 1) % rowsN; Sound.sfx('cursor'); }
    if (Input.pressed('down')) { this.ky = (this.ky + 1) % rowsN; Sound.sfx('cursor'); }
    const rowLen = this.ky < ROWS.length ? ROWS[this.ky].length : 3;
    if (Input.pressed('left')) { this.kx = (this.kx + rowLen - 1) % rowLen; Sound.sfx('cursor'); }
    if (Input.pressed('right')) { this.kx = (this.kx + 1) % rowLen; Sound.sfx('cursor'); }
    this.kx = Math.min(this.kx, rowLen - 1);
    if (Input.pressed('cancel')) { this.name = this.name.slice(0, -1); this.first = false; Sound.sfx('cancel'); }
    if (Input.pressed('menu')) this.ky = ROWS.length, this.kx = 2;
    if (Input.pressed('ok')) {
      if (this.ky < ROWS.length) {
        const ch = ROWS[this.ky][this.kx];
        if (this.first) { this.name = ''; this.first = false; }
        if (this.name.length < 10 && !(ch === ' ' && !this.name)) { this.name += ch; Sound.sfx('talk'); }
      } else if (this.kx === 0) { this.name = this.name.slice(0, -1); this.first = false; Sound.sfx('cancel'); }
      else if (this.kx === 1) { this.name = ''; this.first = false; Sound.sfx('cancel'); }
      else { const n = this.name.trim(); if (!n) { Sound.sfx('buzz'); return; } Sound.sfx('ok'); Scenes.remove(this); this.resolve(n); }
    }
  };
  NameEntryScene.prototype.draw = function () {
    if (Controls.mode !== 'pad') return nd0.call(this);
    const cx = W / 2, top = 70;
    drawWindow(cx - 230, top, 460, 330);
    text('What is your name?', cx, top + 16, UI.gold, 17, 'center');
    ctx.fillStyle = UI.ink; ctx.fillRect(cx - 150, top + 46, 300, 36);
    ctx.fillStyle = '#2a3263'; ctx.fillRect(cx - 148, top + 48, 296, 32);
    text(this.name + (Math.floor(TIME * 2) % 2 ? '_' : ' '), cx, top + 54, this.first ? UI.dim : UI.paper, 19, 'center');
    ROWS.forEach((r, j) => [...r].forEach((ch, i) => {
      const x = cx - 180 + i * 36, y = top + 96 + j * 30, on = this.ky === j && this.kx === i;
      if (on) { ctx.fillStyle = 'rgba(242,143,173,.35)'; ctx.fillRect(x - 4, y - 3, 30, 26); }
      text(ch === ' ' ? '␣' : ch, x + 11, y, on ? UI.paper : UI.dim, 16, 'center');
    }));
    ['Delete', 'Clear', 'Done'].forEach((l, i) => {
      const x = cx - 150 + i * 110, y = top + 96 + ROWS.length * 30 + 6, on = this.ky === ROWS.length && this.kx === i;
      drawWindow(x, y - 4, 92, 28, on ? 0.95 : 0.6); text(l, x + 46, y + 1, on ? UI.gold : UI.dim, 14, 'center');
    });
    text('A type · B delete · Menu jump to Done', cx, top + 306, UI.dim, 12, 'center', false);
  };
}

// ---------------------------------------------------------------- presses that arrive late in the frame
// The loop updates the screen first, polls the controller after, then clears
// "just pressed" — so a button pressed on the pad was wiped before any screen
// saw it (holding a direction worked, but A / B / Menu never did). Anything
// pressed during the controller poll is now carried into the next frame.
{
  const pending = new Set();
  const up0 = Controls.update.bind(Controls);
  Controls.update = function (dt) {
    const before = new Set(Input.pressedSet);
    up0(dt);
    for (const c of Input.pressedSet) if (!before.has(c)) pending.add(c);
  };
  const ef0 = Input.endFrame.bind(Input);
  Input.endFrame = function () {
    ef0();
    for (const c of pending) Input.pressedSet.add(c);
    pending.clear();
  };
}
