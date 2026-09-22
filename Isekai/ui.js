// =====================================================================
//  ui.js : dialogue, menus, pause screen, shops, quest board
// =====================================================================

// ------------------------------------------------------------------ dialogue
class DialogScene {
  constructor(name, str, spr, options) {
    this.transparent = true;
    this.name = name; this.spr = spr; this.options = options || null;
    const tw = spr ? 470 : 570;
    const lines = wrap(str, tw, 17);
    this.pages = [];
    for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    this.page = 0; this.chars = 0; this.sel = 0; this.textX = spr ? 150 : 48;
    this.promise = new Promise(r => this.resolve = r);
  }
  get full() { return this.pages[this.page].join('\n').length; }
  update(dt) {
    const prev = Math.floor(this.chars);
    this.chars = Math.min(this.full, this.chars + dt * 55);
    if (Math.floor(this.chars) !== prev && Math.floor(this.chars) % 3 === 0 && this.chars < this.full) Sound.sfx('talk');
    const last = this.page === this.pages.length - 1;
    if (this.chars >= this.full && last && this.options) {
      if (Input.pressed('up')) { this.sel = (this.sel + this.options.length - 1) % this.options.length; Sound.sfx('cursor'); }
      if (Input.pressed('down')) { this.sel = (this.sel + 1) % this.options.length; Sound.sfx('cursor'); }
      if (Input.pressed('ok')) { Sound.sfx('ok'); Scenes.remove(this); this.resolve(this.sel); }
      if (Input.pressed('cancel') && this.options.cancel !== false) { Sound.sfx('cancel'); Scenes.remove(this); this.resolve(this.options.length - 1); }
      return;
    }
    if (Input.pressed('ok') || Input.pressed('cancel')) {
      if (this.chars < this.full) this.chars = this.full;
      else if (!last) { this.page++; this.chars = 0; }
      else { Scenes.remove(this); this.resolve(0); }
    }
  }
  draw() {
    const x = 16, y = 344, w = 608, h = 120;
    drawWindow(x, y, w, h);
    if (this.name) {
      const nw = textWidth(this.name, 15) + 28;
      drawWindow(x + 12, y - 30, nw, 34);
      text(this.name, x + 26, y - 21, UI.gold, 15);
    }
    if (this.spr) {
      ctx.fillStyle = UI.ink; ctx.fillRect(x + 20, y + 16, 92, 88);
      ctx.fillStyle = '#2a3263'; ctx.fillRect(x + 22, y + 18, 88, 84);
      const s = charSprite(this.spr, 'down', 0);
      ctx.drawImage(s, 0, 0, 16, 14, x + 26, y + 22, 80, 70);
    }
    let n = Math.floor(this.chars);
    const lines = this.pages[this.page];
    for (let i = 0; i < lines.length; i++) {
      const s = lines[i].slice(0, Math.max(0, n));
      n -= lines[i].length + 1;
      text(s, x + this.textX - 16, y + 18 + i * 28, UI.paper, 17, 'left', false);
    }
    const last = this.page === this.pages.length - 1;
    if (this.chars >= this.full && !(last && this.options)) {
      const b = Math.floor(TIME * 4) % 2;
      ctx.fillStyle = UI.sakura; ctx.beginPath();
      ctx.moveTo(x + w - 30, y + h - 22 + b); ctx.lineTo(x + w - 18, y + h - 22 + b); ctx.lineTo(x + w - 24, y + h - 15 + b); ctx.fill();
    }
    if (this.options && last && this.chars >= this.full) {
      const ow = Math.max(...this.options.map(o => textWidth(o, 16))) + 60;
      const oh = this.options.length * 30 + 20;
      const ox = x + w - ow, oy = y - oh - 6;
      drawWindow(ox, oy, ow, oh);
      this.options.forEach((o, i) => {
        text(o, ox + 38, oy + 12 + i * 30, i === this.sel ? UI.paper : UI.dim, 16);
        if (i === this.sel) drawCursor(ox + 16, oy + 13 + i * 30);
      });
    }
  }
}
function say(name, str, spr) { const d = new DialogScene(name, str, spr); Scenes.push(d); return d.promise; }
async function talk(lines) { for (const l of lines) await say(l[0], l[1], l[2]); }
function ask(name, str, options, spr, cancel = true) {
  options.cancel = cancel;
  const d = new DialogScene(name, str, spr, options); Scenes.push(d); return d.promise;
}
async function confirm(name, str, spr) { return (await ask(name, str, ['Yes', 'No'], spr)) === 0; }

