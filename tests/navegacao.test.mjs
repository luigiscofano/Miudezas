import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';
import {normalizarVolta} from '../dist/progresso.js';
import {catalogo, nomesNiveis} from '../dist/catalogo.js';

const fonte=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function navegador(salvo=null) {
  const elementos=new Map();
  const dados={volta:salvo};
  function elemento(id) {
    if(!elementos.has(id))elementos.set(id,{innerHTML:'',textContent:'',classList:{add(){}},setAttribute(){},addEventListener(){},querySelector(){return null;}});
    return elementos.get(id);
  }
  const sandbox={normalizarVolta,catalogo,nomesNiveis,quintal:{},esquina:{},varanda:{},pracinha:{},
    icone:()=>'',escapar:s=>s,ler:(k,v)=>dados[k]??v,salvar:(k,v)=>{dados[k]=v;},
    URLSearchParams, location:{search:'?janela=1&tela=roteiro&modo=circuito'},
    document:{querySelector:elemento,body:elemento('body'),addEventListener(){}},
    window:{addEventListener(){}},cancelAnimationFrame(){}};
  const contexto=createContext(sandbox);runInContext(fonte,contexto);
  return {executar:s=>runInContext(s,contexto), html:()=>elemento('#screen').innerHTML,dados};
}


test('Galeria tem duas páginas e apenas os doze jogos mantidos',()=>{
 const n=navegador();n.executar("galeria();acao({dataset:{do:'seguinte'}})");
 assert.match(n.html(),/2 \/ 2/);
 assert.match(n.html(),/Peteca/);assert.match(n.html(),/Gato na Sombra/);
 for(const nome of ['Pião','Balsa de Cabo','Pescaria de Lata','Dois Pratos'])assert.ok(!n.html().includes(nome));
 n.executar("acao({dataset:{do:'escolher',index:'10'}})");
 assert.match(n.html(),/Rebata/);
 n.executar('voltar()');assert.match(n.html(),/2 \/ 2/);
});
test('Retomada legada preserva resultados por ID e salta retirados',()=>{
 const n=navegador({nivel:2,resultados:[true,false,true,false,true,false,true]});
 n.executar("acao({dataset:{do:'retomar'}})");
 assert.match(n.html(),/Rastro de Prata/);assert.match(n.html(),/7 \/ 12/);
 assert.deepEqual(JSON.parse(n.executar('JSON.stringify(volta.resultados)')),[true,false,true,false,true,false]);
 n.executar("ultimo={venceu:true};acao({dataset:{do:'avancar'}})");
 assert.match(n.html(),/Luz de Varanda/);
 assert.equal(n.dados.volta.ids.length,12);
});
test('Conclusão encerra após o gato e não oferece paradas retiradas',()=>{
 const n=navegador({nivel:1,resultados:Array(13).fill(true)});
 n.executar("acao({dataset:{do:'retomar'}})");
 assert.match(n.html(),/Gato na Sombra/);
 n.executar("ultimo={venceu:false};acao({dataset:{do:'avancar'}})");
 assert.match(n.html(),/12 paradas visitadas · 11 desafios vencidos/);
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
