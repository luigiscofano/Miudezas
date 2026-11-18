import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {gerarMare, gerarMareLegada, selecionarFamiliaMare, familiasMare, quintal, resolverMare, validarCanaisMare} from '../dist/quintal.js';
import {padroesMare, reservasMareCanais} from '../dist/mare-canais.js';
const directions = {up: [0,-1], down: [0,1], left: [-1,0], right: [1,0]};
const passable = cell => '.SC='.includes(cell ?? '!');
function canonical(grid, terrain = true) {
  const variants = [];
  for (let mirror = 0; mirror < 2; mirror++) {
    let rows = grid.map(row => row.replaceAll('#', '~').replaceAll('S', '.').replaceAll('C', '.'));
    if (!terrain) rows = rows.map(row => row.replaceAll('=', '.'));
    if (mirror) rows = rows.map(row => [...row].reverse().join(''));
    for (let turn = 0; turn < 4; turn++) {
      variants.push(rows.join(''));
      rows = [...rows[0]].map((_, x) => rows.map(row => row[x]).reverse().join(''));
    }
  }
  return variants.sort()[0];
}
function checkTopology(grid, pattern) {
  let vertices = 0, edges = 0, pairs = 0, branches = 0;
  grid.forEach((row, y) => [...row].forEach((cell, x) => {
    if (!passable(cell)) return;
    vertices++;
    if (Object.values(directions).filter(([dx,dy]) => passable(grid[y+dy]?.[x+dx])).length >= 3) branches++;
    for (const [dx,dy] of [[1,0],[0,1]]) {
      const neighbor = grid[y+dy]?.[x+dx];
      if (passable(neighbor)) edges++;
      if (cell === '=' && neighbor === '=') pairs++;
    }
  }));
  // O gerador conecta todos os encontros; cada aresta extra cria um anel independente.
  assert.equal(edges - vertices + 1, pattern.aneis);
  assert.equal(pairs, Number(pattern.duplo));
  if (pattern === padroesMare['canais-ramificados']) assert.ok(branches > 0);
}
function play(seed, map) {
  const results = [], game = quintal.mare(3, {tone(){}, finish(ok){results.push(ok);}}, {mode: 'generated', seed});
  let safe;
  for (const command of map.solution) {
    const before = game.snapshot(), [dx,dy] = directions[command];
    safe ??= [before.x,before.y];
    // Comandos bloqueados não gastam passo nem mudam a fase da água.
    for (const [invalid, [ix,iy]] of Object.entries(directions)) {
      const neighbor = map.grid[before.y+iy]?.[before.x+ix];
      if (!passable(neighbor) || (before.high && neighbor === '=')) {
        game.press(invalid);
        assert.deepEqual(game.snapshot(), before);
      }
    }
    let x = before.x+dx, y = before.y+dy;
    const cell = map.grid[y]?.[x];
    assert.ok(passable(cell));
    assert.ok(!(before.high && cell === '='));
    if (cell !== '=') safe = [x,y];
    const steps = before.steps + 1;
    if (cell === '=' && steps % 6 === 3) [x,y] = safe;
    game.press(command);
    const after = game.snapshot();
    assert.deepEqual([after.x,after.y,after.steps], [x,y,steps]);
    if (cell !== 'C') assert.equal(after.high, steps % 6 >= 3);
  }
  assert.deepEqual(results, [true]);
  const final = game.snapshot(); game.press('left'); game.update(1);
  assert.deepEqual(game.snapshot(), final);
  assert.deepEqual(results, [true]);
}
for (const [family, pattern] of Object.entries(padroesMare)) {
  test(`${family}: 100 sementes, topologia própria, estado real e maré indispensável`, () => {
    const geometry = new Set(), shapes = new Set(), solutions = new Set(), starts = new Set(), ends = new Set();
    let fallbacks = 0;
    for (let i = 1, count = 0; count < 100; i++) {
      const seed = (i - 1) * 10 + familiasMare.indexOf(family);
      const map = gerarMare(seed);
      assert.equal(map.family, family);
      count++;
      assert.deepEqual(map, gerarMare(seed));
      const m = validarCanaisMare(map.grid, family);
      assert.deepEqual(m, map.metrics);
      assert.ok(m.passos >= 30 && m.passos <= 60);
      assert.ok(m.passos - m.passosSemMare >= 8);
      assert.ok(m.baixiosObrigatorios >= 3);
      assert.ok(m.passosSemPedras < m.passos);
      assert.equal(m.duploObrigatorio, pattern.duplo);
      assert.ok(m.baixiosAlternativos >= pattern.aneis);
      assert.equal(resolverMare(map.grid.map(row => row.replaceAll('=', '~'))), null);
      checkTopology(map.grid, pattern);
      geometry.add(canonical(map.grid, false));
      shapes.add(canonical(map.grid)); solutions.add(map.solution.join(','));
      map.grid.forEach((row,y) => {
        if (row.includes('S')) starts.add(`${row.indexOf('S')},${y}`);
        if (row.includes('C')) ends.add(`${row.indexOf('C')},${y}`);
      });
      fallbacks += Number(map.fallback);
      play(seed, map);
    }
    assert.ok(shapes.size >= 80, `${shapes.size} topologias`);
    assert.ok(geometry.size >= 80, `${geometry.size} geometrias sem contar posições dos baixios`);
    assert.ok(solutions.size >= 70);
    assert.ok(starts.size >= 15 && ends.size >= 15);
    assert.ok(fallbacks < 30, `${fallbacks} reservas`);
  });
  test(`${family}: todas as oito reservas satisfazem os mesmos critérios`, () => {
    for (const grid of reservasMareCanais[family]) {
      assert.ok(validarCanaisMare(grid, family));
      checkTopology(grid, pattern);
    }
  });
}
test('validação rejeita ausência de maré, pedras irrelevantes e estreito dispensável', () => {
  for (const [family, grids] of Object.entries(reservasMareCanais)) {
    assert.equal(validarCanaisMare(grids[0].map(row => row.replaceAll('=', '.')), family), null);
    assert.equal(validarCanaisMare(grids[0].map(row => row.replaceAll('#', '~')), family), null);
  }
  assert.equal(validarCanaisMare(reservasMareCanais['canais-ramificados'][0], 'estreito-duplo'), null);
});

