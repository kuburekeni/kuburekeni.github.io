// =====================================================================
//  mountains.js : mountains that look like mountains, and fog
//   - mountain ground is one continuous mass of rock: cracked stone,
//     scree, cliff faces on the south side, lit ridges on the north
//   - big peaks rise out of it (drawn tall and y-sorted, so they stand
//     over the land behind them), with snow caps in the high north
//   - fog: low drifting mist banks over the mountains, the fen and the
//     lake, a haze toward the top of the screen, and morning mist in
//     the valleys. Lighter on Low quality.
// =====================================================================
const MTN = { C: {} };

// ---------------------------------------------------------------- the rock mass
function mtnTile(mask, v, snow, tx, ty) {
  const key = 'mt' + mask + v + (snow ? 's' : '') + ((tx * 7 + ty * 3) % 3);
  if (MTN.C[key]) return MTN.C[key];
  const [c, x] = mkCanvas(32, 32), r = rng(v * 991 + mask * 37 + (snow ? 5 : 0) + ((tx * 7 + ty * 3) % 3) * 113);
  const R = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  const base = snow ? '#8a90a2' : '#625c68', dk = shade(base, -0.28), lt = shade(base, 0.2);
  R(0, 0, 32, 32, base);
  ditherBlob(x, r, shade(base, -0.1), 4, 4, 11); ditherBlob(x, r, shade(base, 0.08), 3, 3, 9);
  // cracks and strata
  for (let i = 0; i < 4; i++) { let px_ = Math.floor(r() * 32), py_ = Math.floor(r() * 32); x.strokeStyle = dk; x.beginPath(); x.moveTo(px_, py_); for (let k = 0; k < 3; k++) { px_ += Math.floor(r() * 9) - 4; py_ += Math.floor(r() * 7) + 2; x.lineTo(px_, py_); } x.stroke(); }
  for (let i = 0; i < 3; i++) { const yy = Math.floor(r() * 30); R(Math.floor(r() * 10), yy, 10 + Math.floor(r() * 14), 1, shade(base, 0.12)); }
  // boulders
  for (let i = 0; i < 2; i++) { const bx = Math.floor(r() * 24) + 4, by = Math.floor(r() * 22) + 6, rr = 2 + Math.floor(r() * 3); x.fillStyle = dk; x.beginPath(); x.ellipse(bx + 1, by + 1, rr + 1, rr, 0, 0, 7); x.fill(); x.fillStyle = lt; x.beginPath(); x.ellipse(bx, by, rr, rr - 1, 0, 0, 7); x.fill(); R(bx - 1, by - rr + 1, 2, 1, shade(lt, 0.2)); }
  if (snow) { for (let i = 0; i < 3; i++) { const a = Math.floor(r() * 24), b = 4 + Math.floor(r() * 24); x.fillStyle = 'rgba(70,80,110,.35)'; x.beginPath(); x.ellipse(a + 5, b + 1, 6 + r() * 4, 2.2, 0, 0, 7); x.fill(); x.fillStyle = '#dfe6f0'; x.beginPath(); x.ellipse(a + 4, b, 6 + r() * 4, 2, 0, 0, 7); x.fill(); } }
  // edges: a lit ridge on top, a cliff face on the bottom, shadowed flanks
  if (mask & 1) { R(0, 0, 32, 3, snow ? '#eef3fa' : lt); R(0, 3, 32, 1, shade(lt, 0.15)); for (let i = 0; i < 32; i += 3) R(i, 0, 2, 1 + (i * 7) % 3, snow ? '#ffffff' : shade(lt, 0.25)); }
  if (mask & 4) {
    const g = x.createLinearGradient(0, 14, 0, 32); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,14,30,.55)'); x.fillStyle = g; x.fillRect(0, 14, 32, 18);
    for (let i = 1; i < 32; i += 4) R(i + Math.floor(r() * 2), 16, 1, 14, 'rgba(20,14,30,.35)');
    for (let i = 0; i < 6; i++) R(Math.floor(r() * 30), 28 + Math.floor(r() * 3), 3, 2, '#8a8478');
  }
  if (mask & 8) { const g = x.createLinearGradient(0, 0, 6, 0); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 6, 32); }
  if (mask & 2) { const g = x.createLinearGradient(26, 0, 32, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,14,30,.3)'); x.fillStyle = g; x.fillRect(26, 0, 6, 32); }
  return (MTN.C[key] = c);
}

