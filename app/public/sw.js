const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const SHELL = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];
// Hanya halaman pegawai ini yang disimpan agar aplikasi dapat dibuka saat offline.
const CACHEABLE_PAGES = ["/", "/riwayat"];
// Membuka halaman login berarti sesi berakhir/berganti pengguna: buang halaman tersimpan.
const SESSION_RESET_PATHS = ["/login", "/admin/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== STATIC && key !== PAGES) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstPage(request, pathname) {
  try {
    const response = await fetch(request);
    const sameUrl = new URL(response.url).pathname === pathname;
    if (
      response.ok &&
      !response.redirected &&
      sameUrl &&
      CACHEABLE_PAGES.includes(pathname)
    ) {
      const cache = await caches.open(PAGES);
      await cache.put(pathname, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(pathname, { cacheName: PAGES });
    return cached || (await caches.match("/offline.html"));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    if (SESSION_RESET_PATHS.includes(url.pathname)) {
      event.waitUntil(caches.delete(PAGES));
    }
    event.respondWith(networkFirstPage(request, url.pathname));
  }
});