test('gerador legado conserva as 269 sementes de regressão anteriores', () => {
  const hash = createHash('sha256');
  let count = 0;
  for (let seed = 0; seed < 300; seed++) {
    const map = gerarMareLegada(seed);
    if (!map.family && [17,19,23,29,31].some(divisor => seed % divisor === 0)) continue;
    hash.update(JSON.stringify(map)); count++;
  }
  assert.equal(count, 269);
  // Calculado sobre o commit 37e7d3c, antes de introduzir os canais.
  assert.equal(hash.digest('hex'), 'f6766af43331eaed4630ac2dd92bc98b2b3358fd3a729c0c5b046c078b8c6dfa');
  assert.equal(gerarMare(1428316038).family, 'enseada-irregular');
});

test('dez famílias equilibradas e cinco padrões novos em metade das sementes', () => {
  const counts = Object.fromEntries(familiasMare.map(family => [family, 0]));
  for (let seed = 0; seed < 10000; seed++) counts[selecionarFamiliaMare(seed)]++;
  assert.deepEqual(Object.values(counts), Array(10).fill(1000));
  assert.equal(Object.keys(padroesMare).reduce((sum, family) => sum + counts[family], 0), 5000);
  assert.equal(selecionarFamiliaMare(1428316038), 'enseada-irregular');
  assert.deepEqual(gerarMare(1428316038), gerarMareLegada(1428316038));
  for (const seed of [0,1,5,9,4294967295]) {
    assert.deepEqual(gerarMare(seed), gerarMare(seed + 4294967296));
  }
});