// ---------------------------------------------------------------- the peaks
function peakSprite(n, snow) {
  const key = 'pk' + n + (snow ? 's' : '');
  if (MTN.C[key]) return MTN.C[key];
  const CW = 112, CH = 120, r = rng(n * 7717 + (snow ? 31 : 0));
  const [c, x] = mkCanvas(CW, CH);
  const w = 70 + Math.floor(r() * 36), h = 62 + Math.floor(r() * 44), base = CH - 6, cx = CW / 2 + Math.floor(r() * 10) - 5;
  // the outline: a jagged ridge from the left foot, up to the summit, down to the right foot
  const pts = [[cx - w / 2, base]];
  const steps = 7;
  for (let i = 1; i < steps; i++) { const t = i / steps, xx = cx - w / 2 + t * w * 0.5, yy = base - h * t * (0.85 + r() * 0.3); pts.push([xx, Math.min(base - 4, yy)]); }
  const top = [cx + (r() - 0.5) * 8, base - h];
  pts.push(top);
  for (let i = steps - 1; i > 0; i--) { const t = i / steps, xx = cx + w / 2 - t * w * 0.5, yy = base - h * t * (0.8 + r() * 0.3); pts.push([xx, Math.min(base - 4, yy)]); }
  pts.push([cx + w / 2, base]);
  const poly = (ps, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(ps[0][0], ps[0][1]); for (const p of ps) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); };
  const rock = snow ? ['#5a6072', '#7a8296', '#9aa2b6', '#3e4454'] : ['#4e4856', '#6c6676', '#8a8494', '#36303e'];
  // outline, then the shadowed right face, then the lit left face
  x.save(); x.translate(0, 1); poly(pts.map(([a, b]) => [a + (a < cx ? -1.5 : 1.5), b - 1]), UI.ink); x.restore();
  poly(pts, rock[0]);
  const ti = steps;
  poly([...pts.slice(0, ti + 1), [top[0] + 4, base]], rock[1]);
  poly([...pts.slice(0, Math.ceil(ti / 2) + 1), [cx - w * 0.15, base]], rock[2]);
  // ridges running down from the summit
  x.strokeStyle = rock[3]; x.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) { x.beginPath(); let a = top[0] + (r() - 0.5) * 6, b = top[1] + 4; x.moveTo(a, b); for (let k = 0; k < 6; k++) { a += (r() - 0.35) * 8; b += h / 8; x.lineTo(a, Math.min(base, b)); } x.stroke(); }
  // strata and specks of light
  for (let i = 0; i < 26; i++) { const a = cx - w / 2 + r() * w, b = base - r() * h * 0.9; x.fillStyle = r() < 0.5 ? rock[2] : rock[3]; x.fillRect(Math.round(a), Math.round(b), 2 + Math.floor(r() * 3), 1); }
  x.lineWidth = 1;
  // keep everything inside the outline
  x.globalCompositeOperation = 'destination-in'; poly(pts.map(([a, b]) => [a + (a < cx ? -1.5 : 1.5), b - 1]), '#000'); x.globalCompositeOperation = 'source-over';
  // snow cap
  if (snow || n % 3 === 0) {
    const capH = h * (snow ? 0.42 : 0.24);
    const cap = pts.filter(([, b]) => b < base - h + capH);
    if (cap.length > 1) {
      const lo = cap[0], hi = cap[cap.length - 1], zig = [];
      for (let i = 0; i <= 8; i++) zig.push([hi[0] - (hi[0] - lo[0]) * i / 8, base - h + capH + (i % 2 ? 4 : -2) + r() * 3]);
      poly([...cap, ...zig], '#eef3fa');
      poly([cap[0], ...cap.slice(0, Math.ceil(cap.length / 2)), [top[0], base - h + capH * 0.7]], '#ffffff');
      x.fillStyle = 'rgba(140,160,210,.35)'; x.beginPath(); x.moveTo(top[0], top[1]); for (const p of cap.slice(Math.floor(cap.length / 2))) x.lineTo(p[0], p[1]); x.lineTo(top[0] + 3, base - h + capH); x.closePath(); x.fill();
    }
  }
  // the foot, blending into the rock mass below
  const g = x.createLinearGradient(0, base - 18, 0, base); g.addColorStop(0, 'rgba(98,92,104,0)'); g.addColorStop(1, snow ? 'rgba(138,144,162,1)' : 'rgba(98,92,104,1)');
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = g; x.fillRect(0, base - 18, CW, 24); x.globalCompositeOperation = 'source-over';
  return (MTN.C[key] = c);
}
function mtnSnowAt(w, tx, ty) {
  if (w.map === MAPS.overworld) { const k = owRegion(tx, ty); return k === 'frost' || (k === 'iron' && ty < 22) || ty < 6; }
  return w.map.theme === 'snow';
}

