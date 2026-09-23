// =====================================================================
//  main.js : the title screen, the opening, character creation and the loop
// =====================================================================

// ---------------------------------------------------------------- key visual
// The poster the game is named on: the party on a mountain top at dusk,
// looking out over Eldoria, while a wall of ash rolls in from the east.
// Used by the title screen and by the app icon generator.
const KV = { cache: null, key: '' };
function kvRng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// everything that never moves: sky, far mountains, the lowlands and their towns
function kvBackdrop(w, h) {
  const [cv, c] = mkCanvas(w, h);
  c.imageSmoothingEnabled = true;
  const sc = h / 480, r = kvRng(77), hz = h * 0.47;
  // dusk sky, warm in the west, bruised red in the east where the ash is
  const g = c.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, '#120c2e'); g.addColorStop(0.35, '#3a2458'); g.addColorStop(0.7, '#a24a64'); g.addColorStop(1, '#f6a25c');
  c.fillStyle = g; c.fillRect(0, 0, w, hz + 2);
  const e = c.createLinearGradient(w * 0.45, 0, w, 0);
  e.addColorStop(0, 'rgba(60,10,10,0)'); e.addColorStop(1, 'rgba(70,14,10,.65)');
  c.fillStyle = e; c.fillRect(0, 0, w, hz + 2);
  // stars in the high dark
  for (let i = 0; i < 90; i++) {
    const x = r() * w, y = r() * hz * 0.45;
    c.globalAlpha = 0.25 + r() * 0.6; c.fillStyle = r() < 0.2 ? '#ffe6c0' : '#dfe4ff';
    const s = r() < 0.1 ? 2 : 1; c.fillRect(Math.round(x), Math.round(y), s * Math.max(1, sc), s * Math.max(1, sc));
  }
  c.globalAlpha = 1;
  // the setting sun, low in the west
  const sunX = w * 0.16, sunY = hz - 10 * sc;
  let sg = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, 260 * sc);
  sg.addColorStop(0, 'rgba(255,240,200,.95)'); sg.addColorStop(0.12, 'rgba(255,200,120,.7)'); sg.addColorStop(0.5, 'rgba(255,120,80,.18)'); sg.addColorStop(1, 'rgba(255,100,80,0)');
  c.fillStyle = sg; c.fillRect(0, 0, w, h);
  c.fillStyle = '#fff4d8'; c.beginPath(); c.arc(sunX, sunY, 22 * sc, 0, 7); c.fill();
  // long streaks of cloud lit from below
  for (let i = 0; i < 9; i++) {
    const y = hz * (0.3 + r() * 0.55), x = r() * w, len = (120 + r() * 220) * sc;
    const warm = x < w * 0.55;
    c.fillStyle = warm ? `rgba(255,${150 + (r() * 60 | 0)},130,.35)` : 'rgba(120,50,60,.35)';
    c.fillRect(Math.round(x - len / 2), Math.round(y), Math.round(len), Math.max(2, Math.round(3 * sc)));
    c.fillStyle = 'rgba(40,20,50,.35)'; c.fillRect(Math.round(x - len / 2 + 10 * sc), Math.round(y + 3 * sc), Math.round(len * 0.8), Math.max(1, Math.round(2 * sc)));
  }
  // ranges of mountains, each one hazier and bluer than the last
  const range = (base, amp, col, seed, rough) => {
    const rr = kvRng(seed); c.fillStyle = col; c.beginPath(); c.moveTo(0, h);
    let y = base; const pts = [];
    for (let x = 0; x <= w + 8; x += 8 * sc) { y += (rr() - 0.5) * amp * rough; y = clamp(y, base - amp, base + amp * 0.2); pts.push([x, y]); c.lineTo(x, y); }
    c.lineTo(w, h); c.fill();
    return pts;
  };
  const far = range(hz - 6 * sc, 34 * sc, '#6a4a78', 3, 0.5);
  // snow caps catching the last light
  c.fillStyle = 'rgba(255,210,190,.5)';
  for (let i = 1; i < far.length - 1; i++) if (far[i][1] < far[i - 1][1] && far[i][1] < far[i + 1][1] && far[i][1] < hz - 26 * sc) { c.fillRect(far[i][0] - 3 * sc, far[i][1], 6 * sc, 3 * sc); }
  range(hz + 4 * sc, 22 * sc, '#52406a', 5, 0.45);
  // the lowlands of Eldoria
  const lg = c.createLinearGradient(0, hz, 0, h);
  lg.addColorStop(0, '#5a6a5a'); lg.addColorStop(0.15, '#3f6a3e'); lg.addColorStop(0.6, '#2e5a2e'); lg.addColorStop(1, '#1e3a22');
  c.fillStyle = lg; c.fillRect(0, hz + 10 * sc, w, h);
  range(hz + 12 * sc, 8 * sc, '#4a6450', 9, 0.4);
  // patchwork fields
  for (let i = 0; i < 70; i++) {
    const y = hz + 18 * sc + r() * (h - hz) * 0.5, depth = (y - hz) / (h - hz);
    const fw = (14 + r() * 30) * sc * (0.5 + depth * 1.4), fh = (3 + r() * 5) * sc * (0.5 + depth * 1.6);
    const x = r() * w;
    c.fillStyle = pick2(r, ['#6a8a3a', '#8aa04a', '#b8a84a', '#4f7a3a', '#9a8a4a', '#5a8a4a']);
    c.globalAlpha = 0.55; c.fillRect(Math.round(x), Math.round(y), Math.round(fw), Math.round(fh)); c.globalAlpha = 1;
  }
  // woods
  for (let i = 0; i < 160; i++) {
    const cx = r() * w, cy = hz + 16 * sc + r() * (h - hz) * 0.55, depth = (cy - hz) / (h - hz);
    const s = (1.4 + r() * 2.2) * sc * (0.6 + depth * 1.5);
    for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#1f4a2a' : '#2a5a32'; c.beginPath(); c.arc(cx + (r() - 0.5) * s * 4, cy + (r() - 0.5) * s * 1.6, s, 0, 7); c.fill(); }
  }
  // a river, winding out of the far hills and catching the sunset
  c.lineCap = 'round';
  const river = [[w * 0.04, h * 0.95], [w * 0.14, h * 0.72], [w * 0.3, h * 0.66], [w * 0.22, h * 0.58], [w * 0.4, h * 0.53], [w * 0.62, h * 0.51], [w * 0.8, hz + 6 * sc]];
  for (const [lw, col] of [[7, '#2a3a5a'], [4.5, '#e89a6a'], [2, '#ffd8a0']]) {
    c.strokeStyle = col; c.lineWidth = lw * sc; c.beginPath(); c.moveTo(...river[0]);
    for (let i = 1; i < river.length - 1; i++) { const mx = (river[i][0] + river[i + 1][0]) / 2, my = (river[i][1] + river[i + 1][1]) / 2; c.quadraticCurveTo(river[i][0], river[i][1], mx, my); }
    c.lineTo(...river[river.length - 1]); c.stroke();
  }
  // roads between the towns
  c.strokeStyle = 'rgba(220,190,140,.45)'; c.lineWidth = 1.5 * sc;
  c.beginPath(); c.moveTo(w * 0.08, h * 0.62); c.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.45, h * 0.56); c.quadraticCurveTo(w * 0.6, h * 0.54, w * 0.74, h * 0.52); c.stroke();
  // towns: roofs and warm windows (Solmere on its hill, villages scattered)
  KV.towns = [];
  const town = (tx, ty, n, big) => {
    const depth = (ty - hz) / (h - hz), s = sc * (0.7 + depth * 1.3);
    for (let i = 0; i < n; i++) {
      const x = tx + (r() - 0.5) * n * 4 * s, y = ty + (r() - 0.5) * n * 1.2 * s;
      c.fillStyle = '#3a2a2a'; c.fillRect(Math.round(x), Math.round(y), Math.round(5 * s), Math.round(4 * s));
      c.fillStyle = pick2(r, ['#a8402a', '#8a3a3a', '#6a4a6a', '#b85a3a']); c.beginPath(); c.moveTo(x - 1 * s, y); c.lineTo(x + 2.5 * s, y - 3 * s); c.lineTo(x + 6 * s, y); c.fill();
      KV.towns.push([x + 2.5 * s, y + 2 * s, r()]);
    }
    if (big) { // the palace spires
      c.fillStyle = '#d8c8b0';
      for (const [dx, th] of [[-6, 16], [0, 26], [6, 18], [11, 12]]) { c.fillRect(tx + dx * s, ty - th * s, 4 * s, th * s); c.beginPath(); c.moveTo(tx + (dx - 1) * s, ty - th * s); c.lineTo(tx + (dx + 2) * s, ty - (th + 7) * s); c.lineTo(tx + (dx + 5) * s, ty - th * s); c.fillStyle = '#4a5aa8'; c.fill(); c.fillStyle = '#d8c8b0'; }
      c.fillRect(tx - 9 * s, ty - 6 * s, 24 * s, 6 * s);
    }
  };
  town(w * 0.33, h * 0.57, 9, true);   // Solmere
  town(w * 0.12, h * 0.63, 6);        // Valenford
  town(w * 0.5, h * 0.545, 5);        // Aldmere
  town(w * 0.58, h * 0.52, 3);        // Brookvale-ish
  // haze low over the land
  const hg = c.createLinearGradient(0, hz, 0, hz + 60 * sc);
  hg.addColorStop(0, 'rgba(240,150,120,.35)'); hg.addColorStop(1, 'rgba(240,150,120,0)');
  c.fillStyle = hg; c.fillRect(0, hz, w, 60 * sc);
  return cv;
}

