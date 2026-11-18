import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';
import {normalizarRecordes,registrarRecorde} from '../dist/recordes.js';
import {normalizarVolta} from '../dist/progresso.js';
import {varanda as jogosVaranda} from '../dist/varanda.js';
import {catalogo, nomesNiveis} from '../dist/catalogo.js';

const fonte=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function navegador(salvo=null, busca='?janela=1&tela=roteiro&modo=circuito', reais={}) {
  const eventos={},chamadas=[],frames=new Map(),gravacoes=[];let proximoFrame=0;
  const elementos=new Map();
  const dados={volta:salvo};
  function elemento(id) {
    if(!elementos.has(id))elementos.set(id,{innerHTML:'',textContent:'',classList:{add(){},toggle(){}},setAttribute(){},addEventListener(){},style:{setProperty(){}},focus(){},querySelector:elemento,querySelectorAll(){return [];},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:384,height:384};},getContext(){return new Proxy({}, {get:(o,k)=>o[k]??(()=>{})});},get parentElement(){return elemento('stage');}});
    return elementos.get(id);
  }
  const fabricas=Object.fromEntries(catalogo.map(j=>[j.id,(nivel,api,opcoes)=>{chamadas.push({id:j.id,nivel,...opcoes});return {press(){},release(){},cancelInput(){},draw(){},hud(){return 'Jogando';},snapshot(){return {alimentos:[]};},update(){},score(){return 0;}};}]));
  const sandbox={normalizarRecordes,registrarRecorde,normalizarVolta,catalogo,nomesNiveis,quintal:{...fabricas,...reais},esquina:{},varanda:{},pracinha:{},
    icone:()=>'',escapar:s=>s,ler:(k,v)=>dados[k]??v,salvar:(k,v)=>{dados[k]=v;gravacoes.push(k);},
    URLSearchParams,URL, location:{search:busca,href:'https://example.com/?'+busca},
    ResizeObserver:class {observe(){} disconnect(){}},requestAnimationFrame:f=>{frames.set(++proximoFrame,f);return proximoFrame;},
    document:{querySelector:elemento,body:elemento('body'),hidden:false,hasFocus:()=>true,addEventListener(n,f){eventos[n]=f;}},
    window:{addEventListener(n,f){eventos[n]=f;},removeEventListener(n,f){if(eventos[n]===f)delete eventos[n];}},cancelAnimationFrame(id){frames.delete(id);}};
  const contexto=createContext(sandbox);runInContext(fonte,contexto);
  return {executar:s=>runInContext(s,contexto), html:()=>elemento('#screen').innerHTML,dados,chamadas,gravacoes,frames,eventos,elemento};
}


test('Galeria tem duas páginas e apenas os dez jogos mantidos',()=>{
 const n=navegador();n.executar("galeria();acao({dataset:{do:'seguinte'}})");
 assert.match(n.html(),/2 \/ 2/);
 assert.ok(!n.html().includes('Peteca'));assert.ok(!n.html().includes('Gato na Sombra'));
 for(const nome of ['Pião','Balsa de Cabo','Pescaria de Lata','Dois Pratos'])assert.ok(!n.html().includes(nome));
 n.executar("acao({dataset:{do:'escolher',index:'9'}})");
 assert.match(n.html(),/vaga-lumes/);
 n.executar('voltar()');assert.match(n.html(),/2 \/ 2/);
});
test('Retomada legada preserva resultados por ID e salta retirados',()=>{
 const n=navegador({nivel:2,resultados:[true,false,true,false,true,false,true]});
 n.executar("acao({dataset:{do:'retomar'}})");
 assert.match(n.html(),/Rastro de Prata/);assert.match(n.html(),/7 \/ 10/);
 assert.deepEqual(JSON.parse(n.executar('JSON.stringify(volta.resultados)')),[true,false,true,false,true,false]);
 n.executar("ultimo={venceu:true};acao({dataset:{do:'avancar'}})");
 assert.match(n.html(),/Luz de Varanda/);
 assert.equal(n.dados.volta.ids.length,10);
});
test('Conclusão encerra no Pisca e não oferece paradas retiradas',()=>{
 const n=navegador({nivel:1,ids:catalogo.map(j=>j.id),resultados:Array(9).fill(true)});
 n.executar("acao({dataset:{do:'retomar'}})");
 assert.match(n.html(),/Pisca no Mato/);
 n.executar("ultimo={venceu:false};acao({dataset:{do:'avancar'}})");
 assert.match(n.html(),/10 paradas visitadas · 9 desafios vencidos/);
 assert.equal(n.dados.volta,null);
});
test('Volta atual não é migrada duas vezes',()=>{
 const ids=catalogo.map(j=>j.id);
 const n=navegador({nivel:3,ids,resultados:Array(7).fill(false)});
 n.executar("acao({dataset:{do:'retomar'}})");
 assert.match(n.html(),/Luz de Varanda/);
});
test('Dados inválidos ou percurso já concluído não oferecem retomada',()=>{
 for(const salvo of [{nivel:4,resultados:[]},{nivel:1,resultados:['sim']},{nivel:1,resultados:Array(14).fill(true)}]){
  assert.ok(!navegador(salvo).html().includes('Retomar ·'));
 }
});

