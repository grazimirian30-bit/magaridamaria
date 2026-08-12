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

function clearSavedSession(){
  sessionStorage.removeItem(sessionKey);
  sessionStorage.removeItem(emailKey);
}

function saveSession(session){
  if(session?.access_token){
    sessionStorage.setItem(sessionKey,session.access_token);
    if(session.user?.email){
      sessionStorage.setItem(emailKey,session.user.email);
    }
    return;
  }
  clearSavedSession();
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

async function sessionNow(forceRefresh=false){
  if(!client)return null;

  const {data,error}=await client.auth.getSession();
  if(error)throw error;

  let session=data.session;

  if(session){
    const now=Math.floor(Date.now()/1000);
    const expiresAt=Number(session.expires_at||0);

    if(
      forceRefresh ||
      !expiresAt ||
      expiresAt <= now + 60
    ){
      const refreshed=await client.auth.refreshSession();

      if(refreshed.error){
        throw refreshed.error;
      }

      session=refreshed.data.session;
    }
  }

  saveSession(session);
  return session;
}

/*
  Mantém a cópia usada pelo site sempre atualizada
  quando o Supabase renova o JWT.
*/
if(client){
  client.auth.onAuthStateChange((event,session)=>{
    if(session?.access_token){
      saveSession(session);
    }else if(event==='SIGNED_OUT'){
      clearSavedSession();
    }
  });

  /*
    Ao abrir/recarregar a página, recupera a sessão
    persistida pelo Supabase e substitui qualquer
    JWT antigo salvo no sessionStorage.
  */
  sessionNow(false).catch(error=>{
    console.warn('Não foi possível atualizar a sessão do Supabase:',error);
  });
}

window.MMAuth={
  client,

  async login(email,password){
    if(normalize(email)!==normalize(C.adminEmail)){
      throw new Error('Este e-mail não está autorizado para o painel administrativo.');
    }

    if(!client){
      throw new Error('Biblioteca de autenticação não carregou. Recarregue a página.');
    }

    const {data,error}=await client.auth.signInWithPassword({
      email,
      password
    });

    if(error)throw error;

    saveSession(data.session);
    return data;
  },

  async logout(){
    try{
      if(client)await client.auth.signOut();
    }catch{}

    clearSavedSession();
    sessionStorage.removeItem('mm_admin_ok');
  },

  isLogged(){
    return !!token();
  },

  getToken(){
    return token();
  },

  async getFreshToken(){
    if(!client){
      /*
        Scanner antigo / fallback:
        usa a cópia existente se a biblioteca
        do Supabase não estiver disponível.
      */
      return token();
    }

    const session=await sessionNow(false);

    return session?.access_token||'';
  },

  async forceRefreshToken(){
    if(!client)return token();

    const session=await sessionNow(true);

    return session?.access_token||'';
  },

  async requestPasswordReset(email){
    if(normalize(email)!==normalize(C.adminEmail)){
      throw new Error('Use o e-mail do administrador.');
    }

    if(!client){
      throw new Error('Biblioteca de autenticação não carregou.');
    }

    const redirect=
      new URL(
        'admin.html?recovery=1',
        location.href
      ).href.split('#')[0];

    const {error}=
      await client.auth.resetPasswordForEmail(
        email,
        {redirectTo:redirect}
      );

    if(error)throw error;
    return true;
  },

  async acceptRecoveryFromUrl(){
    if(!client)return false;

    if(!hasRecoveryMarker())return false;

    try{
      const q=
        new URLSearchParams(
          location.search
        );

      const h=
        new URLSearchParams(
          location.hash.replace(/^#/,'')
        );

      if(q.has('code')){
        const {data,error}=
          await client.auth.exchangeCodeForSession(
            q.get('code')
          );

        if(error)throw error;
        saveSession(data.session);

      }else if(
        h.get('type')==='recovery' &&
        h.has('access_token') &&
        h.has('refresh_token')
      ){

        const {data,error}=
          await client.auth.setSession({
            access_token:h.get('access_token'),
            refresh_token:h.get('refresh_token')
          });

        if(error)throw error;
        saveSession(data.session);
      }

      let session=
        await sessionNow(false);

      if(!session){
        await new Promise(
          resolve=>setTimeout(resolve,500)
        );

        session=
          await sessionNow(false);
      }

      return !!session;

    }catch(error){
      console.error(
        'Falha ao abrir recuperação:',
        error
      );

      return false;
    }
  },

  async updatePassword(password){
    if(!client){
      throw new Error(
        'Biblioteca de autenticação não carregou.'
      );
    }

    const {data,error}=
      await client.auth.updateUser({
        password
      });

    if(error)throw error;
    return data;
  }
};
})();
