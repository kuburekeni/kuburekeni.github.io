// =====================================================================
//  console.js : when the game is the whole machine
//  On a Pi set up with pi/install-console.sh the game is served by a
//  tiny local server that can also turn the Pi off, restart it, pair a
//  Bluetooth controller and drop to a terminal. This finds that server
//  and adds a Power menu to the title screen and to Settings. Anywhere
//  else (the website, a desktop browser) none of this appears.
// =====================================================================
const Console = {
  on: false, version: '',
  async check() {
    if (!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
    try {
      const r = await fetch('/__console', { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      this.on = !!j.console; this.version = j.version || ''; this.audio = !!j.audio;
      if (this.on) { const h = document.getElementById('hint'); if (h) h.style.display = 'none'; }
      // refresh the title menu if it's already up
      const t = Scenes.top && Scenes.top();
      if (this.on && t && t.constructor && t.constructor.name === 'TitleScene' && typeof titleOpts === 'function') t.opts = titleOpts();
    } catch (e) {}
  },
  async post(path, timeout = 90000) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), timeout);
    try { const r = await fetch(path, { method: 'POST', signal: ctl.signal }); return await r.json(); }
    catch (e) { return { ok: false, error: 'No answer from the console.' }; }
    finally { clearTimeout(tm); }
  }
};

