import {normalizarRecordes,registrarRecorde} from './recordes.js';
import {normalizarVolta} from './progresso.js';
import {catalogo,nomesNiveis} from './catalogo.js';
import {quintal} from './quintal.js';
import {esquina} from './esquina.js';
import {varanda} from './varanda.js';
import {icone,escapar,ler,salvar} from './interface.js';

const jogos={...quintal,...esquina,...varanda};
const area=document.querySelector('#screen'),rodape=document.querySelector('#foot');
const barra=document.querySelector('#bar-title'), somBotao=document.querySelector('#sound'), janelaBotao=document.querySelector('#popup');
const parametros=new URLSearchParams(location.search), pequena=parametros.get('janela')==='1';
if(pequena) document.body.classList.add('popup');
const ids=catalogo.map(j=>j.id);
const totalJogos=catalogo.length, porPagina=6, totalPaginas=Math.ceil(totalJogos/porPagina);
let tela='inicio',modo='avulso',nivel=1,selecionado=0,pagina=0,volta=null,partida=null,ultimo=null;
let quadro=0,observador=null,tempoAnterior=0,audio=null,comSom=ler('som',false)===true;
let limparCena=null,limparEnquadramento=null;
const segurando=new Map();
const teclas={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'};
const setas={left:'←',right:'→',up:'↑',down:'↓',act:'Bote'};
const nomesDir={left:'Esquerda',right:'Direita',up:'Cima',down:'Baixo',act:'Dar o bote'};
const modosExtras={goteira:'endless',pipa:'endless',fio:'endless',pao:'endless',pisca:'endless',luz:'endless',mare:'generated',rastro:'generated',gude:'generated'};
let tipoPartida='classic',semente=1,recordes=normalizarRecordes(ler('recordes',{}));
const novoMapa=()=>{semente=(Math.random()*4294967296)>>>0;};
const nomeModo=()=>tipoPartida==='endless'?'Sem Parar':tipoPartida==='generated'?'Caminho Novo':nomesNiveis[nivel-1];
const atual=()=>catalogo[selecionado];
// Galeria e pausa usam os ícones aprovados; outras telas mantêm suas cenas.
const foto=(j,extra='',selecao=false)=>'<img src="./arte/'+((selecao&&j.icone)||j.imagem||j.id+'.png')+'" alt="" '+extra+'>';
const btn=(acao,titulo,classe='action',extra='')=>'<button type="button" class="'+classe+'" data-do="'+acao+'" '+extra+'>'+titulo+'</button>';
const paginaHTML=(conteudo,classe='')=>'<section class="screen-page '+classe+'">'+conteudo+'</section>';
function topo(titulo,direita=''){return '<div class="page-head">'+btn('voltar',icone('volta'),'back','aria-label="Voltar"')+'<h2>'+titulo+'</h2>'+(direita?'<span class="count">'+direita+'</span>':'')+'</div>';}
function pfooter(esq,dir){rodape.innerHTML='<span class="signal"><i class="dot"></i>'+esq+'</span><span>'+dir+'</span>';}
function somUI(){
  somBotao.innerHTML=icone(comSom?'som':'mudo');
  somBotao.setAttribute('aria-pressed',String(comSom));
  somBotao.title=comSom?'Desligar som':'Ligar som';
  somBotao.setAttribute('aria-label',somBotao.title);
}
function ativarAudio(){
  if(!comSom)return;
  try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}
}
function tom(hz,seg=.06){
  if(!comSom||!audio||audio.state!=='running')return;
  try{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
    o.type='square';o.frequency.value=hz;g.gain.setValueAtTime(.035,t);
    g.gain.exponentialRampToValueAtTime(.0005,t+seg);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+seg);
  }catch{}
}
somBotao.onclick=()=>{comSom=!comSom;salvar('som',comSom);somUI();ativarAudio();tom(370,.06);};
janelaBotao.innerHTML=icone('janela');somUI();

