// ══════════════════════════════════════════════
// SERVICE WORKER — Emet CRM
// Стратегія: Cache First для статики, Network First для API
// ══════════════════════════════════════════════

const CACHE_NAME = 'emet-crm-v1';

// Статичні ресурси що кешуються при встановленні
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/utils.js',
    '/js/mock-data.js',
    '/js/orders.js',
    '/js/debtors.js',
    '/js/app.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://unpkg.com/imask',
];

// ── INSTALL: кешуємо статику ──
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
            .then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: видаляємо старі кеші ──
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// ── FETCH: Cache First для статики, Network Only для API ──
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API запити — завжди мережа, ніколи кеш
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Статика — Cache First, fallback to network
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // Кешуємо тільки успішні GET-відповіді
                if (event.request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Якщо немає мережі і кешу — показуємо index.html (SPA fallback)
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