function kvAshWall(c, w, h, t, front, sc) {
  const hz = h * 0.47;
  // the land under the ash has already gone grey
  c.save();
  c.beginPath(); c.rect(front - 30 * sc, hz - 4 * sc, w, h); c.clip();
  const gg = c.createLinearGradient(front - 30 * sc, 0, front + 120 * sc, 0);
  gg.addColorStop(0, 'rgba(46,32,34,0)'); gg.addColorStop(1, 'rgba(46,32,34,.94)');
  c.fillStyle = gg; c.fillRect(front - 30 * sc, hz - 4 * sc, w, h);
  c.restore();
  // fires where it has reached the fields
  for (let i = 0; i < 14; i++) {
    const x = front + 10 * sc + (hash2(i, 41) % 1000) / 1000 * (w - front), y = hz + 8 * sc + (hash2(i, 43) % 1000) / 1000 * (h - hz) * 0.35;
    const f = 0.6 + Math.sin(t * 7 + i * 2) * 0.3;
    glowC(c, x, y, 14 * sc * f, 'rgba(255,110,40,.55)');
    c.fillStyle = '#ffd070'; c.fillRect(Math.round(x - sc), Math.round(y - 2 * sc), Math.max(1, Math.round(2 * sc)), Math.max(1, Math.round(3 * sc)));
  }
  // the Rift, a violet wound on the horizon
  const rx = w * 0.9, ry = hz - 30 * sc;
  glowC(c, rx, ry, 90 * sc, 'rgba(170,70,255,.35)');
  c.fillStyle = '#e8c8ff'; c.beginPath(); c.moveTo(rx, ry - 44 * sc); c.lineTo(rx + 6 * sc, ry); c.lineTo(rx, ry + 30 * sc); c.lineTo(rx - 5 * sc, ry); c.fill();
  // the wall itself: billows stacked from the ground to the top of the sky, rolling slowly
  const top = c.createLinearGradient(front - 200 * sc, 0, w, 0);
  top.addColorStop(0, 'rgba(30,18,22,0)'); top.addColorStop(0.35, 'rgba(30,18,22,.55)'); top.addColorStop(1, 'rgba(24,14,18,.9)');
  c.fillStyle = top; c.fillRect(front - 200 * sc, 0, w, hz * 0.55);
  const cols = ['#221418', '#321e20', '#452a28', '#5a3a32'];
  for (let layer = 0; layer < 4; layer++) {
    const lx = front + layer * 34 * sc;
    for (let i = 0; i < 22; i++) {
      const u = i / 21;
      const y = -20 * sc + u * (hz + 50 * sc);
      const lean = Math.pow(1 - u, 1.5) * 70 * sc;                 // the top curls forward over the land
      const x = lx - lean + Math.sin(t * 0.45 + i * 1.7 + layer) * 10 * sc + (hash2(i, layer) % 24) * sc;
      const rad = (34 + (hash2(i * 3, layer) % 30)) * sc;
      c.fillStyle = cols[3 - layer];
      c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill();
      if (layer === 0) {
        // the sunset catches the leading edge; the fires light the underside
        c.fillStyle = `rgba(255,${120 + (u * 60 | 0)},80,${0.1 + u * 0.18})`; c.beginPath(); c.arc(x - rad * 0.4, y - rad * 0.25, rad * 0.5, 0, 7); c.fill();
      }
    }
    c.fillStyle = cols[3 - layer]; c.fillRect(lx + 40 * sc, -10, w, hz + 50 * sc);
  }
  // fire light under the base of the wall
  const bg = c.createLinearGradient(0, hz - 40 * sc, 0, hz + 40 * sc);
  bg.addColorStop(0, 'rgba(255,80,30,0)'); bg.addColorStop(0.6, 'rgba(255,90,30,.45)'); bg.addColorStop(1, 'rgba(255,80,30,0)');
  c.save(); c.globalCompositeOperation = 'lighter';
  c.fillStyle = bg; c.fillRect(front, hz - 40 * sc, w - front, 80 * sc);
  // lightning inside the ash, now and then
  const fl = Math.max(0, Math.sin(t * 1.3) * Math.sin(t * 3.7)) ;
  if (fl > 0.8) { c.fillStyle = `rgba(255,120,90,${(fl - 0.8) * 1.2})`; c.fillRect(front + 60 * sc, 0, w, hz); }
  c.restore();
}
function glowC(c, x, y, r, col) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

