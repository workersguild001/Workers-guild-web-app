const CACHE_NAME = 'guild-v1';
const ASSETS = [
  '/',
  'index.html',
  'gateway.html',
  'dashboard.html',
  'profile.html',
  'recruitment.html',
  'payouts.html',
  'success.html',
  'owner.html',
  'admin.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
