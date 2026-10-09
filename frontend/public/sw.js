/* PWA Service Worker
  - Robust offline support for pages, assets, and API data
  - Next.js chunk handling to prevent chunk load errors
  - Request queue for offline POST/PUT/DELETE with background sync
*/
const VERSION = 'v12';
const APP_SHELL_CACHE = `glp-shell-${VERSION}`;
const STATIC_CACHE = `glp-static-${VERSION}`;
const DATA_CACHE = `glp-data-${VERSION}`;
const VIDEO_CACHE = 'glp-videos-v1';

// Helper to extract and precache Next.js static scripts and stylesheets from HTML
async function extractAndPrecacheHtmlAssets(htmlText, staticCache) {
  if (!htmlText || typeof htmlText !== 'string') return;
  try {
    const assetMatches = htmlText.match(/(?:src|href)="(\/_next\/static\/[^"]+)"/g) || [];
    const urlsToFetch = new Set();
    for (const m of assetMatches) {
      const matchedUrl = m.replace(/^(?:src|href)="/, '').replace(/"$/, '');
      if (matchedUrl && !matchedUrl.includes('.map')) {
        urlsToFetch.add(matchedUrl);
      }
    }
    for (const assetUrl of urlsToFetch) {
      try {
        const aRes = await fetch(assetUrl);
        if (aRes.ok) {
          await staticCache.put(assetUrl, aRes.clone());
          const aParsed = new URL(assetUrl, self.location.origin);
          await staticCache.put(aParsed.pathname, aRes.clone());
          await staticCache.put(self.location.origin + aParsed.pathname, aRes.clone());
        }
      } catch (e) {}
    }
  } catch (e) {}
}

// Range request helper for playing cached videos in HTML5 video tags
async function handleVideoRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return cachedResponse;
  }

  try {
    const arrayBuffer = await cachedResponse.arrayBuffer();
    const totalLength = arrayBuffer.byteLength;
    if (!totalLength) return cachedResponse;

    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10) || 0;
    const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
    const safeEnd = Math.min(end, totalLength - 1);
    const chunk = arrayBuffer.slice(start, safeEnd + 1);

    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': cachedResponse.headers.get('content-type') || 'video/mp4',
        'Content-Range': `bytes ${start}-${safeEnd}/${totalLength}`,
        'Content-Length': chunk.byteLength,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (e) {
    return cachedResponse;
  }
}
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.webp',
  '/offline.html',
  '/favicon.ico',
  '/home.mp4',
  // Fonts commonly used by the app
  '/fonts/KFOmCnqEu92Fr1Mu4mxK.woff2'
];

const APP_ROUTES = [
  '/',
  '/games',
  '/games/big-o-runner',
  '/games/big-o-runner/index.html',
  '/games/stemquiz.html',
  '/progress',
  '/quiz',
  '/student',
  '/student/dashboard',
  '/student/resources',
  '/student/groups',
  '/student/achievements',
  '/student/adventures',
  '/student/challenges',
  '/student/courses',
  '/student/dashboard-v2',
  '/student/games',
  '/student/games/math-blitz',
  '/student/games/science-quest',
  '/student/games/srem-quiz',
  '/student/games/stem-quiz',
  '/student/leaderboard',
  '/student/lessons',
  '/student/new-dashboard',
  '/student/quiz',
  '/student/quiz/results',
  '/student/exams',
  '/exams',
  '/student/search',
  '/student/study-buddy',
  '/subjects',
  '/teacher',
  '/teacher/classes',
  '/teacher/content',
  '/teacher/quizzes',
  '/teacher/reports',
  '/teacher/students'
];

const STATIC_WARM_ASSETS = [
  '/games/big-o-runner/game.js',
  '/fonts/KFOmCnqEu92Fr1Mu4mxK.woff2',
  '/logo.webp',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-256.png',
  '/icons/icon-256-maskable.png',
  '/icons/icon-384.png',
  '/icons/icon-384-maskable.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png'
];

