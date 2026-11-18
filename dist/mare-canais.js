// Canais irregulares: árvores, anéis e estreitos com duas casas rasas consecutivas.
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const padroesMare = Object.freeze({
  'canais-ramificados': Object.freeze({divisor: 17, aneis: 0, duplo: false}),
  'anel-de-mare': Object.freeze({divisor: 19, aneis: 1, duplo: false}),
  'bacias-gemeas': Object.freeze({divisor: 23, aneis: 2, duplo: false}),
  'estreito-duplo': Object.freeze({divisor: 29, aneis: 0, duplo: true}),
  'anel-e-estreito': Object.freeze({divisor: 31, aneis: 1, duplo: true})
});
export const criteriosMareCanais = Object.freeze({minPassos: 30, maxPassos: 60, custoMare: 8, portais: 3, tentativas: 128});
// Confere a assinatura espacial também nas reservas: anéis e estreitos não são rótulos.
export function estruturaCanaisMare(grid) {
  if (grid.length !== 8 || grid.some(row => !/^[.SC=~#]{8}$/.test(row)) ||
      grid.join('').split('S').length !== 2 || grid.join('').split('C').length !== 2) return null;
  const passable = cell => '.SC='.includes(cell ?? '!');
  const vertices = [];
  let edges = 0, pairs = 0, branches = 0;
  grid.forEach((row, y) => [...row].forEach((cell, x) => {
    if (!passable(cell)) return;
    vertices.push([x, y]);
    if (dirs.filter(([dx, dy]) => passable(grid[y + dy]?.[x + dx])).length >= 3) branches++;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const neighbor = grid[y + dy]?.[x + dx];
      if (passable(neighbor)) edges++;
      if (cell === '=' && neighbor === '=') pairs++;
    }
  }));
  const queue = [vertices[0]], visited = new Set([vertices[0].join(',')]);
  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head];
    for (const [dx, dy] of dirs) {
      const next = [x + dx, y + dy], key = next.join(',');
      if (passable(grid[next[1]]?.[next[0]]) && !visited.has(key)) { visited.add(key); queue.push(next); }
    }
  }
  if (visited.size !== vertices.length) return null;
  return {aneis: edges - vertices.length + 1, duplos: pairs, bifurcacoes: branches};
}

function criarEixo(random) {
  const lengths = [2, 2, 2];
  lengths[Math.floor(random() * lengths.length)]++;
  return [0, lengths[0], lengths[0] + lengths[1], 7];
}
function criarArvore(random) {
  const edges = [], visited = new Set([0]), stack = [0];
  while (stack.length) {
    const at = stack.at(-1), x = at % 4, y = Math.floor(at / 4);
    const neighbors = dirs.map(([dx, dy]) => [x + dx, y + dy])
      .filter(([nx, ny]) => nx >= 0 && nx < 4 && ny >= 0 && ny < 4 && !visited.has(ny * 4 + nx));
    if (!neighbors.length) { stack.pop(); continue; }
    const [nx, ny] = neighbors[Math.floor(random() * neighbors.length)], next = ny * 4 + nx;
    edges.push([at, next]);
    visited.add(next);
    stack.push(next);
  }
  return edges;
}
function acrescentarAneis(edges, count, random) {
  const missing = [];
  for (let at = 0; at < 16; at++) {
    const neighbors = [at % 4 < 3 ? at + 1 : -1, at < 12 ? at + 4 : -1];
    for (const next of neighbors) {
      if (next >= 0 && !edges.some(([a, b]) => (a === at && b === next) || (b === at && a === next))) missing.push([at, next]);
    }
  }
  for (let i = 0; i < count; i++) edges.push(...missing.splice(Math.floor(random() * missing.length), 1));
}
function escavarCanal(cells, from, to) {
  let [x, y] = from;
  const [tx, ty] = to, dx = Math.sign(tx - x), dy = Math.sign(ty - y), inner = [];
  cells[y][x] = '.';
  while (x !== tx || y !== ty) {
    x += dx; y += dy;
    cells[y][x] = '.';
    if (x !== tx || y !== ty) inner.push([x, y]);
  }
  return inner;
}
export function criarCanaisMare(random, loops, double) {
  // Dezesseis encontros, com espaçamentos 2/2/3 sorteados em cada eixo.
  // As árvores e os anéis mudam as conexões, não apenas a orientação do tabuleiro.
  const xs = criarEixo(random), ys = criarEixo(random);
  const cells = Array.from({length: 8}, () => Array(8).fill('~'));
  const edges = criarArvore(random);
  acrescentarAneis(edges, loops, random);
  const position = node => [xs[node % 4], ys[Math.floor(node / 4)]];
  let paired = false;
  for (const [a, b] of edges) {
    const inner = escavarCanal(cells, position(a), position(b));
    if (double && !paired && inner.length === 2) {
      for (const [x, y] of inner) cells[y][x] = '=';
      paired = true;
    } else if (random() < 0.45) {
      const [x, y] = inner[Math.floor(random() * inner.length)];
      cells[y][x] = '=';
    }
  }
  if (double && !paired) return null;
  // Algumas divisórias viram pedras: a prova exige que removê-las encurte a solução.
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    if (cells[y][x] === '~' && random() < 0.65) cells[y][x] = '#';
  }
  const start = Math.floor(random() * 16), end = Math.floor(random() * 16);
  if (start === end) return null;
  const [sx, sy] = position(start), [cx, cy] = position(end);
  cells[sy][sx] = 'S'; cells[cy][cx] = 'C';
  return cells.map(row => row.join(''));
}