// a full-screen "please wait" card with a spinner
class BusyScene {
  constructor(title, sub) { this.title = title; this.sub = sub; this.t = 0; }
  update(dt) { this.t += dt; }
  draw() {
    ctx.fillStyle = 'rgba(5,3,10,.92)'; ctx.fillRect(0, 0, W, H);
    text(this.title, W / 2, H / 2 - 40, UI.gold, 20, 'center');
    if (this.sub) this.sub.split('\n').forEach((l, i) => text(l, W / 2, H / 2 - 8 + i * 20, UI.paper, 13, 'center', false));
    for (let i = 0; i < 8; i++) {
      const a = this.t * 5 + i * Math.PI / 4, al = ((i + Math.floor(this.t * 8)) % 8) / 8;
      ctx.fillStyle = `rgba(242,201,76,${0.2 + al * 0.8})`;
      ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * 16, H / 2 + 70 + Math.sin(a) * 16, 3, 0, 7); ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- sound: pick the output, set the volume, test it
async function getJSON(path) { try { const r = await fetch(path, { cache: 'no-store' }); return await r.json(); } catch (e) { return null; } }
function niceSink(name) {
  if (/HDMI\s*2|hdmi1\b/i.test(name)) return 'HDMI port 2';
  if (/HDMI/i.test(name)) return 'HDMI port 1';
  if (/USB/i.test(name)) return 'USB speakers / headset: ' + name.replace(/^.*?USB\s*/i, '').slice(0, 30);
  if (/blue|bluez|a2dp/i.test(name)) return 'Bluetooth: ' + name.slice(0, 30);
  return name.slice(0, 44);
}
function playTest() {
  try { Sound.unlock(); Sound.sfx('levelup'); setTimeout(() => Sound.sfx('chest'), 700); } catch (e) {}
}
async function soundMenu() {
  if (!Console.audio) {
    await say(null, 'The console needs a quick tools update for this. Send this version from your PC with update-pi.bat — or, once, choose Exit to terminal and type:  sudo bash /opt/isekai/pi/console/refresh-tools.sh  — then restart.');
    return;
  }
  let idx = 0;
  while (true) {
    const r = await getJSON('/__audio');
    const sinks = (r && r.sinks) || [];
    const def = sinks.find(x => x.default);
    let vol = def && def.vol != null ? Math.round(def.vol * 100) : 100;
    const items = [
      { label: 'Play a test sound', desc: 'A short jingle. If you hear nothing, pick a different output below and try again.' },
      { label: 'Volume', right: vol + '%', desc: '◀ ▶ to change the console\'s volume. (The game\'s own music and effects levels are under Settings > More settings.)' }
    ];
    for (const x of sinks) items.push({ label: niceSink(x.name), right: x.default ? '✓ in use' : '', desc: (/HDMI(?!\s*2)/i.test(x.name) ? 'The HDMI port next to the power socket. ' : /HDMI\s*2/i.test(x.name) ? 'The HDMI port further from the power socket. ' : '') + 'Send the sound here, then play a test.' + (x.muted ? '  (It was muted — choosing it unmutes it.)' : '') });
    if (!sinks.length) items.push({ label: 'No sound outputs found', desc: 'The TV isn\'t telling the Pi it can play sound. Try the other HDMI port on the Pi or another input on the TV, a different cable or adapter, then restart.' });
    items.push({ label: 'Back', desc: '' });
    const l = new ListScene({ x: 120, y: 40, w: W - 240, items, title: 'Sound', index: Math.min(idx, items.length - 1), rows: 8 });
    l.onSide = async (i, d) => {
      if (i !== 1) return;
      vol = Math.max(0, Math.min(150, vol + d * 10));
      l.items[1].right = vol + '%';
      await Console.post('/__audio/volume?v=' + (vol / 100), 5000);
      Sound.sfx('cursor');
    };
    Scenes.push(l);
    const i = await l.promise;
    if (i < 0 || items[i].label === 'Back') return;
    idx = i;
    if (i === 0) { playTest(); continue; }
    if (i === 1) { vol = vol >= 100 ? 50 : 100; await Console.post('/__audio/volume?v=' + (vol / 100), 5000); playTest(); continue; }
    const sink = sinks[i - 2];
    if (!sink) { await say(null, items[i].desc); continue; }
    await Console.post('/__audio/default?id=' + sink.id, 5000);
    await new Promise(res => setTimeout(res, 600));
    playTest();
    await say(null, `Sound now goes to ${niceSink(sink.name)}. Did you hear the jingle? If not, try the next one.`);
  }
}

async function powerMenu() {
  const items = [
    { label: 'Sound: output, volume & test', desc: 'Choose where the sound goes (TV, other HDMI port, USB speakers), set the volume, and play a test sound.' },
    { label: 'Pair a Bluetooth controller', desc: 'Hold the pairing button on top of an Xbox controller until the logo flashes fast, then choose this.' },
    { label: 'Restart', desc: 'Restart the console. Your game is saved first.' },
    { label: 'Turn off', desc: 'Save and switch the console off. Unplug it once the green light stops blinking.' },
    { label: 'Exit to terminal', desc: 'Close the game and go to the Pi\'s command line. Type  isekai  there to come back.' },
    { label: 'Back', desc: '' }
  ];
  const l = new ListScene({ x: 160, y: 60, w: W - 320, items, title: 'Power' + (Console.version ? '  ·  build ' + Console.version.slice(0, 7) : ''), rows: 7 });
  Scenes.push(l);
  const i0 = await l.promise;
  if (i0 === 0) { await soundMenu(); return; }
  const i = i0 < 0 ? -1 : i0 - 1;
  if (i < 0 || i === 4) return;
  const saveFirst = () => { try { if (typeof World !== 'undefined' && World && G && G.map && Scenes.stack.includes(World)) saveGame(true); } catch (e) {} };
  if (i === 0) {
    const busy = new BusyScene('Looking for controllers…', 'Hold the pairing button on top of the controller\nuntil the Xbox logo flashes quickly.');
    Scenes.push(busy);
    const r = await Console.post('/__pair');
    Scenes.pop();
    Sound.sfx(r.ok ? 'chime' : 'buzz');
    await say(null, r.ok ? `Paired: ${r.name || 'controller'}. Press any button on it to start using it.` : (r.error || 'No controller found.'));
    return;
  }
  const verb = ['', 'Restart', 'Turn off', 'Exit to terminal'][i];
  const c = new ListScene({ x: 220, y: 150, w: W - 440, items: [{ label: verb, desc: '' }, { label: 'Cancel', desc: '' }], title: verb + '?', rows: 2, showDesc: false });
  Scenes.push(c);
  if ((await c.promise) !== 0) return;
  saveFirst();
  Sound.stop && Sound.stop(0.3);
  Scenes.push(new BusyScene(i === 1 ? 'Restarting…' : i === 2 ? 'Turning off…' : 'Closing the game…', i === 2 ? 'You can unplug the console when the green light stops blinking.' : ''));
  await Console.post(i === 1 ? '/__power/reboot' : i === 2 ? '/__power/off' : '/__power/terminal', 8000);
}

// ---------------------------------------------------------------- the console starts its sound by itself, and reports on itself
// (the log is readable over SSH:  tail -f /tmp/isekai-log.txt)
Console.log = function (kind, data) {
  if (!this.on) return;
  try { fetch('/__log', { method: 'POST', body: JSON.stringify(Object.assign({ t: new Date().toTimeString().slice(0, 8), kind }, data || {})) }).catch(() => {}); } catch (e) {}
};
window.addEventListener('error', e => Console.log('error', { msg: String(e.message), at: (e.filename || '').split('/').pop() + ':' + e.lineno }));
window.addEventListener('unhandledrejection', e => Console.log('reject', { msg: String(e.reason && e.reason.message || e.reason) }));
{
  const ce = console.error;
  console.error = function (...a) { try { Console.log('console.error', { msg: a.map(x => x && x.stack ? x.stack : String(x)).join(' ').slice(0, 400) }); } catch (e) {} return ce.apply(this, a); };
}
Console.startAudio = function () {
  try {
    Sound.unlock();
    const c = Sound.ctx;
    if (c && c.state !== 'running') c.resume().catch(() => {});
    if (c && !Console.meter && Sound.master) { Console.meter = c.createAnalyser(); Console.meter.fftSize = 2048; Sound.master.connect(Console.meter); }
  } catch (e) { Console.log('audio-start-failed', { msg: String(e) }); }
};
setInterval(() => {
  if (!Console.on) return;
  Console.startAudio();
  const c = Sound.ctx;
  let peak = null;
  if (Console.meter) { const a = new Float32Array(Console.meter.fftSize); Console.meter.getFloatTimeDomainData(a); peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v)); peak = +peak.toFixed(4); }
  Console.log('audio', {
    state: c ? c.state : 'none', rate: c ? c.sampleRate : null, clock: c ? +c.currentTime.toFixed(1) : null,
    track: Sound.trackName || Sound.pending || null, volumes: Sound.vol, level: peak,
    sampler: typeof Sampler !== 'undefined' ? Object.keys(Sampler.ready).join(',') : null,
    screen: Scenes.top() && Scenes.top().constructor.name,
    musicSkips: typeof AudioLite !== 'undefined' ? AudioLite.skips : null
  });
}, 5000);
Console.check().then(() => { if (Console.on) { Console.log('boot', { version: Console.version, ua: navigator.userAgent.slice(0, 120) }); Console.startAudio(); } });
// the title screen gets a Power option on the console
if (typeof LATE !== 'undefined') LATE.push(() => {
  if (typeof titleOpts === 'function' && !titleOpts._console) {
    const t0 = titleOpts;
    titleOpts = function () { const o = t0(); if (Console.on && !o.includes('Power')) o.push('Power'); return o; };
    titleOpts._console = true;
  }
  if (typeof TitleScene !== 'undefined' && !TitleScene.prototype._console) {
    const u0 = TitleScene.prototype.update;
    TitleScene.prototype.update = function (dt) {
      if (Input.pressed('ok') && this.opts[this.sel] === 'Power' && !this._busy) {
        Sound.sfx('ok'); this._busy = true;
        powerMenu().finally(() => { this._busy = false; });
        this.t += dt; return;
      }
      return u0.call(this, dt);
    };
    TitleScene.prototype._console = true;
  }
});
