/* =====================================================
   MARGARIDA MARIA
   PAINEL ADMINISTRATIVO
===================================================== */

const $ = s => document.querySelector(s);

const page = $('#page');

const {
  getProducts,
  saveProducts,
  money,
  toast,
  escape,
  readImageFile
} = MM;


/* =====================================================
   SCANNER → CADASTRO DE PRODUTO
===================================================== */

function getScannerProductCode() {

  const params =
    new URLSearchParams(location.search);

  const codeFromUrl =
    String(params.get('novoProduto') || '').trim();

  const codeFromSession =
    String(
      sessionStorage.getItem(
        'mm_new_product_code'
      ) || ''
    ).trim();

  return codeFromUrl || codeFromSession;
}


function clearScannerProductCode() {

  sessionStorage.removeItem(
    'mm_new_product_code'
  );

  try {

    const url =
      new URL(location.href);

    url.searchParams.delete(
      'novoProduto'
    );

    history.replaceState(
      null,
      '',
      url.pathname +
      url.search +
      url.hash
    );

  }

  catch (error) {

    console.warn(
      'Não foi possível limpar a URL.',
      error
    );

  }

}


function activateAdminNav(pageName) {

  document
    .querySelectorAll('[data-page]')
    .forEach(item => {

      item.classList.toggle(
        'active',
        item.dataset.page === pageName
      );

    });

}


function openProductFromScanner() {

  const code =
    getScannerProductCode();

  if (!code) {

    return false;
  }


  const existing =
    getProducts().find(product => {

      return (
        String(product.code || '').trim()
        ===
        code
      );

    });


  activateAdminNav(
    'products'
  );


  /*
    Se por algum motivo o código
    já estiver cadastrado,
    abre o produto existente.
  */

  if (existing) {

    editProduct(
      existing.id
    );

    toast(
      'Produto já cadastrado'
    );

  }

  else {

    /*
      Produto novo.
      Abre o formulário já com
      o código preenchido.
    */

    editProduct(
      null,
      code
    );

  }


  clearScannerProductCode();

  return true;
}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

  const email =
    $('#adminUser').value.trim();

  const password =
    $('#adminPass').value;


  if (
    !email ||
    !password
  ) {

    return alert(
      'Informe e-mail e senha.'
    );

  }


  try {

    await MMAuth.login(
      email,
      password
    );


    sessionStorage.setItem(
      'mm_admin_ok',
      '1'
    );


    showApp();

  }

  catch (error) {

    alert(
      'Não foi possível entrar: ' +
      error.message
    );

  }

}


/* =====================================================
   MOSTRAR ADMIN
===================================================== */

function showApp() {

  if (
    sessionStorage.getItem(
      'mm_admin_ok'
    ) !== '1' ||
    !MMAuth.isLogged()
  ) {

    return;

  }


  $('#loginView').hidden =
    true;

  $('#recoveryView').hidden =
    true;

  $('#adminApp').hidden =
    false;


  /*
    PRIMEIRO verifica se estamos
    voltando do scanner.
  */

  if (
    openProductFromScanner()
  ) {

    return;
  }


  /*
    Entrada normal no ADM.
  */

  render(
    'dashboard'
  );

}


/* =====================================================
   BOTÕES DE LOGIN
===================================================== */

$('#loginBtn').onclick =
  login;


$('#adminPass').onkeydown =
  event => {

    if (
      event.key === 'Enter'
    ) {

      login();

    }

  };


$('#logoutBtn').onclick =
  () => {

    sessionStorage.removeItem(
      'mm_admin_ok'
    );

    MMAuth.logout();

    location.reload();

  };


/* =====================================================
   RECUPERAÇÃO DE SENHA
===================================================== */

$('#forgotBtn').onclick =
  async () => {

    const email =
      $('#adminUser').value.trim();


    if (!email) {

      return alert(
        'Digite o e-mail do administrador.'
      );

    }


    try {

      await MMAuth
        .requestPasswordReset(
          email
        );


      alert(
        'E-mail de recuperação enviado. ' +
        'Abra o link mais recente recebido.'
      );

    }

    catch (error) {

      alert(
        'Não foi possível enviar: ' +
        error.message
      );

    }

  };


