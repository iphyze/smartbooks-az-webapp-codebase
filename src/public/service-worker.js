const CACHE_PREFIX = "smartbooks-pwa";
const CACHE_VERSION = "v3";
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const BASE_URL = new URL("./", self.location.href);

const appUrl = (path = "") => new URL(path, BASE_URL).toString();

const PRECACHE_URLS = [
  appUrl(),
  appUrl("offline.html"),
  appUrl("manifest.webmanifest"),
  appUrl("icons/icon-192.png"),
  appUrl("icons/icon-512.png"),
  appUrl("icons/icon-512-maskable.png"),
  appUrl("icons/apple-touch-icon.png"),
];

const cacheResponse = async (cache, key, response) => {
  if (!response || !response.ok || response.type !== "basic") return;

  const cacheControl = response.headers.get("Cache-Control") || "";
  if (/no-store|private/i.test(cacheControl)) return;

  await cache.put(key, response.clone());
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      // Cache each asset independently so one unavailable asset does not block
      // the PWA installation.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { credentials: "same-origin" });
            await cacheResponse(cache, url, response);
          } catch (_) {
            // The asset can be added to the runtime cache on a later request.
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith(`${CACHE_PREFIX}-`) &&
              cacheName !== STATIC_CACHE
          )
          .map((cacheName) => caches.delete(cacheName))
      );

      await self.clients.claim();
    })()
  );
});

const isApiOrSensitiveRequest = (request, url) => {
  const accept = request.headers.get("Accept") || "";

  return (
    url.pathname.includes("/api/") ||
    url.pathname.endsWith(".php") ||
    accept.includes("application/json") ||
    request.headers.has("Authorization") ||
    request.headers.has("Range")
  );
};

const isStaticAsset = (request, url) => {
  const basePath = BASE_URL.pathname.endsWith("/")
    ? BASE_URL.pathname
    : `${BASE_URL.pathname}/`;

  const relativePath = url.pathname.startsWith(basePath)
    ? url.pathname.slice(basePath.length)
    : url.pathname;

  return (
    ["script", "style", "font", "worker"].includes(request.destination) ||
    relativePath.startsWith("assets/") ||
    relativePath.startsWith("icons/") ||
    relativePath === "manifest.webmanifest" ||
    relativePath === "offline.html"
  );
};

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isApiOrSensitiveRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (_) {
          return (
            (await caches.match(appUrl())) ||
            (await caches.match(appUrl("offline.html"))) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  if (!isStaticAsset(request, url)) return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;

      const networkResponse = await fetch(request);
      const cache = await caches.open(STATIC_CACHE);
      await cacheResponse(cache, request, networkResponse);
      return networkResponse;
    })()
  );
});
