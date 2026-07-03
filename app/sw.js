/* RAIZ DST service worker — makes the installed app work fully offline.
   Own files: network-first (updates arrive when online, cache serves offline).
   Cross-origin (Google Fonts): cache-first (fonts persist once seen). */
const CACHE = 'raiz-dst-v1';
const CORE = ['./raiz_dst.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;

  if (req.mode === 'navigate' || sameOrigin) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true })
            .then(m => m || caches.match('./raiz_dst.html'))
        )
    );
  } else {
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }))
    );
  }
});