// ---------------------------------------------------------------- hook into the renderer
{
  const ti0 = Detail.tileImg.bind(Detail);
  Detail.tileImg = function (w, ch, tx, ty, theme, v) {
    if (ch === 'Ä') return mtnTile(w.tileMask(tx, ty, ch), v, mtnSnowAt(w, tx, ty), tx, ty);
    return ti0(w, ch, tx, ty, theme, v);
  };
  const en0 = Detail.ents.bind(Detail);
  Detail.ents = function (w, ents, camX, camY, x0, y0) {
    en0(w, ents, camX, camY, x0, y0);
    const x1 = x0 + Math.ceil(W / TS) + 3, y1 = y0 + Math.ceil(H / TS) + 4;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0 - 3; tx <= x1; tx++) {
      if (w.tile(tx, ty) !== 'Ä') continue;
      const h = hash2(tx * 5 + 3, ty * 11 + 7);
      // peaks on a loose grid inside the mass, never right at the bottom edge
      if ((tx + (ty % 2) * 2) % 3 !== 0 || ty % 2 !== 0 || h % 4 === 0) continue;
      if (w.tile(tx, ty + 1) !== 'Ä' && h % 3) continue;
      const snow = mtnSnowAt(w, tx, ty), img = peakSprite(h % 9, snow);
      const sx = tx * TS - camX + 16 - img.width / 2, sy = ty * TS - camY + 32 - img.height + 6;
      ents.push({ y: ty * TS - camY - 1, draw: () => { const a = typeof Occlude !== 'undefined' ? Occlude.alpha('pk' + tx + ',' + ty, sx + img.width * 0.2, sy, img.width * 0.6, img.height, ty * TS - camY + 32, 0.5) : 1; ctx.globalAlpha = a; ctx.drawImage(img, Math.round(sx), Math.round(sy)); ctx.globalAlpha = 1; } });
    }
  };
}
// the old per-tile triangle peaks are gone; keep the rock edges for maps drawn without Detail
{
  const sg0 = sameGroup;
  sameGroup = function (a, b) { if (a === 'Ä') return b === 'Ä' || b === '¦' || b === '»'; return sg0(a, b); };
}

// ---------------------------------------------------------------- fog
const Fog = {
  puff: null,
  makePuff() {
    const [c, x] = mkCanvas(256, 128);
    for (let i = 0; i < 9; i++) {
      const cx = 40 + Math.random() * 176, cy = 44 + Math.random() * 40, rr = 30 + Math.random() * 34;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    }
    return c;
  },
  // how foggy is it here: mountains and the fen and the lake always; mornings in the valleys
  density(w) {
    if (!w.map || w.map.interior) return 0;
    const m = w.map;
    if (m === MAPS.overworld) {
      const p = w.player, k = owRegion(p.x, p.y);
      let d = { frost: 0.6, iron: 0.5, fen: 0.6, mirrow: 0.45, moor: 0.4, silvane: 0.35, rift: 0.45, whisper: 0.3, fern: 0.3 }[k] || 0.15;
      // closer to rock, thicker
      let rock = 0; for (let dy = -4; dy <= 4; dy += 2) for (let dx = -6; dx <= 6; dx += 2) if (w.tile(p.x + dx, p.y + dy) === 'Ä') rock++;
      return Math.min(1, d + rock * 0.025);
    }
    if (m.theme === 'forestv') return 0.35;
    if (/mirewatch|shrine/.test(G.map)) return 0.7;
    if (/cairnstead|barrow|silvane/.test(G.map)) return 0.4;
    if (m.theme === 'cave' && !m.dark) return 0.3;
    return 0;
  },
  draw(w, camX, camY) {
    if (Weather.kind === 'fog') {} // the weather fog draws its own sheet; the banks still drift over it
    let d = this.density(w);
    if (d <= 0.02) { this.d = (this.d || 0) * 0.95; if (this.d < 0.02) return; d = this.d; } else this.d = (this.d || 0) + (d - (this.d || 0)) * 0.05;
    d = this.d;
    const tier = typeof Perf !== 'undefined' ? Perf.tierNow() : 2;
    if (!this.puff) this.puff = this.makePuff();
    const n = tier === 0 ? 4 : tier === 1 ? 7 : 11;
    const t = TIME;
    ctx.save();
    // drifting banks with a little parallax, so they slide over the land as you walk
    for (let i = 0; i < n; i++) {
      const sp = 6 + (i % 4) * 3, par = 0.55 + (i % 3) * 0.15;
      const bw = 360 + (i % 3) * 120, bh = 150 + (i % 2) * 60;
      const ox = ((i * 211 + t * sp - camX * par) % (W + bw) + (W + bw)) % (W + bw) - bw;
      const oy = ((i * 137 - camY * par * 0.8) % (H + bh) + (H + bh)) % (H + bh) - bh * 0.6;
      ctx.globalAlpha = d * (0.13 + (i % 3) * 0.05);
      ctx.drawImage(this.puff, ox, oy, bw, bh);
    }
    // haze toward the top of the view: distance, and height
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, `rgba(225,230,240,${0.16 * d})`); g.addColorStop(1, 'rgba(225,230,240,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.55);
    // a low ground mist band at the bottom
    const g2 = ctx.createLinearGradient(0, H * 0.7, 0, H);
    g2.addColorStop(0, 'rgba(235,240,245,0)'); g2.addColorStop(1, `rgba(235,240,245,${0.09 * d})`);
    ctx.fillStyle = g2; ctx.fillRect(0, H * 0.7, W, H * 0.3);
    ctx.restore();
  }
};
{
  const air0 = Detail.air.bind(Detail);
  Detail.air = function (w, camX, camY) { air0(w, camX, camY); if (Gfx.weather !== false) Fog.draw(w, camX, camY); };
}
