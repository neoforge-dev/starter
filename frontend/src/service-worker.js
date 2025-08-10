const CACHE_NAME = "neoforge-cache-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/assets/icons/favicon.ico",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
  "/vendor/lit-core.min.js",
  "/src/styles/base.css",
  "/src/components/core/error-boundary.js",
  "/src/components/core/loading-indicator.js",
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, network fallback for static assets
  cacheFirst: [
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
    /^\/assets\//,
    /^\/vendor\//,
  ],
  // Network first, cache fallback for API requests
  networkFirst: [/^\/api\//, /^\/graphql/],
  // Stale while revalidate for frequently updated content
  staleWhileRevalidate: [/^\/blog\//, /^\/docs\//],
};

// Install event - precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
      // Skip waiting to activate new service worker immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old cache versions
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      // Take control of all pages immediately
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle requests based on strategy
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Get the matching strategy based on URL
  const strategy = getStrategyForUrl(event.request.url);

  switch (strategy) {
    case "cacheFirst":
      event.respondWith(handleCacheFirst(event.request));
      break;
    case "networkFirst":
      event.respondWith(handleNetworkFirst(event.request));
      break;
    case "staleWhileRevalidate":
      event.respondWith(handleStaleWhileRevalidate(event.request));
      break;
    default:
      // Network only for everything else
      event.respondWith(fetch(event.request));
  }
});

// Helper function to determine caching strategy
function getStrategyForUrl(url) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some((pattern) => pattern.test(url))) {
      return strategy;
    }
  }
  return "networkOnly";
}

// Cache first strategy handler
async function handleCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    // If offline and resource not cached, return offline page for HTML requests
    if (request.headers.get("Accept").includes("text/html")) {
      return cache.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Network first strategy handler
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline page for HTML requests
    if (request.headers.get("Accept").includes("text/html")) {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Stale while revalidate strategy handler
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch((error) => {
      console.error("Network request failed:", error);
      return null;
    });

  return cached || networkPromise || caches.match(OFFLINE_URL);
}

// Handle messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// Sync offline form submissions
async function syncForms() {
  // Retrieve stored form submissions from IndexedDB
  // This function should sync offline forms with the server
  console.log("Syncing offline forms...");
  // TODO: Implement actual form sync logic
}

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-forms") {
    event.waitUntil(syncForms());
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/assets/icons/icon-192x192.png",
    badge: "/assets/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.notification.data.url) {
    event.waitUntil(self.clients.openWindow(event.notification.data.url));
  }
});
