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

const breadOutline = [
  '...bbbb....', '..bbbbbb...', '.bbbbbbbb..', 'bbbbbbbbbb.',
  'bbbbbbbbbb.', 'bbbbbbbbbbb', 'bbbbbbbbbbb', 'bbbbbbbbbb.',
  '.bbbbbbbbb.', '.bbbbbbbb..', '..bbbbbb...', '...bbbb....'
];

function pao(level, api) {
  const round = roundEnd(api);
  const goals = [5, 7, 9];
  const target = goals[level - 1];
  const window = [3.4, 2.6, 1.9][level - 1];
  const age = [0, 1.65];
  const ready = [4.4, 3.65];
  let served = 0, baked = 0, remaining = 60, flash = 0, spatulaSide = 1;
  let last = '';
  function stage(i) {
    if (age[i] < ready[i]) return 0;
    return age[i] < ready[i] + window ? 1 : 2;
  }
  function serve(i) {
    if (round.done) return;
    const current = stage(i);
    if (current === 1) served++;
    last = ['Ainda cru', 'No ponto!', 'Passou do ponto'][current];
    flash = 0.78;
    spatulaSide = i;
    age[i] = 0;
    baked++;
    ready[i] = 3.2 + ((baked * 7 + i * 3) % 8) * 0.25;
    api.tone?.(current === 1 ? 540 : 155, 0.09);
  }
  function update(dt) {
    if (round.done) return;
    age[0] += dt;
    age[1] += dt;
    remaining = Math.max(0, remaining - dt);
    flash = Math.max(0, flash - dt);
    if (remaining === 0) round.finish(served >= target, served + ' pães no ponto em um minuto.');
  }
  function draw(ctx) {
    const iron = '#242034', gold = '#e8ad43', crust = '#a9512f', counter = '#b75a40';
    rect(ctx, counter, 0, 0, 96, 96);
    rect(ctx, gold, 43, 8, 11, 3); rect(ctx, gold, 42, 10, 3, 4); rect(ctx, gold, 52, 10, 3, 4);
    rect(ctx, iron, 10, 13, 76, 62); rect(ctx, iron, 8, 16, 80, 56);
    for (let i = 0; i < 2; i++) {
      const state = stage(i), x = 17 + i * 36, y = 29 + i;
      const surface = ['#f9e1b0', gold, '#75402d'][state];
      sprite(ctx, breadOutline, {b: surface}, x, y, 2);
      if (state === 0) {
        rect(ctx, '#f7c647', x + 9, y + 10, 5, 4);
        rect(ctx, '#f7c647', x + 8, y + 12, 7, 2);
      } else {
        const line = state === 1 ? crust : iron;
        rect(ctx, line, x + 4, y + 9, 5, 2); rect(ctx, line, x + 8, y + 7, 4, 2);
        rect(ctx, line, x + 10, y + 16, 4, 2); rect(ctx, line, x + 13, y + 14, 4, 2);
        const lift = Math.floor(age[i] * 2) % 3;
        rect(ctx, '#d7c6b7', x + 9, y - 5 - lift, 2, 3);
        rect(ctx, '#d7c6b7', x + 11, y - 8 - lift, 2, 3);
      }
    }
    const x = flash > 0 ? 18 + spatulaSide * 36 : 59;
    const y = flash > 0 ? 55 : 77;
    rect(ctx, gold, x - 9, y + 6, 13, 3);
    rect(ctx, '#a5a3a7', x + 4, y + 3, 8, 4);
    rect(ctx, '#a5a3a7', x + 11, y, 11, 8);
    rect(ctx, '#656271', x + 14, y + 2, 1, 4); rect(ctx, '#656271', x + 18, y + 2, 1, 4);
  }
  return {
    draw, update,
    press(dir) { if (dir === 'left' || dir === 'right') serve(dir === 'left' ? 0 : 1); },
    release() {},
    point(x, y, phase) { if (phase === 'down' && y >= 13 && y <= 75) serve(x < 48 ? 0 : 1); },
    hud() { return (flash > 0 ? last + ' · ' : '') + served + '/' + target + ' · ' + Math.ceil(remaining) + 's'; }
  };
}

