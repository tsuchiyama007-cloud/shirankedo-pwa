/*
 * 知らんけど（PWA版）の Service Worker。
 * - 一度開いたら、電波がなくても起動できるようにファイルをキャッシュする
 * - ページ本体（index.html）は「ネット優先」：更新があればすぐ反映。つながらないときはキャッシュを使う
 * - JavaScript などの部品（_expo/static/ 以下）はファイル名に版が入っているので「キャッシュ優先」
 * セーブデータはブラウザの保存領域（localStorage）にあり、このキャッシュとは別物。キャッシュを消してもデータは消えない。
 */
const CACHE = 'shirankedo-v1';
const BASE = new URL('./', self.location).pathname;
const PRECACHE = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((p) => new URL(p, self.location).toString())))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shirankedo-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(BASE, response.clone());
    return response;
  } catch {
    return (await cache.match(BASE)) || (await cache.match(request)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
