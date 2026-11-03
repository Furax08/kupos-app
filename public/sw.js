/* eslint-disable no-restricted-globals */
/**
 * Mi Tienda SaaS - Offline-First POS Service Worker (v2 Optimized)
 *
 * Full offline caching architecture with dedicated cache buckets:
 *  1. APP_SHELL_CACHE: HTML navigation shell, manifest, and PWA icons.
 *  2. STYLES_FONTS_CACHE: Local & compiled CSS (Tailwind / index.css), Google Fonts,
 *     FontAwesome stylesheets, and their referenced .woff2/.ttf font binaries.
 *  3. PRODUCT_IMAGES_CACHE: Complete cache for all product images (local assets,
 *     placehold.co, Unsplash, Cloudinary, or any external URL via CORS + no-cors fallback)
 *     with proactive background pre-caching whenever inventory updates.
 *  4. RUNTIME_CACHE: JS/TS bundles and offline API fallbacks.
 */

const CACHE_VERSION = 'mi-tienda-pos-v2';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STYLES_FONTS_CACHE = `${CACHE_VERSION}-styles-fonts`;
const PRODUCT_IMAGES_CACHE = `${CACHE_VERSION}-product-images`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const ALL_ACTIVE_CACHES = [
  APP_SHELL_CACHE,
  STYLES_FONTS_CACHE,
  PRODUCT_IMAGES_CACHE,
  RUNTIME_CACHE,
];

const MAX_IMAGE_CACHE_ENTRIES = 250;

const PRECACHE_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

const PRECACHE_STYLE_URLS = [
  '/src/index.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
];

const PRECACHE_DEFAULT_PRODUCT_IMAGES = [
  'https://placehold.co/300x300/1e293b/6366f1?text=Cafe',
  'https://placehold.co/300x300/1e293b/6366f1?text=Harina',
  'https://placehold.co/300x300/1e293b/6366f1?text=Queso',
  'https://placehold.co/300x300/1e293b/6366f1?text=Telefono',
];

/**
 * Helper: Fetch a resource with automatic fallback to `no-cors` for cross-origin
 * images or CDN stylesheets/fonts that do not expose permissive CORS headers.
 */
async function fetchWithOpaqueFallback(urlOrRequest, forceNoCors = false) {
  const targetUrl =
    typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest.url;
  const isCrossOrigin =
    new URL(targetUrl, self.location.origin).origin !== self.location.origin;

  if (!forceNoCors) {
    try {
      const response = await fetch(urlOrRequest);
      if (response && (response.ok || response.type === 'opaque')) {
        return response;
      }
    } catch {
      // Fall through to no-cors attempt for cross-origin resources
    }
  }

  if (isCrossOrigin) {
    const noCorsReq = new Request(targetUrl, {
      mode: 'no-cors',
      credentials: 'omit',
    });
    return fetch(noCorsReq);
  }

  return fetch(urlOrRequest);
}

/**
 * Helper: Parse `url(...)` font/asset references inside a cached CSS stylesheet
 * and proactively cache the referenced .woff2 / .woff / .ttf files for offline rendering.
 */