// ------------------------------------------------------------------ list
class ListScene {
  constructor(o) {
    this.transparent = true;
    Object.assign(this, { x: 16, y: 16, w: 200, rows: 9, cancel: true, title: null, showDesc: true, rowH: 30 }, o);
    this.index = clamp(o.index || 0, 0, Math.max(0, this.items.length - 1));
    this.scroll = 0;
    this.promise = new Promise(r => this.resolve = r);
    this.fixScroll();
  }
  fixScroll() {
    if (this.index < this.scroll) this.scroll = this.index;
    if (this.index >= this.scroll + this.rows) this.scroll = this.index - this.rows + 1;
  }
  update() {
    const n = this.items.length;
    if (n && Input.pressed('up')) { this.index = (this.index + n - 1) % n; Sound.sfx('cursor'); this.fixScroll(); if (this.onMove) this.onMove(this.index); }
    if (n && Input.pressed('down')) { this.index = (this.index + 1) % n; Sound.sfx('cursor'); this.fixScroll(); if (this.onMove) this.onMove(this.index); }
    if (this.onSide && (Input.pressed('left') || Input.pressed('right'))) this.onSide(this.index, Input.pressed('left') ? -1 : 1);
    if (Input.pressed('ok') && n) {
      const it = this.items[this.index];
      if (it.disabled) { Sound.sfx('buzz'); return; }
      Sound.sfx('ok'); Scenes.remove(this); this.resolve(this.index);
    }
    if (Input.pressed('cancel') && this.cancel) { Sound.sfx('cancel'); Scenes.remove(this); this.resolve(-1); }
  }
  get height() { return Math.min(this.rows, Math.max(1, this.items.length)) * this.rowH + 24 + (this.title ? 30 : 0); }
  draw() {
    const { x, y, w } = this; const h = this.height;
    drawWindow(x, y, w, h);
    let yy = y + 12;
    if (this.title) { text(this.title, x + 18, yy, UI.gold, 15); yy += 30; }
    if (!this.items.length) text(this.empty || 'Nothing here.', x + 22, yy + 4, UI.dim, 15);
    for (let i = this.scroll; i < Math.min(this.items.length, this.scroll + this.rows); i++) {
      const it = this.items[i];
      const ry = yy + (i - this.scroll) * this.rowH;
      const col = it.disabled ? '#6a6480' : (it.color || (i === this.index ? UI.paper : '#d8cfb8'));
      if (it.icon) it.icon(x + 34, ry);
      text(it.label, x + (it.icon ? 62 : 38), ry + 4, col, 16);
      if (it.right !== undefined) text(String(it.right), x + w - 18, ry + 5, it.disabled ? '#6a6480' : UI.dim, 15, 'right');
      if (i === this.index) drawCursor(x + 14, ry + 5);
    }
    if (this.items.length > this.rows) {
      if (this.scroll > 0) text('▲', x + w / 2, y + 2, UI.sakura, 12, 'center');
      if (this.scroll + this.rows < this.items.length) text('▼', x + w / 2, y + h - 16, UI.sakura, 12, 'center');
    }
    const cur = this.items[this.index];
    if (this.showDesc && cur && cur.desc) {
      const lines = wrap(cur.desc, 560, 15);
      const dh = lines.length * 22 + 24;
      drawWindow(16, H - dh - 12, 608, dh);
      lines.forEach((l, i) => text(l, 34, H - dh + i * 22, UI.paper, 15, 'left', false));
    }
    if (this.extraDraw) this.extraDraw(this);
  }
}
function list(o) { const l = new ListScene(o); Scenes.push(l); return l.promise; }

