/** Preferências adicionais não alteram a chave legada que liga/desliga todo o som. */
export const VOLUMES_PADRAO = Object.freeze({musica:10, efeitos:5});
export const CHAVES_VOLUME = Object.freeze({musica:'volumeMusica', efeitos:'volumeEfeitos'});
export function normalizarVolume(valor,padrao){
  return typeof valor==='number'&&Number.isFinite(valor)?Math.max(0,Math.min(100,Math.round(valor))):padrao;
}
export function lerVolumes(ler){
  return Object.fromEntries(Object.entries(VOLUMES_PADRAO).map(([tipo,padrao])=>[tipo,normalizarVolume(ler(CHAVES_VOLUME[tipo],padrao),padrao)]));
}
export function criarConfiguracoes({ler,salvar,aoMudar=()=>{},aoAbrir=()=>{},documento=document}={}){
  if(documento.querySelector('#configuracoes'))throw new Error('Configurações já inicializadas');
  let volumes=lerVolumes(ler);
  const criar=(tag,classe,texto)=>{const e=documento.createElement(tag);if(classe)e.className=classe;if(texto)e.textContent=texto;return e;};
  const botao=criar('button');botao.id='settings';botao.type='button';botao.title='Configurações';
  botao.setAttribute('aria-label','Configurações');botao.setAttribute('aria-haspopup','dialog');botao.setAttribute('aria-controls','configuracoes');
  botao.innerHTML='<svg aria-hidden="true" class="icon" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M6 0h4v3h2V2h2v2h-1v2h3v4h-3v2h1v2h-2v-1h-2v3H6v-3H4v1H2v-2h1v-2H0V6h3V4H2V2h2v1h2z M6 5H5v6h6V5z"/></svg>';
  const dialogo=criar('dialog','settings-dialog');dialogo.id='configuracoes';dialogo.setAttribute('aria-labelledby','settings-title');
  const cabecalho=criar('div','settings-head');const titulo=criar('h2',null,'Configurações');titulo.id='settings-title';
  const fechar=criar('button','settings-close','×');fechar.type='button';fechar.setAttribute('aria-label','Fechar configurações');cabecalho.append(titulo,fechar);
  const explicacao=criar('p','settings-help','Ajuste a música e os efeitos separadamente. O botão de som da barra continua ligando ou silenciando tudo.');explicacao.id='settings-sound-help';
  const controles=new Map(),bloco=criar('div','settings-volumes');
  for(const [tipo,nome] of [['musica','Música'],['efeitos','Efeitos sonoros']]){
    const grupo=criar('div','settings-volume'),label=criar('label',null,nome);label.htmlFor='settings-'+tipo;
    const valor=criar('output');valor.setAttribute('for',label.htmlFor);
    const range=criar('input');range.id=label.htmlFor;range.type='range';range.min='0';range.max='100';range.step='1';range.setAttribute('aria-describedby','settings-sound-help');
    const linha=criar('div','settings-volume-label');linha.append(label,valor);grupo.append(linha,range);bloco.append(grupo);controles.set(tipo,{range,valor});
    range.addEventListener('input',()=>{volumes={...volumes,[tipo]:normalizarVolume(range.valueAsNumber,VOLUMES_PADRAO[tipo])};salvar(CHAVES_VOLUME[tipo],volumes[tipo]);atualizar();aoMudar({...volumes});});
  }
  function atualizar(){for(const [tipo,{range,valor}] of controles){range.value=String(volumes[tipo]);valor.textContent=volumes[tipo]+'%';range.setAttribute('aria-valuetext',volumes[tipo]+' por cento');}}
  const restaurar=criar('button','settings-reset','Restaurar volumes padrão');restaurar.type='button';
  restaurar.addEventListener('click',()=>{volumes={...VOLUMES_PADRAO};for(const tipo of Object.keys(volumes))salvar(CHAVES_VOLUME[tipo],volumes[tipo]);atualizar();aoMudar({...volumes});});
  const sobre=criar('details','settings-about'),sumario=criar('summary',null,'Sobre o projeto'),texto=criar('div','settings-about-body');
  texto.append(
    criar('p',null,'Miudezas reúne dez jogos de bairro em uma pequena janela. Cenas do cotidiano brasileiro viram desafios curtos de atenção, memória, coordenação e planejamento.'),
    criar('p',null,'Meus dois pais viveram a vida toda na Tijuca. Foi nesse bairro e nas minhas memórias de família que busquei inspiração para a identidade visual de Miudezas. Trouxe temas do cotidiano brasileiro para criar um jogo confortável e aconchegante, como essas lembranças.'),
    criar('p',null,'Entre essas memórias está a obra Balões ou Ritual do Vento, do escultor Gabriel Fonseca, que eu sempre via ao ir para a casa da minha avó na Tijuca. Suas formas e cores aparecem reinterpretadas em pixel art na capa, junto das casas, dos morros, da pipa e do bem-te-vi.'),
    criar('p',null,'Quis transformar essas pequenas cenas em um lugar para desacelerar, explorar e brincar. A arte em pixels e a música suave acompanham esse sentimento de acolhimento.'),
    criar('p',null,'© 2026 Luigi Scofano de Araujo. Obras e referências de terceiros pertencem aos respectivos titulares.'),
    criar('p',null,'Progresso e preferências ficam neste navegador. Use o backup para guardar seus dados; não há conta nem sincronização automática.')
  );
  const referencia=criar('p'),linkReferencia=criar('a',null,'Referência artística: Gabriel Fonseca — Balões ou Ritual do Vento');
  linkReferencia.href='https://gabrielsculptor.com/about/';linkReferencia.target='_blank';linkReferencia.rel='noopener noreferrer';
  referencia.append(linkReferencia);texto.append(referencia);
  sobre.append(sumario,texto);dialogo.append(cabecalho,explicacao,bloco,restaurar,sobre);
  const barra=documento.querySelector('.bar-actions');if(!barra)throw new Error('Barra de ações não encontrada');barra.append(botao);documento.body.append(dialogo);
  botao.addEventListener('click',()=>{if(dialogo.open)return;aoAbrir();dialogo.showModal();fechar.focus();});fechar.addEventListener('click',()=>dialogo.close());
  // Setas, WASD e Escape não alcançam os controles do jogo atrás da janela modal.
  for(const evento of ['keydown','keyup'])dialogo.addEventListener(evento,e=>{e.stopPropagation();if(evento==='keydown'&&e.key==='Escape'){e.preventDefault();dialogo.close();}});
  dialogo.addEventListener('close',()=>botao.focus());atualizar();aoMudar({...volumes});
  return {get volumes(){return {...volumes};},fechar:()=>dialogo.close()};
}
