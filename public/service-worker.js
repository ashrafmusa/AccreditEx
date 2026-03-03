const CACHE_NAME = 'accreditex-v1';

// Install: skip waiting, don't pre-cache anything
self.addEventListener('install', event => {
  console.log('Service Worker: Installing');
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => {
          console.log('Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first strategy - simple and reliable
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network-first for everything: try network, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses (status 200)
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseClone))
            .catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        try {
          const cached = await caches.match(request);
          if (cached) return cached;
          
          // If specific page not in cache, try index.html for offline fallback
          if (request.destination === 'document') {
            return await caches.match('/index.html') || 
                   new Response('Offline', { status: 503 });
          }
          
          return new Response('Network error', { status: 503 });
        } catch (e) {
          return new Response('Network error', { status: 503 });
        }
      })
  );
});
