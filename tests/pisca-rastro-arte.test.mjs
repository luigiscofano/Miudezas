import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esquina} from '../dist/esquina.js';
import {varanda} from '../dist/varanda.js';
const api = {tone() {}, finish() {}};
function tela() {
  const pixels = new Map();
  return {pixels, fillStyle: '', fillRect(x, y, w, h) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) pixels.set(`${x + dx},${y + dy}`, this.fillStyle);
  }};
}
test('Rastro: três folhas finas aprovadas preservam o estado e a escala', () => {
  const jogo = esquina.rastro(1, api), antes = jogo.snapshot(), ctx = tela();
  jogo.draw(ctx);
  const matrizes = [['....gg.','...ghgg','..ghigg','.ghigg.','ghigg..','gig....','i......'],['...g...','..ghg..','.ghigg.','ghiggg.','.gigg..','..ig...','..i....'],['.....g.','...gghg','..ghigg','.ghigg.','ghigg..','.ig....','i......']];
  const cores = {g:'#72a364',h:'#b7cb85',i:'#3f634b'};
  const lado = antes.mapa.length, tamanho = Math.floor(94 / lado), margem = Math.floor((96 - tamanho * lado) / 2);
  const folhas = [...antes.mapa.join('')].flatMap((tipo, i) => tipo === 'L' ? [i] : []);
  assert.equal(folhas.length, 3);
  folhas.forEach((indice, variante) => {
    const x = margem + indice % lado * tamanho + Math.floor(tamanho / 2) - 3;
    const y = margem + Math.floor(indice / lado) * tamanho + Math.floor(tamanho / 2) - 3;
    matrizes[variante].forEach((linha, dy) => [...linha].forEach((cor, dx) => {
      if (cores[cor]) assert.equal(ctx.pixels.get(`${x + dx},${y + dy}`), cores[cor]);
    }));
  });
  assert.deepEqual(jogo.snapshot(), antes);
});
test('Pisca: primeiro visual restaurado preserva sequência e pontuação', () => {
  const jogo = varanda.pisca(1, api, {seed: 1}), antes = jogo.snapshot(), ctx = tela();
  jogo.draw(ctx);
  assert.equal(ctx.pixels.get('50,94'), '#0b3439');
  assert.equal(ctx.pixels.get('44,85'), '#0b3439');
  assert.deepEqual(jogo.snapshot(), antes);
  assert.equal(jogo.score(), 0);
  // A matriz inicial é conferida inteira, evitando confundi-la com versões intermediárias.
  const matriz = ['....ww.....','...ww.w....','......w....','..ggggggg..','.lggggggkg.','.lggggggg..','...g..g....'];
  const paleta = {g: '#7caa58', w: '#a1d8ab', k: '#1c493c', l: '#739e55'};
  matriz.forEach((linha, y) => [...linha].forEach((cor, x) => {
    if (paleta[cor]) assert.equal(ctx.pixels.get(`${16 + x * 2},${43 + y * 2}`), paleta[cor]);
  }));
  assert.equal(ctx.pixels.get('0,86'), '#48764d');
});
