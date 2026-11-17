import {test} from 'node:test';
import assert from 'node:assert/strict';
import {esquina, gerarRastro, validarRastro} from '../dist/esquina.js';

function criar(tipo, nivel = 1, options = {}) {
  const resultados = [];
  return {jogo: esquina[tipo](nivel, {finish: (...r) => resultados.push(r)}, options), resultados};
}
function recolherProntos(jogo) {
  for (const [lado, alimento] of jogo.snapshot().alimentos.entries()) {
    if (alimento.estado === 1 && !alimento.reposicao) {
      jogo.selectTool(alimento.tipo === 'ovo' ? 'espatula' : 'pinca');
      jogo.press(lado ? 'right' : 'left');
    }
  }
}
for (const nivel of [1, 2, 3]) {
  test(`Pão ${nivel}: metas separadas, vitória imediata e fim único`, () => {
    const {jogo, resultados} = criar('pao', nivel);
    for (let t = 0; t < 60 && !resultados.length; t += 0.02) {
      jogo.update(0.02); recolherProntos(jogo);
      const s = jogo.snapshot();
      assert.equal(s.fim, s.entregues.ovo >= s.metas.ovo && s.entregues.pao >= s.metas.pao);
    }
    assert.equal(resultados.length, 1); assert.equal(resultados[0][0], true);
    const fim = jogo.snapshot(); jogo.update(100); recolherProntos(jogo);
    assert.deepEqual(jogo.snapshot(), fim); assert.equal(resultados.length, 1);
  });
}
test('Pão Sem Parar atravessa 20 minutos sem meta/cronômetro e perde no terceiro erro', () => {
  const {jogo, resultados} = criar('pao', 1, {mode: 'endless'});
  for (let t = 0; t < 1200; t += 0.05) { jogo.update(0.05); recolherProntos(jogo); }
  assert.equal(resultados.length, 0); assert.ok(jogo.score() > 200);
  assert.equal(jogo.snapshot().metas, null);
  jogo.update(100);
  assert.equal(resultados.length, 1); assert.equal(resultados[0][0], false);
  assert.equal(jogo.snapshot().erros, 3);
});
test('Rastro: 1000 sementes determinísticas completadas pelos controles reais', () => {
  const mapas = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const fase = gerarRastro(seed);
    assert.deepEqual(fase, gerarRastro(seed)); assert.ok(validarRastro(fase.mapa, fase.solucao));
    mapas.add(fase.mapa.join(''));
    const {jogo, resultados} = criar('rastro', 1, {mode: 'generated', seed});
    for (const dir of fase.solucao) { jogo.press(dir); jogo.release(dir); }
    assert.deepEqual(resultados, [[true, 'Três folhas e um cantinho no vaso.']]);
    assert.equal(jogo.snapshot().folhas, 3);
    assert.equal(jogo.snapshot().caminho.length, fase.solucao.length + 1);
    assert.deepEqual(criar('rastro', 1, {mode: 'generated', seed}).jogo.snapshot().mapa, fase.mapa);
  }
  assert.ok(mapas.size > 950);
});
test('Rastro: validação rejeita caminho vazio, cruzamento e saída dos limites', () => {
  const fase = gerarRastro(5);
  assert.equal(validarRastro(fase.mapa, []), false);
  assert.equal(validarRastro(fase.mapa, [...fase.solucao, 'left']), false);
  assert.equal(validarRastro(fase.mapa, Array(40).fill('left')), false);
});
test('Rastro: mapas autorais preservados e sprites desenháveis', () => {
  const ctx = {fillRect(){},save(){},restore(){},translate(){},scale(){}};
  for (const nivel of [1,2,3]) {
    const {jogo} = criar('rastro', nivel);
    assert.equal(jogo.snapshot().mapa.length, nivel + 4);
    jogo.draw(ctx);
    assert.equal(jogo.snapshot().solucao, null);
  }
});
