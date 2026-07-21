self.addEventListener('install', (e) => {
  console.log('Guild App Service Worker Installed');
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
