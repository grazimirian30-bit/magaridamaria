window.MM_DEFAULT_PRODUCTS=[
  {"id":"p1","name":"Edredom Plush Sherpa Cinza","category":"Cama","price":239.9,"stock":8,"sold":31,"code":"789000000001","description":"Edredom dupla face com visual elegante em cinza, toque macio e acabamento aconchegante. Ideal para quartos de casal e para os dias mais frios.","image":"produto-edredom-cinza.jpg","images":["produto-edredom-cinza.jpg","clean-cama-pastel.jpg"],"isLaunch":true,"active":true},
  {"id":"p2","name":"Colcha Azul Marinho","category":"Cama","price":189.9,"stock":11,"sold":24,"code":"789000000002","description":"Colcha azul marinho com textura delicada e composição clássica. Uma peça versátil para deixar o quarto organizado e sofisticado.","image":"clean-cama-azul.jpg","images":["clean-cama-azul.jpg","produto-edredom-claro.jpg"],"isLaunch":false,"active":true},
  {"id":"p3","name":"Edredom Suave Pastel","category":"Cama","price":219.9,"stock":7,"sold":18,"code":"789000000003","description":"Edredom em tons suaves e acolhedores, perfeito para uma decoração leve e confortável.","image":"clean-cama-pastel.jpg","images":["clean-cama-pastel.jpg","produto-edredom-claro.jpg"],"isLaunch":true,"active":true},
  {"id":"p4","name":"Kit Toalhas Geométricas","category":"Banho","price":129.9,"stock":16,"sold":19,"code":"789000000004","description":"Jogo de toalhas em tons azul, verde e branco, com detalhes geométricos. Macias e ideais para compor um banheiro moderno.","image":"clean-toalhas-geo.jpg","images":["clean-toalhas-geo.jpg","produto-toalhas-geometricas.jpg"],"isLaunch":false,"active":true},
  {"id":"p5","name":"Toalhas Botânicas","category":"Banho","price":149.9,"stock":9,"sold":15,"code":"789000000005","description":"Conjunto de toalhas com barrado botânico em tons naturais. Visual elegante para renovar o banheiro.","image":"clean-toalhas-botanicas.jpg","images":["clean-toalhas-botanicas.jpg","produto-toalhas-verde.jpg"],"isLaunch":true,"active":true},
  {"id":"p6","name":"Toalhas Coloridas Premium","category":"Banho","price":139.9,"stock":13,"sold":20,"code":"789000000006","description":"Toalhas em diferentes cores, com textura agradável e acabamento elegante para uso diário.","image":"clean-toalhas-prateleira.jpg","images":["clean-toalhas-prateleira.jpg","produto-toalhas-coloridas.jpg","produto-toalhas-luxo.jpg"],"isLaunch":false,"active":true},
  {"id":"p7","name":"Toalha Azul Marinho","category":"Banho","price":59.9,"stock":14,"sold":9,"code":"789000000007","description":"Toalha azul marinho com padrão texturizado e acabamento decorativo.","image":"clean-toalha-azul.jpg","images":["clean-toalha-azul.jpg","produto-toalhas-moto.jpg"],"isLaunch":false,"active":true},
  {"id":"p8","name":"Mantas Artesanais Coloridas","category":"Mesa","price":79.9,"stock":18,"sold":12,"code":"789000000008","description":"Mantas em cores variadas com franjas, versáteis para compor sofá, poltrona ou decoração de mesa.","image":"clean-mantas-leque.jpg","images":["clean-mantas-leque.jpg","clean-mantas-coloridas.jpg","produto-mantas.jpg"],"isLaunch":false,"active":true},
  {"id":"p9","name":"Linha Infantil Pirata","category":"Infantil","price":169.9,"stock":6,"sold":10,"code":"789000000009","description":"Conjunto infantil azul com tema pirata, alegre e confortável para o quarto das crianças.","image":"produto-infantil-pirata.jpg","images":["produto-infantil-pirata.jpg"],"isLaunch":true,"active":true},
  {"id":"p10","name":"Toalhas Infantil Princesa","category":"Infantil","price":89.9,"stock":10,"sold":8,"code":"789000000010","description":"Toalhas infantis em rosa e amarelo com estampa delicada de princesas.","image":"produto-infantil-princesa.jpg","images":["produto-infantil-princesa.jpg"],"isLaunch":false,"active":true},
  {"id":"p11","name":"Panos de Prato Decorados","category":"Mesa","price":39.9,"stock":22,"sold":17,"code":"789000000011","description":"Panos de prato brancos com estampas variadas, perfeitos para dar charme e praticidade à cozinha.","image":"clean-panos-prato.jpg","images":["clean-panos-prato.jpg"],"isLaunch":false,"active":true},
  {"id":"p12","name":"Tecidos Decorativos","category":"Mesa","price":69.9,"stock":12,"sold":7,"code":"789000000012","description":"Tecidos em diversas cores para composições decorativas e uso versátil no lar.","image":"clean-tecidos.jpg","images":["clean-tecidos.jpg","produto-mantas.jpg"],"isLaunch":false,"active":true}
];

