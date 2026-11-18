import {performance} from 'node:perf_hooks';
import {cpus} from 'node:os';
import {gerarMare, gerarMareLegada, selecionarFamiliaMare, familiasMare} from '../dist/quintal.js';
import {padroesMare} from '../dist/mare-canais.js';

// Executar isoladamente: as métricas medem gerarMare(), sem desenho ou execução da solução.
function resumir(samples) {
  const times = samples.map(sample => sample.ms).sort((a, b) => a - b);
  const worst = samples.reduce((a, b) => a.ms > b.ms ? a : b);
  const middle = Math.floor(times.length / 2);
  return {n: times.length, medianaMs: (times[middle - 1] + times[middle]) / 2,
    p95Ms: times[Math.ceil(times.length * 0.95) - 1], maxMs: worst.ms,
    piorSemente: worst.seed, totalMs: times.reduce((sum, ms) => sum + ms, 0),
    acima16ms7: times.filter(ms => ms > 16.7).length, acima50ms: times.filter(ms => ms > 50).length};
}
function normalizar(grid, terrain = true) {
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
const distribution = Object.fromEntries(familiasMare.map(family => [family, 0]));
for (let seed = 0; seed < 10000; seed++) distribution[selecionarFamiliaMare(seed)]++;
const all = [], channels = [], rows = [];
for (const [index, family] of familiasMare.entries()) {
  const samples = [], shapes = new Set(), geometry = new Set(), steps = [], costs = [];
  let fallback = 0;
  for (let i = 0; i < 100; i++) {
    const seed = i * 10 + index, start = performance.now();
    const map = gerarMare(seed), ms = performance.now() - start;
    samples.push({seed, ms});
    shapes.add(normalizar(map.grid)); geometry.add(normalizar(map.grid, false));
    steps.push(map.metrics.passos); costs.push(map.metrics.passos - map.metrics.passosSemMare);
    fallback += Number(map.fallback);
  }
  all.push(...samples);
  if (padroesMare[family]) channels.push(...samples);
  rows.push({family, ...resumir(samples), fallback, topologias: shapes.size, geometrias: geometry.size,
    passos: [Math.min(...steps), Math.max(...steps)], custoMare: [Math.min(...costs), Math.max(...costs)],
    exemplos: samples.slice(0, 3).map(sample => sample.seed)});
}
// Fora do intervalo cronometrado, compara mapas realmente gerados, não só os rótulos.
let unchanged = 0;
for (let seed = 0; seed < 300; seed++) {
  if (JSON.stringify(gerarMare(seed)) === JSON.stringify(gerarMareLegada(seed))) unchanged++;
}
console.log(JSON.stringify({node: process.version, cpu: cpus()[0].model,
  metodo: '100 sementes por família, 0–999, sem aquecimento explícito, imports excluídos, chamadas sequenciais',
  distribution, rows, canais: resumir(channels), todas: resumir(all),
  compatibilidadeLegada: {sementes: '0–299', inalteradas: unchanged, alteradas: 300 - unchanged}}, null, 2));
