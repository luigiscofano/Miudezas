// Cenas de esquina. As coordenadas são pixels da tela original de 96 por 96.
function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function sprite(ctx, rows, palette, x, y, scale = 1) {
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const color = palette[rows[row][col]];
      if (color) rect(ctx, color, x + col * scale, y + row * scale, scale, scale);
    }
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundEnd(api) {
  let finished = false;
  return {
    get done() { return finished; },
    finish(won, feedback) {
      if (finished) return;
      finished = true;
      api.finish(won, feedback);
    }
  };
}

function radio(level, api) {
  const round = roundEnd(api);
  const stations = [0.18, 0.54, 0.83];
  const news = ['Sumiu um canário!', 'Gol no campinho!', 'Um canário no estúdio!'];
  const songs = [294, 392, 494];
  const found = new Set();
  const held = new Set();
  const radius = [0.042, 0.032, 0.023][level - 1];
  let battery = [52, 44, 36][level - 1];
  let dial = 0.03;
  let tuning = 0;
  let active = -1;
  let caption = -1;
  let captionTime = 0;
  let clock = 0;

  function nearest() {
    let result = -1;
    stations.forEach((value, i) => {
      if (!found.has(i) && (result < 0 || Math.abs(dial - value) < Math.abs(dial - stations[result]))) result = i;
    });
    return result;
  }

  function update(dt) {
    if (round.done) return;
    clock += dt;
    if (captionTime > 0) {
      captionTime = Math.max(0, captionTime - dt);
      if (captionTime === 0 && found.size === stations.length) round.finish(true, 'Três vozes do bairro no ar!');
      return;
    }
    battery -= dt;
    if (battery <= 0) return round.finish(false, 'A pilha acabou com ' + found.size + '/3 estações.');
    const direction = Number(held.has('right')) - Number(held.has('left'));
    dial = clamp(dial + direction * dt * 0.31, 0, 1);
    const close = nearest();
    if (close !== active) tuning = 0;
    active = close;
    if (close < 0 || Math.abs(stations[close] - dial) > radius || direction) {
      tuning = 0;
      return;
    }
    tuning += dt;
    if (tuning < 0.58) return;
    found.add(close);
    caption = close;
    captionTime = 2.2;
    tuning = 0;
    active = -1;
    api.tone?.(songs[close], 0.18);
  }

  function draw(ctx) {
    const plum = '#342137', ink = '#411c31', ochre = '#d99424', trim = '#ad442b', ivory = '#f8e7bc';
    rect(ctx, plum, 0, 0, 96, 96);
    for (let s = 0; s < 13; s++) rect(ctx, ivory, 23 + s, 28 - s, 2, 2);
    rect(ctx, ivory, 23, 28, 2, 6);
    rect(ctx, trim, 13, 33, 70, 44);
    rect(ctx, trim, 11, 36, 74, 38);
    rect(ctx, ochre, 15, 37, 66, 35);
    rect(ctx, ochre, 13, 39, 70, 30);
    rect(ctx, ivory, 18, 40, 60, 11);
    for (let k = 0; k <= 10; k++) {
      const h = k % 2 === 0 ? 5 : 3;
      rect(ctx, ink, 19 + k * 5.6, 50 - h, 1, h);
    }
    // O ponteiro e a lâmpada são duas pistas visuais para a mesma frequência.
    rect(ctx, '#d34532', 19 + dial * 56, 43, 2, 8);
    const close = nearest();
    const distance = close >= 0 ? Math.abs(dial - stations[close]) : 1;
    const blink = distance < 0.15 && Math.floor(clock * (4 + 14 * (1 - distance / 0.15))) % 2 === 0;
    const lit = captionTime > 0 || distance <= radius || blink;
    rect(ctx, lit ? '#ff6539' : trim, 74, 41, 3, 2);
    for (let k = 0; k < 4; k++) rect(ctx, ink, 18, 55 + k * 4, 27, 2);
    rect(ctx, ink, 61, 56, 9, 13);
    rect(ctx, ink, 59, 58, 13, 9);
    rect(ctx, ochre, 60 + Math.round(dial * 9), 59, 2, 2);
    for (let k = 0; k < stations.length; k++) {
      rect(ctx, found.has(k) ? ivory : trim, 48 + k * 3, 67, 2, 2);
    }
  }

  return {
    draw, update,
    press(dir) { if (dir === 'left' || dir === 'right') held.add(dir); },
    release(dir) { held.delete(dir); },
    point(x, y, phase) {
      if ((phase === 'down' || phase === 'move') && captionTime <= 0) dial = clamp((x - 19) / 56, 0, 1);
    },
    hud() { return captionTime > 0 ? '“' + news[caption] + '”' : found.size + '/3 estações · Pilha ' + Math.max(0, Math.ceil(battery)) + 's'; }
  };
}

