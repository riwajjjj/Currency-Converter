/* Tender · service worker — makes the app installable and usable offline.
 * Strategy:
 *  - App files (html/css/js/icons): served from cache instantly, refreshed in the background.
 *  - Page navigations: network first (so updates arrive), cached copy when offline.
 *  - Fonts & flag images: cache first (they never change).
 *  - Dated rate snapshots (used by charts & past-date mode): cache first (history never changes).
 *  - Latest / real-time rates: always network — the app keeps its own saved copy for offline.
 */
const VERSION = 'tender-v3';
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const HISTORY = `${VERSION}-history`;
const SHELL_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];
const MAX_STATIC = 400;
const MAX_HISTORY = 300;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && (res.ok || res.type === 'opaque')) {
    cache.put(request, res.clone()).then(() => trim(cacheName, max)).catch(() => {});
  }
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((res) => { if (res && res.ok) cache.put(request, res.clone()).catch(() => {}); return res; })
    .catch(() => null);
  return hit || (await network) || new Response('', { status: 504, statusText: 'Offline' });
}

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put('./index.html', res.clone()).catch(() => {});
    return res;
  } catch {
    return (await cache.match('./index.html')) || (await cache.match('./')) ||
      new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}

const isDatedSnapshot = (url) =>
  (url.hostname === 'cdn.jsdelivr.net' && /@fawazahmed0\/currency-api@\d{4}-\d{2}-\d{2}\//.test(url.pathname)) ||
  /^\d{4}-\d{2}-\d{2}\.currency-api\.pages\.dev$/.test(url.hostname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') { event.respondWith(networkFirstPage(request)); return; }
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'flagcdn.com') {
    event.respondWith(cacheFirst(request, STATIC, MAX_STATIC));
    return;
  }
  if (isDatedSnapshot(url)) {
    event.respondWith(cacheFirst(request, HISTORY, MAX_HISTORY));
  }
  // everything else (latest & real-time rates) goes straight to the network
});
