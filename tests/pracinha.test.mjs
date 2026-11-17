import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pracinha} from '../dist/pracinha.js';
import {catalogo} from '../dist/catalogo.js';
import {existsSync} from 'node:fs';

// O teste observa somente o contrato público: comandos, cena, indicador e resultado.
function rodada(id, nivel) {
  const resultados = [];
  const jogo = pracinha[id](nivel, {tone() {}, finish(...r) { resultados.push(r); }});
  const desenhar = () => {
    const pixels = [];
    jogo.draw({fillStyle:'', fillRect(x,y,w,h) { pixels.push({cor:this.fillStyle,x,y,w,h}); }});
    return pixels;
  };
  return {jogo, resultados, desenhar};
}
function meio(pixels, cor) {
  const pontos = pixels.filter(p => p.cor === cor);
  return (Math.min(...pontos.map(p=>p.x)) + Math.max(...pontos.map(p=>p.x+p.w))) / 2;
}
function corrigir(jogo, distancia) {
  jogo.release('left'); jogo.release('right');
  if (Math.abs(distancia) > 0.6) jogo.press(distancia < 0 ? 'left' : 'right');
}

test('Os 12 jogos têm IDs únicos, três níveis e miniatura disponível', () => {
  assert.equal(catalogo.length, 12);
  assert.equal(new Set(catalogo.map(j=>j.id)).size, 12);
  for (const j of catalogo) {
    assert.equal(j.niveis.length, 3);
    assert.ok(existsSync(new URL('../dist/arte/' + (j.imagem || j.id+'.png'), import.meta.url)));
  }
});

for (const nivel of [1,2,3]) {
  for (const dt of [1/60, 1/30, 0.08]) {
    test(`Metas alcançáveis no nível ${nivel}, passo ${dt}`, () => {
      for (const id of Object.keys(pracinha)) {
        const r = rodada(id, nivel);
        let yAnterior = 0;
        for (let t=0; t<180 && !r.resultados.length; t+=dt) {
          const pixels = r.desenhar();
          if (id === 'peteca') {
            const y = Math.max(...pixels.filter(p=>p.cor==='#a52f32').map(p=>p.y));
            if (y >= 73 && y > yAnterior) r.jogo.press('up');
            r.jogo.release('up'); yAnterior = y;
          } else if (id === 'sombra') {
            const faixa = pixels.find(p=>p.cor==='#6b587e' && p.h===96);
            corrigir(r.jogo, faixa.x+faixa.w/2-meio(pixels,'#efa32e'));

          } else {
            // A tentativa é livre e o ímã retorna sozinho, mesmo após erro.
            r.jogo.press('down'); r.jogo.release('down');
          }
          r.jogo.update(dt);
        }
        assert.equal(r.resultados.length, 1, id + ': deve concluir');
        assert.equal(r.resultados[0][0], true, id + ': ' + r.resultados[0][1]);
        r.jogo.update(1); r.jogo.press('act');
        assert.equal(r.resultados.length, 1, id + ': resultado único');
      }
    });
  }
  test(`Sem ação: peteca e gato perdem · nível ${nivel}`, () => {
    for (const id of Object.keys(pracinha)) {
      const r = rodada(id, nivel);
      for(let i=0;i<3000;i++) r.jogo.update(0.04);
      { assert.equal(r.resultados.length,1); assert.equal(r.resultados[0][0],false); }
    }
  });
}

test('Desenhar não avança a partida; cancelar entrada libera movimentos', () => {
  for (const id of Object.keys(pracinha)) {
    const r=rodada(id,1);
    assert.deepEqual(r.desenhar(),r.desenhar());
    assert.equal(r.resultados.length,0);
    if (r.jogo.cancelInput) {
      const controle=rodada(id,1);
      r.jogo.press('right'); r.jogo.cancelInput();
      r.jogo.update(0.1); controle.jogo.update(0.1);
      assert.deepEqual(r.desenhar(),controle.desenhar());
    }
  }
});

test('A peteca requer novas rebatidas', () => {
  const p=rodada('peteca',1);
  p.jogo.press('up');
  for(let i=0;i<150;i++)p.jogo.update(0.02);
  assert.equal(p.resultados[0][0],false);
});