// the peak the party stands on
function kvPeak(c, w, h, sc, crest) {
  const r = kvRng(19);
  const pts = [[-10, h * 0.66], [w * 0.05, h * 0.69], [w * 0.14, crest - 8 * sc], [w * 0.2, crest - 14 * sc], [w * 0.3, crest - 10 * sc], [w * 0.42, crest], [w * 0.5, crest + 6 * sc], [w * 0.55, crest + 26 * sc], [w * 0.6, h * 0.86], [w * 0.66, h * 0.93], [w * 0.72, h + 10]];
  const body = c.createLinearGradient(0, crest, 0, h);
  body.addColorStop(0, '#3a2c3c'); body.addColorStop(1, '#140e18');
  c.fillStyle = body; c.beginPath(); c.moveTo(-10, h + 10);
  for (const p of pts) c.lineTo(p[0], p[1]);
  c.lineTo(-10, h + 10); c.fill();
  // warm rim on the sunset side, red rim toward the ash
  c.lineWidth = 3 * sc; c.lineJoin = 'round';
  c.strokeStyle = '#e88a5a'; c.beginPath(); c.moveTo(...pts[1]); for (let i = 2; i <= 5; i++) c.lineTo(...pts[i]); c.stroke();
  c.strokeStyle = '#c0402a'; c.beginPath(); c.moveTo(...pts[5]); for (let i = 6; i < pts.length; i++) c.lineTo(...pts[i]); c.stroke();
  // rock facets and strata
  for (let i = 0; i < 40; i++) {
    const x = r() * w * 0.6, y = crest + 10 * sc + r() * (h - crest);
    c.fillStyle = r() < 0.5 ? 'rgba(90,70,90,.5)' : 'rgba(10,6,14,.45)';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (8 + r() * 26) * sc, y + (r() - 0.3) * 8 * sc); c.lineTo(x + (4 + r() * 10) * sc, y + (4 + r() * 8) * sc); c.fill();
  }
  // tufts of mountain grass on the crest
  for (let i = 0; i < 30; i++) {
    const x = w * 0.08 + r() * w * 0.44, y = crest - 12 * sc + r() * 18 * sc;
    c.fillStyle = r() < 0.5 ? '#5a7a3a' : '#8aa04a';
    c.fillRect(Math.round(x), Math.round(y), Math.round(2 * sc), Math.round((3 + r() * 4) * sc));
  }
}