test('Marca e capa não impedem a entrada no menu avulso',()=>{
  const n=navegador();
  n.executar('inicio()');
  assert.match(n.html(),/artes\/capas\/miudezas-tijuca.png/);
  n.executar("acao({dataset:{do:'avulso'}})");
  assert.match(n.html(),/1 \/ 2/);
});

test('Caminho Novo mantém seed no retry, pausa e quadros não recriam gerador',()=>{
 const n=navegador(null,'?janela=1&tela=galeria');const indice=catalogo.findIndex(j=>j.id==='gude');
 n.executar(`acao({dataset:{do:'escolher',index:'${indice}'}});acao({dataset:{do:'modo-extra'}});semente=123;acao({dataset:{do:'comecar'}})`);
 assert.equal(n.chamadas.length,1);assert.equal(n.chamadas[0].seed,123);assert.equal(n.chamadas[0].mode,'generated');
 for(let t=1;t<=20;t++){const [id,frame]=n.frames.entries().next().value;n.frames.delete(id);frame(t*16);}
 assert.equal(n.chamadas.length,1);
 n.executar("pausar();acao({dataset:{do:'continuar'}})");assert.equal(n.chamadas.length,1);
 n.executar("finalizar(false,'Tentativa');acao({dataset:{do:'repetir'}})");
 assert.equal(n.chamadas.length,2);assert.equal(n.chamadas[1].seed,123);
 n.executar("finalizar(true,'Conseguiu')");assert.match(n.html(),/Gerar outra fase/);
 n.executar("Math.random=()=>.5;acao({dataset:{do:'outra-fase'}})");assert.equal(n.chamadas[2].seed,2147483648);
});
test('Sem Parar mostra resultado e só persiste recorde maior',()=>{
 const n=navegador(null,'?janela=1&tela=galeria');const indice=catalogo.findIndex(j=>j.id==='pisca');
 n.executar(`acao({dataset:{do:'escolher',index:'${indice}'}});acao({dataset:{do:'modo-extra'}});acao({dataset:{do:'comecar'}});partida.score=()=>7;finalizar(false,'Errou.')`);
 assert.match(n.html(),/Pontuação: 7. Recorde pessoal: 7/);assert.equal(n.dados.recordes.pisca,7);
 const antes=n.gravacoes.filter(k=>k==='recordes').length;
 n.executar("acao({dataset:{do:'repetir'}});partida.score=()=>7;finalizar(false,'Errou.')");
 assert.equal(n.gravacoes.filter(k=>k==='recordes').length,antes);
});
test('URL da janela conserva modo e seed, e rejeita modo incompatível',()=>{
 const indice=catalogo.findIndex(j=>j.id==='gude');
 const n=navegador(null,`?janela=1&tela=nivel&jogo=${indice}&tipo=generated&semente=987`);
 assert.equal(n.executar('tipoPartida'),'generated');assert.equal(n.executar('semente'),987);
 n.executar("window.open=url=>{window.ultimaURL=url;return {focus(){}};};abrirJanela('nivel')");
 const u=new URL(n.executar('window.ultimaURL'));assert.equal(u.searchParams.get('tipo'),'generated');assert.equal(u.searchParams.get('semente'),'987');
 const circuito=navegador(null,`?janela=1&tela=nivel&modo=circuito&jogo=${indice}&tipo=generated&semente=987`);
 assert.equal(circuito.executar('tipoPartida'),'classic');assert.ok(!circuito.html().includes('Caminho Novo'));
 const incorreto=navegador(null,`?janela=1&tela=nivel&jogo=${indice}&tipo=endless`);
 assert.equal(incorreto.executar('tipoPartida'),'classic');
});


