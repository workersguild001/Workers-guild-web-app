const CACHE_NAME = 'guild-terminal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/signin.html',
  '/signup.html',
  '/recovery.html',
  '/404.html',
  '/owner.html',
  '/recruitment.html',
  '/matrix.html',
  '/profile.html',
  '/payouts.html',
  '/terms.html',
  '/manifest.json'
];

// Install Event: Cache core terminal assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('GUILD_CACHE: Initializing offline protocols...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('GUILD_CACHE: Purging legacy protocols...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