$('#saveRecovery').onclick =
  async () => {

    const password =
      $('#recoveryPass').value;

    const password2 =
      $('#recoveryPass2').value;


    if (
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {

      return alert(
        'Use pelo menos 10 caracteres, ' +
        'com maiúscula, minúscula e número.'
      );

    }


    if (
      password !== password2
    ) {

      return alert(
        'As duas senhas precisam ser iguais.'
      );

    }


    try {

      await MMAuth.updatePassword(
        password
      );


      history.replaceState(
        null,
        '',
        location.pathname
      );


      MMAuth.logout();


      $('#recoveryView').hidden =
        true;

      $('#loginView').hidden =
        false;


      alert(
        'Senha alterada. ' +
        'Agora entre com a nova senha.'
      );

    }

    catch (error) {

      alert(
        'Não foi possível alterar: ' +
        error.message
      );

    }

  };


/* =====================================================
   MENU
===================================================== */

$('#menuBtn').onclick =
  () => {

    $('#adminNav')
      .classList
      .toggle('open');

  };


document
  .querySelectorAll('[data-page]')
  .forEach(item => {

    item.onclick = () => {

      document
        .querySelectorAll('[data-page]')
        .forEach(nav => {

          nav.classList.remove(
            'active'
          );

        });


      item.classList.add(
        'active'
      );


      render(
        item.dataset.page
      );


      if (
        innerWidth < 800
      ) {

        $('#adminNav')
          .classList
          .remove('open');

      }

    };

  });


/* =====================================================
   NAVEGAÇÃO DAS PÁGINAS
===================================================== */

function render(where) {

  const pages = {

    dashboard,

    products:
      productsPage,

    sales,

    launches,

    users,

    site:
      sitePage,

    stories:
      storiesPage,

    settings

  };


  (
    pages[where] ||
    dashboard
  )();

}


/* =====================================================
   ESTOQUE BAIXO
===================================================== */

function low() {

  return Number(
    localStorage.getItem(
      'mm_low_stock'
    ) || 5
  );

}


/* =====================================================
   DASHBOARD
===================================================== */

function dashboard() {

  const products =
    getProducts();


  const stock =
    products.reduce(
      (
        total,
        product
      ) => {

        return (
          total +
          Number(
            product.stock || 0
          )
        );

      },
      0
    );


  const sold =
    products.reduce(
      (
        total,
        product
      ) => {

        return (
          total +
          Number(
            product.sold || 0
          )
        );

      },
      0
    );


  const lowStock =
    products.filter(
      product => {

        return (
          product.active !== false &&
          Number(
            product.stock || 0
          ) <= low()
        );

      }
    ).length;


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Administração
        </span>

        <h1>
          Painel Margarida Maria
        </h1>

        <p class="muted">
          Acesso rápido às principais funções da loja.
        </p>

      </div>


      <a
        class="btn secondary"
        href="index.html"
      >
        Abrir catálogo
      </a>

    </div>


    <div class="admin-quick-grid">

      <button
        class="admin-quick"
        data-go="products"
      >

        <span class="qicon">
          📦
        </span>

        <strong>
          Produtos e estoque
        </strong>

        <small>
          Cadastrar, editar, fotos e estoque
        </small>

      </button>


      <button
        class="admin-quick"
        data-go="users"
      >

        <span class="qicon">
          👥
        </span>

        <strong>
          Clientes
        </strong>

        <small>
          Ver cadastros e contatos
        </small>

      </button>


      <button
        class="admin-quick"
        data-go="launches"
      >

        <span class="qicon">
          📣
        </span>

        <strong>
          Divulgação / Status
        </strong>

        <small>
          Criar arte pronta com a logo
        </small>

      </button>


      <button
        class="admin-quick"
        onclick="location.href='scanner.html'"
      >

        <span class="qicon">
          📷
        </span>

        <strong>
          Scanner
        </strong>

        <small>
          Ler códigos pelo celular
        </small>

      </button>


      <button
        class="admin-quick"
        data-go="site"
      >

        <span class="qicon">
          🖼️
        </span>

        <strong>
          Organizar site
        </strong>

        <small>
          Capas, categorias e vitrine
        </small>

      </button>


      <button
        class="admin-quick"
        data-go="settings"
      >

        <span class="qicon">
          🔐
        </span>

        <strong>
          Segurança
        </strong>

        <small>
          Senha e backup
        </small>

      </button>


      <button
        class="admin-quick"
        data-go="stories"
      >

        <span class="qicon">
          💬
        </span>

        <strong>
          Histórias da Maria
        </strong>

        <small>
          Criar quadrinhos rápidos e publicar no site
        </small>

      </button>

    </div>


    <div class="kpis">

      <div class="kpi">

        <span>
          Produtos
        </span>

        <strong>
          ${products.length}
        </strong>

      </div>


      <div class="kpi">

        <span>
          Estoque total
        </span>

        <strong>
          ${stock}
        </strong>

      </div>


      <div class="kpi">

        <span>
          Vendas
        </span>

        <strong>
          ${sold}
        </strong>

      </div>


      <div class="kpi">

        <span>
          Estoque baixo
        </span>

        <strong>
          ${lowStock}
        </strong>

      </div>

    </div>


    <section class="admin-section">

      <h2>
        Estoque baixo
      </h2>

      ${
        products

          .filter(
            product => {

              return (
                Number(
                  product.stock || 0
                ) <= low()
              );

            }
          )

          .map(
            product => `

              <div class="notice stock-note">

                ${escape(product.name)}:

                <strong>
                  ${product.stock}
                </strong>

              </div>
            `
          )

          .join('')

        ||

        '<p>Tudo certo com o estoque.</p>'
      }

    </section>
  `;

}


/* =====================================================
   PRODUTOS E ESTOQUE
===================================================== */

function productsPage() {

  const products =
    getProducts();


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Catálogo
        </span>

        <h1>
          Produtos e estoque
        </h1>

      </div>


      <button
        class="btn primary"
        id="newProduct"
      >
        + Adicionar peça
      </button>

    </div>


    <div class="table-wrap">

      <table class="table">

        <thead>

          <tr>

            <th>
              Foto
            </th>

            <th>
              Produto
            </th>

            <th>
              Categoria
            </th>

            <th>
              Preço
            </th>

            <th>
              Estoque
            </th>

            <th>
              Vendidos
            </th>

            <th>
              Status
            </th>

            <th>
              Ações
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            products
              .map(
                product => `

                  <tr>

                    <td>

                      <img
                        class="table-thumb"
                        src="${escape(product.image)}"
                      >

                    </td>


                    <td>

                      <strong>
                        ${escape(product.name)}
                      </strong>

                    </td>


                    <td>
                      ${escape(product.category)}
                    </td>


                    <td>
                      ${money(product.price)}
                    </td>


                    <td>
                      ${product.stock}
                    </td>


                    <td>
                      ${product.sold || 0}
                    </td>


                    <td>

                      ${
                        product.active === false
                          ? 'Oculto'
                          : 'Publicado'
                      }

                    </td>


                    <td>

                      <div class="table-actions">

                        <button
                          class="btn tiny secondary edit"
                          data-id="${product.id}"
                        >
                          Editar
                        </button>


                        <button
                          class="btn tiny primary sale"
                          data-id="${product.id}"
                          ${
                            product.stock < 1
                              ? 'disabled'
                              : ''
                          }
                        >
                          Venda +1
                        </button>

                      </div>

                    </td>

                  </tr>
                `
              )
              .join('')
          }

        </tbody>

      </table>

    </div>
  `;


  $('#newProduct').onclick =
    () => editProduct();


  document
    .querySelectorAll('.edit')
    .forEach(button => {

      button.onclick =
        () => editProduct(
          button.dataset.id
        );

    });


  document
    .querySelectorAll('.sale')
    .forEach(button => {

      button.onclick =
        () => sale(
          button.dataset.id
        );

    });

}


/* =====================================================
   REGISTRAR VENDA
===================================================== */

function sale(id) {

  const products =
    getProducts();


  const product =
    products.find(
      item => item.id === id
    );


  if (
    !product ||
    product.stock < 1
  ) {

    return;

  }


  product.stock--;

  product.sold =
    (product.sold || 0) + 1;


  saveProducts(
    products
  );


  productsPage();


  toast(
    'Venda registrada'
  );

}


/* =====================================================
   ADICIONAR / EDITAR PRODUTO

   initialCode recebe automaticamente
   o código vindo do scanner.
===================================================== */

function editProduct(
  id,
  initialCode = ''
) {

  const products =
    getProducts();


  const found =
    products.find(
      product =>
        product.id === id
    );


  const product =
    found

      ? {
          ...found
        }

      : {

          id:
            'p' + Date.now(),

          name:
            '',

          category:
            'Cama',

          price:
            0,

          stock:
            0,

          sold:
            0,

          code:
            String(
              initialCode || ''
            ).trim(),

          description:
            '',

          image:
            'sem-imagem.svg',

          images:
            [
              'sem-imagem.svg'
            ],

          isLaunch:
            false,

          active:
            true

        };


  let images =
    (
      product.images?.length

        ? [
            ...product.images
          ]

        : [
            product.image
          ]
    )
    .slice(
      0,
      8
    );


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Produto
        </span>

        <h1>
          ${id ? 'Editar' : 'Adicionar'} peça
        </h1>

        ${
          !id &&
          initialCode

            ? `

              <p class="muted">
                📷 Código recebido pelo scanner:
                <strong>
                  ${escape(initialCode)}
                </strong>
              </p>
            `

            : ''
        }

      </div>

    </div>


    <div class="product-editor">


      <div class="image-editor">

        <img
          id="imagePreview"
          src="${escape(images[0])}"
        >


        <label class="btn secondary file-btn">

          Adicionar fotos

          <input
            id="fFile"
            type="file"
            accept="image/*"
            multiple
            hidden
          >

        </label>


        <p class="muted small">
          Até 8 fotos. Clique numa miniatura
          para torná-la principal.
        </p>


        <div
          class="admin-image-gallery"
          id="adminImageGallery"
        ></div>

      </div>


      <div class="form-grid">


        <div class="field full">

          <label>
            Nome
          </label>

          <input
            id="fName"
            value="${escape(product.name)}"
          >

        </div>


        <div class="field">

          <label>
            Categoria
          </label>

          <select id="fCat">

            <option value="Cama">
              Roupa de cama
            </option>

            <option value="Mesa">
              Mesa
            </option>

            <option value="Banho">
              Banho
            </option>

            <option value="Infantil">
              Infantil
            </option>

          </select>

        </div>


        <div class="field">

          <label>
            Preço
          </label>

          <input
            id="fPrice"
            type="number"
            step=".01"
            value="${product.price || 0}"
          >

        </div>


        <div class="field">

          <label>
            Estoque
          </label>

          <input
            id="fStock"
            type="number"
            value="${product.stock || 0}"
          >

        </div>


        <div class="field">

          <label>
            Vendidos
          </label>

          <input
            id="fSold"
            type="number"
            value="${product.sold || 0}"
          >

        </div>


        <div class="field full">

          <label>
            Código de barras / QR
          </label>

          <input
            id="fCode"
            value="${escape(product.code || '')}"
            autocomplete="off"
          >

        </div>


        <div class="field full">

          <label>
            Descrição completa
          </label>

          <textarea
            id="fDesc"
            rows="6"
          >${escape(product.description || '')}</textarea>

        </div>


        <label class="check-row">

          <input
            id="fLaunch"
            type="checkbox"
            ${
              product.isLaunch
                ? 'checked'
                : ''
            }
          >

          Marcar como lançamento

        </label>


        <label class="check-row">

          <input
            id="fActive"
            type="checkbox"
            ${
              product.active !== false
                ? 'checked'
                : ''
            }
          >

          Mostrar no catálogo

        </label>

      </div>

    </div>


    <div class="actions mt16">

      <button
        class="btn primary"
        id="saveP"
      >
        Salvar
      </button>


      <button
        class="btn secondary"
        id="cancelP"
      >
        Cancelar
      </button>


      ${
        id

          ? `

            <button
              class="btn danger"
              id="delP"
            >
              Excluir
            </button>
          `

          : ''
      }

    </div>
  `;


  $('#fCat').value =
    product.category || 'Cama';


  /* ===================================================
     GALERIA DE IMAGENS
  =================================================== */

  function renderImages() {

    if (
      !images.length
    ) {

      images = [
        'sem-imagem.svg'
      ];

    }


    $('#adminImageGallery')
      .innerHTML =

      images
        .map(
          (
            image,
            index
          ) => `

            <div
              class="
                admin-image-item
                ${
                  index === 0
                    ? 'main'
                    : ''
                }
              "
            >

              <button
                class="admin-image-main"
                data-main="${index}"
              >

                <img
                  src="${escape(image)}"
                >

              </button>


              <button
                class="admin-image-remove"
                data-remove="${index}"
              >
                ×
              </button>


              ${
                index === 0
                  ? '<span>Principal</span>'
                  : ''
              }

            </div>
          `
        )
        .join('');


    document
      .querySelectorAll(
        '[data-main]'
      )
      .forEach(button => {

        button.onclick =
          () => {

            const index =
              Number(
                button.dataset.main
              );


            const [
              selected
            ] =
              images.splice(
                index,
                1
              );


            images.unshift(
              selected
            );


            $('#imagePreview').src =
              images[0];


            renderImages();

          };

      });


    document
      .querySelectorAll(
        '[data-remove]'
      )
      .forEach(button => {

        button.onclick =
          () => {

            images.splice(
              Number(
                button.dataset.remove
              ),
              1
            );


            $('#imagePreview').src =
              images[0] ||
              'sem-imagem.svg';


            renderImages();

          };

      });

  }


  renderImages();


  /* ===================================================
     ADICIONAR FOTOS
  =================================================== */

  $('#fFile').onchange =
    async event => {

      for (
        const file
        of [
          ...event.target.files
        ]
      ) {

        if (
          images.length >= 8
        ) {

          break;

        }


        if (
          images.length === 1 &&
          images[0] ===
            'sem-imagem.svg'
        ) {

          images = [];

        }


        images.push(

          await readImageFile(
            file,
            1000,
            .78
          )

        );

      }


      $('#imagePreview').src =
        images[0];


      renderImages();

    };


  /* ===================================================
     SALVAR PRODUTO
  =================================================== */

  $('#saveP').onclick =
    () => {

      product.name =
        $('#fName').value.trim();


      if (
        !product.name
      ) {

        return alert(
          'Informe o nome.'
        );

      }


      const newCode =
        $('#fCode').value.trim();


      /*
        PROTEÇÃO CONTRA
        CÓDIGO DUPLICADO.
      */

      if (newCode) {

        const duplicate =
          products.find(
            otherProduct => {

              return (
                otherProduct.id
                  !== product.id
                &&
                String(
                  otherProduct.code || ''
                ).trim()
                  === newCode
              );

            }
          );


        if (duplicate) {

          return alert(

            'Este código já está cadastrado no produto "' +
            duplicate.name +
            '".'

          );

        }

      }


      product.category =
        $('#fCat').value;


      product.price =
        Math.max(
          0,
          Number(
            $('#fPrice').value
          ) || 0
        );


      product.stock =
        Math.max(
          0,
          Number(
            $('#fStock').value
          ) || 0
        );


      product.sold =
        Math.max(
          0,
          Number(
            $('#fSold').value
          ) || 0
        );


      product.code =
        newCode;


      product.description =
        $('#fDesc').value.trim();


      product.images =
        images;


      product.image =
        images[0] ||
        'sem-imagem.svg';


      product.isLaunch =
        $('#fLaunch').checked;


      product.active =
        $('#fActive').checked;


      const index =
        products.findIndex(
          existingProduct => {

            return (
              existingProduct.id ===
              product.id
            );

          }
        );


      if (
        index >= 0
      ) {

        products[index] =
          product;

      }

      else {

        products.push(
          product
        );

      }


      try {

        saveProducts(
          products
        );

      }

      catch (error) {

        return alert(
          'Sem espaço no navegador. ' +
          'Use fotos menores.'
        );

      }


      productsPage();


      toast(
        'Produto salvo'
      );

    };


  /* ===================================================
     CANCELAR
  =================================================== */

  $('#cancelP').onclick =
    productsPage;


  /* ===================================================
     EXCLUIR
  =================================================== */

  if (id) {

    $('#delP').onclick =
      () => {

        if (
          confirm(
            'Excluir este produto?'
          )
        ) {

          saveProducts(

            products.filter(
              existingProduct => {

                return (
                  existingProduct.id !==
                  id
                );

              }
            )

          );


          productsPage();

        }

      };

  }

}


/* =====================================================
   MAIS VENDIDOS
===================================================== */

function sales() {

  const products =
    [
      ...getProducts()
    ]
    .sort(
      (
        productA,
        productB
      ) => {

        return (
          (productB.sold || 0)
          -
          (productA.sold || 0)
        );

      }
    );


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Desempenho
        </span>

        <h1>
          Mais vendidos
        </h1>

      </div>

    </div>


    <div class="table-wrap">

      <table class="table">

        <thead>

          <tr>

            <th>#</th>

            <th>
              Produto
            </th>

            <th>
              Vendidos
            </th>

            <th>
              Estoque
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            products
              .map(
                (
                  product,
                  index
                ) => `

                  <tr>

                    <td>

                      <strong>
                        #${index + 1}
                      </strong>

                    </td>

                    <td>
                      ${escape(product.name)}
                    </td>

                    <td>
                      ${product.sold || 0}
                    </td>

                    <td>
                      ${product.stock || 0}
                    </td>

                  </tr>
                `
              )
              .join('')
          }

        </tbody>

      </table>

    </div>
  `;

}


/* =====================================================
   LANÇAMENTOS / WHATSAPP
===================================================== */

function launches() {

  const products =
    getProducts()
      .filter(
        product =>
          product.active !== false
      );


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Divulgação
        </span>

        <h1>
          Lançamentos / WhatsApp
        </h1>

      </div>

    </div>


    <div class="form-grid">

      <div class="field">

        <label>
          Produto
        </label>

        <select id="launchP">

          ${
            products
              .map(
                product => `

                  <option
                    value="${product.id}"
                  >
                    ${escape(product.name)}
                  </option>
                `
              )
              .join('')
          }

        </select>

      </div>


      <div class="field">

        <label>
          WhatsApp
        </label>

        <input
          id="launchPhone"
          value="${MM.getWhatsApp()}"
        >

      </div>


      <div class="field full">

        <label>
          Mensagem
        </label>

        <textarea
          id="launchText"
          rows="5"
        >✨ Novidade Margarida Maria! Conheça este lançamento.</textarea>

      </div>

    </div>


    <div
      class="launch-preview"
      id="launchPreview"
    ></div>


    <div class="actions mt16">

      <button
        class="btn primary"
        id="sendLaunch"
      >
        Abrir no WhatsApp
      </button>


      <button
        class="btn secondary"
        id="downloadLaunch"
      >
        Baixar arte com logo
      </button>

    </div>
  `;


  function selectedProduct() {

    return products.find(
      product =>
        product.id ===
        $('#launchP').value
    );

  }


  function previewLaunch() {

    const product =
      selectedProduct();


    if (!product) {

      return;

    }


    $('#launchPreview')
      .innerHTML = `

        <img
          class="logo"
          src="logo-margarida-maria.png"
        >


        <div>

          <span class="launch-badge inline">
            Lançamento
          </span>

          <h2>
            ${escape(product.name)}
          </h2>

          <div class="price big">
            ${money(product.price)}
          </div>

        </div>


        <img
          class="product"
          src="${escape(product.image)}"
        >
      `;

  }


  previewLaunch();


  $('#launchP').onchange =
    previewLaunch;


  $('#sendLaunch').onclick =
    () => {

      const product =
        selectedProduct();


      if (!product) {

        return;

      }


      const phone =
        $('#launchPhone')
          .value
          .replace(
            /\D/g,
            ''
          );


      localStorage.setItem(
        'mm_whatsapp',
        phone
      );


      const productUrl =
        new URL(
          'index.html',
          location.href
        );


      productUrl.hash =
        'produto-' +
        product.id;


      window.open(

        `https://wa.me/${phone}?text=${
          encodeURIComponent(
            $('#launchText').value +
            '\n\n' +
            product.name +
            ' — ' +
            money(product.price) +
            '\n' +
            productUrl.href
          )
        }`,

        '_blank'

      );

    };


  $('#downloadLaunch').onclick =
    async () => {

      const product =
        selectedProduct();


      if (!product) {

        return;

      }


      const canvas =
        document.createElement(
          'canvas'
        );


      canvas.width =
        1080;

      canvas.height =
        1350;


      const context =
        canvas.getContext(
          '2d'
        );


      context.fillStyle =
        '#faf7ef';

      context.fillRect(
        0,
        0,
        1080,
        1350
      );


      context.fillStyle =
        '#17624a';

      context.fillRect(
        0,
        0,
        1080,
        170
      );


      const logo =
        await loadImg(
          'logo-margarida-maria.png'
        );


      context.drawImage(
        logo,
        55,
        35,
        360,
        100
      );


      const productImage =
        await loadImg(
          product.image
        );


      const ratio =
        Math.min(

          940 /
          productImage.width,

          700 /
          productImage.height

        );


      const width =
        productImage.width *
        ratio;


      const height =
        productImage.height *
        ratio;


      context.drawImage(

        productImage,

        70 +
        (940 - width) / 2,

        270 +
        (700 - height) / 2,

        width,

        height

      );


      context.fillStyle =
        '#17352b';


      context.font =
        '700 52px sans-serif';


      context.fillText(
        product.name,
        60,
        1050
      );


      context.fillStyle =
        '#17624a';


      context.font =
        '800 58px sans-serif';


      context.fillText(
        money(product.price),
        60,
        1140
      );


      canvas.toBlob(
        blob => {

          const link =
            document.createElement(
              'a'
            );


          link.href =
            URL.createObjectURL(
              blob
            );


          link.download =
            'lancamento-margarida-maria.png';


          link.click();

        }
      );

    };

}


/* =====================================================
   CARREGAR IMAGEM
===================================================== */

function loadImg(src) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const image =
        new Image();


      image.onload =
        () => resolve(
          image
        );


      image.onerror =
        reject;


      image.src =
        src;

    }
  );

}


/* =====================================================
   CLIENTES
===================================================== */

function users() {

  let usersList =
    JSON.parse(
      localStorage.getItem(
        'mm_users'
      ) || '[]'
    );


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Relacionamento
        </span>

        <h1>
          Clientes
        </h1>

      </div>


      <button
        class="btn primary"
        id="addU"
      >
        + Cadastrar cliente
      </button>

    </div>


    <div class="table-wrap">

      <table class="table">

        <thead>

          <tr>

            <th>
              Nome
            </th>

            <th>
              Telefone
            </th>

            <th>
              E-mail
            </th>

            <th>
              Ação
            </th>

          </tr>

        </thead>


        <tbody>

          ${
            usersList
              .map(
                (
                  user,
                  index
                ) => `

                  <tr>

                    <td>
                      ${escape(user.name)}
                    </td>

                    <td>
                      ${escape(user.phone)}
                    </td>

                    <td>
                      ${escape(user.email)}
                    </td>

                    <td>

                      <button
                        class="btn tiny danger"
                        data-du="${index}"
                      >
                        Excluir
                      </button>

                    </td>

                  </tr>
                `
              )
              .join('')

            ||

            `
              <tr>
                <td colspan="4">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            `
          }

        </tbody>

      </table>

    </div>


    <div
      class="modal"
      id="userModal"
    >

      <div class="modal-box">

        <button
          class="modal-close"
          id="closeUser"
        >
          ×
        </button>


        <h2>
          Cadastrar cliente
        </h2>


        <div class="field">

          <label>
            Nome
          </label>

          <input id="uName">

        </div>


        <div class="field mt10">

          <label>
            Telefone
          </label>

          <input id="uPhone">

        </div>


        <div class="field mt10">

          <label>
            E-mail
          </label>

          <input id="uEmail">

        </div>


        <button
          class="btn primary mt16"
          id="saveU"
        >
          Salvar
        </button>

      </div>

    </div>
  `;


  $('#addU').onclick =
    () => {

      $('#userModal')
        .classList
        .add('open');

    };


  $('#closeUser').onclick =
    () => {

      $('#userModal')
        .classList
        .remove('open');

    };


  $('#saveU').onclick =
    () => {

      const name =
        $('#uName').value.trim();


      if (!name) {

        return;

      }


      usersList.push({

        name,

        phone:
          $('#uPhone')
            .value
            .trim(),

        email:
          $('#uEmail')
            .value
            .trim()

      });


      localStorage.setItem(

        'mm_users',

        JSON.stringify(
          usersList
        )

      );


      users();

    };


  document
    .querySelectorAll('[data-du]')
    .forEach(button => {

      button.onclick =
        () => {

          usersList.splice(
            Number(
              button.dataset.du
            ),
            1
          );


          localStorage.setItem(

            'mm_users',

            JSON.stringify(
              usersList
            )

          );


          users();

        };

    });

}


