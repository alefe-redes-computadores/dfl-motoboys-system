const CACHE_NAME = "dfl-pwa-v2";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",

  // CSS
  "/css/dashboard-motoboy.css",
  "/css/dashboard-admin.css",
  "/css/style.css",

  // JS (apenas locais)
  "/js/auth.js",
  "/js/dashboard.js",
  "/js/dashboard-admin.js",

  // Imagens
  "/img/logo-dfl.png",
  "/img/icons/icon-192x192.png",
  "/img/icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

// Estratégia:
// - HTML: network first
// - Assets locais: cache first
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  // Navegação (HTML)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Firebase e externos → sempre network
  if (req.url.includes("firebase") || req.url.startsWith("https://")) {
    return;
  }

  // Assets locais
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});