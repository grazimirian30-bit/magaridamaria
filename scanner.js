/* =====================================================
   MARGARIDA MARIA
   SCANNER DE PRODUTOS
===================================================== */


/* =====================================================
   PROTEÇÃO DO ADMINISTRATIVO
===================================================== */

if (sessionStorage.getItem('mm_admin_ok') !== '1') {

  location.replace('admin.html');

}


/* =====================================================
   ELEMENTOS DA TELA
===================================================== */

const video =
  document.getElementById('video');

const result =
  document.getElementById('scanResult');

const codeInput =
  document.getElementById('manualCode');

const startButton =
  document.getElementById('startScan');

const stopButton =
  document.getElementById('stopScan');


/* =====================================================
   CONTROLE DO SCANNER
===================================================== */

let stream = null;

let timer = null;

let zxingControls = null;

let scannerAtivo = false;

let codigoLido = false;


/* =====================================================
   NORMALIZAR CÓDIGO
===================================================== */

function normalizeCode(code) {

  return String(code || '').trim();

}


/* =====================================================
   PROCURAR PRODUTO PELO CÓDIGO
===================================================== */

function productByCode(code) {

  const codigo =
    normalizeCode(code);


  return MM
    .getProducts()
    .find(product => {

      return normalizeCode(product.code) === codigo;

    });

}


/* =====================================================
   MOSTRAR PRODUTO OU OPÇÃO DE CADASTRO
===================================================== */

function renderProduct(code) {

  const codigo =
    normalizeCode(code);


  if (!codigo) {

    result.innerHTML = `
      <div class="notice">
        Informe ou escaneie um código.
      </div>
    `;

    return;
  }


  const product =
    productByCode(codigo);


  /* ===================================================
     PRODUTO ENCONTRADO
  =================================================== */

  if (product) {

    result.innerHTML = `

      <div class="scanner-result">

        <img
          src="${MM.escape(product.image || 'sem-imagem.svg')}"
          alt="${MM.escape(product.name || 'Produto')}"
          onerror="this.src='sem-imagem.svg'"
        >

        <div>

          <span class="chip">
            ${MM.escape(product.category || '')}
          </span>


          <h2>
            ${MM.escape(product.name || '')}
          </h2>


          <p>
            ${MM.money(product.price || 0)}
          </p>


          <p>
            Código:
            <strong>
              ${MM.escape(codigo)}
            </strong>
          </p>


          <p>
            Estoque:
            <strong>
              ${Number(product.stock || 0)}
            </strong>
          </p>


          <div class="actions">

            <button
              class="btn primary"
              id="scanSale"
              type="button"
              ${
                Number(product.stock || 0) < 1
                  ? 'disabled'
                  : ''
              }
            >
              Registrar venda
            </button>


            <button
              class="btn secondary"
              id="scanAdd"
              type="button"
            >
              Entrada +1
            </button>

          </div>

        </div>

      </div>
    `;


    const saleButton =
      document.getElementById('scanSale');

    const addButton =
      document.getElementById('scanAdd');


    if (saleButton) {

      saleButton.onclick = () => {

        changeStock(
          product.id,
          -1,
          true
        );

      };

    }


    if (addButton) {

      addButton.onclick = () => {

        changeStock(
          product.id,
          1,
          false
        );

      };

    }


    return;

  }


  /* ===================================================
     PRODUTO NÃO ENCONTRADO
  =================================================== */

  result.innerHTML = `

    <div class="notice">

      <h3>
        Produto ainda não cadastrado
      </h3>


      <p>
        Código encontrado:
      </p>


      <p>
        <strong>
          ${MM.escape(codigo)}
        </strong>
      </p>


      <div class="actions mt16">

        <button
          class="btn primary"
          id="scanRegister"
          type="button"
        >
          ➕ Cadastrar esta mercadoria
        </button>


        <button
          class="btn secondary"
          id="scanAgain"
          type="button"
        >
          📷 Escanear outro
        </button>

      </div>

    </div>
  `;


  const registerButton =
    document.getElementById('scanRegister');

  const scanAgainButton =
    document.getElementById('scanAgain');


  /* ===================================================
     CADASTRAR PRODUTO NOVO
  =================================================== */

  if (registerButton) {

    registerButton.onclick = () => {

      /*
        Guardamos o código na sessão.

        Assim o ADM poderá receber
        automaticamente o código.
      */

      sessionStorage.setItem(
        'mm_new_product_code',
        codigo
      );


      /*
        Também enviamos pela URL.
      */

      location.href =
        'admin.html?novoProduto=' +
        encodeURIComponent(codigo);

    };

  }


  /* ===================================================
     ESCANEAR OUTRO PRODUTO
  =================================================== */

  if (scanAgainButton) {

    scanAgainButton.onclick = () => {

      codeInput.value = '';

      result.innerHTML = '';

      startScanner();

    };

  }

}


