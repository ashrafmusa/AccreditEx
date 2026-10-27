const CACHE_NAME = 'accreditex-cache-v5';
const MANIFEST_PATHS = new Set(['/manifest.json', '/site.webmanifest']);

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

// Fetch: Network-first strategy with content-type validation to prevent SPA fallback cache poisoning
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

  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  const isManifest = MANIFEST_PATHS.has(url.pathname) || request.destination === 'manifest';

  // Network-first for everything: try network, fallback to cache
  event.respondWith(
    fetch(request, isNavigation || isManifest ? { cache: 'no-cache' } : {})
      .then(response => {
        if (response && response.status === 200) {
          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          // Guard against caching SPA HTML fallback for non-document assets (JS, CSS, JSON, manifest, images)
          const isUnexpectedHtmlFallback = !isNavigation && contentType.includes('text/html');

          if (!isUnexpectedHtmlFallback) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseClone))
              .catch(() => {});
          }
        }
        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        try {
          const cached = await caches.match(request);
          if (cached) {
            const cachedType = (cached.headers.get('content-type') || '').toLowerCase();
            if (!isNavigation && cachedType.includes('text/html')) {
              await caches.open(CACHE_NAME).then(cache => cache.delete(request)).catch(() => {});
            } else {
              return cached;
            }
          }

          // If specific page not in cache, try index.html for offline fallback
          if (isNavigation) {
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
