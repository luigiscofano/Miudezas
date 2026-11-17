import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';
import {normalizarRecordes,registrarRecorde} from '../dist/recordes.js';
import {normalizarVolta} from '../dist/progresso.js';
import {catalogo, nomesNiveis} from '../dist/catalogo.js';

const fonte=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function navegador(salvo=null, busca='?janela=1&tela=roteiro&modo=circuito') {
  const chamadas=[],frames=new Map(),gravacoes=[];let proximoFrame=0;
  const elementos=new Map();
  const dados={volta:salvo};
  function elemento(id) {
    if(!elementos.has(id))elementos.set(id,{innerHTML:'',textContent:'',classList:{add(){},toggle(){}},setAttribute(){},addEventListener(){},style:{setProperty(){}},focus(){},querySelector:elemento,querySelectorAll(){return [];},getBoundingClientRect(){return {width:384,height:384};},getContext(){return {fillRect(){}};},get parentElement(){return elemento('stage');}});
    return elementos.get(id);
  }
  const fabricas=Object.fromEntries(catalogo.map(j=>[j.id,(nivel,api,opcoes)=>{chamadas.push({id:j.id,nivel,...opcoes});return {press(){},release(){},cancelInput(){},draw(){},hud(){return 'Jogando';},update(){},score(){return 0;}};}]));
  const sandbox={normalizarRecordes,registrarRecorde,normalizarVolta,catalogo,nomesNiveis,quintal:fabricas,esquina:{},varanda:{},pracinha:{},
    icone:()=>'',escapar:s=>s,ler:(k,v)=>dados[k]??v,salvar:(k,v)=>{dados[k]=v;gravacoes.push(k);},
    URLSearchParams,URL, location:{search:busca,href:'https://example.com/?'+busca},
    ResizeObserver:class {observe(){} disconnect(){}},requestAnimationFrame:f=>{frames.set(++proximoFrame,f);return proximoFrame;},
    document:{querySelector:elemento,body:elemento('body'),addEventListener(){}},
    window:{addEventListener(){}},cancelAnimationFrame(id){frames.delete(id);}};
  const contexto=createContext(sandbox);runInContext(fonte,contexto);
  return {executar:s=>runInContext(s,contexto), html:()=>elemento('#screen').innerHTML,dados,chamadas,gravacoes,frames};
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