function drawKeyVisual(c, w, h, opts = {}) {
  const t = opts.still ? 7 : TIME;
  const sc = h / 480;
  const k = w + 'x' + h;
  if (KV.key !== k || !KV.cache) { KV.cache = kvBackdrop(w, h); KV.key = k; }
  c.drawImage(KV.cache, 0, 0);
  // town lights twinkle on as dusk falls
  for (const [x, y, s] of KV.towns || []) {
    const a = 0.55 + Math.sin(t * (1 + s * 2) + s * 20) * 0.35;
    c.fillStyle = `rgba(255,214,120,${a})`; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(1.5 * sc)), Math.max(1, Math.round(1.5 * sc)));
  }
  // the ash creeps west the longer you look at it
  const adv = opts.still ? 0.05 : Math.min(0.14, (opts.t0 !== undefined ? t - opts.t0 : t) * 0.0025);
  const front = w * ((opts.front || 0.66) - adv) + Math.sin(t * 0.4) * 4 * sc;
  kvAshWall(c, w, h, t, front, sc);
  // ash falling across everything, embers drifting on the wind
  for (let i = 0; i < 90; i++) {
    const sp = 12 + (i % 7) * 6, ph = (hash2(i, 17) % 1000) / 1000;
    const x = w - ((ph * (w + 60) + t * sp * sc) % (w + 60)) + 30;
    const y = ((hash2(i, 29) % 1000) / 1000 * h + t * (8 + i % 5 * 4) * sc + Math.sin(t + i) * 6 * sc) % h;
    const ember = i % 6 === 0;
    c.globalAlpha = ember ? 0.5 + Math.sin(t * 6 + i) * 0.4 : 0.55;
    c.fillStyle = ember ? '#ffa040' : '#b8aaa8';
    const s = Math.max(1, Math.round((ember ? 2 : 1.5 + (i % 3) * 0.5) * sc));
    c.fillRect(Math.round(x), Math.round(y), s, s);
  }
  c.globalAlpha = 1;
  // the peak and the party
  const crest = h * (opts.crest || 0.8);
  kvPeak(c, w, h, sc, crest);
  const heroKey = (typeof G !== 'undefined' && G && G.party) ? 'hero' : (opts.girl ? 'posterf' : 'poster');
  const hx = w * (opts.heroX || 0.305);
  // companions a step behind on the ridge, looking out at what is coming
  const cast = opts.cast || [
    ['c:oswin', 0.05, 0.46, 'right', -4], ['c:garrick', 0.125, 0.48, 'right', -10],
    ['c:lyra', 0.195, 0.52, 'right', -16], ['c:wren', 0.425, 0.56, 'up', -4]
  ];
  cast.slice().sort((a, b) => a[2] - b[2]).forEach(([key, fx, s, dir, dy], i) => {
    const size = 200 * sc * s;
    const x = w * fx - size / 2, y = crest + dy * sc - size + 4 * sc;
    const img = safeSprite(key, dir, 0);
    if (!img) return;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w * fx, crest + dy * sc + 2 * sc, size * 0.22, size * 0.05, 0, 0, 7); c.fill();
    c.imageSmoothingEnabled = false;
    c.drawImage(img, Math.round(x), Math.round(y), Math.round(size), Math.round(size));
    // rim light from the fires in the east
    c.save(); c.globalAlpha = 0.28; c.globalCompositeOperation = 'lighter';
    c.drawImage(tintSprite(img, '#ff7040'), Math.round(x), Math.round(y), Math.round(size), Math.round(size));
    c.restore();
  });
  // the hero, in front, cape in the wind
  const size = 168 * sc * (opts.heroScale || 1);
  c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(hx, crest + 10 * sc, size * 0.22, size * 0.05, 0, 0, 7); c.fill();
  const x = hx - size / 2, y = crest + 12 * sc - size;
  const capeT = t * 3;
  c.fillStyle = '#7a1a2a';
  c.beginPath();
  const cx0 = hx - size * 0.1, cy0 = y + size * 0.52;
  c.moveTo(cx0, cy0);
  for (let i = 0; i <= 6; i++) { const u = i / 6; c.lineTo(cx0 - u * size * 0.34, cy0 + u * size * 0.18 + Math.sin(capeT + u * 4) * 8 * sc * u); }
  for (let i = 6; i >= 0; i--) { const u = i / 6; c.lineTo(cx0 - u * size * 0.3, cy0 + size * 0.36 + Math.sin(capeT + u * 4 + 0.6) * 10 * sc * u); }
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,140,100,.25)'; c.fill();
  const hero = safeSprite(heroKey, 'right', 0);
  if (hero) {
    c.imageSmoothingEnabled = false;
    c.drawImage(hero, Math.round(x), Math.round(y), Math.round(size), Math.round(size));
    c.save(); c.globalAlpha = 0.35; c.globalCompositeOperation = 'lighter';
    c.drawImage(tintSprite(hero, '#ff6a3a'), Math.round(x), Math.round(y), Math.round(size), Math.round(size));
    c.globalAlpha = 0.22; c.drawImage(tintSprite(hero, '#ffd8a0', -1), Math.round(x), Math.round(y), Math.round(size), Math.round(size));
    c.restore();
  }
  // House Valen's banner, planted in the rock beside them
  if (!opts.noFlag) {
  const fx = w * (opts.flagX || 0.53), fy = crest + 22 * sc;
  c.fillStyle = '#2a1e18'; c.fillRect(Math.round(fx), Math.round(fy - 130 * sc), Math.round(3 * sc), Math.round(130 * sc));
  c.fillStyle = '#f2c94c'; c.fillRect(Math.round(fx - sc), Math.round(fy - 134 * sc), Math.round(5 * sc), Math.round(5 * sc));
  c.beginPath();
  for (let i = 0; i <= 8; i++) { const u = i / 8; c.lineTo(fx + 3 * sc - u * 56 * sc, fy - 126 * sc + Math.sin(capeT * 1.3 + u * 5) * 5 * sc * u); }
  for (let i = 8; i >= 0; i--) { const u = i / 8; c.lineTo(fx + 3 * sc - u * 52 * sc, fy - 94 * sc + Math.sin(capeT * 1.3 + u * 5 + 0.5) * 6 * sc * u); }
  c.fillStyle = '#26346a'; c.fill();
  c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(fx - 20 * sc + Math.sin(capeT * 1.3 + 2) * 2 * sc, fy - 110 * sc, 6 * sc, 0, 7); c.fill();
  }
  // warm grade, then the vignette
  c.save(); c.globalCompositeOperation = 'lighter';
  const wg = c.createRadialGradient(w * 0.16, h * 0.47, 0, w * 0.16, h * 0.47, w * 0.6);
  wg.addColorStop(0, 'rgba(255,170,110,.22)'); wg.addColorStop(1, 'rgba(255,170,110,0)');
  c.fillStyle = wg; c.fillRect(0, 0, w, h);
  c.restore();
  const vg = c.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, h * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,4,16,.55)');
  c.fillStyle = vg; c.fillRect(0, 0, w, h);
}
function safeSprite(key, dir, frame) { try { return charSprite(key, dir, frame); } catch (e) { console.warn(key, e); return null; } }
function tintSprite(img, col, side = 1) {
  img._tint = img._tint || {};
  const tk = col + side;
  if (img._tint[tk]) return img._tint[tk];
  const [c, x] = mkCanvas(img.width, img.height);
  x.drawImage(img, 0, 0);
  // keep only the right-hand (lit) edge of the silhouette
  x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-out'; x.drawImage(img, -1, 0);
  return (img._tint[col] = c);
}