test('Voltar às fases encerra tentativa e mantém seleção, recordes e volta salva',()=>{
 const salvo={nivel:2,ids:catalogo.map(j=>j.id),resultados:[true,false]};
 const n=navegador(salvo,'?janela=1&tela=galeria');
 n.executar("selecionado=8;nivel=3;modo='avulso';tipoPartida='generated';semente=789;criarPartida();pausar()");
 assert.match(n.html(),/Voltar às fases/);assert.match(n.html(),/Voltar ao menu/);
 n.executar("acao({dataset:{do:'voltar-fases'}})");
 assert.equal(n.executar('tela'),'nivel');assert.equal(n.executar('partida'),null);
 assert.equal(n.executar('nivel'),3);assert.equal(n.executar('semente'),789);
 assert.equal(n.executar('tipoPartida'),'generated');assert.deepEqual(n.dados.volta,salvo);assert.equal(n.frames.size,0);
});
test('Arrastar não pausa; cancelar captura não solta; blur real e aba oculta pausam',()=>{
 const n=navegador(null,'?janela=1&tela=galeria');
 n.executar("selecionado=8;modo='avulso';criarPartida();window.fases=[];partida.point=(x,y,f)=>window.fases.push(f)");
 const c=n.elemento('canvas');const e={pointerId:1,button:0,clientX:100,clientY:100,preventDefault(){}};
 c.onpointerdown(e);c.onpointermove({...e,clientX:170});
 n.eventos.blur();assert.equal(n.executar('tela'),'jogo');
 c.onlostpointercapture(e);assert.deepEqual(JSON.parse(n.executar('JSON.stringify(window.fases)')),['down','move','cancel']);
 c.onpointerdown(e);c.onpointerup(e);assert.equal(n.executar('tela'),'jogo');
 assert.equal(n.executar('window.fases.at(-1)'),'up');
 n.executar('document.hasFocus=()=>false');n.eventos.blur();assert.equal(n.executar('tela'),'pausa');
 assert.equal(c.onpointerdown,null);
 n.executar("acao({dataset:{do:'continuar'}});document.hidden=true");n.eventos.visibilitychange();assert.equal(n.executar('tela'),'pausa');
});
test('Lagartixa oferece Sem Parar com recorde independente',()=>{
 const n=navegador(null,'?janela=1&tela=galeria');
 n.executar("acao({dataset:{do:'escolher',index:'7'}})");assert.match(n.html(),/Sem Parar/);
 n.executar("acao({dataset:{do:'modo-extra'}});acao({dataset:{do:'comecar'}});partida.score=()=>4;finalizar(false,'Errou')");
 assert.equal(n.dados.recordes.luz,4);
});


test('Gude real integrado ao canvas: puxar não pausa e cancelamento não lança',()=>{
 const n=navegador(null,'?janela=1&tela=galeria',jogosVaranda);
 n.executar("selecionado=8;modo='avulso';criarPartida()");
 const inicio=n.executar('partida.snapshot()');
 const c=n.elemento('canvas'),e={pointerId:8,button:0,clientX:inicio.x*4,clientY:inicio.y*4,preventDefault(){}};
 c.onpointerdown(e);c.onpointermove({...e,clientX:e.clientX-36});n.eventos.blur();
 assert.equal(n.executar('tela'),'jogo');assert.equal(n.executar('partida.snapshot().jogadas'),0);
 c.onpointercancel(e);c.onpointerup({...e,clientX:e.clientX-36});
 assert.equal(n.executar('partida.snapshot().jogadas'),0);
 c.onpointerdown(e);c.onpointermove({...e,clientX:e.clientX-36});c.onpointerup({...e,clientX:e.clientX-36});
 assert.equal(n.executar('partida.snapshot().jogadas'),1);assert.equal(n.executar('partida.moving'),true);
 assert.equal(n.executar('tela'),'jogo');
});


