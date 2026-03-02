const CACHE_NAME = 'accreditex-cache-v5';

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
        return cache.addAll(STATIC_CACHE).catch(() => {
          console.log('Service Worker: Some static assets could not be cached');
        });
      })
      .catch(err => console.error('Service Worker install error:', err))
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
          // Cache successful responses
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              // Clone before caching to avoid consuming response
              const responseToCache = response.clone();
              cache.put(request, responseToCache)
                .catch(err => console.error('Cache.put error:', err));
            }).catch(err => console.error('Caches.open error:', err));
          }
          return response;
        })
        .catch(async () => {
          // Serve from cache on network failure
          try {
            const cached = await caches.match(request);
            return cached || caches.match('/index.html') || Response.error();
          } catch (err) {
            console.error('Cache match error:', err);
            return Response.error();
          }
        })
    );
    return;
  }

  // Cache-first for JS bundles with background update
  if (request.destination === 'script' || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          // Always serve from cache if available
          if (cachedResponse) {
            // Update cache in background (fire and forget)
            fetch(request)
              .then(freshResponse => {
                // Only cache successful responses
                if (freshResponse && freshResponse.status === 200) {
                  caches.open(CACHE_NAME).then(cache => {
                    // Clone before caching to avoid consuming the response
                    const responseToCache = freshResponse.clone();
                    cache.put(request, responseToCache)
                      .catch(err => console.error('Cache.put error:', err));
                  }).catch(err => console.error('Caches.open error:', err));
                }
              })
              .catch(() => {
                // Silently fail on network error during background update
              });
            return cachedResponse;
          }

          // No cache, fetch from network
          return fetch(request)
            .then(networkResponse => {
              // Clone before caching
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  const responseToCache = networkResponse.clone();
                  cache.put(request, responseToCache)
                    .catch(err => console.error('Cache.put error:', err));
                }).catch(err => console.error('Caches.open error:', err));
              }
              return networkResponse;
            })
            .catch(err => {
              console.error('Fetch error:', err);
              return Response.error();
            });
        })
        .catch(err => {
          console.error('Cache match error:', err);
          return Response.error();
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
          return fetch(request)
            .then(fetchResponse => {
              if (fetchResponse && fetchResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  // Clone before caching to avoid consuming response
                  const responseToCache = fetchResponse.clone();
                  cache.put(request, responseToCache)
                    .catch(err => console.error('Cache.put error:', err));
                }).catch(err => console.error('Caches.open error:', err));
              }
              return fetchResponse;
            })
            .catch(err => {
              console.error('Fetch error:', err);
              return Response.error();
            });
        })
        .catch(err => {
          console.error('Cache match error:', err);
          return Response.error();
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
            // Background revalidate (fire and forget)
            fetch(request)
              .then(freshResponse => {
                if (freshResponse && freshResponse.status === 200) {
                  caches.open(CACHE_NAME).then(cache => {
                    const responseToCache = freshResponse.clone();
                    cache.put(request, responseToCache)
                      .catch(err => console.error('Cache.put error:', err));
                  }).catch(err => console.error('Caches.open error:', err));
                }
              })
              .catch(() => {
                // Silently fail on network error during background update
              });
            return response;
          }

          // No cache, fetch from network
          return fetch(request)
            .then(fetchResponse => {
              if (fetchResponse && fetchResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  const responseToCache = fetchResponse.clone();
                  cache.put(request, responseToCache)
                    .catch(err => console.error('Cache.put error:', err));
                }).catch(err => console.error('Caches.open error:', err));
              }
              return fetchResponse;
            })
            .catch(err => {
              console.error('Fetch error:', err);
              return Response.error();
            });
        })
        .catch(err => {
          console.error('Cache match error:', err);
          return Response.error();
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
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName).catch(err => console.error('Cache delete error:', err));
          }
        })
      );
    }).catch(err => console.error('Activate error:', err))
  );
  self.clients.claim();
});