// ---------------------------------------------------------------- the logo
// Chunky letters with a gold-to-ember gradient, deep extrusion and a shine.
// stacked: "I GOT" small over a huge "ISEKAI'D", with the subtitle bar under.
function drawLogo(c, cx, y, scale, t, stacked) {
  c.save();
  c.textAlign = 'center'; c.textBaseline = 'top';
  const lines = stacked ? [['I GOT', 30], ['ISEKAI\'D', 64]] : [['I GOT ISEKAI\'D', 52]];
  let yy = y, widest = 0;
  // soft dark plate behind so it reads over the ash
  c.font = `bold ${Math.round(64 * scale)}px ${FONT}`;
  const wpl = c.measureText('ISEKAI\'D').width;
  const pg = c.createRadialGradient(cx, y + 60 * scale, 10, cx, y + 60 * scale, wpl * 0.9);
  pg.addColorStop(0, 'rgba(14,4,20,.6)'); pg.addColorStop(1, 'rgba(14,4,20,0)');
  c.fillStyle = pg; c.fillRect(cx - wpl, y - 40 * scale, wpl * 2, 220 * scale);
  for (const [s, size] of lines) {
    const px_ = Math.round(size * scale);
    c.font = `bold ${px_}px ${FONT}`;
    const w1 = c.measureText(s).width; widest = Math.max(widest, w1);
    for (let d = 7; d >= 1; d--) { c.fillStyle = d > 4 ? '#1a0822' : d > 2 ? '#4a0c24' : '#8a1a2a'; c.fillText(s, cx + d * scale * 0.6, yy + d * scale); }
    const g = c.createLinearGradient(0, yy, 0, yy + px_);
    g.addColorStop(0, '#fffbe6'); g.addColorStop(0.38, '#f6d060'); g.addColorStop(0.62, '#f0913a'); g.addColorStop(1, '#d8402e');
    c.fillStyle = g; c.fillText(s, cx, yy);
    c.lineWidth = Math.max(1, 1.2 * scale); c.strokeStyle = 'rgba(255,250,220,.35)'; c.strokeText(s, cx, yy);
    // sheen: a band of light that sweeps across the letters only
    const sw = ((t * 0.3) % 1.8) - 0.4;
    const sg = c.createLinearGradient(cx - w1 / 2 + w1 * sw - 50 * scale, yy, cx - w1 / 2 + w1 * sw + 50 * scale, yy + px_);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,.6)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg; c.fillText(s, cx, yy);
    yy += px_ + (stacked ? -2 * scale : 10 * scale);
  }
  const sub = 'THE VIDEO GAME';
  const s2 = Math.round(17 * scale);
  c.font = `bold ${s2}px ${FONT}`;
  const w2 = Math.max(c.measureText(sub).width + 28 * scale, stacked ? widest * 0.82 : 0);
  const by = yy + 10 * scale;
  c.fillStyle = 'rgba(20,8,30,.92)'; c.fillRect(cx - w2 / 2, by - 5 * scale, w2, s2 + 12 * scale);
  c.fillStyle = '#f2c94c'; c.fillRect(cx - w2 / 2, by - 5 * scale, w2, 2 * scale); c.fillRect(cx - w2 / 2, by + s2 + 5 * scale, w2, 2 * scale);
  c.fillStyle = '#e5534b'; c.fillRect(cx - w2 / 2 - 6 * scale, by + s2 / 2 - 2 * scale, 4 * scale, 4 * scale); c.fillRect(cx + w2 / 2 + 2 * scale, by + s2 / 2 - 2 * scale, 4 * scale, 4 * scale);
  c.fillStyle = '#f7ead2'; c.fillText(sub.split('').join(String.fromCharCode(8202)), cx, by);
  c.restore();
  return by + s2 + 14 * scale;
}