// IndexedDB helpers for storing JSON payloads (subjects, quizzes, streak etc.)
const DB_NAME = 'glp-offline';
const DB_VERSION = 2;
const STORE_JSON = 'json';
const STORE_QUEUE = 'queue';

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_JSON)) db.createObjectStore(STORE_JSON);
      if (!db.objectStoreNames.contains(STORE_QUEUE)) db.createObjectStore(STORE_QUEUE, { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  try {
    const db = await idbOpen();
    const tx = db.transaction(STORE_JSON, 'readwrite');
    tx.objectStore(STORE_JSON).put(value, key);
    return tx.complete;
  } catch {}
}

async function idbGet(key) {
  try {
    const db = await idbOpen();
    const tx = db.transaction(STORE_JSON, 'readonly');
    return await new Promise((res, rej) => {
      const r = tx.objectStore(STORE_JSON).get(key);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  } catch { return null; }
}

// Dexie GyanaratnaOfflineDB reader for unified IndexedDB offline caching
async function getDexieCachedApi(key) {
  try {
    return await new Promise((resolve) => {
      const req = indexedDB.open('GyanaratnaOfflineDB');
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        try {
          const dbInstance = req.result;
          if (!dbInstance.objectStoreNames.contains('cachedApi')) {
            dbInstance.close();
            return resolve(null);
          }
          const tx = dbInstance.transaction('cachedApi', 'readonly');
          const store = tx.objectStore('cachedApi');
          const getReq = store.get(key);
          getReq.onsuccess = () => {
            dbInstance.close();
            resolve(getReq.result?.data || null);
          };
          getReq.onerror = () => {
            dbInstance.close();
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      };
    });
  } catch {
    return null;
  }
}

// Queue helpers for offline write operations
async function idbQueueAdd(record) {
  try {
    const db = await idbOpen();
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).add(record);
    return tx.complete;
  } catch {}
}

async function idbQueueGetAll() {
  try {
    const db = await idbOpen();
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    return await new Promise((res, rej) => {
      const req = tx.objectStore(STORE_QUEUE).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch { return []; }
}

async function idbQueueClear() {
  try {
    const db = await idbOpen();
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).clear();
    return tx.complete;
  } catch {}
}

async function flushRequestQueue() {
  const queued = await idbQueueGetAll();
  if (!queued.length) return { flushed: 0 };
  let flushed = 0;
  for (const q of queued) {
    try {
      const { url, method, headers, body } = q;
      const res = await fetch(url, { method, headers, body });
      if (res && res.ok) flushed++;
      // Optionally cache any JSON response
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.clone().json();
          idbPut(new URL(url).pathname, { data, ts: Date.now() });
        }
      } catch {}
    } catch (e) {
      // Stop on first failure to retry later
      break;
    }
  }
  // If all flushed successfully, clear queue
  if (flushed === queued.length) await idbQueueClear();
  // Notify clients
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
  clientsList.forEach(c => c.postMessage({ type: 'queue-flushed', flushed }));
  return { flushed };
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(APP_SHELL_CACHE);
      const staticCache = await caches.open(STATIC_CACHE);

      try {
        await Promise.allSettled(CORE_ASSETS.map((asset) => shellCache.add(asset)));
        console.log('[SW] Core app shell cached.');
      } catch (err) {
        console.warn('[SW] Core asset precache issue:', err);
      }

      try {
        await Promise.allSettled([...new Set(STATIC_WARM_ASSETS)].map((asset) => staticCache.add(asset)));
        console.log('[SW] Pre-cached static assets');
      } catch (e) {
        console.log('[SW] Could not pre-cache static assets');
      }

      // Pre-cache key app routes and extract their static subresources
      try {
        const routes = [...new Set(APP_ROUTES)];
        for (const r of routes) {
          try {
            const res = await fetch(r, { cache: 'no-store' });
            if (res.ok) {
              await shellCache.put(r, res.clone());
              const parsed = new URL(r, self.location.origin);
              await shellCache.put(parsed.pathname, res.clone());
              const ct = res.headers.get('content-type') || '';
              if (ct.includes('text/html')) {
                const text = await res.text();
                await extractAndPrecacheHtmlAssets(text, staticCache);
              }
            }
          } catch (e) {}
        }
        console.log('[SW] Pre-cached app routes and subresources');
      } catch (e) {
        console.log('[SW] Could not pre-cache routes (server may be offline)');
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const currentCaches = [APP_SHELL_CACHE, STATIC_CACHE, DATA_CACHE, VIDEO_CACHE];

      // Migrate existing cached assets from prior static and shell caches to prevent offline chunk loss
      try {
        const newStatic = await caches.open(STATIC_CACHE);
        const oldStaticKeys = keys.filter(k => k.startsWith('glp-static-') && k !== STATIC_CACHE);
        for (const oldKey of oldStaticKeys) {
          const oldCache = await caches.open(oldKey);
          const reqs = await oldCache.keys();
          for (const req of reqs) {
            const match = await oldCache.match(req);
            if (match) {
              await newStatic.put(req, match.clone());
              try {
                const u = new URL(req.url);
                await newStatic.put(u.pathname, match.clone());
              } catch (e) {}
            }
          }
        }

        const newShell = await caches.open(APP_SHELL_CACHE);
        const oldShellKeys = keys.filter(k => k.startsWith('glp-shell-') && k !== APP_SHELL_CACHE);
        for (const oldKey of oldShellKeys) {
          const oldCache = await caches.open(oldKey);
          const reqs = await oldCache.keys();
          for (const req of reqs) {
            const match = await oldCache.match(req);
            if (match) {
              await newShell.put(req, match.clone());
              try {
                const u = new URL(req.url);
                await newShell.put(u.pathname, match.clone());
              } catch (e) {}
            }
          }
        }
      } catch (migErr) {
        console.warn('[SW] Cache migration notice:', migErr);
      }

      await Promise.all(keys.filter(k => !currentCaches.includes(k)).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http(s) requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Handle Video requests and Range headers from Cache Storage (glp-videos-v1)
  const isVideoUrl = url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm') || request.headers.get('accept')?.includes('video');
  const hasRangeHeader = Boolean(request.headers.get('range'));

  if (isVideoUrl || hasRangeHeader) {
    event.respondWith(
      (async () => {
        try {
          const videoCache = await caches.open(VIDEO_CACHE);
          const cachedMatch = await videoCache.match(request.url) || await videoCache.match(request);
          
          if (cachedMatch) {
            return await handleVideoRangeRequest(request, cachedMatch);
          }

          // Try network
          const netRes = await fetch(request);
          return netRes;
        } catch (err) {
          // If network fails (offline), try match without query parameters
          try {
            const videoCache = await caches.open(VIDEO_CACHE);
            const cachedUrlMatch = await videoCache.match(url.origin + url.pathname);
            if (cachedUrlMatch) {
              return await handleVideoRangeRequest(request, cachedUrlMatch);
            }
          } catch (e) {}

          return new Response('Video unavailable offline. Download for offline first.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })()
    );
    return;
  }

  // Ignore non-GET
  const isGet = request.method === 'GET';
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');

  // Queue non-GET API requests when offline
  if (!isGet) {
    const isApi = url.pathname.startsWith('/api/');
    if (isApi) {
      event.respondWith((async () => {
        try {
          // Try network first
          return await fetch(request);
        } catch (e) {
          // Offline: queue the request
          const body = await request.clone().arrayBuffer().catch(() => null);
          const headers = {};
          request.headers.forEach((v, k) => headers[k] = v);
          await idbQueueAdd({ url: request.url, method: request.method, headers, body });
          // Attempt background sync
          if ('sync' in self.registration) {
            try { await self.registration.sync.register('api-sync'); } catch {}
          }
          return new Response(JSON.stringify({ queued: true, offline: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json', 'X-Queued': '1' }
          });
        }
      })());
      return;
    }
  }

  // Handle manifest.json explicitly for offline PWA support
  if (url.pathname === '/manifest.json' || url.pathname.endsWith('/manifest.json') || request.destination === 'manifest') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, res.clone());
            await cache.put('/manifest.json', res.clone());
            await cache.put(url.origin + '/manifest.json', res.clone());
            return res;
          }
        } catch (e) {}

        const cached = (await caches.match(request, { ignoreSearch: true })) ||
                       (await caches.match('/manifest.json', { ignoreSearch: true })) ||
                       (await caches.match(url.pathname, { ignoreSearch: true }));
        if (cached) return cached;

        return new Response(JSON.stringify({
          name: "Gamified Learning Platform",
          short_name: "GLP",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#0f172a",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/manifest+json' }
        });
      })()
    );
    return;
  }

  // Handle Next.js chunks - improved error handling and fallbacks
  if (url.pathname.startsWith('/_next/') && url.hostname === self.location.hostname) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          // Cache successful chunks for offline use under multiple keys
          if (res.ok) {
            try {
              const cache = await caches.open(STATIC_CACHE);
              await cache.put(request, res.clone());
              await cache.put(url.pathname, res.clone());
              await cache.put(url.origin + url.pathname, res.clone());
            } catch (e) {}
          }
          return res;
        } catch (err) {
          console.log('[SW] Chunk fetch offline, matching cache:', url.pathname);
          // Try cached version across keys with ignoreSearch: true
          let cached = (await caches.match(request, { ignoreSearch: true })) ||
                       (await caches.match(url.pathname, { ignoreSearch: true })) ||
                       (await caches.match(url.origin + url.pathname, { ignoreSearch: true }));
          
          if (!cached) {
            // Search all available caches (including static, shell, and previous versions)
            const allCaches = await caches.keys();
            for (const cName of allCaches) {
              const c = await caches.open(cName);
              const m = (await c.match(request, { ignoreSearch: true })) ||
                        (await c.match(url.pathname, { ignoreSearch: true })) ||
                        (await c.match(url.origin + url.pathname, { ignoreSearch: true }));
              if (m) {
                cached = m;
                try {
                  const staticCache = await caches.open(STATIC_CACHE);
                  await staticCache.put(url.pathname, m.clone());
                } catch (e) {}
                break;
              }
            }
          }

          if (cached) {
            console.log('[SW] Serving cached chunk:', url.pathname);
            return cached;
          }

          // Special runtime fallback for webpack.js if not in cache
          if (url.pathname.includes('webpack.js')) {
            console.log('[SW] Serving Webpack runtime offline fallback');
            const webpackStub = `
              /* Offline Webpack Runtime Fallback */
              (function() {
                var g = typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : this);
                if (g) {
                  g.webpackChunk_N_E = g.webpackChunk_N_E || [];
                  if (!g.__webpack_require__) {
                    g.__webpack_require__ = function(moduleId) {
                      return {};
                    };
                    g.__webpack_require__.d = function(exports, definition) {
                      for (var key in definition) {
                        if (Object.prototype.hasOwnProperty.call(definition, key) && !Object.prototype.hasOwnProperty.call(exports, key)) {
                          Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
                        }
                      }
                    };
                    g.__webpack_require__.r = function(exports) {
                      if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                        Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
                      }
                      Object.defineProperty(exports, "__esModule", { value: true });
                    };
                    g.__webpack_require__.m = {};
                    g.__webpack_require__.c = {};
                  }
                }
              })();
            `;
            return new Response(webpackStub, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache',
              },
            });
          }

          // For JS chunks, return a resilient module stub that registers into webpackChunk_N_E
          if (url.pathname.endsWith('.js')) {
            console.log('[SW] Serving safe module stub for:', url.pathname);
            const chunkMatch = url.pathname.match(/([a-zA-Z0-9_\-\.]+)\.js$/);
            const chunkId = chunkMatch ? chunkMatch[1] : 'chunk';
            const stubCode = `
              /* Offline Next.js chunk stub for ${url.pathname} */
              (function() {
                var target = typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : this);
                if (target) {
                  if (!target.webpackChunk_N_E) target.webpackChunk_N_E = [];
                  if (typeof target.webpackChunk_N_E.push === "function") {
                    try {
                      target.webpackChunk_N_E.push([
                        [${JSON.stringify(chunkId)}],
                        {
                          ${JSON.stringify(chunkId)}: function(e, t, r) {}
                        }
                      ]);
                    } catch(e) {}
                  }
                  if (!target.Clerk) target.Clerk = {};
                }
                if (typeof module !== 'undefined' && module.exports) {
                  module.exports = {};
                }
              })();
            `;
            return new Response(stubCode, {
              status: 200,
              headers: { 
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache'
              }
            });
          }
          
          // For CSS chunks
          if (url.pathname.endsWith('.css')) {
            console.log('[SW] Serving safe CSS fallback for:', url.pathname);
            return new Response('/* Offline: chunk styles unavailable */', {
              status: 200,
              headers: { 
                'Content-Type': 'text/css',
                'Cache-Control': 'no-cache'
              }
            });
          }
          
          return new Response('', { status: 200 });
        }
      })()
    );
    return;
  }

  // API & data endpoints: network-first with fallback to cache / IndexedDB
  const isData = url.pathname.startsWith('/api/') || url.pathname.includes('/quiz') || url.pathname.includes('/streak') || url.pathname.startsWith('/subjects') || url.pathname.startsWith('/leaderboard');
  if (isData) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const clone = res.clone();
          const contentType = res.headers.get('content-type') || '';
          // Cache JSON separately and store payload in IndexedDB
          if (contentType.includes('application/json')) {
            try {
              const data = await clone.clone().json();
              idbPut(url.pathname + url.search, { data, ts: Date.now() });
            } catch {}
          }
          caches.open(DATA_CACHE).then(c => c.put(request, clone).catch(() => {}));
          // Notify clients for data updates
          const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
          clientsList.forEach(c => c.postMessage({ type: 'data-updated', key: url.pathname + url.search }));
          return res;
        } catch (err) {
          // Try cache
          const cached = await caches.match(request) || await caches.match(request, { cacheName: DATA_CACHE });
          if (cached) return cached;
          
          // Try glp-offline IndexedDB JSON
          const stored = await idbGet(url.pathname + url.search) || await idbGet(url.pathname);
          if (stored) {
            return new Response(JSON.stringify(stored.data || stored), { headers: { 'Content-Type': 'application/json', 'X-Offline': '1' } });
          }

          // Try Dexie GyanaratnaOfflineDB cachedApi store
          const dexieData = await getDexieCachedApi(url.pathname + url.search) || await getDexieCachedApi(url.pathname);
          if (dexieData) {
            return new Response(JSON.stringify(dexieData), { headers: { 'Content-Type': 'application/json', 'X-Offline': '1', 'X-IndexedDB': 'dexie' } });
          }

          throw err;
        }
      })()
    );
    return;
  }

  // Navigation requests: serve cached pages when offline
  if (request.mode === 'navigate' || acceptsHtml) {
    // If offline and navigating to /sign-in, automatically bounce back to destination or student dashboard
    if (!self.navigator.onLine && url.pathname.startsWith('/sign-in')) {
      const redirectParam = url.searchParams.get('redirect_url');
      let target = '/student/dashboard';
      if (redirectParam) {
        try {
          const parsed = new URL(redirectParam, self.location.origin);
          if (parsed.pathname && !parsed.pathname.startsWith('/sign-in')) {
            target = parsed.pathname + parsed.search;
          }
        } catch (e) {}
      }
      return Response.redirect(new URL(target, self.location.origin).href, 302);
    }

    // Allow online auth-related routes to bypass entirely (Clerk, OAuth callbacks)
    if (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up') || url.pathname.includes('oauth')) {
      return; // default browser fetch
    }
    event.respondWith((async () => {
      try {
        const res = await fetch(request, { cache: 'no-store' });
        // If offline and server returned redirect to sign-in, intercept and serve cached app shell
        if (!self.navigator.onLine && (res.status === 302 || res.status === 307 || res.headers.get('location')?.includes('/sign-in'))) {
          throw new Error('Offline redirect to sign-in intercepted');
        }
        // Cache successful HTML responses for offline access
        if (res.ok && res.headers.get('content-type')?.includes('text/html')) {
          try {
            const cache = await caches.open(APP_SHELL_CACHE);
            await cache.put(request, res.clone());
            await cache.put(url.pathname, res.clone());
            await cache.put(url.origin + url.pathname, res.clone());

            // Extract and precache chunks in background
            const staticCache = await caches.open(STATIC_CACHE);
            res.clone().text().then(text => {
              extractAndPrecacheHtmlAssets(text, staticCache);
            }).catch(() => {});
          } catch (e) {}
        }
        return res;
      } catch (e) {
        console.warn('[SW] Navigation fetch failed, checking cache:', url.href);
        
        // First try: exact page match with ignoreSearch
        let exactMatch = (await caches.match(request, { ignoreSearch: true })) ||
                         (await caches.match(url.pathname, { ignoreSearch: true })) ||
                         (await caches.match(url.origin + url.pathname, { ignoreSearch: true }));
        if (exactMatch) {
          console.log('[SW] Serving cached page:', url.pathname);
          return exactMatch;
        }
        
        // Second try: for student and exams routes, serve student dashboard or exams
        if (url.pathname.startsWith('/student') || url.pathname.startsWith('/exams')) {
          const studentShell = (await caches.match('/student/dashboard', { ignoreSearch: true })) ||
                               (await caches.match('/student/exams', { ignoreSearch: true })) ||
                               (await caches.match('/exams', { ignoreSearch: true })) ||
                               (await caches.match('/student', { ignoreSearch: true }));
          if (studentShell) {
            console.log('[SW] Serving cached student shell for:', url.pathname);
            return studentShell;
          }
        }

        // Third try: for other app routes, try to serve the main shell
        if (url.pathname !== '/' && !url.pathname.startsWith('/api/')) {
          const shell = (await caches.match('/', { ignoreSearch: true })) ||
                        (await caches.match('/student/dashboard', { ignoreSearch: true }));
          if (shell) {
            console.log('[SW] Serving app shell for:', url.pathname);
            return shell;
          }
        }
        
        // Last resort: offline page
        console.log('[SW] Serving offline page for:', url.pathname);
        const offline = await caches.match('/offline.html', { ignoreSearch: true });
        if (offline) {
          console.log('[SW] Offline fallback from cache');
          return offline;
        }
        console.log('[SW] Offline fallback inline response');
        return new Response(
          '<!doctype html><title>Offline</title><h1>You are offline</h1><p>Please reconnect.</p>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
    })());
    return;
  }

  // Static assets (images, css, js, fonts, json, manifest) – cache-first
  if (
    ['image', 'style', 'font', 'script', 'manifest'].includes(request.destination) ||
    /\.(png|jpg|jpeg|gif|webp|svg|css|js|woff2?|ico|json|webmanifest|mp4|webm)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        let cached = (await cache.match(request, { ignoreSearch: true })) ||
                     (await cache.match(url.pathname, { ignoreSearch: true })) ||
                     (await cache.match(url.origin + url.pathname, { ignoreSearch: true })) ||
                     (await caches.match(request, { ignoreSearch: true })) ||
                     (await caches.match(url.pathname, { ignoreSearch: true }));
        if (cached) return cached;

        try {
          const res = await fetch(request);
          if (res.ok) {
            try {
              await cache.put(request, res.clone());
              await cache.put(url.pathname, res.clone());
              await cache.put(url.origin + url.pathname, res.clone());
            } catch (e) {}
          }
          return res;
        } catch (err) {
          if (cached) return cached;

          // Fallback for missing images
          if (['image'].includes(request.destination) || /\.(png|jpg|jpeg|gif|webp|svg|ico)$/.test(url.pathname)) {
            return new Response(
              `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#ccc"><rect width="64" height="64" fill="#f0f0f0"/><text x="32" y="32" text-anchor="middle" dominant-baseline="middle" font-size="12">📚</text></svg>`,
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }

          // Fallback for missing scripts & Webpack / Clerk chunks (prevents ChunkLoadError offline)
          if (request.destination === 'script' || url.pathname.endsWith('.js') || url.hostname.includes('clerk')) {
            const chunkMatch = url.pathname.match(/([a-zA-Z0-9_\-\.]+)\.js$/);
            const chunkId = chunkMatch ? chunkMatch[1] : 'chunk';
            const stubCode = `
              /* Offline script fallback */
              (function() {
                var target = typeof window !== "undefined" ? window : (typeof self !== "undefined" ? self : this);
                if (target) {
                  if (!target.webpackChunk_N_E) target.webpackChunk_N_E = [];
                  if (typeof target.webpackChunk_N_E.push === "function") {
                    try {
                      target.webpackChunk_N_E.push([
                        [${JSON.stringify(chunkId)}],
                        {
                          ${JSON.stringify(chunkId)}: function(e, t, r) {}
                        }
                      ]);
                    } catch(e) {}
                  }
                  if (!target.Clerk) target.Clerk = {};
                }
                if (typeof module !== 'undefined' && module.exports) {
                  module.exports = {};
                }
              })();
            `;
            return new Response(stubCode, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache',
              },
            });
          }

          if (url.pathname.endsWith('.json') || request.destination === 'manifest') {
            return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          return new Response('/* Offline asset unavailable */', { status: 200 });
        }
      })()
    );
    return;
  }
});

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'api-sync') {
    event.waitUntil(flushRequestQueue());
  }
});

