/* Arise service worker.
   Strategy: NETWORK FIRST for the app's own files, so every open shows the latest deploy.
   The cache is only used when the network is down or takes longer than NET_TIMEOUT.
   Fetches bypass the HTTP cache so a fresh deploy is never masked by a stale 10-minute copy. */
const VERSION = 'arise-v8';
const NET_TIMEOUT = 3500; // ms before we give up on the network and serve the cached copy
const SHELL = [
  './',
  './index.html',
  './core.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

const fresh = (url) => fetch(new Request(url, { cache: 'no-cache', credentials: 'same-origin' }));

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => fresh(u).then((r) => { if (r && r.ok) return c.put(u, r); }).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fresh(req.url).then((res) => {
        if (res && res.ok) cache.put(req.url.split('?')[0], res.clone());
        return res;
      });
      // Race the network against a timeout only when we have something cached to fall back to.
      const timeout = cached ? new Promise((r) => setTimeout(() => r(null), NET_TIMEOUT)) : new Promise(() => {});
      try {
        const res = await Promise.race([network, timeout]);
        if (res) return res;
      } catch (err) { /* offline */ }
      if (cached) return cached;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    })());
    return;
  }

  // Fonts and anything cross-origin: network first, fall back to cache, cache successes.
  e.respondWith(
    fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) caches.open(VERSION).then((c) => c.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});

// Rest-over notification. The browser may stop this worker before the timer fires
// (it is best effort), so the page also vibrates and toasts when it is awake.
let restTimer = null;
self.addEventListener('message', (e) => {
  const m = e.data || {};
  if (restTimer) { clearTimeout(restTimer); restTimer = null; }
  if (m.type === 'rest' && m.endsAt) {
    const delay = Math.max(0, m.endsAt - Date.now());
    restTimer = setTimeout(() => {
      restTimer = null;
      self.registration.showNotification('Rest over', { body: 'Next set.', tag: 'arise-rest', renotify: true, vibrate: [80, 60, 80], icon: './icons/icon-192.png', badge: './icons/icon-192.png' }).catch(() => {});
    }, delay);
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