function lerVolta(){
  return normalizarVolta(ler('volta',null), ids);
}
function manterVolta(){salvar('volta',volta?.resultados.length<totalJogos?volta:null);}
function desligarEntrada(){
  limparCena?.();limparCena=null;
  if(partida?.cancelInput)partida.cancelInput();
  if(partida)for(const d of new Set(segurando.values()))partida.release(d);
  segurando.clear();
}
function interromperQuadros(){
  cancelAnimationFrame(quadro);observador?.disconnect();observador=null;tempoAnterior=0;
  limparEnquadramento?.();limparEnquadramento=null;
}
function mudar(nome){
  interromperQuadros();
  if(tela==='jogo'&&nome!=='jogo')desligarEntrada();
  tela=nome;area.scrollTop=0;
  barra.textContent=tela==='jogo'?atual().nome:'Miudezas';
  // A marca identifica os menus; durante a partida o nome do jogo continua visível.
  barra.classList.toggle('sr-only',tela!=='jogo');
  document.querySelector('.brand-logo').hidden=tela==='jogo';
  janelaBotao.hidden=pequena||!['inicio','galeria','roteiro','nivel'].includes(tela);
  document.title=(tela==='jogo'?atual().nome+' · ':'')+'Miudezas';
}
function inicio(){
  mudar('inicio');partida=null;volta=null;
  // A capa aprovada já contém o título; o cabeçalho acessível evita texto sobreposto.
  area.innerHTML='<div class="hero"><img src="./artes/capas/miudezas-tijuca.png" width="1672" height="941" alt="Miudezas: bairro inspirado na Tijuca, com bem-te-vi, pipa, Cristo ao longe e referência ao Ritual do Vento"><h1 class="sr-only">Miudezas — '+totalJogos+' jogos de bairro</h1></div>'+
    '<div class="home-options">'+
    btn('avulso','<span class="mode-icon">'+icone('avulso')+'</span><span><b>Jogo avulso</b><small>Escolha uma das '+totalJogos+' janelinhas.</small></span><span class="chev" aria-hidden="true">›</span>','mode primary')+
    btn('circuito','<span class="mode-icon">'+icone('mapa')+'</span><span><b>Volta no Bairro</b><small>Jogue os '+totalJogos+' em sequência.</small></span><span class="chev" aria-hidden="true">›</span>','mode')+'</div>';
  pfooter('Luigi Scofano de Araujo','Teclado ou toque');
}
function galeria(){
  modo='avulso';mudar('galeria');
  pagina=Math.max(0,Math.min(totalPaginas-1,pagina));
  const inicioPag=pagina*porPagina;
  const cards=catalogo.slice(inicioPag,inicioPag+porPagina).map((j,k)=>btn('escolher',foto(j,'',true)+'<span>'+j.nome+'</span>','card','data-index="'+(inicioPag+k)+'"')).join('');
  const pontos=Array.from({length:totalPaginas},(_,i)=>'<i class="'+(pagina===i?'on':'')+'"></i>').join('');
  area.innerHTML=paginaHTML(topo('Escolha um jogo',(pagina+1)+' / '+totalPaginas)+'<div class="gallery">'+cards+'</div><div class="pager">'+
    btn('anterior','‹ Anterior','small-btn',pagina===0?'disabled':'')+'<span class="pips" aria-hidden="true">'+pontos+'</span>'+
    btn('seguinte','Próxima ›','small-btn',pagina===totalPaginas-1?'disabled':'')+'</div>');
  pfooter('Jogo avulso',totalJogos+' minigames');
}

