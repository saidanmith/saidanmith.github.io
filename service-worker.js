// ========================================
// CACHE VERSION - UPDATE ON EACH DEPLOYMENT
// ========================================
// Update BUILD_DATE to today's date (YYYYMMDD format) when deploying
// Example: If deploying on Dec 3, 2025, use '20251203'
// This forces the service worker to create a new cache and update users
// ========================================
const BUILD_DATE = '20251203'; // ← Change this to today's date (YYYYMMDD) when deploying
const CACHE_NAME = `gym-tracker-cache-${BUILD_DATE}`;
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // External dependencies
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Install event: Caching essential files
self.addEventListener('install', event => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache resources', error);
            })
    );
});

// Activate event: Cleaning up old caches
self.addEventListener('activate', event => {
    // Take control of all pages immediately
    event.waitUntil(
        Promise.all([
            // Delete old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Claim all clients immediately
            self.clients.claim()
        ])
    );
});

// Fetch event: Network first, fallback to cache (for updates)
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Clone the response for caching
                const responseToCache = networkResponse.clone();

                // Update cache in background
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return networkResponse;
            })
            .catch(error => {
                // Network failed, try cache
                console.log('Service Worker: Network failed, trying cache', error);
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // No cache available
                        return new Response('Network request failed and no cache available.', { 
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});