// Service Worker for Al-Tibyan Quran App (مصحف التبيان الإلكتروني)
// Provides 100% Offline Capability, Cache-First Asset & Font Serving, Audio Caching, and Fallbacks

const STATIC_CACHE_NAME = "tibyan-offline-static-v2";
const AUDIO_CACHE_NAME = "tibyan-offline-audio-v2";
const DYNAMIC_CACHE_NAME = "tibyan-offline-dynamic-v2";

const CORE_STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/fonts/uthman-tn1-ver10.woff2",
  "/fonts/uthman-tn1-b-ver10.woff2",
  "/fonts/uthman-tn1-ver10.ttf",
  "/fonts/uthman-taha.woff2",
  "/fonts/uthman-taha.otf",
  "/fonts/QCF4_QBSML.woff2",
  "/fonts/QCF4_Hafs_01_W.woff2",
  "/fonts/amiri-regular.woff2",
  "/fonts/amiri-bold.woff2",
  "/fonts/cairo-arabic.woff2",
  "/fonts/cairo-variable.woff2",
  "/fonts/noto-naskh-arabic-regular.woff2",
  "/fonts/noto-naskh-arabic-bold.woff2",
  "/fonts/scheherazade-new-regular.woff2",
  "/fonts/scheherazade-new-bold.woff2",
  "/fonts/aref-ruqaa-regular.ttf",
  "/fonts/aref-ruqaa-bold.ttf",
  "/standalone-frame.svg",
  "/quran-soura-112.svg",
  "/IMG_1767.png",
  "/data/tafsir_muyassar.json",
  "/data/tafsir_sadi.json"
];

// Install: pre-cache core static assets and fonts
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      for (const asset of CORE_STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // Ignore individual asset failure during install
        }
      }
      return self.skipWaiting();
    })
  );
});

// Activate: clean old cache versions and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE_NAME, AUDIO_CACHE_NAME, DYNAMIC_CACHE_NAME].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET and WebSockets
  if (req.method !== "GET" || url.protocol.startsWith("ws")) {
    return;
  }

  // Bypass Vite internal dev URLs and non-audio backend API routes
  if (
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@fs") ||
    url.pathname.startsWith("/src/") ||
    (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/everyayah")) ||
    url.searchParams.has("t") ||
    url.searchParams.has("import")
  ) {
    return;
  }

  // 1. Audio recitations (.mp3): Cache-First / Cache on stream
  if (
    url.pathname.endsWith(".mp3") || 
    url.pathname.startsWith("/api/everyayah") ||
    req.destination === "audio" || 
    url.hostname.includes("everyayah.com") || 
    url.hostname.includes("mp3quran.net") || 
    url.hostname.includes("qurancdn.com")
  ) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        const cachedRes = await cache.match(req);
        if (cachedRes) {
          return cachedRes;
        }
        try {
          const networkRes = await fetch(req);
          if (networkRes && (networkRes.status === 200 || networkRes.status === 206)) {
            // Clone and store for offline listening (only on complete 200 responses)
            if (networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
          }
          return networkRes;
        } catch (err) {
          // Direct fallback if backend proxy cannot be reached
          if (url.pathname.startsWith("/api/everyayah/")) {
            const pathAfter = url.pathname.replace(/^\/api\/everyayah\/?/, "");
            const directUrl = `https://everyayah.com/data/${pathAfter}`;
            try {
              const directRes = await fetch(directUrl);
              if (directRes && (directRes.status === 200 || directRes.status === 206)) {
                if (directRes.status === 200) cache.put(req, directRes.clone());
                return directRes;
              }
            } catch (_) {}
          }
          return cachedRes || new Response("Audio offline", { status: 408, statusText: "Offline Audio" });
        }
      })
    );
    return;
  }

  // 2. Fonts & SVG assets: Cache-First
  if (
    url.pathname.startsWith("/fonts/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".otf") ||
    url.pathname.endsWith(".svg") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("fonts.googleapis.com") ||
    (url.hostname.includes("jsdelivr.net") && url.pathname.includes("font"))
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cachedRes = await cache.match(req);
        if (cachedRes) {
          return cachedRes;
        }
        try {
          const networkRes = await fetch(req);
          if (networkRes && networkRes.status === 200) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch (err) {
          return cachedRes || new Response("", { status: 408, statusText: "Offline Font" });
        }
      })
    );
    return;
  }

  // 3. App Shell, Vite assets & Scripts: Stale-While-Revalidate with Cache fallback
  event.respondWith(
    caches.open(DYNAMIC_CACHE_NAME).then(async (dynamicCache) => {
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      const cachedRes = (await staticCache.match(req)) || (await dynamicCache.match(req));

      try {
        const networkRes = await fetch(req);
        if (networkRes && networkRes.status === 200) {
          // Cache successful responses for origin and reliable CDNs
          if (
            url.origin === location.origin ||
            url.hostname.includes("jsdelivr.net") ||
            url.hostname.includes("unpkg.com") ||
            url.hostname.includes("fonts.googleapis.com")
          ) {
            dynamicCache.put(req, networkRes.clone());
          }
        }
        return networkRes;
      } catch (err) {
        if (cachedRes) {
          return cachedRes;
        }
        // If navigation fails, return cached index.html
        if (req.mode === "navigate") {
          const indexCached = (await staticCache.match("/index.html")) || (await staticCache.match("/"));
          if (indexCached) {
            return indexCached;
          }
        }
        return new Response("مصحف التبيان - غير متصل بالإنترنت", {
          status: 503,
          statusText: "Offline Mode Active",
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    })
  );
});
