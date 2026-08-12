/* =====================================================
   MARGARIDA MARIA
   SERVICE WORKER
   V59 - PRODUTOS NO SUPABASE
===================================================== */

const CACHE = 'margarida-maria-v59-produtos-supabase-20260811';

const ASSETS = [
  'admin.html',
  'admin.js',
  'app.js',
  'categoria-banho.jpg',
  'categoria-cama.jpg',
  'categoria-infantil.jpg',
  'categoria-mesa.jpg',
  'clean-cama-azul.jpg',
  'clean-cama-pastel.jpg',
  'clean-mantas-coloridas.jpg',
  'clean-mantas-leque.jpg',
  'clean-panos-prato.jpg',
  'clean-tecidos.jpg',
  'clean-toalha-azul.jpg',
  'clean-toalhas-botanicas.jpg',
  'clean-toalhas-geo.jpg',
  'clean-toalhas-prateleira.jpg',
  'data.js',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  'index.html',
  'logo-margarida-maria.png',
  'manifest.json',
  'maria-logo.png',
  'maria.png',
  'produto-edredom-cinza.jpg',
  'produto-edredom-claro.jpg',
  'produto-infantil-pirata.jpg',
  'produto-infantil-princesa.jpg',
  'produto-mantas.jpg',
  'produto-toalhas-coloridas.jpg',
  'produto-toalhas-geometricas.jpg',
  'produto-toalhas-luxo.jpg',
  'produto-toalhas-moto.jpg',
  'produto-toalhas-verde.jpg',
  'scanner.html',
  'scanner.js',
  'sem-imagem.svg',
  'stories.js',
  'styles.css',
  'supplier-import.css',
  'supplier-import.js',
  'supabase-auth.js',
  'supabase-config.js',
  'supabase-products.js',
  'supabase-stories.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      for (const asset of ASSETS) {
        try {
          const response = await fetch(
            new Request(asset, { cache: 'reload' })
          );

          if (response.ok) {
            await cache.put(asset, response);
          }
        } catch (error) {
          console.warn(
            'Não foi possível atualizar:',
            asset
          );
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bibliotecas externas:
  // Supabase, SheetJS, ZXing etc.
  if (url.origin !== self.location.origin) return;

  const alwaysFresh = [
    '/scanner.html',
    '/scanner.js',
    '/admin.html',
    '/admin.js',
    '/index.html',
    '/data.js',
    '/supabase-products.js',
    '/supplier-import.js',
    '/supplier-import.css'
  ].some(path =>
    url.pathname.endsWith(path)
  );

  if (alwaysFresh) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE)
              .then(cache =>
                cache.put(request, copy)
              );
          }

          return response;
        })
        .catch(() =>
          caches.match(request)
        )
    );

    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE)
            .then(cache =>
              cache.put(request, copy)
            );
        }

        return response;
      })
      .catch(async () => {
        const cached =
          await caches.match(request);

        if (cached) return cached;

        if (
          request.mode === 'navigate'
        ) {
          return caches.match(
            'index.html'
          );
        }

        return new Response(
          'Offline',
          {
            status: 503,
            statusText: 'Offline'
          }
        );
      })
  );
});

self.addEventListener(
  'message',
  event => {
    if (
      event.data ===
      'SKIP_WAITING'
    ) {
      self.skipWaiting();
    }
  }
);
