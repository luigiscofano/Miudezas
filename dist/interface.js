// Ícones desenhados em uma pequena matriz para acompanhar as cenas de 96 pixels.
const formas={
  som:'M1 6h3l4-4v12l-4-4H1z M10 5h2v6h-2z M12 2h2v3h-2z M14 5h2v6h-2z M12 11h2v3h-2z',
  mudo:'M1 6h3l4-4v12l-4-4H1z M10 5h2v2h-2z M14 5h2v2h-2z M12 7h2v2h-2z M10 9h2v2h-2z M14 9h2v2h-2z',
  janela:'M1 4h7v2H3v7h8v-4h2v6H1z M9 1h6v6h-2V4l-4 4-1-1 4-4H9z',
  volta:'M7 3h2v2H7z M5 5h2v2H5z M3 7h11v2H3z M5 9h2v2H5z M7 11h2v2H7z',
  pausa:'M3 2h4v12H3z M10 2h4v12h-4z',
  casas:'M0 9h2V7h2V5h2v2h2v2h1v5H6v-3H4v3H1V9z M8 5h2V3h2V1h1v2h2v2h1v5h-3V7h-2v3H9V5z',
  avulso:'M1 2h14v12H1z M3 6v6h10V6z M3 4v1h10V4z',
  mapa:'M1 3h4V2h2v2H5v9H3v1H1z M6 4h3v1h2v9H9v-1H6z M12 4h2V3h2v10h-2v1h-2z',
  bandeira:'M2 1h2v14H2z M5 2h8v2h-2v2h2v2H5z'
};
export function icone(id) {return '<svg aria-hidden="true" class="icon" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="'+formas[id]+'"/></svg>';}
export function escapar(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function ler(chave,padrao){try{return JSON.parse(localStorage.getItem('miudezas.v1.'+chave))??padrao;}catch{return padrao;}}
export function salvar(chave,valor){try{localStorage.setItem('miudezas.v1.'+chave,JSON.stringify(valor));}catch{/* Armazenamento opcional em janelas privadas. */}}
