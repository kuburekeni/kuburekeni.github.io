# KandA's Home Helper

Calendar, groceries, bills, chores, tasks and notes.
One HTML file plus a service worker. No backend, no accounts, no build step.

---

## Install

1. Copy every file here into a repo, or a folder inside `kuburekeni.github.io`.
2. Push. GitHub Pages serves HTTPS, which the install **and the encryption**
   both require — `crypto.subtle` does not exist on plain http.
3. On the iPhone open the URL **in Safari** (iOS only allows installing from
   Safari, not Chrome).
4. Share button → **Add to Home Screen**.

It launches full screen with the pixel icon and works with no signal.

### After you edit index.html

Bump `CACHE` in `sw.js` — `homehelper-v1` → `homehelper-v2`. Otherwise installed
phones keep serving the cached old copy and you will swear the deploy failed.

---

## The PIN

> **This file ships in your repo.** If the repo is public, anything written here
> is public too — so the PIN is deliberately not recorded in it. It is the
> six-digit date you chose. Do not add it below.

**The PIN is not stored anywhere, not even as a hash.** There is no
`if (entered === correct)` line to find, and nothing to edit out.

Instead the PIN is fed through PBKDF2 (600,000 rounds of SHA-256) to derive an
AES-256 key. Everything the app saves — bills, notes, events, chores — is
encrypted with that key before it touches disk. What sits in storage is
ciphertext.

The only PIN-related thing in the source is `VERIFIER`: a known phrase already
encrypted with the right key. Type a PIN, the app derives a key and tries to
decrypt it. If it comes out as the expected phrase, the PIN was right. If not,
you get nothing — and crucially, the same wrong key would fail to read your data
anyway.

So there is no lock to pick. Skipping the lock screen leaves you looking at
encrypted blobs.

### How strong is it, honestly

Six digits is a million combinations, so someone with your phone's storage
could try all of them. PBKDF2 is what makes that expensive:

| | cost to try all 1,000,000 PINs |
|---|---|
| plain SHA-256 hash (the old version) | **0.13 seconds** |
| PBKDF2, 600,000 rounds | **~85 CPU-hours** |

That is roughly a 2,000,000× increase, and it is the difference between
"instant" and "you would need to really want it". A serious attacker with GPUs
would still get there — the honest ceiling for a 6-digit PIN.

If you want it genuinely strong, change `PIN_LEN` and use a word-based
passphrase instead of digits. The maths improves enormously and none of the
rest of the code changes.

### If you forget the PIN

The data is gone. There is no recovery, because there is no key stored anywhere
to recover it with. That is the point.

### Changing the PIN

Regenerate `SALT`, `IV` and `VERIFIER` in `index.html` with:

```js
// paste in the browser console on the deployed page
const pin = 'YOUR-NEW-PIN';
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv   = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin),
  'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  {name:'PBKDF2', salt, iterations:600000, hash:'SHA-256'},
  base, {name:'AES-GCM', length:256}, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key,
  new TextEncoder().encode('KandA-Home-Helper-v1'));
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
console.log('SALT     =', b64(salt));
console.log('IV       =', b64(iv));
console.log('VERIFIER =', b64(ct));
```

Existing data was encrypted under the old key and will not be readable
afterwards. Change it while the app is empty, or clear the site data after.

---

## What this build does not do

**No sync.** Data is encrypted into each phone's own storage. Your phone and
hers keep separate lists. The header reads "on this phone" so you always know.

**No notifications.** A closed web app cannot wake itself up, and iOS has no
scheduled local notifications for web apps. Something has to run on a timer and
push, and that means a server.

Both need the same missing piece. All storage goes through one small `store`
object with `get` / `set`, so adding a backend later is a contained change
rather than a rewrite.

Calendar events are the exception — export them as `.ics` and Apple Calendar's
own alerts will notify you properly, no server involved.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app — HTML, CSS, JS, pixel avatars, all inline |
| `manifest.webmanifest` | Name, icons, colours, standalone display |
| `sw.js` | Offline caching. Network first, cache as fallback |
| `icon-*.png` | Home screen and install icons |
