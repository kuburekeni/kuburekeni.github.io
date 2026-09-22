// =====================================================================
//  quests.js : procedural side quests + the Aldmere quest board
// =====================================================================
const QUEST_MAX = 3, BOARD_SIZE = 4;
const HERBS = {
  forest: ['Moonpetal', 'Silverleaf', 'Dewcap'],
  mine: ['Glowcap', 'Cave Lichen', 'Ghostmoss'],
  wastes: ['Emberroot', 'Ashbloom', 'Cinder Thistle'],
  castle: ['Nightshade', 'Voidlily', 'Grave Orchid']
};
const CLIENTS = ['Farmer Tobbs', 'Hana', 'Innkeeper Suzu', 'Elder Bram', 'Pip (age 9)', 'Smith Haldor', 'Quartermaster Olga', 'Healer Sera', 'A worried mum', 'The Adventurers\' Guild', 'Anonymous (it\'s Pip)', 'Dunstan'];
const ELITE_TITLES = ['Big', 'Old', 'Mad', 'Grumpy', 'Ancient', 'Terrible', 'Sir', 'Lord', 'Gigantic', 'Unkillable'];
const ELITE_NAMES = ['Gary', 'Bertha', 'Grimtooth', 'Kevin', 'Mordrek', 'Susan', 'Skullcrusher', 'Barnaby', 'Vex', 'Chompers'];

function questAreas() {
  return QUEST_AREAS.filter(a => a === 'forest' || (a === 'mine' && G.flags.garrick) || ((a === 'wastes' || a === 'castle') && G.flags.golem));
}
function questLevel(area) { return Math.max(MAPS[area].lvl || 1, G.postgame ? partyLevel() : 0); }

// walkable tiles reachable from the area's entrance, away from story blockers
function reachable(area) {
  const map = MAPS[area], rows = map.rows, h = rows.length, w = rows[0].length;
  const block = new Set();
  for (const n of map.npcs) if (!n.show || flag(n.show)) block.add(n.x + ',' + n.y);
  for (const c of map.chests) block.add(c.x + ',' + c.y);
  const warpCell = (x, y) => map.warps.some(v => x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h);
  const seen = new Set(), out = [], q = [];
  const wp = map.warps[0];
  q.push([wp.x, wp.y]); seen.add(wp.x + ',' + wp.y);
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(k)) continue;
      seen.add(k);
      if (SOLID.has(rows[ny][nx]) || block.has(k)) continue;
      q.push([nx, ny]);
      if (!warpCell(nx, ny)) out.push([nx, ny]);
    }
  }
  const safe = map.safe || [];
  return out.filter(([x, y]) => !safe.some(([a, b, sw, sh]) => x >= a && x < a + sw && y >= b && y < b + sh));
}
function farFromWarps(area, cells, d) {
  const ws = MAPS[area].warps;
  return cells.filter(([x, y]) => ws.every(v => Math.abs(x - (v.x + v.w / 2)) + Math.abs(y - (v.y + v.h / 2)) > d));
}
function takenCells() {
  const s = new Set();
  for (const q of G.quests) { if (q.spots) for (const [x, y] of q.spots) s.add(q.map + x + ',' + y); if (q.pos) s.add(q.map + q.pos[0] + ',' + q.pos[1]); }
  return s;
}

function makeQuest() {
  const areas = questAreas();
  const area = pick(areas.slice(-2).concat(areas)); // bias towards the newest areas
  const L = questLevel(area);
  const map = MAPS[area];
  const pool = map.encounters.filter(([id]) => !ENEMIES[id].boss);
  let type = weighted([['gather', 3], ['hunt', 4], ['bounty', G.flags.chief ? 2 : 1]]);
  const client = pick(CLIENTS);
  const id = ++G.questCounter;
  const q = { id, type, map: area, have: 0, client };
  const typeMul = { gather: 1, hunt: 1.3, bounty: 2.6 }[type];
  if (type === 'gather') {
    const herb = pick(HERBS[area]);
    q.need = irand(3, 5);
    q.itemName = herb;
    q.title = `Gather ${herb}`;
    q.desc = `${client}: "I need ${q.need} ${herb} from ${map.name}. They glow — you can't miss them."`;
  } else if (type === 'hunt') {
    const [enemy] = pick(pool);
    q.enemy = enemy; q.need = irand(3, 6);
    const n = ENEMIES[enemy].name;
    q.title = `Cull the ${n}s`;
    q.desc = `${client}: "${pick(['They ate my chickens.', 'They keep looking at me.', 'There are simply too many.', 'Personal reasons.'])} Defeat ${q.need} ${n}s (found in ${map.name})."`;
  } else {
    const [enemy] = pick(pool);
    const n = ENEMIES[enemy].name;
    q.enemy = enemy; q.need = 1;
    q.eliteName = `${pick(ELITE_TITLES)} ${pick(ELITE_NAMES)}`;
    q.mult = G.postgame ? 1.15 : 1;
    q.title = `Bounty: ${q.eliteName}`;
    q.desc = `WANTED: ${q.eliteName}, a monstrous ${n} lurking somewhere in ${map.name}. Look for the red glow. Extremely dangerous.`;
  }
  q.gold = Math.round((14 + L * 9) * typeMul * (type === 'gather' ? q.need / 3 : type === 'hunt' ? q.need / 4 : 1));
  q.xp = Math.round(xpToNext(L) * 0.35 * typeMul * (type === 'hunt' ? q.need / 4 : 1));
  return q;
}

