import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quintal} from '../dist/quintal.js';

// Conferimos desenho e estado separadamente: ornamentação não altera a partida.
const jogos = ['goteira', 'fio', 'pipa'];
const cores = ['#4b6388', '#f8be92', '#55a79f'];
for (const [indice, id] of jogos.entries()) {
  test(`Arte: ${id} conserva estado e pixels característicos`, () => {
    const jogo = quintal[id](1, {tone() {}, finish() {}}, {seed: 1});
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
