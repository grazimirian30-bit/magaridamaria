/* =====================================================
   MARGARIDA MARIA
   IMPORTADOR DE CATÁLOGO DO FORNECEDOR
   Excel / XLS / XLSX / CSV

   Este arquivo é separado do admin.js para manter o
   painel principal intacto.
===================================================== */

let __supplierProducts = [];

function supplierNormalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function supplierValue(row, aliases) {
  const aliasSet = new Set(aliases.map(supplierNormalizeHeader));
  for (const key of Object.keys(row || {})) {
    if (aliasSet.has(supplierNormalizeHeader(key))) return row[key];
  }
  return '';
}

function supplierNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let text = String(value || '')
    .trim()
    .replace(/R\$/gi, '')
    .replace(/\s/g, '');

  if (!text) return 0;

  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');

  if (comma > -1 && dot > -1 && comma > dot) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (comma > -1 && dot > -1 && dot > comma) {
    text = text.replace(/,/g, '');
  } else if (comma > -1) {
    text = text.replace(',', '.');
  }

  const number = Number.parseFloat(text.replace(/[^\d.-]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function supplierCategory(value) {
  const category = supplierNormalizeHeader(value);

  if (category.includes('banh')) return 'Banho';
  if (category.includes('mesa')) return 'Mesa';
  if (
    category.includes('infantil') ||
    category.includes('crianca') ||
    category.includes('kids') ||
    category.includes('bebe')
  ) return 'Infantil';

  return 'Cama';
}

function supplierRowToProduct(row, index) {
  const name = supplierValue(row, [
    'nome','produto','nome produto','nome do produto','descricao','item','mercadoria'
  ]);

  const code = supplierValue(row, [
    'ean','ean13','ean 13','gtin','codigo','codigo barras','codigo de barras',
    'barcode','sku','referencia','ref'
  ]);

  const price = supplierValue(row, [
    'preco','valor','preco venda','valor venda','preco unitario','valor unitario'
  ]);

  const stock = supplierValue(row, [
    'estoque','quantidade','qtd','qtde','saldo','disponivel'
  ]);

  const category = supplierValue(row, [
    'categoria','grupo','departamento','linha','tipo'
  ]);

  const image = supplierValue(row, [
    'imagem','foto','url imagem','url da imagem','link imagem','link da imagem',
    'image','image url'
  ]);

  const completeDescription = supplierValue(row, [
    'descricao completa','detalhes','observacao','observacoes'
  ]);

  const cleanName = String(name || '').trim();
  const cleanCode = String(code || '').trim().replace(/\.0$/, '');
  const cleanImage = String(image || '').trim();

  return {
    supplierIndex: index,
    name: cleanName,
    code: cleanCode,
    price: Math.max(0, supplierNumber(price)),
    stock: Math.max(0, Math.floor(supplierNumber(stock))),
    category: supplierCategory(category),
    description: String(completeDescription || '').trim(),
    image: cleanImage || 'sem-imagem.svg',
    images: cleanImage ? [cleanImage] : ['sem-imagem.svg'],
    sold: 0,
    isLaunch: false,
    active: true
  };
}

function supplierExistingProduct(supplierProduct) {
  const products = getProducts();

  if (supplierProduct.code) {
    const byCode = products.find(product =>
      String(product.code || '').trim() === String(supplierProduct.code).trim()
    );
    if (byCode) return byCode;
  }

  const normalizedName = String(supplierProduct.name || '')
    .trim()
    .toLocaleLowerCase('pt-BR');

  if (!normalizedName) return null;

  return products.find(product =>
    String(product.name || '').trim().toLocaleLowerCase('pt-BR') === normalizedName
  ) || null;
}

/* =====================================================
   NOVA TELA DE PRODUTOS
   Substitui somente a função visual productsPage().
===================================================== */

productsPage = function () {
  const products = getProducts();

  page.innerHTML = `
    <div class="admin-title">
      <div>
        <span class="eyebrow">Catálogo</span>
        <h1>Produtos e estoque</h1>
        <p class="muted">Cadastre uma peça ou importe vários produtos do catálogo do fornecedor.</p>
      </div>
    </div>

    <div class="product-main-actions">
      <button class="btn primary" id="newProduct" type="button">
        + Adicionar peça
      </button>

      <button class="supplier-import-hero" id="openSupplierImport" type="button">
        <span class="supplier-import-icon">📥</span>
        <span class="supplier-import-copy">
          <strong>IMPORTAR CATÁLOGO DO FORNECEDOR</strong>
          <small>Excel ou CSV · vários produtos de uma vez</small>
        </span>
      </button>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Vendidos</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${products.length ? products.map(product => `
            <tr>
              <td>
                <img class="table-thumb"
                     src="${escape(product.image || 'sem-imagem.svg')}"
                     onerror="this.src='sem-imagem.svg'">
              </td>
              <td><strong>${escape(product.name)}</strong></td>
              <td>${escape(product.category)}</td>
              <td>${money(product.price)}</td>
              <td>${Number(product.stock || 0)}</td>
              <td>${Number(product.sold || 0)}</td>
              <td>${product.active === false ? 'Oculto' : 'Publicado'}</td>
              <td>
                <div class="table-actions">
                  <button class="btn tiny secondary edit" data-id="${product.id}">Editar</button>
                  <button class="btn tiny primary sale" data-id="${product.id}"
                    ${Number(product.stock || 0) < 1 ? 'disabled' : ''}>
                    Venda +1
                  </button>
                </div>
              </td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="8"><div class="empty-state">Nenhum produto cadastrado.</div></td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;

  $('#newProduct').onclick = () => editProduct();
  $('#openSupplierImport').onclick = importSupplierCatalog;

  document.querySelectorAll('.edit').forEach(button => {
    button.onclick = () => editProduct(button.dataset.id);
  });

  document.querySelectorAll('.sale').forEach(button => {
    button.onclick = () => sale(button.dataset.id);
  });
};

/* =====================================================
   TELA DE IMPORTAÇÃO
===================================================== */

function importSupplierCatalog() {
  __supplierProducts = [];
  activateAdminNav('products');

  page.innerHTML = `
    <div class="admin-title">
      <div>
        <span class="eyebrow">Fornecedor</span>
        <h1>Importar catálogo</h1>
        <p class="muted">Importe vários produtos de uma só vez.</p>
      </div>
      <button class="btn secondary" id="supplierBack" type="button">← Voltar</button>
    </div>

    <section class="supplier-upload-card">
      <div class="supplier-upload-icon">📥</div>
      <h2>Escolha o catálogo do fornecedor</h2>
      <p>Formatos aceitos: <strong>Excel (.xlsx / .xls) ou CSV</strong></p>

      <label class="supplier-file-button">
        📂 Selecionar catálogo
        <input id="supplierFile" type="file"
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden>
      </label>

      <p class="muted small supplier-help">
        O sistema tenta reconhecer automaticamente Nome/Produto, Código/EAN,
        Preço, Estoque, Categoria, Descrição e link da Foto.
      </p>
    </section>

    <div id="supplierStatus" class="mt16"></div>
    <div id="supplierPreview" class="mt16"></div>
  `;

  $('#supplierBack').onclick = productsPage;
  $('#supplierFile').onchange = readSupplierFile;
}

async function readSupplierFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const status = $('#supplierStatus');
  status.innerHTML = '<div class="notice">Lendo catálogo...</div>';

  if (typeof XLSX === 'undefined') {
    status.innerHTML = `
      <div class="notice">
        <strong>O leitor de Excel não foi carregado.</strong><br>
        Verifique a internet, atualize a página e tente novamente.
      </div>`;
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (!workbook.SheetNames.length) throw new Error('A planilha está vazia.');

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false
    });

    if (!rows.length) throw new Error('Nenhum produto foi encontrado na primeira aba da planilha.');

    __supplierProducts = rows
      .map((row, index) => supplierRowToProduct(row, index))
      .filter(product => product.name);

    if (!__supplierProducts.length) {
      throw new Error('Não encontrei uma coluna de Nome ou Produto. O arquivo foi lido, mas precisamos adaptar os nomes das colunas.');
    }

    status.innerHTML = `
      <div class="notice supplier-success">
        ✅ Catálogo lido: <strong>${__supplierProducts.length}</strong> produto(s) encontrado(s).
      </div>`;

    renderSupplierPreview();
  } catch (error) {
    console.error(error);
    status.innerHTML = `
      <div class="notice">
        <strong>Não consegui ler este catálogo.</strong><br><br>
        ${escape(error.message || 'Arquivo inválido.')}
      </div>`;
  }
}