class TitleScene {
  constructor() {
    this.sel = 0; this.t = 0; this.t0 = TIME;
    this.opts = titleOpts();
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
    drawKeyVisual(ctx, W, H, { t0: this.t0 });
    FX.bloom(0.32);
    // letterbox bars: it is a poster, after all
    const bar = Math.max(0, 18 - this.t * 30);
    ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, 10 + bar); ctx.fillRect(0, H - 10 - bar, W, 10 + bar);
    const lx = W * 0.72;
    const a = clamp((this.t - 0.3) / 0.8, 0, 1);
    ctx.globalAlpha = a;
    const bottom = drawLogo(ctx, lx, 30, Math.min(1.1, W / 640), this.t, true);
    // the menu sits under the logo, over the ash
    const my = Math.max(bottom + 18, 230);
    const w = 200;
    drawWindow(lx - w / 2 - 10, my - 12, w + 20, this.opts.length * 34 + 16, 0.72);
    this.opts.forEach((o, i) => {
      const y = my + i * 34;
      const on = i === this.sel;
      if (on) {
        const pulse = 0.14 + Math.sin(TIME * 4) * 0.05;
        ctx.fillStyle = `rgba(242,201,76,${pulse})`; ctx.fillRect(lx - w / 2, y - 5, w, 30);
        ctx.fillStyle = UI.sakura; ctx.fillRect(lx - w / 2, y - 5, 3, 30);
      }
      text(o, lx, y, on ? UI.paper : 'rgba(240,232,220,.62)', 19, 'center');
      if (on) drawCursor(lx - w / 2 + 14, y + 3);
    });
    ctx.globalAlpha = 1;
    text('© Kundai  ·  ' + (Controls.mode === 'touch' ? 'Tap to choose' : 'Arrows / WASD  ·  Z or Enter'), W - 14, H - 26, 'rgba(255,255,255,.5)', 11, 'right', false);
  }
}
function titleOpts() { return [hasSave() ? 'Continue' : 'New Game', hasSave() ? 'New Game' : null, 'Cloud Save', 'Settings'].filter(Boolean); }


