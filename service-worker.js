const CACHE_NAME = 'sanpaid-shell-v30';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './mobile.css',
  './mobile-fix.css',
  './connected-demo.css',
  './judge-demo.css',
  './sih-final.css',
  './selector-mode.css',
  './credibility-layer.css',
  './workforce-intelligence.css',
  './hero-viewport-fix.css',
  './evaluator-final.css',
  './app.js',
  './voice-lazy-loader.js',
  './voice-request.js',
  './mobile.js',
  './connected-demo.js',
  './connected-service-ui.js',
  './connected-commerce-ui.js',
  './connected-runtime-fix.js',
  './capacity-worker-ui.js',
  './judge-demo.js',
  './selector-mode.js',
  './credibility-layer.js',
  './workforce-intelligence.js',
  './worker-trust-passport-ui.js',
  './top1-polish.js',
  './demo-preflight.js',
  './evaluator-final.js',
  './manifest.webmanifest',
  './app-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(error => console.warn('SanPaid shell precache partial failure', error))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && key.startsWith('sanpaid-shell-')).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(async () => (await caches.match('./index.html')) || (await caches.match('./')))
    );
    return;
  }

  const connectedCritical = [
    '/connected-demo.js',
    '/connected-service-ui.js',
    '/connected-commerce-ui.js',
    '/connected-runtime-fix.js',
    '/connected-demo.css',
    '/voice-lazy-loader.js',
    '/capacity-worker-ui.js',
    '/judge-demo.js',
    '/judge-demo.css',
    '/sih-final.css',
    '/selector-mode.js',
    '/selector-mode.css',
    '/credibility-layer.js',
    '/credibility-layer.css',
    '/workforce-intelligence.js',
    '/workforce-intelligence.css',
    '/worker-trust-passport-ui.js',
    '/hero-viewport-fix.css',
    '/evaluator-final.css',
    '/top1-polish.js',
    '/demo-preflight.js',
    '/evaluator-final.js'
  ].some(path => url.pathname.endsWith(path));

  if (connectedCritical) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  const isShellAsset = APP_SHELL.some(path => url.pathname.endsWith(path.replace('./','')));
  if (!isShellAsset) return;

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});