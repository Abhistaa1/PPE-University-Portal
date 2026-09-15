const CACHE_NAME = "ppe-v6";

const APP_SHELL = [
    "./",
    "./index.html",
    "./app.js",
    "./styles.css",
    "./manifest.json",
    "./data/syllabus.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Let YouTube and other external sites load normally.
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200) {
                    return response;
                }

                const copy = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, copy);
                });

                return response;
            });
        })
    );
});
