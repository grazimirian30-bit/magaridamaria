function storyCard(s){
  return `
    <article class="story-card story-card-big">
      <div class="story-card-head only-title">
        <h3>${esc(s.titulo)}</h3>
      </div>

      <div class="comic-strip comic-strip-big">
        <div class="comic-panel client">
          <div class="comic-scene">
            ${s.imagem ? `<img src="${esc(s.imagem)}" alt="Cena da história">` : '<span class="scene-placeholder">🏠</span>'}
          </div>
          <div class="speech client-speech">
            <strong>${esc(s.cliente_nome || 'Cliente')}</strong>
            <p>${esc(s.fala_cliente || '')}</p>
          </div>
        </div>

        <div class="comic-panel maria">
          <img class="comic-maria" src="maria-logo.png" alt="Maria">
          <div class="speech maria-speech">
            <strong>Maria</strong>
            <p>${esc(s.fala_maria || '')}</p>
          </div>
        </div>
      </div>
    </article>
  `;
}
