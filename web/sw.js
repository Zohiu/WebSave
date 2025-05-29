const cacheName = 'websave-v2';


const addResourcesToCache = async (resources) => {
  const cache = await caches.open(cacheName);
  await cache.addAll(resources);
};


self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/",
      "/index.html",
      '/css/style.css',
      '/src/main.js',

      '/assets/loading.svg',
      '/assets/favicon.png',
      '/assets/icons/icon-192.png',
      '/assets/icons/icon-512.png',
    ])
  );
});


const cacheFirst = async (request, event) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  const responseFromNetwork = await fetch(request);
  return responseFromNetwork;
};

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request, event));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.registration?.navigationPreload.enable());
});