/* =====================================================
   ALTERAR ESTOQUE
===================================================== */

function changeStock(id, delta, sale) {

  const list =
    MM.getProducts();


  const product =
    list.find(item => item.id === id);


  if (!product) {

    return;

  }


  if (
    delta < 0 &&
    Number(product.stock || 0) < 1
  ) {

    return;

  }


  product.stock =
    Math.max(
      0,
      Number(product.stock || 0) + delta
    );


  if (sale) {

    product.sold =
      Number(product.sold || 0) + 1;

  }


  MM.saveProducts(list);


  renderProduct(product.code);


  MM.toast(
    sale
      ? 'Venda registrada'
      : 'Estoque atualizado'
  );

}


/* =====================================================
   QUANDO UM CÓDIGO FOR LIDO
===================================================== */

function codigoEncontrado(code) {

  if (codigoLido) {

    return;

  }


  const codigo =
    normalizeCode(code);


  if (!codigo) {

    return;

  }


  codigoLido = true;


  codeInput.value =
    codigo;


  stopScanner();


  renderProduct(codigo);

}


/* =====================================================
   BUSCA MANUAL
===================================================== */

document
  .getElementById('findCode')
  .onclick = () => {

    stopScanner();

    renderProduct(
      codeInput.value
    );

  };


codeInput
  .addEventListener(
    'keydown',
    event => {

      if (event.key === 'Enter') {

        event.preventDefault();

        stopScanner();

        renderProduct(
          codeInput.value
        );

      }

    }
  );


/* =====================================================
   SCANNER NATIVO
   BarcodeDetector
===================================================== */

async function startNativeScanner() {

  /*
    Pede acesso à câmera traseira.
  */

  stream =
    await navigator.mediaDevices.getUserMedia({

      video: {

        facingMode: {
          ideal: 'environment'
        },

        width: {
          ideal: 1280
        },

        height: {
          ideal: 720
        }

      },

      audio: false

    });


  video.srcObject =
    stream;


  await video.play();


  /*
    Descobre quais formatos
    o navegador consegue ler.
  */

  let supportedFormats = [];


  try {

    supportedFormats =
      await BarcodeDetector.getSupportedFormats();

  }

  catch (error) {

    supportedFormats = [];

  }


  const desiredFormats = [

    'ean_13',
    'ean_8',
    'code_128',
    'code_39',
    'code_93',
    'codabar',
    'itf',
    'qr_code',
    'upc_a',
    'upc_e'

  ];


  let formats =
    desiredFormats.filter(
      format =>
        supportedFormats.includes(format)
    );


  /*
    Se o navegador não informar
    os formatos, tenta criar o leitor
    sem limitar formatos.
  */

  const detector =
    formats.length

      ? new BarcodeDetector({
          formats
        })

      : new BarcodeDetector();


  scannerAtivo = true;


  result.innerHTML = `
    <div class="notice">
      📷 Scanner ativo.
      Aponte a câmera para o código de barras.
    </div>
  `;


  timer =
    setInterval(
      async () => {

        if (
          !scannerAtivo ||
          codigoLido
        ) {

          return;

        }


        try {

          const codes =
            await detector.detect(video);


          if (
            codes &&
            codes.length
          ) {

            codigoEncontrado(
              codes[0].rawValue
            );

          }

        }

        catch (error) {

          /*
            Erros momentâneos durante
            a leitura são ignorados.
          */

        }

      },

      400
    );

}


/* =====================================================
   SCANNER ALTERNATIVO
   ZXING
===================================================== */

