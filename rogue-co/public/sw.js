// Offline support: the app shell is cached on install, and pages keep working without a connection.
// Bump CACHE whenever you deploy changes so returning visitors get the new files.
const CACHE = "rogueco-v1";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "assets/css/styles.css",
  "assets/js/app.js",
  "assets/js/art.js",
  "assets/js/products.js",
  "assets/js/store.js",
  "assets/js/theme-boot.js",
  "assets/img/icon.svg",
  "assets/img/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Pages: try the network first so a deploy shows up right away, and fall back to the cached shell.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("index.html")));
    return;
  }

  // Assets and fonts: serve from cache instantly and refresh the cache in the background.
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