test('Cancelar direções solta movimentos contínuos sem disparar petelecos',()=>{
 const n=navegador(null,'?janela=1&tela=galeria');
 n.executar("window.soltas=[];partida={release:d=>window.soltas.push(d)};segurando.set('pad1','left');cancelarDirecoes()");
 assert.equal(n.executar("window.soltas.join(',')"),'left');assert.equal(n.executar('segurando.size'),0);
 n.executar("window.cancelados=0;partida.cancelInput=()=>window.cancelados++;segurando.set('pad2','right');cancelarDirecoes()");
 assert.equal(n.executar('window.cancelados'),1);assert.equal(n.executar("window.soltas.join(',')"),'left');
});


test('Ícones aprovados aparecem na seleção e preservam miniaturas de outras telas',()=>{
 const n=navegador();n.executar('galeria()');
 for(const id of ['radio','mare','fio','goteira','pipa','pao'])assert.ok(n.html().includes('arte/icones/'+id+'.svg'));
 n.executar("acao({dataset:{do:'seguinte'}})");
 for(const id of ['gude','pisca','luz'])assert.ok(n.html().includes('arte/icones/'+id+'.svg'));
 assert.ok(n.html().includes('arte/icones/rastro.svg'));
 for(const id of ['radio','gude','pisca','luz','mare','fio','rastro']){
  const cena=n.executar(`foto(catalogo.find(j=>j.id==='${id}'))`);
  assert.ok(cena.includes('arte/'+id+'.png'));
 }
});


test('Pausa usa a mesma arte da seleção em todos os jogos e mantém três ações',()=>{
 for(let i=0;i<catalogo.length;i++){
  const n=navegador(null,'?janela=1&tela=galeria');n.executar(`selecionado=${i};tela='jogo';pausar()`);
  const j=catalogo[i],arte=j.icone||j.imagem||j.id+'.png';
  assert.ok(n.html().includes('./arte/'+arte));
  assert.match(n.html(),/class="pause-art"/);
  assert.match(n.html(),/class="result-actions pause-actions"/);
  for(const acao of ['continuar','voltar-fases','sair'])assert.ok(n.html().includes('data-do="'+acao+'"'));
 }
});


test('Enquadramento desktop elimina faixas e é restaurado ao pausar',()=>{
 const n=navegador(null,'?janela=1&tela=galeria');
 n.executar("window.innerWidth=800;window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}})");
 const moldura=n.elemento('.window');moldura.offsetWidth=492;moldura.clientWidth=486;
 const stage=n.elemento('stage');
 stage.getBoundingClientRect=()=>({width:parseFloat(moldura.style.width||'492')-6,height:325});
 n.executar('criarPartida()');
 assert.equal(moldura.style.width,'331px');
 assert.equal(n.elemento('canvas').style.width,'325px');
 assert.equal(n.elemento('canvas').style.height,'325px');
 assert.ok(n.eventos.resize);
 n.executar('pausar()');assert.equal(moldura.style.width,'');assert.equal(n.eventos.resize,undefined);
 n.executar("acao({dataset:{do:'continuar'}})");assert.equal(moldura.style.width,'331px');
});

test('Enquadramento adapta dez jogos e janelas desktop, sem mudar toque',()=>{
 for(const larguraTela of [492,800,1366,1920])for(let indice=0;indice<10;indice++){
  const n=navegador(null,'?janela=1&tela=galeria');
  n.executar(`window.innerWidth=${larguraTela};window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}})`);
  const moldura=n.elemento('.window');moldura.offsetWidth=492;moldura.clientWidth=486;
  const altura=indice===0?260:325;
  n.elemento('stage').getBoundingClientRect=()=>({width:parseFloat(moldura.style.width||'492')-6,height:altura});
  n.executar(`selecionado=${indice};criarPartida()`);
  assert.equal(parseFloat(moldura.style.width),altura+6);
  assert.equal(n.elemento('canvas').style.width,n.elemento('canvas').style.height);
  n.executar('voltarAsFases()');
  assert.equal(moldura.style.width,'');
 }
 const n=navegador(null,'?janela=1&tela=galeria');
 n.executar("window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});criarPartida()");
 assert.equal(n.elemento('.window').style.width,'');
 assert.equal(n.elemento('canvas').style.width,'384px');
});
