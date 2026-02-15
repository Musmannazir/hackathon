/* ========================================
   دوا پہچان - Service Worker
   Cache-first for static, network-first for API
   ======================================== */

const CACHE_NAME = 'dawa-pahchan-v1';
const STATIC_ASSETS = [
  '/',
  '/static/style.css',
  '/static/app.js',
  '/static/icon.svg',
  '/static/icon-maskable.svg',
  '/manifest.json'
];

// ========================================
// Install: Pre-cache static assets
// ========================================
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

// ========================================
// Activate: Clean old caches
// ========================================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// ========================================
// Fetch: Strategy per request type
// ========================================
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // API calls: Network only (with offline fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(function () {
          return new Response(
            JSON.stringify({
              not_medicine: true,
              error_message_urdu: 'انٹرنیٹ کنکشن نہیں ہے۔ انٹرنیٹ آنے کے بعد دوبارہ کوشش کریں۔'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Google Fonts: Cache first, then network
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request)
        .then(function (cached) {
          if (cached) return cached;
          return fetch(event.request).then(function (response) {
            if (response.ok) {
              var clone = response.clone();
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, clone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Static assets: Cache first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(function (cached) {
        if (cached) return cached;

        return fetch(event.request).then(function (response) {
          // Cache successful responses for static files
          if (response.ok && event.request.method === 'GET') {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
      .catch(function () {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});
