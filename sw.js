// Einfacher Service Worker: App-Shell + Bilder werden fuer Offline-/PWA-Nutzung
// zwischengespeichert. Neue Galerie-Bilder werden beim ersten Aufruf automatisch
// mit-gecacht (runtime cache), ohne dass diese Datei angepasst werden muss.

const CACHE_VERSION = "v12";
const CACHE_NAME = `puzzle-spass-${CACHE_VERSION}`;

// App-Shell-Dateien aendern sich beim Entwickeln haeufig -> immer zuerst das
// Netzwerk versuchen, damit Updates sofort ankommen (Cache nur als Offline-Fallback).
const NETWORK_FIRST_EXT = [".html", ".css", ".js"];

function isNetworkFirst(url) {
  return NETWORK_FIRST_EXT.some((ext) => url.pathname.endsWith(ext)) || url.pathname.endsWith("/");
}

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
  "./icons/apple-touch-icon.png",
  "./images/full/tiere/guinea_pig.jpg",
  "./images/full/tiere/rabbit.jpg",
  "./images/full/tiere/kitten.jpg",
  "./images/full/tiere/fox.jpg",
  "./images/full/tiere/owl.jpg",
  "./images/full/tiere/horse.jpg",
  "./images/full/tiere/panda.jpg",
  "./images/full/landschaft/sunset.jpg",
  "./images/full/landschaft/beach.jpg",
  "./images/full/landschaft/mountains.jpg",
  "./images/full/landschaft/autumn_forest.jpg",
  "./images/full/landschaft/waterfall.jpg",
  "./images/full/landschaft/desert.jpg",
  "./images/full/landschaft/aurora.jpg",
  "./images/full/blumen/flower_tulips.jpg",
  "./images/full/blumen/flower_sunflowers.jpg",
  "./images/full/blumen/flower_roses.jpg",
  "./images/full/blumen/flower_meadow.jpg",
  "./images/full/blumen/flower_lavender.jpg",
  "./images/full/blumen/flower_cherry_blossom.jpg",
  "./images/full/staedte-bei-nacht/city_skyline_night.jpg",
  "./images/full/staedte-bei-nacht/city_street_neon.jpg",
  "./images/full/staedte-bei-nacht/city_bridge_night.jpg",
  "./images/full/weltraum/space_nebula.jpg",
  "./images/full/weltraum/space_planets.jpg",
  "./images/full/weltraum/space_moon.jpg",
  "./images/full/unterwasserwelt/underwater_reef.jpg",
  "./images/full/unterwasserwelt/underwater_whale.jpg",
  "./images/full/winter/winter_forest.jpg",
  "./images/full/winter/winter_village.jpg",
  "./images/thumb/tiere/guinea_pig.jpg",
  "./images/thumb/tiere/rabbit.jpg",
  "./images/thumb/tiere/kitten.jpg",
  "./images/thumb/tiere/fox.jpg",
  "./images/thumb/tiere/owl.jpg",
  "./images/thumb/tiere/horse.jpg",
  "./images/thumb/tiere/panda.jpg",
  "./images/thumb/landschaft/sunset.jpg",
  "./images/thumb/landschaft/beach.jpg",
  "./images/thumb/landschaft/mountains.jpg",
  "./images/thumb/landschaft/autumn_forest.jpg",
  "./images/thumb/landschaft/waterfall.jpg",
  "./images/thumb/landschaft/desert.jpg",
  "./images/thumb/landschaft/aurora.jpg",
  "./images/thumb/blumen/flower_tulips.jpg",
  "./images/thumb/blumen/flower_sunflowers.jpg",
  "./images/thumb/blumen/flower_roses.jpg",
  "./images/thumb/blumen/flower_meadow.jpg",
  "./images/thumb/blumen/flower_lavender.jpg",
  "./images/thumb/blumen/flower_cherry_blossom.jpg",
  "./images/thumb/staedte-bei-nacht/city_skyline_night.jpg",
  "./images/thumb/staedte-bei-nacht/city_street_neon.jpg",
  "./images/thumb/staedte-bei-nacht/city_bridge_night.jpg",
  "./images/thumb/weltraum/space_nebula.jpg",
  "./images/thumb/weltraum/space_planets.jpg",
  "./images/thumb/weltraum/space_moon.jpg",
  "./images/thumb/unterwasserwelt/underwater_reef.jpg",
  "./images/thumb/unterwasserwelt/underwater_whale.jpg",
  "./images/thumb/winter/winter_forest.jpg",
  "./images/thumb/winter/winter_village.jpg",
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

function cachePut(req, res) {
  if (res && res.status === 200 && res.type === "basic") {
    const clone = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (isNetworkFirst(url)) {
    // Network-first: App-Code/HTML immer aktuell. cache:"no-store" umgeht
    // zusaetzlich den normalen HTTP-Browser-Cache (nicht nur den SW-Cache),
    // sonst koennte trotz "network-first" eine veraltete, aber laut
    // Cache-Control noch "frische" Antwort aus dem HTTP-Cache kommen.
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then((res) => { cachePut(req, res); return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first: Bilder/Icons aendern sich kaum, schneller aus dem Cache laden.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => { cachePut(req, res); return res; })
        .catch(() => cached);
    })
  );
});
