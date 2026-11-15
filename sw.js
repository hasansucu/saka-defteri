// Saka Defteri Service Worker (Offline PWA + Otomatik Sürüm Güncelleme - /saka-defteri/)
const CACHE_VERSION = 'v6';
const CACHE_NAME = 'saka-defteri-cache-' + CACHE_VERSION;
const APP_SHELL_FALLBACK = '/saka-defteri/index.html';

const LOCAL_ASSETS = [
  '/saka-defteri/',
  '/saka-defteri/index.html',
  '/saka-defteri/manifest.json',
  '/saka-defteri/icon.svg',
  '/saka-defteri/ikon.svg',
  '/saka-defteri/pwa-192x192.png',
  '/saka-defteri/pwa-512x512.png',
  '/saka-defteri/pwa-maskable-512x512.png',
  '/saka-defteri/apple-touch-icon.png'
];

const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        LOCAL_ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res && res.ok) {
              await cache.put(url, res);
            }
          } catch (err) {
            console.warn('Yerel dosya önbelleğe alınamadı:', url, err);
          }
        })
      );
      await Promise.allSettled(
        CDN_ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { mode: 'cors' });
            if (res && (res.ok || res.type === 'opaque')) {
              await cache.put(url, res);
            }
          } catch (corsErr) {
            try {
              const opaqueRes = await fetch(url, { mode: 'no-cors' });
              if (opaqueRes) {
                await cache.put(url, opaqueRes);
              }
            } catch (err) {
              console.warn('CDN varlığı önbelleğe alınamadı:', url, err);
            }
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com')
  ) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request.url, { cache: 'no-cache', redirect: 'follow' })
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToReturn = networkResponse.redirected
              ? new Response(await networkResponse.clone().arrayBuffer(), {
                  status: networkResponse.status,
                  statusText: networkResponse.statusText,
                  headers: networkResponse.headers
                })
              : networkResponse;
            const cache = await caches.open(CACHE_NAME);
            await cache.put(APP_SHELL_FALLBACK, responseToReturn.clone());
            await cache.put('/saka-defteri/', responseToReturn.clone());
            return responseToReturn;
          }
          return networkResponse;
        })
        .catch(async () => {
          return (
            (await caches.match(event.request, { ignoreSearch: true })) ||
            (await caches.match(APP_SHELL_FALLBACK)) ||
            (await caches.match('/saka-defteri/')) ||
            (await caches.match('./index.html'))
          );
        })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request, { ignoreSearch: true });
        const networkFetch = fetch(event.request.url, { cache: 'no-cache' })
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        if (cachedResponse) {
          event.waitUntil(networkFetch);
          return cachedResponse;
        }
        const netRes = await networkFetch;
        return netRes || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || (!networkResponse.ok && networkResponse.type !== 'opaque')) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
