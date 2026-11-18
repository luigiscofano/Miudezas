import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quintal} from '../dist/quintal.js';
import {esquina} from '../dist/esquina.js';

// A instrumentação registra os pixels sem depender de navegador ou bibliotecas gráficas.
function desenharSemMudarEstado(jogo) {
  const antes = jogo.snapshot();
  const cores = new Set();
  const ctx = {fillStyle: '', fillRect(x, y, w, h) {
    assert.ok([x, y, w, h].every(Number.isFinite));
    assert.ok(w > 0 && h > 0);
    cores.add(this.fillStyle);
  }, save() {}, restore() {}, translate() {}, scale() {}};
  jogo.draw(ctx);
  assert.deepEqual(jogo.snapshot(), antes);
  return cores;
}
const api = {tone() {}, finish() {}};

test('Maré: costa, areia, baixios e concha são apenas desenho', () => {
  for (const nivel of [1, 2, 3]) {
    const cores = desenharSemMudarEstado(quintal.mare(nivel, api));
    for (const cor of ['#61b7a7', '#e7c48c', '#abd6b9', '#65717a', '#fff1ca']) assert.ok(cores.has(cor));
  }
});

test('Rastro: acabamento dos ladrilhos preserva folhas B e o caminho', () => {
  for (const nivel of [1, 2, 3]) {
    const jogo = esquina.rastro(nivel, api);
    const cores = desenharSemMudarEstado(jogo);
    assert.ok(cores.has('#cb8a86'));
    assert.ok(cores.has('#f2b593'));
    assert.ok(cores.has('#72a364'));
  }
});

test('Refinamento também desenha caminhos gerados sem mudar a solução', () => {
  for (const seed of [1, 8, 21, 42]) {
    desenharSemMudarEstado(quintal.mare(3, api, {mode: 'generated', seed}));
    desenharSemMudarEstado(esquina.rastro(3, api, {mode: 'generated', seed}));
  }
});