async function startZXingScanner() {

  if (
    typeof ZXingBrowser === 'undefined'
  ) {

    throw new Error(
      'ZXing não carregado'
    );

  }


  const codeReader =
    new ZXingBrowser.BrowserMultiFormatReader();


  scannerAtivo = true;


  result.innerHTML = `
    <div class="notice">
      📷 Scanner ativo.
      Aponte a câmera para o código de barras.
    </div>
  `;


  const constraints = {

    video: {

      facingMode: {
        ideal: 'environment'
      },

      width: {
        ideal: 1280
      },

      height: {
        ideal: 720
      }

    },

    audio: false

  };


  zxingControls =
    await codeReader.decodeFromConstraints(

      constraints,

      video,

      (
        scanResult,
        error,
        controls
      ) => {

        if (
          !scannerAtivo ||
          codigoLido
        ) {

          return;

        }


        if (!scanResult) {

          return;

        }


        let codigo = '';


        try {

          codigo =
            scanResult.getText();

        }

        catch (error) {

          codigo =
            scanResult.text || '';

        }


        if (!codigo) {

          return;

        }


        /*
          Mantém referência dos controles.
        */

        zxingControls =
          controls;


        codigoEncontrado(
          codigo
        );

      }

    );

}


/* =====================================================
   ABRIR SCANNER
===================================================== */

async function startScanner() {

  /*
    Fecha qualquer câmera anterior.
  */

  stopScanner();


  codigoLido =
    false;


  scannerAtivo =
    true;


  result.innerHTML = `
    <div class="notice">
      Abrindo câmera...
    </div>
  `;


  /*
    Confere se o navegador
    permite acessar a câmera.
  */

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    scannerAtivo =
      false;


    result.innerHTML = `

      <div class="notice">

        Este navegador não permite
        acessar a câmera.

        Tente abrir o site pelo
        navegador atualizado do celular.

      </div>
    `;

    return;

  }


  /*
    PRIMEIRA OPÇÃO:
    leitor nativo do navegador.
  */

  if (
    'BarcodeDetector' in window
  ) {

    try {

      await startNativeScanner();

      return;

    }

    catch (error) {

      /*
        Se o leitor nativo falhar,
        fecha a câmera e tenta ZXing.
      */

      stopScanner();

      codigoLido =
        false;

      scannerAtivo =
        true;

    }

  }


  /*
    SEGUNDA OPÇÃO:
    ZXing.

    Funciona nos navegadores que
    não oferecem BarcodeDetector.
  */

  if (
    typeof ZXingBrowser !== 'undefined'
  ) {

    try {

      await startZXingScanner();

      return;

    }

    catch (error) {

      console.error(
        'Erro ZXing:',
        error
      );


      stopScanner();

    }

  }


  /*
    NENHUM LEITOR FUNCIONOU
  */

  scannerAtivo =
    false;


  result.innerHTML = `

    <div class="notice">

      <strong>
        Não foi possível iniciar o scanner.
      </strong>

      <br><br>

      Verifique se você permitiu
      o acesso à câmera.

      <br><br>

      Você também pode digitar
      o código da mercadoria manualmente.

    </div>
  `;

}


/* =====================================================
   PARAR SCANNER
===================================================== */

function stopScanner() {

  scannerAtivo =
    false;


  /* PARA BarcodeDetector */

  if (timer) {

    clearInterval(timer);

    timer = null;

  }


  /* PARA ZXing */

  if (zxingControls) {

    try {

      zxingControls.stop();

    }

    catch (error) {

      /*
        Ignora erro ao fechar.
      */

    }


    zxingControls =
      null;

  }


  /* PARA A CÂMERA NATIVA */

  if (stream) {

    try {

      stream
        .getTracks()
        .forEach(
          track => track.stop()
        );

    }

    catch (error) {

      /*
        Ignora erro ao fechar.
      */

    }


    stream =
      null;

  }


  /*
    Alguns navegadores deixam
    o stream conectado diretamente
    ao elemento de vídeo.
  */

  if (video.srcObject) {

    try {

      video
        .srcObject
        .getTracks()
        .forEach(
          track => track.stop()
        );

    }

    catch (error) {

      /*
        Ignora.
      */

    }

  }


  video.srcObject =
    null;

}


/* =====================================================
   BOTÕES
===================================================== */

startButton.onclick =
  startScanner;


stopButton.onclick = () => {

  stopScanner();


  result.innerHTML = `
    <div class="notice">
      Scanner parado.
    </div>
  `;

};


/* =====================================================
   FECHAR CÂMERA AO SAIR
===================================================== */

window.addEventListener(
  'beforeunload',
  stopScanner
);


window.addEventListener(
  'pagehide',
  stopScanner
);
