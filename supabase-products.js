(() => {
  const C = window.MM_SUPABASE;
  if (!C || !window.MM) return;

  // V59.1:
  // tabela exclusiva para não conflitar com a antiga "produtos".
  const base = C.url + '/rest/v1/produtos_mm';

  const initializedKey =
    'mm_products_supabase_initialized_v59_1';

  const commonHeaders = token => ({
    apikey: C.key,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token
      ? { Authorization: 'Bearer ' + token }
      : {})
  });

  async function readJson(response) {
    let data = null;

    try {
      data = await response.json();
    } catch {}

    if (!response.ok) {
      const message =
        (
          data &&
          (
            data.message ||
            data.hint ||
            data.details ||
            data.code
          )
        ) ||
        ('Erro ' + response.status);

      const error = new Error(message);

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }


  function fromRow(row) {
    return {
      id: String(row.id),
      name: row.nome || '',
      category: row.categoria || 'Cama',
      price: Number(row.preco || 0),
      stock: Number(row.estoque || 0),
      sold: Number(row.vendidos || 0),
      code: row.codigo || '',
      description: row.descricao || '',
      image: row.imagem || 'sem-imagem.svg',

      images:
        Array.isArray(row.imagens) &&
        row.imagens.length

          ? row.imagens

          : [
              row.imagem ||
              'sem-imagem.svg'
            ],

      isLaunch:
        !!row.lancamento,

      active:
        row.ativo !== false
    };
  }


  function toRow(product) {

    const images =
      Array.isArray(product.images) &&
      product.images.length

        ? product.images.filter(Boolean)

        : [
            product.image ||
            'sem-imagem.svg'
          ];


    return {
      id:
        String(product.id),

      nome:
        String(
          product.name || ''
        ).trim(),

      categoria:
        String(
          product.category ||
          'Cama'
        ),

      preco:
        Math.max(
          0,
          Number(
            product.price || 0
          )
        ),

      estoque:
        Math.max(
          0,
          Math.floor(
            Number(
              product.stock || 0
            )
          )
        ),

      vendidos:
        Math.max(
          0,
          Math.floor(
            Number(
              product.sold || 0
            )
          )
        ),

      codigo:
        String(
          product.code || ''
        ).trim() || null,

      descricao:
        String(
          product.description ||
          ''
        ),

      imagem:
        String(
          images[0] ||
          'sem-imagem.svg'
        ),

      imagens:
        images,

      lancamento:
        !!product.isLaunch,

      ativo:
        product.active !== false,

      updated_at:
        new Date().toISOString()
    };
  }


  function getToken() {

    return (
      window.MMAuth?.getToken?.() ||
      ''
    );

  }


  async function listPublic() {

    const query =
      '?select=' +
      'id,nome,categoria,preco,estoque,vendidos,' +
      'codigo,descricao,imagem,imagens,lancamento,ativo,created_at' +
      '&ativo=eq.true' +
      '&order=created_at.asc';


    const rows =
      await readJson(

        await fetch(
          base + query,
          {
            headers:
              commonHeaders()
          }
        )

      );


    return (
      rows || []
    ).map(fromRow);

  }


  async function listAdmin() {

    const token =
      getToken();


    if (!token) {

      throw new Error(
        'Faça login novamente para sincronizar os produtos.'
      );

    }


    const query =
      '?select=' +
      'id,nome,categoria,preco,estoque,vendidos,' +
      'codigo,descricao,imagem,imagens,lancamento,ativo,created_at' +
      '&order=created_at.asc';


    const rows =
      await readJson(

        await fetch(
          base + query,
          {
            headers:
              commonHeaders(token)
          }
        )

      );


    return (
      rows || []
    ).map(fromRow);

  }


  async function upsertAll(
    list,
    token
  ) {

    if (!list.length) {
      return;
    }


    const response =
      await fetch(

        base +
        '?on_conflict=id',

        {
          method:
            'POST',

          headers: {
            ...commonHeaders(token),

            Prefer:
              'resolution=merge-duplicates,return=minimal'
          },

          body:
            JSON.stringify(
              list.map(toRow)
            )
        }

      );


    if (!response.ok) {
      await readJson(response);
    }

  }


  async function deleteById(
    id,
    token
  ) {

    const response =
      await fetch(

        base +
        '?id=eq.' +
        encodeURIComponent(
          String(id)
        ),

        {
          method:
            'DELETE',

          headers: {
            ...commonHeaders(token),

            Prefer:
              'return=minimal'
          }
        }

      );


    if (!response.ok) {
      await readJson(response);
    }

  }


  async function syncAll(
    list
  ) {

    const token =
      getToken();


    /*
      Catálogo público não pode escrever.
      Sem login, mantém somente o cache local.
    */

    if (!token) {
      return false;
    }


    const safeList =
      Array.isArray(list)
        ? list
        : [];


    const remote =
      await listAdmin();


    /*
      Cadastra / atualiza tudo
      que existe no painel.
    */

    await upsertAll(
      safeList,
      token
    );


    /*
      Se um produto foi excluído no ADM,
      remove também do Supabase.
    */

    const localIds =
      new Set(

        safeList.map(
          product =>
            String(product.id)
        )

      );


    for (
      const product
      of remote
    ) {

      if (
        !localIds.has(
          String(product.id)
        )
      ) {

        await deleteById(
          product.id,
          token
        );

      }

    }


    localStorage.setItem(
      initializedKey,
      '1'
    );


    return true;

  }


  async function refresh() {

    const token =
      getToken();


    /*
      ADM:
      lê todos os produtos.
    */

    if (token) {

      const remote =
        await listAdmin();


      /*
        PRIMEIRA MIGRAÇÃO

        Se o Supabase estiver vazio,
        envia automaticamente os produtos
        que já existem no navegador.
      */

      if (
        !remote.length &&
        localStorage.getItem(
          initializedKey
        ) !== '1'
      ) {

        const local =
          window.MM.getProducts();


        if (local.length) {

          await syncAll(
            local
          );


          localStorage.setItem(
            initializedKey,
            '1'
          );


          return local;

        }

      }


      localStorage.setItem(
        initializedKey,
        '1'
      );


      window.MM
        .__replaceProductsFromRemote(
          remote
        );


      return remote;

    }


    /*
      CATÁLOGO PÚBLICO:
      somente produtos ativos.
    */

    const remote =
      await listPublic();


    /*
      Antes da primeira migração,
      uma tabela online vazia não apaga
      o catálogo que já estava no aparelho.
    */

    if (
      remote.length ||
      localStorage.getItem(
        initializedKey
      ) === '1'
    ) {

      localStorage.setItem(
        initializedKey,
        '1'
      );


      window.MM
        .__replaceProductsFromRemote(
          remote
        );

    }


    return remote;

  }


  const ready =
    refresh()
      .catch(error => {

        console.warn(
          'Produtos Supabase:',
          error
        );


        return window.MM
          .getProducts();

      });


  window.MMProducts = {
    ready,
    refresh,
    listPublic,
    listAdmin,
    syncAll
  };

  /*
    V59.2
    Quando a página do ADM abre, o importador de produtos é carregado
    antes de o administrador fazer login. A primeira leitura, portanto,
    acontece como visitante.

    Este ajuste reaplica refresh() imediatamente após um login bem-sucedido,
    garantindo a primeira migração dos produtos locais para produtos_mm.
  */
  function hookAdminLogin() {
    const auth = window.MMAuth;

    if (
      !auth ||
      typeof auth.login !== 'function' ||
      auth.__mmProductsLoginHook
    ) {
      return;
    }

    const originalLogin = auth.login.bind(auth);

    auth.login = async (...args) => {
      const result = await originalLogin(...args);

      try {
        await refresh();
      } catch (error) {
        console.warn(
          'Login realizado, mas a sincronização inicial dos produtos falhou:',
          error
        );
      }

      return result;
    };

    auth.__mmProductsLoginHook = true;
  }

  hookAdminLogin();

})();