const eggOutline = [
  '...bbbb....', '..bbbbbb...', '.bbbbbbbb..', 'bbbbbbbbbb.',
  'bbbbbbbbbb.', 'bbbbbbbbbbb', 'bbbbbbbbbbb', 'bbbbbbbbbb.',
  '.bbbbbbbbb.', '.bbbbbbbb..', '..bbbbbb...', '...bbbb....'
];

const breadOutline = [
  '..bbbbbbb..', '.bbbbbbbbb.', 'bbbbbbbbbbb', 'bbbbbbbbbbb',
  '.bbbbbbbbb.', '.bbbbbbbbb.', '.bbbbbbbbb.', '.bbbbbbbbb.',
  '.bbbbbbbbb.', '.bbbbbbbbb.', '.bbbbbbbbb.', '..bbbbbbb..'
];

// Tempos em segundos: preparo, janela no ponto e aviso tostado antes de queimar.
const ritmosChapa = [
  {preparo: 4.6, ponto: 2.8, tostado: 1.2},
  {preparo: 3.5, ponto: 1.9, tostado: 0.9},
  {preparo: 2.6, ponto: 1.3, tostado: 0.7}
];

function pao(level, api, options = {}) {
  const round = roundEnd(api), ritmo = ritmosChapa[level - 1];
  const infinito = options.mode === 'endless';
  const metas = {ovo: level + 2, pao: level + 2};
  const entregues = {ovo: 0, pao: 0};
  // A identidade e o relógio pertencem ao alimento, nunca ao lado da chapa.
  const alimentos = [
    {tipo: 'ovo', idade: 0, reposicao: 0},
    {tipo: 'pao', idade: 1.2, reposicao: 0}
  ];
  let lados = [0, 1], utensilio = 'espatula';
  let servidos = 0, erros = 0, reposicoes = 0, restante = 60;
  let troca = 0, aviso = '', avisoTempo = 0;
  function estado(alimento) {
    const preparo = ritmo.preparo + (alimento.tipo === 'ovo' ? 0.35 : 0);
    if (alimento.idade < preparo) return 0;
    if (alimento.idade < preparo + ritmo.ponto) return 1;
    if (alimento.idade < preparo + ritmo.ponto + ritmo.tostado) return 2;
    return 3;
  }
  function informar(texto) { aviso = texto; avisoTempo = 1.2; }
  function errar(texto) {
    erros++;
    informar(texto);
    api.tone?.(155, 0.09);
    if (erros >= 3) round.finish(false, 'Três erros na chapa. Tente novamente!');
  }
  function repor(alimento) {
    alimento.idade = 0;
    alimento.reposicao = 0;
    reposicoes++;
    // A cada duas reposições, mudam os lados, não as identidades/idades.
    // A pausa sinalizada dá tempo de perceber a troca sem perder o ponto.
    if (reposicoes % 2 === 0) { lados.reverse(); troca = 0.75; }
  }
  function servir(lado) {
    if (round.done || troca > 0) return;
    const alimento = alimentos[lados[lado]], ponto = estado(alimento);
    if (alimento.reposicao > 0) return;
    if (utensilio !== (alimento.tipo === 'ovo' ? 'espatula' : 'pinca')) {
      errar('Utensílio errado!');
      if (!round.done) repor(alimento);
      return;
    }
    // Retirar cru não cria um terceiro tipo de erro: apenas aguarda o ponto.
    if (ponto === 0) { informar('Ainda cru: espere dourar.'); return; }
    if (ponto === 3) return;
    servidos++;
    entregues[alimento.tipo]++;
    informar(ponto === 1 ? 'No ponto!' : 'Tostado, a tempo!');
    api.tone?.(540, 0.09);
    if (!infinito && entregues.ovo >= metas.ovo && entregues.pao >= metas.pao) {
      round.finish(true, servidos + ' alimentos servidos antes de queimar!');
      return;
    }
    repor(alimento);
  }
  function avancar(dt) {
    if (troca > 0) { troca = Math.max(0, troca - dt); return; }
    if (!infinito) restante = Math.max(0, restante - dt);
    avisoTempo = Math.max(0, avisoTempo - dt);
    for (const alimento of alimentos) {
      if (alimento.reposicao > 0) {
        alimento.reposicao = Math.max(0, alimento.reposicao - dt);
        if (alimento.reposicao === 0) repor(alimento);
      } else {
        // O desafio cresce devagar e tem teto; a janela mínima continua legível.
        alimento.idade += dt * (infinito ? Math.min(1.25, 1 + servidos * 0.003) : 1);
        if (estado(alimento) === 3) {
          // Marca o queimado antes de contar: uma atualização não cobra de novo.
          alimento.reposicao = 0.85;
          errar(alimento.tipo === 'ovo' ? 'O ovo queimou!' : 'O pão queimou!');
          if (round.done) return;
        }
      }
    }
    if (!infinito && restante === 0) round.finish(false, 'O minuto acabou. Complete as metas de ovos e pães.');
  }
  function update(dt) {
    if (round.done || !Number.isFinite(dt) || dt <= 0) return;
    // Passos pequenos mantêm reposições e erros consistentes mesmo em testes longos.
    while (dt > 0 && !round.done) { const passo = Math.min(dt, 0.05); avancar(passo); dt -= passo; }
  }
  function snapshot() {
    return {utensilio, servidos, entregues: {...entregues}, metas: infinito ? null : {...metas}, erros, restantes: 3 - erros, troca: troca > 0, fim: round.done,
      alimentos: lados.map(i => ({tipo: alimentos[i].tipo, estado: estado(alimentos[i]), reposicao: alimentos[i].reposicao > 0}))};
  }
  function draw(ctx) {
    const iron = '#242034', gold = '#e8ad43', crust = '#a9512f';
    rect(ctx, '#b75a40', 0, 0, 96, 96);
    rect(ctx, gold, 43, 8, 11, 3); rect(ctx, gold, 42, 10, 3, 4); rect(ctx, gold, 52, 10, 3, 4);
    rect(ctx, iron, 10, 13, 76, 62); rect(ctx, iron, 8, 16, 80, 56);
    lados.forEach((indice, lado) => {
      const alimento = alimentos[indice], state = estado(alimento), x = 17 + lado * 36, y = 29;
      if (alimento.tipo === 'ovo') {
        sprite(ctx, eggOutline, {b: ['#fff2d7', '#eed8a0', '#d2ad6e', '#906343'][state]}, x, y, 2);
        const yolk = ['#f7c647', gold, '#d59132', '#ad682d'][state];
        rect(ctx, yolk, x + 8, y + 9, 8, 8); rect(ctx, yolk, x + 6, y + 11, 12, 4);
        rect(ctx, '#ffe19a', x + 9, y + 10, 3, 2);
      } else {
        sprite(ctx, breadOutline, {b: crust}, x, y, 2);
        rect(ctx, ['#f9e1b0', gold, '#c88a35', '#75402d'][state], x + 4, y + 4, 14, 17);
        const line = state === 3 ? iron : '#c48343';
        rect(ctx, line, x + 5, y + 8, 5, 2); rect(ctx, line, x + 11, y + 14, 5, 2);
      }
      if (state > 0) {
        const lift = Math.floor(alimento.idade * 2) % 3;
        rect(ctx, '#d7c6b7', x + 9, y - 5 - lift, 2, 3);
        rect(ctx, '#d7c6b7', x + 11, y - 8 - lift, 2, 3);
      }
    });
    // Utensílios em pixel art ao lado da chapa; a seleção também tem contorno.
    for (let i = 0; i < 2; i++) {
      const x = 20 + i * 39;
      if (utensilio === (i === 0 ? 'espatula' : 'pinca')) {
        rect(ctx, '#fff2d7', x - 5, 77, 30, 18); rect(ctx, '#b75a40', x - 3, 79, 26, 14);
      }
      if (i === 0) {
        rect(ctx, gold, x, 86, 10, 3); rect(ctx, '#b9bdc8', x + 9, 82, 12, 8);
        rect(ctx, iron, x + 13, 83, 1, 5); rect(ctx, iron, x + 17, 83, 1, 5);
      } else {
        rect(ctx, gold, x, 85, 6, 4); rect(ctx, '#b9bdc8', x + 5, 82, 15, 2);
        rect(ctx, '#b9bdc8', x + 5, 90, 15, 2); rect(ctx, '#b9bdc8', x + 4, 83, 2, 8);
      }
    }
  }
  return {
    draw, update, snapshot,
    score() { return servidos; },
    selectTool(valor) { if (!round.done && ['espatula', 'pinca'].includes(valor)) utensilio = valor; },
    press(dir) { if (dir === 'left' || dir === 'right') servir(dir === 'left' ? 0 : 1); },
    release() {},
    point(x, y, phase) {
      if (phase !== 'down' || x < 8 || x > 88) return;
      if (y >= 77 && y <= 96) this.selectTool(x < 48 ? 'espatula' : 'pinca');
      else if (y >= 13 && y <= 75) servir(x < 48 ? 0 : 1);
    },
    hud() { return (troca > 0 ? 'Troca de lados! · ' : avisoTempo > 0 ? aviso + ' · ' : '') + (infinito ? servidos + ' alimentos' : 'Ovos ' + entregues.ovo + '/' + metas.ovo + ' · Pães ' + entregues.pao + '/' + metas.pao) + ' · ' + (3 - erros) + ' erros restantes' + (infinito ? '' : ' · ' + Math.ceil(restante) + 's'); }
  };
}

