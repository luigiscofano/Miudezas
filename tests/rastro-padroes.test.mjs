import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gerarRastro, validarRastro, buscarAtalhoRastro, analisarOrdensRastro, esquina} from '../dist/esquina.js';

function normalizar(mapa, somentePedras = false) {
  const variantes = [];
  for (let giro = 0; giro < 4; giro++) for (let espelho = 0; espelho < 2; espelho++) {
    const casas = Array(49);
    [...mapa.join('')].forEach((tipo, indice) => {
      let x = indice % 7, y = Math.floor(indice / 7);
      if (espelho) x = 6 - x;
      for (let i = 0; i < giro; i++) [x, y] = [6 - y, x];
      casas[y * 7 + x] = somentePedras ? (tipo === '#' ? '#' : '.') : tipo;
    });
    variantes.push(casas.join(''));
  }
  return variantes.sort()[0];
}
function executarGesto(jogo, solucao) {
  const centro = indice => [2 + (indice % 7 + 0.5) * 13, 2 + (Math.floor(indice / 7) + 0.5) * 13];
  const delta = {left: -1, right: 1, up: -7, down: 7};
  let posicao = jogo.snapshot().caminho.at(-1);
  jogo.point(...centro(posicao), 'down');
  for (let i = 0; i < solucao.length;) {
    const direcao = solucao[i];
    do { posicao += delta[solucao[i++]]; } while (solucao[i] === direcao);
    jogo.point(...centro(posicao), 'move');
  }
  jogo.point(...centro(posicao), 'up');
}

test('Rastro preserva integralmente as primeiras 100 sementes das três famílias anteriores', () => {
  const hashes = {
    estreito: '7a7578e9d61358188071d746c245ed9fdf83f94ca4804e19e02aa30a1b0edbd5',
    aberto: '8e999763ab420c495cc61b365ce91774fb92a167f5ce9bd0b42043f7ee550f2a',
    irregular: 'a0f81e982ef1a16c8aed0da256bc1cbc568dc3923c464fe5662ee0b844afa1bc'
  };
  for (const [familia, esperado] of Object.entries(hashes)) {
    const fases = Array.from({length: 100}, (_, seed) => gerarRastro(seed, familia));
    assert.equal(createHash('sha256').update(JSON.stringify(fases)).digest('hex'), esperado);
  }
});

test('Rastro irregular: 300 sementes com certificado, planejamento de ordem e diversidade real', () => {
  const mapas = new Set(), pedras = new Set(), inicios = new Set(), folhas = new Set();
  let reservas = 0;
  for (let seed = 0; seed < 300; seed++) {
    const fase = gerarRastro(seed, 'irregular');
    assert.deepEqual(fase, gerarRastro(seed, 'irregular'));
    assert.equal(fase.familia, 'irregular'); assert.equal(fase.mapa.length, 7);
    assert.ok(fase.ilhas >= 3); assert.ok(fase.bifurcacoes >= 10);
    assert.ok(fase.areaLivre >= 30 && fase.areaLivre <= 38);
    assert.ok(validarRastro(fase.mapa, fase.solucao));
    const atalho = buscarAtalhoRastro(fase.mapa, 25, 12000);
    assert.equal(atalho.conclusivo, true); assert.equal(atalho.encontrado, false);
    const ordens = analisarOrdensRastro(fase.mapa, 6000);
    assert.equal(ordens.conclusivo, true); assert.equal(ordens.ordens.length, 6);
    assert.equal(ordens.ordens.filter(o => o.possivel).length, fase.ordensPossiveis);
    assert.ok(fase.ordensPossiveis >= 1 && fase.ordensPossiveis <= 3);
    const resultados = [];
    const jogo = esquina.rastro(3, {finish: ok => resultados.push(ok)}, {mode: 'generated', seed, family: 'irregular'});
    assert.deepEqual(jogo.snapshot().mapa, fase.mapa);
    executarGesto(jogo, fase.solucao);
    assert.deepEqual(resultados, [true]);
    mapas.add(normalizar(fase.mapa)); pedras.add(normalizar(fase.mapa, true));
    const casas = fase.mapa.join(''); inicios.add(casas.indexOf('S'));
    folhas.add([...casas].flatMap((c, i) => c === 'L' ? [i] : []).join(','));
    reservas += fase.fallback;
  }
  assert.ok(mapas.size >= 260, `mapas normalizados: ${mapas.size}`);
  assert.ok(pedras.size >= 210, `topologias normalizadas: ${pedras.size}`);
  assert.ok(inicios.size >= 20); assert.ok(folhas.size >= 250);
  assert.ok(reservas > 0 && reservas <= 45, `reservas próprias: ${reservas}`);
});

