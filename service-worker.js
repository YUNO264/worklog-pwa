const CACHE_NAME = "worklog-cache-v4";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


// インストール時
self.addEventListener("install", function(event) {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(function(cache) {

                return cache.addAll(FILES_TO_CACHE);

            })

    );

});


// 有効化時
self.addEventListener("activate", function(event) {

    event.waitUntil(

        caches.keys()

            .then(function(cacheNames) {

                return Promise.all(

                    cacheNames.map(function(cacheName) {

                        if (cacheName !== CACHE_NAME) {

                            return caches.delete(cacheName);

                        }

                    })

                );

            })

    );

});


// 通信時
self.addEventListener("fetch", function(event) {

    event.respondWith(

        caches.match(event.request)

            .then(function(cachedResponse) {

                if (cachedResponse) {

                    return cachedResponse;

                }

                return fetch(event.request);

            })

    );

});