const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/favicon.ico",
    "/css/style.css",
    "/icons/icon-144x144.png",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

const CACHE_NAME ="static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    if (e.request.url.includes('/api/')) {
        e.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(e.request)
                 .then(response => {
                    if (response.status == 200) {
                        cache.put(e.request.url, response.clone());
                    }

                    return response;
                 })
                 .catch(err => {
                     return cache.match(e.request);
                 });
            }).catch(err => console.log(err))
        );

        return;
    }

    e.respondWith(
        fetch(e.request).catch(function () {
            return caches.match(e.request).then(function
            (response) {
                if (response) {
                    return response;
                } else if (e.request.headers.get("accept").
                includes("text/html")) {
                    return caches.match("/");
                }
            });
        })
    );
});