// Client message handler
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;
  if (data === 'clear-offline-cache') {
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('glp-')).map(k => caches.delete(k))));
    return;
  }
  if (data.type === 'warm-cache' && Array.isArray(data.urls)) {
    const urls = [...new Set(data.urls)];
    const total = urls.length;
    event.waitUntil(
      (async () => {
        const shell = await caches.open(APP_SHELL_CACHE);
        const staticCache = await caches.open(STATIC_CACHE);
        const clients = await self.clients.matchAll({ includeUncontrolled: true });

        let completed = 0;
        for (const u of urls) {
          try {
            const res = await fetch(u, { cache: 'no-store' });
            if (res.ok) {
              const isStatic = (u.endsWith('.js') || u.endsWith('.css') || u.endsWith('.woff2') || u.endsWith('.png') || u.endsWith('.webp') || u.includes('/_next/'));
              const dest = isStatic ? staticCache : shell;
              await dest.put(u, res.clone());
              try {
                const parsed = new URL(u, self.location.origin);
                await dest.put(parsed.pathname, res.clone());
                await dest.put(self.location.origin + parsed.pathname, res.clone());
              } catch (e) {}

              const ct = res.headers.get('content-type') || '';
              if (ct.includes('text/html')) {
                const text = await res.text();
                await extractAndPrecacheHtmlAssets(text, staticCache);
              }
            }
          } catch (e) {
            // ignore individual asset failure
          }
          completed++;

          // Report progress to UI every 2 items or on completion
          if (completed % 2 === 0 || completed === total) {
            const pct = Math.round((completed / total) * 100);
            clients.forEach((client) => {
              client.postMessage({
                type: 'cache-progress',
                completed,
                total,
                percent: pct,
                url: u,
              });
            });
          }

          await new Promise((resolve) => setTimeout(resolve, 25));
        }

        clients.forEach((client) => {
          client.postMessage({ type: 'cache-complete', total });
        });
      })()
    );
    return;
  }
  if (data.type === 'cache-chunks' && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const staticCache = await caches.open(STATIC_CACHE);
        for (const u of data.urls) {
          try {
            const res = await fetch(u);
            if (res.ok) {
              await staticCache.put(u, res.clone());
              try {
                const parsed = new URL(u, self.location.origin);
                await staticCache.put(parsed.pathname, res.clone());
                await staticCache.put(self.location.origin + parsed.pathname, res.clone());
              } catch (e) {}
            }
          } catch (e) {}
        }
      })()
    );
    return;
  }
  if (data.type === 'flush-queue') {
    event.waitUntil(flushRequestQueue());
  }
});
