(()=>{
const C=window.MM_SUPABASE;
if(!C)return;

const sessionKey='mm_sb_token';
const emailKey='mm_sb_email';
const normalize=s=>(s||'').trim().toLowerCase();

const client=window.supabase?.createClient
  ? window.supabase.createClient(C.url,C.key,{
      auth:{
        flowType:'implicit',
        detectSessionInUrl:true,
        persistSession:true,
        autoRefreshToken:true
      }
    })
  : null;

const token=()=>sessionStorage.getItem(sessionKey)||'';

function saveSession(session){
  if(session?.access_token){
    sessionStorage.setItem(sessionKey,session.access_token);
    if(session.user?.email)sessionStorage.setItem(emailKey,session.user.email);
  }
}

function hasRecoveryMarker(){
  const q=new URLSearchParams(location.search);
  const h=new URLSearchParams(location.hash.replace(/^#/,''));
  return (
    q.get('recovery')==='1' ||
    q.has('code') ||
    h.get('type')==='recovery'
  );
}

async function sessionNow(){
  if(!client)return null;
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  saveSession(data.session);
  return data.session;
}

window.MMAuth={
  client,

  async login(email,password){
    if(normalize(email)!==normalize(C.adminEmail)){
      throw new Error('Este e-mail não está autorizado para o painel administrativo.');
    }
    if(!client)throw new Error('Biblioteca de autenticação não carregou. Recarregue a página.');

    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;

    saveSession(data.session);
    return data;
  },

  async logout(){
    try{
      if(client)await client.auth.signOut();
    }catch{}
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(emailKey);
    sessionStorage.removeItem('mm_admin_ok');
  },

  isLogged(){return !!token();},
  getToken(){return token();},

  async requestPasswordReset(email){
    if(normalize(email)!==normalize(C.adminEmail)){
      throw new Error('Use o e-mail do administrador.');
    }
    if(!client)throw new Error('Biblioteca de autenticação não carregou.');

    const redirect=new URL('admin.html?recovery=1',location.href).href.split('#')[0];

    const {error}=await client.auth.resetPasswordForEmail(email,{
      redirectTo:redirect
    });

    if(error)throw error;
    return true;
  },

  async acceptRecoveryFromUrl(){
    if(!client)return false;

    // Segurança: abrir o site normalmente nunca entra em recuperação.
    if(!hasRecoveryMarker())return false;

    try{
      const q=new URLSearchParams(location.search);
      const h=new URLSearchParams(location.hash.replace(/^#/,''));

      if(q.has('code')){
        const {data,error}=await client.auth.exchangeCodeForSession(q.get('code'));
        if(error)throw error;
        saveSession(data.session);
      }else if(
        h.get('type')==='recovery' &&
        h.has('access_token') &&
        h.has('refresh_token')
      ){
        const {data,error}=await client.auth.setSession({
          access_token:h.get('access_token'),
          refresh_token:h.get('refresh_token')
        });
        if(error)throw error;
        saveSession(data.session);
      }

      let session=await sessionNow();
      if(!session){
        await new Promise(r=>setTimeout(r,500));
        session=await sessionNow();
      }

      // Só mostra "Criar nova senha" se houver marcador de recuperação + sessão válida.
      return !!session;
    }catch(e){
      console.error('Falha ao abrir recuperação:',e);
      return false;
    }
  },

  async updatePassword(password){
    if(!client)throw new Error('Biblioteca de autenticação não carregou.');
    const {data,error}=await client.auth.updateUser({password});
    if(error)throw error;
    return data;
  }
};
})();