function balsa(level, api) {
  const round = roundEnd(api);
  const held = new Set();
  const left = 11, right = 85, cable = 61;
  let x = left, trips = 0, elapsed = 0, bump = 0;
  const speed = [10, 13, 16][level - 1];
  const logs = [
    {x:36, phase:5}, {x:63, phase:64}, {x:46, phase:90}
  ].slice(0, level === 1 ? 2 : 3);
  const logY = log => ((elapsed * speed + log.phase) % 110) - 8;
  const origin = () => trips % 2 === 0 ? left : right;
  function update(dt) {
    if (round.done) return;
    elapsed += dt;
    if (bump > 0) {
      bump = Math.max(0, bump - dt);
      return;
    }
    const direction = Number(held.has('right')) - Number(held.has('left'));
    x = clamp(x + direction * 23 * dt, left, right);
    if (logs.some(log => Math.abs(x - log.x) < 10 && Math.abs(cable - logY(log)) < 5)) {
      x = origin();
      bump = 0.65;
      api.tone?.(110, 0.14);
      return;
    }
    if ((trips % 2 === 0 && x === right) || (trips % 2 === 1 && x === left)) {
      trips++;
      api.tone?.(410, 0.12);
      if (trips === 3) round.finish(true, 'Os três passageiros chegaram!');
    }
  }
  const passenger = ['.hh.', '.hh.', 'ssss', '.ss.'];
  function draw(ctx) {
    const river = '#137e86', shore = '#9fb85e', wood = '#95542e', dark = '#412e29', cream = '#ffedc8';
    rect(ctx, river, 0, 0, 96, 96);
    rect(ctx, shore, 0, 0, 12, 96); rect(ctx, shore, 9, 22, 5, 31);
    rect(ctx, shore, 84, 0, 12, 96); rect(ctx, shore, 82, 50, 3, 36);
    rect(ctx, dark, 10, cable, 76, 1);
    for (const dock of [4, 82]) {
      rect(ctx, dark, dock + 2, cable, 2, 6); rect(ctx, dark, dock + 8, cable, 2, 6);
      rect(ctx, wood, dock, cable - 2, 11, 5);
    }
    for (const log of logs) {
      const y = Math.floor(logY(log)), lx = log.x - 5;
      rect(ctx, dark, lx, y, 11, 3);
      rect(ctx, dark, lx + 7, y - 2, 3, 2);
      rect(ctx, cream, lx + 1, y - 2, 3, 1);
    }
    const riderX = x - 2;
    sprite(ctx, passenger, {h: dark, s: cream}, origin() === left ? 86 : 5, cable - 7);
    rect(ctx, dark, x - 6, cable - 1, 12, 6);
    rect(ctx, wood, x - 5, cable, 10, 2); rect(ctx, wood, x - 6, cable + 3, 12, 2);
    sprite(ctx, passenger, {h: dark, s: '#edb240'}, riderX, cable - 4);
    for (const wave of [[24, 13], [62, 78], [73, 34]]) {
      const y = (wave[1] + Math.floor(elapsed * 2)) % 96;
      rect(ctx, '#82bfae', wave[0], y, 3, 1); rect(ctx, '#82bfae', wave[0] + 3, y + 1, 2, 1);
    }
  }
  return {
    draw, update,
    press(dir) { if (dir === 'left' || dir === 'right') held.add(dir); },
    release(dir) { held.delete(dir); },
    hud() { return trips + '/3 travessias · ' + (bump > 0 ? 'Tronco! Volte ao cais' : trips % 2 === 0 ? 'Destino →' : 'Destino ←'); }
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
function rastro(level, api) {
  const maze = gardens[level - 1], side = maze.length, tiles = maze.join('');
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
    draw, update,
    press(dir) { if (directions[dir]) { step(dir); held = dir; repeatIn = 0.37; } },
    release(dir) { if (dir === held) held = ''; },
    hud() { return leaves.size + '/3 folhas · ' + (leaves.size === 3 ? 'Entre no vaso' : 'Recolha as folhas'); }
  };
}

export const esquina = {radio, pao, balsa, rastro};