const gardens = [
  ['....P', 'L.L.#', '.#L..', '....#', 'S....'],
  ['..#..P', 'L...#.', '.##L..', '...#..', '.#..L.', 'S....#'],
  ['..#...P', 'L...#..', '.#.#L..', '...#...', '.#...#.', '...#L..', 'S....#.']
];
const directions = {left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1]};
const leaf = ['...gg', '..ggg', '.ggig', 'ggigg', 'gigg.', 'gg...'];
const rock = ['..rr..', '.rrrr.', 'rrrrrr', '.rrrr.'];
const snail = [
  '..sss....e.e', '.saaas...e.e', 'saassas.eeee', 'sas.saseeeee', 'saassaseeee.',
  '.saaassseee.', '..esssseee..', 'eeeeeeeee...'
];

// A prova é uma trilha simples que passa por todas as folhas antes do vaso.
// Assim ela respeita inclusive a restrição de não cruzar o próprio rastro.
export function validarRastro(mapa, solucao) {
  const lado = mapa.length, casas = mapa.join('');
  if (!lado || mapa.some(linha => linha.length !== lado) || [...casas].filter(c => c === 'S').length !== 1 || [...casas].filter(c => c === 'P').length !== 1 || [...casas].filter(c => c === 'L').length !== 3) return false;
  let posicao = casas.indexOf('S'), folhas = 0;
  const visitadas = new Set([posicao]);
  for (const [indice, comando] of solucao.entries()) {
    const vetor = directions[comando];
    if (!vetor) return false;
    const x = posicao % lado + vetor[0], y = Math.floor(posicao / lado) + vetor[1];
    if (x < 0 || y < 0 || x >= lado || y >= lado) return false;
    posicao = y * lado + x;
    if (casas[posicao] === '#' || visitadas.has(posicao)) return false;
    visitadas.add(posicao);
    if (casas[posicao] === 'L') folhas++;
    if (casas[posicao] === 'P' && (folhas !== 3 || indice !== solucao.length - 1)) return false;
  }
  return casas[posicao] === 'P' && folhas === 3;
}