// ------------------------------------------------------------------ name entry
class NameEntryScene {
  constructor(def) { this.transparent = true; this.name = def; this.promise = new Promise(r => this.resolve = r); this.first = true; }
  update() {
    for (const k of Input.typed) {
      if (k === '\b') { this.name = this.name.slice(0, -1); Sound.sfx('cursor'); this.first = false; }
      else if (/^[a-zA-Z0-9 '\-]$/.test(k) && !(k === ' ' && !this.name)) {
        if (this.first) { this.name = ''; this.first = false; }
        if (this.name.length < 10) { this.name += k; Sound.sfx('talk'); }
      }
    }
    if (Controls.mode !== 'keys' && Input.pressed('ok')) {
      const v = window.prompt('What is your name? (max 10 characters)', this.first ? this.name : this.name);
      if (v !== null) { const n = v.replace(/[^a-zA-Z0-9 '\-]/g, '').trim().slice(0, 10); if (n) { this.name = n; this.first = false; Sound.sfx('ok'); Scenes.remove(this); this.resolve(n); } else Sound.sfx('buzz'); }
      return;
    }
    if (Input.pressedSet.has('Enter') || Input.pressedSet.has('NumpadEnter')) {
      const n = this.name.trim();
      if (!n) { Sound.sfx('buzz'); return; }
      Sound.sfx('ok'); Scenes.remove(this); this.resolve(n);
    }
  }
  draw() {
    drawWindow(120, 150, 400, 150);
    text('What is your name?', 320, 170, UI.gold, 17, 'center');
    ctx.fillStyle = UI.ink; ctx.fillRect(170, 208, 300, 40);
    ctx.fillStyle = '#2a3263'; ctx.fillRect(172, 210, 296, 36);
    const caret = Math.floor(TIME * 2) % 2 ? '_' : ' ';
    text(this.name + caret, 320, 218, this.first ? UI.dim : UI.paper, 20, 'center');
    text(Controls.mode === 'keys' ? 'Type a name, then press Enter' : `Press ${Controls.label('ok')} to type your name`, 320, 262, UI.dim, 13, 'center', false);
  }
}

// ------------------------------------------------------------------ party panel (pause menu backdrop)
class PartyPanel {
  constructor() { this.transparent = true; this.focus = -1; }
  update() { }
  draw() {
    ctx.fillStyle = 'rgba(10,8,24,.55)'; ctx.fillRect(0, 0, W, H);
    G.party.forEach((m, i) => drawMemberCard(m, 196, 16 + i * 108, 428, 100, this.focus === i));
    drawWindow(16, H - 118, 168, 102);
    text(`${G.gold} G`, 34, H - 102, UI.gold, 17);
    text(fmtTime(G.playTime), 34, H - 76, UI.paper, 15);
    text(areaName(G.map), 34, H - 52, UI.dim, 13, 'left', false);
  }
}
function drawMemberCard(m, x, y, w, h, hl) {
  drawWindow(x, y, w, h);
  if (hl) { ctx.strokeStyle = UI.sakura; ctx.lineWidth = 2; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12); }
  const s = charSprite(m.cls === 'hero' ? 'hero' : m.cls, 'down', 0);
  if (m.hp <= 0) ctx.globalAlpha = 0.4;
  ctx.drawImage(s, x + 16, y + 18, 64, 64);
  ctx.globalAlpha = 1;
  text(m.name, x + 96, y + 14, m.hp <= 0 ? UI.bad : UI.paper, 18);
  text(`Lv ${m.lvl}`, x + w - 20, y + 16, UI.gold, 15, 'right');
  text('HP', x + 96, y + 44, UI.dim, 13); bar(x + 124, y + 48, 150, 8, m.hp, maxHP(m), m.hp < maxHP(m) * 0.25 ? UI.bad : UI.hp);
  text(`${m.hp}/${maxHP(m)}`, x + w - 20, y + 42, UI.paper, 14, 'right');
  text('MP', x + 96, y + 66, UI.dim, 13); bar(x + 124, y + 70, 150, 8, m.mp, maxMP(m), UI.mp);
  text(`${m.mp}/${maxMP(m)}`, x + w - 20, y + 64, UI.paper, 14, 'right');
}

// ------------------------------------------------------------------ status screen
class StatusScene {
  constructor(i) { this.i = i; this.promise = new Promise(r => this.resolve = r); }
  update() {
    const n = G.party.length;
    if (Input.pressed('left') || Input.pressed('up')) { this.i = (this.i + n - 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('right') || Input.pressed('down')) { this.i = (this.i + 1) % n; Sound.sfx('cursor'); }
    if (Input.pressed('cancel') || Input.pressed('ok')) { Sound.sfx('cancel'); Scenes.remove(this); this.resolve(); }
  }
  draw() {
    const m = G.party[this.i];
    ctx.fillStyle = '#0e0c1c'; ctx.fillRect(0, 0, W, H);
    drawWindow(16, 16, 608, 448);
    const s = charSprite(m.cls === 'hero' ? 'hero' : m.cls, 'down', 0);
    ctx.fillStyle = '#2a3263'; ctx.fillRect(40, 44, 128, 128);
    ctx.drawImage(s, 40, 44, 128, 128);
    const title = { hero: 'Reincarnated Student', lyra: 'Elven Mage', garrick: 'Dwarven Guardian' }[m.cls];
    text(m.name, 190, 44, UI.paper, 26);
    text(title, 190, 80, UI.sakura, 15);
    text(`Level ${m.lvl}`, 190, 108, UI.gold, 17);
    text(`XP to next: ${xpToNext(m.lvl) - m.xp}`, 190, 134, UI.dim, 14, 'left', false);
    bar(190, 158, 200, 6, m.xp, xpToNext(m.lvl), UI.gold);
    const rows = [['HP', `${m.hp} / ${maxHP(m)}`], ['MP', `${m.mp} / ${maxMP(m)}`], ['Attack', stat(m, 'atk')], ['Defence', stat(m, 'def')], ['Magic', stat(m, 'mag')], ['Speed', stat(m, 'spd')]];
    rows.forEach(([k, v], i) => { text(k, 44, 196 + i * 28, UI.dim, 16); text(String(v), 250, 196 + i * 28, UI.paper, 16, 'right'); });
    text('Equipment', 300, 196, UI.gold, 16);
    text(`${CLASSES[m.cls].weapon}: ${ITEMS[m.equip.weapon] ? ITEMS[m.equip.weapon].name : '—'}`, 300, 224, UI.paper, 15, 'left', false);
    text(`Armor: ${ITEMS[m.equip.armor] ? ITEMS[m.equip.armor].name : '—'}`, 300, 250, UI.paper, 15, 'left', false);
    text('Skills', 300, 290, UI.gold, 16);
    knownSkills(m).forEach((sk, i) => text(`${SKILLS[sk].name}  (${SKILLS[sk].mp} MP)`, 300 + (i % 2) * 160, 318 + Math.floor(i / 2) * 26, UI.paper, 14, 'left', false));
    const next = CLASSES[m.cls].skills.find(([l]) => l > m.lvl);
    if (next) text(`Next skill at Lv ${next[0]}: ${SKILLS[next[1]].name}`, 44, 424, UI.dim, 14, 'left', false);
    if (G.party.length > 1) text('◀ ▶ switch', 600, 424, UI.dim, 13, 'right', false);
  }
}

// ------------------------------------------------------------------ member picker
async function pickMember(title, filter, x = 196, y = 16) {
  const items = G.party.map(m => ({
    label: m.name, right: `${m.hp}/${maxHP(m)} HP  ${m.mp} MP`,
    disabled: filter ? !filter(m) : false
  }));
  const i = await list({ x, y, w: 428, items, title, showDesc: false });
  return i < 0 ? null : G.party[i];
}

// ------------------------------------------------------------------ use item (field)
function useItemOn(id, m) {
  const it = ITEMS[id];
  if (it.revive) { if (m.hp > 0) return null; m.hp = Math.floor(maxHP(m) * it.revive); return `${m.name} is back on their feet!`; }
  if (m.hp <= 0) return null;
  if (it.heal) { if (m.hp >= maxHP(m)) return null; const b = m.hp; m.hp = Math.min(maxHP(m), m.hp + it.heal); return `${m.name} recovered ${m.hp - b} HP.`; }
  if (it.mpheal) { if (m.mp >= maxMP(m)) return null; const b = m.mp; m.mp = Math.min(maxMP(m), m.mp + it.mpheal); return `${m.name} recovered ${m.mp - b} MP.`; }
  return null;
}
async function itemsMenu() {
  let idx = 0;
  while (true) {
    const ids = Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].type === 'use');
    const eq = Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].type !== 'use');
    const all = ids.concat(eq);
    const items = all.map(k => ({ label: ITEMS[k].name, right: '×' + G.inv[k], desc: ITEMS[k].desc + (ITEMS[k].type !== 'use' ? '  (Equip it from the Equip menu.)' : ''), disabled: ITEMS[k].type !== 'use' || ITEMS[k].battleOnly }));
    const i = await list({ x: 196, y: 16, w: 428, items, title: 'Items', index: idx, rows: 10, empty: 'Your bag is empty.' });
    if (i < 0) return;
    idx = i;
    const id = all[i], it = ITEMS[id];
    if (it.target === 'allies') {
      let any = false;
      for (const m of G.party) if (m.hp > 0 && m.hp < maxHP(m)) { m.hp = Math.min(maxHP(m), m.hp + it.heal); any = true; }
      if (!any) { Sound.sfx('buzz'); toast('No one needs that right now.'); continue; }
      removeItem(id); Sound.sfx('heal'); toast('The party feels better.'); continue;
    }
    const m = await pickMember(`Use ${it.name} on…`, null);
    if (!m) continue;
    const res = useItemOn(id, m);
    if (!res) { Sound.sfx('buzz'); toast('It would have no effect.'); continue; }
    removeItem(id); Sound.sfx('heal'); toast(res, UI.hp);
  }
}
async function skillsMenu() {
  while (true) {
    const m = await pickMember('Whose skills?', null);
    if (!m) return;
    while (true) {
      const sk = knownSkills(m);
      const items = sk.map(s => ({ label: SKILLS[s].name, right: SKILLS[s].mp + ' MP', desc: SKILLS[s].desc, disabled: SKILLS[s].kind !== 'heal' || m.mp < SKILLS[s].mp || m.hp <= 0 }));
      const i = await list({ x: 196, y: 16, w: 428, items, title: `${m.name} — ${m.mp}/${maxMP(m)} MP` });
      if (i < 0) break;
      const s = SKILLS[sk[i]];
      const amount = t => Math.floor(s.power + stat(m, 'mag') * s.scale);
      if (s.target === 'allies') {
        m.mp -= s.mp; for (const t of G.party) if (t.hp > 0) t.hp = Math.min(maxHP(t), t.hp + amount(t));
        Sound.sfx('heal'); toast('Everyone was healed.', UI.hp);
      } else {
        const t = await pickMember(`Cast ${s.name} on…`, t => t.hp > 0);
        if (!t) continue;
        if (t.hp >= maxHP(t)) { Sound.sfx('buzz'); toast(`${t.name} is already at full HP.`); continue; }
        m.mp -= s.mp; const b = t.hp; t.hp = Math.min(maxHP(t), t.hp + amount(t));
        Sound.sfx('heal'); toast(`${t.name} recovered ${t.hp - b} HP.`, UI.hp);
      }
    }
  }
}

