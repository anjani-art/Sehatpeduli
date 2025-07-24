const CACHE_NAME = 'sehatpeduli-cache-v1.0.0'; // Update version when changes occur
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/favicon.png',          // Ensure this file exists in root
    '/apple-touch-icon.png', // Ensure this file exists in root
    '/icon-192x192.png',     // Ensure this file exists in root
    '/icon-512x512.png'      // Ensure this file exists in root
    // Add any other static assets here that you want to be available offline
    // e.g., '/images/first-aid-wound.png' if you add them to the root
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // If not in cache, try to fetch from network
                return fetch(event.request).then(
                    response => {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We must clone it so that
                        // the browser can consume one and we can consume the other.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
