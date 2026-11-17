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
let tela='inicio',modo='avulso',nivel=1,selecionado=0,pagina=0,volta=null,partida=null,ultimo=null;
let quadro=0,observador=null,tempoAnterior=0,audio=null,comSom=ler('som',false)===true;
const segurando=new Map();
const teclas={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'};
const setas={left:'←',right:'→',up:'↑',down:'↓',act:'Bote'};
const nomesDir={left:'Esquerda',right:'Direita',up:'Cima',down:'Baixo',act:'Dar o bote'};
const atual=()=>catalogo[selecionado];
const foto=(j,extra='')=>'<img src="./arte/'+j.id+'.png" alt="" '+extra+'>';
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
  const v=ler('volta',null);
  if(!v||![1,2,3].includes(v.nivel)||!Array.isArray(v.resultados)||v.resultados.length>=12||
      !v.resultados.every(r=>typeof r==='boolean'))return null;
  return v;
}
function manterVolta(){salvar('volta',volta?.resultados.length<12?volta:null);}
function desligarEntrada(){
  if(partida?.cancelInput)partida.cancelInput();
  if(partida)for(const d of new Set(segurando.values()))partida.release(d);
  segurando.clear();
}
function interromperQuadros(){
  cancelAnimationFrame(quadro);observador?.disconnect();observador=null;tempoAnterior=0;
}
function mudar(nome){
  interromperQuadros();
  if(tela==='jogo'&&nome!=='jogo')desligarEntrada();
  tela=nome;area.scrollTop=0;
  barra.textContent=tela==='jogo'?atual().nome:'Miudezas';
  janelaBotao.hidden=pequena||!['inicio','galeria','roteiro','nivel'].includes(tela);
  document.title=(tela==='jogo'?atual().nome+' · ':'')+'Miudezas';
}
function inicio(){
  mudar('inicio');partida=null;volta=null;
  area.innerHTML='<div class="hero"><img src="./arte/bairro.png" alt="Casas de bairro, um bem-te-vi no fio e uma pipa sobre os telhados"><div class="brand"><h1>Miudezas</h1><p>Doze jogos de bairro</p></div></div>'+
    '<div class="home-options">'+
    btn('avulso','<span class="mode-icon">'+icone('avulso')+'</span><span><b>Jogo avulso</b><small>Escolha uma das doze janelinhas.</small></span><span class="chev" aria-hidden="true">›</span>','mode primary')+
    btn('circuito','<span class="mode-icon">'+icone('mapa')+'</span><span><b>Volta no Bairro</b><small>Jogue os doze em sequência.</small></span><span class="chev" aria-hidden="true">›</span>','mode')+'</div>';
  pfooter('Luigi Scofano de Araujo','Teclado ou toque');
}
function galeria(){
  modo='avulso';mudar('galeria');
  const inicioPag=pagina*6;
  const cards=catalogo.slice(inicioPag,inicioPag+6).map((j,k)=>btn('escolher',foto(j)+'<span>'+j.nome+'</span>','card','data-index="'+(inicioPag+k)+'"')).join('');
  area.innerHTML=paginaHTML(topo('Escolha um jogo',(pagina+1)+' / 2')+'<div class="gallery">'+cards+'</div><div class="pager">'+
    btn('anterior','‹ Anterior','small-btn',pagina===0?'disabled':'')+'<span class="pips" aria-hidden="true"><i class="'+(pagina===0?'on':'')+'"></i><i class="'+(pagina===1?'on':'')+'"></i></span>'+
    btn('seguinte','Próxima ›','small-btn',pagina===1?'disabled':'')+'</div>');
  pfooter('Jogo avulso','12 minigames');
}
function roteiro(){
  modo='circuito';mudar('roteiro');const salvo=lerVolta();
  area.innerHTML=paginaHTML(topo('Volta no Bairro','12 paradas')+'<p class="body-copy">Da cozinha de Goteira ao quintal dos vaga-lumes. Escolha um nível para jogar as doze paradas.</p><ol class="route-grid">'+catalogo.map((j,i)=>'<li>'+foto(j)+'<span class="idx">'+String(i+1).padStart(2,'0')+'</span><span>'+j.nome+'</span></li>').join('')+'</ol>'+
    '<div class="actions">'+(salvo?btn('retomar','Retomar · '+(salvo.resultados.length+1)+'/12')+btn('escolher-nivel','Nova volta','action secondary'):btn('escolher-nivel','Escolher nível  ›'))+'</div>','overview');
  pfooter('Volta no Bairro',salvo?'Volta em andamento':'Do balde ao vaga-lume');
}
function niveis(){
  mudar('nivel');const j=atual(),circuito=modo==='circuito';
  const intro=circuito?'<div><h3 class="small-title">Uma volta, doze paradas</h3><p class="body-copy">O nível muda o ritmo dos jogos e os desafios dos quebra-cabeças.</p></div>':
    '<div class="game-intro">'+foto(j)+'<div><h3>'+j.nome+'</h3><p>'+j.regra+'</p></div></div><p class="controls-copy">'+j.controle+'</p>';
  const lista=nomesNiveis.map((n,i)=>btn('nivel','<span class="number">'+(i+1)+'</span>'+n+'<small>'+(circuito?['Leve','Intermediário','Desafiador'][i]:j.niveis[i])+'</small>','level-btn '+(nivel===i+1?'selected':''),'data-index="'+(i+1)+'" aria-pressed="'+(nivel===i+1)+'"')).join('');
  area.innerHTML=paginaHTML(topo('Escolha o nível')+intro+'<div class="level-list">'+lista+'</div><div class="actions">'+btn('comecar',circuito?'Começar a volta  ›':'Jogar  ›')+'</div>');
  pfooter(circuito?'Volta no Bairro':'Jogo avulso','3 níveis abertos');
}
function parada(){
  selecionado=volta.resultados.length;nivel=volta.nivel;const j=atual();mudar('parada');
  area.innerHTML=paginaHTML(topo('Próxima parada',(selecionado+1)+' / 12')+'<div class="modal-box">'+foto(j)+'<h2>'+j.nome+'</h2><p class="body-copy">'+j.regra+'</p><p class="controls-copy">'+j.controle+'</p></div><div class="actions">'+btn('partir','Jogar esta parada  ›')+'</div>');
  pfooter('Volta no Bairro',nomesNiveis[nivel-1]);
}
function criarPartida(){
  const instancia=jogos[atual().id](nivel,{tone:tom,finish:finalizar});
  partida=instancia;ultimo=null;mostrarJogo();
}
function ativarDir(fonte,dir){
  if(tela!=='jogo'||segurando.has(fonte))return;
  const repetida=[...segurando.values()].includes(dir);segurando.set(fonte,dir);
  if(!repetida)partida.press(dir);
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
    if(gesto||tela!=='jogo')return;e.preventDefault();ativarAudio();canvas.setPointerCapture(e.pointerId);
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
}
function mostrarJogo(){
  mudar('jogo');const j=atual();
  const dirs=j.eixo==='quatro'?['left','up','down','right']:j.eixo==='vertical'?['up','down']:j.eixo==='um'?['act']:['left','right'];
  area.innerHTML='<div class="game-area"><div class="game-head">'+btn('pausa',icone('pausa'),'icon-button','aria-label="Pausar" title="Pausar"')+'<strong>'+j.nome+'</strong><span class="level-tag">'+nomesNiveis[nivel-1]+'</span></div><div class="stage"><canvas width="96" height="96" aria-label="Cena jogável de '+j.nome+'"></canvas></div><div class="game-hud"></div><div class="pad" aria-label="Controles">'+dirs.map(d=>'<button type="button" class="'+(d==='act'?'single':'')+'" data-dir="'+d+'" aria-label="'+nomesDir[d]+'">'+setas[d]+'</button>').join('')+'</div></div>';
  area.querySelector('.game-area').style.setProperty('--game-color',j.cor);pfooter(modo==='circuito'?'Parada '+(selecionado+1)+' de 12':'Jogo avulso','Esc pausa');
  const c=area.querySelector('canvas'),stage=c.parentElement,ctx=c.getContext('2d'),hud=area.querySelector('.game-hud');
  ligarCena(c);ctx.imageSmoothingEnabled=false;
  function ajustar(){const r=stage.getBoundingClientRect(),tam=Math.floor(Math.min(r.width,r.height));c.style.width=tam+'px';c.style.height=tam+'px';}
  observador=new ResizeObserver(ajustar);observador.observe(stage);ajustar();
  const esta=partida;
  function mostrarStatus(){esta.draw(ctx);const h=esta.hud();if(hud.textContent!==h)hud.textContent=h;}
  function frame(t){
    if(tela!=='jogo'||partida!==esta)return;
    const dt=tempoAnterior?Math.min(.08,(t-tempoAnterior)/1000):0;tempoAnterior=t;
    esta.update(dt);if(tela!=='jogo')return;mostrarStatus();quadro=requestAnimationFrame(frame);
  }
  mostrarStatus();quadro=requestAnimationFrame(frame);
  for(const b of area.querySelectorAll('[data-dir]')){
    b.onpointerdown=e=>{e.preventDefault();ativarAudio();b.setPointerCapture(e.pointerId);ativarDir('pad'+e.pointerId,b.dataset.dir);};
    b.onpointerup=b.onpointercancel=e=>soltarDir('pad'+e.pointerId);
    b.onclick=e=>{if(e.detail===0){ativarDir('acessivel',b.dataset.dir);soltarDir('acessivel');}};
  }
}
function pausar(){
  if(tela!=='jogo')return;mudar('pausa');
  area.innerHTML=paginaHTML(topo('Pausa')+'<div class="modal-box">'+foto(atual())+'<h2>'+atual().nome+'</h2><p class="body-copy">'+atual().regra+'</p><p class="controls-copy">'+atual().controle+'</p></div><div class="result-actions">'+btn('continuar','Continuar')+btn('sair','Sair ao menu','action secondary')+'</div>');
  pfooter(modo==='circuito'?'Parada '+(selecionado+1)+' de 12':'Jogo avulso','Partida pausada');
}
function finalizar(venceu,mensagem){
  if(tela!=='jogo')return;ultimo={venceu,mensagem};mudar('resultado');partida=null;
  const principal=modo==='circuito'?btn('avancar',selecionado===11?'Concluir a volta':'Próxima parada  ›'):btn('repetir','Jogar de novo');
  const secundaria=modo==='circuito'?btn('repetir','Repetir parada','action secondary'):btn('lista','Escolher jogo','action secondary');
  area.innerHTML=paginaHTML('<div class="modal-box">'+foto(atual())+'<span class="small-title">'+atual().nome+'</span><h2>'+(venceu?'Conseguiu!':'Fim da rodada')+'</h2><p class="body-copy">'+escapar(mensagem)+'</p></div><div class="result-actions">'+principal+secundaria+'</div>');
  pfooter(modo==='circuito'?'Parada '+(selecionado+1)+' de 12':'Jogo avulso',nomesNiveis[nivel-1]);
}
function resumo(){
  mudar('resumo');const total=volta.resultados.filter(Boolean).length;
  area.innerHTML=paginaHTML('<div class="modal-box"><span class="small-title">Volta no Bairro</span><h2>De volta em casa</h2><p class="body-copy">12 paradas visitadas · '+total+' desafios vencidos.</p></div><div class="summary-cards">'+catalogo.map((j,i)=>'<img src="./arte/'+j.id+'.png" class="'+(volta.resultados[i]?'':'miss')+'" title="'+j.nome+' · '+(volta.resultados[i]?'Vitória':'Tentativa')+'" alt="'+j.nome+' · '+(volta.resultados[i]?'Vitória':'Tentativa')+'">').join('')+'</div><div class="actions">'+btn('sair','Voltar ao início')+'</div>');
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
  for(const [k,v] of Object.entries({janela:1,tela:destino,modo,nivel,jogo:selecionado,pag:pagina}))u.searchParams.set(k,v);
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
  if(a==='lista'){galeria();return;}
  if(a==='seguinte'||a==='anterior'){pagina=a==='seguinte'?1:0;galeria();return;}
  if(a==='escolher'){selecionado=Number(el.dataset.index);nivel=1;niveis();return;}
  if(a==='escolher-nivel'){nivel=1;niveis();return;}
  if(a==='nivel'){nivel=Number(el.dataset.index);niveis();area.querySelector('.selected').focus({preventScroll:true});return;}
  if(a==='comecar'){
    if(modo==='avulso'){criarPartida();return;}
    volta={nivel,resultados:[]};manterVolta();parada();return;
  }
  if(a==='retomar'){volta=lerVolta();if(volta)parada();else roteiro();return;}
  if(a==='partir'||a==='repetir'){criarPartida();return;}
  if(a==='pausa'){pausar();return;}
  if(a==='continuar'){mostrarJogo();return;}
  if(a==='avancar'&&ultimo){
    volta.resultados.push(ultimo.venceu);ultimo=null;manterVolta();
    if(volta.resultados.length===12)resumo();else parada();
  }
}
area.addEventListener('click',e=>{const el=e.target.closest('button[data-do]');if(el&&!el.disabled){ativarAudio();acao(el);}});
function botoesMenu(){return [...area.querySelectorAll('button:not([disabled])')];}
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const dir=teclas[e.key]||teclas[e.key.toLowerCase()];
  if(e.key==='Escape'){e.preventDefault();if(!e.repeat)voltar();return;}
  if(tela==='jogo'){
    if(!dir)return;e.preventDefault();ativarAudio();
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
window.addEventListener('blur',()=>{if(tela==='jogo')pausar();});
const inicial=parametros.get('tela');
modo=parametros.get('modo')==='circuito'?'circuito':'avulso';
nivel=Math.max(1,Math.min(3,Number(parametros.get('nivel'))||1));
selecionado=Math.max(0,Math.min(ids.length-1,Number(parametros.get('jogo'))||0));
pagina=parametros.get('pag')==='1'?1:0;
if(inicial==='galeria')galeria();else if(inicial==='roteiro')roteiro();else if(inicial==='nivel')niveis();else inicio();
