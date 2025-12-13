const CACHE_NAME = "dfl-pwa-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",

  // Ajuste conforme existir no seu projeto:
  "/css/dashboard-motoboy.css",
  "/img/logo-dfl.png"
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
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Estratégia: HTML sempre “network first”, assets “cache first”
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // só GET
  if (req.method !== "GET") return;

  // HTML (navegação): tenta internet primeiro
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Outros arquivos: cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});