// ------------------------------------------------------------------ equip
function statLine(it) {
  const p = [];
  if (it.atk) p.push(`ATK +${it.atk}`); if (it.def) p.push(`DEF +${it.def}`); if (it.mag) p.push(`MAG +${it.mag}`);
  return p.join('  ');
}
async function equipMenu() {
  while (true) {
    const m = await pickMember('Equip who?', null);
    if (!m) return;
    while (true) {
      const slots = ['weapon', 'armor'];
      const items = slots.map(s => ({ label: (s === 'weapon' ? CLASSES[m.cls].weapon : 'Armor') + ': ' + (ITEMS[m.equip[s]] ? ITEMS[m.equip[s]].name : '—'), desc: ITEMS[m.equip[s]] ? statLine(ITEMS[m.equip[s]]) + ' — ' + ITEMS[m.equip[s]].desc : '' }));
      const si = await list({ x: 196, y: 16, w: 428, items, title: `${m.name}   ATK ${stat(m, 'atk')}  DEF ${stat(m, 'def')}  MAG ${stat(m, 'mag')}` });
      if (si < 0) break;
      const slot = slots[si];
      const cands = Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].type === slot && ITEMS[k].who.includes(m.cls));
      const cur = ITEMS[m.equip[slot]] || {};
      const diff = (it, k) => { const d = (it[k] || 0) - (cur[k] || 0); return d ? `${k.toUpperCase()} ${d > 0 ? '+' : ''}${d}` : ''; };
      const opts = cands.map(k => ({ label: ITEMS[k].name, right: ['atk', 'def', 'mag'].map(s => diff(ITEMS[k], s)).filter(Boolean).join(' ') || '=', desc: statLine(ITEMS[k]) + ' — ' + ITEMS[k].desc }));
      const ci = await list({ x: 196, y: 16, w: 428, items: opts, title: `Change ${slot}`, empty: `No other ${slot}s ${m.name} can use.` });
      if (ci < 0 || !cands.length) continue;
      const newId = cands[ci];
      removeItem(newId);
      if (m.equip[slot]) addItem(m.equip[slot]);
      m.equip[slot] = newId;
      m.hp = Math.min(m.hp, maxHP(m));
      Sound.sfx('buff'); toast(`${m.name} equipped the ${ITEMS[newId].name}.`);
    }
  }
}

