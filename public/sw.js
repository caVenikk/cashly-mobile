// Minimal service worker — enables "install to home screen" as a PWA on iOS/Android.
// Uses a network-first strategy with a runtime cache so the app works offline
// after the first successful visit.
const CACHE_NAME = 'cashly-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never cache Supabase / third-party API calls — always live.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200 && fresh.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        // SPA fallback: serve cached index.html for navigations.
        if (req.mode === 'navigate') {
          const index = await caches.match('./');
          if (index) return index;
        }
        throw new Error('offline');
      }
    })(),
  );
});
