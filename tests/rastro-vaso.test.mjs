import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esquina} from '../dist/esquina.js';

// A arte cresce dentro da própria casa: o destino lógico continua sendo P.
function conferirVaso(jogo) {
  const antes = jogo.snapshot();
  const mapa = antes.mapa.flatMap(linha => [...linha]);
  const lado = Math.sqrt(mapa.length);
  const tamanho = Math.floor(94 / lado), borda = Math.floor((96 - tamanho * lado) / 2);
  const destino = mapa.indexOf('P');
  const origemX = borda + (destino % lado) * tamanho;
  const origemY = borda + Math.floor(destino / lado) * tamanho;
  const pixels = [];
  const coresVaso = new Set(['#211c1b', '#48291f', '#b5654e', '#d08060', '#cb7958', '#68382c']);
  const faixas = [];
  const ctx = {fillStyle: '', fillRect(x, y, w, h) {
    if (this.fillStyle === '#f2b593' || this.fillStyle === '#cb8a86') faixas.push([x,y]);
    if (coresVaso.has(this.fillStyle)) pixels.push([x, y, w, h]);
  }, save() {}, restore() {}, translate() {}, scale() {}};
  jogo.draw(ctx);
  assert.deepEqual(jogo.snapshot(), antes);
  assert.ok(!faixas.some(([x,y]) => x === origemX + 1 && y === origemY + 1));
  assert.equal(faixas.length, mapa.length - 1);
  assert.ok(pixels.length > 50);
  for (const [x,y,w,h] of pixels) {
    assert.ok(x >= origemX && x + w < origemX + tamanho);
    assert.ok(y >= origemY && y + h < origemY + tamanho);
  }
  assert.equal(Math.max(...pixels.map(p => p[0])) - Math.min(...pixels.map(p => p[0])) + 1, 12);
  assert.equal(Math.max(...pixels.map(p => p[1])) - Math.min(...pixels.map(p => p[1])) + 1, 10);
}

test('Vaso maior permanece na casa de destino nas três dificuldades', () => {
  for (const nivel of [1,2,3]) conferirVaso(esquina.rastro(nivel, {tone() {}, finish() {}}));
});

test('Vaso maior cabe em caminhos gerados sem alterar estado ou solução', () => {
  for (const seed of [1,2,8,21,42]) conferirVaso(esquina.rastro(3, {tone() {}, finish() {}}, {mode: 'generated', seed}));
});