// Reservas independentes, certificadas novamente ao usar; não dispensam a maré.
export const reservasMareCanais = {
  "canais-ramificados": [
    ["S#...=.C", ".~.~=##.", ".#.#.~#.", "=###.##.", ".###.#~.", "...~.~~.", "~#.#.~~=", ".=...#~."],
    ["S##.=...", ".##~###=", "....=.#.", "#~#~#.#.", ".=.C#.=.", ".###~#~.", ".#####~.", ".=..=..."],
    [".#.~....", ".~=~.#~.", ".#.=.~#.", ".#~#.#~=", ".###=##.", "C=.#S##.", "~~.###~=", ".=......"],
    [".#......", "=#=~#~#.", ".~C##S#.", "=~.##.#=", ".=.#~.~.", "~~#~#=~.", "~~###.#.", "......=."],
    [".#~C..=.", ".#~.###.", ".=..#.#.", "#~#~#.#.", "###~~.~.", ".=..=.#.", ".~~~#.#.", "...S#.=."],
    [".....S#.", "~##~~.#.", "....~...", ".##.##~=", ".##=~~~.", "C##...#.", ".##.##~=", ".#~....."],
    [".~C##.=.", ".~=##.~.", ".~.~#=#.", ".~....#.", "=#=#~#~.", ".#.##...", "=####=#=", "..S...~."],
    ["....=C~.", "###~~.#.", ".##...~.", ".##.###=", ".~~.#~~.", "S##...=.", ".######=", ".=......"],
  ],
  "anel-de-mare": [
    ["..C~S...", "##.~###=", "...~....", "=#.#=#~~", ".=.#..=.", "~~.~#~#.", "~#.~~~~.", "...=..=."],
    [".~~.=..C", ".~#=~.##", "S~~.=...", ".#~.###=", ".#~...#.", "=######.", ".~#####.", "......=."],
    ["S..#.=..", "##.#~##.", "##.~###=", ".#.=....", "=#~##~#.", "C#...##.", "=#=#=##=", "...=...."],
    [".~..=...", "=~=####.", ".=C~#.~.", "##~##.~=", "~~~~~=~.", "S.....~.", ".~##~.#=", ".=......"],
    [".....S~.", "#~#=#.#.", "#~~.~.#.", ".#~...~.", ".~#.~#~.", "....#C=.", "=##~~~#.", "..=...=."],
    ["...#~...", "#~=~#=#=", ".#....#.", ".#=~#.#.", ".#.~~.#.", ".=.~~.~S", ".~~~##~.", "..C.=.=."],
    ["S#...~#.", "=#.#.##.", "...~.##C", "##.#=#~.", "~~=~.##.", ".=.~.~#.", ".#~#=##.", ".=....=."],
    ["...C=...", "####~##=", "S=..=.#.", ".##~#=~.", ".#~...#.", ".#~.~.~=", ".#~.~.#.", ".=..~..."],
  ],
  "bacias-gemeas": [
    ["C=.#S...", "##.~###=", "##=###~.", ".#...##.", "=#~~.##=", ".=.#....", "=#.#=#~=", ".=.=..=."],
    [".=C=....", "####~##=", ".=.=..=.", ".#.~.~#.", ".#.#.##.", ".#.#..=.", "=#.###~~", "...=...S"],
    [".#.=..=.", "=#.##.#.", ".#.=..=.", ".#=#~##=", ".#.####.", ".#S##...", ".##~#.~.", "C=....#."],
    ["S~~.=...", ".##.~.~.", ".##=~.#=", ".=..~.#.", "#####.#=", "C.=...=.", "=~#=###=", ".~#....."],
    ["....=...", ".#~=#~#=", ".~#.###.", "..=.=.~.", "=##~#=~.", ".##C..#.", ".~~=~##.", "....#S.."],
    [".=C.....", "##~~#~~=", "#~~~~~#.", ".=.=S##.", ".~.~###=", ".~.=.=..", "=#.#.##=", ".#.=.=.."],
    ["C#....#.", "=#=##.#.", "...##.#S", "#~###.#=", ".=....#.", ".#.#~=~.", ".~.##.~.", ".=..=.=."],
    [".~C=..=.", ".###=##.", ".=.#.~~.", "##.~###=", "##=~##~.", "S=.=..=.", "=##~=##=", "...=...."],
  ],
  "estreito-duplo": [
    ["S..==.#.", "#####.#.", "#~#~~.~.", "C..##...", "##.~##~=", ".=.#~...", ".###~.#~", "....=.=."],
    ["C==.....", "####~~~.", "...S..#.", ".~~#~~~=", "=##~~~#.", "....~...", "=##=#=~~", ".#~....."],
    ["S#~.=.#.", "=##.#.#.", "=##.#.#.", "..=.#.=.", "~#~###~=", "...C..#.", ".###~.#.", "....#..."],
    ["..S~.=..", "~#.#.~~.", ".#.#.~~C", ".~.#=~#=", ".=.~.##.", "=###.##.", "=~~#.##.", ".....#~."],
    ["S#~..C..", ".##.####", ".##.=...", ".~~##~#.", ".==...~.", "##~##=#.", "#~#~~.~.", "......=."],
    [".#......", "=#=###~.", "C#.~#.=.", "=##~~.#=", "=~~##.#.", ".#.=..~.", ".#.#~~#.", "...##S=."],
    [".#...=..", ".~~#~~~=", "S#....=.", "=#.##~~.", "=~=#~#~.", "...#C#~.", "##~#=##.", "...=..=."],
    [".#.=C=..", ".#.~=###", "S~.~....", ".#~#.~#.", "...#.~#.", "##=~~##=", "~#=##~#.", ".=...=.."],
  ],
  "anel-e-estreito": [
    ["S#...=.C", "=#=~=#~.", ".#.#.#~.", ".#.~.###", ".#.#..=.", "=~##.##.", "=~~~=~#.", "...=..=."],
    [".#~.....", "=##.~.#.", "C==.#...", "#~~##=##", "......#.", ".#~~~##.", ".#~####.", "...S=.=."],
    ["S....~#.", "#~##=#~.", "#~~#=~#.", ".=C~....", "##=~#~#.", ".....~#.", "=~#~=##=", ".....=.."],
    ["S##...#.", ".~~.#.~.", ".==.=.#.", "#~~~~.#=", ".=..#.#.", ".#~.~.~.", ".#~=#=#.", "C#~....."],
    ["S..==.#.", "#~~##.#.", "....=.#.", ".##~~~~.", ".#~###~=", "......=C", "~####.#.", "........"],
    [".~.=C=..", ".~=#.~~.", "..S~.#~.", "=#~#.###", "=##~.~~#", "...~....", "#~.#~##.", "......=."],
    ["S~#.=.~.", ".##.#.~.", ".==...~C", "###~#.#=", "##~##=~.", ".##...#.", ".##.###=", ".=..=..."],
    ["S==.#...", "#~~.~=~#", "....#.=C", ".##~##~.", ".~#####=", ".~#.=.#.", ".~~.#=~.", "..=....."],
  ],
};