function renderSupplierPreview() {
  const preview = $('#supplierPreview');
  if (!preview) return;

  const newCount = __supplierProducts.filter(product => !supplierExistingProduct(product)).length;
  const existingCount = __supplierProducts.length - newCount;

  preview.innerHTML = `
    <div class="supplier-summary">
      <div><strong>${__supplierProducts.length}</strong><span>encontrados</span></div>
      <div><strong>${newCount}</strong><span>novos</span></div>
      <div><strong>${existingCount}</strong><span>já cadastrados</span></div>
    </div>

    <div class="supplier-preview-actions">
      <button class="btn secondary" id="supplierSelectNew" type="button">
        ✓ Selecionar somente novos
      </button>
      <button class="supplier-import-confirm" id="supplierImportSelected" type="button">
        📥 IMPORTAR SELECIONADOS
      </button>
    </div>

    <div class="table-wrap">
      <table class="table supplier-table">
        <thead>
          <tr>
            <th>Importar</th>
            <th>Produto</th>
            <th>Código / EAN</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          ${__supplierProducts.map((product, index) => {
            const existing = supplierExistingProduct(product);
            return `
              <tr class="${existing ? 'supplier-existing-row' : ''}">
                <td>
                  <input type="checkbox" class="supplier-check"
                    data-supplier-index="${index}" ${existing ? '' : 'checked'}>
                </td>
                <td><strong>${escape(product.name)}</strong></td>
                <td>${escape(product.code || 'Sem código')}</td>
                <td>${escape(product.category)}</td>
                <td>${money(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                  ${existing
                    ? '<span class="supplier-badge existing">Já cadastrado</span>'
                    : '<span class="supplier-badge new">Novo</span>'}
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  $('#supplierSelectNew').onclick = () => {
    document.querySelectorAll('.supplier-check').forEach(checkbox => {
      const index = Number(checkbox.dataset.supplierIndex);
      checkbox.checked = !supplierExistingProduct(__supplierProducts[index]);
    });
  };

  $('#supplierImportSelected').onclick = saveSupplierProducts;
}

function saveSupplierProducts() {
  const selected = [...document.querySelectorAll('.supplier-check:checked')];
  if (!selected.length) return alert('Selecione pelo menos um produto.');

  const products = getProducts();
  const knownCodes = new Set(
    products.map(p => String(p.code || '').trim()).filter(Boolean)
  );
  const knownNames = new Set(
    products.map(p => String(p.name || '').trim().toLocaleLowerCase('pt-BR')).filter(Boolean)
  );

  let imported = 0;
  let skipped = 0;

  selected.forEach((checkbox, position) => {
    const index = Number(checkbox.dataset.supplierIndex);
    const supplierProduct = __supplierProducts[index];
    if (!supplierProduct) return;

    const codeKey = String(supplierProduct.code || '').trim();
    const nameKey = String(supplierProduct.name || '').trim().toLocaleLowerCase('pt-BR');

    if ((codeKey && knownCodes.has(codeKey)) || (!codeKey && nameKey && knownNames.has(nameKey))) {
      skipped++;
      return;
    }

    products.push({
      id: 'p' + Date.now() + '_' + position + '_' + Math.random().toString(36).slice(2, 7),
      name: supplierProduct.name,
      category: supplierProduct.category,
      price: supplierProduct.price,
      stock: supplierProduct.stock,
      sold: 0,
      code: supplierProduct.code,
      description: supplierProduct.description,
      image: supplierProduct.image,
      images: supplierProduct.images,
      isLaunch: false,
      active: true
    });

    if (codeKey) knownCodes.add(codeKey);
    if (nameKey) knownNames.add(nameKey);
    imported++;
  });

  if (!imported) {
    return alert('Nenhum produto novo para importar. Os selecionados já estão cadastrados.');
  }

  try {
    saveProducts(products);
  } catch (error) {
    console.error(error);
    return alert('Não foi possível salvar todos os produtos. Se o catálogo tiver muitas fotos, importe em partes.');
  }

  toast(imported + ' produto(s) importado(s)');

  if (skipped) {
    alert(
      imported + ' produto(s) importado(s).\n\n' +
      skipped + ' produto(s) repetidos não foram duplicados.'
    );
  }

  productsPage();
}
