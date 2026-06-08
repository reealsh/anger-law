const CACHE = "anger-law-cache-v1";
const FILES = ["./", "./index.html", "./style.css", "./app.js", "./background.jpeg", "./manifest.json"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener("fetch", e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
