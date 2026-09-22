// =====================================================================
//  cloud.js : Supabase cloud saves via a secret sync code
//  Backend: table public.isekai_saves + RPCs isekai_save / isekai_load
//  (project "kuburekeni's Project"). The table is locked down; only the
//  two functions can touch it, and they only work with the right code.
// =====================================================================
const Cloud = {
  url: 'https://zjsppdoqzxmzrotoxrie.supabase.co',
  key: 'sb_publishable_WSqJEk0RT0xz_eGOvRkBuA_OhVzoVMa',
  legacyKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqc3BwZG9xenhtenJvdG94cmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjg3MjgsImV4cCI6MjEwMjc0NDcyOH0.18B2qfcEbOWaUBBp-j-B8OyCZcde0hcUM_fInb_wILM',
  CODE_KEY: 'isekai_cloud_code', PENDING_KEY: 'isekai_cloud_pending',
  status: 'off', // off | syncing | synced | offline
  busy: null,

  get code() { try { return localStorage.getItem(this.CODE_KEY); } catch (e) { return null; } },
  set code(v) { try { v ? localStorage.setItem(this.CODE_KEY, v) : localStorage.removeItem(this.CODE_KEY); } catch (e) { } this.status = v ? 'synced' : 'off'; },
  get pending() { try { return localStorage.getItem(this.PENDING_KEY) === '1'; } catch (e) { return false; } },
  set pending(v) { try { v ? localStorage.setItem(this.PENDING_KEY, '1') : localStorage.removeItem(this.PENDING_KEY); } catch (e) { } },

  // 12 random characters with no look-alikes (no 0/O, 1/I/L), shown as XXXX-XXXX-XXXX
  newCode() {
    const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const b = new Uint32Array(12);
    (window.crypto || window.msCrypto).getRandomValues(b);
    return this.normalise(Array.from(b, n => A[n % A.length]).join(''));
  },
  normalise(s) {
    const c = String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (c.length !== 12) return null;
    return c.match(/.{4}/g).join('-');
  },

  async rpc(fn, body, legacy) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 9000);
    try {
      const headers = { 'Content-Type': 'application/json', apikey: legacy ? this.legacyKey : this.key };
      if (legacy) headers.Authorization = 'Bearer ' + this.legacyKey;
      const r = await fetch(`${this.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(body), signal: ctl.signal });
      if ((r.status === 401 || r.status === 403) && !legacy) return this.rpc(fn, body, true);
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120));
      return await r.json();
    } finally { clearTimeout(timer); }
  },

  localSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } },

  // upload whatever is in the local save slot
  async push(quiet) {
    const code = this.code; if (!code) return false;
    const data = this.localSave(); if (!data) return false;
    if (this.busy) { await this.busy.catch(() => { }); }
    this.status = 'syncing';
    this.busy = this.rpc('isekai_save', { p_code: code, p_data: data, p_saved_at: data.savedAt || Date.now() });
    try {
      await this.busy;
      this.pending = false; this.status = 'synced';
      if (!quiet) toast('Cloud saved ☁', UI.mp);
      return true;
    } catch (e) {
      console.warn('cloud push failed', e);
      this.pending = true; this.status = 'offline';
      if (!quiet) toast('Offline — saved on this device, will sync later.', UI.dim);
      return false;
    } finally { this.busy = null; }
  },

  // returns { data, saved_at } or null (no save for this code); throws when offline
  async pull(code = this.code) {
    if (!code) return null;
    const r = await this.rpc('isekai_load', { p_code: code });
    return r && r.data ? r : null;
  },

  // on startup: take the newer of cloud vs device
  async syncOnBoot() {
    if (!this.code) return 'off';
    this.status = 'syncing';
    try {
      const remote = await this.pull();
      const local = this.localSave();
      const lt = (local && local.savedAt) || 0;
      if (remote && remote.saved_at > lt) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(remote.data));
        this.pending = false; this.status = 'synced';
        return 'pulled';
      }
      if (local && (this.pending || !remote || lt > remote.saved_at)) { await this.push(true); return 'pushed'; }
      this.status = 'synced';
      return 'same';
    } catch (e) { this.status = 'offline'; return 'offline'; }
  }
};

window.addEventListener('online', () => { if (Cloud.code && Cloud.pending) Cloud.push(true); });

function saveSummary(d) {
  if (!d) return 'No save';
  const lv = d.party && d.party[0] ? d.party[0].lvl : 1;
  const when = d.savedAt ? new Date(d.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'unknown time';
  return `${d.name} · Lv ${lv} · ${areaName(d.map)} · ${fmtTime(d.playTime || 0)} played · saved ${when}`;
}

// menu used from both the title screen and the pause menu
async function cloudMenu(inGame) {
  while (true) {
    const code = Cloud.code;
    if (!code) {
      const c = await ask('Cloud Save', 'Cloud saves let you carry on the same adventure on your phone, laptop, anywhere. Link this device with a sync code.', ['Create a new sync code', 'Enter a code from another device', 'Back']);
      if (c === 0) {
        const nc = Cloud.newCode();
        Cloud.code = nc;
        if (inGame) saveGame(true);
        const had = !!Cloud.localSave();
        const ok = had ? await Cloud.push(true) : true;
        try { navigator.clipboard && navigator.clipboard.writeText(nc); } catch (e) { }
        Sound.sfx('save');
        await say('Cloud Save', `Your sync code is:   ${nc}   (copied to clipboard if your browser allows it). Write it down somewhere safe!`);
        await say('Cloud Save', (had ? (ok ? 'Your save is now in the cloud. ' : 'You look offline — it will upload as soon as you reconnect. ') : '') + 'On your other device, choose Cloud Save → "Enter a code" and type this in. From then on, every save syncs automatically.');
        continue;
      }
      if (c === 1) {
        const raw = window.prompt('Enter your sync code (e.g. ABCD-EFGH-JKMN):', '');
        if (raw === null) continue;
        const nc = Cloud.normalise(raw);
        if (!nc) { Sound.sfx('buzz'); await say('Cloud Save', 'That doesn\'t look like a sync code. It should be 12 letters and numbers.'); continue; }
        let remote;
        toast('Checking the cloud…', UI.mp);
        try { remote = await Cloud.pull(nc); } catch (e) { await say('Cloud Save', 'Couldn\'t reach the cloud. Check your internet connection and try again.'); continue; }
        if (!remote) { Sound.sfx('buzz'); await say('Cloud Save', `No save found for ${nc}. Double-check the code on your other device.`); continue; }
        const load = await confirm('Cloud Save', `Found: ${saveSummary(remote.data)}. Link this device and load it?` + (Cloud.localSave() ? ' (This replaces the save on this device.)' : ''));
        if (!load) continue;
        Cloud.code = nc;
        localStorage.setItem(SAVE_KEY, JSON.stringify(remote.data));
        Cloud.pending = false;
        Sound.sfx('save');
        if (inGame) { await fadeOut(0.4); loadGame(); startWorld(); await fadeIn(0.4); toast('Cloud save loaded.', UI.gold); return 'reloaded'; }
        toast('Linked! Choose Continue to play.', UI.gold);
        return;
      }
      return;
    }
    const st = { synced: 'Synced ✓', syncing: 'Syncing…', offline: 'Offline — will retry', off: '' }[Cloud.status] || '';
    const c = await ask('Cloud Save', `Linked with code ${code}.  ${Cloud.pending ? 'Changes waiting to upload.' : st}`, ['Upload now', 'Download from cloud', 'Unlink this device', 'Back']);
    if (c === 0) {
      if (inGame) saveGame(true);
      if (!Cloud.localSave()) { await say('Cloud Save', 'There\'s no save on this device yet.'); continue; }
      const ok = await Cloud.push(true);
      await say('Cloud Save', ok ? 'Uploaded! Your other devices will pick it up next time they open the game.' : 'Couldn\'t reach the cloud. Your save is safe on this device and will upload when you\'re back online.');
    } else if (c === 1) {
      let remote;
      try { remote = await Cloud.pull(); } catch (e) { await say('Cloud Save', 'Couldn\'t reach the cloud right now.'); continue; }
      if (!remote) { await say('Cloud Save', 'Nothing in the cloud for this code yet. Try "Upload now".'); continue; }
      if (!(await confirm('Cloud Save', `Cloud: ${saveSummary(remote.data)}. Load it?` + (inGame ? ' Unsaved progress here will be lost.' : '')))) continue;
      localStorage.setItem(SAVE_KEY, JSON.stringify(remote.data)); Cloud.pending = false;
      if (inGame) { await fadeOut(0.4); loadGame(); startWorld(); await fadeIn(0.4); toast('Cloud save loaded.', UI.gold); return 'reloaded'; }
      toast('Cloud save downloaded.', UI.gold);
    } else if (c === 2) {
      if (await confirm('Cloud Save', `Unlink this device? Your cloud save stays safe under ${code} — you can link again any time with that code.`)) { Cloud.code = null; Cloud.pending = false; toast('Unlinked.'); }
    } else return;
  }
}
