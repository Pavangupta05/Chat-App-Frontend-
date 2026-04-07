// Service Worker for Chat Application
// Handles caching, offline support, and background sync

const CACHE_NAME = 'chat-app-v1';
const RUNTIME_CACHE = 'chat-app-runtime-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
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

// Activate event - clean up old caches
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

  // Cache first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    // Network first for dynamic content
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