// ------------------------------------------------------------------ quests list
function questProgress(q) {
  if (q.type === 'gather') return `${q.have}/${q.need}`;
  if (q.type === 'hunt') return `${q.have}/${q.need}`;
  return q.have >= q.need ? 'Done' : 'Hunting';
}
async function questsMenu() {
  const items = G.quests.map(q => ({ label: q.title, right: q.have >= q.need ? 'Turn in' : questProgress(q), color: q.have >= q.need ? UI.hp : undefined, desc: q.desc + `  Reward: ${q.gold} G, ${q.xp} XP.` }));
  const story = storyObjective();
  items.unshift({ label: 'Main story', right: '', desc: story, color: UI.gold });
  await list({ x: 196, y: 16, w: 428, items, title: 'Quests', rows: 7 });
}

// ------------------------------------------------------------------ settings
async function settingsMenu() {
  let i = 0;
  while (true) {
    const items = [
      { label: 'Music volume', right: Math.round(Sound.vol.music * 100) + '%' },
      { label: 'Sound effects', right: Math.round(Sound.vol.sfx * 100) + '%' },
      { label: 'Controls', desc: Controls.mode === 'touch' ? 'Touch: slide your thumb on the D-pad to move. A confirms, B goes back, MENU opens the menu, RUN toggles running. ⛶ goes fullscreen. Keyboards and controllers also work — the game switches automatically.' : Controls.mode === 'pad' ? 'Controller: D-pad / left stick to move. A confirm, B back, Start menu, hold X or a shoulder button to run.' : 'Move: Arrows / WASD.  Confirm: Z, Enter, Space.  Cancel: X, Backspace.  Menu: Esc / M.  Hold Shift to run.  F: fullscreen. Touch and controllers switch in automatically.' }
    ];
    const l = new ListScene({ x: 196, y: 16, w: 428, items, title: 'Settings  (◀ ▶ to adjust)', index: i });
    l.onSide = (idx, d) => {
      const k = idx === 0 ? 'music' : idx === 1 ? 'sfx' : null; if (!k) return;
      Sound.vol[k] = clamp(Math.round((Sound.vol[k] + d * 0.1) * 10) / 10, 0, 1);
      Sound.applyVolume(); saveSettings(); Sound.sfx('cursor');
      l.items[idx].right = Math.round(Sound.vol[k] * 100) + '%';
    };
    Scenes.push(l);
    i = await l.promise;
    if (i < 0) return;
    if (i === 2) continue;
    if (i < 2) { const k = i === 0 ? 'music' : 'sfx'; Sound.vol[k] = Sound.vol[k] >= 1 ? 0 : Math.round((Sound.vol[k] + 0.2) * 10) / 10; if (Sound.vol[k] > 1) Sound.vol[k] = 1; Sound.applyVolume(); saveSettings(); }
  }
}

