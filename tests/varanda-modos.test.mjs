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
test('Gude valida 400 sementes usando controles, colisões e física reais',()=>{
 const layouts=new Set(),origens=new Set(),quadrantes=new Set(),rotas=new Set(),familias=new Set(),orientacoes=new Set(),quantidades=new Set();
 for(let seed=0;seed<400;seed++){
  const terreno=criarTerrenoGude(seed);assert.ok(validarTerrenoGude(terreno));
  assert.deepEqual(criarTerrenoGude(seed),terreno);
  layouts.add(JSON.stringify([terreno.inicio,terreno.alvo,terreno.pedras]));
  origens.add(terreno.inicio.join(','));quadrantes.add(terreno.inicio.map(v=>v<48?0:1).join(','));
  rotas.add(terreno.solucao.map(p=>p.direcao).join(','));familias.add(terreno.familia);
  orientacoes.add(terreno.orientacao);quantidades.add(terreno.pedras.length);
  const a=api(),jogo=varanda.gude(1,a,{mode:'generated',seed});
  for(const passo of terreno.solucao){
   const {x,y}=jogo.snapshot(),distancia=5+68*passo.duracao;
   const [dx,dy]={right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]}[passo.direcao];
   const px=x-dx*distancia/3.6,py=y-dy*distancia/3.6;
   assert.ok(px>=0&&px<=96&&py>=0&&py<=96,'arrasto cabe na área de toque');
   jogo.point(x,y,'down');jogo.point(px,py,'up');
   for(let f=0;f<600&&jogo.moving;f++)jogo.update(1/60);
  }
  assert.equal(a.resultados.length,1);assert.equal(a.resultados[0].ok,true);jogo.draw(quadro);
 }
 assert.ok(layouts.size>390);assert.ok(origens.size>200);assert.equal(quadrantes.size,4);
 assert.equal(rotas.size,16);assert.equal(orientacoes.size,8);
 assert.deepEqual([...familias].sort(),['retorno','travessia']);assert.deepEqual([...quantidades].sort(),[2,3,4]);
});
test('Gude reinício reconstrói mapa; dificuldades clássicas mantêm alvos',()=>{
 for(const level of [1,2,3])assert.deepEqual(varanda.gude(level,api()).snapshot().terreno.alvo,[[77,20],[78,19],[78,18]][level-1]);
 assert.deepEqual(varanda.gude(1,api(),{mode:'generated',seed:77}).snapshot().terreno,varanda.gude(1,api(),{mode:'generated',seed:77}).snapshot().terreno);
});

test('Luz Sem Parar permite recorde longo, limita velocidade e perde no terceiro bote errado',()=>{
 const a=api(),j=varanda.luz(1,a,{mode:'endless'});
 for(let n=0;n<30;n++){
  for(let f=0;f<3000&&Math.abs(j.snapshot().desvio)>.10;f++)j.update(.005);
  j.press();j.update(.45);assert.equal(j.score(),n+1);
 }
 assert.equal(a.resultados.length,0);assert.ok(j.snapshot().velocidade<=3.8);
 for(let n=0;n<3;n++){
  for(let f=0;f<3000&&Math.abs(j.snapshot().desvio)<.3;f++)j.update(.005);
  j.point(30,30,'down');j.update(.45);assert.equal(j.snapshot().erros,n+1);
 }
 assert.equal(a.resultados.length,1);assert.equal(a.resultados[0].ok,false);
 for(let i=0;i<100;i++)j.update(1);assert.equal(a.resultados.length,1);assert.equal(j.score(),30);
});
test('Luz clássica mantém vitória por meta e derrota por prazo',()=>{
 const a=api(),j=varanda.luz(1,a);
 for(let n=0;n<2;n++){while(Math.abs(j.snapshot().desvio)>.1)j.update(.005);j.press();j.update(.45);}
 assert.equal(a.resultados[0].ok,true);
 const b=api(),k=varanda.luz(3,b);k.update(24);assert.equal(b.resultados[0].ok,false);
});
test('Gude arrasto exige início na bola; cancelar não lança, força longa percorre mais',()=>{
 const simular=(distancia)=>{const j=varanda.gude(1,api());j.point(16,80,'down');j.point(16-distancia,80,'move');assert.equal(j.snapshot().jogadas,0);j.point(16-distancia,80,'up');while(j.moving)j.update(1/60);return j.snapshot();};
 assert.ok(simular(10).x>simular(3).x+20);
 const j=varanda.gude(1,api());j.point(80,10,'down');j.point(0,0,'up');assert.equal(j.snapshot().jogadas,0);
 j.point(16,80,'down');j.point(0,80,'cancel');j.point(0,80,'up');assert.equal(j.snapshot().jogadas,0);
 j.point(16,80,'down');j.cancelInput();j.point(0,80,'up');assert.equal(j.snapshot().jogadas,0);
});
test('Certificado rejeita mapa trivial e área inferior às pedras do Puxado',()=>{
 const t=criarTerrenoGude(88);assert.ok(t.pedras.reduce((s,[,,w,h])=>s+w*h,0)>=360);
 assert.equal(validarTerrenoGude({...t,pedras:[]}),false);
 assert.equal(validarTerrenoGude({...t,pedras:[[2,2,15,12],[70,70,15,12]],alvo:[40,80]}),false);
});
