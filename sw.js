// Einfacher Service Worker: App-Shell + Bilder werden fuer Offline-/PWA-Nutzung
// zwischengespeichert. Neue Galerie-Bilder werden beim ersten Aufruf automatisch
// mit-gecacht (runtime cache), ohne dass diese Datei angepasst werden muss.

const CACHE_VERSION = "v1";
const CACHE_NAME = `puzzle-spass-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/gallery-data.js",
  "./js/puzzle-engine.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/full/beach.jpg",
  "./images/full/flower_meadow.jpg",
  "./images/full/flower_roses.jpg",
  "./images/full/flower_sunflowers.jpg",
  "./images/full/flower_tulips.jpg",
  "./images/full/guinea_pig.jpg",
  "./images/full/kitten.jpg",
  "./images/full/mountains.jpg",
  "./images/full/rabbit.jpg",
  "./images/full/sunset.jpg",
  "./images/thumb/beach.jpg",
  "./images/thumb/flower_meadow.jpg",
  "./images/thumb/flower_roses.jpg",
  "./images/thumb/flower_sunflowers.jpg",
  "./images/thumb/flower_tulips.jpg",
  "./images/thumb/guinea_pig.jpg",
  "./images/thumb/kitten.jpg",
  "./images/thumb/mountains.jpg",
  "./images/thumb/rabbit.jpg",
  "./images/thumb/sunset.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
