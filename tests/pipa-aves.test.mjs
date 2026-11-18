import {test} from 'node:test';
import assert from 'node:assert/strict';
import {criarBandoPipa, colideBandoPipa, spriteAvePipa} from '../dist/pipa-aves.js';
import {quintal} from '../dist/quintal.js';

test('V aprovado cresce por pares, com ponta inferior e simetria', () => {
  assert.deepEqual(criarBandoPipa(null), []);
  for (const [ponta, tamanho] of [[6,3], [18,7], [30,9]]) {
    const aves = criarBandoPipa(ponta);
    assert.equal(aves.length, tamanho);
    assert.deepEqual(aves[0], {x:-3,y:ponta});
    for (let i=1;i<aves.length;i+=2) {
      assert.equal(aves[i].x+aves[i+1].x,-6);
      assert.equal(aves[i].y,aves[i+1].y);
      assert.ok(aves[i].y<ponta);
      assert.ok(aves[i].y>=0);
    }
  }
});

test('Colisões usam só pixels das aves: centro vazio do V permanece atravessável', () => {
  const aves=criarBandoPipa(30);
  assert.equal(colideBandoPipa(aves,48,48,12),false);
  assert.equal(colideBandoPipa(aves,48,48,32),true);
  assert.equal(colideBandoPipa(aves,48,20,6),true);
  assert.equal(colideBandoPipa(aves,48,76,6),true);
  // Compara todos os centros possíveis do losango a uma referência de pixels desenhados.
  const solidos=aves.flatMap(ave=>spriteAvePipa.flatMap((linha,y)=>[...linha].flatMap((p,x)=>p==='.'?[]:[{x:48+ave.x+x,y:ave.y+y}])));
  for(let x=0;x<96;x++)for(let y=0;y<50;y++) {
    const esperado=solidos.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<=4);
    assert.equal(colideBandoPipa(aves,48,x,y),esperado,`${x},${y}`);
  }
});

test('Sem Parar: dez minutos por dificuldade, recorde continua e lista fica limitada', () => {
  for(const nivel of [1,2,3]) {
    const resultados=[];
    const jogo=quintal.pipa(nivel,{tone(){},finish(...args){resultados.push(args);}},{mode:'endless'});
    for(let i=0;i<60*600&&!resultados.length;i++) {
      const {y}=jogo.snapshot();jogo.release('up');jogo.release('down');
      if(y>22.5)jogo.press('up');else if(y<21.5)jogo.press('down');
      jogo.update(1/60);
      assert.ok(jogo.snapshot().obstacles<=7);
    }
    assert.deepEqual(resultados,[]);assert.ok(jogo.score()>150);
  }
});
