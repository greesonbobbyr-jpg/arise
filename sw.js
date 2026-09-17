/* Arise service worker — precache the app shell so it opens with no network,
   and fire a best-effort "rest over" notification when the page asks for one. */
const VERSION = 'arise-v2';
const SHELL = [
  './',
  './index.html',
  './core.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
    // App shell: cache first, refresh in background so updates land on the next open.
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => {
        const refresh = fetch(req).then((res) => {
          if (res && res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || refresh;
      })
    );
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
