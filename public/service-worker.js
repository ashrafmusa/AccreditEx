const CACHE_NAME = 'accreditex-cache-v4';

// Static assets to pre-cache during install
const STATIC_CACHE = [
  '/manifest.json',
  '/index.html',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE);
      })
  );
  self.skipWaiting();
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Let browser handle cross-origin requests directly (avoids CSP-related SW errors)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests (POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // Network-first for HTML pages (always get fresh CSP and content)
  if (request.destination === 'document' || 
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh HTML for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/index.html') || Response.error();
        })
    );
    return;
  }

  // Stale-while-revalidate for JS bundles (serve cached, update in background)
  if (request.destination === 'script' || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse.clone()));
          return networkResponse;
        }).catch(() => cachedResponse || Response.error());
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cache-first for CSS, images, fonts (static assets — rarely change)
  if (request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff')) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          }).catch(() => Response.error());
        })
    );
    return;
  }

  // Cache-first for JSON data files (standards, templates — semi-static)
  if (url.pathname.endsWith('.json') && !url.pathname.includes('api')) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            // Background revalidate
            fetch(request).then(freshResponse => {
              caches.open(CACHE_NAME).then(cache => cache.put(request, freshResponse));
            }).catch(() => {});
            return response;
          }
          return fetch(request).then(fetchResponse => {
            caches.open(CACHE_NAME).then(cache => cache.put(request, fetchResponse.clone()));
            return fetchResponse;
          }).catch(() => Response.error());
        })
    );
    return;
  }

  // Network-only for everything else (API calls, etc)
  event.respondWith(fetch(request).catch(() => Response.error()));
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});