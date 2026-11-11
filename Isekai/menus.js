// =====================================================================
//  menus.js : an easier menu. Tap anything on screen to pick it, a
//  big-tile pause menu with the party at a glance, and a proper shop
//  with tabs, comparisons and quantities.
// =====================================================================

// ---------------------------------------------------------------- tapping the screen
const Tap = {
  pt: null,
  init() {
    canvas.addEventListener('pointerdown', e => {
      const r = canvas.getBoundingClientRect();
      this.pt = [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    });
  },
  // called by the main loop just before the top scene updates
  dispatch() {
    if (!this.pt) return;
    const [x, y] = this.pt; this.pt = null;
    const top = Scenes.top();
    if (top && top.onTap) top.onTap(x, y);
  },
  press(code) { Input.pressedSet.add(code); },
  in(x, y, rx, ry, rw, rh) { return x >= rx && x < rx + rw && y >= ry && y < ry + rh; }
};
Tap.init();

DialogScene.prototype.onTap = function (x, y) {
  const last = this.page === this.pages.length - 1;
  if (this.options && last && this.chars >= this.full) {
    const bx = 16, by = 344, bw = W - 32;
    const ow = Math.max(...this.options.map(o => textWidth(o, 16))) + 60, oh = this.options.length * 30 + 20;
    const ox = bx + bw - ow, oy = by - oh - 6;
    for (let i = 0; i < this.options.length; i++) if (Tap.in(x, y, ox, oy + 8 + i * 30, ow, 30)) { this.sel = i; Tap.press('KeyZ'); return; }
    return;
  }
  Tap.press('KeyZ');
};
ListScene.prototype.onTap = function (x, y) {
  const h = this.height;
  if (this.cancel && Tap.in(x, y, this.x + this.w - 44, this.y - 4, 48, 34)) { Tap.press('KeyX'); return; }
  const yy = this.y + 12 + (this.title ? 30 : 0);
  for (let i = this.scroll; i < Math.min(this.items.length, this.scroll + this.rows); i++) {
    if (Tap.in(x, y, this.x, yy + (i - this.scroll) * this.rowH - 4, this.w, this.rowH)) {
      if (i === this.index) Tap.press('KeyZ');
      else { this.index = i; Sound.sfx('cursor'); if (this.onMove) this.onMove(i); }
      return;
    }
  }
  if (this.items.length > this.rows) {
    if (Tap.in(x, y, this.x, this.y - 6, this.w, 18)) { this.scroll = Math.max(0, this.scroll - this.rows); this.index = this.scroll; Sound.sfx('cursor'); }
    else if (Tap.in(x, y, this.x, this.y + h - 20, this.w, 22)) { this.scroll = Math.min(this.items.length - this.rows, this.scroll + this.rows); this.index = this.scroll; Sound.sfx('cursor'); }
  }
};
{
  const d0 = ListScene.prototype.draw;
  ListScene.prototype.draw = function () {
    d0.call(this);
    if (Controls.mode === 'touch' && this.cancel) {
      const bx = this.x + this.w - 40, by = this.y + 4;
      ctx.fillStyle = 'rgba(229,83,75,.85)'; ctx.fillRect(bx, by, 32, 24); ctx.fillStyle = UI.ink; ctx.fillRect(bx, by + 22, 32, 2);
      text('✕', bx + 16, by + 3, UI.paper, 15, 'center');
    }
  };
}
// the timed choice and the rune/busk/fish scenes still want the D-pad; everything else taps

// ---------------------------------------------------------------- little icons
function menuIcon(kind, cx, cy, s = 1, on = false) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(cx + x * s), Math.round(cy + y * s), Math.ceil(w * s), Math.ceil(h * s)); };
  const ink = UI.ink, hi = on ? '#ffffff' : '#f7ead2';
  switch (kind) {
    case 'Items': R(-3, -12, 6, 3, '#e8e0d0'); R(-4, -9, 8, 2, '#8a5a30'); R(-9, -7, 18, 17, ink); R(-8, -6, 16, 15, '#e5534b'); R(-8, -6, 16, 5, '#ffffff'); R(-6, -4, 3, 2, '#ffd0d0'); break;
    case 'Skills': R(-2, -12, 4, 24, '#6fb7f2'); R(-12, -2, 24, 4, '#6fb7f2'); R(-6, -6, 12, 12, '#bfe6ff'); R(-2, -2, 4, 4, '#ffffff'); break;
    case 'Equip': R(-1, -13, 3, 18, '#d8d8e0'); R(0, -13, 1, 18, '#ffffff'); R(-6, 4, 13, 3, '#d8a840'); R(-1, 7, 3, 6, '#6a4020'); break;
    case 'Status': R(-6, -12, 12, 11, '#f2c49a'); R(-7, -13, 14, 4, '#3a2a1a'); R(-3, -8, 2, 2, ink); R(2, -8, 2, 2, ink); R(-9, 0, 18, 12, '#3a5aa8'); break;
    case 'Party': for (const [dx, c] of [[-9, '#7ed36f'], [9, '#f28fad'], [0, '#6fb7f2']]) { R(dx - 4, -10 + (dx ? 3 : 0), 8, 7, '#f2c49a'); R(dx - 6, -2 + (dx ? 3 : 0), 12, 11, c); } break;
    case 'Quests': R(-9, -12, 18, 24, '#e8dcc0'); R(-9, -12, 18, 3, '#b8a070'); for (let i = 0; i < 4; i++) R(-6, -6 + i * 4, 12 - (i % 2) * 4, 1, '#6a5a40'); R(4, 6, 5, 5, '#e5534b'); break;
    case 'Save': R(-10, -11, 20, 22, '#3a5aa8'); R(-6, -11, 12, 8, '#e8e8f0'); R(2, -10, 3, 6, '#3a5aa8'); R(-7, 2, 14, 8, '#1e2a5a'); break;
    case 'Cloud': ctx.fillStyle = '#e8ecf8'; ctx.beginPath(); ctx.arc(cx - 6 * s, cy + 2 * s, 7 * s, 0, 7); ctx.arc(cx + 3 * s, cy - 3 * s, 9 * s, 0, 7); ctx.arc(cx + 10 * s, cy + 3 * s, 6 * s, 0, 7); ctx.fill(); R(-12, 3, 26, 7, '#e8ecf8'); R(-2, 0, 4, 8, '#3a5aa8'); R(-5, 5, 10, 2, '#3a5aa8'); break;
    case 'Settings': ctx.fillStyle = '#b8b8c8'; ctx.beginPath(); ctx.arc(cx, cy, 10 * s, 0, 7); ctx.fill(); for (let a = 0; a < 8; a++) { const x = Math.cos(a * Math.PI / 4) * 11, y = Math.sin(a * Math.PI / 4) * 11; R(x - 3, y - 3, 6, 6, '#b8b8c8'); } ctx.fillStyle = UI.win; ctx.beginPath(); ctx.arc(cx, cy, 4 * s, 0, 7); ctx.fill(); break;
    case 'Title': R(-9, -12, 18, 24, '#6a4020'); R(-7, -10, 14, 20, '#8a5a30'); R(3, -1, 3, 3, '#f2c94c'); R(-12, 10, 24, 2, ink); break;
  }
  void hi;
}
function itemIcon(it, cx, cy) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x, cy + y, w, h); };
  if (!it) return;
  if (it.type === 'weapon') { R(-1, -8, 3, 12, '#d8d8e0'); R(0, -8, 1, 12, '#fff'); R(-4, 3, 9, 2, '#d8a840'); R(-1, 5, 3, 4, '#6a4020'); return; }
  if (it.type === 'armor') { R(-6, -7, 12, 12, UI.ink); R(-5, -6, 10, 10, it.look ? it.look.c : '#8a93a0'); R(-3, 4, 6, 3, it.look ? it.look.c : '#8a93a0'); R(-5, -6, 10, 2, 'rgba(255,255,255,.35)'); return; }
  if (it.type === 'use') { const c = it.revive ? '#f2c94c' : it.mpheal && !it.heal ? '#6fb7f2' : it.dmg ? '#f2a03a' : it.heal ? '#e5534b' : '#7ed36f'; R(-2, -8, 4, 2, '#e8e0d0'); R(-5, -6, 10, 11, UI.ink); R(-4, -5, 8, 9, c); R(-4, -5, 8, 3, '#ffffff'); return; }
  R(-5, -5, 10, 10, UI.ink); R(-4, -4, 8, 8, it.type === 'key' ? '#c88aff' : '#a89a80'); R(-4, -4, 8, 2, 'rgba(255,255,255,.35)');
}

