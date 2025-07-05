const CACHE_NAME = 'nomnom-meme-editor-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo-nav.png',
  // Cache some essential preset images
  '/presets/general/3.png',
  '/presets/general/4.png',
  '/presets/general/5.png',
  '/presets/cartoon/0.png',
  '/presets/cartoon/1.png',
  '/presets/cartoon/2.png',
  // External CDN resources
  'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Gaegu&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Important: Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Important: Clone the response
          const responseToCache = response.clone();

          // Add to cache for future requests
          caches.open(CACHE_NAME)
            .then(cache => {
              // Only cache GET requests
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(() => {
          // Network failed, try to serve offline fallback
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }

          // For images, return a placeholder if available
          if (event.request.destination === 'image') {
            return caches.match('/favicon.ico');
          }
        });
      })
  );
});

// Background sync for uploading images when online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync tasks
  return Promise.resolve();
}

// Handle push notifications (for future enhancement)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New meme editor update available!',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  event.waitUntil(
    self.registration.showNotification('Nomnom Meme Editor', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (for updates)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(updateContent());
  }
});

function updateContent() {
  // Check for updates to preset images or other content
  return Promise.resolve();
}