// ------------------------------------------------------------------ pause menu
async function pauseMenu() {
  const panel = Scenes.push(new PartyPanel());
  let idx = 0;
  while (true) {
    const labels = ['Items', 'Skills', 'Equip', 'Status', 'Quests', 'Save', 'Cloud Save', 'Settings', 'Title screen'];
    const i = await list({ x: 16, y: 16, w: 168, items: labels.map(l => ({ label: l })), index: idx, showDesc: false });
    if (i < 0) break;
    idx = i;
    const L = labels[i];
    if (L === 'Items') await itemsMenu();
    else if (L === 'Skills') await skillsMenu();
    else if (L === 'Equip') await equipMenu();
    else if (L === 'Status') { const m = await pickMember('Status of…', null); if (m) { const s = new StatusScene(G.party.indexOf(m)); Scenes.push(s); await s.promise; } }
    else if (L === 'Quests') await questsMenu();
    else if (L === 'Save') { saveGame() ? (Sound.sfx('save'), toast('Game saved.', UI.hp)) : toast('Could not save.', UI.bad); }
    else if (L === 'Cloud Save') { if (await cloudMenu(true) === 'reloaded') { Scenes.remove(panel); return 'reloaded'; } }
    else if (L === 'Settings') await settingsMenu();
    else if (L === 'Title screen') {
      if (await confirm(null, 'Return to the title screen? Anything since your last save will be lost.')) { Scenes.remove(panel); goTitle(); return 'title'; }
    }
  }
  Scenes.remove(panel);
}

