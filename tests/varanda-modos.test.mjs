import test from 'node:test';
import assert from 'node:assert/strict';
import {varanda,criarTerrenoGude,validarTerrenoGude} from '../dist/varanda.js';
const api=()=>({resultados:[],tone(){},finish(ok,msg){this.resultados.push({ok,msg});}});
const quadro={fillStyle:'',fillRect(){}};
function aguardarResposta(jogo){for(let i=0;i<100000&&jogo.snapshot().estado!=='resposta';i++)jogo.update(.05);assert.equal(jogo.snapshot().estado,'resposta');}
test('Pisca Sem Parar segue além das metas e registra somente sequência completa',()=>{
 const a=api(),jogo=varanda.pisca(3,a,{mode:'endless',seed:123});
 for(let rodada=1;rodada<=12;rodada++){
  aguardarResposta(jogo);for(const dir of jogo.snapshot().sequencia)jogo.press(dir);
  assert.equal(jogo.score(),rodada);assert.equal(a.resultados.length,0);jogo.draw(quadro);
 }
 aguardarResposta(jogo);jogo.press(jogo.snapshot().sequencia[0]==='left'?'right':'left');
 for(let i=0;i<20;i++)jogo.update(.1);
 assert.equal(jogo.score(),12);assert.equal(a.resultados.length,1);assert.equal(a.resultados[0].ok,false);
});
test('Pisca clássico preserva as três metas autorais',()=>{
 for(const level of [1,2,3]){const a=api(),jogo=varanda.pisca(level,a);
 for(let r=0;r<level+2;r++){aguardarResposta(jogo);for(const dir of jogo.snapshot().sequencia)jogo.press(dir);}
 jogo.update(1);assert.equal(a.resultados[0].ok,true);}
});
test('Gude valida 200 sementes usando controles, colisões e física reais',()=>{
 const layouts=new Set();
 for(let seed=0;seed<200;seed++){
  const terreno=criarTerrenoGude(seed);assert.ok(validarTerrenoGude(terreno));
  assert.deepEqual(criarTerrenoGude(seed),terreno);
  layouts.add(JSON.stringify([terreno.alvo,terreno.pedras]));
  const a=api(),jogo=varanda.gude(1,a,{mode:'generated',seed});
  for(const passo of terreno.solucao){
   const {x,y}=jogo.snapshot(),distancia=5+68*passo.duracao;
   const [dx,dy]=passo.direcao==='right'?[1,0]:[0,-1];
   const px=x-dx*distancia/3.6,py=y-dy*distancia/3.6;
   assert.ok(px>=0&&px<=96&&py>=0&&py<=96,'arrasto cabe na área de toque');
   jogo.point(x,y,'down');jogo.point(px,py,'up');
   for(let f=0;f<600&&jogo.moving;f++)jogo.update(1/60);
  }
  assert.equal(a.resultados.length,1);assert.equal(a.resultados[0].ok,true);jogo.draw(quadro);
 }
 assert.ok(layouts.size>190);
});
test('Gude reinício reconstrói mapa; dificuldades clássicas mantêm alvos',()=>{
 for(const level of [1,2,3])assert.deepEqual(varanda.gude(level,api()).snapshot().terreno.alvo,[[77,20],[78,19],[78,18]][level-1]);
 assert.deepEqual(varanda.gude(1,api(),{mode:'generated',seed:77}).snapshot().terreno,varanda.gude(1,api(),{mode:'generated',seed:77}).snapshot().terreno);
});
