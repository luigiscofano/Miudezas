import {createHash} from 'node:crypto';
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
// Quantiza a ocupação em 6×6 e normaliza as oito simetrias. Jitter e espelhos
// não bastam para passar o teste de variedade estrutural dos obstáculos.
function assinaturaGeometrica(terreno){
 const variantes=[];
 for(let o=0;o<8;o++){
  const grade=Array(36).fill(0);
  for(const [x,y,w,h] of terreno.pedras)for(let px=x;px<x+w;px++)for(let py=y;py<y+h;py++){
   let a=px,b=py;if(o>=4)a=95-a;
   for(let n=0;n<o%4;n++)[a,b]=[95-b,a];
   grade[Math.floor(b/16)*6+Math.floor(a/16)]=1;
  }
  variantes.push(grade.join(''));
 }
 return variantes.sort()[0];
}
test('Gude valida 500 sementes usando controles, colisões e física reais',()=>{
 const normalizados=new Set();let iniciosInternos=0,alvosInternos=0;
 const layouts=new Set(),origens=new Set(),quadrantes=new Set(),rotas=new Set(),familias=new Set(),orientacoes=new Set(),quantidades=new Set();
 for(let seed=0;seed<500;seed++){
  const terreno=criarTerrenoGude(seed);assert.ok(validarTerrenoGude(terreno));
  assert.deepEqual(criarTerrenoGude(seed),terreno);
  layouts.add(JSON.stringify([terreno.inicio,terreno.alvo,terreno.pedras]));
  normalizados.add(assinaturaGeometrica(terreno));
  if(terreno.inicio.every(v=>v>=28&&v<=68))iniciosInternos++;
  if(terreno.alvo.every(v=>v>=28&&v<=68))alvosInternos++;
  if(terreno.familia!=='seguranca')for(let i=0;i<terreno.pedras.length;i++)for(let k=i+1;k<terreno.pedras.length;k++){
   const [x,y,w,h]=terreno.pedras[i],[a,b,c,d]=terreno.pedras[k];
   assert.ok(x+w+5<=a||a+c+5<=x||y+h+5<=b||b+d+5<=y,'pedras separadas, não fragmentos de uma parede');
  }
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
 assert.ok(layouts.size>490);assert.ok(origens.size>350);assert.ok(normalizados.size>300);assert.ok(iniciosInternos>150);assert.ok(alvosInternos>50);assert.equal(quadrantes.size,4);
 assert.equal(rotas.size,24);assert.equal(orientacoes.size,8);
 assert.deepEqual([...familias].sort(),['cotovelo','escalonado-retorno','escalonado-travessia','retorno','travessia']);assert.deepEqual([...quantidades].sort(),[3,4,5,6,7,8]);
});
test('Gude reinício reconstrói mapa; dificuldades autorais têm alvos fixos',()=>{
 for(const level of [1,2,3])assert.deepEqual(varanda.gude(level,api()).snapshot().terreno.alvo,[[22,80],[52,69],[15,45]][level-1]);
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
 const terrenoControle={inicio:[16,80],alvo:[77,20],pedras:[[48,48,10,8]]};
 const simular=(distancia)=>{const j=varanda.gude(1,api(),{terrenoValidado:terrenoControle});j.point(16,80,'down');j.point(16-distancia,80,'move');assert.equal(j.snapshot().jogadas,0);j.point(16-distancia,80,'up');while(j.moving)j.update(1/60);return j.snapshot();};
 assert.ok(simular(10).x>simular(3).x+20);
 const j=varanda.gude(1,api(),{terrenoValidado:terrenoControle});j.point(80,10,'down');j.point(0,0,'up');assert.equal(j.snapshot().jogadas,0);
 j.point(16,80,'down');j.point(0,80,'cancel');j.point(0,80,'up');assert.equal(j.snapshot().jogadas,0);
 j.point(16,80,'down');j.cancelInput();j.point(0,80,'up');assert.equal(j.snapshot().jogadas,0);
});
test('Certificado rejeita mapa trivial e área inferior às pedras do Puxado',()=>{
 const t=criarTerrenoGude(88);assert.ok(t.pedras.reduce((s,[,,w,h])=>s+w*h,0)>=360);
 assert.equal(validarTerrenoGude({...t,pedras:[]}),false);
 assert.equal(validarTerrenoGude({...t,pedras:[[2,2,15,12],[70,70,15,12]],alvo:[40,80]}),false);
});

 test('Sementes fora do novo subconjunto mantêm mapas anteriores byte a byte',()=>{
 const anteriores={1:'ca429dcb4f54cae65d096574174b39154d6ce26801b2879e80655c66a7498699',2:'69e6f847765f1a1d288d0b1d812c1764984f90f4fec0f8bab5a4715947f46573',4:'4cfaaed9b37860c56f9927911cd9722ae30c016eae25fa4c09ed58172284809e',5:'77e2369c9aa78674bbd5369236e533f83b0d4d10c4b22add42fce286280d2f49'};
 for(const [seed,hash]of Object.entries(anteriores))assert.equal(createHash('sha256').update(JSON.stringify(criarTerrenoGude(Number(seed)))).digest('hex'),hash);
 });
 test('Subconjunto escalonado varia geometria e exige calibrar força',()=>{
 const geometrias=new Set(),familias=new Set();let internos=0,novos=0;
 for(let seed=0;seed<300;seed+=3){
 const t=criarTerrenoGude(seed);if(!t.familia.startsWith('escalonado-'))continue;
 novos++;familias.add(t.familia);geometrias.add(assinaturaGeometrica(t));
 if(t.inicio.every(v=>v>=28&&v<=68))internos++;
 assert.equal(t.solucao.length,3);assert.ok(t.pedras.length>=5);assert.ok(t.desafioForca>=4);
 }
 assert.ok(novos>=80);assert.equal(familias.size,2);assert.ok(geometrias.size>=75);assert.ok(internos>=30);
 });

 test('Três fases autorais progressivas são certificadas com teclado e toque',()=>{
 for(let level=1;level<=3;level++){
  const terreno=varanda.gude(level,api()).snapshot().terreno;
  assert.equal(terreno.pedras.length,level+2);
  assert.equal(terreno.solucao.length,level===1?2:3);
  assert.ok(validarTerrenoGude(terreno));
  const a=api(),j=varanda.gude(level,a);
  for(const passo of terreno.solucao){j.press(passo.direcao);j.update(passo.duracao);j.release(passo.direcao);while(j.moving)j.update(1/60);}
  assert.equal(a.resultados.length,1);assert.equal(a.resultados[0].ok,true);
 }
 });
