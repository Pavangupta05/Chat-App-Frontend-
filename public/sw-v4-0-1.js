/* eslint-disable no-unused-vars */
// Service Worker for Chat Application
// Handles caching, offline support, and background sync

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

const CACHE_NAME = 'chat-app-v4.0.0';
const RUNTIME_CACHE = 'chat-app-runtime-v4.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Cache static assets during install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Clean up old caches during activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls (let them go to network)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 1. Handle Navigation and Core Assets with Network First
  // This ensures the user gets the latest index.html (and latest JS/CSS hashes) if online.
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/manifest.json') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 2. Cache first for versioned static assets (JS, CSS, Images)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    // 3. Network first for everything else
    event.respondWith(networkFirst(request));
  }
});

// Cache first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response && response.status === 200) {
      try {
        cache.put(request, response.clone());
      } catch (cacheErr) {
        console.warn('Failed to cache response:', cacheErr);
      }
    }
    return response;
  } catch (err) {
    console.warn('Fetch failed in cacheFirst:', err);
    return new Response('Offline - Asset not cached', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    
    // Only cache successful responses with status 200
    if (response && response.status === 200) {
      try {
        cache.put(request, response.clone());
      } catch (cacheErr) {
        console.warn('Failed to cache response:', cacheErr);
      }
    }
    return response;
  } catch (err) {
    console.warn('Network request failed, falling back to cache:', err);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - Content not available', { status: 503 });
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i.test(pathname) ||
         pathname === '/' ||
         pathname === '/index.html' ||
         pathname === '/manifest.json';
}

// Handle background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      fetch('/api/sync', { method: 'POST' })
        .catch((err) => console.warn('Sync failed:', err))
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/manifest.json',
    badge: '/manifest.json',
    tag: data.tag || 'chat-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Message', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
