import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';
import {catalogo, nomesNiveis} from '../dist/catalogo.js';

const fonte=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function navegador(salvo=null) {
  const elementos=new Map();
  const dados={volta:salvo};
  function elemento(id) {
    if(!elementos.has(id))elementos.set(id,{innerHTML:'',textContent:'',classList:{add(){}},setAttribute(){},addEventListener(){},querySelector(){return null;}});
    return elementos.get(id);
  }
  const sandbox={catalogo,nomesNiveis,quintal:{},esquina:{},varanda:{},pracinha:{},
    icone:()=>'',escapar:s=>s,ler:(k,v)=>dados[k]??v,salvar:(k,v)=>{dados[k]=v;},
    URLSearchParams, location:{search:'?janela=1&tela=roteiro&modo=circuito'},
    document:{querySelector:elemento,body:elemento('body'),addEventListener(){}},
    window:{addEventListener(){}},cancelAnimationFrame(){}};
  const contexto=createContext(sandbox);runInContext(fonte,contexto);
  return {executar:s=>runInContext(s,contexto), html:()=>elemento('#screen').innerHTML,dados};
}

test('A galeria percorre três páginas e conserva a terceira ao escolher um jogo',()=>{
  const n=navegador();n.executar("galeria();acao({dataset:{do:'seguinte'}});acao({dataset:{do:'seguinte'}})");
  for(const nome of ['Peteca','Gato na Sombra','Pescaria de Lata','Pião'])assert.ok(n.html().includes(nome));
  assert.match(n.html(),/3 \/ 3/);
  n.executar("acao({dataset:{do:'escolher',index:'14'}})");
  assert.match(n.html(),/Pesque 3 peixinhos/);
  n.executar('voltar()');assert.match(n.html(),/3 \/ 3/);
  n.executar("acao({dataset:{do:'anterior'}})");assert.match(n.html(),/2 \/ 3/);
});

test('Retomada antiga mantém a 12ª parada e segue para Peteca',()=>{
  const n=navegador({nivel:2,resultados:Array(11).fill(true)});
  n.executar("acao({dataset:{do:'retomar'}})");
  assert.match(n.html(),/Pisca no Mato/);assert.match(n.html(),/12 \/ 16/);
  n.executar("ultimo={venceu:true};acao({dataset:{do:'avancar'}})");
  assert.match(n.html(),/Peteca/);assert.match(n.html(),/13 \/ 16/);
  assert.equal(n.dados.volta.resultados.length,12);
});

test('As novas paradas completam a volta e limpam apenas seu progresso',()=>{
  const n=navegador({nivel:1,resultados:Array(12).fill(true)});
  n.executar("acao({dataset:{do:'retomar'}})");
  for (const nome of ['Gato na Sombra','Pescaria de Lata','Pião']) {
    n.executar("ultimo={venceu:true};acao({dataset:{do:'avancar'}})");
    assert.ok(n.html().includes(nome));
  }
  n.executar("ultimo={venceu:false};acao({dataset:{do:'avancar'}})");
  assert.match(n.html(),/16 paradas visitadas · 15 desafios vencidos/);
  assert.equal((n.html().match(/<img /g)||[]).length,16);
  assert.equal(n.dados.volta,null);
});

test('Progresso inválido não oferece retomada',()=>{
  for(const dados of [{nivel:4,resultados:[]},{nivel:1,resultados:['sim']},{nivel:1,resultados:Array(16).fill(true)}]) {
    const n=navegador(dados);assert.ok(!n.html().includes('Retomar ·'));
  }
});
