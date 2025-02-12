importScripts("/src/utils/logger.js");

const CACHE_NAME = "neoforge-cache-v1";

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

self.addEventListener("install", (event) => {
  Logger.info("Service Worker installing...");
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(async (cache) => {
        Logger.debug("Caching core assets");
        await cache.addAll(CORE_ASSETS);
        Logger.info("Core assets cached successfully");
      }),
      self.skipWaiting(),
    ]).catch((error) => {
      Logger.error("Service Worker installation failed", error);
      throw error;
    })
  );
});

self.addEventListener("activate", (event) => {
  Logger.info("Service Worker activating...");
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              Logger.debug(`Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      }),
      self.clients.claim(),
    ]).catch((error) => {
      Logger.error("Service Worker activation failed", error);
      throw error;
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

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
        .catch(() => caches.match(event.request))
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
          })
      )
    );
  } else {
    // Network-first strategy for everything else
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});

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