test('Rastro distingue análise inconclusiva de ordem impossível', () => {
  const fase = gerarRastro(0, 'irregular');
  assert.equal(analisarOrdensRastro(fase.mapa, 0).conclusivo, false);
  assert.equal(buscarAtalhoRastro(fase.mapa, 25, 0).conclusivo, false);
});

test('Rastro inclui travessias sem retirar nenhuma família anterior', () => {
  const familias = new Set();
  for (let seed = 0; seed < 24; seed++) {
    const fase = gerarRastro(seed); familias.add(fase.familia);
    assert.equal(fase.familia, seed % 4 === 2 ? 'travessia' : seed % 4 === 3 ? 'irregular' : seed % 3 === 1 ? 'aberto' : 'estreito');
  }
  assert.deepEqual([...familias].sort(), ['aberto', 'estreito', 'irregular', 'travessia']);
});

test('Rastro travessia: cinco padrões abertos difíceis, 500 sementes e reinício pelos controles', () => {
  const grupos = new Map(), anteriores = new Set();
  for (const familia of ['estreito', 'aberto', 'irregular']) {
    for (let seed = 0; seed < 100; seed++) anteriores.add(normalizar(gerarRastro(seed, familia).mapa, true));
  }
  for (let seed = 0; seed < 500; seed++) {
    const fase = gerarRastro(seed, 'travessia');
    assert.deepEqual(fase, gerarRastro(seed, 'travessia'));
    assert.ok(validarRastro(fase.mapa, fase.solucao));
    assert.equal(fase.minimoPassos, 28);
    assert.ok(fase.areaLivre >= 39 && fase.bifurcacoes >= 22 && fase.pracas >= 12);
    const prova = buscarAtalhoRastro(fase.mapa, 27, 30000);
    assert.equal(prova.conclusivo, true); assert.equal(prova.encontrado, false);
    const resultados = [];
    const options = {mode: 'generated', seed, family: 'travessia'};
    const jogo = esquina.rastro(3, {finish: ok => resultados.push(ok)}, options);
    const inicial = jogo.snapshot();
    executarGesto(jogo, fase.solucao);
    assert.deepEqual(resultados, [true]);
    const reiniciado = esquina.rastro(3, {finish() {}}, options);
    assert.deepEqual(reiniciado.snapshot(), inicial);
    const grupo = grupos.get(fase.padrao) ?? {mapas: new Set(), pedras: new Set(), reservas: 0};
    grupo.mapas.add(normalizar(fase.mapa)); grupo.pedras.add(normalizar(fase.mapa, true));
    grupo.reservas += fase.fallback;
    grupos.set(fase.padrao, grupo);
  }
  assert.deepEqual([...grupos.keys()].sort(), ['contrafluxo', 'cotovelo', 'enseada', 'ferradura', 'varanda']);
  let reservas = 0;
  for (const [padrao, grupo] of grupos) {
    assert.ok(grupo.mapas.size >= 50, `${padrao}: layouts além de simetrias`);
    assert.ok(grupo.pedras.size >= 20, `${padrao}: obstáculos realmente variados`);
    assert.ok([...grupo.pedras].filter(mapa => !anteriores.has(mapa)).length >= 20, `${padrao}: novas topologias`);
    reservas += grupo.reservas;
  }
  assert.ok(reservas > 0 && reservas < 125, `reservas próprias certificadas: ${reservas}`);
});

test('Rastro: o solver reconhece vitória trivial e certificado que viola as regras', () => {
  const mapa = ['SLL', '##L', '..P'];
  const solucao = ['right', 'right', 'down', 'down'];
  assert.ok(validarRastro(mapa, solucao));
  assert.equal(buscarAtalhoRastro(mapa, 4).encontrado, true);
  assert.equal(buscarAtalhoRastro(mapa, 3).encontrado, false);
  assert.equal(validarRastro(mapa, ['down', ...solucao]), false);
  assert.equal(validarRastro(mapa, ['right', 'left', ...solucao]), false);
  const fase = gerarRastro(0, 'travessia');
  assert.equal(buscarAtalhoRastro(fase.mapa, 27, 0).conclusivo, false);
});
