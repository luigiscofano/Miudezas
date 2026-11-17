import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esquina} from '../dist/esquina.js';

function criar(nivel) {
  const resultados = [];
  const jogo = esquina.pao(nivel, {finish(...r) { resultados.push(r); }, tone() {}});
  const desenhar = () => {
    const pixels = [];
    jogo.draw({fillStyle:'', fillRect(x,y,w,h) { pixels.push({cor:this.fillStyle,x,y,w,h}); }});
    return pixels;
  };
  return {jogo, resultados, desenhar};
}
function conferirIdentidades(pixels) {
  // Gema e seu brilho permanecem à esquerda; miolo e riscos, à direita.
  assert.ok(pixels.some(p=>p.x===25 && p.y===38 && p.w===8 && p.h===8));
  assert.ok(pixels.some(p=>p.cor==='#ffe19a' && p.x===26));
  assert.ok(pixels.some(p=>p.x===57 && p.y===34 && p.w===14 && p.h===17));
  assert.ok(!pixels.some(p=>p.x>48 && p.cor==='#ffe19a'));
}
for (const nivel of [1,2,3]) {
  test(`Ovo e pão não se transformam nos estados e reposições, nível ${nivel}`, () => {
    const {jogo, desenhar} = criar(nivel);
    conferirIdentidades(desenhar());
    jogo.update(4.4);
    conferirIdentidades(desenhar());
    jogo.update(10);
    conferirIdentidades(desenhar());
    jogo.press('left'); jogo.point(70,40,'down');
    conferirIdentidades(desenhar());
    assert.match(jogo.hud(), /0\//);
  });
  test(`Metas, tempo e encerramento único preservados, nível ${nivel}`, () => {
    const {jogo, resultados, desenhar} = criar(nivel);
    for (let t=0;t<60.1;t+=0.05) {
      jogo.update(0.05);
      const pixels = desenhar();
      if (pixels.some(p=>p.x===17 && p.cor==='#eed8a0')) jogo.press('left');
      if (pixels.some(p=>p.x===57 && p.y===34 && p.cor==='#e8ad43')) jogo.point(70,40,'down');
    }
    assert.equal(resultados.length,1);
    assert.equal(resultados[0][0],true);
    jogo.update(60); jogo.press('right');
    assert.equal(resultados.length,1);
  });
}