/* =====================================================
   ORGANIZAR SITE
===================================================== */

function sitePage() {

  const site =
    MM.getSite();


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Vitrine
        </span>

        <h1>
          Organizar site
        </h1>

      </div>


      <a
        class="btn secondary"
        href="index.html"
      >
        Visualizar
      </a>

    </div>


    <div class="settings-grid">


      <section class="settings-card">

        <h2>
          Topo do site
        </h2>


        <div class="field">

          <label>
            Título
          </label>

          <input
            id="heroT"
            value="${escape(site.heroTitle)}"
          >

        </div>


        <div class="field mt10">

          <label>
            Texto
          </label>

          <textarea
            id="heroX"
            rows="4"
          >${escape(site.heroText)}</textarea>

        </div>


        <label class="check-row">

          <input
            id="showCats"
            type="checkbox"
            ${
              site.showCategories !== false
                ? 'checked'
                : ''
            }
          >

          Mostrar categorias

        </label>


        <label class="check-row">

          <input
            id="showLaunch"
            type="checkbox"
            ${
              site.showLaunches !== false
                ? 'checked'
                : ''
            }
          >

          Mostrar lançamentos

        </label>

      </section>


      <section class="settings-card full-card">

        <h2>
          Fotos e nomes das categorias
        </h2>


        <div class="category-admin-grid">

          ${
            [
              'Cama',
              'Mesa',
              'Banho',
              'Infantil'
            ]
            .map(
              category => `

                <div class="category-admin">

                  <img
                    id="catImg${category}"
                    src="${escape(
                      site.categories[
                        category
                      ].image
                    )}"
                  >


                  <div class="field">

                    <label>
                      ${category} - nome exibido
                    </label>

                    <input
                      id="catLabel${category}"
                      value="${escape(
                        site.categories[
                          category
                        ].label
                      )}"
                    >

                  </div>


                  <label
                    class="btn secondary file-btn"
                  >

                    Trocar foto

                    <input
                      type="file"
                      data-cat-file="${category}"
                      accept="image/*"
                      hidden
                    >

                  </label>

                </div>
              `
            )
            .join('')
          }

        </div>

      </section>

    </div>


    <button
      class="btn primary mt16"
      id="saveSite"
    >
      Salvar organização
    </button>
  `;


  let categories =
    JSON.parse(
      JSON.stringify(
        site.categories
      )
    );


  document
    .querySelectorAll(
      '[data-cat-file]'
    )
    .forEach(input => {

      input.onchange =
        async event => {

          const category =
            input.dataset.catFile;


          const file =
            event.target.files[0];


          if (file) {

            categories[
              category
            ].image =

              await readImageFile(
                file,
                1200,
                .82
              );


            $(
              '#catImg' +
              category
            ).src =

              categories[
                category
              ].image;

          }

        };

    });


  $('#saveSite').onclick =
    () => {

      for (
        const category
        of [
          'Cama',
          'Mesa',
          'Banho',
          'Infantil'
        ]
      ) {

        categories[
          category
        ].label =

          $(
            '#catLabel' +
            category
          )
          .value
          .trim()

          ||

          category;

      }


      MM.saveSite({

        heroTitle:
          $('#heroT')
            .value
            .trim(),

        heroText:
          $('#heroX')
            .value
            .trim(),

        showCategories:
          $('#showCats').checked,

        showLaunches:
          $('#showLaunch').checked,

        categories

      });


      toast(
        'Site organizado e salvo'
      );

    };

}


/* =====================================================
   SEGURANÇA E BACKUP
===================================================== */

function settings() {

  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Sistema
        </span>

        <h1>
          Segurança e backup
        </h1>

      </div>

    </div>


    <div class="settings-grid">


      <section class="settings-card">

        <h2>
          WhatsApp e estoque
        </h2>


        <div class="field">

          <label>
            WhatsApp
          </label>

          <input
            id="setPhone"
            value="${MM.getWhatsApp()}"
          >

        </div>


        <div class="field mt10">

          <label>
            Estoque baixo a partir de
          </label>

          <input
            id="setLow"
            type="number"
            value="${low()}"
          >

        </div>


        <button
          class="btn primary mt16"
          id="saveSettings"
        >
          Salvar
        </button>

      </section>


      <section class="settings-card">

        <h2>
          Alterar senha
        </h2>


        <div class="field">

          <label>
            Nova senha segura
          </label>

          <input
            id="newPass"
            type="password"
            placeholder="10+ caracteres, maiúscula, minúscula e número"
          >

          <p class="muted small">
            Use pelo menos 10 caracteres
            com maiúscula, minúscula e número.
          </p>

        </div>


        <button
          class="btn secondary mt16"
          id="changePass"
        >
          Alterar senha
        </button>

      </section>


      <section class="settings-card">

        <h2>
          Backup
        </h2>


        <div class="actions">

          <button
            class="btn secondary"
            id="exportBackup"
          >
            Exportar
          </button>


          <label
            class="btn secondary file-btn"
          >

            Importar

            <input
              id="importBackup"
              type="file"
              accept="application/json"
              hidden
            >

          </label>

        </div>

      </section>


      <section class="settings-card">

        <h2>
          Segurança online
        </h2>

        <p class="muted">
          Login administrativo protegido pelo Supabase.
          As Histórias da Maria também ficam salvas online
          e podem ser publicadas pelo painel.
        </p>

      </section>

    </div>
  `;


  $('#saveSettings').onclick =
    () => {

      localStorage.setItem(

        'mm_whatsapp',

        $('#setPhone')
          .value
          .replace(
            /\D/g,
            ''
          )

      );


      localStorage.setItem(

        'mm_low_stock',

        String(

          Math.max(
            0,
            Number(
              $('#setLow').value
            ) || 5
          )

        )

      );


      toast(
        'Salvo'
      );

    };


  $('#changePass').onclick =
    async () => {

      const password =
        $('#newPass').value;


      if (
        password.length < 10 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {

        return alert(
          'Use pelo menos 10 caracteres, ' +
          'com letra maiúscula, minúscula e número.'
        );

      }


      try {

        await MMAuth.updatePassword(
          password
        );


        toast(
          'Senha alterada com segurança'
        );

      }

      catch (error) {

        alert(
          'Não foi possível alterar: ' +
          error.message
        );

      }

    };


  $('#exportBackup').onclick =
    () => {

      const data = {

        products:
          getProducts(),

        users:
          JSON.parse(
            localStorage.getItem(
              'mm_users'
            ) || '[]'
          ),

        site:
          MM.getSite(),

        whatsapp:
          MM.getWhatsApp()

      };


      const link =
        document.createElement(
          'a'
        );


      link.href =
        URL.createObjectURL(

          new Blob(
            [
              JSON.stringify(
                data,
                null,
                2
              )
            ],
            {
              type:
                'application/json'
            }
          )

        );


      link.download =
        'margarida-maria-backup.json';


      link.click();

    };


  $('#importBackup').onchange =
    event => {

      const file =
        event.target.files[0];


      if (!file) {

        return;

      }


      const reader =
        new FileReader();


      reader.onload =
        () => {

          try {

            const data =
              JSON.parse(
                reader.result
              );


            if (
              data.products
            ) {

              saveProducts(
                data.products
              );

            }


            if (
              data.users
            ) {

              localStorage.setItem(

                'mm_users',

                JSON.stringify(
                  data.users
                )

              );

            }


            if (
              data.site
            ) {

              MM.saveSite(
                data.site
              );

            }


            if (
              data.whatsapp
            ) {

              localStorage.setItem(
                'mm_whatsapp',
                data.whatsapp
              );

            }


            toast(
              'Backup importado'
            );

          }

          catch (error) {

            alert(
              'Backup inválido'
            );

          }

        };


      reader.readAsText(
        file
      );

    };

}


/* =====================================================
   HISTÓRIAS DA MARIA
===================================================== */

let __mmStories = [];


async function storiesPage() {

  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Conteúdo especial
        </span>

        <h1>
          Histórias da Maria
        </h1>

        <p class="muted">
          Crie histórias curtas em estilo de quadrinhos.
          A seção só aparece no catálogo quando uma
          história estiver publicada.
        </p>

      </div>


      <button
        class="btn primary"
        id="newStory"
      >
        + Nova história
      </button>

    </div>


    <div
      id="storiesStatus"
      class="notice"
    >
      Carregando histórias…
    </div>


    <div
      id="storiesList"
      class="story-admin-list"
    ></div>
  `;


  $('#newStory').onclick =
    () => editStory();


  try {

    __mmStories =
      await MMStories.listAdmin();


    renderStoryList();

  }

  catch (error) {

    $('#storiesStatus')
      .innerHTML = `

        <strong>
          Histórias ainda não estão ativadas no Supabase.
        </strong>

        <br>

        <span class="muted">
          Execute uma única vez o arquivo
          <b>SUPABASE_HISTORIAS.sql</b>
          no SQL Editor. Depois volte aqui.
        </span>

        <br>

        <small class="muted">
          ${escape(error.message)}
        </small>
      `;


    $('#storiesList')
      .innerHTML = '';

  }

}


function renderStoryList() {

  const status =
    $('#storiesStatus');

  const list =
    $('#storiesList');


  if (
    !status ||
    !list
  ) {

    return;

  }


  status.innerHTML =
    __mmStories.length

      ? `
          <strong>
            ${__mmStories.length}
          </strong>
          história(s) cadastrada(s).
        `

      : `
          Nenhuma história criada ainda.
          Clique em
          <strong>
            + Nova história
          </strong>
          quando quiser começar.
        `;


  list.innerHTML =
    __mmStories
      .map(
        story => `

          <article class="story-admin-card">

            <div class="story-admin-thumb">

              ${
                story.imagem

                  ? `
                      <img
                        src="${escape(story.imagem)}"
                      >
                    `

                  : '<span>🏠</span>'
              }

            </div>


            <div class="story-admin-copy">

              <span class="chip">
                ${
                  story.publicada
                    ? 'Publicada'
                    : 'Rascunho'
                }
              </span>


              <h3>
                ${escape(story.titulo)}
              </h3>


              <p>
                ${escape(story.situacao || '')}
              </p>


              <small>

                ${
                  escape(
                    story.cliente_nome ||
                    'Cliente'
                  )
                }

                + Maria ·

                ${
                  Array.isArray(
                    story.produto_ids
                  )
                    ? story.produto_ids.length
                    : 0
                }

                produto(s)

              </small>

            </div>


            <div class="story-admin-actions">

              <button
                class="btn secondary storyEdit"
                data-id="${escape(story.id)}"
              >
                Editar
              </button>

            </div>

          </article>
        `
      )
      .join('');


  list
    .querySelectorAll(
      '.storyEdit'
    )
    .forEach(button => {

      button.onclick =
        () => editStory(
          button.dataset.id
        );

    });

}


/* =====================================================
   PRODUTOS DA HISTÓRIA
===================================================== */

function storyProductChecks(
  selected = []
) {

  const selectedSet =
    new Set(
      selected || []
    );


  return getProducts()

    .filter(
      product =>
        product.active !== false
    )

    .map(
      product => `

        <label class="story-product-option">

          <input
            type="checkbox"
            data-story-product
            value="${escape(product.id)}"
            ${
              selectedSet.has(
                product.id
              )
                ? 'checked'
                : ''
            }
          >


          <img
            src="${escape(
              product.image ||
              'sem-imagem.svg'
            )}"
          >


          <span>

            <strong>
              ${escape(product.name)}
            </strong>

            <small>
              ${money(product.price)}
            </small>

          </span>

        </label>
      `
    )

    .join('');

}


/* =====================================================
   PRÉVIA DA HISTÓRIA
===================================================== */

function storyPreview(
  story
) {

  const products =
    getProducts()
      .filter(
        product =>
          (
            story.produto_ids || []
          )
          .includes(
            product.id
          )
      );


  return `

    <div class="story-preview-card">

      <div class="story-preview-title">

        <span class="eyebrow">
          Histórias com a Maria
        </span>

        <h2>
          ${escape(
            story.titulo ||
            'Sua história'
          )}
        </h2>

        <p>
          ${escape(
            story.situacao ||
            'Conte rapidamente o que aconteceu com o cliente.'
          )}
        </p>

      </div>


      <div class="comic-strip preview">


        <div class="comic-panel client">

          <div class="comic-scene">

            ${
              story.imagem

                ? `
                    <img
                      src="${escape(
                        story.imagem
                      )}"
                    >
                  `

                : `
                    <span class="scene-placeholder">
                      🏠
                    </span>
                  `
            }

          </div>


          <div class="speech client-speech">

            <strong>
              ${escape(
                story.cliente_nome ||
                'Cliente'
              )}
            </strong>

            <p>
              ${escape(
                story.fala_cliente ||
                'Preciso renovar minha casa…'
              )}
            </p>

          </div>

        </div>


        <div class="comic-panel maria">

          <img
            class="comic-maria"
            src="maria-logo.png"
          >


          <div class="speech maria-speech">

            <strong>
              Maria
            </strong>

            <p>
              ${escape(
                story.fala_maria ||
                'Eu te ajudo a encontrar a peça ideal!'
              )}
            </p>

          </div>

        </div>


        <div class="comic-panel products">

          <strong>
            Escolhas da Maria
          </strong>


          <div class="comic-products">

            ${
              products.length

                ? products
                    .map(
                      product => `

                        <div>

                          <img
                            src="${escape(
                              product.image
                            )}"
                          >

                          <small>
                            ${escape(
                              product.name
                            )}
                          </small>

                        </div>
                      `
                    )
                    .join('')

                : `
                    <p class="muted">
                      Selecione até 3 produtos.
                    </p>
                  `
            }

          </div>

        </div>

      </div>

    </div>
  `;

}


/* =====================================================
   EDITAR HISTÓRIA
===================================================== */

async function editStory(
  id
) {

  const oldStory =
    __mmStories.find(
      story =>
        String(story.id) ===
        String(id)
    )

    ||

    {

      titulo:
        '',

      cliente_nome:
        '',

      situacao:
        '',

      fala_cliente:
        '',

      fala_maria:
        '',

      imagem:
        '',

      produto_ids:
        [],

      publicada:
        false,

      ordem:
        0

    };


  let image =
    oldStory.imagem || '';


  page.innerHTML = `

    <div class="admin-title">

      <div>

        <span class="eyebrow">
          Histórias da Maria
        </span>

        <h1>
          ${
            id
              ? 'Editar história'
              : 'Nova história'
          }
        </h1>

        <p class="muted">
          Monte uma história rápida.
          Você pode deixar como rascunho
          e publicar quando estiver pronta.
        </p>

      </div>

    </div>


    <div class="story-editor-grid">


      <section class="settings-card">


        <div class="field">

          <label>
            Título
          </label>

          <input
            id="storyTitle"
            value="${escape(
              oldStory.titulo || ''
            )}"
          >

        </div>


        <div class="field mt10">

          <label>
            Cliente / personagem
          </label>

          <input
            id="storyClient"
            value="${escape(
              oldStory.cliente_nome ||
              ''
            )}"
            placeholder="Ex.: Ana"
          >

        </div>


        <div class="field mt10">

          <label>
            Situação
          </label>

          <textarea
            id="storySituation"
            rows="3"
            placeholder="Ex.: Acabou de se mudar e precisa de roupa de cama nova."
          >${escape(
            oldStory.situacao || ''
          )}</textarea>

        </div>


        <div class="field mt10">

          <label>
            Fala do cliente
          </label>

          <textarea
            id="storyClientText"
            rows="3"
          >${escape(
            oldStory.fala_cliente ||
            ''
          )}</textarea>

        </div>


        <div class="field mt10">

          <label>
            Fala da Maria
          </label>

          <textarea
            id="storyMariaText"
            rows="3"
          >${escape(
            oldStory.fala_maria ||
            ''
          )}</textarea>

        </div>


        <div class="field mt10">

          <label>
            Imagem da situação (opcional)
          </label>


          <label class="btn secondary file-btn">

            Escolher imagem

            <input
              id="storyImage"
              type="file"
              accept="image/*"
              hidden
            >

          </label>


          <div
            id="storyImageMini"
            class="story-image-mini"
          >

            ${
              image

                ? `
                    <img
                      src="${escape(image)}"
                    >
                  `

                : '<span>Sem imagem ainda</span>'
            }

          </div>

        </div>


        <div class="field mt10">

          <label>
            Produtos que aparecem (até 3)
          </label>

          <div
            class="story-product-picker"
            id="storyProductPicker"
          >
            ${storyProductChecks(
              oldStory.produto_ids
            )}
          </div>

        </div>


        <div class="story-publish-row">

          <label class="check-row">

            <input
              id="storyPublished"
              type="checkbox"
              ${
                oldStory.publicada
                  ? 'checked'
                  : ''
              }
            >

            Publicar no catálogo

          </label>


          <div class="field story-order">

            <label>
              Ordem
            </label>

            <input
              id="storyOrder"
              type="number"
              value="${Number(
                oldStory.ordem || 0
              )}"
            >

          </div>

        </div>


        <div class="actions mt16">

          <button
            class="btn primary"
            id="saveStory"
          >
            Salvar história
          </button>


          <button
            class="btn secondary"
            id="cancelStory"
          >
            Voltar
          </button>


          ${
            id

              ? `
                  <button
                    class="btn danger"
                    id="deleteStory"
                  >
                    Excluir
                  </button>
                `

              : ''
          }

        </div>

      </section>


      <section>

        <div id="storyLivePreview">
        </div>

      </section>

    </div>
  `;


  function collect() {

    const productIds =
      [
        ...document
          .querySelectorAll(
            '[data-story-product]:checked'
          )
      ]
      .map(
        element =>
          element.value
      )
      .slice(
        0,
        3
      );


    return {

      id:
        oldStory.id,

      titulo:
        $('#storyTitle')
          .value
          .trim(),

      cliente_nome:
        $('#storyClient')
          .value
          .trim(),

      situacao:
        $('#storySituation')
          .value
          .trim(),

      fala_cliente:
        $('#storyClientText')
          .value
          .trim(),

      fala_maria:
        $('#storyMariaText')
          .value
          .trim(),

      imagem:
        image,

      produto_ids:
        productIds,

      publicada:
        $('#storyPublished')
          .checked,

      ordem:
        Number(
          $('#storyOrder').value ||
          0
        )

    };

  }


  function preview() {

    $('#storyLivePreview')
      .innerHTML =
      storyPreview(
        collect()
      );

  }


  document
    .querySelectorAll(
      '#storyTitle,' +
      '#storyClient,' +
      '#storySituation,' +
      '#storyClientText,' +
      '#storyMariaText,' +
      '#storyPublished,' +
      '#storyOrder'
    )
    .forEach(
      element => {

        element.addEventListener(
          'input',
          preview
        );

      }
    );


  document
    .querySelectorAll(
      '[data-story-product]'
    )
    .forEach(
      element => {

        element.onchange =
          () => {

            const checked =
              [
                ...document
                  .querySelectorAll(
                    '[data-story-product]:checked'
                  )
              ];


            if (
              checked.length > 3
            ) {

              element.checked =
                false;


              toast(
                'Escolha no máximo 3 produtos'
              );

            }


            preview();

          };

      }
    );


  $('#storyImage').onchange =
    async event => {

      const file =
        event.target.files[0];


      if (!file) {

        return;

      }


      image =
        await readImageFile(
          file,
          900,
          .72
        );


      $('#storyImageMini')
        .innerHTML = `

          <img
            src="${image}"
          >
        `;


      preview();

    };


  $('#cancelStory').onclick =
    storiesPage;


  $('#saveStory').onclick =
    async () => {

      const story =
        collect();


      if (
        !story.titulo
      ) {

        return alert(
          'Dê um título para a história.'
        );

      }


      try {

        $('#saveStory').disabled =
          true;


        await MMStories.save(
          story
        );


        toast(
          story.publicada
            ? 'História publicada!'
            : 'Rascunho salvo'
        );


        storiesPage();

      }

      catch (error) {

        alert(
          'Não foi possível salvar: ' +
          error.message
        );


        $('#saveStory').disabled =
          false;

      }

    };


  if (id) {

    $('#deleteStory').onclick =
      async () => {

        if (
          !confirm(
            'Excluir esta história?'
          )
        ) {

          return;

        }


        try {

          await MMStories.remove(
            oldStory.id
          );


          toast(
            'História excluída'
          );


          storiesPage();

        }

        catch (error) {

          alert(
            'Não foi possível excluir: ' +
            error.message
          );

        }

      };

  }


  preview();

}


/* =====================================================
   INICIALIZAÇÃO E RECUPERAÇÃO DE SENHA
===================================================== */

(async () => {

  const recovery =
    await MMAuth
      .acceptRecoveryFromUrl();


  if (recovery) {

    $('#loginView').hidden =
      true;

    $('#recoveryView').hidden =
      false;

    $('#adminApp').hidden =
      true;


    /*
      Remove token/código da barra
      depois que a sessão segura
      já foi criada.
    */

    history.replaceState(
      null,
      '',
      location.pathname
    );


    return;

  }


  /*
    Acesso normal.
    Nunca mostra a tela de criação
    de senha.
  */

  $('#recoveryView').hidden =
    true;

  $('#loginView').hidden =
    false;


  showApp();

})();


/* =====================================================
   BOTÕES RÁPIDOS DO DASHBOARD
===================================================== */

document.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-go]'
      );


    if (!button) {

      return;

    }


    document
      .querySelectorAll(
        '[data-page]'
      )
      .forEach(
        item => {

          item.classList.toggle(

            'active',

            item.dataset.page ===
            button.dataset.go

          );

        }
      );


    render(
      button.dataset.go
    );

  }
);
