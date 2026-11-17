import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esquina} from '../dist/esquina.js';

function criar(nivel) {
  const resultados=[];
  const jogo=esquina.pao(nivel,{finish(...r){resultados.push(r);},tone(){}});
  return {jogo,resultados};
}
function conferirIdentidades(jogo) {
  assert.deepEqual(jogo.snapshot().alimentos.map(a=>a.tipo).sort(),['ovo','pao']);
  const pixels=[];
  jogo.draw({fillStyle:'',fillRect(x,y,w,h){pixels.push({cor:this.fillStyle,x,y,w,h});}});
  assert.equal(pixels.filter(p=>p.cor==='#ffe19a').length,1,'uma gema em todo estado');
  assert.equal(pixels.filter(p=>p.w===14&&p.h===17).length,1,'um miolo de pão');
}
for(const nivel of [1,2,3]) {
  for(const dt of [1/30,1/60,1/120]) test(`Vitória, identidades e alternância: nível ${nivel}, passo ${dt}`,()=>{
    const {jogo,resultados}=criar(nivel), lados=new Set();
    for(let t=0;t<65&&!resultados.length;t+=dt){
      jogo.update(dt);conferirIdentidades(jogo);
      const s=jogo.snapshot();lados.add(s.alimentos[0].tipo);
      if(s.troca)continue;
      for(let i=0;i<2;i++){
        const atual=jogo.snapshot();if(atual.troca||atual.fim)break;
        const a=atual.alimentos[i];
        if(a.estado===1){jogo.selectTool(a.tipo==='ovo'?'espatula':'pinca');jogo.point(i===0?28:64,40,'down');}
      }
    }
    assert.equal(resultados.length,1);assert.equal(resultados[0][0],true);
    assert.equal(jogo.snapshot().erros,0);assert.equal(lados.size,2);
    jogo.update(100);jogo.press('left');assert.equal(resultados.length,1);
  });
  test(`Queima única por alimento e derrota no terceiro erro, nível ${nivel}`,()=>{
    const {jogo,resultados}=criar(nivel);
    while(jogo.snapshot().erros===0)jogo.update(.01);
    assert.equal(jogo.snapshot().erros,1);
    jogo.update(.1);assert.equal(jogo.snapshot().erros,1);
    conferirIdentidades(jogo);jogo.update(100);
    assert.equal(jogo.snapshot().erros,3);assert.equal(resultados.length,1);assert.equal(resultados[0][0],false);
  });
  test(`Utensílio errado, fim bloqueia entradas e nova fase limpa, nível ${nivel}`,()=>{
    const {jogo,resultados}=criar(nivel);
    for(let k=0;k<3;k++){
      const s=jogo.snapshot(),a=s.alimentos[0];
      jogo.selectTool(a.tipo==='ovo'?'pinca':'espatula');jogo.press('left');jogo.update(.8);
    }
    assert.equal(jogo.snapshot().erros,3);assert.equal(resultados.length,1);
    jogo.update(90);jogo.press('right');jogo.point(20,40,'down');assert.equal(resultados.length,1);
    const novo=criar(nivel).jogo.snapshot();assert.equal(novo.erros,0);assert.equal(novo.servidos,0);
  });
}
test('Seleção por toque, alimento cru sem punição e entrada fora da chapa ignorada',()=>{
  const {jogo}=criar(1);jogo.point(65,85,'down');assert.equal(jogo.snapshot().utensilio,'pinca');
  jogo.point(65,40,'down');assert.equal(jogo.snapshot().erros,0);assert.equal(jogo.snapshot().servidos,0);
  jogo.point(20,85,'down');assert.equal(jogo.snapshot().utensilio,'espatula');
  jogo.point(1,40,'down');jogo.point(25,40,'move');assert.equal(jogo.snapshot().erros,0);
});
test('Preparo e janela antes da queima diminuem progressivamente',()=>{
  const tempos=[1,2,3].map(n=>{
    const {jogo}=criar(n);let t=0,ponto;
    while(jogo.snapshot().erros===0){jogo.update(.01);t+=.01;if(ponto===undefined&&jogo.snapshot().alimentos[1].estado===1)ponto=t;}
    return {ponto,janela:t-ponto};
  });
  assert.ok(tempos[0].ponto>tempos[1].ponto&&tempos[1].ponto>tempos[2].ponto);
  assert.ok(tempos[0].janela>tempos[1].janela&&tempos[1].janela>tempos[2].janela);
  assert.ok(tempos[2].janela>1.9);
});
test('Tostado continua válido e a troca não cozinha nem aceita coleta',()=>{
  const {jogo}=criar(1);
  while(jogo.snapshot().alimentos[1].estado!==2)jogo.update(.01);
  jogo.selectTool('pinca');jogo.press('right');assert.equal(jogo.snapshot().servidos,1);
  jogo.selectTool('espatula');jogo.press('left');assert.equal(jogo.snapshot().servidos,2);
  const antes=jogo.snapshot();assert.equal(antes.troca,true);
  jogo.press('left');jogo.update(.5);assert.deepEqual(jogo.snapshot(),antes);
});
