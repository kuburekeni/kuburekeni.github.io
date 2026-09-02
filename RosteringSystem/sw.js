// Roster service worker.
//
// Deliberately conservative: it caches ONLY the static app shell (HTML, CSS,
// JS, icons). It never caches Supabase API responses — rosters, timesheets and
// availability must always be live, and serving a stale roster would be worse
// than showing an offline message.

const CACHE = "roster-shell-v1";
const SHELL = [
  "./",
  "./index.html",
  "./admin.html",
  "./employee.html",
  "./dev-keys.html",
  "./app.css",
  "./common.js",
  "./roster-engine.js",
  "./payroll-engine.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never touch anything that isn't a same-origin GET. This skips every
  // Supabase call (different origin) and all writes.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Network-first for the app shell so a redeploy is picked up immediately;
  // fall back to cache only when offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match("./index.html")))
  );
});