// ---------------------------------------------------------------- boot flow
function goTitle() {
  Scenes.stack.length = 0;
  Sound.stop(); Sound.play('title');
  Weather.set('clear', 0);
  Scenes.push(new TitleScene());
  fadeIn(0.6);
}
// Cloud Save from the title screen; afterwards the menu reflects whether a save now exists
async function titleCloud() {
  await cloudMenu(false);
  const t = Scenes.stack.find(s => s instanceof TitleScene);
  if (t) { t.opts = titleOpts(); t.sel = 0; }
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
    this.seq = Array.from({ length: n }, () => Runes.make());
    this.t = 0; this.per = 1.9; this.done = false; this.endT = 0;
    this.promise = new Promise(r => this.resolve = r);
    this.flash = null;
  }
  answer(ok) {
    this.seq[this.i].ok = ok;
    if (ok) { this.score++; this.streak++; this.best = Math.max(this.best, this.streak); Sound.sfx('magic'); this.flash = { col: UI.mp, t: 0.3 }; }
    else { this.streak = 0; Sound.sfx('buzz'); this.flash = { col: UI.bad, t: 0.3 }; }
    this.i++; this.t = 0;
    this.per = Math.max(1.05, this.per - 0.07);
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
    const got = Runes.pressed();
    if (got) { this.answer(got === Runes.want(want)); return; }
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
      Runes.draw(want, cx, cy + 2, 48, '#e8e2ff');
      text(Runes.hint(), cx, cy + 66, UI.sakura, 13, 'center', false);
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
    text(Runes.keys() ? 'Type each rune\'s letter before it fades' : 'Press each rune\'s arrow before it fades', W / 2, H - 40, UI.dim, 13, 'center', false);
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
  if (typeof Tap !== 'undefined') Tap.dispatch();
  const top = Scenes.top();
  if (top && top.update) top.update(dt);
  BattleClock.update(dt);
  if (typeof Controls !== 'undefined' && Controls.update) Controls.update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  Scenes.draw();
  drawFade();
  drawToasts(dt);
  if (Controls.mode === 'touch' && Controls.draw) Controls.draw();
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