function roteiro(){
  modo='circuito';mudar('roteiro');const salvo=lerVolta();
  area.innerHTML=paginaHTML(topo('Volta no Bairro',totalJogos+' paradas')+'<p class="body-copy">Da cozinha à pracinha. Escolha um nível para jogar as '+totalJogos+' paradas.</p><ol class="route-grid">'+catalogo.map((j,i)=>'<li>'+foto(j)+'<span class="idx">'+String(i+1).padStart(2,'0')+'</span><span>'+j.nome+'</span></li>').join('')+'</ol>'+
    '<div class="actions">'+(salvo?btn('retomar','Retomar · '+(salvo.resultados.length+1)+'/'+totalJogos)+btn('escolher-nivel','Nova volta','action secondary'):btn('escolher-nivel','Escolher nível  ›'))+'</div>','overview');
  pfooter('Volta no Bairro',salvo?'Volta em andamento':'Do balde à pracinha');
}
function niveis(){
  mudar('nivel');const j=atual(),circuito=modo==='circuito';
  const intro=circuito?'<div><h3 class="small-title">Uma volta, '+totalJogos+' paradas</h3><p class="body-copy">O nível muda o ritmo dos jogos e os desafios dos quebra-cabeças.</p></div>':
    '<div class="game-intro">'+foto(j)+'<div><h3>'+j.nome+'</h3><p>'+j.regra+'</p></div></div><p class="controls-copy">'+j.controle+'</p>';
  const lista=nomesNiveis.map((n,i)=>btn('nivel','<span class="number">'+(i+1)+'</span>'+n+'<small>'+(circuito?['Leve','Intermediário','Desafiador'][i]:j.niveis[i])+'</small>','level-btn '+(tipoPartida==='classic'&&nivel===i+1?'selected':''),'data-index="'+(i+1)+'" aria-pressed="'+(tipoPartida==='classic'&&nivel===i+1)+'"')).join('');
  const extra=!circuito&&modosExtras[j.id]?btn('modo-extra',(modosExtras[j.id]==='endless'?'Sem Parar':'Caminho Novo')+'<small>'+(modosExtras[j.id]==='endless'?'Até errar · recorde: '+(recordes[j.id]||0):'Nova fase com solução validada')+'</small>','level-btn '+(tipoPartida!=='classic'?'selected':''),'aria-pressed="'+(tipoPartida!=='classic')+'"'):'';
  area.innerHTML=paginaHTML(topo('Escolha o nível')+intro+'<div class="level-list">'+lista+extra+'</div><div class="actions">'+btn('comecar',circuito?'Começar a volta  ›':'Jogar  ›')+'</div>');
  pfooter(circuito?'Volta no Bairro':'Jogo avulso','3 níveis abertos');
}
function parada(){
  tipoPartida='classic';selecionado=volta.resultados.length;nivel=volta.nivel;const j=atual();mudar('parada');
  area.innerHTML=paginaHTML(topo('Próxima parada',(selecionado+1)+' / '+totalJogos)+'<div class="modal-box">'+foto(j)+'<h2>'+j.nome+'</h2><p class="body-copy">'+j.regra+'</p><p class="controls-copy">'+j.controle+'</p></div><div class="actions">'+btn('partir','Jogar esta parada  ›')+'</div>');
  pfooter('Volta no Bairro',nomesNiveis[nivel-1]);
}
function criarPartida(){
  const instancia=jogos[atual().id](nivel,{tone:tom,finish:finalizar},{mode:tipoPartida,seed:semente});
  partida=instancia;ultimo=null;mostrarJogo();
}
function ativarDir(fonte,dir){
  if(tela!=='jogo'||segurando.has(fonte))return;
  const repetida=[...segurando.values()].includes(dir);segurando.set(fonte,dir);
  if(!repetida)partida.press(dir);
}
function cancelarDirecoes(){
  // Petelecos precisam cancelar sem lançar; movimento contínuo precisa soltar.
  if(partida?.cancelInput)partida.cancelInput();
  else if(partida)for(const direcao of new Set(segurando.values()))partida.release(direcao);
  segurando.clear();
}
function soltarDir(fonte){
  const dir=segurando.get(fonte);if(!dir)return;
  segurando.delete(fonte);
  if(tela==='jogo'&&!Array.from(segurando.values()).includes(dir))partida.release(dir);
}
function ligarCena(canvas){
  const j=atual();let gesto=null;
  const coords=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*96/r.width,(e.clientY-r.top)*96/r.height];};
  canvas.onpointerdown=e=>{
    if(gesto||tela!=='jogo'||(e.button!==undefined&&e.button!==0))return;e.preventDefault();ativarAudio();
    try{canvas.setPointerCapture(e.pointerId);}catch{}
    const [x,y]=coords(e);gesto={x,y,id:e.pointerId};
    if(partida.point)partida.point(x,y,'down');
    else if(j.eixo==='horizontal')ativarDir('cena',x<48?'left':'right');
    else if(j.eixo==='vertical')ativarDir('cena',y<48?'up':'down');
    else if(j.eixo==='um')ativarDir('cena','act');
  };
  canvas.onpointermove=e=>{if(tela==='jogo'&&gesto?.id===e.pointerId&&partida.point)partida.point(...coords(e),'move');};
  function fim(e,cancelado){
    if(!gesto||gesto.id!==e.pointerId||tela!=='jogo')return;
    const [x,y]=coords(e),dx=x-gesto.x,dy=y-gesto.y;gesto=null;
    if(partida.point)partida.point(x,y,cancelado?'cancel':'up');
    else if(!cancelado&&j.eixo==='quatro'&&Math.max(Math.abs(dx),Math.abs(dy))>4){
      ativarDir('cena',Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'));
    }
    soltarDir('cena');
  }
  canvas.onpointerup=e=>fim(e,false);canvas.onpointercancel=e=>fim(e,true);
  // Perder captura não é soltar um peteleco nem motivo para pausar a partida.
  canvas.onlostpointercapture=e=>fim(e,true);
  canvas.oncontextmenu=e=>e.preventDefault();
  limparCena=()=>{
    gesto=null;
    canvas.onpointerdown=canvas.onpointermove=canvas.onpointerup=null;
    canvas.onpointercancel=canvas.onlostpointercapture=canvas.oncontextmenu=null;
  };
}
function mostrarJogo(){
  mudar('jogo');const j=atual();
  const chapa=j.id==='pao';
  const dirs=j.eixo==='quatro'?['left','up','down','right']:j.eixo==='vertical'?['up','down']:j.eixo==='um'?['act']:['left','right'];
  area.innerHTML='<div class="game-area"><div class="game-head">'+btn('pausa',icone('pausa'),'icon-button','aria-label="Pausar" title="Pausar"')+'<strong>'+j.nome+'</strong><span class="level-tag">'+nomeModo()+'</span></div><div class="stage"><canvas width="96" height="96" aria-label="Cena jogável de '+j.nome+'"></canvas></div><div class="game-hud"></div>'+ (chapa ? '<div class="chapa-tools" aria-label="Escolha o utensílio"><button type="button" data-tool="espatula" aria-pressed="true">1 · Espátula <small>ovo</small></button><button type="button" data-tool="pinca" aria-pressed="false">2 · Pinça <small>pão</small></button></div>' : '') +'<div class="pad" aria-label="Controles">'+dirs.map(d=>'<button type="button" class="'+(d==='act'?'single':'')+'" data-dir="'+d+'" aria-label="'+(d==='act'?(j.acao||nomesDir[d]):nomesDir[d])+'">'+(d==='act'?(j.acao||setas[d]):setas[d])+'</button>').join('')+'</div></div>';
  area.querySelector('.game-area').classList.toggle('chapa-game',chapa);
  area.querySelector('.game-area').style.setProperty('--game-color',j.cor);pfooter(modo==='circuito'?'Parada '+(selecionado+1)+' de '+totalJogos:'Jogo avulso','Esc pausa');
  const c=area.querySelector('canvas'),stage=c.parentElement,ctx=c.getContext('2d'),hud=area.querySelector('.game-hud');
  ligarCena(c);ctx.imageSmoothingEnabled=false;
  const moldura=document.querySelector('.window');
  const desktop=window.matchMedia?.('(hover: hover) and (pointer: fine)');
  function ajustar(){
    const r=stage.getBoundingClientRect();
    if(desktop?.matches){
      // A cena é quadrada. Ajustamos a moldura à altura livre, não os desenhos:
      // assim não sobram faixas laterais e nenhum obstáculo fica recortado.
      const bordas=moldura.offsetWidth-moldura.clientWidth;
      const larguraDisponivel=Math.min(492,window.innerWidth-(pequena?0:30))-bordas;
      const largura=Math.max(0,Math.floor(Math.min(larguraDisponivel,r.height)));
      moldura.style.width=(largura+bordas)+'px';
    }else moldura.style.width='';
    const cena=stage.getBoundingClientRect(),tam=Math.floor(Math.min(cena.width,cena.height));
    c.style.width=tam+'px';c.style.height=tam+'px';
  }
  window.addEventListener('resize',ajustar);
  desktop?.addEventListener('change',ajustar);
  limparEnquadramento=()=>{
    window.removeEventListener('resize',ajustar);
    desktop?.removeEventListener('change',ajustar);
    moldura.style.width='';
  };
  observador=new ResizeObserver(ajustar);observador.observe(stage);ajustar();
  const esta=partida;
  function mostrarStatus(){
    esta.draw(ctx);
    const pontos=tipoPartida==='endless'?esta.score():0;
    if(tipoPartida==='endless'&&pontos>(recordes[j.id]||0)){
      recordes=registrarRecorde(recordes,j.id,pontos);salvar('recordes',recordes);
    }
    const h=esta.hud()+(tipoPartida==='endless'?' · Pontos '+pontos+' · Recorde '+(recordes[j.id]||0):tipoPartida==='generated'?' · Fase '+semente:'');if(hud.textContent!==h)hud.textContent=h;
    if(chapa){
      const estado=esta.snapshot(), pontos=['cru','no ponto','tostado','queimado'];
      for(const b of area.querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed',String(b.dataset.tool===estado.utensilio));
      estado.alimentos.forEach((alimento,i)=>{
        const b=area.querySelector('[data-dir="'+(i===0?'left':'right')+'"]');
        const nome=alimento.tipo==='ovo'?'Ovo':'Pão';
        b.textContent=(i===0?'← ':'→ ')+nome;
        b.setAttribute('aria-label','Recolher '+nome.toLowerCase()+' à '+(i===0?'esquerda':'direita')+', '+pontos[alimento.estado]);
        b.disabled=estado.troca||alimento.reposicao;
      });
    }
  }
  for(const b of area.querySelectorAll('[data-tool]')) b.onclick=()=>{esta.selectTool(b.dataset.tool);mostrarStatus();};
  function frame(t){
    if(tela!=='jogo'||partida!==esta)return;
    const dt=tempoAnterior?Math.min(.08,(t-tempoAnterior)/1000):0;tempoAnterior=t;
    esta.update(dt);if(tela!=='jogo')return;mostrarStatus();quadro=requestAnimationFrame(frame);
  }
  mostrarStatus();quadro=requestAnimationFrame(frame);
  for(const b of area.querySelectorAll('[data-dir]')){
    if(chapa){b.onclick=()=>{ativarAudio();esta.press(b.dataset.dir);};continue;}
    b.onpointerdown=e=>{e.preventDefault();ativarAudio();b.setPointerCapture(e.pointerId);ativarDir('pad'+e.pointerId,b.dataset.dir);};
    b.onpointerup=e=>soltarDir('pad'+e.pointerId);
    b.onpointercancel=b.onlostpointercapture=e=>{
      const fonte='pad'+e.pointerId;
      if(!segurando.has(fonte))return;
      cancelarDirecoes();
    };
    b.onclick=e=>{if(e.detail===0){ativarDir('acessivel',b.dataset.dir);soltarDir('acessivel');}};
  }
}
function pausar(){
  if(tela!=='jogo')return;mudar('pausa');
  area.innerHTML=paginaHTML(topo('Pausa')+'<div class="modal-box">'+foto(atual(),'class="pause-art"',true)+'<h2>'+atual().nome+'</h2><p class="body-copy">'+atual().regra+'</p><p class="controls-copy">'+atual().controle+'</p></div><div class="result-actions pause-actions">'+btn('continuar','Continuar')+btn('voltar-fases','Voltar às fases','action secondary')+btn('sair','Voltar ao menu','action secondary')+'</div>');
  pfooter(modo==='circuito'?'Parada '+(selecionado+1)+' de '+totalJogos:'Jogo avulso','Partida pausada');
}
function voltarAsFases(){
  // Abandona somente a tentativa: o histórico da volta e os recordes ficam intactos.
  desligarEntrada();interromperQuadros();partida=null;ultimo=null;modo='avulso';niveis();
}
function finalizar(venceu,mensagem){
  if(tela!=='jogo')return;
  // A pontuação é capturada antes de descartar a instância; o recorde nunca diminui.
  if(tipoPartida==='endless'){
    const pontos=partida.score(),atualizados=registrarRecorde(recordes,atual().id,pontos);
    if(atualizados!==recordes){recordes=atualizados;salvar('recordes',recordes);}
    mensagem+=' Pontuação: '+pontos+'. Recorde pessoal: '+(recordes[atual().id]||0)+'.';
  }
  ultimo={venceu,mensagem};mudar('resultado');partida=null;
  const principal=modo==='circuito'?btn('avancar',selecionado===totalJogos-1?'Concluir a volta':'Próxima parada  ›'):(tipoPartida==='generated'&&venceu?btn('outra-fase','Gerar outra fase'):btn('repetir',tipoPartida==='generated'?'Tentar a mesma fase':'Jogar de novo'));
  const secundaria=modo==='circuito'?btn('repetir','Repetir parada','action secondary'):btn('lista','Escolher jogo','action secondary');
  area.innerHTML=paginaHTML('<div class="modal-box">'+foto(atual())+'<span class="small-title">'+atual().nome+'</span><h2>'+(venceu?'Conseguiu!':'Fim da rodada')+'</h2><p class="body-copy">'+escapar(mensagem)+'</p></div><div class="result-actions">'+principal+secundaria+'</div>');
  pfooter(modo==='circuito'?'Parada '+(selecionado+1)+' de '+totalJogos:'Jogo avulso',nomeModo());
}
function resumo(){
  mudar('resumo');const total=volta.resultados.filter(Boolean).length;
  area.innerHTML=paginaHTML('<div class="modal-box"><span class="small-title">Volta no Bairro</span><h2>De volta em casa</h2><p class="body-copy">'+totalJogos+' paradas visitadas · '+total+' desafios vencidos.</p></div><div class="summary-cards">'+catalogo.map((j,i)=>'<img src="./arte/'+(j.imagem||j.id+'.png')+'" class="'+(volta.resultados[i]?'':'miss')+'" title="'+j.nome+' · '+(volta.resultados[i]?'Vitória':'Tentativa')+'" alt="'+j.nome+' · '+(volta.resultados[i]?'Vitória':'Tentativa')+'">').join('')+'</div><div class="actions">'+btn('sair','Voltar ao início')+'</div>');
  pfooter('Volta completa',nomesNiveis[nivel-1]);
}
function voltar(){
  if(tela==='nivel'){modo==='circuito'?roteiro():galeria();}
  else if(tela==='jogo')pausar();else if(tela==='pausa')mostrarJogo();
  else if(tela==='parada')roteiro();else if(tela==='resultado'&&modo==='circuito')roteiro();
  else if(tela==='resultado')galeria();else inicio();
}
function abrirJanela(destino){
  const u=new URL(location.href);u.search='';u.hash='';
  for(const [k,v] of Object.entries({janela:1,tela:destino,modo,nivel,jogo:selecionado,pag:pagina,tipo:tipoPartida,semente}))u.searchParams.set(k,v);
  try{const p=window.open(u.href,'miudezas_jogo','popup=yes,width=492,height=492,resizable=yes,scrollbars=yes');if(p){p.focus();return true;}}catch{}
  return false;
}
function entrar(m){
  modo=m;pagina=0;
  if(!pequena&&matchMedia('(min-width: 700px) and (pointer: fine)').matches&&abrirJanela(m==='avulso'?'galeria':'roteiro'))return;
  m==='avulso'?galeria():roteiro();
}
janelaBotao.onclick=()=>abrirJanela(tela);
function acao(el){
  const a=el.dataset.do;
  if(a==='avulso'||a==='circuito'){entrar(a);return;}
  if(a==='voltar'){voltar();return;}
  if(a==='sair'){inicio();return;}
  if(a==='voltar-fases'){voltarAsFases();return;}
  if(a==='lista'){galeria();return;}
  if(a==='seguinte'||a==='anterior'){pagina=Math.max(0,Math.min(totalPaginas-1,pagina+(a==='seguinte'?1:-1)));galeria();return;}
  if(a==='escolher'){tipoPartida='classic';selecionado=Number(el.dataset.index);nivel=1;niveis();return;}
  if(a==='escolher-nivel'){tipoPartida='classic';nivel=1;niveis();return;}
  if(a==='nivel'){tipoPartida='classic';nivel=Number(el.dataset.index);niveis();area.querySelector('.selected').focus({preventScroll:true});return;}
  if(a==='modo-extra'){tipoPartida=modosExtras[atual().id]||'classic';nivel=tipoPartida==='generated'?3:1;novoMapa();niveis();return;}
  if(a==='outra-fase'){novoMapa();criarPartida();return;}
  if(a==='comecar'){
    if(modo==='avulso'){criarPartida();return;}
    volta={nivel,ids:[...ids],resultados:[]};manterVolta();parada();return;
  }
  if(a==='retomar'){volta=lerVolta();if(volta)parada();else roteiro();return;}
  if(a==='partir'||a==='repetir'){criarPartida();return;}
  if(a==='pausa'){pausar();return;}
  if(a==='continuar'){mostrarJogo();return;}
  if(a==='avancar'&&ultimo){
    volta.resultados.push(ultimo.venceu);ultimo=null;manterVolta();
    if(volta.resultados.length===totalJogos)resumo();else parada();
  }
}
area.addEventListener('click',e=>{const el=e.target.closest('button[data-do]');if(el&&!el.disabled){ativarAudio();acao(el);}});
function botoesMenu(){return [...area.querySelectorAll('button:not([disabled])')];}
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const dir=teclas[e.key]||teclas[e.key.toLowerCase()];
  if(e.key==='Escape'){e.preventDefault();if(!e.repeat)voltar();return;}
  if(tela==='jogo'){
    if(atual().id==='pao' && (e.key==='1'||e.key==='2')){
      e.preventDefault();if(!e.repeat)partida.selectTool(e.key==='1'?'espatula':'pinca');return;
    }
    if(!dir)return;e.preventDefault();ativarAudio();
    if(atual().direcaoAcao&&dir!==atual().direcaoAcao)return;
    if(!e.repeat)ativarDir('key'+e.code,atual().eixo==='um'?'act':dir);
    return;
  }
  if(!dir&&e.key!=='Enter')return;
  if(e.key==='Enter'){
    if(e.repeat){e.preventDefault();return;}
    if(document.activeElement?.tagName!=='BUTTON'){e.preventDefault();(area.querySelector('.mode,.card,.action,.selected')||botoesMenu()[0])?.click();}
    return;
  }
  const bs=botoesMenu();if(!bs.length)return;e.preventDefault();
  const el=document.activeElement,i=bs.indexOf(el),k=dir==='up'||dir==='left'?-1:1;
  if(tela==='galeria'&&el?.classList.contains('card')&&(dir==='up'||dir==='down')){
    const cards=[...area.querySelectorAll('.card')],j=cards.indexOf(el)+3*k;
    (cards[j]||bs[k<0?0:bs.length-1]).focus();return;
  }
  bs[i<0?Math.max(0,bs.findIndex(b=>b.matches('.mode,.card,.action,.selected'))):(i+k+bs.length)%bs.length].focus({preventScroll:false});
});
document.addEventListener('keyup',e=>soltarDir('key'+e.code));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pausar();});
window.addEventListener('blur',()=>{
  // Alguns navegadores móveis emitem blur transitório durante interação.
  // A perda real de foco e a aba oculta continuam pausando imediatamente.
  if(tela==='jogo'&&(document.hidden||!document.hasFocus()))pausar();
});
const inicial=parametros.get('tela');
modo=parametros.get('modo')==='circuito'?'circuito':'avulso';
nivel=Math.max(1,Math.min(3,Number(parametros.get('nivel'))||1));
selecionado=Math.max(0,Math.min(ids.length-1,Number(parametros.get('jogo'))||0));
pagina=Math.max(0,Math.min(totalPaginas-1,Math.floor(Number(parametros.get('pag')))||0));
// A janela mantém somente modos permitidos para este jogo; circuito continua autoral.
if(modo==='avulso'&&parametros.get('tipo')===modosExtras[atual().id]){
  tipoPartida=parametros.get('tipo');
  const valor=Number(parametros.get('semente'));
  if(Number.isInteger(valor)&&valor>=0&&valor<=4294967295)semente=valor;
}
if (parametros.has('jogo') && !catalogo[Number(parametros.get('jogo'))]) galeria();
else if(inicial==='galeria')galeria();else if(inicial==='roteiro')roteiro();else if(inicial==='nivel')niveis();else inicio();

