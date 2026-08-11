(()=>{
const section=document.getElementById('historias'),grid=document.getElementById('storiesGrid'),nav=document.getElementById('storiesNav');if(!section||!grid||!window.MMStories)return;
const esc=MM.escape;

function storyCard(s){
  return `<article class="story-card story-card-catalog">
    <div class="story-card-head story-title-only">
      <h3>${esc(s.titulo)}</h3>
    </div>
    ${s.imagem ? `<button class="story-comic-button" type="button" data-story-image="${esc(s.imagem)}" aria-label="Ampliar ${esc(s.titulo)}">
      <img class="story-comic-image" src="${esc(s.imagem)}" alt="${esc(s.titulo)}">
    </button>` : ''}
  </article>`;
}

async function load(){
  try{
    const list=await MMStories.listPublic();
    if(!list.length){
      section.hidden=true;
      if(nav)nav.hidden=true;
      return;
    }

    grid.innerHTML=list.map(storyCard).join('');
    section.hidden=false;
    if(nav)nav.hidden=false;

    grid.querySelectorAll('[data-story-image]').forEach(b=>{
      b.onclick=()=>{
        const src=b.dataset.storyImage;
        if(typeof openZoom==='function')openZoom(src);
      };
    });
  }catch(e){
    section.hidden=true;
    if(nav)nav.hidden=true;
  }
}

load();
})();