function vizinhosRastro(posicao, lado) {
  return Object.entries(directions).flatMap(([direcao, [dx, dy]]) => {
    const x = posicao % lado + dx, y = Math.floor(posicao / lado) + dy;
    return x >= 0 && y >= 0 && x < lado && y < lado ? [{posicao: y * lado + x, direcao}] : [];
  });
}

// Busca caminhos simples: desfazer passos só remove um sufixo e nunca permite
// manter folhas de um trecho desfeito. Portanto toda vitória tem esta forma.
export function buscarAtalhoRastro(mapa, limite = 21, orcamento = 30000) {
  const lado = mapa.length, casas = mapa.join(''), inicio = casas.indexOf('S'), fim = casas.indexOf('P');
  const folhas = [...casas].flatMap((c, i) => c === 'L' ? [i] : []);
  const adjacencias = Array.from(casas, (_, i) => vizinhosRastro(i, lado).filter(v => casas[v.posicao] !== '#'));
  const distancia = (a, b) => Math.abs(a % lado - b % lado) + Math.abs(Math.floor(a / lado) - Math.floor(b / lado));
  function minimoRestante(posicao, faltam) {
    if (!faltam.length) return distancia(posicao, fim);
    return Math.min(...faltam.map(alvo => distancia(posicao, alvo) + minimoRestante(alvo, faltam.filter(i => i !== alvo))));
  }
  const usadas = new Set([inicio]);
  let nos = 0, esgotado = false;
  function visitar(posicao, faltam, passos) {
    if (++nos > orcamento) { esgotado = true; return false; }
    if (passos + minimoRestante(posicao, faltam) > limite) return false;
    if (posicao === fim) return !faltam.length;
    for (const vizinho of adjacencias[posicao]) {
      const proxima = vizinho.posicao;
      if (usadas.has(proxima) || (proxima === fim && faltam.length)) continue;
      usadas.add(proxima);
      const achou = visitar(proxima, faltam.filter(i => i !== proxima), passos + 1);
      usadas.delete(proxima);
      if (achou) return true;
      if (esgotado) return false;
    }
    return false;
  }
  const encontrado = visitar(inicio, folhas, 0);
  return {encontrado, conclusivo: !esgotado, nos};
}

