const CACHE_NAME = "neoforge-cache-v2";
const DATA_CACHE_NAME = "neoforge-data-v1";
const OFFLINE_URL = "/offline.html";

// Core assets that should be cached immediately
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/src/main.js",
  "/src/styles/global.css",
  "/src/styles/loading.css",
  "/src/components/core/app-shell.js",
  "/src/components/core/app-header.js",
  "/src/components/core/app-footer.js",
  "/vendor/lit-core.min.js",
  "/src/utils/logger.js",
  "/manifest.webmanifest",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
  OFFLINE_URL,
];

// Dynamic routes that should use network-first strategy
const DYNAMIC_ROUTES = [
  "/src/pages/",
  "/src/components/auth/",
  "/src/components/ui/",
  "/api/", // For API calls
  "/docs/",
];

// Static assets that should use cache-first strategy
const STATIC_ROUTES = ["/src/styles/", "/src/utils/", "/assets/", "/vendor/"];

// Simple logger for service worker
function log(level, message, data) {
  console.log(`[SW ${level.toUpperCase()}] ${message}`, data || '');
}

self.addEventListener("install", (event) => {
  log('info', "Service Worker installing...");
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(async (cache) => {
        log('debug', "Caching core assets");
        await cache.addAll(CORE_ASSETS);
        log('info', "Core assets cached successfully");
      }),
      self.skipWaiting(),
    ]).catch((error) => {
      log('error', "Service Worker installation failed", error);
      throw error;
    })
  );
});

self.addEventListener("activate", (event) => {
  log('info', "Service Worker activating...");
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
            .map((name) => {
              log('debug', `Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      }),
      self.clients.claim(),
    ]).catch((error) => {
      log('error', "Service Worker activation failed", error);
      throw error;
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle API requests with data caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Handle different caching strategies based on the request URL
  if (DYNAMIC_ROUTES.some((route) => url.pathname.startsWith(route))) {
    // Network-first strategy for dynamic routes
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clonedResponse));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request) || caches.match(OFFLINE_URL);
        })
    );
  } else if (STATIC_ROUTES.some((route) => url.pathname.startsWith(route))) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then(
        (response) =>
          response ||
          fetch(event.request).then((fetchResponse) => {
            const clonedResponse = fetchResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clonedResponse));
            return fetchResponse;
          }).catch(() => caches.match(OFFLINE_URL))
      )
    );
  } else {
    // Network-first strategy for everything else with offline fallback
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request) || caches.match(OFFLINE_URL);
      })
    );
  }
});

// Handle API requests with caching and offline support
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful GET requests
      if (request.method === 'GET') {
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }
    
    // If response not ok, try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        log('info', `Serving cached API response for ${url.pathname}`);
        return cachedResponse;
      }
    }
    
    return response;
  } catch (error) {
    log('warn', `Network request failed for ${url.pathname}`, error.message);
    
    // For GET requests, try to serve from cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        log('info', `Serving cached API response for ${url.pathname}`);
        return cachedResponse;
      }
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'This feature requires internet connection',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("NeoForge Update", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineActions());
  }
});

// Process actions that were queued while offline
async function processOfflineActions() {
  try {
    // Open IndexedDB to get queued actions
    const db = await openDatabase();
    const tx = db.transaction(['offline_actions'], 'readonly');
    const store = tx.objectStore('offline_actions');
    const actions = await getAllFromStore(store);
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          // Remove successful action from queue
          await removeFromOfflineQueue(action.id);
          log('info', `Successfully synced offline action: ${action.id}`);
        }
      } catch (error) {
        log('warn', `Failed to sync offline action: ${action.id}`, error.message);
      }
    }
  } catch (error) {
    log('error', 'Failed to process offline actions', error);
  }
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('neoforge-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_actions')) {
        const store = db.createObjectStore('offline_actions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromOfflineQueue(actionId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
      const tx = db.transaction(['offline_actions'], 'readwrite');
      const store = tx.objectStore('offline_actions');
      const request = store.delete(actionId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'skipWaiting':
        self.skipWaiting();
        break;
      case 'queueOfflineAction':
        queueOfflineAction(event.data.action);
        break;
    }
  }
});

// Queue an action to be performed when back online
async function queueOfflineAction(action) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['offline_actions'], 'readwrite');
    const store = tx.objectStore('offline_actions');
    
    const actionWithId = {
      ...action,
      id: Date.now() + Math.random(),
      timestamp: Date.now()
    };
    
    await store.add(actionWithId);
    log('info', `Queued offline action: ${actionWithId.id}`);
  } catch (error) {
    log('error', 'Failed to queue offline action', error);
  }
}
