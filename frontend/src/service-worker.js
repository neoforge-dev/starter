// Add translations to cached assets
const TRANSLATIONS_CACHE = "translations-v1";
const SUPPORTED_LOCALES = ["en", "es", "fr", "de"];

// Cache translations during installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(TRANSLATIONS_CACHE).then((cache) => {
        return Promise.all(
          SUPPORTED_LOCALES.map((locale) =>
            fetch(`/assets/i18n/${locale}.json`)
              .then((response) => {
                if (!response.ok)
                  throw new Error(`Failed to fetch ${locale} translations`);
                return cache.put(`/assets/i18n/${locale}.json`, response);
              })
              .catch(console.error)
          )
        );
      }),
      // ... existing install logic
    ])
  );
});

// Handle translation requests
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/assets/i18n/")) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => response || fetch(event.request))
    );
    return;
  }

  // ... existing fetch logic
});
