import test from 'node:test';
import assert from 'node:assert/strict';
import {varanda} from '../dist/varanda.js';

function criar(level, mode = 'classic') {
  const resultados = [];
  const jogo = varanda.luz(level, {tone() {}, finish(...resultado) { resultados.push(resultado); }}, {mode});
  return {jogo, resultados};
}
function mirar(jogo, acerto) {
  for (let i = 0; i < 3000; i++) {
    const desvio = Math.abs(jogo.snapshot().desvio);
    if (acerto ? desvio < .1 : desvio > .3) return;
    jogo.update(.005);
  }
  assert.fail('Mira não alcançou a janela esperada');
}
for (const level of [1, 2, 3]) {
  test(`Luz ${level}: terceiro erro encerra uma vez; toque/teclado e reinício`, () => {
    const {jogo, resultados} = criar(level);
    assert.match(jogo.hud(), /3 erros restantes/);
    for (let erro = 1; erro <= 3; erro++) {
      mirar(jogo, false);
      jogo.point(30, 30, 'down');
      // Entradas repetidas durante o mesmo bote não representam novos botes.
      for (let i = 0; i < 10; i++) jogo.press('left');
      jogo.update(.2);
      assert.equal(jogo.snapshot().erros, erro - 1);
      jogo.update(.25);
      assert.equal(jogo.snapshot().erros, erro);
      assert.equal(resultados.length, erro === 3 ? 1 : 0);
    }
    assert.equal(resultados[0][0], false);
    assert.match(resultados[0][1], /Três botes errados/);
    assert.match(jogo.hud(), /0 erros restantes/);
    const estadoFinal = jogo.snapshot();
    for (let i = 0; i < 100; i++) { jogo.press('right'); jogo.update(1); }
    assert.deepEqual(jogo.snapshot(), estadoFinal);
    assert.equal(resultados.length, 1);
    const reinicio = criar(level).jogo;
    assert.equal(reinicio.snapshot().erros, 0);
    assert.equal(reinicio.snapshot().capturas, 0);
    assert.match(reinicio.hud(), new RegExp(`${26 - level} s`));
  });
  test(`Luz ${level}: meta vence com dois erros; prazo ainda derrota`, () => {
    const {jogo, resultados} = criar(level);
    for (let i = 0; i < 2; i++) { mirar(jogo, false); jogo.press('left'); jogo.update(.45); }
    for (let i = 0; i < level + 1; i++) { mirar(jogo, true); jogo.press('left'); jogo.update(.45); }
    assert.equal(jogo.snapshot().erros, 2);
    assert.equal(resultados.length, 1);
    assert.equal(resultados[0][0], true);
    const prazo = criar(level);
    prazo.jogo.update(26 - level);
    assert.equal(prazo.resultados[0][0], false);
    assert.equal(prazo.jogo.snapshot().erros, 0);
    prazo.jogo.update(10);
    assert.equal(prazo.resultados.length, 1);
  });
}
test('Sem Parar não ganha prazo e mantém três erros', () => {
  const {jogo, resultados} = criar(3, 'endless');
  jogo.update(100);
  assert.equal(resultados.length, 0);
  assert.doesNotMatch(jogo.hud(), /\d+ s(?: ·|$)/);
  for (let i = 0; i < 3; i++) { mirar(jogo, false); jogo.press('left'); jogo.update(.45); }
  assert.equal(resultados.length, 1);
  assert.equal(resultados[0][0], false);
});
