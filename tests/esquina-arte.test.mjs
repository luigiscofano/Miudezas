import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esquina} from '../dist/esquina.js';

// Conferimos desenho e estado separadamente: ornamentação não altera a partida.
const jogos = ['radio', 'pao'];
const cores = ['#f2bb55', '#70605c'];
for (const [indice, id] of jogos.entries()) {
  test(`Arte aprovada: ${id} conserva estado e pixels característicos`, () => {
    const jogo = esquina[id](1, {tone() {}, finish() {}}, {seed: 1});
    const antes = jogo.snapshot?.();
    const hud = jogo.hud?.();
    const usadas = new Set();
    const ctx = {fillStyle: '', fillRect(x, y, w, h) {
      assert.ok([x, y, w, h].every(Number.isFinite));
      usadas.add(this.fillStyle);
    }, save() {}, restore() {}, translate() {}, scale() {}};
    jogo.draw(ctx);
    assert.ok(usadas.has(cores[indice]));
    assert.deepEqual(jogo.snapshot?.(), antes);
    assert.equal(jogo.hud?.(), hud);
  });
}