// ---------------------------------------------------------------- the pause menu
const PAUSE_TILES = [
  ['Items', 'Potions, food, keepsakes.'], ['Skills', 'Cast healing magic outside battle.'], ['Equip', 'Change weapons and armour.'], ['Status', 'Stats, skills and morale.'], ['Party', 'Who travels with you. Send someone home.'],
  ['Quests', 'The main story, side stories and jobs.'], ['Save', 'Save to this device.'], ['Cloud', 'Save to the cloud, or load from it.'], ['Settings', 'Sound, graphics and controls.'], ['Title', 'Back to the title screen.']
];
class PauseScene {
  constructor(sel = 0) { this.transparent = true; this.sel = sel; this.t = 0; this.promise = new Promise(r => this.resolve = r); }
  tileRect(i) { const col = i % 5, row = Math.floor(i / 5), w = 116, h = 84; return [16 + col * (w + 6), 272 + row * (h + 6), w, h]; }
  update(dt) {
    this.t += dt;
    const c = this.sel % 5, r = Math.floor(this.sel / 5);
    if (Input.pressed('left')) { this.sel = r * 5 + (c + 4) % 5; Sound.sfx('cursor'); }
    if (Input.pressed('right')) { this.sel = r * 5 + (c + 1) % 5; Sound.sfx('cursor'); }
    if (Input.pressed('up') || Input.pressed('down')) { this.sel = (1 - r) * 5 + c; Sound.sfx('cursor'); }
    if (Input.pressed('ok')) { Sound.sfx('ok'); this.resolve(PAUSE_TILES[this.sel][0]); }
    else if (Input.pressed('cancel') || Input.pressed('menu')) { Sound.sfx('cancel'); this.resolve(null); }
  }
  onTap(x, y) {
    for (let i = 0; i < PAUSE_TILES.length; i++) { const [rx, ry, rw, rh] = this.tileRect(i); if (Tap.in(x, y, rx, ry, rw, rh)) { this.sel = i; Tap.press('KeyZ'); return; } }
    if (Tap.in(x, y, W - 60, 12, 48, 36)) Tap.press('KeyX');
    // tap a party card to see that member's status
    G.party.forEach((m, i) => { if (Tap.in(x, y, 16 + i * 154, 58, 146, 124)) { this.statusOf = i; this.resolve('Status'); } });
  }
  draw() {
    const top = Scenes.top() === this;
    ctx.fillStyle = 'rgba(8,6,20,.72)'; ctx.fillRect(0, 0, W, H);
    if (!top) {       // under a sub-menu: keep a slim party column so the sub-menu has room
      G.party.forEach((m, i) => drawMiniCard(m, 16, 16 + i * 74, 168, 66));
      drawWindow(16, H - 70, 168, 54); text(`${G.gold} ${cur()}`, 34, H - 56, UI.gold, 17); text(fmtTime(G.playTime), 120, H - 54, UI.dim, 13, 'left', false);
      return;
    }
    // header
    drawWindow(16, 10, W - 32, 42, 0.95);
    text(areaName(G.map), 32, 21, UI.paper, 17);
    text(`${G.gold} ${cur()}`, W - 150, 21, UI.gold, 17, 'right');
    text(fmtTime(G.playTime), W - 76, 22, UI.dim, 14, 'right', false);
    ctx.fillStyle = 'rgba(229,83,75,.85)'; ctx.fillRect(W - 60, 18, 36, 26); text('✕', W - 42, 21, UI.paper, 16, 'center');
    // the party
    G.party.forEach((m, i) => drawPartyCard(m, 16 + i * 154, 58, 146, 124));
    for (let i = G.party.length; i < PARTY_MAX; i++) { ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.setLineDash([4, 4]); ctx.strokeRect(20 + i * 154, 62, 138, 116); ctx.setLineDash([]); text('— empty —', 16 + i * 154 + 73, 112, 'rgba(255,255,255,.25)', 12, 'center', false); }
    // where you're headed
    const obj = wrap(storyObjective(), W - 70, 13);
    drawWindow(16, 188, W - 32, Math.min(2, obj.length) * 18 + 34, 0.9);
    text('NEXT', 30, 197, UI.sakura, 11);
    obj.slice(0, 2).forEach((l, i) => text(l, 30, 211 + i * 18, UI.paper, 13, 'left', false));
    // the tiles
    PAUSE_TILES.forEach(([label], i) => {
      const [x, y, w, h] = this.tileRect(i), on = i === this.sel;
      drawWindow(x, y, w, h, on ? 0.98 : 0.78);
      if (on) { ctx.fillStyle = 'rgba(242,201,76,.16)'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8); ctx.strokeStyle = UI.gold; ctx.lineWidth = 2; ctx.strokeRect(x + 5, y + 5, w - 10, h - 10); }
      menuIcon(label, x + w / 2, y + 32 - (on ? Math.abs(Math.sin(this.t * 5)) * 2 : 0), 1.2, on);
      const disabled = label === 'Save' && (G.map === 'tokyo' || G.map === 'konbini');
      text(label === 'Cloud' ? 'Cloud Save' : label === 'Title' ? 'Title Screen' : label, x + w / 2, y + 56, disabled ? '#6a6480' : on ? UI.gold : UI.paper, 14, 'center');
      if (label === 'Quests') { const n = G.quests.filter(q => q.have >= q.need).length; if (n) { ctx.fillStyle = UI.hp; ctx.beginPath(); ctx.arc(x + w - 16, y + 16, 9, 0, 7); ctx.fill(); text(String(n), x + w - 16, y + 9, UI.ink, 12, 'center'); } }
    });
    text(PAUSE_TILES[this.sel][1], W / 2, H - 18, UI.dim, 13, 'center', false);
  }
}
function drawPartyCard(m, x, y, w, h) {
  drawWindow(x, y, w, h, 0.9);
  const dead = m.hp <= 0;
  ctx.globalAlpha = dead ? 0.4 : 1;
  ctx.drawImage(charSprite(memberKey(m), 'down', 0), x + 6, y + 8, 56, 56);
  ctx.globalAlpha = 1;
  text(m.name, x + 64, y + 12, dead ? UI.bad : UI.paper, 14);
  text(`Lv ${m.lvl}`, x + 64, y + 32, UI.gold, 12);
  if (m.cls !== 'hero') { const mo = moraleOf(m.cls); text(moraleWord(mo), x + 64, y + 48, moraleColour(mo), 11, 'left', false); }
  else text(HERO_CLASSES[G.heroClass || 'blade'] ? HERO_CLASSES[G.heroClass || 'blade'].name : '', x + 64, y + 48, UI.sakura, 11, 'left', false);
  text('HP', x + 10, y + 72, UI.dim, 11); bar(x + 32, y + 76, w - 44, 7, m.hp, maxHP(m), m.hp < maxHP(m) * 0.25 ? UI.bad : UI.hp);
  text(`${m.hp}/${maxHP(m)}`, x + w - 12, y + 84, UI.paper, 11, 'right', false);
  text('MP', x + 10, y + 98, UI.dim, 11); bar(x + 32, y + 102, w - 44, 7, m.mp, maxMP(m), UI.mp);
}
function drawMiniCard(m, x, y, w, h) {
  drawWindow(x, y, w, h, 0.9);
  ctx.drawImage(charSprite(memberKey(m), 'down', 0), x + 4, y + 6, 48, 48);
  text(m.name, x + 54, y + 10, m.hp <= 0 ? UI.bad : UI.paper, 13);
  text(`Lv ${m.lvl}`, x + w - 10, y + 11, UI.gold, 11, 'right');
  bar(x + 54, y + 34, w - 66, 6, m.hp, maxHP(m), UI.hp); bar(x + 54, y + 46, w - 66, 5, m.mp, maxMP(m), UI.mp);
}
pauseMenu = async function () {
  let sel = 0;
  while (true) {
    const ps = new PauseScene(sel);
    Scenes.push(ps);
    const L = await ps.promise;
    sel = ps.sel;
    if (!L) { Scenes.remove(ps); return; }
    let out;
    if (L === 'Items') await itemsMenu();
    else if (L === 'Skills') await skillsMenu();
    else if (L === 'Equip') await equipMenu();
    else if (L === 'Status') { let i = ps.statusOf; if (i === undefined) { const m = await pickMember('Status of…', null); i = m ? G.party.indexOf(m) : -1; } if (i >= 0) { const s = new StatusScene(i); Scenes.push(s); await s.promise; } }
    else if (L === 'Quests') await questsMenu();
    else if (L === 'Party') await partyMenu();
    else if (L === 'Save') { if (G.map === 'tokyo' || G.map === 'konbini') toast('Saving begins in the other world.', UI.dim); else saveGame() ? (Sound.sfx('save'), toast('Game saved.', UI.hp)) : toast('Could not save.', UI.bad); }
    else if (L === 'Cloud') { if (await cloudMenu(true) === 'reloaded') out = 'reloaded'; }
    else if (L === 'Settings') await settingsMenu();
    else if (L === 'Title') { if (await confirm(null, 'Return to the title screen? Anything since your last save will be lost.')) { Scenes.remove(ps); goTitle(); return 'title'; } }
    Scenes.remove(ps);
    if (out) return out;
  }
};

