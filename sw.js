// Minimal service worker - exists mainly so Chrome treats PK Golf as a fully installable PWA
// (Chrome's automatic "Install app" prompt weighs whether a fetch-handling service worker is
// registered). Also gives the app shell basic offline tolerance for weak signal on a course.
//
// Network-first for the app shell: a fresh deploy always wins when online, and the cached copy
// is only a fallback when there's no connection. Everything else (Firestore, auth, any other
// request) is left completely alone - never cached, never intercepted.
const CACHE_NAME = "pk-golf-shell-v1";
const SHELL_URLS = [
  "/golf",
  "/golf/",
  "/golf/manifest.json",
  "/golf/icon-192.png?v=3",
  "/golf/icon-512.png?v=3",
  "/golf/icon-header.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(SHELL_URLS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isShellAsset = event.request.mode === "navigate" || SHELL_URLS.includes(url.pathname) || SHELL_URLS.includes(url.pathname + url.search);
  if (!isShellAsset) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/golf/")))
  );
});