function reservaRastro(seed) {
  const base = ['#....L.', '...S.#.', '.......', '..L####', '..#####', '#....#P', '#L.#...'];
  const comandos = ['left','left','up','right','right','right','right','right','down','down','left','left','left','left','down','left','up','left','down','down','right','down','down','right','up','right','right','down','right','right','up'];
  const giro = (Number(seed) >>> 0) % 4, espelho = ((Number(seed) >>> 0) & 4) !== 0;
  const transformar = (x, y) => {
    if (espelho) x = 6 - x;
    for (let i = 0; i < giro; i++) [x, y] = [6 - y, x];
    return y * 7 + x;
  };
  const casas = Array(49);
  base.join('').split('').forEach((c, i) => { casas[transformar(i % 7, Math.floor(i / 7))] = c; });
  let pos = base.join('').indexOf('S');
  const trajeto = [transformar(pos % 7, Math.floor(pos / 7))];
  for (const comando of comandos) {
    const [dx, dy] = directions[comando]; pos += dx + dy * 7;
    trajeto.push(transformar(pos % 7, Math.floor(pos / 7)));
  }
  const mapa = Array.from({length: 7}, (_, y) => casas.slice(y * 7, y * 7 + 7).join(''));
  const solucao = trajeto.slice(1).map((casa, i) => vizinhosRastro(trajeto[i], 7).find(v => v.posicao === casa).direcao);
  if (!validarRastro(mapa, solucao)) throw new Error('Reserva inválida de Rastro.');
  return {mapa, solucao, bifurcacoes: 17, minimoPassos: 22, fallback: true};
}