// ------------------------------------------------------------------ shop
async function shopScene(shopId, keeper, spr) {
  await say(keeper, pick(['Welcome! Take a look around.', 'Browse all you like. Buying is encouraged.', 'Fresh stock! Mostly.']), spr);
  const panel = Scenes.push(new GoldPanel());
  while (true) {
    const c = await list({ x: 16, y: 16, w: 170, items: [{ label: 'Buy' }, { label: 'Sell' }, { label: 'Leave' }], showDesc: false });
    if (c < 0 || c === 2) break;
    if (c === 0) {
      let idx = 0;
      while (true) {
        const stock = SHOPS[shopId];
        const items = stock.map(id => {
          const it = ITEMS[id], price = Math.ceil(it.price * priceMult());
          const who = it.who ? '  [' + it.who.map(w => w === 'hero' ? G.name : w === 'lyra' ? 'Lyra' : 'Garrick').join(', ') + ']' : '';
          return { label: it.name, right: price + ' G', disabled: G.gold < price, desc: (it.type !== 'use' ? statLine(it) + ' — ' : '') + it.desc + who + (itemCount(id) ? `  (You have ${itemCount(id)}.)` : '') };
        });
        const i = await list({ x: 196, y: 16, w: 428, items, title: 'Buy', index: idx, rows: 10 });
        if (i < 0) break;
        idx = i;
        const id = stock[i], price = Math.ceil(ITEMS[id].price * priceMult());
        G.gold -= price; addItem(id); Sound.sfx('coin'); toast(`Bought ${ITEMS[id].name}.`);
      }
    }
    if (c === 1) {
      let idx = 0;
      while (true) {
        const ids = Object.keys(G.inv).filter(k => ITEMS[k]);
        const items = ids.map(id => ({ label: ITEMS[id].name, right: `×${G.inv[id]}  ${Math.floor(ITEMS[id].price / 2)} G`, desc: ITEMS[id].desc }));
        const i = await list({ x: 196, y: 16, w: 428, items, title: 'Sell', index: idx, rows: 10, empty: 'Nothing to sell.' });
        if (i < 0 || !ids.length) break;
        idx = Math.min(i, ids.length - 2);
        const id = ids[i];
        G.gold += Math.floor(ITEMS[id].price / 2); removeItem(id); Sound.sfx('coin'); toast(`Sold ${ITEMS[id].name}.`);
      }
    }
  }
  Scenes.remove(panel);
  await say(keeper, pick(['Come back soon!', 'Stay safe out there.', 'Pleasure doing business.']), spr);
}
class GoldPanel {
  constructor() { this.transparent = true; }
  update() { }
  draw() { drawWindow(16, 132, 170, 50); text(`${G.gold} G`, 34, 146, UI.gold, 18); }
}

// ------------------------------------------------------------------ inn
async function innScene(name, spr, free) {
  const cost = free ? 0 : 8 + heroLevel() * 3;
  const msg = free ? 'Rest by the fire? It\'s free, and I\'ll keep watch. (Also saves your game.)' : `A warm bed for the night is ${cost} G. (Also saves your game.)`;
  const ok = await confirm(name, msg, spr);
  if (!ok) return;
  if (G.gold < cost) { await say(name, 'Ah… you\'re a little short. Come back when you have the coin.', spr); return; }
  G.gold -= cost;
  await fadeOut(0.6);
  Sound.play('void');
  healParty();
  await wait(1.2);
  saveGame();
  Sound.stop();
  Sound.play(MAPS[G.map].music);
  await fadeIn(0.6);
  Sound.sfx('save');
  await say(name, free ? 'You look much better. The fire\'s a good friend. (Game saved.)' : 'Good morning! You look well rested. (Game saved.)', spr);
}
