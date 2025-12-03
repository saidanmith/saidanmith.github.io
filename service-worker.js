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
    '/service-worker.js'
];

// External CDN resources (cached separately with better error handling)
// Note: Tailwind CDN is dynamic and cannot be cached - it must always fetch fresh
const externalResources = [
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
];

// Resources that should bypass service worker (dynamic CDNs)
const bypassResources = [
    'https://cdn.tailwindcss.com'
];

// Install event: Caching essential files
self.addEventListener('install', event => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell');
                // Cache local files first (these should always work)
                return cache.addAll(urlsToCache)
                    .then(() => {
                        // Cache external resources with better error handling
                        // Use cache.add() individually so one failure doesn't break everything
                        return Promise.allSettled(
                            externalResources.map(url => 
                                cache.add(url).catch(err => {
                                    console.warn(`Service Worker: Failed to cache ${url}:`, err);
                                    // Return a placeholder or continue
                                    return null;
                                })
                            )
                        );
                    });
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache resources', error);
                // Don't fail installation if caching fails - app can still work
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

// Fetch event: Network first, fallback to cache (for updates + offline support)
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip resources that should bypass service worker (like dynamic Tailwind CDN)
    const shouldBypass = bypassResources.some(bypassUrl => event.request.url.startsWith(bypassUrl));
    if (shouldBypass) {
        return; // Let the browser handle it normally
    }

    // Skip cross-origin requests that we can't cache (like API calls)
    // But allow CDN resources we've cached
    const url = new URL(event.request.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isCachedCDN = externalResources.some(cdnUrl => event.request.url.startsWith(cdnUrl));

    event.respondWith(
        fetch(event.request, { 
            // Add cache mode to help with offline detection
            cache: 'no-cache'
        })
            .then(networkResponse => {
                // Check if we received a valid response
                if (networkResponse && networkResponse.status === 200) {
                    // Clone the response for caching
                    const responseToCache = networkResponse.clone();

                    // Update cache in background (only for same-origin or cached CDN)
                    if (isSameOrigin || isCachedCDN) {
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Only cache successful responses
                                if (networkResponse.status === 200) {
                                    cache.put(event.request, responseToCache).catch(err => {
                                        console.warn('Service Worker: Failed to cache response:', err);
                                    });
                                }
                            });
                    }

                    return networkResponse;
                }
                // If response is not OK, try cache
                throw new Error('Network response not OK');
            })
            .catch(error => {
                // Network failed, try cache
                console.log('Service Worker: Network failed, trying cache for:', event.request.url);
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // For navigation requests (page loads), try to return index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html')
                                .then(indexResponse => {
                                    if (indexResponse) {
                                        return indexResponse;
                                    }
                                    // Last resort: return a basic offline message
                                    return new Response(
                                        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
                                        { 
                                            headers: { 'Content-Type': 'text/html' },
                                            status: 200
                                        }
                                    );
                                });
                        }
                        
                        // For other requests, return a 503 error
                        return new Response('Network request failed and no cache available.', { 
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});