export function gerarRastro(seed = 1) {
  let estado = Number(seed) >>> 0;
  const aleatorio = () => {
    estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
  const lado = 7;
  // Um certificado longo não basta: o solver também rejeita soluções curtas.
  for (let tentativa = 0; tentativa < 96; tentativa++) {
    const trilha = [Math.floor(aleatorio() * 49)], usadas = new Set(trilha);
    const tamanho = 27 + Math.floor(aleatorio() * 8);
    while (trilha.length < tamanho) {
      const vizinhas = vizinhosRastro(trilha.at(-1), lado).filter(v => !usadas.has(v.posicao));
      if (!vizinhas.length) break;
      const proxima = vizinhas[Math.floor(aleatorio() * vizinhas.length)].posicao;
      trilha.push(proxima); usadas.add(proxima);
    }
    if (trilha.length < tamanho) continue;
    const casas = Array.from({length: 49}, (_, i) => usadas.has(i) || aleatorio() < 0.12 ? '.' : '#');
    casas[trilha[0]] = 'S'; casas[trilha.at(-1)] = 'P';
    for (const fracao of [0.25, 0.5, 0.75]) casas[trilha[Math.floor((trilha.length - 1) * fracao)]] = 'L';
    const bifurcacoes = casas.filter((c, i) => c !== '#' && vizinhosRastro(i, lado).filter(v => casas[v.posicao] !== '#').length >= 3).length;
    if (bifurcacoes < 6) continue;
    const mapa = Array.from({length: lado}, (_, y) => casas.slice(y * lado, (y + 1) * lado).join(''));
    const solucao = trilha.slice(1).map((casa, i) => vizinhosRastro(trilha[i], lado).find(v => v.posicao === casa).direcao);
    if (!validarRastro(mapa, solucao)) continue;
    const atalho = buscarAtalhoRastro(mapa);
    if (!atalho.conclusivo || atalho.encontrado) continue;
    return {mapa, solucao, bifurcacoes, minimoPassos: 22, fallback: false};
  }
  return reservaRastro(seed);
}

function rastro(level, api, options = {}) {
  const gerado = options.mode === 'generated' ? gerarRastro(options.seed) : null;
  const maze = gerado ? gerado.mapa : gardens[level - 1], side = maze.length, tiles = maze.join('');
  const round = roundEnd(api);
  const path = [tiles.indexOf('S')], walked = new Set(path), leaves = new Set();
  let held = '', repeatIn = 0;
  function step(dir) {
    if (round.done || !directions[dir]) return;
    const position = path[path.length - 1], [dx, dy] = directions[dir];
    const x = position % side + dx, y = Math.floor(position / side) + dy;
    if (x < 0 || x >= side || y < 0 || y >= side) return;
    const next = y * side + x;
    if (next === path[path.length - 2]) {
      walked.delete(path.pop());
      leaves.delete(position);
      return;
    }
    if (tiles[next] === '#' || walked.has(next) || (tiles[next] === 'P' && leaves.size < 3)) return;
    path.push(next);
    walked.add(next);
    if (tiles[next] === 'L') {
      leaves.add(next);
      api.tone?.(370 + leaves.size * 65, 0.09);
    }
    if (tiles[next] === 'P') round.finish(true, 'Três folhas e um cantinho no vaso.');
  }
  const tamanhoCelula = Math.floor(94 / side), margem = Math.floor((96 - tamanhoCelula * side) / 2);
  let gesto = null;
  function celula(x, y) {
    const coluna = Math.floor((x - margem) / tamanhoCelula), linha = Math.floor((y - margem) / tamanhoCelula);
    return coluna >= 0 && linha >= 0 && coluna < side && linha < side ? linha * side + coluna : -1;
  }
  function point(x, y, phase) {
    if (phase === 'cancel') { gesto = null; return; }
    if (!Number.isFinite(x) || !Number.isFinite(y) || round.done) { gesto = null; return; }
    if (phase === 'down') {
      held = '';
      gesto = celula(x, y) === path.at(-1) ? {x, y} : null;
      return;
    }
    if (!gesto || !['move', 'up'].includes(phase)) return;
    const origem = gesto, dx = x - origem.x, dy = y - origem.y;
    let coluna = Math.floor((origem.x - margem) / tamanhoCelula), linha = Math.floor((origem.y - margem) / tamanhoCelula);
    const sx = Math.sign(dx), sy = Math.sign(dy);
    // DDA percorre cada fronteira de célula na ordem do segmento recebido.
    // Não depende da frequência dos eventos nem teletransporta através de pedra.
    let tx = sx ? (margem + (coluna + (sx > 0 ? 1 : 0)) * tamanhoCelula - origem.x) / dx : Infinity;
    let ty = sy ? (margem + (linha + (sy > 0 ? 1 : 0)) * tamanhoCelula - origem.y) / dy : Infinity;
    const incrementoX = sx ? tamanhoCelula / Math.abs(dx) : Infinity;
    const incrementoY = sy ? tamanhoCelula / Math.abs(dy) : Infinity;
    for (let cruzamentos = 0; cruzamentos < side * 2 + 2 && Math.min(tx, ty) <= 1; cruzamentos++) {
      let direcao;
      if (tx <= ty) { coluna += sx; tx += incrementoX; direcao = sx > 0 ? 'right' : 'left'; }
      else { linha += sy; ty += incrementoY; direcao = sy > 0 ? 'down' : 'up'; }
      if (coluna < 0 || linha < 0 || coluna >= side || linha >= side) { gesto = null; return; }
      const destino = linha * side + coluna;
      step(direcao);
      if (path.at(-1) !== destino) { gesto = null; return; }
      if (round.done) break;
    }
    gesto = phase === 'up' || round.done ? null : {x, y};
  }
  function update(dt) {
    if (held && !round.done) {
      repeatIn -= dt;
      if (repeatIn <= 0) { step(held); repeatIn = 0.23; }
    }
  }
  function draw(ctx) {
    const size = Math.floor(94 / side), border = Math.floor((96 - size * side) / 2);
    const tileCenter = index => [border + (index % side) * size + Math.floor(size / 2),
      border + Math.floor(index / side) * size + Math.floor(size / 2)];
    const clay = '#bf7b7f', peach = '#eda485', green = '#a5c38c', deep = '#456c59', cream = '#cbd7d6';
    rect(ctx, '#995e61', 0, 0, 96, 96);
    for (let i = 0; i < tiles.length; i++) {
      const col = i % side, row = Math.floor(i / side);
      rect(ctx, (col + row) % 2 ? clay : peach, border + col * size, border + row * size, size - 1, size - 1);
      const [x,y] = tileCenter(i);
      if (tiles[i] === 'L' && !leaves.has(i)) sprite(ctx, leaf, {g: green, i: deep}, x - 3, y - 3);
      if (tiles[i] === '#') sprite(ctx, rock, {r: '#526463'}, x - 3, y - 2);
      if (tiles[i] === 'P') {
        sprite(ctx, ['..rrr...', '.rrbbbb.', 'arrbbbbb','aaarrbbb','aaaarrb.', '.aaar...','..aa....'],
          {a: '#404e48', b: '#b45e44', r: '#d97d55'}, x - 4, y - 3);
      }
    }
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = tileCenter(path[i - 1]), [bx, by] = tileCenter(path[i]);
      rect(ctx, cream, Math.min(ax, bx) - 1, Math.min(ay, by) - 1, Math.abs(ax - bx) + 2, Math.abs(ay - by) + 2);
    }
    const pos = path[path.length - 1], [x,y] = tileCenter(pos);
    const palette = {s: '#a94f36', a: '#efd0a0', e: '#466653'};
    const prev = path[path.length - 2];
    if (prev !== undefined && pos % side < prev % side) {
      ctx.save(); ctx.translate(x + 6, y - 4); ctx.scale(-1, 1);
      sprite(ctx, snail, palette, 0, 0); ctx.restore();
    } else {
      sprite(ctx, snail, palette, x - 6, y - 4);
    }
  }
  return {
    draw, update, point,
    cancelInput() { held = ''; gesto = null; },
    snapshot() { return {mapa: [...maze], caminho: [...path], folhas: leaves.size, solucao: gerado ? [...gerado.solucao] : null, fim: round.done}; },
    press(dir) { if (directions[dir]) { gesto = null; step(dir); held = dir; repeatIn = 0.37; } },
    release(dir) { if (dir === held) held = ''; },
    hud() { return leaves.size + '/3 folhas · ' + (leaves.size === 3 ? 'Entre no vaso' : 'Recolha as folhas'); }
  };
}

export const esquina = {radio, pao, rastro};

