(()=>{
const C=window.MM_SUPABASE;
if(!C)return;
const base=C.url+'/rest/v1/historias_maria';
const common=(token)=>({apikey:C.key,'Content-Type':'application/json',Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})});
async function readJson(r){let d=null;try{d=await r.json()}catch{}if(!r.ok){const msg=(d&&(d.message||d.hint||d.details||d.code))||('Erro '+r.status);const e=new Error(msg);e.status=r.status;e.data=d;throw e}return d}
window.MMStories={
  async listPublic(){const q='?select=*&publicada=eq.true&order=ordem.asc,created_at.desc';return readJson(await fetch(base+q,{headers:common()}))},
  async listAdmin(){const token=window.MMAuth?.getToken?.()||'';if(!token)throw new Error('Faça login novamente.');return readJson(await fetch(base+'?select=*&order=ordem.asc,created_at.desc',{headers:common(token)}))},
  async save(story){const token=window.MMAuth?.getToken?.()||'';if(!token)throw new Error('Faça login novamente.');const body={titulo:story.titulo,cliente_nome:story.cliente_nome||'',situacao:story.situacao||'',fala_cliente:story.fala_cliente||'',fala_maria:story.fala_maria||'',imagem:story.imagem||'',produto_ids:Array.isArray(story.produto_ids)?story.produto_ids:[],publicada:!!story.publicada,ordem:Number(story.ordem||0),updated_at:new Date().toISOString()};
    if(story.id){const r=await fetch(base+'?id=eq.'+encodeURIComponent(story.id),{method:'PATCH',headers:{...common(token),Prefer:'return=representation'},body:JSON.stringify(body)});return (await readJson(r))[0]}
    const r=await fetch(base,{method:'POST',headers:{...common(token),Prefer:'return=representation'},body:JSON.stringify(body)});return (await readJson(r))[0]
  },
  async remove(id){const token=window.MMAuth?.getToken?.()||'';if(!token)throw new Error('Faça login novamente.');const r=await fetch(base+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:{...common(token),Prefer:'return=representation'}});return readJson(r)}
};
})();