// ---------------------------------------------------------------- the shop
const SHOP_KEEPER_LINES = ['Welcome. Take a look around.', 'What do you need?', 'Stock\'s thin, but it\'s honest.'];
function gearDelta(m, it) {
  if (!canEquip(m, it)) return null;
  const slot = it.type === 'weapon' ? 'weapon' : 'armor', curI = ITEMS[m.equip[slot]] || {};
  if (m.equip[slot] && ITEMS[m.equip[slot]] === it) return 'equipped';
  const parts = [];
  for (const k of ['atk', 'def', 'mag']) { const d = (it[k] || 0) - (curI[k] || 0); if (d) parts.push([k.toUpperCase(), d]); }
  return parts;
}
class ShopScene {
  constructor(shopId, keeper, spr) {
    this.shopId = shopId; this.keeper = keeper; this.spr = spr;
    this.tab = 0; this.idx = [0, 0]; this.scroll = [0, 0]; this.qty = null; this.t = 0; this.flash = 0;
    this.rows = 10; this.greet = pick(SHOP_KEEPER_LINES);
    this.promise = new Promise(r => this.resolve = r);
  }
  list() {
    if (this.tab === 0) return SHOPS[this.shopId].map(id => ({ id, it: ITEMS[id], price: Math.ceil(ITEMS[id].price * priceMult()) }));
    const order = { use: 0, weapon: 1, armor: 2, misc: 3 };
    return Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].type !== 'key').sort((a, b) => (order[ITEMS[a].type] - order[ITEMS[b].type]) || ITEMS[a].name.localeCompare(ITEMS[b].name)).map(id => ({ id, it: ITEMS[id], price: Math.floor(ITEMS[id].price / 2) }));
  }
  cur() { const l = this.list(); return l[Math.min(this.idx[this.tab], l.length - 1)]; }
  maxQty(e) {
    if (this.tab === 1) return G.inv[e.id] || 0;
    if (e.it.type === 'key') return itemCount(e.id) ? 0 : 1;
    return Math.min(99, Math.floor(G.gold / Math.max(1, e.price)));
  }
  update(dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (this.qty) {
      const q = this.qty, mx = this.maxQty(q.e);
      if (Input.pressed('left')) { q.n = Math.max(1, q.n - 1); Sound.sfx('cursor'); }
      if (Input.pressed('right')) { q.n = Math.min(mx, q.n + 1); Sound.sfx('cursor'); }
      if (Input.pressed('up')) { q.n = Math.min(mx, q.n + 10); Sound.sfx('cursor'); }
      if (Input.pressed('down')) { q.n = Math.max(1, q.n - 10); Sound.sfx('cursor'); }
      if (Input.pressed('ok')) this.commit();
      else if (Input.pressed('cancel')) { this.qty = null; Sound.sfx('cancel'); }
      return;
    }
    const l = this.list(), n = l.length, t = this.tab;
    if (Input.pressed('left') || Input.pressed('right')) { this.tab ^= 1; Sound.sfx('cursor'); return; }
    if (n && Input.pressed('up')) { this.idx[t] = (this.idx[t] + n - 1) % n; Sound.sfx('cursor'); }
    if (n && Input.pressed('down')) { this.idx[t] = (this.idx[t] + 1) % n; Sound.sfx('cursor'); }
    this.idx[t] = Math.min(this.idx[t], Math.max(0, n - 1));
    if (this.idx[t] < this.scroll[t]) this.scroll[t] = this.idx[t];
    if (this.idx[t] >= this.scroll[t] + this.rows) this.scroll[t] = this.idx[t] - this.rows + 1;
    if (Input.pressed('ok') && n) this.choose();
    else if (Input.pressed('cancel') || Input.pressed('menu')) { Sound.sfx('cancel'); this.resolve(); }
  }
  choose() {
    const e = this.cur(), mx = this.maxQty(e);
    if (mx < 1) { Sound.sfx('buzz'); this.flash = 0.6; return; }
    Sound.sfx('ok');
    if (mx === 1 || (this.tab === 0 && e.it.type !== 'use')) { this.qty = { e, n: 1 }; this.commit(); return; }
    this.qty = { e, n: 1 };
  }
  commit() {
    const { e, n } = this.qty; this.qty = null;
    if (this.tab === 0) {
      if (G.gold < e.price * n) { Sound.sfx('buzz'); return; }
      G.gold -= e.price * n; addItem(e.id, n); Sound.sfx('coin');
      toast(`Bought ${n > 1 ? n + '× ' : ''}${e.it.name}.`);
      if (e.it.type === 'weapon' || e.it.type === 'armor') this.offerEquip = e.id;
    } else {
      G.gold += e.price * n; removeItem(e.id, n); Sound.sfx('coin');
      toast(`Sold ${n > 1 ? n + '× ' : ''}${e.it.name} for ${e.price * n} G.`);
    }
  }
  rowY(i) { return 118 + (i - this.scroll[this.tab]) * 30; }
  onTap(x, y) {
    if (this.qty) {
      if (Tap.in(x, y, W / 2 - 120, 236, 60, 40)) Tap.press('ArrowLeft');
      else if (Tap.in(x, y, W / 2 + 60, 236, 60, 40)) Tap.press('ArrowRight');
      else if (Tap.in(x, y, W / 2 - 150, 290, 140, 36)) Tap.press('KeyZ');
      else if (Tap.in(x, y, W / 2 + 10, 290, 140, 36)) Tap.press('KeyX');
      return;
    }
    if (Tap.in(x, y, W - 60, 14, 46, 36)) { Tap.press('KeyX'); return; }
    if (Tap.in(x, y, 16, 72, 150, 34)) { if (this.tab !== 0) { this.tab = 0; Sound.sfx('cursor'); } return; }
    if (Tap.in(x, y, 170, 72, 150, 34)) { if (this.tab !== 1) { this.tab = 1; Sound.sfx('cursor'); } return; }
    const l = this.list();
    for (let i = this.scroll[this.tab]; i < Math.min(l.length, this.scroll[this.tab] + this.rows); i++) {
      if (Tap.in(x, y, 16, this.rowY(i) - 4, 300, 30)) { if (this.idx[this.tab] === i) Tap.press('KeyZ'); else { this.idx[this.tab] = i; Sound.sfx('cursor'); } return; }
    }
  }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a1e30'); g.addColorStop(1, '#120c18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,190,110,.05)'; ctx.fillRect(i * 110, 0, 50, H); }
    // keeper and purse
    drawWindow(16, 10, W - 32, 56, 0.95);
    ctx.fillStyle = '#2a3263'; ctx.fillRect(26, 16, 44, 44);
    ctx.drawImage(charSprite(this.spr || 'shop', 'down', 0), 4, 0, 24, 21, 28, 18, 40, 38);
    text(this.keeper, 80, 18, UI.gold, 17);
    text(this.tab === 0 ? this.greet : 'Let\'s see what you\'ve got.', 80, 40, UI.dim, 13, 'left', false);
    text(`${G.gold} ${cur()}`, W - 76, 26, this.flash > 0 ? UI.bad : UI.gold, 20, 'right');
    ctx.fillStyle = 'rgba(229,83,75,.85)'; ctx.fillRect(W - 60, 22, 36, 28); text('✕', W - 42, 26, UI.paper, 16, 'center');
    // tabs
    ['Buy', 'Sell'].forEach((tb, i) => {
      const x = 16 + i * 154, on = this.tab === i;
      drawWindow(x, 72, 150, 34, on ? 0.98 : 0.6);
      if (on) { ctx.fillStyle = UI.sakura; ctx.fillRect(x + 6, 100, 138, 3); }
      text(tb, x + 75, 80, on ? UI.paper : UI.dim, 16, 'center');
    });
    text('◀ ▶', 330, 82, UI.dim, 13, 'left', false);
    // the list
    const l = this.list(), t = this.tab;
    drawWindow(16, 108, 300, this.rows * 30 + 18, 0.92);
    if (!l.length) text(t === 0 ? 'Nothing for sale.' : 'Nothing to sell.', 40, 124, UI.dim, 15);
    for (let i = this.scroll[t]; i < Math.min(l.length, this.scroll[t] + this.rows); i++) {
      const e = l[i], y = this.rowY(i), on = i === this.idx[t], afford = t === 1 || this.maxQty(e) > 0;
      if (on) { ctx.fillStyle = 'rgba(242,201,76,.14)'; ctx.fillRect(22, y - 4, 288, 28); ctx.fillStyle = UI.sakura; ctx.fillRect(22, y - 4, 3, 28); }
      itemIcon(e.it, 40, y + 10);
      text(e.it.name, 56, y + 1, !afford ? '#6a6480' : on ? UI.paper : '#d8cfb8', 15);
      const own = itemCount(e.id);
      if (own && t === 0) text(`×${own}`, 218, y + 3, UI.dim, 12, 'right', false);
      if (t === 1) text(`×${own}`, 226, y + 3, UI.dim, 12, 'right', false);
      text(`${e.price}`, 298, y + 2, !afford ? '#6a6480' : UI.gold, 14, 'right');
    }
    if (l.length > this.rows) {
      if (this.scroll[t] > 0) text('▲', 166, 106, UI.sakura, 12, 'center');
      if (this.scroll[t] + this.rows < l.length) text('▼', 166, 108 + this.rows * 30 + 4, UI.sakura, 12, 'center');
    }
    // the detail panel
    const e = this.cur();
    drawWindow(324, 72, W - 340, 346, 0.92);
    if (e) {
      const it = e.it;
      text(it.name, 342, 86, UI.paper, 18);
      const kind = it.type === 'weapon' ? `Weapon · ${it.kind}` : it.type === 'armor' ? `Armour · ${it.kind}` : it.type === 'use' ? (it.battleOnly ? 'Battle item' : 'Consumable') : it.type === 'key' ? 'Key item' : 'Curio';
      text(kind, 342, 110, UI.sakura, 12, 'left', false);
      const sl = statLine(it); if (sl) text(sl, W - 30, 110, UI.gold, 13, 'right');
      wrap(it.desc, W - 380, 13).slice(0, 5).forEach((ln, i) => text(ln, 342, 132 + i * 18, '#d8cfb8', 13, 'left', false));
      text(`You own: ${itemCount(e.id)}`, 342, 232, UI.dim, 12, 'left', false);
      if (it.type === 'weapon' || it.type === 'armor') {
        text('Party', 342, 256, UI.gold, 13);
        G.party.forEach((m, i) => {
          const y = 276 + i * 34, d = gearDelta(m, it);
          ctx.drawImage(charSprite(memberKey(m), 'down', 0), 340, y - 6, 32, 32);
          text(m.name, 376, y + 2, UI.paper, 13, 'left', false);
          if (d === null) text("can't use", W - 30, y + 2, '#6a6480', 12, 'right', false);
          else if (d === 'equipped') text('equipped', W - 30, y + 2, UI.dim, 12, 'right', false);
          else if (!d.length) text('= same', W - 30, y + 2, UI.dim, 12, 'right', false);
          else { let xx = W - 30; for (const [k, v] of d.slice().reverse()) { const s = `${k} ${v > 0 ? '▲' : '▼'}${Math.abs(v)}`; text(s, xx, y + 2, v > 0 ? UI.hp : UI.bad, 12, 'right'); xx -= textWidth(s, 12) + 10; } }
        });
      } else if (it.type === 'use') {
        const fx = it.revive ? `Revives an ally at ${Math.round(it.revive * 100)}% HP.` : it.dmg ? `${it.dmg} ${it.elem || ''} damage to all enemies.` : [it.heal && `+${it.heal >= 9999 ? 'all' : it.heal} HP`, it.mpheal && `+${it.mpheal >= 9999 ? 'all' : it.mpheal} MP`].filter(Boolean).join('  ') + (it.target === 'allies' ? ' to everyone' : '');
        text(fx, 342, 256, UI.hp, 14, 'left', false);
      }
    }
    text(this.tab === 0 ? `${Controls.label('ok')}: buy   ${Controls.label('cancel')}: leave   ◀ ▶: sell` : `${Controls.label('ok')}: sell   ${Controls.label('cancel')}: leave   ◀ ▶: buy`, W / 2, H - 38, UI.dim, 13, 'center', false);
    // quantity
    if (this.qty) {
      const q = this.qty, tot = q.e.price * q.n;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H);
      drawWindow(W / 2 - 170, 170, 340, 170);
      text(`${this.tab === 0 ? 'Buy' : 'Sell'} ${q.e.it.name}`, W / 2, 186, UI.paper, 17, 'center');
      drawWindow(W / 2 - 120, 236, 60, 40, 0.8); text('◀', W / 2 - 90, 246, UI.sakura, 18, 'center');
      drawWindow(W / 2 + 60, 236, 60, 40, 0.8); text('▶', W / 2 + 90, 246, UI.sakura, 18, 'center');
      text(`× ${q.n}`, W / 2, 244, UI.gold, 22, 'center');
      text(`${this.tab === 0 ? 'Cost' : 'You get'}: ${tot} G   ·   After: ${this.tab === 0 ? G.gold - tot : G.gold + tot} G`, W / 2, 212, UI.dim, 13, 'center', false);
      drawWindow(W / 2 - 150, 290, 140, 36, 0.9); text('OK', W / 2 - 80, 298, UI.hp, 15, 'center');
      drawWindow(W / 2 + 10, 290, 140, 36, 0.9); text('Cancel', W / 2 + 80, 298, UI.dim, 15, 'center');
    }
  }
}
shopScene = async function (shopId, keeper, spr) {
  if (shopId !== 'konbini') await say(keeper, pick(SHOP_KEEPER_LINES), spr);
  const s = new ShopScene(shopId, keeper, spr);
  Scenes.push(s);
  // run the scene; when it asks to offer equipping a new purchase, do that in between
  while (true) {
    await new Promise(r => { const chk = () => { if (s.offerEquip || s.done) r(); else if (!Scenes.stack.includes(s)) r(); else setTimeout(chk, 50); }; s.promise.then(() => { s.done = true; r(); }); chk(); });
    if (s.done) break;
    const id = s.offerEquip; s.offerEquip = null;
    const it = ITEMS[id], slot = it.type === 'weapon' ? 'weapon' : 'armor';
    const who = G.party.filter(m => { const d = gearDelta(m, it); return d && d !== 'equipped'; });
    if (!who.length || !itemCount(id)) continue;
    const i = await list({ x: 196, y: 120, w: W - 224, rows: 4, title: `Equip the ${it.name} now?`, showDesc: false,
      items: who.map(m => { const d = gearDelta(m, it); return { label: m.name, right: d.length ? d.map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(' ') : '=' }; }).concat([{ label: 'Not now' }]) });
    if (i < 0 || i >= who.length) continue;
    const m = who[i];
    removeItem(id); if (m.equip[slot]) addItem(m.equip[slot]); m.equip[slot] = id;
    clearHeroSprites();
    m.hp = Math.min(m.hp, maxHP(m));
    Sound.sfx('buff'); toast(`${m.name} equipped the ${it.name}.`, UI.hp);
  }
  Scenes.remove(s);
  await say(keeper, shopId === 'konbini' ? 'Thank you, come again!' : pick(['Stay safe out there.', 'Come back alive.', 'Good luck.']), spr);
};
