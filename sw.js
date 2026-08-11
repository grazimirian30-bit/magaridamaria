/* =====================================================
   MARGARIDA MARIA
   SERVICE WORKER
   V57 - ATUALIZAÇÃO DO SCANNER
===================================================== */


/* =====================================================
   VERSÃO DO CACHE

   Sempre que fizermos uma atualização importante,
   mudamos este nome para o navegador abandonar
   os arquivos antigos.
===================================================== */

const CACHE = 'margarida-maria-v57-scanner-20260811';


/* =====================================================
   ARQUIVOS DO SITE
===================================================== */

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

  'supabase-auth.js',
  'supabase-config.js',
  'supabase-stories.js'

];


/* =====================================================
   INSTALAÇÃO

   Força a busca das versões mais novas
   dos arquivos.
===================================================== */

self.addEventListener(
  'install',
  event => {

    self.skipWaiting();


    event.waitUntil(

      caches
        .open(CACHE)
        .then(async cache => {

          for (const asset of ASSETS) {

            try {

              const response =
                await fetch(
                  new Request(
                    asset,
                    {
                      cache: 'reload'
                    }
                  )
                );


              if (response.ok) {

                await cache.put(
                  asset,
                  response
                );

              }

            }

            catch (error) {

              console.warn(
                'Não foi possível atualizar:',
                asset
              );

            }

          }

        })

    );

  }
);


/* =====================================================
   ATIVAÇÃO

   APAGA TODOS OS CACHES ANTIGOS
===================================================== */

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(cacheNames => {

          return Promise.all(

            cacheNames.map(
              cacheName => {

                if (
                  cacheName !== CACHE
                ) {

                  return caches.delete(
                    cacheName
                  );

                }

              }
            )

          );

        })

        .then(() => {

          return self.clients.claim();

        })

    );

  }
);


/* =====================================================
   REQUISIÇÕES DO SITE
===================================================== */

self.addEventListener(
  'fetch',
  event => {

    const request =
      event.request;


    /*
      Só trabalhamos com GET.
    */

    if (
      request.method !== 'GET'
    ) {

      return;

    }


    const url =
      new URL(request.url);


    /*
      Não interfere em arquivos
      externos como Supabase e ZXing.
    */

    if (
      url.origin !== self.location.origin
    ) {

      return;

    }


    /* =================================================
       SCANNER

       scanner.html e scanner.js sempre tentam
       buscar a versão NOVA primeiro,
       ignorando cache antigo do navegador.
    ================================================= */

    if (
      url.pathname.endsWith('/scanner.html') ||
      url.pathname.endsWith('/scanner.js')
    ) {

      event.respondWith(

        fetch(
          request,
          {
            cache: 'no-store'
          }
        )

          .then(response => {

            if (
              response &&
              response.ok
            ) {

              const copy =
                response.clone();


              caches
                .open(CACHE)
                .then(cache => {

                  cache.put(
                    request,
                    copy
                  );

                });

            }


            return response;

          })

          .catch(() => {

            return caches.match(
              request
            );

          })

      );


      return;

    }


    /* =================================================
       RESTANTE DO SITE

       Tenta internet primeiro.
       Se estiver offline, usa cache.
    ================================================= */

    event.respondWith(

      fetch(request)

        .then(response => {

          if (
            response &&
            response.ok
          ) {

            const copy =
              response.clone();


            caches
              .open(CACHE)
              .then(cache => {

                cache.put(
                  request,
                  copy
                );

              });

          }


          return response;

        })

        .catch(async () => {

          const cached =
            await caches.match(
              request
            );


          if (cached) {

            return cached;

          }


          /*
            Se for uma página e estiver offline,
            tenta abrir a página inicial.
          */

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

  }
);


/* =====================================================
   MENSAGEM PARA ATUALIZAÇÃO MANUAL

   Permite que futuramente o site mande
   uma ordem para ativar uma nova versão.
===================================================== */

self.addEventListener(
  'message',
  event => {

    if (
      event.data === 'SKIP_WAITING'
    ) {

      self.skipWaiting();

    }

  }
);