async function cacheFontsFromStylesheet(cssUrl, cssResponse, styleCache) {
  try {
    if (!cssResponse || cssResponse.type === 'opaque' || !cssResponse.ok) {
      return;
    }
    const cssText = await cssResponse.clone().text();
    const urlRegex = /url\((['"]?)(.*?)\1\)/gi;
    const discoveredFontUrls = new Set();
    let match;
    while ((match = urlRegex.exec(cssText)) !== null) {
      const rawRef = (match[2] || '').trim();
      if (!rawRef || rawRef.startsWith('data:')) continue;
      try {
        const resolved = new URL(rawRef, cssUrl).href;
        if (/\.(?:woff2?|ttf|otf|eot|svg)(?:\?.*)?$/i.test(resolved) || resolved.includes('fonts.gstatic.com')) {
          discoveredFontUrls.add(resolved);
        }
      } catch {
        // Ignore malformed URLs
      }
    }

    await Promise.allSettled(
      Array.from(discoveredFontUrls).slice(0, 25).map(async (fontUrl) => {
        const existing = await styleCache.match(fontUrl, { ignoreVary: true });
        if (!existing) {
          const fontRes = await fetchWithOpaqueFallback(fontUrl);
          if (fontRes && (fontRes.ok || fontRes.type === 'opaque')) {
            await styleCache.put(fontUrl, fontRes);
          }
        }
      })
    );
  } catch {
    // Non-fatal if stylesheet text cannot be parsed
  }
}

/**
 * Helper: Trim a cache to a maximum number of entries (FIFO eviction)
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const deleteCount = keys.length - maxEntries;
      await Promise.all(keys.slice(0, deleteCount).map((k) => cache.delete(k)));
    }
  } catch {
    // Ignore cache trim errors
  }
}

/**
 * Helper: Cache an array of product image URLs and style URLs proactively
 */
async function precacheDynamicAssets(imageUrls = [], styleUrls = []) {
  const imageCache = await caches.open(PRODUCT_IMAGES_CACHE);
  const styleCache = await caches.open(STYLES_FONTS_CACHE);

  const validImageUrls = Array.from(
    new Set(
      (imageUrls || []).filter(
        (u) =>
          typeof u === 'string' &&
          u.trim().length > 0 &&
          !u.startsWith('data:') &&
          !u.startsWith('blob:')
      )
    )
  );

  const validStyleUrls = Array.from(
    new Set(
      (styleUrls || []).filter(
        (u) =>
          typeof u === 'string' &&
          u.trim().length > 0 &&
          !u.startsWith('data:') &&
          !u.startsWith('blob:')
      )
    )
  );

  await Promise.allSettled(
    validStyleUrls.map(async (url) => {
      const cached = await styleCache.match(url, { ignoreVary: true });
      if (!cached) {
        const res = await fetchWithOpaqueFallback(url);
        if (res && (res.ok || res.type === 'opaque')) {
          await styleCache.put(url, res.clone());
          await cacheFontsFromStylesheet(url, res, styleCache);
        }
      }
    })
  );

  await Promise.allSettled(
    validImageUrls.map(async (url) => {
      const cached = await imageCache.match(url, { ignoreVary: true });
      if (!cached) {
        const res = await fetchWithOpaqueFallback(url);
        if (res && (res.ok || res.type === 'opaque')) {
          await imageCache.put(url, res);
        }
      }
    })
  );

  await trimCache(PRODUCT_IMAGES_CACHE, MAX_IMAGE_CACHE_ENTRIES);
  return getCacheStatistics();
}

/**
 * Helper: Compute real-time cache counts across buckets
 */
async function getCacheStatistics() {
  try {
    const [shellCache, styleCache, imageCache] = await Promise.all([
      caches.open(APP_SHELL_CACHE),
      caches.open(STYLES_FONTS_CACHE),
      caches.open(PRODUCT_IMAGES_CACHE),
    ]);
    const [shellKeys, styleKeys, imageKeys] = await Promise.all([
      shellCache.keys(),
      styleCache.keys(),
      imageCache.keys(),
    ]);
    return {
      version: CACHE_VERSION,
      cachedShellCount: shellKeys.length,
      cachedStylesCount: styleKeys.length,
      cachedImagesCount: imageKeys.length,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      version: CACHE_VERSION,
      cachedShellCount: 0,
      cachedStylesCount: 0,
      cachedImagesCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Helper: Broadcast a message to all controlled window clients
 */
async function notifyClients(message) {
  const clientsList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  for (const client of clientsList) {
    client.postMessage(message);
  }
}

/**
 * Helper: Generate a clean SVG product illustration if an uncached image is requested offline
 */
function buildOfflineProductSvgResponse(requestUrl) {
  let label = 'Producto POS';
  try {
    const u = new URL(requestUrl);
    const textParam = u.searchParams.get('text');
    if (textParam) {
      label = decodeURIComponent(textParam).slice(0, 18);
    }
  } catch {
    // ignore
  }
  const safeLabel = label.replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" rx="24" fill="url(#bg)"/>
    <circle cx="150" cy="125" r="42" fill="#312e81" opacity="0.7"/>
    <path d="M132 115h36l6 28h-48z" fill="#818cf8"/>
    <text x="150" y="205" text-anchor="middle" fill="#e2e8f0" font-family="Inter, sans-serif" font-weight="700" font-size="18">${safeLabel}</text>
    <text x="150" y="232" text-anchor="middle" fill="#64748b" font-family="Inter, sans-serif" font-weight="600" font-size="12">Caché Offline POS</text>
  </svg>`;
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

// 1. INSTALL: Precache App Shell, Stylesheets/Fonts, and Default Product Images
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(APP_SHELL_CACHE);
      await Promise.allSettled(
        PRECACHE_SHELL_URLS.map((url) =>
          shellCache.add(url).catch(() => {})
        )
      );
      await precacheDynamicAssets(
        PRECACHE_DEFAULT_PRODUCT_IMAGES,
        PRECACHE_STYLE_URLS
      );
    })()
  );
});

// 2. ACTIVATE: Clean up outdated caches and claim all open POS clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith('mi-tienda-pos-') &&
              !ALL_ACTIVE_CACHES.includes(name)
          )
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
      const stats = await getCacheStatistics();
      await notifyClients({
        type: 'SW_CACHE_STATS',
        ...stats,
      });
    })()
  );
});

// 3. FETCH: Dedicated strategies for HTML, Styles/Fonts, Product Images, and JS/API
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Ignore Vite HMR / websocket / internal ping requests
  if (
    url.pathname.startsWith('/@vite/client') ||
    url.searchParams.has('t') && url.pathname.includes('node_modules/.vite')
  ) {
    // Still allow caching Vite deps in runtime cache below if needed
  }

  const acceptHeader = request.headers.get('accept') || '';

  // Strategy A: HTML Navigation requests -> NetworkFirst with App Shell fallback
  if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(APP_SHELL_CACHE);
            cache.put('/index.html', networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cachedIndex =
            (await caches.match(request, { ignoreVary: true })) ||
            (await caches.match('/index.html', { ignoreVary: true })) ||
            (await caches.match('/', { ignoreVary: true }));
          if (cachedIndex) {
            return cachedIndex;
          }
          return new Response(
            '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Mi Tienda POS - Modo Sin Conexión</title></head><body><h1>Modo Sin Conexión</h1><p>Recarga la aplicación para abrir el Punto de Venta.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // Strategy B: Stylesheets & Fonts (Tailwind CSS, index.css, Google Fonts, FontAwesome)
  // CacheFirst + Stale-While-Revalidate in STYLES_FONTS_CACHE
  const isStyleOrFont =
    request.destination === 'style' ||
    request.destination === 'font' ||
    acceptHeader.includes('text/css') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    /\.(?:css|woff2?|ttf|otf|eot)$/i.test(url.pathname);

  if (isStyleOrFont) {
    event.respondWith(
      (async () => {
        const styleCache = await caches.open(STYLES_FONTS_CACHE);
        const cached =
          (await styleCache.match(request, { ignoreVary: true })) ||
          (await styleCache.match(request.url, { ignoreVary: true }));

        const networkUpdatePromise = (async () => {
          try {
            const netRes = await fetchWithOpaqueFallback(request);
            if (netRes && (netRes.ok || netRes.type === 'opaque')) {
              await styleCache.put(request, netRes.clone());
              if (
                request.destination === 'style' ||
                url.pathname.endsWith('.css') ||
                url.hostname.includes('fonts.googleapis.com')
              ) {
                await cacheFontsFromStylesheet(request.url, netRes, styleCache);
              }
            }
            return netRes;
          } catch {
            return null;
          }
        })();

        if (cached) {
          return cached;
        }

        const fresh = await networkUpdatePromise;
        if (fresh) {
          return fresh;
        }

        // Empty valid CSS fallback if an uncached stylesheet is requested offline
        if (request.destination === 'style' || acceptHeader.includes('text/css')) {
          return new Response('/* Offline fallback stylesheet */', {
            status: 200,
            headers: { 'Content-Type': 'text/css; charset=utf-8' },
          });
        }
        return new Response('', { status: 408 });
      })()
    );
    return;
  }

  // Strategy C: Product Images & General Graphic Assets
  // CacheFirst + Stale-While-Revalidate in PRODUCT_IMAGES_CACHE (supports cross-origin & opaque responses)
  const isImageAsset =
    request.destination === 'image' ||
    acceptHeader.includes('image/') ||
    url.hostname.includes('placehold.co') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('imgur.com') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('wikimedia.org') ||
    url.hostname.includes('pexels.com') ||
    url.hostname.includes('pixabay.com') ||
    /\.(?:png|jpe?g|svg|gif|webp|avif|ico|bmp)$/i.test(url.pathname);

  if (isImageAsset) {
    event.respondWith(
      (async () => {
        const imageCache = await caches.open(PRODUCT_IMAGES_CACHE);
        const cached =
          (await imageCache.match(request, { ignoreVary: true })) ||
          (await imageCache.match(request.url, { ignoreVary: true })) ||
          (await caches.match(request, { ignoreVary: true }));

        if (cached) {
          // Refresh image in background when online without blocking UI rendering
          fetchWithOpaqueFallback(request)
            .then(async (netRes) => {
              if (netRes && (netRes.ok || netRes.type === 'opaque')) {
                await imageCache.put(request, netRes.clone());
              }
            })
            .catch(() => {});
          return cached;
        }

        try {
          const netRes = await fetchWithOpaqueFallback(request);
          if (netRes && (netRes.ok || netRes.type === 'opaque')) {
            await imageCache.put(request, netRes.clone());
            trimCache(PRODUCT_IMAGES_CACHE, MAX_IMAGE_CACHE_ENTRIES);
            return netRes;
          }
        } catch {
          // Fall through to SVG offline product card
        }

        return buildOfflineProductSvgResponse(request.url);
      })()
    );
    return;
  }

  // Strategy D: App JS/TS modules, Vite bundles & API GET requests
  // Stale-While-Revalidate for local scripts/modules, NetworkFirst for API calls
  const isLocalScriptOrAsset =
    url.origin === self.location.origin && !url.pathname.startsWith('/api/');

  if (isLocalScriptOrAsset) {
    event.respondWith(
      (async () => {
        const runtimeCache = await caches.open(RUNTIME_CACHE);
        try {
          const netRes = await fetch(request);
          if (netRes && netRes.ok) {
            runtimeCache.put(request, netRes.clone());
          }
          return netRes;
        } catch {
          const cached =
            (await runtimeCache.match(request, { ignoreVary: true })) ||
            (await caches.match(request, { ignoreVary: true }));
          if (cached) {
            return cached;
          }
          return new Response('', { status: 503 });
        }
      })()
    );
    return;
  }

  // Strategy E: External APIs & /api/* routes -> NetworkFirst with JSON offline fallback
  event.respondWith(
    (async () => {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      try {
        const netRes = await fetch(request);
        if (netRes && netRes.ok) {
          runtimeCache.put(request, netRes.clone());
        }
        return netRes;
      } catch {
        const cached = await runtimeCache.match(request, { ignoreVary: true });
        if (cached) {
          return cached;
        }
        if (url.pathname.startsWith('/api/')) {
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Operando en modo sin conexión (IndexedDB + Service Worker activos)',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        return new Response('', { status: 503 });
      }
    })()
  );
});

// 4. BACKGROUND SYNC: Trigger IndexedDB synchronization when connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-offline-sync') {
    event.waitUntil(
      notifyClients({
        type: 'SW_TRIGGER_INDEXEDDB_SYNC',
        timestamp: new Date().toISOString(),
        reason: 'background-sync',
      })
    );
  }
});

// 5. MESSAGE HANDLER: Precache product images & styles, report stats, and coordinate sync
self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'REQUEST_SYNC_NOW') {
    notifyClients({
      type: 'SW_TRIGGER_INDEXEDDB_SYNC',
      timestamp: new Date().toISOString(),
      reason: 'manual-or-online',
    });
    return;
  }

  if (data.type === 'PRECACHE_POS_ASSETS') {
    event.waitUntil(
      (async () => {
        const stats = await precacheDynamicAssets(
          data.imageUrls || [],
          data.styleUrls || []
        );
        await notifyClients({
          type: 'SW_CACHE_STATS',
          ...stats,
        });
      })()
    );
    return;
  }

  if (data.type === 'GET_SW_CACHE_STATS' || data.type === 'PING_SW') {
    event.waitUntil(
      (async () => {
        const stats = await getCacheStatistics();
        if (event.source && 'postMessage' in event.source) {
          event.source.postMessage({
            type: 'SW_PONG',
            ...stats,
          });
          event.source.postMessage({
            type: 'SW_CACHE_STATS',
            ...stats,
          });
        } else {
          await notifyClients({
            type: 'SW_CACHE_STATS',
            ...stats,
          });
        }
      })()
    );
  }
});