// place herbs / bounty monster when the quest is accepted
function placeQuest(q) {
  const taken = takenCells();
  const cells = reachable(q.map).filter(([x, y]) => !taken.has(q.map + x + ',' + y));
  if (q.type === 'gather') {
    const far = farFromWarps(q.map, cells, 3);
    const src = far.length >= q.need ? far : cells;
    q.spots = [];
    const copy = src.slice();
    for (let i = 0; i < q.need && copy.length; i++) q.spots.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    q.need = q.spots.length;
  }
  if (q.type === 'bounty') {
    const rows = MAPS[q.map].rows;
    const open = ([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => rows[y + dy] && rows[y + dy][x + dx] && !SOLID.has(rows[y + dy][x + dx]));
    let far = farFromWarps(q.map, cells, 8).filter(open);
    if (!far.length) far = farFromWarps(q.map, cells, 4);
    q.pos = pick(far.length ? far : cells);
  }
}

function refillBoard() {
  if (!G.board) G.board = [];
  G.board = G.board.filter(b => questAreas().includes(b.map));
  while (G.board.length < BOARD_SIZE) G.board.push(makeQuest());
}

async function turnInQuests() {
  const done = G.quests.filter(q => q.have >= q.need);
  for (const q of done) {
    G.quests.splice(G.quests.indexOf(q), 1);
    G.gold += q.gold; G.questsDone++;
    Sound.sfx('coin');
    await say('Quest Board', `"${q.title}" complete! ${q.client ? q.client + ' pays' : 'Reward'}: ${q.gold} G and ${q.xp} XP.`);
    const msgs = [];
    for (const m of G.party) msgs.push(...gainXP(m, q.xp));
    for (const l of msgs) { if (l.includes('reached')) Sound.sfx('levelup'); await say(null, l); }
    if (G.questsDone % 5 === 0) {
      const bonus = [['hipotion', 3], ['phoenix', 2], ['ether', 3], ['mega', 1]][(G.questsDone / 5 - 1) % 4];
      addItem(bonus[0], bonus[1]); Sound.sfx('chest');
      await say('Quest Board', `Milestone: ${G.questsDone} jobs done! The village sends a thank-you gift: ${bonus[1]}× ${ITEMS[bonus[0]].name}.`);
    }
  }
  return done.length;
}

async function questBoard() {
  await say(null, 'The Aldmere Quest Board. Notices are pinned all over it, some several layers deep.');
  await turnInQuests();
  refillBoard();
  let idx = 0;
  while (true) {
    const c = await list({ x: 16, y: 16, w: 200, items: [
      { label: 'Take a job', desc: `Pick up a new job. You can carry ${QUEST_MAX} at once (${G.quests.length}/${QUEST_MAX}). Jobs completed so far: ${G.questsDone}.` },
      { label: 'Abandon a job', disabled: !G.quests.length, desc: 'Give up one of your current jobs.' },
      { label: 'New notices', desc: 'Tear down the unclaimed notices and look at fresh ones.' },
      { label: 'Leave' }
    ], index: idx, title: 'Quest Board' });
    if (c < 0 || c === 3) break;
    idx = c;
    if (c === 0) {
      const items = G.board.map(q => ({
        label: q.title, right: areaName(q.map),
        disabled: G.quests.length >= QUEST_MAX,
        desc: `${q.desc}  Reward: ${q.gold} G, ${q.xp} XP.` + (G.quests.length >= QUEST_MAX ? '  (You already have 3 jobs.)' : '')
      }));
      const i = await list({ x: 196, y: 16, w: 428, items, title: 'Available jobs', rows: 6 });
      if (i < 0) continue;
      const q = G.board.splice(i, 1)[0];
      placeQuest(q);
      G.quests.push(q);
      Sound.sfx('ok');
      toast(`Accepted: ${q.title}`, UI.gold);
      refillBoard();
    }
    if (c === 1) {
      const i = await list({ x: 196, y: 16, w: 428, items: G.quests.map(q => ({ label: q.title, right: questProgress(q), desc: q.desc })), title: 'Abandon which job?' });
      if (i < 0) continue;
      if (await confirm(null, `Abandon "${G.quests[i].title}"?`)) { G.quests.splice(i, 1); Sound.sfx('cancel'); }
    }
    if (c === 2) { G.board = []; refillBoard(); Sound.sfx('pickup'); toast('Fresh notices pinned up.'); }
  }
}