window.MM_DEFAULT_SITE={
  heroTitle:'Margarida Maria',
  heroText:'Cama, mesa e banho para deixar sua casa mais bonita e acolhedora.',
  showLaunches:true,
  showCategories:true,
  categories:{
    Cama:{label:'Roupa de cama',image:'categoria-cama.jpg'},
    Mesa:{label:'Mesa',image:'categoria-mesa.jpg'},
    Banho:{label:'Banho',image:'categoria-banho.jpg'},
    Infantil:{label:'Infantil',image:'categoria-infantil.jpg'}
  }
};

window.MM={
  getProducts(){
    let raw=localStorage.getItem('mm_products_v5_preservado');

    if(!raw){
      const d=typeof structuredClone==='function'
        ? structuredClone(MM_DEFAULT_PRODUCTS)
        : JSON.parse(JSON.stringify(MM_DEFAULT_PRODUCTS));

      localStorage.setItem('mm_products_v5_preservado',JSON.stringify(d));
      return d;
    }

    try{
      const d=JSON.parse(raw);
      return Array.isArray(d)?d:MM_DEFAULT_PRODUCTS;
    }catch{
      return MM_DEFAULT_PRODUCTS;
    }
  },

  saveProducts(list){
    const safeList=Array.isArray(list)?list:[];

    localStorage.setItem(
      'mm_products_v5_preservado',
      JSON.stringify(safeList)
    );

    window.dispatchEvent(
      new CustomEvent('mm-products-changed')
    );

    // Sincroniza com o Supabase quando o administrador estiver logado.
    // O cache local continua funcionando como fallback/offline.
    if(window.MMProducts?.syncAll){
      window.MMProducts
        .syncAll(safeList)
        .catch(error=>{
          console.warn('Falha ao sincronizar produtos com Supabase:',error);
          window.dispatchEvent(
            new CustomEvent('mm-products-sync-error',{
              detail:error
            })
          );
        });
    }
  },

  // Uso interno do sincronizador:
  // atualiza o cache sem reenviar os mesmos dados para o Supabase.
  __replaceProductsFromRemote(list){
    const safeList=Array.isArray(list)?list:[];

    localStorage.setItem(
      'mm_products_v5_preservado',
      JSON.stringify(safeList)
    );

    window.dispatchEvent(
      new CustomEvent('mm-products-changed')
    );
  },

  getSite(){
    try{
      return Object.assign(
        {},
        MM_DEFAULT_SITE,
        JSON.parse(localStorage.getItem('mm_site_v5_preservado')||'{}')
      );
    }catch{
      return MM_DEFAULT_SITE;
    }
  },

  saveSite(cfg){
    localStorage.setItem(
      'mm_site_v5_preservado',
      JSON.stringify(cfg)
    );

    window.dispatchEvent(
      new CustomEvent('mm-site-changed')
    );
  },

  money(v){
    return Number(v||0).toLocaleString(
      'pt-BR',
      {
        style:'currency',
        currency:'BRL'
      }
    );
  },

  getWhatsApp(){
    return (
      localStorage.getItem('mm_whatsapp')||
      '24992963268'
    ).replace(/\D/g,'');
  },

  toast(text){
    const el=document.getElementById('toast');
    if(!el)return;

    el.textContent=text;
    el.classList.add('show');

    clearTimeout(window.__mmToast);

    window.__mmToast=setTimeout(
      ()=>el.classList.remove('show'),
      2400
    );
  },

  escape(s){
    return String(s??'').replace(
      /[&<>'"]/g,
      c=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        "'":'&#39;',
        '"':'&quot;'
      }[c])
    );
  },

  readImageFile(file,max=1100,quality=.80){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();

      r.onerror=reject;

      r.onload=()=>{
        const i=new Image();

        i.onerror=reject;

        i.onload=()=>{
          let w=i.width,h=i.height;

          if(w>max||h>max){
            const q=Math.min(max/w,max/h);
            w=Math.round(w*q);
            h=Math.round(h*q);
          }

          const c=document.createElement('canvas');
          c.width=w;
          c.height=h;

          c.getContext('2d').drawImage(i,0,0,w,h);

          resolve(
            c.toDataURL('image/jpeg',quality)
          );
        };

        i.src=r.result;
      };

      r.readAsDataURL(file);
    });
  }
};
