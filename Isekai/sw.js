// Service worker: lets the game load with no signal (on the train, on a plane).
// Network-first so updates you push to the repo show up straight away when online;
// falls back to the cached copy when offline. Cloud saves queue until you reconnect.
const CACHE = 'isekai-v14';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'data.js', 'audio.js', 'engine.js', 'gfx.js', 'fx.js', 'cloud.js', 'controls.js', 'state.js', 'ui.js', 'maps.js',
  'world.js', 'travel.js', 'battle.js', 'story.js', 'quests.js', 'town.js', 'sidequests.js', 'academy.js', 'activities.js', 'menus.js', 'main.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // never touch Supabase calls
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
